# 🗑️ PROMPT PARA REMOÇÃO DE CAMPOS PERCENTUAIS

## 🎯 **OBJETIVO**
Remover campos específicos do card de progresso de metas conforme indicado pelos círculos vermelhos na imagem.

## 📋 **CAMPOS A SEREM REMOVIDOS**

### **🔴 Seção Performance**
- **Linha 1**: `Meta` (valor percentual - ex: 10.0%)
- **Linha 2**: `Meta Atual` (valor percentual - ex: 34.8%)

### **🔴 Seção Risco**
- **Linha 1**: `Limite (%)` (valor percentual - ex: 15.0%)
- **Linha 2**: `Loss Atual` (valor percentual - ex: 0.0%)

## 🔍 **ARQUIVOS A INVESTIGAR**

### **📍 Locais Prováveis dos Campos**
1. **`index.html`** - Template HTML do card
2. **`progress-card/ui/renderer.js`** - Renderização da UI
3. **`progress-card/ui/updater.js`** - Atualização dos valores
4. **`charts.js`** - Possível atualização de elementos
5. **`ui.js`** - Manipulação da interface

### **🎯 Elementos HTML a Localizar**
```html
<!-- Performance -->
<li class="metric-row"><span class="metric-label">Meta</span><span class="metric-value" id="meta-target-percent">10.0%</span></li>
<li class="metric-row"><span class="metric-label">Meta Atual</span><span class="metric-value" id="meta-current-percent">34.8%</span></li>

<!-- Risco -->
<li class="metric-row"><span class="metric-label">Limite (%)</span><span class="metric-value" id="loss-limit-percent">15.0%</span></li>
<li class="metric-row"><span class="metric-label">Loss Atual</span><span class="metric-value" id="loss-current-percent">0.0%</span></li>
```

## 📝 **ESTRATÉGIA DE REMOÇÃO**

### **Etapa 1: Identificação**
- Localizar exatamente onde esses elementos estão definidos
- Verificar IDs e classes CSS utilizados
- Mapear dependências JavaScript

### **Etapa 2: Remoção Segura**
- Remover elementos HTML do template
- Remover código JavaScript que atualiza esses campos
- Limpar referências CSS se necessário

### **Etapa 3: Validação**
- Verificar se card ainda funciona corretamente
- Confirmar que outros campos não foram afetados
- Testar responsividade e layout

## ⚠️ **CUIDADOS IMPORTANTES**

### **🛡️ Preservar**
- **Manter**: `Meta` (R$ 1.000,00) - valor monetário
- **Manter**: `Atingido` (R$ 348,00) - valor monetário
- **Manter**: `Progresso da Meta` (34.8%) - percentual de progresso
- **Manter**: `Limite (R$)` (R$ 1.500,00) - valor monetário de risco
- **Manter**: `P/L Sessão (R$)` (R$ 348,00) - resultado da sessão
- **Manter**: `Risco Usado` (0.0%) - percentual de risco usado

### **🗑️ Remover Apenas**
- **Meta** (10.0%) - percentual da meta
- **Meta Atual** (34.8%) - percentual atual da meta
- **Limite (%)** (15.0%) - percentual do limite
- **Loss Atual** (0.0%) - percentual de perda atual

## 🎯 **RESULTADO ESPERADO**

### **📊 Seção Performance (Após Remoção)**
```
Performance
Meta                    R$ 1.000,00  ← Mantido
Atingido                R$ 348,00     ← Mantido  
Progresso da Meta       34.8%         ← Mantido
```

### **⚠️ Seção Risco (Após Remoção)**
```
Risco
Limite (R$)             R$ 1.500,00   ← Mantido
P/L Sessão (R$)         R$ 348,00     ← Mantido
Risco Usado             0.0%          ← Mantido
```

## 🧪 **TESTES DE VALIDAÇÃO**

### **✅ Checklist Pós-Remoção**
- [ ] Card de progresso ainda renderiza corretamente
- [ ] Valores monetários continuam sendo atualizados
- [ ] Percentual de progresso funciona normalmente
- [ ] Layout permanece organizado e responsivo
- [ ] Nenhum erro no console do navegador
- [ ] Funcionalidade geral não foi afetada

## 🚀 **COMANDOS DE EXECUÇÃO**

```
COMANDOS DISPONÍVEIS:
"EXECUTAR REMOÇÃO" - Inicia o processo de remoção dos campos
"LOCALIZAR CAMPOS" - Apenas identifica onde estão os campos
"TESTAR REMOÇÃO" - Executa remoção e testa funcionamento
"REVERTER" - Desfaz as alterações se necessário
```

---

**🎯 Prompt criado! Aguardando seu comando para executar a remoção dos campos percentuais circulados em vermelho.**




