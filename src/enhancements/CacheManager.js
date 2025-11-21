/**
 * GERENCIADOR DE CACHE AVANÇADO - GERENCIADOR PRO v9.3
 *
 * Sistema inteligente de cache com TTL, compressão e otimização automática
 * Aproveita os novos recursos de performance e monitoramento
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { PERFORMANCE_CONFIG } from '../constants/AppConstants.js';
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';
import { measurePerformance, memoize, debounce } from '../utils/PerformanceUtils.js';
import { performanceMonitor } from '../monitoring/PerformanceMonitor.js';

/**
 * Classe para gerenciamento avançado de cache
 * Implementa TTL, compressão, estatísticas e limpeza automática
 */
export class CacheManager {
    constructor() {
        if (CacheManager.instance) {
            return CacheManager.instance;
        }

        // Armazenamento do cache
        this.cache = new Map();
        this.metadata = new Map();

        // Configurações
        this.config = {
            maxSize: 100, // Máximo de entradas
            defaultTTL: 300000, // 5 minutos padrão
            compressionThreshold: 1024, // Comprimir dados > 1KB
            cleanupInterval: 60000, // Limpeza a cada 1 minuto
            maxMemoryUsage: 50 * 1024 * 1024, // 50MB máximo
            enableStatistics: true,
            enableCompression: true,
        };

        // Estatísticas
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            cleanups: 0,
            totalSize: 0,
            lastCleanup: Date.now(),
        };

        // Timers
        this.cleanupTimer = null;
        this.statsTimer = null;

        // Strategies de cache
        this.strategies = {
            LRU: this._lruStrategy
                ? this._lruStrategy.bind(this)
                : this._defaultStrategy.bind(this),
            LFU: this._lfuStrategy
                ? this._lfuStrategy.bind(this)
                : this._defaultStrategy.bind(this),
            TTL: this._ttlStrategy
                ? this._ttlStrategy.bind(this)
                : this._defaultStrategy.bind(this),
        };

        this.currentStrategy = 'LRU';

        // Inicialização
        this._initialize();

        CacheManager.instance = this;
    }

    /**
     * Inicializa o gerenciador de cache
     * @private
     */
    _initialize() {
        try {
            // Configurar limpeza automática
            this._startCleanupTimer();

            // Configurar coleta de estatísticas
            if (this.config.enableStatistics) {
                this._startStatsTimer();
            }

            // Configurar listeners de eventos
            this._setupEventListeners();

            console.log('🗄️ CacheManager inicializado com sucesso!');
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.SYSTEM, 'CacheManager._initialize');
        }
    }

    /**
     * Define um valor no cache
     *
     * @param {string} key - Chave do cache
     * @param {any} value - Valor a ser armazenado
     * @param {Object} options - Opções de cache
     * @param {number} options.ttl - Time to live em ms
     * @param {string} options.strategy - Estratégia de cache
     * @param {boolean} options.compress - Forçar compressão
     * @returns {boolean} Sucesso da operação
     */
    set(key, value, options = {}) {
        try {
            const startTime = performance.now();

            // Validar entrada
            if (!key || typeof key !== 'string') {
                throw new Error('Chave inválida para cache');
            }

            // Configurar opções
            const ttl = options.ttl || this.config.defaultTTL;
            const strategy = options.strategy || this.currentStrategy;
            const compress =
                options.compress !== undefined ? options.compress : this.config.enableCompression;

            // Preparar dados
            let processedValue = value;
            let isCompressed = false;

            // Compressão se necessário
            if (compress && this._shouldCompress(value)) {
                processedValue = this._compress(value);
                isCompressed = true;
            }

            // Verificar limites de memória
            const estimatedSize = this._estimateSize(processedValue);
            if (estimatedSize > this.config.maxMemoryUsage / 10) {
                throw new Error('Valor muito grande para cache');
            }

            // Verificar se precisa fazer limpeza
            if (this.cache.size >= this.config.maxSize) {
                this._executeStrategy(strategy);
            }

            // Metadados
            const metadata = {
                createdAt: Date.now(),
                expiresAt: Date.now() + ttl,
                accessCount: 0,
                lastAccessed: Date.now(),
                size: estimatedSize,
                isCompressed,
                strategy,
            };

            // Armazenar
            this.cache.set(key, processedValue);
            this.metadata.set(key, metadata);

            // Atualizar estatísticas
            this.stats.sets++;
            this.stats.totalSize += estimatedSize;

            // Monitoramento de performance
            if (performanceMonitor.isEnabled) {
                performanceMonitor.addCustomMetric('cache_set', key, {
                    size: estimatedSize,
                    compressed: isCompressed,
                    ttl: ttl,
                });
            }

            const elapsed = performance.now() - startTime;
            if (elapsed > 10) {
                console.warn(`⚡ Cache SET lento: ${elapsed.toFixed(2)}ms para key: ${key}`);
            }
            return true;
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.PERFORMANCE, 'CacheManager.set');
            return false;
        }
    }

    /**
     * Obtém um valor do cache
     *
     * @param {string} key - Chave do cache
     * @returns {any|null} Valor armazenado ou null se não encontrado
     */
    get(key) {
        try {
            const startTime = performance.now();

            if (!this.cache.has(key)) {
                this.stats.misses++;
                const elapsed = performance.now() - startTime;
                if (elapsed > 5) {
                    console.warn(
                        `⚡ Cache GET miss lento: ${elapsed.toFixed(2)}ms para key: ${key}`
                    );
                }
                return null;
            }

            const metadata = this.metadata.get(key);

            // Verificar TTL
            if (metadata.expiresAt < Date.now()) {
                this.delete(key);
                this.stats.misses++;
                const elapsed = performance.now() - startTime;
                if (elapsed > 5) {
                    console.warn(
                        `⚡ Cache GET expired lento: ${elapsed.toFixed(2)}ms para key: ${key}`
                    );
                }
                return null;
            }

            // Atualizar metadados de acesso
            metadata.accessCount++;
            metadata.lastAccessed = Date.now();

            // Obter valor
            let value = this.cache.get(key);

            // Descomprimir se necessário
            if (metadata.isCompressed) {
                value = this._decompress(value);
            }

            // Atualizar estatísticas
            this.stats.hits++;

            // Monitoramento de performance
            if (performanceMonitor.isEnabled) {
                performanceMonitor.addCustomMetric('cache_hit', key, {
                    accessCount: metadata.accessCount,
                    age: Date.now() - metadata.createdAt,
                });
            }

            const elapsed = performance.now() - startTime;
            if (elapsed > 5) {
                console.warn(`⚡ Cache GET lento: ${elapsed.toFixed(2)}ms para key: ${key}`);
            }
            return value;
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.PERFORMANCE, 'CacheManager.get');
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Remove um item do cache
     *
     * @param {string} key - Chave a ser removida
     * @returns {boolean} Sucesso da operação
     */
    delete(key) {
        try {
            if (!this.cache.has(key)) {
                return false;
            }

            const metadata = this.metadata.get(key);
            this.stats.totalSize -= metadata.size;

            this.cache.delete(key);
            this.metadata.delete(key);

            this.stats.deletes++;
            return true;
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.PERFORMANCE, 'CacheManager.delete');
            return false;
        }
    }

    /**
     * Limpa todo o cache
     */
    clear() {
        try {
            this.cache.clear();
            this.metadata.clear();
            this.stats.totalSize = 0;
            this.stats.cleanups++;

            console.log('🗑️ Cache limpo completamente');
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.PERFORMANCE, 'CacheManager.clear');
        }
    }

    /**
     * Obtém estatísticas do cache
     *
     * @returns {Object} Estatísticas detalhadas
     */
    getStats() {
        const hitRate =
            this.stats.hits + this.stats.misses > 0
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
                : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`,
            averageSize:
                this.cache.size > 0 ? Math.round(this.stats.totalSize / this.cache.size) : 0,
            memoryUsage: `${(this.stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
        };
    }

    /**
     * Obtém informações de uma chave específica
     *
     * @param {string} key - Chave para obter informações
     * @returns {Object|null} Metadados da chave
     */
    getInfo(key) {
        if (!this.metadata.has(key)) {
            return null;
        }

        const metadata = this.metadata.get(key);
        return {
            ...metadata,
            age: Date.now() - metadata.createdAt,
            timeToExpire: metadata.expiresAt - Date.now(),
            isExpired: metadata.expiresAt < Date.now(),
        };
    }

    /**
     * Lista todas as chaves do cache
     *
     * @returns {Array<string>} Array de chaves
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Configura o gerenciador de cache
     *
     * @param {Object} newConfig - Novas configurações
     */
    configure(newConfig) {
        try {
            Object.assign(this.config, newConfig);

            // Reiniciar timers se necessário
            if (newConfig.cleanupInterval) {
                this._restartCleanupTimer();
            }

            console.log('⚙️ CacheManager reconfigurado:', newConfig);
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.SYSTEM, 'CacheManager.configure');
        }
    }

    /**
     * Para o gerenciador de cache
     */
    stop() {
        try {
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }

            if (this.statsTimer) {
                clearInterval(this.statsTimer);
                this.statsTimer = null;
            }

            console.log('🛑 CacheManager parado');
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.SYSTEM, 'CacheManager.stop');
        }
    }

    // ========================================
    // MÉTODOS PRIVADOS
    // ========================================

    /**
     * Inicia timer de limpeza automática
     * @private
     */
    _startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this._performCleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * Inicia timer de estatísticas
     * @private
     */
    _startStatsTimer() {
        this.statsTimer = setInterval(() => {
            this._logStats();
        }, 60000); // A cada minuto
    }

    /**
     * Configura listeners de eventos
     * @private
     */
    _setupEventListeners() {
        // Listener para mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._performCleanup();
            }
        });

        // Listener para eventos de performance
        window.addEventListener('performanceReport', (event) => {
            this._handlePerformanceReport(event.detail);
        });
    }

    /**
     * Realiza limpeza automática do cache
     * @private
     */
    _performCleanup() {
        try {
            const startTime = performance.now();
            let removed = 0;

            // Remover itens expirados
            for (const [key, metadata] of this.metadata.entries()) {
                if (metadata.expiresAt < Date.now()) {
                    this.delete(key);
                    removed++;
                }
            }

            // Se ainda está cheio, aplicar estratégia
            if (this.cache.size >= this.config.maxSize * 0.9) {
                this._executeStrategy(this.currentStrategy);
            }

            this.stats.lastCleanup = Date.now();
            this.stats.cleanups++;

            if (removed > 0) {
                console.log(`🧹 Limpeza do cache: ${removed} itens removidos`);
            }

            const elapsed = performance.now() - startTime;
            if (elapsed > 50) {
                console.warn(
                    `⚡ Limpeza de cache lenta: ${elapsed.toFixed(2)}ms (${removed} itens removidos)`
                );
            }
        } catch (error) {
            errorHandler.handleError(
                error,
                ERROR_TYPES.PERFORMANCE,
                'CacheManager._performCleanup'
            );
        }
    }

    /**
     * Executa estratégia de cache
     * @private
     */
    _executeStrategy(strategy) {
        if (this.strategies[strategy]) {
            this.strategies[strategy]();
        }
    }

    /**
     * Estratégia LRU (Least Recently Used)
     * @private
     */
    _lruStrategy() {
        const entries = Array.from(this.metadata.entries()).sort(
            (a, b) => a[1].lastAccessed - b[1].lastAccessed
        );

        const toRemove = Math.ceil(this.config.maxSize * 0.1); // Remove 10%
        for (let i = 0; i < toRemove && i < entries.length; i++) {
            this.delete(entries[i][0]);
        }
    }

    /**
     * Estratégia LFU (Least Frequently Used)
     * @private
     */
    _lfuStrategy() {
        const entries = Array.from(this.metadata.entries()).sort(
            (a, b) => a[1].accessCount - b[1].accessCount
        );

        const toRemove = Math.ceil(this.config.maxSize * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
            this.delete(entries[i][0]);
        }
    }

    /**
     * Estratégia TTL (Time To Live)
     * @private
     */
    _ttlStrategy() {
        const now = Date.now();
        const entries = Array.from(this.metadata.entries())
            .filter(([key, metadata]) => metadata.expiresAt > now)
            .sort((a, b) => a[1].expiresAt - b[1].expiresAt);

        const toRemove = Math.ceil(this.config.maxSize * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
            this.delete(entries[i][0]);
        }
    }

    /**
     * Verifica se deve comprimir o valor
     * @private
     */
    _shouldCompress(value) {
        const size = this._estimateSize(value);
        return size > this.config.compressionThreshold;
    }

    /**
     * Comprime um valor
     * @private
     */
    _compress(value) {
        try {
            // Implementação simples de compressão usando JSON
            const jsonString = JSON.stringify(value);
            // Em uma implementação real, usaria LZ4 ou similar
            return { __compressed: true, data: jsonString };
        } catch (error) {
            return value; // Fallback se não conseguir comprimir
        }
    }

    /**
     * Descomprime um valor
     * @private
     */
    _decompress(value) {
        try {
            if (value && value.__compressed) {
                return JSON.parse(value.data);
            }
            return value;
        } catch (error) {
            return value; // Fallback se não conseguir descomprimir
        }
    }

    /**
     * Estima o tamanho de um valor em bytes
     * @private
     */
    _estimateSize(value) {
        try {
            return JSON.stringify(value).length * 2; // Aproximação
        } catch (error) {
            return 1024; // Estimativa padrão
        }
    }

    /**
     * Reinicia timer de limpeza
     * @private
     */
    _restartCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this._startCleanupTimer();
    }

    /**
     * Registra estatísticas
     * @private
     */
    _logStats() {
        const stats = this.getStats();
        console.group('📊 Cache Statistics');
        console.log('Tamanho:', stats.size);
        console.log('Taxa de acerto:', stats.hitRate);
        console.log('Uso de memória:', stats.memoryUsage);
        console.log('Operações:', `${stats.hits} hits, ${stats.misses} misses`);
        console.groupEnd();
    }

    /**
     * Processa relatório de performance
     * @private
     */
    _handlePerformanceReport(report) {
        // Ajustar configurações baseado na performance
        if (report.memory.current > 80) {
            this.config.maxSize = Math.max(50, this.config.maxSize * 0.8);
            this._performCleanup();
        }
    }

    /**
     * Estratégia padrão (LRU simples)
     * @private
     */
    _defaultStrategy() {
        return this._lfuStrategy();
    }

    /**
     * Estratégia LRU (Least Recently Used)
     * @private
     */
    _lruStrategy() {
        const entries = Array.from(this.metadata.entries());

        // Ordena por último acesso (mais antigo primeiro)
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        // Remove os 10% mais antigos
        const toRemove = Math.ceil(entries.length * 0.1);

        for (let i = 0; i < toRemove && entries[i]; i++) {
            this.delete(entries[i][0]);
        }

        return toRemove;
    }

    /**
     * Estratégia TTL (Time To Live)
     * @private
     */
    _ttlStrategy() {
        const now = Date.now();
        let removed = 0;

        for (const [key, metadata] of this.metadata.entries()) {
            if (metadata.expiresAt < now) {
                this.delete(key);
                removed++;
            }
        }

        // Se não removeu o suficiente, aplica LRU
        if (removed < this.cache.size * 0.1) {
            removed += this._lruStrategy();
        }

        return removed;
    }
}

// Exportar instância singleton
export const cacheManager = new CacheManager();
