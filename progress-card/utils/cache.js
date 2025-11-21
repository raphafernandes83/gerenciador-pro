/**
 * 🗄️ Progress Card Cache - Sistema de Cache para Comparações
 * 
 * Gerencia cache de dados do card de progresso para permitir
 * comparações de trends e análise de performance ao longo do tempo.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 3.0.0 - FASE 3
 */

import { logger } from '../../src/utils/Logger.js';

/**
 * 🗄️ Classe para gerenciar cache de dados do card
 */
class ProgressCardCache {
    constructor() {
        this.cache = new Map();
        this.maxEntries = 50; // Máximo de entradas no cache
        this.sessionKey = this.generateSessionKey();
        
        logger.debug('🗄️ Cache do Progress Card inicializado');
    }

    /**
     * 🔑 Gera chave única para a sessão atual
     * @returns {string} Chave da sessão
     */
    generateSessionKey() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const sessionId = window.state?.sessionId || 'default';
        return `${dateStr}_${sessionId}`;
    }

    /**
     * 💾 Armazena dados no cache
     * @param {Object} cardData - Dados do card para armazenar
     * @param {string} key - Chave personalizada (opcional)
     */
    store(cardData, key = null) {
        try {
            const cacheKey = key || `${this.sessionKey}_${Date.now()}`;
            
            // Cria entrada do cache com metadados
            const cacheEntry = {
                data: {
                    stats: { ...cardData.stats },
                    monetary: { ...cardData.monetary },
                    pointsPercentage: { ...cardData.pointsPercentage }
                },
                timestamp: cardData.timestamp || new Date().toISOString(),
                sessionKey: this.sessionKey,
                operations: cardData.stats?.totalOperations || 0
            };

            this.cache.set(cacheKey, cacheEntry);
            
            // Limpa cache se exceder limite
            this.cleanupCache();
            
            logger.debug('💾 Dados armazenados no cache:', { 
                key: cacheKey, 
                operations: cacheEntry.operations 
            });
            
        } catch (error) {
            logger.error('❌ Erro ao armazenar no cache:', { error: String(error) });
        }
    }

    /**
     * 📖 Recupera dados do cache
     * @param {string} key - Chave dos dados
     * @returns {Object|null} Dados do cache ou null
     */
    get(key) {
        try {
            const entry = this.cache.get(key);
            if (entry) {
                logger.debug('📖 Dados recuperados do cache:', { key });
                return entry.data;
            }
            return null;
        } catch (error) {
            logger.error('❌ Erro ao recuperar do cache:', { error: String(error) });
            return null;
        }
    }

    /**
     * 🔍 Busca dados anteriores baseados em critérios
     * @param {Object} criteria - Critérios de busca
     * @returns {Object|null} Dados anteriores ou null
     */
    getPrevious(criteria = {}) {
        try {
            const {
                sessionKey = this.sessionKey,
                maxAge = 300000, // 5 minutos em ms
                minOperationsDiff = 1 // Diferença mínima de operações
            } = criteria;

            const now = Date.now();
            const entries = Array.from(this.cache.entries())
                .filter(([key, entry]) => {
                    // Filtra por sessão
                    if (entry.sessionKey !== sessionKey) return false;
                    
                    // Filtra por idade
                    const entryTime = new Date(entry.timestamp).getTime();
                    if (now - entryTime > maxAge) return false;
                    
                    return true;
                })
                .sort(([, a], [, b]) => {
                    // Ordena por timestamp (mais recente primeiro)
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

            // Busca entrada anterior com diferença significativa de operações
            const currentOperations = window.state?.historicoCombinado?.length || 0;
            
            for (const [key, entry] of entries) {
                const operationsDiff = Math.abs(currentOperations - entry.operations);
                if (operationsDiff >= minOperationsDiff) {
                    logger.debug('🔍 Dados anteriores encontrados:', { 
                        key, 
                        operations: entry.operations,
                        diff: operationsDiff 
                    });
                    return entry.data;
                }
            }

            logger.debug('🔍 Nenhum dado anterior encontrado com critérios especificados');
            return null;
            
        } catch (error) {
            logger.error('❌ Erro ao buscar dados anteriores:', { error: String(error) });
            return null;
        }
    }

    /**
     * 📊 Obtém histórico de dados para análise de trends
     * @param {number} limit - Limite de entradas
     * @returns {Array} Array de dados históricos
     */
    getHistory(limit = 10) {
        try {
            const entries = Array.from(this.cache.entries())
                .filter(([, entry]) => entry.sessionKey === this.sessionKey)
                .sort(([, a], [, b]) => {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                })
                .slice(0, limit)
                .map(([key, entry]) => ({
                    key,
                    ...entry.data,
                    timestamp: entry.timestamp,
                    operations: entry.operations
                }));

            logger.debug('📊 Histórico recuperado:', { count: entries.length });
            return entries;
            
        } catch (error) {
            logger.error('❌ Erro ao obter histórico:', { error: String(error) });
            return [];
        }
    }

    /**
     * 🧹 Limpa entradas antigas do cache
     */
    cleanupCache() {
        try {
            if (this.cache.size <= this.maxEntries) return;

            // Converte para array e ordena por timestamp
            const entries = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => {
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                });

            // Remove entradas mais antigas
            const toRemove = entries.slice(0, this.cache.size - this.maxEntries);
            toRemove.forEach(([key]) => {
                this.cache.delete(key);
            });

            logger.debug('🧹 Cache limpo:', { 
                removed: toRemove.length, 
                remaining: this.cache.size 
            });
            
        } catch (error) {
            logger.error('❌ Erro ao limpar cache:', { error: String(error) });
        }
    }

    /**
     * 🗑️ Limpa todo o cache
     */
    clear() {
        try {
            const size = this.cache.size;
            this.cache.clear();
            logger.debug('🗑️ Cache completamente limpo:', { entriesRemoved: size });
        } catch (error) {
            logger.error('❌ Erro ao limpar cache:', { error: String(error) });
        }
    }

    /**
     * 📈 Calcula estatísticas do cache
     * @returns {Object} Estatísticas do cache
     */
    getStats() {
        try {
            const entries = Array.from(this.cache.values());
            const currentSession = entries.filter(entry => entry.sessionKey === this.sessionKey);
            
            const stats = {
                totalEntries: this.cache.size,
                currentSessionEntries: currentSession.length,
                oldestEntry: entries.length > 0 ? 
                    Math.min(...entries.map(e => new Date(e.timestamp).getTime())) : null,
                newestEntry: entries.length > 0 ? 
                    Math.max(...entries.map(e => new Date(e.timestamp).getTime())) : null,
                sessionKey: this.sessionKey,
                maxEntries: this.maxEntries
            };

            // Converte timestamps para datas legíveis
            if (stats.oldestEntry) {
                stats.oldestEntryDate = new Date(stats.oldestEntry).toISOString();
            }
            if (stats.newestEntry) {
                stats.newestEntryDate = new Date(stats.newestEntry).toISOString();
            }

            return stats;
            
        } catch (error) {
            logger.error('❌ Erro ao calcular estatísticas do cache:', { error: String(error) });
            return {
                totalEntries: 0,
                currentSessionEntries: 0,
                error: error.message
            };
        }
    }

    /**
     * 🧪 Função de teste do cache
     * @returns {Object} Resultados dos testes
     */
    test() {
        console.log('🧪 Testando sistema de cache...');
        
        try {
            // Dados de teste
            const testData1 = {
                stats: { totalOperations: 5, winRate: 60 },
                monetary: { sessionPL: 100 },
                pointsPercentage: { winRate: { value: 0 } },
                timestamp: new Date(Date.now() - 60000).toISOString() // 1 min atrás
            };
            
            const testData2 = {
                stats: { totalOperations: 10, winRate: 70 },
                monetary: { sessionPL: 250 },
                pointsPercentage: { winRate: { value: 10 } },
                timestamp: new Date().toISOString()
            };

            // Teste 1: Armazenamento
            this.store(testData1, 'test1');
            this.store(testData2, 'test2');
            
            // Teste 2: Recuperação
            const retrieved = this.get('test1');
            const isRetrieved = retrieved && retrieved.stats.totalOperations === 5;
            
            // Teste 3: Busca de dados anteriores
            const previous = this.getPrevious();
            const hasPrevious = previous !== null;
            
            // Teste 4: Histórico
            const history = this.getHistory(5);
            const hasHistory = history.length > 0;
            
            // Teste 5: Estatísticas
            const stats = this.getStats();
            const hasStats = stats.totalEntries > 0;

            const results = {
                storage: true,
                retrieval: isRetrieved,
                previousData: hasPrevious,
                history: hasHistory,
                statistics: hasStats
            };

            const allTestsPass = Object.values(results).every(Boolean);
            
            console.log(allTestsPass ? '✅ Todos os testes do cache passaram!' : '❌ Alguns testes falharam:', results);
            console.log('📊 Estatísticas do cache:', stats);
            
            // Limpa dados de teste
            this.cache.delete('test1');
            this.cache.delete('test2');
            
            return {
                results,
                stats,
                allTestsPass
            };
            
        } catch (error) {
            console.error('❌ Erro nos testes do cache:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton do cache
const progressCardCache = new ProgressCardCache();

// Exposição global
if (typeof window !== 'undefined') {
    window.progressCardCache = progressCardCache;
    console.log('🗄️ Cache do Progress Card disponível globalmente');
}

export default progressCardCache;



