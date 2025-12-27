// FIX v10 FINAL - Apenas define valores padrão
// A formatação está integrada no ParametersCardController
(function () {
    'use strict';

    console.log('🔧 [FIX] v10 - Solução definitiva ativa');

    const DEFAULT_CAPITAL = '10.000,00';

    // Define valor padrão nos campos de capital
    function setDefaults() {
        const fields = ['capital-inicial']; // Sidebar foi removido

        fields.forEach(id => {
            const field = document.getElementById(id);
            if (field && !field.value) {
                field.value = DEFAULT_CAPITAL;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('[FIX] ✓ Padrão', id, ':', DEFAULT_CAPITAL);
            }
        });
    }

    // Executa ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setDefaults);
    } else {
        setDefaults();
    }

    // Executa quando sidebar abrir
    document.addEventListener('sidebarModalReady', () => {
        setTimeout(setDefaults, 300);
    });

    // Tenta mais uma vez após 1 segundo
    setTimeout(setDefaults, 1000);

    console.log('[FIX] ✅ Sistema ativo - formatação integrada no código principal');

})();
