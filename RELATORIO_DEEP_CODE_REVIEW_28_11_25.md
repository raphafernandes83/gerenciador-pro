# Relatório Técnico: Deep Code Review - Backend & Persistência
**Data:** 28/11/2025
**Contexto:** Análise de segurança, performance e arquitetura do servidor Node.js e gerenciamento de dados locais.

---

## 🚨 1. Segurança (Crítico)

### 1.1. Vulnerabilidade de Path Traversal (Directory Traversal)
- **Arquivo:** `server.js` (Linha 22)
- **Gravidade:** 🔴 **CRÍTICA**
- **O Problema:** O servidor concatena o input do usuário (`req.url`) diretamente com o diretório raiz usando `path.join(__dirname, filePath)`.
- **Risco:** Um atacante pode enviar uma requisição como `GET /../../windows/win.ini` para acessar arquivos fora da pasta do projeto. O `access` apenas verifica existência, não permissão de escopo.
- **Correção Recomendada:** Normalizar o path e verificar se ele inicia com o `__dirname` permitido antes de ler.

### 1.2. Ausência de Headers de Segurança
- **Arquivo:** `server.js`
- **Gravidade:** 🟠 **ALTA**
- **O Problema:** Respostas HTTP não incluem headers de proteção como `Content-Security-Policy`, `X-Frame-Options` ou `Strict-Transport-Security`.
- **Risco:** Expõe a aplicação a ataques de XSS, Clickjacking e MIME Sniffing.
- **Correção Recomendada:** Implementar middleware para injetar headers de segurança padrão (similar ao Helmet).

### 1.3. Armazenamento de Dados Sensíveis sem Criptografia
- **Arquivo:** `src/backup/BackupManager.js`
- **Gravidade:** 🟡 **MÉDIA**
- **O Problema:** Dados financeiros e histórico de trading são salvos em `localStorage` em texto plano (apenas Base64, que não é criptografia).
- **Risco:** Qualquer script malicioso (XSS) injetado na página pode ler todo o histórico financeiro do usuário.
- **Correção Recomendada:** Criptografar o payload JSON antes de salvar no Storage.

---

## ⚡ 2. Performance e Escalabilidade

### 2.1. Leitura de Arquivos em Memória (Memory DoS)
- **Arquivo:** `server.js` (Linha 51 - `readFile`)
- **Gravidade:** 🟠 **ALTA**
- **O Problema:** O servidor lê o arquivo inteiro para a RAM antes de enviar.
- **Risco:** Se múltiplos usuários pedirem arquivos grandes, ou um atacante pedir um arquivo gigante repetidamente, o servidor cairá por falta de memória (OOM).
- **Correção Recomendada:** Utilizar `createReadStream` e `pipe` para enviar o arquivo em pedaços (chunks), mantendo o uso de RAM baixo e constante.

### 2.2. Bloqueio da Main Thread no Backup
- **Arquivo:** `src/backup/BackupManager.js`
- **Gravidade:** 🟡 **MÉDIA**
- **O Problema:** Operações síncronas pesadas (`JSON.stringify` em objetos grandes + `btoa`) rodam na thread principal.
- **Risco:** Congelamento da interface (UI jank) durante backups automáticos.
- **Correção Recomendada:** Mover compressão para Web Worker ou usar `CompressionStream` (assíncrono).

---

## 🛠️ 3. Robustez e Manutenibilidade

### 3.1. Código Incompatível com ESM
- **Arquivo:** `server-nocache.js`
- **Gravidade:** 🟠 **ALTA**
- **O Problema:** Uso de `delete require.cache` em um projeto configurado como ES Modules (`"type": "module"` no package.json). Isso causará crash se executado.
- **Correção Recomendada:** Remover este arquivo, pois é redundante e quebrado. O controle de cache deve ser feito via Headers HTTP no `server.js` principal.

### 3.2. Tratamento de Erros Genérico
- **Arquivo:** `server.js`
- **Gravidade:** 🟡 **MÉDIA**
- **O Problema:** Catch genérico retorna 500 para tudo.
- **Correção Recomendada:** Diferenciar erros de "Arquivo não encontrado" (404), "Acesso negado" (403) e "Erro interno" (500).

---

## 🧹 4. Higiene do Projeto (Housekeeping)

Arquivos identificados para remoção/limpeza:
1.  `server-nocache.js` (Quebrado/Obsoleto)
2.  `temp_from_server.html` (Lixo de debug)
3.  `temp_style.css` (Lixo de debug)
4.  `*.backup` e `*.backup-*` (Backups antigos poluindo a raiz)
5.  `roadmap *.md` (Consolidar roadmaps antigos)

---

## ✅ Conclusão
O backend precisa de correções imediatas de segurança (`server.js`) antes de qualquer nova feature. A estrutura de backup é funcional mas precisa de otimização para não impactar a UX.
