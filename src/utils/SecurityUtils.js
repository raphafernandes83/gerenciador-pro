// ================================================================
// SecurityUtils.js - Utilitários de segurança e IDs de correlação
// ================================================================

export function generateRequestId(prefix = 'req') {
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now()}_${rand}`;
}

export function safeLog(context, data = {}) {
    // Remove campos sensíveis comuns antes de logar
    const redacted = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ['authorization', 'token', 'jwt', 'password', 'anonKey', 'apikey', 'key'];
    for (const k of Object.keys(redacted)) {
        if (sensitiveKeys.includes(k.toLowerCase())) {
            redacted[k] = '***redacted***';
        }
    }
    console.log(context, redacted);
}

export function sanitizeSessionData(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const sanitized = { ...raw };
    // Normalizações defensivas
    sanitized.data = typeof sanitized.data === 'number' ? sanitized.data : Date.now();

    // 🔧 CORREÇÃO CRÍTICA: Não forçar resultadoFinanceiro para 0
    // Se inválido, recalcular a partir do histórico
    if (!Number.isFinite(sanitized.resultadoFinanceiro)) {
        const historico = Array.isArray(sanitized.historicoCombinado)
            ? sanitized.historicoCombinado
            : [];
        sanitized.resultadoFinanceiro = historico.reduce((acc, op) => {
            if (op && typeof op.valor === 'number' && !isNaN(op.valor)) {
                return acc + op.valor;
            }
            return acc;
        }, 0);

        console.warn('🔧 SecurityUtils: resultadoFinanceiro recalculado:', {
            original: raw.resultadoFinanceiro,
            recalculado: sanitized.resultadoFinanceiro,
            sessionId: raw.id,
        });
    }

    sanitized.totalOperacoes = Number.isInteger(sanitized.totalOperacoes)
        ? sanitized.totalOperacoes
        : 0;
    sanitized.modo = typeof sanitized.modo === 'string' ? sanitized.modo : 'indefinido';
    sanitized.historicoCombinado = Array.isArray(sanitized.historicoCombinado)
        ? sanitized.historicoCombinado
        : [];
    return sanitized;
}
