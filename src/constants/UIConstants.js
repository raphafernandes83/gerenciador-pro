/**
 * 🎯 CONSTANTES DA INTERFACE DO USUÁRIO
 * Centraliza valores fixos e configurações da UI
 *
 * @module UIConstants
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

/**
 * Configurações de formatação monetária
 */
export const CURRENCY_FORMAT = {
    LOCALE: 'pt-BR',
    CURRENCY: 'BRL',
    STYLE: 'currency',
    DEFAULT_VALUE: 'R$ 0,00',
    DECIMAL_PLACES: 2,

    // Opções avançadas de formatação
    OPTIONS: {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currencyDisplay: 'symbol',
    },
};

/**
 * Mensagens de erro e validação
 */
export const VALIDATION_MESSAGES = {
    INVALID_VALUE: 'Valor inválido fornecido',
    NULL_VALUE: 'Valor nulo não permitido',
    UNDEFINED_VALUE: 'Valor indefinido não permitido',
    NAN_VALUE: 'Valor não é um número válido',
    NEGATIVE_VALUE: 'Valor negativo não permitido',
    ZERO_VALUE: 'Valor zero não permitido',
};

/**
 * Classes CSS padronizadas
 */
export const CSS_CLASSES = {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    DISABLED: 'disabled',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',

    // Estados de componentes
    COMPONENT_STATES: {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error',
        DISABLED: 'disabled',
    },
};

/**
 * Identificadores de elementos DOM
 */
export const DOM_IDS = {
    DASHBOARD: {
        PERIOD_FILTERS: '#dashboard-period-filters',
        MODE_FILTERS: '#dashboard-mode-filters',
        STATS: '#dashboard-stats',
    },

    FORMS: {
        CAPITAL_INICIAL: 'capitalInicial',
        PERCENTUAL_ENTRADA: 'percentualEntrada',
        STOP_WIN_PERC: 'stopWinPerc',
        STOP_LOSS_PERC: 'stopLossPerc',
    },

    MODALS: {
        MODO_GUIADO_TOGGLE: 'modalModoGuiadoToggle',
        INCORPORAR_LUCRO_TOGGLE: 'modalIncorporarLucroToggle',
        AUTO_LOCK_TOGGLE: 'autoLockToggle',
        NOTIFICATIONS_TOGGLE: 'modalNotificationsToggle',
    },
};

/**
 * Configurações de animação e transição
 */
export const ANIMATION = {
    DURATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
        VERY_SLOW: 1000,
    },

    EASING: {
        LINEAR: 'linear',
        EASE_IN: 'ease-in',
        EASE_OUT: 'ease-out',
        EASE_IN_OUT: 'ease-in-out',
    },
};

/**
 * Configurações de responsividade
 */
export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1440,
    LARGE_DESKTOP: 1920,
};

/**
 * Configurações de tema
 */
export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
    CUSTOM: 'custom',
};

/**
 * Configurações de formato de data
 */
export const DATE_FORMAT = {
    LOCALE: 'pt-BR',
    SHORT: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    },
    LONG: {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        weekday: 'long',
    },
    TIME: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    },
};

/**
 * Limites e validações numéricas
 */
export const NUMERIC_LIMITS = {
    MIN_CAPITAL: 1,
    MAX_CAPITAL: 1000000,
    MIN_PERCENTAGE: 0.01,
    MAX_PERCENTAGE: 100,
    DECIMAL_PRECISION: 2,
};

/**
 * Configurações de notificação
 */
export const NOTIFICATION = {
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    },

    DURATION: {
        SHORT: 3000,
        NORMAL: 5000,
        LONG: 8000,
        PERSISTENT: -1,
    },
};

export default {
    CURRENCY_FORMAT,
    VALIDATION_MESSAGES,
    CSS_CLASSES,
    DOM_IDS,
    ANIMATION,
    BREAKPOINTS,
    THEME,
    DATE_FORMAT,
    NUMERIC_LIMITS,
    NOTIFICATION,
};
