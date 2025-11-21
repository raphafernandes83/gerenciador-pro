/**
 * Sistema de Profiling de Performance
 * Mede e compara velocidade de operações críticas
 */

class PerformanceProfiler {
    constructor() {
        this.metrics = new Map();
        this.sessions = [];
        this.isEnabled = true;
        this.thresholds = {
            chartUpdate: 16, // 60fps = 16ms por frame
            domUpdate: 8,
            calculation: 4,
            total: 100,
        };
    }

    /**
     * Inicia medição de performance
     * @param {string} operation - Nome da operação
     * @param {Object} context - Contexto adicional
     * @returns {string} ID da medição
     */
    startMeasurement(operation, context = {}) {
        if (!this.isEnabled) return null;

        const measurementId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();

        this.metrics.set(measurementId, {
            operation,
            context,
            startTime,
            startMemory: this._getMemoryUsage(),
            endTime: null,
            endMemory: null,
            duration: null,
            status: 'running',
        });

        return measurementId;
    }

    /**
     * Finaliza medição de performance
     * @param {string} measurementId - ID da medição
     * @param {Object} result - Resultado da operação
     */
    endMeasurement(measurementId, result = {}) {
        if (!measurementId || !this.metrics.has(measurementId)) return;

        const measurement = this.metrics.get(measurementId);
        const endTime = performance.now();
        const endMemory = this._getMemoryUsage();

        measurement.endTime = endTime;
        measurement.endMemory = endMemory;
        measurement.duration = endTime - measurement.startTime;
        measurement.memoryDelta = endMemory - measurement.startMemory;
        measurement.result = result;
        measurement.status = 'completed';

        // Verificar se excedeu thresholds
        const threshold = this.thresholds[measurement.operation] || this.thresholds.total;
        measurement.isSlowOperation = measurement.duration > threshold;

        if (measurement.isSlowOperation) {
            console.warn(`🐌 Operação lenta detectada: ${measurement.operation}`, {
                duration: `${measurement.duration.toFixed(2)}ms`,
                threshold: `${threshold}ms`,
                context: measurement.context,
            });
        }

        this._recordSession(measurement);
    }

    /**
     * Mede uma função automaticamente
     * @param {string} operation - Nome da operação
     * @param {Function} fn - Função a ser medida
     * @param {Object} context - Contexto adicional
     * @returns {Promise|any} Resultado da função
     */
    async measureFunction(operation, fn, context = {}) {
        const measurementId = this.startMeasurement(operation, context);

        try {
            const result = await fn();
            this.endMeasurement(measurementId, { success: true, result });
            return result;
        } catch (error) {
            this.endMeasurement(measurementId, { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * Obtém estatísticas de performance
     * @param {string} operation - Operação específica (opcional)
     * @returns {Object} Estatísticas
     */
    getStats(operation = null) {
        const relevantSessions = operation
            ? this.sessions.filter((s) => s.operation === operation)
            : this.sessions;

        if (relevantSessions.length === 0) {
            return { count: 0, average: 0, min: 0, max: 0, slowOperations: 0 };
        }

        const durations = relevantSessions.map((s) => s.duration);
        const slowOperations = relevantSessions.filter((s) => s.isSlowOperation).length;

        return {
            count: relevantSessions.length,
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            slowOperations,
            slowPercentage: (slowOperations / relevantSessions.length) * 100,
            memoryImpact: this._calculateMemoryImpact(relevantSessions),
        };
    }

    /**
     * Gera relatório de performance
     * @returns {Object} Relatório completo
     */
    generateReport() {
        const operations = [...new Set(this.sessions.map((s) => s.operation))];
        const report = {
            timestamp: new Date().toISOString(),
            totalMeasurements: this.sessions.length,
            operations: {},
            summary: {
                averageDuration: 0,
                slowOperationsTotal: 0,
                memoryLeaks: this._detectMemoryLeaks(),
            },
        };

        operations.forEach((op) => {
            report.operations[op] = this.getStats(op);
        });

        // Calcular resumo geral
        const allDurations = this.sessions.map((s) => s.duration);
        report.summary.averageDuration =
            allDurations.length > 0
                ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
                : 0;
        report.summary.slowOperationsTotal = this.sessions.filter((s) => s.isSlowOperation).length;

        return report;
    }

    /**
     * Compara performance entre duas sessões
     * @param {Array} beforeSessions - Sessões antes da otimização
     * @param {Array} afterSessions - Sessões depois da otimização
     * @returns {Object} Comparação
     */
    comparePerformance(beforeSessions, afterSessions) {
        const beforeStats = this._calculateSessionStats(beforeSessions);
        const afterStats = this._calculateSessionStats(afterSessions);

        return {
            improvement: {
                duration: ((beforeStats.average - afterStats.average) / beforeStats.average) * 100,
                slowOperations: beforeStats.slowOperations - afterStats.slowOperations,
                memory: beforeStats.memoryImpact - afterStats.memoryImpact,
            },
            before: beforeStats,
            after: afterStats,
            verdict: this._getPerformanceVerdict(beforeStats, afterStats),
        };
    }

    /**
     * Limpa métricas antigas
     * @param {number} maxAge - Idade máxima em ms (padrão: 5 minutos)
     */
    cleanup(maxAge = 5 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        this.sessions = this.sessions.filter((session) => session.startTime > cutoff);

        // Limpar métricas ativas antigas
        for (const [id, metric] of this.metrics.entries()) {
            if (metric.startTime < cutoff) {
                this.metrics.delete(id);
            }
        }
    }

    // Métodos privados
    _getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1048576; // MB
        }
        return 0;
    }

    _recordSession(measurement) {
        this.sessions.push({
            operation: measurement.operation,
            duration: measurement.duration,
            memoryDelta: measurement.memoryDelta,
            isSlowOperation: measurement.isSlowOperation,
            timestamp: measurement.startTime,
            context: measurement.context,
        });

        // Manter apenas últimas 1000 sessões
        if (this.sessions.length > 1000) {
            this.sessions = this.sessions.slice(-1000);
        }
    }

    _calculateMemoryImpact(sessions) {
        const memoryDeltas = sessions
            .map((s) => s.memoryDelta)
            .filter((delta) => delta !== undefined && delta !== null);

        if (memoryDeltas.length === 0) return 0;

        return memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length;
    }

    _detectMemoryLeaks() {
        const recentSessions = this.sessions.slice(-50); // Últimas 50 operações
        const memoryGrowth = recentSessions
            .filter((s) => s.memoryDelta > 0)
            .reduce((total, s) => total + s.memoryDelta, 0);

        return {
            suspectedLeak: memoryGrowth > 10, // 10MB de crescimento
            totalGrowth: memoryGrowth,
            affectedOperations: recentSessions
                .filter((s) => s.memoryDelta > 1)
                .map((s) => s.operation),
        };
    }

    _calculateSessionStats(sessions) {
        if (sessions.length === 0) {
            return { average: 0, slowOperations: 0, memoryImpact: 0 };
        }

        const durations = sessions.map((s) => s.duration);
        return {
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            slowOperations: sessions.filter((s) => s.isSlowOperation).length,
            memoryImpact: this._calculateMemoryImpact(sessions),
        };
    }

    _getPerformanceVerdict(before, after) {
        const improvement = ((before.average - after.average) / before.average) * 100;

        if (improvement > 20) return 'Excelente melhoria';
        if (improvement > 10) return 'Boa melhoria';
        if (improvement > 5) return 'Melhoria moderada';
        if (improvement > 0) return 'Pequena melhoria';
        return 'Sem melhoria significativa';
    }
}

// Instância global do profiler
const performanceProfiler = new PerformanceProfiler();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.performanceProfiler = performanceProfiler;
}

export default performanceProfiler;
