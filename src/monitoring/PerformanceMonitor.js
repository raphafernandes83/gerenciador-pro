/**
 * MONITOR DE PERFORMANCE - GERENCIADOR PRO v9.3
 *
 * Sistema de monitoramento em tempo real de performance da aplicação
 * Coleta métricas, detecta gargalos e gera relatórios de otimização
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { PERFORMANCE_CONFIG } from '../constants/AppConstants.js';
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';
import { debounce, throttle } from '../utils/PerformanceUtils.js';

/**
 * Classe principal para monitoramento de performance
 * Implementa Singleton Pattern para instância única
 */
export class PerformanceMonitor {
    constructor() {
        if (PerformanceMonitor.instance) {
            return PerformanceMonitor.instance;
        }

        // Configuração inicial
        this.isEnabled = false;
        this.metrics = {
            // Métricas de tempo
            executionTimes: new Map(),
            averageExecutionTimes: new Map(),

            // Métricas de memória
            memoryUsage: [],
            peakMemoryUsage: 0,

            // Métricas de DOM
            domOperations: 0,
            domOperationTimes: [],

            // Métricas de rede
            networkRequests: 0,
            networkLatency: [],

            // Métricas customizadas
            customMetrics: new Map(),

            // Alertas de performance
            alerts: [],

            // Sessão atual
            sessionStart: null,
            sessionMetrics: {},
        };

        // Configurações
        this.config = {
            enableMemoryMonitoring: true,
            enableDOMMonitoring: true,
            enableNetworkMonitoring: true,
            alertThresholds: {
                slowFunction: 100, // ms
                highMemoryUsage: 50, // MB
                domOperationsPerSecond: 100,
                networkLatency: 1000, // ms
            },
            reportInterval: 30000, // 30 segundos
            maxHistoryLength: 1000,
        };

        // Timers
        this.reportTimer = null;
        this.memoryTimer = null;

        // Observers
        this.performanceObserver = null;
        this.mutationObserver = null;

        PerformanceMonitor.instance = this;
    }

    /**
     * Inicializa o sistema de monitoramento
     *
     * @param {Object} options - Configurações opcionais
     * @returns {boolean} Sucesso da inicialização
     */
    initialize(options = {}) {
        try {
            // Aplicar configurações customizadas
            Object.assign(this.config, options);

            // Iniciar sessão
            this.metrics.sessionStart = performance.now();

            // Configurar observers
            this._setupPerformanceObserver();
            this._setupMutationObserver();

            // Iniciar monitoramento automático
            this._startMemoryMonitoring();
            this._startReporting();

            // Configurar listeners de eventos
            this._setupEventListeners();

            this.isEnabled = true;

            console.log('🔍 PerformanceMonitor inicializado com sucesso!');
            console.log('📊 Configurações:', this.config);

            return true;
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.PERFORMANCE,
                'PerformanceMonitor.initialize'
            );
            return false;
        }
    }

    /**
     * Para o monitoramento e limpa recursos
     */
    stop() {
        try {
            this.isEnabled = false;

            // Limpar timers
            if (this.reportTimer) {
                clearInterval(this.reportTimer);
                this.reportTimer = null;
            }

            if (this.memoryTimer) {
                clearInterval(this.memoryTimer);
                this.memoryTimer = null;
            }

            // Desconectar observers
            if (this.performanceObserver) {
                this.performanceObserver.disconnect();
                this.performanceObserver = null;
            }

            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
            }

            console.log('🛑 PerformanceMonitor parado');
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.PERFORMANCE, 'PerformanceMonitor.stop');
        }
    }

    /**
     * Mede o tempo de execução de uma função
     *
     * @param {string} functionName - Nome da função para identificação
     * @param {Function} func - Função a ser medida
     * @param {...any} args - Argumentos da função
     * @returns {any} Resultado da função
     */
    measureFunction(functionName, func, ...args) {
        if (!this.isEnabled) {
            return func(...args);
        }

        const startTime = performance.now();
        let result;
        let error = null;

        try {
            result = func(...args);
        } catch (err) {
            error = err;
        }

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Armazenar métrica
        this._recordExecutionTime(functionName, executionTime);

        // Verificar alerta de performance
        if (executionTime > this.config.alertThresholds.slowFunction) {
            this._addAlert({
                type: 'SLOW_FUNCTION',
                functionName,
                executionTime,
                threshold: this.config.alertThresholds.slowFunction,
                timestamp: Date.now(),
            });
        }

        if (error) {
            throw error;
        }

        return result;
    }

    /**
     * Mede o tempo de execução de uma operação assíncrona
     *
     * @param {string} operationName - Nome da operação
     * @param {Function} asyncFunc - Função assíncrona
     * @param {...any} args - Argumentos da função
     * @returns {Promise<any>} Resultado da função
     */
    async measureAsyncFunction(operationName, asyncFunc, ...args) {
        if (!this.isEnabled) {
            return await asyncFunc(...args);
        }

        const startTime = performance.now();
        let result;
        let error = null;

        try {
            result = await asyncFunc(...args);
        } catch (err) {
            error = err;
        }

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Armazenar métrica
        this._recordExecutionTime(operationName, executionTime);

        if (error) {
            throw error;
        }

        return result;
    }

    /**
     * Adiciona uma métrica customizada
     *
     * @param {string} name - Nome da métrica
     * @param {any} value - Valor da métrica
     * @param {Object} metadata - Metadados opcionais
     */
    addCustomMetric(name, value, metadata = {}) {
        if (!this.isEnabled) return;

        const metric = {
            value,
            timestamp: Date.now(),
            metadata,
        };

        if (!this.metrics.customMetrics.has(name)) {
            this.metrics.customMetrics.set(name, []);
        }

        this.metrics.customMetrics.get(name).push(metric);

        // Limitar histórico
        const history = this.metrics.customMetrics.get(name);
        if (history.length > this.config.maxHistoryLength) {
            history.shift();
        }
    }

    /**
     * Gera relatório completo de performance
     *
     * @returns {Object} Relatório detalhado
     */
    generateReport() {
        const sessionDuration = performance.now() - this.metrics.sessionStart;

        return {
            sessionInfo: {
                duration: sessionDuration,
                startTime: this.metrics.sessionStart,
                isActive: this.isEnabled,
            },

            executionTimes: {
                functions: Object.fromEntries(this.metrics.averageExecutionTimes),
                slowestFunctions: this._getSlowFunctions(5),
            },

            memory: {
                current: this._getCurrentMemoryUsage(),
                peak: this.metrics.peakMemoryUsage,
                average: this._getAverageMemoryUsage(),
                history: this.metrics.memoryUsage.slice(-100), // Últimas 100 medições
            },

            dom: {
                operations: this.metrics.domOperations,
                averageOperationTime: this._getAverageDOMOperationTime(),
                operationsPerSecond: this.metrics.domOperations / (sessionDuration / 1000),
            },

            network: {
                requests: this.metrics.networkRequests,
                averageLatency: this._getAverageNetworkLatency(),
                latencyHistory: this.metrics.networkLatency.slice(-50),
            },

            alerts: this.metrics.alerts,

            customMetrics: Object.fromEntries(this.metrics.customMetrics),

            recommendations: this._generateRecommendations(),
        };
    }

    /**
     * Obtém resumo rápido das métricas
     *
     * @returns {Object} Resumo das métricas principais
     */
    getQuickStats() {
        if (!this.isEnabled) {
            return { status: 'disabled' };
        }

        return {
            status: 'active',
            session: {
                duration: performance.now() - this.metrics.sessionStart,
                alerts: this.metrics.alerts.length,
            },
            functions: {
                measured: this.metrics.executionTimes.size,
                slow: this._getSlowFunctions(3).length,
            },
            memory: {
                current: this._getCurrentMemoryUsage(),
                peak: this.metrics.peakMemoryUsage,
            },
            dom: {
                operations: this.metrics.domOperations,
            },
        };
    }

    // ========================================
    // MÉTODOS PRIVADOS
    // ========================================

    /**
     * Configura o Performance Observer para métricas web vitals
     * @private
     */
    _setupPerformanceObserver() {
        if (!window.PerformanceObserver) {
            console.warn('PerformanceObserver não suportado pelo navegador');
            return;
        }

        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this._processPerformanceEntry(entry);
                }
            });

            // Observar diferentes tipos de métricas
            this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        } catch (error) {
            console.warn('Erro ao configurar PerformanceObserver:', error.message);
        }
    }

    /**
     * Configura o Mutation Observer para monitorar operações DOM
     * @private
     */
    _setupMutationObserver() {
        if (!this.config.enableDOMMonitoring || !window.MutationObserver) {
            return;
        }

        try {
            this.mutationObserver = new MutationObserver(
                throttle((mutations) => {
                    const startTime = performance.now();

                    mutations.forEach((mutation) => {
                        this.metrics.domOperations++;
                    });

                    const endTime = performance.now();
                    this.metrics.domOperationTimes.push(endTime - startTime);

                    // Limitar histórico
                    if (this.metrics.domOperationTimes.length > this.config.maxHistoryLength) {
                        this.metrics.domOperationTimes.shift();
                    }
                }, 100)
            );

            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
            });
        } catch (error) {
            console.warn('Erro ao configurar MutationObserver:', error.message);
        }
    }

    /**
     * Inicia monitoramento automático de memória
     * @private
     */
    _startMemoryMonitoring() {
        if (!this.config.enableMemoryMonitoring) {
            return;
        }

        this.memoryTimer = setInterval(() => {
            const memoryUsage = this._getCurrentMemoryUsage();

            if (memoryUsage > 0) {
                this.metrics.memoryUsage.push({
                    usage: memoryUsage,
                    timestamp: Date.now(),
                });

                // Atualizar pico
                if (memoryUsage > this.metrics.peakMemoryUsage) {
                    this.metrics.peakMemoryUsage = memoryUsage;
                }

                // Verificar alerta de memória
                if (memoryUsage > this.config.alertThresholds.highMemoryUsage) {
                    this._addAlert({
                        type: 'HIGH_MEMORY_USAGE',
                        usage: memoryUsage,
                        threshold: this.config.alertThresholds.highMemoryUsage,
                        timestamp: Date.now(),
                    });
                }

                // Limitar histórico
                if (this.metrics.memoryUsage.length > this.config.maxHistoryLength) {
                    this.metrics.memoryUsage.shift();
                }
            }
        }, 5000); // A cada 5 segundos
    }

    /**
     * Inicia relatórios automáticos
     * @private
     */
    _startReporting() {
        this.reportTimer = setInterval(() => {
            const report = this.generateReport();

            // Log do relatório resumido
            console.group('📊 Relatório de Performance');
            console.log(
                'Duração da sessão:',
                (report.sessionInfo.duration / 1000).toFixed(2) + 's'
            );
            console.log(
                'Funções monitoradas:',
                Object.keys(report.executionTimes.functions).length
            );
            console.log('Alertas:', report.alerts.length);
            console.log('Uso de memória:', report.memory.current + 'MB');
            console.groupEnd();

            // Emitir evento para outros módulos
            this._emitReportEvent(report);
        }, this.config.reportInterval);
    }

    /**
     * Configura listeners de eventos do sistema
     * @private
     */
    _setupEventListeners() {
        // Monitorar mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            this.addCustomMetric('pageVisibility', document.visibilityState);
        });

        // Monitorar mudanças de foco
        window.addEventListener('focus', () => {
            this.addCustomMetric('windowFocus', 'gained');
        });

        window.addEventListener('blur', () => {
            this.addCustomMetric('windowFocus', 'lost');
        });
    }

    /**
     * Registra tempo de execução de uma função
     * @private
     */
    _recordExecutionTime(functionName, executionTime) {
        // Adicionar à lista de tempos
        if (!this.metrics.executionTimes.has(functionName)) {
            this.metrics.executionTimes.set(functionName, []);
        }

        this.metrics.executionTimes.get(functionName).push(executionTime);

        // Calcular média
        const times = this.metrics.executionTimes.get(functionName);
        const average = times.reduce((sum, time) => sum + time, 0) / times.length;
        this.metrics.averageExecutionTimes.set(functionName, average);

        // Limitar histórico
        if (times.length > this.config.maxHistoryLength) {
            times.shift();
        }
    }

    /**
     * Adiciona um alerta de performance
     * @private
     */
    _addAlert(alert) {
        this.metrics.alerts.push(alert);

        // Limitar número de alertas
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts.shift();
        }

        console.warn('⚠️ Alerta de Performance:', alert);
    }

    /**
     * Obtém uso atual de memória
     * @private
     */
    _getCurrentMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
    }

    /**
     * Obtém funções mais lentas
     * @private
     */
    _getSlowFunctions(limit = 5) {
        const functions = Array.from(this.metrics.averageExecutionTimes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        return functions.map(([name, time]) => ({ name, averageTime: time }));
    }

    /**
     * Obtém uso médio de memória
     * @private
     */
    _getAverageMemoryUsage() {
        if (this.metrics.memoryUsage.length === 0) return 0;

        const total = this.metrics.memoryUsage.reduce((sum, entry) => sum + entry.usage, 0);
        return Math.round(total / this.metrics.memoryUsage.length);
    }

    /**
     * Obtém tempo médio de operações DOM
     * @private
     */
    _getAverageDOMOperationTime() {
        if (this.metrics.domOperationTimes.length === 0) return 0;

        const total = this.metrics.domOperationTimes.reduce((sum, time) => sum + time, 0);
        return total / this.metrics.domOperationTimes.length;
    }

    /**
     * Obtém latência média de rede
     * @private
     */
    _getAverageNetworkLatency() {
        if (this.metrics.networkLatency.length === 0) return 0;

        const total = this.metrics.networkLatency.reduce((sum, latency) => sum + latency, 0);
        return total / this.metrics.networkLatency.length;
    }

    /**
     * Processa entradas do Performance Observer
     * @private
     */
    _processPerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'resource':
                this.metrics.networkRequests++;
                if (entry.responseEnd > entry.requestStart) {
                    const latency = entry.responseEnd - entry.requestStart;
                    this.metrics.networkLatency.push(latency);

                    if (this.metrics.networkLatency.length > this.config.maxHistoryLength) {
                        this.metrics.networkLatency.shift();
                    }
                }
                break;

            case 'navigation':
                this.addCustomMetric('pageLoad', entry.loadEventEnd - entry.loadEventStart);
                break;

            case 'measure':
                this._recordExecutionTime(entry.name, entry.duration);
                break;
        }
    }

    /**
     * Gera recomendações baseadas nas métricas
     * @private
     */
    _generateRecommendations() {
        const recommendations = [];

        // Recomendações baseadas em funções lentas
        const slowFunctions = this._getSlowFunctions(3);
        if (slowFunctions.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Considere otimizar as funções: ${slowFunctions.map((f) => f.name).join(', ')}`,
                functions: slowFunctions,
            });
        }

        // Recomendações baseadas em uso de memória
        const avgMemory = this._getAverageMemoryUsage();
        if (avgMemory > 30) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: `Uso de memória está elevado (${avgMemory}MB). Considere implementar limpeza de cache.`,
                currentUsage: avgMemory,
            });
        }

        // Recomendações baseadas em operações DOM
        const sessionDuration = performance.now() - this.metrics.sessionStart;
        const domOpsPerSecond = this.metrics.domOperations / (sessionDuration / 1000);
        if (domOpsPerSecond > this.config.alertThresholds.domOperationsPerSecond) {
            recommendations.push({
                type: 'dom',
                priority: 'medium',
                message: `Muitas operações DOM detectadas (${domOpsPerSecond.toFixed(1)}/s). Considere usar virtualização ou batching.`,
                operationsPerSecond: domOpsPerSecond,
            });
        }

        return recommendations;
    }

    /**
     * Emite evento de relatório
     * @private
     */
    _emitReportEvent(report) {
        const event = new CustomEvent('performanceReport', {
            detail: report,
        });

        window.dispatchEvent(event);
    }
}

// Exportar instância singleton
export const performanceMonitor = new PerformanceMonitor();
