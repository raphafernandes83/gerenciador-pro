/**
 * @fileoverview Plugin de Observação de Estado
 * @description Implementa Observer Pattern para sincronização automática
 * @version 1.0.0
 */

import { IChartPlugin } from '../UnifiedChartSystem.js';

export class StateObserverPlugin extends IChartPlugin {
    constructor() {
        super();
        this.observers = new Map();
        this.stateWatchers = new Map();
        this.mutationObserver = null;
        this.intervalId = null;
    }
    
    initialize(chartSystem) {
        this.chartSystem = chartSystem;
        this._initializeStateWatching();
        console.log('👁️ Plugin de Observação de Estado inicializado');
    }
    
    _initializeStateWatching() {
        // Observa mudanças no window.state.historicoCombinado
        this._watchGlobalState();
        
        // Observa mudanças no DOM
        this._watchDOMChanges();
        
        // Observa mudanças em elementos específicos
        this._watchSpecificElements();
    }
    
    _watchGlobalState() {
        let lastHistoryLength = 0;
        let lastHistoryHash = '';
        
        const checkGlobalState = () => {
            try {
                const history = window.state?.historicoCombinado || [];
                const currentLength = history.length;
                const currentHash = this._hashArray(history);
                
                if (currentLength !== lastHistoryLength || currentHash !== lastHistoryHash) {
                    console.log(`👁️ Mudança detectada no histórico: ${lastHistoryLength} → ${currentLength}`);
                    
                    // Calcula dados para o gráfico
                    const wins = history.filter(op => op.isWin === true).length;
                    const losses = history.filter(op => op.isWin === false).length;
                    
                    // Atualiza gráfico automaticamente
                    this.chartSystem.updateChart('#progress-pie-chart', { wins, losses });
                    
                    // Notifica observadores
                    this._notifyObservers('historyChanged', { history, wins, losses });
                    
                    lastHistoryLength = currentLength;
                    lastHistoryHash = currentHash;
                }
            } catch (error) {
                console.error('❌ Erro ao observar estado global:', error);
            }
        };
        
        // Verifica a cada 500ms
        this.intervalId = setInterval(checkGlobalState, 500);
        
        // Verifica imediatamente
        checkGlobalState();
    }
    
    _watchDOMChanges() {
        if (!this.mutationObserver) {
            this.mutationObserver = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                mutations.forEach((mutation) => {
                    // Verifica se elementos relacionados aos gráficos foram modificados
                    if (mutation.type === 'childList') {
                        const addedNodes = Array.from(mutation.addedNodes);
                        const removedNodes = Array.from(mutation.removedNodes);
                        
                        const relevantChanges = [...addedNodes, ...removedNodes].some(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                return node.id === 'progress-pie-chart' || 
                                       node.classList?.contains('win-loss-counters') ||
                                       node.closest('#progress-pie-chart');
                            }
                            return false;
                        });
                        
                        if (relevantChanges) {
                            shouldUpdate = true;
                        }
                    }
                });
                
                if (shouldUpdate) {
                    console.log('👁️ Mudança relevante no DOM detectada');
                    this._notifyObservers('domChanged', { mutations });
                    
                    // Re-inicializa gráfico se necessário
                    setTimeout(() => {
                        if (document.querySelector('#progress-pie-chart') && 
                            !this.chartSystem.getChartInfo('#progress-pie-chart')) {
                            
                            const history = window.state?.historicoCombinado || [];
                            const wins = history.filter(op => op.isWin === true).length;
                            const losses = history.filter(op => op.isWin === false).length;
                            
                            this.chartSystem.createChart('#progress-pie-chart', { wins, losses });
                        }
                    }, 100);
                }
            });
            
            // Observa mudanças no documento
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['id', 'class']
            });
        }
    }
    
    _watchSpecificElements() {
        // Observa mudanças em elementos de contador
        const winsCounter = document.querySelector('#wins-counter');
        const lossesCounter = document.querySelector('#losses-counter');
        
        if (winsCounter || lossesCounter) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const element = mutation.target;
                        const newValue = element.textContent || element.innerText;
                        
                        console.log(`👁️ Contador atualizado: ${element.id} = ${newValue}`);
                        this._notifyObservers('counterChanged', { 
                            elementId: element.id, 
                            newValue: parseInt(newValue) || 0 
                        });
                    }
                });
            });
            
            if (winsCounter) {
                observer.observe(winsCounter, { childList: true, characterData: true, subtree: true });
            }
            
            if (lossesCounter) {
                observer.observe(lossesCounter, { childList: true, characterData: true, subtree: true });
            }
        }
    }
    
    _hashArray(array) {
        // Cria hash simples do array para detectar mudanças
        return JSON.stringify(array.map(item => ({
            isWin: item.isWin,
            valor: item.valor,
            timestamp: item.timestamp
        }))).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString();
    }
    
    /**
     * Adiciona observador para eventos específicos
     */
    addObserver(eventType, callback) {
        if (!this.observers.has(eventType)) {
            this.observers.set(eventType, new Set());
        }
        
        this.observers.get(eventType).add(callback);
        console.log(`👁️ Observador adicionado para '${eventType}'`);
    }
    
    /**
     * Remove observador
     */
    removeObserver(eventType, callback) {
        const observers = this.observers.get(eventType);
        if (observers) {
            observers.delete(callback);
            if (observers.size === 0) {
                this.observers.delete(eventType);
            }
        }
    }
    
    /**
     * Notifica todos os observadores de um evento
     */
    _notifyObservers(eventType, data) {
        const observers = this.observers.get(eventType);
        if (observers) {
            observers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erro no observador de '${eventType}':`, error);
                }
            });
        }
    }
    
    /**
     * Força verificação manual do estado
     */
    forceStateCheck() {
        console.log('👁️ Verificação forçada do estado');
        // Trigger da verificação será executado no próximo ciclo
    }
    
    /**
     * Obtém estatísticas dos observadores
     */
    getObserverStats() {
        const stats = {};
        for (const [eventType, observers] of this.observers) {
            stats[eventType] = observers.size;
        }
        return stats;
    }
    
    destroy() {
        // Limpa interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Desconecta mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // Limpa observadores
        this.observers.clear();
        this.stateWatchers.clear();
        
        console.log('👁️ Plugin de Observação de Estado destruído');
    }
}
