/**
 * 🔧 Mojibake Fixer - TAREFA 44
 * Corrige caracteres mojibake em arquivos runtime
 * 
 * Uso: node tools/mojibake_hunter/fix-runtime-mojibake.cjs
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
const MOJIBAKE_FIXES = {
    // DOUBLE_ENCODED_LATIN (mais comuns)
    'Ã£': 'ã',
    'Ã©': 'é',
    'Ã§': 'ç',
    'Ãµ': 'õ',
    'Ã¡': 'á',
    'Ã³': 'ó',
    'Ã­': 'í',
    'Ãº': 'ú',
    'Ã‰': 'É',
    'Ãƒ': 'Ã',  // Ã maiúsculo (cuidado - verificar contexto)
    'Ã¢': 'â',
    'Ãª': 'ê',
    'Ã´': 'ô',
    'Ã¼': 'ü',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'ÃŠ': 'Ê',
    'Ã"': 'Ó',
    'Ãš': 'Ú',
    'Ã': 'Í',  // Ã seguido de nada específico = Í (verificar)

    // ORDINAL_MOJIBAKE
    'Âª': 'ª',
    'Âº': 'º',

    // DOUBLE_ENCODED_EXTENDED
    'Â°': '°',
    'Â³': '³',
    'Â²': '²',
    'Â·': '·',

    // QUOTE_MOJIBAKE (aspas corrompidas)
    'â€œ': '"',  // Left double quotation mark
    'â€': '"',   // Right double quotation mark  
    'â€™': "'",  // Right single quotation mark
    'â€˜': "'",  // Left single quotation mark
    'â€¢': '•',  // Bullet
    'â€¦': '…',  // Ellipsis
    'â€"': '–',  // En dash
    'â€"': '—',  // Em dash
};

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
    for (const [mojibake, correct] of Object.entries(MOJIBAKE_FIXES)) {
        const regex = new RegExp(escapeRegex(mojibake), 'g');
        const matches = content.match(regex);

        if (matches && matches.length > 0) {
            content = content.replace(regex, correct);

            stats.byFile[filePath][mojibake] = matches.length;
            stats.byPattern[mojibake] = (stats.byPattern[mojibake] || 0) + matches.length;
            fileReplacements += matches.length;

            console.log(`   ${mojibake} → ${correct}: ${matches.length}x`);
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
 * Escapa caracteres especiais para regex
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Execução principal
 */
function main() {
    console.log('🔧 Mojibake Fixer - TAREFA 44');
    console.log('='.repeat(50));
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
            .forEach(([pattern, count]) => {
                console.log(`   "${pattern}": ${count}`);
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
