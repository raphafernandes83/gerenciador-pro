/**
 * Testes para GoalsChecker
 * Valida verificação de metas Stop Win e Stop Loss
 */

import { verificarMetas } from '../src/business/GoalsChecker.js';
import { state } from '../state.js';

/**
 * Suite de testes para GoalsChecker
 */
export function runGoalsCheckerTests() {
    console.log('🧪 Iniciando testes de GoalsChecker...\n');

    let passed = 0;
    let failed = 0;

    // Backup do estado original
    const originalState = {
        capitalInicioSessao: state.capitalInicioSessao,
        capitalAtual: state.capitalAtual,
        stopWinValor: state.stopWinValor,
        stopLossValor: state.stopLossValor,
        metaAtingida: state.metaAtingida,
        alertaStopWin80Mostrado: state.alertaStopWin80Mostrado,
        alertaStopLoss80Mostrado: state.alertaStopLoss80Mostrado
    };

    // ===== TESTE 1: Meta não atingida =====
    console.log('📋 Teste 1: Verificar sem meta atingida');

    try {
        state.capitalInicioSessao = 10000;
        state.capitalAtual = 10500;
        state.stopWinValor = 2000;
        state.stopLossValor = 1500;

        const result = verificarMetas();

        if (result.metaAtingidaHoje === false && result.tipoMeta === null) {
            console.log('  ✅ Meta não atingida detectada corretamente');
            passed++;
        } else {
            console.error('  ❌ Falha na detecção de meta não atingida');
            failed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste meta não atingida:', error);
        failed++;
    }

    // ===== TESTE 2: Stop Win atingido =====
    console.log('\n📋 Teste 2: Stop Win atingido');

    try {
        state.capitalInicioSessao = 10000;
        state.capitalAtual = 12000;
        state.stopWinValor = 2000;

        const result = verificarMetas();

        if (result.metaAtingidaHoje === true && result.tipoMeta === 'win') {
            console.log('  ✅ Stop Win detectado corretamente');
            passed++;
        }

        if (state.metaAtingida === true) {
            console.log('  ✅ Flag metaAtingida setada');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste Stop Win:', error);
        failed += 2;
    }

    // ===== TESTE 3: Stop Loss atingido =====
    console.log('\n📋 Teste 3: Stop Loss atingido');

    try {
        state.capitalInicioSessao = 10000;
        state.capitalAtual = 8500;
        state.stopLossValor = 1500;
        state.metaAtingida = false;

        const result = verificarMetas();

        if (result.metaAtingidaHoje === true && result.tipoMeta === 'loss') {
            console.log('  ✅ Stop Loss detectado corretamente');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste Stop Loss:', error);
        failed++;
    }

    // ===== TESTE 4: Alerta 80% Stop Win =====
    console.log('\n📋 Teste 4: Alerta de proximidade Stop Win (80%)');

    try {
        state.capitalInicioSessao = 10000;
        state.capitalAtual = 11600; // 80% de 2000 = 1600
        state.stopWinValor = 2000;
        state.stopLossValor = 1500;
        state.alertaStopWin80Mostrado = false;
        state.metaAtingida = false;

        verificarMetas();

        if (state.alertaStopWin80Mostrado === true) {
            console.log('  ✅ Alerta 80% Stop Win mostrado');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste alerta 80% Win:', error);
        failed++;
    }

    // ===== TESTE 5: Alerta 80% Stop Loss =====
    console.log('\n📋 Teste 5: Alerta de proximidade Stop Loss (80%)');

    try {
        state.capitalInicioSessao = 10000;
        state.capitalAtual = 8800; // 80% de 1500 = 1200 de perda
        state.stopWinValor = 2000;
        state.stopLossValor = 1500;
        state.alertaStopLoss80Mostrado = false;
        state.metaAtingida = false;

        verificarMetas();

        if (state.alertaStopLoss80Mostrado === true) {
            console.log('  ✅ Alerta 80% Stop Loss mostrado');
            passed++;
        }

    } catch (error) {
        console.error('  ❌ Erro no teste alerta 80% Loss:', error);
        failed++;
    }

    // ===== TESTE 6: Valores seguros (proteção NaN) =====
    console.log('\n📋 Teste 6: Proteção contra valores inválidos');

    try {
        state.capitalInicioSessao = NaN;
        state.capitalAtual = undefined;
        state.stopWinValor = null;

        const result = verificarMetas();

        // Não deve quebrar, deve usar fallbacks
        console.log('  ✅ Não quebra com valores inválidos');
        passed++;

    } catch (error) {
        console.error('  ❌ Erro no teste valores inválidos:', error);
        failed++;
    }

    // ===== RELATÓRIO FINAL =====
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO: GoalsChecker');
    console.log('='.repeat(50));
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(50) + '\n');

    // Restaurar estado
    Object.assign(state, originalState);

    return { passed, failed, total: passed + failed };
}

// Auto-executar se carregado diretamente
if (typeof window !== 'undefined') {
    window.runGoalsCheckerTests = runGoalsCheckerTests;
    console.log('🧪 Testes de GoalsChecker carregados!');
    console.log('   Execute: runGoalsCheckerTests()');
}
