/**
 * Sistema de Monitoramento Integrado
 * Coordena todos os subsistemas de monitoramento e observabilidade
 */

import structuredLogger from './StructuredLogger.js';
import errorTracker from './ErrorTracker.js';
import realtimeMetrics from './RealtimeMetrics.js';
import usageAnalytics from './UsageAnalytics.js';
import criticalAlerts from './CriticalAlerts.js';
import healthDashboard from './HealthDashboard.js';
import observabilityIntegration from './ObservabilityIntegration.js';

class MonitoringSystem {
    constructor() {
        this.initialized = false;
        this.subsystems = new Map();
        this.config = {
            enableAll: true,
            enableDashboard: true,
            enableIntegrations: true,
            autoStart: true,
            healthCheckInterval: 30000, // 30 segundos
            emergencyMode: false,
        };

        this.systemStatus = {
            INITIALIZING: 'initializing',
            RUNNING: 'running',
            DEGRADED: 'degraded',
            EMERGENCY: 'emergency',
            STOPPED: 'stopped',
        };

        this.currentStatus = this.systemStatus.INITIALIZING;
        this._registerSubsystems();
    }

    /**
     * Inicializa todo o sistema de monitoramento
     * @param {Object} options - Opções de inicialização
     */
    async initialize(options = {}) {
        if (this.initialized) {
            structuredLogger.warn('Monitoring system already initialized');
            return;
        }

        this.config = { ...this.config, ...options };

        try {
            structuredLogger.info('Initializing monitoring system...', {
                subsystems: Array.from(this.subsystems.keys()),
                config: this.config,
            });

            // Inicializar subsistemas em ordem
            await this._initializeSubsystems();

            // Configurar integrações se habilitadas
            if (this.config.enableIntegrations) {
                await this._setupIntegrations();
            }

            // Inicializar dashboard se habilitado
            if (this.config.enableDashboard) {
                await this._initializeDashboard();
            }

            // Configurar health checks
            this._setupHealthChecks();

            // Configurar handlers de emergência
            this._setupEmergencyHandlers();

            this.initialized = true;
            this.currentStatus = this.systemStatus.RUNNING;

            structuredLogger.info('Monitoring system initialized successfully', {
                status: this.currentStatus,
                subsystems: this._getSubsystemStatus(),
            });

            // Disparar evento de inicialização
            this._dispatchSystemEvent('initialized');
        } catch (error) {
            this.currentStatus = this.systemStatus.DEGRADED;
            structuredLogger.error('Failed to initialize monitoring system', error);
            throw error;
        }
    }

    /**
     * Inicia todos os subsistemas
     */
    start() {
        if (!this.initialized) {
            throw new Error('System not initialized. Call initialize() first.');
        }

        structuredLogger.info('Starting monitoring system...');

        // Iniciar coleta de métricas
        if (realtimeMetrics) {
            realtimeMetrics.registerCollector(
                'system_health',
                () => {
                    return this.getSystemHealth();
                },
                10000
            );
        }

        // Iniciar dashboard se configurado
        if (this.config.enableDashboard && healthDashboard) {
            healthDashboard.startAutoRefresh();
        }

        this.currentStatus = this.systemStatus.RUNNING;
        this._dispatchSystemEvent('started');

        structuredLogger.info('Monitoring system started');
    }

    /**
     * Para todos os subsistemas
     */
    stop() {
        structuredLogger.info('Stopping monitoring system...');

        // Parar dashboard
        if (healthDashboard) {
            healthDashboard.stopAutoRefresh();
        }

        // Parar integrações
        if (observabilityIntegration) {
            observabilityIntegration.stopAutoExport();
        }

        // Parar health checks
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.currentStatus = this.systemStatus.STOPPED;
        this._dispatchSystemEvent('stopped');

        structuredLogger.info('Monitoring system stopped');
    }

    /**
     * Obtém status geral do sistema
     * @returns {Object} Status do sistema
     */
    getSystemStatus() {
        return {
            status: this.currentStatus,
            initialized: this.initialized,
            uptime: this._getUptime(),
            subsystems: this._getSubsystemStatus(),
            health: this.getSystemHealth(),
            performance: this._getPerformanceMetrics(),
            alerts: this._getActiveAlerts(),
            timestamp: Date.now(),
        };
    }

    /**
     * Obtém métricas de saúde do sistema
     * @returns {Object} Métricas de saúde
     */
    getSystemHealth() {
        const health = {
            overall: 'healthy',
            components: {},
            issues: [],
            recommendations: [],
        };

        // Verificar cada subsistema
        for (const [name, subsystem] of this.subsystems.entries()) {
            try {
                const componentHealth = this._checkComponentHealth(name, subsystem);
                health.components[name] = componentHealth;

                if (componentHealth.status !== 'healthy') {
                    health.issues.push({
                        component: name,
                        status: componentHealth.status,
                        message: componentHealth.message,
                    });
                }
            } catch (error) {
                health.components[name] = {
                    status: 'error',
                    message: error.message,
                };
                health.issues.push({
                    component: name,
                    status: 'error',
                    message: `Health check failed: ${error.message}`,
                });
            }
        }

        // Determinar status geral
        const criticalIssues = health.issues.filter((i) => i.status === 'critical').length;
        const errorIssues = health.issues.filter((i) => i.status === 'error').length;
        const warningIssues = health.issues.filter((i) => i.status === 'warning').length;

        if (criticalIssues > 0) {
            health.overall = 'critical';
        } else if (errorIssues > 0) {
            health.overall = 'degraded';
        } else if (warningIssues > 0) {
            health.overall = 'warning';
        }

        // Gerar recomendações
        health.recommendations = this._generateHealthRecommendations(health);

        return health;
    }

    /**
     * Força verificação de saúde de todos os componentes
     */
    async runHealthCheck() {
        structuredLogger.info('Running system health check...');

        const health = this.getSystemHealth();

        // Log issues encontrados
        if (health.issues.length > 0) {
            structuredLogger.warn('Health check found issues', {
                issueCount: health.issues.length,
                issues: health.issues,
            });
        }

        // Disparar alertas se necessário
        if (health.overall === 'critical') {
            criticalAlerts.triggerAlert(
                'System Health Critical',
                `System health is critical with ${health.issues.length} issues`,
                {
                    severity: 'critical',
                    type: 'system_health',
                    metadata: { health },
                }
            );
        }

        return health;
    }

    /**
     * Entra em modo de emergência
     * @param {string} reason - Motivo da emergência
     */
    enterEmergencyMode(reason) {
        structuredLogger.error('Entering emergency mode', { reason });

        this.config.emergencyMode = true;
        this.currentStatus = this.systemStatus.EMERGENCY;

        // Reduzir frequência de coletas para economizar recursos
        if (realtimeMetrics) {
            realtimeMetrics.config.collectionInterval = 10000; // 10 segundos
        }

        // Parar funcionalidades não essenciais
        if (healthDashboard) {
            healthDashboard.config.updateFrequency = 30000; // 30 segundos
        }

        // Disparar alerta crítico
        criticalAlerts.triggerAlert(
            'System Emergency Mode',
            `System entered emergency mode: ${reason}`,
            {
                severity: 'critical',
                type: 'system_emergency',
                metadata: { reason, timestamp: Date.now() },
            }
        );

        this._dispatchSystemEvent('emergency', { reason });
    }

    /**
     * Sai do modo de emergência
     */
    exitEmergencyMode() {
        if (!this.config.emergencyMode) return;

        structuredLogger.info('Exiting emergency mode');

        this.config.emergencyMode = false;
        this.currentStatus = this.systemStatus.RUNNING;

        // Restaurar configurações normais
        if (realtimeMetrics) {
            realtimeMetrics.config.collectionInterval = 1000; // 1 segundo
        }

        if (healthDashboard) {
            healthDashboard.config.updateFrequency = 5000; // 5 segundos
        }

        this._dispatchSystemEvent('emergency_exit');
    }

    /**
     * Obtém relatório completo do sistema
     * @param {Object} options - Opções do relatório
     * @returns {Object} Relatório completo
     */
    generateSystemReport(options = {}) {
        const {
            includeMetrics = true,
            includeLogs = true,
            includeErrors = true,
            includeAnalytics = true,
            timeRange = 24 * 60 * 60 * 1000, // 24 horas
        } = options;

        const report = {
            generatedAt: new Date().toISOString(),
            systemStatus: this.getSystemStatus(),
            timeRange: {
                since: new Date(Date.now() - timeRange).toISOString(),
                until: new Date().toISOString(),
            },
        };

        if (includeMetrics && realtimeMetrics) {
            report.metrics = realtimeMetrics.getDashboardSnapshot();
        }

        if (includeLogs && structuredLogger) {
            report.logs = {
                stats: structuredLogger.getStats(),
                recentErrors: structuredLogger.getLogs({
                    level: 'ERROR',
                    since: Date.now() - timeRange,
                    limit: 50,
                }),
            };
        }

        if (includeErrors && errorTracker) {
            report.errors = errorTracker.generateErrorReport({
                timeRange,
                includeStackTraces: false,
                includeBreadcrumbs: false,
            });
        }

        if (includeAnalytics && usageAnalytics) {
            report.analytics = usageAnalytics.generateAnalyticsReport({
                timeRange,
                includeHeatmap: false,
                includeJourneys: true,
            });
        }

        return report;
    }

    /**
     * Exporta dados do sistema
     * @param {string} format - Formato de exportação
     * @param {Object} options - Opções de exportação
     * @returns {string} Dados exportados
     */
    exportSystemData(format = 'json', options = {}) {
        const report = this.generateSystemReport(options);

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this._convertReportToCSV(report);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Destrói o sistema de monitoramento
     */
    destroy() {
        structuredLogger.info('Destroying monitoring system...');

        this.stop();

        // Destruir subsistemas
        if (healthDashboard) {
            healthDashboard.destroy();
        }

        if (observabilityIntegration) {
            observabilityIntegration.destroy();
        }

        this.subsystems.clear();
        this.initialized = false;
        this.currentStatus = this.systemStatus.STOPPED;

        structuredLogger.info('Monitoring system destroyed');
    }

    // Métodos privados
    _registerSubsystems() {
        this.subsystems.set('logger', structuredLogger);
        this.subsystems.set('errorTracker', errorTracker);
        this.subsystems.set('metrics', realtimeMetrics);
        this.subsystems.set('analytics', usageAnalytics);
        this.subsystems.set('alerts', criticalAlerts);
        this.subsystems.set('dashboard', healthDashboard);
        this.subsystems.set('integration', observabilityIntegration);
    }

    async _initializeSubsystems() {
        // Subsistemas já são inicializados automaticamente
        // Aqui podemos fazer configurações adicionais se necessário

        // Configurar logger
        structuredLogger.configure({
            enableRemote: this.config.enableIntegrations,
        });

        // Configurar métricas
        if (realtimeMetrics) {
            // Métricas já inicializadas automaticamente
        }

        // Configurar analytics
        if (usageAnalytics) {
            // Analytics já inicializados automaticamente
        }
    }

    async _setupIntegrations() {
        if (!observabilityIntegration) return;

        // Configurar integrações padrão baseadas no ambiente
        const isProduction =
            window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

        if (isProduction) {
            // Em produção, configurar integrações reais
            // Exemplo: observabilityIntegration.registerIntegration(...)
        }

        structuredLogger.info('Observability integrations configured');
    }

    async _initializeDashboard() {
        if (!healthDashboard) return;

        healthDashboard.initialize({
            updateFrequency: this.config.emergencyMode ? 30000 : 5000,
            autoRefresh: true,
            theme: 'dark',
            position: 'bottom-right',
        });

        structuredLogger.info('Health dashboard initialized');
    }

    _setupHealthChecks() {
        this.healthCheckInterval = setInterval(() => {
            this.runHealthCheck().catch((error) => {
                structuredLogger.error('Health check failed', error);
            });
        }, this.config.healthCheckInterval);
    }

    _setupEmergencyHandlers() {
        // Handler para erros críticos
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message.includes('critical')) {
                this.enterEmergencyMode(`Critical error: ${event.error.message}`);
            }
        });

        // Handler para alertas críticos
        window.addEventListener('criticalAlert', (event) => {
            const alert = event.detail;
            if (alert.severity === 'critical' && alert.type === 'system_health') {
                this.enterEmergencyMode(`Critical alert: ${alert.title}`);
            }
        });

        // Handler para baixa memória
        if (performance.memory) {
            setInterval(() => {
                const memoryMB = performance.memory.usedJSHeapSize / 1048576;
                if (memoryMB > 1000) {
                    // 1GB
                    this.enterEmergencyMode(`High memory usage: ${memoryMB.toFixed(0)}MB`);
                }
            }, 30000);
        }
    }

    _checkComponentHealth(name, subsystem) {
        const health = {
            status: 'healthy',
            message: 'Component is functioning normally',
            metrics: {},
        };

        switch (name) {
            case 'logger':
                const logStats = structuredLogger.getStats();
                health.metrics = {
                    totalLogs: logStats.totalLogs,
                    recentErrors: logStats.recentErrors,
                };

                if (logStats.recentErrors > 10) {
                    health.status = 'warning';
                    health.message = 'High error rate detected';
                }
                break;

            case 'errorTracker':
                const errorStats = errorTracker.getErrorStats({
                    since: Date.now() - 5 * 60 * 1000,
                });
                health.metrics = {
                    recentErrors: errorStats.total,
                    criticalErrors: errorStats.bySeverity.critical || 0,
                };

                if (errorStats.bySeverity.critical > 0) {
                    health.status = 'critical';
                    health.message = 'Critical errors detected';
                } else if (errorStats.total > 20) {
                    health.status = 'warning';
                    health.message = 'High error volume';
                }
                break;

            case 'metrics':
                const memoryUsage = realtimeMetrics.getCurrentValue('system.memory.used');
                const fps = realtimeMetrics.getCurrentValue('performance.fps');
                health.metrics = { memoryUsage, fps };

                if (memoryUsage > 800) {
                    health.status = 'critical';
                    health.message = 'Memory usage critical';
                } else if (memoryUsage > 500) {
                    health.status = 'warning';
                    health.message = 'High memory usage';
                }

                if (fps < 20) {
                    health.status = 'warning';
                    health.message = 'Low FPS detected';
                }
                break;

            case 'alerts':
                const alertStats = criticalAlerts.getAlertStats({
                    since: Date.now() - 5 * 60 * 1000,
                });
                health.metrics = {
                    activeAlerts: alertStats.byStatus.active || 0,
                    criticalAlerts: alertStats.bySeverity.critical || 0,
                };

                if (alertStats.bySeverity.critical > 0) {
                    health.status = 'critical';
                    health.message = 'Critical alerts active';
                } else if (alertStats.byStatus.active > 10) {
                    health.status = 'warning';
                    health.message = 'Many active alerts';
                }
                break;

            default:
                // Componente genérico
                break;
        }

        return health;
    }

    _generateHealthRecommendations(health) {
        const recommendations = [];

        health.issues.forEach((issue) => {
            switch (issue.component) {
                case 'logger':
                    if (issue.status === 'warning') {
                        recommendations.push({
                            component: issue.component,
                            action: 'Review recent errors and fix underlying issues',
                            priority: 'medium',
                        });
                    }
                    break;

                case 'errorTracker':
                    if (issue.status === 'critical') {
                        recommendations.push({
                            component: issue.component,
                            action: 'Investigate and resolve critical errors immediately',
                            priority: 'high',
                        });
                    }
                    break;

                case 'metrics':
                    if (issue.message.includes('memory')) {
                        recommendations.push({
                            component: issue.component,
                            action: 'Clear caches and optimize memory usage',
                            priority: 'high',
                        });
                    }
                    break;
            }
        });

        return recommendations;
    }

    _getSubsystemStatus() {
        const status = {};

        for (const [name, subsystem] of this.subsystems.entries()) {
            status[name] = {
                available: !!subsystem,
                initialized: true, // Assumindo que todos estão inicializados
            };
        }

        return status;
    }

    _getPerformanceMetrics() {
        return {
            memory: realtimeMetrics?.getCurrentValue('system.memory.used') || 0,
            cpu: realtimeMetrics?.getCurrentValue('system.cpu.usage') || 0,
            fps: realtimeMetrics?.getCurrentValue('performance.fps') || 0,
        };
    }

    _getActiveAlerts() {
        return criticalAlerts?.getActiveAlerts()?.length || 0;
    }

    _getUptime() {
        return performance.timing ? Date.now() - performance.timing.navigationStart : 0;
    }

    _dispatchSystemEvent(eventType, data = {}) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('monitoringSystem', {
                detail: { eventType, data, timestamp: Date.now() },
            });
            window.dispatchEvent(event);
        }
    }

    _convertReportToCSV(report) {
        const rows = [];
        rows.push('timestamp,component,metric,value,status');

        // Sistema
        if (report.systemStatus) {
            rows.push(`${Date.now()},system,status,${report.systemStatus.status},info`);
            rows.push(`${Date.now()},system,uptime,${report.systemStatus.uptime},info`);
        }

        // Métricas
        if (report.metrics && report.metrics.system) {
            const metrics = report.metrics.system;
            Object.entries(metrics).forEach(([key, value]) => {
                rows.push(`${Date.now()},metrics,${key},${value},info`);
            });
        }

        return rows.join('\n');
    }
}

// Instância global
const monitoringSystem = new MonitoringSystem();

// Auto-inicializar se configurado
if (monitoringSystem.config.autoStart) {
    // Aguardar carregamento da página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            monitoringSystem.initialize().catch(console.error);
        });
    } else {
        monitoringSystem.initialize().catch(console.error);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.monitoringSystem = monitoringSystem;
}

export default monitoringSystem;
