// ============================================================================
// STATE MANAGER - Gerenciador de Estado Centralizado
// ============================================================================
// Criado em: 21/01/2025
// Checkpoint: 1.1
// Objetivo: Centralizar gerenciamento de estado com histórico e notificações
// ============================================================================

/**
 * Gerenciador de Estado Centralizado
 * 
 * Fornece um único ponto de verdade para o estado da aplicação, com:
 * - Imutabilidade de leitura (getState retorna cópia congelada)
 * - Sistema de subscrição para observar mudanças
 * - Histórico de snapshots para debug
 * - Logging detalhado para rastreabilidade
 */
export class StateManager {
    // Estado privado (não acessível diretamente)
    #state = {};

    // Map de subscribers organizados por chave
    // Estrutura: chave -> [callbacks]
    #subscribers = new Map();

    // Histórico de estados (limitado a 50 snapshots)
    #history = [];

    // Configuração
    #config = {
        maxHistorySize: 50,
        enableLogging: true,
        enableWarnings: true
    };

    /**
     * Construtor
     * @param {Object} initialState - Estado inicial (opcional)
     */
    constructor(initialState = {}) {
        this.#state = { ...initialState };
        this.#saveSnapshot('init');

        if (this.#config.enableLogging) {
            console.log('[StateManager] Initialized with state:', this.#state);
        }
    }

    /**
     * Obtém uma cópia imutável do estado atual
     * @returns {Object} Estado congelado (read-only)
     */
    getState() {
        return Object.freeze({ ...this.#state });
    }

    /**
     * Obtém uma propriedade específica do estado
     * @param {string} key - Chave da propriedade
     * @param {*} defaultValue - Valor padrão se não existir
     * @returns {*} Valor da propriedade
     */
    get(key, defaultValue = undefined) {
        return this.#state.hasOwnProperty(key) ? this.#state[key] : defaultValue;
    }

    /**
     * Atualiza o estado com novos valores
     * @param {Object} updates - Objeto com propriedades a atualizar
     * @param {string} source - Identificador da origem da mudança (para debug)
     */
    setState(updates, source = 'unknown') {
        if (typeof updates !== 'object' || updates === null) {
            console.error('[StateManager] setState requires an object, received:', typeof updates);
            return;
        }

        const oldState = { ...this.#state };
        this.#state = { ...this.#state, ...updates };

        // Salvar snapshot
        this.#saveSnapshot(source);

        // Notificar subscribers
        this.#notify(oldState, this.#state, source);

        // Log de mudanças
        if (this.#config.enableLogging) {
            const changedKeys = Object.keys(updates);
            console.log(`[StateManager] Updated by ${source}:`, updates);
            console.log(`[StateManager] Changed keys:`, changedKeys);
        }
    }

    /**
     * Atualiza uma propriedade específica
     * @param {string} key - Chave da propriedade
     * @param {*} value - Novo valor
     * @param {string} source - Origem da mudança
     */
    set(key, value, source = 'unknown') {
        this.setState({ [key]: value }, source);
    }

    /**
     * Inscreve um callback para observar mudanças em uma chave específica
     * @param {string} key - Chave a observar (ou '*' para todas)
     * @param {Function} callback - Função a executar quando a chave mudar
     * @returns {Function} Função de cleanup para cancelar subscrição
     */
    subscribe(key, callback) {
        if (typeof callback !== 'function') {
            console.error('[StateManager] subscribe requires a callback function');
            return () => { };
        }

        if (!this.#subscribers.has(key)) {
            this.#subscribers.set(key, []);
        }

        this.#subscribers.get(key).push(callback);

        if (this.#config.enableLogging) {
            console.log(`[StateManager] Subscribed to '${key}'. Total subscribers:`, this.#subscribers.get(key).length);
        }

        // Retorna função de cleanup
        return () => {
            const callbacks = this.#subscribers.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                    if (this.#config.enableLogging) {
                        console.log(`[StateManager] Unsubscribed from '${key}'`);
                    }
                }
            }
        };
    }

    /**
     * Notifica subscribers sobre mudanças
     * @private
     */
    #notify(oldState, newState, source) {
        // Verificar mudanças em cada chave
        const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

        allKeys.forEach(key => {
            const oldValue = oldState[key];
            const newValue = newState[key];

            // Se o valor mudou, notificar subscribers específicos
            if (oldValue !== newValue) {
                const keySubscribers = this.#subscribers.get(key) || [];
                keySubscribers.forEach(callback => {
                    try {
                        callback(newValue, oldValue, source);
                    } catch (error) {
                        console.error(`[StateManager] Error in subscriber for '${key}':`, error);
                    }
                });

                // Notificar subscribers wildcard (*)
                const wildcardSubscribers = this.#subscribers.get('*') || [];
                wildcardSubscribers.forEach(callback => {
                    try {
                        callback(key, newValue, oldValue, source);
                    } catch (error) {
                        console.error(`[StateManager] Error in wildcard subscriber:`, error);
                    }
                });
            }
        });
    }

    /**
     * Salva um snapshot do estado atual no histórico
     * @private
     */
    #saveSnapshot(source) {
        this.#history.push({
            state: { ...this.#state },
            timestamp: Date.now(),
            source: source
        });

        // Limitar tamanho do histórico
        if (this.#history.length > this.#config.maxHistorySize) {
            this.#history.shift();
        }
    }

    /**
     * Retorna o histórico completo de estados
     * @returns {Array} Array de snapshots
     */
    getHistory() {
        return [...this.#history];
    }

    /**
     * Retorna o último snapshot do histórico
     * @returns {Object|null} Último snapshot ou null
     */
    getLastSnapshot() {
        return this.#history.length > 0
            ? this.#history[this.#history.length - 1]
            : null;
    }

    /**
     * Reseta o estado para um snapshot anterior
     * @param {number} index - Índice do snapshot no histórico
     */
    resetToSnapshot(index) {
        if (index < 0 || index >= this.#history.length) {
            console.error('[StateManager] Invalid snapshot index:', index);
            return;
        }

        const snapshot = this.#history[index];
        this.setState(snapshot.state, `reset-to-snapshot-${index}`);

        if (this.#config.enableLogging) {
            console.log('[StateManager] Reset to snapshot:', snapshot);
        }
    }

    /**
     * Limpa todo o histórico
     */
    clearHistory() {
        this.#history = [];
        if (this.#config.enableLogging) {
            console.log('[StateManager] History cleared');
        }
    }

    /**
     * Retorna estatísticas do StateManager
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            stateKeys: Object.keys(this.#state).length,
            subscribersCount: Array.from(this.#subscribers.values())
                .reduce((sum, arr) => sum + arr.length, 0),
            subscribedKeys: Array.from(this.#subscribers.keys()),
            historySize: this.#history.length,
            maxHistorySize: this.#config.maxHistorySize
        };
    }

    /**
     * Habilita/desabilita logging
     * @param {boolean} enabled - true para habilitar, false para desabilitar
     */
    setLogging(enabled) {
        this.#config.enableLogging = enabled;
        console.log('[StateManager] Logging', enabled ? 'enabled' : 'disabled');
    }

    /**
     * Debug: imprime o estado atual no console
     */
    debug() {
        console.log('='.repeat(60));
        console.log('🔍 STATE MANAGER DEBUG');
        console.log('='.repeat(60));
        console.log('Current State:', this.#state);
        console.log('Stats:', this.getStats());
        console.log('Recent History (last 5):');
        this.#history.slice(-5).forEach((snapshot, i) => {
            const date = new Date(snapshot.timestamp).toLocaleTimeString();
            console.log(`  [${i}] ${date} - ${snapshot.source}:`, snapshot.state);
        });
        console.log('='.repeat(60));
    }
}

// ============================================================================
// SINGLETON GLOBAL
// ============================================================================

// Criar instância singleton
export const stateManager = new StateManager();

// Expor globalmente para debug
if (typeof window !== 'undefined') {
    window.stateManager = stateManager;
    console.log('[StateManager] Global instance available at window.stateManager');
}

// ============================================================================
// UTILITÁRIOS DE COMPATIBILIDADE
// ============================================================================

/**
 * Cria um proxy bidirecional entre StateManager e window.state
 * Usado durante a migração gradual para manter compatibilidade
 * 
 * @param {StateManager} manager - Instância do StateManager
 * @param {Object} legacyState - Objeto window.state legado
 */
export function createBidirectionalSync(manager, legacyState) {
    if (!legacyState) {
        console.warn('[StateManager] No legacy state provided for sync');
        return;
    }

    // Sincronizar estado inicial do legacyState para o manager
    manager.setState(legacyState, 'bidirectional-sync-init');

    // Quando StateManager muda, atualizar legacyState
    manager.subscribe('*', (key, newValue, oldValue, source) => {
        if (source !== 'legacy-state-update') {
            legacyState[key] = newValue;
        }
    });

    console.log('[StateManager] Bidirectional sync established with legacy state');
}

/**
 * Cria um Proxy para detectar acessos diretos ao window.state
 * Útil para encontrar código que ainda usa estado legado
 * 
 * @param {Object} target - Objeto a ser monitorado
 * @returns {Proxy} Proxy com logging de acessos
 */
export function createAccessDetector(target) {
    return new Proxy(target, {
        set(obj, prop, value) {
            console.warn(`⚠️ Direct access to legacy state.${prop} detected!`);
            console.trace(); // Mostra stack trace
            obj[prop] = value;
            return true;
        },
        get(obj, prop) {
            if (typeof obj[prop] === 'function') {
                return obj[prop];
            }
            // Não logar para propriedades especiais
            if (prop !== 'constructor' && prop !== 'toString' && prop !== 'valueOf') {
                console.warn(`⚠️ Direct read from legacy state.${prop}`);
                console.trace();
            }
            return obj[prop];
        }
    });
}
