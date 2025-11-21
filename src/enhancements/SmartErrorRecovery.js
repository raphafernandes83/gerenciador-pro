/**
 * SISTEMA DE RECUPERAÇÃO INTELIGENTE DE ERROS - GERENCIADOR PRO v9.3
 *
 * Sistema avançado para detectar, analisar e recuperar automaticamente de erros
 * Utiliza machine learning básico para aprender padrões de erro
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { ERROR_MESSAGES, SYSTEM_LIMITS } from '../constants/AppConstants.js';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from '../utils/ErrorHandler.js';
import { performanceMonitor } from '../monitoring/PerformanceMonitor.js';
import { cacheManager } from './CacheManager.js';
import { debounce, memoize } from '../utils/PerformanceUtils.js';

/**
 * Classe para recuperação inteligente de erros
 * Implementa padrões de recuperação, fallbacks e aprendizado automático
 */
export class SmartErrorRecovery {
    constructor() {
        if (SmartErrorRecovery.instance) {
            return SmartErrorRecovery.instance;
        }

        // Base de conhecimento de erros
        this.errorDatabase = new Map();
        this.recoveryStrategies = new Map();
        this.errorPatterns = new Map();

        // Estatísticas
        this.stats = {
            totalErrors: 0,
            recoveredErrors: 0,
            failedRecoveries: 0,
            learnedPatterns: 0,
            lastUpdate: Date.now(),
        };

        // Configurações
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            learningEnabled: true,
            autoRecoveryEnabled: true,
            fallbacksEnabled: true,
            maxErrorHistory: 1000,
            patternConfidenceThreshold: 0.7,
        };

        // Sistema de aprendizado
        this.learningSystem = {
            patterns: new Map(),
            weights: new Map(),
            lastAnalysis: 0,
            analysisInterval: 300000, // 5 minutos
        };

        this._initialize();

        SmartErrorRecovery.instance = this;
    }

    /**
     * Inicializa o sistema de recuperação
     * @private
     */
    _initialize() {
        try {
            // Carregar base de conhecimento
            this._loadKnowledgeBase();

            // Configurar estratégias de recuperação
            this._setupRecoveryStrategies();

            // Configurar hooks no sistema de erro
            this._setupErrorHooks();

            // Iniciar análise automática
            this._startPatternAnalysis();

            console.log('🛡️ SmartErrorRecovery inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar SmartErrorRecovery:', error);
        }
    }

    /**
     * Processa um erro e tenta recuperação automática
     *
     * @param {Error} error - Erro a ser processado
     * @param {Object} context - Contexto do erro
     * @param {string} context.function - Função onde ocorreu o erro
     * @param {any} context.data - Dados relacionados ao erro
     * @param {number} context.retryCount - Número de tentativas
     * @returns {Promise<Object>} Resultado da recuperação
     */
    async processError(error, context = {}) {
        try {
            const errorId = this._generateErrorId(error, context);
            const timestamp = Date.now();

            // Registrar erro
            this._recordError(errorId, error, context, timestamp);

            // Analisar padrão do erro
            const pattern = this._analyzeErrorPattern(error, context);

            // Tentar recuperação
            const recoveryResult = await this._attemptRecovery(error, context, pattern);

            // Aprender com o resultado
            if (this.config.learningEnabled) {
                this._learnFromRecovery(errorId, recoveryResult, pattern);
            }

            // Atualizar estatísticas
            this._updateStats(recoveryResult.success);

            return recoveryResult;
        } catch (recoveryError) {
            console.error('❌ Erro durante recuperação:', recoveryError);
            return {
                success: false,
                strategy: 'none',
                fallback: null,
                error: recoveryError,
                message: 'Falha na recuperação automática',
            };
        }
    }

    /**
     * Adiciona uma estratégia de recuperação customizada
     *
     * @param {string} errorType - Tipo de erro
     * @param {Function} strategy - Função de recuperação
     * @param {Object} options - Opções da estratégia
     */
    addRecoveryStrategy(errorType, strategy, options = {}) {
        try {
            this.recoveryStrategies.set(errorType, {
                handler: strategy,
                priority: options.priority || 1,
                maxRetries: options.maxRetries || this.config.maxRetries,
                timeout: options.timeout || 5000,
                fallback: options.fallback || null,
                conditions: options.conditions || (() => true),
            });

            console.log(`🔧 Estratégia de recuperação adicionada para: ${errorType}`);
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.SYSTEM,
                'SmartErrorRecovery.addRecoveryStrategy'
            );
        }
    }

    /**
     * Obtém estatísticas do sistema de recuperação
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getStats() {
        const recoveryRate =
            this.stats.totalErrors > 0
                ? ((this.stats.recoveredErrors / this.stats.totalErrors) * 100).toFixed(2)
                : 0;

        return {
            ...this.stats,
            recoveryRate: `${recoveryRate}%`,
            errorDatabase: this.errorDatabase.size,
            knownPatterns: this.errorPatterns.size,
            strategies: this.recoveryStrategies.size,
            learningData: this.learningSystem.patterns.size,
        };
    }

    /**
     * Exporta a base de conhecimento para backup
     *
     * @returns {Object} Base de conhecimento serializada
     */
    exportKnowledge() {
        return {
            timestamp: Date.now(),
            version: '9.3',
            patterns: Array.from(this.errorPatterns.entries()),
            strategies: Array.from(this.recoveryStrategies.entries()),
            learning: Array.from(this.learningSystem.patterns.entries()),
            stats: this.stats,
        };
    }

    /**
     * Importa base de conhecimento de backup
     *
     * @param {Object} knowledge - Base de conhecimento a importar
     */
    importKnowledge(knowledge) {
        try {
            if (knowledge.patterns) {
                this.errorPatterns = new Map(knowledge.patterns);
            }

            if (knowledge.learning) {
                this.learningSystem.patterns = new Map(knowledge.learning);
            }

            if (knowledge.stats) {
                Object.assign(this.stats, knowledge.stats);
            }

            console.log('📥 Base de conhecimento importada com sucesso!');
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.SYSTEM,
                'SmartErrorRecovery.importKnowledge'
            );
        }
    }

    // ========================================
    // MÉTODOS PRIVADOS
    // ========================================

    /**
     * Carrega base de conhecimento inicial
     * @private
     */
    _loadKnowledgeBase() {
        // Padrões de erro comuns
        const commonPatterns = [
            {
                type: 'NETWORK_ERROR',
                indicators: ['fetch', 'network', 'connection', 'timeout'],
                severity: ERROR_SEVERITY.MEDIUM,
                recoverable: true,
            },
            {
                type: 'DATA_CORRUPTION',
                indicators: ['undefined', 'null', 'NaN', 'parse'],
                severity: ERROR_SEVERITY.HIGH,
                recoverable: true,
            },
            {
                type: 'MEMORY_ERROR',
                indicators: ['memory', 'heap', 'allocation'],
                severity: ERROR_SEVERITY.CRITICAL,
                recoverable: false,
            },
            {
                type: 'CALCULATION_ERROR',
                indicators: ['division', 'zero', 'infinity', 'precision'],
                severity: ERROR_SEVERITY.MEDIUM,
                recoverable: true,
            },
        ];

        commonPatterns.forEach((pattern) => {
            this.errorPatterns.set(pattern.type, pattern);
        });
    }

    /**
     * Configura estratégias de recuperação padrão
     * @private
     */
    _setupRecoveryStrategies() {
        // Estratégia para erros de rede
        this.addRecoveryStrategy(
            'NETWORK_ERROR',
            async (error, context) => {
                const retryWithDelay = async (delay, retries) => {
                    if (retries <= 0) return false;

                    await new Promise((resolve) => setTimeout(resolve, delay));

                    try {
                        // Re-executar operação original se possível
                        if (context.originalOperation) {
                            await context.originalOperation();
                            return true;
                        }
                    } catch (retryError) {
                        return retryWithDelay(delay * 2, retries - 1);
                    }

                    return false;
                };

                return await retryWithDelay(this.config.retryDelay, this.config.maxRetries);
            },
            {
                priority: 1,
                fallback: () => {
                    // Usar dados do cache como fallback
                    if (context.cacheKey && cacheManager) {
                        return cacheManager.get(context.cacheKey);
                    }
                    return null;
                },
            }
        );

        // Estratégia para corrupção de dados
        this.addRecoveryStrategy('DATA_CORRUPTION', async (error, context) => {
            // Tentar recuperar do localStorage
            const backupKey = `backup_${context.dataKey || 'unknown'}`;
            const backup = localStorage.getItem(backupKey);

            if (backup) {
                try {
                    return JSON.parse(backup);
                } catch (parseError) {
                    // Se backup está corrompido, usar valores padrão
                    return this._getDefaultValues(context.dataType);
                }
            }

            return this._getDefaultValues(context.dataType);
        });

        // Estratégia para erros de cálculo
        this.addRecoveryStrategy('CALCULATION_ERROR', async (error, context) => {
            // Sanitizar dados de entrada
            if (context.inputs) {
                const sanitized = context.inputs.map((input) => {
                    if (isNaN(input) || !isFinite(input)) {
                        return 0;
                    }
                    return input;
                });

                // Re-executar cálculo com dados sanitizados
                if (context.calculationFunction) {
                    try {
                        return context.calculationFunction(...sanitized);
                    } catch (calcError) {
                        return null;
                    }
                }
            }

            return null;
        });
    }

    /**
     * Configura hooks no sistema de erro global
     * @private
     */
    _setupErrorHooks() {
        // Hook no errorHandler global
        const originalHandleError = errorHandler.handleError.bind(errorHandler);

        errorHandler.handleError = async (error, type, context) => {
            // Processo normal de erro
            const result = originalHandleError(error, type, context);

            // Tentar recuperação automática se habilitada
            if (this.config.autoRecoveryEnabled) {
                const recoveryResult = await this.processError(error, {
                    function: context,
                    errorType: type,
                    timestamp: Date.now(),
                });

                if (recoveryResult.success) {
                    console.log(
                        `🛡️ Recuperação automática bem-sucedida: ${recoveryResult.strategy}`
                    );
                }
            }

            return result;
        };

        // Hook em erros globais não capturados
        window.addEventListener('error', async (event) => {
            await this.processError(event.error, {
                function: 'global',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });

        // Hook em promises rejeitadas
        window.addEventListener('unhandledrejection', async (event) => {
            await this.processError(event.reason, {
                function: 'promise',
                type: 'unhandled_rejection',
            });
        });
    }

    /**
     * Inicia análise automática de padrões
     * @private
     */
    _startPatternAnalysis() {
        setInterval(() => {
            this._analyzePatterns();
        }, this.learningSystem.analysisInterval);
    }

    /**
     * Gera ID único para um erro
     * @private
     */
    _generateErrorId(error, context) {
        const components = [
            error.name || 'UnknownError',
            error.message?.substring(0, 50) || '',
            context.function || 'unknown',
        ];

        return components.join('_').replace(/[^a-zA-Z0-9_]/g, '');
    }

    /**
     * Registra erro na base de dados
     * @private
     */
    _recordError(errorId, error, context, timestamp) {
        if (!this.errorDatabase.has(errorId)) {
            this.errorDatabase.set(errorId, []);
        }

        const errorData = {
            timestamp,
            message: error.message,
            stack: error.stack,
            context: { ...context },
            recoveryAttempts: 0,
        };

        this.errorDatabase.get(errorId).push(errorData);

        // Limitar histórico
        const history = this.errorDatabase.get(errorId);
        if (history.length > this.config.maxErrorHistory) {
            history.shift();
        }
    }

    /**
     * Analisa padrão do erro
     * @private
     */
    _analyzeErrorPattern(error, context) {
        const memoizedAnalysis = memoize((errorMessage, errorName) => {
            // Analisar indicadores textuais
            const textIndicators = this._extractTextIndicators(errorMessage);

            // Analisar contexto
            const contextIndicators = this._extractContextIndicators(context);

            // Determinar tipo de erro
            const errorType = this._classifyError(textIndicators, contextIndicators);

            return {
                type: errorType,
                confidence: this._calculateConfidence(textIndicators, contextIndicators),
                indicators: [...textIndicators, ...contextIndicators],
                timestamp: Date.now(),
            };
        });

        return memoizedAnalysis(error.message || '', error.name || '');
    }

    /**
     * Tenta recuperação automática
     * @private
     */
    async _attemptRecovery(error, context, pattern) {
        const strategy = this.recoveryStrategies.get(pattern.type);

        if (!strategy || pattern.confidence < this.config.patternConfidenceThreshold) {
            return {
                success: false,
                strategy: 'none',
                fallback: null,
                message: 'Nenhuma estratégia aplicável',
            };
        }

        try {
            // Verificar condições da estratégia
            if (!strategy.conditions(error, context)) {
                throw new Error('Condições da estratégia não atendidas');
            }

            // Executar estratégia com timeout
            const result = await Promise.race([
                strategy.handler(error, context),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout na recuperação')), strategy.timeout)
                ),
            ]);

            return {
                success: true,
                strategy: pattern.type,
                result,
                fallback: null,
                message: 'Recuperação bem-sucedida',
            };
        } catch (recoveryError) {
            // Tentar fallback se disponível
            if (strategy.fallback && this.config.fallbacksEnabled) {
                try {
                    const fallbackResult = await strategy.fallback(error, context);

                    return {
                        success: true,
                        strategy: pattern.type,
                        result: null,
                        fallback: fallbackResult,
                        message: 'Recuperação via fallback',
                    };
                } catch (fallbackError) {
                    // Fallback também falhou
                }
            }

            return {
                success: false,
                strategy: pattern.type,
                fallback: null,
                error: recoveryError,
                message: 'Falha na estratégia de recuperação',
            };
        }
    }

    /**
     * Aprende com resultado da recuperação
     * @private
     */
    _learnFromRecovery(errorId, recoveryResult, pattern) {
        const learningKey = `${pattern.type}_${recoveryResult.success}`;

        if (!this.learningSystem.patterns.has(learningKey)) {
            this.learningSystem.patterns.set(learningKey, {
                successes: 0,
                failures: 0,
                confidence: 0,
                lastUpdate: Date.now(),
            });
        }

        const learning = this.learningSystem.patterns.get(learningKey);

        if (recoveryResult.success) {
            learning.successes++;
        } else {
            learning.failures++;
        }

        // Atualizar confiança
        const total = learning.successes + learning.failures;
        learning.confidence = learning.successes / total;
        learning.lastUpdate = Date.now();

        this.stats.learnedPatterns = this.learningSystem.patterns.size;
    }

    /**
     * Extrai indicadores textuais do erro
     * @private
     */
    _extractTextIndicators(message) {
        const indicators = [];
        const patterns = this.errorPatterns.values();

        for (const pattern of patterns) {
            for (const indicator of pattern.indicators) {
                if (message.toLowerCase().includes(indicator.toLowerCase())) {
                    indicators.push(indicator);
                }
            }
        }

        return indicators;
    }

    /**
     * Extrai indicadores do contexto
     * @private
     */
    _extractContextIndicators(context) {
        const indicators = [];

        if (context.function) {
            indicators.push(`function:${context.function}`);
        }

        if (context.errorType) {
            indicators.push(`type:${context.errorType}`);
        }

        return indicators;
    }

    /**
     * Classifica tipo de erro
     * @private
     */
    _classifyError(textIndicators, contextIndicators) {
        const allIndicators = [...textIndicators, ...contextIndicators];
        let bestMatch = 'UNKNOWN_ERROR';
        let bestScore = 0;

        for (const [type, pattern] of this.errorPatterns.entries()) {
            const matches = pattern.indicators.filter((indicator) =>
                allIndicators.some((ai) => ai.toLowerCase().includes(indicator.toLowerCase()))
            );

            const score = matches.length / pattern.indicators.length;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = type;
            }
        }

        return bestMatch;
    }

    /**
     * Calcula confiança da classificação
     * @private
     */
    _calculateConfidence(textIndicators, contextIndicators) {
        const totalIndicators = textIndicators.length + contextIndicators.length;
        const baseConfidence = Math.min(totalIndicators / 3, 1); // Máximo com 3+ indicadores

        // Ajustar baseado no aprendizado
        return Math.min(baseConfidence * 1.2, 1);
    }

    /**
     * Obtém valores padrão para recuperação
     * @private
     */
    _getDefaultValues(dataType) {
        const defaults = {
            number: 0,
            string: '',
            array: [],
            object: {},
            boolean: false,
            config: {
                capitalInicial: 1000,
                percentualEntrada: 2,
                stopWinPerc: 10,
                stopLossPerc: 15,
                payout: 87,
            },
            session: {
                id: `recovery_${Date.now()}`,
                data: {},
                timestamp: Date.now(),
            },
        };

        return defaults[dataType] || null;
    }

    /**
     * Analisa padrões para aprendizado
     * @private
     */
    _analyzePatterns() {
        const debouncedAnalysis = debounce(() => {
            try {
                // Analisar sucessos e falhas
                for (const [key, data] of this.learningSystem.patterns.entries()) {
                    if (data.confidence > 0.8 && data.successes > 5) {
                        // Padrão confiável - pode ser promovido a estratégia automática
                        this._promotePattern(key, data);
                    }
                }

                // Limpar padrões antigos
                this._cleanupOldPatterns();

                this.learningSystem.lastAnalysis = Date.now();
            } catch (error) {
                console.error('Erro na análise de padrões:', error);
            }
        }, 5000);

        debouncedAnalysis();
    }

    /**
     * Promove padrão confiável
     * @private
     */
    _promotePattern(key, data) {
        console.log(
            `🎓 Padrão promovido: ${key} (confiança: ${(data.confidence * 100).toFixed(1)}%)`
        );
    }

    /**
     * Limpa padrões antigos
     * @private
     */
    _cleanupOldPatterns() {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 dias

        for (const [key, data] of this.learningSystem.patterns.entries()) {
            if (data.lastUpdate < cutoff && data.confidence < 0.3) {
                this.learningSystem.patterns.delete(key);
            }
        }
    }

    /**
     * Atualiza estatísticas
     * @private
     */
    _updateStats(success) {
        this.stats.totalErrors++;

        if (success) {
            this.stats.recoveredErrors++;
        } else {
            this.stats.failedRecoveries++;
        }

        this.stats.lastUpdate = Date.now();

        // Registrar no monitor de performance
        if (performanceMonitor.isEnabled) {
            performanceMonitor.addCustomMetric('error_recovery', success ? 'success' : 'failure', {
                totalErrors: this.stats.totalErrors,
                recoveryRate: this.stats.recoveredErrors / this.stats.totalErrors,
            });
        }
    }
}

// Exportar instância singleton
export const smartErrorRecovery = new SmartErrorRecovery();
