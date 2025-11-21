# 🎯 PROMPT FINAL: Sincronização Payout + Visual Focus Premium

## 📋 DESAFIO PARA A IA

Implemente **duas funcionalidades críticas** que irão elevar drasticamente a
experiência do usuário:

### 🎯 PARTE 1: SINCRONIZAÇÃO PERFEITA DOS BOTÕES DE PAYOUT

**PROBLEMA**: Os botões de payout do menu lateral NÃO sincronizam com os do card
principal "Parâmetros e Controles".

**SOLUÇÃO REQUERIDA**:

- ✅ **Clique no payout 90% no card principal** → **Sidebar atualiza
  INSTANTANEAMENTE**
- ✅ **Clique no payout 92% no sidebar** → **Card principal atualiza
  INSTANTANEAMENTE**
- ✅ **Estados visuais sincronizados** (classe `active-payout`)
- ✅ **Aplicação automática** no estado da aplicação

### 🎯 PARTE 2: FEEDBACK VISUAL PREMIUM PARA CAMPOS SELECIONADOS

**PROBLEMA**: Campos de texto quando selecionados não têm feedback visual
adequado.

**SOLUÇÃO REQUERIDA**:

- ✅ **Borda verde brilhante** quando campo está focado
- ✅ **Sombra externa verde** sutil e animada
- ✅ **Efeito de digitação** quando usuário está digitando
- ✅ **Compatibilidade com todos os 4 temas** da aplicação

## 🔧 IMPLEMENTAÇÃO OBRIGATÓRIA

### 1. Modificar `sidebar.js` - Função `renderParametersDetail()`

**Adicionar botões de payout no sidebar com IDs únicos:**

```javascript
// Após clonar o painel, ajustar botões de payout
const payoutContainer = clonedPanel.querySelector('.payout-buttons');
if (payoutContainer) {
    payoutContainer.id = 'sidebar-payout-buttons';

    const payoutButtons = payoutContainer.querySelectorAll('button');
    payoutButtons.forEach((button) => {
        const payout = button.textContent.trim();
        button.id = `sidebar-payout-${payout}`;
        button.setAttribute('data-payout', payout);
    });
}
```

### 2. Criar classe `PayoutSyncManager` no `sidebar.js`

**Sistema de sincronização bidirecional:**

```javascript
class PayoutSyncManager {
    constructor() {
        this.activePayout = 87;
        this.isUpdating = false;
    }

    // IMPLEMENTAR:
    handlePayoutChange(payout, source, clickedButton) {
        // 1. Prevenir loops infinitos
        // 2. Atualizar ambos os containers
        // 3. Aplicar feedback visual
        // 4. Atualizar estado da aplicação
    }

    syncPayoutButtons(payout, source) {
        // Sincronizar classes CSS entre main e sidebar
    }
}
```

### 3. Adicionar CSS ao `style.css`

**Efeitos de focus premium:**

```css
/* Campos focados com borda verde brilhante */
.input-group input:focus,
.input-group select:focus,
#capital-inicial:focus,
#percentual-entrada:focus,
#stop-win-perc:focus,
#stop-loss-perc:focus,
#sidebar-capital-inicial:focus,
#sidebar-percentual-entrada:focus,
#sidebar-stop-win-perc:focus,
#sidebar-stop-loss-perc:focus {
    border-color: var(--accent-color) !important;
    box-shadow:
        0 0 0 3px rgba(0, 230, 118, 0.25),
        0 0 12px rgba(0, 230, 118, 0.2);
    background-color: rgba(0, 230, 118, 0.03);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Efeito de digitação */
.typing {
    animation: typingPulse 1s ease-in-out infinite;
}

@keyframes typingPulse {
    0%,
    100% {
        box-shadow: 0 0 0 2px rgba(0, 230, 118, 0.2);
    }
    50% {
        box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.4);
    }
}

/* Efeitos dos botões de payout */
.payout-clicked {
    animation: payoutClick 0.3s ease-out;
}

.payout-synced {
    animation: payoutSync 0.6s ease-out;
}
```

### 4. Criar classe `FieldFocusManager` no `sidebar.js`

**Gerenciamento de efeitos visuais:**

```javascript
class FieldFocusManager {
    constructor() {
        this.focusedField = null;
        this.setupFocusListeners();
    }

    handleFieldFocus(event) {
        // Aplicar efeito verde brilhante
    }

    handleFieldTyping(event) {
        // Aplicar efeito de digitação
    }
}
```

## 🧪 TESTES OBRIGATÓRIOS

### Teste 1: Sincronização Bidirecional

```javascript
// 1. Clicar payout 90% no card principal
document.querySelector('.payout-buttons button').click();
// 2. Verificar se sidebar sincronizou
// 3. Clicar payout 92% no sidebar
// 4. Verificar se card principal sincronizou
```

### Teste 2: Feedback Visual

```javascript
// 1. Focar campo capital inicial
document.getElementById('capital-inicial').focus();
// 2. Verificar borda verde brilhante
// 3. Digitar valores
// 4. Verificar efeito de digitação
```

## 🎯 CRITÉRIOS DE SUCESSO

### Funcional ✅

- [ ] Botões de payout sincronizam instantaneamente (< 50ms)
- [ ] Estados visuais corretos (classe `active-payout`)
- [ ] Campos focados têm borda verde brilhante
- [ ] Efeito de digitação funciona
- [ ] Compatível com todos os 4 temas

### Técnico ✅

- [ ] Zero loops infinitos
- [ ] Performance otimizada
- [ ] Tratamento de erros
- [ ] Event listeners corretos
- [ ] Código limpo e modular

### Visual ✅

- [ ] Transições suaves (0.2s)
- [ ] Efeitos profissionais
- [ ] Feedback visual imediato
- [ ] Acessibilidade preservada
- [ ] Design responsivo mantido

## 🚨 RESTRIÇÕES CRÍTICAS

1. **NÃO QUEBRAR** funcionalidades existentes
2. **MANTER** compatibilidade com sistema atual
3. **SEGUIR** padrões de código existentes
4. **IMPLEMENTAR** debounce para performance
5. **PREVENIR** loops infinitos de sincronização

## 🎯 ARQUIVOS A MODIFICAR

1. **`sidebar.js`** - Renderização botões + Classes de sincronização
2. **`style.css`** - Efeitos visuais CSS
3. **`events.js`** - Integration hooks (se necessário)

## 🏆 COMANDO FINAL

**IMPLEMENTE A SINCRONIZAÇÃO PERFEITA DOS BOTÕES DE PAYOUT E O FEEDBACK VISUAL
PREMIUM PARA CAMPOS SELECIONADOS. A EXPERIÊNCIA DEVE SER FLUIDA, INSTANTÂNEA E
VISUALMENTE IMPRESSIONANTE!**

**Este desafio testará suas habilidades em:**

- Sincronização de estado em tempo real
- Animações CSS avançadas
- Event handling otimizado
- Design de experiência do usuário
- Integração harmoniosa com sistema existente

**Execute `window.testPayoutAndFocus()` no console para validar sua
implementação!**

**BOA SORTE! 🚀**
