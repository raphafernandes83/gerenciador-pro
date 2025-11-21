/**
 * @fileoverview Sistema Aprimorado de Gráfico de Rosca com Contadores
 * @description Gráfico sempre visível que se atualiza em tempo real com contadores de vitórias/derrotas
 * @version 1.0.0
 * @author Sistema de Trading
 */

'use strict';

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================================

const DONUT_CONFIG = Object.freeze({
    COLORS: {
        WIN: '#059669',        // Verde específico solicitado
        LOSS: '#fca5a5',       // Vermelho complementar
        EMPTY: '#374151',      // Cinza para estado vazio
        EMPTY_LIGHT: '#4b5563' // Cinza mais claro para placeholder
    },
    
    CHART_OPTIONS: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false // Removido - usamos contadores personalizados
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '65%', // Rosca com buraco no centro
        animation: {
            animateRotate: true,
            animateScale: false,
            duration: 800,
            easing: 'easeOutQuart'
        }
    },
    
    SELECTORS: {
        CANVAS: '#progress-pie-chart',
        WINS_COUNTER: '#wins-counter',
        LOSSES_COUNTER: '#losses-counter'
    },
    
    ANIMATION: {
        COUNTER_PULSE_DURATION: 600,
        UPDATE_DEBOUNCE: 300
    }
});

// ============================================================================
// CLASSE PRINCIPAL DO SISTEMA
// ============================================================================

class EnhancedDonutChartSystem {
    constructor() {
        this.chart = null;
        this.canvas = null;
        this.winsElement = null;
        this.lossesElement = null;
        this.updateTimeout = null;
        this.lastWins = 0;
        this.lastLosses = 0;
        
        this.initializeSystem();
    }

    /**
     * Inicializa o sistema completo
     */
    initializeSystem() {
        try {
            this.setupDOMElements();
            this.createInitialChart();
            this.setupDataObserver();
            
            console.log('✅ Sistema de Gráfico de Rosca Aprimorado inicializado');
        } catch (error) {
            console.error('❌ Erro na inicialização do sistema:', error);
        }
    }

    /**
     * Configura referências aos elementos DOM
     */
    setupDOMElements() {
        this.canvas = document.querySelector(DONUT_CONFIG.SELECTORS.CANVAS);
        this.winsElement = document.querySelector(DONUT_CONFIG.SELECTORS.WINS_COUNTER);
        this.lossesElement = document.querySelector(DONUT_CONFIG.SELECTORS.LOSSES_COUNTER);

        if (!this.canvas) {
            throw new Error('Canvas do gráfico não encontrado');
        }
        
        if (!this.winsElement || !this.lossesElement) {
            throw new Error('Elementos dos contadores não encontrados');
        }
    }

    /**
     * Cria o gráfico inicial (sempre visível, mesmo vazio)
     */
    createInitialChart() {
        const ctx = this.canvas.getContext('2d');
        
        // Destrói gráfico anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        // Dados iniciais (placeholder)
        const initialData = this.getChartData(0, 0);
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: initialData,
            options: DONUT_CONFIG.CHART_OPTIONS
        });

        console.log('📊 Gráfico de rosca criado (estado inicial)');
    }

    /**
     * Gera dados para o gráfico baseado em vitórias e derrotas
     * @param {number} wins - Número de vitórias
     * @param {number} losses - Número de derrotas
     * @returns {Object} Dados formatados para Chart.js
     */
    getChartData(wins, losses) {
        const hasData = wins > 0 || losses > 0;
        
        if (!hasData) {
            // Estado vazio - mostra placeholder
            return {
                labels: ['Aguardando dados'],
                datasets: [{
                    data: [1], // Valor mínimo para mostrar o círculo
                    backgroundColor: [DONUT_CONFIG.COLORS.EMPTY],
                    borderColor: [DONUT_CONFIG.COLORS.EMPTY_LIGHT],
                    borderWidth: 2,
                    hoverBackgroundColor: [DONUT_CONFIG.COLORS.EMPTY_LIGHT],
                    hoverBorderColor: [DONUT_CONFIG.COLORS.EMPTY_LIGHT]
                }]
            };
        }

        // Estado com dados reais
        return {
            labels: ['Vitórias', 'Derrotas'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: [
                    DONUT_CONFIG.COLORS.WIN,
                    DONUT_CONFIG.COLORS.LOSS
                ],
                borderColor: [
                    DONUT_CONFIG.COLORS.WIN,
                    DONUT_CONFIG.COLORS.LOSS
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    this.lightenColor(DONUT_CONFIG.COLORS.WIN, 0.1),
                    this.lightenColor(DONUT_CONFIG.COLORS.LOSS, 0.1)
                ],
                hoverBorderColor: [
                    DONUT_CONFIG.COLORS.WIN,
                    DONUT_CONFIG.COLORS.LOSS
                ]
            }]
        };
    }

    /**
     * Clareia uma cor hexadecimal
     * @param {string} color - Cor em formato hex
     * @param {number} amount - Quantidade para clarear (0-1)
     * @returns {string} Cor clareada
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) + amount * 255));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + amount * 255));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + amount * 255));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Conta vitórias e derrotas do histórico
     * @returns {Object} Objeto com wins e losses
     */
    countWinsAndLosses() {
        try {
            const historico = window.state?.historicoCombinado || [];
            
            let wins = 0;
            let losses = 0;

            historico.forEach(operacao => {
                if (operacao && typeof operacao === 'object') {
                    // Múltiplas formas de identificar vitória/derrota
                    const isWin = operacao.isWin === true || 
                                 operacao.resultado === 'win' || 
                                 operacao.resultado === 'vitoria' ||
                                 (operacao.valor && operacao.valor > 0);
                    
                    if (isWin) {
                        wins++;
                    } else {
                        losses++;
                    }
                }
            });

            return { wins, losses };
        } catch (error) {
            console.error('Erro ao contar vitórias/derrotas:', error);
            return { wins: 0, losses: 0 };
        }
    }

    /**
     * Atualiza o gráfico e contadores
     */
    updateChart() {
        try {
            const { wins, losses } = this.countWinsAndLosses();
            
            // Atualiza dados do gráfico
            const newData = this.getChartData(wins, losses);
            this.chart.data = newData;
            this.chart.update('active');

            // Atualiza contadores com animação
            this.updateCounters(wins, losses);

            console.log(`📊 Gráfico atualizado: ${wins} vitórias, ${losses} derrotas`);
        } catch (error) {
            console.error('Erro ao atualizar gráfico:', error);
        }
    }

    /**
     * Atualiza os contadores com animação
     * @param {number} wins - Número de vitórias
     * @param {number} losses - Número de derrotas
     */
    updateCounters(wins, losses) {
        // Atualiza vitórias
        if (wins !== this.lastWins) {
            this.animateCounterUpdate(this.winsElement, wins);
            this.lastWins = wins;
        }

        // Atualiza derrotas
        if (losses !== this.lastLosses) {
            this.animateCounterUpdate(this.lossesElement, losses);
            this.lastLosses = losses;
        }
    }

    /**
     * Anima a atualização de um contador
     * @param {HTMLElement} element - Elemento do contador
     * @param {number} newValue - Novo valor
     */
    animateCounterUpdate(element, newValue) {
        if (!element) return;

        // Adiciona classe de animação
        element.classList.add('updated');
        element.textContent = newValue.toString();

        // Remove classe após animação
        setTimeout(() => {
            element.classList.remove('updated');
        }, DONUT_CONFIG.ANIMATION.COUNTER_PULSE_DURATION);
    }

    /**
     * Configura observador para mudanças nos dados
     */
    setupDataObserver() {
        // Observa mudanças no window.state
        let lastHistoricoLength = 0;

        const checkForUpdates = () => {
            try {
                const currentLength = window.state?.historicoCombinado?.length || 0;
                
                if (currentLength !== lastHistoricoLength) {
                    lastHistoricoLength = currentLength;
                    
                    // Debounce para evitar atualizações excessivas
                    if (this.updateTimeout) {
                        clearTimeout(this.updateTimeout);
                    }
                    
                    this.updateTimeout = setTimeout(() => {
                        this.updateChart();
                    }, DONUT_CONFIG.ANIMATION.UPDATE_DEBOUNCE);
                }
            } catch (error) {
                console.error('Erro no observador de dados:', error);
            }
        };

        // Verifica mudanças a cada segundo
        setInterval(checkForUpdates, 1000);

        // Atualização inicial
        setTimeout(() => {
            this.updateChart();
        }, 500);
    }

    /**
     * Força atualização manual (para testes)
     */
    forceUpdate() {
        this.updateChart();
    }

    /**
     * Destrói o sistema e limpa recursos
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
        
        console.log('🗑️ Sistema de Gráfico de Rosca destruído');
    }
}

// ============================================================================
// INICIALIZAÇÃO E EXPOSIÇÃO GLOBAL
// ============================================================================

let enhancedDonutSystem = null;

/**
 * Inicializa o sistema quando o DOM estiver pronto
 */
function initializeEnhancedDonutSystem() {
    if (enhancedDonutSystem) {
        enhancedDonutSystem.destroy();
    }
    
    enhancedDonutSystem = new EnhancedDonutChartSystem();
    
    // Expõe globalmente para testes
    window.enhancedDonutSystem = enhancedDonutSystem;
}

// Aguarda DOM e Chart.js estarem disponíveis
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Aguarda Chart.js carregar
        const waitForChartJS = () => {
            if (typeof Chart !== 'undefined') {
                initializeEnhancedDonutSystem();
            } else {
                setTimeout(waitForChartJS, 100);
            }
        };
        waitForChartJS();
    });
} else {
    // DOM já carregado
    const waitForChartJS = () => {
        if (typeof Chart !== 'undefined') {
            initializeEnhancedDonutSystem();
        } else {
            setTimeout(waitForChartJS, 100);
        }
    };
    waitForChartJS();
}

console.log('🚀 Sistema Aprimorado de Gráfico de Rosca carregado');
