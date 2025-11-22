/**
 * 📊 OPERATION MODULE
 * Gerencia operações de trading (registro, validação, cálculos)
 * 
 * @module OperationModule
 * @since Fase 3 - Checkpoint 3.3
 */

import BaseModule from './BaseModule.js';

export class OperationModule extends BaseModule {
    constructor() {
        super('OperationModule');
        this.operations = [];
        this.validators = [];
    }

    /**
     * Inicialização do módulo
     */
    async init() {
        await super.init();

        // Registra validadores padrão
        this._registerDefaultValidators();

        console.log('✅ OperationModule inicializado');
    }

    /**
     * Registra uma nova operação
     * @param {Object} operationData - Dados da operação
     * @returns {Object} Operação registrada
     */
    registerOperation(operationData) {
        // Valida entrada
        const validation = this.validateOperation(operationData);
        if (!validation.valid) {
            throw new Error(`Operação inválida: ${validation.errors.join(', ')}`);
        }

        // Calcula valores
        const calculatedValues = this.calculateOperationValues(operationData);

        // Cria operação completa
        const operation = {
            id: this._generateId(),
            timestamp: Date.now(),
            ...operationData,
            ...calculatedValues,
            createdAt: new Date().toISOString()
        };

        // Armazena
        this.operations.push(operation);

        console.log('💰 Operação registrada:', operation.id);
        return operation;
    }

    /**
     * Calcula valores de uma operação
     * @param {Object} data - Dados da operação
     * @returns {Object} Valores calculados
     */
    calculateOperationValues(data) {
        const {
            entry = 0,
            payout = 0,
            isWin = false
        } = data;

        const value = isWin
            ? entry * (payout / 100)
            : -entry;

        const profit = value;
        const profitPercent = entry > 0 ? (value / entry) * 100 : 0;

        return {
            value,
            profit,
            profitPercent,
            result: isWin ? 'win' : 'loss'
        };
    }

    /**
     * Valida operação
     * @param {Object} data - Dados da operação
     * @returns {Object} Resultado da validação
     */
    validateOperation(data) {
        const errors = [];

        // Executa validadores registrados
        for (const validator of this.validators) {
            const result = validator(data);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Registra validador customizado
     * @param {Function} validator - Função validadora
     */
    registerValidator(validator) {
        if (typeof validator !== 'function') {
            throw new Error('Validator deve ser uma função');
        }
        this.validators.push(validator);
    }

    /**
     * Retorna operação por ID
     * @param {string} id - ID da operação
     */
    getOperation(id) {
        return this.operations.find(op => op.id === id);
    }

    /**
     * Retorna todas as operações
     */
    getAllOperations() {
        return [...this.operations];
    }

    /**
     * Filtra operações
     * @param {Function} predicate - Função de filtro
     */
    filterOperations(predicate) {
        return this.operations.filter(predicate);
    }

    /**
     * Retorna operações vencedoras
     */
    getWinningOperations() {
        return this.filterOperations(op => op.isWin === true);
    }

    /**
     * Retorna operações perdedoras
     */
    getLosingOperations() {
        return this.filterOperations(op => op.isWin === false);
    }

    /**
     * Calcula estatísticas das operações
     */
    calculateStats() {
        const total = this.operations.length;
        const wins = this.getWinningOperations().length;
        const losses = this.getLosingOperations().length;

        const totalProfit = this.operations.reduce((sum, op) => sum + (op.value || 0), 0);

        const avgWin = wins > 0
            ? this.getWinningOperations().reduce((sum, op) => sum + op.value, 0) / wins
            : 0;

        const avgLoss = losses > 0
            ? Math.abs(this.getLosingOperations().reduce((sum, op) => sum + op.value, 0) / losses)
            : 0;

        const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

        return {
            total,
            wins,
            losses,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            lossRate: total > 0 ? (losses / total) * 100 : 0,
            totalProfit,
            avgWin,
            avgLoss,
            payoffRatio,
            expectancy: this._calculateExpectancy(wins, losses, total, avgWin, avgLoss)
        };
    }

    /**
     * Limpa todas as operações
     */
    clearOperations() {
        const count = this.operations.length;
        this.operations = [];
        console.log(`🧹 ${count} operações removidas`);
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Registra validadores padrão
     */
    _registerDefaultValidators() {
        // Validador: entrada deve ser número positivo
        this.registerValidator((data) => {
            const errors = [];
            if (typeof data.entry !== 'number' || data.entry <= 0) {
                errors.push('Entry deve ser um número positivo');
            }
            return { valid: errors.length === 0, errors };
        });

        // Validador: payout deve ser número não-negativo
        this.registerValidator((data) => {
            const errors = [];
            if (typeof data.payout !== 'number' || data.payout < 0) {
                errors.push('Payout deve ser um número não-negativo');
            }
            return { valid: errors.length === 0, errors };
        });

        // Validador: isWin deve ser boolean
        this.registerValidator((data) => {
            const errors = [];
            if (typeof data.isWin !== 'boolean') {
                errors.push('isWin deve ser boolean');
            }
            return { valid: errors.length === 0, errors };
        });
    }

    /**
     * Gera ID único
     */
    _generateId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calcula expectativa matemática
     */
    _calculateExpectancy(wins, losses, total, avgWin, avgLoss) {
        if (total === 0) return 0;

        const winRate = wins / total;
        const lossRate = losses / total;

        return (winRate * avgWin) - (lossRate * avgLoss);
    }

    /**
     * Cleanup do módulo
     */
    destroy() {
        this.operations = [];
        this.validators = [];
        super.destroy();
    }

    /**
     * Informações do módulo
     */
    getInfo() {
        return {
            ...super.getInfo(),
            totalOperations: this.operations.length,
            validators: this.validators.length,
            stats: this.calculateStats()
        };
    }
}

export default OperationModule;
