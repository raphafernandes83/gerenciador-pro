/**
 * CONSTANTES DA APLICAÇÃO - GERENCIADOR PRO v9.3
 *
 * Centraliza todas as constantes utilizadas pela aplicação
 * Seguindo boas práticas: valores imutáveis e bem documentados
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

/**
 * Estratégias de trading disponíveis no sistema
 * @readonly
 * @enum {string}
 */
export const TRADING_STRATEGIES = {
    /** Estratégia de ciclos com recuperação progressiva */
    CYCLES: 'ciclos',
    /** Estratégia de entrada fixa constante */
    FIXED_AMOUNT: 'fixa',
};

/**
 * Modos de sessão de trading
 * @readonly
 * @enum {string}
 */
export const SESSION_MODES = {
    /** Sessão oficial que afeta capital real */
    OFFICIAL: 'oficial',
    /** Sessão de simulação para testes */
    SIMULATION: 'simulacao',
};

/**
 * Configurações do banco de dados IndexedDB
 * @readonly
 * @enum {string|number}
 */
export const DATABASE_CONFIG = {
    /** Nome do banco de dados */
    NAME: 'GerenciadorProDB_v9',
    /** Versão atual do banco */
    VERSION: 1,
    /** Nome da store principal */
    STORE_NAME: 'sessoes',
};

/**
 * Chaves para armazenamento no localStorage
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = {
    /** Chave para sessão ativa */
    ACTIVE_SESSION: 'gerenciadorProActiveSession',
    /** Chave para última aba visitada */
    LAST_ACTIVE_TAB: 'gerenciadorProLastActiveTab',
    /** Chave para fim do bloqueio */
    LOCKDOWN_END: 'gerenciadorProLockdownEnd',
    /** Chave para tipo de bloqueio */
    LOCKDOWN_TYPE: 'gerenciadorProLockdownType',
};

/**
 * Temas disponíveis na interface
 * @readonly
 * @enum {string}
 */
export const UI_THEMES = {
    MODERN: 'moderno',
    CLASSIC: 'classico',
    DARK: 'escuro',
    NEON: 'neon',
};

/**
 * Tipos de operação de trading
 * @readonly
 * @enum {string}
 */
export const OPERATION_TYPES = {
    WIN: 'win',
    LOSS: 'loss',
};

/**
 * Limites e validações do sistema
 * @readonly
 * @enum {number}
 */
export const SYSTEM_LIMITS = {
    /** Payout mínimo permitido (%) */
    MIN_PAYOUT: 1,
    /** Payout máximo permitido (%) */
    MAX_PAYOUT: 100,
    /** Entrada mínima permitida (%) */
    MIN_ENTRY_PERCENTAGE: 0.1,
    /** Entrada máxima permitida (%) */
    MAX_ENTRY_PERCENTAGE: 50,
    /** Número máximo de operações no histórico */
    MAX_OPERATIONS_HISTORY: 10000,
    /** Tamanho máximo de tag */
    MAX_TAG_LENGTH: 30,
};

/**
 * Períodos de filtro para análises
 * @readonly
 * @enum {string}
 */
export const FILTER_PERIODS = {
    TODAY: 'hoje',
    WEEK: '7dias',
    MONTH: '30dias',
    ALL: 'all',
};

/**
 * Dimensões de análise disponíveis
 * @readonly
 * @enum {string}
 */
export const ANALYSIS_DIMENSIONS = {
    DAY_OF_WEEK: 'dayOfWeek',
    HOUR_OF_DAY: 'hourOfDay',
    TAG: 'tag',
    PAYOUT: 'payout',
};

/**
 * Configurações padrão da aplicação
 * @readonly
 */
export const DEFAULT_CONFIG = {
    /** Capital inicial padrão */
    INITIAL_CAPITAL: 10000,
    /** Percentual de entrada padrão */
    ENTRY_PERCENTAGE: 2.0,
    /** Stop win padrão (%) */
    STOP_WIN_PERCENTAGE: 10,
    /** Stop loss padrão (%) */
    STOP_LOSS_PERCENTAGE: 15,
    /** Payout padrão (%) */
    DEFAULT_PAYOUT: 87,
    /** Divisor de recuperação padrão (%) */
    RECOVERY_DIVISOR: 35,
    /** Duração do bloqueio padrão (horas) */
    LOCKDOWN_DURATION_HOURS: 8,
};

/**
 * URLs e configurações externas
 * @readonly
 */
export const EXTERNAL_CONFIG = {
    /** URL do Supabase - definida via EnvProvider em runtime */
    SUPABASE_URL: '',
    /** Chave anônima do Supabase - definida via EnvProvider em runtime */
    SUPABASE_ANON_KEY: '',
};

/**
 * Mensagens de erro padronizadas
 * @readonly
 */
export const ERROR_MESSAGES = {
    INVALID_PAYOUT: 'Payout inválido. Por favor, insira um valor entre 1 e 100.',
    INVALID_CAPITAL: 'Capital inicial deve ser um valor positivo.',
    INVALID_PERCENTAGE: 'Percentual deve estar entre 0.1% e 50%.',
    SESSION_NOT_ACTIVE: 'Nenhuma sessão ativa encontrada.',
    DATABASE_ERROR: 'Erro ao acessar o banco de dados.',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    VALIDATION_ERROR: 'Dados inválidos fornecidos.',
};

/**
 * Configurações de performance
 * @readonly
 */
export const PERFORMANCE_CONFIG = {
    /** Delay para debounce em ms */
    DEBOUNCE_DELAY: 300,
    /** Intervalo de auto-save em ms */
    AUTO_SAVE_INTERVAL: 5000,
    /** Número de simulações Monte Carlo */
    MONTE_CARLO_SIMULATIONS: 1000,
    /** Timeout para requisições HTTP em ms */
    HTTP_TIMEOUT: 10000,
};
