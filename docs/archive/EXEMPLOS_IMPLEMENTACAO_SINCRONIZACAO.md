# 🔧 EXEMPLOS DE IMPLEMENTAÇÃO - Sincronização em Tempo Real

## 📝 ESTRUTURA DE CÓDIGO SUGERIDA

### 1. Sistema de Sincronização Principal

```javascript
// Adicionar ao sidebar.js - Classe RealTimeSyncManager
class RealTimeSyncManager {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
        this.debounceTimer = null;
        this.debounceDelay = 150;
        this.lastSyncTime = 0;
        this.syncCooldown = 50; // ms entre sincronizações

        // Mapeamento de IDs
        this.idMapping = {
            'capital-inicial': 'sidebar-capital-inicial',
            'percentual-entrada': 'sidebar-percentual-entrada',
            'stop-win-perc': 'sidebar-stop-win-perc',
            'stop-loss-perc': 'sidebar-stop-loss-perc',
            'estrategia-select': 'sidebar-estrategia-select',

            // Inverso
            'sidebar-capital-inicial': 'capital-inicial',
            'sidebar-percentual-entrada': 'percentual-entrada',
            'sidebar-stop-win-perc': 'stop-win-perc',
            'sidebar-stop-loss-perc': 'stop-loss-perc',
            'sidebar-estrategia-select': 'estrategia-select',
        };

        this.initializeSync();
    }

    initializeSync() {
        // Escuta eventos de mudança do card principal
        this.setupMainCardListeners();

        // Escuta eventos de mudança do sidebar
        this.setupSidebarListeners();

        // Escuta eventos de payout
        this.setupPayoutListeners();

        // Escuta eventos de estratégia
        this.setupStrategyListeners();
    }

    setupMainCardListeners() {
        const mainInputs = [
            'capital-inicial',
            'percentual-entrada',
            'stop-win-perc',
            'stop-loss-perc',
        ];

        mainInputs.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.queueSync({
                        sourceId: id,
                        targetId: this.idMapping[id],
                        value: e.target.value,
                        type: 'input',
                        source: 'main',
                    });
                });
            }
        });
    }

    setupSidebarListeners() {
        // Os listeners serão configurados dinamicamente quando o sidebar for criado
        document.addEventListener('sidebarReady', () => {
            const sidebarInputs = [
                'sidebar-capital-inicial',
                'sidebar-percentual-entrada',
                'sidebar-stop-win-perc',
                'sidebar-stop-loss-perc',
            ];

            sidebarInputs.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', (e) => {
                        this.queueSync({
                            sourceId: id,
                            targetId: this.idMapping[id],
                            value: e.target.value,
                            type: 'input',
                            source: 'sidebar',
                        });
                    });
                }
            });
        });
    }

    setupPayoutListeners() {
        // Escuta mudanças nos botões de payout do card principal
        const payoutContainer = document.querySelector('.payout-buttons');
        if (payoutContainer) {
            payoutContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const payout = parseInt(e.target.textContent);
                    this.syncPayoutButtons(payout, 'main');
                }
            });
        }

        // Escuta mudanças nos botões de payout do sidebar
        document.addEventListener('sidebarReady', () => {
            const sidebarPayoutContainer = document.querySelector(
                '#sidebar-parameters .payout-buttons'
            );
            if (sidebarPayoutContainer) {
                sidebarPayoutContainer.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const payout = parseInt(e.target.textContent);
                        this.syncPayoutButtons(payout, 'sidebar');
                    }
                });
            }
        });
    }

    setupStrategyListeners() {
        // Card principal
        const strategySelect = document.getElementById('estrategia-select');
        if (strategySelect) {
            strategySelect.addEventListener('change', (e) => {
                this.queueSync({
                    sourceId: 'estrategia-select',
                    targetId: 'sidebar-estrategia-select',
                    value: e.target.value,
                    type: 'select',
                    source: 'main',
                });
            });
        }

        // Sidebar
        document.addEventListener('sidebarReady', () => {
            const sidebarStrategySelect = document.getElementById(
                'sidebar-estrategia-select'
            );
            if (sidebarStrategySelect) {
                sidebarStrategySelect.addEventListener('change', (e) => {
                    this.queueSync({
                        sourceId: 'sidebar-estrategia-select',
                        targetId: 'estrategia-select',
                        value: e.target.value,
                        type: 'select',
                        source: 'sidebar',
                    });
                });
            }
        });
    }

    queueSync(change) {
        // Evita sincronizações muito frequentes
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncCooldown) {
            return;
        }

        this.syncQueue.push(change);
        this.debounceSync();
    }

    debounceSync() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.processSyncQueue();
        }, this.debounceDelay);
    }

    processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) return;

        this.isSyncing = true;
        const changes = [...this.syncQueue];
        this.syncQueue = [];

        try {
            changes.forEach((change) => {
                this.applyChange(change);
            });

            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('Erro na sincronização:', error);
            // Recoloca mudanças na fila em caso de erro
            this.syncQueue.unshift(...changes);
        } finally {
            this.isSyncing = false;
        }
    }

    applyChange(change) {
        const { sourceId, targetId, value, type, source } = change;

        // Aplica a mudança no elemento alvo
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        // Previne loops infinitos
        if (targetElement.value === value) return;

        // Aplica a mudança
        if (type === 'input' || type === 'select') {
            targetElement.value = value;

            // Dispara evento de change para ativar a lógica existente
            targetElement.dispatchEvent(new Event('change', { bubbles: true }));

            // Feedback visual
            this.showSyncFeedback(targetElement, 'success');
        }
    }

    syncPayoutButtons(payout, source) {
        // Sincroniza botões de payout entre os dois locais
        const containers = [
            document.querySelector('.payout-buttons'),
            document.querySelector('#sidebar-parameters .payout-buttons'),
        ];

        containers.forEach((container) => {
            if (container) {
                // Remove classe ativa de todos os botões
                container.querySelectorAll('button').forEach((btn) => {
                    btn.classList.remove('active-payout');
                });

                // Adiciona classe ativa no botão correto
                const targetButton = Array.from(
                    container.querySelectorAll('button')
                ).find((btn) => parseInt(btn.textContent) === payout);

                if (targetButton) {
                    targetButton.classList.add('active-payout');
                    this.showSyncFeedback(targetButton, 'success');
                }
            }
        });

        // Atualiza o estado global
        if (window.updateState) {
            const needsRecalculation = window.updateState({ payout });
            if (needsRecalculation && window.logic) {
                window.logic.calcularPlano(true);
            }
        }
    }

    showSyncFeedback(element, type) {
        // Adiciona classe de feedback
        element.classList.add(`sync-${type}`);

        // Remove após animação
        setTimeout(() => {
            element.classList.remove(`sync-${type}`);
        }, 600);
    }
}

// Instância global
window.realTimeSync = new RealTimeSyncManager();
```

### 2. Modificações no events.js

```javascript
// Modificar a função handleParameterChange em events.js
handleParameterChange(event) {
    const input = event.target;
    const key = input.id.replace(/-(\w)/g, (m, g) => g.toUpperCase());
    let value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    // Validação mais robusta
    if (isNaN(value)) {
        value = min || 0;
        input.value = value;
    } else if (min !== undefined && value < min) {
        value = min;
        input.value = value;
    } else if (max !== undefined && value > max) {
        value = max;
        input.value = value;
    }

    // Aplicação imediata (sem botão "Aplicar")
    const needsRecalculation = updateState({ [key]: value });
    if (needsRecalculation) {
        logic.updateCalculatedValues();
        logic.calcularPlano(true);
    }
    ui.syncUIFromState();
    ui.atualizarTudo();

    // Feedback visual de aplicação automática
    this.showAutoApplyFeedback(input);
},

// Adicionar função de feedback
showAutoApplyFeedback(element) {
    element.classList.add('auto-applied');
    setTimeout(() => {
        element.classList.remove('auto-applied');
    }, 800);
},

// Modificar handlePayoutChange
handlePayoutChange(e) {
    if(e.target.tagName === 'BUTTON') {
        const newPayout = parseInt(e.target.textContent);

        // Aplicação imediata
        const needsRecalculation = updateState({ payout: newPayout });
        if(needsRecalculation) {
            logic.calcularPlano(true);
        }
        ui.atualizarTudo();

        // Atualização visual imediata
        if (dom.payoutButtonsContainer) {
            dom.payoutButtonsContainer.querySelector('.active-payout')?.classList.remove('active-payout');
        }
        e.target.classList.add('active-payout');

        // Feedback visual
        this.showAutoApplyFeedback(e.target);
    }
},

// Modificar handleStrategyChange
handleStrategyChange(e) {
    // Aplicação imediata
    const needsRecalculation = updateState({ estrategiaAtiva: e.target.value });
    if (needsRecalculation) {
        logic.calcularPlano(true);
    }
    ui.atualizarTudo();

    // Feedback visual
    if(dom.estrategiaSelect) {
        dom.estrategiaSelect.classList.add('auto-applied');
        setTimeout(() => {
            dom.estrategiaSelect.classList.remove('auto-applied');
        }, 800);
    }
}
```

### 3. Modificações no sidebar.js

```javascript
// Modificar a função renderParametersDetail em sidebar.js
renderParametersDetail() {
    // Clona o card de parâmetros e controles
    const originalPanel = document.getElementById('input-panel');
    if (originalPanel) {
        const clonedPanel = originalPanel.cloneNode(true);
        clonedPanel.removeAttribute('id');
        clonedPanel.classList.add('sidebar-content-section');

        // Ajusta IDs dos inputs para evitar conflitos
        const inputs = [
            { original: 'capital-inicial', new: 'sidebar-capital-inicial' },
            { original: 'percentual-entrada', new: 'sidebar-percentual-entrada' },
            { original: 'stop-win-perc', new: 'sidebar-stop-win-perc' },
            { original: 'stop-loss-perc', new: 'sidebar-stop-loss-perc' },
            { original: 'estrategia-select', new: 'sidebar-estrategia-select' }
        ];

        inputs.forEach(({ original, new: newId }) => {
            const input = clonedPanel.querySelector(`#${original}`);
            if (input) {
                input.id = newId;
                // Sincroniza com o valor atual
                const originalInput = document.getElementById(original);
                if (originalInput) {
                    input.value = originalInput.value;
                }
            }
        });

        // Remove o botão "Aplicar" - não é mais necessário
        const applyButton = clonedPanel.querySelector('.settings-actions');
        if (applyButton) {
            applyButton.remove();
        }

        // Adiciona indicador de sincronização automática
        const syncIndicator = document.createElement('div');
        syncIndicator.className = 'sync-indicator';
        syncIndicator.innerHTML = `
            <span class="sync-icon">🔄</span>
            <span class="sync-text">Sincronização automática ativa</span>
        `;
        clonedPanel.appendChild(syncIndicator);

        return `<div class="sidebar-content-section">${clonedPanel.innerHTML}</div>`;
    }

    // Fallback
    return `
        <div class="sidebar-content-section">
            <h2>Parâmetros e Controles</h2>
            <p>Use a tela principal para ajustar os parâmetros de trading.</p>
            <div class="sync-indicator">
                <span class="sync-icon">🔄</span>
                <span class="sync-text">Sincronização automática ativa</span>
            </div>
        </div>
    `;
}

// Modificar a função applyParametersChanges (remover completamente)
applyParametersChanges() {
    // Esta função não é mais necessária - tudo é aplicado automaticamente
    console.log('Aplicação automática ativa - não é necessário aplicar manualmente');
}
```

### 4. CSS para Feedback Visual

```css
/* Adicionar ao style.css */

/* Feedback de aplicação automática */
.auto-applied {
    animation: autoApplyPulse 0.8s ease-out;
    border-color: var(--accent-color) !important;
    box-shadow: 0 0 0 2px rgba(0, 230, 118, 0.3);
}

@keyframes autoApplyPulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
    100% {
        transform: scale(1);
    }
}

/* Feedback de sincronização */
.sync-success {
    animation: syncSuccess 0.6s ease-out;
}

.sync-error {
    animation: syncError 0.5s ease-in-out;
    border-color: var(--error-color) !important;
}

@keyframes syncSuccess {
    0% {
        background-color: rgba(0, 230, 118, 0.1);
    }
    100% {
        background-color: transparent;
    }
}

@keyframes syncError {
    0%,
    100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-5px);
    }
    75% {
        transform: translateX(5px);
    }
}

/* Indicador de sincronização */
.sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: linear-gradient(
        135deg,
        rgba(0, 230, 118, 0.1),
        rgba(0, 230, 118, 0.05)
    );
    border-radius: 8px;
    margin-top: 1rem;
    border: 1px solid rgba(0, 230, 118, 0.2);
}

.sync-icon {
    font-size: 1.2rem;
    animation: syncSpin 2s linear infinite;
}

.sync-text {
    font-size: 0.9rem;
    color: var(--accent-color);
    font-weight: 500;
}

@keyframes syncSpin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Estados de loading durante sincronização */
.syncing {
    opacity: 0.7;
    pointer-events: none;
    position: relative;
}

.syncing::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid var(--accent-color);
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* Remover botão aplicar */
.settings-actions {
    display: none !important;
}

/* Tooltip informativo */
[data-sync-tooltip] {
    position: relative;
}

[data-sync-tooltip]:hover::before {
    content: attr(data-sync-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--background-color);
    color: var(--text-color);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 1000;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### 5. Integração no main.js

```javascript
// Adicionar ao final do main.js
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o sistema de sincronização
    if (window.realTimeSync) {
        console.log('✅ Sistema de sincronização em tempo real ativo');

        // Dispara evento quando o sidebar estiver pronto
        document.dispatchEvent(new CustomEvent('sidebarReady'));
    }
});
```

## 🎯 PONTOS CRÍTICOS DE IMPLEMENTAÇÃO

1. **Prevenção de Loops**: Sempre verificar se o valor já é igual antes de
   aplicar
2. **Debounce**: Usar debounce para evitar sincronizações excessivas
3. **Fallbacks**: Implementar fallbacks para quando elementos não existem
4. **Performance**: Monitorar performance e otimizar se necessário
5. **Compatibilidade**: Manter compatibilidade com sistema existente

## 🧪 TESTES RÁPIDOS

```javascript
// Teste no console do navegador
// 1. Mudança no capital inicial
document.getElementById('capital-inicial').value = '15000';
document.getElementById('capital-inicial').dispatchEvent(new Event('change'));

// 2. Verificar se sincronizou no sidebar
console.log(document.getElementById('sidebar-capital-inicial')?.value);

// 3. Mudança no sidebar
document.getElementById('sidebar-capital-inicial').value = '20000';
document
    .getElementById('sidebar-capital-inicial')
    .dispatchEvent(new Event('change'));

// 4. Verificar se sincronizou no principal
console.log(document.getElementById('capital-inicial').value);

// 5. Teste de payout
document.querySelector('.payout-buttons button[data-payout="90"]').click();

// 6. Verificar se ambos os locais têm o mesmo payout ativo
console.log(
    'Principal:',
    document.querySelector('.payout-buttons .active-payout')?.textContent
);
console.log(
    'Sidebar:',
    document.querySelector('#sidebar-parameters .active-payout')?.textContent
);
```
