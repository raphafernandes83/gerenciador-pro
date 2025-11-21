/**
 * @fileoverview Gerenciador Centralizado da UI do Dashboard
 * Responsável por atualizar métricas, aplicar cores e gerenciar o estado visual do dashboard.
 * Consolida lógicas anteriormente dispersas em scripts de correção.
 */

import { ValueFormatter } from '../utils/ValueFormatter.js'; // Vamos assumir/criar este utilitário
import { DOMHelper } from '../utils/DOMHelper.js'; // Vamos assumir/criar este utilitário

export class DashboardUIManager {
    constructor() {
        this.initialized = false;
        this.updateInterval = null;
        this.config = {
            updateIntervalMs: 1000,
            colors: {
                success: '#059669',
                danger: '#fca5a5',
                neutral: '#6b7280'
            }
        };
    }

    /**
     * Inicializa o gerenciador
     */
    init() {
        if (this.initialized) return;

        console.log('🚀 DashboardUIManager: Inicializando...');
        this.startMonitoring();
        this.initialized = true;
    }

    /**
     * Inicia o ciclo de monitoramento e atualização
     */
    startMonitoring() {
        // Atualização inicial imediata
        this.updateUI();

        // Ciclo de atualização
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, this.config.updateIntervalMs);
    }

    /**
     * Atualiza toda a UI do Dashboard com base no estado global
     */
    /**
     * Atualiza a interface (Método simplificado para evitar conflitos)
     * A atualização do Card de Progresso é gerenciada pelo progress-card-module.js
     */
    updateUI() {
        // Lógica removida para evitar conflito com progress-card-module.js
        // O módulo progress-card já gerencia:
        // - Performance Metrics (Win/Meta)
        // - Risk Metrics (Loss/Limite)
        // - Target Displays (Alvo/Margem)
    }

    /**
     * Limpa recursos ao destruir
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.initialized = false;
    }
}

// Singleton instance
export const dashboardUIManager = new DashboardUIManager();
