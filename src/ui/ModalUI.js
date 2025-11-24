/**
 * @fileoverview Componente de Modais
 * Gerencia todos os modais do sistema
 * @module ModalUI
 */

import { BaseUI } from './BaseUI.js';
import { logger } from '../utils/Logger.js';

/**
 * Componente responsável pelos modais
 */
export class ModalUI extends BaseUI {
    constructor() {
        super();
        this.modaisAbertos = [];
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();
        this._setupEventListeners();
        logger.info('🪟 ModalUI pronto');
    }

    /**
     * Setup de event listeners
     * @private
     */
    _setupEventListeners() {
        // Fechar ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.fecharModal(e.target.closest('.modal'));
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modaisAbertos.length > 0) {
                const ultimoModal = this.modaisAbertos[this.modaisAbertos.length - 1];
                this.fecharModal(ultimoModal);
            }
        });
    }

    /**
     * Mostra modal genérico
     * @param {Object} config - Configuração do modal
     */
    mostrarModal(config = {}) {
        const {
            titulo = 'Modal',
            conteudo = '',
            botoes = [],
            className = '',
            onClose = null
        } = config;

        // Criar modal
        const modal = this._criarModal({
            titulo,
            conteudo,
            botoes,
            className,
            onClose
        });

        // Adicionar ao documento
        document.body.appendChild(modal);

        // Adicionar à lista de abertos
        this.modaisAbertos.push(modal);

        // Animar abertura
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        logger.debug(`Modal aberto: ${titulo}`);

        return modal;
    }

    /**
     * Cria estrutura do modal
     * @private
     */
    _criarModal(config) {
        const modal = document.createElement('div');
        modal.className = `modal ${config.className}`;
        modal.dataset.onClose = config.onClose ? 'custom' : null;

        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <h2>${config.titulo}</h2>
                    <button class="modal-close" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">
                    ${config.conteudo}
                </div>
                ${this._criarFooter(config.botoes)}
            </div>
        `;

        // Event listener no botão fechar
        const btnClose = modal.querySelector('.modal-close');
        btnClose.addEventListener('click', () => this.fecharModal(modal));

        // Event listeners nos botões
        this._setupBotoesModal(modal, config.botoes, config.onClose);

        return modal;
    }

    /**
     * Cria footer com botões
     * @private
     */
    _criarFooter(botoes) {
        if (botoes.length === 0) {
            return '';
        }

        const botoesHTML = botoes.map((botao, index) => {
            const {
                texto = 'OK',
                className = 'btn-primary',
                onClick = null
            } = botao;

            return `
                <button class="modal-btn ${className}" data-btn-index="${index}">
                    ${texto}
                </button>
            `;
        }).join('');

        return `
            <div class="modal-footer">
                ${botoesHTML}
            </div>
        `;
    }

    /**
     * Setup de event listeners dos botões
     * @private
     */
    _setupBotoesModal(modal, botoes, onClose) {
        const btnElements = modal.querySelectorAll('.modal-btn');

        btnElements.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const botao = botoes[index];

                if (botao.onClick) {
                    botao.onClick();
                }

                // Fechar modal após ação (a menos que especificado)
                if (botao.keepOpen !== true) {
                    this.fecharModal(modal);
                }
            });
        });

        // Callback ao fechar
        if (onClose) {
            modal._onCloseCallback = onClose;
        }
    }

    /**
     * Fecha modal
     * @param {HTMLElement} modal - Elemento do modal
     */
    fecharModal(modal) {
        if (!modal) return;

        // Remover classe show
        modal.classList.remove('show');

        // Aguardar animação e remover
        setTimeout(() => {
            // Callback de fechamento
            if (modal._onCloseCallback) {
                modal._onCloseCallback();
            }

            // Remover do DOM
            modal.remove();

            // Remover da lista
            const index = this.modaisAbertos.indexOf(modal);
            if (index > -1) {
                this.modaisAbertos.splice(index, 1);
            }

            logger.debug('Modal fechado');
        }, 300); // Duração da animação
    }

    /**
     * Mostra modal de confirmação
     * @param {string} mensagem - Mensagem a exibir
     * @param {Function} onConfirm - Callback ao confirmar
     */
    mostrarConfirmacao(mensagem, onConfirm) {
        return this.mostrarModal({
            titulo: 'Confirmação',
            conteudo: `<p>${mensagem}</p>`,
            botoes: [
                {
                    texto: 'Cancelar',
                    className: 'btn-secondary',
                    onClick: () => { }
                },
                {
                    texto: 'Confirmar',
                    className: 'btn-primary',
                    onClick: onConfirm
                }
            ]
        });
    }

    /**
     * Mostra modal de alerta
     * @param {string} mensagem - Mensagem a exibir
     * @param {string} tipo - 'success', 'error', 'warning', 'info'
     */
    mostrarAlerta(mensagem, tipo = 'info') {
        const icones = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const icone = icones[tipo] || icones.info;

        return this.mostrarModal({
            titulo: `${icone} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
            conteudo: `<p>${mensagem}</p>`,
            className: `modal-${tipo}`,
            botoes: [
                {
                    texto: 'OK',
                    className: 'btn-primary'
                }
            ]
        });
    }

    /**
     * Mostra modal de loading
     * @param {string} mensagem - Mensagem de loading
     */
    mostrarLoading(mensagem = 'Carregando...') {
        return this.mostrarModal({
            titulo: 'Aguarde',
            conteudo: `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>${mensagem}</p>
                </div>
            `,
            className: 'modal-loading',
            botoes: [] // Sem botões
        });
    }

    /**
     * Mostra modal de replay de sessão
     * @param {Object} sessao - Dados da sessão
     */
    mostrarReplayModal(sessao) {
        // Conteúdo específico do replay
        const conteudo = `
            <div class="replay-container">
                <h3>Sessão: ${sessao.data || 'N/A'}</h3>
                <p>Capital Inicial: ${sessao.capitalInicial || 0}</p>
                <p>Capital Final: ${sessao.capitalFinal || 0}</p>
                <p>Resultado: ${sessao.resultadoFinanceiro || 0}</p>
                <!-- Mais detalhes aqui -->
            </div>
        `;

        return this.mostrarModal({
            titulo: '📺 Replay de Sessão',
            conteudo,
            className: 'modal-replay',
            botoes: [
                {
                    texto: 'Fechar',
                    className: 'btn-secondary'
                }
            ]
        });
    }

    /**
     * Fecha todos os modais
     */
    fecharTodos() {
        const modaisParaFechar = [...this.modaisAbertos];
        modaisParaFechar.forEach(modal => this.fecharModal(modal));
    }

    /**
     * Verifica se há modais abertos
     */
    temModaisAbertos() {
        return this.modaisAbertos.length > 0;
    }
}

export default ModalUI;
