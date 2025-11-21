/**
 * 🕒 GERENCIADOR DE TIMERS - GERENCIADOR PRO v9.3
 *
 * Sistema centralizado para gerenciar timers e evitar vazamentos de memória
 * Responsabilidade única: Gerenciar lifecycle de timers
 *
 * @author Gerenciador PRO Team
 * @version 9.3
 * @since 2025-01-28
 */

import { logger } from './Logger.js';

/**
 * Gerenciador centralizado de timers com tracking automático
 * Implementa padrão Singleton para controle global
 */
class TimerManager {
    constructor() {
        if (TimerManager.instance) {
            return TimerManager.instance;
        }

        this.activeTimers = new Set();
        this.timerMetadata = new Map();

        TimerManager.instance = this;

        // Cleanup automático ao sair da página
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.clearAll();
            });
        }
    }

    /**
     * Cria timer seguro que é automaticamente rastreado
     * @param {Function} callback - Função a ser executada
     * @param {number} delay - Atraso em milissegundos
     * @param {string} [description] - Descrição opcional para debugging
     * @returns {number} ID do timer
     */
    createTimer(callback, delay, description = 'anonymous') {
        const safeTimeout = window.safeProtection?.safeSetTimeout || setTimeout;
        const timerId = safeTimeout(() => {
            // Remove timer da lista quando executado
            this.activeTimers.delete(timerId);
            this.timerMetadata.delete(timerId);

            try {
                callback();
            } catch (error) {
                logger.error('Erro em timer callback', {
                    error: String(error),
                    description,
                    timerId,
                });
            }
        }, delay);

        // Adiciona à lista de timers ativos com metadata
        this.activeTimers.add(timerId);
        this.timerMetadata.set(timerId, {
            description,
            createdAt: Date.now(),
            delay,
            type: 'timeout',
        });

        logger.debug('Timer criado', { timerId, description, delay });
        return timerId;
    }

    /**
     * Cria interval seguro que é automaticamente rastreado
     * @param {Function} callback - Função a ser executada
     * @param {number} interval - Intervalo em milissegundos
     * @param {string} [description] - Descrição opcional para debugging
     * @returns {number} ID do interval
     */
    createInterval(callback, interval, description = 'anonymous') {
        const safeInterval = window.safeProtection?.safeSetInterval || setInterval;
        const intervalId = safeInterval(() => {
            try {
                callback();
            } catch (error) {
                logger.error('Erro em interval callback', {
                    error: String(error),
                    description,
                    intervalId,
                });
            }
        }, interval);

        // Adiciona à lista de timers ativos com metadata
        this.activeTimers.add(intervalId);
        this.timerMetadata.set(intervalId, {
            description,
            createdAt: Date.now(),
            interval,
            type: 'interval',
        });

        logger.debug('Interval criado', { intervalId, description, interval });
        return intervalId;
    }

    /**
     * Limpa timer ou interval específico
     * @param {number} timerId - ID do timer a ser limpo
     */
    clear(timerId) {
        if (!this.activeTimers.has(timerId)) {
            logger.warn('Tentativa de limpar timer inexistente', { timerId });
            return false;
        }

        const metadata = this.timerMetadata.get(timerId);
        const isInterval = metadata?.type === 'interval';

        if (isInterval) {
            const safeClearInterval = window.safeProtection?.safeClearInterval || clearInterval;
            safeClearInterval(timerId);
        } else {
            const safeClearTimeout = window.safeProtection?.safeClearTimeout || clearTimeout;
            safeClearTimeout(timerId);
        }

        this.activeTimers.delete(timerId);
        this.timerMetadata.delete(timerId);

        logger.debug('Timer limpo', {
            timerId,
            type: metadata?.type,
            description: metadata?.description,
        });
        return true;
    }

    /**
     * Limpa todos os timers ativos
     * @param {boolean} [silent=false] - Se true, não loga cada timer limpo
     */
    clearAll(silent = false) {
        const count = this.activeTimers.size;

        if (count === 0) {
            return;
        }

        const safeClearTimeout = window.safeProtection?.safeClearTimeout || clearTimeout;
        const safeClearInterval = window.safeProtection?.safeClearInterval || clearInterval;

        this.activeTimers.forEach((timerId) => {
            const metadata = this.timerMetadata.get(timerId);
            const isInterval = metadata?.type === 'interval';

            if (isInterval) {
                safeClearInterval(timerId);
            } else {
                safeClearTimeout(timerId);
            }

            if (!silent) {
                logger.debug('Timer limpo durante clearAll', {
                    timerId,
                    type: metadata?.type,
                    description: metadata?.description,
                });
            }
        });

        this.activeTimers.clear();
        this.timerMetadata.clear();

        logger.info('Todos os timers foram limpos', { count });
    }

    /**
     * Obtém estatísticas dos timers ativos
     * @returns {Object} Estatísticas detalhadas
     */
    getStats() {
        const now = Date.now();
        const timers = [];

        for (const [timerId, metadata] of this.timerMetadata.entries()) {
            timers.push({
                id: timerId,
                ...metadata,
                age: now - metadata.createdAt,
            });
        }

        return {
            activeCount: this.activeTimers.size,
            timers,
            oldestTimer: timers.length > 0 ? Math.max(...timers.map((t) => t.age)) : 0,
            byType: {
                timeout: timers.filter((t) => t.type === 'timeout').length,
                interval: timers.filter((t) => t.type === 'interval').length,
            },
        };
    }

    /**
     * Encontra timers antigos que podem ter vazado
     * @param {number} [maxAge=60000] - Idade máxima em ms (padrão: 1 minuto)
     * @returns {Array} Lista de timers suspeitos
     */
    findSuspiciousTimers(maxAge = 60000) {
        const now = Date.now();
        const suspicious = [];

        for (const [timerId, metadata] of this.timerMetadata.entries()) {
            const age = now - metadata.createdAt;
            if (age > maxAge) {
                suspicious.push({
                    id: timerId,
                    ...metadata,
                    age,
                });
            }
        }

        if (suspicious.length > 0) {
            logger.warn('Timers suspeitos encontrados', {
                count: suspicious.length,
                timers: suspicious.map((t) => ({
                    id: t.id,
                    description: t.description,
                    age: t.age,
                })),
            });
        }

        return suspicious;
    }

    /**
     * Gera relatório detalhado para debugging
     * @returns {string} Relatório formatado
     */
    generateReport() {
        const stats = this.getStats();
        const suspicious = this.findSuspiciousTimers();

        return `
🕒 RELATÓRIO DE TIMERS
=====================
Timers ativos: ${stats.activeCount}
- Timeouts: ${stats.byType.timeout}
- Intervals: ${stats.byType.interval}

Timer mais antigo: ${stats.oldestTimer}ms
Timers suspeitos: ${suspicious.length}

Detalhes:
${stats.timers.map((t) => `  ${t.id}: ${t.description} (${t.type}, ${t.age}ms)`).join('\n')}
        `.trim();
    }
}

// Exporta instância singleton
export const timerManager = new TimerManager();

// Expõe funções convenientes para compatibilidade
export const createManagedTimer = (callback, delay, description) =>
    timerManager.createTimer(callback, delay, description);

export const createManagedInterval = (callback, interval, description) =>
    timerManager.createInterval(callback, interval, description);

export const clearManagedTimer = (timerId) => timerManager.clear(timerId);

export const clearAllManagedTimers = () => timerManager.clearAll();
