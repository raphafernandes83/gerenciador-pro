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

// Helper function para validação de chartInstance
function isValidChartInstance(chartInstance, functionName = 'charts') {
    if (!chartInstance) {
        logger.debug(`� ${functionName}: chartInstance não fornecida`);
        return false;
    }

    if (!chartInstance.data || !chartInstance.data.datasets || !chartInstance.data.datasets[0]) {
        logger.debug(`� ${functionName}: chartInstance mal configurada`);
        return false;
    }

    return true;
}


// ?? CHECKPOINT 2.2c: Helper de transi��o para DOMManager (CONSOLIDADO)
// Importa domHelper centralizado (anteriormente duplicado em 3 arquivos)
import { domHelper } from './src/dom-helper.js';

export const charts = {
    dashboardAssertividadeChart: null,
    dashboardPatrimonioChart: null,
    replayAssertividadeChart: null,
    replayPatrimonioChart: null,
    // ===== GR�FICO DE PROGRESSO DE METAS (RECONSTRU�DO) =====
    progressMetasChart: null,

    _rafId: 0,
    _pendingHistory: null,
    _storeSubscribed: false,
    _performanceOptimized: false,
    _lastProgressUpdate: 0,
    _progressUpdateThreshold: 100, // ms

    async init() {
        // Inicializar sistema de otimização de performance
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
                        labels: ['Vitórias', 'Derrotas'],
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
                        labels: ['Vitórias', 'Derrotas'],
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
     * Agenda uma atualização de progresso coalescida com otimizações de performance.
     * Usa debounce inteligente e throttling para evitar re-renders excessivos.
     */
    scheduleProgressUpdate(history) {
        const historyData = Array.isArray(history) ? history : [];

        // Usar sistema otimizado se dispon�vel
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

            // Medir performance da atualização
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
     * Executa atualização de progresso com profiling de performance
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

    // ===== Integração com metas de Stop Win/Loss (puro + seguro) =====
    _buildGoalsProgressSummarySafe() {
        try {
            // 🔧 CORREÇÃO: Usar state/config diretamente como no backup funcionando
            const stateRef = window.state || {};
            const configRef = window.config || {};
            // Usando window.state/config para c�lculos

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
                Number(dom.payoutAtivo?.value) ||
                0;

            // Usa funções puras se a flag estiver ativa e se existirem globalmente; senão, calcula inline m�nimo
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
                // Lock ativado quando necess�rio
                return { goals, status, hint, lock };
            }

            // Cálculo m�nimo inline
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

            // Fallback: aplicar diretamente no badge caso ui não esteja dispon�vel
            const badge = dom.progressSoftLockBadge;
            if (badge) {
                const icon = lock.type === 'STOP_WIN' ? '🎯' : '��';
                const msg =
                    lock.type === 'STOP_WIN'
                        ? 'Meta de ganhos atingida'
                        : 'Limite de perda atingido';

                badge.textContent = `${icon} ${msg}`;
                domHelper.remove(badge, 'hidden'); // ??
                domHelper.add(badge, 'show'); // ??
                badge.style.display = 'inline-flex';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';

                // Dispara popup se dispon�vel
                if (window.ui && typeof window.ui.showInsight === 'function') {
                    window.ui.showInsight(lock.reason, 'warning', 3000);
                }
            }
        } catch (e) {
            console.warn('Erro ao aplicar lock mode:', e);
        }
    },

    /**
     * ?? Inicializa o gr�fico de pizza de progresso das metas
     * ?? DESABILITADO: Este m�todo n�o deve mais criar gr�ficos
     * O gr�fico � gerenciado exclusivamente pelo progress-card-module.js
     */
    initProgressChart() {
        logger.warn('?? initProgressChart() DESABILITADO - O gr�fico � gerenciado pelo progress-card-module.js');

        // ??? PROTE��O: Sempre retorna true para n�o quebrar c�digo que depende deste m�todo
        // Mas N�O cria nenhum gr�fico
        return true;

        /* C�DIGO DESABILITADO PARA EVITAR GR�FICO DUPLICADO (verde escuro/vermelho escuro)
        
        logger.info('?? Inicializando gr�fico de progresso de metas...');

        // ??? PROTE��O: Evita reinicializa��o se gr�fico j� existe
        if (this.progressMetasChart) {
            logger.warn('?? Gr�fico j� existe, pulando inicializa��o para evitar duplica��o');
            return true; // Retorna sucesso pois o gr�fico j� est� pronto
        }

        // ??? Valida��o robusta de DOM com diagn�stico
        const canvasElement = dom.progressPieChart;
        if (!canvasElement) {
            logger.error('? Canvas progressPieChart n�o encontrado no DOM');
                    logger.debug('🔎 DOM dispon�vel:', {
                        keys: Object.keys(dom).filter((key) => key.includes('progress')),
                    });
                    return false;
                }
        
                // 🛡� Validação adicional de contexto Canvas
                try {
                    const context = canvasElement.getContext('2d');
                    if (!context) {
                        logger.error('� Falha ao obter contexto 2D do canvas');
                        return false;
                    }
                } catch (contextError) {
                    logger.error('� Erro ao validar contexto canvas:', { error: String(contextError) });
                    return false;
                }
        
                try {
                    // Destrói qualquer instância existente neste canvas registrada pelo Chart.js
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
        
                    // Destrói gráfico anterior se existir
                    if (this.progressMetasChart) {
                        try {
                            this.progressMetasChart.destroy();
                        } catch (_) { }
                        this.progressMetasChart = null;
                    }
        
                    // 🔧 CORREÇÃO: Configurações otimizadas para funcionalidade real
                    const progressConfig = {
                        type: 'doughnut',
                        data: {
                            labels: ['Vitórias', 'Derrotas'],
                            datasets: [
                                {
                                    data: [0, 0], // Inicializa com zeros, será atualizado com dados reais
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
                                    enabled: false, // CORRE��O: Desabilitado para evitar sobreposi��o de gr�fico fantasma
                                },
                            },
                            animation: {
                                duration: 300, // Animação mais rápida para melhor responsividade
                                easing: 'easeInOutQuart',
                            },
                        },
                    };
        
                    // 🔧 CORREÇÃO: Criação mais robusta da instância
                    this.progressMetasChart = new Chart(canvasElement.getContext('2d'), progressConfig);
        
                    // 🔧 CORREÇÃO: Inicializa com dados padrão seguros
                    this.progressMetasChart.$currentStats = {
                        winRate: 0,
                        totalOperations: 0
                    };
        
                    // Plugin: texto central com WR atual
                    // REMOVIDO: O plugin centerText causava conflitos de propriedade readonly.
                    // A exibi��o de texto central deve ser feita via HTML/CSS sobreposto ou plugin seguro.
        
        
                    // 🛡� Validação pós-inicialização mais rigorosa
                    if (!this.progressMetasChart ||
                        typeof this.progressMetasChart.update !== 'function' ||
                        !this.progressMetasChart.data ||
                        !this.progressMetasChart.data.datasets) {
                        logger.error('� Gráfico criado mas com interface inválida');
                        return false;
                    }
        
                    // 🔧 CORREÇÃO: Força primeira renderização
                    try {
                        this.progressMetasChart.update('none');
                    } catch (updateError) {
                        logger.warn('�� Erro na primeira renderização:', { error: updateError.message });
                    }
        
                    logger.info('✅ Gráfico de progresso inicializado com sucesso');
                    return true;
                } catch (error) {
                    // � Diagnóstico detalhado do erro
                    logger.error('� Erro ao inicializar gráfico de progresso:', {
                        message: error.message,
                        stack: error.stack?.substring(0, 200),
                        canvasElement: !!canvasElement,
                        domKeys: Object.keys(dom).length,
                        chartJsAvailable: typeof Chart !== 'undefined',
                    });
        
                    // 🛡� Cleanup em caso de falha parcial
                    if (this.progressMetasChart) {
                        try {
                            this.progressMetasChart.destroy();
                            this.progressMetasChart = null;
                        } catch (cleanupError) {
                            logger.warn('�� Erro durante cleanup', { error: cleanupError.message });
                        }
                    }
        
                    return false;
                }
            }
        
            FIM DO C�DIGO DESABILITADO */
    },

    /**
     * ?? Atualiza o progresso das metas com hist�rico da sess�o
     */
    updateProgressChart(sessionHistory = []) {
        const requestId = generateRequestId('update_progress');
        performanceTracker.startOperation('charts_update_progress', requestId, {
            historyLength: sessionHistory?.length || 0,
        });

        logger
            .withRequest(requestId)
            .debug('🔄 CHARTS: Atualizando progresso com histórico:', {
                length: sessionHistory?.length || 0,
            });

        if (!Array.isArray(sessionHistory)) {
            logger.withRequest(requestId).warn('�� Histórico inválido, usando array vazio');
            sessionHistory = [];
        }

        try {
            performanceTracker.addMarker(requestId, 'normalization_start');

            // Normalização: aceita histórico com { isWin:boolean } ou { resultado:'win'|'loss' }
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

            // Inicializa gráfico se não existir
            if (!this.progressMetasChart) {
                logger.withRequest(requestId).info('🎯 Gráfico não existe, inicializando...');
                if (!this.initProgressChart()) {
                    performanceTracker.finishOperation(requestId, 'error', {
                        reason: 'chart_init_failed',
                    });
                    logger.withRequest(requestId).error('� Falha ao inicializar gráfico');
                    return false;
                }
                // Garante assinatura quando o gráfico é (re)criado
                this._ensureStoreSubscription();
            }

            performanceTracker.addMarker(requestId, 'stats_calculation');

            // Define metas padrão se não definidas
            const targets = {
                winTarget: (typeof config.metaWinRate === 'number' ? config.metaWinRate : 60),
                lossTarget: (typeof config.metaLossRate === 'number' ? config.metaLossRate : 40),
            };

            // 🔧 CORREÇÃO: Usa novo sistema de cálculos integrado
            const stats = this.calculateProgressStats(normalizedHistory);

            // Disponibiliza últimas estat�sticas para utilitários/diagnósticos leves
            try {
                this.lastStats = stats;
            } catch { }

            // 🔧 CORREÇÃO: Calcula dados completos do card se função dispon�vel
            let cardData = null;
            try {
                if (typeof window.calculateProgressCardData === 'function') {
                    // FASE 3: Busca dados anteriores do cache para comparação de trends
                    const previousData = window.progressCardCache?.getPrevious() || null;

                    cardData = window.calculateProgressCardData(
                        normalizedHistory,
                        window.config || {},
                        window.state || {},
                        previousData // Dados anteriores para FASE 3
                    );
                }
            } catch (error) {
                logger.warn('�� Erro ao calcular dados completos do card:', { error: error.message });
            }

            // Calcula metas/gaps/hints a partir do contexto do app (sem travar se faltar dado)
            const goalsSummary = this._buildGoalsProgressSummarySafe();

            performanceTracker.addMarker(requestId, 'ui_updates_start');

            // 🔧 CORREÇÃO: Usa novo sistema de atualização se dispon�vel
            if (cardData && cardData.isValid && typeof window.updateProgressCardComplete === 'function') {
                try {
                    const updateSuccess = window.updateProgressCardComplete(cardData, this.progressMetasChart);
                    if (updateSuccess) {
                        logger.debug('✅ Card atualizado via novo sistema');

                        // FASE 3: Armazena dados atuais no cache para futuras comparações
                        if (window.progressCardCache) {
                            window.progressCardCache.store(cardData);
                            logger.debug('💾 Dados armazenados no cache para comparações futuras');
                        }
                    } else {
                        // Fallback para sistema antigo
                        this.updateProgressPieChart(stats, goalsSummary);
                        this.updateProgressStatusNew(stats, targets, goalsSummary);
                    }
                } catch (updateError) {
                    logger.warn('�� Erro no novo sistema, usando fallback:', { error: updateError.message });
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
            logger.withRequest(requestId).info('✅ CHARTS: Progresso atualizado');
            return true;
        } catch (error) {
            performanceTracker.finishOperation(requestId, 'error', { error: error.message });
            logger
                .withRequest(requestId)
                .error('� Erro ao atualizar progresso:', { error: String(error) });
            return false;
        }
    },

    /**
     * 📊 Calcula estat�sticas do progresso (VERSÃO MELHORADA)
     * Integra com o novo sistema de cálculos reais
     */
    calculateProgressStats(sessionHistory) {
        try {
            // Importa função de cálculo real dinamicamente
            if (typeof window.calculateRealStats === 'function') {
                return window.calculateRealStats(sessionHistory);
            }

            // Fallback para cálculo local se função externa não dispon�vel
            return this._calculateProgressStatsLocal(sessionHistory);
        } catch (error) {
            logger.error('� Erro ao calcular estat�sticas de progresso:', { error: String(error) });
            return this._calculateProgressStatsLocal(sessionHistory);
        }
    },

    /**
     * 📊 Cálculo local de estat�sticas (fallback)
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

        // Processamento mais robusto das operações
        for (const operacao of sessionHistory) {
            if (!operacao || typeof operacao !== 'object') {
                continue;
            }

            // Determina resultado da operação
            let isWin = null;
            if (typeof operacao.isWin === 'boolean') {
                isWin = operacao.isWin;
            } else if (typeof operacao.resultado === 'string') {
                isWin = operacao.resultado === 'win';
            } else {
                continue; // Pula operações sem resultado claro
            }

            // Conta vitórias e derrotas
            if (isWin) {
                wins++;
            } else {
                losses++;
            }

            // Soma lucro/preju�zo se dispon�vel
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
     * 🧪 Força dados de teste no gráfico
     */
    testProgressWithData(testData = null) {
        logger.info('🧪 TESTE: Aplicando dados de teste no gráfico...');

        const testStats = testData || {
            totalOperations: 25,
            wins: 18,
            losses: 7,
            winRate: 72,
            lossRate: 28,
            remaining: 0,
        };

        const testTargets = { winTarget: 80, lossTarget: 20 };

        // Força atualização dos displays ANTES do gráfico
        const winDisplay = dom.winRateDisplay;
        const lossDisplay = dom.lossRateDisplay;

        if (winDisplay) winDisplay.textContent = testStats.winRate.toFixed(1) + '%';
        if (lossDisplay) lossDisplay.textContent = testStats.lossRate.toFixed(1) + '%';

        // Atualização normal também
        this.updateProgressPieChart(testStats);
        this.updateProgressBarsNew(testStats, testTargets);
        this.updateProgressStatusNew(testStats, testTargets);

        logger.debug('🧪 Dados de teste aplicados COM FORÇA:', testStats);
    },

    /**
     * 🎨 Resolve cores CSS dinamicamente
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
     * 📊 Atualiza status textual do progresso
     */
    updateProgressStatusNew(stats, targets, goalsSummary = null) {
        logger.debug('📊 Atualizando status do progresso:', { stats, targets });

        // Atualização com fallback
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

        // Atualiza header "Sessão Ativa - X ops"
        try {
            if (dom.progressSessionInfo) {
                const isActive = !!(window.state && window.state.isSessionActive);
                const count = Number(stats.totalOperations || 0);
                dom.progressSessionInfo.textContent = `${isActive ? 'Sessão Ativa' : 'Sessão Inativa'} · ${count} ops`;
            }
        } catch { }
    },

    /**
     * 🎯 Atualiza os cartões de status (Win / Loss) com mensagens e classes
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
                    domHelper.remove(el, 'excellent', 'good', 'warning', 'neutral'); // ??
                    domHelper.add(el, level); // ??
                } catch { }
            };

            // WIN STATUS
            if (winEl) {
                let msg = 'Vamos começar!';
                let level = 'neutral';
                let icon = '🟢';
                if (totalOps > 0) {
                    if (stats.winRate >= (targets.winTarget || 80)) {
                        msg = 'Meta atingida';
                        level = 'excellent';
                        icon = '✅';
                    } else if (stats.winRate >= (targets.winTarget || 80) * 0.8) {
                        msg = 'Quase lá';
                        level = 'good';
                        icon = '🟡';
                    } else {
                        msg = 'Aprimorar assertividade';
                        level = 'warning';
                        icon = '��';
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
                    sub = `Meta: ${meta}% · Atual: ${atual}% · Faltam: ${faltaTxt} (${faltapct.toFixed(1)}%)`;
                } else {
                    const extra = goalsSummary?.goals
                        ? ` · Falta: ${ui?._formatarMoedaInternal?.(goalsSummary.goals.restanteWinRecoveryAmount ?? goalsSummary.goals.restanteWinAmount) || 'R$ 0,00'}`
                        : '';
                    sub = `Meta: ${meta}% · Atual: ${atual}%${extra}`;
                }
                setCard(winEl, `${icon} ${msg}`, level, sub);
            }

            // LOSS STATUS
            if (lossEl) {
                let msg = 'Controle total';
                let level = 'excellent';
                let icon = '✅';
                if (totalOps > 0) {
                    const limit = targets.lossTarget || 20;
                    if (stats.lossRate <= limit) {
                        msg = 'Controle total';
                        level = 'excellent';
                        icon = '✅';
                    } else if (stats.lossRate <= limit + 5) {
                        msg = 'Atenção';
                        level = 'good';
                        icon = '🟡';
                    } else {
                        msg = 'Risco alto';
                        level = 'warning';
                        icon = '��';
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
                    sub = `Limite: ${meta}% · Atual: ${atual}% · Risco usado: ${risco}% · Resultado: ${resultadoTxt} · Limite(R$): -${limiteTxt.replace('R$ ', '')}`;
                } else {
                    const extra = goalsSummary?.goals
                        ? ` · Margem: ${ui?._formatarMoedaInternal?.(goalsSummary.goals.restanteLossAmount) || 'R$ 0,00'}`
                        : '';
                    sub = `Limite: ${meta}% · Atual: ${atual}%${extra}`;
                }
                setCard(lossEl, `${icon} ${msg}`, level, sub);
            }
        } catch (error) {
            logger.warn('�� _updateStatusCards: falha ao atualizar cartões', {
                error: String(error),
            });
        }
    },

    /**
     * 🥧 Atualiza apenas o gráfico de pizza
     */
    updateProgressPieChart(stats, goalsSummary = null) {
        // Verificações defensivas: gráfico e canvas precisam estar válidos
        if (!this.progressMetasChart || !this.progressMetasChart.canvas) {
            // Tentar re-inicializar se o canvas existir no DOM mapeado
            try {
                if (dom && dom.progressPieChart) {
                    const reinitOk = this.initProgressChart();
                    if (!reinitOk) return false;
                } else {
                    // Canvas indispon�vel no DOM; não atualizar agora
                    return false;
                }
            } catch {
                return false;
            }
        }

        try {
            // Atualiza cores dinamicamente
            const colors = this.getResolvedColors();

            // Anel único Win/Loss - SIMPLIFICADO
            this.progressMetasChart.data.datasets[0].backgroundColor = [
                colors.primary,  // Verde para vitórias
                colors.secondary // Vermelho para derrotas
            ];

            this.progressMetasChart.data.datasets[0].data = [
                stats.winRate,
                stats.lossRate
            ];

            this.progressMetasChart.update('active');

            // Texto central é desenhado pelo plugin; esconder rótulo DOM (garantia)
            try {
                if (dom.totalOperationsDisplay) dom.totalOperationsDisplay.style.display = 'none';
            } catch { }

            // Passa stats atuais ao plugin de texto central
            this.progressMetasChart.$currentStats = stats;

            return true;
        } catch (error) {
            logger.error('� Erro ao atualizar gráfico de pizza', { error: String(error) });
            return false;
        }
    },

    /**
     * 📊 Atualiza cards de informação (sem barras visuais)
     */
    updateProgressInfoCards(stats, targets) {
        // Atualiza displays de percentual
        const winDisplay = dom.winRateDisplay;
        const lossDisplay = dom.lossRateDisplay;

        if (winDisplay) winDisplay.textContent = `${stats.winRate.toFixed(1)}%`;
        if (lossDisplay) lossDisplay.textContent = `${stats.lossRate.toFixed(1)}%`;

        // Refer�ncias aos elementos percentuais removidas - campos n�o existem mais

        // Atualiza valores em R$ 
        try {
            const summary = this._buildGoalsProgressSummarySafe();
            if (summary?.goals) {
                const g = summary.goals;

                // Win (R$)
                const winTargetAmountEl = dom.winTargetAmount || dom.winTargetAmount;
                const winRemainingAmountEl = dom.winRemainingAmount || dom.winRemainingAmount;
                const metaTargetAmountEl = dom.metaTargetAmount;
                const metaAchievedAmountEl = dom.metaAchievedAmount;

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
                    domHelper.remove(metaAchievedAmountEl, 'text-positive', 'text-negative'); // ??
                    if (achieved > 0) domHelper.add(metaAchievedAmountEl, 'text-positive'); // ??
                }

                // Loss (R$)
                const lossLimitAmountEl = dom.lossLimitAmount || dom.lossLimitAmount;
                const lossSessionResultEl = dom.lossSessionResult || dom.lossSessionResult;
                const statusTargetAmountEl = dom.statusTargetAmount;
                const statusAchievedEl = dom.statusAchieved;
                const statusExceedEl = dom.statusExceed;
                const statusMarginEl = dom.statusMargin;
                const statusRiskUsedEl = dom.statusRiskUsed;

                const stopLossAmountBRL = `R$ ${Number(g.stopLossAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const sessionPLBRL = `R$ ${Number(g.lucroAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                if (lossLimitAmountEl) lossLimitAmountEl.textContent = stopLossAmountBRL;
                if (lossSessionResultEl) {
                    lossSessionResultEl.textContent = sessionPLBRL;
                    domHelper.remove(lossSessionResultEl, 'text-positive', 'text-negative'); // ??
                    if ((g.lucroAcumulado || 0) > 0) domHelper.add(lossSessionResultEl, 'text-positive'); // ??
                    if ((g.lucroAcumulado || 0) < 0) domHelper.add(lossSessionResultEl, 'text-negative'); // ??
                }

                // Status (lado esquerdo da prévia)
                if (statusTargetAmountEl) statusTargetAmountEl.textContent = stopWinAmountBRL;
                if (statusAchievedEl) {
                    statusAchievedEl.textContent = achievedBRL;
                    domHelper.remove(statusAchievedEl, 'text-positive', 'text-negative'); // ??
                    if (achieved > 0) domHelper.add(statusAchievedEl, 'text-positive'); // ??
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
                    domHelper.remove(statusRiskUsedEl, 'text-positive', 'text-negative'); // ??
                    if (riscoUsado > 0) domHelper.add(statusRiskUsedEl, 'text-negative'); // ??
                }
            }
        } catch (error) {
            logger.warn('�� Erro ao atualizar valores monetários:', error.message);
        }
    },

    /**
     * 📊 Atualiza barras de progresso com verificações
     */
    updateProgressBarsNew(stats, targets) {
        this.updateProgressBarSafe('win', stats.winRate, targets.winTarget);
        this.updateProgressBarSafe('loss', stats.lossRate, targets.lossTarget);

        // Atualiza valores em R$ abaixo das barras, quando poss�vel
        try {
            const summary = this._buildGoalsProgressSummarySafe();
            if (summary?.goals) {
                const g = summary.goals;
                if (dom.winTargetAmount)
                    dom.winTargetAmount.textContent =
                        ui?._formatarMoedaInternal?.(g.stopWinAmount) ||
                        `R$ ${Number(g.stopWinAmount || 0).toFixed(2)}`;
                // Usa falta com recuperação (considera preju�zo atual)
                const faltaRec =
                    typeof g.restanteWinRecoveryAmount === 'number'
                        ? g.restanteWinRecoveryAmount
                        : g.restanteWinAmount;
                // Layout original: mostrar restante até a meta
                if (dom.winRemainingAmount)
                    dom.winRemainingAmount.textContent =
                        ui?._formatarMoedaInternal?.(faltaRec) ||
                        `R$ ${Number(faltaRec || 0).toFixed(2)}`;
                // Limite (R$) no preview é positivo (sem sinal), mantendo coerência
                if (dom.lossLimitAmount)
                    dom.lossLimitAmount.textContent =
                        ui?._formatarMoedaInternal?.(g.stopLossAmount) ||
                        `R$ ${Number(g.stopLossAmount || 0).toFixed(2)}`;
                if (dom.lossSessionResult) {
                    const txt =
                        ui?._formatarMoedaInternal?.(g.lucroAcumulado) ||
                        `R$ ${Number(g.lucroAcumulado || 0).toFixed(2)}`;
                    dom.lossSessionResult.textContent = txt;
                    // cor por sinal (apenas classe; CSS já governa as cores globais)
                    domHelper.remove(dom.lossSessionResult, 'positive', 'negative'); // ??
                    if (g.lucroAcumulado > 0) domHelper.add(dom.lossSessionResult, 'positive'); // ??
                    if (g.lucroAcumulado < 0) domHelper.add(dom.lossSessionResult, 'negative'); // ??
                }
                // Cor para "Meta Restante": se houver atingido > 0 e ainda restar pouco, manter neutro; 
                // regra simples: se restante == 0 e lucro > 0, destacar positivo no P/L já cobre o caso.
                if (dom.winRemainingAmount) {
                    domHelper.remove(dom.winRemainingAmount, 'positive', 'negative'); // ??
                    const restante = Number(faltaRec || 0);
                    // Não colorimos restante positivo como negativo para não confundir; mantemos neutro.
                    if (restante === 0 && g.lucroAcumulado > 0) {
                        domHelper.add(dom.winRemainingAmount, 'positive'); // ??
                    }
                }
                // Mini barras
                const metaPercent =
                    g.lucroAcumulado > 0 && g.stopWinAmount > 0
                        ? Math.min(100, (g.lucroAcumulado / g.stopWinAmount) * 100)
                        : 0;
                const metaFill = dom.metaProgressFill;
                const metaDisp = dom.metaProgressDisplay;
                if (metaFill) metaFill.style.width = `${metaPercent}%`;
                if (metaDisp) {
                    metaDisp.textContent = `${metaPercent.toFixed(1)}%`;
                    domHelper.remove(metaDisp, 'positive', 'negative'); // ??
                    if (metaPercent > 0) domHelper.add(metaDisp, 'positive'); // ??
                }

                const riscoPercent =
                    g.lucroAcumulado < 0 && g.stopLossAmount > 0
                        ? Math.min(100, (Math.abs(g.lucroAcumulado) / g.stopLossAmount) * 100)
                        : 0;
                const riscoFill = dom.riskUsedFill;
                const riscoDisp = dom.riskUsedDisplay;
                if (riscoFill) riscoFill.style.width = `${riscoPercent}%`;
                if (riscoDisp) {
                    riscoDisp.textContent = `${riscoPercent.toFixed(1)}%`;
                    domHelper.remove(riscoDisp, 'positive', 'negative'); // ??
                    if (riscoPercent > 0) domHelper.add(riscoDisp, 'negative'); // ??
                }
            }
        } catch { }

        // Badges de tendência (não intrusivo; usa prevWinRate/prevLossRate se dispon�veis)
        try {
            const wrPrev = typeof stats.prevWinRate === 'number' ? stats.prevWinRate : null;
            const lrPrev = typeof stats.prevLossRate === 'number' ? stats.prevLossRate : null;
            const wrDelta = wrPrev !== null ? (stats.winRate - wrPrev) : 0;
            const lrDelta = lrPrev !== null ? (stats.lossRate - lrPrev) : 0;

            const wrBadge = dom.metaTrendBadge;
            if (wrBadge) {
                if (wrPrev === null || Math.abs(wrDelta) < 0.05) {
                    wrBadge.textContent = '';
                    wrBadge.className = 'trend-badge';
                } else {
                    wrBadge.textContent = `${wrDelta > 0 ? '▲' : '▼'} ${Math.abs(wrDelta).toFixed(1)} pp`;
                    wrBadge.className = `trend-badge ${wrDelta > 0 ? 'trend-up' : 'trend-down'}`;
                }
            }

            const lrBadge = dom.lossTrendBadge;
            if (lrBadge) {
                if (lrPrev === null || Math.abs(lrDelta) < 0.05) {
                    lrBadge.textContent = '';
                    lrBadge.className = 'trend-badge';
                } else {
                    lrBadge.textContent = `${lrDelta > 0 ? '▲' : '▼'} ${Math.abs(lrDelta).toFixed(1)} pp`;
                    lrBadge.className = `trend-badge ${lrDelta > 0 ? 'trend-up' : 'trend-down'}`;
                }
            }
        } catch { }
    },

    /**
     * 📊 Atualiza uma barra individual com verificações
     */
    updateProgressBarSafe(type, currentRate, targetRate) {
        logger.debug(`🔄 Atualizando barra ${type}:`, { currentRate, targetRate });

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
                    logger.warn(`�� Elemento ${type}${key} não encontrado`);
                } else {
                    logger.debug && logger.debug(`Elemento ${type}${key} não encontrado`);
                }
                return;
            }

            try {
                // Normalização segura para percentuais
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
                    logger.error(`� Erro ao atualizar ${type}.${key}:`, { error: String(error) });
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

            // Cria marcadores se não existirem
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

            // Mostra valores em R$ (se dispon�veis no contexto global formatador)
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
                        currentMarker.title = `Falta (com recuperação): ${ui?._formatarMoedaInternal?.(faltaRec) || ''}`;
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
            logger.warn('�� Falha ao posicionar marcadores de progresso', { error: String(e) });
        }
    },

    updateAssertividadeChart(historico, chartInstance) {
        // Valida��o defensiva dos par�metros
        if (!Array.isArray(historico)) {
            logger.warn('?? updateAssertividadeChart: hist�rico n�o � array, usando array vazio');
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

            // Cores fixas para consist�ncia (definidas em updateColors, mas refor�adas aqui)
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

                // Restaura borda padr�o (ser� sobrescrita pelo updateColors, mas define aqui por garantia)
                const style = getComputedStyle(document.body);
                const surface = style.getPropertyValue('--surface-color').trim();
                chartInstance.data.datasets[0].borderColor = surface;
                chartInstance.data.datasets[0].borderWidth = 0; // Borda padr�o � 0 ou controlada pelo tema

                // Habilita tooltip
                if (chartInstance.options.plugins.tooltip) {
                    chartInstance.options.plugins.tooltip.enabled = true;
                }
            }

            chartInstance.update('none');

            logger.debug('? updateAssertividadeChart: dados atualizados', { wins, losses, total });
            return true;
        } catch (error) {
            logger.error('? updateAssertividadeChart: erro ao atualizar dados', {
                error: String(error),
            });
            return false;
        }
    },

    updatePatrimonioChart(historico, capitalInicial, chartInstance, isGlobal = false) {
        try {
            logger.debug('📊 ATUALIZANDO GR�FICO DE PATRIMÔNIO:', {
                historico: historico?.length || 0,
                capitalInicial,
                isGlobal,
                chartInstance: !!chartInstance,
            });

            if (!isValidChartInstance(chartInstance, 'updatePatrimonioChart')) {
                return false;
            }

            if (!Array.isArray(historico)) {
                logger.warn('�� Histórico não é array:', { type: typeof historico });
                historico = [];
            }

            if (typeof capitalInicial !== 'number' || isNaN(capitalInicial)) {
                logger.warn('�� Capital inicial inválido:', { capitalInicial });
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
                                `�� Operação ${index} com formato não reconhecido, usando valor 0:`,
                                { op }
                            );
                        } else {
                            logger.warn(`�� Operação ${index} inválida:`, { op });
                            return; // Skip esta operação
                        }
                        runningCapital += val;
                        capitalHistory.push(runningCapital);
                    } else {
                        logger.warn(`�� Operação ${index} inválida:`, { op });
                    }
                }
            });

            // Labels mais informativos
            const labels = isGlobal
                ? capitalHistory.map((_, i) => (i === 0 ? 'In�cio' : `Op ${i}`))
                : capitalHistory.map((_, i) => (i === 0 ? 'In�cio' : `Op ${i}`));

            chartInstance.data.labels = labels;

            const isZen = config.zenMode;
            chartInstance.data.datasets[0].data = isZen
                ? capitalHistory.map(() => capitalInicial)
                : capitalHistory;

            if (chartInstance.options.plugins?.tooltip) {
                chartInstance.options.plugins.tooltip.enabled = !isZen;
            }

            logger.debug('✅ Dados do gráfico atualizados:', {
                labels: labels.length,
                data: chartInstance.data.datasets[0].data.length,
                zenMode: isZen,
            });

            chartInstance.update('none');
            return true;
        } catch (error) {
            logger.error('� updatePatrimonioChart: erro ao atualizar dados', {
                error: String(error),
            });
            return false;
        }
    },

    /**
     * Atualiza os charts da modal de Replay com dados de uma sessão espec�fica
     */
    updateReplayCharts(sessao) {
        try {
            if (!sessao || !Array.isArray(sessao.historicoCombinado)) return false;
            const historico = sessao.historicoCombinado;
            // Estat�sticas para o texto central do plugin
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
                // Propagar também para o gráfico de patrimônio (plugin global usa as mesmas stats)
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
     * Atualiza gráficos globais com dados agregados
     */
    updateGlobal(aggregatedData) {
        try {
            if (!aggregatedData) {
                logger.warn('�� updateGlobal: dados agregados não fornecidos');
                return false;
            }

            const { historico = [], capitalInicial = 0 } = aggregatedData;

            // Validação defensiva
            if (!Array.isArray(historico)) {
                logger.warn('�� updateGlobal: histórico não é array, usando array vazio');
                historico = [];
            }

            if (typeof capitalInicial !== 'number' || isNaN(capitalInicial)) {
                logger.warn('�� updateGlobal: capital inicial inválido, usando 0');
                capitalInicial = 0;
            }

            // Calcula stats para texto central uma única vez
            const wins = historico.filter((op) => op && (op.resultado === 'win' || op.isWin === true)).length;
            const totalOps = historico.length;
            const winRatePct = totalOps > 0 ? (wins / totalOps) * 100 : 0;

            // Atualiza gráficos da DASHBOARD se existirem
            if (this.dashboardAssertividadeChart) {
                // Propaga stats ao plugin de texto central (usado também em Replay)
                this.dashboardAssertividadeChart.$currentStats = {
                    winRate: winRatePct,
                    totalOperations: totalOps,
                };

                // Normaliza histórico para função de atualização
                const histAssert = historico.map((op) => ({ resultado: op?.isWin ? 'win' : op?.isWin === false ? 'loss' : op?.resultado }));
                this.updateAssertividadeChart(histAssert, this.dashboardAssertividadeChart);
            }

            if (this.dashboardPatrimonioChart) {
                // Também propaga stats para o gráfico de patrimônio, pois o plugin é global
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

            logger.debug('✅ updateGlobal: gráficos globais atualizados', {
                historicoLength: historico.length,
                capitalInicial,
            });

            return true;
        } catch (error) {
            logger.error('� updateGlobal: erro ao atualizar gráficos globais', {
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

        // ?? Cores fixas do Progresso das Metas (consist�ncia visual)
        const winColor = '#00d9a6';  // Verde para vit�rias
        const lossColor = '#ff6b6b'; // Vermelho/rosa para derrotas

        // Cores para modo vazio (iguais ao enhanced-donut-chart-system.js)
        const emptyColor = '#374151';
        const emptyBorderColor = '#4b5563';

        // Atualiza gr�ficos de Assertividade (Donut) com cores fixas
        [this.dashboardAssertividadeChart, this.replayAssertividadeChart].forEach((chart) => {
            if (chart) {
                // Verifica se est� em modo vazio (data = [1])
                const isEmpty = chart.data.datasets[0].data.length === 1;

                if (isEmpty) {
                    // Mant�m cores de placeholder
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

        // Atualiza gr�ficos de Patrim�nio (Line) com cor verde
        [this.dashboardPatrimonioChart, this.replayPatrimonioChart].forEach((chart) => {
            if (chart) {
                chart.data.datasets[0].borderColor = winColor;
                chart.data.datasets[0].backgroundColor = 'rgba(0, 217, 166, 0.1)'; // Verde com transpar�ncia
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
     * Inicializa otimizações de performance
     */
    async _initPerformanceOptimizations() {
        try {
            console.log('🚀 Inicializando otimizações de performance...');

            // Inicializar profiler de performance
            if (window.performanceProfiler) {
                performanceProfiler.cleanup(); // Limpar dados antigos
            }

            // Inicializar sistema de charts otimizado
            if (window.optimizedCharts) {
                await optimizedCharts.init();
            }

            // Precarregar módulos pesados
            if (window.lazyLoader) {
                lazyLoader.preloadModules([
                    {
                        name: 'chart-advanced',
                        loader: () => lazyLoader.loadChartModule('advanced'),
                        options: { priority: 'low' },
                    },
                ]);
            }

            // Configurar limpeza automática de performance
            this._setupPerformanceCleanup();

            this._performanceOptimized = true;
            console.log('✅ Otimizações de performance inicializadas');
        } catch (error) {
            console.error('� Erro ao inicializar otimizações:', error);
            this._performanceOptimized = false;
        }
    },

    /**
     * Configura limpeza automática de dados de performance
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
                        console.warn('🧹 Muitos updates pendentes, limpando...');
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
     * Obtém relatório de performance dos charts
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
