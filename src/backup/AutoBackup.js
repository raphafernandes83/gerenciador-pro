/**
 * @fileoverview Sistema de backup automático
 * Cria backups periódicos e mantém histórico
 */

import { logger } from '../utils/Logger.js';
import { dataExporter } from './DataExporter.js';

/**
 * Gerenciador de backups automáticos
 */
export class AutoBackup {
    constructor() {
        this.storageKey = 'gerenciadorPro_autoBackups';
        this.maxBackups = 10; // Máximo de backups a manter
        this.intervalMinutes = 30; // Intervalo padrão: 30min
        this.intervalId = null;
        this.enabled = false;
    }

    /**
     * Inicia sistema de backup automático
     * @param {number} intervalMinutes - Intervalo em minutos
     */
    start(intervalMinutes = 30) {
        if (this.enabled) {
            logger.warn('Sistema de backup automático já está ativo');
            return;
        }

        this.intervalMinutes = intervalMinutes;
        this.enabled = true;

        // Criar backup imediato
        this.createBackup();

        // Agendar backups periódicos
        this.intervalId = setInterval(() => {
            this.createBackup();
        }, intervalMinutes * 60 * 1000);

        logger.info(`🔄 Backup automático iniciado (intervalo: ${intervalMinutes}min)`);
    }

    /**
     * Para sistema de backup automático
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.enabled = false;
        logger.info('⏸️ Backup automático parado');
    }

    /**
     * Cria um backup
     */
    async createBackup() {
        try {
            logger.debug('💾 Criando backup automático...');

            // Exportar dados
            const data = await dataExporter.exportAll();

            // Criar backup object
            const backup = {
                id: this._generateId(),
                timestamp: Date.now(),
                date: new Date().toISOString(),
                data
            };

            // Salvar no localStorage
            this._saveBackup(backup);

            // Limpar backups antigos
            this._cleanOldBackups();

            logger.info(`✅ Backup automático criado: ${backup.id}`);
            return backup;

        } catch (error) {
            logger.error('Erro ao criar backup automático:', error);
            return null;
        }
    }

    /**
     * Lista todos os backups
     * @returns {Array} Lista de backups
     */
    listBackups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            logger.error('Erro ao listar backups:', error);
            return [];
        }
    }

    /**
     * Obtém um backup específico
     * @param {string} backupId - ID do backup
     * @returns {Object|null} Backup
     */
    getBackup(backupId) {
        const backups = this.listBackups();
        return backups.find(b => b.id === backupId) || null;
    }

    /**
     * Restaura um backup
     * @param {string} backupId - ID do backup
     */
    async restoreBackup(backupId) {
        try {
            const backup = this.getBackup(backupId);

            if (!backup) {
                throw new Error('Backup não encontrado');
            }

            // Confirmar com usuário
            const confirmed = confirm(
                `Deseja restaurar o backup de ${new Date(backup.timestamp).toLocaleString()}?\n\n` +
                'Isso irá sobrescrever suas configurações e dados atuais.'
            );

            if (!confirmed) {
                return { success: false, cancelled: true };
            }

            // Importar dados
            if (window.dataImporter) {
                const result = await window.dataImporter.importData(backup.data);

                logger.info(`✅ Backup ${backupId} restaurado com sucesso`);
                return { success: true, ...result };
            }

            throw new Error('DataImporter não disponível');

        } catch (error) {
            logger.error('Erro ao restaurar backup:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove um backup
     * @param {string} backupId - ID do backup
     */
    deleteBackup(backupId) {
        try {
            const backups = this.listBackups();
            const filtered = backups.filter(b => b.id !== backupId);

            localStorage.setItem(this.storageKey, JSON.stringify(filtered));

            logger.info(`🗑️ Backup ${backupId} removido`);
            return true;

        } catch (error) {
            logger.error('Erro ao remover backup:', error);
            return false;
        }
    }

    /**
     * Remove todos os backups
     */
    clearAllBackups() {
        try {
            const confirmed = confirm('Deseja remover TODOS os backups automáticos?');

            if (confirmed) {
                localStorage.removeItem(this.storageKey);
                logger.info('🗑️ Todos os backups removidos');
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Erro ao limpar backups:', error);
            return false;
        }
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        const backups = this.listBackups();

        if (backups.length === 0) {
            return {
                total: 0,
                oldest: null,
                newest: null,
                totalSize: 0
            };
        }

        const timestamps = backups.map(b => b.timestamp);
        const oldest = new Date(Math.min(...timestamps));
        const newest = new Date(Math.max(...timestamps));

        // Estimar tamanho
        const stored = localStorage.getItem(this.storageKey);
        const totalSize = stored ? (stored.length / 1024).toFixed(2) : 0;

        return {
            total: backups.length,
            oldest: oldest.toLocaleString(),
            newest: newest.toLocaleString(),
            totalSize: `${totalSize} KB`,
            enabled: this.enabled,
            interval: `${this.intervalMinutes} minutos`
        };
    }

    /**
     * Salva backup no localStorage
     * @private
     */
    _saveBackup(backup) {
        try {
            const backups = this.listBackups();
            backups.push(backup);

            localStorage.setItem(this.storageKey, JSON.stringify(backups));

        } catch (error) {
            // Se falhar (quota exceeded), remover backups antigos e tentar novamente
            logger.warn('Limite de storage atingido, limpando backups antigos...');
            this._cleanOldBackups(true);

            const backups = this.listBackups();
            backups.push(backup);
            localStorage.setItem(this.storageKey, JSON.stringify(backups));
        }
    }

    /**
     * Limpa backups antigos
     * @private
     */
    _cleanOldBackups(force = false) {
        const backups = this.listBackups();

        if (backups.length <= this.maxBackups && !force) {
            return;
        }

        // Ordenar por timestamp (mais recente primeiro)
        backups.sort((a, b) => b.timestamp - a.timestamp);

        // Manter apenas os N mais recentes
        const keep = force ? Math.floor(this.maxBackups / 2) : this.maxBackups;
        const toKeep = backups.slice(0, keep);

        localStorage.setItem(this.storageKey, JSON.stringify(toKeep));

        logger.debug(`🧹 Limpeza de backups: mantidos ${toKeep.length}/${backups.length}`);
    }

    /**
     * Gera ID único
     * @private
     */
    _generateId() {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton
export const autoBackup = new AutoBackup();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.autoBackup = autoBackup;
}

export default autoBackup;
