/**
 * =============================================================================
 * FIELD FOCUS MANAGER - Gerenciador de Efeitos de Focus Premium
 * =============================================================================
 * 
 * Projeto: Gerenciador PRO v9.3
 * Extraído de: sidebar.js (linhas 1879-2017)
 * Data: 25/12/2025
 * 
 * Responsabilidade: Gerenciar efeitos visuais de foco em campos de input,
 * number e select com feedback premium.
 * 
 * Seletores Monitorados:
 * - #capital-inicial, #percentual-entrada, #stop-win-perc, #stop-loss-perc
 * - #estrategia-select
 * - #sidebar-capital-inicial, #sidebar-percentual-entrada, etc.
 * 
 * Eventos:
 * - focus, blur, input (em campos)
 * - sidebarModalReady (documento)
 * 
 * Instância Global: window.fieldFocusManager
 * 
 * =============================================================================
 */

/**
 * Gerenciador de Efeitos de Focus Premium
 */
export class FieldFocusManager {
    constructor() {
        this.focusedField = null;
        this.typingTimer = null;
        this.typingDelay = 500; // ms após parar de digitar

        this.initialize();
    }

    initialize() {
        this.setupFocusListeners();
    }

    setupFocusListeners() {
        // Seletores para todos os campos relevantes
        const fieldSelectors = [
            '#capital-inicial',
            '#percentual-entrada',
            '#stop-win-perc',
            '#stop-loss-perc',
            '#estrategia-select',
            '#sidebar-capital-inicial',
            '#sidebar-percentual-entrada',
            '#sidebar-stop-win-perc',
            '#sidebar-stop-loss-perc',
            '#sidebar-estrategia-select',
        ];

        // Configurar listeners para campos existentes
        this.attachListenersToFields(fieldSelectors);

        // Configurar listeners para campos do sidebar quando criados
        document.addEventListener('sidebarModalReady', () => {
            setTimeout(() => {
                this.attachListenersToFields(fieldSelectors.filter((s) => s.includes('sidebar')));
            }, 50);
        });
    }

    attachListenersToFields(selectors) {
        selectors.forEach((selector) => {
            const field = document.querySelector(selector);
            if (field) {
                field.addEventListener('focus', (e) => this.handleFieldFocus(e));
                field.addEventListener('blur', (e) => this.handleFieldBlur(e));
                field.addEventListener('input', (e) => this.handleFieldTyping(e));
            }
        });
    }

    handleFieldFocus(event) {
        const field = event.target;

        // Remover efeito do campo anterior
        if (this.focusedField && this.focusedField !== field) {
            this.removeFocusEffect(this.focusedField);
        }

        // Aplicar efeito no campo atual
        this.applyFocusEffect(field);
        this.focusedField = field;

        // Log para debug
        console.log(`🎯 Campo focado: ${field.id || field.name || 'unnamed'}`);
    }

    handleFieldBlur(event) {
        const field = event.target;

        // Pequeno delay para transições suaves
        setTimeout(() => {
            this.removeFocusEffect(field);
            if (this.focusedField === field) {
                this.focusedField = null;
            }
        }, 100);
    }

    handleFieldTyping(event) {
        const field = event.target;

        // Adicionar classe de typing
        field.classList.add('typing');

        // Remover classe após parar de digitar
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            field.classList.remove('typing');
        }, this.typingDelay);
    }

    applyFocusEffect(field) {
        // O CSS nativo :focus já aplica os efeitos verdes elegantes
        // Não é necessário adicionar classes extras

        // Feedback visual adicional baseado no tipo de campo
        if (field.type === 'number') {
            this.addNumberFieldEffect(field);
        } else if (field.tagName === 'SELECT') {
            this.addSelectFieldEffect(field);
        }
    }

    removeFocusEffect(field) {
        field.classList.remove('typing');

        // Remover efeitos específicos
        field.classList.remove('number-focused', 'select-focused');
    }

    addNumberFieldEffect(field) {
        field.classList.add('number-focused');

        // Feedback visual para campos numéricos
        const wrapper = field.parentElement;
        if (wrapper) {
            wrapper.classList.add('number-field-active');
            setTimeout(() => {
                wrapper.classList.remove('number-field-active');
            }, 200);
        }
    }

    addSelectFieldEffect(field) {
        field.classList.add('select-focused');

        // Feedback visual para selects
        const icon = field.nextElementSibling;
        if (icon && icon.classList.contains('select-icon')) {
            icon.classList.add('select-icon-active');
            setTimeout(() => {
                icon.classList.remove('select-icon-active');
            }, 200);
        }
    }
}
