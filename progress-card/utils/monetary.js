/**
 * 💰 Progress Card Monetary - Sistema Avançado de Valores Monetários
 * 
 * FASE 3: Implementa formatação avançada, animações e indicadores visuais
 * para todos os valores monetários do card de progresso.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 3.0.0 - FASE 3
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Core modules
import { dom } from '../../dom.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

/**
 * 💰 Formata valores monetários com estilos avançados
 * @param {number} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {Object} Objeto com formatação e metadados
 */
export function formatCurrencyAdvanced(value, options = {}) {
    const {
        style = 'standard',           // 'standard', 'compact', 'detailed', 'percentage'
        showSign = false,             // Mostrar sinal + para valores positivos
        colorize = false,             // Aplicar cores baseadas no valor
        animate = false,              // Preparar para animação
        magnitude = 'auto'            // 'small', 'medium', 'large', 'auto'
    } = options;

    // Validação defensiva
    const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const absValue = Math.abs(numValue);
    const isPositive = numValue >= 0;
    const isZero = numValue === 0;

    // Determina magnitude automaticamente se necessário
    let detectedMagnitude = magnitude;
    if (magnitude === 'auto') {
        if (absValue < 100) detectedMagnitude = 'small';
        else if (absValue < 10000) detectedMagnitude = 'medium';
        else detectedMagnitude = 'large';
    }

    // Formatação base
    let formatted = '';
    let displayValue = '';
    let cssClasses = ['monetary-value'];
    let dataAttributes = {};

    switch (style) {
        case 'compact':
            // Formato compacto: R$ 1,2K, R$ 15,3M
            if (absValue >= 1000000) {
                displayValue = `R$ ${(numValue / 1000000).toFixed(1)}M`;
            } else if (absValue >= 1000) {
                displayValue = `R$ ${(numValue / 1000).toFixed(1)}K`;
            } else {
                displayValue = `R$ ${numValue.toFixed(0)}`;
            }
            cssClasses.push('format-compact');
            break;

        case 'detailed':
            // Formato detalhado com centavos sempre visíveis
            displayValue = `R$ ${numValue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
            cssClasses.push('format-detailed');
            break;

        case 'percentage':
            // Para valores que representam percentuais monetários
            displayValue = `${numValue.toFixed(1)}%`;
            cssClasses.push('format-percentage');
            break;

        default: // 'standard'
            // CORREÇÃO: Sempre usar vírgula como separador decimal (padrão brasileiro)
            displayValue = `R$ ${numValue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
            cssClasses.push('format-standard');
    }

    // Adiciona sinal positivo se solicitado
    if (showSign && isPositive && !isZero) {
        displayValue = `+${displayValue}`;
        cssClasses.push('with-positive-sign');
    }

    // Adiciona classes de cor se solicitado
    if (colorize) {
        if (isPositive && !isZero) {
            cssClasses.push('text-positive');
        } else if (!isPositive) {
            cssClasses.push('text-negative');
        } else {
            cssClasses.push('text-neutral');
        }
    }

    // Adiciona classes de magnitude
    cssClasses.push(`magnitude-${detectedMagnitude}`);

    // Adiciona classe de animação se solicitado
    if (animate) {
        cssClasses.push('monetary-animated');
    }

    // Atributos de dados para CSS e JavaScript
    dataAttributes = {
        'data-value': numValue,
        'data-magnitude': detectedMagnitude,
        'data-positive': isPositive,
        'data-zero': isZero,
        'data-style': style
    };

    return {
        formatted: displayValue,
        rawValue: numValue,
        absValue,
        isPositive,
        isZero,
        magnitude: detectedMagnitude,
        cssClasses: cssClasses.join(' '),
        dataAttributes,
        // Metadados para animações
        shouldPulse: absValue > 1000,
        shouldGlow: absValue > 10000,
        animationDuration: detectedMagnitude === 'large' ? 800 : 500
    };
}

/**
 * 📊 Calcula indicadores de performance monetária
 * @param {Object} monetary - Dados monetários básicos
 * @param {Object} previousMonetary - Dados monetários anteriores (para comparação)
 * @returns {Object} Indicadores de performance
 */
export function calculateMonetaryPerformance(monetary, previousMonetary = null) {
    try {
        const {
            metaAmount,
            achievedAmount,
            riskAmount,
            sessionPL,
            progressPercent,
            riskUsedPercent
        } = monetary;

        // Indicadores básicos
        const indicators = {
            // Status da meta
            metaStatus: progressPercent >= 100 ? 'achieved' : progressPercent >= 75 ? 'near' : 'progress',
            metaProgress: Math.min(100, progressPercent),

            // Status do risco
            riskStatus: riskUsedPercent >= 80 ? 'critical' : riskUsedPercent >= 50 ? 'warning' : 'safe',
            riskProgress: Math.min(100, riskUsedPercent),

            // Performance geral
            overallPerformance: sessionPL > 0 ? 'positive' : sessionPL < 0 ? 'negative' : 'neutral',

            // Valores restantes
            remainingToMeta: Math.max(0, metaAmount - achievedAmount),
            remainingRisk: Math.max(0, riskAmount - Math.abs(Math.min(0, sessionPL))),

            // Percentuais de segurança
            safetyMargin: riskAmount > 0 ? ((riskAmount - Math.abs(Math.min(0, sessionPL))) / riskAmount) * 100 : 100,
            metaEfficiency: metaAmount > 0 ? (achievedAmount / metaAmount) * 100 : 0
        };

        // Comparação com valores anteriores (se disponível)
        if (previousMonetary) {
            const prevPL = previousMonetary.sessionPL || 0;
            const plChange = sessionPL - prevPL;

            indicators.trend = {
                direction: plChange > 0 ? 'up' : plChange < 0 ? 'down' : 'stable',
                change: plChange,
                changePercent: prevPL !== 0 ? (plChange / Math.abs(prevPL)) * 100 : 0,
                isSignificant: Math.abs(plChange) > (metaAmount * 0.05) // 5% da meta
            };
        }

        // Alertas e recomendações
        indicators.alerts = [];

        if (indicators.riskStatus === 'critical') {
            indicators.alerts.push({
                type: 'danger',
                message: 'Risco crítico: próximo ao limite de perda',
                priority: 'high'
            });
        }

        if (indicators.metaStatus === 'achieved') {
            indicators.alerts.push({
                type: 'success',
                message: 'Meta atingida! Considere encerrar a sessão',
                priority: 'medium'
            });
        }

        if (indicators.safetyMargin < 20) {
            indicators.alerts.push({
                type: 'warning',
                message: 'Margem de segurança baixa',
                priority: 'medium'
            });
        }

        return indicators;

    } catch (error) {
        logger.error('❌ Erro ao calcular performance monetária:', { error: String(error) });

        // Retorna indicadores seguros em caso de erro
        return {
            metaStatus: 'progress',
            metaProgress: 0,
            riskStatus: 'safe',
            riskProgress: 0,
            overallPerformance: 'neutral',
            remainingToMeta: 0,
            remainingRisk: 0,
            safetyMargin: 100,
            metaEfficiency: 0,
            alerts: []
        };
    }
}

/**
 * 🎨 Atualiza elementos monetários com formatação avançada
 * @param {Object} monetary - Dados monetários
 * @param {Object} performance - Indicadores de performance
 * @param {Object} options - Opções de atualização
 */
export function updateMonetaryElementsAdvanced(monetary, performance, options = {}) {
    try {
        // Iniciando atualização de elementos monetários avançados

        const {
            animate = true,
            showTrends = true,
            compactMode = false
        } = options;

        logger.debug('💰 Atualizando elementos monetários avançados...');

        // 1. Meta (Valor Alvo)
        updateMetaTargetElements(monetary, performance, { animate, compactMode });

        // 2. Valor Atingido
        updateAchievedElements(monetary, performance, { animate, showTrends });

        // 3. Progresso da Meta
        updateMetaProgressElements(monetary, performance, { animate });

        // 4. Limite de Risco
        updateRiskLimitElements(monetary, performance, { animate, compactMode });

        // 5. P/L da Sessão
        updateSessionPLElements(monetary, performance, { animate, showTrends });

        // 6. Risco Usado
        updateRiskUsedElements(monetary, performance, { animate });

        // 7. Barras de Progresso
        updateProgressBarsAdvanced(monetary, performance, { animate });

        // 8. Indicadores de Status
        updateStatusIndicators(performance);

        logger.debug('✅ Elementos monetários atualizados com sucesso');

    } catch (error) {
        logger.error('❌ Erro ao atualizar elementos monetários:', { error: String(error) });
    }
}

/**
 * 🎯 Atualiza elementos de meta (valor alvo)
 * @private
 */
function updateMetaTargetElements(monetary, performance, options) {
    const elements = [
        document.getElementById('meta-target-amount'),
        document.getElementById('win-target-amount'),
        document.getElementById('meta-target-amount-panel')
    ].filter(Boolean);

    const formatted = formatCurrencyAdvanced(monetary.metaAmount, {
        style: options.compactMode ? 'compact' : 'standard',
        colorize: false,
        animate: options.animate
    });

    elements.forEach(element => {
        // Atualiza conteúdo
        element.textContent = formatted.formatted;

        // Aplica classes CSS
        element.className = `metric-value ${formatted.cssClasses}`;

        // Aplica atributos de dados
        Object.entries(formatted.dataAttributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        // Adiciona tooltip informativo
        element.setAttribute('title', `Meta de lucro: ${formatted.formatted}`);
    });
}

/**
 * 🏆 Atualiza elementos de valor atingido
 * @private
 */
function updateAchievedElements(monetary, performance, options) {
    const elements = [
        document.getElementById('meta-achieved-amount'),
        document.getElementById('meta-achieved-amount-panel')
    ].filter(Boolean);

    const formatted = formatCurrencyAdvanced(monetary.achievedAmount, {
        style: 'detailed',
        showSign: true,
        colorize: true,
        animate: options.animate
    });

    elements.forEach(element => {
        // Atualiza conteúdo
        element.textContent = formatted.formatted;

        // CORREÇÃO: Força classe CSS correta baseada no valor
        let cssClass = 'metric-value';
        if (monetary.achievedAmount > 0) {
            cssClass += ' text-positive'; // VERDE para valores positivos
            element.style.color = '#059669'; // Verde forçado
        } else if (monetary.achievedAmount < 0) {
            cssClass += ' text-negative'; // VERMELHO para valores negativos
            element.style.color = '#fca5a5'; // Vermelho forçado
        } else {
            cssClass += ' text-neutral'; // CINZA para zero
            element.style.color = '#6b7280'; // Cinza forçado
        }

        element.className = cssClass;

        // Aplica atributos de dados
        Object.entries(formatted.dataAttributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        // Adiciona efeitos baseados na performance
        if (performance.metaStatus === 'achieved') {
            element.classList.add('achievement-glow');
        }

        // Tooltip com informações detalhadas
        const efficiency = performance.metaEfficiency.toFixed(1);
        element.setAttribute('title', `Valor atingido: ${formatted.formatted} (${efficiency}% da meta)`);

        // Animação de pulse para valores significativos
        if (options.animate && formatted.shouldPulse) {
            element.style.animation = 'monetary-pulse 0.6s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 600);
        }

        console.log(`✅ Atingido atualizado: ${formatted.formatted} - Cor: ${element.style.color}`);
    });
}

/**
 * 📈 Atualiza elementos de progresso da meta
 * @private
 */
function updateMetaProgressElements(monetary, performance, options) {
    // Reativando atualização pois DashboardUIManager foi desativado
    const elements = [
        document.getElementById('meta-progress-value'),
        document.getElementById('meta-progress-value-panel')
    ].filter(Boolean);

    const formatted = formatCurrencyAdvanced(performance.metaProgress, {
        style: 'percentage',
        colorize: true,
        animate: options.animate
    });

    elements.forEach(element => {
        // Atualiza conteúdo
        element.textContent = formatted.formatted;

        // CORREÇÃO CRÍTICA: Progresso 0.0% sempre em cor neutra
        if (performance.metaProgress === 0) {
            element.className = 'metric-value text-neutral';
            element.style.color = '#6b7280';
            element.style.setProperty('color', '#6b7280', 'important');
            element.style.fontWeight = '500';
            element.removeAttribute('data-status');
        } else {
            // Aplica classes baseadas no status para valores > 0
            element.className = `metric-value ${formatted.cssClasses} status-${performance.metaStatus}`;
            element.setAttribute('data-status', performance.metaStatus);
        }

        // Atributos de dados
        element.setAttribute('data-progress', performance.metaProgress);

        // Tooltip informativo
        const remaining = formatCurrencyAdvanced(performance.remainingToMeta, { style: 'compact' });
        element.setAttribute('title', `Progresso: ${formatted.formatted} | Restante: ${remaining.formatted}`);
    });
}

/**
 * ⚠️ Atualiza elementos de limite de risco
 * @private
 */
function updateRiskLimitElements(monetary, performance, options) {
    const elements = [
        document.getElementById('loss-limit-amount'),
        document.getElementById('loss-limit-amount-panel'),
        document.getElementById('status-margin')  // CORREÇÃO: Adiciona elemento "Margem" do rodapé
    ].filter(Boolean);

    // CORREÇÃO: Formatar como valor NEGATIVO e VERMELHO
    const formatted = formatCurrencyAdvanced(-Math.abs(monetary.riskAmount), {
        style: options.compactMode ? 'compact' : 'standard',
        showSign: false, // Não mostrar sinal duplo
        colorize: true,
        animate: options.animate
    });

    elements.forEach(element => {
        // CORREÇÃO: Força formato negativo com sinal de menos
        const negativeValue = `R$ -${Math.abs(monetary.riskAmount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

        element.textContent = negativeValue;

        // CORREÇÃO: Força classe CSS VERMELHA para limite de risco
        element.className = 'metric-value text-negative risk-limit';
        element.style.color = '#fca5a5'; // Vermelho forçado

        // Aplica atributos de dados
        element.setAttribute('data-value', -Math.abs(monetary.riskAmount));
        element.setAttribute('data-positive', 'false');
        element.setAttribute('data-risk-status', performance.riskStatus);

        // Tooltip com margem de segurança
        const safetyMargin = performance.safetyMargin.toFixed(1);
        element.setAttribute('title', `Limite de risco: ${negativeValue} | Margem: ${safetyMargin}%`);

        console.log(`✅ Limite de risco atualizado: ${negativeValue} - Cor: VERMELHO`);
    });
}

/**
 * 💹 Atualiza elementos de P/L da sessão
 * @private
 */
function updateSessionPLElements(monetary, performance, options) {
    const elements = [
        document.getElementById('loss-session-result'),
        document.getElementById('loss-session-result-panel')
    ].filter(Boolean);

    const formatted = formatCurrencyAdvanced(monetary.sessionPL, {
        style: 'detailed',
        showSign: true,
        colorize: true,
        animate: options.animate
    });

    elements.forEach(element => {
        // Atualiza conteúdo
        element.textContent = formatted.formatted;

        // Aplica classes CSS
        element.className = `metric-value ${formatted.cssClasses} session-pl`;

        // Aplica atributos de dados
        Object.entries(formatted.dataAttributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        // Adiciona classe de performance geral
        element.setAttribute('data-performance', performance.overallPerformance);

        // Efeitos visuais especiais para valores extremos
        if (formatted.shouldGlow) {
            element.classList.add('extreme-value-glow');
        }

        // Tooltip com informações de trend (se disponível)
        let tooltipText = `P/L da Sessão: ${formatted.formatted}`;
        if (performance.trend && options.showTrends) {
            const trendFormatted = formatCurrencyAdvanced(performance.trend.change, {
                style: 'compact',
                showSign: true
            });
            tooltipText += ` | Variação: ${trendFormatted.formatted}`;
        }
        element.setAttribute('title', tooltipText);

        // Animação especial para mudanças significativas
        if (options.animate && performance.trend && performance.trend.isSignificant) {
            const animationClass = performance.trend.direction === 'up' ? 'trend-up-flash' : 'trend-down-flash';
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
            }, 1000);
        }
    });
}

/**
 * 🔥 Atualiza elementos de risco usado
 * @private
 */
function updateRiskUsedElements(monetary, performance, options) {
    const elements = [
        document.getElementById('risk-used-value'),
        document.getElementById('risk-used-display'),
        document.getElementById('risk-used-value-panel')
    ].filter(Boolean);

    const riskPercent = Math.max(0, Math.min(100, Number(performance.riskProgress || 0)));
    const displayText = `${riskPercent.toFixed(1)}%`;

    // Atualizando elementos de risco usado

    elements.forEach(element => {
        element.textContent = displayText;

        // Classe e cor padronizadas: 0% cinza (igual aos outros zerados), >0% salmão/rosa
        if (riskPercent > 0) {
            element.className = `metric-value text-negative risk-used status-${performance.riskStatus}`;
            element.style.color = '#fca5a5';
        } else {
            element.className = 'metric-value text-muted text-neutral risk-used';
            element.style.color = '#6b7280';
        }

        // Atributos semânticos
        element.setAttribute('data-risk-percent', riskPercent);
        element.setAttribute('data-risk-status', performance.riskStatus);

        // Efeito opcional para crítico
        if (performance.riskStatus === 'critical') {
            element.classList.add('critical-risk-pulse');
        }

        // Tooltip informativo
        const remainingRisk = formatCurrencyAdvanced(performance.remainingRisk, { style: 'compact' });
        element.setAttribute('title', `Risco usado: ${displayText} | Restante: ${remainingRisk.formatted}`);
    });
}

/**
 * 📊 Atualiza barras de progresso com efeitos avançados
 * @private
 */
function updateProgressBarsAdvanced(monetary, performance, options) {
    // Barra de progresso da meta
    updateMetaProgressBar(performance, options);

    // Barra de risco usado
    updateRiskProgressBar(performance, options);
}

/**
 * 📈 Atualiza barra de progresso da meta
 * @private
 */
function updateMetaProgressBar(performance, options) {
    const progressFill = document.getElementById('meta-progress-fill');
    const progressTrack = document.getElementById('meta-progress-track');

    if (progressFill && progressTrack) {
        const progressPercent = Math.min(100, performance.metaProgress);

        // Atualiza largura com animação
        if (options.animate) {
            progressFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        progressFill.style.width = `${progressPercent}%`;

        // Aplica classes baseadas no status
        progressFill.className = `progress-fill status-${performance.metaStatus}`;
        progressTrack.className = `progress-track status-${performance.metaStatus}`;

        // Efeito de brilho para meta atingida
        if (performance.metaStatus === 'achieved') {
            progressFill.classList.add('achievement-shine');
        }

        // Atributos de dados
        progressFill.setAttribute('data-progress', progressPercent);
        progressFill.setAttribute('data-status', performance.metaStatus);
    }
}

/**
 * 🔥 Atualiza barra de risco usado
 * @private
 */
function updateRiskProgressBar(performance, options) {
    const riskFill = document.getElementById('risk-used-fill');
    const riskTrack = document.getElementById('risk-used-track');

    if (riskFill && riskTrack) {
        const riskPercent = Math.min(100, performance.riskProgress);

        // Atualiza largura com animação
        if (options.animate) {
            riskFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        riskFill.style.width = `${riskPercent}%`;

        // Aplica classes baseadas no status de risco
        riskFill.className = `progress-fill risk-status-${performance.riskStatus}`;
        riskTrack.className = `progress-track risk-status-${performance.riskStatus}`;

        // Efeito de pulsação para risco crítico
        if (performance.riskStatus === 'critical') {
            riskFill.classList.add('critical-risk-pulse');
        }

        // Atributos de dados
        riskFill.setAttribute('data-risk-percent', riskPercent);
        riskFill.setAttribute('data-risk-status', performance.riskStatus);
    }
}

/**
 * 🚨 Atualiza indicadores de status
 * @private
 */
function updateStatusIndicators(performance) {
    // Indicador de status da meta
    const metaStatusIndicator = document.getElementById('meta-status-indicator');
    if (metaStatusIndicator) {
        metaStatusIndicator.className = `status-indicator meta-${performance.metaStatus}`;
        metaStatusIndicator.setAttribute('data-status', performance.metaStatus);
    }

    // Indicador de status de risco
    const riskStatusIndicator = document.getElementById('risk-status-indicator');
    if (riskStatusIndicator) {
        riskStatusIndicator.className = `status-indicator risk-${performance.riskStatus}`;
        riskStatusIndicator.setAttribute('data-status', performance.riskStatus);
    }

    // Atualiza alertas se houver
    updateAlertIndicators(performance.alerts);
}

/**
 * 🚨 Atualiza indicadores de alerta
 * @private
 */
function updateAlertIndicators(alerts) {
    const alertContainer = document.getElementById('monetary-alerts');
    if (!alertContainer) return;

    // Limpa alertas anteriores
    alertContainer.innerHTML = '';

    // Adiciona novos alertas
    alerts.forEach((alert, index) => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${alert.type} priority-${alert.priority}`;
        alertElement.textContent = alert.message;
        alertElement.setAttribute('data-alert-id', index);

        // Animação de entrada
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateY(-10px)';
        alertContainer.appendChild(alertElement);

        // Anima entrada
        setTimeout(() => {
            alertElement.style.transition = 'all 0.3s ease-out';
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translateY(0)';
        }, index * 100);
    });
}


// Exposição global das funções principais
if (typeof window !== 'undefined') {
    window.formatCurrencyAdvanced = formatCurrencyAdvanced;
    window.calculateMonetaryPerformance = calculateMonetaryPerformance;
    window.updateMonetaryElementsAdvanced = updateMonetaryElementsAdvanced;
    console.log('💰 Funções monetárias avançadas disponíveis globalmente');
}
