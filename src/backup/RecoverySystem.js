/**
 * Sistema de Recuperação Automática
 * Detecta falhas e executa estratégias de recuperação
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';
import backupManager from './BackupManager.js';
import configurationVersioning from './ConfigurationVersioning.js';

class RecoverySystem {
    constructor() {
        this.config = {
            enableAutoRecovery: true,
            recoveryTimeout: 30000, // 30 segundos
            maxRecoveryAttempts: 3,
            healthCheckInterval: 60000, // 1 minuto
            criticalErrorThreshold: 5,
            performanceThreshold: {
                memory: 500, // MB
                fps: 30,
                responseTime: 5000, // ms
            },
        };

        this.recoveryStrategies = new Map();
        this.recoveryHistory = [];
        this.isRecoveryInProgress = false;
        this.systemHealth = {
            status: 'healthy',
            lastCheck: null,
            issues: [],
        };

        this._initializeRecoverySystem();
    }

    /**
     * Inicializa o sistema de recuperação
     */
    async _initializeRecoverySystem() {
        try {
            this._registerDefaultStrategies();
            this._setupHealthMonitoring();
            this._setupErrorHandling();
            this._setupPerformanceMonitoring();

            if (this.config.enableAutoRecovery) {
                this._startHealthChecks();
            }

            structuredLogger.info('Recovery system initialized', {
                autoRecovery: this.config.enableAutoRecovery,
                strategies: this.recoveryStrategies.size,
                healthCheckInterval: this.config.healthCheckInterval,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'recovery_system_init',
                severity: 'high',
            });
        }
    }

    /**
     * Executa recuperação automática baseada no contexto do erro
     */
    async performRecovery(errorContext = {}) {
        if (this.isRecoveryInProgress) {
            structuredLogger.warn('Recovery already in progress, queuing request');
            return { success: false, reason: 'recovery_in_progress' };
        }

        this.isRecoveryInProgress = true;
        const recoveryId = this._generateRecoveryId();
        const startTime = Date.now();

        try {
            structuredLogger.info('Starting recovery process', {
                recoveryId,
                errorContext,
            });

            // Analisar o contexto do erro para determinar estratégia
            const strategy = this._selectRecoveryStrategy(errorContext);

            if (!strategy) {
                throw new Error('No suitable recovery strategy found');
            }

            // Executar estratégia de recuperação
            const result = await this._executeRecoveryStrategy(strategy, errorContext);

            // Registrar resultado
            const recoveryRecord = {
                id: recoveryId,
                timestamp: Date.now(),
                duration: Date.now() - startTime,
                strategy: strategy.name,
                errorContext,
                result,
                success: result.success,
            };

            this.recoveryHistory.push(recoveryRecord);

            if (result.success) {
                structuredLogger.info('Recovery completed successfully', {
                    recoveryId,
                    strategy: strategy.name,
                    duration: recoveryRecord.duration,
                });

                // Verificar saúde do sistema após recuperação
                setTimeout(() => {
                    this._performHealthCheck();
                }, 5000);
            } else {
                structuredLogger.error('Recovery failed', {
                    recoveryId,
                    strategy: strategy.name,
                    error: result.error,
                });
            }

            return result;
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'recovery_execution',
                recoveryId,
                severity: 'critical',
            });

            return { success: false, error: error.message };
        } finally {
            this.isRecoveryInProgress = false;
        }
    }

    /**
     * Registra uma nova estratégia de recuperação
     */
    registerRecoveryStrategy(name, strategy) {
        if (!strategy.condition || !strategy.execute) {
            throw new Error('Strategy must have condition and execute functions');
        }

        this.recoveryStrategies.set(name, {
            name,
            condition: strategy.condition,
            execute: strategy.execute,
            priority: strategy.priority || 5,
            timeout: strategy.timeout || this.config.recoveryTimeout,
            description: strategy.description || name,
        });

        structuredLogger.info('Recovery strategy registered', {
            name,
            priority: strategy.priority,
            description: strategy.description,
        });
    }

    /**
     * Executa verificação de saúde do sistema
     */
    async performHealthCheck() {
        try {
            const healthData = await this._collectHealthData();
            const issues = this._analyzeHealthData(healthData);

            this.systemHealth = {
                status:
                    issues.length === 0
                        ? 'healthy'
                        : issues.some((i) => i.severity === 'critical')
                          ? 'critical'
                          : issues.some((i) => i.severity === 'high')
                            ? 'degraded'
                            : 'warning',
                lastCheck: Date.now(),
                issues,
                data: healthData,
            };

            // Disparar recuperação automática se necessário
            if (this.config.enableAutoRecovery && issues.length > 0) {
                const criticalIssues = issues.filter((i) => i.severity === 'critical');
                if (criticalIssues.length > 0) {
                    await this.performRecovery({
                        type: 'health_check',
                        issues: criticalIssues,
                        timestamp: Date.now(),
                    });
                }
            }

            structuredLogger.debug('Health check completed', {
                status: this.systemHealth.status,
                issues: issues.length,
            });

            return this.systemHealth;
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'health_check',
                severity: 'medium',
            });

            this.systemHealth.status = 'unknown';
            return this.systemHealth;
        }
    }

    /**
     * Força recuperação de emergência
     */
    async forceEmergencyRecovery() {
        structuredLogger.warn('Emergency recovery initiated');

        return await this.performRecovery({
            type: 'emergency',
            forced: true,
            timestamp: Date.now(),
        });
    }

    /**
     * Obtém estatísticas do sistema de recuperação
     */
    getRecoveryStats() {
        const totalRecoveries = this.recoveryHistory.length;
        const successfulRecoveries = this.recoveryHistory.filter((r) => r.success).length;
        const failedRecoveries = totalRecoveries - successfulRecoveries;
        const successRate =
            totalRecoveries > 0 ? (successfulRecoveries / totalRecoveries) * 100 : 0;

        const averageDuration =
            totalRecoveries > 0
                ? this.recoveryHistory.reduce((sum, r) => sum + r.duration, 0) / totalRecoveries
                : 0;

        const strategiesUsed = [...new Set(this.recoveryHistory.map((r) => r.strategy))];

        return {
            totalRecoveries,
            successfulRecoveries,
            failedRecoveries,
            successRate,
            averageDuration,
            strategiesUsed,
            systemHealth: this.systemHealth,
            autoRecoveryEnabled: this.config.enableAutoRecovery,
            lastRecovery:
                totalRecoveries > 0 ? this.recoveryHistory[this.recoveryHistory.length - 1] : null,
        };
    }

    // Métodos privados
    _registerDefaultStrategies() {
        // Estratégia 1: Recarregar página
        this.registerRecoveryStrategy('page_reload', {
            condition: (context) => {
                return (
                    context.type === 'critical_error' ||
                    context.type === 'memory_leak' ||
                    (context.issues && context.issues.some((i) => i.type === 'memory_high'))
                );
            },
            execute: async () => {
                structuredLogger.info('Executing page reload recovery');

                // Salvar estado antes de recarregar
                await backupManager.performIncrementalBackup();

                // Recarregar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

                return { success: true, action: 'page_reload' };
            },
            priority: 1,
            description: 'Recarrega a página para limpar estado corrompido',
        });

        // Estratégia 2: Restaurar backup
        this.registerRecoveryStrategy('restore_backup', {
            condition: (context) => {
                return context.type === 'data_corruption' || context.type === 'configuration_error';
            },
            execute: async (context) => {
                structuredLogger.info('Executing backup restore recovery');

                const backupStats = backupManager.getBackupStats();
                if (backupStats.totalBackups === 0) {
                    return { success: false, reason: 'no_backups_available' };
                }

                // Restaurar último backup
                const lastBackup =
                    backupManager.backupHistory[backupManager.backupHistory.length - 1];
                const result = await backupManager.restoreFromBackup(lastBackup.id);

                return result;
            },
            priority: 2,
            description: 'Restaura dados do último backup válido',
        });

        // Estratégia 3: Rollback de configuração
        this.registerRecoveryStrategy('config_rollback', {
            condition: (context) => {
                return (
                    context.type === 'configuration_error' || context.type === 'settings_corruption'
                );
            },
            execute: async () => {
                structuredLogger.info('Executing configuration rollback recovery');

                const versions = configurationVersioning.listVersions({ limit: 5 });
                if (versions.length < 2) {
                    return { success: false, reason: 'no_previous_config' };
                }

                // Rollback para versão anterior
                const previousVersion = versions[1]; // Segunda versão (primeira é atual)
                const result = await configurationVersioning.restoreVersion(previousVersion.id);

                return result;
            },
            priority: 3,
            description: 'Reverte configuração para versão anterior',
        });

        // Estratégia 4: Limpeza de cache
        this.registerRecoveryStrategy('cache_cleanup', {
            condition: (context) => {
                return (
                    context.type === 'performance_degradation' ||
                    (context.issues && context.issues.some((i) => i.type === 'memory_high'))
                );
            },
            execute: async () => {
                structuredLogger.info('Executing cache cleanup recovery');

                try {
                    // Limpar localStorage desnecessário
                    const keysToRemove = [];
                    for (let key in localStorage) {
                        if (
                            key.startsWith('temp_') ||
                            key.startsWith('cache_') ||
                            key.includes('_old_')
                        ) {
                            keysToRemove.push(key);
                        }
                    }

                    keysToRemove.forEach((key) => {
                        localStorage.removeItem(key);
                    });

                    // Limpar sessionStorage
                    const sessionKeysToRemove = [];
                    for (let key in sessionStorage) {
                        if (key.startsWith('temp_') || key.startsWith('cache_')) {
                            sessionKeysToRemove.push(key);
                        }
                    }

                    sessionKeysToRemove.forEach((key) => {
                        sessionStorage.removeItem(key);
                    });

                    // Forçar garbage collection se disponível
                    if (window.gc) {
                        window.gc();
                    }

                    return {
                        success: true,
                        action: 'cache_cleanup',
                        removedKeys: keysToRemove.length + sessionKeysToRemove.length,
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            priority: 4,
            description: 'Limpa cache e dados temporários',
        });

        // Estratégia 5: Reset de módulos
        this.registerRecoveryStrategy('module_reset', {
            condition: (context) => {
                return context.type === 'module_error' || context.type === 'component_failure';
            },
            execute: async (context) => {
                structuredLogger.info('Executing module reset recovery');

                try {
                    // Reinicializar módulos críticos
                    if (window.monitoringSystem && !window.monitoringSystem.initialized) {
                        await window.monitoringSystem.initialize();
                    }

                    if (window.healthDashboard) {
                        window.healthDashboard.refresh();
                    }

                    if (window.charts) {
                        window.charts.init();
                    }

                    return { success: true, action: 'module_reset' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            priority: 5,
            description: 'Reinicializa módulos do sistema',
        });
    }

    _selectRecoveryStrategy(errorContext) {
        // Obter estratégias aplicáveis
        const applicableStrategies = [];

        for (const [name, strategy] of this.recoveryStrategies) {
            try {
                if (strategy.condition(errorContext)) {
                    applicableStrategies.push(strategy);
                }
            } catch (error) {
                structuredLogger.warn('Error evaluating strategy condition', {
                    strategy: name,
                    error: error.message,
                });
            }
        }

        if (applicableStrategies.length === 0) {
            return null;
        }

        // Ordenar por prioridade (menor número = maior prioridade)
        applicableStrategies.sort((a, b) => a.priority - b.priority);

        return applicableStrategies[0];
    }

    async _executeRecoveryStrategy(strategy, errorContext) {
        const timeout = strategy.timeout || this.config.recoveryTimeout;

        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({
                    success: false,
                    error: 'Recovery strategy timeout',
                    timeout: true,
                });
            }, timeout);

            try {
                const result = await strategy.execute(errorContext);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    error: error.message,
                    exception: true,
                });
            }
        });
    }

    async _collectHealthData() {
        const healthData = {
            timestamp: Date.now(),
            memory: this._getMemoryUsage(),
            performance: this._getPerformanceMetrics(),
            errors: this._getErrorStats(),
            modules: this._getModuleStatus(),
            storage: this._getStorageUsage(),
        };

        return healthData;
    }

    _analyzeHealthData(healthData) {
        const issues = [];

        // Verificar memória
        if (healthData.memory.used > this.config.performanceThreshold.memory) {
            issues.push({
                type: 'memory_high',
                severity:
                    healthData.memory.used > this.config.performanceThreshold.memory * 1.5
                        ? 'critical'
                        : 'high',
                message: `High memory usage: ${healthData.memory.used}MB`,
                value: healthData.memory.used,
                threshold: this.config.performanceThreshold.memory,
            });
        }

        // Verificar performance
        if (healthData.performance.fps < this.config.performanceThreshold.fps) {
            issues.push({
                type: 'performance_low',
                severity: healthData.performance.fps < 20 ? 'critical' : 'medium',
                message: `Low FPS: ${healthData.performance.fps}`,
                value: healthData.performance.fps,
                threshold: this.config.performanceThreshold.fps,
            });
        }

        // Verificar erros
        if (healthData.errors.recent > this.config.criticalErrorThreshold) {
            issues.push({
                type: 'error_rate_high',
                severity: 'high',
                message: `High error rate: ${healthData.errors.recent} errors`,
                value: healthData.errors.recent,
                threshold: this.config.criticalErrorThreshold,
            });
        }

        // Verificar módulos
        const failedModules = Object.entries(healthData.modules)
            .filter(([name, status]) => !status)
            .map(([name]) => name);

        if (failedModules.length > 0) {
            issues.push({
                type: 'module_failure',
                severity: 'high',
                message: `Failed modules: ${failedModules.join(', ')}`,
                value: failedModules,
                threshold: 0,
            });
        }

        return issues;
    }

    _getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
            };
        }

        return { used: 0, total: 0, limit: 0 };
    }

    _getPerformanceMetrics() {
        return {
            fps: window.realtimeMetrics?.getCurrentValue('performance.fps') || 60,
            loadTime: window.realtimeMetrics?.getCurrentValue('performance.page.load_time') || 0,
            responseTime: performance.now(),
        };
    }

    _getErrorStats() {
        if (window.errorTracker) {
            const stats = window.errorTracker.getErrorStats({
                since: Date.now() - 5 * 60 * 1000, // Últimos 5 minutos
            });
            return {
                recent: stats.total,
                critical: stats.bySeverity.critical || 0,
                high: stats.bySeverity.high || 0,
            };
        }

        return { recent: 0, critical: 0, high: 0 };
    }

    _getModuleStatus() {
        return {
            monitoringSystem: !!window.monitoringSystem?.initialized,
            healthDashboard: !!window.healthDashboard,
            backupManager: !!window.backupManager,
            sessionStore: !!window.sessionStore,
            charts: !!window.charts,
            errorTracker: !!window.errorTracker,
            realtimeMetrics: !!window.realtimeMetrics,
        };
    }

    _getStorageUsage() {
        let localStorageSize = 0;
        let sessionStorageSize = 0;

        try {
            for (let key in localStorage) {
                localStorageSize += localStorage.getItem(key).length;
            }
        } catch (error) {
            // Ignorar erros de acesso
        }

        try {
            for (let key in sessionStorage) {
                sessionStorageSize += sessionStorage.getItem(key).length;
            }
        } catch (error) {
            // Ignorar erros de acesso
        }

        return {
            localStorage: localStorageSize,
            sessionStorage: sessionStorageSize,
            total: localStorageSize + sessionStorageSize,
        };
    }

    _setupHealthMonitoring() {
        // Monitorar erros não tratados
        window.addEventListener('error', (event) => {
            this._handleCriticalError({
                type: 'unhandled_error',
                error: event.error,
                filename: event.filename,
                lineno: event.lineno,
                timestamp: Date.now(),
            });
        });

        // Monitorar promises rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            this._handleCriticalError({
                type: 'unhandled_promise_rejection',
                reason: event.reason,
                timestamp: Date.now(),
            });
        });
    }

    _setupErrorHandling() {
        // Interceptar console.error para detectar erros críticos
        const originalError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            if (message.includes('critical') || message.includes('fatal')) {
                this._handleCriticalError({
                    type: 'console_error',
                    message,
                    timestamp: Date.now(),
                });
            }
            originalError.apply(console, args);
        };
    }

    _setupPerformanceMonitoring() {
        // Monitorar performance periodicamente
        setInterval(() => {
            const memory = this._getMemoryUsage();
            if (memory.used > this.config.performanceThreshold.memory) {
                this._handlePerformanceIssue({
                    type: 'memory_high',
                    value: memory.used,
                    threshold: this.config.performanceThreshold.memory,
                    timestamp: Date.now(),
                });
            }
        }, 30000); // A cada 30 segundos
    }

    async _handleCriticalError(errorContext) {
        if (this.config.enableAutoRecovery) {
            await this.performRecovery(errorContext);
        }
    }

    async _handlePerformanceIssue(issueContext) {
        if (this.config.enableAutoRecovery) {
            await this.performRecovery({
                type: 'performance_degradation',
                issue: issueContext,
                timestamp: Date.now(),
            });
        }
    }

    _startHealthChecks() {
        // Verificação inicial
        setTimeout(() => {
            this.performHealthCheck();
        }, 5000);

        // Verificações periódicas
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);

        structuredLogger.info('Health checks started', {
            interval: this.config.healthCheckInterval,
        });
    }

    async _performHealthCheck() {
        return await this.performHealthCheck();
    }

    _generateRecoveryId() {
        return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Instância global
const recoverySystem = new RecoverySystem();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.recoverySystem = recoverySystem;
}

export default recoverySystem;
