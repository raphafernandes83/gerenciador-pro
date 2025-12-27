const fs = require('fs');

console.log('🗑️ Removendo painel verde antigo...');

try {
    let content = fs.readFileSync('sidebar.css', 'utf8');

    // Remove a seção do painel verde (linhas 188-220 aproximadamente)
    const greenPanelStart = '.parameters-card {';
    const greenPanelEnd = '.parameters-card::before {';

    if (content.includes(greenPanelStart)) {
        // Encontra o início
        const startIndex = content.indexOf(greenPanelStart);
        // Encontra o fim (antes do ::before)
        const endIndex = content.indexOf(greenPanelEnd, startIndex);

        if (startIndex !== -1 && endIndex !== -1) {
            // Remove a seção
            const before = content.substring(0, startIndex);
            const after = content.substring(endIndex);
            content = before + after;

            console.log('✅ CSS do painel verde removido');
        }
    }

    // Remove também o ::before se existir
    if (content.includes('.parameters-card::before')) {
        const beforeStart = content.indexOf('.parameters-card::before');
        const beforeEnd = content.indexOf('}', beforeStart) + 1;

        if (beforeStart !== -1 && beforeEnd !== -1) {
            const before = content.substring(0, beforeStart);
            const after = content.substring(beforeEnd);
            content = before + after;

            console.log('✅ CSS ::before do painel verde removido');
        }
    }

    // Salva arquivo
    fs.writeFileSync('sidebar.css', content, 'utf8');
    console.log('✅ sidebar.css atualizado!');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
