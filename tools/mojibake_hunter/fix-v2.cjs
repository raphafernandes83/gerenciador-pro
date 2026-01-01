/**
 * 🔧 Mojibake Fixer v2 - TAREFA 44
 * Corrige caracteres mojibake usando substituições precisas baseadas em hex
 * 
 * Uso: node tools/mojibake_hunter/fix-v2.cjs
 */

const fs = require('fs');
const path = require('path');

// Arquivos alvo (runtime do baseline T42)
const TARGET_FILES = [
    'ui.js',
    'style.css',
    'src/ui/templates/ParametersCardController.js',
    'fix_main_encoding.cjs',
    'fix_encoding_hex.cjs',
];

// Mapa de substituições mojibake -> UTF-8 correto
// Usando hex codes para precisão
const MOJIBAKE_FIXES = [
    // DOUBLE_ENCODED_LATIN - par de bytes que representam caracteres acentuados
    // Quando UTF-8 é interpretado como Latin-1 e re-codificado como UTF-8
    ['\u00C3\u00A3', 'ã'],  // Ã£ -> ã (a til)
    ['\u00C3\u00A9', 'é'],  // Ã© -> é
    ['\u00C3\u00A7', 'ç'],  // Ã§ -> ç
    ['\u00C3\u00B5', 'õ'],  // Ãµ -> õ
    ['\u00C3\u00A1', 'á'],  // Ã¡ -> á
    ['\u00C3\u00B3', 'ó'],  // Ã³ -> ó
    ['\u00C3\u00AD', 'í'],  // Ã­ -> í (i agudo)
    ['\u00C3\u00BA', 'ú'],  // Ãº -> ú
    ['\u00C3\u00A2', 'â'],  // Ã¢ -> â
    ['\u00C3\u00AA', 'ê'],  // Ãª -> ê
    ['\u00C3\u00B4', 'ô'],  // Ã´ -> ô
    ['\u00C3\u00BC', 'ü'],  // Ã¼ -> ü
    ['\u00C3\u0089', 'É'],  // Ã‰ -> É (E maiúsculo agudo)
    ['\u00C3\u0083', 'Ã'],  // Ãƒ -> Ã (A maiúsculo til) - HEX: C3 83
    ['\u00C3\u0093', 'Ó'],  // Ã" -> Ó
    ['\u00C3\u008A', 'Ê'],  // ÃŠ -> Ê
    ['\u00C3\u009A', 'Ú'],  // Ãš -> Ú
    ['\u00C3\u008D', 'Í'],  // Ã -> Í (quando seguido de 0x8D)

    // ORDINAL_MOJIBAKE
    ['\u00C2\u00AA', 'ª'],  // Âª -> ª
    ['\u00C2\u00BA', 'º'],  // Âº -> º

    // DOUBLE_ENCODED_EXTENDED
    ['\u00C2\u00B0', '°'],  // Â° -> °
    ['\u00C2\u00B3', '³'],  // Â³ -> ³
    ['\u00C2\u00B2', '²'],  // Â² -> ²
    ['\u00C2\u00B7', '·'],  // Â· -> · (middle dot)

    // QUOTE_MOJIBAKE (aspas corrompidas)
    ['\u00E2\u0080\u009C', '"'],  // â€œ -> " (left double quote)
    ['\u00E2\u0080\u009D', '"'],  // â€ -> " (right double quote)  
    ['\u00E2\u0080\u0099', "'"],  // â€™ -> '
    ['\u00E2\u0080\u0098', "'"],  // â€˜ -> '
    ['\u00E2\u0080\u00A2', '•'],  // â€¢ -> • (bullet)
    ['\u00E2\u0080\u00A6', '…'],  // â€¦ -> … (ellipsis)
    ['\u00E2\u0080\u0094', '—'],  // â€" -> — (em dash)
    ['\u00E2\u0080\u0093', '–'],  // â€" -> – (en dash)
];

// Estatísticas
const stats = {
    totalFiles: 0,
    totalReplacements: 0,
    byFile: {},
    byPattern: {},
};

/**
 * Corrige mojibake em um arquivo
 */
function fixFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Arquivo não encontrado: ${filePath}`);
        return false;
    }

    console.log(`\n📄 Processando: ${filePath}`);

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    stats.byFile[filePath] = {};
    let fileReplacements = 0;

    // Aplicar substituições
    for (const [mojibake, correct] of MOJIBAKE_FIXES) {
        let count = 0;
        let newContent = content;

        // Contar e substituir
        while (newContent.includes(mojibake)) {
            newContent = newContent.replace(mojibake, correct);
            count++;
        }

        if (count > 0) {
            content = newContent;
            stats.byFile[filePath][mojibake] = count;
            const key = `${showHex(mojibake)} → ${correct}`;
            stats.byPattern[key] = (stats.byPattern[key] || 0) + count;
            fileReplacements += count;

            console.log(`   ${showHex(mojibake)} → ${correct}: ${count}x`);
        }
    }

    if (fileReplacements > 0) {
        // Salvar arquivo corrigido
        fs.writeFileSync(fullPath, content, 'utf8');
        stats.totalReplacements += fileReplacements;
        stats.totalFiles++;
        console.log(`   ✅ ${fileReplacements} correções aplicadas`);
        return true;
    } else {
        console.log(`   ℹ️ Nenhum mojibake encontrado`);
        return false;
    }
}

/**
 * Mostra string como sequência hex
 */
function showHex(str) {
    return [...str].map(c => {
        const code = c.charCodeAt(0);
        if (code > 127) return `\\u${code.toString(16).padStart(4, '0').toUpperCase()}`;
        if (code < 32) return `\\x${code.toString(16).padStart(2, '0')}`;
        return c;
    }).join('');
}

/**
 * Execução principal
 */
function main() {
    console.log('🔧 Mojibake Fixer v2 - TAREFA 44');
    console.log('='.repeat(50));
    console.log('Usando substituições baseadas em hex para precisão');
    console.log('');
    console.log('📋 Arquivos alvo:', TARGET_FILES.length);

    const startTime = Date.now();

    // Processar cada arquivo
    for (const file of TARGET_FILES) {
        fixFile(file);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // Resumo
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 RESUMO');
    console.log('='.repeat(50));
    console.log(`   Tempo: ${elapsed}s`);
    console.log(`   Arquivos modificados: ${stats.totalFiles}`);
    console.log(`   Total de correções: ${stats.totalReplacements}`);
    console.log('');

    if (stats.totalReplacements > 0) {
        console.log('📈 Por padrão:');
        Object.entries(stats.byPattern)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .forEach(([pattern, count]) => {
                console.log(`   ${pattern}: ${count}`);
            });
        console.log('');

        console.log('📁 Por arquivo:');
        Object.entries(stats.byFile).forEach(([file, patterns]) => {
            const total = Object.values(patterns).reduce((sum, n) => sum + n, 0);
            if (total > 0) {
                console.log(`   ${file}: ${total} correções`);
            }
        });
    }

    console.log('');
    console.log('✅ Correção concluída!');
    console.log('🔍 Execute: npm run mojibake:scan para verificar');
}

main();
