/**
 * @fileoverview Funções puras de cálculo e normalização
 * Extraído de logic.js para melhor organização
 * @module CalculationsUtils
 */

import {
    calculateSequences,
    calculateMaxDrawdown,
    toPercentage
} from './MathUtilsIntegration.js';
import { memoize, memoizeByArraySignature } from './PerformanceUtils.js';

/**
 * Normaliza uma operação para formato padrão
 * @param {Object} op - Operação a normalizar
 * @returns {Object} Operação normalizada com isWin, valor e raw
 */
export function normalizeOperation(op) {
    if (!op || typeof op !== 'object') return { isWin: null, valor: null, raw: op };

    // Determinar isWin
    const isWin = typeof op.isWin === 'boolean'
        ? op.isWin
        : typeof op.resultado === 'string'
            ? op.resultado === 'win'
            : null;

    // Determinar valor (PnL)
    let valor = null;
    if (typeof op.valor === 'number' && isFinite(op.valor)) {
        valor = op.valor;
    } else if (typeof op.lucro === 'number' && isFinite(op.lucro)) {
        valor = op.lucro;
    } else if (
        (typeof op.valorEntrada === 'number' || typeof op.valorRetorno === 'number') &&
        typeof op.resultado === 'string'
    ) {
        // Formato legado baseado em entrada/retorno
        valor = op.resultado === 'win' ? (op.valorRetorno || 0) : -(op.valorEntrada || 0);
    } else if (typeof op.aporte === 'number') {
        // Deriva a partir de aporte e payout quando possível
        const payoutFactor = typeof op.payout === 'number' && isFinite(op.payout) && op.payout > 1
            ? op.payout
            : 1.8; // fallback conservador
        if (isWin === true) valor = op.aporte * payoutFactor - op.aporte;
        if (isWin === false) valor = -op.aporte;
    }

    return { isWin, valor, raw: op };
}

/**
 * Normaliza array de histórico
 * @param {Array} historico - Array de operações
 * @returns {Array} Array normalizado
 */
export function normalizeHistory(historico) {
    if (!Array.isArray(historico)) return [];
    return historico.map(normalizeOperation);
}

/**
 * Calcula sequências de vitórias/derrotas com memoização
 */
export const calcularSequencias = memoizeByArraySignature(function calcularSequencias(historico) {
    return calculateSequences(historico);
});

/**
 * Calcula expectativa matemática com memoização
 */
export const calcularExpectativaMatematica = memoizeByArraySignature(function calcularExpectativaMatematica(historico) {
    if (!Array.isArray(historico)) return { ev: null, class: '' };

    const normalized = normalizeHistory(historico);
    const wins = normalized.filter((op) => op.isWin === true);
    const losses = normalized.filter((op) => op.isWin === false);
    const totalOps = wins.length + losses.length;
    if (totalOps === 0) return { ev: null, class: '' };

    const winRate = toPercentage(wins.length / totalOps);
    // Payout médio (se ausente, usa 87%)
    const avgPayout = wins.length > 0 && typeof wins[0].raw?.payout === 'number'
        ? wins.reduce((acc, op) => acc + (op.raw.payout || 87), 0) / wins.length
        : 87;

    const evDecimal = (winRate * (avgPayout / 100)) / 100 - (1 - winRate / 100);
    const ev = toPercentage(evDecimal);
    return { ev, class: ev > 0 ? 'positive' : 'negative' };
});

/**
 * Calcula drawdown máximo com memoização
 */
export const calcularDrawdown = memoize(function calcularDrawdown(historico, capitalInicial) {
    return calculateMaxDrawdown(historico, capitalInicial);
}, (historico, capitalInicial) => `${historico?.length || 0}|${capitalInicial}`);

/**
 * Calcula payoff ratio com memoização
 */
export const calcularPayoffRatio = memoizeByArraySignature(function calcularPayoffRatio(historico) {
    if (!Array.isArray(historico)) return Infinity;

    const normalized = normalizeHistory(historico);
    const wins = normalized.filter((op) => op.isWin === true && typeof op.valor === 'number');
    const losses = normalized.filter((op) => op.isWin === false && typeof op.valor === 'number');
    if (losses.length === 0 || wins.length === 0) return Infinity;

    const ganhoMedio = wins.reduce((acc, op) => acc + (op.valor || 0), 0) / wins.length;
    const perdaMedio = Math.abs(
        losses.reduce((acc, op) => acc + (op.valor || 0), 0) / losses.length
    );
    return perdaMedio > 0 ? ganhoMedio / perdaMedio : Infinity;
});

/**
 * Exportações para compatibilidade
 */
export default {
    normalizeOperation,
    normalizeHistory,
    calcularSequencias,
    calcularExpectativaMatematica,
    calcularDrawdown,
    calcularPayoffRatio
};
