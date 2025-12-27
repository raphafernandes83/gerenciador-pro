# Encoding Fix Script for charts.js
# Project: Gerenciador PRO v9.3
# Date: 27/12/2025

$file = "charts.js"
$backup = "$file.backup-ENCODING-" + (Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ENCODING FIX - charts.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backup
Write-Host "[1/4] Creating backup..." -ForegroundColor Yellow
Copy-Item $file $backup
Write-Host "    Backup: $backup" -ForegroundColor Green

# Read file
Write-Host "[2/4] Reading file..." -ForegroundColor Yellow
$content = Get-Content $file -Raw -Encoding UTF8
$originalLength = $content.Length

# Count issues before
$replacementCharBefore = ([regex]::Matches($content, [char]0xFFFD)).Count
Write-Host "    Replacement chars (U+FFFD) before: $replacementCharBefore" -ForegroundColor Gray

# Apply fixes
Write-Host "[3/4] Applying encoding fixes..." -ForegroundColor Yellow

# Fix mojibake patterns (common Windows-1252 to UTF-8 issues)
$fixes = @{
    # Accented vowels
    'estat�sticas'  = 'estatisticas'
    'dispon�vel'    = 'disponivel'
    'gr�fico'       = 'grafico'
    'diagn�stico'   = 'diagnostico'
    'v�lida'        = 'valida'
    'inv�lida'      = 'invalida'
    'valida��o'     = 'validacao'
    'inicializa��o' = 'inicializacao'
    'duplica��o'    = 'duplicacao'
    'configura��es' = 'configuracoes'
    'sobreposi��o'  = 'sobreposicao'
    'exibi��o'      = 'exibicao'
    'atualiza��o'   = 'atualizacao'
    'corre��o'      = 'correcao'
    'CORRE��O'      = 'CORRECAO'
    'PROTE��O'      = 'PROTECAO'
    'Valida��o'     = 'Validacao'
    'hist�rico'     = 'historico'
    'sess�o'        = 'sessao'
    'poss�vel'      = 'possivel'
    'indispon�vel'  = 'indisponivel'
    'preju�zo'      = 'prejuizo'
    'consist�ncia'  = 'consistencia'
    'par�metros'    = 'parametros'
    'n�o'           = 'nao'
    'j�'            = 'ja'
    '�'             = 'e'
    'C�DIGO'        = 'CODIGO'
    'Refer�ncias'   = 'Referencias'
    'refor�adas'    = 'reforcadas'
    
    # Broken emojis - replace with ASCII equivalents for logs
    '��'            = '[WARN]'
    '�'             = '[ERROR]'
    '🛡�'           = '[SHIELD]'
    '🔎'            = '[SEARCH]'
    '???'           = '[CHECK]'
    '??'            = '[INFO]'
}

$totalFixes = 0
foreach ($pattern in $fixes.Keys) {
    $replacement = $fixes[$pattern]
    $count = ([regex]::Matches($content, [regex]::Escape($pattern))).Count
    if ($count -gt 0) {
        $content = $content -replace [regex]::Escape($pattern), $replacement
        $totalFixes += $count
        Write-Host "    Fixed '$pattern' -> '$replacement' ($count occurrences)" -ForegroundColor Gray
    }
}

# Remove any remaining replacement characters
$content = $content -replace [char]0xFFFD, ''

# Count issues after
$replacementCharAfter = ([regex]::Matches($content, [char]0xFFFD)).Count

# Save file
Write-Host "[4/4] Saving file as UTF-8..." -ForegroundColor Yellow
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, [System.Text.Encoding]::UTF8)

$finalLength = $content.Length

# Report
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " REPORT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Original size:    $originalLength bytes" -ForegroundColor White
Write-Host "  Final size:       $finalLength bytes" -ForegroundColor White
Write-Host "  Total fixes:      $totalFixes patterns" -ForegroundColor Cyan
Write-Host ""
Write-Host "  U+FFFD before:    $replacementCharBefore" -ForegroundColor White
Write-Host "  U+FFFD after:     $replacementCharAfter" -ForegroundColor $(if ($replacementCharAfter -eq 0) { "Green" }else { "Red" })
Write-Host ""
Write-Host "  Backup saved to:  $backup" -ForegroundColor Gray
Write-Host ""
Write-Host "DONE!" -ForegroundColor Green
