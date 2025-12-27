const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-final-${Date.now()}`;

console.log('🔧 CORREÇÃO FINAL - EMOJIS\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}\n`);

let content = fs.readFileSync(file, 'utf-8');

// Usando códigos Unicode diretos para evitar syntax errors
// Substituir sequências corrompidas por códigos Unicode corretos
const fixes = [
    // Lock
    [/ðŸ"'/g, '\uD83D\uDD12'], // 🔒
    // Money with wings
    [/ðŸ'¹/g, '\uD83D\uDCB9'], // 💹
    // Eye
    [/ðŸ'ï¸/g, '\uD83D\uDC41\uFE0F'], // 👁️
    // Arrow
    [/â¤¡/g, '\u2921'], // ⤡
    // Gear/Settings
    [/âÅ¡â„¢Ã¯Â¸Â/g, '\u2699\uFE0F'], // ⚙️
    // Test tube
    [/ðŸ§ª/g, '\uD83E\uDDEA'], // 🧪
    // Fire
    [/ðŸ"¥/g, '\uD83D\uDD25'], // 🔥
    // Skull
    [/ðŸ'€/g, '\uD83D\uDC80'], // 💀
    // Target
    [/ðŸŽ¯/g, '\uD83C\uDFAF'], // 🎯
    // Green circle
    [/ðŸŸ¢/g, '\uD83D\uDFE2'], // 🟢
    // Red circle
    [/ðŸ"´/g, '\uD83D\uDD34'], // 🔴
    // Chart
    [/ðŸ"Š/g, '\uD83D\uDCCA'], // 📊
    // Chart up
    [/ðŸ"ˆ/g, '\uD83D\uDCC8'], // 📈
    // Recycle
    [/ðŸ"„/g, '\uD83D\uDD04'], // 🔄
    // Rocket
    [/ðŸš€/g, '\uD83D\uDE80'], // 🚀
    // Wastebasket
    [/ðŸ§®/g, '\uD83E\uDDEE'], // 🧮
    // Art
    [/ðŸŽ¨/g, '\uD83C\uDFA8'], // 🎨
    // Floppy disk
    [/ðŸ'¾/g, '\uD83D\uDCBE'], // 💾
    // Dice
    [/ðŸŽ²/g, '\uD83C\uDFB2'], // 🎲
];

let totalFixes = 0;
fixes.forEach(([regex, replacement], index) => {
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, replacement);
        totalFixes += matches;
        console.log(`  ✅ Fix ${index + 1}: ${matches} ocorrências`);
    }
});

fs.writeFileSync(file, content, 'utf-8');

console.log(`\n✅ ${totalFixes} emojis corrigidos!`);
console.log('🔄 Reinicie o browser (Ctrl+Shift+R)\n');
