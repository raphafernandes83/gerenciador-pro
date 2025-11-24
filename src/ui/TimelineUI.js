/**
 * @fileoverview Componente de Timeline
 * Gerencia a visualização cronológica das operações
 * @module TimelineUI
 */

import { BaseUI } from './BaseUI.js';
import { state } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';

/**
 * Componente responsável pela timeline de operações
 */
export class TimelineUI extends BaseUI {
    constructor() {
        super();
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();
        logger.info('⏱️ TimelineUI pronto');
    }

    /**
     * Renderiza timeline completa
     * @param {Array} historico - Histórico de operações
     * @param {HTMLElement} container - Container da timeline
     */
    renderizarTimeline(historico = state.historicoCombinado, container = dom.timelineContainer) {
        try {
            // Validações
            if (!this._validateElement(container, 'timeline container')) return;

            historico = this._validarHistorico(historico);

            if (historico.length === 0) {
                this._renderizarTimelineVazia(container);
                return;
            }

            // Agrupar por data
            const agrupado = this._agruparPorData(historico);

            // Renderizar
            this._renderizarGrupos(agrupado, container);

            logger.debug(`✅ Timeline renderizada: ${historico.length} operações`);

        } catch (error) {
            logger.error('Erro ao renderizar timeline:', error);
        }
    }

    /**
     * Valida histórico
     * @private
     */
    _validarHistorico(historico) {
        // Se string, tentar parsear
        if (typeof historico === 'string') {
            try {
                historico = JSON.parse(historico);
            } catch (e) {
                historico = [];
            }
        }

        // Se não for array, retornar vazio
        if (!Array.isArray(historico)) {
            historico = [];
        }

        return historico;
    }

    /**
     * Agrupa operações por data
     * @private
     */
    _agruparPorData(historico) {
        const grupos = {};

        historico.forEach(operacao => {
            const data = this._extrairData(operacao);

            if (!grupos[data]) {
                grupos[data] = [];
            }

            grupos[data].push(operacao);
        });

        return grupos;
    }

    /**
     * Extrai data da operação
     * @private
     */
    _extrairData(operacao) {
        if (operacao.timestamp) {
            const date = new Date(operacao.timestamp);
            return date.toLocaleDateString('pt-BR');
        }

        if (operacao.data) {
            return operacao.data;
        }

        return 'Hoje';
    }

    /**
     * Renderiza grupos de timeline
     * @private
     */
    _renderizarGrupos(grupos, container) {
        container.innerHTML = '';

        // Ordenar datas (mais recente primeiro)
        const datas = Object.keys(grupos).reverse();

        datas.forEach(data => {
            const grupo = this._criarGrupoData(data, grupos[data]);
            container.appendChild(grupo);
        });
    }

    /**
     * Cria grupo de data
     * @private
     */
    _criarGrupoData(data, operacoes) {
        const grupo = document.createElement('div');
        grupo.className = 'timeline-grupo';

        // Header do grupo
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.innerHTML = `
            <span class="timeline-data">${data}</span>
            <span class="timeline-count">${operacoes.length} op${operacoes.length > 1 ? 's' : ''}</span>
        `;
        grupo.appendChild(header);

        // Items
        const items = document.createElement('div');
        items.className = 'timeline-items';

        operacoes.forEach(operacao => {
            const item = this._criarItem(operacao);
            items.appendChild(item);
        });

        grupo.appendChild(items);

        return grupo;
    }

    /**
     * Cria item de timeline
     * @private
     */
    _criarItem(operacao) {
        const item = document.createElement('div');
        item.className = `timeline-item ${operacao.isWin ? 'win' : 'loss'}`;

        const horario = this._extrairHorario(operacao);
        const icone = operacao.isWin ? '✓' : '✗';
        const classe = operacao.isWin ? 'win' : 'loss';

        item.innerHTML = `
            <div class="timeline-icon ${classe}">${icone}</div>
            <div class="timeline-content">
                <div class="timeline-info">
                    <span class="timeline-horario">${horario}</span>
                    <span class="timeline-valor ${operacao.valor >= 0 ? 'positive' : 'negative'}">
                        ${this.formatarMoeda(operacao.valor)}
                    </span>
                </div>
                ${operacao.tag ? `<span class="timeline-tag">#${operacao.tag}</span>` : ''}
            </div>
        `;

        return item;
    }

    /**
     * Extrai horário da operação
     * @private
     */
    _extrairHorario(operacao) {
        if (operacao.timestamp) {
            const date = new Date(operacao.timestamp);
            return date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        if (operacao.horario) {
            return operacao.horario;
        }

        return '--:--';
    }

    /**
     * Renderiza timeline vazia
     * @private
     */
    _renderizarTimelineVazia(container) {
        container.innerHTML = `
            <div class="timeline-vazia">
                <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    Nenhuma operação na timeline
                </p>
            </div>
        `;
    }

    /**
     * Renderiza eventos especiais
     */
    renderizarEventos() {
        // TODO: Marcar eventos especiais (metas atingidas, etc)
        logger.debug('Renderizando eventos especiais');
    }

    /**
     * Atualiza timeline
     */
    atualizarTimeline() {
        this.renderizarTimeline();
        this.renderizarEventos();
    }

    /**
     * Filtra timeline
     * @param {string} filtro - 'win', 'loss' ou 'todos'
     */
    filtrar(filtro) {
        let historico = state.historicoCombinado || [];

        if (filtro === 'win') {
            historico = historico.filter(op => op.isWin);
        } else if (filtro === 'loss') {
            historico = historico.filter(op => !op.isWin);
        }

        this.renderizarTimeline(historico);
    }

    /**
     * Destaca operação na timeline
     * @param {number} index - Índice da operação
     */
    destacarOperacao(index) {
        const items = document.querySelectorAll('.timeline-item');

        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('destacado');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                item.classList.remove('destacado');
            }
        });
    }
}

export default TimelineUI;
