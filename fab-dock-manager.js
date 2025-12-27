/**
 * FAB Position Manager
 * Mantém FABs grudados na borda direita do container
 * Com fade-in escalonado profissional
 * 
 * 🔧 FIX 24/12/2024: 
 * - Recalcula posição quando sidebar muda de estado
 * - Delay inicial para aguardar sidebar carregar estado salvo
 * - FABs começam invisíveis e só aparecem quando posicionados corretamente
 */

(function () {
    'use strict';

    let positionInterval = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    // 🔧 FIX: Delay inicial para aguardar sidebar carregar estado do localStorage
    const INITIAL_DELAY = 500;

    // Controle de quais FABs já foram animados
    const animated = { help: false, trash: false, settings: false };

    // Flag para indicar que posicionamento inicial foi feito
    let initialPositionDone = false;

    function initFabPosition() {
        // 🔧 FIX: Aguarda sidebar carregar antes de posicionar FABs
        setTimeout(() => {
            positionInterval = setInterval(tryPositionFabs, 100);
            tryPositionFabs();
        }, INITIAL_DELAY);

        // Listeners para recalcular posição
        window.addEventListener('resize', positionFabsOnly);

        // 🔧 FIX: Escuta eventos da sidebar para reposicionar FABs
        document.addEventListener('sidebar:expand', () => {
            setTimeout(positionFabsOnly, 400);
        });
        document.addEventListener('sidebar:collapse', () => {
            setTimeout(positionFabsOnly, 400);
        });

        // 🔧 FIX: Escuta evento de inicialização completa
        document.addEventListener('app:initialized', () => {
            setTimeout(positionFabsOnly, 100);
        });
    }

    function tryPositionFabs() {
        attempts++;

        const container = document.getElementById('container') || document.querySelector('.container');
        if (!container) return;

        // 🔧 FIX: Verifica se container tem dimensões válidas
        const containerRect = container.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.right <= 0) {
            return; // Aguarda container estar visível
        }

        const settingsFab = document.querySelector('.trader-settings-floating-btn') || document.querySelector('#trader-settings-btn');
        const trashFab = document.querySelector('.trash-fab') || document.querySelector('#trash-fab');
        const helpFab = document.querySelector('.help-fab');

        const leftPosition = containerRect.right + 10;

        // Ordem original: Config (topo), Lixeira (meio), Ajuda (baixo)

        if (settingsFab) {
            positionSingleFab(settingsFab, leftPosition, 140);
            if (!animated.settings) {
                // 🔧 FIX: Pequeno delay extra na primeira vez para garantir posição correta
                const delay = initialPositionDone ? 100 : 200;
                setTimeout(() => {
                    settingsFab.classList.add('fab-visible');
                }, delay);
                animated.settings = true;
            }
        }

        if (trashFab) {
            positionSingleFab(trashFab, leftPosition, 80);
            if (!animated.trash) {
                const delay = initialPositionDone ? 250 : 350;
                setTimeout(() => {
                    trashFab.classList.add('fab-visible');
                }, delay);
                animated.trash = true;
            }
        }

        if (helpFab) {
            positionSingleFab(helpFab, leftPosition, 20);
            if (!animated.help) {
                const delay = initialPositionDone ? 400 : 500;
                setTimeout(() => {
                    helpFab.classList.add('fab-visible');
                }, delay);
                animated.help = true;
            }
        }

        initialPositionDone = true;

        // Para após todos animados ou MAX_ATTEMPTS
        if ((animated.help && animated.trash && animated.settings) || attempts >= MAX_ATTEMPTS) {
            if (positionInterval) {
                clearInterval(positionInterval);
                positionInterval = null;
            }
        }
    }

    function positionSingleFab(fab, leftPosition, bottom) {
        fab.style.position = 'fixed';
        fab.style.bottom = bottom + 'px';
        fab.style.zIndex = '9999';
        fab.style.right = 'auto';
        fab.style.left = leftPosition + 'px';
    }

    function positionFabsOnly() {
        const container = document.getElementById('container') || document.querySelector('.container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();

        // 🔧 FIX: Não reposiciona se container não estiver visível
        if (containerRect.width === 0 || containerRect.right <= 0) return;

        const fabsConfig = [
            { el: document.querySelector('.trader-settings-floating-btn') || document.querySelector('#trader-settings-btn'), bottom: 140 },
            { el: document.querySelector('.trash-fab') || document.querySelector('#trash-fab'), bottom: 80 },
            { el: document.querySelector('.help-fab'), bottom: 20 }
        ];

        const leftPosition = containerRect.right + 10;

        fabsConfig.forEach(fab => {
            if (fab.el) {
                fab.el.style.left = leftPosition + 'px';
                fab.el.style.bottom = fab.bottom + 'px';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFabPosition);
    } else {
        initFabPosition();
    }

})();
