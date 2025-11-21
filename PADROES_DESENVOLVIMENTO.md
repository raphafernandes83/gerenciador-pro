# 🛡️ PADRÕES DE DESENVOLVIMENTO - PREVENÇÃO DE FALHAS

## 🎯 REGRAS OBRIGATÓRIAS

### 1. VERIFICAÇÕES DOM

```javascript
// ❌ NUNCA FAZER
element.style.width = '50%';

// ✅ SEMPRE FAZER
if (!element) {
    console.warn('Elemento não encontrado:', elementId);
    return false;
}
element.style.setProperty('width', '50%', 'important');
```

### 2. CSS VARIABLES EM JAVASCRIPT

```javascript
// ❌ NUNCA USAR DIRETAMENTE
backgroundColor: 'var(--primary-color)';

// ✅ SEMPRE RESOLVER PRIMEIRO
const colors = getComputedStyle(document.documentElement);
backgroundColor: colors.getPropertyValue('--primary-color').trim() ||
    '#default';
```

### 3. CONFLITOS CSS

```css
/* ✅ SEMPRE USAR CLASSES ESPECÍFICAS */
.progress-metas-panel .progress-bar-track {
    height: 24px;
}

/* ❌ NUNCA USAR CLASSES GENÉRICAS */
.progress-bar-track {
    height: 8px;
}
```

### 4. DEBUGGING OBRIGATÓRIO

```javascript
function updateComponent(data) {
    console.log('🔄 Atualizando componente:', { data });

    // Implementação

    console.log('✅ Componente atualizado com sucesso');
}
```

## 🧪 CHECKLIST PRÉ-COMMIT

- [ ] Todos os elementos DOM verificados antes de uso?
- [ ] CSS variables resolvidas em JavaScript?
- [ ] Classes CSS específicas (não genéricas)?
- [ ] Logs de debug implementados?
- [ ] Função de teste criada?
- [ ] Fallbacks para casos de erro?

## 🚨 SINAIS DE ALERTA

🔴 **PARE IMEDIATAMENTE SE:**

- Elemento DOM pode ser null
- Usando CSS variable em JS sem resolver
- CSS class muito genérica
- Sem logs de debug
- Sem função de teste
