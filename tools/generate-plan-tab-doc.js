/*
 Gera um catálogo da aba "Plano de Operações" com elementos e funções correlatas
 Saída: docs/manual-funcoes/05_plano_operacoes_catalogo.md
 Uso: node tools/generate-plan-tab-doc.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const htmlPath = path.join(ROOT, 'index.html');
const outDir = path.join(ROOT, 'docs', 'manual-funcoes');
const outFile = path.join(outDir, '05_plano_operacoes_catalogo.md');

const known = [
    {
        selector: '#capital-inicial',
        name: 'Capital Inicial',
        purpose: 'Valor inicial da sessão',
        related: [
            'events.handleNewSession',
            'logic.startNewSession',
            'ui.atualizarDashboardSessao',
        ],
    },
    {
        selector: '#percentual-entrada',
        name: 'Percentual de Entrada',
        purpose: 'Percentual do capital por operação',
        related: ['logic.calculateTradingPlan', 'TradingOperationsManager.calculateTradingPlan'],
    },
    {
        selector: '#stop-win-perc',
        name: 'Stop Win (%)',
        purpose: 'Meta de ganho em %',
        related: ['logic.verificarMetas', 'ui.atualizarDashboardSessao'],
    },
    {
        selector: '#stop-loss-perc',
        name: 'Stop Loss (%)',
        purpose: 'Limite de perda em %',
        related: ['logic.verificarMetas', 'ui.atualizarDashboardSessao'],
    },
    {
        selector: '.payout-buttons',
        name: 'Botões de Payout',
        purpose: 'Seleção de payout',
        related: ['sidebar.js (sync payout)', 'ui.atualizarVisualPlano'],
    },
    {
        selector: '.win-btn-linha',
        name: 'Botão WIN (linha do plano)',
        purpose: 'Registra vitória na etapa correspondente',
        related: ['events.handleWin', 'logic.finalizarRegistroOperacao'],
    },
    {
        selector: '.loss-btn-linha',
        name: 'Botão LOSS (linha do plano)',
        purpose: 'Registra derrota na etapa correspondente',
        related: ['events.handleLoss', 'logic.finalizarRegistroOperacao'],
    },
    {
        selector: '#timeline-container',
        name: 'Timeline (Histórico de Operações)',
        purpose: 'Exibição das operações do dia',
        related: ['ui.renderizarTimelineCompleta', 'bloqueador-zeramento-timeline'],
    },
    {
        selector: '#new-session-btn',
        name: 'Botão Nova Sessão',
        purpose: 'Inicia nova sessão',
        related: ['events.handleNewSession', 'logic.startNewSession'],
    },
    {
        selector: '#finish-session-btn',
        name: 'Botão Finalizar Sessão',
        purpose: 'Finaliza sessão ativa',
        related: ['events.handleFinishSession', 'logic.resetSessionState'],
    },
];

function findOccurrences(content, selector) {
    try {
        if (selector.startsWith('#')) {
            const id = selector.slice(1);
            const re = new RegExp(`id=["']${id}["']`, 'i');
            return re.test(content);
        }
        if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            const re = new RegExp(`class=["'][^"']*\\b${cls}\\b[^"']*["']`, 'i');
            return re.test(content);
        }
        return content.includes(selector);
    } catch {
        return false;
    }
}

function generate() {
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : '';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const rows = known.map((k) => {
        const present = findOccurrences(html, k.selector);
        return { ...k, present };
    });
    const lines = [];
    lines.push('# Catálogo: Aba "Plano de Operações"');
    lines.push('');
    lines.push('Este documento lista elementos-chave da aba e suas funções relacionadas.');
    lines.push('');
    lines.push(
        '| Elemento | Seletor | Presente no index.html | Propósito | Funções Relacionadas |'
    );
    lines.push('|---|---|---:|---|---|');
    rows.forEach((r) => {
        const rel = r.related.join(', ');
        lines.push(
            `| ${r.name} | \`${r.selector}\` | ${r.present ? 'Sim' : 'Não'} | ${r.purpose} | ${rel} |`
        );
    });
    lines.push('');
    lines.push('Observações:');
    lines.push('- A coluna "Presente" verifica apenas o index.html atual (heurístico).');
    lines.push('- Event handlers detalhados: ver `events.js`, `logic.js`, `ui.js`.');
    fs.writeFileSync(outFile, lines.join('\n'));
    console.log('✅ Catálogo gerado em', outFile);
}

generate();
