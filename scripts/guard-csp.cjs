/**
 * Guard CSP - Verificar que não há violações de CSP no HTML
 * 
 * Falha se encontrar:
 * - onclick= ou outros handlers inline
 * - onload=, onerror=, etc.
 * - <script> inline (sem src)
 * 
 * Executar: npm run guard:csp
 * 
 * @version TAREFA AUTOMAÇÃO - 27/12/2025
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ Guard CSP: Verificando index.html...\n');

const indexPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexPath, 'utf8');

const violations = [];

// Padrões proibidos
const patterns = [
    { regex: /\s+onclick\s*=/gi, name: 'onclick=' },
    { regex: /\s+onload\s*=/gi, name: 'onload=' },
    { regex: /\s+onerror\s*=/gi, name: 'onerror=' },
    { regex: /\s+onmouseover\s*=/gi, name: 'onmouseover=' },
    { regex: /\s+onsubmit\s*=/gi, name: 'onsubmit=' },
    { regex: /\s+onchange\s*=/gi, name: 'onchange=' },
    { regex: /\s+onfocus\s*=/gi, name: 'onfocus=' },
    { regex: /\s+onblur\s*=/gi, name: 'onblur=' },
    { regex: /\s+onkeydown\s*=/gi, name: 'onkeydown=' },
    { regex: /\s+onkeyup\s*=/gi, name: 'onkeyup=' },
    { regex: /<script>[\s\S]*?<\/script>/gi, name: '<script> inline' },
];

// Verificar cada padrão
patterns.forEach(({ regex, name }) => {
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
        violations.push({
            type: name,
            count: matches.length,
            samples: matches.slice(0, 3).map(m => m.trim().substring(0, 50))
        });
    }
});

// Resultado
if (violations.length === 0) {
    console.log('✅ Guard CSP PASSOU: Nenhuma violação encontrada!\n');
    process.exit(0);
} else {
    console.log('❌ Guard CSP FALHOU: Violações encontradas!\n');
    violations.forEach(v => {
        console.log(`  - ${v.type}: ${v.count} ocorrência(s)`);
        v.samples.forEach(s => console.log(`      "${s}..."`));
    });
    console.log('\n⚠️ Corrija as violações antes de continuar.');
    process.exit(1);
}
