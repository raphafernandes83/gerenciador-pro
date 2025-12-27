const fs = require('fs');
const path = require('path');

const file = 'index.html';
const backup = `index.html.backup-${Date.now()}`;

console.log('🔧 CORRIGINDO ENCODING COM NODE.JS...\n');

// Backup
fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}`);

// Ler como UTF-8 (mesmo que esteja errado)
let content = fs.readFileSync(file, 'utf-8');

// Mapeamento completo - Node.js não tem problema com caracteres especiais!
const replacements = {
    // Vogais com til
    'Ã£': 'ã',
    'Ã\u00a3': 'ã',
    'Ãµ': 'õ',
    'Ã\u00b5': 'õ',

    // Vogais com acento agudo  
    'Ã¡': 'á',
    'Ã\u00a1': 'á',
    'Ã©': 'é',
    'Ã\u00a9': 'é',
    'Ã­': 'í',
    'Ã\u00ad': 'í',
    'Ã³': 'ó',
    'Ã\u00b3': 'ó',
    'Ãº': 'ú',
    'Ã\u00ba': 'ú',
    'Ãš': 'Ú',

    // Acento circunflexo
    'Ã¢': 'â',
    'Ã\u00a2': 'â',
    'Ãª': 'ê',
    'Ã\u00aa': 'ê',
    'Ã´': 'ô',
    'Ã\u00b4': 'ô',

    // Cedilha
    'Ã§': 'ç',
    'Ã\u00a7': 'ç',
    'Ã‡': 'Ç',

    // Símbolos e outros
    'NÂº': 'Nº',
    'Â°': '°',
};

// Aplicar todas as substituições
let count = 0;
for (const [wrong, correct] of Object.entries(replacements)) {
    const regex = new RegExp(wrong, 'g');
    const matches = (content.match(regex) || []).length;
    if (matches > 0) {
        content = content.replace(regex, correct);
        count += matches;
        console.log(`  • "${wrong}" → "${correct}" (${matches}x)`);
    }
}

// Salvar como UTF-8
fs.writeFileSync(file, content, 'utf-8');

console.log(`\n✅ ${count} correções aplicadas!`);
console.log('🔄 Reinicie o servidor e dê hard refresh (Ctrl+Shift+R)');
