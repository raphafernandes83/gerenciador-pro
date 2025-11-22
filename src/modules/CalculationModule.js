/**
 * 🧮 CALCULATION MODULE
 * Funções matemáticas puras para cálculos de trading
 * 
 * @module CalculationModule
 * @since Fase 3 - Checkpoint 3.4
 */

import BaseModule from './BaseModule.js';

export class CalculationModule extends BaseModule {
    constructor() {
        super('CalculationModule');
    }

    /**
     * Inicialização do módulo
     */
    async init() {
        await super.init();
        console.log('✅ CalculationModule inicializado');
    }

    // ========== EXPECTATIVA MATEMÁTICA ==========

    /**
     * Calcula expectativa matemática
     * @param {Array} operations - Lista de operações
     * @returns {Object} Dados de expectativa
     */
    calculateExpectancy(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return { ev: 0, winRate: 0, avgWin: 0, avgLoss: 0, total: 0 };
        }

        const wins = operations.filter(op => op.isWin || op.resultado === 'win');
        const losses = operations.filter(op => !op.isWin && op.resultado !== 'win');

        const totalWins = wins.length;
        const totalLosses = losses.length;
        const total = operations.length;

        const winRate = total > 0 ? totalWins / total : 0;
        const lossRate = total > 0 ? totalLosses / total : 0;

        const avgWin = totalWins > 0
            ? wins.reduce((sum, op) => sum + Math.abs(op.valor || op.value || 0), 0) / totalWins
            : 0;

        const avgLoss = totalLosses > 0
            ? losses.reduce((sum, op) => sum + Math.abs(op.valor || op.value || 0), 0) / totalLosses
            : 0;

        const ev = (winRate * avgWin) - (lossRate * avgLoss);

        return {
            ev,
            winRate: winRate * 100,
            lossRate: lossRate * 100,
            avgWin,
            avgLoss,
            total,
            wins: totalWins,
            losses: totalLosses
        };
    }

    // ========== DRAWDOWN ==========

    /**
     * Calcula drawdown máximo
     * @param {Array} operations - Lista de operações
     * @returns {Object} Dados de drawdown
     */
    calculateDrawdown(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return { maxDrawdown: 0, maxDrawdownPercent: 0, currentDrawdown: 0 };
        }

        let peak = 0;
        let maxDrawdown = 0;
        let currentCapital = 0;
        let peakCapital = 0;

        for (const op of operations) {
            const value = op.valor || op.value || 0;
            currentCapital += value;

            if (currentCapital > peak) {
                peak = currentCapital;
                peakCapital = currentCapital;
            }

            const drawdown = peak - currentCapital;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        const currentDrawdown = peak - currentCapital;
        const maxDrawdownPercent = peakCapital > 0 ? (maxDrawdown / peakCapital) * 100 : 0;

        return {
            maxDrawdown,
            maxDrawdownPercent,
            currentDrawdown,
            peak,
            currentCapital
        };
    }

    // ========== SEQUÊNCIAS ==========

    /**
     * Calcula sequências de vitórias e derrotas
     * @param {Array} operations - Lista de operações
     * @returns {Object} Dados de sequências
     */
    calculateSequences(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return { maxWinStreak: 0, maxLossStreak: 0, currentStreak: 0, streakType: null };
        }

        let currentWinStreak = 0;
        let currentLossStreak = 0;
        let maxWinStreak = 0;
        let maxLossStreak = 0;
        let lastResult = null;

        for (const op of operations) {
            const isWin = op.isWin || op.resultado === 'win';

            if (isWin) {
                currentWinStreak++;
                currentLossStreak = 0;
                maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else {
                currentLossStreak++;
                currentWinStreak = 0;
                maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
            }

            lastResult = isWin ? 'win' : 'loss';
        }

        const currentStreak = lastResult === 'win' ? currentWinStreak : currentLossStreak;

        return {
            maxWinStreak,
            maxLossStreak,
            currentStreak,
            streakType: lastResult,
            currentWinStreak,
            currentLossStreak
        };
    }

    // ========== PAYOFF RATIO ==========

    /**
     * Calcula payoff ratio
     * @param {Array} operations - Lista de operações
     * @returns {Object} Dados de payoff
     */
    calculatePayoffRatio(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return { payoffRatio: 0, avgWin: 0, avgLoss: 0 };
        }

        const wins = operations.filter(op => op.isWin || op.resultado === 'win');
        const losses = operations.filter(op => !op.isWin && op.resultado !== 'win');

        const avgWin = wins.length > 0
            ? wins.reduce((sum, op) => sum + Math.abs(op.valor || op.value || 0), 0) / wins.length
            : 0;

        const avgLoss = losses.length > 0
            ? losses.reduce((sum, op) => sum + Math.abs(op.valor || op.value || 0), 0) / losses.length
            : 0;

        const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

        return {
            payoffRatio,
            avgWin,
            avgLoss
        };
    }

    // ========== WIN RATE ==========

    /**
     * Calcula win rate
     * @param {Array} operations - Lista de operações
     * @returns {number} Win rate em percentual
     */
    calculateWinRate(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return 0;
        }

        const wins = operations.filter(op => op.isWin || op.resultado === 'win').length;
        return (wins / operations.length) * 100;
    }

    // ========== PROFIT/LOSS ==========

    /**
     * Calcula profit/loss total
     * @param {Array} operations - Lista de operações
     * @returns {Object} Dados de P/L
     */
    calculateProfitLoss(operations = []) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return { totalProfit: 0, totalLoss: 0, netProfit: 0 };
        }

        let totalProfit = 0;
        let totalLoss = 0;

        for (const op of operations) {
            const value = op.valor || op.value || 0;
            if (value > 0) {
                totalProfit += value;
            } else {
                totalLoss += Math.abs(value);
            }
        }

        return {
            totalProfit,
            totalLoss,
            netProfit: totalProfit - totalLoss
        };
    }

    // ========== ESTATÍSTICAS COMPLETAS ==========

    /**
     * Calcula todas as estatísticas de uma vez
     * @param {Array} operations - Lista de operações
     * @returns {Object} Todas as estatísticas
     */
    calculateAllStats(operations = []) {
        return {
            expectancy: this.calculateExpectancy(operations),
            drawdown: this.calculateDrawdown(operations),
            sequences: this.calculateSequences(operations),
            payoffRatio: this.calculatePayoffRatio(operations),
            winRate: this.calculateWinRate(operations),
            profitLoss: this.calculateProfitLoss(operations),
            totalOperations: operations.length
        };
    }

    /**
     * Informações do módulo
     */
    getInfo() {
        return {
            ...super.getInfo(),
            availableFunctions: [
                'calculateExpectancy',
                'calculateDrawdown',
                'calculateSequences',
                'calculatePayoffRatio',
                'calculateWinRate',
                'calculateProfitLoss',
                'calculateAllStats'
            ]
        };
    }
}

export default CalculationModule;
