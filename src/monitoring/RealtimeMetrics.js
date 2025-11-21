/**
 * Sistema de Métricas de Performance em Tempo Real
 * Coleta, processa e disponibiliza métricas de performance continuamente
 */

import structuredLogger from './StructuredLogger.js';

class RealtimeMetrics {
    constructor() {
        this.metrics = new Map();
        this.collectors = new Map();
        this.subscribers = new Map();
        this.config = {
            collectionInterval: 1000, // 1 segundo
            retentionPeriod: 300000, // 5 minutos
            maxDataPoints: 300,
            enableAutoCollection: true,
            enableWebVitals: true,
            enableCustomMetrics: true,
            enableResourceTiming: true,
        };

        this.metricTypes = {
            COUNTER: 'counter',
            GAUGE: 'gauge',
            HISTOGRAM: 'histogram',
            TIMER: 'timer',
        };

        this.webVitalsMetrics = {
            FCP: 'first-contentful-paint',
            LCP: 'largest-contentful-paint',
            FID: 'first-input-delay',
            CLS: 'cumulative-layout-shift',
            TTFB: 'time-to-first-byte',
        };

        this._initializeMetrics();

        if (this.config.enableAutoCollection) {
            this._startAutoCollection();
        }

        if (this.config.enableWebVitals) {
            this._setupWebVitals();
        }
    }

    /**
     * Registra uma nova métrica
     * @param {string} name - Nome da métrica
     * @param {string} type - Tipo da métrica (counter, gauge, histogram, timer)
     * @param {Object} options - Opções da métrica
     */
    registerMetric(name, type, options = {}) {
        const {
            description = '',
            unit = '',
            tags = {},
            buckets = null, // Para histogramas
            aggregation = 'avg', // avg, sum, min, max, count
        } = options;

        this.metrics.set(name, {
            name,
            type,
            description,
            unit,
            tags,
            buckets,
            aggregation,
            values: [],
            lastValue: null,
            lastUpdated: null,
            stats: {
                count: 0,
                sum: 0,
                min: Infinity,
                max: -Infinity,
                avg: 0,
            },
        });

        structuredLogger.debug(
            'Metric registered',
            {
                name,
                type,
                description,
            },
            {
                category: 'metrics',
                tags: ['registration'],
            }
        );
    }

    /**
     * Incrementa um contador
     * @param {string} name - Nome do contador
     * @param {number} value - Valor a incrementar (padrão: 1)
     * @param {Object} tags - Tags adicionais
     */
    incrementCounter(name, value = 1, tags = {}) {
        this._ensureMetricExists(name, this.metricTypes.COUNTER);
        const metric = this.metrics.get(name);

        const newValue = (metric.lastValue || 0) + value;
        this._updateMetric(name, newValue, tags);
    }

    /**
     * Define valor de um gauge
     * @param {string} name - Nome do gauge
     * @param {number} value - Valor atual
     * @param {Object} tags - Tags adicionais
     */
    setGauge(name, value, tags = {}) {
        this._ensureMetricExists(name, this.metricTypes.GAUGE);
        this._updateMetric(name, value, tags);
    }

    /**
     * Registra valor em histograma
     * @param {string} name - Nome do histograma
     * @param {number} value - Valor a registrar
     * @param {Object} tags - Tags adicionais
     */
    recordHistogram(name, value, tags = {}) {
        this._ensureMetricExists(name, this.metricTypes.HISTOGRAM);
        this._updateMetric(name, value, tags);
    }

    /**
     * Inicia timer
     * @param {string} name - Nome do timer
     * @param {Object} tags - Tags adicionais
     * @returns {Function} Função para parar o timer
     */
    startTimer(name, tags = {}) {
        const startTime = performance.now();

        return () => {
            const duration = performance.now() - startTime;
            this._ensureMetricExists(name, this.metricTypes.TIMER);
            this._updateMetric(name, duration, tags);
            return duration;
        };
    }

    /**
     * Mede duração de uma função
     * @param {string} name - Nome da métrica
     * @param {Function} fn - Função a medir
     * @param {Object} tags - Tags adicionais
     * @returns {Promise|any} Resultado da função
     */
    async measureFunction(name, fn, tags = {}) {
        const stopTimer = this.startTimer(name, tags);

        try {
            const result = await fn();
            const duration = stopTimer();

            // Registrar sucesso
            this.incrementCounter(`${name}_success`, 1, tags);

            return result;
        } catch (error) {
            const duration = stopTimer();

            // Registrar erro
            this.incrementCounter(`${name}_error`, 1, { ...tags, error: error.message });

            throw error;
        }
    }

    /**
     * Obtém valor atual de uma métrica
     * @param {string} name - Nome da métrica
     * @returns {*} Valor atual
     */
    getCurrentValue(name) {
        const metric = this.metrics.get(name);
        return metric ? metric.lastValue : null;
    }

    /**
     * Obtém estatísticas de uma métrica
     * @param {string} name - Nome da métrica
     * @param {Object} options - Opções de agregação
     * @returns {Object} Estatísticas
     */
    getMetricStats(name, options = {}) {
        const metric = this.metrics.get(name);
        if (!metric) return null;

        const { timeRange = this.config.retentionPeriod, aggregation = metric.aggregation } =
            options;

        const now = Date.now();
        const cutoff = now - timeRange;

        const recentValues = metric.values.filter((v) => v.timestamp >= cutoff);

        if (recentValues.length === 0) {
            return { count: 0, value: null };
        }

        const values = recentValues.map((v) => v.value);
        const stats = {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            median: this._calculateMedian(values),
            p95: this._calculatePercentile(values, 95),
            p99: this._calculatePercentile(values, 99),
            latest: values[values.length - 1],
            trend: this._calculateTrend(recentValues),
        };

        return stats;
    }

    /**
     * Obtém todas as métricas atuais
     * @param {Object} filters - Filtros a aplicar
     * @returns {Object} Todas as métricas
     */
    getAllMetrics(filters = {}) {
        const result = {};

        for (const [name, metric] of this.metrics.entries()) {
            // Aplicar filtros
            if (filters.type && metric.type !== filters.type) continue;
            if (filters.tags) {
                const hasAllTags = Object.entries(filters.tags).every(
                    ([key, value]) => metric.tags[key] === value
                );
                if (!hasAllTags) continue;
            }

            result[name] = {
                type: metric.type,
                description: metric.description,
                unit: metric.unit,
                tags: metric.tags,
                currentValue: metric.lastValue,
                lastUpdated: metric.lastUpdated,
                stats: this.getMetricStats(name),
            };
        }

        return result;
    }

    /**
     * Subscreve a atualizações de métricas
     * @param {string|Array} metricNames - Nome(s) das métricas
     * @param {Function} callback - Callback para atualizações
     * @param {Object} options - Opções da subscrição
     * @returns {string} ID da subscrição
     */
    subscribe(metricNames, callback, options = {}) {
        const {
            interval = 1000,
            threshold = null, // Só notificar se mudança > threshold
            aggregation = 'latest',
        } = options;

        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const names = Array.isArray(metricNames) ? metricNames : [metricNames];

        this.subscribers.set(subscriptionId, {
            metricNames: names,
            callback,
            interval,
            threshold,
            aggregation,
            lastNotified: {},
            intervalId: null,
        });

        // Configurar notificações periódicas
        const subscription = this.subscribers.get(subscriptionId);
        subscription.intervalId = setInterval(() => {
            this._notifySubscriber(subscriptionId);
        }, interval);

        return subscriptionId;
    }

    /**
     * Remove subscrição
     * @param {string} subscriptionId - ID da subscrição
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscribers.get(subscriptionId);
        if (subscription && subscription.intervalId) {
            clearInterval(subscription.intervalId);
        }
        this.subscribers.delete(subscriptionId);
    }

    /**
     * Registra coletor customizado de métricas
     * @param {string} name - Nome do coletor
     * @param {Function} collector - Função coletora
     * @param {number} interval - Intervalo de coleta em ms
     */
    registerCollector(name, collector, interval = 5000) {
        if (this.collectors.has(name)) {
            clearInterval(this.collectors.get(name).intervalId);
        }

        const intervalId = setInterval(async () => {
            try {
                const metrics = await collector();
                if (metrics && typeof metrics === 'object') {
                    Object.entries(metrics).forEach(([metricName, value]) => {
                        this.setGauge(`${name}.${metricName}`, value, { collector: name });
                    });
                }
            } catch (error) {
                structuredLogger.error('Collector error', error, {
                    category: 'metrics',
                    collector: name,
                });
            }
        }, interval);

        this.collectors.set(name, {
            name,
            collector,
            interval,
            intervalId,
        });
    }

    /**
     * Obtém snapshot das métricas para dashboard
     * @returns {Object} Snapshot das métricas
     */
    getDashboardSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            system: this._getSystemMetrics(),
            performance: this._getPerformanceMetrics(),
            business: this._getBusinessMetrics(),
            errors: this._getErrorMetrics(),
            webVitals: this._getWebVitalsMetrics(),
        };

        return snapshot;
    }

    /**
     * Exporta métricas em formato Prometheus
     * @returns {string} Métricas em formato Prometheus
     */
    exportPrometheusFormat() {
        let output = '';

        for (const [name, metric] of this.metrics.entries()) {
            const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');
            const stats = this.getMetricStats(name);

            if (!stats || stats.count === 0) continue;

            // HELP
            if (metric.description) {
                output += `# HELP ${sanitizedName} ${metric.description}\n`;
            }

            // TYPE
            const promType = this._getPrometheusType(metric.type);
            output += `# TYPE ${sanitizedName} ${promType}\n`;

            // VALUE
            const tags = this._formatPrometheusTags(metric.tags);
            output += `${sanitizedName}${tags} ${stats.latest || 0}\n`;

            output += '\n';
        }

        return output;
    }

    /**
     * Limpa dados antigos
     */
    cleanup() {
        const now = Date.now();
        const cutoff = now - this.config.retentionPeriod;

        for (const metric of this.metrics.values()) {
            metric.values = metric.values.filter((v) => v.timestamp >= cutoff);
        }

        structuredLogger.debug(
            'Metrics cleanup completed',
            {
                totalMetrics: this.metrics.size,
                cutoffTime: new Date(cutoff).toISOString(),
            },
            {
                category: 'metrics',
                tags: ['cleanup'],
            }
        );
    }

    // Métodos privados
    _initializeMetrics() {
        // Métricas básicas do sistema
        this.registerMetric('system.memory.used', this.metricTypes.GAUGE, {
            description: 'Memory usage in MB',
            unit: 'MB',
        });

        this.registerMetric('system.cpu.usage', this.metricTypes.GAUGE, {
            description: 'CPU usage percentage',
            unit: '%',
        });

        this.registerMetric('performance.page.load_time', this.metricTypes.TIMER, {
            description: 'Page load time',
            unit: 'ms',
        });

        this.registerMetric('user.interactions', this.metricTypes.COUNTER, {
            description: 'User interactions count',
        });

        this.registerMetric('errors.total', this.metricTypes.COUNTER, {
            description: 'Total errors count',
        });
    }

    _startAutoCollection() {
        // Coleta automática de métricas do sistema
        setInterval(() => {
            this._collectSystemMetrics();
            this._collectPerformanceMetrics();
            this._collectResourceMetrics();
            this.cleanup();
        }, this.config.collectionInterval);

        // Coleta de métricas de interação do usuário
        this._setupUserInteractionTracking();
    }

    _collectSystemMetrics() {
        // Memória
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1048576;
            this.setGauge('system.memory.used', memoryMB);
        }

        // CPU (estimativa baseada em timing)
        const cpuUsage = this._estimateCPUUsage();
        this.setGauge('system.cpu.usage', cpuUsage);

        // Conectividade
        this.setGauge('system.online', navigator.onLine ? 1 : 0);

        // Conexão de rede
        if (navigator.connection) {
            this.setGauge('network.downlink', navigator.connection.downlink || 0);
            this.setGauge('network.rtt', navigator.connection.rtt || 0);
        }
    }

    _collectPerformanceMetrics() {
        // Timing de navegação
        if (performance.timing) {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            if (loadTime > 0) {
                this.setGauge('performance.page.load_time', loadTime);
            }
        }

        // FPS (estimativa)
        this._measureFPS();
    }

    _collectResourceMetrics() {
        if (!this.config.enableResourceTiming) return;

        const resources = performance.getEntriesByType('resource');
        const recentResources = resources.filter(
            (r) => r.startTime > Date.now() - this.config.collectionInterval
        );

        recentResources.forEach((resource) => {
            const duration = resource.responseEnd - resource.startTime;
            this.recordHistogram('resource.load_time', duration, {
                type: resource.initiatorType,
                name: resource.name.split('/').pop(),
            });
        });
    }

    _setupUserInteractionTracking() {
        ['click', 'keydown', 'scroll', 'touchstart'].forEach((eventType) => {
            document.addEventListener(
                eventType,
                () => {
                    this.incrementCounter('user.interactions', 1, { type: eventType });
                },
                { passive: true }
            );
        });
    }

    _setupWebVitals() {
        // Implementação simplificada dos Web Vitals
        // Em produção, usaria biblioteca como web-vitals

        // First Contentful Paint
        if (performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                this.setGauge('webvitals.fcp', fcpEntry.startTime);
            }
        }

        // Largest Contentful Paint (simplificado)
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        this.setGauge('webvitals.lcp', lastEntry.startTime);
                    }
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // PerformanceObserver não suportado
            }
        }
    }

    _ensureMetricExists(name, type) {
        if (!this.metrics.has(name)) {
            this.registerMetric(name, type);
        }
    }

    _updateMetric(name, value, tags = {}) {
        const metric = this.metrics.get(name);
        if (!metric) return;

        const timestamp = Date.now();
        const dataPoint = { value, timestamp, tags };

        // Adicionar ao histórico
        metric.values.push(dataPoint);

        // Manter limite de pontos
        if (metric.values.length > this.config.maxDataPoints) {
            metric.values = metric.values.slice(-this.config.maxDataPoints);
        }

        // Atualizar estatísticas
        metric.lastValue = value;
        metric.lastUpdated = timestamp;
        metric.stats.count++;
        metric.stats.sum += value;
        metric.stats.min = Math.min(metric.stats.min, value);
        metric.stats.max = Math.max(metric.stats.max, value);
        metric.stats.avg = metric.stats.sum / metric.stats.count;

        // Notificar subscribers
        this._notifyMetricUpdate(name, value, tags);
    }

    _notifyMetricUpdate(metricName, value, tags) {
        for (const [subId, subscription] of this.subscribers.entries()) {
            if (subscription.metricNames.includes(metricName)) {
                // Verificar threshold se configurado
                if (subscription.threshold) {
                    const lastValue = subscription.lastNotified[metricName] || 0;
                    if (Math.abs(value - lastValue) < subscription.threshold) {
                        continue;
                    }
                }

                subscription.lastNotified[metricName] = value;

                try {
                    subscription.callback({
                        metricName,
                        value,
                        tags,
                        timestamp: Date.now(),
                    });
                } catch (error) {
                    structuredLogger.error('Subscriber callback error', error, {
                        subscriptionId: subId,
                        metricName,
                    });
                }
            }
        }
    }

    _notifySubscriber(subscriptionId) {
        const subscription = this.subscribers.get(subscriptionId);
        if (!subscription) return;

        const data = {};
        subscription.metricNames.forEach((name) => {
            const stats = this.getMetricStats(name);
            if (stats) {
                data[name] =
                    subscription.aggregation === 'latest'
                        ? stats.latest
                        : stats[subscription.aggregation];
            }
        });

        try {
            subscription.callback(data);
        } catch (error) {
            structuredLogger.error('Subscriber notification error', error, {
                subscriptionId,
            });
        }
    }

    _measureFPS() {
        let frames = 0;
        let lastTime = performance.now();

        const measureFrame = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                this.setGauge('performance.fps', frames);
                frames = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrame);
        };

        requestAnimationFrame(measureFrame);
    }

    _estimateCPUUsage() {
        const start = performance.now();
        let iterations = 0;

        // Fazer trabalho por um tempo fixo
        while (performance.now() - start < 10) {
            iterations++;
        }

        // Estimar CPU baseado na quantidade de trabalho feito
        const baselineIterations = 100000; // Valor de referência
        return Math.min(100, (baselineIterations / iterations) * 100);
    }

    _calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    _calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    _calculateTrend(dataPoints) {
        if (dataPoints.length < 2) return 0;

        const recent = dataPoints.slice(-10);
        const first = recent[0].value;
        const last = recent[recent.length - 1].value;

        return ((last - first) / first) * 100;
    }

    _getSystemMetrics() {
        return {
            memory: this.getCurrentValue('system.memory.used'),
            cpu: this.getCurrentValue('system.cpu.usage'),
            online: this.getCurrentValue('system.online'),
        };
    }

    _getPerformanceMetrics() {
        return {
            loadTime: this.getCurrentValue('performance.page.load_time'),
            fps: this.getCurrentValue('performance.fps'),
        };
    }

    _getBusinessMetrics() {
        return {
            userInteractions: this.getCurrentValue('user.interactions'),
        };
    }

    _getErrorMetrics() {
        return {
            total: this.getCurrentValue('errors.total'),
        };
    }

    _getWebVitalsMetrics() {
        return {
            fcp: this.getCurrentValue('webvitals.fcp'),
            lcp: this.getCurrentValue('webvitals.lcp'),
        };
    }

    _getPrometheusType(metricType) {
        switch (metricType) {
            case this.metricTypes.COUNTER:
                return 'counter';
            case this.metricTypes.GAUGE:
                return 'gauge';
            case this.metricTypes.HISTOGRAM:
                return 'histogram';
            case this.metricTypes.TIMER:
                return 'histogram';
            default:
                return 'gauge';
        }
    }

    _formatPrometheusTags(tags) {
        const entries = Object.entries(tags);
        if (entries.length === 0) return '';

        const formatted = entries.map(([key, value]) => `${key}="${value}"`).join(',');
        return `{${formatted}}`;
    }
}

// Instância global
const realtimeMetrics = new RealtimeMetrics();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.realtimeMetrics = realtimeMetrics;
}

export default realtimeMetrics;
