/**
 * Assistente do Trader
 * Funcionalidades úteis APENAS para o trader - sem código técnico
 */

class TraderAssistant {
    constructor() {
        this.config = {
            enableAlerts: true,
            enableSuggestions: true,
            enablePatternDetection: true,
            alertThresholds: {
                winStreak: 5,
                lossStreak: 3,
                profitTarget: 0.8, // 80% da meta
                riskWarning: 0.7, // 70% do limite
            },
        };

        this.patterns = [];
        this.suggestions = [];
        this.alerts = [];

        // Sistema de controle de alertas
        this.alertsControl = {
            shown: new Map(), // Controla quais alertas já foram exibidos
            sessionDisabled: new Set(), // Alertas desabilitados nesta sessão
            lastValues: new Map(), // Últimos valores para detectar recuperação
            cooldowns: new Map(), // Cooldown entre alertas do mesmo tipo
            consecutiveCounts: new Map(), // Contador de avisos consecutivos por tipo
            escalated: new Set(), // Tipos que atingiram o limite e foram escalados (vermelho)
        };

        // Política: máximo de avisos consecutivos por tipo (após isso: suprimir e mostrar vermelho único)
        this.alertPolicy = {
            maxConsecutive: {
                risk_warning: 3,
                loss_streak: 3,
            },
        };

        // Configurações do trader (carregadas do localStorage)
        this.traderSettings = this._loadTraderSettings();

        this._initializeTraderAssistant();
    }

    /**
     * Inicializa o assistente do trader
     */
    _initializeTraderAssistant() {
        console.log('🎯 Assistente do Trader inicializado');

        // Garantir contêiner raiz de alertas com z-index máximo
        this._ensureAlertsRoot();

        // Monitorar operações para detectar padrões
        this._startPatternDetection();

        // Verificar metas periodicamente
        this._startGoalMonitoring();

        // Adicionar botão de configurações na interface
        this._addSettingsButton();

        // Adicionar função de teste global
        this._exposeTestFunctions();

        // Verificação inicial após 5 segundos
        setTimeout(() => {
            this._initialCheck();
        }, 5000);
    }

    /**
     * Expõe funções de teste globalmente
     */
    _exposeTestFunctions() {
        // Função de teste rápido
        window.testeRapidoAlertas = () => {
            console.log('🧪 Teste rápido de alertas...');

            // Alerta de teste imediato
            this.showTraderAlert({
                type: 'quick_test',
                level: 'success',
                title: '🎉 Teste Rápido Funcionando!',
                message: 'O sistema de alertas está operacional.',
                suggestion: 'Você pode agora configurar os thresholds desejados.',
                progress: 100,
            });

            // Abrir configurações após 3 segundos
            setTimeout(() => {
                this.openSettings();
            }, 3000);

            console.log('✅ Teste executado com sucesso');
        };

        // Função de diagnóstico completo
        window.diagnosticoCompleto = () => {
            console.log('🔍 Executando diagnóstico completo...');
            return this.forceCheckAlerts();
        };

        // Função para resetar e testar
        window.resetarETester = () => {
            console.log('🔄 Resetando sistema e testando...');

            // Resetar controles
            this.resetAlertControls();

            // Configurar thresholds baixos
            this.traderSettings.alerts.goalProximity.threshold = 10;
            this.traderSettings.alerts.riskWarning.threshold = 10;
            this.traderSettings.alerts.goalProximity.enabled = true;
            this.traderSettings.alerts.riskWarning.enabled = true;
            this._saveTraderSettings();

            console.log('⚙️ Thresholds configurados para 10%');

            // Forçar verificação
            setTimeout(() => {
                this.forceCheckAlerts();
            }, 1000);
        };

        console.log(
            '🎮 Funções de teste expostas: testeRapidoAlertas(), diagnosticoCompleto(), resetarETester()'
        );
    }

    /**
     * Verificação inicial do sistema
     */
    _initialCheck() {
        console.log('🔍 Executando verificação inicial do sistema...');

        const sessionData = this._getSessionData();
        const currentProfit = sessionData.capitalAtual - sessionData.capitalInicial;
        const stopLossAmount =
            (sessionData.capitalInicial * (sessionData.stopLossPerc || 20)) / 100;
        const riskPercentage = Math.abs(currentProfit / stopLossAmount) * 100;

        console.log('📊 Status inicial:', {
            capitalAtual: sessionData.capitalAtual,
            capitalInicial: sessionData.capitalInicial,
            lucroAtual: currentProfit,
            stopLossAmount: stopLossAmount,
            riskPercentage: riskPercentage.toFixed(1) + '%',
            threshold: this.traderSettings.alerts.riskWarning.threshold + '%',
        });

        // Se o risco está alto, forçar verificação
        if (riskPercentage >= this.traderSettings.alerts.riskWarning.threshold) {
            console.log('🚨 Risco alto detectado na inicialização, forçando alerta...');
            this.forceCheckAlerts();
        }
    }

    /**
     * Adiciona botão de configurações na interface principal
     */
    _addSettingsButton() {
        // Aguardar DOM carregar
        setTimeout(() => {
            // Verificar se já existe
            if (document.getElementById('trader-settings-btn')) return;

            // Criar botão
            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'trader-settings-btn';
            settingsBtn.className = 'trader-settings-floating-btn';
            settingsBtn.innerHTML = '⚙️';
            settingsBtn.title = 'Configurações do Assistente';
            settingsBtn.onclick = () => this.openSettings();

            // Adicionar estilos
            this._ensureFloatingButtonStyles();

            // Adicionar ao DOM
            document.body.appendChild(settingsBtn);

            console.log('🎯 Botão de configurações adicionado à interface');
        }, 2000);
    }

    /**
     * Analisa a sessão atual e gera sugestões para o trader
     */
    analyzeCurrentSession() {
        const sessionData = this._getSessionData();
        const analysis = {
            timestamp: Date.now(),
            session: {
                operations: sessionData.historicoCombinado?.length || 0,
                currentProfit: sessionData.capitalAtual - sessionData.capitalInicial,
                winRate: this._calculateWinRate(sessionData.historicoCombinado),
                streak: this._getCurrentStreak(sessionData.historicoCombinado),
            },
            suggestions: [],
            alerts: [],
            patterns: [],
        };

        // Gerar sugestões baseadas na análise
        analysis.suggestions = this._generateTraderSuggestions(analysis.session);

        // Verificar alertas importantes
        analysis.alerts = this._checkTraderAlerts(analysis.session);

        // Detectar padrões úteis
        analysis.patterns = this._detectTradingPatterns(sessionData.historicoCombinado);

        return analysis;
    }

    /**
     * Verifica se deve alertar sobre proximidade das metas (com controle inteligente)
     */
    checkGoalProximity() {
        const sessionData = this._getSessionData();
        const currentProfit = sessionData.capitalAtual - sessionData.capitalInicial;
        const stopWinAmount = (sessionData.capitalInicial * (sessionData.stopWinPerc || 12)) / 100;
        const stopLossAmount =
            (sessionData.capitalInicial * (sessionData.stopLossPerc || 20)) / 100;

        const alerts = [];

        // Verificar alerta de proximidade do Stop Win
        if (this.traderSettings.alerts.goalProximity.enabled) {
            const goalProgress = (currentProfit / stopWinAmount) * 100;
            const threshold = this.traderSettings.alerts.goalProximity.threshold;

            if (goalProgress >= threshold) {
                const alertKey = 'goal_proximity';

                const decision = this._shouldShowAlert(alertKey, goalProgress);
                if (decision.shouldShow) {
                    alerts.push({
                        type: alertKey,
                        level: decision.level || 'success',
                        title:
                            decision.level === 'danger'
                                ? '🚨 Meta Atingida!'
                                : '🎯 Próximo da Meta!',
                        message:
                            decision.message ||
                            `Você atingiu ${goalProgress.toFixed(1)}% da sua meta de ganhos!`,
                        suggestion: 'Considere operações mais conservadoras para proteger o lucro.',
                        progress: goalProgress,
                        remaining: stopWinAmount - currentProfit,
                    });
                    this._markAlertAsShown(alertKey, goalProgress);
                }
            }
        }

        // Verificar alerta de proximidade do Stop Loss
        if (this.traderSettings.alerts.riskWarning.enabled && currentProfit < 0) {
            const riskProgress = (Math.abs(currentProfit) / stopLossAmount) * 100;
            const threshold = this.traderSettings.alerts.riskWarning.threshold;

            if (riskProgress >= threshold) {
                const alertKey = 'risk_warning';

                const decision = this._shouldShowAlert(alertKey, riskProgress);
                if (decision.shouldShow) {
                    alerts.push({
                        type: alertKey,
                        level: decision.level || 'warning',
                        title:
                            decision.level === 'danger'
                                ? '🚨 Limite de Risco Atingido!'
                                : '⚠️ Atenção ao Risco!',
                        message:
                            decision.message ||
                            `Você atingiu ${riskProgress.toFixed(1)}% do seu limite de perda!`,
                        suggestion:
                            decision.level === 'danger'
                                ? 'Operações bloqueadas/evite operar até normalizar.'
                                : 'Considere reduzir o valor das próximas operações ou fazer uma pausa.',
                        progress: riskProgress,
                        remaining: stopLossAmount - Math.abs(currentProfit),
                    });
                    this._markAlertAsShown(alertKey, riskProgress);
                }
            }
        }

        return alerts;
    }

    /**
     * Detecta padrões de horários mais lucrativos
     */
    analyzeTimePatterns() {
        const sessionData = this._getSessionData();
        const operations = sessionData.historicoCombinado || [];

        if (operations.length < 10) {
            return {
                success: false,
                message: 'Poucos dados para análise de padrões de horário.',
            };
        }

        const hourlyStats = {};

        operations.forEach((op) => {
            if (op.timestamp) {
                const hour = new Date(op.timestamp).getHours();
                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = { wins: 0, losses: 0, total: 0, profit: 0 };
                }

                hourlyStats[hour].total++;
                hourlyStats[hour].profit += op.resultado || 0;

                if ((op.resultado || 0) > 0) {
                    hourlyStats[hour].wins++;
                } else {
                    hourlyStats[hour].losses++;
                }
            }
        });

        // Encontrar os melhores horários
        const bestHours = Object.entries(hourlyStats)
            .filter(([hour, stats]) => stats.total >= 3) // Pelo menos 3 operações
            .map(([hour, stats]) => ({
                hour: parseInt(hour),
                winRate: (stats.wins / stats.total) * 100,
                avgProfit: stats.profit / stats.total,
                operations: stats.total,
            }))
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 3);

        const worstHours = Object.entries(hourlyStats)
            .filter(([hour, stats]) => stats.total >= 3)
            .map(([hour, stats]) => ({
                hour: parseInt(hour),
                winRate: (stats.wins / stats.total) * 100,
                avgProfit: stats.profit / stats.total,
                operations: stats.total,
            }))
            .sort((a, b) => a.winRate - b.winRate)
            .slice(0, 2);

        return {
            success: true,
            bestHours,
            worstHours,
            suggestion: this._generateTimeBasedSuggestion(bestHours, worstHours),
        };
    }

    /**
     * Analisa sequências de vitórias e derrotas
     */
    analyzeStreaks() {
        const sessionData = this._getSessionData();
        const operations = sessionData.historicoCombinado || [];

        if (operations.length < 5) {
            return {
                success: false,
                message: 'Poucos dados para análise de sequências.',
            };
        }

        const streaks = this._calculateStreaks(operations);
        const currentStreak = this._getCurrentStreak(operations);

        return {
            success: true,
            longestWinStreak: streaks.longestWin,
            longestLossStreak: streaks.longestLoss,
            currentStreak: {
                type: currentStreak.type,
                count: currentStreak.count,
                suggestion: this._getStreakSuggestion(currentStreak),
            },
            averageStreaks: {
                win: streaks.avgWin,
                loss: streaks.avgLoss,
            },
        };
    }

    /**
     * Gera relatório simples para o trader
     */
    generateTraderReport() {
        const analysis = this.analyzeCurrentSession();
        const timePatterns = this.analyzeTimePatterns();
        const streaks = this.analyzeStreaks();
        const goalProximity = this.checkGoalProximity();

        return {
            timestamp: Date.now(),
            session: analysis.session,

            // Resumo executivo para o trader
            summary: {
                status: this._getSessionStatus(analysis.session),
                mainSuggestion: this._getMainSuggestion(analysis),
                riskLevel: this._calculateRiskLevel(analysis.session),
                nextAction: this._suggestNextAction(analysis.session),
            },

            // Insights úteis
            insights: {
                timePatterns: timePatterns.success ? timePatterns : null,
                streaks: streaks.success ? streaks : null,
                goalProximity: goalProximity.length > 0 ? goalProximity : null,
            },

            // Sugestões práticas
            suggestions: analysis.suggestions,

            // Alertas importantes
            alerts: [...analysis.alerts, ...goalProximity],
        };
    }

    /**
     * Mostra alerta discreto para o trader (com controles avançados)
     */
    showTraderAlert(alert) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Criar elemento de alerta discreto
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `trader-alert trader-alert-${alert.level}`;
        alertElement.innerHTML = `
            <div class="trader-alert-content">
                <div class="trader-alert-title">${alert.title}</div>
                <div class="trader-alert-message">${alert.message}</div>
                ${alert.suggestion ? `<div class="trader-alert-suggestion">💡 ${alert.suggestion}</div>` : ''}
                ${alert.progress ? `<div class="trader-alert-progress">Progresso: ${alert.progress.toFixed(1)}%</div>` : ''}
            </div>
            <div class="trader-alert-controls">
                <label class="trader-alert-checkbox">
                    <input type="checkbox" id="no-show-${alert.type}"> 
                    <span>Não mostrar mais nesta sessão</span>
                </label>
                <div class="trader-alert-buttons">
                    <button class="trader-alert-btn trader-alert-config" type="button">⚙️</button>
                    <button class="trader-alert-btn trader-alert-close" type="button">×</button>
                </div>
            </div>
        `;

        // Adicionar estilos e root se não existirem
        this._ensureTraderAlertStyles();
        const alertsRoot = this._ensureAlertsRoot();

        // Adicionar ao DOM (no root de alertas, garante z-index máximo)
        alertsRoot.appendChild(alertElement);

        // 🔧 CSP FIX: Adicionar event listeners após inserir no DOM
        alertElement.querySelector('.trader-alert-config').addEventListener('click', () => this.openSettings());
        alertElement.querySelector('.trader-alert-close').addEventListener('click', () => this.closeAlert(alertId, alert.type));

        // Tocar som do alerta (se habilitado)
        this._playAlertSound(alert.level);

        // Não auto-remover - apenas com ação manual
        // (Conforme solicitado: deve ficar até o trader fechar)
    }

    /**
     * Fecha alerta e verifica se deve desabilitar para a sessão
     */
    closeAlert(alertId, alertType) {
        const alertElement = document.getElementById(alertId);
        if (!alertElement) return;

        // Verificar se o checkbox está marcado
        const checkbox = alertElement.querySelector(`#no-show-${alertType}`);
        if (checkbox && checkbox.checked) {
            this._disableAlertForSession(alertType);
            console.log(`🔕 Alerta '${alertType}' desabilitado para esta sessão`);
        }

        // Remover o alerta
        alertElement.remove();
    }

    /**
     * Abre painel de configurações do trader
     */
    openSettings() {
        // Verificar se já existe um painel aberto
        const existingPanel = document.getElementById('trader-settings-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'trader-settings-panel';
        settingsPanel.className = 'trader-settings-panel';
        settingsPanel.innerHTML = `
            <div class="trader-settings-content">
                <div class="trader-settings-header">
                    <h3>⚙️ Configurações do Assistente</h3>
                    <button class="trader-settings-close" type="button">×</button>
                </div>
                
                <div class="trader-settings-body">
                    <div class="trader-settings-section">
                        <h4>🎯 Alertas de Meta</h4>
                        <label class="trader-settings-item">
                            <input type="checkbox" id="goal-alerts-enabled" ${this.traderSettings.alerts.goalProximity.enabled ? 'checked' : ''}>
                            <span>Habilitar alertas de proximidade da meta</span>
                        </label>
                        <label class="trader-settings-item">
                            <span>Alertar quando atingir:</span>
                            <input type="range" id="goal-threshold" min="50" max="95" step="5" value="${this.traderSettings.alerts.goalProximity.threshold}">
                            <span id="goal-threshold-value">${this.traderSettings.alerts.goalProximity.threshold}%</span>
                        </label>
                    </div>

                    <div class="trader-settings-section">
                        <h4>⚠️ Alertas de Risco</h4>
                        <label class="trader-settings-item">
                            <input type="checkbox" id="risk-alerts-enabled" ${this.traderSettings.alerts.riskWarning.enabled ? 'checked' : ''}>
                            <span>Habilitar alertas de risco</span>
                        </label>
                        <label class="trader-settings-item">
                            <span>Alertar quando atingir:</span>
                            <input type="range" id="risk-threshold" min="50" max="90" step="5" value="${this.traderSettings.alerts.riskWarning.threshold}">
                            <span id="risk-threshold-value">${this.traderSettings.alerts.riskWarning.threshold}%</span>
                        </label>
                    </div>

                    <div class="trader-settings-section">
                        <h4>🔄 Alertas de Sequência</h4>
                        <label class="trader-settings-item">
                            <input type="checkbox" id="streak-alerts-enabled" ${this.traderSettings.alerts.streakAlerts.enabled ? 'checked' : ''}>
                            <span>Habilitar alertas de sequência</span>
                        </label>
                        <label class="trader-settings-item">
                            <span>Alertar após:</span>
                            <input type="number" id="loss-streak" min="2" max="10" value="${this.traderSettings.alerts.streakAlerts.lossStreak}">
                            <span>perdas consecutivas</span>
                        </label>
                    </div>

                    <div class="trader-settings-section">
                        <h4>🔊 Interface</h4>
                        <label class="trader-settings-item">
                            <input type="checkbox" id="sound-enabled" ${this.traderSettings.ui.soundEnabled ? 'checked' : ''}>
                            <span>Habilitar sons de alerta</span>
                        </label>
                    </div>
                </div>

                <div class="trader-settings-footer">
                    <button class="trader-settings-btn trader-settings-save" type="button">💾 Salvar</button>
                    <button class="trader-settings-btn trader-settings-reset" type="button">🔄 Restaurar Padrão</button>
                </div>
            </div>
        `;

        // Adicionar estilos se não existirem
        this._ensureSettingsStyles();

        // Adicionar ao DOM
        document.body.appendChild(settingsPanel);

        // 🔧 CSP FIX: Adicionar event listeners após inserir no DOM
        settingsPanel.querySelector('.trader-settings-close').addEventListener('click', () => settingsPanel.remove());
        settingsPanel.querySelector('.trader-settings-save').addEventListener('click', () => this.saveSettings());
        settingsPanel.querySelector('.trader-settings-reset').addEventListener('click', () => this.resetSettings());

        // Configurar listeners para os sliders
        this._setupSettingsListeners();
    }

    /**
     * Salva as configurações do painel
     */
    saveSettings() {
        const panel = document.getElementById('trader-settings-panel');
        if (!panel) return;

        // Coletar valores do painel
        this.traderSettings.alerts.goalProximity.enabled =
            panel.querySelector('#goal-alerts-enabled').checked;
        this.traderSettings.alerts.goalProximity.threshold = parseInt(
            panel.querySelector('#goal-threshold').value
        );

        this.traderSettings.alerts.riskWarning.enabled =
            panel.querySelector('#risk-alerts-enabled').checked;
        this.traderSettings.alerts.riskWarning.threshold = parseInt(
            panel.querySelector('#risk-threshold').value
        );

        this.traderSettings.alerts.streakAlerts.enabled =
            panel.querySelector('#streak-alerts-enabled').checked;
        this.traderSettings.alerts.streakAlerts.lossStreak = parseInt(
            panel.querySelector('#loss-streak').value
        );

        this.traderSettings.ui.soundEnabled = panel.querySelector('#sound-enabled').checked;

        // Salvar no localStorage
        this._saveTraderSettings();

        // Mostrar confirmação
        this._showSettingsConfirmation('✅ Configurações salvas com sucesso!');

        // Fechar painel
        setTimeout(() => panel.remove(), 1500);
    }

    /**
     * Restaura configurações padrão
     */
    resetSettings() {
        this.traderSettings = this._loadTraderSettings();
        this._showSettingsConfirmation('🔄 Configurações restauradas para o padrão!');

        // Reabrir painel com valores padrão
        setTimeout(() => {
            document.getElementById('trader-settings-panel')?.remove();
            this.openSettings();
        }, 1000);
    }

    /**
     * Testa o sistema de alertas (para demonstração)
     */
    testAlertSystem() {
        console.log('🧪 Testando sistema de alertas...');

        // Teste de alerta de meta
        this.showTraderAlert({
            type: 'goal_proximity',
            level: 'success',
            title: '🎯 Teste: Próximo da Meta!',
            message: 'Este é um teste do sistema de alertas de proximidade da meta.',
            suggestion: 'Sistema funcionando corretamente!',
            progress: 85.5,
        });

        // Teste de alerta de risco após 3 segundos
        setTimeout(() => {
            this.showTraderAlert({
                type: 'risk_warning',
                level: 'warning',
                title: '⚠️ Teste: Atenção ao Risco!',
                message: 'Este é um teste do sistema de alertas de risco.',
                suggestion: 'Todos os controles estão funcionando!',
                progress: 75.2,
            });
        }, 3000);

        console.log('✅ Testes de alerta iniciados. Verifique os alertas na tela.');
    }

    /**
     * Força verificação manual dos alertas (para debug)
     */
    forceCheckAlerts() {
        console.log('🔍 Forçando verificação de alertas...');

        const sessionData = this._getSessionData();
        console.log('📊 Dados da sessão:', {
            capitalAtual: sessionData.capitalAtual,
            capitalInicial: sessionData.capitalInicial,
            stopWinPerc: sessionData.stopWinPerc,
            stopLossPerc: sessionData.stopLossPerc,
            lucroAtual: sessionData.capitalAtual - sessionData.capitalInicial,
            operacoes: sessionData.historicoCombinado?.length || 0,
        });

        // Verificar alertas de meta
        const goalAlerts = this.checkGoalProximity();
        console.log('🎯 Alertas de meta encontrados:', goalAlerts);

        if (goalAlerts.length > 0) {
            goalAlerts.forEach((alert) => {
                console.log('📢 Exibindo alerta:', alert);
                this.showTraderAlert(alert);
            });
        } else {
            console.log('ℹ️ Nenhum alerta de meta ativo no momento');
        }

        // Verificar alertas de sequência
        const analysis = this.analyzeCurrentSession();
        console.log('📈 Análise da sessão:', analysis);

        if (analysis.alerts.length > 0) {
            analysis.alerts.forEach((alert) => {
                console.log('📢 Exibindo alerta de sequência:', alert);
                this.showTraderAlert(alert);
            });
        } else {
            console.log('ℹ️ Nenhum alerta de sequência ativo no momento');
        }

        return {
            sessionData,
            goalAlerts,
            sessionAnalysis: analysis,
        };
    }

    /**
     * Configura listeners para o painel de configurações
     */
    _setupSettingsListeners() {
        const goalThreshold = document.getElementById('goal-threshold');
        const riskThreshold = document.getElementById('risk-threshold');

        if (goalThreshold) {
            goalThreshold.addEventListener('input', (e) => {
                document.getElementById('goal-threshold-value').textContent = e.target.value + '%';
            });
        }

        if (riskThreshold) {
            riskThreshold.addEventListener('input', (e) => {
                document.getElementById('risk-threshold-value').textContent = e.target.value + '%';
            });
        }
    }

    /**
     * Mostra confirmação de configurações
     */
    _showSettingsConfirmation(message) {
        const confirmation = document.createElement('div');
        confirmation.className = 'trader-settings-confirmation';
        confirmation.textContent = message;

        document.body.appendChild(confirmation);

        setTimeout(() => {
            confirmation.remove();
        }, 3000);
    }

    // Métodos privados
    _getSessionData() {
        const isValid = (n) => typeof n === 'number' && isFinite(n) && n > 0;
        const pickValid = (list) => {
            for (const v of list) {
                if (isValid(v)) return v;
            }
            return undefined;
        };

        const store =
            window.sessionStore && typeof window.sessionStore.getState === 'function'
                ? window.sessionStore.getState()
                : {};
        const legacyState = window.state || {};
        const legacyConfig = window.config || {};

        const capitalInicial =
            pickValid([
                store.capitalInicial,
                store.capitalInicioSessao,
                legacyState.capitalInicial,
                legacyState.capitalInicioSessao,
                15000,
            ]) || 15000;

        const capitalAtual =
            pickValid([store.capitalAtual, legacyState.capitalAtual, capitalInicial]) ||
            capitalInicial;

        const stopWinPerc = pickValid([store.stopWinPerc, legacyConfig.stopWinPerc, 12]) || 12;

        const stopLossPerc = pickValid([store.stopLossPerc, legacyConfig.stopLossPerc, 20]) || 20;

        const historicoCombinado =
            Array.isArray(store.historicoCombinado) && store.historicoCombinado.length > 0
                ? store.historicoCombinado
                : Array.isArray(legacyState.historicoCombinado)
                    ? legacyState.historicoCombinado
                    : [];

        return {
            capitalAtual,
            capitalInicial,
            stopWinPerc,
            stopLossPerc,
            historicoCombinado,
        };
    }

    /**
     * Carrega configurações do trader do localStorage
     */
    _loadTraderSettings() {
        const defaultSettings = {
            alerts: {
                goalProximity: {
                    enabled: true,
                    threshold: 80, // % da meta para alertar
                    showOnce: true,
                },
                riskWarning: {
                    enabled: true,
                    threshold: 70, // % do limite para alertar
                    showOnce: true,
                },
                streakAlerts: {
                    enabled: true,
                    winStreak: 5,
                    lossStreak: 3,
                },
            },
            ui: {
                position: 'top-right',
                autoClose: false,
                soundEnabled: true,
            },
        };

        try {
            const saved = localStorage.getItem('traderAssistant_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('TraderAssistant: Erro ao carregar configurações, usando padrão:', error);
            return defaultSettings;
        }
    }

    /**
     * Salva configurações do trader no localStorage
     */
    _saveTraderSettings() {
        try {
            localStorage.setItem('traderAssistant_settings', JSON.stringify(this.traderSettings));
        } catch (error) {
            console.warn('TraderAssistant: Erro ao salvar configurações:', error);
        }
    }

    /**
     * Verifica se deve mostrar um alerta (controle inteligente)
     */
    _shouldShowAlert(alertKey, currentValue) {
        const policy = this._getAlertPolicy(alertKey);
        const threshold =
            alertKey === 'risk_warning'
                ? this.traderSettings.alerts.riskWarning.threshold || 70
                : this.traderSettings.alerts.goalProximity.threshold || 80;

        if (this.alertsControl.sessionDisabled.has(alertKey)) {
            return { shouldShow: false };
        }

        const cooldownKey = `${alertKey}_cooldown`;
        const lastCooldown = this.alertsControl.cooldowns.get(cooldownKey);
        if (
            policy.cooldownMs > 0 &&
            lastCooldown &&
            Date.now() - lastCooldown < policy.cooldownMs
        ) {
            return { shouldShow: false };
        }

        const wasShown = this.alertsControl.shown.get(alertKey);
        const lastValue = this.alertsControl.lastValues.get(alertKey);
        const currentCount = this.alertsControl.consecutiveCounts.get(alertKey) || 0;
        const isEscalated = this.alertsControl.escalated.has(alertKey);

        if (
            typeof currentValue === 'number' &&
            currentValue < threshold - policy.recoveryHysteresis
        ) {
            this.alertsControl.shown.set(alertKey, false);
            this.alertsControl.consecutiveCounts.set(alertKey, 0);
            this.alertsControl.escalated.delete(alertKey);
        }

        if (isEscalated) {
            return { shouldShow: false };
        }

        if (alertKey === 'risk_warning') {
            const step = policy.stepPercent;
            if (currentCount < policy.maxConsecutive) {
                const required = threshold + currentCount * step;
                if (currentValue >= required) {
                    return {
                        shouldShow: true,
                        level: 'warning',
                        message: `Você atingiu ${currentValue.toFixed(1)}% do seu limite de perda!`,
                    };
                }
                return { shouldShow: false };
            } else {
                return {
                    shouldShow: true,
                    level: 'danger',
                    message: policy.escalatedMessage.replace('{value}', currentValue.toFixed(1)),
                };
            }
        }

        if (!wasShown) {
            return {
                shouldShow: true,
                level: 'success',
                message: `Você atingiu ${currentValue.toFixed(1)}% da sua meta de ganhos!`,
            };
        }

        if (lastValue !== undefined) {
            const recovery = Math.abs(currentValue - lastValue);
            if (recovery >= policy.recoveryPercent) {
                this.alertsControl.shown.set(alertKey, false);
                return {
                    shouldShow: true,
                    level: 'success',
                    message: `Você atingiu ${currentValue.toFixed(1)}% da sua meta de ganhos!`,
                };
            }
        }

        return { shouldShow: false };
    }

    /**
     * Marca alerta como exibido
     */
    _markAlertAsShown(alertKey, currentValue) {
        const policy = this._getAlertPolicy(alertKey);
        this.alertsControl.shown.set(alertKey, true);
        this.alertsControl.lastValues.set(alertKey, currentValue);
        if (policy.cooldownMs > 0) {
            this.alertsControl.cooldowns.set(`${alertKey}_cooldown`, Date.now());
        }
        const prev = this.alertsControl.consecutiveCounts.get(alertKey) || 0;
        const next = prev + 1;
        this.alertsControl.consecutiveCounts.set(alertKey, next);
        if (next > policy.maxConsecutive) {
            this.alertsControl.escalated.add(alertKey);
        }
    }

    _getAlertPolicy(alertKey) {
        const defaults = {
            maxConsecutive: Infinity,
            recoveryPercent: 15,
            recoveryHysteresis: 5,
            cooldownMs: 60000,
            stepPercent: 5,
            escalatedMessage: '🚨 Limite de Risco Atingido! Risco em {value}% do limite.',
        };
        if (alertKey === 'risk_warning') {
            return {
                ...defaults,
                maxConsecutive: 3,
                cooldownMs: 0,
                recoveryPercent: 999,
                escalatedMessage: '🚨 Limite de Risco Atingido! Risco em {value}% do limite.',
            };
        }
        if (alertKey === 'goal_proximity') {
            return {
                ...defaults,
                maxConsecutive: 1,
            };
        }
        return defaults;
    }

    /**
     * Desabilita alerta para esta sessão
     */
    _disableAlertForSession(alertKey) {
        this.alertsControl.sessionDisabled.add(alertKey);
    }

    /**
     * Reseta controles de alerta (nova sessão)
     */
    resetAlertControls() {
        this.alertsControl.shown.clear();
        this.alertsControl.sessionDisabled.clear();
        this.alertsControl.lastValues.clear();
        this.alertsControl.cooldowns.clear();
        this.alertsControl.consecutiveCounts.clear();
        this.alertsControl.escalated.clear();
        console.log('🔄 TraderAssistant: Controles de alerta resetados para nova sessão');
    }

    _calculateWinRate(operations) {
        if (!operations || operations.length === 0) return 0;

        const wins = operations.filter((op) => (op.resultado || 0) > 0).length;
        return (wins / operations.length) * 100;
    }

    _getCurrentStreak(operations) {
        if (!operations || operations.length === 0) {
            return { type: 'none', count: 0 };
        }

        let currentStreak = 0;
        let streakType = 'none';

        // Analisar do mais recente para o mais antigo
        for (let i = operations.length - 1; i >= 0; i--) {
            const result = operations[i].resultado || 0;

            if (i === operations.length - 1) {
                // Primeira operação (mais recente)
                streakType = result > 0 ? 'win' : result < 0 ? 'loss' : 'none';
                currentStreak = result !== 0 ? 1 : 0;
            } else {
                // Operações subsequentes
                const currentType = result > 0 ? 'win' : result < 0 ? 'loss' : 'none';

                if (currentType === streakType && result !== 0) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        return { type: streakType, count: currentStreak };
    }

    _generateTraderSuggestions(session) {
        const suggestions = [];

        // Sugestões baseadas no win rate
        if (session.winRate < 40) {
            suggestions.push({
                type: 'strategy',
                priority: 'high',
                title: 'Revisar Estratégia',
                message: 'Win rate baixo. Considere analisar os padrões das operações perdedoras.',
                action: 'Reduza o valor das operações até melhorar a assertividade.',
            });
        } else if (session.winRate > 70) {
            suggestions.push({
                type: 'opportunity',
                priority: 'medium',
                title: 'Boa Performance',
                message: 'Excelente win rate! Você está em um bom momento.',
                action: 'Mantenha a estratégia atual e considere aumentar gradualmente o valor.',
            });
        }

        // Sugestões baseadas no streak
        if (session.streak.type === 'loss' && session.streak.count >= 3) {
            suggestions.push({
                type: 'risk',
                priority: 'high',
                title: 'Sequência de Perdas',
                message: `${session.streak.count} perdas consecutivas detectadas.`,
                action: 'Considere fazer uma pausa ou reduzir significativamente o valor das operações.',
            });
        } else if (session.streak.type === 'win' && session.streak.count >= 5) {
            suggestions.push({
                type: 'caution',
                priority: 'medium',
                title: 'Sequência de Vitórias',
                message: `${session.streak.count} vitórias consecutivas. Cuidado com o excesso de confiança.`,
                action: 'Mantenha a disciplina e não aumente drasticamente os valores.',
            });
        }

        // Sugestões baseadas no lucro atual
        if (session.currentProfit < 0 && Math.abs(session.currentProfit) > 500) {
            suggestions.push({
                type: 'recovery',
                priority: 'high',
                title: 'Recuperação Necessária',
                message: 'Prejuízo significativo na sessão.',
                action: 'Considere operações menores e mais conservadoras para recuperação gradual.',
            });
        }

        return suggestions;
    }

    _checkTraderAlerts(session) {
        const alerts = [];

        // Alerta de streak de perdas
        if (
            session.streak.type === 'loss' &&
            session.streak.count >= this.config.alertThresholds.lossStreak
        ) {
            alerts.push({
                type: 'loss_streak',
                level: 'warning',
                title: '⚠️ Sequência de Perdas',
                message: `${session.streak.count} perdas consecutivas.`,
                suggestion: 'Considere fazer uma pausa para reavaliar sua estratégia.',
            });
        }

        // Alerta de win streak alto
        if (
            session.streak.type === 'win' &&
            session.streak.count >= this.config.alertThresholds.winStreak
        ) {
            alerts.push({
                type: 'win_streak',
                level: 'info',
                title: '🎯 Sequência de Vitórias',
                message: `${session.streak.count} vitórias consecutivas!`,
                suggestion: 'Excelente momento, mas mantenha a disciplina.',
            });
        }

        return alerts;
    }

    _detectTradingPatterns(operations) {
        // Implementação simplificada de detecção de padrões
        const patterns = [];

        if (!operations || operations.length < 10) return patterns;

        // Padrão: Melhor performance em determinados valores
        const valuePerformance = this._analyzeValuePerformance(operations);
        if (valuePerformance.bestValue) {
            patterns.push({
                type: 'value_performance',
                title: 'Valor Ótimo Detectado',
                description: `Melhor performance com operações de R$ ${valuePerformance.bestValue}`,
                confidence: valuePerformance.confidence,
            });
        }

        return patterns;
    }

    _analyzeValuePerformance(operations) {
        const valueStats = {};

        operations.forEach((op) => {
            const value = op.valor || 0;
            if (value > 0) {
                if (!valueStats[value]) {
                    valueStats[value] = { wins: 0, total: 0, profit: 0 };
                }

                valueStats[value].total++;
                valueStats[value].profit += op.resultado || 0;

                if ((op.resultado || 0) > 0) {
                    valueStats[value].wins++;
                }
            }
        });

        // Encontrar o valor com melhor performance
        let bestValue = null;
        let bestWinRate = 0;

        Object.entries(valueStats).forEach(([value, stats]) => {
            if (stats.total >= 3) {
                // Pelo menos 3 operações
                const winRate = (stats.wins / stats.total) * 100;
                if (winRate > bestWinRate) {
                    bestWinRate = winRate;
                    bestValue = parseFloat(value);
                }
            }
        });

        return {
            bestValue,
            confidence: bestWinRate > 60 ? 'high' : bestWinRate > 50 ? 'medium' : 'low',
        };
    }

    _calculateStreaks(operations) {
        let longestWin = 0;
        let longestLoss = 0;
        let currentWin = 0;
        let currentLoss = 0;
        let totalWinStreaks = 0;
        let totalLossStreaks = 0;
        let winStreakCount = 0;
        let lossStreakCount = 0;

        operations.forEach((op) => {
            const result = op.resultado || 0;

            if (result > 0) {
                currentWin++;
                if (currentLoss > 0) {
                    totalLossStreaks += currentLoss;
                    lossStreakCount++;
                    longestLoss = Math.max(longestLoss, currentLoss);
                    currentLoss = 0;
                }
            } else if (result < 0) {
                currentLoss++;
                if (currentWin > 0) {
                    totalWinStreaks += currentWin;
                    winStreakCount++;
                    longestWin = Math.max(longestWin, currentWin);
                    currentWin = 0;
                }
            }
        });

        // Finalizar streaks pendentes
        if (currentWin > 0) {
            totalWinStreaks += currentWin;
            winStreakCount++;
            longestWin = Math.max(longestWin, currentWin);
        }
        if (currentLoss > 0) {
            totalLossStreaks += currentLoss;
            lossStreakCount++;
            longestLoss = Math.max(longestLoss, currentLoss);
        }

        return {
            longestWin,
            longestLoss,
            avgWin: winStreakCount > 0 ? totalWinStreaks / winStreakCount : 0,
            avgLoss: lossStreakCount > 0 ? totalLossStreaks / lossStreakCount : 0,
        };
    }

    _getStreakSuggestion(streak) {
        if (streak.type === 'win') {
            if (streak.count >= 5) {
                return 'Excelente sequência! Mantenha a disciplina e não se deixe levar pelo excesso de confiança.';
            } else if (streak.count >= 3) {
                return 'Boa sequência de vitórias. Continue com a estratégia atual.';
            }
        } else if (streak.type === 'loss') {
            if (streak.count >= 4) {
                return 'Sequência preocupante. Considere parar e revisar sua estratégia.';
            } else if (streak.count >= 2) {
                return 'Atenção às próximas operações. Considere reduzir o valor.';
            }
        }

        return 'Continue operando com disciplina.';
    }

    _generateTimeBasedSuggestion(bestHours, worstHours) {
        if (bestHours.length === 0) return 'Dados insuficientes para análise de horários.';

        const bestHour = bestHours[0];
        let suggestion = `Seu melhor horário é ${bestHour.hour}:00h com ${bestHour.winRate.toFixed(1)}% de assertividade.`;

        if (worstHours.length > 0) {
            const worstHour = worstHours[0];
            suggestion += ` Evite operar às ${worstHour.hour}:00h (${worstHour.winRate.toFixed(1)}% de assertividade).`;
        }

        return suggestion;
    }

    _getSessionStatus(session) {
        if (session.operations === 0) return 'Sessão não iniciada';
        if (session.currentProfit > 0) return 'Sessão lucrativa';
        if (session.currentProfit < 0) return 'Sessão com prejuízo';
        return 'Sessão equilibrada';
    }

    _getMainSuggestion(analysis) {
        if (analysis.suggestions.length === 0) return 'Continue operando com disciplina.';

        const highPriority = analysis.suggestions.find((s) => s.priority === 'high');
        return highPriority ? highPriority.action : analysis.suggestions[0].action;
    }

    _calculateRiskLevel(session) {
        if (session.streak.type === 'loss' && session.streak.count >= 3) return 'Alto';
        if (session.currentProfit < -300) return 'Alto';
        if (session.winRate < 40) return 'Médio';
        return 'Baixo';
    }

    _suggestNextAction(session) {
        if (session.streak.type === 'loss' && session.streak.count >= 3) {
            return 'Fazer uma pausa';
        }
        if (session.winRate > 70 && session.currentProfit > 0) {
            return 'Continuar com estratégia atual';
        }
        if (session.currentProfit < -200) {
            return 'Reduzir valor das operações';
        }
        return 'Operar normalmente';
    }

    _startPatternDetection() {
        // Monitoramento inteligente baseado em eventos, não em tempo
        console.log('🎯 TraderAssistant: Sistema de detecção de padrões ativo');

        // Conectar ao sessionStore se disponível
        if (window.sessionStore) {
            window.sessionStore.subscribe(
                (state) => state.historicoCombinado,
                (historico) => this._onOperationUpdate(historico)
            );
        } else {
            // Fallback: monitoramento por polling se sessionStore não disponível
            console.log(
                '🎯 TraderAssistant: Usando fallback polling (sessionStore não disponível)'
            );
            this._startPollingMonitoring();
        }
    }

    _startGoalMonitoring() {
        // Monitoramento inteligente de metas baseado em mudanças de estado
        console.log('🎯 TraderAssistant: Sistema de monitoramento de metas ativo');

        // Conectar ao sessionStore se disponível
        if (window.sessionStore) {
            window.sessionStore.subscribe(
                (state) => state.capitalAtual,
                (capitalAtual) => this._onCapitalChange(capitalAtual)
            );
        }
        // Nota: fallback já está no _startPatternDetection
    }

    /**
     * Fallback: monitoramento por polling quando sessionStore não está disponível
     */
    _startPollingMonitoring() {
        let lastCapital = null;
        let lastHistoryLength = 0;

        const checkChanges = () => {
            try {
                const sessionData = this._getSessionData();
                const currentCapital = sessionData.capitalAtual;
                const currentHistoryLength = sessionData.historicoCombinado?.length || 0;

                // Verificar mudança no capital (nova operação)
                if (lastCapital !== null && lastCapital !== currentCapital) {
                    this._onCapitalChange(currentCapital);
                }

                // Verificar nova operação no histórico
                if (lastHistoryLength !== currentHistoryLength) {
                    this._onOperationUpdate(sessionData.historicoCombinado);
                }

                lastCapital = currentCapital;
                lastHistoryLength = currentHistoryLength;
            } catch (error) {
                console.warn('TraderAssistant: Erro no monitoramento:', error);
            }
        };

        // Verificar a cada 5 segundos (bem menos frequente que antes)
        setInterval(checkChanges, 5000);

        // Verificação inicial
        setTimeout(checkChanges, 1000);
    }

    /**
     * Chamado quando há uma nova operação
     */
    _onOperationUpdate(historico) {
        if (!historico || historico.length === 0) return;

        // Verificar alertas de sequência apenas quando há nova operação
        const analysis = this.analyzeCurrentSession();
        analysis.alerts.forEach((alert) => {
            // Mapear níveis: success=verde, info=azul, warning=amarelo, danger=vermelho
            this.showTraderAlert(alert);
        });
    }

    /**
     * Chamado quando o capital muda (nova operação)
     */
    _onCapitalChange(capitalAtual) {
        // Verificar proximidade das metas apenas quando capital muda
        const goalAlerts = this.checkGoalProximity();
        goalAlerts.forEach((alert) => {
            this.showTraderAlert(alert);
        });
    }

    _ensureTraderAlertStyles() {
        if (document.getElementById('trader-alert-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'trader-alert-styles';
        styles.textContent = `
            #trader-alerts-root {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2147483647; /* sempre acima de qualquer overlay */
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: flex-end;
                pointer-events: none; /* não bloquear cliques do app */
            }
            .trader-alert {
                position: fixed;
                /* posição final controlada pelo root; manter fixed para segurança */
                max-width: 380px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 2147483647;
                animation: slideInRight 0.3s ease-out;
                margin-bottom: 10px;
                pointer-events: auto; /* permitir interação nos botões */
            }
            
            .trader-alert-success {
                border-color: #28a745;
                background: linear-gradient(135deg, #1a1a1a 0%, #1a2e1a 100%);
            }
            
            .trader-alert-warning {
                border-color: #ffc107;
                background: linear-gradient(135deg, #1a1a1a 0%, #2e2a1a 100%);
            }
            
            .trader-alert-info {
                border-color: #17a2b8;
                background: linear-gradient(135deg, #1a1a1a 0%, #1a252e 100%);
            }

            .trader-alert-danger {
                border-color: #dc3545;
                background: linear-gradient(135deg, #1a1a1a 0%, #2e1a1a 100%);
            }
            
            .trader-alert-content {
                color: #fff;
                margin-bottom: 12px;
            }
            
            .trader-alert-title {
                font-weight: 600;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .trader-alert-message {
                font-size: 13px;
                margin-bottom: 8px;
                opacity: 0.9;
            }
            
            .trader-alert-suggestion {
                font-size: 12px;
                opacity: 0.8;
                font-style: italic;
                padding-top: 8px;
                border-top: 1px solid #333;
                margin-bottom: 8px;
            }
            
            .trader-alert-progress {
                font-size: 12px;
                color: #17a2b8;
                font-weight: 500;
            }
            
            .trader-alert-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 12px;
                border-top: 1px solid #333;
            }
            
            .trader-alert-checkbox {
                display: flex;
                align-items: center;
                font-size: 11px;
                color: #ccc;
                cursor: pointer;
            }
            
            .trader-alert-checkbox input {
                margin-right: 6px;
            }
            
            .trader-alert-buttons {
                display: flex;
                gap: 8px;
            }
            
            .trader-alert-btn {
                background: #333;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .trader-alert-btn:hover {
                background: #555;
            }
            
            .trader-alert-config:hover {
                background: #17a2b8;
            }
            
            .trader-alert-close:hover {
                background: #dc3545;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Cria/retorna o contêiner raiz de alertas (garante z-index máximo)
     */
    _ensureAlertsRoot() {
        let root = document.getElementById('trader-alerts-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'trader-alerts-root';
            document.body.appendChild(root);
        }
        return root;
    }

    /**
     * Garante que os estilos do painel de configurações existam
     */
    _ensureSettingsStyles() {
        if (document.getElementById('trader-settings-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'trader-settings-styles';
        styles.textContent = `
            .trader-settings-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 15000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }
            
            .trader-settings-content {
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            }
            
            .trader-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #333;
            }
            
            .trader-settings-header h3 {
                color: #fff;
                margin: 0;
                font-size: 18px;
            }
            
            .trader-settings-close {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 24px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            .trader-settings-close:hover {
                background: #333;
                color: #fff;
            }
            
            .trader-settings-body {
                padding: 20px;
            }
            
            .trader-settings-section {
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #2a2a2a;
            }
            
            .trader-settings-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            
            .trader-settings-section h4 {
                color: #fff;
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .trader-settings-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                color: #ccc;
                font-size: 13px;
                cursor: pointer;
            }
            
            .trader-settings-item:last-child {
                margin-bottom: 0;
            }
            
            .trader-settings-item input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .trader-settings-item input[type="range"] {
                flex: 1;
                margin: 0 12px;
                accent-color: #17a2b8;
            }
            
            .trader-settings-item input[type="number"] {
                width: 60px;
                background: #333;
                border: 1px solid #555;
                border-radius: 4px;
                color: #fff;
                padding: 4px 8px;
                margin: 0 8px;
            }
            
            .trader-settings-footer {
                display: flex;
                justify-content: center;
                gap: 12px;
                padding: 20px;
                border-top: 1px solid #333;
            }
            
            .trader-settings-btn {
                background: #333;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 13px;
                padding: 10px 20px;
                border-radius: 6px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .trader-settings-save:hover {
                background: #28a745;
            }
            
            .trader-settings-reset:hover {
                background: #17a2b8;
            }
            
            .trader-settings-confirmation {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #28a745;
                color: #fff;
                padding: 12px 24px;
                border-radius: 6px;
                z-index: 20000;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Garante que os estilos do botão flutuante existam
     */
    _ensureFloatingButtonStyles() {
        if (document.getElementById('trader-floating-btn-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'trader-floating-btn-styles';
        styles.textContent = `
            .trader-settings-floating-btn {
                position: fixed;
                bottom: 200px;
                left: 20px;
                width: 50px;
                height: 50px;
                background: rgba(23, 162, 184, 0.9);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .trader-settings-floating-btn:hover {
                background: #138496;
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(23, 162, 184, 0.4);
            }
            
            .trader-settings-floating-btn:active {
                transform: scale(0.95);
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Emite um beep curto usando Web Audio API conforme o nível do alerta
     */
    _playAlertSound(level) {
        try {
            if (!this.traderSettings?.ui?.soundEnabled) return;

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            // Reusar contexto quando possível
            if (!this._audioCtx) {
                this._audioCtx = new AudioCtx();
            }
            const ctx = this._audioCtx;

            // Frequências por nível
            const freqMap = {
                success: 880, // A5 (mais suave)
                info: 988, // B5
                warning: 1319, // E6 (atenção)
                danger: 1760, // A6 (urgente)
            };
            const frequency = freqMap[level] || 988;

            const duration = level === 'danger' ? 0.25 : 0.15; // segundos
            const volume = level === 'danger' ? 0.08 : 0.05;

            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.value = volume;

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            oscillator.start(now);
            // Envelope curto para evitar clique
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            oscillator.stop(now + duration + 0.02);

            // Para danger, emitir pequeno duplo-beep
            if (level === 'danger') {
                setTimeout(() => {
                    try {
                        const osc2 = ctx.createOscillator();
                        const g2 = ctx.createGain();
                        osc2.type = 'sine';
                        osc2.frequency.value = frequency * 0.9;
                        g2.gain.value = volume;
                        osc2.connect(g2);
                        g2.connect(ctx.destination);
                        const t = ctx.currentTime;
                        osc2.start(t);
                        g2.gain.setValueAtTime(volume, t);
                        g2.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.9);
                        osc2.stop(t + duration + 0.02);
                    } catch { }
                }, 120);
            }
        } catch (e) {
            // Silencioso para não atrapalhar
        }
    }
}

// Instância global
const traderAssistant = new TraderAssistant();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.traderAssistant = traderAssistant;
}

export default traderAssistant;
