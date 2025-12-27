/**
 * 🔔 Sistema de Toast Notifications - Gerenciador PRO v9.3
 * Notificações modernas e não-intrusivas para feedback do usuário
 */

export class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    /**
     * Inicializa o container de toasts
     */
    init() {
        // Criar container se não existe
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Mostra um toast
     * @param {string} message - Mensagem a exibir
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duração em ms (0 = permanente)
     * @param {Object} options - Opções adicionais
     */
    show(message, type = 'info', duration = 3000, options = {}) {
        const toast = this.createToast(message, type, options);

        // Adicionar ao container
        this.container.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        // Guardar referência
        this.toasts.push(toast);

        return toast;
    }

    /**
     * Cria o elemento do toast
     */
    createToast(message, type, options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Ícone baseado no tipo
        const icon = this.getIcon(type);

        // Botão de fechar (opcional)
        const closeBtn = options.dismissible !== false
            ? `<button class="toast-close" aria-label="Fechar">×</button>`
            : '';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                ${options.subtitle ? `<div class="toast-subtitle">${options.subtitle}</div>` : ''}
            </div>
            ${closeBtn}
        `;

        // Event listener para fechar
        if (options.dismissible !== false) {
            toast
                .querySelector('.toast-close')
                .addEventListener('click', () => this.dismiss(toast));
        }

        // Clique no toast para fechar (opcional)
        if (options.clickToDismiss) {
            toast.addEventListener('click', () => this.dismiss(toast));
        }

        return toast;
    }

    /**
     * Remove um toast
     */
    dismiss(toast) {
        if (!(toast instanceof HTMLElement)) return;

        toast.classList.add('removing');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }

            // Remover da lista
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300); // Tempo da animação de saída
    }

    /**
     * Remove todos os toasts
     */
    dismissAll() {
        this.toasts.forEach((toast) => this.dismiss(toast));
    }

    /**
     * Retorna o ícone para cada tipo
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
        };
        return icons[type] || icons.info;
    }

    /**
     * Atalhos para tipos específicos
     */
    success(message, duration = 3000, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 4000, options = {}) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration = 3500, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = 3000, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    /**
     * Toast com ação
     */
    showWithAction(message, type, actionText, actionCallback, duration = 5000) {
        const toast = this.createToast(message, type, { dismissible: true });

        // Adicionar botão de ação
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-action';
        actionBtn.textContent = actionText;
        actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            actionCallback();
            this.dismiss(toast);
        });

        toast.querySelector('.toast-content').appendChild(actionBtn);

        // Mostrar toast
        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        this.toasts.push(toast);
        return toast;
    }

    /**
     * Toast de carregamento com spinner
     */
    showLoading(message) {
        const toast = this.createToast(message, 'info', { dismissible: false });
        toast.classList.add('toast-loading');

        // Adicionar spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        toast.querySelector('.toast-icon').appendChild(spinner);

        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        this.toasts.push(toast);
        return toast;
    }

    /**
     * Toast de progresso
     */
    showProgress(message, progress = 0) {
        const toast = this.createToast(message, 'info', { dismissible: false });
        toast.classList.add('toast-progress');

        // Adicionar barra de progresso
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress-bar';
        progressBar.innerHTML = `<div class="toast-progress-fill" style="width: ${progress}%"></div>`;
        toast.querySelector('.toast-content').appendChild(progressBar);

        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        this.toasts.push(toast);

        // Retornar função para atualizar progresso
        return {
            toast,
            updateProgress: (newProgress) => {
                const fill = toast.querySelector('.toast-progress-fill');
                if (fill) {
                    fill.style.width = `${newProgress}%`;
                }
            },
            complete: (completeMessage) => {
                toast.classList.remove('toast-progress');
                toast.classList.add('toast-success');
                toast.querySelector('.toast-icon').textContent = '✅';
                if (completeMessage) {
                    toast.querySelector('.toast-message').textContent =
                        completeMessage;
                }
                setTimeout(() => this.dismiss(toast), 2000);
            },
            error: (errorMessage) => {
                toast.classList.remove('toast-progress');
                toast.classList.add('toast-error');
                toast.querySelector('.toast-icon').textContent = '❌';
                if (errorMessage) {
                    toast.querySelector('.toast-message').textContent =
                        errorMessage;
                }
                setTimeout(() => this.dismiss(toast), 3000);
            },
        };
    }
}

// Criar instância global
if (typeof window !== 'undefined') {
    window.toastManager = new ToastManager();
}

// Estilos CSS para os toasts
const toastStyles = `
/* Container de toasts */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

/* Toast base */
.toast {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 500px;
    padding: 16px;
    background: var(--panel-bg, #1e1e1e);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast.removing {
    opacity: 0;
    transform: translateX(400px);
}

/* Ícone do toast */
.toast-icon {
    font-size: 24px;
    line-height: 1;
    flex-shrink: 0;
}

/* Conteúdo */
.toast-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.toast-message {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color, #ffffff);
}

.toast-subtitle {
    font-size: 12px;
    color: var(--text-muted, rgba(255, 255, 255, 0.7));
}

/* Botão de fechar */
.toast-close {
    background: none;
    border: none;
    color: var(--text-muted, rgba(255, 255, 255, 0.7));
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    transition: color 0.2s;
}

.toast-close:hover {
    color: var(--text-color, #ffffff);
}

/* Tipos de toast */
.toast-success {
    border-left: 4px solid #4caf50;
}

.toast-error {
    border-left: 4px solid #f44336;
}

.toast-warning {
    border-left: 4px solid #ff9800;
}

.toast-info {
    border-left: 4px solid #2196f3;
}

/* Botão de ação */
.toast-action {
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: var(--text-color, #ffffff);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.toast-action:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* Toast de loading */
.toast-loading .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* Barra de progresso */
.toast-progress-bar {
    margin-top: 8px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.toast-progress-fill {
    height: 100%;
    background: var(--primary-color, #2196f3);
    transition: width 0.3s ease;
}

/* Responsivo */
@media (max-width: 640px) {
    .toast-container {
        top: auto;
        bottom: 20px;
        right: 20px;
        left: 20px;
    }

    .toast {
        min-width: auto;
        max-width: 100%;
    }

    .toast {
        transform: translateY(100px);
    }

    .toast.show {
        transform: translateY(0);
    }

    .toast.removing {
        transform: translateY(100px);
    }
}
`;

// Injetar estilos no documento
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = toastStyles;
    document.head.appendChild(styleSheet);
}

export default ToastManager;
