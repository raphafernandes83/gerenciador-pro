# 🧪 GUIA DE TESTES AUTOMATIZADOS

**Como criar e executar testes automatizados no Gerenciador PRO**

---

## 📚 ÍNDICE

1. [O que são Testes Automatizados](#o-que-são)
2. [Como Executar os Testes](#como-executar)
3. [Como Criar Novos Testes](#como-criar)
4. [Ações Disponíveis](#ações-disponíveis)
5. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 O QUE SÃO TESTES AUTOMATIZADOS

Os testes automatizados são scripts que simulam ações do usuário e verificam se a aplicação está funcionando corretamente. 

**Vantagens:**
- ✅ Testa automaticamente após cada mudança
- ✅ Detecta bugs antes de você perceber
- ✅ Economiza tempo de testes manuais
- ✅ Garante que funcionalidades antigas não quebraram

---

## 🚀 COMO EXECUTAR OS TESTES

### Opção 1: Via Console do Navegador

1. Abra a aplicação: http://localhost:8080
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Digite:

```javascript
// Carregar suite de testes
await import('./tests/validation-tests.js');

// Executar todos os testes
const runner = new AutomatedTestRunner();
const resultado = await runner.runAll();

// Ver relatório
console.log(resultado);
```

### Opção 2: Via Botão na Interface (futuro)

Em breve será adicionado um botão "Executar Testes" na aba de Testes.

---

## 📝 COMO CRIAR NOVOS TESTES

### Estrutura Básica de um Teste

```javascript
addTest({
    name: "Nome do Teste",
    description: "O que este teste faz",
    steps: [
        {
            description: "Passo 1: Descreva o que faz",
            action: "click",  // Tipo de ação
            params: {         // Parâmetros da ação
                selector: "#botao-id"
            },
            expectedResult: { equals: true }  // Resultado esperado
        },
        // Mais passos...
    ]
});
```

### Exemplo Real: Teste de Validação

```javascript
addTest({
    name: "Teste de Campo Capital Inicial",
    description: "Verifica se campo valida corretamente",
    steps: [
        // Passo 1: Clicar no campo
        {
            description: "Focar no campo capital-inicial",
            action: "click",
            params: { selector: "#capital-inicial" }
        },
        
        // Passo 2: Digitar valor
        {
            description: "Digitar valor inválido",
            action: "type",
            params: {
                selector: "#capital-inicial",
                value: "abc"
            }
        },
        
        // Passo 3: Sair do campo
        {
            description: "Clicar fora para disparar validação",
            action: "click",
            params: { selector: "body" }
        },
        
        // Passo 4: Aguardar
        {
            description: "Aguardar validação processar",
            action: "wait",
            params: { duration: 300 }  // 300ms
        },
        
        // Passo 5: Verificar resultado
        {
            description: "Verificar se campo ficou com erro",
            action: "checkClass",
            params: {
                selector: "#capital-inicial",
                className: "input-invalid"
            },
            expectedResult: { equals: true }
        }
    ]
});
```

---

## 🎯 AÇÕES DISPONÍVEIS

### 1. **click** - Clicar em elemento

```javascript
{
    action: "click",
    params: {
        selector: "#botao-id"  // Seletor CSS
    }
}
```

### 2. **type** - Digitar em campo

```javascript
{
    action: "type",
    params: {
        selector: "#input-id",
        value: "1000"  // Valor a digitar
    }
}
```

### 3. **wait** - Aguardar tempo

```javascript
{
    action: "wait",
    params: {
        duration: 500  // Tempo em milissegundos
    }
}
```

### 4. **checkValue** - Verificar valor de campo

```javascript
{
    action: "checkValue",
    params: {
        selector: "#input-id"
    },
    expectedResult: { equals: "1000" }
}
```

### 5. **checkClass** - Verificar se elemento tem classe

```javascript
{
    action: "checkClass",
    params: {
        selector: "#input-id",
        className: "input-valid"
    },
    expectedResult: { equals: true }
}
```

### 6. **checkText** - Verificar texto de elemento

```javascript
{
    action: "checkText",
    params: {
        selector: "#mensagem-id"
    },
    expectedResult: { contains: "Sucesso" }
}
```

### 7. **checkVisible** - Verificar se elemento está visível

```javascript
{
    action: "checkVisible",
    params: {
        selector: "#modal-id"
    },
    expectedResult: { equals: true }
}
```

### 8. **custom** - Executar função customizada

```javascript
{
    action: "custom",
    params: {
        function: () => {
            // Seu código customizado aqui
            const resultado = window.minhaFuncao();
            return resultado;
        }
    },
    expectedResult: (result) => result === true
}
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Teste de Botão

"Eu quero testar se quando clicar no botão X, o modal Y aparece"

```javascript
addTest({
    name: "Teste de Abertura de Modal",
    description: "Verifica se modal abre ao clicar no botão",
    steps: [
        {
            description: "Clicar no botão de configurações",
            action: "click",
            params: { selector: "#settings-btn" }
        },
        {
            description: "Aguardar modal abrir",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se modal está visível",
            action: "checkVisible",
            params: { selector: "#settings-modal" },
            expectedResult: { equals: true }
        }
    ]
});
```

### Exemplo 2: Teste de Formulário Completo

"Eu quero testar se ao preencher todos os campos e clicar em submit, a mensagem de sucesso aparece"

```javascript
addTest({
    name: "Teste de Submissão de Formulário",
    description: "Preenche formulário e verifica sucesso",
    steps: [
        {
            description: "Preencher campo 1",
            action: "type",
            params: { selector: "#campo-1", value: "1000" }
        },
        {
            description: "Preencher campo 2",
            action: "type",
            params: { selector: "#campo-2", value: "2.5" }
        },
        {
            description: "Clicar em Submit",
            action: "click",
            params: { selector: "#submit-btn" }
        },
        {
            description: "Aguardar processamento",
            action: "wait",
            params: { duration: 500 }
        },
        {
            description: "Verificar mensagem de sucesso",
            action: "checkText",
            params: { selector: "#mensagem" },
            expectedResult: { contains: "Sucesso" }
        }
    ]
});
```

### Exemplo 3: Teste de Erro

"Eu quero testar se ao deixar campo vazio e clicar em submit, aparece erro"

```javascript
addTest({
    name: "Teste de Validação de Campo Obrigatório",
    description: "Verifica erro ao deixar campo vazio",
    steps: [
        {
            description: "Limpar campo (deixar vazio)",
            action: "type",
            params: { selector: "#campo-obrigatorio", value: "" }
        },
        {
            description: "Clicar em Submit",
            action: "click",
            params: { selector: "#submit-btn" }
        },
        {
            description: "Aguardar validação",
            action: "wait",
            params: { duration: 300 }
        },
        {
            description: "Verificar se campo tem classe de erro",
            action: "checkClass",
            params: {
                selector: "#campo-obrigatorio",
                className: "input-invalid"
            },
            expectedResult: { equals: true }
        }
    ]
});
```

---

## 🎨 TIPOS DE VALIDAÇÃO DE RESULTADO

### Igualdade Exata

```javascript
expectedResult: { equals: "valor esperado" }
expectedResult: { equals: true }
expectedResult: { equals: 1000 }
```

### Contém Texto

```javascript
expectedResult: { contains: "palavra" }
```

### Função Customizada

```javascript
expectedResult: (resultado) => {
    // Sua lógica de validação
    return resultado > 100;
}
```

---

## 📊 INTERPRETANDO RESULTADOS

Após executar os testes, você verá:

```
🧪 Iniciando execução de testes automatizados...
🏃 Executando: Teste de Campo Capital Inicial
  Passo 1: Focar no campo capital-inicial
  Passo 2: Digitar valor inválido
  Passo 3: Clicar fora para disparar validação
  Passo 4: Aguardar validação processar
  Passo 5: Verificar se campo ficou com erro
✅ Teste de Campo Capital Inicial: PASSED (450ms)

============================================================
📊 RELATÓRIO DE TESTES AUTOMATIZADOS
============================================================
Total de testes: 6
✅ Passou: 5
❌ Falhou: 1
💥 Erros: 0
📈 Taxa de sucesso: 83.33%
⏱️ Duração total: 2340ms
============================================================
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Elemento não encontrado"

**Causa:** Seletor CSS incorreto ou elemento não existe

**Solução:** Verifique se o seletor está correto:
```javascript
// Abra o console e teste:
document.querySelector("#seu-seletor");
```

### Problema: Teste falha por timing

**Causa:** Teste executa muito rápido, antes do elemento aparecer

**Solução:** Adicione um passo de wait:
```javascript
{
    action: "wait",
    params: { duration: 500 }  // Aumentar tempo
}
```

### Problema: Classe não é detectada

**Causa:** Validação ainda não processou

**Solução:** Adicione wait antes de verificar:
```javascript
{ action: "wait", params: { duration: 300 } },
{ action: "checkClass", ... }
```

---

## 🎯 BOAS PRÁTICAS

1. **Nomes Descritivos**
   - ✅ "Teste de Validação de Capital Inicial - Valor Inválido"
   - ❌ "Teste 1"

2. **Um Teste por Funcionalidade**
   - Cada teste deve testar UMA coisa específica

3. **Independência**
   - Testes não devem depender uns dos outros

4. **Waits Necessários**
   - Sempre aguarde após ações que disparam processos

5. **Descrições Claras**
   - Cada passo deve ter descrição do que faz

---

## ✨ PRÓXIMOS PASSOS

Agora você pode:

1. ✅ Criar seus próprios testes
2. ✅ Executar testes quando fizer mudanças
3. ✅ Garantir qualidade automática
4. ✅ Detectar bugs rapidamente

**Arquivo para adicionar testes:**  
`tests/validation-tests.js`

**Como adicionar novo teste:**
1. Abra `tests/validation-tests.js`
2. Copie um teste existente
3. Modifique para seu caso específico
4. Salve e execute!

---

**Versão:** 1.0.0  
**Data:** 23/11/2025  
**Status:** ✅ FUNCIONAL
