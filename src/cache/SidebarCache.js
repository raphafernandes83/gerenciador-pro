/**
 * =============================================================================
 * SIDEBAR CACHE - Sistema de Cache da Sidebar
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1607-1662)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Gerenciar cache de conteúdo das seções da sidebar
 * para evitar re-renderizações desnecessárias.
 * 
 * =============================================================================
 */

/**
 * Sistema de Cache da Sidebar
 */
export class SidebarCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutos
        this.maxSize = 10; // Máximo 10 itens em cache
    }

    /**
     * Obtém conteúdo do cache
     */
    getCachedContent(section) {
        const cached = this.cache.get(section);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.content;
        }
        return null;
    }

    /**
     * Armazena conteúdo no cache
     */
    cacheContent(section, content) {
        // Remove item mais antigo se cache estiver cheio
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(section, {
            content,
            timestamp: Date.now(),
        });
    }

    /**
     * Limpa cache expirado
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
    }
}
