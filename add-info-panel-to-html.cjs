const fs = require('fs');

console.log('📝 Adicionando scripts do painel informativo ao index.html...');

try {
    let content = fs.readFileSync('index.html', 'utf8');

    // 1. Adiciona CSS do info-panel se não existir
    if (!content.includes('info-panel.css')) {
        content = content.replace(
            '<link rel="stylesheet" href="parameters-panel-fix.css" />',
            '<link rel="stylesheet" href="parameters-panel-fix.css" />\n    <link rel="stylesheet" href="info-panel.css" />'
        );
        console.log('✅ CSS info-panel.css adicionado');
    } else {
        console.log('⏭️ CSS info-panel.css já existe');
    }

    // 2. Adiciona scripts JS do InfoPanel se não existirem
    if (!content.includes('src/ui/InfoPanel.js')) {
        // Procura onde adicionar (após SessionsTrashHandler.js)
        const marker = '<script type="module" src="src/trash/SessionsTrashHandler.js"></script>';
        if (content.includes(marker)) {
            content = content.replace(
                marker,
                marker + '\n\n    <!-- 📊 PAINEL INFORMATIVO -->\n    <script type="module" src="src/ui/InfoPanel.js"></script>\n    <script type="module" src="add-info-panel.js"></script>'
            );
            console.log('✅ Scripts JS do InfoPanel adicionados');
        } else {
            console.warn('⚠️ Marcador SessionsTrashHandler.js não encontrado');
        }
    } else {
        console.log('⏭️ Scripts JS do InfoPanel já existem');
    }

    // Salva arquivo
    fs.writeFileSync('index.html', content, 'utf8');
    console.log('✅ index.html atualizado com sucesso!');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
