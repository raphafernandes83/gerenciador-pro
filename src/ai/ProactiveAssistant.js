/**
 * Assistente Proativo - Sistema que antecipa necessidades e sugere ações
 * Monitora padrões e sugere testes, melhorias e manutenções automaticamente
 */

import intelligentCoPilot from './IntelligentCoPilot.js';
import structuredLogger from '../monitoring/StructuredLogger.js';

class ProactiveAssistant {
    constructor() {
        this.role = 'PROACTIVE_ASSISTANT';
        this.isActive = false;

        this.patterns = {
            userBehavior: new Map(),
            systemUsage: new Map(),
            errorPatterns: new Map(),
            performancePatterns: new Map(),
        };

        this.suggestions = {
            pending: [],
            completed: [],
            dismissed: [],
        };

        this.config = {
            suggestionInterval: 60000, // 1 minuto
            patternAnalysisInterval: 300000, // 5 minutos
            proactiveLevel: 'HIGH', // LOW, MEDIUM, HIGH, MAXIMUM
            enableSmartNotifications: true,
            enableAutomaticTesting: true,
            enablePreventiveMaintenance: true,
            enablePerformanceOptimization: true,
        };

        this.smartRules = [
            {
                name: 'suggest_testing_after_changes',
                condition: () => this._detectCodeChanges(),
                action: () => this._suggestTesting(),
                priority: 'high',
                frequency: 'once_per_session',
            },
            {
                name: 'suggest_optimization_on_slow_performance',
                condition: () => this._detectSlowPerformance(),
                action: () => this._suggestOptimization(),
                priority: 'medium',
                frequency: 'daily',
            },
            {
                name: 'suggest_maintenance_on_errors',
                condition: () => this._detectErrorIncrease(),
                action: () => this._suggestMaintenance(),
                priority: 'high',
                frequency: 'immediate',
            },
            {
                name: 'suggest_backup_on_important_changes',
                condition: () => this._detectImportantChanges(),
                action: () => this._suggestBackup(),
                priority: 'medium',
                frequency: 'weekly',
            },
        ];

        this._initialize();
    }

    /**
     * Inicializa o assistente proativo
     */
    async _initialize() {
        if (this.isActive) return;

        console.log('🤖 Inicializando Assistente Proativo...');

        // Aguardar outros sistemas
        setTimeout(async () => {
            await this._startProactiveMonitoring();
            this.isActive = true;
            this._showActivationMessage();
        }, 5000); // 5 segundos após carregamento
    }

    /**
     * Inicia monitoramento proativo
     */
    async _startProactiveMonitoring() {
        // Análise de padrões
        setInterval(() => {
            this._analyzePatterns();
        }, this.config.patternAnalysisInterval);

        // Verificação de regras inteligentes
        setInterval(() => {
            this._checkSmartRules();
        }, this.config.suggestionInterval);

        // Monitoramento de eventos importantes
        this._setupEventMonitoring();

        console.log('✅ Monitoramento proativo ativo');
    }

    /**
     * Analisa padrões de uso e comportamento
     */
    _analyzePatterns() {
        console.log('🔍 Analisando padrões de uso...');

        // Analisar padrões de erro
        this._analyzeErrorPatterns();

        // Analisar padrões de performance
        this._analyzePerformancePatterns();

        // Analisar padrões de uso
        this._analyzeUsagePatterns();

        // Gerar insights baseados nos padrões
        this._generatePatternInsights();
    }

    /**
     * Verifica regras inteligentes e sugere ações
     */
    async _checkSmartRules() {
        for (const rule of this.smartRules) {
            try {
                if (await rule.condition()) {
                    if (this._shouldExecuteRule(rule)) {
                        await this._executeSmartRule(rule);
                    }
                }
            } catch (error) {
                console.error(`Erro ao verificar regra ${rule.name}:`, error);
            }
        }
    }

    /**
     * Executa uma regra inteligente
     */
    async _executeSmartRule(rule) {
        console.log(`🎯 Executando regra: ${rule.name}`);

        const suggestion = {
            id: this._generateSuggestionId(),
            timestamp: Date.now(),
            rule: rule.name,
            priority: rule.priority,
            title: this._getRuleTitle(rule.name),
            description: this._getRuleDescription(rule.name),
            actions: await rule.action(),
            status: 'pending',
        };

        this.suggestions.pending.push(suggestion);
        this._presentSuggestion(suggestion);

        // Marcar regra como executada
        this._markRuleExecuted(rule);
    }

    /**
     * Apresenta sugestão ao usuário
     */
    _presentSuggestion(suggestion) {
        const priorityIcon =
            {
                high: '🔴',
                medium: '🟡',
                low: '🟢',
            }[suggestion.priority] || '🔵';

        const message = `
${priorityIcon} SUGESTÃO DO SEU ASSISTENTE PROATIVO:

📋 ${suggestion.title}
📝 ${suggestion.description}

🎯 AÇÕES RECOMENDADAS:
${suggestion.actions.map((action, index) => `   ${index + 1}. ${action}`).join('\n')}

💡 Esta sugestão foi gerada automaticamente baseada na análise de padrões.
   Use copilot.suggestions() para ver todas as sugestões.
        `;

        console.log('%c' + message, 'color: #FF9800; font-weight: bold;');

        // Notificação se habilitada
        if (
            this.config.enableSmartNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
        ) {
            new Notification(`${priorityIcon} ${suggestion.title}`, {
                body: suggestion.description,
                icon: '/favicon.ico',
                tag: suggestion.id,
            });
        }
    }

    /**
     * Detecta mudanças no código que podem precisar de testes
     */
    _detectCodeChanges() {
        // Verificar se houve operações recentes que podem indicar mudanças
        if (window.usageAnalytics) {
            const recentFeatureUsage = window.usageAnalytics.getFeatureUsageStats({
                timeRange: 10 * 60 * 1000, // 10 minutos
            });

            // Se houve uso significativo de funcionalidades, pode ter havido mudanças
            return recentFeatureUsage.totalUsage > 5;
        }

        return false;
    }

    /**
     * Detecta performance lenta
     */
    _detectSlowPerformance() {
        if (window.realtimeMetrics) {
            const fps = window.realtimeMetrics.getCurrentValue('performance.fps');
            const memory = window.realtimeMetrics.getCurrentValue('system.memory.used');

            return fps < 45 || memory > 400; // FPS baixo ou memória alta
        }

        return false;
    }

    /**
     * Detecta aumento de erros
     */
    _detectErrorIncrease() {
        if (window.errorTracker) {
            const recentErrors = window.errorTracker.getErrorStats({
                since: Date.now() - 10 * 60 * 1000, // 10 minutos
            });

            return recentErrors.total > 3; // Mais de 3 erros em 10 minutos
        }

        return false;
    }

    /**
     * Detecta mudanças importantes que precisam de backup
     */
    _detectImportantChanges() {
        // Verificar se houve configurações importantes ou dados críticos alterados
        if (window.usageAnalytics) {
            const recentSessions = window.usageAnalytics._getSessionStats(60 * 60 * 1000); // 1 hora
            return recentSessions.total > 0; // Se houve sessões, pode ter dados importantes
        }

        return false;
    }

    /**
     * Sugere testes baseados no contexto
     */
    async _suggestTesting() {
        const testSuggestions = [];

        // Verificar se há funcionalidades que precisam de teste
        if (window.errorTracker) {
            const errors = window.errorTracker.getErrorStats();
            if (errors.total > 0) {
                testSuggestions.push(
                    'Executar testes de regressão para verificar correções de erros'
                );
            }
        }

        // Verificar performance
        if (this._detectSlowPerformance()) {
            testSuggestions.push('Executar testes de performance para identificar gargalos');
        }

        // Testes gerais
        testSuggestions.push('Executar suite completa de testes E2E');
        testSuggestions.push('Validar funcionalidades críticas do sistema');

        // Executar testes automaticamente se configurado
        if (this.config.enableAutomaticTesting) {
            testSuggestions.push('🤖 Executando testes automaticamente...');
            this._executeAutomaticTests();
        }

        return testSuggestions;
    }

    /**
     * Sugere otimizações
     */
    async _suggestOptimization() {
        const optimizations = [];

        if (window.realtimeMetrics) {
            const memory = window.realtimeMetrics.getCurrentValue('system.memory.used');
            const fps = window.realtimeMetrics.getCurrentValue('performance.fps');

            if (memory > 400) {
                optimizations.push('Otimizar uso de memória - limpeza de cache');
            }

            if (fps < 45) {
                optimizations.push('Otimizar renderização - melhorar FPS');
            }
        }

        optimizations.push('Executar limpeza automática de dados temporários');
        optimizations.push('Otimizar configurações de performance');

        // Executar otimizações automaticamente
        if (this.config.enablePerformanceOptimization) {
            optimizations.push('🤖 Executando otimizações automaticamente...');
            this._executeAutomaticOptimizations();
        }

        return optimizations;
    }

    /**
     * Sugere manutenção
     */
    async _suggestMaintenance() {
        const maintenance = [];

        maintenance.push('Executar diagnóstico completo do sistema');
        maintenance.push('Limpar logs antigos e dados temporários');
        maintenance.push('Verificar integridade dos dados');
        maintenance.push('Atualizar configurações de segurança');

        // Executar manutenção automaticamente
        if (this.config.enablePreventiveMaintenance) {
            maintenance.push('🤖 Executando manutenção preventiva automaticamente...');
            this._executeAutomaticMaintenance();
        }

        return maintenance;
    }

    /**
     * Sugere backup
     */
    async _suggestBackup() {
        return [
            'Fazer backup dos dados de configuração',
            'Exportar métricas e logs importantes',
            'Salvar estado atual do sistema',
            'Criar ponto de restauração',
        ];
    }

    /**
     * Executa testes automaticamente
     */
    async _executeAutomaticTests() {
        console.log('🧪 Executando testes automáticos...');

        try {
            // Executar testes do sistema de monitoramento
            if (window.monitoring && window.monitoring.test) {
                const testResults = window.monitoring.test();
                console.log('✅ Testes de monitoramento:', testResults);
            }

            // Executar health check
            if (window.monitoringSystem) {
                const health = await window.monitoringSystem.runHealthCheck();
                console.log('✅ Health check:', health);
            }

            console.log('✅ Testes automáticos concluídos');
        } catch (error) {
            console.error('❌ Erro nos testes automáticos:', error);
        }
    }

    /**
     * Executa otimizações automaticamente
     */
    async _executeAutomaticOptimizations() {
        console.log('⚡ Executando otimizações automáticas...');

        try {
            // Otimizar através do co-piloto
            if (window.intelligentCoPilot) {
                await window.intelligentCoPilot._optimizePerformance();
            }

            console.log('✅ Otimizações automáticas concluídas');
        } catch (error) {
            console.error('❌ Erro nas otimizações automáticas:', error);
        }
    }

    /**
     * Executa manutenção automaticamente
     */
    async _executeAutomaticMaintenance() {
        console.log('🔧 Executando manutenção automática...');

        try {
            // Manutenção através do co-piloto
            if (window.intelligentCoPilot) {
                await window.intelligentCoPilot.performAutomaticMaintenance();
            }

            console.log('✅ Manutenção automática concluída');
        } catch (error) {
            console.error('❌ Erro na manutenção automática:', error);
        }
    }

    /**
     * Configura monitoramento de eventos importantes
     */
    _setupEventMonitoring() {
        // Monitorar erros críticos
        window.addEventListener('criticalAlert', (event) => {
            this._handleCriticalEvent('critical_alert', event.detail);
        });

        // Monitorar mudanças de performance
        if (window.realtimeMetrics) {
            window.realtimeMetrics.subscribe(['system.memory.used', 'performance.fps'], (data) => {
                this._handlePerformanceChange(data);
            });
        }

        // Monitorar padrões de uso
        window.addEventListener('monitoringReady', () => {
            this._handleSystemReady();
        });
    }

    /**
     * Manipula eventos críticos
     */
    _handleCriticalEvent(type, data) {
        console.log(`🚨 Evento crítico detectado: ${type}`);

        // Sugerir ação imediata
        const suggestion = {
            id: this._generateSuggestionId(),
            timestamp: Date.now(),
            type: 'critical_response',
            priority: 'high',
            title: 'Ação Imediata Necessária',
            description: `Evento crítico detectado: ${type}`,
            actions: [
                'Investigar causa raiz do problema',
                'Executar diagnóstico completo',
                'Aplicar correções necessárias',
            ],
            status: 'urgent',
        };

        this._presentSuggestion(suggestion);
    }

    /**
     * Obtém sugestões pendentes
     */
    getPendingSuggestions() {
        return this.suggestions.pending;
    }

    /**
     * Obtém todas as sugestões
     */
    getAllSuggestions() {
        return {
            pending: this.suggestions.pending,
            completed: this.suggestions.completed,
            dismissed: this.suggestions.dismissed,
            total:
                this.suggestions.pending.length +
                this.suggestions.completed.length +
                this.suggestions.dismissed.length,
        };
    }

    // Métodos utilitários
    _generateSuggestionId() {
        return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getRuleTitle(ruleName) {
        const titles = {
            suggest_testing_after_changes: 'Executar Testes de Validação',
            suggest_optimization_on_slow_performance: 'Otimizar Performance do Sistema',
            suggest_maintenance_on_errors: 'Executar Manutenção Preventiva',
            suggest_backup_on_important_changes: 'Criar Backup de Segurança',
        };

        return titles[ruleName] || 'Ação Recomendada';
    }

    _getRuleDescription(ruleName) {
        const descriptions = {
            suggest_testing_after_changes:
                'Detectei atividade recente que pode indicar mudanças no sistema. Recomendo executar testes para garantir que tudo funciona corretamente.',
            suggest_optimization_on_slow_performance:
                'Performance do sistema está abaixo do ideal. Recomendo executar otimizações para melhorar a experiência.',
            suggest_maintenance_on_errors:
                'Detectei aumento na taxa de erros. Recomendo executar manutenção preventiva para resolver problemas.',
            suggest_backup_on_important_changes:
                'Detectei mudanças importantes no sistema. Recomendo criar um backup para preservar os dados.',
        };

        return descriptions[ruleName] || 'Ação recomendada baseada na análise do sistema.';
    }

    _shouldExecuteRule(rule) {
        // Verificar frequência da regra
        const lastExecution = this._getLastRuleExecution(rule.name);
        const now = Date.now();

        switch (rule.frequency) {
            case 'immediate':
                return true;
            case 'once_per_session':
                return !this._wasRuleExecutedThisSession(rule.name);
            case 'daily':
                return !lastExecution || now - lastExecution > 24 * 60 * 60 * 1000;
            case 'weekly':
                return !lastExecution || now - lastExecution > 7 * 24 * 60 * 60 * 1000;
            default:
                return true;
        }
    }

    _markRuleExecuted(rule) {
        const execution = {
            rule: rule.name,
            timestamp: Date.now(),
            session: this._getCurrentSessionId(),
        };

        // Salvar no localStorage
        try {
            const executions = JSON.parse(
                localStorage.getItem('proactive_rule_executions') || '[]'
            );
            executions.push(execution);
            localStorage.setItem(
                'proactive_rule_executions',
                JSON.stringify(executions.slice(-100))
            ); // Manter últimas 100
        } catch (error) {
            console.warn('Erro ao salvar execução de regra:', error);
        }
    }

    _getLastRuleExecution(ruleName) {
        try {
            const executions = JSON.parse(
                localStorage.getItem('proactive_rule_executions') || '[]'
            );
            const ruleExecutions = executions.filter((e) => e.rule === ruleName);
            return ruleExecutions.length > 0
                ? ruleExecutions[ruleExecutions.length - 1].timestamp
                : null;
        } catch (error) {
            return null;
        }
    }

    _wasRuleExecutedThisSession(ruleName) {
        const sessionId = this._getCurrentSessionId();
        try {
            const executions = JSON.parse(
                localStorage.getItem('proactive_rule_executions') || '[]'
            );
            return executions.some((e) => e.rule === ruleName && e.session === sessionId);
        } catch (error) {
            return false;
        }
    }

    _getCurrentSessionId() {
        return window.structuredLogger?.sessionId || 'unknown_session';
    }

    _showActivationMessage() {
        const message = `
🤖 ASSISTENTE PROATIVO ATIVADO!

🎯 Missão: Antecipar suas necessidades e sugerir ações

🧠 O QUE ESTOU FAZENDO:
   ✅ Analisando padrões de uso
   ✅ Detectando quando você precisa de testes
   ✅ Sugerindo otimizações proativamente
   ✅ Alertando sobre necessidade de manutenção
   ✅ Executando ações automaticamente quando seguro

💡 REGRAS INTELIGENTES ATIVAS:
   🧪 Sugerir testes após mudanças
   ⚡ Otimizar quando performance baixa
   🔧 Manutenção quando erros aumentam
   💾 Backup em mudanças importantes

📞 COMANDOS:
   copilot.suggestions() - Ver sugestões pendentes
   copilot.patterns()    - Ver padrões detectados

🎉 RELAXE! SEU ASSISTENTE ESTÁ CUIDANDO DE TUDO!
        `;

        console.log('%c' + message, 'color: #2196F3; font-weight: bold;');
    }

    // Métodos de análise de padrões (implementação simplificada)
    _analyzeErrorPatterns() {
        if (window.errorTracker) {
            const errors = window.errorTracker.getErrorStats();
            this.patterns.errorPatterns.set('recent_errors', errors);
        }
    }

    _analyzePerformancePatterns() {
        if (window.realtimeMetrics) {
            const metrics = {
                memory: window.realtimeMetrics.getCurrentValue('system.memory.used'),
                fps: window.realtimeMetrics.getCurrentValue('performance.fps'),
                cpu: window.realtimeMetrics.getCurrentValue('system.cpu.usage'),
            };
            this.patterns.performancePatterns.set('current_metrics', metrics);
        }
    }

    _analyzeUsagePatterns() {
        if (window.usageAnalytics) {
            const usage = window.usageAnalytics.getFeatureUsageStats();
            this.patterns.userBehavior.set('feature_usage', usage);
        }
    }

    _generatePatternInsights() {
        // Implementação simplificada - em produção seria mais sofisticada
        console.log('🔍 Padrões analisados e insights gerados');
    }

    _handlePerformanceChange(data) {
        // Implementação simplificada
        if (data['system.memory.used'] > 500) {
            console.log('⚠️ Uso de memória alto detectado');
        }
    }

    _handleSystemReady() {
        console.log('✅ Sistema pronto - iniciando análise de padrões');
        this._analyzePatterns();
    }
}

// Instância global
const proactiveAssistant = new ProactiveAssistant();

// Comandos globais
if (typeof window !== 'undefined') {
    window.proactiveAssistant = proactiveAssistant;

    // Adicionar comandos ao copilot
    if (window.copilot) {
        window.copilot.suggestions = () => proactiveAssistant.getAllSuggestions();
        window.copilot.patterns = () => ({
            errors: Array.from(proactiveAssistant.patterns.errorPatterns.entries()),
            performance: Array.from(proactiveAssistant.patterns.performancePatterns.entries()),
            usage: Array.from(proactiveAssistant.patterns.userBehavior.entries()),
        });
    }
}

export default proactiveAssistant;
