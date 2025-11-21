// src/utils/GoalsUtils.js
// Funções puras e testáveis para metas de Stop Win/Loss

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toNumber = (v, d = 0) => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || d);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const computeStopGoals = (capitalInicioSessao, stopWinPerc, stopLossPerc, capitalAtual) => {
    try {
        const base = Math.max(0, toNumber(capitalInicioSessao, 0));
        const swp = clamp(toNumber(stopWinPerc, 0), 0, 100);
        const slp = clamp(toNumber(stopLossPerc, 0), 0, 100);
        const atual = Math.max(0, toNumber(capitalAtual, base));

        const stopWinAmount = round2(base * (swp / 100));
        const stopLossAmount = round2(base * (slp / 100));
        const lucroAcumulado = round2(atual - base);

        const progressoWinPerc =
            stopWinAmount > 0
                ? clamp(round2((Math.max(0, lucroAcumulado) / stopWinAmount) * 100), 0, 100)
                : 0;

        const progressoLossPerc =
            stopLossAmount > 0
                ? clamp(
                      round2(
                          ((stopLossAmount + Math.min(0, lucroAcumulado)) / stopLossAmount) * 100
                      ),
                      0,
                      100
                  )
                : 0;

        // Falta (desde a base) e Falta considerando recuperar prejuízo
        const restanteWinAmount = round2(Math.max(0, stopWinAmount - Math.max(0, lucroAcumulado)));
        const restanteWinRecoveryAmount = round2(Math.max(0, stopWinAmount - lucroAcumulado));
        // Margem para atingir o Stop Loss (distância de lucro atual até -stopLoss)
        // Se lucro > 0, precisa perder (stopLoss + lucro). Se lucro < 0, restante é (stopLoss - |lucro|)
        const restanteLossAmount = round2(Math.max(0, stopLossAmount + lucroAcumulado));

        return {
            baseCapital: base,
            stopWinPerc: swp,
            stopLossPerc: slp,
            stopWinAmount,
            stopLossAmount,
            lucroAcumulado,
            progressoWinPerc,
            progressoLossPerc,
            restanteWinAmount,
            restanteWinRecoveryAmount,
            restanteLossAmount,
        };
    } catch (error) {
        return {
            baseCapital: 0,
            stopWinPerc: 0,
            stopLossPerc: 0,
            stopWinAmount: 0,
            stopLossAmount: 0,
            lucroAcumulado: 0,
            progressoWinPerc: 0,
            progressoLossPerc: 0,
            restanteWinAmount: 0,
            restanteLossAmount: 0,
            error: String(error),
        };
    }
};

export const formatStopGoals = (
    goals,
    formatCurrency = (n) => `R$ ${toNumber(n, 0).toFixed(2)}`,
    formatPercent = (n) => `${toNumber(n, 0).toFixed(1)}%`
) => {
    if (!goals || typeof goals !== 'object') {
        return {
            stopWinAmountText: 'R$ 0,00',
            stopLossAmountText: 'R$ 0,00',
            stopWinPercText: '0.0%',
            stopLossPercText: '0.0%',
            progressoWinText: '0.0%',
            progressoLossText: '0.0%',
            restanteWinText: 'R$ 0,00',
            restanteLossText: 'R$ 0,00',
        };
    }
    return {
        stopWinAmountText: formatCurrency(goals.stopWinAmount || 0),
        stopLossAmountText: formatCurrency(goals.stopLossAmount || 0),
        stopWinPercText: formatPercent(goals.stopWinPerc || 0),
        stopLossPercText: formatPercent(goals.stopLossPerc || 0),
        progressoWinText: formatPercent(goals.progressoWinPerc || 0),
        progressoLossText: formatPercent(goals.progressoLossPerc || 0),
        restanteWinText: formatCurrency(goals.restanteWinAmount || 0),
        restanteLossText: formatCurrency(goals.restanteLossAmount || 0),
    };
};

export const computeStopStatus = (goals) => {
    const g = goals || {};
    let winMsg = 'Vamos começar!';
    let winLevel = 'neutral';
    if (g.progressoWinPerc > 0) {
        if (g.progressoWinPerc >= 100) {
            winMsg = 'Meta atingida';
            winLevel = 'excellent';
        } else if (g.progressoWinPerc >= 90) {
            winMsg = 'Quase lá';
            winLevel = 'good';
        } else {
            winMsg = 'Em progresso';
            winLevel = 'neutral';
        }
    }

    let lossMsg = 'Controle total';
    let lossLevel = 'excellent';
    if (g.progressoLossPerc < 100) {
        if (g.progressoLossPerc <= 70) {
            lossMsg = 'Risco alto';
            lossLevel = 'warning';
        } else if (g.progressoLossPerc <= 90) {
            lossMsg = 'Atenção';
            lossLevel = 'good';
        } else {
            lossMsg = 'Controle total';
            lossLevel = 'excellent';
        }
    }

    return {
        win: { message: winMsg, level: winLevel },
        loss: { message: lossMsg, level: lossLevel },
    };
};

export const computeNextActionHint = (goals, currentEntryAmount, payoutPercent) => {
    try {
        const remaining = Math.max(0, toNumber(goals?.restanteWinAmount, 0));
        const entry = Math.max(0, toNumber(currentEntryAmount, 0));
        const payout = clamp(toNumber(payoutPercent, 0), 0, 100);

        const profitPerWin = round2(entry * (payout / 100));
        if (profitPerWin <= 0)
            return { winsNeeded: null, hint: 'Defina aporte e payout para estimativa.' };
        const winsNeeded = Math.ceil(remaining / profitPerWin);
        return {
            winsNeeded,
            hint:
                winsNeeded > 0
                    ? `Precisa de +${winsNeeded} vitória(s) com payout atual para atingir a meta.`
                    : 'Meta já atingida.',
        };
    } catch (error) {
        return { winsNeeded: null, hint: 'Estimativa indisponível.' };
    }
};

export const computeLockMode = (goals) => {
    const g = goals || {};
    const hitStopWin =
        toNumber(g.lucroAcumulado, 0) >= toNumber(g.stopWinAmount, 0) && g.stopWinAmount > 0;
    const hitStopLoss =
        -toNumber(g.lucroAcumulado, 0) >= toNumber(g.stopLossAmount, 0) && g.stopLossAmount > 0;

    let reason = null;
    if (hitStopWin) reason = 'Meta de ganho atingida';
    else if (hitStopLoss) reason = 'Limite de perda atingido';

    return {
        shouldLock: hitStopWin || hitStopLoss,
        type: hitStopWin ? 'STOP_WIN' : hitStopLoss ? 'STOP_LOSS' : null,
        reason,
    };
};

// Opcional: expor globalmente para módulos que não usam import
try {
    window.computeStopGoals = computeStopGoals;
} catch {}
try {
    window.formatStopGoals = formatStopGoals;
} catch {}
try {
    window.computeStopStatus = computeStopStatus;
} catch {}
try {
    window.computeNextActionHint = computeNextActionHint;
} catch {}
try {
    window.computeLockMode = computeLockMode;
} catch {}
