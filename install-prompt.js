// ================================================================
// PWA INSTALL PROMPT
// ================================================================
let deferredPrompt = null;

// Detectar se PWA pode ser instalado
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir mini-infobar do Chrome
    e.preventDefault();

    // Guardar evento para usar depois
    deferredPrompt = e;

    // Mostrar botão de instalação
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        logger.info('📱 Botão Install App mostrado');
    }
});

// Handler do clique no botão
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('install-app-btn');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                logger.warn('⚠️ Prompt de instalação não disponível');
                return;
            }

            // Mostrar prompt de instalação
            deferredPrompt.prompt();

            // Esperar resposta do usuário
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                logger.info('✅ PWA instalado pelo usuário!');
            } else {
                logger.info('❌ Instalação cancelada pelo usuário');
            }

            // Limpar prompt usado
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    }
});

// Esconder botão quando já está instalado
window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
    logger.info('🎉 PWA instalado com sucesso!');
});
