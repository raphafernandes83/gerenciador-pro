/**
 * MÓDULO DE VALIDAÇÃO
 *
 * Centraliza todas as funções de validação utilizadas pela aplicação
 * Seguindo boas práticas: responsabilidade única e funções puras
 */

/**
 * Valida se um valor é um número válido
 * @param {any} value - Valor a ser validado
 * @returns {boolean} - True se for um número válido
 */
export function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Valida se um valor é uma porcentagem válida (0-100)
 * @param {any} value - Valor a ser validado
 * @returns {boolean} - True se for uma porcentagem válida
 */
export function isValidPercentage(value) {
    return isValidNumber(value) && value >= 0 && value <= 100;
}

/**
 * Valida se um valor é um capital válido (positivo)
 * @param {any} value - Valor a ser validado
 * @returns {boolean} - True se for um capital válido
 */
export function isValidCapital(value) {
    return isValidNumber(value) && value > 0;
}

/**
 * Valida se um histórico de operações é válido
 * @param {any} history - Histórico a ser validado
 * @returns {boolean} - True se for um histórico válido
 */
export function isValidHistory(history) {
    return Array.isArray(history) && history.length > 0;
}

/**
 * Valida se uma data é válida
 * @param {any} date - Data a ser validada
 * @returns {boolean} - True se for uma data válida
 */
export function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valida se uma tag de operação é válida
 * @param {any} tag - Tag a ser validada
 * @returns {boolean} - True se for uma tag válida
 */
export function isValidTag(tag) {
    return typeof tag === 'string' && tag.length > 0 && tag.length <= 30;
}

/**
 * Valida dados de sessão
 * @param {any} sessionData - Dados da sessão
 * @returns {boolean} - True se os dados forem válidos
 */
export function validateSession(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') {
        return false;
    }

    const requiredFields = ['capitalInicial', 'data', 'estrategia'];
    return requiredFields.every((field) => sessionData.hasOwnProperty(field));
}

// Agrupa todas as funções para export default
export const validation = {
    isValidNumber,
    isValidPercentage,
    isValidCapital,
    isValidHistory,
    isValidDate,
    isValidTag,
    validateSession,
};

export default validation;
