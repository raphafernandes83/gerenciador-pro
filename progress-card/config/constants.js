/**
 * 🎯 Progress Card Constants - Constantes Centralizadas
 * 
 * Este módulo centraliza todas as constantes, configurações e valores
 * utilizados no sistema de card de progresso, facilitando manutenção.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// CORES DO SISTEMA
// ============================================================================

export const COLORS = {
    // Cores principais
    NEUTRAL: '#6b7280',
    SUCCESS: '#059669',
    DANGER: '#dc2626',
    WARNING: '#d97706',
    
    // Variações de sucesso
    SUCCESS_LIGHT: '#10b981',
    SUCCESS_LIGHTER: '#34d399',
    
    // Variações de perigo
    DANGER_LIGHT: '#ef4444',
    DANGER_LIGHTER: '#f87171',
    
    // Variações de aviso
    WARNING_LIGHT: '#f59e0b',
    WARNING_LIGHTER: '#fbbf24',
    
    // Cores secundárias
    SECONDARY_NEUTRAL: '#9ca3af',
    ACCENT_NEUTRAL: '#d1d5db'
};

// ============================================================================
// ESTILOS E PESOS DE FONTE
// ============================================================================

export const FONT_WEIGHTS = {
    NORMAL: '500',
    BOLD: '600',
    LIGHT: '400'
};

export const CSS_CLASSES = {
    // Classes de métricas
    METRIC_VALUE: 'metric-value',
    TEXT_NEUTRAL: 'text-neutral',
    TEXT_POSITIVE: 'text-positive',
    TEXT_NEGATIVE: 'text-negative',
    
    // Classes de badges
    BADGE: 'badge',
    BADGE_POSITIVE: 'badge-positive',
    BADGE_NEGATIVE: 'badge-negative',
    
    // Classes de sessão
    SESSION_ACTIVE: 'session-active',
    SESSION_INACTIVE: 'session-inactive',
    
    // Classes de temas
    THEME_NEUTRAL: 'theme-neutral',
    THEME_SUCCESS: 'theme-success',
    THEME_DANGER: 'theme-danger',
    THEME_WARNING: 'theme-warning'
};

// ============================================================================
// LIMITES E THRESHOLDS
// ============================================================================

export const THRESHOLDS = {
    // Performance thresholds
    WIN_RATE_GOOD: 60,        // Win rate considerado bom (%)
    LOSS_RATE_LOW: 30,        // Loss rate considerado baixo (%)
    LOSS_RATE_HIGH: 50,       // Loss rate considerado alto (%)
    
    // Badge thresholds
    BADGE_MIN_DIFFERENCE: 0.1, // Diferença mínima para mostrar badge (pontos percentuais)
    
    // Precisão de exibição
    PERCENTAGE_DECIMAL_PLACES: 1,
    
    // Limites de progresso
    PROGRESS_MAX: 100,        // Progresso máximo (%)
    PROGRESS_MIN: 0           // Progresso mínimo (%)
};

// ============================================================================
// TEXTOS E MENSAGENS
// ============================================================================

export const MESSAGES = {
    // Status da sessão
    SESSION_ACTIVE: 'Sessão Ativa',
    SESSION_INACTIVE: 'Sessão Inativa',
    
    // Operações
    OPERATIONS_SUFFIX: 'ops',
    
    // Valores padrão
    DEFAULT_PERCENTAGE: '0.0%',
    DEFAULT_OPERATIONS: '0 ops',
    
    // Tooltips
    WIN_RATE_TOOLTIP: 'Win Rate',
    LOSS_RATE_TOOLTIP: 'Loss Rate',
    DIFFERENCE_TOOLTIP: 'Diferença',
    POINTS_SUFFIX: 'pontos percentuais',
    
    // Logs
    LOG_CARD_UPDATE_START: '🔄 Iniciando atualização completa do card de progresso',
    LOG_CARD_UPDATE_SUCCESS: '✅ Card de progresso atualizado com sucesso (nova arquitetura)',
    LOG_CARD_CLEAR_START: '🧹 Limpando card de progresso para estado inicial (nova arquitetura)',
    LOG_CARD_CLEAR_SUCCESS: '✅ Card de progresso limpo (nova arquitetura)',
    LOG_PERCENTAGES_SUCCESS: '📈 Elementos de percentual atualizados (nova arquitetura)',
    LOG_SESSION_SUCCESS: 'ℹ️ Informações da sessão atualizadas (nova arquitetura)',
    LOG_COLORS_SUCCESS: '🎨 Cores dinâmicas aplicadas (nova arquitetura)',
    
    // Warnings
    WARN_INVALID_DATA: 'Dados do card inválidos',
    WARN_INACTIVE_SESSION: 'Sessão inativa',
    WARN_CHART_NOT_FOUND: '⚠️ Instância do gráfico não encontrada',
    
    // Errors
    ERROR_CARD_UPDATE: '❌ Erro ao atualizar card de progresso',
    ERROR_CHART_UPDATE: '❌ Erro ao atualizar gráfico',
    ERROR_PERCENTAGES_UPDATE: '❌ Erro ao atualizar percentuais',
    ERROR_SESSION_UPDATE: '❌ Erro ao atualizar informações da sessão',
    ERROR_COLORS_UPDATE: '❌ Erro ao aplicar cores dinâmicas',
    ERROR_CARD_CLEAR: '❌ Erro ao limpar card',
    ERROR_UI_CLEAR: '❌ Erro ao limpar UI do card'
};

// ============================================================================
// CONFIGURAÇÕES DE ANIMAÇÃO
// ============================================================================

export const ANIMATION = {
    // Tipos de atualização do Chart.js
    CHART_UPDATE_NONE: 'none',
    CHART_UPDATE_SMOOTH: 'smooth',
    
    // Durações (em ms)
    FAST_DURATION: 200,
    NORMAL_DURATION: 300,
    SLOW_DURATION: 500,
    
    // Delays
    BADGE_DELAY_BASE: 100,    // Delay base para badges (ms)
    
    // Easing
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease-out'
};

// ============================================================================
// SELETORES DOM
// ============================================================================

export const SELECTORS = {
    // Elementos principais
    PROGRESS_CARD: '.progress-card',
    PREVIEW_METRICS: '.preview-metrics #meta-current-percent',
    
    // Badges
    WIN_RATE_BADGE: '#win-rate-badge',
    LOSS_RATE_BADGE: '#loss-rate-badge',
    BADGE_ALL: '.badge',
    
    // Variáveis CSS customizadas
    CSS_VAR_PRIMARY: '--primary-color',
    CSS_VAR_SECONDARY: '--secondary-color',
    CSS_VAR_ACCENT: '--accent-color'
};

// ============================================================================
// CONFIGURAÇÕES DE FORMATAÇÃO
// ============================================================================

export const FORMAT = {
    // Formatação de percentuais
    PERCENTAGE_SUFFIX: '%',
    POINTS_SUFFIX: 'pp',
    POSITIVE_PREFIX: '+',
    
    // Formatação de operações
    OPERATIONS_SEPARATOR: ' · ',
    
    // Formatação de títulos
    TITLE_SEPARATOR: ': ',
    TITLE_CONTEXT_OPEN: ' (',
    TITLE_CONTEXT_CLOSE: ')'
};

// ============================================================================
// CONFIGURAÇÕES DE VALIDAÇÃO
// ============================================================================

export const VALIDATION = {
    // Razões de invalidação
    REASON_INVALID_DATA: 'Dados do card inválidos',
    REASON_INACTIVE_SESSION: 'Sessão inativa',
    REASON_VALID: 'Dados válidos para atualização'
};

// ============================================================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================================================

export const PERFORMANCE = {
    // Configurações de Chart.js
    CHART_DATA_EMPTY: [0, 0],
    
    // Configurações de monetário
    MONETARY_CONFIG: {
        animate: true,
        showTrends: true,
        compactMode: false
    }
};

// ============================================================================
// EXPOSIÇÃO GLOBAL (OPCIONAL)
// ============================================================================

if (typeof window !== 'undefined') {
    window.PROGRESS_CARD_CONSTANTS = {
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
    };
}
