/**
 * 🏭 DEPENDENCY INJECTION CONTAINER - GERENCIADOR PRO v9.3
 * Responsabilidade única: Gerenciar todas as dependências da aplicação
 *
 * Substitui imports diretos por injeção de dependência
 * Reduz acoplamento e melhora testabilidade
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 */

import {
    TRADING_STRATEGIES,
    SESSION_MODES,
    ERROR_MESSAGES,
    PERFORMANCE_CONFIG,
} from '../constants/AppConstants.js';
import {
    SUPABASE_CONFIG,
    TIMING_CONFIG,
    PERFORMANCE_THRESHOLDS,
    DATABASE_CONFIG,
    UI_CONFIG,
    SECURITY_CONFIG,
    STORAGE_KEYS,
    SYSTEM_MESSAGES,
    getEnvironmentConfig,
} from '../constants/SystemConstants.js';
import {
    calculateEntryAmount,
    calculateReturnAmount,
    calculateMathematicalExpectancy,
} from '../utils/MathUtils.js';
import { TradingStrategyFactory } from '../business/TradingStrategy.js';
import { errorHandler } from '../utils/ErrorHandler.js';
import { debounce, memoize, measurePerformance } from '../utils/PerformanceUtils.js';
import { TradingOperationsManager } from '../business/TradingOperationsManager.js';
import { legacyAdapter } from '../adapters/LegacyIntegrationAdapter.js';
import { performanceMonitor } from '../monitoring/PerformanceMonitor.js';
import { cacheManager } from '../enhancements/CacheManager.js';
import { smartErrorRecovery } from '../enhancements/SmartErrorRecovery.js';
import {
    registerAdvancedStrategies,
    demonstrateAdvancedStrategies,
    AdvancedStrategiesUtils,
} from '../strategies/AdvancedStrategies.js';

/**
 * Container de injeção de dependência
 * Implementa padrão Singleton + Factory
 */
export class DependencyInjector {
    constructor() {
        if (DependencyInjector.instance) {
            return DependencyInjector.instance;
        }

        this.dependencies = new Map();
        this.factories = new Map();
        this.singletons = new Map();
        this.initialized = false;

        DependencyInjector.instance = this;
    }

    /**
     * 🏗️ Inicializa todas as dependências
     * @param {Object} legacyModules - Módulos legados para compatibilidade
     */
    async initialize(legacyModules = {}) {
        if (this.initialized) {
            return this.getDependencies();
        }

        console.log('🏭 Inicializando Dependency Injection Container...');

        try {
            // Registra constantes e configurações
            this._registerConstants();

            // Registra utilitários (sem estado)
            this._registerUtilities();

            // Registra módulos legados
            this._registerLegacyModules(legacyModules);

            // Registra fábricas para objetos complexos
            this._registerFactories();

            // Registra singletons para gerenciadores
            await this._registerSingletons();

            this.initialized = true;
            console.log('✅ Dependency Injection Container inicializado!');

            return this.getDependencies();
        } catch (error) {
            console.error('❌ Erro ao inicializar DI Container:', error);
            throw error;
        }
    }

    /**
     * 📦 Registra constantes do sistema
     * @private
     */
    _registerConstants() {
        // Constantes da aplicação
        this.dependencies.set('TRADING_STRATEGIES', TRADING_STRATEGIES);
        this.dependencies.set('SESSION_MODES', SESSION_MODES);
        this.dependencies.set('ERROR_MESSAGES', ERROR_MESSAGES);
        this.dependencies.set('PERFORMANCE_CONFIG', PERFORMANCE_CONFIG);

        // Constantes do sistema
        this.dependencies.set('SUPABASE_CONFIG', SUPABASE_CONFIG);
        this.dependencies.set('TIMING_CONFIG', TIMING_CONFIG);
        this.dependencies.set('PERFORMANCE_THRESHOLDS', PERFORMANCE_THRESHOLDS);
        this.dependencies.set('DATABASE_CONFIG', DATABASE_CONFIG);
        this.dependencies.set('UI_CONFIG', UI_CONFIG);
        this.dependencies.set('SECURITY_CONFIG', SECURITY_CONFIG);
        this.dependencies.set('STORAGE_KEYS', STORAGE_KEYS);
        this.dependencies.set('SYSTEM_MESSAGES', SYSTEM_MESSAGES);

        // Função para configuração de ambiente
        this.dependencies.set('getEnvironmentConfig', getEnvironmentConfig);
    }

    /**
     * 🛠️ Registra funções utilitárias
     * @private
     */
    _registerUtilities() {
        // Utilitários matemáticos
        this.dependencies.set('calculateEntryAmount', calculateEntryAmount);
        this.dependencies.set('calculateReturnAmount', calculateReturnAmount);
        this.dependencies.set('calculateMathematicalExpectancy', calculateMathematicalExpectancy);

        // Utilitários de performance
        this.dependencies.set('debounce', debounce);
        this.dependencies.set('memoize', memoize);
        this.dependencies.set('measurePerformance', measurePerformance);

        // Handler de erros
        this.dependencies.set('errorHandler', errorHandler);
    }

    /**
     * 🏛️ Registra módulos legados para compatibilidade
     * @private
     */
    _registerLegacyModules(legacyModules) {
        Object.entries(legacyModules).forEach(([name, module]) => {
            this.dependencies.set(name, module);
        });
    }

    /**
     * 🏭 Registra fábricas para criação de objetos
     * @private
     */
    _registerFactories() {
        this.factories.set('TradingStrategyFactory', () => TradingStrategyFactory);
        this.factories.set(
            'TradingOperationsManager',
            (state, config, dbManager, ui, charts) =>
                new TradingOperationsManager(state, config, dbManager, ui, charts)
        );
    }

    /**
     * 👑 Registra singletons para gerenciadores globais
     * @private
     */
    async _registerSingletons() {
        // Performance Monitor
        if (!this.singletons.has('performanceMonitor')) {
            this.singletons.set('performanceMonitor', performanceMonitor);
        }

        // Cache Manager
        if (!this.singletons.has('cacheManager')) {
            this.singletons.set('cacheManager', cacheManager);
        }

        // Smart Error Recovery
        if (!this.singletons.has('smartErrorRecovery')) {
            this.singletons.set('smartErrorRecovery', smartErrorRecovery);
        }

        // Legacy Adapter
        if (!this.singletons.has('legacyAdapter')) {
            this.singletons.set('legacyAdapter', legacyAdapter);
        }

        // Estratégias avançadas
        this.singletons.set('registerAdvancedStrategies', registerAdvancedStrategies);
        this.singletons.set('demonstrateAdvancedStrategies', demonstrateAdvancedStrategies);
        this.singletons.set('AdvancedStrategiesUtils', AdvancedStrategiesUtils);
    }

    /**
     * 📥 Obtém dependência específica
     * @param {string} name - Nome da dependência
     * @returns {any} Dependência solicitada
     */
    get(name) {
        // Verifica singletons primeiro
        if (this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Depois dependências normais
        if (this.dependencies.has(name)) {
            return this.dependencies.get(name);
        }

        // Por último, fábricas
        if (this.factories.has(name)) {
            return this.factories.get(name);
        }

        throw new Error(`Dependência não encontrada: ${name}`);
    }

    /**
     * 🏭 Cria instância usando factory
     * @param {string} factoryName - Nome da factory
     * @param {...any} args - Argumentos para a factory
     * @returns {any} Instância criada
     */
    create(factoryName, ...args) {
        const factory = this.get(factoryName);
        if (typeof factory === 'function') {
            return factory(...args);
        }
        throw new Error(`Factory ${factoryName} não é uma função`);
    }

    /**
     * 📋 Obtém todas as dependências organizadas
     * @returns {Object} Objeto com todas as dependências
     */
    getDependencies() {
        const allDependencies = {
            // Constantes
            constants: {
                // Constantes da aplicação
                TRADING_STRATEGIES: this.get('TRADING_STRATEGIES'),
                SESSION_MODES: this.get('SESSION_MODES'),
                ERROR_MESSAGES: this.get('ERROR_MESSAGES'),
                PERFORMANCE_CONFIG: this.get('PERFORMANCE_CONFIG'),

                // Constantes do sistema
                SUPABASE_CONFIG: this.get('SUPABASE_CONFIG'),
                TIMING_CONFIG: this.get('TIMING_CONFIG'),
                PERFORMANCE_THRESHOLDS: this.get('PERFORMANCE_THRESHOLDS'),
                DATABASE_CONFIG: this.get('DATABASE_CONFIG'),
                UI_CONFIG: this.get('UI_CONFIG'),
                SECURITY_CONFIG: this.get('SECURITY_CONFIG'),
                STORAGE_KEYS: this.get('STORAGE_KEYS'),
                SYSTEM_MESSAGES: this.get('SYSTEM_MESSAGES'),
                getEnvironmentConfig: this.get('getEnvironmentConfig'),
            },

            // Utilitários
            utils: {
                calculateEntryAmount: this.get('calculateEntryAmount'),
                calculateReturnAmount: this.get('calculateReturnAmount'),
                calculateMathematicalExpectancy: this.get('calculateMathematicalExpectancy'),
                debounce: this.get('debounce'),
                memoize: this.get('memoize'),
                measurePerformance: this.get('measurePerformance'),
                errorHandler: this.get('errorHandler'),
            },

            // Fábricas
            factories: {
                TradingStrategyFactory: this.get('TradingStrategyFactory'),
                createTradingManager: this.get('TradingOperationsManager'),
            },

            // Singletons
            singletons: {
                performanceMonitor: this.get('performanceMonitor'),
                cacheManager: this.get('cacheManager'),
                smartErrorRecovery: this.get('smartErrorRecovery'),
                legacyAdapter: this.get('legacyAdapter'),
                registerAdvancedStrategies: this.get('registerAdvancedStrategies'),
                demonstrateAdvancedStrategies: this.get('demonstrateAdvancedStrategies'),
                AdvancedStrategiesUtils: this.get('AdvancedStrategiesUtils'),
            },

            // Módulos legados (se registrados)
            legacy: {},
        };

        // Adiciona módulos legados registrados
        for (const [key, value] of this.dependencies.entries()) {
            if (
                !allDependencies.constants[key] &&
                !allDependencies.utils[key] &&
                !allDependencies.factories[key] &&
                !allDependencies.singletons[key]
            ) {
                allDependencies.legacy[key] = value;
            }
        }

        return allDependencies;
    }

    /**
     * 🧹 Limpa o container (útil para testes)
     */
    clear() {
        this.dependencies.clear();
        this.factories.clear();
        this.singletons.clear();
        this.initialized = false;
    }

    /**
     * 📊 Estatísticas do container
     */
    getStats() {
        return {
            dependencies: this.dependencies.size,
            factories: this.factories.size,
            singletons: this.singletons.size,
            initialized: this.initialized,
            totalRegistered: this.dependencies.size + this.factories.size + this.singletons.size,
        };
    }
}

// Exporta instância singleton
export const dependencyInjector = new DependencyInjector();
