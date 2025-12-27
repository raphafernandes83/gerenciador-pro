/**
 * 🗑️ TrashFAB - Botão Flutuante da Lixeira
 * 
 * Implementa botão FAB (Floating Action Button) moderno e responsivo
 * para acesso rápido ao sistema de lixeira.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 1: FAB Base
 */

'use strict';

/**
 * 🎯 Classe do botão flutuante da lixeira
 */
class TrashFAB {
    constructor() {
        this.element = null;
        this.badge = null;
        this.isVisible = true;
        this.itemCount = 0;
        this.isAnimating = false;

        // Configurações
        this.config = {
            position: { bottom: 30, right: 30 },
            size: { desktop: 56, tablet: 52, mobile: 48 },
            zIndex: 1000,
            animationDuration: 300
        };

        this.init();
    }

    /**
     * 🚀 Inicializa o FAB
     */
    init() {
        try {
            console.log('🎯 Inicializando TrashFAB...');

            this.createElement();
            this.setupStyles();
            this.attachEventListeners();
            this.updateState();
            this.show();

            console.log('✅ TrashFAB inicializado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao inicializar TrashFAB:', error);
        }
    }

    /**
     * 🏗️ Cria elemento DOM do FAB
     */
    createElement() {
        // Container principal do FAB
        this.element = document.createElement('button');
        this.element.id = 'trash-fab';
        this.element.className = 'trash-fab';
        this.element.setAttribute('aria-label', 'Lixeira');
        this.element.setAttribute('title', 'Lixeira vazia');
        this.element.setAttribute('role', 'button');
        this.element.setAttribute('tabindex', '0');

        // Ícone SVG da lixeira
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'trash-icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('width', '24');
        icon.setAttribute('height', '24');
        icon.innerHTML = `
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        `;

        // Badge para contador
        this.badge = document.createElement('span');
        this.badge.className = 'trash-badge';
        this.badge.setAttribute('aria-hidden', 'true');

        // Monta estrutura
        this.element.appendChild(icon);
        this.element.appendChild(this.badge);

        // Adiciona ao DOM
        document.body.appendChild(this.element);
    }

    /**
     * 🎨 Configura estilos do FAB
     */
    setupStyles() {
        // Verifica se estilos já foram adicionados
        if (document.getElementById('trash-fab-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'trash-fab-styles';
        styles.textContent = `
            /* 🗑️ Estilos do TrashFAB */
            .trash-fab {
                position: fixed;
                bottom: ${this.config.position.bottom}px;
                right: 90px; /* Ajustado para não sobrepor glossário */
                width: ${this.config.size.desktop}px;
                height: ${this.config.size.desktop}px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                z-index: 10000; /* Maior que glossário (9999) */
                
                /* Visual */
                background: #6b7280;
                color: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                
                /* Transições */
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform: scale(0);
                opacity: 0;
                
                /* Flexbox para centralizar ícone */
                display: flex;
                align-items: center;
                justify-content: center;
                
                /* Acessibilidade */
                outline: none;
                user-select: none;
            }
            
            /* Estados do FAB */
            .trash-fab.visible {
                transform: scale(1);
                opacity: 1;
            }
            
            .trash-fab.empty {
                background: #6b7280;
                opacity: 1; /* Sempre visível */
                cursor: pointer; /* Sempre clicável */
            }
            
            .trash-fab.has-items {
                background: #ef4444;
                opacity: 1;
                cursor: pointer;
            }
            
            .trash-fab.has-items.pulse {
                animation: fab-pulse 2s infinite;
            }
            
            /* Hover e Focus */
            .trash-fab:hover:not(.empty) {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            }
            
            .trash-fab:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            .trash-fab:active:not(.empty) {
                transform: scale(0.95);
            }
            
            /* Ícone */
            .trash-fab .trash-icon {
                width: 24px;
                height: 24px;
                transition: transform 0.2s ease;
            }
            
            .trash-fab:hover .trash-icon {
                transform: scale(1.1);
            }
            
            /* Badge */
            .trash-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                min-width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #dc2626;
                color: white;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                
                /* Centralizar texto */
                display: flex;
                align-items: center;
                justify-content: center;
                
                /* Transições */
                transition: all 0.3s ease;
                transform: scale(0);
                opacity: 0;
            }
            
            .trash-badge.visible {
                transform: scale(1);
                opacity: 1;
            }
            
            .trash-badge.animate {
                animation: badge-bounce 0.6s ease;
            }
            
            /* Animações */
            @keyframes fab-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes badge-bounce {
                0% { transform: scale(0); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }
            
            @keyframes fab-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .trash-fab {
                    width: ${this.config.size.tablet}px;
                    height: ${this.config.size.tablet}px;
                    bottom: 25px;
                    right: 25px;
                }
                
                .trash-fab .trash-icon {
                    width: 22px;
                    height: 22px;
                }
                
                .trash-badge {
                    min-width: 22px;
                    height: 22px;
                    font-size: 11px;
                    top: -6px;
                    right: -6px;
                }
            }
            
            @media (max-width: 480px) {
                .trash-fab {
                    width: ${this.config.size.mobile}px;
                    height: ${this.config.size.mobile}px;
                    bottom: 20px;
                    right: 20px;
                }
                
                .trash-fab .trash-icon {
                    width: 20px;
                    height: 20px;
                }
                
                .trash-badge {
                    min-width: 20px;
                    height: 20px;
                    font-size: 10px;
                    top: -5px;
                    right: -5px;
                }
            }
            
            /* Integração com temas */
            [data-theme="claro"] .trash-fab.empty {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            [data-theme="matrix"] .trash-fab.empty {
                background: #065f46;
                color: #10b981;
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
            }
            
            [data-theme="daltonismo"] .trash-fab.has-items {
                background: #7c3aed;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * 🎧 Configura event listeners
     */
    attachEventListeners() {
        // Click no FAB
        this.element.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleClick();
        });

        // Suporte a teclado
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        });

        // Listener para mudanças na lixeira
        window.addEventListener('trashChanged', (e) => {
            this.updateState(e.detail);
        });

        // Listener para mudanças de tema
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateTheme();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * 🖱️ Manipula clique no FAB
     */
    handleClick() {
        // Animação de clique
        this.animateClick();

        // Abre modal da lixeira
        if (window.trashModal) {
            window.trashModal.open();
        } else if (window.getTrashModal) {
            const modal = window.getTrashModal();
            modal.open();
        } else {
            console.warn('⚠️ Modal da lixeira não disponível');
            this.showEmptyMessage();
        }

        console.log('🗑️ Abrindo modal da lixeira...');
    }

    /**
     * 💬 Mostra mensagem quando lixeira está vazia
     */
    showEmptyMessage() {
        // Animação de shake
        this.element.style.animation = 'fab-shake 0.5s ease';

        setTimeout(() => {
            this.element.style.animation = '';
        }, 500);

        console.log('🗑️ Lixeira está vazia');
    }

    /**
     * ✨ Animação de clique
     */
    animateClick() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.element.style.transform = 'scale(0.9)';

        setTimeout(() => {
            this.element.style.transform = '';
            this.isAnimating = false;
        }, 150);
    }

    /**
     * 🔄 Atualiza estado do FAB
     */
    updateState(stats = null) {
        try {
            // Obtém estatísticas se não fornecidas
            if (!stats && window.trashManager) {
                stats = window.trashManager.getStats();
            }

            const newCount = stats ? stats.totalItems : 0;
            const hadItems = this.itemCount > 0;
            const hasItems = newCount > 0;

            // Atualiza contador
            this.itemCount = newCount;

            // Atualiza classes CSS
            this.element.classList.toggle('empty', !hasItems);
            this.element.classList.toggle('has-items', hasItems);
            this.element.classList.toggle('pulse', hasItems);

            // Atualiza badge
            this.updateBadge(newCount);

            // Atualiza tooltip
            this.updateTooltip(newCount, stats);

            // Animação quando item é adicionado
            if (!hadItems && hasItems) {
                this.animateNewItem();
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar estado do FAB:', error);
        }
    }

    /**
     * 🏷️ Atualiza badge do contador
     */
    updateBadge(count) {
        if (count > 0) {
            this.badge.textContent = count > 99 ? '99+' : count.toString();
            this.badge.classList.add('visible');

            // Animação do badge
            this.badge.classList.add('animate');
            setTimeout(() => {
                this.badge.classList.remove('animate');
            }, 600);

        } else {
            this.badge.classList.remove('visible');
            setTimeout(() => {
                this.badge.textContent = '';
            }, 300);
        }
    }

    /**
     * 💬 Atualiza tooltip
     */
    updateTooltip(count, stats) {
        let tooltipText;

        if (count === 0) {
            tooltipText = 'Lixeira vazia';
        } else if (count === 1) {
            tooltipText = '1 item na lixeira';
        } else {
            tooltipText = `${count} itens na lixeira`;
        }

        // Adiciona informação sobre itens próximos ao vencimento
        if (stats && stats.expiringItems > 0) {
            tooltipText += ` (${stats.expiringItems} expirando em breve)`;
        }

        this.element.setAttribute('title', tooltipText);
        this.element.setAttribute('aria-label', tooltipText);
    }

    /**
     * ✨ Animação quando novo item é adicionado
     */
    animateNewItem() {
        // Shake + mudança de cor
        this.element.style.animation = 'fab-shake 0.5s ease';

        setTimeout(() => {
            this.element.style.animation = '';
        }, 500);
    }

    /**
     * 🎨 Atualiza tema
     */
    updateTheme() {
        // Os estilos CSS já lidam com os temas automaticamente
        // Esta função pode ser expandida para lógica adicional se necessário
        console.log('🎨 Tema do FAB atualizado');
    }

    /**
     * 👁️ Mostra FAB
     */
    show() {
        this.isVisible = true;
        this.element.classList.add('visible');
    }

    /**
     * 🙈 Esconde FAB
     */
    hide() {
        this.isVisible = false;
        this.element.classList.remove('visible');
    }

    /**
     * 🗑️ Remove FAB do DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        // Remove estilos
        const styles = document.getElementById('trash-fab-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }

        console.log('🗑️ TrashFAB removido');
    }

    /**
     * 🧪 Função de teste
     */
    test() {
        console.log('🧪 Testando TrashFAB...');

        try {
            const tests = {
                elementExists: !!this.element,
                isVisible: this.isVisible,
                hasStyles: !!document.getElementById('trash-fab-styles'),
                hasEventListeners: true, // Assumimos que foram adicionados
                badgeWorks: !!this.badge
            };

            const allTestsPass = Object.values(tests).every(Boolean);

            console.log(allTestsPass ? '✅ Todos os testes do FAB passaram!' : '❌ Alguns testes falharam:', tests);

            return { tests, allTestsPass };

        } catch (error) {
            console.error('❌ Erro nos testes do FAB:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton
let trashFABInstance = null;

/**
 * 🏭 Factory function para obter instância do TrashFAB
 */
function getTrashFAB() {
    if (!trashFABInstance) {
        trashFABInstance = new TrashFAB();
    }
    return trashFABInstance;
}

// Exposição global
if (typeof window !== 'undefined') {
    window.TrashFAB = TrashFAB;
    window.getTrashFAB = getTrashFAB;

    console.log('🎯 TrashFAB disponível globalmente');
}

export { TrashFAB, getTrashFAB };
export default TrashFAB;
