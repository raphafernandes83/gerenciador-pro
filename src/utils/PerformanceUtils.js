/**
 * 🚀 UTILITIES DE PERFORMANCE
 * Funções otimizadas para controle de performance e timing
 *
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

/**
 * Aplica debounce a uma função para evitar execuções desnecessárias
 *
 * @param {Function} func - Função a ser executada com debounce
 * @param {number} wait - Tempo de espera em milissegundos
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.immediate - Se deve executar imediatamente na primeira chamada
 * @param {number} options.maxWait - Tempo máximo de espera antes de forçar execução
 * @returns {Function} Função com debounce aplicado
 *
 * @example
 * const debouncedSearch = debounce(searchFunction, 300, { immediate: false });
 * debouncedSearch('query');
 */
export function debounce(func, wait, options = {}) {
    // Validação de entrada
    if (typeof func !== 'function') {
        throw new TypeError('Expected first argument to be a function');
    }

    if (typeof wait !== 'number' || wait < 0) {
        throw new TypeError('Expected second argument to be a non-negative number');
    }

    const { immediate = false, maxWait = null } = options;

    let timeout = null;
    let maxTimeout = null;
    let lastCallTime = null;
    let lastInvokeTime = 0;
    let lastArgs = null;
    let lastThis = null;
    let result = null;

    /**
     * Invoca a função original
     */
    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = null;
        lastThis = null;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);

        return result;
    }

    /**
     * Determina se deve invocar a função baseado no timing
     */
    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === null ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxWait !== null && timeSinceLastInvoke >= maxWait)
        );
    }

    /**
     * Calcula o delay restante
     */
    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxWait !== null
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }

    /**
     * Execução com timeout
     */
    function timerExpired() {
        const time = Date.now();

        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }

        // Reagenda se ainda há tempo restante
        const timeRemaining = remainingWait(time);
        timeout = setTimeout(timerExpired, timeRemaining);

        return result;
    }

    /**
     * Execução na borda trailing (final)
     */
    function trailingEdge(time) {
        timeout = null;

        if (lastArgs) {
            return invokeFunc(time);
        }

        lastArgs = null;
        lastThis = null;

        return result;
    }

    /**
     * Cancela execução pendente
     */
    function cancel() {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }

        if (maxTimeout !== null) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
        }

        lastInvokeTime = 0;
        lastArgs = null;
        lastCallTime = null;
        lastThis = null;
    }

    /**
     * Força execução imediata
     */
    function flush() {
        return timeout !== null ? trailingEdge(Date.now()) : result;
    }

    /**
     * Verifica se há execução pendente
     */
    function pending() {
        return timeout !== null;
    }

    // Função principal com debounce
    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeout === null) {
                // Primeira chamada
                if (immediate) {
                    const callNow = !timeout;
                    timeout = setTimeout(() => {
                        timeout = null;
                    }, wait);

                    if (callNow) {
                        result = invokeFunc(time);
                    }

                    return result;
                }

                // Agenda execução
                lastInvokeTime = time;
                timeout = setTimeout(timerExpired, wait);

                if (maxWait !== null) {
                    maxTimeout = setTimeout(() => {
                        if (lastArgs) {
                            trailingEdge(Date.now());
                        }
                    }, maxWait);
                }

                return result;
            }

            return trailingEdge(time);
        }

        if (timeout === null) {
            timeout = setTimeout(timerExpired, wait);
        }

        return result;
    }

    // Anexa métodos utilitários
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
}

/**
 * Aplica throttle a uma função para limitar execuções por tempo
 *
 * @param {Function} func - Função a ser executada com throttle
 * @param {number} limit - Limite de tempo em milissegundos
 * @returns {Function} Função com throttle aplicado
 *
 * @example
 * const throttledScroll = throttle(onScrollHandler, 16); // ~60fps
 */
export function throttle(func, limit) {
    if (typeof func !== 'function') {
        throw new TypeError('Expected first argument to be a function');
    }

    if (typeof limit !== 'number' || limit < 0) {
        throw new TypeError('Expected second argument to be a non-negative number');
    }

    let lastCall = 0;
    let timeoutId = null;

    return function throttled(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        const execute = () => {
            lastCall = now;
            return func.apply(this, args);
        };

        if (timeSinceLastCall >= limit) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            return execute();
        }

        if (!timeoutId) {
            timeoutId = setTimeout(() => {
                timeoutId = null;
                execute();
            }, limit - timeSinceLastCall);
        }
    };
}

/**
 * Mede tempo de execução de uma função
 *
 * @param {Function} func - Função para medir
 * @param {string} label - Label para identificação no log
 * @returns {Function} Função wrapper que mede tempo
 */
export function measurePerformance(func, label = 'Function') {
    if (typeof func !== 'function') {
        throw new TypeError('Expected first argument to be a function');
    }

    return function measured(...args) {
        const startTime = performance.now();

        try {
            const result = func.apply(this, args);

            // Handle promises
            if (result && typeof result.then === 'function') {
                return result.finally(() => {
                    const endTime = performance.now();
                    console.log(`⚡ ${label}: ${(endTime - startTime).toFixed(2)}ms`);
                });
            }

            const endTime = performance.now();
            console.log(`⚡ ${label}: ${(endTime - startTime).toFixed(2)}ms`);

            return result;
        } catch (error) {
            const endTime = performance.now();
            console.error(`❌ ${label} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
            throw error;
        }
    };
}

/**
 * Cria um rate limiter para controlar frequência de execuções
 *
 * @param {number} maxCalls - Máximo de chamadas permitidas
 * @param {number} window - Janela de tempo em milissegundos
 * @returns {Function} Função que verifica se chamada é permitida
 */
export function createRateLimiter(maxCalls, window) {
    if (typeof maxCalls !== 'number' || maxCalls <= 0) {
        throw new TypeError('Expected maxCalls to be a positive number');
    }

    if (typeof window !== 'number' || window <= 0) {
        throw new TypeError('Expected window to be a positive number');
    }

    const calls = [];

    return function rateLimited(func) {
        const now = Date.now();

        // Remove chamadas antigas fora da janela
        while (calls.length > 0 && calls[0] <= now - window) {
            calls.shift();
        }

        // Verifica se pode executar
        if (calls.length < maxCalls) {
            calls.push(now);
            return func();
        }

        throw new Error(`Rate limit exceeded: ${maxCalls} calls per ${window}ms`);
    };
}

/**
 * Constantes de timing para uso comum
 */
export const TIMING = {
    DEBOUNCE: {
        FAST: 50,
        NORMAL: 100,
        SLOW: 300,
        SEARCH: 300,
        RESIZE: 100,
        SCROLL: 16, // ~60fps
    },
    THROTTLE: {
        ANIMATION: 16, // 60fps
        SCROLL: 16,
        RESIZE: 100,
        NETWORK: 1000,
    },
};

/**
 * Função memoize para compatibilidade
 */
export function memoize(fn, keyResolver = (...args) => JSON.stringify(args)) {
    const cache = new Map();

    function memoized(...args) {
        const key = keyResolver(...args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    }

    // Adiciona métodos utilitários
    memoized.clearCache = () => {
        cache.clear();
    };

    memoized.getCacheSize = () => {
        return cache.size;
    };

    memoized.deleteFromCache = (key) => {
        return cache.delete(key);
    };

    return memoized;
}

export default {
    debounce,
    throttle,
    measurePerformance,
    createRateLimiter,
    memoize,
    TIMING,
};

/**
 * Memoize especializado para funções que recebem um array como primeiro argumento.
 * Usa uma assinatura leve baseada em (referência do array, length e último elemento)
 * para detectar alterações comuns (append/push) sem custo alto de serialização.
 */
export function memoizeByArraySignature(fn) {
    let lastArrayRef = null;
    let lastLength = -1;
    let lastLastElem = null;
    let lastResult = null;
    return function memoized(arrayArg, ...rest) {
        const sameRef = arrayArg === lastArrayRef;
        const len = Array.isArray(arrayArg) ? arrayArg.length : -1;
        const lastElem = len > 0 ? arrayArg[len - 1] : null;
        if (sameRef && len === lastLength && lastElem === lastLastElem) {
            return lastResult;
        }
        const result = fn.apply(this, [arrayArg, ...rest]);
        lastArrayRef = arrayArg;
        lastLength = len;
        lastLastElem = lastElem;
        lastResult = result;
        return result;
    };
}
