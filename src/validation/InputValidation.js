/**
 * @fileoverview Módulo centralizado de validação de inputs
 * @module InputValidation
 * @version 1.0.0
 * 
 * Fornece validação robusta e mensagens de erro amigáveis para todos os inputs do sistema.
 * Consolida lógica de validação espalhada em vários arquivos.
 */

/**
 * Regras de validação para diferentes tipos de campos
 * @constant
 */
const VALIDATION_RULES = {
    capitalInicial: {
        min: 0.01,
        max: 1000000000,
        required: true,
        type: 'number',
        errorMessages: {
            required: 'Capital inicial é obrigatório',
            min: 'Capital inicial deve ser maior que R$ 0,01',
            max: 'Capital inicial não pode exceder R$ 1 bilhão',
            type: 'Capital inicial deve ser um número válido'
        }
    },
    percentualEntrada: {
        min: 0.01,
        max: 100,
        required: true,
        type: 'number',
        errorMessages: {
            required: 'Percentual de entrada é obrigatório',
            min: 'Percentual de entrada deve ser maior que 0,01%',
            max: 'Percentual de entrada não pode exceder 100%',
            type: 'Percentual de entrada deve ser um número válido'
        }
    },
    stopWinPerc: {
        min: 0.01,
        max: 10000,
        required: false,
        type: 'number',
        errorMessages: {
            min: 'Stop Win deve ser maior que 0,01%',
            max: 'Stop Win não pode exceder 10.000%',
            type: 'Stop Win deve ser um número válido'
        }
    },
    stopLossPerc: {
        min: 0.01,
        max: 100,
        required: false,
        type: 'number',
        errorMessages: {
            min: 'Stop Loss deve ser maior que 0,01%',
            max: 'Stop Loss não pode exceder 100%',
            type: 'Stop Loss deve ser um número válido'
        }
    },
    payout: {
        min: 1,
        max: 100,
        required: true,
        type: 'number',
        errorMessages: {
            required: 'Payout é obrigatório',
            min: 'Payout deve ser maior que 1%',
            max: 'Payout não pode exceder 100%',
            type: 'Payout deve ser um número válido'
        }
    },
    divisorRecuperacao: {
        min: 1,
        max: 99,
        required: false,
        type: 'number',
        errorMessages: {
            min: 'Divisor de recuperação deve ser maior que 1%',
            max: 'Divisor de recuperação não pode exceder 99%',
            type: 'Divisor de recuperação deve ser um número válido'
        }
    }
};

/**
 * Objeto de resultado de validação
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Se a validação passou
 * @property {string|null} error - Mensagem de erro (null se válido)
 * @property {*} value - Valor sanitizado
 */

/**
 * Sanitiza um valor de input removendo caracteres inválidos
 * @param {*} value - Valor a ser sanitizado
 * @returns {number} Valor numérico sanitizado
 */
export function sanitizeNumericInput(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    // Converte para string e remove espaços
    let str = String(value).trim();

    // Substitui vírgula por ponto (padrão brasileiro)
    str = str.replace(/,/g, '.');

    // Remove tudo exceto números, ponto e sinal negativo
    str = str.replace(/[^\d.-]/g, '');

    // Remove pontos duplicados
    const parts = str.split('.');
    if (parts.length > 2) {
        str = parts[0] + '.' + parts.slice(1).join('');
    }

    // Converte para número
    const num = parseFloat(str);

    // Retorna 0 se NaN
    return isNaN(num) ? 0 : num;
}

/**
 * Valida um campo específico
 * @param {string} fieldName - Nome do campo
 * @param {*} value - Valor a ser validado
 * @returns {ValidationResult} Resultado da validação
 */
export function validateField(fieldName, value) {
    const rule = VALIDATION_RULES[fieldName];

    if (!rule) {
        return {
            valid: true,
            error: null,
            value: sanitizeNumericInput(value)
        };
    }

    // Sanitiza valor
    const sanitized = sanitizeNumericInput(value);

    // Verifica campo obrigatório
    if (rule.required && (sanitized === 0 || sanitized === null)) {
        return {
            valid: false,
            error: rule.errorMessages.required,
            value: sanitized
        };
    }

    // Se não é obrigatório e está vazio, retorna válido
    if (!rule.required && sanitized === 0) {
        return {
            valid: true,
            error: null,
            value: sanitized
        };
    }

    // Verifica tipo
    if (rule.type === 'number' && (!isFinite(sanitized) || isNaN(sanitized))) {
        return {
            valid: false,
            error: rule.errorMessages.type,
            value: sanitized
        };
    }

    // Verifica valor mínimo
    if (rule.min !== undefined && sanitized < rule.min) {
        return {
            valid: false,
            error: rule.errorMessages.min,
            value: sanitized
        };
    }

    // Verifica valor máximo
    if (rule.max !== undefined && sanitized > rule.max) {
        return {
            valid: false,
            error: rule.errorMessages.max,
            value: sanitized
        };
    }

    return {
        valid: true,
        error: null,
        value: sanitized
    };
}

/**
 * Valida múltiplos campos de uma vez
 * @param {Object} fields - Objeto com pares campo:valor
 * @returns {Object} Resultado com valid, errors e values
 * 
 * @example
 * const result = validateMultipleFields({
 *   capitalInicial: '1000',
 *   percentualEntrada: '2.5'
 * });
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateMultipleFields(fields) {
    const results = {};
    const errors = {};
    const values = {};
    let allValid = true;

    for (const [fieldName, value] of Object.entries(fields)) {
        const result = validateField(fieldName, value);
        results[fieldName] = result;
        values[fieldName] = result.value;

        if (!result.valid) {
            errors[fieldName] = result.error;
            allValid = false;
        }
    }

    return {
        valid: allValid,
        errors,
        values,
        results
    };
}

/**
 * Adiciona validação em tempo real a um elemento de input
 * @param {HTMLElement|string} element - Elemento ou selector
 * @param {string} fieldName - Nome do campo para validação
 * @param {Function} onError - Callback de erro (opcional)
 * @param {Function} onValid - Callback de sucesso (opcional)
 */
export function attachRealTimeValidation(element, fieldName, onError = null, onValid = null) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) {
        console.warn(`Elemento não encontrado para validação: ${element}`);
        return;
    }

    // Handler de validação
    const validate = () => {
        const result = validateField(fieldName, el.value);

        // Remove classes antigas
        el.classList.remove('input-valid', 'input-invalid');

        if (result.valid) {
            el.classList.add('input-valid');
            if (onValid) onValid(result);
        } else {
            el.classList.add('input-invalid');
            if (onError) onError(result);
        }

        return result;
    };

    // Valida em blur (quando usuário sai do campo)
    el.addEventListener('blur', validate);

    // Também pode validar em input (tempo real)
    el.addEventListener('input', () => {
        // Remove classe de erro enquanto digita
        el.classList.remove('input-invalid');
    });

    return validate;
}

/**
 * Mostra mensagem de erro próxima ao campo
 * @param {HTMLElement|string} element - Elemento
 * @param {string} message - Mensagem de erro
 */
export function showFieldError(element, message) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;

    if (!el) return;

    // Remove erros anteriores
    const oldError = el.parentElement?.querySelector('.field-error-message');
    if (oldError) oldError.remove();

    // Cria elemento de erro
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error-message';
    errorEl.textContent = message;
    errorEl.style.cssText = 'color: var(--secondary-color, #ff3d00); font-size: 0.85em; margin-top: 4px;';

    // Insere depois do elemento
    el.parentElement?.appendChild(errorEl);

    // Remove depois de 5 segundos
    setTimeout(() => errorEl.remove(), 5000);
}

/**
 * Limpa mensagem de erro de um campo
 * @param {HTMLElement|string} element - Elemento
 */
export function clearFieldError(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    const errorEl = el.parentElement?.querySelector('.field-error-message');
    if (errorEl) errorEl.remove();

    el.classList.remove('input-invalid');
}

/**
 * Valida configuração completa do sistema
 * @param {Object} config - Objeto de configuração
 * @returns {ValidationResult} Resultado da validação
 */
export function validateSystemConfig(config) {
    const requiredFields = ['capitalInicial', 'percentualEntrada', 'payout'];
    const result = validateMultipleFields(config);

    // Verifica campos obrigatórios
    for (const field of requiredFields) {
        if (!result.values[field] || result.values[field] <= 0) {
            return {
                valid: false,
                error: `Configuração inválida: ${field} é obrigatório`,
                value: null
            };
        }
    }

    return result.valid ?
        { valid: true, error: null, value: result.values } :
        { valid: false, error: Object.values(result.errors).join('; '), value: null };
}

// Export de constantes úteis
export { VALIDATION_RULES };

/**
 * Utilitário para formatar número para exibição
 * @param {number} value - Valor numérico
 * @param {number} decimals - Casas decimais (padrão: 2)
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 2) {
    if (!isFinite(value) || isNaN(value)) return '0,00';
    return value.toFixed(decimals).replace('.', ',');
}
