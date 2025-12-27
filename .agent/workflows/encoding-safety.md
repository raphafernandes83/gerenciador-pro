---
description: encoding-safety - Regras para evitar corrupção de encoding UTF-8
---

# 🛡️ Encoding Safety Protocol

## REGRAS ABSOLUTAS (Nunca violar)

### 1. UTF-8 Explícito SEMPRE

**Node.js - fs operations:**
```js
// ❌ ERRADO
fs.readFileSync('file.js');

// ✅ CERTO
fs.readFileSync('file.js', 'utf8');
```

**Node.js - HTTP responses:**
```js
res.setHeader('Content-Type', 'text/html; charset=utf-8');
res.setHeader('Content-Type', 'application/json; charset=utf-8');
```

**Buffer:**
```js
// ❌ ERRADO
Buffer.from(str);

// ✅ CERTO
Buffer.from(str, 'utf8');
```

### 2. Nunca Converter Encoding de Arquivos

**⚠️ PROIBIDO criar scripts que convertem encoding de arquivos existentes!**

Se um arquivo tem emojis corrompidos (ðŸ, âœ):
1. PRIMEIRO: Restaurar do backup mais recente
2. ÚLTIMO RECURSO: Fazer replace cirúrgico das strings específicas

### 3. Emojis São Sentinelas

Se `✅` vira `âœ…` → **O ENCODING MORREU ALI**

Tratar como **ERRO CRÍTICO**, não cosmético.

### 4. Verificação Antes de Salvar

Antes de salvar qualquer arquivo `.js`, `.html`, `.css`:
- Verificar se contém acentos/emojis
- Se sim, usar encoding UTF-8 sem BOM
- Nunca usar Latin-1, ISO-8859-1 ou Windows-1252

### 5. Padrões de Corrupção Conhecidos

| Corrompido | Original |
|------------|----------|
| âœ… | ✅ |
| ðŸ"¬ | 🔬 |
| ðŸš¨ | 🚨 |
| ðŸ'¤ | 👤 |
| NÃƒO | NÃO |
| PROTEÃ‡ÃƒO | PROTEÇÃO |
| Ã§ | ç |
| Ã£ | ã |
| Ã¢ | â |
| Ãª | ê |

## PROCEDIMENTO DE EMERGÊNCIA

Se detectar encoding corrompido:
1. **PARAR** imediatamente
2. **BACKUP** do estado atual
3. **RESTAURAR** do último backup limpo
4. **NÃO** tentar "converter" ou "corrigir" encoding automaticamente
