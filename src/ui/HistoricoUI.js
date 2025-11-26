/**
 * @fileoverview Componente de Histórico e Análises
 * Gerencia renderização de histórico de sessões, diagnósticos e análises
 * @module HistoricoUI
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';
import { dbManager } from '../../db.js';
import { calcularExpectativaMatematica } from '../../logic.js';

/**
 * Componente responsável por histórico, diagnósticos e análises
 */
export class HistoricoUI extends BaseUI {
    constructor() {
        super();
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();
        logger.info('📚 HistoricoUI pronto');
    }

    /**
     * Renderiza diário de sessões
     * @param {string} filter - 'todas', 'oficial' ou 'simulacao'
     */
    async renderDiario(filter = 'todas') {
        const body = dom.tabelaHistoricoBody;
        if (!body) return;

        body.innerHTML = '<tr><td colspan="6" style="text-align: center;">A carregar...</td></tr>';

        try {
            let sessoes = filter === 'todas'
                ? await dbManager.getAllSessions()
                : await dbManager.getSessionsByMode(filter);

            if (!Array.isArray(sessoes)) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Erro ao carregar sessões.</td></tr>';
                return;
            }

            sessoes.sort((a, b) => b.data - a.data);

            if (sessoes.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma sessão encontrada.</td></tr>';
                return;
            }

            body.innerHTML = '';

            sessoes.forEach((sessao) => {
                // Normalização robusta
                if (!sessao.id) {
                    logger.warn('Sessão sem ID ignorada:', sessao);
                    return;
                }

                const tr = document.createElement('tr');
                tr.dataset.sessionId = sessao.id;

                const data = sessao.data
                    ? new Date(sessao.data).toLocaleDateString('pt-BR')
                    : 'Data inválida';

                const modo = sessao.modo || 'indefinido';

                const historico = Array.isArray(sessao.historicoCombinado)
                    ? sessao.historicoCombinado
                    : [];

                const totalOperacoes = typeof sessao.totalOperacoes === 'number'
                    ? sessao.totalOperacoes
                    : historico.length;

                // Recalcular resultado se inválido
                let resultadoFinanceiro = sessao.resultadoFinanceiro;
                if (typeof resultadoFinanceiro !== 'number' || isNaN(resultadoFinanceiro)) {
                    resultadoFinanceiro = historico.reduce((acc, op) => {
                        const valor = typeof op?.valor === 'number' ? op.valor : 0;
                        return acc + valor;
                    }, 0);
                }

                const assertividade = typeof sessao.assertividade === 'number'
                    ? sessao.assertividade
                    : 0;

                const resultadoClass = resultadoFinanceiro > 0 ? 'positive'
                    : resultadoFinanceiro < 0 ? 'negative'
                        : '';

                tr.innerHTML = `
                    <td>${data}</td>
                    <td>${modo}</td>
                    <td>${totalOperacoes}</td>
                    <td>${assertividade.toFixed(1)}%</td>
                    <td class="${resultadoClass}">${config.zenMode ? '---' : this.formatarMoeda(resultadoFinanceiro)}</td>
                    <td>
                        <button class="btn-replay" data-session-id="${sessao.id}" title="Replay">🔄</button>
                        <button class="btn-restore" data-session-id="${sessao.id}" title="Restaurar">♻️</button>
                    </td>
                `;

                body.appendChild(tr);
            });

            logger.debug(`✅ Diário renderizado: ${sessoes.length} sessões`);

        } catch (error) {
            logger.error('Erro ao renderizar diário:', error);
            body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Erro ao carregar histórico.</td></tr>';
        }
    }

    /**
     * Renderiza diagnósticos de tags
     * @param {Array} historico - Histórico de operações
     * @param {HTMLElement} container - Container para renderização
     */
    renderTagDiagnostics(historico, container) {
        if (!container) return;

        const diagnostics = {};
        container.innerHTML = '';

        historico.forEach((op) => {
            const tag = op.tag || 'Sem Tag';
            if (!diagnostics[tag]) {
                diagnostics[tag] = { ops: 0, wins: 0, resultado: 0 };
            }
            diagnostics[tag].ops++;
            diagnostics[tag].resultado += op.valor;
            if (op.isWin) diagnostics[tag].wins++;
        });

        const sortedTags = Object.entries(diagnostics).sort((a, b) => b[1].ops - a[1].ops);

        if (sortedTags.length === 0) {
            const mutedColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-muted')
                .trim() || '#888888';
            container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: ${mutedColor};">Nenhuma tag registada.</td></tr>`;
            return;
        }

        sortedTags.forEach(([tag, data]) => {
            const assertividade = data.ops > 0 ? (data.wins / data.ops) * 100 : 0;
            const resultadoClass = data.resultado > 0 ? 'positive'
                : data.resultado < 0 ? 'negative'
                    : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tag}</td>
                <td>${data.ops}</td>
                <td>${assertividade.toFixed(1)}%</td>
                <td class="${resultadoClass}">${config.zenMode ? '---' : this.formatarMoeda(data.resultado)}</td>
            `;
            container.appendChild(tr);
        });

        logger.debug(`✅ Diagnósticos de tags renderizados: ${sortedTags.length} tags`);
    }

    /**
     * Renderiza resultados de análise
     * @param {Object} processedData - Dados processados da análise
     * @param {string} dimension - Dimensão analisada
     */
    renderAnalysisResults(processedData, dimension) {
        const head = dom.analiseResultsHead;
        const body = dom.analiseResultsBody;
        const insightPanel = dom.analiseInsightPanel;
        const insightTitle = dom.analiseInsightTitle;
        const insightText = dom.analiseInsightText;

        if (!head || !body || !insightPanel || !insightTitle || !insightText) return;

        const dimensionMap = {
            dayOfWeek: 'Dia da Semana',
            hourOfDay: 'Hora do Dia',
            tag: 'Tag',
            payout: 'Payout',
        };

        head.innerHTML = `<tr><th>${dimensionMap[dimension]}</th><th>Nº Ops</th><th>Assertividade</th><th>Resultado</th><th>EV Médio</th></tr>`;
        body.innerHTML = '';

        if (processedData.data.length === 0) {
            body.innerHTML = `<tr><td colspan="5" style="text-align: center;">${processedData.insight}</td></tr>`;
            insightPanel.classList.add('hidden');
            return;
        }

        processedData.data.forEach((item) => {
            const resultadoClass = item.resultado > 0 ? 'positive'
                : item.resultado < 0 ? 'negative'
                    : '';
            const evClass = item.ev > 0 ? 'positive'
                : item.ev < 0 ? 'negative'
                    : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.key}</td>
                <td>${item.ops}</td>
                <td>${(item.assertividade * 100).toFixed(1)}%</td>
                <td class="${resultadoClass}">${config.zenMode ? '---' : this.formatarMoeda(item.resultado)}</td>
                <td class="${evClass}">${config.zenMode ? '---' : this.formatarMoeda(item.ev)}</td>
            `;
            body.appendChild(tr);
        });

        insightTitle.textContent = 'Diagnóstico Quantitativo';
        insightText.textContent = processedData.insight;
        insightPanel.classList.remove('hidden');

        const overallEV = calcularExpectativaMatematica(
            processedData.data.flatMap((d) => d.historico)
        ).ev;

        insightPanel.classList.toggle('success', overallEV > 0);
        insightPanel.classList.toggle('warning', overallEV < 0);

        logger.debug(`✅ Análise renderizada: ${processedData.data.length} items`);
    }

    /**
     * Renderiza resultados de otimização de metas
     * @param {Object} results - Resultados da simulação
     */
    renderGoalOptimizationResults(results) {
        const { totalSimulatedResult, riskReward, winSessions, lossSessions, insight } = results;

        if (dom.goalSimResult) {
            try {
                const formatted = this.formatarMoeda(totalSimulatedResult);
                dom.goalSimResult.textContent = formatted;
                dom.goalSimResult.className = totalSimulatedResult >= 0 ? 'positive' : 'negative';
            } catch (error) {
                logger.error('Erro ao formatar moeda:', error);
                dom.goalSimResult.textContent = 'R$ 0,00';
            }
        }

        if (dom.goalSimRr) dom.goalSimRr.textContent = `${riskReward}:1`;
        if (dom.goalSimWins) dom.goalSimWins.textContent = winSessions;
        if (dom.goalSimLosses) dom.goalSimLosses.textContent = lossSessions;
        if (dom.goalSimulationInsight) dom.goalSimulationInsight.textContent = insight;
        if (dom.goalSimulationResults) dom.goalSimulationResults.classList.remove('hidden');

        logger.debug('✅ Resultados de otimização renderizados');
    }
}

export default HistoricoUI;
