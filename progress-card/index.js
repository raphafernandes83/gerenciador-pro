/**
 * 📦 Progress Card Module - Barrel Export
 * 
 * Ponto de entrada centralizado para o módulo do card de progresso.
 * Facilita imports externos e mantém a organização interna.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// EXPORTS ORGANIZADOS POR CATEGORIA
// ============================================================================

// Business Logic - Lógica de negócio pura
export {
    validateCardData,
    determineWinRateVisualState,
    determineLossRateVisualState,
    determineSessionState,
    determineBadgeStates,
    determineDynamicColors
} from './business/logic.js';

export {
    calculateRealStats,
    calculatePointsPercentage,
    calculateMonetaryValues,
    calculateProgressCardData
} from './business/calculator.js';

// UI Rendering - Interface e renderização
export {
    renderWinRateVisualState,
    renderLossRateVisualState,
    renderSessionInfo,
    renderBadges,
    renderDynamicColors,
    clearProgressCardUI,
    renderPercentageElements
} from './ui/renderer.js';

export {
    applyVisualState,
    manageBadgeDisplay,
    applyTheme,
    resetStyles,
    applyAnimation,
    resolveStyleConflicts,
    initializeCSSManager
} from './ui/css-manager.js';

export {
    updateProgressCardComplete,
    updateProgressChart,
    updatePercentageElements,
    updateSessionInfo,
    applyDynamicColors,
    clearProgressCard,
    createDOMListener,
    initializeProgressCardState,
    getCardState,
    updateCardState
} from './ui/updater.js';

// Performance Optimization - Sistema de otimização
export {
    updateProgressCardOptimized,
    renderPercentageElementsOptimized,
    renderWithFallback
} from './ui/optimized-renderer.js';

export {
    memoize,
    debounce,
    detectChanges,
    updateElementIfChanged,
    queueUpdate,
    measurePerformance,
    getPerformanceMetrics,
    resetPerformanceMetrics
} from './utils/performance-optimizer.js';

// State Management - Gerenciamento de estado
export {
    stateManager,
    getProgressCardState,
    updateProgressCardState,
    observeProgressCardState,
    resetProgressCardState
} from './utils/state-manager.js';

export {
    stateSynchronizer,
    initializeStateSync,
    stopStateSync,
    getStateSyncStats
} from './utils/state-synchronizer.js';

// Error Handling - Sistema de tratamento de erros
export {
    errorHandler,
    handleProgressCardError,
    safeExecute,
    safeExecuteAsync,
    getErrorStats,
    ERROR_TYPES,
    ERROR_SEVERITY,
    RECOVERY_STRATEGIES
} from './utils/error-handler.js';

// Utilities - Utilitários e cache
export {
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced,
    updateRiskUsedElements,
    clearMonetaryElements,
    animateRiskAlerts
} from './utils/monetary.js';

export {
    ProgressCardCache
} from './utils/cache.js';

// Configuration - Constantes e configurações
export {
    COLORS,
    FONT_WEIGHTS,
    CSS_CLASSES,
    THRESHOLDS,
    MESSAGES,
    ANIMATION,
    SELECTORS,
    FORMAT,
    VALIDATION,
    PERFORMANCE
} from './config/constants.js';

// ============================================================================
// CONVENIENCE EXPORTS - Exports de conveniência
// ============================================================================

// Export principal para uso direto
export { updateProgressCardComplete as updateProgressCard } from './ui/updater.js';
export { clearProgressCardUI as clearCard } from './ui/renderer.js';
export { validateCardData as validateCard } from './business/logic.js';

// ============================================================================
// MODULE INFO - Informações do módulo
// ============================================================================

export const MODULE_INFO = {
    name: 'Progress Card Module',
    version: '1.0.0',
    description: 'Módulo completo para gerenciamento do card de progresso',
    structure: {
        business: 'Lógica de negócio pura (sem DOM)',
        ui: 'Interface e renderização (manipulação DOM)',
        config: 'Constantes e configurações',
        utils: 'Utilitários e cache'
    },
    architecture: 'Separação clara entre lógica de negócio e UI'
};
