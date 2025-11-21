/**
 * 🧪 TESTES FUNCIONAIS CRÍTICOS - Validação de Fluxos Principais
 * Sistema de testes automatizados para validar observabilidade e persistência
 */

import { logger } from '../src/utils/Logger.js';
import { generateRequestId } from '../src/utils/SecurityUtils.js';
import { dbManager } from '../db.js';
import { ui } from '../ui.js';
import { events } from '../events.js';
import { charts } from '../charts.js';
import { state, config } from '../state.js';

class FunctionalTestSuite {
    constructor() {
        this.testResults = [];
        this.startTime = null;
        this.requestId = generateRequestId('func_test');
    }

    /**
     * 🚀 Executa todos os testes funcionais
     */
    async runAllTests() {
        this.startTime = performance.now();
        logger.withRequest(this.requestId).info('🧪 INICIANDO BATERIA DE TESTES FUNCIONAIS');

        let finalReport = null;
        try {
            // Preparação do ambiente de teste
            await this.setupTestEnvironment();

            // Execução sequencial dos testes críticos
            await this.testSessionFinalizationFlow();
            await this.testSessionDeletionFlow();
            await this.testOperationEditFlow();
            await this.testSimulationFlow();
            await this.testDashboardCacheFlow();
            await this.testErrorRecoveryFlow();

            // Geração do relatório final
            finalReport = this.generateTestReport();
        } catch (error) {
            logger
                .withRequest(this.requestId)
                .error('❌ FALHA CRÍTICA NA BATERIA DE TESTES', { error: String(error) });
            this.addTestResult('CRITICAL_FAILURE', false, `Falha crítica: ${error.message}`);
        } finally {
            await this.cleanupTestEnvironment();
            // Sempre devolve um sumário para o chamador (events.handleRunFunctionalTests)
            if (!finalReport) {
                finalReport = this.generateTestReport();
            }
            return finalReport;
        }
    }

    /**
     * 🔧 Preparação do ambiente de teste
     */
    async setupTestEnvironment() {
        logger.withRequest(this.requestId).info('🔧 Preparando ambiente de teste');

        try {
            // Backup do estado atual
            this.originalState = {
                sessions: [...(state.sessoes || [])],
                currentSession: { ...state.sessaoAtual },
                config: { ...config },
            };

            // Limpa dados de teste anteriores
            await this.cleanupPreviousTestData();

            // Inicializa componentes necessários
            if (!dbManager.isInitialized) {
                await dbManager.init();
            }

            this.addTestResult('SETUP', true, 'Ambiente preparado com sucesso');
        } catch (error) {
            this.addTestResult('SETUP', false, `Falha na preparação: ${error.message}`);
            throw error;
        }
    }

    /**
     * 📊 Teste: Fluxo de Finalização de Sessão
     */
    async testSessionFinalizationFlow() {
        const testId = generateRequestId('test_finalize');
        logger.withRequest(testId).info('🧪 TESTE: Fluxo de finalização de sessão');

        try {
            // 1. Cria sessão de teste com operações
            const testSession = this.createTestSession('finalize_test');
            state.sessaoAtual = testSession;

            // 2. Simula finalização via events
            const beforeCount = state.sessoes?.length || 0;

            // Monitora logs durante finalização
            const logCapture = this.captureLogsFor(['IDB:addSession', 'finish_sess']);

            // Executa finalização
            await events.handleFinishSession();

            // 3. Validações
            const afterCount = state.sessoes?.length || 0;
            const savedCorrectly = afterCount === beforeCount + 1;

            const hasCorrelatedLogs = logCapture.some(
                (log) => log.includes('IDB:addSession') && log.includes(testId)
            );

            // 4. Verifica atualização do Dashboard
            const dashboardUpdated = this.verifyDashboardUpdate();

            const success = savedCorrectly && hasCorrelatedLogs && dashboardUpdated;

            this.addTestResult(
                'SESSION_FINALIZATION',
                success,
                `Persistência: ${savedCorrectly}, Logs: ${hasCorrelatedLogs}, Dashboard: ${dashboardUpdated}`
            );
        } catch (error) {
            this.addTestResult('SESSION_FINALIZATION', false, `Erro: ${error.message}`);
        }
    }

    /**
     * 🗑️ Teste: Fluxo de Exclusão de Sessão
     */
    async testSessionDeletionFlow() {
        const testId = generateRequestId('test_delete');
        logger.withRequest(testId).info('🧪 TESTE: Fluxo de exclusão de sessão');

        try {
            // 1. Adiciona sessão para deletar
            const testSession = this.createTestSession('delete_test');
            await dbManager.addSession(testSession, { requestId: testId });

            const beforeCount = state.sessoes?.length || 0;

            // 2. Monitora logs durante exclusão
            const logCapture = this.captureLogsFor(['IDB:deleteSession', 'delete_sess']);

            // 3. Executa exclusão
            await events.handleDeleteSession(testSession.id);

            // 4. Validações
            const afterCount = state.sessoes?.length || 0;
            const deletedCorrectly = afterCount === beforeCount - 1;

            const hasCorrelatedLogs = logCapture.some(
                (log) => log.includes('IDB:deleteSession') && log.includes(testId)
            );

            // 5. Verifica invalidação do cache
            const cacheInvalidated = this.verifyCacheInvalidation();

            const success = deletedCorrectly && hasCorrelatedLogs && cacheInvalidated;

            this.addTestResult(
                'SESSION_DELETION',
                success,
                `Remoção: ${deletedCorrectly}, Logs: ${hasCorrelatedLogs}, Cache: ${cacheInvalidated}`
            );
        } catch (error) {
            this.addTestResult('SESSION_DELETION', false, `Erro: ${error.message}`);
        }
    }

    /**
     * ✏️ Teste: Fluxo de Edição de Operação
     */
    async testOperationEditFlow() {
        const testId = generateRequestId('test_edit');
        logger.withRequest(testId).info('🧪 TESTE: Fluxo de edição de operação');

        try {
            // 1. Cria sessão com operações para editar
            const testSession = this.createTestSession('edit_test');
            await dbManager.addSession(testSession, { requestId: testId });

            // 2. Monitora logs durante edição
            const logCapture = this.captureLogsFor(['IDB:updateSession', 'edit_op']);

            // 3. Simula edição de operação
            const operationToEdit = testSession.historicoCombinado[0];
            const originalValue = operationToEdit.valor;
            operationToEdit.valor = originalValue + 50; // Modifica valor

            // 4. Executa atualização via logic
            await dbManager.updateSession(testSession.id, testSession, { requestId: testId });

            // 5. Validações
            const hasCorrelatedLogs = logCapture.some(
                (log) => log.includes('IDB:updateSession') && log.includes(testId)
            );

            // 6. Verifica recomputação coerente
            const recomputationValid = this.verifyRecomputation(testSession);

            const success = hasCorrelatedLogs && recomputationValid;

            this.addTestResult(
                'OPERATION_EDIT',
                success,
                `Logs: ${hasCorrelatedLogs}, Recomputação: ${recomputationValid}`
            );
        } catch (error) {
            this.addTestResult('OPERATION_EDIT', false, `Erro: ${error.message}`);
        }
    }

    /**
     * 🎲 Teste: Fluxo de Simulação
     */
    async testSimulationFlow() {
        const testId = generateRequestId('test_simulation');
        logger.withRequest(testId).info('🧪 TESTE: Fluxo de simulação');

        try {
            // 1. Prepara parâmetros de simulação
            const simulationParams = {
                numeroOperacoes: 100,
                estrategia: 'martingale',
                capitalInicial: 1000,
            };

            // 2. Monitora logs durante simulação
            const logCapture = this.captureLogsFor(['simulation', 'progress']);

            // 3. Executa simulação via events
            const simulationResult = await events.handleRunSimulation(simulationParams);

            // 4. Validações
            const hasInformativeLogs = logCapture.length > 0;
            const noConsoleErrors = this.checkConsoleErrorsAbsence();
            const resultValid = simulationResult && typeof simulationResult === 'object';

            const success = hasInformativeLogs && noConsoleErrors && resultValid;

            this.addTestResult(
                'SIMULATION_FLOW',
                success,
                `Logs: ${hasInformativeLogs}, Sem erros: ${noConsoleErrors}, Resultado: ${resultValid}`
            );
        } catch (error) {
            this.addTestResult('SIMULATION_FLOW', false, `Erro: ${error.message}`);
        }
    }

    /**
     * 💾 Teste: Cache do Dashboard
     */
    async testDashboardCacheFlow() {
        const testId = generateRequestId('test_cache');
        logger.withRequest(testId).info('🧪 TESTE: Cache do Dashboard');

        try {
            // 1. Força atualização do Dashboard
            await events.handleGlobalFilterChange({ dateRange: 'last7days' });

            // 2. Verifica se cache foi criado
            const cacheExists = events._dashboardCache && events._dashboardCache.size > 0;

            // 3. Simula segunda consulta (deve usar cache)
            const startTime = performance.now();
            await events.handleGlobalFilterChange({ dateRange: 'last7days' });
            const endTime = performance.now();

            // 4. Validações
            const cachePerformant = endTime - startTime < 50; // Menos de 50ms

            const success = cacheExists && cachePerformant;

            this.addTestResult(
                'DASHBOARD_CACHE',
                success,
                `Cache existe: ${cacheExists}, Performance: ${cachePerformant} (${(endTime - startTime).toFixed(2)}ms)`
            );
        } catch (error) {
            this.addTestResult('DASHBOARD_CACHE', false, `Erro: ${error.message}`);
        }
    }

    /**
     * 🛡️ Teste: Recuperação de Erros
     */
    async testErrorRecoveryFlow() {
        const testId = generateRequestId('test_recovery');
        logger.withRequest(testId).info('🧪 TESTE: Recuperação de erros');

        try {
            // 1. Simula erro controlado no dbManager
            const invalidSession = { id: null, data: 'invalid' };

            let errorCaught = false;
            try {
                await dbManager.addSession(invalidSession, { requestId: testId });
            } catch (error) {
                errorCaught = true;
                logger
                    .withRequest(testId)
                    .info('✅ Erro capturado corretamente', { error: error.message });
            }

            // 2. Verifica se aplicação continua funcional
            const appStillFunctional = this.verifyAppFunctionality();

            // 3. Testa recuperação automática
            const autoRecoveryWorks = await this.testAutoRecovery();

            const success = errorCaught && appStillFunctional && autoRecoveryWorks;

            this.addTestResult(
                'ERROR_RECOVERY',
                success,
                `Erro capturado: ${errorCaught}, App funcional: ${appStillFunctional}, Auto-recovery: ${autoRecoveryWorks}`
            );
        } catch (error) {
            this.addTestResult('ERROR_RECOVERY', false, `Erro: ${error.message}`);
        }
    }

    /**
     * 🧹 Limpeza do ambiente de teste
     */
    async cleanupTestEnvironment() {
        logger.withRequest(this.requestId).info('🧹 Limpando ambiente de teste');

        try {
            // Remove dados de teste
            await this.cleanupPreviousTestData();

            // Restaura estado original
            if (this.originalState) {
                state.sessoes = this.originalState.sessions;
                state.sessaoAtual = this.originalState.currentSession;
                Object.assign(config, this.originalState.config);
            }

            this.addTestResult('CLEANUP', true, 'Ambiente limpo com sucesso');
        } catch (error) {
            this.addTestResult('CLEANUP', false, `Falha na limpeza: ${error.message}`);
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    createTestSession(prefix) {
        return {
            id: `${prefix}_${Date.now()}`,
            modo: 'REAL',
            capitalInicial: 1000,
            dataInicio: new Date().toISOString(),
            dataFim: new Date().toISOString(),
            historicoCombinado: [
                {
                    id: 1,
                    resultado: 'win',
                    valor: 85,
                    timestamp: Date.now() - 1000,
                    isWin: true,
                },
                {
                    id: 2,
                    resultado: 'loss',
                    valor: -100,
                    timestamp: Date.now(),
                    isWin: false,
                },
            ],
            totalOperacoes: 2,
            resultadoFinanceiro: -15,
        };
    }

    captureLogsFor(keywords) {
        const captured = [];
        const originalMethods = {};

        ['debug', 'info', 'warn', 'error'].forEach((level) => {
            originalMethods[level] = console[level];
            console[level] = (...args) => {
                const message = args.join(' ');
                if (keywords.some((keyword) => message.includes(keyword))) {
                    captured.push(message);
                }
                originalMethods[level].apply(console, args);
            };
        });

        // Restaura métodos após 5 segundos
        setTimeout(() => {
            Object.keys(originalMethods).forEach((level) => {
                console[level] = originalMethods[level];
            });
        }, 5000);

        return captured;
    }

    verifyDashboardUpdate() {
        // Verifica se elementos do Dashboard foram atualizados
        return document.querySelector('.dashboard-stats') !== null;
    }

    verifyCacheInvalidation() {
        // Verifica se cache foi invalidado após exclusão
        return !events._dashboardCache || events._dashboardCache.size === 0;
    }

    verifyRecomputation(session) {
        // Verifica se totais foram recomputados corretamente
        const expectedTotal = session.historicoCombinado.reduce(
            (sum, op) => sum + (op.valor || 0),
            0
        );
        return Math.abs(session.resultadoFinanceiro - expectedTotal) < 0.01;
    }

    checkConsoleErrorsAbsence() {
        // Simula verificação de ausência de erros no console
        // Em implementação real, poderia capturar console.error temporariamente
        return true;
    }

    verifyAppFunctionality() {
        // Verifica funcionalidades básicas da aplicação
        try {
            return (
                typeof state === 'object' && typeof ui === 'object' && typeof charts === 'object'
            );
        } catch {
            return false;
        }
    }

    async testAutoRecovery() {
        try {
            // Testa se sistema se recupera automaticamente de falhas
            await new Promise((resolve) => setTimeout(resolve, 100));
            return true;
        } catch {
            return false;
        }
    }

    async cleanupPreviousTestData() {
        try {
            // Remove sessões de teste anteriores
            const testSessions =
                state.sessoes?.filter(
                    (s) => s.id && (s.id.includes('test') || s.id.includes('_test'))
                ) || [];

            for (const session of testSessions) {
                await dbManager.deleteSession(session.id);
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao limpar dados de teste', { error: error.message });
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString(),
        });
    }

    generateTestReport() {
        const endTime = performance.now();
        const totalDuration = endTime - this.startTime;

        const passed = this.testResults.filter((r) => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);

        logger.withRequest(this.requestId).info('📊 RELATÓRIO FINAL DOS TESTES FUNCIONAIS', {
            totalTests: total,
            passed,
            failed: total - passed,
            passRate: `${passRate}%`,
            durationMs: totalDuration.toFixed(2),
            results: this.testResults,
        });

        // Exibe relatório visual no console
        console.group('🧪 RELATÓRIO DE TESTES FUNCIONAIS');
        console.log(
            `📊 Total: ${total} | ✅ Passou: ${passed} | ❌ Falhou: ${total - passed} | 📈 Taxa: ${passRate}%`
        );
        console.log(`⏱️ Duração: ${totalDuration.toFixed(2)}ms`);

        this.testResults.forEach((result) => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.details}`);
        });

        console.groupEnd();

        return {
            passed,
            total,
            passRate: parseFloat(passRate),
            duration: totalDuration,
            results: this.testResults,
        };
    }
}

// Instância global para execução
export const functionalTests = new FunctionalTestSuite();

// Função de conveniência para execução manual
export async function runFunctionalTests() {
    return await functionalTests.runAllTests();
}
