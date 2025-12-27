// 🔍 DIAGNÓSTICO COMPLETO DO GRÁFICO DE ROSCA
// Cole este código no console do navegador (F12 → Console)

console.log('🔍 ====== DIAGNÓSTICO DO GRÁFICO DE ROSCA ======\n');

// 1. Verificar Chart.js
console.log('1️⃣ Verificando Chart.js...');
if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js NÃO carregado! CSP pode estar bloqueando.');
    console.log('   Verifique erros de CSP acima no console.');
} else {
    console.log('✅ Chart.js carregado:', Chart.version);
}

// 2. Verificar enhanced-donut-chart-system.js
console.log('\n2️⃣ Verificando enhanced-donut-chart-system.js...');
if (typeof enhancedDonutSystem === 'undefined' && typeof window.enhancedDonutSystem === 'undefined') {
    console.error('❌ enhancedDonutSystem NÃO encontrado!');
    console.log('   O script pode não ter sido carregado ou teve erro na execução.');
} else {
    console.log('✅ enhancedDonutSystem encontrado:', window.enhancedDonutSystem || enhancedDonutSystem);
}

// 3. Verificar canvas do gráfico
console.log('\n3️⃣ Verificando elemento canvas...');
const canvas = document.querySelector('#progress-pie-chart');
if (!canvas) {
    console.error('❌ Canvas #progress-pie-chart NÃO encontrado no DOM!');
} else {
    console.log('✅ Canvas encontrado:', canvas);
    console.log('   Dimensões:', canvas.offsetWidth, 'x', canvas.offsetHeight);
}

// 4. Verificar CSP atual
console.log('\n4️⃣ Verificando Content Security Policy...');
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (metaCSP) {
    console.log('📋 CSP encontrado em META tag:', metaCSP.content);
}
console.log('💡 Verifique os headers HTTP na aba Network → selecione index.html → Response Headers');

// 5. Verificar erros de CSP no console
console.log('\n5️⃣ Procurando erros de CSP...');
console.log('⚠️ Role o console para cima e procure por:');
console.log('   "violates the following Content Security Policy"');
console.log('   Se encontrar, o CSP está bloqueando recursos!');

// 6. Tentar inicializar manualmente
console.log('\n6️⃣ Tentando inicializar gráfico manualmente...');
if (typeof Chart !== 'undefined' && canvas) {
    try {
        // Destruir gráfico existente se houver
        if (canvas.chart) {
            canvas.chart.destroy();
        }

        // Criar gráfico de teste
        const testChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Vitórias', 'Derrotas'],
                datasets: [{
                    data: [10, 5],
                    backgroundColor: ['#059669', '#fca5a5']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        console.log('✅ Gráfico de teste criado com sucesso!', testChart);
        console.log('🎯 Se você viu o gráfico aparecer, o problema é no script enhanced-donut-chart-system.js');

        // Limpar após 5 segundos
        setTimeout(() => {
            testChart.destroy();
            console.log('🧹 Gráfico de teste removido');
        }, 5000);

    } catch (error) {
        console.error('❌ Erro ao criar gráfico de teste:', error);
    }
} else {
    console.error('❌ Não foi possível criar gráfico de teste');
    if (typeof Chart === 'undefined') console.log('   - Chart.js não está carregado');
    if (!canvas) console.log('   - Canvas não encontrado');
}

// 7. Verificar scripts carregados
console.log('\n7️⃣ Scripts carregados na página:');
const scripts = Array.from(document.querySelectorAll('script[src]'));
const relevantScripts = scripts.filter(s =>
    s.src.includes('chart') ||
    s.src.includes('donut') ||
    s.src.includes('cdnjs')
);
if (relevantScripts.length === 0) {
    console.warn('⚠️ Nenhum script de chart/donut encontrado!');
} else {
    relevantScripts.forEach(s => {
        console.log('📜', s.src);
    });
}

console.log('\n🔍 ====== FIM DO DIAGNÓSTICO ======');
console.log('\n📊 RESUMO:');
console.log('  Chart.js:', typeof Chart !== 'undefined' ? '✅' : '❌');
console.log('  enhancedDonutSystem:', typeof window.enhancedDonutSystem !== 'undefined' ? '✅' : '❌');
console.log('  Canvas:', canvas ? '✅' : '❌');
console.log('\n💡 Próximos passos:');
console.log('  1. Se Chart.js está ❌, o CSP está bloqueando o CDN');
console.log('  2. Se enhancedDonutSystem está ❌, o script não foi carregado');
console.log('  3. Se o gráfico de teste apareceu, o problema é no script do donut');
