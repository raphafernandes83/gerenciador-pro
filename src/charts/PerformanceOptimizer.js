/**
 * @fileoverview Otimizador de Performance Avançado
 * @description Sistema de otimização inteligente com cache, lazy loading e debounce
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// CONSTANTES DE PERFORMANCE
// ============================================================================

const PERFORMANCE_CONFIG = Object.freeze({
    CACHE: {
        MAX_SIZE: 100,
        TTL: 30000, // 30 segundos
        CLEANUP_INTERVAL: 60000 // 1 minuto
    },
    
    DEBOUNCE: {
        RENDER: 100,
        UPDATE: 50,
        RESIZE: 250
    },
    
    LAZY_LOADING: {
        INTERSECTION_THRESHOLD: 0.1,
        ROOT_MARGIN: '50px'
    },
    
    MONITORING: {
        FPS_THRESHOLD: 30,
        MEMORY_THRESHOLD: 0.8,
        RENDER_TIME_THRESHOLD: 16.67 // 60fps
    }
});

// ============================================================================
// CACHE INTELIGENTE
// ============================================================================

class IntelligentCache {
    constructor(maxSize = PERFORMANCE_CONFIG.CACHE.MAX_SIZE) {
        this.cache = new Map();
        this.accessTimes = new Map();
        this.maxSize = maxSize;
        this.hitCount = 0;
        this.missCount = 0;
        
        this._startCleanupTimer();
    }
    
    set(key, value, ttl = PERFORMANCE_CONFIG.CACHE.TTL) {
        // Remove item mais antigo se cache estiver cheio
        if (this.cache.size >= this.maxSize) {
            this._evictLRU();
        }
        
        const item = {
            value,
            timestamp: Date.now(),
            ttl,
            accessCount: 0
        };
        
        this.cache.set(key, item);
        this.accessTimes.set(key, Date.now());
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.missCount++;
            return null;
        }
        
        // Verifica se item expirou
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.accessTimes.delete(key);
            this.missCount++;
            return null;
        }
        
        // Atualiza estatísticas de acesso
        item.accessCount++;
        this.accessTimes.set(key, Date.now());
        this.hitCount++;
        
        return item.value;
    }
    
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Verifica se não expirou
        return Date.now() - item.timestamp <= item.ttl;
    }
    
    delete(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
    }
    
    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }
    
    _evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.delete(oldestKey);
        }
    }
    
    _startCleanupTimer() {
        setInterval(() => {
            const now = Date.now();
            const keysToDelete = [];
            
            for (const [key, item] of this.cache) {
                if (now - item.timestamp > item.ttl) {
                    keysToDelete.push(key);
                }
            }
            
            keysToDelete.forEach(key => this.delete(key));
            
            if (keysToDelete.length > 0) {
                console.log(`🧹 Cache cleanup: ${keysToDelete.length} itens removidos`);
            }
        }, PERFORMANCE_CONFIG.CACHE.CLEANUP_INTERVAL);
    }
    
    getStats() {
        const total = this.hitCount + this.missCount;
        const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: hitRate.toFixed(2) + '%',
            memoryUsage: this._estimateMemoryUsage()
        };
    }
    
    _estimateMemoryUsage() {
        let size = 0;
        for (const [key, item] of this.cache) {
            size += JSON.stringify(key).length + JSON.stringify(item.value).length;
        }
        return size;
    }
}

// ============================================================================
// DEBOUNCER AVANÇADO
// ============================================================================

class AdvancedDebouncer {
    constructor() {
        this.timers = new Map();
        this.immediateQueue = new Set();
    }
    
    debounce(key, func, delay = 100, immediate = false) {
        // Cancela timer anterior se existir
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }
        
        if (immediate && !this.immediateQueue.has(key)) {
            this.immediateQueue.add(key);
            func();
            
            // Remove da queue após delay
            setTimeout(() => {
                this.immediateQueue.delete(key);
            }, delay);
            
            return;
        }
        
        const timer = setTimeout(() => {
            this.timers.delete(key);
            this.immediateQueue.delete(key);
            func();
        }, delay);
        
        this.timers.set(key, timer);
    }
    
    cancel(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.immediateQueue.delete(key);
    }
    
    cancelAll() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.immediateQueue.clear();
    }
    
    getPendingCount() {
        return this.timers.size;
    }
}

// ============================================================================
// LAZY LOADER
// ============================================================================

class LazyLoader {
    constructor() {
        this.observer = null;
        this.loadedElements = new WeakSet();
        this.loadingQueue = new Map();
        
        this._initializeObserver();
    }
    
    _initializeObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this._loadElement(entry.target);
                        }
                    });
                },
                {
                    threshold: PERFORMANCE_CONFIG.LAZY_LOADING.INTERSECTION_THRESHOLD,
                    rootMargin: PERFORMANCE_CONFIG.LAZY_LOADING.ROOT_MARGIN
                }
            );
        }
    }
    
    observe(element, loadFunction) {
        if (!this.observer || this.loadedElements.has(element)) {
            return;
        }
        
        this.loadingQueue.set(element, loadFunction);
        this.observer.observe(element);
    }
    
    _loadElement(element) {
        const loadFunction = this.loadingQueue.get(element);
        
        if (loadFunction && !this.loadedElements.has(element)) {
            try {
                loadFunction(element);
                this.loadedElements.add(element);
                this.loadingQueue.delete(element);
                
                if (this.observer) {
                    this.observer.unobserve(element);
                }
                
                console.log('🚀 Elemento carregado via lazy loading:', element.id || element.className);
            } catch (error) {
                console.error('❌ Erro no lazy loading:', error);
            }
        }
    }
    
    forceLoad(element) {
        if (this.loadingQueue.has(element)) {
            this._loadElement(element);
        }
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.loadingQueue.clear();
    }
}

// ============================================================================
// MONITOR DE PERFORMANCE
// ============================================================================

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            renderTimes: [],
            memoryUsage: [],
            cacheHitRate: []
        };
        
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this._startFPSMonitoring();
        this._startMemoryMonitoring();
        
        console.log('📊 Monitoramento de performance iniciado');
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('📊 Monitoramento de performance parado');
    }
    
    _startFPSMonitoring() {
        const measureFPS = () => {
            if (!this.isMonitoring) return;
            
            const now = performance.now();
            this.frameCount++;
            
            if (now - this.lastFrameTime >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
                this.metrics.fps.push({ timestamp: now, value: fps });
                
                // Mantém apenas últimas 60 medições
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
                
                if (fps < PERFORMANCE_CONFIG.MONITORING.FPS_THRESHOLD) {
                    console.warn(`⚠️ FPS baixo: ${fps}`);
                    this._triggerOptimization('low_fps', fps);
                }
                
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    _startMemoryMonitoring() {
        if (!('memory' in performance)) return;
        
        this.monitoringInterval = setInterval(() => {
            if (!this.isMonitoring) return;
            
            const memory = performance.memory;
            const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
            
            this.metrics.memoryUsage.push({
                timestamp: performance.now(),
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                usage: usage
            });
            
            // Mantém apenas últimas 60 medições
            if (this.metrics.memoryUsage.length > 60) {
                this.metrics.memoryUsage.shift();
            }
            
            if (usage > PERFORMANCE_CONFIG.MONITORING.MEMORY_THRESHOLD) {
                console.warn(`⚠️ Alto uso de memória: ${(usage * 100).toFixed(1)}%`);
                this._triggerOptimization('high_memory', usage);
            }
        }, 5000);
    }
    
    recordRenderTime(operation, duration) {
        this.metrics.renderTimes.push({
            timestamp: performance.now(),
            operation,
            duration
        });
        
        // Mantém apenas últimas 100 medições
        if (this.metrics.renderTimes.length > 100) {
            this.metrics.renderTimes.shift();
        }
        
        if (duration > PERFORMANCE_CONFIG.MONITORING.RENDER_TIME_THRESHOLD) {
            console.warn(`⚠️ Renderização lenta: ${operation} - ${duration.toFixed(2)}ms`);
        }
    }
    
    _triggerOptimization(reason, value) {
        // Emite evento para otimizações automáticas
        const event = new CustomEvent('performanceOptimizationNeeded', {
            detail: { reason, value, timestamp: performance.now() }
        });
        
        window.dispatchEvent(event);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            averageFPS: this._calculateAverage(this.metrics.fps.map(m => m.value)),
            averageRenderTime: this._calculateAverage(this.metrics.renderTimes.map(m => m.duration)),
            currentMemoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]?.usage || 0
        };
    }
    
    _calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
}

// ============================================================================
// OTIMIZADOR PRINCIPAL
// ============================================================================

export class PerformanceOptimizer {
    constructor() {
        this.cache = new IntelligentCache();
        this.debouncer = new AdvancedDebouncer();
        this.lazyLoader = new LazyLoader();
        this.monitor = new PerformanceMonitor();
        
        this.optimizationStrategies = new Map();
        this._initializeStrategies();
        this._setupEventListeners();
        
        console.log('⚡ Otimizador de Performance inicializado');
    }
    
    _initializeStrategies() {
        // Estratégia para FPS baixo
        this.optimizationStrategies.set('low_fps', () => {
            console.log('🚀 Aplicando otimização para FPS baixo');
            // Reduz qualidade de animações
            this._reduceAnimationQuality();
            // Aumenta debounce
            this._increaseDebounceDelays();
        });
        
        // Estratégia para alto uso de memória
        this.optimizationStrategies.set('high_memory', () => {
            console.log('🧹 Aplicando otimização para alto uso de memória');
            // Limpa cache agressivamente
            this.cache.clear();
            // Força garbage collection se disponível
            if (window.gc) window.gc();
        });
    }
    
    _setupEventListeners() {
        window.addEventListener('performanceOptimizationNeeded', (event) => {
            const { reason } = event.detail;
            const strategy = this.optimizationStrategies.get(reason);
            
            if (strategy) {
                strategy();
            }
        });
        
        // Otimização automática no resize
        window.addEventListener('resize', () => {
            this.debouncer.debounce('window_resize', () => {
                console.log('🔄 Otimizando após resize');
                this._optimizeForViewport();
            }, PERFORMANCE_CONFIG.DEBOUNCE.RESIZE);
        });
    }
    
    _reduceAnimationQuality() {
        // Reduz duração de animações globalmente
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.head.removeChild(style);
        }, 10000); // Remove após 10 segundos
    }
    
    _increaseDebounceDelays() {
        // Aumenta delays de debounce temporariamente
        PERFORMANCE_CONFIG.DEBOUNCE.RENDER *= 2;
        PERFORMANCE_CONFIG.DEBOUNCE.UPDATE *= 2;
        
        setTimeout(() => {
            PERFORMANCE_CONFIG.DEBOUNCE.RENDER /= 2;
            PERFORMANCE_CONFIG.DEBOUNCE.UPDATE /= 2;
        }, 30000); // Restaura após 30 segundos
    }
    
    _optimizeForViewport() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Ajusta configurações baseado no tamanho da tela
        if (viewport.width < 768) {
            // Mobile - otimizações mais agressivas
            PERFORMANCE_CONFIG.CACHE.MAX_SIZE = 50;
            PERFORMANCE_CONFIG.DEBOUNCE.RENDER = 150;
        } else {
            // Desktop - configurações padrão
            PERFORMANCE_CONFIG.CACHE.MAX_SIZE = 100;
            PERFORMANCE_CONFIG.DEBOUNCE.RENDER = 100;
        }
    }
    
    /**
     * API pública para cache
     */
    cacheSet(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }
    
    cacheGet(key) {
        return this.cache.get(key);
    }
    
    cacheHas(key) {
        return this.cache.has(key);
    }
    
    /**
     * API pública para debounce
     */
    debounce(key, func, delay, immediate) {
        return this.debouncer.debounce(key, func, delay, immediate);
    }
    
    /**
     * API pública para lazy loading
     */
    lazyLoad(element, loadFunction) {
        return this.lazyLoader.observe(element, loadFunction);
    }
    
    /**
     * Inicia monitoramento
     */
    startMonitoring() {
        this.monitor.startMonitoring();
    }
    
    /**
     * Para monitoramento
     */
    stopMonitoring() {
        this.monitor.stopMonitoring();
    }
    
    /**
     * Obtém estatísticas completas
     */
    getStats() {
        return {
            cache: this.cache.getStats(),
            performance: this.monitor.getMetrics(),
            debouncer: {
                pendingOperations: this.debouncer.getPendingCount()
            },
            config: PERFORMANCE_CONFIG
        };
    }
    
    /**
     * Limpa todos os recursos
     */
    destroy() {
        this.cache.clear();
        this.debouncer.cancelAll();
        this.lazyLoader.destroy();
        this.monitor.stopMonitoring();
        
        console.log('⚡ Otimizador de Performance destruído');
    }
}

// Instância singleton global
let performanceOptimizer = null;

export function getPerformanceOptimizer() {
    if (!performanceOptimizer) {
        performanceOptimizer = new PerformanceOptimizer();
    }
    return performanceOptimizer;
}

// Exposição global
window.getPerformanceOptimizer = getPerformanceOptimizer;

console.log('⚡ Sistema de Otimização de Performance carregado');
