/**
 * =============================================================================
 * PAYOUT SYNC MANAGER - Sistema de Gerenciamento de Sincronização de Payout
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1706-1878)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Sincronizar estado de payout entre painel principal
 * e sidebar com feedback visual premium.
 * 
 * Seletores Monitorados:
 * - .payout-buttons (container principal)
 * - #sidebar-payout-buttons (container sidebar)
 * - button (dentro dos containers)
 * 
 * Dependências Globais:
 * - window.updateState() - atualização de estado
 * - window.logic.calcularPlano() - recálculo de plano
 * - window.ui.atualizarTudo() - atualização de UI
 * 
 * Instância Global: window.payoutSync
 * 
 * =============================================================================
 */

/**
 * Sistema de Gerenciamento de Sincronização de Payout
 */
export class PayoutSyncManager {
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
