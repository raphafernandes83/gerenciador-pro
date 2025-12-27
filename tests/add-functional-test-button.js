/**
 * 🧪 Adiciona botão para executar testes funcionais na interface
 * Execute este script no console para adicionar o botão temporariamente
 */

function addFunctionalTestButton() {
    // Verifica se o botão já existe
    if (document.getElementById('functionalTestBtn')) {
        console.log('✅ Botão de testes funcionais já existe');
        return;
    }

    // Procura um local adequado na interface
    const targetContainer =
        document.querySelector('.sidebar-section') ||
        document.querySelector('.test-section') ||
        document.body;

    if (!targetContainer) {
        console.error('❌ Não foi possível encontrar container para o botão');
        return;
    }

    // Cria o botão
    const button = document.createElement('button');
    button.id = 'functionalTestBtn';
    button.textContent = '🧪 Testes Funcionais';
    button.style.cssText = `
        background: linear-gradient(45deg, #00e676, #00c853);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 12px 20px;
        margin: 10px 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 230, 118, 0.3);
        transition: all 0.3s ease;
        min-width: 200px;
    `;

    // Efeitos de hover
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 8px 20px rgba(0, 230, 118, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(0, 230, 118, 0.3)';
    });

    // Adiciona funcionalidade
    button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = '⏳ Executando Testes...';

        try {
            // Verifica se events está disponível
            if (typeof window.events !== 'undefined' && window.events.handleRunFunctionalTests) {
                await window.events.handleRunFunctionalTests();
            } else {
                // Fallback: execução direta
                const { functionalTests } = await import('./functional-validation.js');
                await functionalTests.runAllTests();
            }
        } catch (error) {
            console.error('❌ Erro ao executar testes funcionais:', error);
            alert(`Erro nos testes: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = '🧪 Testes Funcionais';
        }
    });

    // Adiciona à interface
    targetContainer.appendChild(button);

    console.log('✅ Botão de testes funcionais adicionado com sucesso!');

    // Retorna o botão para permitir customização adicional
    return button;
}

// Execução automática DESABILITADA para produção
// if (typeof window !== 'undefined') {
//     // Aguarda DOM estar pronto
//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', addFunctionalTestButton);
//     } else {
//         addFunctionalTestButton();
//     }
// }

// Exporta para uso programático
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addFunctionalTestButton };
}

console.log(
    '📋 Script de botão de testes funcionais carregado. Execute addFunctionalTestButton() se necessário.'
);
