const fs = require('fs');

console.log('🔧 Corrigindo inicialização do InfoPanel...');

try {
    // 1. Corrige add-info-panel.js
    let addPanelContent = fs.readFileSync('add-info-panel.js', 'utf8');

    // Adiciona inicialização após inserir HTML
    const oldCode = `            console.log('✅ Painel informativo adicionado à sidebar');
            return true;`;

    const newCode = `            console.log('✅ Painel informativo adicionado à sidebar');
            
            // IMPORTANTE: Inicializa o InfoPanel APÓS adicionar ao DOM
            setTimeout(() => {
                if (window.InfoPanel) {
                    window.infoPanel = new window.InfoPanel();
                    window.infoPanel.init();
                    console.log('✅ InfoPanel inicializado com relógio funcionando');
                } else {
                    console.warn('⚠️ window.InfoPanel não encontrado');
                }
            }, 100);
            
            return true;`;

    if (addPanelContent.includes('InfoPanel inicializado com relógio funcionando')) {
        console.log('⏭️ add-info-panel.js já corrigido');
    } else {
        addPanelContent = addPanelContent.replace(oldCode, newCode);
        fs.writeFileSync('add-info-panel.js', addPanelContent, 'utf8');
        console.log('✅ add-info-panel.js corrigido');
    }

    // 2. Corrige InfoPanel.js (remove inicialização automática)
    let infoPanelContent = fs.readFileSync('src/ui/InfoPanel.js', 'utf8');

    // Comenta a inicialização automática
    const autoInitStart = `    document.addEventListener('DOMContentLoaded', () => {`;
    const autoInitEnd = `    });
}`;

    if (infoPanelContent.includes('REMOVIDO: Inicialização automática')) {
        console.log('⏭️ InfoPanel.js já corrigido');
    } else if (infoPanelContent.includes(autoInitStart)) {
        // Encontra e comenta o bloco
        const startIdx = infoPanelContent.indexOf(autoInitStart);
        const endIdx = infoPanelContent.indexOf(autoInitEnd, startIdx) + autoInitEnd.length;

        const before = infoPanelContent.substring(0, startIdx);
        const after = infoPanelContent.substring(endIdx);

        const commented = `    // REMOVIDO: Inicialização automática causa race condition
    // A inicialização agora é feita em add-info-panel.js após injetar o HTML
    /*
    document.addEventListener('DOMContentLoaded', () => {
        window.infoPanel = new InfoPanel();
        window.infoPanel.init();
        console.log('✅ InfoPanel inicializado');
    });
    */
}`;

        infoPanelContent = before + commented;
        fs.writeFileSync('src/ui/InfoPanel.js', infoPanelContent, 'utf8');
        console.log('✅ InfoPanel.js corrigido (inicialização automática removida)');
    }

    console.log('\n✅ Correção concluída! Recarregue a página.');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
