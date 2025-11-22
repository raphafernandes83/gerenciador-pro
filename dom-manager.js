// ============================================================================
// DOM MANAGER - Gerenciador de DOM Centralizado
// ============================================================================
// Criado em: 21/01/2025
// Checkpoint: 2.1
// Objetivo: Abstrair manipulações de DOM com cache e segurança
// ============================================================================

/**
 * Gerenciador de DOM Centralizado
 * 
 * Fornece acesso seguro e otimizado ao DOM com:
 * - Cache de elementos para performance
 * - Métodos null-safe para evitar erros
 * - Logging para debug
 * - Gerenciamento de event listeners
 */
export class DOMManager {
    // Cache de elementos
    #cache = new Map();

    // Event listeners registrados (para cleanup)
    #listeners = new Map();

    // Configuração
    #config = {
        enableCache: true,
        enableLogging: false,
        throwOnNotFound: false
    };

    /**
     * Construtor
     * @param {Object} options - Opções de configuração
     */
    constructor(options = {}) {
        this.#config = { ...this.#config, ...options };

        if (this.#config.enableLogging) {
            console.log('[DOMManager] Initialized');
        }
    }

    /**
     * Seleciona um elemento (com cache)
     * @param {string} selector - Seletor CSS
     * @param {Element} context - Contexto de busca (padrão: document)
     * @returns {Element|null} Elemento encontrado ou null
     */
    select(selector, context = document) {
        const cacheKey = `${selector}@${context === document ? 'doc' : 'ctx'}`;

        // Verificar cache
        if (this.#config.enableCache && this.#cache.has(cacheKey)) {
            const cached = this.#cache.get(cacheKey);
            // Validar se elemento ainda está no DOM
            if (cached && document.contains(cached)) {
                return cached;
            }
            // Remover do cache se não está mais no DOM
            this.#cache.delete(cacheKey);
        }

        // Buscar elemento
        const element = context.querySelector(selector);

        if (!element) {
            if (this.#config.throwOnNotFound) {
                throw new Error(`Element not found: ${selector}`);
            }
            if (this.#config.enableLogging) {
                console.warn(`[DOMManager] Element not found: ${selector}`);
            }
            return null;
        }

        // Salvar no cache
        if (this.#config.enableCache) {
            this.#cache.set(cacheKey, element);
        }

        return element;
    }

    /**
     * Seleciona múltiplos elementos
     * @param {string} selector - Seletor CSS
     * @param {Element} context - Contexto de busca
     * @returns {Element[]} Array de elementos
     */
    selectAll(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    /**
     * Adiciona uma classe a um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {...string} classNames - Classes a adicionar
     * @returns {boolean} true se sucesso
     */
    addClass(elementOrSelector, ...classNames) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.classList.add(...classNames);

        if (this.#config.enableLogging) {
            console.log(`[DOMManager] Added classes to ${elementOrSelector}:`, classNames);
        }

        return true;
    }

    /**
     * Remove uma classe de um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {...string} classNames - Classes a remover
     * @returns {boolean} true se sucesso
     */
    removeClass(elementOrSelector, ...classNames) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.classList.remove(...classNames);

        if (this.#config.enableLogging) {
            console.log(`[DOMManager] Removed classes from ${elementOrSelector}:`, classNames);
        }

        return true;
    }

    /**
     * Alterna uma classe em um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} className - Classe a alternar
     * @param {boolean} force - Forçar adicionar (true) ou remover (false)
     * @returns {boolean} true se classe foi adicionada
     */
    toggleClass(elementOrSelector, className, force = undefined) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        const result = element.classList.toggle(className, force);

        if (this.#config.enableLogging) {
            console.log(`[DOMManager] Toggled class on ${elementOrSelector}:`, className, '→', result);
        }

        return result;
    }

    /**
     * Verifica se elemento tem uma classe
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} className - Classe a verificar
     * @returns {boolean} true se tem a classe
     */
    hasClass(elementOrSelector, className) {
        const element = this.#resolveElement(elementOrSelector);
        return element ? element.classList.contains(className) : false;
    }

    /**
     * Define atributo em um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} attr - Nome do atributo
     * @param {string} value - Valor do atributo
     * @returns {boolean} true se sucesso
     */
    setAttribute(elementOrSelector, attr, value) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.setAttribute(attr, value);
        return true;
    }

    /**
     * Remove atributo de um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} attr - Nome do atributo
     * @returns {boolean} true se sucesso
     */
    removeAttribute(elementOrSelector, attr) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.removeAttribute(attr);
        return true;
    }

    /**
     * Adiciona event listener a um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função handler
     * @param {Object} options - Opções do addEventListener
     * @returns {Function|null} Função de cleanup
     */
    on(elementOrSelector, event, handler, options = {}) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return null;

        element.addEventListener(event, handler, options);

        // Registrar para cleanup
        const key = `${elementOrSelector}:${event}`;
        if (!this.#listeners.has(key)) {
            this.#listeners.set(key, []);
        }
        this.#listeners.get(key).push({ handler, options });

        if (this.#config.enableLogging) {
            console.log(`[DOMManager] Added listener:`, key);
        }

        // Retornar função de cleanup
        return () => this.off(elementOrSelector, event, handler, options);
    }

    /**
     * Remove event listener de um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} event - Nome do evento
     * @param {Function} handler - Função handler
     * @param {Object} options - Opções do removeEventListener
     * @returns {boolean} true se sucesso
     */
    off(elementOrSelector, event, handler, options = {}) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.removeEventListener(event, handler, options);

        // Remover do registro
        const key = `${elementOrSelector}:${event}`;
        if (this.#listeners.has(key)) {
            const listeners = this.#listeners.get(key);
            const index = listeners.findIndex(l => l.handler === handler);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }

        if (this.#config.enableLogging) {
            console.log(`[DOMManager] Removed listener:`, key);
        }

        return true;
    }

    /**
     * Define conteúdo HTML de um elemento (com sanitização básica)
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} html - Conteúdo HTML
     * @returns {boolean} true se sucesso
     */
    setHTML(elementOrSelector, html) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.innerHTML = html;
        return true;
    }

    /**
     * Define conteúdo texto de um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @param {string} text - Conteúdo texto
     * @returns {boolean} true se sucesso
     */
    setText(elementOrSelector, text) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.textContent = text;
        return true;
    }

    /**
     * Mostra um elemento (remove 'hidden' ou define display)
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @returns {boolean} true se sucesso
     */
    show(elementOrSelector) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.hidden = false;
        element.style.display = '';
        return true;
    }

    /**
     * Esconde um elemento
     * @param {string|Element} elementOrSelector - Elemento ou seletor
     * @returns {boolean} true se sucesso
     */
    hide(elementOrSelector) {
        const element = this.#resolveElement(elementOrSelector);
        if (!element) return false;

        element.hidden = true;
        return true;
    }

    /**
     * Limpa o cache de elementos
     */
    clearCache() {
        this.#cache.clear();
        if (this.#config.enableLogging) {
            console.log('[DOMManager] Cache cleared');
        }
    }

    /**
     * Remove todos os event listeners registrados
     */
    cleanup() {
        this.#listeners.forEach((listeners, key) => {
            const [selector, event] = key.split(':');
            const element = this.select(selector);
            if (element) {
                listeners.forEach(({ handler, options }) => {
                    element.removeEventListener(event, handler, options);
                });
            }
        });
        this.#listeners.clear();

        if (this.#config.enableLogging) {
            console.log('[DOMManager] All listeners removed');
        }
    }

    /**
     * Retorna estatísticas do DOMManager
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            cachedElements: this.#cache.size,
            registeredListeners: this.#listeners.size,
            cacheEnabled: this.#config.enableCache,
            loggingEnabled: this.#config.enableLogging
        };
    }

    /**
     * Habilita/desabilita logging
     * @param {boolean} enabled - true para habilitar
     */
    setLogging(enabled) {
        this.#config.enableLogging = enabled;
        console.log('[DOMManager] Logging', enabled ? 'enabled' : 'disabled');
    }

    /**
     * Resolve elemento (aceita seletor ou elemento)
     * @private
     */
    #resolveElement(elementOrSelector) {
        if (typeof elementOrSelector === 'string') {
            return this.select(elementOrSelector);
        }
        return elementOrSelector;
    }

    /**
     * Debug: imprime informações no console
     */
    debug() {
        console.log('='.repeat(60));
        console.log('🔍 DOM MANAGER DEBUG');
        console.log('='.repeat(60));
        console.log('Stats:', this.getStats());
        console.log('Cached elements:', Array.from(this.#cache.keys()));
        console.log('Registered listeners:', Array.from(this.#listeners.keys()));
        console.log('='.repeat(60));
    }
}

// ============================================================================
// SINGLETON GLOBAL
// ============================================================================

// Criar instância singleton
export const domManager = new DOMManager({ enableLogging: false });

// Expor globalmente para debug
if (typeof window !== 'undefined') {
    window.domManager = domManager;
    console.log('[DOMManager] Global instance available at window.domManager');
}
