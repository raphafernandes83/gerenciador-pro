# ARQUIVOS DE TESTE ENCONTRADOS

## 📊 RESUMO
- **Total de arquivos de teste**: ~80 arquivos
- **Categorias principais**: Testes de restauração, validação, debug, cores, gráficos
- **Pasta dedicada**: `tests/` (19 arquivos)

## 🗂️ CATEGORIAS DE ARQUIVOS DE TESTE

### 🔄 **TESTES DE RESTAURAÇÃO DE SESSÃO** (Criados recentemente)
- `teste-restauracao-limpo.js` ✨ (Novo - versão limpa)
- `teste-restauracao-otimizado.js`
- `teste-restauracao-sessao-direto.js`
- `teste-restauracao-rapido.js`
- `carregar-teste-restauracao.js`
- `test-session-restore.js` (Original que causou o problema)

### 🎨 **TESTES DE CORES E VISUAL**
- `teste-timing-cores.js`
- `teste-cores-simples.js`
- `teste-cores-app-principal.js`
- `teste-acertos-erros-grafico.js`
- `teste-grafico-rosca.js`

### 🐛 **TESTES DE DEBUG E CORREÇÃO**
- `debug-painel-minimizar.js`
- `debug-real-usage.js`
- `debug-operacao.js`
- `test-progress-card-debug.js`
- `test-real-app-debug.js`
- `test-progress-debug.js`
- `test-historico-visual-debug.js`

### ⚠️ **TESTES DE ERROS E PROBLEMAS**
- `test-ultra-erros-console-logs.js` 🔥 (Arquivo aberto - causador de spam)
- `test-ultra-erros-correcao-nan.js`
- `test-resultado-zerado-automatizado.js`
- `test-recursion-simple.js`

### 🏗️ **TESTES DE VALIDAÇÃO E SISTEMA**
- `teste-validacao-final.js`
- `teste-validacao-timeline-final.js`
- `teste-validacao-correcoes-ultra.js`
- `teste-sistema-completo.js`
- `teste-automatico-timeline.js`

### 📋 **TESTES ESPECÍFICOS DE COMPONENTES**
- `teste-card-funcionamento.js`
- `teste-painel-minimizar.js`
- `teste-correcao-parametros-controles.js`
- `teste-remocao-campos-percentuais.js`
- `teste-correcao-stop-win.js`
- `test-card-functions-analysis.js`
- `test-card-info-fix.js`

### 📁 **PASTA TESTS/ (Testes Organizados)**
- `test-capital-sync.js`
- `test-stoploss-sync.js`
- `test-stoploss-display.js`
- `test-stopwin-display.js`
- `test-stopwin-sync.js`
- `test-sidebar-new-session-btn.js`
- `test-suites.js`
- `test-runner.js`
- `test-loader.js`
- `test-dom-recursion.js`
- `run-manual-tests.js`
- `add-functional-test-button.js`
- `functional-validation.js`
- `performance-benchmark.js`
- `run-complete-validation.js`
- `system-health-validator.js`

### 🔧 **TESTES DIVERSOS**
- `TESTE_RAPIDO.js`
- `teste-direto-console.js`
- `teste-info-card-console.js`
- `teste-formatacao-moeda.js`
- `test-simple.js`
- `test-final-fix.js`
- `test-direct-fix.js`
- `executar-teste-direto.js`

## ⚠️ **ARQUIVOS PROBLEMÁTICOS IDENTIFICADOS**
1. `test-ultra-erros-console-logs.js` - **CAUSADOR DE SPAM** 🔥
2. `test-session-restore.js` - **ERRO INICIAL** (ReferenceError)
3. Vários arquivos de teste de "ultra erros" - **PODEM CAUSAR PROBLEMAS**

## 💡 **RECOMENDAÇÕES**

### ✅ **MANTER (Úteis)**
- Pasta `tests/` completa (testes organizados)
- `teste-restauracao-limpo.js` (versão nova e limpa)
- Testes de validação do sistema

### ❌ **PODE APAGAR (Problemáticos/Duplicados)**
- `test-ultra-erros-console-logs.js` ⚠️ **PRIORIDADE ALTA**
- `test-session-restore.js` (versão problemática)
- Arquivos de teste duplicados de restauração
- Testes de debug antigos
- Arquivos de "ultra erros"

### 🤔 **DECIDIR CASO A CASO**
- Testes específicos de componentes (se não estão mais sendo usados)
- Testes de cores (se o sistema já está funcionando)
- Arquivos de debug (se não são mais necessários)




