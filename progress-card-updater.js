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
} from './progress-card/config/constants.js';

// Core modules
import { dom } from './dom.js';

// Business Logic (lógica pura, sem DOM)
import {
    validateCardData,
    determineSessionState,
    determineDynamicColors
} from './progress-card/business/logic.js';

// UI Rendering (manipulação DOM pura)
import {
    renderSessionInfo,
    renderDynamicColors,
    renderPercentageElements,
    clearProgressCardUI
} from './progress-card/ui/renderer.js';

// Internal modules
import {
    formatCurrencyAdvanced,
    calculateMonetaryPerformance,
    updateMonetaryElementsAdvanced
} from './progress-card-monetary.js';

// Utilities
import { logger } from './src/utils/Logger.js';

/**
 * 🎯 Atualiza todos os elementos do card de progresso
 * @param {Object} cardData - Dados calculados do card
 * @param {Object} chartInstance - Instância do Chart.js
 * @returns {boolean} True se atualização foi bem-sucedida
 */
export function updateProgressCardComplete(cardData, chartInstance = null) {
    try {
        logger.debug(MESSAGES.LOG_CARD_UPDATE_START);

        // 1. VALIDAÇÃO - Lógica de negócio pura
        const validation = validateCardData(cardData);

        if (validation.shouldClear) {
            logger.warn(`⚠️ ${validation.reason}, limpando card`);
            clearProgressCardUI();
            return validation.reason !== 'Dados do card inválidos'; // false apenas para dados inválidos
        }

        const { stats, monetary, pointsPercentage } = cardData;

        // 2. GRÁFICO - Atualiza gráfico de pizza
        const chartSuccess = updateProgressChart(stats, chartInstance);

        // 3. PERCENTUAIS - Nova arquitetura separada (lógica + UI)
        renderPercentageElements(stats, pointsPercentage);

        // 4. MONETÁRIO - Sistema avançado existente
        const performance = calculateMonetaryPerformance(monetary, cardData.previousMonetary);
        updateMonetaryElementsAdvanced(monetary, performance, PERFORMANCE.MONETARY_CONFIG);

        // 5. SESSÃO - Nova arquitetura separada (lógica + UI)
        const sessionState = determineSessionState(stats);
        renderSessionInfo(sessionState);

        // 6. CORES DINÂMICAS - Nova arquitetura separada (lógica + UI)
        const colorScheme = determineDynamicColors(stats, pointsPercentage);
        renderDynamicColors(colorScheme);

        logger.debug(MESSAGES.LOG_CARD_UPDATE_SUCCESS);
        return true;

    } catch (error) {
        logger.error(MESSAGES.ERROR_CARD_UPDATE, { error: String(error) });
        return false;
    }
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
 * 📈 Atualiza elementos de percentual com pontos percentuais - VERSÃO MELHORADA
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} pointsPercentage - Dados de pontos percentuais
 */
export function updatePercentageElements(stats, pointsPercentage) {
    try {
        // Nova arquitetura: delega para o UI Renderer
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
 * @param {Object} wrPP - Dados de pontos percentuais do Win Rate
 */
function updateWinRateElements(stats, wrPP) {
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
        dom.winCurrentValue.setAttribute('title', `Win Rate: ${stats.winRate.toFixed(1)}%${hasOperations ? ` (${wrPP.semanticMeaning})` : ''}`);

        if (hasOperations && !isZero) {
            dom.winCurrentValue.setAttribute('data-trend', wrPP.isPositive ? 'positive' : 'negative');
            dom.winCurrentValue.setAttribute('data-magnitude', wrPP.magnitude);
        } else {
            dom.winCurrentValue.removeAttribute('data-trend');
            dom.winCurrentValue.removeAttribute('data-magnitude');
        }
    }

    // Atualiza também o elemento do preview
    const previewElement = document.querySelector('.preview-metrics #meta-current-percent');
    if (previewElement) {
        previewElement.textContent = `${stats.winRate.toFixed(1)}%`;
        if (!hasOperations || isZero) {
            previewElement.style.color = '#6b7280';
            previewElement.className = 'metric-value text-neutral';
        }
    }
}

/**
 * 🎯 Atualiza elementos de Loss Rate com pontos percentuais
 * @private
 * @param {Object} stats - Estatísticas calculadas
 * @param {Object} lossPP - Dados de pontos percentuais do Loss Rate
 */
function updateLossRateElements(stats, lossPP) {
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
        dom.lossCurrentValue.setAttribute('title', `Loss Rate: ${stats.lossRate.toFixed(1)}%${hasOperations ? ` (${lossPP.semanticMeaning})` : ''}`);

        if (hasOperations && !isZero) {
            dom.lossCurrentValue.setAttribute('data-trend', lossPP.isPositive ? 'positive' : 'negative');
            dom.lossCurrentValue.setAttribute('data-magnitude', lossPP.magnitude);
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
        const wrPP = pointsPercentage.winRate;

        // CORREÇÃO: Só mostra badge se há operações E é significativo
        if (hasOperations && wrPP.isSignificant) {
            wrTrendBadge.textContent = wrPP.display;
            wrTrendBadge.className = `trend-badge ${wrPP.trendClass}`;
            wrTrendBadge.style.display = 'inline-block';

            // Animação sutil para mudanças significativas
            if (wrPP.magnitude === 'large') {
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
        const lossPP = pointsPercentage.lossRate;

        // CORREÇÃO: Só mostra badge se há operações E é significativo
        if (hasOperations && lossPP.isSignificant) {
            lossTrendBadge.textContent = lossPP.display;
            lossTrendBadge.className = `trend-badge ${lossPP.trendClass}`;
            lossTrendBadge.style.display = 'inline-block';

            // Animação sutil para mudanças significativas
            if (lossPP.magnitude === 'large') {
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
        const wrPP = pointsPercentage.winRate;
        if (wrPP.isSignificant) {
            wrTrendBadges[1].textContent = wrPP.display;
            wrTrendBadges[1].className = `trend-badge ${wrPP.trendClass}`;
            wrTrendBadges[1].style.display = 'inline-block';
        } else {
            wrTrendBadges[1].style.display = 'none';
        }
    }

    if (lossTrendBadges[1]) {
        const lossPP = pointsPercentage.lossRate;
        if (lossPP.isSignificant) {
            lossTrendBadges[1].textContent = lossPP.display;
            lossTrendBadges[1].className = `trend-badge ${lossPP.trendClass}`;
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
 * @param {Object} wrPP - Dados de pontos percentuais do Win Rate
 * @param {Object} colors - Cores dinâmicas
 */
function applyWinRateColors(wrPP, colors) {
    // Aplica cores ao elemento principal do card (win-current-value)
    if (dom.winCurrentValue) {
        const mainColor = wrPP.isPositive ? colors.positive : colors.negative;
        dom.winCurrentValue.style.color = mainColor;

        // Efeito de fundo sutil para valores significativos
        if (wrPP.isSignificant) {
            const bgColor = wrPP.isPositive ? colors.positiveLight : colors.negativeLight;
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
        const mainColor = wrPP.isPositive ? colors.positive : colors.negative;
        previewElement.style.color = mainColor;
        previewElement.classList.add('color-transition');
    }
}

/**
 * 🎯 Aplica cores específicas para Loss Rate
 * @private
 * @param {Object} lossPP - Dados de pontos percentuais do Loss Rate
 * @param {Object} colors - Cores dinâmicas
 */
function applyLossRateColors(lossPP, colors) {
    // Aplica cores ao elemento principal do card (loss-current-value)
    if (dom.lossCurrentValue) {
        // Para Loss Rate: lógica invertida (menos é melhor)
        const mainColor = lossPP.isPositive ? colors.positive : colors.negative;
        dom.lossCurrentValue.style.color = mainColor;

        // Efeito de fundo sutil para valores significativos
        if (lossPP.isSignificant) {
            const bgColor = lossPP.isPositive ? colors.positiveLight : colors.negativeLight;
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
        const mainColor = lossPP.isPositive ? colors.positive : colors.negative;
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
            const wrPP = pointsPercentage.winRate;
            badge.style.color = wrPP.isPositive ? colors.positive : colors.negative;
            badge.style.backgroundColor = wrPP.isPositive ? colors.positiveLight : colors.negativeLight;
        }
    });

    // Trend badge Loss - todos os elementos
    const lossTrendBadges = document.querySelectorAll('#loss-trend-badge');
    lossTrendBadges.forEach(badge => {
        if (badge && pointsPercentage.lossRate.isSignificant) {
            const lossPP = pointsPercentage.lossRate;
            badge.style.color = lossPP.isPositive ? colors.positive : colors.negative;
            badge.style.backgroundColor = lossPP.isPositive ? colors.positiveLight : colors.negativeLight;
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
