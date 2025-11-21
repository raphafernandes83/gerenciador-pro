/**
 * 🔄 MIGRADOR PARA MATHUTILS TURBO v2.0
 *
 * Sistema de migração gradual que permite transição segura
 * do MathUtils original para o MathUtils Turbo otimizado
 * 
 * FUNCIONALIDADES:
 * - Migração gradual por função
 * - Comparação de resultados entre versões
 * - Rollback automático em caso de problemas
 * - Métricas de performance comparativas
 * - Validação de compatibilidade
 *
 * @author Arquiteto de Sistemas Matemáticos Financeiros Turbo v2.0
 * @version 1.0.0
 * @since 2025-01-28
 */

// Importa ambas as versões
import * as OriginalMath from './MathUtils.js';
import * as TurboMath from './MathUtilsTurbo.js';

// ============================================================================
// CONFIGURAÇÃO DE MIGRAÇÃO
// ============================================================================

/**
 * Configuração de migração por função
 */
const MIGRATION_CONFIG = {
    // Funções Tier 1 - Migração prioritária
    calculateEntryAmount: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01, // 0.01% de tolerância
        rollbackOnError: true,
        priority: 1
    },
    calculateReturnAmount: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 1
    },
    calculateRecoveryEntry: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 1
    },
    
    // Funções Tier 2 - Migração secundária
    calculateMathematicalExpectancy: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.1, // 0.1% de tolerância para cálculos complexos
        rollbackOnError: true,
        priority: 2
    },
    calculateMaxDrawdown: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 2
    },
    calculateSequences: {
        enabled: true,
        compareResults: false, // Resultado é objeto, não numérico
        rollbackOnError: true,
        priority: 2
    },
    calculateProfitFactor: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.1,
        rollbackOnError: true,
        priority: 2
    },
    
    // Funções utilitárias
    calculateStopValue: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 3
    },
    toPercentage: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 3
    },
    fromPercentage: {
        enabled: true,
        compareResults: true,
        tolerancePercent: 0.01,
        rollbackOnError: true,
        priority: 3
    }
};

// ============================================================================
// SISTEMA DE MIGRAÇÃO
// ============================================================================

/**
 * Gerenciador de migração gradual
 */
class MathUtilsMigrator {
    constructor() {
        this.migrationState = new Map();
        this.comparisonResults = new Map();
        this.performanceMetrics = new Map();
        this.errorLog = [];
        
        // Inicializa estado de migração
        this._initializeMigrationState();
        
        console.log('🔄 MathUtils Migrator inicializado');
    }
    
    /**
     * Inicializa estado de migração
     */
    _initializeMigrationState() {
        for (const [functionName, config] of Object.entries(MIGRATION_CONFIG)) {
            this.migrationState.set(functionName, {
                isEnabled: config.enabled,
                useTurbo: false, // Inicia com versão original
                successCount: 0,
                errorCount: 0,
                comparisonFailures: 0,
                lastError: null,
                avgPerformanceGain: 0
            });
        }
    }
    
    /**
     * Executa função com migração inteligente
     */
    executeFunction(functionName, ...args) {
        const config = MIGRATION_CONFIG[functionName];
        const state = this.migrationState.get(functionName);
        
        if (!config || !state) {
            throw new Error(`Função ${functionName} não configurada para migração`);
        }
        
        // Se migração não está habilitada, usa versão original
        if (!config.enabled) {
            return this._executeOriginal(functionName, ...args);
        }
        
        // Se está em modo turbo, executa versão otimizada
        if (state.useTurbo) {
            return this._executeTurbo(functionName, ...args);
        }
        
        // Modo de comparação - executa ambas as versões
        return this._executeWithComparison(functionName, ...args);
    }
    
    /**
     * Executa versão original
     */
    _executeOriginal(functionName, ...args) {
        const startTime = performance.now();
        
        try {
            const result = OriginalMath[functionName](...args);
            const executionTime = performance.now() - startTime;
            
            this._recordPerformance(functionName, 'original', executionTime);
            
            return result;
        } catch (error) {
            this._recordError(functionName, 'original', error);
            throw error;
        }
    }
    
    /**
     * Executa versão turbo
     */
    _executeTurbo(functionName, ...args) {
        const startTime = performance.now();
        
        try {
            const result = TurboMath[functionName](...args);
            const executionTime = performance.now() - startTime;
            
            this._recordPerformance(functionName, 'turbo', executionTime);
            
            const state = this.migrationState.get(functionName);
            state.successCount++;
            
            return result;
        } catch (error) {
            this._recordError(functionName, 'turbo', error);
            
            const state = this.migrationState.get(functionName);
            state.errorCount++;
            state.lastError = error.message;
            
            // Rollback se configurado
            const config = MIGRATION_CONFIG[functionName];
            if (config.rollbackOnError) {
                console.warn(`⚠️ Rollback automático para ${functionName} devido a erro`);
                state.useTurbo = false;
                
                // Tenta executar versão original
                return this._executeOriginal(functionName, ...args);
            }
            
            throw error;
        }
    }
    
    /**
     * Executa com comparação entre versões
     */
    _executeWithComparison(functionName, ...args) {
        const config = MIGRATION_CONFIG[functionName];
        const state = this.migrationState.get(functionName);
        
        let originalResult, turboResult;
        let originalTime, turboTime;
        let originalError, turboError;
        
        // Executa versão original
        const originalStart = performance.now();
        try {
            originalResult = OriginalMath[functionName](...args);
            originalTime = performance.now() - originalStart;
        } catch (error) {
            originalError = error;
            originalTime = performance.now() - originalStart;
        }
        
        // Executa versão turbo
        const turboStart = performance.now();
        try {
            turboResult = TurboMath[functionName](...args);
            turboTime = performance.now() - turboStart;
        } catch (error) {
            turboError = error;
            turboTime = performance.now() - turboStart;
        }
        
        // Registra métricas de performance
        this._recordPerformance(functionName, 'original', originalTime);
        this._recordPerformance(functionName, 'turbo', turboTime);
        
        // Se ambas falharam, lança erro original
        if (originalError && turboError) {
            this._recordError(functionName, 'both', originalError);
            throw originalError;
        }
        
        // Se apenas turbo falhou, usa original
        if (turboError && !originalError) {
            this._recordError(functionName, 'turbo', turboError);
            state.errorCount++;
            return originalResult;
        }
        
        // Se apenas original falhou, usa turbo
        if (originalError && !turboError) {
            this._recordError(functionName, 'original', originalError);
            return turboResult;
        }
        
        // Ambas funcionaram - compara resultados
        const comparisonResult = this._compareResults(
            functionName, 
            originalResult, 
            turboResult, 
            config.tolerancePercent
        );
        
        // Registra resultado da comparação
        this._recordComparison(functionName, comparisonResult, originalTime, turboTime);
        
        // Se comparação falhou, usa original
        if (!comparisonResult.isEqual) {
            state.comparisonFailures++;
            console.warn(`⚠️ Diferença detectada em ${functionName}:`, comparisonResult);
            return originalResult;
        }
        
        // Comparação passou - registra sucesso
        state.successCount++;
        
        // Calcula ganho de performance
        const performanceGain = ((originalTime - turboTime) / originalTime) * 100;
        state.avgPerformanceGain = (state.avgPerformanceGain + performanceGain) / 2;
        
        // Se ganho de performance é consistente, habilita turbo
        if (state.successCount >= 10 && state.avgPerformanceGain > 10) {
            console.log(`🚀 Habilitando Turbo para ${functionName} - Ganho médio: ${state.avgPerformanceGain.toFixed(2)}%`);
            state.useTurbo = true;
        }
        
        return turboResult;
    }
    
    /**
     * Compara resultados entre versões
     */
    _compareResults(functionName, original, turbo, tolerancePercent) {
        const config = MIGRATION_CONFIG[functionName];
        
        // Se não deve comparar, considera igual
        if (!config.compareResults) {
            return { isEqual: true, reason: 'comparison_disabled' };
        }
        
        // Comparação para números
        if (typeof original === 'number' && typeof turbo === 'number') {
            // Trata casos especiais
            if (isNaN(original) && isNaN(turbo)) {
                return { isEqual: true, reason: 'both_nan' };
            }
            
            if (!isFinite(original) && !isFinite(turbo)) {
                return { isEqual: true, reason: 'both_infinite' };
            }
            
            if (original === turbo) {
                return { isEqual: true, reason: 'exact_match' };
            }
            
            // Comparação com tolerância
            const tolerance = Math.abs(original) * (tolerancePercent / 100);
            const difference = Math.abs(original - turbo);
            
            if (difference <= tolerance) {
                return { 
                    isEqual: true, 
                    reason: 'within_tolerance',
                    difference,
                    tolerance
                };
            }
            
            return {
                isEqual: false,
                reason: 'tolerance_exceeded',
                original,
                turbo,
                difference,
                tolerance,
                percentDifference: (difference / Math.abs(original)) * 100
            };
        }
        
        // Comparação para objetos (como resultado de calculateSequences)
        if (typeof original === 'object' && typeof turbo === 'object') {
            const originalStr = JSON.stringify(original);
            const turboStr = JSON.stringify(turbo);
            
            if (originalStr === turboStr) {
                return { isEqual: true, reason: 'object_match' };
            }
            
            return {
                isEqual: false,
                reason: 'object_mismatch',
                original,
                turbo
            };
        }
        
        // Comparação genérica
        if (original === turbo) {
            return { isEqual: true, reason: 'generic_match' };
        }
        
        return {
            isEqual: false,
            reason: 'generic_mismatch',
            original,
            turbo
        };
    }
    
    /**
     * Registra métricas de performance
     */
    _recordPerformance(functionName, version, executionTime) {
        if (!this.performanceMetrics.has(functionName)) {
            this.performanceMetrics.set(functionName, {
                original: { times: [], avg: 0 },
                turbo: { times: [], avg: 0 }
            });
        }
        
        const metrics = this.performanceMetrics.get(functionName);
        const versionMetrics = metrics[version];
        
        versionMetrics.times.push(executionTime);
        
        // Mantém apenas últimas 100 medições
        if (versionMetrics.times.length > 100) {
            versionMetrics.times.shift();
        }
        
        // Calcula média
        versionMetrics.avg = versionMetrics.times.reduce((a, b) => a + b, 0) / versionMetrics.times.length;
    }
    
    /**
     * Registra erro
     */
    _recordError(functionName, version, error) {
        this.errorLog.push({
            timestamp: Date.now(),
            functionName,
            version,
            error: error.message,
            stack: error.stack
        });
        
        // Mantém apenas últimos 1000 erros
        if (this.errorLog.length > 1000) {
            this.errorLog.shift();
        }
    }
    
    /**
     * Registra resultado de comparação
     */
    _recordComparison(functionName, comparisonResult, originalTime, turboTime) {
        if (!this.comparisonResults.has(functionName)) {
            this.comparisonResults.set(functionName, []);
        }
        
        const results = this.comparisonResults.get(functionName);
        results.push({
            timestamp: Date.now(),
            isEqual: comparisonResult.isEqual,
            reason: comparisonResult.reason,
            originalTime,
            turboTime,
            performanceGain: ((originalTime - turboTime) / originalTime) * 100
        });
        
        // Mantém apenas últimas 100 comparações
        if (results.length > 100) {
            results.shift();
        }
    }
    
    /**
     * Força migração para turbo em função específica
     */
    enableTurboForFunction(functionName) {
        const state = this.migrationState.get(functionName);
        if (state) {
            state.useTurbo = true;
            console.log(`🚀 Turbo habilitado manualmente para ${functionName}`);
        }
    }
    
    /**
     * Força rollback para original em função específica
     */
    disableTurboForFunction(functionName) {
        const state = this.migrationState.get(functionName);
        if (state) {
            state.useTurbo = false;
            console.log(`⏪ Turbo desabilitado para ${functionName}`);
        }
    }
    
    /**
     * Habilita turbo para todas as funções (modo agressivo)
     */
    enableTurboForAll() {
        for (const [functionName, state] of this.migrationState) {
            state.useTurbo = true;
        }
        console.log('🚀 Turbo habilitado para todas as funções');
    }
    
    /**
     * Desabilita turbo para todas as funções (rollback completo)
     */
    disableTurboForAll() {
        for (const [functionName, state] of this.migrationState) {
            state.useTurbo = false;
        }
        console.log('⏪ Turbo desabilitado para todas as funções');
    }
    
    /**
     * Obtém relatório de migração
     */
    getMigrationReport() {
        const report = {
            summary: {
                totalFunctions: this.migrationState.size,
                turboEnabled: 0,
                totalSuccesses: 0,
                totalErrors: 0,
                totalComparisons: 0
            },
            functions: {},
            performance: {},
            errors: this.errorLog.slice(-10) // Últimos 10 erros
        };
        
        // Coleta dados por função
        for (const [functionName, state] of this.migrationState) {
            if (state.useTurbo) {
                report.summary.turboEnabled++;
            }
            
            report.summary.totalSuccesses += state.successCount;
            report.summary.totalErrors += state.errorCount;
            
            report.functions[functionName] = {
                useTurbo: state.useTurbo,
                successCount: state.successCount,
                errorCount: state.errorCount,
                comparisonFailures: state.comparisonFailures,
                avgPerformanceGain: state.avgPerformanceGain.toFixed(2),
                lastError: state.lastError
            };
            
            // Métricas de performance
            const perfMetrics = this.performanceMetrics.get(functionName);
            if (perfMetrics) {
                report.performance[functionName] = {
                    originalAvg: perfMetrics.original.avg.toFixed(3),
                    turboAvg: perfMetrics.turbo.avg.toFixed(3),
                    improvement: perfMetrics.original.avg > 0 
                        ? (((perfMetrics.original.avg - perfMetrics.turbo.avg) / perfMetrics.original.avg) * 100).toFixed(2)
                        : 'N/A'
                };
            }
        }
        
        return report;
    }
    
    /**
     * Executa teste de stress em todas as funções
     */
    runStressTest(iterations = 1000) {
        console.log(`🧪 Iniciando teste de stress com ${iterations} iterações...`);
        
        const testCases = {
            calculateEntryAmount: [[10000, 2.5], [5000, 1.0], [50000, 5.0]],
            calculateReturnAmount: [[100, 87], [250, 92], [500, 85]],
            calculateRecoveryEntry: [[100, 87], [250, 92], [500, 85]],
            calculateMathematicalExpectancy: [[60, 87], [55, 90], [70, 85]],
            calculateMaxDrawdown: [
                [[{isWin: false, resultado: -100}, {isWin: true, resultado: 87}]],
                [[{isWin: true, resultado: 100}, {isWin: false, resultado: -50}]]
            ],
            calculateSequences: [
                [[{isWin: true}, {isWin: true}, {isWin: false}]],
                [[{isWin: false}, {isWin: false}, {isWin: true}]]
            ],
            calculateProfitFactor: [
                [[{resultado: 100}, {resultado: -50}]],
                [[{resultado: 200}, {resultado: -100}]]
            ]
        };
        
        const results = {};
        
        for (const [functionName, cases] of Object.entries(testCases)) {
            results[functionName] = {
                totalTests: 0,
                successes: 0,
                errors: 0,
                avgTime: 0
            };
            
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                for (const testCase of cases) {
                    try {
                        this.executeFunction(functionName, ...testCase);
                        results[functionName].successes++;
                    } catch (error) {
                        results[functionName].errors++;
                    }
                    results[functionName].totalTests++;
                }
            }
            
            results[functionName].avgTime = (performance.now() - startTime) / results[functionName].totalTests;
        }
        
        console.log('🧪 Teste de stress concluído:', results);
        return results;
    }
}

// ============================================================================
// INSTÂNCIA GLOBAL E API
// ============================================================================

const migrator = new MathUtilsMigrator();

/**
 * API pública para execução de funções matemáticas
 */
export const MathUtils = {
    // Tier 1 - Funções críticas
    calculateEntryAmount: (...args) => migrator.executeFunction('calculateEntryAmount', ...args),
    calculateReturnAmount: (...args) => migrator.executeFunction('calculateReturnAmount', ...args),
    calculateRecoveryEntry: (...args) => migrator.executeFunction('calculateRecoveryEntry', ...args),
    
    // Tier 2 - Funções importantes
    calculateMathematicalExpectancy: (...args) => migrator.executeFunction('calculateMathematicalExpectancy', ...args),
    calculateMaxDrawdown: (...args) => migrator.executeFunction('calculateMaxDrawdown', ...args),
    calculateSequences: (...args) => migrator.executeFunction('calculateSequences', ...args),
    calculateProfitFactor: (...args) => migrator.executeFunction('calculateProfitFactor', ...args),
    
    // Utilitárias
    calculateStopValue: (...args) => migrator.executeFunction('calculateStopValue', ...args),
    toPercentage: (...args) => migrator.executeFunction('toPercentage', ...args),
    fromPercentage: (...args) => migrator.executeFunction('fromPercentage', ...args),
    
    // Constantes
    PERCENTAGE_DIVISOR: OriginalMath.PERCENTAGE_DIVISOR
};

/**
 * API de controle de migração
 */
export const MigrationControl = {
    // Controle individual
    enableTurbo: (functionName) => migrator.enableTurboForFunction(functionName),
    disableTurbo: (functionName) => migrator.disableTurboForFunction(functionName),
    
    // Controle global
    enableAllTurbo: () => migrator.enableTurboForAll(),
    disableAllTurbo: () => migrator.disableTurboForAll(),
    
    // Relatórios e testes
    getReport: () => migrator.getMigrationReport(),
    runStressTest: (iterations) => migrator.runStressTest(iterations),
    
    // Métricas turbo
    getTurboMetrics: () => TurboMath.getTurboMetrics(),
    clearTurboCache: () => TurboMath.clearTurboCache()
};

// Exposição global para testes e debugging
if (typeof window !== 'undefined') {
    window.MathUtilsMigrator = migrator;
    window.MigrationControl = MigrationControl;
}

console.log('🔄 MathUtils Migrator v1.0 carregado - Migração gradual ativa!');
