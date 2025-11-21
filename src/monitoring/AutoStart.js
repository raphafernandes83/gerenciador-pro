/**
 * Sistema de Auto-Inicialização do Monitoramento
 * Ativa automaticamente todos os sistemas de monitoramento
 */

class MonitoringAutoStart {
    constructor() {
        this.config = {
            enableDashboard: true,
            enableAlerts: true,
            enableAnalytics: true,
            enableIntegrations: true,
            showWelcomeMessage: true,
            autoStartDelay: 2000, // 2 segundos após carregamento
        };

        this.initialized = false;
        this._setupAutoStart();
    }

    /**
     * Inicialização automática completa
     */
    async autoInitialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Iniciando sistema de monitoramento automaticamente...');

            // 1. Verificar se todos os módulos estão carregados
            await this._waitForModules();

            // 2. Inicializar sistema principal
            if (window.monitoringSystem) {
                await window.monitoringSystem.initialize({
                    enableDashboard: this.config.enableDashboard,
                    enableIntegrations: this.config.enableIntegrations,
                    autoStart: true,
                });
                console.log('✅ Sistema principal inicializado');
            }

            // 3. Ativar dashboard visual
            if (this.config.enableDashboard && window.healthDashboard) {
                window.healthDashboard.initialize({
                    autoRefresh: true,
                    theme: 'dark',
                    position: 'bottom-right',
                    minimized: false,
                });
                console.log('✅ Dashboard visual ativado');

                // Forçar visibilidade e foco após inicialização
                try {
                    window.healthDashboard.ensureVisible();
                } catch (e) {}
            }

            // 4. Configurar alertas automáticos
            if (this.config.enableAlerts && window.criticalAlerts) {
                this._setupAutoAlerts();
                console.log('✅ Alertas automáticos configurados');
            }

            // 5. Ativar analytics automático
            if (this.config.enableAnalytics && window.usageAnalytics) {
                this._setupAutoAnalytics();
                console.log('✅ Analytics automático ativado');
            }

            // 6. Configurar integrações
            if (this.config.enableIntegrations && window.observabilityIntegration) {
                this._setupAutoIntegrations();
                console.log('✅ Integrações configuradas');
            }

            // 7. Mostrar mensagem de boas-vindas
            if (this.config.showWelcomeMessage) {
                this._showWelcomeMessage();
            }

            // 8. Configurar comandos de console
            this._setupConsoleCommands();

            this.initialized = true;
            console.log('🎉 Sistema de monitoramento totalmente ativo!');

            // Disparar evento de inicialização completa
            this._dispatchReadyEvent();
        } catch (error) {
            console.error('❌ Erro na inicialização automática:', error);
            this._showErrorMessage(error);
        }
    }

    /**
     * Comandos rápidos para o console
     */
    setupQuickCommands() {
        // Comandos globais para facilitar uso
        window.monitoring = {
            // Status geral
            status: () => window.monitoringSystem?.getSystemStatus(),
            health: () => window.monitoringSystem?.getSystemHealth(),

            // Dashboard
            showDashboard: () => window.healthDashboard?.toggle(),
            hideDashboard: () => window.healthDashboard?.toggle(),

            // Relatórios
            report: () => window.monitoringSystem?.generateSystemReport(),
            exportData: (format = 'json') => window.monitoringSystem?.exportSystemData(format),

            // Métricas
            metrics: () => window.realtimeMetrics?.getDashboardSnapshot(),

            // Logs
            logs: (level = 'INFO') => window.structuredLogger?.getLogs({ level, limit: 20 }),

            // Erros
            errors: () => window.errorTracker?.getErrorStats(),

            // Alertas
            alerts: () => window.criticalAlerts?.getActiveAlerts(),

            // Analytics
            analytics: () => window.usageAnalytics?.getFeatureUsageStats(),

            // Testes
            test: () => this._runQuickTests(),

            // Ajuda
            help: () => this._showHelp(),
        };

        console.log('📋 Comandos disponíveis em window.monitoring:');
        console.log('  monitoring.status() - Status do sistema');
        console.log('  monitoring.showDashboard() - Mostrar dashboard');
        console.log('  monitoring.report() - Relatório completo');
        console.log('  monitoring.metrics() - Métricas atuais');
        console.log('  monitoring.logs() - Logs recentes');
        console.log('  monitoring.help() - Ajuda completa');
    }

    // Métodos privados
    _setupAutoStart() {
        // Aguardar carregamento completo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.autoInitialize(), this.config.autoStartDelay);
            });
        } else {
            setTimeout(() => this.autoInitialize(), this.config.autoStartDelay);
        }
    }

    async _waitForModules() {
        const maxWait = 10000; // 10 segundos
        const checkInterval = 100; // 100ms
        let waited = 0;

        const requiredModules = [
            'monitoringSystem',
            'healthDashboard',
            'structuredLogger',
            'errorTracker',
            'realtimeMetrics',
            'usageAnalytics',
            'criticalAlerts',
        ];

        while (waited < maxWait) {
            const allLoaded = requiredModules.every((module) => window[module]);
            if (allLoaded) {
                console.log('✅ Todos os módulos carregados');
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }

        const missing = requiredModules.filter((module) => !window[module]);
        console.warn('⚠️ Módulos não carregados:', missing);
    }

    _setupAutoAlerts() {
        // Configurar alertas automáticos para situações críticas

        // Alerta para alta taxa de erros
        window.criticalAlerts.createAlertRule(
            'auto_high_error_rate',
            {
                custom: () => {
                    const stats = window.errorTracker?.getErrorStats({
                        since: Date.now() - 5 * 60 * 1000,
                    });
                    return stats && stats.total > 5;
                },
            },
            {
                severity: 'high',
                type: 'error_rate',
                description: 'Taxa de erros muito alta detectada automaticamente',
                channels: ['console', 'notification'],
            }
        );

        // Alerta para uso alto de memória
        window.criticalAlerts.createAlertRule(
            'auto_high_memory',
            {
                custom: () => {
                    const memory = window.realtimeMetrics?.getCurrentValue('system.memory.used');
                    return memory && memory > 500; // 500MB
                },
            },
            {
                severity: 'medium',
                type: 'memory',
                description: 'Uso de memória alto detectado automaticamente',
                channels: ['console'],
            }
        );

        // Alerta para performance baixa
        window.criticalAlerts.createAlertRule(
            'auto_low_fps',
            {
                custom: () => {
                    const fps = window.realtimeMetrics?.getCurrentValue('performance.fps');
                    return fps && fps < 30;
                },
            },
            {
                severity: 'medium',
                type: 'performance',
                description: 'Performance baixa detectada automaticamente',
                channels: ['console'],
            }
        );
    }

    _setupAutoAnalytics() {
        // Rastrear automaticamente eventos importantes

        // Rastrear cliques em botões importantes
        const importantButtons = [
            '#start-session-btn',
            '#finish-session-btn',
            '#new-session-btn',
            '.operation-btn',
        ];

        importantButtons.forEach((selector) => {
            document.addEventListener('click', (event) => {
                if (event.target.matches(selector)) {
                    window.usageAnalytics?.trackFeatureUsage('button_click', 'click', {
                        button: selector,
                        timestamp: Date.now(),
                    });
                }
            });
        });

        // Rastrear mudanças de aba/seção
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active')) {
                        window.usageAnalytics?.trackPageView(target.id || target.className, {
                            automatic: true,
                        });
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class'],
        });
    }

    _setupAutoIntegrations() {
        // Configurar integrações automáticas baseadas no ambiente

        // Console sempre ativo
        window.observabilityIntegration?.toggleIntegration('console', true);

        // LocalStorage para backup
        window.observabilityIntegration?.toggleIntegration('localStorage', true);

        // Exportação automática a cada minuto
        setInterval(() => {
            window.observabilityIntegration?.exportCurrentMetrics();
        }, 60000);
    }

    _setupConsoleCommands() {
        this.setupQuickCommands();

        // Comando especial para demonstração
        window.demoMonitoring = () => {
            console.log('🎬 Iniciando demonstração do sistema de monitoramento...');

            // Simular algumas métricas
            window.realtimeMetrics?.setGauge('demo.cpu', Math.random() * 100);
            window.realtimeMetrics?.setGauge('demo.memory', Math.random() * 1000);
            window.realtimeMetrics?.incrementCounter('demo.events', 1);

            // Simular um erro
            window.errorTracker?.trackError(new Error('Erro de demonstração'), {
                demo: true,
                timestamp: Date.now(),
            });

            // Simular uso de funcionalidade
            window.usageAnalytics?.trackFeatureUsage('demo', 'test', {
                automatic: false,
            });

            // Mostrar dashboard
            window.healthDashboard?.toggle();

            console.log('✅ Demonstração concluída! Verifique o dashboard.');
        };
    }

    _showWelcomeMessage() {
        const message = `
🎉 SISTEMA DE MONITORAMENTO ATIVO!

📊 Dashboard: Canto inferior direito da tela
🔍 Logs: Console do navegador  
⚠️ Alertas: Notificações automáticas
📈 Métricas: Coletadas em tempo real

💡 Comandos disponíveis:
   monitoring.status() - Status geral
   monitoring.showDashboard() - Mostrar/ocultar dashboard
   monitoring.help() - Ajuda completa
   demoMonitoring() - Demonstração interativa

🚀 Tudo funcionando automaticamente!
        `;

        console.log('%c' + message, 'color: #4CAF50; font-weight: bold;');

        // Mostrar notificação se permitido
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sistema de Monitoramento Ativo! 🚀', {
                body: 'Dashboard disponível no canto da tela. Use monitoring.help() para comandos.',
                icon: '/favicon.ico',
            });
        }
    }

    _showErrorMessage(error) {
        const message = `
❌ ERRO NA INICIALIZAÇÃO DO MONITORAMENTO

Erro: ${error.message}

🔧 Soluções:
1. Recarregue a página (F5)
2. Verifique o console para mais detalhes
3. Use monitoring.help() para comandos manuais

⚠️ O sistema pode funcionar parcialmente.
        `;

        console.error('%c' + message, 'color: #F44336; font-weight: bold;');
    }

    _runQuickTests() {
        console.log('🧪 Executando testes rápidos...');

        const tests = [
            {
                name: 'Sistema Principal',
                test: () => !!window.monitoringSystem && window.monitoringSystem.initialized,
            },
            {
                name: 'Dashboard',
                test: () =>
                    !!window.healthDashboard && !!document.getElementById('health-dashboard'),
            },
            {
                name: 'Logger',
                test: () =>
                    !!window.structuredLogger && window.structuredLogger.getStats().totalLogs >= 0,
            },
            {
                name: 'Métricas',
                test: () => !!window.realtimeMetrics && !!window.realtimeMetrics.getCurrentValue,
            },
            {
                name: 'Analytics',
                test: () => !!window.usageAnalytics && !!window.usageAnalytics.currentSession,
            },
            {
                name: 'Alertas',
                test: () => !!window.criticalAlerts && window.criticalAlerts.rules.size > 0,
            },
        ];

        const results = tests.map((test) => ({
            ...test,
            passed: test.test(),
        }));

        console.table(results);

        const passed = results.filter((r) => r.passed).length;
        const total = results.length;

        console.log(`✅ Testes: ${passed}/${total} passaram`);

        return results;
    }

    _showHelp() {
        const help = `
📋 COMANDOS DO SISTEMA DE MONITORAMENTO

🔍 INFORMAÇÕES:
   monitoring.status()     - Status completo do sistema
   monitoring.health()     - Saúde dos componentes
   monitoring.metrics()    - Métricas em tempo real
   monitoring.logs()       - Logs recentes
   monitoring.errors()     - Estatísticas de erros
   monitoring.alerts()     - Alertas ativos
   monitoring.analytics()  - Analytics de uso

📊 DASHBOARD:
   monitoring.showDashboard() - Mostrar/ocultar dashboard
   monitoring.hideDashboard() - Ocultar dashboard

📄 RELATÓRIOS:
   monitoring.report()        - Relatório completo
   monitoring.exportData()    - Exportar dados (JSON)
   monitoring.exportData('csv') - Exportar dados (CSV)

🧪 TESTES:
   monitoring.test()       - Testes rápidos
   demoMonitoring()        - Demonstração interativa

🎛️ CONTROLES AVANÇADOS:
   window.monitoringSystem.runHealthCheck()     - Health check manual
   window.monitoringSystem.enterEmergencyMode() - Modo emergência
   window.healthDashboard.refresh()             - Atualizar dashboard
   window.criticalAlerts.triggerAlert()         - Disparar alerta teste

💡 DICAS:
   - Dashboard sempre visível no canto da tela
   - Alertas aparecem automaticamente
   - Dados salvos no localStorage
   - Sistema funciona offline
        `;

        console.log('%c' + help, 'color: #2196F3;');
    }

    _dispatchReadyEvent() {
        const event = new CustomEvent('monitoringReady', {
            detail: {
                timestamp: Date.now(),
                initialized: this.initialized,
                modules: Object.keys(window).filter(
                    (key) =>
                        key.includes('monitoring') ||
                        key.includes('Logger') ||
                        key.includes('Tracker') ||
                        key.includes('Metrics') ||
                        key.includes('Analytics') ||
                        key.includes('Alerts') ||
                        key.includes('Dashboard')
                ),
            },
        });

        window.dispatchEvent(event);
    }
}

// Instância global e auto-inicialização
const monitoringAutoStart = new MonitoringAutoStart();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.monitoringAutoStart = monitoringAutoStart;
}

export default monitoringAutoStart;
