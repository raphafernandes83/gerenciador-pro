import { CONSTANTS } from './state.js';
import { sanitizeSessionData, generateRequestId } from './src/utils/SecurityUtils.js';
import { logger } from './src/utils/Logger.js';
import { performanceTracker } from './src/monitoring/PerformanceTracker.js';

// Módulo para gerir a base de dados IndexedDB.
let db = null; // Private db instance

function normalizeAndCoerceSession(raw) {
    const sanitized = sanitizeSessionData(raw);
    if (!sanitized) return null;
    sanitized.historicoCombinado = Array.isArray(sanitized.historicoCombinado)
        ? sanitized.historicoCombinado.filter((op) => op && typeof op === 'object')
        : [];
    sanitized.totalOperacoes = sanitized.historicoCombinado.length;
    // 🔧 CORREÇÃO CRÍTICA: Só recalcular resultadoFinanceiro se for inválido
    if (typeof sanitized.resultadoFinanceiro !== 'number' || isNaN(sanitized.resultadoFinanceiro)) {
        sanitized.resultadoFinanceiro = sanitized.historicoCombinado.reduce((acc, op) => {
            if (op && typeof op.valor === 'number' && !isNaN(op.valor)) {
                return acc + op.valor;
            }
            return acc;
        }, 0);
        logger.warn(
            `[DB][normalizeAndCoerceSession] resultadoFinanceiro inválido, recalculado para: ${sanitized.resultadoFinanceiro}`
        );
    }

    // Log para debug se houve recalculo
    if (raw.resultadoFinanceiro !== sanitized.resultadoFinanceiro) {
        console.warn('🔧 ResultadoFinanceiro recalculado na normalização:', {
            original: raw.resultadoFinanceiro,
            recalculado: sanitized.resultadoFinanceiro,
            sessionId: raw.id,
        });
    }
    sanitized.data = typeof sanitized.data === 'number' ? sanitized.data : Date.now();
    sanitized.modo = typeof sanitized.modo === 'string' ? sanitized.modo : 'indefinido';
    return sanitized;
}

function ensureRequestId(requestId, prefix) {
    return requestId || generateRequestId(prefix);
}

export const dbManager = {
    init() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(CONSTANTS.DB_NAME, CONSTANTS.DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const dbInstance = event.target.result;
                    if (!dbInstance.objectStoreNames.contains(CONSTANTS.STORE_NAME)) {
                        const store = dbInstance.createObjectStore(CONSTANTS.STORE_NAME, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        store.createIndex('data', 'data', { unique: false });
                        store.createIndex('modo', 'modo', { unique: false });
                    }

                    // Lixeira (soft delete) - armazena sessões/operacoes por 30 dias
                    if (!dbInstance.objectStoreNames.contains('trash')) {
                        const trash = dbInstance.createObjectStore('trash', {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        trash.createIndex('expireAt', 'expireAt', { unique: false });
                        trash.createIndex('type', 'type', { unique: false });
                    }
                };

                request.onsuccess = (event) => {
                    db = event.target.result;
                    console.log('Base de dados IndexedDB iniciada com sucesso.');
                    resolve(true);
                };

                request.onerror = (event) => {
                    logger.error('Erro ao iniciar IndexedDB', {
                        error: String(event.target.error),
                    });
                    reject(event.target.error);
                };
            } catch (error) {
                logger.error('Erro crítico ao inicializar IndexedDB', { error: String(error) });
                reject(error);
            }
        });
    },

    addSession(sessionData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const safeData = normalizeAndCoerceSession(sessionData);
            if (!safeData) return reject('Dados de sessão inválidos.');
            const requestId = ensureRequestId(sessionData?.requestId, 'idb_add');

            // Inicia tracking de performance
            performanceTracker.startOperation('db_add_session', requestId, {
                sessionId: safeData.id,
                operations: safeData.totalOperacoes,
            });

            logger
                .withRequest(requestId)
                .info('IDB:addSession:start', {
                    id: safeData.id,
                    modo: safeData.modo,
                    totalOperacoes: safeData.totalOperacoes,
                });
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const request = store.add(safeData);
            request.onsuccess = () => {
                performanceTracker.finishOperation(requestId, 'success');
                logger.withRequest(requestId).info('IDB:addSession:success');
                resolve(true);
            };
            request.onerror = (event) => {
                performanceTracker.finishOperation(requestId, 'error', {
                    error: String(event.target.error),
                });
                logger
                    .withRequest(requestId)
                    .error('IDB:addSession:error', { error: String(event.target.error) });
                reject(event.target.error);
            };
        });
    },

    deleteSession(id, { requestId: externalRequestId } = {}) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const requestId = ensureRequestId(externalRequestId, 'idb_del');
            logger.withRequest(requestId).info('IDB:deleteSession:start', { id });
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => {
                logger.withRequest(requestId).info('IDB:deleteSession:success', { id });
                resolve(true);
            };
            request.onerror = (event) => {
                logger
                    .withRequest(requestId)
                    .error('IDB:deleteSession:error', { id, error: String(event.target.error) });
                reject(event.target.error);
            };
        });
    },






    getAllSessions() {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const request = store.getAll();
            request.onsuccess = (event) =>
                resolve(event.target.result.sort((a, b) => a.data - b.data));
            request.onerror = (event) => reject(event.target.error);
        });
    },

    updateSession(sessionData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const safeData = normalizeAndCoerceSession(sessionData);
            if (!safeData || typeof safeData.id === 'undefined')
                return reject('Dados de sessão inválidos.');
            const requestId = ensureRequestId(sessionData?.requestId, 'idb_upd');
            logger
                .withRequest(requestId)
                .info('IDB:updateSession:start', {
                    id: safeData.id,
                    totalOperacoes: safeData.totalOperacoes,
                });
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const request = store.put(safeData);
            request.onsuccess = () => {
                logger
                    .withRequest(requestId)
                    .info('IDB:updateSession:success', { id: safeData.id });
                resolve(true);
            };
            request.onerror = (event) => {
                logger
                    .withRequest(requestId)
                    .error('IDB:updateSession:error', {
                        id: safeData.id,
                        error: String(event.target.error),
                    });
                reject(event.target.error);
            };
        });
    },

    getSessionsByMode(mode) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const index = store.index('modo');
            const request = index.getAll(mode);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    getSessionById(id) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONSTANTS.STORE_NAME);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    addSessionsBatch(sessions, { requestId: externalRequestId } = {}) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            if (!Array.isArray(sessions) || sessions.length === 0)
                return resolve({
                    successCount: 0,
                    total: 0,
                    requestId: ensureRequestId(externalRequestId, 'idb_add_batch'),
                });
            const requestId = ensureRequestId(externalRequestId, 'idb_add_batch');
            const prepared = sessions.map(normalizeAndCoerceSession);
            if (prepared.some((s) => !s)) {
                return reject('Lista contém sessões inválidas.');
            }
            logger.withRequest(requestId).info('IDB:addBatch:start', { total: prepared.length });
            const tx = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = tx.objectStore(CONSTANTS.STORE_NAME);
            let success = 0;
            tx.oncomplete = () => {
                logger
                    .withRequest(requestId)
                    .info('IDB:addBatch:complete', {
                        successCount: success,
                        total: prepared.length,
                    });
                resolve({ successCount: success, total: prepared.length, requestId });
            };
            tx.onerror = (event) => {
                logger
                    .withRequest(requestId)
                    .error('IDB:addBatch:error', { error: String(event.target.error) });
                reject(event.target.error);
            };
            for (const s of prepared) {
                const req = store.add(s);
                req.onsuccess = () => {
                    success += 1;
                };
                req.onerror = () => {
                    /* erro abortará a transação; onerror de tx cuidará do reject */
                };
            }
        });
    },

    updateSessionsBatch(sessions, { requestId: externalRequestId } = {}) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            if (!Array.isArray(sessions) || sessions.length === 0)
                return resolve({
                    successCount: 0,
                    total: 0,
                    requestId: ensureRequestId(externalRequestId, 'idb_upd_batch'),
                });
            const requestId = ensureRequestId(externalRequestId, 'idb_upd_batch');
            const prepared = sessions.map(normalizeAndCoerceSession);
            if (prepared.some((s) => !s || typeof s.id === 'undefined')) {
                return reject('Lista contém sessões inválidas (id ausente).');
            }
            logger.withRequest(requestId).info('IDB:updateBatch:start', { total: prepared.length });
            const tx = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = tx.objectStore(CONSTANTS.STORE_NAME);
            let success = 0;
            tx.oncomplete = () => {
                logger
                    .withRequest(requestId)
                    .info('IDB:updateBatch:complete', {
                        successCount: success,
                        total: prepared.length,
                    });
                resolve({ successCount: success, total: prepared.length, requestId });
            };
            tx.onerror = (event) => {
                logger
                    .withRequest(requestId)
                    .error('IDB:updateBatch:error', { error: String(event.target.error) });
                reject(event.target.error);
            };
            for (const s of prepared) {
                const req = store.put(s);
                req.onsuccess = () => {
                    success += 1;
                };
                req.onerror = () => {
                    /* transação abortará; tx.onerror cobrirá */
                };
            }
        });
    },

    deleteSessionsBatch(ids, { requestId: externalRequestId } = {}) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB não iniciada.');
            if (!Array.isArray(ids) || ids.length === 0)
                return resolve({
                    successCount: 0,
                    total: 0,
                    requestId: ensureRequestId(externalRequestId, 'idb_del_batch'),
                });
            const requestId = ensureRequestId(externalRequestId, 'idb_del_batch');
            logger.withRequest(requestId).info('IDB:deleteBatch:start', { total: ids.length });
            const tx = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            const store = tx.objectStore(CONSTANTS.STORE_NAME);
            let success = 0;
            tx.oncomplete = () => {
                logger
                    .withRequest(requestId)
                    .info('IDB:deleteBatch:complete', { successCount: success, total: ids.length });
                resolve({ successCount: success, total: ids.length, requestId });
            };
            tx.onerror = (event) => {
                logger
                    .withRequest(requestId)
                    .error('IDB:deleteBatch:error', { error: String(event.target.error) });
                reject(event.target.error);
            };
            for (const id of ids) {
                const req = store.delete(id);
                req.onsuccess = () => {
                    success += 1;
                };
                req.onerror = () => {
                    /* transação abortará; tx.onerror cobrirá */
                };
            }
        });
    },

    /**
     * Persiste instantaneamente o estado de uma sessão ativa no localStorage.
     * Mantém compatibilidade com a implementação anterior situada em logic.js.
     * Se nenhum estado for passado, nada é salvo.
     * @param {Object} sessionState - Objeto de estado da sessão a ser salvo
     */
    async saveActiveSession(sessionState) {
        try {
            if (!sessionState || typeof sessionState !== 'object') return false;
            localStorage.setItem(CONSTANTS.ACTIVE_SESSION_KEY, JSON.stringify(sessionState));
            return true;
        } catch (error) {
            logger.error('Erro ao salvar sessão ativa', { error: String(error) });
            return false;
        }
    },

    // Função para limpar dados corrompidos
    async clearCorruptedData() {
        console.log('🧹 Verificando e limpando dados corrompidos...');

        try {
            if (!db) {
                await this.init();
            }

            const transaction = db.transaction([CONSTANTS.STORE_NAME], 'readwrite');
            // Abertura de transação aqui para manter compatibilidade; operações em lote usarão sua própria transação
            transaction.abort();

            // Buscar todas as sessões
            const allSessions = await this.getAllSessions();
            let removedCount = 0;
            const toRemove = [];

            for (const session of allSessions) {
                // Verificar se a sessão tem dados válidos
                const isCorrupted =
                    !session.data ||
                    session.resultadoFinanceiro === undefined ||
                    session.totalOperacoes === undefined ||
                    session.modo === undefined ||
                    !Array.isArray(session.historicoCombinado);

                if (isCorrupted) {
                    toRemove.push(session.id);
                }
            }

            if (toRemove.length > 0) {
                const requestId = generateRequestId('idb_cleanup');
                try {
                    const res = await this.deleteSessionsBatch(toRemove, { requestId });
                    removedCount = res.successCount;
                } catch (e) {
                    // fallback: tentar individual
                    for (const id of toRemove) {
                        try {
                            await this.deleteSession(id);
                            removedCount++;
                        } catch (_) {}
                    }
                }
            }

            console.log(`✅ Limpeza concluída. ${removedCount} sessões corrompidas removidas.`);
            return removedCount;
        } catch (error) {
            logger.error('❌ Erro ao limpar dados corrompidos', { error: String(error) });
            throw error;
        }
    },

    // Função para reparar dados corrompidos
    async repairCorruptedData() {
        console.log('🔧 Reparando dados corrompidos...');

        try {
            const allSessions = await this.getAllSessions();
            let repairedCount = 0;
            const toRepair = [];

            for (const session of allSessions) {
                let needsRepair = false;
                const repairedSession = { ...session };

                // Reparar campos básicos
                if (!repairedSession.data) {
                    repairedSession.data = Date.now();
                    needsRepair = true;
                }

                if (repairedSession.resultadoFinanceiro === undefined) {
                    repairedSession.resultadoFinanceiro = 0;
                    needsRepair = true;
                }

                if (repairedSession.totalOperacoes === undefined) {
                    repairedSession.totalOperacoes = 0;
                    needsRepair = true;
                }

                if (!repairedSession.modo) {
                    repairedSession.modo = 'indefinido';
                    needsRepair = true;
                }

                if (!Array.isArray(repairedSession.historicoCombinado)) {
                    repairedSession.historicoCombinado = [];
                    needsRepair = true;
                }

                if (needsRepair) {
                    toRepair.push(repairedSession);
                }
            }

            if (toRepair.length > 0) {
                const requestId = generateRequestId('idb_repair');
                try {
                    const res = await this.updateSessionsBatch(toRepair, { requestId });
                    repairedCount = res.successCount;
                } catch (e) {
                    // fallback individual
                    for (const s of toRepair) {
                        try {
                            await this.updateSession(s);
                            repairedCount++;
                        } catch (_) {}
                    }
                }
            }

            console.log(`✅ Reparo concluído. ${repairedCount} sessões reparadas.`);
            return repairedCount;
        } catch (error) {
            logger.error('❌ Erro ao reparar dados', { error: String(error) });
            throw error;
        }
    },

    /**
     * 🔧 Repara sessões com resultadoFinanceiro inválido
     * Recalcula valores a partir do histórico quando necessário
     */
    async repairInvalidResultados() {
        if (!db) return { repaired: 0, errors: 0 };

        try {
            const allSessions = await this.getAllSessions();
            let repaired = 0;
            let errors = 0;

            const sessionsToUpdate = [];

            for (const session of allSessions) {
                let needsRepair = false;
                const originalResultado = session.resultadoFinanceiro;

                // Verifica se resultadoFinanceiro é inválido
                if (
                    typeof session.resultadoFinanceiro !== 'number' ||
                    isNaN(session.resultadoFinanceiro)
                ) {
                    needsRepair = true;
                }

                if (needsRepair) {
                    // Recalcula a partir do histórico
                    const historico = Array.isArray(session.historicoCombinado)
                        ? session.historicoCombinado
                        : [];
                    const recalculatedResultado = historico.reduce((acc, op) => {
                        if (op && typeof op.valor === 'number' && !isNaN(op.valor)) {
                            return acc + op.valor;
                        }
                        return acc;
                    }, 0);

                    const repairedSession = {
                        ...session,
                        resultadoFinanceiro: recalculatedResultado,
                        totalOperacoes: historico.length,
                    };

                    sessionsToUpdate.push(repairedSession);

                    console.log(`🔧 Reparando sessão ${session.id}:`, {
                        original: originalResultado,
                        recalculado: recalculatedResultado,
                        operacoes: historico.length,
                    });

                    repaired++;
                }
            }

            // Atualiza sessões em lote se necessário
            if (sessionsToUpdate.length > 0) {
                try {
                    await this.updateSessionsBatch(sessionsToUpdate);
                    console.log(`✅ ${repaired} sessões reparadas com sucesso`);
                } catch (updateError) {
                    console.error('❌ Erro ao atualizar sessões reparadas:', updateError);
                    errors = sessionsToUpdate.length;
                }
            }

            return { repaired, errors, total: allSessions.length };
        } catch (error) {
            console.error('❌ Erro no reparo de resultados inválidos:', error);
            return { repaired: 0, errors: 1, error: error.message };
        }
    },
};
