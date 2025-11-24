/**
 * @fileoverview Otimizador de operações DOM
 * Reduz reflows, batching de updates, virtual scrolling
 */

import { logger } from './Logger.js';
import { debounce, throttle, BatchProcessor } from './PerformanceOptimizer.js';

/**
 * Otimizador de DOM
 */
export class DOMOptimizer {
    constructor() {
        this.updateBatch = new BatchProcessor((updates) => {
            this._applyDOMUpdates(updates);
        }, 16); // ~60fps
    }

    /**
     * Batching de updates de DOM
     * @param {HTMLElement} element - Elemento a atualizar
     * @param {Function} updateFn - Função de atualização
     */
    scheduleUpdate(element, updateFn) {
        this.updateBatch.add({ element, updateFn });
    }

    /**
     * Aplica updates em batch
     * @private
     */
    _applyDOMUpdates(updates) {
        // Agrupar por tipo de operação
        const reads = [];
        const writes = [];

        updates.forEach(({ element, updateFn }) => {
            // Separar leituras e escritas para evitar layout thrashing
            if (this._isReadOperation(updateFn)) {
                reads.push({ element, updateFn });
            } else {
                writes.push({ element, updateFn });
            }
        });

        // Executar todas as leituras primeiro
        reads.forEach(({ element, updateFn }) => {
            try {
                updateFn(element);
            } catch (error) {
                logger.warn('Erro em leitura DOM:', error);
            }
        });

        // Depois todas as escritas
        requestAnimationFrame(() => {
            writes.forEach(({ element, updateFn }) => {
                try {
                    updateFn(element);
                } catch (error) {
                    logger.warn('Erro em escrita DOM:', error);
                }
            });
        });
    }

    /**
     * Detecta se é operação de leitura
     * @private
     */
    _isReadOperation(fn) {
        const fnStr = fn.toString();
        const readProps = ['offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight',
            'scrollTop', 'scrollLeft', 'getBoundingClientRect'];

        return readProps.some(prop => fnStr.includes(prop));
    }

    /**
     * Document Fragment para inserções múltiplas
     * @param {Array} items - Itens a inserir
     * @param {Function} createFn - Função que cria elemento
     * @returns {DocumentFragment} Fragment com elementos
     */
    createFragment(items, createFn) {
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const element = createFn(item);
            if (element) {
                fragment.appendChild(element);
            }
        });

        return fragment;
    }

    /**
     * Inserção otimizada de múltiplos elementos
     * @param {HTMLElement} container - Container
     * @param {Array} items - Itens
     * @param {Function} createFn - Função criadora
     */
    insertMany(container, items, createFn) {
        const fragment = this.createFragment(items, createFn);
        container.appendChild(fragment);
    }

    /**
     * Atualização otimizada de texto
     * @param {HTMLElement} element - Elemento
     * @param {string} text - Novo texto
     */
    setText(element, text) {
        if (element.textContent !== text) {
            element.textContent = text;
        }
    }

    /**
     * Atualização otimizada de atributo
     * @param {HTMLElement} element - Elemento
     * @param {string} attr - Atributo
     * @param {string} value - Valor
     */
    setAttribute(element, attr, value) {
        if (element.getAttribute(attr) !== value) {
            element.setAttribute(attr, value);
        }
    }

    /**
     * Toggle de classe otimizado
     * @param {HTMLElement} element - Elemento
     * @param {string} className - Classe
     * @param {boolean} force - Forçar estado
     */
    toggleClass(element, className, force) {
        if (force !== undefined) {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
    }

    /**
     * Limpa container de forma otimizada
     * @param {HTMLElement} container - Container a limpar
     */
    clearContainer(container) {
        // Mais rápido que innerHTML = ''
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    /**
     * Clona elemento profundamente sem event listeners
     * @param {HTMLElement} element - Elemento a clonar
     * @returns {HTMLElement} Clone limpo
     */
    cleanClone(element) {
        return element.cloneNode(true);
    }
}

/**
 * Virtual Scroller - Para listas grandes
 */
export class VirtualScroller {
    constructor(container, options = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight || 50;
        this.buffer = options.buffer || 5;
        this.renderFn = options.renderFn;

        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this._setupScroll();
    }

    /**
     * Define itens
     * @param {Array} items - Itens a renderizar
     */
    setItems(items) {
        this.items = items;
        this._updateVirtualScroll();
    }

    /**
     * Setup de scroll listener
     * @private
     */
    _setupScroll() {
        const handleScroll = throttle(() => {
            this._updateVirtualScroll();
        }, 16);

        this.container.addEventListener('scroll', handleScroll);
    }

    /**
     * Atualiza scroll virtual
     * @private
     */
    _updateVirtualScroll() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;

        // Calcular índices visíveis
        this.visibleStart = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
        this.visibleEnd = Math.min(
            this.items.length,
            Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer
        );

        this._render();
    }

    /**
     * Renderiza apenas itens visíveis
     * @private
     */
    _render() {
        if (!this.renderFn) return;

        // Limpar container
        this.container.innerHTML = '';

        // Spacer superior
        const topSpacer = document.createElement('div');
        topSpacer.style.height = `${this.visibleStart * this.itemHeight}px`;
        this.container.appendChild(topSpacer);

        // Renderizar itens visíveis
        const fragment = document.createDocumentFragment();
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const element = this.renderFn(this.items[i], i);
            if (element) {
                fragment.appendChild(element);
            }
        }
        this.container.appendChild(fragment);

        // Spacer inferior
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.height = `${(this.items.length - this.visibleEnd) * this.itemHeight}px`;
        this.container.appendChild(bottomSpacer);
    }
}

/**
 * Helpers de performance DOM
 */
export const DOMHelpers = {
    /**
     * Esconde elemento sem remover do DOM
     */
    hide(element) {
        element.style.display = 'none';
    },

    /**
     * Mostra elemento
     */
    show(element, display = 'block') {
        element.style.display = display;
    },

    /**
     * Verifica se elemento está visível
     */
    isVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    },

    /**
     * Obtém dimensões de forma otimizada
     */
    getDimensions(element) {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        };
    }
};

// Singleton
export const domOptimizer = new DOMOptimizer();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.domOptimizer = domOptimizer;
    window.VirtualScroller = VirtualScroller;
    window.DOMHelpers = DOMHelpers;
}

export default {
    domOptimizer,
    VirtualScroller,
    DOMHelpers
};
