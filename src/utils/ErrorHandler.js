/**
 * SISTEMA DE TRATAMENTO DE ERROS - GERENCIADOR PRO v9.3
 *
 * Centraliza o tratamento de erros da aplicação
 * Seguindo boas práticas: logging consistente, categorização e recovery
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { ERROR_MESSAGES } from '../constants/AppConstants.js';
import { generateRequestId } from '../utils/SecurityUtils.js';
import { isDevelopment } from '../config/EnvProvider.js';

/**
 * Tipos de erro na aplicação
 * @readonly
 * @enum {string}
 */
export const ERROR_TYPES = {
    VALIDATION: 'validation',
    BUSINESS_LOGIC: 'business_logic',
    DATABASE: 'database',
    NETWORK: 'network',
    UI_RENDER: 'ui_render',
    CALCULATION: 'calculation',
    AUTHENTICATION: 'authentication',
    PERMISSION: 'permission',
    SYSTEM: 'system',
};

/**
 * Níveis de severidade dos erros
 * @readonly
 * @enum {string}
 */
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

/**
 * Classe customizada para erros da aplicação
 * Estende Error nativo com informações adicionais
 */
export class AppError extends Error {
    /**
     * @param {string} message - Mensagem do erro
     * @param {string} type - Tipo do erro (ERROR_TYPES)
     * @param {string} severity - Severidade (ERROR_SEVERITY)
     * @param {Object} context - Contexto adicional
     * @param {Error} originalError - Erro original (se houver)
     */
    constructor(
        message,
        type = ERROR_TYPES.SYSTEM,
        severity = ERROR_SEVERITY.MEDIUM,
        context = {},
        originalError = null
    ) {
        super(message);

        this.name = 'AppError';
        this.type = type;
        this.severity = severity;
        this.context = context;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
        this.userAgent = navigator.userAgent;

        // Mantém stack trace correto
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Converte o erro para objeto serializable
     * @returns {Object} Representação do erro como objeto
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            severity: this.severity,
            context: this.context,
            timestamp: this.timestamp,
            userAgent: this.userAgent,
            stack: this.stack,
            originalError: this.originalError
                ? {
                      name: this.originalError.name,
                      message: this.originalError.message,
                      stack: this.originalError.stack,
                  }
                : null,
        };
    }
}

/**
 * Sistema centralizado de tratamento de erros
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorCallbacks = new Map();

        // Configura handler global para erros não tratados
        this._setupGlobalErrorHandling();
    }

    /**
     * Registra um erro no sistema
     * @param {Error|AppError} error - Erro a ser registrado
     * @param {Object} additionalContext - Contexto adicional
     * @returns {string} ID único do erro registrado
     */
    handleError(error, additionalContext = {}) {
        // Garante Request ID de correlação
        if (!additionalContext.requestId) {
            additionalContext.requestId = generateRequestId('err');
        }
        const appError = this._normalizeError(error, additionalContext);
        const errorId = this._generateErrorId();

        // Adiciona ID ao erro
        appError.id = errorId;

        // Registra no log
        this._logError(appError);

        // Executa callbacks registrados para o tipo de erro
        this._executeErrorCallbacks(appError);

        // Decide se deve mostrar para o usuário
        this._handleUserNotification(appError);

        // Em ambiente de desenvolvimento, loga no console
        if (this._isDevelopment()) {
            console.error('🚨 Erro capturado:', appError.toJSON());
        }

        return errorId;
    }

    /**
     * Registra callback para tipo específico de erro
     * @param {string} errorType - Tipo do erro (ERROR_TYPES)
     * @param {Function} callback - Função a ser executada
     */
    onError(errorType, callback) {
        if (!this.errorCallbacks.has(errorType)) {
            this.errorCallbacks.set(errorType, []);
        }
        this.errorCallbacks.get(errorType).push(callback);
    }

    /**
     * Remove callback para tipo de erro
     * @param {string} errorType - Tipo do erro
     * @param {Function} callback - Função a ser removida
     */
    offError(errorType, callback) {
        if (this.errorCallbacks.has(errorType)) {
            const callbacks = this.errorCallbacks.get(errorType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Obtém log de erros filtrado
     * @param {Object} filters - Filtros a aplicar
     * @param {string} filters.type - Tipo de erro
     * @param {string} filters.severity - Severidade
     * @param {Date} filters.since - Data inicial
     * @returns {Array<AppError>} Array de erros filtrados
     */
    getErrorLog(filters = {}) {
        let filteredLog = [...this.errorLog];

        if (filters.type) {
            filteredLog = filteredLog.filter((error) => error.type === filters.type);
        }

        if (filters.severity) {
            filteredLog = filteredLog.filter((error) => error.severity === filters.severity);
        }

        if (filters.since) {
            filteredLog = filteredLog.filter((error) => new Date(error.timestamp) >= filters.since);
        }

        return filteredLog;
    }

    /**
     * Limpa o log de erros
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Obtém estatísticas dos erros
     * @returns {Object} Estatísticas dos erros
     */
    getErrorStats() {
        const total = this.errorLog.length;
        const byType = {};
        const bySeverity = {};
        const last24h = this.getErrorLog({
            since: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }).length;

        for (const error of this.errorLog) {
            byType[error.type] = (byType[error.type] || 0) + 1;
            bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
        }

        return {
            total,
            last24h,
            byType,
            bySeverity,
            mostRecentError: this.errorLog[this.errorLog.length - 1] || null,
        };
    }

    /**
     * Normaliza erro para AppError
     * @private
     * @param {Error|AppError} error - Erro original
     * @param {Object} additionalContext - Contexto adicional
     * @returns {AppError} Erro normalizado
     */
    _normalizeError(error, additionalContext = {}) {
        if (error instanceof AppError) {
            // Já é AppError, apenas adiciona contexto
            error.context = { ...error.context, ...additionalContext };
            return error;
        }

        // Converte Error nativo para AppError
        const errorType = this._inferErrorType(error);
        const severity = this._inferSeverity(error, errorType);

        return new AppError(
            error.message || 'Erro desconhecido',
            errorType,
            severity,
            additionalContext,
            error
        );
    }

    /**
     * Infere o tipo de erro baseado na mensagem/stack
     * @private
     * @param {Error} error - Erro original
     * @returns {string} Tipo inferido
     */
    _inferErrorType(error) {
        const message = error.message.toLowerCase();
        const stack = error.stack ? error.stack.toLowerCase() : '';

        if (message.includes('network') || message.includes('fetch')) {
            return ERROR_TYPES.NETWORK;
        }

        if (message.includes('database') || message.includes('indexeddb')) {
            return ERROR_TYPES.DATABASE;
        }

        if (message.includes('validation') || message.includes('invalid')) {
            return ERROR_TYPES.VALIDATION;
        }

        if (stack.includes('calculation') || message.includes('math')) {
            return ERROR_TYPES.CALCULATION;
        }

        if (stack.includes('render') || message.includes('dom')) {
            return ERROR_TYPES.UI_RENDER;
        }

        return ERROR_TYPES.SYSTEM;
    }

    /**
     * Infere a severidade baseada no tipo e contexto
     * @private
     * @param {Error} error - Erro original
     * @param {string} errorType - Tipo do erro
     * @returns {string} Severidade inferida
     */
    _inferSeverity(error, errorType) {
        switch (errorType) {
            case ERROR_TYPES.VALIDATION:
                return ERROR_SEVERITY.LOW;

            case ERROR_TYPES.UI_RENDER:
                return ERROR_SEVERITY.MEDIUM;

            case ERROR_TYPES.DATABASE:
            case ERROR_TYPES.NETWORK:
                return ERROR_SEVERITY.HIGH;

            case ERROR_TYPES.BUSINESS_LOGIC:
            case ERROR_TYPES.CALCULATION:
                return ERROR_SEVERITY.HIGH;

            default:
                return ERROR_SEVERITY.MEDIUM;
        }
    }

    /**
     * Adiciona erro ao log interno
     * @private
     * @param {AppError} error - Erro a ser logado
     */
    _logError(error) {
        this.errorLog.push(error);

        // Mantém tamanho do log controlado
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift(); // Remove o mais antigo
        }
    }

    /**
     * Executa callbacks registrados para o tipo de erro
     * @private
     * @param {AppError} error - Erro ocorrido
     */
    _executeErrorCallbacks(error) {
        const callbacks = this.errorCallbacks.get(error.type) || [];

        for (const callback of callbacks) {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Erro no callback de tratamento:', callbackError);
            }
        }
    }

    /**
     * Decide se deve notificar o usuário sobre o erro
     * @private
     * @param {AppError} error - Erro ocorrido
     */
    _handleUserNotification(error) {
        // Só mostra erros HIGH e CRITICAL para o usuário
        if (error.severity === ERROR_SEVERITY.HIGH || error.severity === ERROR_SEVERITY.CRITICAL) {
            this._showUserNotification(error);
        }
    }

    /**
     * Mostra notificação de erro para o usuário
     * @private
     * @param {AppError} error - Erro a ser mostrado
     */
    _showUserNotification(error) {
        const userMessage = this._getUserFriendlyMessage(error);

        // Aqui você pode integrar com seu sistema de notificações
        // Por exemplo: toast, modal, etc.
        if (typeof window.showErrorToast === 'function') {
            window.showErrorToast(userMessage, error.severity);
        } else {
            // Fallback para alert (não recomendado para produção)
            console.error('Erro:', userMessage);
        }
    }

    /**
     * Converte erro técnico em mensagem amigável
     * @private
     * @param {AppError} error - Erro original
     * @returns {string} Mensagem amigável
     */
    _getUserFriendlyMessage(error) {
        switch (error.type) {
            case ERROR_TYPES.NETWORK:
                return 'Problema de conexão. Verifique sua internet e tente novamente.';

            case ERROR_TYPES.DATABASE:
                return 'Erro ao salvar dados. Suas informações podem não ter sido salvas.';

            case ERROR_TYPES.VALIDATION:
                return error.message; // Mensagens de validação já são amigáveis

            case ERROR_TYPES.CALCULATION:
                return 'Erro nos cálculos. Verifique os valores inseridos.';

            default:
                return 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.';
        }
    }

    /**
     * Gera ID único para o erro
     * @private
     * @returns {string} ID único
     */
    _generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Verifica se está em ambiente de desenvolvimento
     * @private
     * @returns {boolean} True se for desenvolvimento
     */
    _isDevelopment() {
        return isDevelopment();
    }

    /**
     * Configura tratamento global de erros
     * @private
     */
    _setupGlobalErrorHandling() {
        // Erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                source: 'global_error_handler',
            });
        });

        // Promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason || new Error('Promise rejeitada'), {
                promise: 'unhandled_rejection',
                source: 'promise_rejection_handler',
            });
        });
    }

    /**
     * Configura (ou reconfigura) tratamento global de erros.
     * Mantido por compatibilidade externa.
     */
    setupGlobalErrorHandling() {
        // Evita registrar múltiplas vezes
        if (this._globalHandlerConfigured) return;
        this._setupGlobalErrorHandling();
        this._globalHandlerConfigured = true;
    }
}

// Instância singleton do ErrorHandler
export const errorHandler = new ErrorHandler();

/**
 * Helpers para criar erros específicos facilmente
 */
export const ErrorHelpers = {
    /**
     * Cria erro de validação
     * @param {string} message - Mensagem do erro
     * @param {Object} context - Contexto adicional
     * @returns {AppError} Erro de validação
     */
    validation(message, context = {}) {
        return new AppError(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.LOW, context);
    },

    /**
     * Cria erro de rede
     * @param {string} message - Mensagem do erro
     * @param {Object} context - Contexto adicional
     * @returns {AppError} Erro de rede
     */
    network(message, context = {}) {
        return new AppError(message, ERROR_TYPES.NETWORK, ERROR_SEVERITY.HIGH, context);
    },

    /**
     * Cria erro de banco de dados
     * @param {string} message - Mensagem do erro
     * @param {Object} context - Contexto adicional
     * @returns {AppError} Erro de banco
     */
    database(message, context = {}) {
        return new AppError(message, ERROR_TYPES.DATABASE, ERROR_SEVERITY.HIGH, context);
    },

    /**
     * Cria erro de cálculo
     * @param {string} message - Mensagem do erro
     * @param {Object} context - Contexto adicional
     * @returns {AppError} Erro de cálculo
     */
    calculation(message, context = {}) {
        return new AppError(message, ERROR_TYPES.CALCULATION, ERROR_SEVERITY.HIGH, context);
    },
};
