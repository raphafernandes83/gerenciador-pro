/**
 * Sistema de Recomendações Inteligentes baseado em IA
 * Analisa dados e gera recomendações personalizadas usando algoritmos de ML
 */

import structuredLogger from '../monitoring/StructuredLogger.js';
import errorTracker from '../monitoring/ErrorTracker.js';
import businessMetrics from './BusinessMetrics.js';

class AIRecommendations {
    constructor() {
        this.config = {
            enableMLAnalysis: true,
            confidenceThreshold: 0.6,
            maxRecommendations: 10,
            learningEnabled: true,
            adaptiveThresholds: true,
        };

        this.models = {
            patternRecognition: new PatternRecognitionModel(),
            riskAssessment: new RiskAssessmentModel(),
            performanceOptimization: new PerformanceOptimizationModel(),
            behavioralAnalysis: new BehavioralAnalysisModel(),
        };

        this.recommendations = [];
        this.feedbackHistory = [];
        this.modelPerformance = new Map();

        this._initializeAI();
    }

    /**
     * Inicializa o sistema de IA
     */
    async _initializeAI() {
        try {
            // Carregar dados históricos para treinamento
            await this._loadTrainingData();

            // Inicializar modelos
            for (const [name, model] of Object.entries(this.models)) {
                await model.initialize();
                this.modelPerformance.set(name, { accuracy: 0, predictions: 0, correct: 0 });
            }

            // Configurar aprendizado contínuo
            if (this.config.learningEnabled) {
                this._setupContinuousLearning();
            }

            structuredLogger.info('AI Recommendations system initialized', {
                models: Object.keys(this.models).length,
                learningEnabled: this.config.learningEnabled,
            });
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'ai_recommendations_init',
                severity: 'medium',
            });
        }
    }

    /**
     * Gera recomendações inteligentes baseadas nos dados atuais
     */
    async generateIntelligentRecommendations(context = {}) {
        try {
            const analysisContext = await this._prepareAnalysisContext(context);
            const recommendations = [];

            // Análise de padrões
            const patternRecommendations =
                await this.models.patternRecognition.analyze(analysisContext);
            recommendations.push(...patternRecommendations);

            // Avaliação de risco
            const riskRecommendations = await this.models.riskAssessment.analyze(analysisContext);
            recommendations.push(...riskRecommendations);

            // Otimização de performance
            const performanceRecommendations =
                await this.models.performanceOptimization.analyze(analysisContext);
            recommendations.push(...performanceRecommendations);

            // Análise comportamental
            const behavioralRecommendations =
                await this.models.behavioralAnalysis.analyze(analysisContext);
            recommendations.push(...behavioralRecommendations);

            // Filtrar e ranquear recomendações
            const filteredRecommendations = this._filterAndRankRecommendations(recommendations);

            // Personalizar recomendações
            const personalizedRecommendations = await this._personalizeRecommendations(
                filteredRecommendations,
                analysisContext
            );

            this.recommendations = personalizedRecommendations;

            // Log da geração
            structuredLogger.info('AI recommendations generated', {
                totalGenerated: recommendations.length,
                afterFiltering: filteredRecommendations.length,
                final: personalizedRecommendations.length,
            });

            return {
                success: true,
                recommendations: personalizedRecommendations,
                metadata: {
                    generatedAt: Date.now(),
                    context: analysisContext.summary,
                    confidence: this._calculateOverallConfidence(personalizedRecommendations),
                },
            };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'generate_intelligent_recommendations',
                severity: 'medium',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Processa feedback sobre recomendações para aprendizado
     */
    async processFeedback(recommendationId, feedback) {
        try {
            const recommendation = this.recommendations.find((r) => r.id === recommendationId);
            if (!recommendation) {
                throw new Error('Recommendation not found');
            }

            const feedbackEntry = {
                id: this._generateFeedbackId(),
                timestamp: Date.now(),
                recommendationId,
                recommendation: { ...recommendation },
                feedback: {
                    helpful: feedback.helpful,
                    implemented: feedback.implemented,
                    result: feedback.result,
                    rating: feedback.rating,
                    comments: feedback.comments,
                },
            };

            this.feedbackHistory.push(feedbackEntry);

            // Atualizar performance do modelo
            await this._updateModelPerformance(recommendation, feedback);

            // Retreinar modelos se necessário
            if (this.config.learningEnabled && this.feedbackHistory.length % 10 === 0) {
                await this._retrainModels();
            }

            structuredLogger.info('Feedback processed', {
                recommendationId,
                helpful: feedback.helpful,
                implemented: feedback.implemented,
            });

            return { success: true, feedbackId: feedbackEntry.id };
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'process_feedback',
                recommendationId,
                severity: 'low',
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Obtém recomendações ativas
     */
    getActiveRecommendations(filters = {}) {
        let filtered = [...this.recommendations];

        if (filters.category) {
            filtered = filtered.filter((r) => r.category === filters.category);
        }

        if (filters.priority) {
            filtered = filtered.filter((r) => r.priority === filters.priority);
        }

        if (filters.minConfidence) {
            filtered = filtered.filter((r) => r.confidence >= filters.minConfidence);
        }

        return filtered.sort((a, b) => {
            // Ordenar por prioridade e depois por confiança
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const aPriority = priorityOrder[a.priority] || 4;
            const bPriority = priorityOrder[b.priority] || 4;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            return b.confidence - a.confidence;
        });
    }

    /**
     * Obtém estatísticas do sistema de IA
     */
    getAIStats() {
        const totalRecommendations = this.recommendations.length;
        const totalFeedback = this.feedbackHistory.length;
        const implementedRecommendations = this.feedbackHistory.filter(
            (f) => f.feedback.implemented
        ).length;
        const helpfulRecommendations = this.feedbackHistory.filter(
            (f) => f.feedback.helpful
        ).length;

        const modelStats = {};
        for (const [name, performance] of this.modelPerformance) {
            modelStats[name] = {
                accuracy:
                    performance.predictions > 0 ? performance.correct / performance.predictions : 0,
                totalPredictions: performance.predictions,
                correctPredictions: performance.correct,
            };
        }

        return {
            recommendations: {
                active: totalRecommendations,
                totalGenerated: this.feedbackHistory.length + totalRecommendations,
                implementationRate:
                    totalFeedback > 0 ? implementedRecommendations / totalFeedback : 0,
                helpfulnessRate: totalFeedback > 0 ? helpfulRecommendations / totalFeedback : 0,
            },
            models: modelStats,
            learning: {
                enabled: this.config.learningEnabled,
                feedbackEntries: totalFeedback,
                lastRetrain: this.lastRetrainTime || null,
            },
        };
    }

    // Métodos privados
    async _prepareAnalysisContext(context) {
        // Coletar dados atuais
        const currentMetrics = businessMetrics.getDashboardMetrics();
        const sessionData = this._getSessionData();
        const historicalData = businessMetrics.historicalData.slice(-100); // Últimos 100 registros

        return {
            current: currentMetrics,
            session: sessionData,
            historical: historicalData,
            user: context.user || {},
            summary: {
                dataPoints: historicalData.length,
                sessionActive: sessionData.isSessionActive,
                currentProfit: currentMetrics?.kpis?.totalProfit || 0,
                winRate: currentMetrics?.kpis?.winRate || 0,
                riskScore: currentMetrics?.kpis?.riskScore || 0,
            },
        };
    }

    _filterAndRankRecommendations(recommendations) {
        return recommendations
            .filter((r) => r.confidence >= this.config.confidenceThreshold)
            .sort((a, b) => {
                // Ranquear por impacto, prioridade e confiança
                const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

                const aScore =
                    (impactOrder[a.impact] || 4) +
                    (priorityOrder[a.priority] || 4) -
                    a.confidence * 2;
                const bScore =
                    (impactOrder[b.impact] || 4) +
                    (priorityOrder[b.priority] || 4) -
                    b.confidence * 2;

                return aScore - bScore;
            })
            .slice(0, this.config.maxRecommendations);
    }

    async _personalizeRecommendations(recommendations, context) {
        // Personalizar baseado no perfil do usuário e histórico
        return recommendations.map((rec) => {
            const personalizedRec = { ...rec };

            // Ajustar confiança baseado no histórico de feedback
            const similarFeedback = this.feedbackHistory.filter(
                (f) =>
                    f.recommendation.category === rec.category && f.recommendation.type === rec.type
            );

            if (similarFeedback.length > 0) {
                const avgHelpfulness =
                    similarFeedback.reduce((sum, f) => sum + (f.feedback.helpful ? 1 : 0), 0) /
                    similarFeedback.length;

                personalizedRec.confidence = (personalizedRec.confidence + avgHelpfulness) / 2;
            }

            // Adicionar contexto personalizado
            personalizedRec.personalization = {
                relevanceScore: this._calculateRelevanceScore(rec, context),
                userProfile: this._getUserProfile(context),
                timing: this._calculateOptimalTiming(rec, context),
            };

            return personalizedRec;
        });
    }

    _calculateRelevanceScore(recommendation, context) {
        let score = 0.5; // Base score

        // Aumentar relevância baseado no estado atual
        if (
            recommendation.category === 'risk_management' &&
            context.current?.kpis?.riskScore > 70
        ) {
            score += 0.3;
        }

        if (recommendation.category === 'trading_strategy' && context.current?.kpis?.winRate < 50) {
            score += 0.3;
        }

        if (
            recommendation.category === 'performance' &&
            context.current?.status?.systemHealth === 'poor'
        ) {
            score += 0.2;
        }

        return Math.min(1, score);
    }

    _getUserProfile(context) {
        // Analisar perfil do usuário baseado no histórico
        const profile = {
            riskTolerance: 'medium',
            experienceLevel: 'intermediate',
            tradingStyle: 'balanced',
            preferences: {},
        };

        if (context.historical && context.historical.length > 0) {
            const avgRisk =
                context.historical.reduce((sum, d) => sum + (d.risk?.overallScore || 50), 0) /
                context.historical.length;

            profile.riskTolerance = avgRisk < 30 ? 'low' : avgRisk > 70 ? 'high' : 'medium';

            const avgOperations =
                context.historical.reduce((sum, d) => sum + (d.trading?.totalOperations || 0), 0) /
                context.historical.length;

            profile.tradingStyle =
                avgOperations > 20 ? 'aggressive' : avgOperations < 5 ? 'conservative' : 'balanced';
        }

        return profile;
    }

    _calculateOptimalTiming(recommendation, context) {
        // Calcular melhor momento para apresentar a recomendação
        const currentHour = new Date().getHours();

        if (recommendation.priority === 'critical') {
            return 'immediate';
        }

        if (currentHour >= 9 && currentHour <= 17) {
            return 'business_hours';
        }

        return 'next_session';
    }

    async _updateModelPerformance(recommendation, feedback) {
        const modelName = recommendation.source || 'unknown';
        const performance = this.modelPerformance.get(modelName);

        if (performance) {
            performance.predictions++;

            if (feedback.helpful && feedback.result === 'positive') {
                performance.correct++;
            }

            this.modelPerformance.set(modelName, performance);
        }
    }

    async _retrainModels() {
        try {
            structuredLogger.info('Starting model retraining');

            for (const [name, model] of Object.entries(this.models)) {
                if (model.retrain) {
                    await model.retrain(this.feedbackHistory);
                }
            }

            this.lastRetrainTime = Date.now();

            structuredLogger.info('Model retraining completed');
        } catch (error) {
            errorTracker.trackError(error, {
                context: 'retrain_models',
                severity: 'medium',
            });
        }
    }

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

    _generateFeedbackId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _calculateOverallConfidence(recommendations) {
        if (recommendations.length === 0) return 0;

        return recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
    }

    async _loadTrainingData() {
        // Carregar dados históricos para treinamento inicial
        try {
            const stored = localStorage.getItem('ai_training_data');
            if (stored) {
                const data = JSON.parse(stored);
                this.feedbackHistory = data.feedbackHistory || [];
            }
        } catch (error) {
            structuredLogger.warn('Failed to load training data', { error: error.message });
        }
    }

    _setupContinuousLearning() {
        // Salvar dados de treinamento periodicamente
        setInterval(
            () => {
                try {
                    const trainingData = {
                        feedbackHistory: this.feedbackHistory.slice(-200), // Últimos 200 feedbacks
                        modelPerformance: Object.fromEntries(this.modelPerformance),
                        lastUpdate: Date.now(),
                    };

                    localStorage.setItem('ai_training_data', JSON.stringify(trainingData));
                } catch (error) {
                    // Ignorar erros de quota
                }
            },
            5 * 60 * 1000
        ); // A cada 5 minutos
    }
}

// Classes de modelos simplificadas
class PatternRecognitionModel {
    async initialize() {
        this.patterns = new Map();
    }

    async analyze(context) {
        const recommendations = [];

        // Detectar padrões simples nos dados históricos
        if (context.historical && context.historical.length >= 10) {
            const winRates = context.historical.slice(-10).map((d) => d.trading?.winRate || 0);
            const trend = this._calculateTrend(winRates);

            if (trend < -5) {
                recommendations.push({
                    id: `pattern_${Date.now()}_1`,
                    type: 'declining_performance',
                    category: 'trading_strategy',
                    priority: 'high',
                    confidence: 0.8,
                    title: 'Tendência de Queda na Performance',
                    description:
                        'Detectada tendência de declínio no win rate. Recomenda-se revisar estratégia.',
                    impact: 'high',
                    effort: 'medium',
                    source: 'patternRecognition',
                    actions: [
                        'Analisar últimas operações perdedoras',
                        'Revisar critérios de entrada',
                        'Considerar pausa para reavaliação',
                    ],
                });
            }
        }

        return recommendations;
    }

    _calculateTrend(values) {
        if (values.length < 2) return 0;

        const first = values[0];
        const last = values[values.length - 1];

        return ((last - first) / first) * 100;
    }
}

class RiskAssessmentModel {
    async initialize() {
        this.riskThresholds = { low: 30, medium: 60, high: 80 };
    }

    async analyze(context) {
        const recommendations = [];
        const currentRisk = context.current?.kpis?.riskScore || 0;

        if (currentRisk > this.riskThresholds.high) {
            recommendations.push({
                id: `risk_${Date.now()}_1`,
                type: 'high_risk_alert',
                category: 'risk_management',
                priority: 'critical',
                confidence: 0.9,
                title: 'Nível de Risco Crítico',
                description: `Risco atual (${currentRisk.toFixed(1)}) acima do limite seguro.`,
                impact: 'critical',
                effort: 'low',
                source: 'riskAssessment',
                actions: [
                    'Reduzir valor das operações imediatamente',
                    'Implementar stop loss mais restritivo',
                    'Pausar trading até revisão completa',
                ],
            });
        }

        return recommendations;
    }
}

class PerformanceOptimizationModel {
    async initialize() {
        this.performanceThresholds = { memory: 400, fps: 45, errorRate: 5 };
    }

    async analyze(context) {
        const recommendations = [];

        if (context.current?.status?.systemHealth === 'poor') {
            recommendations.push({
                id: `perf_${Date.now()}_1`,
                type: 'system_optimization',
                category: 'performance',
                priority: 'medium',
                confidence: 0.7,
                title: 'Otimização do Sistema Necessária',
                description: 'Performance do sistema abaixo do ideal.',
                impact: 'medium',
                effort: 'low',
                source: 'performanceOptimization',
                actions: [
                    'Executar limpeza de cache',
                    'Reiniciar aplicação',
                    'Verificar conectividade',
                ],
            });
        }

        return recommendations;
    }
}

class BehavioralAnalysisModel {
    async initialize() {
        this.behaviorPatterns = new Map();
    }

    async analyze(context) {
        const recommendations = [];

        // Analisar padrões comportamentais simples
        if (context.session?.isSessionActive) {
            const sessionDuration = Date.now() - (context.session?.sessionStartTime || Date.now());

            if (sessionDuration > 4 * 60 * 60 * 1000) {
                // 4 horas
                recommendations.push({
                    id: `behavior_${Date.now()}_1`,
                    type: 'fatigue_warning',
                    category: 'behavioral',
                    priority: 'medium',
                    confidence: 0.6,
                    title: 'Possível Fadiga Detectada',
                    description: 'Sessão longa pode impactar qualidade das decisões.',
                    impact: 'medium',
                    effort: 'low',
                    source: 'behavioralAnalysis',
                    actions: [
                        'Considerar fazer uma pausa',
                        'Revisar últimas operações',
                        'Finalizar sessão se necessário',
                    ],
                });
            }
        }

        return recommendations;
    }
}

// Instância global
const aiRecommendations = new AIRecommendations();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.aiRecommendations = aiRecommendations;
}

export default aiRecommendations;
