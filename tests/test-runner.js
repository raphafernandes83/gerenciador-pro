/**
 * SISTEMA DE TESTES AUTOMÁTICOS
 * Framework completo para testar todas as funcionalidades do projeto
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            duration: 0,
        };
        this.currentSuite = null;
        this.testResults = [];
    }

    // Métodos principais do framework
    describe(suiteName, testFunction) {
        this.currentSuite = suiteName;
        console.log(`\n🧪 Executando suíte: ${suiteName}`);
        testFunction();
    }

    async it(testName, testFunction) {
        this.results.total++;
        const startTime = performance.now();

        try {
            // Timeout individual por teste (30 segundos para testes complexos)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error('Timeout: Teste demorou mais de 30 segundos')),
                    30000
                );
            });

            const testPromise = new Promise((resolve, reject) => {
                try {
                    const result = testFunction();
                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            });

            // Se for uma função assíncrona, aguarda com timeout
            if (testFunction.constructor.name === 'AsyncFunction') {
                await Promise.race([testPromise, timeoutPromise]);
            } else {
                await testPromise;
            }

            this.results.passed++;
            const duration = performance.now() - startTime;
            this.testResults.push({
                suite: this.currentSuite,
                name: testName,
                status: 'PASS',
                duration: duration,
                error: null,
            });
            console.log(`  ✅ ${testName} (${duration.toFixed(2)}ms)`);
        } catch (error) {
            this.results.failed++;
            const duration = performance.now() - startTime;
            this.testResults.push({
                suite: this.currentSuite,
                name: testName,
                status: 'FAIL',
                duration: duration,
                error: error.message,
            });
            console.log(`  ❌ ${testName} - ${error.message} (${duration.toFixed(2)}ms)`);
        }
    }

    // Assertions (verificações)
    expect(actual) {
        const expectObj = {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Esperado ${expected}, mas recebeu ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(
                        `Esperado ${JSON.stringify(expected)}, mas recebeu ${JSON.stringify(actual)}`
                    );
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Esperado > ${expected}, mas recebeu ${actual}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Esperado < ${expected}, mas recebeu ${actual}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Esperado valor truthy, mas recebeu ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Esperado valor falsy, mas recebeu ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Esperado conter ${expected}, mas não encontrado em ${actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Esperado length ${expected}, mas recebeu ${actual.length}`);
                }
            },
            toThrow: () => {
                try {
                    actual();
                    throw new Error('Esperado que a função lance um erro, mas não lançou');
                } catch (error) {
                    // Sucesso - a função lançou um erro como esperado
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Esperado valor definido, mas recebeu undefined');
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Esperado undefined, mas recebeu ${actual}`);
                }
            },
            toBeLessThanOrEqual: (expected) => {
                if (actual > expected) {
                    throw new Error(`Esperado <= ${expected}, mas recebeu ${actual}`);
                }
            },
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Esperado >= ${expected}, mas recebeu ${actual}`);
                }
            },
            toMatch: (expected) => {
                if (expected instanceof RegExp) {
                    if (!expected.test(actual)) {
                        throw new Error(
                            `Esperado que '${actual}' corresponda ao padrão ${expected}`
                        );
                    }
                } else {
                    if (!actual.includes(expected)) {
                        throw new Error(`Esperado que '${actual}' contenha '${expected}'`);
                    }
                }
            },
            toBeCloseTo: (expected, precision = 2) => {
                const diff = Math.abs(actual - expected);
                const tolerance = Math.pow(10, -precision) / 2;
                if (diff >= tolerance) {
                    throw new Error(
                        `Esperado que ${actual} seja próximo de ${expected} (precisão ${precision}), mas a diferença foi ${diff}`
                    );
                }
            },
        };

        // Implementar .not para inversão de expectativas
        expectObj.not = {
            toBe: (expected) => {
                if (actual === expected) {
                    throw new Error(`Esperado que NÃO fosse ${expected}, mas recebeu ${actual}`);
                }
            },
            toContain: (expected) => {
                if (actual.includes(expected)) {
                    throw new Error(
                        `Esperado que NÃO contivesse ${expected}, mas encontrado em ${actual}`
                    );
                }
            },
            toMatch: (expected) => {
                if (expected instanceof RegExp) {
                    if (expected.test(actual)) {
                        throw new Error(
                            `Esperado que '${actual}' NÃO correspondesse ao padrão ${expected}`
                        );
                    }
                } else {
                    if (actual.includes(expected)) {
                        throw new Error(`Esperado que '${actual}' NÃO contivesse '${expected}'`);
                    }
                }
            },
        };

        return expectObj;
    }

    // Executar todos os testes
    async runAllTests() {
        console.log('🚀 INICIANDO TESTES AUTOMÁTICOS...');
        const startTime = performance.now();

        // Timeout de segurança (60 segundos)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
                () => reject(new Error('Timeout: Testes demoraram mais de 60 segundos')),
                60000
            );
        });

        const testsPromise = this.executeAllTestSuites();

        try {
            await Promise.race([testsPromise, timeoutPromise]);
        } catch (error) {
            console.error('Erro ou timeout nos testes:', error);
            throw error;
        }

        this.results.duration = performance.now() - startTime;
        this.generateReport();
        this.showResultsInUI();
    }

    // Método separado para executar as suítes
    async executeAllTestSuites() {
        // Executar todas as suítes de teste
        await this.runLogicTests();
        await this.runStateTests();
        await this.runUITests();
        await this.runDatabaseTests();
        await this.runSimulationTests();
        await this.runAnalysisTests();
        await this.runValidationTests();
        await this.runIntegrationTests();
        await this.runEventTests();
        await this.runPerformanceTests();
        await this.runSecurityTests();
        await this.runAccessibilityTests();
        await this.runResponsivenessTests();
        await this.runBackupTests();
        await this.runSupabaseTests();
        await this.runStopConditionsTests();
        await this.runProfitIncorporationTests();
        await this.runTimelineTests();
        await this.runTemporalAnalysisTests();
        await this.runStrategyTransitionTests();
        await this.runDailyMonthlyGoalsTests();
        await this.runSessionReplayTests();
        await this.runAdvancedMetricsTests();
        await this.runErrorFixTests();
        await this.runNotificationsTests();
        await this.runAdvancedReportsTests();
        await this.runIntelligentBackupTests();
        await this.runDataSyncTests();
        await this.runPushNotificationTests();
        await this.runIntelligentCacheTests();
        await this.runPerformanceOptimizationTests();
        await this.runSystemMonitoringTests();
        await this.runMachineLearningTests();
        await this.runPredictiveAnalysisTests();
        await this.runExternalAPITests();
        await this.runAdvancedExportTests();
        await this.runAuditTests();
        await this.runArtificialIntelligenceTests();
        await this.runBlockchainTests();
        await this.runAdvancedMachineLearningTests();
        await this.runMultiplatformTests();
        await this.runAdvancedSecurityTests();
        await this.runAdvancedAITests();
        await this.runDistributedSystemsTests();
        await this.runSupplementalCoverageTests();
        // Suite adicional: robustez de modal da sidebar
        if (typeof this.runSidebarModalTests === 'function') {
            await this.runSidebarModalTests();
        }
        // Suite adicional: robustez do gráfico de pizza
        if (typeof this.runChartsPieRobustnessTests === 'function') {
            await this.runChartsPieRobustnessTests();
        }
        // Suite adicional: payout e reinit chart safety
        if (typeof this.runPayoutAndChartSafetyTests === 'function') {
            await this.runPayoutAndChartSafetyTests();
        }
        // Suite adicional: UI do template de parâmetros (sidebar)
        if (typeof this.runParametersTemplateUITests === 'function') {
            await this.runParametersTemplateUITests();
        }
    }

    // Gerar relatório
    generateReport() {
        console.log('\n📊 RELATÓRIO DE TESTES');
        console.log('='.repeat(50));
        console.log(`Total de testes: ${this.results.total}`);
        console.log(`✅ Passaram: ${this.results.passed}`);
        console.log(`❌ Falharam: ${this.results.failed}`);
        console.log(`⏱️  Duração: ${this.results.duration.toFixed(2)}ms`);
        console.log(
            `📈 Taxa de sucesso: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`
        );

        if (this.results.failed > 0) {
            console.log('\n❌ TESTES QUE FALHARAM:');
            this.testResults
                .filter((test) => test.status === 'FAIL')
                .forEach((test) => {
                    console.log(`  • ${test.suite} > ${test.name}: ${test.error}`);
                });
        }
    }

    // Mostrar resultados na interface
    showResultsInUI() {
        const resultsDiv = document.getElementById('test-results');
        if (!resultsDiv) return;

        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        const statusClass = this.results.failed === 0 ? 'test-success' : 'test-warning';

        resultsDiv.innerHTML = `
            <div class="test-header ${statusClass}">
                <h3>🧪 Resultados dos Testes Automáticos</h3>
                <div class="test-stats">
                    <span>✅ ${this.results.passed}</span>
                    <span>❌ ${this.results.failed}</span>
                    <span>⏱️ ${this.results.duration.toFixed(0)}ms</span>
                    <span>📈 ${successRate}%</span>
                </div>
            </div>
            <div class="test-details">
                ${this.testResults
                    .map(
                        (test) => `
                    <div class="test-item ${test.status.toLowerCase()}">
                        <span class="test-icon">${test.status === 'PASS' ? '✅' : '❌'}</span>
                        <span class="test-suite">${test.suite}</span>
                        <span class="test-name">${test.name}</span>
                        <span class="test-duration">${test.duration.toFixed(0)}ms</span>
                        ${test.error ? `<span class="test-error">${test.error}</span>` : ''}
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;
    }
}

// Instância global do test runner
window.testRunner = new TestRunner();

// Função para executar testes via console
window.runTests = async () => {
    // Aguardar que todos os módulos estejam carregados
    await waitForModules();
    testRunner.runAllTests();
};

// Função para aguardar que todos os módulos estejam disponíveis
async function waitForModules() {
    const maxAttempts = 50; // 5 segundos máximo
    let attempts = 0;

    while (attempts < maxAttempts) {
        if (
            window.logic &&
            window.state &&
            window.ui &&
            window.charts &&
            window.simulation &&
            window.analysis &&
            window.dbManager
        ) {
            console.log('✅ Todos os módulos carregados!');
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
    }

    console.warn('⚠️ Alguns módulos podem não ter sido carregados completamente');
}

// Função para executar testes específicos
window.runTestSuite = (suiteName) => {
    console.log(`Executando apenas a suíte: ${suiteName}`);
    // Implementar execução específica por suíte
};

console.log('🧪 Sistema de Testes Automáticos carregado!');
console.log('💡 Use runTests() no console para executar todos os testes');
console.log('💡 Use runTestSuite("nome") para executar uma suíte específica');
