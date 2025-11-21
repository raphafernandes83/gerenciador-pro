/**
 * 🔄 Progress Card Updater - Sistema de Atualização do Card
 * 
 * Responsável por atualizar todos os elementos DOM do card de progresso
 * com dados calculados, seguindo princípios de responsabilidade única.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Constants
import {
    MESSAGES,
    ANIMATION,
    PERFORMANCE
} from '../config/constants.js';

// Core modules
import { dom } from '../../dom.js';

// Business Logic (lógica pura, sem DOM)
import {
    validateCardData,
    determineSessionState,
    determineDynamicColors
} from '../business/logic.js';

// UI Rendering (manipulação DOM pura)
import {
    renderSessionInfo,
    renderDynamicColors,
    renderPercentageElements,
    clearProgressCardUI
} from './renderer.js';

// Optimized rendering (performance)
import {
    updateProgressCardOptimized,
    renderPercentageElementsOptimized,
    renderWithFallback
} from './optimized-renderer.js';

// State management
import {
    getProgressCardState,
    updateProgressCardState,
    observeProgressCardState
} from '../utils/state-manager.js';

import {
    stateSynchronizer,
    initializeStateSync
} from '../utils/state-synchronizer.js';

// Error handling
import {
    errorHandler,
    handleProgressCardError,
    safeExecute,
    safeExecuteAsync,
    ERROR_TYPES,
    ERROR_SEVERITY
} from '../utils/error-handler.js';

// Internal modules
import {
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced
} from '../../utils/monetary.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

/**
 * 🎯 Atualiza todos os elementos do card de progresso - VERSÃO COM ESTADO GERENCIADO
 * @param {Object} cardData - Dados calculados do card
 * @param {Object} chartInstance - Instância do Chart.js
 * @param {boolean} useOptimized - Se deve usar renderização otimizada (padrão: true)
 * @param {boolean} updateState - Se deve atualizar o estado centralizado (padrão: true)
 * @returns {boolean} True se atualização foi bem-sucedida
 */
export function updateProgressCardComplete(cardData, chartInstance = null, useOptimized = true, updateState = true) {
    return safeExecute(() => {
        logger.debug(MESSAGES.LOG_CARD_UPDATE_START);

        // 🛡️ VALIDAÇÃO INICIAL: Verifica se dados são válidos
        if (!cardData) {
            throw new Error('cardData é obrigatório');
        }

        // 🏪 ATUALIZAÇÃO DE ESTADO: Sincroniza com estado centralizado
        if (updateState && cardData) {
            const stateUpdateResult = safeExecute(() => {
                const stateUpdate = {
                    stats: cardData.stats,
                    monetary: cardData.monetary,
                    pointsPercentage: cardData.pointsPercentage
                };

                return updateProgressCardState(stateUpdate, {
                    source: 'card-update',
                    validate: true,
                    notify: false // Evita loop de notificação
                });
            }, ERROR_TYPES.STATE_SYNC_FAILED, {
                operation: 'state_update',
                cardData: !!cardData
            });

            if (!stateUpdateResult.success) {
                logger.warn('⚠️ Falha na atualização de estado, continuando sem sincronização');
            }
        }

        // ⚡ MODO OTIMIZADO: Usa sistema de performance com tratamento de erro
        if (useOptimized) {
            return safeExecute(() => {
                return renderWithFallback(
                    () => updateProgressCardOptimized(cardData, chartInstance),
                    () => updateProgressCardComplete(cardData, chartInstance, false, false), // fallback sem estado
                    cardData,
                    chartInstance
                );
            }, ERROR_TYPES.RENDER_FAILED, {
                operation: 'optimized_render',
                hasChartInstance: !!chartInstance
            });
        }

        // 📊 MODO TRADICIONAL: Renderização sequencial com tratamento de erro

        // 1. VALIDAÇÃO - Lógica de negócio pura
        const validation = safeExecute(() => {
            return validateCardData(cardData);
        }, ERROR_TYPES.DATA_INVALID, {
            operation: 'data_validation'
        });

        if (validation.shouldClear) {
            logger.warn(`⚠️ ${validation.reason}, limpando card`);
            safeExecute(() => {
                clearProgressCardUI();
            }, ERROR_TYPES.RENDER_FAILED, {
                operation: 'clear_ui'
            });
            return validation.reason !== 'Dados do card inválidos';
        }

        const { stats, monetary, pointsPercentage } = cardData;

        // 2. GRÁFICO - Atualiza gráfico de pizza com tratamento de erro
        const chartSuccess = safeExecute(() => {
            return updateProgressChart(stats, chartInstance);
        }, ERROR_TYPES.CHART_ERROR, {
            operation: 'chart_update',
            hasStats: !!stats
        });

        // 3. PERCENTUAIS - Nova arquitetura separada (lógica + UI)
        safeExecute(() => {
            renderPercentageElements(stats, pointsPercentage);
        }, ERROR_TYPES.RENDER_FAILED, {
            operation: 'percentage_render'
        });

        // 4. MONETÁRIO - Sistema avançado existente
        safeExecute(() => {
            const performance = calculateMonetaryPerformance(monetary, cardData.previousMonetary);
            updateMonetaryElementsAdvanced(monetary, performance, PERFORMANCE.MONETARY_CONFIG);
        }, ERROR_TYPES.RENDER_FAILED, {
            operation: 'monetary_update'
        });

        // 5. SESSÃO - Nova arquitetura separada (lógica + UI)
        safeExecute(() => {
            const sessionState = determineSessionState(stats);
            renderSessionInfo(sessionState);
        }, ERROR_TYPES.RENDER_FAILED, {
            operation: 'session_render'
        });

        // 6. CORES DINÂMICAS - Nova arquitetura separada (lógica + UI)
        safeExecute(() => {
            const colorScheme = determineDynamicColors(stats, pointsPercentage);
            renderDynamicColors(colorScheme);
        }, ERROR_TYPES.RENDER_FAILED, {
            operation: 'colors_render'
        });

        logger.debug(MESSAGES.LOG_CARD_UPDATE_SUCCESS);
        return true;

    }, ERROR_TYPES.CRITICAL_FAILURE, {
        operation: 'complete_card_update',
        useOptimized,
        updateState
    });
}

/**
 * 📊 Atualiza o gráfico de pizza
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} chartInstance - Instância do Chart.js
 * @returns {boolean} True se atualização foi bem-sucedida
 */
export function updateProgressChart(stats, chartInstance = null) {
    try {
        // Se não há instância do gráfico, tenta obter do charts.js
        const chart = chartInstance || (window.charts && window.charts.progressMetasChart);

        if (!chart) {
            logger.warn('⚠️ Instância do gráfico não encontrada');
            return false;
        }

        // Atualiza dados do gráfico com proporções corretas
        if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
            chart.data.datasets[0].data = [
                stats.winRate,   // Percentual de vitórias
                stats.lossRate   // Percentual de derrotas
            ];

            // Atualiza estatísticas para o plugin de texto central
            chart.$currentStats = {
                winRate: stats.winRate,
                totalOperations: stats.totalOperations
            };

            // Força atualização do gráfico
            chart.update(ANIMATION.CHART_UPDATE_NONE);

            logger.debug('📊 Gráfico atualizado:', {
                winRate: stats.winRate,
                lossRate: stats.lossRate,
                totalOps: stats.totalOperations
            });
        }

        return true;
    } catch (error) {
        logger.error('❌ Erro ao atualizar gráfico:', { error: String(error) });
        return false;
    }
}

/**
 * 📈 Atualiza elementos de percentual com pontos percentuais - VERSÃO OTIMIZADA
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 * @param {boolean} useOptimized - Se deve usar renderização otimizada (padrão: true)
 */
export function updatePercentageElements(stats, pointsPercentage, useOptimized = true) {
    try {
        // ⚡ MODO OTIMIZADO: Usa sistema de performance
        if (useOptimized) {
            const success = renderWithFallback(
                () => renderPercentageElementsOptimized(stats, pointsPercentage),
                () => renderPercentageElements(stats, pointsPercentage),
                stats,
                pointsPercentage
            );

            if (success) {
                // Mantém elementos de metas (valores fixos) - sistema existente
                updateTargetElements();
                logger.debug('⚡ Elementos de percentual atualizados (modo otimizado)');
                return;
            }
        }

        // 📊 MODO TRADICIONAL: Renderização direta
        renderPercentageElements(stats, pointsPercentage);

        // Mantém elementos de metas (valores fixos) - sistema existente
        updateTargetElements();

        logger.debug('📈 Elementos de percentual atualizados (nova arquitetura)');
    } catch (error) {
        logger.error('❌ Erro ao atualizar percentuais:', { error: String(error) });
    }
}

/**
 * 🎯 Atualiza elementos de Win Rate com pontos percentuais
 * @private
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} winRateData - Dados de pontos percentuais do Win Rate
 */
function updateWinRateElements(stats, winRateData) {
    // CORREÇÃO: Verifica se há operações reais
    const hasOperations = stats.totalOperations > 0;
    const isZero = stats.winRate === 0;

    // Atualiza o elemento principal do card (win-current-value)
    if (dom.winCurrentValue) {
        // CORREÇÃO PROFISSIONAL: Sempre mostra apenas percentual limpo
        dom.winCurrentValue.textContent = `${stats.winRate.toFixed(1)}%`;

        if (!hasOperations || isZero) {
            // Zero = CINZA
            dom.winCurrentValue.className = 'metric-value text-neutral';
            dom.winCurrentValue.style.setProperty('color', '#6b7280', 'important');
            dom.winCurrentValue.style.setProperty('font-weight', '500', 'important');
        } else {
            // Maior que zero = VERDE
            dom.winCurrentValue.className = 'metric-value text-positive';
            dom.winCurrentValue.style.setProperty('color', '#059669', 'important');
            dom.winCurrentValue.style.setProperty('font-weight', '600', 'important');
        }

        // Atributos semânticos
        dom.winCurrentValue.setAttribute('title', `Win Rate: ${stats.winRate.toFixed(1)}%${hasOperations ? ` (${winRateData.semanticMeaning})` : ''}`);

        if (hasOperations && !isZero) {
            dom.winCurrentValue.setAttribute('data-trend', winRateData.isPositive ? 'positive' : 'negative');
            dom.winCurrentValue.setAttribute('data-magnitude', winRateData.magnitude);
        } else {
            dom.winCurrentValue.removeAttribute('data-trend');
            dom.winCurrentValue.removeAttribute('data-magnitude');
        }
    }

    // REMOVIDO: Elemento preview meta-current-percent não existe mais
}

/**
 * 🎯 Atualiza elementos de Loss Rate com pontos percentuais
 * @private
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} lossRateData - Dados de pontos percentuais do Loss Rate
 */
function updateLossRateElements(stats, lossRateData) {
    // CORREÇÃO: Verifica se há operações reais
    const hasOperations = stats.totalOperations > 0;
    const isZero = stats.lossRate === 0;

    // Atualiza o elemento principal do card (loss-current-value)
    if (dom.lossCurrentValue) {
        // CORREÇÃO PROFISSIONAL: Sempre mostra apenas percentual limpo
        dom.lossCurrentValue.textContent = `${stats.lossRate.toFixed(1)}%`;

        if (!hasOperations || isZero) {
            // Zero = CINZA
            dom.lossCurrentValue.className = 'metric-value text-neutral';
            dom.lossCurrentValue.style.setProperty('color', '#6b7280', 'important');
            dom.lossCurrentValue.style.setProperty('font-weight', '500', 'important');
        } else {
            // Maior que zero = VERMELHO (loss é ruim)
            dom.lossCurrentValue.className = 'metric-value text-negative';
            dom.lossCurrentValue.style.setProperty('color', '#fca5a5', 'important');
            dom.lossCurrentValue.style.setProperty('font-weight', '600', 'important');
        }

        // Atributos semânticos
        dom.lossCurrentValue.setAttribute('title', `Loss Rate: ${stats.lossRate.toFixed(1)}%${hasOperations ? ` (${lossRateData.semanticMeaning})` : ''}`);

        if (hasOperations && !isZero) {
            dom.lossCurrentValue.setAttribute('data-trend', lossRateData.isPositive ? 'positive' : 'negative');
            dom.lossCurrentValue.setAttribute('data-magnitude', lossRateData.magnitude);
        } else {
            dom.lossCurrentValue.removeAttribute('data-trend');
            dom.lossCurrentValue.removeAttribute('data-magnitude');
        }
    }

    // Atualiza também o elemento do preview
    const previewElement = document.querySelector('.preview-metrics #loss-current-percent');
    if (previewElement) {
        previewElement.textContent = `${stats.lossRate.toFixed(1)}%`;
        if (!hasOperations || isZero) {
            previewElement.style.color = '#6b7280';
            previewElement.className = 'metric-value text-neutral';
        }
    }
}

/**
 * 🎯 Atualiza elementos de metas (valores fixos)
 * @private
 * NOTA: Elementos percentuais removidos - mantendo apenas elementos principais
 */
function updateTargetElements() {
    // Elementos de meta WR (apenas elementos principais, percentuais removidos)
    const metaTargetElements = [
        dom.winTargetValue
    ].filter(Boolean);

    metaTargetElements.forEach(element => {
        if (element) {
            const targetWR = window.config?.metaWinRate || 60;
            element.textContent = `${targetWR}%`;
        }
    });

    // Elementos de limite Loss (apenas elementos principais, percentuais removidos)
    const lossTargetElements = [
        dom.lossTargetValue
    ].filter(Boolean);

    lossTargetElements.forEach(element => {
        if (element) {
            const targetLoss = window.config?.metaLossRate || 40;
            element.textContent = `${targetLoss}%`;
        }
    });
}

/**
 * 🏷️ Atualiza trend badges com animações e estilos melhorados
 * @private
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 */
function updateTrendBadges(pointsPercentage) {
    // CORREÇÃO: Verifica se há operações reais antes de mostrar badges
    const hasOperations = window.state?.historicoCombinado?.length > 0 || false;

    // Trend badge para WR - busca o primeiro elemento (do card principal)
    const wrTrendBadges = document.querySelectorAll('#meta-trend-badge');
    const wrTrendBadge = wrTrendBadges[0]; // Primeiro elemento (card principal)
    if (wrTrendBadge) {
        const winRateData = pointsPercentage.winRate;

        // CORREÇÃO: Só mostra badge se há operações E é significativo
        if (hasOperations && winRateData.isSignificant) {
            wrTrendBadge.textContent = winRateData.display;
            wrTrendBadge.className = `trend-badge ${winRateData.trendClass}`;
            wrTrendBadge.style.display = 'inline-block';

            // Animação sutil para mudanças significativas
            if (winRateData.magnitude === 'large') {
                wrTrendBadge.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    wrTrendBadge.style.animation = '';
                }, 500);
            }
        } else {
            // CORREÇÃO: Oculta badge se não há operações ou diferença insignificante
            wrTrendBadge.style.display = 'none';
            wrTrendBadge.textContent = '';
        }
    }

    // Trend badge para Loss - busca o primeiro elemento (do card principal)
    const lossTrendBadges = document.querySelectorAll('#loss-trend-badge');
    const lossTrendBadge = lossTrendBadges[0]; // Primeiro elemento (card principal)
    if (lossTrendBadge) {
        const lossRateData = pointsPercentage.lossRate;

        // CORREÇÃO: Só mostra badge se há operações E é significativo
        if (hasOperations && lossRateData.isSignificant) {
            lossTrendBadge.textContent = lossRateData.display;
            lossTrendBadge.className = `trend-badge ${lossRateData.trendClass}`;
            lossTrendBadge.style.display = 'inline-block';

            // Animação sutil para mudanças significativas
            if (lossRateData.magnitude === 'large') {
                lossTrendBadge.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    lossTrendBadge.style.animation = '';
                }, 500);
            }
        } else {
            // CORREÇÃO: Oculta badge se não há operações ou diferença insignificante
            lossTrendBadge.style.display = 'none';
            lossTrendBadge.textContent = '';
        }
    }

    // Atualiza também os trend badges do preview (segundo elemento)
    if (wrTrendBadges[1]) {
        const winRateData = pointsPercentage.winRate;
        if (winRateData.isSignificant) {
            wrTrendBadges[1].textContent = winRateData.display;
            wrTrendBadges[1].className = `trend-badge ${winRateData.trendClass}`;
            wrTrendBadges[1].style.display = 'inline-block';
        } else {
            wrTrendBadges[1].style.display = 'none';
        }
    }

    if (lossTrendBadges[1]) {
        const lossRateData = pointsPercentage.lossRate;
        if (lossRateData.isSignificant) {
            lossTrendBadges[1].textContent = lossRateData.display;
            lossTrendBadges[1].className = `trend-badge ${lossRateData.trendClass}`;
            lossTrendBadges[1].style.display = 'inline-block';
        } else {
            lossTrendBadges[1].style.display = 'none';
        }
    }
}

/**
 * 💰 Atualiza elementos monetários
 * @param {Object} monetary - Valores monetários calculados
 */
export function updateMonetaryElements(monetary) {
    try {
        // Função auxiliar para formatar moeda
        const formatCurrency = (value) => {
            return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        };

        // Meta (R$) - Valor alvo
        const metaTargetElements = [
            document.getElementById('meta-target-amount'),
            document.getElementById('win-target-amount'),
            document.getElementById('meta-target-amount-panel')
        ].filter(Boolean);

        metaTargetElements.forEach(element => {
            element.textContent = formatCurrency(monetary.metaAmount);
        });

        // Atingido - Valor conquistado
        const metaAchievedElements = [
            document.getElementById('meta-achieved-amount'),
            document.getElementById('meta-achieved-amount-panel')
        ].filter(Boolean);

        metaAchievedElements.forEach(element => {
            element.textContent = formatCurrency(monetary.achievedAmount);
            element.classList.remove('text-positive', 'text-negative');
            if (monetary.achievedAmount > 0) {
                element.classList.add('text-positive');
            }
        });

        // Progresso da Meta é controlado pelas correções específicas para evitar conflitos

        // Limite (R$) - Valor de risco
        const riskLimitElements = [
            document.getElementById('loss-limit-amount'),
            document.getElementById('loss-limit-amount-panel'),
            document.getElementById('status-margin')
        ].filter(Boolean);

        riskLimitElements.forEach(element => {
            element.textContent = formatCurrency(monetary.riskAmount);
        });

        // P/L Sessão
        const sessionPLElements = [
            document.getElementById('loss-session-result'),
            document.getElementById('loss-session-result-panel')
        ].filter(Boolean);

        sessionPLElements.forEach(element => {
            element.textContent = formatCurrency(monetary.sessionPL);
            element.classList.remove('text-positive', 'text-negative');
            if (monetary.sessionPL > 0) {
                element.classList.add('text-positive');
            } else if (monetary.sessionPL < 0) {
                element.classList.add('text-negative');
            }
        });

        // Risco Usado
        const riskUsedElements = [
            document.getElementById('risk-used-value'),
            document.getElementById('risk-used-display'),
            document.getElementById('risk-used-value-panel')
        ].filter(Boolean);

        riskUsedElements.forEach(element => {
            element.textContent = `${monetary.riskUsedPercent.toFixed(1)}%`;
            element.classList.remove('text-positive', 'text-negative');
            if (monetary.riskUsedPercent > 0) {
                element.classList.add('text-negative');
            }
        });

        logger.debug('💰 Elementos monetários atualizados');
    } catch (error) {
        logger.error('❌ Erro ao atualizar valores monetários:', { error: String(error) });
    }
}

/**
 * ℹ️ Atualiza informações da sessão
 * @param {Object} stats - Estatísticas calculadas
 */
export function updateSessionInfo(stats) {
    try {
        // Atualiza contador de operações no centro do gráfico (mantém sistema existente)
        if (dom.totalOperationsDisplay) {
            dom.totalOperationsDisplay.textContent = stats.totalOperations;
        }

        // Nova arquitetura: delega para o UI Renderer
        const sessionState = determineSessionState(stats);
        renderSessionInfo(sessionState);

        logger.debug('ℹ️ Informações da sessão atualizadas (nova arquitetura)');
    } catch (error) {
        logger.error('❌ Erro ao atualizar informações da sessão:', { error: String(error) });
    }
}

/**
 * 🎨 Aplica cores dinâmicas baseadas na performance - VERSÃO MELHORADA
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 */
export function applyDynamicColors(stats, pointsPercentage) {
    try {
        // Nova arquitetura: delega para o UI Renderer
        const colorScheme = determineDynamicColors(stats, pointsPercentage);
        renderDynamicColors(colorScheme);

        logger.debug('🎨 Cores dinâmicas aplicadas (nova arquitetura)');
    } catch (error) {
        logger.error('❌ Erro ao aplicar cores dinâmicas:', { error: String(error) });
    }
}

/**
 * 🎨 Obtém cores dinâmicas do tema CSS
 * @private
 * @returns {Object} Objeto com cores resolvidas
 */
function getDynamicColors() {
    const style = getComputedStyle(document.documentElement);

    const positiveColor = style.getPropertyValue('--card-accent-positive').trim() || '#059669';
    const negativeColor = style.getPropertyValue('--card-accent-negative').trim() || '#fca5a5';

    return {
        positive: positiveColor,
        negative: negativeColor,
        neutral: style.getPropertyValue('--card-accent-neutral').trim() || '#6b7280',
        info: style.getPropertyValue('--card-info').trim() || '#0ea5e9',
        // Cores com transparência para efeitos sutis
        positiveLight: 'rgba(5, 150, 105, 0.1)',
        negativeLight: 'rgba(220, 38, 38, 0.1)'
    };
}

/**
 * 🎯 Aplica cores específicas para Win Rate
 * @private
 * @param {Object} winRateData - Dados de pontos percentuais do Win Rate
 * @param {Object} colors - Cores dinâmicas
 */
function applyWinRateColorScheme(winRateData, colors) {
    // Aplica cores ao elemento principal do card (win-current-value)
    if (dom.winCurrentValue) {
        const mainColor = winRateData.isPositive ? colors.positive : colors.negative;
        dom.winCurrentValue.style.color = mainColor;

        // Efeito de fundo sutil para valores significativos
        if (winRateData.isSignificant) {
            const bgColor = winRateData.isPositive ? colors.positiveLight : colors.negativeLight;
            dom.winCurrentValue.style.backgroundColor = bgColor;
            dom.winCurrentValue.style.borderRadius = '4px';
            dom.winCurrentValue.style.padding = '2px 4px';
        } else {
            // Remove efeitos para valores insignificantes
            dom.winCurrentValue.style.backgroundColor = '';
            dom.winCurrentValue.style.padding = '';
        }

        // Adiciona classe CSS para transições suaves
        dom.winCurrentValue.classList.add('color-transition');
    }

    // Aplica também ao elemento do preview
    const previewElement = document.querySelector('.preview-metrics #meta-current-percent');
    if (previewElement) {
        const mainColor = winRateData.isPositive ? colors.positive : colors.negative;
        previewElement.style.color = mainColor;
        previewElement.classList.add('color-transition');
    }
}

/**
 * 🎯 Aplica cores específicas para Loss Rate
 * @private
 * @param {Object} lossRateData - Dados de pontos percentuais do Loss Rate
 * @param {Object} colors - Cores dinâmicas
 */
function applyLossRateColorScheme(lossRateData, colors) {
    // Aplica cores ao elemento principal do card (loss-current-value)
    if (dom.lossCurrentValue) {
        // Para Loss Rate: lógica invertida (menos é melhor)
        const mainColor = lossRateData.isPositive ? colors.positive : colors.negative;
        dom.lossCurrentValue.style.color = mainColor;

        // Efeito de fundo sutil para valores significativos
        if (lossRateData.isSignificant) {
            const bgColor = lossRateData.isPositive ? colors.positiveLight : colors.negativeLight;
            dom.lossCurrentValue.style.backgroundColor = bgColor;
            dom.lossCurrentValue.style.borderRadius = '4px';
            dom.lossCurrentValue.style.padding = '2px 4px';
        } else {
            // Remove efeitos para valores insignificantes
            dom.lossCurrentValue.style.backgroundColor = '';
            dom.lossCurrentValue.style.padding = '';
        }

        // Adiciona classe CSS para transições suaves
        dom.lossCurrentValue.classList.add('color-transition');
    }

    // Aplica também ao elemento do preview
    const previewElement = document.querySelector('.preview-metrics #loss-current-percent');
    if (previewElement) {
        const mainColor = lossRateData.isPositive ? colors.positive : colors.negative;
        previewElement.style.color = mainColor;
        previewElement.classList.add('color-transition');
    }
}

/**
 * 🏷️ Aplica cores aos trend badges
 * @private
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 * @param {Object} colors - Cores dinâmicas
 */
function applyTrendBadgeColors(pointsPercentage, colors) {
    // Trend badge WR - todos os elementos
    const wrTrendBadges = document.querySelectorAll('#meta-trend-badge');
    wrTrendBadges.forEach(badge => {
        if (badge && pointsPercentage.winRate.isSignificant) {
            const winRateData = pointsPercentage.winRate;
            badge.style.color = winRateData.isPositive ? colors.positive : colors.negative;
            badge.style.backgroundColor = winRateData.isPositive ? colors.positiveLight : colors.negativeLight;
        }
    });

    // Trend badge Loss - todos os elementos
    const lossTrendBadges = document.querySelectorAll('#loss-trend-badge');
    lossTrendBadges.forEach(badge => {
        if (badge && pointsPercentage.lossRate.isSignificant) {
            const lossRateData = pointsPercentage.lossRate;
            badge.style.color = lossRateData.isPositive ? colors.positive : colors.negative;
            badge.style.backgroundColor = lossRateData.isPositive ? colors.positiveLight : colors.negativeLight;
        }
    });
}

/**
 * ✨ Aplica efeitos visuais baseados na magnitude das mudanças
 * @private
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 * @param {Object} colors - Cores dinâmicas
 */
function applyMagnitudeEffects(pointsPercentage, colors) {
    // Efeito para mudanças grandes no Win Rate
    if (pointsPercentage.winRate.magnitude === 'large') {
        // Aplica ao elemento principal
        if (dom.winCurrentValue) {
            dom.winCurrentValue.style.fontWeight = '700';
            dom.winCurrentValue.style.textShadow = `0 0 8px ${pointsPercentage.winRate.isPositive ? colors.positive : colors.negative}40`;
        }

        // Aplica ao elemento do preview
        const previewElement = document.querySelector('.preview-metrics #meta-current-percent');
        if (previewElement) {
            previewElement.style.fontWeight = '700';
            previewElement.style.textShadow = `0 0 8px ${pointsPercentage.winRate.isPositive ? colors.positive : colors.negative}40`;
        }
    }

    // Efeito para mudanças grandes no Loss Rate
    if (pointsPercentage.lossRate.magnitude === 'large') {
        // Aplica ao elemento principal
        if (dom.lossCurrentValue) {
            dom.lossCurrentValue.style.fontWeight = '700';
            dom.lossCurrentValue.style.textShadow = `0 0 8px ${pointsPercentage.lossRate.isPositive ? colors.positive : colors.negative}40`;
        }

        // Aplica ao elemento do preview
        const previewElement = document.querySelector('.preview-metrics #loss-current-percent');
        if (previewElement) {
            previewElement.style.fontWeight = '700';
            previewElement.style.textShadow = `0 0 8px ${pointsPercentage.lossRate.isPositive ? colors.positive : colors.negative}40`;
        }
    }
}

/**
 * 🚀 Inicializa sistema de gerenciamento de estado do card
 * @param {Object} options - Opções de inicialização
 * @returns {boolean} True se inicialização foi bem-sucedida
 */
export function initializeProgressCardState(options = {}) {
    return safeExecute(() => {
        const {
            loadFromStorage = true,
            enableAutoSync = true,
            enableUISync = true,
            autoStart = true
        } = options;

        logger.debug('🚀 Inicializando sistema de estado do card...');

        // Inicializa sincronizador com tratamento de erro
        if (autoStart) {
            const syncResult = safeExecute(() => {
                return initializeStateSync({
                    loadFromStorage,
                    enableAutoSync,
                    enableUISync
                });
            }, ERROR_TYPES.STATE_SYNC_FAILED, {
                operation: 'sync_initialization',
                options
            });

            if (!syncResult.success) {
                logger.warn('⚠️ Falha na inicialização do sincronizador, continuando sem sincronização automática');
            }
        }

        // Configura observador para atualizações automáticas da UI com tratamento de erro
        const observerResult = safeExecute(() => {
            observeProgressCardState('auto-ui-update', (state, changes, source) => {
                if (source !== 'ui-update' && source !== 'card-update') {
                    // Atualiza UI quando estado muda de fontes externas
                    safeExecute(() => {
                        const cardData = stateSynchronizer.prepareCardDataFromState?.(state);
                        if (cardData && cardData.isValid) {
                            updateProgressCardOptimized(cardData);
                        }
                    }, ERROR_TYPES.RENDER_FAILED, {
                        operation: 'auto_ui_update',
                        source,
                        hasChanges: !!changes
                    });
                }
            }, {
                paths: ['stats', 'monetary', 'pointsPercentage'],
                debounce: true
            });
        }, ERROR_TYPES.OBSERVER_ERROR, {
            operation: 'observer_setup'
        });

        if (!observerResult.success) {
            logger.warn('⚠️ Falha na configuração do observador, atualizações automáticas podem não funcionar');
        }

        logger.debug('✅ Sistema de estado do card inicializado');
        return true;

    }, ERROR_TYPES.CRITICAL_FAILURE, {
        operation: 'state_system_initialization',
        options
    });
}

/**
 * 🏪 Obtém estado atual do card de progresso
 * @returns {Object} Estado atual
 */
export function getCardState() {
    return getProgressCardState();
}

/**
 * ✏️ Atualiza estado do card de progresso
 * @param {Object} updates - Atualizações a aplicar
 * @param {Object} options - Opções de atualização
 * @returns {boolean} True se atualização foi aplicada
 */
export function updateCardState(updates, options = {}) {
    return updateProgressCardState(updates, {
        source: 'manual-update',
        ...options
    });
}

/**
 * 🔄 Cria listener para mudanças no DOM (MutationObserver)
 * @param {Function} updateCallback - Função a ser chamada quando DOM muda
 * @returns {MutationObserver} Observer criado
 */
export function createDOMListener(updateCallback) {
    try {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {
                // Verifica se mudanças afetam o card de progresso
                if (mutation.target.closest('#progress-metas-panel')) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate && typeof updateCallback === 'function') {
                // Debounce para evitar atualizações excessivas
                clearTimeout(createDOMListener._timeout);
                createDOMListener._timeout = setTimeout(updateCallback, 100);
            }
        });

        // Observa mudanças no card de progresso
        const progressPanel = document.getElementById('progress-metas-panel');
        if (progressPanel) {
            observer.observe(progressPanel, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });

            logger.debug('🔄 DOM listener criado para o card de progresso');
        }

        return observer;
    } catch (error) {
        logger.error('❌ Erro ao criar DOM listener:', { error: String(error) });
        return null;
    }
}


/**
 * 🧹 Limpa o card de progresso para estado inicial
 */
export function clearProgressCard() {
    try {
        logger.debug('🧹 Limpando card de progresso para estado inicial (nova arquitetura)');

        // Limpa gráfico
        if (window.charts?.progressMetasChart) {
            window.charts.progressMetasChart.data.datasets[0].data = [0, 0];
            window.charts.progressMetasChart.update('none');
        }

        // Nova arquitetura: UI separada
        clearProgressCardUI();

        // Limpa valores monetários (sistema existente)
        clearMonetaryElements();

        logger.debug('✅ Card de progresso limpo (nova arquitetura)');

    } catch (error) {
        logger.error('❌ Erro ao limpar card:', { error: String(error) });
    }
}

/**
 * 🧹 Limpa elementos de percentual
 * @private
 */
function clearPercentageElements() {
    // WR Atual - cor neutra para zero
    const wrElements = [
        dom.winCurrentValue,
        document.querySelector('.preview-metrics #meta-current-percent')
    ].filter(Boolean);

    wrElements.forEach(element => {
        element.textContent = '0.0%';
        element.className = 'metric-value text-neutral';
        element.style.color = '#6b7280';
        element.removeAttribute('data-trend');
        element.removeAttribute('data-magnitude');
    });

    // Loss Atual - cor neutra para zero
    const lossElements = [
        dom.lossCurrentValue,
        document.querySelector('.preview-metrics #loss-current-percent')
    ].filter(Boolean);

    lossElements.forEach(element => {
        element.textContent = '0.0%';
        element.className = 'metric-value text-neutral';
        element.style.color = '#6b7280';
        element.removeAttribute('data-trend');
        element.removeAttribute('data-magnitude');
    });

    // Oculta trend badges
    const trendBadges = document.querySelectorAll('#meta-trend-badge, #loss-trend-badge');
    trendBadges.forEach(badge => {
        badge.style.display = 'none';
        badge.textContent = '';
    });

    // Progresso da Meta - cor neutra para zero
    const progressElements = document.querySelectorAll('#meta-progress-value');
    progressElements.forEach(element => {
        element.textContent = '0.0%';
        element.style.color = '#6b7280';
        element.className = 'metric-value text-neutral';
    });
}

/**
 * 🧹 Limpa elementos monetários
 * @private
 */
function clearMonetaryElements() {
    const monetaryElements = [
        '#meta-achieved-amount',
        '#loss-session-result',
        '#risk-used-value',
        '#risk-used-display'
    ];

    monetaryElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (selector.includes('amount') || selector.includes('result')) {
                element.textContent = 'R$ 0,00';
            } else {
                element.textContent = '0%';
            }
            element.className = 'metric-value text-neutral';
            element.style.color = '#6b7280';
        });
    });

    // Limpa barras de progresso
    const progressBars = document.querySelectorAll('#meta-progress-fill, #risk-used-fill');
    progressBars.forEach(bar => {
        bar.style.width = '0%';
        bar.className = 'progress-fill';
    });
}

/**
 * 🧹 Limpa informações da sessão
 * @private
 */
function clearSessionInfo() {
    if (dom.totalOperationsDisplay) {
        dom.totalOperationsDisplay.textContent = '0';
    }

    if (dom.progressSessionInfo) {
        dom.progressSessionInfo.textContent = 'Sessão Inativa';
    }
}

// Exposição global das funções principais
if (typeof window !== 'undefined') {
    window.updateProgressCardComplete = updateProgressCardComplete;
    window.updateProgressChart = updateProgressChart;
    window.updatePercentageElements = updatePercentageElements;
    window.updateMonetaryElements = updateMonetaryElements;
    window.updateSessionInfo = updateSessionInfo;
    window.applyDynamicColors = applyDynamicColors;
    window.createDOMListener = createDOMListener;
    window.clearProgressCard = clearProgressCard;
    window.clearProgressCardUI = clearProgressCardUI;
    console.log('🔄 Funções do Progress Card Updater disponíveis globalmente');
}
