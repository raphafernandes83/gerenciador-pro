/**
 * ESTRATÉGIAS AVANÇADAS - GERENCIADOR PRO v9.3
 *
 * Demonstração de como facilmente expandir o sistema com novas estratégias
 * Aproveita a nova arquitetura modular e extensível
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { TradingStrategy, TradingStrategyFactory } from '../business/TradingStrategy.js';
import { calculateEntryAmount, calculateReturnAmount } from '../utils/MathUtils.js';
import { TRADING_STRATEGIES } from '../constants/AppConstants.js';
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';
import { performanceMonitor } from '../monitoring/PerformanceMonitor.js';
import { cacheManager } from '../enhancements/CacheManager.js';
import { memoize, debounce } from '../utils/PerformanceUtils.js';

/**
 * Estratégia Fibonacci - Baseada na sequência de Fibonacci
 * Demonstra como criar uma estratégia completamente nova
 */
export class FibonacciStrategy extends TradingStrategy {
    constructor() {
        super();
        this.name = 'FIBONACCI';
        this.description =
            'Estratégia baseada na sequência de Fibonacci para progressão de entradas';
        this.category = 'PROGRESSIVE';
        this.riskLevel = 'MEDIUM';

        // Cache para sequência de Fibonacci
        this.fibonacciCache = new Map();
    }

    /**
     * Calcula plano de operações usando Fibonacci
     *
     * @param {Object} config - Configuração da estratégia
     * @returns {Array} Plano de operações
     */
    calculatePlan(config) {
        try {
            const timer = performanceMonitor.measureFunction('fibonacci_calculate_plan', () => {
                return this._performCalculation(config);
            });

            return timer;
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.BUSINESS,
                'FibonacciStrategy.calculatePlan'
            );
            return [];
        }
    }

    /**
     * Executa o cálculo principal
     * @private
     */
    _performCalculation(config) {
        const {
            capitalInicial,
            percentualEntrada,
            stopWinPerc,
            stopLossPerc,
            payout,
            maxCycles = 10,
        } = config;

        const plano = [];
        const entradaBase = calculateEntryAmount(capitalInicial, percentualEntrada);
        const stopWin = capitalInicial * (stopWinPerc / 100);
        const stopLoss = capitalInicial * (stopLossPerc / 100);

        let capitalAtual = capitalInicial;
        let perdaAcumulada = 0;

        for (let ciclo = 1; ciclo <= maxCycles; ciclo++) {
            // Obter número de Fibonacci para este ciclo
            const fibNumber = this._getFibonacci(ciclo);
            const entradaCiclo = entradaBase * fibNumber;

            // Calcular retorno em caso de vitória
            const retornoBruto = calculateReturnAmount(entradaCiclo, payout);
            const lucroLiquido = retornoBruto - entradaCiclo;

            // Simular cenários
            const cenarioVitoria = {
                capitalFinal: capitalAtual + lucroLiquido,
                lucro: lucroLiquido - perdaAcumulada,
                recuperou: lucroLiquido >= perdaAcumulada,
            };

            const cenarioDerrota = {
                capitalFinal: capitalAtual - entradaCiclo,
                prejuizo: entradaCiclo,
                perdaTotal: perdaAcumulada + entradaCiclo,
            };

            plano.push({
                ciclo,
                fibonacciNumber: fibNumber,
                entradaValor: entradaCiclo,
                entradaPercentual: ((entradaCiclo / capitalInicial) * 100).toFixed(2),
                retornoBruto,
                lucroLiquido,
                perdaAcumulada,
                cenarioVitoria,
                cenarioDerrota,
                // Flags de controle
                stopWinAtingido: cenarioVitoria.capitalFinal >= capitalInicial + stopWin,
                stopLossAtingido: cenarioDerrota.capitalFinal <= capitalInicial - stopLoss,
                recommendedStop: this._shouldStop(ciclo, perdaAcumulada, capitalAtual, config),
            });

            // Atualizar para próximo ciclo (simulando derrota)
            capitalAtual = cenarioDerrota.capitalFinal;
            perdaAcumulada = cenarioDerrota.perdaTotal;

            // Verificar stop loss
            if (plano[ciclo - 1].stopLossAtingido) {
                break;
            }
        }

        return plano;
    }

    /**
     * Obtém número da sequência de Fibonacci com cache
     * @private
     */
    _getFibonacci(n) {
        // Usar cache para otimização
        const cacheKey = `fib_${n}`;

        if (this.fibonacciCache.has(cacheKey)) {
            return this.fibonacciCache.get(cacheKey);
        }

        let result;
        if (n <= 2) {
            result = 1;
        } else {
            result = this._getFibonacci(n - 1) + this._getFibonacci(n - 2);
        }

        this.fibonacciCache.set(cacheKey, result);
        return result;
    }

    /**
     * Determina se deve parar a progressão
     * @private
     */
    _shouldStop(ciclo, perdaAcumulada, capitalAtual, config) {
        const { capitalInicial, maxRiskPercentage = 20 } = config;

        // Parar se risco exceder o limite
        const riskPercentage = (perdaAcumulada / capitalInicial) * 100;

        return riskPercentage > maxRiskPercentage;
    }

    /**
     * Valida configuração específica desta estratégia
     */
    validateConfig(config) {
        const errors = super.validateConfig(config);

        if (config.maxCycles && (config.maxCycles < 1 || config.maxCycles > 20)) {
            errors.push('Máximo de ciclos deve estar entre 1 e 20');
        }

        if (
            config.maxRiskPercentage &&
            (config.maxRiskPercentage < 5 || config.maxRiskPercentage > 50)
        ) {
            errors.push('Percentual máximo de risco deve estar entre 5% e 50%');
        }

        return errors;
    }
}

/**
 * Estratégia Martingale Inverso - Aumenta aposta após vitórias
 * Demonstra variação de estratégias existentes
 */
export class InverseMartingaleStrategy extends TradingStrategy {
    constructor() {
        super();
        this.name = 'INVERSE_MARTINGALE';
        this.description =
            'Martingale inverso - aumenta aposta após vitórias, mantém base após derrotas';
        this.category = 'AGGRESSIVE';
        this.riskLevel = 'HIGH';
    }

    calculatePlan(config) {
        try {
            return performanceMonitor.measureFunction('inverse_martingale_plan', () => {
                return this._calculateInverseMartingalePlan(config);
            });
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.BUSINESS,
                'InverseMartingaleStrategy.calculatePlan'
            );
            return [];
        }
    }

    /**
     * Calcula plano do Martingale Inverso
     * @private
     */
    _calculateInverseMartingalePlan(config) {
        const {
            capitalInicial,
            percentualEntrada,
            payout,
            maxWinStreak = 5,
            multiplier = 2,
        } = config;

        const plano = [];
        const entradaBase = calculateEntryAmount(capitalInicial, percentualEntrada);

        for (let streak = 1; streak <= maxWinStreak; streak++) {
            const entradaAtual = entradaBase * Math.pow(multiplier, streak - 1);
            const retornoBruto = calculateReturnAmount(entradaAtual, payout);
            const lucroLiquido = retornoBruto - entradaAtual;

            // Calcular lucro acumulado em uma sequência de vitórias
            let lucroAcumulado = 0;
            let entradaTemp = entradaBase;

            for (let i = 1; i <= streak; i++) {
                const retornoTemp = calculateReturnAmount(entradaTemp, payout);
                lucroAcumulado += retornoTemp - entradaTemp;
                entradaTemp = entradaBase * Math.pow(multiplier, i);
            }

            plano.push({
                sequenciaVitorias: streak,
                entradaValor: entradaAtual,
                entradaPercentual: ((entradaAtual / capitalInicial) * 100).toFixed(2),
                retornoBruto,
                lucroOperacao: lucroLiquido,
                lucroAcumuladoSequencia: lucroAcumulado,
                riskRewardRatio: (lucroLiquido / entradaAtual).toFixed(2),
                recommendedStop: this._shouldStopInverse(
                    streak,
                    entradaAtual,
                    capitalInicial,
                    config
                ),
            });
        }

        return plano;
    }

    /**
     * Determina se deve parar no Martingale Inverso
     * @private
     */
    _shouldStopInverse(streak, entrada, capitalInicial, config) {
        const { maxRiskPerOperation = 10 } = config;
        const riskPercentage = (entrada / capitalInicial) * 100;

        return riskPercentage > maxRiskPerOperation || streak >= 5;
    }

    validateConfig(config) {
        const errors = super.validateConfig(config);

        if (config.maxWinStreak && (config.maxWinStreak < 2 || config.maxWinStreak > 10)) {
            errors.push('Sequência máxima de vitórias deve estar entre 2 e 10');
        }

        if (config.multiplier && (config.multiplier < 1.5 || config.multiplier > 5)) {
            errors.push('Multiplicador deve estar entre 1.5 e 5');
        }

        return errors;
    }
}

/**
 * Estratégia Adaptativa - Ajusta-se dinamicamente baseado no histórico
 * Demonstra estratégias inteligentes com machine learning básico
 */
export class AdaptiveStrategy extends TradingStrategy {
    constructor() {
        super();
        this.name = 'ADAPTIVE';
        this.description = 'Estratégia que se adapta baseada no histórico de performance';
        this.category = 'INTELLIGENT';
        this.riskLevel = 'MEDIUM';

        // Sistema de aprendizado
        this.learningData = {
            sessionHistory: [],
            successPatterns: new Map(),
            adaptationCount: 0,
            lastAdaptation: 0,
        };
    }

    calculatePlan(config) {
        try {
            // Analisar histórico antes de calcular
            this._analyzeHistoricalData(config);

            return performanceMonitor.measureFunction('adaptive_plan', () => {
                return this._calculateAdaptivePlan(config);
            });
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.BUSINESS, 'AdaptiveStrategy.calculatePlan');
            return [];
        }
    }

    /**
     * Calcula plano adaptativo
     * @private
     */
    _calculateAdaptivePlan(config) {
        const adaptedConfig = this._adaptConfiguration(config);

        const {
            capitalInicial,
            percentualEntrada: baseEntry,
            payout,
            adaptationLevel = 1,
        } = adaptedConfig;

        const plano = [];
        const sessionsToSimulate = 10;

        for (let session = 1; session <= sessionsToSimulate; session++) {
            // Ajustar entrada baseado no padrão identificado
            const entryMultiplier = this._getAdaptedMultiplier(session, adaptationLevel);
            const entradaAdaptada = calculateEntryAmount(
                capitalInicial,
                baseEntry * entryMultiplier
            );

            const retornoBruto = calculateReturnAmount(entradaAdaptada, payout);
            const lucroLiquido = retornoBruto - entradaAdaptada;

            // Calcular confiança da adaptação
            const confidence = this._calculateAdaptationConfidence(session);

            plano.push({
                sessao: session,
                entradaValor: entradaAdaptada,
                entradaPercentual: ((entradaAdaptada / capitalInicial) * 100).toFixed(2),
                multiplicadorAdaptacao: entryMultiplier.toFixed(2),
                retornoBruto,
                lucroLiquido,
                confiancaAdaptacao: (confidence * 100).toFixed(1) + '%',
                padraoIdentificado: this._getIdentifiedPattern(session),
                recomendacaoRisco: this._getRiskRecommendation(entradaAdaptada, capitalInicial),
            });
        }

        return plano;
    }

    /**
     * Analisa dados históricos para aprendizado
     * @private
     */
    _analyzeHistoricalData(config) {
        // Cache da análise com TTL de 5 minutos
        const cacheKey = 'adaptive_analysis';
        const cachedAnalysis = cacheManager.get(cacheKey);

        if (cachedAnalysis) {
            this.learningData = { ...this.learningData, ...cachedAnalysis };
            return;
        }

        // Simular análise de dados históricos
        const analysis = this._performHistoricalAnalysis();

        // Armazenar no cache
        cacheManager.set(cacheKey, analysis, { ttl: 300000 }); // 5 minutos

        this.learningData = { ...this.learningData, ...analysis };
    }

    /**
     * Realiza análise histórica
     * @private
     */
    _performHistoricalAnalysis() {
        // Simular padrões identificados
        const patterns = [
            { type: 'MORNING_HIGH_SUCCESS', confidence: 0.75, adjustment: 1.2 },
            { type: 'AFTERNOON_MODERATE', confidence: 0.6, adjustment: 1.0 },
            { type: 'EVENING_CONSERVATIVE', confidence: 0.85, adjustment: 0.8 },
        ];

        return {
            analyzedSessions: 100,
            identifiedPatterns: patterns,
            overallSuccessRate: 0.68,
            lastAnalysis: Date.now(),
        };
    }

    /**
     * Adapta configuração baseado no aprendizado
     * @private
     */
    _adaptConfiguration(config) {
        const currentHour = new Date().getHours();
        let adaptationFactor = 1;

        // Adaptar baseado no horário (exemplo simples)
        if (currentHour >= 9 && currentHour <= 11) {
            adaptationFactor = 1.2; // Manhã - mais agressivo
        } else if (currentHour >= 14 && currentHour <= 16) {
            adaptationFactor = 1.0; // Tarde - moderado
        } else {
            adaptationFactor = 0.8; // Noite - conservador
        }

        return {
            ...config,
            percentualEntrada: config.percentualEntrada * adaptationFactor,
            adaptationFactor,
            adaptationTime: currentHour,
        };
    }

    /**
     * Obtém multiplicador adaptado para sessão
     * @private
     */
    _getAdaptedMultiplier(session, adaptationLevel) {
        const baseMultiplier = 1;
        const adaptationStrength = adaptationLevel * 0.1;

        // Variar baseado na sessão (simulando adaptação)
        const sessionVariation = Math.sin(session * 0.5) * adaptationStrength;

        return Math.max(0.5, baseMultiplier + sessionVariation);
    }

    /**
     * Calcula confiança da adaptação
     * @private
     */
    _calculateAdaptationConfidence(session) {
        const baseConfidence = 0.7;
        const experienceFactor = Math.min(this.learningData.adaptationCount * 0.02, 0.2);
        const sessionFactor = Math.min(session * 0.01, 0.1);

        return Math.min(baseConfidence + experienceFactor + sessionFactor, 0.95);
    }

    /**
     * Identifica padrão atual
     * @private
     */
    _getIdentifiedPattern(session) {
        const patterns = [
            'Tendência de Alta',
            'Consolidação',
            'Volatilidade Baixa',
            'Padrão Otimista',
        ];
        return patterns[session % patterns.length];
    }

    /**
     * Obtém recomendação de risco
     * @private
     */
    _getRiskRecommendation(entrada, capital) {
        const riskPercentage = (entrada / capital) * 100;

        if (riskPercentage < 2) return 'BAIXO RISCO';
        if (riskPercentage < 5) return 'RISCO MODERADO';
        return 'ALTO RISCO';
    }

    validateConfig(config) {
        const errors = super.validateConfig(config);

        if (
            config.adaptationLevel &&
            (config.adaptationLevel < 0.1 || config.adaptationLevel > 3)
        ) {
            errors.push('Nível de adaptação deve estar entre 0.1 e 3');
        }

        return errors;
    }
}

/**
 * Função para registrar todas as novas estratégias no sistema
 * Demonstra como facilmente expandir o sistema
 */
export function registerAdvancedStrategies() {
    try {
        console.log('🚀 Registrando estratégias avançadas...');

        // Registrar estratégia Fibonacci
        TradingStrategyFactory.registerStrategy('FIBONACCI', FibonacciStrategy);
        console.log('✅ Estratégia Fibonacci registrada');

        // Registrar estratégia Martingale Inverso
        TradingStrategyFactory.registerStrategy('INVERSE_MARTINGALE', InverseMartingaleStrategy);
        console.log('✅ Estratégia Martingale Inverso registrada');

        // Registrar estratégia Adaptativa
        TradingStrategyFactory.registerStrategy('ADAPTIVE', AdaptiveStrategy);
        console.log('✅ Estratégia Adaptativa registrada');

        console.log('🎉 Todas as estratégias avançadas foram registradas com sucesso!');

        // Registrar no monitor de performance
        if (performanceMonitor.isEnabled) {
            performanceMonitor.addCustomMetric('advanced_strategies_registered', 3, {
                timestamp: Date.now(),
                strategies: ['FIBONACCI', 'INVERSE_MARTINGALE', 'ADAPTIVE'],
            });
        }

        return true;
    } catch (error) {
        errorHandler.handleError(error, ERROR_TYPES.SYSTEM, 'registerAdvancedStrategies');
        return false;
    }
}

/**
 * Demonstração de uso das novas estratégias
 */
export function demonstrateAdvancedStrategies() {
    console.group('🎯 Demonstração de Estratégias Avançadas');

    try {
        const sampleConfig = {
            capitalInicial: 10000,
            percentualEntrada: 2,
            payout: 87,
            stopWinPerc: 15,
            stopLossPerc: 20,
        };

        // Testar Fibonacci
        console.log('📈 Testando Estratégia Fibonacci:');
        const fibStrategy = TradingStrategyFactory.create('FIBONACCI');
        const fibPlan = fibStrategy.calculatePlan({ ...sampleConfig, maxCycles: 5 });
        console.log(`✅ Fibonacci: ${fibPlan.length} operações planejadas`);

        // Testar Martingale Inverso
        console.log('📊 Testando Martingale Inverso:');
        const inverseStrategy = TradingStrategyFactory.create('INVERSE_MARTINGALE');
        const inversePlan = inverseStrategy.calculatePlan({ ...sampleConfig, maxWinStreak: 4 });
        console.log(`✅ Martingale Inverso: ${inversePlan.length} operações planejadas`);

        // Testar Adaptativa
        console.log('🧠 Testando Estratégia Adaptativa:');
        const adaptiveStrategy = TradingStrategyFactory.create('ADAPTIVE');
        const adaptivePlan = adaptiveStrategy.calculatePlan({
            ...sampleConfig,
            adaptationLevel: 1.5,
        });
        console.log(`✅ Adaptativa: ${adaptivePlan.length} operações planejadas`);

        console.log('🎉 Demonstração concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na demonstração:', error);
    }

    console.groupEnd();
}

// Exportar utilidades
export const AdvancedStrategiesUtils = {
    registerAdvancedStrategies,
    demonstrateAdvancedStrategies,
    strategies: {
        FibonacciStrategy,
        InverseMartingaleStrategy,
        AdaptiveStrategy,
    },
};
