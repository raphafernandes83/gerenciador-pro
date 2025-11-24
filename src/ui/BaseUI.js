/**
 * @fileoverview Classe base para todos os componentes de UI
 * @module BaseUI
 */

import { logger } from '../utils/Logger.js';

/**
 * Classe base para componentes de UI
 * Fornece funcionalidades comuns para todos os componentes
 */
export class BaseUI {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa o componente
     */
    init() {
        if (this.initialized) {
            logger.warn(`${this.constructor.name} já foi inicializado`);
            return;
        }

        this.initialized = true;
        logger.info(`✅ ${this.constructor.name} inicializado`);
    }

    /**
     * Formata valor monetário seguindo padrão brasileiro
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado como moeda
     */
    formatarMoeda(valor) {
        try {
            // Validação e normalização
            const num = this._normalizeNumber(valor);

            if (!isFinite(num)) {
                return 'R$ 0,00';
            }

            // Formatação otimizada
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);

        } catch (error) {
            logger.warn('Erro ao formatar moeda:', error);
            return 'R$ 0,00';
        }
    }

    /**
     * Formata percentual
     * @param {number} valor - Valor a formatar
     * @param {number} precision - Casas decimais
     * @returns {string} Valor formatado
     */
    formatarPercent(valor, precision = 1) {
        try {
            const num = this._normalizeNumber(valor);

            if (!isFinite(num)) {
                return '0%';
            }

            // Clamp entre 0-100
            const clamped = Math.max(0, Math.min(100, num));

            return `${clamped.toFixed(precision)}%`;

        } catch (error) {
            logger.warn('Erro ao formatar percentual:', error);
            return '0%';
        }
    }

    /**
     * Normaliza número
     * @private
     * @param {*} val - Valor a normalizar
     * @returns {number} Número normalizado
     */
    _normalizeNumber(val) {
        if (val === null || val === undefined) {
            return 0;
        }

        if (typeof val === 'number') {
            return val;
        }

        if (typeof val === 'string') {
            // Remove caracteres não numéricos exceto . e -
            const cleaned = val.replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned) || 0;
        }

        return 0;
    }

    /**
     * Valida elemento DOM
     * @param {HTMLElement} element - Elemento a validar
     * @param {string} name - Nome do elemento (para log)
     * @returns {boolean} True se válido
     */
    _validateElement(element, name = 'elemento') {
        if (!element) {
            logger.warn(`${name} não encontrado`);
            return false;
        }

        return true;
    }

    /**
     * Executa operação com try-catch
     * @param {Function} operation - Operação a executar
     * @param {string} errorMsg - Mensagem de erro
     * @returns {*} Resultado da operação ou null
     */
    _safeExecute(operation, errorMsg = 'Erro na operação') {
        try {
            return operation();
        } catch (error) {
            logger.error(errorMsg, error);
            return null;
        }
    }

    /**
     * Adiciona classe a elemento
     * @param {HTMLElement} element - Elemento
     * @param {string} className - Classe
     */
    _addClass(element, className) {
        if (this._validateElement(element)) {
            element.classList.add(className);
        }
    }

    /**
     * Remove classe de elemento
     * @param {HTMLElement} element - Elemento
     * @param {string} className - Classe
     */
    _removeClass(element, className) {
        if (this._validateElement(element)) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggle classe
     * @param {HTMLElement} element - Elemento
     * @param {string} className - Classe
     * @param {boolean} force - Forçar estado
     */
    _toggleClass(element, className, force) {
        if (this._validateElement(element)) {
            element.classList.toggle(className, force);
        }
    }

    /**
     * Set text content
     * @param {HTMLElement} element - Elemento
     * @param {string} text - Texto
     */
    _setText(element, text) {
        if (this._validateElement(element)) {
            element.textContent = text;
        }
    }

    /**
     * Set HTML
     * @param {HTMLElement} element - Elemento
     * @param {string} html - HTML
     */
    _setHTML(element, html) {
        if (this._validateElement(element)) {
            element.innerHTML = html;
        }
    }

    /**
     * Destroi o componente e limpa recursos
     */
    destroy() {
        this.initialized = false;
        logger.info(`🗑️ ${this.constructor.name} destruído`);
    }
}

export default BaseUI;
