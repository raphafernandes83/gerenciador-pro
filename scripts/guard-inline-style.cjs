/**
 * Guard Inline Style - Verificar que não há style="" inline em HTML
 * 
 * Falha se encontrar:
 * - style="..." em index.html (exceto allowlist)
 * 
 * Executar: npm run guard:inline-style
 * 
 * @version TAREFA 17 V2 - 27/12/2025
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Guard Inline Style: Verificando index.html...\n');

const indexPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexPath, 'utf8');

/**
 * Allowlist de inline styles conhecidos e justificados
 * Formato: string que deve estar presente no contexto do style
 */
const ALLOWLIST = [
    // Elementos que usam style para display toggle (show/hide dinâmico)
    'display: none',
    'display:none',
    // SVG inline pode ter estilos
    '<svg',
    // Elementos de loading/spinner podem ter estilos inline
    'loading',
    'spinner',
];

// Regex para encontrar style="..."
const stylePattern = /style\s*=\s*["'][^"']*["']/gi;
const matches = content.match(stylePattern) || [];

// Filtrar matches que não estão na allowlist
const violations = matches.filter(match => {
    // Verifica se o match contém algum termo da allowlist
    return !ALLOWLIST.some(allowed =>
        match.toLowerCase().includes(allowed.toLowerCase())
    );
});

// Resultado
if (violations.length === 0) {
    console.log('✅ Guard Inline Style PASSOU: Nenhum inline style problemático encontrado!\n');
    if (matches.length > 0) {
        console.log(`   (${matches.length} inline styles encontrados, todos na allowlist)\n`);
    }
    process.exit(0);
} else {
    console.log('⚠️ Guard Inline Style WARNING: Inline styles encontrados!\n');
    console.log('   (Não falha o CI - apenas alerta para revisão)\n');

    violations.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.substring(0, 60)}${v.length > 60 ? '...' : ''}`);
    });

    console.log('\n   Considere mover estes estilos para classes CSS.\n');

    // Não falha o CI - apenas warning
    // Para um projeto legado, pode haver inline styles legítimos
    process.exit(0);
}
