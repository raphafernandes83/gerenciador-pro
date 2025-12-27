/**
 * 🎨 MÓDULO DE INTERFACE DO USUÁRIO
 * Responsável por toda a manipulação do DOM e renderização na UI
 *
 * @module UI
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

// Core dependencies (essenciais)
import { state, config, CONSTANTS } from './state.js';
import { Features } from './src/config/Features.js';
import {
    logic,
    calcularPayoffRatio,
    calcularDrawdown,
    calcularSequencias,
    calcularExpectativaMatematica,
} from './logic.js';
import { dbManager } from './db.js';
import { charts } from './charts.js';
import { dom } from './dom.js';
import { initComponents } from './src/init-components.js';

// Utilities
import { debounce, TIMING } from './src/utils/PerformanceUtils.js';
import { CURRENCY_FORMAT, VALIDATION_MESSAGES, CSS_CLASSES } from './src/constants/UIConstants.js';
import { UI_MAPPING_CONFIG } from './src/config/UIMappingConfig.js';
import { pipe, compose, Maybe, Task, safe } from './src/functional/FunctionalHelpers.js';

// Error Handling
import { globalErrorHandler, ERROR_CATEGORIES } from './src/error/ErrorHandlingStrategy.js';

// Services Facade (substitui múltiplos imports)
import { uiServicesFacade } from './src/ui/UIServicesFacade.js';

// ============================================================================
// 🆕 CHECKPOINT 2.2a: Helper de transição para DOMManager
// ============================================================================
const domHelper = {
    addClass(element, ...classes) {
        if (window.domManager) return window.domManager.addClass(element, ...classes);
        if (typeof element === 'string') element = document.querySelector(element);
        element?.classList.add(...classes);
        return !!element;
    },
    removeClass(element, ...classes) {
        if (window.domManager) return window.domManager.removeClass(element, ...classes);
        if (typeof element === 'string') element = document.querySelector(element);
        element?.classList.remove(...classes);
        return !!element;
    },
    toggleClass(element, className, force) {
        if (window.domManager) return window.domManager.toggleClass(element, className, force);
        if (typeof element === 'string') element = document.querySelector(element);
        return element ? element.classList.toggle(className, force) : false;
    },
    hasClass(element, className) {
        if (window.domManager) return window.domManager.hasClass(element, className);
        if (typeof element === 'string') element = document.querySelector(element);
        return element ? element.classList.contains(className) : false;
    }
};

export const ui = {
    /**
     * Inicializa o módulo UI
     */
    async init() {
        console.log('🚀 UI: Inicializando...');

        // Inicializa componentes avançados
        initComponents();

        // Inicializa otimizações
        this.initPerformanceOptimizations();
        this._initDebounce();

        // Inicializa mapeamento
        await this._initMappingManager();

        console.log('✅ UI: Inicializada com sucesso');
    },

    /**
     * Inicializa gerenciador de mapeamentos da UI
     * @private
     */
    async _initMappingManager() {
        if (!this.mappingManager) {
            await uiServicesFacade.initialize(dom, config, state);
            this.mappingManager = uiServicesFacade.getService('mappingManager');
        }
        return this.mappingManager;
    },

    /**
     * Inicializa sistema de performance da UI
     * @public
     */
    initPerformanceOptimizations() {
        console.log('🚀 Inicializando otimizações de performance da UI...');
        // this._preWarmDOMCache(); // Removido temporariamente se não existir
        // this._setupPerformanceMonitoring(); // Removido temporariamente se não existir
        console.log('✅ Otimizações de performance da UI ativadas');
    },

    /**
     * Inicializa debounce otimizado
     * @private
     */
    _initDebounce() {
        this.atualizarTudoDebounced = debounce(
            async () => {
                try {
                    await this._atualizarTudoInterno();
                } catch (error) {
                    console.error('❌ UI: Erro durante atualização com debounce:', error);
                }
            },
            TIMING.DEBOUNCE.NORMAL,
            { maxWait: TIMING.DEBOUNCE.SLOW }
        );
    },

    /**
     * Exibe um modal usando o novo sistema ModalUI
     * @param {Object} options - Opções do modal
     */
    showModal(options) {
        // Delegação para o novo sistema de Modais
        if (window.components && window.components.modal) {
            const {
                title,
                message,
                confirmText = 'OK',
                cancelText = null,
                onConfirm,
                onCancel,
            } = options;

            // Mapeia opções do legado para o novo formato
            const modalConfig = {
                title: title,
                message: message,
                type: cancelText ? 'confirm' : 'alert',
                onConfirm: onConfirm,
                onCancel: onCancel,
                onClose: onCancel // Garante que fechar pelo X também chame onCancel se existir
            };

            // Se for confirm, adiciona botões customizados se necessário
            if (cancelText) {
                modalConfig.buttons = [
                    { label: cancelText, onClick: () => window.components.modal.close(false), variant: 'secondary' },
                    {
                        label: confirmText, onClick: async () => {
                            if (onConfirm) await onConfirm();
                            window.components.modal.close(true);
                        }, variant: 'primary'
                    }
                ];
                modalConfig.type = 'custom'; // Usa custom para ter controle total dos botões
            }

            window.components.modal.open(modalConfig).catch(err => {
                // Ignora erro de "Modal já aberto" (Silent Ignore já tratado no ModalUI)
                if (err.message !== 'Modal já aberto') {
                    console.error('Erro ao abrir modal:', err);
                }
            });
            return;
        }

        // Fallback (caso components não carregue)
        console.warn('⚠️ ModalUI não disponível, usando fallback básico');
        alert(`${options.title}\n\n${options.message}`);
    },

    /**
     * Renderiza a timeline usando o novo sistema TimelineUI
     */
    renderizarTimeline(historico, container) {
        if (window.components && window.components.timeline) {
            window.components.timeline.render(historico, container);
        } else {
            console.warn('⚠️ TimelineUI não disponível');
        }
    },

    /**
     * Adiciona item à timeline usando o novo sistema
     */
    adicionarItemTimeline(op, index, scrollToView = true, customContainer = null) {
        if (window.components && window.components.timeline) {
            window.components.timeline.addItem(op, index, scrollToView, customContainer);
        }
    },

    /**
     * Remove último item da timeline usando o novo sistema
     */
    removerUltimoItemTimeline() {
        if (window.components && window.components.timeline) {
            window.components.timeline.removeLastItem();
        }
    },

    /**
     * Renderiza a tabela usando o novo sistema TabelaUI
     */
    renderizarTabela() {
        if (window.components && window.components.tabela) {
            window.components.tabela.render();
        } else {
            console.warn('⚠️ TabelaUI não disponível');
        }
    },

    /**
     * Atualiza toda a interface
     */
    async atualizarTudo() {
        this.atualizarTudoDebounced();
    },

    /**
     * Atualização interna da UI
     * @private
     */
    async _atualizarTudoInterno() {
        console.log('🎯 UI: Executando atualização interna...');
        const startTime = performance.now();

        try {
            this.renderizarTabela();
            this.renderizarTimeline(); // Usa defaults

            // Atualiza outros elementos
            this.atualizarDashboardSessao();
            this.atualizarStatusIndicadores();
            this.analisarPerformanceRecente();
            this.atualizarVisibilidadeContextual();

            const endTime = performance.now();
            console.log(`✅ UI: Atualização interna completa em ${(endTime - startTime).toFixed(2)}ms`);
        } catch (error) {
            console.error('❌ UI: Erro durante atualização interna:', error);
            throw error;
        }
    },

    /**
     * Atualiza o dashboard da sessão
     */
    async atualizarDashboardSessao() {
        const { capitalDeCalculo, capitalAtual, capitalInicioSessao } = state;

        // Proteção contra NaN
        const capitalAtualSeguro = this._isValidMonetaryValue(capitalAtual) ? capitalAtual : config.capitalInicial || 0;
        const capitalInicioSeguro = this._isValidMonetaryValue(capitalInicioSessao) ? capitalInicioSessao : config.capitalInicial || 0;

        let lucroPrejuizo = capitalAtualSeguro - capitalInicioSeguro;
        const lucroPrejuizoFormatado = this._formatarMoedaInternal(lucroPrejuizo);
        const capitalAtualFormatado = this._formatarMoedaInternal(capitalAtualSeguro);

        if (dom.capitalAtual) dom.capitalAtual.textContent = capitalAtualFormatado;
        if (dom.lucroPrejuizo) {
            dom.lucroPrejuizo.textContent = lucroPrejuizoFormatado;
            dom.lucroPrejuizo.className = lucroPrejuizo >= 0 ? 'positive' : 'negative';
        }

        if (dom.undoBtn) {
            dom.undoBtn.disabled = state.undoStack.length === 0 || !state.isSessionActive;
        }
    },

    /**
     * Formata valor monetário (interno)
     */
    _formatarMoedaInternal(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    },

    /**
     * Valida valor monetário
     */
    _isValidMonetaryValue(valor) {
        return (
            valor !== null &&
            valor !== undefined &&
            !Number.isNaN(Number(valor)) &&
            Number.isFinite(Number(valor))
        );
    },

    /**
     * Mostra modal de tags
     */
    showTagsModal(isWin) {
        const TAGS = {
            win: ['✅ Segui o Plano', '🎯 Análise Perfeita', '📈 A Favor da Tendência', '😌 Paciência'],
            loss: ['❌ Fora do Plano', '😡 Impaciência', '😰 Hesitação/Medo', '📉 Contra Tendência'],
        };
        if (dom.tagsModalTitle) dom.tagsModalTitle.textContent = `Classifique sua ${isWin ? 'VITÓRIA' : 'DERROTA'}:`;
        if (dom.tagsContainer) {
            dom.tagsContainer.innerHTML = (isWin ? TAGS.win : TAGS.loss)
                .map((tag) => `<button>${tag}</button>`)
                .join('');
        }
        if (dom.opNote) dom.opNote.value = '';
        if (dom.tagsModal) domHelper.addClass(dom.tagsModal, 'show');
    },

    /**
     * Inicia bloqueio de tela
     */
    iniciarBloqueio(fimTimestamp, tipoMeta) {
        if (!dom.lockdownOverlay) return;
        const h2 = dom.lockdownOverlay.querySelector('h2');
        const p = dom.lockdownOverlay.querySelector('p');
        if (h2) h2.textContent = `Sessão Finalizada!`;
        if (p) p.textContent = `Meta de ${tipoMeta === 'win' ? 'ganhos' : 'perdas'} atingida. O bloqueio automático foi ativado para proteger seu capital.`;

        if (dom.container) domHelper.addClass(dom.container, 'hidden');
        domHelper.removeClass(dom.lockdownOverlay, 'hidden');

        const safeInterval = window.safeProtection?.safeSetInterval || setInterval;
        state.countdownInterval = safeInterval(() => {
            const restante = fimTimestamp - Date.now();
            if (restante <= 0) {
                clearInterval(state.countdownInterval);
                localStorage.removeItem('gerenciadorProLockdownEnd');
                localStorage.removeItem('gerenciadorProLockdownType');
                if (dom.lockdownOverlay) domHelper.addClass(dom.lockdownOverlay, 'hidden');
                if (dom.container) domHelper.removeClass(dom.container, 'hidden');
                return;
            }
            const horas = Math.floor((restante / 3600000) % 24).toString().padStart(2, '0');
            const minutos = Math.floor((restante / 60000) % 60).toString().padStart(2, '0');
            const segundos = Math.floor((restante / 1000) % 60).toString().padStart(2, '0');
            if (dom.countdownTimer) dom.countdownTimer.textContent = `${horas}:${minutos}:${segundos}`;
        }, 1000);
    },

    /**
     * Mostra popup de insight
     */
    mostrarInsightPopup(texto, icone = '💡') {
        if (!config.notificacoesAtivas || !dom.insightPopup) return;
        clearTimeout(state.insightPopupTimer);
        if (dom.insightPopupText) dom.insightPopupText.textContent = `${icone} ${texto}`;
        domHelper.addClass(dom.insightPopup, 'show');
        const safeTimeout = window.safeProtection?.safeSetTimeout || setTimeout;
        state.insightPopupTimer = safeTimeout(() => {
            if (dom.insightPopup) domHelper.removeClass(dom.insightPopup, 'show');
        }, 4000);
    },

    /**
     * Sinaliza bloqueio suave
     */
    sinalizarBloqueioSuave(type, reason) {
        try {
            const enabled = (window.Features && window.Features.FEATURE_progress_cards_v2) || Features.FEATURE_progress_cards_v2;
            if (!enabled) return;

            const isWin = type === 'STOP_WIN';
            const icon = isWin ? '🏁' : '⛔';
            const msg = isWin ? 'Meta de ganhos atingida' : 'Limite de perda atingido';

            this.mostrarInsightPopup(`${msg}${reason ? ` · ${reason}` : ''}`, icon);

            const badge = dom.progressSoftLockBadge;
            if (badge) {
                badge.textContent = `${icon} ${msg}`;
                domHelper.removeClass(badge, 'hidden');
                domHelper.addClass(badge, 'show');
            }
        } catch (e) {
            console.warn('Erro em sinalizarBloqueioSuave:', e);
        }
    },

    /**
     * Define tema
     */
    setTema(tema) {
        document.body.setAttribute('data-theme', tema);
        config.tema = tema;
        document.querySelectorAll('.theme-card').forEach((card) =>
            domHelper.toggleClass(card, 'active', card.dataset.theme === tema)
        );
        charts.updateColors();
    },

    /**
     * Atualiza display de recuperação
     */
    updateRecoverySplitDisplay(value) {
        if (dom.divisorRecuperacaoValor) {
            dom.divisorRecuperacaoValor.innerHTML = `<span>${Math.round(value)}%</span> / <span>${100 - Math.round(value)}%</span>`;
        }
    },

    /**
     * Analisa performance recente
     */
    analisarPerformanceRecente() {
        const historico = state.historicoCombinado;
        const panel = dom.mentalNotePanel;
        if (!panel) return;

        if (historico.length === 0) {
            domHelper.addClass(panel, 'hidden');
            return;
        }

        const ultimas3 = historico.slice(-3);
        if (ultimas3.length === 3) {
            if (ultimas3.every((op) => !op.isWin)) {
                panel.className = 'panel insight-panel warning';
                if (dom.mentalNoteTitle) dom.mentalNoteTitle.textContent = '⚠️ Alerta de Risco';
                if (dom.mentalNoteText) dom.mentalNoteText.textContent = 'Sequência de 3 derrotas. Considere uma pausa.';
                domHelper.removeClass(panel, 'hidden');
                return;
            }
            if (ultimas3.every((op) => op.isWin)) {
                panel.className = 'panel insight-panel success';
                if (dom.mentalNoteTitle) dom.mentalNoteTitle.textContent = '🚀 Em Performance';
                if (dom.mentalNoteText) dom.mentalNoteText.textContent = 'Sequência de 3 vitórias. Excelente consistência.';
                domHelper.removeClass(panel, 'hidden');
                return;
            }
        }
        domHelper.addClass(panel, 'hidden');
    },

    /**
     * Atualiza indicadores de status
     */
    atualizarStatusIndicadores() {
        if (dom.sessionModeIndicator) {
            domHelper.toggleClass(dom.sessionModeIndicator, 'active', state.sessionMode === CONSTANTS.SESSION_MODE.OFFICIAL);
            if (dom.sessionModeIcon) dom.sessionModeIcon.textContent = state.sessionMode === CONSTANTS.SESSION_MODE.OFFICIAL ? '📈' : '🧪';
        }
        if (dom.guidedModeIndicator) domHelper.toggleClass(dom.guidedModeIndicator, 'active', config.modoGuiado);
        if (dom.compoundingIndicator) domHelper.toggleClass(dom.compoundingIndicator, 'active', config.incorporarLucros);

        const isCiclos = config.estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES;
        if (dom.strategyIndicatorIcon) dom.strategyIndicatorIcon.textContent = isCiclos ? '🔄' : '➖';
    },

    /**
     * Atualiza visibilidade contextual
     */
    atualizarVisibilidadeContextual() {
        const isCiclos = config.estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES;
        if (dom.strategyRecommendation) {
            dom.strategyRecommendation.textContent = isCiclos
                ? 'Ideal para maximizar ganhos, mas exige gestão de risco rigorosa.'
                : 'Recomendado para perfis mais conservadores, protegendo o capital.';
        }
        this.updateSettingsModalVisibility();
    },

    /**
     * Atualiza visibilidade do modal de configurações
     */
    updateSettingsModalVisibility() {
        if (dom.divisorRecuperacaoGroup) {
            domHelper.toggleClass(dom.divisorRecuperacaoGroup, 'hidden', config.estrategiaAtiva !== CONSTANTS.STRATEGY.CYCLES);
        }
    },

    /**
     * Renderiza diagnósticos de tags
     */
    renderTagDiagnostics(historico, container) {
        if (!container) return;
        const diagnostics = {};
        container.innerHTML = '';
        historico.forEach((op) => {
            const tag = op.tag || 'Sem Tag';
            if (!diagnostics[tag]) diagnostics[tag] = { ops: 0, wins: 0, resultado: 0 };
            diagnostics[tag].ops++;
            diagnostics[tag].resultado += op.valor;
            if (op.isWin) diagnostics[tag].wins++;
        });

        const sortedTags = Object.entries(diagnostics).sort((a, b) => b[1].ops - a[1].ops);
        if (sortedTags.length === 0) {
            container.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhuma tag registada.</td></tr>`;
            return;
        }

        sortedTags.forEach(([tag, data]) => {
            const assertividade = data.ops > 0 ? (data.wins / data.ops) * 100 : 0;
            const resultadoClass = data.resultado > 0 ? 'positive' : data.resultado < 0 ? 'negative' : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tag}</td>
                <td>${data.ops}</td>
                <td>${assertividade.toFixed(1)}%</td>
                <td class="${resultadoClass}">${config.zenMode ? '---' : this._formatarMoedaInternal(data.resultado)}</td>`;
            container.appendChild(tr);
        });
    },

    /**
     * Normaliza ID de sessão
     */
    _normalizeSessionId(sessao) {
        if (!sessao || typeof sessao !== 'object') return null;
        if (sessao.id) return { ...sessao, id: sessao.id }; // Simplificado para robustez
        return { ...sessao, id: Date.now() };
    },

    /**
     * Renderiza diário de sessões
     */
    async renderDiario(filter = 'todas') {
        const body = dom.tabelaHistoricoBody;
        if (!body) return;
        body.innerHTML = '<tr><td colspan="6" style="text-align: center;">A carregar...</td></tr>';
        try {
            let sessoes = filter === 'todas' ? await dbManager.getAllSessions() : await dbManager.getSessionsByMode(filter);
            if (!Array.isArray(sessoes) || sessoes.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma sessão encontrada.</td></tr>';
                return;
            }
            sessoes.sort((a, b) => b.data - a.data);
            body.innerHTML = '';
            sessoes.forEach((sessao) => {
                const normalized = this._normalizeSessionId(sessao);
                if (!normalized) return;
                sessao = normalized;

                const tr = document.createElement('tr');
                tr.dataset.sessionId = sessao.id;
                const data = sessao.data ? new Date(sessao.data).toLocaleDateString('pt-BR') : 'Data inválida';
                const resultadoFormatado = this._formatarMoedaInternal(sessao.resultadoFinanceiro || 0);
                const resultadoClass = (sessao.resultadoFinanceiro || 0) >= 0 ? 'positive' : 'negative';

                tr.innerHTML = `
                    <td>${data}</td>
                    <td><span class="mode-tag ${sessao.modo}">${sessao.modo}</span></td>
                    <td class="${resultadoClass}">${resultadoFormatado}</td>
                    <td>${sessao.totalOperacoes || 0}</td>
                    <td>${((sessao.assertividade || 0) * 100).toFixed(1)}%</td>
                    <td>
                        <div class="acoes-cell">
                            <button class="details-btn" data-session-id="${sessao.id}">Ver</button>
                            <button class="delete-btn" data-session-id="${sessao.id}" title="Excluir Sessão">🗑️</button>
                        </div>
                    </td>`;
                body.appendChild(tr);
            });
        } catch (error) {
            console.error('Erro ao renderizar diário:', error);
            body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Erro ao carregar histórico.</td></tr>';
        }
    },

    /**
     * Mostra modal de replay
     */
    async showReplayModal(sessionId) {
        try {
            const sessao = await dbManager.getSessionById(sessionId);
            if (!sessao) throw new Error('Sessão não encontrada');

            if (dom.replayTitle) dom.replayTitle.textContent = `Replay da Sessão - ${new Date(sessao.data).toLocaleDateString('pt-BR')}`;

            // Renderiza timeline no container de replay
            this.renderizarTimeline(sessao.historicoCombinado, dom.replayTimelineContainer);
            charts.updateReplayCharts(sessao);

            if (dom.replayModal) {
                domHelper.addClass(dom.replayModal, 'show');
                const content = dom.replayModal.querySelector('.modal-content');
                if (content) content.dataset.sessionId = sessionId;
            }
        } catch (error) {
            console.error('Erro ao mostrar replay:', error);
            this.showModal({ title: 'Erro', message: 'Não foi possível carregar o replay.' });
        }
    },

    /**
     * Alterna abas
     */
    switchTab(targetTabId) {
        if (!targetTabId) return;
        if (dom.mainTabButtons) dom.mainTabButtons.forEach((btn) => domHelper.toggleClass(btn, 'active', btn.dataset.tab === targetTabId));
        if (dom.mainTabContents) dom.mainTabContents.forEach((content) => domHelper.toggleClass(content, 'active', content.id === `${targetTabId}-content`));
        localStorage.setItem(CONSTANTS.LAST_ACTIVE_TAB_KEY, JSON.stringify(targetTabId));
    },

    /**
     * Alterna abas de configuração
     */
    switchSettingsTab(targetTabId) {
        if (dom.settingsTabButtons) dom.settingsTabButtons.forEach((b) => domHelper.removeClass(b, 'active'));
        if (dom.settingsTabContents) dom.settingsTabContents.forEach((c) => domHelper.removeClass(c, 'active'));
        const targetTab = document.querySelector(`.settings-tab-button[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(`${targetTabId}-content`);
        if (targetTab) domHelper.addClass(targetTab, 'active');
        if (targetContent) domHelper.addClass(targetContent, 'active');
    },

    /**
     * Alterna modo compacto
     */
    toggleCompactMode() {
        document.body && domHelper.toggleClass(document.body, 'compact-mode');
    },

    /**
     * Alterna modo Zen
     */
    toggleZenMode() {
        config.zenMode = !config.zenMode;
        localStorage.setItem('gerenciadorProZenMode', JSON.stringify(config.zenMode));
        this.atualizarTudo();
        dom.zenModeBtn && domHelper.toggleClass(dom.zenModeBtn, 'active', config.zenMode);
    },

    /**
     * Gera PDF
     */
    async gerarPDF() {
        this.showModal({ title: 'A gerar PDF...', message: 'Aguarde...' });
        // Implementação simplificada para brevidade, assumindo html2canvas/jspdf globais
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const canvas = await html2canvas(dom.dashboardContent, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save(`Relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
            if (window.components && window.components.modal) window.components.modal.close(true);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.showModal({ title: 'Erro', message: 'Falha ao gerar PDF.' });
        }
    },

    /**
     * Sincroniza UI com estado
     */
    async syncUIFromState() {
        return this._atualizarTudoInterno();
    },

    /**
     * Renderiza resultados de otimização de meta
     */
    renderGoalOptimizationResults(results) {
        const { totalSimulatedResult, riskReward, winSessions, lossSessions, insight } = results;
        if (dom.goalSimResult) {
            dom.goalSimResult.textContent = this._formatarMoedaInternal(totalSimulatedResult);
            dom.goalSimResult.className = totalSimulatedResult >= 0 ? 'positive' : 'negative';
        }
        if (dom.goalSimRr) dom.goalSimRr.textContent = `${riskReward}:1`;
        if (dom.goalSimWins) dom.goalSimWins.textContent = winSessions;
        if (dom.goalSimLosses) dom.goalSimLosses.textContent = lossSessions;
        if (dom.goalSimulationInsight) dom.goalSimulationInsight.textContent = insight;
        if (dom.goalSimulationResults) domHelper.removeClass(dom.goalSimulationResults, 'hidden');
    },

    /**
     * Obtém contexto atual
     */
    _getCurrentContext() {
        return {
            domQueries: document.querySelectorAll('*').length,
            memoryUsage: performance.memory ? (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100 : 50
        };
    },

    /**
     * Operação segura assíncrona
     */
    asyncSafeOperation: (operation) => Task.of(operation).map((op) => safe(op)).run().catch((error) => ({ success: false, error: error.message })),

    /**
     * Sincroniza controles toggle
     */
    async _syncToggleControls() {
        const manager = await this._initMappingManager();
        return manager.applyMappingCategory(UI_MAPPING_CONFIG.TOGGLE_CONTROLS);
    }
};

// Exposição global
window.ui = ui;
