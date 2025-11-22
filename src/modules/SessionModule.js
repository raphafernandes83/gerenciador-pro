/**
 * 🎯 SESSION MODULE
 * Gerencia lifecycle de sessões de trading
 * 
 * @module SessionModule
 * @since Fase 3 - Checkpoint 3.2
 */

import BaseModule from './BaseModule.js';

export class SessionModule extends BaseModule {
    constructor() {
        super('SessionModule');
        this.currentSession = null;
        this.sessionHistory = [];
    }

    /**
     * Inicialização do módulo
     */
    async init() {
        await super.init();

        // Registra dependências necessárias
        this.stateManager = this.getDependency('stateManager');

        console.log('✅ SessionModule inicializado');
    }

    /**
     * Inicia nova sessão
     * @param {Object} config - Configuração da sessão
     * @returns {Object} Sessão criada
     */
    startSession(config = {}) {
        if (this.currentSession) {
            throw new Error('Já existe uma sessão ativa');
        }

        const session = {
            id: this._generateSessionId(),
            mode: config.mode || 'practice',
            startTime: Date.now(),
            startCapital: config.startCapital || 0,
            currentCapital: config.startCapital || 0,
            operations: [],
            status: 'active',
            metadata: {
                createdAt: new Date().toISOString(),
                ...config.metadata
            }
        };

        this.currentSession = session;

        // Atualiza state manager
        if (this.stateManager) {
            this.stateManager.setState({
                isSessionActive: true,
                sessionMode: session.mode,
                capitalInicioSessao: session.startCapital,
                capitalAtual: session.currentCapital
            }, 'SessionModule.startSession');
        }

        console.log('🎯 Sessão iniciada:', session.id);
        return session;
    }

    /**
     * Finaliza sessão atual
     * @returns {Object} Sessão finalizada
     */
    finishSession() {
        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const session = this.currentSession;
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        session.status = 'finished';

        // Calcula resultados
        session.results = this._calculateSessionResults(session);

        // Salva no histórico
        this.sessionHistory.push({ ...session });

        // Limpa sessão atual
        this.currentSession = null;

        // Atualiza state manager
        if (this.stateManager) {
            this.stateManager.setState({
                isSessionActive: false
            }, 'SessionModule.finishSession');
        }

        console.log('🏁 Sessão finalizada:', session.id);
        return session;
    }

    /**
     * Reseta sessão atual (sem salvar)
     */
    resetSession() {
        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const sessionId = this.currentSession.id;
        this.currentSession = null;

        // Atualiza state manager
        if (this.stateManager) {
            this.stateManager.setState({
                isSessionActive: false
            }, 'SessionModule.resetSession');
        }

        console.log('🔄 Sessão resetada:', sessionId);
    }

    /**
     * Adiciona operação à sessão
     * @param {Object} operation - Dados da operação
     */
    addOperation(operation) {
        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const op = {
            id: this._generateOperationId(),
            timestamp: Date.now(),
            ...operation
        };

        this.currentSession.operations.push(op);

        // Atualiza capital
        if (typeof operation.value === 'number') {
            this.currentSession.currentCapital += operation.value;

            if (this.stateManager) {
                this.stateManager.setState({
                    capitalAtual: this.currentSession.currentCapital
                }, 'SessionModule.addOperation');
            }
        }

        return op;
    }

    /**
     * Retorna sessão atual
     */
    getCurrentSession() {
        return this.currentSession ? { ...this.currentSession } : null;
    }

    /**
     * Retorna histórico de sessões
     */
    getSessionHistory() {
        return [...this.sessionHistory];
    }

    /**
     * Verifica se há sessão ativa
     */
    isSessionActive() {
        return this.currentSession !== null;
    }

    /**
     * Retorna estatísticas da sessão atual
     */
    getCurrentStats() {
        if (!this.currentSession) {
            return null;
        }

        return this._calculateSessionResults(this.currentSession);
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Gera ID único para sessão
     */
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gera ID único para operação
     */
    _generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calcula resultados da sessão
     */
    _calculateSessionResults(session) {
        const operations = session.operations || [];

        const wins = operations.filter(op => op.isWin).length;
        const losses = operations.filter(op => !op.isWin).length;
        const total = operations.length;

        const profit = session.currentCapital - session.startCapital;
        const profitPercent = session.startCapital > 0
            ? (profit / session.startCapital) * 100
            : 0;

        return {
            totalOperations: total,
            wins,
            losses,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            profit,
            profitPercent,
            finalCapital: session.currentCapital
        };
    }

    /**
     * Cleanup do módulo
     */
    destroy() {
        this.currentSession = null;
        this.sessionHistory = [];
        super.destroy();
    }

    /**
     * Informações do módulo
     */
    getInfo() {
        return {
            ...super.getInfo(),
            hasActiveSession: this.isSessionActive(),
            sessionHistoryCount: this.sessionHistory.length,
            currentSessionOperations: this.currentSession?.operations.length || 0
        };
    }
}

export default SessionModule;
