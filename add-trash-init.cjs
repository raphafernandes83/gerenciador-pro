const fs = require('fs');

console.log('🔧 Adicionando código de inicialização do TrashFAB...');

try {
    // Lê o arquivo atual
    const content = fs.readFileSync('index.html', 'utf8');

    // Código de inicialização do backup funcionando
    const initCode = `
    <!-- Script inline para aguardar carregamento e disponibilizar testes -->
    <script>
        // 🗑️ Inicialização do Sistema de Lixeira
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                try {
                    console.log('🗑️ Inicializando Sistema de Lixeira...');

                    // Inicializa TrashManager (já inicializado automaticamente)
                    if (window.trashManager && window.trashManager.isInitialized) {
                        console.log('✅ TrashManager inicializado');
                    }

                    // Inicializa TrashFAB
                    if (window.getTrashFAB) {
                        window.trashFAB = window.getTrashFAB();
                        console.log('✅ TrashFAB inicializado');
                    }

                    // Inicializa TrashModal
                    if (window.getTrashModal) {
                        window.trashModal = window.getTrashModal();
                        console.log('✅ TrashModal inicializado');
                    }

                    // Inicializa TagsTrashHandler
                    if (window.getTagsTrashHandler) {
                        window.tagsTrashHandler = window.getTagsTrashHandler();
                        console.log('✅ TagsTrashHandler inicializado');
                    }

                    // Inicializa OperationsTrashHandler
                    if (window.getOperationsTrashHandler) {
                        window.operationsTrashHandler = window.getOperationsTrashHandler();
                        console.log('✅ OperationsTrashHandler inicializado');
                    }

                    // Inicializa SessionsTrashHandler
                    if (window.getSessionsTrashHandler) {
                        window.sessionsTrashHandler = window.getSessionsTrashHandler();
                        console.log('✅ SessionsTrashHandler inicializado');
                    }

                } catch (error) {
                    console.error('❌ Erro ao inicializar sistema de lixeira:', error);
                }
            }, 1000);
        });
    </script>
`;

    // Procura onde inserir (após SessionsTrashHandler.js)
    const marker = '<script type="module" src="src/trash/SessionsTrashHandler.js"></script>';

    if (!content.includes(marker)) {
        console.error('❌ Marcador não encontrado no index.html');
        process.exit(1);
    }

    // Insere o código de inicialização
    const newContent = content.replace(marker, marker + initCode);

    // Salva o arquivo
    fs.writeFileSync('index.html', newContent, 'utf8');

    console.log('✅ Código de inicialização adicionado com sucesso!');
    console.log('📍 Inserido após: src/trash/SessionsTrashHandler.js');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
