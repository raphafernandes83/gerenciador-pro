/**
 * 🚀 EXECUÇÃO COMPLETA DE VALIDAÇÃO - Script Orquestrador
 * Executa todos os testes e validações de forma sequencial e organizada
 */

import { logger } from '../src/utils/Logger.js';
import { generateRequestId } from '../src/utils/SecurityUtils.js';

/**
 * 🎯 Orquestrador Principal de Validação
 */
class CompleteValidationRunner {
    constructor() {
        this.masterRequestId = generateRequestId('complete_validation');
        this.results = {
            timestamp: new Date().toISOString(),
            phases: {},
            summary: {},
            duration: 0,
            success: false,
        };
        this.startTime = null;
    }

    /**
     * 🚀 Executa validação completa em fases
     */
    async runCompleteValidation() {
        this.startTime = performance.now();
        logger.withRequest(this.masterRequestId).info('🚀 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA');

        try {
            // Fase 1: Testes Funcionais
            await this.runPhase('functional_tests', 'Testes Funcionais', async () => {
                try {
                    const { functionalTests } = await import('./functional-validation.js');
                    return await functionalTests.runAllTests();
                } catch (error) {
                    return { error: error.message, passed: 0, total: 0 };
                }
            });

            // Fase 2: Testes Manuais de Performance
            await this.runPhase('manual_tests', 'Testes Manuais', async () => {
                try {
                    const { runManualFunctionalTests } = await import('./run-manual-tests.js');
                    return await runManualFunctionalTests();
                } catch (error) {
                    return { error: error.message, tests: [] };
                }
            });

            // Fase 3: Validação de Saúde do Sistema
            await this.runPhase('system_health', 'Validação de Saúde', async () => {
                try {
                    const { systemHealthValidator } = await import('./system-health-validator.js');
                    return await systemHealthValidator.runCompleteValidation();
                } catch (error) {
                    return { error: error.message, overallHealth: 'critical' };
                }
            });

            // Fase 4: Relatório de Performance
            await this.runPhase('performance_report', 'Relatório de Performance', async () => {
                try {
                    if (window.performanceTracker) {
                        return window.performanceTracker.getPerformanceReport();
                    }
                    return { error: 'Performance tracker não disponível' };
                } catch (error) {
                    return { error: error.message };
                }
            });

            // Fase 5: Auditoria de Logs
            await this.runPhase('log_audit', 'Auditoria de Logs', async () => {
                try {
                    return this.auditLoggingSystem();
                } catch (error) {
                    return { error: error.message };
                }
            });

            // Geração do relatório consolidado
            this.generateConsolidatedReport();
            this.results.success = true;
        } catch (error) {
            logger
                .withRequest(this.masterRequestId)
                .error('❌ FALHA CRÍTICA na validação completa', { error: String(error) });
            this.results.error = error.message;
            this.results.success = false;
        } finally {
            this.results.duration = performance.now() - this.startTime;
            this.logFinalReport();
        }

        return this.results;
    }

    /**
     * 📋 Executa uma fase específica de validação
     */
    async runPhase(phaseId, phaseName, phaseFunction) {
        const phaseRequestId = generateRequestId(`phase_${phaseId}`);
        const phaseStart = performance.now();

        logger.withRequest(phaseRequestId).info(`📋 Iniciando fase: ${phaseName}`);

        try {
            const result = await phaseFunction();
            const duration = performance.now() - phaseStart;

            this.results.phases[phaseId] = {
                name: phaseName,
                duration,
                success: !result.error,
                result,
                requestId: phaseRequestId,
            };

            const status = result.error ? '❌ FALHOU' : '✅ SUCESSO';
            logger
                .withRequest(phaseRequestId)
                .info(`${status} - ${phaseName} (${duration.toFixed(2)}ms)`);
        } catch (error) {
            const duration = performance.now() - phaseStart;

            this.results.phases[phaseId] = {
                name: phaseName,
                duration,
                success: false,
                result: { error: error.message },
                requestId: phaseRequestId,
            };

            logger
                .withRequest(phaseRequestId)
                .error(`❌ ERRO na fase ${phaseName}`, { error: String(error) });
        }
    }

    /**
     * 🔍 Auditoria do sistema de logging
     */
    auditLoggingSystem() {
        const audit = {
            loggerAvailable: typeof window.logger !== 'undefined',
            logLevels: [],
            requestIdSupport: false,
            logsGenerated: 0,
        };

        if (audit.loggerAvailable) {
            const logger = window.logger;
            audit.logLevels = ['debug', 'info', 'warn', 'error'].filter(
                (level) => typeof logger[level] === 'function'
            );
            audit.requestIdSupport = typeof logger.withRequest === 'function';

            // Testa geração de logs
            try {
                const testRequestId = generateRequestId('log_test');
                logger.withRequest(testRequestId).debug('Log de teste para auditoria');
                audit.logsGenerated = 1;
            } catch (error) {
                audit.logTestError = error.message;
            }
        }

        audit.score = this.calculateLoggingScore(audit);
        return audit;
    }

    /**
     * 📊 Calcula score do sistema de logging
     */
    calculateLoggingScore(audit) {
        let score = 0;

        if (audit.loggerAvailable) score += 30;
        if (audit.logLevels.length >= 4) score += 25;
        if (audit.requestIdSupport) score += 25;
        if (audit.logsGenerated > 0) score += 20;

        return score;
    }

    /**
     * 📊 Gera relatório consolidado
     */
    generateConsolidatedReport() {
        const phases = Object.values(this.results.phases);
        const successfulPhases = phases.filter((p) => p.success).length;
        const totalPhases = phases.length;

        this.results.summary = {
            successRate: `${successfulPhases}/${totalPhases}`,
            successPercentage: ((successfulPhases / totalPhases) * 100).toFixed(1) + '%',
            totalDuration: this.results.duration.toFixed(2) + 'ms',
            avgPhaseDuration:
                (phases.reduce((sum, p) => sum + p.duration, 0) / totalPhases).toFixed(2) + 'ms',
            status: successfulPhases === totalPhases ? 'SUCESSO COMPLETO' : 'SUCESSO PARCIAL',
            criticalIssues: this.extractCriticalIssues(),
            recommendations: this.generateRecommendations(),
        };
    }

    /**
     * 🚨 Extrai questões críticas de todas as fases
     */
    extractCriticalIssues() {
        const issues = [];

        Object.values(this.results.phases).forEach((phase) => {
            if (!phase.success) {
                issues.push(`${phase.name}: ${phase.result.error || 'Falha não especificada'}`);
            }

            // Extrai issues específicos de cada tipo de resultado
            if (phase.result.criticalIssues) {
                issues.push(
                    ...phase.result.criticalIssues.map((issue) => `${phase.name}: ${issue}`)
                );
            }
        });

        return issues;
    }

    /**
     * 💡 Gera recomendações baseadas nos resultados
     */
    generateRecommendations() {
        const recommendations = [];
        const phases = this.results.phases;

        // Recomendações baseadas em falhas de fase
        if (phases.functional_tests && !phases.functional_tests.success) {
            recommendations.push(
                'Revisar testes funcionais - módulos críticos podem estar com problemas'
            );
        }

        if (phases.system_health && phases.system_health.result.overallHealth === 'critical') {
            recommendations.push('URGENTE: Sistema em estado crítico - investigar imediatamente');
        }

        if (
            phases.performance_report &&
            phases.performance_report.result.summary?.activeOperations > 10
        ) {
            recommendations.push('Muitas operações ativas - possível vazamento de performance');
        }

        if (phases.log_audit && phases.log_audit.result.score < 80) {
            recommendations.push('Sistema de logging incompleto - implementar melhorias');
        }

        // Recomendações gerais
        const overallSuccessRate = parseFloat(this.results.summary.successPercentage);
        if (overallSuccessRate < 80) {
            recommendations.push('Taxa de sucesso baixa - revisão geral do sistema necessária');
        }

        if (this.results.duration > 30000) {
            // 30 segundos
            recommendations.push('Validação muito lenta - otimizar processos de teste');
        }

        return recommendations;
    }

    /**
     * 📝 Log do relatório final
     */
    logFinalReport() {
        logger.withRequest(this.masterRequestId).info('📊 VALIDAÇÃO COMPLETA FINALIZADA', {
            success: this.results.success,
            duration: this.results.summary.totalDuration,
            successRate: this.results.summary.successRate,
            status: this.results.summary.status,
        });

        // Relatório visual no console
        console.group('🚀 RELATÓRIO COMPLETO DE VALIDAÇÃO DO SISTEMA');
        console.log('='.repeat(80));

        console.log(`📊 STATUS GERAL: ${this.results.summary.status}`);
        console.log(`⏱️ Duração Total: ${this.results.summary.totalDuration}`);
        console.log(
            `📈 Taxa de Sucesso: ${this.results.summary.successPercentage} (${this.results.summary.successRate})`
        );

        console.log('\n📋 RESULTADOS POR FASE:');
        Object.values(this.results.phases).forEach((phase) => {
            const icon = phase.success ? '✅' : '❌';
            const duration = phase.duration.toFixed(2);
            console.log(`${icon} ${phase.name}: ${duration}ms`);

            if (!phase.success && phase.result.error) {
                console.log(`    💥 Erro: ${phase.result.error}`);
            }
        });

        if (this.results.summary.criticalIssues.length > 0) {
            console.log('\n🚨 QUESTÕES CRÍTICAS:');
            this.results.summary.criticalIssues.forEach((issue) => {
                console.log(`  • ${issue}`);
            });
        }

        if (this.results.summary.recommendations.length > 0) {
            console.log('\n💡 RECOMENDAÇÕES:');
            this.results.summary.recommendations.forEach((rec) => {
                console.log(`  • ${rec}`);
            });
        }

        console.log('='.repeat(80));
        console.groupEnd();

        // Sugestão de próximos passos
        this.suggestNextSteps();
    }

    /**
     * 👉 Sugere próximos passos baseados nos resultados
     */
    suggestNextSteps() {
        console.group('👉 PRÓXIMOS PASSOS SUGERIDOS');

        if (this.results.success && parseFloat(this.results.summary.successPercentage) >= 95) {
            console.log('🎉 Sistema em excelente estado!');
            console.log('✅ Próximos passos recomendados:');
            console.log('  • Implementar monitoramento contínuo');
            console.log('  • Configurar alertas automáticos');
            console.log('  • Documentar procedimentos de manutenção');
        } else if (parseFloat(this.results.summary.successPercentage) >= 80) {
            console.log('✅ Sistema em bom estado com algumas melhorias necessárias');
            console.log('📋 Próximos passos:');
            console.log('  • Resolver questões identificadas');
            console.log('  • Executar nova validação em 24h');
        } else {
            console.log('⚠️ Sistema requer atenção imediata');
            console.log('🚨 Próximos passos urgentes:');
            console.log('  • Resolver questões críticas AGORA');
            console.log('  • Executar validação incremental');
            console.log('  • Considerar rollback se necessário');
        }

        console.log('\n🔧 Comandos úteis:');
        console.log('  • runSystemHealthCheck() - Validação rápida de saúde');
        console.log('  • togglePerformanceDashboard() - Monitor em tempo real');
        console.log('  • logPerformanceReport() - Relatório de performance');

        console.groupEnd();
    }

    /**
     * 📁 Exporta relatório completo
     */
    exportReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `complete-validation-report-${timestamp}.json`;

        const blob = new Blob([JSON.stringify(this.results, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        logger
            .withRequest(this.masterRequestId)
            .info('📁 Relatório completo exportado', { filename });
    }
}

// Instância e função de conveniência
const completeValidationRunner = new CompleteValidationRunner();

export async function runCompleteValidation() {
    return await completeValidationRunner.runCompleteValidation();
}

export function exportCompleteValidationReport() {
    return completeValidationRunner.exportReport();
}

// Disponibiliza globalmente
if (typeof window !== 'undefined') {
    window.runCompleteValidation = runCompleteValidation;
    window.exportCompleteValidationReport = exportCompleteValidationReport;
}

console.log('🚀 Complete Validation Runner carregado!');
console.log('📋 Execute: runCompleteValidation() para validação completa');
console.log('📁 Execute: exportCompleteValidationReport() para exportar relatório');
