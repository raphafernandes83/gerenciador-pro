/**
 * 🧪 TESTES PARA RECURSÃO INFINITA NO DOM.JS
 * Verifica se as funções safeGetElement e safeQuerySelectorAll não causam stack overflow
 */

import { mapDOM, testDOMMapping } from '../dom.js';

/**
 * 🔍 Teste de Stack Overflow - safeGetElement
 */
function testSafeGetElementRecursion() {
    console.log('🧪 Testando safeGetElement para recursão infinita...');

    const startTime = performance.now();
    let success = false;

    try {
        // Tenta mapear DOM - se houver recursão, vai dar stack overflow
        mapDOM();
        success = true;
        console.log('✅ safeGetElement funciona sem recursão');
    } catch (error) {
        if (error.message.includes('Maximum call stack size exceeded')) {
            console.error('❌ RECURSÃO INFINITA detectada em safeGetElement:', error);
            return false;
        } else {
            console.warn('⚠️ Outro erro em safeGetElement:', error.message);
            success = true; // Outros erros são esperados se DOM não existe
        }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Se demorou mais de 100ms, pode ser recursão
    if (duration > 100) {
        console.warn(`⚠️ safeGetElement muito lento: ${duration.toFixed(2)}ms (possível recursão)`);
        return false;
    }

    console.log(`⏱️ safeGetElement executado em ${duration.toFixed(2)}ms`);
    return success;
}

/**
 * 🔍 Teste de Stack Overflow - testDOMMapping
 */
function testDOMMappingRecursion() {
    console.log('🧪 Testando testDOMMapping para recursão infinita...');

    const startTime = performance.now();
    let success = false;

    try {
        // Usa função de teste oficial
        const result = testDOMMapping();
        success = true;
        console.log('✅ testDOMMapping funciona sem recursão:', result);
    } catch (error) {
        if (error.message.includes('Maximum call stack size exceeded')) {
            console.error('❌ RECURSÃO INFINITA detectada em testDOMMapping:', error);
            return false;
        } else {
            console.warn('⚠️ Outro erro em testDOMMapping:', error.message);
            success = true; // Outros erros são esperados se DOM não existe
        }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 100) {
        console.warn(`⚠️ testDOMMapping muito lento: ${duration.toFixed(2)}ms (possível recursão)`);
        return false;
    }

    console.log(`⏱️ testDOMMapping executado em ${duration.toFixed(2)}ms`);
    return success;
}

/**
 * 🎯 Teste geral de anti-recursão
 */
function testAntiRecursion() {
    console.log('🎯 Executando bateria de testes anti-recursão...');

    const tests = [
        { name: 'safeGetElement', test: testSafeGetElementRecursion },
        { name: 'testDOMMapping', test: testDOMMappingRecursion },
    ];

    let allPassed = true;
    const results = [];

    tests.forEach(({ name, test }) => {
        const startTime = performance.now();
        const passed = test();
        const duration = performance.now() - startTime;

        results.push({ name, passed, duration });

        if (!passed) {
            allPassed = false;
        }
    });

    // Relatório final
    console.log('\n📊 RELATÓRIO DE TESTES ANTI-RECURSÃO:');
    results.forEach(({ name, passed, duration }) => {
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}: ${duration.toFixed(2)}ms`);
    });

    if (allPassed) {
        console.log('🎉 TODOS OS TESTES PASSARAM - SEM RECURSÃO INFINITA!');
    } else {
        console.error('🚨 ALGUNS TESTES FALHARAM - RECURSÃO DETECTADA!');
    }

    return allPassed;
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.testAntiRecursion = testAntiRecursion;
    window.testSafeGetElementRecursion = testSafeGetElementRecursion;
    window.testDOMMappingRecursion = testDOMMappingRecursion;

    console.log('🧪 Testes anti-recursão carregados! Use: testAntiRecursion()');
}

export { testAntiRecursion, testSafeGetElementRecursion, testDOMMappingRecursion };
