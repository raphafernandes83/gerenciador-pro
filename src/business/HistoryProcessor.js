/**
 * @fileoverview Processamento e reprocessamento de histórico de operações
 * @module HistoryProcessor
 */

import { state, config, CONSTANTS } from '../../state.js';
import { logger } from './Logger.js';
import { sessionManager } from '../managers/SessionManager.js';

/**
 * Reprocessa o histórico de operações
 * Recalcula capital e estado baseado no histórico existente
 */
export function reprocessarHistorico() {
    // Reseta estado para início da sessão
    if (window.stateManager) {
        window.stateManager.setState(
            { capitalAtual: state.capitalInicioSessao },
            'HistoryProcessor.reprocessarHistorico:init'
        );
    } else {
        state.capitalAtual = state.capitalInicioSessao;
    }

    state.capitalDeCalculo = state.capitalInicioSessao;
    state.proximaEtapaIndex = 0;
    state.proximoAporte = 1;
    state.metaAtingida = false;
    state.alertaStopWin80Mostrado = false;
    state.alertaStopLoss80Mostrado = false;

    // Recalcula plano
    sessionManager.recalculatePlan();

    // Marca todas etapas como não concluídas
    state.planoDeOperacoes.forEach((p) => {
        p.concluida = p.concluida1 = p.concluida2 = false;
    });

    // Processa cada operação do histórico
    const historicoProcessado = [...state.historicoCombinado];
    for (const operacao of historicoProcessado) {
        // Atualiza capital
        if (window.stateManager) {
            const estadoAtual = window.stateManager.getState();
            window.stateManager.setState(
                { capitalAtual: estadoAtual.capitalAtual + operacao.valor },
                'HistoryProcessor.reprocessarHistorico:loop'
            );
        } else {
            state.capitalAtual += operacao.valor;
        }

        // Marca etapa como concluída
        const etapa = state.planoDeOperacoes[state.proximaEtapaIndex];
        const aporte = state.proximoAporte;

        if (config.estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES) {
            if (etapa.entrada2 === undefined) {
                etapa.concluida = true;
            } else {
                if (aporte === 1) etapa.concluida1 = true;
                else etapa.concluida2 = true;
            }
        }

        // Avança plano
        logicaAvancoPlano(operacao.isWin, state.proximaEtapaIndex, aporte, operacao.valor);
    }

    // Verifica metas após reprocessamento
    verificarMetas();

    logger.debug('✅ Histórico reprocessado com sucesso');
}

/**
 * Lógica de avanço do plano baseado em resultado
 * @param {boolean} isWin - Se foi vitória
 * @param {number} index - Índice da etapa atual
 * @param {number} aporte - Número do aporte (1 ou 2)
 * @param {number} resultado - Valor do resultado
 */
export function logicaAvancoPlano(isWin, index, aporte, resultado) {
    const etapa = state.planoDeOperacoes[index];
    let recalcularPlanoCompleto = false;

    if (isWin) {
        // Lógica de vitória
        if (config.incorporarLucros) {
            if (
                config.estrategiaAtiva === CONSTANTS.STRATEGY.FIXED ||
                etapa.etapa === 'Mão Fixa' ||
                etapa.etapa === 'Reinvestir'
            ) {
                state.capitalDeCalculo += resultado;
                recalcularPlanoCompleto = true;
            } else if (etapa.entrada2 !== undefined && aporte === 2) {
                state.capitalDeCalculo += resultado;
                recalcularPlanoCompleto = true;
            }
        }

        const reiniciaCiclo =
            config.estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES &&
            (etapa.etapa === 'Reinvestir' ||
                etapa.etapa === 'Recuperação' ||
                (etapa.entrada2 !== undefined && aporte === 2));

        if (reiniciaCiclo) {
            state.planoDeOperacoes.forEach((p) => {
                p.concluida = p.concluida1 = p.concluida2 = false;
            });
            state.capitalDeCalculo = state.capitalAtual;
            if (config.incorporarLucros) recalcularPlanoCompleto = true;
        }

        if (config.modoGuiado) {
            logger.debug('🎯 MODO GUIADO - VITÓRIA - Atualizando próxima etapa:', {
                estrategia: config.estrategiaAtiva,
                etapaAtual: etapa.etapa,
                aporteAtual: aporte,
                reiniciaCiclo,
            });

            if (config.estrategiaAtiva === CONSTANTS.STRATEGY.FIXED || reiniciaCiclo) {
                state.proximaEtapaIndex = 0;
                state.proximoAporte = 1;
                logger.debug('  ➡️ Reiniciando ciclo - próxima: etapa 0, aporte 1');
            } else if (etapa.etapa === 'Mão Fixa') {
                state.proximaEtapaIndex = 1;
                state.proximoAporte = 1;
                logger.debug('  ➡️ Mão Fixa WIN - próxima: etapa 1 (Reinvestir), aporte 1');
            } else if (etapa.entrada2 !== undefined && aporte === 1) {
                state.proximoAporte = 2;
                logger.debug('  ➡️ Aporte 1 WIN - próxima: mesma etapa, aporte 2');
            } else {
                if (state.proximaEtapaIndex < state.planoDeOperacoes.length - 1) {
                    state.proximaEtapaIndex++;
                    state.proximoAporte = 1;
                    logger.debug(`  ➡️ Etapa simples WIN - próxima: etapa ${state.proximaEtapaIndex}, aporte 1`);
                }
            }
        }
    } else {
        // Lógica de derrota
        if (config.estrategiaAtiva === CONSTANTS.STRATEGY.FIXED) {
            if (config.incorporarLucros) recalcularPlanoCompleto = true;
            if (config.modoGuiado) {
                state.proximaEtapaIndex = 0;
                state.proximoAporte = 1;
            }
        } else {
            recalcularPlanoCompleto = true;
            if (config.modoGuiado) {
                if (etapa.etapa === 'Mão Fixa' || etapa.etapa === 'Reinvestir')
                    state.proximaEtapaIndex = 2;
                else if (index < state.planoDeOperacoes.length - 1) state.proximaEtapaIndex++;
                state.proximoAporte = 1;
            }
        }
    }

    if (recalcularPlanoCompleto) {
        sessionManager.recalculatePlan(true);
    }
}

/**
 * Verifica se metas foram atingidas (importado do GoalsChecker)
 * Mantido aqui temporariamente, será movido para GoalsChecker.js
 */
function verificarMetas() {
    // Importado para manter funcionalidade
    // Será substituído por import do GoalsChecker.js
    if (typeof window.logic?.verificarMetas === 'function') {
        return window.logic.verificarMetas();
    }
    return { metaAtingidaHoje: false, tipoMeta: null };
}

/**
 * Exportações
 */
export default {
    reprocessarHistorico,
    logicaAvancoPlano
};
