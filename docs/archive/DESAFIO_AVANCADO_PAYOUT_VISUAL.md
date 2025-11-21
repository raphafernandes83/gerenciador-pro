# 🎯 DESAFIO AVANÇADO: Sincronização de Payout + Feedback Visual de Seleção

## 📋 OBJETIVOS DO DESAFIO

Você deve implementar **duas funcionalidades críticas** que irão elevar a
experiência do usuário:

1. **Sincronização Perfeita dos Botões de Payout** entre o card principal e o
   menu lateral
2. **Feedback Visual Premium** para campos selecionados (focus) com efeito verde
   brilhante

## 🎯 PARTE 1: SINCRONIZAÇÃO DOS BOTÕES DE PAYOUT

### 🏗️ Estrutura Atual dos Botões

#### Card Principal (Plano de Operações)

```html
<div class="payout-buttons">
    <button class="payout-standard active-payout">87</button>
    <button class="payout-good">88</button>
    <button class="payout-good">89</button>
    <button class="payout-good">90</button>
    <button class="payout-good">91</button>
    <button class="payout-good">92</button>
    <button class="payout-premium">99</button>
</div>
```

#### Menu Lateral (Gerado Dinamicamente)

- **Localização**: `#sidebar-parameters` no modal do sidebar
- **Renderização**: Via `renderParametersDetail()` no `sidebar.js`
- **Problema**: Os botões do sidebar NÃO sincronizam com os do card principal

### 🎯 Requisitos de Sincronização

#### 1. Sincronização Bidirecional INSTANTÂNEA

- ✅ **Clique no card principal** → **Atualiza sidebar imediatamente**
- ✅ **Clique no sidebar** → **Atualiza card principal imediatamente**
- ✅ **Estados visuais** → **Classes CSS sincronizadas**
- ✅ **Valores internos** → **Estado da aplicação atualizado**

#### 2. Mapeamento de Classes CSS

```javascript
const PAYOUT_MAPPING = {
    87: 'payout-standard',
    88: 'payout-good',
    89: 'payout-good',
    90: 'payout-good',
    91: 'payout-good',
    92: 'payout-good',
    99: 'payout-premium',
};
```

#### 3. Sistema de Eventos Específico

```javascript
// Evento customizado para mudanças de payout
document.dispatchEvent(
    new CustomEvent('payoutSync', {
        detail: {
            payout: 90,
            source: 'main|sidebar',
            timestamp: Date.now(),
            element: buttonElement,
        },
    })
);
```

### 🔧 Implementação Requerida

#### 1. Modificar `renderParametersDetail()` no `sidebar.js`

```javascript
// Deve incluir os botões de payout com IDs únicos
const payoutButtonsHTML = `
    <label>Payout (%)</label>
    <div class="payout-buttons" id="sidebar-payout-buttons">
        <button class="payout-standard" data-payout="87" id="sidebar-payout-87">87</button>
        <button class="payout-good" data-payout="88" id="sidebar-payout-88">88</button>
        <button class="payout-good" data-payout="89" id="sidebar-payout-89">89</button>
        <button class="payout-good" data-payout="90" id="sidebar-payout-90">90</button>
        <button class="payout-good" data-payout="91" id="sidebar-payout-91">91</button>
        <button class="payout-good" data-payout="92" id="sidebar-payout-92">92</button>
        <button class="payout-premium" data-payout="99" id="sidebar-payout-99">99</button>
    </div>
`;
```

#### 2. Sistema de Sincronização dos Botões

```javascript
class PayoutSyncManager {
    constructor() {
        this.activePayout = 87; // Valor padrão
        this.mainContainer = '.payout-buttons';
        this.sidebarContainer = '#sidebar-payout-buttons';
    }

    // Métodos obrigatórios a implementar:
    syncPayoutButtons(payout, source) {
        /* ... */
    }
    updateButtonStates(payout) {
        /* ... */
    }
    setupMainListeners() {
        /* ... */
    }
    setupSidebarListeners() {
        /* ... */
    }
    applyVisualFeedback(button, action) {
        /* ... */
    }
}
```

#### 3. Feedback Visual de Clique

- **Efeito ripple** ao clicar
- **Animação de confirmação** (0.3s)
- **Som de feedback** (opcional)
- **Pulse effect** no botão selecionado

## 🎨 PARTE 2: FEEDBACK VISUAL PREMIUM PARA CAMPOS SELECIONADOS

### 🎯 Objetivo Visual

Quando um campo de texto (input/select) for **selecionado para edição**, deve
ter:

- **Borda verde brilhante** suave
- **Sombra externa verde** sutil
- **Efeito de brilho** animado
- **Transição suave** (0.2s)

### 🔧 Especificações Técnicas

#### 1. Seletores CSS Alvo

```css
/* Campos do card principal */
#capital-inicial:focus,
#percentual-entrada:focus,
#stop-win-perc:focus,
#stop-loss-perc:focus,
#estrategia-select:focus,

/* Campos do sidebar */
#sidebar-capital-inicial:focus,
#sidebar-percentual-entrada:focus,
#sidebar-stop-win-perc:focus,
#sidebar-stop-loss-perc:focus,
#sidebar-estrategia-select:focus
```

#### 2. Efeito Visual Requerido

```css
.field-focused {
    border-color: #00e676 !important;
    box-shadow:
        0 0 0 2px rgba(0, 230, 118, 0.2),
        0 0 8px rgba(0, 230, 118, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    background-color: rgba(0, 230, 118, 0.03);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.field-focused::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
        45deg,
        rgba(0, 230, 118, 0.4),
        rgba(0, 230, 118, 0.1),
        rgba(0, 230, 118, 0.4)
    );
    border-radius: inherit;
    z-index: -1;
    animation: fieldGlow 2s ease-in-out infinite alternate;
}

@keyframes fieldGlow {
    0% {
        opacity: 0.5;
    }
    100% {
        opacity: 0.8;
    }
}
```

#### 3. JavaScript para Controle de Estado

```javascript
class FieldFocusManager {
    constructor() {
        this.focusedField = null;
        this.setupFocusListeners();
    }

    setupFocusListeners() {
        // Implementar listeners para focus/blur
        // Aplicar/remover classes CSS
        // Sincronizar entre card principal e sidebar
    }

    applyFocusEffect(element) {
        /* ... */
    }
    removeFocusEffect(element) {
        /* ... */
    }
    handleFieldFocus(event) {
        /* ... */
    }
    handleFieldBlur(event) {
        /* ... */
    }
}
```

### 🎯 Responsividade e Temas

- **Compatível com todos os temas** (moderno, claro, matrix, daltonismo)
- **Adaptável para mobile/tablet**
- **Acessibilidade preservada** (contrast ratio adequado)
- **Performance otimizada** (sem lag visual)

## 🧪 TESTES OBRIGATÓRIOS

### Teste 1: Sincronização de Payout

```javascript
// 1. Clicar no payout 90% no card principal
document.querySelector('.payout-buttons button[data-payout="90"]').click();

// 2. Verificar se sidebar sincronizou
const sidebarBtn = document.querySelector('#sidebar-payout-90');
console.assert(
    sidebarBtn.classList.contains('active-payout'),
    'Sidebar não sincronizou'
);

// 3. Clicar no payout 92% no sidebar
document.querySelector('#sidebar-payout-92').click();

// 4. Verificar se card principal sincronizou
const mainBtn = document.querySelector(
    '.payout-buttons button[data-payout="92"]'
);
console.assert(
    mainBtn.classList.contains('active-payout'),
    'Card principal não sincronizou'
);
```

### Teste 2: Feedback Visual de Focus

```javascript
// 1. Focar no campo capital inicial
document.getElementById('capital-inicial').focus();

// 2. Verificar efeito visual
const field = document.getElementById('capital-inicial');
console.assert(
    field.classList.contains('field-focused'),
    'Efeito de focus não aplicado'
);

// 3. Desfocar e verificar remoção
field.blur();
console.assert(
    !field.classList.contains('field-focused'),
    'Efeito de focus não removido'
);
```

### Teste 3: Sincronização Cross-Modal

```javascript
// 1. Abrir sidebar, clicar payout 99%
// 2. Fechar sidebar, verificar se card principal mantém payout 99%
// 3. Focar campo no sidebar, verificar se não interfere no card principal
// 4. Mudança rápida de multiple payouts (stress test)
```

## 🚀 CRITÉRIOS DE SUCESSO

### Funcional

- [ ] Botões de payout sincronizam instantaneamente (< 50ms)
- [ ] Classes CSS aplicadas corretamente
- [ ] Estado da aplicação sempre atualizado
- [ ] Feedback visual de focus implementado
- [ ] Efeitos visuais suaves e profissionais

### Técnico

- [ ] Zero conflitos com sistema existente
- [ ] Performance otimizada (sem lag)
- [ ] Código modular e reutilizável
- [ ] Tratamento de erros robusto
- [ ] Compatibilidade cross-browser

### UX/UI

- [ ] Transições suaves (0.2s)
- [ ] Feedback visual imediato
- [ ] Acessibilidade preservada
- [ ] Responsive design mantido
- [ ] Integração visual harmoniosa

## 🎯 DESAFIOS ESPECÍFICOS

### Desafio 1: Timing Perfeito

- A sincronização deve ser **INSTANTÂNEA** (< 50ms)
- Não pode haver **atraso visual** perceptível
- Deve funcionar em **dispositivos lentos**

### Desafio 2: Estado Complexo

- Manter **consistência** entre 3 locais: card, sidebar, estado interno
- Lidar com **múltiplos cliques rápidos**
- **Prevenir race conditions**

### Desafio 3: Integração Visual

- Efeitos visuais devem ser **profissionais**, não amadores
- **Compatibilidade** com todos os 4 temas existentes
- **Não quebrar** layouts responsivos existentes

### Desafio 4: Performance

- **Zero impacto** na performance da aplicação
- **Animações fluidas** mesmo em dispositivos lentos
- **Memory leaks** devem ser evitados

## 🔍 ARQUIVOS A MODIFICAR

1. **`sidebar.js`** - Renderização dos botões no sidebar
2. **`events.js`** - Sistema de eventos de payout
3. **`style.css`** - Efeitos visuais de focus e payout
4. **`main.js`** - Testes e validação (opcional)

## 💡 DICAS DE IMPLEMENTAÇÃO

1. **Use event delegation** para eficiência
2. **Implemente debounce** para múltiplos cliques
3. **Cache elementos DOM** para performance
4. **Use CSS custom properties** para temas
5. **Teste extensivamente** todos os cenários

## 🏆 BÔNUS CHALLENGES

### Bônus 1: Animação Avançada

- **Morphing effect** entre botões de payout
- **Wave animation** no clique
- **Particle effects** sutis

### Bônus 2: Acessibilidade Premium

- **Screen reader** support completo
- **Keyboard navigation** otimizada
- **High contrast mode** support

### Bônus 3: Performance Extrema

- **RequestAnimationFrame** para animações
- **Intersection Observer** para otimizações
- **Web Workers** para processamento pesado

---

## 🎯 COMANDO FINAL

**IMPLEMENTE A SINCRONIZAÇÃO PERFEITA DOS BOTÕES DE PAYOUT E O FEEDBACK VISUAL
PREMIUM PARA CAMPOS SELECIONADOS. A EXPERIÊNCIA DEVE SER FLUIDA, INSTANTÂNEA E
VISUALMENTE IMPRESSIONANTE!**

**Este desafio testará suas habilidades em:**

- Sincronização de estado complexo
- Animações CSS avançadas
- Otimização de performance
- Integração de sistemas
- Design de experiência do usuário

**BOA SORTE! 🚀**
