/**
 * @fileoverview Componente de Notificações
 * Gerencia toasts, alertas e popups de notificação
 * @module NotificationUI
 */

import { BaseUI } from './BaseUI.js';
import { logger } from '../utils/Logger.js';

/**
 * Componente responsável por notificações
 */
export class NotificationUI extends BaseUI {
    constructor() {
        super();
        this.queue = [];
        this.ativas = [];
        this.maxSimultaneas = 3;
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();
        this._criarContainer();
        logger.info('🔔 NotificationUI pronto');
    }

    /**
     * Cria container de notificações
     * @private
     */
    _criarContainer() {
        if (document.getElementById('notifications-container')) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        container.setAttribute('role', 'status');
        document.body.appendChild(container);
    }

    /**
     * Mostra toast
     * @param {string} mensagem - Mensagem a exibir
     * @param {string} tipo - 'success', 'error', 'warning', 'info'
     * @param {number} duracao - Duração em ms
     */
    mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
        const notificacao = {
            id: this._gerarId(),
            mensagem,
            tipo,
            duracao,
            timestamp: Date.now()
        };

        // Adicionar à fila
        this.queue.push(notificacao);

        // Processar fila
        this._processarFila();

        logger.debug(`Toast: ${tipo} - ${mensagem}`);

        return notificacao.id;
    }

    /**
     * Processa fila de notificações
     * @private
     */
    _processarFila() {
        // Se já temos o máximo, aguardar
        if (this.ativas.length >= this.maxSimultaneas) {
            return;
        }

        // Pegar próxima da fila
        const notificacao = this.queue.shift();
        if (!notificacao) return;

        // Mostrar
        this._mostrarNotificacao(notificacao);

        // Continuar processando se houver mais
        if (this.queue.length > 0) {
            setTimeout(() => this._processarFila(), 300);
        }
    }

    /**
     * Mostra notificação
     * @private
     */
    _mostrarNotificacao(notificacao) {
        const container = document.getElementById('notifications-container');
        if (!container) return;

        // Criar elemento
        const el = this._criarElementoNotificacao(notificacao);

        // Adicionar ao container
        container.appendChild(el);

        // Adicionar às ativas
        this.ativas.push(notificacao.id);

        // Animar entrada
        requestAnimationFrame(() => {
            el.classList.add('show');
        });

        // Auto-fechar após duração
        if (notificacao.duracao > 0) {
            setTimeout(() => {
                this.fecharNotificacao(notificacao.id);
            }, notificacao.duracao);
        }
    }

    /**
     * Cria elemento de notificação
     * @private
     */
    _criarElementoNotificacao(notificacao) {
        const el = document.createElement('div');
        el.className = `notification notification-${notificacao.tipo}`;
        el.dataset.id = notificacao.id;
        el.setAttribute('role', 'alert');
        el.setAttribute('aria-live', 'assertive');

        const icones = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const icone = icones[notificacao.tipo] || icones.info;

        el.innerHTML = `
            <div class="notification-icon" aria-hidden="true">${icone}</div>
            <div class="notification-message">${notificacao.mensagem}</div>
            <button class="notification-close" aria-label="Fechar notificação">&times;</button>
        `;

        // Event listener no botão fechar
        const btnClose = el.querySelector('.notification-close');
        btnClose.addEventListener('click', () => {
            this.fecharNotificacao(notificacao.id);
        });

        return el;
    }

    /**
     * Fecha notificação
     * @param {string} id - ID da notificação
     */
    fecharNotificacao(id) {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (!el) return;

        // Animar saída
        el.classList.remove('show');

        // Remover após animação
        setTimeout(() => {
            el.remove();

            // Remover das ativas
            const index = this.ativas.indexOf(id);
            if (index > -1) {
                this.ativas.splice(index, 1);
            }

            // Processar próxima da fila
            this._processarFila();
        }, 300);
    }

    /**
     * Mostra insight popup (popup especial)
     * @param {string} mensagem - Mensagem
     * @param {string} icone - Emoji do ícone
     */
    mostrarInsightPopup(mensagem, icone = '💡') {
        const container = document.getElementById('notifications-container');
        if (!container) return;

        const popup = document.createElement('div');
        popup.className = 'insight-popup';
        popup.innerHTML = `
            <div class="insight-icon">${icone}</div>
            <div class="insight-message">${mensagem}</div>
        `;

        container.appendChild(popup);

        // Animar entrada
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });

        // Auto-fechar após 5s
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }, 5000);

        logger.debug(`Insight: ${mensagem}`);
    }

    /**
     * Mostra alerta persistente
     * @param {string} mensagem - Mensagem
     * @param {string} tipo - Tipo do alerta
     */
    mostrarAlertaPersistente(mensagem, tipo = 'warning') {
        return this.mostrarToast(mensagem, tipo, 0); // Duração 0 = não fecha automaticamente
    }

    /**
     * Mostra notificação de sucesso
     * @param {string} mensagem
     */
    success(mensagem) {
        return this.mostrarToast(mensagem, 'success');
    }

    /**
     * Mostra notificação de erro
     * @param {string} mensagem
     */
    error(mensagem) {
        return this.mostrarToast(mensagem, 'error', 5000); // Erros ficam mais tempo
    }

    /**
     * Mostra notificação de warning
     * @param {string} mensagem
     */
    warning(mensagem) {
        return this.mostrarToast(mensagem, 'warning', 4000);
    }

    /**
     * Mostra notificação de info
     * @param {string} mensagem
     */
    info(mensagem) {
        return this.mostrarToast(mensagem, 'info');
    }

    /**
     * Fecha todas as notificações
     */
    fecharTodas() {
        const ativas = [...this.ativas];
        ativas.forEach(id => this.fecharNotificacao(id));

        // Limpar fila
        this.queue = [];
    }

    /**
     * Gera ID único
     * @private
     */
    _gerarId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Define máximo de notificações simultâneas
     */
    setMaxSimultaneas(max) {
        this.maxSimultaneas = max;
    }

    /**
     * Exibe aviso discreto de bloqueio quando metas sao atingidas (modo suave)
     * @param {'STOP_WIN'|'STOP_LOSS'|null} type - Tipo de bloqueio
     * @param {string|null} reason - Motivo do bloqueio
     */
    sinalizarBloqueioSuave(type, reason = null) {
        const isWin = type === 'STOP_WIN';
        const icon = isWin ? '🏁' : '⛔';
        const msg = isWin ? 'Meta de ganhos atingida' : 'Limite de perda atingido';

        // Mostra insight popup
        this.mostrarInsightPopup(`${msg}${reason ? ` · ${reason}` : ''}`, icon);

        logger.debug(`Sinalização de bloqueio: ${type} - ${msg}`);
    }
}

export default NotificationUI;
