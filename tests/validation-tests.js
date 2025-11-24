/**
 * Casos de Teste - Sistema de Validação
 * Define os testes automatizados para validação de inputs
 */

import { addTest } from './AutomatedTestRunner.js';

// ============================================
// TESTE 1: Validação de Capital Inicial
// ============================================

addTest({
    name: "Validação de Capital Inicial - Valor Inválido (texto)",
    description: "Verifica se campo rejeita texto não-numérico",
    steps: [
        {
            description: "Focar no campo capital-inicial",
            action: "click",
            params: { selector: "#capital-inicial" }
        },
        {
            description: "Digitar valor inválido 'abc'",
            action: "type",
            params: { selector: "#capital-inicial", value: "abc" }
        },
        {
            description: "Sair do campo (blur)",
            action: "click",
            params: { selector: "body" }
        },
        {
            description: "Aguardar validação",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de erro",
            action: "checkClass",
            params: { selector: "#capital-inicial", className: "input-invalid" },
            expectedResult: { equals: true }
        }
    ]
});

addTest({
    name: "Validação de Capital Inicial - Valor Válido",
    description: "Verifica se campo aceita valor numérico válido",
    steps: [
        {
            description: "Focar no campo capital-inicial",
            action: "click",
            params: { selector: "#capital-inicial" }
        },
        {
            description: "Digitar valor válido '1000'",
            action: "type",
            params: { selector: "#capital-inicial", value: "1000" }
        },
        {
            description: "Sair do campo (blur)",
            action: "click",
            params: { selector: "body" }
        },
        {
            description: "Aguardar validação",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de sucesso",
            action: "checkClass",
            params: { selector: "#capital-inicial", className: "input-valid" },
            expectedResult: { equals: true }
        }
    ]
});

// ============================================
// TESTE 2: Sanitização de Vírgula
// ============================================

addTest({
    name: "Sanitização - Conversão de Vírgula para Ponto",
    description: "Verifica se vírgula é convertida para ponto automaticamente",
    steps: [
        {
            description: "Focar no campo capital-inicial",
            action: "click",
            params: { selector: "#capital-inicial" }
        },
        {
            description: "Digitar valor com vírgula '1.500,50'",
            action: "type",
            params: { selector: "#capital-inicial", value: "1500,50" }
        },
        {
            description: "Sair do campo",
            action: "click",
            params: { selector: "body" }
        },
        {
            description: "Aguardar sanitização",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de sucesso",
            action: "checkClass",
            params: { selector: "#capital-inicial", className: "input-valid" },
            expectedResult: { equals: true }
        }
    ]
});

// ============================================
// TESTE 3: Validação de Percentual de Entrada
// ============================================

addTest({
    name: "Validação de Percentual - Valor acima de 100%",
    description: "Verifica se campo rejeita valor maior que 100%",
    steps: [
        {
            description: "Digitar valor inválido '150' em percentual-entrada",
            action: "type",
            params: { selector: "#percentual-entrada", value: "150" }
        },
        {
            description: "Sair do campo",
            action: "click",
            params: { selector: "body" }
        },
        {
            description: "Aguardar validação",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de erro",
            action: "checkClass",
            params: { selector: "#percentual-entrada", className: "input-invalid" },
            expectedResult: { equals: true }
        }
    ]
});

addTest({
    name: "Validação de Percentual - Valor Válido",
    description: "Verifica se campo aceita percentual válido",
    steps: [
        {
            description: "Digitar valor válido '2.5' em percentual-entrada",
            action: "type",
            params: { selector: "#percentual-entrada", value: "2.5" }
        },
        {
            description: "Sair do campo",
            action: "click",
            params: { selector: "body" }
        },
        {
            description: "Aguardar validação",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de sucesso",
            action: "checkClass",
            params: { selector: "#percentual-entrada", className: "input-valid" },
            expectedResult: { equals: true }
        }
    ]
});

// ============================================
// TESTE 4: Bloqueio de Nova Sessão
// ============================================

addTest({
    name: "Bloqueio de Nova Sessão com Dados Inválidos",
    description: "Verifica se nova sessão é bloqueada com dados inválidos",
    steps: [
        {
            description: "Limpar campo capital-inicial",
            action: "type",
            params: { selector: "#capital-inicial", value: "" }
        },
        {
            description: "Clicar em Nova Sessão",
            action: "click",
            params: { selector: "#new-session-btn" }
        },
        {
            description: "Aguardar processamento",
            action: "wait",
            params: { duration: 500 }
        },
        {
            description: "Verificar se modal de sessão NÃO apareceu",
            action: "checkVisible",
            params: { selector: "#session-mode-modal" },
            expectedResult: { equals: false }
        }
    ]
});

// ============================================
// TESTE 5: Início de Sessão com Dados Válidos
// ============================================

addTest({
    name: "Início de Sessão com Dados Válidos",
    description: "Verifica se sessão inicia com todos os dados corretos",
    steps: [
        {
            description: "Preencher capital-inicial",
            action: "type",
            params: { selector: "#capital-inicial", value: "1000" }
        },
        {
            description: "Preencher percentual-entrada",
            action: "type",
            params: { selector: "#percentual-entrada", value: "2.5" }
        },
        {
            description: "Preencher stop-win-perc",
            action: "type",
            params: { selector: "#stop-win-perc", value: "10" }
        },
        {
            description: "Preencher stop-loss-perc",
            action: "type",
            params: { selector: "#stop-loss-perc", value: "15" }
        },
        {
            description: "Aguardar validações",
            action: "wait",
            params: { duration: 500 }
        },
        {
            description: "Clicar em Nova Sessão",
            action: "click",
            params: { selector: "#new-session-btn" }
        },
        {
            description: "Aguardar modal",
            action: "wait",
            params: { duration: 500 }
        },
        {
            description: "Verificar se modal de sessão apareceu",
            action: "checkVisible",
            params: { selector: "#session-mode-modal" },
            expectedResult: { equals: true }
        }
    ]
});

// ============================================
// TESTE 6: Validação Customizada
// ============================================

addTest({
    name: "Teste Customizado - Função de Validação Global",
    description: "Testa função window.validateField",
    steps: [
        {
            description: "Executar validação customizada",
            action: "custom",
            params: {
                function: () => {
                    if (typeof window.validateField !== 'function') {
                        throw new Error('window.validateField não está disponível');
                    }

                    const result = window.validateField('capitalInicial', '1000');

                    if (!result.valid) {
                        throw new Error('Validação deveria passar para valor 1000');
                    }

                    if (result.value !== 1000) {
                        throw new Error(`Valor sanitizado incorreto: ${result.value}`);
                    }

                    return true;
                }
            },
            expectedResult: (result) => result === true
        }
    ]
});

console.log('✅ Casos de teste carregados com sucesso!');
console.log(`📊 Total de testes: ${window.testSuite.tests.length}`);
