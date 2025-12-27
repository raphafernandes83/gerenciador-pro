const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-settings-emoji-${Date.now()}`;

console.log('🔧 CORRIGINDO EMOJI ⚙️ PREFERÊNCIAS\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

// Fix Settings gear emoji in Preferências tab (linha ~659)
if (content.includes('data-tab="settings-preferencias"') && !content.match(/settings-preferencias.*?⚙️/s)) {
    content = content.replace(
        /(data-tab="settings-preferencias">\s*)(.*?)(Preferências)/s,
        '$1⚙️ $3'
    );
    console.log('  ✅ Fixed: ⚙️ Settings (Preferências tab)');

    fs.writeFileSync(file, content, 'utf-8');

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Emoji ⚙️ corrigido!`);
    console.log(`${'='.repeat(50)}\n`);
    console.log(`📁 Backup: ${backup}`);
    console.log('🔄 Reinicie o servidor e hard refresh!\n');
} else {
    console.log('  ℹ️ Emoji ⚙️ já está correto ou não encontrado');
}
