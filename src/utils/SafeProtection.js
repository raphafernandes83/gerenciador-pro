// ================================================================
// SafeProtection.js - Wrappers seguros para timers/paginação
// ================================================================

(function initSafeProtection() {
    try {
        if (typeof window === 'undefined') return;
        if (window.safeProtection && typeof window.safeProtection.safeSetTimeout === 'function')
            return;

        const safeSetTimeout = (fn, delay, ...args) => {
            try {
                return window.setTimeout(fn, delay, ...args);
            } catch (_) {
                return window.setTimeout(() => {}, delay);
            }
        };

        const safeSetInterval = (fn, delay, ...args) => {
            try {
                return window.setInterval(fn, delay, ...args);
            } catch (_) {
                return window.setInterval(() => {}, delay);
            }
        };

        const clearSafeTimeout = (id) => {
            try {
                window.clearTimeout(id);
            } catch (_) {}
        };

        const clearSafeInterval = (id) => {
            try {
                window.clearInterval(id);
            } catch (_) {}
        };

        window.safeProtection = {
            safeSetTimeout,
            safeSetInterval,
            clearSafeTimeout,
            clearSafeInterval,
        };
    } catch (_) {
        // Silencioso: fallback natural aos timers nativos
    }
})();
