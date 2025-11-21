/**
 * UTILITÁRIOS MATEMÁTICOS - GERENCIADOR PRO v9.3
 *
 * Funções matemáticas puras para cálculos de trading
 * Seguindo boas práticas: funções pequenas, bem testadas e documentadas
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { SYSTEM_LIMITS } from '../constants/AppConstants.js';

/**
 * Constante para conversão de percentual
 * @readonly
 * @type {number}
 */
export const PERCENTAGE_DIVISOR = 100;

/**
 * Calcula o valor de entrada baseado no capital e percentual
 * @param {number} capital - Capital base para cálculo
 * @param {number} entryPercentage - Percentual de entrada (0-100)
 * @returns {number} Valor da entrada calculado
 * @throws {Error} Se os parâmetros forem inválidos
 *
 * @example
 * calculateEntryAmount(10000, 2.5); // 250
 */
export function calculateEntryAmount(capital, entryPercentage) {
    if (!isValidNumber(capital) || capital <= 0) {
        throw new Error('Capital deve ser um número positivo');
    }

    if (!isValidPercentage(entryPercentage)) {
        throw new Error(
            `Percentual deve estar entre ${SYSTEM_LIMITS.MIN_ENTRY_PERCENTAGE}% e ${SYSTEM_LIMITS.MAX_ENTRY_PERCENTAGE}%`
        );
    }

    return capital * (entryPercentage / PERCENTAGE_DIVISOR);
}

/**
 * Calcula o retorno baseado na entrada e payout
 * @param {number} entryAmount - Valor da entrada
 * @param {number} payout - Percentual de payout (0-100)
 * @returns {number} Valor do retorno calculado
 * @throws {Error} Se os parâmetros forem inválidos
 *
 * @example
 * calculateReturnAmount(100, 87); // 87
 */
export function calculateReturnAmount(entryAmount, payout) {
    if (!isValidNumber(entryAmount) || entryAmount <= 0) {
        throw new Error('Valor da entrada deve ser um número positivo');
    }

    if (!isValidPayout(payout)) {
        throw new Error(
            `Payout deve estar entre ${SYSTEM_LIMITS.MIN_PAYOUT}% e ${SYSTEM_LIMITS.MAX_PAYOUT}%`
        );
    }

    return entryAmount * (payout / PERCENTAGE_DIVISOR);
}

/**
 * Calcula a entrada necessária para recuperar um valor específico
 * @param {number} targetRecovery - Valor alvo a ser recuperado
 * @param {number} payout - Percentual de payout (0-100)
 * @returns {number} Entrada necessária para recuperação
 * @throws {Error} Se os parâmetros forem inválidos
 *
 * @example
 * calculateRecoveryEntry(100, 87); // 114.94
 */
export function calculateRecoveryEntry(targetRecovery, payout) {
    if (!isValidNumber(targetRecovery) || targetRecovery <= 0) {
        throw new Error('Valor de recuperação deve ser um número positivo');
    }

    if (!isValidPayout(payout)) {
        throw new Error(
            `Payout deve estar entre ${SYSTEM_LIMITS.MIN_PAYOUT}% e ${SYSTEM_LIMITS.MAX_PAYOUT}%`
        );
    }

    return targetRecovery / (payout / PERCENTAGE_DIVISOR);
}

/**
 * Calcula a expectativa matemática baseada em win rate e payouts
 * @param {number} winRate - Taxa de acerto (0-100)
 * @param {number} avgPayout - Payout médio (0-100)
 * @returns {number} Expectativa matemática (pode ser negativa)
 *
 * @example
 * calculateMathematicalExpectancy(60, 87); // 22.2
 */
export function calculateMathematicalExpectancy(winRate, avgPayout) {
    if (!isValidPercentage(winRate)) {
        throw new Error('Win rate deve estar entre 0% e 100%');
    }

    if (!isValidPayout(avgPayout)) {
        throw new Error(
            `Payout médio deve estar entre ${SYSTEM_LIMITS.MIN_PAYOUT}% e ${SYSTEM_LIMITS.MAX_PAYOUT}%`
        );
    }

    const winRateDecimal = winRate / 100;
    const lossRateDecimal = 1 - winRateDecimal;
    const payoutDecimal = avgPayout / 100;

    return winRateDecimal * payoutDecimal - lossRateDecimal;
}

/**
 * Calcula o drawdown máximo de uma série de operações
 * @param {Array<{isWin: boolean, resultado: number}>} operations - Array de operações
 * @returns {number} Drawdown máximo absoluto
 *
 * @example
 * calculateMaxDrawdown([{isWin: false, resultado: -100}, {isWin: true, resultado: 87}]); // -100
 */
export function calculateMaxDrawdown(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
        return 0;
    }

    let peak = 0;
    let maxDrawdown = 0;
    let currentBalance = 0;

    for (const operation of operations) {
        if (
            !operation ||
            typeof operation.isWin !== 'boolean' ||
            !isValidNumber(operation.resultado)
        ) {
            continue;
        }

        currentBalance += operation.resultado;

        if (currentBalance > peak) {
            peak = currentBalance;
        }

        const currentDrawdown = peak - currentBalance;
        if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
        }
    }

    return -maxDrawdown; // Retorna como valor negativo
}

/**
 * Calcula sequências máximas de vitórias e derrotas
 * @param {Array<{isWin: boolean}>} operations - Array de operações
 * @returns {{maxWins: number, maxLosses: number, currentStreak: number, streakType: string}}
 *
 * @example
 * calculateSequences([{isWin: true}, {isWin: true}, {isWin: false}]);
 * // {maxWins: 2, maxLosses: 1, currentStreak: 1, streakType: 'loss'}
 */
export function calculateSequences(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
        return { maxWins: 0, maxLosses: 0, currentStreak: 0, streakType: 'none' };
    }

    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let lastOperation = null;

    for (const operation of operations) {
        if (!operation || typeof operation.isWin !== 'boolean') {
            continue;
        }

        if (operation.isWin) {
            currentWins++;
            currentLosses = 0;
            maxWins = Math.max(maxWins, currentWins);
        } else {
            currentLosses++;
            currentWins = 0;
            maxLosses = Math.max(maxLosses, currentLosses);
        }

        lastOperation = operation;
    }

    // Determina a sequência atual
    let currentStreak = 0;
    let streakType = 'none';

    if (lastOperation) {
        if (lastOperation.isWin) {
            currentStreak = currentWins;
            streakType = 'win';
        } else {
            currentStreak = currentLosses;
            streakType = 'loss';
        }
    }

    return { maxWins, maxLosses, currentStreak, streakType };
}

/**
 * Calcula o profit factor (total de ganhos / total de perdas)
 * @param {Array<{resultado: number}>} operations - Array de operações
 * @returns {number} Profit factor (0 = ruim, 1 = break-even, >1 = lucrativo)
 *
 * @example
 * calculateProfitFactor([{resultado: 100}, {resultado: -50}]); // 2.0
 */
export function calculateProfitFactor(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
        return 0;
    }

    let totalProfits = 0;
    let totalLosses = 0;

    for (const operation of operations) {
        if (!operation || !isValidNumber(operation.resultado)) {
            continue;
        }

        if (operation.resultado > 0) {
            totalProfits += operation.resultado;
        } else if (operation.resultado < 0) {
            totalLosses += Math.abs(operation.resultado);
        }
    }

    return totalLosses === 0 ? (totalProfits > 0 ? Infinity : 0) : totalProfits / totalLosses;
}

/**
 * Valida se um número é válido e finito
 * @param {any} value - Valor a ser validado
 * @returns {boolean} True se for um número válido
 */
function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Valida se um percentual está dentro dos limites aceitos
 * @param {number} percentage - Percentual a ser validado
 * @returns {boolean} True se for um percentual válido
 */
function isValidPercentage(percentage) {
    return (
        isValidNumber(percentage) &&
        percentage >= SYSTEM_LIMITS.MIN_ENTRY_PERCENTAGE &&
        percentage <= SYSTEM_LIMITS.MAX_ENTRY_PERCENTAGE
    );
}

/**
 * Valida se um payout está dentro dos limites aceitos
 * @param {number} payout - Payout a ser validado
 * @returns {boolean} True se for um payout válido
 */
function isValidPayout(payout) {
    return (
        isValidNumber(payout) &&
        payout >= SYSTEM_LIMITS.MIN_PAYOUT &&
        payout <= SYSTEM_LIMITS.MAX_PAYOUT
    );
}

/**
 * Calcula o valor de stop (win ou loss) baseado no capital e percentual
 * @param {number} capital - Capital base para cálculo
 * @param {number} stopPercentage - Percentual do stop (0-100)
 * @returns {number} Valor do stop calculado
 * @throws {Error} Se os parâmetros forem inválidos
 *
 * @example
 * calculateStopValue(10000, 12); // 1200 (stop win de 12%)
 * calculateStopValue(10000, 18); // 1800 (stop loss de 18%)
 */
export function calculateStopValue(capital, stopPercentage) {
    if (!isValidNumber(capital) || capital <= 0) {
        throw new Error('Capital deve ser um número positivo');
    }

    if (
        !isValidNumber(stopPercentage) ||
        stopPercentage < 0 ||
        stopPercentage > PERCENTAGE_DIVISOR
    ) {
        throw new Error(`Percentual de stop deve estar entre 0% e ${PERCENTAGE_DIVISOR}%`);
    }

    return capital * (stopPercentage / PERCENTAGE_DIVISOR);
}

/**
 * Converte um valor decimal para percentual
 * @param {number} decimal - Valor decimal (ex: 0.75)
 * @returns {number} Valor em percentual (ex: 75)
 *
 * @example
 * toPercentage(0.75); // 75
 * toPercentage(0.855); // 85.5
 */
export function toPercentage(decimal) {
    if (!isValidNumber(decimal)) {
        throw new Error('Valor deve ser um número válido');
    }

    return decimal * PERCENTAGE_DIVISOR;
}

/**
 * Converte um valor percentual para decimal
 * @param {number} percentage - Valor em percentual (ex: 75)
 * @returns {number} Valor decimal (ex: 0.75)
 *
 * @example
 * fromPercentage(75); // 0.75
 * fromPercentage(85.5); // 0.855
 */
export function fromPercentage(percentage) {
    if (!isValidNumber(percentage)) {
        throw new Error('Valor deve ser um número válido');
    }

    return percentage / PERCENTAGE_DIVISOR;
}
