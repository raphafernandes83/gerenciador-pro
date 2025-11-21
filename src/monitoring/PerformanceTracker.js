/**
 * 🚀 PERFORMANCE TRACKER - Monitoramento de Performance com RequestId
 * Sistema centralizado para rastrear métricas de performance correlacionadas
 */

import { logger } from '../utils/Logger.js';
import { generateRequestId } from '../utils/SecurityUtils.js';
import { isDevelopment } from '../config/EnvProvider.js';

class PerformanceTracker {
    constructor() {
        this.activeOperations = new Map();
        this.completedMetrics = [];
        this.performanceThresholds = {
            critical: 1000, // 1s
            warning: 500, // 500ms
            info: 100, // 100ms
        };
        this.maxStoredMetrics = isDevelopment() ? 1000 : 100;
    }

    /**
     * 🎯 Inicia rastreamento de uma operação
     */
    startOperation(operationName, requestId = null, context = {}) {
        const id = requestId || generateRequestId(operationName);
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        const operation = {
            id,
            name: operationName,
            startTime,
            startMemory,
            context: { ...context },
            markers: [],
        };

        this.activeOperations.set(id, operation);

        logger.withRequest(id).debug(`🚀 Performance tracking started: ${operationName}`, {
            startTime,
            startMemory: startMemory ? `${startMemory.used}MB` : 'N/A',
            context,
        });

        return id;
    }

    /**
     * 📍 Adiciona marco intermediário à operação
     */
    addMarker(requestId, markerName, additionalData = {}) {
        const operation = this.activeOperations.get(requestId);
        if (!operation) {
            logger.warn('⚠️ Tentativa de adicionar marker a operação inexistente', {
                requestId,
                markerName,
            });
            return false;
        }

        const currentTime = performance.now();
        const elapsedFromStart = currentTime - operation.startTime;
        const currentMemory = this.getMemoryUsage();

        const marker = {
            name: markerName,
            timestamp: currentTime,
            elapsedFromStart,
            memory: currentMemory,
            data: additionalData,
        };

        operation.markers.push(marker);

        logger.withRequest(requestId).debug(`📍 Performance marker: ${markerName}`, {
            elapsed: `${elapsedFromStart.toFixed(2)}ms`,
            memory: currentMemory ? `${currentMemory.used}MB` : 'N/A',
            data: additionalData,
        });

        return true;
    }

    /**
     * 🏁 Finaliza rastreamento de operação
     */
    finishOperation(requestId, result = 'success', additionalData = {}) {
        const operation = this.activeOperations.get(requestId);
        if (!operation) {
            logger.warn('⚠️ Tentativa de finalizar operação inexistente', { requestId });
            return null;
        }

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        const totalDuration = endTime - operation.startTime;

        const metrics = {
            id: operation.id,
            name: operation.name,
            startTime: operation.startTime,
            endTime,
            duration: totalDuration,
            result,
            memory: {
                start: operation.startMemory,
                end: endMemory,
                delta: this.calculateMemoryDelta(operation.startMemory, endMemory),
            },
            markers: operation.markers,
            context: operation.context,
            additionalData,
            severity: this.calculateSeverity(totalDuration),
            timestamp: new Date().toISOString(),
        };

        // Remove da lista ativa
        this.activeOperations.delete(requestId);

        // Armazena métricas completas
        this.storeMetrics(metrics);

        // Log baseado na severidade
        this.logMetrics(metrics);

        return metrics;
    }

    /**
     * ⚡ Método de conveniência para operações síncronas
     */
    trackSync(operationName, operation, context = {}) {
        const requestId = this.startOperation(operationName, null, context);

        try {
            const result = operation();
            this.finishOperation(requestId, 'success', { syncResult: typeof result });
            return result;
        } catch (error) {
            this.finishOperation(requestId, 'error', { error: error.message });
            throw error;
        }
    }

    /**
     * ⚡ Método de conveniência para operações assíncronas
     */
    async trackAsync(operationName, asyncOperation, context = {}) {
        const requestId = this.startOperation(operationName, null, context);

        try {
            const result = await asyncOperation(requestId);
            this.finishOperation(requestId, 'success', { asyncResult: typeof result });
            return result;
        } catch (error) {
            this.finishOperation(requestId, 'error', { error: error.message });
            throw error;
        }
    }

    /**
     * 📊 Obtém métricas de uma operação específica
     */
    getOperationMetrics(requestId) {
        return this.completedMetrics.find((m) => m.id === requestId);
    }

    /**
     * 📈 Obtém estatísticas agregadas
     */
    getAggregatedStats(operationName = null, timeWindow = 300000) {
        // 5 minutos
        const now = Date.now();
        const cutoff = now - timeWindow;

        let relevantMetrics = this.completedMetrics.filter(
            (m) => new Date(m.timestamp).getTime() > cutoff
        );

        if (operationName) {
            relevantMetrics = relevantMetrics.filter((m) => m.name === operationName);
        }

        if (relevantMetrics.length === 0) {
            return null;
        }

        const durations = relevantMetrics.map((m) => m.duration);
        const successRate =
            relevantMetrics.filter((m) => m.result === 'success').length / relevantMetrics.length;

        return {
            operationName,
            timeWindow: timeWindow / 1000, // em segundos
            totalOperations: relevantMetrics.length,
            successRate: (successRate * 100).toFixed(1) + '%',
            duration: {
                min: Math.min(...durations).toFixed(2),
                max: Math.max(...durations).toFixed(2),
                avg: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
                p95: this.calculatePercentile(durations, 95).toFixed(2),
            },
            severityBreakdown: this.getSeverityBreakdown(relevantMetrics),
            lastUpdate: new Date().toISOString(),
        };
    }

    /**
     * 🧹 Limpa métricas antigas
     */
    cleanup() {
        if (this.completedMetrics.length > this.maxStoredMetrics) {
            const toRemove = this.completedMetrics.length - this.maxStoredMetrics;
            this.completedMetrics.splice(0, toRemove);

            logger.debug('🧹 Performance metrics cleanup', {
                removed: toRemove,
                remaining: this.completedMetrics.length,
            });
        }
    }

    /**
     * 🔍 Obtém relatório de performance
     */
    getPerformanceReport() {
        const activeCount = this.activeOperations.size;
        const completedCount = this.completedMetrics.length;

        const recentStats = this.getAggregatedStats(null, 60000); // último minuto

        const operationTypes = [...new Set(this.completedMetrics.map((m) => m.name))];
        const typeStats = operationTypes.map((type) => ({
            operation: type,
            ...this.getAggregatedStats(type, 300000),
        }));

        return {
            summary: {
                activeOperations: activeCount,
                completedOperations: completedCount,
                trackingStatus: activeCount > 0 ? 'active' : 'idle',
            },
            recent: recentStats,
            byOperation: typeStats,
            thresholds: this.performanceThresholds,
            generatedAt: new Date().toISOString(),
        };
    }

    // ===== MÉTODOS AUXILIARES =====

    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
            };
        }
        return null;
    }

    calculateMemoryDelta(startMemory, endMemory) {
        if (!startMemory || !endMemory) return null;
        return {
            used: endMemory.used - startMemory.used,
            total: endMemory.total - startMemory.total,
        };
    }

    calculateSeverity(duration) {
        if (duration >= this.performanceThresholds.critical) return 'critical';
        if (duration >= this.performanceThresholds.warning) return 'warning';
        if (duration >= this.performanceThresholds.info) return 'info';
        return 'debug';
    }

    storeMetrics(metrics) {
        this.completedMetrics.push(metrics);
        this.cleanup();
    }

    logMetrics(metrics) {
        const logData = {
            operation: metrics.name,
            duration: `${metrics.duration.toFixed(2)}ms`,
            result: metrics.result,
            markers: metrics.markers.length,
            memory: metrics.memory.delta ? `${metrics.memory.delta.used}MB` : 'N/A',
        };

        switch (metrics.severity) {
            case 'critical':
                logger.withRequest(metrics.id).error('🐌 PERFORMANCE CRÍTICA detectada', logData);
                break;
            case 'warning':
                logger.withRequest(metrics.id).warn('⚠️ Performance lenta detectada', logData);
                break;
            case 'info':
                logger.withRequest(metrics.id).info('📊 Performance monitorada', logData);
                break;
            default:
                logger.withRequest(metrics.id).debug('🚀 Performance OK', logData);
        }
    }

    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getSeverityBreakdown(metrics) {
        const breakdown = { critical: 0, warning: 0, info: 0, debug: 0 };
        metrics.forEach((m) => {
            breakdown[m.severity]++;
        });
        return breakdown;
    }
}

// Instância singleton
export const performanceTracker = new PerformanceTracker();

// Decorators para facilitar uso
export function trackPerformance(operationName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args) {
            if (originalMethod.constructor.name === 'AsyncFunction') {
                return performanceTracker.trackAsync(
                    `${target.constructor.name}.${propertyKey}`,
                    () => originalMethod.apply(this, args),
                    { class: target.constructor.name, method: propertyKey }
                );
            } else {
                return performanceTracker.trackSync(
                    `${target.constructor.name}.${propertyKey}`,
                    () => originalMethod.apply(this, args),
                    { class: target.constructor.name, method: propertyKey }
                );
            }
        };

        return descriptor;
    };
}
