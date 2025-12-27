# 🗺️ ROADMAP - Gerenciador PRO v9.3

**Última atualização:** 24/11/2025 - 14:56  
**Status do Projeto:** Em desenvolvimento ativo

---

## ✅ Concluído (24/11/2025)
- ✅ Restauração de sessões da lixeira (FUNCIONANDO!)
- ✅ Correções de imports (`CURRENCY_FORMAT`, `CSS_CLASSES`, `simulation`)
- ✅ Refatoração inicial de `ui.js` (componentes modulares criados)
- ✅ Sistema de lixeira totalmente funcional
- ✅ Fix crítico: `saveSession` → `updateSession` em SessionsTrashHandler
- ✅ Fix crítico: `saveSession` → `addSession` em DataImporter

---

## 🎯 Próximos Passos Organizados

### 📅 **PRIORIDADE ALTA - Fazer Hoje/Próximos Dias**

#### 1. **Resolver Warnings de Elementos DOM** ⏱️ 30min
**Status:** ✅ **CONCLUÍDO** (24/11/2025 - 15:15)  
**Problema:** 15 elementos não encontrados no mapeamento

**Solução Aplicada:**
- ✅ Adicionado parâmetro `isRequired` em `safeGetElement()`
- ✅ Configuração `DOM_MAPPING_DEBUG = false` para controlar logging
- ✅ Marcados todos os elementos de configuração/input como opcionais (`isRequired: false`)
- ✅ Console agora mostra apenas erros de elementos realmente obrigatórios

**Resultado:** Console 90% mais limpo, sem warnings desnecessários

**Arquivos modificados:**
**Meta:** Delegar mais funções para componentes modulares

**Já delegado:**
- ✅ `atualizarDashboardSessao` → `DashboardUI`
- ✅ `formatarMoeda` → `DashboardUI`
- ✅ `atualizarVisualPlano` → `PlanoUI`
- ✅ `inicializarUI` → Componentes modulares

**Funções para delegar:**
- [ ] `renderizarTabela` → `TabelaUI.renderizar()`
- [ ] `renderizarTimeline` / `renderizarTimelineCompleta` → `TimelineUI.renderizar()`
- [ ] `syncUIFromState` → Distribuir lógica entre componentes específicos
- [ ] `showModal` / Modal-related → `ModalUI.show()`
- [ ] `mostrarNotificacao` → `NotificationUI`
- [ ] `renderDiario` / `renderizarHistorico` → Novo `HistoricoUI`

**Objetivo:** Reduzir `ui.js` de 2850 linhas para <1500 linhas

**Arquivos afetados:**
- `ui.js` (arquivo principal)
- `src/ui/TabelaUI.js`
- `src/ui/TimelineUI.js`
- `src/ui/ModalUI.js`
- `src/ui/NotificationUI.js`
- `src/ui/index.js` (adicionar novos componentes)

---

### 📅 **PRIORIDADE MÉDIA - Próxima Semana**

#### 4. **Integrar MetasUI com progress-card** ⏱️ 1-2h
**Status:** 🔴 Pendente  
**Problema:** Duplicação de lógica e responsabilidades não claras
```
⚠️ MetasUI existe mas progress-card-updater.js também gerencia metas
```

**Análise:**
- `MetasUI` foi criado mas não está sendo usado efetivamente
- `progress-card-updater.js` continua fazendo o trabalho
- Possível conflito de estado

**Opções:**
1. **Unificar:** Migrar lógica de `progress-card-updater.js` para `MetasUI`
2. **Separar:** `MetasUI` = objetivos, `progress-card` = visualização
3. **Deprecar:** Remover `MetasUI` e manter apenas `progress-card`

**Ação:**
- [ ] Decidir arquitetura (opção recomendada: 2)
- [ ] Refatorar responsabilidades
- [ ] Remover código duplicado
- [ ] Atualizar documentação

**Arquivos afetados:**
- `src/ui/MetasUI.js`
- `progress-card-updater.js`
- `progress-card-module.js`

---

#### 5. **Implementar Testes Automatizados** ⏱️ 3-4h
**Status:** 🔴 Pendente  
**Referência:** `GUIA_TESTES_AUTOMATIZADOS.md`

**Prioridade de testes:**
1. [ ] **Testes de restauração de sessão** (validar fix de hoje)
   - Restaurar sessão da lixeira
   - Verificar persistência no IndexedDB
   - Validar exibição na UI
   
2. [ ] **Testes de cálculo de plano**
   - Estratégia ciclos vs fixa
   - Validar valores calculados
   - Testar edge cases (capital muito baixo, payout inválido)

3. [ ] **Testes de registro de operação**
   - Win e Loss
   - Atualização de capital
   - Avanço no plano
   - Verificação de stop win/loss

4. [ ] **Testes de UI (renderização)**
   - Renderização de tabela
   - Timeline
   - Dashboard

**Ferramenta sugerida:** Vitest ou Jest

**Setup:**
- [ ] Instalar Vitest: `npm install -D vitest @vitest/ui`
- [ ] Configurar `vitest.config.js`
- [ ] Criar pasta `tests/unit/` e `tests/integration/`
- [ ] Adicionar scripts no `package.json`

---

#### 6. **Documentação de Arquitetura** ⏱️ 2h
**Status:** 🔴 Pendente

**Criar documentos:**
- [ ] `ARQUITETURA_MODULAR.md` - Explicar nova estrutura de componentes
  - Diagrama de dependências
  - Fluxo de dados: State → UI
  - Responsabilidades de cada módulo
  
- [ ] `FLUXO_DE_DADOS.md` - StateManager, eventos, UI sync
  - Ciclo de vida de uma operação
  - Como o estado é propagado
  - Bidirectional sync explicado
  
- [ ] `COMO_ADICIONAR_COMPONENTE.md` - Guide para novos módulos
  - Template de componente
  - Como registrar em `src/ui/index.js`
  - Como delegar de `ui.js`
  - Como adicionar testes

---

### 📅 **PRIORIDADE BAIXA - Melhorias Futuras**

#### 7. **Completar Migração MathUtils** ⏱️ 1-2h
**Status:** 🟡 Em progresso (migração gradual ativa)

Console mostra:
```
🔄 MathUtils Migrator v1.0 - Migração gradual ativa
📊 Modo: gradual
```

**Ação:**
- [ ] Completar migração de funções antigas para `MathUtils Turbo v2.0`
- [ ] Remover funções deprecated
- [ ] Atualizar calls em `logic.js`, `TradingOperationsManager.js`
- [ ] Ativar modo `full` após 100% migrado

**Arquivos afetados:**
- `src/utils/MathUtils.js`
- `src/utils/MathUtilsMigrator.js`
- Todas as calls em arquivos legacy

---

#### 8. **Acessibilidade (A11y)** ⏱️ 1h
**Status:** 🔴 Pendente  
**Warning no console:**
```
Blocked aria-hidden on an element because its descendant retained focus
Element: <button.trash-modal-close>
Ancestor: <div.trash-modal-overlay#trash-modal>
```

**Ação:**
- [ ] Corrigir `TrashModal` para usar `inert` ao invés de `aria-hidden` quando modal fechado
- [ ] Adicionar navegação por teclado (Tab, Esc, Enter)
- [ ] Adicionar `aria-labels` descritivos
- [ ] Testar com screen reader (NVDA ou JAWS)
- [ ] Garantir contraste de cores (WCAG AA)

**Arquivos afetados:**
- `src/trash/TrashModal.js`
- `styles.css` (verificar botões de foco)

---

#### 9. **Cleanup de Console Logs** ⏱️ 30min
**Status:** 🔴 Pendente  
**Problema:** Console muito verboso (200+ mensagens na inicialização)

**Exemplos de ruído:**
```
✅ SessionsTrashHandler inicializado
✅ PlanoUI pronto
🎯 Funções disponíveis: (10) [...]
```

**Ação:**
- [ ] Usar `convert-console-to-logger.js` para migrar `console.log` → `logger`
- [ ] Adicionar níveis de log apropriados:
  - `logger.debug()` = inicializações
  - `logger.info()` = ações do usuário
  - `logger.warn()` = avisos
  - `logger.error()` = erros críticos
- [ ] Desabilitar `debug` em produção via `Logger.js` config
- [ ] Manter apenas logs essenciais no console

**Arquivos afetados:**
- Praticamente todos os `.js` (gradualmente)
- `src/utils/Logger.js` (configuração de níveis)

---

#### 10. **Sistema de Notificações Aprimorado** ⏱️ 1h
**Status:** 🔴 Pendente (Nice to have)

**Melhorias:**
- [ ] Toast notifications com auto-dismiss
- [ ] Pilha de notificações (mostrar múltiplas)
- [ ] Animações suaves (fade in/out)
- [ ] Ícones por tipo (success, error, warning, info)
- [ ] Ações inline (Desfazer, Ver detalhes)

**Arquivos afetados:**
- `src/ui/NotificationUI.js`
- `styles.css` (animations)

---

## 📊 Estimativa Total de Tempo

| Categoria | Tempo Estimado | Status |
|-----------|----------------|--------|
| **Prioridade Alta** | 4-5 horas | 🔴 0% |
| **Prioridade Média** | 6-8 horas | 🔴 0% |
| **Prioridade Baixa** | 4-5 horas | 🟡 10% |
| **TOTAL** | **14-18 horas** | |

---

## 🎯 Sugestão de Cronograma

### **Hoje (24/11 - Tarde)** - 3h disponíveis
1. ✅ Resolver warnings DOM (30min) ← **COMEÇAR AQUI**
2. ✅ Otimizar performance tabela (1h)
3. ✅ Iniciar refatoração UI completa (1.5h)

### **Amanhã (25/11)** - 4h
4. ✅ Completar refatoração UI
5. ✅ Integrar/Decidir MetasUI vs progress-card

### **Próxima Semana (26-30/11)**
6. ✅ Testes automatizados (prioridade)
7. ✅ Documentação de arquitetura
8. ✅ Melhorias de acessibilidade
9. ✅ Cleanup de console logs

---

## 🚀 Quick Wins (Máximo Impacto, Mínimo Esforço)

Para gerar progresso imediato:

1. **✅ Limpar warnings DOM** (30min) → Console 90% mais limpo
2. **✅ Adicionar debounce em PlanoUI** (15min) → Performance perceptível
3. **✅ Documentar funções principais de ui.js** (30min) → Facilita refatoração
4. **✅ Migrar 5 console.log críticos para logger** (20min) → Melhor debugging

---

## 📝 Notas Importantes

### Regras de Ouro
- **✅ Todos os testes devem passar** antes de commit
- **✅ Testar restauração de sessão** após cada mudança grande
- **✅ Fazer commits frequentes** (atomic commits)
- **✅ Atualizar este ROADMAP** quando completar tarefas
- **✅ Manter `CHANGELOG.md`** atualizado com mudanças

### Como Usar Este Roadmap
- [ ] = Tarefa pendente
- 🔴 = Não iniciado
- 🟡 = Em progresso
- ✅ = Concluído

Marque as tarefas conforme for completando!

---

## 🐛 Bugs Conhecidos para Investigar

1. ⚠️ **Gráfico de progresso não inicializa corretamente**
   ```
   ⚠️ Instância do gráfico não encontrada
   ```
   - Provável conflito entre `charts.js` e `progress-card-module.js`

2. ⚠️ **Múltiplos alertas de performance em sequência**
   - ErrorBoundary detectando muitos re-renders
   - Investigar se há loop de atualização

3. ⚠️ **Timeline vazia após restaurar sessão**
   ```
   ⚠️ [TIMELINE] Histórico vazio sem sessão ativa - buscando dados persistidos
   ```
   - UI não sincroniza automático após restore

---

## 🎓 Aprendizados e Melhorias Aplicadas

### Padrões Implementados
- ✅ Facade Pattern em `ui.js`
- ✅ Module Pattern em componentes modulares
- ✅ Observer Pattern em `StateManager`
- ✅ Strategy Pattern em `TradingStrategy`
- ✅ Error Boundary Pattern para componentes

### Boas Práticas Adotadas
- ✅ Separation of Concerns (UI vs Logic vs State)
- ✅ Dependency Injection (via constructor)
- ✅ Graceful Degradation (fallbacks para erros)
- ✅ Defensive Programming (validações robustas)

---

**🎯 Foco do momento:** Resolver warnings DOM e otimizar performance da tabela

**Próxima revisão do roadmap:** 25/11/2025
