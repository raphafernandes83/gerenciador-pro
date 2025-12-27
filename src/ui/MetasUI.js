/**
 * @fileoverview Componente de Metas
 * Gerencia Stop Win, Stop Loss e progress bars de metas
 * @module MetasUI
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';

/**
 * Componente responsável pelas metas (Stop Win/Loss)
 */
export class MetasUI extends BaseUI {
    constructor() {
        super();
        this.data = null;
        this.config = null;
    }

    /**
     * Inicializa o componente e restaura estado salvo
     */
    init() {
        super.init();

        // Restaura dados do localStorage
        this._restoreFromLocalStorage();

        // Se não tem dados no cache, sincroniza com state
        if (!this.data) {
            this._syncWithState();
        }

        // Atualiza UI se tiver dados
        if (this.data) {
            this.atualizarProgressoBarra();
            logger.debug('📦 MetasUI: Dados restaurados do cache');
        }

        logger.info('🎯 MetasUI pronto');
    }

    /**
     * Atualiza todas as barras de progresso
     */
    atualizarProgressoBarra() {
        try {
            // Sincroniza com state antes de atualizar
            this._syncWithState();

            // Win Rate
            this._atualizarWinRate();

            // Stop Win
            this._atualizarStopWin();

            // Stop Loss
            this._atualizarStopLoss();

            // Profit Factor
            this._atualizarProfitFactor();

            logger.debug('✅ Progress bars atualizadas');

        } catch (error) {
            logger.error('Erro ao atualizar progress bars:', error);
        } finally {
            // Salva estado atualizado
            this._saveToLocalStorage();
        }
    }

    /**
     * Salva dados e config no localStorage
     * @private
     */
    _saveToLocalStorage() {
        try {
            if (this.data) {
                localStorage.setItem('metasUI_data', JSON.stringify(this.data));
            }
            if (this.config) {
                localStorage.setItem('metasUI_config', JSON.stringify(this.config));
            }
            logger.debug('💾 MetasUI: Dados salvos no localStorage');
        } catch (error) {
            logger.error('Erro ao salvar MetasUI no localStorage:', error);
        }
    }

    /**
     * Restaura dados e config do localStorage
     * @private
     */
    _restoreFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('metasUI_data');
            const savedConfig = localStorage.getItem('metasUI_config');

            if (savedData) {
                this.data = JSON.parse(savedData);
            }
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
            }

            if (savedData || savedConfig) {
                logger.debug('📦 MetasUI: Dados carregados do localStorage');
            }
        } catch (error) {
            logger.error('Erro ao carregar MetasUI do localStorage:', error);
        }
    }

    /**
     * Sincroniza this.data e this.config com window.state
     * @private
     * @returns {boolean} True se sincronização bem-sucedida
     */
    _syncWithState() {
        if (!window.state) {
            logger.warn('⚠️ MetasUI: window.state não disponível para sync');
            return false;
        }

        try {
            // Popula data com dados do state
            this.data = {
                capitalInicial: window.state.capitalInicial || window.state.capitalInicioSessao || 0,
                capitalAtual: window.state.capitalAtual || 0,
                wins: window.state.historicoCombinado?.filter(op => op.isWin).length || 0,
                losses: window.state.historicoCombinado?.filter(op => !op.isWin).length || 0,
                totalOperacoes: window.state.historicoCombinado?.length || 0
            };

            // Popula config com metas do config
            this.config = {
                stopWin: window.config?.metas?.stopWin || 0,
                stopLoss: window.config?.metas?.stopLoss || 0,
                metaWinRate: window.config?.metas?.winRate || 0
            };

            logger.debug('🔄 MetasUI: Sincronizado com state', {
                capital: this.data.capitalAtual,
                wins: this.data.wins,
                losses: this.data.losses
            });

            return true;
        } catch (error) {
            logger.error('Erro ao sincronizar MetasUI com state:', error);
            return false;
        }
    }

    /**
     * Atualiza Win Rate
     * @private
     */
    _atualizarWinRate() {
        const historico = state.historicoCombinado || [];

        if (historico.length === 0) {
            this._setProgress('winRate', 0, '0%');
            return;
        }

        const vitorias = historico.filter(op => op.isWin).length;
        const winRate = (vitorias / historico.length) * 100;

        this._setProgress('winRate', winRate, this.formatarPercent(winRate));
    }

    /**
     * Atualiza Stop Win
     * @private
     */
    _atualizarStopWin() {
        if (!state.isSessionActive) {
            this._setProgress('stopWin', 0, '0%');
            return;
        }

        const lucroAtual = state.capitalAtual - state.capitalInicioSessao;
        const metaStopWin = state.stopWinValor || 0;

        if (metaStopWin === 0) {
            this._setProgress('stopWin', 0, '0%');
            return;
        }

        const progresso = Math.min(100, (lucroAtual / metaStopWin) * 100);
        this._setProgress('stopWin', Math.max(0, progresso), this.formatarPercent(progresso));

        // Alerta de 80%
        if (progresso >= 80 && !state.alertaStopWin80Mostrado) {
            this._mostrarAlertaProximidade('win', progresso);
            state.alertaStopWin80Mostrado = true;
        }
    }

    /**
     * Atualiza Stop Loss
     * @private
     */
    _atualizarStopLoss() {
        if (!state.isSessionActive) {
            this._setProgress('stopLoss', 0, '0%');
            return;
        }

        const perdaAtual = Math.abs(Math.min(0, state.capitalAtual - state.capitalInicioSessao));
        const metaStopLoss = state.stopLossValor || 0;

        if (metaStopLoss === 0) {
            this._setProgress('stopLoss', 0, '0%');
            return;
        }

        const progresso = Math.min(100, (perdaAtual / metaStopLoss) * 100);
        this._setProgress('stopLoss', Math.max(0, progresso), this.formatarPercent(progresso));

        // Alerta de 80%
        if (progresso >= 80 && !state.alertaStopLoss80Mostrado) {
            this._mostrarAlertaProximidade('loss', progresso);
            state.alertaStopLoss80Mostrado = true;
        }
    }

    /**
     * Atualiza Profit Factor
     * @private
     */
    _atualizarProfitFactor() {
        const historico = state.historicoCombinado || [];

        if (historico.length === 0) {
            this._setProgress('profitFactor', 0, '0.00');
            return;
        }

        const lucros = historico.filter(op => op.isWin)
            .reduce((sum, op) => sum + Math.abs(op.valor), 0);

        const perdas = historico.filter(op => !op.isWin)
            .reduce((sum, op) => sum + Math.abs(op.valor), 0);

        const profitFactor = perdas === 0 ? lucros : lucros / perdas;
        const progresso = Math.min(100, (profitFactor / 3) * 100); // Escala até 3.0

        this._setProgress('profitFactor', progresso, profitFactor.toFixed(2));
    }

    /**
     * Define progresso de uma barra
     * @private
     */
    _setProgress(tipo, valor, texto) {
        // Progress bar
        const progressBar = dom[`${tipo}Progress`];
        if (progressBar) {
            progressBar.style.width = `${valor}%`;
        }

        // Texto
        const textElement = dom[`${tipo}Text`];
        if (textElement) {
            textElement.textContent = texto;
        }
    }

    /**
     * Mostra alerta de proximidade de meta
     * @private
     */
    _mostrarAlertaProximidade(tipo, progresso) {
        const tipoTexto = tipo === 'win' ? 'Stop Win' : 'Stop Loss';
        const mensagem = `⚠️ Você está a ${(100 - progresso).toFixed(1)}% da meta de ${tipoTexto}!`;

        logger.info(mensagem);

        // Notificação visual moderna
        if (window.toastManager) {
            window.toastManager.warning(mensagem, 5000);
        }

        // Dispara evento customizado para notificação (legado)
        if (window.CustomEvent) {
            const event = new CustomEvent('metaProxima', {
                detail: { tipo, progresso, mensagem }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Renderiza cards de metas
     */
    renderizarCardsMetas() {
        this._renderizarCardStopWin();
        this._renderizarCardStopLoss();
    }

    /**
     * Renderiza card de Stop Win
     * @private
     */
    _renderizarCardStopWin() {
        const card = dom.cardStopWin;
        if (!card) return;

        const meta = state.stopWinValor || 0;
        const progresso = state.isSessionActive
            ? state.capitalAtual - state.capitalInicioSessao
            : 0;

        const html = `
            <div class="meta-card win">
                <h3>🎯 Stop Win</h3>
                <div class="meta-valor">${this.formatarMoeda(meta)}</div>
                <div class="meta-progresso">${this.formatarMoeda(progresso)}</div>
            </div>
        `;

        this._setHTML(card, html);
    }

    /**
     * Renderiza card de Stop Loss
     * @private
     */
    _renderizarCardStopLoss() {
        const card = dom.cardStopLoss;
        if (!card) return;

        const meta = state.stopLossValor || 0;
        const progresso = state.isSessionActive
            ? Math.abs(Math.min(0, state.capitalAtual - state.capitalInicioSessao))
            : 0;

        const html = `
            <div class="meta-card loss">
                <h3>🛑 Stop Loss</h3>
                <div class="meta-valor">${this.formatarMoeda(meta)}</div>
                <div class="meta-progresso">${this.formatarMoeda(progresso)}</div>
            </div>
        `;

        this._setHTML(card, html);
    }

    /**
     * Verifica proximidade de metas
     */
    verificarProximidadeMetas() {
        if (!state.isSessionActive) return;

        this._verificarProximidadeStopWin();
        this._verificarProximidadeStopLoss();
    }

    /**
     * Verifica proximidade Stop Win
     * @private
     */
    _verificarProximidadeStopWin() {
        const lucro = state.capitalAtual - state.capitalInicioSessao;
        const meta = state.stopWinValor;

        if (meta === 0) return;

        const progresso = (lucro / meta) * 100;

        if (progresso >= 80 && progresso < 100) {
            const faltam = meta - lucro;
            logger.info(`🎯 Faltam ${this.formatarMoeda(faltam)} para Stop Win!`);
        }

        if (progresso >= 100) {
            logger.info('🎉 Stop Win atingido!');
        }
    }

    /**
     * Verifica proximidade Stop Loss
     * @private
     */
    _verificarProximidadeStopLoss() {
        const perda = Math.abs(Math.min(0, state.capitalAtual - state.capitalInicioSessao));
        const meta = state.stopLossValor;

        if (meta === 0) return;

        const progresso = (perda / meta) * 100;

        if (progresso >= 80 && progresso < 100) {
            const faltam = meta - perda;
            logger.warn(`⚠️ Faltam ${this.formatarMoeda(faltam)} para Stop Loss!`);
        }

        if (progresso >= 100) {
            logger.error('🛑 Stop Loss atingido!');
        }
    }

    /**
     * Reseta alertas de proximidade
     */
    resetarAlertas() {
        state.alertaStopWin80Mostrado = false;
        state.alertaStopLoss80Mostrado = false;
        logger.debug('🔄 Alertas de proximidade resetados');
    }

    /**
     * Atualiza tudo de metas
     */
    atualizarTudo() {
        this.atualizarProgressoBarra();
        this.renderizarCardsMetas();
        this.verificarProximidadeMetas();
    }
}

export default MetasUI;
