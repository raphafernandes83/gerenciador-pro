/**
 * Sistema de Debounce Inteligente
 * Otimiza updates de charts e UI com coalescing e priorização
 */

class SmartDebouncer {
    constructor() {
        this.pendingUpdates = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        this.frameId = null;
        this.config = {
            maxBatchSize: 10,
            maxWaitTime: 100, // ms
            highPriorityDelay: 16, // 1 frame
            normalPriorityDelay: 50,
            lowPriorityDelay: 100,
        };
    }

    /**
     * Agenda uma atualização com debounce inteligente
     * @param {string} key - Chave única para a operação
     * @param {Function} updateFn - Função de atualização
     * @param {Object} options - Opções de configuração
     */
    scheduleUpdate(key, updateFn, options = {}) {
        const {
            priority = 'normal', // 'high', 'normal', 'low'
            coalesce = true, // Combinar múltiplas chamadas
            immediate = false, // Executar imediatamente
            context = {}, // Contexto adicional
        } = options;

        // Se immediate, executar agora
        if (immediate) {
            this._executeUpdate(key, updateFn, context);
            return;
        }

        // Cancelar update anterior se coalescing estiver ativo
        if (coalesce && this.pendingUpdates.has(key)) {
            const existing = this.pendingUpdates.get(key);
            clearTimeout(existing.timeoutId);
        }

        // Determinar delay baseado na prioridade
        const delay = this._getDelayForPriority(priority);

        // Agendar novo update
        const timeoutId = setTimeout(() => {
            this._executeUpdate(key, updateFn, context);
            this.pendingUpdates.delete(key);
        }, delay);

        // Armazenar referência
        this.pendingUpdates.set(key, {
            updateFn,
            priority,
            context,
            timeoutId,
            scheduledAt: performance.now(),
        });
    }

    /**
     * Agenda múltiplas atualizações em batch
     * @param {Array} updates - Array de objetos {key, updateFn, options}
     */
    scheduleBatch(updates) {
        // Agrupar por prioridade
        const priorityGroups = {
            high: [],
            normal: [],
            low: [],
        };

        updates.forEach((update) => {
            const priority = update.options?.priority || 'normal';
            priorityGroups[priority].push(update);
        });

        // Processar grupos por prioridade
        ['high', 'normal', 'low'].forEach((priority) => {
            const group = priorityGroups[priority];
            if (group.length === 0) return;

            // Usar requestAnimationFrame para alta prioridade
            if (priority === 'high') {
                this._scheduleHighPriorityBatch(group);
            } else {
                group.forEach((update) => {
                    this.scheduleUpdate(update.key, update.updateFn, update.options);
                });
            }
        });
    }

    /**
     * Força execução imediata de todas as atualizações pendentes
     * @param {string} priorityFilter - Filtrar por prioridade (opcional)
     */
    flushPending(priorityFilter = null) {
        const toExecute = [];

        for (const [key, update] of this.pendingUpdates.entries()) {
            if (!priorityFilter || update.priority === priorityFilter) {
                clearTimeout(update.timeoutId);
                toExecute.push({ key, ...update });
                this.pendingUpdates.delete(key);
            }
        }

        // Executar em ordem de prioridade
        toExecute
            .sort(
                (a, b) => this._getPriorityWeight(a.priority) - this._getPriorityWeight(b.priority)
            )
            .forEach((update) => {
                this._executeUpdate(update.key, update.updateFn, update.context);
            });
    }

    /**
     * Cancela uma atualização pendente
     * @param {string} key - Chave da operação
     */
    cancelUpdate(key) {
        if (this.pendingUpdates.has(key)) {
            const update = this.pendingUpdates.get(key);
            clearTimeout(update.timeoutId);
            this.pendingUpdates.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Obtém estatísticas do debouncer
     * @returns {Object} Estatísticas
     */
    getStats() {
        const pending = Array.from(this.pendingUpdates.values());
        const now = performance.now();

        return {
            pendingCount: pending.length,
            pendingByPriority: {
                high: pending.filter((u) => u.priority === 'high').length,
                normal: pending.filter((u) => u.priority === 'normal').length,
                low: pending.filter((u) => u.priority === 'low').length,
            },
            averageWaitTime:
                pending.length > 0
                    ? pending.reduce((sum, u) => sum + (now - u.scheduledAt), 0) / pending.length
                    : 0,
            isProcessing: this.isProcessing,
            queueSize: this.updateQueue.length,
        };
    }

    /**
     * Limpa todas as atualizações pendentes
     */
    clear() {
        // Cancelar todos os timeouts
        for (const update of this.pendingUpdates.values()) {
            clearTimeout(update.timeoutId);
        }

        // Cancelar frame de animação
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        // Limpar estruturas
        this.pendingUpdates.clear();
        this.updateQueue = [];
        this.isProcessing = false;
    }

    // Métodos privados
    _executeUpdate(key, updateFn, context) {
        let measurementId = null;

        try {
            measurementId = window.performanceProfiler?.startMeasurement('debounced_update', {
                key,
                context,
            });

            const result = updateFn();

            if (measurementId) {
                window.performanceProfiler?.endMeasurement(measurementId, {
                    key,
                    success: true,
                });
            }

            return result;
        } catch (error) {
            console.error(`Erro na atualização debounced [${key}]:`, error);

            if (measurementId) {
                window.performanceProfiler?.endMeasurement(measurementId, {
                    key,
                    success: false,
                    error: error.message,
                });
            }
        }
    }

    _getDelayForPriority(priority) {
        switch (priority) {
            case 'high':
                return this.config.highPriorityDelay;
            case 'low':
                return this.config.lowPriorityDelay;
            default:
                return this.config.normalPriorityDelay;
        }
    }

    _getPriorityWeight(priority) {
        switch (priority) {
            case 'high':
                return 1;
            case 'normal':
                return 2;
            case 'low':
                return 3;
            default:
                return 2;
        }
    }

    _scheduleHighPriorityBatch(updates) {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }

        this.frameId = requestAnimationFrame(() => {
            updates.forEach((update) => {
                this._executeUpdate(update.key, update.updateFn, update.options?.context || {});
            });
            this.frameId = null;
        });
    }
}

// Instância global do debouncer
const smartDebouncer = new SmartDebouncer();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.smartDebouncer = smartDebouncer;
}

export default smartDebouncer;
