/**
 * 🏷️ Naming Conventions - Convenções de Nomenclatura
 * 
 * Guia de padronização para nomenclatura de variáveis, funções e
 * identificadores no módulo do card de progresso.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// CONVENÇÕES DE NOMENCLATURA
// ============================================================================

export const NAMING_CONVENTIONS = {
    // Funções - Verbos descritivos em camelCase
    functions: {
        // Padrão: verbo + substantivo + contexto (se necessário)
        examples: [
            'calculateProgressData',      // ✅ Bom
            'renderVisualState',         // ✅ Bom
            'determineColorScheme',      // ✅ Bom
            'validateUserInput',         // ✅ Bom
            'updateProgressCard',        // ✅ Bom
        ],
        avoid: [
            'calc',                      // ❌ Muito abreviado
            'doStuff',                   // ❌ Não descritivo
            'handleData',                // ❌ Muito genérico
            'process',                   // ❌ Vago
        ]
    },
    
    // Variáveis - Substantivos descritivos em camelCase
    variables: {
        // Padrão: substantivo + contexto + tipo (se necessário)
        examples: [
            'winRatePercentage',         // ✅ Bom - claro e específico
            'lossRatePercentage',        // ✅ Bom - claro e específico
            'pointsPercentageData',      // ✅ Bom - indica tipo de dados
            'visualStateConfig',         // ✅ Bom - indica configuração
            'badgeDisplayState',         // ✅ Bom - indica estado
            'colorSchemeTheme',          // ✅ Bom - específico
        ],
        avoid: [
            'wrPP',                      // ❌ Abreviação não clara
            'lrPP',                      // ❌ Abreviação não clara
            'lossPP',                    // ❌ Inconsistente com winRate
            'data',                      // ❌ Muito genérico
            'temp',                      // ❌ Não descritivo
        ]
    },
    
    // Parâmetros - Descritivos e consistentes
    parameters: {
        examples: [
            'winRateData',               // ✅ Em vez de wrPP
            'lossRateData',              // ✅ Em vez de lrPP/lossPP
            'pointsPercentageInfo',      // ✅ Mais descritivo
            'visualStateOptions',        // ✅ Indica opções
            'badgeConfiguration',        // ✅ Indica configuração
        ]
    },
    
    // Constantes - UPPER_SNAKE_CASE
    constants: {
        examples: [
            'WIN_RATE_THRESHOLD',        // ✅ Bom
            'LOSS_RATE_THRESHOLD',       // ✅ Bom
            'BADGE_MIN_DIFFERENCE',      // ✅ Bom
            'ANIMATION_DURATION',        // ✅ Bom
        ]
    },
    
    // Propriedades de objetos - camelCase consistente
    objectProperties: {
        examples: [
            'winRate',                   // ✅ Consistente
            'lossRate',                  // ✅ Consistente
            'totalOperations',           // ✅ Descritivo
            'isSignificant',             // ✅ Boolean claro
            'semanticMeaning',           // ✅ Descritivo
        ]
    }
};

// ============================================================================
// MAPEAMENTO DE REFATORAÇÃO
// ============================================================================

export const REFACTORING_MAP = {
    // Variáveis a serem renomeadas
    variables: {
        'wrPP': 'winRateData',
        'lrPP': 'lossRateData', 
        'lossPP': 'lossRateData',
        'wrDiff': 'winRateDifference',
        'lrDiff': 'lossRateDifference'
    },
    
    // Parâmetros a serem renomeados
    parameters: {
        'wrPP': 'winRateData',
        'lrPP': 'lossRateData',
        'lossPP': 'lossRateData'
    },
    
    // Funções que podem ser melhoradas
    functions: {
        // Já estão bem nomeadas, mas podem ser verificadas
        'applyWinRateColors': 'applyWinRateColorScheme',
        'applyLossRateColors': 'applyLossRateColorScheme'
    }
};

// ============================================================================
// VALIDAÇÃO DE NOMENCLATURA
// ============================================================================

/**
 * 🔍 Valida se um nome segue as convenções
 * @param {string} name - Nome a ser validado
 * @param {string} type - Tipo (function, variable, constant)
 * @returns {Object} Resultado da validação
 */
export function validateNaming(name, type) {
    const validation = {
        isValid: false,
        issues: [],
        suggestions: []
    };
    
    switch (type) {
        case 'function':
            // Deve começar com verbo
            const functionVerbs = ['calculate', 'render', 'determine', 'validate', 'update', 'apply', 'manage', 'resolve'];
            const startsWithVerb = functionVerbs.some(verb => name.toLowerCase().startsWith(verb));
            
            if (!startsWithVerb) {
                validation.issues.push('Função deve começar com verbo descritivo');
                validation.suggestions.push('Use verbos como: calculate, render, determine, validate, update');
            }
            
            if (name.length < 4) {
                validation.issues.push('Nome muito curto');
            }
            
            break;
            
        case 'variable':
            // Deve ser substantivo descritivo
            if (name.length < 3) {
                validation.issues.push('Nome muito curto');
            }
            
            if (/^[a-z]+PP$/.test(name)) {
                validation.issues.push('Evite abreviações como PP');
                validation.suggestions.push('Use nomes descritivos como winRateData, lossRateData');
            }
            
            break;
            
        case 'constant':
            if (!/^[A-Z][A-Z_]*$/.test(name)) {
                validation.issues.push('Constante deve usar UPPER_SNAKE_CASE');
            }
            break;
    }
    
    validation.isValid = validation.issues.length === 0;
    return validation;
}

// ============================================================================
// UTILITÁRIOS DE REFATORAÇÃO
// ============================================================================

/**
 * 🔄 Gera sugestão de nome melhorado
 * @param {string} currentName - Nome atual
 * @param {string} type - Tipo do identificador
 * @returns {string} Nome sugerido
 */
export function suggestBetterName(currentName, type) {
    // Aplica mapeamento de refatoração se disponível
    if (REFACTORING_MAP[type] && REFACTORING_MAP[type][currentName]) {
        return REFACTORING_MAP[type][currentName];
    }
    
    // Sugestões baseadas em padrões comuns
    const suggestions = {
        'wrPP': 'winRateData',
        'lrPP': 'lossRateData',
        'lossPP': 'lossRateData',
        'wrDiff': 'winRateDifference',
        'lrDiff': 'lossRateDifference',
        'calc': 'calculate',
        'proc': 'process',
        'mgr': 'manager',
        'cfg': 'config'
    };
    
    return suggestions[currentName] || currentName;
}

// ============================================================================
// EXPOSIÇÃO GLOBAL (DESENVOLVIMENTO)
// ============================================================================

if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.NAMING_CONVENTIONS = NAMING_CONVENTIONS;
    window.validateNaming = validateNaming;
    window.suggestBetterName = suggestBetterName;
}




