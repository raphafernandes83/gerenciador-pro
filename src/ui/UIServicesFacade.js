/**
 * 🏭 UI SERVICES FACADE - GERENCIADOR PRO v9.3
 *
 * Facade pattern para simplificar dependências do módulo UI
 * Reduz acoplamento e centraliza acesso a serviços externos
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { globalDocGenerator, globalAutoDocumenter } from '../documentation/DynamicDocs.js';
import {
    globalPredictiveAnalyzer,
    globalAutoPreventionSystem,
} from '../ai/PredictiveErrorSystem.js';
import { globalMLOptimizer } from '../performance/MLPerformanceOptimizer.js';
import { globalErrorHandler, ERROR_CATEGORIES } from '../error/ErrorHandlingStrategy.js';
import { globalPerformanceOptimizer } from '../performance/PerformanceOptimizer.js';
import { globalCommandInvoker, UICommandFactory } from '../patterns/CommandPattern.js';
import { UIMappingManager } from '../config/UIMappingConfig.js';

/**
 * Facade que centraliza acesso a todos os serviços externos para UI
 * Implementa padrão Facade para reduzir complexidade de dependências
 */
export class UIServicesFacade {
    constructor() {
        this.initialized = false;
        this._services = new Map();
    }

    /**
     * Inicializa todos os serviços necessários
     * @param {Object} dom - Referência DOM
     * @param {Object} config - Configuração da aplicação
     * @param {Object} state - Estado da aplicação
     */
    async initialize(dom, config, state) {
        if (this.initialized) return;

        try {
            // Inicializa serviços core
            this._services.set('mappingManager', new UIMappingManager(dom, config, state));
            this._services.set('docGenerator', globalDocGenerator);
            this._services.set('autoDocumenter', globalAutoDocumenter);
            this._services.set('predictiveAnalyzer', globalPredictiveAnalyzer);
            this._services.set('autoPreventionSystem', globalAutoPreventionSystem);
            this._services.set('mlOptimizer', globalMLOptimizer);
            this._services.set('errorHandler', globalErrorHandler);
            this._services.set('performanceOptimizer', globalPerformanceOptimizer);
            this._services.set('commandInvoker', globalCommandInvoker);
            this._services.set('commandFactory', UICommandFactory);

            this.initialized = true;
        } catch (error) {
            console.error('Erro ao inicializar UIServicesFacade:', error);
            throw error;
        }
    }

    /**
     * Obtém serviço específico
     * @param {string} serviceName - Nome do serviço
     * @returns {Object} Instância do serviço
     */
    getService(serviceName) {
        if (!this.initialized) {
            throw new Error('UIServicesFacade não foi inicializada');
        }

        const service = this._services.get(serviceName);
        if (!service) {
            throw new Error(`Serviço '${serviceName}' não encontrado`);
        }

        return service;
    }

    /**
     * Registra módulo UI na documentação
     * @param {Object} uiModule - Módulo UI a ser registrado
     */
    registerUIModule(uiModule) {
        const docGenerator = this.getService('docGenerator');
        const autoDocumenter = this.getService('autoDocumenter');

        docGenerator.registerModule('UI', uiModule, {
            type: 'singleton',
            dependencies: ['state', 'config', 'dom'],
            scope: 'global',
        });

        docGenerator.addExample('UI.formatarMoeda', {
            input: 1234.56,
            output: 'R$ 1.234,56',
            description: 'Formata valor numérico para moeda brasileira',
        });

        // Intercepta métodos importantes para documentação automática
        autoDocumenter.intercept(uiModule, 'formatarMoeda', 'UI');
        autoDocumenter.intercept(uiModule, 'syncUIFromState', 'UI');
        autoDocumenter.intercept(uiModule, '_updateFilterButtons', 'UI');
    }

    /**
     * Executa predição de erros de UI
     * @param {Object} context - Contexto atual da UI
     * @returns {Object} Predições de erro
     */
    async predictUIErrors(context) {
        const predictor = this.getService('predictiveAnalyzer');
        return predictor.predictErrors(context);
    }

    /**
     * Executa prevenção automática de erros
     * @param {Object} context - Contexto atual
     * @returns {Object} Ações de prevenção executadas
     */
    async executeAutoPrevention(context) {
        const prevention = this.getService('autoPreventionSystem');
        return prevention.executeAutoPrevention(context);
    }

    /**
     * Otimiza performance de função específica
     * @param {Function} func - Função a ser otimizada
     * @param {Object} options - Opções de otimização
     * @returns {Function} Função otimizada
     */
    optimizeFunction(func, options = {}) {
        const optimizer = this.getService('performanceOptimizer');
        return optimizer.optimize(func, options);
    }

    /**
     * Obtém cache de performance
     * @param {string} cacheKey - Chave do cache
     * @returns {Object} Instância do cache
     */
    getPerformanceCache(cacheKey) {
        const optimizer = this.getService('performanceOptimizer');
        return optimizer.getCache(cacheKey);
    }

    /**
     * Executa operação de forma segura com tratamento de erro
     * @param {Function} operation - Operação a ser executada
     * @param {string} operationName - Nome da operação
     * @returns {Promise} Resultado da operação
     */
    async safeExecute(operation, operationName) {
        const errorHandler = this.getService('errorHandler');
        return errorHandler.safeExecute(operation, operationName, ERROR_CATEGORIES.UI);
    }

    /**
     * Cria e executa comando UI
     * @param {Object} commandData - Dados do comando
     * @returns {Promise} Resultado da execução
     */
    async executeUICommand(commandData) {
        const factory = this.getService('commandFactory');
        const invoker = this.getService('commandInvoker');

        const command = factory.createCompositeCommand(commandData);
        return invoker.execute(command);
    }

    /**
     * Gera relatórios de status dos serviços
     * @returns {Object} Relatórios consolidados
     */
    generateStatusReports() {
        return {
            performance: this.getService('performanceOptimizer').getPerformanceStats(),
            ml: this.getService('mlOptimizer').generateMLReport(),
            predictive: this.getService('predictiveAnalyzer').generateAnalysisReport(),
            commands: this.getService('commandInvoker').getStatistics(),
        };
    }

    /**
     * Limpa todos os caches e otimizações
     */
    clearAll() {
        const optimizer = this.getService('performanceOptimizer');
        optimizer.clearAll();
    }
}

// Singleton instance
export const uiServicesFacade = new UIServicesFacade();
