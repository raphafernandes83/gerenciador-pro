# 📝 TEMPLATE — Modelo de Tarefa

**Copiar este arquivo para criar nova tarefa** **Nome**:
`T0XX_YYYY-MM-DD_HHMM_BRT.md`

---

# TAREFA XX — [Título da Tarefa]

**Data/Hora (BRT)**: YYYY-MM-DD HH:MM

---

## 📋 PROMPT ORIGINAL

```
[Colar o prompt completo aqui]
```

---

## 📦 BACKUP

- **Nome**: `[nome do arquivo].zip`
- **Caminho**: `E:\GERENCIADOR PRO\BACKUP\[nome].zip`
- **Log final**:

```
[Últimas linhas do fazer_backup.bat]
```

---

## 📁 ARQUIVOS

### Criados

- [ ] `[caminho/arquivo]`

### Alterados

- [ ] `[caminho/arquivo]` — [descrição da mudança]

### NÃO Alterados

- [ ] `ui.js`, `main.js`, `index.html`, `style.css`, `src/**`

---

## ✂️ MUDANÇAS (Diff)

```diff
- [linha removida]
+ [linha adicionada]
```

---

## 🔎 VALIDAÇÃO

### npm run verify

```
✅ mojibake:test → XX/XX
✅ mojibake:scan → 0 ocorrências
✅ node --check → OK
✅ guard:encoding → PASSOU
```

### Browser

- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Console sem erros novos
- [ ] Network 200 OK

---

## 🔁 REINÍCIO REAL

### STOP

```
[Linhas do terminal mostrando STOP]
```

### START

```
🚀 Servidor modernizado rodando em http://localhost:3000
```

### Browser pós-START

- [ ] Página carrega OK
- [ ] Console limpo
- [ ] Fluxos críticos funcionando

---

## 🧯 ROLLBACK

```powershell
Expand-Archive -Path "E:\GERENCIADOR PRO\BACKUP\[nome].zip" -DestinationPath ".\restore_TXX" -Force
```

---

## ✅ STATUS FINAL

| Critério          | Resultado |
| ----------------- | --------- |
| Objetivo cumprido | ✅/❌     |
| Sem regressões    | ✅/❌     |
| Provas entregues  | ✅/❌     |
| Reinício REAL     | ✅/❌     |

**STATUS**: ✅ PASSOU / ⚠️ PARCIAL / ❌ FALHOU

---

## 💡 PRÓXIMA TAREFA SUGERIDA

[Descrever brevemente a próxima tarefa recomendada, se houver]

---

_Arquivo gerado em conformidade com POLITICA_UNIVERSAL.md_
