/**
 * Interface de Administração e Configuração
 * Painel centralizado para gerenciar todas as configurações do sistema
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';
import configurationVersioning from '../backup/ConfigurationVersioning.js';

class AdminInterface {
    constructor() {
        this.config = {
            enableAdminMode: false,
            requireAuthentication: false,
            autoSave: true,
            backupOnChanges: true,
            showAdvancedOptions: false,
        };

        this.sections = new Map();
        this.currentSection = null;
        this.isVisible = false;
        this.isDirty = false;

        this._initializeAdminInterface();
    }

    /**
     * Inicializa a interface de administração
     */
    async _initializeAdminInterface() {
        try {
            await this._setupSections();
            await this._createAdminPanel();
            this._setupKeyboardShortcuts();

            structuredLogger.info('Admin interface initialized', {
                sections: this.sections.size,
                adminMode: this.config.enableAdminMode,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'admin_interface_init',
                severity: 'medium',
            });
        }
    }

    /**
     * Mostra/oculta o painel de administração
     */
    toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('admin-panel');

        if (panel) {
            panel.style.display = this.isVisible ? 'block' : 'none';

            if (this.isVisible) {
                this._refreshCurrentSection();
            }
        }

        structuredLogger.debug('Admin panel toggled', { visible: this.isVisible });
    }

    /**
     * Mostra seção específica
     */
    showSection(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section) {
            throw new Error(`Section ${sectionId} not found`);
        }

        this.currentSection = sectionId;
        this._renderSection(section);

        structuredLogger.debug('Admin section shown', { section: sectionId });
    }

    /**
     * Salva configurações atuais
     */
    async saveConfiguration() {
        try {
            if (this.config.backupOnChanges) {
                await configurationVersioning.createVersion('Admin panel changes', {
                    type: 'admin_save',
                    timestamp: Date.now(),
                });
            }

            const config = this._collectConfiguration();
            await this._applyConfiguration(config);

            this.isDirty = false;
            this._updateSaveStatus('saved');

            structuredLogger.info('Configuration saved via admin panel', {
                sections: Object.keys(config).length,
            });

            return { success: true };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'admin_save_configuration',
                severity: 'medium',
            });

            this._updateSaveStatus('error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Restaura configurações para valores padrão
     */
    async resetToDefaults() {
        try {
            const confirmed = confirm(
                'Tem certeza que deseja restaurar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.'
            );

            if (!confirmed) {
                return { success: false, reason: 'cancelled' };
            }

            // Criar backup antes do reset
            await configurationVersioning.createVersion('Pre-reset backup', {
                type: 'pre_reset_backup',
                timestamp: Date.now(),
            });

            const defaultConfig = this._getDefaultConfiguration();
            await this._applyConfiguration(defaultConfig);

            this._refreshAllSections();
            this.isDirty = false;

            structuredLogger.info('Configuration reset to defaults');

            return { success: true };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'admin_reset_defaults',
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Exporta configuração atual
     */
    exportConfiguration(format = 'json') {
        try {
            const config = this._collectConfiguration();
            const exportData = {
                metadata: {
                    exportedAt: Date.now(),
                    version: '1.0.0',
                    format,
                },
                configuration: config,
            };

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(exportData, null, 2);
                case 'csv':
                    return this._convertConfigToCSV(config);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'admin_export_configuration',
                format,
                severity: 'low',
            });

            throw error;
        }
    }

    /**
     * Importa configuração
     */
    async importConfiguration(configData, format = 'json') {
        try {
            let config;

            switch (format.toLowerCase()) {
                case 'json':
                    const parsed = JSON.parse(configData);
                    config = parsed.configuration || parsed;
                    break;
                default:
                    throw new Error(`Unsupported import format: ${format}`);
            }

            // Validar configuração
            this._validateConfiguration(config);

            // Criar backup antes da importação
            await configurationVersioning.createVersion('Pre-import backup', {
                type: 'pre_import_backup',
                timestamp: Date.now(),
            });

            // Aplicar configuração
            await this._applyConfiguration(config);
            this._refreshAllSections();

            structuredLogger.info('Configuration imported successfully', {
                format,
                sections: Object.keys(config).length,
            });

            return { success: true };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'admin_import_configuration',
                format,
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    // Métodos privados
    async _setupSections() {
        // Seção: Configurações Gerais
        this.sections.set('general', {
            id: 'general',
            title: 'Configurações Gerais',
            icon: '⚙️',
            fields: [
                {
                    id: 'capitalInicial',
                    label: 'Capital Inicial',
                    type: 'number',
                    value: () => window.config?.capitalInicial || 15000,
                    min: 1000,
                    max: 1000000,
                    step: 100,
                },
                {
                    id: 'stopWinPerc',
                    label: 'Stop Win (%)',
                    type: 'number',
                    value: () => window.config?.stopWinPerc || 12,
                    min: 1,
                    max: 100,
                    step: 0.5,
                },
                {
                    id: 'stopLossPerc',
                    label: 'Stop Loss (%)',
                    type: 'number',
                    value: () => window.config?.stopLossPerc || 20,
                    min: 1,
                    max: 100,
                    step: 0.5,
                },
                {
                    id: 'theme',
                    label: 'Tema',
                    type: 'select',
                    options: [
                        { value: 'dark', label: 'Escuro' },
                        { value: 'light', label: 'Claro' },
                        { value: 'auto', label: 'Automático' },
                    ],
                    value: () => localStorage.getItem('app-theme') || 'dark',
                },
            ],
        });

        // Seção: Monitoramento
        this.sections.set('monitoring', {
            id: 'monitoring',
            title: 'Sistema de Monitoramento',
            icon: '📊',
            fields: [
                {
                    id: 'enableMonitoring',
                    label: 'Habilitar Monitoramento',
                    type: 'checkbox',
                    value: () => window.monitoringSystem?.initialized || false,
                },
                {
                    id: 'metricsInterval',
                    label: 'Intervalo de Métricas (ms)',
                    type: 'number',
                    value: () => window.realtimeMetrics?.config?.updateInterval || 5000,
                    min: 1000,
                    max: 60000,
                    step: 1000,
                },
                {
                    id: 'enableHealthDashboard',
                    label: 'Dashboard de Saúde',
                    type: 'checkbox',
                    value: () => !!window.healthDashboard,
                },
                {
                    id: 'dashboardPosition',
                    label: 'Posição do Dashboard',
                    type: 'select',
                    options: [
                        { value: 'top-left', label: 'Superior Esquerdo' },
                        { value: 'top-right', label: 'Superior Direito' },
                        { value: 'bottom-left', label: 'Inferior Esquerdo' },
                        { value: 'bottom-right', label: 'Inferior Direito' },
                    ],
                    value: () => window.healthDashboard?.config?.position || 'bottom-right',
                },
            ],
        });

        // Seção: Backup e Recuperação
        this.sections.set('backup', {
            id: 'backup',
            title: 'Backup e Recuperação',
            icon: '💾',
            fields: [
                {
                    id: 'enableAutoBackup',
                    label: 'Backup Automático',
                    type: 'checkbox',
                    value: () => window.backupManager?.config?.enableAutoBackup || false,
                },
                {
                    id: 'backupInterval',
                    label: 'Intervalo de Backup (min)',
                    type: 'number',
                    value: () => (window.backupManager?.config?.backupInterval || 300000) / 60000,
                    min: 1,
                    max: 60,
                    step: 1,
                },
                {
                    id: 'maxBackupVersions',
                    label: 'Máximo de Versões',
                    type: 'number',
                    value: () => window.backupManager?.config?.maxBackupVersions || 50,
                    min: 5,
                    max: 200,
                    step: 5,
                },
                {
                    id: 'enableCompression',
                    label: 'Compressão de Backup',
                    type: 'checkbox',
                    value: () => window.backupManager?.config?.compressionEnabled || true,
                },
            ],
        });

        // Seção: Notificações
        this.sections.set('notifications', {
            id: 'notifications',
            title: 'Notificações',
            icon: '🔔',
            fields: [
                {
                    id: 'enableNotifications',
                    label: 'Habilitar Notificações',
                    type: 'checkbox',
                    value: () => window.smartNotifications?.config?.enableNotifications || true,
                },
                {
                    id: 'enableDesktopNotifications',
                    label: 'Notificações Desktop',
                    type: 'checkbox',
                    value: () =>
                        window.smartNotifications?.config?.enableDesktopNotifications || true,
                },
                {
                    id: 'enableSound',
                    label: 'Som das Notificações',
                    type: 'checkbox',
                    value: () => window.smartNotifications?.config?.enableSound || true,
                },
                {
                    id: 'maxNotifications',
                    label: 'Máximo de Notificações',
                    type: 'number',
                    value: () => window.smartNotifications?.config?.maxNotifications || 50,
                    min: 10,
                    max: 200,
                    step: 10,
                },
            ],
        });

        // Seção: IA e Recomendações
        this.sections.set('ai', {
            id: 'ai',
            title: 'IA e Recomendações',
            icon: '🤖',
            fields: [
                {
                    id: 'enableAI',
                    label: 'Habilitar IA',
                    type: 'checkbox',
                    value: () => window.aiRecommendations?.config?.enableMLAnalysis || true,
                },
                {
                    id: 'confidenceThreshold',
                    label: 'Limite de Confiança',
                    type: 'number',
                    value: () => window.aiRecommendations?.config?.confidenceThreshold || 0.6,
                    min: 0.1,
                    max: 1.0,
                    step: 0.1,
                },
                {
                    id: 'maxRecommendations',
                    label: 'Máximo de Recomendações',
                    type: 'number',
                    value: () => window.aiRecommendations?.config?.maxRecommendations || 10,
                    min: 1,
                    max: 50,
                    step: 1,
                },
                {
                    id: 'enableLearning',
                    label: 'Aprendizado Contínuo',
                    type: 'checkbox',
                    value: () => window.aiRecommendations?.config?.learningEnabled || true,
                },
            ],
        });

        // Seção: Performance
        this.sections.set('performance', {
            id: 'performance',
            title: 'Performance',
            icon: '⚡',
            fields: [
                {
                    id: 'enableOptimizations',
                    label: 'Otimizações Ativas',
                    type: 'checkbox',
                    value: () => window.charts?._performanceOptimized || false,
                },
                {
                    id: 'memoryThreshold',
                    label: 'Limite de Memória (MB)',
                    type: 'number',
                    value: () => window.recoverySystem?.config?.performanceThreshold?.memory || 500,
                    min: 100,
                    max: 2000,
                    step: 50,
                },
                {
                    id: 'fpsThreshold',
                    label: 'FPS Mínimo',
                    type: 'number',
                    value: () => window.recoverySystem?.config?.performanceThreshold?.fps || 30,
                    min: 15,
                    max: 60,
                    step: 5,
                },
            ],
        });
    }

    async _createAdminPanel() {
        // Criar painel de administração
        const panel = document.createElement('div');
        panel.id = 'admin-panel';
        panel.className = 'admin-panel';
        panel.style.display = 'none';

        panel.innerHTML = `
            <div class="admin-header">
                <h2>🛠️ Painel de Administração</h2>
                <div class="admin-controls">
                    <button id="admin-save" class="admin-btn primary">💾 Salvar</button>
                    <button id="admin-reset" class="admin-btn secondary">🔄 Padrões</button>
                    <button id="admin-export" class="admin-btn secondary">📤 Exportar</button>
                    <button id="admin-import" class="admin-btn secondary">📥 Importar</button>
                    <button id="admin-close" class="admin-btn close">✕</button>
                </div>
            </div>
            <div class="admin-content">
                <div class="admin-sidebar">
                    <nav class="admin-nav" id="admin-nav">
                        <!-- Navegação será inserida aqui -->
                    </nav>
                </div>
                <div class="admin-main">
                    <div id="admin-section-content">
                        <!-- Conteúdo da seção será inserido aqui -->
                    </div>
                </div>
            </div>
            <div class="admin-footer">
                <div class="save-status" id="save-status">Pronto</div>
                <div class="admin-info">
                    Use Ctrl+Alt+A para abrir/fechar este painel
                </div>
            </div>
        `;

        // Adicionar estilos
        this._addAdminStyles();

        // Adicionar event listeners
        this._setupAdminEventListeners(panel);

        // Criar navegação
        this._createNavigation();

        // Adicionar ao DOM
        document.body.appendChild(panel);

        // Mostrar primeira seção
        const firstSection = this.sections.keys().next().value;
        if (firstSection) {
            this.showSection(firstSection);
        }
    }

    _addAdminStyles() {
        if (document.getElementById('admin-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'admin-styles';
        styles.textContent = `
            .admin-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.95);
                z-index: 99999;
                color: #fff;
                font-family: 'Segoe UI', sans-serif;
                display: flex;
                flex-direction: column;
            }
            
            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #333;
                background: #1a1a1a;
            }
            
            .admin-header h2 {
                margin: 0;
                color: #fff;
            }
            
            .admin-controls {
                display: flex;
                gap: 12px;
            }
            
            .admin-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .admin-btn.primary {
                background: #28a745;
                color: white;
            }
            
            .admin-btn.primary:hover {
                background: #34ce57;
            }
            
            .admin-btn.secondary {
                background: #6c757d;
                color: white;
            }
            
            .admin-btn.secondary:hover {
                background: #7c848c;
            }
            
            .admin-btn.close {
                background: #dc3545;
                color: white;
            }
            
            .admin-btn.close:hover {
                background: #e04555;
            }
            
            .admin-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .admin-sidebar {
                width: 250px;
                background: #2a2a2a;
                border-right: 1px solid #333;
                overflow-y: auto;
            }
            
            .admin-nav {
                padding: 20px 0;
            }
            
            .admin-nav-item {
                display: block;
                padding: 12px 20px;
                color: #ccc;
                text-decoration: none;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            
            .admin-nav-item:hover {
                background: #333;
                color: #fff;
            }
            
            .admin-nav-item.active {
                background: #007bff;
                color: #fff;
            }
            
            .admin-main {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .admin-section {
                max-width: 600px;
            }
            
            .admin-section h3 {
                margin: 0 0 20px 0;
                color: #fff;
                font-size: 24px;
            }
            
            .admin-field {
                margin-bottom: 20px;
            }
            
            .admin-field label {
                display: block;
                margin-bottom: 8px;
                color: #ccc;
                font-weight: 500;
            }
            
            .admin-field input,
            .admin-field select {
                width: 100%;
                padding: 10px;
                border: 1px solid #555;
                border-radius: 4px;
                background: #333;
                color: #fff;
                font-size: 14px;
            }
            
            .admin-field input:focus,
            .admin-field select:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
            }
            
            .admin-field input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
            }
            
            .admin-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                border-top: 1px solid #333;
                background: #1a1a1a;
                font-size: 12px;
                color: #888;
            }
            
            .save-status {
                font-weight: 500;
            }
            
            .save-status.saved {
                color: #28a745;
            }
            
            .save-status.dirty {
                color: #ffc107;
            }
            
            .save-status.error {
                color: #dc3545;
            }
        `;

        document.head.appendChild(styles);
    }

    _setupAdminEventListeners(panel) {
        // Botão salvar
        panel.querySelector('#admin-save').addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Botão reset
        panel.querySelector('#admin-reset').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Botão exportar
        panel.querySelector('#admin-export').addEventListener('click', () => {
            const config = this.exportConfiguration('json');
            this._downloadFile('config.json', config, 'application/json');
        });

        // Botão importar
        panel.querySelector('#admin-import').addEventListener('click', () => {
            this._showImportDialog();
        });

        // Botão fechar
        panel.querySelector('#admin-close').addEventListener('click', () => {
            this.toggle();
        });

        // Detectar mudanças nos campos
        panel.addEventListener('input', () => {
            this.isDirty = true;
            this._updateSaveStatus('dirty');
        });

        panel.addEventListener('change', () => {
            this.isDirty = true;
            this._updateSaveStatus('dirty');
        });
    }

    _createNavigation() {
        const nav = document.getElementById('admin-nav');
        nav.innerHTML = '';

        for (const [id, section] of this.sections) {
            const navItem = document.createElement('button');
            navItem.className = 'admin-nav-item';
            navItem.textContent = `${section.icon} ${section.title}`;
            navItem.onclick = () => {
                // Remover active de todos
                nav.querySelectorAll('.admin-nav-item').forEach((item) => {
                    item.classList.remove('active');
                });
                // Adicionar active ao clicado
                navItem.classList.add('active');
                // Mostrar seção
                this.showSection(id);
            };

            nav.appendChild(navItem);
        }

        // Ativar primeiro item
        const firstItem = nav.querySelector('.admin-nav-item');
        if (firstItem) {
            firstItem.classList.add('active');
        }
    }

    _renderSection(section) {
        const content = document.getElementById('admin-section-content');

        let html = `
            <div class="admin-section">
                <h3>${section.icon} ${section.title}</h3>
        `;

        for (const field of section.fields) {
            const currentValue = field.value();

            html += `<div class="admin-field">`;
            html += `<label for="field-${field.id}">${field.label}</label>`;

            switch (field.type) {
                case 'text':
                case 'number':
                    html += `<input type="${field.type}" id="field-${field.id}" value="${currentValue}"`;
                    if (field.min !== undefined) html += ` min="${field.min}"`;
                    if (field.max !== undefined) html += ` max="${field.max}"`;
                    if (field.step !== undefined) html += ` step="${field.step}"`;
                    html += `>`;
                    break;

                case 'checkbox':
                    html += `<input type="checkbox" id="field-${field.id}" ${currentValue ? 'checked' : ''}>`;
                    break;

                case 'select':
                    html += `<select id="field-${field.id}">`;
                    for (const option of field.options) {
                        const selected = option.value === currentValue ? 'selected' : '';
                        html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                    }
                    html += `</select>`;
                    break;
            }

            html += `</div>`;
        }

        html += `</div>`;
        content.innerHTML = html;
    }

    _collectConfiguration() {
        const config = {};

        for (const [sectionId, section] of this.sections) {
            config[sectionId] = {};

            for (const field of section.fields) {
                const element = document.getElementById(`field-${field.id}`);
                if (element) {
                    if (field.type === 'checkbox') {
                        config[sectionId][field.id] = element.checked;
                    } else if (field.type === 'number') {
                        config[sectionId][field.id] = parseFloat(element.value);
                    } else {
                        config[sectionId][field.id] = element.value;
                    }
                }
            }
        }

        return config;
    }

    async _applyConfiguration(config) {
        // Aplicar configurações gerais
        if (config.general) {
            if (window.config) {
                Object.assign(window.config, {
                    capitalInicial: config.general.capitalInicial,
                    stopWinPerc: config.general.stopWinPerc,
                    stopLossPerc: config.general.stopLossPerc,
                });
            }

            if (config.general.theme) {
                localStorage.setItem('app-theme', config.general.theme);
            }
        }

        // Aplicar configurações de monitoramento
        if (config.monitoring && window.healthDashboard) {
            window.healthDashboard.config.position = config.monitoring.dashboardPosition;
        }

        // Aplicar configurações de backup
        if (config.backup && window.backupManager) {
            window.backupManager.config.enableAutoBackup = config.backup.enableAutoBackup;
            window.backupManager.config.backupInterval = config.backup.backupInterval * 60000;
            window.backupManager.config.maxBackupVersions = config.backup.maxBackupVersions;
            window.backupManager.config.compressionEnabled = config.backup.enableCompression;
        }

        // Aplicar configurações de notificações
        if (config.notifications && window.smartNotifications) {
            Object.assign(window.smartNotifications.config, {
                enableNotifications: config.notifications.enableNotifications,
                enableDesktopNotifications: config.notifications.enableDesktopNotifications,
                enableSound: config.notifications.enableSound,
                maxNotifications: config.notifications.maxNotifications,
            });
        }

        // Aplicar configurações de IA
        if (config.ai && window.aiRecommendations) {
            Object.assign(window.aiRecommendations.config, {
                enableMLAnalysis: config.ai.enableAI,
                confidenceThreshold: config.ai.confidenceThreshold,
                maxRecommendations: config.ai.maxRecommendations,
                learningEnabled: config.ai.enableLearning,
            });
        }

        // Aplicar configurações de performance
        if (config.performance && window.recoverySystem) {
            if (window.recoverySystem.config.performanceThreshold) {
                window.recoverySystem.config.performanceThreshold.memory =
                    config.performance.memoryThreshold;
                window.recoverySystem.config.performanceThreshold.fps =
                    config.performance.fpsThreshold;
            }
        }
    }

    _getDefaultConfiguration() {
        return {
            general: {
                capitalInicial: 15000,
                stopWinPerc: 12,
                stopLossPerc: 20,
                theme: 'dark',
            },
            monitoring: {
                enableMonitoring: true,
                metricsInterval: 5000,
                enableHealthDashboard: true,
                dashboardPosition: 'bottom-right',
            },
            backup: {
                enableAutoBackup: true,
                backupInterval: 5,
                maxBackupVersions: 50,
                enableCompression: true,
            },
            notifications: {
                enableNotifications: true,
                enableDesktopNotifications: true,
                enableSound: true,
                maxNotifications: 50,
            },
            ai: {
                enableAI: true,
                confidenceThreshold: 0.6,
                maxRecommendations: 10,
                enableLearning: true,
            },
            performance: {
                enableOptimizations: true,
                memoryThreshold: 500,
                fpsThreshold: 30,
            },
        };
    }

    _validateConfiguration(config) {
        // Validações básicas
        if (typeof config !== 'object') {
            throw new Error('Invalid configuration format');
        }

        // Validar seções conhecidas
        for (const sectionId of Object.keys(config)) {
            if (!this.sections.has(sectionId)) {
                console.warn(`Unknown configuration section: ${sectionId}`);
            }
        }
    }

    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+A para abrir/fechar painel
            if (e.ctrlKey && e.altKey && e.key === 'a') {
                e.preventDefault();
                this.toggle();
            }

            // Ctrl+S para salvar (quando painel aberto)
            if (this.isVisible && e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveConfiguration();
            }
        });
    }

    _updateSaveStatus(status) {
        const statusEl = document.getElementById('save-status');
        if (!statusEl) return;

        statusEl.className = `save-status ${status}`;

        switch (status) {
            case 'saved':
                statusEl.textContent = '✅ Salvo';
                break;
            case 'dirty':
                statusEl.textContent = '⚠️ Não salvo';
                break;
            case 'error':
                statusEl.textContent = '❌ Erro ao salvar';
                break;
            default:
                statusEl.textContent = 'Pronto';
        }
    }

    _refreshCurrentSection() {
        if (this.currentSection) {
            const section = this.sections.get(this.currentSection);
            if (section) {
                this._renderSection(section);
            }
        }
    }

    _refreshAllSections() {
        this._refreshCurrentSection();
    }

    _downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    _showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.importConfiguration(e.target.result, 'json');
                        alert('Configuração importada com sucesso!');
                    } catch (error) {
                        alert(`Erro ao importar configuração: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    _convertConfigToCSV(config) {
        const rows = ['Section,Field,Value'];

        for (const [sectionId, sectionConfig] of Object.entries(config)) {
            for (const [fieldId, value] of Object.entries(sectionConfig)) {
                rows.push(`${sectionId},${fieldId},${value}`);
            }
        }

        return rows.join('\n');
    }
}

// Instância global
const adminInterface = new AdminInterface();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.adminInterface = adminInterface;
}

export default adminInterface;
