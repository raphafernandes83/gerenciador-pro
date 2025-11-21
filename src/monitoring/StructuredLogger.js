/**
 * Sistema de Logs Estruturados
 * Fornece logging avançado com níveis, contexto e formatação consistente
 */

class StructuredLogger {
    constructor() {
        this.logLevel = this._getLogLevel();
        this.sessionId = this._generateSessionId();
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.logLevels = {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            FATAL: 5,
        };
        this.config = {
            enableConsole: true,
            enableBuffer: true,
            enableRemote: false,
            remoteEndpoint: null,
            batchSize: 50,
            flushInterval: 30000, // 30 segundos
            includeStackTrace: true,
            includeUserAgent: true,
            includeTimestamp: true,
        };

        this._setupAutoFlush();
        this._setupErrorCapture();
    }

    /**
     * Log de nível TRACE - detalhes muito específicos
     * @param {string} message - Mensagem do log
     * @param {Object} context - Contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    trace(message, context = {}, metadata = {}) {
        this._log('TRACE', message, context, metadata);
    }

    /**
     * Log de nível DEBUG - informações de debugging
     * @param {string} message - Mensagem do log
     * @param {Object} context - Contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    debug(message, context = {}, metadata = {}) {
        this._log('DEBUG', message, context, metadata);
    }

    /**
     * Log de nível INFO - informações gerais
     * @param {string} message - Mensagem do log
     * @param {Object} context - Contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    info(message, context = {}, metadata = {}) {
        this._log('INFO', message, context, metadata);
    }

    /**
     * Log de nível WARN - avisos importantes
     * @param {string} message - Mensagem do log
     * @param {Object} context - Contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    warn(message, context = {}, metadata = {}) {
        this._log('WARN', message, context, metadata);
    }

    /**
     * Log de nível ERROR - erros recuperáveis
     * @param {string} message - Mensagem do log
     * @param {Error|Object} context - Erro ou contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    error(message, context = {}, metadata = {}) {
        // Se context é um Error, extrair informações úteis
        if (context instanceof Error) {
            context = this._extractErrorInfo(context);
        }
        this._log('ERROR', message, context, metadata);
    }

    /**
     * Log de nível FATAL - erros críticos que podem parar o sistema
     * @param {string} message - Mensagem do log
     * @param {Error|Object} context - Erro ou contexto adicional
     * @param {Object} metadata - Metadados opcionais
     */
    fatal(message, context = {}, metadata = {}) {
        if (context instanceof Error) {
            context = this._extractErrorInfo(context);
        }
        this._log('FATAL', message, context, metadata);

        // Para logs FATAL, tentar flush imediato
        this.flush();
    }

    /**
     * Log de performance com métricas específicas
     * @param {string} operation - Nome da operação
     * @param {number} duration - Duração em ms
     * @param {Object} metrics - Métricas adicionais
     * @param {Object} context - Contexto da operação
     */
    performance(operation, duration, metrics = {}, context = {}) {
        this._log(
            'INFO',
            `Performance: ${operation}`,
            {
                operation,
                duration,
                metrics: {
                    ...metrics,
                    timestamp: Date.now(),
                    memoryUsage: this._getMemoryUsage(),
                    userAgent: navigator.userAgent,
                },
                ...context,
            },
            {
                category: 'performance',
                tags: ['performance', operation],
            }
        );
    }

    /**
     * Log de evento de usuário
     * @param {string} event - Nome do evento
     * @param {Object} data - Dados do evento
     * @param {Object} context - Contexto adicional
     */
    userEvent(event, data = {}, context = {}) {
        this._log(
            'INFO',
            `User Event: ${event}`,
            {
                event,
                data,
                userId: this._getUserId(),
                sessionId: this.sessionId,
                timestamp: Date.now(),
                url: window.location.href,
                ...context,
            },
            {
                category: 'user_event',
                tags: ['user', 'event', event],
            }
        );
    }

    /**
     * Log de erro de sistema com contexto completo
     * @param {Error} error - Objeto de erro
     * @param {Object} context - Contexto adicional
     * @param {string} severity - Severidade (low, medium, high, critical)
     */
    systemError(error, context = {}, severity = 'medium') {
        const errorInfo = this._extractErrorInfo(error);

        this._log(
            'ERROR',
            `System Error: ${error.message}`,
            {
                ...errorInfo,
                severity,
                systemInfo: this._getSystemInfo(),
                ...context,
            },
            {
                category: 'system_error',
                tags: ['system', 'error', severity],
                alert: severity === 'critical' || severity === 'high',
            }
        );
    }

    /**
     * Obtém logs do buffer com filtros opcionais
     * @param {Object} filters - Filtros para aplicar
     * @returns {Array} Logs filtrados
     */
    getLogs(filters = {}) {
        let logs = [...this.logBuffer];

        if (filters.level) {
            const minLevel = this.logLevels[filters.level.toUpperCase()];
            logs = logs.filter((log) => this.logLevels[log.level] >= minLevel);
        }

        if (filters.category) {
            logs = logs.filter((log) => log.metadata?.category === filters.category);
        }

        if (filters.tags) {
            const filterTags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
            logs = logs.filter((log) =>
                log.metadata?.tags?.some((tag) => filterTags.includes(tag))
            );
        }

        if (filters.since) {
            logs = logs.filter((log) => log.timestamp >= filters.since);
        }

        if (filters.limit) {
            logs = logs.slice(-filters.limit);
        }

        return logs;
    }

    /**
     * Exporta logs em formato JSON
     * @param {Object} filters - Filtros para aplicar
     * @returns {string} JSON com os logs
     */
    exportLogs(filters = {}) {
        const logs = this.getLogs(filters);
        return JSON.stringify(
            {
                sessionId: this.sessionId,
                exportedAt: new Date().toISOString(),
                totalLogs: logs.length,
                logs,
            },
            null,
            2
        );
    }

    /**
     * Força o flush dos logs para destinos configurados
     */
    async flush() {
        if (this.logBuffer.length === 0) return;

        try {
            // Flush para endpoint remoto se configurado
            if (this.config.enableRemote && this.config.remoteEndpoint) {
                await this._flushToRemote();
            }

            // Flush para localStorage como backup
            this._flushToLocalStorage();
        } catch (error) {
            console.error('Erro ao fazer flush dos logs:', error);
        }
    }

    /**
     * Limpa o buffer de logs
     */
    clearBuffer() {
        this.logBuffer = [];
    }

    /**
     * Configura o logger
     * @param {Object} newConfig - Nova configuração
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Reconfigurar nível de log se necessário
        if (newConfig.logLevel) {
            this.logLevel = this.logLevels[newConfig.logLevel.toUpperCase()] || this.logLevel;
        }
    }

    /**
     * Obtém estatísticas dos logs
     * @returns {Object} Estatísticas
     */
    getStats() {
        const stats = {
            totalLogs: this.logBuffer.length,
            sessionId: this.sessionId,
            logLevelDistribution: {},
            categoryDistribution: {},
            recentErrors: 0,
            memoryUsage: this._estimateBufferSize(),
        };

        // Distribuição por nível
        Object.keys(this.logLevels).forEach((level) => {
            stats.logLevelDistribution[level] = this.logBuffer.filter(
                (log) => log.level === level
            ).length;
        });

        // Distribuição por categoria
        this.logBuffer.forEach((log) => {
            const category = log.metadata?.category || 'uncategorized';
            stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1;
        });

        // Erros recentes (últimos 5 minutos)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        stats.recentErrors = this.logBuffer.filter(
            (log) =>
                log.timestamp >= fiveMinutesAgo && (log.level === 'ERROR' || log.level === 'FATAL')
        ).length;

        return stats;
    }

    // Métodos privados
    _log(level, message, context, metadata) {
        const levelNum = this.logLevels[level];

        // Verificar se deve logar baseado no nível
        if (levelNum < this.logLevel) return;

        const logEntry = {
            timestamp: Date.now(),
            level,
            message,
            context: this._sanitizeContext(context),
            metadata: {
                sessionId: this.sessionId,
                url: window.location.href,
                userAgent: this.config.includeUserAgent ? navigator.userAgent : undefined,
                ...metadata,
            },
        };

        // Adicionar stack trace se configurado e for erro
        if (this.config.includeStackTrace && (level === 'ERROR' || level === 'FATAL')) {
            logEntry.stackTrace = this._getStackTrace();
        }

        // Adicionar ao buffer se habilitado
        if (this.config.enableBuffer) {
            this._addToBuffer(logEntry);
        }

        // Log no console se habilitado
        if (this.config.enableConsole) {
            this._logToConsole(logEntry);
        }

        // Disparar evento para listeners
        this._dispatchLogEvent(logEntry);
    }

    _addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);

        // Manter tamanho do buffer
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
        }
    }

    _logToConsole(logEntry) {
        const { level, message, context } = logEntry;
        const timestamp = new Date(logEntry.timestamp).toISOString();
        const prefix = `[${timestamp}] [${level}] [${this.sessionId.slice(0, 8)}]`;

        switch (level) {
            case 'TRACE':
            case 'DEBUG':
                console.debug(`${prefix} ${message}`, context);
                break;
            case 'INFO':
                console.info(`${prefix} ${message}`, context);
                break;
            case 'WARN':
                console.warn(`${prefix} ${message}`, context);
                break;
            case 'ERROR':
            case 'FATAL':
                console.error(`${prefix} ${message}`, context);
                break;
            default:
                console.log(`${prefix} ${message}`, context);
        }
    }

    _dispatchLogEvent(logEntry) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('structuredLog', {
                detail: logEntry,
            });
            window.dispatchEvent(event);
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
        };
    }

    _sanitizeContext(context) {
        // Remover dados sensíveis e circular references
        try {
            return JSON.parse(JSON.stringify(context));
        } catch (error) {
            return { error: 'Failed to serialize context', original: String(context) };
        }
    }

    _getStackTrace() {
        try {
            throw new Error();
        } catch (error) {
            return error.stack;
        }
    }

    _getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
            };
        }
        return null;
    }

    _getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            memory: this._getMemoryUsage(),
        };
    }

    _getUserId() {
        // Tentar obter ID do usuário de várias fontes
        return localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
    }

    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getLogLevel() {
        // Determinar nível de log baseado no ambiente
        const urlParams = new URLSearchParams(window.location.search);
        const urlLevel = urlParams.get('logLevel');

        if (urlLevel && this.logLevels[urlLevel.toUpperCase()]) {
            return this.logLevels[urlLevel.toUpperCase()];
        }

        // Padrão baseado no hostname
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return this.logLevels.DEBUG;
        }

        return this.logLevels.INFO;
    }

    _setupAutoFlush() {
        // Flush automático em intervalos
        setInterval(() => {
            if (this.logBuffer.length >= this.config.batchSize) {
                this.flush();
            }
        }, this.config.flushInterval);

        // Flush antes de sair da página
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    _setupErrorCapture() {
        // Capturar erros não tratados
        window.addEventListener('error', (event) => {
            this.systemError(
                event.error || new Error(event.message),
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    type: 'unhandled_error',
                },
                'high'
            );
        });

        // Capturar promises rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            this.systemError(
                new Error(event.reason),
                {
                    type: 'unhandled_promise_rejection',
                    reason: event.reason,
                },
                'high'
            );
        });
    }

    async _flushToRemote() {
        const logs = this.logBuffer.slice();

        try {
            const response = await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    logs,
                    timestamp: Date.now(),
                }),
            });

            if (response.ok) {
                // Limpar logs enviados com sucesso
                this.logBuffer = this.logBuffer.slice(logs.length);
            }
        } catch (error) {
            console.error('Erro ao enviar logs para endpoint remoto:', error);
        }
    }

    _flushToLocalStorage() {
        try {
            const key = `logs_${this.sessionId}`;
            const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
            const allLogs = [...existingLogs, ...this.logBuffer];

            // Manter apenas os últimos 500 logs no localStorage
            const logsToStore = allLogs.slice(-500);

            localStorage.setItem(key, JSON.stringify(logsToStore));
        } catch (error) {
            console.warn('Não foi possível salvar logs no localStorage:', error);
        }
    }

    _estimateBufferSize() {
        try {
            return new Blob([JSON.stringify(this.logBuffer)]).size;
        } catch (error) {
            return this.logBuffer.length * 200; // Estimativa
        }
    }
}

// Instância global do logger
const structuredLogger = new StructuredLogger();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.structuredLogger = structuredLogger;
}

export default structuredLogger;
