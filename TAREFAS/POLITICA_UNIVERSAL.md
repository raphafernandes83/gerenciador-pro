# 📋 POLÍTICA UNIVERSAL — GERENCIADOR PRO

**Versão**: 1.0.0 **Data**: 01/01/2026 **Status**: ATIVO (Não Negociável)

---

## 1️⃣ BACKUP OBRIGATÓRIO

- **ANTES** de qualquer alteração: executar `.\fazer_backup.bat`
- Registrar na entrega:
    - Nome do backup gerado
    - Caminho completo do backup
    - Trecho final do log/saída do .bat (últimas linhas)

---

## 2️⃣ REINÍCIO REAL DO SERVIDOR

No final de **TODA tarefa**:

1. **STOP**: Parar o servidor (Ctrl+C ou kill PID)
    - Registrar 2-3 linhas finais do terminal
2. **START**: Subir novamente (`npm start`)
    - Registrar linhas confirmando "running/listening" na porta 3000
3. **BROWSER**: Hard refresh (Ctrl+Shift+R) + console sem erros

⚠️ "Servidor já ativo" **NÃO** conta como reinício real!

---

## 3️⃣ CSP (Content Security Policy)

- ❌ **PROIBIDO**: `<script>` inline no HTML
- ❌ **PROIBIDO**: `onclick=`, `onload=`, handlers inline
- ❌ **PROIBIDO**: `'unsafe-inline'` ou `'unsafe-eval'` no script-src
- ✅ Validar rodando via `server.js` + console sem erros de CSP

---

## 4️⃣ ENCODING (UTF-8)

- Padrão do projeto: **UTF-8**
- ❌ **PROIBIDO**: deixar `�` (U+FFFD) em strings exibidas
- ❌ **PROIBIDO**: mojibake (`Ã`, `Â`, `ðŸ`, `â€`) em runtime
- Em tarefa de cleanup: **ZERO ALVO** inclusive em comentários
- Validar com `npm run mojibake:scan` (0 ocorrências)

---

## 5️⃣ FLUXO DE TRABALHO

- Uma tarefa por vez
- Mudanças mínimas e rastreáveis
- Sem refatoração oportunista fora do escopo
- Se faltar info: pedir só o mínimo necessário
- Sempre sugerir próxima tarefa, mas só executar quando autorizado

---

## 6️⃣ STATUS / DoD (Definition of Done)

| Status         | Critério                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------- |
| ✅ **PASSOU**  | Objetivo 100%, sem regressões, provas entregues, escopo respeitado, reinício real evidenciado |
| ⚠️ **PARCIAL** | Sobrou pendência → listar + criar mini-tarefa imediata                                        |
| ❌ **FALHOU**  | Regressão, console com erros novos, quebra de execução, ou falta de evidência                 |

---

## 7️⃣ PROVAS OBRIGATÓRIAS

Toda entrega deve conter:

- [ ] Arquivos criados/alterados e NÃO alterados
- [ ] Backup ZIP (nome + caminho + log final)
- [ ] Contagem antes→depois (quando aplicável)
- [ ] Checklist de validação (server, hard refresh, Network 200, console limpo)
- [ ] Resumo do diff (quando possível)

---

## 8️⃣ RASTREIO DE TAREFAS

**Local**: `E:\GERENCIADOR PRO\08 09 2025\TAREFAS`

**Nome do arquivo**: `T0XX_YYYY-MM-DD_HHMM_BRT.md`

**Conteúdo obrigatório**:

- PROMPT original
- RESULTADO/LOGS
- Backup (nome + caminho)
- Evidências (scan, testes, console)
- Reinício real (STOP + START)
- Rollback (passo-a-passo usando ZIP)

---

## 9️⃣ COMANDOS DE VALIDAÇÃO

```bash
# Validação completa
npm run verify

# QA completo (verify + Playwright smoke)
npm run qa

# Scan de mojibake
npm run mojibake:scan

# Teste de falso positivo PT-BR
npm run mojibake:test

# Guard de encoding
npm run guard:encoding
```

---

## 🔟 FORMATO DO RELATÓRIO FINAL

```
✅ Status (PASSOU/FALHOU/PARCIAL + risco real)
📦 Backup (nome + caminho + log final)
📁 Arquivos (Criados/Alterados/NÃO alterados)
✂️ Mudanças (antes→depois, linhas/blocos)
🔎 Validação (console/network/fluxos)
🔁 Reinício REAL (STOP+START evidenciado)
🧯 Rollback (passo-a-passo usando o ZIP)
```

---

**Esta política é NÃO NEGOCIÁVEL e deve ser aplicada em TODAS as tarefas.**
