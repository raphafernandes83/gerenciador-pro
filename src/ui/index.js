/**
 * @fileoverview Index de componentes UI
 * Exporta todos os componentes de UI de forma centralizada
 * @module UI
 */

// Componentes principais
export { BaseUI } from './BaseUI.js';
export { DashboardUI } from './DashboardUI.js';
export { MetasUI } from './MetasUI.js';
export { TabelaUI } from './TabelaUI.js';
export { TimelineUI } from './TimelineUI.js';
export { ModalUI } from './ModalUI.js';
export { NotificationUI } from './NotificationUI.js';

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
        notification: new NotificationUI()
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
        componente.init();
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
    criarComponentesUI,
    inicializarUI
};
