/**
 * =============================================================================
 * SIDEBAR ERROR HANDLER - Sistema de Tratamento de Erros da Sidebar
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1610-1690)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Gerenciar erros da sidebar com circuit breaker pattern.
 * Desabilita a sidebar automaticamente se muitos erros ocorrerem.
 * 
 * Dependências externas:
 * - ui (./ui.js) - para showNotification
 * - window.sidebar - referência global à instância da sidebar
 * 
 * =============================================================================
 */

import { ui } from '../../ui.js';

/**
 * Sistema de Tratamento de Erros da Sidebar
 */
export class SidebarErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 5;
        this.errorWindow = 60000; // 1 minuto
        this.lastErrorTime = 0;
    }

    /**
     * Executa operação com tratamento de erro
     */
    safeExecute(operation, fallback = null) {
        try {
            return operation();
        } catch (error) {
            this.handleError(error);
            return fallback ? fallback() : null;
        }
    }

    /**
     * Trata erro
     */
    handleError(error) {
        const now = Date.now();

        // Reset contador se passou muito tempo
        if (now - this.lastErrorTime > this.errorWindow) {
            this.errorCount = 0;
        }

        this.errorCount++;
        this.lastErrorTime = now;

        console.error('Sidebar error:', error);

        // Desabilita sidebar se muitos erros
        if (this.errorCount >= this.maxErrors) {
            this.disableSidebar();
        }

        // Notifica usuário
        if (ui && ui.showNotification) {
            ui.showNotification('Erro na sidebar. Verifique o console.', 'error');
        }
    }

    /**
     * Desabilita sidebar em caso de muitos erros
     */
    disableSidebar() {
        console.warn('Sidebar disabled due to multiple errors');

        // Remove sidebar do DOM
        if (window.sidebar) {
            window.sidebar.destroy();
        }

        // Mostra botão de configurações como fallback
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = 'block';
        }

        // Notifica usuário
        if (ui && ui.showNotification) {
            ui.showNotification('Sidebar desabilitada. Use o botão de configurações.', 'warning');
        }
    }

    /**
     * Reseta contador de erros
     */
    resetErrorCount() {
        this.errorCount = 0;
        this.lastErrorTime = 0;
    }
}
