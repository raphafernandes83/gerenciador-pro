/**
 * @fileoverview Gerenciador de Migração Sem Downtime
 * @description Migração gradual do sistema legado para o sistema unificado
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// CONSTANTES DE MIGRAÇÃO
// ============================================================================

const MIGRATION_CONFIG = Object.freeze({
    PHASES: {
        PREPARATION: 'preparation',
        PARALLEL_EXECUTION: 'parallel_execution', 
        GRADUAL_SWITCH: 'gradual_switch',
        LEGACY_CLEANUP: 'legacy_cleanup',
        COMPLETED: 'completed'
    },
    
    ROLLBACK_TRIGGERS: {
        ERROR_THRESHOLD: 3,
        PERFORMANCE_DEGRADATION: 50, // ms
        USER_COMPLAINTS: 1
    },
    
    MONITORING: {
        CHECK_INTERVAL: 1000,
        HEALTH_CHECK_TIMEOUT: 5000
    }
});

// ============================================================================
// GERENCIADOR PRINCIPAL DE MIGRAÇÃO
// ============================================================================

export class MigrationManager {
    constructor() {
        this.currentPhase = MIGRATION_CONFIG.PHASES.PREPARATION;
        this.migrationStartTime = null;
        this.errorCount = 0;
        this.performanceMetrics = [];
        this.rollbackPlan = null;
        this.healthCheckInterval = null;
        this.legacyBackup = null;
        
        this.eventListeners = new Map();
        this.migrationLog = [];
        
        console.log('🚀 Gerenciador de Migração inicializado');
    }
    
    /**
     * Inicia o processo de migração completo
     */
    async startMigration() {
        try {
            this.migrationStartTime = Date.now();
            this._log('INFO', 'Iniciando migração sem downtime');
            
            await this._executePhase1_Preparation();
            await this._executePhase2_ParallelExecution();
            await this._executePhase3_GradualSwitch();
            await this._executePhase4_LegacyCleanup();
            
            this.currentPhase = MIGRATION_CONFIG.PHASES.COMPLETED;
            this._log('SUCCESS', 'Migração concluída com sucesso');
            
            return true;
            
        } catch (error) {
            this._log('ERROR', `Falha na migração: ${error.message}`);
            await this._executeRollback();
            throw error;
        }
    }
    
    /**
     * FASE 1: Preparação
     */
    async _executePhase1_Preparation() {
        this.currentPhase = MIGRATION_CONFIG.PHASES.PREPARATION;
        this._log('INFO', 'FASE 1: Preparação iniciada');
        
        // 1.1 Backup do sistema legado
        await this._backupLegacySystem();
        
        // 1.2 Validação de pré-requisitos
        await this._validatePrerequisites();
        
        // 1.3 Inicialização do sistema unificado (sem ativar)
        await this._initializeUnifiedSystemSilently();
        
        // 1.4 Configuração de monitoramento
        this._setupHealthMonitoring();
        
        this._log('SUCCESS', 'FASE 1: Preparação concluída');
    }
    
    /**
     * FASE 2: Execução Paralela
     */
    async _executePhase2_ParallelExecution() {
        this.currentPhase = MIGRATION_CONFIG.PHASES.PARALLEL_EXECUTION;
        this._log('INFO', 'FASE 2: Execução paralela iniciada');
        
        // 2.1 Executa ambos os sistemas em paralelo
        await this._runSystemsInParallel();
        
        // 2.2 Compara resultados
        await this._compareSystemOutputs();
        
        // 2.3 Valida consistência
        await this._validateConsistency();
        
        this._log('SUCCESS', 'FASE 2: Execução paralela concluída');
    }
    
    /**
     * FASE 3: Mudança Gradual
     */
    async _executePhase3_GradualSwitch() {
        this.currentPhase = MIGRATION_CONFIG.PHASES.GRADUAL_SWITCH;
        this._log('INFO', 'FASE 3: Mudança gradual iniciada');
        
        // 3.1 Redireciona 25% do tráfego
        await this._redirectTraffic(25);
        await this._monitorPerformance(5000);
        
        // 3.2 Redireciona 50% do tráfego
        await this._redirectTraffic(50);
        await this._monitorPerformance(5000);
        
        // 3.3 Redireciona 75% do tráfego
        await this._redirectTraffic(75);
        await this._monitorPerformance(5000);
        
        // 3.4 Redireciona 100% do tráfego
        await this._redirectTraffic(100);
        await this._monitorPerformance(10000);
        
        this._log('SUCCESS', 'FASE 3: Mudança gradual concluída');
    }
    
    /**
     * FASE 4: Limpeza do Sistema Legado
     */
    async _executePhase4_LegacyCleanup() {
        this.currentPhase = MIGRATION_CONFIG.PHASES.LEGACY_CLEANUP;
        this._log('INFO', 'FASE 4: Limpeza do sistema legado iniciada');
        
        // 4.1 Desabilita sistema legado gradualmente
        await this._disableLegacySystem();
        
        // 4.2 Remove interceptadores
        await this._removeLegacyInterceptors();
        
        // 4.3 Limpeza de recursos
        await this._cleanupLegacyResources();
        
        this._log('SUCCESS', 'FASE 4: Limpeza concluída');
    }
    
    /**
     * Backup do sistema legado
     */
    async _backupLegacySystem() {
        this._log('INFO', 'Criando backup do sistema legado');
        
        this.legacyBackup = {
            charts: { ...window.charts },
            functions: {
                initProgressChart: window.charts?.initProgressChart,
                updateProgressChart: window.charts?.updateProgressChart,
                updateProgressPieChart: window.charts?.updateProgressPieChart
            },
            plugins: {
                centerTextRegistered: window.__centerTextPluginRegistered
            },
            timestamp: Date.now()
        };
        
        this._log('SUCCESS', 'Backup do sistema legado criado');
    }
    
    /**
     * Validação de pré-requisitos
     */
    async _validatePrerequisites() {
        this._log('INFO', 'Validando pré-requisitos');
        
        const checks = [
            { name: 'Chart.js disponível', test: () => typeof Chart !== 'undefined' },
            { name: 'Canvas existe', test: () => !!document.querySelector('#progress-pie-chart') },
            { name: 'DOM carregado', test: () => document.readyState === 'complete' },
            { name: 'Sistema legado ativo', test: () => !!window.charts },
            { name: 'Contadores existem', test: () => !!document.querySelector('#wins-counter') }
        ];
        
        for (const check of checks) {
            if (!check.test()) {
                throw new Error(`Pré-requisito falhou: ${check.name}`);
            }
            this._log('SUCCESS', `✓ ${check.name}`);
        }
    }
    
    /**
     * Inicializa sistema unificado silenciosamente
     */
    async _initializeUnifiedSystemSilently() {
        this._log('INFO', 'Inicializando sistema unificado (modo silencioso)');
        
        // Importa e inicializa o sistema unificado
        const { initializeUnifiedChartSystem } = await import('./UnifiedChartSystem.js');
        
        // Marca como modo de migração para evitar conflitos
        window.__migrationMode = true;
        
        // Inicializa sem ativar automaticamente
        initializeUnifiedChartSystem();
        
        // Registra plugins de migração
        await this._registerMigrationPlugins();
        
        this._log('SUCCESS', 'Sistema unificado inicializado em modo silencioso');
    }
    
    /**
     * Registra plugins específicos para migração
     */
    async _registerMigrationPlugins() {
        const { PerformanceMonitorPlugin } = await import('./plugins/PerformanceMonitorPlugin.js');
        const { DataValidationPlugin } = await import('./plugins/DataValidationPlugin.js');
        const { StateObserverPlugin } = await import('./plugins/StateObserverPlugin.js');
        
        const unifiedSystem = window.unifiedChartSystem;
        
        unifiedSystem.registerPlugin('performance-monitor', new PerformanceMonitorPlugin());
        unifiedSystem.registerPlugin('data-validation', new DataValidationPlugin());
        unifiedSystem.registerPlugin('state-observer', new StateObserverPlugin());
        
        this._log('SUCCESS', 'Plugins de migração registrados');
    }
    
    /**
     * Configuração de monitoramento de saúde
     */
    _setupHealthMonitoring() {
        this._log('INFO', 'Configurando monitoramento de saúde');
        
        this.healthCheckInterval = setInterval(() => {
            this._performHealthCheck();
        }, MIGRATION_CONFIG.MONITORING.CHECK_INTERVAL);
        
        // Monitora erros globais
        window.addEventListener('error', (event) => {
            this.errorCount++;
            this._log('ERROR', `Erro detectado: ${event.error?.message}`);
            
            if (this.errorCount >= MIGRATION_CONFIG.ROLLBACK_TRIGGERS.ERROR_THRESHOLD) {
                this._triggerRollback('Muitos erros detectados');
            }
        });
    }
    
    /**
     * Executa sistemas em paralelo
     */
    async _runSystemsInParallel() {
        this._log('INFO', 'Executando sistemas em paralelo');
        
        const testData = { wins: 5, losses: 3 };
        
        // Executa sistema legado
        const legacyResult = await this._executeLegacySystem(testData);
        
        // Executa sistema unificado
        const unifiedResult = await this._executeUnifiedSystem(testData);
        
        // Armazena resultados para comparação
        this.parallelResults = { legacy: legacyResult, unified: unifiedResult };
        
        this._log('SUCCESS', 'Execução paralela concluída');
    }
    
    /**
     * Redireciona tráfego gradualmente
     */
    async _redirectTraffic(percentage) {
        this._log('INFO', `Redirecionando ${percentage}% do tráfego para sistema unificado`);
        
        // Implementa redirecionamento baseado em probabilidade
        const originalUpdate = window.charts.updateProgressChart;
        
        window.charts.updateProgressChart = (sessionHistory) => {
            const shouldUseUnified = Math.random() * 100 < percentage;
            
            if (shouldUseUnified && window.unifiedChartSystem) {
                // Usa sistema unificado
                const wins = sessionHistory.filter(op => op.isWin === true).length;
                const losses = sessionHistory.filter(op => op.isWin === false).length;
                
                return window.unifiedChartSystem.updateChart('#progress-pie-chart', { wins, losses });
            } else {
                // Usa sistema legado
                return originalUpdate.call(window.charts, sessionHistory);
            }
        };
        
        // Aguarda estabilização
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this._log('SUCCESS', `${percentage}% do tráfego redirecionado`);
    }
    
    /**
     * Monitora performance durante migração
     */
    async _monitorPerformance(duration) {
        this._log('INFO', `Monitorando performance por ${duration}ms`);
        
        const startTime = performance.now();
        const metrics = [];
        
        const monitor = setInterval(() => {
            const currentTime = performance.now();
            const renderTime = currentTime - startTime;
            
            metrics.push({
                timestamp: currentTime,
                renderTime,
                memoryUsage: performance.memory?.usedJSHeapSize || 0
            });
        }, 100);
        
        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(monitor);
        
        // Analisa métricas
        const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
        
        if (avgRenderTime > MIGRATION_CONFIG.ROLLBACK_TRIGGERS.PERFORMANCE_DEGRADATION) {
            throw new Error(`Performance degradada: ${avgRenderTime.toFixed(2)}ms`);
        }
        
        this.performanceMetrics.push(...metrics);
        this._log('SUCCESS', `Performance monitorada: ${avgRenderTime.toFixed(2)}ms médio`);
    }
    
    /**
     * Executa rollback em caso de falha
     */
    async _executeRollback() {
        this._log('WARNING', 'Executando rollback');
        
        if (this.legacyBackup) {
            // Restaura sistema legado
            window.charts = { ...this.legacyBackup.charts };
            window.__centerTextPluginRegistered = this.legacyBackup.plugins.centerTextRegistered;
            
            // Destrói sistema unificado
            if (window.unifiedChartSystem) {
                window.unifiedChartSystem.destroyAll();
                delete window.unifiedChartSystem;
            }
            
            this._log('SUCCESS', 'Rollback executado com sucesso');
        }
    }
    
    /**
     * Verifica saúde do sistema
     */
    _performHealthCheck() {
        try {
            // Verifica se gráfico está funcionando
            const canvas = document.querySelector('#progress-pie-chart');
            const hasChart = canvas && (canvas.chart || window.unifiedChartSystem?.getChartInfo('#progress-pie-chart'));
            
            if (!hasChart) {
                this._log('WARNING', 'Gráfico não encontrado durante health check');
            }
            
            // Verifica contadores
            const winsCounter = document.querySelector('#wins-counter');
            const lossesCounter = document.querySelector('#losses-counter');
            
            if (!winsCounter || !lossesCounter) {
                this._log('WARNING', 'Contadores não encontrados durante health check');
            }
            
        } catch (error) {
            this._log('ERROR', `Falha no health check: ${error.message}`);
        }
    }
    
    /**
     * Registra log de migração
     */
    _log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, phase: this.currentPhase };
        
        this.migrationLog.push(logEntry);
        console.log(`🚀 [MIGRATION-${level}] ${message}`);
        
        // Emite evento para observadores
        this._emitEvent('migrationLog', logEntry);
    }
    
    /**
     * Emite evento para observadores
     */
    _emitEvent(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener de ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * Adiciona listener para eventos de migração
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        
        this.eventListeners.get(eventType).add(callback);
    }
    
    /**
     * Obtém status atual da migração
     */
    getStatus() {
        return {
            phase: this.currentPhase,
            startTime: this.migrationStartTime,
            duration: this.migrationStartTime ? Date.now() - this.migrationStartTime : 0,
            errorCount: this.errorCount,
            performanceMetrics: this.performanceMetrics.length,
            logEntries: this.migrationLog.length
        };
    }
    
    /**
     * Obtém logs de migração
     */
    getLogs() {
        return [...this.migrationLog];
    }
    
    /**
     * Limpa recursos
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        this.eventListeners.clear();
        this.migrationLog.length = 0;
        this.performanceMetrics.length = 0;
        
        this._log('INFO', 'Gerenciador de Migração destruído');
    }
}

// ============================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================================

// Expõe globalmente para controle manual
window.MigrationManager = MigrationManager;

console.log('🚀 Gerenciador de Migração carregado');
