/**
 * @fileoverview Sistema Unificado de Gerenciamento de Gráficos - Arquitetura Simplificada e Segura
 * @description Gerencia a renderização de gráficos de forma centralizada e segura.
 * @version 2.1.0
 */

'use strict';

export class UnifiedChartSystem {
    constructor() {
        this.charts = new Map();
        this.initialized = false;
    }

    /**
     * Inicializa o sistema
     */
    init() {
        if (this.initialized) return;
        console.log('📊 UnifiedChartSystem: Inicializando...');
        this.initialized = true;
    }

    /**
     * Cria ou atualiza o gráfico de progresso (Donut)
     * @param {string} canvasId ID do elemento canvas
     * @param {Object} data Dados { wins, losses }
     */
    updateProgressChart(canvasId, data) {
        const canvas = document.querySelector(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const wins = data.wins || 0;
        const losses = data.losses || 0;
        const total = wins + losses;

        // Destrói gráfico anterior se existir
        if (this.charts.has(canvasId)) {
            const oldChart = this.charts.get(canvasId);
            // Verifica se é uma instância válida do Chart.js antes de destruir
            if (oldChart && typeof oldChart.destroy === 'function') {
                oldChart.destroy();
            }
            this.charts.delete(canvasId);
        }

        // Configuração do gráfico
        const config = {
            type: 'doughnut',
            data: {
                labels: ['Vitórias', 'Derrotas'],
                datasets: [{
                    data: total === 0 ? [1] : [wins, losses],
                    backgroundColor: total === 0 ? ['#374151'] : ['#059669', '#fca5a5'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: total > 0 }
                },
                animation: {
                    duration: 500
                }
            }
        };

        // Cria novo gráfico
        try {
            const newChart = new Chart(ctx, config);
            this.charts.set(canvasId, newChart);

            // Atualiza contadores externos se existirem
            this._updateExternalCounters(wins, losses);
        } catch (error) {
            console.error('❌ Erro ao criar gráfico:', error);
        }
    }

    _updateExternalCounters(wins, losses) {
        const winsEl = document.getElementById('wins-counter');
        const lossesEl = document.getElementById('losses-counter');

        if (winsEl) winsEl.textContent = wins;
        if (lossesEl) lossesEl.textContent = losses;
    }
}

/**
 * Interface base para plugins de gráfico
 * Fornece estrutura comum para todos os plugins
 */
export class IChartPlugin {
    constructor(name) {
        this.name = name || 'UnnamedPlugin';
        this.enabled = true;
    }

    /**
     * Inicializa o plugin
     * @param {UnifiedChartSystem} chartSystem - Sistema de gráficos
     */
    init(chartSystem) {
        this.chartSystem = chartSystem;
    }

    /**
     * Ativa o plugin
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Desativa o plugin
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Verifica se o plugin está ativo
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
}


// Singleton instance
export const unifiedChartSystem = new UnifiedChartSystem();

// Inicialização automática segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => unifiedChartSystem.init());
} else {
    unifiedChartSystem.init();
}
