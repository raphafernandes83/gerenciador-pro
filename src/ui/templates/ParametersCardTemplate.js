/**
 * Gera o HTML do card "Parâmetros e Controles" com IDs parametrizáveis.
 * - Quando idPrefix === '' renderiza o card principal com IDs originais
 * - Quando idPrefix === 'sidebar-' renderiza a versão da sidebar com IDs únicos
 */
export function generateParametersCardHTML({ idPrefix = '', values = {} } = {}) {
    const id = (base) => `${idPrefix}${base}`;
    const payoutHiddenId = idPrefix ? 'sidebar-payout-ativo' : 'payout-ativo';
    const payoutContainerId = idPrefix ? 'sidebar-payout-buttons' : '';

    // Resolve valores iniciais: DOM → config → defaults
    const cfg = (typeof window !== 'undefined' && window.config) ? window.config : {};
    const resolved = {
        capitalInicial: Number(values.capitalInicial ?? cfg.capitalInicial ?? 10000),
        percentualEntrada: Number(values.percentualEntrada ?? cfg.percentualEntrada ?? 2.0),
        stopWinPerc: Number(values.stopWinPerc ?? cfg.stopWinPerc ?? 10),
        stopLossPerc: Number(values.stopLossPerc ?? cfg.stopLossPerc ?? 15),
        estrategia: String(values.estrategia ?? cfg.estrategiaAtiva ?? 'ciclos'),
        payout: Number(values.payout ?? cfg.payout ?? 87),
    };

    const isSelected = (opt) => (resolved.estrategia === opt ? 'selected' : '');
    const activePayoutClass = (n) => (Number(resolved.payout) === Number(n) ? 'active-payout' : '');

    return `
        <div class="panel-header">
            <h2>Parâmetros e Controles</h2>
            <button class="panel-minimize-btn" id="${id('minimize-btn')}" title="Minimizar/Expandir painel">
                <span class="minimize-icon">➖</span>
            </button>
        </div>
        <div class="panel-content" id="${id('panel-content')}">
        <div class="input-grid">
            <div class="input-group">
                <label for="${id('capital-inicial')}">Capital Inicial (R$)</label>
                <input type="text" inputmode="decimal" pattern="[0-9]+([\.,][0-9]{0,2})?" id="${id('capital-inicial')}" value="${resolved.capitalInicial}" />
            </div>
            <div class="input-group">
                <label for="${id('percentual-entrada')}">Entrada Inicial (%)</label>
                <input type="text" inputmode="decimal" pattern="[0-9]+([\.,][0-9]{0,1})?" id="${id('percentual-entrada')}" value="${resolved.percentualEntrada}" />
            </div>
        </div>
        <div class="input-grid">
            <div class="input-group">
                <label for="${id('stop-win-perc')}">Meta (%)</label>
                <input type="number" id="${id('stop-win-perc')}" value="${resolved.stopWinPerc}" min="0" max="100" step="0.1" />
            </div>
            <div class="input-group">
                <label for="${id('stop-loss-perc')}">Stop Loss (%)</label>
                <input type="number" id="${id('stop-loss-perc')}" value="${resolved.stopLossPerc}" min="0" max="100" step="0.1" />
            </div>
        </div>

        <div class="input-group mt-10">
            <label for="${id('estrategia-select')}">
                Tipo de Estratégia
                <button class="help-icon" data-metric="settings-strategy-type" data-value="recovery" aria-label="Ajuda sobre Tipo de Estratégia" title="Clique para mais informações" type="button">
                    <span class="icon">?</span>
                </button>
            </label>
            <select id="${id('estrategia-select')}">
                <option value="ciclos" ${isSelected('ciclos')}>Ciclos de Recuperação</option>
                <option value="fixa" ${isSelected('fixa')}>Mão Fixa</option>
            </select>
            <p id="strategy-recommendation"></p>
        </div>

        <label>Payout (%)</label>
        <input type="hidden" id="${payoutHiddenId}" value="${resolved.payout}" />
        <div class="payout-buttons" ${payoutContainerId ? `id="${payoutContainerId}"` : ''}>
            <button class="payout-standard ${activePayoutClass(87)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="87" id="${idPrefix ? 'sidebar-payout-87' : ''}">87</button>
            <button class="payout-good ${activePayoutClass(88)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="88" id="${idPrefix ? 'sidebar-payout-88' : ''}">88</button>
            <button class="payout-good ${activePayoutClass(89)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="89" id="${idPrefix ? 'sidebar-payout-89' : ''}">89</button>
            <button class="payout-good ${activePayoutClass(90)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="90" id="${idPrefix ? 'sidebar-payout-90' : ''}">90</button>
            <button class="payout-good ${activePayoutClass(91)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="91" id="${idPrefix ? 'sidebar-payout-91' : ''}">91</button>
            <button class="payout-good ${activePayoutClass(92)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="92" id="${idPrefix ? 'sidebar-payout-92' : ''}">92</button>
            <button class="payout-premium ${activePayoutClass(99)}" ${idPrefix ? 'data-source="sidebar"' : ''} data-payout="99" id="${idPrefix ? 'sidebar-payout-99' : ''}">99</button>
        </div>
        ${idPrefix ? `
        <div class="session-actions">
            <button id="sidebar-new-session-btn" class="btn btn-primary" aria-label="Iniciar nova sessão">
                Nova Sessão
            </button>
        </div>
        ` : ''}
        </div>
    `;
}

/**
 * Renderiza o card dentro de um container existente, substituindo seu conteúdo.
 */
export function renderParametersCardIn(container, { idPrefix = '', values = {} } = {}) {
    if (!container) return false;
    container.innerHTML = generateParametersCardHTML({ idPrefix, values });
    return true;
}


