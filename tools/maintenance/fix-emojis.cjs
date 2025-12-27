const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-emoji-${Date.now()}`;

console.log('🔧 CORRIGINDO EMOJIS...\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}`);

let content = fs.readFileSync(file, 'utf-8');

// Emojis corrompidos - mapeamento exato
const emojiMap = {
    'ðŸ"ˆ': '📈',
    'ðŸ"„': '🔄',
    'ðŸ"'': '🔒',
    'ðŸ'¹': '💹',
    'ðŸ'ï¸': '👁️',
    'â¤¡': '⤡',
    'âÅ¡â„¢Ã¯Â¸Â': '⚙️',
    'ðŸ§ª': '🧪',
    'ðŸ"¥': '🔥',
    'ðŸ'€': '💀',
    'ðŸŽ¯': '🎯',
    'ðŸŸ¢': '🟢',
    'ðŸ"´': '🔴',
    'ðŸ"Š': '📊',
};

let count = 0;
for (const [broken, correct] of Object.entries(emojiMap)) {
    const regex = new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, correct);
        count += matches;
        console.log(`  ✅ ${broken} → ${correct} (${matches}x)`);
    }
}

fs.writeFileSync(file, content, 'utf-8');

console.log(`\n✅ ${count} emojis corrigidos!`);
