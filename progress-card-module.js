/**
 * 🔄 Progress Card Module - Compatibility Layer
 * 
 * Camada de compatibilidade para manter os imports antigos funcionando
 * enquanto a aplicação migra para a nova estrutura organizada.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 * @deprecated Use imports diretos da pasta progress-card/
 */

// ============================================================================
// RE-EXPORTS PARA COMPATIBILIDADE
// ============================================================================

// Principais funções que eram importadas diretamente
export {
    updateProgressCardComplete,
    clearProgressCard,
    updatePercentageElements,
    updateSessionInfo,
    applyDynamicColors
} from './progress-card/ui/updater.js';

export {
    clearProgressCardUI,
    renderPercentageElements
} from './progress-card/ui/renderer.js';

export {
    validateCardData,
    determineDynamicColors,
    determineSessionState
} from './progress-card/business/logic.js';

export {
    calculateProgressCardData,
    calculateRealStats,
    calculateMonetaryValues
} from './progress-card/business/calculator.js';

export {
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced
} from './progress-card/utils/monetary.js';

// Constantes mais utilizadas
export {
    COLORS,
    MESSAGES,
    THRESHOLDS,
    CSS_CLASSES
} from './progress-card/config/constants.js';

// ============================================================================
// AVISOS DE MIGRAÇÃO
// ============================================================================

if (typeof window !== 'undefined') {
    console.warn(`
🔄 AVISO DE MIGRAÇÃO - Progress Card Module

Os imports do card de progresso foram reorganizados!

❌ Antigo (deprecated):
import { updateProgressCardComplete } from './progress-card-updater.js';

✅ Novo (recomendado):
import { updateProgressCardComplete } from './progress-card/ui/updater.js';
// ou
import { updateProgressCard } from './progress-card/index.js';

📁 Nova estrutura:
progress-card/
├── business/     # Lógica de negócio
├── ui/          # Interface e renderização  
├── config/      # Constantes e configurações
├── utils/       # Utilitários e cache
└── index.js     # Export centralizado

Migre seus imports quando possível!
    `);
}

// ============================================================================
// EXPOSIÇÃO GLOBAL PARA COMPATIBILIDADE
// ============================================================================

if (typeof window !== 'undefined') {
    // Mantém as funções globais existentes
    import('./progress-card/ui/updater.js').then(module => {
        window.updateProgressCardComplete = module.updateProgressCardComplete;
        window.clearProgressCard = module.clearProgressCard;
        window.updatePercentageElements = module.updatePercentageElements;
        window.updateSessionInfo = module.updateSessionInfo;
        window.applyDynamicColors = module.applyDynamicColors;
    });
    
    import('./progress-card/ui/renderer.js').then(module => {
        window.clearProgressCardUI = module.clearProgressCardUI;
        window.renderPercentageElements = module.renderPercentageElements;
    });
    
    import('./progress-card/business/logic.js').then(module => {
        window.validateCardData = module.validateCardData;
        window.determineDynamicColors = module.determineDynamicColors;
        window.determineSessionState = module.determineSessionState;
    });
}




