/**
 * ⚡ Optimized Renderer - Renderizador Otimizado
 * 
 * Versão otimizada do renderer que usa memoização, debouncing e
 * comparação de estados para evitar re-renders desnecessários.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Performance optimization
import {
    memoize,
    debounce,
    detectChanges,
    updateElementIfChanged,
    queueUpdate,
    measurePerformance
} from '../utils/performance-optimizer.js';

// Original renderer (fallback)
import {
    renderWinRateVisualState as originalRenderWinRate,
    renderLossRateVisualState as originalRenderLossRate,
    renderSessionInfo as originalRenderSessionInfo,
    renderBadges as originalRenderBadges,
    renderDynamicColors as originalRenderDynamicColors
} from './renderer.js';

// Core modules
import { dom } from '../../dom.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

// ============================================================================
// ESTADO ANTERIOR PARA COMPARAÇÃO
// ============================================================================

let previousCardData = null;
let previousRenderTimestamp = 0;

// ============================================================================
// RENDERIZADORES OTIMIZADOS
// ============================================================================

/**
 * ⚡ Renderiza Win Rate com otimização de performance
 * @param {Object} visualState - Estado visual determinado
 */
export const renderWinRateOptimized = memoize(
    function renderWinRateOptimized(visualState) {
        return measurePerformance(() => {
            const elementKey = 'win-rate-value';
            const element = dom.winCurrentValue;
            
            if (!element) return false;
            
            const newState = {
                textContent: visualState.value,
                className: visualState.className,
                attributes: {
                    title: visualState.title,
                    ...visualState.dataAttributes
                }
            };
            
            const updated = updateElementIfChanged(element, newState, elementKey);
            
            if (!updated) {
                logger.debug('⚡ Win Rate render skipped (no changes)');
                return false;
            }
            
            // Atualiza preview se necessário
            const previewElement = document.querySelector('.preview-metrics #meta-current-percent');
            if (previewElement && (!visualState.hasOperations || visualState.isZero)) {
                updateElementIfChanged(previewElement, {
                    textContent: visualState.value,
                    className: 'metric-value text-neutral'
                }, 'win-rate-preview');
            }
            
            return true;
        }, 'renderWinRate');
    },
    // Key generator para memoização
    (visualState) => `winRate_${visualState.value}_${visualState.className}_${visualState.hasOperations}`
);

/**
 * ⚡ Renderiza Loss Rate com otimização de performance
 * @param {Object} visualState - Estado visual determinado
 */
export const renderLossRateOptimized = memoize(
    function renderLossRateOptimized(visualState) {
        return measurePerformance(() => {
            const elementKey = 'loss-rate-value';
            const element = dom.lossCurrentValue;
            
            if (!element) return false;
            
            const newState = {
                textContent: visualState.value,
                className: visualState.className,
                attributes: {
                    title: visualState.title,
                    ...visualState.dataAttributes
                }
            };
            
            return updateElementIfChanged(element, newState, elementKey);
        }, 'renderLossRate');
    },
    (visualState) => `lossRate_${visualState.value}_${visualState.className}_${visualState.hasOperations}`
);

/**
 * ⚡ Renderiza informações da sessão com otimização
 * @param {Object} sessionState - Estado da sessão
 */
export const renderSessionInfoOptimized = memoize(
    function renderSessionInfoOptimized(sessionState) {
        return measurePerformance(() => {
            const elementKey = 'session-info';
            const element = dom.progressSessionInfo;
            
            if (!element) return false;
            
            const newState = {
                textContent: sessionState.statusText,
                className: sessionState.className
            };
            
            return updateElementIfChanged(element, newState, elementKey);
        }, 'renderSessionInfo');
    },
    (sessionState) => `session_${sessionState.isActive}_${sessionState.operationsCount}`
);

/**
 * ⚡ Renderiza badges com otimização de performance
 * @param {Object} badgeStates - Estados dos badges
 */
export const renderBadgesOptimized = debounce(
    function renderBadgesOptimized(badgeStates) {
        return measurePerformance(() => {
            let updatedCount = 0;
            
            // Badge Win Rate
            const winBadge = document.querySelector('#win-rate-badge');
            if (winBadge) {
                const winState = {
                    textContent: badgeStates.winRate.show ? badgeStates.winRate.value : '',
                    className: badgeStates.winRate.show ? 
                        `badge ${badgeStates.winRate.className} show` : 'badge',
                    style: {
                        display: badgeStates.winRate.show ? 'inline-flex' : 'none'
                    },
                    attributes: badgeStates.winRate.show ? {
                        title: badgeStates.winRate.title
                    } : {}
                };
                
                if (updateElementIfChanged(winBadge, winState, 'win-rate-badge')) {
                    updatedCount++;
                }
            }
            
            // Badge Loss Rate
            const lossBadge = document.querySelector('#loss-rate-badge');
            if (lossBadge) {
                const lossState = {
                    textContent: badgeStates.lossRate.show ? badgeStates.lossRate.value : '',
                    className: badgeStates.lossRate.show ? 
                        `badge ${badgeStates.lossRate.className} show` : 'badge',
                    style: {
                        display: badgeStates.lossRate.show ? 'inline-flex' : 'none'
                    },
                    attributes: badgeStates.lossRate.show ? {
                        title: badgeStates.lossRate.title
                    } : {}
                };
                
                if (updateElementIfChanged(lossBadge, lossState, 'loss-rate-badge')) {
                    updatedCount++;
                }
            }
            
            logger.debug('⚡ Badges updated:', { count: updatedCount });
            return updatedCount > 0;
        }, 'renderBadges');
    },
    50, // 50ms debounce
    'badges-render'
);

/**
 * ⚡ Renderiza cores dinâmicas com otimização
 * @param {Object} colorScheme - Esquema de cores
 */
export const renderDynamicColorsOptimized = memoize(
    function renderDynamicColorsOptimized(colorScheme) {
        return measurePerformance(() => {
            const cardElement = document.querySelector('.progress-card');
            if (!cardElement) return false;
            
            const newState = {
                className: cardElement.className.replace(/theme-\w+/g, '') + ` theme-${colorScheme.theme}`,
                style: {
                    '--primary-color': colorScheme.primary,
                    '--secondary-color': colorScheme.secondary,
                    '--accent-color': colorScheme.accent
                }
            };
            
            return updateElementIfChanged(cardElement, newState, 'progress-card-theme');
        }, 'renderDynamicColors');
    },
    (colorScheme) => `theme_${colorScheme.theme}_${colorScheme.primary}`
);

// ============================================================================
// RENDERIZADOR PRINCIPAL OTIMIZADO
// ============================================================================

/**
 * ⚡ Renderiza elementos de percentual com otimização completa
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 */
export function renderPercentageElementsOptimized(stats, pointsPercentage) {
    return measurePerformance(() => {
        // Detecta mudanças nos dados
        const currentData = { stats, pointsPercentage };
        const changes = detectChanges(currentData, previousCardData);
        
        if (!changes.hasChanges) {
            logger.debug('⚡ Render skipped (no data changes)');
            return false;
        }
        
        logger.debug('⚡ Rendering with changes:', changes.changedFields);
        
        // Usa sistema de filas para otimizar atualizações
        const renderOperations = [];
        
        // Win Rate (alta prioridade se mudou)
        if (changes.changedFields.includes('stats.winRate') || changes.reason === 'first_render') {
            renderOperations.push({
                fn: () => {
                    const winRateState = window.determineWinRateVisualState?.(stats, pointsPercentage.winRate || {});
                    if (winRateState) {
                        renderWinRateOptimized(winRateState);
                    }
                },
                priority: 'high'
            });
        }
        
        // Loss Rate (alta prioridade se mudou)
        if (changes.changedFields.includes('stats.lossRate') || changes.reason === 'first_render') {
            renderOperations.push({
                fn: () => {
                    const lossRateState = window.determineLossRateVisualState?.(stats, pointsPercentage.lossRate || {});
                    if (lossRateState) {
                        renderLossRateOptimized(lossRateState);
                    }
                },
                priority: 'high'
            });
        }
        
        // Badges (prioridade normal)
        if (changes.changedFields.some(field => field.includes('Rate')) || changes.reason === 'first_render') {
            renderOperations.push({
                fn: () => {
                    const badgeStates = window.determineBadgeStates?.(stats, pointsPercentage);
                    if (badgeStates) {
                        renderBadgesOptimized(badgeStates);
                    }
                },
                priority: 'normal'
            });
        }
        
        // Executa operações na fila
        renderOperations.forEach(operation => {
            queueUpdate(operation.fn, operation.priority);
        });
        
        // Atualiza dados anteriores
        previousCardData = { ...currentData };
        previousRenderTimestamp = Date.now();
        
        return true;
    }, 'renderPercentageElementsOptimized');
}

/**
 * ⚡ Atualização completa do card com otimização máxima
 * @param {Object} cardData - Dados do card
 * @param {Object} chartInstance - Instância do Chart.js
 */
export function updateProgressCardOptimized(cardData, chartInstance = null) {
    return measurePerformance(() => {
        // Throttling: evita atualizações muito frequentes
        const now = Date.now();
        const timeSinceLastRender = now - previousRenderTimestamp;
        
        if (timeSinceLastRender < 16) { // 60fps limit
            logger.debug('⚡ Update throttled (too frequent)');
            return false;
        }
        
        // Validação otimizada
        if (!cardData?.isValid) {
            logger.debug('⚡ Invalid data, clearing card');
            // Usa fila para limpeza
            queueUpdate(() => {
                window.clearProgressCardUI?.();
            }, 'high');
            return false;
        }
        
        const { stats, monetary, pointsPercentage } = cardData;
        
        // Detecta mudanças globais
        const changes = detectChanges(cardData, previousCardData);
        
        if (!changes.hasChanges) {
            logger.debug('⚡ Complete update skipped (no changes)');
            return false;
        }
        
        // Agenda atualizações por prioridade
        
        // 1. Gráfico (prioridade alta se operações mudaram)
        if (changes.changedFields.includes('stats.totalOperations') || changes.reason === 'first_render') {
            queueUpdate(() => {
                window.updateProgressChart?.(stats, chartInstance);
            }, 'high');
        }
        
        // 2. Percentuais (prioridade alta)
        queueUpdate(() => {
            renderPercentageElementsOptimized(stats, pointsPercentage);
        }, 'high');
        
        // 3. Monetário (prioridade normal se mudou)
        if (changes.changedFields.some(field => field.includes('monetary')) || changes.reason === 'first_render') {
            queueUpdate(() => {
                const performance = window.calculateMonetaryPerformance?.(monetary, cardData.previousMonetary);
                window.updateMonetaryElementsAdvanced?.(monetary, performance, {
                    animate: true,
                    showTrends: true,
                    compactMode: false
                });
            }, 'normal');
        }
        
        // 4. Sessão (prioridade baixa)
        if (changes.changedFields.includes('stats.totalOperations') || changes.reason === 'first_render') {
            queueUpdate(() => {
                const sessionState = window.determineSessionState?.(stats);
                if (sessionState) {
                    renderSessionInfoOptimized(sessionState);
                }
            }, 'low');
        }
        
        // 5. Cores dinâmicas (prioridade baixa)
        queueUpdate(() => {
            const colorScheme = window.determineDynamicColors?.(stats, pointsPercentage);
            if (colorScheme) {
                renderDynamicColorsOptimized(colorScheme);
            }
        }, 'low');
        
        logger.debug('⚡ Optimized update queued:', {
            changes: changes.changedFields,
            reason: changes.reason
        });
        
        return true;
    }, 'updateProgressCardOptimized');
}

// ============================================================================
// UTILITÁRIOS DE FALLBACK
// ============================================================================

/**
 * 🔄 Fallback para renderização original se otimizada falhar
 * @param {Function} optimizedFn - Função otimizada
 * @param {Function} originalFn - Função original
 * @param {...any} args - Argumentos
 */
export function renderWithFallback(optimizedFn, originalFn, ...args) {
    try {
        return optimizedFn(...args);
    } catch (error) {
        logger.warn('⚠️ Optimized render failed, using fallback:', { error: String(error) });
        return originalFn(...args);
    }
}

// ============================================================================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderPercentageElementsOptimized = renderPercentageElementsOptimized;
    window.updateProgressCardOptimized = updateProgressCardOptimized;
    window.renderWithFallback = renderWithFallback;
    
    logger.debug('⚡ Optimized Renderer disponível globalmente');
}




