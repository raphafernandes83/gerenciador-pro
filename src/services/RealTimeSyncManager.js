/**
 * =============================================================================
 * REAL TIME SYNC MANAGER - Sistema de Sincronização em Tempo Real
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1430-1705)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Sincronizar valores de inputs em tempo real entre 
 * painel principal e sidebar com debounce de 150ms.
 * 
 * Seletores DOM Monitorados:
 * - #capital-inicial, #percentual-entrada, #stop-win-perc, #stop-loss-perc
 * - #estrategia-select
 * - #sidebar-capital-inicial, #sidebar-percentual-entrada, etc.
 * - .payout-buttons, #sidebar-parameters .payout-buttons
 * 
 * Dependências Globais (window.*):
 * - window.ParametersCardController
 * - window.parametersCardController
 * - window.updateState
 * - window.logic
 * - window.ui
 * 
 * Instância Global: window.realTimeSync
 * 
 * =============================================================================
 */

/**
 * Sistema de Sincronização em Tempo Real
 */
export class RealTimeSyncManager {
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
