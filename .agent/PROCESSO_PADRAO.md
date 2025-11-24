# 📋 PROCESSO PADRÃO DE TRABALHO

**Este documento define o fluxo obrigatório a ser seguido em TODAS as tarefas do roadmap.**

---

## 🔄 FLUXO OBRIGATÓRIO PARA CADA TAREFA

### ✅ PRÉ-TAREFA (SEMPRE EXECUTAR)

1. **BACKUP AUTOMÁTICO**
   ```bash
   git add -A
   git commit -m "backup: Pré-tarefa #X - [Nome da Tarefa]"
   git tag "backup-pre-tarefa-X"
   ```

2. **ANÁLISE DA TAREFA**
   - Ler descrição completa no roadmap
   - Identificar arquivos afetados
   - Estimar tempo real
   - Listar riscos potenciais

3. **COMUNICAÇÃO PROATIVA**
   - Informar ao usuário:
     - Nome da tarefa
     - Arquivos que serão modificados
     - Tempo estimado
     - Próximos passos após conclusão

---

### 🚀 DURANTE A TAREFA

1. **Commits Incrementais**
   - Commit a cada subtarefa concluída
   - Mensagens descritivas e claras
   - Nunca acumular muitas mudanças

2. **Testes Contínuos**
   - Executar suite de testes após cada mudança
   - Validar que não quebrou funcionalidades

3. **Documentação em Tempo Real**
   - Atualizar documentos conforme avança
   - Não deixar documentação para o final

---

### ✅ PÓS-TAREFA (SEMPRE EXECUTAR)

1. **TESTES AUTOMATIZADOS**
   - Executar suite completa de testes
   - Validar todos os casos de uso
   - Gerar relatório de testes

2. **COMMIT FINAL**
   ```bash
   git add -A
   git commit -m "feat/fix: [Descrição completa da tarefa]"
   git tag "tarefa-X-completa"
   ```

3. **ATUALIZAR ROADMAP**
   - Marcar tarefa como concluída
   - Atualizar CHANGELOG
   - Documentar lições aprendidas

4. **INFORMAR PRÓXIMO PASSO AUTOMATICAMENTE**
   - **SEMPRE** informar qual é a próxima tarefa
   - Mostrar tempo estimado
   - Perguntar se deseja continuar

---

## 🛡️ REGRAS DE SEGURANÇA

### Antes de QUALQUER modificação:
1. ✅ Backup está feito?
2. ✅ Testes existem para validar?
3. ✅ Usuário foi informado do que vai acontecer?

### Antes de COMMITAR:
1. ✅ Código foi testado?
2. ✅ Documentação foi atualizada?
3. ✅ Mensagem do commit é clara?

---

## 📊 TEMPLATE DE INÍCIO DE TAREFA

```markdown
## 🎯 INICIANDO TAREFA #X: [NOME]

### ✅ PRÉ-REQUISITOS
- [x] Backup criado (commit: XXXXXXX)
- [x] Arquivos identificados: X, Y, Z
- [x] Testes preparados
- [x] Tempo estimado: Xh

### 📝 O QUE SERÁ FEITO
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### 🎯 RESULTADO ESPERADO
[Descrição do estado final]

### ⏭️ PRÓXIMA TAREFA APÓS CONCLUSÃO
Tarefa #Y: [Nome da próxima tarefa]
```

---

## 📊 TEMPLATE DE FIM DE TAREFA

```markdown
## ✅ TAREFA #X CONCLUÍDA: [NOME]

### 📊 RESULTADOS
- ✅ Commits: X
- ✅ Arquivos modificados: X
- ✅ Linhas adicionadas/removidas: +X/-Y
- ✅ Testes passando: X/X (100%)

### 📝 DOCUMENTAÇÃO
- ✅ CHANGELOG atualizado
- ✅ Guias criados/atualizados
- ✅ Comentários no código

### 🎯 PRÓXIMO PASSO
**Tarefa #Y: [NOME DA PRÓXIMA TAREFA]**
- Tempo estimado: Xh
- Arquivos afetados: A, B, C
- Descrição: [Breve descrição]

**Deseja continuar para a próxima tarefa?**
```

---

## ⚠️ LEMBRETES IMPORTANTES

1. **NUNCA** começar uma tarefa sem backup
2. **SEMPRE** informar o próximo passo
3. **SEMPRE** executar testes automatizados
4. **SEMPRE** documentar mudanças
5. **SEMPRE** commit incremental

---

**Este processo é OBRIGATÓRIO e deve ser seguido em TODAS as tarefas.**
