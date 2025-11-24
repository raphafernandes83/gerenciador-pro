/**
 * Script de integração de validação
 * Aplica validação automaticamente aos inputs principais do sistema
 */

import {
    validateField,
    validateMultipleFields,
    attachRealTimeValidation,
    showFieldError,
    clearFieldError,
    sanitizeNumericInput
} from './InputValidation.js';
import { logger } from '../utils/Logger.js';

/**
 * Mapa de inputs para validar
 * @constant
 */
const INPUTS_TO_VALIDATE = {
    'capital-inicial': 'capitalInicial',
    'sidebar-capital-inicial': 'capitalInicial',
    'percentual-entrada': 'percentualEntrada',
    'stop-win-perc': 'stopWinPerc',
    'stop-loss-perc': 'stopLossPerc',
    'payout-ativo': 'payout'
};

/**
 * Inicializa sistema de validação
 */
export function initializeValidation() {
    logger.info('🛡️ Inicializando sistema de validação de inputs...');

    let validatedCount = 0;

    // Adiciona validação a cada input
    for (const [elementId, fieldName] of Object.entries(INPUTS_TO_VALIDATE)) {
        const element = document.getElementById(elementId);

        if (!element) {
            logger.debug(`Input não encontrado: ${elementId}`);
            continue;
        }

        // Callback de erro
        const onError = (result) => {
            showFieldError(element, result.error);
            logger.warn(`Validação falhou para ${fieldName}:`, result.error);
        };

        // Callback de sucesso
        const onValid = (result) => {
            clearFieldError(element);
            logger.debug(`Validação OK para ${fieldName}:`, result.value);
        };

        // Adiciona validação em tempo real
        try {
            attachRealTimeValidation(element, fieldName, onError, onValid);
            validatedCount++;
            logger.debug(`✅ Validação anexada a: ${elementId}`);
        } catch (error) {
            logger.error(`Erro ao anexar validação em ${elementId}:`, error);
        }
    }

    logger.info(`✅ Sistema de validação inicializado: ${validatedCount}/${Object.keys(INPUTS_TO_VALIDATE).length} inputs validados`);

    // Expõe funções globalmente para debug
    if (typeof window !== 'undefined') {
        window.validateField = validateField;
        window.validateAllInputs = validateAllCurrentInputs;
        logger.debug('🧪 Funções de validação expostas globalmente');
    }
}

/**
 * Valida todos os inputs atuais
 * @returns {boolean} True se todos válidos
 */
function validateAllCurrentInputs() {
    const fields = {};

    for (const [elementId, fieldName] of Object.entries(INPUTS_TO_VALIDATE)) {
        const element = document.getElementById(elementId);
        if (element) {
            fields[fieldName] = element.value;
        }
    }

    const result = validateMultipleFields(fields);

    if (!result.valid) {
        logger.warn('Validação falhou:', result.errors);

        // Mostra erros visualmente
        for (const [fieldName, error] of Object.entries(result.errors)) {
            const elementId = Object.keys(INPUTS_TO_VALIDATE).find(
                key => INPUTS_TO_VALIDATE[key] === fieldName
            );

            if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.classList.add('input-invalid');
                    showFieldError(element, error);
                }
            }
        }
    } else {
        logger.info('✅ Todos os inputs válidos!');
    }

    return result.valid;
}

/**
 * Valida antes de iniciar sessão
 * @returns {boolean} True se pode iniciar sessão
 */
export function validateBeforeSessionStart() {
    logger.info('🔍 Validando inputs antes de iniciar sessão...');

    const requiredInputs = {
        capitalInicial: document.getElementById('capital-inicial')?.value,
        percentualEntrada: document.getElementById('percentual-entrada')?.value,
        payout: document.getElementById('payout-ativo')?.value
    };

    const result = validateMultipleFields(requiredInputs);

    if (!result.valid) {
        const errorMessages = Object.values(result.errors).join('\n');

        logger.error('❌ Validação falhou antes de iniciar sessão:', result.errors);

        // Mostra alerta ao usuário
        if (typeof window !== 'undefined' && window.ui && window.ui.showAlert) {
            window.ui.showAlert(
                'Erro de Validação',
                `Por favor, corrija os seguintes erros:\n\n${errorMessages}`,
                'error'
            );
        }

        return false;
    }

    logger.info('✅ Inputs validados com sucesso');
    return true;
}

/**
 * Adiciona interceptor de validação ao botão de nova sessão
 */
export function interceptNewSessionButton() {
    const newSessionBtn = document.getElementById('new-session-btn');
    const sidebarNewSessionBtn = document.getElementById('sidebar-new-session-btn');

    const interceptor = (e) => {
        if (!validateBeforeSessionStart()) {
            e.preventDefault();
            e.stopPropagation();
            logger.warn('⚠️ Início de sessão bloqueado por validação');
            return false;
        }
    };

    if (newSessionBtn) {
        // Remove listeners antigos e adiciona novo no início
        const newBtn = newSessionBtn.cloneNode(true);
        newSessionBtn.parentNode.replaceChild(newBtn, newSessionBtn);
        newBtn.addEventListener('click', interceptor, true); // capture phase
        logger.debug('✅ Interceptor adicionado ao botão nova sessão');
    }

    if (sidebarNewSessionBtn) {
        const newBtn = sidebarNewSessionBtn.cloneNode(true);
        sidebarNewSessionBtn.parentNode.replaceChild(newBtn, sidebarNewSessionBtn);
        newBtn.addEventListener('click', interceptor, true);
        logger.debug('✅ Interceptor adicionado ao botão sidebar');
    }
}

// Auto-inicialização quando DOM estiver pronto
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeValidation();
            interceptNewSessionButton();
        });
    } else {
        // DOM já carregado
        initializeValidation();
        interceptNewSessionButton();
    }
}

export { validateAllCurrentInputs };
