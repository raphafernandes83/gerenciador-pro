/**
 * 🧪 EXEMPLO DE USO - SessionModule
 * Demonstra como usar o novo sistema modular
 */

import { moduleManager } from './src/modules/ModuleManager.js';
import SessionModule from './src/modules/SessionModule.js';

async function exemploUsoSessionModule() {
    console.log('🧪 Iniciando exemplo de uso do SessionModule...\n');

    // 1. Criar e registrar módulo
    const sessionModule = new SessionModule();

    // Registrar dependências (StateManager deve existir)
    if (window.stateManager) {
        sessionModule.registerDependency('stateManager', window.stateManager);
    }

    moduleManager.register('session', sessionModule);

    // 2. Inicializar
    await moduleManager.initAll();

    // 3. Iniciar sessão
    const session = sessionModule.startSession({
        mode: 'official',
        startCapital: 1000,
        metadata: {
            strategy: 'cycles',
            notes: 'Teste de sessão'
        }
    });
    console.log('✅ Sessão iniciada:', session);

    // 4. Adicionar operações
    sessionModule.addOperation({
        isWin: true,
        value: 85,
        entry: 100,
        payout: 85
    });
    console.log('✅ Operação 1 adicionada');

    sessionModule.addOperation({
        isWin: false,
        value: -100,
        entry: 100,
        payout: 0
    });
    console.log('✅ Operação 2 adicionada');

    // 5. Ver estatísticas
    const stats = sessionModule.getCurrentStats();
    console.log('📊 Estatísticas:', stats);

    // 6. Sessão atual
    const current = sessionModule.getCurrentSession();
    console.log('📝 Sessão atual:', current);

    // 7. Finalizar sessão
    const finishedSession = sessionModule.finishSession();
    console.log('🏁 Sessão finalizada:', finishedSession);

    // 8. Ver histórico
    const history = sessionModule.getSessionHistory();
    console.log('📚 Histórico:', history);

    // 9. Info do módulo
    console.log('ℹ️ Info do módulo:', sessionModule.getInfo());
    console.log('ℹ️ Stats do manager:', moduleManager.getStats());

    console.log('\n✅ Exemplo concluído!');
}

// Exporta para uso no console
if (typeof window !== 'undefined') {
    window.exemploUsoSessionModule = exemploUsoSessionModule;
    console.log('💡 Execute: exemploUsoSessionModule()');
}

export default exemploUsoSessionModule;
