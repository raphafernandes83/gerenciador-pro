/**
 * @fileoverview Componente de Tabela de Operações
 * Gerencia a exibição e manipulação da tabela de resultados
 * @module TabelaUI
 */

import { BaseUI } from './BaseUI.js';
import { state } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';
import { debounce } from '../utils/PerformanceUtils.js';

/**
 * Componente responsável pela tabela de operações
 */
export class TabelaUI extends BaseUI {
    constructor() {
        super();
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.filtroAtivo = 'todos';

        // 🚀 Cache de performance
        this._cacheHistoricoFiltrado = null;
        this._ultimoFiltro = null;

        // 🚀 Debounce para filtros
        this._atualizarTabelaDebounced = debounce(
            () => this.atualizarTabela(),
            150, // 150ms de debounce
            { leading: false, trailing: true }
        );
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();
        logger.info('📊 TabelaUI pronto');
    }

    /**
     * Atualiza tabela completa
     */
    atualizarTabela() {
        try {
            const historico = this._getHistoricoFiltrado();

            if (historico.length === 0) {
                this._renderizarTabelaVazia();
                return;
            }

            this._renderizarLinhas(historico);
            this._atualizarPaginacao(historico.length);

            logger.debug(`✅ Tabela atualizada: ${historico.length} operações`);

        } catch (error) {
            logger.error('Erro ao atualizar tabela:', error);
        }
    }

    /**
     * Obtém histórico filtrado com cache
     * @private
     */
    _getHistoricoFiltrado() {
        const historicoAtual = state.historicoCombinado || [];

        // 🚀 Cache: Retornar cache se filtro não mudou e histórico é o mesmo
        if (
            this._cacheHistoricoFiltrado &&
            this._ultimoFiltro === this.filtroAtivo &&
            this._cacheHistoricoFiltrado.sourceLength === historicoAtual.length
        ) {
            return this._cacheHistoricoFiltrado.data;
        }

        let historico = historicoAtual;

        // Aplicar filtro
        if (this.filtroAtivo === 'win') {
            historico = historico.filter(op => op.isWin);
        } else if (this.filtroAtivo === 'loss') {
            historico = historico.filter(op => !op.isWin);
        }

        // Salvar no cache
        this._cacheHistoricoFiltrado = {
            data: historico,
            sourceLength: historicoAtual.length
        };
        this._ultimoFiltro = this.filtroAtivo;

        return historico;
    }

    /**
     * Renderiza linhas da tabela com otimização de performance
     * @private
     */
    _renderizarLinhas(historico) {
        const tbody = dom.tabelaResultadosBody;
        if (!this._validateElement(tbody, 'tbody da tabela')) return;

        // Calcular paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const paginaOperacoes = historico.slice(inicio, fim);

        // 🚀 Usar DocumentFragment para inserção em lote (melhor performance)
        const fragment = document.createDocumentFragment();

        // Renderizar cada linha no fragment
        paginaOperacoes.forEach((operacao, index) => {
            const linha = this._criarLinha(operacao, inicio + index);
            fragment.appendChild(linha);
        });

        // Limpar tbody e inserir tudo de uma vez (1 reflow ao invés de N)
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }

    /**
     * Cria uma linha da tabela
     * @private
     */
    _criarLinha(operacao, index) {
        const tr = document.createElement('tr');
        tr.className = operacao.isWin ? 'win' : 'loss';
        tr.dataset.index = index;

        // # da operação
        const tdNumero = document.createElement('td');
        tdNumero.textContent = index + 1;
        tr.appendChild(tdNumero);

        // Data/Hora
        const tdDataHora = document.createElement('td');
        tdDataHora.textContent = this._formatarDataHora(operacao);
        tr.appendChild(tdDataHora);

        // Tipo (Win/Loss)
        const tdTipo = document.createElement('td');
        tdTipo.innerHTML = operacao.isWin
            ? '<span class="badge win">✓ Win</span>'
            : '<span class="badge loss">✗ Loss</span>';
        tr.appendChild(tdTipo);

        // Valor
        const tdValor = document.createElement('td');
        tdValor.textContent = this.formatarMoeda(operacao.valor);
        tdValor.className = operacao.valor >= 0 ? 'positive' : 'negative';
        tr.appendChild(tdValor);

        // Payout
        const tdPayout = document.createElement('td');
        tdPayout.textContent = operacao.payout ? `${operacao.payout}%` : '-';
        tr.appendChild(tdPayout);

        // Tag
        const tdTag = document.createElement('td');
        if (operacao.tag) {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = operacao.tag;
            tdTag.appendChild(span);
        } else {
            tdTag.textContent = '-';
        }
        tr.appendChild(tdTag);

        // Ações
        const tdAcoes = document.createElement('td');
        tdAcoes.innerHTML = `
            <button class="btn-editar" data-index="${index}" title="Editar">
                ✏️
            </button>
            <button class="btn-excluir" data-index="${index}" title="Excluir">
                🗑️
            </button>
        `;
        tr.appendChild(tdAcoes);

        return tr;
    }

    /**
     * Formata data/hora
     * @private
     */
    _formatarDataHora(operacao) {
        if (operacao.timestamp) {
            const data = new Date(operacao.timestamp);
            return data.toLocaleString('pt-BR');
        }

        if (operacao.horario) {
            return operacao.horario;
        }

        return 'N/A';
    }

    /**
     * Renderiza tabela vazia
     * @private
     */
    _renderizarTabelaVazia() {
        const tbody = dom.tabelaResultadosBody;
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    Nenhuma operação registrada
                </td>
            </tr>
        `;
    }

    /**
     * Atualiza paginação
     * @private
     */
    _atualizarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / this.itensPorPagina);

        // Atualizar elementos de paginação
        if (dom.paginacaoInfo) {
            const inicio = (this.paginaAtual - 1) * this.itensPorPagina + 1;
            const fim = Math.min(this.paginaAtual * this.itensPorPagina, totalItens);

            dom.paginacaoInfo.textContent = `${inicio}-${fim} de ${totalItens}`;
        }

        // Botões anterior/próximo
        if (dom.btnPaginaAnterior) {
            dom.btnPaginaAnterior.disabled = this.paginaAtual === 1;
        }

        if (dom.btnProximaPagina) {
            dom.btnProximaPagina.disabled = this.paginaAtual >= totalPaginas;
        }
    }

    /**
     * Vai para próxima página
     */
    proximaPagina() {
        const historico = this._getHistoricoFiltrado();
        const totalPaginas = Math.ceil(historico.length / this.itensPorPagina);

        if (this.paginaAtual < totalPaginas) {
            this.paginaAtual++;
            this.atualizarTabela();
        }
    }

    /**
     * Vai para página anterior
     */
    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.atualizarTabela();
        }
    }

    /**
     * Define filtro com debounce para performance
     */
    setFiltro(filtro) {
        this.filtroAtivo = filtro;
        this.paginaAtual = 1; // Reset para primeira página

        // Invalidar cache quando filtro mudar
        this._cacheHistoricoFiltrado = null;

        // 🚀 Usar versão debounced para evitar re-renderizações excessivas
        this._atualizarTabelaDebounced();

        logger.debug(`Filtro aplicado: ${filtro}`);
    }

    /**
     * Renderiza estatísticas da tabela
     */
    renderizarEstatisticas() {
        const historico = state.historicoCombinado || [];

        if (historico.length === 0) return;

        const stats = {
            total: historico.length,
            wins: historico.filter(op => op.isWin).length,
            losses: historico.filter(op => !op.isWin).length,
            winRate: 0,
            totalGanho: 0,
            totalPerda: 0
        };

        stats.winRate = (stats.wins / stats.total) * 100;
        stats.totalGanho = historico
            .filter(op => op.isWin)
            .reduce((sum, op) => sum + op.valor, 0);
        stats.totalPerda = Math.abs(
            historico
                .filter(op => !op.isWin)
                .reduce((sum, op) => sum + op.valor, 0)
        );

        // Atualizar elementos de stats (se existirem)
        this._atualizarElementosStats(stats);

        logger.debug('Estatísticas renderizadas:', stats);
    }

    /**
     * Atualiza elementos de estatísticas
     * @private
     */
    _atualizarElementosStats(stats) {
        if (dom.statsTotalOperacoes) {
            dom.statsTotalOperacoes.textContent = stats.total;
        }

        if (dom.statsWins) {
            dom.statsWins.textContent = stats.wins;
        }

        if (dom.statsLosses) {
            dom.statsLosses.textContent = stats.losses;
        }

        if (dom.statsWinRate) {
            dom.statsWinRate.textContent = this.formatarPercent(stats.winRate);
        }

        if (dom.statsTotalGanho) {
            dom.statsTotalGanho.textContent = this.formatarMoeda(stats.totalGanho);
        }

        if (dom.statsTotalPerda) {
            dom.statsTotalPerda.textContent = this.formatarMoeda(stats.totalPerda);
        }
    }

    /**
     * Atualiza tudo
     */
    atualizarTudo() {
        this.atualizarTabela();
        this.renderizarEstatisticas();
    }

    /**
     * Reseta paginação e cache
     */
    resetarPaginacao() {
        this.paginaAtual = 1;
        this._cacheHistoricoFiltrado = null; // Limpar cache
        this.atualizarTabela();
    }

    /**
     * Limpa cache manualmente (útil após mudanças no histórico)
     */
    limparCache() {
        this._cacheHistoricoFiltrado = null;
        this._ultimoFiltro = null;
        logger.debug('Cache de TabelaUI limpo');
    }
}

export default TabelaUI;
