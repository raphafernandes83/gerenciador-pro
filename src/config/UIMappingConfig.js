/**
 * 🗺️ CONFIGURAÇÃO DE MAPEAMENTOS DA UI
 * Define mapeamentos entre elementos DOM e configurações/estado
 *
 * @module UIMappingConfig
 * @author Sistema de Qualidade Avançada
 * @version 2.0.0
 */

/**
 * Tipos de mapeamento suportados
 */
export const MAPPING_TYPES = {
    INPUT_VALUE: 'input_value',
    CHECKBOX_CHECKED: 'checkbox_checked',
    SELECT_VALUE: 'select_value',
    TEXT_CONTENT: 'text_content',
    CLASS_TOGGLE: 'class_toggle',
    ATTRIBUTE: 'attribute',
};

/**
 * Configuração de validação para diferentes tipos de campos
 */
export const FIELD_VALIDATORS = {
    NUMERIC: {
        validate: (value) => typeof value === 'number' && !isNaN(value),
        transform: (value) => Number(value),
        errorMessage: 'Valor deve ser numérico',
    },

    STRING: {
        validate: (value) => typeof value === 'string' || value != null,
        transform: (value) => String(value || ''),
        errorMessage: 'Valor deve ser string',
    },

    BOOLEAN: {
        validate: (value) => typeof value === 'boolean',
        transform: (value) => Boolean(value),
        errorMessage: 'Valor deve ser booleano',
    },

    PERCENTAGE: {
        validate: (value) => typeof value === 'number' && value >= 0 && value <= 100,
        transform: (value) => Math.max(0, Math.min(100, Number(value))),
        errorMessage: 'Valor deve ser percentual entre 0 e 100',
    },
};

/**
 * Configuração centralizada de todos os mapeamentos UI
 */
export const UI_MAPPING_CONFIG = {
    /**
     * Mapeamentos para campos de entrada (inputs)
     */
    INPUT_FIELDS: [
        {
            id: 'capitalInicial',
            domKey: 'capitalInicial',
            configKey: 'capitalInicial',
            type: MAPPING_TYPES.INPUT_VALUE,
            validator: FIELD_VALIDATORS.NUMERIC,
            required: true,
            description: 'Capital inicial para trading',
        },
        {
            id: 'percentualEntrada',
            domKey: 'percentualEntrada',
            configKey: 'percentualEntrada',
            type: MAPPING_TYPES.INPUT_VALUE,
            validator: FIELD_VALIDATORS.PERCENTAGE,
            required: true,
            description: 'Percentual de entrada por operação',
        },
        {
            id: 'stopWinPerc',
            domKey: 'stopWinPerc',
            configKey: 'stopWinPerc',
            type: MAPPING_TYPES.INPUT_VALUE,
            validator: FIELD_VALIDATORS.PERCENTAGE,
            required: false,
            description: 'Percentual de stop win',
        },
        {
            id: 'stopLossPerc',
            domKey: 'stopLossPerc',
            configKey: 'stopLossPerc',
            type: MAPPING_TYPES.INPUT_VALUE,
            validator: FIELD_VALIDATORS.PERCENTAGE,
            required: false,
            description: 'Percentual de stop loss',
        },
        {
            id: 'traderNameInput',
            domKey: 'traderNameInput',
            configKey: 'traderName',
            type: MAPPING_TYPES.INPUT_VALUE,
            validator: FIELD_VALIDATORS.STRING,
            required: false,
            description: 'Nome do trader',
        },
    ],

    /**
     * Mapeamentos para controles de toggle/checkbox
     */
    TOGGLE_CONTROLS: [
        {
            id: 'modoGuiado',
            domKey: 'modalModoGuiadoToggle',
            configKey: 'modoGuiado',
            type: MAPPING_TYPES.CHECKBOX_CHECKED,
            validator: FIELD_VALIDATORS.BOOLEAN,
            required: false,
            description: 'Modo guiado ativo',
        },
        {
            id: 'incorporarLucros',
            domKey: 'modalIncorporarLucroToggle',
            configKey: 'incorporarLucros',
            type: MAPPING_TYPES.CHECKBOX_CHECKED,
            validator: FIELD_VALIDATORS.BOOLEAN,
            required: false,
            description: 'Incorporar lucros ao capital',
        },
        {
            id: 'autoBloqueio',
            domKey: 'autoLockToggle',
            configKey: 'autoBloqueio',
            type: MAPPING_TYPES.CHECKBOX_CHECKED,
            validator: FIELD_VALIDATORS.BOOLEAN,
            required: false,
            description: 'Auto bloqueio ativo',
            dependencies: ['lockDurationContainer'], // Elementos dependentes
        },
        {
            id: 'notificacoes',
            domKey: 'modalNotificationsToggle',
            configKey: 'notificacoesAtivas',
            type: MAPPING_TYPES.CHECKBOX_CHECKED,
            validator: FIELD_VALIDATORS.BOOLEAN,
            required: false,
            description: 'Notificações ativas',
        },
    ],

    /**
     * Mapeamentos para controles de seleção
     */
    SELECT_CONTROLS: [
        {
            id: 'duracaoBloqueio',
            domKey: 'lockDurationSelect',
            configKey: 'duracaoBloqueio',
            type: MAPPING_TYPES.SELECT_VALUE,
            validator: FIELD_VALIDATORS.STRING,
            required: false,
            description: 'Duração do bloqueio automático',
        },
        {
            id: 'estrategiaAtiva',
            domKey: 'estrategiaSelect',
            configKey: 'estrategiaAtiva',
            type: MAPPING_TYPES.SELECT_VALUE,
            validator: FIELD_VALIDATORS.STRING,
            required: true,
            description: 'Estratégia de trading ativa',
        },
        {
            id: 'divisorRecuperacao',
            domKey: 'divisorRecuperacaoSlider',
            configKey: 'divisorRecuperacao',
            type: MAPPING_TYPES.SELECT_VALUE,
            validator: FIELD_VALIDATORS.NUMERIC,
            required: false,
            description: 'Divisor para recuperação',
            postProcessing: 'updateRecoverySplitDisplay', // Método a ser chamado após atualização
        },
    ],

    /**
     * Mapeamentos para elementos de display
     */
    DISPLAY_ELEMENTS: [
        {
            id: 'traderNameDisplay',
            domKey: 'traderName',
            configKey: 'traderName',
            type: MAPPING_TYPES.TEXT_CONTENT,
            validator: FIELD_VALIDATORS.STRING,
            required: false,
            description: 'Display do nome do trader',
        },
    ],

    /**
     * Configurações especiais e dependências
     */
    SPECIAL_CONFIGURATIONS: {
        LOCK_DURATION_VISIBILITY: {
            trigger: 'autoBloqueio',
            target: 'lockDurationContainer',
            action: 'toggle_visibility',
            invertCondition: true,
        },

        THEME_APPLICATION: {
            configKey: 'tema',
            handler: 'setTema',
        },
    },

    /**
     * Configurações de filtros do dashboard
     */
    DASHBOARD_FILTERS: [
        {
            id: 'periodFilters',
            selector: '#dashboard-period-filters button',
            dataAttribute: 'period',
            stateKey: 'dashboardFilterPeriod',
            activeClass: 'active',
        },
        {
            id: 'modeFilters',
            selector: '#dashboard-mode-filters button',
            dataAttribute: 'mode',
            stateKey: 'dashboardFilterMode',
            activeClass: 'active',
        },
    ],
};

/**
 * Classe para gerenciar mapeamentos de UI de forma type-safe
 */
export class UIMappingManager {
    constructor(dom, config, state) {
        this.dom = dom;
        this.config = config;
        this.state = state;
        this.validators = FIELD_VALIDATORS;
    }

    /**
     * Aplica mapeamento específico de forma segura
     *
     * @param {Object} mapping - Configuração do mapeamento
     * @param {*} sourceObject - Objeto fonte (config ou state)
     * @returns {boolean} Sucesso da operação
     */
    applyMapping(mapping, sourceObject = this.config) {
        try {
            const element = this.dom[mapping.domKey];

            if (!element) {
                if (mapping.required) {
                    console.warn(`Elemento requerido não encontrado: ${mapping.domKey}`);
                    return false;
                }
                return true; // Opcional e não encontrado = OK
            }

            const value = sourceObject[mapping.configKey];

            if (value === undefined || value === null) {
                if (mapping.required) {
                    console.warn(`Valor requerido não encontrado: ${mapping.configKey}`);
                    return false;
                }
                return true;
            }

            // Valida valor se validator disponível
            if (mapping.validator && !mapping.validator.validate(value)) {
                console.warn(
                    `Validação falhou para ${mapping.id}: ${mapping.validator.errorMessage}`
                );
                return false;
            }

            // Aplica transformação se necessário
            const transformedValue = mapping.validator ? mapping.validator.transform(value) : value;

            // Aplica valor baseado no tipo
            return this._applyValueByType(element, transformedValue, mapping.type);
        } catch (error) {
            console.error(`Erro ao aplicar mapeamento ${mapping.id}:`, error);
            return false;
        }
    }

    /**
     * Aplica valor ao elemento baseado no tipo de mapeamento
     *
     * @private
     * @param {Element} element - Elemento DOM
     * @param {*} value - Valor a ser aplicado
     * @param {string} type - Tipo de mapeamento
     * @returns {boolean} Sucesso da operação
     */
    _applyValueByType(element, value, type) {
        switch (type) {
            case MAPPING_TYPES.INPUT_VALUE:
            case MAPPING_TYPES.SELECT_VALUE:
                element.value = value;
                return true;

            case MAPPING_TYPES.CHECKBOX_CHECKED:
                element.checked = Boolean(value);
                return true;

            case MAPPING_TYPES.TEXT_CONTENT:
                element.textContent = String(value);
                return true;

            case MAPPING_TYPES.CLASS_TOGGLE:
                element.classList.toggle(value.className, value.condition);
                return true;

            case MAPPING_TYPES.ATTRIBUTE:
                element.setAttribute(value.attribute, value.value);
                return true;

            default:
                console.warn(`Tipo de mapeamento não suportado: ${type}`);
                return false;
        }
    }

    /**
     * Aplica categoria inteira de mapeamentos
     *
     * @param {Array} mappings - Array de configurações de mapeamento
     * @param {Object} sourceObject - Objeto fonte dos valores
     * @returns {Object} Resultado com sucessos e falhas
     */
    applyMappingCategory(mappings, sourceObject = this.config) {
        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };

        mappings.forEach((mapping) => {
            const success = this.applyMapping(mapping, sourceObject);

            if (success) {
                results.success++;

                // Executa pós-processamento se definido
                if (mapping.postProcessing && typeof this[mapping.postProcessing] === 'function') {
                    this[mapping.postProcessing](sourceObject[mapping.configKey]);
                }
            } else {
                results.failed++;
                results.errors.push(`Falha no mapeamento: ${mapping.id}`);
            }
        });

        return results;
    }

    /**
     * Obtém mapeamento por ID
     *
     * @param {string} id - ID do mapeamento
     * @returns {Object|null} Configuração do mapeamento
     */
    getMappingById(id) {
        const allMappings = [
            ...UI_MAPPING_CONFIG.INPUT_FIELDS,
            ...UI_MAPPING_CONFIG.TOGGLE_CONTROLS,
            ...UI_MAPPING_CONFIG.SELECT_CONTROLS,
            ...UI_MAPPING_CONFIG.DISPLAY_ELEMENTS,
        ];

        return allMappings.find((mapping) => mapping.id === id) || null;
    }

    /**
     * Valida configuração de mapeamento
     *
     * @param {Object} mapping - Configuração a ser validada
     * @returns {boolean} True se válida
     */
    validateMappingConfig(mapping) {
        const requiredFields = ['id', 'domKey', 'configKey', 'type'];

        return requiredFields.every((field) => mapping.hasOwnProperty(field));
    }
}

export default {
    MAPPING_TYPES,
    FIELD_VALIDATORS,
    UI_MAPPING_CONFIG,
    UIMappingManager,
};
