// TESTE MANUAL CHECKPOINT 1.2
// Copiar e colar no console do navegador

console.log('🧪 INICIANDO TESTE CHECKPOINT 1.2...');

// 1. Verificar estado inicial
console.log('1️⃣ Capital Inicial:', window.state.capitalAtual);

// 2. Limpar histórico do StateManager
console.log('2️⃣ Histórico antes:', window.stateManager.getHistory().length);

//3. Abrir sidebar
try {
    const sidebarBtn = document.querySelector('[data-action="toggle-sidebar"]');
    if (sidebarBtn) {
        sidebarBtn.click();
        console.log('3️⃣ Sidebar aberta');
    }
} catch (e) { console.log('Sidebar já aberta'); }

// 4. Aguardar 1s e iniciar sessão oficial
setTimeout(() => {
    try {
        const novaSessaoBtn = document.querySelector('[data-action="start-session"]');
        if (novaSessaoBtn) {
            novaSessaoBtn.click();
            console.log('4️⃣ Botão Nova Sessão clicado');
        }

        // 5. Aguardar modal e clicar em Sessão Oficial
        setTimeout(() => {
            const oficialBtn = document.querySelector('[data-mode="oficial"]');
            if (oficialBtn) {
                oficialBtn.click();
                console.log('5️⃣ Sessão Oficial iniciada');

                // 6. Aguardar e verificar histórico do StateManager
                setTimeout(() => {
                    const logicHistory = window.stateManager.getHistory()
                        .filter(h => h.source.includes('logic'));

                    console.log('6️⃣ Histórico logic:', logicHistory.map(h => ({
                        source: h.source,
                        capitalAtual: h.snapshot.capitalAtual
                    })));

                    console.log('7️⃣ Capital após iniciar sessão:', window.state.capitalAtual);

                    // 7. Registrar operação WIN
                    setTimeout(() => {
                        const winBtn = document.querySelector('[data-action="register-win"]');
                        if (winBtn) {
                            winBtn.click();
                            console.log('8️⃣ Operação WIN registrada');

                            // 8. Verificar histórico final
                            setTimeout(() => {
                                const fullHistory = window.stateManager.getHistory()
                                    .filter(h => h.source.includes('logic'));

                                console.log('9️⃣ Histórico FINAL:', fullHistory.map(h => ({
                                    source: h.source,
                                    capitalAtual: h.snapshot.capitalAtual
                                })));

                                console.log('🎯 Capital FINAL:', window.state.capitalAtual);
                                console.log('✅ TESTE COMPLETO!');
                            }, 1000);
                        }
                    }, 1000);
                }, 1000);
            }
        }, 1000);
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}, 1000);
