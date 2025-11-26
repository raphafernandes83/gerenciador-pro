/**
 * @fileoverview Componente de Timeline
 * Gerencia a visualização cronológica das operações
 * @module TimelineUI
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';
import { calcularSequencias } from '../../logic.js';

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

    /**
     * 🚀 Renderiza timeline completa (versão avançada vinda de ui.js)
     * Com validações robustas, fallback para dados persistidos e filtros de sequências
     */
    renderizarCompleta(historico = state.historicoCombinado, container = dom.timelineContainer) {
        // Garantir array válido
        if (typeof historico === 'string') {
            try {
                historico = JSON.parse(historico);
            } catch (e) {
                historico = [];
            }
        }
        if (!Array.isArray(historico)) {
            historico = [];
        }

        // Validação container
        if (!container) {
            logger.warn('[TIMELINE] Container não fornecido, usando padrão');
            container = dom.timelineContainer;
            if (!container) {
                logger.error('[TIMELINE] Timeline container não encontrado!');
                return;
            }
        }

        // Remover qualquer estilo forçado previamente
        try {
            container.style.border = '';
            container.style.borderRadius = '';
            container.style.padding = '';
            container.style.minHeight = '';
            container.style.background = '';
            container.style.boxShadow = '';
        } catch (_) { }

        // Fallback: Se histórico vazio, tentar carregar dados persistidos
        if (historico.length === 0 && !state.isSessionActive && !window.__suppressPersistedTimeline) {
            logger.warn('[TIMELINE] Histórico vazio - buscando dados persistidos');
            try {
                const savedSession = localStorage.getItem('gerenciadorProActiveSession');
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);
                    if (sessionData.historicoCombinado && Array.isArray(sessionData.historicoCombinado)) {
                        logger.info(`[TIMELINE] Dados persistidos encontrados: ${sessionData.historicoCombinado.length} ops`);
                        historico = sessionData.historicoCombinado;
                    }
                }
            } catch (error) {
                logger.warn('[TIMELINE] Erro ao carregar dados persistidos:', error);
            }
        }

        // Aplicar filtros de sequência
        let operacoesParaRenderizar = historico;
        if (historico.length > 0) {
            const sequencias = calcularSequencias(historico);
            if (state.filtroTimeline === 'win_streak' && container === dom.timelineContainer) {
                operacoesParaRenderizar = sequencias.maxWinStreak;
            }
            if (state.filtroTimeline === 'loss_streak' && container === dom.timelineContainer) {
                operacoesParaRenderizar = sequencias.maxLossStreak;
            }
        }

        // Se vazio, renderizar mensagem
        if (operacoesParaRenderizar.length === 0) {
            const mutedColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-muted')
                .trim() || '#888888';
            container.innerHTML = `<p style="text-align:center; color: ${mutedColor}; padding: 1rem;">${state.isSessionActive ? 'Nenhuma operação registada.' : 'Sessão inativa.'}</p><div class="timeline-line"></div>`;
            return;
        }

        // Renderizar operações
        container.innerHTML = '<div class="timeline-line"></div>';
        operacoesParaRenderizar.forEach((op, index) => {
            this.adicionarItem(op, index, false, container);
        });
    }

    /**
     * 🚀 Adiciona item individual à timeline (versão avançada vinda de ui.js)
     * Com ícones contextuais, suporte a Zen Mode e validações robustas
     */
    adicionarItem(op, index, scrollToView = true, customContainer = null) {
        const container = customContainer || dom.timelineContainer;
        if (!container || !op) return;

        // Suportar tanto isWin boolean quanto resultado string
        let isWin;
        if (typeof op.isWin === 'boolean') {
            isWin = op.isWin;
        } else if (typeof op.resultado === 'string') {
            isWin = op.resultado === 'WIN';
        } else {
            logger.warn('Operação sem isWin ou resultado válido:', op);
            return;
        }

        // Normalizar
        op.isWin = isWin;

        // Ícone contextual baseado em tag
        const getIconForOperation = (op) => {
            const tag = op.tag || '';
            if (op.isWin) {
                if (tag.includes('Plano')) return '✅';
                if (tag.includes('Perfeita')) return '🎯';
                if (tag.includes('Tendência')) return '📈';
                if (tag.includes('Paciência')) return '😌';
                return '👍';
            } else {
                if (tag.includes('Plano')) return '❌';
                if (tag.includes('Impaciência')) return '😡';
                if (tag.includes('Hesitação') || tag.includes('Medo')) return '😰';
                if (tag.includes('Tendência')) return '📉';
                return '👎';
            }
        };

        const itemClass = op.isWin ? 'win' : 'loss';

        // Valor canônico
        const valorCanonico = typeof op.valor === 'number' && !isNaN(op.valor)
            ? op.valor
            : typeof op.resultado === 'number' && !isNaN(op.resultado)
                ? op.resultado
                : 0;

        const valorDisplay = config.zenMode
            ? '---'
            : valorCanonico >= 0
                ? `+ ${this.formatarMoeda(valorCanonico)}`
                : `- ${this.formatarMoeda(Math.abs(valorCanonico))}`;

        const notaHTML = op.nota ? `<p class="timeline-note">${op.nota}</p>` : '';

        // CSS variable para timestamp
        const mutedColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-muted')
            .trim() || '#888888';

        const itemDiv = document.createElement('div');
        itemDiv.className = `timeline-item ${itemClass}`;
        itemDiv.dataset.opIndex = index;
        itemDiv.innerHTML = `
            <div class="timeline-marker">${getIconForOperation(op)}</div>
            <div class="timeline-content">
                <button class="edit-op-btn" title="Editar Operação">✏️</button>
                <div class="timeline-header">
                    <span class="timeline-tag">${op.tag || 'Sem Tag'}</span>
                    <span class="timeline-value ${itemClass}">${valorDisplay}</span>
                </div>
                <span style="font-size: 0.8rem; color: ${mutedColor};">${op.timestamp}</span>
                ${notaHTML}
            </div>`;

        // Remover mensagem vazia se existir
        const p = container.querySelector('p');
        if (p) p.remove();

        container.appendChild(itemDiv);
        if (scrollToView) {
            itemDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    /**
     * Remove último item da timeline
     */
    removerUltimoItem() {
        const container = dom.timelineContainer;
        if (container && container.lastChild && container.lastChild.classList?.contains('timeline-item')) {
            container.removeChild(container.lastChild);
        }
    }
}

export default TimelineUI;
