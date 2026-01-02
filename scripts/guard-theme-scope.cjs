/**
 * =============================================================================
 * GUARD: THEME SCOPE
 * =============================================================================
 * 
 * Valida que CSS de tema não "vaza" fora do escopo body[data-theme="..."].
 * Evita que um tema contamine outro causando bugs de layout.
 * 
 * @version TAREFA 26J - 29/12/2025
 * 
 * Uso: node scripts/guard-theme-scope.cjs
 * Exit 0 = PASS, Exit 1 = FAIL
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Diretório de CSS
const CSS_DIR = path.join(process.cwd(), 'css');

// Padrão para identificar arquivos de tema
const THEME_FILE_PATTERN = /^theme-.*\.css$/;

// Regras permitidas fora do escopo (ex: preview cards, keyframes)
const ALLOWED_UNSCOPED = [
    /^\.theme-card\[data-theme=/,           // Preview cards no seletor
    /^\.unified-pro-preview/,               // Preview específico
    /^@keyframes/,                          // Keyframes são globais
    /^@media/,                              // Media queries
];

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Encontra arquivos de tema no diretório css
 */
function findThemeFiles() {
    if (!fs.existsSync(CSS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CSS_DIR);
    return files
        .filter(f => THEME_FILE_PATTERN.test(f))
        .map(f => path.join(CSS_DIR, f));
}

/**
 * Lê um arquivo e retorna seu conteúdo
 */
function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Remove comentários CSS do conteúdo
 */
function removeComments(content) {
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extrai seletores de nível superior (fora de blocos aninhados)
 */
function extractTopLevelSelectors(content) {
    const lines = content.split('\n');
    const selectors = [];
    let braceDepth = 0;
    let lineNumber = 0;

    for (const line of lines) {
        lineNumber++;
        const trimmed = line.trim();

        // Ignora linhas vazias
        if (!trimmed) continue;

        // Conta chaves na linha
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;

        // Se estamos no nível 0 e a linha tem um seletor que abre bloco
        if (braceDepth === 0 && openBraces > 0) {
            const selector = trimmed.split('{')[0].trim();
            if (selector && !selector.startsWith('/*')) {
                selectors.push({
                    selector,
                    line: lineNumber
                });
            }
        }

        braceDepth += openBraces - closeBraces;
        if (braceDepth < 0) braceDepth = 0;
    }

    return selectors;
}

/**
 * Valida se um seletor está no escopo correto
 */
function isSelectorScopedCorrectly(selector) {
    // Deve começar com body[data-theme=
    if (selector.startsWith('body[data-theme=')) {
        return true;
    }

    // Verifica se está na lista de permitidos
    for (const pattern of ALLOWED_UNSCOPED) {
        if (pattern.test(selector)) {
            return true;
        }
    }

    return false;
}

// =============================================================================
// MAIN
// =============================================================================

console.log('🔍 Guard Theme Scope: Validando escopo de CSS de temas...\n');

// Encontrar arquivos de tema
const themeFiles = findThemeFiles();

if (themeFiles.length === 0) {
    console.log('   ⚠️ Nenhum arquivo theme-*.css encontrado em css/.\n');
    console.log('✅ Guard Theme Scope PASSOU! (nada para validar)\n');
    process.exit(0);
}

console.log(`   📁 Arquivos encontrados: ${themeFiles.length}\n`);

let hasErrors = false;
const errors = [];

for (const file of themeFiles) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   Verificando: ${relativePath}...`);

    const content = readFile(file);
    const cleanContent = removeComments(content);
    const selectors = extractTopLevelSelectors(cleanContent);

    for (const { selector, line } of selectors) {
        // Ignora seletores vazios
        if (!selector.trim()) continue;

        // Valida escopo
        if (!isSelectorScopedCorrectly(selector)) {
            errors.push({
                file: relativePath,
                line,
                selector: selector.substring(0, 80) + (selector.length > 80 ? '...' : '')
            });
            hasErrors = true;
        }
    }
}

// =============================================================================
// RESULTADO
// =============================================================================

console.log('');

if (hasErrors) {
    console.error('❌ Guard Theme Scope FALHOU!\n');
    console.error('   Seletores fora de escopo encontrados:\n');

    for (const err of errors) {
        console.error(`   ❌ ${err.file}:${err.line}`);
        console.error(`      Seletor: ${err.selector}\n`);
    }

    console.error('   💡 CSS de tema deve estar sob body[data-theme="..."] { ... }');
    console.error('   💡 Exceções permitidas: .theme-card[data-theme=...], @keyframes, @media\n');
    process.exit(1);
} else {
    console.log('✅ Guard Theme Scope PASSOU!\n');
    console.log(`   📋 ${themeFiles.length} arquivo(s) validado(s):`);
    for (const file of themeFiles) {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`      ✓ ${relativePath}`);
    }
    console.log('');
    process.exit(0);
}
