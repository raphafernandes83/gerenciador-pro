/**
 * 🔗 INTEGRAÇÃO: MetasUI + Progress Card
 * 
 * Sistema de integração via eventos que conecta MetasUI (lógica de metas)
 * com progress-card (UI de visualização).
 * 
 * @author Gerenciador PRO Team
 * @version 1.0.0
 */

import { logger } from './src/utils/Logger.js';

/**
 * Inicializa integração entre MetasUI e Progress Card
 */
export function initializeMetasIntegration() {
    logger.info('🔗 Inicializando integração MetasUI + Progress Card');

    // Listener: Quando state.historicoCombinado muda, atualiza MetasUI
    document.addEventListener('historicoAtualizado', () => {
        if (window.metasUI) {
            window.metasUI.atualizarProgressoBarra();
            window.metasUI.verificarProximidadeMetas();
            logger.debug('📊 MetasUI atualizado via evento historicoAtualizado');
        }
    });

    // Listener: Quando sessão inicia, reseta alertas
    document.addEventListener('sessaoIniciada', () => {
        if (window.metasUI) {
            window.metasUI.resetarAlertas();
            window.metasUI.atualizarTudo();
            logger.debug('🎯 MetasUI resetado para nova sessão');
        }
    });

    // Listener: Quando sessão termina, limpa MetasUI
    document.addEventListener('sessaoFinalizada', () => {
        if (window.metasUI) {
            window.metasUI.atualizarTudo();
            logger.debug('🛑 MetasUI atualizado após fim de sessão');
        }
    });

    // Listener: Quando capital muda, atualiza Stop Win/Loss
    document.addEventListener('capitalAtualizado', () => {
        if (window.metasUI && window.state?.isSessionActive) {
            window.metasUI.atualizarProgressoBarra();
            window.metasUI.verificarProximidadeMetas();
            logger.debug('💰 MetasUI atualizado após mudança de capital');
        }
    });

    // Listener: Meta de proximidade atingida (de MetasUI para UI)
    document.addEventListener('metaProxima', (event) => {
        const { tipo, progresso, mensagem } = event.detail;
        logger.info(`⚠️ Meta próxima: ${tipo} - ${progresso.toFixed(1)}%`);

        // Pode adicionar efeitos visuais extras aqui
        // Por exemplo, piscar o progress card, etc.
    });

    logger.info('✅ Integração MetasUI ativa - eventos configurados');
}

/**
 * Dispara evento de atualização de histórico
 * Usar após registrar operações
 */
export function notifyHistoricoAtualizado() {
    document.dispatchEvent(new CustomEvent('historicoAtualizado'));
}

/**
 * Dispara evento de sessão iniciada
 */
export function notifySessaoIniciada() {
    document.dispatchEvent(new CustomEvent('sessaoIniciada'));
}

/**
 * Dispara evento de sessão finalizada
 */
export function notifySessaoFinalizada() {
    document.dispatchEvent(new CustomEvent('sessaoFinalizada'));
}

/**
 * Dispara evento de capital atualizado
 */
export function notifyCapitalAtualizado() {
    document.dispatchEvent(new CustomEvent('capitalAtualizado'));
}

// Expor globalmente para fácil acesso
if (typeof window !== 'undefined') {
    window.metasIntegration = {
        initialize: initializeMetasIntegration,
        notifyHistorico: notifyHistoricoAtualizado,
        notifySessaoIniciada,
        notifySessaoFinalizada,
        notifyCapital: notifyCapitalAtualizado
    };
}
