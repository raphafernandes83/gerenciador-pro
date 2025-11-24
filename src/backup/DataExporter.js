/**
 * @fileoverview Exportador de dados do sistema
 * Permite exportar configurações, sessões e histórico
 */

import { state, config } from '../../state.js';
import { logger } from '../utils/Logger.js';
import { dbManager } from '../../db.js';

/**
 * Exportador de dados
 */
export class DataExporter {
    constructor() {
        this.version = '1.0.0';
    }

    /**
     * Exporta dados completos do sistema
     * @returns {Promise<Object>} Dados exportados
     */
    async exportAll() {
        logger.info('📦 Iniciando exportação completa...');

        try {
            const data = {
                metadata: this._createMetadata(),
                config: this._exportConfig(),
                currentSession: this._exportCurrentSession(),
                sessions: await this._exportAllSessions(),
                statistics: this._exportStatistics()
            };

            logger.info('✅ Exportação completa finalizada');
            return data;

        } catch (error) {
            logger.error('Erro ao exportar dados:', error);
            throw error;
        }
    }

    /**
     * Exporta apenas configurações
     * @returns {Object} Configurações
     */
    exportConfig() {
        logger.info('⚙️ Exportando configurações...');
        return {
            metadata: this._createMetadata('config'),
            config: this._exportConfig()
        };
    }

    /**
     * Exporta sessão atual
     * @returns {Object} Sessão atual
     */
    exportCurrentSession() {
        logger.info('📊 Exportando sessão atual...');
        return {
            metadata: this._createMetadata('session'),
            session: this._exportCurrentSession()
        };
    }

    /**
     * Exporta todas as sessões salvas
     * @returns {Promise<Object>} Todas as sessões
     */
    async exportAllSessions() {
        logger.info('📚 Exportando todas as sessões...');

        try {
            const sessions = await this._exportAllSessions();

            return {
                metadata: this._createMetadata('sessions'),
                sessions
            };
        } catch (error) {
            logger.error('Erro ao exportar sessões:', error);
            throw error;
        }
    }

    /**
     * Cria metadados da exportação
     * @private
     */
    _createMetadata(type = 'full') {
        return {
            exportDate: new Date().toISOString(),
            exportType: type,
            appVersion: this.version,
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * Exporta configurações
     * @private
     */
    _exportConfig() {
        return {
            capitalInicial: config.capitalInicial,
            percentualEntrada: config.percentualEntrada,
            stopWinPerc: config.stopWinPerc,
            stopLossPerc: config.stopLossPerc,
            payout: config.payout,
            estrategiaAtiva: config.estrategiaAtiva,
            divisorRecuperacao: config.divisorRecuperacao,
            incorporarLucros: config.incorporarLucros,
            modoGuiado: config.modoGuiado,
            // Adicionar outras configs relevantes
        };
    }

    /**
     * Exporta sessão atual
     * @private
     */
    _exportCurrentSession() {
        if (!state.isSessionActive) {
            return null;
        }

        return {
            isActive: true,
            mode: state.sessionMode,
            capitalInicial: state.capitalInicioSessao,
            capitalAtual: state.capitalAtual,
            historico: state.historicoCombinado || [],
            plano: state.planoDeOperacoes || [],
            metaAtingida: state.metaAtingida,
            stopWinValor: state.stopWinValor,
            stopLossValor: state.stopLossValor
        };
    }

    /**
     * Exporta todas as sessões do IndexedDB
     * @private
     */
    async _exportAllSessions() {
        try {
            const sessions = await dbManager.getAllSessions();

            return sessions.map(session => ({
                id: session.id,
                data: session.data,
                modo: session.modo,
                capitalInicial: session.capitalInicial,
                capitalFinal: session.capitalFinal,
                resultadoFinanceiro: session.resultadoFinanceiro,
                historico: session.historicoCombinado || [],
                winRate: session.winRate,
                totalOperacoes: session.totalOperacoes,
                vitorias: session.vitorias,
                derrotas: session.derrotas
            }));

        } catch (error) {
            logger.warn('Erro ao buscar sessões do DB:', error);
            return [];
        }
    }

    /**
     * Exporta estatísticas gerais
     * @private
     */
    _exportStatistics() {
        return {
            totalSessions: state.historicoCombinado?.length || 0,
            currentCapital: state.capitalAtual,
            currentProfit: state.capitalAtual - config.capitalInicial,
            // Adicionar mais estatísticas conforme necessário
        };
    }

    /**
     * Converte dados para JSON
     * @param {Object} data - Dados a converter
     * @param {boolean} pretty - Se deve formatar bonito
     * @returns {string} JSON string
     */
    toJSON(data, pretty = true) {
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }

    /**
     * Cria nome de arquivo para download
     * @param {string} type - Tipo de exportação
     * @returns {string} Nome do arquivo
     */
    createFilename(type = 'full') {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');

        return `gerenciador-pro-${type}-${dateStr}_${timeStr}.json`;
    }

    /**
     * Download de dados como arquivo
     * @param {Object} data - Dados a baixar
     * @param {string} filename - Nome do arquivo
     */
    downloadAsFile(data, filename) {
        const json = this.toJSON(data);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);

        logger.info(`✅ Download iniciado: ${filename}`);
    }

    /**
     * Exporta e faz download completo
     */
    async exportAndDownload(type = 'full') {
        try {
            let data;
            let filename;

            switch (type) {
                case 'config':
                    data = this.exportConfig();
                    filename = this.createFilename('config');
                    break;

                case 'session':
                    data = this.exportCurrentSession();
                    filename = this.createFilename('session');
                    break;

                case 'sessions':
                    data = await this.exportAllSessions();
                    filename = this.createFilename('sessions');
                    break;

                default:
                    data = await this.exportAll();
                    filename = this.createFilename('full');
            }

            this.downloadAsFile(data, filename);

            return { success: true, filename };

        } catch (error) {
            logger.error('Erro ao exportar e baixar:', error);
            return { success: false, error: error.message };
        }
    }
}

// Singleton
export const dataExporter = new DataExporter();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.dataExporter = dataExporter;
}

export default dataExporter;
