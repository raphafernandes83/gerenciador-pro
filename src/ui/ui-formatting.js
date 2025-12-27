/**
 * =============================================================================
 * UI FORMATTING - Funções Puras de Formatação
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: ui.js (linhas 770-798)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Funções puras de formatação sem dependências externas.
 * Estas funções não acessam DOM, window, ou estado global.
 * 
 * =============================================================================
 */

/**
 * Formata percentual com clamp 0-100 e precisão configurável.
 * 
 * @param {any} valor - Valor a ser formatado
 * @param {number} precision - Casas decimais (padrão: 1)
 * @returns {string} Valor formatado como percentual
 * 
 * @example
 * formatarPercent(75.5)       // "75.5%"
 * formatarPercent(150)        // "100.0%" (clamp)
 * formatarPercent(-10)        // "0.0%" (clamp)
 * formatarPercent(33.333, 2)  // "33.33%"
 */
export function formatarPercent(valor, precision = 1) {
    const n = Number(valor);
    const p = Number(precision) || 0;
    if (!isFinite(n)) return `${(0).toFixed(Math.max(0, p))}%`;
    const clamped = Math.max(0, Math.min(100, n));
    return `${clamped.toFixed(Math.max(0, p))}%`;
}

/**
 * Valida se valor é apropriado para formatação monetária.
 * Função pura de validação sem efeitos colaterais.
 * 
 * @param {*} valor - Valor a ser validado
 * @returns {boolean} True se valor é válido para formatação monetária
 * 
 * @example
 * isValidMonetaryValue(100)       // true
 * isValidMonetaryValue("50.5")    // true
 * isValidMonetaryValue(null)      // false
 * isValidMonetaryValue(undefined) // false
 * isValidMonetaryValue(NaN)       // false
 * isValidMonetaryValue(Infinity)  // false
 */
export function isValidMonetaryValue(valor) {
    return (
        valor !== null &&
        valor !== undefined &&
        !Number.isNaN(Number(valor)) &&
        Number.isFinite(Number(valor))
    );
}
