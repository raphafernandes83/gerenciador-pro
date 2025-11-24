/**
 * @fileoverview Interface de usuário para sistema de backup
 * Fornece botões e modais para backup/restore
 */

import { logger } from '../utils/Logger.js';
import { dataExporter } from './DataExporter.js';
import { dataImporter } from './DataImporter.js';
import { autoBackup } from './AutoBackup.js';

/**
 * UI do sistema de backup
 */
export class BackupUI {
    constructor() {
        this.modalId = 'backup-modal';
    }

    /**
     * Inicializa UI de backup
     */
    init() {
        this.createBackupButtons();
        this.createBackupModal();

        logger.info('🎨 BackupUI inicializado');
    }

    /**
     * Cria botões de backup na interface
     */
    createBackupButtons() {
        // Verificar se sidebar existe
        const sidebar = document.querySelector('.sidebar') || document.querySelector('#sidebar');

        if (!sidebar) {
            logger.warn('Sidebar não encontrada,não foi possível adicionar botões de backup');
            return;
        }

        // Container de botões
        const container = document.createElement('div');
        container.className = 'backup-buttons-container';
        container.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
        `;

        // Botão Export
        const exportBtn = this.createButton('📥 Exportar Dados', () => {
            this.showBackupModal();
        });

        // Botão Import
        const importBtn = this.createButton('📤 Importar Dados', () => {
            dataImporter.startImport();
        });

        container.appendChild(exportBtn);
        container.appendChild(importBtn);

        // Adicionar ao final da sidebar
        sidebar.appendChild(container);
    }

    /**
     * Cria botão
     * @private
     */
    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'backup-btn';
        btn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });

        btn.addEventListener('click', onClick);

        return btn;
    }

    /**
     * Cria modal de backup
     */
    createBackupModal() {
        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.className = 'backup-modal';
        modal.innerHTML = `
            <div class="backup-modal-overlay"></div>
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h2>📦 Exportar Dados</h2>
                    <button class="backup-modal-close">&times;</button>
                </div>
                <div class="backup-modal-body">
                    <p>Escolha o que deseja exportar:</p>
                    
                    <div class="backup-options">
                        <button class="backup-option" data-type="full">
                            <span class="icon">💾</span>
                            <span class="title">Exportação Completa</span>
                            <span class="desc">Config + Sessões + Histórico</span>
                        </button>

                        <button class="backup-option" data-type="config">
                            <span class="icon">⚙️</span>
                            <span class="title">Apenas Configurações</span>
                            <span class="desc">Capital, Stop Win/Loss, Payout, etc</span>
                        </button>

                        <button class="backup-option" data-type="session">
                            <span class="icon">📊</span>
                            <span class="title">Sessão Atual</span>
                            <span class="desc">Sessão em andamento</span>
                        </button>

                        <button class="backup-option" data-type="sessions">
                            <span class="icon">📚</span>
                            <span class="title">Todas as Sessões</span>
                            <span class="desc">Histórico completo de sessões</span>
                        </button>
                    </div>

                    <div class="backup-auto-section">
                        <h3>🔄 Backup Automático</h3>
                        <p>Status: <span id="auto-backup-status">Desativado</span></p>
                        <button id="toggle-auto-backup" class="backup-auto-toggle">
                            Ativar Backup Automático
                        </button>
                        <div id="auto-backups-list"></div>
                    </div>
                </div>
            </div>
        `;

        // Adicionar estilos
        this.injectStyles();

        // Adicionar ao body
        document.body.appendChild(modal);

        // Event listeners
        this.setupModalEvents(modal);
    }

    /**
     * Injeta estilos CSS
     */
    injectStyles() {
        if (document.getElementById('backup-ui-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'backup-ui-styles';
        styles.textContent = `
            .backup-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }

            .backup-modal.show {
                display: block;
            }

            .backup-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }

            .backup-modal-content {
                position: relative;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a2e;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                color: white;
            }

            .backup-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .backup-modal-header h2 {
                margin: 0;
                font-size: 24px;
            }

            .backup-modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 32px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: background 0.2s;
            }

            .backup-modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .backup-modal-body {
                padding: 20px;
            }

            .backup-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }

            .backup-option {
                background: linear-gradient(135deg, #2e3440 0%, #3b4252 100%);
                border: 2px solid transparent;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .backup-option:hover {
                border-color: #667eea;
                transform: translateY(-4px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            }

            .backup-option .icon {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .backup-option .title {
                font-size: 16px;
                font-weight: 600;
                color: white;
                margin-bottom: 5px;
                display: block;
            }

            .backup-option .desc {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
                display: block;
            }

            .backup-auto-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .backup-auto-section h3 {
                margin: 0 0 10px 0;
            }

            .backup-auto-toggle {
                width: 100%;
                padding: 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                margin-top: 10px;
                transition: background 0.2s;
            }

            .backup-auto-toggle:hover {
                background: #45a049;
            }

            .backup-auto-toggle.active {
                background: #f44336;
            }

            #auto-backups-list {
                margin-top: 15px;
            }

            .backup-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 10px;
                border-radius: 8px;
                margin: 5px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .backup-item-actions button {
                margin-left: 5px;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .backup-restore-btn {
                background: #2196F3;
                color: white;
            }

            .backup-delete-btn {
                background: #f44336;
                color: white;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Setup de eventos do modal
     */
    setupModalEvents(modal) {
        // Fechar modal
        const closeBtn = modal.querySelector('.backup-modal-close');
        const overlay = modal.querySelector('.backup-modal-overlay');

        closeBtn.addEventListener('click', () => this.hideBackupModal());
        overlay.addEventListener('click', () => this.hideBackupModal());

        // Opções de export
        const options = modal.querySelectorAll('.backup-option');
        options.forEach(option => {
            option.addEventListener('click', async () => {
                const type = option.dataset.type;
                await this.handleExport(type);
            });
        });

        // Toggle auto backup
        const toggleBtn = modal.querySelector('#toggle-auto-backup');
        toggleBtn.addEventListener('click', () => this.toggleAutoBackup());

        // Atualizar lista de backups
        this.updateAutoBackupsList();
    }

    /**
     * Mostra modal
     */
    showBackupModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('show');
            this.updateAutoBackupsList();
            this.updateAutoBackupStatus();
        }
    }

    /**
     * Esconde modal
     */
    hideBackupModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Processa exportação
     */
    async handleExport(type) {
        try {
            const result = await dataExporter.exportAndDownload(type);

            if (result.success) {
                alert(`✅ Exportação concluída!\n\nArquivo: ${result.filename}`);
                this.hideBackupModal();
            } else {
                alert(`❌ Erro na exportação:\n${result.error}`);
            }

        } catch (error) {
            logger.error('Erro ao exportar:', error);
            alert(`❌ Erro ao exportar: ${error.message}`);
        }
    }

    /**
     * Toggle auto backup
     */
    toggleAutoBackup() {
        if (autoBackup.enabled) {
            autoBackup.stop();
        } else {
            autoBackup.start(30); // 30 minutos
        }

        this.updateAutoBackupStatus();
        this.updateAutoBackupsList();
    }

    /**
     * Atualiza status do auto backup
     */
    updateAutoBackupStatus() {
        const statusEl = document.getElementById('auto-backup-status');
        const toggleBtn = document.getElementById('toggle-auto-backup');

        if (statusEl && toggleBtn) {
            if (autoBackup.enabled) {
                statusEl.textContent = `Ativado (${autoBackup.intervalMinutes}min)`;
                statusEl.style.color = '#4CAF50';
                toggleBtn.textContent = 'Desativar Backup Automático';
                toggleBtn.classList.add('active');
            } else {
                statusEl.textContent = 'Desativado';
                statusEl.style.color = '#f44336';
                toggleBtn.textContent = 'Ativar Backup Automático';
                toggleBtn.classList.remove('active');
            }
        }
    }

    /**
     * Atualiza lista de backups automáticos
     */
    updateAutoBackupsList() {
        const listEl = document.getElementById('auto-backups-list');
        if (!listEl) return;

        const backups = autoBackup.listBackups();

        if (backups.length === 0) {
            listEl.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">Nenhum backup automático</p>';
            return;
        }

        listEl.innerHTML = backups.map(backup => `
            <div class="backup-item">
                <span>${new Date(backup.timestamp).toLocaleString()}</span>
                <div class="backup-item-actions">
                    <button class="backup-restore-btn" onclick="window.backupUI.restoreAutoBackup('${backup.id}')">
                        Restaurar
                    </button>
                    <button class="backup-delete-btn" onclick="window.backupUI.deleteAutoBackup('${backup.id}')">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Restaura backup automático
     */
    async restoreAutoBackup(backupId) {
        const result = await autoBackup.restoreBackup(backupId);

        if (result.success) {
            alert('✅ Backup restaurado com sucesso!');
            this.hideBackupModal();

            // Recarregar página para aplicar mudanças
            if (confirm('Deseja recarregar a página para aplicar as mudanças?')) {
                location.reload();
            }
        } else if (!result.cancelled) {
            alert(`❌ Erro ao restaurar: ${result.error}`);
        }
    }

    /**
     * Deleta backup automático
     */
    deleteAutoBackup(backupId) {
        if (confirm('Deseja realmente excluir este backup?')) {
            autoBackup.deleteBackup(backupId);
            this.updateAutoBackupsList();
        }
    }
}

// Singleton
export const backupUI = new BackupUI();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.backupUI = backupUI;
}

export default backupUI;
