# 🔍 Mojibake Hunter

Scanner de caracteres corrompidos (mojibake) para o projeto Gerenciador PRO.

## Uso

```bash
# Via npm script
npm run mojibake:scan

# Diretamente
node tools/mojibake_hunter/mojibake-hunter.cjs --mode=scan
```

## O que detecta

| Padrão | Descrição | Exemplo |
|--------|-----------|---------|
| REPLACEMENT_CHAR | Replacement character (U+FFFD) | � |
| EMOJI_MOJIBAKE | Emoji corrompido | ðŸ |
| QUOTE_MOJIBAKE | Aspas corrompidas | â€™ â€œ |
| ORDINAL_MOJIBAKE | Ordinais corrompidos | Âª Âº |
| DOUBLE_ENCODED_LATIN | UTF-8 double-encoded | Ã£ Ã© Ã§ |

## Exclusões

Pastas automaticamente ignoradas:
- `backup_*`
- `temp_*`
- `reports/`
- `node_modules/`
- `dist/`
- `build/`
- `.git/`

## Relatórios

Gerados em `reports/mojibake/`:
- `SCAN_YYYYMMDD-HHMMSS.md` - Relatório Markdown
- `SCAN_YYYYMMDD-HHMMSS.csv` - Dados para análise

## Exit Codes

- `0`: Nenhum mojibake encontrado
- `1`: Mojibake detectado (ver relatório)
