/**
 * @fileoverview Plugin de Validação de Dados
 * @description Valida e sanitiza dados antes da renderização
 * @version 1.0.0
 */

import { IChartPlugin } from '../UnifiedChartSystem.js';

export class DataValidationPlugin extends IChartPlugin {
    constructor() {
        super();
        this.validationRules = new Map();
        this.sanitizationRules = new Map();
        this._initializeDefaultRules();
    }
    
    initialize(chartSystem) {
        this.chartSystem = chartSystem;
        console.log('🛡️ Plugin de Validação de Dados inicializado');
    }
    
    _initializeDefaultRules() {
        // Regras de validação padrão
        this.validationRules.set('wins', (value) => {
            return typeof value === 'number' && value >= 0 && Number.isInteger(value);
        });
        
        this.validationRules.set('losses', (value) => {
            return typeof value === 'number' && value >= 0 && Number.isInteger(value);
        });
        
        this.validationRules.set('winRate', (value) => {
            return typeof value === 'number' && value >= 0 && value <= 100;
        });
        
        this.validationRules.set('lossRate', (value) => {
            return typeof value === 'number' && value >= 0 && value <= 100;
        });
        
        this.validationRules.set('totalOperations', (value) => {
            return typeof value === 'number' && value >= 0 && Number.isInteger(value);
        });
        
        // Regras de sanitização
        this.sanitizationRules.set('wins', (value) => {
            if (typeof value !== 'number') return 0;
            return Math.max(0, Math.floor(value));
        });
        
        this.sanitizationRules.set('losses', (value) => {
            if (typeof value !== 'number') return 0;
            return Math.max(0, Math.floor(value));
        });
        
        this.sanitizationRules.set('winRate', (value) => {
            if (typeof value !== 'number') return 0;
            return Math.max(0, Math.min(100, value));
        });
        
        this.sanitizationRules.set('lossRate', (value) => {
            if (typeof value !== 'number') return 0;
            return Math.max(0, Math.min(100, value));
        });
        
        this.sanitizationRules.set('totalOperations', (value) => {
            if (typeof value !== 'number') return 0;
            return Math.max(0, Math.floor(value));
        });
    }
    
    beforeRender(canvas, data, options) {
        // Valida dados antes da renderização
        const validatedData = this._validateAndSanitizeData(data);
        
        // Verifica consistência dos dados
        this._checkDataConsistency(validatedData);
        
        return { canvas, data: validatedData, options };
    }
    
    _validateAndSanitizeData(data) {
        const sanitizedData = { ...data };
        const errors = [];
        
        for (const [key, value] of Object.entries(data)) {
            // Aplica validação
            const validator = this.validationRules.get(key);
            if (validator && !validator(value)) {
                errors.push(`Valor inválido para '${key}': ${value}`);
                
                // Aplica sanitização
                const sanitizer = this.sanitizationRules.get(key);
                if (sanitizer) {
                    sanitizedData[key] = sanitizer(value);
                    console.warn(`⚠️ Valor '${key}' sanitizado: ${value} → ${sanitizedData[key]}`);
                }
            }
        }
        
        if (errors.length > 0) {
            console.warn('🛡️ Erros de validação encontrados:', errors);
        }
        
        return sanitizedData;
    }
    
    _checkDataConsistency(data) {
        const { wins = 0, losses = 0, winRate = 0, lossRate = 0, totalOperations = 0 } = data;
        
        // Verifica se total de operações é consistente
        const calculatedTotal = wins + losses;
        if (totalOperations !== calculatedTotal && calculatedTotal > 0) {
            console.warn(`⚠️ Inconsistência: totalOperations (${totalOperations}) ≠ wins + losses (${calculatedTotal})`);
            data.totalOperations = calculatedTotal;
        }
        
        // Verifica se percentuais são consistentes
        if (calculatedTotal > 0) {
            const calculatedWinRate = (wins / calculatedTotal) * 100;
            const calculatedLossRate = (losses / calculatedTotal) * 100;
            
            if (Math.abs(winRate - calculatedWinRate) > 0.1) {
                console.warn(`⚠️ Inconsistência: winRate (${winRate}) ≠ calculado (${calculatedWinRate.toFixed(1)})`);
                data.winRate = calculatedWinRate;
            }
            
            if (Math.abs(lossRate - calculatedLossRate) > 0.1) {
                console.warn(`⚠️ Inconsistência: lossRate (${lossRate}) ≠ calculado (${calculatedLossRate.toFixed(1)})`);
                data.lossRate = calculatedLossRate;
            }
        }
        
        // Verifica se percentuais somam 100% (com tolerância)
        const totalRate = data.winRate + data.lossRate;
        if (calculatedTotal > 0 && Math.abs(totalRate - 100) > 0.1) {
            console.warn(`⚠️ Inconsistência: winRate + lossRate (${totalRate}) ≠ 100%`);
        }
    }
    
    /**
     * Adiciona regra de validação customizada
     */
    addValidationRule(field, validator) {
        if (typeof validator !== 'function') {
            throw new Error('Validator must be a function');
        }
        
        this.validationRules.set(field, validator);
        console.log(`🛡️ Regra de validação adicionada para '${field}'`);
    }
    
    /**
     * Adiciona regra de sanitização customizada
     */
    addSanitizationRule(field, sanitizer) {
        if (typeof sanitizer !== 'function') {
            throw new Error('Sanitizer must be a function');
        }
        
        this.sanitizationRules.set(field, sanitizer);
        console.log(`🧹 Regra de sanitização adicionada para '${field}'`);
    }
    
    /**
     * Valida dados externamente (sem renderização)
     */
    validateData(data) {
        return this._validateAndSanitizeData(data);
    }
    
    destroy() {
        this.validationRules.clear();
        this.sanitizationRules.clear();
    }
}
