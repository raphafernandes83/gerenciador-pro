/**
 * 🏪 State Manager - Gerenciador Centralizado de Estado
 * 
 * Sistema centralizado para gerenciar o estado do card de progresso,
 * garantindo consistência, observabilidade e sincronização de dados.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Utilities
import { logger } from '../../src/utils/Logger.js';
import { debounce } from './performance-optimizer.js';

// ============================================================================
// DEFINIÇÃO DO ESTADO INICIAL
// ============================================================================

/**
 * 📊 Estado inicial do card de progresso
 */
const INITIAL_STATE = {
    // Dados principais
    stats: {
        winRate: 0,
        lossRate: 0,
        totalOperations: 0,
        lastUpdated: null
    },
    
    // Dados monetários
    monetary: {
        achievedAmount: 0,
        targetAmount: 0,
        progressPercent: 0,
        sessionPL: 0,
        riskUsed: 0,
        lastUpdated: null
    },
    
    // Pontos percentuais
    pointsPercentage: {
        winRate: null,
        lossRate: null,
        lastCalculated: null
    },
    
    // Estado da UI
    ui: {
        isVisible: true,
        isLoading: false,
        hasErrors: false,
        lastRender: null,
        theme: 'default'
    },
    
    // Configurações
    config: {
        metaWinRate: 60,
        metaLossRate: 40,
        autoUpdate: true,
        optimizedRendering: true
    },
    
    // Metadados
    meta: {
        version: '1.0.0',
        created: Date.now(),
        lastModified: Date.now(),
        changeCount: 0
    }
};

// ============================================================================
// CLASSE DO GERENCIADOR DE ESTADO
// ============================================================================

/**
 * 🏪 Gerenciador centralizado de estado
 */
class ProgressCardStateManager {
    constructor() {
        this.state = this.deepClone(INITIAL_STATE);
        this.observers = new Map();
        this.history = [];
        this.maxHistorySize = 50;
        this.isUpdating = false;
        
        // Debounced functions
        this.debouncedNotify = debounce(this.notifyObservers.bind(this), 16); // 60fps
        this.debouncedSave = debounce(this.saveToStorage.bind(this), 1000); // 1s
        
        logger.debug('🏪 State Manager inicializado');
    }
    
    // ========================================================================
    // MÉTODOS DE ACESSO AO ESTADO
    // ========================================================================
    
    /**
     * 📖 Obtém o estado atual (somente leitura)
     * @returns {Object} Estado atual
     */
    getState() {
        return this.deepClone(this.state);
    }
    
    /**
     * 📖 Obtém uma parte específica do estado
     * @param {string} path - Caminho (ex: 'stats.winRate')
     * @returns {any} Valor encontrado
     */
    getStateValue(path) {
        return this.getNestedValue(this.state, path);
    }
    
    /**
     * 📊 Obtém estatísticas do estado
     * @returns {Object} Estatísticas
     */
    getStateStats() {
        return {
            changeCount: this.state.meta.changeCount,
            lastModified: this.state.meta.lastModified,
            historySize: this.history.length,
            observersCount: this.observers.size,
            isValid: this.validateState().isValid
        };
    }
    
    // ========================================================================
    // MÉTODOS DE ATUALIZAÇÃO DO ESTADO
    // ========================================================================
    
    /**
     * ✏️ Atualiza o estado de forma controlada
     * @param {Object} updates - Atualizações a aplicar
     * @param {Object} options - Opções de atualização
     * @returns {boolean} True se atualização foi aplicada
     */
    updateState(updates, options = {}) {
        const {
            merge = true,
            validate = true,
            notify = true,
            saveHistory = true,
            source = 'unknown'
        } = options;
        
        if (this.isUpdating) {
            logger.warn('⚠️ Tentativa de atualização durante outra atualização');
            return false;
        }
        
        try {
            this.isUpdating = true;
            
            // Salva estado anterior no histórico
            if (saveHistory) {
                this.saveToHistory(source);
            }
            
            // Aplica atualizações
            const newState = merge ? 
                this.deepMerge(this.state, updates) : 
                { ...INITIAL_STATE, ...updates };
            
            // Validação opcional
            if (validate) {
                const validation = this.validateState(newState);
                if (!validation.isValid) {
                    logger.error('❌ Estado inválido rejeitado:', validation.errors);
                    return false;
                }
            }
            
            // Atualiza metadados
            newState.meta.lastModified = Date.now();
            newState.meta.changeCount++;
            
            // Aplica novo estado
            this.state = newState;
            
            logger.debug('✏️ Estado atualizado:', {
                source,
                changes: Object.keys(updates),
                changeCount: this.state.meta.changeCount
            });
            
            // Notifica observadores
            if (notify) {
                this.debouncedNotify(updates, source);
            }
            
            // Salva no storage
            this.debouncedSave();
            
            return true;
            
        } catch (error) {
            logger.error('❌ Erro ao atualizar estado:', { error: String(error) });
            return false;
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * ✏️ Atualiza uma parte específica do estado
     * @param {string} path - Caminho (ex: 'stats.winRate')
     * @param {any} value - Novo valor
     * @param {Object} options - Opções
     * @returns {boolean} True se atualização foi aplicada
     */
    setStateValue(path, value, options = {}) {
        const updates = this.createNestedUpdate(path, value);
        return this.updateState(updates, { ...options, source: `setValue:${path}` });
    }
    
    /**
     * 🔄 Reseta o estado para valores iniciais
     * @param {Object} options - Opções de reset
     */
    resetState(options = {}) {
        const { keepConfig = true, keepMeta = false } = options;
        
        const newState = this.deepClone(INITIAL_STATE);
        
        if (keepConfig && this.state.config) {
            newState.config = { ...this.state.config };
        }
        
        if (keepMeta && this.state.meta) {
            newState.meta = { ...this.state.meta };
            newState.meta.lastModified = Date.now();
        }
        
        this.state = newState;
        this.history = [];
        
        this.notifyObservers({}, 'reset');
        logger.debug('🔄 Estado resetado');
    }
    
    // ========================================================================
    // SISTEMA DE OBSERVADORES
    // ========================================================================
    
    /**
     * 👁️ Adiciona observador para mudanças de estado
     * @param {string} id - ID único do observador
     * @param {Function} callback - Função a ser chamada
     * @param {Object} options - Opções do observador
     */
    addObserver(id, callback, options = {}) {
        const {
            paths = [], // Caminhos específicos para observar
            immediate = false, // Chama imediatamente
            debounce = true // Usa debounce
        } = options;
        
        this.observers.set(id, {
            callback,
            paths,
            debounce,
            created: Date.now()
        });
        
        if (immediate) {
            callback(this.getState(), {}, 'immediate');
        }
        
        logger.debug('👁️ Observador adicionado:', { id, paths });
    }
    
    /**
     * 👁️ Remove observador
     * @param {string} id - ID do observador
     */
    removeObserver(id) {
        const removed = this.observers.delete(id);
        if (removed) {
            logger.debug('👁️ Observador removido:', { id });
        }
        return removed;
    }
    
    /**
     * 📢 Notifica todos os observadores sobre mudanças
     * @param {Object} changes - Mudanças aplicadas
     * @param {string} source - Fonte da mudança
     */
    notifyObservers(changes, source = 'unknown') {
        const currentState = this.getState();
        const changeKeys = Object.keys(changes);
        
        this.observers.forEach((observer, id) => {
            try {
                // Verifica se observador está interessado nessas mudanças
                const isInterested = observer.paths.length === 0 || 
                    observer.paths.some(path => 
                        changeKeys.some(key => key.startsWith(path) || path.startsWith(key))
                    );
                
                if (isInterested) {
                    observer.callback(currentState, changes, source);
                }
            } catch (error) {
                logger.error('❌ Erro em observador:', { id, error: String(error) });
            }
        });
        
        logger.debug('📢 Observadores notificados:', {
            count: this.observers.size,
            changes: changeKeys,
            source
        });
    }
    
    // ========================================================================
    // HISTÓRICO E DESFAZER
    // ========================================================================
    
    /**
     * 💾 Salva estado atual no histórico
     * @param {string} source - Fonte da mudança
     */
    saveToHistory(source) {
        this.history.push({
            state: this.deepClone(this.state),
            timestamp: Date.now(),
            source
        });
        
        // Limita tamanho do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * ↩️ Desfaz última mudança
     * @returns {boolean} True se desfez com sucesso
     */
    undo() {
        if (this.history.length === 0) {
            logger.warn('⚠️ Nenhum estado para desfazer');
            return false;
        }
        
        const previousEntry = this.history.pop();
        this.state = previousEntry.state;
        
        this.notifyObservers({}, 'undo');
        logger.debug('↩️ Estado desfeito:', { source: previousEntry.source });
        
        return true;
    }
    
    /**
     * 📜 Obtém histórico de mudanças
     * @param {number} limit - Limite de entradas
     * @returns {Array} Histórico
     */
    getHistory(limit = 10) {
        return this.history
            .slice(-limit)
            .map(entry => ({
                timestamp: entry.timestamp,
                source: entry.source,
                changeCount: entry.state.meta.changeCount
            }));
    }
    
    // ========================================================================
    // VALIDAÇÃO DE ESTADO
    // ========================================================================
    
    /**
     * ✅ Valida integridade do estado
     * @param {Object} state - Estado a validar (opcional)
     * @returns {Object} Resultado da validação
     */
    validateState(state = this.state) {
        const errors = [];
        
        try {
            // Valida estrutura básica
            if (!state || typeof state !== 'object') {
                errors.push('Estado deve ser um objeto');
            }
            
            // Valida stats
            if (state.stats) {
                if (typeof state.stats.winRate !== 'number' || state.stats.winRate < 0 || state.stats.winRate > 100) {
                    errors.push('winRate deve ser um número entre 0 e 100');
                }
                
                if (typeof state.stats.lossRate !== 'number' || state.stats.lossRate < 0 || state.stats.lossRate > 100) {
                    errors.push('lossRate deve ser um número entre 0 e 100');
                }
                
                if (typeof state.stats.totalOperations !== 'number' || state.stats.totalOperations < 0) {
                    errors.push('totalOperations deve ser um número não-negativo');
                }
            }
            
            // Valida monetary
            if (state.monetary) {
                if (typeof state.monetary.achievedAmount !== 'number') {
                    errors.push('achievedAmount deve ser um número');
                }
                
                if (typeof state.monetary.progressPercent !== 'number' || 
                    state.monetary.progressPercent < 0 || state.monetary.progressPercent > 100) {
                    errors.push('progressPercent deve ser um número entre 0 e 100');
                }
            }
            
            // Valida config
            if (state.config) {
                if (typeof state.config.metaWinRate !== 'number' || 
                    state.config.metaWinRate < 0 || state.config.metaWinRate > 100) {
                    errors.push('metaWinRate deve ser um número entre 0 e 100');
                }
            }
            
        } catch (error) {
            errors.push(`Erro durante validação: ${error.message}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            timestamp: Date.now()
        };
    }
    
    // ========================================================================
    // PERSISTÊNCIA
    // ========================================================================
    
    /**
     * 💾 Salva estado no localStorage
     */
    saveToStorage() {
        try {
            const stateToSave = {
                ...this.state,
                meta: {
                    ...this.state.meta,
                    savedAt: Date.now()
                }
            };
            
            localStorage.setItem('progressCardState', JSON.stringify(stateToSave));
            logger.debug('💾 Estado salvo no storage');
        } catch (error) {
            logger.error('❌ Erro ao salvar no storage:', { error: String(error) });
        }
    }
    
    /**
     * 📖 Carrega estado do localStorage
     * @returns {boolean} True se carregou com sucesso
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('progressCardState');
            if (!saved) return false;
            
            const parsedState = JSON.parse(saved);
            const validation = this.validateState(parsedState);
            
            if (!validation.isValid) {
                logger.warn('⚠️ Estado salvo inválido, usando padrão');
                return false;
            }
            
            this.state = parsedState;
            logger.debug('📖 Estado carregado do storage');
            return true;
        } catch (error) {
            logger.error('❌ Erro ao carregar do storage:', { error: String(error) });
            return false;
        }
    }
    
    // ========================================================================
    // UTILITÁRIOS INTERNOS
    // ========================================================================
    
    /**
     * 🔍 Obtém valor aninhado usando notação de ponto
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * ✏️ Cria objeto de atualização aninhada
     */
    createNestedUpdate(path, value) {
        const keys = path.split('.');
        const result = {};
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return result;
    }
    
    /**
     * 🔄 Clona objeto profundamente
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    /**
     * 🔄 Merge profundo de objetos
     */
    deepMerge(target, source) {
        const result = this.deepClone(target);
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

/**
 * 🏪 Instância singleton do gerenciador de estado
 */
export const stateManager = new ProgressCardStateManager();

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * 📖 Obtém estado atual
 */
export const getProgressCardState = () => stateManager.getState();

/**
 * ✏️ Atualiza estado
 */
export const updateProgressCardState = (updates, options) => 
    stateManager.updateState(updates, options);

/**
 * 👁️ Observa mudanças de estado
 */
export const observeProgressCardState = (id, callback, options) => 
    stateManager.addObserver(id, callback, options);

/**
 * 🔄 Reseta estado
 */
export const resetProgressCardState = (options) => 
    stateManager.resetState(options);

// ============================================================================
// EXPOSIÇÃO GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
    window.progressCardStateManager = stateManager;
    window.getProgressCardState = getProgressCardState;
    window.updateProgressCardState = updateProgressCardState;
    window.observeProgressCardState = observeProgressCardState;
    
    logger.debug('🏪 State Manager disponível globalmente');
}




