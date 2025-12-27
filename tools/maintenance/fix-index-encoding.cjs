const fs = require('fs');
const path = require('path');

// Lê o arquivo com encoding correto
const filePath = path.join(__dirname, 'index.html');
const backupPath = path.join(__dirname, '..', 'BACKUP_UI_IMPROVEMENTS_20251223_022703', 'index.html');

console.log('🔧 Corrigindo encoding do index.html...');

try {
    // Lê o backup com UTF-8
    const content = fs.readFileSync(backupPath, 'utf8');

    // Escreve de volta com UTF-8
    fs.writeFileSync(filePath, content, 'utf8');

    console.log('✅ index.html restaurado com encoding correto');
    console.log('📄 Arquivo restaurado do backup:', backupPath);
} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
