/**
 * 🎯 TEST LOADER - Carregador Automático de Testes
 * Carrega e disponibiliza todos os sistemas de teste na aplicação
 */

console.log('🎯 Carregando sistemas de teste...');

// Carrega todos os módulos de teste
Promise.all([
    import('./functional-validation.js'),
    import('./run-manual-tests.js'),
    import('./system-health-validator.js'),
    import('./run-complete-validation.js'),
    import('./add-functional-test-button.js'),
])
    .then((modules) => {
        console.log('✅ Todos os sistemas de teste carregados com sucesso!');

        // Disponibiliza funções globalmente
        const [functional, manual, health, complete, button] = modules;

        // Cria objeto global consolidado de testes
        window.TestSuite = {
            // Testes principais
            runFunctional:
                functional.runFunctionalTests ||
                (() => console.warn('Functional tests not available')),
            runManual:
                manual.runManualFunctionalTests ||
                (() => console.warn('Manual tests not available')),
            runHealth:
                health.runSystemHealthCheck || (() => console.warn('Health check not available')),
            runComplete:
                complete.runCompleteValidation ||
                (() => console.warn('Complete validation not available')),

            // Utilitários
            addButton:
                button.addFunctionalTestButton ||
                (() => {
                    console.warn('🔧 Button utility não disponível - usando fallback');
                    return testSystem._createFallbackButton?.apply(testSystem, arguments) || null;
                }),
            exportReport:
                complete.exportCompleteValidationReport ||
                (() => console.warn('Export not available')),

            // Performance e monitoramento
            showPerformance: () =>
                window.togglePerformanceDashboard?.() ||
                console.warn('Performance dashboard not available'),
            logPerformance: () =>
                window.logPerformanceReport?.() || console.warn('Performance report not available'),

            // Funções de conveniência
            async quickTest() {
                console.log('🚀 Executando teste rápido...');
                try {
                    const health = await this.runHealth();
                    console.log(`✅ Teste rápido concluído - Status: ${health.overallHealth}`);
                    return health;
                } catch (error) {
                    console.error('❌ Erro no teste rápido:', error);
                    return { error: error.message };
                }
            },

            async fullTest() {
                console.log('🏁 Executando bateria completa de testes...');
                try {
                    const results = await this.runComplete();
                    console.log(
                        `🎯 Bateria completa finalizada - Status: ${results.summary?.status || 'Desconhecido'}`
                    );
                    return results;
                } catch (error) {
                    console.error('❌ Erro na bateria completa:', error);
                    return { error: error.message };
                }
            },

            help() {
                console.group('🆘 AJUDA - Sistema de Testes');
                console.log('📋 Comandos disponíveis:');
                console.log('');
                console.log('🚀 Testes Rápidos:');
                console.log('  TestSuite.quickTest()     - Validação rápida de saúde');
                console.log('  TestSuite.runHealth()     - Validação completa de saúde');
                console.log('  TestSuite.runManual()     - Testes manuais funcionais');
                console.log('');
                console.log('🏁 Testes Completos:');
                console.log('  TestSuite.fullTest()      - Bateria completa de testes');
                console.log('  TestSuite.runComplete()   - Validação completa do sistema');
                console.log('  TestSuite.runFunctional() - Testes funcionais automatizados');
                console.log('');
                console.log('📊 Monitoramento:');
                console.log('  TestSuite.showPerformance() - Dashboard de performance');
                console.log('  TestSuite.logPerformance()  - Relatório de performance');
                console.log('');
                console.log('🛠️ Utilitários:');
                console.log('  TestSuite.addButton()    - Adiciona botão de testes na UI');
                console.log('  TestSuite.exportReport() - Exporta relatório completo');
                console.log('  TestSuite.help()         - Esta ajuda');
                console.log('');
                console.log('💡 Dica: Use TestSuite.quickTest() para uma validação rápida!');
                console.groupEnd();
            },
        };

        // Adiciona botão automaticamente se DOM estiver pronto
        if (document.readyState === 'complete') {
            try {
                window.TestSuite.addButton();
                console.log('🔘 Botão de testes adicionado automaticamente');
            } catch (error) {
                console.log('⚠️ Não foi possível adicionar botão automaticamente:', error.message);
            }
        }

        // Exibe informações iniciais
        console.group('🎯 SISTEMA DE TESTES CARREGADO');
        console.log('✅ Todos os módulos de teste estão disponíveis');
        console.log('📋 Use TestSuite.help() para ver todos os comandos');
        console.log('🚀 Use TestSuite.quickTest() para uma validação rápida');
        console.log('🏁 Use TestSuite.fullTest() para validação completa');
        console.groupEnd();
    })
    .catch((error) => {
        console.error('❌ Erro ao carregar sistemas de teste:', error);
        console.log('⚠️ Alguns testes podem não estar disponíveis');

        // Cria versão de fallback
        window.TestSuite = {
            error: error.message,
            help() {
                console.error('❌ Sistema de testes não carregou corretamente');
                console.log('🔧 Tente recarregar a página ou verificar console de erros');
            },

            // 🔧 Fallback robusto para button utility
            _createFallbackButton(text, onClick, options = {}) {
                try {
                    const button = document.createElement('button');
                    button.textContent = text;
                    button.className = options.className || 'btn btn-secondary';
                    button.style.margin = '5px';

                    if (typeof onClick === 'function') {
                        button.addEventListener('click', onClick);
                    }

                    // Encontrar container apropriado
                    const container =
                        options.container ||
                        document.querySelector('.test-controls') ||
                        document.querySelector('.sidebar-content') ||
                        document.body;

                    if (container) {
                        container.appendChild(button);
                        console.log('✅ Botão de teste criado via fallback:', text);
                        return button;
                    } else {
                        console.warn('⚠️ Container não encontrado para botão:', text);
                        return null;
                    }
                } catch (error) {
                    console.error('❌ Erro ao criar botão fallback:', error);
                    return null;
                }
            },

            addButton: function (text, onClick, options) {
                return this._createFallbackButton(text, onClick, options);
            },
        };
    });
