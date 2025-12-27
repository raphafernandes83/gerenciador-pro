/**
 * 💀 Exemplo de Uso: Skeleton Loaders
 * Este arquivo demonstra como usar SkeletonLoader em operações assíncronas
 */

// =============================================================================
// EXEMPLO 1: Carregamento de Dashboard Stats
// =============================================================================

async function loadDashboardStatsWithSkeleton() {
    const container = document.getElementById('dashboard-stats-grid');

    // Mostrar skeleton enquanto carrega
    SkeletonLoader.show(container, 'stats');

    try {
        // Simular carregamento de dados (operação lenta)
        const stats = await fetchDashboardStats();

        // Renderizar dados reais
        renderDashboardStats(stats, container);

    } finally {
        // Esconder skeleton após carregar
        SkeletonLoader.hide(container);
    }
}

// =============================================================================
// EXEMPLO 2: Carregamento de Histórico com Wrap
// =============================================================================

async function loadHistoricoWithSkeleton() {
    const container = document.getElementById('tabela-historico-body');

    // Usar método wrap - mais conciso
    await SkeletonLoader.wrap(
        container,
        async () => {
            const historico = await fetchHistorico();
            renderHistorico(historico, container);
        },
        'table',
        { rows: 5 }
    );
}

// =============================================================================
// EXEMPLO 3: Timeline de Operações
// =============================================================================

async function loadTimelineWithSkeleton() {
    const container = document.getElementById('timeline-container');

    await SkeletonLoader.wrap(
        container,
        async () => {
            const operacoes = await fetchOperacoes();
            renderTimeline(operacoes, container);
        },
        'cards',
        { items: 3 }
    );
}

// =============================================================================
// FUNÇÕES AUXILIARES (Simulação)
// =============================================================================

async function fetchDashboardStats() {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        totalOperacoes: 150,
        winRate: 68.5,
        payoffRatio: 1.85,
        expectativaMatematica: 2.45
    };
}

async function fetchHistorico() {
    await new Promise(resolve => setTimeout(resolve, 800));

    return [
        { id: 1, data: '26/11/2025', resultado: 'WIN', valor: 150.00 },
        { id: 2, data: '25/11/2025', resultado: 'LOSS', valor: -80.00 },
        { id: 3, data: '24/11/2025', resultado: 'WIN', valor: 200.00 },
    ];
}

async function fetchOperacoes() {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
        { hora: '14:30', ativo: 'EURUSD', resultado: 'WIN' },
        { hora: '15:15', ativo: 'GBPUSD', resultado: 'WIN' },
        { hora: '16:00', ativo: 'USDJPY', resultado: 'LOSS' },
    ];
}

function renderDashboardStats(stats, container) {
    container.innerHTML = `
        <div class="stat-card">
            <h3>Total Operações</h3>
            <p>${stats.totalOperacoes}</p>
        </div>
        <div class="stat-card">
            <h3>Win Rate</h3>
            <p>${stats.winRate}%</p>
        </div>
        <div class="stat-card">
            <h3>Payoff Ratio</h3>
            <p>${stats.payoffRatio.toFixed(2)}</p>
        </div>
        <div class="stat-card">
            <h3>Expectativa</h3>
            <p>${stats.expectativaMatematica.toFixed(2)}</p>
        </div>
    `;
}

function renderHistorico(historico, container) {
    container.innerHTML = historico.map(item => `
        <tr>
            <td>${item.data}</td>
            <td>${item.resultado}</td>
            <td>R$ ${item.valor.toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderTimeline(operacoes, container) {
    container.innerHTML = operacoes.map(op => `
        <div class="timeline-item ${op.resultado.toLowerCase()}">
            <span class="hora">${op.hora}</span>
            <span class="ativo">${op.ativo}</span>
            <span class="resultado">${op.resultado}</span>
        </div>
    `).join('');
}

// Expor funções de exemplo para teste no console
if (typeof window !== 'undefined') {
    window.skeletonExamples = {
        loadDashboardStatsWithSkeleton,
        loadHistoricoWithSkeleton,
        loadTimelineWithSkeleton
    };

    console.log('💀 Skeleton Loader - Exemplos disponíveis:');
    console.log('- skeletonExamples.loadDashboardStatsWithSkeleton()');
    console.log('- skeletonExamples.loadHistoricoWithSkeleton()');
    console.log('- skeletonExamples.loadTimelineWithSkeleton()');
}
