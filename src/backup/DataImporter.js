/**
 * @fileoverview Importador de dados do sistema
 * Permite restaurar backups e importar dados
 */

import { state, config } from '../../state.js';
import { logger } from '../utils/Logger.js';
import { dbManager } from '../../db.js';
import { updateState } from '../utils/StateLoader.js';

/**
 * Importador de dados
 */
export class DataImporter {
    constructor() {
        this.version = '1.0.0';
    }

    /**
     * Importa arquivo JSON
     * @param {File} file - Arquivo a importar
     * @returns {Promise<Object>} Resultado da importação
     */
    async importFromFile(file) {
        logger.info('📥 Iniciando importação de arquivo...');

        try {
            const content = await this._readFile(file);
            const data = JSON.parse(content);

            // Validar estrutura
            this._validateImportData(data);

            // Processar importação
            const result = await this._processImport(data);

            logger.info('✅ Importação concluída com sucesso');
            return { success: true, ...result };

        } catch (error) {
            logger.error('Erro ao importar arquivo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Importa dados diretamente (de objeto)
     * @param {Object} data - Dados a importar
     * @returns {Promise<Object>} Resultado
     */
    async importData(data) {
        try {
            this._validateImportData(data);
            return await this._processImport(data);
        } catch (error) {
            logger.error('Erro ao importar dados:', error);
            throw error;
        }
    }

    /**
     * Restaura apenas configurações
     * @param {Object} configData - Configurações a restaurar
     */
    restoreConfig(configData) {
        logger.info('⚙️ Restaurando configurações...');

        try {
            if (!configData || typeof configData !== 'object') {
                throw new Error('Dados de configuração inválidos');
            }

            // Atualizar config
            Object.keys(configData).forEach(key => {
                if (key in config) {
                    config[key] = configData[key];
                }
            });

            // Usar StateLoader para persistir
            updateState(configData);

            logger.info('✅ Configurações restauradas');
            return { success: true };

        } catch (error) {
            logger.error('Erro ao restaurar configurações:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Restaura sessão
     * @param {Object} sessionData - Dados da sessão
     */
    restoreSession(sessionData) {
        logger.info('📊 Restaurando sessão...');

        try {
            if (!sessionData) {
                throw new Error('Dados de sessão inválidos');
            }

            // Restaurar estado da sessão
            state.isSessionActive = sessionData.isActive || false;
            state.sessionMode = sessionData.mode;
            state.capitalInicioSessao = sessionData.capitalInicial;
            state.capitalAtual = sessionData.capitalAtual;
            state.historicoCombinado = sessionData.historico || [];
            state.planoDeOperacoes = sessionData.plano || [];
            state.metaAtingida = sessionData.metaAtingida || false;
            state.stopWinValor = sessionData.stopWinValor;
            state.stopLossValor = sessionData.stopLossValor;

            // Salvar no localStorage
            if (state.isSessionActive && window.sessionManager) {
                window.sessionManager.saveActiveSession();
            }

            // Atualizar UI
            if (window.ui && window.ui.atualizarTudo) {
                window.ui.atualizarTudo();
            }

            logger.info('✅ Sessão restaurada');
            return { success: true };

        } catch (error) {
            logger.error('Erro ao restaurar sessão:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Importa sessões para o DB
     * @param {Array} sessions - Sessões a importar
     */
    async importSessions(sessions) {
        logger.info(`📚 Importando ${sessions.length} sessões...`);

        try {
            let imported = 0;
            let skipped = 0;

            for (const session of sessions) {
                try {
                    // Verificar se já existe
                    const exists = await dbManager.getSessionById(session.id);

                    if (exists) {
                        logger.debug(`Sessão ${session.id} já existe, pulando...`);
                        skipped++;
                        continue;
                    }

                    // Importar sessão
                    await dbManager.addSession({
                        id: session.id,
                        data: session.data,
                        modo: session.modo,
                        capitalInicial: session.capitalInicial,
                        capitalFinal: session.capitalFinal,
                        resultadoFinanceiro: session.resultadoFinanceiro,
                        historicoCombinado: session.historico,
                        winRate: session.winRate,
                        totalOperacoes: session.totalOperacoes,
                        vitorias: session.vitorias,
                        derrotas: session.derrotas
                    });

                    imported++;

                } catch (error) {
                    logger.warn(`Erro ao importar sessão ${session.id}:`, error);
                    skipped++;
                }
            }

            logger.info(`✅ Sessões importadas: ${imported}, Puladas: ${skipped}`);
            return { success: true, imported, skipped };

        } catch (error) {
            logger.error('Erro ao importar sessões:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lê arquivo
     * @private
     */
    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));

            reader.readAsText(file);
        });
    }

    /**
     * Valida dados de importação
     * @private
     */
    _validateImportData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados de importação inválidos');
        }

        if (!data.metadata) {
            throw new Error('Metadados ausentes');
        }

        // Validar versão (avisar se diferente)
        if (data.metadata.appVersion !== this.version) {
            logger.warn(`Versão diferente: ${data.metadata.appVersion} vs ${this.version}`);
        }

        return true;
    }

    /**
     * Processa importação
     * @private
     */
    async _processImport(data) {
        const results = {
            config: false,
            session: false,
            sessions: { imported: 0, skipped: 0 }
        };

        // Importar config
        if (data.config) {
            const configResult = this.restoreConfig(data.config);
            results.config = configResult.success;
        }

        // Importar sessão atual
        if (data.currentSession) {
            const sessionResult = this.restoreSession(data.currentSession);
            results.session = sessionResult.success;
        }

        // Importar todas as sessões
        if (data.sessions && Array.isArray(data.sessions)) {
            const sessionsResult = await this.importSessions(data.sessions);
            results.sessions = {
                imported: sessionsResult.imported || 0,
                skipped: sessionsResult.skipped || 0
            };
        }

        return results;
    }

    /**
     * Cria input para seleção de arquivo
     */
    createFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const result = await this.importFromFile(file);

                if (result.success) {
                    if (window.ui && window.ui.mostrarInsightPopup) {
                        window.ui.mostrarInsightPopup('Dados importados com sucesso!', '✅');
                    }
                } else {
                    if (window.ui && window.ui.showModal) {
                        window.ui.showModal({
                            title: 'Erro na Importação',
                            message: result.error
                        });
                    }
                }
            }

            // Remover input
            document.body.removeChild(input);
        });

        return input;
    }

    /**
     * Inicia processo de importação (abre seletor de arquivo)
     */
    startImport() {
        const input = this.createFileInput();
        document.body.appendChild(input);
        input.click();
    }
}

// Singleton
export const dataImporter = new DataImporter();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.dataImporter = dataImporter;
}

export default dataImporter;
