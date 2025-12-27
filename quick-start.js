// ⚡ Atalho Alt+P - Foca no Capital Inicial
// Atalho de produtividade para traders começarem a operar rapidamente

(function () {
    'use strict';

    // Função para aguardar elemento estar disponível
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(function () {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (++attempts >= maxAttempts) {
                clearInterval(interval);
                console.warn('Alt+P: Campo capital-inicial não encontrado');
            }
        }, 100);
    }

    // Atalho Alt+P
    document.addEventListener('keydown', function (e) {
        if (e.altKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();

            // Vai para aba "Plano de Operações"
            const planoTab = document.querySelector('.tab-button[data-tab="plano"]');
            if (planoTab && !planoTab.classList.contains('active')) {
                planoTab.click();
            }

            // Aguarda e foca no capital inicial
            waitForElement('#capital-inicial', function (element) {
                element.focus();
                element.select(); // Seleciona texto para digitação rápida

                // Scroll suave
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        }
    });

})();
