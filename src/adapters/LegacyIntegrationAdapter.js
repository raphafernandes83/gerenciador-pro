/**
 * ADAPTADOR DE INTEGRAÇÃO LEGADO - GERENCIADOR PRO v9.3
 *
 * Permite integração gradual dos novos módulos refatorados
 * com o código legado mantendo compatibilidade
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { TradingOperationsManager } from '../business/TradingOperationsManager.js';
import { errorHandler, ErrorHelpers } from '../utils/ErrorHandler.js';
import { debounce } from '../utils/PerformanceUtils.js';
import { state as legacyState } from '../../state.js';

/**
 * Adaptador que permite migração gradual do código legado
 * Mantém compatibilidade com APIs antigas enquanto usa novos módulos
 */
export class LegacyIntegrationAdapter {
    constructor() {
        this.tradingManager = null;
        this.isInitialized = false;
        this.legacyFunctionMap = new Map();

        // Setup debounced methods
        this._debouncedInit = debounce(this.initialize.bind(this), 100);
    }

    /**
     * Inicializa o adaptador com dependências do sistema legado
     * @param {Object} legacyDependencies - Dependências do sistema antigo
     */
    async initialize(legacyDependencies) {
        try {
            const { state, config, dbManager, ui, charts } = legacyDependencies;

            if (!state || !config) {
                throw ErrorHelpers.validation('State e config são obrigatórios para inicialização');
            }

            // Usa a instância já criada no main.js se disponível
            this.tradingManager =
                legacyDependencies.tradingManager ||
                new TradingOperationsManager(state, config, dbManager, ui, charts);

            // Mapeia funções legadas para novos métodos
            this._setupLegacyFunctionMapping();

            this.isInitialized = true;
            console.log('🔗 LegacyIntegrationAdapter inicializado com sucesso');
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'LegacyIntegrationAdapter.initialize',
            });
            throw error;
        }
    }

    /**
     * Configura mapeamento de funções legadas para novos métodos
     * @private
     */
    _setupLegacyFunctionMapping() {
        // Mapeia funções do logic.js antigo para novos métodos
        this.legacyFunctionMap.set('calcularPlano', {
            newMethod: 'calculateTradingPlan',
            adapter: this._adaptCalcularPlano.bind(this),
        });

        this.legacyFunctionMap.set('finalizarRegistroOperacao', {
            newMethod: 'registerTradingOperation',
            adapter: this._adaptFinalizarRegistroOperacao.bind(this),
        });

        this.legacyFunctionMap.set('desfazerOperacao', {
            newMethod: 'undoLastOperation',
            adapter: this._adaptDesfazerOperacao.bind(this),
        });

        this.legacyFunctionMap.set('updateState', {
            newMethod: 'updateConfiguration',
            adapter: this._adaptUpdateState.bind(this),
        });

        this.legacyFunctionMap.set('verificarMetas', {
            newMethod: '_checkGoalStatus',
            adapter: this._adaptVerificarMetas.bind(this),
        });
    }

    /**
     * Executa função legada usando novo sistema
     * @param {string} legacyFunctionName - Nome da função legada
     * @param {...any} args - Argumentos da função
     * @returns {any} Resultado da execução
     */
    async executeLegacyFunction(legacyFunctionName, ...args) {
        try {
            if (!this.isInitialized) {
                throw ErrorHelpers.validation('Adaptador não foi inicializado');
            }

            const mapping = this.legacyFunctionMap.get(legacyFunctionName);
            if (!mapping) {
                throw ErrorHelpers.validation(`Função legada não mapeada: ${legacyFunctionName}`);
            }

            // Executa através do adaptador específico
            return await mapping.adapter(...args);
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'executeLegacyFunction',
                legacyFunction: legacyFunctionName,
                argsCount: args.length,
            });
            throw error;
        }
    }

    // ================================
    // ADAPTADORES ESPECÍFICOS
    // ================================
    /**
     * [TAREFA 28] Adapta calcularPlano para usar sessionManager.recalculatePlan()
     * NÃO usa mais TradingOperationsManager para evitar duplicação
     * @private
     */
    async _adaptCalcularPlano(forceRedraw = false) {
        try {
            // Usa sessionManager como fonte única de verdade
            const { sessionManager } = await import('../managers/SessionManager.js');
            await sessionManager.recalculatePlan(forceRedraw);

            console.log('✅ _adaptCalcularPlano delegou para sessionManager.recalculatePlan()');
            return this.state?.planoDeOperacoes || [];
        } catch (error) {
            console.error('Erro no cálculo do plano:', error.message);
            throw error;
        }
    }

    /**
     * Adapta finalizarRegistroOperacao para registerTradingOperation
     * @private
     */
    async _adaptFinalizarRegistroOperacao(isWin, tag = '', stepIndex = null) {
        try {
            // Compatibilidade: em chamadas legadas apenas "tag" é passado (string) e o resultado
            // da operação está guardado em state.operacaoPendente do módulo legacy logic.
            let resolvedIsWin = isWin;
            let resolvedTag = tag;

            if (typeof isWin !== 'boolean') {
                // Primeiro argumento é tag; obter isWin do estado atual do gerenciador
                resolvedTag = String(isWin || '');
                resolvedIsWin = legacyState?.operacaoPendente?.isWin ?? resolvedIsWin;
            }

            const operationData = {
                isWin: Boolean(resolvedIsWin),
                tag: String(resolvedTag || ''),
                stepIndex:
                    stepIndex !== null ? stepIndex : this.tradingManager.state.proximaEtapaIndex,
            };

            const result = await this.tradingManager.registerTradingOperation(operationData);

            // Fechar modal de tags se ainda estiver aberto
            const tagsModalEl = document.getElementById('tags-modal');
            if (tagsModalEl?.classList.contains('show')) {
                tagsModalEl.classList.remove('show');
            }

            return result.operation;
        } catch (error) {
            console.error('Erro no registro da operação:', error.message);
            throw error;
        }
    }

    /**
     * Adapta desfazerOperacao para undoLastOperation
     * @private
     */
    async _adaptDesfazerOperacao() {
        try {
            return this.tradingManager.undoLastOperation();
        } catch (error) {
            console.error('Erro ao desfazer operação:', error.message);
            throw error;
        }
    }

    /**
     * Adapta updateState para updateConfiguration
     * @private
     */
    _adaptUpdateState(updates) {
        try {
            if (!updates || typeof updates !== 'object') {
                return false;
            }

            return this.tradingManager.updateConfiguration(updates);
        } catch (error) {
            console.error('Erro na atualização do estado:', error.message);
            return false;
        }
    }

    /**
     * Adapta verificarMetas (método privado no novo sistema)
     * @private
     */
    _adaptVerificarMetas() {
        try {
            // Como _checkGoalStatus é privado, precisamos acessar através de uma operação
            // Por enquanto, retorna status básico baseado no estado atual
            const { capitalInicioSessao, capitalAtual, stopWinValor, stopLossValor } =
                this.tradingManager.state;
            const profit = capitalAtual - capitalInicioSessao;

            return {
                stopWinAtingido: stopWinValor > 0 && profit >= stopWinValor,
                stopLossAtingido: stopLossValor > 0 && profit <= -stopLossValor,
                profit,
            };
        } catch (error) {
            console.error('Erro na verificação de metas:', error.message);
            return { stopWinAtingido: false, stopLossAtingido: false, profit: 0 };
        }
    }

    // ================================
    // MÉTODOS DE COMPATIBILIDADE PARA CÓDIGO LEGADO
    // ================================

    /**
     * Cria proxies para funções legadas que redirecionam para novos métodos
     * Permite que código legado continue funcionando sem modificações
     */
    createLegacyProxies(targetObject) {
        try {
            // Cria proxy para calcularPlano
            if (targetObject.calcularPlano) {
                const originalCalcPlan = targetObject.calcularPlano;
                targetObject.calcularPlano = async (...args) => {
                    try {
                        return await this.executeLegacyFunction('calcularPlano', ...args);
                    } catch (error) {
                        // Fallback para método original se adaptador falhar
                        console.warn('⚠️ Fallback para método legado calcularPlano');
                        return originalCalcPlan.apply(targetObject, args);
                    }
                };
            }

            // Cria proxy para finalizarRegistroOperacao
            if (targetObject.finalizarRegistroOperacao) {
                const originalFinalize = targetObject.finalizarRegistroOperacao;
                targetObject.finalizarRegistroOperacao = async (...args) => {
                    try {
                        return await this.executeLegacyFunction(
                            'finalizarRegistroOperacao',
                            ...args
                        );
                    } catch (error) {
                        console.warn('⚠️ Fallback para método legado finalizarRegistroOperacao');
                        return originalFinalize.apply(targetObject, args);
                    }
                };
            }

            // Cria proxy para desfazerOperacao
            if (targetObject.desfazerOperacao) {
                const originalUndo = targetObject.desfazerOperacao;
                targetObject.desfazerOperacao = async (...args) => {
                    try {
                        return await this.executeLegacyFunction('desfazerOperacao', ...args);
                    } catch (error) {
                        console.warn('⚠️ Fallback para método legado desfazerOperacao');
                        return originalUndo.apply(targetObject, args);
                    }
                };
            }

            console.log('🔗 Proxies legados criados com sucesso');
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'createLegacyProxies',
            });
        }
    }

    /**
     * Monitora performance comparando métodos novos vs legados
     */
    enablePerformanceMonitoring() {
        if (!this.isInitialized) return;

        // Monitor de cache hits
        const logCacheStats = debounce(() => {
            const stats = this.tradingManager.getCacheStats();
            console.log('📊 Cache Stats:', stats);
        }, 10000);

        // Executa log de estatísticas periodicamente
        logCacheStats();
    }

    /**
     * Migra dados do formato legado para novo formato
     * @param {Object} legacyData - Dados no formato antigo
     * @returns {Object} Dados no novo formato
     */
    migrateLegacyData(legacyData) {
        try {
            // Migração de configurações
            if (legacyData.config) {
                const migratedConfig = {
                    ...legacyData.config,
                    // Mapeia campos antigos para novos se necessário
                };
                return { config: migratedConfig };
            }

            // Migração de estado
            if (legacyData.state) {
                const migratedState = {
                    ...legacyData.state,
                    // Garante que novos campos existam
                    timeline: legacyData.state.timeline || [],
                };
                return { state: migratedState };
            }

            return legacyData;
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'migrateLegacyData',
            });
            return legacyData; // Retorna dados originais se migração falhar
        }
    }

    /**
     * Valida se sistema está funcionando corretamente
     * @returns {Object} Resultado da validação
     */
    validateSystem() {
        const validation = {
            isInitialized: this.isInitialized,
            tradingManagerExists: !!this.tradingManager,
            legacyFunctionsCount: this.legacyFunctionMap.size,
            errors: [],
        };

        try {
            if (!this.isInitialized) {
                validation.errors.push('Adaptador não foi inicializado');
            }

            if (!this.tradingManager) {
                validation.errors.push('TradingOperationsManager não foi criado');
            }

            if (this.legacyFunctionMap.size === 0) {
                validation.errors.push('Nenhuma função legada foi mapeada');
            }

            validation.isValid = validation.errors.length === 0;
        } catch (error) {
            validation.errors.push(`Erro na validação: ${error.message}`);
            validation.isValid = false;
        }

        return validation;
    }

    /**
     * Limpa recursos e caches
     */
    cleanup() {
        try {
            if (this.tradingManager) {
                this.tradingManager.clearCaches();
            }

            this.legacyFunctionMap.clear();
            this.isInitialized = false;

            console.log('🧹 LegacyIntegrationAdapter limpo com sucesso');
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'cleanup',
            });
        }
    }

    /**
     * Obtém estatísticas do adaptador
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            mappedFunctions: Array.from(this.legacyFunctionMap.keys()),
            tradingManagerStats: this.tradingManager ? this.tradingManager.getCacheStats() : null,
            validation: this.validateSystem(),
        };
    }
}

// Instância singleton do adaptador
export const legacyAdapter = new LegacyIntegrationAdapter();
