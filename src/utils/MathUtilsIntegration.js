/**
 * 🔗 INTEGRAÇÃO MATHUTILS TURBO v2.0 - GERENCIADOR PRO v9.3
 *
 * Arquivo de integração que substitui gradualmente o MathUtils original
 * Mantém 100% de compatibilidade com o sistema existente
 * 
 * INSTRUÇÕES DE USO:
 * 1. Importe este arquivo em vez do MathUtils original
 * 2. Use as funções normalmente - migração é transparente
 * 3. Monitore métricas via MigrationControl.getReport()
 * 4. Habilite turbo gradualmente ou de uma vez
 *
 * @author Arquiteto de Sistemas Matemáticos Financeiros Turbo v2.0
 * @version 1.0.0
 * @since 2025-01-28
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================

import { MathUtils, MigrationControl } from './MathUtilsMigrator.js';
import * as TurboMath from './MathUtilsTurbo.js';

// ============================================================================
// CONFIGURAÇÃO DE INTEGRAÇÃO
// ============================================================================

/**
 * Configuração de integração automática
 */
const INTEGRATION_CONFIG = {
    // Auto-habilita turbo após N sucessos consecutivos
    autoEnableThreshold: 50,
    
    // Auto-desabilita turbo após N falhas consecutivas
    autoDisableThreshold: 5,
    
    // Intervalo de monitoramento automático (ms)
    monitoringInterval: 30000, // 30 segundos
    
    // Log de atividades
    enableLogging: true,
    
    // Modo de inicialização
    startupMode: 'gradual' // 'gradual', 'turbo', 'original'
};

// ============================================================================
// SISTEMA DE MONITORAMENTO AUTOMÁTICO
// ============================================================================

class AutoMigrationManager {
    constructor() {
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.lastReport = null;
        
        // Inicia monitoramento automático
        this.startMonitoring();
        
        // Configura modo inicial
        this._setupInitialMode();
        
        console.log('🤖 Auto Migration Manager inicializado');
    }
    
    /**
     * Configura modo inicial baseado na configuração
     */
    _setupInitialMode() {
        switch (INTEGRATION_CONFIG.startupMode) {
            case 'turbo':
                MigrationControl.enableAllTurbo();
                this._log('🚀 Modo inicial: Turbo habilitado para todas as funções');
                break;
                
            case 'original':
                MigrationControl.disableAllTurbo();
                this._log('⏪ Modo inicial: Usando versões originais');
                break;
                
            case 'gradual':
            default:
                this._log('🔄 Modo inicial: Migração gradual ativa');
                break;
        }
    }
    
    /**
     * Inicia monitoramento automático
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this._performAutomaticAnalysis();
        }, INTEGRATION_CONFIG.monitoringInterval);
        
        this._log('📊 Monitoramento automático iniciado');
    }
    
    /**
     * Para monitoramento automático
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this._log('⏹️ Monitoramento automático parado');
    }
    
    /**
     * Executa análise automática e toma decisões
     */
    _performAutomaticAnalysis() {
        try {
            const report = MigrationControl.getReport();
            this.lastReport = report;
            
            // Analisa cada função individualmente
            for (const [functionName, stats] of Object.entries(report.functions)) {
                this._analyzeFunction(functionName, stats);
            }
            
            // Log periódico de status
            this._logPeriodicStatus(report);
            
        } catch (error) {
            this._log(`❌ Erro na análise automática: ${error.message}`);
        }
    }
    
    /**
     * Analisa função individual e toma decisões
     */
    _analyzeFunction(functionName, stats) {
        const config = INTEGRATION_CONFIG;
        
        // Auto-habilita turbo se muitos sucessos
        if (!stats.useTurbo && stats.successCount >= config.autoEnableThreshold && stats.errorCount === 0) {
            MigrationControl.enableTurbo(functionName);
            this._log(`🚀 Auto-habilitado Turbo para ${functionName} (${stats.successCount} sucessos)`);
        }
        
        // Auto-desabilita turbo se muitos erros
        if (stats.useTurbo && stats.errorCount >= config.autoDisableThreshold) {
            MigrationControl.disableTurbo(functionName);
            this._log(`⚠️ Auto-desabilitado Turbo para ${functionName} (${stats.errorCount} erros)`);
        }
        
        // Alerta para falhas de comparação
        if (stats.comparisonFailures > 0) {
            this._log(`⚠️ ${functionName}: ${stats.comparisonFailures} falhas de comparação detectadas`);
        }
    }
    
    /**
     * Log periódico de status
     */
    _logPeriodicStatus(report) {
        const turboEnabled = report.summary.turboEnabled;
        const totalFunctions = report.summary.totalFunctions;
        const successRate = report.summary.totalSuccesses / (report.summary.totalSuccesses + report.summary.totalErrors) * 100;
        
        this._log(`📊 Status: ${turboEnabled}/${totalFunctions} funções em Turbo, ${successRate.toFixed(1)}% taxa de sucesso`);
    }
    
    /**
     * Log com timestamp
     */
    _log(message) {
        if (INTEGRATION_CONFIG.enableLogging) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] AutoMigration: ${message}`);
        }
    }
    
    /**
     * Obtém último relatório
     */
    getLastReport() {
        return this.lastReport;
    }
    
    /**
     * Força análise imediata
     */
    forceAnalysis() {
        this._performAutomaticAnalysis();
    }
}

// ============================================================================
// INSTÂNCIA GLOBAL
// ============================================================================

const autoManager = new AutoMigrationManager();

// ============================================================================
// API PÚBLICA COMPATÍVEL
// ============================================================================

/**
 * Exporta todas as funções matemáticas com migração transparente
 * Mantém 100% de compatibilidade com MathUtils original
 */

// Tier 1 - Funções críticas
export const calculateEntryAmount = MathUtils.calculateEntryAmount;
export const calculateReturnAmount = MathUtils.calculateReturnAmount;
export const calculateRecoveryEntry = MathUtils.calculateRecoveryEntry;

// Tier 2 - Funções importantes  
export const calculateMathematicalExpectancy = MathUtils.calculateMathematicalExpectancy;
export const calculateMaxDrawdown = MathUtils.calculateMaxDrawdown;
export const calculateSequences = MathUtils.calculateSequences;
export const calculateProfitFactor = MathUtils.calculateProfitFactor;

// Utilitárias
export const calculateStopValue = MathUtils.calculateStopValue;
export const toPercentage = MathUtils.toPercentage;
export const fromPercentage = MathUtils.fromPercentage;

// Constantes
export const PERCENTAGE_DIVISOR = MathUtils.PERCENTAGE_DIVISOR;

// ============================================================================
// API DE CONTROLE E MONITORAMENTO
// ============================================================================

/**
 * API estendida para controle da migração
 */
export const TurboControl = {
    // Controle de migração
    migration: MigrationControl,
    
    // Controle automático
    auto: {
        start: () => autoManager.startMonitoring(),
        stop: () => autoManager.stopMonitoring(),
        forceAnalysis: () => autoManager.forceAnalysis(),
        getLastReport: () => autoManager.getLastReport()
    },
    
    // Métricas e relatórios
    metrics: {
        getTurboMetrics: () => TurboMath.getTurboMetrics(),
        getMigrationReport: () => MigrationControl.getReport(),
        clearCache: () => TurboMath.clearTurboCache()
    },
    
    // Testes e validação
    testing: {
        runStressTest: (iterations) => MigrationControl.runStressTest(iterations),
        validatePrecision: () => _runPrecisionValidation(),
        benchmarkPerformance: () => _runPerformanceBenchmark()
    },
    
    // Configuração
    config: {
        setAutoEnableThreshold: (threshold) => {
            INTEGRATION_CONFIG.autoEnableThreshold = threshold;
        },
        setAutoDisableThreshold: (threshold) => {
            INTEGRATION_CONFIG.autoDisableThreshold = threshold;
        },
        setMonitoringInterval: (interval) => {
            INTEGRATION_CONFIG.monitoringInterval = interval;
            if (autoManager.isMonitoring) {
                autoManager.stopMonitoring();
                autoManager.startMonitoring();
            }
        },
        enableLogging: (enabled) => {
            INTEGRATION_CONFIG.enableLogging = enabled;
        }
    }
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO INTERNA
// ============================================================================

/**
 * Executa validação de precisão rápida
 */
function _runPrecisionValidation() {
    const testCases = [
        { func: calculateEntryAmount, args: [10000, 2.5], expected: 250 },
        { func: calculateReturnAmount, args: [100, 87], expected: 87 },
        { func: calculateMathematicalExpectancy, args: [60, 87], expected: 0.122 }
    ];
    
    let passed = 0;
    const results = [];
    
    for (const testCase of testCases) {
        try {
            const result = testCase.func(...testCase.args);
            const tolerance = Math.abs(testCase.expected * 0.01);
            const difference = Math.abs(result - testCase.expected);
            const isValid = difference <= tolerance;
            
            results.push({
                function: testCase.func.name,
                passed: isValid,
                expected: testCase.expected,
                actual: result,
                difference
            });
            
            if (isValid) passed++;
            
        } catch (error) {
            results.push({
                function: testCase.func.name,
                passed: false,
                error: error.message
            });
        }
    }
    
    return {
        passed,
        total: testCases.length,
        successRate: (passed / testCases.length) * 100,
        results
    };
}

/**
 * Executa benchmark de performance rápido
 */
function _runPerformanceBenchmark() {
    const iterations = 100;
    const testCase = { func: calculateEntryAmount, args: [10000, 2.5] };
    
    // Desabilita turbo temporariamente
    const wasEnabled = MigrationControl.getReport().functions.calculateEntryAmount?.useTurbo || false;
    MigrationControl.disableTurbo('calculateEntryAmount');
    
    // Benchmark versão original
    const originalStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        testCase.func(...testCase.args);
    }
    const originalTime = performance.now() - originalStart;
    
    // Habilita turbo
    MigrationControl.enableTurbo('calculateEntryAmount');
    
    // Benchmark versão turbo
    const turboStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        testCase.func(...testCase.args);
    }
    const turboTime = performance.now() - turboStart;
    
    // Restaura estado original
    if (!wasEnabled) {
        MigrationControl.disableTurbo('calculateEntryAmount');
    }
    
    const improvement = ((originalTime - turboTime) / originalTime) * 100;
    
    return {
        iterations,
        originalTime: originalTime.toFixed(2),
        turboTime: turboTime.toFixed(2),
        improvement: improvement.toFixed(2)
    };
}

// ============================================================================
// EXPOSIÇÃO GLOBAL PARA DEBUGGING
// ============================================================================

if (typeof window !== 'undefined') {
    window.TurboControl = TurboControl;
    window.AutoMigrationManager = autoManager;
}

// ============================================================================
// INICIALIZAÇÃO E LOG
// ============================================================================

console.log('🔗 MathUtils Integration v1.0 carregado');
console.log(`📊 Modo: ${INTEGRATION_CONFIG.startupMode}`);
console.log('🎯 Funções disponíveis:', Object.keys({
    calculateEntryAmount,
    calculateReturnAmount,
    calculateRecoveryEntry,
    calculateMathematicalExpectancy,
    calculateMaxDrawdown,
    calculateSequences,
    calculateProfitFactor,
    calculateStopValue,
    toPercentage,
    fromPercentage
}));
console.log('⚙️ Controles disponíveis via TurboControl');

// Executa validação inicial
setTimeout(() => {
    const validation = _runPrecisionValidation();
    console.log(`✅ Validação inicial: ${validation.passed}/${validation.total} testes passaram (${validation.successRate.toFixed(1)}%)`);
}, 1000);
