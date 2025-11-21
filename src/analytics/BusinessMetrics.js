/**
 * Sistema de Métricas de Negócio
 * Coleta, processa e analisa métricas críticas do trading
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';

class BusinessMetrics {
    constructor() {
        this.config = {
            enableRealTimeMetrics: true,
            metricsRetentionDays: 30,
            updateInterval: 10000, // 10 segundos
            enablePredictiveAnalysis: true,
            enableBenchmarking: true,
        };

        this.metrics = {
            trading: new Map(),
            financial: new Map(),
            performance: new Map(),
            behavioral: new Map(),
            risk: new Map(),
        };

        this.historicalData = [];
        this.benchmarks = new Map();
        this.trends = new Map();
        this.alerts = [];

        this._initializeMetrics();
    }

    /**
     * Inicializa o sistema de métricas
     */
    async _initializeMetrics() {
        try {
            await this._loadHistoricalData();
            await this._setupBenchmarks();
            await this._startRealTimeCollection();

            structuredLogger.info('Business metrics system initialized', {
                metricsCategories: Object.keys(this.metrics).length,
                historicalRecords: this.historicalData.length,
                benchmarks: this.benchmarks.size,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'business_metrics_init',
                severity: 'medium',
            });
        }
    }

    /**
     * Coleta métricas em tempo real
     */
    async collectRealTimeMetrics() {
        try {
            const timestamp = Date.now();
            const sessionData = this._getSessionData();
            const tradingMetrics = this._calculateTradingMetrics(sessionData);
            const financialMetrics = this._calculateFinancialMetrics(sessionData);
            const performanceMetrics = this._calculatePerformanceMetrics();
            const behavioralMetrics = this._calculateBehavioralMetrics();
            const riskMetrics = this._calculateRiskMetrics(sessionData);

            const metricsSnapshot = {
                timestamp,
                trading: tradingMetrics,
                financial: financialMetrics,
                performance: performanceMetrics,
                behavioral: behavioralMetrics,
                risk: riskMetrics,
                session: {
                    id: this._getCurrentSessionId(),
                    duration: this._getSessionDuration(),
                    isActive: sessionData.isSessionActive,
                },
            };

            // Armazenar métricas
            this._storeMetrics(metricsSnapshot);

            // Detectar tendências
            this._updateTrends(metricsSnapshot);

            // Verificar alertas
            this._checkMetricAlerts(metricsSnapshot);

            return metricsSnapshot;
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'collect_realtime_metrics',
                severity: 'medium',
            });
            return null;
        }
    }

    /**
     * Gera relatório executivo de métricas
     */
    generateExecutiveReport(timeRange = '24h') {
        try {
            const timeRangeMs = this._parseTimeRange(timeRange);
            const startTime = Date.now() - timeRangeMs;
            const relevantData = this.historicalData.filter((d) => d.timestamp >= startTime);

            if (relevantData.length === 0) {
                return { success: false, reason: 'no_data_available' };
            }

            const report = {
                metadata: {
                    generatedAt: Date.now(),
                    timeRange,
                    dataPoints: relevantData.length,
                    period: {
                        start: Math.min(...relevantData.map((d) => d.timestamp)),
                        end: Math.max(...relevantData.map((d) => d.timestamp)),
                    },
                },

                executive_summary: this._generateExecutiveSummary(relevantData),

                trading_performance: this._analyzeTradingPerformance(relevantData),

                financial_health: this._analyzeFinancialHealth(relevantData),

                risk_analysis: this._analyzeRiskMetrics(relevantData),

                behavioral_insights: this._analyzeBehavioralPatterns(relevantData),

                performance_trends: this._analyzePerformanceTrends(relevantData),

                recommendations: this._generateRecommendations(relevantData),

                benchmarks: this._compareToBenchmarks(relevantData),

                alerts_summary: this._summarizeAlerts(timeRangeMs),
            };

            structuredLogger.info('Executive report generated', {
                timeRange,
                dataPoints: relevantData.length,
                recommendations: report.recommendations.length,
            });

            return { success: true, report };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'generate_executive_report',
                timeRange,
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Analisa padrões de trading
     */
    analyzeTradingPatterns(options = {}) {
        try {
            const { minPatternLength = 3, confidenceThreshold = 0.7, timeRange = '7d' } = options;

            const timeRangeMs = this._parseTimeRange(timeRange);
            const relevantData = this.historicalData.filter(
                (d) => d.timestamp >= Date.now() - timeRangeMs
            );

            const patterns = {
                winning_sequences: this._detectWinningSequences(relevantData, minPatternLength),
                losing_sequences: this._detectLosingSequences(relevantData, minPatternLength),
                time_patterns: this._detectTimePatterns(relevantData),
                volume_patterns: this._detectVolumePatterns(relevantData),
                risk_patterns: this._detectRiskPatterns(relevantData),
                behavioral_patterns: this._detectBehavioralPatterns(relevantData),
            };

            // Calcular confiança dos padrões
            Object.keys(patterns).forEach((key) => {
                patterns[key] = patterns[key].filter((p) => p.confidence >= confidenceThreshold);
            });

            const insights = this._generatePatternInsights(patterns);

            return {
                success: true,
                patterns,
                insights,
                metadata: {
                    analyzedPeriod: timeRange,
                    dataPoints: relevantData.length,
                    minConfidence: confidenceThreshold,
                    totalPatterns: Object.values(patterns).reduce(
                        (sum, arr) => sum + arr.length,
                        0
                    ),
                },
            };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'analyze_trading_patterns',
                options,
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Obtém métricas em tempo real para dashboard
     */
    getDashboardMetrics() {
        const latestMetrics = this.historicalData[this.historicalData.length - 1];
        if (!latestMetrics) return null;

        return {
            timestamp: latestMetrics.timestamp,

            // KPIs principais
            kpis: {
                totalProfit: latestMetrics.financial.totalProfit || 0,
                winRate: latestMetrics.trading.winRate || 0,
                averageReturn: latestMetrics.trading.averageReturn || 0,
                riskScore: latestMetrics.risk.overallScore || 0,
                sessionsToday: this._getSessionsCount('today'),
            },

            // Tendências (comparação com período anterior)
            trends: {
                profitTrend: this._calculateTrend('financial.totalProfit', '24h'),
                winRateTrend: this._calculateTrend('trading.winRate', '24h'),
                riskTrend: this._calculateTrend('risk.overallScore', '24h'),
                activityTrend: this._calculateTrend('behavioral.activityLevel', '24h'),
            },

            // Status atual
            status: {
                sessionActive: latestMetrics.session.isActive,
                systemHealth: this._getSystemHealthStatus(),
                lastUpdate: latestMetrics.timestamp,
                dataQuality: this._assessDataQuality(),
            },

            // Alertas ativos
            activeAlerts: this.alerts.filter((a) => a.active && a.severity === 'high').length,
        };
    }

    // Métodos privados de cálculo de métricas
    _calculateTradingMetrics(sessionData) {
        const operations = sessionData.historicoCombinado || [];
        const recentOps = operations.slice(-50); // Últimas 50 operações

        if (recentOps.length === 0) {
            return {
                totalOperations: 0,
                winRate: 0,
                lossRate: 0,
                averageReturn: 0,
                bestStreak: 0,
                worstStreak: 0,
                operationsPerHour: 0,
                averageOperationValue: 0,
            };
        }

        const wins = recentOps.filter((op) => (op.resultado || 0) > 0).length;
        const losses = recentOps.filter((op) => (op.resultado || 0) < 0).length;
        const totalReturn = recentOps.reduce((sum, op) => sum + (op.resultado || 0), 0);

        return {
            totalOperations: recentOps.length,
            winRate: recentOps.length > 0 ? (wins / recentOps.length) * 100 : 0,
            lossRate: recentOps.length > 0 ? (losses / recentOps.length) * 100 : 0,
            averageReturn: recentOps.length > 0 ? totalReturn / recentOps.length : 0,
            bestStreak: this._calculateBestStreak(recentOps),
            worstStreak: this._calculateWorstStreak(recentOps),
            operationsPerHour: this._calculateOperationsPerHour(recentOps),
            averageOperationValue: this._calculateAverageOperationValue(recentOps),
            totalReturn,
        };
    }

    _calculateFinancialMetrics(sessionData) {
        const currentCapital = sessionData.capitalAtual || 0;
        const initialCapital = sessionData.capitalInicial || 0;
        const operations = sessionData.historicoCombinado || [];

        const totalProfit = currentCapital - initialCapital;
        const profitPercentage = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

        return {
            currentCapital,
            initialCapital,
            totalProfit,
            profitPercentage,
            dailyProfit: this._calculateDailyProfit(operations),
            weeklyProfit: this._calculateWeeklyProfit(operations),
            monthlyProfit: this._calculateMonthlyProfit(operations),
            averageDailyReturn: this._calculateAverageDailyReturn(operations),
            volatility: this._calculateVolatility(operations),
            sharpeRatio: this._calculateSharpeRatio(operations),
            maxDrawdown: this._calculateMaxDrawdown(operations),
        };
    }

    _calculatePerformanceMetrics() {
        return {
            systemResponseTime:
                window.realtimeMetrics?.getCurrentValue('performance.response_time') || 0,
            memoryUsage: window.realtimeMetrics?.getCurrentValue('system.memory.used') || 0,
            cpuUsage: window.realtimeMetrics?.getCurrentValue('system.cpu.usage') || 0,
            fps: window.realtimeMetrics?.getCurrentValue('performance.fps') || 60,
            errorRate: this._calculateErrorRate(),
            uptime: this._calculateUptime(),
            loadTime: window.realtimeMetrics?.getCurrentValue('performance.page.load_time') || 0,
        };
    }

    _calculateBehavioralMetrics() {
        const analytics = window.usageAnalytics;
        if (!analytics) return {};

        const usage = analytics.getFeatureUsageStats({ timeRange: 60 * 60 * 1000 }); // 1 hora

        return {
            activityLevel: this._calculateActivityLevel(usage),
            sessionDuration: this._getSessionDuration(),
            featuresUsed: usage.uniqueFeatures || 0,
            clicksPerMinute: this._calculateClicksPerMinute(usage),
            navigationPattern: this._analyzeNavigationPattern(usage),
            engagementScore: this._calculateEngagementScore(usage),
            userEfficiency: this._calculateUserEfficiency(usage),
        };
    }

    _calculateRiskMetrics(sessionData) {
        const currentCapital = sessionData.capitalAtual || 0;
        const initialCapital = sessionData.capitalInicial || 0;
        const operations = sessionData.historicoCombinado || [];

        const riskExposure = this._calculateRiskExposure(sessionData);
        const volatility = this._calculateVolatility(operations);
        const varAtRisk = this._calculateVaR(operations, 0.95); // VaR 95%

        return {
            overallScore: this._calculateOverallRiskScore(riskExposure, volatility, varAtRisk),
            riskExposure,
            volatility,
            varAtRisk,
            currentDrawdown: ((initialCapital - currentCapital) / initialCapital) * 100,
            riskRewardRatio: this._calculateRiskRewardRatio(operations),
            consecutiveLosses: this._calculateConsecutiveLosses(operations),
            riskCapacityUsed: this._calculateRiskCapacityUsed(sessionData),
        };
    }

    _generateExecutiveSummary(data) {
        const latestData = data[data.length - 1];
        const firstData = data[0];

        const profitChange = latestData.financial.totalProfit - firstData.financial.totalProfit;
        const winRateAvg = data.reduce((sum, d) => sum + d.trading.winRate, 0) / data.length;
        const totalOperations = data.reduce((sum, d) => sum + d.trading.totalOperations, 0);

        return {
            period_performance: {
                total_profit: profitChange,
                profit_percentage:
                    firstData.financial.initialCapital > 0
                        ? (profitChange / firstData.financial.initialCapital) * 100
                        : 0,
                average_win_rate: winRateAvg,
                total_operations: totalOperations,
            },

            key_highlights: [
                profitChange > 0 ? 'Período lucrativo' : 'Período com perdas',
                winRateAvg > 60
                    ? 'Alta assertividade'
                    : winRateAvg > 40
                      ? 'Assertividade moderada'
                      : 'Baixa assertividade',
                totalOperations > 100 ? 'Alto volume de operações' : 'Volume moderado de operações',
            ],

            risk_status:
                latestData.risk.overallScore < 30
                    ? 'Baixo risco'
                    : latestData.risk.overallScore < 70
                      ? 'Risco moderado'
                      : 'Alto risco',

            system_health:
                latestData.performance.errorRate < 5
                    ? 'Excelente'
                    : latestData.performance.errorRate < 15
                      ? 'Bom'
                      : 'Requer atenção',
        };
    }

    _generateRecommendations(data) {
        const recommendations = [];
        const latestData = data[data.length - 1];

        // Recomendações baseadas em win rate
        if (latestData.trading.winRate < 50) {
            recommendations.push({
                category: 'trading_strategy',
                priority: 'high',
                title: 'Melhorar Assertividade',
                description: 'Win rate abaixo de 50%. Considere revisar estratégia de entrada.',
                impact: 'high',
                effort: 'medium',
                actions: [
                    'Analisar padrões de perdas',
                    'Ajustar critérios de entrada',
                    'Implementar filtros adicionais',
                ],
            });
        }

        // Recomendações baseadas em risco
        if (latestData.risk.overallScore > 70) {
            recommendations.push({
                category: 'risk_management',
                priority: 'critical',
                title: 'Reduzir Exposição ao Risco',
                description: 'Nível de risco elevado detectado.',
                impact: 'critical',
                effort: 'low',
                actions: [
                    'Reduzir valor das operações',
                    'Implementar stop loss mais rígido',
                    'Pausar trading até revisão',
                ],
            });
        }

        // Recomendações baseadas em performance
        if (latestData.performance.errorRate > 10) {
            recommendations.push({
                category: 'system_performance',
                priority: 'medium',
                title: 'Otimizar Performance do Sistema',
                description: 'Taxa de erros acima do normal.',
                impact: 'medium',
                effort: 'medium',
                actions: [
                    'Executar limpeza de cache',
                    'Verificar conectividade',
                    'Reiniciar sistema se necessário',
                ],
            });
        }

        // Recomendações baseadas em padrões
        const patterns = this._detectSimplePatterns(data);
        if (patterns.length > 0) {
            recommendations.push({
                category: 'pattern_optimization',
                priority: 'medium',
                title: 'Aproveitar Padrões Identificados',
                description: `Detectados ${patterns.length} padrões com potencial de otimização.`,
                impact: 'medium',
                effort: 'high',
                actions: [
                    'Analisar padrões em detalhes',
                    'Implementar regras baseadas em padrões',
                    'Monitorar eficácia das mudanças',
                ],
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // Métodos utilitários
    _getSessionData() {
        if (window.sessionStore) {
            return window.sessionStore.getState();
        }

        return {
            capitalAtual: window.state?.capitalAtual || 0,
            capitalInicial: window.state?.capitalInicial || 15000,
            historicoCombinado: window.state?.historicoCombinado || [],
            isSessionActive: window.state?.isSessionActive || false,
        };
    }

    _getCurrentSessionId() {
        return window.structuredLogger?.sessionId || 'unknown_session';
    }

    _getSessionDuration() {
        const startTime = window.structuredLogger?.sessionStartTime || Date.now();
        return Date.now() - startTime;
    }

    _parseTimeRange(timeRange) {
        const units = {
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };

        const match = timeRange.match(/^(\d+)([mhdw])$/);
        if (!match) return 24 * 60 * 60 * 1000; // Default: 24h

        const [, amount, unit] = match;
        return parseInt(amount) * units[unit];
    }

    _storeMetrics(metricsSnapshot) {
        this.historicalData.push(metricsSnapshot);

        // Limitar dados históricos
        const maxRecords = this.config.metricsRetentionDays * 24 * 6; // 6 registros por hora
        if (this.historicalData.length > maxRecords) {
            this.historicalData = this.historicalData.slice(-maxRecords);
        }

        // Salvar no localStorage periodicamente
        if (this.historicalData.length % 10 === 0) {
            try {
                localStorage.setItem(
                    'business_metrics_history',
                    JSON.stringify(this.historicalData.slice(-100))
                ); // Últimos 100 registros
            } catch (error) {
                // Ignorar erros de quota
            }
        }
    }

    async _loadHistoricalData() {
        try {
            const stored = localStorage.getItem('business_metrics_history');
            if (stored) {
                this.historicalData = JSON.parse(stored);
            }
        } catch (error) {
            structuredLogger.warn('Failed to load historical metrics data', {
                error: error.message,
            });
        }
    }

    async _setupBenchmarks() {
        // Benchmarks da indústria para opções binárias
        this.benchmarks.set('winRate', {
            excellent: 70,
            good: 60,
            average: 50,
            poor: 40,
        });

        this.benchmarks.set('dailyReturn', {
            excellent: 5,
            good: 3,
            average: 1,
            poor: -1,
        });

        this.benchmarks.set('riskScore', {
            excellent: 20,
            good: 40,
            average: 60,
            poor: 80,
        });
    }

    async _startRealTimeCollection() {
        if (!this.config.enableRealTimeMetrics) return;

        // Coleta inicial
        setTimeout(() => {
            this.collectRealTimeMetrics();
        }, 5000);

        // Coletas periódicas
        setInterval(() => {
            this.collectRealTimeMetrics();
        }, this.config.updateInterval);

        structuredLogger.info('Real-time metrics collection started', {
            interval: this.config.updateInterval,
        });
    }

    // Métodos de cálculo específicos (implementação simplificada)
    _calculateBestStreak(operations) {
        let currentStreak = 0;
        let bestStreak = 0;

        for (const op of operations) {
            if ((op.resultado || 0) > 0) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return bestStreak;
    }

    _calculateWorstStreak(operations) {
        let currentStreak = 0;
        let worstStreak = 0;

        for (const op of operations) {
            if ((op.resultado || 0) < 0) {
                currentStreak++;
                worstStreak = Math.max(worstStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return worstStreak;
    }

    _calculateVolatility(operations) {
        if (operations.length < 2) return 0;

        const returns = operations.map((op) => op.resultado || 0);
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance =
            returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    _calculateSharpeRatio(operations) {
        if (operations.length < 2) return 0;

        const returns = operations.map((op) => op.resultado || 0);
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const volatility = this._calculateVolatility(operations);

        return volatility > 0 ? avgReturn / volatility : 0;
    }

    _calculateErrorRate() {
        if (!window.errorTracker) return 0;

        const stats = window.errorTracker.getErrorStats({
            since: Date.now() - 60 * 60 * 1000, // 1 hora
        });

        return stats.total || 0;
    }

    _calculateUptime() {
        return window.structuredLogger?.sessionStartTime
            ? Date.now() - window.structuredLogger.sessionStartTime
            : 0;
    }

    _detectSimplePatterns(data) {
        // Implementação simplificada de detecção de padrões
        const patterns = [];

        if (data.length < 5) return patterns;

        // Padrão de melhoria consistente no win rate
        const winRates = data.slice(-5).map((d) => d.trading.winRate);
        const improving = winRates.every((rate, i) => i === 0 || rate >= winRates[i - 1]);

        if (improving) {
            patterns.push({
                type: 'improving_winrate',
                confidence: 0.8,
                description: 'Win rate em tendência de melhoria',
            });
        }

        return patterns;
    }
}

// Instância global
const businessMetrics = new BusinessMetrics();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.businessMetrics = businessMetrics;
}

export default businessMetrics;
