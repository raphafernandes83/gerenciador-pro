/**
 * Sistema de Error Tracking Avançado
 * Rastreia, categoriza e analisa erros com contexto detalhado
 */

import structuredLogger from './StructuredLogger.js';

class ErrorTracker {
    constructor() {
        this.errors = [];
        this.errorPatterns = new Map();
        this.maxErrors = 1000;
        this.config = {
            enableAutoCapture: true,
            enablePatternDetection: true,
            enableContextCapture: true,
            enableUserFeedback: true,
            enableRecoveryTracking: true,
            alertThreshold: 5, // Alertar após 5 erros similares
            timeWindow: 300000, // 5 minutos para agrupamento
        };

        this.errorCategories = {
            NETWORK: 'network',
            VALIDATION: 'validation',
            RUNTIME: 'runtime',
            UI: 'ui',
            PERFORMANCE: 'performance',
            SECURITY: 'security',
            BUSINESS_LOGIC: 'business_logic',
            INTEGRATION: 'integration',
            UNKNOWN: 'unknown',
        };

        this.severityLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical',
        };

        if (this.config.enableAutoCapture) {
            this._setupAutoCapture();
        }
    }

    /**
     * Rastreia um erro com contexto completo
     * @param {Error} error - Objeto de erro
     * @param {Object} context - Contexto adicional
     * @param {Object} options - Opções de tracking
     */
    trackError(error, context = {}, options = {}) {
        const {
            category = this._categorizeError(error),
            severity = this._calculateSeverity(error, context),
            recoverable = true,
            userImpact = 'unknown',
            tags = [],
        } = options;

        const errorEntry = {
            id: this._generateErrorId(),
            timestamp: Date.now(),
            error: this._extractErrorInfo(error),
            context: this._enrichContext(context),
            category,
            severity,
            recoverable,
            userImpact,
            tags: [...tags, category, severity],
            fingerprint: this._generateFingerprint(error),
            sessionInfo: this._getSessionInfo(),
            environmentInfo: this._getEnvironmentInfo(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this._getUserId(),
            breadcrumbs: this._getBreadcrumbs(),
            recovery: null, // Será preenchido se houver recuperação
        };

        // Adicionar à lista de erros
        this._addError(errorEntry);

        // Detectar padrões
        if (this.config.enablePatternDetection) {
            this._detectPatterns(errorEntry);
        }

        // Log estruturado
        structuredLogger.systemError(
            error,
            {
                errorId: errorEntry.id,
                category,
                severity,
                userImpact,
                ...context,
            },
            severity
        );

        // Disparar evento
        this._dispatchErrorEvent(errorEntry);

        return errorEntry.id;
    }

    /**
     * Rastreia erro de rede
     * @param {Error} error - Erro de rede
     * @param {Object} requestInfo - Informações da requisição
     */
    trackNetworkError(error, requestInfo = {}) {
        return this.trackError(
            error,
            {
                type: 'network_error',
                requestInfo: {
                    url: requestInfo.url,
                    method: requestInfo.method,
                    status: requestInfo.status,
                    statusText: requestInfo.statusText,
                    headers: requestInfo.headers,
                    timeout: requestInfo.timeout,
                },
            },
            {
                category: this.errorCategories.NETWORK,
                severity: this._getNetworkErrorSeverity(requestInfo.status),
                tags: ['network', 'api', requestInfo.method?.toLowerCase()],
            }
        );
    }

    /**
     * Rastreia erro de validação
     * @param {string} field - Campo com erro
     * @param {string} message - Mensagem de erro
     * @param {*} value - Valor inválido
     * @param {Object} context - Contexto adicional
     */
    trackValidationError(field, message, value, context = {}) {
        const error = new Error(`Validation error in field '${field}': ${message}`);

        return this.trackError(
            error,
            {
                type: 'validation_error',
                field,
                value,
                validationRule: context.rule,
                formData: context.formData,
                ...context,
            },
            {
                category: this.errorCategories.VALIDATION,
                severity: this.severityLevels.LOW,
                userImpact: 'form_submission_blocked',
                tags: ['validation', 'form', field],
            }
        );
    }

    /**
     * Rastreia erro de performance
     * @param {string} operation - Operação lenta
     * @param {number} duration - Duração em ms
     * @param {number} threshold - Threshold esperado
     * @param {Object} context - Contexto adicional
     */
    trackPerformanceError(operation, duration, threshold, context = {}) {
        const error = new Error(
            `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`
        );

        return this.trackError(
            error,
            {
                type: 'performance_error',
                operation,
                duration,
                threshold,
                slowRatio: duration / threshold,
                ...context,
            },
            {
                category: this.errorCategories.PERFORMANCE,
                severity: this._getPerformanceSeverity(duration, threshold),
                userImpact: 'slow_response',
                tags: ['performance', 'slow', operation],
            }
        );
    }

    /**
     * Marca um erro como recuperado
     * @param {string} errorId - ID do erro
     * @param {Object} recoveryInfo - Informações da recuperação
     */
    markAsRecovered(errorId, recoveryInfo = {}) {
        const error = this.errors.find((e) => e.id === errorId);
        if (error) {
            error.recovery = {
                timestamp: Date.now(),
                method: recoveryInfo.method || 'unknown',
                success: recoveryInfo.success !== false,
                duration: recoveryInfo.duration,
                details: recoveryInfo.details,
            };

            structuredLogger.info(
                'Error recovered',
                {
                    errorId,
                    originalError: error.error.message,
                    recoveryMethod: error.recovery.method,
                    recoveryDuration: error.recovery.duration,
                },
                {
                    category: 'error_recovery',
                    tags: ['recovery', 'success'],
                }
            );
        }
    }

    /**
     * Obtém estatísticas de erros
     * @param {Object} filters - Filtros para aplicar
     * @returns {Object} Estatísticas
     */
    getErrorStats(filters = {}) {
        const filteredErrors = this._filterErrors(filters);

        const stats = {
            total: filteredErrors.length,
            byCategory: {},
            bySeverity: {},
            byUserImpact: {},
            recoveryRate: 0,
            topErrors: [],
            recentTrends: this._calculateTrends(filteredErrors),
            patterns: this._getPatternStats(),
        };

        // Distribuição por categoria
        Object.values(this.errorCategories).forEach((category) => {
            stats.byCategory[category] = filteredErrors.filter(
                (e) => e.category === category
            ).length;
        });

        // Distribuição por severidade
        Object.values(this.severityLevels).forEach((severity) => {
            stats.bySeverity[severity] = filteredErrors.filter(
                (e) => e.severity === severity
            ).length;
        });

        // Distribuição por impacto no usuário
        const userImpacts = [...new Set(filteredErrors.map((e) => e.userImpact))];
        userImpacts.forEach((impact) => {
            stats.byUserImpact[impact] = filteredErrors.filter(
                (e) => e.userImpact === impact
            ).length;
        });

        // Taxa de recuperação
        const recoveredErrors = filteredErrors.filter((e) => e.recovery && e.recovery.success);
        stats.recoveryRate =
            filteredErrors.length > 0 ? (recoveredErrors.length / filteredErrors.length) * 100 : 0;

        // Top erros por frequência
        const errorGroups = this._groupErrorsByFingerprint(filteredErrors);
        stats.topErrors = Object.entries(errorGroups)
            .map(([fingerprint, errors]) => ({
                fingerprint,
                count: errors.length,
                message: errors[0].error.message,
                category: errors[0].category,
                severity: errors[0].severity,
                lastOccurrence: Math.max(...errors.map((e) => e.timestamp)),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }

    /**
     * Obtém relatório detalhado de erros
     * @param {Object} options - Opções do relatório
     * @returns {Object} Relatório completo
     */
    generateErrorReport(options = {}) {
        const {
            includeStackTraces = false,
            includeBreadcrumbs = true,
            includeContext = true,
            timeRange = 24 * 60 * 60 * 1000, // 24 horas
        } = options;

        const since = Date.now() - timeRange;
        const recentErrors = this.errors.filter((e) => e.timestamp >= since);

        const report = {
            generatedAt: new Date().toISOString(),
            timeRange: {
                since: new Date(since).toISOString(),
                until: new Date().toISOString(),
            },
            summary: this.getErrorStats({ since }),
            criticalErrors: recentErrors.filter((e) => e.severity === 'critical'),
            unrecoveredErrors: recentErrors.filter((e) => !e.recovery || !e.recovery.success),
            patterns: this._getActivePatterns(),
            recommendations: this._generateRecommendations(recentErrors),
        };

        if (includeStackTraces || includeBreadcrumbs || includeContext) {
            report.detailedErrors = recentErrors.map((error) => ({
                id: error.id,
                timestamp: error.timestamp,
                message: error.error.message,
                category: error.category,
                severity: error.severity,
                stackTrace: includeStackTraces ? error.error.stack : undefined,
                breadcrumbs: includeBreadcrumbs ? error.breadcrumbs : undefined,
                context: includeContext ? error.context : undefined,
            }));
        }

        return report;
    }

    /**
     * Limpa erros antigos
     * @param {number} maxAge - Idade máxima em ms
     */
    cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) {
        // 7 dias
        const cutoff = Date.now() - maxAge;
        this.errors = this.errors.filter((error) => error.timestamp > cutoff);

        // Limpar padrões antigos
        for (const [pattern, data] of this.errorPatterns.entries()) {
            if (data.lastOccurrence < cutoff) {
                this.errorPatterns.delete(pattern);
            }
        }
    }

    // Métodos privados
    _addError(errorEntry) {
        this.errors.push(errorEntry);

        // Manter limite de erros
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
    }

    _extractErrorInfo(error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            fileName: error.fileName,
            lineNumber: error.lineNumber,
            columnNumber: error.columnNumber,
            cause: error.cause,
            toString: error.toString(),
        };
    }

    _enrichContext(context) {
        return {
            ...context,
            timestamp: Date.now(),
            performance: {
                memory: this._getMemoryInfo(),
                timing: this._getPerformanceTiming(),
            },
            dom: {
                activeElement: document.activeElement?.tagName,
                visibilityState: document.visibilityState,
                readyState: document.readyState,
            },
            network: {
                onLine: navigator.onLine,
                connection: navigator.connection
                    ? {
                          effectiveType: navigator.connection.effectiveType,
                          downlink: navigator.connection.downlink,
                          rtt: navigator.connection.rtt,
                      }
                    : null,
            },
        };
    }

    _categorizeError(error) {
        const message = error.message.toLowerCase();
        const stack = (error.stack || '').toLowerCase();

        if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
            return this.errorCategories.NETWORK;
        }

        if (
            message.includes('validation') ||
            message.includes('invalid') ||
            message.includes('required')
        ) {
            return this.errorCategories.VALIDATION;
        }

        if (
            message.includes('permission') ||
            message.includes('unauthorized') ||
            message.includes('forbidden')
        ) {
            return this.errorCategories.SECURITY;
        }

        if (
            message.includes('timeout') ||
            message.includes('slow') ||
            message.includes('performance')
        ) {
            return this.errorCategories.PERFORMANCE;
        }

        if (stack.includes('ui.js') || stack.includes('dom') || message.includes('element')) {
            return this.errorCategories.UI;
        }

        if (stack.includes('logic.js') || stack.includes('business')) {
            return this.errorCategories.BUSINESS_LOGIC;
        }

        if (
            message.includes('api') ||
            message.includes('integration') ||
            message.includes('external')
        ) {
            return this.errorCategories.INTEGRATION;
        }

        return this.errorCategories.RUNTIME;
    }

    _calculateSeverity(error, context) {
        const message = error.message.toLowerCase();

        // Crítico: erros que podem parar o sistema
        if (
            message.includes('fatal') ||
            message.includes('critical') ||
            message.includes('system') ||
            context.critical
        ) {
            return this.severityLevels.CRITICAL;
        }

        // Alto: erros que afetam funcionalidades principais
        if (
            message.includes('failed') ||
            message.includes('cannot') ||
            message.includes('unable') ||
            context.blocking
        ) {
            return this.severityLevels.HIGH;
        }

        // Médio: erros que afetam experiência do usuário
        if (message.includes('warning') || message.includes('deprecated') || context.userVisible) {
            return this.severityLevels.MEDIUM;
        }

        // Baixo: erros menores ou informativos
        return this.severityLevels.LOW;
    }

    _generateFingerprint(error) {
        // Criar fingerprint baseado em características do erro
        const components = [
            error.name,
            error.message.replace(/\d+/g, 'N'), // Substituir números por N
            error.fileName,
            error.lineNumber,
        ].filter(Boolean);

        return btoa(components.join('|')).slice(0, 16);
    }

    _detectPatterns(errorEntry) {
        const pattern = errorEntry.fingerprint;
        const now = Date.now();

        if (!this.errorPatterns.has(pattern)) {
            this.errorPatterns.set(pattern, {
                count: 0,
                firstOccurrence: now,
                lastOccurrence: now,
                errors: [],
            });
        }

        const patternData = this.errorPatterns.get(pattern);
        patternData.count++;
        patternData.lastOccurrence = now;
        patternData.errors.push(errorEntry.id);

        // Manter apenas últimos 10 IDs de erro
        if (patternData.errors.length > 10) {
            patternData.errors = patternData.errors.slice(-10);
        }

        // Alertar se exceder threshold
        if (patternData.count >= this.config.alertThreshold) {
            const timeSinceFirst = now - patternData.firstOccurrence;
            if (timeSinceFirst <= this.config.timeWindow) {
                this._triggerPatternAlert(pattern, patternData, errorEntry);
            }
        }
    }

    _triggerPatternAlert(pattern, patternData, latestError) {
        structuredLogger.warn(
            'Error pattern detected',
            {
                pattern,
                count: patternData.count,
                timeWindow: this.config.timeWindow,
                errorMessage: latestError.error.message,
                category: latestError.category,
                severity: latestError.severity,
            },
            {
                category: 'error_pattern',
                tags: ['pattern', 'alert', 'recurring'],
                alert: true,
            }
        );

        // Disparar evento de alerta
        this._dispatchPatternAlert(pattern, patternData, latestError);
    }

    _setupAutoCapture() {
        // Já configurado no StructuredLogger, mas podemos adicionar handlers específicos

        // Capturar erros de recursos (imagens, scripts, etc.)
        window.addEventListener(
            'error',
            (event) => {
                if (event.target !== window) {
                    this.trackError(
                        new Error(
                            `Resource loading failed: ${event.target.src || event.target.href}`
                        ),
                        {
                            type: 'resource_error',
                            element: event.target.tagName,
                            source: event.target.src || event.target.href,
                        },
                        {
                            category: this.errorCategories.NETWORK,
                            severity: this.severityLevels.MEDIUM,
                            tags: ['resource', 'loading'],
                        }
                    );
                }
            },
            true
        );
    }

    _filterErrors(filters) {
        let errors = [...this.errors];

        if (filters.category) {
            errors = errors.filter((e) => e.category === filters.category);
        }

        if (filters.severity) {
            errors = errors.filter((e) => e.severity === filters.severity);
        }

        if (filters.since) {
            errors = errors.filter((e) => e.timestamp >= filters.since);
        }

        if (filters.recovered !== undefined) {
            errors = errors.filter((e) => !!e.recovery === filters.recovered);
        }

        return errors;
    }

    _groupErrorsByFingerprint(errors) {
        return errors.reduce((groups, error) => {
            const fingerprint = error.fingerprint;
            if (!groups[fingerprint]) {
                groups[fingerprint] = [];
            }
            groups[fingerprint].push(error);
            return groups;
        }, {});
    }

    _calculateTrends(errors) {
        const now = Date.now();
        const hour = 60 * 60 * 1000;
        const trends = {};

        for (let i = 0; i < 24; i++) {
            const start = now - (i + 1) * hour;
            const end = now - i * hour;
            const hourErrors = errors.filter((e) => e.timestamp >= start && e.timestamp < end);
            trends[`${i}h_ago`] = hourErrors.length;
        }

        return trends;
    }

    _getPatternStats() {
        const stats = {
            totalPatterns: this.errorPatterns.size,
            activePatterns: 0,
            criticalPatterns: 0,
        };

        const now = Date.now();
        const activeWindow = 60 * 60 * 1000; // 1 hora

        for (const [pattern, data] of this.errorPatterns.entries()) {
            if (now - data.lastOccurrence <= activeWindow) {
                stats.activePatterns++;
                if (data.count >= this.config.alertThreshold) {
                    stats.criticalPatterns++;
                }
            }
        }

        return stats;
    }

    _getActivePatterns() {
        const now = Date.now();
        const activeWindow = 60 * 60 * 1000; // 1 hora
        const activePatterns = [];

        for (const [pattern, data] of this.errorPatterns.entries()) {
            if (now - data.lastOccurrence <= activeWindow) {
                activePatterns.push({
                    pattern,
                    count: data.count,
                    firstOccurrence: data.firstOccurrence,
                    lastOccurrence: data.lastOccurrence,
                    isCritical: data.count >= this.config.alertThreshold,
                });
            }
        }

        return activePatterns.sort((a, b) => b.count - a.count);
    }

    _generateRecommendations(errors) {
        const recommendations = [];
        const stats = this.getErrorStats();

        // Recomendações baseadas em categorias
        if (stats.byCategory.network > stats.total * 0.3) {
            recommendations.push({
                type: 'network',
                priority: 'high',
                message:
                    'Alto número de erros de rede detectados. Considere implementar retry automático e melhor tratamento de conectividade.',
                action: 'Implementar retry policy e offline handling',
            });
        }

        if (stats.byCategory.validation > stats.total * 0.2) {
            recommendations.push({
                type: 'validation',
                priority: 'medium',
                message:
                    'Muitos erros de validação. Considere melhorar validação client-side e mensagens de erro.',
                action: 'Melhorar validação de formulários',
            });
        }

        if (stats.bySeverity.critical > 0) {
            recommendations.push({
                type: 'critical',
                priority: 'critical',
                message: `${stats.bySeverity.critical} erro(s) crítico(s) detectado(s). Ação imediata necessária.`,
                action: 'Investigar e corrigir erros críticos imediatamente',
            });
        }

        if (stats.recoveryRate < 50) {
            recommendations.push({
                type: 'recovery',
                priority: 'medium',
                message: `Taxa de recuperação baixa (${stats.recoveryRate.toFixed(1)}%). Considere implementar mais mecanismos de recuperação automática.`,
                action: 'Implementar recovery automático',
            });
        }

        return recommendations;
    }

    _getNetworkErrorSeverity(status) {
        if (status >= 500) return this.severityLevels.HIGH;
        if (status >= 400) return this.severityLevels.MEDIUM;
        return this.severityLevels.LOW;
    }

    _getPerformanceSeverity(duration, threshold) {
        const ratio = duration / threshold;
        if (ratio > 5) return this.severityLevels.HIGH;
        if (ratio > 2) return this.severityLevels.MEDIUM;
        return this.severityLevels.LOW;
    }

    _generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getSessionInfo() {
        return {
            sessionId: structuredLogger.sessionId,
            startTime: performance.timing?.navigationStart,
            duration: Date.now() - (performance.timing?.navigationStart || Date.now()),
        };
    }

    _getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        };
    }

    _getUserId() {
        return localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
    }

    _getBreadcrumbs() {
        // Implementação simplificada - em produção seria mais robusta
        return [
            {
                timestamp: Date.now(),
                category: 'navigation',
                message: `Current page: ${window.location.pathname}`,
                data: { url: window.location.href },
            },
        ];
    }

    _getMemoryInfo() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
            };
        }
        return null;
    }

    _getPerformanceTiming() {
        if (performance.timing) {
            const timing = performance.timing;
            return {
                navigationStart: timing.navigationStart,
                loadEventEnd: timing.loadEventEnd,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
            };
        }
        return null;
    }

    _dispatchErrorEvent(errorEntry) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('errorTracked', {
                detail: errorEntry,
            });
            window.dispatchEvent(event);
        }
    }

    _dispatchPatternAlert(pattern, patternData, latestError) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('errorPatternAlert', {
                detail: { pattern, patternData, latestError },
            });
            window.dispatchEvent(event);
        }
    }
}

// Instância global do error tracker
const errorTracker = new ErrorTracker();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.errorTracker = errorTracker;
}

export default errorTracker;
