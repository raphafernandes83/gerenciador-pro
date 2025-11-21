# 📝 Guia de Prompts para Implementação do Card Funcional

## 🎯 Objetivo
Transformar o card principal (segunda imagem) para funcionar **exatamente igual** ao preview (primeira imagem), com pontos percentuais, valores reais e atualização automática.

## 🚀 PROMPTS PARA CADA FASE

### **PROMPT FASE 1: Fundação Crítica** 🚨
```
Implemente a FASE 1 do roadmap: corrija a inicialização do Chart.js, implemente o sistema de cálculos reais e crie os listeners de operações. Foque em fazer o gráfico funcionar corretamente e os valores serem calculados baseados nas operações reais do histórico. Comece pela correção da função initProgressChart() no charts.js e depois implemente a função calculateRealStats() que deve calcular win rate, loss rate e valores monetários baseados no histórico de operações real.
```

### **PROMPT FASE 2: Pontos Percentuais** 📈
```
Implemente a FASE 2 do roadmap: adicione os pontos percentuais (pp) que estão funcionando no preview mas faltando no card principal. Preciso que apareça "▲ X.X pp" para valores positivos e "▼ X.X pp" para valores negativos, exatamente como mostrado na primeira imagem. Implemente a função calculatePointsPercentage() que calcula a diferença entre WR atual e meta, e entre Loss atual e limite, mostrando os indicadores visuais com cores dinâmicas (verde para positivo, vermelho para negativo).
```

### **PROMPT FASE 3: Valores Monetários** 💰
```
Implemente a FASE 3 do roadmap: corrija os valores monetários para serem reais e calculados dinamicamente. O preview mostra valores corretos (R$ 15,00 meta, R$ 1,84 atingido) mas o card principal mostra tudo zerado ou valores incorretos. Sincronize com as configurações reais do usuário (capitalInicial, stopWinPerc, stopLossPerc) e calcule o P/L real da sessão baseado nas operações do histórico.
```

### **PROMPT FASE 4: Gráfico Proporcional** 📊
```
Implemente a FASE 4 do roadmap: corrija o gráfico de pizza para mostrar proporções corretas. O preview mostra 80% verde e 20% vermelho (8 vitórias de 10 operações) mas o card principal mostra 100% verde incorretamente. Corrija a função updateChartProportions() para calcular e exibir as porcentagens reais baseadas no número de vitórias e derrotas do histórico, e corrija o contador para mostrar o número real de operações.
```

### **PROMPT FASE 5: Integração Completa** 🔗
```
Implemente a FASE 5 do roadmap: complete a integração fazendo o card atualizar automaticamente quando operações são adicionadas. Conecte com o sistema de operações para que cada nova operação dispare a atualização do card, implemente auto-refresh como fallback, e garanta que todos os valores sejam consistentes entre as diferentes seções do card. Teste a funcionalidade completa para garantir que funciona igual ao preview.
```

## 🧪 PROMPTS DE TESTE E VALIDAÇÃO

### **PROMPT TESTE BÁSICO**
```
Crie um teste automatizado que valide se o card está funcionando corretamente. O teste deve: 1) Adicionar 10 operações de exemplo (8 vitórias, 2 derrotas), 2) Verificar se o gráfico mostra 80% verde e 20% vermelho, 3) Verificar se o contador mostra "10 operações", 4) Verificar se WR atual mostra "80.0%" com pontos percentuais, 5) Verificar se os valores monetários são calculados corretamente, 6) Gerar relatório detalhado no console.
```

### **PROMPT TESTE AVANÇADO**
```
Crie um teste de integração completa que simule o uso real do app: inicie uma sessão, adicione operações uma por uma, verifique se o card atualiza automaticamente após cada operação, teste diferentes cenários (só vitórias, só derrotas, misturado), valide se os pontos percentuais mudam corretamente, e confirme que todos os valores são consistentes com o preview funcional.
```

## 🔧 PROMPTS DE CORREÇÃO ESPECÍFICA

### **Se o Gráfico Não Inicializar**
```
O gráfico de pizza não está inicializando. Analise a função initProgressChart() no charts.js, verifique se o canvas existe no DOM, se o Chart.js está carregado corretamente, e se a configuração do gráfico está correta. Corrija a inicialização para garantir que o gráfico seja criado sem erros e possa ser atualizado posteriormente.
```

### **Se os Valores Não Atualizarem**
```
Os valores do card não estão sendo atualizados quando operações são adicionadas. Verifique se os listeners de eventos estão funcionando, se a função updateProgressCardComplete() está sendo chamada, se os cálculos estão corretos, e se os elementos DOM estão sendo encontrados e atualizados. Implemente logs detalhados para debug.
```

### **Se os Pontos Percentuais Não Aparecerem**
```
Os pontos percentuais (▲ X.X pp / ▼ X.X pp) não estão aparecendo no card. Verifique se a função calculatePointsPercentage() está implementada, se os elementos HTML corretos estão sendo atualizados, se as classes CSS de cor estão sendo aplicadas, e se o formato de exibição está igual ao preview (símbolo + valor + "pp").
```

## 📊 PROMPT DE VALIDAÇÃO FINAL

### **PROMPT VALIDAÇÃO COMPLETA**
```
Faça uma validação completa comparando o card principal com o preview funcional. Verifique se TODOS os elementos estão funcionando: 1) Gráfico proporcional correto, 2) Contador de operações real, 3) Pontos percentuais com símbolos e cores, 4) Valores monetários calculados corretamente, 5) Atualização automática com operações, 6) Consistência entre todas as seções. Gere um relatório detalhado mostrando o que está funcionando e o que ainda precisa ser corrigido.
```

## 🎯 SEQUÊNCIA RECOMENDADA DE IMPLEMENTAÇÃO

### **Ordem dos Prompts:**
1. **PROMPT FASE 1** - Fundação crítica
2. **PROMPT TESTE BÁSICO** - Validar funcionamento básico
3. **PROMPT FASE 2** - Pontos percentuais
4. **PROMPT FASE 3** - Valores monetários
5. **PROMPT FASE 4** - Gráfico proporcional
6. **PROMPT FASE 5** - Integração completa
7. **PROMPT TESTE AVANÇADO** - Teste de integração
8. **PROMPT VALIDAÇÃO COMPLETA** - Validação final

### **Entre cada fase:**
- Teste a funcionalidade implementada
- Valide se não há erros no console
- Confirme que não quebrou funcionalidades existentes
- Documente o progresso

## 🚨 PROMPTS DE EMERGÊNCIA

### **Se Tudo Parar de Funcionar**
```
O card parou de funcionar completamente. Faça um diagnóstico completo: verifique erros no console, analise se os arquivos foram modificados corretamente, teste se o DOM está sendo mapeado, confirme se as funções existem, e implemente um sistema de rollback para voltar ao estado anterior funcional. Priorize restaurar o funcionamento básico antes de continuar.
```

### **Se Houver Conflitos de CSS**
```
Há conflitos de CSS afetando a exibição do card. Analise se as classes de cor estão sendo aplicadas corretamente, se não há conflitos com outros estilos, se os elementos estão visíveis, e se a formatação está igual ao preview. Corrija especificidade CSS e garanta que as cores dinâmicas funcionem.
```

## 📋 CHECKLIST ANTES DE CADA PROMPT

### **Antes de Enviar Qualquer Prompt:**
- [ ] Identifique qual fase está implementando
- [ ] Confirme que a fase anterior está funcionando
- [ ] Tenha claro o resultado esperado
- [ ] Prepare-se para testar após a implementação
- [ ] Tenha o preview de referência em mente

### **Após Cada Implementação:**
- [ ] Teste no navegador
- [ ] Verifique console por erros
- [ ] Compare com o preview funcional
- [ ] Documente o que foi implementado
- [ ] Prepare próxima fase

---

**Status**: 📝 **GUIA COMPLETO - PRONTO PARA USO**

## 🚀 PROMPT INICIAL RECOMENDADO

**Para começar a implementação agora, use este prompt:**

```
Implemente a FASE 1 do roadmap: corrija a inicialização do Chart.js, implemente o sistema de cálculos reais e crie os listeners de operações. Foque em fazer o gráfico funcionar corretamente e os valores serem calculados baseados nas operações reais do histórico. Comece pela correção da função initProgressChart() no charts.js e depois implemente a função calculateRealStats() que deve calcular win rate, loss rate e valores monetários baseados no histórico de operações real.
```

**Aguardando seu comando para iniciar! 🎯**
