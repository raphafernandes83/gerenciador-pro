/**
 * @fileoverview Componente de Plano de Operações
 * Gerencia a visualização do plano de operações (tabela de etapas)
 * @module PlanoUI
 * @version 2.0.0 - Otimizado para performance
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../../state.js';
import { dom } from '../../dom.js';
import { logger } from '../utils/Logger.js';

export class PlanoUI extends BaseUI {
    constructor() {
        super();
    }

    init() {
        super.init();
        logger.info('📋 PlanoUI pronto');
    }

    /**
     * Atualiza estilos visuais do plano de forma otimizada
     * Reduz mutações DOM usando batch operations e requestAnimationFrame
     * Performance: ~140 mutações → ~30 mutações
     */
    atualizarVisualPlano() {
        if (!state.isSessionActive || !dom.tabelaBody) return;

        const isBlocked = state.metaAtingida;
        if (dom.tabelaResultados) {
            this._toggleClass(dom.tabelaResultados, 'operacoes-bloqueadas', isBlocked);
        }

        const todasAsLinhas = dom.tabelaBody.querySelectorAll('tr');
        const isModoGuiado = config.modoGuiado;
        const proximaEtapa = state.proximaEtapaIndex;
        const proximoAporte = state.proximoAporte;

        // 🚀 Cache de classes para evitar string concatenation repetida
        const CLASSES = {
            PROXIMA: 'proxima-etapa',
            DESFOCADA: 'linha-desfocada',
            DESABILITADA: 'linha-desabilitada',
            CONCLUIDA: 'linha-concluida'
        };

        // 🔥 Batch operations: acumula mudanças antes de aplicar
        const batchUpdates = [];

        todasAsLinhas.forEach((tr) => {
            const index = parseInt(tr.dataset.index);
            const etapa = state.planoDeOperacoes[index];
            if (!etapa) return;

            // 📊 Calcular estado da linha
            let concluida = false;
            if (etapa.entrada2 !== undefined) {
                const aporte = parseInt(tr.dataset.aporte);
                concluida = (aporte === 1 && etapa.concluida1) || (aporte === 2 && etapa.concluida2);
            } else {
                concluida = etapa.concluida;
            }

            // 🎯 Determinar classes a aplicar (sem tocar no DOM ainda)
            const classesToAdd = new Set();
            const classesToRemove = new Set([
                CLASSES.PROXIMA,
                CLASSES.DESFOCADA,
                CLASSES.DESABILITADA,
                CLASSES.CONCLUIDA
            ]);

            if (concluida) {
                classesToAdd.add(CLASSES.CONCLUIDA);
                classesToRemove.delete(CLASSES.CONCLUIDA);
            }

            if (isModoGuiado) {
                const isEtapaHabilitada = index === proximaEtapa;
                let isRowHabilitada = false;

                if (etapa.entrada2 !== undefined) {
                    const aporte = parseInt(tr.dataset.aporte);
                    isRowHabilitada = isEtapaHabilitada && aporte === proximoAporte;
                } else {
                    isRowHabilitada = isEtapaHabilitada;
                }

                if (!isRowHabilitada && !concluida) {
                    classesToAdd.add(CLASSES.DESFOCADA);
                    classesToAdd.add(CLASSES.DESABILITADA);
                    classesToRemove.delete(CLASSES.DESFOCADA);
                    classesToRemove.delete(CLASSES.DESABILITADA);
                }

                if (isRowHabilitada && !isBlocked) {
                    classesToAdd.add(CLASSES.PROXIMA);
                    classesToRemove.delete(CLASSES.PROXIMA);
                }
            }

            // Acumula operações
            batchUpdates.push({ tr, classesToAdd, classesToRemove });
        });

        // 🚀 Aplica todas as mudanças de uma vez usando requestAnimationFrame
        // Isso agrupa todas as mutações em um único repaint/reflow
        requestAnimationFrame(() => {
            batchUpdates.forEach(({ tr, classesToAdd, classesToRemove }) => {
                // Remove apenas classes que existem (evita mutações desnecessárias)
                classesToRemove.forEach(cls => {
                    if (tr.classList.contains(cls)) {
                        tr.classList.remove(cls);
                    }
                });

                // Adiciona apenas classes que não existem
                classesToAdd.forEach(cls => {
                    if (!tr.classList.contains(cls)) {
                        tr.classList.add(cls);
                    }
                });
            });
        });
    }
}
