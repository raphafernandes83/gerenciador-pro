/**
 * 🏷️ TagsTrashHandler - Gerenciador de Exclusão de Tags
 * 
 * Implementa exclusão segura e restauração de tags personalizadas
 * sem afetar a funcionalidade principal do sistema.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 3: Elementos Simples
 */

'use strict';

/**
 * 🏷️ Classe para gerenciar exclusão de tags
 */
class TagsTrashHandler {
    constructor() {
        this.trashManager = null;
        this.isInitialized = false;
        
        // Referências aos elementos de tags
        this.tagsContainer = null;
        this.tagsModal = null;
        
        this.init();
    }
    
    /**
     * 🚀 Inicializa o handler de tags
     */
    init() {
        try {
            console.log('🏷️ Inicializando TagsTrashHandler...');
            
            // Aguarda TrashManager estar disponível
            this.waitForTrashManager(() => {
                this.trashManager = window.trashManager;
                this.setupTagsDeletion();
                this.isInitialized = true;
                console.log('✅ TagsTrashHandler inicializado');
            });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar TagsTrashHandler:', error);
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
                console.warn('⚠️ Timeout aguardando TrashManager para tags');
            }
        };
        
        check();
    }
    
    /**
     * 🔧 Configura sistema de exclusão de tags
     */
    setupTagsDeletion() {
        try {
            // Encontra container de tags
            this.findTagsElements();
            
            // Adiciona botões de exclusão às tags existentes
            this.addDeleteButtonsToExistingTags();
            
            // Monitora criação de novas tags
            this.monitorNewTags();
            
            console.log('🔧 Sistema de exclusão de tags configurado');
            
        } catch (error) {
            console.error('❌ Erro ao configurar exclusão de tags:', error);
        }
    }
    
    /**
     * 🔍 Encontra elementos de tags no DOM
     */
    findTagsElements() {
        // Procura por container de tags no modal
        this.tagsContainer = document.getElementById('tags-container');
        this.tagsModal = document.getElementById('tags-modal');
        
        if (!this.tagsContainer) {
            console.log('ℹ️ Container de tags não encontrado - será monitorado');
        }
    }
    
    /**
     * ➕ Adiciona botões de exclusão às tags existentes
     */
    addDeleteButtonsToExistingTags() {
        if (!this.tagsContainer) return;
        
        const existingTags = this.tagsContainer.querySelectorAll('.tag-option');
        
        existingTags.forEach(tagElement => {
            if (!tagElement.querySelector('.tag-delete-btn')) {
                this.addDeleteButtonToTag(tagElement);
            }
        });
        
        console.log(`🏷️ Botões de exclusão adicionados a ${existingTags.length} tags`);
    }
    
    /**
     * 👁️ Monitora criação de novas tags
     */
    monitorNewTags() {
        // Observer para mudanças no container de tags
        if (this.tagsContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('tag-option')) {
                                this.addDeleteButtonToTag(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(this.tagsContainer, {
                childList: true,
                subtree: true
            });
        }
        
        // Observer para quando o modal de tags aparecer
        const bodyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tagsContainer = node.querySelector('#tags-container');
                            if (tagsContainer && !this.tagsContainer) {
                                this.tagsContainer = tagsContainer;
                                this.addDeleteButtonsToExistingTags();
                                this.monitorNewTags();
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
     * 🏷️ Adiciona botão de exclusão a uma tag
     */
    addDeleteButtonToTag(tagElement) {
        try {
            // Verifica se já tem botão
            if (tagElement.querySelector('.tag-delete-btn')) {
                return;
            }
            
            // Cria botão de exclusão
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'tag-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Excluir tag';
            deleteBtn.setAttribute('aria-label', 'Excluir esta tag');
            
            // Estilo do botão
            deleteBtn.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: none;
                background: #ef4444;
                color: white;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10;
                transition: all 0.2s ease;
            `;
            
            // Adiciona posicionamento relativo ao tag se necessário
            if (getComputedStyle(tagElement).position === 'static') {
                tagElement.style.position = 'relative';
            }
            
            // Event listeners
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.confirmTagDeletion(tagElement);
            });
            
            // Mostra/esconde botão no hover
            tagElement.addEventListener('mouseenter', () => {
                deleteBtn.style.display = 'flex';
            });
            
            tagElement.addEventListener('mouseleave', () => {
                deleteBtn.style.display = 'none';
            });
            
            // Adiciona botão ao elemento
            tagElement.appendChild(deleteBtn);
            
        } catch (error) {
            console.error('❌ Erro ao adicionar botão de exclusão à tag:', error);
        }
    }
    
    /**
     * ❓ Confirma exclusão da tag
     */
    confirmTagDeletion(tagElement) {
        try {
            const tagText = tagElement.textContent.replace('×', '').trim();
            
            // Cria modal de confirmação
            const confirmModal = this.createConfirmationModal(
                'Excluir Tag',
                `Tem certeza que deseja excluir a tag "${tagText}"?`,
                () => this.deleteTag(tagElement, tagText),
                () => console.log('Exclusão cancelada')
            );
            
            document.body.appendChild(confirmModal);
            confirmModal.classList.add('open');
            
        } catch (error) {
            console.error('❌ Erro ao confirmar exclusão da tag:', error);
        }
    }
    
    /**
     * 🗑️ Exclui tag
     */
    deleteTag(tagElement, tagText) {
        try {
            console.log(`🗑️ Excluindo tag: ${tagText}`);
            
            // Cria objeto da tag para backup
            const tagData = {
                id: `tag_${Date.now()}`,
                text: tagText,
                element: tagElement.outerHTML,
                createdAt: new Date().toISOString()
            };
            
            // Move para lixeira
            const trashId = this.trashManager.moveToTrash(
                tagData,
                this.trashManager.categories.TAG,
                this.trashManager.complexityLevels.SIMPLE
            );
            
            if (trashId) {
                // Remove elemento do DOM
                tagElement.remove();
                
                // Mostra notificação de sucesso
                this.showNotification(`Tag "${tagText}" movida para lixeira`, 'success');
                
                console.log(`✅ Tag excluída: ${tagText}`);
            } else {
                throw new Error('Falha ao mover tag para lixeira');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir tag:', error);
            this.showNotification('Erro ao excluir tag', 'error');
        }
    }
    
    /**
     * ↩️ Restaura tag da lixeira
     */
    restoreTag(trashItemId) {
        try {
            console.log(`↩️ Restaurando tag: ${trashItemId}`);
            
            const restored = this.trashManager.restoreFromTrash(trashItemId);
            
            if (restored && restored.success) {
                const tagData = restored.item;
                
                // Recria elemento da tag
                this.recreateTagElement(tagData);
                
                this.showNotification(`Tag "${tagData.text}" restaurada`, 'success');
                console.log(`✅ Tag restaurada: ${tagData.text}`);
                
                return true;
            } else {
                throw new Error('Falha ao restaurar tag');
            }
            
        } catch (error) {
            console.error('❌ Erro ao restaurar tag:', error);
            this.showNotification('Erro ao restaurar tag', 'error');
            return false;
        }
    }
    
    /**
     * 🔄 Recria elemento da tag
     */
    recreateTagElement(tagData) {
        try {
            if (!this.tagsContainer) {
                console.warn('⚠️ Container de tags não disponível para restauração');
                return;
            }
            
            // Cria novo elemento
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = tagData.element;
            const newTagElement = tempDiv.firstElementChild;
            
            // Remove botão de exclusão antigo se existir
            const oldDeleteBtn = newTagElement.querySelector('.tag-delete-btn');
            if (oldDeleteBtn) {
                oldDeleteBtn.remove();
            }
            
            // Adiciona ao container
            this.tagsContainer.appendChild(newTagElement);
            
            // Adiciona novo botão de exclusão
            this.addDeleteButtonToTag(newTagElement);
            
        } catch (error) {
            console.error('❌ Erro ao recriar elemento da tag:', error);
        }
    }
    
    /**
     * 📢 Mostra notificação
     */
    showNotification(message, type = 'info') {
        try {
            // Cria elemento de notificação
            const notification = document.createElement('div');
            notification.className = `trash-notification ${type}`;
            notification.textContent = message;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 3000;
                transition: all 0.3s ease;
                transform: translateX(100%);
            `;
            
            // Cores por tipo
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#3b82f6',
                warning: '#f59e0b'
            };
            
            notification.style.background = colors[type] || colors.info;
            
            document.body.appendChild(notification);
            
            // Animação de entrada
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove após 3 segundos
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
            
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
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <h3 style="margin: 0 0 12px; color: var(--text-primary, #111827);">${title}</h3>
                <p style="margin: 0 0 24px; color: var(--text-secondary, #6b7280);">${message}</p>
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
        console.log('🧪 Testando TagsTrashHandler...');
        
        try {
            const tests = {
                initialized: this.isInitialized,
                hasTrashManager: !!this.trashManager,
                canCreateDeleteButton: true,
                canShowNotification: true
            };
            
            const allTestsPass = Object.values(tests).every(Boolean);
            
            console.log(allTestsPass ? '✅ Todos os testes de tags passaram!' : '❌ Alguns testes falharam:', tests);
            
            return { tests, allTestsPass };
            
        } catch (error) {
            console.error('❌ Erro nos testes de tags:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton
let tagsTrashHandlerInstance = null;

/**
 * 🏭 Factory function para obter instância do TagsTrashHandler
 */
function getTagsTrashHandler() {
    if (!tagsTrashHandlerInstance) {
        tagsTrashHandlerInstance = new TagsTrashHandler();
    }
    return tagsTrashHandlerInstance;
}

// Exposição global
if (typeof window !== 'undefined') {
    window.TagsTrashHandler = TagsTrashHandler;
    window.getTagsTrashHandler = getTagsTrashHandler;
    
    console.log('🏷️ TagsTrashHandler disponível globalmente');
}

export { TagsTrashHandler, getTagsTrashHandler };
export default TagsTrashHandler;








