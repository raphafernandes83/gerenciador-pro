/**
 * =============================================================================
 * UI CONVERTERS - Funções de Conversão de Valores
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: ui.js (linhas 796-815)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Funções de conversão de valores para uso na UI.
 * Recebem mensagens de validação por parâmetro para manter independência.
 * 
 * =============================================================================
 */

/**
 * Converte valor para number de forma segura.
 * Lança TypeError se o valor não puder ser convertido.
 * 
 * @param {*} valor - Valor a ser convertido
 * @param {Object} messages - Objeto com mensagens de erro
 * @param {string} messages.NAN_VALUE - Mensagem para valor NaN
 * @returns {number} Valor convertido
 * @throws {TypeError} Se valor não for conversível para número
 * 
 * @example
 * convertToNumber(100, VALIDATION_MESSAGES)     // 100
 * convertToNumber("50.5", VALIDATION_MESSAGES)  // 50.5
 * convertToNumber("abc", VALIDATION_MESSAGES)   // throws TypeError
 */
export function convertToNumber(valor, messages) {
    if (typeof valor === 'number') {
        return valor;
    }

    const converted = Number(valor);

    if (Number.isNaN(converted)) {
        const nanMessage = messages?.NAN_VALUE || 'Valor não é um número válido';
        throw new TypeError(`${nanMessage}: ${valor}`);
    }

    return converted;
}
