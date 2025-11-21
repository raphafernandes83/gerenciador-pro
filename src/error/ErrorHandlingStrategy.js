/**
 * 🛡️ ESTRATÉGIA DE TRATAMENTO DE ERROS
 * Sistema robusto para captura, classificação e recuperação de erros
 *
 * @module ErrorHandlingStrategy
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

/**
 * Tipos de erro classificados por severidade e contexto
 */
export const ERROR_TYPES = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
};

/**
 * Categorias de erro por contexto funcional
 */
export const ERROR_CATEGORIES = {
    DOM_MANIPULATION: 'dom_manipulation',
    DATA_VALIDATION: 'data_validation',
    NETWORK_REQUEST: 'network_request',
    CALCULATION: 'calculation',
    UI_RENDERING: 'ui_rendering',
    STATE_MANAGEMENT: 'state_management',
    CONFIGURATION: 'configuration',
    PERFORMANCE: 'performance',
};

/**
 * Estratégias de recuperação automática
 */
export const RECOVERY_STRATEGIES = {
    RETRY: 'retry',
    FALLBACK: 'fallback',
    GRACEFUL_DEGRADATION: 'graceful_degradation',
    USER_NOTIFICATION: 'user_notification',
    SILENT_FAIL: 'silent_fail',
    ESCALATE: 'escalate',
};

/**
 * Configuração de tratamento por tipo de erro
 */
export const ERROR_HANDLING_CONFIG = {
    [ERROR_CATEGORIES.DOM_MANIPULATION]: {
        type: ERROR_TYPES.HIGH,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        retryCount: 2,
        fallbackAction: 'useAlternativeElement',
        logLevel: 'warn',
        userNotification: false,
    },

    [ERROR_CATEGORIES.DATA_VALIDATION]: {
        type: ERROR_TYPES.MEDIUM,
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        retryCount: 0,
        fallbackAction: 'useDefaultValue',
        logLevel: 'warn',
        userNotification: true,
    },

    [ERROR_CATEGORIES.NETWORK_REQUEST]: {
        type: ERROR_TYPES.HIGH,
        strategy: RECOVERY_STRATEGIES.RETRY,
        retryCount: 3,
        fallbackAction: 'useCachedData',
        logLevel: 'error',
        userNotification: true,
    },

    [ERROR_CATEGORIES.CALCULATION]: {
        type: ERROR_TYPES.CRITICAL,
        strategy: RECOVERY_STRATEGIES.ESCALATE,
        retryCount: 1,
        fallbackAction: 'preventCalculation',
        logLevel: 'error',
        userNotification: true,
    },

    [ERROR_CATEGORIES.UI_RENDERING]: {
        type: ERROR_TYPES.MEDIUM,
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        retryCount: 1,
        fallbackAction: 'hideComponent',
        logLevel: 'warn',
        userNotification: false,
    },

    [ERROR_CATEGORIES.STATE_MANAGEMENT]: {
        type: ERROR_TYPES.HIGH,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        retryCount: 2,
        fallbackAction: 'resetToDefault',
        logLevel: 'error',
        userNotification: false,
    },

    [ERROR_CATEGORIES.CONFIGURATION]: {
        type: ERROR_TYPES.HIGH,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        retryCount: 0,
        fallbackAction: 'useDefaultConfig',
        logLevel: 'error',
        userNotification: true,
    },

    [ERROR_CATEGORIES.PERFORMANCE]: {
        type: ERROR_TYPES.LOW,
        strategy: RECOVERY_STRATEGIES.SILENT_FAIL,
        retryCount: 0,
        fallbackAction: 'none',
        logLevel: 'info',
        userNotification: false,
    },
};

/**
 * Classe principal para gerenciamento de erros
 */
export class ErrorHandler {
    constructor(options = {}) {
        this.config = { ...ERROR_HANDLING_CONFIG, ...options.config };
        this.retryDelays = options.retryDelays || [100, 500, 1000];
        this.maxRetryAttempts = options.maxRetryAttempts || 3;
        this.errorLog = [];
        this.recoveryActions = new Map();
        this.onErrorCallbacks = new Map();

        this._initializeDefaultRecoveryActions();
    }

    /**
     * Manipula erro de forma robusta e inteligente
     *
     * @param {Error} error - Erro capturado
     * @param {string} category - Categoria do erro
     * @param {Object} context - Contexto adicional
     * @returns {Promise<any>} Resultado da estratégia de recuperação
     */
    async handleError(error, category, context = {}) {
        const errorId = this._generateErrorId();
        const timestamp = new Date().toISOString();

        const errorEntry = {
            id: errorId,
            timestamp,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            category,
            context,
            resolved: false,
            recoveryAttempts: 0,
        };

        this.errorLog.push(errorEntry);

        try {
            const result = await this._executeRecoveryStrategy(errorEntry);
            errorEntry.resolved = true;
            errorEntry.resolution = result;

            this._logError(errorEntry);
            this._notifyErrorCallbacks(errorEntry);

            return result;
        } catch (recoveryError) {
            errorEntry.recoveryError = {
                name: recoveryError.name,
                message: recoveryError.message,
                stack: recoveryError.stack,
            };

            this._logError(errorEntry);
            this._escalateError(errorEntry);

            throw recoveryError;
        }
    }

    /**
     * Wrapper para execução segura de funções
     *
     * @param {Function} fn - Função a ser executada
     * @param {string} category - Categoria de erro
     * @param {Object} context - Contexto adicional
     * @returns {Promise<any>} Resultado ou erro tratado
     */
    async safeExecute(fn, category, context = {}) {
        try {
            const result = await fn();
            return { success: true, data: result };
        } catch (error) {
            const recoveryResult = await this.handleError(error, category, context);
            return {
                success: false,
                error,
                recovery: recoveryResult,
                fallback: true,
            };
        }
    }

    /**
     * Cria boundary de erro para isolar falhas
     *
     * @param {Function} fn - Função a ser isolada
     * @param {string} category - Categoria de erro
     * @param {Object} fallbackValue - Valor de fallback
     * @returns {Function} Função com boundary aplicado
     */
    createErrorBoundary(fn, category, fallbackValue = null) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                console.warn(`Error boundary ativado para ${category}:`, error);

                const recovery = await this.handleError(error, category, {
                    function: fn.name,
                    arguments: args,
                });

                return recovery || fallbackValue;
            }
        };
    }

    /**
     * Registra ação de recuperação personalizada
     *
     * @param {string} category - Categoria de erro
     * @param {Function} action - Ação de recuperação
     */
    registerRecoveryAction(category, action) {
        this.recoveryActions.set(category, action);
    }

    /**
     * Registra callback para notificação de erros
     *
     * @param {string} category - Categoria de erro
     * @param {Function} callback - Função de callback
     */
    onError(category, callback) {
        if (!this.onErrorCallbacks.has(category)) {
            this.onErrorCallbacks.set(category, []);
        }
        this.onErrorCallbacks.get(category).push(callback);
    }

    /**
     * Obtém estatísticas de erros
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getErrorStatistics() {
        const total = this.errorLog.length;
        const resolved = this.errorLog.filter((e) => e.resolved).length;

        const byCategory = this.errorLog.reduce((acc, error) => {
            acc[error.category] = (acc[error.category] || 0) + 1;
            return acc;
        }, {});

        const byType = this.errorLog.reduce((acc, error) => {
            const config = this.config[error.category];
            const type = config ? config.type : ERROR_TYPES.MEDIUM;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            resolved,
            unresolved: total - resolved,
            resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(2) : 0,
            byCategory,
            byType,
            recentErrors: this.errorLog.slice(-10),
        };
    }

    /**
     * Executa estratégia de recuperação baseada na configuração
     *
     * @private
     * @param {Object} errorEntry - Entrada do log de erro
     * @returns {Promise<any>} Resultado da recuperação
     */
    async _executeRecoveryStrategy(errorEntry) {
        const config =
            this.config[errorEntry.category] || this.config[ERROR_CATEGORIES.UI_RENDERING];
        const strategy = config.strategy;

        errorEntry.recoveryAttempts++;

        switch (strategy) {
            case RECOVERY_STRATEGIES.RETRY:
                return await this._retryOperation(errorEntry, config);

            case RECOVERY_STRATEGIES.FALLBACK:
                return await this._executeFallback(errorEntry, config);

            case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
                return await this._gracefulDegradation(errorEntry, config);

            case RECOVERY_STRATEGIES.USER_NOTIFICATION:
                return await this._notifyUser(errorEntry, config);

            case RECOVERY_STRATEGIES.SILENT_FAIL:
                return this._silentFail(errorEntry, config);

            case RECOVERY_STRATEGIES.ESCALATE:
                return this._escalateError(errorEntry);

            default:
                throw new Error(`Estratégia de recuperação não reconhecida: ${strategy}`);
        }
    }

    /**
     * Executa retry com backoff exponencial
     *
     * @private
     */
    async _retryOperation(errorEntry, config) {
        if (errorEntry.recoveryAttempts > config.retryCount) {
            throw new Error(`Máximo de tentativas excedido: ${config.retryCount}`);
        }

        const delay =
            this.retryDelays[
                Math.min(errorEntry.recoveryAttempts - 1, this.retryDelays.length - 1)
            ];

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Tenta recuperação automática
        if (this.recoveryActions.has(errorEntry.category)) {
            return await this.recoveryActions.get(errorEntry.category)(errorEntry);
        }

        throw new Error('Nenhuma ação de retry definida');
    }

    /**
     * Executa ação de fallback
     *
     * @private
     */
    async _executeFallback(errorEntry, config) {
        if (this.recoveryActions.has(errorEntry.category)) {
            return await this.recoveryActions.get(errorEntry.category)(errorEntry);
        }

        return config.fallbackAction;
    }

    /**
     * Implementa degradação elegante
     *
     * @private
     */
    async _gracefulDegradation(errorEntry, config) {
        console.warn(`Degradação elegante ativada para: ${errorEntry.category}`);

        if (this.recoveryActions.has(`${errorEntry.category}_degradation`)) {
            return await this.recoveryActions.get(`${errorEntry.category}_degradation`)(errorEntry);
        }

        return { degraded: true, message: 'Funcionalidade temporariamente limitada' };
    }

    /**
     * Notifica usuário sobre erro
     *
     * @private
     */
    async _notifyUser(errorEntry, config) {
        const message = `Erro detectado: ${errorEntry.error.message}. Sistema tentando recuperar...`;

        // Implementação de notificação (toast, modal, etc.)
        console.error(`NOTIFICAÇÃO USUÁRIO: ${message}`);

        return { notified: true, message };
    }

    /**
     * Falha silenciosa com log
     *
     * @private
     */
    _silentFail(errorEntry, config) {
        console.debug(`Falha silenciosa registrada: ${errorEntry.category}`);
        return { silentFail: true };
    }

    /**
     * Escala erro para nível superior
     *
     * @private
     */
    _escalateError(errorEntry) {
        console.error(`ERRO ESCALADO: ${errorEntry.category}`, errorEntry);
        throw new Error(`Erro crítico requer intervenção: ${errorEntry.error.message}`);
    }

    /**
     * Inicializa ações de recuperação padrão
     *
     * @private
     */
    _initializeDefaultRecoveryActions() {
        // Ação para DOM não encontrado
        this.registerRecoveryAction(ERROR_CATEGORIES.DOM_MANIPULATION, async (errorEntry) => {
            console.warn('Tentando recuperação DOM:', errorEntry.context);
            return { recovered: false, message: 'Elemento DOM não pôde ser recuperado' };
        });

        // Ação para dados inválidos
        this.registerRecoveryAction(ERROR_CATEGORIES.DATA_VALIDATION, async (errorEntry) => {
            console.warn('Usando valor padrão para dados inválidos');
            return { recovered: true, defaultValue: null };
        });

        // Ação para falhas de cálculo
        this.registerRecoveryAction(ERROR_CATEGORIES.CALCULATION, async (errorEntry) => {
            console.error('Prevenindo cálculo com dados inválidos');
            return { recovered: false, preventCalculation: true };
        });
    }

    /**
     * Registra erro no log estruturado
     *
     * @private
     */
    _logError(errorEntry) {
        const config = this.config[errorEntry.category];
        const logLevel = config ? config.logLevel : 'error';

        const logMessage = `[${errorEntry.category}] ${errorEntry.error.message}`;

        switch (logLevel) {
            case 'error':
                console.error(logMessage, errorEntry);
                break;
            case 'warn':
                console.warn(logMessage, errorEntry);
                break;
            case 'info':
                console.info(logMessage, errorEntry);
                break;
            default:
                console.log(logMessage, errorEntry);
        }
    }

    /**
     * Notifica callbacks registrados
     *
     * @private
     */
    _notifyErrorCallbacks(errorEntry) {
        const callbacks = this.onErrorCallbacks.get(errorEntry.category) || [];

        callbacks.forEach((callback) => {
            try {
                callback(errorEntry);
            } catch (callbackError) {
                console.error('Erro no callback de notificação:', callbackError);
            }
        });
    }

    /**
     * Gera ID único para erro
     *
     * @private
     */
    _generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Instância global do handler de erros
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Decorators para tratamento automático de erros
 */
export const ErrorBoundary = (category, fallbackValue = null) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = globalErrorHandler.createErrorBoundary(
            originalMethod,
            category,
            fallbackValue
        );

        return descriptor;
    };
};

export default {
    ERROR_TYPES,
    ERROR_CATEGORIES,
    RECOVERY_STRATEGIES,
    ERROR_HANDLING_CONFIG,
    ErrorHandler,
    globalErrorHandler,
    ErrorBoundary,
};
