/**
 * ⚡ Performance Optimizer - Sistema de Otimização de Re-renders
 * 
 * Sistema para memoização, debouncing e otimização de atualizações
 * do DOM para evitar re-renders desnecessários no card de progresso.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Utilities
import { logger } from '../../src/utils/Logger.js';

// ============================================================================
// SISTEMA DE MEMOIZAÇÃO
// ============================================================================

/**
 * 🧠 Cache para memoização de resultados
 */
const memoCache = new Map();

/**
 * 🧠 Memoiza resultados de funções para evitar recálculos desnecessários
 * @param {Function} fn - Função a ser memoizada
 * @param {Function} keyGenerator - Função para gerar chave do cache
 * @returns {Function} Função memoizada
 */
export function memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    return function memoizedFunction(...args) {
        const key = keyGenerator(...args);
        
        if (memoCache.has(key)) {
            logger.debug('🧠 Cache hit para:', { function: fn.name, key });
            return memoCache.get(key);
        }
        
        const result = fn.apply(this, args);
        memoCache.set(key, result);
        
        // Limita o tamanho do cache
        if (memoCache.size > 100) {
            const firstKey = memoCache.keys().next().value;
            memoCache.delete(firstKey);
        }
        
        logger.debug('🧠 Cache miss, resultado armazenado:', { function: fn.name, key });
        return result;
    };
}

/**
 * 🧹 Limpa cache de memoização
 * @param {string} pattern - Padrão para limpar (opcional)
 */
export function clearMemoCache(pattern = null) {
    if (pattern) {
        for (const [key] of memoCache) {
            if (key.includes(pattern)) {
                memoCache.delete(key);
            }
        }
        logger.debug('🧹 Cache parcial limpo:', { pattern });
    } else {
        memoCache.clear();
        logger.debug('🧹 Cache completamente limpo');
    }
}

// ============================================================================
// SISTEMA DE DEBOUNCING
// ============================================================================

/**
 * 📦 Armazena timeouts para debouncing
 */
const debounceTimeouts = new Map();

/**
 * ⏱️ Debounce para evitar execuções excessivas
 * @param {Function} fn - Função a ser executada
 * @param {number} delay - Delay em ms
 * @param {string} key - Chave única para o debounce
 * @returns {Function} Função com debounce
 */
export function debounce(fn, delay = 100, key = 'default') {
    return function debouncedFunction(...args) {
        // Cancela execução anterior
        if (debounceTimeouts.has(key)) {
            clearTimeout(debounceTimeouts.get(key));
        }
        
        // Agenda nova execução
        const timeoutId = setTimeout(() => {
            fn.apply(this, args);
            debounceTimeouts.delete(key);
        }, delay);
        
        debounceTimeouts.set(key, timeoutId);
    };
}

// ============================================================================
// SISTEMA DE COMPARAÇÃO DE DADOS
// ============================================================================

/**
 * 🔍 Compara objetos profundamente para detectar mudanças
 * @param {any} obj1 - Objeto 1
 * @param {any} obj2 - Objeto 2
 * @returns {boolean} True se são iguais
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
}

/**
 * 🔍 Detecta mudanças específicas em dados do card
 * @param {Object} newData - Novos dados
 * @param {Object} oldData - Dados anteriores
 * @returns {Object} Mudanças detectadas
 */
export function detectChanges(newData, oldData) {
    if (!oldData) {
        return {
            hasChanges: true,
            changedFields: ['all'],
            reason: 'first_render'
        };
    }
    
    const changes = {
        hasChanges: false,
        changedFields: [],
        reason: null
    };
    
    // Verifica mudanças em campos específicos
    const fieldsToCheck = [
        'stats.winRate',
        'stats.lossRate', 
        'stats.totalOperations',
        'monetary.achievedAmount',
        'monetary.progressPercent',
        'monetary.sessionPL'
    ];
    
    for (const field of fieldsToCheck) {
        const newValue = getNestedValue(newData, field);
        const oldValue = getNestedValue(oldData, field);
        
        if (!deepEqual(newValue, oldValue)) {
            changes.hasChanges = true;
            changes.changedFields.push(field);
        }
    }
    
    if (changes.hasChanges) {
        changes.reason = 'data_changed';
    }
    
    return changes;
}

/**
 * 🔍 Obtém valor aninhado de objeto usando notação de ponto
 * @param {Object} obj - Objeto
 * @param {string} path - Caminho (ex: 'stats.winRate')
 * @returns {any} Valor encontrado
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ============================================================================
// SISTEMA DE OTIMIZAÇÃO DE DOM
// ============================================================================

/**
 * 📊 Armazena estado anterior dos elementos DOM
 */
const domStateCache = new Map();

/**
 * 🎯 Atualiza elemento DOM apenas se necessário
 * @param {HTMLElement} element - Elemento DOM
 * @param {Object} newState - Novo estado
 * @param {string} elementKey - Chave única do elemento
 * @returns {boolean} True se foi atualizado
 */
export function updateElementIfChanged(element, newState, elementKey) {
    if (!element) return false;
    
    const oldState = domStateCache.get(elementKey);
    
    // Compara estados
    if (oldState && deepEqual(newState, oldState)) {
        logger.debug('⚡ DOM update skipped (no changes):', { element: elementKey });
        return false;
    }
    
    // Aplica mudanças
    if (newState.textContent !== undefined) {
        element.textContent = newState.textContent;
    }
    
    if (newState.className !== undefined) {
        element.className = newState.className;
    }
    
    if (newState.style) {
        Object.entries(newState.style).forEach(([prop, value]) => {
            element.style[prop] = value;
        });
    }
    
    if (newState.attributes) {
        Object.entries(newState.attributes).forEach(([attr, value]) => {
            if (value === null) {
                element.removeAttribute(attr);
            } else {
                element.setAttribute(attr, value);
            }
        });
    }
    
    // Armazena novo estado
    domStateCache.set(elementKey, { ...newState });
    
    logger.debug('⚡ DOM updated:', { element: elementKey, changes: newState });
    return true;
}

/**
 * 🧹 Limpa cache de estado DOM
 * @param {string} pattern - Padrão para limpar (opcional)
 */
export function clearDOMStateCache(pattern = null) {
    if (pattern) {
        for (const [key] of domStateCache) {
            if (key.includes(pattern)) {
                domStateCache.delete(key);
            }
        }
    } else {
        domStateCache.clear();
    }
}

// ============================================================================
// SISTEMA DE BATCHING DE ATUALIZAÇÕES
// ============================================================================

/**
 * 📦 Fila de atualizações pendentes
 */
const updateQueue = [];
let isProcessingQueue = false;

/**
 * 📦 Adiciona atualização à fila para processamento em lote
 * @param {Function} updateFn - Função de atualização
 * @param {string} priority - Prioridade (high, normal, low)
 */
export function queueUpdate(updateFn, priority = 'normal') {
    updateQueue.push({
        fn: updateFn,
        priority,
        timestamp: Date.now()
    });
    
    if (!isProcessingQueue) {
        scheduleQueueProcessing();
    }
}

/**
 * ⚡ Agenda processamento da fila de atualizações
 */
function scheduleQueueProcessing() {
    isProcessingQueue = true;
    
    // Usa requestAnimationFrame para otimizar performance
    requestAnimationFrame(() => {
        processUpdateQueue();
        isProcessingQueue = false;
    });
}

/**
 * ⚡ Processa fila de atualizações em lote
 */
function processUpdateQueue() {
    if (updateQueue.length === 0) return;
    
    // Ordena por prioridade
    updateQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    const startTime = performance.now();
    let processedCount = 0;
    
    // Processa atualizações até limite de tempo (16ms para 60fps)
    while (updateQueue.length > 0 && (performance.now() - startTime) < 16) {
        const update = updateQueue.shift();
        try {
            update.fn();
            processedCount++;
        } catch (error) {
            logger.error('❌ Erro ao processar atualização:', { error: String(error) });
        }
    }
    
    logger.debug('⚡ Batch update processed:', {
        processed: processedCount,
        remaining: updateQueue.length,
        time: `${(performance.now() - startTime).toFixed(2)}ms`
    });
    
    // Se ainda há atualizações, agenda próximo lote
    if (updateQueue.length > 0) {
        scheduleQueueProcessing();
    }
}

// ============================================================================
// SISTEMA DE MONITORAMENTO DE PERFORMANCE
// ============================================================================

/**
 * 📊 Métricas de performance
 */
const performanceMetrics = {
    renders: 0,
    skippedRenders: 0,
    totalTime: 0,
    averageTime: 0
};

/**
 * 📊 Mede performance de uma operação
 * @param {Function} fn - Função a ser medida
 * @param {string} name - Nome da operação
 * @returns {any} Resultado da função
 */
export function measurePerformance(fn, name = 'operation') {
    const startTime = performance.now();
    
    try {
        const result = fn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Atualiza métricas
        performanceMetrics.renders++;
        performanceMetrics.totalTime += duration;
        performanceMetrics.averageTime = performanceMetrics.totalTime / performanceMetrics.renders;
        
        logger.debug('📊 Performance measured:', {
            operation: name,
            duration: `${duration.toFixed(2)}ms`,
            average: `${performanceMetrics.averageTime.toFixed(2)}ms`
        });
        
        return result;
    } catch (error) {
        logger.error('❌ Erro durante medição de performance:', { error: String(error) });
        throw error;
    }
}

/**
 * 📊 Obtém métricas de performance
 * @returns {Object} Métricas atuais
 */
export function getPerformanceMetrics() {
    return { ...performanceMetrics };
}

/**
 * 🧹 Reseta métricas de performance
 */
export function resetPerformanceMetrics() {
    performanceMetrics.renders = 0;
    performanceMetrics.skippedRenders = 0;
    performanceMetrics.totalTime = 0;
    performanceMetrics.averageTime = 0;
}

// ============================================================================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ============================================================================

if (typeof window !== 'undefined') {
    window.memoize = memoize;
    window.debounce = debounce;
    window.detectChanges = detectChanges;
    window.updateElementIfChanged = updateElementIfChanged;
    window.queueUpdate = queueUpdate;
    window.measurePerformance = measurePerformance;
    window.getPerformanceMetrics = getPerformanceMetrics;
    
    logger.debug('⚡ Performance Optimizer disponível globalmente');
}




