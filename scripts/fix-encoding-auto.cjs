/**
 * Fix Encoding Automatico - Remove caracteres de controle
 * Executar: node scripts/fix-encoding-auto.cjs
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const FILES_TO_FIX = [
    'ui.js',
    'main.js',
    'style.css',
    'index.html',
    'src/ui/templates/ParametersCardController.js'
];

// Caracteres de controle C1 para remover (U+0080 a U+009F)
const CONTROL_CHAR_REGEX = /[\u0080-\u009F]/g;

function fixFile(filePath) {
    const fullPath = path.join(rootDir, filePath);

    if (!fs.existsSync(fullPath)) {
        console.log('   [SKIP] ' + filePath + ': nao encontrado');
        return { fixed: 0, file: filePath };
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.length;

    // Remover caracteres de controle C1
    const matches = content.match(CONTROL_CHAR_REGEX);
    const fixCount = matches ? matches.length : 0;
    content = content.replace(CONTROL_CHAR_REGEX, '');

    // Salvar se houve mudancas
    if (fixCount > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('   [OK] ' + filePath + ': ' + fixCount + ' controles removidos');
    } else {
        console.log('   [--] ' + filePath + ': sem controles');
    }

    return { fixed: fixCount, file: filePath };
}

// Executar
console.log('\nFix Encoding - Remocao de Caracteres de Controle\n');
console.log('Processando arquivos...\n');

let totalFixes = 0;

for (const file of FILES_TO_FIX) {
    const result = fixFile(file);
    totalFixes += result.fixed;
}

console.log('\n--------------------------------------------------');
console.log('Total: ' + totalFixes + ' caracteres removidos em ' + FILES_TO_FIX.length + ' arquivos');
console.log('--------------------------------------------------\n');

if (totalFixes > 0) {
    console.log('Correcoes aplicadas. Execute npm run guard:encoding para validar.');
}
