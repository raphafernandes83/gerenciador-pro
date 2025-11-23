/**
 * 🔧 DOM Helper - Utilitário de Transição para DOMManager
 * 
 * Helper centralizado que permite usar DOMManager quando disponível,
 * com fallback para manipulação DOM direta.
 * 
 * @module DOMHelper
 * @author Sistema de Qualidade Avançada
 * @version 1.0.0
 * 
 * @description
 * Este módulo fornece métodos unificados para manipulação de classes CSS,
 * abstraindo a diferença entre DOMManager (quando disponível) e DOM nativo.
 * 
 * Anteriormente duplicado em 3 arquivos (ui.js, events.js, charts.js),
 * agora centralizado para facilitar manutenção.
 */

/**
 * Adiciona classes CSS a um elemento
 * 
 * @param {HTMLElement|string} element - Elemento DOM ou seletor CSS
 * @param {...string} classes - Classes a serem adicionadas
 * @returns {boolean} True se operação foi bem-sucedida
 * 
 * @example
 * domHelper.addClass('#myElement', 'active', 'visible');
 * domHelper.addClass(element, 'highlight');
 */
export function addClass(element, ...classes) {
    // Usa DOMManager se disponível
    if (window.domManager) {
        return window.domManager.addClass(element, ...classes);
    }

    // Fallback: DOM direto
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    element?.classList.add(...classes);
    return !!element;
}

/**
 * Remove classes CSS de um elemento
 * 
 * @param {HTMLElement|string} element - Elemento DOM ou seletor CSS
 * @param {...string} classes - Classes a serem removidas
 * @returns {boolean} True se operação foi bem-sucedida
 * 
 * @example
 * domHelper.removeClass('#myElement', 'active');
 * domHelper.removeClass(element, 'highlight', 'visible');
 */
export function removeClass(element, ...classes) {
    // Usa DOMManager se disponível
    if (window.domManager) {
        return window.domManager.removeClass(element, ...classes);
    }

    // Fallback: DOM direto
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    element?.classList.remove(...classes);
    return !!element;
}

/**
 * Alterna uma classe CSS em um elemento
 * 
 * @param {HTMLElement|string} element - Elemento DOM ou seletor CSS
 * @param {string} className - Classe a ser alternada
 * @param {boolean} [force] - Se true, adiciona; se false, remove; se undefined, alterna
 * @returns {boolean} True se classe foi adicionada, false se removida
 * 
 * @example
 * domHelper.toggleClass('#myElement', 'active');
 * domHelper.toggleClass(element, 'visible', true); // Força adição
 */
export function toggleClass(element, className, force) {
    // Usa DOMManager se disponível
    if (window.domManager) {
        return window.domManager.toggleClass(element, className, force);
    }

    // Fallback: DOM direto
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    return element ? element.classList.toggle(className, force) : false;
}

/**
 * Verifica se um elemento possui uma classe CSS
 * 
 * @param {HTMLElement|string} element - Elemento DOM ou seletor CSS
 * @param {string} className - Classe a ser verificada
 * @returns {boolean} True se elemento possui a classe
 * 
 * @example
 * if (domHelper.hasClass('#myElement', 'active')) {
 *   console.log('Element is active');
 * }
 */
export function hasClass(element, className) {
    // Usa DOMManager se disponível
    if (window.domManager) {
        return window.domManager.hasClass(element, className);
    }

    // Fallback: DOM direto
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    return element ? element.classList.contains(className) : false;
}

/**
 * Objeto domHelper com todos os métodos (para compatibilidade)
 * @type {Object}
 */
export const domHelper = {
    addClass,
    removeClass,
    toggleClass,
    hasClass
};

// Export default para conveniência
export default domHelper;
