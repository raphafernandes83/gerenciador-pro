// Utils/GoalsUtils.js — Funções puras para metas (Stop Win / Stop Loss)
// Compatível com ES Modules e expõe APIs no window para uso imediato pelos módulos atuais

/**
 * @typedef {Object} GoalsInput
 * @property {number} capitalInicial - Capital de referência da sessão (R$)
 * @property {number} stopWinPerc - Percentual da meta de ganho (0-100)
 * @property {number} stopLossPerc - Percentual do limite de perda (0-100)
 * @property {number} [capitalAtual] - Capital atual (R$); se omitido, assume 0 para cálculo de lucro
 */

/**
 * @typedef {Object} Goals
 * @property {number} stopWinAmount - Valor em R$ da meta de ganho
 * @property {number} stopLossAmount - Valor em R$ do limite de perda
 * @property {number} capitalInicial - Capital inicial normalizado
 * @property {number} capitalAtual - Capital atual normalizado
 * @property {number} lucroAcumulado - Diferença capitalAtual - capitalInicial
 * @property {number} restanteWinAmount - Quanto falta em R$ para atingir a meta (sem recuperação de prejuízo)
 * @property {number} restanteWinRecoveryAmount - Quanto falta em R$ considerando prejuízo atual (recuperação)
 * @property {number} restanteLossAmount - Quanto resta até bater o limite de perda
 */

/**
 * @typedef {Object} StopStatus
 * @property {number} progressoWin - Progresso da meta de ganho (0-100)
 * @property {number} riscoUsado - Risco utilizado em relação ao limite de perda (0-100)
 * @property {('Em progresso'|'Quase lá'|'Meta atingida'|'Risco alto'|'Risco máximo')} status - Estado textual
 */

/**
 * @typedef {Object} NextActionHint
 * @property {string} message - Mensagem explicativa (ex.: quantidade de vitórias faltantes)
 * @property {number|null} winsNeeded - Número de vitórias necessárias ou null se indeterminado
 */

/**
 * @typedef {Object} LockMode
 * @property {boolean} shouldLock - Se deve acionar bloqueio disciplinar
 * @property {('STOP_WIN'|'STOP_LOSS'|null)} type - Tipo de bloqueio atingido
 * @property {string|null} reason - Motivo textual
 */

/**
 * @typedef {Object} SessionProgress
 * @property {number} lucroAcumulado - Lucro/prejuízo acumulado na sessão
 */

/**
 * Clampa um número dentro de um intervalo fechado [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
    const n = Number(value);
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

/**
 * Converte percentual possivelmente inválido em número seguro [0, 100].
 * @param {unknown} perc
 * @returns {number}
 */
function sanitizePercent(perc) {
    const n = Number(perc);
    if (!isFinite(n)) return 0;
    return clamp(n, 0, 100);
}

/**
 * Converte valor monetário em número seguro (>= 0 quando base, livre quando lucro/prejuízo).
 * @param {unknown} v
 * @param {boolean} nonNegativeForBase
 * @returns {number}
 */
function sanitizeAmount(v, nonNegativeForBase = true) {
    let n = Number(v);
    if (!isFinite(n)) n = 0;
    if (nonNegativeForBase) n = Math.max(0, n);
    return n;
}

/**
 * Normaliza assinatura: aceita posição (capitalInicial, stopWinPerc, stopLossPerc, capitalAtual?)
 * ou objeto { capitalInicial, stopWinPerc, stopLossPerc, capitalAtual }.
 * @param {any} a
 * @param {any} b
 * @param {any} c
 * @param {any} d
 */
function normalizeArgs(a, b, c, d) {
    if (typeof a === 'object' && a !== null) {
        const { capitalInicial, stopWinPerc, stopLossPerc, capitalAtual } = a;
        return {
            capitalInicial: sanitizeAmount(capitalInicial, true),
            stopWinPerc: sanitizePercent(stopWinPerc),
            stopLossPerc: sanitizePercent(stopLossPerc),
            capitalAtual: sanitizeAmount(capitalAtual, false),
        };
    }
    return {
        capitalInicial: sanitizeAmount(a, true),
        stopWinPerc: sanitizePercent(b),
        stopLossPerc: sanitizePercent(c),
        capitalAtual: sanitizeAmount(d, false),
    };
}

/**
 * Calcula metas de Stop Win/Loss e métricas base.
 * Assinaturas aceitas:
 *  - computeStopGoals(capitalInicial, stopWinPerc, stopLossPerc, capitalAtual?)
 *  - computeStopGoals(GoalsInput)
 * @param {number|GoalsInput} a
 * @param {number} [b]
 * @param {number} [c]
 * @param {number} [d]
 * @returns {Goals}
 */
export function computeStopGoals(a, b, c, d) {
    const { capitalInicial, stopWinPerc, stopLossPerc, capitalAtual } = normalizeArgs(a, b, c, d);
    const stopWinAmount = capitalInicial * (stopWinPerc / 100);
    const stopLossAmount = capitalInicial * (stopLossPerc / 100);
    const lucroAcumulado = sanitizeAmount(capitalAtual, false) - capitalInicial;

    // Restantes
    const restanteWinAmount = Math.max(0, stopWinAmount - Math.max(0, lucroAcumulado));
    const restanteWinRecoveryAmount = Math.max(0, stopWinAmount - lucroAcumulado);
    const restanteLossAmount = Math.max(0, stopLossAmount - Math.max(0, -lucroAcumulado));

    return {
        stopWinAmount,
        stopLossAmount,
        capitalInicial,
        capitalAtual,
        lucroAcumulado,
        restanteWinAmount,
        restanteWinRecoveryAmount,
        restanteLossAmount,
    };
}

/**
 * Calcula progresso (%) de meta e risco utilizado com base em goals.
 * @param {Goals} goals
 * @returns {StopStatus}
 */
export function computeStopStatus(goals) {
    if (!goals || typeof goals !== 'object') {
        return { progressoWin: 0, riscoUsado: 0, status: 'Em progresso' };
    }
    const stopWinAmount = sanitizeAmount(goals.stopWinAmount, true);
    const stopLossAmount = sanitizeAmount(goals.stopLossAmount, true);
    const lucro = Number(goals.lucroAcumulado) || 0;

    const progressoWin =
        stopWinAmount > 0 && lucro > 0 ? clamp((lucro / stopWinAmount) * 100, 0, 100) : 0;
    const riscoUsado =
        stopLossAmount > 0 && lucro < 0
            ? clamp((Math.abs(lucro) / stopLossAmount) * 100, 0, 100)
            : 0;

    let status = 'Em progresso';
    if (progressoWin >= 100) status = 'Meta atingida';
    else if (riscoUsado >= 100) status = 'Risco máximo';
    else if (riscoUsado >= 70) status = 'Risco alto';
    else if (progressoWin >= 70) status = 'Quase lá';

    return { progressoWin, riscoUsado, status };
}

/**
 * Sugere próxima ação com base no lucro atual, aporte e payout.
 * @param {Goals} goals
 * @param {number} entryAmount - valor de entrada atual (R$)
 * @param {number} payoutPercent - payout em % (0-100)
 * @returns {NextActionHint}
 */
export function computeNextActionHint(goals, entryAmount, payoutPercent) {
    if (!goals || typeof goals !== 'object') return { message: 'Sem dados', winsNeeded: null };
    const lucro = Number(goals.lucroAcumulado) || 0;
    const stopWinAmount = sanitizeAmount(goals.stopWinAmount, true);
    const falta = Math.max(0, stopWinAmount - Math.max(0, lucro));
    const entrada = sanitizeAmount(entryAmount, true);
    const payout = sanitizePercent(payoutPercent) / 100; // 0..1

    if (stopWinAmount <= 0) return { message: 'Defina sua meta de Stop Win', winsNeeded: null };
    if (entrada <= 0 || payout <= 0)
        return { message: 'Defina entrada e payout válidos', winsNeeded: null };
    const ganhoPorWin = entrada * payout;
    if (ganhoPorWin <= 0) return { message: 'Parâmetros inválidos', winsNeeded: null };
    const winsNeeded = Math.ceil(falta / ganhoPorWin);
    return { message: `Precisa de +${winsNeeded} vitória(s) para atingir a meta`, winsNeeded };
}

/**
 * Determina se deve ativar modo de bloqueio (disciplinar) com base nas metas.
 * @param {Goals} goals
 * @returns {LockMode}
 */
export function computeLockMode(goals) {
    if (!goals || typeof goals !== 'object') return { shouldLock: false, type: null, reason: null };
    const lucro = Number(goals.lucroAcumulado) || 0;
    const sw = sanitizeAmount(goals.stopWinAmount, true);
    const sl = sanitizeAmount(goals.stopLossAmount, true);

    // console.log('[DEBUG] computeLockMode:', { lucro, sw, sl, goals });

    if (sw > 0 && lucro >= sw) {
        // console.log('[DEBUG] STOP_WIN ativado');
        return { shouldLock: true, type: 'STOP_WIN', reason: 'Meta de ganho atingida' };
    }
    if (sl > 0 && -lucro >= sl) {
        // console.log('[DEBUG] STOP_LOSS ativado');
        return { shouldLock: true, type: 'STOP_LOSS', reason: 'Limite de perda atingido' };
    }

    // console.log('[DEBUG] Nenhum lock ativado');
    return { shouldLock: false, type: null, reason: null };
}

/**
 * Calcula apenas o lucro acumulado a partir de capital inicial e atual.
 * @param {{capitalInicial:number, capitalAtual:number}} input
 * @returns {SessionProgress}
 */
export function computeSessionProgress(input) {
    const base = sanitizeAmount(input?.capitalInicial, true);
    const atual = sanitizeAmount(input?.capitalAtual, false);
    return { lucroAcumulado: atual - base };
}

// Exposição global opcional para compatibilidade imediata (sem editar consumidores existentes)
if (typeof window !== 'undefined') {
    try {
        if (!window.computeStopGoals) window.computeStopGoals = computeStopGoals;
        if (!window.computeStopStatus) window.computeStopStatus = computeStopStatus;
        if (!window.computeNextActionHint) window.computeNextActionHint = computeNextActionHint;
        if (!window.computeLockMode) window.computeLockMode = computeLockMode;
        if (!window.computeSessionProgress) window.computeSessionProgress = computeSessionProgress;
    } catch (_) {}
}

export default {
    computeStopGoals,
    computeStopStatus,
    computeNextActionHint,
    computeLockMode,
    computeSessionProgress,
};
