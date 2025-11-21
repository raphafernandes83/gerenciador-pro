// Contém as constantes e a definição inicial do estado da aplicação.
export const CONSTANTS = {
    STRATEGY: {
        CYCLES: 'ciclos',
        FIXED: 'fixa',
    },
    SESSION_MODE: {
        OFFICIAL: 'oficial',
        SIMULATION: 'simulacao',
    },
    DB_NAME: 'GerenciadorProDB_v9',
    DB_VERSION: 1,
    STORE_NAME: 'sessoes',
    ACTIVE_SESSION_KEY: 'gerenciadorProActiveSession',
    LAST_ACTIVE_TAB_KEY: 'gerenciadorProLastActiveTab',
};

const initialConfig = {
    // Configurações do Plano e Estratégia
    capitalInicial: 10000,
    percentualEntrada: 2.0,
    stopWinPerc: 10,
    stopLossPerc: 15,
    // Metas de assertividade (WR/LR) para o card de Metas vs Performance
    // Mantidas separadas dos stops monetários para evitar ambiguidade
    metaWinRate: 60,
    metaLossRate: 40,
    payout: 87,
    estrategiaAtiva: CONSTANTS.STRATEGY.CYCLES,

    // Preferências do Utilizador
    traderName: 'Nome do Trader',
    tema: 'moderno',
    modoGuiado: true,
    incorporarLucros: false,
    autoBloqueio: true,
    duracaoBloqueio: 8, // em horas
    notificacoesAtivas: true,
    divisorRecuperacao: 35,
    zenMode: false,
};

const initialState = {
    // Estado da Sessão Ativa
    isSessionActive: false,
    sessionMode: CONSTANTS.SESSION_MODE.OFFICIAL, // 'oficial' ou 'simulacao'
    planoDeOperacoes: [],
    proximaEtapaIndex: 0,
    proximoAporte: 1,

    // Contabilidade da Sessão
    capitalDeCalculo: 0,
    capitalAtual: 0,
    capitalInicioSessao: 0,
    stopWinValor: 0,
    stopLossValor: 0,

    // Histórico e Undo
    historicoSessao: [],
    historicoCombinado: [],
    undoStack: [],

    // Controlo de UI
    metaAtingida: false,
    countdownInterval: null,
    insightPopupTimer: null,

    // Dados para Dashboards
    dashboardFilterPeriod: 'all',
    dashboardFilterMode: 'all',
    filtroTimeline: 'all',
    lastAggregatedData: null,

    // Timeline de operações
    timeline: [],

    // Estado da Sidebar
    sidebarExpanded: false,
    sidebarActiveSection: 'profile',
};

export let config = JSON.parse(JSON.stringify(initialConfig));
export let state = JSON.parse(JSON.stringify(initialState));

export function resetConfig() {
    Object.assign(config, JSON.parse(JSON.stringify(initialConfig)));
}

export function resetState() {
    Object.assign(state, JSON.parse(JSON.stringify(initialState)));
}
