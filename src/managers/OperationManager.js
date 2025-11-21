/**
 * GERENCIADOR DE OPERAÇÕES
 * 
 * Responsável por todo o ciclo de vida de uma operação:
 * - Início (preparação)
 * - Validação
 * - Cálculo de resultados
 * - Finalização e persistência
 * - Edição e Undo
 * 
 * @module OperationManager
 */

import { state, config, CONSTANTS } from '../../state.js';
import { dom } from '../../dom.js';
import { ui } from '../../ui.js';
import { logger } from '../utils/Logger.js';
import { safeLog, generateRequestId } from '../utils/SecurityUtils.js';
import { sessionManager } from './SessionManager.js';
import { dbManager } from '../../db.js';
import { events } from '../../events.js';
import { Features } from '../config/Features.js';
import { setState as setStoreState } from '../../state/sessionStore.js';

export const operationManager = {
    /**
     * Inicia o processo de registro de uma operação
     * @param {Object} dadosOperacao - Dados iniciais da operação (index, isWin, aporte)
     */
    iniciarRegistroOperacao(dadosOperacao) {
        console.log('🎯 INICIANDO REGISTRO DE OPERAÇÃO:', dadosOperacao);

        // VERIFICAÇÃO DE SEGURANÇA CRÍTICA
        if (!state.isSessionActive) {
            logger.error('❌ ERRO: Tentativa de registrar operação sem sessão ativa');
            ui.showModal({
                title: 'Sessão Inativa',
                message:
                    'Não é possível registrar operações sem uma sessão ativa. Clique em "Nova Sessão" para começar.',
            });
            return;
        }

        if (!dadosOperacao || typeof dadosOperacao.isWin !== 'boolean') {
            logger.error('❌ ERRO: Dados de operação inválidos', { dadosOperacao });
            ui.showModal({
                title: 'Erro de Dados',
                message: 'Dados da operação estão inválidos. Tente novamente.',
            });
            return;
        }

        if (!Array.isArray(state.planoDeOperacoes) || state.planoDeOperacoes.length === 0) {
            logger.error('❌ ERRO: Plano de operações não existe');
            ui.showModal({
                title: 'Erro de Plano',
                message: 'Plano de operações não foi calculado. Reinicie a sessão.',
            });
            return;
        }

        const etapa = state.planoDeOperacoes[dadosOperacao.index];
        if (!etapa) {
            logger.error('❌ ERRO: Etapa inválida no índice', { index: dadosOperacao.index });
            ui.showModal({
                title: 'Erro de Etapa',
                message: `Etapa ${dadosOperacao.index} não encontrada no plano.`,
            });
            return;
        }

        console.log('✅ VALIDAÇÕES PASSARAM - Salvando operação pendente');
        state.operacaoPendente = dadosOperacao;
        console.log('🎨 ABRINDO MODAL DE TAGS');
        ui.showTagsModal(dadosOperacao.isWin);
    },

    /**
     * Finaliza o registro da operação após seleção de tags/confirmação
     * @param {string} tag - Tag opcional selecionada
     */
    async finalizarRegistroOperacao(tag) {
        try {
            // 1. Validação inicial e preparação
            if (!this._validateOperationRequest()) return;

            // 2. Cálculo dos valores da operação
            const operationValues = this._calculateOperationValues();
            if (!operationValues) return;

            // 3. Criação do objeto operação
            const operacao = this._createOperationObject(operationValues, tag);

            // Padronização: garantir que 'valor' está presente e numérico
            if (typeof operacao.valor !== 'number' || isNaN(operacao.valor)) {
                if (
                    typeof operationValues?.resultado === 'number' &&
                    !isNaN(operationValues.resultado)
                ) {
                    operacao.valor = operationValues.resultado;
                } else if (typeof operacao.resultado === 'number' && !isNaN(operacao.resultado)) {
                    operacao.valor = operacao.resultado;
                } else {
                    operacao.valor = 0;
                }
            }

            // 4. Atualização do estado da aplicação
            this._updateApplicationState(operacao);

            // 5. Processamento pós-operação (AGORA ASSÍNCRONO)
            await this._processPostOperation(operacao);
        } catch (error) {
            logger.error('Erro ao finalizar registro de operação', { error: String(error) });
            ui.showModal({
                title: 'Erro de Sistema',
                message: 'Ocorreu um erro ao processar a operação. Tente novamente.',
            });
        } finally {
            // Sempre limpa estado pendente
            this._cleanupPendingOperation();
        }
    },

    /**
     * Valida se há operação pendente e etapa válida
     * @private
     */
    _validateOperationRequest() {
        if (dom.tagsModal) dom.tagsModal.classList.remove('show');

        if (!state.operacaoPendente) {
            logger.warn('Tentativa de finalizar operação sem operação pendente');
            return false;
        }

        const { index } = state.operacaoPendente;
        const etapa = state.planoDeOperacoes[index];

        if (!etapa) {
            logger.error('Erro: Tentativa de registrar operação para uma etapa inválida', {
                index,
            });
            ui.showModal({
                title: 'Erro de Plano',
                message:
                    'A etapa do plano não foi encontrada. A sessão pode precisar ser reiniciada.',
            });
            return false;
        }

        return true;
    },

    /**
     * Calcula valores de entrada, retorno e resultado
     * @private
     */
    _calculateOperationValues() {
        const { isWin, index, aporte } = state.operacaoPendente;
        const etapa = state.planoDeOperacoes[index];

        let valorEntrada, valorRetorno;

        if (config.estrategiaAtiva === CONSTANTS.STRATEGY.FIXED) {
            valorEntrada = etapa.entrada;
            valorRetorno = etapa.retorno;
        } else if (etapa.entrada2 === undefined) {
            valorEntrada = etapa.entrada;
            valorRetorno = etapa.retorno;
        } else {
            valorEntrada = aporte === 1 ? etapa.entrada1 : etapa.entrada2;
            valorRetorno = aporte === 1 ? etapa.retorno1 : etapa.retorno2;
        }

        const resultado = isWin ? valorRetorno : -valorEntrada;

        return { valorEntrada, valorRetorno, resultado, isWin, index, aporte };
    },

    /**
     * Cria objeto operação com todos os dados necessários
     * @private
     */
    _createOperationObject({ valorEntrada, valorRetorno, resultado, isWin }, tag) {
        const nota = dom.opNote ? dom.opNote.value.trim() : '';

        return {
            isWin,
            valor: resultado,
            valorEntrada,
            valorRetorno,
            payout: config.payout,
            tag,
            nota: nota || null,
            timestamp: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    },

    /**
     * Atualiza estado da aplicação com nova operação
     * @private
     */
    _updateApplicationState(operacao) {
        const { index, aporte } = state.operacaoPendente;
        const etapa = state.planoDeOperacoes[index];

        // Validação robusta do valor da operação
        if (!operacao || typeof operacao.valor !== 'number' || isNaN(operacao.valor)) {
            logger.error('❌ ERRO CRÍTICO: Valor da operação é inválido', {
                operacao: operacao,
                valor: operacao?.valor
            });

            ui.showModal({
                title: 'Erro Crítico de Dados',
                message:
                    'O valor da operação é inválido. A operação foi cancelada para proteger a integridade dos dados.',
            });
            throw new Error('Valor da operação inválido');
        }

        // Proteção: Validar capitalAtual antes da soma
        if (typeof state.capitalAtual !== 'number' || isNaN(state.capitalAtual)) {
            logger.error('❌ ERRO CRÍTICO: capitalAtual está corrompido');
            // Recuperação automática
            state.capitalAtual = this._recalcularCapitalSeguro();
        }

        // Cria snapshot para undo
        const snapshot = this.createStateSnapshot();
        state.undoStack.push({ snapshot, operacao });

        // Registra operação
        state.historicoCombinado.push(operacao);

        // Soma segura
        const novoCapital = state.capitalAtual + operacao.valor;

        // Validação pós-cálculo
        if (typeof novoCapital !== 'number' || isNaN(novoCapital)) {
            logger.error('❌ ERRO CRÍTICO: Resultado da soma é NaN');
            state.capitalAtual = this._recalcularCapitalSeguro();
        } else {
            state.capitalAtual = novoCapital;
        }

        // Marca etapa como concluída se necessário
        this._markStepAsCompleted(etapa, aporte);
    },

    /**
     * Recalcula capital de forma segura
     * @private
     */
    _recalcularCapitalSeguro() {
        try {
            let capitalRecalculado = state.capitalInicioSessao || config.capitalInicial || 0;

            if (typeof capitalRecalculado !== 'number' || isNaN(capitalRecalculado)) {
                capitalRecalculado = config.capitalInicial || 15000;
            }

            const historico = Array.isArray(state.historicoCombinado)
                ? state.historicoCombinado
                : [];

            for (const operacao of historico) {
                if (operacao && typeof operacao.valor === 'number' && !isNaN(operacao.valor)) {
                    capitalRecalculado += operacao.valor;
                }
            }

            return capitalRecalculado;
        } catch (error) {
            logger.error('❌ ERRO CRÍTICO no recálculo de capital:', error);
            return config.capitalInicial || 15000;
        }
    },

    /**
     * Marca etapa como concluída baseada na estratégia
     * @private
     */
    _markStepAsCompleted(etapa, aporte) {
        if (config.estrategiaAtiva === CONSTANTS.STRATEGY.CYCLES) {
            if (etapa.entrada2 === undefined) {
                etapa.concluida = true;
            } else {
                if (aporte === 1) etapa.concluida1 = true;
                else etapa.concluida2 = true;
            }
        }
    },

    /**
     * Executa processamento pós-operação
     * @private
     */
    async _processPostOperation(operacao) {
        const { isWin, index, aporte } = state.operacaoPendente;
        const resultado = operacao.valor;

        // Lógica de avanço do plano (delegada para logic.js por enquanto, ou mover depois)
        // IMPORTANTE: logic.js ainda contém logicaAvancoPlano e verificarMetas
        // Vamos assumir que logic.js exporta essas funções ou as moveremos em seguida.
        // Por enquanto, vamos chamar via window.logic se necessário, ou importar se possível.
        // Como logic.js importa operationManager, não podemos importar logic.js aqui (ciclo).
        // Solução: Injeção de dependência ou mover essas funções também.
        // Vou mover logicaAvancoPlano e verificarMetas para cá também se possível, 
        // mas elas dependem de muitas coisas.
        // Por agora, vou usar window.logic para evitar ciclo imediato, mas o ideal é refatorar tudo.

        if (window.logic && window.logic.logicaAvancoPlano) {
            window.logic.logicaAvancoPlano(isWin, index, aporte, resultado);
        }

        // Sincronização Otimizada
        if (
            window.tradingManager &&
            typeof window.tradingManager._syncStateFromLegacy === 'function'
        ) {
            try {
                window.tradingManager._syncStateFromLegacy(state, config);
            } catch (error) {
                console.error('❌ [SYNC] Erro ao sincronizar TradingOperationsManager:', error);
            }
        }

        // Verificação de metas
        let metaInfo = { metaAtingidaHoje: false };
        if (window.logic && window.logic.verificarMetas) {
            metaInfo = window.logic.verificarMetas();
        }

        // Persistência
        sessionManager.saveActiveSession();

        // Atualização UI
        ui.analisarPerformanceRecente();
        ui.adicionarItemTimeline(operacao, state.historicoCombinado.length - 1);
        await ui.atualizarDashboardSessao();

        ui.atualizarVisualPlano();
        if (window.logic && window.logic.updateProgressCharts) {
            window.logic.updateProgressCharts();
        }

        // Store update
        try {
            if (
                (window.Features && window.Features.FEATURE_store_pubsub) ||
                Features.FEATURE_store_pubsub
            ) {
                setStoreState({
                    capitalAtual: state.capitalAtual,
                    historicoCombinado: Array.isArray(state.historicoCombinado)
                        ? state.historicoCombinado.slice()
                        : [],
                });
            }
        } catch (_) { }

        // Refresh visual
        requestAnimationFrame(() => {
            ui.atualizarStatusIndicadores();
            try {
                if (ui.renderizarTimelineCompleta && Array.isArray(state.historicoCombinado)) {
                    ui.renderizarTimelineCompleta(state.historicoCombinado);
                }
            } catch (error) {
                console.error('❌ [TIMELINE] Erro na renderização forçada:', error);
            }
        });

        // Tratamento de meta atingida
        if (metaInfo.metaAtingidaHoje) {
            events.handleMetaAtingida(metaInfo.tipoMeta);
        }
    },

    /**
     * Limpa estado de operação pendente
     * @private
     */
    _cleanupPendingOperation() {
        state.operacaoPendente = null;
    },

    createStateSnapshot() {
        return {
            capitalAtual: state.capitalAtual,
            capitalDeCalculo: state.capitalDeCalculo,
            proximaEtapaIndex: state.proximaEtapaIndex,
            proximoAporte: state.proximoAporte,
            planoDeOperacoes: JSON.parse(JSON.stringify(state.planoDeOperacoes)),
            historicoCombinado: JSON.parse(JSON.stringify(state.historicoCombinado)),
            metaAtingida: state.metaAtingida,
            alertaStopWin80Mostrado: state.alertaStopWin80Mostrado,
            alertaStopLoss80Mostrado: state.alertaStopLoss80Mostrado,
        };
    },

    /**
     * Desfaz a última operação
     */
    desfazerOperacao() {
        if (state.undoStack.length === 0) return;
        const lastState = state.undoStack.pop();
        const snapshot = lastState.snapshot;

        state.capitalAtual = snapshot.capitalAtual;
        state.capitalDeCalculo = snapshot.capitalDeCalculo;
        state.proximaEtapaIndex = snapshot.proximaEtapaIndex;
        state.proximoAporte = snapshot.proximoAporte;
        state.planoDeOperacoes = snapshot.planoDeOperacoes;
        state.historicoCombinado = snapshot.historicoCombinado;
        state.metaAtingida = snapshot.metaAtingida;
        state.alertaStopWin80Mostrado = snapshot.alertaStopWin80Mostrado;
        state.alertaStopLoss80Mostrado = snapshot.alertaStopLoss80Mostrado;

        sessionManager.saveActiveSession();
        ui.mostrarInsightPopup('Última operação desfeita.', '↶');
        ui.analisarPerformanceRecente();

        ui.removerUltimoItemTimeline();
        ui.renderizarTabela();
        ui.atualizarDashboardSessao();
    },

    /**
     * Edita uma operação no histórico de replay
     */
    async editReplayedOperation(sessionId, opIndex, newResult) {
        try {
            const sessao = await dbManager.getSessionById(sessionId);
            if (!sessao || !sessao.historicoCombinado[opIndex]) return;

            const opAntiga = sessao.historicoCombinado[opIndex];
            const novoResultadoValor = opAntiga.isWin ? -opAntiga.valor : Math.abs(opAntiga.valor);

            const novaOp = {
                ...opAntiga,
                isWin: newResult,
                valor: newResult ? Math.abs(novoResultadoValor) : -Math.abs(novoResultadoValor),
            };
            sessao.historicoCombinado[opIndex] = novaOp;
            sessao.resultadoFinanceiro = sessao.historicoCombinado.reduce(
                (acc, op) => acc + op.valor,
                0
            );

            const requestId = generateRequestId('sess_edit');
            sessao.requestId = requestId;
            safeLog('LOGIC:editReplayedOperation:update', {
                requestId,
                sessionId,
                opIndex,
                newResult,
            });
            await dbManager.updateSession(sessao);

            await ui.showReplayModal(sessionId);
            ui.mostrarInsightPopup('Operação editada com sucesso!', '✏️');
            try {
                document.dispatchEvent(
                    new CustomEvent('sessionEdited', { detail: { sessionId } })
                );
            } catch (_) { }
        } catch (error) {
            logger.error('Erro ao editar operação arquivada', { error: String(error) });
            ui.showModal({ title: 'Erro', message: 'Não foi possível editar a operação.' });
        }
    },

    /**
     * Edita uma operação na sessão atual
     */
    editOperation(opIndex, newIsWin) {
        if (opIndex < 0 || opIndex >= state.historicoCombinado.length) return;

        const op = state.historicoCombinado[opIndex];
        if (op.isWin === newIsWin) return;

        // Cria snapshot antes de editar
        const snapshot = this.createStateSnapshot();
        state.undoStack.push({ snapshot, operacao: { ...op } });

        // Atualiza operação
        const valorAntigo = op.valor;
        op.isWin = newIsWin;
        // Recalcula valor (simplificado, idealmente deveria recalcular tudo)
        // Se era win e virou loss: valor positivo -> negativo (perda do aporte)
        // Se era loss e virou win: valor negativo -> positivo (lucro)
        // Isso é complexo pois depende do payout e aporte originais.
        // Tenta recuperar do plano se possível, ou estimar.

        // Fallback simples: inverte sinal se valor for consistente com aporte
        // Mas cuidado: Win = Aporte * Payout, Loss = -Aporte. Não é simétrico.

        // Melhor abordagem: Recalcular baseado nos dados originais se disponíveis
        if (op.valorEntrada && op.valorRetorno) {
            op.valor = newIsWin ? op.valorRetorno : -op.valorEntrada;
        } else {
            // Fallback arriscado, melhor avisar
            logger.warn('Editando operação sem dados completos de entrada/retorno');
            // Tenta estimar
            if (newIsWin) {
                // Loss -> Win
                // Era -Aporte. Agora é Aporte * Payout.
                // Aporte = Math.abs(valorAntigo)
                const aporteEstimado = Math.abs(valorAntigo);
                const payoutFactor = (op.payout || config.payout) / 100;
                op.valor = aporteEstimado * payoutFactor;
            } else {
                // Win -> Loss
                // Era Aporte * Payout. Agora é -Aporte.
                // Aporte = valorAntigo / PayoutFactor
                const payoutFactor = (op.payout || config.payout) / 100;
                const aporteEstimado = valorAntigo / payoutFactor;
                op.valor = -aporteEstimado;
            }
        }

        // Atualiza capital
        const diferenca = op.valor - valorAntigo;
        state.capitalAtual += diferenca;

        // Persiste e atualiza UI
        sessionManager.saveActiveSession();
        ui.atualizarTudo();
        ui.mostrarInsightPopup('Operação editada.', '✏️');
    }
};
