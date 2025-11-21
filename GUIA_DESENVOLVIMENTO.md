# 🚀 Guia Rápido de Desenvolvimento

## ✅ Status do Ambiente

- ✅ **Node.js**: v24.5.0
- ✅ **npm**: v11.5.1
- ✅ **Git**: v2.50.1
- ✅ **Todas as dependências**: Instaladas

---

## 🎯 Comandos Principais

### **Iniciar o Servidor**

#### Modo Produção (básico)
```bash
npm start
```
Inicia o servidor Node.js básico na porta 3000.

#### Modo Desenvolvimento (com auto-reload) ⭐ RECOMENDADO
```bash
npm run dev
```
Usa **nodemon** para reiniciar automaticamente quando você salvar arquivos.

#### Live Server (com reload automático do navegador)
```bash
npm run dev:live      # Não abre o navegador automaticamente
npm run dev:open      # Abre o navegador automaticamente
```

---

## 🧹 Qualidade de Código

### Formatação e Linting
```bash
npm run lint          # Corrige problemas de JavaScript automaticamente
npm run format        # Formata todos os arquivos
npm run stylelint     # Verifica CSS
npm run clean         # Executa lint + format + audit fix
```

### Testes
```bash
npm test              # Executa testes Playwright
npm run test:headed   # Testes com navegador visível
npm run test:debug    # Modo debug
```

---

## 🔒 Segurança e Atualizações

### Verificar Vulnerabilidades
```bash
npm run audit:security    # Verifica vulnerabilidades
npm run audit:fix         # Corrige vulnerabilidades automaticamente
```

### Atualizar Dependências
```bash
npm run update:check      # Verifica atualizações disponíveis
npm run update:deps       # Atualiza todas as dependências
```

---

## ✨ Ferramentas Instaladas

### 1. **nodemon**
Auto-reinicia o servidor quando você salva arquivos.

### 2. **live-server**
Servidor com live-reload do navegador (atualiza automaticamente).

### 3. **npm-check-updates (ncu)**
Verifica e atualiza dependências do projeto.

### 4. **concurrently**
Executa múltiplos comandos simultaneamente.

### 5. **Playwright**
Framework de testes end-to-end.

### 6. **ESLint + Prettier + Stylelint**
Ferramentas de qualidade de código.

---

## 🎨 Workflow Recomendado

### Durante o Desenvolvimento:
1. **Inicie o servidor em modo dev:**
   ```bash
   npm run dev
   ```

2. **Abra o navegador em:** http://localhost:3000

3. **Faça suas alterações** - o servidor reinicia automaticamente!

### Antes de Commit:
```bash
npm run clean        # Limpa e formata o código
npm test             # Executa os testes
```

### Validação Completa:
```bash
npm run validate     # Executa todos os checks (CI)
```

---

## 🐛 Solução de Problemas

### Servidor não inicia?
```bash
# Verifique se a porta 3000 está livre
netstat -ano | findstr :3000

# Se estiver ocupada, mate o processo ou mude a porta no server.js
```

### Dependências com problemas?
```bash
# Reinstale tudo do zero
rm -rf node_modules package-lock.json
npm install
```

### Vulnerabilidades detectadas?
```bash
npm run audit:fix
```

---

## 📝 Atalhos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Servidor básico |
| `npm run dev` | Servidor com auto-reload ⭐ |
| `npm run dev:open` | Live server + abre navegador |
| `npm run clean` | Limpa código |
| `npm test` | Testes |
| `npm run validate` | Validação completa |
| `npm run update:check` | Verifica atualizações |

---

## 🎯 Próximos Passos Sugeridos

1. ✅ **Corrigir vulnerabilidades** (9 detectadas):
   ```bash
   npm run audit:fix
   ```

2. ✅ **Usar sempre `npm run dev`** durante desenvolvimento

3. ✅ **Configurar Git hooks** (já configurado com Husky)

4. ✅ **Executar `npm run clean`** antes de commits importantes

---

## 💡 Dicas Pro

- Use **`npm run dev`** ao invés de `npm start` - muito mais produtivo!
- Execute **`npm run clean`** regularmente para manter o código limpo
- Use **`npm run validate`** antes de fazer push para garantir qualidade
- Mantenha as dependências atualizadas com **`npm run update:check`**

---

**Criado em:** 2025-11-21  
**Última atualização:** 2025-11-21
