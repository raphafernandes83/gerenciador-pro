/**
 * =============================================================================
 * SIDEBAR EVENT MANAGER - Sistema de Gerenciamento de Eventos da Sidebar
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1422-1510)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Gerenciar eventos customizados para comunicação entre
 * sidebar e aplicação principal.
 * 
 * Eventos Gerenciados:
 * - Escuta: 'themeChanged' (documento)
 * - Escuta: 'change' nos toggles de configuração
 * - Emite: 'sidebarChange' com tipos: 'config', 'theme', 'parameter' (desabilitado)
 * 
 * IDs de Elementos Monitorados:
 * - modal-modo-guiado-toggle
 * - modal-incorporar-lucro-toggle
 * - auto-lock-toggle
 * 
 * =============================================================================
 */

/**
 * Sistema de Gerenciamento de Eventos da Sidebar
 */
export class SidebarEventManager {
    constructor() {
        this.listeners = new Map();
        this.setupGlobalListeners();
    }

    /**
     * Configura listeners globais para mudanças no app
     */
    setupGlobalListeners() {
        // 🚨 TEMPORARIAMENTE DESABILITADO - Causando conflito com timeline
        // Escuta mudanças nos parâmetros principais
        // const parameterInputs = ['capital-inicial', 'percentual-entrada', 'stop-win-perc', 'stop-loss-perc'];
        // parameterInputs.forEach(id => {
        //     const element = document.getElementById(id);
        //     if (element) {
        //         element.addEventListener('change', (e) => {
        //             this.emitSidebarChange('parameter', {
        //                 id,
        //                 value: e.target.value,
        //                 type: 'input'
        //             });
        //         });
        //     }
        // });

        console.log(
            '🛡️ [SIDEBAR] Listeners de parâmetros DESABILITADOS para evitar conflito com timeline'
        );

        // Escuta mudanças nas configurações
        const configToggles = [
            'modal-modo-guiado-toggle',
            'modal-incorporar-lucro-toggle',
            'auto-lock-toggle',
        ];
        configToggles.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.emitSidebarChange('config', {
                        id,
                        value: e.target.checked,
                        type: 'checkbox',
                    });
                });
            }
        });

        // Escuta mudanças de tema
        document.addEventListener('themeChanged', (e) => {
            this.emitSidebarChange('theme', {
                theme: e.detail.theme,
            });
        });
    }

    /**
     * Dispara evento de mudança na sidebar
     */
    emitSidebarChange(type, data) {
        const event = new CustomEvent('sidebarChange', {
            detail: {
                type,
                data,
                timestamp: Date.now(),
                source: 'app',
            },
        });
        document.dispatchEvent(event);
    }

    /**
     * Adiciona listener para mudanças na sidebar
     */
    onSidebarChange(callback) {
        document.addEventListener('sidebarChange', callback);
    }

    /**
     * Remove listener
     */
    offSidebarChange(callback) {
        document.removeEventListener('sidebarChange', callback);
    }
}
