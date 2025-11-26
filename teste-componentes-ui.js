/**
 * 🧪 SCRIPT DE TESTE DOS COMPONENTES UI
 * 
 * Execute este script no console do navegador para testar
 * os componentes Modal, Timeline e Tabela
 */

console.log('🧪 INICIANDO TESTES DOS COMPONENTES UI...\n');

// ============================================
// TESTE 1: Verificar Inicialização
// ============================================
console.log('📋 TESTE 1: Verificando inicialização dos componentes...');

if (window.components) {
    console.log('✅ window.components existe');

    if (window.components.modal) {
        console.log('✅ ModalUI inicializado');
    } else {
        console.error('❌ ModalUI NÃO inicializado');
    }

    if (window.components.timeline) {
        console.log('✅ TimelineUI inicializado');
    } else {
        console.error('❌ TimelineUI NÃO inicializado');
    }

    if (window.components.tabela) {
        console.log('✅ TabelaUI inicializado');
    } else {
        console.error('❌ TabelaUI NÃO inicializado');
    }
} else {
    console.error('❌ window.components NÃO existe!');
}

console.log('\n');

// ============================================
// TESTE 2: Modal - Alerta Simples
// ============================================
console.log('📋 TESTE 2: Testando Modal de Alerta...');

try {
    window.components.modal.open({
        title: 'Teste de Alerta',
        message: 'Este é um teste do modal de alerta. Feche este modal para continuar os testes.',
        type: 'alert'
    });
    console.log('✅ Modal de alerta aberto com sucesso');
    console.log('👉 Feche o modal para continuar os testes');
} catch (error) {
    console.error('❌ Erro ao abrir modal de alerta:', error);
}

// ============================================
// TESTE 3: Modal - Silent Ignore
// ============================================
// Este teste será executado após fechar o modal do TESTE 2
console.log('\n📋 TESTE 3: Aguardando... (execute testeSilentIgnore() após fechar o modal)');

window.testeSilentIgnore = function () {
    console.log('🧪 Testando Silent Ignore (tentando abrir modal novamente)...');

    // Tentar abrir outro modal (deve ignorar silenciosamente)
    try {
        window.components.modal.open({
            title: 'Segundo Modal',
            message: 'Se você vê esta mensagem, o Silent Ignore falhou!',
            type: 'alert'
        });
        console.log('⚠️ Modal abriu (deveria ignorar silenciosamente se já houvesse um aberto)');
    } catch (error) {
        if (error.message === 'Modal já aberto') {
            console.error('❌ Erro "Modal já aberto" detectado (Silent Ignore não está funcionando)');
        } else {
            console.log('✅ Silent Ignore funcionando (erro foi silencioso)');
        }
    }
};

// ============================================
// TESTE 4: Timeline - Renderização
// ============================================
console.log('\n📋 TESTE 4: Testando TimelineUI...');

const testarTimeline = function () {
    try {
        const timelineContainer = document.getElementById('timeline-container');

        if (!timelineContainer) {
            console.error('❌ Container da timeline não encontrado');
            return;
        }

        console.log('✅ Container da timeline encontrado');

        // Criar operação de teste
        const operacaoTeste = {
            id: 'teste_' + Date.now(),
            isWin: true,
            resultado: 'win',
            valor: 100,
            entrada: 100,
            retorno: 180,
            horario: new Date().toLocaleTimeString(),
            tag: 'teste',
            nota: 'Operação de teste'
        };

        console.log('📝 Renderizando operação de teste na timeline...');

        // Criar array de histórico de teste
        const historicoTeste = [operacaoTeste];

        // Renderizar
        if (window.components.timeline && window.components.timeline.render) {
            window.components.timeline.render(historicoTeste, timelineContainer);
            console.log('✅ Timeline renderizada com sucesso');
            console.log('👀 Verifique se a operação aparece na timeline com o ícone correto');
        } else {
            console.error('❌ Método render não disponível em TimelineUI');
        }

    } catch (error) {
        console.error('❌ Erro ao testar Timeline:', error);
    }
};

// Executar teste da timeline após um delay (para dar tempo de fechar modais)
console.log('⏳ Timeline será testada automaticamente em 3 segundos...');
setTimeout(testarTimeline, 3000);

// ============================================
// TESTE 5: Tabela - Renderização
// ============================================
console.log('\n📋 TESTE 5: Testando TabelaUI...');

const testarTabela = function () {
    try {
        if (window.components.tabela && window.components.tabela.render) {
            console.log('📝 Renderizando tabela...');
            window.components.tabela.render();
            console.log('✅ Tabela renderizada com sucesso');
            console.log('👀 Verifique se a tabela está visível com os dados corretos');
        } else {
            console.error('❌ Método render não disponível em TabelaUI');
        }
    } catch (error) {
        console.error('❌ Erro ao testar Tabela:', error);
    }
};

// Executar teste da tabela após a timeline
console.log('⏳ Tabela será testada automaticamente em 6 segundos...');
setTimeout(testarTabela, 6000);

// ============================================
// RESUMO
// ============================================
setTimeout(() => {
    console.log('\n\n========================================');
    console.log('📊 RESUMO DOS TESTES');
    console.log('========================================');
    console.log('✅ = Passou | ❌ = Falhou | ⚠️ = Aviso');
    console.log('');
    console.log('Verifique os logs acima para resultados detalhados.');
    console.log('');
    console.log('📝 CHECKLIST:');
    console.log('[ ] Modal de alerta abre e fecha corretamente');
    console.log('[ ] Silent Ignore funciona (teste com testeSilentIgnore())');
    console.log('[ ] Timeline renderiza operação com ícone correto');
    console.log('[ ] Tabela renderiza os dados corretamente');
    console.log('========================================\n');
}, 10000);

console.log('\n✨ Script de teste carregado! Os testes começarão automaticamente.');
console.log('💡 Para testar Silent Ignore manualmente, execute: testeSilentIgnore()');
