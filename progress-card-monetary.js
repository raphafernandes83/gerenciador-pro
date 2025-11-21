/**
 * 💰 Progress Card Monetary - Ponte para o módulo monetário
 * 
 * Este arquivo faz a ponte entre as referências antigas e o novo sistema modular.
 * Importa e re-exporta as funcionalidades do módulo monetário.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Bridge Module
 */

// Importa as funcionalidades do módulo monetário
import { 
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced
} from './progress-card/utils/monetary.js';

// Re-exporta as funcionalidades para manter compatibilidade
export {
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced
};

// Exposição global para compatibilidade com código legado
if (typeof window !== 'undefined') {
    window.formatCurrencyAdvanced = formatCurrencyAdvanced;
    window.calculateMonetaryPerformance = calculateMonetaryPerformance;
    window.updateMonetaryElementsAdvanced = updateMonetaryElementsAdvanced;
    
    console.log('💰 Progress Card Monetary Bridge carregado com sucesso');
}








