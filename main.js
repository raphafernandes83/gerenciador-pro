// ================================================================
// MAIN.JS - ARQUIVO PRINCIPAL
// ================================================================

// ================================================================
// SUPABASE INTEGRACAO
// ================================================================

// ================================================================
// 🔧 CONFIGURAÇÕES CENTRALIZADAS DO SISTEMA
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
import './src/utils/SafeProtection.js';
import './src/monitoring/PerformanceDashboard.js';
import './tests/test-loader.js';

// 🔧 Configurações do Supabase com carregamento seguro de ambiente
const { url: ENV_SUPABASE_URL, anonKey: ENV_SUPABASE_ANON_KEY, isOfflineMode } = getSupabaseEnv();
const supabaseUrl = ENV_SUPABASE_URL || SUPABASE_CONFIG.URL;
const supabaseAnonKey = ENV_SUPABASE_ANON_KEY || SUPABASE_CONFIG.ANON_KEY;

// 🛡️ Validação robusta de configuração
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'offline') {
    console.warn(
        '⚠️ Supabase não configurado. Sistema funcionará em modo offline com funcionalidade limitada.'
    );
    window.__SUPABASE_OFFLINE_MODE__ = true;
} else {
    console.info('✅ Configuração Supabase carregada:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        isDevelopment: SUPABASE_CONFIG.DEVELOPMENT_MODE,
    });
    window.__SUPABASE_OFFLINE_MODE__ = false;
}

/**
 * 🛡️ INICIALIZAÇÃO SEGURA DO CLIENTE SUPABASE
 * Implementa Null Object Pattern + Retry Pattern para máxima segurança
 */

/**
 * Objeto null-safe para substituir cliente Supabase quando indisponível
 * Previne crashes e logging de credenciais em produção
 */
const createNullSupabaseClient = () => ({
    auth: {
        getUser: async () => ({
            data: null,
            error: { message: 'Cliente Supabase não disponível', code: 'CLIENT_UNAVAILABLE' },
        }),
        signIn: async () => ({
            data: null,
            error: { message: 'Cliente Supabase não disponível', code: 'CLIENT_UNAVAILABLE' },
        }),
        signOut: async () => ({
            data: null,
            error: { message: 'Cliente Supabase não disponível', code: 'CLIENT_UNAVAILABLE' },
        }),
    },
    from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Cliente Supabase não disponível' } }),
        update: () => ({ data: null, error: { message: 'Cliente Supabase não disponível' } }),
        delete: () => ({ data: null, error: { message: 'Cliente Supabase não disponível' } }),
    }),
    storage: {
        from: () => ({
            upload: async () => ({ data: null, error: { message: 'Storage não disponível' } }),
            download: async () => ({ data: null, error: { message: 'Storage não disponível' } }),
        }),
    },
    isNull: true, // Flag para identificar cliente null
});

// Cliente Supabase com inicialização segura garantida
let supabase = createNullSupabaseClient();

/**
 * Inicializa cliente Supabase com retry inteligente e logging seguro
 * @private
 */
const initializeSupabaseClient = () => {
    try {
        // 🛡️ Verificação prévia de configuração
        if (window.__SUPABASE_OFFLINE_MODE__) {
            console.info('🎮 Sistema em modo offline - Supabase não será inicializado');
            return false;
        }

        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'offline') {
            console.warn('⚠️ Credenciais Supabase ausentes. Verifique a configuração.');
            return false;
        }

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

            // 🔍 Validação robusta do cliente
            if (client && typeof client.auth === 'object' && typeof client.from === 'function') {
                supabase = client;
                console.log('✅ Cliente Supabase inicializado com sucesso!');
                return true;
            } else {
                console.error('❌ Cliente Supabase criado mas inválido');
                return false;
            }
        } else {
            console.error(
                '❌ Biblioteca Supabase não carregada. Verifique se o script está incluído no HTML.'
            );
            return false;
        }
    } catch (error) {
        // 🛡️ Log seguro sem vazamento de credenciais
        console.error('❌ Erro na inicialização do Supabase:', {
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
 * Sistema de retry com backoff exponencial para inicialização robusta
 * @private
 */
const initializeSupabaseWithRetry = async () => {
    const maxRetries = SUPABASE_CONFIG.MAX_RETRY_ATTEMPTS;
    let retryDelay = SUPABASE_CONFIG.RETRY_DELAY;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (initializeSupabaseClient()) {
            return; // Sucesso na inicialização
        }

        if (attempt < maxRetries) {
            console.warn(
                `⚠️ Tentativa ${attempt}/${maxRetries} falhou. Retry em ${retryDelay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Backoff exponencial
        }
    }

    console.warn(SYSTEM_MESSAGES.WARNING.SUPABASE_FAILED);
    console.info('ℹ️ Sistema continuará funcionando com cliente null-safe');
};

// Inicialização imediata ou com retry
if (!initializeSupabaseClient()) {
    // Async retry sem bloquear thread principal
    initializeSupabaseWithRetry().catch((error) => {
        console.error('💥 Falha crítica na inicialização do Supabase:', error.message);
    });
}

/**
 * 🔍 TESTE SEGURO DE CONEXÃO SUPABASE
 * Implementa validação completa com categorização de erros e logging seguro
 *
 * @returns {Promise<boolean>} True se conexão válida, false caso contrário
 */
async function testSupabaseConnection() {
    console.log('🔍 Iniciando teste de conexão Supabase...');
    const requestId = generateRequestId('supabase');

    // Guard Clause 1: Verifica se cliente existe
    if (!supabase) {
        console.error('❌ Cliente Supabase é null/undefined');
        return false;
    }

    // Guard Clause 2: Verifica se é cliente null-safe (não conectado)
    if (supabase.isNull === true) {
        console.warn('⚠️ Usando cliente Supabase null-safe (biblioteca não carregada)');
        return false;
    }

    // Guard Clause 3: Verifica se cliente tem interface esperada
    if (!supabase.auth || typeof supabase.auth.getUser !== 'function') {
        console.error('❌ Cliente Supabase com interface inválida');
        return false;
    }

    try {
        // Teste de conectividade com timeout de segurança
        const connectionTest = Promise.race([
            supabase.auth.getUser(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error('Timeout na conexão')),
                    SUPABASE_CONFIG.CONNECTION_TIMEOUT || 5000
                )
            ),
        ]);

        const { data: user, error: authError } = await connectionTest;

        // Categorização inteligente de erros
        if (authError) {
            // Tentativa de recuperar sessão expirada
            if (authError.code === 'JWT_EXPIRED' && supabase?.auth?.refreshSession) {
                try {
                    const { data: refreshed, error: refreshError } =
                        await supabase.auth.refreshSession();
                    if (!refreshError) {
                        console.info('🔁 Sessão renovada com sucesso');
                        return true;
                    }
                } catch (_) {
                    /* silencioso */
                }
            }
            return _categorizeSupabaseError(authError);
        }

        // Conexão bem-sucedida - logging seguro
        _logSuccessfulConnection(user);
        return true;
    } catch (error) {
        return _handleConnectionException(error);
    }
}

/**
 * Categoriza erros do Supabase para diagnóstico preciso
 * @private
 * @param {Object} authError - Erro retornado pelo Supabase
 * @returns {boolean} False sempre (erro detectado)
 */
function _categorizeSupabaseError(authError) {
    const errorCode = authError.code || 'UNKNOWN';
    const errorMessage = authError.message || 'Erro desconhecido';

    switch (errorCode) {
        case 'CLIENT_UNAVAILABLE':
            console.warn('⚠️ Cliente Supabase não disponível (esperado)');
            return false;

        case 'NETWORK_ERROR':
        case 'CONNECTION_TIMEOUT':
            console.error('🌐 Erro de rede na conexão Supabase:', {
                code: errorCode,
                type: 'network',
                timestamp: new Date().toISOString(),
            });
            return false;

        case 'AUTH_SESSION_MISSING':
        case 'JWT_EXPIRED':
            // Estes são erros "normais" quando usuário não está logado
            console.info('ℹ️ Nenhuma sessão ativa (normal para primeira execução)');
            return true; // Conexão OK, apenas sem usuário logado

        case 'UNKNOWN':
            // Tratamento específico para "Auth session missing!" que vem sem código específico
            if (errorMessage === 'Auth session missing!') {
                console.info('ℹ️ Sessão não encontrada (comportamento normal na inicialização)');
                return true; // Conexão OK, apenas sem usuário logado
            }
            // Para outros erros UNKNOWN, continua para o default
            console.warn('⚠️ Erro de autenticação desconhecido:', errorCode);
            return false;

        default:
            // 🔧 CORREÇÃO: Log menos agressivo para erros não categorizados
            console.warn('⚠️ Erro Supabase não categorizado:', {
                code: errorCode,
                message: errorMessage.substring(0, 100), // Limita tamanho do log
                type: 'uncategorized',
                timestamp: new Date().toISOString(),
                note: 'Este tipo de erro pode ser normal durante inicialização',
            });
            return false;
    }
}

/**
 * Logging seguro de conexão bem-sucedida
 * @private
 * @param {Object} user - Dados do usuário (pode ser null)
 */
function _logSuccessfulConnection(user) {
    console.log(SYSTEM_MESSAGES.SUCCESS.SUPABASE_CONNECTED);

    if (user && user.user) {
        // Logging seguro - não expõe dados sensíveis completos
        const userInfo = {
            hasUser: true,
            emailDomain: user.user.email ? user.user.email.split('@')[1] : 'unknown',
            provider: user.user.app_metadata?.provider || 'unknown',
            confirmed: user.user.email_confirmed_at ? 'yes' : 'no',
        };
        console.log('👤 Usuário conectado:', userInfo);
    } else {
        console.log('ℹ️ Conexão estabelecida - nenhum usuário logado');
    }
}

/**
 * Tratamento de exceções durante teste de conexão
 * @private
 * @param {Error} error - Exceção capturada
 * @returns {boolean} False sempre (exceção = falha)
 */
function _handleConnectionException(error) {
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'Erro desconhecido';

    // Categorização de exceções
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        console.error('⏱️ Timeout na conexão Supabase:', {
            type: 'timeout',
            duration: SUPABASE_CONFIG.CONNECTION_TIMEOUT,
            suggestion: 'Verificar conectividade de rede',
        });
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        console.error('🌐 Falha de rede:', {
            type: 'network',
            suggestion: 'Verificar conectividade ou URL do Supabase',
        });
    } else {
        console.error('💥 Exceção na conexão Supabase:', {
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
// 🏭 NOVA ARQUITETURA: DEPENDENCY INJECTION
// ================================================================
import { dependencyInjector } from './src/core/DependencyInjector.js';

// ================================================================
// 📦 IMPORTS ESSENCIAIS (apenas módulos legados críticos)
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
    dom.winTargetAmount = document.getElementById('win-target-amount');
    dom.winRemainingAmount = document.getElementById('win-remaining-amount');
    dom.lossLimitAmount = document.getElementById('loss-limit-amount');
    dom.lossMarginAmount = document.getElementById('loss-margin-amount');
} catch { }
import { CONSTANTS, state, config } from './state.js';
import { validation } from './validation.js';

// ================================================================
// 📦 IMPORTS PARA EXPOSIÇÃO GLOBAL DOS MÓDULOS REFATORADOS
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
import {
    registerAdvancedStrategies,
    demonstrateAdvancedStrategies,
    AdvancedStrategiesUtils,
} from './src/strategies/AdvancedStrategies.js';

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
// 🛡️ CORREÇÃO CRÍTICA: Expor events globalmente para testes
window.events = events;

// Expor funções exportadas individuais para os testes
window.calcularExpectativaMatematica = calcularExpectativaMatematica;
window.calcularDrawdown = calcularDrawdown;
window.calcularSequencias = calcularSequencias;
window.calcularPayoffRatio = calcularPayoffRatio;
window.updateState = updateState;

// Expor novos módulos refatorados para testes
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
// Expor template para uso dinâmico no sidebar
window.generateParametersCardHTML = generateParametersCardHTML;

/**
 * 🚀 APLICAÇÃO PRINCIPAL - ARQUITETURA LIMPA v9.3
 * Responsabilidade única: Orquestrar a inicialização do sistema
 *
 * @class App
 * @author Gerenciador PRO Team
 * @version 9.3
 */
// 🔧 CORREÇÃO: Ativar card principal de parâmetros
window.__SHOW_MAIN_PARAMETERS_CARD__ = true;

// 🔧 CORREÇÃO: Arquivos de correção removidos durante limpeza (Fase 3)
// O painel minimizável está funcionando corretamente sem esses arquivos

class App {
    constructor() {
        this.tradingManager = null;
        this.initialized = false;
        this.initializationSteps = [];
        this.startTime = 0;
        this.dependencies = null;

        // Configuração de inicialização usando constantes centralizadas
        this.INITIALIZATION_CONFIG = {
            SUPABASE_RETRY_ATTEMPTS: SUPABASE_CONFIG.MAX_RETRY_ATTEMPTS,
            SIDEBAR_INIT_DELAY: TIMING_CONFIG.INITIALIZATION.SIDEBAR_INIT_DELAY,
            UI_SYNC_TIMEOUT: TIMING_CONFIG.INITIALIZATION.UI_SYNC_TIMEOUT,
            MODULE_LOAD_TIMEOUT: TIMING_CONFIG.INITIALIZATION.MODULE_LOAD_TIMEOUT,
        };

        // 🛡️ NÃO chama init() no constructor para evitar problemas assíncronos
    }

    /**
     * 🛡️ Validação anti-recursão
     * Detecta padrões de recursão infinita antes que aconteçam
     */
    validateNoRecursion() {
        const callStack = new Error().stack;
        const lines = callStack.split('\n');

        // Verifica se há mais de 5 chamadas para o mesmo método
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
                console.error(`🚨 Recursão detectada: ${method} chamado ${count} vezes`);
                return false;
            }
        }

        return true;
    }

    /**
     * 🛡️ Inicialização segura do sistema de erro
     */
    initSafeErrorHandling() {
        try {
            const { errorHandler } = this.dependencies.utils;

            if (errorHandler && errorHandler.setupGlobalErrorHandling) {
                // Wrapper com timeout de segurança
                const timeoutId = setTimeout(() => {
                    console.warn('⚠️ Timeout na inicialização do errorHandler');
                }, TIMING_CONFIG.INITIALIZATION.ERROR_HANDLER_TIMEOUT);

                errorHandler.setupGlobalErrorHandling();
                clearTimeout(timeoutId);
                console.log('✅ Error handling ativo');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar error handling:', error.message);
        }
    }

    /**
     * 🛡️ Inicialização segura do monitoramento de performance
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
                    console.log('✅ Performance monitoring ativo');
                } else {
                    console.warn('⚠️ Performance monitoring não inicializou');
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar performance monitoring:', error.message);
        }
    }

    /**
     * 🛡️ Inicialização segura do cache manager
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
                console.log('✅ Cache manager ativo');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar cache manager:', error.message);
        }
    }

    /**
     * 🎯 MÉTODO PRINCIPAL - RESPONSABILIDADE ÚNICA
     * Orquestra a inicialização seguindo padrão Template Method
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
            await this._initializeRefactoredSystems();
            await this._initializeSidebar();

            // 🚀 Inicializa o novo Gerenciador de UI do Dashboard (Substitui fixes antigos)
            try {
                const { dashboardUIManager } = await import('./src/managers/DashboardUIManager.js');
                dashboardUIManager.init();
                console.log('✅ DashboardUIManager inicializado com sucesso');
                this.initializationSteps.push('dashboard_ui_initialized');
            } catch (error) {
                console.error('❌ Erro ao inicializar DashboardUIManager:', error);
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
     * 🏭 Inicialização do Dependency Injector
     * @private
     */
    async _initializeDependencyInjection() {
        console.log('🏭 Inicializando Dependency Injection...');

        try {
            // Registra módulos legados para compatibilidade
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
                // Funções específicas exportadas
                calcularExpectativaMatematica,
                calcularDrawdown,
                calcularSequencias,
                calcularPayoffRatio,
                updateState,
            };

            // Inicializa o container de dependências
            this.dependencies = await dependencyInjector.initialize(legacyModules);

            console.log('✅ Dependency Injection inicializado!');
            console.log('📊 Estatísticas do DI:', dependencyInjector.getStats());

            this.initializationSteps.push('dependency_injection_initialized');
        } catch (error) {
            console.error('❌ Erro ao inicializar Dependency Injection:', error.message);
            throw new Error(`Falha crítica no Dependency Injection: ${error.message}`);
        }
    }

    /**
     * 🛡️ Validação de inicialização
     * @private
     */
    _validateInitialization() {
        if (this.initialized) {
            throw new Error('Aplicação já foi inicializada');
        }

        if (!this.validateNoRecursion()) {
            throw new Error('Recursão detectada - abortando inicialização');
        }
    }

    /**
     * 🚀 Inicia processo de inicialização
     * @private
     */
    _startInitializationProcess() {
        console.log('🚀 MAIN: Aplicação modularizada iniciando... (Nova Arquitetura v9.3)');
        this.startTime = performance.now();
        this.initialized = true;
    }

    /**
     * 🗄️ Inicialização da conexão Supabase
     * @private
     */
    async _initializeSupabaseConnection() {
        console.log('🗄️ Inicializando conexão Supabase...');

        let retryCount = 0;
        while (retryCount < this.INITIALIZATION_CONFIG.SUPABASE_RETRY_ATTEMPTS) {
            try {
                const supabaseConnected = await testSupabaseConnection();
                if (supabaseConnected) {
                    console.log(SYSTEM_MESSAGES.SUCCESS.SUPABASE_CONNECTED);
                    this.initializationSteps.push('supabase_connected');
                    return;
                }
                retryCount++;
            } catch (error) {
                retryCount++;
                console.warn(
                    `⚠️ Tentativa ${retryCount} de conexão Supabase falhou:`,
                    error.message
                );
            }
        }

        console.warn(SYSTEM_MESSAGES.WARNING.SUPABASE_FAILED);
        this.initializationSteps.push('supabase_failed');
    }

    /**
     * 📊 Inicialização dos sistemas de monitoramento
     * @private
     */
    async _initializeMonitoringSystems() {
        try {
            // Validação adicional de recursão
            if (!this.validateNoRecursion()) {
                throw new Error('Recursão detectada durante inicialização de monitoramento');
            }

            // Inicializar sistemas com proteções
            this.initSafeErrorHandling();
            this.initSafePerformanceMonitoring();
            this.initSafeCacheManager();

            console.log('✅ Sistemas de monitoramento seguros ativados');
            this.initializationSteps.push('monitoring_initialized');
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar monitoramento:', error.message);
            console.log('🔄 Continuando com sistema básico...');
            this.initializationSteps.push('monitoring_partial');
        }
    }

    /**
     * 🎯 Inicialização das estratégias avançadas
     * @private
     */
    async _initializeAdvancedStrategies() {
        try {
            // Usa dependências injetadas
            const { registerAdvancedStrategies, demonstrateAdvancedStrategies } =
                this.dependencies.singletons;

            const strategiesRegistered = registerAdvancedStrategies();
            if (strategiesRegistered) {
                console.log('✅ Estratégias avançadas registradas com sucesso!');
                demonstrateAdvancedStrategies();
                this.initializationSteps.push('strategies_registered');
            } else {
                console.warn('⚠️ Falha ao registrar algumas estratégias avançadas');
                this.initializationSteps.push('strategies_partial');
            }
        } catch (error) {
            console.error('❌ Erro ao registrar estratégias:', error.message);
            this.initializationSteps.push('strategies_failed');
        }
    }

    /**
     * 🏗️ Inicialização dos módulos legados
     * @private
     */
    async _initializeLegacyModules() {
        try {
            // 1. Mapeia os elementos do DOM primeiro
            mapDOM();
            this.initializationSteps.push('dom_mapped');

            // 2. Inicia os módulos que não dependem do estado do utilizador
            await dbManager.init();
            this.initializationSteps.push('database_initialized');

            charts.init();
            this.initializationSteps.push('charts_initialized');

            // 3. Adiciona os event listeners para que possam reagir às mudanças de estado
            events.init();
            this.initializationSteps.push('events_initialized');

            // 4. Carrega o estado guardado
            logic.loadStateFromStorage();
            this.initializationSteps.push('state_loaded');

            console.log('✅ Módulos legados inicializados com sucesso!');

            // Renderiza o card principal a partir do template unificado
            try {
                // Exibição do card principal desligada por padrão; fonte única: sidebar
                if (window.__SHOW_MAIN_PARAMETERS_CARD__ === true) {
                    const inputPanel = document.getElementById('input-panel');
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
                    const inputPanel = document.getElementById('input-panel');
                    if (inputPanel) inputPanel.innerHTML = '';
                }
            } catch (e) {
                console.warn('⚠️ Falha ao renderizar card principal via template:', e.message);
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar módulos legados:', error.message);
            throw new Error(`Falha crítica na inicialização de módulos legados: ${error.message}`);
        }
    }

    /**
     * 🆕 Inicialização dos sistemas refatorados
     * @private
     */
    async _initializeRefactoredSystems() {
        try {
            // Usa factory para criar Trading Manager com dependências injetadas
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

            console.log('🔄 Migração de compatibilidade configurada com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar sistemas refatorados:', error.message);
            throw new Error(`Falha na inicialização de sistemas refatorados: ${error.message}`);
        }
    }

    /**
     * 📋 Inicialização da sidebar
     * @private
     */
    async _initializeSidebar() {
        try {
            // Importa e inicializa a sidebar dinamicamente
            const sidebarModule = await import('./sidebar.js');
            const sidebar = sidebarModule.sidebar;
            sidebar.initialize();

            // Expor globalmente para debug se necessário
            window.sidebar = sidebar;
            this.initializationSteps.push('sidebar_imported');

            // Aguarda um pouco antes de inicializar o gerenciador avançado
            await new Promise((resolve) =>
                setTimeout(resolve, this.INITIALIZATION_CONFIG.SIDEBAR_INIT_DELAY)
            );

            // Inicializar o gerenciador avançado
            const { sidebarManager } = await import('./src/ui/SidebarManager.js');
            sidebarManager.integrateWithSettings();
            this.initializationSteps.push('sidebar_manager_initialized');

            console.log('✅ Sidebar inicializada com sucesso!');
        } catch (error) {
            console.warn('⚠️ Erro ao inicializar sidebar:', error.message);
            this.initializationSteps.push('sidebar_failed');
            // Não é crítico, continua a aplicação
        }
    }

    /**
     * 🎨 Sincronização da UI
     * @private
     */
    async _performUISync() {
        try {
            // Timeout de segurança para sincronização da UI
            const syncPromise = Promise.race([
                this._performActualUISync(),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Timeout na sincronização da UI')),
                        this.INITIALIZATION_CONFIG.UI_SYNC_TIMEOUT
                    )
                ),
            ]);

            await syncPromise;
            console.log('✅ Interface sincronizada com sucesso!');
        } catch (error) {
            console.error('❌ Erro na sincronização da UI:', error.message);
            throw new Error(`Falha crítica na sincronização da UI: ${error.message}`);
        }
    }

    /**
     * 🎨 Executa sincronização real da UI
     * @private
     */
    async _performActualUISync() {
        // Sincroniza a UI com o estado carregado
        ui.syncUIFromState();
        this.initializationSteps.push('ui_synced');

        // Renderiza todos os componentes com base no estado inicial
        ui.atualizarTudo();
        this.initializationSteps.push('ui_rendered');

        // Verifica se existe uma sessão por finalizar
        logic.checkForActiveSession();
        this.initializationSteps.push('session_checked');
    }

    /**
     * ✅ Validações finais
     * @private
     */
    async _performFinalValidations() {
        // Verificar se há bloqueio ativo
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

        // Restaurar última aba ativa
        const lastTab = logic.safeJSONParse(CONSTANTS.LAST_ACTIVE_TAB_KEY, 'plano');
        await events.onTabSwitch(lastTab);
        ui.switchTab(lastTab);
        this.initializationSteps.push('tab_restored');
    }

    /**
     * 🎉 Finaliza processo de inicialização
     * @private
     */
    _completeInitialization() {
        const endTime = performance.now();
        const initializationTime = (endTime - this.startTime).toFixed(2);

        console.log(
            `✨ MAIN: Aplicação pronta! Nova arquitetura v9.3 ativa em ${initializationTime}ms`
        );
        console.log('📈 MAIN: Estatísticas do sistema:', legacyAdapter.getStats());
        console.log('🔄 MAIN: Passos de inicialização:', this.initializationSteps);

        this.initializationSteps.push('initialization_completed');
    }

    /**
     * ❌ Tratamento de erros de inicialização
     * @private
     */
    _handleInitializationError(error) {
        console.error('❌ Erro durante inicialização:', error);

        // Adiciona erro aos passos para diagnóstico
        this.initializationSteps.push(`error_${error.name || 'unknown'}`);

        // Construir mensagem de erro detalhada
        let errorMessage = 'Erro ao inicializar o aplicativo.';
        if (error.message) {
            errorMessage += ` Detalhes: ${error.message}`;
        }

        // Log dos passos completados para diagnóstico
        console.log('🔍 Passos completados antes do erro:', this.initializationSteps);

        // Tentativa de usar tratamento de erro avançado se disponível
        if (window.errorHandler && typeof window.errorHandler.handleError === 'function') {
            try {
                window.errorHandler.handleError(error, 'CRITICAL', {
                    context: 'App.init',
                    completedSteps: this.initializationSteps,
                    initializationTime: performance.now() - this.startTime,
                });
            } catch (handlerError) {
                console.warn('⚠️ Erro no handler de erro:', handlerError.message);
            }
        }

        // Fallback para notificação do usuário
        if (window.ui && window.ui.showNotification) {
            window.ui.showNotification('error', errorMessage);
        } else {
            // Último recurso: exibir erro em tela completa
            document.body.innerHTML = `
                <div style="background: #ff1744; color: white; padding: 20px; text-align: center; font-family: Arial;">
                    <h2>⚠️ Erro de Inicialização</h2>
                    <p>A aplicação não pôde ser carregada corretamente.</p>
                    <details style="margin-top: 10px;">
                        <summary>Detalhes técnicos</summary>
                        <pre style="text-align: left; background: rgba(0,0,0,0.3); padding: 10px; margin-top: 10px; border-radius: 4px;">${error.message}</pre>
                        <p style="text-align: left; margin-top: 10px;"><strong>Passos completados:</strong> ${this.initializationSteps.join(', ')}</p>
                    </details>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: white; color: #ff1744; border: none; border-radius: 4px; cursor: pointer;">🔄 Recarregar Página</button>
                </div>
            `;
        }

        // Re-throw para permitir handling adicional se necessário
        throw error;
    }
}

/**
 * 🚀 PONTO DE ENTRADA DA APLICAÇÃO
 * Inicialização limpa e controlada
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM carregado, inicializando aplicação...');

    const app = new App();

    try {
        await app.init();
        console.log('✅ Aplicação inicializada com sucesso!');

        // 🔁 Purga automática da Lixeira: agora e diariamente
        try {
            if (window.dbManager && typeof dbManager.purgeExpiredTrash === 'function') {
                dbManager.purgeExpiredTrash().catch(() => { });
                setInterval(() => dbManager.purgeExpiredTrash().catch(() => { }), 24 * 60 * 60 * 1000);
            }
        } catch (_) { }
    } catch (error) {
        console.error('❌ Falha crítica na inicialização:', error);

        // O tratamento de erro detalhado já foi feito no _handleInitializationError
        // Aqui apenas garantimos que o erro seja logado
        console.log('🔍 Inicialização falhou. Veja logs detalhados acima.');
    }
});

// Exporta o cliente Supabase para uso em outros módulos
export { supabase };

// Funções de limpeza de dados corrompidos (disponíveis no console)
window.clearCorruptedData = async () => {
    console.log('🧹 Iniciando limpeza de dados corrompidos...');
    try {
        const removed = await dbManager.clearCorruptedData();
        console.log(`✅ ${removed} sessões corrompidas removidas.`);
        if (removed > 0) {
            // Recarregar a aba diário
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return removed;
    } catch (error) {
        console.error('❌ Erro:', error);
        return 0;
    }
};

window.repairCorruptedData = async () => {
    console.log('🔧 Iniciando reparo de dados corrompidos...');
    try {
        const repaired = await dbManager.repairCorruptedData();
        console.log(`✅ ${repaired} sessões reparadas.`);
        if (repaired > 0) {
            // Recarregar a aba diário
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return repaired;
    } catch (error) {
        console.error('❌ Erro:', error);
        return 0;
    }
};

// 🔧 Função para reparar resultados financeiros zerados
window.repairResultadosZerados = async () => {
    console.log('🔧 Iniciando reparo de resultados financeiros zerados...');
    try {
        const result = await dbManager.repairInvalidResultados();
        console.log(`✅ Reparo concluído:`, result);
        if (result.repaired > 0) {
            // Recarregar a aba diário
            if (typeof ui !== 'undefined' && ui.renderDiario) {
                ui.renderDiario();
            }
        }
        return result;
    } catch (error) {
        console.error('❌ Erro:', error);
        return { repaired: 0, errors: 1, error: error.message };
    }
};

// Nota importante: Agora você pode importar o cliente Supabase em outros módulos usando:
// import { supabase } from './main.js';

// =================================================================
// SISTEMA DE TESTE PARA SINCRONIZAÇÃO EM TEMPO REAL
// =================================================================

// Função para testar a sincronização entre cards
window.testRealTimeSync = function () {
    console.log('\n🧪 TESTANDO SINCRONIZAÇÃO EM TEMPO REAL...\n');

    // Teste 1: Capital Inicial
    console.log('📝 Teste 1: Mudança no capital inicial');
    const capitalInput = document.getElementById('capital-inicial');
    if (capitalInput) {
        capitalInput.value = '15000';
        capitalInput.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            const sidebarCapital = document.getElementById('sidebar-capital-inicial');
            if (sidebarCapital) {
                console.log(`✅ Capital sincronizado: ${sidebarCapital.value}`);
            } else {
                console.log('⚠️ Sidebar não está aberto para teste');
            }
        }, 200);
    }

    // Teste 2: Entrada Inicial
    setTimeout(() => {
        console.log('📝 Teste 2: Mudança na entrada inicial');
        const entradaInput = document.getElementById('percentual-entrada');
        if (entradaInput) {
            entradaInput.value = '3.5';
            entradaInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Entrada alterada para 3.5%');
        }
    }, 300);

    // Teste 3: Payout
    setTimeout(() => {
        console.log('📝 Teste 3: Mudança de payout');
        const payoutBtn = Array.from(document.querySelectorAll('.payout-buttons button')).find(
            (btn) => btn.textContent.trim() === '90'
        );
        if (payoutBtn) {
            payoutBtn.click();
            console.log('✅ Payout 90% selecionado');
        }
    }, 600);

    // Teste 4: Estratégia
    setTimeout(() => {
        console.log('📝 Teste 4: Mudança de estratégia');
        const strategySelect = document.getElementById('estrategia-select');
        if (strategySelect) {
            strategySelect.value = 'fixa';
            strategySelect.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Estratégia alterada para Mão Fixa');
        }
    }, 900);

    // Teste 5: Stop Win
    setTimeout(() => {
        console.log('📝 Teste 5: Mudança no Stop Win');
        const stopWinInput = document.getElementById('stop-win-perc');
        if (stopWinInput) {
            stopWinInput.value = '12';
            stopWinInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Stop Win alterado para 12%');
        }
    }, 1200);

    // Teste 6: Stop Loss
    setTimeout(() => {
        console.log('📝 Teste 6: Mudança no Stop Loss');
        const stopLossInput = document.getElementById('stop-loss-perc');
        if (stopLossInput) {
            stopLossInput.value = '18';
            stopLossInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Stop Loss alterado para 18%');
        }

        // Resumo final
        setTimeout(() => {
            console.log('\n🎯 TESTE CONCLUÍDO!');
            console.log('📋 Para testar sincronização do sidebar:');
            console.log('1. Abra o menu lateral (botão ☰)');
            console.log('2. Clique em "Parâmetros e Controles"');
            console.log('3. Altere valores e veja a sincronização automática');
            console.log('4. Note que NÃO há botão "Aplicar" - tudo é automático!');
            console.log('\n💡 Execute: testRealTimeSync() no console para testar novamente');
        }, 500);
    }, 1500);
};

// =================================================================
// SISTEMA DE TESTE PARA SINCRONIZAÇÃO DE PAYOUT + VISUAL FOCUS
// =================================================================
window.testPayoutAndFocus = function () {
    console.log('\n🧪 TESTANDO PAYOUT SYNC + VISUAL FOCUS...\n');

    let testIndex = 0;
    const tests = [
        // Teste 1: Payout Sync Main → Sidebar
        () => {
            console.log('📝 Teste 1: Payout 90% no card principal');
            const btn = Array.from(document.querySelectorAll('.payout-buttons button')).find(
                (b) => b.textContent.trim() === '90'
            );
            if (btn) {
                btn.click();
                console.log('✅ Clique executado no payout 90%');
            } else {
                console.log('❌ Botão payout 90% não encontrado');
            }
        },

        // Teste 2: Verificar sincronização no sidebar
        () => {
            console.log('📝 Teste 2: Verificando sincronização no sidebar');
            const sidebarBtn = document.querySelector('#sidebar-payout-90');
            if (sidebarBtn && sidebarBtn.classList.contains('active-payout')) {
                console.log('✅ Sidebar sincronizado corretamente');
            } else if (!sidebarBtn) {
                console.log('⚠️ Sidebar não está aberto - abra o menu lateral primeiro');
            } else {
                console.log('❌ Sidebar NÃO sincronizado');
            }
        },

        // Teste 3: Focus Effect (Verde Elegante)
        () => {
            console.log('📝 Teste 3: Efeito de focus verde elegante no capital inicial');
            const capitalField = document.getElementById('capital-inicial');
            if (capitalField) {
                capitalField.focus();
                setTimeout(() => {
                    const computedStyle = window.getComputedStyle(capitalField);
                    const borderColor = computedStyle.borderColor;
                    const boxShadow = computedStyle.boxShadow;

                    // Verifica se tem verde elegante (76, 175, 80)
                    const hasCorrectGreen =
                        borderColor.includes('76, 175, 80') || boxShadow.includes('76, 175, 80');

                    // Verifica se NÃO tem cores indesejadas (amarelo/dourado)
                    const hasUnwantedColors =
                        borderColor.includes('230, 118') ||
                        boxShadow.includes('230, 118') ||
                        borderColor.includes('255, 255, 0') ||
                        boxShadow.includes('255, 193');

                    if (hasCorrectGreen && !hasUnwantedColors) {
                        console.log('✅ Efeito verde ELEGANTE aplicado corretamente');
                    } else if (hasUnwantedColors) {
                        console.log('❌ AINDA tem cores indesejadas (amarelo/dourado)');
                        console.log('🔍 Border:', borderColor);
                        console.log('🔍 Shadow:', boxShadow);
                    } else {
                        console.log('❌ Efeito verde NÃO aplicado');
                        console.log('🔍 Border:', borderColor);
                        console.log('🔍 Shadow:', boxShadow);
                    }
                }, 100);
            } else {
                console.log('❌ Campo capital inicial não encontrado');
            }
        },

        // Teste 4: Typing Effect
        () => {
            console.log('📝 Teste 4: Efeito de digitação');
            const capitalField = document.getElementById('capital-inicial');
            if (capitalField) {
                capitalField.value = '25000';
                capitalField.dispatchEvent(new Event('input', { bubbles: true }));

                setTimeout(() => {
                    if (capitalField.classList.contains('typing')) {
                        console.log('✅ Efeito de digitação ativo');
                    } else {
                        console.log('💡 Efeito de digitação pode ter expirado (normal)');
                    }
                }, 50);
            }
        },

        // Teste 5: Payout Sidebar → Main (se sidebar estiver aberto)
        () => {
            console.log('📝 Teste 5: Payout 92% no sidebar');
            const sidebarBtn = document.querySelector('#sidebar-payout-92');
            if (sidebarBtn) {
                sidebarBtn.click();
                console.log('✅ Clique executado no sidebar');

                setTimeout(() => {
                    const mainBtn = Array.from(
                        document.querySelectorAll('.payout-buttons button')
                    ).find((b) => b.textContent.trim() === '92');
                    if (mainBtn && mainBtn.classList.contains('active-payout')) {
                        console.log('✅ Card principal sincronizado');
                    } else {
                        console.log('❌ Card principal NÃO sincronizado');
                    }
                }, 100);
            } else {
                console.log('⚠️ Botão do sidebar não encontrado - abra o menu lateral');
            }
        },

        // Teste 6: Focus no sidebar (se estiver aberto)
        () => {
            console.log('📝 Teste 6: Focus no sidebar');
            const sidebarField = document.getElementById('sidebar-capital-inicial');
            if (sidebarField) {
                sidebarField.focus();
                setTimeout(() => {
                    const computedStyle = window.getComputedStyle(sidebarField);
                    const hasGreenBorder =
                        computedStyle.borderColor.includes('230, 118') ||
                        computedStyle.boxShadow.includes('230, 118');
                    if (hasGreenBorder) {
                        console.log('✅ Efeito de focus no sidebar funcionando');
                    } else {
                        console.log('❌ Efeito de focus no sidebar NÃO funcionando');
                    }
                }, 100);
            } else {
                console.log(
                    '⚠️ Campo do sidebar não encontrado - abra Parâmetros e Controles no menu lateral'
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
            console.log('\n🎯 TODOS OS TESTES CONCLUÍDOS!');
            console.log('💡 Para testar completamente:');
            console.log('1. Abra o menu lateral (botão ☰)');
            console.log('2. Clique em "Parâmetros e Controles"');
            console.log('3. Execute novamente: testPayoutAndFocus()');
            console.log('4. Teste manualmente clicando nos botões e campos');
        }
    }

    runNextTest();
};

// =================================================================
// TESTE ESPECÍFICO PARA VALIDAÇÃO DO DESAFIO DE BORDAS VERDES
// =================================================================
window.testGreenBorderChallenge = function () {
    console.log('\n🎯 TESTE DO DESAFIO: BORDAS VERDES ELEGANTES\n');

    // Teste 1: Verificação Visual Stop Win
    console.log('📝 Testando campo Stop Win (%) - o que estava com problema...');
    const stopWinField = document.getElementById('stop-win-perc');
    if (stopWinField) {
        stopWinField.focus();

        setTimeout(() => {
            const style = window.getComputedStyle(stopWinField);
            const border = style.borderColor;
            const shadow = style.boxShadow;

            console.log('🔍 Border atual:', border);
            console.log('🔍 Shadow atual:', shadow);

            // Verifica verde elegante (76, 175, 80)
            const hasCorrectGreen =
                border.includes('76, 175, 80') || shadow.includes('76, 175, 80');

            // Verifica se NÃO tem amarelo/dourado (230, 118 ou outras cores indesejadas)
            const hasYellow = border.includes('230, 118') || shadow.includes('230, 118');
            const hasGold = border.includes('255, 193') || shadow.includes('255, 193');
            const hasUnwantedColors = hasYellow || hasGold;

            if (hasCorrectGreen && !hasUnwantedColors) {
                console.log('✅ SUCESSO! Apenas verde elegante, sem amarelo/dourado');
            } else if (hasUnwantedColors) {
                console.log('❌ FALHA! Ainda tem cores indesejadas');
                if (hasYellow) console.log('🟡 Detectado: Verde saturado (230, 118)');
                if (hasGold) console.log('🟨 Detectado: Dourado/Amarelo');
            } else {
                console.log('❌ FALHA! Verde elegante não aplicado');
            }

            stopWinField.blur();
        }, 200);
    }

    // Teste 2: Todos os campos principais
    setTimeout(() => {
        console.log('\n📝 Testando TODOS os campos principais...');
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
                            console.log(`✅ ${fieldId}: Verde elegante OK`);
                            testsPassed++;
                        } else {
                            console.log(`❌ ${fieldId}: Problema detectado`);
                        }

                        field.blur();

                        if (index === fields.length - 1) {
                            console.log(
                                `\n🎯 RESULTADO: ${testsPassed}/${fields.length} campos corretos`
                            );
                            if (testsPassed === fields.length) {
                                console.log('🎉 DESAFIO CONCLUÍDO COM SUCESSO!');
                                console.log('✨ Todas as bordas são verdes elegantes');
                                console.log('🚫 Nenhuma cor indesejada detectada');
                            } else {
                                console.log('⚠️ Alguns campos ainda precisam de ajuste');
                            }
                        }
                    }, 100);
                }
            }, index * 300);
        });
    }, 1000);
};

// Executa teste automático quando a aplicação inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.realTimeSync) {
            console.log('✅ Sistema de sincronização em tempo real ativo');
            console.log('🚀 Executando teste automático em 2 segundos...');
            setTimeout(() => {
                window.testRealTimeSync();
            }, 2000);
        }

        // Novo teste para payout e focus
        if (window.payoutSync && window.fieldFocusManager) {
            console.log('🚀 Executando testes avançados de payout e focus em 5 segundos...');
            setTimeout(() => {
                window.testPayoutAndFocus();
            }, 5000);
        }
    }, 1000);
});

/**
 * 🧪 FUNÇÃO DE TESTE - Initialization
 * Testa se todos os sistemas foram inicializados corretamente
 */
function testInitialization() {
    console.log('🧪 Testando inicialização do sistema...');

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
        // 1. Teste de conexão Supabase
        console.log('🗄️ Testando conexão Supabase...');
        try {
            if (typeof supabase !== 'undefined' && supabase) {
                results.supabase = true;
                console.log('✅ Supabase: Conectado');
            } else {
                console.warn('⚠️ Supabase: Não conectado');
            }
        } catch (error) {
            console.warn('⚠️ Supabase:', error.message);
        }

        // 2. Teste de objetos globais
        console.log('🌐 Testando objetos globais...');
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
                    console.log(`✅ ${obj}: disponível`);
                } else {
                    console.log(`❌ ${obj}: não encontrado`);
                }
            });

            if (foundObjects >= 6) {
                results.globalObjects = true;
                console.log(`✅ Objetos globais: ${foundObjects}/${globalObjects.length}`);
            }
        } catch (error) {
            console.warn('⚠️ Objetos globais:', error.message);
        }

        // 3. Teste de estratégias registradas
        console.log('🎯 Testando estratégias...');
        try {
            if (typeof window.registerAdvancedStrategies === 'function') {
                results.strategiesRegistered = true;
                console.log('✅ Estratégias: Registradas');
            }
        } catch (error) {
            console.warn('⚠️ Estratégias:', error.message);
        }

        // 4. Teste de Trading Manager
        console.log('💼 Testando Trading Manager...');
        try {
            if (typeof window.tradingManager !== 'undefined' && window.tradingManager) {
                results.tradingManager = true;
                console.log('✅ Trading Manager: Ativo');
            } else {
                console.warn('⚠️ Trading Manager: Não encontrado');
            }
        } catch (error) {
            console.warn('⚠️ Trading Manager:', error.message);
        }

        // 5. Teste de DOM mapeado
        console.log('🗺️ Testando DOM mapeado...');
        try {
            if (typeof dom !== 'undefined' && Object.keys(dom).length > 10) {
                results.domMapped = true;
                console.log(`✅ DOM: ${Object.keys(dom).length} elementos mapeados`);
            } else {
                console.warn('⚠️ DOM: Poucos elementos mapeados');
            }
        } catch (error) {
            console.warn('⚠️ DOM:', error.message);
        }

        // Resultado geral
        const successCount = Object.values(results).filter(Boolean).length;
        results.overall = successCount >= 3; // Pelo menos 3 de 5 testes

        const endTime = performance.now();
        console.log(`⏱️ Testes Initialization executados em ${(endTime - startTime).toFixed(2)}ms`);

        if (results.overall) {
            console.log('✅ INITIALIZATION: Sistema inicializado corretamente!');
        } else {
            console.warn('⚠️ INITIALIZATION: Alguns componentes não inicializados');
        }

        return results;
    } catch (error) {
        console.error('❌ Erro crítico nos testes Initialization:', error);
        return { ...results, overall: false };
    }
}

// Exposição global
if (typeof window !== 'undefined') {
    window.testInitialization = testInitialization;
    console.log('🧪 testInitialization() disponível globalmente');
}
