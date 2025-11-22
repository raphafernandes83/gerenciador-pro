#!/usr/bin/env node
/**
 * Script de migração automática: classList → domHelper
 * CHECKPOINT 2.2 - Migração em lote
 */

const fs = require('fs');
const path = require('path');

const UI_FILE = path.join(__dirname, 'ui.js');

// Padrões a migrar
const patterns = [
    // .classList.add('class') → domHelper.addClass(element, 'class')
    {
        regex: /(\w+)\.classList\.add\(([^)]+)\)/g,
        replace: (match, element, classes) => {
            // Já tem comentário de checkpoint? Pula
            if (match.includes('🆕 CHECKPOINT')) return match;
            return `domHelper.addClass(${element}, ${classes})`;
        }
    },
    // .classList.remove('class') → domHelper.removeClass(element, 'class')
    {
        regex: /(\w+)\.classList\.remove\(([^)]+)\)/g,
        replace: (match, element, classes) => {
            if (match.includes('🆕 CHECKPOINT')) return match;
            return `domHelper.removeClass(${element}, ${classes})`;
        }
    },
    // .classList.toggle('class', condition) → domHelper.toggleClass(element, 'class', condition)
    {
        regex: /(\w+)\.classList\.toggle\(([^,)]+)(?:,\s*([^)]+))?\)/g,
        replace: (match, element, className, condition) => {
            if (match.includes('🆕 CHECKPOINT')) return match;
            const args = [element, className, condition].filter(Boolean).join(', ');
            return `domHelper.toggleClass(${args})`;
        }
    },
    // .classList.contains('class') → domHelper.hasClass(element, 'class')
    {
        regex: /(\w+)\.classList\.contains\(([^)]+)\)/g,
        replace: (match, element, className) => {
            if (match.includes('🆕 CHECKPOINT')) return match;
            return `domHelper.hasClass(${element}, ${className})`;
        }
    }
];

function migrateFile() {
    console.log('🔄 Migrando ui.js...');

    let content = fs.readFileSync(UI_FILE, 'utf-8');
    const originalContent = content;

    let totalReplacements = 0;

    patterns.forEach(({ regex, replace }) => {
        let count = 0;
        content = content.replace(regex, (...args) => {
            const result = replace(...args);
            if (result !== args[0]) count++;
            return result;
        });

        if (count > 0) {
            console.log(`  ✅ Padrão migrado: ${count} ocorrências`);
            totalReplacements += count;
        }
    });

    if (totalReplacements > 0) {
        fs.writeFileSync(UI_FILE, content, 'utf-8');
        console.log(`\n✅ Total: ${totalReplacements} migrações realizadas`);
    } else {
        console.log('\n⚠️ Nenhuma migração necessária');
    }
}

try {
    migrateFile();
} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
