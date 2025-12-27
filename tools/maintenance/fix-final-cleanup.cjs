const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-final-cleanup-${Date.now()}`;

console.log('🔧 CORREÇÃO FINAL - Caracteres Remanescentes\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

console.log('Corrigindo:\n');

// 1. Acentos remanescentes
const accentFixes = {
    'Ã‰': 'É',  // E com acento agudo maiúsculo
    'Ã ': 'à',  // a com acento grave
    'Ã¨': 'è',  // e com acento grave
};

let accentCount = 0;
for (const [wrong, correct] of Object.entries(accentFixes)) {
    const regex = new RegExp(wrong, 'g');
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, correct);
        accentCount += matches;
        console.log(`  ✅ "${wrong}" → "${correct}" (${matches}x)`);
    }
}

// 2. Emojis remanescentes (usando padrão direto da busca)
const emojiPatterns = [
    // Fire (🔥) - linhas 120
    { pattern: 'ðŸ"¥', replacement: '🔥', name: 'Fire' },
    // Skull (💀) - linha 123
    { pattern: 'ðŸ'€', replacement: '💀', name: 'Skull' },
];

let emojiCount = 0;
for (const { pattern, replacement, name } of emojiPatterns) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, replacement);
        emojiCount += matches;
        console.log(`  ✅ ${pattern} → ${replacement} ${name} (${matches}x)`);
    }
}

fs.writeFileSync(file, content, 'utf-8');

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Acentos: ${accentCount} | Emojis: ${emojiCount}`);
console.log(`✅ TOTAL: ${accentCount + emojiCount} correções`);
console.log(`${'='.repeat(50)}\n`);
console.log(`📁 Backup: ${backup}`);
console.log('🔄 Reinicie o servidor e hard refresh!\n');
