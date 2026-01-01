/**
 * 🔧 Mojibake Fixer v3 - TAREFA 44 (Comprehensive)
 * Corrige TODOS os padrões mojibake incluindo subfolder
 */

const fs = require('fs');
const path = require('path');

// Arquivos alvo (incluindo subfolder)
const TARGET_FILES = [
    'ui.js',
    'style.css',
    'src/ui/templates/ParametersCardController.js',
    'fix_main_encoding.cjs',
    'fix_encoding_hex.cjs',
    '08 09 2025/ui.js',
    '08 09 2025/src/ui/templates/ParametersCardController.js',
];

// Mapa COMPLETO de substituições - usando regex para capturar todas as variantes
const FIXES = [
    // DOUBLE_ENCODED_LATIN - comum
    { from: /Ã£/g, to: 'ã' },
    { from: /Ã©/g, to: 'é' },
    { from: /Ã§/g, to: 'ç' },
    { from: /Ãµ/g, to: 'õ' },
    { from: /Ã¡/g, to: 'á' },
    { from: /Ã³/g, to: 'ó' },
    { from: /Ã­/g, to: 'í' },
    { from: /Ãº/g, to: 'ú' },
    { from: /Ã¢/g, to: 'â' },
    { from: /Ãª/g, to: 'ê' },
    { from: /Ã´/g, to: 'ô' },
    { from: /Ã¼/g, to: 'ü' },

    // Maiúsculas - estes são os que estavam faltando!
    { from: /Ã‰/g, to: 'É' },  // É maiúsculo
    { from: /Ãƒ/g, to: 'Ã' },  // Ã maiúsculo (A com til)
    { from: /Ã"/g, to: 'Ó' },  // O com acento
    { from: /ÃŠ/g, to: 'Ê' },  // E circunflexo
    { from: /Ãš/g, to: 'Ú' },  // U com acento
    { from: /Ã€/g, to: 'À' },
    { from: /Ã‚/g, to: 'Â' },
    { from: /ÃŒ/g, to: 'Ì' },
    { from: /Ã'/g, to: 'Ò' },
    { from: /Ã™/g, to: 'Ù' },

    // ORDINAL_MOJIBAKE
    { from: /Âª/g, to: 'ª' },
    { from: /Âº/g, to: 'º' },

    // DOUBLE_ENCODED_EXTENDED
    { from: /Â°/g, to: '°' },
    { from: /Â³/g, to: '³' },
    { from: /Â²/g, to: '²' },
    { from: /Â·/g, to: '·' },

    // QUOTE_MOJIBAKE
    { from: /â€œ/g, to: '"' },
    { from: /â€/g, to: '"' },
    { from: /â€™/g, to: "'" },
    { from: /â€˜/g, to: "'" },
    { from: /â€¢/g, to: '•' },
    { from: /â€¦/g, to: '…' },
    { from: /â€"/g, to: '—' },
    { from: /â€"/g, to: '–' },
];

let totalFixes = 0;
const stats = {};

function fixFile(relativePath) {
    const fullPath = path.join(process.cwd(), relativePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️ Não encontrado: ${relativePath}`);
        return;
    }

    console.log(`📄 ${relativePath}`);
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileFixes = 0;
    stats[relativePath] = {};

    for (const fix of FIXES) {
        const matches = content.match(fix.from);
        if (matches && matches.length > 0) {
            content = content.replace(fix.from, fix.to);
            console.log(`   ${fix.from.source} → ${fix.to}: ${matches.length}x`);
            stats[relativePath][fix.from.source] = matches.length;
            fileFixes += matches.length;
        }
    }

    if (fileFixes > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`   ✅ ${fileFixes} correções`);
        totalFixes += fileFixes;
    } else {
        console.log(`   ℹ️ Limpo`);
    }
}

console.log('🔧 Mojibake Fixer v3 - TAREFA 44\n');

for (const file of TARGET_FILES) {
    fixFile(file);
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Total de correções: ${totalFixes}`);
console.log('✅ Concluído!');
