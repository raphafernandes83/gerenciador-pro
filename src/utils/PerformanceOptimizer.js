/**
 * @fileoverview Otimizador de performance
 * Implementa debouncing, throttling, lazy loading e caching
 */

import { logger } from './Logger.js';

/**
 * Debounce - Executa função após período de inatividade
 * @param {Function} func - Função a executar
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
export function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - Limita execução a uma vez por intervalo
 * @param {Function} func - Função a executar
 * @param {number} limit - Intervalo mínimo em ms
 * @returns {Function} Função com throttle
 */
export function throttle(func, limit = 300) {
    let inThrottle;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * RequestAnimationFrame throttle - Para animações suaves
 * @param {Function} func - Função a executar
 * @returns {Function} Função otimizada
 */
export function rafThrottle(func) {
    let rafId = null;

    return function (...args) {
        if (rafId) return;

        rafId = requestAnimationFrame(() => {
            func.apply(this, args);
            rafId = null;
        });
    };
}

/**
 * Lazy loader - Carrega módulos sob demanda
 */
export class LazyLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    /**
     * Carrega módulo lazy
     * @param {string} modulePath - Caminho do módulo
     * @returns {Promise} Módulo carregado
     */
    async load(modulePath) {
        // Retorna do cache se já carregado
        if (this.cache.has(modulePath)) {
            return this.cache.get(modulePath);
        }

        // Aguarda se já está carregando
        if (this.loading.has(modulePath)) {
            return this.loading.get(modulePath);
        }

        // Inicia carregamento
        const loadPromise = import(modulePath)
            .then(module => {
                this.cache.set(modulePath, module);
                this.loading.delete(modulePath);
                logger.debug(`✅ Módulo carregado (lazy): ${modulePath}`);
                return module;
            })
            .catch(error => {
                this.loading.delete(modulePath);
                logger.error(`Erro ao carregar módulo lazy: ${modulePath}`, error);
                throw error;
            });

        this.loading.set(modulePath, loadPromise);
        return loadPromise;
    }

    /**
     * Pré-carrega módulos
     * @param {Array<string>} paths - Caminhos dos módulos
     */
    async preload(paths) {
        logger.info(`⚡ Pré-carregando ${paths.length} módulos...`);

        const promises = paths.map(path => this.load(path).catch(() => null));
        await Promise.all(promises);

        logger.info(`✅ Pré-carregamento concluído`);
    }

    /**
     * Limpa cache
     */
    clear() {
        this.cache.clear();
        this.loading.clear();
    }
}

/**
 * Cache de resultados de funções (memoização avançada)
 */
export class ResultCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Obtém do cache ou executa
     * @param {string} key - Chave do cache
     * @param {Function} func - Função a executar se não estiver em cache
     * @returns {*} Resultado
     */
    getOrCompute(key, func) {
        if (this.cache.has(key)) {
            this.hits++;
            return this.cache.get(key);
        }

        this.misses++;
        const result = func();
        this.set(key, result);
        return result;
    }

    /**
     * Define valor no cache
     */
    set(key, value) {
        // LRU: Remove mais antigo se atingir limite
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    /**
     * Limpa cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Estatísticas
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
}

/**
 * Batch processor - Agrupa operações
 */
export class BatchProcessor {
    constructor(processFn, delay = 100) {
        this.processFn = processFn;
        this.delay = delay;
        this.queue = [];
        this.timeoutId = null;
    }

    /**
     * Adiciona item ao batch
     */
    add(item) {
        this.queue.push(item);

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => {
            this.flush();
        }, this.delay);
    }

    /**
     * Processa batch imediatamente
     */
    flush() {
        if (this.queue.length === 0) return;

        const items = [...this.queue];
        this.queue = [];
        this.timeoutId = null;

        try {
            this.processFn(items);
        } catch (error) {
            logger.error('Erro ao processar batch:', error);
        }
    }

    /**
     * Limpa fila
     */
    clear() {
        this.queue = [];
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

/**
 * Intersection Observer helper - Para lazy loading de elementos
 */
export function createIntersectionObserver(callback, options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
}

/**
 * Otimiza array operations
 */
export const ArrayOptimizer = {
    /**
     * Chunking - Divide array em pedaços
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    /**
     * Processa array em chunks com delay
     */
    async processChunked(array, processFn, chunkSize = 100, delay = 10) {
        const chunks = this.chunk(array, chunkSize);

        for (const chunk of chunks) {
            processFn(chunk);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    },

    /**
     * Remove duplicatas (otimizado)
     */
    unique(array, keyFn = null) {
        if (!keyFn) {
            return [...new Set(array)];
        }

        const seen = new Set();
        return array.filter(item => {
            const key = keyFn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
};

// Singleton
export const lazyLoader = new LazyLoader();
export const resultCache = new ResultCache();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.performanceOptimizer = {
        debounce,
        throttle,
        rafThrottle,
        lazyLoader,
        resultCache,
        BatchProcessor,
        ArrayOptimizer,
        createIntersectionObserver
    };
}

export default {
    debounce,
    throttle,
    rafThrottle,
    lazyLoader,
    resultCache,
    BatchProcessor,
    ArrayOptimizer,
    createIntersectionObserver
};
