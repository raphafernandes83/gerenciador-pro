/**
 * Sistema de Analytics de Uso das Funcionalidades
 * Rastreia e analisa como os usuários interagem com o aplicativo
 */

import structuredLogger from './StructuredLogger.js';
import realtimeMetrics from './RealtimeMetrics.js';

class UsageAnalytics {
    constructor() {
        this.sessions = new Map();
        this.events = [];
        this.features = new Map();
        this.userJourneys = new Map();
        this.config = {
            enableAutoTracking: true,
            enableHeatmap: true,
            enableUserJourneys: true,
            enableFeatureUsage: true,
            enablePerformanceCorrelation: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutos
            maxEvents: 10000,
            batchSize: 100,
            flushInterval: 60000, // 1 minuto
        };

        this.eventTypes = {
            PAGE_VIEW: 'page_view',
            CLICK: 'click',
            FORM_SUBMIT: 'form_submit',
            FEATURE_USE: 'feature_use',
            ERROR: 'error',
            PERFORMANCE: 'performance',
            CUSTOM: 'custom',
        };

        this.featureCategories = {
            TRADING: 'trading',
            CHARTS: 'charts',
            SETTINGS: 'settings',
            ANALYSIS: 'analysis',
            REPORTS: 'reports',
            UI: 'ui',
        };

        this.currentSession = this._initializeSession();

        if (this.config.enableAutoTracking) {
            this._setupAutoTracking();
        }

        this._setupPeriodicFlush();
    }

    /**
     * Rastreia evento de uso de funcionalidade
     * @param {string} feature - Nome da funcionalidade
     * @param {string} action - Ação realizada
     * @param {Object} context - Contexto adicional
     * @param {Object} metadata - Metadados do evento
     */
    trackFeatureUsage(feature, action, context = {}, metadata = {}) {
        const event = {
            id: this._generateEventId(),
            timestamp: Date.now(),
            type: this.eventTypes.FEATURE_USE,
            feature,
            action,
            context: this._enrichContext(context),
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: this._getViewportInfo(),
                ...metadata,
            },
            performance: this._getPerformanceSnapshot(),
        };

        this._addEvent(event);
        this._updateFeatureStats(feature, action);
        this._updateUserJourney(event);

        // Métricas em tempo real
        realtimeMetrics.incrementCounter('feature.usage', 1, {
            feature,
            action,
            category: this._getFeatureCategory(feature),
        });

        structuredLogger.userEvent('feature_usage', {
            feature,
            action,
            context,
        });

        return event.id;
    }

    /**
     * Rastreia interação do usuário (clique, scroll, etc.)
     * @param {string} element - Elemento interagido
     * @param {string} action - Tipo de interação
     * @param {Object} context - Contexto da interação
     */
    trackUserInteraction(element, action, context = {}) {
        const event = {
            id: this._generateEventId(),
            timestamp: Date.now(),
            type: this.eventTypes.CLICK,
            element,
            action,
            context: {
                ...context,
                coordinates: context.coordinates || this._getMousePosition(),
                elementInfo: this._getElementInfo(element),
            },
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
            },
        };

        this._addEvent(event);
        this._updateHeatmapData(event);

        realtimeMetrics.incrementCounter('user.interactions', 1, {
            element,
            action,
        });
    }

    /**
     * Rastreia visualização de página/seção
     * @param {string} page - Nome da página/seção
     * @param {Object} context - Contexto adicional
     */
    trackPageView(page, context = {}) {
        const event = {
            id: this._generateEventId(),
            timestamp: Date.now(),
            type: this.eventTypes.PAGE_VIEW,
            page,
            context: {
                ...context,
                referrer: document.referrer,
                loadTime: this._getPageLoadTime(),
            },
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
            },
        };

        this._addEvent(event);
        this._updateSessionPageViews(page);

        realtimeMetrics.incrementCounter('page.views', 1, { page });

        structuredLogger.userEvent('page_view', { page, context });
    }

    /**
     * Rastreia submissão de formulário
     * @param {string} formName - Nome do formulário
     * @param {Object} formData - Dados do formulário (sanitizados)
     * @param {boolean} success - Se a submissão foi bem-sucedida
     * @param {Object} context - Contexto adicional
     */
    trackFormSubmission(formName, formData, success, context = {}) {
        const event = {
            id: this._generateEventId(),
            timestamp: Date.now(),
            type: this.eventTypes.FORM_SUBMIT,
            formName,
            success,
            context: {
                ...context,
                fieldCount: Object.keys(formData).length,
                formData: this._sanitizeFormData(formData),
            },
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
            },
        };

        this._addEvent(event);

        const metricName = success ? 'form.submissions.success' : 'form.submissions.error';
        realtimeMetrics.incrementCounter(metricName, 1, { form: formName });

        structuredLogger.userEvent('form_submission', {
            formName,
            success,
            fieldCount: event.context.fieldCount,
        });
    }

    /**
     * Rastreia erro encontrado pelo usuário
     * @param {Error} error - Objeto de erro
     * @param {Object} context - Contexto do erro
     */
    trackUserError(error, context = {}) {
        const event = {
            id: this._generateEventId(),
            timestamp: Date.now(),
            type: this.eventTypes.ERROR,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            context: {
                ...context,
                userAction: context.userAction || 'unknown',
                recoverable: context.recoverable !== false,
            },
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
            },
        };

        this._addEvent(event);

        realtimeMetrics.incrementCounter('user.errors', 1, {
            errorType: error.name,
            recoverable: event.context.recoverable,
        });
    }

    /**
     * Inicia rastreamento de uma jornada do usuário
     * @param {string} journeyName - Nome da jornada
     * @param {Object} context - Contexto inicial
     * @returns {string} ID da jornada
     */
    startUserJourney(journeyName, context = {}) {
        const journeyId = this._generateJourneyId();
        const journey = {
            id: journeyId,
            name: journeyName,
            startTime: Date.now(),
            endTime: null,
            steps: [],
            context,
            metadata: {
                sessionId: this.currentSession.id,
                userId: this._getUserId(),
            },
            completed: false,
            abandoned: false,
        };

        this.userJourneys.set(journeyId, journey);

        structuredLogger.userEvent('journey_start', {
            journeyId,
            journeyName,
            context,
        });

        return journeyId;
    }

    /**
     * Adiciona passo à jornada do usuário
     * @param {string} journeyId - ID da jornada
     * @param {string} stepName - Nome do passo
     * @param {Object} context - Contexto do passo
     */
    addJourneyStep(journeyId, stepName, context = {}) {
        const journey = this.userJourneys.get(journeyId);
        if (!journey) return;

        const step = {
            name: stepName,
            timestamp: Date.now(),
            context,
            duration:
                journey.steps.length > 0
                    ? Date.now() - journey.steps[journey.steps.length - 1].timestamp
                    : Date.now() - journey.startTime,
        };

        journey.steps.push(step);

        structuredLogger.debug('Journey step added', {
            journeyId,
            stepName,
            stepIndex: journey.steps.length,
            duration: step.duration,
        });
    }

    /**
     * Finaliza jornada do usuário
     * @param {string} journeyId - ID da jornada
     * @param {boolean} completed - Se a jornada foi completada com sucesso
     * @param {Object} context - Contexto final
     */
    endUserJourney(journeyId, completed = true, context = {}) {
        const journey = this.userJourneys.get(journeyId);
        if (!journey) return;

        journey.endTime = Date.now();
        journey.completed = completed;
        journey.abandoned = !completed;
        journey.totalDuration = journey.endTime - journey.startTime;
        journey.finalContext = context;

        // Métricas da jornada
        const metricName = completed ? 'journey.completed' : 'journey.abandoned';
        realtimeMetrics.incrementCounter(metricName, 1, {
            journey: journey.name,
            steps: journey.steps.length,
        });

        realtimeMetrics.recordHistogram('journey.duration', journey.totalDuration, {
            journey: journey.name,
            completed,
        });

        structuredLogger.userEvent('journey_end', {
            journeyId,
            journeyName: journey.name,
            completed,
            duration: journey.totalDuration,
            steps: journey.steps.length,
        });
    }

    /**
     * Obtém estatísticas de uso das funcionalidades
     * @param {Object} filters - Filtros para aplicar
     * @returns {Object} Estatísticas de uso
     */
    getFeatureUsageStats(filters = {}) {
        const {
            timeRange = 24 * 60 * 60 * 1000, // 24 horas
            feature = null,
            category = null,
        } = filters;

        const since = Date.now() - timeRange;
        const relevantEvents = this.events.filter(
            (event) =>
                event.timestamp >= since &&
                event.type === this.eventTypes.FEATURE_USE &&
                (!feature || event.feature === feature) &&
                (!category || this._getFeatureCategory(event.feature) === category)
        );

        const stats = {
            totalUsage: relevantEvents.length,
            uniqueUsers: new Set(relevantEvents.map((e) => e.metadata.userId)).size,
            uniqueFeatures: new Set(relevantEvents.map((e) => e.feature)).size,
            byFeature: {},
            byAction: {},
            byCategory: {},
            topFeatures: [],
            usageTimeline: this._generateUsageTimeline(relevantEvents),
            averageSessionUsage: this._calculateAverageSessionUsage(relevantEvents),
        };

        // Agrupar por funcionalidade
        relevantEvents.forEach((event) => {
            const feature = event.feature;
            const action = event.action;
            const category = this._getFeatureCategory(feature);

            stats.byFeature[feature] = (stats.byFeature[feature] || 0) + 1;
            stats.byAction[action] = (stats.byAction[action] || 0) + 1;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });

        // Top funcionalidades
        stats.topFeatures = Object.entries(stats.byFeature)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }

    /**
     * Obtém dados do heatmap de interações
     * @param {Object} filters - Filtros para aplicar
     * @returns {Array} Dados do heatmap
     */
    getHeatmapData(filters = {}) {
        const { timeRange = 24 * 60 * 60 * 1000, element = null, action = null } = filters;

        const since = Date.now() - timeRange;
        const clickEvents = this.events.filter(
            (event) =>
                event.timestamp >= since &&
                event.type === this.eventTypes.CLICK &&
                (!element || event.element === element) &&
                (!action || event.action === action)
        );

        return clickEvents.map((event) => ({
            x: event.context.coordinates?.x || 0,
            y: event.context.coordinates?.y || 0,
            element: event.element,
            action: event.action,
            timestamp: event.timestamp,
            intensity: 1,
        }));
    }

    /**
     * Obtém análise das jornadas do usuário
     * @param {Object} filters - Filtros para aplicar
     * @returns {Object} Análise das jornadas
     */
    getUserJourneyAnalysis(filters = {}) {
        const { timeRange = 24 * 60 * 60 * 1000, journeyName = null, completed = null } = filters;

        const since = Date.now() - timeRange;
        const relevantJourneys = Array.from(this.userJourneys.values()).filter(
            (journey) =>
                journey.startTime >= since &&
                (!journeyName || journey.name === journeyName) &&
                (completed === null || journey.completed === completed)
        );

        const analysis = {
            totalJourneys: relevantJourneys.length,
            completedJourneys: relevantJourneys.filter((j) => j.completed).length,
            abandonedJourneys: relevantJourneys.filter((j) => j.abandoned).length,
            completionRate: 0,
            averageDuration: 0,
            averageSteps: 0,
            commonPaths: this._analyzeCommonPaths(relevantJourneys),
            dropoffPoints: this._analyzeDropoffPoints(relevantJourneys),
            byJourneyName: {},
        };

        if (relevantJourneys.length > 0) {
            analysis.completionRate = (analysis.completedJourneys / analysis.totalJourneys) * 100;

            const completedJourneys = relevantJourneys.filter(
                (j) => j.completed && j.totalDuration
            );
            if (completedJourneys.length > 0) {
                analysis.averageDuration =
                    completedJourneys.reduce((sum, j) => sum + j.totalDuration, 0) /
                    completedJourneys.length;
                analysis.averageSteps =
                    completedJourneys.reduce((sum, j) => sum + j.steps.length, 0) /
                    completedJourneys.length;
            }
        }

        // Agrupar por nome da jornada
        const journeyNames = [...new Set(relevantJourneys.map((j) => j.name))];
        journeyNames.forEach((name) => {
            const journeys = relevantJourneys.filter((j) => j.name === name);
            analysis.byJourneyName[name] = {
                total: journeys.length,
                completed: journeys.filter((j) => j.completed).length,
                completionRate:
                    (journeys.filter((j) => j.completed).length / journeys.length) * 100,
            };
        });

        return analysis;
    }

    /**
     * Obtém relatório de analytics completo
     * @param {Object} options - Opções do relatório
     * @returns {Object} Relatório completo
     */
    generateAnalyticsReport(options = {}) {
        const {
            timeRange = 24 * 60 * 60 * 1000,
            includeHeatmap = false,
            includeJourneys = true,
            includeFeatures = true,
        } = options;

        const report = {
            generatedAt: new Date().toISOString(),
            timeRange: {
                since: new Date(Date.now() - timeRange).toISOString(),
                until: new Date().toISOString(),
            },
            summary: this._generateSummary(timeRange),
            sessions: this._getSessionStats(timeRange),
        };

        if (includeFeatures) {
            report.features = this.getFeatureUsageStats({ timeRange });
        }

        if (includeJourneys) {
            report.journeys = this.getUserJourneyAnalysis({ timeRange });
        }

        if (includeHeatmap) {
            report.heatmap = this.getHeatmapData({ timeRange });
        }

        return report;
    }

    /**
     * Exporta dados para análise externa
     * @param {string} format - Formato de exportação (json, csv)
     * @param {Object} filters - Filtros para aplicar
     * @returns {string} Dados exportados
     */
    exportData(format = 'json', filters = {}) {
        const data = {
            events: this._filterEvents(filters),
            sessions: Array.from(this.sessions.values()),
            journeys: Array.from(this.userJourneys.values()),
            features: Array.from(this.features.entries()),
        };

        switch (format.toLowerCase()) {
            case 'csv':
                return this._convertToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    // Métodos privados
    _initializeSession() {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            id: sessionId,
            userId: this._getUserId(),
            startTime: Date.now(),
            lastActivity: Date.now(),
            pageViews: [],
            events: [],
            userAgent: navigator.userAgent,
            initialUrl: window.location.href,
            viewport: this._getViewportInfo(),
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    _setupAutoTracking() {
        // Rastrear cliques automaticamente
        document.addEventListener(
            'click',
            (event) => {
                const element = this._getElementSelector(event.target);
                this.trackUserInteraction(element, 'click', {
                    coordinates: { x: event.clientX, y: event.clientY },
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey,
                });
            },
            true
        );

        // Rastrear mudanças de página (SPA)
        let currentPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                this.trackPageView(currentPath);
            }
        }, 1000);

        // Rastrear visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._pauseSession();
            } else {
                this._resumeSession();
            }
        });

        // Rastrear saída da página
        window.addEventListener('beforeunload', () => {
            this._endSession();
        });
    }

    _setupPeriodicFlush() {
        setInterval(() => {
            this._flushEvents();
            this._cleanupOldData();
        }, this.config.flushInterval);
    }

    _addEvent(event) {
        this.events.push(event);
        this.currentSession.events.push(event.id);
        this.currentSession.lastActivity = Date.now();

        // Manter limite de eventos
        if (this.events.length > this.config.maxEvents) {
            this.events = this.events.slice(-this.config.maxEvents);
        }
    }

    _updateFeatureStats(feature, action) {
        if (!this.features.has(feature)) {
            this.features.set(feature, {
                name: feature,
                category: this._getFeatureCategory(feature),
                totalUsage: 0,
                uniqueUsers: new Set(),
                actions: new Map(),
                firstUsed: Date.now(),
                lastUsed: Date.now(),
            });
        }

        const featureStats = this.features.get(feature);
        featureStats.totalUsage++;
        featureStats.uniqueUsers.add(this._getUserId());
        featureStats.lastUsed = Date.now();

        if (!featureStats.actions.has(action)) {
            featureStats.actions.set(action, 0);
        }
        featureStats.actions.set(action, featureStats.actions.get(action) + 1);
    }

    _updateUserJourney(event) {
        // Atualizar jornadas ativas baseado no evento
        for (const journey of this.userJourneys.values()) {
            if (journey.metadata.sessionId === this.currentSession.id && !journey.endTime) {
                // Auto-adicionar passos baseado em funcionalidades
                if (event.type === this.eventTypes.FEATURE_USE) {
                    this.addJourneyStep(journey.id, `use_${event.feature}`, {
                        action: event.action,
                        automatic: true,
                    });
                }
            }
        }
    }

    _updateHeatmapData(event) {
        if (!this.config.enableHeatmap) return;

        // Implementação simplificada - em produção seria mais robusta
        const heatmapKey = `${event.element}_${event.action}`;
        if (!this.heatmapData) {
            this.heatmapData = new Map();
        }

        if (!this.heatmapData.has(heatmapKey)) {
            this.heatmapData.set(heatmapKey, []);
        }

        this.heatmapData.get(heatmapKey).push({
            x: event.context.coordinates?.x || 0,
            y: event.context.coordinates?.y || 0,
            timestamp: event.timestamp,
        });
    }

    _updateSessionPageViews(page) {
        if (!this.currentSession.pageViews.includes(page)) {
            this.currentSession.pageViews.push(page);
        }
    }

    _enrichContext(context) {
        return {
            ...context,
            timestamp: Date.now(),
            performance: this._getPerformanceSnapshot(),
            viewport: this._getViewportInfo(),
            connection: this._getConnectionInfo(),
        };
    }

    _getPerformanceSnapshot() {
        return {
            memory: performance.memory
                ? {
                      used: performance.memory.usedJSHeapSize,
                      total: performance.memory.totalJSHeapSize,
                  }
                : null,
            timing: performance.now(),
            fps: realtimeMetrics.getCurrentValue('performance.fps') || 0,
        };
    }

    _getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
        };
    }

    _getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
            };
        }
        return null;
    }

    _getMousePosition() {
        // Retorna última posição conhecida do mouse
        return this.lastMousePosition || { x: 0, y: 0 };
    }

    _getElementInfo(element) {
        if (typeof element === 'string') {
            const el = document.querySelector(element);
            if (!el) return { selector: element };
            element = el;
        }

        return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.slice(0, 50),
            attributes: this._getRelevantAttributes(element),
        };
    }

    _getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    _getRelevantAttributes(element) {
        const relevantAttrs = ['data-testid', 'data-track', 'role', 'aria-label'];
        const attrs = {};

        relevantAttrs.forEach((attr) => {
            if (element.hasAttribute(attr)) {
                attrs[attr] = element.getAttribute(attr);
            }
        });

        return attrs;
    }

    _getFeatureCategory(feature) {
        // Categorizar funcionalidades baseado no nome
        const featureLower = feature.toLowerCase();

        if (featureLower.includes('chart') || featureLower.includes('graph')) {
            return this.featureCategories.CHARTS;
        }
        if (featureLower.includes('trade') || featureLower.includes('operation')) {
            return this.featureCategories.TRADING;
        }
        if (featureLower.includes('setting') || featureLower.includes('config')) {
            return this.featureCategories.SETTINGS;
        }
        if (featureLower.includes('analysis') || featureLower.includes('report')) {
            return this.featureCategories.ANALYSIS;
        }
        if (featureLower.includes('ui') || featureLower.includes('interface')) {
            return this.featureCategories.UI;
        }

        return 'other';
    }

    _sanitizeFormData(formData) {
        // Remover dados sensíveis
        const sanitized = { ...formData };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

        Object.keys(sanitized).forEach((key) => {
            if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    _generateUsageTimeline(events) {
        const timeline = {};
        const hourMs = 60 * 60 * 1000;

        events.forEach((event) => {
            const hour = Math.floor(event.timestamp / hourMs) * hourMs;
            timeline[hour] = (timeline[hour] || 0) + 1;
        });

        return timeline;
    }

    _calculateAverageSessionUsage(events) {
        const sessionUsage = {};

        events.forEach((event) => {
            const sessionId = event.metadata.sessionId;
            sessionUsage[sessionId] = (sessionUsage[sessionId] || 0) + 1;
        });

        const usageCounts = Object.values(sessionUsage);
        return usageCounts.length > 0
            ? usageCounts.reduce((a, b) => a + b, 0) / usageCounts.length
            : 0;
    }

    _analyzeCommonPaths(journeys) {
        const paths = {};

        journeys.forEach((journey) => {
            const pathKey = journey.steps.map((step) => step.name).join(' -> ');
            paths[pathKey] = (paths[pathKey] || 0) + 1;
        });

        return Object.entries(paths)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    _analyzeDropoffPoints(journeys) {
        const dropoffs = {};

        journeys
            .filter((j) => j.abandoned)
            .forEach((journey) => {
                const lastStep = journey.steps[journey.steps.length - 1];
                if (lastStep) {
                    dropoffs[lastStep.name] = (dropoffs[lastStep.name] || 0) + 1;
                }
            });

        return Object.entries(dropoffs)
            .map(([step, count]) => ({ step, count }))
            .sort((a, b) => b.count - a.count);
    }

    _generateSummary(timeRange) {
        const since = Date.now() - timeRange;
        const recentEvents = this.events.filter((e) => e.timestamp >= since);

        return {
            totalEvents: recentEvents.length,
            uniqueUsers: new Set(recentEvents.map((e) => e.metadata.userId)).size,
            activeSessions: Array.from(this.sessions.values()).filter(
                (s) => s.lastActivity >= since
            ).length,
            topFeatures: this.getFeatureUsageStats({ timeRange }).topFeatures.slice(0, 5),
        };
    }

    _getSessionStats(timeRange) {
        const since = Date.now() - timeRange;
        const recentSessions = Array.from(this.sessions.values()).filter(
            (s) => s.startTime >= since
        );

        return {
            total: recentSessions.length,
            averageDuration:
                recentSessions.length > 0
                    ? recentSessions.reduce((sum, s) => sum + (s.lastActivity - s.startTime), 0) /
                      recentSessions.length
                    : 0,
            averagePageViews:
                recentSessions.length > 0
                    ? recentSessions.reduce((sum, s) => sum + s.pageViews.length, 0) /
                      recentSessions.length
                    : 0,
        };
    }

    _filterEvents(filters) {
        let events = [...this.events];

        if (filters.type) {
            events = events.filter((e) => e.type === filters.type);
        }

        if (filters.feature) {
            events = events.filter((e) => e.feature === filters.feature);
        }

        if (filters.since) {
            events = events.filter((e) => e.timestamp >= filters.since);
        }

        return events;
    }

    _convertToCSV(data) {
        // Implementação simplificada de conversão para CSV
        const events = data.events;
        if (events.length === 0) return '';

        const headers = Object.keys(events[0]).join(',');
        const rows = events.map((event) =>
            Object.values(event)
                .map((value) => (typeof value === 'object' ? JSON.stringify(value) : value))
                .join(',')
        );

        return [headers, ...rows].join('\n');
    }

    _flushEvents() {
        // Implementar flush para armazenamento persistente ou API
        structuredLogger.debug('Analytics events flushed', {
            eventCount: this.events.length,
            sessionCount: this.sessions.size,
            journeyCount: this.userJourneys.size,
        });
    }

    _cleanupOldData() {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 dias

        // Limpar eventos antigos
        this.events = this.events.filter((e) => e.timestamp > cutoff);

        // Limpar sessões antigas
        for (const [id, session] of this.sessions.entries()) {
            if (session.lastActivity < cutoff) {
                this.sessions.delete(id);
            }
        }

        // Limpar jornadas antigas
        for (const [id, journey] of this.userJourneys.entries()) {
            if (journey.startTime < cutoff) {
                this.userJourneys.delete(id);
            }
        }
    }

    _pauseSession() {
        this.currentSession.paused = true;
        this.currentSession.pausedAt = Date.now();
    }

    _resumeSession() {
        if (this.currentSession.paused) {
            this.currentSession.paused = false;
            this.currentSession.pauseDuration =
                (this.currentSession.pauseDuration || 0) +
                (Date.now() - this.currentSession.pausedAt);
        }
        this.currentSession.lastActivity = Date.now();
    }

    _endSession() {
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

        structuredLogger.userEvent('session_end', {
            sessionId: this.currentSession.id,
            duration: this.currentSession.duration,
            pageViews: this.currentSession.pageViews.length,
            events: this.currentSession.events.length,
        });
    }

    _getPageLoadTime() {
        if (performance.timing) {
            return performance.timing.loadEventEnd - performance.timing.navigationStart;
        }
        return 0;
    }

    _getUserId() {
        return localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
    }

    _generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateJourneyId() {
        return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Instância global
const usageAnalytics = new UsageAnalytics();

// Rastrear posição do mouse para heatmap
document.addEventListener(
    'mousemove',
    (event) => {
        usageAnalytics.lastMousePosition = { x: event.clientX, y: event.clientY };
    },
    { passive: true }
);

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.usageAnalytics = usageAnalytics;
}

export default usageAnalytics;
