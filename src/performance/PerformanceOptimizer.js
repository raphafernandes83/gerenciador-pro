/**
 * 🚀 OTIMIZADOR DE PERFORMANCE
 * Sistema avançado de cache, memoização e otimizações para alta performance
 *
 * @module PerformanceOptimizer
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

/**
 * Configurações de cache por tipo de operação
 */
export const CACHE_CONFIG = {
    CURRENCY_FORMAT: {
        maxSize: 1000,
        ttl: 300000, // 5 minutos
        keyGenerator: (value) => `currency_${value}`,
    },

    DOM_QUERIES: {
        maxSize: 500,
        ttl: 600000, // 10 minutos
        keyGenerator: (selector) => `dom_${selector}`,
    },

    CALCULATIONS: {
        maxSize: 2000,
        ttl: 60000, // 1 minuto
        keyGenerator: (input) => `calc_${JSON.stringify(input)}`,
    },

    COMPONENT_RENDERS: {
        maxSize: 100,
        ttl: 30000, // 30 segundos
        keyGenerator: (component, props) => `render_${component}_${JSON.stringify(props)}`,
    },
};

/**
 * Cache inteligente com TTL e LRU
 */
export class SmartCache {
    constructor(config = {}) {
        this.maxSize = config.maxSize || 1000;
        this.ttl = config.ttl || 300000;
        this.keyGenerator = config.keyGenerator || ((key) => String(key));

        this.cache = new Map();
        this.accessOrder = new Map();
        this.hitCount = 0;
        this.missCount = 0;
        this.evictions = 0;

        // Cleanup interval para TTL
        this.cleanupInterval = setInterval(() => this._cleanup(), this.ttl / 4);
    }

    /**
     * Obtém valor do cache
     *
     * @param {*} key - Chave do cache
     * @returns {*} Valor cached ou undefined
     */
    get(key) {
        const cacheKey = this.keyGenerator(key);
        const entry = this.cache.get(cacheKey);

        if (!entry) {
            this.missCount++;
            return undefined;
        }

        // Verifica TTL
        if (Date.now() > entry.expiry) {
            this.cache.delete(cacheKey);
            this.accessOrder.delete(cacheKey);
            this.missCount++;
            return undefined;
        }

        // Atualiza ordem de acesso (LRU)
        this.accessOrder.set(cacheKey, Date.now());
        this.hitCount++;

        return entry.value;
    }

    /**
     * Define valor no cache
     *
     * @param {*} key - Chave do cache
     * @param {*} value - Valor a ser cached
     */
    set(key, value) {
        const cacheKey = this.keyGenerator(key);
        const now = Date.now();

        // Remove se já existe
        if (this.cache.has(cacheKey)) {
            this.cache.delete(cacheKey);
            this.accessOrder.delete(cacheKey);
        }

        // Verifica limite de tamanho
        if (this.cache.size >= this.maxSize) {
            this._evictLRU();
        }

        this.cache.set(cacheKey, {
            value,
            expiry: now + this.ttl,
            created: now,
        });

        this.accessOrder.set(cacheKey, now);
    }

    /**
     * Remove entrada do cache
     *
     * @param {*} key - Chave a ser removida
     */
    delete(key) {
        const cacheKey = this.keyGenerator(key);
        this.cache.delete(cacheKey);
        this.accessOrder.delete(cacheKey);
    }

    /**
     * Limpa cache completamente
     */
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
        this.hitCount = 0;
        this.missCount = 0;
        this.evictions = 0;
    }

    /**
     * Obtém estatísticas do cache
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getStats() {
        const total = this.hitCount + this.missCount;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: total > 0 ? ((this.hitCount / total) * 100).toFixed(2) : 0,
            evictions: this.evictions,
            memoryUsage: this._estimateMemoryUsage(),
        };
    }

    /**
     * Remove entradas LRU quando cache está cheio
     *
     * @private
     */
    _evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, accessTime] of this.accessOrder) {
            if (accessTime < oldestTime) {
                oldestTime = accessTime;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessOrder.delete(oldestKey);
            this.evictions++;
        }
    }

    /**
     * Remove entradas expiradas
     *
     * @private
     */
    _cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, entry] of this.cache) {
            if (now > entry.expiry) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        });
    }

    /**
     * Estima uso de memória
     *
     * @private
     */
    _estimateMemoryUsage() {
        let bytes = 0;

        for (const [key, entry] of this.cache) {
            bytes += this._getObjectSize(key) + this._getObjectSize(entry);
        }

        return bytes;
    }

    /**
     * Estima tamanho do objeto em bytes
     *
     * @private
     */
    _getObjectSize(obj) {
        return JSON.stringify(obj).length * 2; // Aproximação UTF-16
    }

    /**
     * Destrói cache e limpa recursos
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

/**
 * Memoização avançada com configuração personalizada
 */
export class Memoizer {
    constructor(config = {}) {
        this.cache = new SmartCache(config);
        this.computations = 0;
        this.cacheHits = 0;
    }

    /**
     * Cria função memoizada
     *
     * @param {Function} fn - Função a ser memoizada
     * @param {Function} keyResolver - Função para gerar chave do cache
     * @returns {Function} Função memoizada
     */
    memoize(fn, keyResolver = (...args) => JSON.stringify(args)) {
        return (...args) => {
            const key = keyResolver(...args);
            let result = this.cache.get(key);

            if (result !== undefined) {
                this.cacheHits++;
                return result;
            }

            result = fn(...args);
            this.cache.set(key, result);
            this.computations++;

            return result;
        };
    }

    /**
     * Obtém estatísticas de memoização
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getStats() {
        const cacheStats = this.cache.getStats();

        return {
            ...cacheStats,
            computations: this.computations,
            memoizationHits: this.cacheHits,
            computationSavings:
                this.cacheHits > 0
                    ? ((this.cacheHits / (this.computations + this.cacheHits)) * 100).toFixed(2)
                    : 0,
        };
    }
}

/**
 * Batcher para operações DOM
 */
export class DOMBatcher {
    constructor(config = {}) {
        this.batchSize = config.batchSize || 50;
        this.flushDelay = config.flushDelay || 16; // ~60fps

        this.readQueue = [];
        this.writeQueue = [];
        this.isScheduled = false;
    }

    /**
     * Adiciona operação de leitura DOM ao batch
     *
     * @param {Function} readFn - Função de leitura
     * @returns {Promise} Promise que resolve com resultado
     */
    read(readFn) {
        return new Promise((resolve, reject) => {
            this.readQueue.push({ fn: readFn, resolve, reject });
            this._scheduleFlush();
        });
    }

    /**
     * Adiciona operação de escrita DOM ao batch
     *
     * @param {Function} writeFn - Função de escrita
     * @returns {Promise} Promise que resolve quando executado
     */
    write(writeFn) {
        return new Promise((resolve, reject) => {
            this.writeQueue.push({ fn: writeFn, resolve, reject });
            this._scheduleFlush();
        });
    }

    /**
     * Força flush imediato das operações
     */
    flush() {
        if (this.isScheduled) {
            this._executeBatch();
        }
    }

    /**
     * Agenda flush para próximo frame
     *
     * @private
     */
    _scheduleFlush() {
        if (!this.isScheduled) {
            this.isScheduled = true;
            requestAnimationFrame(() => this._executeBatch());
        }
    }

    /**
     * Executa batch de operações
     *
     * @private
     */
    _executeBatch() {
        this.isScheduled = false;

        // Executa todas as leituras primeiro (para evitar layout thrashing)
        const readOps = [...this.readQueue];
        this.readQueue = [];

        readOps.forEach(({ fn, resolve, reject }) => {
            try {
                const result = fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        // Executa todas as escritas em seguida
        const writeOps = [...this.writeQueue];
        this.writeQueue = [];

        writeOps.forEach(({ fn, resolve, reject }) => {
            try {
                const result = fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
}

/**
 * Otimizador principal que combina todas as estratégias
 */
export class PerformanceOptimizer {
    constructor(config = {}) {
        this.caches = {
            currency: new SmartCache(CACHE_CONFIG.CURRENCY_FORMAT),
            dom: new SmartCache(CACHE_CONFIG.DOM_QUERIES),
            calculations: new SmartCache(CACHE_CONFIG.CALCULATIONS),
            renders: new SmartCache(CACHE_CONFIG.COMPONENT_RENDERS),
        };

        this.memoizers = {
            currency: new Memoizer(CACHE_CONFIG.CURRENCY_FORMAT),
            calculations: new Memoizer(CACHE_CONFIG.CALCULATIONS),
        };

        this.domBatcher = new DOMBatcher(config.batcher);

        this.metrics = {
            startTime: Date.now(),
            methodCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
        };
    }

    /**
     * Obtém cache específico
     *
     * @param {string} type - Tipo de cache
     * @returns {SmartCache} Cache específico
     */
    getCache(type) {
        return this.caches[type];
    }

    /**
     * Obtém memoizer específico
     *
     * @param {string} type - Tipo de memoizer
     * @returns {Memoizer} Memoizer específico
     */
    getMemoizer(type) {
        return this.memoizers[type];
    }

    /**
     * Obtém batcher DOM
     *
     * @returns {DOMBatcher} Batcher DOM
     */
    getDOMBatcher() {
        return this.domBatcher;
    }

    /**
     * Cria wrapper otimizado para método
     *
     * @param {Function} fn - Função a ser otimizada
     * @param {Object} options - Opções de otimização
     * @returns {Function} Função otimizada
     */
    optimize(fn, options = {}) {
        const { cacheType, memoize = false, batchDOM = false, measurePerformance = true } = options;

        let optimizedFn = fn;

        // Aplica memoização se solicitado
        if (memoize && this.memoizers[cacheType]) {
            optimizedFn = this.memoizers[cacheType].memoize(optimizedFn);
        }

        // Aplica batching DOM se solicitado
        if (batchDOM) {
            const originalFn = optimizedFn;
            optimizedFn = (...args) => {
                return this.domBatcher.write(() => originalFn(...args));
            };
        }

        // Aplica medição de performance se solicitado
        if (measurePerformance) {
            const originalFn = optimizedFn;
            optimizedFn = (...args) => {
                const start = performance.now();
                const result = originalFn(...args);
                const end = performance.now();

                this.metrics.methodCalls++;

                if (end - start > 16) {
                    // Mais que um frame
                    console.warn(
                        `Operação lenta detectada: ${fn.name} - ${(end - start).toFixed(2)}ms`
                    );
                }

                return result;
            };
        }

        return optimizedFn;
    }

    /**
     * Obtém estatísticas completas de performance
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getPerformanceStats() {
        const cacheStats = {};
        for (const [type, cache] of Object.entries(this.caches)) {
            cacheStats[type] = cache.getStats();
        }

        const memoizerStats = {};
        for (const [type, memoizer] of Object.entries(this.memoizers)) {
            memoizerStats[type] = memoizer.getStats();
        }

        return {
            uptime: Date.now() - this.metrics.startTime,
            methodCalls: this.metrics.methodCalls,
            caches: cacheStats,
            memoizers: memoizerStats,
            domBatcher: {
                readQueueSize: this.domBatcher.readQueue.length,
                writeQueueSize: this.domBatcher.writeQueue.length,
                isScheduled: this.domBatcher.isScheduled,
            },
        };
    }

    /**
     * Limpa todos os caches e redefine métricas
     */
    clearAll() {
        Object.values(this.caches).forEach((cache) => cache.clear());
        Object.values(this.memoizers).forEach((memoizer) => memoizer.cache.clear());

        this.metrics = {
            startTime: Date.now(),
            methodCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
        };
    }

    /**
     * Destrói otimizador e libera recursos
     */
    destroy() {
        Object.values(this.caches).forEach((cache) => cache.destroy());
        Object.values(this.memoizers).forEach((memoizer) => memoizer.cache.destroy());
        this.clearAll();
    }
}

/**
 * Instância global do otimizador
 */
export const globalPerformanceOptimizer = new PerformanceOptimizer();

/**
 * Decorator para otimização automática de métodos
 */
export const OptimizePerformance = (options = {}) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = globalPerformanceOptimizer.optimize(originalMethod, options);

        return descriptor;
    };
};

export default {
    CACHE_CONFIG,
    SmartCache,
    Memoizer,
    DOMBatcher,
    PerformanceOptimizer,
    globalPerformanceOptimizer,
    OptimizePerformance,
};
