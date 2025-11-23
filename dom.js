// Módulo responsável por mapear e armazenar referências a elementos do DOM.
export const dom = {};

/**
 * 🛡️ FUNÇÃO SEGURA PARA MAPEAR DOM
 * Verifica se elemento existe antes de adicionar ao dom object
 */
function safeGetElement(id, required = false) {
    const element = document.getElementById(id); // 🔧 CORRIGIDO: usar document.getElementById
    if (!element) {
        const message = `⚠️ Elemento '${id}' não encontrado`;
        if (required) {
            console.error(`❌ ${message} (OBRIGATÓRIO)`);
        } else {
            console.warn(message);
        }
    }
    return element;
}

function safeQuerySelectorAll(selector, required = false) {
    const elements = document.querySelectorAll(selector); // 🔧 CORRIGIDO: usar document.querySelectorAll
    if (elements.length === 0) {
        const message = `⚠️ Nenhum elemento encontrado para '${selector}'`;
        if (required) {
            console.error(`❌ ${message} (OBRIGATÓRIO)`);
        } else {
            console.warn(message);
        }
    }
    return elements;
}

export function mapDOM() {
    console.log('🔍 Iniciando mapeamento seguro do DOM...');

    // Mapeamento de todos os elementos...
    // Cabeçalho
    dom.container = safeGetElement('container', true); // Obrigatório
    dom.traderName = safeGetElement('trader-name');
    dom.settingsBtn = safeGetElement('settings-btn');
    dom.compactModeBtn = safeGetElement('compact-mode-btn');
    dom.zenModeBtn = safeGetElement('zen-mode-btn');
    dom.sessionModeIndicator = safeGetElement('session-mode-indicator');
    dom.sessionModeIcon = safeGetElement('session-mode-icon');
    dom.strategyIndicatorIcon = safeGetElement('strategy-indicator-icon');
    dom.strategyIndicator = safeGetElement('strategy-indicator');
    dom.guidedModeIndicator = safeGetElement('guided-mode-indicator');
    dom.compoundingIndicator = safeGetElement('compounding-indicator');

    // Navegação
    dom.mainTabButtons = safeQuerySelectorAll('.tabs .tab-button');
    dom.mainTabContents = safeQuerySelectorAll('.tab-content');

    // Painel de Inputs
    dom.inputPanel = safeGetElement('input-panel');
    dom.capitalInicial = safeGetElement('capital-inicial');
    dom.sidebarCapitalInicial = safeGetElement('sidebar-capital-inicial'); // 🆕 main.js
    dom.percentualEntrada = safeGetElement('percentual-entrada');
    dom.stopWinPerc = safeGetElement('stop-win-perc');
    dom.stopLossPerc = safeGetElement('stop-loss-perc');
    dom.estrategiaSelect = safeGetElement('estrategia-select');
    dom.strategyRecommendation = safeGetElement('strategy-recommendation');
    dom.payoutButtonsContainer = document.querySelector('.payout-buttons');

    // Tabela de Plano
    dom.tabelaResultados = safeGetElement('tabela-resultados');
    dom.tabelaBody = safeGetElement('tabela-body');

    // Dashboard Lateral
    dom.capitalAtual = safeGetElement('capital-atual');
    dom.displayCapitalCalculo = safeGetElement('display-capital-calculo');
    dom.lucroPrejuizo = safeGetElement('lucro-prejuizo');
    dom.mentalNotePanel = safeGetElement('mental-note-panel');
    dom.mentalNoteTitle = safeGetElement('mental-note-title');
    dom.mentalNoteText = safeGetElement('mental-note-text');
    dom.undoBtn = safeGetElement('undo-btn');
    dom.finishSessionBtn = safeGetElement('finish-session-btn');
    dom.newSessionBtn = safeGetElement('new-session-btn');
    dom.sidebarNewSessionBtn = safeGetElement('sidebar-new-session-btn'); // 🆕 ui.js

    // Timeline
    dom.timelineContainer = safeGetElement('timeline-container');
    dom.timelineFilters = safeGetElement('timeline-filters');

    // ===== 🚀 PROGRESSO DAS METAS (RECONSTRUÍDO) =====
    // Mapeamento completo dos novos elementos com verificações robustas

    /**
     * 🎯 Painel principal e informações de sessão
     */
    dom.progressMetasPanel = safeGetElement('progress-metas-panel', true); // Obrigatório
    dom.progressSessionInfo = safeGetElement('progress-session-info');

    /**
     * 🥧 Elementos do gráfico de pizza (distribuição Win/Loss)
     * Estrutura melhorada com legenda personalizada
     */
    dom.progressPieChart = safeGetElement('progress-pie-chart', true); // Obrigatório
    dom.totalOperationsDisplay = safeGetElement('total-operations-display');

    /**
     * 📊 Elementos das barras de progresso horizontais
     * Separados por Win e Loss com nova estrutura
     */
    // Win Rate Progress Bar
    dom.winRateDisplay = safeGetElement('win-rate-display', false);
    dom.winTargetBar = safeGetElement('win-target-bar', true); // Obrigatório
    dom.winCurrentBar = safeGetElement('win-current-bar', true); // Obrigatório
    dom.winTargetValue = safeGetElement('win-target-value');
    dom.winCurrentValue = safeGetElement('win-current-value');
    dom.winTargetAmount = safeGetElement('win-target-amount');
    dom.winRemainingAmount = safeGetElement('win-remaining-amount');
    dom.statusMargin = safeGetElement('status-margin');
    dom.lossMarginAmount = safeGetElement('loss-margin-amount'); // 🆕 main.js

    // Loss Rate Progress Bar
    dom.lossRateDisplay = safeGetElement('loss-rate-display', false);
    dom.lossTargetBar = safeGetElement('loss-target-bar', true); // Obrigatório
    dom.lossCurrentBar = safeGetElement('loss-current-bar', true); // Obrigatório
    dom.lossTargetValue = safeGetElement('loss-target-value');
    dom.lossCurrentValue = safeGetElement('loss-current-value');

    // Performance Section Elements
    dom.metaTargetPercent = safeGetElement('meta-target-percent');
    dom.metaCurrentPercent = safeGetElement('meta-current-percent');
    dom.metaTargetAmount = safeGetElement('meta-target-amount');
    dom.metaAchievedAmount = safeGetElement('meta-achieved-amount');
    dom.metaProgressValue = safeGetElement('meta-progress-value');
    dom.metaProgressFill = safeGetElement('meta-progress-fill'); // 🆕 charts.js
    dom.metaProgressDisplay = safeGetElement('meta-progress-display'); // 🆕 charts.js
    dom.metaTrendBadge = safeGetElement('meta-trend-badge'); // 🆕 charts.js

    // Risk Section Elements
    dom.lossTargetPercent = safeGetElement('loss-target-percent');
    dom.lossCurrentPercent = safeGetElement('loss-current-percent');
    dom.lossLimitAmount = safeGetElement('loss-limit-amount');
    dom.lossSessionResult = safeGetElement('loss-session-result');
    dom.riskUsedValue = safeGetElement('risk-used-value');
    dom.riskUsedFill = safeGetElement('risk-used-fill'); // 🆕 charts.js
    dom.riskUsedDisplay = safeGetElement('risk-used-display'); // 🆕 charts.js
    dom.lossTrendBadge = safeGetElement('loss-trend-badge'); // 🆕 charts.js

    // Status indicators (detailed)
    dom.statusTargetAmount = safeGetElement('status-target-amount'); // 🆕 charts.js
    dom.statusAchieved = safeGetElement('status-achieved'); // 🆕 charts.js
    dom.statusExceed = safeGetElement('status-exceed'); // 🆕 charts.js
    dom.statusRiskUsed = safeGetElement('status-risk-used'); // 🆕 charts.js

    // Outros elementos do charts.js
    dom.payoutAtivo = safeGetElement('payout-ativo'); // 🆕 charts.js
    dom.progressSoftLockBadge = safeGetElement('progress-soft-lock-badge'); // 🆕 charts.js

    /**
     * 🎭 Indicadores de status com design melhorado
     * Cards modernos com feedback visual aprimorado
     */
    dom.winStatusIndicator = safeGetElement('win-status-indicator');
    dom.lossStatusIndicator = safeGetElement('loss-status-indicator');

    // Dashboard Principal
    dom.dashboardStatsGrid = safeGetElement('dashboard-stats-grid');
    dom.dashboardTagDiagnosticsBody = safeGetElement('dashboard-tag-diagnostics-body');
    dom.dashboardPeriodFilters = safeGetElement('dashboard-period-filters');
    dom.dashboardModeFilters = safeGetElement('dashboard-mode-filters');
    dom.dashboardStatsTitle = safeGetElement('dashboard-stats-title');
    dom.openLabBtn = safeGetElement('open-lab-btn');
    dom.generatePdfBtn = safeGetElement('generate-pdf-btn');
    dom.dashboardAssertividadeChart = safeGetElement('dashboard-assertividade-chart');
    dom.dashboardPatrimonioChart = safeGetElement('dashboard-patrimonio-chart');
    dom.dashboardContent = safeGetElement('dashboard-content'); // 🆕 ui.js

    // Diário
    dom.diarioFilterButtons = safeGetElement('diario-filter-buttons');
    dom.tabelaHistoricoBody = safeGetElement('tabela-historico-body');

    // Análise Estratégica
    dom.analiseDimensionSelect = safeGetElement('analise-dimension-select');
    dom.analiseResultsHead = safeGetElement('analise-results-head');
    dom.analiseResultsBody = safeGetElement('analise-results-body');
    dom.analiseInsightPanel = safeGetElement('analise-insight-panel');
    dom.analiseInsightTitle = safeGetElement('analise-insight-title');
    dom.analiseInsightText = safeGetElement('analise-insight-text');
    dom.analiseContent = safeGetElement('analise-content'); // 🆕 events.js

    // Popup de insights
    dom.insightPopup = safeGetElement('insight-popup');
    dom.insightPopupText = safeGetElement('insight-popup-text');
    dom.optimizerStopWin = safeGetElement('optimizer-stop-win');
    dom.optimizerStopLoss = safeGetElement('optimizer-stop-loss');
    dom.runGoalSimulationBtn = safeGetElement('run-goal-simulation-btn');
    dom.runCapitalCurveAnalysisBtn = safeGetElement('run-capital-curve-analysis-btn');

    // Análise de Curva de Capital
    dom.curveMaxDrawdown = safeGetElement('curve-max-drawdown');
    dom.curveDrawdownDuration = safeGetElement('curve-drawdown-duration');
    dom.curveMaxPeak = safeGetElement('curve-max-peak');
    dom.curvePeakDuration = safeGetElement('curve-peak-duration');
    dom.capitalCurveInsight = safeGetElement('capital-curve-insight');
    dom.capitalCurveResults = safeGetElement('capital-curve-results');

    // Otimizador de Metas
    dom.goalSimResult = safeGetElement('goal-sim-result');
    dom.goalSimRr = safeGetElement('goal-sim-rr');
    dom.goalSimWins = safeGetElement('goal-sim-wins');
    dom.goalSimLosses = safeGetElement('goal-sim-losses');
    dom.goalSimulationInsight = safeGetElement('goal-simulation-insight');
    dom.goalSimulationResults = safeGetElement('goal-simulation-results');

    // Modais
    dom.confirmationModal = safeGetElement('confirmation-modal');
    dom.modalTitle = safeGetElement('modal-title');
    dom.modalMessage = safeGetElement('modal-message');
    dom.modalConfirmBtn = safeGetElement('modal-confirm-btn');
    dom.modalCancelBtn = safeGetElement('modal-cancel-btn');
    dom.sessionModeModal = safeGetElement('session-mode-modal');
    dom.startOfficialSessionBtn = safeGetElement('start-official-session-btn');
    dom.startSimulationSessionBtn = safeGetElement('start-simulation-session-btn');
    dom.tagsModal = safeGetElement('tags-modal');
    dom.tagsModalTitle = safeGetElement('tags-modal-title');
    dom.tagsContainer = safeGetElement('tags-container');
    dom.opNote = safeGetElement('op-note');
    dom.skipTagBtn = safeGetElement('skip-tag-btn');
    dom.replayModal = safeGetElement('replay-modal');
    dom.replayTitle = safeGetElement('replay-title');
    dom.replayStatsGrid = safeGetElement('replay-stats-grid');
    dom.replayTimelineContainer = safeGetElement('replay-timeline-container');
    // Trash DOM central removido; a versão do menu lateral usa IDs equivalentes no modal da sidebar
    dom.closeReplayBtn = safeGetElement('close-replay-btn');
    dom.replayAssertividadeChart = safeGetElement('replayAssertividadeChart');
    dom.replayPatrimonioChart = safeGetElement('replayPatrimonioChart');
    dom.riskLabModal = safeGetElement('risk-lab-modal');
    dom.simWinrate = safeGetElement('sim-winrate');
    dom.simPayout = safeGetElement('sim-payout');
    dom.simNumSimulations = safeGetElement('sim-num-simulations');
    dom.simMaxOps = safeGetElement('sim-max-ops');
    dom.runSimulationBtn = safeGetElement('run-simulation-btn');
    dom.simulationProgressContainer = safeGetElement('simulation-progress-container');
    dom.simulationProgressBar = safeGetElement('simulation-progress-bar');
    dom.simulationResults = safeGetElement('simulation-results');
    dom.simProbWin = safeGetElement('sim-prob-win');
    dom.simProbLoss = safeGetElement('sim-prob-loss');
    dom.simAvgResult = safeGetElement('sim-avg-result');
    dom.simMaxDrawdown = safeGetElement('sim-max-drawdown');
    dom.simulationInsight = safeGetElement('simulation-insight');
    dom.closeLabBtn = safeGetElement('close-lab-btn');

    // Modal de Configurações
    dom.settingsModal = safeGetElement('settings-modal');
    dom.closeSettingsBtn = safeGetElement('close-settings-btn');
    dom.settingsTabButtons = safeQuerySelectorAll('.settings-tab-button');
    dom.settingsTabContents = safeQuerySelectorAll('.settings-tab-content');
    dom.modalModoGuiadoToggle = safeGetElement('modal-modo-guiado-toggle');
    dom.modalIncorporarLucroToggle = safeGetElement('modal-incorporar-lucro-toggle');
    dom.autoLockToggle = safeGetElement('auto-lock-toggle');
    dom.lockDurationContainer = safeGetElement('lock-duration-container');
    dom.lockDurationSelect = safeGetElement('lock-duration-select');
    dom.divisorRecuperacaoGroup = safeGetElement('divisor-recuperacao-group');
    dom.divisorRecuperacaoSlider = safeGetElement('divisor-recuperacao-slider');
    dom.divisorRecuperacaoValor = safeGetElement('divisor-recuperacao-valor');
    dom.recoverySliderMinus = safeGetElement('recovery-slider-minus');
    dom.recoverySliderPlus = safeGetElement('recovery-slider-plus');
    dom.traderNameInput = safeGetElement('trader-name-input');
    dom.modalThemeSelector = safeGetElement('modal-theme-selector');
    dom.modalNotificationsToggle = safeGetElement('modal-notifications-toggle');

    // Overlay de Bloqueio
    dom.lockdownOverlay = safeGetElement('lockdown-overlay');
    dom.countdownTimer = safeGetElement('countdown-timer');

    // Testes Automáticos
    dom.runAllTestsBtn = safeGetElement('run-all-tests');
    dom.runLogicTestsBtn = safeGetElement('run-logic-tests');
    dom.runUITestsBtn = safeGetElement('run-ui-tests');
    dom.runDBTestsBtn = safeGetElement('run-db-tests');
    dom.runSimulationTestsBtn = safeGetElement('run-simulation-tests');
    dom.testResults = safeGetElement('test-results');

    // 📊 Relatório final de mapeamento
    const totalMapped = Object.keys(dom).length;
    const requiredElements = Object.values(dom).filter(
        (el) => el !== null && el !== undefined
    ).length;
    const missingElements = totalMapped - requiredElements;

    console.log(`✅ DOM mapeado com segurança!`);
    console.log(`📊 Estatísticas: ${requiredElements}/${totalMapped} elementos encontrados`);

    if (missingElements > 0) {
        console.warn(
            `⚠️ ${missingElements} elementos não encontrados (esperado para layouts dinâmicos)`
        );
    }

    return dom;
}

/**
 * 🧪 FUNÇÃO DE TESTE - Verifica integridade do mapeamento DOM
 */
export function testDOMMapping() {
    console.log('🧪 Testando mapeamento DOM...');

    const startTime = performance.now();
    const result = mapDOM();
    const endTime = performance.now();

    console.log(`⏱️ Mapeamento concluído em ${(endTime - startTime).toFixed(2)}ms`);

    // Testa elementos críticos
    const criticalElements = [
        'container',
        'progressMetasPanel',
        'progressPieChart',
        'winCurrentBar',
        'lossCurrentBar',
        'winRateDisplay',
        'lossRateDisplay',
    ];

    const missingCritical = criticalElements.filter((id) => !dom[id]);

    if (missingCritical.length === 0) {
        console.log('✅ Todos os elementos críticos encontrados!');
        return true;
    } else {
        console.error('❌ Elementos críticos ausentes:', missingCritical);
        return false;
    }
}

// 🌐 EXPOSIÇÃO GLOBAL PARA TESTES
if (typeof window !== 'undefined') {
    window.testDOMMapping = testDOMMapping;
    console.log('🧪 testDOMMapping() disponível globalmente');
}
