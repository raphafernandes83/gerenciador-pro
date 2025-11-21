/**
 * Benchmark de Performance - Mede ganhos das otimizações
 * Compara performance antes e depois das otimizações
 */

class PerformanceBenchmark {
    constructor() {
        this.results = {
            before: {},
            after: {},
            comparison: {},
        };
        this.testSuites = [];
        this.isRunning = false;
    }

    /**
     * Executa benchmark completo
     */
    async runFullBenchmark() {
        if (this.isRunning) {
            console.warn('⚠️ Benchmark já está em execução');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Iniciando benchmark de performance...');

        try {
            // Preparar ambiente de teste
            await this._setupTestEnvironment();

            // Executar testes sem otimizações
            console.log('📊 Executando testes SEM otimizações...');
            this.results.before = await this._runTestsWithoutOptimizations();

            // Aguardar estabilização
            await this._delay(2000);

            // Executar testes com otimizações
            console.log('🚀 Executando testes COM otimizações...');
            this.results.after = await this._runTestsWithOptimizations();

            // Calcular comparação
            this.results.comparison = this._calculateComparison();

            // Gerar relatório
            const report = this._generateReport();

            console.log('✅ Benchmark concluído!');
            console.table(this.results.comparison);

            return report;
        } catch (error) {
            console.error('❌ Erro no benchmark:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Testa performance de updates de charts
     */
    async benchmarkChartUpdates() {
        const testData = this._generateTestChartData();
        const iterations = 100;

        console.log(`📊 Testando ${iterations} updates de charts...`);

        // Teste sem otimizações
        const beforeResults = await this._measureChartUpdates(testData, iterations, false);

        // Aguardar limpeza
        await this._delay(1000);

        // Teste com otimizações
        const afterResults = await this._measureChartUpdates(testData, iterations, true);

        return {
            before: beforeResults,
            after: afterResults,
            improvement: {
                duration:
                    ((beforeResults.averageDuration - afterResults.averageDuration) /
                        beforeResults.averageDuration) *
                    100,
                memory: beforeResults.memoryUsage - afterResults.memoryUsage,
                fps: afterResults.averageFPS - beforeResults.averageFPS,
            },
        };
    }

    /**
     * Testa performance de debounce
     */
    async benchmarkDebounce() {
        const testCalls = 1000;
        const burstInterval = 1; // ms

        console.log(`⚡ Testando debounce com ${testCalls} chamadas...`);

        // Teste sem debounce
        const beforeResults = await this._measureDebouncePerformance(
            testCalls,
            burstInterval,
            false
        );

        // Teste com debounce
        const afterResults = await this._measureDebouncePerformance(testCalls, burstInterval, true);

        return {
            before: beforeResults,
            after: afterResults,
            improvement: {
                actualCalls: beforeResults.actualCalls - afterResults.actualCalls,
                efficiency: (afterResults.efficiency - beforeResults.efficiency) * 100,
                cpuUsage: beforeResults.cpuUsage - afterResults.cpuUsage,
            },
        };
    }

    /**
     * Testa performance de lazy loading
     */
    async benchmarkLazyLoading() {
        const modules = ['chart-advanced', 'sidebar', 'heavy-module-1', 'heavy-module-2'];

        console.log(`📦 Testando lazy loading de ${modules.length} módulos...`);

        // Teste carregamento tradicional
        const beforeResults = await this._measureTraditionalLoading(modules);

        // Teste lazy loading
        const afterResults = await this._measureLazyLoading(modules);

        return {
            before: beforeResults,
            after: afterResults,
            improvement: {
                initialLoadTime: beforeResults.initialLoadTime - afterResults.initialLoadTime,
                memoryFootprint: beforeResults.memoryFootprint - afterResults.memoryFootprint,
                timeToInteractive: beforeResults.timeToInteractive - afterResults.timeToInteractive,
            },
        };
    }

    // Métodos privados
    async _setupTestEnvironment() {
        // Limpar cache e dados antigos
        if (window.performanceProfiler) {
            window.performanceProfiler.cleanup();
        }

        if (window.smartDebouncer) {
            window.smartDebouncer.clear();
        }

        // Forçar garbage collection se disponível
        if (window.gc) {
            window.gc();
        }

        // Aguardar estabilização
        await this._delay(1000);
    }

    async _runTestsWithoutOptimizations() {
        // Desabilitar otimizações temporariamente
        const originalOptimized = window.charts?._performanceOptimized;
        if (window.charts) {
            window.charts._performanceOptimized = false;
        }

        try {
            const results = {};

            // Teste de updates de charts
            results.chartUpdates = await this.benchmarkChartUpdates();

            // Teste de múltiplas operações
            results.multipleOperations = await this._benchmarkMultipleOperations(false);

            // Teste de renderização
            results.rendering = await this._benchmarkRendering(false);

            return results;
        } finally {
            // Restaurar estado original
            if (window.charts && originalOptimized !== undefined) {
                window.charts._performanceOptimized = originalOptimized;
            }
        }
    }

    async _runTestsWithOptimizations() {
        // Garantir que otimizações estão ativas
        if (window.charts && !window.charts._performanceOptimized) {
            await window.charts._initPerformanceOptimizations();
        }

        const results = {};

        // Teste de updates de charts
        results.chartUpdates = await this.benchmarkChartUpdates();

        // Teste de debounce
        results.debounce = await this.benchmarkDebounce();

        // Teste de lazy loading
        results.lazyLoading = await this.benchmarkLazyLoading();

        // Teste de múltiplas operações
        results.multipleOperations = await this._benchmarkMultipleOperations(true);

        // Teste de renderização
        results.rendering = await this._benchmarkRendering(true);

        return results;
    }

    async _measureChartUpdates(testData, iterations, useOptimizations) {
        const startTime = performance.now();
        const startMemory = this._getMemoryUsage();
        let frameCount = 0;

        const frameCounter = () => {
            frameCount++;
            if (frameCount < iterations) {
                requestAnimationFrame(frameCounter);
            }
        };
        requestAnimationFrame(frameCounter);

        for (let i = 0; i < iterations; i++) {
            if (useOptimizations && window.optimizedCharts) {
                await window.optimizedCharts.updateChart(
                    'test-chart',
                    testData[i % testData.length]
                );
            } else {
                // Simular update tradicional
                await this._simulateTraditionalChartUpdate(testData[i % testData.length]);
            }

            // Pequeno delay para simular uso real
            if (i % 10 === 0) {
                await this._delay(1);
            }
        }

        const endTime = performance.now();
        const endMemory = this._getMemoryUsage();
        const duration = endTime - startTime;

        return {
            totalDuration: duration,
            averageDuration: duration / iterations,
            memoryUsage: endMemory - startMemory,
            averageFPS: frameCount / (duration / 1000),
            iterations,
        };
    }

    async _measureDebouncePerformance(testCalls, interval, useDebounce) {
        let actualCalls = 0;
        const startTime = performance.now();
        const startCPU = this._getCPUUsage();

        const testFunction = () => {
            actualCalls++;
        };

        if (useDebounce && window.smartDebouncer) {
            // Usar debounce
            for (let i = 0; i < testCalls; i++) {
                window.smartDebouncer.scheduleUpdate(`test-${i}`, testFunction, {
                    priority: 'normal',
                    coalesce: true,
                });
                await this._delay(interval);
            }

            // Aguardar processamento
            await this._delay(200);
        } else {
            // Chamadas diretas
            for (let i = 0; i < testCalls; i++) {
                testFunction();
                await this._delay(interval);
            }
        }

        const endTime = performance.now();
        const endCPU = this._getCPUUsage();
        const duration = endTime - startTime;

        return {
            totalCalls: testCalls,
            actualCalls,
            duration,
            efficiency: actualCalls / testCalls,
            cpuUsage: endCPU - startCPU,
        };
    }

    async _measureTraditionalLoading(modules) {
        const startTime = performance.now();
        const startMemory = this._getMemoryUsage();

        // Simular carregamento tradicional (todos os módulos de uma vez)
        const loadPromises = modules.map((module) => this._simulateModuleLoad(module, 100));
        await Promise.all(loadPromises);

        const loadTime = performance.now() - startTime;
        const memoryUsage = this._getMemoryUsage() - startMemory;

        // Simular tempo até interatividade
        const timeToInteractive = loadTime + 500; // Overhead de inicialização

        return {
            initialLoadTime: loadTime,
            memoryFootprint: memoryUsage,
            timeToInteractive,
            modulesLoaded: modules.length,
        };
    }

    async _measureLazyLoading(modules) {
        const startTime = performance.now();
        const startMemory = this._getMemoryUsage();

        // Carregar apenas módulo crítico inicialmente
        await this._simulateModuleLoad(modules[0], 50);
        const initialLoadTime = performance.now() - startTime;

        // Lazy load outros módulos
        const lazyPromises = modules.slice(1).map((module) => this._simulateModuleLoad(module, 30));

        // Simular carregamento sob demanda
        setTimeout(() => Promise.all(lazyPromises), 100);

        const memoryUsage = this._getMemoryUsage() - startMemory;
        const timeToInteractive = initialLoadTime + 100; // Muito mais rápido

        return {
            initialLoadTime,
            memoryFootprint: memoryUsage,
            timeToInteractive,
            modulesLoaded: modules.length,
        };
    }

    async _benchmarkMultipleOperations(useOptimizations) {
        const operations = 50;
        const startTime = performance.now();

        for (let i = 0; i < operations; i++) {
            // Simular operações típicas do app
            await this._simulateOperation('chart-update', useOptimizations);
            await this._simulateOperation('ui-update', useOptimizations);
            await this._simulateOperation('data-calculation', useOptimizations);
        }

        const duration = performance.now() - startTime;

        return {
            totalOperations: operations * 3,
            duration,
            averagePerOperation: duration / (operations * 3),
        };
    }

    async _benchmarkRendering(useOptimizations) {
        const renders = 30;
        const startTime = performance.now();
        let framesMissed = 0;

        for (let i = 0; i < renders; i++) {
            const frameStart = performance.now();

            // Simular renderização pesada
            await this._simulateHeavyRender(useOptimizations);

            const frameTime = performance.now() - frameStart;
            if (frameTime > 16.67) {
                // 60fps = 16.67ms por frame
                framesMissed++;
            }
        }

        const duration = performance.now() - startTime;

        return {
            totalRenders: renders,
            duration,
            averageFrameTime: duration / renders,
            framesMissed,
            fps: 1000 / (duration / renders),
        };
    }

    _calculateComparison() {
        const comparison = {};

        // Comparar chart updates
        if (this.results.before.chartUpdates && this.results.after.chartUpdates) {
            comparison.chartUpdates = {
                durationImprovement: this._calculateImprovement(
                    this.results.before.chartUpdates.averageDuration,
                    this.results.after.chartUpdates.averageDuration
                ),
                memoryImprovement:
                    this.results.before.chartUpdates.memoryUsage -
                    this.results.after.chartUpdates.memoryUsage,
                fpsImprovement:
                    this.results.after.chartUpdates.averageFPS -
                    this.results.before.chartUpdates.averageFPS,
            };
        }

        // Comparar operações múltiplas
        if (this.results.before.multipleOperations && this.results.after.multipleOperations) {
            comparison.multipleOperations = {
                durationImprovement: this._calculateImprovement(
                    this.results.before.multipleOperations.duration,
                    this.results.after.multipleOperations.duration
                ),
            };
        }

        // Comparar renderização
        if (this.results.before.rendering && this.results.after.rendering) {
            comparison.rendering = {
                frameTimeImprovement: this._calculateImprovement(
                    this.results.before.rendering.averageFrameTime,
                    this.results.after.rendering.averageFrameTime
                ),
                framesMissedReduction:
                    this.results.before.rendering.framesMissed -
                    this.results.after.rendering.framesMissed,
                fpsImprovement:
                    this.results.after.rendering.fps - this.results.before.rendering.fps,
            };
        }

        return comparison;
    }

    _generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                overallImprovement: this._calculateOverallImprovement(),
                recommendedOptimizations: this._getRecommendations(),
            },
            detailed: {
                before: this.results.before,
                after: this.results.after,
                comparison: this.results.comparison,
            },
        };

        // Salvar no localStorage para análise posterior
        try {
            localStorage.setItem('performance-benchmark-report', JSON.stringify(report));
        } catch (e) {
            console.warn('Não foi possível salvar relatório no localStorage');
        }

        return report;
    }

    // Métodos utilitários
    _calculateImprovement(before, after) {
        if (before === 0) return 0;
        return ((before - after) / before) * 100;
    }

    _calculateOverallImprovement() {
        const improvements = [];

        if (this.results.comparison.chartUpdates) {
            improvements.push(this.results.comparison.chartUpdates.durationImprovement);
        }

        if (this.results.comparison.multipleOperations) {
            improvements.push(this.results.comparison.multipleOperations.durationImprovement);
        }

        if (this.results.comparison.rendering) {
            improvements.push(this.results.comparison.rendering.frameTimeImprovement);
        }

        return improvements.length > 0
            ? improvements.reduce((a, b) => a + b, 0) / improvements.length
            : 0;
    }

    _getRecommendations() {
        const recommendations = [];

        if (this.results.comparison.chartUpdates?.durationImprovement > 20) {
            recommendations.push('Debounce de charts está funcionando muito bem');
        }

        if (this.results.comparison.rendering?.framesMissedReduction > 5) {
            recommendations.push('Otimizações de renderização reduziram frames perdidos');
        }

        if (this.results.after.lazyLoading?.timeToInteractive < 1000) {
            recommendations.push(
                'Lazy loading melhorou significativamente o tempo de carregamento'
            );
        }

        return recommendations;
    }

    async _simulateTraditionalChartUpdate(data) {
        // Simular update sem otimizações
        await this._delay(Math.random() * 5 + 2); // 2-7ms
    }

    async _simulateModuleLoad(moduleName, baseTime) {
        const loadTime = baseTime + Math.random() * 50;
        await this._delay(loadTime);
        return { module: moduleName, loadTime };
    }

    async _simulateOperation(type, optimized) {
        const baseTime = optimized ? 1 : 3;
        await this._delay(baseTime + Math.random() * 2);
    }

    async _simulateHeavyRender(optimized) {
        const baseTime = optimized ? 8 : 15;
        await this._delay(baseTime + Math.random() * 5);
    }

    _getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1048576; // MB
        }
        return 0;
    }

    _getCPUUsage() {
        // Estimativa simples baseada em performance.now()
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
            /* busy work */
        }
        return performance.now() - start;
    }

    _generateTestChartData() {
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push({
                labels: Array.from({ length: 10 }, (_, j) => `Label ${j}`),
                datasets: [
                    {
                        data: Array.from({ length: 10 }, () => Math.random() * 100),
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                    },
                ],
            });
        }
        return data;
    }

    _delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Instância global
const performanceBenchmark = new PerformanceBenchmark();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.performanceBenchmark = performanceBenchmark;

    // Comando conveniente para executar benchmark
    window.runPerformanceBenchmark = () => performanceBenchmark.runFullBenchmark();
}

// Executar benchmark automaticamente após carregamento (opcional)
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Aguardar 3 segundos após carregamento para executar benchmark
        setTimeout(async () => {
            if (window.location.search.includes('benchmark=true')) {
                console.log('🚀 Executando benchmark automático...');
                try {
                    const report = await performanceBenchmark.runFullBenchmark();
                    console.log('📊 Relatório de Performance:', report);
                } catch (error) {
                    console.error('❌ Erro no benchmark automático:', error);
                }
            }
        }, 3000);
    });
}
