// 🧪 SCRIPT DE TESTE PARA CHECKPOINTS
// Execute este código no Console do navegador (F12) para verificar estado atual

(function testCheckpoint() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTE DE CHECKPOINT - Sistema de Verificação');
    console.log('='.repeat(60) + '\n');

    const tests = [];
    const startTime = performance.now();

    // ============================================
    // TESTES DE MÓDULOS FUNDAMENTAIS
    // ============================================

    console.log('📦 Verificando Módulos Fundamentais...\n');

    // Teste 1: Window Objects
    tests.push({
        category: 'Módulos',
        name: 'window.state existe',
        pass: typeof window.state !== 'undefined',
        expected: 'objeto',
        actual: typeof window.state
    });

    tests.push({
        category: 'Módulos',
        name: 'window.dom existe',
        pass: typeof window.dom !== 'undefined',
        expected: 'objeto',
        actual: typeof window.dom
    });

    tests.push({
        category: 'Módulos',
        name: 'window.charts existe',
        pass: typeof window.charts !== 'undefined',
        expected: 'objeto',
        actual: typeof window.charts
    });

    tests.push({
        category: 'Módulos',
        name: 'window.ui existe',
        pass: typeof window.ui !== 'undefined',
        expected: 'objeto',
        actual: typeof window.ui
    });

    tests.push({
        category: 'Módulos',
        name: 'window.logic existe',
        pass: typeof window.logic !== 'undefined',
        expected: 'objeto',
        actual: typeof window.logic
    });

    // ============================================
    // TESTES DE NOVOS MÓDULOS (Refatoração)
    // ============================================

    console.log('🆕 Verificando Módulos de Refatoração...\n');

    tests.push({
        category: 'Refatoração',
        name: 'StateManager disponível',
        pass: typeof window.stateManager !== 'undefined',
        expected: 'objeto ou undefined (se não implementado)',
        actual: typeof window.stateManager,
        optional: true
    });

    tests.push({
        category: 'Refatoração',
        name: 'DOMManager disponível',
        pass: typeof window.domManager !== 'undefined',
        expected: 'objeto ou undefined (se não implementado)',
        actual: typeof window.domManager,
        optional: true
    });

    tests.push({
        category: 'Refatoração',
        name: 'EventBus disponível',
        pass: typeof window.eventBus !== 'undefined',
        expected: 'objeto ou undefined (se não implementado)',
        actual: typeof window.eventBus,
        optional: true
    });

    // ============================================
    // TESTES DE ESTADO
    // ============================================

    console.log('📊 Verificando Estado da Aplicação...\n');

    try {
        const state = window.state;
        tests.push({
            category: 'Estado',
            name: 'Estado acessível',
            pass: state !== null && state !== undefined,
            expected: 'objeto válido',
            actual: typeof state
        });

        tests.push({
            category: 'Estado',
            name: 'capitalAtual definido',
            pass: typeof state.capitalAtual !== 'undefined',
            expected: 'number',
            actual: typeof state.capitalAtual
        });

        tests.push({
            category: 'Estado',
            name: 'isSessionActive definido',
            pass: typeof state.isSessionActive !== 'undefined',
            expected: 'boolean',
            actual: typeof state.isSessionActive
        });
    } catch (e) {
        tests.push({
            category: 'Estado',
            name: 'Acesso ao estado',
            pass: false,
            expected: 'sem erro',
            actual: `Erro: ${e.message}`,
            error: e
        });
    }

    // ============================================
    // TESTES DE DOM
    // ============================================

    console.log('🎨 Verificando Elementos DOM...\n');

    const criticalElements = [
        '#capital-inicial',
        '#capital-atual',
        '#lucro-prejuizo',
        '#new-session-btn',
        '#finish-session-btn'
    ];

    const elementsFound = criticalElements.filter(sel => document.querySelector(sel) !== null);
    tests.push({
        category: 'DOM',
        name: 'Elementos críticos presentes',
        pass: elementsFound.length === criticalElements.length,
        expected: `${criticalElements.length} elementos`,
        actual: `${elementsFound.length} elementos encontrados`
    });

    tests.push({
        category: 'DOM',
        name: 'Body tem classes de tema',
        pass: document.body.classList.length > 0,
        expected: 'classes presentes',
        actual: `${document.body.classList.length} classes`
    });

    // ============================================
    // TESTES DE CONSOLE (Erros)
    // ============================================

    console.log('🐛 Verificando Console de Erros...\n');

    // Nota: Este teste é informativo, pois erros anteriores já ocorreram
    tests.push({
        category: 'Console',
        name: 'Console disponível',
        pass: typeof console !== 'undefined',
        expected: 'objeto console',
        actual: typeof console,
        info: 'Verifique manualmente se há erros vermelhos no console'
    });

    // ============================================
    // TESTES DE FUNCIONALIDADE
    // ============================================

    console.log('⚙️ Verificando Funcionalidades...\n');

    // Verificar se Charts.js está carregado
    tests.push({
        category: 'Funcionalidade',
        name: 'Chart.js carregado',
        pass: typeof Chart !== 'undefined',
        expected: 'função Chart',
        actual: typeof Chart
    });

    // Verificar localStorage
    try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        tests.push({
            category: 'Funcionalidade',
            name: 'localStorage funcional',
            pass: true,
            expected: 'operação bem-sucedida',
            actual: 'OK'
        });
    } catch (e) {
        tests.push({
            category: 'Funcionalidade',
            name: 'localStorage funcional',
            pass: false,
            expected: 'operação bem-sucedida',
            actual: `Erro: ${e.message}`
        });
    }

    // ============================================
    // RESULTADOS
    // ============================================

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    const categories = [...new Set(tests.map(t => t.category))];
    const requiredTests = tests.filter(t => !t.optional);
    const optionalTests = tests.filter(t => t.optional);

    const requiredPassed = requiredTests.filter(t => t.pass).length;
    const optionalPassed = optionalTests.filter(t => t.pass).length;

    console.log('\n' + '='.repeat(60));
    console.log('📈 RESULTADOS DOS TESTES');
    console.log('='.repeat(60) + '\n');

    // Resumo por categoria
    categories.forEach(category => {
        const categoryTests = tests.filter(t => t.category === category);
        const categoryPassed = categoryTests.filter(t => t.pass).length;
        const categoryTotal = categoryTests.length;
        const percentage = ((categoryPassed / categoryTotal) * 100).toFixed(0);

        console.log(`${category}: ${categoryPassed}/${categoryTotal} (${percentage}%)`);
    });

    console.log('\n' + '-'.repeat(60) + '\n');

    // Testes obrigatórios
    console.log(`✅ Testes Obrigatórios: ${requiredPassed}/${requiredTests.length}`);
    console.log(`ℹ️  Testes Opcionais: ${optionalPassed}/${optionalTests.length}`);
    console.log(`⏱️  Tempo de execução: ${duration}ms`);

    console.log('\n' + '-'.repeat(60) + '\n');

    // Detalhes dos testes
    tests.forEach(test => {
        const icon = test.pass ? '✅' : (test.optional ? 'ℹ️' : '❌');
        const prefix = test.optional ? '[OPCIONAL]' : '';
        console.log(`${icon} ${prefix} ${test.category} → ${test.name}`);

        if (!test.pass && !test.optional) {
            console.log(`   Expected: ${test.expected}`);
            console.log(`   Actual: ${test.actual}`);
            if (test.error) {
                console.log(`   Error:`, test.error);
            }
        }

        if (test.info) {
            console.log(`   ℹ️  ${test.info}`);
        }
    });

    console.log('\n' + '='.repeat(60));

    // Veredito final
    const allRequiredPassed = requiredPassed === requiredTests.length;

    if (allRequiredPassed) {
        console.log('✅ CHECKPOINT APROVADO - Todos os testes obrigatórios passaram!');
        console.log('👉 Você pode prosseguir para o próximo checkpoint.');
    } else {
        console.log('❌ CHECKPOINT REPROVADO - Alguns testes falharam.');
        console.log('👉 Revise os erros acima antes de prosseguir.');
        console.log('👉 Considere fazer rollback para o checkpoint anterior.');
    }

    console.log('='.repeat(60) + '\n');

    // Retornar objeto com resultados
    return {
        passed: allRequiredPassed,
        total: tests.length,
        requiredPassed,
        requiredTotal: requiredTests.length,
        optionalPassed,
        optionalTotal: optionalTests.length,
        duration,
        tests
    };
})();
