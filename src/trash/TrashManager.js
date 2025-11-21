/**
 * 🗑️ TrashManager - Sistema Profissional de Lixeira
 * 
 * Gerencia exclusão segura, restauração e limpeza automática de dados
 * com backup completo e integridade referencial.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0 - Etapa 1: Infraestrutura Base
 */

'use strict';

/**
 * 🗑️ Classe principal do sistema de lixeira
 */
class TrashManager {
    constructor() {
        this.storageKey = 'gerenciador_pro_trash';
        this.backupKey = 'gerenciador_pro_backup';
        this.maxRetentionDays = 30;
        this.isInitialized = false;
        
        // Categorias de itens excluíveis
        this.categories = {
            OPERATION: 'operation',
            SESSION: 'session', 
            CONFIG: 'config',
            TAG: 'tag',
            NOTE: 'note',
            ANALYSIS: 'analysis'
        };
        
        // Níveis de complexidade para restauração
        this.complexityLevels = {
            SIMPLE: 1,      // Tags, notas - restauração direta
            MEDIUM: 2,      // Operações - requer recálculo
            COMPLEX: 3      // Sessões - requer reconstrução completa
        };
        
        this.init();
    }
    
    /**
     * 🚀 Inicializa o sistema de lixeira
     */
    init() {
        try {
            console.log('🗑️ Inicializando TrashManager...');
            
            // Verifica suporte ao localStorage
            if (!this.checkStorageSupport()) {
                throw new Error('LocalStorage não suportado');
            }
            
            // Inicializa estrutura de dados
            this.initializeStorage();
            
            // Configura limpeza automática
            this.setupAutoCleanup();
            
            // Registra listeners de eventos
            this.setupEventListeners();
            
            // Inicia sistema de limpeza automática
            this.startAutoCleanup();
            
            this.isInitialized = true;
            console.log('✅ TrashManager inicializado com sucesso');
            
            // Log de estatísticas iniciais
            this.logStats();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar TrashManager:', error);
            this.isInitialized = false;
        }
    }
    
    /**
     * 🔍 Verifica suporte ao localStorage
     */
    checkStorageSupport() {
        try {
            const testKey = '__trash_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('⚠️ LocalStorage não disponível:', error.message);
            return false;
        }
    }
    
    /**
     * 🏗️ Inicializa estrutura de armazenamento
     */
    initializeStorage() {
        // Inicializa lixeira se não existir
        if (!localStorage.getItem(this.storageKey)) {
            const initialTrash = {
                items: [],
                metadata: {
                    created: new Date().toISOString(),
                    lastCleanup: new Date().toISOString(),
                    totalItemsEverDeleted: 0,
                    totalItemsRestored: 0
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialTrash));
        }
        
        // Inicializa sistema de backup se não existir
        if (!localStorage.getItem(this.backupKey)) {
            const initialBackup = {
                snapshots: [],
                metadata: {
                    created: new Date().toISOString(),
                    lastBackup: null,
                    totalBackups: 0
                }
            };
            localStorage.setItem(this.backupKey, JSON.stringify(initialBackup));
        }
    }
    
    /**
     * 🧹 Configura limpeza automática
     */
    setupAutoCleanup() {
        // Executa limpeza na inicialização
        this.performAutoCleanup();
        
        // Agenda limpeza periódica (a cada hora)
        setInterval(() => {
            this.performAutoCleanup();
        }, 60 * 60 * 1000); // 1 hora
    }
    
    /**
     * 🎧 Configura listeners de eventos
     */
    setupEventListeners() {
        // Listener para mudanças na lixeira (entre abas)
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) {
                console.log('🔄 Lixeira atualizada em outra aba');
                this.notifyTrashChanged();
            }
        });
        
        // Listener para antes de fechar página (backup de emergência)
        window.addEventListener('beforeunload', () => {
            this.createEmergencyBackup();
        });
    }
    
    /**
     * 📊 Obtém estatísticas da lixeira
     */
    getStats() {
        try {
            const trash = this.getTrashData();
            const now = new Date();
            
            // Agrupa itens por categoria
            const itemsByCategory = {};
            Object.values(this.categories).forEach(cat => {
                itemsByCategory[cat] = 0;
            });
            
            trash.items.forEach(item => {
                if (itemsByCategory.hasOwnProperty(item.category)) {
                    itemsByCategory[item.category]++;
                }
            });
            
            // Calcula itens próximos ao vencimento (últimos 7 dias)
            const expiringItems = trash.items.filter(item => {
                const expirationDate = new Date(item.expirationDate);
                const daysUntilExpiration = (expirationDate - now) / (1000 * 60 * 60 * 24);
                return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
            });
            
            return {
                totalItems: trash.items.length,
                itemsByCategory,
                expiringItems: expiringItems.length,
                oldestItem: trash.items.length > 0 ? 
                    Math.min(...trash.items.map(item => new Date(item.deletedAt).getTime())) : null,
                newestItem: trash.items.length > 0 ? 
                    Math.max(...trash.items.map(item => new Date(item.deletedAt).getTime())) : null,
                totalEverDeleted: trash.metadata.totalItemsEverDeleted,
                totalRestored: trash.metadata.totalItemsRestored,
                lastCleanup: trash.metadata.lastCleanup
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                totalItems: 0,
                itemsByCategory: {},
                expiringItems: 0,
                error: error.message
            };
        }
    }
    
    /**
     * 📋 Obtém dados da lixeira
     */
    getTrashData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { items: [], metadata: {} };
        } catch (error) {
            console.error('❌ Erro ao ler dados da lixeira:', error);
            return { items: [], metadata: {} };
        }
    }
    
    /**
     * 💾 Salva dados na lixeira
     */
    saveTrashData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.notifyTrashChanged();
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar dados da lixeira:', error);
            return false;
        }
    }
    
    /**
     * 🧹 Executa limpeza automática
     */
    performAutoCleanup() {
        try {
            const trash = this.getTrashData();
            const now = new Date();
            const initialCount = trash.items.length;
            
            // Remove itens expirados
            trash.items = trash.items.filter(item => {
                const expirationDate = new Date(item.expirationDate);
                return expirationDate > now;
            });
            
            const removedCount = initialCount - trash.items.length;
            
            if (removedCount > 0) {
                trash.metadata.lastCleanup = now.toISOString();
                this.saveTrashData(trash);
                console.log(`🧹 Limpeza automática: ${removedCount} itens removidos`);
            }
            
        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error);
        }
    }
    
    /**
     * 💾 Cria backup de emergência
     */
    createEmergencyBackup() {
        try {
            const currentState = {
                timestamp: new Date().toISOString(),
                type: 'emergency',
                data: {
                    state: window.state ? { ...window.state } : null,
                    config: window.config ? { ...window.config } : null,
                    trash: this.getTrashData()
                }
            };
            
            const backup = this.getBackupData();
            backup.snapshots.unshift(currentState);
            
            // Mantém apenas os 5 backups mais recentes
            backup.snapshots = backup.snapshots.slice(0, 5);
            backup.metadata.lastBackup = currentState.timestamp;
            backup.metadata.totalBackups++;
            
            localStorage.setItem(this.backupKey, JSON.stringify(backup));
            console.log('💾 Backup de emergência criado');
            
        } catch (error) {
            console.error('❌ Erro ao criar backup de emergência:', error);
        }
    }
    
    /**
     * 📋 Obtém dados de backup
     */
    getBackupData() {
        try {
            const data = localStorage.getItem(this.backupKey);
            return data ? JSON.parse(data) : { snapshots: [], metadata: {} };
        } catch (error) {
            console.error('❌ Erro ao ler dados de backup:', error);
            return { snapshots: [], metadata: {} };
        }
    }
    
    /**
     * 📢 Notifica mudanças na lixeira
     */
    notifyTrashChanged() {
        // Dispara evento customizado
        const event = new CustomEvent('trashChanged', {
            detail: this.getStats()
        });
        window.dispatchEvent(event);
        
        // Atualiza FAB se existir
        if (window.trashFAB) {
            window.trashFAB.updateState();
        }
    }
    
    /**
     * 📊 Log de estatísticas
     */
    logStats() {
        const stats = this.getStats();
        console.log('📊 Estatísticas da Lixeira:', {
            'Total de itens': stats.totalItems,
            'Por categoria': stats.itemsByCategory,
            'Próximos ao vencimento': stats.expiringItems,
            'Total já excluído': stats.totalEverDeleted,
            'Total restaurado': stats.totalRestored
        });
    }
    
    /**
     * 🗑️ Move item para a lixeira (soft delete)
     * @param {Object} item - Item a ser excluído
     * @param {string} category - Categoria do item
     * @param {number} complexityLevel - Nível de complexidade para restauração
     * @returns {boolean} Sucesso da operação
     */
    moveToTrash(item, category, complexityLevel = this.complexityLevels.SIMPLE) {
        try {
            if (!item || !category) {
                throw new Error('Item e categoria são obrigatórios');
            }
            
            console.log(`🗑️ Movendo para lixeira: ${category}`, item);
            
            // Cria backup do estado antes da exclusão
            this.createItemBackup(item, category);
            
            // Cria entrada na lixeira
            const trashItem = {
                id: this.generateTrashId(),
                originalId: item.id || item.key || Date.now().toString(),
                category: category,
                complexityLevel: complexityLevel,
                data: JSON.parse(JSON.stringify(item)), // Deep clone
                deletedAt: new Date().toISOString(),
                expirationDate: this.calculateExpirationDate(),
                metadata: {
                    deletedBy: 'user',
                    reason: 'manual_deletion',
                    appVersion: '9.3',
                    backupCreated: true
                }
            };
            
            // Adiciona à lixeira
            const trash = this.getTrashData();
            trash.items.push(trashItem);
            trash.metadata.totalItemsEverDeleted++;
            trash.metadata.lastUpdate = new Date().toISOString();
            
            // Salva dados
            if (this.saveTrashData(trash)) {
                console.log(`✅ Item movido para lixeira: ${trashItem.id}`);
                return trashItem.id;
            } else {
                throw new Error('Falha ao salvar na lixeira');
            }
            
        } catch (error) {
            console.error('❌ Erro ao mover para lixeira:', error);
            return false;
        }
    }
    
    /**
     * ↩️ Restaura item da lixeira
     * @param {string} trashItemId - ID do item na lixeira
     * @returns {Object|false} Item restaurado ou false se falhou
     */
    restoreFromTrash(trashItemId) {
        try {
            if (!trashItemId) {
                throw new Error('ID do item é obrigatório');
            }
            
            console.log(`↩️ Restaurando da lixeira: ${trashItemId}`);
            
            const trash = this.getTrashData();
            const itemIndex = trash.items.findIndex(item => item.id === trashItemId);
            
            if (itemIndex === -1) {
                throw new Error('Item não encontrado na lixeira');
            }
            
            const trashItem = trash.items[itemIndex];
            
            // Remove da lixeira
            trash.items.splice(itemIndex, 1);
            trash.metadata.totalItemsRestored++;
            trash.metadata.lastUpdate = new Date().toISOString();
            
            // Salva dados atualizados
            this.saveTrashData(trash);
            
            console.log(`✅ Item restaurado: ${trashItem.originalId}`);
            
            return {
                success: true,
                item: trashItem.data,
                category: trashItem.category,
                complexityLevel: trashItem.complexityLevel,
                originalId: trashItem.originalId
            };
            
        } catch (error) {
            console.error('❌ Erro ao restaurar da lixeira:', error);
            return false;
        }
    }
    
    /**
     * 🗑️ Exclui item permanentemente da lixeira
     * @param {string} trashItemId - ID do item na lixeira
     * @returns {boolean} Sucesso da operação
     */
    deleteFromTrashPermanently(trashItemId) {
        try {
            if (!trashItemId) {
                throw new Error('ID do item é obrigatório');
            }
            
            console.log(`🗑️ Excluindo permanentemente: ${trashItemId}`);
            
            const trash = this.getTrashData();
            const itemIndex = trash.items.findIndex(item => item.id === trashItemId);
            
            if (itemIndex === -1) {
                throw new Error('Item não encontrado na lixeira');
            }
            
            // Remove da lixeira
            const removedItem = trash.items.splice(itemIndex, 1)[0];
            trash.metadata.lastUpdate = new Date().toISOString();
            
            // Salva dados atualizados
            this.saveTrashData(trash);
            
            console.log(`✅ Item excluído permanentemente: ${removedItem.originalId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao excluir permanentemente:', error);
            return false;
        }
    }
    
    /**
     * 🧹 Esvazia lixeira completamente
     * @returns {number} Número de itens removidos
     */
    emptyTrash() {
        try {
            console.log('🧹 Esvaziando lixeira...');
            
            const trash = this.getTrashData();
            const itemCount = trash.items.length;
            
            if (itemCount === 0) {
                console.log('ℹ️ Lixeira já está vazia');
                return 0;
            }
            
            // Remove todos os itens
            trash.items = [];
            trash.metadata.lastUpdate = new Date().toISOString();
            trash.metadata.lastEmptied = new Date().toISOString();
            
            // Salva dados
            this.saveTrashData(trash);
            
            console.log(`✅ Lixeira esvaziada: ${itemCount} itens removidos`);
            return itemCount;
            
        } catch (error) {
            console.error('❌ Erro ao esvaziar lixeira:', error);
            return 0;
        }
    }
    
    /**
     * 📋 Obtém itens da lixeira com filtros
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} Lista de itens filtrados
     */
    getTrashItems(filters = {}) {
        try {
            const trash = this.getTrashData();
            let items = [...trash.items];
            
            // Filtro por categoria
            if (filters.category && filters.category !== 'all') {
                items = items.filter(item => item.category === filters.category);
            }
            
            // Filtro por data
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                items = items.filter(item => new Date(item.deletedAt) >= fromDate);
            }
            
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                items = items.filter(item => new Date(item.deletedAt) <= toDate);
            }
            
            // Ordenação
            if (filters.sort) {
                items.sort((a, b) => {
                    switch (filters.sort) {
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
            
            return items;
            
        } catch (error) {
            console.error('❌ Erro ao obter itens da lixeira:', error);
            return [];
        }
    }
    
    /**
     * 🆔 Gera ID único para item na lixeira
     */
    generateTrashId() {
        return `trash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 📅 Calcula data de expiração (30 dias)
     */
    calculateExpirationDate() {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + this.maxRetentionDays);
        return expirationDate.toISOString();
    }
    
    /**
     * 💾 Cria backup do item antes da exclusão
     */
    createItemBackup(item, category) {
        try {
            const backup = this.getBackupData();
            
            const backupEntry = {
                timestamp: new Date().toISOString(),
                type: 'item_deletion',
                category: category,
                data: JSON.parse(JSON.stringify(item))
            };
            
            backup.snapshots.unshift(backupEntry);
            
            // Mantém apenas os 20 backups mais recentes
            backup.snapshots = backup.snapshots.slice(0, 20);
            backup.metadata.lastBackup = backupEntry.timestamp;
            backup.metadata.totalBackups++;
            
            localStorage.setItem(this.backupKey, JSON.stringify(backup));
            
        } catch (error) {
            console.error('❌ Erro ao criar backup do item:', error);
        }
    }
    
    /**
     * 🧹 Sistema de limpeza automática
     */
    
    /**
     * 🕐 Inicia sistema de limpeza automática
     */
    startAutoCleanup() {
        try {
            console.log('🧹 Iniciando sistema de limpeza automática...');
            
            // Executa limpeza imediata
            this.performAutoCleanup();
            
            // Agenda limpeza periódica (a cada 6 horas)
            this.cleanupInterval = setInterval(() => {
                this.performAutoCleanup();
            }, 6 * 60 * 60 * 1000); // 6 horas
            
            // Agenda limpeza diária (meia-noite)
            this.scheduleDailyCleanup();
            
            console.log('✅ Sistema de limpeza automática iniciado');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar limpeza automática:', error);
        }
    }
    
    /**
     * 🛑 Para sistema de limpeza automática
     */
    stopAutoCleanup() {
        try {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
            
            if (this.dailyCleanupTimeout) {
                clearTimeout(this.dailyCleanupTimeout);
                this.dailyCleanupTimeout = null;
            }
            
            console.log('🛑 Sistema de limpeza automática parado');
            
        } catch (error) {
            console.error('❌ Erro ao parar limpeza automática:', error);
        }
    }
    
    /**
     * 🧹 Executa limpeza automática
     */
    performAutoCleanup() {
        try {
            console.log('🧹 Executando limpeza automática...');
            
            const trash = this.getTrashData();
            const now = new Date();
            const itemsToDelete = [];
            const itemsExpiringSoon = [];
            
            // Identifica itens expirados e próximos do vencimento
            trash.items.forEach(item => {
                const expirationDate = new Date(item.expirationDate);
                const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
                
                if (expirationDate <= now) {
                    // Item expirado - marcar para exclusão
                    itemsToDelete.push(item);
                } else if (daysUntilExpiration <= 7) {
                    // Item expira em breve - notificar
                    itemsExpiringSoon.push(item);
                }
            });
            
            // Remove itens expirados
            let deletedCount = 0;
            itemsToDelete.forEach(item => {
                const index = trash.items.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    trash.items.splice(index, 1);
                    deletedCount++;
                    
                    console.log(`🗑️ Item expirado removido: ${item.category} - ${item.originalId}`);
                }
            });
            
            // Atualiza metadados
            if (deletedCount > 0) {
                trash.metadata.lastAutoCleanup = now.toISOString();
                trash.metadata.totalAutoDeleted = (trash.metadata.totalAutoDeleted || 0) + deletedCount;
                trash.metadata.lastUpdate = now.toISOString();
                
                // Salva dados atualizados
                this.saveTrashData(trash);
                
                // Log da limpeza
                this.logCleanupActivity(deletedCount, itemsExpiringSoon.length);
                
                // Notifica sobre limpeza
                this.notifyCleanupResults(deletedCount, itemsExpiringSoon.length);
            }
            
            // Notifica sobre itens expirando em breve
            if (itemsExpiringSoon.length > 0) {
                this.notifyExpiringItems(itemsExpiringSoon);
            }
            
            console.log(`✅ Limpeza automática concluída: ${deletedCount} itens removidos, ${itemsExpiringSoon.length} expirando em breve`);
            
            return {
                deletedCount,
                expiringSoonCount: itemsExpiringSoon.length,
                totalItemsRemaining: trash.items.length
            };
            
        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error);
            return { error: error.message };
        }
    }
    
    /**
     * 📅 Agenda limpeza diária
     */
    scheduleDailyCleanup() {
        try {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // Meia-noite
            
            const msUntilMidnight = tomorrow.getTime() - now.getTime();
            
            this.dailyCleanupTimeout = setTimeout(() => {
                this.performAutoCleanup();
                // Reagenda para o próximo dia
                this.scheduleDailyCleanup();
            }, msUntilMidnight);
            
            console.log(`📅 Próxima limpeza diária agendada para: ${tomorrow.toLocaleString('pt-BR')}`);
            
        } catch (error) {
            console.error('❌ Erro ao agendar limpeza diária:', error);
        }
    }
    
    /**
     * 📝 Registra atividade de limpeza
     */
    logCleanupActivity(deletedCount, expiringSoonCount) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'auto_cleanup',
                deletedCount,
                expiringSoonCount,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Obtém logs existentes
            const logs = JSON.parse(localStorage.getItem(this.logsKey) || '[]');
            
            // Adiciona nova entrada
            logs.unshift(logEntry);
            
            // Mantém apenas os 50 logs mais recentes
            const trimmedLogs = logs.slice(0, 50);
            
            // Salva logs atualizados
            localStorage.setItem(this.logsKey, JSON.stringify(trimmedLogs));
            
            console.log('📝 Atividade de limpeza registrada:', logEntry);
            
        } catch (error) {
            console.error('❌ Erro ao registrar atividade de limpeza:', error);
        }
    }
    
    /**
     * 🔔 Notifica resultados da limpeza
     */
    notifyCleanupResults(deletedCount, expiringSoonCount) {
        try {
            if (deletedCount > 0) {
                const message = `Limpeza automática: ${deletedCount} item(s) expirado(s) removido(s)`;
                console.log(`🔔 ${message}`);
                
                // Notifica via sistema existente se disponível
                if (window.tagsTrashHandler && window.tagsTrashHandler.showNotification) {
                    window.tagsTrashHandler.showNotification(message, 'info');
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao notificar resultados da limpeza:', error);
        }
    }
    
    /**
     * ⚠️ Notifica sobre itens expirando em breve
     */
    notifyExpiringItems(itemsExpiringSoon) {
        try {
            if (itemsExpiringSoon.length > 0) {
                const message = `${itemsExpiringSoon.length} item(s) na lixeira expira(m) em breve`;
                console.log(`⚠️ ${message}`);
                
                // Notifica apenas uma vez por dia para não ser intrusivo
                const lastNotification = localStorage.getItem('trashExpirationNotification');
                const today = new Date().toDateString();
                
                if (lastNotification !== today) {
                    if (window.tagsTrashHandler && window.tagsTrashHandler.showNotification) {
                        window.tagsTrashHandler.showNotification(message, 'warning');
                    }
                    
                    localStorage.setItem('trashExpirationNotification', today);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao notificar itens expirando:', error);
        }
    }
    
    /**
     * 📊 Obtém estatísticas de limpeza
     */
    getCleanupStats() {
        try {
            const trash = this.getTrashData();
            const logs = JSON.parse(localStorage.getItem(this.logsKey) || '[]');
            
            const now = new Date();
            const itemsExpiringSoon = trash.items.filter(item => {
                const expirationDate = new Date(item.expirationDate);
                const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
            });
            
            const itemsExpiredNow = trash.items.filter(item => {
                const expirationDate = new Date(item.expirationDate);
                return expirationDate <= now;
            });
            
            return {
                totalAutoDeleted: trash.metadata.totalAutoDeleted || 0,
                lastAutoCleanup: trash.metadata.lastAutoCleanup || null,
                itemsExpiringSoon: itemsExpiringSoon.length,
                itemsExpiredNow: itemsExpiredNow.length,
                totalCleanupLogs: logs.length,
                isAutoCleanupActive: !!this.cleanupInterval
            };
            
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas de limpeza:', error);
            return {};
        }
    }
    
    /**
     * 🔧 Configura sistema de limpeza
     */
    configureCleanup(options = {}) {
        try {
            const config = {
                enabled: options.enabled !== false, // Padrão: habilitado
                intervalHours: options.intervalHours || 6, // Padrão: 6 horas
                maxRetentionDays: options.maxRetentionDays || this.maxRetentionDays, // Padrão: 30 dias
                notifyExpiring: options.notifyExpiring !== false, // Padrão: habilitado
                notifyCleanup: options.notifyCleanup !== false // Padrão: habilitado
            };
            
            // Salva configuração
            localStorage.setItem('trashCleanupConfig', JSON.stringify(config));
            
            // Reinicia sistema com nova configuração
            this.stopAutoCleanup();
            
            if (config.enabled) {
                // Atualiza configurações
                this.maxRetentionDays = config.maxRetentionDays;
                
                // Reinicia com novo intervalo
                this.cleanupInterval = setInterval(() => {
                    this.performAutoCleanup();
                }, config.intervalHours * 60 * 60 * 1000);
                
                this.scheduleDailyCleanup();
            }
            
            console.log('🔧 Sistema de limpeza reconfigurado:', config);
            return config;
            
        } catch (error) {
            console.error('❌ Erro ao configurar limpeza:', error);
            return null;
        }
    }
    
    /**
     * 📋 Obtém configuração de limpeza
     */
    getCleanupConfig() {
        try {
            const defaultConfig = {
                enabled: true,
                intervalHours: 6,
                maxRetentionDays: this.maxRetentionDays,
                notifyExpiring: true,
                notifyCleanup: true
            };
            
            const savedConfig = localStorage.getItem('trashCleanupConfig');
            
            if (savedConfig) {
                return { ...defaultConfig, ...JSON.parse(savedConfig) };
            }
            
            return defaultConfig;
            
        } catch (error) {
            console.error('❌ Erro ao obter configuração de limpeza:', error);
            return null;
        }
    }
    
    /**
     * 🧪 Função de teste do sistema
     */
    test() {
        console.log('🧪 Testando TrashManager...');
        
        try {
            // Teste 1: Inicialização
            const isInitialized = this.isInitialized;
            
            // Teste 2: Armazenamento
            const canStore = this.checkStorageSupport();
            
            // Teste 3: Estatísticas
            const stats = this.getStats();
            const hasStats = typeof stats === 'object' && !stats.error;
            
            // Teste 4: Backup
            const backupData = this.getBackupData();
            const hasBackup = backupData && Array.isArray(backupData.snapshots);
            
            const results = {
                initialization: isInitialized,
                storage: canStore,
                statistics: hasStats,
                backup: hasBackup
            };
            
            const allTestsPass = Object.values(results).every(Boolean);
            
            console.log(allTestsPass ? '✅ Todos os testes passaram!' : '❌ Alguns testes falharam:', results);
            
            return {
                results,
                stats,
                allTestsPass
            };
            
        } catch (error) {
            console.error('❌ Erro nos testes:', error);
            return { error: error.message, allTestsPass: false };
        }
    }
}

// Instância singleton
let trashManagerInstance = null;

/**
 * 🏭 Factory function para obter instância do TrashManager
 */
function getTrashManager() {
    if (!trashManagerInstance) {
        trashManagerInstance = new TrashManager();
    }
    return trashManagerInstance;
}

// Exposição global
if (typeof window !== 'undefined') {
    window.TrashManager = TrashManager;
    window.getTrashManager = getTrashManager;
    
    // Inicializa automaticamente
    window.trashManager = getTrashManager();
    
    console.log('🗑️ TrashManager disponível globalmente');
}

export { TrashManager, getTrashManager };
export default TrashManager;
