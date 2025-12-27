/**
 * 📚 GLOSSÁRIO DE DADOS DAS MÉTRICAS
 * Conteúdo para tooltips interativos e sistema de ajuda
 * 
 * @module glossary-data
 * @version 1.0.0
 */

const METRIC_GLOSSARY = {
    'resultado-total': {
        icon: '💰',
        label: 'Resultado Total',
        description: 'Soma de todos os lucros e prejuízos do período',
        formula: 'Σ (Lucros - Prejuízos)',
        example: {
            good: '10 operações: 6 wins (+R$ 540) e 4 losses (-R$ 400) = +R$ 140',
            calculation: 'Soma todos os ganhos e subtrai todas as perdas'
        },
        thresholds: {
            excellent: { min: 100, label: '🟢 Excelente', description: 'Lucro consistente' },
            good: { min: 1, label: '🟢 Positivo', description: 'Lucrando' },
            warning: { min: -50, label: '🟡 Atenção', description: 'Pequeno prejuízo' },
            bad: { min: -Infinity, label: '🔴 Prejuízo', description: 'Revise estratégia' }
        },
        ideal: '> R$ 0 (positivo)',
        tip: 'Mesmo pequenos lucros consistentes são melhores que altos lucros esporádicos'
    },

    'assertividade': {
        icon: '🎯',
        label: 'Assertividade',
        description: 'Percentual de operações vencedoras',
        formula: 'Vitórias ÷ Total de Operações × 100',
        example: {
            good: '60 wins em 100 operações = 60%',
            calculation: 'Se acertou 6 de 10 operações = 60% de assertividade'
        },
        thresholds: {
            excellent: { min: 60, label: '🟢 Excelente', description: 'Acima da média' },
            good: { min: 55, label: '🟢 Bom', description: 'Sustentável' },
            warning: { min: 50, label: '🟡 Atenção', description: 'No limite' },
            bad: { min: 0, label: '🔴 Baixa', description: 'Abaixo do necessário' }
        },
        ideal: '≥ 55% (para payout 85-90%)',
        tip: 'Com payout de 90%, você precisa de 53% de assertividade para lucrar'
    },

    'payoff-ratio': {
        icon: '📊',
        label: 'Payoff Ratio',
        description: 'Relação entre ganho médio e perda média',
        formula: 'Ganho Médio ÷ Perda Média',
        example: {
            good: 'Ganho médio R$ 100 ÷ Perda média R$ 80 = 1.25',
            calculation: 'Se ganha R$ 1,25 para cada R$ 1,00 que perde = Payoff 1.25'
        },
        thresholds: {
            excellent: { min: 1.5, label: '🟢 Excelente', description: 'Ganhos muito maiores' },
            good: { min: 1.0, label: '🟢 Bom', description: 'Ganha mais que perde' },
            warning: { min: 0.8, label: '🟡 Atenção', description: 'Quase equilibrado' },
            bad: { min: 0, label: '🔴 Ruim', description: 'Perdas maiores que ganhos' }
        },
        ideal: '≥ 1.0',
        tip: 'Payoff alto permite lucrar mesmo com baixa assertividade'
    },

    'expectativa-ev': {
        icon: '📈',
        label: 'Expectativa (EV)',
        description: 'Lucro ou prejuízo esperado por operação',
        formula: '(% Wins × Ganho Médio) - (% Losses × Perda Média)',
        example: {
            good: '(60% × R$ 90) - (40% × R$ 100) = R$ 54 - R$ 40 = +R$ 14',
            calculation: 'EV positivo significa que cada operação tende a lucrar'
        },
        thresholds: {
            excellent: { min: 10, label: '🟢 Excelente', description: 'Muito lucrativo' },
            good: { min: 1, label: '🟢 Positivo', description: 'Lucrativo' },
            warning: { min: -5, label: '🟡 Atenção', description: 'Quase no zero' },
            bad: { min: -Infinity, label: '🔴 Negativo', description: 'Estratégia perdedora' }
        },
        ideal: '> R$ 0',
        tip: 'EV negativo significa que você perde dinheiro a longo prazo'
    },

    'num-operacoes': {
        icon: '🔢',
        label: 'Nº de Operações',
        description: 'Total de operações realizadas no período',
        formula: 'Contagem simples',
        example: {
            good: '100 operações em 30 dias = média de 3-4 por dia',
            calculation: 'Cada entrada no mercado conta como 1 operação'
        },
        thresholds: {
            excellent: { min: 100, label: '🟢 Muitos dados', description: 'Estatísticas confiáveis' },
            good: { min: 30, label: '🟢 Dados suficientes', description: 'Análise válida' },
            warning: { min: 10, label: '🟡 Poucos dados', description: 'Resultados preliminares' },
            bad: { min: 0, label: '🔴 Insuficiente', description: 'Muito cedo para análise' }
        },
        ideal: '≥ 30 (para análise confiável)',
        tip: 'Mais operações = estatísticas mais confiáveis'
    },

    'num-sessoes': {
        icon: '📅',
        label: 'Nº de Sessões',
        description: 'Total de dias/sessões operados',
        formula: 'Contagem de sessões únicas',
        example: {
            good: '20 sessões em 30 dias = consistência boa',
            calculation: 'Cada dia que você operou conta como 1 sessão'
        },
        thresholds: {
            excellent: { min: 20, label: '🟢 Muito consistente', description: 'Opera regularmente' },
            good: { min: 10, label: '🟢 Consistente', description: 'Disciplina boa' },
            warning: { min: 5, label: '🟡 Irregular', description: 'Opere mais vezes' },
            bad: { min: 0, label: '🔴 Muito irregular', description: 'Falta consistência' }
        },
        ideal: '≥ 10 sessões',
        tip: 'Consistência é mais importante que quantidade de operações'
    },

    'seq-vitorias': {
        icon: '🔥',
        label: 'Seq. de Vitórias',
        description: 'Maior sequência de vitórias consecutivas',
        formula: 'Maior número de wins seguidos',
        example: {
            good: 'Win → Win → Win → Win → Loss = sequência de 4',
            calculation: 'Conta quantas vitórias seguidas você teve antes de uma derrota'
        },
        thresholds: {
            excellent: { min: 5, label: '🟢 Excelente', description: 'Ótima consistência' },
            good: { min: 3, label: '🟢 Boa', description: 'Consistência positiva' },
            warning: { min: 2, label: '🟡 Regular', description: 'Melhore consistência' },
            bad: { min: 0, label: '🔴 Baixa', description: 'Muita alternância' }
        },
        ideal: '≥ 3',
        tip: 'Sequências longas indicam disciplina e estratégia sólida'
    },

    'seq-derrotas': {
        icon: '⚠️',
        label: 'Seq. de Derrotas',
        description: 'Maior sequência de derrotas consecutivas',
        formula: 'Maior número de losses seguidos',
        example: {
            good: 'Loss → Loss → Win = sequência de 2 (quebrou no 3º)',
            calculation: 'Conta quantas derrotas seguidas você teve antes de uma vitória'
        },
        thresholds: {
            excellent: { min: 0, max: 2, label: '🟢 Excelente', description: 'Controle total' },
            good: { min: 3, max: 4, label: '🟢 Bom', description: 'Controle adequado' },
            warning: { min: 5, max: 7, label: '🟡 Atenção', description: 'Revise gestão' },
            bad: { min: 8, label: '🔴 Perigoso', description: 'Stop loss urgente' }
        },
        ideal: '≤ 3',
        tip: 'Sequências longas de derrotas podem quebrar seu capital rapidamente'
    },

    'drawdown-maximo': {
        icon: '📉',
        label: 'Drawdown Máximo',
        description: 'Maior queda do pico ao vale do capital',
        formula: 'Pico de Capital - Vale de Capital',
        example: {
            good: 'Capital foi de R$ 1.200 (pico) para R$ 1.100 (vale) = -R$ 100',
            calculation: 'Mede a maior "sangria" que seu capital sofreu'
        },
        thresholds: {
            excellent: { max: -50, label: '🟢 Muito baixo', description: 'Risco controlado' },
            good: { max: -100, label: '🟢 Baixo', description: 'Risco aceitável' },
            warning: { max: -200, label: '🟡 Elevado', description: 'Reduza risco' },
            bad: { max: -Infinity, label: '🔴 Muito alto', description: 'Risco perigoso' }
        },
        ideal: '< 10% do capital inicial',
        tip: 'Se perdeu 50%, precisa ganhar 100% para recuperar!'
    },

    'payout-medio': {
        icon: '💸',
        label: 'Payout Médio',
        description: 'Percentual médio pago pela corretora nas vitórias',
        formula: 'Média de todos os payouts',
        example: {
            good: '(88% + 90% + 92%) ÷ 3 = 90%',
            calculation: 'Aposta R$ 100, ganha = recebe R$ 100 + R$ 90 = R$ 190'
        },
        thresholds: {
            excellent: { min: 90, label: '🟢 Excelente', description: 'Payout muito bom' },
            good: { min: 85, label: '🟢 Bom', description: 'Payout competitivo' },
            warning: { min: 80, label: '🟡 Regular', description: 'Busque melhores ativos' },
            bad: { min: 0, label: '🔴 Baixo', description: 'Dificulta lucro' }
        },
        ideal: '≥ 85%',
        tip: 'Payout 90% precisa 53% assertividade, 70% precisa 59%'
    },

    // ========================================================================
    // ABA ANÁLISE ESTRATÉGICA
    // ========================================================================

    'analise-dimensao-selector': {
        icon: '🔍',
        label: 'Analisar Performance Por',
        description: 'Escolha diferentes dimensões para agrupar e comparar seus resultados',
        formula: 'Agrupa operações por categoria escolhida',
        example: {
            good: 'Escolha "Dia da Semana" para ver qual dia você tem melhores resultados',
            calculation: 'Sistema agrupa automaticamente todas as operações pela dimensão selecionada'
        },
        thresholds: {},
        ideal: 'Teste todas as dimensões para encontrar padrões',
        tip: 'Comece pela dimensão "Tag" se você categoriza suas estratégias'
    },

    'analise-dia-semana': {
        icon: '📅',
        label: 'Dia da Semana',
        description: 'Agrupa resultados por dia da semana para identificar padrões temporais',
        formula: 'Segunda a Domingo',
        example: {
            good: 'Você pode descobrir que tem 70% de assertividade às quartas-feiras',
            calculation: 'Mostra Win Rate, Qtd e Resultado para cada dia (Seg, Ter, Qua...)'
        },
        thresholds: {},
        ideal: 'Procure dias com Win Rate acima de 60%',
        tip: 'Evite operar em dias com histórico de prejuízo consistente'
    },

    'analise-hora-dia': {
        icon: '⏰',
        label: 'Hora do Dia',
        description: 'Identifica os melhores horários para operar baseado no seu histórico',
        formula: 'Faixas horárias (ex: 08h-09h, 09h-10h)',
        example: {
            good: 'Traders geralmente têm melhor performance das 14h às 16h (mercado americano)',
            calculation: 'Agrupa operações por hora e calcula Win Rate de cada faixa'
        },
        thresholds: {},
        ideal: 'Concentre operações em horários com Win Rate > 60%',
        tip: 'Evite horários de baixa liquidez (almoço, pré-abertura)'
    },

    'analise-tag': {
        icon: '🏷️',
        label: 'Tag de Operação',
        description: 'Compara performance entre diferentes estratégias ou ativos',
        formula: 'Categorias personalizadas',
        example: {
            good: 'Tag "Pivô Diário" vs "Suporte Resistência" - qual funciona melhor?',
            calculation: 'Mostra resultados separados para cada tag que você usou'
        },
        thresholds: {},
        ideal: 'Foque nas tags com melhor Payoff Ratio e EV positivo',
        tip: 'Use tags consistentes para análises mais precisas'
    },

    'analise-faixa-payout': {
        icon: '💸',
        label: 'Faixa de Payout',
        description: 'Analisa se payouts mais altos ou mais baixos dão melhores resultados',
        formula: 'Agrupado por ranges (70-79%, 80-89%, 90%+)',
        example: {
            good: 'Você pode ter 65% de Win Rate com payout 85% mas só 50% com payout 95%',
            calculation: 'Separa operações por faixa de payout e calcula assertividade de cada'
        },
        thresholds: {},
        ideal: 'Encontre o equilíbrio entre payout alto e Win Rate sustentável',
        tip: 'Payouts muito altos (95%+) geralmente têm menor probabilidade de acerto'
    },

    'analise-tabela-categoria': {
        icon: '📋',
        label: 'Categoria (Tabela)',
        description: 'Nome da categoria conforme dimensão escolhida',
        formula: 'Depende da dimensão: Dia, Hora, Tag ou Payout',
        example: {
            good: 'Se escolheu "Dia da Semana", mostra: Segunda, Terça, Quarta...',
            calculation: 'Primeira coluna da tabela de resultados'
        },
        thresholds: {},
        ideal: 'Cada linha representa um grupo de operações',
        tip: 'Ordene a tabela clicando nos cabeçalhos'
    },

    'analise-tabela-qtd': {
        icon: '🔢',
        label: 'Qtd (Quantidade)',
        description: 'Número de operações naquela categoria',
        formula: 'Contagem simples',
        example: {
            good: 'Segunda-feira: 25 operações',
            calculation: 'Conta quantas operações você fez naquele grupo'
        },
        thresholds: {
            excellent: { min: 20, label: '🟢 Estatisticamente relevante', description: 'Dados confiáveis' },
            good: { min: 10, label: '🟢 Dados suficientes', description: 'Análise válida' },
            warning: { min: 5, label: '🟡 Poucos dados', description: 'Resultados preliminares' },
            bad: { min: 0, label: '🔴 Insuficiente', description: 'Muito cedo para conclusões' }
        },
        ideal: '≥ 20 operações para análise confiável',
        tip: 'Quantidade baixa pode gerar resultados enganosos'
    },

    'analise-tabela-winrate': {
        icon: '🎯',
        label: 'Win Rate (Tabela)',
        description: 'Percentual de acertos naquela categoria',
        formula: 'Vitórias ÷ Total × 100',
        example: {
            good: '15 wins em 25 operações = 60% Win Rate',
            calculation: 'Calcula assertividade específica daquele grupo'
        },
        thresholds: {
            excellent: { min: 60, label: '🟢 Excelente', description: 'Categoria muito lucrativa' },
            good: { min: 55, label: '🟢 Bom', description: 'Sustentável' },
            warning: { min: 50, label: '🟡 Limite', description: 'No fio da navalha' },
            bad: { min: 0, label: '🔴 Baixo', description: 'Evite essa categoria' }
        },
        ideal: '≥ 55%',
        tip: 'Compare Win Rates entre categorias para identificar as melhores'
    },

    'analise-tabela-resultado': {
        icon: '💰',
        label: 'Resultado (Tabela)',
        description: 'Lucro ou prejuízo total naquela categoria',
        formula: 'Soma de ganhos - perdas',
        example: {
            good: 'Terça-feira: +R$ 150 (melhor dia)',
            calculation: 'Adiciona todos os lucros e subtrai todas as perdas do grupo'
        },
        thresholds: {
            excellent: { min: 100, label: '🟢 Muito lucrativo', description: 'Foque nisso!' },
            good: { min: 1, label: '🟢 Positivo', description: 'Categoria rentável' },
            warning: { min: -50, label: '🟡 Pequeno prejuízo', description: 'Atenção' },
            bad: { min: -Infinity, label: '🔴 Prejuízo', description: 'Evite ou ajuste' }
        },
        ideal: '> R$ 0',
        tip: 'Resultado negativo consistente indica: PARE de operar nessa condição'
    },

    'analise-grafico-barras': {
        icon: '📊',
        label: 'Gráfico de Barras',
        description: 'Visualização dos resultados por categoria',
        formula: 'Altura da barra = Valor da métrica',
        example: {
            good: 'Barras verdes (Win Rate alto) vs vermelhas (Win Rate baixo)',
            calculation: 'Cada barra representa uma categoria da tabela'
        },
        thresholds: {},
        ideal: 'Foque em categorias com barras verdes altas',
        tip: 'Use o gráfico para identificar rapidamente padrões visuais'
    },

    'analise-diagnostico': {
        icon: '🔬',
        label: 'Diagnóstico Quantitativo',
        description: 'Insight automático gerado pelo sistema',
        formula: 'Análise estatística avançada',
        example: {
            good: '"Quinta-feira tem 15% mais assertividade que a média semanal"',
            calculation: 'Sistema compara todas as categorias e destaca a melhor'
        },
        thresholds: {},
        ideal: 'Use para decisões rápidas baseadas em dados',
        tip: 'O diagnóstico é atualizado sempre que você muda a dimensão'
    },

    // ========================================================================
    // MODAL LABORATÓRIO DE RISCO (MONTE CARLO)
    // ========================================================================

    'lab-risk-winrate': {
        icon: '🎯',
        label: 'Win Rate (%)',
        description: 'Percentual de operações vencedoras esperado com base no seu histórico',
        formula: 'Vitórias ÷ Total × 100',
        example: {
            good: 'Win Rate 60% = você acerta 6 em cada 10 operações',
            calculation: 'Calculado automaticamente com base nas ops do período filtrado'
        },
        thresholds: {
            excellent: { min: 60, label: '🟢 Excelente', description: 'Muito lucrativo' },
            good: { min: 55, label: '🟢 Bom', description: 'Sustentável' },
            warning: { min: 50, label: '🟡 No limite', description: 'Arriscado' },
            bad: { min: 0, label: '🔴 Abaixo do ideal', description: 'Ajuste necessário' }
        },
        ideal: '≥ 55%',
        tip: 'Win Rate alto permite usar payouts mais baixos. 60% já é lucrativo com payout 85%'
    },

    'lab-risk-payout': {
        icon: '💰',
        label: 'Payout Médio (%)',
        description: 'Rentabilidade média das suas operações vencedoras',
        formula: 'Média de payouts das vitórias',
        example: {
            good: 'Payout 85% = investiu R$100, ganhou R$85 de lucro',
            calculation: 'Payout maior = menos Win Rate necessário para lucrar'
        },
        thresholds: {
            excellent: { min: 90, label: '🟢 Alto', description: 'Excelente retorno' },
            good: { min: 85, label: '🟢 Médio', description: 'Padrão ideal' },
            warning: { min: 75, label: '🟡 Baixo', description: 'Precisa Win Rate alto' },
            bad: { min: 0, label: '🔴 Muito baixo', description: 'Difícil lucrar' }
        },
        ideal: '≥ 85%',
        tip: 'Payout 95% precisa apenas 51% Win Rate, mas 70% precisa 59% Win Rate'
    },

    'lab-risk-simulacoes': {
        icon: '🔄',
        label: 'Número de Simulações',
        description: 'Quantas vezes simular cenários aleatórios de trading',
        formula: 'Cada simulação = 1 dia completo de trading',
        example: {
            good: '1.000 simulações = resultado confiável estatisticamente',
            calculation: 'Sistema roda 1.000 dias virtuais com suas estatísticas reais'
        },
        thresholds: {},
        ideal: '≥ 1.000 para análise precisa',
        tip: 'Use 10.000 simulações para decisões críticas. Leva mais tempo mas é muito mais preciso'
    },

    'lab-risk-ops-dia': {
        icon: '📊',
        label: 'Máx. Operações por Dia',
        description: 'Limite de trades que você faz até atingir Stop Win/Loss',
        formula: 'Quantas operações no máximo por dia',
        example: {
            good: '50 ops/dia = ativo mas controlado',
            calculation: 'Sistema simula dias com até esse número de operações'
        },
        thresholds: {},
        ideal: '20-50 operações é o ideal',
        tip: 'Mais de 100 ops/dia aumenta muito o risco emocional e overtrading'
    },

    'lab-risk-prob-lucro': {
        icon: '📈',
        label: 'Probabilidade de Lucro',
        description: 'Chance de terminar o dia no positivo com sua gestão atual',
        formula: 'Baseado em Monte Carlo com Win Rate e Payout',
        example: {
            good: '73% de chance = em 7 de cada 10 dias você vai lucrar',
            calculation: 'Das 1.000 simulações, 730 terminaram com lucro'
        },
        thresholds: {
            excellent: { min: 70, label: '🟢 Muito provável', description: 'Estratégia sólida' },
            good: { min: 60, label: '🟢 Provável', description: 'Bom cenário' },
            warning: { min: 50, label: '🟡 Incerto', description: '50/50' },
            bad: { min: 0, label: '🔴 Improvável', description: 'Ajuste urgente' }
        },
        ideal: '≥ 65%',
        tip: 'Se for menor que 60%, considere aumentar Win Rate ou Payout'
    },

    'lab-risk-prob-perda': {
        icon: '📉',
        label: 'Probabilidade de Prejuízo',
        description: 'Chance de terminar o dia no negativo',
        formula: '100% - Probabilidade de Lucro',
        example: {
            good: '27% de chance = 3 em cada 10 dias você termina no vermelho',
            calculation: 'Complemento da Prob. Lucro'
        },
        thresholds: {
            good: { min: 0, max: 30, label: '🟢 Baixo risco', description: 'Controlado' },
            warning: { min: 30, max: 40, label: '🟡 Médio risco', description: 'Atenção' },
            bad: { min: 40, label: '🔴 Alto risco', description: 'Perigoso' }
        },
        ideal: '≤ 35%',
        tip: 'Menos de 40% é aceitável. Acima disso, reveja sua estratégia'
    },

    'lab-risk-resultado-medio': {
        icon: '💵',
        label: 'Resultado Médio Esperado',
        description: 'Lucro ou prejuízo médio que você deve ter por dia',
        formula: '(Win Rate × Payout) - (Loss Rate × 100%)',
        example: {
            good: '+R$ 45 por dia = expectativa positiva sólida',
            calculation: 'Média dos resultados de todas as 1.000 simulações'
        },
        thresholds: {},
        ideal: '> R$ 0',
        tip: 'Resultado negativo = PARE! Ajuste Win Rate ou Payout urgentemente'
    },

    'lab-risk-drawdown': {
        icon: '⚠️',
        label: 'Drawdown Máximo Esperado',
        description: 'Maior queda de capital que pode acontecer no pior cenário',
        formula: 'Pior resultado encontrado nas simulações',
        example: {
            good: '-R$ 120 = no pior dia das 1.000 simulações, você perdeu R$120',
            calculation: 'Maior prejuízo que aconteceu entre todas as simulações'
        },
        thresholds: {},
        ideal: '≤ 20% do capital inicial',
        tip: 'Se Drawdown > 30% do capital, reduza risco! Diminua % de entrada ou ops/dia'
    },

    // ========================================================================
    // MODAL NOVA SESSÃO
    // ========================================================================

    'nova-sessao-titulo': {
        icon: '🎯',
        label: 'Iniciar Nova Sessão',
        description: 'Uma sessão é um período completo de trading desde o início até atingir meta ou fim do dia',
        formula: 'Sessão = Start → Stop Win/Loss ou fim do horário',
        example: {
            good: 'Começou 09h com R$1000, às 14h atingiu Stop Win de R$1100 = 1 sessão completa',
            calculation: 'Todas as operações de uma sessão ficam agrupadas no histórico'
        },
        thresholds: {},
        ideal: 'Finalize sempre a sessão para manter dados organizados',
        tip: 'Recomendado: 1 sessão por dia de trading. Evite múltiplas sessões no mesmo dia'
    },

    'nova-sessao-oficial': {
        icon: '💼',
        label: 'Modo Oficial',
        description: 'Operações reais que contam para TODAS as suas estatísticas principais',
        formula: 'Impacta: Dashboard, Win Rate, Payoff, Expectativa, Drawdown, etc.',
        example: {
            good: 'Use para seu trading real com dinheiro de verdade',
            calculation: 'Essas ops aparecem em todos os gráficos, análises e relatórios'
        },
        thresholds: {},
        ideal: 'Para trading com capital real',
        tip: 'Suas stats oficiais = sua performance verdadeira. Não misture com testes!'
    },

    'nova-sessao-simulacao': {
        icon: '🧪',
        label: 'Modo Simulação',
        description: 'Operações de teste e prática que NÃO afetam suas estatísticas oficiais',
        formula: 'Totalmente isolado das stats principais',
        example: {
            good: 'Use para testar nova estratégia sem contaminar seus dados reais',
            calculation: 'Aparecem separadas quando você filtra por "Simulação" no Dashboard'
        },
        thresholds: {},
        ideal: 'Para backtesting, estudos e treino',
        tip: 'Pratique até ter 60%+ Win Rate consistente, aí migre para Oficial'
    },

    // ========================================================================
    // MODAL REPLAY DA SESSÃO
    // ========================================================================

    'replay-titulo': {
        icon: '🎬',
        label: 'Replay da Sessão',
        description: 'Reveja todos os detalhes de uma sessão de trading já finalizada',
        formula: 'Visualização completa: estatísticas + timeline + gráficos',
        example: {
            good: 'Use para estudar suas sessões passadas e identificar padrões',
            calculation: 'Cada sessão gravada pode ser revisitada a qualquer momento'
        },
        thresholds: {},
        ideal: 'Analise suas melhores E piores sessões para aprender',
        tip: 'Compare sessões similares para entender por que umas deram certo e outras não'
    },

    'replay-capital-inicial': {
        icon: '💰',
        label: 'Capital Inicial',
        description: 'Valor em dinheiro com que você começou essa sessão específica',
        formula: 'Capital no momento de clicar "Nova Sessão"',
        example: {
            good: 'Sessão iniciada com R$ 1.000',
            calculation: 'É o ponto de partida para calcular resultado e %'
        },
        thresholds: {},
        ideal: 'Sempre comece sessões com capital suficiente para sua estratégia',
        tip: 'Capital inicial varia se você incorpora lucros ou protege capital base'
    },

    'replay-capital-final': {
        icon: '💵',
        label: 'Capital Final',
        description: 'Valor em dinheiro ao finalizar a sessão (após todas as operações)',
        formula: 'Capital Inicial + Resultado',
        example: {
            good: 'Terminou com R$ 1.150 = lucrou R$ 150',
            calculation: 'Se começou com R$1000 e ganhou R$150, final = R$1150'
        },
        thresholds: {},
        ideal: 'Capital final > Capital inicial = sessão lucrativa',
        tip: 'Compare capital final com sua meta de Stop Win para avaliar performance'
    },

    'replay-resultado': {
        icon: '📊',
        label: 'Resultado da Sessão',
        description: 'Lucro ou prejuízo total dessa sessão (em R$)',
        formula: 'Capital Final - Capital Inicial',
        example: {
            good: '+R$ 150 = sessão lucrativa',
            calculation: 'Se começou R$1000 e terminou R$1150, resultado = +R$150'
        },
        thresholds: {},
        ideal: 'Resultado positivo consistente = estratégia funcionando',
        tip: 'Analise se atingiu Stop Win, Stop Loss ou parou antes por disciplina'
    },

    'replay-total-ops': {
        icon: '🔢',
        label: 'Total de Operações',
        description: 'Quantas operações (trades) você fez nessa sessão',
        formula: 'Soma de Wins + Losses',
        example: {
            good: '25 operações = sessão ativa',
            calculation: 'Cada vez que clica Win ou Loss conta como 1 operação'
        },
        thresholds: {},
        ideal: '20-50 operações por sessão é saudável',
        tip: 'Muito poucas (<10) = pode não ter aproveitado. Muitas (>100) = possível overtrading'
    },

    'replay-assertividade': {
        icon: '🎯',
        label: 'Assertividade (Win Rate)',
        description: 'Percentual de operações vencedoras nessa sessão específica',
        formula: 'Wins ÷ Total Ops × 100',
        example: {
            good: '64% = acertou 16 de 25 operações',
            calculation: 'Se fez 25 ops e ganhou 16, assertividade = 64%'
        },
        thresholds: {
            excellent: { min: 65, label: '🟢 Excelente', description: 'Sessão top' },
            good: { min: 55, label: '🟢 Boa', description: 'Acima da média' },
            warning: { min: 50, label: '🟡 Mediana', description: 'Na média' },
            bad: { min: 0, label: '🔴 Abaixo', description: 'Melhorar' }
        },
        ideal: '≥ 60% por sessão',
        tip: 'Assertividade varia entre sessões. Analise padrões: qual dia/horário você performa melhor?'
    },

    'replay-maior-sequencia': {
        icon: '🔥',
        label: 'Maior Sequência',
        description: 'Maior número de vitórias ou derrotas consecutivas nessa sessão',
        formula: 'Conta quantas wins ou losses seguidas sem interrupção',
        example: {
            good: '5 vitórias seguidas = ótimo momentum',
            calculation: 'W-W-W-W-W seria uma sequência de 5 wins'
        },
        thresholds: {},
        ideal: 'Sequências longas de wins = estratégia alinhada com mercado',
        tip: 'Sequência longa de losses? Pare, analise e ajuste antes de continuar'
    },

    'replay-timeline': {
        icon: '📈',
        label: 'Timeline de Operações',
        description: 'Visualização cronológica de todas as operações dessa sessão',
        formula: 'Linha do tempo mostrando cada Win (verde) e Loss (vermelho)',
        example: {
            good: 'Timeline mostra: 🟢🟢🔴🟢🔴🟢🟢🟢 = padrão visual de performance',
            calculation: 'Cada bolinha = 1 operação na ordem que foi feita'
        },
        thresholds: {},
        ideal: 'Use para identificar quando você estava "quente" ou "frio"',
        tip: 'Se perdeu várias seguidas, deveria ter parado? Timeline ajuda na disciplina futura'
    },

    'replay-grafico': {
        icon: '📉',
        label: 'Curva de Patrimônio',
        description: 'Gráfico mostrando evolução do capital ao longo da sessão',
        formula: 'Eixo Y = Capital, Eixo X = Tempo (ordem das operações)',
        example: {
            good: 'Curva ascendente = capital cresceu consistentemente',
            calculation: 'Cada ponto = capital após cada operação'
        },
        thresholds: {},
        ideal: 'Curva suave para cima = crescimento sustentável',
        tip: 'Grandes picos/vales = volatilidade alta. Reduza risco se curva está muito instável'
    },

    // ========================================================================
    // MODAL CONFIGURAÇÕES
    // ========================================================================

    'settings-titulo': {
        icon: '⚙️',
        label: 'Configurações',
        description: 'Ajuste todos os parâmetros do sistema para personalizar sua experiência',
        formula: 'Central de controle da aplicação',
        example: {
            good: 'Modifique gerenciamento, estratégias, temas e preferências',
            calculation: 'Mudanças são salvas automaticamente'
        },
        thresholds: {},
        ideal: 'Revise configurações periodicamente conforme evolui',
        tip: 'Teste mudanças em modo Simulação antes de aplicar em Oficial'
    },

    'settings-strategy-type': {
        icon: '🔄',
        label: 'Tipo de Estratégia',
        description: 'Define como o sistema gerencia seus aportes: com ou sem recuperação de perdas',
        formula: 'Escolha entre Ciclos de Recuperação ou Entradas Fixas',
        example: {
            good: 'Ciclos de Recuperação = Martingale controlado em 2 aportes para recuperar losses',
            calculation: 'Entradas Fixas = valor constante e limitado em todas as operações (mais conservador)'
        },
        thresholds: {},
        ideal: 'Entradas Fixas para iniciantes, Ciclos para experientes',
        tip: '⚠️ Ciclos aumentam risco mas recuperam perdas. Fixas são seguras mas sem recuperação automática'
    },

    'settings-divisor-recuperacao': {
        icon: '⚖️',
        label: 'Divisor de Recuperação',
        description: 'Define como dividir o prejuízo entre os 2 aportes de recuperação no Martingale',
        formula: 'Divisor X% / (100-X)% split do prejuízo',
        example: {
            good: '35/65: Primeiro aporte recupera 35% da perda, segundo aporte recupera 65%',
            calculation: 'Perdeu R$100 → Aporte 1 = R$35, Aporte 2 = R$65'
        },
        thresholds: {},
        ideal: '30-40% no primeiro aporte (menos agressivo)',
        tip: 'Valores baixos (20%) = mais conservador. Valores altos (50%) = mais agressivo'
    },

    'settings-trader-name': {
        icon: '👤',
        label: 'Nome do Trader',
        description: 'Seu nome ou apelido para personalizar a interface',
        formula: 'Identificação pessoal',
        example: {
            good: '"João Silva" ou "TradeMaster2024"',
            calculation: 'Aparece em relatórios e mensagens personalizadas'
        },
        thresholds: {},
        ideal: 'Use nome que te motive e identifique',
        tip: 'Pode ser anônimo se preferir: "Trader A", "Operador 1"'
    },

    'settings-notifications': {
        icon: '🔔',
        label: 'Notificações de Insight',
        description: 'Avisos e dicas do sistema sobre sua performance em tempo real',
        formula: 'Alertas contextuais baseados em análise automática',
        example: {
            good: '"Você está em sequência de 5 losses - considere pausar"',
            calculation: 'Sistema analisa padrões e sugere ações'
        },
        thresholds: {},
        ideal: 'Mantenha ATIVADO para orientação constante',
        tip: 'Desative apenas se achar distrativo - mas pode perder avisos importantes'
    },

    'settings-aba-gerenciamento': {
        icon: '📊',
        label: 'Aba Gerenciamento',
        description: 'Configurações de capital, metas e estratégias de trading',
        formula: 'Núcleo operacional do sistema',
        example: {
            good: 'Defina modo guiado, incorporação de lucros, recuperação',
            calculation: 'Essas configs impactam DIRETAMENTE seus resultados'
        },
        thresholds: {},
        ideal: 'Configure ANTES de iniciar sessões',
        tip: 'Mudanças aqui afetam cálculos futuros, não passados'
    },

    'settings-aba-preferencias': {
        icon: '⚙️',
        label: 'Aba Preferências',
        description: 'Ajustes gerais de interface e comportamento do app',
        formula: 'Experiência do usuário',
        example: {
            good: 'Notificações, idioma, sons, confirmações',
            calculation: 'Personalize como o app se comunica com você'
        },
        thresholds: {},
        ideal: 'Ajuste conforme sua preferência pessoal',
        tip: 'Não afeta cálculos - apenas UX'
    },

    // ========================================================================
    // DASHBOARD PRINCIPAL
    // ========================================================================

    'dashboard-capital-atual': {
        icon: '💰',
        label: 'Capital Atual',
        description: 'Saldo disponível para operar',
        formula: 'Capital Base + Lucros (se incorporar ON)',
        example: {
            good: 'R$1000 base + R$200 lucro = R$1200',
            calculation: 'Atualiza após cada operação'
        },
        thresholds: {},
        ideal: 'Monitore constantemente',
        tip: 'Proteger capital ON = lucros não incorporam'
    },

    'dashboard-resultado-dia': {
        icon: '📊',
        label: 'Resultado do Dia',
        description: 'Lucro/prejuízo acumulado na sessão',
        formula: 'Todas operações - perdas',
        example: {
            good: '+R$350 = dia lucrativo',
            calculation: 'Zera ao iniciar nova sessão'
        },
        thresholds: {},
        ideal: 'Compare com Stop Win/Loss',
        tip: 'Negativo = atenção redobrada!'
    },

    'dashboard-progresso-metas': {
        icon: '🎯',
        label: 'Progresso das Metas',
        description: 'Painel visual de evolução Win/Loss',
        formula: 'WR atual vs Meta + Resultado vs Limites',
        example: {
            good: 'Barras verdes = perto meta',
            calculation: 'Tempo real a cada op'
        },
        thresholds: {},
        ideal: 'Use para decidir continuar/parar',
        tip: 'Barra risco alta = PARE!'
    },

    'dashboard-btn-nova-sessao': {
        icon: '🚀',
        label: 'Nova Sessão',
        description: 'Inicia sessão (Oficial/Simulação)',
        formula: 'Limpa timeline e reseta contadores',
        example: {
            good: 'Após planejar ou recomeçar',
            calculation: 'Abre modal de escolha'
        },
        thresholds: {},
        ideal: 'Sempre com plano claro',
        tip: 'Teste em Simulação primeiro'
    },

    'dashboard-btn-finalizar': {
        icon: '🏁',
        label: 'Finalizar Sessão',
        description: 'Encerra e salva no histórico',
        formula: 'Grava estatísticas permanentes',
        example: {
            good: 'Ao atingir meta ou fim do dia',
            calculation: 'Cria registro completo'
        },
        thresholds: {},
        ideal: 'SEMPRE antes de fechar app',
        tip: 'Não perca seus dados!'
    },

    'dashboard-btn-desfazer': {
        icon: '↩️',
        label: 'Desfazer',
        description: 'Remove última operação',
        formula: 'Reverte cálculos e timeline',
        example: {
            good: 'Corrigir erro de marcação',
            calculation: 'Apenas 1 nível'
        },
        thresholds: {},
        ideal: 'Correções rápidas',
        tip: 'Só a última op - use rápido!'
    },

    'dashboard-timeline': {
        icon: '📈',
        label: 'Histórico Visual',
        description: 'Timeline de todas operações',
        formula: 'Verde=Win, Vermelho=Loss',
        example: {
            good: '🟢🟢🔴🟢🟢 = bom padrão',
            calculation: 'Sequências visíveis'
        },
        thresholds: {},
        ideal: 'Visualizar momentum',
        tip: 'Muitos vermelhos = pause!'
    },

    'dashboard-status-indicators': {
        icon: '🎯',
        label: 'Indicadores Status',
        description: 'Cards de WR/Loss state',
        formula: 'Feedback visual performance',
        example: {
            good: '🎯 "Controle total"',
            calculation: 'Emojis mudam por contexto'
        },
        thresholds: {},
        ideal: 'Ajustar ritmo',
        tip: 'Alerta vermelho = crítico!'
    }
};

/**
 * IDs das métricas na ordem em que aparecem no dashboard
 */
const METRIC_IDS = [
    'resultado-total',
    'assertividade',
    'payoff-ratio',
    'expectativa-ev',
    'num-operacoes',
    'num-sessoes',
    'seq-vitorias',
    'seq-derrotas',
    'drawdown-maximo',
    'payout-medio'
];

/**
 * Calcula o status de uma métrica baseado em seu valor
 * @param {string} metricId - ID da métrica
 * @param {number} value - Valor atual da métrica
 * @returns {Object} Status com label e classe CSS
 */
function calculateMetricStatus(metricId, value) {
    const metric = METRIC_GLOSSARY[metricId];
    if (!metric || !metric.thresholds) {
        return { label: '⚪ N/A', class: 'neutral', description: '' };
    }

    const thresholds = metric.thresholds;

    // Para métricas com max (drawdown, seq-derrotas)
    if (thresholds.excellent.max !== undefined) {
        if (value <= thresholds.excellent.max) return { ...thresholds.excellent, class: 'excellent' };
        if (value <= thresholds.good.max) return { ...thresholds.good, class: 'good' };
        if (value <= thresholds.warning.max) return { ...thresholds.warning, class: 'warning' };
        return { ...thresholds.bad, class: 'bad' };
    }

    // Para métricas com min (todas as outras)
    if (value >= (thresholds.excellent?.min || Infinity)) return { ...thresholds.excellent, class: 'excellent' };
    if (value >= (thresholds.good?.min || 0)) return { ...thresholds.good, class: 'good' };
    if (value >= (thresholds.warning?.min || 0)) return { ...thresholds.warning, class: 'warning' };
    return { ...thresholds.bad, class: 'bad' };
}
