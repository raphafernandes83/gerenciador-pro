// state/sessionStore.js — Store leve com pub/sub e seletores memoizados
// Mantém compatibilidade com window.state existente via camada opcional

/**
 * @typedef {Object} AppOperation
 * @property {boolean} isWin
 * @property {number} valor
 * @property {number} [valorEntrada]
 * @property {number} [valorRetorno]
 * @property {number} [payout]
 * @property {string} [tag]
 * @property {string} [timestamp]
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} isSessionActive
 * @property {number} capitalInicial
 * @property {number} capitalInicioSessao
 * @property {number} capitalAtual
 * @property {AppOperation[]} historicoCombinado
 * @property {number} stopWinPerc
 * @property {number} stopLossPerc
 */

const subscribers = new Set();
/** @type {AppState} */
let internalState = {
    isSessionActive: false,
    capitalInicial: 0,
    capitalInicioSessao: 0,
    capitalAtual: 0,
    historicoCombinado: [],
    stopWinPerc: 0,
    stopLossPerc: 0,
};

/**
 * Obtém o estado atual da store.
 * @returns {AppState}
 */
export function getState() {
    return internalState;
}

/**
 * Aplica um patch raso ao estado e notifica inscritos.
 * @param {Partial<AppState>} patch
 */
export function setState(patch) {
    if (!patch || typeof patch !== 'object') return;
    const prev = internalState;
    internalState = { ...internalState, ...patch };
    for (const fn of subscribers) {
        try {
            fn(internalState, prev);
        } catch (_) {}
    }
}

/**
 * Inscreve um listener para mudanças de estado.
 * @param {(next: AppState, prev: AppState) => void} listener
 * @returns {() => void} Função para cancelar inscrição
 */
export function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    subscribers.add(listener);
    return () => subscribers.delete(listener);
}

/**
 * Reseta o estado com base em um objeto inicial.
 * @param {Partial<AppState>} initial
 */
export function reset(initial) {
    const base = initial && typeof initial === 'object' ? initial : {};
    setState({
        isSessionActive: !!base.isSessionActive,
        capitalInicial: Number(base.capitalInicial) || 0,
        capitalInicioSessao: Number(base.capitalInicioSessao) || Number(base.capitalInicial) || 0,
        capitalAtual: Number(base.capitalAtual) || Number(base.capitalInicial) || 0,
        historicoCombinado: Array.isArray(base.historicoCombinado)
            ? base.historicoCombinado.slice()
            : [],
        stopWinPerc: Number(base.stopWinPerc) || 0,
        stopLossPerc: Number(base.stopLossPerc) || 0,
    });
}

// Seletores simples (mantidos puros para testabilidade)
export const selectors = {
    /**
     * @param {AppState} [s]
     * @returns {number}
     */
    selectLucroAcumulado(s) {
        const st = s || internalState;
        return (
            (Number(st.capitalAtual) || 0) -
            (Number(st.capitalInicioSessao || st.capitalInicial) || 0)
        );
    },
    /**
     * @param {AppState} [s]
     * @returns {number}
     */
    selectStopWinAmount(s) {
        const st = s || internalState;
        return (
            (Number(st.capitalInicioSessao || st.capitalInicial) || 0) *
            ((Number(st.stopWinPerc) || 0) / 100)
        );
    },
    /**
     * @param {AppState} [s]
     * @returns {number}
     */
    selectStopLossAmount(s) {
        const st = s || internalState;
        return (
            (Number(st.capitalInicioSessao || st.capitalInicial) || 0) *
            ((Number(st.stopLossPerc) || 0) / 100)
        );
    },
    /**
     * @param {AppState} [s]
     * @returns {AppOperation[]}
     */
    selectHistorico(s) {
        const st = s || internalState;
        return Array.isArray(st.historicoCombinado) ? st.historicoCombinado : [];
    },
};

// Exposição global opcional (flags decidirão o uso)
if (typeof window !== 'undefined') {
    try {
        if (!window.sessionStore)
            window.sessionStore = { getState, setState, subscribe, reset, selectors };
    } catch (_) {}
}

export default { getState, setState, subscribe, reset, selectors };
