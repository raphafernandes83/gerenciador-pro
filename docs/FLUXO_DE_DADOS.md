# 🔄 FLUXO DE DADOS - Gerenciador PRO

**Documentação Completa do Fluxo de Dados e State Management**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Estado](#arquitetura-de-estado)
3. [Ciclo de Vida de uma Operação](#ciclo-de-vida-de-uma-operação)
4. [Bidirectional Sync](#bidirectional-sync)
5. [Event System](#event-system)
6. [Patterns Utilizados](#patterns-utilizados)

---

## 🎯 Visão Geral

### Princípios Fundamentais

1. **Single Source of Truth:** O `state` é a única fonte de verdade
2. **Unidirectional Data Flow:** Dados fluem em uma direção definida
3. **Event-Driven:** Mudanças de estado geram eventos
4. **Immutability Preferred:** Estado não deve ser mutado diretamente

### Diagrama Geral

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERACTION                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   UI LAYER (ui.js)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Facades & Delegations                          │   │
│  │  - ui.registrarWin()                            │   │
│  │  - ui.renderizarTabela()                        │   │
│  │  - components.dashboard.update()                │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              LOGIC LAYER (logic.js)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Business Logic                                 │   │
│  │  - registrarOperacao()                          │   │
│  │  - calcularPlano()                              │   │
│  │  - validarOperacao()                            │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│            STATE LAYER (state.js + StateManager)         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  State Management                               │   │
│  │  - state.capitalAtual                           │   │
│  │  │  - state.planoDeOperacoes                     │   │
│  │  - state.historicoCombinado                     │   │
│  │  - stateManager.update()                        │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│          PERSISTENCE LAYER (dbManager)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  IndexedDB Storage                              │   │
│  │  - saveSession()                                │   │
│  │  - updateSession()                              │   │
│  │  - loadSession()                                │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   EVENT SYSTEM                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Event Dispatch                                 │   │
│  │  - 'stateChange:operacao'                       │   │
│  │  - 'stateChange:capital'                        │   │
│  │  - 'stateChange:plano'                          │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   UI UPDATE                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Components Re-render                           │   │
│  │  - TabelaUI.render()                            │   │
│  │  - TimelineUI.render()                          │   │
│  │  - DashboardUI.update()                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura de Estado

### Estrutura do State Object

```javascript
const state = {
    // Capital e Financeiro
    capitalAtual: 15000,
    capitalInicial: 15000,
    capitalOriginal: 15000,
    lucroAtual: 0,
    stopLossAmount: 3000,
    stopWinAmount: 5000,
    
    // Plano de Operações
    planoDeOperacoes: [
        {
            entrada: 10.00,
            stopLoss: -10.00,
            meta: 15.00,
            concluida: false,
            resultado: null
        },
        // ... mais etapas
    ],
    
    // Histórico
    historicoCombinado: [
        {
            isWin: true,
            valor: 15.00,
            timestamp: '2025-11-24T10:30:00',
            tag: 'M5',
            capitalAntes: 15000,
            capitalDepois: 15015
        },
        // ... mais operações
    ],
    
    // Sessão Atual
    sessaoAtual: {
        id: 'session_123',
        data: '2025-11-24',
        inicio: '09:00:00',
        fim: null,
        ativa: true
    },
    
    // Histórico de Sessões
    historicoSessao: [
        {
            id: 'session_122',
            data: '2025-11-23',
            capitalInicial: 15000,
            capitalFinal: 15050,
            lucroTotal: 50,
            totalOperacoes: 10,
            wins: 7,
            losses: 3
        },
        // ... sessões anteriores
    ],
    
    // Metas e Objetivos
    metas: {
        diaria: 50,
        semanal: 250,
        mensal: 1000
    },
    
    // Modo de Operação
    modoAtual: 'normal', // 'normal' | 'recovery' | 'conservative'
    modoGuiado: false,
    etapaAtual: 0
};
```

### StateManager (Gerenciador de Estado)

```javascript
class StateManager {
    constructor(initialState) {
        this.state = initialState;
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 50;
    }

    /**
     * Atualiza estado e notifica listeners
     */
    update(path, value) {
        const oldValue = this.get(path);
        
        // Salva no histórico
        this._saveToHistory(path, oldValue, value);
        
        // Atualiza estado
        this._set(path, value);
        
        // Notifica listeners
        this._notify(path, value, oldValue);
    }

    /**
     * Registra listener para mudanças
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Desfaz última mudança
     */
    undo() {
        const last = this.history.pop();
        if (last) {
            this._set(last.path, last.oldValue);
            this._notify(last.path, last.oldValue, last.value);
        }
    }
}
```

---

## 🔄 Ciclo de Vida de uma Operação

### Exemplo Completo: Registrar WIN

#### 1. Ação do Usuário
```javascript
// User clica no botão "Win" na linha 5 da tabela
<button onclick="registrarResultado(5, true)">✓ Win</button>
```

#### 2. UI Layer (Facade)
```javascript
// ui.js
function registrarResultado(index, isWin) {
    console.log(`📊 Registrando ${isWin ? 'WIN' : 'LOSS'} na etapa ${index}`);
    
    // Delega para logic layer
    logic.registrarOperacao(index, isWin);
}
```

#### 3. Logic Layer (Business Rules)
```javascript
// logic.js
function registrarOperacao(index, isWin) {
    // Validações
    if (index < 0 || index >= state.planoDeOperacoes.length) {
        throw new Error('Índice inválido');
    }

    const etapa = state.planoDeOperacoes[index];
    
    // Calcula valores
    const valor = isWin ? etapa.meta : etapa.stopLoss;
    const novoCapital = state.capitalAtual + valor;
    
    // Atualiza estado via StateManager
    stateManager.update('capitalAtual', novoCapital);
    stateManager.update('lucroAtual', state.lucroAtual + valor);
    
    // Marca etapa como concluída
    stateManager.update(`planoDeOperacoes.${index}.concluida`, true);
    stateManager.update(`planoDeOperacoes.${index}.resultado`, isWin ? 'win' : 'loss');
    
    // Adiciona ao histórico
    const operacao = {
        isWin,
        valor,
        timestamp: new Date().toISOString(),
        tag: config.tagAtiva,
        capitalAntes: state.capitalAtual - valor,
        capitalDepois: novoCapital,
        etapa: index
    };
    
    stateManager.update('historicoCombinado', [
        ...state.historicoCombinado,
        operacao
    ]);
    
    // Verifica stops
    verificarStops(novoCapital);
    
    // Persiste no banco
    dbManager.updateSession(state.sessaoAtual);
}
```

#### 4. State Layer (Dispara Eventos)
```javascript
// StateManager.js
_notify(path, value, oldValue) {
    // Evento específico
    this._emit(`stateChange:${path}`, { value, oldValue });
    
    // Evento geral
    this._emit('stateChange', { path, value, oldValue });
}
```

#### 5. Event System (Propaga Mudanças)
```javascript
// Listeners registrados na inicialização
stateManager.on('stateChange:capitalAtual', ({ value, oldValue }) => {
    console.log(`💰 Capital: ${oldValue} → ${value}`);
    components.dashboard.updateCapital(value);
});

stateManager.on('stateChange:planoDeOperacoes', ({ value }) => {
    components.tabela.render(value);
    components.plano.atualizarVisualPlano();
});

stateManager.on('stateChange:historicoCombinado', ({ value }) => {
    components.timeline.render(value);
    components.dashboard.updateCharts();
});
```

#### 6. UI Update (Componentes Re-renderizam)
```javascript
// DashboardUI.js
class DashboardUI extends BaseUI {
    updateCapital(novoCapital) {
        const elemento = dom.capitalAtual;
        if (elemento) {
            elemento.textContent = this.formatarMoeda(novoCapital);
            this._addClass(elemento, 'updated');
        }
    }
}

// TabelaUI.js
class TabelaUI extends BaseUI {
    render(plano) {
        plano.forEach((etapa, index) => {
            const tr = dom.tabelaBody.children[index];
            if (etapa.concluida) {
                this._addClass(tr, 'linha-concluida');
                this._removeClass(tr, 'proxima-etapa');
            }
        });
    }
}

// TimelineUI.js
class TimelineUI extends BaseUI {
    render(historico) {
        const ultimaOperacao = historico[historico.length - 1];
        const item = this._createTimelineItem(ultimaOperacao);
        dom.timelineContainer.prepend(item);
    }
}
```

#### 7. Persistence Layer (Salva no DB)
```javascript
// dbManager.js
async updateSession(sessao) {
    const db = await this.openDB();
    const tx = db.transaction('sessoes', 'readwrite');
    const store = tx.objectStore('sessoes');
    
    await store.put({
        ...sessao,
        ultimaAtualizacao: Date.now(),
        capitalAtual: state.capitalAtual,
        historico: state.historicoCombinado
    });
    
    console.log('💾 Sessão salva no IndexedDB');
}
```

---

## 🔁 Bidirectional Sync

### UI → State (User Input)

```javascript
// Exemplo: Usuário altera capital inicial
dom.capitalInicial.addEventListener('input', (e) => {
    const novoValor = parseFloat(e.target.value);
    
    // Validação
    if (isNaN(novoValor) || novoValor <= 0) {
        mostrarErro('Capital inválido');
        return;
    }
    
    // Atualiza estado
    stateManager.update('capitalInicial', novoValor);
    stateManager.update('capitalAtual', novoValor);
    
    // Recalcula plano
    logic.recalcularPlano();
});
```

### State → UI (State Change)

```javascript
// Listener sincroniza UI com estado
stateManager.on('stateChange:capitalInicial', ({ value }) => {
    // Atualiza input
    if (dom.capitalInicial.value !== value.toString()) {
        dom.capitalInicial.value = value;
    }
    
    // Atualiza displays
    components.dashboard.updateCapitalInicial(value);
    
    // Atualiza gráficos
    components.dashboard.updateCharts();
});
```

### Evitando Loops Infinitos

```javascript
class SmartSync {
    constructor() {
        this.updating = false;
    }

    syncUIToState(element, path, transformer = (v) => v) {
        if (this.updating) return;
        
        this.updating = true;
        const value = transformer(element.value);
        stateManager.update(path, value);
        this.updating = false;
    }

    syncStateToUI(path, element, formatter = (v) => v) {
        if (this.updating) return;
        
        stateManager.on(`stateChange:${path}`, ({ value }) => {
            if (!this.updating) {
                this.updating = true;
                element.value = formatter(value);
                this.updating = false;
            }
        });
    }
}
```

---

## 📡 Event System

### Eventos Disponíveis

| Evento | Disparado Quando | Payload |
|--------|------------------|---------|
| `stateChange` | Qualquer mudança de estado | `{ path, value, oldValue }` |
| `stateChange:capitalAtual` | Capital muda | `{ value, oldValue }` |
| `stateChange:planoDeOperacoes` | Plano atualizado | `{ value }` |
| `stateChange:historicoCombinado` | Nova operação | `{ value }` |
| `sessaoIniciada` | Nova sessão criada | `{ sessao }` |
| `sessaoFinalizada` | Sessão encerrada | `{ sessao, resultado }` |
| `stopLossAtingido` | Stop loss ativado | `{ capital, perda }` |
| `stopWinAtingido` | Stop win ativado | `{ capital, lucro }` |
| `metaAlcancada` | Meta diária alcançada | `{ meta, lucro }` |

### Como Usar Eventos

```javascript
// Registrar listener
stateManager.on('stopWinAtingido', ({ capital, lucro }) => {
    ui.mostrarNotificacao(
        `🎉 Stop Win atingido! Lucro: ${formatarMoeda(lucro)}`,
        'success'
    );
    
    // Finalizar sessão automaticamente
    logic.finalizarSessao();
});

// Deregistrar listener
const listener = (data) => console.log(data);
stateManager.on('stateChange', listener);
stateManager.off('stateChange', listener);

// Emitir evento customizado
stateManager.emit('eventoCustomizado', { dados: 'exemplo' });
```

---

## 🎨 Patterns Utilizados

### 1. Observer Pattern (Pub/Sub)

```javascript
// Publisher (StateManager)
class StateManager {
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }
}

// Subscribers (UI Components)
stateManager.on('stateChange:plano', (data) => {
    components.tabela.render(data.value);
});
```

###2. Facade Pattern

```javascript
// ui.js atua como facade
const ui = {
    registrarWin(index) {
        return logic.registrarOperacao(index, true);
    },
    
    renderizarTudo() {
        components.tabela.render();
        components.timeline.render();
        components.dashboard.update();
    }
};
```

### 3. Command Pattern

```javascript
class OperacaoCommand {
    constructor(index, isWin) {
        this.index = index;
        this.isWin = isWin;
        this.previousState = null;
    }

    execute() {
        this.previousState = { ...state };
        logic.registrarOperacao(this.index, this.isWin);
    }

    undo() {
        Object.assign(state, this.previousState);
        ui.renderizarTudo();
    }
}
```

### 4. Mediator Pattern

```javascript
// StateManager atua como mediator
class StateManager {
    update(path, value) {
        this._set(path, value);
        
        // Coordena atualizações entre componentes
        if (path.startsWith('capital')) {
            this._notifyCapitalChange();
        }
        if (path.includes('plano')) {
            this._notifyPlanoChange();
        }
    }
}
```

---

## 📊 Diagrama de Sequência

### Fluxo Completo: Registrar Operação

```
User            UI              Logic           State           DB              Events
 │               │                │               │              │                │
 │─Click Win─────>│                │               │              │                │
 │               │                │               │              │                │
 │               │─registrar──────>│               │              │                │
 │               │                │               │              │                │
 │               │                │─validate──────>│              │                │
 │               │                │               │              │                │
 │               │                │─update────────>│              │                │
 │               │                │               │              │                │
 │               │                │               │─emit─────────┼───────────────>│
 │               │                │               │              │                │
 │               │                │               │─save─────────>│                │
 │               │                │               │              │                │
 │               │<─────────────────────────────────notify────────┼───────────────│
 │               │                │               │              │                │
 │               │─render─────────┐               │              │                │
 │<──Updated─────│                │               │              │                │
```

---

## 🔗 Referências

- [ARQUITETURA_MODULAR.md](./ARQUITETURA_MODULAR.md)
- [COMO_ADICIONAR_COMPONENTE.md](./COMO_ADICIONAR_COMPONENTE.md)
- [state.js](../state.js)
- [logic.js](../logic.js)

---

**Última atualização:** 24/11/2025  
**Próxima revisão:** 25/11/2025
