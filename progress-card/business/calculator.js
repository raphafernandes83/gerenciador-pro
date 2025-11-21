/**
 * 🧮 Progress Card Calculator - Sistema de Cálculos Reais
 * 
 * Responsável por calcular todas as estatísticas e valores do card de progresso
 * seguindo princípios de responsabilidade única e funções puras.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Utilities (alphabetical order)
import { logger } from '../../src/utils/Logger.js';
import { toPercentage } from '../../src/utils/MathUtils.js';

/**
 * 🔢 Calcula estatísticas reais baseadas no histórico de operações
 * @param {Array} historico - Array de operações da sessão
 * @returns {Object} Estatísticas calculadas
 */
export function calculateRealStats(historico) {
    // Validação defensiva de entrada
    if (!Array.isArray(historico)) {
        logger.warn('⚠️ calculateRealStats: histórico não é array, usando array vazio');
        historico = [];
    }

    // Inicialização de contadores
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let validOperations = 0;

    // Processamento das operações com validação robusta
    for (const operacao of historico) {
        if (!operacao || typeof operacao !== 'object') {
            continue; // Pula operações inválidas
        }

        // Determina se é vitória ou derrota
        let isWin = null;
        if (typeof operacao.isWin === 'boolean') {
            isWin = operacao.isWin;
        } else if (typeof operacao.resultado === 'string') {
            isWin = operacao.resultado === 'win';
        } else {
            continue; // Pula se não conseguir determinar resultado
        }

        // Conta vitórias e derrotas
        if (isWin) {
            wins++;
        } else {
            losses++;
        }

        // Soma lucro/prejuízo se valor for válido
        if (typeof operacao.valor === 'number' && !isNaN(operacao.valor)) {
            totalProfit += operacao.valor;
        }

        validOperations++;
    }

    // Cálculo de percentuais
    const totalOperations = validOperations;
    const winRate = totalOperations > 0 ? toPercentage(wins / totalOperations) : 0;
    const lossRate = totalOperations > 0 ? toPercentage(losses / totalOperations) : 0;
    const remaining = Math.max(0, 100 - winRate - lossRate);

    // Retorna objeto com todas as estatísticas
    return {
        totalOperations,
        wins,
        losses,
        winRate,
        lossRate,
        remaining,
        totalProfit,
        validOperations
    };
}

/**
 * 📈 Calcula pontos percentuais (diferença entre atual e meta) - VERSÃO MELHORADA
 * @param {number} currentRate - Taxa atual (ex: 80.0)
 * @param {number} targetRate - Taxa meta (ex: 60.0)
 * @param {string} type - Tipo de cálculo ('winRate' ou 'lossRate') para lógica específica
 * @returns {Object} Objeto com display, classe CSS, valor e metadados
 */
export function calculatePointsPercentage(currentRate, targetRate, type = 'winRate') {
    // Validação defensiva de entrada
    const current = typeof currentRate === 'number' && !isNaN(currentRate) ? currentRate : 0;
    const target = typeof targetRate === 'number' && !isNaN(targetRate) ? targetRate : 0;
    
    // Cálculo da diferença
    const difference = current - target;
    const absoluteDifference = Math.abs(difference);
    
    // Lógica específica por tipo - CORRIGIDA para consistência visual
    let isPositive, symbol, cssClass, semanticMeaning, trendDirection;
    
    if (type === 'winRate') {
        // Para Win Rate: acima da meta é positivo (bom)
        isPositive = difference >= 0;
        symbol = difference >= 0 ? '▲' : '▼';
        trendDirection = difference >= 0 ? 'up' : 'down';
        cssClass = isPositive ? 'text-positive' : 'text-negative';
        semanticMeaning = isPositive ? 'Acima da meta' : 'Abaixo da meta';
    } else if (type === 'lossRate') {
        // Para Loss Rate: abaixo do limite é positivo (bom), mas seta segue direção real
        isPositive = difference <= 0; // Menos loss é melhor (positivo)
        symbol = difference > 0 ? '▲' : '▼'; // Seta segue direção real do valor
        trendDirection = difference > 0 ? 'up' : 'down'; // Direção real para CSS
        cssClass = isPositive ? 'text-positive' : 'text-negative'; // Cor baseada se é bom/ruim
        semanticMeaning = isPositive ? 'Dentro do limite' : 'Acima do limite';
    } else {
        // Fallback para tipos desconhecidos
        isPositive = difference >= 0;
        symbol = difference >= 0 ? '▲' : '▼';
        trendDirection = difference >= 0 ? 'up' : 'down';
        cssClass = isPositive ? 'text-positive' : 'text-negative';
        semanticMeaning = isPositive ? 'Positivo' : 'Negativo';
    }
    
    // Formatação do display com precisão adequada
    const formattedDifference = absoluteDifference < 0.1 ? '0.0' : absoluteDifference.toFixed(1);
    const display = `${symbol} ${formattedDifference} pp`;
    
    // Classe CSS baseada na direção real da seta (CORRIGIDO)
    const trendClass = trendDirection === 'up' ? 'trend-up' : 'trend-down';
    
    return {
        display,
        class: cssClass,
        trendClass, // Baseado na direção da seta
        trendDirection, // Direção real (up/down)
        value: difference,
        absoluteValue: absoluteDifference,
        isPositive, // Se é bom ou ruim (para cores)
        symbol,
        type,
        semanticMeaning,
        formattedValue: formattedDifference,
        // Propriedades para análise avançada
        isSignificant: absoluteDifference >= 1.0, // Diferença significativa
        magnitude: absoluteDifference < 5 ? 'small' : absoluteDifference < 15 ? 'medium' : 'large'
    };
}

/**
 * 💰 Calcula valores monetários baseados na configuração
 * @param {Object} config - Configuração do usuário
 * @param {Object} state - Estado atual da sessão
 * @returns {Object} Valores monetários calculados
 */
export function calculateMonetaryValues(config, state) {
    // Validação de entrada
    if (!config || !state) {
        logger.warn('⚠️ calculateMonetaryValues: config ou state inválidos');
        return {
            metaAmount: 0,
            achievedAmount: 0,
            riskAmount: 0,
            sessionPL: 0,
            progressPercent: 0,
            riskUsedPercent: 0
        };
    }

    // Extração de valores com fallbacks seguros
    const capitalInicial = typeof state.capitalInicioSessao === 'number' && !isNaN(state.capitalInicioSessao)
        ? state.capitalInicioSessao
        : (typeof config.capitalInicial === 'number' ? config.capitalInicial : 0);

    // 🔧 CORREÇÃO: Validação robusta que aceita number e string válida
    const stopWinPerc = (typeof config.stopWinPerc === 'number' && !isNaN(config.stopWinPerc)) 
        ? config.stopWinPerc 
        : (typeof config.stopWinPerc === 'string' && !isNaN(Number(config.stopWinPerc)))
            ? Number(config.stopWinPerc)
            : 10;
            
    const stopLossPerc = (typeof config.stopLossPerc === 'number' && !isNaN(config.stopLossPerc)) 
        ? config.stopLossPerc 
        : (typeof config.stopLossPerc === 'string' && !isNaN(Number(config.stopLossPerc)))
            ? Number(config.stopLossPerc)
            : 5;

    const capitalAtual = typeof state.capitalAtual === 'number' && !isNaN(state.capitalAtual)
        ? state.capitalAtual
        : capitalInicial;

    // Cálculos monetários
    const metaAmount = capitalInicial * (stopWinPerc / 100);
    const riskAmount = capitalInicial * (stopLossPerc / 100);
    const sessionPL = capitalAtual - capitalInicial;
    const achievedAmount = Math.max(0, sessionPL);
    
    // Cálculo de percentuais
    const progressPercent = metaAmount > 0 ? Math.min(100, (achievedAmount / metaAmount) * 100) : 0;
    const riskUsedPercent = sessionPL < 0 && riskAmount > 0 
        ? Math.min(100, (Math.abs(sessionPL) / riskAmount) * 100) 
        : 0;

    return {
        metaAmount,
        achievedAmount,
        riskAmount,
        sessionPL,
        progressPercent,
        riskUsedPercent,
        capitalInicial,
        capitalAtual
    };
}

/**
 * 🎯 Calcula dados completos para o card de progresso
 * @param {Array} historico - Histórico de operações
 * @param {Object} config - Configuração do usuário
 * @param {Object} state - Estado atual da sessão
 * @param {Object} previousData - Dados anteriores para comparação (opcional)
 * @returns {Object} Dados completos para atualização do card
 */
export function calculateProgressCardData(historico, config, state, previousData = null) {
    try {
        // Calcula estatísticas básicas
        const stats = calculateRealStats(historico);
        
        // Calcula valores monetários
        const monetary = calculateMonetaryValues(config, state);
        
        // Calcula pontos percentuais com lógica específica por tipo
        const winRatePointsData = calculatePointsPercentage(stats.winRate, config.metaWinRate || 60, 'winRate');
        const lossRatePointsData = calculatePointsPercentage(stats.lossRate, config.metaLossRate || 40, 'lossRate');
        
        // Inclui dados monetários anteriores para comparação de trends
        const previousMonetary = previousData?.monetary || null;
        
        // Retorna dados consolidados
        return {
            stats,
            monetary,
            previousMonetary, // Para cálculo de trends na FASE 3
            pointsPercentage: {
                winRate: winRatePointsData,
                lossRate: lossRatePointsData
            },
            isValid: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('❌ Erro ao calcular dados do card de progresso:', { error: String(error) });
        
        // Retorna dados seguros em caso de erro
        return {
            stats: {
                totalOperations: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                lossRate: 0,
                remaining: 100,
                totalProfit: 0,
                validOperations: 0
            },
            monetary: {
                metaAmount: 0,
                achievedAmount: 0,
                riskAmount: 0,
                sessionPL: 0,
                progressPercent: 0,
                riskUsedPercent: 0,
                capitalInicial: 0,
                capitalAtual: 0
            },
            previousMonetary: null,
            pointsPercentage: {
                winRate: { display: '▲ 0.0 pp', class: 'text-positive', value: 0, isPositive: true },
                lossRate: { display: '▼ 0.0 pp', class: 'text-negative', value: 0, isPositive: false }
            },
            isValid: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}


// Exposição global das funções principais
if (typeof window !== 'undefined') {
    window.calculateRealStats = calculateRealStats;
    window.calculatePointsPercentage = calculatePointsPercentage;
    window.calculateMonetaryValues = calculateMonetaryValues;
    window.calculateProgressCardData = calculateProgressCardData;
    console.log('🧮 Funções do Progress Card Calculator disponíveis globalmente');
}
