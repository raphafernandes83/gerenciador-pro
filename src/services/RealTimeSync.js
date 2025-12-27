/**
 * =============================================================================
 * REAL TIME SYNC - Sistema de Sincronização em Tempo Real
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1511-1607)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Gerenciar fila de sincronização bidirecional entre 
 * sidebar e aplicação principal com debounce de 100ms.
 * 
 * Dependências:
 * - window.sidebar (referência global à instância da sidebar)
 * - document.getElementById (manipulação DOM)
 * 
 * =============================================================================
 */

/**
 * Sistema de Sincronização em Tempo Real
 */
export class RealTimeSync {
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
