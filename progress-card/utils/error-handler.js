/**
 * 🛡️ Error Handler - Sistema de Tratamento de Erros
 * 
 * Sistema centralizado para captura, tratamento e recuperação de erros
 * no card de progresso, garantindo graceful degradation e experiência
 * do usuário elegante mesmo em caso de falhas.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Utilities
import { logger } from '../../src/utils/Logger.js';
import { debounce } from './performance-optimizer.js';

// ============================================================================
// TIPOS DE ERRO E SEVERIDADE
// ============================================================================

/**
 * 📋 Tipos de erro do sistema
 */
export const ERROR_TYPES = {
    // Erros de dados
    DATA_INVALID: 'DATA_INVALID',
    DATA_MISSING: 'DATA_MISSING',
    DATA_CORRUPTED: 'DATA_CORRUPTED',
    
    // Erros de renderização
    RENDER_FAILED: 'RENDER_FAILED',
    DOM_NOT_FOUND: 'DOM_NOT_FOUND',
    CHART_ERROR: 'CHART_ERROR',
    
    // Erros de estado
    STATE_INVALID: 'STATE_INVALID',
    STATE_SYNC_FAILED: 'STATE_SYNC_FAILED',
    OBSERVER_ERROR: 'OBSERVER_ERROR',
    
    // Erros de performance
    MEMORY_LEAK: 'MEMORY_LEAK',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    PERFORMANCE_DEGRADED: 'PERFORMANCE_DEGRADED',
    
    // Erros de rede/storage
    STORAGE_ERROR: 'STORAGE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    
    // Erros críticos
    CRITICAL_FAILURE: 'CRITICAL_FAILURE',
    SYSTEM_CRASH: 'SYSTEM_CRASH'
};

/**
 * 📊 Níveis de severidade
 */
export const ERROR_SEVERITY = {
    LOW: 'low',           // Aviso, não afeta funcionamento
    MEDIUM: 'medium',     // Problema menor, funcionalidade reduzida
    HIGH: 'high',         // Problema sério, funcionalidade comprometida
    CRITICAL: 'critical'  // Falha crítica, sistema não funcional
};

/**
 * 🎯 Estratégias de recuperação
 */
export const RECOVERY_STRATEGIES = {
    IGNORE: 'ignore',           // Ignora o erro
    RETRY: 'retry',             // Tenta novamente
    FALLBACK: 'fallback',       // Usa sistema de fallback
    RESET: 'reset',             // Reseta componente
    RELOAD: 'reload',           // Recarrega sistema
    GRACEFUL_DEGRADE: 'graceful_degrade'  // Degradação elegante
};

// ============================================================================
// CONFIGURAÇÃO DE TRATAMENTO DE ERROS
// ============================================================================

/**
 * ⚙️ Configuração do sistema de erros
 */
const ERROR_CONFIG = {
    // Máximo de erros por tipo antes de ação drástica
    maxErrorsPerType: 5,
    
    // Intervalo para reset de contadores (ms)
    errorCounterResetInterval: 300000, // 5 minutos
    
    // Timeout para operações críticas (ms)
    criticalOperationTimeout: 5000,
    
    // Debounce para notificações de erro (ms)
    errorNotificationDebounce: 1000,
    
    // Máximo de tentativas de recuperação
    maxRecoveryAttempts: 3,
    
    // Intervalo entre tentativas de recuperação (ms)
    recoveryRetryInterval: 2000,
    
    // Habilitar logging detalhado
    enableVerboseLogging: true,
    
    // Habilitar notificações visuais
    enableVisualNotifications: true
};

/**
 * 📋 Mapeamento de erros para estratégias
 */
const ERROR_STRATEGY_MAP = {
    [ERROR_TYPES.DATA_INVALID]: {
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        maxRetries: 2
    },
    [ERROR_TYPES.DATA_MISSING]: {
        severity: ERROR_SEVERITY.LOW,
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 3
    },
    [ERROR_TYPES.RENDER_FAILED]: {
        severity: ERROR_SEVERITY.HIGH,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        maxRetries: 1
    },
    [ERROR_TYPES.DOM_NOT_FOUND]: {
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.RETRY,
        maxRetries: 2
    },
    [ERROR_TYPES.CHART_ERROR]: {
        severity: ERROR_SEVERITY.MEDIUM,
        strategy: RECOVERY_STRATEGIES.RESET,
        maxRetries: 1
    },
    [ERROR_TYPES.STATE_INVALID]: {
        severity: ERROR_SEVERITY.HIGH,
        strategy: RECOVERY_STRATEGIES.RESET,
        maxRetries: 1
    },
    [ERROR_TYPES.CRITICAL_FAILURE]: {
        severity: ERROR_SEVERITY.CRITICAL,
        strategy: RECOVERY_STRATEGIES.RELOAD,
        maxRetries: 0
    }
};

// ============================================================================
// CLASSE DO MANIPULADOR DE ERROS
// ============================================================================

/**
 * 🛡️ Manipulador centralizado de erros
 */
class ProgressCardErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.recoveryAttempts = new Map();
        this.errorHistory = [];
        this.isRecovering = false;
        this.lastErrorTime = 0;
        
        // Debounced functions
        this.debouncedNotify = debounce(
            this.showErrorNotification.bind(this), 
            ERROR_CONFIG.errorNotificationDebounce
        );
        
        // Setup global error handlers
        this.setupGlobalErrorHandlers();
        
        // Reset counters periodically
        this.startErrorCounterReset();
        
        logger.debug('🛡️ Error Handler inicializado');
    }
    
    // ========================================================================
    // CAPTURA E PROCESSAMENTO DE ERROS
    // ========================================================================
    
    /**
     * 🚨 Captura e processa erro
     * @param {Error|string} error - Erro capturado
     * @param {string} type - Tipo do erro
     * @param {Object} context - Contexto adicional
     * @param {Object} options - Opções de tratamento
     * @returns {Object} Resultado do tratamento
     */
    handleError(error, type = ERROR_TYPES.CRITICAL_FAILURE, context = {}, options = {}) {
        try {
            const errorInfo = this.processError(error, type, context);
            const strategy = this.determineStrategy(errorInfo);
            const result = this.executeRecovery(errorInfo, strategy, options);
            
            // Atualiza estatísticas
            this.updateErrorStats(errorInfo);
            
            // Log do tratamento
            this.logErrorHandling(errorInfo, strategy, result);
            
            return result;
            
        } catch (handlingError) {
            // Erro no próprio sistema de tratamento de erros
            logger.error('💥 Erro crítico no sistema de tratamento de erros:', {
                originalError: String(error),
                handlingError: String(handlingError)
            });
            
            return {
                success: false,
                strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADE,
                message: 'Sistema de recuperação falhou'
            };
        }
    }
    
    /**
     * 📊 Processa informações do erro
     * @param {Error|string} error - Erro
     * @param {string} type - Tipo do erro
     * @param {Object} context - Contexto
     * @returns {Object} Informações processadas
     */
    processError(error, type, context) {
        const timestamp = Date.now();
        const errorString = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : null;
        
        const errorInfo = {
            id: this.generateErrorId(),
            timestamp,
            type,
            message: errorString,
            stack,
            context: { ...context },
            severity: ERROR_STRATEGY_MAP[type]?.severity || ERROR_SEVERITY.MEDIUM,
            count: this.incrementErrorCount(type)
        };
        
        // Adiciona ao histórico
        this.addToHistory(errorInfo);
        
        return errorInfo;
    }
    
    /**
     * 🎯 Determina estratégia de recuperação
     * @param {Object} errorInfo - Informações do erro
     * @returns {Object} Estratégia determinada
     */
    determineStrategy(errorInfo) {
        const baseStrategy = ERROR_STRATEGY_MAP[errorInfo.type] || {
            severity: ERROR_SEVERITY.MEDIUM,
            strategy: RECOVERY_STRATEGIES.FALLBACK,
            maxRetries: 1
        };
        
        // Ajusta estratégia baseada na frequência de erros
        if (errorInfo.count > ERROR_CONFIG.maxErrorsPerType) {
            return {
                ...baseStrategy,
                strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADE,
                reason: 'Muitos erros do mesmo tipo'
            };
        }
        
        // Verifica se já está em processo de recuperação
        if (this.isRecovering) {
            return {
                ...baseStrategy,
                strategy: RECOVERY_STRATEGIES.IGNORE,
                reason: 'Sistema já em recuperação'
            };
        }
        
        return baseStrategy;
    }
    
    // ========================================================================
    // ESTRATÉGIAS DE RECUPERAÇÃO
    // ========================================================================
    
    /**
     * 🔧 Executa estratégia de recuperação
     * @param {Object} errorInfo - Informações do erro
     * @param {Object} strategy - Estratégia a executar
     * @param {Object} options - Opções adicionais
     * @returns {Object} Resultado da recuperação
     */
    executeRecovery(errorInfo, strategy, options = {}) {
        const { forceStrategy = null } = options;
        const recoveryStrategy = forceStrategy || strategy.strategy;
        
        this.isRecovering = true;
        
        try {
            let result;
            
            switch (recoveryStrategy) {
                case RECOVERY_STRATEGIES.IGNORE:
                    result = this.executeIgnoreStrategy(errorInfo);
                    break;
                    
                case RECOVERY_STRATEGIES.RETRY:
                    result = this.executeRetryStrategy(errorInfo, strategy);
                    break;
                    
                case RECOVERY_STRATEGIES.FALLBACK:
                    result = this.executeFallbackStrategy(errorInfo);
                    break;
                    
                case RECOVERY_STRATEGIES.RESET:
                    result = this.executeResetStrategy(errorInfo);
                    break;
                    
                case RECOVERY_STRATEGIES.RELOAD:
                    result = this.executeReloadStrategy(errorInfo);
                    break;
                    
                case RECOVERY_STRATEGIES.GRACEFUL_DEGRADE:
                    result = this.executeGracefulDegradeStrategy(errorInfo);
                    break;
                    
                default:
                    result = this.executeFallbackStrategy(errorInfo);
            }
            
            return {
                ...result,
                strategy: recoveryStrategy,
                errorId: errorInfo.id
            };
            
        } finally {
            setTimeout(() => {
                this.isRecovering = false;
            }, 1000);
        }
    }
    
    /**
     * 🙈 Estratégia: Ignorar erro
     */
    executeIgnoreStrategy(errorInfo) {
        logger.debug('🙈 Ignorando erro:', { type: errorInfo.type });
        
        return {
            success: true,
            message: 'Erro ignorado',
            action: 'none'
        };
    }
    
    /**
     * 🔄 Estratégia: Tentar novamente
     */
    executeRetryStrategy(errorInfo, strategy) {
        const attemptKey = `${errorInfo.type}_retry`;
        const attempts = this.recoveryAttempts.get(attemptKey) || 0;
        
        if (attempts >= (strategy.maxRetries || 1)) {
            logger.warn('🔄 Máximo de tentativas atingido:', { type: errorInfo.type });
            return this.executeFallbackStrategy(errorInfo);
        }
        
        this.recoveryAttempts.set(attemptKey, attempts + 1);
        
        // Agenda nova tentativa
        setTimeout(() => {
            this.retryFailedOperation(errorInfo);
        }, ERROR_CONFIG.recoveryRetryInterval);
        
        return {
            success: true,
            message: `Tentativa ${attempts + 1} agendada`,
            action: 'retry_scheduled'
        };
    }
    
    /**
     * 🔄 Estratégia: Usar fallback
     */
    executeFallbackStrategy(errorInfo) {
        logger.warn('🔄 Executando fallback para:', { type: errorInfo.type });
        
        try {
            // Determina fallback baseado no tipo de erro
            switch (errorInfo.type) {
                case ERROR_TYPES.RENDER_FAILED:
                    return this.renderFallbackUI();
                    
                case ERROR_TYPES.DATA_INVALID:
                    return this.useDefaultData();
                    
                case ERROR_TYPES.CHART_ERROR:
                    return this.useSimpleChart();
                    
                case ERROR_TYPES.STATE_SYNC_FAILED:
                    return this.useCachedState();
                    
                default:
                    return this.useMinimalMode();
            }
        } catch (fallbackError) {
            logger.error('❌ Fallback também falhou:', { error: String(fallbackError) });
            return this.executeGracefulDegradeStrategy(errorInfo);
        }
    }
    
    /**
     * 🔄 Estratégia: Reset do componente
     */
    executeResetStrategy(errorInfo) {
        logger.warn('🔄 Resetando componente:', { type: errorInfo.type });
        
        try {
            // Reset baseado no tipo de erro
            switch (errorInfo.type) {
                case ERROR_TYPES.CHART_ERROR:
                    return this.resetChart();
                    
                case ERROR_TYPES.STATE_INVALID:
                    return this.resetState();
                    
                default:
                    return this.resetCard();
            }
        } catch (resetError) {
            logger.error('❌ Reset falhou:', { error: String(resetError) });
            return this.executeGracefulDegradeStrategy(errorInfo);
        }
    }
    
    /**
     * 🔄 Estratégia: Reload do sistema
     */
    executeReloadStrategy(errorInfo) {
        logger.error('🔄 Recarregando sistema devido a erro crítico:', { type: errorInfo.type });
        
        // Notifica usuário antes de recarregar
        this.showCriticalErrorNotification(errorInfo);
        
        // Agenda reload após delay
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        }, 3000);
        
        return {
            success: true,
            message: 'Sistema será recarregado em 3 segundos',
            action: 'reload_scheduled'
        };
    }
    
    /**
     * 🔄 Estratégia: Degradação elegante
     */
    executeGracefulDegradeStrategy(errorInfo) {
        logger.warn('🔄 Degradação elegante ativada:', { type: errorInfo.type });
        
        try {
            // Desabilita funcionalidades não-essenciais
            this.disableNonEssentialFeatures();
            
            // Mostra modo simplificado
            this.enableSimplifiedMode();
            
            // Notifica usuário
            this.showDegradationNotification();
            
            return {
                success: true,
                message: 'Modo simplificado ativado',
                action: 'graceful_degradation'
            };
            
        } catch (degradeError) {
            logger.error('❌ Degradação elegante falhou:', { error: String(degradeError) });
            
            return {
                success: false,
                message: 'Falha crítica no sistema',
                action: 'critical_failure'
            };
        }
    }
    
    // ========================================================================
    // IMPLEMENTAÇÕES DE FALLBACK
    // ========================================================================
    
    /**
     * 🎨 Renderiza UI de fallback
     */
    renderFallbackUI() {
        const cardElement = document.querySelector('.progress-card');
        if (cardElement) {
            cardElement.innerHTML = `
                <div class="error-fallback">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">
                        <h3>Modo Simplificado</h3>
                        <p>Alguns recursos estão temporariamente indisponíveis.</p>
                    </div>
                </div>
            `;
        }
        
        return {
            success: true,
            message: 'UI de fallback renderizada',
            action: 'fallback_ui_rendered'
        };
    }
    
    /**
     * 📊 Usa dados padrão
     */
    useDefaultData() {
        const defaultData = {
            stats: { winRate: 0, lossRate: 0, totalOperations: 0 },
            monetary: { achievedAmount: 0, progressPercent: 0 },
            pointsPercentage: { winRate: null, lossRate: null }
        };
        
        // Atualiza com dados padrão
        if (window.updateProgressCardState) {
            window.updateProgressCardState(defaultData, {
                source: 'error-recovery',
                validate: false
            });
        }
        
        return {
            success: true,
            message: 'Dados padrão aplicados',
            action: 'default_data_applied'
        };
    }
    
    /**
     * 📈 Usa gráfico simples
     */
    useSimpleChart() {
        const chartContainer = document.querySelector('#progress-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="simple-chart">
                    <div class="chart-placeholder">
                        <div class="chart-icon">📊</div>
                        <div class="chart-text">Gráfico Indisponível</div>
                    </div>
                </div>
            `;
        }
        
        return {
            success: true,
            message: 'Gráfico simples aplicado',
            action: 'simple_chart_applied'
        };
    }
    
    /**
     * 💾 Usa estado em cache
     */
    useCachedState() {
        try {
            const cached = localStorage.getItem('progressCardState_backup');
            if (cached) {
                const cachedState = JSON.parse(cached);
                
                if (window.updateProgressCardState) {
                    window.updateProgressCardState(cachedState, {
                        source: 'cache-recovery',
                        validate: true
                    });
                }
                
                return {
                    success: true,
                    message: 'Estado em cache restaurado',
                    action: 'cached_state_restored'
                };
            }
        } catch (error) {
            logger.error('❌ Erro ao usar estado em cache:', { error: String(error) });
        }
        
        return this.useDefaultData();
    }
    
    /**
     * 🔄 Usa modo mínimo
     */
    useMinimalMode() {
        // Desabilita animações e efeitos
        document.body.classList.add('minimal-mode');
        
        // Simplifica interface
        const cardElement = document.querySelector('.progress-card');
        if (cardElement) {
            cardElement.classList.add('minimal-ui');
        }
        
        return {
            success: true,
            message: 'Modo mínimo ativado',
            action: 'minimal_mode_activated'
        };
    }
    
    // ========================================================================
    // IMPLEMENTAÇÕES DE RESET
    // ========================================================================
    
    /**
     * 📈 Reset do gráfico
     */
    resetChart() {
        try {
            if (window.Chart && window.progressChart) {
                window.progressChart.destroy();
                window.progressChart = null;
            }
            
            // Reinicializa gráfico
            if (window.initializeChart) {
                window.initializeChart();
            }
            
            return {
                success: true,
                message: 'Gráfico resetado',
                action: 'chart_reset'
            };
        } catch (error) {
            return this.useSimpleChart();
        }
    }
    
    /**
     * 🏪 Reset do estado
     */
    resetState() {
        try {
            if (window.resetProgressCardState) {
                window.resetProgressCardState({ keepConfig: true });
            }
            
            return {
                success: true,
                message: 'Estado resetado',
                action: 'state_reset'
            };
        } catch (error) {
            return this.useDefaultData();
        }
    }
    
    /**
     * 🎯 Reset do card completo
     */
    resetCard() {
        try {
            // Para sincronização
            if (window.stopStateSync) {
                window.stopStateSync();
            }
            
            // Reset do estado
            this.resetState();
            
            // Reinicializa sistema
            setTimeout(() => {
                if (window.initializeProgressCardState) {
                    window.initializeProgressCardState();
                }
            }, 1000);
            
            return {
                success: true,
                message: 'Card resetado completamente',
                action: 'card_reset'
            };
        } catch (error) {
            return this.executeGracefulDegradeStrategy({ type: 'RESET_FAILED' });
        }
    }
    
    // ========================================================================
    // FUNCIONALIDADES AUXILIARES
    // ========================================================================
    
    /**
     * 🔄 Tenta operação novamente
     */
    retryFailedOperation(errorInfo) {
        logger.debug('🔄 Tentando operação novamente:', { type: errorInfo.type });
        
        // Implementação específica baseada no contexto do erro
        if (errorInfo.context.retryFunction) {
            try {
                errorInfo.context.retryFunction();
            } catch (retryError) {
                this.handleError(retryError, errorInfo.type, {
                    ...errorInfo.context,
                    isRetry: true
                });
            }
        }
    }
    
    /**
     * ⚠️ Desabilita funcionalidades não-essenciais
     */
    disableNonEssentialFeatures() {
        // Desabilita animações
        document.body.classList.add('no-animations');
        
        // Desabilita auto-sync
        if (window.stopStateSync) {
            window.stopStateSync();
        }
        
        // Desabilita otimizações complexas
        if (window.progressCardStateManager) {
            window.progressCardStateManager.config = {
                ...window.progressCardStateManager.config,
                optimizedRendering: false,
                autoUpdate: false
            };
        }
    }
    
    /**
     * 🎯 Habilita modo simplificado
     */
    enableSimplifiedMode() {
        document.body.classList.add('simplified-mode');
        
        const cardElement = document.querySelector('.progress-card');
        if (cardElement) {
            cardElement.classList.add('simplified');
        }
    }
    
    // ========================================================================
    // NOTIFICAÇÕES E INTERFACE
    // ========================================================================
    
    /**
     * 📢 Mostra notificação de erro
     */
    showErrorNotification(errorInfo) {
        if (!ERROR_CONFIG.enableVisualNotifications) return;
        
        const notification = this.createNotificationElement(
            '⚠️ Problema Detectado',
            'Alguns recursos podem estar limitados temporariamente.',
            'warning'
        );
        
        this.displayNotification(notification, 5000);
    }
    
    /**
     * 🚨 Mostra notificação de erro crítico
     */
    showCriticalErrorNotification(errorInfo) {
        const notification = this.createNotificationElement(
            '🚨 Erro Crítico',
            'O sistema será recarregado para resolver o problema.',
            'error'
        );
        
        this.displayNotification(notification, 10000);
    }
    
    /**
     * 📉 Mostra notificação de degradação
     */
    showDegradationNotification() {
        const notification = this.createNotificationElement(
            '📉 Modo Simplificado',
            'Algumas funcionalidades foram temporariamente desabilitadas.',
            'info'
        );
        
        this.displayNotification(notification, 7000);
    }
    
    /**
     * 🎨 Cria elemento de notificação
     */
    createNotificationElement(title, message, type) {
        const notification = document.createElement('div');
        notification.className = `error-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">×</button>
            </div>
        `;
        
        // Adiciona handler de fechamento
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        return notification;
    }
    
    /**
     * 📺 Exibe notificação
     */
    displayNotification(notification, duration = 5000) {
        document.body.appendChild(notification);
        
        // Auto-remove após duração
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
    
    // ========================================================================
    // CONFIGURAÇÃO GLOBAL
    // ========================================================================
    
    /**
     * 🌐 Configura handlers globais de erro
     */
    setupGlobalErrorHandlers() {
        if (typeof window === 'undefined') return;
        
        // Erros JavaScript não capturados
        window.addEventListener('error', (event) => {
            this.handleError(event.error, ERROR_TYPES.CRITICAL_FAILURE, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promises rejeitadas não capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, ERROR_TYPES.CRITICAL_FAILURE, {
                promise: 'unhandled_rejection'
            });
        });
        
        logger.debug('🌐 Handlers globais de erro configurados');
    }
    
    /**
     * ⏰ Inicia reset periódico de contadores
     */
    startErrorCounterReset() {
        setInterval(() => {
            this.errorCounts.clear();
            this.recoveryAttempts.clear();
            logger.debug('🔄 Contadores de erro resetados');
        }, ERROR_CONFIG.errorCounterResetInterval);
    }
    
    // ========================================================================
    // UTILITÁRIOS INTERNOS
    // ========================================================================
    
    /**
     * 🆔 Gera ID único para erro
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 📊 Incrementa contador de erro
     */
    incrementErrorCount(type) {
        const current = this.errorCounts.get(type) || 0;
        const newCount = current + 1;
        this.errorCounts.set(type, newCount);
        return newCount;
    }
    
    /**
     * 📜 Adiciona ao histórico
     */
    addToHistory(errorInfo) {
        this.errorHistory.push(errorInfo);
        
        // Limita tamanho do histórico
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }
    }
    
    /**
     * 📊 Atualiza estatísticas
     */
    updateErrorStats(errorInfo) {
        this.lastErrorTime = errorInfo.timestamp;
    }
    
    /**
     * 📝 Log do tratamento de erro
     */
    logErrorHandling(errorInfo, strategy, result) {
        if (ERROR_CONFIG.enableVerboseLogging) {
            logger.info('🛡️ Erro tratado:', {
                id: errorInfo.id,
                type: errorInfo.type,
                severity: errorInfo.severity,
                strategy: strategy.strategy,
                success: result.success,
                action: result.action
            });
        }
    }
    
    /**
     * 📊 Obtém estatísticas de erro
     */
    getErrorStats() {
        return {
            totalErrors: this.errorHistory.length,
            errorsByType: Object.fromEntries(this.errorCounts),
            lastErrorTime: this.lastErrorTime,
            isRecovering: this.isRecovering,
            recentErrors: this.errorHistory.slice(-10)
        };
    }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

/**
 * 🛡️ Instância singleton do manipulador de erros
 */
export const errorHandler = new ProgressCardErrorHandler();

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * 🚨 Captura e trata erro
 */
export const handleProgressCardError = (error, type, context, options) => 
    errorHandler.handleError(error, type, context, options);

/**
 * 📊 Obtém estatísticas de erro
 */
export const getErrorStats = () => errorHandler.getErrorStats();

/**
 * 🛡️ Wrapper seguro para execução de funções
 */
export function safeExecute(fn, errorType = ERROR_TYPES.CRITICAL_FAILURE, context = {}) {
    try {
        return fn();
    } catch (error) {
        return handleProgressCardError(error, errorType, {
            ...context,
            function: fn.name || 'anonymous'
        });
    }
}

/**
 * 🛡️ Wrapper seguro para execução assíncrona
 */
export async function safeExecuteAsync(fn, errorType = ERROR_TYPES.CRITICAL_FAILURE, context = {}) {
    try {
        return await fn();
    } catch (error) {
        return handleProgressCardError(error, errorType, {
            ...context,
            function: fn.name || 'anonymous',
            async: true
        });
    }
}

// ============================================================================
// EXPOSIÇÃO GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
    window.progressCardErrorHandler = errorHandler;
    window.handleProgressCardError = handleProgressCardError;
    window.getErrorStats = getErrorStats;
    window.safeExecute = safeExecute;
    window.safeExecuteAsync = safeExecuteAsync;
    
    logger.debug('🛡️ Error Handler disponível globalmente');
}




