/**
 * GERENCIADOR DE OPERAÇÕES DE TRADING - GERENCIADOR PRO v9.3
 *
 * Refatoração do logic.js seguindo boas práticas
 * Quebra funções grandes em funções pequenas e focadas
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { TradingStrategyFactory } from './TradingStrategy.js';
import {
    calculateSequences,
    calculateMathematicalExpectancy,
    calculateMaxDrawdown,
} from '../utils/MathUtils.js';
import { memoize, debounce, measurePerformance } from '../utils/PerformanceUtils.js';
import { errorHandler, ErrorHelpers, ERROR_TYPES } from '../utils/ErrorHandler.js';
import {
    TRADING_STRATEGIES,
    DEFAULT_CONFIG,
    STORAGE_KEYS,
    ERROR_MESSAGES,
} from '../constants/AppConstants.js';

/**
 * Gerenciador principal de operações de trading
 * Responsabilidade única: coordenar lógica de negócio
 */
export class TradingOperationsManager {
    constructor(state, config, dbManager, ui, charts) {
        this.state = state;
        this.config = config;
        this.dbManager = dbManager;
        this.ui = ui;
        this.charts = charts;

        // Cache para operações custosas
        this._memoizedCalculations = this._setupMemoizedMethods();

        // Debounce para operações frequentes
        this._debouncedSave = debounce(
            this._saveSession ? this._saveSession.bind(this) : () => {},
            1000
        );
        // 🛡️ CORREÇÃO: UI update agora é async, criar wrapper para debounce
        this._debouncedUIUpdate = debounce(async () => {
            try {
                await this._updateAllUI();
            } catch (error) {
                console.error('Erro no debounced UI update:', error);
            }
        }, 300);
    }

    /**
     * Configura métodos memoizados para melhor performance
     * @private
     * @returns {Object} Objeto com métodos memoizados
     */
    _setupMemoizedMethods() {
        return {
            // Memoiza cálculo de estratégia (evita recálculos desnecessários)
            calculateStrategy: memoize((strategyType, config) => {
                const startTime = performance.now();

                try {
                    const strategy = TradingStrategyFactory.create(strategyType);
                    const result = strategy.calculatePlan(config);

                    const elapsed = performance.now() - startTime;
                    if (elapsed > 100) {
                        console.warn(`⚡ Cálculo de estratégia demorou ${elapsed.toFixed(2)}ms`);
                    }

                    return result;
                } catch (error) {
                    const elapsed = performance.now() - startTime;
                    console.error(`❌ Erro no cálculo após ${elapsed.toFixed(2)}ms:`, error);
                    throw ErrorHelpers.calculation('Erro no cálculo da estratégia', {
                        strategyType,
                        config: Object.keys(config),
                    });
                }
            }),

            // Memoiza cálculos estatísticos
            calculateStats: memoize((operations) => {
                if (!Array.isArray(operations) || operations.length === 0) {
                    return this._getEmptyStats();
                }

                return {
                    sequences: calculateSequences(operations),
                    expectancy: this._calculateExpectancyFromOperations(operations),
                    drawdown: calculateMaxDrawdown(operations),
                    winRate: this._calculateWinRate(operations),
                    totalOperations: operations.length,
                };
            }),
        };
    }

    /**
     * Calcula plano de operações usando a estratégia configurada
     * Função principal que substituirá calcularPlano do logic.js
     *
     * @param {boolean} forceRecalculation - Força recálculo mesmo se cached
     * @returns {Array<Object>} Plano de operações calculado
     */
    async calculateTradingPlan(forceRecalculation = false) {
        try {
            const startTime = performance.now();

            // Limpa cache se forçado
            if (forceRecalculation) {
                this._memoizedCalculations.calculateStrategy.clearCache();
            }

            // Prepara configuração para estratégia
            const strategyConfig = this._prepareStrategyConfig();

            // Valida configuração antes de calcular
            this._validateStrategyConfig(strategyConfig);

            // Calcula usando strategy memoizada
            const plan = this._memoizedCalculations.calculateStrategy(
                this.config.estrategiaAtiva,
                strategyConfig
            );

            // Preserva resultados de etapas já executadas
            const planWithPreservedResults = this._preserveExecutedSteps(plan);

            // Atualiza estado
            this.state.planoDeOperacoes = planWithPreservedResults;

            // Atualiza UI de forma otimizada
            if (forceRecalculation) {
                this._debouncedUIUpdate();
            }

            const elapsed = performance.now() - startTime;
            console.log(`📊 Plano calculado em ${elapsed.toFixed(2)}ms`);

            return planWithPreservedResults;
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'calculateTradingPlan',
                strategy: this.config.estrategiaAtiva,
                forceRecalculation,
            });
            throw error;
        }
    }

    /**
     * Registra nova operação de trading
     * Função principal que substituirá finalizarRegistroOperacao
     *
     * @param {Object} operationData - Dados da operação
     * @returns {Promise<Object>} Resultado do registro
     */
    async registerTradingOperation(operationData) {
        try {
            const startTime = performance.now();

            // Valida dados da operação
            this._validateOperationData(operationData);

            // Cria snapshot para undo
            const undoSnapshot = this._createUndoSnapshot();

            // Processa operação
            const processedOperation = await this._processOperation(operationData);

            // Atualiza estado do sistema
            this._updateSystemState(processedOperation);

            // Avança plano se necessário
            this._advanceTradingPlan(processedOperation);

            // Verifica metas (stop win/loss)
            const goalStatus = this._checkGoalStatus();

            // Atualiza gráficos de progresso
            this._updateProgressCharts();

            // Salva sessão de forma otimizada
            this._debouncedSave();

            // Atualiza UI de forma otimizada
            this._debouncedUIUpdate();

            const elapsed = performance.now() - startTime;
            console.log(`💼 Operação registrada em ${elapsed.toFixed(2)}ms`);

            return {
                operation: processedOperation,
                goalStatus,
                undoSnapshot,
            };
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'registerTradingOperation',
                operationType: operationData?.isWin ? 'win' : 'loss',
                stepIndex: operationData?.stepIndex,
            });
            throw error;
        }
    }

    /**
     * Desfaz última operação registrada
     * Função que substituirá desfazerOperacao
     */
    undoLastOperation() {
        try {
            if (!this.state.undoStack || this.state.undoStack.length === 0) {
                throw ErrorHelpers.validation('Nenhuma operação para desfazer');
            }

            let stackItem = this.state.undoStack.pop();
            // Suporta formato { snapshot: {...} }
            const snapshot = stackItem?.snapshot ? stackItem.snapshot : stackItem;

            // Restaura estado anterior
            this._restoreFromSnapshot(snapshot);

            // Atualiza UI
            this._debouncedUIUpdate();

            // Salva estado
            this._debouncedSave();

            console.log('↩️ Operação desfeita com sucesso');

            return snapshot;
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'undoLastOperation',
                undoStackSize: this.state.undoStack?.length || 0,
            });
            throw error;
        }
    }

    /**
     * Atualiza configurações do sistema
     * Função que substituirá updateState
     *
     * @param {Object} updates - Atualizações a serem aplicadas
     * @returns {boolean} Se requer recálculo do plano
     */
    updateConfiguration(updates) {
        try {
            const needsRecalculation = this._determineRecalculationNeed(updates);

            // Aplica atualizações
            Object.assign(this.state, updates);
            Object.assign(this.config, updates);

            // Recalcula plano se necessário
            if (needsRecalculation) {
                this.calculateTradingPlan(true);
            }

            return needsRecalculation;
        } catch (error) {
            errorHandler.handleError(error, {
                function: 'updateConfiguration',
                updatesKeys: Object.keys(updates),
            });
            throw error;
        }
    }

    // ================================
    // MÉTODOS PRIVADOS (FUNÇÕES PEQUENAS E FOCADAS)
    // ================================

    /**
     * Prepara configuração para estratégia
     * @private
     */
    _prepareStrategyConfig() {
        const baseCapital = this.config.incorporarLucros
            ? this.state.capitalDeCalculo
            : this.state.capitalInicioSessao;

        return {
            baseCapital,
            entryPercentage: this.config.percentualEntrada,
            payout: this.config.payout,
            recoveryDivisor: this.config.divisorRecuperacao || DEFAULT_CONFIG.RECOVERY_DIVISOR,
            maxCycles: 20,
        };
    }

    /**
     * Valida configuração da estratégia
     * @private
     */
    _validateStrategyConfig(config) {
        if (!config.baseCapital || config.baseCapital <= 0) {
            throw ErrorHelpers.validation(ERROR_MESSAGES.INVALID_CAPITAL);
        }

        if (!config.entryPercentage || config.entryPercentage <= 0) {
            throw ErrorHelpers.validation(ERROR_MESSAGES.INVALID_PERCENTAGE);
        }

        if (!config.payout || config.payout <= 0 || config.payout > 100) {
            throw ErrorHelpers.validation(ERROR_MESSAGES.INVALID_PAYOUT);
        }
    }

    /**
     * Preserva resultados de etapas já executadas
     * @private
     */
    _preserveExecutedSteps(newPlan) {
        const oldPlan = this.state.planoDeOperacoes || [];

        return newPlan.map((newStep, index) => {
            const oldStep = oldPlan[index];

            if (oldStep && this._isStepExecuted(oldStep)) {
                return {
                    ...newStep,
                    executada: oldStep.executada,
                    resultado: oldStep.resultado,
                    timestamp: oldStep.timestamp,
                };
            }

            return newStep;
        });
    }

    /**
     * Verifica se etapa foi executada
     * @private
     */
    _isStepExecuted(step) {
        return (
            step.executada === true || step.resultado !== undefined || step.timestamp !== undefined
        );
    }

    /**
     * Valida dados da operação
     * @private
     */
    _validateOperationData(operationData) {
        if (!operationData || typeof operationData !== 'object') {
            throw ErrorHelpers.validation('Dados da operação são obrigatórios');
        }

        if (typeof operationData.isWin !== 'boolean') {
            throw ErrorHelpers.validation('Resultado da operação (win/loss) é obrigatório');
        }
        // Se não houver sessão ativa, inicia automaticamente uma nova sessão
        if (!this.state.isSessionActive) {
            this._beginNewSession();
        }
    }

    /**
     * Cria snapshot para undo
     * @private
     */
    _createUndoSnapshot() {
        return {
            capitalAtual: this.state.capitalAtual,
            historicoCombinado: [...this.state.historicoCombinado],
            proximaEtapaIndex: this.state.proximaEtapaIndex,
            planoDeOperacoes: [...this.state.planoDeOperacoes],
            timestamp: Date.now(),
        };
    }

    /**
     * Processa dados da operação
     * @private
     */
    async _processOperation(operationData) {
        const currentStep = this.state.planoDeOperacoes[this.state.proximaEtapaIndex];

        if (!currentStep) {
            throw ErrorHelpers.validation('Nenhuma etapa disponível para execução');
        }

        const operation = {
            id: this._generateOperationId(),
            timestamp: new Date().toISOString(),
            isWin: operationData.isWin,
            etapa: currentStep.etapa,
            entrada: this._getStepEntryAmount(currentStep),
            retorno: operationData.isWin ? this._getStepReturnAmount(currentStep) : 0,
            // Padronização: manter ambos por compatibilidade, priorizando 'valor' como fonte de verdade
            resultado: this._calculateOperationResult(operationData, currentStep),
            valor: undefined, // definido logo abaixo para garantir número estável
            // Compatibilidade com código legado que usa valorEntrada/valorRetorno
            valorEntrada: undefined,
            valorRetorno: undefined,
            payout: this.config.payout,
            tag: operationData.tag || '',
            stepIndex: this.state.proximaEtapaIndex,
        };

        // Normalizações finais e compatibilidade
        const entradaNum = Number(operation.entrada);
        const retornoNum = Number(operation.retorno);
        const resultadoNum =
            typeof operation.resultado === 'number' && !isNaN(operation.resultado)
                ? operation.resultado
                : 0;
        operation.valor = resultadoNum; // 'valor' passa a ser a propriedade canônica
        operation.valorEntrada =
            typeof entradaNum === 'number' && !isNaN(entradaNum) ? entradaNum : 0;
        operation.valorRetorno =
            typeof retornoNum === 'number' && !isNaN(retornoNum) ? retornoNum : 0;

        return operation;
    }

    /**
     * Atualiza estado do sistema com nova operação
     * @private
     */
    _updateSystemState(operation) {
        // Adiciona ao histórico
        this.state.historicoCombinado.push(operation);

        // 🛡️ PROTEÇÃO ULTRA-ROBUSTA CONTRA NaN NO CAPITAL
        const resultadoSeguro =
            typeof operation.resultado === 'number' && !isNaN(operation.resultado)
                ? operation.resultado
                : 0;
        const capitalAnterior =
            typeof this.state.capitalAtual === 'number' && !isNaN(this.state.capitalAtual)
                ? this.state.capitalAtual
                : this.config.capitalInicial;

        // Atualiza capital com verificação dupla
        this.state.capitalAtual = capitalAnterior + resultadoSeguro;

        // 🚨 VERIFICAÇÃO DE SEGURANÇA PÓS-OPERAÇÃO
        if (typeof this.state.capitalAtual !== 'number' || isNaN(this.state.capitalAtual)) {
            console.error('🚨 ERRO CRÍTICO: capitalAtual tornou-se NaN após operação!', {
                capitalAnterior,
                resultadoSeguro,
                operationData: operation,
            });
            // 🚑 RECUPERAÇÃO DE EMERGÊNCIA
            this.state.capitalAtual = this.config.capitalInicial;
        }

        // Marca etapa como executada
        const currentStep = this.state.planoDeOperacoes[this.state.proximaEtapaIndex];
        if (currentStep) {
            currentStep.executada = true;
            currentStep.resultado = resultadoSeguro;
            currentStep.timestamp = operation.timestamp;
        }
    }

    /**
     * Avança no plano de operações
     * @private
     */
    _advanceTradingPlan(operation) {
        if (this.config.estrategiaAtiva === TRADING_STRATEGIES.FIXED_AMOUNT) {
            // Estratégia fixa: não avança, sempre fica na primeira etapa
            return;
        }

        // Estratégia de ciclos: avança baseado no resultado
        if (operation.isWin) {
            this.state.proximaEtapaIndex = 0; // Volta para mão fixa
        } else {
            this.state.proximaEtapaIndex = Math.min(
                this.state.proximaEtapaIndex + 1,
                this.state.planoDeOperacoes.length - 1
            );
        }
    }

    /**
     * Verifica status das metas (stop win/loss)
     * @private
     */
    _checkGoalStatus() {
        const { capitalInicioSessao, capitalAtual, stopWinValor, stopLossValor } = this.state;
        const profit = capitalAtual - capitalInicioSessao;

        const goalStatus = {
            goalReached: false,
            type: null,
            profit,
        };

        if (stopWinValor > 0 && profit >= stopWinValor) {
            goalStatus.goalReached = true;
            goalStatus.type = 'win';
            this.state.metaAtingida = true;
        } else if (stopLossValor > 0 && profit <= -stopLossValor) {
            goalStatus.goalReached = true;
            goalStatus.type = 'loss';
            this.state.metaAtingida = true;
        }

        return goalStatus;
    }

    /**
     * Atualiza gráficos de progresso
     * @private
     */
    _updateProgressCharts() {
        try {
            const targetRates = {
                winTarget: 60,
                lossTarget: 40,
            };

            // 🚀 Usa nova função com verificações robustas
            const success = this.charts.updateProgressChart(this.state.historicoCombinado);

            if (!success) {
                console.warn('⚠️ TradingManager: Falha ao atualizar progresso, reinicializando...');
                this.charts.initProgressChart();
            }
        } catch (error) {
            errorHandler.handleError(error, {
                function: '_updateProgressCharts',
            });
        }
    }

    /**
     * Determina se atualizações requerem recálculo
     * @private
     */
    _determineRecalculationNeed(updates) {
        const recalcFields = [
            'capitalInicial',
            'percentualEntrada',
            'estrategiaAtiva',
            'payout',
            'divisorRecuperacao',
        ];

        return recalcFields.some((field) => updates.hasOwnProperty(field));
    }

    /**
     * Restaura estado de snapshot
     * @private
     */
    _restoreFromSnapshot(snapshot) {
        this.state.capitalAtual = snapshot.capitalAtual;
        this.state.historicoCombinado = snapshot.historicoCombinado;
        this.state.proximaEtapaIndex = snapshot.proximaEtapaIndex;
        this.state.planoDeOperacoes = snapshot.planoDeOperacoes;
    }

    /**
     * Salva sessão atual
     * @private
     */
    async _saveSession() {
        try {
            if (this.state.isSessionActive) {
                await this.dbManager.saveActiveSession(this.state);
            }
        } catch (error) {
            errorHandler.handleError(error, {
                function: '_saveSession',
            });
        }
    }

    /**
     * Atualiza toda a UI
     * @private
     */
    async _updateAllUI() {
        try {
            // 🛡️ CORREÇÃO CRÍTICA: SEMPRE usar estado global atualizado, NUNCA this.state
            const globalState = window.state || this.state;
            const globalConfig = window.config || this.config;

            console.log('🔄 [TM-UI] _updateAllUI usando estado global:', {
                globalHistorico: globalState.historicoCombinado?.length || 0,
                thisStateHistorico: this.state.historicoCombinado?.length || 0,
                globalCapital: globalState.capitalAtual,
                thisStateCapital: this.state.capitalAtual,
            });

            // 🛡️ CORREÇÃO CRÍTICA: Aguardar conclusão do dashboard
            await this.ui.atualizarDashboardSessao();
            this.ui.atualizarVisualPlano();
            this.ui.renderizarTabela();

            // 🛡️ CORREÇÃO CRÍTICA: SEMPRE usar dados do estado GLOBAL para timeline
            if (this.ui.renderizarTimelineCompleta && globalState.historicoCombinado) {
                console.log(
                    '🎨 [TM-UI] Renderizando timeline com dados GLOBAIS:',
                    globalState.historicoCombinado.length,
                    'operações'
                );
                this.ui.renderizarTimelineCompleta(globalState.historicoCombinado);
            }
        } catch (error) {
            errorHandler.handleError(error, {
                function: '_updateAllUI',
            });
        }
    }

    // ================================
    // MÉTODOS DE SINCRONIZAÇÃO COM SISTEMA LEGACY
    // ================================

    /**
     * Sincroniza estado interno com sistema legacy
     * Corrige conflito entre sistemas paralelos de gestão
     * @param {Object} legacyState - Estado do sistema legacy
     * @param {Object} legacyConfig - Config do sistema legacy
     */
    _syncStateFromLegacy(legacyState, legacyConfig) {
        console.log('🔄 [SYNC] Iniciando sincronização TradingOperationsManager <- Legacy');

        try {
            // Sincronizar campos críticos do estado
            const fieldsToSync = [
                'isSessionActive',
                'sessionMode',
                'capitalAtual',
                'capitalInicioSessao',
                'proximaEtapaIndex',
                'proximoAporte',
                'historicoCombinado',
                'planoDeOperacoes',
                'undoStack',
                'metaAtingida',
                'stopWinValor',
                'stopLossValor',
            ];

            fieldsToSync.forEach((field) => {
                if (legacyState.hasOwnProperty(field)) {
                    this.state[field] = legacyState[field];
                }
            });

            // Sincronizar configurações críticas
            const configFieldsToSync = [
                'capitalInicial',
                'percentualEntrada',
                'stopWinPerc',
                'stopLossPerc',
                'payout',
                'estrategiaAtiva',
                'divisorRecuperacao',
            ];

            configFieldsToSync.forEach((field) => {
                if (legacyConfig.hasOwnProperty(field)) {
                    this.config[field] = legacyConfig[field];
                }
            });

            console.log('✅ [SYNC] TradingOperationsManager sincronizado:', {
                historicoCombinado: this.state.historicoCombinado?.length || 0,
                capitalAtual: this.state.capitalAtual,
                isSessionActive: this.state.isSessionActive,
            });
        } catch (error) {
            console.error('❌ [SYNC] Erro na sincronização TradingOperationsManager:', error);
            throw error;
        }
    }

    // ================================
    // MÉTODOS UTILITÁRIOS
    // ================================

    /**
     * Gera ID único para operação
     * @private
     */
    _generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtém valor de entrada da etapa
     * @private
     */
    _getStepEntryAmount(step) {
        // Para etapas cíclicas que têm entrada1 e entrada2
        if (step.entrada1 !== undefined) {
            // 🛡️ PROTEÇÃO CONTRA NaN
            const entrada1 = Number(step.entrada1);
            return typeof entrada1 === 'number' && !isNaN(entrada1) ? entrada1 : 0;
        }

        // 🛡️ PROTEÇÃO CONTRA NaN para entrada simples
        const entrada = Number(step.entrada);
        return typeof entrada === 'number' && !isNaN(entrada) ? entrada : 0;
    }

    /**
     * Obtém valor de retorno da etapa
     * @private
     */
    _getStepReturnAmount(step) {
        if (step.retorno1 !== undefined) {
            // 🛡️ PROTEÇÃO CONTRA NaN
            const retorno1 = Number(step.retorno1);
            return typeof retorno1 === 'number' && !isNaN(retorno1) ? retorno1 : 0;
        }

        // 🛡️ PROTEÇÃO CONTRA NaN para retorno simples
        const retorno = Number(step.retorno);
        return typeof retorno === 'number' && !isNaN(retorno) ? retorno : 0;
    }

    /**
     * Calcula resultado da operação
     * @private
     */
    _calculateOperationResult(operationData, step) {
        if (operationData.isWin) {
            const retorno = this._getStepReturnAmount(step);
            // 🛡️ VERIFICAÇÃO FINAL CONTRA NaN
            return typeof retorno === 'number' && !isNaN(retorno) ? retorno : 0;
        } else {
            const entrada = this._getStepEntryAmount(step);
            // 🛡️ VERIFICAÇÃO FINAL CONTRA NaN
            const resultado = -(typeof entrada === 'number' && !isNaN(entrada) ? entrada : 0);
            return resultado;
        }
    }

    /**
     * Calcula expectativa matemática das operações
     * @private
     */
    _calculateExpectancyFromOperations(operations) {
        if (!operations.length) return 0;

        const wins = operations.filter((op) => op.isWin).length;
        const winRate = (wins / operations.length) * 100;

        // Calcula payout médio das operações ganhas
        const winningOps = operations.filter((op) => op.isWin);
        const avgPayout =
            winningOps.length > 0
                ? winningOps.reduce((sum, op) => sum + (op.payout || 87), 0) / winningOps.length
                : 87;

        return calculateMathematicalExpectancy(winRate, avgPayout);
    }

    /**
     * Calcula win rate das operações
     * @private
     */
    _calculateWinRate(operations) {
        if (!operations.length) return 0;
        const wins = operations.filter((op) => op.isWin).length;
        return (wins / operations.length) * 100;
    }

    /**
     * Retorna estatísticas vazias
     * @private
     */
    _getEmptyStats() {
        return {
            totalWin: 0,
            totalLoss: 0,
            winRate: 0,
            expectancy: 0,
            maxDrawdown: 0,
        };
    }

    /**
     * Inicia uma nova sessão caso ainda não exista.
     * Garante compatibilidade com chamadas legadas que assumem sessão ativa.
     * @private
     */
    _beginNewSession() {
        this.state.isSessionActive = true;
        this.state.historicoCombinado = [];
        this.state.undoStack = [];
        this.state.capitalAtual = this.config.capitalInicial || this.state.capitalAtual || 0;
        this.state.proximaEtapaIndex = 0;

        // Certifica plano
        if (
            !Array.isArray(this.state.planoDeOperacoes) ||
            this.state.planoDeOperacoes.length === 0
        ) {
            this.calculateTradingPlan(true);
        }

        console.log('🆕 Nova sessão iniciada automaticamente');
    }

    /**
     * Limpa caches para otimizar memória
     */
    clearCaches() {
        this._memoizedCalculations.calculateStrategy.clearCache();
        this._memoizedCalculations.calculateStats.clearCache();
        console.log('🧹 Caches do TradingOperationsManager limpos');
    }

    /**
     * Obtém estatísticas dos caches
     */
    getCacheStats() {
        return {
            strategyCache: this._memoizedCalculations.calculateStrategy.getCacheSize(),
            statsCache: this._memoizedCalculations.calculateStats.getCacheSize(),
        };
    }

    /**
     * Salva sessão (método stub para compatibilidade)
     * @private
     */
    _saveSession() {
        try {
            // Placeholder para implementação futura
            console.log('📝 TradingOperationsManager: Salvando sessão...');
        } catch (error) {
            console.warn('⚠️ Erro ao salvar sessão:', error);
        }
    }

    /**
     * Salva a sessão atual
     * @private
     */
    _saveSession() {
        try {
            console.log('📝 TradingOperationsManager: Salvando sessão...');
            // Implementar salvamento se necessário
        } catch (error) {
            console.warn('⚠️ Erro ao salvar sessão:', error);
        }
    }
}
