/**
 * Controller responsÃ¡vel por ligar eventos de input/select/payout
 * e manter sincronizaÃ§Ã£o bidirecional entre o card principal e o da sidebar.
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

        // Inputs principais â†’ sidebar
        this._attachInputMirror('capital-inicial', 'sidebar-capital-inicial');
        this._attachInputMirror('percentual-entrada', 'sidebar-percentual-entrada');
        this._attachInputMirror('stop-win-perc', 'sidebar-stop-win-perc');
        this._attachInputMirror('stop-loss-perc', 'sidebar-stop-loss-perc');
        this._attachSelectMirror('estrategia-select', 'sidebar-estrategia-select');

        // Sidebar pronto
        document.addEventListener('sidebarModalReady', () => {
            // Sidebar â†’ principal apÃ³s aberto
            this._attachInputMirror('sidebar-capital-inicial', 'capital-inicial');
            this._attachInputMirror('sidebar-percentual-entrada', 'percentual-entrada');
            this._attachInputMirror('sidebar-stop-win-perc', 'stop-win-perc');
            this._attachInputMirror('sidebar-stop-loss-perc', 'stop-loss-perc');
            this._attachSelectMirror('sidebar-estrategia-select', 'estrategia-select');
        });

        // Payout sync usando eventos de clique â€“ mantÃ©m compatÃ­vel com PayoutSyncManager
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
                    } catch (_) { }
                    // Propaga para o outro container atravÃ©s do manager existente
                    try {
                        if (window.realTimeSync && window.realTimeSync.syncPayoutButtons) {
                            await window.realTimeSync.syncPayoutButtons(payout, source);
                        } else if (window.payoutSync) {
                            await window.payoutSync.syncPayoutButtons(payout, source);
                        }
                    } catch (_) { }
                }
            });
        };

        forwardPayout('.payout-buttons', 'main');
        document.addEventListener('sidebarModalReady', () => {
            forwardPayout('#sidebar-parameters .payout-buttons', 'sidebar');
            // ForÃ§a estado visual do payout no clone com base no hidden atual
            const hidden = document.getElementById('payout-ativo');
            const active = hidden ? parseInt(hidden.value) : undefined;
            if (Number.isFinite(active)) {
                try {
                    if (window.realTimeSync && window.realTimeSync.syncPayoutButtons) {
                        window.realTimeSync.syncPayoutButtons(active, 'sync');
                    } else if (window.payoutSync) {
                        window.payoutSync.syncPayoutButtons(active, 'sync');
                    }
                } catch (_) { }
            }
        });

        // Event listener para botão de minimizar/expandir
        this._attachMinimizeButton('minimize-btn', 'panel-content');
        document.addEventListener('sidebarModalReady', () => {
            this._attachMinimizeButton('sidebar-minimize-btn', 'sidebar-panel-content');
        });
    }

    _attachInputMirror(sourceId, targetId) {
        const source = document.getElementById(sourceId);
        if (!source) return;
        source.addEventListener('input', (e) => {
            // Impede interferÃªncia de outros handlers sem bloquear a digitaÃ§Ã£o nativa
            e.stopPropagation();
            const target = document.getElementById(targetId);
            if (!target) return;
            if (target.value !== e.target.value) target.value = e.target.value;
            // Enter confirma alteraÃ§Ã£o
            source.addEventListener('keydown', (ke) => {
                if (ke.key === 'Enter') {
                    source.blur();
                }
            }, { once: true });
        });
        // Propaga change para que lÃ³gica existente reaja
        const commit = (e) => {
            try {
                // SanitizaÃ§Ã£o agressiva: mantÃ©m apenas dÃ­gitos e um separador decimal
                let raw = String(e.target.value).trim();
                raw = raw.replace(/\s+/g, '');
                raw = raw.replace(/,/g, '.');
                raw = raw.replace(/(?!^)[^.]/g, (m) => (/[0-9]/.test(m) ? m : '')); // remove nÃ£o dÃ­gitos exceto ponto
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
                        // Sem validador, nÃ£o bloqueia o commit; deixa lÃ³gica global tratar limites
                    }
                    const needs = window.updateState(patch);
                    // Sempre refletir capital nos estados derivados usados pela UI e emitir evento
                    if (patch.capitalInicial) {
                        try {
                            window.state.capitalInicioSessao = patch.capitalInicial;
                            window.state.capitalDeCalculo = patch.capitalInicial;
                            window.state.capitalAtual = patch.capitalInicial;
                            document.dispatchEvent(new CustomEvent('capitalAtualChanged', { detail: { value: patch.capitalInicial } }));
                        } catch (_) { }
                    }
                    if (needs && window.logic) window.logic.calcularPlano(true);
                    if (window.ui) {
                        try { window.ui.syncUIFromState?.(); } catch (_) { }
                        window.ui.atualizarTudo();
                    }
                }
            } catch (_) { }
        };
        source.addEventListener('change', commit);

        // TambÃ©m escuta perda de foco para sincronizar valores digitados sem change explÃ­cito
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
            } catch (_) { }
        });
    }

    /**
     * Adiciona funcionalidade de minimizar/expandir ao botÃ£o
     */
    _attachMinimizeButton(buttonId, contentId) {
        const button = document.getElementById(buttonId);
        const content = document.getElementById(contentId);
        
        if (!button || !content) return;

        // Encontra o elemento pai .panel ou .input-panel
        const panel = content.closest('.panel') || content.closest('.input-panel');
        if (!panel) {
            console.warn(`Painel pai não encontrado para ${contentId}`);
            return;
        }

        button.addEventListener('click', () => {
            // Toggle da classe 'minimized' no painel pai (como esperado pelo CSS)
            const isMinimized = panel.classList.toggle('minimized');
            
            // Atualiza ícone do botão
            const icon = button.querySelector('.minimize-icon');
            if (icon) {
                icon.textContent = isMinimized ? '➕' : '➖';
            }
            
            // Atualiza título
            button.title = isMinimized ? 'Expandir painel' : 'Minimizar painel';
            
            // Salva estado no localStorage
            try {
                const storageKey = buttonId.includes('sidebar') ? 'sidebar-panel-minimized' : 'main-panel-minimized';
                localStorage.setItem(storageKey, String(isMinimized));
            } catch (_) { }
        });

        // Restaura estado salvo do localStorage
        try {
            const storageKey = buttonId.includes('sidebar') ? 'sidebar-panel-minimized' : 'main-panel-minimized';
            const savedState = localStorage.getItem(storageKey);
            if (savedState === 'true') {
                panel.classList.add('minimized');
                const icon = button.querySelector('.minimize-icon');
                if (icon) icon.textContent = '➕';
                button.title = 'Expandir painel';
            }
        } catch (_) { }
    }
}

// InstÃ¢ncia global opcional
if (typeof window !== 'undefined') {
    window.ParametersCardController = ParametersCardController;
}


