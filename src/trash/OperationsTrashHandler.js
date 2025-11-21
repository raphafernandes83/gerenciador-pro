/**
 * 🔄 OperationsTrashHandler - Gerenciador de Exclusão de Operações
 * 
 * Implementa exclusão segura e restauração de operações individuais
 * com recálculo automático do estado da aplicação.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 4: Operações Individuais (Nível 2)
 */

'use strict';

/**
 * 🔄 Classe para gerenciar exclusão de operações
 */
class OperationsTrashHandler {
    constructor() {
        this.trashManager = null;
        this.isInitialized = false;
        
        // Referências aos elementos da timeline
        this.timelineContainer = null;
        
        // Cache de operações para recálculo
        this.operationsCache = new Map();
        
        this.init();
    }
    
    /**
     * 🚀 Inicializa o handler de operações
     */
    init() {
        try {
            console.log('🔄 Inicializando OperationsTrashHandler...');
            
            // Aguarda TrashManager estar disponível
            this.waitForTrashManager(() => {
                this.trashManager = window.trashManager;
                this.setupOperationsDeletion();
                this.isInitialized = true;
                console.log('✅ OperationsTrashHandler inicializado');
            });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar OperationsTrashHandler:', error);
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
                console.warn('⚠️ Timeout aguardando TrashManager para operações');
            }
        };
        
        check();
    }
    
    /**
     * 🔧 Configura sistema de exclusão de operações
     */
    setupOperationsDeletion() {
        try {
            // Encontra container da timeline
            this.findTimelineContainer();
            
            // Adiciona botões de exclusão às operações existentes
            this.addDeleteButtonsToExistingOperations();
            
            // Monitora criação de novas operações
            this.monitorNewOperations();
            
            console.log('🔧 Sistema de exclusão de operações configurado');
            
        } catch (error) {
            console.error('❌ Erro ao configurar exclusão de operações:', error);
        }
    }
    
    /**
     * 🔍 Encontra container da timeline no DOM
     */
    findTimelineContainer() {
        // Procura por container da timeline
        this.timelineContainer = document.getElementById('timeline-container');
        
        if (!this.timelineContainer) {
            console.log('ℹ️ Container da timeline não encontrado - será monitorado');
        } else {
            console.log('✅ Container da timeline encontrado');
        }
    }
    
    /**
     * ➕ Adiciona botões de exclusão às operações existentes
     */
    addDeleteButtonsToExistingOperations() {
        if (!this.timelineContainer) return;
        
        const existingOperations = this.timelineContainer.querySelectorAll('.timeline-item');
        
        existingOperations.forEach(operationElement => {
            if (!operationElement.querySelector('.operation-delete-btn')) {
                this.addDeleteButtonToOperation(operationElement);
            }
        });
        
        console.log(`🔄 Botões de exclusão adicionados a ${existingOperations.length} operações`);
    }
    
    /**
     * 👁️ Monitora criação de novas operações
     */
    monitorNewOperations() {
        // Observer para mudanças no container da timeline
        if (this.timelineContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('timeline-item')) {
                                // Aguarda um pouco para garantir que o elemento está completamente renderizado
                                setTimeout(() => {
                                    this.addDeleteButtonToOperation(node);
                                }, 100);
                            }
                        });
                    }
                });
            });
            
            observer.observe(this.timelineContainer, {
                childList: true,
                subtree: true
            });
        }
        
        // Observer para quando a timeline aparecer
        const bodyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const timelineContainer = node.querySelector('#timeline-container');
                            if (timelineContainer && !this.timelineContainer) {
                                this.timelineContainer = timelineContainer;
                                this.addDeleteButtonsToExistingOperations();
                                this.monitorNewOperations();
                            }
                        }
                    });
                }
            });
        });
        
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 🔄 Adiciona botão de exclusão a uma operação
     */
    addDeleteButtonToOperation(operationElement) {
        try {
            // Verifica se já tem botão
            if (operationElement.querySelector('.operation-delete-btn')) {
                return;
            }
            
            // Obtém índice da operação
            const operationIndex = operationElement.dataset.opIndex;
            if (operationIndex === undefined) {
                console.warn('⚠️ Operação sem índice, não é possível adicionar botão de exclusão');
                return;
            }
            
            // Cria botão de exclusão
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'operation-delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Excluir operação';
            deleteBtn.setAttribute('aria-label', 'Excluir esta operação');
            deleteBtn.dataset.operationIndex = operationIndex;
            
            // Estilo do botão
            deleteBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                border: 1px solid #ef4444;
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                font-size: 12px;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10;
                transition: all 0.2s ease;
                backdrop-filter: blur(4px);
            `;
            
            // Adiciona posicionamento relativo ao elemento se necessário
            if (getComputedStyle(operationElement).position === 'static') {
                operationElement.style.position = 'relative';
            }
            
            // Event listeners
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.confirmOperationDeletion(operationElement, operationIndex);
            });
            
            // Hover effects no botão
            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = '#ef4444';
                deleteBtn.style.color = 'white';
            });
            
            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = 'rgba(239, 68, 68, 0.1)';
                deleteBtn.style.color = '#ef4444';
            });
            
            // Mostra/esconde botão no hover da operação
            operationElement.addEventListener('mouseenter', () => {
                deleteBtn.style.display = 'flex';
            });
            
            operationElement.addEventListener('mouseleave', () => {
                deleteBtn.style.display = 'none';
            });
            
            // Adiciona botão ao elemento
            operationElement.appendChild(deleteBtn);
            
        } catch (error) {
            console.error('❌ Erro ao adicionar botão de exclusão à operação:', error);
        }
    }
    
    /**
     * ❓ Confirma exclusão da operação
     */
    confirmOperationDeletion(operationElement, operationIndex) {
        try {
            // Obtém dados da operação do estado global
            const operation = this.getOperationByIndex(operationIndex);
            
            if (!operation) {
                console.error('❌ Operação não encontrada no índice:', operationIndex);
                this.showNotification('Operação não encontrada', 'error');
                return;
            }
            
            const operationDescription = this.getOperationDescription(operation);
            
            // Cria modal de confirmação
            const confirmModal = this.createConfirmationModal(
                'Excluir Operação',
                `Tem certeza que deseja excluir esta operação?\n\n${operationDescription}\n\nEsta ação irá recalcular automaticamente todos os valores.`,
                () => this.deleteOperation(operation, operationIndex),
                () => console.log('Exclusão cancelada')
            );
            
            document.body.appendChild(confirmModal);
            confirmModal.classList.add('open');
            
        } catch (error) {
            console.error('❌ Erro ao confirmar exclusão da operação:', error);
        }
    }
    
    /**
     * 📋 Obtém operação por índice
     */
    getOperationByIndex(index) {
        try {
            const historico = window.state?.historicoCombinado || [];
            return historico[parseInt(index)] || null;
        } catch (error) {
            console.error('❌ Erro ao obter operação por índice:', error);
            return null;
        }
    }
    
    /**
     * 📝 Obtém descrição da operação
     */
    getOperationDescription(operation) {
        try {
            const isWin = operation.isWin ? 'WIN' : 'LOSS';
            const valor = operation.valor || operation.resultado || 0;
            const valorFormatted = this.formatCurrency(Math.abs(valor));
            const tag = operation.tag || 'Sem tag';
            const timestamp = operation.timestamp || 'Data não informada';
            
            return `${isWin}: ${valor >= 0 ? '+' : '-'} ${valorFormatted}\nTag: ${tag}\nData: ${timestamp}`;
        } catch (error) {
            console.error('❌ Erro ao obter descrição da operação:', error);
            return 'Operação não identificada';
        }
    }
    
    /**
     * 💰 Formata valor monetário
     */
    formatCurrency(value) {
        try {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        } catch (error) {
            return `R$ ${value.toFixed(2)}`;
        }
    }
    
    /**
     * 🗑️ Exclui operação
     */
    deleteOperation(operation, operationIndex) {
        try {
            console.log(`🗑️ Excluindo operação:`, operation);
            
            // Cria backup da operação com contexto completo
            const operationData = {
                ...operation,
                originalIndex: parseInt(operationIndex),
                deletionContext: {
                    capitalAnterior: window.state?.capitalAtual || 0,
                    historicoCompleto: [...(window.state?.historicoCombinado || [])],
                    timestamp: new Date().toISOString()
                }
            };
            
            // Move para lixeira
            const trashId = this.trashManager.moveToTrash(
                operationData,
                this.trashManager.categories.OPERATION,
                this.trashManager.complexityLevels.COMPLEX
            );
            
            if (trashId) {
                // Remove operação do estado
                this.removeOperationFromState(operationIndex);
                
                // Recalcula estado da aplicação
                this.recalculateApplicationState();
                
                // Atualiza interface
                this.updateUI();
                
                // Mostra notificação de sucesso
                this.showNotification('Operação movida para lixeira', 'success');
                
                console.log(`✅ Operação excluída: ${trashId}`);
            } else {
                throw new Error('Falha ao mover operação para lixeira');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir operação:', error);
            this.showNotification('Erro ao excluir operação', 'error');
        }
    }
    
    /**
     * 🗑️ Remove operação do estado
     */
    removeOperationFromState(operationIndex) {
        try {
            const index = parseInt(operationIndex);
            
            if (window.state && Array.isArray(window.state.historicoCombinado)) {
                // Remove operação do histórico
                window.state.historicoCombinado.splice(index, 1);
                
                console.log(`🗑️ Operação removida do estado no índice ${index}`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover operação do estado:', error);
        }
    }
    
    /**
     * 🔄 Recalcula estado da aplicação
     */
    recalculateApplicationState() {
        try {
            console.log('🔄 Recalculando estado da aplicação...');
            
            if (!window.state || !Array.isArray(window.state.historicoCombinado)) {
                console.warn('⚠️ Estado não disponível para recálculo');
                return;
            }
            
            // Obtém capital inicial da sessão
            const capitalInicial = window.state.capitalInicioSessao || window.state.capitalInicial || 0;
            
            // Recalcula capital atual baseado no histórico
            let capitalRecalculado = capitalInicial;
            
            window.state.historicoCombinado.forEach(operacao => {
                const valor = operacao.valor || operacao.resultado || 0;
                capitalRecalculado += valor;
            });
            
            // Atualiza capital atual
            const capitalAnterior = window.state.capitalAtual;
            window.state.capitalAtual = capitalRecalculado;
            
            console.log('🔄 Recálculo concluído:', {
                capitalAnterior,
                capitalRecalculado,
                diferenca: capitalRecalculado - capitalAnterior,
                operacoesRestantes: window.state.historicoCombinado.length
            });
            
        } catch (error) {
            console.error('❌ Erro ao recalcular estado:', error);
        }
    }
    
    /**
     * 🎨 Atualiza interface
     */
    updateUI() {
        try {
            console.log('🎨 Atualizando interface após exclusão...');
            
            // Atualiza timeline
            if (window.ui && window.ui.renderizarTimelineCompleta) {
                window.ui.renderizarTimelineCompleta();
            }
            
            // Atualiza dashboard
            if (window.ui && window.ui.atualizarDashboardSessao) {
                window.ui.atualizarDashboardSessao();
            }
            
            // Atualiza plano visual
            if (window.ui && window.ui.atualizarVisualPlano) {
                window.ui.atualizarVisualPlano();
            }
            
            // Força atualização dos gráficos
            if (window.logic && window.logic.updateProgressCharts) {
                window.logic.updateProgressCharts();
            }
            
            console.log('✅ Interface atualizada');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar interface:', error);
        }
    }
    
    /**
     * ↩️ Restaura operação da lixeira
     */
    restoreOperation(trashItemId) {
        try {
            console.log(`↩️ Restaurando operação: ${trashItemId}`);
            
            const restored = this.trashManager.restoreFromTrash(trashItemId);
            
            if (restored && restored.success) {
                const operationData = restored.item;
                
                // Restaura operação no estado
                this.restoreOperationToState(operationData);
                
                // Recalcula estado
                this.recalculateApplicationState();
                
                // Atualiza interface
                this.updateUI();
                
                this.showNotification('Operação restaurada com sucesso', 'success');
                console.log(`✅ Operação restaurada: ${operationData.id}`);
                
                return true;
            } else {
                throw new Error('Falha ao restaurar operação');
            }
            
        } catch (error) {
            console.error('❌ Erro ao restaurar operação:', error);
            this.showNotification('Erro ao restaurar operação', 'error');
            return false;
        }
    }
    
    /**
     * ↩️ Restaura operação no estado
     */
    restoreOperationToState(operationData) {
        try {
            if (!window.state) {
                throw new Error('Estado não disponível');
            }
            
            // Garante que o histórico existe
            if (!Array.isArray(window.state.historicoCombinado)) {
                window.state.historicoCombinado = [];
            }
            
            // Remove dados específicos da exclusão
            const cleanOperation = { ...operationData };
            delete cleanOperation.originalIndex;
            delete cleanOperation.deletionContext;
            
            // Verifica se tem contexto de sessão (novo sistema)
            const sessionContext = operationData.sessionContext;
            if (sessionContext) {
                delete cleanOperation.sessionContext;
                
                if (sessionContext.isActive) {
                    // Restaura para sessão ativa
                    const targetIndex = sessionContext.operationIndex;
                    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= window.state.historicoCombinado.length) {
                        window.state.historicoCombinado.splice(targetIndex, 0, cleanOperation);
                    } else {
                        window.state.historicoCombinado.push(cleanOperation);
                    }
                } else {
                    // Para sessões arquivadas, delega para método específico
                    this.restoreToArchivedSession(cleanOperation, sessionContext);
                    return; // Sai aqui para não processar como sessão ativa
                }
            } else {
                // Fallback: usa índice original (sistema antigo)
                const originalIndex = operationData.originalIndex;
                if (originalIndex !== undefined && originalIndex >= 0 && originalIndex <= window.state.historicoCombinado.length) {
                    window.state.historicoCombinado.splice(originalIndex, 0, cleanOperation);
                } else {
                    window.state.historicoCombinado.push(cleanOperation);
                }
            }
            
            console.log(`↩️ Operação restaurada no estado: ${cleanOperation.id}`);
            
        } catch (error) {
            console.error('❌ Erro ao restaurar operação no estado:', error);
            throw error;
        }
    }
    
    /**
     * ↩️ Restaura operação para sessão arquivada
     */
    async restoreToArchivedSession(operationData, sessionContext) {
        try {
            if (!sessionContext.sessionId || !window.dbManager) {
                throw new Error('Contexto de sessão inválido ou dbManager não disponível');
            }
            
            const session = await window.dbManager.getSessionById(sessionContext.sessionId);
            if (!session) {
                throw new Error(`Sessão ${sessionContext.sessionId} não encontrada`);
            }
            
            if (!Array.isArray(session.historicoCombinado)) {
                session.historicoCombinado = [];
            }
            
            // Restaura na posição original se possível
            const targetIndex = sessionContext.operationIndex;
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= session.historicoCombinado.length) {
                session.historicoCombinado.splice(targetIndex, 0, operationData);
            } else {
                session.historicoCombinado.push(operationData);
            }
            
            // Recalcula resultado financeiro
            session.resultadoFinanceiro = session.historicoCombinado.reduce(
                (acc, op) => acc + (Number(op.valor) || 0), 0
            );
            
            // Atualiza sessão na base de dados
            await window.dbManager.updateSession(session);
            
            console.log(`✅ Operação restaurada na sessão arquivada: ${sessionContext.sessionId}`);
            
        } catch (error) {
            console.error('❌ Erro ao restaurar operação na sessão arquivada:', error);
            throw error;
        }
    }
    
    /**
     * 📢 Mostra notificação
     */
    showNotification(message, type = 'info') {
        try {
            // Usa o sistema de notificação do TagsTrashHandler se disponível
            if (window.tagsTrashHandler && window.tagsTrashHandler.showNotification) {
                window.tagsTrashHandler.showNotification(message, type);
                return;
            }
            
            // Fallback para notificação simples
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);
        }
    }
    
    /**
     * ❓ Cria modal de confirmação
     */
    createConfirmationModal(title, message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 2500;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="confirmation-modal-content" style="
                background: var(--bg-primary, #ffffff);
                border-radius: 12px;
                padding: 24px;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <h3 style="margin: 0 0 12px; color: var(--text-primary, #111827);">${title}</h3>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #6b7280); white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="cancel-btn" style="
                        padding: 8px 16px;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 6px;
                        background: transparent;
                        color: var(--text-primary, #111827);
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Cancelar</button>
                    <button class="confirm-btn" style="
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: #ef4444;
                        color: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Excluir</button>
                </div>
            </div>
        `;
        
        // Event listeners
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        const closeModal = () => {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                if (onCancel) onCancel();
            }
        });
        
        // Estilo para modal aberto
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.querySelector('.confirmation-modal-content').style.transform = 'scale(1)';
        }, 100);
        
        return modal;
    }
    
    /**
     * 🧪 Função de teste
     */
    test() {
        console.log('🧪 Testando OperationsTrashHandler...');
        
        try {
            const tests = {
                initialized: this.isInitialized,
                hasTrashManager: !!this.trashManager,
                hasTimelineContainer: !!this.timelineContainer,
                canAccessState: !!(window.state && window.state.historicoCombinado),
                canRecalculate: typeof this.recalculateApplicationState === 'function',
                canUpdateUI: typeof this.updateUI === 'function'
            };
            
            const allTestsPass = Object.values(tests).every(Boolean);
            
            console.log(allTestsPass ? '✅ Todos os testes de operações passaram!' : '❌ Alguns testes falharam:', tests);
            
            return { tests, allTestsPass };
            
        } catch (error) {
            console.error('❌ Erro nos testes de operações:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton
let operationsTrashHandlerInstance = null;

/**
 * 🏭 Factory function para obter instância do OperationsTrashHandler
 */
function getOperationsTrashHandler() {
    if (!operationsTrashHandlerInstance) {
        operationsTrashHandlerInstance = new OperationsTrashHandler();
    }
    return operationsTrashHandlerInstance;
}

// Exposição global
if (typeof window !== 'undefined') {
    window.OperationsTrashHandler = OperationsTrashHandler;
    window.getOperationsTrashHandler = getOperationsTrashHandler;
    
    console.log('🔄 OperationsTrashHandler disponível globalmente');
}

export { OperationsTrashHandler, getOperationsTrashHandler };
export default OperationsTrashHandler;
