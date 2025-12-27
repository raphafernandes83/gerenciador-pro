/**
 * 📊 GERENC IAR DE TOOLTIPS DE MÉTRICAS
 * Controla tooltips interativos com explicações para cada métrica do Dashboard
 * 
 * @class MetricTooltipManager
 * @version 1.0.0
 */

import { logger } from '../../../utils/Logger.js';

class MetricTooltipManager {
    constructor() {
        this.activeTooltip = null;
        this.tooltipElement = null;
        this.boundHandlers = {
            documentClick: this.handleDocumentClick.bind(this),
            keyDown: this.handleKeyDown.bind(this)
        };
    }

    /**
     * Inicializar gerenciador de tooltips
     */
    init() {
        // Criar elemento do tooltip
        this.createTooltipElement();

        // Adicionar event listeners globais
        document.addEventListener('click', this.boundHandlers.documentClick);
        document.addEventListener('keydown', this.boundHandlers.keyDown);

        // Registrar listeners nos ícones (?)
        this.attachHelpIconListeners();

        logger.info('✅ MetricTooltipManager inicializado');
    }

    /**
     * Criar elemento HTML do tooltip
     */
    createTooltipElement() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'metric-tooltip';
        this.tooltipElement.setAttribute('role', 'tooltip');
        document.body.appendChild(this.tooltipElement);
    }

    /**
     * Registrar event listeners em todos os ícones (?)
     */
    attachHelpIconListeners() {
        const helpIcons = document.querySelectorAll('.help-icon');

        helpIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const metricId = icon.dataset.metric;
                const rawValue = icon.dataset.value;
                this.showTooltip(metricId, icon, rawValue);
            });
        });

        logger.info(`✅ ${helpIcons.length} ícones de ajuda registrados`);
    }

    /**
     * Exibir tooltip para uma métrica
     * @param {string} metricId - ID da métrica (ex: 'payoff-ratio')
     * @param {HTMLElement} anchorElement - Elemento âncora (ícone ?)
     * @param {string|number} currentValue - Valor atual da métrica
     */
    showTooltip(metricId, anchorElement, currentValue) {
        const metricData = METRIC_GLOSSARY[metricId];

        if (!metricData) {
            logger.warn(`Métrica "${metricId}" não encontrada no glossário`);
            return;
        }

        // Fechar tooltip anterior
        this.hideTooltip();

        // Renderizar conteúdo
        this.renderTooltipContent(metricData, currentValue);

        // Posicionar tooltip
        this.positionTooltip(anchorElement);

        // Mostrar com animação
        requestAnimationFrame(() => {
            this.tooltipElement.classList.add('visible');
        });

        this.activeTooltip = { metricId, anchorElement };
    }

    /**
     * Renderizar conteúdo HTML do tooltip
     * @param {Object} metricData - Dados da métrica do glossário
     * @param {string|number} currentValue - Valor atual
     */
    renderTooltipContent(metricData, currentValue) {
        // Calcular status baseado no valor
        const numericValue = this.parseValue(currentValue);
        const status = calculateMetricStatus(metricData.id || '', numericValue);

        // Formatar valor para exibição
        const formattedValue = this.formatValue(currentValue);
        const valueClass = this.getValueClass(numericValue);

        this.tooltipElement.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon">${metricData.icon}</span>
                <h5>${metricData.label}</h5>
                <button class="tooltip-close" aria-label="Fechar tooltip">×</button>
            </div>
            <div class="tooltip-body">
                <p class="tooltip-description">${metricData.description}</p>
                
                <div class="tooltip-current-value">
                    <span class="label">Seu valor:</span>
                    <span class="value ${valueClass}">${formattedValue}</span>
                    <span class="status-badge ${status.class}">${status.label}</span>
                </div>
                
                <div class="tooltip-example">
                    <p class="example-title">📌 Exemplo:</p>
                    <ul>
                        <li>${metricData.example.good}</li>
                        <li>${metricData.example.calculation}</li>
                    </ul>
                </div>
                
                <div class="tooltip-ideal">
                    <span class="ideal-label">✅ Ideal:</span>
                    <span class="ideal-value">${metricData.ideal}</span>
                </div>
                
                ${metricData.tip ? `
                    <div class="tooltip-tip">
                        ${metricData.tip}
                    </div>
                ` : ''}
                
                <a href="#" class="tooltip-link" data-action="open-glossary">
                    Ver Mais Detalhes
                </a>
            </div>
        `;

        // Event listener do botão fechar
        const closeBtn = this.tooltipElement.querySelector('.tooltip-close');
        closeBtn.addEventListener('click', () => this.hideTooltip());

        // Event listener do link "Ver Mais"
        const link = this.tooltipElement.querySelector('.tooltip-link');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.openFullGlossary();
        });
    }

    /**
     * Posicionar tooltip próximo ao elemento âncora
     * @param {HTMLElement} anchorElement - Elemento de referência
     */
    positionTooltip(anchorElement) {
        const rect = anchorElement.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;
        let position = 'bottom'; // posição padrão

        // Tentar posicionar abaixo
        const bottomSpace = viewport.height - rect.bottom;
        if (bottomSpace >= tooltipRect.height + 20) {
            top = rect.bottom + 10;
            left = Math.max(10, Math.min(rect.left, viewport.width - tooltipRect.width - 10));
            position = 'bottom';
        }
        // Se não couber, tentar acima
        else if (rect.top >= tooltipRect.height + 20) {
            top = rect.top - tooltipRect.height - 10;
            left = Math.max(10, Math.min(rect.left, viewport.width - tooltipRect.width - 10));
            position = 'top';
        }
        // Se não couber, tentar à direita
        else if (viewport.width - rect.right >= tooltipRect.width + 20) {
            top = Math.max(10, Math.min(rect.top, viewport.height - tooltipRect.height - 10));
            left = rect.right + 10;
            position = 'right';
        }
        // Último recurso: à esquerda
        else {
            top = Math.max(10, Math.min(rect.top, viewport.height - tooltipRect.height - 10));
            left = rect.left - tooltipRect.width - 10;
            position = 'left';
        }

        // Aplicar posição
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;

        // Adicionar classe de posição para a seta
        this.tooltipElement.className = `metric-tooltip position-${position}`;
    }

    /**
     * Esconder tooltip
     */
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
            this.activeTooltip = null;
        }
    }

    /**
     * Abrir glossário completo em nova aba
     */
    openFullGlossary() {
        const glossaryPath = '/GLOSSARIO_METRICAS_TRADING.md';

        // Tentar abrir como arquivo markdown
        const link = document.createElement('a');
        link.href = glossaryPath;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();

        this.hideTooltip();
    }

    /**
     * Handler de cliques no document (fechar ao clicar fora)
     * @param {Event} e - Evento de click
     */
    handleDocumentClick(e) {
        if (this.activeTooltip && this.tooltipElement) {
            const clickedInside = this.tooltipElement.contains(e.target);
            const clickedIcon = e.target.closest('.help-icon');

            if (!clickedInside && !clickedIcon) {
                this.hideTooltip();
            }
        }
    }

    /**
     * Handler de teclas (ESC para fechar)
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.activeTooltip) {
            this.hideTooltip();
        }
    }

    /**
     * Parsear valor para número
     * @param {string|number} value - Valor bruto
     * @returns {number} Valor numérico
     */
    parseValue(value) {
        if (typeof value === 'number') return value;

        // Remover símbolos de moeda e percentual
        const cleaned = String(value).replace(/[R$%\s]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Formatar valor para exibição
     * @param {string|number} value - Valor bruto
     * @returns {string} Valor formatado
     */
    formatValue(value) {
        // Se já estiver formatado (contém R$ ou %), retornar como está
        if (String(value).includes('R$') || String(value).includes('%') || String(value).includes('--')) {
            return value;
        }

        const numeric = this.parseValue(value);

        // Detectar tipo baseado no valor
        if (Math.abs(numeric) < 1 && numeric !== 0) {
            return `${(numeric * 100).toFixed(1)}%`;
        }

        return numeric.toString();
    }

    /**
     * Obter classe CSS baseado no valor (positivo/negativo)
     * @param {number} value - Valor numérico
     * @returns {string} Classe CSS
     */
    getValueClass(value) {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return '';
    }

    /**
     * Destruir gerenciador (cleanup)
     */
    destroy() {
        document.removeEventListener('click', this.boundHandlers.documentClick);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);

        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }

        this.activeTooltip = null;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.MetricTooltipManager = MetricTooltipManager;
}
