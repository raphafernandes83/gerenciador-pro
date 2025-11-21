# Guia de Desenvolvimento

## 📋 Visão Geral

Este documento contém informações importantes para o desenvolvimento do projeto.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
projeto/
├── index.html          # Página principal HTML
├── main.js            # Lógica principal JavaScript
├── style.css          # Estilos CSS
├── components/        # Componentes reutilizáveis
├── utils/            # Utilitários e helpers
└── docs/             # Documentação
```

### Padrões de Código

#### JavaScript

- Use ES6+ features
- Prefira `const` e `let` ao invés de `var`
- Use arrow functions quando apropriado
- Mantenha funções pequenas e focadas

#### CSS

- Use variáveis CSS para cores e espaçamentos
- Organize por seções com comentários
- Use flexbox e grid para layouts
- Mantenha responsividade em mente

#### HTML

- Use tags semânticas
- Mantenha acessibilidade em mente
- Use atributos `data-*` para JavaScript

## 🔧 Configuração de Desenvolvimento

### Pré-requisitos

- Editor de código (VS Code recomendado)
- Navegador moderno
- Git instalado
- Conta no Supabase

### Extensões Recomendadas (VS Code)

- Live Server
- Prettier
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

## 🚀 Workflow de Desenvolvimento

### 1. Configuração Inicial

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Entre na pasta
cd [NOME_DO_PROJETO]

# Configure o Git
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### 2. Desenvolvimento Diário

```bash
# Crie uma nova branch para features
git checkout -b feature/nova-funcionalidade

# Faça suas alterações
# ... código ...

# Commit suas alterações
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push para o repositório
git push origin feature/nova-funcionalidade
```

### 3. Integração

```bash
# Volte para a branch principal
git checkout main

# Atualize com as últimas mudanças
git pull origin main

# Merge da feature
git merge feature/nova-funcionalidade

# Push das mudanças
git push origin main
```

## 📝 Convenções de Commit

Use o padrão Conventional Commits:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de manutenção

Exemplo:

```bash
git commit -m "feat: adiciona sistema de autenticação"
git commit -m "fix: corrige bug no cálculo de resultados"
```

## 🧪 Testes

### Testes Manuais

1. Teste em diferentes navegadores
2. Teste responsividade em diferentes tamanhos de tela
3. Teste funcionalidades principais
4. Verifique console para erros

### Checklist de Qualidade

- [ ] Código está limpo e bem documentado
- [ ] Funcionalidades estão funcionando corretamente
- [ ] Interface está responsiva
- [ ] Não há erros no console
- [ ] Performance está adequada

## 🔍 Debugging

### Console do Navegador

Use `console.log()`, `console.error()`, `console.warn()` para debug:

```javascript
console.log('Dados recebidos:', data);
console.error('Erro na operação:', error);
console.warn('Aviso importante:', warning);
```

### Supabase

- Use o dashboard do Supabase para verificar dados
- Monitore logs de erro
- Teste queries diretamente no SQL Editor

## 📚 Recursos Úteis

### Documentação

- [MDN Web Docs](https://developer.mozilla.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Git Documentation](https://git-scm.com/doc)

### Ferramentas

- [Can I Use](https://caniuse.com/) - Compatibilidade de navegadores
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/)
- [Flexbox Froggy](https://flexboxfroggy.com/)

## 🚨 Problemas Comuns

### Supabase

**Problema:** Erro de conexão **Solução:** Verifique URL e chave da API

**Problema:** CORS error **Solução:** Configure origins no Supabase Dashboard

### Git

**Problema:** Conflitos de merge **Solução:** Resolva conflitos manualmente e
faça commit

**Problema:** Push rejeitado **Solução:** Faça pull primeiro para sincronizar

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}
