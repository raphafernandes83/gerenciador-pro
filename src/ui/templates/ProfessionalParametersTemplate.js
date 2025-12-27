/**
 * Template PROFISSIONAL do painel verde - Parâmetros e Controles
 * Usa classes CSS do sidebar.css (linhas 1285-1338)
 */
export function generateProfessionalParametersHTML({ values = {} } = {}) {
    const cfg = (typeof window !== 'undefined' && window.config) ? window.config : {};
    const resolved = {
        capitalInicial: Number(values.capitalInicial ?? cfg.capitalInicial ?? 10000),
        percentualEntrada: Number(values.percentualEntrada ?? cfg.percentualEntrada ?? 2.0),
        stopWinPerc: Number(values.stopWinPerc ?? cfg.stopWinPerc ?? 10),
        stopLossPerc: Number(values.stopLossPerc ?? cfg.stopLossPerc ?? 15),
        estrategia: String(values.estrategia ?? cfg.estrategiaAtiva ?? 'ciclos'),
        payout: Number(values.payout ?? cfg.payout ?? 87),
    };

    const estrategiaLabel = resolved.estrategia === 'ciclos' ? 'Ciclos' : 'Fixa';

    return `
        <div class="parameters-card">
            <h3 class="parameters-title">Parâmetros e Controles</h3>
            <div class="parameters-grid">
                <div class="param-item">
                    <span class="param-label">Capital Inicial</span>
                    <span class="param-value">R$ ${resolved.capitalInicial.toLocaleString('pt-BR')}</span>
                </div>
                <div class="param-item">
                    <span class="param-label">Entrada Inicial</span>
                    <span class="param-value">${resolved.percentualEntrada}%</span>
                </div>
                <div class="param-item">
                    <span class="param-label">Meta</span>
                    <span class="param-value">${resolved.stopWinPerc}%</span>
                </div>
                <div class="param-item">
                    <span class="param-label">Stop Loss</span>
                    <span class="param-value">${resolved.stopLossPerc}%</span>
                </div>
                <div class="param-item">
                    <span class="param-label">Estratégia</span>
                    <span class="param-value">${estrategiaLabel}</span>
                </div>
                <div class="param-item">
                    <span class="param-label">Payout</span>
                    <span class="param-value">${resolved.payout}%</span>
                </div>
            </div>
        </div>
    `;
}

// Exporta também para compatibilidade
export { generateProfessionalParametersHTML as generateParametersCardHTML };
