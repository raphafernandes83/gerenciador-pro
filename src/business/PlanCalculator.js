/**
 * CALCULADORA DE PLANOS DE TRADING
 * 
 * Responsável por calcular os valores de entrada e retorno para cada etapa
 * do plano de trading, baseado na estratégia selecionada.
 * 
 * @module PlanCalculator
 */

import { CONSTANTS } from '../../state.js';
import { logger } from '../utils/Logger.js';

export class PlanCalculator {
    /**
     * Calcula o plano de operações baseado na estratégia e configuração
     * @param {Object} config - Configuração atual (payout, percentualEntrada, estrategiaAtiva, etc.)
     * @param {Object} state - Estado atual (capitalDeCalculo, isSessionActive, etc.)
     * @returns {Promise<Array>} Array de etapas do plano
     */
    static async calculate(config, state) {
        const { estrategiaAtiva } = config;

        if (estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES) {
            return this.calculateCyclesPlan(config, state);
        } else {
            return this.calculateFixedPlan(config, state);
        }
    }

    /**
     * Calcula plano de Mão Fixa
     * @private
     */
    static calculateFixedPlan(config, state) {
        const { percentualEntrada, payout, capitalInicial } = config;

        // Base de cálculo: se há sessão ativa, usa capitalDeCalculo; caso contrário, usa capitalInicial
        const capitalBase = state.isSessionActive ? state.capitalDeCalculo : capitalInicial;
        const payoutDecimal = payout / 100.0;

        if (payoutDecimal <= 0 || payoutDecimal > 1) {
            throw new Error('Payout inválido. Deve estar entre 1 e 100.');
        }

        const entradaFixa = capitalBase * (percentualEntrada / 100.0);
        const retornoFixo = entradaFixa * payoutDecimal;

        return [{
            etapa: 'Mão Fixa',
            entrada: entradaFixa,
            retorno: retornoFixo,
            concluida: false
        }];
    }

    /**
     * Calcula plano de Ciclos
     * @private
     */
    static async calculateCyclesPlan(config, state) {
        const { percentualEntrada, payout, divisorRecuperacao, capitalInicial } = config;
        const payoutNumber = Number(payout);

        if (!Number.isFinite(payoutNumber) || payoutNumber <= 0 || payoutNumber > 100) {
            throw new Error('Payout inválido. Deve estar entre 1 e 100.');
        }

        // Importa calculadora especializada
        const { createCycleCalculator } = await import('./CycleStrategyCalculator.js');

        const capitalBase = state.isSessionActive ? state.capitalDeCalculo : capitalInicial;

        const calculator = createCycleCalculator({
            capitalInicial: capitalBase,
            percentualEntrada: percentualEntrada,
            payout: payoutNumber,
            divisorRecuperacao: divisorRecuperacao,
        });

        return await calculator.calculatePlan();
    }
}
