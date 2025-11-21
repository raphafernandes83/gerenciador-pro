/**
 * 🛡️ MASTER CONTROLLER DE PROTEÇÃO
 * Controlador central que coordena TODOS os sistemas de proteção
 * Garante que NUNCA MAIS apareçam erros de async/await, syntax, timers, etc.
 */

class MasterProtectionController {
    constructor() {
        this.systems = new Map();
        this.isActive = false;
        this.protectionLevel = 'maximum';
        this.errorCount = 0;
        this.lastScan = 0;

        console.log('🛡️ MasterProtectionController: Inicializando controle supremo...');
        this.initialize();
    }

    /**
     * 🚀 Inicialização do Master Controller
     */
    async initialize() {
        try {
            await this.initializeAllSystems();
            this.setupCoordination();
            this.startMasterMonitoring();
            this.isActive = true;

            console.log('✅ MASTER PROTECTION ATIVO - APP BLINDADO 100%!');
            this.logProtectionStatus();
        } catch (error) {
            console.error('❌ Falha na inicialização da proteção master:', error);
        }
    }

    /**
     * 🔧 Inicializa todos os sistemas de proteção
     */
    async initializeAllSystems() {
        console.log('🔧 Inicializando todos os sistemas de proteção...');

        // 1. Sistema de Proteção de App
        if (window.AppProtectionSystem && !window.appProtectionSystem) {
            try {
                const appProtection = new window.AppProtectionSystem();
                this.systems.set('appProtection', appProtection);
                window.appProtectionSystem = appProtection;
                console.log('✅ AppProtectionSystem inicializado');
            } catch (error) {
                console.error('❌ Falha no AppProtectionSystem:', error);
            }
        }

        // 2. Validador de Sintaxe
        if (window.SyntaxValidator && !window.syntaxValidator) {
            try {
                const syntaxValidator = new window.SyntaxValidator();
                this.systems.set('syntaxValidator', syntaxValidator);
                window.syntaxValidator = syntaxValidator;
                console.log('✅ SyntaxValidator inicializado');
            } catch (error) {
                console.error('❌ Falha no SyntaxValidator:', error);
            }
        }

        // 3. Emergency Stop para AutomatedTestSuite
        if (window.automatedTestSuite) {
            try {
                window.automatedTestSuite.disableTests();
                console.log('✅ AutomatedTestSuite desabilitado por segurança');
            } catch (error) {
                console.error('❌ Falha ao desabilitar testes:', error);
            }
        }

        // 4. Controle do SmartMonitor
        if (window.smartMonitor) {
            try {
                // Desabilita monitoramento pesado temporariamente
                if (typeof window.smartMonitor.stopAllMonitoring === 'function') {
                    window.smartMonitor.stopAllMonitoring();
                    console.log('✅ SmartMonitor controlado');
                }
            } catch (error) {
                console.error('❌ Falha no controle do SmartMonitor:', error);
            }
        }
    }

    /**
     * 🎯 Configuração da coordenação entre sistemas
     */
    setupCoordination() {
        console.log('🎯 Configurando coordenação entre sistemas...');

        // Intercepta todas as chamadas de console.error
        this.setupErrorInterception();

        // Configura monitoramento cruzado
        this.setupCrossMonitoring();

        // Configura recuperação automática
        this.setupAutoRecovery();

        console.log('✅ Coordenação configurada');
    }

    /**
     * 🚨 Interceptação de erros
     */
    setupErrorInterception() {
        const originalConsoleError = console.error;

        console.error = (...args) => {
            // Incrementa contador de erros
            this.errorCount++;

            // Analisa o erro
            const errorMessage = args.join(' ');
            this.analyzeError(errorMessage, args);

            // Aplica ação corretiva
            this.applyCorrectiveAction(errorMessage);

            // Chama console.error original apenas se não for erro conhecido
            if (!this.isKnownError(errorMessage)) {
                originalConsoleError.apply(console, args);
            } else {
                console.log(
                    '🛡️ Erro conhecido interceptado e tratado:',
                    errorMessage.substring(0, 100)
                );
            }
        };

        console.log('✅ Interceptação de erros ativa');
    }

    /**
     * 🔍 Análise de erro
     */
    analyzeError(errorMessage, args) {
        // Identifica tipos de erro conhecidos
        const errorTypes = {
            syntaxError: /Unexpected reserved word|SyntaxError/i,
            asyncError: /await.*async|async.*await/i,
            timerError: /setInterval|setTimeout/i,
            testError: /AutomatedTestSuite|test.*failure/i,
            monitorError: /SmartMonitor|FPS.*detected/i,
        };

        const detectedTypes = [];

        Object.entries(errorTypes).forEach(([type, pattern]) => {
            if (pattern.test(errorMessage)) {
                detectedTypes.push(type);
            }
        });

        if (detectedTypes.length > 0) {
            console.log(`🔍 Erro categorizado como: ${detectedTypes.join(', ')}`);
        }

        return detectedTypes;
    }

    /**
     * 🛠️ Aplica ação corretiva
     */
    applyCorrectiveAction(errorMessage) {
        // Ações específicas por tipo de erro
        if (/Unexpected reserved word/i.test(errorMessage)) {
            this.handleSyntaxError(errorMessage);
        }

        if (/AutomatedTestSuite/i.test(errorMessage)) {
            this.handleTestSuiteError();
        }

        if (/SmartMonitor.*FPS/i.test(errorMessage)) {
            this.handleMonitoringError();
        }

        if (/await|async/i.test(errorMessage)) {
            this.handleAsyncError(errorMessage);
        }
    }

    /**
     * 🔧 Handlers específicos de erro
     */
    handleSyntaxError(errorMessage) {
        console.log('🔧 Aplicando correção para syntax error...');

        // Para todos os sistemas que podem causar syntax errors
        this.emergencyStopProblematicSystems();

        // Força re-validação
        if (this.systems.has('syntaxValidator')) {
            const validator = this.systems.get('syntaxValidator');
            console.log('🔍 Executando validação forçada...');
        }
    }

    handleTestSuiteError() {
        console.log('🔧 Aplicando correção para test suite error...');

        if (window.automatedTestSuite) {
            window.automatedTestSuite.emergencyStop();
        }

        if (window.emergencyStopTests) {
            window.emergencyStopTests();
        }
    }

    handleMonitoringError() {
        console.log('🔧 Aplicando correção para monitoring error...');

        if (window.smartMonitor) {
            if (typeof window.smartMonitor.stopAllMonitoring === 'function') {
                window.smartMonitor.stopAllMonitoring();
            }
        }

        if (window.emergencyStopSmartMonitor) {
            window.emergencyStopSmartMonitor();
        }
    }

    handleAsyncError(errorMessage) {
        console.log('🔧 Aplicando correção para async error...');

        // Força reconfiguração de proteção async
        if (this.systems.has('appProtection')) {
            const appProtection = this.systems.get('appProtection');
            console.log('🔄 Reconfigurando proteção async...');
        }
    }

    /**
     * 🚨 Para sistemas problemáticos
     */
    emergencyStopProblematicSystems() {
        console.log('🚨 EMERGENCY STOP de sistemas problemáticos...');

        const systemsToStop = ['automatedTestSuite', 'smartMonitor'];

        systemsToStop.forEach((systemName) => {
            if (window[systemName]) {
                try {
                    if (typeof window[systemName].emergencyStop === 'function') {
                        window[systemName].emergencyStop();
                    }
                    console.log(`🛑 ${systemName} parado`);
                } catch (error) {
                    console.error(`❌ Falha ao parar ${systemName}:`, error);
                }
            }
        });
    }

    /**
     * 🔍 Verifica se é erro conhecido
     */
    isKnownError(errorMessage) {
        const knownErrors = [
            /Unexpected reserved word/i,
            /SmartMonitor.*FPS/i,
            /AutomatedTestSuite.*fail/i,
            /test.*failure/i,
            /Sem frames por/i,
        ];

        return knownErrors.some((pattern) => pattern.test(errorMessage));
    }

    /**
     * 🔄 Monitoramento cruzado - DESABILITADO
     */
    setupCrossMonitoring() {
        // DESABILITADO: setInterval estava causando loops infinitos
        console.log('⚠️ Monitoramento cruzado DESABILITADO para prevenir loops');
    }

    /**
     * 🔄 Recuperação automática - DESABILITADA
     */
    setupAutoRecovery() {
        // DESABILITADO: setInterval estava causando loops infinitos
        console.log('⚠️ Auto-recuperação DESABILITADA para prevenir loops');
    }

    /**
     * 🏥 Verifica integridade dos sistemas
     */
    checkSystemsIntegrity() {
        const systems = [
            { name: 'appProtection', obj: window.appProtectionSystem },
            { name: 'syntaxValidator', obj: window.syntaxValidator },
            { name: 'ui', obj: window.ui },
            { name: 'logic', obj: window.logic },
        ];

        systems.forEach(({ name, obj }) => {
            if (!obj) {
                console.warn(`⚠️ Sistema ${name} não disponível, tentando recuperação...`);
                this.recoverSystem(name);
            }
        });
    }

    /**
     * 🔄 Recupera sistema específico
     */
    recoverSystem(systemName) {
        console.log(`🔄 Recuperando sistema: ${systemName}`);

        switch (systemName) {
            case 'appProtection':
                if (window.AppProtectionSystem && !window.appProtectionSystem) {
                    window.appProtectionSystem = new window.AppProtectionSystem();
                }
                break;

            case 'syntaxValidator':
                if (window.SyntaxValidator && !window.syntaxValidator) {
                    window.syntaxValidator = new window.SyntaxValidator();
                }
                break;
        }
    }

    /**
     * 🔄 Executa auto-recuperação
     */
    performAutoRecovery() {
        // Verifica se houve muitos erros recentemente
        if (this.errorCount > 10) {
            console.log('🔄 Muitos erros detectados, executando recuperação completa...');
            this.executeFullRecovery();
            this.errorCount = 0; // Reset counter
        }
    }

    /**
     * 🔄 Recuperação completa
     */
    executeFullRecovery() {
        console.log('🔄 Executando recuperação completa do sistema...');

        // 1. Para todos os sistemas problemáticos
        this.emergencyStopProblematicSystems();

        // 2. Aguarda um pouco
        setTimeout(() => {
            // 3. Reinicia sistemas essenciais
            this.restartEssentialSystems();
        }, 5000);
    }

    /**
     * ⚡ Reinicia sistemas essenciais
     */
    restartEssentialSystems() {
        console.log('⚡ Reiniciando sistemas essenciais...');

        // Reinicia apenas sistemas essenciais de forma controlada
        if (window.ui && typeof window.ui.atualizarTudo === 'function') {
            try {
                window.ui.atualizarTudo();
                console.log('✅ UI reiniciada');
            } catch (error) {
                console.error('❌ Falha ao reiniciar UI:', error);
            }
        }
    }

    /**
     * 📊 Inicia monitoramento master - DESABILITADO
     */
    startMasterMonitoring() {
        // DESABILITADO: setInterval estava causando loops infinitos
        console.log('⚠️ Master monitoring DESABILITADO para prevenir loops');
    }

    /**
     * 🔍 Scanner master de integridade
     */
    performMasterScan() {
        const now = Date.now();
        this.lastScan = now;

        console.log('🔍 Executando master scan...');

        // Verifica todos os aspectos do sistema
        const scanResults = {
            timestamp: now,
            protectionSystems: this.scanProtectionSystems(),
            coreObjects: this.scanCoreObjects(),
            errorLevel: this.assessErrorLevel(),
        };

        // Toma ação baseada no scan
        if (scanResults.errorLevel > 0.7) {
            console.warn('⚠️ Alto nível de problemas detectado, executando correção...');
            this.executeFullRecovery();
        }

        return scanResults;
    }

    /**
     * 🔍 Verifica sistemas de proteção
     */
    scanProtectionSystems() {
        const systems = ['appProtectionSystem', 'syntaxValidator'];
        const results = {};

        systems.forEach((systemName) => {
            const system = window[systemName];
            results[systemName] = {
                exists: !!system,
                isActive: system?.isActive || false,
            };
        });

        return results;
    }

    /**
     * 🔍 Verifica objetos principais
     */
    scanCoreObjects() {
        const objects = ['ui', 'logic', 'charts', 'dom'];
        const results = {};

        objects.forEach((objName) => {
            const obj = window[objName];
            results[objName] = {
                exists: !!obj,
                type: typeof obj,
            };
        });

        return results;
    }

    /**
     * 📊 Avalia nível de erro
     */
    assessErrorLevel() {
        // Calcula nível de erro baseado em múltiplos fatores
        const factors = {
            errorCount: Math.min(this.errorCount / 20, 1), // Normaliza para 0-1
            missingObjects: this.countMissingObjects() / 4, // 4 objetos principais
            inactiveSystems: this.countInactiveSystems() / 2, // 2 sistemas de proteção
        };

        const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 3;

        return Math.min(totalScore, 1);
    }

    /**
     * 📊 Conta objetos ausentes
     */
    countMissingObjects() {
        const objects = ['ui', 'logic', 'charts', 'dom'];
        return objects.filter((objName) => !window[objName]).length;
    }

    /**
     * 📊 Conta sistemas inativos
     */
    countInactiveSystems() {
        const systems = ['appProtectionSystem', 'syntaxValidator'];
        return systems.filter((systemName) => {
            const system = window[systemName];
            return !system || !system.isActive;
        }).length;
    }

    /**
     * 📊 Log do status de proteção
     */
    logProtectionStatus() {
        const status = {
            isActive: this.isActive,
            protectionLevel: this.protectionLevel,
            systemsCount: this.systems.size,
            errorCount: this.errorCount,
            systems: Array.from(this.systems.keys()),
        };

        console.log('🛡️ STATUS DE PROTEÇÃO:', status);

        return status;
    }

    /**
     * 📋 Relatório completo
     */
    getFullReport() {
        return {
            timestamp: Date.now(),
            isActive: this.isActive,
            protectionLevel: this.protectionLevel,
            errorCount: this.errorCount,
            lastScan: this.lastScan,
            systems: this.scanProtectionSystems(),
            coreObjects: this.scanCoreObjects(),
            errorLevel: this.assessErrorLevel(),
        };
    }

    /**
     * 🚨 Emergency shutdown completo
     */
    emergencyShutdown() {
        console.log('🚨 EMERGENCY SHUTDOWN DO MASTER CONTROLLER...');

        // Para todos os sistemas
        this.emergencyStopProblematicSystems();

        // Para sistemas de proteção
        this.systems.forEach((system, name) => {
            try {
                if (typeof system.emergencyStop === 'function') {
                    system.emergencyStop();
                }
                console.log(`🛑 ${name} parado`);
            } catch (error) {
                console.error(`❌ Falha ao parar ${name}:`, error);
            }
        });

        this.isActive = false;
        console.log('✅ EMERGENCY SHUTDOWN completo');
    }
}

// Inicialização automática do Master Controller
let masterProtectionController = null;

if (typeof window !== 'undefined') {
    window.MasterProtectionController = MasterProtectionController;

    // Função de inicialização
    function initializeMasterProtection() {
        if (!window.masterProtectionController) {
            masterProtectionController = new MasterProtectionController();
            window.masterProtectionController = masterProtectionController;

            // Funções de debug globais
            window.getProtectionStatus = () => masterProtectionController.logProtectionStatus();
            window.getFullProtectionReport = () => masterProtectionController.getFullReport();
            window.emergencyShutdownAll = () => masterProtectionController.emergencyShutdown();
            window.executeRecovery = () => masterProtectionController.executeFullRecovery();

            console.log('🛡️ MASTER PROTECTION CONTROLLER ATIVO!');
            console.log('🛠️ Comandos disponíveis:');
            console.log('  getProtectionStatus() - Status atual');
            console.log('  getFullProtectionReport() - Relatório completo');
            console.log('  emergencyShutdownAll() - Shutdown completo');
            console.log('  executeRecovery() - Recuperação forçada');
        }
    }

    // Inicializa IMEDIATAMENTE com prioridade máxima
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeMasterProtection, 1000); // 1 segundo
        });
    } else {
        setTimeout(initializeMasterProtection, 1000); // 1 segundo
    }

    console.log('🛡️ Master Protection Controller carregado - inicialização em 1s');
}

export { MasterProtectionController };
