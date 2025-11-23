/**
 * Script Automático para Migração de Seletores DOM
 * Migra document.getElementById para dom.elementName
 */

const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Uso: node migrate-dom-selectors.js <arquivo> <analysis.json>');
    process.exit(1);
}

const filePath = args[0];
const analysisPath = args[1];

// Lê análise
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
let content = fs.readFileSync(filePath, 'utf-8');

console.log(`\n🔧 MIGRANDO SELETORES DOM: ${filePath}`);
console.log(`${'='.repeat(60)}\n`);

let migratedCount = 0;
const elementsToAdd = new Set();

// Ordena por linha (de trás para frente para não afetar números de linha)
const sortedFindings = analysis.findings.sort((a, b) => b.line - a.line);

sortedFindings.forEach(finding => {
    if (finding.priority !== 'high') return; // Só getElementById por enquanto

    const cleanSelector = finding.selector.replace(/^#/, '');
    const camelCase = cleanSelector.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    // Verifica se já existe no dom.js
    // Para esse exemplo, vamos assumir que elementos precisam ser adicionados
    const domProperty = `dom.${camelCase}`;

    // Padrões a substituir
    const patterns = [
        `document.getElementById('${cleanSelector}')`,
        `document.getElementById("${cleanSelector}")`,
        `document.querySelector('#${cleanSelector}')`,
        `document.querySelector("#${cleanSelector}")`,
    ];

    patterns.forEach(pattern => {
        if (content.includes(pattern)) {
            content = content.replace(new RegExp(escapeRegex(pattern), 'g'), domProperty);
            migratedCount++;
            console.log(`  ✅ Linha ~${finding.line}: ${cleanSelector} → ${domProperty}`);
        }
    });

    // Marca para adicionar ao dom.js se não existe
    if (finding.type.includes('getElementById')) {
        elementsToAdd.add({ id: cleanSelector, property: camelCase });
    }
});

// Salva arquivo modificado
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Migração concluída!`);
console.log(`  📝 Arquivo: ${filePath}`);
console.log(`  🔄 Migrações: ${migratedCount}`);

if (elementsToAdd.size > 0) {
    console.log(`\n⚠️  ATENÇÃO: ${elementsToAdd.size} elementos podem precisar ser adicionados ao dom.js:`);
    console.log(`${'  '.repeat(2)}Verifique se já existem ou adicione:\n`);

    elementsToAdd.forEach(el => {
        console.log(`  dom.${el.property} = safeGetElement('${el.id}');`);
    });
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
