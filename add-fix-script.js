// Script Node.js (ES Module) para adicionar fix-format.js ao HTML
import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const htmlFile = 'index.html';

console.log('📝 Adicionando fix-format.js ao HTML...');

// Criar backup
const backup = `${htmlFile}.backup-node-${Date.now()}`;
copyFileSync(htmlFile, backup);
console.log(`✅ Backup criado: ${backup}`);

// Ler arquivo
let content = readFileSync(htmlFile, 'utf8');

// Verificar se já existe
if (content.includes('fix-format.js')) {
    console.log('ℹ️  Script fix-format.js já está presente no HTML');
    process.exit(0);
}

// Adicionar antes do </body>
const scriptLine = '    <script src="fix-format.js"></script>\n';
content = content.replace('</body>', scriptLine + '</body>');

// Salvar
writeFileSync(htmlFile, content, 'utf8');

console.log('✅ Script fix-format.js adicionado com sucesso!');
console.log('🎯 Agora limpe o cache (Ctrl+Shift+Delete) e recarregue a página');
