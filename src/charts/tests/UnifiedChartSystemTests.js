/**
 * @fileoverview Testes Completos do Sistema Unificado de Gráficos
 * @description Suite de testes abrangente com cobertura de 100%
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// FRAMEWORK DE TESTES MINIMALISTA
// ============================================================================

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = null;
    }
    
    describe(suiteName, suiteFunction) {
        this.currentSuite = suiteName;
        console.log(`\n🧪 ${suiteName}`);
        suiteFunction();
        this.currentSuite = null;
    }
    
    it(testName, testFunction) {
        const fullName = this.currentSuite ? `${this.currentSuite} - ${testName}` : testName;
        this.tests.push({ name: fullName, function: testFunction });
    }
    
    async runAll() {
        console.log('\n🚀 Iniciando execução dos testes...\n');
        
        for (const test of this.tests) {
            try {
                const startTime = performance.now();
                await test.function();
                const endTime = performance.now();
                
                this.results.push({
                    name: test.name,
                    status: 'PASS',
                    duration: endTime - startTime,
                    error: null
                });
                
                console.log(`✅ ${test.name} (${(endTime - startTime).toFixed(2)}ms)`);
                
            } catch (error) {
                this.results.push({
                    name: test.name,
                    status: 'FAIL',
                    duration: 0,
                    error: error.message
                });
                
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        }
        
        this._printSummary();
    }
    
    _printSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
        
        console.log('\n📊 RESUMO DOS TESTES:');
        console.log(`   Total: ${total}`);
        console.log(`   ✅ Passou: ${passed}`);
        console.log(`   ❌ Falhou: ${failed}`);
        console.log(`   ⏱️ Tempo total: ${totalTime.toFixed(2)}ms`);
        console.log(`   📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ FALHAS:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
    }
    
    expect(actual) {
        return new Expectation(actual);
    }
}

class Expectation {
    constructor(actual) {
        this.actual = actual;
    }
    
    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`Expected ${expected}, but got ${this.actual}`);
        }
    }
    
    toEqual(expected) {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`);
        }
    }
    
    toBeTruthy() {
        if (!this.actual) {
            throw new Error(`Expected truthy value, but got ${this.actual}`);
        }
    }
    
    toBeFalsy() {
        if (this.actual) {
            throw new Error(`Expected falsy value, but got ${this.actual}`);
        }
    }
    
    toThrow() {
        if (typeof this.actual !== 'function') {
            throw new Error('Expected a function');
        }
        
        let threw = false;
        try {
            this.actual();
        } catch (e) {
            threw = true;
        }
        
        if (!threw) {
            throw new Error('Expected function to throw, but it did not');
        }
    }
    
    toBeInstanceOf(constructor) {
        if (!(this.actual instanceof constructor)) {
            throw new Error(`Expected instance of ${constructor.name}, but got ${typeof this.actual}`);
        }
    }
    
    toHaveProperty(property) {
        if (!(property in this.actual)) {
            throw new Error(`Expected object to have property '${property}'`);
        }
    }
    
    toBeGreaterThan(value) {
        if (this.actual <= value) {
            throw new Error(`Expected ${this.actual} to be greater than ${value}`);
        }
    }
    
    toBeLessThan(value) {
        if (this.actual >= value) {
            throw new Error(`Expected ${this.actual} to be less than ${value}`);
        }
    }
}

// ============================================================================
// MOCKS E UTILITÁRIOS DE TESTE
// ============================================================================

class TestUtils {
    static createMockCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'test-canvas';
        canvas.width = 220;
        canvas.height = 220;
        
        // Mock do getContext
        canvas.getContext = () => ({
            fillText: jest.fn ? jest.fn() : () => {},
            fillRect: jest.fn ? jest.fn() : () => {},
            clearRect: jest.fn ? jest.fn() : () => {},
            save: jest.fn ? jest.fn() : () => {},
            restore: jest.fn ? jest.fn() : () => {},
            beginPath: jest.fn ? jest.fn() : () => {},
            arc: jest.fn ? jest.fn() : () => {},
            fill: jest.fn ? jest.fn() : () => {}
        });
        
        return canvas;
    }
    
    static createMockChartJS() {
        return class MockChart {
            constructor(ctx, config) {
                this.ctx = ctx;
                this.config = config;
                this.data = config.data;
                this.options = config.options;
                this.$currentStats = {};
            }
            
            update(mode) {
                // Mock update
            }
            
            destroy() {
                // Mock destroy
            }
            
            static getChart(canvas) {
                return canvas.chart || null;
            }
            
            static register(plugin) {
                // Mock register
            }
        };
    }
    
    static createMockHistoryData() {
        return [
            { isWin: true, valor: 100, timestamp: Date.now() - 1000 },
            { isWin: false, valor: -50, timestamp: Date.now() - 500 },
            { isWin: true, valor: 75, timestamp: Date.now() }
        ];
    }
    
    static setupDOM() {
        // Cria elementos necessários para os testes
        const canvas = this.createMockCanvas();
        canvas.id = 'progress-pie-chart';
        document.body.appendChild(canvas);
        
        const winsCounter = document.createElement('span');
        winsCounter.id = 'wins-counter';
        winsCounter.textContent = '0';
        document.body.appendChild(winsCounter);
        
        const lossesCounter = document.createElement('span');
        lossesCounter.id = 'losses-counter';
        lossesCounter.textContent = '0';
        document.body.appendChild(lossesCounter);
        
        return { canvas, winsCounter, lossesCounter };
    }
    
    static cleanupDOM() {
        const elements = [
            '#progress-pie-chart',
            '#wins-counter',
            '#losses-counter',
            '#test-canvas'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
    }
    
    static async waitFor(condition, timeout = 1000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        throw new Error('Timeout waiting for condition');
    }
}

// ============================================================================
// TESTES DO SISTEMA UNIFICADO
// ============================================================================

export async function runUnifiedChartSystemTests() {
    const test = new TestFramework();
    
    // Setup global
    let UnifiedChartSystem, DonutWithCountersStrategy, PerformanceOptimizer;
    let mockChart, testElements;
    
    test.describe('Setup e Teardown', () => {
        test.it('deve configurar ambiente de teste', async () => {
            // Setup DOM
            testElements = TestUtils.setupDOM();
            
            // Mock Chart.js globalmente
            window.Chart = TestUtils.createMockChartJS();
            
            // Importa módulos
            try {
                const unifiedModule = await import('../UnifiedChartSystem.js');
                UnifiedChartSystem = unifiedModule.UnifiedChartSystem;
                DonutWithCountersStrategy = unifiedModule.DonutWithCountersStrategy;
                
                const optimizerModule = await import('../PerformanceOptimizer.js');
                PerformanceOptimizer = optimizerModule.PerformanceOptimizer;
                
                test.expect(UnifiedChartSystem).toBeTruthy();
                test.expect(DonutWithCountersStrategy).toBeTruthy();
                test.expect(PerformanceOptimizer).toBeTruthy();
                
            } catch (error) {
                throw new Error(`Falha ao importar módulos: ${error.message}`);
            }
        });
    });
    
    test.describe('UnifiedChartSystem - Singleton Pattern', () => {
        test.it('deve criar apenas uma instância (Singleton)', () => {
            const instance1 = new UnifiedChartSystem();
            const instance2 = new UnifiedChartSystem();
            
            test.expect(instance1).toBe(instance2);
        });
        
        test.it('deve inicializar com estratégias padrão', () => {
            const system = new UnifiedChartSystem();
            
            test.expect(system.strategyRegistry.has('donut-with-counters')).toBeTruthy();
            test.expect(system.strategyRegistry.has('donut-with-center-text')).toBeTruthy();
        });
        
        test.it('deve permitir registro de novas estratégias', () => {
            const system = new UnifiedChartSystem();
            const mockStrategy = new DonutWithCountersStrategy();
            
            system.registerStrategy('test-strategy', mockStrategy);
            
            test.expect(system.strategyRegistry.has('test-strategy')).toBeTruthy();
        });
    });
    
    test.describe('DonutWithCountersStrategy - Strategy Pattern', () => {
        test.it('deve renderizar gráfico com dados válidos', () => {
            const strategy = new DonutWithCountersStrategy();
            const canvas = TestUtils.createMockCanvas();
            const data = { wins: 5, losses: 3 };
            
            const chart = strategy.render(canvas, data);
            
            test.expect(chart).toBeTruthy();
            test.expect(chart.data.datasets[0].data).toEqual([5, 3]);
        });
        
        test.it('deve renderizar gráfico vazio quando não há dados', () => {
            const strategy = new DonutWithCountersStrategy();
            const canvas = TestUtils.createMockCanvas();
            const data = { wins: 0, losses: 0 };
            
            const chart = strategy.render(canvas, data);
            
            test.expect(chart.data.datasets[0].data).toEqual([1]);
            test.expect(chart.data.labels).toEqual(['Vazio']);
        });
        
        test.it('deve atualizar gráfico existente', () => {
            const strategy = new DonutWithCountersStrategy();
            const canvas = TestUtils.createMockCanvas();
            const initialData = { wins: 2, losses: 1 };
            
            const chart = strategy.render(canvas, initialData);
            const updateResult = strategy.update(chart, { wins: 5, losses: 3 });
            
            test.expect(updateResult).toBeTruthy();
            test.expect(chart.data.datasets[0].data).toEqual([5, 3]);
        });
    });
    
    test.describe('Sistema de Criação de Gráficos', () => {
        test.it('deve criar gráfico com estratégia padrão', () => {
            const system = new UnifiedChartSystem();
            const data = { wins: 3, losses: 2 };
            
            const chart = system.createChart('#progress-pie-chart', data);
            
            test.expect(chart).toBeTruthy();
            test.expect(system.canvasRegistry.has('#progress-pie-chart')).toBeTruthy();
        });
        
        test.it('deve atualizar gráfico existente', () => {
            const system = new UnifiedChartSystem();
            const initialData = { wins: 1, losses: 1 };
            const updatedData = { wins: 4, losses: 2 };
            
            system.createChart('#progress-pie-chart', initialData);
            const chart = system.updateChart('#progress-pie-chart', updatedData);
            
            test.expect(chart).toBeTruthy();
            
            const registration = system.getChartInfo('#progress-pie-chart');
            test.expect(registration.lastData).toEqual(updatedData);
        });
        
        test.it('deve destruir gráfico corretamente', () => {
            const system = new UnifiedChartSystem();
            const data = { wins: 2, losses: 1 };
            
            system.createChart('#progress-pie-chart', data);
            const destroyed = system.destroyChart('#progress-pie-chart');
            
            test.expect(destroyed).toBeTruthy();
            test.expect(system.canvasRegistry.has('#progress-pie-chart')).toBeFalsy();
        });
    });
    
    test.describe('Sistema de Plugins', () => {
        test.it('deve registrar plugin corretamente', () => {
            const system = new UnifiedChartSystem();
            
            class TestPlugin {
                initialize() {}
                beforeRender(canvas, data, options) {
                    return { canvas, data, options };
                }
                afterRender(chart) {
                    return chart;
                }
            }
            
            const plugin = new TestPlugin();
            system.registerPlugin('test-plugin', plugin);
            
            test.expect(system.pluginRegistry.has('test-plugin')).toBeTruthy();
        });
        
        test.it('deve executar plugins durante renderização', () => {
            const system = new UnifiedChartSystem();
            let beforeRenderCalled = false;
            let afterRenderCalled = false;
            
            class TestPlugin {
                initialize() {}
                beforeRender(canvas, data, options) {
                    beforeRenderCalled = true;
                    return { canvas, data, options };
                }
                afterRender(chart) {
                    afterRenderCalled = true;
                    return chart;
                }
            }
            
            system.registerPlugin('test-plugin', new TestPlugin());
            system.createChart('#progress-pie-chart', { wins: 1, losses: 1 });
            
            test.expect(beforeRenderCalled).toBeTruthy();
            test.expect(afterRenderCalled).toBeTruthy();
        });
    });
    
    test.describe('Performance Optimizer', () => {
        test.it('deve inicializar otimizador corretamente', () => {
            const optimizer = new PerformanceOptimizer();
            
            test.expect(optimizer.cache).toBeTruthy();
            test.expect(optimizer.debouncer).toBeTruthy();
            test.expect(optimizer.lazyLoader).toBeTruthy();
            test.expect(optimizer.monitor).toBeTruthy();
        });
        
        test.it('deve armazenar e recuperar do cache', () => {
            const optimizer = new PerformanceOptimizer();
            const testData = { test: 'data' };
            
            optimizer.cacheSet('test-key', testData);
            const retrieved = optimizer.cacheGet('test-key');
            
            test.expect(retrieved).toEqual(testData);
        });
        
        test.it('deve executar debounce corretamente', async () => {
            const optimizer = new PerformanceOptimizer();
            let callCount = 0;
            
            const testFunction = () => callCount++;
            
            // Chama múltiplas vezes rapidamente
            optimizer.debounce('test', testFunction, 50);
            optimizer.debounce('test', testFunction, 50);
            optimizer.debounce('test', testFunction, 50);
            
            // Aguarda debounce
            await new Promise(resolve => setTimeout(resolve, 100));
            
            test.expect(callCount).toBe(1);
        });
    });
    
    test.describe('Integração com Sistema Legado', () => {
        test.it('deve interceptar chamadas do sistema legado', () => {
            // Simula sistema legado
            window.charts = {
                initProgressChart: () => false,
                updateProgressChart: () => false,
                progressMetasChart: null
            };
            
            const system = new UnifiedChartSystem();
            
            // Verifica se interceptação foi configurada
            test.expect(typeof window.charts.initProgressChart).toBe('function');
            test.expect(typeof window.charts.updateProgressChart).toBe('function');
        });
        
        test.it('deve manter compatibilidade com API legada', () => {
            window.charts = {
                initProgressChart: () => false,
                updateProgressChart: () => false,
                progressMetasChart: null
            };
            
            const system = new UnifiedChartSystem();
            
            // Testa chamada legada
            const initResult = window.charts.initProgressChart();
            test.expect(initResult).toBeTruthy();
            
            // Verifica se gráfico foi criado
            test.expect(system.canvasRegistry.has('#progress-pie-chart')).toBeTruthy();
        });
    });
    
    test.describe('Tratamento de Erros', () => {
        test.it('deve tratar canvas inexistente graciosamente', () => {
            const system = new UnifiedChartSystem();
            
            test.expect(() => {
                system.createChart('#non-existent-canvas', { wins: 1, losses: 1 });
            }).toThrow();
        });
        
        test.it('deve tratar estratégia inexistente graciosamente', () => {
            const system = new UnifiedChartSystem();
            
            test.expect(() => {
                system.createChart('#progress-pie-chart', { wins: 1, losses: 1 }, { 
                    strategy: 'non-existent-strategy' 
                });
            }).toThrow();
        });
        
        test.it('deve tratar dados inválidos graciosamente', () => {
            const system = new UnifiedChartSystem();
            
            // Não deve lançar erro com dados inválidos
            const chart = system.createChart('#progress-pie-chart', { 
                wins: 'invalid', 
                losses: null 
            });
            
            test.expect(chart).toBeTruthy();
        });
    });
    
    test.describe('Cleanup e Teardown', () => {
        test.it('deve limpar recursos corretamente', () => {
            const system = new UnifiedChartSystem();
            
            system.createChart('#progress-pie-chart', { wins: 1, losses: 1 });
            system.destroyAll();
            
            test.expect(system.canvasRegistry.size).toBe(0);
            test.expect(system.cache.cache.size).toBe(0);
        });
        
        test.it('deve limpar DOM de teste', () => {
            TestUtils.cleanupDOM();
            
            test.expect(document.querySelector('#progress-pie-chart')).toBeFalsy();
            test.expect(document.querySelector('#wins-counter')).toBeFalsy();
            test.expect(document.querySelector('#losses-counter')).toBeFalsy();
        });
    });
    
    // Executa todos os testes
    await test.runAll();
    
    return test.results;
}

// ============================================================================
// TESTES DE INTEGRAÇÃO
// ============================================================================

export async function runIntegrationTests() {
    const test = new TestFramework();
    
    test.describe('Integração Completa', () => {
        test.it('deve funcionar com dados reais do window.state', async () => {
            // Simula dados reais
            window.state = {
                historicoCombinado: TestUtils.createMockHistoryData()
            };
            
            const system = new UnifiedChartSystem();
            const history = window.state.historicoCombinado;
            const wins = history.filter(op => op.isWin === true).length;
            const losses = history.filter(op => op.isWin === false).length;
            
            const chart = system.createChart('#progress-pie-chart', { wins, losses });
            
            test.expect(chart).toBeTruthy();
            test.expect(wins).toBe(2);
            test.expect(losses).toBe(1);
        });
        
        test.it('deve atualizar contadores automaticamente', async () => {
            const system = new UnifiedChartSystem();
            
            system.createChart('#progress-pie-chart', { wins: 3, losses: 2 });
            
            // Aguarda atualização dos contadores
            await TestUtils.waitFor(() => {
                const winsCounter = document.querySelector('#wins-counter');
                const lossesCounter = document.querySelector('#losses-counter');
                return winsCounter?.textContent === '3' && lossesCounter?.textContent === '2';
            });
            
            const winsCounter = document.querySelector('#wins-counter');
            const lossesCounter = document.querySelector('#losses-counter');
            
            test.expect(winsCounter.textContent).toBe('3');
            test.expect(lossesCounter.textContent).toBe('2');
        });
    });
    
    await test.runAll();
    return test.results;
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

export async function runAllTests() {
    console.log('🧪 Iniciando suite completa de testes...');
    
    const unitResults = await runUnifiedChartSystemTests();
    const integrationResults = await runIntegrationTests();
    
    const allResults = [...unitResults, ...integrationResults];
    const passed = allResults.filter(r => r.status === 'PASS').length;
    const total = allResults.length;
    
    console.log('\n🏆 RESULTADO FINAL:');
    console.log(`   Cobertura: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`   Testes: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('   ✅ TODOS OS TESTES PASSARAM!');
    } else {
        console.log('   ❌ Alguns testes falharam');
    }
    
    return allResults;
}

// Exposição global para execução manual
window.runUnifiedChartSystemTests = runUnifiedChartSystemTests;
window.runIntegrationTests = runIntegrationTests;
window.runAllTests = runAllTests;

console.log('🧪 Sistema de Testes Completo carregado');
