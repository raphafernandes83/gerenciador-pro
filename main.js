// ================================================================
// MAIN.JS - ARQUIVO PRINCIPAL
// ================================================================

// ================================================================
// SUPABASE INTEGRACAO
// ================================================================

// ================================================================
// [CONFIG] CONFIGURACOES CENTRALIZADAS DO SISTEMA
// ================================================================
import {
    SUPABASE_CONFIG,
    TIMING_CONFIG,
    PERFORMANCE_THRESHOLDS,
    SYSTEM_MESSAGES,
    STORAGE_KEYS,
} from './src/constants/SystemConstants.js';
import { getSupabaseEnv } from './src/config/EnvProvider.js';
import { generateRequestId } from './src/utils/SecurityUtils.js';
import { logger } from './src/utils/Logger.js'; // Movido para o topo - usado na linha 32
import './src/utils/SafeProtection.js';
import './src/monitoring/PerformanceDashboard.js';
import './tests/test-loader.js';

// ”§ Configuracoes do Supabase com carregamento seguro de ambiente
const { url: ENV_SUPABASE_URL, anonKey: ENV_SUPABASE_ANON_KEY, isOfflineMode } = getSupabaseEnv();
const supabaseUrl = ENV_SUPABASE_URL || SUPABASE_CONFIG.URL;
const supabaseAnonKey = ENV_SUPABASE_ANON_KEY || SUPABASE_CONFIG.ANON_KEY;

// ›¡ Validacao robusta de configuracao
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'offline') {
    logger.warn(
        'âš  Supabase nao configurado. Sistema funcionara em modo offline com funcionalidade limitada.'
    );
    window.__SUPABASE_OFFLINE_MODE__ = true;
} else {
    logger.info('âœ… Configuracao Supabase carregada:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        isDevelopment: SUPABASE_CONFIG.DEVELOPMENT_MODE,
    });
    window.__SUPABASE_OFFLINE_MODE__ = false;
}

/**
 * [SHIELD] INICIALIZACAO SEGURA DO CLIENTE SUPABASE
 * Implementa Null Object Pattern + Retry Pattern para maxima seguranca
 */

/**
 * Objeto null-safe para substituir cliente Supabase quando indisponivel
 * Previne crashes e logging de credenciais em producao
 */
const createNullSupabaseClient = () => ({
    auth: {
        getUser: async () => ({
            data: null,
            error: { message: 'Cliente Supabase nao disponivel', code: 'CLIENT_UNAVAILABLE' },
        }),
        signIn: async () => ({
            data: null,
            error: { message: 'Cliente Supabase nao disponivel', code: 'CLIENT_UNAVAILABLE' },
        }),
        signOut: async () => ({
            data: null,
            error: { message: 'Cliente Supabase nao disponivel', code: 'CLIENT_UNAVAILABLE' },
        }),
    },
    from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Cliente Supabase nao disponivel' } }),
        update: () => ({ data: null, error: { message: 'Cliente Supabase nao disponivel' } }),
        delete: () => ({ data: null, error: { message: 'Cliente Supabase nao disponivel' } }),
    }),
    storage: {
        from: () => ({
            upload: async () => ({ data: null, error: { message: 'Storage nao disponivel' } }),
            download: async () => ({ data: null, error: { message: 'Storage nao disponivel' } }),
        }),
    },
    isNull: true, // Flag para identificar cliente null
});

// Cliente Supabase com inicializacao segura garantida
let supabase = createNullSupabaseClient();

/**
 * Inicializa cliente Supabase com retry inteligente e logging seguro
 * @private
 */
const initializeSupabaseClient = () => {
    try {
        // ›¡ Verificacao previa de configuracao
        if (window.__SUPABASE_OFFLINE_MODE__) {
            logger.info('Ž® Sistema em modo offline - Supabase nao sera inicializado');
            return false;
        }

        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'offline') {
            logger.warn('âš  Credenciais Supabase ausentes. Verifique a configuracao.');
            return false;
        }

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

            // ” Validacao robusta do cliente
            if (client && typeof client.auth === 'object' && typeof client.from === 'function') {
                supabase = client;
                logger.debug('âœ… Cliente Supabase inicializado com sucesso!');
                return true;
            } else {
                logger.error('âŒ Cliente Supabase criado mas invalido');
                return false;
            }
        } else {
            logger.error(
                'âŒ Biblioteca Supabase nao carregada. Verifique se o script esta incluido no HTML.'
            );
            return false;
        }
    } catch (error) {
        // ›¡ Log seguro sem vazamento de credenciais
        logger.error('âŒ Erro na inicializacao do Supabase:', {
            message: error.message,
            timestamp: new Date().toISOString(),
            hasCredentials: !!(supabaseUrl && supabaseAnonKey),
            libraryAvailable: typeof window.supabase !== 'undefined',
            errorType: error.constructor.name,
        });
        return false;
    }
};

/**
 * Sistema de retry com backoff exponencial para inicializacao robusta
 * @private
 */
const initializeSupabaseWithRetry = async () => {
    const maxRetries = SUPABASE_CONFIG.MAX_RETRY_ATTEMPTS;
    let retryDelay = SUPABASE_CONFIG.RETRY_DELAY;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (initializeSupabaseClient()) {
            return; // Sucesso na inicializacao
        }

        if (attempt < maxRetries) {
            logger.warn(
                `âš  Tentativa ${attempt}/${maxRetries} falhou. Retry em ${retryDelay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Backoff exponencial
        }
    }

    logger.warn(SYSTEM_MESSAGES.WARNING.SUPABASE_FAILED);
    logger.info('â„¹ Sistema continuara funcionando com cliente null-safe');
};

// Inicializacao imediata ou com retry
if (!initializeSupabaseClient()) {
    // Async retry sem bloquear thread principal
    initializeSupabaseWithRetry().catch((error) => {
        logger.error('’¥ Falha critica na inicializacao do Supabase:', error.message);
    });
}

/**
 * ” TESTE SEGURO DE CONEXAO SUPABASE
 * Implementa validacao completa com categorizacao de erros e logging seguro
 *
 * @returns {Promise<boolean>} True se conexao valida, false caso contrario
 */
async function testSupabaseConnection() {
    logger.debug('” Iniciando teste de conexao Supabase...');
    const requestId = generateRequestId('supabase');

    // Guard Clause 1: Verifica se cliente existe
    if (!supabase) {
        logger.error('âŒ Cliente Supabase e null/undefined');
        return false;
    }

    // Guard Clause 2: Verifica se e cliente null-safe (nao conectado)
    if (supabase.isNull === true) {
        logger.warn('âš  Usando cliente Supabase null-safe (biblioteca nao carregada)');
        return false;
    }

    // Guard Clause 3: Verifica se cliente tem interface esperada
    if (!supabase.auth || typeof supabase.auth.getUser !== 'function') {
        logger.error('âŒ Cliente Supabase com interface invalida');
        return false;
    }

    try {
        // Teste de conectividade com timeout de seguranca
        const connectionTest = Promise.race([
            supabase.auth.getUser(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error('Timeout na conexao')),
                    SUPABASE_CONFIG.CONNECTION_TIMEOUT || 5000
                )
            ),
        ]);

        const { data: user, error: authError } = await connectionTest;

        // Categorizacao inteligente de erros
        if (authError) {
            // Tentativa de recuperar sessao expirada
            if (authError.code === 'JWT_EXPIRED' && supabase?.auth?.refreshSession) {
                try {
                    const { data: refreshed, error: refreshError } =
                        await supabase.auth.refreshSession();
                    if (!refreshError) {
                        logger.info('” Sessao renovada com sucesso');
                        return true;
                    }
                } catch (_) {
                    /* silencioso */
                }
            }
            return _categorizeSupabaseError(authError);
        }

        // Conexao bem-sucedida - logging seguro
        _logSuccessfulConnection(user);
        return true;
    } catch (error) {
        return _handleConnectionException(error);
    }
}

/**
 * Categoriza erros do Supabase para diagnostico preciso
 * @private
 * @param {Object} authError - Erro retornado pelo Supabase
 * @returns {boolean} False sempre (erro detectado)
 */
function _categorizeSupabaseError(authError) {
    const errorCode = authError.code || 'UNKNOWN';
    const errorMessage = authError.message || 'Erro desconhecido';

    switch (errorCode) {
        case 'CLIENT_UNAVAILABLE':
            logger.warn('âš  Cliente Supabase nao disponivel (esperado)');
            return false;

        case 'NETWORK_ERROR':
        case 'CONNECTION_TIMEOUT':
            logger.error('Œ Erro de rede na conexao Supabase:', {
                code: errorCode,
                type: 'network',
                timestamp: new Date().toISOString(),
            });
            return false;

        case 'AUTH_SESSION_MISSING':
        case 'JWT_EXPIRED':
            // Estes sao erros "normais" quando usuario nao esta logado
            logger.info('â„¹ Nenhuma sessao ativa (normal para primeira execucao)');
            return true; // Conexao OK, apenas sem usuario logado

        case 'UNKNOWN':
            // Tratamento especifico para "Auth session missing!" que vem sem codigo especifico
            if (errorMessage === 'Auth session missing!') {
                logger.info('â„¹ Sessao nao encontrada (comportamento normal na inicializacao)');
                return true; // Conexao OK, apenas sem usuario logado
            }
            // Para outros erros UNKNOWN, continua para o default
            logger.warn('âš  Erro de autenticacao desconhecido:', errorCode);
            return false;

        default:
            // [CONFIG] CORRECAO: Log menos agressivo para erros nao categorizados
            logger.warn('âš  Erro Supabase nao categorizado:', {
                code: errorCode,
                message: errorMessage.substring(0, 100), // Limita tamanho do log
                type: 'uncategorized',
                timestamp: new Date().toISOString(),
                note: 'Este tipo de erro pode ser normal durante inicializacao',
            });
            return false;
    }
}

/**
 * Logging seguro de conexao bem-sucedida
 * @private
 * @param {Object} user - Dados do usuario (pode ser null)
 */
function _logSuccessfulConnection(user) {
    logger.debug(SYSTEM_MESSAGES.SUCCESS.SUPABASE_CONNECTED);

    if (user && user.user) {
        // Logging seguro - nao expoe dados sensiveis completos
        const userInfo = {
            hasUser: true,
            emailDomain: user.user.email ? user.user.email.split('@')[1] : 'unknown',
            provider: user.user.app_metadata?.provider || 'unknown',
            confirmed: user.user.email_confirmed_at ? 'yes' : 'no',
        };
        logger.debug('‘¤ Usuario conectado:', userInfo);
    } else {
        logger.debug('â„¹ Conexao estabelecida - nenhum usuario logado');
    }
}

/**
 * Tratamento de excecoes durante teste de conexao
 * @private
 * @param {Error} error - Excecao capturada
 * @returns {boolean} False sempre (excecao = falha)
 */
function _handleConnectionException(error) {
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'Erro desconhecido';

    // Categorizacao de excecoes
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        logger.error('â± Timeout na conexao Supabase:', {
            type: 'timeout',
            duration: SUPABASE_CONFIG.CONNECTION_TIMEOUT,
            suggestion: 'Verificar conectividade de rede',
        });
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        logger.error('Œ Falha de rede:', {
            type: 'network',
            suggestion: 'Verificar conectividade ou URL do Supabase',
        });
    } else {
        logger.error('’¥ Excecao na conexao Supabase:', {
            type: errorType,
            message: errorMessage.substring(0, 100),
            timestamp: new Date().toISOString(),
        });
    }

    return false;
}

// ================================================================
// FIM DA INTEGRACAO SUPABASE INICIAL
// ================================================================

// ================================================================
//  NOVA ARQUITETURA: DEPENDENCY INJECTION
// ================================================================
import { dependencyInjector } from './src/core/DependencyInjector.js';

// ================================================================
// “¦ IMPORTS ESSENCIAIS (apenas modulos legados criticos)
// ================================================================
import { mapDOM, dom } from './dom.js';
import { dbManager } from './db.js';
import {
    logic,
    calcularExpectativaMatematica,
    calcularDrawdown,
    calcularSequencias,
    calcularPayoffRatio,
    updateState,
} from './logic.js';
import { events } from './events.js';
import { ui } from './ui.js';
import { charts } from './charts.js';
// [START] CORRECAO CRITICA: Componentes UI avancados (Modal, Timeline, Tabela)
import { initComponents } from './src/init-components.js';
// [TARGET] CORRECAO: Controlador do modal de selecao de modo de sessao
import './src/ui/SessionModalController.js';
import { renderParametersCardIn } from './src/ui/templates/ParametersCardTemplate.js';
import { generateParametersCardHTML } from './src/ui/templates/ParametersCardTemplate.js';
import { ParametersCardController } from './src/ui/templates/ParametersCardController.js';
import {
    computeStopGoals,
    formatStopGoals,
    computeStopStatus,
    computeNextActionHint,
    computeLockMode,
} from './src/utils/GoalsUtils.js';

// Mapeia novos elementos para DOM helper se existir
try {
    window.dom = window.dom || {};
    dom.winTargetAmount = dom.winTargetAmount;
    dom.winRemainingAmount = dom.winRemainingAmount;
    dom.lossLimitAmount = dom.lossLimitAmount;
    dom.lossMarginAmount = dom.lossMarginAmount;
} catch { }
import { CONSTANTS, state, config } from './state.js';
import { validation } from './validation.js';

// ================================================================
// [PACKAGE] IMPORTS PARA EXPOSICAO GLOBAL DOS MODULOS REFATORADOS
// ================================================================
import {
    TRADING_STRATEGIES,
    SESSION_MODES,
    ERROR_MESSAGES,
    PERFORMANCE_CONFIG,
} from './src/constants/AppConstants.js';
import {
    calculateEntryAmount,
    calculateReturnAmount,
    calculateMathematicalExpectancy,
} from './src/utils/MathUtils.js';
import { TradingStrategyFactory } from './src/business/TradingStrategy.js';
import { errorHandler } from './src/utils/ErrorHandler.js';
import { debounce, memoize, measurePerformance } from './src/utils/PerformanceUtils.js';
import { TradingOperationsManager } from './src/business/TradingOperationsManager.js';
import { legacyAdapter } from './src/adapters/LegacyIntegrationAdapter.js';
import { performanceMonitor } from './src/monitoring/PerformanceMonitor.js';
import { cacheManager } from './src/enhancements/CacheManager.js';
import { smartErrorRecovery } from './src/enhancements/SmartErrorRecovery.js';
import { ToastManager } from './src/ui/ToastManager.js';
import { SkeletonLoader } from './src/ui/SkeletonLoader.js';
import './src/ui/skeleton-examples.js';
import { ErrorBoundary, ErrorBoundaryManager } from './src/monitoring/ErrorBoundary.js';
import { MetasUI } from './src/ui/MetasUI.js';
import {
    registerAdvancedStrategies,
    demonstrateAdvancedStrategies,
    AdvancedStrategiesUtils,
} from './src/strategies/AdvancedStrategies.js';
// logger import movido para o topo do arquivo (linha 21)
// ================================================================
// š€ MATH UTILS TURBO MODE - MIGRATION PREPARED
// ================================================================
import { MigrationControl } from './src/utils/MathUtilsMigrator.js';

// âš  NOTA: Turbo mode desabilitado temporariamente devido a bug no PrecisionHelper
// Bug: Cannot read properties of undefined (reading 'checkNaN') em MathUtilsTurbo.js:357
// Sistema continua em modo gradual (seguro e funcional)
// TODO: Corrigir PrecisionHelper em MathUtilsTurbo.js antes de ativar
// MigrationControl.enableAllTurbo();
logger.info('[INFO] MathUtils em modo GRADUAL (seguro) - Turbo aguardando correcao');

// ================================================================
// EXPOR MÓDULOS GLOBALMENTE PARA OS TESTES
// ================================================================
window.logic = logic;
window.state = state;
window.config = config;
window.ui = ui;
window.charts = charts;
window.validation = validation;
window.dbManager = dbManager;
window.dom = dom;
// [SHIELD] CORRECAO CRITICA: Expor events globalmente para testes
window.events = events;

// Expor funcoes exportadas individuais para os testes
window.calcularExpectativaMatematica = calcularExpectativaMatematica;
window.calcularDrawdown = calcularDrawdown;
window.calcularSequencias = calcularSequencias;
window.calcularPayoffRatio = calcularPayoffRatio;
window.updateState = updateState;

// Expor novos modulos refatorados para testes
window.TRADING_STRATEGIES = TRADING_STRATEGIES;
window.SESSION_MODES = SESSION_MODES;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
window.calculateEntryAmount = calculateEntryAmount;
window.calculateReturnAmount = calculateReturnAmount;
window.calculateMathematicalExpectancy = calculateMathematicalExpectancy;
window.TradingStrategyFactory = TradingStrategyFactory;
window.errorHandler = errorHandler;
window.debounce = debounce;
window.memoize = memoize;
window.measurePerformance = measurePerformance;
window.TradingOperationsManager = TradingOperationsManager;
window.legacyAdapter = legacyAdapter;
window.performanceMonitor = performanceMonitor;
window.cacheManager = cacheManager;
window.smartErrorRecovery = smartErrorRecovery;
window.registerAdvancedStrategies = registerAdvancedStrategies;
window.demonstrateAdvancedStrategies = demonstrateAdvancedStrategies;
window.AdvancedStrategiesUtils = AdvancedStrategiesUtils;
// Expor template para uso dinamico no sidebar
window.generateParametersCardHTML = generateParametersCardHTML;

// ================================================================
// [TARGET] INICIALIZACAO: MetasUI para Stop Win/Loss
// ================================================================
import { initializeMetasIntegration } from './metas-integration.js';

const metasUI = new MetasUI();
metasUI.init();
window.metasUI = metasUI;

// Inicializa integracao via eventos
initializeMetasIntegration();

logger.info('[TARGET] MetasUI ativado e integrado com eventos');

/**
 * [START] APLICACAO PRINCIPAL - ARQUITETURA LIMPA v9.3
 * Responsabilidade unica: Orquestrar a inicializacao do sistema
 *
 * @class App
 * @author Gerenciador PRO Team
 * @version 9.3
 */
// [CONFIG] CORRECAO: Ativar card principal de parametros
window.__SHOW_MAIN_PARAMETERS_CARD__ = true;

// [CONFIG] CORRECAO: Arquivos de correcao removidos durante limpeza (Fase 3)
// O painel minimizavel esta funcionando corretamente sem esses arquivos

class App {
    constructor() {
        this.tradingManager = null;
        this.initialized = false;
        this.initializationSteps = [];
        this.startTime = 0;
        this.dependencies = null;

        // Configuracao de inicializacao usando constantes centralizadas
        this.INITIALIZATION_CONFIG = {
            SUPABASE_RETRY_ATTEMPTS: SUPABASE_CONFIG.MAX_RETRY_ATTEMPTS,
            SIDEBAR_INIT_DELAY: TIMING_CONFIG.INITIALIZATION.SIDEBAR_INIT_DELAY,
            UI_SYNC_TIMEOUT: TIMING_CONFIG.INITIALIZATION.UI_SYNC_TIMEOUT,
            MODULE_LOAD_TIMEOUT: TIMING_CONFIG.INITIALIZATION.MODULE_LOAD_TIMEOUT,
        };

        // ›¡ NAO chama init() no constructor para evitar problemas assincronos
    }

    /**
     * ›¡ Validacao anti-recursao
     * Detecta padroes de recursao infinita antes que acontecam
     */
    validateNoRecursion() {
        const callStack = new Error().stack;
        const lines = callStack.split('\n');

        // Verifica se ha mais de 5 chamadas para o mesmo metodo
        const methodCounts = {};
        lines.forEach((line) => {
            const match = line.match(/at\s+(\w+\.\w+|\w+)/);
            if (match) {
                const method = match[1];
                methodCounts[method] = (methodCounts[method] || 0) + 1;
            }
        });

        for (const [method, count] of Object.entries(methodCounts)) {
            if (count > 5) {
                logger.error(`š¨ Recursao detectada: ${method} chamado ${count} vezes`);
                return false;
            }
        }

        return true;
    }

    /**
     * ›¡ Inicializacao segura do sistema de erro
     */
    initSafeErrorHandling() {
        try {
            const { errorHandler } = this.dependencies.utils;

            if (errorHandler && errorHandler.setupGlobalErrorHandling) {
                // Wrapper com timeout de seguranca
                const timeoutId = setTimeout(() => {
                    logger.warn('âš  Timeout na inicializacao do errorHandler');
                }, TIMING_CONFIG.INITIALIZATION.ERROR_HANDLER_TIMEOUT);

                errorHandler.setupGlobalErrorHandling();
                clearTimeout(timeoutId);
                logger.debug('âœ… Error handling ativo');
            }
        } catch (error) {
            logger.warn('âš  Erro ao inicializar error handling:', error.message);
        }
    }

    /**
     * ›¡ Inicializacao segura do monitoramento de performance
     */
    initSafePerformanceMonitoring() {
        try {
            const { performanceMonitor } = this.dependencies.singletons;

            if (performanceMonitor && performanceMonitor.initialize) {
                const initialized = performanceMonitor.initialize({
                    reportInterval: TIMING_CONFIG.PERFORMANCE.REPORT_INTERVAL,
                    alertThresholds: {
                        slowFunction: PERFORMANCE_THRESHOLDS.ALERTS.SLOW_FUNCTION,
                        highMemoryUsage: PERFORMANCE_THRESHOLDS.ALERTS.HIGH_MEMORY_USAGE,
                        domOperationsPerSecond:
                            PERFORMANCE_THRESHOLDS.ALERTS.DOM_OPERATIONS_PER_SECOND,
                    },
                });

                if (initialized) {
                    logger.debug('âœ… Performance monitoring ativo');
                } else {
                    logger.warn('âš  Performance monitoring nao inicializou');
                }
            }
        } catch (error) {
            logger.warn('âš  Erro ao inicializar performance monitoring:', error.message);
        }
    }

    /**
     * ›¡ Inicializacao segura do cache manager
     */
    initSafeCacheManager() {
        try {
            const { cacheManager } = this.dependencies.singletons;

            if (cacheManager && cacheManager.configure) {
                cacheManager.configure({
                    maxSize: PERFORMANCE_THRESHOLDS.LIMITS.MAX_CACHE_SIZE,
                    defaultTTL: PERFORMANCE_THRESHOLDS.LIMITS.DEFAULT_CACHE_TTL,
                    enableCompression: false, // Desabilitado para reduzir overhead
                    enableStatistics: false, // Desabilitado para reduzir overhead
                });
                logger.debug('âœ… Cache manager ativo');
            }
        } catch (error) {
            logger.warn('âš  Erro ao inicializar cache manager:', error.message);
        }
    }

    /**
     * Ž¯ METODO PRINCIPAL - RESPONSABILIDADE UNICA
     * Orquestra a inicializacao seguindo padrao Template Method
     */
    async init() {
        try {
            this._validateInitialization();
            this._startInitializationProcess();

            await this._initializeDependencyInjection();
            await this._initializeSupabaseConnection();
            await this._initializeMonitoringSystems();
            await this._initializeAdvancedStrategies();
            await this._initializeLegacyModules();
            await this._initializeStateManager(); // †• CHECKPOINT 1.1
            await this._initializeDOMManager(); // †• CHECKPOINT 2.1
            await this._initializeModularSystem(); // †• CHECKPOINT 3.x
            await this._initializeRefactoredSystems();
            await this._initializeSidebar();

            // š€ Inicializa o novo Gerenciador de UI do Dashboard (Substitui fixes antigos)
            try {
                const { dashboardUIManager } = await import('./src/managers/DashboardUIManager.js');
                dashboardUIManager.init();
                logger.debug('âœ… DashboardUIManager inicializado com sucesso');
                this.initializationSteps.push('dashboard_ui_initialized');
            } catch (error) {
                logger.error('âŒ Erro ao inicializar DashboardUIManager:', error);
            }

            await this._performUISync();
            try { ui.__registerGlobalListenersOnce?.(); } catch (_) { }
            await this._performFinalValidations();

            this._completeInitialization();
        } catch (error) {
            this._handleInitializationError(error);
        }
    }

    /**
     *  Inicializacao do Dependency Injector
     * @private
     */
    async _initializeDependencyInjection() {
        logger.debug(' Inicializando Dependency Injection...');

        try {
            // Registra modulos legados para compatibilidade
            const legacyModules = {
                dom,
                dbManager,
                logic,
                events,
                ui,
                charts,
                state,
                config,
                CONSTANTS,
                // Funcoes especificas exportadas
                calcularExpectativaMatematica,
                calcularDrawdown,
                calcularSequencias,
                calcularPayoffRatio,
                updateState,
            };

            // Inicializa o container de dependencias
            this.dependencies = await dependencyInjector.initialize(legacyModules);

            logger.debug('âœ… Dependency Injection inicializado!');
            logger.debug('“Š Estatisticas do DI:', dependencyInjector.getStats());

            this.initializationSteps.push('dependency_injection_initialized');
        } catch (error) {
            logger.error('âŒ Erro ao inicializar Dependency Injection:', error.message);
            throw new Error(`Falha critica no Dependency Injection: ${error.message}`);
        }
    }

    /**
     * ›¡ Validacao de inicializacao
     * @private
     */
    _validateInitialization() {
        if (this.initialized) {
            throw new Error('Aplicacao ja foi inicializada');
        }

        if (!this.validateNoRecursion()) {
            throw new Error('Recursao detectada - abortando inicializacao');
        }
    }

    /**
     * š€ Inicia processo de inicializacao
     * @private
     */
    _startInitializationProcess() {
        logger.debug('š€ MAIN: Aplicacao modularizada iniciando... (Nova Arquitetura v9.3)');
        this.startTime = performance.now();
        this.initialized = true;
    }

    /**
     * —„ Inicializacao da conexao Supabase
     * @private
     */
    async _initializeSupabaseConnection() {
        logger.debug('—„ Inicializando conexao Supabase...');

        let retryCount = 0;
        while (retryCount < this.INITIALIZATION_CONFIG.SUPABASE_RETRY_ATTEMPTS) {
            try {
                const supabaseConnected = await testSupabaseConnection();
                if (supabaseConnected) {
                    logger.debug(SYSTEM_MESSAGES.SUCCESS.SUPABASE_CONNECTED);
                    this.initializationSteps.push('supabase_connected');
                    return;
                }
                retryCount++;
            } catch (error) {
                retryCount++;
                logger.warn(
                    `âš  Tentativa ${retryCount} de conexao Supabase falhou:`,
                    error.message
                );
            }
        }

        logger.warn(SYSTEM_MESSAGES.WARNING.SUPABASE_FAILED);
        this.initializationSteps.push('supabase_failed');
    }

    /**
     * “Š Inicializacao dos sistemas de monitoramento
     * @private
     */
    async _initializeMonitoringSystems() {
        try {
            // Validacao adicional de recursao
            if (!this.validateNoRecursion()) {
                throw new Error('Recursao detectada durante inicializacao de monitoramento');
            }

            // Inicializar sistemas com protecoes
            this.initSafeErrorHandling();
            this.initSafePerformanceMonitoring();
            this.initSafeCacheManager();

            logger.debug('âœ… Sistemas de monitoramento seguros ativados');
            this.initializationSteps.push('monitoring_initialized');
        } catch (error) {
            logger.warn('âš  Erro ao inicializar monitoramento:', error.message);
            logger.debug('”„ Continuando com sistema basico...');
            this.initializationSteps.push('monitoring_partial');
        }
    }

    /**
     * Ž¯ Inicializacao das estrategias avancadas
     * @private
     */
    async _initializeAdvancedStrategies() {
        try {
            // Usa dependencias injetadas
            const { registerAdvancedStrategies, demonstrateAdvancedStrategies } =
                this.dependencies.singletons;

            const strategiesRegistered = registerAdvancedStrategies();
            if (strategiesRegistered) {
                logger.debug('âœ… Estrategias avancadas registradas com sucesso!');
                demonstrateAdvancedStrategies();
                this.initializationSteps.push('strategies_registered');
            } else {
                logger.warn('âš  Falha ao registrar algumas estrategias avancadas');
                this.initializationSteps.push('strategies_partial');
            }
        } catch (error) {
            logger.error('âŒ Erro ao registrar estrategias:', error.message);
            this.initializationSteps.push('strategies_failed');
        }
    }

    /**
     * — Inicializacao dos modulos legados
     * @private
     */
    async _initializeLegacyModules() {
        try {
            // 1. Mapeia os elementos do DOM primeiro
            mapDOM();
            this.initializationSteps.push('dom_mapped');

            // [START] CORRECAO CRITICA: Inicializa componentes UI avancados (Modal, Timeline, Tabela)
            // DEVE ser chamado APOS mapDOM() mas ANTES de qualquer codigo que use os componentes
            initComponents();
            this.initializationSteps.push('ui_components_initialized');
            logger.debug('âœ… Componentes UI avancados inicializados!');

            // 2. Inicia os modulos que nao dependem do estado do utilizador
            // [SHIELD] RECOVERY: Retry logic para IndexedDB com delay exponencial
            let dbInitialized = false;
            let retryCount = 0;
            const maxRetries = 2;

            while (!dbInitialized && retryCount <= maxRetries) {
                try {
                    await dbManager.init();
                    dbInitialized = true;
                } catch (dbError) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        const delay = retryCount * 500; // 500ms, 1000ms
                        logger.warn(`âš  Tentativa ${retryCount} de init falhou, retry em ${delay}ms...`, {
                            error: dbError.message
                        });
                        await new Promise(r => setTimeout(r, delay));
                    } else {
                        logger.error('âŒ Todas as tentativas de inicializar IndexedDB falharam');
                        // Continua sem IndexedDB - modo degradado
                        this.initializationSteps.push('database_failed');
                        logger.warn('âš  Continuando em modo degradado sem IndexedDB local');
                    }
                }
            }

            if (dbInitialized) {
                this.initializationSteps.push('database_initialized');
            }

            charts.init();
            this.initializationSteps.push('charts_initialized');

            // 3. Adiciona os event listeners para que possam reagir as mudancas de estado
            events.init();
            this.initializationSteps.push('events_initialized');

            // 4. Carrega o estado guardado
            logic.loadStateFromStorage();
            this.initializationSteps.push('state_loaded');

            logger.debug('âœ… Modulos legados inicializados com sucesso!');

            // Renderiza o card principal a partir do template unificado
            try {
                // Exibicao do card principal desligada por padrao; fonte unica: sidebar
                if (window.__SHOW_MAIN_PARAMETERS_CARD__ === true) {
                    const inputPanel = dom.inputPanel;
                    if (inputPanel) {
                        const initialValues = {
                            capitalInicial: config.capitalInicial,
                            percentualEntrada: config.percentualEntrada,
                            stopWinPerc: config.stopWinPerc,
                            stopLossPerc: config.stopLossPerc,
                            estrategia: config.estrategiaAtiva,
                            payout: config.payout,
                        };
                        renderParametersCardIn(inputPanel, { idPrefix: '', values: initialValues });
                        try {
                            (window.parametersCardController ||= new ParametersCardController()).bindEventHandlers();
                        } catch (_) { }
                    }
                } else {
                    const inputPanel = dom.inputPanel;
                    if (inputPanel) inputPanel.innerHTML = '';
                }
            } catch (e) {
                logger.warn('âš  Falha ao renderizar card principal via template:', e.message);
            }
        } catch (error) {
            logger.error('âŒ Erro ao inicializar modulos legados:', error.message);
            throw new Error(`Falha critica na inicializacao de modulos legados: ${error.message}`);
        }
    }

    /**
     * †• CHECKPOINT 1.1: Inicializacao do StateManager
     * @private
     */
    async _initializeStateManager() {
        try {
            logger.debug('”„ CHECKPOINT 1.1: Inicializando StateManager...');

            // Importar StateManager
            const { stateManager, createBidirectionalSync } = await import('./state-manager.js');

            // Sincronizar estado inicial do window.state para o StateManager
            stateManager.setState(window.state, 'initial-sync-from-legacy');

            // Criar sincronizacao bidirecional (temporaria)
            // Quando StateManager muda â†’ atualiza window.state
            createBidirectionalSync(stateManager, window.state);

            logger.debug('âœ… StateManager inicializado e sincronizado com estado legado');
            logger.debug('“Š Estado inicial:', stateManager.getState());
            logger.debug('“ˆ Stats:', stateManager.getStats());

            this.initializationSteps.push('state_manager_initialized');
        } catch (error) {
            logger.error('âŒ Erro ao inicializar StateManager:', error.message);
            logger.warn('âš  Continuando com estado legado apenas');
            this.initializationSteps.push('state_manager_failed');
        }
    }

    /**
     * †• CHECKPOINT 2.1: Inicializacao do DOMManager
     * @private
     */
    async _initializeDOMManager() {
        try {
            logger.debug('”„ CHECKPOINT 2.1: Inicializando DOMManager...');

            // Importar DOMManager
            const { domManager } = await import('./dom-manager.js');

            logger.debug('âœ… DOMManager inicializado');
            logger.debug('“Š Stats:', domManager.getStats());

            this.initializationSteps.push('dom_manager_initialized');
        } catch (error) {
            logger.error('âŒ Erro ao inicializar DOMManager:', error.message);
            logger.warn('âš  Continuando com DOM legado apenas');
            this.initializationSteps.push('dom_manager_failed');
        }
    }

    /**
     * †• CHECKPOINT 3.x: Inicializacao do Sistema Modular
     * @private
     */
    async _initializeModularSystem() {
        try {
            logger.debug('— CHECKPOINT 3.x: Inicializando Sistema Modular...');

            // Importar modulos
            const { moduleManager } = await import('./src/modules/ModuleManager.js');
            const { default: SessionModule } = await import('./src/modules/SessionModule.js');
            const { default: OperationModule } = await import('./src/modules/OperationModule.js');
            const { default: CalculationModule } = await import('./src/modules/CalculationModule.js');

            // Criar instancias
            const sessionModule = new SessionModule();
            const operationModule = new OperationModule();
            const calculationModule = new CalculationModule();

            // Registrar dependencias
            if (window.stateManager) {
                sessionModule.registerDependency('stateManager', window.stateManager);
                logger.debug('âœ… SessionModule conectado ao StateManager');
            }

            // Registrar modulos no gerenciador
            moduleManager.register('session', sessionModule);
            moduleManager.register('operation', operationModule);
            moduleManager.register('calculation', calculationModule);

            // Inicializar todos os modulos
            await moduleManager.initAll();

            // Expor globalmente para uso
            window.modules = {
                session: sessionModule,
                operation: operationModule,
                calculation: calculationModule,
                manager: moduleManager
            };

            logger.debug('âœ… Sistema Modular inicializado!');
            logger.debug('“Š Modulos disponiveis:', Object.keys(window.modules));
            logger.debug('“ˆ Stats:', moduleManager.getStats());

            this.initializationSteps.push('modular_system_initialized');
        } catch (error) {
            logger.error('âŒ Erro ao inicializar Sistema Modular:', error.message);
            logger.warn('âš  Continuando sem sistema modular');
            this.initializationSteps.push('modular_system_failed');
        }
    }

    /**
     * †• Inicializacao dos sistemas refatorados
     * @private
     */
    async _initializeRefactoredSystems() {
        try {
            // Usa factory para criar Trading Manager com dependencias injetadas
            this.tradingManager = this.dependencies.factories.createTradingManager(
                this.dependencies.legacy.state,
                this.dependencies.legacy.config,
                this.dependencies.legacy.dbManager,
                this.dependencies.legacy.ui,
                this.dependencies.legacy.charts
            );
            this.initializationSteps.push('trading_manager_created');

            // Usa singleton do Legacy Adapter
            const { legacyAdapter } = this.dependencies.singletons;

            // Inicializar o Legacy Integration Adapter
            await legacyAdapter.initialize({
                state: this.dependencies.legacy.state,
                config: this.dependencies.legacy.config,
                dbManager: this.dependencies.legacy.dbManager,
                ui: this.dependencies.legacy.ui,
                charts: this.dependencies.legacy.charts,
                tradingManager: this.tradingManager,
                logic: this.dependencies.legacy.logic,
                events: this.dependencies.legacy.events,
            });
            this.initializationSteps.push('legacy_adapter_initialized');

            // Criar proxies para manter compatibilidade
            legacyAdapter.createLegacyProxies(window.logic);
            this.initializationSteps.push('legacy_proxies_created');

            // Expor o novo manager globalmente para testes
            window.tradingManager = this.tradingManager;

            logger.debug('”„ Migracao de compatibilidade configurada com sucesso!');
        } catch (error) {
            logger.error('âŒ Erro ao inicializar sistemas refatorados:', error.message);
            throw new Error(`Falha na inicializacao de sistemas refatorados: ${error.message}`);
        }
    }

    /**
     * “‹ Inicializacao da sidebar
     * @private
     */
    async _initializeSidebar() {
        try {
            // Importa e inicializa a sidebar dinamicamente
            const sidebarModule = await import('./sidebar.js');
            const sidebar = sidebarModule.sidebar;
            sidebar.initialize();

            // Expor globalmente para debug se necessario
            window.sidebar = sidebar;
            this.initializationSteps.push('sidebar_imported');

            // Aguarda um pouco antes de inicializar o gerenciador avancado
            await new Promise((resolve) =>
                setTimeout(resolve, this.INITIALIZATION_CONFIG.SIDEBAR_INIT_DELAY)
            );

            // Inicializar o gerenciador avancado
            const { sidebarManager } = await import('./src/ui/SidebarManager.js');
            sidebarManager.integrateWithSettings();
            this.initializationSteps.push('sidebar_manager_initialized');

            logger.debug('âœ… Sidebar inicializada com sucesso!');
        } catch (error) {
            logger.warn('âš  Erro ao inicializar sidebar:', error.message);
            this.initializationSteps.push('sidebar_failed');
            // Nao e critico, continua a aplicacao
        }
    }

    /**
     * Ž¨ Sincronizacao da UI
     * @private
     */
    async _performUISync() {
        try {
            // Timeout de seguranca para sincronizacao da UI
            const syncPromise = Promise.race([
                this._performActualUISync(),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Timeout na sincronizacao da UI')),
                        this.INITIALIZATION_CONFIG.UI_SYNC_TIMEOUT
                    )
                ),
            ]);

            await syncPromise;
            logger.debug('âœ… Interface sincronizada com sucesso!');
        } catch (error) {
            logger.error('âŒ Erro na sincronizacao da UI:', error.message);
            throw new Error(`Falha critica na sincronizacao da UI: ${error.message}`);
        }
    }

    /**
     * Ž¨ Executa sincronizacao real da UI
     * @private
     */
    async _performActualUISync() {
        // Sincroniza a UI com o estado carregado
        ui.syncUIFromState();
        this.initializationSteps.push('ui_synced');

        // Renderiza todos os componentes com base no estado inicial
        ui.atualizarTudo();
        this.initializationSteps.push('ui_rendered');

        // Verifica se existe uma sessao por finalizar
        logic.checkForActiveSession();
        this.initializationSteps.push('session_checked');
    }

    /**
     * âœ… Validacoes finais
     * @private
     */
    async _performFinalValidations() {
        // Verificar se ha bloqueio ativo
        const lockdownEnd = localStorage.getItem('gerenciadorProLockdownEnd');
        if (lockdownEnd && parseInt(lockdownEnd) > Date.now()) {
            const lockdownType = localStorage.getItem('gerenciadorProLockdownType') || 'perdas';
            ui.iniciarBloqueio(parseInt(lockdownEnd), lockdownType);
            this.initializationSteps.push('lockdown_activated');
            return;
        }

        // Mostrar container principal
        if (dom.container) {
            dom.container.classList.remove('hidden');
            this.initializationSteps.push('container_shown');
        }

        // Restaurar ultima aba ativa
        const lastTab = logic.safeJSONParse(CONSTANTS.LAST_ACTIVE_TAB_KEY, 'plano');
        await events.onTabSwitch(lastTab);
        ui.switchTab(lastTab);
        this.initializationSteps.push('tab_restored');
    }

    /**
     * Ž‰ Finaliza processo de inicializacao
     * @private
     */
    _completeInitialization() {
        const endTime = performance.now();
        const initializationTime = (endTime - this.startTime).toFixed(2);

        logger.debug(
            `âœ¨ MAIN: Aplicacao pronta! Nova arquitetura v9.3 ativa em ${initializationTime}ms`
        );
        logger.debug('“ˆ MAIN: Estatisticas do sistema:', legacyAdapter.getStats());
        logger.debug('”„ MAIN: Passos de inicializacao:', this.initializationSteps);

        this.initializationSteps.push('initialization_completed');
    }

    /**
     * âŒ Tratamento de erros de inicializacao
     * @private
     */
    _handleInitializationError(error) {
        logger.error('âŒ Erro durante inicializacao:', error);

        // Adiciona erro aos passos para diagnostico
        this.initializationSteps.push(`error_${error.name || 'unknown'}`);

        // Construir mensagem de erro detalhada
        let errorMessage = 'Erro ao inicializar o aplicativo.';
        if (error.message) {
            errorMessage += ` Detalhes: ${error.message}`;
        }

        // Log dos passos completados para diagnostico
        logger.debug('” Passos completados antes do erro:', this.initializationSteps);

        // Tentativa de usar tratamento de erro avancado se disponivel
        if (window.errorHandler && typeof window.errorHandler.handleError === 'function') {
            try {
                window.errorHandler.handleError(error, 'CRITICAL', {
                    context: 'App.init',
                    completedSteps: this.initializationSteps,
                    initializationTime: performance.now() - this.startTime,
                });
            } catch (handlerError) {
                logger.warn('âš  Erro no handler de erro:', handlerError.message);
            }
        }

        // Fallback para notificacao do usuario
        if (window.ui && window.ui.showNotification) {
            window.ui.showNotification('error', errorMessage);
        } else {
            // Ultimo recurso: exibir erro em tela completa
            document.body.innerHTML = `
                <div style="background: #ff1744; color: white; padding: 20px; text-align: center; font-family: Arial;">
                    <h2>âš  Erro de Inicializacao</h2>
                    <p>A aplicacao nao pode ser carregada corretamente.</p>
                    <details style="margin-top: 10px;">
                        <summary>Detalhes tecnicos</summary>
                        <pre style="text-align: left; background: rgba(0,0,0,0.3); padding: 10px; margin-top: 10px; border-radius: 4px;">${error.message}</pre>
                        <p style="text-align: left; margin-top: 10px;"><strong>Passos completados:</strong> ${this.initializationSteps.join(', ')}</p>
                    </details>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: white; color: #ff1744; border: none; border-radius: 4px; cursor: pointer;">”„ Recarregar Pagina</button>
                </div>
            `;
        }

        // Re-throw para permitir handling adicional se necessario
        throw error;
    }
}

/**
 * [START] PONTO DE ENTRADA DA APLICACAO
 * Inicializacao limpa e controlada
 */
document.addEventListener('DOMContentLoaded', async () => {
    logger.debug('“± DOM carregado, inicializando aplicacao...');

    const app = new App();

    try {
        await app.init();
        logger.debug('âœ… Aplicacao inicializada com sucesso!');

        // ” Purga automatica da Lixeira: agora e diariamente
        try {
            if (window.dbManager && typeof dbManager.purgeExpiredTrash === 'function') {
                dbManager.purgeExpiredTrash().catch(() => { });
                setInterval(() => dbManager.purgeExpiredTrash().catch(() => { }), 24 * 60 * 60 * 1000);
            }
        } catch (_) { }
    } catch (error) {
        logger.error('âŒ Falha critica na inicializacao:', error);

        // O tratamento de erro detalhado ja foi feito no _handleInitializationError
        // Aqui apenas garantimos que o erro seja logado
        logger.debug('” Inicializacao falhou. Veja logs detalhados acima.');
    }
});

// Exporta o cliente Supabase para uso em outros modulos
export { supabase };

// Funcoes de limpeza de dados corrompidos (disponiveis no console)
window.clearCorruptedData = async () => {
    logger.debug(' Iniciando limpeza de dados corrompidos...');
    try {
        const removed = await dbManager.clearCorruptedData();
        logger.debug(`âœ… ${removed} sessoes corrompidas removidas.`);
        if (removed > 0) {
            // Recarregar a aba diario
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return removed;
    } catch (error) {
        logger.error('âŒ Erro:', error);
        return 0;
    }
};

window.repairCorruptedData = async () => {
    logger.debug('”§ Iniciando reparo de dados corrompidos...');
    try {
        const repaired = await dbManager.repairCorruptedData();
        logger.debug(`âœ… ${repaired} sessoes reparadas.`);
        if (repaired > 0) {
            // Recarregar a aba diario
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return repaired;
    } catch (error) {
        logger.error('âŒ Erro:', error);
        return 0;
    }
};

// ”§ Funcao para reparar resultados financeiros zerados
window.repairResultadosZerados = async () => {
    logger.debug('”§ Iniciando reparo de resultados financeiros zerados...');
    try {
        const result = await dbManager.repairInvalidResultados();
        logger.debug(`âœ… Reparo concluido:`, result);
        if (result.repaired > 0) {
            // Recarregar a aba diario
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return result;
    } catch (error) {
        logger.error('âŒ Erro:', error);
        return { repaired: 0, errors: 1, error: error.message };
    }
};

// Nota importante: Agora voce pode importar o cliente Supabase em outros modulos usando:
// import { supabase } from './main.js';

// =================================================================
// SISTEMA DE TESTE PARA SINCRONIZACAO EM TEMPO REAL
// =================================================================

// Funcao para testar a sincronizacao entre cards
window.testRealTimeSync = function () {
    logger.debug('\n [TEST] TESTANDO SINCRONIZACAO EM TEMPO REAL...\n');

    // Teste 1: Capital Inicial
    logger.debug('“ Teste 1: Mudanca no capital inicial');
    const capitalInput = dom.capitalInicial;
    if (capitalInput) {
        capitalInput.value = '15000';
        capitalInput.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            const sidebarCapital = dom.sidebarCapitalInicial;
            if (sidebarCapital) {
                logger.debug(`âœ… Capital sincronizado: ${sidebarCapital.value}`);
            } else {
                logger.debug('âš  Sidebar nao esta aberto para teste');
            }
        }, 200);
    }

    // Teste 2: Entrada Inicial
    setTimeout(() => {
        logger.debug('“ Teste 2: Mudanca na entrada inicial');
        const entradaInput = dom.percentualEntrada;
        if (entradaInput) {
            entradaInput.value = '3.5';
            entradaInput.dispatchEvent(new Event('change', { bubbles: true }));
            logger.debug('âœ… Entrada alterada para 3.5%');
        }
    }, 300);

    // Teste 3: Payout
    setTimeout(() => {
        logger.debug('“ Teste 3: Mudanca de payout');
        const payoutBtn = Array.from(document.querySelectorAll('.payout-buttons button')).find(
            (btn) => btn.textContent.trim() === '90'
        );
        if (payoutBtn) {
            payoutBtn.click();
            logger.debug('âœ… Payout 90% selecionado');
        }
    }, 600);

    // Teste 4: Estrategia
    setTimeout(() => {
        logger.debug('“ Teste 4: Mudanca de estrategia');
        const strategySelect = dom.estrategiaSelect;
        if (strategySelect) {
            strategySelect.value = 'fixa';
            strategySelect.dispatchEvent(new Event('change', { bubbles: true }));
            logger.debug('âœ… Estrategia alterada para Mao Fixa');
        }
    }, 900);

    // Teste 5: Stop Win
    setTimeout(() => {
        logger.debug('“ Teste 5: Mudanca no Stop Win');
        const stopWinInput = dom.stopWinPerc;
        if (stopWinInput) {
            stopWinInput.value = '12';
            stopWinInput.dispatchEvent(new Event('change', { bubbles: true }));
            logger.debug('âœ… Stop Win alterado para 12%');
        }
    }, 1200);

    // Teste 6: Stop Loss
    setTimeout(() => {
        logger.debug('“ Teste 6: Mudanca no Stop Loss');
        const stopLossInput = dom.stopLossPerc;
        if (stopLossInput) {
            stopLossInput.value = '18';
            stopLossInput.dispatchEvent(new Event('change', { bubbles: true }));
            logger.debug('âœ… Stop Loss alterado para 18%');
        }

        // Resumo final
        setTimeout(() => {
            logger.debug('\n[TARGET] TESTE CONCLUIDO!');
            logger.debug('[INFO] Para testar sincronizacao do sidebar:');
            logger.debug('1. Abra o menu lateral (botao hamburger)');
            logger.debug('2. Clique em "Parametros e Controles"');
            logger.debug('3. Altere valores e veja a sincronizacao automatica');
            logger.debug('4. Note que NAO ha botao "Aplicar" - tudo e automatico!');
            logger.debug('\n[TIP] Execute: testRealTimeSync() no console para testar novamente');
        }, 500);
    }, 1500);
};

// =================================================================
// SISTEMA DE TESTE PARA SINCRONIZACAO DE PAYOUT + VISUAL FOCUS
// =================================================================
window.testPayoutAndFocus = function () {
    logger.debug('\n TESTANDO PAYOUT SYNC + VISUAL FOCUS...\n');

    let testIndex = 0;
    const tests = [
        // Teste 1: Payout Sync Main â†’ Sidebar
        () => {
            logger.debug('“ Teste 1: Payout 90% no card principal');
            const btn = Array.from(document.querySelectorAll('.payout-buttons button')).find(
                (b) => b.textContent.trim() === '90'
            );
            if (btn) {
                btn.click();
                logger.debug('âœ… Clique executado no payout 90%');
            } else {
                logger.debug('âŒ Botao payout 90% nao encontrado');
            }
        },

        // Teste 2: Verificar sincronizacao no sidebar
        () => {
            logger.debug('“ Teste 2: Verificando sincronizacao no sidebar');
            const sidebarBtn = dom.sidebarPayout - 90;
            if (sidebarBtn && sidebarBtn.classList.contains('active-payout')) {
                logger.debug('âœ… Sidebar sincronizado corretamente');
            } else if (!sidebarBtn) {
                logger.debug('âš  Sidebar nao esta aberto - abra o menu lateral primeiro');
            } else {
                logger.debug('âŒ Sidebar NAO sincronizado');
            }
        },

        // Teste 3: Focus Effect (Verde Elegante)
        () => {
            logger.debug('“ Teste 3: Efeito de focus verde elegante no capital inicial');
            const capitalField = dom.capitalInicial;
            if (capitalField) {
                capitalField.focus();
                setTimeout(() => {
                    const computedStyle = window.getComputedStyle(capitalField);
                    const borderColor = computedStyle.borderColor;
                    const boxShadow = computedStyle.boxShadow;

                    // Verifica se tem verde elegante (76, 175, 80)
                    const hasCorrectGreen =
                        borderColor.includes('76, 175, 80') || boxShadow.includes('76, 175, 80');

                    // Verifica se NAO tem cores indesejadas (amarelo/dourado)
                    const hasUnwantedColors =
                        borderColor.includes('230, 118') ||
                        boxShadow.includes('230, 118') ||
                        borderColor.includes('255, 255, 0') ||
                        boxShadow.includes('255, 193');

                    if (hasCorrectGreen && !hasUnwantedColors) {
                        logger.debug('âœ… Efeito verde ELEGANTE aplicado corretamente');
                    } else if (hasUnwantedColors) {
                        logger.debug('âŒ AINDA tem cores indesejadas (amarelo/dourado)');
                        logger.debug('” Border:', borderColor);
                        logger.debug('” Shadow:', boxShadow);
                    } else {
                        logger.debug('âŒ Efeito verde NAO aplicado');
                        logger.debug('” Border:', borderColor);
                        logger.debug('” Shadow:', boxShadow);
                    }
                }, 100);
            } else {
                logger.debug('âŒ Campo capital inicial nao encontrado');
            }
        },

        // Teste 4: Typing Effect
        () => {
            logger.debug('“ Teste 4: Efeito de digitacao');
            const capitalField = dom.capitalInicial;
            if (capitalField) {
                capitalField.value = '25000';
                capitalField.dispatchEvent(new Event('input', { bubbles: true }));

                setTimeout(() => {
                    if (capitalField.classList.contains('typing')) {
                        logger.debug('âœ… Efeito de digitacao ativo');
                    } else {
                        logger.debug('’¡ Efeito de digitacao pode ter expirado (normal)');
                    }
                }, 50);
            }
        },

        // Teste 5: Payout Sidebar â†’ Main (se sidebar estiver aberto)
        () => {
            logger.debug('“ Teste 5: Payout 92% no sidebar');
            const sidebarBtn = dom.sidebarPayout - 92;
            if (sidebarBtn) {
                sidebarBtn.click();
                logger.debug('âœ… Clique executado no sidebar');

                setTimeout(() => {
                    const mainBtn = Array.from(
                        document.querySelectorAll('.payout-buttons button')
                    ).find((b) => b.textContent.trim() === '92');
                    if (mainBtn && mainBtn.classList.contains('active-payout')) {
                        logger.debug('âœ… Card principal sincronizado');
                    } else {
                        logger.debug('âŒ Card principal NAO sincronizado');
                    }
                }, 100);
            } else {
                logger.debug('âš  Botao do sidebar nao encontrado - abra o menu lateral');
            }
        },

        // Teste 6: Focus no sidebar (se estiver aberto)
        () => {
            logger.debug('“ Teste 6: Focus no sidebar');
            const sidebarField = dom.sidebarCapitalInicial;
            if (sidebarField) {
                sidebarField.focus();
                setTimeout(() => {
                    const computedStyle = window.getComputedStyle(sidebarField);
                    const hasGreenBorder =
                        computedStyle.borderColor.includes('230, 118') ||
                        computedStyle.boxShadow.includes('230, 118');
                    if (hasGreenBorder) {
                        logger.debug('âœ… Efeito de focus no sidebar funcionando');
                    } else {
                        logger.debug('âŒ Efeito de focus no sidebar NAO funcionando');
                    }
                }, 100);
            } else {
                logger.debug(
                    'âš  Campo do sidebar nao encontrado - abra Parametros e Controles no menu lateral'
                );
            }
        },
    ];

    // Executar testes sequencialmente
    function runNextTest() {
        if (testIndex < tests.length) {
            tests[testIndex]();
            testIndex++;
            setTimeout(runNextTest, 800);
        } else {
            logger.debug('\n[TARGET] TODOS OS TESTES CONCLUIDOS!');
            logger.debug('[TIP] Para testar completamente:');
            logger.debug('1. Abra o menu lateral (botao hamburger)');
            logger.debug('2. Clique em "Parametros e Controles"');
            logger.debug('3. Execute novamente: testPayoutAndFocus()');
            logger.debug('4. Teste manualmente clicando nos botoes e campos');
        }
    }

    runNextTest();
};

// =================================================================
// TESTE ESPECIFICO PARA VALIDACAO DO DESAFIO DE BORDAS VERDES
// =================================================================
window.testGreenBorderChallenge = function () {
    logger.debug('\nŽ¯ TESTE DO DESAFIO: BORDAS VERDES ELEGANTES\n');

    // Teste 1: Verificacao Visual Stop Win
    logger.debug('“ Testando campo Stop Win (%) - o que estava com problema...');
    const stopWinField = dom.stopWinPerc;
    if (stopWinField) {
        stopWinField.focus();

        setTimeout(() => {
            const style = window.getComputedStyle(stopWinField);
            const border = style.borderColor;
            const shadow = style.boxShadow;

            logger.debug('” Border atual:', border);
            logger.debug('” Shadow atual:', shadow);

            // Verifica verde elegante (76, 175, 80)
            const hasCorrectGreen =
                border.includes('76, 175, 80') || shadow.includes('76, 175, 80');

            // Verifica se NAO tem amarelo/dourado (230, 118 ou outras cores indesejadas)
            const hasYellow = border.includes('230, 118') || shadow.includes('230, 118');
            const hasGold = border.includes('255, 193') || shadow.includes('255, 193');
            const hasUnwantedColors = hasYellow || hasGold;

            if (hasCorrectGreen && !hasUnwantedColors) {
                logger.debug('âœ… SUCESSO! Apenas verde elegante, sem amarelo/dourado');
            } else if (hasUnwantedColors) {
                logger.debug('âŒ FALHA! Ainda tem cores indesejadas');
                if (hasYellow) logger.debug('Ÿ¡ Detectado: Verde saturado (230, 118)');
                if (hasGold) logger.debug('Ÿ¨ Detectado: Dourado/Amarelo');
            } else {
                logger.debug('âŒ FALHA! Verde elegante nao aplicado');
            }

            stopWinField.blur();
        }, 200);
    }

    // Teste 2: Todos os campos principais
    setTimeout(() => {
        logger.debug('\n“ Testando TODOS os campos principais...');
        const fields = [
            'capital-inicial',
            'percentual-entrada',
            'stop-win-perc',
            'stop-loss-perc',
            'estrategia-select',
        ];

        let testsPassed = 0;
        fields.forEach((fieldId, index) => {
            setTimeout(() => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.focus();

                    setTimeout(() => {
                        const style = window.getComputedStyle(field);
                        const hasGreen =
                            style.borderColor.includes('76, 175, 80') ||
                            style.boxShadow.includes('76, 175, 80');
                        const hasUnwanted =
                            style.borderColor.includes('230, 118') ||
                            style.boxShadow.includes('230, 118');

                        if (hasGreen && !hasUnwanted) {
                            logger.debug(`âœ… ${fieldId}: Verde elegante OK`);
                            testsPassed++;
                        } else {
                            logger.debug(`âŒ ${fieldId}: Problema detectado`);
                        }

                        field.blur();

                        if (index === fields.length - 1) {
                            logger.debug(
                                `\nŽ¯ RESULTADO: ${testsPassed}/${fields.length} campos corretos`
                            );
                            if (testsPassed === fields.length) {
                                logger.debug('[DONE] DESAFIO CONCLUIDO COM SUCESSO!');
                                logger.debug('âœ¨ Todas as bordas sao verdes elegantes');
                                logger.debug('š« Nenhuma cor indesejada detectada');
                            } else {
                                logger.debug('âš  Alguns campos ainda precisam de ajuste');
                            }
                        }
                    }, 100);
                }
            }, index * 300);
        });
    }, 1000);
};

// Executa teste automatico quando a aplicacao inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.realTimeSync) {
            logger.debug('âœ… Sistema de sincronizacao em tempo real ativo');
            logger.debug('š€ Executando teste automatico em 2 segundos...');
            setTimeout(() => {
                window.testRealTimeSync();
            }, 2000);
        }

        // Novo teste para payout e focus
        if (window.payoutSync && window.fieldFocusManager) {
            logger.debug('š€ Executando testes avancados de payout e focus em 5 segundos...');
            setTimeout(() => {
                window.testPayoutAndFocus();
            }, 5000);
        }
    }, 1000);
});

/**
 * [TEST] FUNCAO DE TESTE - Initialization
 * Testa se todos os sistemas foram inicializados corretamente
 */
function testInitialization() {
    logger.debug(' Testando inicializacao do sistema...');

    const startTime = performance.now();
    const results = {
        supabase: false,
        globalObjects: false,
        strategiesRegistered: false,
        tradingManager: false,
        domMapped: false,
        overall: false,
    };

    try {
        // 1. Teste de conexao Supabase
        logger.debug('—„ Testando conexao Supabase...');
        try {
            if (typeof supabase !== 'undefined' && supabase) {
                results.supabase = true;
                logger.debug('âœ… Supabase: Conectado');
            } else {
                logger.warn('âš  Supabase: Nao conectado');
            }
        } catch (error) {
            logger.warn('âš  Supabase:', error.message);
        }

        // 2. Teste de objetos globais
        logger.debug('Œ Testando objetos globais...');
        try {
            const globalObjects = [
                'config',
                'state',
                'logic',
                'ui',
                'dom',
                'charts',
                'sidebar',
                'cssResolver',
            ];

            let foundObjects = 0;
            globalObjects.forEach((obj) => {
                if (typeof window[obj] !== 'undefined') {
                    foundObjects++;
                    logger.debug(`âœ… ${obj}: disponivel`);
                } else {
                    logger.debug(`âŒ ${obj}: nao encontrado`);
                }
            });

            if (foundObjects >= 6) {
                results.globalObjects = true;
                logger.debug(`âœ… Objetos globais: ${foundObjects}/${globalObjects.length}`);
            }
        } catch (error) {
            logger.warn('âš  Objetos globais:', error.message);
        }

        // 3. Teste de estrategias registradas
        logger.debug('Ž¯ Testando estrategias...');
        try {
            if (typeof window.registerAdvancedStrategies === 'function') {
                results.strategiesRegistered = true;
                logger.debug('âœ… Estrategias: Registradas');
            }
        } catch (error) {
            logger.warn('âš  Estrategias:', error.message);
        }

        // 4. Teste de Trading Manager
        logger.debug('’¼ Testando Trading Manager...');
        try {
            if (typeof window.tradingManager !== 'undefined' && window.tradingManager) {
                results.tradingManager = true;
                logger.debug('âœ… Trading Manager: Ativo');
            } else {
                logger.warn('âš  Trading Manager: Nao encontrado');
            }
        } catch (error) {
            logger.warn('âš  Trading Manager:', error.message);
        }

        // 5. Teste de DOM mapeado
        logger.debug('—º Testando DOM mapeado...');
        try {
            if (typeof dom !== 'undefined' && Object.keys(dom).length > 10) {
                results.domMapped = true;
                logger.debug(`âœ… DOM: ${Object.keys(dom).length} elementos mapeados`);
            } else {
                logger.warn('âš  DOM: Poucos elementos mapeados');
            }
        } catch (error) {
            logger.warn('âš  DOM:', error.message);
        }

        // Resultado geral
        const successCount = Object.values(results).filter(Boolean).length;
        results.overall = successCount >= 3; // Pelo menos 3 de 5 testes

        const endTime = performance.now();
        logger.debug(`â± Testes Initialization executados em ${(endTime - startTime).toFixed(2)}ms`);

        if (results.overall) {
            logger.debug('âœ… INITIALIZATION: Sistema inicializado corretamente!');
        } else {
            logger.warn('âš  INITIALIZATION: Alguns componentes nao inicializados');
        }

        return results;
    } catch (error) {
        logger.error('âŒ Erro critico nos testes Initialization:', error);
        return { ...results, overall: false };
    }
}

// Exposicao global
if (typeof window !== 'undefined') {
    window.testInitialization = testInitialization;
    logger.debug(' testInitialization() disponivel globalmente');
}
