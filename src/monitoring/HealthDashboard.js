/**
 * Dashboard de Saúde do Sistema
 * Interface centralizada para monitoramento em tempo real
 */

import structuredLogger from './StructuredLogger.js';
import errorTracker from './ErrorTracker.js';
import realtimeMetrics from './RealtimeMetrics.js';
import usageAnalytics from './UsageAnalytics.js';
import criticalAlerts from './CriticalAlerts.js';

class HealthDashboard {
    constructor() {
        this.dashboardElement = null;
        this.updateInterval = null;
        this.config = {
            updateFrequency: 5000, // 5 segundos
            autoRefresh: true,
            showDetailedMetrics: true,
            enableRealTimeUpdates: true,
            theme: 'dark',
            position: 'bottom-right',
            minimized: false,
            persistState: true,
        };

        this.healthStatus = {
            HEALTHY: 'healthy',
            WARNING: 'warning',
            DEGRADED: 'degraded',
            CRITICAL: 'critical',
            UNKNOWN: 'unknown',
        };

        this.widgets = new Map();
        this.subscribers = new Set();

        this._loadPersistedState();
        this._setupEventListeners();
    }

    /**
     * Inicializa o dashboard
     * @param {Object} options - Opções de inicialização
     */
    initialize(options = {}) {
        this.config = { ...this.config, ...options };

        this._createDashboardUI();
        this._registerDefaultWidgets();

        if (this.config.autoRefresh) {
            this.startAutoRefresh();
        }

        // Garantir que o dashboard esteja visível no topo da pilha
        this.ensureVisible();

        structuredLogger.info(
            'Health dashboard initialized',
            {
                updateFrequency: this.config.updateFrequency,
                autoRefresh: this.config.autoRefresh,
                widgetCount: this.widgets.size,
            },
            {
                category: 'dashboard',
                tags: ['initialization'],
            }
        );
    }

    /**
     * Inicia atualização automática
     */
    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.refresh();
        }, this.config.updateFrequency);

        // Primeira atualização imediata
        this.refresh();
    }

    /**
     * Para atualização automática
     */
    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Atualiza todos os dados do dashboard
     */
    async refresh() {
        try {
            const dashboardData = await this._collectDashboardData();
            this._updateUI(dashboardData);
            this._notifySubscribers(dashboardData);

            // Salvar estado se habilitado
            if (this.config.persistState) {
                this._saveState();
            }
        } catch (error) {
            structuredLogger.error('Dashboard refresh failed', error, {
                category: 'dashboard',
            });
        }
    }

    /**
     * Registra um widget customizado
     * @param {string} name - Nome do widget
     * @param {Object} widget - Configuração do widget
     */
    registerWidget(name, widget) {
        const {
            title = name,
            dataSource,
            renderer,
            updateFrequency = this.config.updateFrequency,
            priority = 1,
            size = 'medium',
        } = widget;

        this.widgets.set(name, {
            name,
            title,
            dataSource,
            renderer,
            updateFrequency,
            priority,
            size,
            lastUpdate: null,
            data: null,
            error: null,
        });

        structuredLogger.debug('Widget registered', {
            widgetName: name,
            title,
            priority,
            size,
        });
    }

    /**
     * Remove um widget
     * @param {string} name - Nome do widget
     */
    unregisterWidget(name) {
        this.widgets.delete(name);
        this._removeWidgetFromUI(name);
    }

    /**
     * Subscreve a atualizações do dashboard
     * @param {Function} callback - Callback para atualizações
     * @returns {Function} Função para cancelar subscrição
     */
    subscribe(callback) {
        this.subscribers.add(callback);

        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Obtém dados atuais do dashboard
     * @returns {Object} Dados do dashboard
     */
    getCurrentData() {
        return this._collectDashboardData();
    }

    /**
     * Obtém status geral de saúde do sistema
     * @returns {string} Status de saúde
     */
    getOverallHealth() {
        const alertsData = criticalAlerts.getDashboard();
        const errorStats = errorTracker.getErrorStats({
            since: Date.now() - 5 * 60 * 1000, // 5 minutos
        });

        // Verificar alertas críticos
        if (alertsData.summary.criticalAlerts > 0) {
            return this.healthStatus.CRITICAL;
        }

        // Verificar erros recentes
        if (errorStats.bySeverity.critical > 0) {
            return this.healthStatus.CRITICAL;
        }

        if (errorStats.bySeverity.high > 2) {
            return this.healthStatus.DEGRADED;
        }

        if (alertsData.summary.activeAlerts > 5 || errorStats.bySeverity.high > 0) {
            return this.healthStatus.WARNING;
        }

        return this.healthStatus.HEALTHY;
    }

    /**
     * Mostra/esconde o dashboard
     */
    toggle() {
        if (this.dashboardElement) {
            const isVisible = this.dashboardElement.style.display !== 'none';
            this.dashboardElement.style.display = isVisible ? 'none' : 'block';
            this.config.minimized = isVisible;
        }
    }

    /**
     * Garante que o dashboard esteja visível e acima de tudo
     */
    ensureVisible() {
        if (!this.dashboardElement) return;
        this.dashboardElement.style.display = 'block';
        this.dashboardElement.style.visibility = 'visible';
        this.dashboardElement.style.opacity = '1';
        this.dashboardElement.style.pointerEvents = 'auto';
        this.dashboardElement.style.zIndex = '2147483647';
    }

    /**
     * Minimiza/maximiza o dashboard
     */
    toggleMinimize() {
        this.config.minimized = !this.config.minimized;
        this._updateDashboardLayout();
    }

    /**
     * Exporta dados do dashboard
     * @param {string} format - Formato de exportação (json, csv)
     * @returns {string} Dados exportados
     */
    exportData(format = 'json') {
        const data = this.getCurrentData();

        switch (format.toLowerCase()) {
            case 'csv':
                return this._convertToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Destrói o dashboard e limpa recursos
     */
    destroy() {
        this.stopAutoRefresh();

        if (this.dashboardElement && this.dashboardElement.parentNode) {
            this.dashboardElement.parentNode.removeChild(this.dashboardElement);
        }

        this.subscribers.clear();
        this.widgets.clear();

        structuredLogger.info('Health dashboard destroyed');
    }

    // Métodos privados
    async _collectDashboardData() {
        const now = Date.now();
        const last5Minutes = now - 5 * 60 * 1000;
        const lastHour = now - 60 * 60 * 1000;

        const data = {
            timestamp: now,
            overallHealth: this.getOverallHealth(),
            system: {
                memory: realtimeMetrics.getCurrentValue('system.memory.used'),
                cpu: realtimeMetrics.getCurrentValue('system.cpu.usage'),
                online: realtimeMetrics.getCurrentValue('system.online'),
                uptime: now - (performance.timing?.navigationStart || now),
            },
            performance: {
                fps: realtimeMetrics.getCurrentValue('performance.fps'),
                loadTime: realtimeMetrics.getCurrentValue('performance.page.load_time'),
                metrics: realtimeMetrics.getDashboardSnapshot(),
            },
            errors: {
                recent: errorTracker.getErrorStats({ since: last5Minutes }),
                hourly: errorTracker.getErrorStats({ since: lastHour }),
                patterns: errorTracker.getErrorStats().patterns,
            },
            alerts: criticalAlerts.getDashboard(),
            usage: {
                features: usageAnalytics.getFeatureUsageStats({ timeRange: lastHour }),
                sessions: usageAnalytics._getSessionStats(lastHour),
                interactions: realtimeMetrics.getCurrentValue('user.interactions'),
            },
            logs: {
                stats: structuredLogger.getStats(),
                recentErrors: structuredLogger.getLogs({
                    level: 'ERROR',
                    since: last5Minutes,
                    limit: 10,
                }),
            },
        };

        // Coletar dados dos widgets customizados
        for (const [name, widget] of this.widgets.entries()) {
            try {
                if (widget.dataSource && typeof widget.dataSource === 'function') {
                    widget.data = await widget.dataSource();
                    widget.lastUpdate = now;
                    widget.error = null;
                }
            } catch (error) {
                widget.error = error.message;
                structuredLogger.error('Widget data collection failed', error, {
                    widgetName: name,
                });
            }
        }

        return data;
    }

    _createDashboardUI() {
        // Criar elemento principal do dashboard
        this.dashboardElement = document.createElement('div');
        this.dashboardElement.id = 'health-dashboard';
        this.dashboardElement.className = `health-dashboard ${this.config.theme}`;

        // Aplicar estilos
        this._applyDashboardStyles();

        // Criar estrutura HTML
        this.dashboardElement.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <span class="health-indicator" id="health-indicator">●</span>
                    <span>System Health</span>
                </div>
                <div class="dashboard-controls">
                    <button id="dashboard-refresh" title="Refresh">⟳</button>
                    <button id="dashboard-minimize" title="Minimize">−</button>
                    <button id="dashboard-close" title="Close">×</button>
                </div>
            </div>
            <div class="dashboard-content" id="dashboard-content">
                <div class="widgets-container" id="widgets-container">
                    <!-- Widgets serão inseridos aqui -->
                </div>
            </div>
            <div class="dashboard-footer">
                <span class="last-update" id="last-update">Never updated</span>
                <span class="auto-refresh" id="auto-refresh-status">
                    ${this.config.autoRefresh ? '🔄 Auto' : '⏸ Manual'}
                </span>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(this.dashboardElement);

        // Configurar event listeners
        this._setupDashboardEventListeners();

        // Aplicar layout inicial
        this._updateDashboardLayout();
    }

    _applyDashboardStyles() {
        const styles = `
            .health-dashboard {
                position: fixed;
                ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                width: 400px;
                max-height: 600px;
                background: ${this.config.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
                border: 1px solid ${this.config.theme === 'dark' ? '#333' : '#ddd'};
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                color: ${this.config.theme === 'dark' ? '#fff' : '#333'};
                z-index: 2147483647;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: ${this.config.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
                border-bottom: 1px solid ${this.config.theme === 'dark' ? '#333' : '#ddd'};
            }
            
            .dashboard-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }
            
            .health-indicator {
                font-size: 16px;
                transition: color 0.3s ease;
            }
            
            .health-indicator.healthy { color: #4CAF50; }
            .health-indicator.warning { color: #FF9800; }
            .health-indicator.degraded { color: #FF5722; }
            .health-indicator.critical { color: #F44336; }
            
            .dashboard-controls {
                display: flex;
                gap: 4px;
            }
            
            .dashboard-controls button {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .dashboard-controls button:hover {
                background: ${this.config.theme === 'dark' ? '#333' : '#e0e0e0'};
            }
            
            .dashboard-content {
                max-height: 500px;
                overflow-y: auto;
                padding: 12px;
            }
            
            .widgets-container {
                display: grid;
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .widget {
                background: ${this.config.theme === 'dark' ? '#2a2a2a' : '#f9f9f9'};
                border: 1px solid ${this.config.theme === 'dark' ? '#333' : '#e0e0e0'};
                border-radius: 6px;
                padding: 12px;
                transition: all 0.2s ease;
            }
            
            .widget:hover {
                border-color: ${this.config.theme === 'dark' ? '#555' : '#ccc'};
            }
            
            .widget-title {
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .widget-content {
                font-size: 11px;
                line-height: 1.4;
            }
            
            .metric-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            
            .metric-value {
                font-weight: 500;
            }
            
            .metric-value.good { color: #4CAF50; }
            .metric-value.warning { color: #FF9800; }
            .metric-value.critical { color: #F44336; }
            
            .dashboard-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 12px;
                background: ${this.config.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
                border-top: 1px solid ${this.config.theme === 'dark' ? '#333' : '#ddd'};
                font-size: 10px;
                color: ${this.config.theme === 'dark' ? '#aaa' : '#666'};
            }
            
            .health-dashboard.minimized .dashboard-content {
                display: none;
            }
            
            .health-dashboard.minimized {
                height: auto;
            }
        `;

        // Adicionar estilos ao documento se não existirem
        if (!document.getElementById('health-dashboard-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'health-dashboard-styles';
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
    }

    _setupDashboardEventListeners() {
        const refreshBtn = this.dashboardElement.querySelector('#dashboard-refresh');
        const minimizeBtn = this.dashboardElement.querySelector('#dashboard-minimize');
        const closeBtn = this.dashboardElement.querySelector('#dashboard-close');

        refreshBtn?.addEventListener('click', () => {
            this.refresh();
        });

        minimizeBtn?.addEventListener('click', () => {
            this.toggleMinimize();
        });

        closeBtn?.addEventListener('click', () => {
            this.toggle();
        });

        // Tornar o dashboard arrastável
        this._makeDraggable();
    }

    _makeDraggable() {
        const header = this.dashboardElement.querySelector('.dashboard-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                this.dashboardElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });
    }

    _registerDefaultWidgets() {
        // Widget de Sistema
        this.registerWidget('system', {
            title: 'System Metrics',
            dataSource: () => ({
                memory: realtimeMetrics.getCurrentValue('system.memory.used'),
                cpu: realtimeMetrics.getCurrentValue('system.cpu.usage'),
                online: realtimeMetrics.getCurrentValue('system.online'),
            }),
            renderer: (data) => `
                <div class="metric-row">
                    <span>Memory:</span>
                    <span class="metric-value ${data.memory > 500 ? 'critical' : data.memory > 300 ? 'warning' : 'good'}">
                        ${data.memory?.toFixed(1) || 0} MB
                    </span>
                </div>
                <div class="metric-row">
                    <span>CPU:</span>
                    <span class="metric-value ${data.cpu > 80 ? 'critical' : data.cpu > 60 ? 'warning' : 'good'}">
                        ${data.cpu?.toFixed(1) || 0}%
                    </span>
                </div>
                <div class="metric-row">
                    <span>Status:</span>
                    <span class="metric-value ${data.online ? 'good' : 'critical'}">
                        ${data.online ? 'Online' : 'Offline'}
                    </span>
                </div>
            `,
            priority: 1,
        });

        // Widget de Performance
        this.registerWidget('performance', {
            title: 'Performance',
            dataSource: () => ({
                fps: realtimeMetrics.getCurrentValue('performance.fps'),
                loadTime: realtimeMetrics.getCurrentValue('performance.page.load_time'),
            }),
            renderer: (data) => `
                <div class="metric-row">
                    <span>FPS:</span>
                    <span class="metric-value ${data.fps < 30 ? 'critical' : data.fps < 50 ? 'warning' : 'good'}">
                        ${data.fps?.toFixed(0) || 0}
                    </span>
                </div>
                <div class="metric-row">
                    <span>Load Time:</span>
                    <span class="metric-value ${data.loadTime > 3000 ? 'critical' : data.loadTime > 1000 ? 'warning' : 'good'}">
                        ${data.loadTime ? (data.loadTime / 1000).toFixed(2) + 's' : 'N/A'}
                    </span>
                </div>
            `,
            priority: 2,
        });

        // Widget de Erros
        this.registerWidget('errors', {
            title: 'Recent Errors',
            dataSource: () => {
                const stats = errorTracker.getErrorStats({
                    since: Date.now() - 5 * 60 * 1000,
                });
                return {
                    total: stats.total,
                    critical: stats.bySeverity.critical || 0,
                    high: stats.bySeverity.high || 0,
                    recoveryRate: stats.recoveryRate,
                };
            },
            renderer: (data) => `
                <div class="metric-row">
                    <span>Total (5min):</span>
                    <span class="metric-value ${data.total > 10 ? 'critical' : data.total > 5 ? 'warning' : 'good'}">
                        ${data.total}
                    </span>
                </div>
                <div class="metric-row">
                    <span>Critical:</span>
                    <span class="metric-value ${data.critical > 0 ? 'critical' : 'good'}">
                        ${data.critical}
                    </span>
                </div>
                <div class="metric-row">
                    <span>Recovery Rate:</span>
                    <span class="metric-value ${data.recoveryRate < 50 ? 'critical' : data.recoveryRate < 80 ? 'warning' : 'good'}">
                        ${data.recoveryRate.toFixed(1)}%
                    </span>
                </div>
            `,
            priority: 3,
        });

        // Widget de Alertas
        this.registerWidget('alerts', {
            title: 'Active Alerts',
            dataSource: () => {
                const dashboard = criticalAlerts.getDashboard();
                return {
                    active: dashboard.summary.activeAlerts,
                    critical: dashboard.summary.criticalAlerts,
                    last24h: dashboard.summary.alertsLast24h,
                };
            },
            renderer: (data) => `
                <div class="metric-row">
                    <span>Active:</span>
                    <span class="metric-value ${data.active > 5 ? 'critical' : data.active > 2 ? 'warning' : 'good'}">
                        ${data.active}
                    </span>
                </div>
                <div class="metric-row">
                    <span>Critical:</span>
                    <span class="metric-value ${data.critical > 0 ? 'critical' : 'good'}">
                        ${data.critical}
                    </span>
                </div>
                <div class="metric-row">
                    <span>Last 24h:</span>
                    <span class="metric-value">
                        ${data.last24h}
                    </span>
                </div>
            `,
            priority: 4,
        });
    }

    _updateUI(data) {
        // Atualizar indicador de saúde
        const healthIndicator = this.dashboardElement.querySelector('#health-indicator');
        if (healthIndicator) {
            healthIndicator.className = `health-indicator ${data.overallHealth}`;
        }

        // Atualizar widgets
        const widgetsContainer = this.dashboardElement.querySelector('#widgets-container');
        if (widgetsContainer) {
            widgetsContainer.innerHTML = '';

            // Ordenar widgets por prioridade
            const sortedWidgets = Array.from(this.widgets.values()).sort(
                (a, b) => a.priority - b.priority
            );

            sortedWidgets.forEach((widget) => {
                const widgetElement = this._createWidgetElement(widget);
                widgetsContainer.appendChild(widgetElement);
            });
        }

        // Atualizar timestamp
        const lastUpdate = this.dashboardElement.querySelector('#last-update');
        if (lastUpdate) {
            lastUpdate.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    _createWidgetElement(widget) {
        const element = document.createElement('div');
        element.className = 'widget';
        element.id = `widget-${widget.name}`;

        let content = '';
        if (widget.error) {
            content = `<div style="color: #F44336;">Error: ${widget.error}</div>`;
        } else if (widget.data && widget.renderer) {
            try {
                content = widget.renderer(widget.data);
            } catch (error) {
                content = `<div style="color: #F44336;">Render error: ${error.message}</div>`;
            }
        } else {
            content = '<div>No data available</div>';
        }

        element.innerHTML = `
            <div class="widget-title">
                <span>${widget.title}</span>
                <span style="font-size: 10px; color: #888;">
                    ${widget.lastUpdate ? new Date(widget.lastUpdate).toLocaleTimeString() : 'Never'}
                </span>
            </div>
            <div class="widget-content">
                ${content}
            </div>
        `;

        return element;
    }

    _updateDashboardLayout() {
        if (this.dashboardElement) {
            this.dashboardElement.classList.toggle('minimized', this.config.minimized);

            const minimizeBtn = this.dashboardElement.querySelector('#dashboard-minimize');
            if (minimizeBtn) {
                minimizeBtn.textContent = this.config.minimized ? '+' : '−';
                minimizeBtn.title = this.config.minimized ? 'Maximize' : 'Minimize';
            }
        }
    }

    _removeWidgetFromUI(widgetName) {
        const widgetElement = this.dashboardElement?.querySelector(`#widget-${widgetName}`);
        if (widgetElement) {
            widgetElement.remove();
        }
    }

    _notifySubscribers(data) {
        this.subscribers.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                structuredLogger.error('Dashboard subscriber error', error);
            }
        });
    }

    _setupEventListeners() {
        // Escutar eventos de alertas críticos
        window.addEventListener('criticalAlert', (event) => {
            this.refresh();
        });

        // Escutar mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
        });
    }

    _loadPersistedState() {
        if (!this.config.persistState) return;

        try {
            const saved = localStorage.getItem('health-dashboard-state');
            if (saved) {
                const state = JSON.parse(saved);
                this.config = { ...this.config, ...state };
            }
        } catch (error) {
            structuredLogger.warn('Failed to load dashboard state', error);
        }
    }

    _saveState() {
        if (!this.config.persistState) return;

        try {
            const state = {
                minimized: this.config.minimized,
                position: this.config.position,
                theme: this.config.theme,
                autoRefresh: this.config.autoRefresh,
            };
            localStorage.setItem('health-dashboard-state', JSON.stringify(state));
        } catch (error) {
            structuredLogger.warn('Failed to save dashboard state', error);
        }
    }

    _convertToCSV(data) {
        // Implementação simplificada de conversão para CSV
        const rows = [];
        rows.push('Metric,Value,Status,Timestamp');

        // Sistema
        if (data.system) {
            rows.push(
                `Memory,${data.system.memory},${data.system.memory > 500 ? 'Critical' : 'OK'},${new Date(data.timestamp).toISOString()}`
            );
            rows.push(
                `CPU,${data.system.cpu},${data.system.cpu > 80 ? 'Critical' : 'OK'},${new Date(data.timestamp).toISOString()}`
            );
        }

        // Performance
        if (data.performance) {
            rows.push(
                `FPS,${data.performance.fps},${data.performance.fps < 30 ? 'Critical' : 'OK'},${new Date(data.timestamp).toISOString()}`
            );
        }

        // Erros
        if (data.errors) {
            rows.push(
                `Errors,${data.errors.recent.total},${data.errors.recent.total > 10 ? 'Critical' : 'OK'},${new Date(data.timestamp).toISOString()}`
            );
        }

        return rows.join('\n');
    }
}

// Instância global
const healthDashboard = new HealthDashboard();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.healthDashboard = healthDashboard;
}

export default healthDashboard;
