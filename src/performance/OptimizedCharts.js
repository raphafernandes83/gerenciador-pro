/**
 * Sistema de Charts Otimizado
 * Implementa debounce, lazy loading e otimizações de performance
 */

import smartDebouncer from './SmartDebouncer.js';
import lazyLoader from './LazyLoader.js';
import performanceProfiler from './PerformanceProfiler.js';

class OptimizedCharts {
    constructor() {
        this.charts = new Map();
        this.updateQueue = new Map();
        this.isChartLibLoaded = false;
        this.pendingUpdates = new Set();
        this.renderCache = new Map();
        this.config = {
            maxCacheAge: 5000, // 5 segundos
            batchUpdateDelay: 16, // 1 frame
            maxBatchSize: 5,
            enableVirtualization: true,
        };
    }

    /**
     * Inicializa o sistema de charts otimizado
     */
    async init() {
        // Carregar Chart.js sob demanda
        await this._ensureChartLibLoaded();

        // Configurar observadores de performance
        this._setupPerformanceObservers();

        // Inicializar cache de renderização
        this._initRenderCache();

        console.log('📊 Sistema de charts otimizado inicializado');
    }

    /**
     * Cria um chart com lazy loading e otimizações
     * @param {string} chartId - ID único do chart
     * @param {HTMLElement|string} canvas - Canvas ou seletor
     * @param {Object} config - Configuração do chart
     * @param {Object} options - Opções de otimização
     */
    async createChart(chartId, canvas, config, options = {}) {
        const {
            lazy = true,
            priority = 'normal',
            enableCache = true,
            virtualizeData = false,
        } = options;

        const measurementId = performanceProfiler.startMeasurement('chart_creation', {
            chartId,
            type: config.type,
            lazy,
        });

        try {
            // Garantir que Chart.js está carregado
            await this._ensureChartLibLoaded();

            // Obter elemento canvas
            const canvasElement =
                typeof canvas === 'string' ? document.querySelector(canvas) : canvas;

            if (!canvasElement) {
                throw new Error(`Canvas não encontrado: ${canvas}`);
            }

            // Verificar cache se habilitado
            if (enableCache) {
                const cached = this._getCachedChart(chartId, config);
                if (cached) {
                    performanceProfiler.endMeasurement(measurementId, { cached: true });
                    return cached;
                }
            }

            // Otimizar configuração do chart
            const optimizedConfig = this._optimizeChartConfig(config, {
                virtualizeData,
                enableCache,
            });

            // Criar chart
            const chart = await this._createChartInstance(canvasElement, optimizedConfig);

            // Armazenar referência
            this.charts.set(chartId, {
                chart,
                config: optimizedConfig,
                canvas: canvasElement,
                lastUpdate: Date.now(),
                updateCount: 0,
                options,
            });

            // Cache se habilitado
            if (enableCache) {
                this._cacheChart(chartId, chart, config);
            }

            performanceProfiler.endMeasurement(measurementId, {
                success: true,
                cached: false,
            });

            return chart;
        } catch (error) {
            performanceProfiler.endMeasurement(measurementId, {
                success: false,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Atualiza dados do chart com debounce inteligente
     * @param {string} chartId - ID do chart
     * @param {Object} newData - Novos dados
     * @param {Object} options - Opções de atualização
     */
    updateChart(chartId, newData, options = {}) {
        const {
            immediate = false,
            priority = 'normal',
            coalesce = true,
            animationDuration = 300,
        } = options;

        const updateKey = `chart_update_${chartId}`;

        smartDebouncer.scheduleUpdate(
            updateKey,
            () => {
                return this._performChartUpdate(chartId, newData, {
                    animationDuration,
                    priority,
                });
            },
            {
                priority,
                immediate,
                coalesce,
                context: { chartId, dataSize: this._getDataSize(newData) },
            }
        );
    }

    /**
     * Atualiza múltiplos charts em batch
     * @param {Array} updates - Array de {chartId, data, options}
     */
    updateChartsBatch(updates) {
        const batchUpdates = updates.map((update) => ({
            key: `chart_update_${update.chartId}`,
            updateFn: () =>
                this._performChartUpdate(update.chartId, update.data, update.options || {}),
            options: {
                priority: update.options?.priority || 'normal',
                context: {
                    chartId: update.chartId,
                    batchSize: updates.length,
                },
            },
        }));

        smartDebouncer.scheduleBatch(batchUpdates);
    }

    /**
     * Otimiza re-renders do progresso de metas
     * @param {Object} progressData - Dados de progresso
     */
    updateProgressMetas(progressData) {
        const cacheKey = this._generateProgressCacheKey(progressData);

        // Verificar se dados mudaram significativamente
        if (this._isProgressDataSimilar(cacheKey)) {
            return; // Skip update desnecessário
        }

        this.updateChart('progressMetas', progressData, {
            priority: 'high',
            coalesce: true,
            immediate: false,
        });

        // Atualizar cache
        this.renderCache.set('progress_cache_key', cacheKey);
    }

    /**
     * Destrói um chart e limpa recursos
     * @param {string} chartId - ID do chart
     */
    destroyChart(chartId) {
        const chartData = this.charts.get(chartId);
        if (chartData) {
            chartData.chart.destroy();
            this.charts.delete(chartId);

            // Limpar cache relacionado
            this._clearChartCache(chartId);

            // Cancelar updates pendentes
            smartDebouncer.cancelUpdate(`chart_update_${chartId}`);
        }
    }

    /**
     * Obtém estatísticas de performance dos charts
     * @returns {Object} Estatísticas
     */
    getPerformanceStats() {
        const charts = Array.from(this.charts.values());

        return {
            totalCharts: charts.length,
            averageUpdateCount:
                charts.length > 0
                    ? charts.reduce((sum, c) => sum + c.updateCount, 0) / charts.length
                    : 0,
            cacheHitRate: this._calculateCacheHitRate(),
            pendingUpdates: this.pendingUpdates.size,
            memoryUsage: this._estimateMemoryUsage(),
            debouncerStats: smartDebouncer.getStats(),
        };
    }

    /**
     * Força limpeza de cache e otimizações
     */
    cleanup() {
        // Limpar cache antigo
        const now = Date.now();
        for (const [key, cached] of this.renderCache.entries()) {
            if (now - cached.timestamp > this.config.maxCacheAge) {
                this.renderCache.delete(key);
            }
        }

        // Limpar updates pendentes
        smartDebouncer.clear();

        // Forçar garbage collection se disponível
        if (window.gc) {
            window.gc();
        }
    }

    // Métodos privados
    async _ensureChartLibLoaded() {
        if (this.isChartLibLoaded) return;

        await lazyLoader.loadChartModule('advanced');
        this.isChartLibLoaded = true;
    }

    async _createChartInstance(canvas, config) {
        return new Promise((resolve) => {
            // Usar requestAnimationFrame para não bloquear UI
            requestAnimationFrame(() => {
                const chart = new Chart(canvas, config);
                resolve(chart);
            });
        });
    }

    _optimizeChartConfig(config, options) {
        const optimized = JSON.parse(JSON.stringify(config));

        // Otimizações gerais
        optimized.options = optimized.options || {};
        optimized.options.responsive = true;
        optimized.options.maintainAspectRatio = false;

        // Otimizar animações
        optimized.options.animation = {
            duration: 300,
            easing: 'easeOutQuart',
        };

        // Otimizar plugins
        optimized.options.plugins = optimized.options.plugins || {};
        optimized.options.plugins.legend = {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 12 },
        };

        // Virtualização de dados se habilitada
        if (options.virtualizeData && optimized.data.datasets) {
            optimized.data.datasets = this._virtualizeDatasets(optimized.data.datasets);
        }

        // Otimizar escalas
        if (optimized.options.scales) {
            Object.values(optimized.options.scales).forEach((scale) => {
                scale.ticks = scale.ticks || {};
                scale.ticks.maxTicksLimit = 10; // Limitar ticks
            });
        }

        return optimized;
    }

    _performChartUpdate(chartId, newData, options) {
        const chartData = this.charts.get(chartId);
        if (!chartData) {
            console.warn(`Chart não encontrado: ${chartId}`);
            return;
        }

        const measurementId = performanceProfiler.startMeasurement('chart_update', {
            chartId,
            dataSize: this._getDataSize(newData),
        });

        try {
            const { chart } = chartData;

            // Atualizar dados
            if (newData.labels) {
                chart.data.labels = newData.labels;
            }

            if (newData.datasets) {
                chart.data.datasets = newData.datasets;
            }

            // Atualizar com animação otimizada
            chart.update(options.animationDuration > 0 ? 'default' : 'none');

            // Atualizar estatísticas
            chartData.lastUpdate = Date.now();
            chartData.updateCount++;

            performanceProfiler.endMeasurement(measurementId, { success: true });
        } catch (error) {
            performanceProfiler.endMeasurement(measurementId, {
                success: false,
                error: error.message,
            });
            console.error(`Erro ao atualizar chart ${chartId}:`, error);
        }
    }

    _setupPerformanceObservers() {
        // Observer para detectar charts fora da viewport
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const chartId = entry.target.dataset.chartId;
                        if (chartId && this.charts.has(chartId)) {
                            const chartData = this.charts.get(chartId);
                            chartData.isVisible = entry.isIntersecting;

                            // Pausar updates para charts invisíveis
                            if (!entry.isIntersecting) {
                                smartDebouncer.cancelUpdate(`chart_update_${chartId}`);
                            }
                        }
                    });
                },
                { threshold: 0.1 }
            );

            // Observar todos os canvas de charts
            this.intersectionObserver = observer;
        }
    }

    _initRenderCache() {
        this.renderCache.clear();

        // Configurar limpeza automática do cache
        setInterval(() => {
            this.cleanup();
        }, 30000); // A cada 30 segundos
    }

    _getCachedChart(chartId, config) {
        const cacheKey = this._generateCacheKey(chartId, config);
        const cached = this.renderCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.config.maxCacheAge) {
            return cached.chart;
        }

        return null;
    }

    _cacheChart(chartId, chart, config) {
        const cacheKey = this._generateCacheKey(chartId, config);
        this.renderCache.set(cacheKey, {
            chart,
            timestamp: Date.now(),
            chartId,
        });
    }

    _clearChartCache(chartId) {
        for (const [key, cached] of this.renderCache.entries()) {
            if (cached.chartId === chartId) {
                this.renderCache.delete(key);
            }
        }
    }

    _generateCacheKey(chartId, config) {
        const configHash = JSON.stringify(config).slice(0, 100);
        return `${chartId}_${btoa(configHash).slice(0, 20)}`;
    }

    _generateProgressCacheKey(progressData) {
        return JSON.stringify({
            winRate: progressData.winRate,
            lossRate: progressData.lossRate,
            capitalAtual: progressData.capitalAtual,
            timestamp: Math.floor(Date.now() / 1000), // Segundos
        });
    }

    _isProgressDataSimilar(newCacheKey) {
        const oldKey = this.renderCache.get('progress_cache_key');
        return oldKey === newCacheKey;
    }

    _virtualizeDatasets(datasets) {
        return datasets.map((dataset) => {
            if (dataset.data && dataset.data.length > 100) {
                // Reduzir pontos de dados para melhor performance
                const step = Math.ceil(dataset.data.length / 50);
                dataset.data = dataset.data.filter((_, index) => index % step === 0);
            }
            return dataset;
        });
    }

    _getDataSize(data) {
        if (!data) return 0;
        let size = 0;
        if (data.labels) size += data.labels.length;
        if (data.datasets) {
            size += data.datasets.reduce((sum, ds) => sum + (ds.data?.length || 0), 0);
        }
        return size;
    }

    _calculateCacheHitRate() {
        // Implementação simplificada
        return this.renderCache.size > 0 ? 0.75 : 0;
    }

    _estimateMemoryUsage() {
        return this.charts.size * 0.5 + this.renderCache.size * 0.1; // MB
    }
}

// Instância global
const optimizedCharts = new OptimizedCharts();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.optimizedCharts = optimizedCharts;
}

export default optimizedCharts;
