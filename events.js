import { dom } from './dom.js';
import { ui } from './ui.js';
import {
    logic,
    updateState,
    calcularPayoffRatio,
    calcularExpectativaMatematica,
    calcularSequencias,
    calcularDrawdown,
} from './logic.js';
import { state, config, CONSTANTS } from './state.js';
import { dbManager } from './db.js';
import { Features } from './src/config/Features.js';
import { setState as setStoreState } from './state/sessionStore.js';
import { charts } from './charts.js';
import { debounce } from './src/utils/PerformanceUtils.js';
import { generateRequestId, safeLog } from './src/utils/SecurityUtils.js';
import { logger } from './src/utils/Logger.js';
import { toPercentage } from './src/utils/MathUtils.js';
import {
    timerManager,
    createManagedTimer,
    clearAllManagedTimers,
} from './src/utils/TimerManager.js';

// ============================================================================
// 🆕 CHECKPOINT 2.2b: Helper de transição para DOMManager (CONSOLIDADO)
// ============================================================================
// Importa domHelper centralizado (anteriormente duplicado em 3 arquivos)
import { domHelper } from './src/dom-helper.js';

// Cache leve para dados agregados do Dashboard, invalidado em mudanças de sessões
const dashboardAggregateCache = new Map();
const DASHBOARD_CACHE_LIMIT = 6; // pequeno para evitar crescimento
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos TTL

// Delegação para TimerManager centralizado - mantendo compatibilidade
// (As funções são importadas do TimerManager.js)

function makeDashboardCacheKey(period, mode) {
    return `${period || 'all'}|${mode || 'all'}`;
}
function getFromDashboardCache(key) {
    if (!dashboardAggregateCache.has(key)) return null;

    const entry = dashboardAggregateCache.get(key);
    const now = Date.now();

    // Verifica se o item expirou
    if (entry.timestamp + CACHE_TTL < now) {
        dashboardAggregateCache.delete(key);
        logger.debug('Cache entry expired and removed', { key, age: now - entry.timestamp });
        return null;
    }

    // Move para o fim (efeito LRU simples)
    dashboardAggregateCache.delete(key);
    dashboardAggregateCache.set(key, entry);

    logger.debug('Cache hit', { key, age: now - entry.timestamp });
    return entry.value;
}
function setInDashboardCache(key, value) {
    // Cleanup de entradas expiradas antes de adicionar nova
    const now = Date.now();
    for (const [cacheKey, entry] of dashboardAggregateCache.entries()) {
        if (entry.timestamp + CACHE_TTL < now) {
            dashboardAggregateCache.delete(cacheKey);
            logger.debug('Expired cache entry removed during cleanup', { key: cacheKey });
        }
    }

    // Aplica limite LRU se necessário
    if (dashboardAggregateCache.size >= DASHBOARD_CACHE_LIMIT) {
        const firstKey = dashboardAggregateCache.keys().next().value;
        dashboardAggregateCache.delete(firstKey);
        logger.debug('LRU cache entry evicted', { evictedKey: firstKey });
    }

    // Armazena com timestamp
    const entry = {
        value,
        timestamp: now,
    };
    dashboardAggregateCache.set(key, entry);
    logger.debug('Cache entry stored', { key, size: dashboardAggregateCache.size });
}
function invalidateDashboardCache() {
    dashboardAggregateCache.clear();
}

export const events = {
    // Exposição pública do sistema de timers (delegação para TimerManager)
    createManagedTimer: (callback, delay, description) =>
        timerManager.createTimer(callback, delay, description || 'events-module'),
    clearManagedTimer: (timerId) => timerManager.clear(timerId),
    clearAllManagedTimers: () => timerManager.clearAll(),

    /**
     * Obtém estatísticas dos timers ativos
     * @returns {Object} Estatísticas dos timers
     */
    getTimerStats() {
        return timerManager.getStats();
    },

    /**
     * Cleanup geral ao sair da aplicação
     */
    cleanup() {
        logger.info('🧹 Iniciando cleanup do módulo events...');
        timerManager.clearAll();
        invalidateDashboardCache();
        logger.info('✅ Cleanup do módulo events concluído');
    },

    init() {
        // Navegação
        if (dom.mainTabButtons) {
            dom.mainTabButtons.forEach((button) => {
                button.addEventListener('click', async () => {
                    const tabName = button.dataset.tab;
                    try {
                        // Executa a lógica assíncrona de carregamento de dados, mas não bloqueia a abertura da aba
                        await this.onTabSwitch(tabName);
                    } catch (error) {
                        logger.error('Erro ao preparar dados da aba', { error: String(error) });
                        if (typeof ui.showNotification === 'function') {
                            ui.showNotification(
                                'error',
                                'Erro ao carregar dados da aba. Exibindo conteúdo padrão.'
                            );
                        }
                    } finally {
                        // Abre a aba mesmo em caso de falha na preparação
                        ui.switchTab(tabName);
                    }
                });
            });
        }
        // Cabeçalho
        dom.settingsBtn?.addEventListener('click', () => {
            ui.updateSettingsModalVisibility();
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            dom.settingsModal && domHelper.addClass(dom.settingsModal, 'show');
        });
        dom.compactModeBtn?.addEventListener('click', () => ui.toggleCompactMode());
        dom.zenModeBtn?.addEventListener('click', () => ui.toggleZenMode());
        // Parâmetros – listeners legacy apenas se o card principal estiver ativo
        if (window.__SHOW_MAIN_PARAMETERS_CARD__ === true) {
            ['capital-inicial', 'percentual-entrada', 'stop-win-perc', 'stop-loss-perc'].forEach(
                (id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        const handler = (e) => this.handleParameterChange(e);
                        const debounced = debounce(handler, 120);
                        el.addEventListener('change', debounced);
                    }
                }
            );
        } else {
            // Garante que nenhum listener antigo interfira no fluxo da sidebar
            this.detachLegacyParameterListeners?.();
        }
        dom.estrategiaSelect?.addEventListener('change', (e) => this.handleStrategyChange(e));
        dom.payoutButtonsContainer?.addEventListener('click', (e) => this.handlePayoutChange(e));
        // Throttle para eventos de scroll/resize globais (se usados)
        if (window) {
            const onResize = () => ui.atualizarTudo();
            const onScroll = () => { };
            window.addEventListener('resize', debounce(onResize, 150));
            window.addEventListener('scroll', debounce(onScroll, 100));
        }
        // Ações da tabela
        dom.tabelaBody?.addEventListener('click', (e) => this.handleTableActions(e));
        // Controles de sessão
        dom.undoBtn?.addEventListener('click', () => logic.desfazerOperacao());
        dom.finishSessionBtn?.addEventListener('click', () => this.handleFinishSession());
        dom.newSessionBtn?.addEventListener('click', () => this.handleNewSession());
        // Modal de tags
        dom.tagsContainer?.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON')
                logic.finalizarRegistroOperacao(e.target.textContent);
        });
        dom.skipTagBtn?.addEventListener('click', () => logic.finalizarRegistroOperacao(''));
        // Modal de modo de sessão
        dom.startOfficialSessionBtn?.addEventListener('click', () =>
            this.startNewSession(CONSTANTS.SESSION_MODE.OFFICIAL)
        );
        dom.startSimulationSessionBtn?.addEventListener('click', () =>
            this.startNewSession(CONSTANTS.SESSION_MODE.SIMULATION)
        );
        // Diário
        dom.diarioFilterButtons?.addEventListener('click', (e) => this.handleDiarioFilter(e));
        dom.tabelaHistoricoBody?.addEventListener('click', (e) => this.handleDiarioTableActions(e));
        dom.closeReplayBtn?.addEventListener('click', () =>
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            dom.replayModal && domHelper.removeClass(dom.replayModal, 'show')
        );

        // 🔄 Reagir a edições de sessão (ex.: alteração de W/L no replay)
        document.addEventListener('sessionEdited', async (e) => {
            try {
                // Re-render Diário com o filtro atual
                const activeFilterBtn = dom.diarioFilterButtons?.querySelector('.active');
                const currentFilter = activeFilterBtn?.dataset?.filter || 'todas';
                await ui.renderDiario(currentFilter);
                // Atualizar agregados globais se presentes
                try { invalidateDashboardCache(); } catch (_) { }
                await this.handleGlobalFilterChange();
            } catch (err) {
                logger.error('Erro ao sincronizar Diário após edição de sessão', { error: String(err) });
            }
        });
        // Timeline
        dom.timelineContainer?.addEventListener('click', (e) => this.handleTimelineClick(e));
        dom.replayTimelineContainer?.addEventListener('click', (e) =>
            this.handleTimelineClick(e, true)
        );
        dom.timelineFilters?.addEventListener('click', (e) => this.handleTimelineFilter(e));
        // Laboratório de Risco e PDF
        dom.openLabBtn?.addEventListener('click', () => this.handleOpenLab());
        dom.closeLabBtn?.addEventListener('click', () =>
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            dom.riskLabModal && domHelper.removeClass(dom.riskLabModal, 'show')
        );
        dom.runSimulationBtn?.addEventListener('click', () => this.handleRunSimulation());
        dom.generatePdfBtn?.addEventListener('click', () => ui.gerarPDF());
        // Filtros Globais
        dom.dashboardPeriodFilters?.addEventListener('click', (e) =>
            this.handleGlobalFilterChange(e, 'period')
        );
        dom.dashboardModeFilters?.addEventListener('click', (e) =>
            this.handleGlobalFilterChange(e, 'mode')
        );
        // Análise Estratégica
        dom.analiseDimensionSelect?.addEventListener('change', () =>
            this.handleAnalysisDimensionChange()
        );
        // Otimizador de Metas
        dom.runGoalSimulationBtn?.addEventListener('click', () => this.handleRunGoalSimulation());
        dom.runCapitalCurveAnalysisBtn?.addEventListener('click', () =>
            this.handleRunCapitalCurveAnalysis()
        );

        // Testes Automáticos
        dom.runAllTestsBtn?.addEventListener('click', () => this.handleRunAllTests());
        dom.runLogicTestsBtn?.addEventListener('click', () => this.handleRunSpecificTests('logic'));
        dom.runUITestsBtn?.addEventListener('click', () => this.handleRunSpecificTests('ui'));
        dom.runDBTestsBtn?.addEventListener('click', () => this.handleRunSpecificTests('db'));
        dom.runSimulationTestsBtn?.addEventListener('click', () =>
            this.handleRunSpecificTests('simulation')
        );

        // Configurações
        this.setupSettingsListeners();
    },

    /**
     * Remove de forma segura quaisquer listeners antigos do card principal (se presentes)
     * sem afetar o card da sidebar.
     */
    detachLegacyParameterListeners() {
        try {
            const ids = ['capital-inicial', 'percentual-entrada', 'stop-win-perc', 'stop-loss-perc'];
            ids.forEach((id) => {
                const el = document.getElementById(id);
                if (el) {
                    const clone = el.cloneNode(true);
                    el.parentNode.replaceChild(clone, el);
                }
            });
        } catch (_) { }
    },

    async onTabSwitch(tabName) {
        try {
            if (tabName === 'dashboard') {
                await this.handleGlobalFilterChange();
            } else if (tabName === 'diario') {
                if (dom.diarioFilterButtons) {
                    const activeFilter = dom.diarioFilterButtons.querySelector('.active');
                    await ui.renderDiario(activeFilter ? activeFilter.dataset.filter : 'todas');
                }
            } else if (tabName === 'analise') {
                await this.handleAnalysisDimensionChange();
            }
        } catch (error) {
            logger.error('Erro no onTabSwitch', { error: String(error) });
        }
    },

    handleMetaAtingida(tipoMeta) {
        if (config.autoBloqueio) {
            this.handleFinishSession(true); // Finaliza a sessão sem perguntar
            const fim = Date.now() + config.duracaoBloqueio * 60 * 60 * 1000;
            localStorage.setItem('gerenciadorProLockdownEnd', fim);
            localStorage.setItem('gerenciadorProLockdownType', tipoMeta); // Guardar o tipo de meta
            ui.iniciarBloqueio(fim, tipoMeta);
        } else {
            ui.showModal({
                title: 'Meta Atingida!',
                message: `Você atingiu sua meta de ${tipoMeta === 'win' ? 'ganhos' : 'perdas'}. A disciplina recomenda finalizar a sessão agora para proteger seus resultados. Deseja continuar?`,
                confirmText: 'Finalizar Sessão',
                cancelText: 'Continuar',
                onConfirm: () => this.handleFinishSession(),
                onCancel: () => {
                    updateState({ metaAtingida: false });
                    ui.atualizarTudo();
                },
            });
        }
    },

    setupSettingsListeners() {
        if (dom.settingsTabButtons)
            dom.settingsTabButtons.forEach((button) =>
                button?.addEventListener('click', () => ui.switchSettingsTab(button.dataset.tab))
            );
        dom.closeSettingsBtn?.addEventListener('click', () => {
            logic.saveActiveSession(); // Salva o estado ativo ao fechar
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            dom.settingsModal && domHelper.removeClass(dom.settingsModal, 'show');
            ui.mostrarInsightPopup('Configurações guardadas com sucesso!', '⚙️');
        });

        const settingsUpdater = (newState) => {
            const needsRecalculation = updateState(newState);
            if (needsRecalculation) {
                logic.updateCalculatedValues();
                logic.calcularPlano(true);
            }
            ui.syncUIFromState();
            ui.atualizarTudo();
        };

        dom.modalModoGuiadoToggle?.addEventListener('change', (e) =>
            settingsUpdater({ modoGuiado: e.target.checked })
        );
        dom.modalIncorporarLucroToggle?.addEventListener('change', (e) =>
            settingsUpdater({ incorporarLucros: e.target.checked })
        );
        dom.autoLockToggle?.addEventListener('change', (e) =>
            settingsUpdater({ autoBloqueio: e.target.checked })
        );
        dom.lockDurationSelect?.addEventListener('change', (e) =>
            settingsUpdater({ duracaoBloqueio: parseInt(e.target.value) })
        );
        dom.divisorRecuperacaoSlider?.addEventListener('input', (e) =>
            ui.updateRecoverySplitDisplay(e.target.value)
        );
        dom.divisorRecuperacaoSlider?.addEventListener('change', (e) =>
            settingsUpdater({ divisorRecuperacao: parseFloat(e.target.value) })
        );
        dom.recoverySliderMinus?.addEventListener('click', () => {
            if (dom.divisorRecuperacaoSlider) {
                dom.divisorRecuperacaoSlider.stepDown();
                dom.divisorRecuperacaoSlider.dispatchEvent(new Event('input'));
                dom.divisorRecuperacaoSlider.dispatchEvent(new Event('change'));
            }
        });
        dom.recoverySliderPlus?.addEventListener('click', () => {
            if (dom.divisorRecuperacaoSlider) {
                dom.divisorRecuperacaoSlider.stepUp();
                dom.divisorRecuperacaoSlider.dispatchEvent(new Event('input'));
                dom.divisorRecuperacaoSlider.dispatchEvent(new Event('change'));
            }
        });
        dom.traderNameInput?.addEventListener('change', (e) =>
            settingsUpdater({ traderName: e.target.value })
        );
        dom.modalThemeSelector?.addEventListener('click', (e) => {
            const card = e.target.closest('.theme-card');
            if (card) settingsUpdater({ tema: card.dataset.theme });
        });
        dom.modalNotificationsToggle?.addEventListener('change', (e) =>
            settingsUpdater({ notificacoesAtivas: e.target.checked })
        );
    },

    startNewSession(mode) {
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (dom.sessionModeModal) domHelper.removeClass(dom.sessionModeModal, 'show');
        if (dom.container) dom.container.style.filter = 'none';
        // Guarda: impedir nova sessão enquanto há sessão ativa (a menos que force)
        if (
            window.state?.isSessionActive &&
            !window.__finishingSession &&
            !window.__forceNewSession
        ) {
            try {
                ui.mostrarInsightPopup?.('Sessão já ativa. Finalize antes de iniciar outra.', '⚠️');
            } catch (e) { }
            console.warn('[GUARDA] Nova sessão ignorada: sessão ativa');
            return;
        }
        logic.startNewSession(mode);
    },

    handleParameterChange(event) {
        const input = event.target;
        const key = input.id.replace(/-(\w)/g, (m, g) => g.toUpperCase());
        let value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        // Validação mais robusta
        if (isNaN(value)) {
            value = min || 0;
            input.value = value;
        } else if (min !== undefined && value < min) {
            value = min;
            input.value = value;
        } else if (max !== undefined && value > max) {
            value = max;
            input.value = value;
        }

        // Aplicação imediata (sem botão "Aplicar")
        const needsRecalculation = updateState({ [key]: value });
        if (needsRecalculation) {
            logic.updateCalculatedValues();
            logic.calcularPlano(true);
        }
        ui.syncUIFromState();
        ui.atualizarTudo();

        // Se store estiver ativa, refletir mudanças de config relevantes
        try {
            if (
                ((window.Features && window.Features.FEATURE_store_pubsub) ||
                    Features.FEATURE_store_pubsub) &&
                (key === 'capitalInicial' || key === 'stopWinPerc' || key === 'stopLossPerc')
            ) {
                setStoreState({
                    capitalInicial: config.capitalInicial,
                    stopWinPerc: config.stopWinPerc,
                    stopLossPerc: config.stopLossPerc,
                });
            }
        } catch (_) { }

        // Feedback visual de aplicação automática
        this.showAutoApplyFeedback(input);
    },

    // Função de feedback visual
    showAutoApplyFeedback(element) {
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        domHelper.addClass(element, 'auto-applied');
        // Usa timer gerenciado para evitar vazamentos
        createManagedTimer(
            () => {
                if (element && element.classList) {
                    // 🆕 CHECKPOINT 2.2b: Usando domHelper
                    domHelper.removeClass(element, 'auto-applied');
                }
            },
            800,
            'auto-apply-feedback'
        );
    },

    handleStrategyChange(e) {
        // Aplicação imediata
        const needsRecalculation = updateState({ estrategiaAtiva: e.target.value });
        if (needsRecalculation) {
            logic.calcularPlano(true);
        }
        ui.atualizarTudo();

        // Feedback visual de aplicação automática
        this.showAutoApplyFeedback(e.target);
    },

    handlePayoutChange(e) {
        if (e.target.tagName === 'BUTTON') {
            const newPayout = parseInt(e.target.textContent);

            // Aplicação imediata
            const needsRecalculation = updateState({ payout: newPayout });
            if (needsRecalculation) {
                logic.calcularPlano(true);
            }
            ui.atualizarTudo();

            // Atualização visual imediata
            if (dom.payoutButtonsContainer) {
                dom.payoutButtonsContainer
                    .querySelector('.active-payout')
                    // 🆕 CHECKPOINT 2.2b: Usando domHelper
                    ?.classList.remove('active-payout');
            }
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            domHelper.addClass(e.target, 'active-payout');

            // Feedback visual de aplicação automática
            this.showAutoApplyFeedback(e.target);
        }
    },

    handleTableActions(e) {
        const button = e.target.closest('button');
        if (!button || button.closest('.linha-desabilitada')) return;

        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (domHelper.hasClass(button, 'wl-btn')) {
            const dataIndex =
                config.estrategiaAtiva === CONSTANTS.STRATEGY.FIXED
                    ? 0
                    : parseInt(button.dataset.index);
            const dataAporte = parseInt(button.dataset.aporte);
            logic.iniciarRegistroOperacao({
                // 🆕 CHECKPOINT 2.2b: Usando domHelper
                isWin: domHelper.hasClass(button, 'win-btn-linha'),
                index: dataIndex,
                aporte: dataAporte,
            });
        }

        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (domHelper.hasClass(button, 'copy-btn')) {
            const etapa = state.planoDeOperacoes[button.dataset.index];
            if (!etapa) return;
            const valor =
                button.dataset.aporte == 1 ? etapa.entrada1 || etapa.entrada : etapa.entrada2;
            const valorFormatado = valor.toFixed(2);

            navigator.clipboard
                .writeText(valorFormatado)
                .then(() => {
                    button.textContent = '✔️';
                    createManagedTimer(
                        () => {
                            if (button) button.textContent = '📋';
                        },
                        1500,
                        'clipboard-success-feedback'
                    );
                })
                .catch((err) => {
                    logger.error('Falha ao copiar para a área de transferência', {
                        error: String(err),
                    });
                    button.textContent = 'ERRO';
                    createManagedTimer(
                        () => {
                            if (button) button.textContent = '📋';
                        },
                        2000,
                        'clipboard-error-feedback'
                    );
                });
        }
    },

    async handleFinishSession(isAutomatic = false) {
        // Sinalizar fluxo de finalização para sistemas defensivos e UI
        window.__finishingSession = true;
        window.__suppressPersistedTimeline = true;
        if (state.historicoCombinado.length > 0 && !isAutomatic) {
            const sessaoParaSalvar = {
                data: Date.now(),
                modo: state.sessionMode,
                resultadoFinanceiro: state.capitalAtual - state.capitalInicioSessao,
                totalOperacoes: state.historicoCombinado.length,
                historicoCombinado: state.historicoCombinado,
                capitalInicial: state.capitalInicioSessao,
            };
            try {
                const requestId = generateRequestId('sess_add');
                sessaoParaSalvar.requestId = requestId;
                logger.withRequest(requestId).info('UI:FinalizarSessao:add');
                await dbManager.addSession(sessaoParaSalvar);
                invalidateDashboardCache();
                ui.mostrarInsightPopup('Sessão arquivada com sucesso!', '🗄️');
            } catch (error) {
                logger.error('Erro ao salvar sessão', { error: String(error) });
                ui.showModal({
                    title: 'Erro de Armazenamento',
                    message: 'Não foi possível arquivar a sessão.',
                });
            }
        }
        // Aguarda reset completo da sessão antes de atualizar a UI
        await logic.resetSessionState();
        // Limpa timeline independente e sincroniza botões
        try {
            window.timelineNovo?.limparTudo?.();
        } catch (e) { }
        ui.syncUIFromState?.();
        ui.atualizarVisibilidadeBotoesSessao?.();
        await this.handleGlobalFilterChange();
        await ui.renderDiario();
        ui.switchTab('diario');
        // Encerrar sinalização
        window.__finishingSession = false;
    },

    handleNewSession(options) {
        // Reabilitar carregamento normal ao iniciar nova sessão
        window.__suppressPersistedTimeline = false;
        const auto = (options && options.auto === true) || window.__autoStartSession === true;
        const mode =
            (options && options.mode) || state.sessionMode || CONSTANTS.SESSION_MODE.OFFICIAL;
        // Se solicitado modo automático (chamadas programáticas/console), inicia diretamente
        if (auto) {
            // Guarda: impedir auto start com sessão ativa (a menos que force)
            const force = (options && options.force === true) || window.__forceNewSession === true;
            if (window.state?.isSessionActive && !window.__finishingSession && !force) {
                try {
                    ui.mostrarInsightPopup?.(
                        'Sessão já ativa. Finalize antes de iniciar outra.',
                        '⚠️'
                    );
                } catch (e) { }
                console.warn('[GUARDA] Auto nova sessão ignorada: sessão ativa');
                return;
            }
            try {
                logic.startNewSession(mode);
            } catch (e) { }
            try {
                ui.syncUIFromState?.();
            } catch (e) { }
            try {
                ui.atualizarVisibilidadeBotoesSessao?.();
            } catch (e) { }
            try {
                ui.atualizarTudo?.();
            } catch (e) { }
            return;
        }
        // Fluxo padrão: exibir modal para escolha do modo
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (dom.sessionModeModal) domHelper.addClass(dom.sessionModeModal, 'show');
    },

    /**
     * Inicia nova sessão imediatamente (atalho programático)
     */
    async quickNewSession(mode = CONSTANTS.SESSION_MODE.OFFICIAL) {
        window.__suppressPersistedTimeline = false;
        // Guarda: impedir quick start com sessão ativa (a menos que force)
        if (
            window.state?.isSessionActive &&
            !window.__finishingSession &&
            !window.__forceNewSession
        ) {
            try {
                ui.mostrarInsightPopup?.('Sessão já ativa. Finalize antes de iniciar outra.', '⚠️');
            } catch (e) { }
            console.warn('[GUARDA] Quick nova sessão ignorada: sessão ativa');
            return;
        }
        await logic.startNewSession(mode);
        try {
            ui.syncUIFromState?.();
        } catch (e) { }
        try {
            ui.atualizarVisibilidadeBotoesSessao?.();
        } catch (e) { }
        try {
            ui.atualizarTudo?.();
        } catch (e) { }
    },

    handleDiarioTableActions(e) {
        const detailsButton = e.target.closest('.details-btn');
        if (detailsButton) {
            const sessionId = parseInt(detailsButton.dataset.sessionId);
            if (sessionId && !isNaN(sessionId)) {
                ui.showReplayModal(sessionId);
            } else {
                logger.error('ID da sessão inválido', {
                    sessionId: detailsButton.dataset.sessionId,
                });
            }
            return;
        }
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const sessionId = parseInt(deleteButton.dataset.sessionId);
            if (sessionId && !isNaN(sessionId)) {
                this.handleDeleteSession(sessionId);
            } else {
                logger.error('ID da sessão inválido para exclusão', {
                    sessionId: deleteButton.dataset.sessionId,
                });
                ui.showModal({
                    title: 'Erro',
                    message: 'ID da sessão inválido. Não é possível excluir.',
                });
            }
        }
    },

    handleTimelineClick(e, isReplay = false) {
        const editButton = e.target.closest('.edit-op-btn');
        if (editButton) {
            e.stopPropagation();
            const timelineItem = editButton.closest('.timeline-item');
            if (timelineItem) {
                const contentDiv = timelineItem.querySelector('.timeline-content');
                if (contentDiv) {
                    const opIndex = parseInt(timelineItem.dataset.opIndex);
                    const sessionId = isReplay
                        ? parseInt(timelineItem.closest('.modal-content').dataset.sessionId || '0')
                        : null;
                    ui.showEditPanel(opIndex, contentDiv, isReplay, sessionId);
                }
            }
        }
    },

    handleTimelineFilter(e) {
        const button = e.target.closest('button');
        if (!button || !dom.timelineFilters) return;
        const activeButton = dom.timelineFilters.querySelector('.active');
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (activeButton) domHelper.removeClass(activeButton, 'active');
        domHelper.addClass(button, 'active');
        state.filtroTimeline = button.dataset.filter;
        // 🛡️ CORREÇÃO CRÍTICA: Usar histórico atual em vez de renderização vazia
        ui.renderizarTimelineCompleta(state.historicoCombinado, dom.timelineContainer);
    },

    handleDeleteSession(sessionId) {
        const row = document.querySelector(`tr[data-session-id="${sessionId}"]`);
        const dateString = row ? row.cells[0].textContent : `ID ${sessionId}`;
        ui.showModal({
            title: 'Confirmar Exclusão',
            message: `Tem a certeza que deseja excluir permanentemente a sessão de ${dateString}? Esta ação não pode ser revertida.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    // Validar sessionId antes de tentar excluir
                    if (!sessionId || sessionId === 0 || isNaN(sessionId)) {
                        throw new Error('ID da sessão inválido');
                    }

                    // Soft delete: mover para lixeira usando sistema profissional
                    const session = await dbManager.getSessionById(sessionId);
                    if (session && window.trashManager) {
                        const trashId = window.trashManager.moveToTrash(
                            session,
                            window.trashManager.categories.SESSION,
                            window.trashManager.complexityLevels.COMPLEX
                        );

                        if (trashId) {
                            // Remove da base de dados após mover para lixeira
                            await dbManager.deleteSession(sessionId, { requestId: generateRequestId('sess_del_after_trash') });
                            invalidateDashboardCache();
                            ui.mostrarInsightPopup('Sessão movida para lixeira.', '🗑️');
                        } else {
                            throw new Error('Falha ao mover sessão para lixeira');
                        }
                    } else {
                        throw new Error('Sessão não encontrada ou TrashManager não disponível');
                    }
                    if (dom.diarioFilterButtons) {
                        const activeFilter = dom.diarioFilterButtons.querySelector('.active');
                        ui.renderDiario(activeFilter ? activeFilter.dataset.filter : 'todas');
                    }
                    this.handleGlobalFilterChange();
                } catch (error) {
                    logger.error('Erro ao excluir sessão', { error: String(error) });
                    ui.showModal({
                        title: 'Erro',
                        message: `Não foi possível excluir a sessão: ${error.message}`,
                    });
                }
            },
        });
    },

    handleDiarioFilter(e) {
        if (e.target.tagName === 'BUTTON' && dom.diarioFilterButtons) {
            const activeButton = dom.diarioFilterButtons.querySelector('.active');
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            if (activeButton) domHelper.removeClass(activeButton, 'active');
            domHelper.addClass(e.target, 'active');
            ui.renderDiario(e.target.dataset.filter);
        }
    },

    handleOpenLab() {
        const data = state.lastAggregatedData;
        if (!data || data.historico.length < 10) {
            ui.showModal({
                title: 'Dados Insuficientes',
                message:
                    'É necessário um histórico de pelo menos 10 operações no período filtrado para usar o Laboratório de Risco.',
            });
            return;
        }
        const wins = data.historico.filter(
            (op) => op && typeof op === 'object' && op.hasOwnProperty('isWin') && op.isWin
        ).length;
        const winRate = data.historico.length > 0 ? wins / data.historico.length : 0;
        const payouts = data.historico
            .filter((op) => op && typeof op === 'object' && op.hasOwnProperty('payout'))
            .map((op) => op.payout);
        const payoutMedio =
            payouts.length > 0 ? payouts.reduce((a, b) => a + b, 0) / payouts.length : 0;
        if (dom.simWinrate) dom.simWinrate.value = `${toPercentage(winRate).toFixed(2)}%`;
        if (dom.simPayout) dom.simPayout.value = `${payoutMedio.toFixed(0)}%`;
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (dom.simulationResults) domHelper.addClass(dom.simulationResults, 'hidden');
        if (dom.riskLabModal) domHelper.addClass(dom.riskLabModal, 'show');
    },

    handleRunSimulation() {
        const btn = dom.runSimulationBtn;
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = 'A simular...';
        if (dom.simulationProgressContainer)
            // 🆕 CHECKPOINT 2.2b: Usando domHelper
            domHelper.removeClass(dom.simulationProgressContainer, 'hidden');
        if (dom.simulationProgressBar) dom.simulationProgressBar.style.width = '0%';

        createManagedTimer(
            () => {
                try {
                    const capitalInicialSimulacao =
                        state.lastAggregatedData?.capitalInicial || config.capitalInicial;
                    const stopWinValorSimulacao =
                        capitalInicialSimulacao * (config.stopWinPerc / 100);
                    const stopLossValorSimulacao =
                        capitalInicialSimulacao * (config.stopLossPerc / 100);

                    const results = simulation.runMonteCarlo({
                        numSimulations: parseInt(dom.simNumSimulations?.value || '1000'),
                        maxOpsPerDay: parseInt(dom.simMaxOps?.value || '50'),
                        winRate: parseFloat(dom.simWinrate?.value) / 100,
                        payout: parseFloat(dom.simPayout?.value) / 100,
                        initialCapital: capitalInicialSimulacao,
                        entryPercentage: config.percentualEntrada / 100,
                        stopWin: stopWinValorSimulacao,
                        stopLoss: stopLossValorSimulacao,
                        strategy: config.estrategiaAtiva,
                        recoveryDivisor: config.divisorRecuperacao / 100,
                        onProgress: (progress) => {
                            if (dom.simulationProgressBar)
                                dom.simulationProgressBar.style.width = `${toPercentage(progress)}%`;
                        },
                    });

                    if (dom.simProbWin)
                        dom.simProbWin.textContent = `${toPercentage(results.winProbability).toFixed(2)}%`;
                    if (dom.simProbLoss)
                        dom.simProbLoss.textContent = `${toPercentage(results.lossProbability).toFixed(2)}%`;
                    if (dom.simAvgResult)
                        dom.simAvgResult.textContent = ui.formatarMoeda(results.averageResult);
                    if (dom.simAvgResult)
                        dom.simAvgResult.className =
                            results.averageResult >= 0 ? 'positive' : 'negative';
                    if (dom.simMaxDrawdown)
                        dom.simMaxDrawdown.textContent = ui.formatarMoeda(results.maxDrawdown);
                    if (dom.simulationInsight) dom.simulationInsight.textContent = results.insight;
                    // 🆕 CHECKPOINT 2.2b: Usando domHelper
                    if (dom.simulationResults) domHelper.removeClass(dom.simulationResults, 'hidden');
                    if (dom.simulationProgressContainer)
                        domHelper.addClass(dom.simulationProgressContainer, 'hidden');
                } catch (error) {
                    logger.error('Erro na simulação', { error: String(error) });
                    ui.showModal({
                        title: 'Erro na Simulação',
                        message:
                            'Ocorreu um erro durante a simulação. Verifique os parâmetros e tente novamente.',
                    });
                }

                btn.disabled = false;
                btn.textContent = 'Executar Simulação';
            },
            100,
            'monte-carlo-simulation'
        );
    },

    async handleGlobalFilterChange(e, filterType) {
        if (e && e.target) {
            const button = e.target.closest('button');
            if (!button) return;
            const value = button.dataset[filterType];
            const stateKey = `dashboardFilter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;

            // 🆕 CHECKPOINT 1.3b: Usando StateManager
            if (window.stateManager) {
                window.stateManager.setState({ [stateKey]: value }, `events.handleGlobalFilterChange:${filterType}`);
            } else {
                state[stateKey] = value;
            }

            localStorage.setItem(`gerenciadorPro${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}`, JSON.stringify(value));
            ui.syncUIFromState();
        }

        const cacheKey = makeDashboardCacheKey(
            state.dashboardFilterPeriod,
            state.dashboardFilterMode
        );
        let aggregatedData = getFromDashboardCache(cacheKey);
        if (!aggregatedData) {
            const allSessions = await dbManager.getAllSessions();
            // Filtrar sessões por período e modo (substituindo analysis.filterSessions)
            const filteredSessions = allSessions.filter(session => {
                // Filtro de modo
                if (state.dashboardFilterMode && state.dashboardFilterMode !== 'todas' && state.dashboardFilterMode !== 'all') {
                    if (session.modo !== state.dashboardFilterMode) return false;
                }

                // Filtro de período
                if (state.dashboardFilterPeriod && state.dashboardFilterPeriod !== 'todas' && state.dashboardFilterPeriod !== 'all') {
                    const sessionDate = new Date(session.data);
                    const now = new Date();

                    switch (state.dashboardFilterPeriod) {
                        case 'hoje':
                            if (sessionDate.toDateString() !== now.toDateString()) return false;
                            break;
                        case 'semana':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            if (sessionDate < weekAgo) return false;
                            break;
                        case 'mes':
                            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            if (sessionDate < monthAgo) return false;
                            break;
                    }
                }

                return true;
            });
            aggregatedData = {
                historico: filteredSessions
                    .flatMap((s) => s.historicoCombinado || [])
                    .filter((op) => op && typeof op === 'object'),
                fullSessions: filteredSessions,
                capitalInicial:
                    filteredSessions.length > 0 ? filteredSessions[0].capitalInicial : 0,
                resultadoFinanceiro: filteredSessions.reduce(
                    (acc, s) =>
                        acc +
                        (typeof s.resultadoFinanceiro === 'number' && !isNaN(s.resultadoFinanceiro)
                            ? s.resultadoFinanceiro
                            : 0),
                    0
                ),
                totalOperacoes: filteredSessions.reduce(
                    (acc, s) =>
                        acc +
                        (typeof s.totalOperacoes === 'number' && !isNaN(s.totalOperacoes)
                            ? s.totalOperacoes
                            : 0),
                    0
                ),
                totalSessoes: filteredSessions.length,
            };
            setInDashboardCache(cacheKey, aggregatedData);
        }
        state.lastAggregatedData = aggregatedData;
        await this.renderGlobalDashboard(aggregatedData);
        const analiseContent = dom.analiseContent;
        // 🆕 CHECKPOINT 2.2b: Usando domHelper
        if (analiseContent && domHelper.hasClass(analiseContent, 'active')) {
            this.handleAnalysisDimensionChange();
        }
    },

    async renderGlobalDashboard(data) {
        return new Promise((resolve) => {
            const { historico, capitalInicial, resultadoFinanceiro, totalOperacoes, totalSessoes } =
                data;
            const grid = dom.dashboardStatsGrid;
            if (!grid) return resolve();

            const periodText =
                dom.dashboardPeriodFilters?.querySelector('.active')?.textContent || '';
            const modeText = dom.dashboardModeFilters?.querySelector('.active')?.textContent || '';
            if (dom.dashboardStatsTitle)
                dom.dashboardStatsTitle.textContent = `Estatísticas (${periodText} - ${modeText})`;

            if (historico.length === 0) {
                grid.innerHTML =
                    '<p class="empty-state-message">Nenhuma operação registada no período selecionado.</p>';
                charts.updateGlobal({ historico: [], capitalInicial: 0 }); // Limpa os gráficos
                const tagBody = dom.dashboardTagDiagnosticsBody;
                if (tagBody)
                    tagBody.innerHTML =
                        '<tr><td colspan="4" class="empty-state-message">Nenhum dado de tag disponível.</td></tr>';
                return resolve();
            }

            grid.innerHTML = '';

            const wins = historico.filter(
                (op) => op && typeof op === 'object' && op.hasOwnProperty('isWin') && op.isWin
            ).length;
            const assertividade = totalOperacoes > 0 ? wins / totalOperacoes : 0;
            const payoff = calcularPayoffRatio(historico);
            const evResult = calcularExpectativaMatematica(historico);
            const { maxWins, maxLosses } = calcularSequencias(historico);
            const drawdown = calcularDrawdown(historico, capitalInicial);
            const payouts = historico
                .filter((op) => op && typeof op === 'object' && op.hasOwnProperty('payout'))
                .map((op) => op.payout);
            const payoutMedio =
                payouts.length > 0 ? payouts.reduce((a, b) => a + b, 0) / payouts.length : 0;

            const stats = [
                {
                    label: 'Resultado Total',
                    value: ui._formatarMoedaInternal(resultadoFinanceiro),
                    class: resultadoFinanceiro >= 0 ? 'positive' : 'negative',
                },
                { label: 'Assertividade', value: `${(assertividade * 100).toFixed(1)}%` },
                { label: 'Payoff Ratio', value: isFinite(payoff) ? payoff.toFixed(2) : '--' },
                {
                    label: 'Expectativa (EV)',
                    value: evResult.ev !== null ? ui._formatarMoedaInternal(evResult.ev) : '--',
                    class: evResult.class,
                },
                { label: 'Nº de Operações', value: totalOperacoes },
                { label: 'Nº de Sessões', value: totalSessoes },
                { label: 'Seq. de Vitórias', value: maxWins },
                { label: 'Seq. de Derrotas', value: maxLosses },
                {
                    label: 'Drawdown Máximo',
                    value: ui._formatarMoedaInternal(-Math.abs(drawdown)),
                    class: 'negative',
                },
                { label: 'Payout Médio', value: `${payoutMedio.toFixed(0)}%` },
            ];

            stats.forEach((stat) => {
                const card = document.createElement('div');
                card.className = 'stat-card';
                card.innerHTML = `<h4>${stat.label}</h4><p class="${stat.class || ''}">${config.zenMode ? '---' : stat.value}</p>`;
                grid.appendChild(card);
            });

            ui.renderTagDiagnostics(historico, dom.dashboardTagDiagnosticsBody);
            if (charts && typeof charts.updateGlobal === 'function') {
                charts.updateGlobal(data);
            } else {
                // Fallback: atualizar apenas os gráficos presentes
                if (charts && charts.dashboardAssertividadeChart && data.historico) {
                    charts.updateAssertividadeChart(
                        data.historico.map((op) => ({ resultado: op.isWin ? 'win' : 'loss' })),
                        charts.dashboardAssertividadeChart
                    );
                }
                if (charts && charts.dashboardPatrimonioChart) {
                    charts.updatePatrimonioChart(
                        data.historico,
                        data.capitalInicial,
                        charts.dashboardPatrimonioChart,
                        true
                    );
                }
            }

            // A "Promessa" garante que o código que chama esta função espere
            // um pequeno instante para que o navegador possa "respirar" e renderizar a DOM.
            createManagedTimer(() => resolve(), 50, 'dashboard-render-breathing-room');
        });
    },

    async handleAnalysisDimensionChange() {
        if (!dom.analiseDimensionSelect) return;
        const dimension = dom.analiseDimensionSelect.value;
        const data = state.lastAggregatedData;
        if (!data || !data.fullSessions || data.fullSessions.length === 0) {
            ui.renderAnalysisResults({ data: [], insight: 'Não há dados suficientes.' }, dimension);
            return;
        }
        const processedData = analysis.processData(data.fullSessions, dimension);
        ui.renderAnalysisResults(processedData, dimension);
    },

    handleRunGoalSimulation() {
        const data = state.lastAggregatedData;
        const sw = parseFloat(dom.optimizerStopWin?.value) || 0;
        const sl = parseFloat(dom.optimizerStopLoss?.value) || 0;

        // Validação dos inputs
        if (isNaN(sw) || isNaN(sl) || sw <= 0 || sl <= 0) {
            ui.showModal({
                title: 'Valores Inválidos',
                message:
                    'Por favor, insira valores válidos para Stop Win e Stop Loss (maiores que 0).',
            });
            return;
        }

        if (!data || !data.fullSessions || data.fullSessions.length === 0) {
            ui.showModal({
                title: 'Dados Insuficientes',
                message:
                    'É necessário um histórico de sessões no período filtrado para usar o Otimizador de Metas.',
            });
            return;
        }

        if (data.totalOperacoes < 20) {
            ui.showModal({
                title: 'Aviso de Confiabilidade',
                message: `O seu histórico filtrado contém apenas ${data.totalOperacoes} operações. Recomenda-se um mínimo de 20 para resultados mais confiáveis. Deseja continuar mesmo assim?`,
                confirmText: 'Continuar',
                cancelText: 'Cancelar',
                onConfirm: () => analysis.runGoalOptimization(sw, sl),
            });
        } else {
            analysis.runGoalOptimization(sw, sl);
        }
    },

    handleRunCapitalCurveAnalysis() {
        const data = state.lastAggregatedData;
        if (!data || !data.fullSessions || data.fullSessions.length === 0) {
            ui.showModal({
                title: 'Dados Insuficientes',
                message:
                    'É necessário um histórico de sessões no período filtrado para usar esta ferramenta.',
            });
            return;
        }

        // Verificação adicional para garantir que os dados são válidos
        const validSessions = data.fullSessions.filter(
            (session) =>
                session && session.historicoCombinado && Array.isArray(session.historicoCombinado)
        );

        if (validSessions.length === 0) {
            ui.showModal({
                title: 'Dados Inválidos',
                message: 'Os dados das sessões não estão no formato esperado.',
            });
            return;
        }

        analysis.analyzeCapitalCurve(validSessions);
    },

    // Métodos para Testes Automáticos
    async handleRunAllTests() {
        try {
            console.log('🧪 Iniciando execução de todos os testes...');

            // Aguardar que todos os módulos estejam carregados
            await this.waitForModules();

            // Verificar se testRunner existe
            if (!window.testRunner) {
                throw new Error('TestRunner não está disponível');
            }

            await window.testRunner.runAllTests();
            ui.mostrarInsightPopup(
                'Todos os testes foram executados! Verifique os resultados.',
                '🧪'
            );
        } catch (error) {
            logger.error('Erro ao executar testes', { error: String(error) });
            ui.showModal({
                title: 'Erro nos Testes',
                message: `Ocorreu um erro ao executar os testes automáticos: ${error.message}`,
            });
        }
    },

    // Função para aguardar que todos os módulos estejam disponíveis
    async waitForModules() {
        const maxAttempts = 50; // 5 segundos máximo
        let attempts = 0;

        console.log('⏳ Aguardando carregamento dos módulos...');

        while (attempts < maxAttempts) {
            const moduleStatus = {
                logic: !!window.logic,
                state: !!window.state,
                ui: !!window.ui,
                charts: !!window.charts,
                simulation: !!window.simulation,
                analysis: !!window.analysis,
                dbManager: !!window.dbManager,
                testRunner: !!window.testRunner,
            };

            const allLoaded = Object.values(moduleStatus).every((loaded) => loaded);

            if (allLoaded) {
                console.log('✅ Todos os módulos carregados!');
                return;
            }

            if (attempts % 10 === 0) {
                // Log a cada 1 segundo
                console.log('📊 Status dos módulos:', moduleStatus);
            }

            await new Promise((resolve) => createManagedTimer(resolve, 100, 'module-loading-wait'));
            attempts++;
        }

        // Status final em caso de timeout
        const finalStatus = {
            logic: !!window.logic,
            state: !!window.state,
            ui: !!window.ui,
            charts: !!window.charts,
            simulation: !!window.simulation,
            analysis: !!window.analysis,
            dbManager: !!window.dbManager,
            testRunner: !!window.testRunner,
        };

        logger.warn('⚠️ Alguns módulos não carregaram', finalStatus);
        throw new Error(
            `Timeout: Módulos não carregaram no tempo esperado. Status: ${JSON.stringify(finalStatus)}`
        );
    },

    async handleRunSpecificTests(suiteType) {
        try {
            console.log(`🧪 Executando testes de ${suiteType}...`);

            // Aguardar que todos os módulos estejam carregados
            await this.waitForModules();

            // Verificar se testRunner existe
            if (!window.testRunner) {
                throw new Error('TestRunner não está disponível');
            }

            // Reset dos resultados
            window.testRunner.results = {
                total: 0,
                passed: 0,
                failed: 0,
                errors: 0,
                duration: 0,
            };
            window.testRunner.testResults = [];

            // Executar apenas a suíte específica
            switch (suiteType) {
                case 'logic':
                    await window.testRunner.runLogicTests();
                    break;
                case 'ui':
                    await window.testRunner.runUITests();
                    break;
                case 'db':
                    await window.testRunner.runDatabaseTests();
                    break;
                case 'simulation':
                    await window.testRunner.runSimulationTests();
                    break;
                default:
                    throw new Error(`Suíte de teste desconhecida: ${suiteType}`);
            }

            // Gerar relatório
            window.testRunner.generateReport();
            window.testRunner.showResultsInUI();

            ui.mostrarInsightPopup(`Testes de ${suiteType} executados!`, '🧪');
        } catch (error) {
            logger.error(`Erro ao executar testes de ${suiteType}`, { error: String(error) });
            ui.showModal({
                title: 'Erro nos Testes',
                message: `Ocorreu um erro ao executar os testes de ${suiteType}.`,
            });
        }
    },

    /**
     * 🧪 Executa bateria completa de testes funcionais
     */
    async handleRunFunctionalTests() {
        try {
            logger.info('🚀 Iniciando testes funcionais críticos...');

            // Importação dinâmica para evitar dependência circular
            const { functionalTests } = await import('./tests/functional-validation.js');

            ui.showModal({
                title: '🧪 Executando Testes Funcionais',
                message: 'Validando fluxos críticos da aplicação...',
                showProgress: true,
            });

            const results = await functionalTests.runAllTests();

            // Exibe resultado na UI
            const resultMessage = `
                📊 Resultados dos Testes:
                • Total: ${results.total}
                • ✅ Passou: ${results.passed}
                • ❌ Falhou: ${results.total - results.passed}
                • 📈 Taxa de Sucesso: ${results.passRate}%
                • ⏱️ Duração: ${results.duration.toFixed(2)}ms
            `;

            ui.showModal({
                title:
                    results.passed === results.total
                        ? '✅ Todos os Testes Passaram!'
                        : '⚠️ Alguns Testes Falharam',
                message: resultMessage,
                type: results.passed === results.total ? 'success' : 'warning',
            });

            return results;
        } catch (error) {
            logger.error('❌ Erro ao executar testes funcionais:', error);
            ui.showModal({
                title: '❌ Erro nos Testes',
                message: `Falha ao executar testes funcionais: ${error.message}`,
                type: 'error',
            });
            throw error;
        }
    },

    // Função handleWin
    handleWin(index, aporte) {
        // ADIÇÃO: Conversão segura para number
        aporte = parseFloat(aporte) || 0;

        state.operacaoPendente = { isWin: true, index, aporte };
        logic.finalizarRegistroOperacao();
    },

    // Função handleLoss
    handleLoss(index, aporte) {
        // ADIÇÃO: Conversão segura para number
        aporte = parseFloat(aporte) || 0;

        state.operacaoPendente = { isWin: false, index, aporte };
        logic.finalizarRegistroOperacao();
    },
};
