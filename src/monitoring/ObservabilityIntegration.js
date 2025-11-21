/**
 * Sistema de Integração com Ferramentas de Observabilidade
 * Conecta com serviços externos de monitoramento e observabilidade
 */

import structuredLogger from './StructuredLogger.js';
import errorTracker from './ErrorTracker.js';
import realtimeMetrics from './RealtimeMetrics.js';
import usageAnalytics from './UsageAnalytics.js';
import criticalAlerts from './CriticalAlerts.js';

class ObservabilityIntegration {
    constructor() {
        this.integrations = new Map();
        this.exporters = new Map();
        this.config = {
            enableAutoExport: true,
            exportInterval: 60000, // 1 minuto
            batchSize: 100,
            retryAttempts: 3,
            retryDelay: 5000,
            enableCompression: true,
            enableEncryption: false,
        };

        this.integrationTypes = {
            PROMETHEUS: 'prometheus',
            GRAFANA: 'grafana',
            DATADOG: 'datadog',
            NEW_RELIC: 'new_relic',
            ELASTIC: 'elastic',
            CUSTOM_WEBHOOK: 'custom_webhook',
            CONSOLE: 'console',
            LOCAL_STORAGE: 'local_storage',
        };

        this.dataTypes = {
            METRICS: 'metrics',
            LOGS: 'logs',
            TRACES: 'traces',
            EVENTS: 'events',
            ALERTS: 'alerts',
        };

        this._setupDefaultIntegrations();

        if (this.config.enableAutoExport) {
            this._startAutoExport();
        }
    }

    /**
     * Registra uma integração com serviço externo
     * @param {string} name - Nome da integração
     * @param {string} type - Tipo da integração
     * @param {Object} config - Configuração da integração
     */
    registerIntegration(name, type, config = {}) {
        const integration = {
            name,
            type,
            config: {
                enabled: true,
                dataTypes: [this.dataTypes.METRICS, this.dataTypes.LOGS],
                endpoint: null,
                apiKey: null,
                headers: {},
                timeout: 30000,
                ...config,
            },
            stats: {
                totalExports: 0,
                successfulExports: 0,
                failedExports: 0,
                lastExport: null,
                lastError: null,
            },
        };

        this.integrations.set(name, integration);

        structuredLogger.info(
            'Observability integration registered',
            {
                integrationName: name,
                type,
                dataTypes: integration.config.dataTypes,
            },
            {
                category: 'observability',
                tags: ['integration', 'registration'],
            }
        );

        return integration;
    }

    /**
     * Registra um exportador customizado
     * @param {string} name - Nome do exportador
     * @param {Function} exporter - Função exportadora
     * @param {Object} options - Opções do exportador
     */
    registerExporter(name, exporter, options = {}) {
        const {
            dataTypes = [this.dataTypes.METRICS],
            format = 'json',
            compression = false,
            encryption = false,
        } = options;

        this.exporters.set(name, {
            name,
            exporter,
            dataTypes,
            format,
            compression,
            encryption,
            stats: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageDuration: 0,
            },
        });

        structuredLogger.info('Custom exporter registered', {
            exporterName: name,
            dataTypes,
            format,
        });
    }

    /**
     * Exporta dados para uma integração específica
     * @param {string} integrationName - Nome da integração
     * @param {string} dataType - Tipo de dados
     * @param {Object} data - Dados a exportar
     */
    async exportToIntegration(integrationName, dataType, data) {
        const integration = this.integrations.get(integrationName);
        if (!integration || !integration.config.enabled) {
            return false;
        }

        if (!integration.config.dataTypes.includes(dataType)) {
            return false;
        }

        try {
            integration.stats.totalExports++;

            const exportData = await this._prepareExportData(dataType, data, integration);
            const result = await this._sendToIntegration(integration, exportData);

            integration.stats.successfulExports++;
            integration.stats.lastExport = Date.now();

            structuredLogger.debug('Data exported to integration', {
                integrationName,
                dataType,
                dataSize: this._getDataSize(exportData),
            });

            return result;
        } catch (error) {
            integration.stats.failedExports++;
            integration.stats.lastError = error.message;

            structuredLogger.error('Integration export failed', error, {
                integrationName,
                dataType,
            });

            return false;
        }
    }

    /**
     * Exporta dados para todas as integrações compatíveis
     * @param {string} dataType - Tipo de dados
     * @param {Object} data - Dados a exportar
     */
    async exportToAll(dataType, data) {
        const results = {};
        const promises = [];

        for (const [name, integration] of this.integrations.entries()) {
            if (integration.config.enabled && integration.config.dataTypes.includes(dataType)) {
                promises.push(
                    this.exportToIntegration(name, dataType, data)
                        .then((result) => ({ name, success: result }))
                        .catch((error) => ({ name, success: false, error: error.message }))
                );
            }
        }

        const exportResults = await Promise.all(promises);
        exportResults.forEach((result) => {
            results[result.name] = result;
        });

        return results;
    }

    /**
     * Coleta e exporta métricas atuais
     */
    async exportCurrentMetrics() {
        const metrics = {
            timestamp: Date.now(),
            system: {
                memory: realtimeMetrics.getCurrentValue('system.memory.used'),
                cpu: realtimeMetrics.getCurrentValue('system.cpu.usage'),
                online: realtimeMetrics.getCurrentValue('system.online'),
            },
            performance: {
                fps: realtimeMetrics.getCurrentValue('performance.fps'),
                loadTime: realtimeMetrics.getCurrentValue('performance.page.load_time'),
            },
            errors: errorTracker.getErrorStats({
                since: Date.now() - 5 * 60 * 1000,
            }),
            usage: usageAnalytics.getFeatureUsageStats({
                timeRange: 5 * 60 * 1000,
            }),
            alerts: criticalAlerts.getAlertStats({
                since: Date.now() - 5 * 60 * 1000,
            }),
        };

        return this.exportToAll(this.dataTypes.METRICS, metrics);
    }

    /**
     * Coleta e exporta logs recentes
     */
    async exportRecentLogs() {
        const logs = {
            timestamp: Date.now(),
            logs: structuredLogger.getLogs({
                since: Date.now() - 5 * 60 * 1000,
                limit: 100,
            }),
            stats: structuredLogger.getStats(),
        };

        return this.exportToAll(this.dataTypes.LOGS, logs);
    }

    /**
     * Exporta eventos de analytics
     */
    async exportAnalyticsEvents() {
        const events = {
            timestamp: Date.now(),
            features: usageAnalytics.getFeatureUsageStats({
                timeRange: 5 * 60 * 1000,
            }),
            journeys: usageAnalytics.getUserJourneyAnalysis({
                timeRange: 5 * 60 * 1000,
            }),
            sessions: usageAnalytics._getSessionStats(5 * 60 * 1000),
        };

        return this.exportToAll(this.dataTypes.EVENTS, events);
    }

    /**
     * Exporta alertas ativos
     */
    async exportActiveAlerts() {
        const alerts = {
            timestamp: Date.now(),
            active: criticalAlerts.getActiveAlerts(),
            stats: criticalAlerts.getAlertStats(),
            dashboard: criticalAlerts.getDashboard(),
        };

        return this.exportToAll(this.dataTypes.ALERTS, alerts);
    }

    /**
     * Obtém estatísticas das integrações
     * @returns {Object} Estatísticas
     */
    getIntegrationStats() {
        const stats = {
            totalIntegrations: this.integrations.size,
            enabledIntegrations: 0,
            totalExports: 0,
            successfulExports: 0,
            failedExports: 0,
            integrations: {},
        };

        for (const [name, integration] of this.integrations.entries()) {
            if (integration.config.enabled) {
                stats.enabledIntegrations++;
            }

            stats.totalExports += integration.stats.totalExports;
            stats.successfulExports += integration.stats.successfulExports;
            stats.failedExports += integration.stats.failedExports;

            stats.integrations[name] = {
                type: integration.type,
                enabled: integration.config.enabled,
                stats: integration.stats,
                successRate:
                    integration.stats.totalExports > 0
                        ? (integration.stats.successfulExports / integration.stats.totalExports) *
                          100
                        : 0,
            };
        }

        stats.overallSuccessRate =
            stats.totalExports > 0 ? (stats.successfulExports / stats.totalExports) * 100 : 0;

        return stats;
    }

    /**
     * Testa conectividade com uma integração
     * @param {string} integrationName - Nome da integração
     * @returns {Object} Resultado do teste
     */
    async testIntegration(integrationName) {
        const integration = this.integrations.get(integrationName);
        if (!integration) {
            return { success: false, error: 'Integration not found' };
        }

        const testData = {
            test: true,
            timestamp: Date.now(),
            message: 'Test connectivity',
        };

        try {
            const startTime = Date.now();
            const result = await this._sendToIntegration(integration, testData);
            const duration = Date.now() - startTime;

            return {
                success: true,
                duration,
                response: result,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: error,
            };
        }
    }

    /**
     * Habilita/desabilita uma integração
     * @param {string} integrationName - Nome da integração
     * @param {boolean} enabled - Estado desejado
     */
    toggleIntegration(integrationName, enabled) {
        const integration = this.integrations.get(integrationName);
        if (integration) {
            integration.config.enabled = enabled;

            structuredLogger.info('Integration toggled', {
                integrationName,
                enabled,
            });

            return true;
        }
        return false;
    }

    /**
     * Remove uma integração
     * @param {string} integrationName - Nome da integração
     */
    removeIntegration(integrationName) {
        const removed = this.integrations.delete(integrationName);

        if (removed) {
            structuredLogger.info('Integration removed', {
                integrationName,
            });
        }

        return removed;
    }

    /**
     * Exporta configuração das integrações
     * @returns {Object} Configuração exportada
     */
    exportConfiguration() {
        const config = {
            integrations: {},
            exporters: Array.from(this.exporters.keys()),
            config: this.config,
        };

        for (const [name, integration] of this.integrations.entries()) {
            config.integrations[name] = {
                type: integration.type,
                config: {
                    ...integration.config,
                    apiKey: integration.config.apiKey ? '[REDACTED]' : null,
                },
            };
        }

        return config;
    }

    /**
     * Para exportação automática
     */
    stopAutoExport() {
        if (this.exportInterval) {
            clearInterval(this.exportInterval);
            this.exportInterval = null;
        }
    }

    /**
     * Destrói a instância e limpa recursos
     */
    destroy() {
        this.stopAutoExport();
        this.integrations.clear();
        this.exporters.clear();

        structuredLogger.info('Observability integration destroyed');
    }

    // Métodos privados
    _setupDefaultIntegrations() {
        // Console integration (sempre disponível)
        this.registerIntegration('console', this.integrationTypes.CONSOLE, {
            dataTypes: [this.dataTypes.METRICS, this.dataTypes.LOGS, this.dataTypes.ALERTS],
            logLevel: 'info',
        });

        // Local Storage integration
        this.registerIntegration('localStorage', this.integrationTypes.LOCAL_STORAGE, {
            dataTypes: [this.dataTypes.METRICS, this.dataTypes.LOGS, this.dataTypes.EVENTS],
            storageKey: 'observability_data',
            maxEntries: 1000,
        });

        // Registrar exportadores padrão
        this._registerDefaultExporters();
    }

    _registerDefaultExporters() {
        // Exportador Prometheus
        this.registerExporter(
            'prometheus',
            (data) => {
                return realtimeMetrics.exportPrometheusFormat();
            },
            {
                dataTypes: [this.dataTypes.METRICS],
                format: 'prometheus',
            }
        );

        // Exportador JSON
        this.registerExporter(
            'json',
            (data) => {
                return JSON.stringify(data, null, 2);
            },
            {
                dataTypes: [this.dataTypes.METRICS, this.dataTypes.LOGS, this.dataTypes.EVENTS],
                format: 'json',
            }
        );

        // Exportador CSV
        this.registerExporter(
            'csv',
            (data) => {
                return this._convertToCSV(data);
            },
            {
                dataTypes: [this.dataTypes.METRICS],
                format: 'csv',
            }
        );
    }

    _startAutoExport() {
        this.exportInterval = setInterval(async () => {
            try {
                // Exportar métricas
                await this.exportCurrentMetrics();

                // Exportar logs (menos frequente)
                if (Date.now() % (5 * 60 * 1000) < this.config.exportInterval) {
                    await this.exportRecentLogs();
                }

                // Exportar eventos de analytics
                await this.exportAnalyticsEvents();

                // Exportar alertas se houver
                const activeAlerts = criticalAlerts.getActiveAlerts();
                if (activeAlerts.length > 0) {
                    await this.exportActiveAlerts();
                }
            } catch (error) {
                structuredLogger.error('Auto export failed', error, {
                    category: 'observability',
                });
            }
        }, this.config.exportInterval);

        structuredLogger.info('Auto export started', {
            interval: this.config.exportInterval,
            integrations: this.integrations.size,
        });
    }

    async _prepareExportData(dataType, data, integration) {
        let exportData = {
            timestamp: Date.now(),
            dataType,
            source: 'observability-integration',
            data,
        };

        // Aplicar transformações específicas do tipo de integração
        switch (integration.type) {
            case this.integrationTypes.PROMETHEUS:
                exportData = this._formatForPrometheus(data);
                break;
            case this.integrationTypes.DATADOG:
                exportData = this._formatForDatadog(data);
                break;
            case this.integrationTypes.ELASTIC:
                exportData = this._formatForElastic(data);
                break;
            default:
                // Manter formato padrão
                break;
        }

        // Aplicar compressão se habilitada
        if (this.config.enableCompression && integration.config.compression) {
            exportData = await this._compressData(exportData);
        }

        // Aplicar criptografia se habilitada
        if (this.config.enableEncryption && integration.config.encryption) {
            exportData = await this._encryptData(exportData, integration.config.encryptionKey);
        }

        return exportData;
    }

    async _sendToIntegration(integration, data) {
        const startTime = Date.now();

        try {
            switch (integration.type) {
                case this.integrationTypes.CONSOLE:
                    return this._sendToConsole(data, integration.config);

                case this.integrationTypes.LOCAL_STORAGE:
                    return this._sendToLocalStorage(data, integration.config);

                case this.integrationTypes.CUSTOM_WEBHOOK:
                case this.integrationTypes.PROMETHEUS:
                case this.integrationTypes.GRAFANA:
                case this.integrationTypes.DATADOG:
                case this.integrationTypes.NEW_RELIC:
                case this.integrationTypes.ELASTIC:
                    return this._sendToHTTPEndpoint(data, integration.config);

                default:
                    throw new Error(`Unsupported integration type: ${integration.type}`);
            }
        } finally {
            const duration = Date.now() - startTime;
            this._updateExporterStats(integration.name, duration, true);
        }
    }

    _sendToConsole(data, config) {
        const logLevel = config.logLevel || 'info';
        const message = `[Observability Export] ${data.dataType}`;

        switch (logLevel) {
            case 'debug':
                console.debug(message, data);
                break;
            case 'info':
                console.info(message, data);
                break;
            case 'warn':
                console.warn(message, data);
                break;
            case 'error':
                console.error(message, data);
                break;
            default:
                console.log(message, data);
        }

        return { success: true, method: 'console' };
    }

    _sendToLocalStorage(data, config) {
        const storageKey = config.storageKey || 'observability_data';
        const maxEntries = config.maxEntries || 1000;

        try {
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const updated = [data, ...existing].slice(0, maxEntries);
            localStorage.setItem(storageKey, JSON.stringify(updated));

            return { success: true, method: 'localStorage', entries: updated.length };
        } catch (error) {
            // Fallback para sessionStorage
            try {
                const existing = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
                const updated = [data, ...existing].slice(0, maxEntries);
                sessionStorage.setItem(storageKey, JSON.stringify(updated));

                return { success: true, method: 'sessionStorage', entries: updated.length };
            } catch (fallbackError) {
                throw new Error('Failed to store in both localStorage and sessionStorage');
            }
        }
    }

    async _sendToHTTPEndpoint(data, config) {
        if (!config.endpoint) {
            throw new Error('No endpoint configured');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...config.headers,
        };

        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(config.timeout || 30000),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json().catch(() => ({}));

        return {
            success: true,
            method: 'http',
            status: response.status,
            response: result,
        };
    }

    _formatForPrometheus(data) {
        // Converter dados para formato Prometheus
        if (data.system) {
            return {
                metrics: [
                    `system_memory_used_mb ${data.system.memory || 0}`,
                    `system_cpu_usage_percent ${data.system.cpu || 0}`,
                    `system_online ${data.system.online ? 1 : 0}`,
                ].join('\n'),
            };
        }
        return data;
    }

    _formatForDatadog(data) {
        // Converter dados para formato Datadog
        const series = [];

        if (data.system) {
            series.push({
                metric: 'system.memory.used',
                points: [[Math.floor(Date.now() / 1000), data.system.memory || 0]],
                tags: ['source:webapp'],
            });

            series.push({
                metric: 'system.cpu.usage',
                points: [[Math.floor(Date.now() / 1000), data.system.cpu || 0]],
                tags: ['source:webapp'],
            });
        }

        return { series };
    }

    _formatForElastic(data) {
        // Converter dados para formato Elasticsearch
        return {
            '@timestamp': new Date().toISOString(),
            service: 'webapp-monitoring',
            ...data,
        };
    }

    async _compressData(data) {
        // Implementação simplificada de compressão
        // Em produção, usaria bibliotecas como pako ou similar
        const jsonString = JSON.stringify(data);
        return {
            compressed: true,
            originalSize: jsonString.length,
            data: btoa(jsonString), // Base64 como placeholder
        };
    }

    async _encryptData(data, key) {
        // Implementação simplificada de criptografia
        // Em produção, usaria Web Crypto API
        return {
            encrypted: true,
            algorithm: 'placeholder',
            data: btoa(JSON.stringify(data)),
        };
    }

    _updateExporterStats(integrationName, duration, success) {
        const integration = this.integrations.get(integrationName);
        if (integration) {
            // Atualizar estatísticas básicas já é feito no método principal
            // Aqui poderia adicionar métricas mais detalhadas
        }
    }

    _getDataSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch (error) {
            return JSON.stringify(data).length;
        }
    }

    _convertToCSV(data) {
        // Implementação simplificada de conversão para CSV
        if (!data || typeof data !== 'object') return '';

        const rows = [];

        // Cabeçalhos
        if (data.system) {
            rows.push('timestamp,metric,value');
            rows.push(`${Date.now()},memory,${data.system.memory || 0}`);
            rows.push(`${Date.now()},cpu,${data.system.cpu || 0}`);
            rows.push(`${Date.now()},online,${data.system.online ? 1 : 0}`);
        }

        return rows.join('\n');
    }
}

// Instância global
const observabilityIntegration = new ObservabilityIntegration();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.observabilityIntegration = observabilityIntegration;
}

export default observabilityIntegration;
