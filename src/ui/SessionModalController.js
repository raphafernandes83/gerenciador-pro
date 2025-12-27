/**
 * 🎯 Controlador do Modal de Seleção de Modo de Sessão
 * Gerencia a interação do usuário com o modal de nova sessão
 */

import { logger } from '../utils/Logger.js';

export class SessionModalController {
    constructor() {
        this.modal = null;
        this.newSessionBtn = null;
        this.initialized = false;
    }

    /**
     * Inicializa controlador e event listeners
     */
    init() {
        if (this.initialized) {
            logger.warn('SessionModalController já inicializado');
            return;
        }

        // Buscar elementos do DOM
        this.modal = document.getElementById('session-mode-modal');
        this.newSessionBtn = document.getElementById('new-session-btn');

        if (!this.modal) {
            logger.error('Modal #session-mode-modal não encontrado');
            return;
        }

        if (!this.newSessionBtn) {
            logger.warn('Botão #new-session-btn não encontrado');
            // Não é crítico, botão pode estar sendo criado dinamicamente
        } else {
            this.attachNewSessionListener();
        }

        // Fechar modal ao clicar fora
        this.attachCloseListeners();

        this.initialized = true;
        logger.info('✅ SessionModalController inicializado');
    }

    /**
     * Adiciona listener ao botão "Nova Sessão"
     */
    attachNewSessionListener() {
        this.newSessionBtn.addEventListener('click', () => {
            logger.info('🎯 Abrindo modal de seleção de modo de sessão');
            this.showModal();
        });
    }

    /**
     * Adiciona listeners para fechar modal
     */
    attachCloseListeners() {
        // Fechar ao clicar no overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Fechar com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    /**
     * Exibe o modal
     */
    showModal() {
        if (!this.modal) {
            logger.error('Modal não disponível');
            return;
        }

        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');

        // Focus no primeiro botão
        const firstButton = this.modal.querySelector('button');
        if (firstButton) {
            setTimeout(() => firstButton.focus(), 100);
        }
    }

    /**
     * Esconde o modal
     */
    hideModal() {
        if (!this.modal) return;

        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');

        // Retorna focus ao botão que abriu
        if (this.newSessionBtn) {
            this.newSessionBtn.focus();
        }
    }
}

// Inicialização automática
if (typeof window !== 'undefined') {
    const controller = new SessionModalController();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => controller.init());
    } else {
        controller.init();
    }

    // Expor globalmente para debug
    window.sessionModalController = controller;
}

export default SessionModalController;
