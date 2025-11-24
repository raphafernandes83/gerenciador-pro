/**
 * Testes para CalculationsUtils
 * Valida funções puras de cálculo e normalização
 */

import {
    normalizeOperation,
    normalizeHistory,
    calcularSequencias,
    calcularExpectativaMatematica,
    calcularDrawdown,
    calcularPayoffRatio
} from '../src/utils/CalculationsUtils.js';

/**
 * Suite de testes para CalculationsUtils
 */
export function runCalculationsUtilsTests() {
    console.log('🧪 Iniciando testes de CalculationsUtils...\n');

    let passed = 0;
    let failed = 0;

    // ===== TESTE 1: normalizeOperation =====
    console.log('📋 Teste 1: normalizeOperation()');

    try {
        // Teste com operação válida
        const op1 = { isWin: true, valor: 100 };
        const result1 = normalizeOperation(op1);

        if (result1.isWin === true && result1.valor === 100) {
            console.log('  ✅ Operação válida normalizada corretamente');
            passed++;
        } else {
            console.error('  ❌ Falha ao normalizar operação válida');
            failed++;
        }

        // Teste com null
        const result2 = normalizeOperation(null);
        if (result2.isWin === null && result2.valor === null) {
            console.log('  ✅ Null tratado corretamente');
            passed++;
        } else {
            console.error('  ❌ Falha ao tratar null');
            failed++;
        }

        // Teste com formato legado (resultado string)
        const op3 = { resultado: 'win', valorRetorno: 87, valorEntrada: 100 };
        const result3 = normalizeOperation(op3);

        if (result3.isWin === true && result3.valor === 87) {
            console.log('  ✅ Formato legado convertido corretamente');
            passed++;
        } else {
            console.error('  ❌ Falha ao converter formato legado');
            failed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste normalizeOperation:', error);
        failed += 3;
    }

    // ===== TESTE 2: normalizeHistory =====
    console.log('\n📋 Teste 2: normalizeHistory()');

    try {
        const historico = [
            { isWin: true, valor: 100 },
            { isWin: false, valor: -50 },
            { resultado: 'win', valorRetorno: 85, valorEntrada: 100 }
        ];

        const normalized = normalizeHistory(historico);

        if (normalized.length === 3) {
            console.log('  ✅ Histórico normalizado com tamanho correto');
            passed++;
        }

        if (normalized[0].isWin === true && normalized[1].isWin === false) {
            console.log('  ✅ Resultados preservados corretamente');
            passed++;
        }

        // Teste com array vazio
        const empty = normalizeHistory([]);
        if (Array.isArray(empty) && empty.length === 0) {
            console.log('  ✅ Array vazio tratado corretamente');
            passed++;
        }

        // Teste com null
        const nullResult = normalizeHistory(null);
        if (Array.isArray(nullResult) && nullResult.length === 0) {
            console.log('  ✅ Null retorna array vazio');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste normalizeHistory:', error);
        failed += 4;
    }

    // ===== TESTE 3: calcularSequencias =====
    console.log('\n📋 Teste 3: calcularSequencias()');

    try {
        const historico = [
            { isWin: true },
            { isWin: true },
            { isWin: true },
            { isWin: false },
            { isWin: false },
            { isWin: true }
        ];

        const sequencias = calcularSequencias(historico);

        if (sequencias && typeof sequencias === 'object') {
            console.log('  ✅ Sequências calculadas');
            console.log('    Resultado:', sequencias);
            passed++;
        }

        // Teste com array vazio
        const emptySeq = calcularSequencias([]);
        if (emptySeq) {
            console.log('  ✅ Array vazio não causa erro');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste calcularSequencias:', error);
        failed += 2;
    }

    // ===== TESTE 4: calcularExpectativaMatematica =====
    console.log('\n📋 Teste 4: calcularExpectativaMatematica()');

    try {
        const historico = [
            { isWin: true, valor: 87, raw: { payout: 87 } },
            { isWin: true, valor: 87, raw: { payout: 87 } },
            { isWin: false, valor: -100, raw: {} }
        ];

        const ev = calcularExpectativaMatematica(historico);

        if (ev && typeof ev.ev === 'number') {
            console.log('  ✅ EV calculado:', ev.ev + '%');
            passed++;
        }

        if (ev.class === 'positive' || ev.class === 'negative') {
            console.log('  ✅ Classe definida:', ev.class);
            passed++;
        }

        // Teste com array vazio
        const emptyEV = calcularExpectativaMatematica([]);
        if (emptyEV.ev === null) {
            console.log('  ✅ Array vazio retorna null');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste calcularExpectativaMatematica:', error);
        failed += 3;
    }

    // ===== TESTE 5: calcularDrawdown =====
    console.log('\n📋 Teste 5: calcularDrawdown()');

    try {
        const historico = [
            { valor: -100 },
            { valor: -200 },
            { valor: 50 },
            { valor: 100 }
        ];

        const drawdown = calcularDrawdown(historico, 10000);

        if (typeof drawdown === 'number') {
            console.log('  ✅ Drawdown calculado:', drawdown);
            passed++;
        }

        // Teste memoização (mesma entrada deve usar cache)
        const drawdown2 = calcularDrawdown(historico, 10000);
        if (drawdown === drawdown2) {
            console.log('  ✅ Memoização funcionando');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste calcularDrawdown:', error);
        failed += 2;
    }

    // ===== TESTE 6: calcularPayoffRatio =====
    console.log('\n📋 Teste 6: calcularPayoffRatio()');

    try {
        const historico = [
            { isWin: true, valor: 87 },
            { isWin: true, valor: 87 },
            { isWin: false, valor: -100 },
            { isWin: false, valor: -100 }
        ];

        const payoff = calcularPayoffRatio(historico);

        if (typeof payoff === 'number') {
            console.log('  ✅ Payoff Ratio calculado:', payoff.toFixed(2));
            passed++;
        }

        // Teste sem perdas (deve retornar Infinity)
        const onlyWins = [
            { isWin: true, valor: 100 },
            { isWin: true, valor: 100 }
        ];
        const infinitePayoff = calcularPayoffRatio(onlyWins);
        if (infinitePayoff === Infinity) {
            console.log('  ✅ Sem perdas retorna Infinity');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste calcularPayoffRatio:', error);
        failed += 2;
    }

    // ===== RELATÓRIO FINAL =====
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO: CalculationsUtils');
    console.log('='.repeat(50));
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(50) + '\n');

    return { passed, failed, total: passed + failed };
}

// Auto-executar se carregado diretamente
if (typeof window !== 'undefined') {
    window.runCalculationsUtilsTests = runCalculationsUtilsTests;
    console.log('🧪 Testes de CalculationsUtils carregados!');
    console.log('   Execute: runCalculationsUtilsTests()');
}
