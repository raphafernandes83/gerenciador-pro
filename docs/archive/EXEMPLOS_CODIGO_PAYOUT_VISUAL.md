# 🔧 EXEMPLOS DE CÓDIGO - Payout Sync + Visual Focus

## 📝 IMPLEMENTAÇÃO PRÁTICA

### 1. Sistema de Sincronização dos Botões de Payout

#### A. Modificação no `sidebar.js` - Renderização dos Botões

```javascript
// Modificar função renderParametersDetail() para incluir botões de payout
renderParametersDetail() {
    const originalPanel = document.getElementById('input-panel');
    if (originalPanel) {
        const clonedPanel = originalPanel.cloneNode(true);
        clonedPanel.removeAttribute('id');
        clonedPanel.classList.add('sidebar-content-section');

        // Ajustar IDs dos inputs existentes...
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
                const originalInput = document.getElementById(original);
                if (originalInput) {
                    input.value = originalInput.value;
                }
            }
        });

        // NOVA IMPLEMENTAÇÃO: Clonar e ajustar botões de payout
        const payoutContainer = clonedPanel.querySelector('.payout-buttons');
        if (payoutContainer) {
            payoutContainer.id = 'sidebar-payout-buttons';

            // Ajustar IDs dos botões de payout
            const payoutButtons = payoutContainer.querySelectorAll('button');
            payoutButtons.forEach(button => {
                const payout = button.textContent.trim();
                button.id = `sidebar-payout-${payout}`;
                button.setAttribute('data-payout', payout);
                button.setAttribute('data-source', 'sidebar');

                // Sincronizar estado ativo atual
                const mainButton = document.querySelector(`.payout-buttons button:nth-child(${Array.from(payoutButtons).indexOf(button) + 1})`);
                if (mainButton && mainButton.classList.contains('active-payout')) {
                    button.classList.add('active-payout');
                }
            });
        }

        // Adicionar indicador de sincronização
        const syncIndicator = document.createElement('div');
        syncIndicator.className = 'sync-indicator';
        syncIndicator.innerHTML = `
            <span class="sync-icon">🔄</span>
            <span class="sync-text">Sincronização automática ativa</span>
        `;
        clonedPanel.appendChild(syncIndicator);

        // Disparar evento quando modal estiver pronto
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('sidebarModalReady'));
            document.dispatchEvent(new CustomEvent('payoutButtonsReady'));
        }, 100);

        return `<div class="sidebar-content-section">${clonedPanel.innerHTML}</div>`;
    }

    return '<div class="sidebar-content-section"><p>Erro ao carregar parâmetros</p></div>';
}
```

#### B. Sistema de Gerenciamento de Payout - `PayoutSyncManager`

```javascript
// Adicionar no sidebar.js após RealTimeSyncManager
class PayoutSyncManager {
    constructor() {
        this.activePayout = 87; // Valor padrão
        this.mainContainer = '.payout-buttons';
        this.sidebarContainer = '#sidebar-payout-buttons';
        this.isUpdating = false; // Previne loops infinitos
        this.lastUpdateTime = 0;
        this.updateCooldown = 100; // ms

        this.initialize();
    }

    initialize() {
        // Setup inicial
        this.loadCurrentPayout();
        this.setupMainListeners();

        // Setup sidebar quando estiver pronto
        document.addEventListener('payoutButtonsReady', () => {
            this.setupSidebarListeners();
            this.syncCurrentState();
        });
    }

    loadCurrentPayout() {
        // Carrega payout atual do estado da aplicação
        const activeButton = document.querySelector(
            `${this.mainContainer} .active-payout`
        );
        if (activeButton) {
            this.activePayout = parseInt(activeButton.textContent.trim());
        }
    }

    setupMainListeners() {
        const mainContainer = document.querySelector(this.mainContainer);
        if (mainContainer) {
            mainContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && !this.isUpdating) {
                    const payout = parseInt(e.target.textContent.trim());
                    this.handlePayoutChange(payout, 'main', e.target);
                }
            });
        }
    }

    setupSidebarListeners() {
        const sidebarContainer = document.querySelector(this.sidebarContainer);
        if (sidebarContainer) {
            sidebarContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && !this.isUpdating) {
                    const payout = parseInt(e.target.textContent.trim());
                    this.handlePayoutChange(payout, 'sidebar', e.target);
                }
            });
        }
    }

    handlePayoutChange(payout, source, clickedButton) {
        // Cooldown para evitar múltiplos cliques
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateCooldown) {
            return;
        }

        this.lastUpdateTime = now;
        this.isUpdating = true;

        try {
            // Atualizar estado interno
            this.activePayout = payout;

            // Aplicar feedback visual no botão clicado
            this.applyClickFeedback(clickedButton);

            // Sincronizar ambos os containers
            this.syncPayoutButtons(payout, source);

            // Atualizar estado da aplicação
            this.updateApplicationState(payout);

            // Disparar evento customizado
            document.dispatchEvent(
                new CustomEvent('payoutSync', {
                    detail: { payout, source, timestamp: now },
                })
            );
        } catch (error) {
            console.error('Erro na sincronização de payout:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    syncPayoutButtons(payout, source) {
        const containers = [
            document.querySelector(this.mainContainer),
            document.querySelector(this.sidebarContainer),
        ];

        containers.forEach((container) => {
            if (container) {
                // Remover classe ativa de todos os botões
                container.querySelectorAll('button').forEach((btn) => {
                    btn.classList.remove('active-payout');
                    btn.setAttribute('aria-pressed', 'false');
                });

                // Adicionar classe ativa no botão correto
                const targetButton =
                    container.querySelector(
                        `button[data-payout="${payout}"]`
                    ) ||
                    Array.from(container.querySelectorAll('button')).find(
                        (btn) => parseInt(btn.textContent.trim()) === payout
                    );

                if (targetButton) {
                    targetButton.classList.add('active-payout');
                    targetButton.setAttribute('aria-pressed', 'true');

                    // Feedback visual apenas se não for o botão clicado
                    if (targetButton.getAttribute('data-source') !== source) {
                        this.applySyncFeedback(targetButton);
                    }
                }
            }
        });
    }

    applyClickFeedback(button) {
        // Efeito ripple
        const ripple = document.createElement('span');
        ripple.className = 'payout-ripple';
        button.appendChild(ripple);

        // Remover ripple após animação
        setTimeout(() => ripple.remove(), 600);

        // Efeito de confirmação
        button.classList.add('payout-clicked');
        setTimeout(() => {
            button.classList.remove('payout-clicked');
        }, 300);
    }

    applySyncFeedback(button) {
        // Efeito de sincronização
        button.classList.add('payout-synced');
        setTimeout(() => {
            button.classList.remove('payout-synced');
        }, 600);
    }

    updateApplicationState(payout) {
        // Atualizar estado global da aplicação
        if (window.updateState) {
            const needsRecalculation = window.updateState({ payout });
            if (needsRecalculation && window.logic) {
                window.logic.calcularPlano(true);
            }
        }

        // Atualizar UI
        if (window.ui) {
            window.ui.atualizarTudo();
        }
    }

    syncCurrentState() {
        // Sincronizar estado atual quando sidebar abre
        this.syncPayoutButtons(this.activePayout, 'sync');
    }
}

// Instância global
window.payoutSync = new PayoutSyncManager();
```

### 2. Sistema de Feedback Visual para Campos Selecionados

#### A. CSS para Efeitos de Focus - Adicionar ao `style.css`

```css
/* ============================================= */
/* PREMIUM FIELD FOCUS EFFECTS */
/* ============================================= */

/* Base styles para campos focados */
.input-group input:focus,
.input-group select:focus,
input[type='number']:focus,
input[type='text']:focus,
select:focus {
    outline: none;
    border-color: var(--accent-color) !important;
    box-shadow:
        0 0 0 2px rgba(0, 230, 118, 0.2),
        0 0 8px rgba(0, 230, 118, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    background-color: rgba(0, 230, 118, 0.03);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 2;
}

/* Efeito de brilho animado */
.input-group input:focus::before,
.input-group select:focus::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
        45deg,
        rgba(0, 230, 118, 0.4),
        rgba(0, 230, 118, 0.1),
        rgba(0, 230, 118, 0.4)
    );
    border-radius: inherit;
    z-index: -1;
    animation: fieldGlow 2s ease-in-out infinite alternate;
    pointer-events: none;
}

@keyframes fieldGlow {
    0% {
        opacity: 0.3;
        transform: scale(1);
    }
    100% {
        opacity: 0.6;
        transform: scale(1.01);
    }
}

/* Campos específicos do card principal */
#capital-inicial:focus,
#percentual-entrada:focus,
#stop-win-perc:focus,
#stop-loss-perc:focus,
#estrategia-select:focus {
    border-color: var(--accent-color) !important;
    box-shadow:
        0 0 0 3px rgba(0, 230, 118, 0.25),
        0 0 12px rgba(0, 230, 118, 0.2),
        0 2px 8px rgba(0, 0, 0, 0.1);
    background: linear-gradient(
        135deg,
        rgba(0, 230, 118, 0.05),
        rgba(0, 230, 118, 0.02)
    );
    transform: translateY(-1px);
}

/* Campos específicos do sidebar */
#sidebar-capital-inicial:focus,
#sidebar-percentual-entrada:focus,
#sidebar-stop-win-perc:focus,
#sidebar-stop-loss-perc:focus,
#sidebar-estrategia-select:focus {
    border-color: var(--accent-color) !important;
    box-shadow:
        0 0 0 3px rgba(0, 230, 118, 0.3),
        0 0 15px rgba(0, 230, 118, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    background: radial-gradient(
        circle at center,
        rgba(0, 230, 118, 0.06),
        rgba(0, 230, 118, 0.02)
    );
    transform: scale(1.02);
}

/* Efeito de typing (quando usuário está digitando) */
.input-group input.typing,
.input-group select.typing {
    animation: typingPulse 1s ease-in-out infinite;
}

@keyframes typingPulse {
    0%,
    100% {
        box-shadow:
            0 0 0 2px rgba(0, 230, 118, 0.2),
            0 0 8px rgba(0, 230, 118, 0.15);
    }
    50% {
        box-shadow:
            0 0 0 3px rgba(0, 230, 118, 0.35),
            0 0 12px rgba(0, 230, 118, 0.25);
    }
}

/* Adaptação para temas */
body[data-theme='claro'] .input-group input:focus,
body[data-theme='claro'] .input-group select:focus {
    box-shadow:
        0 0 0 2px rgba(0, 230, 118, 0.3),
        0 0 8px rgba(0, 230, 118, 0.2),
        0 2px 4px rgba(0, 0, 0, 0.1);
}

body[data-theme='matrix'] .input-group input:focus,
body[data-theme='matrix'] .input-group select:focus {
    border-color: #00ff41 !important;
    box-shadow:
        0 0 0 2px rgba(0, 255, 65, 0.4),
        0 0 12px rgba(0, 255, 65, 0.3);
    background-color: rgba(0, 255, 65, 0.05);
}

body[data-theme='daltonismo'] .input-group input:focus,
body[data-theme='daltonismo'] .input-group select:focus {
    border-color: #0072b2 !important;
    box-shadow:
        0 0 0 2px rgba(0, 114, 178, 0.3),
        0 0 8px rgba(0, 114, 178, 0.2);
    background-color: rgba(0, 114, 178, 0.03);
}
```

#### B. CSS para Efeitos dos Botões de Payout

```css
/* ============================================= */
/* PAYOUT BUTTONS SYNC EFFECTS */
/* ============================================= */

/* Efeito ripple para clique */
.payout-ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
    pointer-events: none;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
}

@keyframes rippleEffect {
    0% {
        transform: scale(0);
        opacity: 1;
    }
    100% {
        transform: scale(4);
        opacity: 0;
    }
}

/* Efeito de confirmação ao clicar */
.payout-clicked {
    animation: payoutClickFeedback 0.3s ease-out;
}

@keyframes payoutClickFeedback {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(0.95);
        filter: brightness(1.3);
    }
    100% {
        transform: scale(1);
    }
}

/* Efeito de sincronização */
.payout-synced {
    animation: payoutSyncFeedback 0.6s ease-out;
}

@keyframes payoutSyncFeedback {
    0% {
        transform: scale(1);
        box-shadow: inherit;
    }
    50% {
        transform: scale(1.05);
        box-shadow:
            inherit,
            0 0 20px rgba(0, 230, 118, 0.4);
    }
    100% {
        transform: scale(1);
        box-shadow: inherit;
    }
}

/* Melhorias no estado ativo */
.payout-buttons button.active-payout {
    border-color: rgba(255, 255, 255, 0.9) !important;
    filter: brightness(1.25);
    transform: translateY(-1px);
    position: relative;
}

/* Pulse sutil no botão ativo */
.payout-buttons button.active-payout::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: inherit;
    animation: activePulse 2s ease-in-out infinite;
    pointer-events: none;
}

@keyframes activePulse {
    0%,
    100% {
        opacity: 0.5;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.02);
    }
}
```

#### C. JavaScript para Gerenciamento de Focus - Adicionar ao final do `sidebar.js`

```javascript
/**
 * Gerenciador de Efeitos de Focus Premium
 */
class FieldFocusManager {
    constructor() {
        this.focusedField = null;
        this.typingTimer = null;
        this.typingDelay = 500; // ms após parar de digitar

        this.initialize();
    }

    initialize() {
        this.setupFocusListeners();
        this.setupTypingDetection();
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
                this.attachListenersToFields(
                    fieldSelectors.filter((s) => s.includes('sidebar'))
                );
            }, 50);
        });
    }

    attachListenersToFields(selectors) {
        selectors.forEach((selector) => {
            const field = document.querySelector(selector);
            if (field) {
                field.addEventListener('focus', (e) =>
                    this.handleFieldFocus(e)
                );
                field.addEventListener('blur', (e) => this.handleFieldBlur(e));
                field.addEventListener('input', (e) =>
                    this.handleFieldTyping(e)
                );
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
        // Aplicar classe CSS de focus premium
        field.classList.add('field-focused');

        // Feedback visual adicional baseado no tipo de campo
        if (field.type === 'number') {
            this.addNumberFieldEffect(field);
        } else if (field.tagName === 'SELECT') {
            this.addSelectFieldEffect(field);
        }
    }

    removeFocusEffect(field) {
        field.classList.remove('field-focused', 'typing');

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

// Instância global
window.fieldFocusManager = new FieldFocusManager();
```

### 3. Script de Teste Avançado

```javascript
// Adicionar ao main.js - Função de teste para as novas funcionalidades
window.testPayoutAndFocus = function () {
    console.log('\n🧪 TESTANDO PAYOUT SYNC + VISUAL FOCUS...\n');

    let testIndex = 0;
    const tests = [
        // Teste 1: Payout Sync Main → Sidebar
        () => {
            console.log('📝 Teste 1: Payout 90% no card principal');
            const btn = Array.from(
                document.querySelectorAll('.payout-buttons button')
            ).find((b) => b.textContent.trim() === '90');
            if (btn) {
                btn.click();
                console.log('✅ Clique executado no payout 90%');
            }
        },

        // Teste 2: Verificar sincronização no sidebar
        () => {
            console.log('📝 Teste 2: Verificando sincronização no sidebar');
            const sidebarBtn = document.querySelector('#sidebar-payout-90');
            if (sidebarBtn && sidebarBtn.classList.contains('active-payout')) {
                console.log('✅ Sidebar sincronizado corretamente');
            } else {
                console.log('❌ Sidebar NÃO sincronizado');
            }
        },

        // Teste 3: Focus Effect
        () => {
            console.log('📝 Teste 3: Efeito de focus no capital inicial');
            const capitalField = document.getElementById('capital-inicial');
            if (capitalField) {
                capitalField.focus();
                setTimeout(() => {
                    if (capitalField.classList.contains('field-focused')) {
                        console.log('✅ Efeito de focus aplicado');
                    } else {
                        console.log('❌ Efeito de focus NÃO aplicado');
                    }
                }, 100);
            }
        },

        // Teste 4: Typing Effect
        () => {
            console.log('📝 Teste 4: Efeito de digitação');
            const capitalField = document.getElementById('capital-inicial');
            if (capitalField) {
                capitalField.value = '25000';
                capitalField.dispatchEvent(
                    new Event('input', { bubbles: true })
                );

                setTimeout(() => {
                    if (capitalField.classList.contains('typing')) {
                        console.log('✅ Efeito de digitação ativo');
                    }
                }, 50);
            }
        },

        // Teste 5: Payout Sidebar → Main
        () => {
            console.log('📝 Teste 5: Payout 92% no sidebar');
            const sidebarBtn = document.querySelector('#sidebar-payout-92');
            if (sidebarBtn) {
                sidebarBtn.click();
                console.log('✅ Clique executado no sidebar');

                setTimeout(() => {
                    const mainBtn = Array.from(
                        document.querySelectorAll('.payout-buttons button')
                    ).find((b) => b.textContent.trim() === '92');
                    if (
                        mainBtn &&
                        mainBtn.classList.contains('active-payout')
                    ) {
                        console.log('✅ Card principal sincronizado');
                    } else {
                        console.log('❌ Card principal NÃO sincronizado');
                    }
                }, 100);
            } else {
                console.log(
                    '⚠️ Botão do sidebar não encontrado - abra o menu lateral'
                );
            }
        },
    ];

    // Executar testes sequencialmente
    function runNextTest() {
        if (testIndex < tests.length) {
            tests[testIndex]();
            testIndex++;
            setTimeout(runNextTest, 800);
        } else {
            console.log('\n🎯 TODOS OS TESTES CONCLUÍDOS!');
            console.log(
                '💡 Abra o menu lateral e teste manualmente para verificar todas as funcionalidades'
            );
        }
    }

    runNextTest();
};

// Auto-executar após inicialização
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.payoutSync && window.fieldFocusManager) {
            console.log('🚀 Executando testes avançados em 3 segundos...');
            setTimeout(() => {
                window.testPayoutAndFocus();
            }, 3000);
        }
    }, 1000);
});
```

## 🎯 PONTOS CRÍTICOS DE IMPLEMENTAÇÃO

1. **Timing de Inicialização**: Os listeners do sidebar devem ser configurados
   após o modal estar pronto
2. **Prevenção de Loops**: Use flags `isUpdating` para evitar loops infinitos
3. **Performance**: Cache elementos DOM e use event delegation
4. **Acessibilidade**: Mantenha `aria-pressed` e outros atributos atualizados
5. **Temas**: Teste em todos os 4 temas para garantir compatibilidade visual

## 🧪 VALIDAÇÃO FINAL

Execute `window.testPayoutAndFocus()` no console para validar todas as
funcionalidades implementadas!
