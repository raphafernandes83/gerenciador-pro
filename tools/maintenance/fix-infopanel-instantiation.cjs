const fs = require('fs');

console.log('🔧 Corrigindo add-info-panel.js para instanciar InfoPanel...');

try {
    let content = fs.readFileSync('add-info-panel.js', 'utf8');

    // Procura onde adicionar a inicialização
    const marker = `console.log('✅ Painel informativo adicionado à sidebar');`;

    if (content.includes('new window.InfoPanel()')) {
        console.log('⏭️ Inicialização já existe');
    } else if (content.includes(marker)) {
        const initCode = `console.log('✅ Painel informativo adicionado à sidebar');
            
            // Inicializa InfoPanel APÓS HTML estar no DOM
            setTimeout(() => {
                if (window.InfoPanel) {
                    window.infoPanel = new window.InfoPanel();
                    window.infoPanel.init();
                    console.log('⏰ InfoPanel inicializado - relógio funcionando!');
                } else {
                    console.error('❌ window.InfoPanel não encontrado');
                }
            }, 150);`;

        content = content.replace(marker, initCode);
        fs.writeFileSync('add-info-panel.js', content, 'utf8');
        console.log('✅ add-info-panel.js corrigido - agora instancia InfoPanel');
    } else {
        console.warn('⚠️ Marcador não encontrado');
    }

    console.log('\n✅ Correção concluída! Recarregue a página.');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
