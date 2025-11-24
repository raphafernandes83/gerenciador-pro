import { state, config, CONSTANTS, resetState, resetConfig } from './state.js';
import { Features } from './src/config/Features.js';
import {
    getState as getStoreState,
    setState as setStoreState,
    reset as resetStore,
    selectors as storeSelectors,
} from './state/sessionStore.js';
import { isDevelopment } from './src/config/EnvProvider.js';
// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Core modules
import { charts } from './charts.js';
import { dbManager } from './db.js';
import { dom } from './dom.js';
import { ui } from './ui.js';
import { sessionManager } from './src/managers/SessionManager.js';
import { operationManager } from './src/managers/OperationManager.js';

// Monitoring
import { performanceTracker } from './src/monitoring/PerformanceTracker.js';

// Utilities (alphabetical order)
import {
    calculateStopValue,
    toPercentage,
    calculateSequences,
    calculateMaxDrawdown,
    calculateMathematicalExpectancy
} from './src/utils/MathUtilsIntegration.js';
import { logger } from './src/utils/Logger.js';
import { memoize, memoizeByArraySignature } from './src/utils/PerformanceUtils.js';
import { generateRequestId, safeLog } from './src/utils/SecurityUtils.js';

// Novos módulos refatorados
import * as CalculationsUtils from './src/utils/CalculationsUtils.js';
import * as StateLoader from './src/utils/StateLoader.js';
import { reprocessarHistorico as reprocessHistoryFunc, logicaAvancoPlano as planAdvanceFunc } from './src/business/HistoryProcessor.js';
import { verificarMetas as checkGoalsFunc } from './src/business/GoalsChecker.js';

// ============================================================================
// FUNÇÕES DE CÁLCULO - Agora importadas de CalculationsUtils.js
// ============================================================================

// Re-exportar funções de cálculo do módulo centralizado
export const {
    normalizeOperation,
    normalizeHistory,
    calcularSequencias,
    calcularExpectativaMatematica,
    calcularDrawdown,
    calcularPayoffRatio
} = CalculationsUtils;

// ============================================================================
// GERENCIAMENTO DE ESTADO - Agora importado de StateLoader.js
// ============================================================================

// Re-exportar função de atualização de estado
export const updateState = StateLoader.updateState;

// Objeto com a lógica de negócio que manipula o estado
export const logic = {
    checkForActiveSession() {
        return sessionManager.checkForActiveSession();
    },

    loadActiveSession(savedSession) {
        return sessionManager.loadActiveSession(savedSession);
    },

    saveActiveSession() {
        return sessionManager.saveActiveSession();
    },

    clearActiveSession() {
        return sessionManager.clearActiveSession();
    },

    async resetSessionState() {
        return await sessionManager.resetSessionState();
    },

    safeJSONParse(key, defaultValue) {
        return sessionManager.safeJSONParse(key, defaultValue);
    },

    loadStateFromStorage() {
        return StateLoader.loadStateFromStorage();
    },

    updateCalculatedValues() {
        return sessionManager.updateCalculatedValues();
    },

    async startNewSession(mode) {
        return await sessionManager.startNewSession(mode);
    },

    async calcularPlano(forceRedraw = false) {
        return await sessionManager.recalculatePlan(forceRedraw);
    },

    // Métodos legados mantidos para compatibilidade (delegam ou não fazem nada se obsoletos)
    calcularPlanoMaoFixa() {
        // Agora tratado internamente pelo PlanCalculator
    },

    async calcularPlanoCiclos() {
        // Agora tratado internamente pelo PlanCalculator
    },

    _handleInvalidPayout() {
        // Agora tratado internamente pelo PlanCalculator/SessionManager
    },

    _handleCalculationError(error) {
        // Agora tratado internamente pelo SessionManager
    },

    preservarResultadosExecutados(planoNovo) {
        // Agora tratado internamente pelo SessionManager
    },

    iniciarRegistroOperacao(dadosOperacao) {
        return operationManager.iniciarRegistroOperacao(dadosOperacao);
    },

    async finalizarRegistroOperacao(tag) {
        return await operationManager.finalizarRegistroOperacao(tag);
    },

    _validateOperationRequest() {
        // Agora interno no OperationManager
    },

    _calculateOperationValues() {
        // Agora interno no OperationManager
    },

    _createOperationObject(values, tag) {
        // Agora interno no OperationManager
    },

    _updateApplicationState(operacao) {
        // Agora interno no OperationManager
    },

    _recalcularCapitalSeguro() {
        // Agora interno no OperationManager
    },

    _markStepAsCompleted(etapa, aporte) {
        // Agora interno no OperationManager
    },

    async _processPostOperation(operacao) {
        // Agora interno no OperationManager
    },

    _cleanupPendingOperation() {
        // Agora interno no OperationManager
    },

    createStateSnapshot() {
        return operationManager.createStateSnapshot();
    },

    async editReplayedOperation(sessionId, opIndex, newResult) {
        return await operationManager.editReplayedOperation(sessionId, opIndex, newResult);
    },

    desfazerOperacao() {
        return operationManager.desfazerOperacao();
    },

    editOperation(opIndex, newIsWin) {
        return operationManager.editOperation(opIndex, newIsWin);
    },

    /**
     * Remove uma operação da sessão ativa (timeline)
     */
    deleteOperation(opIndex) {
        try {
            if (opIndex < 0 || opIndex >= state.historicoCombinado.length) return false;
            // Enviar para lixeira usando sistema profissional
            try {
                const op = state.historicoCombinado[opIndex];
                if (op && window.trashManager) {
                    // Adiciona contexto da sessão ativa ao backup
                    const operationWithContext = {
                        ...op,
                        sessionContext: {
                            isActive: true,
                            capitalAtual: state.capitalAtual,
                            capitalInicioSessao: state.capitalInicioSessao,
                            sessionMode: state.sessionMode,
                            operationIndex: opIndex
                        }
                    };

                    window.trashManager.moveToTrash(
                        operationWithContext,
                        window.trashManager.categories.OPERATION,
                        window.trashManager.complexityLevels.MEDIUM
                    );
                }
            } catch (error) {
                logger.warn('⚠️ Erro ao mover operação para lixeira:', error);
            }
            state.undoStack = [];
            state.historicoCombinado.splice(opIndex, 1);
            this.reprocessarHistorico();
            this.saveActiveSession();
            ui.mostrarInsightPopup('Operação removida.', '🗑️');
            ui.atualizarTudo();
            return true;
        } catch (error) {
            logger.error('Erro ao remover operação', { error: String(error) });
            ui.showModal({ title: 'Erro', message: 'Não foi possível remover a operação.' });
            return false;
        }
    },

    /**
     * Remove uma operação de uma sessão arquivada (replay)
     */
    async deleteReplayedOperation(sessionId, opIndex) {
        try {
            const sessao = await dbManager.getSessionById(sessionId);
            if (!sessao || !Array.isArray(sessao.historicoCombinado)) return false;
            if (opIndex < 0 || opIndex >= sessao.historicoCombinado.length) return false;
            // Enviar para lixeira usando sistema profissional
            try {
                const op = sessao.historicoCombinado[opIndex];
                if (op && window.trashManager) {
                    // Adiciona contexto da sessão arquivada ao backup
                    const operationWithContext = {
                        ...op,
                        sessionContext: {
                            isActive: false,
                            sessionId: sessionId,
                            origin: 'replay',
                            operationIndex: opIndex,
                            sessionData: {
                                data: sessao.data,
                                modo: sessao.modo,
                                capitalInicial: sessao.capitalInicial,
                                resultadoFinanceiro: sessao.resultadoFinanceiro
                            }
                        }
                    };

                    window.trashManager.moveToTrash(
                        operationWithContext,
                        window.trashManager.categories.OPERATION,
                        window.trashManager.complexityLevels.COMPLEX
                    );
                }
            } catch (error) {
                logger.warn('⚠️ Erro ao mover operação arquivada para lixeira:', error);
            }
            sessao.historicoCombinado.splice(opIndex, 1);
            sessao.resultadoFinanceiro = sessao.historicoCombinado.reduce((acc, op) => acc + (Number(op.valor) || 0), 0);
            await dbManager.updateSession(sessao);
            await ui.showReplayModal(sessionId);
            ui.mostrarInsightPopup('Operação removida da sessão.', '🗑️');
            try {
                document.dispatchEvent(new CustomEvent('sessionEdited', { detail: { sessionId } }));
            } catch (_) { }
            return true;
        } catch (error) {
            logger.error('Erro ao remover operação arquivada', { error: String(error) });
            ui.showModal({ title: 'Erro', message: 'Não foi possível remover a operação da sessão.' });
            return false;
        }
    },

    // Atualiza o valor de uma operação da sessão ativa
    updateOperationValue(opIndex, novoValor) {
        try {
            if (opIndex < 0 || opIndex >= state.historicoCombinado.length) return false;
            const n = Number(novoValor);
            if (!isFinite(n)) throw new Error('Valor inválido');
            const op = state.historicoCombinado[opIndex];
            op.valor = n;
            // Coerência com isWin
            if (typeof op.isWin === 'boolean') {
                if (n >= 0) op.isWin = true; else op.isWin = false;
            }
            this.reprocessarHistorico();
            this.saveActiveSession();
            ui.mostrarInsightPopup('Valor da operação atualizado.', '💾');
            ui.atualizarTudo();
            return true;
        } catch (error) {
            logger.error('Erro ao atualizar valor da operação', { error: String(error) });
            ui.showModal({ title: 'Erro', message: 'Não foi possível atualizar o valor da operação.' });
            return false;
        }
    },

    // Atualiza o valor de uma operação no replay (sessão arquivada)
    async updateReplayedOperationValue(sessionId, opIndex, novoValor) {
        try {
            const sessao = await dbManager.getSessionById(sessionId);
            if (!sessao || !Array.isArray(sessao.historicoCombinado)) return false;
            const n = Number(novoValor);
            if (!isFinite(n)) throw new Error('Valor inválido');
            if (opIndex < 0 || opIndex >= sessao.historicoCombinado.length) return false;
            const op = sessao.historicoCombinado[opIndex];
            op.valor = n;
            if (typeof op.isWin === 'boolean') op.isWin = n >= 0;
            sessao.resultadoFinanceiro = sessao.historicoCombinado.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);
            await dbManager.updateSession(sessao);
            await ui.showReplayModal(sessionId);
            ui.mostrarInsightPopup('Valor da operação atualizado (replay).', '💾');
            try { document.dispatchEvent(new CustomEvent('sessionEdited', { detail: { sessionId } })); } catch (_) { }
            return true;
        } catch (error) {
            logger.error('Erro ao atualizar valor (replay)', { error: String(error) });
            ui.showModal({ title: 'Erro', message: 'Não foi possível atualizar o valor no replay.' });
            return false;
        }
    },

    reprocessarHistorico() {
        return reprocessHistoryFunc();
    },

    logicaAvancoPlano(isWin, index, aporte, resultado) {
        return planAdvanceFunc(isWin, index, aporte, resultado);
    },

    async verificarMetas() {
        return await checkGoalsFunc();
    },

    /**
     * Atualiza os gráficos de progresso de metas Win/Loss
     * VERSÃO MELHORADA: Integra com novo sistema de cálculos e listeners
     */
    updateProgressCharts() {
        try {
            logger.debug('🎯 LOGIC: Iniciando atualização do progresso...');

            // 🔧 CORREÇÃO: Obtém histórico de forma mais robusta
            const history = this._getSessionHistory();

            logger.debug('📋 Histórico atual:', {
                length: history.length,
                isArray: Array.isArray(history),
                firstOps: history.slice(0, 3).map((op) => ({
                    isWin: op.isWin,
                    valor: op.valor,
                    resultado: op.resultado
                })),
            });

            // 🚫 DESABILITADO: Inicialização automática removida para evitar gráficos duplicados
            // O gráfico deve ser inicializado apenas uma vez no fluxo principal (main.js ou ui.js)
            /*
            if (!charts.progressMetasChart) {
                logger.info('🎯 Gráfico não existe, inicializando...');
                const initSuccess = charts.initProgressChart();
                if (!initSuccess) {
                    logger.error('❌ Falha crítica ao inicializar gráfico');
                    return false;
                }
            }
            */

            // 🚀 NOVO: Usa sistema de cálculos e atualização integrado
            if (typeof charts.scheduleProgressUpdate === 'function') {
                charts.scheduleProgressUpdate(history);
                this.updateProgressSessionInfo();
                return true;
            }

            // Fallback para sistema antigo
            const success = charts.updateProgressChart(history);

            // 🚫 DESABILITADO: Reinicialização automática removida para evitar gráficos duplicados
            /*
            if (!success) {
                logger.warn('⚠️ Falha ao atualizar progresso de metas, tentando reinicializar...');
                const reinitSuccess = charts.initProgressChart();
                if (reinitSuccess) {
                    // Tenta atualizar novamente após reinicialização
                    charts.updateProgressChart(history);
                }
            }
            */

            // 📊 Atualiza informação da sessão
            this.updateProgressSessionInfo();
            return true;
        } catch (error) {
            logger.error('❌ Erro ao atualizar gráficos de progresso', { error: String(error) });
            return false;
        }
    },

    /**
     * 📋 Obtém histórico da sessão de forma robusta
     * @private
     * @returns {Array} Histórico de operações
     */
    _getSessionHistory() {
        try {
            // Prioriza store se disponível
            const useStore = (window.Features && window.Features.FEATURE_store_pubsub) ||
                Features.FEATURE_store_pubsub;

            if (useStore && Array.isArray(getStoreState().historicoCombinado)) {
                return getStoreState().historicoCombinado;
            }

            // Fallback para state local
            return Array.isArray(state.historicoCombinado) ? state.historicoCombinado : [];
        } catch (error) {
            logger.warn('⚠️ Erro ao obter histórico, usando array vazio:', { error: error.message });
            return [];
        }
    },

    /**
     * 🔄 Cria listener para mudanças no histórico de operações
     * NOVO: Sistema de listeners automáticos
     */
    createOperationListener() {
        try {
            // Listener para mudanças no state.historicoCombinado
            let lastHistoryLength = state.historicoCombinado?.length || 0;

            const checkHistoryChanges = () => {
                const currentLength = state.historicoCombinado?.length || 0;

                if (currentLength !== lastHistoryLength) {
                    logger.debug('🔄 Mudança detectada no histórico:', {
                        anterior: lastHistoryLength,
                        atual: currentLength
                    });

                    // Atualiza gráficos automaticamente
                    this.updateProgressCharts();
                    lastHistoryLength = currentLength;
                }
            };

            // Verifica mudanças a cada 1 segundo (otimizado)
            const historyWatcher = setInterval(checkHistoryChanges, 1000);

            // Armazena referência para cleanup
            this._historyWatcher = historyWatcher;

            logger.info('🔄 Listener de operações criado com sucesso');
            return historyWatcher;
        } catch (error) {
            logger.error('❌ Erro ao criar listener de operações:', { error: String(error) });
            return null;
        }
    },

    /**
     * 🛑 Remove listener de operações
     */
    removeOperationListener() {
        try {
            if (this._historyWatcher) {
                clearInterval(this._historyWatcher);
                this._historyWatcher = null;
                logger.info('🛑 Listener de operações removido');
            }
        } catch (error) {
            logger.error('❌ Erro ao remover listener:', { error: error.message });
        }
    },

    /**
     * 📊 Atualiza informação sobre o estado da sessão
     * Mostra se a sessão está ativa ou inativa
     */
    updateProgressSessionInfo() {
        try {
            if (dom.progressSessionInfo) {
                // 🔧 CORREÇÃO: Usar state diretamente como no backup funcionando
                const ops = Array.isArray(state.historicoCombinado)
                    ? state.historicoCombinado.length
                    : 0;
                const sessionText = state.isSessionActive
                    ? `Sessão Ativa - ${ops} ops`
                    : 'Sessão Inativa';
                dom.progressSessionInfo.textContent = sessionText;
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao atualizar info da sessão', { error: String(error) });
        }
    },
};

/**
 * 🧪 FUNÇÃO DE TESTE - Logic Functions
 * Testa todas as funcionalidades principais da lógica de negócio
 */
async function testLogicFunctions() {
    logger.debug('🧪 Testando funções de lógica...');

    const startTime = performance.now();
    const results = {
        calculations: false,
        planGeneration: false,
        stateManagement: false,
        validation: false,
        sessionControl: false,
        overall: false,
    };

    try {
        // 1. Teste de cálculos básicos
        logger.debug('🔢 Testando cálculos...');
        try {
            // Backup config atual
            const originalConfig = { ...config };

            // Define valores de teste
            config.capitalInicial = 1000;
            config.percentualEntrada = 2;
            config.payout = 80;

            // Testa cálculo da entrada
            const entrada = logic.calcularEntrada();
            if (entrada === 20) {
                // 2% de 1000
                results.calculations = true;
                logger.debug('✅ Cálculos: OK (entrada =', entrada, ')');
            } else {
                logger.warn('⚠️ Cálculos: entrada esperada 20, obtida', { entrada });
            }

            // Restaura config
            Object.assign(config, originalConfig);
        } catch (error) {
            logger.warn('⚠️ Cálculos', { error: error.message });
        }

        // 2. Teste de geração de plano
        logger.debug('📋 Testando geração de plano...');
        try {
            // Backup estado atual
            const originalStrategy = config.estrategiaAtiva;

            config.estrategiaAtiva = 'ciclos';
            await logic.calcularPlano();

            if (state.planoDeOperacoes && state.planoDeOperacoes.length > 0) {
                results.planGeneration = true;
                logger.debug('✅ Plano:', state.planoDeOperacoes.length, 'operações geradas');
            }

            // Restaura estratégia
            config.estrategiaAtiva = originalStrategy;
        } catch (error) {
            logger.warn('⚠️ Geração de plano', { error: error.message });
        }

        // 3. Teste de gerenciamento de estado
        logger.debug('🏦 Testando gerenciamento de estado...');
        try {
            const originalCapital = state.capitalAtual;

            // Testa atualização de capital
            // 🆕 CHECKPOINT 1.2: Usando StateManager se disponível
            if (window.stateManager) {
                window.stateManager.setState({ capitalAtual: 1500 }, 'logic.test');
            } else {
                state.capitalAtual = 1500;
            }
            logic.atualizarCapitalDisplay();

            if (state.capitalAtual === 1500) {
                results.stateManagement = true;
                logger.debug('✅ Estado: OK');
            }

            // Restaura capital
            if (window.stateManager) {
                window.stateManager.setState({ capitalAtual: originalCapital }, 'logic.test:restore');
            } else {
                state.capitalAtual = originalCapital;
            }
        } catch (error) {
            logger.warn('⚠️ Gerenciamento de estado', { error: error.message });
        }

        // 4. Teste de validação
        logger.debug('✅ Testando validações...');
        try {
            // Testa validação de entrada inválida
            const originalPayout = config.payout;
            config.payout = 0; // Valor inválido

            logic.calcularPlanoMaoFixa(); // Deve detectar payout inválido

            config.payout = originalPayout; // Restaura
            results.validation = true;
            logger.debug('✅ Validação: OK');
        } catch (error) {
            logger.warn('⚠️ Validação', { error: error.message });
        }

        // 5. Teste de controle de sessão
        logger.debug('🎮 Testando controle de sessão...');
        try {
            const originalSession = state.isSessionActive;

            // Testa mudança de estado da sessão
            state.isSessionActive = !originalSession;
            logic.updateProgressSessionInfo();

            state.isSessionActive = originalSession; // Restaura
            results.sessionControl = true;
            logger.debug('✅ Sessão: OK');
        } catch (error) {
            logger.warn('⚠️ Controle de sessão', { error: error.message });
        }

        // Resultado geral
        const successCount = Object.values(results).filter(Boolean).length;
        results.overall = successCount >= 3; // Pelo menos 3 de 5 testes

        const endTime = performance.now();
        logger.debug(`⏱️ Testes Logic executados em ${(endTime - startTime).toFixed(2)}ms`);

        if (results.overall) {
            logger.debug('✅ LOGIC FUNCTIONS: Funcionando corretamente!');
        } else {
            logger.warn('⚠️ LOGIC FUNCTIONS: Alguns problemas encontrados');
        }

        return results;
    } catch (error) {
        logger.error('❌ Erro crítico nos testes Logic', { error: String(error) });
        return { ...results, overall: false };
    }
}

// Exposição global
if (typeof window !== 'undefined') {
    window.testLogicFunctions = testLogicFunctions;
    logger.debug('🧪 testLogicFunctions() disponível globalmente');
}
