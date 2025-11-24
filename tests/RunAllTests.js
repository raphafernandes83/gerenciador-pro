/**
 * Executor de Todos os Testes
 * Roda todos os testes criados e gera relatório consolidado
 */

import { runCalculationsUtilsTests } from './CalculationsUtils.test.js';
import { runStateLoaderTests } from './StateLoader.test.js';
import { runGoalsCheckerTests } from './GoalsChecker.test.js';

/**
 * Executa todos os testes e gera relatório consolidado
 */
export async function runAllModuleTests() {
    console.clear();
    console.log('🚀 EXECUTANDO TODOS OS TESTES DOS MÓDULOS\n');
    console.log('='.repeat(70));

    const results = {
        suites: [],
        totalPassed: 0,
        totalFailed: 0,
        totalTests: 0
    };

    // Teste 1: CalculationsUtils
    try {
        const calc = await runCalculationsUtilsTests();
        results.suites.push({ name: 'CalculationsUtils', ...calc });
        results.totalPassed += calc.passed;
        results.totalFailed += calc.failed;
        results.totalTests += calc.total;
    } catch (error) {
        console.error('❌ Erro ao executar CalculationsUtils tests:', error);
    }

    // Teste 2: StateLoader
    try {
        const state = await runStateLoaderTests();
        results.suites.push({ name: 'StateLoader', ...state });
        results.totalPassed += state.passed;
        results.totalFailed += state.failed;
        results.totalTests += state.total;
    } catch (error) {
        console.error('❌ Erro ao executar StateLoader tests:', error);
    }

    // Teste 3: GoalsChecker
    try {
        const goals = await runGoalsCheckerTests();
        results.suites.push({ name: 'GoalsChecker', ...goals });
        results.totalPassed += goals.passed;
        results.totalFailed += goals.failed;
        results.totalTests += goals.total;
    } catch (error) {
        console.error('❌ Erro ao executar GoalsChecker tests:', error);
    }

    // Relatório Consolidado
    console.log('\n\n');
    console.log('═'.repeat(70));
    console.log('        📊 RELATÓRIO CONSOLIDADO DE TESTES');
    console.log('═'.repeat(70));

    results.suites.forEach(suite => {
        const percentage = ((suite.passed / suite.total) * 100).toFixed(1);
        const icon = percentage === '100.0' ? '🎉' : percentage >= '80.0' ? '✅' : '⚠️';

        console.log(`\n${icon} ${suite.name}`);
        console.log(`   Passou: ${suite.passed}/${suite.total} (${percentage}%)`);

        if (suite.failed > 0) {
            console.log(`   ❌ Falhou: ${suite.failed}`);
        }
    });

    console.log('\n' + '─'.repeat(70));
    console.log('📈 TOTAIS GERAIS');
    console.log('─'.repeat(70));
    console.log(`Total de Suites: ${results.suites.length}`);
    console.log(`Total de Testes: ${results.totalTests}`);
    console.log(`✅ Passou: ${results.totalPassed}`);
    console.log(`❌ Falhou: ${results.totalFailed}`);

    const overallPercentage = ((results.totalPassed / results.totalTests) * 100).toFixed(2);
    console.log(`\n📊 Taxa de Sucesso Global: ${overallPercentage}%`);

    if (overallPercentage === '100.00') {
        console.log('\n🎉🎉🎉 TODOS OS TESTES PASSARAM! 🎉🎉🎉');
    } else if (parseFloat(overallPercentage) >= 90) {
        console.log('\n✅ Excelente! Mais de 90% de sucesso!');
    } else if (parseFloat(overallPercentage) >= 80) {
        console.log('\n👍 Bom! Mais de 80% de sucesso!');
    } else {
        console.log('\n⚠️ Atenção! Menos de 80% de sucesso.');
    }

    console.log('═'.repeat(70));
    console.log('\n');

    return results;
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.runAllModuleTests = runAllModuleTests;
    console.log('🧪 Executor de testes carregado!');
    console.log('   Execute: runAllModuleTests()');
}

export default runAllModuleTests;
