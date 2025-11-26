# 🔄 COMO ADICIONAR UM COMPONENTE UI

**Guia Passo a Passo para Criar Novos Componentes Modulares**

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:
- ✅ Lido `ARQUITETURA_MODULAR.md`
- ✅ Entendido a classe `BaseUI`
- ✅ Identificado a funcionalidade a ser extraída

---

## 🛠️ Passo 1: Criar o Arquivo do Componente

### 1.1 Localização
Crie o arquivo em: `src/ui/NomeDoComponenteUI.js`

**Convenção de nomes:**
- Use **PascalCase**
- Termine com **UI**
- Exemplo: `TabelaUI.js`, `TimelineUI.js`, `ModalUI.js`

### 1.2 Template Básico

```javascript
/**
 * 🎨 [NOME DO COMPONENTE] - Gerenciador PRO
 * 
 * @fileoverview [Descrição detalhada do que este componente faz]
 * @module [NomeUI]
 * @extends BaseUI
 * @version 1.0.0
 * @author Sistema de Refatoração
 * @created [Data]
 */

import { BaseUI } from './BaseUI.js';
import { state, config } from '../state.js';
import { dom } from '../dom.js';

/**
 * Classe responsável por [descrever responsabilidade]
 * 
 * @class NomeUI
 * @extends BaseUI
 */
export class NomeUI extends BaseUI {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.nomeDoComponente = 'Nome';
        
        // Propriedades específicas do componente
        this.cache = {};
        this.isInitialized = false;
    }

    /**
     * Inicializa o componente
     * @override
     */
    init() {
        super.init();
        
        try {
            this._setupEventListeners();
            this._initializeCache();
            this.isInitialized = true;
            
            console.log(`✅ ${this.nomeDoComponente}UI inicializado`);
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nomeDoComponente}UI:`, error);
        }
    }

    /**
     * Renderiza o componente
     * @param {Object} data - Dados para renderização
     * @override
     */
    render(data = {}) {
        if (!this.isInitialized) {
            console.warn(`⚠️ ${this.nomeDoComponente}UI não foi inicializado`);
            return;
        }

        try {
            // Lógica de renderização aqui
            console.log(`🎨 ${this.nomeDoComponente}UI renderizado`);
        } catch (error) {
            console.error(`❌ Erro ao renderizar ${this.nomeDoComponente}UI:`, error);
        }
    }

    /**
     * Configura event listeners
     * @private
     */
    _setupEventListeners() {
        // Event listeners específicos
    }

    /**
     * Inicializa cache de elementos DOM
     * @private
     */
    _initializeCache() {
        // Cachear elementos DOM frequentemente usados
    }

    /**
     * Destrói o componente e limpa recursos
     * @override
     */
    destroy() {
        this.cache = {};
        this.isInitialized = false;
        super.destroy();
        
        console.log(`🗑️ ${this.nomeDoComponente}UI destruído`);
    }
}

// Exposição global para debug (opcional)
if (typeof window !== 'undefined') {
    window.NomeUI = NomeUI;
}
```

---

## 📝 Passo 2: Migrar Função de ui.js

### 2.1 Identificar a Função

No `ui.js`, encontre a função que você quer migrar:

```javascript
// ui.js (ANTES)
const ui = {
    minhaFuncao(parametro) {
        // ... código aqui ...
    }
};
```

### 2.2 Copiar para o Novo Componente

```javascript
// NomeUI.js (DEPOIS)
export class NomeUI extends BaseUI {
    minhaFuncao(parametro) {
        // ... mesmo código ...
        // Ajustar referências:
        // - state → state
        // - config → config
        // - dom → dom
        // - this.formatarMoeda → usar helper ou manter
    }
}
```

### 2.3 Ajustar Referências

**Antes (ui.js):**
```javascript
minhaFuncao() {
    this.formatarMoeda(100); // ✅ Funciona
}
```

**Depois (NomeUI.js):**
```javascript
import { ui } from '../ui.js'; // Se precisar de funções do ui

minhaFuncao() {
    ui.formatarMoeda(100); // ✅ Funciona
    // OU importar helper
}
```

---

## 🔗 Passo 3: Registrar em index.js

### 3.1 Importar o Componente

```javascript
// src/ui/index.js

import { NomeUI } from './NomeUI.js';
```

### 3.2 Adicionar à Função de Inicialização

```javascript
// src/ui/index.js

export function inicializarUI() {
    const components = {
        dashboard: new DashboardUI(),
        plano: new PlanoUI(),
        nome: new NomeUI(), // ← NOVO
    };

    // Inicializar todos
    Object.values(components).forEach(c => c.init());
    
    return components;
}
```

### 3.3 Exportar o Componente

```javascript
// src/ui/index.js

export {
    BaseUI,
    DashboardUI,
    PlanoUI,
    NomeUI, // ← NOVO
};
```

---

## 🎯 Passo 4: Delegar de ui.js

### 4.1 Manter Facade (Recomendado)

```javascript
// ui.js

const ui = {
    // Delegar para componente
    minhaFuncao(parametro) {
        return components.nome.minhaFuncao(parametro);
    }
};
```

**Vantagens:**
- ✅ Não quebra código existente
- ✅ Transição suave
- ✅ Backward compatibility

### 4.2 Remover do ui.js (Quando seguro)

Após confirmar que ninguém mais usa:
```javascript
// ui.js
// REMOVIDO: minhaFuncao() - migrado para NomeUI
```

---

## ✅ Passo 5: Testar

### 5.1 Teste Manual no Console

```javascript
// Verificar se componente foi inicializado
components.nome.isInitialized; // → true

// Testar renderização
components.nome.render({ teste: 'dados' });

// Testar função migrada
components.nome.minhaFuncao('parametro');
```

### 5.2 Teste de Integração

```javascript
// Testar via facade do ui.js
ui.minhaFuncao('parametro'); // Deve funcionar normalmente
```

### 5.3 Verificar Console

- ✅ Sem erros no console
- ✅ Mensagens de inicialização aparecem
- ✅ Renderização funciona corretamente

---

## 🧪 Passo 6: Adicionar Testes (Opcional mas Recomendado)

### 6.1 Criar Arquivo de Teste

```javascript
// tests/unit/NomeUI.test.js

import { NomeUI } from '../../src/ui/NomeUI.js';

describe('NomeUI', () => {
    let componente;

    beforeEach(() => {
        componente = new NomeUI();
        componente.init();
    });

    afterEach(() => {
        componente.destroy();
    });

    test('deve inicializar corretamente', () => {
        expect(componente.isInitialized).toBe(true);
    });

    test('deve renderizar sem erros', () => {
        expect(() => componente.render()).not.toThrow();
    });
});
```

---

## 📐 Convenções e Melhores Práticas

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Métodos públicos | camelCase | `render()`, `update()` |
| Métodos privados | `_camelCase` | `_setupEvents()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| Classes | PascalCase | `TabelaUI` |

### Estrutura de Métodos

**Ordem recomendada:**
1. `constructor()` - Propriedades
2. `init()` - Inicialização
3. Métodos públicos (alfabética)
4. Métodos privados `_` (alfabética)
5. `destroy()` - Limpeza

### Comentários JSDoc

```javascript
/**
 * Descrição do que o método faz
 * 
 * @param {tipo} nome - Descrição do parâmetro
 * @param {tipo} [opcional] - Parâmetro opcional
 * @returns {tipo} Descrição do retorno
 * @throws {Error} Quando ocorre X
 * @example
 * componente.metodo('exemplo');
 */
metodo(nome, opcional = 'default') {
    // ...
}
```

---

## 🚨 Checklist Final

Antes de considerar o componente completo:

- [ ] Arquivo criado em `src/ui/NomeUI.js`
- [ ] Extend `BaseUI` corretamente
- [ ] Método `init()` implementado
- [ ] Método `render()` implementado  
- [ ] Método `destroy()` implementado
- [ ] Event listeners configurados
- [ ] Registrado em `src/ui/index.js`
- [ ] Delegação em `ui.js` funciona
- [ ] Testado manualmente no console
- [ ] Sem erros/warnings no console
- [ ] (Opcional) Testes unitários criados
- [ ] (Opcional) Documentação JSDoc completa

---

## 📚 Exemplos Completos

### Exemplo 1: TabelaUI

```javascript
// src/ui/TabelaUI.js

import { BaseUI } from './BaseUI.js';
import { state, config } from '../state.js';
import { dom } from '../dom.js';

export class TabelaUI extends BaseUI {
    constructor() {
        super();
        this.nomeDoComponente = 'Tabela';
    }

    init() {
        super.init();
        console.log('✅ TabelaUI inicializado');
    }

    render() {
        if (!dom.tabelaBody) {
            console.warn('⚠️ Elemento tabelaBody não encontrado');
            return;
        }

        const plano = state.planoDeOperacoes || [];
        const fragment = document.createDocumentFragment();

        plano.forEach((etapa, index) => {
            const tr = this._criarLinha(etapa, index);
            fragment.appendChild(tr);
        });

        dom.tabelaBody.innerHTML = '';
        dom.tabelaBody.appendChild(fragment);
    }

    _criarLinha(etapa, index) {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        
        // ... lógica de criação da linha
        
        return tr;
    }
}
```

---

## 🔗 Referências

- [BaseUI.js](../src/ui/BaseUI.js)
- [ARQUITETURA_MODULAR.md](./ARQUITETURA_MODULAR.md)
- [Componentes Existentes](../src/ui/)

---

**Última atualização:** 24/11/2025  
**Autor:** Sistema de Refatoração
