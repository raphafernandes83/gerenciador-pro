/**
 * Framework de Testes Automatizados
 * Permite definir casos de teste que serão executados automaticamente
 * 
 * @version 1.0.0
 */

import { logger } from '../src/utils/Logger.js';

/**
 * Suite de testes
 * @type {Array}
 */
export const testSuite = {
    name: "Gerenciador PRO - Testes E2E",
    tests: []
};

/**
 * Adiciona um teste à suite
 * @param {Object} test - Configuração do teste
 */
export function addTest(test) {
    testSuite.tests.push({
        id: testSuite.tests.length + 1,
        enabled: true,
        ...test
    });
}

/**
 * Classe para executar testes automatizados
 */
export class AutomatedTestRunner {
    constructor() {
        this.results = [];
        this.currentTest = null;
    }

    /**
     * Executa todos os testes da suite
     * @returns {Promise<Object>} Resultado dos testes
     */
    async runAll() {
        logger.info('🧪 Iniciando execução de testes automatizados...');

        this.results = [];
        const startTime = Date.now();

        for (const test of testSuite.tests) {
            if (!test.enabled) {
                logger.debug(`⏭️ Teste #${test.id} desabilitado: ${test.name}`);
                continue;
            }

            const result = await this.runTest(test);
            this.results.push(result);
        }

        const duration = Date.now() - startTime;

        return this.generateReport(duration);
    }

    /**
     * Executa um teste específico
     * @param {Object} test - Configuração do teste
     * @returns {Promise<Object>} Resultado do teste
     */
    async runTest(test) {
        this.currentTest = test;
        logger.info(`🏃 Executando: ${test.name}`);

        const result = {
            id: test.id,
            name: test.name,
            status: 'running',
            steps: [],
            startTime: Date.now(),
            error: null
        };

        try {
            // Executa cada passo do teste
            for (let i = 0; i < test.steps.length; i++) {
                const step = test.steps[i];
                const stepResult = await this.executeStep(step, i + 1);
                result.steps.push(stepResult);

                if (!stepResult.passed) {
                    result.status = 'failed';
                    result.error = stepResult.error;
                    break;
                }
            }

            if (result.status === 'running') {
                result.status = 'passed';
            }

        } catch (error) {
            result.status = 'error';
            result.error = error.message;
            logger.error(`❌ Erro no teste ${test.name}:`, error);
        }

        result.endTime = Date.now();
        result.duration = result.endTime - result.startTime;

        const emoji = result.status === 'passed' ? '✅' : '❌';
        logger.info(`${emoji} Teste ${test.name}: ${result.status.toUpperCase()} (${result.duration}ms)`);

        return result;
    }

    /**
     * Executa um passo do teste
     * @param {Object} step - Passo a executar
     * @param {number} stepNumber - Número do passo
     * @returns {Promise<Object>} Resultado do passo
     */
    async executeStep(step, stepNumber) {
        logger.debug(`  Passo ${stepNumber}: ${step.description}`);

        const stepResult = {
            number: stepNumber,
            description: step.description,
            action: step.action,
            passed: false,
            error: null,
            actualResult: null
        };

        try {
            // Executa a ação
            const result = await this.performAction(step.action, step.params);
            stepResult.actualResult = result;

            // Valida o resultado esperado
            if (step.expectedResult) {
                const validation = await this.validateResult(result, step.expectedResult);
                stepResult.passed = validation.passed;
                stepResult.error = validation.error;
            } else {
                stepResult.passed = true;
            }

        } catch (error) {
            stepResult.passed = false;
            stepResult.error = error.message;
        }

        return stepResult;
    }

    /**
     * Executa uma ação específica
     * @param {string} action - Tipo de ação
     * @param {Object} params - Parâmetros da ação
     * @returns {Promise<*>} Resultado da ação
     */
    async performAction(action, params) {
        switch (action) {
            case 'click':
                return this.clickElement(params.selector);

            case 'type':
                return this.typeInElement(params.selector, params.value);

            case 'wait':
                return this.wait(params.duration);

            case 'checkValue':
                return this.checkElementValue(params.selector);

            case 'checkClass':
                return this.checkElementClass(params.selector, params.className);

            case 'checkText':
                return this.checkElementText(params.selector);

            case 'checkVisible':
                return this.checkElementVisible(params.selector);

            case 'custom':
                return params.function();

            default:
                throw new Error(`Ação desconhecida: ${action}`);
        }
    }

    /**
     * Clica em um elemento
     */
    clickElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${selector}`);
        }
        element.click();
        return { clicked: true, selector };
    }

    /**
     * Digita em um elemento
     */
    typeInElement(selector, value) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${selector}`);
        }
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { typed: true, selector, value };
    }

    /**
     * Espera um tempo específico
     */
    async wait(duration) {
        await new Promise(resolve => setTimeout(resolve, duration));
        return { waited: duration };
    }

    /**
     * Verifica valor de um elemento
     */
    checkElementValue(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${selector}`);
        }
        return element.value;
    }

    /**
     * Verifica se elemento tem classe
     */
    checkElementClass(selector, className) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${selector}`);
        }
        return element.classList.contains(className);
    }

    /**
     * Verifica texto de um elemento
     */
    checkElementText(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${selector}`);
        }
        return element.textContent.trim();
    }

    /**
     * Verifica se elemento está visível
     */
    checkElementVisible(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            return false;
        }
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    /**
     * Valida resultado
     */
    async validateResult(actual, expected) {
        if (typeof expected === 'function') {
            try {
                const result = expected(actual);
                return { passed: !!result, error: result ? null : 'Validação customizada falhou' };
            } catch (error) {
                return { passed: false, error: error.message };
            }
        }

        if (typeof expected === 'object' && expected.hasOwnProperty('equals')) {
            const passed = actual === expected.equals;
            return {
                passed,
                error: passed ? null : `Esperado: ${expected.equals}, Obtido: ${actual}`
            };
        }

        if (typeof expected === 'object' && expected.hasOwnProperty('contains')) {
            const passed = String(actual).includes(expected.contains);
            return {
                passed,
                error: passed ? null : `Esperado conter: ${expected.contains}, Obtido: ${actual}`
            };
        }

        return { passed: true, error: null };
    }

    /**
     * Gera relatório dos testes
     */
    generateReport(totalDuration) {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const errors = this.results.filter(r => r.status === 'error').length;

        const report = {
            summary: {
                total,
                passed,
                failed,
                errors,
                successRate: total > 0 ? (passed / total * 100).toFixed(2) : 0,
                duration: totalDuration
            },
            results: this.results
        };

        logger.info('\n' + '='.repeat(60));
        logger.info('📊 RELATÓRIO DE TESTES AUTOMATIZADOS');
        logger.info('='.repeat(60));
        logger.info(`Total de testes: ${total}`);
        logger.info(`✅ Passou: ${passed}`);
        logger.info(`❌ Falhou: ${failed}`);
        logger.info(`💥 Erros: ${errors}`);
        logger.info(`📈 Taxa de sucesso: ${report.summary.successRate}%`);
        logger.info(`⏱️ Duração total: ${totalDuration}ms`);
        logger.info('='.repeat(60) + '\n');

        return report;
    }
}

// Expõe globalmente
if (typeof window !== 'undefined') {
    window.AutomatedTestRunner = AutomatedTestRunner;
    window.testSuite = testSuite;
    window.addTest = addTest;
}

export default AutomatedTestRunner;
