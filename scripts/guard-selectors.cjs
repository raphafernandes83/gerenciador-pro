/**
 * =============================================================================
 * GUARD SELECTORS - Validador de Selectors Críticos
 * =============================================================================
 * 
 * Valida:
 * - Selectors HTML existem no index.html
 * - Selectors CSS existem nos arquivos CSS
 * - Selectors JS são referenciados no código
 * 
 * @version TAREFA 33 - 29/12/2025
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const CONTRACT_PATH = path.join(__dirname, '..', 'src', 'contracts', 'selectors-contract.json');
const ROOT_DIR = path.join(__dirname, '..');

// Arquivos a verificar
const HTML_FILES = ['index.html'];
const CSS_DIRS = ['css'];
const JS_FILES = ['ui.js', 'events.js', 'main.js', 'sidebar.js'];
const JS_DIRS = ['src'];

// =============================================================================
// FUNÇÕES
// =============================================================================

/**
 * Lê conteúdo de um arquivo
 */
function readFile(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
}

/**
 * Lê todos os arquivos de um diretório recursivamente
 */
function readAllFilesInDir(dir, extension) {
    let content = '';
    const fullDir = path.join(ROOT_DIR, dir);

    if (!fs.existsSync(fullDir)) return content;

    function walkDir(currentDir) {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith(extension)) {
                content += fs.readFileSync(filePath, 'utf-8') + '\n';
            }
        }
    }

    walkDir(fullDir);
    return content;
}

/**
 * Verifica se um selector está presente no conteúdo
 */
function selectorExists(content, selector) {
    // Busca simples por substring
    return content.includes(selector);
}

// =============================================================================
// MAIN
// =============================================================================

console.log('🔍 Guard Selectors: Validando selectors críticos...\n');

// Ler contrato
if (!fs.existsSync(CONTRACT_PATH)) {
    console.error('❌ selectors-contract.json não encontrado!');
    process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf-8'));

// Carregar conteúdos
let htmlContent = '';
HTML_FILES.forEach(file => {
    htmlContent += readFile(path.join(ROOT_DIR, file));
});

let cssContent = '';
CSS_DIRS.forEach(dir => {
    cssContent += readAllFilesInDir(dir, '.css');
});

let jsContent = '';
JS_FILES.forEach(file => {
    jsContent += readFile(path.join(ROOT_DIR, file));
});
JS_DIRS.forEach(dir => {
    jsContent += readAllFilesInDir(dir, '.js');
});

let hasError = false;
const errors = [];
const validated = { html: 0, css: 0, js: 0 };

// Validar HTML selectors
console.log('   📄 Validando selectors HTML...');
for (const selector of contract.htmlMustHave || []) {
    if (selectorExists(htmlContent, selector)) {
        validated.html++;
    } else {
        hasError = true;
        errors.push(`❌ HTML: selector não encontrado: ${selector}`);
    }
}

// Validar CSS selectors
console.log('   🎨 Validando selectors CSS...');
for (const selector of contract.cssMustHave || []) {
    if (selectorExists(cssContent, selector)) {
        validated.css++;
    } else {
        hasError = true;
        errors.push(`❌ CSS: selector não encontrado: ${selector}`);
    }
}

// Validar JS selectors
console.log('   📦 Validando selectors JS...');
for (const selector of contract.jsMustHave || []) {
    if (selectorExists(jsContent, selector)) {
        validated.js++;
    } else {
        hasError = true;
        errors.push(`❌ JS: selector não encontrado: ${selector}`);
    }
}

// =============================================================================
// RESULTADO
// =============================================================================

if (hasError) {
    console.log('');
    for (const error of errors) {
        console.log(`   ${error}`);
    }
    console.log('\n❌ Guard Selectors FALHOU!\n');
    process.exit(1);
} else {
    const total = validated.html + validated.css + validated.js;
    console.log('\n✅ Guard Selectors PASSOU!\n');
    console.log(`   📋 ${total} selector(s) validado(s):`);
    console.log(`      ✓ HTML: ${validated.html}`);
    console.log(`      ✓ CSS: ${validated.css}`);
    console.log(`      ✓ JS: ${validated.js}\n`);
    process.exit(0);
}
