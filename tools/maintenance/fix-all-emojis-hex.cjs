const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-emoji-all-${Date.now()}`;

console.log('🔧 CORRIGINDO TODOS OS EMOJIS CORROMPIDOS\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

// Usar códigos hexadecimais para evitar corrupção no próprio script
const fixes = [
    // Chart up (3x)
    [/\u00f0\u0178\u201c\u02c6/g, '\uD83D\uDCC8'],
    // Recycle
    [/\u00f0\u0178\u201c\u201e/g, '\uD83D\uDD04'],
    // Lock
    [/\u00f0\u0178\u201c\u2018/g, '\uD83D\uDD12'],
    // Money with wings
    [/\u00f0\u0178\u2018\u00b9/g, '\uD83D\uDCB9'],
    // Eye
    [/\u00f0\u0178\u2018\u00ef\u00b8/g, '\uD83D\uDC41\uFE0F'],
    // Chart bar (2x) PRIORIDADE
    [/\u00f0\u0178\u201c\u0160/g, '\uD83D\uDCCA'],
    // Red circle PRIORIDADE
    [/\u00f0\u0178\u201c\u00b4/g, '\uD83D\uDD34'],
    // Fire
    [/\u00f0\u0178\u201c\u00a5/g, '\uD83D\uDD25'],
    // Skull
    [/\u00f0\u0178\u2018\u20ac/g, '\uD83D\uDC80'],
    // Chart down
    [/\u00f0\u0178\u201c\u2030/g, '\uD83D\uDCC9'],
    // Microscope
    [/\u00f0\u0178\u201c\u00ac/g, '\uD83D\uDD2C'],
    // Person
    [/\u00f0\u0178\u2018\u00a4/g, '\uD83D\uDC64'],
    // Floppy
    [/\u00f0\u0178\u2018\u00be/g, '\uD83D\uDCBE'],
    // Trash can (5x)
    [/\u00f0\u0178\u2014\u2018\u00ef\u00b8/g, '\uD83D\uDDD1\uFE0F'],
    // Light bulb (4x)
    [/\u00f0\u0178\u2018\u00a1/g, '\uD83D\uDCA1'],
    // Shield
    [/\u00f0\u0178\u203a\u00a1\u00ef\u00b8/g, '\uD83D\uDEE1\uFE0F'],
];

let totalFixed = 0;

fixes.forEach(([regex, replacement], index) => {
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, replacement);
        totalFixed += matches;
        console.log(`  ✅ Fix ${index + 1}: ${matches} ocorrências`);
    }
});

fs.writeFileSync(file, content, 'utf-8');

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ TOTAL: ${totalFixed} emojis corrigidos!`);
console.log(`${'='.repeat(50)}\n`);
console.log(`📁 Backup: ${backup}`);
console.log('🔄 Reinicie o servidor e dê hard refresh!\n');
