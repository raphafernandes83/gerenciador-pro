# 🎯 DESAFIO: Sincronização em Tempo Real Entre Cards

## 📋 OBJETIVO

Implementar uma sincronização bidirecional em tempo real entre o card
"Parâmetros e Controles" da aba "Plano de Operações" e o card do menu lateral,
eliminando a necessidade do botão "Aplicar" e garantindo que todas as mudanças
sejam refletidas instantaneamente em ambos os locais.

## 🏗️ ARQUITETURA ATUAL

### Card Principal (Plano de Operações)

- **Localização**: `#input-panel` no `index.html`
- **Elementos**:
    - `#capital-inicial` (Capital Inicial)
    - `#percentual-entrada` (Entrada Inicial %)
    - `#stop-win-perc` (Stop Win %)
    - `#stop-loss-perc` (Stop Loss %)
    - `#estrategia-select` (Tipo de Estratégia)
    - `.payout-buttons` (Botões de Payout)

### Card do Menu Lateral

- **Localização**: `#sidebar-parameters` no `sidebar.js`
- **Renderização**: Dinâmica via `updateParametersCard()`
- **Estados**: Expandido e Retraído

## 🎯 REQUISITOS TÉCNICOS

### 1. Sincronização Bidirecional

- ✅ **Inputs numéricos**: Capital, Entrada, Stop Win, Stop Loss
- ✅ **Select de estratégia**: Ciclos de Recuperação vs Mão Fixa
- ✅ **Botões de Payout**: 87%, 88%, 89%, 90%, 91%, 92%, 99%
- ✅ **Estado visual**: Classes CSS ativas/inativas

### 2. Eliminação do Botão "Aplicar"

- ❌ **Remover completamente** o botão "Aplicar Alterações"
- ✅ **Aplicação automática** em tempo real
- ✅ **Feedback visual** de mudanças aplicadas

### 3. Performance e Robustez

- ✅ **Debounce** para evitar sincronizações excessivas
- ✅ **Validação** de dados antes da sincronização
- ✅ **Tratamento de erros** e fallbacks
- ✅ **Prevenção de loops infinitos**

## 🔧 IMPLEMENTAÇÃO REQUERIDA

### 1. Sistema de Eventos Customizados

```javascript
// Eventos a serem implementados
document.dispatchEvent(
    new CustomEvent('parameterChange', {
        detail: { elementId, value, type, source },
    })
);

document.dispatchEvent(
    new CustomEvent('payoutChange', {
        detail: { payout, source },
    })
);

document.dispatchEvent(
    new CustomEvent('strategyChange', {
        detail: { strategy, source },
    })
);
```

### 2. Mapeamento de IDs

```javascript
const ID_MAPPING = {
    // Card Principal → Sidebar
    'capital-inicial': 'sidebar-capital-inicial',
    'percentual-entrada': 'sidebar-percentual-entrada',
    'stop-win-perc': 'sidebar-stop-win-perc',
    'stop-loss-perc': 'sidebar-stop-loss-perc',
    'estrategia-select': 'sidebar-estrategia-select',

    // Sidebar → Card Principal (inverso)
    'sidebar-capital-inicial': 'capital-inicial',
    'sidebar-percentual-entrada': 'percentual-entrada',
    'sidebar-stop-win-perc': 'stop-win-perc',
    'sidebar-stop-loss-perc': 'stop-loss-perc',
    'sidebar-estrategia-select': 'estrategia-select',
};
```

### 3. Sistema de Sincronização

```javascript
class RealTimeSyncManager {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
        this.debounceTimer = null;
        this.debounceDelay = 150; // ms
    }

    // Implementar métodos de sincronização
    queueSync(change) {
        /* ... */
    }
    processSyncQueue() {
        /* ... */
    }
    syncElement(sourceId, targetId, value, type) {
        /* ... */
    }
    syncPayoutButtons(payout, source) {
        /* ... */
    }
}
```

### 4. Integração com Sistema Existente

- **Hook no `handleParameterChange`** em `events.js`
- **Hook no `handlePayoutChange`** em `events.js`
- **Hook no `handleStrategyChange`** em `events.js`
- **Integração com `updateState`** em `state.js`
- **Integração com `logic.calcularPlano`** para recálculos

## 🎨 INTERFACE E UX

### 1. Feedback Visual

- **Indicador de sincronização**: Loading spinner durante sync
- **Confirmação visual**: Pulse/glow effect após mudança
- **Estado de erro**: Feedback visual para falhas
- **Tooltip informativo**: "Sincronizado em tempo real"

### 2. Estados de Loading

```css
.syncing {
    opacity: 0.7;
    pointer-events: none;
}

.sync-success {
    animation: syncPulse 0.6s ease-out;
}

.sync-error {
    border-color: var(--error-color);
    animation: errorShake 0.5s ease-in-out;
}
```

### 3. Responsividade

- **Mobile**: Sincronização otimizada para touch
- **Tablet**: Adaptação para telas médias
- **Desktop**: Performance máxima

## 🧪 TESTES E VALIDAÇÃO

### 1. Cenários de Teste

```javascript
// Teste 1: Mudança no card principal
document.getElementById('capital-inicial').value = '15000';
document.getElementById('capital-inicial').dispatchEvent(new Event('change'));

// Teste 2: Mudança no sidebar
document.getElementById('sidebar-capital-inicial').value = '20000';
document
    .getElementById('sidebar-capital-inicial')
    .dispatchEvent(new Event('change'));

// Teste 3: Mudança de payout
document.querySelector('.payout-buttons button[data-payout="90"]').click();

// Teste 4: Mudança de estratégia
document.getElementById('estrategia-select').value = 'fixa';
document.getElementById('estrategia-select').dispatchEvent(new Event('change'));
```

### 2. Validações

- ✅ **Sincronização imediata** entre ambos os cards
- ✅ **Recálculo automático** do plano de operações
- ✅ **Atualização da UI** em tempo real
- ✅ **Persistência** das mudanças no localStorage
- ✅ **Performance** sem lag ou travamentos

## 🚀 CRITÉRIOS DE SUCESSO

### Funcional

- [ ] Todos os inputs sincronizam bidirecionalmente
- [ ] Botões de payout sincronizam visualmente
- [ ] Select de estratégia sincroniza corretamente
- [ ] Botão "Aplicar" foi completamente removido
- [ ] Recálculos automáticos funcionam

### Técnico

- [ ] Sistema de debounce implementado
- [ ] Tratamento de erros robusto
- [ ] Performance otimizada (< 100ms de delay)
- [ ] Código modular e reutilizável
- [ ] Documentação clara

### UX/UI

- [ ] Feedback visual de sincronização
- [ ] Estados de loading apropriados
- [ ] Responsividade mantida
- [ ] Acessibilidade preservada
- [ ] Experiência fluida

## 🎯 DESAFIO ESPECÍFICO

**Sua missão é implementar um sistema de sincronização em tempo real que:**

1. **Elimine completamente** a necessidade do botão "Aplicar"
2. **Sincronize instantaneamente** todos os parâmetros entre os dois cards
3. **Mantenha a performance** e responsividade da aplicação
4. **Preserve toda a funcionalidade** existente
5. **Adicione feedback visual** para confirmar as mudanças

**Restrições:**

- Não pode quebrar funcionalidades existentes
- Deve manter compatibilidade com o sistema atual
- Não pode adicionar dependências externas
- Deve seguir os padrões de código existentes

## 🔍 ARQUIVOS PRINCIPAIS A MODIFICAR

1. **`sidebar.js`** - Sistema de sincronização
2. **`events.js`** - Hooks nos event handlers
3. **`state.js`** - Integração com estado global
4. **`logic.js`** - Recálculos automáticos
5. **`style.css`** - Feedback visual

## 💡 DICAS DE IMPLEMENTAÇÃO

1. **Use o sistema de eventos existente** como base
2. **Aproveite o `updateState`** para centralizar mudanças
3. **Implemente debounce** para evitar loops
4. **Teste extensivamente** todos os cenários
5. **Mantenha o código limpo** e bem documentado

---

**🎯 BOA SORTE! Este é um desafio de arquitetura e implementação que testará
suas habilidades de integração de sistemas complexos em tempo real.**
