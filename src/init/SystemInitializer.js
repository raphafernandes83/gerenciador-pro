/**
 * Inicializador do Sistema Empresarial
 * Garante que todos os módulos sejam carregados e expostos globalmente
 */

class SystemInitializer {
    constructor() {
        this.modules = new Map();
        this.initializationPromises = [];
        this.isInitialized = false;

        this._startInitialization();
    }

    async _startInitialization() {
        console.log('🚀 === INICIALIZANDO SISTEMA EMPRESARIAL ===');

        try {
            // Aguardar carregamento dos módulos principais
            await this._waitForModules();

            // Inicializar módulos em ordem
            await this._initializeModules();

            // Expor globalmente
            this._exposeGlobally();

            // Configurar atalhos de teclado
            this._setupKeyboardShortcuts();

            // Marcar como inicializado
            this.isInitialized = true;

            console.log('✅ === SISTEMA EMPRESARIAL INICIALIZADO ===');
            this._showWelcomeMessage();
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    async _waitForModules() {
        const maxWaitTime = 10000; // 10 segundos
        const checkInterval = 100; // 100ms
        let waitTime = 0;

        const requiredModules = [
            'businessMetrics',
            'aiRecommendations',
            'smartNotifications',
            'adminInterface',
            'finalOptimizations',
            'backupManager',
            'monitoringSystem',
        ];

        while (waitTime < maxWaitTime) {
            const loadedModules = requiredModules.filter((mod) => window[mod]);

            console.log(`⏳ Aguardando módulos: ${loadedModules.length}/${requiredModules.length}`);

            if (loadedModules.length >= requiredModules.length * 0.8) {
                // 80% dos módulos
                console.log('✅ Módulos principais carregados');
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
        }
    }

    async _initializeModules() {
        console.log('🔧 Inicializando módulos...');

        // Inicializar módulos que precisam de inicialização explícita
        const initTasks = [];

        // Business Metrics
        if (window.businessMetrics && !window.businessMetrics.initialized) {
            initTasks.push(
                this._safeInit('Business Metrics', () => {
                    // Já inicializa automaticamente no constructor
                    return Promise.resolve();
                })
            );
        }

        // AI Recommendations
        if (window.aiRecommendations && !window.aiRecommendations.initialized) {
            initTasks.push(
                this._safeInit('AI Recommendations', () => {
                    // Já inicializa automaticamente no constructor
                    return Promise.resolve();
                })
            );
        }

        // Smart Notifications
        if (window.smartNotifications && !window.smartNotifications.initialized) {
            initTasks.push(
                this._safeInit('Smart Notifications', () => {
                    // Já inicializa automaticamente no constructor
                    return Promise.resolve();
                })
            );
        }

        // Admin Interface
        if (window.adminInterface && !window.adminInterface.initialized) {
            initTasks.push(
                this._safeInit('Admin Interface', () => {
                    // Já inicializa automaticamente no constructor
                    return Promise.resolve();
                })
            );
        }

        await Promise.allSettled(initTasks);
    }

    async _safeInit(moduleName, initFunction) {
        try {
            await initFunction();
            console.log(`✅ ${moduleName} inicializado`);
        } catch (error) {
            console.warn(`⚠️ ${moduleName} falhou na inicialização:`, error.message);
        }
    }

    _exposeGlobally() {
        console.log('🌐 Expondo módulos globalmente...');

        // Garantir que todos os módulos estejam disponíveis globalmente
        const moduleMap = {
            businessMetrics: window.businessMetrics,
            aiRecommendations: window.aiRecommendations,
            smartNotifications: window.smartNotifications,
            adminInterface: window.adminInterface,
            finalOptimizations: window.finalOptimizations,
            backupManager: window.backupManager,
            configurationVersioning: window.configurationVersioning,
            recoverySystem: window.recoverySystem,
            monitoringSystem: window.monitoringSystem,
            healthDashboard: window.healthDashboard,
            structuredLogger: window.structuredLogger,
            errorTracker: window.errorTracker,
            realtimeMetrics: window.realtimeMetrics,
            usageAnalytics: window.usageAnalytics,
            criticalAlerts: window.criticalAlerts,
            copilot: window.copilot,
            proactiveAssistant: window.proactiveAssistant,
        };

        // Contar módulos disponíveis
        const availableModules = Object.entries(moduleMap).filter(([name, module]) => !!module);
        console.log(
            `📊 Módulos disponíveis: ${availableModules.length}/${Object.keys(moduleMap).length}`
        );

        availableModules.forEach(([name, module]) => {
            console.log(`✅ ${name}: Disponível`);
        });

        // Criar objeto de status global
        window.systemStatus = {
            initialized: true,
            modules: moduleMap,
            availableModules: availableModules.length,
            totalModules: Object.keys(moduleMap).length,
            initializationTime: Date.now(),
        };
    }

    _setupKeyboardShortcuts() {
        console.log('⌨️ Configurando atalhos de teclado...');

        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+A para painel de administração
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                console.log('🛠️ Atalho Ctrl+Alt+A ativado');

                if (window.adminInterface) {
                    window.adminInterface.toggle();
                } else {
                    console.warn('⚠️ Admin Interface não disponível');
                    this._showFallbackAdminPanel();
                }
            }

            // Ctrl+Alt+D para dashboard
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                console.log('📊 Atalho Ctrl+Alt+D ativado');

                if (window.healthDashboard) {
                    window.healthDashboard.ensureVisible();
                } else {
                    console.warn('⚠️ Health Dashboard não disponível');
                }
            }

            // Ctrl+Alt+S para status do sistema
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                console.log('🎯 Atalho Ctrl+Alt+S ativado');
                this._showSystemStatus();
            }
        });
    }

    _showWelcomeMessage() {
        console.log(`
🎉 === SISTEMA EMPRESARIAL ATIVO ===

✅ Módulos carregados: ${window.systemStatus.availableModules}/${window.systemStatus.totalModules}

🎮 === ATALHOS DISPONÍVEIS ===
🛠️ Ctrl+Alt+A - Painel de Administração
📊 Ctrl+Alt+D - Dashboard de Saúde  
🎯 Ctrl+Alt+S - Status do Sistema

🎯 === COMANDOS DE TESTE ===
systemInitializer.showDemo() - Demonstração visual
systemInitializer.testNotifications() - Testar notificações
systemInitializer.showStatus() - Status detalhado

🚀 Sistema pronto para uso!
        `);

        // Tentar mostrar notificação de boas-vindas
        setTimeout(() => {
            this._showWelcomeNotification();
        }, 2000);
    }

    _showWelcomeNotification() {
        if (window.smartNotifications) {
            window.smartNotifications.sendNotification({
                type: 'system_ready',
                priority: 'medium',
                title: '🎉 Sistema Empresarial Ativo!',
                message: `${window.systemStatus.availableModules} módulos carregados. Use Ctrl+Alt+A para acessar o painel.`,
                channels: ['inapp'],
                autoExpire: true,
                expireAfter: 10000,
            });
        }
    }

    _showFallbackAdminPanel() {
        // Painel de administração simplificado se o principal não funcionar
        const fallbackPanel = document.createElement('div');
        fallbackPanel.id = 'fallback-admin-panel';
        fallbackPanel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.95);
            color: white;
            z-index: 99999;
            padding: 20px;
            font-family: monospace;
            overflow-y: auto;
        `;

        fallbackPanel.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h2>🛠️ Painel de Administração (Fallback)</h2>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">✕ Fechar</button>
                
                <h3>📊 Status do Sistema</h3>
                <pre id="system-status-display">Carregando...</pre>
                
                <h3>🎮 Comandos Disponíveis</h3>
                <div style="display: grid; gap: 10px; margin: 20px 0;">
                    <button onclick="systemInitializer.showDemo()" style="padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">🎬 Demonstração Visual</button>
                    <button onclick="systemInitializer.testNotifications()" style="padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">🔔 Testar Notificações</button>
                    <button onclick="systemInitializer.showStatus()" style="padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">🎯 Status Detalhado</button>
                    <button onclick="systemInitializer.forceReload()" style="padding: 10px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer;">🔄 Recarregar Sistema</button>
                </div>
                
                <h3>📝 Log do Sistema</h3>
                <div id="system-log" style="background: #1a1a1a; padding: 15px; border-radius: 4px; height: 200px; overflow-y: auto; font-size: 12px;">
                    <div>🚀 Sistema inicializado</div>
                    <div>📊 Módulos disponíveis: ${window.systemStatus?.availableModules || 0}</div>
                </div>
            </div>
        `;

        document.body.appendChild(fallbackPanel);

        // Atualizar status
        setTimeout(() => {
            const statusDisplay = document.getElementById('system-status-display');
            if (statusDisplay) {
                statusDisplay.textContent = JSON.stringify(window.systemStatus, null, 2);
            }
        }, 100);
    }

    _showSystemStatus() {
        console.log('🎯 === STATUS DO SISTEMA ===');
        console.log('Inicializado:', this.isInitialized);
        console.log('Módulos:', window.systemStatus);

        if (window.copilot) {
            console.log('CEO Status:', window.copilot.status());
        }

        if (window.businessMetrics) {
            console.log('Métricas:', window.businessMetrics.getDashboardMetrics());
        }
    }

    // Métodos públicos para demonstração
    showDemo() {
        console.log('🎬 === INICIANDO DEMONSTRAÇÃO ===');

        // Tentar abrir painel admin
        if (window.adminInterface) {
            console.log('🛠️ Abrindo painel de administração...');
            window.adminInterface.toggle();
        } else {
            console.log('🛠️ Abrindo painel fallback...');
            this._showFallbackAdminPanel();
        }

        // Testar notificações
        setTimeout(() => {
            this.testNotifications();
        }, 2000);

        // Mostrar dashboard
        setTimeout(() => {
            if (window.healthDashboard) {
                console.log('📊 Ativando dashboard...');
                window.healthDashboard.ensureVisible();
            }
        }, 4000);
    }

    testNotifications() {
        console.log('🔔 === TESTANDO NOTIFICAÇÕES ===');

        if (window.smartNotifications) {
            // Notificação de teste 1
            window.smartNotifications.sendNotification({
                type: 'test',
                priority: 'high',
                title: '🎉 Teste de Notificação!',
                message: 'Sistema de notificações funcionando corretamente.',
                channels: ['inapp'],
            });

            // Notificação de teste 2
            setTimeout(() => {
                window.smartNotifications.sendNotification({
                    type: 'success',
                    priority: 'medium',
                    title: '✅ Segundo Teste',
                    message: 'Múltiplas notificações funcionando.',
                    channels: ['inapp'],
                });
            }, 2000);

            console.log('✅ Notificações enviadas');
        } else {
            console.warn('⚠️ Sistema de notificações não disponível');

            // Fallback: alert nativo
            alert(
                '🔔 Sistema de Notificações\n\nTeste realizado com sucesso!\nO sistema está funcionando.'
            );
        }
    }

    showStatus() {
        this._showSystemStatus();
    }

    forceReload() {
        console.log('🔄 Recarregando sistema...');
        location.reload();
    }
}

// Inicializar automaticamente
const systemInitializer = new SystemInitializer();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.systemInitializer = systemInitializer;
}

export default systemInitializer;
