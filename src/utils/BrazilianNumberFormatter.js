/**
 * 🇧🇷 Brazilian Number Formatter
 * 
 * Funções para parsing e formatação de números em formato brasileiro:
 * - Ponto (.) = separador de milhar
 * - Vírgula (,) = separador decimal
 * 
 * Exemplo: 10.000,50 = dez mil reais e cinquenta centavos
 */

/**
 * Converte string em formato brasileiro para JavaScript Number
 * @param {string|number} value - Valor a ser parseado
 * @returns {number} - Número JavaScript
 * 
 * @example
 * parseBrazilianNumber('10.000') → 10000
 * parseBrazilianNumber('100,50') → 100.5
 * parseBrazilianNumber('10.000,50') → 10000.5
 * parseBrazilianNumber('100.55') → 100.55 (aceita formato internacional)
 */
export function parseBrazilianNumber(value) {
    // Se já é número, retorna direto
    if (typeof value === 'number') return value;
    if (!value) return 0;

    let str = String(value).trim();

    // Remove espaços
    str = str.replace(/\s+/g, '');

    // Remove caracteres inválidos (mantém apenas dígitos, ponto e vírgula)
    str = str.replace(/[^\d.,]/g, '');

    if (!str) return 0;

    // Detecta formato
    const hasComma = str.includes(',');
    const hasDot = str.includes('.');

    if (hasComma && hasDot) {
        // Formato brasileiro completo: 10.000,50
        // Remove pontos (milhar), substitui vírgula (decimal) por ponto
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
        // Apenas vírgula: 100,50
        // Substitui vírgula por ponto para JavaScript
        str = str.replace(',', '.');
    } else if (hasDot) {
        // Apenas ponto: precisa detectar se é milhar ou decimal
        const parts = str.split('.');
        const lastPart = parts[parts.length - 1];

        // Se última parte tem exatamente 3 dígitos, provável milhar
        if (lastPart.length === 3 && parts.length >= 2) {
            // Remove todos os pontos (são milhares)
            str = str.replace(/\./g, '');
        }
        // Se última parte tem 1-2 dígitos, é decimal: 100.50 → mantém
        // Se última parte tem 4+ dígitos, não tem separador: 10000 → mantém
    }

    // Converte para número
    const num = Number(str);
    return isNaN(num) ? 0 : num;
}

/**
 * Formata número para padrão brasileiro
 * @param {string|number} value - Valor a ser formatado
 * @param {number} decimals - Casas decimais (padrão: 2)
 * @returns {string} - Valor formatado (ex: "10.000,50")
 * 
 * @example
 * formatBrazilianNumber(100) → '100,00'
 * formatBrazilianNumber(100.5) → '100,50'
 * formatBrazilianNumber(10000) → '10.000,00'
 * formatBrazilianNumber(100000) → '100.000,00'
 */
export function formatBrazilianNumber(value, decimals = 2) {
    // Parse primeiro para garantir que temos um número válido
    const num = typeof value === 'number' ? value : parseBrazilianNumber(value);

    if (isNaN(num)) return '';

    // Separa inteiro e decimal
    const fixed = num.toFixed(decimals);
    const [integer, decimal] = fixed.split('.');

    // Adiciona pontos de milhar
    const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Retorna com vírgula decimal brasileira
    return decimals > 0 ? `${withThousands},${decimal}` : withThousands;
}
