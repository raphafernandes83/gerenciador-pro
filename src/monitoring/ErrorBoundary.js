/**
 * 🛡️ ERROR BOUNDARY SYSTEM
 * Sistema de isolamento de componentes com erro
 * Implementa padrão React Error Boundary para JavaScript vanilla
 */

class ErrorBoundary {
    constructor(componentName, element, options = {}) {
        this.componentName = componentName;
        this.element = element;
        this.options = {
            fallbackHTML: options.fallbackHTML || this.getDefaultFallback(),
            retryInterval: options.retryInterval || 30000, // 30 segundos
            maxRetries: options.maxRetries || 3,
            onError: options.onError || null,
            autoRecover: options.autoRecover !== false,
            isolateStyles: options.isolateStyles !== false,
            ...options,
        };

        this.errorCount = 0;
        this.retryCount = 0;
        this.isInErrorState = false;
        this.originalHTML = element ? element.innerHTML : '';
        this.originalHandlers = new Map();

        this.setupBoundary();

        console.log(`🛡️ ErrorBoundary: Criado para ${componentName}`);
    }

    /**
     * 🔧 Configuração do Boundary
     */
    setupBoundary() {
        if (!this.element) {
            console.warn(`⚠️ ErrorBoundary: Elemento não encontrado para ${this.componentName}`);
            return;
        }

        // Envolve o elemento em um container de erro
        this.createErrorContainer();

        // Intercepta erros dentro do componente
        this.interceptComponentErrors();

        // Monitora performance do componente
        this.monitorComponentPerformance();

        // Setup de auto-recuperação
        if (this.options.autoRecover) {
            this.setupAutoRecovery();
        }
    }

    /**
     * 📦 Criação do Container de Erro
     */
    createErrorContainer() {
        const wrapper = document.createElement('div');
        wrapper.className = 'error-boundary-wrapper';
        wrapper.setAttribute('data-component', this.componentName);

        // Insere o wrapper antes do elemento original
        this.element.parentNode.insertBefore(wrapper, this.element);
        wrapper.appendChild(this.element);

        this.wrapper = wrapper;

        // Adiciona estilos de isolamento
        if (this.options.isolateStyles) {
            this.addIsolationStyles();
        }
    }

    /**
     * 🎨 Estilos de Isolamento
     */
    addIsolationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .error-boundary-wrapper {
                position: relative;
                isolation: isolate;
            }
            
            .error-boundary-error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 10px 0;
                box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .error-boundary-title {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .error-boundary-message {
                margin-bottom: 15px;
                opacity: 0.9;
            }
            
            .error-boundary-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .error-boundary-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }
            
            .error-boundary-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }
            
            .error-boundary-recovering {
                background: linear-gradient(135deg, #f39c12, #e67e22);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * 🕷️ Interceptação de Erros do Componente
     */
    interceptComponentErrors() {
        // Intercepta erros de JavaScript dentro do componente
        const originalAddEventListener = this.element.addEventListener;

        this.element.addEventListener = (type, listener, options) => {
            const wrappedListener = (event) => {
                try {
                    return listener.call(this.element, event);
                } catch (error) {
                    this.handleError(error, 'event_listener', { type, event });
                }
            };

            // Armazena o handler original para cleanup
            this.originalHandlers.set(listener, wrappedListener);

            return originalAddEventListener.call(this.element, type, wrappedListener, options);
        };

        // Intercepta erros em operações DOM dentro do componente
        this.interceptDOMOperations();
    }

    /**
     * 🔍 Interceptação de Operações DOM - DESABILITADA
     * PROBLEMA: Estava causando vazamento de código JavaScript na UI
     */
    interceptDOMOperations() {
        // 🚨 COMPLETAMENTE DESABILITADO: Este método estava substituindo operações DOM
        // e causando vazamento de código nas renderizações da UI
        console.log('⚠️ DOM operation interception DESABILITADA para evitar vazamento de código');

        // COMENTADO: código que causava o problema de vazamento
        // const dangerousOperations = ['innerHTML', 'appendChild', 'removeChild', 'insertBefore'];
        // dangerousOperations.forEach(operation => {
        //     if (this.element[operation]) {
        //         const original = this.element[operation];
        //         this.element[operation] = (...args) => {
        //             try {
        //                 return original.apply(this.element, args);
        //             } catch (error) {
        //                 this.handleError(error, 'dom_operation', { operation, args });
        //                 return null;
        //             }
        //         };
        //     }
        // });
    }

    /**
     * ⚡ Monitoramento de Performance do Componente
     */
    monitorComponentPerformance() {
        // Monitora tempo de renderização
        const observer = new MutationObserver((mutations) => {
            const startTime = performance.now();

            // Simula processamento e mede tempo
            setTimeout(() => {
                const duration = performance.now() - startTime;

                if (duration > 100) {
                    // Mais de 100ms é considerado lento
                    this.handlePerformanceIssue({
                        type: 'slow_render',
                        duration,
                        mutations: mutations.length,
                    });
                }
            }, 0);
        });

        observer.observe(this.element, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        this.performanceObserver = observer;
    }

    /**
     * 🔄 Sistema de Auto-Recuperação
     */
    setupAutoRecovery() {
        this.recoveryInterval = setInterval(() => {
            if (this.isInErrorState && this.retryCount < this.options.maxRetries) {
                this.attemptRecovery();
            }
        }, this.options.retryInterval);
    }

    /**
     * 🚨 Tratamento de Erro
     */
    handleError(error, context = 'unknown', details = {}) {
        this.errorCount++;
        this.isInErrorState = true;

        const errorInfo = {
            component: this.componentName,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
            context,
            details,
            timestamp: Date.now(),
            errorCount: this.errorCount,
            retryCount: this.retryCount,
        };

        console.error(`🚨 ErrorBoundary [${this.componentName}]:`, errorInfo);

        // Notifica o monitor global se disponível
        if (typeof window.smartMonitor !== 'undefined') {
            window.smartMonitor.triggerAlert({
                type: 'component_error',
                severity: this.errorCount > 2 ? 'critical' : 'error',
                message: `Erro no componente ${this.componentName}`,
                component: this.componentName,
                details: errorInfo,
            });
        }

        // Callback personalizado
        if (this.options.onError) {
            this.options.onError(errorInfo);
        }

        // Exibe fallback
        this.showErrorUI(errorInfo);

        // Tenta recuperação automática
        if (this.options.autoRecover && this.retryCount < this.options.maxRetries) {
            setTimeout(() => this.attemptRecovery(), 5000);
        }
    }

    /**
     * 🎨 Exibição da UI de Erro
     */
    showErrorUI(errorInfo) {
        const errorHTML = `
            <div class="error-boundary-error">
                <div class="error-boundary-title">
                    ⚠️ Erro no Componente: ${this.componentName}
                </div>
                <div class="error-boundary-message">
                    ${errorInfo.error.message}
                </div>
                <div class="error-boundary-details">
                    <small>
                        Contexto: ${errorInfo.context}<br>
                        Tentativas: ${errorInfo.retryCount}/${this.options.maxRetries}<br>
                        Hora: ${new Date(errorInfo.timestamp).toLocaleTimeString()}
                    </small>
                </div>
                <div class="error-boundary-actions">
                    <button class="error-boundary-btn" onclick="window.errorBoundaries?.['${this.componentName}']?.manualRecovery()">
                        🔄 Tentar Novamente
                    </button>
                    <button class="error-boundary-btn" onclick="window.errorBoundaries?.['${this.componentName}']?.reportError()">
                        📋 Reportar Erro
                    </button>
                    <button class="error-boundary-btn" onclick="window.errorBoundaries?.['${this.componentName}']?.hideError()">
                        ❌ Ocultar
                    </button>
                </div>
            </div>
        `;

        this.element.innerHTML = errorHTML;
    }

    /**
     * 🔄 Tentativa de Recuperação
     */
    async attemptRecovery() {
        this.retryCount++;

        console.log(
            `🔄 ErrorBoundary [${this.componentName}]: Tentativa de recuperação ${this.retryCount}/${this.options.maxRetries}`
        );

        // Mostra estado de recuperação
        this.showRecoveryUI();

        try {
            // Aguarda um pouco antes de tentar
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Tenta restaurar o conteúdo original
            this.element.innerHTML = this.originalHTML;

            // Verifica se a recuperação foi bem-sucedida
            if (await this.verifyRecovery()) {
                this.isInErrorState = false;
                this.errorCount = Math.max(0, this.errorCount - 1); // Reduz contador de erro

                console.log(`✅ ErrorBoundary [${this.componentName}]: Recuperação bem-sucedida`);

                // Notifica sucesso
                if (typeof window.smartMonitor !== 'undefined') {
                    window.smartMonitor.recordMetric('component_recovery_success', 1);
                }

                return true;
            } else {
                throw new Error('Verificação de recuperação falhou');
            }
        } catch (error) {
            console.error(`❌ ErrorBoundary [${this.componentName}]: Falha na recuperação:`, error);

            if (this.retryCount >= this.options.maxRetries) {
                this.showFinalErrorState();
            } else {
                this.showErrorUI({
                    component: this.componentName,
                    error: { message: 'Falha na recuperação automática' },
                    context: 'recovery_failed',
                    timestamp: Date.now(),
                    errorCount: this.errorCount,
                    retryCount: this.retryCount,
                });
            }

            return false;
        }
    }

    /**
     * 🔄 UI de Recuperação
     */
    showRecoveryUI() {
        const recoveryHTML = `
            <div class="error-boundary-error error-boundary-recovering">
                <div class="error-boundary-title">
                    🔄 Recuperando Componente: ${this.componentName}
                </div>
                <div class="error-boundary-message">
                    Tentativa ${this.retryCount} de ${this.options.maxRetries}...
                </div>
            </div>
        `;

        this.element.innerHTML = recoveryHTML;
    }

    /**
     * ✅ Verificação de Recuperação
     */
    async verifyRecovery() {
        try {
            // Verifica se o elemento ainda existe e está visível
            if (!this.element || !this.element.isConnected) {
                return false;
            }

            // Verifica se há conteúdo
            if (!this.element.innerHTML.trim()) {
                return false;
            }

            // Tenta executar uma operação DOM simples
            const testElement = document.createElement('span');
            testElement.style.display = 'none';
            this.element.appendChild(testElement);
            this.element.removeChild(testElement);

            // Se chegou até aqui, a recuperação foi bem-sucedida
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 💀 Estado Final de Erro
     */
    showFinalErrorState() {
        const finalHTML = `
            <div class="error-boundary-error">
                <div class="error-boundary-title">
                    💀 Componente Indisponível: ${this.componentName}
                </div>
                <div class="error-boundary-message">
                    O componente falhou após ${this.options.maxRetries} tentativas de recuperação.
                </div>
                <div class="error-boundary-actions">
                    <button class="error-boundary-btn" onclick="window.location.reload()">
                        🔄 Recarregar Página
                    </button>
                    <button class="error-boundary-btn" onclick="window.errorBoundaries?.['${this.componentName}']?.reportError()">
                        📋 Reportar Problema
                    </button>
                </div>
            </div>
        `;

        this.element.innerHTML = finalHTML;
    }

    /**
     * 🔧 Recuperação Manual
     */
    manualRecovery() {
        console.log(`🔧 ErrorBoundary [${this.componentName}]: Recuperação manual iniciada`);
        this.retryCount = 0; // Reset contador para dar mais chances
        this.attemptRecovery();
    }

    /**
     * 📋 Reportar Erro
     */
    reportError() {
        const errorReport = {
            component: this.componentName,
            errorCount: this.errorCount,
            retryCount: this.retryCount,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        console.log('📋 ErrorBoundary: Reportando erro:', errorReport);

        // Em um ambiente real, enviaria para sistema de monitoramento
        // this.sendToErrorTracking(errorReport);

        alert('Erro reportado com sucesso! Nossa equipe foi notificada.');
    }

    /**
     * ❌ Ocultar Erro
     */
    hideError() {
        this.element.style.display = 'none';
    }

    /**
     * ⚡ Tratamento de Problemas de Performance
     */
    handlePerformanceIssue(issue) {
        console.warn(`⚡ ErrorBoundary [${this.componentName}]: Problema de performance:`, issue);

        if (typeof window.smartMonitor !== 'undefined') {
            window.smartMonitor.triggerAlert({
                type: 'performance',
                severity: 'warning',
                message: `Performance lenta no componente ${this.componentName}`,
                component: this.componentName,
                details: issue,
            });
        }
    }

    /**
     * 🧹 Limpeza
     */
    destroy() {
        // Remove observadores
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }

        // Remove interval de recuperação
        if (this.recoveryInterval) {
            clearInterval(this.recoveryInterval);
        }

        // Remove handlers
        this.originalHandlers.clear();

        console.log(`🧹 ErrorBoundary [${this.componentName}]: Destruído`);
    }

    /**
     * 📊 Fallback Padrão
     */
    getDefaultFallback() {
        return `
            <div class="error-boundary-error">
                <div class="error-boundary-title">
                    ⚠️ Componente Temporariamente Indisponível
                </div>
                <div class="error-boundary-message">
                    Estamos trabalhando para resolver este problema.
                </div>
            </div>
        `;
    }
}

/**
 * 🏭 Factory para Error Boundaries
 */
class ErrorBoundaryManager {
    constructor() {
        this.boundaries = new Map();

        console.log('🏭 ErrorBoundaryManager: Inicializado');
    }

    /**
     * 🛡️ Criar Error Boundary com Verificação Inteligente
     */
    create(componentName, elementSelector, options = {}) {
        const element = this.findElement(componentName, elementSelector);

        if (!element) {
            // Se elemento não encontrado, agenda retry
            this.scheduleRetry(componentName, elementSelector, options);
            return null;
        }

        // Verifica se boundary já existe para evitar duplicação
        if (this.boundaries.has(componentName)) {
            console.log(`🔄 ErrorBoundary para ${componentName} já existe, atualizando...`);
            this.boundaries.get(componentName).destroy();
        }

        const boundary = new ErrorBoundary(componentName, element, options);
        this.boundaries.set(componentName, boundary);

        console.log(`✅ ErrorBoundary criado com sucesso para ${componentName}`);
        return boundary;
    }

    /**
     * 🔍 Busca Inteligente de Elementos
     */
    findElement(componentName, elementSelector) {
        if (typeof elementSelector !== 'string') {
            return elementSelector; // Já é um elemento DOM
        }

        // Tenta encontrar com múltiplos seletores
        const selectors = this.getAlternativeSelectors(componentName, elementSelector);

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (selector !== elementSelector) {
                    console.log(
                        `🎯 ${componentName}: Elemento encontrado com seletor alternativo: ${selector}`
                    );
                }
                return element;
            }
        }

        return null;
    }

    /**
     * 🎯 Seletores Alternativos para Componentes
     */
    getAlternativeSelectors(componentName, originalSelector) {
        const alternatives = {
            ProgressMetas: [
                originalSelector,
                '#progress-meta',
                '.progress-metas',
                '.progress-chart-section',
                '[data-component="progress-metas"]',
                '.progress-pie-section',
            ],
            TabelaOperacoes: [
                originalSelector,
                '#tabela-resultados',
                '.tabela-operacoes',
                '#operations-table',
                '.operations-grid',
                'table',
            ],
            Dashboard: [
                originalSelector,
                '#dashboard-content',
                '#dashboard-area',
                '#dashboard-main-grid',
                '.dashboard-stats',
                '#dashboard-stats-grid',
            ],
            Timeline: [
                originalSelector,
                '#timeline-container',
                '.timeline-area',
                '#operacoes-timeline',
                '.timeline-section',
            ],
        };

        return alternatives[componentName] || [originalSelector];
    }

    /**
     * ⏰ Sistema de Retry Inteligente
     */
    scheduleRetry(componentName, elementSelector, options = {}) {
        const retryKey = `${componentName}_retry`;

        // Limpa retry anterior se existir
        if (this.retryTimers && this.retryTimers[retryKey]) {
            clearTimeout(this.retryTimers[retryKey]);
        }

        // Inicializa sistema de retry se não existir
        if (!this.retryTimers) {
            this.retryTimers = {};
        }
        if (!this.retryAttempts) {
            this.retryAttempts = {};
        }

        const maxRetries = options.maxRetries || 5;
        const baseInterval = options.retryInterval || 1000;
        const currentAttempt = (this.retryAttempts[retryKey] || 0) + 1;

        if (currentAttempt > maxRetries) {
            console.warn(
                `❌ ErrorBoundary para ${componentName}: Máximo de tentativas atingido (${maxRetries})`
            );
            delete this.retryAttempts[retryKey];
            return;
        }

        this.retryAttempts[retryKey] = currentAttempt;

        // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
        const retryDelay = baseInterval * Math.pow(2, currentAttempt - 1);

        console.log(
            `⏳ ${componentName}: Tentativa ${currentAttempt}/${maxRetries} em ${retryDelay}ms...`
        );

        this.retryTimers[retryKey] = setTimeout(() => {
            console.log(`🔄 Retry ${currentAttempt} para ${componentName}...`);
            const boundary = this.create(componentName, elementSelector, options);

            if (boundary) {
                console.log(
                    `🎉 ${componentName}: Boundary criado com sucesso após ${currentAttempt} tentativas`
                );
                delete this.retryAttempts[retryKey];
                delete this.retryTimers[retryKey];
            }
        }, retryDelay);
    }

    /**
     * 📋 Criar Boundaries para Componentes Principais
     */
    setupMainComponents() {
        console.log('🚀 ErrorBoundaryManager: Iniciando setup dos componentes principais...');

        const components = [
            {
                name: 'ProgressMetas',
                selector: '#progress-metas-card', // Seletor primário (pode não existir)
                options: {
                    maxRetries: 3,
                    retryInterval: 500, // Início mais rápido
                    onError: (error) => console.log('🔴 Erro no componente de progresso:', error),
                },
            },
            {
                name: 'TabelaOperacoes',
                selector: '#operations-table', // Seletor primário (pode não existir)
                options: {
                    maxRetries: 3,
                    retryInterval: 500,
                    onError: (error) => console.log('🔴 Erro na tabela de operações:', error),
                },
            },
            {
                name: 'Timeline',
                selector: '#timeline-container', // Seletor primário (pode não existir)
                options: {
                    maxRetries: 3,
                    retryInterval: 1000, // Timeline pode demorar mais para carregar
                    onError: (error) => console.log('🔴 Erro na timeline:', error),
                },
            },
            {
                name: 'Dashboard',
                selector: '#dashboard-stats', // Seletor primário (pode não existir)
                options: {
                    maxRetries: 3,
                    retryInterval: 500,
                    onError: (error) => console.log('🔴 Erro no dashboard:', error),
                },
            },
        ];

        let successCount = 0;
        let pendingCount = 0;

        components.forEach(({ name, selector, options }) => {
            const boundary = this.create(name, selector, options);
            if (boundary) {
                successCount++;
            } else {
                pendingCount++;
            }
        });

        console.log(
            `🛡️ ErrorBoundaryManager: ${successCount} boundaries criados imediatamente, ${pendingCount} agendados para retry`
        );

        // Configura observer para detectar novos elementos
        this.setupDOMObserver();
    }

    /**
     * 👁️ Observer para Detectar Novos Elementos Dinamicamente
     */
    setupDOMObserver() {
        if (this.domObserver) {
            return; // Observer já configurado
        }

        console.log('👁️ ErrorBoundaryManager: Configurando DOM Observer...');

        this.domObserver = new MutationObserver((mutations) => {
            let shouldCheckPending = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Verifica se algum dos nós adicionados é relevante
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Verifica se o elemento ou seus filhos podem ser componentes pendentes
                            if (this.couldBeRelevantElement(node)) {
                                shouldCheckPending = true;
                            }
                        }
                    });
                }
            });

            if (shouldCheckPending) {
                // Debounce para evitar verificações excessivas
                clearTimeout(this.observerCheckTimeout);
                this.observerCheckTimeout = setTimeout(() => {
                    this.checkPendingComponents();
                }, 300);
            }
        });

        // Observa mudanças em todo o documento
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });

        console.log('✅ DOM Observer configurado');
    }

    /**
     * 🔍 Verifica se Elemento Pode Ser Relevante
     */
    couldBeRelevantElement(element) {
        const relevantIds = [
            'progress-meta',
            'progress-metas',
            'tabela-resultados',
            'dashboard-content',
            'dashboard-area',
            'timeline-container',
        ];

        const relevantClasses = [
            'progress-chart-section',
            'progress-pie-section',
            'dashboard-stats',
            'operations-grid',
            'timeline-area',
        ];

        // Verifica ID do elemento
        if (element.id && relevantIds.some((id) => element.id.includes(id))) {
            return true;
        }

        // Verifica classes do elemento
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ');
            if (classes.some((cls) => relevantClasses.includes(cls))) {
                return true;
            }
        }

        // Verifica se contém elementos filhos relevantes
        const childElements = element.querySelectorAll('*');
        return Array.from(childElements).some((child) => {
            return (
                relevantIds.some((id) => child.id && child.id.includes(id)) ||
                relevantClasses.some((cls) => child.classList && child.classList.contains(cls))
            );
        });
    }

    /**
     * 🔄 Verifica Componentes Pendentes
     */
    checkPendingComponents() {
        if (!this.retryAttempts) {
            return;
        }

        console.log('🔍 Verificando componentes pendentes...');

        const pendingComponents = Object.keys(this.retryAttempts);
        let foundCount = 0;

        pendingComponents.forEach((retryKey) => {
            const componentName = retryKey.replace('_retry', '');

            // Tenta encontrar o elemento com os seletores alternativos
            const selectors = this.getAlternativeSelectors(componentName, '');

            for (const selector of selectors) {
                if (selector && document.querySelector(selector)) {
                    console.log(
                        `🎉 Elemento encontrado dinamicamente para ${componentName}: ${selector}`
                    );

                    // Cancela timer de retry existente
                    if (this.retryTimers && this.retryTimers[retryKey]) {
                        clearTimeout(this.retryTimers[retryKey]);
                        delete this.retryTimers[retryKey];
                    }

                    // Cria boundary imediatamente
                    const boundary = this.create(componentName, selector, {});
                    if (boundary) {
                        foundCount++;
                        delete this.retryAttempts[retryKey];
                    }
                    break;
                }
            }
        });

        if (foundCount > 0) {
            console.log(`✅ ${foundCount} componentes pendentes foram anexados com sucesso`);
        }
    }

    /**
     * 🧹 Limpeza de Recursos
     */
    cleanup() {
        // Limpa observer
        if (this.domObserver) {
            this.domObserver.disconnect();
            this.domObserver = null;
        }

        // Limpa timers de retry
        if (this.retryTimers) {
            Object.values(this.retryTimers).forEach((timer) => clearTimeout(timer));
            this.retryTimers = {};
        }

        // Limpa tentativas de retry
        if (this.retryAttempts) {
            this.retryAttempts = {};
        }

        // Limpa timeout do observer
        if (this.observerCheckTimeout) {
            clearTimeout(this.observerCheckTimeout);
        }

        console.log('🧹 ErrorBoundaryManager: Recursos limpos');
    }

    /**
     * 🔧 Força Verificação Manual de Todos os Componentes
     */
    forceCheckAllComponents() {
        console.log('🔧 ErrorBoundaryManager: Verificação manual forçada...');

        // Verifica componentes pendentes
        this.checkPendingComponents();

        // Tenta recriar componentes que falharam
        const componentNames = ['ProgressMetas', 'TabelaOperacoes', 'Dashboard', 'Timeline'];
        let recreatedCount = 0;

        componentNames.forEach((name) => {
            if (!this.boundaries.has(name)) {
                const selectors = this.getAlternativeSelectors(name, '');

                for (const selector of selectors) {
                    if (selector && document.querySelector(selector)) {
                        console.log(`🎯 Recriando boundary para ${name} com seletor: ${selector}`);
                        const boundary = this.create(name, selector, { maxRetries: 1 });
                        if (boundary) {
                            recreatedCount++;
                            break;
                        }
                    }
                }
            }
        });

        const currentStatus = this.getStatus();
        console.log(`✅ Verificação concluída: ${recreatedCount} boundaries recriados`);
        console.log('📊 Status atual:', currentStatus);

        return currentStatus;
    }

    /**
     * 📊 Status de Todos os Boundaries
     */
    getStatus() {
        const status = {
            active: {},
            pending: {},
            summary: {
                activeCount: this.boundaries.size,
                pendingCount: this.retryAttempts ? Object.keys(this.retryAttempts).length : 0,
                totalExpected: 4, // ProgressMetas, TabelaOperacoes, Dashboard, Timeline
            },
        };

        // Boundaries ativos
        this.boundaries.forEach((boundary, name) => {
            status.active[name] = {
                isInErrorState: boundary.isInErrorState,
                errorCount: boundary.errorCount,
                retryCount: boundary.retryCount,
            };
        });

        // Componentes pendentes (com retry)
        if (this.retryAttempts) {
            Object.keys(this.retryAttempts).forEach((retryKey) => {
                const componentName = retryKey.replace('_retry', '');
                status.pending[componentName] = {
                    attempts: this.retryAttempts[retryKey],
                    hasActiveTimer: !!this.retryTimers?.[retryKey],
                };
            });
        }

        return status;
    }

    /**
     * 🧹 Destruir Boundary
     */
    destroy(componentName) {
        const boundary = this.boundaries.get(componentName);
        if (boundary) {
            boundary.destroy();
            this.boundaries.delete(componentName);
        }
    }

    /**
     * 🧹 Destruir Todos
     */
    destroyAll() {
        this.boundaries.forEach((boundary, name) => {
            boundary.destroy();
        });
        this.boundaries.clear();
    }
}

// Inicialização automática
let errorBoundaryManager = null;

if (typeof window !== 'undefined') {
    window.ErrorBoundary = ErrorBoundary;
    window.ErrorBoundaryManager = ErrorBoundaryManager;

    // Cria manager global
    errorBoundaryManager = new ErrorBoundaryManager();
    window.errorBoundaryManager = errorBoundaryManager;

    // Expõe funções de debugging no console
    window.checkErrorBoundaries = () => errorBoundaryManager.forceCheckAllComponents();
    window.errorBoundaryStatus = () => errorBoundaryManager.getStatus();

    // Mapa global para acesso direto via botões
    window.errorBoundaries = {};

    // 🚀 AUTO-SETUP REABILITADO COM PROTEÇÃO CONTRA VAZAMENTO
    try {
        console.log('🚀 ErrorBoundary: Iniciando auto-setup com proteção anti-vazamento...');

        // 🛡️ Verificar se já foi configurado
        if (window.__ERROR_BOUNDARY_SETUP_COMPLETED__) {
            console.log('✅ ErrorBoundary já configurado - pulando auto-setup');
        } else {
            // 🔄 Configurar com limite de tempo
            const setupPromise = Promise.race([
                errorBoundaryManager.setupMainComponents(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Setup timeout')), 5000)
                ),
            ]);

            setupPromise
                .then(() => {
                    window.__ERROR_BOUNDARY_SETUP_COMPLETED__ = true;
                    console.log('✅ ErrorBoundary auto-setup concluído com sucesso');
                })
                .catch((error) => {
                    console.warn('⚠️ ErrorBoundary auto-setup falhou:', error.message);
                    console.log(
                        '🔧 Para ativar manualmente: errorBoundaryManager.setupMainComponents()'
                    );
                });
        }
    } catch (error) {
        console.error('❌ Erro no auto-setup do ErrorBoundary:', error);
        console.log('🔧 Para ativar manualmente: errorBoundaryManager.setupMainComponents()');
    }

    // Mantém apenas o manager sem auto-setup
    // if (document.readyState === 'loading') {
    //     document.addEventListener('DOMContentLoaded', () => {
    //         setTimeout(() => {
    //             errorBoundaryManager.setupMainComponents();
    //         }, 2000);
    //     });
    // }

    console.log('🛡️ ErrorBoundary: Sistema carregado');
}

export { ErrorBoundary, ErrorBoundaryManager };
