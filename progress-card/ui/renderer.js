/**
 * 🎨 Progress Card UI Renderer - Renderização de Interface
 * 
 * Este módulo é responsável apenas pela manipulação de DOM e renderização visual.
 * Recebe estados determinados pela lógica de negócio e aplica na interface.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Constants
import {
    COLORS,
    CSS_CLASSES,
    MESSAGES,
    SELECTORS
} from '../config/constants.js';

// CSS Management
import {
    applyVisualState,
    manageBadgeDisplay,
    applyTheme,
    resetStyles
} from './css-manager.js';

// Core modules
import { dom } from '../../dom.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

// ============================================================================
// RENDERIZAÇÃO DE UI - APENAS DOM
// ============================================================================

/**
 * 🎨 Renderiza o estado visual do Win Rate no DOM
 * @param {Object} visualState - Estado visual determinado pela lógica de negócio
 */
export function renderWinRateVisualState(visualState) {
    if (!dom.winCurrentValue) return;
    
    // Aplica valor
    dom.winCurrentValue.textContent = visualState.value;
    
    // Usa CSS Manager em vez de estilos inline
    applyVisualState(dom.winCurrentValue, visualState);
    
    // Atualiza também o elemento do preview se existir
    const previewElement = document.querySelector(SELECTORS.PREVIEW_METRICS);
    if (previewElement) {
        previewElement.textContent = visualState.value;
        if (!visualState.hasOperations || visualState.isZero) {
            const neutralState = {
                className: `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_NEUTRAL}`,
                color: COLORS.NEUTRAL,
                fontWeight: '400',
                dataAttributes: {}
            };
            applyVisualState(previewElement, neutralState);
        }
    }
}

/**
 * 🎨 Renderiza o estado visual do Loss Rate no DOM
 * @param {Object} visualState - Estado visual determinado pela lógica de negócio
 */
export function renderLossRateVisualState(visualState) {
    if (!dom.lossCurrentValue) return;
    
    // Aplica valor
    dom.lossCurrentValue.textContent = visualState.value;
    
    // Usa CSS Manager em vez de estilos inline
    applyVisualState(dom.lossCurrentValue, visualState);
}

/**
 * 🎨 Renderiza informações da sessão no DOM
 * @param {Object} sessionState - Estado da sessão determinado pela lógica de negócio
 */
export function renderSessionInfo(sessionState) {
    if (!dom.progressSessionInfo) return;
    
    dom.progressSessionInfo.textContent = sessionState.statusText;
    dom.progressSessionInfo.className = sessionState.className;
}

/**
 * 🎨 Renderiza badges no DOM
 * @param {Object} badgeStates - Estados dos badges determinados pela lógica de negócio
 */
export function renderBadges(badgeStates) {
    // Badge Win Rate
    const winBadge = document.querySelector(SELECTORS.WIN_RATE_BADGE);
    if (winBadge) {
        manageBadgeDisplay(winBadge, badgeStates.winRate);
    }
    
    // Badge Loss Rate
    const lossBadge = document.querySelector(SELECTORS.LOSS_RATE_BADGE);
    if (lossBadge) {
        manageBadgeDisplay(lossBadge, badgeStates.lossRate);
    }
}

/**
 * 🎨 Aplica esquema de cores dinâmicas no DOM
 * @param {Object} colorScheme - Esquema de cores determinado pela lógica de negócio
 */
export function renderDynamicColors(colorScheme) {
    // Usa CSS Manager para aplicar tema
    applyTheme(colorScheme);
}

/**
 * 🎨 Limpa completamente o card de progresso
 */
export function clearProgressCardUI() {
    try {
        // Limpa valores principais
        if (dom.winCurrentValue) {
            dom.winCurrentValue.textContent = MESSAGES.DEFAULT_PERCENTAGE;
        }
        
        if (dom.lossCurrentValue) {
            dom.lossCurrentValue.textContent = MESSAGES.DEFAULT_PERCENTAGE;
        }
        
        // Limpa informações da sessão
        if (dom.progressSessionInfo) {
            dom.progressSessionInfo.textContent = `${MESSAGES.SESSION_INACTIVE} · ${MESSAGES.DEFAULT_OPERATIONS}`;
            dom.progressSessionInfo.className = CSS_CLASSES.SESSION_INACTIVE;
        }
        
        // Usa CSS Manager para reset completo
        resetStyles();
        
        logger.debug('🧹 UI do card de progresso limpa com sucesso (CSS Manager)');
        
    } catch (error) {
        logger.error(MESSAGES.ERROR_UI_CLEAR, { error: String(error) });
    }
}

/**
 * 🎨 Renderiza elementos de percentual com base nos dados calculados
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 */
export function renderPercentageElements(stats, pointsPercentage) {
    // Win Rate
    const winRateState = window.determineWinRateVisualState?.(stats, pointsPercentage.winRate || {});
    if (winRateState) {
        renderWinRateVisualState(winRateState);
    }
    
    // Loss Rate
    const lossRateState = window.determineLossRateVisualState?.(stats, pointsPercentage.lossRate || {});
    if (lossRateState) {
        renderLossRateVisualState(lossRateState);
    }
    
    // Badges
    const badgeStates = window.determineBadgeStates?.(stats, pointsPercentage);
    if (badgeStates) {
        renderBadges(badgeStates);
    }
}

// ============================================================================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderWinRateVisualState = renderWinRateVisualState;
    window.renderLossRateVisualState = renderLossRateVisualState;
    window.renderSessionInfo = renderSessionInfo;
    window.renderBadges = renderBadges;
    window.renderDynamicColors = renderDynamicColors;
    window.clearProgressCardUI = clearProgressCardUI;
    window.renderPercentageElements = renderPercentageElements;
    
    logger.debug('🎨 Progress Card UI Renderer disponível globalmente');
}
