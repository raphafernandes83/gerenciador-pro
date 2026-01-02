/**
 * =============================================================================
 * GUARD CSS ORDER - Validador de Ordem de CSS
 * =============================================================================
 * 
 * Valida:
 * - Sem CSS duplicado
 * - Arquivos CSS existem no disco
 * - Themes (theme-*.css) aparecem após base/layout
 * 
 * @version TAREFA 31 - 29/12/2025
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const INDEX_PATH = path.join(__dirname, '..', 'index.html');

// CSS que devem vir ANTES de qualquer theme-*.css
const BASE_CSS_PATTERNS = [
    'style.css',
    'modals.css',
    'cards.css',
    'tables.css',
    'header.css',
    'sidebar.css',
];

// =============================================================================
// FUNÇÕES
// =============================================================================

/**
 * Extrai hrefs de <link rel="stylesheet"> do HTML
 */
function extractCssLinks(html) {
    const regex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
    const links = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        links.push(match[1]);
    }

    // Também captura formato alternativo: href antes de rel
    const regex2 = /<link[^>]+href=["']([^"']+\.css)["'][^>]+rel=["']stylesheet["'][^>]*>/gi;
    while ((match = regex2.exec(html)) !== null) {
        if (!links.includes(match[1])) {
            links.push(match[1]);
        }
    }

    return links;
}

/**
 * Verifica se arquivo existe
 */
function fileExists(href) {
    const fullPath = path.join(__dirname, '..', href);
    return fs.existsSync(fullPath);
}

/**
 * Verifica se é um arquivo de tema
 */
function isThemeFile(href) {
    return /theme-[^/]+\.css$/i.test(href);
}

// =============================================================================
// MAIN
// =============================================================================

console.log('🎨 Guard CSS Order: Verificando ordem de CSS...\n');

// Ler index.html
if (!fs.existsSync(INDEX_PATH)) {
    console.error('❌ index.html não encontrado!');
    process.exit(1);
}

const html = fs.readFileSync(INDEX_PATH, 'utf-8');
const cssLinks = extractCssLinks(html);

console.log(`   📁 ${cssLinks.length} arquivo(s) CSS encontrado(s)\n`);

let hasError = false;
const errors = [];

// 1. Verificar duplicatas
const seen = new Set();
const duplicates = [];

for (const href of cssLinks) {
    if (seen.has(href)) {
        duplicates.push(href);
    } else {
        seen.add(href);
    }
}

if (duplicates.length > 0) {
    hasError = true;
    errors.push(`❌ CSS duplicado: ${duplicates.join(', ')}`);
}

// 2. Verificar arquivos existem (apenas para locais, não CDN)
const missing = [];
for (const href of cssLinks) {
    if (!href.startsWith('http') && !fileExists(href)) {
        missing.push(href);
    }
}

if (missing.length > 0) {
    hasError = true;
    errors.push(`❌ CSS não encontrado: ${missing.join(', ')}`);
}

// 3. Verificar ordem: themes devem vir depois dos base
let firstThemeIndex = -1;
let lastBaseIndex = -1;

cssLinks.forEach((href, index) => {
    // Encontrar primeiro theme
    if (isThemeFile(href) && firstThemeIndex === -1) {
        firstThemeIndex = index;
    }

    // Encontrar último base CSS
    for (const basePattern of BASE_CSS_PATTERNS) {
        if (href.includes(basePattern)) {
            lastBaseIndex = index;
        }
    }
});

if (firstThemeIndex !== -1 && lastBaseIndex !== -1 && firstThemeIndex < lastBaseIndex) {
    hasError = true;
    errors.push(`❌ Ordem errada: theme-*.css (posição ${firstThemeIndex}) antes de base CSS (posição ${lastBaseIndex})`);
}

// =============================================================================
// RESULTADO
// =============================================================================

if (hasError) {
    console.log('');
    for (const error of errors) {
        console.log(`   ${error}`);
    }
    console.log('\n❌ Guard CSS Order FALHOU!\n');
    process.exit(1);
} else {
    console.log('   📋 Ordem de CSS validada:');
    cssLinks.forEach((href, i) => {
        const marker = isThemeFile(href) ? '🎨' : '📄';
        console.log(`      ${i + 1}. ${marker} ${href}`);
    });

    console.log('\n✅ Guard CSS Order PASSOU!\n');
    console.log(`   📋 ${cssLinks.length} arquivo(s) CSS`);
    console.log(`   ✓ Sem duplicatas`);
    console.log(`   ✓ Todos existem no disco`);
    console.log(`   ✓ Themes após base CSS\n`);
    process.exit(0);
}
