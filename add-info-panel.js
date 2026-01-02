/**
 * Script para adicionar Painel Informativo na Sidebar
 * Substitui o painel verde de parâmetros
 * 
 * @typedef {Object} Window
 * @property {any} [InfoPanel]
 * @property {any} [infoPanel]
 */

import { generateInfoPanelHTML } from './src/ui/templates/InfoPanelTemplate.js';

// Aguarda sidebar estar pronta
document.addEventListener('DOMContentLoaded', () => {
    // Tenta várias vezes até encontrar a sidebar
    let attempts = 0;
    const maxAttempts = 20;

    const tryAddPanel = () => {
        attempts++;

        // Procura container na sidebar onde adicionar o painel
        const sidebarContent = document.querySelector('.sidebar-content');
        const sidebarNav = document.querySelector('.sidebar-nav');
        const targetContainer = sidebarContent || sidebarNav || document.querySelector('.sidebar');

        if (targetContainer) {
            // Remove painel verde antigo se existir
            const oldPanel = targetContainer.querySelector('.parameters-card');
            if (oldPanel) {
                oldPanel.remove();
                console.log('🗑️ Painel verde removido');
            }

            // Cria div para o novo painel
            const panelDiv = document.createElement('div');
            panelDiv.innerHTML = generateInfoPanelHTML();

            // Adiciona no topo da sidebar
            targetContainer.insertBefore(panelDiv.firstElementChild, targetContainer.firstChild);

            console.log('✅ Painel informativo adicionado à sidebar');

            // Inicializa InfoPanel APÓS HTML estar no DOM
            setTimeout(() => {
                if (window.InfoPanel) {
                    window.infoPanel = new window.InfoPanel();
                    window.infoPanel.init();
                    console.log('⏰ InfoPanel inicializado - relógio funcionando!');
                } else {
                    console.error('❌ window.InfoPanel não encontrado');
                }
            }, 150);
            return true;
        }

        // Se não encontrou e ainda tem tentativas, tenta novamente
        if (attempts < maxAttempts) {
            setTimeout(tryAddPanel, 200);
            return false;
        } else {
            console.warn('⚠️ Não foi possível encontrar container da sidebar após', maxAttempts, 'tentativas');
            return false;
        }
    };

    // Aguarda 500ms antes de tentar pela primeira vez
    setTimeout(tryAddPanel, 500);
});
