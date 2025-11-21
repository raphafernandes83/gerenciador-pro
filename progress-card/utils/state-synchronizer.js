/**
 * 🔄 State Synchronizer - Sincronizador de Estado
 * 
 * Sistema para sincronizar o estado centralizado com os componentes
 * existentes do card de progresso, garantindo consistência bidirecional.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// State management
import { 
    stateManager, 
    getProgressCardState, 
    updateProgressCardState,
    observeProgressCardState 
} from './state-manager.js';

// Core modules
import { dom } from '../../dom.js';

// Business logic
import { validateCardData } from '../business/logic.js';
import { calculateProgressCardData } from '../business/calculator.js';

// UI rendering
import { updateProgressCardOptimized } from '../ui/optimized-renderer.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';
import { debounce } from './performance-optimizer.js';

// ============================================================================
// CONFIGURAÇÃO DE SINCRONIZAÇÃO
// ============================================================================

/**
 * 📋 Configuração dos sincronizadores
 */
const SYNC_CONFIG = {
    // Intervalo de sincronização automática (ms)
    autoSyncInterval: 5000,
    
    // Debounce para atualizações externas (ms)
    externalUpdateDebounce: 100,
    
    // Debounce para atualizações da UI (ms)
    uiUpdateDebounce: 16,
    
    // Campos que devem ser sincronizados automaticamente
    autoSyncFields: [
        'stats.winRate',
        'stats.lossRate', 
        'stats.totalOperations',
        'monetary.achievedAmount',
        'monetary.sessionPL'
    ],
    
    // Campos que devem disparar re-render da UI
    uiTriggerFields: [
        'stats',
        'monetary',
        'pointsPercentage',
        'ui.theme'
    ]
};

// ============================================================================
// CLASSE DO SINCRONIZADOR
// ============================================================================

/**
 * 🔄 Sincronizador de estado
 */
class ProgressCardStateSynchronizer {
    constructor() {
        this.isInitialized = false;
        this.syncInterval = null;
        this.lastExternalSync = 0;
        this.lastUISync = 0;
        
        // Debounced functions
        this.debouncedExternalUpdate = debounce(
            this.syncFromExternal.bind(this), 
            SYNC_CONFIG.externalUpdateDebounce
        );
        
        this.debouncedUIUpdate = debounce(
            this.syncToUI.bind(this), 
            SYNC_CONFIG.uiUpdateDebounce
        );
        
        logger.debug('🔄 State Synchronizer criado');
    }
    
    // ========================================================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // ========================================================================
    
    /**
     * 🚀 Inicializa o sincronizador
     * @param {Object} options - Opções de inicialização
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            logger.warn('⚠️ Sincronizador já inicializado');
            return;
        }
        
        const {
            loadFromStorage = true,
            enableAutoSync = true,
            enableUISync = true
        } = options;
        
        try {
            // Carrega estado salvo
            if (loadFromStorage) {
                stateManager.loadFromStorage();
            }
            
            // Configura observadores de estado
            this.setupStateObservers();
            
            // Configura sincronização automática
            if (enableAutoSync) {
                this.startAutoSync();
            }
            
            // Configura sincronização com UI
            if (enableUISync) {
                this.setupUISync();
            }
            
            // Sincronização inicial
            this.performInitialSync();
            
            this.isInitialized = true;
            logger.debug('🚀 State Synchronizer inicializado');
            
        } catch (error) {
            logger.error('❌ Erro ao inicializar sincronizador:', { error: String(error) });
        }
    }
    
    /**
     * 🛑 Para o sincronizador
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // Remove observadores
        stateManager.removeObserver('ui-sync');
        stateManager.removeObserver('external-sync');
        
        this.isInitialized = false;
        logger.debug('🛑 State Synchronizer parado');
    }
    
    // ========================================================================
    // CONFIGURAÇÃO DE OBSERVADORES
    // ========================================================================
    
    /**
     * 👁️ Configura observadores de mudanças de estado
     */
    setupStateObservers() {
        // Observador para mudanças que afetam a UI
        observeProgressCardState('ui-sync', (state, changes, source) => {
            if (source !== 'ui-update') {
                this.debouncedUIUpdate(state, changes);
            }
        }, {
            paths: SYNC_CONFIG.uiTriggerFields,
            debounce: true
        });
        
        // Observador para mudanças externas
        observeProgressCardState('external-sync', (state, changes, source) => {
            if (source === 'external') {
                this.handleExternalChange(state, changes);
            }
        }, {
            paths: SYNC_CONFIG.autoSyncFields,
            debounce: false
        });
        
        logger.debug('👁️ Observadores de estado configurados');
    }
    
    /**
     * 🎨 Configura sincronização com UI
     */
    setupUISync() {
        // Observa mudanças nos elementos DOM relevantes
        if (dom.winCurrentValue) {
            this.observeElementChanges(dom.winCurrentValue, 'stats.winRate');
        }
        
        if (dom.lossCurrentValue) {
            this.observeElementChanges(dom.lossCurrentValue, 'stats.lossRate');
        }
        
        if (dom.totalOperationsDisplay) {
            this.observeElementChanges(dom.totalOperationsDisplay, 'stats.totalOperations');
        }
        
        logger.debug('🎨 Sincronização com UI configurada');
    }
    
    /**
     * 👁️ Observa mudanças em elemento DOM específico
     * @param {HTMLElement} element - Elemento a observar
     * @param {string} statePath - Caminho no estado
     */
    observeElementChanges(element, statePath) {
        if (!element) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    this.handleDOMChange(element, statePath);
                }
            });
        });
        
        observer.observe(element, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // ========================================================================
    // SINCRONIZAÇÃO AUTOMÁTICA
    // ========================================================================
    
    /**
     * ⏰ Inicia sincronização automática
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.performAutoSync();
        }, SYNC_CONFIG.autoSyncInterval);
        
        logger.debug('⏰ Sincronização automática iniciada');
    }
    
    /**
     * 🔄 Executa sincronização automática
     */
    performAutoSync() {
        try {
            // Coleta dados atuais do sistema
            const externalData = this.collectExternalData();
            
            if (externalData) {
                // Atualiza estado se houver mudanças
                const currentState = getProgressCardState();
                const hasChanges = this.detectDataChanges(currentState, externalData);
                
                if (hasChanges) {
                    updateProgressCardState(externalData, {
                        source: 'auto-sync',
                        validate: true
                    });
                    
                    logger.debug('🔄 Auto-sync aplicado:', Object.keys(externalData));
                }
            }
            
        } catch (error) {
            logger.error('❌ Erro durante auto-sync:', { error: String(error) });
        }
    }
    
    /**
     * 🚀 Executa sincronização inicial
     */
    performInitialSync() {
        try {
            // Coleta dados iniciais
            const externalData = this.collectExternalData();
            
            if (externalData) {
                updateProgressCardState(externalData, {
                    source: 'initial-sync',
                    validate: true,
                    notify: false // Não notifica na inicialização
                });
            }
            
            // Força renderização inicial
            const state = getProgressCardState();
            this.syncToUI(state, {}, 'initial');
            
            logger.debug('🚀 Sincronização inicial concluída');
            
        } catch (error) {
            logger.error('❌ Erro durante sincronização inicial:', { error: String(error) });
        }
    }
    
    // ========================================================================
    // COLETA DE DADOS EXTERNOS
    // ========================================================================
    
    /**
     * 📊 Coleta dados de fontes externas
     * @returns {Object} Dados coletados
     */
    collectExternalData() {
        const data = {};
        
        try {
            // Coleta dados do window.state (se disponível)
            if (window.state) {
                data.stats = {
                    winRate: window.state.winRate || 0,
                    lossRate: window.state.lossRate || 0,
                    totalOperations: window.state.totalOperations || 0,
                    lastUpdated: Date.now()
                };
            }
            
            // Coleta dados monetários (se disponível)
            if (window.config) {
                data.monetary = {
                    achievedAmount: window.config.capitalAtual || 0,
                    targetAmount: window.config.metaCapital || 0,
                    progressPercent: this.calculateProgressPercent(
                        window.config.capitalAtual, 
                        window.config.metaCapital
                    ),
                    sessionPL: window.state?.sessionPL || 0,
                    lastUpdated: Date.now()
                };
                
                data.config = {
                    metaWinRate: window.config.metaWinRate || 60,
                    metaLossRate: window.config.metaLossRate || 40
                };
            }
            
            // Coleta configurações da UI
            const progressCard = document.querySelector('.progress-card');
            if (progressCard) {
                data.ui = {
                    isVisible: !progressCard.hidden && progressCard.style.display !== 'none',
                    theme: this.extractThemeFromElement(progressCard),
                    lastRender: Date.now()
                };
            }
            
        } catch (error) {
            logger.error('❌ Erro ao coletar dados externos:', { error: String(error) });
        }
        
        return Object.keys(data).length > 0 ? data : null;
    }
    
    /**
     * 📊 Calcula porcentagem de progresso
     */
    calculateProgressPercent(achieved, target) {
        if (!target || target <= 0) return 0;
        return Math.min((achieved / target) * 100, 100);
    }
    
    /**
     * 🎨 Extrai tema do elemento
     */
    extractThemeFromElement(element) {
        const classList = Array.from(element.classList);
        const themeClass = classList.find(cls => cls.startsWith('theme-'));
        return themeClass ? themeClass.replace('theme-', '') : 'default';
    }
    
    // ========================================================================
    // SINCRONIZAÇÃO COM UI
    // ========================================================================
    
    /**
     * 🎨 Sincroniza estado para UI
     * @param {Object} state - Estado atual
     * @param {Object} changes - Mudanças aplicadas
     * @param {string} source - Fonte da mudança
     */
    syncToUI(state, changes = {}, source = 'unknown') {
        try {
            this.lastUISync = Date.now();
            
            // Prepara dados para renderização
            const cardData = this.prepareCardDataFromState(state);
            
            if (cardData && cardData.isValid) {
                // Usa renderização otimizada
                const success = updateProgressCardOptimized(cardData);
                
                if (success) {
                    // Atualiza timestamp de renderização no estado
                    updateProgressCardState({
                        ui: { lastRender: Date.now() }
                    }, {
                        source: 'ui-update',
                        notify: false
                    });
                    
                    logger.debug('🎨 UI sincronizada:', { 
                        source, 
                        changes: Object.keys(changes) 
                    });
                } else {
                    logger.warn('⚠️ Falha na sincronização da UI');
                }
            }
            
        } catch (error) {
            logger.error('❌ Erro ao sincronizar UI:', { error: String(error) });
        }
    }
    
    /**
     * 📊 Prepara dados do card a partir do estado
     * @param {Object} state - Estado atual
     * @returns {Object} Dados do card
     */
    prepareCardDataFromState(state) {
        try {
            // Calcula pontos percentuais se necessário
            let pointsPercentage = state.pointsPercentage;
            
            if (!pointsPercentage || !pointsPercentage.lastCalculated || 
                Date.now() - pointsPercentage.lastCalculated > 30000) { // 30s cache
                
                pointsPercentage = this.calculatePointsPercentage(state);
            }
            
            const cardData = {
                isValid: true,
                stats: state.stats,
                monetary: state.monetary,
                pointsPercentage,
                config: state.config,
                ui: state.ui
            };
            
            // Valida dados
            const validation = validateCardData(cardData);
            cardData.isValid = !validation.shouldClear;
            
            return cardData;
            
        } catch (error) {
            logger.error('❌ Erro ao preparar dados do card:', { error: String(error) });
            return null;
        }
    }
    
    /**
     * 📊 Calcula pontos percentuais
     */
    calculatePointsPercentage(state) {
        try {
            if (window.calculatePointsPercentage) {
                const winRateData = window.calculatePointsPercentage(
                    state.stats.winRate, 
                    state.config.metaWinRate, 
                    'winRate'
                );
                
                const lossRateData = window.calculatePointsPercentage(
                    state.stats.lossRate, 
                    state.config.metaLossRate, 
                    'lossRate'
                );
                
                return {
                    winRate: winRateData,
                    lossRate: lossRateData,
                    lastCalculated: Date.now()
                };
            }
        } catch (error) {
            logger.error('❌ Erro ao calcular pontos percentuais:', { error: String(error) });
        }
        
        return {
            winRate: null,
            lossRate: null,
            lastCalculated: Date.now()
        };
    }
    
    // ========================================================================
    // MANIPULADORES DE EVENTOS
    // ========================================================================
    
    /**
     * 🔄 Manipula mudanças externas
     */
    handleExternalChange(state, changes) {
        logger.debug('🔄 Mudança externa detectada:', Object.keys(changes));
        this.lastExternalSync = Date.now();
    }
    
    /**
     * 🎨 Manipula mudanças no DOM
     */
    handleDOMChange(element, statePath) {
        // Implementação futura para sincronização bidirecional
        logger.debug('🎨 Mudança DOM detectada:', { element: element.tagName, path: statePath });
    }
    
    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================
    
    /**
     * 🔍 Detecta mudanças nos dados
     */
    detectDataChanges(currentState, newData) {
        for (const field of SYNC_CONFIG.autoSyncFields) {
            const currentValue = this.getNestedValue(currentState, field);
            const newValue = this.getNestedValue(newData, field);
            
            if (currentValue !== newValue) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 🔍 Obtém valor aninhado
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * 📊 Obtém estatísticas do sincronizador
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            lastExternalSync: this.lastExternalSync,
            lastUISync: this.lastUISync,
            autoSyncEnabled: !!this.syncInterval,
            stateStats: stateManager.getStateStats()
        };
    }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

/**
 * 🔄 Instância singleton do sincronizador
 */
export const stateSynchronizer = new ProgressCardStateSynchronizer();

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * 🚀 Inicializa sincronização
 */
export const initializeStateSync = (options) => stateSynchronizer.initialize(options);

/**
 * 🛑 Para sincronização
 */
export const stopStateSync = () => stateSynchronizer.stop();

/**
 * 📊 Obtém estatísticas de sincronização
 */
export const getStateSyncStats = () => stateSynchronizer.getStats();

// ============================================================================
// EXPOSIÇÃO GLOBAL
// ============================================================================

if (typeof window !== 'undefined') {
    window.progressCardStateSynchronizer = stateSynchronizer;
    window.initializeStateSync = initializeStateSync;
    window.stopStateSync = stopStateSync;
    window.getStateSyncStats = getStateSyncStats;
    
    logger.debug('🔄 State Synchronizer disponível globalmente');
}




