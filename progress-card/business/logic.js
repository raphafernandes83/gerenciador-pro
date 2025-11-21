/**
 * 🧠 Progress Card Business Logic - Lógica de Negócio Pura
 * 
 * Este módulo contém apenas lógica de negócio pura, sem manipulação de DOM.
 * Responsável por processar dados e determinar estados, deixando a UI separada.
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
    FONT_WEIGHTS,
    CSS_CLASSES,
    THRESHOLDS,
    MESSAGES,
    FORMAT,
    VALIDATION
} from '../config/constants.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

// ============================================================================
// LÓGICA DE NEGÓCIO PURA - SEM DOM
// ============================================================================

/**
 * 🎯 Determina o estado visual do Win Rate baseado nos dados
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} winRateData - Dados de pontos percentuais do Win Rate
 * @returns {Object} Estado visual determinado
 */
export function determineWinRateVisualState(stats, winRateData) {
    const hasOperations = stats.totalOperations > 0;
    const isZero = stats.winRate === 0;
    
    // Lógica de negócio: determinar cor e estilo
    const visualState = {
        value: `${stats.winRate.toFixed(1)}%`,
        hasOperations,
        isZero,
        className: '',
        color: '',
        fontWeight: '',
        title: '',
        dataAttributes: {}
    };
    
    if (!hasOperations || isZero) {
        // Zero = CINZA
        visualState.className = `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_NEUTRAL}`;
        visualState.color = COLORS.NEUTRAL;
        visualState.fontWeight = FONT_WEIGHTS.NORMAL;
    } else {
        // Maior que zero = VERDE
        visualState.className = `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_POSITIVE}`;
        visualState.color = COLORS.SUCCESS;
        visualState.fontWeight = FONT_WEIGHTS.BOLD;
    }
    
    // Título semântico
    visualState.title = `${MESSAGES.WIN_RATE_TOOLTIP}${FORMAT.TITLE_SEPARATOR}${stats.winRate.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)}${FORMAT.PERCENTAGE_SUFFIX}${hasOperations ? `${FORMAT.TITLE_CONTEXT_OPEN}${winRateData.semanticMeaning}${FORMAT.TITLE_CONTEXT_CLOSE}` : ''}`;
    
    // Atributos de dados
    if (hasOperations && !isZero) {
        visualState.dataAttributes = {
            'data-trend': winRateData.isPositive ? 'positive' : 'negative',
            'data-magnitude': winRateData.magnitude
        };
    }
    
    return visualState;
}

/**
 * 🎯 Determina o estado visual do Loss Rate baseado nos dados
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} lossRateData - Dados de pontos percentuais do Loss Rate
 * @returns {Object} Estado visual determinado
 */
export function determineLossRateVisualState(stats, lossRateData) {
    const hasOperations = stats.totalOperations > 0;
    const isZero = stats.lossRate === 0;
    
    const visualState = {
        value: `${stats.lossRate.toFixed(1)}%`,
        hasOperations,
        isZero,
        className: '',
        color: '',
        fontWeight: '',
        title: '',
        dataAttributes: {}
    };
    
    if (!hasOperations || isZero) {
        // Zero = CINZA
        visualState.className = `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_NEUTRAL}`;
        visualState.color = COLORS.NEUTRAL;
        visualState.fontWeight = FONT_WEIGHTS.NORMAL;
    } else {
        // Maior que zero = VERMELHO (loss é negativo)
        visualState.className = `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_NEGATIVE}`;
        visualState.color = COLORS.DANGER;
        visualState.fontWeight = FONT_WEIGHTS.BOLD;
    }
    
    // Título semântico
    visualState.title = `${MESSAGES.LOSS_RATE_TOOLTIP}${FORMAT.TITLE_SEPARATOR}${stats.lossRate.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)}${FORMAT.PERCENTAGE_SUFFIX}${hasOperations ? `${FORMAT.TITLE_CONTEXT_OPEN}${lossRateData.semanticMeaning}${FORMAT.TITLE_CONTEXT_CLOSE}` : ''}`;
    
    // Atributos de dados
    if (hasOperations && !isZero) {
        visualState.dataAttributes = {
            'data-trend': lossRateData.isPositive ? 'positive' : 'negative',
            'data-magnitude': lossRateData.magnitude
        };
    }
    
    return visualState;
}

/**
 * 🎯 Determina o estado da sessão baseado nos dados
 * @param {Object} stats - Estatísticas da sessão
 * @returns {Object} Estado da sessão
 */
export function determineSessionState(stats) {
    const isActive = !!(window.state && window.state.isSessionActive);
    const count = Number(stats.totalOperations || 0);
    
    return {
        isActive,
        operationsCount: count,
        statusText: `${isActive ? MESSAGES.SESSION_ACTIVE : MESSAGES.SESSION_INACTIVE}${FORMAT.OPERATIONS_SEPARATOR}${count} ${MESSAGES.OPERATIONS_SUFFIX}`,
        className: isActive ? CSS_CLASSES.SESSION_ACTIVE : CSS_CLASSES.SESSION_INACTIVE
    };
}

/**
 * 🎯 Determina estado dos badges baseado nas estatísticas
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 * @returns {Object} Estado dos badges
 */
export function determineBadgeStates(stats, pointsPercentage) {
    // CORREÇÃO: Verifica se há operações reais antes de mostrar badges
    const hasOperations = stats.totalOperations > 0;
    
    const badges = {
        winRate: {
            show: false,
            value: '',
            className: '',
            title: ''
        },
        lossRate: {
            show: false,
            value: '',
            className: '',
            title: ''
        }
    };
    
    if (!hasOperations) {
        return badges;
    }
    
    // Badge Win Rate
    const winRateDifference = pointsPercentage.winRate?.difference || 0;
    if (Math.abs(winRateDifference) >= THRESHOLDS.BADGE_MIN_DIFFERENCE) { // Só mostra se diferença significativa
        badges.winRate.show = true;
        badges.winRate.value = `${winRateDifference > 0 ? FORMAT.POSITIVE_PREFIX : ''}${winRateDifference.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)}${FORMAT.POINTS_SUFFIX}`;
        badges.winRate.className = winRateDifference > 0 ? CSS_CLASSES.BADGE_POSITIVE : CSS_CLASSES.BADGE_NEGATIVE;
        badges.winRate.title = `${MESSAGES.DIFFERENCE_TOOLTIP}${FORMAT.TITLE_SEPARATOR}${winRateDifference.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)} ${MESSAGES.POINTS_SUFFIX}`;
    }
    
    // Badge Loss Rate
    const lossRateDifference = pointsPercentage.lossRate?.difference || 0;
    if (Math.abs(lossRateDifference) >= THRESHOLDS.BADGE_MIN_DIFFERENCE) { // Só mostra se diferença significativa
        badges.lossRate.show = true;
        badges.lossRate.value = `${lossRateDifference > 0 ? FORMAT.POSITIVE_PREFIX : ''}${lossRateDifference.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)}${FORMAT.POINTS_SUFFIX}`;
        badges.lossRate.className = lossRateDifference > 0 ? CSS_CLASSES.BADGE_NEGATIVE : CSS_CLASSES.BADGE_POSITIVE; // Invertido para loss
        badges.lossRate.title = `${MESSAGES.DIFFERENCE_TOOLTIP}${FORMAT.TITLE_SEPARATOR}${lossRateDifference.toFixed(THRESHOLDS.PERCENTAGE_DECIMAL_PLACES)} ${MESSAGES.POINTS_SUFFIX}`;
    }
    
    return badges;
}

/**
 * 🎯 Determina cores dinâmicas baseadas no desempenho
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 * @returns {Object} Esquema de cores determinado
 */
export function determineDynamicColors(stats, pointsPercentage) {
    const hasOperations = stats.totalOperations > 0;
    
    if (!hasOperations) {
        return {
            primary: COLORS.NEUTRAL,
            secondary: COLORS.SECONDARY_NEUTRAL,
            accent: COLORS.ACCENT_NEUTRAL,
            theme: CSS_CLASSES.THEME_NEUTRAL.replace('theme-', '')
        };
    }
    
    // Lógica de cores baseada no desempenho
    const winRateGood = stats.winRate >= THRESHOLDS.WIN_RATE_GOOD;
    const lossRateLow = stats.lossRate <= THRESHOLDS.LOSS_RATE_LOW;
    
    if (winRateGood && lossRateLow) {
        return {
            primary: COLORS.SUCCESS,
            secondary: COLORS.SUCCESS_LIGHT,
            accent: COLORS.SUCCESS_LIGHTER,
            theme: CSS_CLASSES.THEME_SUCCESS.replace('theme-', '')
        };
    } else if (!winRateGood && stats.lossRate > THRESHOLDS.LOSS_RATE_HIGH) {
        return {
            primary: COLORS.DANGER,
            secondary: COLORS.DANGER_LIGHT,
            accent: COLORS.DANGER_LIGHTER,
            theme: CSS_CLASSES.THEME_DANGER.replace('theme-', '')
        };
    } else {
        return {
            primary: COLORS.WARNING,
            secondary: COLORS.WARNING_LIGHT,
            accent: COLORS.WARNING_LIGHTER,
            theme: CSS_CLASSES.THEME_WARNING.replace('theme-', '')
        };
    }
}

/**
 * 🎯 Valida se os dados do card são válidos para atualização
 * @param {Object} cardData - Dados do card
 * @returns {Object} Resultado da validação
 */
export function validateCardData(cardData) {
    const validation = {
        isValid: false,
        hasActiveSession: false,
        hasOperations: false,
        shouldClear: false,
        reason: ''
    };
    
    // Verifica se cardData existe e é válido
    if (!cardData || !cardData.isValid) {
        validation.shouldClear = true;
        validation.reason = VALIDATION.REASON_INVALID_DATA;
        return validation;
    }
    
    // Verifica sessão ativa
    validation.hasActiveSession = window.state?.isSessionActive || false;
    validation.hasOperations = cardData?.stats?.totalOperations > 0;
    
    if (!validation.hasActiveSession) {
        validation.shouldClear = true;
        validation.reason = VALIDATION.REASON_INACTIVE_SESSION;
        return validation;
    }
    
    validation.isValid = true;
    validation.reason = VALIDATION.REASON_VALID;
    return validation;
}

// ============================================================================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ============================================================================

if (typeof window !== 'undefined') {
    window.determineWinRateVisualState = determineWinRateVisualState;
    window.determineLossRateVisualState = determineLossRateVisualState;
    window.determineSessionState = determineSessionState;
    window.determineBadgeStates = determineBadgeStates;
    window.determineDynamicColors = determineDynamicColors;
    window.validateCardData = validateCardData;
    
    logger.debug('🧠 Progress Card Business Logic disponível globalmente');
}
