/**
 * 🎯 INICIALIZADOR DE ÍCONES DE AJUDA - MODAIS
 * Injeta ícones (?) dinamicamente em modais quando são abertos
 * Fase 3: Lab de Risco + Nova Sessão
 * 
 * @version 1.0.0
 */

import { logger } from '../../../utils/Logger.js';

class ModalsHelpIcons {
    constructor() {
        this.iconsInjected = {
            'risk-lab-modal': false,
            'session-mode-modal': false,
            'replay-modal': false,
            'settings-modal': false
        };
        this.observers = [];
    }

    /**
     * Cria um botão de ajuda (?)
     */
    createHelpIcon(metricId, value = 'default') {
        const button = document.createElement('button');
        button.className = 'help-icon';
        button.setAttribute('data-metric', metricId);
        button.setAttribute('data-value', value);
        button.setAttribute('aria-label', `Ajuda sobre ${metricId}`);
        button.setAttribute('title', 'Clique para mais informações');
        button.setAttribute('type', 'button'); // Previne submit em formulários

        const span = document.createElement('span');
        span.className = 'icon';
        span.textContent = '?';

        button.appendChild(span);
        return button;
    }

    /**
     * MODAL LABORATÓRIO DE RISCO
     * Injeta 8 ícones: 4 inputs + 4 resultados
     */
    injectRiskLabIcons() {
        const modal = document.getElementById('risk-lab-modal');
        if (!modal) {
            logger.warn('⚠️ Modal Lab de Risco não encontrado');
            return false;
        }

        if (this.iconsInjected['risk-lab-modal']) {
            logger.debug('✅ Ícones do Lab de Risco já injetados');
            return true;
        }

        logger.debug('🚀 Injetando ícones no Lab de Risco...');
        let injetados = 0;

        // 1. Win Rate (input desabilitado)
        const winRateLabel = Array.from(modal.querySelectorAll('label'))
            .find(l => l.textContent.includes('Taxa de Acerto'));
        if (winRateLabel && !winRateLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('lab-risk-winrate', 'input');
            winRateLabel.appendChild(document.createTextNode(' '));
            winRateLabel.appendChild(icon);
            injetados++;
            logger.debug('  ✓ Win Rate');
        }

        // 2. Payout (input desabilitado)
        const payoutLabel = Array.from(modal.querySelectorAll('label'))
            .find(l => l.textContent.includes('Payout Médio'));
        if (payoutLabel && !payoutLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('lab-risk-payout', 'input');
            payoutLabel.appendChild(document.createTextNode(' '));
            payoutLabel.appendChild(icon);
            injetados++;
            logger.debug('  ✓ Payout');
        }

        // 3. Nº de Simulações (select)
        const simLabel = modal.querySelector('label[for="sim-num-simulations"]');
        if (simLabel && !simLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('lab-risk-simulacoes', 'input');
            simLabel.appendChild(document.createTextNode(' '));
            simLabel.appendChild(icon);
            injetados++;
            logger.debug('  ✓ Simulações');
        }

        // 4. Máx Operações/Dia (input)
        const opsLabel = modal.querySelector('label[for="sim-max-ops"]');
        if (opsLabel && !opsLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('lab-risk-ops-dia', 'input');
            opsLabel.appendChild(document.createTextNode(' '));
            opsLabel.appendChild(icon);
            injetados++;
            logger.debug('  ✓ Ops/Dia');
        }

        // RESULTADOS - Aguardar simulação ser executada
        // Ícones nos resultados são injetados após aparecerem

        // 5. Prob. Atingir Stop Win
        const probWinCard = Array.from(modal.querySelectorAll('.stat-card'))
            .find(card => {
                const h4 = card.querySelector('h4');
                return h4 && h4.textContent.includes('Prob. Atingir Stop Win');
            });
        if (probWinCard) {
            const h4 = probWinCard.querySelector('h4');
            if (h4 && !h4.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('lab-risk-prob-lucro', 'result');
                h4.appendChild(document.createTextNode(' '));
                h4.appendChild(icon);
                injetados++;
                logger.debug('  ✓ Prob. Lucro');
            }
        }

        // 6. Prob. Atingir Stop Loss
        const probLossCard = Array.from(modal.querySelectorAll('.stat-card'))
            .find(card => {
                const h4 = card.querySelector('h4');
                return h4 && h4.textContent.includes('Prob. Atingir Stop Loss');
            });
        if (probLossCard) {
            const h4 = probLossCard.querySelector('h4');
            if (h4 && !h4.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('lab-risk-prob-perda', 'result');
                h4.appendChild(document.createTextNode(' '));
                h4.appendChild(icon);
                injetados++;
                logger.debug('  ✓ Prob. Perda');
            }
        }

        // 7. Resultado Médio
        const avgResultCard = Array.from(modal.querySelectorAll('.stat-card'))
            .find(card => {
                const h4 = card.querySelector('h4');
                return h4 && h4.textContent.includes('Resultado Médio');
            });
        if (avgResultCard) {
            const h4 = avgResultCard.querySelector('h4');
            if (h4 && !h4.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('lab-risk-resultado-medio', 'result');
                h4.appendChild(document.createTextNode(' '));
                h4.appendChild(icon);
                injetados++;
                logger.debug('  ✓ Resultado Médio');
            }
        }

        // 8. Drawdown Máximo
        const ddCard = Array.from(modal.querySelectorAll('.stat-card'))
            .find(card => {
                const h4 = card.querySelector('h4');
                return h4 && h4.textContent.includes('Drawdown Máximo');
            });
        if (ddCard) {
            const h4 = ddCard.querySelector('h4');
            if (h4 && !h4.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('lab-risk-drawdown', 'result');
                h4.appendChild(document.createTextNode(' '));
                h4.appendChild(icon);
                injetados++;
                logger.debug('  ✓ Drawdown');
            }
        }

        this.iconsInjected['risk-lab-modal'] = injetados >= 4; // Pelo menos inputs
        console.log(`✅ Lab de Risco: ${injetados} ícones injetados`);
        return true;
    }

    /**
     * MODAL NOVA SESSÃO
     * Injeta 3 ícones: título + 2 botões de modo
     */
    injectNewSessionIcons() {
        const modal = document.getElementById('session-mode-modal');
        if (!modal) {
            logger.warn('⚠️ Modal Nova Sessão não encontrado');
            return false;
        }

        if (this.iconsInjected['session-mode-modal']) {
            logger.debug('✅ Ícones da Nova Sessão já injetados');
            return true;
        }

        logger.debug('🚀 Injetando ícones na Nova Sessão...');
        let injetados = 0;

        // 1. Título do Modal
        const titulo = modal.querySelector('h2');
        if (titulo && !titulo.querySelector('.help-icon')) {
            // Cria wrapper flexbox para título + ícone
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.justifyContent = 'center';

            const textoTitulo = titulo.textContent;
            titulo.textContent = '';

            const span = document.createElement('span');
            span.textContent = textoTitulo;

            const icon = this.createHelpIcon('nova-sessao-titulo', 'modal');

            wrapper.appendChild(span);
            wrapper.appendChild(icon);
            titulo.appendChild(wrapper);

            injetados++;
            console.log('  ✓ Título');
        }

        // 2. Botão Sessão Oficial
        const btnOficial = modal.querySelector('#start-official-session-btn');
        if (btnOficial && !btnOficial.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('nova-sessao-oficial', 'button');
            icon.style.marginLeft = '8px';
            btnOficial.appendChild(icon);
            injetados++;
            console.log('  ✓ Modo Oficial');
        }

        // 3. Botão Sessão Simulação
        const btnSimulacao = modal.querySelector('#start-simulation-session-btn');
        if (btnSimulacao && !btnSimulacao.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('nova-sessao-simulacao', 'button');
            icon.style.marginLeft = '8px';
            btnSimulacao.appendChild(icon);
            injetados++;
            console.log('  ✓ Modo Simulação');
        }

        this.iconsInjected['session-mode-modal'] = injetados === 3;
        console.log(`✅ Nova Sessão: ${injetados} ícones injetados`);
        return true;
    }

    /**
     * MODAL REPLAY DA SESSÃO
     * Injeta 8 ícones: 1 título + 6 stats + 2 visualizações
     */
    injectReplayIcons() {
        const modal = document.getElementById('replay-modal');
        if (!modal) {
            logger.warn('⚠️ Modal Replay não encontrado');
            return false;
        }

        if (this.iconsInjected['replay-modal']) {
            logger.debug('✅ Ícones do Replay já injetados');
            return true;
        }

        logger.debug('🚀 Injetando ícones no Replay...');
        let injetados = 0;

        // 1. Título do Modal
        const titulo = modal.querySelector('#replay-title');
        if (titulo && !titulo.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('replay-titulo', 'modal');
            icon.style.marginLeft = '8px';
            titulo.appendChild(icon);
            injetados++;
            console.log('  ✓ Título');
        }

        // AGUARDAR RENDERIZAÇÃO DO STATS GRID
        // Stats são renderizados dinamicamente via JS
        setTimeout(() => {
            const statsGrid = modal.querySelector('#replay-stats-grid');
            if (!statsGrid) return;

            const statCards = statsGrid.querySelectorAll('.stat-card');

            // 2-7. Cards de Estatísticas (6 ícones)
            // Mapeamento baseado na UI REAL do modal
            const statsMapping = [
                { text: 'Resultado', metric: 'replay-resultado' },
                { text: 'Assertividade', metric: 'replay-assertividade' },
                { text: 'Payoff Ratio', metric: 'replay-payoff-ratio' },
                { text: 'Drawdown Máx', metric: 'replay-drawdown-max' }
            ];

            statsMapping.forEach(({ text, metric }) => {
                const card = Array.from(statCards).find(c => {
                    const h4 = c.querySelector('h4');
                    return h4 && h4.textContent.includes(text);
                });

                if (card) {
                    const h4 = card.querySelector('h4');
                    if (h4 && !h4.querySelector('.help-icon')) {
                        const icon = this.createHelpIcon(metric, 'stat');
                        h4.appendChild(document.createTextNode(' '));
                        h4.appendChild(icon);
                        injetados++;
                        console.log(`  ✓ ${text}`);
                    }
                }
            });

            // 8. Timeline Visualization
            const allHeaders = Array.from(modal.querySelectorAll('.panel-header h3'));
            const timelineHeader = allHeaders.find(h => h.textContent.includes('Histórico Visual'));
            if (timelineHeader && !timelineHeader.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('replay-timeline', 'viz');
                timelineHeader.appendChild(document.createTextNode(' '));
                timelineHeader.appendChild(icon);
                injetados++;
                console.log('  ✓ Timeline');
            }

            // 9. Gráfico Patrimônio
            const headers = Array.from(modal.querySelectorAll('.panel-header h3'));
            const patrimonioHeader = headers.find(h => h.textContent.includes('Curva de Património'));
            if (patrimonioHeader && !patrimonioHeader.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('replay-grafico', 'chart');
                patrimonioHeader.appendChild(document.createTextNode(' '));
                patrimonioHeader.appendChild(icon);
                injetados++;
                console.log('  ✓ Gráfico');
            }

            this.iconsInjected['replay-modal'] = injetados >= 3;
            console.log(`✅ Replay: ${injetados} ícones injetados`);

            // Re-anexa listeners
            if (window.metricTooltips) {
                window.metricTooltips.attachHelpIconListeners();
            }
        }, 300); // Aguarda renderização

        return true;
    }

    /**
     * MODAL CONFIGURAÇÕES
     * Injeta 6 ícones: título + divisor + nome + notif + 2 abas
     */
    injectSettingsIcons() {
        const modal = document.getElementById('settings-modal');
        if (!modal) {
            logger.warn('⚠️ Modal Settings não encontrado');
            return false;
        }

        if (this.iconsInjected['settings-modal']) {
            logger.debug('✅ Ícones do Settings já injetados');
            return true;
        }

        logger.debug('🚀 Injetando ícones no Settings...');
        let injetados = 0;

        // 1. Título do Modal
        const titulo = modal.querySelector('h2');
        if (titulo && !titulo.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-titulo', 'modal');
            icon.style.marginLeft = '8px';
            titulo.appendChild(icon);
            injetados++;
            console.log('  ✓ Título');
        }

        // 2. Divisor de Recuperação
        const divisorLabel = modal.querySelector('label[for="divisor-recuperacao-slider"]');
        if (divisorLabel && !divisorLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-divisor-recuperacao', 'input');
            divisorLabel.appendChild(document.createTextNode(' '));
            divisorLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Divisor Recuperação');
        }

        // 3. Tipo de Estratégia (novo)
        const strategyLabel = modal.querySelector('label'); // Primeiro label sem for específico
        if (strategyLabel && strategyLabel.textContent.includes('Tipo de Estratégia') && !strategyLabel.querySelector('.help-icon')) {
            // Remove tooltip antigo se existir
            const oldTooltip = strategyLabel.querySelector('.tooltip-icon');
            if (oldTooltip) {
                oldTooltip.remove();
            }

            const icon = this.createHelpIcon('settings-strategy-type', 'select');
            strategyLabel.appendChild(document.createTextNode(' '));
            strategyLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Tipo de Estratégia');
        }

        // 3. Nome do Trader
        const traderLabel = modal.querySelector('label[for="trader-name-input"]');
        if (traderLabel && !traderLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-trader-name', 'input');
            traderLabel.appendChild(document.createTextNode(' '));
            traderLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Nome Trader');
        }

        // 4. Notificações
        const notifLabel = modal.querySelector('label[for="modal-notifications-toggle"]');
        if (notifLabel && !notifLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-notifications', 'toggle');
            notifLabel.appendChild(document.createTextNode(' '));
            notifLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Notificações');
        }

        // 5. Aba Gerenciamento
        const tabGerenc = modal.querySelector('button[data-tab="settings-gerenciamento"]');
        if (tabGerenc && !tabGerenc.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-aba-gerenciamento', 'tab');
            icon.style.marginLeft = '4px';
            icon.style.fontSize = '0.9em';
            tabGerenc.appendChild(icon);
            injetados++;
            console.log('  ✓ Aba Gerenciamento');
        }

        // 6. Aba Preferências
        const tabPref = modal.querySelector('button[data-tab="settings-preferencias"]');
        if (tabPref && !tabPref.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('settings-aba-preferencias', 'tab');
            icon.style.marginLeft = '4px';
            icon.style.fontSize = '0.9em';
            tabPref.appendChild(icon);
            injetados++;
            console.log('  ✓ Aba Preferências');
        }

        this.iconsInjected['settings-modal'] = injetados >= 4;
        console.log(`✅ Settings: ${injetados} ícones injetados`);
        return true;
    }

    /**
     * Injeta ícones no modal especificado
     */
    injectForModal(modalId) {
        switch (modalId) {
            case 'risk-lab-modal':
                this.injectRiskLabIcons();
                break;
            case 'session-mode-modal':
                this.injectNewSessionIcons();
                break;
            case 'replay-modal':
                this.injectReplayIcons();
                break;
            case 'settings-modal':
                this.injectSettingsIcons();
                break;
            default:
                logger.warn(`⚠️ Modal ${modalId} não suportado`);
        }

        // Re-anexa listeners dos tooltips após injeção
        if (window.metricTooltips) {
            window.metricTooltips.attachHelpIconListeners();
            logger.debug('✅ Listeners dos tooltips re-anexados');
        }
    }

    /**
     * Inicializa observer para detectar quando modais são abertos
     */
    initOnModalOpen() {
        const modals = [
            'risk-lab-modal',
            'session-mode-modal',
            'replay-modal',
            'settings-modal'
        ];

        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal) {
                logger.warn(`⚠️ Modal ${modalId} não encontrado no DOM`);
                return;
            }

            // Observer para detectar classe 'active' OU 'show' sendo adicionada
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isActive = modal.classList.contains('active') || modal.classList.contains('show');
                        if (isActive) {
                            // Modal foi aberto, aguarda 300ms para garantir renderização
                            setTimeout(() => {
                                logger.log(`📂 Modal ${modalId} aberto, injetando ícones...`);
                                this.injectForModal(modalId);
                            }, 300);
                        }
                    }
                });
            });

            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['class']
            });

            this.observers.push(observer);
            console.log(`👀 Observer ativado para ${modalId}`);
        });

        console.log('✅ Sistema de detecção de modais ativo');
    }

    /**
     * Inicialização principal
     */
    init() {
        logger.info('🚀 Inicializando ModalsHelpIcons...');

        // Inicia observers
        this.initOnModalOpen();

        // Tenta injetar imediatamente se algum modal já estiver ativo
        setTimeout(() => {
            const riskModal = document.getElementById('risk-lab-modal');
            if (riskModal && riskModal.classList.contains('active')) {
                this.injectRiskLabIcons();
            }

            const sessionModal = document.getElementById('session-mode-modal');
            if (sessionModal && sessionModal.classList.contains('active')) {
                this.injectNewSessionIcons();
            }
        }, 500);

        logger.info('✅ ModalsHelpIcons inicializado');
    }

    /**
     * Cleanup - remove observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        logger.debug('🗑️ ModalsHelpIcons destruído');
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.modalsHelpIcons = new ModalsHelpIcons();
        window.modalsHelpIcons.init();
    });
} else {
    // DOM já está pronto
    window.modalsHelpIcons = new ModalsHelpIcons();
    window.modalsHelpIcons.init();
}

logger.info('📦 ModalsHelpIcons carregado');
