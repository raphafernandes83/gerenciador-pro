# 🔍 PROMPT INVESTIGATIVO - PAINEL PARÂMETROS E CONTROLES

## 🎯 **PROBLEMA IDENTIFICADO**

O painel "Parâmetros e Controles" não está sincronizando com o card "Progresso de Metas" nem com outras partes do aplicativo quando os valores são editados.

## 📋 **INVESTIGAÇÃO NECESSÁRIA**

### **1. FLUXO DE DADOS - MAPEAMENTO COMPLETO**
- Como os valores são capturados dos inputs do painel
- Onde esses valores são armazenados (`window.config`, `localStorage`, etc.)
- Como o card de progresso lê esses valores
- Quando e como a sincronização deveria acontecer

### **2. PONTOS DE VERIFICAÇÃO CRÍTICOS**

#### **🎛️ Captura de Dados (Input → Storage)**
- Event listeners nos inputs (blur, change, input)
- Funções de validação e conversão de tipos
- Armazenamento em `window.config` ou similar
- Persistência em `localStorage` ou `sessionStorage`

#### **🔄 Sincronização (Storage → Card)**
- Triggers de atualização do card
- Observadores de mudanças de configuração
- Funções de refresh/reload do card
- Debouncing ou throttling de atualizações

#### **📊 Renderização (Card Display)**
- Como o card lê os valores de configuração
- Cache de valores antigos
- Problemas de timing (async/await)
- Conflitos entre múltiplas fontes de dados

### **3. ARQUIVOS A INVESTIGAR**

#### **📍 Painel de Parâmetros**
- `src/ui/templates/ParametersCardTemplate.js` - Template HTML
- `main.js` ou `app.js` - Event listeners principais
- `ui.js` - Manipulação da interface
- `config.js` - Gerenciamento de configuração

#### **📍 Card de Progresso**
- `progress-card/ui/updater.js` - Atualização do card
- `progress-card/business/calculator.js` - Cálculos baseados em config
- `progress-card/utils/state-synchronizer.js` - Sincronização de estado
- `charts.js` - Atualização de gráficos

#### **📍 Gerenciamento de Estado**
- `logic.js` - Lógica principal de negócio
- `dom.js` - Mapeamento de elementos DOM
- `state.js` - Gerenciamento de estado global

### **4. CENÁRIOS DE TESTE**

#### **🧪 Teste 1: Captura de Input**
- Alterar valor no input
- Verificar se `window.config` é atualizado
- Verificar se localStorage é persistido
- Verificar console para erros

#### **🧪 Teste 2: Propagação de Mudanças**
- Forçar mudança em `window.config`
- Verificar se card é atualizado automaticamente
- Testar chamada manual de atualização
- Verificar dependências circulares

#### **🧪 Teste 3: Timing e Async**
- Verificar se há problemas de timing
- Testar com delays artificiais
- Verificar promises não resolvidas
- Analisar ordem de execução

### **5. POSSÍVEIS CAUSAS**

#### **🚨 Event Listeners**
- Event listeners não registrados
- Elementos DOM não encontrados
- IDs ou seletores incorretos
- Conflitos entre múltiplos listeners

#### **🚨 Armazenamento**
- `window.config` não sendo atualizado
- Problemas de serialização/deserialização
- Conflitos entre localStorage e memória
- Validação bloqueando atualizações

#### **🚨 Sincronização**
- Card não observa mudanças de configuração
- Falta de triggers de atualização
- Cache desatualizado
- Problemas de debouncing excessivo

#### **🚨 Tipos de Dados**
- Conversão string/number incorreta
- Validação muito restritiva
- Formatação incompatível
- Fallbacks sempre sendo usados

### **6. FERRAMENTAS DE DIAGNÓSTICO**

#### **🔍 Console Debugging**
```javascript
// Verificar configuração atual
console.log('Config atual:', window.config);

// Verificar elementos DOM
console.log('Inputs encontrados:', document.querySelectorAll('[id*="capital"], [id*="stop"], [id*="percentual"]'));

// Verificar event listeners
getEventListeners(document.getElementById('capital-inicial'));

// Verificar localStorage
console.log('LocalStorage:', localStorage.getItem('config'));
```

#### **🔍 Monitoramento de Mudanças**
```javascript
// Observer para window.config
const originalConfig = window.config;
Object.defineProperty(window, 'config', {
    get: () => originalConfig,
    set: (newValue) => {
        console.log('Config alterado:', newValue);
        originalConfig = newValue;
    }
});
```

### **7. ESTRATÉGIA DE INVESTIGAÇÃO**

#### **Fase 1: Mapeamento**
1. Identificar todos os inputs do painel
2. Rastrear event listeners registrados
3. Mapear fluxo de dados completo
4. Documentar pontos de falha

#### **Fase 2: Teste Isolado**
1. Testar cada input individualmente
2. Verificar captura de valores
3. Testar armazenamento
4. Validar propagação

#### **Fase 3: Integração**
1. Testar fluxo completo
2. Identificar gargalos
3. Verificar timing
4. Corrigir problemas encontrados

## 🎯 **RESULTADO ESPERADO**

### **✅ Diagnóstico Completo**
- Identificação precisa da causa raiz
- Mapeamento completo do fluxo de dados
- Lista de problemas específicos
- Estratégia de correção detalhada

### **✅ Correção Implementada**
- Event listeners funcionando
- Sincronização automática
- Validação adequada
- Persistência correta

### **✅ Validação Final**
- Inputs atualizando configuração
- Card refletindo mudanças imediatamente
- Persistência entre sessões
- Sem erros no console

---

**🔍 Investigação estruturada para identificar e corrigir o problema de sincronização entre o painel de parâmetros e o card de progresso.**




