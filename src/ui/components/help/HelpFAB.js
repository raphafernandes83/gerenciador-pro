/**
 * 🎛️ BOTÃO FAB DE AJUDA
 * Botão flutuante com menu de opções de ajuda
 * 
 * @class HelpFAB
 * @version 1.0.0
 */

class HelpFAB {
    constructor() {
        this.fabElement = null;
        this.menuElement = null;
        this.quickTipsElement = null;
        this.isMenuOpen = false;
        this.boundHandlers = {
            fabClick: this.toggleMenu.bind(this),
            documentClick: this.handleDocumentClick.bind(this)
        };
    }

    /**
     * Inicializar botão FAB
     */
    init() {
        this.createFABButton();
        this.createMenu();
        this.createQuickTipsTooltip();

        // Event listeners
        this.fabElement.addEventListener('click', this.boundHandlers.fabClick);
        document.addEventListener('click', this.boundHandlers.documentClick);

        console.log('✅ HelpFAB inicializado');
    }

    /**
     * Criar botão FAB
     */
    createFABButton() {
        this.fabElement = document.createElement('button');
        this.fabElement.className = 'help-fab';
        this.fabElement.setAttribute('aria-label', 'Ajuda');
        this.fabElement.setAttribute('title', 'Central de Ajuda');
        this.fabElement.innerHTML = '<span class="fab-icon">?</span>';

        document.body.appendChild(this.fabElement);
    }

    /**
     * Criar menu de opções
     */
    createMenu() {
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'help-menu';
        this.menuElement.setAttribute('role', 'menu');

        this.menuElement.innerHTML = `
            <button class="help-menu-item" data-action="glossary" role="menuitem">
                <span class="menu-item-icon">📚</span>
                <span class="menu-item-label">Glossário Completo</span>
            </button>
            
            <button class="help-menu-item" data-action="quick-tips" role="menuitem">
                <span class="menu-item-icon">💡</span>
                <span class="menu-item-label">Dicas Rápidas</span>
            </button>
            
            <div class="help-menu-separator"></div>
            
            <button class="help-menu-item" data-action="tutorial" role="menuitem">
                <span class="menu-item-icon">🎓</span>
                <span class="menu-item-label">Tutorial</span>
                <span class="menu-item-badge">Em breve</span>
            </button>
            
            <button class="help-menu-item" data-action="support" role="menuitem">
                <span class="menu-item-icon">📞</span>
                <span class="menu-item-label">Suporte</span>
            </button>
        `;

        document.body.appendChild(this.menuElement);

        // Event listeners nos items do menu
        this.menuElement.querySelectorAll('.help-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleMenuAction(action);
            });
        });
    }

    /**
     * Criar tooltip de dicas rápidas
     */
    createQuickTipsTooltip() {
        this.quickTipsElement = document.createElement('div');
        this.quickTipsElement.className = 'quick-tips-tooltip';

        this.quickTipsElement.innerHTML = `
            <h4>💡 Dicas Rápidas para Traders</h4>
            <ul>
                <li><strong>Win Rate:</strong> 55%+ é ideal com payout 85-90%</li>
                <li><strong>Payoff Ratio:</strong> Acima de 1.0 compensa baixa assertividade</li>
                <li><strong>Expectativa:</strong> Deve ser sempre positiva (> R$ 0)</li>
                <li><strong>Drawdown:</strong> Mantenha abaixo de 20% do capital</li>
                <li><strong>Consistência:</strong> Opere regularmente (10+ sessões)</li>
                <li><strong>Gestão de Risco:</strong> Nunca arrisque mais de 2-5% por operação</li>
            </ul>
        `;

        document.body.appendChild(this.quickTipsElement);
    }

    /**
     * Abrir/fechar menu
     */
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        if (this.isMenuOpen) {
            this.menuElement.classList.add('visible', 'entering');
            setTimeout(() => this.menuElement.classList.remove('entering'), 300);

            // Esconder quick tips se estiver aberto
            this.quickTipsElement.classList.remove('visible');
        } else {
            this.menuElement.classList.remove('visible');
        }
    }

    /**
     * Processar ações do menu
     * @param {string} action - Ação escolhida
     */
    handleMenuAction(action) {
        console.log(`📍 Ação do menu: ${action}`);

        switch (action) {
            case 'glossary':
                this.openGlossary();
                break;

            case 'quick-tips':
                this.showQuickTips();
                break;

            case 'tutorial':
                this.showComingSoon('Tutorial');
                break;

            case 'support':
                this.openSupport();
                break;

            default:
                console.warn(`Ação desconhecida: ${action}`);
        }

        // Fechar menu
        this.menuElement.classList.remove('visible');
        this.isMenuOpen = false;
    }

    /**
     * Abrir glossário completo
     */
    openGlossary() {
        // Abrir glossário markdown em nova aba
        const artifactsPath = 'file:///C:/Users/Computador/.gemini/antigravity/brain/22c3f92e-82ae-4f35-b184-dbf1f132ba9f/GLOSSARIO_METRICAS_TRADING.md';

        try {
            window.open(artifactsPath, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Erro ao abrir glossário:', error);
            alert('📚 O glossário completo está disponível nos arquivos do projeto em:\n\nGLOSSARIO_METRICAS_TRADING.md');
        }
    }

    /**
     * Mostrar dicas rápidas
     */
    showQuickTips() {
        const isVisible = this.quickTipsElement.classList.contains('visible');

        if (isVisible) {
            this.quickTipsElement.classList.remove('visible');
        } else {
            this.quickTipsElement.classList.add('visible');

            // Auto-esconder após 10 segundos
            setTimeout(() => {
                this.quickTipsElement.classList.remove('visible');
            }, 10000);
        }
    }

    /**
     * Mostrar mensagem "Em breve"
     * @param {string} feature - Nome da feature
     */
    showComingSoon(feature) {
        if (window.ui && window.ui.showNotification) {
            window.ui.showNotification('info', `${feature} estará disponível em breve! 🚀`);
        } else {
            alert(`🎓 ${feature} estará disponível em breve!`);
        }
    }

    /**
     * Abrir suporte
     */
    openSupport() {
        const supportMessage = `
📞 Suporte Técnico

Como podemos ajudar?

• Email: suporte@gerenciadorpro.com
• WhatsApp: (11) 99999-9999
• Discord: discord.gg/gerenciadorpro

Horário: Segunda a Sexta, 9h às 18h
        `.trim();

        if (window.ui && window.ui.showModal) {
            window.ui.showModal({
                title: '📞 Suporte',
                message: supportMessage
            });
        } else {
            alert(supportMessage);
        }
    }

    /**
     * Handler de cliques no document (fechar menu ao clicar fora)
     * @param {Event} e - Evento de click
     */
    handleDocumentClick(e) {
        if (this.isMenuOpen) {
            const clickedFAB = this.fabElement.contains(e.target);
            const clickedMenu = this.menuElement.contains(e.target);

            if (!clickedFAB && !clickedMenu) {
                this.menuElement.classList.remove('visible');
                this.isMenuOpen = false;
            }
        }

        // Fechar quick tips ao clicar fora
        if (this.quickTipsElement.classList.contains('visible')) {
            const clickedTips = this.quickTipsElement.contains(e.target);
            if (!clickedTips) {
                this.quickTipsElement.classList.remove('visible');
            }
        }
    }

    /**
     * Ativar animação de pulso (para chamar atenção)
     */
    pulse() {
        this.fabElement.classList.add('pulse');

        setTimeout(() => {
            this.fabElement.classList.remove('pulse');
        }, 3000);
    }

    /**
     * Destruir FAB (cleanup)
     */
    destroy() {
        this.fabElement?.removeEventListener('click', this.boundHandlers.fabClick);
        document.removeEventListener('click', this.boundHandlers.documentClick);

        this.fabElement?.remove();
        this.menuElement?.remove();
        this.quickTipsElement?.remove();

        this.fabElement = null;
        this.menuElement = null;
        this.quickTipsElement = null;
        this.isMenuOpen = false;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.HelpFAB = HelpFAB;
}
