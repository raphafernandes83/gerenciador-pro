/**
 * @fileoverview Componente de Dashboard
 * Gerencia a exibição do dashboard principal com capital, lucro/prejuízo e estatísticas
 * @module DashboardUI
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';

/**
 * Componente responsável pelo dashboard principal
 */
export class DashboardUI extends BaseUI {
    constructor() {
        super();
        this.domHelper = null;
    }

    /**
     * Inicializa o componente
     */
    init() {
        super.init();

        // Criar domHelper local se não existir globalmente
        this.domHelper = this._createDOMHelper();

        logger.info('📊 DashboardUI pronto');
    }

    /**
     * Cria helper de DOM
     * @private
     */
    _createDOMHelper() {
        return {
            addClass: (element, ...classes) => {
                if (element) element.classList.add(...classes);
            },
            removeClass: (element, ...classes) => {
                if (element) element.classList.remove(...classes);
            },
            toggleClass: (element, className, force) => {
                if (element) element.classList.toggle(className, force);
            }
        };
    }

    /**
     * Atualiza dashboard completo da sessão
     * @async
     */
    async atualizarDashboardSessao() {
        try {
            const { capitalDeCalculo, capitalAtual, capitalInicioSessao } = state;

            // Proteção contra NaN
            const capitalAtualSeguro = this._normalizarCapital(capitalAtual);
            const capitalInicioSeguro = this._normalizarCapital(capitalInicioSessao);

            let lucroPrejuizo = capitalAtualSeguro - capitalInicioSeguro;

            // Verificação final
            if (!this._isValidNumber(lucroPrejuizo)) {
                logger.error('lucroPrejuizo calculado como NaN');
                lucroPrejuizo = 0;
            }

            const isZen = config.zenMode;

            // Debug
            logger.debug('Dashboard update:', {
                capitalAtual: capitalAtualSeguro,
                capitalInicio: capitalInicioSeguro,
                lucroPrejuizo,
                historico: state.historicoCombinado?.length || 0,
                isActive: state.isSessionActive
            });

            // Sem sessão ativa = zero
            if (!state.isSessionActive) {
                lucroPrejuizo = 0;
            }

            // Atualizar elementos do DOM
            await this._atualizarElementosDOM(
                capitalAtualSeguro,
                lucroPrejuizo,
                capitalDeCalculo,
                isZen
            );

            // Atualizar botão de desfazer
            if (dom.undoBtn) {
                dom.undoBtn.disabled = state.undoStack.length === 0 || !state.isSessionActive;
            }

            logger.info('✅ Dashboard atualizado');

        } catch (error) {
            logger.error('Erro ao atualizar dashboard:', error);
        }
    }

    /**
     * Atualiza elementos do DOM
     * @private
     */
    async _atualizarElementosDOM(capitalAtual, lucroPrejuizo, capitalCalculo, isZen) {
        // Capital de cálculo (base)
        if (dom.displayCapitalCalculo) {
            const texto = isZen
                ? '(Base: ---)'
                : `(Base: ${this.formatarMoeda(capitalCalculo)})`;

            this._setText(dom.displayCapitalCalculo, texto);
            this._forceRepaint(dom.displayCapitalCalculo);
        }

        // Capital atual
        if (dom.capitalAtual) {
            const texto = isZen ? '---' : this.formatarMoeda(capitalAtual);
            this._setText(dom.capitalAtual, texto);
            this._forceRepaint(dom.capitalAtual);
        }

        // Lucro/Prejuízo
        if (dom.lucroPrejuizo) {
            const texto = isZen ? '---' : this.formatarMoeda(lucroPrejuizo);
            this._setText(dom.lucroPrejuizo, texto);

            // Aplicar classes de cor
            this.domHelper.toggleClass(dom.lucroPrejuizo, 'positive', lucroPrejuizo > 0);
            this.domHelper.toggleClass(dom.lucroPrejuizo, 'negative', lucroPrejuizo < 0);

            this._forceRepaint(dom.lucroPrejuizo);
        }
    }

    /**
     * Normaliza valor de capital
     * @private
     */
    _normalizarCapital(valor) {
        if (typeof valor === 'number' && !isNaN(valor)) {
            return valor;
        }
        return config.capitalInicial || 0;
    }

    /**
     * Valida se número é válido
     * @private
     */
    _isValidNumber(num) {
        return typeof num === 'number' && !isNaN(num) && isFinite(num);
    }

    /**
     * Força repaint do elemento
     * @private
     */
    _forceRepaint(element) {
        if (!element) return;

        try {
            element.style.display = 'none';
            element.offsetHeight; // Trigger reflow
            element.style.display = '';
        } catch (error) {
            // Ignorar erros de repaint
        }
    }

    /**
     * Atualiza cards de estatísticas
     */
    atualizarCards() {
        logger.debug('Atualizando cards de estatísticas');

        // TODO: Implementar atualização de cards
        // Esta função será expandida conforme necessário
    }

    /**
     * Atualiza indicadores de status
     */
    atualizarStatusIndicadores() {
        logger.debug('Atualizando indicadores de status');

        // TODO: Implementar atualização de indicadores
        // Esta função será expandida conforme necessário
    }

    /**
     * Renderiza estatísticas gerais
     */
    renderizarEstatisticas() {
        logger.debug('Renderizando estatísticas');

        // TODO: Implementar renderização de estatísticas
        // Esta função será expandida conforme necessário
    }

    /**
     * Atualiza tudo do dashboard
     * @async
     */
    async atualizarTudo() {
        await this.atualizarDashboardSessao();
        this.atualizarCards();
        this.atualizarStatusIndicadores();
        this.renderizarEstatisticas();
    }
}

export default DashboardUI;
