/**
 * 🔧 CONSTANTES DE SISTEMA - GERENCIADOR PRO v9.3
 * Responsabilidade única: Centralizar todos os valores de configuração do sistema
 *
 * Elimina magic numbers e hardcoded values
 * Facilita manutenção e configuração
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 */

/**
 * 🔗 Configurações de conexão Supabase
 * @readonly
 */
// 🛡️ Função segura para detectar ambiente de produção
const getEnvironment = () => {
    try {
        // Tentar acessar process.env de forma segura
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }

        // Fallback para detecção baseada em window/document
        if (typeof window !== 'undefined') {
            // Produção se não for localhost
            const isLocalhost =
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '0.0.0.0';
            return isLocalhost ? 'development' : 'production';
        }

        // Último fallback
        return 'development';
    } catch (error) {
        console.warn('⚠️ Erro ao detectar ambiente:', error.message);
        return 'development'; // Safer default
    }
};

const CURRENT_ENV = getEnvironment();
const IS_PRODUCTION = CURRENT_ENV === 'production';
const IS_DEVELOPMENT = CURRENT_ENV === 'development';

export const SUPABASE_CONFIG = {
    /** URL principal do Supabase - Configurado via EnvProvider */
    URL: IS_PRODUCTION ? '' : 'http://localhost:54321',
    /** Chave pública anônima - Configurado via EnvProvider */
    ANON_KEY: IS_PRODUCTION
        ? ''
        : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    /** Máximo de tentativas de reconexão */
    MAX_RETRY_ATTEMPTS: 3,
    /** Delay entre tentativas (ms) */
    RETRY_DELAY: 1000,
    /** Timeout para conexão inicial (ms) */
    CONNECTION_TIMEOUT: 5000,
    /** Flag para modo desenvolvimento */
    DEVELOPMENT_MODE: IS_DEVELOPMENT,
    /** Configuração offline-first */
    ENABLE_OFFLINE_MODE: true,
    /** Ambiente atual detectado */
    CURRENT_ENVIRONMENT: CURRENT_ENV,
    /** Mensagens padronizadas para logs */
    MESSAGES: {
        INIT_SUCCESS: '✅ Supabase inicializado com sucesso',
        INIT_FAILED: '❌ Falha na inicialização do Supabase',
        OFFLINE_MODE: '🎮 Modo offline ativado',
        CONFIG_MISSING: '⚠️ Configuração ausente',
    },
};

/**
 * ⏱️ Timeouts e delays do sistema
 * @readonly
 */
export const TIMING_CONFIG = {
    /** Inicialização */
    INITIALIZATION: {
        /** Delay para inicialização da sidebar */
        SIDEBAR_INIT_DELAY: 100,
        /** Timeout para sincronização da UI */
        UI_SYNC_TIMEOUT: 2000,
        /** Timeout para carregamento de módulos */
        MODULE_LOAD_TIMEOUT: 5000,
        /** Timeout para error handler */
        ERROR_HANDLER_TIMEOUT: 2000,
    },

    /** Performance e Monitoramento */
    PERFORMANCE: {
        /** Intervalo de relatórios (ms) */
        REPORT_INTERVAL: 120000, // 2 minutos
        /** Delay para debounce de UI (ms) */
        UI_DEBOUNCE_DELAY: 300,
        /** Delay para debounce de salvamento (ms) */
        SAVE_DEBOUNCE_DELAY: 1000,
        /** Yielding delay para processamento (ms) */
        PROCESSING_YIELD_DELAY: 1,
    },

    /** Interface do Usuário */
    UI: {
        /** Duração de notificações (ms) */
        NOTIFICATION_DURATION: 4000,
        /** Delay para feedback visual (ms) */
        VISUAL_FEEDBACK_DELAY: 800,
        /** Duração de ripple effects (ms) */
        RIPPLE_DURATION: 600,
        /** Delay para aplicação automática (ms) */
        AUTO_APPLY_DELAY: 800,
    },

    /** Efeitos e Animações */
    ANIMATIONS: {
        /** Duração padrão de transições (ms) */
        DEFAULT_TRANSITION: 300,
        /** Delay antes de remover elementos (ms) */
        CLEANUP_DELAY: 2100,
        /** Timeout para loading states (ms) */
        LOADING_TIMEOUT: 10000,
    },
};

/**
 * 💰 Formatação de Moeda
 * @readonly
 */
export const CURRENCY_FORMAT = {
    LOCALE: 'pt-BR',
    OPTIONS: {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
};

/**
 * 📊 Thresholds de performance
 * @readonly
 */
export const PERFORMANCE_THRESHOLDS = {
    /** Alertas de performance */
    ALERTS: {
        /** Função lenta (ms) */
        SLOW_FUNCTION: 500,
        /** Alto uso de memória (MB) */
        HIGH_MEMORY_USAGE: 200,
        /** Operações DOM por segundo */
        DOM_OPERATIONS_PER_SECOND: 25,
    },

    /** Limites de sistema */
    LIMITS: {
        /** Máximo de erros em sequência */
        MAX_SEQUENTIAL_ERRORS: 10,
        /** Máximo de tentativas de retry */
        MAX_RETRY_ATTEMPTS: 3,
        /** Máximo de items no cache */
        MAX_CACHE_SIZE: 100,
        /** TTL padrão do cache (ms) */
        DEFAULT_CACHE_TTL: 300000, // 5 minutos
    },
};

/**
 * 🗄️ Configurações de banco de dados
 * @readonly
 */
export const DATABASE_CONFIG = {
    /** Nome do banco IndexedDB */
    DB_NAME: 'GerenciadorProDB_v9',
    /** Versão do banco */
    DB_VERSION: 1,
    /** Nome da store principal */
    STORE_NAME: 'sessoes',
    /** Chunksize para processamento em lotes */
    PROCESSING_CHUNK_SIZE: 10,
    /** Máximo de sessões por query */
    MAX_SESSIONS_PER_QUERY: 1000,
};

/**
 * 🎨 Configurações de interface
 * @readonly
 */
export const UI_CONFIG = {
    /** Breakpoints responsivos */
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1200,
    },

    /** Z-index layers */
    Z_INDEX: {
        MODAL: 1000,
        DROPDOWN: 100,
        TOOLTIP: 200,
        NOTIFICATION: 1100,
    },

    /** Tamanhos padrão */
    SIZES: {
        CHART_HEIGHT: 220,
        SIDEBAR_WIDTH: 350,
        BUTTON_HEIGHT: 40,
        INPUT_HEIGHT: 36,
    },
};

/**
 * 🔐 Configurações de segurança
 * @readonly
 */
export const SECURITY_CONFIG = {
    /** Anti-recursão */
    RECURSION: {
        /** Profundidade máxima de recursão */
        MAX_DEPTH: 3,
        /** Máximo de chamadas por método */
        MAX_CALLS_PER_METHOD: 5,
    },

    /** Rate limiting */
    RATE_LIMITING: {
        /** Máximo de operações por minuto */
        MAX_OPERATIONS_PER_MINUTE: 100,
        /** Delay entre operações críticas (ms) */
        CRITICAL_OPERATION_DELAY: 100,
    },
};

/**
 * 🧪 Configurações de teste
 * @readonly
 */
export const TEST_CONFIG = {
    /** Timeouts para testes */
    TIMEOUTS: {
        /** Teste unitário (ms) */
        UNIT_TEST: 5000,
        /** Teste de integração (ms) */
        INTEGRATION_TEST: 10000,
        /** Teste end-to-end (ms) */
        E2E_TEST: 30000,
    },

    /** Dados de teste */
    MOCK_DATA: {
        /** Capital inicial para testes */
        INITIAL_CAPITAL: 10000,
        /** Percentual de entrada para testes */
        ENTRY_PERCENTAGE: 2.0,
        /** Payout padrão para testes */
        DEFAULT_PAYOUT: 87,
    },
};

/**
 * 📋 Chaves de localStorage
 * @readonly
 */
export const STORAGE_KEYS = {
    /** Sessão ativa */
    ACTIVE_SESSION: 'gerenciadorProActiveSession',
    /** Última aba ativa */
    LAST_ACTIVE_TAB: 'gerenciadorProLastActiveTab',
    /** Configurações do usuário */
    USER_CONFIG: 'gerenciadorProUserConfig',
    /** Cache de dados */
    DATA_CACHE: 'gerenciadorProDataCache',
    /** Bloqueio do sistema */
    LOCKDOWN_END: 'gerenciadorProLockdownEnd',
    /** Tipo de bloqueio */
    LOCKDOWN_TYPE: 'gerenciadorProLockdownType',
};

/**
 * 🎯 Mensagens do sistema
 * @readonly
 */
export const SYSTEM_MESSAGES = {
    /** Sucesso */
    SUCCESS: {
        INITIALIZATION: 'Aplicação inicializada com sucesso!',
        SUPABASE_CONNECTED: 'Supabase conectado e pronto para uso!',
        MODULE_LOADED: 'Módulo carregado com sucesso!',
        CONFIG_SAVED: 'Configurações salvas com sucesso!',
    },

    /** Avisos */
    WARNING: {
        SUPABASE_FAILED:
            'Falha na conexão com Supabase. A aplicação continuará sem funcionalidades de sincronização.',
        MODULE_PARTIAL: 'Alguns módulos não carregaram completamente.',
        PERFORMANCE_SLOW: 'Performance degradada detectada.',
    },

    /** Erros */
    ERROR: {
        INITIALIZATION_FAILED: 'Erro ao inicializar o aplicativo.',
        MODULE_LOAD_FAILED: 'Falha ao carregar módulo essencial.',
        RECURSION_DETECTED: 'Recursão infinita detectada - operação abortada.',
        MEMORY_LIMIT: 'Limite de memória atingido.',
    },
};

/**
 * 🔄 Configuração de retry/resilience
 * @readonly
 */
export const RESILIENCE_CONFIG = {
    /** Estratégias de retry */
    RETRY: {
        /** Delay base para exponential backoff (ms) */
        BASE_DELAY: 1000,
        /** Multiplicador para backoff */
        BACKOFF_MULTIPLIER: 2,
        /** Máximo delay entre tentativas (ms) */
        MAX_DELAY: 10000,
        /** Jitter para evitar thundering herd */
        JITTER_ENABLED: true,
    },

    /** Circuit breaker */
    CIRCUIT_BREAKER: {
        /** Threshold de falhas para abrir circuito */
        FAILURE_THRESHOLD: 5,
        /** Timeout antes de tentar fechar (ms) */
        TIMEOUT: 60000,
        /** Threshold de sucesso para fechar circuito */
        SUCCESS_THRESHOLD: 3,
    },
};

/**
 * 📊 Configurações de analytics e métricas
 * @readonly
 */
export const ANALYTICS_CONFIG = {
    /** Coleta de métricas */
    METRICS: {
        /** Intervalo de coleta (ms) */
        COLLECTION_INTERVAL: 30000,
        /** Tamanho máximo do buffer */
        MAX_BUFFER_SIZE: 1000,
        /** Flush automático a cada N métricas */
        AUTO_FLUSH_COUNT: 100,
    },

    /** Sampling */
    SAMPLING: {
        /** Taxa de sampling para performance (0-1) */
        PERFORMANCE_RATE: 0.1,
        /** Taxa de sampling para errors (0-1) */
        ERROR_RATE: 1.0,
        /** Taxa de sampling para user actions (0-1) */
        USER_ACTION_RATE: 0.05,
    },
};

// ================================================================
// 🔧 FACTORY PARA CONFIGURAÇÕES AMBIENTE-ESPECÍFICAS
// ================================================================

/**
 * Configurações específicas por ambiente
 */
export const ENVIRONMENT_CONFIG = {
    development: {
        LOGGING_LEVEL: 'debug',
        PERFORMANCE_MONITORING: true,
        ERROR_REPORTING: false,
        CACHE_ENABLED: true,
        ANALYTICS_ENABLED: false,
    },

    production: {
        LOGGING_LEVEL: 'error',
        PERFORMANCE_MONITORING: true,
        ERROR_REPORTING: true,
        CACHE_ENABLED: true,
        ANALYTICS_ENABLED: true,
    },

    testing: {
        LOGGING_LEVEL: 'warn',
        PERFORMANCE_MONITORING: false,
        ERROR_REPORTING: false,
        CACHE_ENABLED: false,
        ANALYTICS_ENABLED: false,
    },
};

/**
 * 🏭 Factory para obter configuração baseada no ambiente
 * @param {string} environment - Nome do ambiente
 * @returns {Object} Configuração para o ambiente
 */
export function getEnvironmentConfig(environment = 'development') {
    return ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.development;
}

/**
 * 🔧 Utilitário para override de configurações
 * @param {Object} baseConfig - Configuração base
 * @param {Object} overrides - Sobrescritas específicas
 * @returns {Object} Configuração merged
 */
export function mergeConfig(baseConfig, overrides = {}) {
    return {
        ...baseConfig,
        ...overrides,
    };
}
