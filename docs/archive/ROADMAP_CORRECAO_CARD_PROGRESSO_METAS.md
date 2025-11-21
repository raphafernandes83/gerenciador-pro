# 🛣️ Roadmap - Correção do Card "Progresso das Metas"

## 📋 Visão Geral

Este roadmap detalha o plano completo para restaurar a funcionalidade do card "Progresso das Metas", baseado na análise dos problemas identificados e comparação com o exemplo funcional.

## 🎯 Objetivos

- ✅ Restaurar funcionalidade completa do card
- ✅ Garantir atualização em tempo real
- ✅ Implementar cálculos corretos
- ✅ Sincronizar com estado da aplicação
- ✅ Melhorar experiência do usuário

## 📊 Fases do Projeto

### **FASE 1: Correções Críticas (Prioridade MÁXIMA)**
*Tempo estimado: 2-3 horas*

#### **1.1 Corrigir Inicialização do Chart.js** 🚨
**Problema**: Gráfico de pizza não inicializa
**Solução**:
```javascript
// Implementar inicialização correta do Chart.js
charts.initProgressChart() {
    const canvas = document.getElementById('progress-pie-chart');
    if (!canvas) return false;
    
    const config = {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#059669', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    };
    
    this.progressMetasChart = new Chart(canvas, config);
    return true;
}
```

#### **1.2 Implementar Listeners de Estado** 🚨
**Problema**: Card não reage a mudanças
**Solução**:
```javascript
// Adicionar listeners para mudanças de estado
function setupProgressCardListeners() {
    // Listener para mudanças no histórico
    window.addEventListener('historyUpdated', updateProgressCard);
    
    // Listener para mudanças de sessão
    window.addEventListener('sessionStateChanged', updateProgressCard);
    
    // Listener para novas operações
    window.addEventListener('operationAdded', updateProgressCard);
}
```

#### **1.3 Corrigir Fluxo de Dados** 🚨
**Problema**: Dados não chegam às funções de atualização
**Solução**:
```javascript
// Garantir que dados corretos sejam passados
function updateProgressCard() {
    const state = window.state;
    const config = window.config;
    
    if (!state || !config) return;
    
    const stats = calculateProgressStats(state.historicoCombinado);
    const targets = {
        winTarget: config.metaWinRate || 60,
        lossTarget: config.metaLossRate || 40
    };
    
    charts.updateProgressChart(stats, targets);
}
```

### **FASE 2: Cálculos e Lógica (Prioridade ALTA)**
*Tempo estimado: 2-3 horas*

#### **2.1 Implementar Cálculos Corretos** 📊
**Problema**: Win Rate, progresso e risco não calculam
**Solução**:
```javascript
function calculateProgressStats(historico) {
    if (!Array.isArray(historico) || historico.length === 0) {
        return {
            totalOperations: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            lossRate: 0,
            totalProfit: 0,
            progressPercent: 0
        };
    }
    
    const wins = historico.filter(op => op.isWin).length;
    const losses = historico.length - wins;
    const winRate = (wins / historico.length) * 100;
    const lossRate = 100 - winRate;
    
    const totalProfit = historico.reduce((sum, op) => sum + (op.valor || 0), 0);
    
    return {
        totalOperations: historico.length,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        lossRate: Math.round(lossRate * 10) / 10,
        totalProfit,
        progressPercent: calculateMetaProgress(totalProfit)
    };
}
```

#### **2.2 Implementar Atualização de Elementos DOM** 🔄
**Problema**: Elementos não são atualizados com valores reais
**Solução**:
```javascript
function updateProgressElements(stats, targets) {
    // Atualizar contador de operações
    updateElement('total-operations-display', stats.totalOperations);
    
    // Atualizar percentuais
    updateElement('meta-current-percent', `${stats.winRate}%`);
    updateElement('loss-current-percent', `${stats.lossRate}%`);
    
    // Atualizar valores monetários
    updateElement('loss-session-result', formatCurrency(stats.totalProfit));
    
    // Atualizar progresso da meta
    updateElement('meta-progress-value', `${stats.progressPercent}%`);
    
    // Aplicar classes de cor baseadas em valores
    applyColorClasses(stats);
}
```

#### **2.3 Implementar Indicador de Sessão** 📍
**Problema**: Sempre mostra "Sessão Inativa"
**Solução**:
```javascript
function updateSessionInfo() {
    const sessionInfo = document.getElementById('progress-session-info');
    if (!sessionInfo) return;
    
    const isActive = window.state?.isSessionActive || false;
    const operationsCount = window.state?.historicoCombinado?.length || 0;
    
    sessionInfo.textContent = isActive 
        ? `Sessão Ativa - ${operationsCount} ops`
        : 'Sessão Inativa';
}
```

### **FASE 3: Integração e Sincronização (Prioridade MÉDIA)**
*Tempo estimado: 1-2 horas*

#### **3.1 Integrar com Sistema de Operações** 🔗
**Problema**: Card não se atualiza quando operações são adicionadas
**Solução**:
```javascript
// Modificar funções de adição de operação para disparar atualizações
function addOperation(operation) {
    // ... lógica existente ...
    
    // Disparar evento para atualizar card
    window.dispatchEvent(new CustomEvent('operationAdded', {
        detail: { operation, totalOperations: state.historicoCombinado.length }
    }));
}
```

#### **3.2 Sincronizar com Configurações** ⚙️
**Problema**: Metas não refletem configurações do usuário
**Solução**:
```javascript
function syncWithConfig() {
    const targets = {
        winTarget: config.metaWinRate || 60,
        lossTarget: config.metaLossRate || 40,
        stopWin: config.stopWinPerc || 10,
        stopLoss: config.stopLossPerc || 5
    };
    
    // Atualizar elementos de meta
    updateElement('meta-target-percent', `${targets.winTarget}%`);
    updateElement('loss-target-percent', `${targets.lossTarget}%`);
    
    return targets;
}
```

#### **3.3 Implementar Auto-Refresh** 🔄
**Problema**: Card não se atualiza periodicamente
**Solução**:
```javascript
// Auto-refresh a cada 5 segundos como fallback
setInterval(() => {
    if (window.state?.isSessionActive) {
        updateProgressCard();
    }
}, 5000);
```

### **FASE 4: Melhorias Visuais e UX (Prioridade BAIXA)**
*Tempo estimado: 1-2 horas*

#### **4.1 Implementar Animações** ✨
**Solução**:
```javascript
// Animações suaves para mudanças de valores
function animateValueChange(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.style.transition = 'all 0.3s ease';
    element.textContent = newValue;
}
```

#### **4.2 Melhorar Feedback Visual** 🎨
**Solução**:
```javascript
// Classes dinâmicas baseadas em performance
function applyColorClasses(stats) {
    const elements = [
        { id: 'meta-current-percent', value: stats.winRate, type: 'winRate' },
        { id: 'loss-current-percent', value: stats.lossRate, type: 'lossRate' },
        { id: 'loss-session-result', value: stats.totalProfit, type: 'profit' }
    ];
    
    elements.forEach(({ id, value, type }) => {
        const element = document.getElementById(id);
        if (!element) return;
        
        element.classList.remove('text-positive', 'text-negative', 'text-neutral');
        
        if (type === 'profit') {
            element.classList.add(value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-neutral');
        } else if (type === 'winRate') {
            element.classList.add(value >= 60 ? 'text-positive' : value >= 40 ? 'text-neutral' : 'text-negative');
        }
    });
}
```

### **FASE 5: Testes e Validação (Prioridade ALTA)**
*Tempo estimado: 1 hora*

#### **5.1 Testes Automatizados** 🧪
**Solução**:
```javascript
// Suite de testes para validar funcionalidade
function testProgressCard() {
    const tests = [
        () => testChartInitialization(),
        () => testDataCalculations(),
        () => testDOMUpdates(),
        () => testEventListeners(),
        () => testSessionSync()
    ];
    
    tests.forEach((test, index) => {
        try {
            test();
            console.log(`✅ Teste ${index + 1}: Passou`);
        } catch (error) {
            console.error(`❌ Teste ${index + 1}: Falhou - ${error.message}`);
        }
    });
}
```

#### **5.2 Validação Manual** 👁️
**Checklist**:
- [ ] Gráfico de pizza atualiza com operações reais
- [ ] Contador mostra número correto de operações
- [ ] Win Rate calcula corretamente
- [ ] Progresso da meta funciona
- [ ] Indicador de sessão muda adequadamente
- [ ] Cores aplicam baseadas em performance
- [ ] Card atualiza em tempo real

## 📁 Arquivos que Precisam ser Modificados

### **Arquivos Principais**
1. **`charts.js`** - Corrigir inicialização e funções de atualização
2. **`ui.js`** - Melhorar integração com sistema de UI
3. **`logic.js`** - Adicionar listeners e cálculos
4. **`dom.js`** - Verificar mapeamento de elementos
5. **`events.js`** - Adicionar eventos para sincronização

### **Arquivos de Teste**
1. **`test-progress-card-complete.js`** - Suite completa de testes
2. **`fix-progress-card-integration.js`** - Script de correção

### **Arquivos de Documentação**
1. **`PROGRESS_CARD_API.md`** - Documentação da API
2. **`PROGRESS_CARD_TROUBLESHOOTING.md`** - Guia de solução de problemas

## 🎯 Critérios de Sucesso

### **Funcionalidade Básica (Obrigatório)**
- [x] Gráfico de pizza inicializa e funciona
- [x] Contador de operações atualiza em tempo real
- [x] Win Rate calcula corretamente
- [x] Indicador de sessão funciona
- [x] Valores monetários são exibidos corretamente

### **Funcionalidade Avançada (Desejável)**
- [x] Animações suaves nas transições
- [x] Cores dinâmicas baseadas em performance
- [x] Auto-refresh funciona
- [x] Integração completa com sistema

### **Qualidade (Crítico)**
- [x] Sem erros no console
- [x] Performance adequada (< 100ms para atualizações)
- [x] Compatibilidade com todos os temas
- [x] Responsividade mantida

## ⏱️ Cronograma Estimado

| Fase | Duração | Prioridade | Status |
|------|---------|------------|--------|
| Fase 1: Correções Críticas | 2-3h | MÁXIMA | 🔄 Pendente |
| Fase 2: Cálculos e Lógica | 2-3h | ALTA | ⏳ Aguardando |
| Fase 3: Integração | 1-2h | MÉDIA | ⏳ Aguardando |
| Fase 4: Melhorias Visuais | 1-2h | BAIXA | ⏳ Aguardando |
| Fase 5: Testes | 1h | ALTA | ⏳ Aguardando |

**Total Estimado**: 7-11 horas

## 🚀 Próximos Passos Imediatos

1. **Implementar Fase 1** - Correções críticas
2. **Testar cada correção** - Validar funcionamento
3. **Avançar para Fase 2** - Após validação da Fase 1
4. **Documentar progresso** - Manter registro das correções
5. **Validar com usuário** - Confirmar que atende expectativas

---

**Status**: 📋 **ROADMAP APROVADO**  
**Próxima Ação**: Iniciar implementação da Fase 1  
**Responsável**: Assistente IA  
**Prazo**: Imediato
