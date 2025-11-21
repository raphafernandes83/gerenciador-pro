/**
 * 🧮 CALCULADORA DE ESTRATÉGIA DE CICLOS - GERENCIADOR PRO v9.3
 * Responsabilidade única: Cálculos matemáticos para estratégia de ciclos
 *
 * Refatoração da função calcularPlanoCiclos() seguindo princípios SOLID
 * Separação de responsabilidades: matemática vs performance vs estado
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 */

import { TIMING_CONFIG, PERFORMANCE_THRESHOLDS } from '../constants/SystemConstants.js';
import { calculateEntryAmount, calculateReturnAmount } from '../utils/MathUtils.js';
import { measurePerformance } from '../utils/PerformanceUtils.js';

/**
 * 🎯 Configurações de processamento
 * @readonly
 */
const PROCESSING_CONFIG = {
    /** Tamanho do chunk para processamento */
    CHUNK_SIZE: 5,
    /** Número total de mãos a calcular */
    TOTAL_HANDS: 20,
    /** Delay entre chunks (ms) */
    YIELD_DELAY: TIMING_CONFIG.PERFORMANCE.PROCESSING_YIELD_DELAY,
};

/**
 * 📊 Tipos de etapas do plano de ciclos
 * @readonly
 */
export const CYCLE_STEP_TYPES = {
    FIXED_HAND: 'fixed_hand',
    REINVEST: 'reinvest',
    RECOVERY: 'recovery',
    N_HAND: 'n_hand',
};

/**
 * 🧮 Calculadora especializada para estratégia de ciclos
 * Implementa Template Method Pattern para cálculos estruturados
 */
export class CycleStrategyCalculator {
    constructor(config) {
        this.config = config;
        this.accumulatedLoss = 0;
        this.plan = [];

        // Validação de configuração
        this._validateConfig(config);

        // Configuração de performance
        this.processingConfig = {
            ...PROCESSING_CONFIG,
            // Permite override via configuração
            ...(config.processingConfig || {}),
        };
    }

    /**
     * 🎯 Método principal - Template Method Pattern
     * Orquestra o cálculo seguindo um template fixo
     *
     * @returns {Promise<Array>} Plano de operações calculado
     */
    async calculatePlan() {
        try {
            const startTime = performance.now();

            // Template Method: ordem fixa de execução
            this._initializePlan();
            await this._calculateInitialSteps();
            await this._calculateRecoverySteps();
            const finalPlan = this._finalizePlan();

            const elapsed = performance.now() - startTime;
            console.log(
                `🧮 Plano de ciclos calculado em ${elapsed.toFixed(2)}ms - ${finalPlan.length} etapas`
            );

            return finalPlan;
        } catch (error) {
            console.error('❌ Erro no cálculo do plano de ciclos:', error);
            throw new Error(`Falha no cálculo: ${error.message}`);
        }
    }

    /**
     * 🚀 Inicializa o plano limpo
     * @private
     */
    _initializePlan() {
        this.plan = [];
        this.accumulatedLoss = 0;
        console.log('🚀 Inicializando cálculo de plano de ciclos...');
    }

    /**
     * 🎯 Calcula as 3 etapas iniciais do ciclo
     * @private
     */
    async _calculateInitialSteps() {
        console.log('📊 Calculando etapas iniciais (Mão Fixa, Reinvestir, Recuperação)...');

        // Etapa 1: Mão Fixa
        const fixedHandStep = this._calculateFixedHandStep();
        this.plan.push(fixedHandStep);

        // Etapa 2: Reinvestir
        const reinvestStep = this._calculateReinvestStep(fixedHandStep);
        this.plan.push(reinvestStep);

        // Etapa 3: Recuperação
        const recoveryStep = this._calculateRecoveryStep(fixedHandStep);
        this.plan.push(recoveryStep);

        // Calcula perda acumulada após as 3 etapas iniciais
        this.accumulatedLoss = fixedHandStep.entrada + recoveryStep.entrada;

        console.log(
            `✅ Etapas iniciais calculadas. Perda acumulada: ${this.accumulatedLoss.toFixed(2)}`
        );
    }

    /**
     * 🎯 Calcula Mão Fixa (1ª etapa)
     * @private
     * @returns {Object} Dados da etapa Mão Fixa
     */
    _calculateFixedHandStep() {
        const entrada = calculateEntryAmount(
            this.config.capitalInicial,
            this.config.percentualEntrada
        );

        const retorno = calculateReturnAmount(entrada, this.config.payout);

        return {
            etapa: 'Mão Fixa',
            type: CYCLE_STEP_TYPES.FIXED_HAND,
            entrada: Number(entrada.toFixed(2)),
            retorno: Number(retorno.toFixed(2)),
            metadata: {
                capitalInicial: this.config.capitalInicial,
                percentualEntrada: this.config.percentualEntrada,
                payout: this.config.payout,
            },
        };
    }

    /**
     * 🔄 Calcula Reinvestir (2ª etapa)
     * @private
     * @param {Object} fixedHandStep - Dados da Mão Fixa
     * @returns {Object} Dados da etapa Reinvestir
     */
    _calculateReinvestStep(fixedHandStep) {
        const entrada = fixedHandStep.entrada + fixedHandStep.retorno;
        const retorno = calculateReturnAmount(entrada, this.config.payout);

        return {
            etapa: 'Reinvestir',
            type: CYCLE_STEP_TYPES.REINVEST,
            entrada: Number(entrada.toFixed(2)),
            retorno: Number(retorno.toFixed(2)),
            metadata: {
                basedOn: 'fixed_hand_total',
                originalEntry: fixedHandStep.entrada,
                originalReturn: fixedHandStep.retorno,
            },
        };
    }

    /**
     * 🛡️ Calcula Recuperação (3ª etapa)
     * @private
     * @param {Object} fixedHandStep - Dados da Mão Fixa
     * @returns {Object} Dados da etapa Recuperação
     */
    _calculateRecoveryStep(fixedHandStep) {
        const valueToRecover = fixedHandStep.entrada;
        const payoutDecimal = this.config.payout / 100;
        const entrada = valueToRecover / payoutDecimal;
        const retorno = calculateReturnAmount(entrada, this.config.payout);

        return {
            etapa: 'Recuperação',
            type: CYCLE_STEP_TYPES.RECOVERY,
            entrada: Number(entrada.toFixed(2)),
            retorno: Number(retorno.toFixed(2)),
            metadata: {
                valueToRecover,
                payoutDecimal,
                basedOn: 'fixed_hand_entry',
            },
        };
    }

    /**
     * 🎲 Calcula as 20 N Mãos com processamento em chunks
     * @private
     */
    async _calculateRecoverySteps() {
        console.log(
            `🎲 Calculando ${this.processingConfig.TOTAL_HANDS} N Mãos em chunks de ${this.processingConfig.CHUNK_SIZE}...`
        );

        const chunks = this._calculateChunks();

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];

            // Processa mãos do chunk atual
            for (let handIndex = chunk.start; handIndex < chunk.end; handIndex++) {
                const nHandStep = this._calculateNHandStep(handIndex + 1);
                this.plan.push(nHandStep);

                // Atualiza perda acumulada
                this.accumulatedLoss += nHandStep.entrada1;
            }

            // Yielding entre chunks para não bloquear UI
            if (chunkIndex < chunks.length - 1) {
                await this._yieldToMainThread();
            }

            console.log(`✅ Chunk ${chunkIndex + 1}/${chunks.length} processado`);
        }

        console.log(
            `🎯 ${this.processingConfig.TOTAL_HANDS} N Mãos calculadas. Perda final: ${this.accumulatedLoss.toFixed(2)}`
        );
    }

    /**
     * 🔢 Calcula uma N Mão específica
     * @private
     * @param {number} handNumber - Número da mão (1-20)
     * @returns {Object} Dados da N Mão
     */
    _calculateNHandStep(handNumber) {
        const divisor = this.config.divisorRecuperacao / 100;
        const payoutDecimal = this.config.payout / 100;

        // Primeira entrada (divisor da recuperação)
        const targetReturn1 = this.accumulatedLoss * divisor;
        const entrada1 = targetReturn1 / payoutDecimal;
        const retorno1 = targetReturn1;

        // Segunda entrada (resto da recuperação)
        const targetReturn2 = this.accumulatedLoss * (1 - divisor);
        const entrada2 = targetReturn2 / payoutDecimal;
        const retorno2 = targetReturn2;

        return {
            etapa: `${handNumber}ª Mão`,
            type: CYCLE_STEP_TYPES.N_HAND,
            entrada1: Number(entrada1.toFixed(2)),
            retorno1: Number(retorno1.toFixed(2)),
            entrada2: Number(entrada2.toFixed(2)),
            retorno2: Number(retorno2.toFixed(2)),
            metadata: {
                handNumber,
                accumulatedLoss: this.accumulatedLoss,
                divisor,
                payoutDecimal,
            },
        };
    }

    /**
     * 🧮 Calcula chunks para processamento
     * @private
     * @returns {Array} Array de chunks com start/end
     */
    _calculateChunks() {
        const chunks = [];
        const totalHands = this.processingConfig.TOTAL_HANDS;
        const chunkSize = this.processingConfig.CHUNK_SIZE;

        for (let i = 0; i < totalHands; i += chunkSize) {
            chunks.push({
                start: i,
                end: Math.min(i + chunkSize, totalHands),
                size: Math.min(chunkSize, totalHands - i),
            });
        }

        return chunks;
    }

    /**
     * ⏱️ Yielding para thread principal
     * @private
     */
    async _yieldToMainThread() {
        const safeTimeout = window.safeProtection?.safeSetTimeout || setTimeout;
        return new Promise((resolve) => safeTimeout(resolve, this.processingConfig.YIELD_DELAY));
    }

    /**
     * 🎯 Finaliza o plano com metadata
     * @private
     * @returns {Array} Plano final com estatísticas
     */
    _finalizePlan() {
        const finalPlan = [...this.plan];

        // Adiciona metadata ao plano
        finalPlan.metadata = {
            strategy: 'cycles',
            totalSteps: finalPlan.length,
            accumulatedLoss: this.accumulatedLoss,
            config: { ...this.config },
            calculatedAt: new Date().toISOString(),
            processingStats: {
                chunksUsed: this._calculateChunks().length,
                chunkSize: this.processingConfig.CHUNK_SIZE,
            },
        };

        return finalPlan;
    }

    /**
     * ✅ Valida configuração de entrada
     * @private
     * @param {Object} config - Configuração a validar
     */
    _validateConfig(config) {
        const required = ['capitalInicial', 'percentualEntrada', 'payout', 'divisorRecuperacao'];

        for (const field of required) {
            if (config[field] === undefined || config[field] === null) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }

            if (typeof config[field] !== 'number' || config[field] <= 0) {
                throw new Error(`Campo ${field} deve ser um número positivo`);
            }
        }

        // Validações específicas
        if (config.percentualEntrada > 100) {
            throw new Error('Percentual de entrada não pode ser maior que 100%');
        }

        if (config.payout > 100) {
            throw new Error('Payout não pode ser maior que 100%');
        }

        if (config.divisorRecuperacao > 100) {
            throw new Error('Divisor de recuperação não pode ser maior que 100%');
        }

        console.log('✅ Configuração validada:', config);
    }

    /**
     * 📊 Obtém estatísticas do cálculo
     * @returns {Object} Estatísticas detalhadas
     */
    getStatistics() {
        const totalEntries = this.plan.reduce((sum, step) => {
            if (step.entrada) return sum + step.entrada;
            if (step.entrada1) return sum + step.entrada1 + step.entrada2;
            return sum;
        }, 0);

        const totalReturns = this.plan.reduce((sum, step) => {
            if (step.retorno) return sum + step.retorno;
            if (step.retorno1) return sum + step.retorno1 + step.retorno2;
            return sum;
        }, 0);

        return {
            totalSteps: this.plan.length,
            totalEntries: Number(totalEntries.toFixed(2)),
            totalReturns: Number(totalReturns.toFixed(2)),
            accumulatedLoss: Number(this.accumulatedLoss.toFixed(2)),
            recoveryRatio: Number((totalReturns / totalEntries).toFixed(4)),
            config: this.config,
        };
    }
}

/**
 * 🏭 Factory para criar calculadora de ciclos
 * @param {Object} config - Configuração da estratégia
 * @returns {CycleStrategyCalculator} Instância da calculadora
 */
export function createCycleCalculator(config) {
    return new CycleStrategyCalculator(config);
}

/**
 * 🧪 Utilitário para testar cálculos
 * @param {Object} testConfig - Configuração de teste
 * @returns {Promise<Object>} Resultado do teste
 */
export async function testCycleCalculation(testConfig = {}) {
    const defaultConfig = {
        capitalInicial: 10000,
        percentualEntrada: 2,
        payout: 87,
        divisorRecuperacao: 50,
    };

    const config = { ...defaultConfig, ...testConfig };
    const calculator = createCycleCalculator(config);

    try {
        const plan = await calculator.calculatePlan();
        const stats = calculator.getStatistics();

        return {
            success: true,
            plan,
            stats,
            config,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            config,
        };
    }
}
