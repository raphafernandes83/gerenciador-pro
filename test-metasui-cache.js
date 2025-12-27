// 🧪 TESTE MANUAL: MetasUI Cache Validation
// Cole este código no Console do DevTools (F12)

console.log('%c🧪 INICIANDO TESTE: MetasUI Cache Fix', 'font-size: 16px; font-weight: bold; color: #00ff00;');
console.log('='.repeat(60));

// ============================================================================
// TESTE 1: Carregamento Inicial
// ============================================================================
console.log('\n%c📋 TESTE 1: Carregamento Inicial', 'font-weight: bold; color: #ffaa00;');

const test1 = {
    metasUILoaded: !!window.metasUI,
    metasIntegrationLoaded: !!window.metasIntegration,
    metasInitialized: window.metasUI?.initialized || false
};

console.log('✅ MetasUI carregado:', test1.metasUILoaded ? '✅ SIM' : '❌ NÃO');
console.log('✅ MetasIntegration carregado:', test1.metasIntegrationLoaded ? '✅ SIM' : '❌ NÃO');

// ============================================================================
// TESTE 2: Estado Atual dos Dados
// ============================================================================
console.log('\n%c📋 TESTE 2: Estado dos Dados', 'font-weight: bold; color: #ffaa00;');

const test2 = {
    hasData: window.metasUI?.data !== null && window.metasUI?.data !== undefined,
    hasConfig: window.metasUI?.config !== null && window.metasUI?.config !== undefined,
    dataValue: window.metasUI?.data,
    configValue: window.metasUI?.config
};

console.log('📦 metasUI.data existe:', test2.hasData ? '✅ SIM' : '⚠️ NÃO (null)');
console.log('⚙️ metasUI.config existe:', test2.hasConfig ? '✅ SIM' : '⚠️ NÃO (null)');

if (test2.hasData) {
    console.log('📊 Dados atuais:', test2.dataValue);
}
if (test2.hasConfig) {
    console.log('⚙️ Config atual:', test2.configValue);
}

// ============================================================================
// TESTE 3: Persistência em localStorage
// ============================================================================
console.log('\n%c📋 TESTE 3: LocalStorage Persistence', 'font-weight: bold; color: #ffaa00;');

const test3 = {
    dataInStorage: localStorage.getItem('metasUI_data'),
    configInStorage: localStorage.getItem('metasUI_config'),
    dataExists: !!localStorage.getItem('metasUI_data'),
    configExists: !!localStorage.getItem('metasUI_config')
};

console.log('💾 localStorage.metasUI_data:', test3.dataExists ? '✅ SALVO' : '⚠️ VAZIO');
console.log('💾 localStorage.metasUI_config:', test3.configExists ? '✅ SALVO' : '⚠️ VAZIO');

if (test3.dataExists) {
    try {
        const parsedData = JSON.parse(test3.dataInStorage);
        console.log('📊 Dados salvos (preview):', parsedData);
    } catch (e) {
        console.error('❌ Erro ao parsear dados:', e);
    }
}

// ============================================================================
// TESTE 4: Métodos de Persistência
// ============================================================================
console.log('\n%c📋 TESTE 4: Métodos Implementados', 'font-weight: bold; color: #ffaa00;');

const test4 = {
    hasSaveMethod: typeof window.metasUI?._saveToLocalStorage === 'function',
    hasRestoreMethod: typeof window.metasUI?._restoreFromLocalStorage === 'function',
    hasAtualizarMethod: typeof window.metasUI?.atualizarProgressoBarra === 'function'
};

console.log('💾 _saveToLocalStorage():', test4.hasSaveMethod ? '✅ IMPLEMENTADO' : '❌ FALTANDO');
console.log('📦 _restoreFromLocalStorage():', test4.hasRestoreMethod ? '✅ IMPLEMENTADO' : '❌ FALTANDO');
console.log('🔄 atualizarProgressoBarra():', test4.hasAtualizarMethod ? '✅ IMPLEMENTADO' : '❌ FALTANDO');

// ============================================================================
// TESTE 5: Estado da Sessão
// ============================================================================
console.log('\n%c📋 TESTE 5: Estado da Sessão', 'font-weight: bold; color: #ffaa00;');

const test5 = {
    sessionActive: window.state?.isSessionActive || false,
    capitalAtual: window.state?.capitalAtual || 0,
    historicoLength: window.state?.historicoCombinado?.length || 0
};

console.log('🎯 Sessão ativa:', test5.sessionActive ? '✅ SIM' : '⚠️ NÃO');
console.log('💰 Capital atual:', test5.capitalAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('📊 Operações registradas:', test5.historicoLength);

// ============================================================================
// RESUMO FINAL
// ============================================================================
console.log('\n%c' + '='.repeat(60), 'color: #00ff00;');
console.log('%c📊 RESUMO DO TESTE', 'font-size: 14px; font-weight: bold; color: #00ff00;');
console.log('='.repeat(60));

const allTests = {
    '1. MetasUI carregado': test1.metasUILoaded,
    '2. Dados existem (data)': test2.hasData,
    '3. Config existe': test2.hasConfig,
    '4. LocalStorage data salvo': test3.dataExists,
    '5. LocalStorage config salvo': test3.configExists,
    '6. Método save implementado': test4.hasSaveMethod,
    '7. Método restore implementado': test4.hasRestoreMethod
};

let passedCount = 0;
let totalCount = Object.keys(allTests).length;

console.log('');
Object.entries(allTests).forEach(([testName, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (passed) passedCount++;
});

console.log('\n' + '='.repeat(60));
const percentage = ((passedCount / totalCount) * 100).toFixed(0);
const statusIcon = passedCount === totalCount ? '🎉' : passedCount >= totalCount * 0.7 ? '⚠️' : '❌';

console.log(`%c${statusIcon} RESULTADO: ${passedCount}/${totalCount} testes passaram (${percentage}%)`,
    `font-size: 16px; font-weight: bold; color: ${passedCount === totalCount ? '#00ff00' : '#ffaa00'};`);

if (passedCount === totalCount) {
    console.log('%c✅ MetasUI Cache Fix: FUNCIONANDO PERFEITAMENTE!', 'font-size: 14px; color: #00ff00;');
} else if (!test2.hasData && !test3.dataExists) {
    console.log('%c⚠️ NOTA: Inicie uma sessão para popular os dados do MetasUI', 'color: #ffaa00;');
    console.log('   1. Abra sidebar → "Parâmetros e Controles"');
    console.log('   2. Click "Nova Sessão" → Escolha "Simulação"');
    console.log('   3. Rode este teste novamente');
} else {
    console.log('%c❌ Alguns testes falharam. Verifique os detalhes acima.', 'color: #ff0000;');
}

console.log('='.repeat(60) + '\n');

// Retorna objeto para fácil inspeção
({
    summary: allTests,
    score: `${passedCount}/${totalCount}`,
    percentage: `${percentage}%`,
    status: passedCount === totalCount ? 'PASS' : 'FAIL',
    details: { test1, test2, test3, test4, test5 }
});
