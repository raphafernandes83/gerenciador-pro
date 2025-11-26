/**
 * @fileoverview Index de componentes UI
 * Exporta todos os componentes de UI de forma centralizada
 * @module UI
 */

// Importar classes para uso interno
import { BaseUI } from './BaseUI.js';
import { DashboardUI } from './DashboardUI.js';
import { MetasUI } from './MetasUI.js';
import { TabelaUI } from './TabelaUI.js';
import { TimelineUI } from './TimelineUI.js';
import { ModalUI } from './ModalUI.js';
import { NotificationUI } from './NotificationUI.js';
import { PlanoUI } from './PlanoUI.js';
import { HistoricoUI } from './HistoricoUI.js';

// Re-exportar para consumidores externos
export {
    BaseUI,
    DashboardUI,
    MetasUI,
    TabelaUI,
    TimelineUI,
    ModalUI,
    NotificationUI,
    PlanoUI,
    HistoricoUI
};

/**
 * Cria instâncias de todos os componentes
 * @returns {Object} Objeto com todas as instâncias
 */
export function criarComponentesUI() {
    return {
        dashboard: new DashboardUI(),
        metas: new MetasUI(),
        tabela: new TabelaUI(),
        timeline: new TimelineUI(),
        modal: new ModalUI(),
        notification: new NotificationUI(),
        plano: new PlanoUI(),
        historico: new HistoricoUI()
    };
}

/**
 * Inicializa todos os componentes
 * @returns {Object} Componentes inicializados
 */
export function inicializarUI() {
    const componentes = criarComponentesUI();

    // Inicializar cada componente
    Object.values(componentes).forEach(componente => {
        if (componente && typeof componente.init === 'function') {
            componente.init();
        }
    });

    return componentes;
}

export default {
    BaseUI,
    DashboardUI,
    MetasUI,
    TabelaUI,
    TimelineUI,
    ModalUI,
    NotificationUI,
    PlanoUI,
    HistoricoUI,
    criarComponentesUI,
    inicializarUI
};
