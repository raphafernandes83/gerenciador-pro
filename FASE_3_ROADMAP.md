# 🏗️ FASE 3 - Modularização Arquitetural

**Objetivo:** Organizar o código em módulos coesos e reutilizáveis

## 📋 ROADMAP

### CHECKPOINT 3.1 - Criar Estrutura de Módulos ⏳
**Objetivo:** Definir arquitetura modular base

**Tarefas:**
- [ ] Criar pasta `/src/modules/`
- [ ] Definir estrutura de módulos:
  - `SessionModule` - Gerenciamento de sessões
  - `OperationModule` - Lógica de operações
  - `StrategyModule` - Estratégias de trading
  - `CalculationModule` - Cálculos matemáticos
  - `UIModule` - Componentes de UI
- [ ] Criar interfaces/contratos entre módulos

### CHECKPOINT 3.2 - Migrar Lógica de Sessão ⏳
**Objetivo:** Extrair lógica de sessão do `logic.js`

**Tarefas:**
- [ ] Criar `SessionModule.js`
- [ ] Migrar:
  - `iniciarSessao()`
  - `finalizarSessao()`
  - `resetarSessao()`
- [ ] Integrar com StateManager
- [ ] Testes

### CHECKPOINT 3.3 - Migrar Lógica de Operações ⏳
**Objetivo:** Extrair lógica de operações

**Tarefas:**
- [ ] Criar `OperationModule.js`
- [ ] Migrar:
  - `registrarOperacao()`
  - `calcularValoresOperacao()`
  - Validações de operações
- [ ] Testes

### CHECKPOINT 3.4 - Consolidar Cá lculos ⏳
**Objetivo:** Centralizar cálculos matemáticos

**Tarefas:**
- [ ] Criar `CalculationModule.js`
- [ ] Migrar todas funções de cálculo:
  - `calcularExpectativaMatematica()`
  - `calcularDrawdown()`
  - `calcularSequencias()`
  - `calcularPayoffRatio()`
- [ ] Tornar funções puras (sem side-effects)
- [ ] Testes unitários

## ⏱️ Estimativa
- CHECKPOINT 3.1: 15 min
- CHECKPOINT 3.2: 20 min
- CHECKPOINT 3.3: 20 min  
- CHECKPOINT 3.4: 15 min

**Total:** ~70 minutos

## 🎯 Benefícios Esperados
- ✅ Código mais organizado
- ✅ Redução da complexidade do `logic.js`
- ✅ Melhor testabilidade
- ✅ Facilita manutenção futura
- ✅ Reutilização de código

## 📊 Status Atual
**Progresso:** 0/4 checkpoints (0%)
