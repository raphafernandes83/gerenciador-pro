/**
 * @fileoverview Gerenciamento de carregamento e atualização de estado
 * @module StateLoader
 */

import { state, config } from '../../state.js';
import { sessionManager } from '../managers/SessionManager.js';
import { ui } from '../../ui.js';
import { logger } from './Logger.js';

/**
 * Atualiza o estado da aplicação
 * @param {Object} newState - Novo estado a aplicar
 * @returns {boolean} Se precisa recalcular plano
 */
export function updateState(newState) {
    let needsRecalculation = false;
    const planDependencies = [
        'capitalInicial',
        'percentualEntrada',
        'stopWinPerc',
        'stopLossPerc',
        'payout',
        'estrategiaAtiva',
        'divisorRecuperacao',
    ];

    Object.keys(newState).forEach((key) => {
        const value = newState[key];
        if (key in config) {
            config[key] = value;
        } else if (key in state) {
            state[key] = value;
        }

        const storageKey = `gerenciadorPro${key.charAt(0).toUpperCase() + key.slice(1)}`;
        localStorage.setItem(storageKey, JSON.stringify(value));

        if (planDependencies.includes(key)) {
            needsRecalculation = true;
        }
    });

    // Aplica efeitos colaterais esperados pelo restante da aplicação
    try {
        if (needsRecalculation) {
            // Atualiza valores derivados de config/state
            sessionManager.updateCalculatedValues();
            // Recalcula plano conforme dependências
            sessionManager.recalculatePlan(true);
        }

        // Persistência de sessão ativa
        if (state.isSessionActive) {
            sessionManager.saveActiveSession();
        }

        // Atualizações de UI essenciais
        ui.syncUIFromState?.();
        ui.atualizarDashboardSessao?.();
        ui.atualizarStatusIndicadores?.();
        ui.atualizarVisibilidadeBotoesSessao?.();
        ui.atualizarVisibilidadeContextual?.();
    } catch (error) {
        logger.warn('Erro ao aplicar efeitos colaterais do updateState:', error);
    }

    return needsRecalculation;
}

/**
 * Parse seguro de JSON do localStorage
 * @param {string} key - Chave do localStorage
 * @param {*} defaultValue - Valor padrão
 * @returns {*} Valor parseado ou padrão
 */
export function safeJSONParse(key, defaultValue) {
    return sessionManager.safeJSONParse(key, defaultValue);
}

/**
 * Carrega estado do localStorage
 */
export function loadStateFromStorage() {
    // Carrega a configuração guardada, fundindo com a configuração padrão
    Object.keys(config).forEach((key) => {
        const storageKey = `gerenciadorPro${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const savedValue = safeJSONParse(storageKey, null);
        if (savedValue !== null) {
            config[key] = savedValue;
        }
    });

    // Carrega filtros específicos do estado que persistem entre sessões
    const filterPeriod = safeJSONParse('gerenciadorProDashboardFilterPeriod', 'all');
    const filterMode = safeJSONParse('gerenciadorProDashboardFilterMode', 'all');

    if (window.stateManager) {
        window.stateManager.setState({
            dashboardFilterPeriod: filterPeriod,
            dashboardFilterMode: filterMode
        }, 'StateLoader.loadStateFromStorage:filters');
    } else {
        state.dashboardFilterPeriod = filterPeriod;
        state.dashboardFilterMode = filterMode;
    }

    // Garante que os valores calculados estão corretos após carregar
    sessionManager.updateCalculatedValues();

    logger.info('✅ Estado carregado do localStorage');
}

/**
 * Exportações
 */
export default {
    updateState,
    safeJSONParse,
    loadStateFromStorage
};
