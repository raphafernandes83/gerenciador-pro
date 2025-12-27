// 🛡️ Validação de Inputs Numéricos
// Bloqueia caracteres inválidos, limpa automaticamente e formata valores

(function () {
    'use strict';

    // Função para permitir apenas números e decimais
    function onlyNumbers(event) {
        const key = event.key;
        const input = event.target;
        const currentValue = input.value;

        // Permite: números, backspace, delete, tab, escape, enter, setas
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

        // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X,  Ctrl+Z
        if (event.ctrlKey || event.metaKey) {
            return true;
        }

        // Se for tecla permitida, deixa passar
        if (allowedKeys.includes(key)) {
            return true;
        }

        // Permite ponto e vírgula (apenas um)
        if ((key === '.' || key === ',') && !currentValue.includes('.') && !currentValue.includes(',')) {
            return true;
        }

        // Permite apenas números 0-9
        if (!/^\d$/.test(key)) {
            event.preventDefault();
            return false;
        }
    }

    // Função para limpar caracteres inválidos
    function cleanInvalidChars(input) {
        let value = input.value;

        // Remove tudo exceto números, ponto e vírgula
        value = value.replace(/[^\d.,]/g, '');

        // IMPORTANTE: NÃO converte vírgula para ponto!
        // Mantém formato brasileiro (vírgula = decimal, ponto = milhar)
        // A conversão será feita pelo parseBrazilianNumber no commit

        input.value = value;
    }

    // Aplica validação nos campos numéricos
    function setupValidation() {
        // Lista de IDs dos campos numéricos
        const numericFields = [
            'capital-inicial',
            'percentual-entrada',
            'stop-win-perc',
            'stop-loss-perc',
            'sidebar-capital-inicial',
            'sidebar-percentual-entrada',
            'sidebar-stop-win-perc',
            'sidebar-stop-loss-perc'
        ];

        numericFields.forEach(function (fieldId) {
            const field = document.getElementById(fieldId);
            if (field) {
                // Bloqueia digitação de caracteres inválidos
                field.addEventListener('keydown', onlyNumbers);

                // Limpa caracteres inválidos ao colar
                field.addEventListener('paste', function (e) {
                    setTimeout(function () {
                        cleanInvalidChars(field);
                    }, 10);
                });

                // Limpa caracteres inválidos ao perder foco
                field.addEventListener('blur', function () {
                    cleanInvalidChars(field);
                });

                // Limpa caracteres inválidos enquanto digita (fallback)
                field.addEventListener('input', function () {
                    cleanInvalidChars(field);
                });
            }
        });
    }

    // Aguarda DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupValidation);
    } else {
        setupValidation();
    }

    // Também tenta aplicar após 1 segundo (para campos carregados dinamicamente)
    setTimeout(setupValidation, 1000);

})();
