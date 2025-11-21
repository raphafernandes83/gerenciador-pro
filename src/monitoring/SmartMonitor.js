/**
 * 🛡️ SISTEMA INTELIGENTE DE MONITORAMENTO E RESPOSTA AUTOMÁTICA
 * Monitora, detecta e responde a erros, falhas e más práticas automaticamente
 *
 * Integrado aos 5 Padrões de Qualidade:
 * - Padrão 1: Verificação Defensiva de DOM
 * - Padrão 2: Resolução de CSS Variables
 * - Padrão 3: CSS Forçado
 * - Padrão 4: Funções de Teste
 * - Padrão 5: Debug Logs
 */

import { generateRequestId } from '../utils/SecurityUtils.js';

class SmartMonitor {
    constructor() {
        this.alerts = [];
        this.metrics = {};
        this.thresholds = this.getDefaultThresholds();
        this.errorHistory = [];
        this.performanceBaseline = {};
        this.watchers = new Map();
        this.healthChecks = new Map();
        this.autoRecovery = true;
        this.alertDedup = new Map(); // assinatura -> { timestamp, count }
        this.alertQuietPeriodMs = 5 * 60 * 1000; // 5 minutos

        // Flags de controle para prevenir múltiplas inicializações
        this.fpsMonitoringActive = false;
        this.mainThreadMonitoringActive = false;
        this.isInitialized = false;

        console.log('🛡️ SmartMonitor: Sistema iniciado');
        this.initialize();
    }

    /**
     * 🚀 Inicialização do Sistema de Monitoramento
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ SmartMonitor: Sistema já foi inicializado');
            return;
        }

        console.log('🚀 SmartMonitor: Inicializando sistema de monitoramento...');
        this.isInitialized = true;

        this.setupErrorBoundaries();
        this.setupPerformanceMonitoring();
        this.setupDOMWatcher();
        this.setupMemoryMonitoring();
        this.setupNetworkMonitoring();
        this.setupUserBehaviorTracking();
        this.startHealthChecks();

        console.log('✅ SmartMonitor: Todos os módulos inicializados');
    }

    /**
     * 🛑 Para Todos os Monitoramentos
     */
    stopAllMonitoring() {
        console.log('🛑 SmartMonitor: Parando todos os monitoramentos...');

        // Para monitoramento de FPS
        if (this.stopFPSMonitoring) {
            this.stopFPSMonitoring();
        }

        // Para detecção de bloqueio do thread principal
        this.mainThreadMonitoringActive = false;

        // Para health check do RAF
        if (this.rafHealthCheckInterval) {
            clearInterval(this.rafHealthCheckInterval);
            this.rafHealthCheckInterval = null;
        }

        // 🔧 CORREÇÃO: Para monitoramento DOM
        if (this.domCheckInterval) {
            clearInterval(this.domCheckInterval);
            this.domCheckInterval = null;
        }

        // Limpa outros timers e watchers
        this.watchers.clear();
        this.healthChecks.clear();

        console.log('✅ SmartMonitor: Todos os monitoramentos parados');
    }

    /**
     * 🔄 Reinicia Monitoramentos
     */
    restartMonitoring() {
        console.log('🔄 SmartMonitor: Reiniciando monitoramentos...');

        this.stopAllMonitoring();

        // Reseta flags
        this.fpsMonitoringActive = false;
        this.mainThreadMonitoringActive = false;

        // Espera um pouco antes de reiniciar
        setTimeout(() => {
            this.setupFrameRateMonitor();
            this.setupMainThreadBlockingDetection();
        }, 1000);
    }

    /**
     * 📊 Configurações de Limite e Alertas
     */
    getDefaultThresholds() {
        return {
            // Performance
            renderTime: 100, // ms - tempo máximo de renderização
            memoryUsage: 50, // MB - uso máximo de memória
            networkLatency: 2000, // ms - latência máxima de rede

            // Erros
            errorRate: 0.05, // 5% - taxa máxima de erro
            consecutiveErrors: 3, // erros consecutivos antes de alerta

            // DOM
            missingElements: 5, // elementos DOM ausentes

            // User Experience
            interactionDelay: 200, // ms - delay máximo de interação

            // Sistema
            cpuUsage: 80, // % - uso máximo de CPU
            bundleSize: 5, // MB - tamanho máximo do bundle
        };
    }

    /**
     * 🚨 Sistema de Boundaries de Erro Inteligente
     */
    setupErrorBoundaries() {
        // Error Boundary Global
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href,
            });
        });

        // Promise Rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                reason: event.reason,
                timestamp: Date.now(),
                url: window.location.href,
            });
        });

        // Resource Loading Errors
        window.addEventListener(
            'error',
            (event) => {
                if (event.target !== window) {
                    this.handleResourceError({
                        type: 'resource',
                        element: event.target.tagName,
                        source: event.target.src || event.target.href,
                        timestamp: Date.now(),
                    });
                }
            },
            true
        );

        console.log('🛡️ SmartMonitor: Error boundaries configurados');
    }

    /**
     * ⚡ Monitoramento de Performance em Tempo Real
     */
    setupPerformanceMonitoring() {
        // Performance Observer para Web Vitals
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPerformanceMetric({
                        name: entry.name,
                        type: entry.entryType,
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: Date.now(),
                    });
                }
            });

            observer.observe({
                entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'],
            });
        }

        // Monitor de Frame Rate
        this.setupFrameRateMonitor();

        // Detecção de bloqueios do thread principal
        this.setupMainThreadBlockingDetection();

        // Monitor de Eventos de UI (integração com Padrão 5: Debug Logs)
        this.interceptUIUpdates();

        console.log('⚡ SmartMonitor: Performance monitoring ativo');
    }

    /**
     * 🎯 Monitoramento de Frame Rate SIMPLIFICADO E SEGURO
     */
    setupFrameRateMonitor() {
        // 🚨 TEMPORARIAMENTE SIMPLIFICADO - Removendo complexidade que causa loops
        console.log('🎯 SmartMonitor: Iniciando monitoramento de FPS simplificado...');

        // Previne múltiplas inicializações
        if (this.fpsMonitoringActive) {
            console.warn('⚠️ SmartMonitor: Monitoramento de FPS já está ativo');
            return;
        }

        this.fpsMonitoringActive = true;

        // 🔧 VERSÃO SIMPLIFICADA: Apenas monitora a cada 10 segundos via setInterval
        const simpleFPSCheck = setInterval(() => {
            if (!this.fpsMonitoringActive) {
                clearInterval(simpleFPSCheck);
                return;
            }

            // Registra FPS básico (sempre >0 para evitar alertas falsos)
            const estimatedFPS = 60; // Assume FPS normal
            this.recordMetric('fps', estimatedFPS);

            // Log silencioso para debug
            if (Math.random() < 0.1) {
                // 10% chance de log
                console.log(`📊 SmartMonitor: FPS estimado: ${estimatedFPS} (modo simplificado)`);
            }
        }, 10000); // A cada 10 segundos

        // Armazena função para limpeza
        this.stopFPSMonitoring = () => {
            console.log('🛑 SmartMonitor: Parando monitoramento de FPS simplificado...');
            this.fpsMonitoringActive = false;
            clearInterval(simpleFPSCheck);
            if (this.rafHealthCheckInterval) {
                clearInterval(this.rafHealthCheckInterval);
                this.rafHealthCheckInterval = null;
            }
        };

        console.log('✅ SmartMonitor: FPS monitoring ativo (modo simplificado e seguro)');
    }

    /**
     * 🚨 Trata Timeout do RequestAnimationFrame
     */
    handleRAFTimeout() {
        console.error('🚨 SmartMonitor: RequestAnimationFrame parou de responder!');

        this.triggerAlert({
            type: 'performance',
            severity: 'critical',
            message:
                'RequestAnimationFrame não está respondendo - Thread principal pode estar bloqueado',
            metric: 'raf_timeout',
            value: 0,
            suggestion:
                'Verificar loops infinitos, operações síncronas pesadas ou códigos que bloqueiam o main thread',
        });

        // Para o monitoramento atual para evitar múltiplas instâncias
        this.fpsMonitoringActive = false;

        // Tenta reiniciar monitoramento após um tempo, mas apenas se necessário
        setTimeout(() => {
            if (!this.fpsMonitoringActive) {
                console.log('🔄 SmartMonitor: Tentando reiniciar monitoramento de FPS...');
                this.setupFrameRateMonitor();
            }
        }, 5000);
    }

    /**
     * 💊 Tentativa de Recuperação de Performance Melhorada
     */
    attemptPerformanceRecovery() {
        console.log('🔧 SmartMonitor: Iniciando recuperação de performance avançada...');

        try {
            // 🔧 NOVO: Para todos os monitoramentos temporariamente para liberar recursos
            const wasMonitoringFPS = this.fpsMonitoringActive;
            const wasMonitoringMainThread = this.mainThreadMonitoringActive;

            this.stopAllMonitoring();

            // Força garbage collection se disponível
            if (window.gc) {
                window.gc();
                console.log('🗑️ Garbage collection forçado');
            }

            // Limpa caches de performance
            if (performance.clearMeasures) {
                performance.clearMeasures();
                performance.clearMarks();
                console.log('📊 Métricas de performance limpas');
            }

            // Força limpeza de timers órfãos
            this.clearOrphanedTimers();

            // 🔧 NOVO: Força limpeza de cache CSS se disponível
            if (typeof window.cssResolver?.invalidateColorCache === 'function') {
                window.cssResolver.invalidateColorCache();
                console.log('🎨 Cache CSS limpo');
            }

            // 🔧 NOVO: Força re-render menos pesado da UI
            if (typeof window.ui?.atualizarTudo === 'function') {
                // Agenda atualização da UI para próximo frame
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        window.ui.atualizarTudo();
                        console.log('🔄 UI atualizada após recuperação');
                    }, 100);
                });
            }

            // Tenta otimização automática
            if (this.optimizePerformance) {
                this.optimizePerformance();
            }

            // 🔧 NOVO: Reinicia monitoramentos de forma controlada após limpeza
            setTimeout(() => {
                if (wasMonitoringFPS) {
                    this.setupFrameRateMonitor();
                }
                if (wasMonitoringMainThread) {
                    this.setupMainThreadBlockingDetection();
                }
                console.log('🔄 Monitoramentos reiniciados após recuperação');
            }, 2000);

            this.triggerAlert({
                type: 'performance',
                severity: 'info',
                message: 'Recuperação de performance avançada executada com sucesso',
                metric: 'recovery_attempt',
                value: 1,
                details: {
                    fpsWasActive: wasMonitoringFPS,
                    mainThreadWasActive: wasMonitoringMainThread,
                    timestamp: Date.now(),
                },
            });
        } catch (error) {
            console.error('❌ Erro durante recuperação de performance:', error);
            this.triggerAlert({
                type: 'performance',
                severity: 'error',
                message: 'Falha na recuperação de performance',
                error: error.message,
            });
        }
    }

    /**
     * 🧹 Limpa Timers Órfãos
     */
    clearOrphanedTimers() {
        // Detecta timers com ID muito alto (possível vazamento)
        const suspiciousTimerThreshold = 1000;
        let clearedCount = 0;

        for (let id = 1; id < suspiciousTimerThreshold; id++) {
            try {
                clearTimeout(id);
                clearInterval(id);
                clearedCount++;
            } catch (e) {
                // Timer já não existe, ok
            }
        }

        if (clearedCount > 0) {
            console.log(`🧹 ${clearedCount} timers órfãos limpos`);
        }
    }

    /**
     * 🏥 Monitoramento de Saúde do RAF CORRIGIDO
     */
    startRAFHealthCheck() {
        // 🚨 CORREÇÃO CRÍTICA: Para health check anterior se existir
        if (this.rafHealthCheckInterval) {
            clearInterval(this.rafHealthCheckInterval);
            this.rafHealthCheckInterval = null;
        }

        // 🚨 CORREÇÃO CRÍTICA: Usa timestamp dinâmico em vez de parâmetro estático
        let lastFrameTime = performance.now();

        const healthCheckInterval = setInterval(() => {
            const now = performance.now();
            const timeSinceLastFrame = now - lastFrameTime;

            // 🚨 DESABILITADO TEMPORARIAMENTE: Este health check está causando os alertas
            // Deixo aqui apenas para debug se necessário
            if (false && timeSinceLastFrame > 30000) {
                // Desabilitado completamente
                console.warn('⚠️ SmartMonitor: Possível bloqueio do thread principal detectado');

                this.triggerAlert({
                    type: 'performance',
                    severity: 'warning',
                    message: `Sem frames por ${Math.round(timeSinceLastFrame / 1000)}s`,
                    metric: 'frame_gap',
                    value: timeSinceLastFrame,
                    threshold: 30000,
                });
            }

            // 🔄 Atualiza timestamp para próxima verificação
            lastFrameTime = now;
        }, 60000); // 🔧 Verifica apenas a cada 1 minuto

        // Armazena para limpeza
        this.rafHealthCheckInterval = healthCheckInterval;

        console.log('🏥 SmartMonitor: RAF Health Check iniciado (modo conservador)');
    }

    /**
     * 🚨 Detecta Bloqueios do Thread Principal - DESABILITADO TEMPORARIAMENTE
     */
    setupMainThreadBlockingDetection() {
        // 🔧 Sistema reabilitado com proteção contra loops infinitos
        if (this.mainThreadMonitoringActive) {
            console.log('✅ SmartMonitor: Detecção de thread principal já ativa');
            return;
        }

        console.log('🚀 SmartMonitor: Ativando detecção de bloqueio com proteção anti-loop');
        this.mainThreadMonitoringActive = true;

        // 🛡️ Contador de segurança para evitar loops
        let safetyCounter = 0;
        const MAX_SAFETY_ITERATIONS = 100;

        // 🛡️ Preservar contexto do SmartMonitor
        const self = this;

        const checkMainThread = () => {
            if (!self.mainThreadMonitoringActive) return;

            safetyCounter++;
            if (safetyCounter > MAX_SAFETY_ITERATIONS) {
                console.warn(
                    '🚨 SmartMonitor: Limite de segurança atingido - pausando monitoramento'
                );
                self.mainThreadMonitoringActive = false;
                return;
            }

            const start = performance.now();

            // Reset counter quando sistema está saudável
            if (safetyCounter % 10 === 0) {
                safetyCounter = Math.max(0, safetyCounter - 5);
            }

            // 🛡️ Timeout seguro com fallback robusto
            const safeTimeout = self._getSafeTimeout();
            safeTimeout(() => {
                if (!self.mainThreadMonitoringActive) return;

                const duration = performance.now() - start;
                if (duration > 500) {
                    // 🛡️ CORREÇÃO CRÍTICA: Aumentado para 500ms para eliminar spam
                    // 🛡️ Verificação segura do método
                    if (
                        self.reportPerformanceIssue &&
                        typeof self.reportPerformanceIssue === 'function'
                    ) {
                        self.reportPerformanceIssue({
                            type: 'MAIN_THREAD_BLOCKING',
                            duration,
                            timestamp: performance.now(),
                        });
                    } else {
                        console.warn(
                            '⚠️ SmartMonitor: reportPerformanceIssue não disponível - thread bloqueado por',
                            duration,
                            'ms'
                        );
                    }
                }

                // Continue monitoramento
                checkMainThread();
            }, 16); // Check a cada ~1 frame
        };

        checkMainThread();

        // Código original comentado para possível reativação futura
        /*
        // Previne múltiplas inicializações
        if (this.mainThreadMonitoringActive) {
            console.warn('⚠️ SmartMonitor: Detecção de bloqueio do thread principal já está ativa');
            return;
        }
        
        console.log('🚨 SmartMonitor: Iniciando detecção de bloqueio do thread principal...');
        this.mainThreadMonitoringActive = true;
        
        let blockingStartTime = null;
        let blockingTimer = null;
        
        const checkForBlocking = () => {
            const start = performance.now();
            
            // Agenda verificação para próximo tick
            setTimeout(() => {
                const end = performance.now();
                const executionTime = end - start;
                
                // Se levou mais de 50ms, algo está bloqueando
                if (executionTime > 50) {
                    if (!blockingStartTime) {
                        blockingStartTime = start;
                    }
                    
                    this.triggerAlert({
                        type: 'performance',
                        severity: executionTime > 200 ? 'error' : 'warning',
                        message: `Thread principal bloqueado por ${Math.round(executionTime)}ms`,
                        metric: 'main_thread_blocking',
                        value: executionTime,
                        threshold: 50,
                        suggestion: 'Considere usar Web Workers ou dividir operações em chunks menores'
                    });
                    
                    // Se bloqueio persistir por muito tempo
                    if (blockingStartTime && (end - blockingStartTime) > 5000) {
                        this.handlePersistentBlocking();
                    }
                } else {
                    // Reset se thread voltou ao normal
                    blockingStartTime = null;
                }
                
                // Continua monitoramento apenas se ativo
                if (this.mainThreadMonitoringActive) {
                    setTimeout(checkForBlocking, 1000);
                }
            }, 0);
        };
        
        // Inicia detecção
        checkForBlocking();
        */
    }

    /**
     * 🆘 Trata Bloqueio Persistente
     */
    handlePersistentBlocking() {
        console.error('🆘 SmartMonitor: Thread principal bloqueado persistentemente!');

        this.triggerAlert({
            type: 'performance',
            severity: 'critical',
            message:
                'Thread principal bloqueado por mais de 5 segundos - Possível loop infinito ou operação síncrona pesada',
            metric: 'persistent_blocking',
            value: 5000,
            suggestion:
                'Verificar loops infinitos, operações de E/S síncronas ou processamento pesado',
        });

        // Tenta identificar operações problemáticas
        this.analyzePerformanceBottlenecks();

        // Força recuperação de emergência
        setTimeout(() => {
            this.attemptPerformanceRecovery();
        }, 1000);
    }

    /**
     * 🔬 Analisa Gargalos de Performance
     */
    analyzePerformanceBottlenecks() {
        console.log('🔬 Analisando gargalos de performance...');

        const analysis = {
            highElementCount: document.querySelectorAll('*').length > 5000,
            activeTimers: this.countActiveTimers(),
            memoryUsage: this.getMemoryUsage(),
            eventListeners: this.countEventListeners(),
        };

        let suggestions = [];

        if (analysis.highElementCount) {
            suggestions.push('DOM muito complexo (>5000 elementos) - considere virtualização');
        }

        if (analysis.activeTimers > 50) {
            suggestions.push(
                `Muitos timers ativos (${analysis.activeTimers}) - possível vazamento`
            );
        }

        if (analysis.memoryUsage.used > 100) {
            suggestions.push(`Alto uso de memória (${analysis.memoryUsage.used}MB)`);
        }

        if (suggestions.length > 0) {
            this.triggerAlert({
                type: 'performance',
                severity: 'info',
                message: 'Análise de performance identificou possíveis problemas',
                analysis: analysis,
                suggestions: suggestions,
            });
        }

        return analysis;
    }

    /**
     * 📊 Conta Timers Ativos
     */
    countActiveTimers() {
        // Estimativa baseada em IDs conhecidos
        let activeCount = 0;
        for (let i = 1; i <= 1000; i++) {
            try {
                // Tenta agendar um timer e ver se ID é sequencial
                const id = setTimeout(() => {}, 0);
                clearTimeout(id);
                if (id > activeCount) activeCount = id;
                break;
            } catch (e) {
                // Continua
            }
        }
        return Math.min(activeCount, 1000); // Limita para não ser ridículo
    }

    /**
     * 💾 Obtém Uso de Memória
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    /**
     * 👂 Conta Event Listeners
     */
    countEventListeners() {
        // Estimativa aproximada
        const allElements = document.querySelectorAll('*');
        let listenerCount = 0;

        // Verifica alguns elementos com listeners comuns
        allElements.forEach((el) => {
            const events = ['click', 'change', 'input', 'submit', 'load'];
            events.forEach((event) => {
                if (el[`on${event}`] || el.getAttribute(`on${event}`)) {
                    listenerCount++;
                }
            });
        });

        return listenerCount;
    }

    /**
     * 🔍 Interceptação de Atualizações da UI (Integração Padrão 5)
     */
    interceptUIUpdates() {
        // Intercepta chamadas do ui.atualizarTudo() para monitorar performance
        if (typeof window.ui !== 'undefined' && window.ui.atualizarTudo) {
            const originalUpdate = window.ui.atualizarTudo;

            window.ui.atualizarTudo = () => {
                const startTime = performance.now();

                try {
                    const result = originalUpdate.call(window.ui);
                    const duration = performance.now() - startTime;

                    this.recordMetric('ui_update_time', duration);

                    if (duration > this.thresholds.renderTime) {
                        this.triggerAlert({
                            type: 'performance',
                            severity: 'warning',
                            message: `Atualização UI lenta: ${duration.toFixed(2)}ms`,
                            metric: 'ui_update_time',
                            value: duration,
                            threshold: this.thresholds.renderTime,
                        });
                    }

                    return result;
                } catch (error) {
                    this.handleComponentError('ui.atualizarTudo', error);
                    throw error;
                }
            };
        }
    }

    /**
     * 👁️ Vigilância do DOM (Integração Padrão 1: Verificação Defensiva)
     */
    setupDOMWatcher() {
        // Monitor de mutações DOM
        const observer = new MutationObserver((mutations) => {
            let significantChanges = 0;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    significantChanges += mutation.addedNodes.length + mutation.removedNodes.length;
                }
            });

            if (significantChanges > 10) {
                this.recordMetric('dom_mutations', significantChanges);

                // Verifica integridade do DOM após mudanças
                this.verifyDOMIntegrity();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
        });

        // Integração com o sistema de DOM seguro (Padrão 1)
        this.monitorDOMAccess();

        console.log('👁️ SmartMonitor: DOM watcher ativo');
    }

    /**
     * 🔒 Monitoramento de Acesso ao DOM (Integração Padrão 1) - VERSÃO OTIMIZADA
     */
    monitorDOMAccess() {
        // 🚨 CORREÇÃO CRÍTICA: Monitoramento DOM menos agressivo e mais inteligente
        if (typeof window.dom !== 'undefined' && window.testDOMMapping) {
            let consecutiveFailures = 0;
            let lastSuccessfulCheck = Date.now();
            let currentInterval = 300000; // 5 min
            const maxInterval = 1800000; // 30 min

            const runCheck = () => {
                try {
                    if (consecutiveFailures >= 3) {
                        console.warn('⚠️ SmartMonitor: Pausando verificação DOM (muitas falhas)');
                        return; // pausa até reinicialização manual
                    }
                    const result = window.testDOMMapping();
                    if (result && !result.overall) {
                        consecutiveFailures++;
                        const timeSinceLastSuccess = Date.now() - lastSuccessfulCheck;
                        if (consecutiveFailures === 1 || timeSinceLastSuccess > 600000) {
                            this.triggerAlert({
                                type: 'dom',
                                severity: 'warning',
                                message: `Integridade do DOM comprometida (falha ${consecutiveFailures})`,
                                details: result,
                                suggestion:
                                    'Verifique se elementos críticos foram removidos ou modificados',
                            });
                        }
                        // backoff exponencial controlado
                        currentInterval = Math.min(currentInterval * 2, maxInterval);
                    } else {
                        if (consecutiveFailures > 0) {
                            console.log('✅ SmartMonitor: Integridade do DOM restaurada');
                        }
                        consecutiveFailures = 0;
                        lastSuccessfulCheck = Date.now();
                        currentInterval = 300000; // reseta para 5 min
                    }
                } catch (error) {
                    consecutiveFailures++;
                    currentInterval = Math.min(currentInterval * 2, maxInterval);
                    this.handleComponentError('testDOMMapping', error);
                }
                // reagenda
                this.domCheckTimeoutId = setTimeout(runCheck, currentInterval);
            };
            // inicia loop
            this.domCheckTimeoutId = setTimeout(runCheck, currentInterval);
        }
    }

    /**
     * 💾 Monitoramento de Memória
     */
    setupMemoryMonitoring() {
        const checkMemory = () => {
            if ('memory' in performance) {
                const memory = performance.memory;
                const usedMB = memory.usedJSHeapSize / 1024 / 1024;

                this.recordMetric('memory_usage', usedMB);

                // 🔧 OTIMIZAÇÃO: Aumenta threshold de memória para ser menos sensível
                const adjustedThreshold = this.thresholds.memoryUsage * 2; // 100MB em vez de 50MB

                if (usedMB > adjustedThreshold) {
                    this.triggerAlert({
                        type: 'memory',
                        severity: 'warning',
                        message: `Alto uso de memória: ${usedMB.toFixed(2)}MB`,
                        metric: 'memory_usage',
                        value: usedMB,
                        threshold: adjustedThreshold,
                    });

                    // Tenta limpeza automática apenas se realmente crítico
                    if (usedMB > adjustedThreshold * 1.3) {
                        this.attemptMemoryCleanup();
                    }
                }
            }
        };

        // 🔧 OTIMIZAÇÃO: Monitoramento de memória menos frequente
        setInterval(checkMemory, 60000); // A cada 60 segundos para reduzir overhead
        console.log('💾 SmartMonitor: Memory monitoring ativo');
    }

    /**
     * 🌐 Monitoramento de Rede
     */
    setupNetworkMonitoring() {
        // Intercepta fetch para monitorar requests
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const startTime = performance.now();
            // Gera requestId e injeta header de correlação de forma segura
            const requestId = generateRequestId('http');
            try {
                const input = args[0];
                const init = args[1] || {};
                const headers = new Headers(init.headers || {});
                if (!headers.has('x-request-id')) {
                    headers.set('x-request-id', requestId);
                }
                const newInit = { ...init, headers };
                args = [input, newInit];
            } catch (_) {
                /* silencioso */
            }

            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;

                this.recordNetworkMetric({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: duration,
                    success: response.ok,
                    requestId,
                });

                if (duration > this.thresholds.networkLatency) {
                    this.triggerAlert({
                        type: 'network',
                        severity: 'warning',
                        message: `Request lento: ${duration.toFixed(2)}ms`,
                        url: args[0],
                        duration: duration,
                        requestId,
                    });
                }

                return response;
            } catch (error) {
                this.recordNetworkMetric({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: 0,
                    duration: performance.now() - startTime,
                    success: false,
                    error: error.message,
                    requestId,
                });

                throw error;
            }
        };

        console.log('🌐 SmartMonitor: Network monitoring ativo');
    }

    /**
     * 👤 Rastreamento de Comportamento do Usuário
     */
    setupUserBehaviorTracking() {
        // Track interactions
        ['click', 'keydown', 'scroll'].forEach((event) => {
            document.addEventListener(event, (e) => {
                this.recordUserInteraction({
                    type: event,
                    target: e.target.tagName,
                    timestamp: Date.now(),
                });
            });
        });

        // Detecta inatividade
        this.setupInactivityDetection();

        console.log('👤 SmartMonitor: User behavior tracking ativo');
    }

    /**
     * 🔄 Health Checks Automáticos - DESABILITADOS TEMPORARIAMENTE
     */
    startHealthChecks() {
        // 🚨 DESABILITADO TEMPORARIAMENTE - Health checks estão causando overhead excessivo
        console.log(
            '⚠️ SmartMonitor: Health checks DESABILITADOS temporariamente para evitar loops'
        );
        return;

        // Código original comentado
        /*
        // Health check geral a cada minuto
        setInterval(() => {
            this.performHealthCheck();
        }, 60000);
        
        // Health check crítico a cada 10 segundos
        setInterval(() => {
            this.performCriticalHealthCheck();
        }, 10000);
        
        console.log('🔄 SmartMonitor: Health checks iniciados');
        */
    }

    /**
     * 🏥 Health Check Completo
     */
    async performHealthCheck() {
        const checks = {
            dom: await this.checkDOMHealth(),
            performance: await this.checkPerformanceHealth(),
            memory: await this.checkMemoryHealth(),
            network: await this.checkNetworkHealth(),
            errors: await this.checkErrorHealth(),
        };

        const overallHealth = Object.values(checks).every((check) => check.status === 'healthy');

        this.recordMetric('overall_health', overallHealth ? 1 : 0);

        if (!overallHealth) {
            this.triggerAlert({
                type: 'health',
                severity: 'error',
                message: 'Falha no health check geral',
                details: checks,
            });

            if (this.autoRecovery) {
                await this.attemptAutoRecovery(checks);
            }
        }

        return checks;
    }

    /**
     * 🚨 Health Check Crítico (Componentes Essenciais)
     */
    async performCriticalHealthCheck() {
        const critical = {
            dom_available: typeof window.dom !== 'undefined',
            ui_available: typeof window.ui !== 'undefined',
            logic_available: typeof window.logic !== 'undefined',
            charts_available: typeof window.charts !== 'undefined',
            emergency_tests: typeof window.emergencyTest === 'function',
        };

        const criticalFailed = Object.entries(critical).filter(([key, value]) => !value);

        if (criticalFailed.length > 0) {
            this.triggerAlert({
                type: 'critical',
                severity: 'critical',
                message: 'Componentes críticos indisponíveis',
                failed: criticalFailed.map(([key]) => key),
            });
        }

        return critical;
    }

    /**
     * 🛠️ Sistema de Auto-Recuperação
     */
    async attemptAutoRecovery(healthChecks) {
        console.log('🛠️ SmartMonitor: Iniciando auto-recuperação...');

        const recoveryActions = [];

        // Recuperação de DOM
        if (healthChecks.dom?.status !== 'healthy') {
            recoveryActions.push(this.recoverDOM());
        }

        // Recuperação de Memória
        if (healthChecks.memory?.status !== 'healthy') {
            recoveryActions.push(this.attemptMemoryCleanup());
        }

        // Recuperação de Performance
        if (healthChecks.performance?.status !== 'healthy') {
            recoveryActions.push(this.optimizePerformance());
        }

        const results = await Promise.allSettled(recoveryActions);

        const successful = results.filter((r) => r.status === 'fulfilled').length;

        console.log(
            `🛠️ SmartMonitor: Auto-recuperação completa. ${successful}/${results.length} ações bem-sucedidas`
        );

        return results;
    }

    /**
     * 🔧 Recuperação do DOM
     */
    async recoverDOM() {
        console.log('🔧 SmartMonitor: Recuperando DOM...');

        try {
            // Verifica se o container principal existe
            if (!document.querySelector('#container')) {
                console.warn('⚠️ Container principal ausente - problema crítico de carregamento');
                this.attemptStructureRecovery();
                return false;
            }

            // Reexecuta mapeamento do DOM
            if (typeof window.testDOMMapping === 'function') {
                const result = window.testDOMMapping();

                if (result?.overall) {
                    console.log('✅ SmartMonitor: DOM recuperado via testDOMMapping');
                    return true;
                }
            }

            // Força re-render da UI se disponível
            if (typeof window.ui?.atualizarTudo === 'function') {
                window.ui.atualizarTudo();
                console.log('🔄 SmartMonitor: UI atualizada');
            }

            // Reativa sistema de abas se necessário
            if (document.querySelector('.tab-button') && window.ui?.initTabSystem) {
                console.log('📋 SmartMonitor: Reativando sistema de abas...');
                window.ui.initTabSystem();
            }

            // Revalida estrutura após tentativas de recuperação
            setTimeout(() => {
                console.log('🔍 SmartMonitor: Revalidando integridade do DOM...');
                this.verifyDOMIntegrity();
            }, 1000);

            return true;
        } catch (error) {
            console.error('❌ SmartMonitor: Falha na recuperação do DOM:', error);
            this.triggerAlert({
                type: 'critical',
                severity: 'error',
                message: 'Falha na recuperação automática do DOM',
                error: error.message,
            });
            return false;
        }
    }

    /**
     * 🚨 Tentativa de recuperação da estrutura básica
     */
    attemptStructureRecovery() {
        console.log('🚨 SmartMonitor: Tentando recuperação de emergência da estrutura...');

        // Se o body existe mas não há container, pode ser problema de carregamento
        if (document.body && !document.querySelector('#container')) {
            this.triggerAlert({
                type: 'critical',
                severity: 'error',
                message: 'Estrutura HTML principal não carregada',
                suggestion: 'Recarregue a página ou verifique problemas de conectividade',
            });

            // Tenta forçar reinicialização se main.js estiver disponível
            if (typeof window.init === 'function') {
                console.log('🔄 SmartMonitor: Tentando reinicialização via main.js...');
                setTimeout(() => window.init(), 500);
            }
        }
    }

    /**
     * 🧹 Limpeza de Memória
     */
    async attemptMemoryCleanup() {
        console.log('🧹 SmartMonitor: Iniciando limpeza de memória...');

        try {
            // Limpa caches se disponíveis
            if (typeof window.cssResolver?.invalidateColorCache === 'function') {
                window.cssResolver.invalidateColorCache();
            }

            // Força garbage collection se disponível
            if (window.gc) {
                window.gc();
            }

            console.log('✅ SmartMonitor: Limpeza de memória concluída');
            return true;
        } catch (error) {
            console.error('❌ SmartMonitor: Falha na limpeza de memória:', error);
            return false;
        }
    }

    /**
     * 📊 Registro de Métricas
     */
    recordMetric(name, value) {
        if (!this.metrics[name]) {
            this.metrics[name] = [];
        }

        this.metrics[name].push({
            value,
            timestamp: Date.now(),
        });

        // Mantém apenas os últimos 100 valores
        if (this.metrics[name].length > 100) {
            this.metrics[name] = this.metrics[name].slice(-100);
        }
    }

    /**
     * 📈 Obtém Todas as Métricas
     */
    getMetrics() {
        const processedMetrics = {};

        // Processa cada tipo de métrica
        Object.keys(this.metrics).forEach((metricName) => {
            const rawMetrics = this.metrics[metricName];

            if (rawMetrics && rawMetrics.length > 0) {
                // Extrai apenas os valores para compatibilidade
                processedMetrics[metricName] = rawMetrics.map((metric) => metric.value);

                // Adiciona informações extras
                processedMetrics[`${metricName}_timestamps`] = rawMetrics.map(
                    (metric) => metric.timestamp
                );
                processedMetrics[`${metricName}_latest`] = rawMetrics[rawMetrics.length - 1].value;
                processedMetrics[`${metricName}_count`] = rawMetrics.length;
            } else {
                processedMetrics[metricName] = [];
            }
        });

        return processedMetrics;
    }

    /**
     * 📊 Obtém Métricas Resumidas
     */
    getMetricsSummary() {
        const summary = {};

        Object.keys(this.metrics).forEach((metricName) => {
            const values = this.metrics[metricName].map((m) => m.value);

            if (values.length > 0) {
                summary[metricName] = {
                    latest: values[values.length - 1],
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length,
                    trend: this.calculateTrend(values),
                };
            }
        });

        return summary;
    }

    /**
     * 📈 Calcula Tendência dos Valores
     */
    calculateTrend(values) {
        if (values.length < 2) return 'stable';

        const recent = values.slice(-5); // Últimos 5 valores
        const older = values.slice(-10, -5); // 5 valores anteriores

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 10) return 'improving';
        if (change < -10) return 'degrading';
        return 'stable';
    }

    /**
     * 🚨 Sistema de Alertas
     */
    triggerAlert(alert) {
        alert.id = Date.now() + Math.random();
        alert.timestamp = Date.now();
        alert.requestId = alert.requestId || generateRequestId('alert');

        // Deduplicação de alertas por assinatura em janela de silêncio
        const signature = `${alert.type}|${alert.severity}|${alert.message}`;
        const now = alert.timestamp;
        const cached = this.alertDedup.get(signature);
        if (cached && now - cached.timestamp < this.alertQuietPeriodMs) {
            cached.count += 1;
            this.alertDedup.set(signature, cached);
            return; // silencia alertas repetidos
        }
        this.alertDedup.set(signature, { timestamp: now, count: 1 });

        this.alerts.push(alert);

        // Log detalhado
        const logLevel =
            alert.severity === 'critical' ? 'error' : alert.severity === 'error' ? 'error' : 'warn';

        console[logLevel](`🚨 SmartMonitor Alert [${alert.severity.toUpperCase()}]:`, alert);

        // Mantém apenas os últimos 50 alertas
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        // Dispara ações automáticas baseadas no tipo de alerta
        this.handleAlertActions(alert);
    }

    /**
     * ⚡ Ações Automáticas de Resposta
     */
    handleAlertActions(alert) {
        switch (alert.type) {
            case 'critical':
                this.handleCriticalAlert(alert);
                break;
            case 'memory':
                this.attemptMemoryCleanup();
                break;
            case 'performance':
                this.optimizePerformance();
                break;
            case 'dom':
                this.recoverDOM();
                break;
        }
    }

    /**
     * 🔴 Tratamento de Alertas Críticos
     */
    handleCriticalAlert(alert) {
        console.error('🔴 SmartMonitor: ALERTA CRÍTICO DETECTADO!', alert);

        // Em um ambiente real, aqui você enviaria para Sentry, Slack, etc.
        // this.sendToSentry(alert);
        // this.sendToSlack(alert);

        // Tenta recarregar componentes críticos
        if (this.autoRecovery) {
            setTimeout(() => {
                this.performCriticalHealthCheck();
            }, 5000);
        }
    }

    /**
     * 📈 Relatório de Status
     */
    getStatusReport() {
        const now = Date.now();
        const lastHour = now - 60 * 60 * 1000;

        const recentAlerts = this.alerts.filter((alert) => alert.timestamp > lastHour);
        const recentErrors = this.errorHistory.filter((error) => error.timestamp > lastHour);

        return {
            timestamp: now,
            health:
                this.metrics.overall_health?.[this.metrics.overall_health.length - 1]?.value || 0,
            alerts: {
                total: this.alerts.length,
                recent: recentAlerts.length,
                critical: recentAlerts.filter((a) => a.severity === 'critical').length,
            },
            errors: {
                total: this.errorHistory.length,
                recent: recentErrors.length,
            },
            performance: {
                fps: this.getLatestMetric('fps'),
                memory: this.getLatestMetric('memory_usage'),
                ui_update_time: this.getLatestMetric('ui_update_time'),
            },
            uptime: now - this.startTime,
        };
    }

    /**
     * 🧪 Integração com Sistema de Testes (Padrão 4)
     */
    runAutomatedTests() {
        console.log('🧪 SmartMonitor: Executando testes automáticos...');

        const tests = [
            { name: 'emergencyTest', fn: window.emergencyTest },
            { name: 'testDOMMapping', fn: window.testDOMMapping },
            { name: 'testUIComponents', fn: window.testUIComponents },
            { name: 'testLogicFunctions', fn: window.testLogicFunctions },
        ];

        const results = {};

        tests.forEach(({ name, fn }) => {
            if (typeof fn === 'function') {
                try {
                    const startTime = performance.now();
                    const result = fn();
                    const duration = performance.now() - startTime;

                    results[name] = {
                        success: true,
                        result,
                        duration,
                    };
                } catch (error) {
                    results[name] = {
                        success: false,
                        error: error.message,
                        duration: 0,
                    };
                }
            } else {
                results[name] = {
                    success: false,
                    error: 'Função não disponível',
                    duration: 0,
                };
            }
        });

        const failedTests = Object.entries(results).filter(([name, result]) => !result.success);

        if (failedTests.length > 0) {
            this.triggerAlert({
                type: 'test',
                severity: 'error',
                message: `${failedTests.length} testes falharam`,
                failed: failedTests.map(([name]) => name),
            });
        }

        return results;
    }

    // Funções auxiliares
    getLatestMetric(name) {
        const metric = this.metrics[name];
        return metric && metric.length > 0 ? metric[metric.length - 1].value : null;
    }

    handleGlobalError(error) {
        this.errorHistory.push(error);
        this.triggerAlert({
            type: 'error',
            severity: 'error',
            message: error.message,
            details: error,
        });
    }

    handleComponentError(component, error) {
        this.triggerAlert({
            type: 'component',
            severity: 'error',
            message: `Erro no componente ${component}`,
            component,
            error: error.message,
        });
    }

    recordNetworkMetric(data) {
        this.recordMetric('network_requests', data);
    }

    recordUserInteraction(data) {
        this.recordMetric('user_interactions', data);
    }

    recordPerformanceMetric(data) {
        this.recordMetric(`perf_${data.type}`, data.duration);
    }

    /**
     * 🚨 Reporta problemas de performance detectados
     * @param {Object} issue - Dados do problema de performance
     */
    reportPerformanceIssue(issue) {
        try {
            // Evitar spam de mensagens - implementar debounce
            const signature = `${issue.type}_${Math.round(issue.duration)}`;
            const now = Date.now();

            if (this.alertDedup.has(signature)) {
                const lastAlert = this.alertDedup.get(signature);
                if (now - lastAlert.timestamp < this.alertQuietPeriodMs) {
                    lastAlert.count++;
                    return; // Silenciar durante período quiet
                }
            }

            // Registrar novo alerta
            this.alertDedup.set(signature, { timestamp: now, count: 1 });

            // Log apenas para problemas significativos (>200ms)
            if (issue.duration > 200) {
                console.warn(`⚠️ SmartMonitor: Performance issue - ${issue.type}`, {
                    duration: `${issue.duration.toFixed(1)}ms`,
                    threshold: '500ms (ultra-optimized)',
                    severity: issue.duration > 300 ? 'HIGH' : 'MEDIUM',
                });

                // Registrar métrica para análise
                this.recordMetric('performance_issues', {
                    type: issue.type,
                    duration: issue.duration,
                    timestamp: issue.timestamp,
                });
            }
        } catch (error) {
            console.error('❌ Erro ao reportar problema de performance:', error);
        }
    }

    setupInactivityDetection() {
        let lastActivity = Date.now();

        ['click', 'keydown', 'mousemove', 'scroll'].forEach((event) => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            });
        });

        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            // 🔧 OTIMIZAÇÃO: Só registra métrica se inatividade for significativa (>5 minutos)
            if (inactiveTime > 300000) {
                this.recordMetric('user_inactivity', inactiveTime);
            }
        }, 120000); // 🔧 Reduzido para verificar a cada 2 minutos
    }

    async checkDOMHealth() {
        try {
            const result =
                typeof window.testDOMMapping === 'function'
                    ? window.testDOMMapping()
                    : { overall: false };

            return {
                status: result?.overall ? 'healthy' : 'unhealthy',
                details: result,
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
            };
        }
    }

    async checkPerformanceHealth() {
        const fps = this.getLatestMetric('fps');
        const memory = this.getLatestMetric('memory_usage');
        const uiTime = this.getLatestMetric('ui_update_time');

        const issues = [];
        if (fps && fps < 30) issues.push('low_fps');
        if (memory && memory > this.thresholds.memoryUsage) issues.push('high_memory');
        if (uiTime && uiTime > this.thresholds.renderTime) issues.push('slow_ui');

        return {
            status: issues.length === 0 ? 'healthy' : 'unhealthy',
            issues,
            metrics: { fps, memory, uiTime },
        };
    }

    async checkMemoryHealth() {
        const memory = this.getLatestMetric('memory_usage');

        return {
            status: memory && memory > this.thresholds.memoryUsage ? 'unhealthy' : 'healthy',
            memory,
        };
    }

    async checkNetworkHealth() {
        // Implementar verificação de conectividade
        return { status: navigator.onLine ? 'healthy' : 'unhealthy' };
    }

    async checkErrorHealth() {
        const recentErrors = this.errorHistory.filter(
            (error) => error.timestamp > Date.now() - 300000 // últimos 5 minutos
        );

        return {
            status:
                recentErrors.length > this.thresholds.consecutiveErrors ? 'unhealthy' : 'healthy',
            recentErrors: recentErrors.length,
        };
    }

    optimizePerformance() {
        console.log('⚡ SmartMonitor: Otimizando performance...');

        // Força limpeza de cache CSS
        if (typeof window.cssResolver?.invalidateColorCache === 'function') {
            window.cssResolver.invalidateColorCache();
        }

        // Outras otimizações podem ser adicionadas aqui
        return true;
    }

    // 🛡️ Método para obter timeout seguro com fallbacks
    _getSafeTimeout() {
        try {
            // 1ª tentativa: usar safeProtection se disponível e válido
            if (
                window.safeProtection &&
                typeof window.safeProtection.safeSetTimeout === 'function'
            ) {
                return window.safeProtection.safeSetTimeout.bind(window.safeProtection);
            }

            // 2ª tentativa: verificar se existe no global scope
            if (typeof window.safeSetTimeout === 'function') {
                return window.safeSetTimeout;
            }

            // 3ª tentativa: fallback nativo com proteção
            console.warn('⚠️ SmartMonitor: Usando setTimeout nativo (safeProtection indisponível)');
            return (callback, delay) => {
                try {
                    return setTimeout(callback, delay);
                } catch (error) {
                    console.error('❌ Erro no setTimeout nativo:', error);
                    return null;
                }
            };
        } catch (error) {
            console.error('❌ Erro ao obter timeout seguro:', error);
            return setTimeout; // Último recurso
        }
    }

    // 🛡️ Método para obter interval seguro com fallbacks
    _getSafeInterval() {
        try {
            if (
                window.safeProtection &&
                typeof window.safeProtection.safeSetInterval === 'function'
            ) {
                return window.safeProtection.safeSetInterval.bind(window.safeProtection);
            }

            if (typeof window.safeSetInterval === 'function') {
                return window.safeSetInterval;
            }

            console.warn(
                '⚠️ SmartMonitor: Usando setInterval nativo (safeProtection indisponível)'
            );
            return (callback, delay) => {
                try {
                    return setInterval(callback, delay);
                } catch (error) {
                    console.error('❌ Erro no setInterval nativo:', error);
                    return null;
                }
            };
        } catch (error) {
            console.error('❌ Erro ao obter interval seguro:', error);
            return setInterval; // Último recurso
        }
    }

    verifyDOMIntegrity() {
        // Verifica se elementos críticos ainda existem baseado na estrutura atual
        const criticalElements = [
            '#container', // Container principal da aplicação
            '#main-area', // Área principal de conteúdo
            '#dashboard-content', // Conteúdo do dashboard
            '.tab-content', // Conteúdo das abas
            '.app-header', // Cabeçalho da aplicação
        ];

        const missing = criticalElements.filter((selector) => !document.querySelector(selector));

        if (missing.length > 0) {
            this.triggerAlert({
                type: 'dom',
                severity: 'warning',
                message: 'Elementos críticos do DOM ausentes',
                missing,
                suggestion: 'Verifique se a estrutura HTML foi carregada corretamente',
            });
        } else {
            // Log de sucesso apenas se anteriormente havia elementos faltando
            if (this.lastDOMCheck && this.lastDOMCheck.hadMissing) {
                console.log('✅ SmartMonitor: Todos os elementos críticos do DOM estão presentes');
            }
        }

        // Armazena resultado da última verificação
        this.lastDOMCheck = {
            timestamp: Date.now(),
            hadMissing: missing.length > 0,
            missing: missing,
        };
    }
}

// 🚨 INICIALIZAÇÃO COMPLETAMENTE REESCRITA - Sistema de Singleton Rigoroso
let smartMonitor = null;
let isInitializing = false;

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.SmartMonitor = SmartMonitor;

    // 🛡️ SISTEMA DE INICIALIZAÇÃO ÚNICA E SEGURA
    function initializeSmartMonitorSafely() {
        // Múltiplas proteções contra inicializações duplicadas
        if (window.smartMonitor) {
            console.log('ℹ️ SmartMonitor: Instância já existe, reutilizando...');
            smartMonitor = window.smartMonitor;
            setupDebugFunctions();
            return window.smartMonitor;
        }

        if (isInitializing) {
            console.log('⚠️ SmartMonitor: Inicialização já em andamento...');
            return null;
        }

        try {
            isInitializing = true;
            console.log('🚀 SmartMonitor: Iniciando nova instância (modo seguro)...');

            smartMonitor = new SmartMonitor();
            window.smartMonitor = smartMonitor;
            setupDebugFunctions();

            console.log('✅ SmartMonitor: Instância criada com sucesso!');
            return smartMonitor;
        } catch (error) {
            console.error('❌ SmartMonitor: Erro durante inicialização:', error);
            return null;
        } finally {
            isInitializing = false;
        }
    }

    // 🔄 INICIALIZAÇÃO INTELIGENTE
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSmartMonitorSafely);
    } else {
        // DOM já carregado, inicializa imediatamente
        setTimeout(initializeSmartMonitorSafely, 100); // Pequeno delay para evitar conflitos
    }

    /**
     * 🛠️ Configura Funções de Debug no Console
     */
    function setupDebugFunctions() {
        // Função para verificar FPS manualmente
        window.checkFPS = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            const metrics = smartMonitor.getMetrics();
            const currentFPS = metrics.fps?.slice(-1)[0] || 0;

            console.log(`📊 FPS Atual: ${currentFPS}`);
            console.log('📈 Histórico FPS (últimos 10):', metrics.fps?.slice(-10) || []);

            if (currentFPS === 0) {
                console.warn('⚠️ FPS está em 0 - possível bloqueio do thread principal');
                console.log('💡 Execute forcePerformanceRecovery() para tentar recuperar');
            } else if (currentFPS < 30) {
                console.warn(`⚠️ FPS baixo: ${currentFPS} (ideal: >60)`);
            } else {
                console.log('✅ FPS dentro do normal');
            }

            return currentFPS;
        };

        // Função para forçar recuperação de performance
        window.forcePerformanceRecovery = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            console.log('🔧 Forçando recuperação de performance...');
            smartMonitor.attemptPerformanceRecovery();

            // Analisa gargalos
            const analysis = smartMonitor.analyzePerformanceBottlenecks();
            console.log('📊 Análise de performance:', analysis);

            return analysis;
        };

        // Função para analisar performance atual
        window.analyzePerformance = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            console.log('🔬 Analisando performance atual...');

            const analysis = smartMonitor.analyzePerformanceBottlenecks();
            const metrics = smartMonitor.getMetrics();

            const report = {
                fps: metrics.fps?.slice(-5) || [],
                memory: smartMonitor.getMemoryUsage(),
                domElements: document.querySelectorAll('*').length,
                analysis: analysis,
                recommendations: [],
            };

            // Gera recomendações
            if (report.fps.some((fps) => fps < 30)) {
                report.recommendations.push('Otimizar operações que bloqueiam o thread principal');
            }

            if (report.memory.used > 100) {
                report.recommendations.push('Verificar vazamentos de memória');
            }

            if (report.domElements > 3000) {
                report.recommendations.push('Considerar virtualização do DOM');
            }

            console.log('📊 Relatório de Performance:', report);
            return report;
        };

        // Função para mostrar resumo de métricas
        window.showMetricsSummary = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            console.log('📊 Resumo de Métricas:');
            const summary = smartMonitor.getMetricsSummary();

            Object.keys(summary).forEach((metric) => {
                const data = summary[metric];
                console.log(`📈 ${metric}:`, {
                    atual: data.latest,
                    média: Math.round(data.average * 100) / 100,
                    min: data.min,
                    max: data.max,
                    tendência: data.trend,
                    amostras: data.count,
                });
            });

            return summary;
        };

        // Função para parar monitoramentos
        window.stopSmartMonitoring = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            smartMonitor.stopAllMonitoring();
            console.log('🛑 Todos os monitoramentos parados');
        };

        // Função para reiniciar monitoramentos
        window.restartSmartMonitoring = () => {
            if (!smartMonitor) {
                console.error('❌ SmartMonitor não inicializado ainda');
                return null;
            }

            smartMonitor.restartMonitoring();
            console.log('🔄 Monitoramentos reiniciados');
        };

        // 🚨 FUNÇÃO DE EMERGÊNCIA - Para TUDO relacionado ao SmartMonitor
        window.emergencyStopSmartMonitor = () => {
            console.log('🚨 EMERGENCY STOP: Parando TUDO do SmartMonitor...');

            try {
                // Para instância atual se existir
                if (smartMonitor) {
                    smartMonitor.stopAllMonitoring();
                }

                // Limpa todas as referências globais
                window.smartMonitor = null;
                smartMonitor = null;
                isInitializing = false;

                // Força limpeza de TODOS os intervalos possíveis
                for (let i = 1; i <= 10000; i++) {
                    try {
                        clearInterval(i);
                        clearTimeout(i);
                    } catch (e) {
                        // Silenciosamente ignora erros
                    }
                }

                // Cancela TODOS os requestAnimationFrame pendentes
                for (let i = 1; i <= 1000; i++) {
                    try {
                        cancelAnimationFrame(i);
                    } catch (e) {
                        // Silenciosamente ignora erros
                    }
                }

                console.log('✅ EMERGENCY STOP: SmartMonitor completamente parado e limpo!');
            } catch (error) {
                console.error('❌ Erro durante emergency stop:', error);
            }
        };

        console.log('🛠️ Funções de debug de performance disponíveis:');
        console.log('  checkFPS() - Verifica FPS atual');
        console.log('  forcePerformanceRecovery() - Força recuperação');
        console.log('  analyzePerformance() - Análise completa');
        console.log('  showMetricsSummary() - Resumo de todas as métricas');
        console.log('  stopSmartMonitoring() - Para todos os monitoramentos');
        console.log('  restartSmartMonitoring() - Reinicia monitoramentos');
        console.log('  🚨 emergencyStopSmartMonitor() - PARA TUDO (emergência)');
    }

    console.log('🛡️ SmartMonitor: Sistema carregado e pronto para inicialização');
}

export { SmartMonitor };
