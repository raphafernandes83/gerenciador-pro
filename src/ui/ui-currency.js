/**
 * =============================================================================
 * UI CURRENCY - Formatação de Valores Monetários
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: ui.js (linhas 684-771)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Formatação de valores monetários com cache e fallbacks.
 * Recebe dependências por parâmetro (injeção) para evitar ciclos de import.
 * 
 * Dependências Injetadas (via parâmetro deps):
 * - CURRENCY_FORMAT: Configurações de formatação
 * - uiServicesFacade: Acesso ao cache de performance (opcional)
 * - isValidMonetaryValue: Função de validação
 * - convertToNumber: Função de conversão
 * 
 * =============================================================================
 */

/**
 * Formata valor monetário seguindo padrão brasileiro.
 * Sistema robusto com tratamento de erros e fallbacks.
 * 
 * @param {number} valor - Valor a ser formatado
 * @param {Object} deps - Dependências injetadas
 * @param {Function} deps.formatarMoedaInternal - Implementação interna
 * @returns {string} Valor formatado como moeda
 * 
 * @example
 * formatarMoedaImpl(1234.56, deps) // "R$ 1.234,56"
 * formatarMoedaImpl(null, deps)    // "R$ 0,00"
 */
export function formatarMoedaImpl(valor, deps) {
    try {
        return deps.formatarMoedaInternal(valor);
    } catch (error) {
        console.warn('Erro na formatação de moeda, usando fallback:', error.message);
        // Fallback robusto sem dependências
        const numericValue = Number(valor) || 0;
        return `R$ ${numericValue
            .toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }
}

/**
 * Implementação interna da formatação monetária com cache otimizado.
 * 
 * @param {number} valor - Valor a ser formatado
 * @param {Object} deps - Dependências injetadas
 * @param {Object} deps.CURRENCY_FORMAT - Configurações de formatação
 * @param {Object} [deps.uiServicesFacade] - Facade de serviços UI (opcional)
 * @param {Function} deps.isValidMonetaryValue - Validador de valor
 * @param {Function} deps.convertToNumber - Conversor para número
 * @returns {string} Valor formatado
 */
export function formatarMoedaInternalImpl(valor, deps) {
    const { CURRENCY_FORMAT, uiServicesFacade, isValidMonetaryValue, convertToNumber } = deps;

    try {
        // Validação robusta de entrada ANTES do cache
        if (!isValidMonetaryValue(valor)) {
            return CURRENCY_FORMAT.DEFAULT_VALUE;
        }

        // Converte para number se necessário
        const numericValue = convertToNumber(valor);

        // Verifica cache usando chave baseada no valor numérico
        const cacheKey = numericValue.toString();
        let cache;
        let cached;

        try {
            // 🛡️ CORREÇÃO CRÍTICA: Verificar se uiServicesFacade existe
            if (
                typeof uiServicesFacade !== 'undefined' &&
                uiServicesFacade &&
                uiServicesFacade.getPerformanceCache
            ) {
                cache = uiServicesFacade.getPerformanceCache('currency');
                cached = cache.get(cacheKey);

                if (cached !== undefined) {
                    return cached;
                }
            } else {
                console.warn('🔧 uiServicesFacade não disponível, prosseguindo sem cache');
            }
        } catch (cacheError) {
            // Se cache falhar, continua sem cache
            console.warn('Cache de moeda indisponível:', cacheError.message);
        }

        // Formatação usando locale nativo
        const formatted = numericValue.toLocaleString(
            CURRENCY_FORMAT.LOCALE,
            CURRENCY_FORMAT.OPTIONS
        );

        // Tenta salvar no cache, mas não falha se der erro
        try {
            if (cache && typeof uiServicesFacade !== 'undefined' && uiServicesFacade) {
                cache.set(cacheKey, formatted);
            }
        } catch (cacheError) {
            console.warn('Erro ao salvar no cache de moeda:', cacheError.message);
        }

        return formatted;
    } catch (error) {
        console.error('Erro na formatação de moeda:', error);
        // Fallback seguro
        return `R$ ${(Number(valor) || 0).toFixed(2).replace('.', ',')}`;
    }
}
