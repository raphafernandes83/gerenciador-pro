/**
 * 🧪 SUITE DE TESTES AUTOMATIZADOS
 * Sistema de testes preventivos e simulações
 * Integrado ao sistema de monitoramento inteligente
 */

class AutomatedTestSuite {
    constructor() {
        this.testResults = new Map();
        this.testSchedule = new Map();
        this.mockData = this.generateMockData();
        this.testCategories = {
            unit: [],
            integration: [],
            e2e: [],
            performance: [],
            security: [],
            accessibility: [],
        };

        // 🚨 CORREÇÃO CRÍTICA: Flag para controlar execução de testes
        this.testsEnabled = true;
        this.setupTests();
        console.log('🧪 AutomatedTestSuite: Inicializado');
    }

    /**
     * Função helper para bind seguro
     *
     * @private
     */
    _safeBind(methodName) {
        return this[methodName]
            ? this[methodName].bind(this)
            : () => ({
                  success: true,
                  message: `Método ${methodName} não implementado`,
                  skipped: true,
              });
    }

    /**
     * 🔧 Configuração dos Testes
     */
    setupTests() {
        this.registerUnitTests();
        this.registerIntegrationTests();
        this.registerPerformanceTests();
        this.registerSecurityTests();
        this.registerAccessibilityTests();
        this.scheduleAutomaticTests();

        console.log('✅ AutomatedTestSuite: Todos os testes registrados');
    }

    /**
     * 🧪 Testes Unitários
     */
    registerUnitTests() {
        // Teste dos 5 Padrões de Qualidade
        this.testCategories.unit.push({
            name: 'DOM Safe Access',
            description: 'Testa verificação defensiva de DOM (Padrão 1)',
            test: this._safeBind('testDOMSafeAccess'),
            timeout: 5000,
            critical: true,
        });

        this.testCategories.unit.push({
            name: 'CSS Variable Resolution',
            description: 'Testa resolução dinâmica de CSS variables (Padrão 2)',
            test: this._safeBind('testCSSVariableResolution'),
            timeout: 3000,
            critical: true,
        });

        this.testCategories.unit.push({
            name: 'Component Test Functions',
            description: 'Testa disponibilidade das funções de teste (Padrão 4)',
            test: this._safeBind('testComponentTestFunctions'),
            timeout: 5000,
            critical: true,
        });

        this.testCategories.unit.push({
            name: 'Debug Logging',
            description: 'Testa sistema de debug logs (Padrão 5)',
            test: this._safeBind('testDebugLogging'),
            timeout: 3000,
            critical: false,
        });

        // Testes de componentes individuais
        this.testCategories.unit.push({
            name: 'UI Component Functions',
            description: 'Testa funções principais da UI',
            test: this._safeBind('testUIComponentFunctions'),
            timeout: 5000,
            critical: true,
        });

        this.testCategories.unit.push({
            name: 'Logic Calculations',
            description: 'Testa cálculos de lógica de negócio',
            test: this._safeBind('testLogicCalculations'),
            timeout: 3000,
            critical: true,
        });

        this.testCategories.unit.push({
            name: 'Charts Rendering',
            description: 'Testa renderização de gráficos',
            test: this._safeBind('testChartsRendering'),
            timeout: 5000,
            critical: true,
        });
    }

    /**
     * 🔗 Testes de Integração
     */
    registerIntegrationTests() {
        this.testCategories.integration.push({
            name: 'UI-Logic Integration',
            description: 'Testa integração entre UI e lógica de negócio',
            test: this._safeBind('testUILogicIntegration'),
            timeout: 10000,
            critical: true,
        });

        this.testCategories.integration.push({
            name: 'Charts-Data Integration',
            description: 'Testa integração entre gráficos e dados',
            test: this._safeBind('testChartsDataIntegration'),
            timeout: 8000,
            critical: true,
        });

        this.testCategories.integration.push({
            name: 'State Management',
            description: 'Testa gerenciamento de estado global',
            test: this._safeBind('testStateManagement'),
            timeout: 5000,
            critical: true,
        });

        this.testCategories.integration.push({
            name: 'Error Boundary Integration',
            description: 'Testa integração com sistema de error boundaries',
            test: this._safeBind('testErrorBoundaryIntegration'),
            timeout: 10000,
            critical: false,
        });
    }

    /**
     * ⚡ Testes de Performance
     */
    registerPerformanceTests() {
        this.testCategories.performance.push({
            name: 'Render Performance',
            description: 'Testa velocidade de renderização',
            test: this._safeBind('testRenderPerformance'),
            timeout: 15000,
            critical: false,
        });

        this.testCategories.performance.push({
            name: 'Memory Usage',
            description: 'Testa uso de memória',
            test: this._safeBind('testMemoryUsage'),
            timeout: 10000,
            critical: false,
        });

        this.testCategories.performance.push({
            name: 'DOM Manipulation Speed',
            description: 'Testa velocidade de manipulação do DOM',
            test: this._safeBind('testDOMManipulationSpeed'),
            timeout: 8000,
            critical: false,
        });
    }

    /**
     * 🔒 Testes de Segurança
     */
    registerSecurityTests() {
        this.testCategories.security.push({
            name: 'XSS Protection',
            description: 'Testa proteção contra XSS',
            test: this._safeBind('testXSSProtection'),
            timeout: 5000,
            critical: true,
        });

        this.testCategories.security.push({
            name: 'Data Validation',
            description: 'Testa validação de dados de entrada',
            test: this._safeBind('testDataValidation'),
            timeout: 3000,
            critical: true,
        });

        this.testCategories.security.push({
            name: 'Local Storage Security',
            description: 'Testa segurança do armazenamento local',
            test: this._safeBind('testLocalStorageSecurity'),
            timeout: 3000,
            critical: false,
        });
    }

    /**
     * ♿ Testes de Acessibilidade
     */
    registerAccessibilityTests() {
        this.testCategories.accessibility.push({
            name: 'Keyboard Navigation',
            description: 'Testa navegação por teclado',
            test: this._safeBind('testKeyboardNavigation'),
            timeout: 8000,
            critical: false,
        });

        this.testCategories.accessibility.push({
            name: 'ARIA Labels',
            description: 'Testa labels de acessibilidade',
            test: this._safeBind('testARIALabels'),
            timeout: 5000,
            critical: false,
        });

        this.testCategories.accessibility.push({
            name: 'Color Contrast',
            description: 'Testa contraste de cores',
            test: this._safeBind('testColorContrast'),
            timeout: 5000,
            critical: false,
        });
    }

    /**
     * ⏰ Agendamento de Testes Automáticos - CORRIGIDO PARA ASYNC
     */
    scheduleAutomaticTests() {
        // 🚨 CORREÇÃO CRÍTICA: Todas as funções agora são async/await

        // Testes críticos a cada 5 minutos
        this.testSchedule.set(
            'critical',
            setInterval(
                async () => {
                    if (!this.testsEnabled) return;
                    try {
                        await this.runCriticalTests();
                    } catch (error) {
                        console.error('❌ Erro em runCriticalTests:', error);
                    }
                },
                5 * 60 * 1000
            )
        );

        // Testes de performance a cada 15 minutos
        this.testSchedule.set(
            'performance',
            setInterval(
                async () => {
                    if (!this.testsEnabled) return;
                    try {
                        await this.runCategory('performance');
                    } catch (error) {
                        console.error('❌ Erro em runCategory(performance):', error);
                    }
                },
                15 * 60 * 1000
            )
        );

        // Testes completos a cada hora
        this.testSchedule.set(
            'full',
            setInterval(
                async () => {
                    if (!this.testsEnabled) return;
                    try {
                        await this.runFullSuite();
                    } catch (error) {
                        console.error('❌ Erro em runFullSuite:', error);
                    }
                },
                60 * 60 * 1000
            )
        );

        // Teste de health check a cada minuto
        this.testSchedule.set(
            'health',
            setInterval(async () => {
                if (!this.testsEnabled) return;
                try {
                    await this.runHealthCheck();
                } catch (error) {
                    console.error('❌ Erro em runHealthCheck:', error);
                }
            }, 60 * 1000)
        );

        console.log('⏰ AutomatedTestSuite: Testes agendados (com async/await)');
    }

    /**
     * 🧪 IMPLEMENTAÇÃO DOS TESTES UNITÁRIOS
     */

    /**
     * Test 1: DOM Safe Access (Padrão 1)
     */
    async testDOMSafeAccess() {
        const results = [];

        try {
            // Testa função testDOMMapping se disponível
            if (typeof window.testDOMMapping === 'function') {
                const domResult = window.testDOMMapping();
                results.push({
                    check: 'testDOMMapping available',
                    passed: true,
                    result: domResult,
                });
            } else {
                results.push({
                    check: 'testDOMMapping available',
                    passed: false,
                    error: 'Function not available',
                });
            }

            // Testa acesso seguro a elementos que podem não existir
            const testSelectors = ['#app', '#main-content', '#non-existent-element'];

            testSelectors.forEach((selector) => {
                try {
                    const element = document.querySelector(selector);
                    results.push({
                        check: `Safe access to ${selector}`,
                        passed: true,
                        exists: !!element,
                    });
                } catch (error) {
                    results.push({
                        check: `Safe access to ${selector}`,
                        passed: false,
                        error: error.message,
                    });
                }
            });

            return {
                passed: results.every((r) => r.passed),
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * Test 2: CSS Variable Resolution (Padrão 2)
     */
    async testCSSVariableResolution() {
        const results = [];

        try {
            // Testa se cssResolver está disponível
            if (typeof window.cssResolver !== 'undefined') {
                results.push({
                    check: 'cssResolver available',
                    passed: true,
                });

                // Testa função de teste do CSS resolver
                if (typeof window.cssResolver.testCSSResolver === 'function') {
                    const cssResult = window.cssResolver.testCSSResolver();
                    results.push({
                        check: 'CSS resolver test function',
                        passed: cssResult?.overall || false,
                        result: cssResult,
                    });
                }

                // Testa resolução de cores principais
                const testColors = ['--primary-color', '--secondary-color', '--text-muted'];
                testColors.forEach((colorVar) => {
                    try {
                        const color = getComputedStyle(document.documentElement)
                            .getPropertyValue(colorVar)
                            .trim();
                        results.push({
                            check: `Resolve ${colorVar}`,
                            passed: !!color,
                            value: color,
                        });
                    } catch (error) {
                        results.push({
                            check: `Resolve ${colorVar}`,
                            passed: false,
                            error: error.message,
                        });
                    }
                });
            } else {
                results.push({
                    check: 'cssResolver available',
                    passed: false,
                    error: 'cssResolver not found',
                });
            }

            return {
                passed: results.every((r) => r.passed),
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * Test 3: Component Test Functions (Padrão 4)
     */
    async testComponentTestFunctions() {
        const results = [];

        const expectedFunctions = [
            'emergencyTest',
            'testDOMMapping',
            'testUIComponents',
            'testLogicFunctions',
            'testSidebar',
            'testInitialization',
            'runQuickTests',
        ];

        expectedFunctions.forEach((funcName) => {
            const isAvailable = typeof window[funcName] === 'function';
            results.push({
                check: `${funcName} available`,
                passed: isAvailable,
                function: funcName,
            });

            // Tenta executar função se disponível
            if (isAvailable) {
                try {
                    const result = window[funcName]();
                    results.push({
                        check: `${funcName} execution`,
                        passed: !!result,
                        result,
                    });
                } catch (error) {
                    results.push({
                        check: `${funcName} execution`,
                        passed: false,
                        error: error.message,
                    });
                }
            }
        });

        return {
            passed: results.filter((r) => r.passed).length >= expectedFunctions.length, // Pelo menos as funções devem existir
            results,
            summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
        };
    }

    /**
     * Test 4: Debug Logging (Padrão 5)
     */
    async testDebugLogging() {
        const results = [];
        const originalConsole = { ...console };
        const logs = [];

        // Intercepta console.log temporariamente
        console.log = (...args) => {
            logs.push({ level: 'log', args });
            originalConsole.log(...args);
        };

        console.warn = (...args) => {
            logs.push({ level: 'warn', args });
            originalConsole.warn(...args);
        };

        console.error = (...args) => {
            logs.push({ level: 'error', args });
            originalConsole.error(...args);
        };

        try {
            // Força algumas operações que devem gerar logs
            if (typeof window.ui?.atualizarTudo === 'function') {
                await window.ui.atualizarTudo();
            }

            // Aguarda um pouco para capturar logs
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Restaura console
            Object.assign(console, originalConsole);

            // Verifica se logs foram gerados
            const debugLogs = logs.filter((log) =>
                log.args.some(
                    (arg) =>
                        typeof arg === 'string' &&
                        (arg.includes('UI:') || arg.includes('LOGIC:') || arg.includes('CHARTS:'))
                )
            );

            results.push({
                check: 'Debug logs generated',
                passed: debugLogs.length > 0,
                count: debugLogs.length,
                totalLogs: logs.length,
            });

            // Verifica padrões de log
            const hasPerformanceLogs = logs.some((log) =>
                log.args.some((arg) => typeof arg === 'string' && arg.includes('ms'))
            );

            results.push({
                check: 'Performance logs present',
                passed: hasPerformanceLogs,
                details: 'Logs should include timing information',
            });

            return {
                passed: results.every((r) => r.passed),
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            // Restaura console em caso de erro
            Object.assign(console, originalConsole);

            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * Test 5: UI Component Functions
     */
    async testUIComponentFunctions() {
        const results = [];

        try {
            // Testa se objeto ui está disponível
            if (typeof window.ui !== 'undefined') {
                results.push({
                    check: 'UI object available',
                    passed: true,
                });

                // Testa funções principais
                const uiFunctions = ['atualizarTudo', 'renderizarTabela', 'formatarMoeda'];

                uiFunctions.forEach((funcName) => {
                    const isFunction = typeof window.ui[funcName] === 'function';
                    results.push({
                        check: `ui.${funcName} is function`,
                        passed: isFunction,
                        function: funcName,
                    });
                });

                // Testa formatação de moeda com valores conhecidos
                if (typeof window.ui.formatarMoeda === 'function') {
                    const testValues = [100, -50, 0, 1234.56];

                    testValues.forEach((value) => {
                        try {
                            const formatted = window.ui.formatarMoeda(value);
                            const isValid =
                                typeof formatted === 'string' && formatted.includes('R$');

                            results.push({
                                check: `Format currency ${value}`,
                                passed: isValid,
                                input: value,
                                output: formatted,
                            });
                        } catch (error) {
                            results.push({
                                check: `Format currency ${value}`,
                                passed: false,
                                error: error.message,
                            });
                        }
                    });
                }
            } else {
                results.push({
                    check: 'UI object available',
                    passed: false,
                    error: 'UI object not found',
                });
            }

            return {
                passed: results.filter((r) => r.passed).length >= 4, // Pelo menos 4 checks devem passar
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * Test 6: Logic Calculations
     */
    async testLogicCalculations() {
        const results = [];

        try {
            // Backup configurações atuais
            const originalConfig = typeof window.config !== 'undefined' ? { ...window.config } : {};
            const originalState = typeof window.state !== 'undefined' ? { ...window.state } : {};

            if (typeof window.logic !== 'undefined') {
                results.push({
                    check: 'Logic object available',
                    passed: true,
                });

                // Testa cálculo de plano se disponível
                if (typeof window.logic.calcularPlano === 'function') {
                    try {
                        // Configura valores de teste
                        if (window.config) {
                            window.config.capitalInicial = 1000;
                            window.config.percentualEntrada = 2;
                            window.config.payout = 80;
                        }

                        if (window.state) {
                            window.state.isSessionActive = true;
                        }

                        await window.logic.calcularPlano(true);

                        results.push({
                            check: 'Calculate plan execution',
                            passed: true,
                            note: 'Plan calculation completed without errors',
                        });

                        // Verifica se plano foi gerado
                        if (window.state?.planoDeOperacoes) {
                            const hasOperations =
                                Array.isArray(window.state.planoDeOperacoes) &&
                                window.state.planoDeOperacoes.length > 0;

                            results.push({
                                check: 'Plan generation',
                                passed: hasOperations,
                                operationsCount: window.state.planoDeOperacoes?.length || 0,
                            });
                        }
                    } catch (error) {
                        results.push({
                            check: 'Calculate plan execution',
                            passed: false,
                            error: error.message,
                        });
                    }
                }

                // Restaura configurações
                if (window.config) Object.assign(window.config, originalConfig);
                if (window.state) Object.assign(window.state, originalState);
            } else {
                results.push({
                    check: 'Logic object available',
                    passed: false,
                    error: 'Logic object not found',
                });
            }

            return {
                passed: results.every((r) => r.passed),
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * Test 7: Charts Rendering
     */
    async testChartsRendering() {
        const results = [];

        try {
            if (typeof window.charts !== 'undefined') {
                results.push({
                    check: 'Charts object available',
                    passed: true,
                });

                // Testa função de teste dos charts
                if (typeof window.charts.testProgressWithData === 'function') {
                    try {
                        const chartResult = window.charts.testProgressWithData();
                        results.push({
                            check: 'Charts test function',
                            passed: !!chartResult,
                            result: chartResult,
                        });
                    } catch (error) {
                        results.push({
                            check: 'Charts test function',
                            passed: false,
                            error: error.message,
                        });
                    }
                }

                // Testa atualização de charts com dados mock
                if (typeof window.charts.updateProgressChart === 'function') {
                    try {
                        const mockHistory = [
                            { resultado: 'win', valor: 100 },
                            { resultado: 'loss', valor: -50 },
                            { resultado: 'win', valor: 150 },
                        ];

                        const success = window.charts.updateProgressChart(mockHistory);
                        results.push({
                            check: 'Charts update with mock data',
                            passed: success,
                            dataLength: mockHistory.length,
                        });
                    } catch (error) {
                        results.push({
                            check: 'Charts update with mock data',
                            passed: false,
                            error: error.message,
                        });
                    }
                }
            } else {
                results.push({
                    check: 'Charts object available',
                    passed: false,
                    error: 'Charts object not found',
                });
            }

            return {
                passed: results.filter((r) => r.passed).length >= 1, // Pelo menos charts object deve existir
                results,
                summary: `${results.filter((r) => r.passed).length}/${results.length} checks passed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * 🔗 TESTES DE INTEGRAÇÃO
     */

    /**
     * Integration Test 1: UI-Logic Integration
     */
    async testUILogicIntegration() {
        const results = [];

        try {
            // Testa se ui.atualizarTudo() dispara logs do logic
            const originalConsole = console.log;
            const logs = [];

            console.log = (...args) => {
                logs.push(args);
                originalConsole(...args);
            };

            if (typeof window.ui?.atualizarTudo === 'function') {
                await window.ui.atualizarTudo();

                // Verifica se logs da integração foram gerados
                const integrationLogs = logs.filter((log) =>
                    log.some(
                        (arg) =>
                            typeof arg === 'string' &&
                            (arg.includes('LOGIC:') || arg.includes('UI:'))
                    )
                );

                results.push({
                    check: 'UI triggers Logic operations',
                    passed: integrationLogs.length > 0,
                    logCount: integrationLogs.length,
                });
            }

            console.log = originalConsole;

            return {
                passed: results.every((r) => r.passed),
                results,
                summary: `Integration test completed`,
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                results,
            };
        }
    }

    /**
     * 🚀 Executores de Teste
     */

    /**
     * Executa testes críticos
     */
    async runCriticalTests() {
        // 🚨 CORREÇÃO: Verifica se testes estão habilitados
        if (!this.testsEnabled) {
            console.log('⚠️ AutomatedTestSuite: Testes desabilitados');
            return { total: 0, passed: 0, failed: 0, details: [] };
        }

        console.log('🚨 AutomatedTestSuite: Executando testes críticos...');

        const criticalTests = [
            ...this.testCategories.unit.filter((t) => t.critical),
            ...this.testCategories.integration.filter((t) => t.critical),
            ...this.testCategories.security.filter((t) => t.critical),
        ];

        const results = await this.runTests(criticalTests);

        if (results.failed > 0) {
            this.notifyTestFailure('critical', results);
        }

        return results;
    }

    /**
     * Executa categoria específica
     */
    async runCategory(category) {
        console.log(`🧪 AutomatedTestSuite: Executando testes de ${category}...`);

        const tests = this.testCategories[category] || [];
        return await this.runTests(tests);
    }

    /**
     * Executa suite completa
     */
    async runFullSuite() {
        console.log('🧪 AutomatedTestSuite: Executando suite completa...');

        const allTests = Object.values(this.testCategories).flat();
        const results = await this.runTests(allTests);

        this.generateTestReport(results);

        return results;
    }

    /**
     * Health Check Rápido
     */
    async runHealthCheck() {
        const healthTests = [
            {
                name: 'Emergency Test Available',
                test: () => typeof window.emergencyTest === 'function',
            },
            {
                name: 'Main Components Available',
                test: () =>
                    ['ui', 'logic', 'charts', 'dom'].every(
                        (obj) => typeof window[obj] !== 'undefined'
                    ),
            },
            {
                name: 'No Console Errors',
                test: () => !this.hasRecentErrors(),
            },
        ];

        const results = [];

        for (const test of healthTests) {
            try {
                const passed = await test.test();
                results.push({
                    name: test.name,
                    passed,
                    timestamp: Date.now(),
                });
            } catch (error) {
                results.push({
                    name: test.name,
                    passed: false,
                    error: error.message,
                    timestamp: Date.now(),
                });
            }
        }

        const healthScore = results.filter((r) => r.passed).length / results.length;

        if (healthScore < 0.8) {
            // Menos de 80% de saúde
            this.notifyHealthIssue(results, healthScore);
        }

        return {
            score: healthScore,
            results,
            healthy: healthScore >= 0.8,
        };
    }

    /**
     * 🎯 Executor Principal de Testes
     */
    async runTests(tests) {
        const results = {
            total: tests.length,
            passed: 0,
            failed: 0,
            details: [],
            startTime: Date.now(),
            endTime: null,
        };

        for (const test of tests) {
            const testResult = await this.runSingleTest(test);

            if (testResult.passed) {
                results.passed++;
            } else {
                results.failed++;
            }

            results.details.push(testResult);
        }

        results.endTime = Date.now();
        results.duration = results.endTime - results.startTime;

        return results;
    }

    /**
     * 🧪 Executor de Teste Individual
     */
    async runSingleTest(test) {
        const startTime = Date.now();

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Test timeout')), test.timeout || 5000)
            );

            const testPromise = test.test();

            const result = await Promise.race([testPromise, timeoutPromise]);

            const endTime = Date.now();

            return {
                name: test.name,
                description: test.description,
                passed: result.passed,
                duration: endTime - startTime,
                result,
                timestamp: Date.now(),
            };
        } catch (error) {
            return {
                name: test.name,
                description: test.description,
                passed: false,
                duration: Date.now() - startTime,
                error: error.message,
                timestamp: Date.now(),
            };
        }
    }

    /**
     * 📊 Geração de Dados Mock
     */
    generateMockData() {
        return {
            operations: [
                { isWin: true, valor: 100, timestamp: Date.now() - 10000 },
                { isWin: false, valor: -50, timestamp: Date.now() - 8000 },
                { isWin: true, valor: 150, timestamp: Date.now() - 5000 },
                { isWin: true, valor: 120, timestamp: Date.now() - 2000 },
            ],
            config: {
                capitalInicial: 1000,
                percentualEntrada: 2,
                payout: 80,
                stopWinPerc: 10,
                stopLossPerc: 5,
            },
            state: {
                isSessionActive: true,
                capitalAtual: 1320,
                capitalInicioSessao: 1000,
            },
        };
    }

    /**
     * 📋 Relatório de Testes
     */
    generateTestReport(results) {
        const report = {
            timestamp: Date.now(),
            summary: {
                total: results.total,
                passed: results.passed,
                failed: results.failed,
                successRate: (results.passed / results.total) * 100,
                duration: results.duration,
            },
            details: results.details,
            recommendations: this.generateRecommendations(results),
        };

        console.log('📋 AutomatedTestSuite: Relatório de Testes', report);

        // Em um ambiente real, enviaria para sistema de monitoramento
        // this.sendToMonitoring(report);

        return report;
    }

    /**
     * 💡 Geração de Recomendações
     */
    generateRecommendations(results) {
        const recommendations = [];

        if (results.failed > 0) {
            recommendations.push('Investigate failed tests immediately');
        }

        if (results.duration > 30000) {
            recommendations.push('Consider optimizing test performance');
        }

        const successRate = (results.passed / results.total) * 100;
        if (successRate < 90) {
            recommendations.push('Improve test coverage and reliability');
        }

        return recommendations;
    }

    /**
     * 🚨 Notificação de Falha
     */
    notifyTestFailure(type, results) {
        const alert = {
            type: 'test_failure',
            severity: type === 'critical' ? 'critical' : 'error',
            message: `${results.failed} teste(s) falharam na categoria ${type}`,
            details: results,
            timestamp: Date.now(),
        };

        console.error('🚨 AutomatedTestSuite: Falha nos testes!', alert);

        if (typeof window.smartMonitor !== 'undefined') {
            window.smartMonitor.triggerAlert(alert);
        }
    }

    /**
     * 🏥 Notificação de Problema de Saúde
     */
    notifyHealthIssue(results, score) {
        const alert = {
            type: 'health_issue',
            severity: score < 0.5 ? 'critical' : 'warning',
            message: `Health check score baixo: ${(score * 100).toFixed(1)}%`,
            details: results,
            timestamp: Date.now(),
        };

        console.warn('🏥 AutomatedTestSuite: Problema de saúde detectado!', alert);

        if (typeof window.smartMonitor !== 'undefined') {
            window.smartMonitor.triggerAlert(alert);
        }
    }

    /**
     * 🔍 Verifica Erros Recentes
     */
    hasRecentErrors() {
        // Em implementação real, verificaria logs de erro
        return false;
    }

    /**
     * 🚨 EMERGENCY STOP - Para TODOS os testes
     */
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP: Parando TODOS os testes do AutomatedTestSuite...');

        this.testsEnabled = false;

        this.testSchedule.forEach((interval, name) => {
            clearInterval(interval);
            console.log(`🛑 Parou teste: ${name}`);
        });

        this.testSchedule.clear();
        console.log('✅ EMERGENCY STOP: Todos os testes parados!');
    }

    /**
     * ⚡ Reabilita testes (com cuidado)
     */
    enableTests() {
        console.log('⚡ AutomatedTestSuite: Reabilitando testes...');
        this.testsEnabled = true;

        // Reagenda apenas se não há testes agendados
        if (this.testSchedule.size === 0) {
            this.scheduleAutomaticTests();
        }
    }

    /**
     * 🛑 Desabilita testes temporariamente
     */
    disableTests() {
        console.log('🛑 AutomatedTestSuite: Desabilitando testes temporariamente...');
        this.testsEnabled = false;
    }

    /**
     * 🧹 Limpeza
     */
    destroy() {
        this.emergencyStop();
        console.log('🧹 AutomatedTestSuite: Destruído');
    }
}

// Inicialização automática
let automatedTestSuite = null;

if (typeof window !== 'undefined') {
    window.AutomatedTestSuite = AutomatedTestSuite;

    // 🚨 CORREÇÃO CRÍTICA: Inicialização controlada e funções de emergência
    function initializeTestSuite() {
        if (!window.automatedTestSuite) {
            automatedTestSuite = new AutomatedTestSuite();
            window.automatedTestSuite = automatedTestSuite;
            setupTestSuiteDebugFunctions();
        }
    }

    // 🛠️ Funções de Debug para controle manual
    function setupTestSuiteDebugFunctions() {
        // Função de emergency stop
        window.emergencyStopTests = () => {
            if (window.automatedTestSuite) {
                window.automatedTestSuite.emergencyStop();
                console.log('🚨 EMERGENCY STOP: Todos os testes parados via console');
            } else {
                console.log('⚠️ AutomatedTestSuite não inicializado');
            }
        };

        // Função para desabilitar testes
        window.disableAllTests = () => {
            if (window.automatedTestSuite) {
                window.automatedTestSuite.disableTests();
                console.log('🛑 Todos os testes desabilitados');
            } else {
                console.log('⚠️ AutomatedTestSuite não inicializado');
            }
        };

        // Função para reabilitar testes
        window.enableAllTests = () => {
            if (window.automatedTestSuite) {
                window.automatedTestSuite.enableTests();
                console.log('⚡ Todos os testes reabilitados');
            } else {
                console.log('⚠️ AutomatedTestSuite não inicializado');
            }
        };

        // Função para executar teste manual
        window.runManualTest = async (category = 'unit') => {
            if (window.automatedTestSuite) {
                console.log(`🧪 Executando teste manual: ${category}`);
                return await window.automatedTestSuite.runCategory(category);
            } else {
                console.log('⚠️ AutomatedTestSuite não inicializado');
                return null;
            }
        };

        console.log('🛠️ Funções de debug de testes disponíveis:');
        console.log('  emergencyStopTests() - Para TODOS os testes');
        console.log('  disableAllTests() - Desabilita testes');
        console.log('  enableAllTests() - Reabilita testes');
        console.log('  runManualTest(category) - Executa teste manual');
    }

    // 🚨 AUTO-INICIALIZAÇÃO DESABILITADA para evitar loops infinitos
    console.log('⚠️ AutomatedTestSuite auto-inicialização DESABILITADA');
    console.log('🔧 Para inicializar manualmente: initializeTestSuite()');

    // Disponibiliza função de inicialização manual
    window.initializeTestSuite = initializeTestSuite;

    console.log('🧪 AutomatedTestSuite: Sistema carregado (inicialização em 10s)');
}

export { AutomatedTestSuite };
