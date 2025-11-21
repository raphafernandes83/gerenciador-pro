/**
 * GERENCIADOR DE SESSÃO
 * 
 * Responsável pelo ciclo de vida da sessão (início, fim, persistência, reset)
 * e gerenciamento do estado relacionado à sessão.
 * 
 * @module SessionManager
 */

import { state, config, CONSTANTS, resetState } from '../../state.js';
import { ui } from '../../ui.js';
import { calculateStopValue } from '../utils/MathUtils.js';
import { logger } from '../utils/Logger.js';
import { PlanCalculator } from '../business/PlanCalculator.js';
import { Features } from '../config/Features.js';
import { setState as setStoreState, reset as resetStore } from '../../state/sessionStore.js';
import { isDevelopment } from '../config/EnvProvider.js';

export const sessionManager = {
    /**
     * Verifica se existe uma sessão ativa salva no localStorage
     */
    checkForActiveSession() {
        const savedSession = this.safeJSONParse(CONSTANTS.ACTIVE_SESSION_KEY, null);
        if (savedSession && savedSession.isSessionActive) {
            ui.showModal({
                title: 'Sessão Encontrada',
                message: 'Encontrámos uma sessão não finalizada. Deseja retomá-la de onde parou?',
                confirmText: 'Retomar Sessão',
                cancelText: 'Descartar',
                onConfirm: () => this.loadActiveSession(savedSession),
                onCancel: () => this.clearActiveSession(),
            });
        }
    },

    /**
     * Carrega uma sessão salva
     * @param {Object} savedSession - Dados da sessão salva
     */
    loadActiveSession(savedSession) {
        Object.keys(savedSession).forEach((key) => {
            if (key in state) {
                state[key] = savedSession[key];
            }
        });
        ui.mostrarInsightPopup('Sessão retomada com sucesso!', '🔄');
        ui.atualizarTudo();
    },

    /**
     * Salva o estado atual da sessão no localStorage
     */
    saveActiveSession() {
        if (!state.isSessionActive) return;

        const sessionStateToSave = {
            isSessionActive: state.isSessionActive,
            sessionMode: state.sessionMode,
            capitalInicial: state.capitalInicial,
            percentualEntrada: state.percentualEntrada,
            stopWinPerc: state.stopWinPerc,
            stopLossPerc: state.stopLossPerc,
            payout: state.payout,
            capitalDeCalculo: state.capitalDeCalculo,
            capitalInicioSessao: state.capitalInicioSessao,
            stopWinValor: state.stopWinValor,
            stopLossValor: state.stopLossValor,
            capitalAtual: state.capitalAtual,
            planoDeOperacoes: state.planoDeOperacoes,
            historicoCombinado: state.historicoCombinado,
            undoStack: state.undoStack,
            proximaEtapaIndex: state.proximaEtapaIndex,
            proximoAporte: state.proximoAporte,
            metaAtingida: state.metaAtingida,
            alertaStopWin80Mostrado: state.alertaStopWin80Mostrado,
            alertaStopLoss80Mostrado: state.alertaStopLoss80Mostrado,
        };
        localStorage.setItem(CONSTANTS.ACTIVE_SESSION_KEY, JSON.stringify(sessionStateToSave));
    },

    /**
     * Limpa a sessão salva do localStorage
     */
    clearActiveSession() {
        localStorage.removeItem(CONSTANTS.ACTIVE_SESSION_KEY);
    },

    /**
     * Reseta o estado da sessão atual
     */
    async resetSessionState() {
        console.log('🔄 RESET: Resetando estado da sessão...');
        resetState();
        this.clearActiveSession();
        this.updateCalculatedValues();

        // 📊 Garante que sessão está INATIVA após reset
        state.isSessionActive = false;

        // Se store estiver ativa, sincroniza também
        try {
            if (
                (window.Features && window.Features.FEATURE_store_pubsub) ||
                Features.FEATURE_store_pubsub
            ) {
                resetStore({
                    isSessionActive: false,
                    capitalInicial: config.capitalInicial,
                    capitalInicioSessao: state.capitalInicioSessao,
                    capitalAtual: state.capitalAtual,
                    historicoCombinado: [],
                    stopWinPerc: config.stopWinPerc,
                    stopLossPerc: config.stopLossPerc,
                });
            }
        } catch (_) { }

        await this.recalculatePlan(true);
        ui.atualizarTudo();

        console.log('✅ RESET: Estado da sessão resetado com sucesso');
    },

    /**
     * Inicia uma nova sessão
     * @param {string} mode - Modo da sessão (oficial ou simulacao)
     */
    async startNewSession(mode) {
        await this.resetSessionState();
        state.isSessionActive = true;
        state.sessionMode = mode;

        // Se store estiver ativa, marca sessão como ativa e espelha valores
        try {
            if (
                (window.Features && window.Features.FEATURE_store_pubsub) ||
                Features.FEATURE_store_pubsub
            ) {
                setStoreState({
                    isSessionActive: true,
                    capitalInicial: config.capitalInicial,
                    capitalInicioSessao: state.capitalInicioSessao,
                    capitalAtual: state.capitalAtual,
                    historicoCombinado: Array.isArray(state.historicoCombinado)
                        ? state.historicoCombinado.slice()
                        : [],
                    stopWinPerc: config.stopWinPerc,
                    stopLossPerc: config.stopLossPerc,
                });
            }
        } catch (_) { }

        await this.recalculatePlan(true);
        this.saveActiveSession();
        ui.atualizarTudo();
    },

    /**
     * Atualiza valores calculados (stops, capital de cálculo)
     */
    updateCalculatedValues() {
        const { capitalInicial, stopWinPerc, stopLossPerc } = config;

        // 🔧 CORREÇÃO CRÍTICA: NÃO altera valores de sessão ativa
        if (!state.isSessionActive) {
            // Só atualiza quando não há sessão ativa
            state.capitalInicioSessao = capitalInicial;
            state.capitalDeCalculo = capitalInicial;
            state.capitalAtual = capitalInicial;
        } else {
            // Em sessão ativa, apenas atualiza o capitalDeCalculo para novos cálculos
            state.capitalDeCalculo = capitalInicial;
        }

        // Stop Win/Loss sempre baseados no capital inicial da SESSÃO, não config atual
        const baseCapital = state.isSessionActive ? state.capitalInicioSessao : capitalInicial;
        state.stopWinValor = calculateStopValue(baseCapital, stopWinPerc);
        state.stopLossValor = calculateStopValue(baseCapital, stopLossPerc);
    },

    /**
     * Recalcula o plano de operações e atualiza a UI
     * @param {boolean} forceRedraw - Se deve forçar redesenho da tabela
     */
    async recalculatePlan(forceRedraw = false) {
        console.log('🧠 SessionManager: Calculando plano...', {
            estrategia: config.estrategiaAtiva,
            forceRedraw,
            isSessionActive: state.isSessionActive,
        });

        if (!state.isSessionActive && !forceRedraw) {
            return;
        }

        try {
            const plano = await PlanCalculator.calculate(config, state);

            // Preservar resultados executados se for atualização
            this.preservarResultadosExecutados(plano);

            state.planoDeOperacoes = plano;

            if (forceRedraw) {
                requestAnimationFrame(() => ui.renderizarTabela());
            }
        } catch (error) {
            logger.error('❌ Erro ao calcular plano', { error: String(error) });
            this._handleCalculationError(error);
        }
    },

    /**
     * Preserva o estado de execução das etapas ao recalcular o plano
     * @private
     */
    preservarResultadosExecutados(planoNovo) {
        const planoAntigo = state.planoDeOperacoes;
        if (planoAntigo && planoAntigo.length > 0) {
            planoNovo.forEach((etapaNova, index) => {
                const etapaAntiga = planoAntigo[index];
                if (etapaAntiga) {
                    if (etapaAntiga.concluida) {
                        etapaNova.concluida = true;
                        etapaNova.executedEntrada = etapaAntiga.executedEntrada;
                        etapaNova.executedRetorno = etapaAntiga.executedRetorno;
                    }
                    if (etapaAntiga.concluida1) {
                        etapaNova.concluida1 = true;
                        etapaNova.executedEntrada1 = etapaAntiga.executedEntrada1;
                        etapaNova.executedRetorno1 = etapaAntiga.executedRetorno1;
                    }
                    if (etapaAntiga.concluida2) {
                        etapaNova.concluida2 = true;
                        etapaNova.executedEntrada2 = etapaAntiga.executedEntrada2;
                        etapaNova.executedRetorno2 = etapaAntiga.executedRetorno2;
                    }
                }
            });
        }
    },

    /**
     * Helper para parse seguro de JSON
     * @private
     */
    safeJSONParse(key, defaultValue) {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        try {
            return JSON.parse(item);
        } catch (e) {
            console.warn(`Dados corrompidos para a chave "${key}". A restaurar para o padrão.`, e);
            localStorage.removeItem(key);
            return defaultValue;
        }
    },

    /**
     * Trata erro no cálculo
     * @private
     */
    _handleCalculationError(error) {
        if (dom.tabelaBody) {
            const errorColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--secondary-color')
                .trim() || '#ff3d00';
            dom.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color: ${errorColor};">
                        Erro no cálculo do plano: ${error.message}
                    </td>
                </tr>`;
        }
    }
};
