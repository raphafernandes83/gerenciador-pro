const fs = require('fs');

const file = 'index.html';
const backup = `index.html.backup-node-${Date.now()}`;

console.log('🔧 CORRIGINDO ENCODING...\n');

fs.copyFileSync(file, backup);
console.log(`✅ Backup: ${backup}`);

let content = fs.readFileSync(file, 'utf-8');

// Acentos corrompidos comuns
content = content.replace(/Ã§/g, 'ç');
content = content.replace(/Ã£/g, 'ã');
content = content.replace(/Ãµ/g, 'õ');
content = content.replace(/Ã¡/g, 'á');
content = content.replace(/Ã©/g, 'é');
content = content.replace(/Ã­/g, 'í');
content = content.replace(/Ã³/g, 'ó');
content = content.replace(/Ãº/g, 'ú');
content = content.replace(/Ã¢/g, 'â');
content = content.replace(/Ãª/g, 'ê');
content = content.replace(/Ã´/g, 'ô');
content = content.replace(/Ãš/g, 'Ú');
content = content.replace(/NÂº/g, 'Nº');

fs.writeFileSync(file, content, 'utf-8');

console.log('✅ Encoding corrigido!');
console.log('🔄 Reinicie o browser com Ctrl+Shift+R');
