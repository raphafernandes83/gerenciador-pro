/**
 * ESTRATÉGIAS DE TRADING - GERENCIADOR PRO v9.3
 *
 * Implementa o padrão Strategy para diferentes estratégias de trading
 * Seguindo boas práticas: responsabilidade única, código limpo e testável
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import {
    calculateEntryAmount,
    calculateReturnAmount,
    calculateRecoveryEntry,
} from '../utils/MathUtils.js';
import { TRADING_STRATEGIES, ERROR_MESSAGES } from '../constants/AppConstants.js';

/**
 * Interface base para estratégias de trading
 * Define o contrato que todas as estratégias devem implementar
 */
export class TradingStrategy {
    /**
     * Calcula o plano de operações para a estratégia
     * @param {Object} config - Configurações da estratégia
     * @returns {Array<Object>} Array de etapas do plano
     * @abstract
     */
    calculatePlan(config) {
        throw new Error('Método calculatePlan deve ser implementado pela subclasse');
    }

    /**
     * Valida as configurações necessárias para a estratégia
     * @param {Object} config - Configurações a serem validadas
     * @returns {boolean} True se as configurações forem válidas
     * @abstract
     */
    validateConfig(config) {
        throw new Error('Método validateConfig deve ser implementado pela subclasse');
    }

    /**
     * Obtém o nome da estratégia
     * @returns {string} Nome da estratégia
     * @abstract
     */
    getStrategyName() {
        throw new Error('Método getStrategyName deve ser implementado pela subclasse');
    }
}

/**
 * Estratégia de entrada fixa
 * Mantém sempre o mesmo valor de entrada baseado no percentual do capital
 */
export class FixedAmountStrategy extends TradingStrategy {
    /**
     * Calcula o plano para estratégia de entrada fixa
     * @param {Object} config - Configurações da estratégia
     * @param {number} config.baseCapital - Capital base para cálculo
     * @param {number} config.entryPercentage - Percentual de entrada
     * @param {number} config.payout - Percentual de payout
     * @returns {Array<Object>} Plano com uma única etapa
     *
     * @example
     * const strategy = new FixedAmountStrategy();
     * const plan = strategy.calculatePlan({
     *   baseCapital: 10000,
     *   entryPercentage: 2.0,
     *   payout: 87
     * });
     * // [{etapa: 'Mão Fixa', entrada: 200, retorno: 174}]
     */
    calculatePlan(config) {
        this.validateConfig(config);

        const { baseCapital, entryPercentage, payout } = config;

        try {
            const entryAmount = calculateEntryAmount(baseCapital, entryPercentage);
            const returnAmount = calculateReturnAmount(entryAmount, payout);

            return [
                {
                    etapa: 'Mão Fixa',
                    entrada: entryAmount,
                    retorno: returnAmount,
                    tipo: 'fixa',
                    description: `Entrada fixa de ${entryPercentage}% do capital`,
                },
            ];
        } catch (error) {
            throw new Error(`Erro ao calcular plano de entrada fixa: ${error.message}`);
        }
    }

    /**
     * Valida configurações para estratégia de entrada fixa
     * @param {Object} config - Configurações a serem validadas
     * @returns {boolean} True se válidas
     * @throws {Error} Se alguma configuração for inválida
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('Configurações devem ser um objeto válido');
        }

        const { baseCapital, entryPercentage, payout } = config;

        if (!baseCapital || baseCapital <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_CAPITAL);
        }

        if (!entryPercentage || entryPercentage <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_PERCENTAGE);
        }

        if (!payout || payout <= 0 || payout > 100) {
            throw new Error(ERROR_MESSAGES.INVALID_PAYOUT);
        }

        return true;
    }

    /**
     * @returns {string} Nome da estratégia
     */
    getStrategyName() {
        return 'Entrada Fixa';
    }
}

/**
 * Estratégia de ciclos com recuperação progressiva
 * Implementa um sistema complexo de recuperação de perdas
 */
export class CycleStrategy extends TradingStrategy {
    /**
     * Calcula o plano para estratégia de ciclos
     * @param {Object} config - Configurações da estratégia
     * @param {number} config.baseCapital - Capital base para cálculo
     * @param {number} config.entryPercentage - Percentual de entrada inicial
     * @param {number} config.payout - Percentual de payout
     * @param {number} config.recoveryDivisor - Divisor para recuperação (padrão: 35)
     * @param {number} config.maxCycles - Número máximo de ciclos (padrão: 20)
     * @returns {Array<Object>} Plano completo com todas as etapas
     *
     * @example
     * const strategy = new CycleStrategy();
     * const plan = strategy.calculatePlan({
     *   baseCapital: 10000,
     *   entryPercentage: 2.0,
     *   payout: 87,
     *   recoveryDivisor: 35,
     *   maxCycles: 20
     * });
     */
    calculatePlan(config) {
        this.validateConfig(config);

        const {
            baseCapital,
            entryPercentage,
            payout,
            recoveryDivisor = 35,
            maxCycles = 20,
        } = config;

        try {
            const plan = [];

            // Etapa 1: Mão Fixa
            const fixedEntry = this._calculateFixedPhase(baseCapital, entryPercentage, payout);
            plan.push(fixedEntry);

            // Etapa 2: Reinvestir
            const reinvestPhase = this._calculateReinvestPhase(fixedEntry, payout);
            plan.push(reinvestPhase);

            // Etapa 3: Recuperação
            const recoveryPhase = this._calculateRecoveryPhase(fixedEntry.entrada, payout);
            plan.push(recoveryPhase);

            // Etapas 4+: N Mãos (ciclos de recuperação)
            const cyclicPhases = this._calculateCyclicPhases(
                fixedEntry.entrada + recoveryPhase.entrada,
                payout,
                recoveryDivisor,
                maxCycles
            );
            plan.push(...cyclicPhases);

            return plan;
        } catch (error) {
            throw new Error(`Erro ao calcular plano de ciclos: ${error.message}`);
        }
    }

    /**
     * Calcula a fase de entrada fixa (primeira etapa)
     * @private
     * @param {number} baseCapital - Capital base
     * @param {number} entryPercentage - Percentual de entrada
     * @param {number} payout - Payout
     * @returns {Object} Dados da etapa fixa
     */
    _calculateFixedPhase(baseCapital, entryPercentage, payout) {
        const entryAmount = calculateEntryAmount(baseCapital, entryPercentage);
        const returnAmount = calculateReturnAmount(entryAmount, payout);

        return {
            etapa: 'Mão Fixa',
            entrada: entryAmount,
            retorno: returnAmount,
            tipo: 'fixa',
            description: 'Entrada inicial baseada no percentual do capital',
        };
    }

    /**
     * Calcula a fase de reinvestimento (segunda etapa)
     * @private
     * @param {Object} fixedPhase - Dados da etapa fixa
     * @param {number} payout - Payout
     * @returns {Object} Dados da etapa de reinvestimento
     */
    _calculateReinvestPhase(fixedPhase, payout) {
        const entryAmount = fixedPhase.entrada + fixedPhase.retorno;
        const returnAmount = calculateReturnAmount(entryAmount, payout);

        return {
            etapa: 'Reinvestir',
            entrada: entryAmount,
            retorno: returnAmount,
            tipo: 'reinvestimento',
            description: 'Reinveste entrada + retorno da mão fixa',
        };
    }

    /**
     * Calcula a fase de recuperação (terceira etapa)
     * @private
     * @param {number} targetRecovery - Valor a ser recuperado
     * @param {number} payout - Payout
     * @returns {Object} Dados da etapa de recuperação
     */
    _calculateRecoveryPhase(targetRecovery, payout) {
        const entryAmount = calculateRecoveryEntry(targetRecovery, payout);
        const returnAmount = calculateReturnAmount(entryAmount, payout);

        return {
            etapa: 'Recuperação',
            entrada: entryAmount,
            retorno: returnAmount,
            tipo: 'recuperacao',
            description: `Recupera ${targetRecovery.toFixed(2)} da mão fixa`,
        };
    }

    /**
     * Calcula as fases cíclicas de recuperação (etapas 4+)
     * @private
     * @param {number} initialLoss - Perda acumulada inicial
     * @param {number} payout - Payout
     * @param {number} recoveryDivisor - Divisor de recuperação
     * @param {number} maxCycles - Número máximo de ciclos
     * @returns {Array<Object>} Array de etapas cíclicas
     */
    _calculateCyclicPhases(initialLoss, payout, recoveryDivisor, maxCycles) {
        const phases = [];
        let accumulatedLoss = initialLoss;
        const divisorPercentage = recoveryDivisor / 100;

        for (let i = 1; i <= maxCycles; i++) {
            // Primeira mão do ciclo (recupera parte da perda)
            const targetRecovery1 = accumulatedLoss * divisorPercentage;
            const entry1 = calculateRecoveryEntry(targetRecovery1, payout);

            // Segunda mão do ciclo (recupera o restante)
            const targetRecovery2 = accumulatedLoss * (1 - divisorPercentage);
            const entry2 = calculateRecoveryEntry(targetRecovery2, payout);

            phases.push({
                etapa: `${i}ª Mão`,
                entrada1: entry1,
                retorno1: targetRecovery1,
                entrada2: entry2,
                retorno2: targetRecovery2,
                tipo: 'ciclica',
                ciclo: i,
                description: `Ciclo ${i}: Recuperação dividida em duas entradas`,
            });

            // Atualiza perda acumulada (assumindo perda na primeira entrada)
            accumulatedLoss += entry1;
        }

        return phases;
    }

    /**
     * Valida configurações para estratégia de ciclos
     * @param {Object} config - Configurações a serem validadas
     * @returns {boolean} True se válidas
     * @throws {Error} Se alguma configuração for inválida
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('Configurações devem ser um objeto válido');
        }

        const { baseCapital, entryPercentage, payout, recoveryDivisor = 35 } = config;

        if (!baseCapital || baseCapital <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_CAPITAL);
        }

        if (!entryPercentage || entryPercentage <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_PERCENTAGE);
        }

        if (!payout || payout <= 0 || payout > 100) {
            throw new Error(ERROR_MESSAGES.INVALID_PAYOUT);
        }

        if (recoveryDivisor <= 0 || recoveryDivisor >= 100) {
            throw new Error('Divisor de recuperação deve estar entre 1% e 99%');
        }

        return true;
    }

    /**
     * @returns {string} Nome da estratégia
     */
    getStrategyName() {
        return 'Ciclos de Recuperação';
    }
}

/**
 * Factory para criar instâncias de estratégias
 * Implementa o padrão Factory Method
 */
export class TradingStrategyFactory {
    /** @private */
    static _customStrategies = new Map();

    /**
     * Cria uma instância de estratégia baseada no tipo
     * @param {string} strategyType - Tipo da estratégia
     * @returns {TradingStrategy} Instância da estratégia
     */
    static create(strategyType) {
        // Verifica primeiro se há estratégia customizada registrada
        if (this._customStrategies.has(strategyType)) {
            const StrategyClass = this._customStrategies.get(strategyType);
            return new StrategyClass();
        }

        switch (strategyType) {
            case TRADING_STRATEGIES.FIXED_AMOUNT:
                return new FixedAmountStrategy();

            case TRADING_STRATEGIES.CYCLES:
                return new CycleStrategy();

            default:
                throw new Error(`Tipo de estratégia inválido: ${strategyType}`);
        }
    }

    /**
     * Registra uma nova estratégia em tempo de execução.
     * @param {string} type - Identificador único da estratégia.
     * @param {class} strategyClass - Classe que estende TradingStrategy.
     */
    static registerStrategy(type, strategyClass) {
        if (!type || typeof type !== 'string') {
            throw new Error('Tipo de estratégia deve ser uma string');
        }
        if (typeof strategyClass !== 'function') {
            throw new Error('strategyClass deve ser uma classe/função construtora');
        }
        this._customStrategies.set(type, strategyClass);
    }

    /**
     * Retorna mapa interno (somente leitura) de estratégias customizadas
     */
    static getCustomStrategies() {
        return new Map(this._customStrategies);
    }

    /**
     * Lista todas as estratégias disponíveis
     */
    static getAvailableStrategies() {
        const base = [
            {
                type: TRADING_STRATEGIES.FIXED_AMOUNT,
                name: 'Entrada Fixa',
                description: 'Mantém entrada constante baseada no percentual do capital',
            },
            {
                type: TRADING_STRATEGIES.CYCLES,
                name: 'Ciclos de Recuperação',
                description: 'Sistema progressivo de recuperação de perdas',
            },
        ];

        // Adiciona estratégias customizadas registradas
        this._customStrategies.forEach((cls, type) => {
            base.push({
                type,
                name: cls.prototype?.name || type,
                description: cls.prototype?.description || 'Estratégia customizada',
            });
        });

        return base;
    }
}
