/**
 * Script para Analisar e Migrar Seletores DOM
 * Identifica document.querySelector/getElementById e sugere usar dom.js
 */

const fs = require('fs');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Uso: node analyze-dom-selectors.js <arquivo>');
    process.exit(1);
}

const filePath = args[0];
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Padrões a buscar
const patterns = [
    {
        name: 'getElementById',
        regex: /document\.getElementById\(['"]([^'"]+)['"]\)/g,
        priority: 'high'
    },
    {
        name: 'querySelector by ID',
        regex: /document\.querySelector\(['"](#[^'"]+)['"]\)/g,
        priority: 'high'
    },
    {
        name: 'querySelector by class',
        regex: /document\.querySelector\(['"](\.[^'"]+)['"]\)/g,
        priority: 'medium'
    },
    {
        name: 'querySelectorAll',
        regex: /document\.querySelectorAll\(['"]([^'"]+)['"]\)/g,
        priority: 'low'
    }
];

const findings = [];

// Busca por linha
lines.forEach((line, index) => {
    const lineNum = index + 1;

    patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.regex.source, 'g');

        while ((match = regex.exec(line)) !== null) {
            findings.push({
                line: lineNum,
                type: pattern.name,
                selector: match[1],
                fullMatch: match[0],
                priority: pattern.priority,
                code: line.trim()
            });
        }
    });
});

if (findings.length === 0) {
    console.log(`✅ Nenhum seletor direto encontrado em ${filePath}`);
    process.exit(0);
}

// Agrupa por prioridade
const byPriority = {
    high: findings.filter(f => f.priority === 'high'),
    medium: findings.filter(f => f.priority === 'medium'),
    low: findings.filter(f => f.priority === 'low')
};

console.log(`\n📊 ANÁLISE DE SELETORES DOM: ${filePath}`);
console.log(`${'='.repeat(60)}\n`);

console.log(`🔍 Total encontrado: ${findings.length} seletores diretos\n`);

// Mostra por prioridade
['high', 'medium', 'low'].forEach(priority => {
    const items = byPriority[priority];
    if (items.length === 0) return;

    const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    const label = priority === 'high' ? 'ALTA' : priority === 'medium' ? 'MÉDIA' : 'BAIXA';

    console.log(`${emoji} Prioridade ${label}: ${items.length} ocorrências`);
    console.log(`${'-'.repeat(60)}`);

    items.forEach(item => {
        console.log(`  Linha ${item.line}: ${item.type}`);
        console.log(`  Seletor: ${item.selector}`);
        console.log(`  Código: ${item.code}`);

        // Sugere substituição
        const suggestion = suggestReplacement(item);
        if (suggestion) {
            console.log(`  ✨ Sugestão: ${suggestion}`);
        }
        console.log('');
    });
});

console.log(`\n${'='.repeat(60)}`);
console.log(`📋 RESUMO:`);
console.log(`  🔴 Alta prioridade (getElementById): ${byPriority.high.length}`);
console.log(`  🟡 Média prioridade (querySelector): ${byPriority.medium.length}`);
console.log(`  🟢  Baixa prioridade (querySelectorAll): ${byPriority.low.length}`);
console.log(`  📊 Total: ${findings.length}`);

// Salva relatório JSON
const reportPath = filePath.replace(/\.js$/, '.dom-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify({
    file: filePath,
    timestamp: new Date().toISOString(),
    total: findings.length,
    byPriority,
    findings
}, null, 2));

console.log(`\n💾 Relatório salvo em: ${reportPath}`);

function suggestReplacement(item) {
    // Remove # se for ID
    let cleanSelector = item.selector.replace(/^#/, '');

    if (item.type.includes('getElementById') || item.type.includes('by ID')) {
        // Converte kebab-case para camelCase
        const camelCase = cleanSelector.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return `dom.${camelCase}`;
    }

    if (item.type.includes('class')) {
        // Para classes, sugere querySelector direto ou criação de novo elemento no dom.js
        return `Adicionar ao dom.js ou usar querySelector se dinâmico`;
    }

    if (item.type.includes('querySelectorAll')) {
        return `Verificar se já existe no dom.js (ex: dom.mainTabButtons)`;
    }

    return null;
}
