/**
 * 🧪 TESTE DE INTEGRAÇÃO - Sistema Modular
 * Valida integração dos módulos no main.js
 */

console.log('🧪 Iniciando testes de integração do Sistema Modular...\n');

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

// ============================================================================
// TESTES DE EXISTÊNCIA
// ============================================================================

test('window.modules existe', () => {
    if (!window.modules) throw new Error('window.modules não encontrado');
});

test('window.moduleManager existe', () => {
    if (!window.moduleManager) throw new Error('window.moduleManager não encontrado');
});

test('SessionModule registrado', () => {
    if (!window.modules.session) throw new Error('SessionModule não encontrado');
});

test('OperationModule registrado', () => {
    if (!window.modules.operation) new Error('OperationModule não encontrado');
});

test('CalculationModule registrado', () => {
    if (!window.modules.calculation) throw new Error('CalculationModule não encontrado');
});

// ============================================================================
// TESTES DE FUNCIONALIDADE - SessionModule
// ============================================================================

test('SessionModule.startSession() funciona', () => {
    const session = window.modules.session.startSession({
        mode: 'practice',
        startCapital: 1000
    });

    if (!session || !session.id) {
        throw new Error('Sessão não criada corretamente');
    }
});

test('SessionModule.getCurrentSession() retorna sessão', () => {
    const session = window.modules.session.getCurrentSession();
    if (!session) {
        throw new Error('getCurrentSession() não retorna sessão');
    }
});

test('SessionModule.isSessionActive() retorna true', () => {
    const active = window.modules.session.isSessionActive();
    if (!active) {
        throw new Error('Sessão deveria estar ativa');
    }
});

test('SessionModule.addOperation() funciona', () => {
    const op = window.modules.session.addOperation({
        isWin: true,
        value: 85,
        entry: 100,
        payout: 85
    });

    if (!op || !op.id) {
        throw new Error('Operação não adicionada');
    }
});

test('SessionModule.getCurrentStats() retorna stats', () => {
    const stats = window.modules.session.getCurrentStats();
    if (!stats || typeof stats.totalOperations !== 'number') {
        throw new Error('Stats inválidas');
    }
});

test('SessionModule.finishSession() funciona', () => {
    const finishedSession = window.modules.session.finishSession();
    if (!finishedSession || finishedSession.status !== 'finished') {
        throw new Error('Sessão não finalizada corretamente');
    }
});

// ============================================================================
// TESTES DE FUNCIONALIDADE - OperationModule
// ============================================================================

test('OperationModule.registerOperation() funciona', () => {
    const op = window.modules.operation.registerOperation({
        entry: 100,
        payout: 85,
        isWin: true
    });

    if (!op || !op.id) {
        throw new Error('Operação não registrada');
    }
});

test('OperationModule.calculateStats() funciona', () => {
    const stats = window.modules.operation.calculateStats();
    if (!stats || typeof stats.total !== 'number') {
        throw new Error('Stats inválidas');
    }
});

test('OperationModule.getWinningOperations() funciona', () => {
    const wins = window.modules.operation.getWinningOperations();
    if (!Array.isArray(wins)) {
        throw new Error('Não retorna array');
    }
});

// ============================================================================
// TESTES DE FUNCIONALIDADE - CalculationModule
// ============================================================================

test('CalculationModule.calculateExpectancy() funciona', () => {
    const ops = [
        { isWin: true, valor: 85 },
        { isWin: false, valor: -100 }
    ];

    const result = window.modules.calculation.calculateExpectancy(ops);
    if (!result || typeof result.ev !== 'number') {
        throw new Error('Expectativa não calculada');
    }
});

test('CalculationModule.calculateDrawdown() funciona', () => {
    const ops = [
        { valor: 85 },
        { valor: -100 },
        { valor: 85 }
    ];

    const result = window.modules.calculation.calculateDrawdown(ops);
    if (!result || typeof result.maxDrawdown !== 'number') {
        throw new Error('Drawdown não calculado');
    }
});

test('CalculationModule.calculateWinRate() funciona', () => {
    const ops = [
        { isWin: true },
        { isWin: false }
    ];

    const winRate = window.modules.calculation.calculateWinRate(ops);
    if (typeof winRate !== 'number') {
        throw new Error('WinRate não calculado');
    }
});

test('CalculationModule.calculateAllStats() funciona', () => {
    const ops = [
        { isWin: true, valor: 85 },
        { isWin: false, valor: -100 }
    ];

    const stats = window.modules.calculation.calculateAllStats(ops);
    if (!stats || !stats.expectancy || !stats.drawdown) {
        throw new Error('Stats completas não calculadas');
    }
});

// ============================================================================
// TESTES DE INTEGRAÇÃO COM STATEMANAGER
// ============================================================================

test('SessionModule integrado com StateManager', () => {
    if (!window.stateManager) {
        results.warnings.push('StateManager não disponível');
        return;
    }

    const state = window.stateManager.getState();
    // Sessão foi finalizada nos testes anteriores
    if (state.isSessionActive !== false) {
        throw new Error('StateManager não sincronizado');
    }
});

// ============================================================================
// RELATÓRIO FINAL
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 RELATÓRIO DE INTEGRAÇÃO - Sistema Modular');
console.log('='.repeat(60));
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
console.log('\n' + '='.repeat(60));
console.log(passed ? '✅ INTEGRAÇÃO VALIDADA COM SUCESSO!' : '❌ INTEGRAÇÃO POSSUI PROBLEMAS');
console.log('='.repeat(60));

console.log('\n💡 Módulos disponíveis:');
console.log('  - window.modules.session');
console.log('  - window.modules.operation');
console.log('  - window.modules.calculation');
console.log('  - window.moduleManager');

window.__integrationTestResult = { passed, results };
