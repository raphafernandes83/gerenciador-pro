# 📝 COMO ADICIONAR COMPONENTE - Gerenciador PRO v9.3

**Versão:** 1.0  
**Última atualização:** 21/12/2025  
**Documento:** Guia prático para desenvolvedores

---

## 📋 Índice

1. [Template de Componente](#template-de-componente)
2. [Checklist de Integração](#checklist-de-integração)
3. [Exemplos Práticos](#exemplos-práticos)
4. [Testes](#testes)
5. [Boas Práticas](#boas-práticas)

---

## 🚀 Template de Componente

### **Exemplo: Novo Componente UI**

```javascript
/**
 * 📊 [NOME DO COMPONENTE]
 * [Breve descrição da responsabilidade]
 * 
 * @class [NomeClasse]
 * @version 1.0.0
 */

import { logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';

class MeuNovoComponente {
    constructor(config = {}) {
        // 1. Configuração
        this.config = {
            ...this.getDefaultConfig(),
            ...config
        };
        
        // 2. Estado interno
        this.state = {};
        
        // 3. Referências DOM (se UI)
        this.elements = {};
        
        // 4. Event handlers (bound)
        this.handlers = {
            onClick: this.handleClick.bind(this),
            onChange: this.handleChange.bind(this)
        };
        
        logger.info('✅ MeuNovoComponente inicializado');
    }
    
    /**
     * Configuração padrão
     */
    getDefaultConfig() {
        return {
            enabled: true,
            autoInit: false
        };
    }
    
    /**
     * Inicialização
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.render();
        
        logger.info(' MeuNovoComponente pronto');
    }
    
    /**
     * Cache de elementos DOM
     */
    cacheElements() {
        this.elements = {
            container: document.getElementById('meu-container'),
            button: document.getElementById('meu-button')
        };
    }
    
    /**
     * Anexar event listeners
     */
    attachEventListeners() {
        if (this.elements.button) {
            this.elements.button.addEventListener(
                'click', 
                this.handlers.onClick
            );
        }
        
        // Subscribe eventos globais
        EventBus.subscribe('data:updated', this.onDataUpdate.bind(this));
    }
    
    /**
     * Renderização
     */
    render() {
        if (!this.elements.container) return;
        
        this.elements.container.innerHTML = `
            <div class="meu-componente">
                <h3>Título</h3>
                <p>Conteúdo</p>
            </div>
        `;
        
        logger.debug('MeuNovoComponente renderizado');
    }
    
    /**
     * Handler de clique
     */
    handleClick(event) {
        event.preventDefault();
        logger.debug('Button clicked');
        
        // Publica evento
        EventBus.publish('componente:action', {
            action: 'click',
            timestamp: Date.now()
        });
    }
    
    /**
     * Atualização de dados
     */
    onDataUpdate(data) {
        this.state = { ...this.state, ...data };
        this.render();
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Remove listeners
        if (this.elements.button) {
            this.elements.button.removeEventListener(
                'click',
                this.handlers.onClick
            );
        }
        
        // Limpa estado
        this.state = {};
        this.elements = {};
        
        logger.debug('🗑️ MeuNovoComponente destruído');
    }
}

// Export para uso global
if (typeof window !== 'undefined') {
    window.MeuNovoComponente = MeuNovoComponente;
}

export { MeuNovoComponente };
```

---

## ✅ Checklist de Integração

### **1. Criação do Arquivo**

- [ ] Criar arquivo em pasta apropriada (`src/ui/`, `src/business/`, etc.)
- [ ] Seguir convenção de nomes (`PascalCase.js`)  
- [ ] Adicionar JSDoc header com descrição

### **2. Implementação**

- [ ] Usar template acima como base
- [ ] Implementar `constructor()` com config
- [ ] Implementar `init()` para inicialização
- [ ] Implementar `render()` se componente UI
- [ ] Implementar `destroy()` para cleanup

### **3. Integração**

- [ ] Adicionar import em `src/ui/index.js` (ou equivalente)
- [ ] Registrar no `index.html` se necessário
- [ ] Adicionar ao sistema de inicialização
- [ ] Publicar/Subscrever eventos necessários

### **4. Logs**

- [ ] Adicionar `logger.info()` na inicialização
- [ ] Adicionar `logger.debug()` em ações importantes
- [ ] Adicionar `logger.warn()` em avisos
- [ ] Adicionar `logger.error()` para erros

### **5. Testes**

- [ ] Criar arquivo `tests/[nome-componente].test.js`
- [ ] Testar inicialização
- [ ] Testar renderização (se UI)
- [ ] Testar interações
- [ ] Testar cleanup

### **6. Documentação**

- [ ] Adicionar seção no README se componente importante
- [ ] Atualizar ARQUITETURA_MODULAR.md se necessário
- [ ] Comentar código complexo

---

## 🔧 Exemplos Práticos

### **Exemplo 1: Componente UI Simples**

**Tarefa:** Criar botão de "Modo Noturno"

#### **1. Criar arquivo `src/ui/NightModeToggle.js`:**

```javascript
import { logger } from '../utils/Logger.js';

class NightModeToggle {
    constructor() {
        this.isNightMode = localStorage.getItem('nightMode') === 'true';
    }
    
    init() {
        this.button = document.getElementById('night-mode-btn');
        if (!this.button) return;
        
        this.button.addEventListener('click', () => this.toggle());
        this.apply();
    }
    
    toggle() {
        this.isNightMode = !this.isNightMode;
        localStorage.setItem('nightMode', this.isNightMode);
        this.apply();
        
        logger.info(`🌙 Modo noturno: ${this.isNightMode ? 'ON' : 'OFF'}`);
    }
    
    apply() {
        document.body.classList.toggle('night-mode', this.isNightMode);
    }
}

export { NightModeToggle };
```

#### **2. Adicionar ao `src/ui/index.js`:**

```javascript
export { DashboardUI } from './DashboardUI.js';
export { PlanoUI } from './PlanoUI.js';
export { Night ModeToggle } from './NightModeToggle.js'; // ✅ NOVO
```

#### **3. Inicializar no `main.js`:**

```javascript
import { NightModeToggle } from './src/ui/index.js';

document.addEventListener('DOMContentLoaded', () => {
    const nightMode = new NightModeToggle();
    nightMode.init();
});
```

#### **4. Adicionar botão no `index.html`:**

```html
<button id="night-mode-btn" title="Modo Noturno">
    🌙
</button>
```

---

### **Exemplo 2: Componente Business Logic**

**Tarefa:** Criar calculador de risk/reward

#### **1. Criar `src/business/RiskRewardCalculator.js`:**

```javascript
import { logger } from '../utils/Logger.js';

class RiskRewardCalculator {
    /**
     * Calcula relação risco/recompensa
     * @param {number} entry - Preço de entrada
     * @param {number} stop - Preço de stop
     * @param {number} target - Preço alvo
     * @returns {{ratio: number, risk: number, reward: number}}
     */
    static calculate(entry, stop, target) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        const ratio = reward / risk;
        
        logger.debug(`Risk/Reward: 1:${ratio.toFixed(2)}`);
        
        return { ratio, risk, reward };
    }
    
    /**
     * Valida se R/R é aceitável
     * @param {number} ratio - Relação calculada
     * @param {number} minRatio - Mínimo aceitável (padrão 2:1)
     * @returns {boolean}
     */
    static isAcceptable(ratio, minRatio = 2.0) {
        return ratio >= minRatio;
    }
}

export { RiskRewardCalculator };
```

#### **2. Usar no código:**

```javascript
import { RiskRewardCalculator } from './src/business/RiskRewardCalculator.js';

const rr = RiskRewardCalculator.calculate(100, 95, 110);
console.log(rr); // { ratio: 2, risk: 5, reward: 10 }

if (RiskRewardCalculator.isAcceptable(rr.ratio)) {
    logger.info('✅ Trade aprovado!');
}
```

---

### **Exemplo 3: Utility Function**

**Tarefa:** Função para formatar números grandes

#### **1. Adicionar em `src/utils/FormatUtils.js`:**

```javascript
/**
 * Formata números grandes (ex: 1000000 → "1M")
 * @param {number} value - Número a formatar
 * @returns {string} Número formatado
 */
export function formatLargeNumber(value) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
}

// Exemplo de uso:
// formatLargeNumber(1_500_000) // "1.5M"
// formatLargeNumber(5_000) // "5.0K"
```

#### **2. Usar:**

```javascript
import { formatLargeNumber } from './src/utils/FormatUtils.js';

document.getElementById('volume').textContent = 
    formatLargeNumber(1_234_567); // "1.2M"
```

---

## 🧪 Testes

### **Template de Teste:**

```javascript
// tests/meu-componente.test.js

describe('MeuNovoComponente', () => {
    let component;
    
    beforeEach(() => {
        // Setup
        component = new MeuNovoComponente();
    });
    
    afterEach(() => {
        // Cleanup
        component.destroy();
    });
    
    test('deve inicializar corretamente', () => {
        expect(component).toBeDefined();
        expect(component.config.enabled).toBe(true);
    });
    
    test('deve renderizar UI', () => {
        component.init();
        const container = document.querySelector('.meu-componente');
        expect(container).not.toBeNull();
    });
    
    test('deve publicar evento ao clicar', () => {
        const mockHandler = jest.fn();
        EventBus.subscribe('componente:action', mockHandler);
        
        component.init();
        component.handleClick(new Event('click'));
        
        expect(mockHandler).toHaveBeenCalled();
    });
});
```

---

## 💡 Boas Práticas

### **1. Nomenclatura**

```javascript
// ✅ BOM - Nomes descritivos
class TradingStrategyCalculator { }
function calculateWinRate(wins, total) { }

// ❌ RUIM - Nomes genéricos
class Calculator { }
function calc(w, t) { }
```

### **2. Single Responsibility**

```javascript
// ✅ BOM - Uma responsabilidade
class ChartRenderer {
    render(data) { /* só renderiza */ }
}

// ❌ RUIM - Múltiplas responsabilidades
class ChartManager {
    render(data) { }
    fetchData() { }
    saveToDb() { }
    sendEmail() { }
}
```

### **3. Dependency Injection**

```javascript
// ✅ BOM - Injeção de dependências
class ReportGenerator {
    constructor(dataProvider, formatter) {
        this.data = dataProvider;
        this.format = formatter;
    }
}

// ❌ RUIM - Dependências hardcoded
class ReportGenerator {
    constructor() {
        this.data = new DatabaseService(); // acoplado!
    }
}
```

### **4. Error Handling**

```javascript
// ✅ BOM - Tratamento de erros
async function loadData() {
    try {
        const data = await api.fetch();
        return data;
    } catch (error) {
        logger.error('Falha ao carregar dados', error);
        return null;
    }
}

// ❌ RUIM - Sem tratamento
async function loadData() {
    return await api.fetch(); // pode quebrar!
}
```

### **5. Comentários**

```javascript
// ✅ BOM - Comenta PORQUÊ, não O QUÊ
// Usa média móvel de 7 dias para suavizar volatilidade
const smoothed = calculateMovingAverage(data, 7);

// ❌ RUIM - Comenta óbvio
// Cria variável smoothed
const smoothed = calculateMovingAverage(data, 7);
```

---

## 📂 Onde Colocar Cada Tipo de Componente

| Tipo | Pasta | Exemplo |
|------|-------|---------|
| Interface UI | `src/ui/` | `NotificationBanner.js` |
| Lógica de Negócio | `src/business/` | `ProfitCalculator.js` |
| Utilitários | `src/utils/` | `DateUtils.js` |
| Gerenciadores | `src/managers/` | `CacheManager.js` |
| Gráficos | `src/charts/` | `DonutChart.js` |
| Validações | `src/validation/` | `InputValidator.js` |
| Monitoramento | `src/monitoring/` | `PerformanceMonitor.js` |

---

## 🎯 Resumo Rápido

**Para adicionar um componente:**

1. ✅ Criar arquivo na pasta correta
2. ✅ Usar template como base
3. ✅ Implementar constructor/init/render/destroy
4. ✅ Adicionar logs (logger)
5. ✅ Registrar em index.js
6. ✅ Inicializar em main.js
7. ✅ Criar testes
8. ✅ Documentar se necessário

---

## 📚 Referências

- [ARQUITETURA_MODULAR.md](ARQUITETURA_MODULAR.md) - Estrutura geral
- [FLUXO_DE_DADOS.md](FLUXO_DE_DADOS.md) - Como integrar com estado
- [README.md](README.md) - Visão geral do projeto

---

**Autor:** Equipe Gerenciador PRO  
**Versão:** 1.0  
**Data:** 21/12/2025
