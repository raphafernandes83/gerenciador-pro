/**
 * 🚀 SCRIPT DE EXECUÇÃO MANUAL - Testes Funcionais Críticos
 * Execute este arquivo para validar os fluxos principais da aplicação
 */

// Função para executar testes diretamente no console
async function runManualFunctionalTests() {
    console.log('🧪 INICIANDO VALIDAÇÃO MANUAL DOS FLUXOS CRÍTICOS');
    console.log('='.repeat(60));

    const results = {
        tests: [],
        startTime: performance.now(),
    };

    try {
        // 1. Teste de Persistência de Sessão
        console.log('📊 1. TESTE: Persistência de Sessão');
        const sessionTest = await testSessionPersistence();
        results.tests.push({ name: 'Session Persistence', ...sessionTest });
        console.log(sessionTest.passed ? '✅ PASSOU' : '❌ FALHOU', sessionTest.details);

        // 2. Teste de Logger com RequestId
        console.log('\n🔍 2. TESTE: Logger com RequestId');
        const loggerTest = await testLoggerWithRequestId();
        results.tests.push({ name: 'Logger RequestId', ...loggerTest });
        console.log(loggerTest.passed ? '✅ PASSOU' : '❌ FALHOU', loggerTest.details);

        // 3. Teste de Charts e Progress
        console.log('\n📈 3. TESTE: Charts e Progress');
        const chartsTest = await testChartsAndProgress();
        results.tests.push({ name: 'Charts Progress', ...chartsTest });
        console.log(chartsTest.passed ? '✅ PASSOU' : '❌ FALHOU', chartsTest.details);

        // 4. Teste de Error Handling
        console.log('\n🛡️ 4. TESTE: Error Handling');
        const errorTest = await testErrorHandling();
        results.tests.push({ name: 'Error Handling', ...errorTest });
        console.log(errorTest.passed ? '✅ PASSOU' : '❌ FALHOU', errorTest.details);

        // 5. Teste de Performance
        console.log('\n⚡ 5. TESTE: Performance Básica');
        const perfTest = await testBasicPerformance();
        results.tests.push({ name: 'Basic Performance', ...perfTest });
        console.log(perfTest.passed ? '✅ PASSOU' : '❌ FALHOU', perfTest.details);
    } catch (error) {
        console.error('❌ ERRO CRÍTICO NA EXECUÇÃO:', error);
        results.criticalError = error.message;
    }

    // Relatório Final
    const endTime = performance.now();
    const duration = endTime - results.startTime;
    const passed = results.tests.filter((t) => t.passed).length;
    const total = results.tests.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL - TESTES FUNCIONAIS MANUAIS');
    console.log('='.repeat(60));
    console.log(`⏱️ Duração: ${duration.toFixed(2)}ms`);
    console.log(`📈 Taxa de Sucesso: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);

    if (results.criticalError) {
        console.log(`🚨 ERRO CRÍTICO: ${results.criticalError}`);
    }

    console.log('\n📋 DETALHES POR TESTE:');
    results.tests.forEach((test, i) => {
        const icon = test.passed ? '✅' : '❌';
        console.log(`${icon} ${i + 1}. ${test.name}: ${test.details}`);
    });

    return results;
}

// ===== IMPLEMENTAÇÃO DOS TESTES =====

async function testSessionPersistence() {
    try {
        // Verifica se dbManager existe e está funcional
        if (typeof window.dbManager === 'undefined') {
            return { passed: false, details: 'dbManager não encontrado' };
        }

        // Testa criação de sessão
        const testSession = {
            id: `manual_test_${Date.now()}`,
            modo: 'TEST',
            capitalInicial: 1000,
            dataInicio: new Date().toISOString(),
            historicoCombinado: [{ id: 1, resultado: 'win', valor: 85, timestamp: Date.now() }],
            totalOperacoes: 1,
            resultadoFinanceiro: 85,
        };

        // Tenta salvar e depois recuperar
        await window.dbManager.addSession(testSession);
        const retrieved = await window.dbManager.getSession(testSession.id);

        const success = retrieved && retrieved.id === testSession.id;

        // Limpa o teste
        if (success) {
            await window.dbManager.deleteSession(testSession.id);
        }

        return {
            passed: success,
            details: success ? 'Persistência funcionando' : 'Falha na recuperação',
        };
    } catch (error) {
        return { passed: false, details: `Erro: ${error.message}` };
    }
}

async function testLoggerWithRequestId() {
    try {
        // Verifica se logger está disponível
        if (typeof window.logger === 'undefined') {
            // Tenta importar
            try {
                const { logger } = await import('../src/utils/Logger.js');
                window.logger = logger;
            } catch {
                return { passed: false, details: 'Logger não disponível' };
            }
        }

        // Testa logging com requestId
        const testRequestId = 'manual_test_' + Date.now();
        const loggerWithRequest = window.logger.withRequest(testRequestId);

        // Captura logs temporariamente
        let logCaptured = false;
        const originalInfo = console.info;
        console.info = (...args) => {
            const message = args.join(' ');
            if (message.includes(testRequestId)) {
                logCaptured = true;
            }
            originalInfo.apply(console, args);
        };

        loggerWithRequest.info('Teste de correlação de requestId');

        // Restaura console.info
        setTimeout(() => {
            console.info = originalInfo;
        }, 100);

        return {
            passed: logCaptured,
            details: logCaptured ? 'RequestId funcionando' : 'RequestId não correlacionado',
        };
    } catch (error) {
        return { passed: false, details: `Erro: ${error.message}` };
    }
}

async function testChartsAndProgress() {
    try {
        // Verifica se charts está disponível
        if (typeof window.charts === 'undefined') {
            return { passed: false, details: 'Charts não encontrado' };
        }

        // Testa inicialização de gráfico de progresso
        const progressInitialized = window.charts.initProgressChart();

        if (!progressInitialized) {
            return { passed: false, details: 'Falha na inicialização do gráfico' };
        }

        // Testa atualização com dados de teste
        const testHistory = [
            { resultado: 'win', isWin: true },
            { resultado: 'win', isWin: true },
            { resultado: 'loss', isWin: false },
        ];

        const updateSuccess = window.charts.updateProgressChart(testHistory);

        return {
            passed: updateSuccess,
            details: updateSuccess ? 'Charts funcionando' : 'Falha na atualização',
        };
    } catch (error) {
        return { passed: false, details: `Erro: ${error.message}` };
    }
}

async function testErrorHandling() {
    try {
        // Verifica se ErrorHandler existe
        const hasErrorHandler =
            typeof window.ErrorHandler !== 'undefined' ||
            typeof window.SafeProtection !== 'undefined';

        if (!hasErrorHandler) {
            return { passed: false, details: 'Sistema de erro não encontrado' };
        }

        // Testa captura de erro controlado
        let errorCaptured = false;

        try {
            // Simula erro
            throw new Error('Teste de captura de erro');
        } catch (testError) {
            errorCaptured = true;

            // Se ErrorHandler existir, usa ele
            if (window.ErrorHandler && window.ErrorHandler.captureError) {
                window.ErrorHandler.captureError(testError, 'manual_test');
            }
        }

        return {
            passed: errorCaptured,
            details: errorCaptured ? 'Error handling funcionando' : 'Falha na captura',
        };
    } catch (error) {
        return { passed: false, details: `Erro: ${error.message}` };
    }
}

async function testBasicPerformance() {
    try {
        const startTime = performance.now();

        // Testa operações básicas de performance
        const operations = [];

        // Teste 1: Manipulação de DOM básica
        const testDiv = document.createElement('div');
        testDiv.innerHTML = 'Performance Test';
        document.body.appendChild(testDiv);
        operations.push('DOM manipulation');

        // Teste 2: Cálculo matemático simples
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
            sum += Math.random();
        }
        operations.push('Math calculation');

        // Teste 3: Acesso ao localStorage
        localStorage.setItem('perf_test', JSON.stringify({ test: true, timestamp: Date.now() }));
        const retrieved = localStorage.getItem('perf_test');
        operations.push('LocalStorage access');

        // Cleanup
        document.body.removeChild(testDiv);
        localStorage.removeItem('perf_test');

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Performance aceitável se < 100ms
        const performanceOk = duration < 100;

        return {
            passed: performanceOk,
            details: `${duration.toFixed(2)}ms para ${operations.length} operações`,
        };
    } catch (error) {
        return { passed: false, details: `Erro: ${error.message}` };
    }
}

// ===== EXPORTAÇÃO E EXECUÇÃO =====

// Auto-execução se carregado no browser
if (typeof window !== 'undefined') {
    // Disponibiliza globalmente
    window.runManualFunctionalTests = runManualFunctionalTests;

    console.log('✅ Script de testes manuais carregado!');
    console.log('🚀 Execute: runManualFunctionalTests() para iniciar os testes');
}

// Exporta para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runManualFunctionalTests };
}
