# 🧪 TESTES - Componentes UI Modulares

**Data:** 25/11/2025 00:50  
**Componentes para testar:** TabelaUI, TimelineUI, ModalUI

---

## ✅ Como Testar

### Passo 1: Recarregar Página
**Ctrl + F5** ou **F5** para recarregar

**Esperado:**
- ✅ Sem erros no console
- ✅ Página carrega normalmente
- ✅ `components` disponível no window

---

## 📊 Testes no Console

### 1. Verificar Componentes Disponíveis

```javascript
// Ver todos os componentes
window.components

// Esperado:
// {
//   dashboard: DashboardUI,
//   plano: PlanoUI,
//   tabela: TabelaUI,
//   timeline: TimelineUI,
//   modal: ModalUI,
//   ...
// }
```

---

### 2. TabelaUI

```javascript
// Verificar componente
components.tabela.nomeDoComponente; // → "Tabela"

// Renderizar tabela
await components.tabela.render();

// Via facade
ui.renderizarTabela();
```

**Esperado:**
- ✅ Tabela renderiza sem erros
- ✅ Console mostra: `📊 TabelaUI: Renderizando tabela...`

---

### 3. TimelineUI

```javascript
// Verificar componente
components.timeline.nomeDoComponente; // → "Timeline"

// Renderizar timeline
components.timeline.render();

// Via facade
ui.renderizarTimelineCompleta();

// Adicionar item de teste
const opTest = {
    isWin: true,
    valor: 75.50,
    tag: 'Teste Manual',
    timestamp: new Date().toLocaleTimeString('pt-BR')
};
components.timeline.addItem(opTest, 0, true);

// Via facade
ui.adicionarItemTimeline(opTest, 0);
```

**Esperado:**
- ✅ Timeline renderiza
- ✅ Item de teste aparece na timeline
- ✅ Scroll automático funciona

---

### 4. ModalUI - Alert

```javascript
// Teste básico
await ui.alert('Teste de Alerta', 'ModalUI funcionando!');

// Teste avançado
await ui.alert({
    title: 'Teste Completo',
    message: 'Modal com glassmorphism design',
    closeOnEscape: true
});

// Via components
await components.modal.alert({
    title: 'Teste Direto',
    message: 'Chamada direta no componente'
});
```

**Esperado:**
- ✅ Modal aparece com blur (glassmorphism)
- ✅ Animação suave (fade-in + scale-up)
- ✅ ESC fecha o modal
- ✅ Click fora fecha
- ✅ Botão "OK" fecha

---

### 5. ModalUI - Confirm

```javascript
// Teste básico
const result = await ui.confirm('Confirmar Teste?', 'Clique em Confirmar ou Cancelar');
console.log('Resultado:', result); // true ou false

// Teste com callback
const confirmed = await ui.confirm({
    title: 'Deletar Item?',
    message: 'Esta ação não pode ser desfeita',
    onConfirm: () => console.log('✅ Confirmado!'),
    onCancel: () => console.log('❌ Cancelado')
});

if (confirmed) {
    console.log('Usuário confirmou!');
} else {
    console.log('Usuário cancelou');
}
```

**Esperado:**
- ✅ Modal com 2 botões (Cancelar + Confirmar)
- ✅ "Confirmar" retorna `true`
- ✅ "Cancelar" retorna `false`
- ✅ ESC retorna `false`
- ✅ Click fora retorna `false`

---

### 6. ModalUI - Custom

```javascript
// Modal customizado com HTML
await ui.showModal({
    type: 'custom',
    title: 'Formulário Teste',
    content: `
        <div style="padding: 20px;">
            <label style="display: block; margin-bottom: 10px;">
                Nome:
                <input type="text" id="test-name" style="width: 100%; padding: 8px; margin-top: 5px;">
            </label>
            <label style="display: block;">
                Email:
                <input type="email" id="test-email" style="width: 100%; padding: 8px; margin-top: 5px;">
            </label>
        </div>
    `,
    buttons: [
        {
            label: 'Cancelar',
            onClick: () => components.modal.close(),
            variant: 'secondary'
        },
        {
            label: 'Salvar',
            onClick: () => {
                const name = document.getElementById('test-name').value;
                const email = document.getElementById('test-email').value;
                console.log('Dados:', { name, email });
                components.modal.close();
            },
            variant: 'primary'
        }
    ]
});
```

**Esperado:**
- ✅ Modal com HTML custom renderiza
- ✅ Inputs são focáveis
- ✅ Tab trap funciona (foco fica dentro do modal)
- ✅ Botões customizados funcionam

---

## 🎨 Testes Visuais

### Glassmorphism Check

**Verificar:**
1. ✅ Fundo desfocado (blur visível)
2. ✅ Modal semi-transparente
3. ✅ Bordas sutis
4. ✅ Sombra profunda

**Dark Mode:**
- Ativar dark mode do sistema
- Recarregar página
- Abrir modal
- ✅ Modal escuro (rgba(30, 30, 30, 0.95))

---

### Animações Check

**Abertura (300ms):**
1. Modal "cresce" de 95% para 100% (scale)
2. Sobe levemente (+20px)
3. Fade-in simultâneo

**Fechamento (200ms):**
1. Modal "encolhe" para 95%
2. Desce levemente
3. Fade-out (mais rápido que abertura)

---

### Acessibilidade Check

**Focus Trap:**
1. Abrir modal custom com múltiplos inputs
2. Pressionar Tab repetidamente
3. ✅ Foco fica travado dentro do modal
4. ✅ Ao chegar no último elemento, Tab vai pro primeiro
5. ✅ Shift+Tab funciona inversamente

**Keyboard:**
- ✅ ESC fecha modal (se `closeOnEscape: true`)
- ✅ Enter em botão aciona onClick

---

## ⚠️ Testes de Edge Cases

### 1. Múltiplas Aberturas

```javascript
// Rápido, em sequência
components.modal.alert({ title: 'Modal 1' });
components.modal.alert({ title: 'Modal 2' });
components.modal.alert({ title: 'Modal 3' });
```

**Esperado:**
- ✅ Apenas primeiro modal abre
- ✅ Console mostra: `⚠️ Modal já está aberto ou animando`

### 2. Componente Não Disponível

```javascript
// Desabilitar componentes temporariamente
const backup = window.components;
window.components = null;

await ui.alert('Teste', 'Isso deve falhar');
// Esperado: Console mostra "⚠️ ModalUI não disponível"

// Restaurar
window.components = backup;
```

### 3. Fechar Durante Animação

```javascript
// Abrir e fechar rapidamente
const promise = ui.alert('Teste');
await ui.closeModal();
await promise;
```

**Esperado:**
- ✅ Não quebra
- ✅ Modal fecha corretamente

---

## 📊 Checklist de Validação

### TabelaUI
- [ ] Componente inicializa
- [ ] `ui.renderizarTabela()` funciona
- [ ] Modo Zen funciona
- [ ] Estratégia Fixa renderiza
- [ ] Estratégia Ciclos renderiza
- [ ] Chunks funcionam (sem lag)

### TimelineUI
- [ ] Componente inicializa
- [ ] `ui.renderizarTimelineCompleta()` funciona
- [ ] `ui.adicionarItemTimeline()` funciona
- [ ] `ui.removerUltimoItemTimeline()` funciona
- [ ] Ícones contextuais aparecem
- [ ] Scroll funciona

### ModalUI
- [ ] Componente inicializa
- [ ] `ui.alert()` funciona
- [ ] `ui.confirm()` funciona (retorna true/false)
- [ ] `ui.showModal()` custom funciona
- [ ] Glassmorphism visível
- [ ] Animações suaves (300ms/200ms)
- [ ] ESC fecha
- [ ] Click outside fecha
- [ ] Focus trap funciona
- [ ] Dark mode funciona
- [ ] Múltiplas aberturas bloqueadas

---

## 🐛 Se Algo Falhar

### Erro: "components is not defined"
**Causa:** Componentes não inicializaram  
**Fix:** Recarregar página (Ctrl+F5)

### Erro: "Cannot read property 'render' of undefined"
**Causa:** Componente específico não carregou  
**Fix:** Verificar se arquivo existe em `src/ui/NomeUI.js`

### Erro: "Uncaught SyntaxError"
**Causa:** Erro de sintaxe no ui.js  
**Fix:** Rollback: `git checkout HEAD -- ui.js`

### Tela preta
**Causa:** Erro crítico no JavaScript  
**Fix:**
1. Abrir DevTools (F12)
2. Ver erro no console
3. Reportar erro encontrado

---

## ✅ Resultado Esperado

Se **TUDO funcionar:**

```javascript
// Console limpo, sem erros
✅ TabelaUI inicializado
✅ TimelineUI inicializado
✅ ModalUI inicializado

// Todos os testes passam
ui.renderizarTabela(); // ✅
ui.renderizarTimelineCompleta(); // ✅
await ui.alert('OK', 'Funciona!'); // ✅
const ok = await ui.confirm('OK?', 'Sim?'); // ✅ true/false
```

---

**Criado em:** 25/11/2025 00:55  
**Próximo passo:** Executar todos os testes acima  
**Se tudo passar:** Criar NotificationUI (último componente!)
