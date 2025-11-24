/**
 * @fileoverview Verificação de metas (Stop Win e Stop Loss)
 * @module GoalsChecker
 */

import { state, config } from '../../state.js';
import { logger } from '../utils/Logger.js';
import { ui } from '../../ui.js';

/**
 * Verifica se as metas foram atingidas
 * @returns {Object} { metaAtingidaHoje, tipoMeta }
 */
export async function verificarMetas() {
    // PROTEÇÃO: Usar estado global mais recente
    const estadoGlobal = window.state || state;
    const configGlobal = window.config || config;

    logger.debug('🔍 [METAS] Estado usado para verificação:', {
        fonte: estadoGlobal === window.state ? 'window.state (global)' : 'state (local)',
        capitalAtual: estadoGlobal.capitalAtual,
        capitalInicioSessao: estadoGlobal.capitalInicioSessao,
        historico: estadoGlobal.historicoCombinado?.length || 0,
    });

    // PROTEÇÃO: Validar dados antes de usar
    const capitalInicioSeguro = getSafeCapitalInicio(estadoGlobal, configGlobal);
    const capitalAtualSeguro = getSafeCapitalAtual(estadoGlobal, capitalInicioSeguro);
    const stopWinSeguro = getSafeStopWin(estadoGlobal);
    const stopLossSeguro = getSafeStopLoss(estadoGlobal);

    logger.debug('🎯 Verificando metas...', {
        capitalInicial: capitalInicioSeguro,
        capitalAtual: capitalAtualSeguro,
        stopWin: stopWinSeguro,
        stopLoss: stopLossSeguro,
    });

    const lucroPrejuizoTotal = capitalAtualSeguro - capitalInicioSeguro;
    logger.debug(`💰 Lucro/Prejuízo atual: ${lucroPrejuizoTotal.toFixed(2)}`);

    let metaAtingidaHoje = false;
    let tipoMeta = null;

    // Verificar Stop Win
    if (lucroPrejuizoTotal >= stopWinSeguro && stopWinSeguro > 0) {
        state.metaAtingida = true;
        metaAtingidaHoje = true;
        tipoMeta = 'win';
        logger.info('🎯 META ATINGIDA: Stop Win!');
    }
    // Verificar Stop Loss
    else if (lucroPrejuizoTotal <= -stopLossSeguro && stopLossSeguro > 0) {
        state.metaAtingida = true;
        metaAtingidaHoje = true;
        tipoMeta = 'loss';
        logger.warn('⚠️ META ATINGIDA: Stop Loss!');
    }
    else {
        state.metaAtingida = false;
    }

    // Alertas de proximidade (80%)
    if (!metaAtingidaHoje) {
        checkProximityAlerts(lucroPrejuizoTotal, stopWinSeguro, stopLossSeguro);
    }

    return { metaAtingidaHoje, tipoMeta };
}

/**
 * Verifica e mostra alertas de proximidade das metas
 * @private
 */
function checkProximityAlerts(lucroPrejuizo, stopWin, stopLoss) {
    // Alerta de proximidade do Stop Win (80%)
    if (
        !state.alertaStopWin80Mostrado &&
        lucroPrejuizo >= stopWin * 0.8 &&
        stopWin > 0
    ) {
        ui.mostrarInsightPopup('Atenção: Você está perto da sua meta de ganhos!');
        state.alertaStopWin80Mostrado = true;
        logger.info('📢 Alerta: Próximo da meta de ganhos (80%)');
    }

    // Alerta de proximidade do Stop Loss (80%)
    if (
        !state.alertaStopLoss80Mostrado &&
        lucroPrejuizo <= -stopLoss * 0.8 &&
        stopLoss > 0
    ) {
        ui.mostrarInsightPopup('Cuidado: Você está a aproximar-se do seu limite de perda!');
        state.alertaStopLoss80Mostrado = true;
        logger.warn('⚠️ Alerta: Próximo do limite de perda (80%)');
    }
}

/**
 * Obtém capital de início seguro
 * @private
 */
function getSafeCapitalInicio(estadoGlobal, configGlobal) {
    return typeof estadoGlobal.capitalInicioSessao === 'number' &&
        !isNaN(estadoGlobal.capitalInicioSessao)
        ? estadoGlobal.capitalInicioSessao
        : configGlobal.capitalInicial || 0;
}

/**
 * Obtém capital atual seguro
 * @private
 */
function getSafeCapitalAtual(estadoGlobal, capitalInicioSeguro) {
    return typeof estadoGlobal.capitalAtual === 'number' && !isNaN(estadoGlobal.capitalAtual)
        ? estadoGlobal.capitalAtual
        : capitalInicioSeguro;
}

/**
 * Obtém stop win seguro
 * @private
 */
function getSafeStopWin(estadoGlobal) {
    return typeof estadoGlobal.stopWinValor === 'number' && !isNaN(estadoGlobal.stopWinValor)
        ? estadoGlobal.stopWinValor
        : 0;
}

/**
 * Obtém stop loss seguro
 * @private
 */
function getSafeStopLoss(estadoGlobal) {
    return typeof estadoGlobal.stopLossValor === 'number' && !isNaN(estadoGlobal.stopLossValor)
        ? estadoGlobal.stopLossValor
        : 0;
}

/**
 * Reseta alertas de proximidade
 */
export function resetProximityAlerts() {
    state.alertaStopWin80Mostrado = false;
    state.alertaStopLoss80Mostrado = false;
    logger.debug('🔄 Alertas de proximidade resetados');
}

/**
 * Exportações
 */
export default {
    verificarMetas,
    resetProximityAlerts
};
