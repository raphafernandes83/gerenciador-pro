/**
 * 🧮 Progress Card Calculator - Ponte para o módulo de cálculos
 * 
 * Este arquivo faz a ponte entre as referências antigas e o novo sistema modular.
 * Importa e re-exporta as funcionalidades do módulo de cálculos.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Bridge Module
 */

// Importa as funcionalidades do módulo de cálculos
import { 
    calculateRealStats,
    calculatePointsPercentage,
    calculateMonetaryValues,
    calculateProgressCardData
} from './progress-card/business/calculator.js';

// Re-exporta as funcionalidades para manter compatibilidade
export {
    calculateRealStats,
    calculatePointsPercentage,
    calculateMonetaryValues,
    calculateProgressCardData
};

// Exposição global para compatibilidade com código legado
if (typeof window !== 'undefined') {
    window.calculateRealStats = calculateRealStats;
    window.calculatePointsPercentage = calculatePointsPercentage;
    window.calculateMonetaryValues = calculateMonetaryValues;
    window.calculateProgressCardData = calculateProgressCardData;
    
    console.log('🧮 Progress Card Calculator Bridge carregado com sucesso');
}








