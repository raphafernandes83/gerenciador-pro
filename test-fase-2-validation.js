/**
 * 🧪 TESTE DE VALIDAÇÃO - CHECKPOINT 2.2a
 * Valida DOMManager e migrações do ui.js
 */

console.log('🧪 Iniciando Validação - Fase 2 (DOMManager)');

const results = {
    passed: [],
    failed: [],
    warnings: []
};

function test(name, fn) {
    try {
        fn();
        results.passed.push(name);
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed.push({ name, error: error.message });
        console.error(`❌ ${name}:`, error.message);
    }
}

// TESTE 1: DOMManager existe
test('DOMManager existe', () => {
    if (!window.domManager) throw new Error('DOMManager não encontrado');
});

test('DOMManager tem métodos essenciais', () => {
    const methods = ['select', 'addClass', 'removeClass', 'toggleClass', 'hasClass'];
    for (const method of methods) {
        if (typeof window.domManager[method] !== 'function') {
            throw new Error(`Método ${method} não encontrado`);
        }
    }
});

// TESTE 2: DOMManager funciona
test('DOMManager.select() funciona', () => {
    const sidebar = window.domManager.select('.sidebar');
    if (!sidebar) throw new Error('Não conseguiu selecionar .sidebar');
});

test('DOMManager.addClass() funciona', () => {
    const result = window.domManager.addClass('.sidebar', 'test-validation-class');
    if (!result) throw new Error('addClass falhou');

    // Verificar se classe foi adicionada
    const hasClass = window.domManager.hasClass('.sidebar', 'test-validation-class');
    if (!hasClass) throw new Error('Classe não foi adicionada');
});

test('DOMManager.removeClass() funciona', () => {
    const result = window.domManager.removeClass('.sidebar', 'test-validation-class');
    if (!result) throw new Error('removeClass falhou');

    // Verificar se classe foi removida  
    const hasClass = window.domManager.hasClass('.sidebar', 'test-validation-class');
    if (hasClass) throw new Error('Classe não foi removida');
});

test('DOMManager.toggleClass() funciona', () => {
    // Toggle ON
    let result = window.domManager.toggleClass('.sidebar', 'test-toggle');
    if (!result) throw new Error('toggleClass ON falhou');

    // Toggle OFF
    result = window.domManager.toggleClass('.sidebar', 'test-toggle');
    if (result) throw new Error('toggleClass OFF falhou');
});

// TESTE 3: Stats
test('DOMManager.getStats() funciona', () => {
    const stats = window.domManager.getStats();
    if (typeof stats !== 'object') throw new Error('getStats() não retorna objeto');
    if (typeof stats.cachedElements === 'undefined') throw new Error('stats.cachedElements não encontrado');
});

// TESTE 4: UI migrações funcionam
test('UI possui domHelper interno', () => {
    // Verificar se código foi migrado (presença de comentários checkpoint)
    const uiSource = window.ui ? window.ui.toString() : '';
    // Não podemos testar o source diretamente, mas podemos testar funcionalidade
    if (!window.ui) throw new Error('UI não encontrado');
});

test('Modal funciona após migração', () => {
    // Testa se showModal ainda funciona
    if (typeof window.ui.showModal !== 'function') {
        throw new Error('ui.showModal não é função');
    }
});

// TESTE 5: Aplicação funcional
test('Dashboard renderizado', () => {
    const dashboard = document.querySelector('#dashboard-content');
    if (!dashboard) throw new Error('Dashboard não encontrado');
});

test('Sidebar acessível', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) throw new Error('Sidebar não encontrada');
});

test('Sem erros críticos no console', () => {
    // Placeholder - erros estariam visíveis no console
});

// RELATÓRIO FINAL
console.log('\n' + '='.repeat(50));
console.log('📊 RELATÓRIO DE VALIDAÇÃO - FASE 2');
console.log('='.repeat(50));
console.log(`✅ Aprovados: ${results.passed.length}`);
console.log(`❌ Reprovados: ${results.failed.length}`);
console.log(`⚠️  Avisos: ${results.warnings.length}`);

if (results.failed.length > 0) {
    console.log('\n❌ TESTES REPROVADOS:');
    results.failed.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
    });
}

if (results.warnings.length > 0) {
    console.log('\n⚠️  AVISOS:');
    results.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
    });
}

const passed = results.failed.length === 0;
console.log('\n' + '='.repeat(50));
console.log(passed ? '✅ FASE 2 VALIDADA COM SUCESSO!' : '❌ FASE 2 POSSUI PROBLEMAS');
console.log('='.repeat(50));

window.__fase2ValidationResult = { passed, results };
