const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-emoji-all-${Date.now()}`;

console.log('🔧 CORRIGINDO TODOS OS 25 EMOJIS CORROMPIDOS\n');

// Backup
fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

// Mapeamento completo de TODOS os emojis corrompidos encontrados
const emojiMap = {
    // Header & Status indicators
    'ðŸ"ˆ': '📈',  // Chart up (3 ocorrências)
    'ðŸ"„': '🔄',  // Recycle
    'ðŸ"'': '🔒',  // Lock
    'ðŸ'¹': '💹',  // Money with wings
    'ðŸ'ï¸': '👁️', // Eye

    // Progress & Filters
    'ðŸ"Š': '📊',  // Chart bar (2 ocorrências) ⚠️ PRIORIDADE ALTA
    'ðŸ"´': '🔴',  // Red circle ⚠️ PRIORIDADE ALTA
    'ðŸ"¥': '🔥',  // Fire
    'ðŸ'€': '💀',  // Skull

    // Analysis
    'ðŸ"‰': '📉',  // Chart down

    // Modals
    'ðŸ"¬': '🔬',  // Microscope (Risk Lab)
    'ðŸ'¤': '👤',  // Person (Perfil)
    'ðŸ'¾': '💾',  // Floppy disk

    // Console logs & comments
    'ðŸ—'ï¸': '🗑️', // Trash can (5 ocorrências)
    'ðŸ'¡': '💡',  // Light bulb (4 ocorrências)
    'ðŸ›¡ï¸': '🛡️', // Shield
};

console.log('Aplicando correções:\n');

let totalFixed = 0;
const fixedByEmoji = {};

for (const [broken, correct] of Object.entries(emojiMap)) {
    // Escapar caracteres especiais para regex
    const escapedBroken = broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedBroken, 'g');

    const matches = (content.match(regex) || []).length;

    if (matches > 0) {
        content = content.replace(regex, correct);
        totalFixed += matches;
        fixedByEmoji[correct] = matches;
        console.log(`  ✅ ${broken} → ${correct} (${matches}x)`);
    }
}

// Salvar arquivo corrigido
fs.writeFileSync(file, content, 'utf-8');

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ TOTAL: ${totalFixed} emojis corrigidos!`);
console.log(`${'='.repeat(50)}\n`);

console.log('Resumo por emoji:');
for (const [emoji, count] of Object.entries(fixedByEmoji)) {
    console.log(`  ${emoji} : ${count}x`);
}

console.log(`\n📁 Backup salvo em: ${backup}`);
console.log('🔄 Reinicie o servidor e dê hard refresh (Ctrl+Shift+R)\n');
