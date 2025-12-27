# ============================================================================
# SCRIPT DE CORREÇÃO DE ENCODING - charts.js
# ============================================================================
# Projeto: Gerenciador PRO v9.3
# Data: 26/12/2025
# Objetivo: Corrigir caracteres corrompidos (U+FFFD) em comentários e logs
# IMPORTANTE: Não altera strings de UI (linha 332 preservada)
# ============================================================================

$file = "charts.js"
$backupTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$file.backup-encoding-$backupTimestamp"

# Criar backup adicional
Copy-Item $file $backup
Write-Host "Backup criado: $backup" -ForegroundColor Green

# Ler arquivo
$content = Get-Content $file -Raw -Encoding UTF8

# ============================================================================
# CORREÇÕES DE ENCODING - Categoria A (Comentários) + B (Logs)
# ============================================================================

# Padrões comuns de acentos corrompidos -> corretos
$replacements = @{
    # Acentuação básica
    "transi��o" = "transição"
    "GR�FICO" = "GRÁFICO"
    "RECONSTRU�DO" = "RECONSTRUÍDO"
    "dispon�vel" = "disponível"
    "c�lculos" = "cálculos"
    "m�nimo" = "mínimo"
    "necess�rio" = "necessário"
    "gr�fico" = "gráfico"
    "m�todo" = "método"
    "n�o" = "não"
    "N�O" = "NÃO"
    "PROTE��O" = "PROTEÇÃO"
    "C�DIGO" = "CÓDIGO"
    "reinicializa��o" = "reinicialização"
    "j�" = "já"
    "Valida��o" = "Validação"
    "diagn�stico" = "diagnóstico"
    "CORRE��O" = "CORREÇÃO"
    "sobreposi��o" = "sobreposição"
    "exibi��o" = "exibição"
    "hist�rico" = "histórico"
    "sess�o" = "sessão"
    "estat�sticas" = "estatísticas"
    "preju�zo" = "prejuízo"
    "duplica��o" = "duplicação"
    "inicializa��o" = "inicialização"
    
    # Logs com emoji corrompido no início (remover símbolos quebrados)
    "logger.debug(``� " = "logger.debug(``⚠️ "
    "logger.error('� " = "logger.error('❌ "
    "logger.warn('�� " = "logger.warn('⚠️ "
    
    # Comentários com emojis corrompidos
    "// 🛡�" = "// 🛡️"
    "// �" = "// ❌"
}

# Aplicar substituições
$changeCount = 0
foreach ($pattern in $replacements.Keys) {
    $replacement = $replacements[$pattern]
    if ($content -match [regex]::Escape($pattern)) {
        $content = $content -replace [regex]::Escape($pattern), $replacement
        $changeCount++
        Write-Host "  Corrigido: $pattern -> $replacement" -ForegroundColor Cyan
    }
}

# ============================================================================
# VERIFICAÇÃO: Linha 332 NÃO deve ser alterada (Categoria C - UI)
# ============================================================================
if ($content -match "const icon = lock\.type === 'STOP_WIN' \? '🎯' : '��';") {
    Write-Host "⚠️ Linha 332 preservada (Categoria C - UI)" -ForegroundColor Yellow
}

# Salvar arquivo
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, [System.Text.Encoding]::UTF8)

Write-Host "`n✅ Correção concluída!" -ForegroundColor Green
Write-Host "   Padrões aplicados: $changeCount" -ForegroundColor White
Write-Host "   Backup: $backup" -ForegroundColor White
