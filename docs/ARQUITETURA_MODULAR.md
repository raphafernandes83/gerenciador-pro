# 🏗️ ARQUITETURA MODULAR - Gerenciador PRO

**Data:** 24/11/2025  
**Autor:** Sistema de Refatoração  
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura Atual](#estrutura-atual)
3. [Arquitetura Modular Planejada](#arquitetura-modular-planejada)
4. [Componentes Implementados](#componentes-implementados)
5. [Plano de Migração](#plano-de-migração)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Convenções e Padrões](#convenções-e-padrões)

---

## 🎯 Visão Geral

### Objetivo da Refatoração

Transformar o monolito `ui.js` (2926 linhas) em uma arquitetura modular com componentes especializados, cada um responsável por uma área específica da UI.

**Meta:** Reduzir `ui.js` de **2926 linhas → <1500 linhas** (retenção de 50%)

### Benefícios Esperados

✅ **Manutenibilidade:** Código mais fácil de entender e modificar  
✅ **Testabilidade:** Componentes isolados são mais fáceis de testar  
✅ **Reusabilidade:** Componentes podem ser reutilizados  
✅ **Performance:** Carregamento lazy de componentes sob demanda  
✅ **Colaboração:** Múltiplos desenvolvedores podem trabalhar em paralelo

---

## 📊 Estrutura Atual

### ui.js Monolítico (2926 linhas)

```
ui.js
├── domHelper (linhas 38-77)
│   ├── addClass()
│   ├── removeClass()
│   ├── toggleClass()
│   └── hasClass()
│
├── Objeto ui (linhas 80-2808)
│   ├── Performance & Initialization (~400 linhas)
│   │   ├── _initMappingManager()
│   │   ├── initPerformanceOptimizations()
│   │   ├── _preWarmDOMCache()
│   │   └── _setupPerformanceMonitoring()
│   │
│   ├── Formatação (~200 linhas)
│   │   ├── formatarMoeda()
│   │   ├── _formatarMoedaInternal()
│   │   └── formatarPercent()
│   │
│   ├── Renderização de Plano (~300 linhas)
│   │   ├── renderizarTabela()
│   │   ├── atualizarVisualPlano() [DELEGADO → PlanoUI]
│   │   └── renderizarPlanoEmChunks()
│   │
│   ├── Dashboard (~200 linhas)
│   │   ├── atualizarDashboardSessao() [DELEGADO → DashboardUI]
│   │   ├── atualizarStatusIndicadores()
│   │   └── updateProgressChartsUI()
│   │
│   ├── Timeline (~250 linhas)
│   │   ├── renderizarTimeline()
│   │   ├── renderizarTimelineCompleta()
│   │   └── _createTimelineItem()
│   │
│   ├── Modals (~300 linhas)
│   │   ├── showModal()
│   │   ├── mostrarModalConfig()
│   │   └── mostrarConfiguracoes()
│   │
│   ├── Notificações (~150 linhas)
│   │   ├── mostrarNotificacao()
│   │   └── _showToast()
│   │
│   ├── Sessões & Histórico (~200 linhas)
│   │   ├── renderDiario()
│   │   ├── renderizarHistorico() [✅ ADICIONADO]
│   │   └── carregarSessaoNoHistorico()
│   │
│   ├── Utility Functions (~400 linhas)
│   │   ├── debounce()
│   │   ├── syncUIFromState()
│   │   └── atualizarTudo()
│   │
│   └── Settings & Config (~300 linhas)
│       ├── renderTemasTab()
│       ├── renderPreferenciasTab()
│       └── updateTraderNameDisplay()
│
└── testUIComponents() (linhas 2814-2916)
```

---

## 🏛️ Arquitetura Modular Planejada

### Nova Estrutura de Pastas

```
src/ui/
├── index.js                    # Barrel export & initialization
├── BaseUI.js                   # Classe base para componentes ✅
│
├── DashboardUI.js              # Dashboard & metrics ✅
├── PlanoUI.js                  # Plano de operações ✅
├── TabelaUI.js                 # Tabela de plano [TODO]
├── TimelineUI.js               # Timeline de operações [TODO]
├── ModalUI.js                  # Sistema de modals [TODO]
├── NotificationUI.js           # Toast & notifications [TODO]
├── MetasUI.js                  # Metas & objetivos ✅
├── HistoricoUI.js              # Histórico de sessões [TODO]
│
├── helpers/
│   ├── DOMHelper.js            # Utilities de DOM
│   ├── FormatterHelper.js      # Formatação (moeda, %)
│   └── ValidationHelper.js     # Validação de inputs
│
└── UIServicesFacade.js         # Facade para serviços ✅
```

---

## ✅ Componentes Implementados

### 1. BaseUI (src/ui/BaseUI.js)

**Status:** ✅ Implementado  
**Responsabilidade:** Classe base abstrata para todos os componentes UI

**Métodos públicos:**
- `init()` - Inicialização do componente
- `destroy()` - Limpeza e desmontagem
- `render()` - Renderização (abstract)

**Métodos protegidos (prefixo `_`):**
- `_addClass(element, ...classes)`
- `_removeClass(element, ...classes)`  
- `_toggleClass(element, classe, force)`
- `_safeQuerySelector(selector)`

**Exemplo de uso:**
```javascript
import { BaseUI } from './BaseUI.js';

export class MinhaUI extends BaseUI {
    init() {
        super.init();
        // Inicialização específica
    }
    
    render() {
        // Lógica de renderização
    }
}
```

---

### 2. DashboardUI (src/ui/DashboardUI.js)

**Status:** ✅ Implementado  
**Responsabilidade:** Gerenciar dashboard, métricas e indicadores

**Funções delegadas:**
- `atualizarDashboardSessao()`
- `formatarMoeda(valor)`
- `atualizarStatusIndicadores()`

**Componentes gerenciados:**
- Capital atual
- Lucro/Prejuízo
- Progress bars
- Indicadores de risco

---

### 3. PlanoUI (src/ui/PlanoUI.js)

**Status:** ✅ Implementado & Otimizado  
**Responsabilidade:** Gerenciar visualização do plano de operações

**Funções delegadas:**
- `atualizarVisualPlano()`

**Otimizações aplicadas:**
- ✅ Batch operations (140 → 30 mutações)
- ✅ requestAnimationFrame
- ✅ Cache de variáveis de estado
- ✅ Verificação condicional de classes

**Performance:**
- Antes: ~140 mutações DOM
- Depois: ~30 mutações DOM (78% redução)

---

### 4. MetasUI (src/ui/MetasUI.js)

**Status:** ✅ Criado (não integrado)  
**Responsabilidade:** Gerenciar metas e objetivos

**⚠️ Conflito Atual:**
- `MetasUI.js` existe mas não está sendo usado
- `progress-card-updater.js` faz o mesmo trabalho
- **Ação necessária:** Decidir arquitetura (ver Tarefa #4)

---

## 📋 Plano de Migração

### Fase 1: Componentes de Renderização (PRÓXIMO)

#### TabelaUI.js [PRIORIDADE 1]
**Impacto:** Alto (150 linhas)  
**Complexidade:** Média

**Funções a migrar:**
- `renderizarTabela()`
- `renderizarPlanoEmChunks()`
- `_criarLinha()`

**Dependências:**
- `state.planoDeOperacoes`
- `config.zenMode`
- `dom.tabelaBody`

**Plano:**
1. Criar `src/ui/TabelaUI.js` extendendo `BaseUI`
2. Migrar `renderizarTabela()` e lógica relacionada
3. Otimizar com DocumentFragment (aprendizado da Tarefa #2)
4. Adicionar em `src/ui/index.js`
5. Delegar de `ui.js` → `components.tabela.renderizar()`

---

#### TimelineUI.js [PRIORIDADE 2]
**Impacto:** Alto (250 linhas)  
**Complexidade:** Média

**Funções a migrar:**
- `renderizarTimeline(historico)`
- `renderizarTimelineCompleta(historico, container)`
- `_createTimelineItem(operacao)`
- `_formatTimestamp(timestamp)`

**Dependências:**
- `state.historicoCombinado`
- `dom.timelineContainer`
- `formatarMoeda()` (já delegado)

**Plano:**
1. Criar `src/ui/TimelineUI.js`
2. Migrar todas as funções relacionadas a timeline
3. Implementar virtual scrolling para timelines longas
4. Adicionar cache de items renderizados

---

### Fase 2: Componentes de Interação

#### ModalUI.js [PRIORIDADE 3]
**Impacto:** Médio (300 linhas)  
**Complexidade:** Alta (muitas variações)

**Funções a migrar:**
- `showModal(tipo, dados)`
- `hideModal()`
- `mostrarModalConfig()`
- `mostrarConfiguracoes()`
- `renderTemasTab()`
- `renderPreferenciasTab()`

**Desafios:**
- Sistema de modals variados (config, confirmação, etc.)
- State management de modals
- Escape key handling

---

#### NotificationUI.js [PRIORIDADE 4]
**Impacto:** Baixo (150 linhas)  
**Complexidade:** Baixa

**Funções a migrar:**
- `mostrarNotificacao(mensagem, tipo)`
- `_showToast(config)`
- Sistema de queue de notificações

**Melhorias planejadas:**
- Toast com auto-dismiss
- Pilha de notificações
- Animações suaves

---

### Fase 3: Componentes de Dados

#### HistoricoUI.js [PRIORIDADE 5]
**Impacto:** Médio (200 linhas)  
**Complexidade:** Média

**Funções a migrar:**
- `renderDiario()`
- `renderizarHistorico()` (alias)
- `carregarSessaoNoHistorico(sessaoId)`
- Filtros e busca de histórico

---

## 🔄 Fluxo de Dados

### Arquitetura Atual (Monolítica)

```
User Action → ui.js → State → ui.js → DOM
                ↓
         (tudo em 1 arquivo)
```

### Arquitetura Modular (Planejada)

```
User Action
    ↓
ui.js (Facade)
    ↓
components.{componente}.{metodo}()
    ↓
State (via StateManager)
    ↓
Eventos (StateChange)
    ↓
components.{componente}.render()
    ↓
DOM
```

### Exemplo de Fluxo Completo

**Cenário:** Usuário clica em "Win" na tabela

```
1. Click Event (DOM)
   ↓
2. ui.registrarWin(index) [Facade]
   ↓
3. stateManager.registrarOperacao({ isWin: true })
   ↓
4. State atualizado
   ↓
5. Event: 'stateChange:operacao'
   ↓
6. components.tabela.render() [TabelaUI]
7. components.timeline.addItem() [TimelineUI]
8. components.dashboard.update() [DashboardUI]
   ↓
9. DOM Updated
```

---

## 📐 Convenções e Padrões

### Nomenclatura de Arquivos

- **PascalCase** para componentes: `TabelaUI.js`, `DashboardUI.js`
- **camelCase** para helpers: `domHelper.js`, `formatterHelper.js`
- **kebab-case** para docs: `arquitetura-modular.md`

### Estrutura de Componente

```javascript
/**
 * @fileoverview [Descrição do componente]
 * @module [NomeUI]
 * @version 1.0.0
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../state.js';
import { dom } from '../dom.js';

export class NomeUI extends BaseUI {
    constructor() {
        super();
        this.nomeDoComponente = 'Nome';
    }

    init() {
        super.init();
        // Inicialização específica
        this._setupEventListeners();
    }

    render(data) {
        // Lógica de renderização
    }

    _setupEventListeners() {
        // Setup privado
    }

    destroy() {
        // Limpeza
        super.destroy();
    }
}
```

### Padrões de Exportação

**index.js (Barrel Export):**
```javascript
import { BaseUI } from './BaseUI.js';
import { DashboardUI } from './DashboardUI.js';
import { PlanoUI } from './PlanoUI.js';
// ... outros imports

export function inicializarUI() {
    const components = {
        dashboard: new DashboardUI(),
        plano: new PlanoUI(),
        // ...
    };

    Object.values(components).forEach(c => c.init());
    return components;
}

export {
    BaseUI,
    DashboardUI,
    PlanoUI,
    // ...
};
```

---

## 🎯 Métricas de Sucesso

### KPIs da Refatoração

| Métrica | Antes | Meta | Atual |
|---------|-------|------|-------|
| **Linhas em ui.js** | 2926 | <1500 | 2926 |
| **Componentes criados** | 0 | 8 | 4 |
| **Funções delegadas** | 0 | 20+ | 5 |
| **Performance (renderização)** | 185ms | <100ms | ~50ms ✅ |
| **Mutações DOM** | 473 | <100 | ~50 ✅ |
| **Cobertura de testes** | 0% | 60%+ | 0% |

---

## 📚 Próximos Passos

### Imediato (Hoje)
1. ✅ Criar TabelaUI.js
2. ✅ Delegar renderizarTabela()
3. ✅ Testar integração

### Curto Prazo (Esta Semana)
4. ✅ Criar TimelineUI.js
5. ✅ Criar ModalUI.js
6. ✅ Criar NotificationUI.js

### Médio Prazo (Próxima Semana)
7. ✅ Resolver conflito MetasUI vs progress-card
8. ✅ Criar HistoricoUI.js
9. ✅ Implementar testes unitários
10. ✅ Documentar todos os componentes

---

## 🔗 Referências

- [BaseUI.js](../src/ui/BaseUI.js)
- [DashboardUI.js](../src/ui/DashboardUI.js)
- [PlanoUI.js](../src/ui/PlanoUI.js)
- [ROADMAP.md](../ROADMAP.md)
- [FLUXO_DE_DADOS.md](./FLUXO_DE_DADOS.md) (TODO)
- [COMO_ADICIONAR_COMPONENTE.md](./COMO_ADICIONAR_COMPONENTE.md) (TODO)

---

**Última atualização:** 24/11/2025 17:25  
**Próxima revisão:** 25/11/2025
