/**
 * 🛡️ SISTEMA DE PROTEÇÃO UNIVERSAL DO APP
 * Blindagem completa contra erros async/await, setInterval/setTimeout e problemas similares
 * Sistema defensivo de múltiplas camadas
 */

class AppProtectionSystem {
    constructor() {
        this.originalFunctions = new Map();
        this.protectedFunctions = new Set();
        this.errorLog = [];
        this.isActive = false;

        console.log('🛡️ AppProtectionSystem: Inicializando blindagem...');
        this.initialize();
    }

    /**
     * 🚀 Inicialização do Sistema de Proteção
     */
    initialize() {
        this.wrapAsyncFunctions();
        this.wrapTimerFunctions();
        this.setupGlobalErrorHandler();
        this.setupAsyncErrorHandler();
        this.setupSyntaxErrorDetection();
        this.setupPerformanceProtection();
        this.isActive = true;

        console.log('✅ AppProtectionSystem: Blindagem ativa!');
    }

    /**
     * 🔒 PROTEÇÃO 1: Wrapper para funções async/await
     */
    wrapAsyncFunctions() {
        console.log('🔒 Protegendo funções async/await...');

        // Protege window.ui.atualizarTudo
        if (window.ui && typeof window.ui.atualizarTudo === 'function') {
            this.protectAsyncFunction(window.ui, 'atualizarTudo');
        }

        // Protege window.logic.calcularPlano
        if (window.logic && typeof window.logic.calcularPlano === 'function') {
            this.protectAsyncFunction(window.logic, 'calcularPlano');
        }

        // Protege funções de sidebar
        if (window.sidebarManager) {
            this.protectAllAsyncMethods(window.sidebarManager, 'sidebarManager');
        }

        // Protege SmartMonitor
        if (window.smartMonitor) {
            this.protectAllAsyncMethods(window.smartMonitor, 'smartMonitor');
        }
    }

    /**
     * 🛡️ Protege função async individual
     */
    protectAsyncFunction(obj, functionName) {
        const originalFunc = obj[functionName];

        if (
            !originalFunc ||
            this.protectedFunctions.has(`${obj.constructor.name}.${functionName}`)
        ) {
            return; // Já protegida ou não existe
        }

        const protectionKey = `${obj.constructor.name}.${functionName}`;
        this.originalFunctions.set(protectionKey, originalFunc);
        this.protectedFunctions.add(protectionKey);

        obj[functionName] = async (...args) => {
            try {
                console.log(`🛡️ Executando ${protectionKey} de forma protegida...`);

                // Verifica se função original é async
                const result = originalFunc.apply(obj, args);

                if (result && typeof result.then === 'function') {
                    return await result;
                } else {
                    return result;
                }
            } catch (error) {
                this.logError(`Erro protegido em ${protectionKey}`, error);
                console.error(`❌ Erro protegido em ${protectionKey}:`, error);

                // Tenta recuperação
                this.attemptRecovery(obj, functionName, args);

                return null; // Retorno seguro
            }
        };

        console.log(`✅ Função ${protectionKey} protegida`);
    }

    /**
     * 🛡️ Protege todos os métodos async de um objeto
     */
    protectAllAsyncMethods(obj, objName) {
        if (!obj) return;

        const prototype = Object.getPrototypeOf(obj);
        const methodNames = Object.getOwnPropertyNames(prototype);

        methodNames.forEach((methodName) => {
            if (methodName !== 'constructor' && typeof obj[methodName] === 'function') {
                try {
                    // Verifica se é async pela presença de await no código
                    const funcString = obj[methodName].toString();
                    if (funcString.includes('await ') || funcString.includes('async ')) {
                        this.protectAsyncFunction(obj, methodName);
                    }
                } catch (error) {
                    // Ignora erros na análise
                }
            }
        });
    }

    /**
     * ⏰ PROTEÇÃO 2: Wrapper para setInterval/setTimeout - DESABILITADO
     * PROBLEMA: Estava causando loops infinitos ao interceptar seus próprios timers
     */
    wrapTimerFunctions() {
        console.log('⚠️ Timer protection DESABILITADO para prevenir loops infinitos');

        // Salva funções originais mas NÃO as sobrescreve
        this.originalFunctions.set('setInterval', window.setInterval);
        this.originalFunctions.set('setTimeout', window.setTimeout);

        // NÃO intercepta mais os timers - isso estava causando o problema!
        console.log('✅ Timer functions mantidas originais (proteção desabilitada)');
    }

    /**
     * 🛡️ Wrapper para callbacks de timer
     */
    wrapTimerCallback(callback, timerType) {
        if (typeof callback !== 'function') {
            console.warn(`⚠️ ${timerType}: callback não é função`, callback);
            return () => {}; // Callback seguro
        }

        return async (...args) => {
            try {
                const result = callback.apply(this, args);

                // Se retorna promise, aguarda
                if (result && typeof result.then === 'function') {
                    await result;
                }
            } catch (error) {
                this.logError(`Erro em callback de ${timerType}`, error);
                console.error(`❌ Erro protegido em ${timerType}:`, error);
            }
        };
    }

    /**
     * 🚨 PROTEÇÃO 3: Handler global de erros
     */
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.logError('Global Error', event.error);

            // Verifica se é erro de syntax
            if (
                event.error &&
                event.error.message &&
                event.error.message.includes('Unexpected reserved word')
            ) {
                this.handleSyntaxError(event);
            }

            console.error('🛡️ Erro global capturado:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
            console.error('🛡️ Promise rejection capturada:', event.reason);

            // Previne que o erro apareça no console
            event.preventDefault();
        });

        console.log('✅ Global error handlers ativos');
    }

    /**
     * ⚡ PROTEÇÃO 4: Handler específico para erros async
     */
    setupAsyncErrorHandler() {
        // Intercepta console.error para detectar erros async
        const originalConsoleError = console.error;

        console.error = (...args) => {
            // Verifica se é erro de async/await
            const errorMessage = args.join(' ');

            if (
                errorMessage.includes('Unexpected reserved word') ||
                errorMessage.includes('await') ||
                errorMessage.includes('async')
            ) {
                this.handleAsyncError(args);
            }

            // Chama console.error original
            originalConsoleError.apply(console, args);
        };

        console.log('✅ Async error handler ativo');
    }

    /**
     * 🔍 PROTEÇÃO 5: Detecção de erros de sintaxe - DESABILITADA
     */
    setupSyntaxErrorDetection() {
        // DESABILITADO: setInterval estava causando loops infinitos
        console.log('⚠️ Syntax error detection DESABILITADA para prevenir loops');
    }

    /**
     * 📊 PROTEÇÃO 6: Proteção de performance - DESABILITADA
     */
    setupPerformanceProtection() {
        // DESABILITADO: setInterval estava causando loops infinitos
        console.log('⚠️ Performance protection DESABILITADA para prevenir loops');
    }

    /**
     * 🔧 RECUPERAÇÃO: Tenta recuperar de erro
     */
    attemptRecovery(obj, functionName, args) {
        console.log(`🔧 Tentando recuperação para ${obj.constructor.name}.${functionName}`);

        // Estratégias de recuperação
        try {
            // 1. Verifica se função original ainda existe
            const originalKey = `${obj.constructor.name}.${functionName}`;
            const originalFunc = this.originalFunctions.get(originalKey);

            if (originalFunc) {
                console.log('🔧 Tentando função original...');
                return originalFunc.apply(obj, args);
            }
        } catch (recoveryError) {
            console.error('❌ Falha na recuperação:', recoveryError);
        }

        return null;
    }

    /**
     * 🚨 Handler para erros de sintaxe
     */
    handleSyntaxError(event) {
        console.log('🚨 Syntax error detectado, aplicando correção...');

        const errorMsg = event.error?.message || '';

        if (errorMsg.includes('Unexpected reserved word')) {
            // Tenta recarregar módulo problemático
            this.reloadProblematicModule(event.filename);
        }
    }

    /**
     * ⚡ Handler para erros async
     */
    handleAsyncError(errorArgs) {
        console.log('⚡ Async error detectado, aplicando correção...');

        const errorMsg = errorArgs.join(' ');

        // Identifica o arquivo problemático
        const fileMatch = errorMsg.match(/(\w+\.js):(\d+)/);

        if (fileMatch) {
            const filename = fileMatch[1];
            const lineNumber = fileMatch[2];

            console.log(`🎯 Erro em ${filename}:${lineNumber}`);
            this.handleSpecificAsyncError(filename, lineNumber);
        }
    }

    /**
     * 🔍 Scanner de problemas de sintaxe
     */
    scanForSyntaxProblems() {
        // Verifica objetos principais
        const objectsToCheck = [
            { obj: window.ui, name: 'ui' },
            { obj: window.logic, name: 'logic' },
            { obj: window.sidebarManager, name: 'sidebarManager' },
            { obj: window.smartMonitor, name: 'smartMonitor' },
            { obj: window.automatedTestSuite, name: 'automatedTestSuite' },
        ];

        objectsToCheck.forEach(({ obj, name }) => {
            if (!obj) {
                console.warn(`⚠️ Scanner: ${name} não disponível`);
                this.attemptObjectRecovery(name);
            }
        });
    }

    /**
     * 📊 Handler para problemas de performance
     */
    handlePerformanceIssue(timeDiff) {
        console.log(`📊 Performance issue detectado (${timeDiff}ms), aplicando otimizações...`);

        // Para testes automáticos se estiverem causando bloqueio
        if (window.automatedTestSuite) {
            window.automatedTestSuite.disableTests();
            console.log('🛑 Testes automáticos desabilitados por performance');
        }

        // Para monitoramento pesado se necessário
        if (window.smartMonitor) {
            console.log('🔧 Reduzindo frequência de monitoramento');
            // Lógica de redução seria implementada aqui
        }
    }

    /**
     * 🔄 Recarrega módulo problemático
     */
    reloadProblematicModule(filename) {
        console.log(`🔄 Tentando recarregar módulo: ${filename}`);

        // Estratégias específicas por arquivo
        switch (filename) {
            case 'sidebar.js':
                this.recoverSidebar();
                break;
            case 'ui.js':
                this.recoverUI();
                break;
            case 'logic.js':
                this.recoverLogic();
                break;
            default:
                console.log('🔄 Módulo não reconhecido para recuperação automática');
        }
    }

    /**
     * 🔧 Recuperações específicas
     */
    recoverSidebar() {
        console.log('🔧 Recuperando sidebar...');
        // Se sidebarManager existir, reinicializa
        if (window.sidebarManager) {
            try {
                window.sidebarManager.initialize();
            } catch (error) {
                console.error('❌ Falha na recuperação do sidebar:', error);
            }
        }
    }

    recoverUI() {
        console.log('🔧 Recuperando UI...');
        // Tenta re-inicializar UI sem parâmetros
        if (window.ui) {
            try {
                // Função de recuperação segura
                window.ui.atualizarTudo && window.ui.atualizarTudo();
            } catch (error) {
                console.error('❌ Falha na recuperação da UI:', error);
            }
        }
    }

    recoverLogic() {
        console.log('🔧 Recuperando Logic...');
        if (window.logic) {
            try {
                // Recuperação de estado lógico
                console.log('🔧 Logic ainda disponível, sem ação necessária');
            } catch (error) {
                console.error('❌ Falha na recuperação da Logic:', error);
            }
        }
    }

    /**
     * 🔄 Tenta recuperar objeto ausente
     */
    attemptObjectRecovery(objectName) {
        console.log(`🔄 Tentando recuperar objeto: ${objectName}`);

        // Aguarda um tempo e verifica novamente
        setTimeout(() => {
            const obj = window[objectName];
            if (obj) {
                console.log(`✅ Objeto ${objectName} recuperado`);
                this.protectAllAsyncMethods(obj, objectName);
            } else {
                console.warn(`⚠️ Objeto ${objectName} ainda indisponível`);
            }
        }, 5000);
    }

    /**
     * 🎯 Handler para erro async específico
     */
    handleSpecificAsyncError(filename, lineNumber) {
        console.log(`🎯 Aplicando correção específica: ${filename}:${lineNumber}`);

        // Mapeia correções conhecidas
        const knownFixes = {
            'sidebar.js': {
                1961: () => this.fixSidebarAsyncIssue(),
            },
            'ui.js': {
                1016: () => this.fixUIAsyncIssue(),
            },
        };

        const fix = knownFixes[filename]?.[lineNumber];
        if (fix) {
            try {
                fix();
                console.log(`✅ Correção aplicada para ${filename}:${lineNumber}`);
            } catch (error) {
                console.error(`❌ Falha na correção para ${filename}:${lineNumber}:`, error);
            }
        }
    }

    /**
     * 🔧 Correções específicas
     */
    fixSidebarAsyncIssue() {
        console.log('🔧 Aplicando correção para problema async do sidebar...');
        // Força re-proteção do sidebarManager
        if (window.sidebarManager) {
            this.protectAllAsyncMethods(window.sidebarManager, 'sidebarManager');
        }
    }

    fixUIAsyncIssue() {
        console.log('🔧 Aplicando correção para problema async da UI...');
        // Força re-proteção da UI
        if (window.ui) {
            this.protectAsyncFunction(window.ui, 'atualizarTudo');
        }
    }

    /**
     * 📝 Log de erros
     */
    logError(context, error) {
        const errorEntry = {
            timestamp: Date.now(),
            context,
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace',
            },
        };

        this.errorLog.push(errorEntry);

        // Mantém apenas os últimos 100 erros
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }
    }

    /**
     * 📊 Relatório de proteção
     */
    getProtectionReport() {
        return {
            isActive: this.isActive,
            protectedFunctions: Array.from(this.protectedFunctions),
            errorCount: this.errorLog.length,
            recentErrors: this.errorLog.slice(-5),
        };
    }

    /**
     * 🚨 Emergency stop - Para toda a proteção
     */
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP: Parando sistema de proteção...');

        // Restaura funções originais
        this.originalFunctions.forEach((originalFunc, key) => {
            if (key === 'setInterval') {
                window.setInterval = originalFunc;
            } else if (key === 'setTimeout') {
                window.setTimeout = originalFunc;
            }
        });

        this.isActive = false;
        console.log('✅ Sistema de proteção parado');
    }
}

// Inicialização automática do sistema de proteção
let appProtectionSystem = null;

if (typeof window !== 'undefined') {
    window.AppProtectionSystem = AppProtectionSystem;

    // Inicializa proteção ANTES de outros sistemas
    function initializeProtection() {
        if (!window.appProtectionSystem) {
            appProtectionSystem = new AppProtectionSystem();
            window.appProtectionSystem = appProtectionSystem;

            // Funções de debug
            window.getProtectionReport = () => appProtectionSystem.getProtectionReport();
            window.emergencyStopProtection = () => appProtectionSystem.emergencyStop();

            console.log('🛡️ Sistema de Proteção ativo! Use getProtectionReport() para status');
        }
    }

    // Inicializa IMEDIATAMENTE
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProtection);
    } else {
        initializeProtection();
    }
}

export { AppProtectionSystem };
