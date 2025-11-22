// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Core modules
import { dom } from './dom.js';
import { config } from './state.js';

// Configuration
import { Features } from './src/config/Features.js';
import { isDevelopment } from './src/config/EnvProvider.js';

// Monitoring
import { performanceTracker } from './src/monitoring/PerformanceTracker.js';

// Utilities (alphabetical order)
import { generateRequestId } from './src/utils/SecurityUtils.js';
import { logger } from './src/utils/Logger.js';
import { toPercentage } from './src/utils/MathUtils.js';

// Performance optimization (alphabetical order)
import lazyLoader from './src/performance/LazyLoader.js';
import optimizedCharts from './src/performance/OptimizedCharts.js';
import performanceProfiler from './src/performance/PerformanceProfiler.js';
import smartDebouncer from './src/performance/SmartDebouncer.js';

// Helper function para validaÃ§Ã£o de chartInstance
function isValidChartInstance(chartInstance, functionName = 'charts') {
    if (!chartInstance) {
        logger.debug(`ðŸ” ${functionName}: chartInstance nÃ£o fornecida`);
        return false;
    }

    if (!chartInstance.data || !chartInstance.data.datasets || !chartInstance.data.datasets[0]) {
        logger.debug(`ðŸ” ${functionName}: chartInstance mal configurada`);
        return false;
    }

    return true;
}


// 🆕 CHECKPOINT 2.2c: Helper para DOMManager
const domHelper = {
    add(el, ...c) { if(window.domManager) return window.domManager.addClass(el,...c); if(typeof el==='string')el=document.querySelector(el); el?.classList.add(...c); return!!el; },
    remove(el, ...c) { if(window.domManager) return window.domManager.removeClass(el,...c); if(typeof el==='string')el=document.querySelector(el); el?.classList.remove(...c); return!!el; }
};

export const charts = {
    dashboardAssertividadeChart: null,
    dashboardPatrimonioChart: null,
    replayAssertividadeChart: null,
    replayPatrimonioChart: null,
    // ===== GRÃFICO DE PROGRESSO DE METAS (RECONSTRUÃDO) =====
    progressMetasChart: null,

    _rafId: 0,
    _pendingHistory: null,
    _storeSubscribed: false,
    _performanceOptimized: false,
    _lastProgressUpdate: 0,
    _progressUpdateThreshold: 100, // ms

    async init() {
        // Inicializar sistema de otimizaÃ§Ã£o de performance
        if (!this._performanceOptimized) {
            await this._initPerformanceOptimizations();
        }
        Object.values(this).forEach((chart) => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        };
        const lineOptions = {
            ...commonOptions,
            tension: 0.3,
            borderWidth: 2.5,
            plugins: { legend: { display: false } },
        };

        if (dom.dashboardAssertividadeChart) {
            this.dashboardAssertividadeChart = new Chart(
                dom.dashboardAssertividadeChart.getContext('2d'),
                {
                    type: 'doughnut',
                    data: {
                        labels: ['VitÃ³rias', 'Derrotas'],
                        datasets: [{ data: [0, 0], borderWidth: 0 }],
                    },
                    options: { ...commonOptions, cutout: '70%' },
                }
            );
        }
        if (dom.dashboardPatrimonioChart) {
            this.dashboardPatrimonioChart = new Chart(
                dom.dashboardPatrimonioChart.getContext('2d'),
                {
                    type: 'line',
                    data: { labels: [], datasets: [{ label: 'Capital', data: [] }] },
                    options: lineOptions,
                }
            );
        }
        if (dom.replayAssertividadeChart) {
            this.replayAssertividadeChart = new Chart(
                dom.replayAssertividadeChart.getContext('2d'),
                {
                    type: 'doughnut',
                    data: {
                        labels: ['VitÃ³rias', 'Derrotas'],
                        datasets: [{ data: [0, 0], borderWidth: 0 }],
                    },
                    options: { ...commonOptions, cutout: '70%' },
                }
            );
        }
        if (dom.replayPatrimonioChart) {
            this.replayPatrimonioChart = new Chart(dom.replayPatrimonioChart.getContext('2d'), {
                type: 'line',
                data: { labels: [], datasets: [{ label: 'Capital', data: [] }] },
                options: lineOptions,
            });
        }

        // Assinatura opcional da store (apenas quando habilitada)
        this._ensureStoreSubscription();
    },

    _ensureStoreSubscription() {
        try {
            const useStore =
                (window.Features && window.Features.FEATURE_store_pubsub) ||
                Features.FEATURE_store_pubsub;
            if (!useStore || this._storeSubscribed) return;
            if (!window.sessionStore || typeof window.sessionStore.subscribe !== 'function') return;
            this._storeSubscribed = true;
            let lastLen = -1;
            let lastCap = NaN;
            window.sessionStore.subscribe((next) => {
                const len = Array.isArray(next.historicoCombinado)
                    ? next.historicoCombinado.length
                    : 0;
                const cap = Number(next.capitalAtual) || 0;
                if (len !== lastLen || cap !== lastCap) {
                    lastLen = len;
                    lastCap = cap;
                    this.scheduleProgressUpdate(
                        Array.isArray(next.historicoCombinado) ? next.historicoCombinado : []
                    );
                }
            });
        } catch (_) {
            /* silencioso */
        }
    },

    /**
     * Agenda uma atualizaÃ§Ã£o de progresso coalescida com otimizaÃ§Ãµes de performance.
     * Usa debounce inteligente e throttling para evitar re-renders excessivos.
     */
    scheduleProgressUpdate(history) {
        const historyData = Array.isArray(history) ? history : [];

        // Usar sistema otimizado se disponÃvel
        if (this._performanceOptimized && window.smartDebouncer) {
            smartDebouncer.scheduleUpdate(
                'progress_chart_update',
                () => {
                    this._performProgressUpdate(historyData);
                },
                {
                    priority: 'high',
                    coalesce: true,
                    immediate: false,
                    context: { historyLength: historyData.length },
                }
            );
            return;
        }

        // Fallback para sistema original com melhorias
        this._pendingHistory = historyData;
        if (this._rafId) return;

        const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
        this._rafId = raf(() => {
            const h = this._pendingHistory || [];
            this._pendingHistory = null;
            this._rafId = 0;

            // Medir performance da atualizaÃ§Ã£o
            const measurementId = window.performanceProfiler?.startMeasurement(
                'progress_chart_update',
                {
                    historyLength: h.length,
                }
            );

            try {
                this.updateProgressChart(h);
                window.performanceProfiler?.endMeasurement(measurementId, { success: true });
            } catch (error) {
                window.performanceProfiler?.endMeasurement(measurementId, {
                    success: false,
                    error: error.message,
                });
            }
        });
    },

    /**
     * Executa atualizaÃ§Ã£o de progresso com profiling de performance
     */
    _performProgressUpdate(history) {
        const measurementId = performanceProfiler.startMeasurement('optimized_progress_update', {
            historyLength: history.length,
            optimized: true,
        });

        try {
            this.updateProgressChart(history);
            performanceProfiler.endMeasurement(measurementId, { success: true });
        } catch (error) {
            performanceProfiler.endMeasurement(measurementId, {
                success: false,
                error: error.message,
            });
            throw error;
        }
    },

    // ===== IntegraÃ§Ã£o com metas de Stop Win/Loss (puro + seguro) =====
    _buildGoalsProgressSummarySafe() {
        try {
            // ðŸ”§ CORREÃ‡ÃƒO: Usar state/config diretamente como no backup funcionando
            const stateRef = window.state || {};
            const configRef = window.config || {};
            // Usando window.state/config para cálculos

            const capitalAtual = Number(stateRef.capitalAtual) || Number(stateRef.capital) || 0;
            const capitalInicio =
                Number(stateRef.capitalInicioSessao) ||
                Number(stateRef.capitalInicial) ||
                Number(configRef.capitalInicial) ||
                0;
            const stopWinPerc =
                Number(stateRef.stopWinPerc) ||
                Number(configRef.stopWinPerc || configRef.metaWinRate) ||
                0;
            const stopLossPerc =
                Number(stateRef.stopLossPerc) ||
                Number(configRef.stopLossPerc || configRef.metaLossRate) ||
                0;

            // Fallbacks para aporte/payout correntes
            const entryAmount = Number(stateRef.aporteAtual) || 0;
            const payoutPercent =
                Number(stateRef.payoutAtual) ||
                Number(document.getElementById('payout-ativo')?.value) ||
                0;

            // Usa funÃ§Ãµes puras se a flag estiver ativa e se existirem globalmente; senÃ£o, calcula inline mÃnimo
            const goalsV2Enabled =
                (window.Features && window.Features.FEATURE_goals_v2) || Features.FEATURE_goals_v2;
            const hasPure =
                goalsV2Enabled &&
                typeof window.computeStopGoals === 'function' &&
                typeof window.computeStopStatus === 'function' &&
                typeof window.computeNextActionHint === 'function' &&
                typeof window.computeLockMode === 'function';


            if (hasPure) {
                const goals = window.computeStopGoals(
                    capitalInicio,
                    stopWinPerc,
                    stopLossPerc,
                    capitalAtual
                );
                const status = window.computeStopStatus(goals);
                const hint = window.computeNextActionHint(goals, entryAmount, payoutPercent);
                const lock = window.computeLockMode(goals);
                // Lock ativado quando necessário
                return { goals, status, hint, lock };
            }

            // CÃ¡lculo mÃnimo inline
            const swAmount = capitalInicio * (stopWinPerc / 100);
            const slAmount = capitalInicio * (stopLossPerc / 100);
            const lucro = capitalAtual - capitalInicio;
            const restanteWinAmount = Math.max(0, swAmount - Math.max(0, lucro));
            const restanteWinRecoveryAmount = Math.max(0, swAmount - lucro);
            const restanteLossAmount = Math.max(0, slAmount - Math.max(0, -lucro));
            const goals = {
                stopWinAmount: swAmount,
                stopLossAmount: slAmount,
                lucroAcumulado: lucro,
                restanteWinAmount,
                restanteWinRecoveryAmount,
                restanteLossAmount,
            };
            const lock = {
                shouldLock: lucro >= swAmount || -lucro >= slAmount,
                type: lucro >= swAmount ? 'STOP_WIN' : -lucro >= slAmount ? 'STOP_LOSS' : null,
                reason:
                    lucro >= swAmount
                        ? 'Meta de ganho atingida'
                        : -lucro >= slAmount
                            ? 'Limite de perda atingido'
                            : null,
            };
            return { goals, status: null, hint: null, lock };
        } catch (e) {
            return null;
        }
    },

    _applyLockMode(lock) {
        try {
            if (!lock || !lock.shouldLock) return;

            // Primeira tentativa: usar ui.sinalizarBloqueioSuave
            if (window.ui && typeof window.ui.sinalizarBloqueioSuave === 'function') {
                window.ui.sinalizarBloqueioSuave(lock.type, lock.reason);
                return;
            }

            // Fallback: aplicar diretamente no badge caso ui nÃ£o esteja disponÃvel
            const badge = document.getElementById('progress-soft-lock-badge');
            if (badge) {
                const icon = lock.type === 'STOP_WIN' ? 'ðŸŽ¯' : 'âšï¸';
                const msg =
                    lock.type === 'STOP_WIN'
                        ? 'Meta de ganhos atingida'
                        : 'Limite de perda atingido';

                badge.textContent = `${icon} ${msg}`;
                domHelper.remove(badge, 'hidden'); // 🆕
                domHelper.add(badge, 'show'); // 🆕
                badge.style.display = 'inline-flex';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';

                // Dispara popup se disponÃvel
                if (window.ui && typeof window.ui.showInsight === 'function') {
                    window.ui.showInsight(lock.reason, 'warning', 3000);
                }
            }
        } catch (e) {
            console.warn('Erro ao aplicar lock mode:', e);
        }
    },

    /**
     * 🍩 Inicializa o gráfico de pizza de progresso das metas
     * 🚫 DESABILITADO: Este método não deve mais criar gráficos
     * O gráfico é gerenciado exclusivamente pelo progress-card-module.js
     */
    initProgressChart() {
        logger.warn('🚫 initProgressChart() DESABILITADO - O gráfico é gerenciado pelo progress-card-module.js');

        // 🛡️ PROTEÇÃO: Sempre retorna true para não quebrar código que depende deste método
        // Mas NÃO cria nenhum gráfico
        return true;

        /* CÓDIGO DESABILITADO PARA EVITAR GRÁFICO DUPLICADO (verde escuro/vermelho escuro)
        
        logger.info('🎯 Inicializando gráfico de progresso de metas...');

        // 🛡️ PROTEÇÃO: Evita reinicialização se gráfico já existe
        if (this.progressMetasChart) {
            logger.warn('⚠️ Gráfico já existe, pulando inicialização para evitar duplicação');
            return true; // Retorna sucesso pois o gráfico já está pronto
        }

        // 🛡️ Validação robusta de DOM com diagnóstico
        const canvasElement = dom.progressPieChart;
        if (!canvasElement) {
            logger.error('❌ Canvas progressPieChart não encontrado no DOM');
                    logger.debug('ðŸ”Ž DOM disponÃvel:', {
                        keys: Object.keys(dom).filter((key) => key.includes('progress')),
                    });
                    return false;
                }
        
                // ðŸ›¡ï¸ ValidaÃ§Ã£o adicional de contexto Canvas
                try {
                    const context = canvasElement.getContext('2d');
                    if (!context) {
                        logger.error('âŒ Falha ao obter contexto 2D do canvas');
                        return false;
                    }
                } catch (contextError) {
                    logger.error('âŒ Erro ao validar contexto canvas:', { error: String(contextError) });
                    return false;
                }
        
                try {
                    // DestrÃ³i qualquer instÃ¢ncia existente neste canvas registrada pelo Chart.js
                    try {
                        if (typeof Chart !== 'undefined' && typeof Chart.getChart === 'function') {
                            const existing =
                                Chart.getChart(canvasElement) ||
                                Chart.getChart(canvasElement.getContext('2d'));
                            if (existing && existing !== this.progressMetasChart) {
                                existing.destroy();
                            }
                        }
                    } catch (_) { }
        
                    // DestrÃ³i grÃ¡fico anterior se existir
                    if (this.progressMetasChart) {
                        try {
                            this.progressMetasChart.destroy();
                        } catch (_) { }
                        this.progressMetasChart = null;
                    }
        
                    // ðŸ”§ CORREÃ‡ÃƒO: ConfiguraÃ§Ãµes otimizadas para funcionalidade real
                    const progressConfig = {
                        type: 'doughnut',
                        data: {
                            labels: ['VitÃ³rias', 'Derrotas'],
                            datasets: [
                                {
                                    data: [0, 0], // Inicializa com zeros, serÃ¡ atualizado com dados reais
                                    backgroundColor: ['#00e676', '#ff3d00'],
                                    borderWidth: 0,
                                    cutout: '75%',
                                },
                            ],
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false,
                                },
                                tooltip: {
                                    enabled: false, // CORREÇÃO: Desabilitado para evitar sobreposição de gráfico fantasma
                                },
                            },
                            animation: {
                                duration: 300, // AnimaÃ§Ã£o mais rÃ¡pida para melhor responsividade
                                easing: 'easeInOutQuart',
                            },
                        },
                    };
        
                    // ðŸ”§ CORREÃ‡ÃƒO: CriaÃ§Ã£o mais robusta da instÃ¢ncia
                    this.progressMetasChart = new Chart(canvasElement.getContext('2d'), progressConfig);
        
                    // ðŸ”§ CORREÃ‡ÃƒO: Inicializa com dados padrÃ£o seguros
                    this.progressMetasChart.$currentStats = {
                        winRate: 0,
                        totalOperations: 0
                    };
        
                    // Plugin: texto central com WR atual
                    // REMOVIDO: O plugin centerText causava conflitos de propriedade readonly.
                    // A exibição de texto central deve ser feita via HTML/CSS sobreposto ou plugin seguro.
        
        
                    // ðŸ›¡ï¸ ValidaÃ§Ã£o pÃ³s-inicializaÃ§Ã£o mais rigorosa
                    if (!this.progressMetasChart ||
                        typeof this.progressMetasChart.update !== 'function' ||
                        !this.progressMetasChart.data ||
                        !this.progressMetasChart.data.datasets) {
                        logger.error('âŒ GrÃ¡fico criado mas com interface invÃ¡lida');
                        return false;
                    }
        
                    // ðŸ”§ CORREÃ‡ÃƒO: ForÃ§a primeira renderizaÃ§Ã£o
                    try {
                        this.progressMetasChart.update('none');
                    } catch (updateError) {
                        logger.warn('âšï¸ Erro na primeira renderizaÃ§Ã£o:', { error: updateError.message });
                    }
        
                    logger.info('âœ… GrÃ¡fico de progresso inicializado com sucesso');
                    return true;
                } catch (error) {
                    // ðŸ” DiagnÃ³stico detalhado do erro
                    logger.error('âŒ Erro ao inicializar grÃ¡fico de progresso:', {
                        message: error.message,
                        stack: error.stack?.substring(0, 200),
                        canvasElement: !!canvasElement,
                        domKeys: Object.keys(dom).length,
                        chartJsAvailable: typeof Chart !== 'undefined',
                    });
        
                    // ðŸ›¡ï¸ Cleanup em caso de falha parcial
                    if (this.progressMetasChart) {
                        try {
                            this.progressMetasChart.destroy();
                            this.progressMetasChart = null;
                        } catch (cleanupError) {
                            logger.warn('âšï¸ Erro durante cleanup', { error: cleanupError.message });
                        }
                    }
        
                    return false;
                }
            }
        
            FIM DO CÓDIGO DESABILITADO */
    },

    /**
     * 🔄 Atualiza o progresso das metas com histórico da sessão
     */
    updateProgressChart(sessionHistory = []) {
        const requestId = generateRequestId('update_progress');
        performanceTracker.startOperation('charts_update_progress', requestId, {
            historyLength: sessionHistory?.length || 0,
        });

        logger
            .withRequest(requestId)
            .debug('ðŸ”„ CHARTS: Atualizando progresso com histÃ³rico:', {
                length: sessionHistory?.length || 0,
            });

        if (!Array.isArray(sessionHistory)) {
            logger.withRequest(requestId).warn('âšï¸ HistÃ³rico invÃ¡lido, usando array vazio');
            sessionHistory = [];
        }

        try {
            performanceTracker.addMarker(requestId, 'normalization_start');

            // NormalizaÃ§Ã£o: aceita histÃ³rico com { isWin:boolean } ou { resultado:'win'|'loss' }
            const normalizedHistory = sessionHistory
                .map((op) => {
                    if (!op || typeof op !== 'object') return null;
                    if (typeof op.isWin === 'boolean') {
                        return { ...op, resultado: op.isWin ? 'win' : 'loss' };
                    }
                    return op;
                })
                .filter(Boolean);

            performanceTracker.addMarker(requestId, 'chart_validation');

            // Inicializa grÃ¡fico se nÃ£o existir
            if (!this.progressMetasChart) {
                logger.withRequest(requestId).info('ðŸŽ¯ GrÃ¡fico nÃ£o existe, inicializando...');
                if (!this.initProgressChart()) {
                    performanceTracker.finishOperation(requestId, 'error', {
                        reason: 'chart_init_failed',
                    });
                    logger.withRequest(requestId).error('âŒ Falha ao inicializar grÃ¡fico');
                    return false;
                }
                // Garante assinatura quando o grÃ¡fico Ã© (re)criado
                this._ensureStoreSubscription();
            }

            performanceTracker.addMarker(requestId, 'stats_calculation');

            // Define metas padrÃ£o se nÃ£o definidas
            const targets = {
                winTarget: (typeof config.metaWinRate === 'number' ? config.metaWinRate : 60),
                lossTarget: (typeof config.metaLossRate === 'number' ? config.metaLossRate : 40),
            };

            // ðŸ”§ CORREÃ‡ÃƒO: Usa novo sistema de cÃ¡lculos integrado
            const stats = this.calculateProgressStats(normalizedHistory);

            // Disponibiliza Ãºltimas estatÃsticas para utilitÃ¡rios/diagnÃ³sticos leves
            try {
                this.lastStats = stats;
            } catch { }

            // ðŸ”§ CORREÃ‡ÃƒO: Calcula dados completos do card se funÃ§Ã£o disponÃvel
            let cardData = null;
            try {
                if (typeof window.calculateProgressCardData === 'function') {
                    // FASE 3: Busca dados anteriores do cache para comparaÃ§Ã£o de trends
                    const previousData = window.progressCardCache?.getPrevious() || null;

                    cardData = window.calculateProgressCardData(
                        normalizedHistory,
                        window.config || {},
                        window.state || {},
                        previousData // Dados anteriores para FASE 3
                    );
                }
            } catch (error) {
                logger.warn('âšï¸ Erro ao calcular dados completos do card:', { error: error.message });
            }

            // Calcula metas/gaps/hints a partir do contexto do app (sem travar se faltar dado)
            const goalsSummary = this._buildGoalsProgressSummarySafe();

            performanceTracker.addMarker(requestId, 'ui_updates_start');

            // ðŸ”§ CORREÃ‡ÃƒO: Usa novo sistema de atualizaÃ§Ã£o se disponÃvel
            if (cardData && cardData.isValid && typeof window.updateProgressCardComplete === 'function') {
                try {
                    const updateSuccess = window.updateProgressCardComplete(cardData, this.progressMetasChart);
                    if (updateSuccess) {
                        logger.debug('âœ… Card atualizado via novo sistema');

                        // FASE 3: Armazena dados atuais no cache para futuras comparaÃ§Ãµes
                        if (window.progressCardCache) {
                            window.progressCardCache.store(cardData);
                            logger.debug('ðŸ’¾ Dados armazenados no cache para comparaÃ§Ãµes futuras');
                        }
                    } else {
                        // Fallback para sistema antigo
                        this.updateProgressPieChart(stats, goalsSummary);
                        this.updateProgressStatusNew(stats, targets, goalsSummary);
                    }
                } catch (updateError) {
                    logger.warn('âšï¸ Erro no novo sistema, usando fallback:', { error: updateError.message });
                    // Fallback para sistema antigo
                    this.updateProgressPieChart(stats, goalsSummary);
                    this.updateProgressStatusNew(stats, targets, goalsSummary);
                }
            } else {
                // Sistema antigo como fallback
                this.updateProgressPieChart(stats, goalsSummary);
                this.updateProgressStatusNew(stats, targets, goalsSummary);
            }

            this._applyLockMode(goalsSummary?.lock);

            performanceTracker.finishOperation(requestId, 'success', { stats });
            logger.withRequest(requestId).info('âœ… CHARTS: Progresso atualizado');
            return true;
        } catch (error) {
            performanceTracker.finishOperation(requestId, 'error', { error: error.message });
            logger
                .withRequest(requestId)
                .error('âŒ Erro ao atualizar progresso:', { error: String(error) });
            return false;
        }
    },

    /**
     * ðŸ“Š Calcula estatÃsticas do progresso (VERSÃƒO MELHORADA)
     * Integra com o novo sistema de cÃ¡lculos reais
     */
    calculateProgressStats(sessionHistory) {
        try {
            // Importa funÃ§Ã£o de cÃ¡lculo real dinamicamente
            if (typeof window.calculateRealStats === 'function') {
                return window.calculateRealStats(sessionHistory);
            }

            // Fallback para cÃ¡lculo local se funÃ§Ã£o externa nÃ£o disponÃvel
            return this._calculateProgressStatsLocal(sessionHistory);
        } catch (error) {
            logger.error('âŒ Erro ao calcular estatÃsticas de progresso:', { error: String(error) });
            return this._calculateProgressStatsLocal(sessionHistory);
        }
    },

    /**
     * ðŸ“Š CÃ¡lculo local de estatÃsticas (fallback)
     * @private
     */
    _calculateProgressStatsLocal(sessionHistory) {
        if (!Array.isArray(sessionHistory) || sessionHistory.length === 0) {
            return {
                totalOperations: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                lossRate: 0,
                remaining: 100,
                totalProfit: 0,
                validOperations: 0
            };
        }

        let wins = 0;
        let losses = 0;
        let totalProfit = 0;
        let validOperations = 0;

        // Processamento mais robusto das operaÃ§Ãµes
        for (const operacao of sessionHistory) {
            if (!operacao || typeof operacao !== 'object') {
                continue;
            }

            // Determina resultado da operaÃ§Ã£o
            let isWin = null;
            if (typeof operacao.isWin === 'boolean') {
                isWin = operacao.isWin;
            } else if (typeof operacao.resultado === 'string') {
                isWin = operacao.resultado === 'win';
            } else {
                continue; // Pula operaÃ§Ãµes sem resultado claro
            }

            // Conta vitÃ³rias e derrotas
            if (isWin) {
                wins++;
            } else {
                losses++;
            }

            // Soma lucro/prejuÃzo se disponÃvel
            if (typeof operacao.valor === 'number' && !isNaN(operacao.valor)) {
                totalProfit += operacao.valor;
            }

            validOperations++;
        }

        const total = validOperations;
        const winRate = total > 0 ? toPercentage(wins / total) : 0;
        const lossRate = total > 0 ? toPercentage(losses / total) : 0;
        const remaining = Math.max(0, 100 - winRate - lossRate);

        return {
            totalOperations: total,
            wins,
            losses,
            winRate,
            lossRate,
            remaining,
            totalProfit,
            validOperations
        };
    },

    /**
     * ðŸ§ª ForÃ§a dados de teste no grÃ¡fico
     */
    testProgressWithData(testData = null) {
        logger.info('ðŸ§ª TESTE: Aplicando dados de teste no grÃ¡fico...');

        const testStats = testData || {
            totalOperations: 25,
            wins: 18,
            losses: 7,
            winRate: 72,
            lossRate: 28,
            remaining: 0,
        };

        const testTargets = { winTarget: 80, lossTarget: 20 };

        // ForÃ§a atualizaÃ§Ã£o dos displays ANTES do grÃ¡fico
        const winDisplay = dom.winRateDisplay;
        const lossDisplay = dom.lossRateDisplay;

        if (winDisplay) winDisplay.textContent = testStats.winRate.toFixed(1) + '%';
        if (lossDisplay) lossDisplay.textContent = testStats.lossRate.toFixed(1) + '%';

        // AtualizaÃ§Ã£o normal tambÃ©m
        this.updateProgressPieChart(testStats);
        this.updateProgressBarsNew(testStats, testTargets);
        this.updateProgressStatusNew(testStats, testTargets);

        logger.debug('ðŸ§ª Dados de teste aplicados COM FORÃ‡A:', testStats);
    },

    /**
     * ðŸŽ¨ Resolve cores CSS dinamicamente
     */
    getResolvedColors() {
        const style = getComputedStyle(document.documentElement);

        return {
            primary: style.getPropertyValue('--primary-color').trim() || '#00e676',
            secondary: style.getPropertyValue('--secondary-color').trim() || '#ff3d00',
            muted: style.getPropertyValue('--text-muted').trim() || '#9e9e9e',
            surface: style.getPropertyValue('--surface-color').trim() || '#2d2d2d',
        };
    },

    /**
     * ðŸ“Š Atualiza status textual do progresso
     */
    updateProgressStatusNew(stats, targets, goalsSummary = null) {
        logger.debug('ðŸ“Š Atualizando status do progresso:', { stats, targets });

        // AtualizaÃ§Ã£o com fallback
        const elements = {
            operationsCount: dom.operationsCount,
            winCount: dom.winCount,
            lossCount: dom.lossCount,
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                const values = {
                    operationsCount: stats.totalOperations,
                    winCount: stats.wins,
                    lossCount: stats.losses,
                };
                element.textContent = values[key] || 0;
            }
        });

        // Atualizar os "cards" de status (parte destacada na UI)
        this._updateStatusCards(stats, targets, goalsSummary);

        // Atualiza header "SessÃ£o Ativa - X ops"
        try {
            if (dom.progressSessionInfo) {
                const isActive = !!(window.state && window.state.isSessionActive);
                const count = Number(stats.totalOperations || 0);
                dom.progressSessionInfo.textContent = `${isActive ? 'SessÃ£o Ativa' : 'SessÃ£o Inativa'} Â· ${count} ops`;
            }
        } catch { }
    },

    /**
     * ðŸŽ¯ Atualiza os cartÃµes de status (Win / Loss) com mensagens e classes
     */
    _updateStatusCards(stats, targets, goalsSummary = null) {
        try {
            const winEl = dom.winStatusIndicator;
            const lossEl = dom.lossStatusIndicator;
            const totalOps = Number(stats.totalOperations) || 0;
            const progressV2 =
                (window.Features && window.Features.FEATURE_progress_cards_v2) ||
                Features.FEATURE_progress_cards_v2;

            // Helpers
            const setCard = (el, message, level, subtext) => {
                if (!el) return;
                try {
                    const textNode = el.querySelector('.status-text');
                    if (textNode) textNode.textContent = message;
                    const subNode = el.querySelector('.status-subtext');
                    if (subNode && typeof subtext === 'string') subNode.textContent = subtext;
                    // Reset classes visuais
                    domHelper.remove(el, 'excellent', 'good', 'warning', 'neutral'); // 🆕
                    domHelper.add(el, level); // 🆕
                } catch { }
            };

            // WIN STATUS
            if (winEl) {
                let msg = 'Vamos comeÃ§ar!';
                let level = 'neutral';
                let icon = 'ðŸŸ¢';
                if (totalOps > 0) {
                    if (stats.winRate >= (targets.winTarget || 80)) {
                        msg = 'Meta atingida';
                        level = 'excellent';
                        icon = 'âœ…';
                    } else if (stats.winRate >= (targets.winTarget || 80) * 0.8) {
                        msg = 'Quase lÃ¡';
                        level = 'good';
                        icon = 'ðŸŸ¡';
                    } else {
                        msg = 'Aprimorar assertividade';
                        level = 'warning';
                        icon = 'âšï¸';
                    }
                }
                const meta = targets.winTarget || 80;
                const atual = Number(stats.winRate || 0).toFixed(1);
                let sub;
                if (progressV2 && goalsSummary?.goals) {
                    const g = goalsSummary.goals;
                    const falta = g.restanteWinRecoveryAmount ?? g.restanteWinAmount;
                    const faltapct =
                        g.stopWinAmount > 0
                            ? Math.max(0, Math.min(100, (falta / g.stopWinAmount) * 100))
                            : 0;
                    const faltaTxt =
                        ui?._formatarMoedaInternal?.(falta) ||
                        `R$ ${Number(falta || 0).toFixed(2)}`;
                    sub = `Meta: ${meta}% Â· Atual: ${atual}% Â· Faltam: ${faltaTxt} (${faltapct.toFixed(1)}%)`;
                } else {
                    const extra = goalsSummary?.goals
                        ? ` Â· Falta: ${ui?._formatarMoedaInternal?.(goalsSummary.goals.restanteWinRecoveryAmount ?? goalsSummary.goals.restanteWinAmount) || 'R$ 0,00'}`
                        : '';
                    sub = `Meta: ${meta}% Â· Atual: ${atual}%${extra}`;
                }
                setCard(winEl, `${icon} ${msg}`, level, sub);
            }

            // LOSS STATUS
            if (lossEl) {
                let msg = 'Controle total';
                let level = 'excellent';
                let icon = 'âœ…';
                if (totalOps > 0) {
                    const limit = targets.lossTarget || 20;
                    if (stats.lossRate <= limit) {
                        msg = 'Controle total';
                        level = 'excellent';
                        icon = 'âœ…';
                    } else if (stats.lossRate <= limit + 5) {
                        msg = 'AtenÃ§Ã£o';
                        level = 'good';
                        icon = 'ðŸŸ¡';
                    } else {
                        msg = 'Risco alto';
                        level = 'warning';
                        icon = 'âšï¸';
                    }
                }
                const meta = targets.lossTarget || 20;
                const atual = Number(stats.lossRate || 0).toFixed(1);
                let sub;
                if (progressV2 && goalsSummary?.goals) {
                    const g = goalsSummary.goals;
                    const status = goalsSummary.status || { riscoUsado: 0 };
                    const risco = Number(status.riscoUsado || 0).toFixed(1);
                    const limiteTxt =
                        ui?._formatarMoedaInternal?.(g.stopLossAmount) ||
                        `R$ ${Number(g.stopLossAmount || 0).toFixed(2)}`;
                    const resultadoTxt =
                        ui?._formatarMoedaInternal?.(g.lucroAcumulado) ||
                        `R$ ${Number(g.lucroAcumulado || 0).toFixed(2)}`;
                    sub = `Limite: ${meta}% Â· Atual: ${atual}% Â· Risco usado: ${risco}% Â· Resultado: ${resultadoTxt} Â· Limite(R$): -${limiteTxt.replace('R$ ', '')}`;
                } else {
                    const extra = goalsSummary?.goals
                        ? ` Â· Margem: ${ui?._formatarMoedaInternal?.(goalsSummary.goals.restanteLossAmount) || 'R$ 0,00'}`
                        : '';
                    sub = `Limite: ${meta}% Â· Atual: ${atual}%${extra}`;
                }
                setCard(lossEl, `${icon} ${msg}`, level, sub);
            }
        } catch (error) {
            logger.warn('âšï¸ _updateStatusCards: falha ao atualizar cartÃµes', {
                error: String(error),
            });
        }
    },

    /**
     * ðŸ¥§ Atualiza apenas o grÃ¡fico de pizza
     */
    updateProgressPieChart(stats, goalsSummary = null) {
        // VerificaÃ§Ãµes defensivas: grÃ¡fico e canvas precisam estar vÃ¡lidos
        if (!this.progressMetasChart || !this.progressMetasChart.canvas) {
            // Tentar re-inicializar se o canvas existir no DOM mapeado
            try {
                if (dom && dom.progressPieChart) {
                    const reinitOk = this.initProgressChart();
                    if (!reinitOk) return false;
                } else {
                    // Canvas indisponÃvel no DOM; nÃ£o atualizar agora
                    return false;
                }
            } catch {
                return false;
            }
        }

        try {
            // Atualiza cores dinamicamente
            const colors = this.getResolvedColors();

            // Anel Ãºnico Win/Loss - SIMPLIFICADO
            this.progressMetasChart.data.datasets[0].backgroundColor = [
                colors.primary,  // Verde para vitÃ³rias
                colors.secondary // Vermelho para derrotas
            ];

            this.progressMetasChart.data.datasets[0].data = [
                stats.winRate,
                stats.lossRate
            ];

            this.progressMetasChart.update('active');

            // Texto central Ã© desenhado pelo plugin; esconder rÃ³tulo DOM (garantia)
            try {
                if (dom.totalOperationsDisplay) dom.totalOperationsDisplay.style.display = 'none';
            } catch { }

            // Passa stats atuais ao plugin de texto central
            this.progressMetasChart.$currentStats = stats;

            return true;
        } catch (error) {
            logger.error('âŒ Erro ao atualizar grÃ¡fico de pizza', { error: String(error) });
            return false;
        }
    },

    /**
     * ðŸ“Š Atualiza cards de informaÃ§Ã£o (sem barras visuais)
     */
    updateProgressInfoCards(stats, targets) {
        // Atualiza displays de percentual
        const winDisplay = dom.winRateDisplay;
        const lossDisplay = dom.lossRateDisplay;

        if (winDisplay) winDisplay.textContent = `${stats.winRate.toFixed(1)}%`;
        if (lossDisplay) lossDisplay.textContent = `${stats.lossRate.toFixed(1)}%`;

        // Referências aos elementos percentuais removidas - campos não existem mais

        // Atualiza valores em R$ 
        try {
            const summary = this._buildGoalsProgressSummarySafe();
            if (summary?.goals) {
                const g = summary.goals;

                // Win (R$)
                const winTargetAmountEl = document.getElementById('win-target-amount') || dom.winTargetAmount;
                const winRemainingAmountEl = document.getElementById('win-remaining-amount') || dom.winRemainingAmount;
                const metaTargetAmountEl = document.getElementById('meta-target-amount');
                const metaAchievedAmountEl = document.getElementById('meta-achieved-amount');

                const stopWinAmountBRL = `R$ ${Number(g.stopWinAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const remaining = Math.max(0, g.stopWinAmount - Math.max(0, g.lucroAcumulado || 0));
                const achieved = Math.max(0, g.stopWinAmount - remaining);
                const remainingBRL = `R$ ${Number(remaining || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const achievedBRL = `R$ ${Number(achieved || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                if (winTargetAmountEl) winTargetAmountEl.textContent = stopWinAmountBRL;
                if (winRemainingAmountEl) winRemainingAmountEl.textContent = remainingBRL;
                if (metaTargetAmountEl) metaTargetAmountEl.textContent = stopWinAmountBRL;
                if (metaAchievedAmountEl) {
                    metaAchievedAmountEl.textContent = achievedBRL;
                    domHelper.remove(metaAchievedAmountEl, 'text-positive', 'text-negative'); // 🆕
                    if (achieved > 0) domHelper.add(metaAchievedAmountEl, 'text-positive'); // 🆕
                }

                // Loss (R$)
                const lossLimitAmountEl = document.getElementById('loss-limit-amount') || dom.lossLimitAmount;
                const lossSessionResultEl = document.getElementById('loss-session-result') || dom.lossSessionResult;
                const statusTargetAmountEl = document.getElementById('status-target-amount');
                const statusAchievedEl = document.getElementById('status-achieved');
                const statusExceedEl = document.getElementById('status-exceed');
                const statusMarginEl = document.getElementById('status-margin');
                const statusRiskUsedEl = document.getElementById('status-risk-used');

                const stopLossAmountBRL = `R$ ${Number(g.stopLossAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const sessionPLBRL = `R$ ${Number(g.lucroAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                if (lossLimitAmountEl) lossLimitAmountEl.textContent = stopLossAmountBRL;
                if (lossSessionResultEl) {
                    lossSessionResultEl.textContent = sessionPLBRL;
                    domHelper.remove(lossSessionResultEl, 'text-positive', 'text-negative'); // 🆕
                    if ((g.lucroAcumulado || 0) > 0) domHelper.add(lossSessionResultEl, 'text-positive'); // 🆕
                    if ((g.lucroAcumulado || 0) < 0) domHelper.add(lossSessionResultEl, 'text-negative'); // 🆕
                }

                // Status (lado esquerdo da prÃ©via)
                if (statusTargetAmountEl) statusTargetAmountEl.textContent = stopWinAmountBRL;
                if (statusAchievedEl) {
                    statusAchievedEl.textContent = achievedBRL;
                    domHelper.remove(statusAchievedEl, 'text-positive', 'text-negative'); // 🆕
                    if (achieved > 0) domHelper.add(statusAchievedEl, 'text-positive'); // 🆕
                }
                if (statusExceedEl) {
                    const excedente = Math.max(0, (g.lucroAcumulado || 0) - (g.stopWinAmount || 0));
                    statusExceedEl.textContent = `R$ ${Number(excedente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
                if (statusMarginEl) {
                    const denom = Number(g.stopLossAmount) || 0;
                    const margem = (g.lucroAcumulado || 0) < 0 ? Math.max(0, denom - Math.abs(g.lucroAcumulado || 0)) : denom;
                    statusMarginEl.textContent = `R$ ${Number(margem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
                if (statusRiskUsedEl) {
                    const denom = Number(g.stopLossAmount) || 0;
                    const riscoUsado = denom > 0 && (g.lucroAcumulado || 0) < 0 ? (Math.abs(g.lucroAcumulado || 0) / denom) * 100 : 0;
                    statusRiskUsedEl.textContent = `${riscoUsado.toFixed(1)}%`;
                    domHelper.remove(statusRiskUsedEl, 'text-positive', 'text-negative'); // 🆕
                    if (riscoUsado > 0) domHelper.add(statusRiskUsedEl, 'text-negative'); // 🆕
                }
            }
        } catch (error) {
            logger.warn('âšï¸ Erro ao atualizar valores monetÃ¡rios:', error.message);
        }
    },

    /**
     * ðŸ“Š Atualiza barras de progresso com verificaÃ§Ãµes
     */
    updateProgressBarsNew(stats, targets) {
        this.updateProgressBarSafe('win', stats.winRate, targets.winTarget);
        this.updateProgressBarSafe('loss', stats.lossRate, targets.lossTarget);

        // Atualiza valores em R$ abaixo das barras, quando possÃvel
        try {
            const summary = this._buildGoalsProgressSummarySafe();
            if (summary?.goals) {
                const g = summary.goals;
                if (dom.winTargetAmount)
                    dom.winTargetAmount.textContent =
                        ui?._formatarMoedaInternal?.(g.stopWinAmount) ||
                        `R$ ${Number(g.stopWinAmount || 0).toFixed(2)}`;
                // Usa falta com recuperaÃ§Ã£o (considera prejuÃzo atual)
                const faltaRec =
                    typeof g.restanteWinRecoveryAmount === 'number'
                        ? g.restanteWinRecoveryAmount
                        : g.restanteWinAmount;
                // Layout original: mostrar restante atÃ© a meta
                if (dom.winRemainingAmount)
                    dom.winRemainingAmount.textContent =
                        ui?._formatarMoedaInternal?.(faltaRec) ||
                        `R$ ${Number(faltaRec || 0).toFixed(2)}`;
                // Limite (R$) no preview Ã© positivo (sem sinal), mantendo coerÃªncia
                if (dom.lossLimitAmount)
                    dom.lossLimitAmount.textContent =
                        ui?._formatarMoedaInternal?.(g.stopLossAmount) ||
                        `R$ ${Number(g.stopLossAmount || 0).toFixed(2)}`;
                if (dom.lossSessionResult) {
                    const txt =
                        ui?._formatarMoedaInternal?.(g.lucroAcumulado) ||
                        `R$ ${Number(g.lucroAcumulado || 0).toFixed(2)}`;
                    dom.lossSessionResult.textContent = txt;
                    // cor por sinal (apenas classe; CSS jÃ¡ governa as cores globais)
                    domHelper.remove(dom.lossSessionResult, 'positive', 'negative'); // 🆕
                    if (g.lucroAcumulado > 0) domHelper.add(dom.lossSessionResult, 'positive'); // 🆕
                    if (g.lucroAcumulado < 0) domHelper.add(dom.lossSessionResult, 'negative'); // 🆕
                }
                // Cor para "Meta Restante": se houver atingido > 0 e ainda restar pouco, manter neutro; 
                // regra simples: se restante == 0 e lucro > 0, destacar positivo no P/L jÃ¡ cobre o caso.
                if (dom.winRemainingAmount) {
                    domHelper.remove(dom.winRemainingAmount, 'positive', 'negative'); // 🆕
                    const restante = Number(faltaRec || 0);
                    // NÃ£o colorimos restante positivo como negativo para nÃ£o confundir; mantemos neutro.
                    if (restante === 0 && g.lucroAcumulado > 0) {
                        domHelper.add(dom.winRemainingAmount, 'positive'); // 🆕
                    }
                }
                // Mini barras
                const metaPercent =
                    g.lucroAcumulado > 0 && g.stopWinAmount > 0
                        ? Math.min(100, (g.lucroAcumulado / g.stopWinAmount) * 100)
                        : 0;
                const metaFill = document.getElementById('meta-progress-fill');
                const metaDisp = document.getElementById('meta-progress-display');
                if (metaFill) metaFill.style.width = `${metaPercent}%`;
                if (metaDisp) {
                    metaDisp.textContent = `${metaPercent.toFixed(1)}%`;
                    domHelper.remove(metaDisp, 'positive', 'negative'); // 🆕
                    if (metaPercent > 0) domHelper.add(metaDisp, 'positive'); // 🆕
                }

                const riscoPercent =
                    g.lucroAcumulado < 0 && g.stopLossAmount > 0
                        ? Math.min(100, (Math.abs(g.lucroAcumulado) / g.stopLossAmount) * 100)
                        : 0;
                const riscoFill = document.getElementById('risk-used-fill');
                const riscoDisp = document.getElementById('risk-used-display');
                if (riscoFill) riscoFill.style.width = `${riscoPercent}%`;
                if (riscoDisp) {
                    riscoDisp.textContent = `${riscoPercent.toFixed(1)}%`;
                    domHelper.remove(riscoDisp, 'positive', 'negative'); // 🆕
                    if (riscoPercent > 0) domHelper.add(riscoDisp, 'negative'); // 🆕
                }
            }
        } catch { }

        // Badges de tendÃªncia (nÃ£o intrusivo; usa prevWinRate/prevLossRate se disponÃveis)
        try {
            const wrPrev = typeof stats.prevWinRate === 'number' ? stats.prevWinRate : null;
            const lrPrev = typeof stats.prevLossRate === 'number' ? stats.prevLossRate : null;
            const wrDelta = wrPrev !== null ? (stats.winRate - wrPrev) : 0;
            const lrDelta = lrPrev !== null ? (stats.lossRate - lrPrev) : 0;

            const wrBadge = document.getElementById('meta-trend-badge');
            if (wrBadge) {
                if (wrPrev === null || Math.abs(wrDelta) < 0.05) {
                    wrBadge.textContent = '';
                    wrBadge.className = 'trend-badge';
                } else {
                    wrBadge.textContent = `${wrDelta > 0 ? 'â–²' : 'â–¼'} ${Math.abs(wrDelta).toFixed(1)} pp`;
                    wrBadge.className = `trend-badge ${wrDelta > 0 ? 'trend-up' : 'trend-down'}`;
                }
            }

            const lrBadge = document.getElementById('loss-trend-badge');
            if (lrBadge) {
                if (lrPrev === null || Math.abs(lrDelta) < 0.05) {
                    lrBadge.textContent = '';
                    lrBadge.className = 'trend-badge';
                } else {
                    lrBadge.textContent = `${lrDelta > 0 ? 'â–²' : 'â–¼'} ${Math.abs(lrDelta).toFixed(1)} pp`;
                    lrBadge.className = `trend-badge ${lrDelta > 0 ? 'trend-up' : 'trend-down'}`;
                }
            }
        } catch { }
    },

    /**
     * ðŸ“Š Atualiza uma barra individual com verificaÃ§Ãµes
     */
    updateProgressBarSafe(type, currentRate, targetRate) {
        logger.debug(`ðŸ”„ Atualizando barra ${type}:`, { currentRate, targetRate });

        const elements = {
            display: dom[`${type}RateDisplay`],
            targetBar: dom[`${type}TargetBar`],
            currentBar: dom[`${type}CurrentBar`],
            targetValue: dom[`${type}TargetValue`],
            currentValue: dom[`${type}CurrentValue`],
        };

        // Verifica se elementos existem antes de atualizar
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                if (isDevelopment && isDevelopment()) {
                    logger.warn(`âšï¸ Elemento ${type}${key} nÃ£o encontrado`);
                } else {
                    logger.debug && logger.debug(`Elemento ${type}${key} nÃ£o encontrado`);
                }
                return;
            }

            try {
                // NormalizaÃ§Ã£o segura para percentuais
                const clampPercent = (v) => {
                    const n = Number(v);
                    if (!isFinite(n)) return 0;
                    return Math.max(0, Math.min(100, n));
                };
                switch (key) {
                    case 'display':
                    case 'currentValue':
                        element.textContent =
                            window.ui && typeof window.ui.formatarPercent === 'function'
                                ? window.ui.formatarPercent(clampPercent(currentRate), 1)
                                : `${clampPercent(currentRate).toFixed(1)}%`;
                        break;
                    case 'targetValue':
                        element.textContent =
                            window.ui && typeof window.ui.formatarPercent === 'function'
                                ? window.ui.formatarPercent(clampPercent(targetRate), 0)
                                : `${clampPercent(targetRate)}%`;
                        break;
                    case 'targetBar':
                        const targetWidth = Math.max(Math.min(clampPercent(targetRate), 100), 5);
                        element.style.width = `${targetWidth}%`;
                        break;
                    case 'currentBar':
                        const currentWidth = Math.max(clampPercent(currentRate), 0.5);
                        element.style.width = `${currentWidth}%`;

                        // Aplica cor baseada no tipo
                        const colors = this.getResolvedColors();
                        const color = type === 'win' ? colors.primary : colors.secondary;
                        element.style.backgroundColor = color;
                        break;
                }
            } catch (error) {
                if (isDevelopment && isDevelopment()) {
                    logger.error(`âŒ Erro ao atualizar ${type}.${key}:`, { error: String(error) });
                } else {
                    logger.debug && logger.debug(`Erro silencioso em ${type}.${key}`);
                }
            }
        });

        // Marcadores permanentes ao lado das barras (Meta/Limite e Atual)
        try {
            const currentBar = elements.currentBar;
            if (!currentBar || !currentBar.parentElement) return;
            const track = currentBar.parentElement; // .progress-bar-track

            // Cria marcadores se nÃ£o existirem
            const ensureMarker = (markerId, cssClass) => {
                let mk = track.querySelector(`#${markerId}`);
                if (!mk) {
                    mk = document.createElement('span');
                    mk.id = markerId;
                    mk.className = `progress-marker ${cssClass}`;
                    track.appendChild(mk);
                }
                return mk;
            };

            const targetMarker = ensureMarker(`${type}-target-marker`, 'target');
            const currentMarker = ensureMarker(`${type}-current-marker`, 'current');

            // Define textos
            const prefix = type === 'win' ? 'Meta' : 'Limite';
            targetMarker.textContent = `${prefix}: ${Math.max(0, Math.min(100, Number(targetRate) || 0))}%`;
            currentMarker.textContent = `Atual: ${Math.max(0, Math.min(100, Number(currentRate) || 0)).toFixed(1)}%`;

            // Posiciona marcadores com base na largura do track
            const trackWidth = track.clientWidth;
            const tmWidth = targetMarker.offsetWidth || 40;
            const cmWidth = currentMarker.offsetWidth || 40;
            const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

            const targetPx = clamp(
                (Math.max(0, Math.min(100, Number(targetRate) || 0)) / 100) * trackWidth -
                tmWidth / 2,
                0,
                trackWidth - tmWidth
            );
            const currentPx = clamp(
                (Math.max(0, Math.min(100, Number(currentRate) || 0)) / 100) * trackWidth -
                cmWidth / 2,
                0,
                trackWidth - cmWidth
            );

            targetMarker.style.left = `${targetPx}px`;
            currentMarker.style.left = `${currentPx}px`;

            // Mostra valores em R$ (se disponÃveis no contexto global formatador)
            try {
                const summary = this._buildGoalsProgressSummarySafe();
                const progressV2 =
                    (window.Features && window.Features.FEATURE_progress_cards_v2) ||
                    Features.FEATURE_progress_cards_v2;
                if (type === 'win' && summary?.goals) {
                    targetMarker.title = `${prefix} (${targetRate}%): ${ui?._formatarMoedaInternal?.(summary.goals.stopWinAmount) || ''}`;
                    const faltaRec =
                        summary.goals.restanteWinRecoveryAmount ?? summary.goals.restanteWinAmount;
                    if (progressV2) {
                        const faltapct =
                            summary.goals.stopWinAmount > 0
                                ? Math.max(
                                    0,
                                    Math.min(100, (faltaRec / summary.goals.stopWinAmount) * 100)
                                )
                                : 0;
                        currentMarker.title = `Faltam: ${ui?._formatarMoedaInternal?.(faltaRec) || ''} (${faltapct.toFixed(1)}%)`;
                    } else {
                        currentMarker.title = `Falta (com recuperaÃ§Ã£o): ${ui?._formatarMoedaInternal?.(faltaRec) || ''}`;
                    }
                }
                if (type === 'loss' && summary?.goals) {
                    targetMarker.title = `${prefix} (${targetRate}%): ${ui?._formatarMoedaInternal?.(summary.goals.stopLossAmount) || ''}`;
                    if (progressV2) {
                        const status = summary.status || { riscoUsado: 0 };
                        currentMarker.title = `Risco usado: ${Number(status.riscoUsado || 0).toFixed(1)}%`;
                    } else {
                        currentMarker.title = `Margem: ${ui?._formatarMoedaInternal?.(summary.goals.restanteLossAmount) || ''}`;
                    }
                }
            } catch { }
        } catch (e) {
            logger.warn('âšï¸ Falha ao posicionar marcadores de progresso', { error: String(e) });
        }
    },

    updateAssertividadeChart(historico, chartInstance) {
        // Validação defensiva dos parâmetros
        if (!Array.isArray(historico)) {
            logger.warn('⚠️ updateAssertividadeChart: histórico não é array, usando array vazio');
            historico = [];
        }

        if (!isValidChartInstance(chartInstance, 'updateAssertividadeChart')) {
            return false;
        }

        try {
            const wins = historico.filter(
                (op) => op && (op.resultado === 'win' || op.isWin === true)
            ).length;
            const losses = historico.filter(
                (op) => op && (op.resultado === 'loss' || op.isWin === false)
            ).length;

            const total = wins + losses;

            // Cores fixas para consistência (definidas em updateColors, mas reforçadas aqui)
            const winColor = '#00d9a6';
            const lossColor = '#ff6b6b';

            // Cores para modo vazio (iguais ao enhanced-donut-chart-system.js)
            const emptyColor = '#374151';
            const emptyBorderColor = '#4b5563';

            if (total === 0) {
                // MODO VAZIO: Exibe anel cinza placeholder
                chartInstance.data.datasets[0].data = [1]; // Valor dummy para renderizar o anel
                chartInstance.data.datasets[0].backgroundColor = [emptyColor];
                chartInstance.data.datasets[0].borderColor = emptyBorderColor;
                chartInstance.data.datasets[0].borderWidth = 2;

                // Desabilita tooltip no modo vazio
                if (chartInstance.options.plugins.tooltip) {
                    chartInstance.options.plugins.tooltip.enabled = false;
                }
            } else {
                // MODO NORMAL: Exibe dados reais
                chartInstance.data.datasets[0].data = [wins, losses];
                chartInstance.data.datasets[0].backgroundColor = [winColor, lossColor];

                // Restaura borda padrão (será sobrescrita pelo updateColors, mas define aqui por garantia)
                const style = getComputedStyle(document.body);
                const surface = style.getPropertyValue('--surface-color').trim();
                chartInstance.data.datasets[0].borderColor = surface;
                chartInstance.data.datasets[0].borderWidth = 0; // Borda padrão é 0 ou controlada pelo tema

                // Habilita tooltip
                if (chartInstance.options.plugins.tooltip) {
                    chartInstance.options.plugins.tooltip.enabled = true;
                }
            }

            chartInstance.update('none');

            logger.debug('✅ updateAssertividadeChart: dados atualizados', { wins, losses, total });
            return true;
        } catch (error) {
            logger.error('❌ updateAssertividadeChart: erro ao atualizar dados', {
                error: String(error),
            });
            return false;
        }
    },

    updatePatrimonioChart(historico, capitalInicial, chartInstance, isGlobal = false) {
        try {
            logger.debug('ðŸ“Š ATUALIZANDO GRÃFICO DE PATRIMÃ”NIO:', {
                historico: historico?.length || 0,
                capitalInicial,
                isGlobal,
                chartInstance: !!chartInstance,
            });

            if (!isValidChartInstance(chartInstance, 'updatePatrimonioChart')) {
                return false;
            }

            if (!Array.isArray(historico)) {
                logger.warn('âšï¸ HistÃ³rico nÃ£o Ã© array:', { type: typeof historico });
                historico = [];
            }

            if (typeof capitalInicial !== 'number' || isNaN(capitalInicial)) {
                logger.warn('âšï¸ Capital inicial invÃ¡lido:', { capitalInicial });
                capitalInicial = 0;
            }

            const capitalHistory = [capitalInicial];
            let runningCapital = capitalInicial;

            historico.forEach((op, index) => {
                if (op && typeof op.valor === 'number' && !isNaN(op.valor)) {
                    runningCapital += op.valor;
                    capitalHistory.push(runningCapital);
                } else {
                    // Normaliza formatos antigos (ex.: {resultado:'win'|'loss', valorEntrada, valorRetorno})
                    if (
                        op &&
                        op.resultado &&
                        (typeof op.valorEntrada === 'number' || typeof op.valorRetorno === 'number')
                    ) {
                        const val =
                            op.resultado === 'win' ? op.valorRetorno || 0 : -(op.valorEntrada || 0);
                        runningCapital += val;
                        capitalHistory.push(runningCapital);
                    } else if (op && typeof op === 'object') {
                        // Tentar extrair valores de outros formatos conhecidos
                        let val = 0;
                        if (op.isWin !== undefined) {
                            val = op.isWin
                                ? op.aporte * (op.payout || 1.8) - op.aporte
                                : -op.aporte;
                        } else if (op.lucro !== undefined) {
                            val = op.lucro;
                        } else if (op.resultado !== undefined) {
                            // Usar 0 para valores desconhecidos para manter continuidade
                            val = 0;
                            logger.debug(
                                `âšï¸ OperaÃ§Ã£o ${index} com formato nÃ£o reconhecido, usando valor 0:`,
                                { op }
                            );
                        } else {
                            logger.warn(`âšï¸ OperaÃ§Ã£o ${index} invÃ¡lida:`, { op });
                            return; // Skip esta operaÃ§Ã£o
                        }
                        runningCapital += val;
                        capitalHistory.push(runningCapital);
                    } else {
                        logger.warn(`âšï¸ OperaÃ§Ã£o ${index} invÃ¡lida:`, { op });
                    }
                }
            });

            // Labels mais informativos
            const labels = isGlobal
                ? capitalHistory.map((_, i) => (i === 0 ? 'InÃcio' : `Op ${i}`))
                : capitalHistory.map((_, i) => (i === 0 ? 'InÃcio' : `Op ${i}`));

            chartInstance.data.labels = labels;

            const isZen = config.zenMode;
            chartInstance.data.datasets[0].data = isZen
                ? capitalHistory.map(() => capitalInicial)
                : capitalHistory;

            if (chartInstance.options.plugins?.tooltip) {
                chartInstance.options.plugins.tooltip.enabled = !isZen;
            }

            logger.debug('âœ… Dados do grÃ¡fico atualizados:', {
                labels: labels.length,
                data: chartInstance.data.datasets[0].data.length,
                zenMode: isZen,
            });

            chartInstance.update('none');
            return true;
        } catch (error) {
            logger.error('âŒ updatePatrimonioChart: erro ao atualizar dados', {
                error: String(error),
            });
            return false;
        }
    },

    /**
     * Atualiza os charts da modal de Replay com dados de uma sessÃ£o especÃfica
     */
    updateReplayCharts(sessao) {
        try {
            if (!sessao || !Array.isArray(sessao.historicoCombinado)) return false;
            const historico = sessao.historicoCombinado;
            // EstatÃsticas para o texto central do plugin
            const wins = historico.filter((op) => op && (op.resultado === 'win' || op.isWin === true)).length;
            const totalOps = historico.length;
            const winRatePct = totalOps > 0 ? (wins / totalOps) * 100 : 0;
            if (this.replayAssertividadeChart) {
                this.replayAssertividadeChart.$currentStats = {
                    winRate: winRatePct,
                    totalOperations: totalOps,
                };
                this.updateAssertividadeChart(historico, this.replayAssertividadeChart);
                try { this.replayAssertividadeChart.update('none'); } catch (_) { }
            }
            if (this.replayPatrimonioChart) {
                // Propagar tambÃ©m para o grÃ¡fico de patrimÃ´nio (plugin global usa as mesmas stats)
                this.replayPatrimonioChart.$currentStats = {
                    winRate: winRatePct,
                    totalOperations: totalOps,
                };
                this.updatePatrimonioChart(
                    historico,
                    sessao.capitalInicial || 0,
                    this.replayPatrimonioChart
                );
                try { this.replayPatrimonioChart.update('none'); } catch (_) { }
            }
            return true;
        } catch (e) {
            logger.error('Erro ao atualizar charts de replay', { error: String(e) });
            return false;
        }
    },

    /**
     * Atualiza grÃ¡ficos globais com dados agregados
     */
    updateGlobal(aggregatedData) {
        try {
            if (!aggregatedData) {
                logger.warn('âšï¸ updateGlobal: dados agregados nÃ£o fornecidos');
                return false;
            }

            const { historico = [], capitalInicial = 0 } = aggregatedData;

            // ValidaÃ§Ã£o defensiva
            if (!Array.isArray(historico)) {
                logger.warn('âšï¸ updateGlobal: histÃ³rico nÃ£o Ã© array, usando array vazio');
                historico = [];
            }

            if (typeof capitalInicial !== 'number' || isNaN(capitalInicial)) {
                logger.warn('âšï¸ updateGlobal: capital inicial invÃ¡lido, usando 0');
                capitalInicial = 0;
            }

            // Calcula stats para texto central uma Ãºnica vez
            const wins = historico.filter((op) => op && (op.resultado === 'win' || op.isWin === true)).length;
            const totalOps = historico.length;
            const winRatePct = totalOps > 0 ? (wins / totalOps) * 100 : 0;

            // Atualiza grÃ¡ficos da DASHBOARD se existirem
            if (this.dashboardAssertividadeChart) {
                // Propaga stats ao plugin de texto central (usado tambÃ©m em Replay)
                this.dashboardAssertividadeChart.$currentStats = {
                    winRate: winRatePct,
                    totalOperations: totalOps,
                };

                // Normaliza histÃ³rico para funÃ§Ã£o de atualizaÃ§Ã£o
                const histAssert = historico.map((op) => ({ resultado: op?.isWin ? 'win' : op?.isWin === false ? 'loss' : op?.resultado }));
                this.updateAssertividadeChart(histAssert, this.dashboardAssertividadeChart);
            }

            if (this.dashboardPatrimonioChart) {
                // TambÃ©m propaga stats para o grÃ¡fico de patrimÃ´nio, pois o plugin Ã© global
                this.dashboardPatrimonioChart.$currentStats = {
                    winRate: winRatePct,
                    totalOperations: totalOps,
                };
                this.updatePatrimonioChart(
                    historico,
                    capitalInicial,
                    this.dashboardPatrimonioChart,
                    true
                );
            }

            logger.debug('âœ… updateGlobal: grÃ¡ficos globais atualizados', {
                historicoLength: historico.length,
                capitalInicial,
            });

            return true;
        } catch (error) {
            logger.error('âŒ updateGlobal: erro ao atualizar grÃ¡ficos globais', {
                error: String(error),
            });
            return false;
        }
    },

    updateColors() {
        const style = getComputedStyle(document.body);
        const surface = style.getPropertyValue('--surface-color').trim();
        const border = style.getPropertyValue('--border-color').trim();
        const muted = style.getPropertyValue('--text-muted').trim();

        // 🎨 Cores fixas do Progresso das Metas (consistência visual)
        const winColor = '#00d9a6';  // Verde para vitórias
        const lossColor = '#ff6b6b'; // Vermelho/rosa para derrotas

        // Cores para modo vazio (iguais ao enhanced-donut-chart-system.js)
        const emptyColor = '#374151';
        const emptyBorderColor = '#4b5563';

        // Atualiza gráficos de Assertividade (Donut) com cores fixas
        [this.dashboardAssertividadeChart, this.replayAssertividadeChart].forEach((chart) => {
            if (chart) {
                // Verifica se está em modo vazio (data = [1])
                const isEmpty = chart.data.datasets[0].data.length === 1;

                if (isEmpty) {
                    // Mantém cores de placeholder
                    chart.data.datasets[0].backgroundColor = [emptyColor];
                    chart.data.datasets[0].borderColor = emptyBorderColor;
                } else {
                    // Aplica cores normais
                    chart.data.datasets[0].backgroundColor = [winColor, lossColor];
                    chart.data.datasets[0].borderColor = surface;
                }

                if (chart.options.plugins.legend) chart.options.plugins.legend.labels.color = muted;
                chart.update('none');
            }
        });

        // Atualiza gráficos de Patrimônio (Line) com cor verde
        [this.dashboardPatrimonioChart, this.replayPatrimonioChart].forEach((chart) => {
            if (chart) {
                chart.data.datasets[0].borderColor = winColor;
                chart.data.datasets[0].backgroundColor = 'rgba(0, 217, 166, 0.1)'; // Verde com transparência
                chart.data.datasets[0].pointBackgroundColor = winColor;
                chart.data.datasets[0].fill = true;
                if (chart.options.scales?.y?.ticks) chart.options.scales.y.ticks.color = muted;
                if (chart.options.scales?.y?.grid) chart.options.scales.y.grid.color = border;
                if (chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = muted;
                if (chart.options.scales?.x?.grid)
                    chart.options.scales.x.grid.color = 'transparent';
                chart.update('none');
            }
        });
    },

    /**
     * Inicializa otimizaÃ§Ãµes de performance
     */
    async _initPerformanceOptimizations() {
        try {
            console.log('ðŸš€ Inicializando otimizaÃ§Ãµes de performance...');

            // Inicializar profiler de performance
            if (window.performanceProfiler) {
                performanceProfiler.cleanup(); // Limpar dados antigos
            }

            // Inicializar sistema de charts otimizado
            if (window.optimizedCharts) {
                await optimizedCharts.init();
            }

            // Precarregar mÃ³dulos pesados
            if (window.lazyLoader) {
                lazyLoader.preloadModules([
                    {
                        name: 'chart-advanced',
                        loader: () => lazyLoader.loadChartModule('advanced'),
                        options: { priority: 'low' },
                    },
                ]);
            }

            // Configurar limpeza automÃ¡tica de performance
            this._setupPerformanceCleanup();

            this._performanceOptimized = true;
            console.log('âœ… OtimizaÃ§Ãµes de performance inicializadas');
        } catch (error) {
            console.error('âŒ Erro ao inicializar otimizaÃ§Ãµes:', error);
            this._performanceOptimized = false;
        }
    },

    /**
     * Configura limpeza automÃ¡tica de dados de performance
     */
    _setupPerformanceCleanup() {
        // Limpar dados de performance a cada 5 minutos
        setInterval(
            () => {
                if (window.performanceProfiler) {
                    performanceProfiler.cleanup();
                }

                if (window.smartDebouncer) {
                    // Limpar updates antigos
                    const stats = smartDebouncer.getStats();
                    if (stats.pendingCount > 50) {
                        console.warn('ðŸ§¹ Muitos updates pendentes, limpando...');
                        smartDebouncer.clear();
                    }
                }

                if (window.optimizedCharts) {
                    optimizedCharts.cleanup();
                }
            },
            5 * 60 * 1000
        ); // 5 minutos
    },

    /**
     * ObtÃ©m relatÃ³rio de performance dos charts
     */
    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            optimizationsEnabled: this._performanceOptimized,
            charts: {
                total: Object.keys(this).filter(
                    (key) => key.includes('Chart') && this[key] !== null
                ).length,
                lastUpdate: this._lastProgressUpdate,
            },
        };

        return report;
    }
};