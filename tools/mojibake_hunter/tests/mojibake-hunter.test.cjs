/**
 * 🧪 Mojibake Hunter - Testes Automatizados
 * 
 * Testa que o scanner:
 * 1) NÃO marca texto português válido como mojibake
 * 2) DETECTA mojibake real corretamente
 * 
 * Uso: npm run mojibake:test
 * 
 * @module MojibakeHunterTests
 * @version 1.0.0
 */

// ============================================================================
// PADRÕES DO SCANNER (copiados do scanner principal)
// ============================================================================

const MOJIBAKE_PATTERNS = [
    {
        name: 'REPLACEMENT_CHAR',
        regex: /\uFFFD/g,
    },
    {
        name: 'EMOJI_MOJIBAKE',
        regex: /ð[\x9F\x80-\xBF][\x80-\xBF]?[\x80-\xBF]?/g,
    },
    {
        name: 'QUOTE_MOJIBAKE',
        regex: /â€[™œ"¦¢˜]/g,
    },
    {
        name: 'ORDINAL_MOJIBAKE',
        regex: /Â[ªº]/g,
    },
    {
        name: 'DOUBLE_ENCODED_LATIN',
        regex: /Ã[£©§µ¡³­ºŠƒ‰¢]/g,
    },
    {
        name: 'DOUBLE_ENCODED_EXTENDED',
        regex: /Â[°³²·]/g,
    },
    {
        name: 'CORRUPTED_ELLIPSIS',
        regex: /â€¦/g,
    },
    {
        name: 'CORRUPTED_DASH',
        regex: /â€"/g,
    },
];

// ============================================================================
// CASOS DE TESTE
// ============================================================================

// Texto português VÁLIDO - NÃO deve gerar findings
const VALID_PORTUGUESE = [
    { text: 'NÃO', description: 'NÃO (maiúsculo com til)' },
    { text: 'AÇÃO', description: 'AÇÃO (maiúsculo com cedilha e til)' },
    { text: 'VERSÃO', description: 'VERSÃO (maiúsculo)' },
    { text: 'Operações', description: 'Operações (acentuado normal)' },
    { text: 'Sessão Encontrada', description: 'Sessão Encontrada (frase)' },
    { text: '1ª mão', description: '1ª mão (ordinal feminino válido)' },
    { text: '2º ciclo', description: '2º ciclo (ordinal masculino válido)' },
    { text: 'São Paulo', description: 'São Paulo (nome próprio)' },
    { text: 'Atenção especial', description: 'Atenção especial (acentos)' },
    { text: 'Configuração do sistema', description: 'Configuração do sistema' },
    { text: 'Ã', description: 'Ã sozinho (letra maiúscula com til)' },
    { text: 'GESTÃO DE RISCO', description: 'GESTÃO DE RISCO (maiúsculas PT-BR)' },
];

// Texto CORROMPIDO (mojibake) - DEVE gerar findings
const CORRUPTED_MOJIBAKE = [
    { text: 'nÃ£o', description: 'nÃ£o (double-encoded ã)', expected: 'DOUBLE_ENCODED_LATIN' },
    { text: 'OperaÃ§Ãµes', description: 'OperaÃ§Ãµes (double-encoded ç e õ)', expected: 'DOUBLE_ENCODED_LATIN' },
    { text: 'SessÃ£o', description: 'SessÃ£o (double-encoded ã)', expected: 'DOUBLE_ENCODED_LATIN' },
    { text: '1Âª', description: '1Âª (ordinal mojibake)', expected: 'ORDINAL_MOJIBAKE' },
    { text: '2Âº', description: '2Âº (ordinal mojibake)', expected: 'ORDINAL_MOJIBAKE' },
    { text: 'â€œtextoâ€', description: 'â€œtextoâ€ (aspas mojibake)', expected: 'QUOTE_MOJIBAKE' },
    { text: 'ConfiguraÃ§Ã£o', description: 'ConfiguraÃ§Ã£o (double-encoded)', expected: 'DOUBLE_ENCODED_LATIN' },
    { text: 'Â°C', description: 'Â°C (grau mojibake)', expected: 'DOUBLE_ENCODED_EXTENDED' },
    { text: 'Â·', description: 'Â· (middle dot mojibake)', expected: 'DOUBLE_ENCODED_EXTENDED' },
];

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Verifica se um texto gera findings de mojibake
 */
function detectMojibake(text) {
    const findings = [];
    for (const pattern of MOJIBAKE_PATTERNS) {
        const matches = text.match(pattern.regex);
        if (matches && matches.length > 0) {
            findings.push({
                pattern: pattern.name,
                count: matches.length,
                samples: matches,
            });
        }
    }
    return findings;
}

/**
 * Executa todos os testes
 */
function runTests() {
    console.log('🧪 Mojibake Hunter - Testes Automatizados');
    console.log('='.repeat(60));
    console.log('');

    let passed = 0;
    let failed = 0;
    const failures = [];

    // Teste 1: Textos válidos NÃO devem gerar findings
    console.log('📋 Teste 1: Textos PT-BR válidos (não devem gerar findings)');
    console.log('-'.repeat(60));

    for (const testCase of VALID_PORTUGUESE) {
        const findings = detectMojibake(testCase.text);
        if (findings.length === 0) {
            console.log(`  ✅ PASS: "${testCase.text}" → Sem findings`);
            passed++;
        } else {
            console.log(`  ❌ FAIL: "${testCase.text}" → Falso positivo!`);
            console.log(`          Findings: ${findings.map(f => f.pattern).join(', ')}`);
            failed++;
            failures.push({
                type: 'FALSE_POSITIVE',
                text: testCase.text,
                description: testCase.description,
                findings: findings,
            });
        }
    }

    console.log('');

    // Teste 2: Textos corrompidos DEVEM gerar findings
    console.log('📋 Teste 2: Textos mojibake (devem gerar findings)');
    console.log('-'.repeat(60));

    for (const testCase of CORRUPTED_MOJIBAKE) {
        const findings = detectMojibake(testCase.text);
        const hasExpectedPattern = findings.some(f => f.pattern === testCase.expected);

        if (hasExpectedPattern) {
            console.log(`  ✅ PASS: "${testCase.text}" → ${testCase.expected} detectado`);
            passed++;
        } else {
            console.log(`  ❌ FAIL: "${testCase.text}" → Não detectou ${testCase.expected}!`);
            if (findings.length > 0) {
                console.log(`          Detectou: ${findings.map(f => f.pattern).join(', ')}`);
            } else {
                console.log(`          Nenhum finding (deveria detectar mojibake)`);
            }
            failed++;
            failures.push({
                type: 'MISSED_DETECTION',
                text: testCase.text,
                description: testCase.description,
                expected: testCase.expected,
                actual: findings,
            });
        }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`   Total de testes: ${passed + failed}`);
    console.log(`   ✅ Passou: ${passed}`);
    console.log(`   ❌ Falhou: ${failed}`);
    console.log('');

    if (failed === 0) {
        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('   O scanner está protegido contra falsos positivos PT-BR');
        console.log('   e detecta corretamente mojibake real.');
        process.exit(0);
    } else {
        console.log('⚠️ ALGUNS TESTES FALHARAM!');
        console.log('');
        console.log('Falhas:');
        for (const failure of failures) {
            console.log(`   - ${failure.type}: "${failure.text}"`);
            console.log(`     ${failure.description}`);
        }
        process.exit(1);
    }
}

// Executar testes
runTests();
