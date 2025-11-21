/**
 * Sistema de Notificações Inteligentes
 * Gerencia notificações contextuais, alertas prioritários e comunicação proativa
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';
import aiRecommendations from '../analytics/AIRecommendations.js';

class SmartNotifications {
    constructor() {
        this.config = {
            enableNotifications: true,
            enableSound: true,
            enableDesktopNotifications: true,
            enableInAppNotifications: true,
            maxNotifications: 50,
            autoCleanupInterval: 300000, // 5 minutos
            priorityThresholds: {
                critical: 0,
                high: 5000, // 5 segundos
                medium: 30000, // 30 segundos
                low: 300000, // 5 minutos
            },
        };

        this.notifications = [];
        this.channels = new Map();
        this.templates = new Map();
        this.rules = new Map();
        this.stats = {
            sent: 0,
            clicked: 0,
            dismissed: 0,
            byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        };

        this._initializeNotificationSystem();
    }

    /**
     * Inicializa o sistema de notificações
     */
    async _initializeNotificationSystem() {
        try {
            await this._setupChannels();
            await this._setupTemplates();
            await this._setupNotificationRules();
            await this._requestPermissions();

            if (this.config.enableNotifications) {
                this._startNotificationProcessor();
                this._setupAutoCleanup();
            }

            structuredLogger.info('Smart notifications system initialized', {
                channels: this.channels.size,
                templates: this.templates.size,
                rules: this.rules.size,
                desktopPermission: Notification.permission,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'smart_notifications_init',
                severity: 'medium',
            });
        }
    }

    /**
     * Envia notificação inteligente
     */
    async sendNotification(notification) {
        try {
            const processedNotification = await this._processNotification(notification);

            if (!this._shouldSendNotification(processedNotification)) {
                return { success: false, reason: 'filtered_out' };
            }

            // Determinar canais apropriados
            const channels = this._selectChannels(processedNotification);

            // Enviar através dos canais
            const results = await Promise.allSettled(
                channels.map((channel) => this._sendThroughChannel(processedNotification, channel))
            );

            // Armazenar notificação
            this.notifications.unshift(processedNotification);
            this._limitNotifications();

            // Atualizar estatísticas
            this.stats.sent++;
            this.stats.byPriority[processedNotification.priority]++;

            structuredLogger.info('Notification sent', {
                id: processedNotification.id,
                type: processedNotification.type,
                priority: processedNotification.priority,
                channels: channels.length,
            });

            return {
                success: true,
                id: processedNotification.id,
                channels: channels.length,
                results,
            };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'send_notification',
                notification: notification.type,
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Cria alerta crítico imediato
     */
    async createCriticalAlert(alert) {
        const criticalNotification = {
            type: 'critical_alert',
            priority: 'critical',
            title: alert.title || 'Alerta Crítico',
            message: alert.message,
            data: alert.data || {},
            actions: alert.actions || [],
            persistent: true,
            requiresAcknowledgment: true,
            channels: ['desktop', 'inapp', 'sound'],
            timestamp: Date.now(),
        };

        return await this.sendNotification(criticalNotification);
    }

    /**
     * Cria notificação baseada em recomendação de IA
     */
    async createAIRecommendationNotification(recommendation) {
        const notification = {
            type: 'ai_recommendation',
            priority: this._mapPriorityFromRecommendation(recommendation),
            title: '🤖 Recomendação Inteligente',
            message: recommendation.title,
            data: {
                recommendationId: recommendation.id,
                category: recommendation.category,
                confidence: recommendation.confidence,
                impact: recommendation.impact,
            },
            actions: [
                {
                    id: 'view_details',
                    label: 'Ver Detalhes',
                    action: () => this._showRecommendationDetails(recommendation),
                },
                {
                    id: 'dismiss',
                    label: 'Dispensar',
                    action: () => this._dismissRecommendation(recommendation.id),
                },
            ],
            channels: ['inapp'],
            template: 'ai_recommendation',
            timestamp: Date.now(),
        };

        return await this.sendNotification(notification);
    }

    /**
     * Cria notificação de progresso/status
     */
    async createProgressNotification(progress) {
        const notification = {
            type: 'progress_update',
            priority: progress.urgent ? 'high' : 'medium',
            title: progress.title || 'Atualização de Progresso',
            message: progress.message,
            data: {
                current: progress.current,
                total: progress.total,
                percentage: progress.percentage,
                stage: progress.stage,
            },
            channels: ['inapp'],
            template: 'progress',
            autoExpire: true,
            expireAfter: 30000, // 30 segundos
            timestamp: Date.now(),
        };

        return await this.sendNotification(notification);
    }

    /**
     * Obtém notificações ativas
     */
    getActiveNotifications(filters = {}) {
        let filtered = this.notifications.filter((n) => !n.dismissed && !n.expired);

        if (filters.type) {
            filtered = filtered.filter((n) => n.type === filters.type);
        }

        if (filters.priority) {
            filtered = filtered.filter((n) => n.priority === filters.priority);
        }

        if (filters.since) {
            filtered = filtered.filter((n) => n.timestamp >= filters.since);
        }

        return filtered.sort((a, b) => {
            // Ordenar por prioridade e depois por timestamp
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const aPriority = priorityOrder[a.priority] || 4;
            const bPriority = priorityOrder[b.priority] || 4;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            return b.timestamp - a.timestamp;
        });
    }

    /**
     * Marca notificação como lida/clicada
     */
    markAsClicked(notificationId) {
        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification) {
            notification.clicked = true;
            notification.clickedAt = Date.now();
            this.stats.clicked++;

            structuredLogger.debug('Notification clicked', {
                id: notificationId,
                type: notification.type,
            });
        }
    }

    /**
     * Dispensa notificação
     */
    dismissNotification(notificationId) {
        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification) {
            notification.dismissed = true;
            notification.dismissedAt = Date.now();
            this.stats.dismissed++;

            structuredLogger.debug('Notification dismissed', {
                id: notificationId,
                type: notification.type,
            });
        }
    }

    /**
     * Obtém estatísticas das notificações
     */
    getNotificationStats() {
        const active = this.notifications.filter((n) => !n.dismissed && !n.expired).length;
        const total = this.notifications.length;
        const clickRate = this.stats.sent > 0 ? (this.stats.clicked / this.stats.sent) * 100 : 0;
        const dismissRate =
            this.stats.sent > 0 ? (this.stats.dismissed / this.stats.sent) * 100 : 0;

        return {
            active,
            total,
            sent: this.stats.sent,
            clicked: this.stats.clicked,
            dismissed: this.stats.dismissed,
            clickRate,
            dismissRate,
            byPriority: { ...this.stats.byPriority },
            channels: Object.fromEntries(this.channels),
            rules: this.rules.size,
        };
    }

    // Métodos privados
    async _processNotification(notification) {
        const processedNotification = {
            id: this._generateNotificationId(),
            timestamp: Date.now(),
            ...notification,
        };

        // Aplicar template se especificado
        if (notification.template && this.templates.has(notification.template)) {
            const template = this.templates.get(notification.template);
            Object.assign(processedNotification, template);
        }

        // Determinar prioridade se não especificada
        if (!processedNotification.priority) {
            processedNotification.priority = this._determinePriority(processedNotification);
        }

        // Aplicar regras de notificação
        await this._applyNotificationRules(processedNotification);

        return processedNotification;
    }

    _shouldSendNotification(notification) {
        // Verificar se notificações estão habilitadas
        if (!this.config.enableNotifications) return false;

        // Verificar throttling para evitar spam
        const recentSimilar = this.notifications.filter(
            (n) =>
                n.type === notification.type &&
                Date.now() - n.timestamp < this.config.priorityThresholds[notification.priority]
        );

        if (recentSimilar.length > 0) {
            return false; // Throttle
        }

        return true;
    }

    _selectChannels(notification) {
        const selectedChannels = [];

        // Canais especificados na notificação
        if (notification.channels && notification.channels.length > 0) {
            return notification.channels;
        }

        // Seleção automática baseada na prioridade
        switch (notification.priority) {
            case 'critical':
                selectedChannels.push('desktop', 'inapp', 'sound');
                break;
            case 'high':
                selectedChannels.push('desktop', 'inapp');
                break;
            case 'medium':
                selectedChannels.push('inapp');
                break;
            case 'low':
                selectedChannels.push('inapp');
                break;
        }

        return selectedChannels;
    }

    async _sendThroughChannel(notification, channelName) {
        const channel = this.channels.get(channelName);
        if (!channel) {
            throw new Error(`Channel ${channelName} not found`);
        }

        return await channel.send(notification);
    }

    async _setupChannels() {
        // Canal de notificações desktop
        this.channels.set('desktop', {
            name: 'desktop',
            enabled: this.config.enableDesktopNotifications,
            send: async (notification) => {
                if (
                    !this.config.enableDesktopNotifications ||
                    Notification.permission !== 'granted'
                ) {
                    return { success: false, reason: 'no_permission' };
                }

                const desktopNotification = new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: notification.id,
                    requireInteraction: notification.priority === 'critical',
                    silent: !this.config.enableSound,
                });

                desktopNotification.onclick = () => {
                    this.markAsClicked(notification.id);
                    window.focus();
                };

                return { success: true, nativeNotification: desktopNotification };
            },
        });

        // Canal de notificações in-app
        this.channels.set('inapp', {
            name: 'inapp',
            enabled: this.config.enableInAppNotifications,
            send: async (notification) => {
                if (!this.config.enableInAppNotifications) {
                    return { success: false, reason: 'disabled' };
                }

                this._showInAppNotification(notification);
                return { success: true };
            },
        });

        // Canal de som
        this.channels.set('sound', {
            name: 'sound',
            enabled: this.config.enableSound,
            send: async (notification) => {
                if (!this.config.enableSound) {
                    return { success: false, reason: 'disabled' };
                }

                this._playNotificationSound(notification.priority);
                return { success: true };
            },
        });
    }

    async _setupTemplates() {
        // Template para recomendações de IA
        this.templates.set('ai_recommendation', {
            icon: '🤖',
            persistent: false,
            autoExpire: true,
            expireAfter: 60000, // 1 minuto
            showProgress: false,
        });

        // Template para alertas críticos
        this.templates.set('critical_alert', {
            icon: '🚨',
            persistent: true,
            requiresAcknowledgment: true,
            autoExpire: false,
            priority: 'critical',
        });

        // Template para progresso
        this.templates.set('progress', {
            icon: '📊',
            persistent: false,
            autoExpire: true,
            expireAfter: 30000,
            showProgress: true,
        });

        // Template para trading
        this.templates.set('trading_update', {
            icon: '📈',
            persistent: false,
            autoExpire: true,
            expireAfter: 45000,
            priority: 'medium',
        });
    }

    async _setupNotificationRules() {
        // Regra para alertas de risco
        this.rules.set('risk_alert', {
            condition: (notification) => {
                return notification.type === 'risk_alert' && notification.data?.riskScore > 80;
            },
            action: (notification) => {
                notification.priority = 'critical';
                notification.persistent = true;
                notification.requiresAcknowledgment = true;
            },
        });

        // Regra para notificações de performance
        this.rules.set('performance_degradation', {
            condition: (notification) => {
                return (
                    notification.type === 'performance' && notification.data?.severity === 'high'
                );
            },
            action: (notification) => {
                notification.priority = 'high';
                notification.channels = ['desktop', 'inapp'];
            },
        });

        // Regra para sessões longas
        this.rules.set('long_session', {
            condition: (notification) => {
                return (
                    notification.type === 'session_warning' &&
                    notification.data?.duration > 4 * 60 * 60 * 1000
                ); // 4 horas
            },
            action: (notification) => {
                notification.priority = 'medium';
                notification.persistent = true;
            },
        });
    }

    async _requestPermissions() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                structuredLogger.info('Notification permission requested', { permission });
            } catch (error) {
                structuredLogger.warn('Failed to request notification permission', {
                    error: error.message,
                });
            }
        }
    }

    _showInAppNotification(notification) {
        // Criar elemento de notificação in-app
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.priority}`;
        notificationEl.id = `notification-${notification.id}`;

        const icon = notification.icon || this._getDefaultIcon(notification.type);

        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-text">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                </div>
                <div class="notification-actions">
                    ${
                        notification.actions
                            ? notification.actions
                                  .map(
                                      (action) =>
                                          `<button class="notification-action" data-action="${action.id}">${action.label}</button>`
                                  )
                                  .join('')
                            : ''
                    }
                    <button class="notification-close" data-action="close">×</button>
                </div>
            </div>
            ${
                notification.showProgress && notification.data?.percentage
                    ? `<div class="notification-progress">
                    <div class="progress-bar" style="width: ${notification.data.percentage}%"></div>
                </div>`
                    : ''
            }
        `;

        // Adicionar event listeners
        notificationEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-action')) {
                const actionId = e.target.dataset.action;
                if (actionId === 'close') {
                    this.dismissNotification(notification.id);
                    notificationEl.remove();
                } else {
                    const action = notification.actions?.find((a) => a.id === actionId);
                    if (action && action.action) {
                        action.action();
                    }
                    this.markAsClicked(notification.id);
                }
            }
        });

        // Adicionar ao container de notificações
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = this._createNotificationsContainer();
        }

        container.appendChild(notificationEl);

        // Auto-remover se configurado
        if (notification.autoExpire && notification.expireAfter) {
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.remove();
                }
            }, notification.expireAfter);
        }
    }

    _createNotificationsContainer() {
        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';

        // Adicionar estilos
        if (!document.getElementById('notifications-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notifications-styles';
            styles.textContent = `
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                }
                
                .notification {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                .notification-critical {
                    border-color: #dc3545;
                    background: #2d1b1f;
                }
                
                .notification-high {
                    border-color: #fd7e14;
                    background: #2d251b;
                }
                
                .notification-medium {
                    border-color: #ffc107;
                    background: #2d2a1b;
                }
                
                .notification-low {
                    border-color: #6c757d;
                    background: #1a1a1a;
                }
                
                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .notification-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .notification-text {
                    flex: 1;
                    color: #fff;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .notification-message {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .notification-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }
                
                .notification-action, .notification-close {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: #fff;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .notification-action:hover, .notification-close:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .notification-progress {
                    margin-top: 12px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    height: 4px;
                }
                
                .progress-bar {
                    background: #28a745;
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(container);
        return container;
    }

    _playNotificationSound(priority) {
        if (!this.config.enableSound) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Diferentes frequências para diferentes prioridades
            const frequencies = {
                critical: 800,
                high: 600,
                medium: 400,
                low: 300,
            };

            oscillator.frequency.setValueAtTime(
                frequencies[priority] || 400,
                audioContext.currentTime
            );
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Fallback silencioso se Web Audio API não estiver disponível
        }
    }

    _getDefaultIcon(type) {
        const icons = {
            critical_alert: '🚨',
            ai_recommendation: '🤖',
            progress_update: '📊',
            trading_update: '📈',
            risk_alert: '⚠️',
            performance: '⚡',
            system: '⚙️',
            default: 'ℹ️',
        };

        return icons[type] || icons.default;
    }

    _generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _determinePriority(notification) {
        // Lógica para determinar prioridade automaticamente
        if (notification.type === 'critical_alert') return 'critical';
        if (notification.type === 'risk_alert' && notification.data?.riskScore > 80)
            return 'critical';
        if (notification.type === 'ai_recommendation' && notification.data?.impact === 'critical')
            return 'high';
        if (notification.type === 'performance' && notification.data?.severity === 'high')
            return 'high';

        return 'medium';
    }

    async _applyNotificationRules(notification) {
        for (const [ruleName, rule] of this.rules) {
            try {
                if (rule.condition(notification)) {
                    rule.action(notification);
                }
            } catch (error) {
                structuredLogger.warn('Error applying notification rule', {
                    rule: ruleName,
                    error: error.message,
                });
            }
        }
    }

    _mapPriorityFromRecommendation(recommendation) {
        const priorityMap = {
            critical: 'critical',
            high: 'high',
            medium: 'medium',
            low: 'low',
        };

        return priorityMap[recommendation.priority] || 'medium';
    }

    _showRecommendationDetails(recommendation) {
        // Implementação para mostrar detalhes da recomendação
        console.log('Showing recommendation details:', recommendation);
    }

    _dismissRecommendation(recommendationId) {
        // Implementação para dispensar recomendação
        console.log('Dismissing recommendation:', recommendationId);
    }

    _limitNotifications() {
        if (this.notifications.length > this.config.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.config.maxNotifications);
        }
    }

    _startNotificationProcessor() {
        // Processar notificações pendentes periodicamente
        setInterval(() => {
            this._processExpiredNotifications();
        }, 30000); // A cada 30 segundos
    }

    _setupAutoCleanup() {
        setInterval(() => {
            const now = Date.now();
            const cutoff = now - 24 * 60 * 60 * 1000; // 24 horas

            this.notifications = this.notifications.filter((n) => n.timestamp > cutoff);
        }, this.config.autoCleanupInterval);
    }

    _processExpiredNotifications() {
        const now = Date.now();

        this.notifications.forEach((notification) => {
            if (
                notification.autoExpire &&
                notification.expireAfter &&
                now - notification.timestamp > notification.expireAfter
            ) {
                notification.expired = true;

                // Remover do DOM se existir
                const element = document.getElementById(`notification-${notification.id}`);
                if (element) {
                    element.remove();
                }
            }
        });
    }
}

// Instância global
const smartNotifications = new SmartNotifications();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.smartNotifications = smartNotifications;
}

export default smartNotifications;
