/**
 * Formatador de valores padronizado
 */
export class ValueFormatter {
    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    static formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }
}
