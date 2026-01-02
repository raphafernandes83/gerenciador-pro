/**
 * Boot.js - Inicialização de componentes CSP-compliant
 * 
 * Projeto: Gerenciador PRO v9.3
 * Criado: 26/12/2025
 * 
 * Este arquivo substitui scripts inline no index.html para compatibilidade
 * com Content Security Policy (CSP) sem 'unsafe-inline'.
 * 
 * Componentes inicializados:
 * - HelpFAB (botão de ajuda flutuante)
 * - MetricTooltipManager (tooltips de métricas)
 * - TrashFAB (lixeira flutuante) 
 * - Service Worker
 */

// Aguarda DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    // [TAREFA 29] Inicializar Crash Radar (captura de erros)
    if (window.CrashRadar) {
        window.CrashRadar.init();
    }

    console.log('🚀 Boot.js: Iniciando componentes...');

    // Usar requestAnimationFrame para garantir que outros módulos carregaram
    requestAnimationFrame(() => {
        initHelpFAB();
        initMetricTooltipManager();
        initTrashFAB();

        // [TAREFA 9B] Aplicar preferências de UI salvas (compact-mode, zen-mode)
        initUISavedPreferences();
    });

    // Registrar Service Worker (delay para não bloquear inicialização)
    setTimeout(() => {
        initServiceWorker();
    }, 1000);
});

/**
 * Inicializa HelpFAB (botão de ajuda flutuante)
 */
function initHelpFAB() {
    try {
        if (window.HelpFAB) {
            const helpFab = new window.HelpFAB();
            helpFab.init();
            window.helpFab = helpFab;
            console.log('✅ Boot.js: HelpFAB inicializado');
        } else {
            console.warn('⚠️ Boot.js: HelpFAB não encontrado - aguardando...');
            // Retry após um delay
            setTimeout(() => {
                if (window.HelpFAB) {
                    const helpFab = new window.HelpFAB();
                    helpFab.init();
                    window.helpFab = helpFab;
                    console.log('✅ Boot.js: HelpFAB inicializado (retry)');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Boot.js: Erro ao inicializar HelpFAB:', error);
    }
}

/**
 * Inicializa MetricTooltipManager
 */
function initMetricTooltipManager() {
    try {
        if (window.MetricTooltipManager) {
            window.metricTooltips = new window.MetricTooltipManager();
            window.metricTooltips.init();
            console.log('✅ Boot.js: MetricTooltipManager ativado');
        } else {
            console.warn('⚠️ Boot.js: MetricTooltipManager não encontrado');
        }
    } catch (error) {
        console.error('❌ Boot.js: Erro ao inicializar MetricTooltipManager:', error);
    }
}

/**
 * Inicializa TrashFAB (lixeira flutuante)
 */
function initTrashFAB() {
    try {
        if (typeof window.getTrashFAB === 'function') {
            window.trashFAB = window.getTrashFAB();
            console.log('✅ Boot.js: TrashFAB inicializado');
        } else {
            console.warn('⚠️ Boot.js: getTrashFAB não encontrado - aguardando...');
            // Retry após um delay
            setTimeout(() => {
                if (typeof window.getTrashFAB === 'function') {
                    window.trashFAB = window.getTrashFAB();
                    console.log('✅ Boot.js: TrashFAB inicializado (retry)');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Boot.js: Erro ao inicializar TrashFAB:', error);
    }
}

/**
 * Registra Service Worker
 */
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Boot.js: Service Worker registrado:', registration.scope);
            })
            .catch(error => {
                console.warn('⚠️ Boot.js: Falha ao registrar Service Worker:', error);
            });
    }
}

/**
 * [TAREFA 9B] Aplica preferências de UI salvas (compact-mode, zen-mode)
 * Lê do localStorage e aplica classes no body antes da renderização completa
 */
function initUISavedPreferences() {
    try {
        // Compact Mode
        if (localStorage.getItem('ui.compactMode') === '1') {
            document.body.classList.add('compact-mode');
            const compactBtn = document.getElementById('compact-mode-btn');
            if (compactBtn) {
                compactBtn.classList.add('active');
                compactBtn.setAttribute('aria-pressed', 'true');
            }
            console.log('🗜️ Boot.js: Compact Mode restaurado');
        }

        // Zen Mode
        if (localStorage.getItem('ui.zenMode') === '1') {
            document.body.classList.add('zen-mode');
            const zenBtn = document.getElementById('zen-mode-btn');
            if (zenBtn) {
                zenBtn.classList.add('active');
                zenBtn.setAttribute('aria-pressed', 'true');
            }
            console.log('🧘 Boot.js: Zen Mode restaurado');
        }

        console.log('✅ Boot.js: Preferências de UI aplicadas');
    } catch (error) {
        console.error('❌ Boot.js: Erro ao aplicar preferências de UI:', error);
    }
}

// Fallback: Se window.load já aconteceu, inicializar imediatamente
if (document.readyState === 'complete') {
    console.log('🚀 Boot.js: DOM já carregado, inicializando imediatamente...');
    requestAnimationFrame(() => {
        initHelpFAB();
        initMetricTooltipManager();
        initTrashFAB();
    });
}
