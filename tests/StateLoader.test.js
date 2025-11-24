/**
 * Testes para StateLoader
 * Valida carregamento e atualização de estado
 */

import { updateState, loadStateFromStorage } from '../src/utils/StateLoader.js';
import { state, config } from '../state.js';

/**
 * Suite de testes para StateLoader
 */
export function runStateLoaderTests() {
    console.log('🧪 Iniciando testes de StateLoader...\n');

    let passed = 0;
    let failed = 0;

    // Backup do estado original
    const originalState = { ...state };
    const originalConfig = { ...config };

    // ===== TESTE 1: updateState com config =====
    console.log('📋 Teste 1: updateState() - Atualizar config');

    try {
        const initialCapital = config.capitalInicial;

        updateState({ capitalInicial: 20000 });

        if (config.capitalInicial === 20000) {
            console.log('  ✅ Config atualizado corretamente');
            passed++;
        } else {
            console.error('  ❌ Config não foi atualizado');
            failed++;
        }

        // Restaurar
        config.capitalInicial = initialCapital;

    } catch (error) {
        console.error('  ❌ Erro no teste updateState (config):', error);
        failed++;
    }

    // ===== TESTE 2: updateState com state =====
    console.log('\n📋 Teste 2: updateState() - Atualizar state');

    try {
        const initialCapitalAtual = state.capitalAtual;

        updateState({ capitalAtual: 15000 });

        if (state.capitalAtual === 15000) {
            console.log('  ✅ State atualizado corretamente');
            passed++;
        } else {
            console.error('  ❌ State não foi atualizado');
            failed++;
        }

        // Restaurar
        state.capitalAtual = initialCapitalAtual;

    } catch (error) {
        console.error('  ❌ Erro no teste updateState (state):', error);
        failed++;
    }

    // ===== TESTE 3: localStorage persistence =====
    console.log('\n📋 Teste 3: Persistência no localStorage');

    try {
        const testValue = 12345;
        updateState({ capitalInicial: testValue });

        const stored = localStorage.getItem('gerenciadorProCapitalInicial');
        const parsed = JSON.parse(stored);

        if (parsed === testValue) {
            console.log('  ✅ Valor persistido no localStorage');
            passed++;
        } else {
            console.error('  ❌ Valor não persistido corretamente');
            failed++;
        }

        // Limpar
        localStorage.removeItem('gerenciadorProCapitalInicial');
        config.capitalInicial = originalConfig.capitalInicial;

    } catch (error) {
        console.error('  ❌ Erro no teste localStorage:', error);
        failed++;
    }

    // ===== TESTE 4: Detecção de recalculation needed =====
    console.log('\n📋 Teste 4: Detecção de necessidade de recálculo');

    try {
        // Mudança que requer recálculo
        const needsRecalc1 = updateState({ stopWinPerc: 15 });

        if (needsRecalc1 === true) {
            console.log('  ✅ Detectou necessidade de recálculo para stopWinPerc');
            passed++;
        }

        // Mudança que NÃO requer recálculo
        const needsRecalc2 = updateState({ capitalAtual: 10000 });

        if (needsRecalc2 === false) {
            console.log('  ✅ Não recalcula para mudanças de capitalAtual');
            passed++;
        }

        // Restaurar
        config.stopWinPerc = originalConfig.stopWinPerc;
        state.capitalAtual = originalState.capitalAtual;

    } catch (error) {
        console.error('  ❌ Erro no teste recalculation:', error);
        failed += 2;
    }

    // ===== TESTE 5: loadStateFromStorage =====
    console.log('\n📋 Teste 5: loadStateFromStorage()');

    try {
        // Preparar localStorage com valores de teste
        localStorage.setItem('gerenciadorProCapitalInicial', JSON.stringify(50000));
        localStorage.setItem('gerenciadorProPercentualEntrada', JSON.stringify(3.5));

        loadStateFromStorage();

        if (config.capitalInicial === 50000) {
            console.log('  ✅ Capital inicial carregado do storage');
            passed++;
        }

        if (config.percentualEntrada === 3.5) {
            console.log('  ✅ Percentual entrada carregado do storage');
            passed++;
        }

        // Limpar
        localStorage.removeItem('gerenciadorProCapitalInicial');
        localStorage.removeItem('gerenciadorProPercentualEntrada');
        config.capitalInicial = originalConfig.capitalInicial;
        config.percentualEntrada = originalConfig.percentualEntrada;

    } catch (error) {
        console.error('  ❌ Erro no teste loadStateFromStorage:', error);
        failed += 2;
    }

    // ===== TESTE 6: Múltiplas atualizações =====
    console.log('\n📋 Teste 6: Múltiplas atualizações simultâneas');

    try {
        const updates = {
            capitalInicial: 25000,
            stopWinPerc: 12,
            stopLossPerc: 18,
            payout: 85
        };

        const needsRecalc = updateState(updates);

        if (config.capitalInicial === 25000 &&
            config.stopWinPerc === 12 &&
            config.stopLossPerc === 18 &&
            config.payout === 85) {
            console.log('  ✅ Múltiplas atualizações aplicadas');
            passed++;
        }

        if (needsRecalc === true) {
            console.log('  ✅ Recálculo detectado para múltiplas mudanças');
            passed++;
        }

        // Restaurar
        Object.assign(config, originalConfig);

    } catch (error) {
        console.error('  ❌ Erro no teste múltiplas atualizações:', error);
        failed += 2;
    }

    // ===== TESTE 7: Valores inválidos =====
    console.log('\n📋 Teste 7: Tratamento de valores inválidos');

    try {
        // Tenta atualizar campo que não existe
        updateState({ campoInexistente: 999 });

        console.log('  ✅ Não quebra com campo inexistente');
        passed++;

        // Valores null/undefined
        updateState({ capitalInicial: null });

        if (config.capitalInicial === null) {
            console.log('  ✅ Aceita valores null');
            passed++;
        }

        // Restaurar
        config.capitalInicial = originalConfig.capitalInicial;

    } catch (error) {
        console.error('  ❌ Erro no teste valores inválidos:', error);
        failed += 2;
    }

    // ===== RELATÓRIO FINAL =====
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO: StateLoader');
    console.log('='.repeat(50));
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(50) + '\n');

    // Garantir restauração completa
    Object.assign(state, originalState);
    Object.assign(config, originalConfig);

    return { passed, failed, total: passed + failed };
}

// Auto-executar se carregado diretamente
if (typeof window !== 'undefined') {
    window.runStateLoaderTests = runStateLoaderTests;
    console.log('🧪 Testes de StateLoader carregados!');
    console.log('   Execute: runStateLoaderTests()');
}
