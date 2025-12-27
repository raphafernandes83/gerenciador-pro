const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-header-emojis-${Date.now()}`;

console.log('🔧 CORRIGINDO 4 EMOJIS FINAIS DO HEADER\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

let fixed = 0;

// 1. Recycle (🔄) - linha ~42
const oldRecycle = content.match(/strategy-indicator-icon.*?<\/span>/s);
if (oldRecycle && !oldRecycle[0].includes('🔄')) {
    content = content.replace(
        /<span id="strategy-indicator-icon">.*?<\/span>/,
        '<span id="strategy-indicator-icon">🔄</span>'
    );
    fixed++;
    console.log('  ✅ Fixed: 🔄 Recycle (strategy indicator)');
}

// 2. Lock (🔒) - linha ~51  
if (content.includes('guided-mode-indicator') && !content.match(/guided-mode-indicator.*?🔒/s)) {
    content = content.replace(
        /(guided-mode-indicator.*?aria-label="Modo Guiado Ativo">\s*)(.*?)(\s*<span class="tooltip-text")/s,
        '$1🔒$3'
    );
    fixed++;
    console.log('  ✅ Fixed: 🔒 Lock (guided mode)');
}

// 3. Money (💹) - linha ~57
if (content.includes('compounding-indicator') && !content.match(/compounding-indicator.*?💹/s)) {
    content = content.replace(
        /(compounding-indicator.*?aria-label="Juros Compostos Ativos">\s*)(.*?)(\s*<span class="tooltip-text")/s,
        '$1💹$3'
    );
    fixed++;
    console.log('  ✅ Fixed: 💹 Money (compound interest)');
}

// 4. Eye (👁️) - linha ~63
if (content.includes('zen-mode-btn') && !content.match(/zen-mode-btn.*?👁/s)) {
    content = content.replace(
        /(id="zen-mode-btn".*?>\s*)(.*?)(\s*<\/button>)/s,
        '$1👁️$3'
    );
    fixed++;
    console.log('  ✅ Fixed: 👁️ Eye (zen mode)');
}

fs.writeFileSync(file, content, 'utf-8');

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ ${fixed}/4 emojis corrigidos!`);
console.log(`${'='.repeat(50)}\n`);
console.log(`📁 Backup: ${backup}`);
console.log('🔄 Reinicie o servidor e hard refresh!\n');
