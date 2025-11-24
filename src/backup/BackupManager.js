/**
 * Sistema de Backup e Recuperação Automática
 * Gerencia backup de dados críticos, versionamento e recuperação
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';

class BackupManager {
    constructor() {
        this.config = {
            enableAutoBackup: true,
            backupInterval: 300000, // 5 minutos
            maxBackupVersions: 50,
            compressionEnabled: true,
            encryptionEnabled: false, // Para futuro
            syncEnabled: true,
            storageQuotaLimit: 50 * 1024 * 1024, // 50MB
            criticalDataKeys: [
                'sessionData',
                'userConfigurations',
                'tradingHistory',
                'performanceMetrics',
                'systemSettings',
            ],
        };

        this.backupStorage = {
            local: 'localStorage',
            session: 'sessionStorage',
            indexedDB: 'backupDB',
        };

        this.backupQueue = [];
        this.isBackupInProgress = false;
        this.lastBackupTime = null;
        this.backupHistory = [];

        this._initializeBackupSystem();
    }

    /**
     * Inicializa o sistema de backup
     */
    async _initializeBackupSystem() {
        try {
            await this._setupStorageQuotaMonitoring();
            await this._loadBackupHistory();
            await this._startAutomaticBackup();
            await this._setupFailureRecovery();

            structuredLogger.info('Backup system initialized', {
                autoBackup: this.config.enableAutoBackup,
                interval: this.config.backupInterval,
                maxVersions: this.config.maxBackupVersions,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'backup_initialization',
                severity: 'high',
            });
        }
    }

    /**
     * Executa backup completo de dados críticos
     */
    async performFullBackup(options = {}) {
        if (this.isBackupInProgress) {
            structuredLogger.warn('Backup already in progress, skipping');
            return { success: false, reason: 'backup_in_progress' };
        }

        this.isBackupInProgress = true;
        const backupId = this._generateBackupId();
        const startTime = Date.now();

        try {
            structuredLogger.info('Starting full backup', { backupId });

            const backupData = await this._collectCriticalData();
            const compressedData = this.config.compressionEnabled
                ? this._compressData(backupData)
                : backupData;

            const backupMetadata = {
                id: backupId,
                timestamp: Date.now(),
                type: 'full',
                size: JSON.stringify(compressedData).length,
                checksum: this._calculateChecksum(compressedData),
                version: this._getNextVersion(),
                compressed: this.config.compressionEnabled,
            };

            // Salvar em múltiplos locais para redundância
            await this._saveToMultipleStorages(backupId, {
                metadata: backupMetadata,
                data: compressedData,
            });

            // Atualizar histórico
            this.backupHistory.push(backupMetadata);
            await this._cleanupOldBackups();

            this.lastBackupTime = Date.now();
            const duration = Date.now() - startTime;

            structuredLogger.info('Full backup completed', {
                backupId,
                duration,
                size: backupMetadata.size,
                version: backupMetadata.version,
            });

            return {
                success: true,
                backupId,
                metadata: backupMetadata,
                duration,
            };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'full_backup',
                backupId,
                severity: 'high',
            });

            return { success: false, error: error.message };
        } finally {
            this.isBackupInProgress = false;
        }
    }

    /**
     * Executa backup incremental (apenas mudanças)
     */
    async performIncrementalBackup() {
        if (this.isBackupInProgress) return { success: false, reason: 'backup_in_progress' };

        this.isBackupInProgress = true;
        const backupId = this._generateBackupId();

        try {
            const lastBackup = this._getLastBackup();
            if (!lastBackup) {
                // Se não há backup anterior, fazer backup completo
                return await this.performFullBackup();
            }

            const currentData = await this._collectCriticalData();
            const changes = this._detectChanges(lastBackup.data, currentData);

            if (Object.keys(changes).length === 0) {
                structuredLogger.debug('No changes detected, skipping incremental backup');
                return { success: true, reason: 'no_changes' };
            }

            const backupMetadata = {
                id: backupId,
                timestamp: Date.now(),
                type: 'incremental',
                baseVersion: lastBackup.version,
                size: JSON.stringify(changes).length,
                checksum: this._calculateChecksum(changes),
                version: this._getNextVersion(),
                changesCount: Object.keys(changes).length,
            };

            await this._saveToMultipleStorages(backupId, {
                metadata: backupMetadata,
                data: changes,
            });

            this.backupHistory.push(backupMetadata);
            this.lastBackupTime = Date.now();

            structuredLogger.info('Incremental backup completed', {
                backupId,
                changesCount: backupMetadata.changesCount,
                size: backupMetadata.size,
            });

            return { success: true, backupId, metadata: backupMetadata };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'incremental_backup',
                backupId,
                severity: 'medium',
            });

            return { success: false, error: error.message };
        } finally {
            this.isBackupInProgress = false;
        }
    }

    /**
     * Restaura dados de um backup específico
     */
    async restoreFromBackup(backupId, options = {}) {
        try {
            structuredLogger.info('Starting restore operation', { backupId });

            const backup = await this._loadBackupById(backupId);
            if (!backup) {
                throw new Error(`Backup ${backupId} not found`);
            }

            // Criar backup de segurança antes da restauração
            if (options.createSafetyBackup !== false) {
                await this.performFullBackup();
            }

            let dataToRestore;

            if (backup.metadata.type === 'incremental') {
                // Reconstruir dados completos a partir de incrementais
                dataToRestore = await this._reconstructFromIncrementals(backupId);
            } else {
                dataToRestore = backup.data;
            }

            // Descomprimir se necessário
            if (backup.metadata.compressed) {
                dataToRestore = this._decompressData(dataToRestore);
            }

            // Validar integridade
            const checksum = this._calculateChecksum(dataToRestore);
            if (checksum !== backup.metadata.checksum) {
                throw new Error('Backup integrity check failed');
            }

            // Restaurar dados
            await this._restoreDataToSystem(dataToRestore);

            structuredLogger.info('Restore completed successfully', {
                backupId,
                version: backup.metadata.version,
                timestamp: backup.metadata.timestamp,
            });

            return { success: true, backupId, restoredVersion: backup.metadata.version };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'restore_operation',
                backupId,
                severity: 'critical',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Recuperação automática de falhas
     */
    async performAutomaticRecovery(errorContext = {}) {
        try {
            structuredLogger.warn('Initiating automatic recovery', errorContext);

            // Tentar recuperação em ordem de prioridade
            const recoveryStrategies = [
                () => this._recoverFromSessionStorage(),
                () => this._recoverFromLastBackup(),
                () => this._recoverFromSafeMode(),
                () => this._resetToDefaults(),
            ];

            for (const strategy of recoveryStrategies) {
                try {
                    const result = await strategy();
                    if (result.success) {
                        structuredLogger.info('Automatic recovery successful', {
                            strategy: strategy.name,
                            result,
                        });
                        return result;
                    }
                } catch (strategyError) {
                    structuredLogger.warn('Recovery strategy failed', {
                        strategy: strategy.name,
                        error: strategyError.message,
                    });
                }
            }

            throw new Error('All recovery strategies failed');
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'automatic_recovery',
                severity: 'critical',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Sincronização entre dispositivos (usando localStorage como base)
     */
    async syncWithRemoteDevices() {
        if (!this.config.syncEnabled) return { success: false, reason: 'sync_disabled' };

        try {
            const localData = await this._collectCriticalData();
            const syncKey = this._generateSyncKey();

            // Simular sincronização (em produção seria com servidor/cloud)
            const syncData = {
                deviceId: this._getDeviceId(),
                timestamp: Date.now(),
                data: localData,
                checksum: this._calculateChecksum(localData),
            };

            // Salvar dados de sincronização
            localStorage.setItem(`sync_${syncKey}`, JSON.stringify(syncData));

            structuredLogger.info('Device sync completed', {
                syncKey,
                deviceId: syncData.deviceId,
                dataSize: JSON.stringify(localData).length,
            });

            return { success: true, syncKey, timestamp: syncData.timestamp };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'device_sync',
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Rollback para versão anterior
     */
    async rollbackToVersion(version) {
        try {
            const backup = this.backupHistory.find((b) => b.version === version);
            if (!backup) {
                throw new Error(`Version ${version} not found`);
            }

            structuredLogger.info('Starting rollback operation', { version });

            const result = await this.restoreFromBackup(backup.id, {
                createSafetyBackup: true,
            });

            if (result.success) {
                structuredLogger.info('Rollback completed successfully', { version });
            }

            return result;
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'rollback_operation',
                version,
                severity: 'high',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Obtém estatísticas do sistema de backup
     */
    getBackupStats() {
        const totalBackups = this.backupHistory.length;
        const fullBackups = this.backupHistory.filter((b) => b.type === 'full').length;
        const incrementalBackups = this.backupHistory.filter(
            (b) => b.type === 'incremental'
        ).length;
        const totalSize = this.backupHistory.reduce((sum, b) => sum + (b.size || 0), 0);

        return {
            totalBackups,
            fullBackups,
            incrementalBackups,
            totalSize,
            lastBackupTime: this.lastBackupTime,
            isAutoBackupEnabled: this.config.enableAutoBackup,
            nextBackupIn: this.config.enableAutoBackup
                ? Math.max(0, (this.lastBackupTime || 0) + this.config.backupInterval - Date.now())
                : null,
            storageUsage: this._calculateStorageUsage(),
            oldestBackup:
                this.backupHistory.length > 0
                    ? Math.min(...this.backupHistory.map((b) => b.timestamp))
                    : null,
            newestBackup:
                this.backupHistory.length > 0
                    ? Math.max(...this.backupHistory.map((b) => b.timestamp))
                    : null,
        };
    }

    // Métodos privados
    async _collectCriticalData() {
        const criticalData = {};

        // Coletar dados do sessionStore se disponível
        if (window.sessionStore) {
            criticalData.sessionData = window.sessionStore.getState();
        }

        // Coletar configurações do usuário
        criticalData.userConfigurations = {
            capitalInicial: window.config?.capitalInicial || 15000,
            stopWinPerc: window.config?.stopWinPerc || 12,
            stopLossPerc: window.config?.stopLossPerc || 20,
            theme: localStorage.getItem('app-theme') || 'dark',
        };

        // Coletar histórico de trading se disponível
        if (window.state?.historicoCombinado) {
            criticalData.tradingHistory = window.state.historicoCombinado.slice(-100); // Últimas 100 operações
        }

        // Coletar métricas de performance
        if (window.realtimeMetrics) {
            criticalData.performanceMetrics = window.realtimeMetrics.getDashboardSnapshot();
        }

        // Configurações do sistema
        criticalData.systemSettings = {
            features: window.Features || {},
            timestamp: Date.now(),
            version: '1.0.0',
        };

        return criticalData;
    }

    _compressData(data) {
        // Implementação simples de compressão (em produção usaria bibliotecas especializadas)
        const jsonString = JSON.stringify(data);
        return {
            compressed: true,
            originalSize: jsonString.length,
            data: btoa(jsonString), // Base64 como compressão básica
        };
    }

    _decompressData(compressedData) {
        if (!compressedData.compressed) return compressedData;

        try {
            const jsonString = atob(compressedData.data);
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Failed to decompress backup data');
        }
    }

    _calculateChecksum(data) {
        // Implementação simples de checksum
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    _generateBackupId() {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getNextVersion() {
        const lastVersion =
            this.backupHistory.length > 0
                ? Math.max(...this.backupHistory.map((b) => b.version || 0))
                : 0;
        return lastVersion + 1;
    }

    async _saveToMultipleStorages(backupId, backupData) {
        const storagePromises = [];

        // localStorage
        storagePromises.push(this._saveToStorage('localStorage', `backup_${backupId}`, backupData));

        // sessionStorage como backup secundário
        storagePromises.push(
            this._saveToStorage('sessionStorage', `backup_${backupId}`, backupData)
        );

        await Promise.allSettled(storagePromises);
    }

    async _saveToStorage(storageType, key, data) {
        try {
            const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
            storage.setItem(key, JSON.stringify(data));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                await this._handleStorageQuotaExceeded(storageType);
                // Tentar novamente após limpeza
                const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
                storage.setItem(key, JSON.stringify(data));
            } else {
                throw error;
            }
        }
    }

    async _loadBackupById(backupId) {
        try {
            // Tentar carregar do localStorage primeiro
            const localData = localStorage.getItem(`backup_${backupId}`);
            if (localData) {
                return JSON.parse(localData);
            }

            // Fallback para sessionStorage
            const sessionData = sessionStorage.getItem(`backup_${backupId}`);
            if (sessionData) {
                return JSON.parse(sessionData);
            }

            return null;
        } catch (error) {
            structuredLogger.error('Failed to load backup', { backupId, error: error.message });
            return null;
        }
    }

    _detectChanges(oldData, newData) {
        const changes = {};

        for (const key in newData) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                changes[key] = newData[key];
            }
        }

        return changes;
    }

    _getLastBackup() {
        if (this.backupHistory.length === 0) return null;

        const lastBackup = this.backupHistory[this.backupHistory.length - 1];
        return this._loadBackupById(lastBackup.id);
    }

    async _startAutomaticBackup() {
        if (!this.config.enableAutoBackup) return;

        // Backup inicial
        setTimeout(() => {
            this.performIncrementalBackup();
        }, 10000); // 10 segundos após inicialização

        // Backups periódicos
        setInterval(() => {
            this.performIncrementalBackup();
        }, this.config.backupInterval);

        structuredLogger.info('Automatic backup started', {
            interval: this.config.backupInterval,
        });
    }

    async _cleanupOldBackups() {
        if (this.backupHistory.length <= this.config.maxBackupVersions) return;

        // Manter apenas as versões mais recentes
        const toRemove = this.backupHistory
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, this.backupHistory.length - this.config.maxBackupVersions);

        for (const backup of toRemove) {
            try {
                localStorage.removeItem(`backup_${backup.id}`);
                sessionStorage.removeItem(`backup_${backup.id}`);
            } catch (error) {
                structuredLogger.warn('Failed to cleanup old backup', {
                    backupId: backup.id,
                    error: error.message,
                });
            }
        }

        this.backupHistory = this.backupHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.config.maxBackupVersions);

        structuredLogger.info('Old backups cleaned up', {
            removed: toRemove.length,
            remaining: this.backupHistory.length,
        });
    }

    async _handleStorageQuotaExceeded(storageType) {
        structuredLogger.warn('Storage quota exceeded, cleaning up', { storageType });

        // Remover backups mais antigos primeiro
        const oldBackups = this.backupHistory
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, Math.floor(this.backupHistory.length / 2));

        for (const backup of oldBackups) {
            try {
                const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
                storage.removeItem(`backup_${backup.id}`);
            } catch (error) {
                // Ignorar erros de remoção
            }
        }
    }

    _calculateStorageUsage() {
        let totalSize = 0;

        try {
            for (let key in localStorage) {
                if (key.startsWith('backup_')) {
                    totalSize += localStorage.getItem(key).length;
                }
            }
        } catch (error) {
            // Ignorar erros de acesso
        }

        return {
            used: totalSize,
            limit: this.config.storageQuotaLimit,
            percentage: (totalSize / this.config.storageQuotaLimit) * 100,
        };
    }

    async _loadBackupHistory() {
        try {
            const historyData = localStorage.getItem('backup_history');
            if (historyData) {
                this.backupHistory = JSON.parse(historyData);
            }
        } catch (error) {
            structuredLogger.warn('Failed to load backup history', { error: error.message });
            this.backupHistory = [];
        }
    }

    async _setupStorageQuotaMonitoring() {
        // Monitorar uso de armazenamento
        setInterval(() => {
            const usage = this._calculateStorageUsage();
            if (usage.percentage > 80) {
                structuredLogger.warn('Storage usage high', usage);
                this._cleanupOldBackups();
            }
        }, 60000); // Verificar a cada minuto
    }

    async _setupFailureRecovery() {
        // Escutar erros críticos para recuperação automática
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message.includes('critical')) {
                this.performAutomaticRecovery({
                    error: event.error.message,
                    timestamp: Date.now(),
                });
            }
        });

        // Escutar eventos de beforeunload para backup de emergência
        window.addEventListener('beforeunload', () => {
            if (!this.isBackupInProgress) {
                this.performIncrementalBackup();
            }
        });
    }

    _generateSyncKey() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    async _restoreDataToSystem(data) {
        // Restaurar dados do sessionStore
        if (data.sessionData && window.sessionStore) {
            window.sessionStore.setState(data.sessionData);
        }

        // Restaurar configurações
        if (data.userConfigurations) {
            Object.assign(window.config || {}, data.userConfigurations);
        }

        // Restaurar histórico de trading
        if (data.tradingHistory && window.state) {
            window.state.historicoCombinado = data.tradingHistory;
        }

        // Restaurar configurações do sistema
        if (data.systemSettings) {
            if (data.systemSettings.theme) {
                localStorage.setItem('app-theme', data.systemSettings.theme);
            }
        }

        structuredLogger.info('Data restored to system', {
            restoredKeys: Object.keys(data),
        });
    }

    async _recoverFromSessionStorage() {
        // Implementação de recuperação do sessionStorage
        return { success: false, reason: 'not_implemented' };
    }

    async _recoverFromLastBackup() {
        if (this.backupHistory.length === 0) {
            return { success: false, reason: 'no_backups_available' };
        }

        const lastBackup = this.backupHistory[this.backupHistory.length - 1];
        return await this.restoreFromBackup(lastBackup.id);
    }

    async _recoverFromSafeMode() {
        // Implementação de modo seguro
        return { success: false, reason: 'not_implemented' };
    }

    async _resetToDefaults() {
        // Reset para configurações padrão
        const defaultData = {
            userConfigurations: {
                capitalInicial: 15000,
                stopWinPerc: 12,
                stopLossPerc: 20,
                theme: 'dark',
            },
            systemSettings: {
                features: {},
                timestamp: Date.now(),
                version: '1.0.0',
            },
        };

        await this._restoreDataToSystem(defaultData);
        return { success: true, reason: 'reset_to_defaults' };
    }

    async _reconstructFromIncrementals(targetBackupId) {
        // Implementação de reconstrução a partir de backups incrementais
        // Por simplicidade, retornar dados do backup direto
        const backup = await this._loadBackupById(targetBackupId);
        return backup ? backup.data : null;
    }
}

// Instância global
const backupManager = new BackupManager();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.backupManager = backupManager;
}

export default backupManager;
