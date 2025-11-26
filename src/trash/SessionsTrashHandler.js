/**
 * 📊 SessionsTrashHandler - Gerenciador de Exclusão de Sessões
 * 
 * Implementa exclusão segura e restauração de sessões completas
 * com gerenciamento de conflitos e integridade de dados.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 5: Sessões Completas (Nível 3)
 */

'use strict';

/**
 * 📊 Classe para gerenciar exclusão de sessões
 */
class SessionsTrashHandler {
    constructor() {
        this.trashManager = null;
        this.isInitialized = false;

        this.init();
    }

    /**
     * 🚀 Inicializa o handler de sessões
     */
    init() {
        try {
            console.log('📊 Inicializando SessionsTrashHandler...');

            // Aguarda TrashManager estar disponível
            this.waitForTrashManager(() => {
                this.trashManager = window.trashManager;
                this.isInitialized = true;

                // Registra-se globalmente se ainda não estiver
                if (!window.sessionsTrashHandler) {
                    window.sessionsTrashHandler = this;
                }

                console.log('✅ SessionsTrashHandler inicializado');
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar SessionsTrashHandler:', error);
        }
    }

    /**
     * ⏳ Aguarda TrashManager estar disponível
     */
    waitForTrashManager(callback, maxAttempts = 50) {
        let attempts = 0;

        const check = () => {
            attempts++;

            if (window.trashManager && window.trashManager.isInitialized) {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.warn('⚠️ Timeout aguardando TrashManager para sessões');
                // Tenta inicializar mesmo assim, pode ser que o TrashManager carregue depois
                callback();
            }
        };

        check();
    }

    /**
     * 🗑️ Move sessão para a lixeira
     * @param {Object} session - Objeto da sessão a ser excluída
     * @returns {boolean} Sucesso da operação
     */
    async moveToTrash(session) {
        try {
            if (!this.trashManager) {
                throw new Error('TrashManager não disponível');
            }

            console.log('🗑️ Movendo sessão para lixeira:', session);

            // Prepara dados da sessão para backup
            const sessionData = {
                ...session,
                originalId: session.id || session.data || Date.now().toString(),
                deletionContext: {
                    wasActive: session.isActive || false,
                    timestamp: new Date().toISOString()
                }
            };

            // Move para lixeira
            const trashId = this.trashManager.moveToTrash(
                sessionData,
                this.trashManager.categories.SESSION,
                this.trashManager.complexityLevels.COMPLEX
            );

            if (trashId) {
                // Remove do estado/banco de dados
                await this.removeSessionFromSystem(session);

                this.showNotification('Sessão movida para lixeira', 'success');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Erro ao mover sessão para lixeira:', error);
            this.showNotification('Erro ao excluir sessão', 'error');
            return false;
        }
    }

    /**
     * 🗑️ Remove sessão do sistema (Estado e DB)
     */
    async removeSessionFromSystem(session) {
        try {
            // 1. Remove do Estado Global (window.state)
            if (window.state && window.state.historicoSessao) {
                const index = window.state.historicoSessao.findIndex(s => s.id === session.id || s.data === session.data);
                if (index !== -1) {
                    window.state.historicoSessao.splice(index, 1);
                    console.log('🗑️ Sessão removida do histórico local');
                }
            }

            // 2. Remove do Banco de Dados (via dbManager)
            if (window.dbManager && window.dbManager.deleteSession) {
                await window.dbManager.deleteSession(session.id);
                console.log('🗑️ Sessão removida do banco de dados');
            }

            // 3. Se for a sessão ativa, limpa o estado atual
            if (session.isActive && window.state) {
                window.state.isSessionActive = false;
                window.state.historicoCombinado = []; // Limpa operações da sessão atual
                // Mantém capital atual ou reseta? Geralmente mantém o último estado válido.
                console.log('🗑️ Sessão ativa encerrada forçadamente');
            }

            // 4. Atualiza UI
            this.updateUI();

        } catch (error) {
            console.error('❌ Erro ao remover sessão do sistema:', error);
            throw error;
        }
    }

    /**
     * ↩️ Restaura sessão para o estado
     * @param {Object} sessionData - Dados da sessão recuperados da lixeira
     */
    async restoreSessionToState(sessionData) {
        try {
            console.log('📊 Restaurando sessão:', sessionData);

            if (!window.state) {
                throw new Error('Estado da aplicação não disponível');
            }

            // Verifica conflito com sessão ativa se a restaurada era ativa
            if (sessionData.deletionContext?.wasActive) {
                if (window.state.isSessionActive) {
                    const confirmReplace = confirm('Há uma sessão ativa no momento. Deseja substituí-la pela sessão restaurada? A sessão atual será salva no histórico.');
                    if (confirmReplace) {
                        // Salva sessão atual antes de substituir
                        if (window.ui && window.ui.salvarSessao) {
                            await window.ui.salvarSessao();
                        }
                        this.restoreAsActiveSession(sessionData);
                    } else {
                        // Restaura como histórico
                        await this.restoreAsArchivedSession(sessionData);
                    }
                } else {
                    this.restoreAsActiveSession(sessionData);
                }
            } else {
                // Restaura como histórico
                await this.restoreAsArchivedSession(sessionData);
            }

            this.showNotification('Sessão restaurada com sucesso', 'success');
            return true;

        } catch (error) {
            console.error('❌ Erro ao restaurar sessão:', error);
            this.showNotification('Erro ao restaurar sessão: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * ↩️ Restaura como sessão ativa
     */
    restoreAsActiveSession(sessionData) {
        console.log('🔄 Restaurando como sessão ativa...');

        // Reconstrói o estado da sessão ativa
        window.state.isSessionActive = true;
        window.state.sessionMode = sessionData.sessionMode || 'oficial';
        window.state.capitalInicioSessao = sessionData.capitalInicial || 0;
        window.state.capitalAtual = sessionData.capitalAtual || sessionData.capitalInicial || 0;
        window.state.historicoCombinado = sessionData.historicoCombinado || [];
        window.state.planoDeOperacoes = sessionData.planoDeOperacoes || [];

        // Metadados
        window.state.startTime = sessionData.startTime || Date.now();

        // Atualiza UI
        this.updateUI();

        console.log('✅ Sessão ativa restaurada');
    }

    /**
     * ↩️ Restaura como sessão arquivada (histórico)
     */
    async restoreAsArchivedSession(sessionData) {
        console.log('🔄 Restaurando como sessão arquivada...');

        // Limpa dados de contexto de exclusão para não poluir o objeto
        const cleanSession = { ...sessionData };
        delete cleanSession.originalId;
        delete cleanSession.deletionContext;
        delete cleanSession.complexityLevel;
        delete cleanSession.category;

        // 1. Adiciona ao Estado Global
        if (!window.state.historicoSessao) {
            window.state.historicoSessao = [];
        }

        // Verifica duplicidade
        const exists = window.state.historicoSessao.some(s => s.id === cleanSession.id);
        if (!exists) {
            window.state.historicoSessao.push(cleanSession);
            // Ordena por data (mais recente primeiro)
            window.state.historicoSessao.sort((a, b) => new Date(b.data) - new Date(a.data));
        }

        // 2. Salva no Banco de Dados
        if (window.dbManager) {
            if (window.dbManager.updateSession) {
                // updateSession usa put, que funciona como upsert (insere ou atualiza)
                await window.dbManager.updateSession(cleanSession);
            } else if (window.dbManager.addSession) {
                await window.dbManager.addSession(cleanSession);
            }
        }

        // Atualiza UI (recarrega lista de sessões)
        this.updateUI();

        console.log('✅ Sessão arquivada restaurada');
    }

    /**
     * 🎨 Atualiza interface
     */
    updateUI() {
        try {
            // Atualiza Dashboard
            if (window.ui && window.ui.atualizarDashboardSessao) {
                window.ui.atualizarDashboardSessao();
            }

            // Atualiza Lista de Sessões (se houver função para isso)
            // Geralmente ui.renderizarHistoricoSessoes ou similar
            if (window.ui && window.ui.renderizarHistorico) {
                window.ui.renderizarHistorico();
            } else {
                // Tenta recarregar a página se não houver método específico, 
                // ou dispara evento para componentes ouvirem
                document.dispatchEvent(new CustomEvent('sessionHistoryUpdated'));
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar UI de sessões:', error);
        }
    }

    /**
     * 📢 Mostra notificação
     */
    showNotification(message, type = 'info') {
        try {
            if (window.tagsTrashHandler && window.tagsTrashHandler.showNotification) {
                window.tagsTrashHandler.showNotification(message, type);
            } else {
                console.log(`📢 ${type.toUpperCase()}: ${message}`);
                // Fallback simples alert se for erro crítico
                if (type === 'error') alert(message);
            }
        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);
        }
    }
}

// Instância singleton
let sessionsTrashHandlerInstance = null;

/**
 * 🏭 Factory function para obter instância
 */
function getSessionsTrashHandler() {
    if (!sessionsTrashHandlerInstance) {
        sessionsTrashHandlerInstance = new SessionsTrashHandler();
    }
    return sessionsTrashHandlerInstance;
}

// Exposição global imediata
if (typeof window !== 'undefined') {
    window.SessionsTrashHandler = SessionsTrashHandler;
    window.getSessionsTrashHandler = getSessionsTrashHandler;
    // Instancia automaticamente para garantir disponibilidade
    window.sessionsTrashHandler = getSessionsTrashHandler();
    console.log('📊 SessionsTrashHandler registrado globalmente');
}

export { SessionsTrashHandler, getSessionsTrashHandler };
export default SessionsTrashHandler;
