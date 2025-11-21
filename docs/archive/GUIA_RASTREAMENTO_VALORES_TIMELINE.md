# 🔍 GUIA DE RASTREAMENTO - Valores do Timeline

**OBJETIVO:** Descobrir exatamente de onde vem o valor que é impresso no card
"Histórico Visual do Dia"

---

## 🎯 O QUE O SISTEMA FAZ

O sistema de rastreamento intercepta **TODAS** as funções que podem afetar os
valores exibidos no timeline e monitora:

1. **💰 `formatarMoeda()`** - Toda formatação de valores monetários
2. **🎨 `renderizarTimelineCompleta()`** - Renderização do timeline completo
3. **📊 `state.historicoCombinado`** - Modificações no estado das operações
4. **🔄 DOM Timeline** - Mudanças no HTML do container
5. **📝 innerHTML/textContent** - Modificações diretas no conteúdo

---

## 🚀 COMO USAR

### 1. **Abrir a Aplicação Principal**

- Abra `index.html` (aplicação principal)
- Aguarde carregamento completo (3-5 segundos)

### 2. **Iniciar Rastreamento**

No console do navegador:

```javascript
// Instalar interceptadores
iniciarRastreamentoTimeline();
```

### 3. **Simular Operação**

```javascript
// Simular operação e ver fluxo completo
await simularOperacaoRastreamento();
```

### 4. **Analisar Estado Atual**

```javascript
// Ver valores atuais no timeline
analisarTimelineAtual();
```

### 5. **Parar e Ver Relatório**

```javascript
// Gerar relatório final
pararRastreamentoTimeline();
```

---

## 📊 O QUE VOCÊ VERÁ

### **Durante Execução:**

```
[RASTREADOR] 🔍 formatarMoeda(150) → R$ 150,00
[RASTREADOR] 🎨 renderizarTimelineCompleta chamada
[RASTREADOR] 📊 state.historicoCombinado alterado
[RASTREADOR] 🔄 DOM do timeline modificado
[RASTREADOR] 💰 Elemento com valores monetários adicionado
```

### **Relatório Final:**

```javascript
{
  tempoExecucao: "2340ms",
  totalLogs: 25,
  valoresMonetariosDetectados: 8,
  resumo: {
    erros: 0,
    avisos: 1,
    sucessos: 15,
    status: "OK"
  },
  valoresDetectados: [
    {
      message: "formatarMoeda(150) → R$ 150,00",
      data: { entrada: 150, saida: "R$ 150,00" },
      stack: "at formatarMoeda (ui.js:623:5)..."
    }
  ]
}
```

---

## 🔬 ANÁLISE DETALHADA

O sistema mostra **exatamente**:

### **1. Origem dos Valores**

- Qual função criou o valor
- Quando foi chamada
- Com que parâmetros
- Stack trace completo

### **2. Fluxo de Renderização**

- Quando `renderizarTimelineCompleta()` é chamada
- Quantas operações são passadas
- Se o container existe
- O que foi realmente renderizado

### **3. Modificações do DOM**

- Quando elementos são adicionados/removidos
- Qual conteúdo foi inserido
- Se contém valores monetários
- Estrutura HTML resultante

### **4. Estado das Operações**

- Mudanças em `state.historicoCombinado`
- Tamanho anterior vs novo
- Última operação adicionada
- Timestamp das modificações

---

## 🧪 CENÁRIOS DE TESTE

### **Cenário 1: Timeline Vazio**

```javascript
// 1. Iniciar rastreamento
iniciarRastreamentoTimeline();

// 2. Verificar estado atual
analisarTimelineAtual();
// → Mostra se há valores ou está vazio

// 3. Simular operação
await simularOperacaoRastreamento();
// → Mostra todo o fluxo de criação/renderização
```

### **Cenário 2: Timeline com Dados**

```javascript
// Se já há operações no histórico
iniciarRastreamentoTimeline();

// Forçar re-renderização
if (window.ui.renderizarTimelineCompleta) {
    window.ui.renderizarTimelineCompleta(window.state.historicoCombinado);
}

// Ver relatório
pararRastreamentoTimeline();
```

### **Cenário 3: Durante Operação Real**

```javascript
// 1. Iniciar rastreamento
iniciarRastreamentoTimeline();

// 2. Fazer uma operação real na aplicação
// (Clicar Win/Loss em uma etapa)

// 3. Ver o que aconteceu
pararRastreamentoTimeline();
```

---

## 🎯 RESOLUÇÃO DO PROBLEMA

Com este sistema você descobrirá:

1. **Se `formatarMoeda()` está sendo chamada** com os valores corretos
2. **Se `renderizarTimelineCompleta()` está recebendo** o histórico correto
3. **Se o DOM está sendo modificado** corretamente
4. **Onde exatamente o valor se perde** no fluxo
5. **Qual função está sobrescrevendo** os valores

---

## 📋 COMANDOS RÁPIDOS

```javascript
// Setup completo
iniciarRastreamentoTimeline();
await simularOperacaoRastreamento();

// Análise rápida
analisarTimelineAtual();

// Relatório final
pararRastreamentoTimeline();
```

---

## ⚡ RESULTADO ESPERADO

Após executar, você saberá **exatamente**:

- ✅ De onde vem o valor que aparece no timeline
- ✅ Qual função está formatando o valor
- ✅ Se o problema é na renderização ou nos dados
- ✅ Se há alguma função sobrescrevendo valores
- ✅ O fluxo completo dos dados até a exibição

**Execute no console da aplicação principal e descubra a origem exata dos
valores!** 🚀
