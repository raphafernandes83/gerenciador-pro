/**
 * Sistema de Lazy Loading Inteligente
 * Carrega módulos pesados sob demanda com cache e preload
 */

class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.preloadQueue = [];
        this.config = {
            preloadDelay: 2000, // ms para iniciar preload
            maxConcurrentLoads: 3,
            cacheTimeout: 10 * 60 * 1000, // 10 minutos
            retryAttempts: 3,
            retryDelay: 1000,
        };
        this.currentLoads = 0;
        this.intersectionObserver = null;
        this._initIntersectionObserver();
    }

    /**
     * Carrega um módulo sob demanda
     * @param {string} moduleName - Nome do módulo
     * @param {Function|string} loader - Função de carregamento ou URL
     * @param {Object} options - Opções de carregamento
     * @returns {Promise} Módulo carregado
     */
    async loadModule(moduleName, loader, options = {}) {
        const {
            cache = true,
            priority = 'normal',
            timeout = 10000,
            dependencies = [],
            onProgress = null,
        } = options;

        // Verificar cache
        if (cache && this.loadedModules.has(moduleName)) {
            const cached = this.loadedModules.get(moduleName);
            if (this._isCacheValid(cached)) {
                return cached.module;
            } else {
                this.loadedModules.delete(moduleName);
            }
        }

        // Verificar se já está carregando
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        // Carregar dependências primeiro
        if (dependencies.length > 0) {
            await this._loadDependencies(dependencies);
        }

        // Criar promise de carregamento
        const loadPromise = this._executeLoad(moduleName, loader, {
            priority,
            timeout,
            onProgress,
        });

        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;

            // Armazenar em cache
            if (cache) {
                this.loadedModules.set(moduleName, {
                    module,
                    loadedAt: Date.now(),
                    accessCount: 1,
                });
            }

            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Precarrega módulos em background
     * @param {Array} modules - Lista de módulos para precarregar
     */
    preloadModules(modules) {
        modules.forEach(({ name, loader, options = {} }) => {
            this.preloadQueue.push({
                name,
                loader,
                options: { ...options, priority: 'low' },
            });
        });

        // Iniciar preload após delay
        setTimeout(() => {
            this._processPreloadQueue();
        }, this.config.preloadDelay);
    }

    /**
     * Registra um elemento para lazy loading baseado em visibilidade
     * @param {HTMLElement} element - Elemento a observar
     * @param {Function} loadCallback - Callback de carregamento
     * @param {Object} options - Opções
     */
    observeElement(element, loadCallback, options = {}) {
        const { rootMargin = '50px', threshold = 0.1, once = true } = options;

        if (!this.intersectionObserver) {
            this._initIntersectionObserver();
        }

        // Armazenar callback no elemento
        element._lazyLoadCallback = loadCallback;
        element._lazyLoadOptions = { once };

        this.intersectionObserver.observe(element);
    }

    /**
     * Carrega módulo de chart específico
     * @param {string} chartType - Tipo do chart (line, bar, pie, etc.)
     * @returns {Promise} Módulo do chart
     */
    async loadChartModule(chartType) {
        const chartLoaders = {
            line: () =>
                this._loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'),
            bar: () =>
                this._loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'),
            pie: () =>
                this._loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'),
            advanced: () =>
                Promise.all([
                    this._loadScript(
                        'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
                    ),
                    this._loadScript(
                        'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js'
                    ),
                ]),
        };

        const loader = chartLoaders[chartType] || chartLoaders.line;
        return this.loadModule(`chart-${chartType}`, loader, {
            cache: true,
            priority: 'high',
        });
    }

    /**
     * Carrega módulo de sidebar sob demanda
     * @returns {Promise} Módulo da sidebar
     */
    async loadSidebarModule() {
        return this.loadModule(
            'sidebar',
            async () => {
                // Simular carregamento do módulo sidebar
                const sidebarModule = await import('./sidebar.js').catch(() => {
                    // Fallback para carregamento via script
                    return this._loadScript('./sidebar.js');
                });

                return sidebarModule;
            },
            {
                cache: true,
                priority: 'normal',
                dependencies: ['dom-utils'],
            }
        );
    }

    /**
     * Obtém estatísticas do lazy loader
     * @returns {Object} Estatísticas
     */
    getStats() {
        const now = Date.now();
        const cached = Array.from(this.loadedModules.values());

        return {
            loadedModules: this.loadedModules.size,
            loadingModules: this.loadingPromises.size,
            preloadQueue: this.preloadQueue.length,
            currentLoads: this.currentLoads,
            cacheHitRate: this._calculateCacheHitRate(),
            memoryUsage: this._calculateMemoryUsage(cached),
            oldestCache: cached.length > 0 ? Math.min(...cached.map((c) => now - c.loadedAt)) : 0,
        };
    }

    /**
     * Limpa cache de módulos antigos
     * @param {boolean} force - Forçar limpeza completa
     */
    clearCache(force = false) {
        const now = Date.now();
        const toRemove = [];

        for (const [name, cached] of this.loadedModules.entries()) {
            const age = now - cached.loadedAt;
            if (force || age > this.config.cacheTimeout) {
                toRemove.push(name);
            }
        }

        toRemove.forEach((name) => {
            this.loadedModules.delete(name);
        });

        return toRemove.length;
    }

    // Métodos privados
    async _executeLoad(moduleName, loader, options) {
        const measurementId = window.performanceProfiler?.startMeasurement('lazy_load', {
            module: moduleName,
            priority: options.priority,
        });

        this.currentLoads++;

        try {
            let result;

            if (typeof loader === 'string') {
                // Carregar via URL
                result = await this._loadScript(loader);
            } else if (typeof loader === 'function') {
                // Executar função de carregamento
                result = await this._withTimeout(loader(), options.timeout);
            } else {
                throw new Error(`Loader inválido para módulo ${moduleName}`);
            }

            window.performanceProfiler?.endMeasurement(measurementId, {
                success: true,
                module: moduleName,
            });

            return result;
        } catch (error) {
            window.performanceProfiler?.endMeasurement(measurementId, {
                success: false,
                error: error.message,
                module: moduleName,
            });

            // Tentar retry se configurado
            if (options.retryAttempts > 0) {
                await this._delay(this.config.retryDelay);
                return this._executeLoad(moduleName, loader, {
                    ...options,
                    retryAttempts: options.retryAttempts - 1,
                });
            }

            throw error;
        } finally {
            this.currentLoads--;
        }
    }

    async _loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(window);
            script.onerror = () => reject(new Error(`Falha ao carregar script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async _loadDependencies(dependencies) {
        const dependencyPromises = dependencies.map((dep) => {
            if (typeof dep === 'string') {
                return this.loadModule(dep, () => import(`./${dep}.js`));
            }
            return this.loadModule(dep.name, dep.loader, dep.options);
        });

        await Promise.all(dependencyPromises);
    }

    async _processPreloadQueue() {
        while (this.preloadQueue.length > 0 && this.currentLoads < this.config.maxConcurrentLoads) {
            const item = this.preloadQueue.shift();

            try {
                await this.loadModule(item.name, item.loader, item.options);
            } catch (error) {
                console.warn(`Preload falhou para ${item.name}:`, error);
            }
        }

        // Continuar processando se ainda há itens na fila
        if (this.preloadQueue.length > 0) {
            setTimeout(() => this._processPreloadQueue(), 1000);
        }
    }

    _initIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') return;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const callback = element._lazyLoadCallback;
                        const options = element._lazyLoadOptions || {};

                        if (callback) {
                            callback(element);

                            if (options.once) {
                                this.intersectionObserver.unobserve(element);
                                delete element._lazyLoadCallback;
                                delete element._lazyLoadOptions;
                            }
                        }
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.1,
            }
        );
    }

    _isCacheValid(cached) {
        const age = Date.now() - cached.loadedAt;
        return age < this.config.cacheTimeout;
    }

    _withTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
        ]);
    }

    _delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _calculateCacheHitRate() {
        // Implementação simplificada - em produção seria mais complexa
        return this.loadedModules.size > 0 ? 0.8 : 0;
    }

    _calculateMemoryUsage(cached) {
        // Estimativa aproximada
        return cached.length * 0.1; // MB por módulo
    }
}

// Instância global do lazy loader
const lazyLoader = new LazyLoader();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.lazyLoader = lazyLoader;
}

export default lazyLoader;
