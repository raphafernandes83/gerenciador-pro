/**
 * Controller responsável por ligar eventos de input/select/payout
 * e manter sincronização bidirecional entre o card principal e o da sidebar.
 */
export class ParametersCardController {
    constructor() {
        this.bound = false;
    }

    /**
     * Associa listeners aos elementos dos dois cards. Idempotente.
     */
    bindEventHandlers() {
        if (this.bound) return;
        this.bound = true;

        // Inputs principais → sidebar
        this._attachInputMirror('capital-inicial', 'sidebar-capital-inicial');
        this._attachInputMirror('percentual-entrada', 'sidebar-percentual-entrada');
        this._attachInputMirror('stop-win-perc', 'sidebar-stop-win-perc');
        this._attachInputMirror('stop-loss-perc', 'sidebar-stop-loss-perc');
        this._attachSelectMirror('estrategia-select', 'sidebar-estrategia-select');

        // Sidebar pronto
        document.addEventListener('sidebarModalReady', () => {
            // Sidebar → principal após aberto
            this._attachInputMirror('sidebar-capital-inicial', 'capital-inicial');
            this._attachInputMirror('sidebar-percentual-entrada', 'percentual-entrada');
            this._attachInputMirror('sidebar-stop-win-perc', 'stop-win-perc');
            this._attachInputMirror('sidebar-stop-loss-perc', 'stop-loss-perc');
            this._attachSelectMirror('sidebar-estrategia-select', 'estrategia-select');
        });

        // Payout sync usando eventos de clique – mantém compatível com PayoutSyncManager
        const forwardPayout = (containerSelector, source) => {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            container.addEventListener('click', async (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const payout = parseInt(e.target.getAttribute('data-payout') || e.target.textContent);
                    // Atualiza estado global
                    try {
                        if (window.updateState) {
                            const needs = window.updateState({ payout });
                            if (needs && window.logic) await window.logic.calcularPlano(true);
                        }
                        if (window.ui) window.ui.atualizarTudo();
                    } catch (_) {}
                    // Propaga para o outro container através do manager existente
                    try {
                        if (window.realTimeSync && window.realTimeSync.syncPayoutButtons) {
                            await window.realTimeSync.syncPayoutButtons(payout, source);
                        } else if (window.payoutSync) {
                            await window.payoutSync.syncPayoutButtons(payout, source);
                        }
                    } catch (_) {}
                }
            });
        };

        forwardPayout('.payout-buttons', 'main');
        document.addEventListener('sidebarModalReady', () => {
            forwardPayout('#sidebar-parameters .payout-buttons', 'sidebar');
            // Força estado visual do payout no clone com base no hidden atual
            const hidden = document.getElementById('payout-ativo');
            const active = hidden ? parseInt(hidden.value) : undefined;
            if (Number.isFinite(active)) {
                try {
                    if (window.realTimeSync && window.realTimeSync.syncPayoutButtons) {
                        window.realTimeSync.syncPayoutButtons(active, 'sync');
                    } else if (window.payoutSync) {
                        window.payoutSync.syncPayoutButtons(active, 'sync');
                    }
                } catch (_) {}
            }
        });
    }

    _attachInputMirror(sourceId, targetId) {
        const source = document.getElementById(sourceId);
        if (!source) return;
        source.addEventListener('input', (e) => {
            // Impede interferência de outros handlers sem bloquear a digitação nativa
            e.stopPropagation();
            const target = document.getElementById(targetId);
            if (!target) return;
            if (target.value !== e.target.value) target.value = e.target.value;
            // Enter confirma alteração
            source.addEventListener('keydown', (ke) => {
                if (ke.key === 'Enter') {
                    source.blur();
                }
            }, { once: true });
        });
        // Propaga change para que lógica existente reaja
        const commit = (e) => {
            try {
                // Sanitização agressiva: mantém apenas dígitos e um separador decimal
                let raw = String(e.target.value).trim();
                raw = raw.replace(/\s+/g, '');
                raw = raw.replace(/,/g, '.');
                raw = raw.replace(/(?!^)[^.]/g, (m) => (/[0-9]/.test(m) ? m : '')); // remove não dígitos exceto ponto
                const n = Number(raw);
                const patch = {};
                if (sourceId.includes('capital-inicial')) patch.capitalInicial = n;
                if (sourceId.includes('percentual-entrada')) patch.percentualEntrada = n;
                if (sourceId.includes('stop-win-perc')) patch.stopWinPerc = n;
                if (sourceId.includes('stop-loss-perc')) patch.stopLossPerc = n;
                if (Object.keys(patch).length && window.updateState) {
                    if (sourceId.includes('capital-inicial') && !(window.validation?.isValidCapital(n))) {
                        source.title = 'Capital deve ser > 0';
                        source.classList.add('input-validation-warning');
                        setTimeout(() => source.classList.remove('input-validation-warning'), 800);
                        return;
                    }
                    if (
                        (sourceId.includes('percentual-entrada') ||
                            sourceId.includes('stop-win-perc') ||
                            sourceId.includes('stop-loss-perc'))
                    ) {
                        const hasValidator = typeof window.validation?.isValidPercentage === 'function';
                        if (hasValidator && window.validation && !window.validation.isValidPercentage(n)) {
                            source.title = 'Percentual deve estar entre 0 e 100';
                            source.classList.add('input-validation-warning');
                            setTimeout(() => source.classList.remove('input-validation-warning'), 800);
                            return;
                        }
                        // Sem validador, não bloqueia o commit; deixa lógica global tratar limites
                    }
                    const needs = window.updateState(patch);
                    // Sempre refletir capital nos estados derivados usados pela UI e emitir evento
                    if (patch.capitalInicial) {
                        try {
                            window.state.capitalInicioSessao = patch.capitalInicial;
                            window.state.capitalDeCalculo = patch.capitalInicial;
                            window.state.capitalAtual = patch.capitalInicial;
                            document.dispatchEvent(new CustomEvent('capitalAtualChanged', { detail: { value: patch.capitalInicial } }));
                        } catch (_) {}
                    }
                    if (needs && window.logic) window.logic.calcularPlano(true);
                    if (window.ui) {
                        try { window.ui.syncUIFromState?.(); } catch (_) {}
                        window.ui.atualizarTudo();
                    }
                }
            } catch (_) {}
        };
        source.addEventListener('change', commit);

        // Também escuta perda de foco para sincronizar valores digitados sem change explícito
        source.addEventListener('blur', (e) => {
            const target = document.getElementById(targetId);
            if (target && target.value !== e.target.value) target.value = e.target.value;
            commit(e);
        });
    }

    _attachSelectMirror(sourceId, targetId) {
        const source = document.getElementById(sourceId);
        if (!source) return;
        source.addEventListener('change', (e) => {
            const target = document.getElementById(targetId);
            if (target && target.value !== e.target.value) target.value = e.target.value;
            try {
                if (window.updateState) {
                    const needs = window.updateState({ estrategiaAtiva: e.target.value });
                    if (needs && window.logic) window.logic.calcularPlano(true);
                    if (window.ui) window.ui.atualizarTudo();
                }
            } catch (_) {}
        });
    }
}

// Instância global opcional
if (typeof window !== 'undefined') {
    window.ParametersCardController = ParametersCardController;
}


