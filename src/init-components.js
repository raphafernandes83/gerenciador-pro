/**
 * 🚀 Inicialização de Componentes UI
 * 
 * Este script inicializa os componentes UI avançados e os anexa ao objeto global window.components
 * para serem usados pelo sistema legado (ui.js).
 */

import { ModalUI } from './ui/ModalUI.js';
import { TimelineUI } from './ui/TimelineUI.js';
import { TabelaUI } from './ui/TabelaUI.js';
import { HistoricoUI } from './ui/HistoricoUI.js';

// Namespace global para componentes
window.components = window.components || {};

// Função de inicialização
export function initComponents() {
    console.log('🚀 Inicializando componentes UI avançados...');

    try {
        // Inicializa Modal
        window.components.modal = new ModalUI();
        window.components.modal.init();

        // Inicializa Timeline
        window.components.timeline = new TimelineUI();
        window.components.timeline.init();

        // Inicializa Tabela
        window.components.tabela = new TabelaUI();
        window.components.tabela.init();

        // Inicializa Historico
        window.components.historico = new HistoricoUI();
        window.components.historico.init();

        console.log('✅ Componentes UI inicializados com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar componentes UI:', error);
    }
}

// Auto-inicialização se carregado como módulo principal
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponents);
} else {
    initComponents();
}
