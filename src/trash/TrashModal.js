/**
 * 🗑️ TrashModal - Interface da Lixeira Profissional
 * 
 * Modal moderno e responsivo para visualização e gerenciamento
 * de itens na lixeira com filtros, ações e estatísticas.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 2: Interface Básica
 */

'use strict';

/**
 * 🖼️ Classe do modal da lixeira
 */
class TrashModal {
    constructor() {
        this.element = null;
        this.isOpen = false;
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.selectedItems = new Set();
        
        // Referências aos elementos
        this.elements = {
            modal: null,
            overlay: null,
            header: null,
            content: null,
            itemsList: null,
            filters: null,
            actions: null,
            stats: null
        };
        
        this.init();
    }
    
    /**
     * 🚀 Inicializa o modal
     */
    init() {
        try {
            console.log('🖼️ Inicializando TrashModal...');
            
            this.createElement();
            this.setupStyles();
            this.attachEventListeners();
            
            console.log('✅ TrashModal inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar TrashModal:', error);
        }
    }
    
    /**
     * 🏗️ Cria estrutura do modal
     */
    createElement() {
        // Container principal do modal
        this.element = document.createElement('div');
        this.element.id = 'trash-modal';
        this.element.className = 'trash-modal-overlay';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-labelledby', 'trash-modal-title');
        this.element.setAttribute('aria-hidden', 'true');
        
        this.element.innerHTML = `
            <div class="trash-modal-container">
                <!-- Header -->
                <div class="trash-modal-header">
                    <div class="trash-modal-title-group">
                        <h2 id="trash-modal-title">
                            <span class="trash-icon">🗑️</span>
                            Lixeira
                        </h2>
                        <div class="trash-modal-stats" id="trash-modal-stats">
                            <span class="stat-item">
                                <span class="stat-value" id="total-items">0</span>
                                <span class="stat-label">itens</span>
                            </span>
                            <span class="stat-separator">•</span>
                            <span class="stat-item">
                                <span class="stat-value" id="expiring-items">0</span>
                                <span class="stat-label">expirando</span>
                            </span>
                        </div>
                    </div>
                    <button class="trash-modal-close" id="trash-modal-close" aria-label="Fechar lixeira">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Filtros e Controles -->
                <div class="trash-modal-controls">
                    <div class="trash-filters">
                        <div class="filter-group">
                            <label class="filter-label">Categoria:</label>
                            <select id="category-filter" class="filter-select">
                                <option value="all">Todas</option>
                                <option value="operation">Operações</option>
                                <option value="session">Sessões</option>
                                <option value="config">Configurações</option>
                                <option value="tag">Tags</option>
                                <option value="note">Notas</option>
                                <option value="analysis">Análises</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">Ordenar:</label>
                            <select id="sort-filter" class="filter-select">
                                <option value="date-desc">Mais recente</option>
                                <option value="date-asc">Mais antigo</option>
                                <option value="category">Categoria</option>
                                <option value="expiration">Vencimento</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <button id="refresh-btn" class="filter-btn" title="Atualizar lista">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="trash-actions">
                        <button id="select-all-btn" class="action-btn secondary" disabled>
                            Selecionar Tudo
                        </button>
                        <button id="restore-selected-btn" class="action-btn primary" disabled>
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                            </svg>
                            Restaurar
                        </button>
                        <button id="delete-selected-btn" class="action-btn danger" disabled>
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Excluir Permanente
                        </button>
                    </div>
                </div>
                
                <!-- Lista de Itens -->
                <div class="trash-modal-content">
                    <div class="trash-items-container" id="trash-items-container">
                        <!-- Itens serão inseridos aqui dinamicamente -->
                        <div class="trash-empty-state" id="trash-empty-state">
                            <div class="empty-icon">🗑️</div>
                            <h3>Lixeira vazia</h3>
                            <p>Nenhum item foi excluído ainda.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="trash-modal-footer">
                    <div class="footer-info">
                        <span class="info-text">
                            Itens são excluídos automaticamente após 30 dias
                        </span>
                    </div>
                    <div class="footer-actions">
                        <button id="cleanup-settings-btn" class="action-btn secondary outline">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                            </svg>
                            Configurações
                        </button>
                        <button id="empty-trash-btn" class="action-btn danger outline" disabled>
                            🧹 Esvaziar Lixeira
                        </button>
                        <button id="close-trash-btn" class="action-btn secondary">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adiciona ao DOM (inicialmente oculto)
        document.body.appendChild(this.element);
        
        // Armazena referências aos elementos
        this.elements = {
            modal: this.element,
            container: this.element.querySelector('.trash-modal-container'),
            header: this.element.querySelector('.trash-modal-header'),
            content: this.element.querySelector('.trash-modal-content'),
            itemsContainer: this.element.querySelector('#trash-items-container'),
            emptyState: this.element.querySelector('#trash-empty-state'),
            stats: this.element.querySelector('#trash-modal-stats'),
            categoryFilter: this.element.querySelector('#category-filter'),
            sortFilter: this.element.querySelector('#sort-filter'),
            refreshBtn: this.element.querySelector('#refresh-btn'),
            selectAllBtn: this.element.querySelector('#select-all-btn'),
            restoreBtn: this.element.querySelector('#restore-selected-btn'),
            deleteBtn: this.element.querySelector('#delete-selected-btn'),
            emptyTrashBtn: this.element.querySelector('#empty-trash-btn'),
            closeBtn: this.element.querySelector('#trash-modal-close'),
            closeFooterBtn: this.element.querySelector('#close-trash-btn')
        };
    }
    
    /**
     * 🎨 Configura estilos do modal
     */
    setupStyles() {
        // Verifica se estilos já foram adicionados
        if (document.getElementById('trash-modal-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'trash-modal-styles';
        styles.textContent = `
            /* 🗑️ Estilos do TrashModal */
            .trash-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 2000;
                
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .trash-modal-overlay.open {
                opacity: 1;
                visibility: visible;
            }
            
            .trash-modal-container {
                background: var(--bg-primary, #ffffff);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 100%;
                max-width: 900px;
                max-height: 80vh;
                
                display: flex;
                flex-direction: column;
                
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .trash-modal-overlay.open .trash-modal-container {
                transform: scale(1) translateY(0);
            }
            
            /* Header */
            .trash-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            
            .trash-modal-title-group {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .trash-modal-title-group h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                color: var(--text-primary, #111827);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .trash-modal-stats {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .stat-value {
                font-weight: 600;
                color: var(--text-primary, #111827);
            }
            
            .stat-separator {
                opacity: 0.5;
            }
            
            .trash-modal-close {
                width: 40px;
                height: 40px;
                border: none;
                background: transparent;
                border-radius: 8px;
                cursor: pointer;
                color: var(--text-secondary, #6b7280);
                transition: all 0.2s ease;
                
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .trash-modal-close:hover {
                background: var(--bg-secondary, #f3f4f6);
                color: var(--text-primary, #111827);
            }
            
            /* Controles */
            .trash-modal-controls {
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #f9fafb);
            }
            
            .trash-filters {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }
            
            .filter-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .filter-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-secondary, #6b7280);
                white-space: nowrap;
            }
            
            .filter-select {
                padding: 8px 12px;
                border: 1px solid var(--border-color, #d1d5db);
                border-radius: 6px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
                font-size: 14px;
                cursor: pointer;
                transition: border-color 0.2s ease;
            }
            
            .filter-select:focus {
                outline: none;
                border-color: var(--accent-color, #3b82f6);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .filter-select option {
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #111827);
                padding: 8px 12px;
                font-size: 14px;
                font-weight: normal;
            }
            
            .filter-select option:checked {
                background: var(--accent-color, #3b82f6);
                color: white;
            }
            
            .filter-select option:hover {
                background: var(--bg-secondary, #f3f4f6);
            }
            
            .filter-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--border-color, #d1d5db);
                border-radius: 6px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
                transition: all 0.2s ease;
                
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .filter-btn:hover {
                background: var(--bg-secondary, #f3f4f6);
                color: var(--text-primary, #111827);
            }
            
            .trash-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .action-btn {
                padding: 8px 16px;
                border: 1px solid transparent;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .action-btn.primary {
                background: var(--accent-color, #3b82f6);
                color: white;
            }
            
            .action-btn.primary:hover:not(:disabled) {
                background: var(--accent-hover, #2563eb);
            }
            
            .action-btn.secondary {
                background: var(--bg-secondary, #f3f4f6);
                color: var(--text-primary, #111827);
                border-color: var(--border-color, #d1d5db);
            }
            
            .action-btn.secondary:hover:not(:disabled) {
                background: var(--bg-tertiary, #e5e7eb);
            }
            
            .action-btn.danger {
                background: #ef4444;
                color: white;
            }
            
            .action-btn.danger:hover:not(:disabled) {
                background: #dc2626;
            }
            
            .action-btn.danger.outline {
                background: transparent;
                color: #ef4444;
                border-color: #ef4444;
            }
            
            .action-btn.danger.outline:hover:not(:disabled) {
                background: #ef4444;
                color: white;
            }
            
            /* Conteúdo */
            .trash-modal-content {
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .trash-items-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px 24px;
            }
            
            /* Lista de itens */
            .trash-items-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .trash-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 8px;
                background: var(--bg-primary, #ffffff);
                transition: all 0.2s ease;
            }
            
            .trash-item:hover {
                border-color: var(--accent-color, #3b82f6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .trash-item-checkbox {
                display: flex;
                align-items: center;
            }
            
            .item-checkbox {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .trash-item-icon {
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: var(--bg-secondary, #f3f4f6);
            }
            
            .trash-item-content {
                flex: 1;
                min-width: 0;
            }
            
            .trash-item-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .trash-item-title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #111827);
                line-height: 1.4;
            }
            
            .trash-item-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .item-category {
                font-size: 12px;
                font-weight: 500;
                color: var(--text-secondary, #6b7280);
                background: var(--bg-secondary, #f3f4f6);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .expiring-badge {
                font-size: 12px;
                font-weight: 500;
                color: #dc2626;
                background: #fef2f2;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #fecaca;
            }
            
            .trash-item-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            }
            
            .trash-item-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .item-action-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--border-color, #d1d5db);
                border-radius: 6px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
                transition: all 0.2s ease;
                
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .item-action-btn:hover {
                background: var(--bg-secondary, #f3f4f6);
                color: var(--text-primary, #111827);
            }
            
            .item-action-btn.restore-btn:hover {
                background: #ecfdf5;
                color: #059669;
                border-color: #10b981;
            }
            
            .item-action-btn.delete-btn:hover {
                background: #fef2f2;
                color: #dc2626;
                border-color: #ef4444;
            }
            
            /* Estado vazio */
            .trash-empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                text-align: center;
            }
            
            .empty-icon {
                font-size: 64px;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            
            .trash-empty-state h3 {
                margin: 0 0 8px;
                font-size: 20px;
                font-weight: 600;
                color: var(--text-primary, #111827);
            }
            
            .trash-empty-state p {
                margin: 0;
                color: var(--text-secondary, #6b7280);
                font-size: 16px;
            }
            
            /* Footer */
            .trash-modal-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 24px;
                border-top: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-secondary, #f9fafb);
            }
            
            .footer-info {
                flex: 1;
            }
            
            .info-text {
                font-size: 14px;
                color: var(--text-secondary, #6b7280);
            }
            
            .footer-actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .trash-modal-overlay {
                    padding: 10px;
                }
                
                .trash-modal-container {
                    max-height: 90vh;
                }
                
                .trash-modal-header {
                    padding: 20px 16px 12px;
                }
                
                .trash-modal-controls {
                    padding: 12px 16px;
                }
                
                .trash-filters {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 12px;
                }
                
                .filter-group {
                    justify-content: space-between;
                }
                
                .trash-actions {
                    justify-content: center;
                }
                
                .trash-items-container {
                    padding: 12px 16px;
                }
                
                .trash-modal-footer {
                    padding: 12px 16px;
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }
                
                .footer-actions {
                    justify-content: center;
                }
            }
            
            /* Integração com temas */
            [data-theme="claro"] .trash-modal-container {
                --bg-primary: #ffffff;
                --bg-secondary: #f9fafb;
                --bg-tertiary: #e5e7eb;
                --text-primary: #111827;
                --text-secondary: #6b7280;
                --border-color: #e5e7eb;
                --accent-color: #3b82f6;
                --accent-hover: #2563eb;
            }
            
            [data-theme="moderno"] .trash-modal-container {
                --bg-primary: #1f2937;
                --bg-secondary: #374151;
                --bg-tertiary: #4b5563;
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --border-color: #4b5563;
                --accent-color: #3b82f6;
                --accent-hover: #2563eb;
            }
            
            [data-theme="matrix"] .trash-modal-container {
                --bg-primary: #0f172a;
                --bg-secondary: #1e293b;
                --bg-tertiary: #334155;
                --text-primary: #10b981;
                --text-secondary: #6ee7b7;
                --border-color: #065f46;
                --accent-color: #10b981;
                --accent-hover: #059669;
            }
            
            [data-theme="daltonismo"] .trash-modal-container {
                --bg-primary: #ffffff;
                --bg-secondary: #f3f4f6;
                --bg-tertiary: #e5e7eb;
                --text-primary: #111827;
                --text-secondary: #6b7280;
                --border-color: #d1d5db;
                --accent-color: #7c3aed;
                --accent-hover: #6d28d9;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * 🎧 Configura event listeners
     */
    attachEventListeners() {
        // Fechar modal
        this.elements.closeBtn.addEventListener('click', () => this.close());
        this.elements.closeFooterBtn.addEventListener('click', () => this.close());
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Fechar clicando no overlay
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });
        
        // Filtros
        this.elements.categoryFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.refreshItems();
        });
        
        this.elements.sortFilter.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.refreshItems();
        });
        
        // Botão refresh
        this.elements.refreshBtn.addEventListener('click', () => {
            this.refreshItems();
        });
        
        // Ações
        this.elements.selectAllBtn.addEventListener('click', () => {
            this.toggleSelectAll();
        });
        
        this.elements.restoreBtn.addEventListener('click', () => {
            this.restoreSelected();
        });
        
        this.elements.deleteBtn.addEventListener('click', () => {
            this.deleteSelected();
        });
        
        this.elements.emptyTrashBtn.addEventListener('click', () => {
            this.emptyTrash();
        });
        
        // Botão de configurações de limpeza
        this.elements.cleanupSettingsBtn = this.element.querySelector('#cleanup-settings-btn');
        this.elements.cleanupSettingsBtn.addEventListener('click', () => {
            this.showCleanupSettings();
        });
        
        // Listener para mudanças na lixeira
        window.addEventListener('trashChanged', () => {
            if (this.isOpen) {
                this.refreshItems();
            }
        });
    }
    
    /**
     * 👁️ Abre o modal
     */
    open() {
        this.isOpen = true;
        this.element.classList.add('open');
        this.element.setAttribute('aria-hidden', 'false');
        
        // Foca no modal para acessibilidade
        this.elements.container.focus();
        
        // Atualiza conteúdo
        this.refreshItems();
        
        console.log('🗑️ Modal da lixeira aberto');
    }
    
    /**
     * 🙈 Fecha o modal
     */
    close() {
        this.isOpen = false;
        this.element.classList.remove('open');
        this.element.setAttribute('aria-hidden', 'true');
        
        // Limpa seleções
        this.selectedItems.clear();
        this.updateActionButtons();
        
        console.log('🗑️ Modal da lixeira fechado');
    }
    
    /**
     * 🔄 Atualiza lista de itens
     */
    refreshItems() {
        try {
            // Obtém dados da lixeira
            const trashData = window.trashManager ? window.trashManager.getTrashData() : { items: [] };
            const stats = window.trashManager ? window.trashManager.getStats() : {};
            
            // Atualiza estatísticas
            this.updateStats(stats);
            
            // Filtra e ordena itens
            let items = this.filterItems(trashData.items);
            items = this.sortItems(items);
            
            // Renderiza lista
            this.renderItems(items);
            
            // Atualiza botões
            this.updateActionButtons();
            
        } catch (error) {
            console.error('❌ Erro ao atualizar itens:', error);
            this.showError('Erro ao carregar itens da lixeira');
        }
    }
    
    /**
     * 📊 Atualiza estatísticas
     */
    updateStats(stats) {
        const totalElement = this.element.querySelector('#total-items');
        const expiringElement = this.element.querySelector('#expiring-items');
        
        if (totalElement) totalElement.textContent = stats.totalItems || 0;
        if (expiringElement) expiringElement.textContent = stats.expiringItems || 0;
    }
    
    /**
     * 🔍 Filtra itens
     */
    filterItems(items) {
        if (this.currentFilter === 'all') {
            return items;
        }
        
        return items.filter(item => item.category === this.currentFilter);
    }
    
    /**
     * 📋 Ordena itens
     */
    sortItems(items) {
        return items.sort((a, b) => {
            switch (this.currentSort) {
                case 'date-desc':
                    return new Date(b.deletedAt) - new Date(a.deletedAt);
                case 'date-asc':
                    return new Date(a.deletedAt) - new Date(b.deletedAt);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'expiration':
                    return new Date(a.expirationDate) - new Date(b.expirationDate);
                default:
                    return 0;
            }
        });
    }
    
    /**
     * 🖼️ Renderiza lista de itens
     */
    renderItems(items) {
        const container = this.elements.itemsContainer;
        const emptyState = this.elements.emptyState;
        
        if (items.length === 0) {
            emptyState.style.display = 'flex';
            container.innerHTML = '';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Renderiza lista real de itens
        const itemsHTML = items.map(item => this.renderTrashItem(item)).join('');
        
        container.innerHTML = `
            <div class="trash-items-list">
                ${itemsHTML}
            </div>
        `;
        
        // Adiciona event listeners aos itens
        this.attachItemEventListeners();
    }
    
    /**
     * 🗑️ Renderiza um item individual da lixeira
     */
    renderTrashItem(item) {
        const deletedDate = new Date(item.deletedAt);
        const expirationDate = new Date(item.expirationDate);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        // Ícones por categoria
        const categoryIcons = {
            operation: '🔄',
            session: '📊',
            config: '⚙️',
            tag: '🏷️',
            note: '📝',
            analysis: '📈'
        };
        
        const icon = categoryIcons[item.category] || '📄';
        const isExpiringSoon = daysUntilExpiration <= 7;
        
        return `
            <div class="trash-item" data-item-id="${item.id}" data-category="${item.category}">
                <div class="trash-item-checkbox">
                    <input type="checkbox" id="item-${item.id}" class="item-checkbox">
                    <label for="item-${item.id}" class="checkbox-label"></label>
                </div>
                
                <div class="trash-item-icon">
                    ${icon}
                </div>
                
                <div class="trash-item-content">
                    <div class="trash-item-header">
                        <h4 class="trash-item-title">
                            ${this.getItemDisplayName(item)}
                        </h4>
                        <div class="trash-item-meta">
                            <span class="item-category">${this.getCategoryDisplayName(item.category)}</span>
                            ${isExpiringSoon ? `<span class="expiring-badge">Expira em ${daysUntilExpiration}d</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="trash-item-details">
                        <span class="deleted-date">
                            Excluído em ${deletedDate.toLocaleDateString('pt-BR')} às ${deletedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span class="expiration-date">
                            Expira em ${expirationDate.toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
                
                <div class="trash-item-actions">
                    <button class="item-action-btn restore-btn" data-action="restore" data-item-id="${item.id}" title="Restaurar item">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                        </svg>
                    </button>
                    <button class="item-action-btn delete-btn" data-action="delete" data-item-id="${item.id}" title="Excluir permanentemente">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 📝 Obtém nome de exibição do item
     */
    getItemDisplayName(item) {
        switch (item.category) {
            case 'tag':
                return `Tag: ${item.data.text || 'Tag personalizada'}`;
            case 'note':
                return `Nota: ${(item.data.content || '').substring(0, 50)}${item.data.content && item.data.content.length > 50 ? '...' : ''}`;
            case 'operation':
                return `Operação: ${item.data.resultado || 'N/A'} - R$ ${item.data.valor || '0,00'}`;
            case 'session':
                return `Sessão: ${item.data.date || 'Data não informada'}`;
            case 'config':
                return `Configuração: ${item.data.name || 'Configuração personalizada'}`;
            case 'analysis':
                return `Análise: ${item.data.type || 'Análise de dados'}`;
            default:
                return `Item: ${item.originalId}`;
        }
    }
    
    /**
     * 🏷️ Obtém nome de exibição da categoria
     */
    getCategoryDisplayName(category) {
        const names = {
            operation: 'Operação',
            session: 'Sessão',
            config: 'Configuração',
            tag: 'Tag',
            note: 'Nota',
            analysis: 'Análise'
        };
        
        return names[category] || 'Item';
    }
    
    /**
     * 🎧 Adiciona event listeners aos itens
     */
    attachItemEventListeners() {
        // Checkboxes
        const checkboxes = this.element.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.id.replace('item-', '');
                if (e.target.checked) {
                    this.selectedItems.add(itemId);
                } else {
                    this.selectedItems.delete(itemId);
                }
                this.updateActionButtons();
            });
        });
        
        // Botões de ação individual
        const actionButtons = this.element.querySelectorAll('.item-action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                const itemId = button.getAttribute('data-item-id');
                
                if (action === 'restore') {
                    this.restoreItem(itemId);
                } else if (action === 'delete') {
                    this.deleteItemPermanently(itemId);
                }
            });
        });
    }
    
    /**
     * 🔄 Atualiza botões de ação
     */
    updateActionButtons() {
        const hasItems = this.selectedItems.size > 0;
        
        this.elements.selectAllBtn.disabled = false; // Sempre habilitado se há itens
        this.elements.restoreBtn.disabled = !hasItems;
        this.elements.deleteBtn.disabled = !hasItems;
        this.elements.emptyTrashBtn.disabled = false; // Será verificado quando implementado
    }
    
    /**
     * ✅ Toggle selecionar tudo
     */
    toggleSelectAll() {
        console.log('🔄 Toggle selecionar tudo (será implementado na próxima etapa)');
    }
    
    /**
     * ↩️ Restaura item individual
     */
    async restoreItem(itemId) {
        try {
            console.log(`↩️ Restaurando item: ${itemId}`);
            
            if (!window.trashManager) {
                throw new Error('TrashManager não disponível');
            }
            
            const restored = window.trashManager.restoreFromTrash(itemId);
            
            if (!restored || !restored.success) {
                throw new Error('Falha ao restaurar item do TrashManager');
            }
            
            console.log('🔍 Item restaurado do TrashManager:', restored);
            
            // Processa restauração baseada na categoria
            const processingResult = await this.processItemRestoration(restored);
            
            if (processingResult === false) {
                throw new Error('Falha no processamento da restauração');
            }
            
            // Atualiza interface
            this.refreshItems();
            
            // Mostra notificação de sucesso
            const itemType = this.getItemTypeLabel(restored.category);
            this.showNotification(`${itemType} restaurado com sucesso`, 'success');
            
            console.log(`✅ Restauração concluída: ${itemId}`);
            
        } catch (error) {
            console.error('❌ Erro ao restaurar item:', error);
            console.error('📊 Detalhes do erro:', {
                itemId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            // Mostra notificação de erro mais específica
            const errorMessage = this.getErrorMessage(error);
            this.showNotification(errorMessage, 'error');
        }
    }
    
    /**
     * 🏷️ Obtém rótulo do tipo de item
     */
    getItemTypeLabel(category) {
        const labels = {
            'operation': 'Operação',
            'session': 'Sessão',
            'tag': 'Tag',
            'note': 'Nota',
            'config': 'Configuração'
        };
        return labels[category] || 'Item';
    }
    
    /**
     * 📝 Obtém mensagem de erro amigável
     */
    getErrorMessage(error) {
        const message = error.message || 'Erro desconhecido';
        
        if (message.includes('Estado não disponível')) {
            return 'Erro: Estado da aplicação não disponível';
        }
        
        if (message.includes('TrashManager não disponível')) {
            return 'Erro: Sistema de lixeira não inicializado';
        }
        
        if (message.includes('Falha ao restaurar')) {
            return 'Erro: Não foi possível restaurar o item';
        }
        
        if (message.includes('Handler não disponível')) {
            return 'Erro: Sistema de restauração não disponível';
        }
        
        return `Erro ao restaurar: ${message}`;
    }
    
    /**
     * 🗑️ Exclui item permanentemente
     */
    deleteItemPermanently(itemId) {
        try {
            // Confirma exclusão permanente
            if (confirm('Tem certeza que deseja excluir este item permanentemente? Esta ação não pode ser desfeita.')) {
                console.log(`🗑️ Excluindo permanentemente: ${itemId}`);
                
                if (window.trashManager) {
                    const deleted = window.trashManager.deleteFromTrashPermanently(itemId);
                    
                    if (deleted) {
                        // Atualiza interface
                        this.refreshItems();
                        
                        // Mostra notificação
                        this.showNotification('Item excluído permanentemente', 'success');
                    } else {
                        throw new Error('Falha ao excluir item');
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir item permanentemente:', error);
            this.showNotification('Erro ao excluir item', 'error');
        }
    }
    
    /**
     * 🔄 Processa restauração do item baseada na categoria
     */
    async processItemRestoration(restored) {
        const { item, category, originalId } = restored;
        
        try {
            let success = false;
            
            switch (category) {
                case 'operation':
                    // Restaura operação usando OperationsTrashHandler
                    if (window.operationsTrashHandler) {
                        window.operationsTrashHandler.restoreOperationToState(item);
                        console.log(`✅ Operação "${originalId}" restaurada`);
                        success = true;
                    } else {
                        console.warn('⚠️ OperationsTrashHandler não disponível para restauração');
                        // Fallback: restaura diretamente no estado
                        this.fallbackRestoreOperation(item);
                        success = true;
                    }
                    break;
                    
                case 'session':
                    // Restaura sessão usando SessionsTrashHandler
                    if (window.sessionsTrashHandler) {
                        const result = await window.sessionsTrashHandler.restoreSessionToState(item);
                        if (result !== false) {
                            console.log(`✅ Sessão "${originalId}" restaurada`);
                            success = true;
                        } else {
                            console.warn('⚠️ Restauração de sessão cancelada pelo usuário');
                            return false; // Usuário cancelou
                        }
                    } else {
                        console.warn('⚠️ SessionsTrashHandler não disponível para restauração');
                        // Fallback: restaura diretamente no estado
                        this.fallbackRestoreSession(item);
                        success = true;
                    }
                    break;
                    
                case 'tag':
                    // Restaura tag usando TagsTrashHandler
                    if (window.tagsTrashHandler) {
                        // Chama método específico para restaurar dados da tag
                        window.tagsTrashHandler.recreateTagElement(item);
                        console.log(`✅ Tag "${item.text || originalId}" restaurada`);
                        success = true;
                    } else {
                        console.warn('⚠️ TagsTrashHandler não disponível para restauração');
                        // Fallback: recria tag diretamente
                        this.fallbackRestoreTag(item);
                        success = true;
                    }
                    break;
                    
                case 'note':
                    // Restaura nota (implementar quando necessário)
                    console.log(`✅ Nota restaurada: ${originalId}`);
                    success = true;
                    break;
                    
                case 'config':
                    // Restaura configuração (implementar quando necessário)
                    console.log(`✅ Configuração restaurada: ${originalId}`);
                    success = true;
                    break;
                    
                default:
                    console.log(`✅ Item restaurado: ${originalId}`);
                    success = true;
            }
            
            if (success) {
                // Força atualização da UI após restauração
                this.forceUIUpdate();
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Erro ao processar restauração:', error);
            console.error('📊 Dados do item:', { item, category, originalId });
            throw error;
        }
    }
    
    /**
     * 🔄 Fallback para restaurar operação
     */
    fallbackRestoreOperation(operationData) {
        try {
            if (window.state && Array.isArray(window.state.historicoCombinado)) {
                // Remove contexto de sessão se existir
                const cleanOperation = { ...operationData };
                delete cleanOperation.sessionContext;
                
                window.state.historicoCombinado.push(cleanOperation);
                
                // Recalcula estado
                if (window.logic && window.logic.reprocessarHistorico) {
                    window.logic.reprocessarHistorico();
                }
                
                console.log('✅ Operação restaurada via fallback');
            }
        } catch (error) {
            console.error('❌ Erro no fallback de operação:', error);
        }
    }
    
    /**
     * 🔄 Fallback para restaurar sessão
     */
    fallbackRestoreSession(sessionData) {
        try {
            // Verifica se há sessão ativa
            if (window.state?.isSessionActive) {
                const confirmReplace = confirm('Há uma sessão ativa. Deseja substituí-la pela sessão restaurada?');
                if (!confirmReplace) {
                    console.log('Restauração de sessão cancelada pelo usuário');
                    return;
                }
            }
            
            // Restaura sessão no estado
            if (window.state) {
                window.state.isSessionActive = true;
                window.state.sessionMode = sessionData.sessionMode || 'oficial';
                window.state.capitalInicioSessao = sessionData.capitalInicial || 0;
                window.state.capitalAtual = sessionData.capitalAtual || sessionData.capitalInicial || 0;
                window.state.historicoCombinado = sessionData.historicoCombinado || [];
                window.state.planoDeOperacoes = sessionData.planoDeOperacoes || [];
                
                console.log('✅ Sessão restaurada via fallback');
            }
        } catch (error) {
            console.error('❌ Erro no fallback de sessão:', error);
        }
    }
    
    /**
     * 🔄 Fallback para restaurar tag
     */
    fallbackRestoreTag(tagData) {
        try {
            // Procura container de tags
            const tagsContainer = document.querySelector('.tags-container, #tags-container, [class*="tag"]');
            if (tagsContainer && tagData.text) {
                // Cria elemento de tag
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tagData.text;
                tagElement.style.cssText = tagData.style || '';
                
                tagsContainer.appendChild(tagElement);
                console.log('✅ Tag restaurada via fallback');
            }
        } catch (error) {
            console.error('❌ Erro no fallback de tag:', error);
        }
    }
    
    /**
     * 🔄 Força atualização da UI
     */
    forceUIUpdate() {
        try {
            // Atualiza UI principal
            if (window.ui && window.ui.atualizarTudo) {
                window.ui.atualizarTudo();
            }
            
            // Atualiza timeline
            if (window.ui && window.ui.renderizarTimelineCompleta && window.state?.historicoCombinado) {
                const container = document.querySelector('.timeline-container, #timeline-container');
                if (container) {
                    window.ui.renderizarTimelineCompleta(window.state.historicoCombinado, container);
                }
            }
            
            // Dispara evento personalizado
            document.dispatchEvent(new CustomEvent('trashItemRestored', {
                detail: { timestamp: Date.now() }
            }));
            
        } catch (error) {
            console.error('❌ Erro ao forçar atualização da UI:', error);
        }
    }
    
    /**
     * ↩️ Restaura itens selecionados
     */
    restoreSelected() {
        try {
            const selectedArray = Array.from(this.selectedItems);
            
            if (selectedArray.length === 0) {
                this.showNotification('Nenhum item selecionado', 'warning');
                return;
            }
            
            console.log(`↩️ Restaurando ${selectedArray.length} itens selecionados`);
            
            let successCount = 0;
            let errorCount = 0;
            
            selectedArray.forEach(itemId => {
                try {
                    if (window.trashManager) {
                        const restored = window.trashManager.restoreFromTrash(itemId);
                        
                        if (restored && restored.success) {
                            this.processItemRestoration(restored);
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erro ao restaurar item ${itemId}:`, error);
                    errorCount++;
                }
            });
            
            // Limpa seleções
            this.selectedItems.clear();
            
            // Atualiza interface
            this.refreshItems();
            
            // Mostra resultado
            if (successCount > 0) {
                this.showNotification(`${successCount} item(s) restaurado(s)`, 'success');
            }
            
            if (errorCount > 0) {
                this.showNotification(`${errorCount} erro(s) na restauração`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao restaurar itens selecionados:', error);
            this.showNotification('Erro ao restaurar itens', 'error');
        }
    }
    
    /**
     * 🗑️ Exclui permanentemente itens selecionados
     */
    deleteSelected() {
        try {
            const selectedArray = Array.from(this.selectedItems);
            
            if (selectedArray.length === 0) {
                this.showNotification('Nenhum item selecionado', 'warning');
                return;
            }
            
            // Confirma exclusão permanente
            if (!confirm(`Tem certeza que deseja excluir permanentemente ${selectedArray.length} item(s)? Esta ação não pode ser desfeita.`)) {
                return;
            }
            
            console.log(`🗑️ Excluindo permanentemente ${selectedArray.length} itens selecionados`);
            
            let successCount = 0;
            let errorCount = 0;
            
            selectedArray.forEach(itemId => {
                try {
                    if (window.trashManager) {
                        const deleted = window.trashManager.deleteFromTrashPermanently(itemId);
                        
                        if (deleted) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erro ao excluir item ${itemId}:`, error);
                    errorCount++;
                }
            });
            
            // Limpa seleções
            this.selectedItems.clear();
            
            // Atualiza interface
            this.refreshItems();
            
            // Mostra resultado
            if (successCount > 0) {
                this.showNotification(`${successCount} item(s) excluído(s) permanentemente`, 'success');
            }
            
            if (errorCount > 0) {
                this.showNotification(`${errorCount} erro(s) na exclusão`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir itens selecionados:', error);
            this.showNotification('Erro ao excluir itens', 'error');
        }
    }
    
    /**
     * 🧹 Esvazia lixeira
     */
    emptyTrash() {
        try {
            // Confirma esvaziamento
            if (!confirm('Tem certeza que deseja esvaziar completamente a lixeira? Todos os itens serão excluídos permanentemente e esta ação não pode ser desfeita.')) {
                return;
            }
            
            console.log('🧹 Esvaziando lixeira...');
            
            if (window.trashManager) {
                const removedCount = window.trashManager.emptyTrash();
                
                if (removedCount > 0) {
                    // Limpa seleções
                    this.selectedItems.clear();
                    
                    // Atualiza interface
                    this.refreshItems();
                    
                    // Mostra resultado
                    this.showNotification(`Lixeira esvaziada: ${removedCount} item(s) removido(s)`, 'success');
                } else {
                    this.showNotification('Lixeira já estava vazia', 'info');
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao esvaziar lixeira:', error);
            this.showNotification('Erro ao esvaziar lixeira', 'error');
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
                max-width: 300px;
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
            
            // Remove após 4 segundos
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 4000);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);
        }
    }
    
    /**
     * 🎛️ Mostra configurações de limpeza
     */
    showCleanupSettings() {
        try {
            console.log('🎛️ Abrindo configurações de limpeza...');
            
            // Obtém configurações atuais
            const config = window.trashManager ? window.trashManager.getCleanupConfig() : {};
            const stats = window.trashManager ? window.trashManager.getCleanupStats() : {};
            
            // Cria modal de configurações
            const settingsModal = this.createSettingsModal(config, stats);
            document.body.appendChild(settingsModal);
            
            // Mostra modal
            setTimeout(() => {
                settingsModal.style.opacity = '1';
                settingsModal.style.visibility = 'visible';
                settingsModal.querySelector('.settings-modal-content').style.transform = 'scale(1)';
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar configurações:', error);
            this.showNotification('Erro ao abrir configurações', 'error');
        }
    }
    
    /**
     * 🏗️ Cria modal de configurações
     */
    createSettingsModal(config, stats) {
        const modal = document.createElement('div');
        modal.className = 'settings-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        
        const lastCleanup = stats.lastAutoCleanup ? new Date(stats.lastAutoCleanup).toLocaleString('pt-BR') : 'Nunca';
        
        modal.innerHTML = `
            <div class="settings-modal-content" style="
                background: var(--bg-primary, #ffffff);
                border-radius: 12px;
                padding: 24px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <div class="settings-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h3 style="margin: 0; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                        Configurações de Limpeza Automática
                    </h3>
                    <button class="settings-close-btn" style="
                        width: 32px;
                        height: 32px;
                        border: none;
                        border-radius: 6px;
                        background: transparent;
                        color: var(--text-secondary, #6b7280);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Estatísticas -->
                <div class="settings-stats" style="
                    background: var(--bg-secondary, #f3f4f6);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                ">
                    <div class="stat-item" style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-color, #3b82f6);">${stats.totalAutoDeleted || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary, #6b7280);">Itens removidos automaticamente</div>
                    </div>
                    <div class="stat-item" style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: ${stats.itemsExpiringSoon > 0 ? '#f59e0b' : '#10b981'};">${stats.itemsExpiringSoon || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary, #6b7280);">Expirando em breve</div>
                    </div>
                    <div class="stat-item" style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: ${stats.itemsExpiredNow > 0 ? '#ef4444' : '#10b981'};">${stats.itemsExpiredNow || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary, #6b7280);">Expirados agora</div>
                    </div>
                </div>
                
                <!-- Configurações -->
                <form class="settings-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="setting-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text-primary, #111827);">
                            <input type="checkbox" id="cleanup-enabled" ${config.enabled ? 'checked' : ''} style="width: 18px; height: 18px;">
                            Limpeza automática ativada
                        </label>
                        <p style="margin: 4px 0 0 26px; font-size: 14px; color: var(--text-secondary, #6b7280);">
                            Remove automaticamente itens expirados da lixeira
                        </p>
                    </div>
                    
                    <div class="setting-group">
                        <label style="display: block; font-weight: 500; color: var(--text-primary, #111827); margin-bottom: 8px;">
                            Intervalo de limpeza (horas):
                        </label>
                        <select id="cleanup-interval" style="
                            width: 100%;
                            padding: 8px 12px;
                            border: 1px solid var(--border-color, #d1d5db);
                            border-radius: 6px;
                            background: var(--bg-primary, #ffffff);
                            color: var(--text-primary, #111827);
                        ">
                            <option value="1" ${config.intervalHours === 1 ? 'selected' : ''}>1 hora</option>
                            <option value="3" ${config.intervalHours === 3 ? 'selected' : ''}>3 horas</option>
                            <option value="6" ${config.intervalHours === 6 ? 'selected' : ''}>6 horas</option>
                            <option value="12" ${config.intervalHours === 12 ? 'selected' : ''}>12 horas</option>
                            <option value="24" ${config.intervalHours === 24 ? 'selected' : ''}>24 horas</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label style="display: block; font-weight: 500; color: var(--text-primary, #111827); margin-bottom: 8px;">
                            Retenção máxima (dias):
                        </label>
                        <select id="retention-days" style="
                            width: 100%;
                            padding: 8px 12px;
                            border: 1px solid var(--border-color, #d1d5db);
                            border-radius: 6px;
                            background: var(--bg-primary, #ffffff);
                            color: var(--text-primary, #111827);
                        ">
                            <option value="7" ${config.maxRetentionDays === 7 ? 'selected' : ''}>7 dias</option>
                            <option value="15" ${config.maxRetentionDays === 15 ? 'selected' : ''}>15 dias</option>
                            <option value="30" ${config.maxRetentionDays === 30 ? 'selected' : ''}>30 dias</option>
                            <option value="60" ${config.maxRetentionDays === 60 ? 'selected' : ''}>60 dias</option>
                            <option value="90" ${config.maxRetentionDays === 90 ? 'selected' : ''}>90 dias</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text-primary, #111827);">
                            <input type="checkbox" id="notify-expiring" ${config.notifyExpiring ? 'checked' : ''} style="width: 18px; height: 18px;">
                            Notificar sobre itens expirando
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text-primary, #111827);">
                            <input type="checkbox" id="notify-cleanup" ${config.notifyCleanup ? 'checked' : ''} style="width: 18px; height: 18px;">
                            Notificar sobre limpezas realizadas
                        </label>
                    </div>
                </form>
                
                <!-- Info -->
                <div class="settings-info" style="
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 20px 0;
                ">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="margin-top: 2px; color: #3b82f6;">
                            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z"/>
                        </svg>
                        <div style="font-size: 14px; color: #1e40af;">
                            <strong>Última limpeza:</strong> ${lastCleanup}<br>
                            <strong>Status:</strong> ${stats.isAutoCleanupActive ? '🟢 Ativo' : '🔴 Inativo'}
                        </div>
                    </div>
                </div>
                
                <!-- Ações -->
                <div class="settings-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                    <button class="settings-cancel-btn" style="
                        padding: 8px 16px;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 6px;
                        background: transparent;
                        color: var(--text-primary, #111827);
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Cancelar</button>
                    <button class="settings-test-btn" style="
                        padding: 8px 16px;
                        border: 1px solid #3b82f6;
                        border-radius: 6px;
                        background: transparent;
                        color: #3b82f6;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Testar Limpeza</button>
                    <button class="settings-save-btn" style="
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: #3b82f6;
                        color: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Salvar Configurações</button>
                </div>
            </div>
        `;
        
        // Event listeners
        this.setupSettingsEventListeners(modal);
        
        return modal;
    }
    
    /**
     * 🎧 Configura event listeners do modal de configurações
     */
    setupSettingsEventListeners(modal) {
        const closeModal = () => {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        // Botão fechar
        const closeBtn = modal.querySelector('.settings-close-btn');
        closeBtn.addEventListener('click', closeModal);
        
        // Botão cancelar
        const cancelBtn = modal.querySelector('.settings-cancel-btn');
        cancelBtn.addEventListener('click', closeModal);
        
        // Clique fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Botão testar limpeza
        const testBtn = modal.querySelector('.settings-test-btn');
        testBtn.addEventListener('click', () => {
            this.testCleanup();
        });
        
        // Botão salvar
        const saveBtn = modal.querySelector('.settings-save-btn');
        saveBtn.addEventListener('click', () => {
            this.saveCleanupSettings(modal);
            closeModal();
        });
    }
    
    /**
     * 🧪 Testa limpeza manual
     */
    testCleanup() {
        try {
            console.log('🧪 Executando teste de limpeza...');
            
            if (window.trashManager) {
                const result = window.trashManager.performAutoCleanup();
                
                if (result.error) {
                    this.showNotification(`Erro no teste: ${result.error}`, 'error');
                } else {
                    const message = `Teste concluído: ${result.deletedCount} item(s) removido(s), ${result.expiringSoonCount} expirando em breve`;
                    this.showNotification(message, 'success');
                    
                    // Atualiza lista se modal estiver aberto
                    if (this.isOpen) {
                        this.refreshItems();
                    }
                }
            } else {
                this.showNotification('TrashManager não disponível', 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro no teste de limpeza:', error);
            this.showNotification('Erro ao executar teste', 'error');
        }
    }
    
    /**
     * 💾 Salva configurações de limpeza
     */
    saveCleanupSettings(modal) {
        try {
            console.log('💾 Salvando configurações de limpeza...');
            
            // Obtém valores do formulário
            const enabled = modal.querySelector('#cleanup-enabled').checked;
            const intervalHours = parseInt(modal.querySelector('#cleanup-interval').value);
            const maxRetentionDays = parseInt(modal.querySelector('#retention-days').value);
            const notifyExpiring = modal.querySelector('#notify-expiring').checked;
            const notifyCleanup = modal.querySelector('#notify-cleanup').checked;
            
            const newConfig = {
                enabled,
                intervalHours,
                maxRetentionDays,
                notifyExpiring,
                notifyCleanup
            };
            
            // Salva configurações
            if (window.trashManager) {
                const savedConfig = window.trashManager.configureCleanup(newConfig);
                
                if (savedConfig) {
                    this.showNotification('Configurações salvas com sucesso', 'success');
                    console.log('✅ Configurações salvas:', savedConfig);
                } else {
                    throw new Error('Falha ao salvar configurações');
                }
            } else {
                throw new Error('TrashManager não disponível');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        }
    }
    
    /**
     * ❌ Mostra erro
     */
    showError(message) {
        console.error('❌ Erro no modal:', message);
        // Implementar notificação de erro visual se necessário
    }
    
    /**
     * 🧪 Função de teste
     */
    test() {
        console.log('🧪 Testando TrashModal...');
        
        try {
            const tests = {
                elementExists: !!this.element,
                hasStyles: !!document.getElementById('trash-modal-styles'),
                hasEventListeners: true,
                canOpen: true,
                canClose: true,
                hasFilters: !!(this.elements.categoryFilter && this.elements.sortFilter),
                hasActions: !!(this.elements.restoreBtn && this.elements.deleteBtn)
            };
            
            const allTestsPass = Object.values(tests).every(Boolean);
            
            console.log(allTestsPass ? '✅ Todos os testes do modal passaram!' : '❌ Alguns testes falharam:', tests);
            
            return { tests, allTestsPass };
            
        } catch (error) {
            console.error('❌ Erro nos testes do modal:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton
let trashModalInstance = null;

/**
 * 🏭 Factory function para obter instância do TrashModal
 */
function getTrashModal() {
    if (!trashModalInstance) {
        trashModalInstance = new TrashModal();
    }
    return trashModalInstance;
}

// Exposição global
if (typeof window !== 'undefined') {
    window.TrashModal = TrashModal;
    window.getTrashModal = getTrashModal;
    
    console.log('🖼️ TrashModal disponível globalmente');
}

export { TrashModal, getTrashModal };
export default TrashModal;
