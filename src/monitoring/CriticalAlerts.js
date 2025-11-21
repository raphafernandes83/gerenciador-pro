/**
 * Sistema de Alertas para Problemas Críticos
 * Monitora condições críticas e dispara alertas automáticos
 */

import structuredLogger from './StructuredLogger.js';
import errorTracker from './ErrorTracker.js';
import realtimeMetrics from './RealtimeMetrics.js';

class CriticalAlerts {
    constructor() {
        this.alerts = new Map();
        this.rules = new Map();
        this.channels = new Map();
        this.suppressions = new Map();
        this.config = {
            enableAutoMonitoring: true,
            checkInterval: 5000, // 5 segundos
            suppressionDuration: 300000, // 5 minutos
            maxAlertsPerMinute: 10,
            enableEscalation: true,
            escalationDelay: 600000, // 10 minutos
        };

        this.severityLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical',
        };

        this.alertTypes = {
            ERROR_RATE: 'error_rate',
            PERFORMANCE: 'performance',
            MEMORY: 'memory',
            NETWORK: 'network',
            BUSINESS_LOGIC: 'business_logic',
            SECURITY: 'security',
            CUSTOM: 'custom',
        };

        this.channelTypes = {
            CONSOLE: 'console',
            NOTIFICATION: 'notification',
            EMAIL: 'email',
            WEBHOOK: 'webhook',
            STORAGE: 'storage',
        };

        this._setupDefaultRules();
        this._setupDefaultChannels();

        if (this.config.enableAutoMonitoring) {
            this._startMonitoring();
        }
    }

    /**
     * Cria uma regra de alerta
     * @param {string} name - Nome da regra
     * @param {Object} condition - Condição para disparar o alerta
     * @param {Object} options - Opções da regra
     */
    createAlertRule(name, condition, options = {}) {
        const {
            severity = this.severityLevels.MEDIUM,
            type = this.alertTypes.CUSTOM,
            description = '',
            channels = ['console'],
            suppressionTime = this.config.suppressionDuration,
            escalationRules = null,
            metadata = {},
        } = options;

        const rule = {
            name,
            condition,
            severity,
            type,
            description,
            channels,
            suppressionTime,
            escalationRules,
            metadata,
            createdAt: Date.now(),
            enabled: true,
            triggerCount: 0,
            lastTriggered: null,
        };

        this.rules.set(name, rule);

        structuredLogger.info(
            'Alert rule created',
            {
                ruleName: name,
                severity,
                type,
                channels,
            },
            {
                category: 'alerts',
                tags: ['rule_creation'],
            }
        );

        return rule;
    }

    /**
     * Registra um canal de alerta
     * @param {string} name - Nome do canal
     * @param {string} type - Tipo do canal
     * @param {Object} config - Configuração do canal
     */
    registerChannel(name, type, config = {}) {
        const channel = {
            name,
            type,
            config,
            enabled: true,
            lastUsed: null,
            messageCount: 0,
            errorCount: 0,
        };

        this.channels.set(name, channel);

        structuredLogger.info(
            'Alert channel registered',
            {
                channelName: name,
                channelType: type,
            },
            {
                category: 'alerts',
                tags: ['channel_registration'],
            }
        );

        return channel;
    }

    /**
     * Dispara um alerta manualmente
     * @param {string} title - Título do alerta
     * @param {string} message - Mensagem do alerta
     * @param {Object} options - Opções do alerta
     */
    triggerAlert(title, message, options = {}) {
        const {
            severity = this.severityLevels.MEDIUM,
            type = this.alertTypes.CUSTOM,
            channels = ['console'],
            metadata = {},
            suppressionKey = null,
        } = options;

        const alertId = this._generateAlertId();
        const alert = {
            id: alertId,
            title,
            message,
            severity,
            type,
            channels,
            metadata: {
                ...metadata,
                triggeredAt: Date.now(),
                source: 'manual',
            },
            suppressionKey: suppressionKey || `manual_${title}`,
            status: 'active',
            acknowledgedBy: null,
            acknowledgedAt: null,
            resolvedAt: null,
        };

        // Verificar supressão
        if (this._isAlertSuppressed(alert.suppressionKey)) {
            structuredLogger.debug('Alert suppressed', {
                alertId,
                title,
                suppressionKey: alert.suppressionKey,
            });
            return null;
        }

        this._processAlert(alert);
        return alertId;
    }

    /**
     * Reconhece um alerta
     * @param {string} alertId - ID do alerta
     * @param {string} acknowledgedBy - Quem reconheceu
     * @param {string} comment - Comentário opcional
     */
    acknowledgeAlert(alertId, acknowledgedBy, comment = '') {
        const alert = this.alerts.get(alertId);
        if (!alert) return false;

        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = Date.now();
        alert.status = 'acknowledged';
        alert.comment = comment;

        structuredLogger.info(
            'Alert acknowledged',
            {
                alertId,
                acknowledgedBy,
                comment,
            },
            {
                category: 'alerts',
                tags: ['acknowledgment'],
            }
        );

        return true;
    }

    /**
     * Resolve um alerta
     * @param {string} alertId - ID do alerta
     * @param {string} resolvedBy - Quem resolveu
     * @param {string} resolution - Descrição da resolução
     */
    resolveAlert(alertId, resolvedBy, resolution = '') {
        const alert = this.alerts.get(alertId);
        if (!alert) return false;

        alert.resolvedAt = Date.now();
        alert.status = 'resolved';
        alert.resolvedBy = resolvedBy;
        alert.resolution = resolution;

        structuredLogger.info(
            'Alert resolved',
            {
                alertId,
                resolvedBy,
                resolution,
                duration: alert.resolvedAt - alert.metadata.triggeredAt,
            },
            {
                category: 'alerts',
                tags: ['resolution'],
            }
        );

        return true;
    }

    /**
     * Suprime alertas por um período
     * @param {string} suppressionKey - Chave de supressão
     * @param {number} duration - Duração em ms
     * @param {string} reason - Motivo da supressão
     */
    suppressAlerts(suppressionKey, duration = null, reason = '') {
        const suppressionDuration = duration || this.config.suppressionDuration;
        const suppression = {
            key: suppressionKey,
            until: Date.now() + suppressionDuration,
            reason,
            createdAt: Date.now(),
        };

        this.suppressions.set(suppressionKey, suppression);

        structuredLogger.info(
            'Alerts suppressed',
            {
                suppressionKey,
                duration: suppressionDuration,
                reason,
            },
            {
                category: 'alerts',
                tags: ['suppression'],
            }
        );
    }

    /**
     * Obtém alertas ativos
     * @param {Object} filters - Filtros para aplicar
     * @returns {Array} Alertas ativos
     */
    getActiveAlerts(filters = {}) {
        const { severity = null, type = null, status = 'active', since = null } = filters;

        let alerts = Array.from(this.alerts.values());

        if (status) {
            alerts = alerts.filter((alert) => alert.status === status);
        }

        if (severity) {
            alerts = alerts.filter((alert) => alert.severity === severity);
        }

        if (type) {
            alerts = alerts.filter((alert) => alert.type === type);
        }

        if (since) {
            alerts = alerts.filter((alert) => alert.metadata.triggeredAt >= since);
        }

        return alerts.sort((a, b) => b.metadata.triggeredAt - a.metadata.triggeredAt);
    }

    /**
     * Obtém estatísticas de alertas
     * @param {Object} filters - Filtros para aplicar
     * @returns {Object} Estatísticas
     */
    getAlertStats(filters = {}) {
        const alerts = this.getActiveAlerts(filters);

        const stats = {
            total: alerts.length,
            bySeverity: {},
            byType: {},
            byStatus: {},
            averageResolutionTime: 0,
            acknowledgmentRate: 0,
            resolutionRate: 0,
            topAlertTypes: [],
            recentTrends: this._calculateAlertTrends(alerts),
        };

        // Distribuições
        Object.values(this.severityLevels).forEach((severity) => {
            stats.bySeverity[severity] = alerts.filter((a) => a.severity === severity).length;
        });

        Object.values(this.alertTypes).forEach((type) => {
            stats.byType[type] = alerts.filter((a) => a.type === type).length;
        });

        ['active', 'acknowledged', 'resolved'].forEach((status) => {
            stats.byStatus[status] = alerts.filter((a) => a.status === status).length;
        });

        // Taxas
        const acknowledgedAlerts = alerts.filter((a) => a.acknowledgedAt);
        const resolvedAlerts = alerts.filter((a) => a.resolvedAt);

        stats.acknowledgmentRate =
            alerts.length > 0 ? (acknowledgedAlerts.length / alerts.length) * 100 : 0;

        stats.resolutionRate =
            alerts.length > 0 ? (resolvedAlerts.length / alerts.length) * 100 : 0;

        // Tempo médio de resolução
        if (resolvedAlerts.length > 0) {
            const totalResolutionTime = resolvedAlerts.reduce(
                (sum, alert) => sum + (alert.resolvedAt - alert.metadata.triggeredAt),
                0
            );
            stats.averageResolutionTime = totalResolutionTime / resolvedAlerts.length;
        }

        // Top tipos de alerta
        stats.topAlertTypes = Object.entries(stats.byType)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return stats;
    }

    /**
     * Obtém dashboard de alertas
     * @returns {Object} Dashboard com informações resumidas
     */
    getDashboard() {
        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        const lastHour = now - 60 * 60 * 1000;

        const dashboard = {
            timestamp: now,
            summary: {
                activeAlerts: this.getActiveAlerts({ status: 'active' }).length,
                criticalAlerts: this.getActiveAlerts({
                    status: 'active',
                    severity: this.severityLevels.CRITICAL,
                }).length,
                alertsLast24h: this.getActiveAlerts({ since: last24h }).length,
                alertsLastHour: this.getActiveAlerts({ since: lastHour }).length,
            },
            recentAlerts: this.getActiveAlerts().slice(0, 10),
            stats: this.getAlertStats({ since: last24h }),
            systemHealth: this._getSystemHealthStatus(),
            suppressions: Array.from(this.suppressions.values()).filter((s) => s.until > now),
        };

        return dashboard;
    }

    /**
     * Exporta configuração de alertas
     * @returns {Object} Configuração exportada
     */
    exportConfiguration() {
        return {
            rules: Array.from(this.rules.entries()),
            channels: Array.from(this.channels.entries()),
            config: this.config,
        };
    }

    /**
     * Importa configuração de alertas
     * @param {Object} configuration - Configuração a importar
     */
    importConfiguration(configuration) {
        if (configuration.rules) {
            this.rules = new Map(configuration.rules);
        }

        if (configuration.channels) {
            this.channels = new Map(configuration.channels);
        }

        if (configuration.config) {
            this.config = { ...this.config, ...configuration.config };
        }

        structuredLogger.info('Alert configuration imported', {
            rulesCount: this.rules.size,
            channelsCount: this.channels.size,
        });
    }

    // Métodos privados
    _setupDefaultRules() {
        // Regra para alta taxa de erros
        this.createAlertRule(
            'high_error_rate',
            {
                metric: 'errors.total',
                operator: 'rate_per_minute',
                threshold: 10,
                timeWindow: 60000, // 1 minuto
            },
            {
                severity: this.severityLevels.HIGH,
                type: this.alertTypes.ERROR_RATE,
                description: 'Taxa de erros muito alta detectada',
                channels: ['console', 'notification'],
            }
        );

        // Regra para uso alto de memória
        this.createAlertRule(
            'high_memory_usage',
            {
                metric: 'system.memory.used',
                operator: 'greater_than',
                threshold: 500, // MB
            },
            {
                severity: this.severityLevels.MEDIUM,
                type: this.alertTypes.MEMORY,
                description: 'Uso de memória acima do limite',
                channels: ['console'],
            }
        );

        // Regra para performance degradada
        this.createAlertRule(
            'poor_performance',
            {
                metric: 'performance.fps',
                operator: 'less_than',
                threshold: 30,
            },
            {
                severity: this.severityLevels.MEDIUM,
                type: this.alertTypes.PERFORMANCE,
                description: 'Performance degradada detectada',
                channels: ['console'],
            }
        );

        // Regra para erros críticos
        this.createAlertRule(
            'critical_errors',
            {
                custom: (context) => {
                    const criticalErrors = errorTracker.getErrorStats({
                        severity: 'critical',
                        since: Date.now() - 60000, // 1 minuto
                    });
                    return criticalErrors.total > 0;
                },
            },
            {
                severity: this.severityLevels.CRITICAL,
                type: this.alertTypes.ERROR_RATE,
                description: 'Erro crítico detectado no sistema',
                channels: ['console', 'notification'],
            }
        );
    }

    _setupDefaultChannels() {
        // Canal de console
        this.registerChannel('console', this.channelTypes.CONSOLE, {
            logLevel: 'error',
        });

        // Canal de notificação do browser
        this.registerChannel('notification', this.channelTypes.NOTIFICATION, {
            requirePermission: true,
            icon: '/favicon.ico',
            timeout: 10000,
        });

        // Canal de armazenamento local
        this.registerChannel('storage', this.channelTypes.STORAGE, {
            storageKey: 'critical_alerts',
            maxAlerts: 100,
        });
    }

    _startMonitoring() {
        setInterval(() => {
            this._checkAlertRules();
            this._cleanupOldAlerts();
            this._cleanupSuppressions();
        }, this.config.checkInterval);

        structuredLogger.info('Critical alerts monitoring started', {
            checkInterval: this.config.checkInterval,
            rulesCount: this.rules.size,
            channelsCount: this.channels.size,
        });
    }

    _checkAlertRules() {
        for (const [name, rule] of this.rules.entries()) {
            if (!rule.enabled) continue;

            try {
                const shouldTrigger = this._evaluateRule(rule);

                if (shouldTrigger) {
                    this._triggerRuleAlert(rule);
                }
            } catch (error) {
                structuredLogger.error('Error evaluating alert rule', error, {
                    ruleName: name,
                });
            }
        }
    }

    _evaluateRule(rule) {
        const { condition } = rule;

        // Condição customizada
        if (condition.custom && typeof condition.custom === 'function') {
            return condition.custom({
                metrics: realtimeMetrics,
                errors: errorTracker,
                logger: structuredLogger,
            });
        }

        // Condição baseada em métrica
        if (condition.metric) {
            const currentValue = realtimeMetrics.getCurrentValue(condition.metric);
            if (currentValue === null) return false;

            switch (condition.operator) {
                case 'greater_than':
                    return currentValue > condition.threshold;
                case 'less_than':
                    return currentValue < condition.threshold;
                case 'equals':
                    return currentValue === condition.threshold;
                case 'rate_per_minute':
                    return this._checkRateCondition(condition);
                default:
                    return false;
            }
        }

        return false;
    }

    _checkRateCondition(condition) {
        const stats = realtimeMetrics.getMetricStats(condition.metric, {
            timeRange: condition.timeWindow || 60000,
        });

        if (!stats || stats.count === 0) return false;

        const rate = stats.count / (condition.timeWindow / 60000); // por minuto
        return rate > condition.threshold;
    }

    _triggerRuleAlert(rule) {
        const suppressionKey = `rule_${rule.name}`;

        // Verificar supressão
        if (this._isAlertSuppressed(suppressionKey)) {
            return;
        }

        const alert = {
            id: this._generateAlertId(),
            title: `Alert: ${rule.name}`,
            message: rule.description || `Rule "${rule.name}" triggered`,
            severity: rule.severity,
            type: rule.type,
            channels: rule.channels,
            metadata: {
                triggeredAt: Date.now(),
                source: 'rule',
                ruleName: rule.name,
                ruleCondition: rule.condition,
                ...rule.metadata,
            },
            suppressionKey,
            status: 'active',
        };

        // Atualizar estatísticas da regra
        rule.triggerCount++;
        rule.lastTriggered = Date.now();

        this._processAlert(alert);

        // Configurar supressão automática
        this.suppressAlerts(
            suppressionKey,
            rule.suppressionTime,
            'Auto-suppression after rule trigger'
        );
    }

    _processAlert(alert) {
        // Adicionar à lista de alertas
        this.alerts.set(alert.id, alert);

        // Enviar para canais
        alert.channels.forEach((channelName) => {
            this._sendToChannel(channelName, alert);
        });

        // Log estruturado
        structuredLogger.warn(
            'Critical alert triggered',
            {
                alertId: alert.id,
                title: alert.title,
                severity: alert.severity,
                type: alert.type,
            },
            {
                category: 'alerts',
                tags: ['critical', 'triggered', alert.severity],
                alert: true,
            }
        );

        // Disparar evento
        this._dispatchAlertEvent(alert);

        // Configurar escalação se habilitada
        if (this.config.enableEscalation && alert.severity === this.severityLevels.CRITICAL) {
            this._scheduleEscalation(alert);
        }
    }

    _sendToChannel(channelName, alert) {
        const channel = this.channels.get(channelName);
        if (!channel || !channel.enabled) return;

        try {
            switch (channel.type) {
                case this.channelTypes.CONSOLE:
                    this._sendToConsole(alert, channel.config);
                    break;
                case this.channelTypes.NOTIFICATION:
                    this._sendToNotification(alert, channel.config);
                    break;
                case this.channelTypes.STORAGE:
                    this._sendToStorage(alert, channel.config);
                    break;
                case this.channelTypes.WEBHOOK:
                    this._sendToWebhook(alert, channel.config);
                    break;
                case this.channelTypes.EMAIL:
                    this._sendToEmail(alert, channel.config);
                    break;
            }

            channel.messageCount++;
            channel.lastUsed = Date.now();
        } catch (error) {
            channel.errorCount++;
            structuredLogger.error('Failed to send alert to channel', error, {
                channelName,
                channelType: channel.type,
                alertId: alert.id,
            });
        }
    }

    _sendToConsole(alert, config) {
        const message = `🚨 ${alert.title}: ${alert.message}`;

        switch (alert.severity) {
            case this.severityLevels.CRITICAL:
                console.error(message, alert);
                break;
            case this.severityLevels.HIGH:
                console.warn(message, alert);
                break;
            default:
                console.log(message, alert);
        }
    }

    _sendToNotification(alert, config) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(alert.title, {
                body: alert.message,
                icon: config.icon || '/favicon.ico',
                tag: alert.id,
                requireInteraction: alert.severity === this.severityLevels.CRITICAL,
            });
        } else if (Notification.permission !== 'denied' && config.requirePermission) {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    this._sendToNotification(alert, config);
                }
            });
        }
    }

    _sendToStorage(alert, config) {
        const storageKey = config.storageKey || 'alerts';
        const maxAlerts = config.maxAlerts || 100;

        try {
            const existingAlerts = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const updatedAlerts = [alert, ...existingAlerts].slice(0, maxAlerts);
            localStorage.setItem(storageKey, JSON.stringify(updatedAlerts));
        } catch (error) {
            // Fallback para sessionStorage
            try {
                const existingAlerts = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
                const updatedAlerts = [alert, ...existingAlerts].slice(0, maxAlerts);
                sessionStorage.setItem(storageKey, JSON.stringify(updatedAlerts));
            } catch (fallbackError) {
                console.warn('Failed to store alert in both localStorage and sessionStorage');
            }
        }
    }

    _sendToWebhook(alert, config) {
        if (!config.url) return;

        fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
            body: JSON.stringify({
                alert,
                timestamp: Date.now(),
                source: 'critical-alerts-system',
            }),
        }).catch((error) => {
            structuredLogger.error('Webhook alert failed', error, {
                webhookUrl: config.url,
                alertId: alert.id,
            });
        });
    }

    _sendToEmail(alert, config) {
        // Implementação simplificada - em produção usaria serviço de email
        console.log('Email alert would be sent:', {
            to: config.recipients,
            subject: alert.title,
            body: alert.message,
            alert,
        });
    }

    _isAlertSuppressed(suppressionKey) {
        const suppression = this.suppressions.get(suppressionKey);
        return suppression && suppression.until > Date.now();
    }

    _scheduleEscalation(alert) {
        setTimeout(() => {
            const currentAlert = this.alerts.get(alert.id);
            if (currentAlert && currentAlert.status === 'active') {
                this._escalateAlert(currentAlert);
            }
        }, this.config.escalationDelay);
    }

    _escalateAlert(alert) {
        const escalatedAlert = {
            ...alert,
            id: this._generateAlertId(),
            title: `ESCALATED: ${alert.title}`,
            message: `Alert has been escalated due to no acknowledgment. Original: ${alert.message}`,
            metadata: {
                ...alert.metadata,
                escalatedFrom: alert.id,
                escalatedAt: Date.now(),
            },
        };

        this._processAlert(escalatedAlert);
    }

    _calculateAlertTrends(alerts) {
        const trends = {};
        const hourMs = 60 * 60 * 1000;
        const now = Date.now();

        for (let i = 0; i < 24; i++) {
            const start = now - (i + 1) * hourMs;
            const end = now - i * hourMs;
            const hourAlerts = alerts.filter(
                (a) => a.metadata.triggeredAt >= start && a.metadata.triggeredAt < end
            );
            trends[`${i}h_ago`] = hourAlerts.length;
        }

        return trends;
    }

    _getSystemHealthStatus() {
        const criticalAlerts = this.getActiveAlerts({
            status: 'active',
            severity: this.severityLevels.CRITICAL,
        }).length;

        const highAlerts = this.getActiveAlerts({
            status: 'active',
            severity: this.severityLevels.HIGH,
        }).length;

        if (criticalAlerts > 0) return 'critical';
        if (highAlerts > 2) return 'degraded';
        if (highAlerts > 0) return 'warning';
        return 'healthy';
    }

    _cleanupOldAlerts() {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 dias

        for (const [id, alert] of this.alerts.entries()) {
            if (alert.metadata.triggeredAt < cutoff) {
                this.alerts.delete(id);
            }
        }
    }

    _cleanupSuppressions() {
        const now = Date.now();

        for (const [key, suppression] of this.suppressions.entries()) {
            if (suppression.until <= now) {
                this.suppressions.delete(key);
            }
        }
    }

    _dispatchAlertEvent(alert) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('criticalAlert', {
                detail: alert,
            });
            window.dispatchEvent(event);
        }
    }

    _generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Instância global
const criticalAlerts = new CriticalAlerts();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.criticalAlerts = criticalAlerts;
}

export default criticalAlerts;
