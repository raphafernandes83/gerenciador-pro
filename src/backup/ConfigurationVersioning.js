/**
 * Sistema de Versionamento de Configurações
 * Gerencia versões de configurações com rollback e comparação
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';

class ConfigurationVersioning {
    constructor() {
        this.config = {
            maxVersions: 20,
            autoVersioning: true,
            compressionEnabled: true,
            trackChanges: true,
        };

        this.versions = [];
        this.currentVersion = null;
        this.changeHistory = [];

        this._initializeVersioning();
    }

    /**
     * Inicializa o sistema de versionamento
     */
    async _initializeVersioning() {
        try {
            await this._loadVersionHistory();
            await this._createInitialVersion();

            if (this.config.autoVersioning) {
                this._setupAutoVersioning();
            }

            structuredLogger.info('Configuration versioning initialized', {
                versions: this.versions.length,
                currentVersion: this.currentVersion?.id,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'versioning_initialization',
                severity: 'medium',
            });
        }
    }

    /**
     * Cria uma nova versão da configuração
     */
    async createVersion(description = '', metadata = {}) {
        try {
            const currentConfig = this._getCurrentConfiguration();
            const versionId = this._generateVersionId();

            const version = {
                id: versionId,
                timestamp: Date.now(),
                description: description || `Auto-version ${new Date().toLocaleString()}`,
                configuration: this.config.compressionEnabled
                    ? this._compressConfig(currentConfig)
                    : currentConfig,
                metadata: {
                    ...metadata,
                    size: JSON.stringify(currentConfig).length,
                    checksum: this._calculateChecksum(currentConfig),
                    compressed: this.config.compressionEnabled,
                },
                changes: this.currentVersion
                    ? this._detectChanges(this.currentVersion.configuration, currentConfig)
                    : null,
            };

            this.versions.push(version);
            this.currentVersion = version;

            // Limpar versões antigas se necessário
            await this._cleanupOldVersions();

            // Salvar histórico
            await this._saveVersionHistory();

            structuredLogger.info('Configuration version created', {
                versionId,
                description,
                size: version.metadata.size,
                changesCount: version.changes ? Object.keys(version.changes).length : 0,
            });

            return { success: true, versionId, version };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'create_version',
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Restaura uma versão específica
     */
    async restoreVersion(versionId, options = {}) {
        try {
            const version = this.versions.find((v) => v.id === versionId);
            if (!version) {
                throw new Error(`Version ${versionId} not found`);
            }

            // Criar backup da configuração atual antes da restauração
            if (options.createBackup !== false) {
                await this.createVersion('Pre-restore backup', {
                    type: 'pre_restore_backup',
                    targetVersion: versionId,
                });
            }

            // Descomprimir configuração se necessário
            let configToRestore = version.configuration;
            if (version.metadata.compressed) {
                configToRestore = this._decompressConfig(configToRestore);
            }

            // Validar integridade
            const checksum = this._calculateChecksum(configToRestore);
            if (checksum !== version.metadata.checksum) {
                throw new Error('Configuration integrity check failed');
            }

            // Aplicar configuração
            await this._applyConfiguration(configToRestore);

            // Registrar mudança
            this._recordChange('restore', {
                fromVersion: this.currentVersion?.id,
                toVersion: versionId,
                timestamp: Date.now(),
            });

            structuredLogger.info('Configuration version restored', {
                versionId,
                description: version.description,
                timestamp: version.timestamp,
            });

            return { success: true, versionId, restoredAt: Date.now() };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'restore_version',
                versionId,
                severity: 'high',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Compara duas versões
     */
    compareVersions(versionId1, versionId2) {
        try {
            const version1 = this.versions.find((v) => v.id === versionId1);
            const version2 = this.versions.find((v) => v.id === versionId2);

            if (!version1 || !version2) {
                throw new Error('One or both versions not found');
            }

            const config1 = version1.metadata.compressed
                ? this._decompressConfig(version1.configuration)
                : version1.configuration;
            const config2 = version2.metadata.compressed
                ? this._decompressConfig(version2.configuration)
                : version2.configuration;

            const differences = this._detectChanges(config1, config2);

            return {
                version1: {
                    id: version1.id,
                    timestamp: version1.timestamp,
                    description: version1.description,
                },
                version2: {
                    id: version2.id,
                    timestamp: version2.timestamp,
                    description: version2.description,
                },
                differences,
                differenceCount: Object.keys(differences).length,
                identical: Object.keys(differences).length === 0,
            };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'compare_versions',
                versionId1,
                versionId2,
                severity: 'low',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Lista todas as versões disponíveis
     */
    listVersions(options = {}) {
        const { limit = 10, sortBy = 'timestamp', order = 'desc' } = options;

        let sortedVersions = [...this.versions];

        // Ordenar
        sortedVersions.sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return order === 'desc' ? bVal - aVal : aVal - bVal;
        });

        // Limitar resultados
        if (limit > 0) {
            sortedVersions = sortedVersions.slice(0, limit);
        }

        return sortedVersions.map((version) => ({
            id: version.id,
            timestamp: version.timestamp,
            description: version.description,
            size: version.metadata.size,
            changesCount: version.changes ? Object.keys(version.changes).length : 0,
            isCurrent: version.id === this.currentVersion?.id,
        }));
    }

    /**
     * Obtém estatísticas do versionamento
     */
    getVersioningStats() {
        const totalVersions = this.versions.length;
        const totalSize = this.versions.reduce((sum, v) => sum + (v.metadata.size || 0), 0);
        const averageSize = totalVersions > 0 ? totalSize / totalVersions : 0;

        const oldestVersion =
            this.versions.length > 0 ? Math.min(...this.versions.map((v) => v.timestamp)) : null;
        const newestVersion =
            this.versions.length > 0 ? Math.max(...this.versions.map((v) => v.timestamp)) : null;

        return {
            totalVersions,
            totalSize,
            averageSize,
            oldestVersion,
            newestVersion,
            currentVersion: this.currentVersion?.id,
            autoVersioning: this.config.autoVersioning,
            compressionEnabled: this.config.compressionEnabled,
            changeHistory: this.changeHistory.length,
        };
    }

    /**
     * Exporta histórico de versões
     */
    exportVersionHistory(format = 'json') {
        const exportData = {
            metadata: {
                exportedAt: Date.now(),
                totalVersions: this.versions.length,
                format,
            },
            versions: this.versions,
            changeHistory: this.changeHistory,
            currentVersion: this.currentVersion?.id,
        };

        switch (format.toLowerCase()) {
            case 'csv':
                return this._convertToCSV(exportData);
            case 'json':
            default:
                return JSON.stringify(exportData, null, 2);
        }
    }

    // Métodos privados
    _getCurrentConfiguration() {
        return {
            // Configurações do usuário
            userSettings: {
                capitalInicial: window.config?.capitalInicial || 15000,
                stopWinPerc: window.config?.stopWinPerc || 12,
                stopLossPerc: window.config?.stopLossPerc || 20,
                theme: localStorage.getItem('app-theme') || 'dark',
            },

            // Features flags
            features: window.Features || {},

            // Configurações do sistema
            systemSettings: {
                monitoringEnabled: window.monitoringSystem?.initialized || false,
                backupEnabled: window.backupManager?.config?.enableAutoBackup || false,
                performanceOptimized: window.charts?._performanceOptimized || false,
            },

            // Configurações de UI
            uiSettings: {
                dashboardPosition: window.healthDashboard?.config?.position || 'bottom-right',
                dashboardTheme: window.healthDashboard?.config?.theme || 'dark',
                dashboardMinimized: window.healthDashboard?.config?.minimized || false,
            },

            // Timestamp da configuração
            timestamp: Date.now(),
            version: '1.0.0',
        };
    }

    _compressConfig(config) {
        const jsonString = JSON.stringify(config);
        return {
            compressed: true,
            originalSize: jsonString.length,
            data: btoa(jsonString),
        };
    }

    _decompressConfig(compressedConfig) {
        if (!compressedConfig.compressed) return compressedConfig;

        try {
            const jsonString = atob(compressedConfig.data);
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Failed to decompress configuration');
        }
    }

    _calculateChecksum(config) {
        const str = JSON.stringify(config);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    _detectChanges(oldConfig, newConfig) {
        const changes = {};

        const compareObjects = (old, current, path = '') => {
            for (const key in current) {
                const currentPath = path ? `${path}.${key}` : key;

                if (typeof current[key] === 'object' && current[key] !== null) {
                    if (!old[key] || typeof old[key] !== 'object') {
                        changes[currentPath] = {
                            type: 'added',
                            oldValue: old[key],
                            newValue: current[key],
                        };
                    } else {
                        compareObjects(old[key], current[key], currentPath);
                    }
                } else if (old[key] !== current[key]) {
                    changes[currentPath] = {
                        type: old[key] === undefined ? 'added' : 'modified',
                        oldValue: old[key],
                        newValue: current[key],
                    };
                }
            }

            // Verificar propriedades removidas
            for (const key in old) {
                if (!(key in current)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    changes[currentPath] = {
                        type: 'removed',
                        oldValue: old[key],
                        newValue: undefined,
                    };
                }
            }
        };

        compareObjects(oldConfig, newConfig);
        return changes;
    }

    async _applyConfiguration(config) {
        try {
            // Aplicar configurações do usuário
            if (config.userSettings) {
                Object.assign(window.config || {}, config.userSettings);
            }

            // Aplicar features flags
            if (config.features) {
                Object.assign(window.Features || {}, config.features);
            }

            // Aplicar configurações de UI
            if (config.uiSettings && window.healthDashboard) {
                window.healthDashboard.config = {
                    ...window.healthDashboard.config,
                    ...config.uiSettings,
                };
            }

            // Aplicar tema
            if (config.userSettings?.theme) {
                localStorage.setItem('app-theme', config.userSettings.theme);
            }

            structuredLogger.info('Configuration applied successfully', {
                appliedSections: Object.keys(config),
            });
        } catch (error) {
            throw new Error(`Failed to apply configuration: ${error.message}`);
        }
    }

    _generateVersionId() {
        return `config_v${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async _createInitialVersion() {
        if (this.versions.length === 0) {
            await this.createVersion('Initial configuration', {
                type: 'initial',
                automatic: true,
            });
        }
    }

    _setupAutoVersioning() {
        // Criar versão antes de mudanças importantes
        const originalSetState = window.sessionStore?.setState;
        if (originalSetState) {
            window.sessionStore.setState = (patch) => {
                // Criar versão antes de mudanças significativas
                if (this._isSignificantChange(patch)) {
                    this.createVersion('Auto-version before state change', {
                        type: 'auto_pre_change',
                        trigger: 'state_change',
                    });
                }
                return originalSetState.call(window.sessionStore, patch);
            };
        }

        // Versão periódica (a cada 30 minutos se houver mudanças)
        setInterval(
            () => {
                if (this._hasConfigurationChanged()) {
                    this.createVersion('Periodic auto-version', {
                        type: 'auto_periodic',
                        interval: '30min',
                    });
                }
            },
            30 * 60 * 1000
        );

        structuredLogger.info('Auto-versioning enabled');
    }

    _isSignificantChange(patch) {
        // Considerar mudanças significativas
        const significantKeys = [
            'capitalInicial',
            'stopWinPerc',
            'stopLossPerc',
            'isSessionActive',
        ];

        return Object.keys(patch).some((key) => significantKeys.includes(key));
    }

    _hasConfigurationChanged() {
        if (!this.currentVersion) return true;

        const currentConfig = this._getCurrentConfiguration();
        const lastConfig = this.currentVersion.metadata.compressed
            ? this._decompressConfig(this.currentVersion.configuration)
            : this.currentVersion.configuration;

        const changes = this._detectChanges(lastConfig, currentConfig);
        return Object.keys(changes).length > 0;
    }

    _recordChange(type, details) {
        this.changeHistory.push({
            id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: Date.now(),
            details,
        });

        // Manter apenas os últimos 100 registros
        if (this.changeHistory.length > 100) {
            this.changeHistory = this.changeHistory.slice(-100);
        }
    }

    async _loadVersionHistory() {
        try {
            const historyData = localStorage.getItem('config_versions');
            if (historyData) {
                const parsed = JSON.parse(historyData);
                this.versions = parsed.versions || [];
                this.changeHistory = parsed.changeHistory || [];
                this.currentVersion = parsed.currentVersion || null;
            }
        } catch (error) {
            structuredLogger.warn('Failed to load version history', {
                error: error.message,
            });
            this.versions = [];
            this.changeHistory = [];
            this.currentVersion = null;
        }
    }

    async _saveVersionHistory() {
        try {
            const historyData = {
                versions: this.versions,
                changeHistory: this.changeHistory,
                currentVersion: this.currentVersion,
                lastSaved: Date.now(),
            };

            localStorage.setItem('config_versions', JSON.stringify(historyData));
        } catch (error) {
            structuredLogger.error('Failed to save version history', {
                error: error.message,
            });
        }
    }

    async _cleanupOldVersions() {
        if (this.versions.length <= this.config.maxVersions) return;

        // Manter versões mais recentes e algumas importantes
        const importantVersions = this.versions.filter(
            (v) =>
                v.metadata.type === 'initial' ||
                v.metadata.type === 'manual' ||
                v.id === this.currentVersion?.id
        );

        const regularVersions = this.versions
            .filter((v) => !importantVersions.includes(v))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.config.maxVersions - importantVersions.length);

        this.versions = [...importantVersions, ...regularVersions].sort(
            (a, b) => a.timestamp - b.timestamp
        );

        structuredLogger.info('Old configuration versions cleaned up', {
            remaining: this.versions.length,
            important: importantVersions.length,
        });
    }

    _convertToCSV(exportData) {
        const rows = [];
        rows.push('Version ID,Timestamp,Description,Size,Changes Count,Type');

        exportData.versions.forEach((version) => {
            const row = [
                version.id,
                new Date(version.timestamp).toISOString(),
                version.description.replace(/,/g, ';'),
                version.metadata.size,
                version.changes ? Object.keys(version.changes).length : 0,
                version.metadata.type || 'unknown',
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }
}

// Instância global
const configurationVersioning = new ConfigurationVersioning();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.configurationVersioning = configurationVersioning;
}

export default configurationVersioning;
