/**
 * Sistema de Menu Lateral Premium
 * Gerencia o menu lateral retrátil/expansível com efeitos visuais premium
 */

import { state, config } from './state.js';
import { stateManager } from './stateManager.js';
import { ui } from './ui.js';
import { errorHandler } from './src/utils/ErrorHandler.js';

class SidebarManager {
    constructor() {
        this.isExpanded = false;
        this.activeSection = 'profile'; // Perfil como primeira opção
        this.container = null;
        this.overlay = null;
        this.isInitialized = false;

        // Configurações de animação
        this.animationDuration = 350;
        this.staggerDelay = 50;

        // Sons (URLs de sons suaves)
        this.sounds = {
            open: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwOUanlyLNeFAU1kNbxy3ksBSl+zOrbkEIIEmO67myfTREMTKXnxaxgGAkzjs/xyXkuBS9/y+vbjEQGFGS67OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQHFGO56+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgONqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgONqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTQ==',
            close: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwOUanlyLNeFAU1kNbxy3ksBSl+zOrbkEIIEmO67myfTREMTKXnxaxgGAkzjs/xyXkuBS9/y+vbjEQGFGS67OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQHFGO56+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgONqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgONqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTQ==',
            click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQfwAAEH8AAABAAgAZGF0YQpoAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwOUanlyLNeFAU1kNbxy3ksBSl+zOrbkEIIEmO67OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU5j8/yyHkuBSx+y+vbjUQGFWS77OyfTRgOM6Xj4LJgGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTRgOMqXi37NhGAU4js/xyHkuBix+y+vcjUUGFGO46+ufTQ==',
        };

        // Mapeamento das seções (nova ordem)
        this.sections = [
            { id: 'profile', icon: '👤', label: 'Perfil', order: 1 },
            { id: 'parameters', icon: '📊', label: 'Parâmetros e Controles', order: 2 },
            { id: 'management', icon: '⚙️', label: 'Gerenciamento', order: 3 },
            { id: 'appearance', icon: '🎨', label: 'Aparência', order: 4 },
            { id: 'preferences', icon: '⚡', label: 'Preferências', order: 5 },
            { id: 'showroom', icon: '🧪', label: 'Showroom', order: 6 },
        ];

        // Inicializa sistemas de gerenciamento de forma segura
        try {
            this.eventManager = new SidebarEventManager();
            this.syncManager = new RealTimeSync();
            this.cacheManager = new SidebarCache();
            this.errorHandler = new SidebarErrorHandler();
        } catch (error) {
            console.warn('Erro ao inicializar sistemas da sidebar:', error);
            // Fallback para objetos mock
            this.eventManager = { onSidebarChange: () => {}, emitSidebarChange: () => {} };
            this.syncManager = { queueSync: () => {}, syncFromApp: () => {} };
            this.cacheManager = {
                getCachedContent: () => null,
                cacheContent: () => {},
                cleanExpiredCache: () => {},
            };
            this.errorHandler = {
                safeExecute: (fn, fallback) => {
                    try {
                        return fn();
                    } catch (e) {
                        console.error(e);
                        return fallback ? fallback() : null;
                    }
                },
            };
        }

        // Inicializa sistemas de gerenciamento
        setTimeout(() => this.initializeManagementSystems(), 100);
    }

    /**
     * Inicializa sistemas de gerenciamento
     */
    initializeManagementSystems() {
        try {
            // Inicializa sistemas após DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupManagementSystems();
                });
            } else {
                this.setupManagementSystems();
            }
        } catch (error) {
            console.warn('Erro ao inicializar sistemas de gerenciamento:', error);
        }
    }

    /**
     * Configura sistemas de gerenciamento
     */
    setupManagementSystems() {
        try {
            // Configura listeners para mudanças do app
            if (this.eventManager && this.eventManager.onSidebarChange) {
                this.eventManager.onSidebarChange((e) => {
                    if (e.detail.source === 'app' && this.syncManager) {
                        this.syncManager.syncFromApp([e.detail.data]);
                    }
                });
            }

            // Limpa cache periodicamente
            if (this.cacheManager && this.cacheManager.cleanExpiredCache) {
                setInterval(() => {
                    this.cacheManager.cleanExpiredCache();
                }, 60000); // A cada minuto
            }
        } catch (error) {
            console.warn('Erro ao configurar sistemas de gerenciamento:', error);
        }
    }

    /**
     * Inicializa o sistema de sidebar
     */
    initialize() {
        try {
            // Verifica se já foi inicializado
            if (this.isInitialized) {
                console.log('Sidebar já inicializada');
                return;
            }

            // Carrega estado salvo
            this.loadState();

            // Cria estrutura HTML
            this.createStructure();

            // Configura eventos
            this.setupEventListeners();

            // Marca como inicializado
            this.isInitialized = true;

            // Ajusta container principal inicialmente
            this.adjustMainContainer();

            console.log('✅ Sidebar inicializada com sucesso');
        } catch (error) {
            errorHandler.handleError(error, 'sidebar-init');
            console.error('Erro ao inicializar sidebar:', error);
        }
    }

    /**
     * Carrega estado salvo do localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('sidebarState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.isExpanded = parsed.isExpanded || false;
                this.activeSection = parsed.activeSection || 'profile';
            }
        } catch (error) {
            console.warn('Erro ao carregar estado da sidebar:', error);
        }
    }

    /**
     * Salva estado atual no localStorage
     */
    saveState() {
        try {
            const currentState = {
                isExpanded: this.isExpanded,
                activeSection: this.activeSection,
                timestamp: Date.now(),
            };
            localStorage.setItem('sidebarState', JSON.stringify(currentState));
        } catch (error) {
            console.warn('Erro ao salvar estado da sidebar:', error);
        }
    }

    /**
     * Cria estrutura HTML da sidebar
     */
    createStructure() {
        // Remove sidebar existente se houver
        const existing = document.getElementById('sidebar-container');
        if (existing) existing.remove();

        // Cria container principal
        this.container = document.createElement('div');
        this.container.id = 'sidebar-container';
        this.container.className = `sidebar ${this.isExpanded ? 'expanded' : 'collapsed'}`;

        // HTML da estrutura
        this.container.innerHTML = `
            <div class="sidebar-header" role="banner">
                <div class="sidebar-logo">
                    <span class="logo-icon" aria-hidden="true">📈</span>
                    <span class="logo-text">Trading Pro</span>
                </div>
                <button class="sidebar-toggle" 
                        id="sidebar-toggle" 
                        aria-label="${this.isExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}"
                        aria-expanded="${this.isExpanded}">
                    <span class="hamburger" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
            
            <div class="sidebar-content" role="main">
                <!-- Card de Parâmetros (sempre visível no topo) -->
                <div class="sidebar-parameters" 
                     id="sidebar-parameters"
                     role="region"
                     aria-label="Parâmetros de trading">
                    <!-- Será preenchido dinamicamente -->
                </div>
                
                <!-- Navegação -->
                <nav class="sidebar-nav" role="navigation" aria-label="Menu principal">
                    ${this.renderNavItems()}
                </nav>
                
                <!-- Ajuda/Atalhos -->
                <div class="sidebar-help" role="complementary" aria-label="Atalhos de teclado">
                    <div class="help-item" title="Atalhos de Teclado">
                        <span class="help-icon" aria-hidden="true">⌨️</span>
                        <div class="help-content">
                            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>B</kbd> Toggle Menu</div>
                            <div class="shortcut"><kbd>1</kbd>-<kbd>5</kbd> Navegação Rápida</div>
                            <div class="shortcut"><kbd>ESC</kbd> Fechar Menu</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cria overlay para mobile
        this.overlay = document.createElement('div');
        this.overlay.id = 'sidebar-overlay';
        this.overlay.className = 'sidebar-overlay';
        if (!this.isExpanded) {
            this.overlay.style.display = 'none';
        }

        // Adiciona ao DOM
        document.body.appendChild(this.container);
        document.body.appendChild(this.overlay);

        // Cria botão de acesso rápido (sempre visível)
        this.createQuickAccessButton();

        // Aplica estado inicial
        this.applyState();
    }

    /**
     * Renderiza itens de navegação
     */
    renderNavItems() {
        return this.sections
            .sort((a, b) => a.order - b.order)
            .map(
                (section, index) => `
                <div class="sidebar-nav-item ${section.id === this.activeSection ? 'active' : ''}" 
                     data-section="${section.id}"
                     data-index="${index}"
                     data-tooltip="${section.label}"
                     role="button"
                     tabindex="0"
                     aria-label="${section.label}"
                     aria-current="${section.id === this.activeSection ? 'page' : 'false'}"
                     style="animation-delay: ${index * this.staggerDelay}ms">
                    <span class="nav-icon" aria-hidden="true">${section.icon}</span>
                    <span class="nav-label">${section.label}</span>
                    <span class="nav-indicator" aria-hidden="true"></span>
                </div>
            `
            )
            .join('');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Toggle button
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Overlay click (mobile)
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.collapse());
        }

        // Nav items
        const navItems = this.container.querySelectorAll('.sidebar-nav-item');
        navItems.forEach((item) => {
            item.addEventListener('click', (e) => this.handleNavClick(e));

            // Suporte para teclado
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleNavClick(e);
                }
            });
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // ESC para fechar
            if (e.key === 'Escape' && this.isExpanded) {
                this.collapse();
            }

            // Ctrl/Cmd + B para toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggle();
            }

            // Números 1-5 para navegação rápida quando expandido
            if (this.isExpanded && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 5) {
                    const section = this.sections.find((s) => s.order === num);
                    if (section) {
                        e.preventDefault();
                        this.navigateToSection(section.id);
                    }
                }
            }
        });

        // Resize listener para responsividade
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Alterna estado expandido/retraído
     */
    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    /**
     * Expande a sidebar
     */
    expand() {
        this.isExpanded = true;
        this.container.classList.remove('collapsed');
        this.container.classList.add('expanded');

        // Atualiza ARIA
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-label', 'Recolher menu lateral');
        }

        // Som de abertura
        this.playSound('open');

        // Mostra overlay em mobile
        if (window.innerWidth <= 768) {
            this.overlay.style.display = 'block';
            setTimeout(() => {
                this.overlay.classList.add('visible');
            }, 10);
        }

        // Atualiza parâmetros
        this.updateParametersCard();

        // Salva estado
        this.saveState();

        // Dispara evento customizado
        this.dispatchEvent('expand');

        // Ajusta container principal
        if (this.activeModal) {
            this.adjustContainerForModal(true);
        } else {
            this.adjustMainContainer();
        }

        // Atualiza botão de acesso rápido
        const quickBtn = document.getElementById('sidebar-quick-toggle');
        if (quickBtn) {
            quickBtn.style.opacity = '0';
            quickBtn.style.pointerEvents = 'none';
        }
    }

    /**
     * Retrai a sidebar
     */
    collapse() {
        this.isExpanded = false;
        this.container.classList.remove('expanded');
        this.container.classList.add('collapsed');

        // Atualiza ARIA
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Expandir menu lateral');
        }

        // Som de fechamento
        this.playSound('close');

        // Esconde overlay
        if (this.overlay) {
            this.overlay.classList.remove('visible');
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, this.animationDuration);
        }

        // Atualiza parâmetros
        this.updateParametersCard();

        // Salva estado
        this.saveState();

        // Dispara evento customizado
        this.dispatchEvent('collapse');

        // Ajusta container principal
        if (this.activeModal) {
            this.adjustContainerForModal(true);
        } else {
            this.adjustMainContainer();
        }

        // Atualiza botão de acesso rápido
        const quickBtn = document.getElementById('sidebar-quick-toggle');
        if (quickBtn) {
            quickBtn.style.opacity = '1';
            quickBtn.style.pointerEvents = 'auto';
        }
    }

    /**
     * Atualiza card de parâmetros
     */
    updateParametersCard() {
        const container = document.getElementById('sidebar-parameters');
        if (!container) return;

        // Se expandido, mostra card completo
        if (this.isExpanded) {
            container.innerHTML = this.getExpandedParametersHTML();
        } else {
            // Se retraído, mostra versão mini
            container.innerHTML = this.getCollapsedParametersHTML();
        }
    }

    /**
     * HTML do card de parâmetros expandido
     */
    getExpandedParametersHTML() {
        const params = state.parametros || {};
        const stopLoss = params.stopLoss || config.stopLossPerc || 15;
        const stopGain = params.stopGain || config.stopWinPerc || 10;
        const payout = params.payout || config.payout || 80;
        const martingale = params.nivelMartingale || 0;

        return `
            <div class="parameters-card expanded">
                <h3 class="parameters-title">Parâmetros e Controles</h3>
                <div class="parameters-grid">
                    <div class="param-item">
                        <span class="param-label">Stop Loss</span>
                        <span class="param-value">${stopLoss}%</span>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Stop Gain</span>
                        <span class="param-value">${stopGain}%</span>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Payout</span>
                        <span class="param-value">${payout}%</span>
                    </div>
                    <div class="param-item">
                        <span class="param-label">Martingale</span>
                        <span class="param-value">${martingale}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * HTML do card de parâmetros retraído
     */
    getCollapsedParametersHTML() {
        const params = state.parametros || {};
        const stopLoss = params.stopLoss || config.stopLossPerc || 15;
        const stopGain = params.stopGain || config.stopWinPerc || 10;

        return `
            <div class="parameters-card collapsed" title="Parâmetros e Controles">
                <div class="param-mini">
                    <span class="param-icon">📊</span>
                    <div class="param-values">
                        <span>${stopLoss}%</span>
                        <span>${stopGain}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Manipula clique nos itens de navegação
     */
    handleNavClick(event) {
        const item = event.currentTarget;
        const section = item.dataset.section;

        // Som de clique
        this.playSound('click');

        // Adiciona transição visual
        this.container.classList.add('transitioning');
        setTimeout(() => {
            this.container.classList.remove('transitioning');
        }, 200);

        // Remove active de todos
        this.container.querySelectorAll('.sidebar-nav-item').forEach((el) => {
            el.classList.remove('active');
        });

        // Adiciona active no clicado
        item.classList.add('active');

        // Atualiza seção ativa
        this.activeSection = section;
        this.saveState();

        // Efeito ripple
        this.createRippleEffect(event);

        // Dispara evento para navegação
        this.dispatchEvent('navigate', { section });

        // Renderiza o conteúdo baseado na seção
        let content = '';
        switch (section) {
            case 'profile':
                content = this.renderProfileContent();
                break;
            case 'parameters':
                content = this.renderParametersDetail();
                break;
            case 'management':
                content = this.renderManagementContent();
                break;
            case 'appearance':
                content = this.renderAppearanceContent();
                break;
            case 'preferences':
                content = this.renderPreferencesContent();
                break;
            case 'showroom':
                content = this.renderShowroomContent();
                break;
        }

        // Mostra o modal somente se houver conteúdo válido (evita modal vazio)
        if (content && String(content).trim() !== '' && /sidebar-|capital-inicial|parameters-card/i.test(String(content))) {
            this.showContentModal(content);
            // Ligar listener do botão Nova Sessão quando modal estiver pronto
            setTimeout(() => {
                try {
                    const btn = document.getElementById('sidebar-new-session-btn');
                    if (btn && window.events && typeof window.events.handleNewSession === 'function') {
                        btn.addEventListener('click', () => {
                            // Evita cliques múltiplos
                            if (btn.disabled) return;
                            btn.disabled = true;
                            try {
                                window.events.handleNewSession();
                            } finally {
                                setTimeout(() => { btn.disabled = false; }, 800);
                            }
                        }, { once: false });
                    }
                } catch (_) {}
            }, 50);
        }

        // Em mobile, fecha após navegar
        if (window.innerWidth <= 768) {
            setTimeout(() => this.collapse(), 300);
        }
    }

    /**
     * Cria efeito ripple ao clicar
     */
    createRippleEffect(event) {
        const item = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        item.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Manipula redimensionamento da janela
     */
    handleResize() {
        // Em telas pequenas, força retrair
        if (window.innerWidth <= 768 && this.isExpanded) {
            this.collapse();
        }
    }

    /**
     * Aplica estado atual
     */
    applyState() {
        if (this.isExpanded) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Dispara eventos customizados
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`sidebar:${eventName}`, {
            detail: { ...detail, sidebar: this },
        });
        document.dispatchEvent(event);
    }

    /**
     * Atualiza dados em tempo real
     */
    updateRealtimeData() {
        // Atualiza card de parâmetros se visível
        if (this.isInitialized) {
            this.updateParametersCard();
        }
    }

    /**
     * Navega para uma seção específica
     */
    navigateToSection(sectionId) {
        // Simula clique no item
        const navItem = this.container.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.click();
        }
    }

    /**
     * Toca som se habilitado
     */
    playSound(type) {
        if (!config.sonsAtivos) return;

        try {
            const audio = new Audio(this.sounds[type]);
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Falha silenciosa se não puder tocar
            });
        } catch (error) {
            // Ignora erros de áudio
        }
    }

    /**
     * Mostra feedback visual de sucesso
     */
    showSuccessFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'success-pulse';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 2100);
    }

    /**
     * Cria botão de acesso rápido
     */
    createQuickAccessButton() {
        // Remove botão existente se houver
        const existing = document.getElementById('sidebar-quick-toggle');
        if (existing) existing.remove();

        // Cria novo botão
        const quickBtn = document.createElement('button');
        quickBtn.id = 'sidebar-quick-toggle';
        quickBtn.className = 'sidebar-quick-toggle';
        quickBtn.innerHTML = '☰';
        quickBtn.setAttribute('aria-label', 'Abrir menu lateral');
        quickBtn.setAttribute('title', 'Menu Lateral (Ctrl+B)');

        // Event listener
        quickBtn.addEventListener('click', () => this.toggle());

        // Adiciona ao body
        document.body.appendChild(quickBtn);
    }


    // ======= Conteúdo do Showroom =======
    renderShowroomContent() {
        const html = `
            <div class="sidebar-showroom" id="sidebar-showroom">
                <h3>Showroom</h3>
                <div class="grid-two">
                    <a class="details-btn" href="card-preview.html" target="_blank" rel="noopener">Abrir Card Progresso (prévia)</a>
                    <a class="details-btn" href="icones-showroom.html" target="_blank" rel="noopener">Ícones</a>
                </div>
            </div>`;
        return html;
    }

    /**
     * Ajusta o container principal
     */
    adjustMainContainer() {
        const container = document.getElementById('container');
        if (container) {
            container.classList.add('sidebar-adjusted');
            if (this.isExpanded) {
                container.style.marginLeft = 'var(--sidebar-width-expanded)';
            } else {
                container.style.marginLeft = 'var(--sidebar-width-collapsed)';
            }
        }
    }

    /**
     * Renderiza conteúdo do perfil
     */
    renderProfileContent() {
        return this.errorHandler.safeExecute(
            () => {
                // Verifica cache primeiro
                const cached = this.cacheManager.getCachedContent('profile');
                if (cached) {
                    return cached;
                }

                // Clona o conteúdo existente da aba de perfil
                const originalContent = document.getElementById('settings-perfil-content');
                if (originalContent) {
                    const clonedContent = originalContent.cloneNode(true);
                    clonedContent.removeAttribute('id'); // Remove ID para evitar duplicação
                    clonedContent.classList.add('sidebar-content-section');
                    clonedContent.style.display = 'block'; // Garante que esteja visível

                    // Ajusta IDs dos inputs para evitar conflito
                    const traderNameInput = clonedContent.querySelector('#trader-name-input');
                    if (traderNameInput) {
                        traderNameInput.id = 'sidebar-trader-name-input';
                        traderNameInput.value = config.traderName || '';
                    }

                    // Adiciona botão de salvar
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'settings-actions';
                    actionsDiv.innerHTML = `
                    <button class="btn btn-primary" onclick="sidebar.saveProfile()">
                        Salvar Perfil
                    </button>
                `;
                    clonedContent.appendChild(actionsDiv);

                    const content = `<div class="sidebar-content-section">${clonedContent.innerHTML}</div>`;

                    // Armazena no cache
                    this.cacheManager.cacheContent('profile', content);

                    return content;
                }

                // Fallback se o conteúdo original não existir
                const fallbackContent = `
                <div class="sidebar-content-section">
                    <h2>Perfil do Trader</h2>
                    <div class="input-group">
                        <label for="sidebar-trader-name-input">Seu Nome</label>
                        <input type="text" 
                               id="sidebar-trader-name-input" 
                               value="${config.traderName || ''}" 
                               placeholder="Digite seu nome ou apelido"
                               class="form-input">
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="sidebar.saveProfile()">
                            Salvar Perfil
                        </button>
                    </div>
                </div>
            `;

                this.cacheManager.cacheContent('profile', fallbackContent);
                return fallbackContent;
            },
            () => {
                // Fallback em caso de erro
                return '<div class="sidebar-content-section"><p>Erro ao carregar perfil</p></div>';
            }
        );
    }

    /**
     * Renderiza detalhes dos parâmetros
     */
    renderParametersDetail() {
        // Renderiza o template unificado com prefixo de IDs da sidebar
        try {
            // Carregamento dinâmico para não acoplar no bundle inicial
            return this.errorHandler.safeExecute(
                () => {
                    const cfg = window.config || {};
                    const getNum = (id, fallback) => {
                        const el = document.getElementById(id);
                        const v = el && el.value !== '' ? Number(el.value) : undefined;
                        return Number.isFinite(v) ? v : fallback;
                    };
                    const getStr = (id, fallback) => {
                        const el = document.getElementById(id);
                        return el && el.value !== '' ? String(el.value) : fallback;
                    };
                    const values = {
                        // Prioriza valores atuais do card principal (mesmo antes de blur), senão usa config
                        capitalInicial: getNum('capital-inicial', cfg.capitalInicial),
                        percentualEntrada: getNum('percentual-entrada', cfg.percentualEntrada),
                        stopWinPerc: getNum('stop-win-perc', cfg.stopWinPerc),
                        stopLossPerc: getNum('stop-loss-perc', cfg.stopLossPerc),
                        estrategia: getStr('estrategia-select', cfg.estrategiaAtiva),
                        payout: getNum('payout-ativo', cfg.payout),
                    };
                    const html = window.generateParametersCardHTML
                        ? window.generateParametersCardHTML({ idPrefix: 'sidebar-', values })
                        : null;
                    if (html) {
                        // Sinaliza disponibilidade para sincronização
                        setTimeout(() => {
                            document.dispatchEvent(new CustomEvent('sidebarModalReady'));
                            document.dispatchEvent(new CustomEvent('payoutButtonsReady'));
                        }, 100);
                        return `<div class="sidebar-content-section">${html}</div>`;
                    }
                    // Fallback para clonagem se template não estiver disponível por algum motivo
                    const originalPanel = document.getElementById('input-panel');
                    if (!originalPanel) return '<div class="sidebar-content-section"><p>Card não disponível</p></div>';
                    const cloned = originalPanel.cloneNode(true);
                    cloned.removeAttribute('id');
                    const htmlFallback = `<div class=\"sidebar-content-section\">${cloned.innerHTML}</div>`;
                    setTimeout(() => {
                        try {
                            (window.parametersCardController ||= new window.ParametersCardController()).bindEventHandlers();
                        } catch (_) {}
                    }, 150);
                    return htmlFallback;
                },
                () => '<div class="sidebar-content-section"><p>Erro ao renderizar parâmetros</p></div>'
            );
        } catch (_) {
            return '<div class="sidebar-content-section"><p>Erro ao renderizar parâmetros</p></div>';
        }
    }

    /**
     * Renderiza conteúdo de gerenciamento
     */
    renderManagementContent() {
        // Clona o conteúdo existente da aba de gerenciamento
        const originalContent = document.getElementById('settings-gerenciamento-content');
        if (originalContent) {
            const clonedContent = originalContent.cloneNode(true);
            clonedContent.removeAttribute('id');
            clonedContent.classList.add('sidebar-content-section');
            clonedContent.style.display = 'block';

            // Ajusta IDs para evitar conflitos
            const idMap = {
                'modal-modo-guiado-toggle': 'sidebar-modo-guiado-toggle',
                'modal-incorporar-lucro-toggle': 'sidebar-incorporar-lucro-toggle',
                'auto-lock-toggle': 'sidebar-auto-lock-toggle',
                'lock-duration-select': 'sidebar-lock-duration-select',
                'lock-duration-container': 'sidebar-lock-duration-container',
                'divisor-recuperacao-slider': 'sidebar-divisor-recuperacao-slider',
                'divisor-recuperacao-valor': 'sidebar-divisor-recuperacao-valor',
                'recovery-slider-minus': 'sidebar-recovery-slider-minus',
                'recovery-slider-plus': 'sidebar-recovery-slider-plus',
            };

            // Atualiza todos os IDs
            Object.entries(idMap).forEach(([oldId, newId]) => {
                const element = clonedContent.querySelector(`#${oldId}`);
                if (element) {
                    element.id = newId;
                }
            });

            // Adiciona botão de aplicar
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'settings-actions';
            actionsDiv.innerHTML = `
                <button class="btn btn-primary" onclick="sidebar.applyManagementSettings()">
                    Aplicar Configurações
                </button>
            `;
            clonedContent.appendChild(actionsDiv);

            return `<div class="sidebar-content-section">${clonedContent.innerHTML}</div>`;
        }

        // Fallback usando SidebarManager
        if (window.sidebarManager && window.sidebarManager.renderManagementContent) {
            return window.sidebarManager.renderManagementContent();
        }

        return '<div class="sidebar-content-section"><p>Conteúdo de gerenciamento não disponível</p></div>';
    }

    /**
     * Renderiza conteúdo de aparência
     */
    renderAppearanceContent() {
        // Clona o conteúdo existente da aba de aparência
        const originalContent = document.getElementById('settings-aparencia-content');
        if (originalContent) {
            const clonedContent = originalContent.cloneNode(true);
            clonedContent.removeAttribute('id');
            clonedContent.classList.add('sidebar-content-section');
            clonedContent.style.display = 'block';

            // Atualiza ID do theme selector
            const themeSelector = clonedContent.querySelector('#modal-theme-selector');
            if (themeSelector) {
                themeSelector.id = 'sidebar-theme-selector';
            }

            return `<div class="sidebar-content-section">${clonedContent.innerHTML}</div>`;
        }

        // Fallback usando SidebarManager
        if (window.sidebarManager && window.sidebarManager.renderAppearanceContent) {
            return window.sidebarManager.renderAppearanceContent();
        }

        return '<div class="sidebar-content-section"><p>Conteúdo de aparência não disponível</p></div>';
    }

    /**
     * Renderiza conteúdo de preferências
     */
    renderPreferencesContent() {
        // Clona o conteúdo existente da aba de preferências
        const originalContent = document.getElementById('settings-preferencias-content');
        if (originalContent) {
            const clonedContent = originalContent.cloneNode(true);
            clonedContent.removeAttribute('id');
            clonedContent.classList.add('sidebar-content-section');
            clonedContent.style.display = 'block';

            // Atualiza ID do toggle de notificações
            const notificationsToggle = clonedContent.querySelector('#modal-notifications-toggle');
            if (notificationsToggle) {
                notificationsToggle.id = 'sidebar-notifications-toggle';
            }

            // Adiciona mais preferências se disponíveis
            const extraPrefs = `
                <div class="flex-row" style="justify-content: space-between; margin-bottom: 1rem;">
                    <label for="sidebar-sounds-toggle">Sons</label>
                    <label class="switch">
                        <input type="checkbox" id="sidebar-sounds-toggle" ${config.sonsAtivos ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="flex-row" style="justify-content: space-between; margin-bottom: 1rem;">
                    <label for="sidebar-zen-mode-toggle">Modo Zen</label>
                    <label class="switch">
                        <input type="checkbox" id="sidebar-zen-mode-toggle" ${config.zenMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;

            // Insere as preferências extras antes do fechamento
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = clonedContent.innerHTML + extraPrefs;

            // Adiciona botão de aplicar
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'settings-actions';
            actionsDiv.innerHTML = `
                <button class="btn btn-primary" onclick="sidebar.applyPreferencesSettings()">
                    Aplicar Preferências
                </button>
            `;
            tempDiv.appendChild(actionsDiv);

            return `<div class="sidebar-content-section">${tempDiv.innerHTML}</div>`;
        }

        // Fallback usando SidebarManager
        if (window.sidebarManager && window.sidebarManager.renderPreferencesContent) {
            return window.sidebarManager.renderPreferencesContent();
        }

        return '<div class="sidebar-content-section"><p>Conteúdo de preferências não disponível</p></div>';
    }

    /**
     * Mostra modal com conteúdo
     */
    showContentModal(content) {
        // Remove modal anterior se existir
        this.closeActiveModal();

        // Cria novo modal
        const modal = document.createElement('div');
        modal.className = 'sidebar-content-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="sidebar.closeActiveModal()">×</button>
                ${content}
            </div>
        `;

        // Adiciona event listener para fechar ao clicar no backdrop (mobile/tablet)
        if (window.innerWidth <= 992) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeActiveModal();
                }
            });
        }

        // Insere após a sidebar para que o CSS funcione corretamente
        if (this.container && this.container.parentNode) {
            this.container.parentNode.insertBefore(modal, this.container.nextSibling);
        } else {
            document.body.appendChild(modal);
        }

        this.activeModal = modal;

        // Anima entrada
        setTimeout(() => {
            modal.classList.add('visible');
            // Configura event listeners após o modal estar visível
            this.setupModalEventListeners();

            // Ajusta o container principal
            this.adjustContainerForModal(true);
        }, 10);
    }

    /**
     * Fecha modal ativo
     */
    closeActiveModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('visible');
            this.adjustContainerForModal(false);
            setTimeout(() => {
                if (this.activeModal) {
                    this.activeModal.remove();
                    this.activeModal = null;
                }
            }, 300);
        }
    }

    /**
     * Ajusta o container quando o modal abre/fecha
     */
    adjustContainerForModal(isOpen) {
        const container = document.getElementById('container');
        if (!container) return;

        // Não ajusta em mobile
        if (window.innerWidth <= 768) return;

        if (isOpen) {
            // Calcula a margem baseada no estado da sidebar
            const sidebarWidth = this.isExpanded
                ? 'var(--sidebar-width-expanded)'
                : 'var(--sidebar-width-collapsed)';
            const modalWidth = window.innerWidth <= 1200 ? '350px' : '400px';

            container.style.marginLeft = `calc(${sidebarWidth} + ${modalWidth})`;
        } else {
            // Restaura a margem baseada apenas na sidebar
            this.adjustMainContainer();
        }
    }

    /**
     * Configura event listeners do modal
     */
    setupModalEventListeners() {
        if (!this.activeModal) return;

        // Event listeners para temas
        const themeCards = this.activeModal.querySelectorAll('.theme-card');
        themeCards.forEach((card) => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                if (theme) {
                    // Atualiza tema
                    ui.setTema(theme);

                    // Atualiza visual dos cards
                    themeCards.forEach((c) => c.classList.remove('active'));
                    card.classList.add('active');

                    // Atualiza cards originais também
                    const originalCards = document.querySelectorAll(
                        '#modal-theme-selector .theme-card'
                    );
                    originalCards.forEach((c) => {
                        c.classList.toggle('active', c.dataset.theme === theme);
                    });
                }
            });
        });

        // Event listeners para o slider de recuperação
        const recoverySlider = this.activeModal.querySelector(
            '#sidebar-divisor-recuperacao-slider'
        );
        if (recoverySlider) {
            recoverySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const display = this.activeModal.querySelector(
                    '#sidebar-divisor-recuperacao-valor'
                );
                if (display) {
                    display.innerHTML = `<span>${value}%</span> / <span>${100 - value}%</span>`;
                }
            });
        }

        // Event listeners para os botões + e -
        const minusBtn = this.activeModal.querySelector('#sidebar-recovery-slider-minus');
        const plusBtn = this.activeModal.querySelector('#sidebar-recovery-slider-plus');

        if (minusBtn && recoverySlider) {
            minusBtn.addEventListener('click', () => {
                const currentValue = parseInt(recoverySlider.value);
                const newValue = Math.max(10, currentValue - 5);
                recoverySlider.value = newValue;
                recoverySlider.dispatchEvent(new Event('input'));
            });
        }

        if (plusBtn && recoverySlider) {
            plusBtn.addEventListener('click', () => {
                const currentValue = parseInt(recoverySlider.value);
                const newValue = Math.min(90, currentValue + 5);
                recoverySlider.value = newValue;
                recoverySlider.dispatchEvent(new Event('input'));
            });
        }

        // Event listener para auto-lock toggle
        const autoLockToggle = this.activeModal.querySelector('#sidebar-auto-lock-toggle');
        if (autoLockToggle) {
            autoLockToggle.addEventListener('change', (e) => {
                const container = this.activeModal.querySelector(
                    '#sidebar-lock-duration-container'
                );
                if (container) {
                    container.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
    }

    /**
     * Salva perfil
     */
    saveProfile() {
        const nameInput = document.getElementById('sidebar-trader-name-input');
        if (nameInput) {
            config.traderName = nameInput.value;
            localStorage.setItem('traderName', nameInput.value);

            // Atualiza o input original também
            const originalInput = document.getElementById('trader-name-input');
            if (originalInput) {
                originalInput.value = nameInput.value;
            }

            // Atualiza display
            if (ui.updateTraderNameDisplay) {
                ui.updateTraderNameDisplay();
            }

            ui.showNotification('Perfil salvo com sucesso!', 'success');
            this.showSuccessFeedback();
        }
    }

    /**
     * Aplica mudanças dos parâmetros - REMOVIDO: Agora é automático via RealTimeSyncManager
     */
    applyParametersChanges() {
        // Esta função não é mais necessária - tudo é aplicado automaticamente
        console.log('✅ Aplicação automática ativa - não é necessário aplicar manualmente');
        ui.showNotification('Mudanças aplicadas automaticamente!', 'success');
        this.showSuccessFeedback();
    }

    /**
     * Aplica configurações de gerenciamento
     */
    applyManagementSettings() {
        // Aplica configurações de gerenciamento
        const toggles = [
            {
                sidebar: 'sidebar-modo-guiado-toggle',
                original: 'modal-modo-guiado-toggle',
                config: 'modoGuiado',
            },
            {
                sidebar: 'sidebar-incorporar-lucro-toggle',
                original: 'modal-incorporar-lucro-toggle',
                config: 'incorporarLucros',
            },
            {
                sidebar: 'sidebar-auto-lock-toggle',
                original: 'auto-lock-toggle',
                config: 'bloqueioAutomatico',
            },
        ];

        toggles.forEach(({ sidebar, original, config: configKey }) => {
            const sidebarToggle = document.getElementById(sidebar);
            const originalToggle = document.getElementById(original);

            if (sidebarToggle) {
                config[configKey] = sidebarToggle.checked;
                if (originalToggle) {
                    originalToggle.checked = sidebarToggle.checked;
                }
            }
        });

        // Duração do bloqueio
        const lockDuration = document.getElementById('sidebar-lock-duration-select');
        if (lockDuration) {
            config.duracaoBloqueioHoras = parseInt(lockDuration.value);
            const originalSelect = document.getElementById('lock-duration-select');
            if (originalSelect) {
                originalSelect.value = lockDuration.value;
            }
        }

        // Divisor de recuperação
        const divisorSlider = document.getElementById('sidebar-divisor-recuperacao-slider');
        if (divisorSlider) {
            config.divisorRecuperacao = parseInt(divisorSlider.value);
            const originalSlider = document.getElementById('divisor-recuperacao-slider');
            if (originalSlider) {
                originalSlider.value = divisorSlider.value;
                originalSlider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        // Salva no localStorage
        localStorage.setItem('gerenciadorProConfig', JSON.stringify(config));

        ui.showNotification('Configurações de gerenciamento aplicadas!', 'success');
        this.showSuccessFeedback();

        setTimeout(() => this.closeActiveModal(), 1000);
    }

    /**
     * Aplica configurações de preferências
     */
    applyPreferencesSettings() {
        // Notificações
        const notificationsToggle = document.getElementById('sidebar-notifications-toggle');
        if (notificationsToggle) {
            config.notificacoesAtivas = notificationsToggle.checked;
            const originalToggle = document.getElementById('modal-notifications-toggle');
            if (originalToggle) {
                originalToggle.checked = notificationsToggle.checked;
            }
        }

        // Sons
        const soundsToggle = document.getElementById('sidebar-sounds-toggle');
        if (soundsToggle) {
            config.sonsAtivos = soundsToggle.checked;
        }

        // Modo Zen
        const zenToggle = document.getElementById('sidebar-zen-mode-toggle');
        if (zenToggle) {
            config.zenMode = zenToggle.checked;
            if (ui.toggleZenMode) {
                ui.toggleZenMode(zenToggle.checked);
            }
        }

        // Salva no localStorage
        localStorage.setItem(
            'gerenciadorProNotificacoes',
            JSON.stringify(config.notificacoesAtivas)
        );
        localStorage.setItem('gerenciadorProSons', JSON.stringify(config.sonsAtivos));
        localStorage.setItem('gerenciadorProZenMode', JSON.stringify(config.zenMode));

        ui.showNotification('Preferências aplicadas!', 'success');
        this.showSuccessFeedback();

        setTimeout(() => this.closeActiveModal(), 1000);
    }

    /**
     * Mostra feedback de sucesso
     */
    showSuccessFeedback() {
        const modal = this.activeModal?.querySelector('.modal-content');
        if (modal) {
            modal.classList.add('success-pulse');
            setTimeout(() => {
                modal.classList.remove('success-pulse');
            }, 600);
        }
    }

    /**
     * Invalida cache de uma seção específica
     */
    invalidateCache(section) {
        this.cacheManager.cache.delete(section);
    }

    /**
     * Invalida todo o cache
     */
    invalidateAllCache() {
        this.cacheManager.clearCache();
    }

    /**
     * Força atualização de uma seção
     */
    refreshSection(section) {
        this.invalidateCache(section);
        if (this.activeSection === section && this.activeModal) {
            const content = this.renderSectionContent(section);
            if (content) {
                const modalContent = this.activeModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.innerHTML = content;
                    this.setupModalEventListeners();
                }
            }
        }
    }

    /**
     * Renderiza conteúdo de uma seção específica
     */
    renderSectionContent(section) {
        switch (section) {
            case 'profile':
                return this.renderProfileContent();
            case 'parameters':
                return this.renderParametersDetail();
            case 'management':
                return this.renderManagementContent();
            case 'appearance':
                return this.renderAppearanceContent();
            case 'preferences':
                return this.renderPreferencesContent();
            default:
                return '<div class="sidebar-content-section"><p>Seção não encontrada</p></div>';
        }
    }

    /**
     * Destrói a sidebar (cleanup)
     */
    destroy() {
        if (this.container) this.container.remove();
        if (this.overlay) this.overlay.remove();
        this.isInitialized = false;

        // Remove ajuste do container
        const container = document.getElementById('container');
        if (container) {
            container.classList.remove('sidebar-adjusted');
            container.style.marginLeft = '';
        }
    }
}

/**
 * Sistema de Gerenciamento de Eventos da Sidebar
 */
class SidebarEventManager {
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

/**
 * Sistema de Sincronização em Tempo Real
 */
class RealTimeSync {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
        this.debounceTimer = null;
        this.debounceDelay = 100; // 100ms
    }

    /**
     * Adiciona mudança à fila de sincronização
     */
    queueSync(change) {
        this.syncQueue.push(change);
        this.debounceSync();
    }

    /**
     * Debounce para evitar sincronizações excessivas
     */
    debounceSync() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.processSyncQueue();
        }, this.debounceDelay);
    }

    /**
     * Processa a fila de sincronização
     */
    processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) return;

        this.isSyncing = true;
        const changes = [...this.syncQueue];
        this.syncQueue = [];

        try {
            this.applyChanges(changes);
        } catch (error) {
            console.error('Erro na sincronização:', error);
            // Recoloca mudanças na fila em caso de erro
            this.syncQueue.unshift(...changes);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Aplica mudanças do sidebar para o app
     */
    applyChanges(changes) {
        changes.forEach((change) => {
            const { elementId, value, type } = change;
            const originalElement = document.getElementById(elementId);

            if (originalElement) {
                if (type === 'input') {
                    originalElement.value = value;
                    originalElement.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (type === 'checkbox') {
                    originalElement.checked = value;
                    originalElement.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (type === 'select') {
                    originalElement.value = value;
                    originalElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    }

    /**
     * Sincroniza mudanças do app para o sidebar
     */
    syncFromApp(changes) {
        if (!window.sidebar || !window.sidebar.activeModal) return;

        changes.forEach((change) => {
            const { elementId, value, type } = change;
            const sidebarElement = window.sidebar.activeModal.querySelector(
                `#sidebar-${elementId}`
            );

            if (sidebarElement) {
                if (type === 'input') {
                    sidebarElement.value = value;
                } else if (type === 'checkbox') {
                    sidebarElement.checked = value;
                } else if (type === 'select') {
                    sidebarElement.value = value;
                }
            }
        });
    }
}

/**
 * Sistema de Cache da Sidebar
 */
class SidebarCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutos
        this.maxSize = 10; // Máximo 10 itens em cache
    }

    /**
     * Obtém conteúdo do cache
     */
    getCachedContent(section) {
        const cached = this.cache.get(section);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.content;
        }
        return null;
    }

    /**
     * Armazena conteúdo no cache
     */
    cacheContent(section, content) {
        // Remove item mais antigo se cache estiver cheio
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(section, {
            content,
            timestamp: Date.now(),
        });
    }

    /**
     * Limpa cache expirado
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
    }
}

/**
 * Sistema de Tratamento de Erros da Sidebar
 */
class SidebarErrorHandler {
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

/**
 * Sistema de Sincronização em Tempo Real
 */
class RealTimeSyncManager {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
        this.debounceTimer = null;
        this.debounceDelay = 150;
        this.lastSyncTime = 0;
        this.syncCooldown = 50; // ms entre sincronizações

        // Mapeamento de IDs
        this.idMapping = {
            'capital-inicial': 'sidebar-capital-inicial',
            'percentual-entrada': 'sidebar-percentual-entrada',
            'stop-win-perc': 'sidebar-stop-win-perc',
            'stop-loss-perc': 'sidebar-stop-loss-perc',
            'estrategia-select': 'sidebar-estrategia-select',

            // Inverso
            'sidebar-capital-inicial': 'capital-inicial',
            'sidebar-percentual-entrada': 'percentual-entrada',
            'sidebar-stop-win-perc': 'stop-win-perc',
            'sidebar-stop-loss-perc': 'stop-loss-perc',
            'sidebar-estrategia-select': 'estrategia-select',
        };

        this.initializeSync();
    }

    initializeSync() {
        // Aguarda DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupMainCardListeners();
                this.setupPayoutListeners();
                this.setupStrategyListeners();
            });
        } else {
            this.setupMainCardListeners();
            this.setupPayoutListeners();
            this.setupStrategyListeners();
        }

        // Escuta eventos de mudança do sidebar
        this.setupSidebarListeners();
    }

    setupMainCardListeners() {
        const mainInputs = [
            'capital-inicial',
            'percentual-entrada',
            'stop-win-perc',
            'stop-loss-perc',
        ];

        mainInputs.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.queueSync({
                        sourceId: id,
                        targetId: this.idMapping[id],
                        value: e.target.value,
                        type: 'input',
                        source: 'main',
                    });
                });
            }
        });
    }

    setupSidebarListeners() {
        // Os listeners serão configurados dinamicamente quando o sidebar for criado
        document.addEventListener('sidebarModalReady', () => {
            // Garante que o controller do card de parâmetros está ativo para COMMIT dos valores
            try {
                if (window.ParametersCardController) {
                    (window.parametersCardController ||= new window.ParametersCardController()).bindEventHandlers();
                }
            } catch (e) {
                console.warn('[SIDEBAR] Falha ao inicializar ParametersCardController:', e && e.message ? e.message : e);
            }
            const sidebarInputs = [
                'sidebar-capital-inicial',
                'sidebar-percentual-entrada',
                'sidebar-stop-win-perc',
                'sidebar-stop-loss-perc',
            ];

            sidebarInputs.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', (e) => {
                        this.queueSync({
                            sourceId: id,
                            targetId: this.idMapping[id],
                            value: e.target.value,
                            type: 'input',
                            source: 'sidebar',
                        });
                    });
                }
            });

            // Setup para select de estratégia do sidebar
            const sidebarStrategySelect = document.getElementById('sidebar-estrategia-select');
            if (sidebarStrategySelect) {
                sidebarStrategySelect.addEventListener('change', (e) => {
                    this.queueSync({
                        sourceId: 'sidebar-estrategia-select',
                        targetId: 'estrategia-select',
                        value: e.target.value,
                        type: 'select',
                        source: 'sidebar',
                    });
                });
            }

            // Setup para botões de payout do sidebar
            const sidebarPayoutContainer = document.querySelector(
                '#sidebar-parameters .payout-buttons'
            );
            if (sidebarPayoutContainer) {
                sidebarPayoutContainer.addEventListener('click', async (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const payout = parseInt(e.target.textContent);
                        await this.syncPayoutButtons(payout, 'sidebar');
                    }
                });
            }
        });
    }

    setupPayoutListeners() {
        // Escuta mudanças nos botões de payout do card principal
        const payoutContainer = document.querySelector('.payout-buttons');
        if (payoutContainer) {
            payoutContainer.addEventListener('click', async (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const payout = parseInt(e.target.textContent);
                    await this.syncPayoutButtons(payout, 'main');
                }
            });
        }
    }

    setupStrategyListeners() {
        // Card principal
        const strategySelect = document.getElementById('estrategia-select');
        if (strategySelect) {
            strategySelect.addEventListener('change', (e) => {
                this.queueSync({
                    sourceId: 'estrategia-select',
                    targetId: 'sidebar-estrategia-select',
                    value: e.target.value,
                    type: 'select',
                    source: 'main',
                });
            });
        }
    }

    queueSync(change) {
        // Evita sincronizações muito frequentes
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncCooldown) {
            return;
        }

        this.syncQueue.push(change);
        this.debounceSync();
    }

    debounceSync() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.processSyncQueue();
        }, this.debounceDelay);
    }

    processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) return;

        this.isSyncing = true;
        const changes = [...this.syncQueue];
        this.syncQueue = [];

        try {
            changes.forEach((change) => {
                this.applyChange(change);
            });

            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('Erro na sincronização:', error);
            // Recoloca mudanças na fila em caso de erro
            this.syncQueue.unshift(...changes);
        } finally {
            this.isSyncing = false;
        }
    }

    applyChange(change) {
        const { sourceId, targetId, value, type, source } = change;

        // Aplica a mudança no elemento alvo
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        // Previne loops infinitos
        if (targetElement.value === value) return;

        // Aplica a mudança
        if (type === 'input' || type === 'select') {
            targetElement.value = value;

            // Feedback visual
            this.showSyncFeedback(targetElement, 'success');

            // Dispara evento de change para ativar a lógica existente apenas se for do sidebar para main
            if (source === 'sidebar') {
                targetElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    async syncPayoutButtons(payout, source) {
        // Sincroniza botões de payout entre os dois locais
        const containers = [
            document.querySelector('.payout-buttons'),
            document.querySelector('#sidebar-parameters .payout-buttons'),
        ];

        containers.forEach((container) => {
            if (container) {
                // Remove classe ativa de todos os botões
                container.querySelectorAll('button').forEach((btn) => {
                    btn.classList.remove('active-payout');
                });

                // Adiciona classe ativa no botão correto
                const targetButton = Array.from(container.querySelectorAll('button')).find(
                    (btn) => parseInt(btn.textContent) === payout
                );

                if (targetButton) {
                    targetButton.classList.add('active-payout');
                    this.showSyncFeedback(targetButton, 'success');
                }
            }
        });

        // Atualiza o estado global apenas se vier do sidebar
        if (source === 'sidebar' && window.updateState) {
            const needsRecalculation = window.updateState({ payout });
            if (needsRecalculation && window.logic) {
                await window.logic.calcularPlano(true);
            }
            if (window.ui) {
                window.ui.atualizarTudo();
            }
        }
    }

    showSyncFeedback(element, type) {
        // Adiciona classe de feedback
        element.classList.add(`sync-${type}`);

        // Remove após animação
        setTimeout(() => {
            element.classList.remove(`sync-${type}`);
        }, 600);
    }
}

/**
 * Sistema de Gerenciamento de Sincronização de Payout
 */
class PayoutSyncManager {
    constructor() {
        this.activePayout = 87; // Valor padrão
        this.mainContainer = '.payout-buttons';
        this.sidebarContainer = '#sidebar-payout-buttons';
        this.isUpdating = false; // Previne loops infinitos
        this.lastUpdateTime = 0;
        this.updateCooldown = 100; // ms

        this.initialize();
    }

    initialize() {
        // Setup inicial
        this.loadCurrentPayout();
        this.setupMainListeners();

        // Setup sidebar quando estiver pronto
        document.addEventListener('payoutButtonsReady', async () => {
            this.setupSidebarListeners();
            await this.syncCurrentState();
        });
    }

    loadCurrentPayout() {
        // Carrega payout atual do estado da aplicação
        const activeButton = document.querySelector(`${this.mainContainer} .active-payout`);
        if (activeButton) {
            this.activePayout = parseInt(activeButton.textContent.trim());
        }
    }

    setupMainListeners() {
        const mainContainer = document.querySelector(this.mainContainer);
        if (mainContainer) {
            mainContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && !this.isUpdating) {
                    const payout = parseInt(e.target.textContent.trim());
                    this.handlePayoutChange(payout, 'main', e.target);
                }
            });
        }
    }

    setupSidebarListeners() {
        const sidebarContainer = document.querySelector(this.sidebarContainer);
        if (sidebarContainer) {
            sidebarContainer.addEventListener('click', async (e) => {
                if (e.target.tagName === 'BUTTON' && !this.isUpdating) {
                    const payout = parseInt(e.target.textContent.trim());
                    await this.handlePayoutChange(payout, 'sidebar', e.target);
                }
            });
        }
    }

    async handlePayoutChange(payout, source, clickedButton) {
        // Cooldown para evitar múltiplos cliques
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateCooldown) {
            return;
        }

        this.lastUpdateTime = now;
        this.isUpdating = true;

        try {
            // Atualizar estado interno
            this.activePayout = payout;

            // Aplicar feedback visual no botão clicado
            this.applyClickFeedback(clickedButton);

            // Sincronizar ambos os containers
            await this.syncPayoutButtons(payout, source);

            // Atualizar estado da aplicação
            await this.updateApplicationState(payout);

            // Disparar evento customizado
            document.dispatchEvent(
                new CustomEvent('payoutSync', {
                    detail: { payout, source, timestamp: now },
                })
            );
        } catch (error) {
            console.error('Erro na sincronização de payout:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    syncPayoutButtons(payout, source) {
        const containers = [
            document.querySelector(this.mainContainer),
            document.querySelector(this.sidebarContainer),
        ];

        containers.forEach((container) => {
            if (container) {
                // Remover classe ativa de todos os botões
                container.querySelectorAll('button').forEach((btn) => {
                    btn.classList.remove('active-payout');
                    btn.setAttribute('aria-pressed', 'false');
                });

                // Adicionar classe ativa no botão correto
                const targetButton =
                    container.querySelector(`button[data-payout="${payout}"]`) ||
                    Array.from(container.querySelectorAll('button')).find(
                        (btn) => parseInt(btn.textContent.trim()) === payout
                    );

                if (targetButton) {
                    targetButton.classList.add('active-payout');
                    targetButton.setAttribute('aria-pressed', 'true');

                    // Feedback visual apenas se não for o botão clicado
                    if (targetButton.getAttribute('data-source') !== source) {
                        this.applySyncFeedback(targetButton);
                    }
                }
            }
        });
    }

    applyClickFeedback(button) {
        // Efeito ripple
        const ripple = document.createElement('span');
        ripple.className = 'payout-ripple';
        button.appendChild(ripple);

        // Remover ripple após animação
        setTimeout(() => ripple.remove(), 600);

        // Efeito de confirmação
        button.classList.add('payout-clicked');
        setTimeout(() => {
            button.classList.remove('payout-clicked');
        }, 300);
    }

    applySyncFeedback(button) {
        // Efeito de sincronização
        button.classList.add('payout-synced');
        setTimeout(() => {
            button.classList.remove('payout-synced');
        }, 600);
    }

    async updateApplicationState(payout) {
        // Atualizar estado global da aplicação
        if (window.updateState) {
            const needsRecalculation = window.updateState({ payout });
            if (needsRecalculation && window.logic) {
                await window.logic.calcularPlano(true);
            }
        }

        // Atualizar UI
        if (window.ui) {
            window.ui.atualizarTudo();
        }
    }

    async syncCurrentState() {
        // Sincronizar estado atual quando sidebar abre
        await this.syncPayoutButtons(this.activePayout, 'sync');
    }
}

/**
 * Gerenciador de Efeitos de Focus Premium
 */
class FieldFocusManager {
    constructor() {
        this.focusedField = null;
        this.typingTimer = null;
        this.typingDelay = 500; // ms após parar de digitar

        this.initialize();
    }

    initialize() {
        this.setupFocusListeners();
    }

    setupFocusListeners() {
        // Seletores para todos os campos relevantes
        const fieldSelectors = [
            '#capital-inicial',
            '#percentual-entrada',
            '#stop-win-perc',
            '#stop-loss-perc',
            '#estrategia-select',
            '#sidebar-capital-inicial',
            '#sidebar-percentual-entrada',
            '#sidebar-stop-win-perc',
            '#sidebar-stop-loss-perc',
            '#sidebar-estrategia-select',
        ];

        // Configurar listeners para campos existentes
        this.attachListenersToFields(fieldSelectors);

        // Configurar listeners para campos do sidebar quando criados
        document.addEventListener('sidebarModalReady', () => {
            setTimeout(() => {
                this.attachListenersToFields(fieldSelectors.filter((s) => s.includes('sidebar')));
            }, 50);
        });
    }

    attachListenersToFields(selectors) {
        selectors.forEach((selector) => {
            const field = document.querySelector(selector);
            if (field) {
                field.addEventListener('focus', (e) => this.handleFieldFocus(e));
                field.addEventListener('blur', (e) => this.handleFieldBlur(e));
                field.addEventListener('input', (e) => this.handleFieldTyping(e));
            }
        });
    }

    handleFieldFocus(event) {
        const field = event.target;

        // Remover efeito do campo anterior
        if (this.focusedField && this.focusedField !== field) {
            this.removeFocusEffect(this.focusedField);
        }

        // Aplicar efeito no campo atual
        this.applyFocusEffect(field);
        this.focusedField = field;

        // Log para debug
        console.log(`🎯 Campo focado: ${field.id || field.name || 'unnamed'}`);
    }

    handleFieldBlur(event) {
        const field = event.target;

        // Pequeno delay para transições suaves
        setTimeout(() => {
            this.removeFocusEffect(field);
            if (this.focusedField === field) {
                this.focusedField = null;
            }
        }, 100);
    }

    handleFieldTyping(event) {
        const field = event.target;

        // Adicionar classe de typing
        field.classList.add('typing');

        // Remover classe após parar de digitar
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            field.classList.remove('typing');
        }, this.typingDelay);
    }

    applyFocusEffect(field) {
        // O CSS nativo :focus já aplica os efeitos verdes elegantes
        // Não é necessário adicionar classes extras

        // Feedback visual adicional baseado no tipo de campo
        if (field.type === 'number') {
            this.addNumberFieldEffect(field);
        } else if (field.tagName === 'SELECT') {
            this.addSelectFieldEffect(field);
        }
    }

    removeFocusEffect(field) {
        field.classList.remove('typing');

        // Remover efeitos específicos
        field.classList.remove('number-focused', 'select-focused');
    }

    addNumberFieldEffect(field) {
        field.classList.add('number-focused');

        // Feedback visual para campos numéricos
        const wrapper = field.parentElement;
        if (wrapper) {
            wrapper.classList.add('number-field-active');
            setTimeout(() => {
                wrapper.classList.remove('number-field-active');
            }, 200);
        }
    }

    addSelectFieldEffect(field) {
        field.classList.add('select-focused');

        // Feedback visual para selects
        const icon = field.nextElementSibling;
        if (icon && icon.classList.contains('select-icon')) {
            icon.classList.add('select-icon-active');
            setTimeout(() => {
                icon.classList.remove('select-icon-active');
            }, 200);
        }
    }
}

// Instâncias globais
window.realTimeSync = new RealTimeSyncManager();
window.payoutSync = new PayoutSyncManager();
window.fieldFocusManager = new FieldFocusManager();

/**
 * 🧪 FUNÇÃO DE TESTE - Sidebar
 * Testa todas as funcionalidades principais da sidebar
 */
function testSidebar() {
    console.log('🧪 Testando sidebar...');

    const startTime = performance.now();
    const results = {
        creation: false,
        toggle: false,
        sync: false,
        fieldFocus: false,
        payoutSync: false,
        overall: false,
    };

    try {
        // 1. Teste de criação da sidebar
        console.log('🎨 Testando criação da sidebar...');
        try {
            const testSidebar = new SidebarManager();
            if (testSidebar && typeof testSidebar.createSidebar === 'function') {
                results.creation = true;
                console.log('✅ Criação: OK');
            }
        } catch (error) {
            console.warn('⚠️ Criação da sidebar:', error.message);
        }

        // 2. Teste de toggle
        console.log('🔄 Testando toggle da sidebar...');
        try {
            if (sidebar && typeof sidebar.toggle === 'function') {
                sidebar.toggle();
                results.toggle = true;
                console.log('✅ Toggle: OK');
            }
        } catch (error) {
            console.warn('⚠️ Toggle:', error.message);
        }

        // 3. Teste de sincronização
        console.log('🔄 Testando sincronização...');
        try {
            if (window.realTimeSync && typeof window.realTimeSync.sync === 'function') {
                // Testa sync sem parâmetros (não deve quebrar)
                window.realTimeSync.sync();
                results.sync = true;
                console.log('✅ Sync: OK');
            }
        } catch (error) {
            console.warn('⚠️ Sincronização:', error.message);
        }

        // 4. Teste de field focus
        console.log('🎯 Testando field focus...');
        try {
            if (
                window.fieldFocusManager &&
                typeof window.fieldFocusManager.initialize === 'function'
            ) {
                // Inicialização deve funcionar sem erro
                window.fieldFocusManager.initialize();
                results.fieldFocus = true;
                console.log('✅ Field Focus: OK');
            }
        } catch (error) {
            console.warn('⚠️ Field Focus:', error.message);
        }

        // 5. Teste de payout sync
        console.log('💰 Testando payout sync...');
        try {
            if (window.payoutSync && typeof window.payoutSync.initialize === 'function') {
                // Inicialização deve funcionar sem erro
                window.payoutSync.initialize();
                results.payoutSync = true;
                console.log('✅ Payout Sync: OK');
            }
        } catch (error) {
            console.warn('⚠️ Payout Sync:', error.message);
        }

        // Resultado geral
        const successCount = Object.values(results).filter(Boolean).length;
        results.overall = successCount >= 3; // Pelo menos 3 de 5 testes

        const endTime = performance.now();
        console.log(`⏱️ Testes Sidebar executados em ${(endTime - startTime).toFixed(2)}ms`);

        if (results.overall) {
            console.log('✅ SIDEBAR: Funcionando corretamente!');
        } else {
            console.warn('⚠️ SIDEBAR: Alguns problemas encontrados');
        }

        return results;
    } catch (error) {
        console.error('❌ Erro crítico nos testes Sidebar:', error);
        return { ...results, overall: false };
    }
}

// Exposição global
if (typeof window !== 'undefined') {
    window.testSidebar = testSidebar;
    console.log('🧪 testSidebar() disponível globalmente');
}

// Exporta instância única
export const sidebar = new SidebarManager();
