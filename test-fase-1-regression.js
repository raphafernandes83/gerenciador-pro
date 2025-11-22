/**
 * 🧪 TESTE DE REGRESSÃO - CHECKPOINT 1.3d
 * Validação completa da Fase 1 - Centralização de Estado
 */

console.log('🧪 Iniciando Teste de Regressão - Fase 1');

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

// TESTE 1: StateManager existe
test('StateManager existe', () => {
    if (!window.stateManager) throw new Error('StateManager não encontrado');
});

test('StateManager.getState() funciona', () => {
    const state = window.stateManager.getState();
    if (typeof state !== 'object') throw new Error('getState() não retorna objeto');
});

test('StateManager.getStats() funciona', () => {
    const stats = window.stateManager.getStats();
    if (typeof stats !== 'object') throw new Error('getStats() não retorna objeto');
    if (typeof stats.stateKeys === 'undefined') throw new Error('stats.stateKeys não encontrado');
});

// TESTE 2: Propriedades migradas
test('Propriedades migradas existem no StateManager', () => {
    const smState = window.stateManager.getState();
    const props = ['capitalAtual', 'isSessionActive', 'sessionMode', 'dashboardFilterMode', 'dashboardFilterPeriod'];

    for (const prop of props) {
        if (typeof smState[prop] === 'undefined') {
            throw new Error(`Propriedade ${prop} não encontrada no StateManager`);
        }
    }
});

// TESTE 3: Histórico
test('StateManager tem histórico', () => {
    const history = window.stateManager.getHistory();
    if (!Array.isArray(history)) throw new Error('Histórico não é array');
    if (history.length === 0) throw new Error('Histórico está vazio');
});

// TESTE 4: Funcionalidades da aplicação
test('Dashboard está renderizado', () => {
    const dashboard = document.querySelector('#dashboard-content');
    if (!dashboard) throw new Error('Dashboard não encontrado');
});

test('Filtros do dashboard existem', () => {
    const periodFilters = document.querySelector('[data-period]');
    const modeFilters = document.querySelector('[data-mode]');

    if (!periodFilters && !modeFilters) {
        throw new Error('Botões de filtro não encontrad os');
    }
});

test('Sidebar está acessível', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) throw new Error('Sidebar não encontrada');
});

// RELATÓRIO FINAL
console.log('\n' + '='.repeat(50));
console.log('📊 RELATÓRIO DO TESTE DE REGRESSÃO');
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
console.log(passed ? '✅ FASE 1 VALIDADA COM SUCESSO!' : '❌ FASE 1 POSSUI PROBLEMAS');
console.log('='.repeat(50));

window.__regressionTestResult = { passed, results };
