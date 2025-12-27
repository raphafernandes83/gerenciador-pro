# CSP Cleanup Script - Remove scripts inline do index.html
# Projeto: Gerenciador PRO v9.3
# Data: 27/12/2025

$file = "index.html"
$backup = "$file.backup-CSP-CLEAN-" + (Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "========================================"
Write-Host " CSP CLEANUP - Remover Scripts Inline"
Write-Host "========================================"
Write-Host ""

# Backup
Write-Host "[1/4] Criando backup..."
Copy-Item $file $backup
Write-Host "    Backup: $backup"

# Ler conteudo
Write-Host "[2/4] Lendo arquivo..."
$content = Get-Content $file -Raw -Encoding UTF8
$originalLength = $content.Length
Write-Host "    Tamanho original: $originalLength bytes"

# Contar scripts inline antes
$inlineCount = ([regex]::Matches($content, '<script>(?!</script>)')).Count
Write-Host "    Scripts inline encontrados: $inlineCount"

# REMOVER TODOS OS SCRIPTS INLINE DE UMA VEZ
Write-Host "[3/4] Removendo scripts inline..."

# Pattern generico para script inline (sem src)
# Remove <script> ... </script> mas NAO <script src="..."></script>
$patternInline = '(?s)<script>(?!.*?</script>\s*<script).*?</script>\s*'

$iterations = 0
$maxIterations = 10

while ($content -match '<script>[^<]' -and $iterations -lt $maxIterations) {
    $before = $content.Length
    
    # Remove o primeiro script inline encontrado
    $content = [regex]::Replace($content, '(?s)(<!\-\- [^>]* \-\->)?\s*<script>\s*[^<].*?</script>\s*', '', [System.Text.RegularExpressions.RegexOptions]::Singleline, [timespan]::FromSeconds(5))
    
    $after = $content.Length
    $removed = $before - $after
    
    if ($removed -eq 0) { break }
    
    $iterations++
    Write-Host "    Iteracao $iterations`: Removido $removed bytes"
}

# REMOVER BYTES NUL E LIXO FINAL
Write-Host "[4/4] Removendo bytes NUL e lixo final..."

# Remove tudo apos </html> incluindo NUL bytes
$content = $content -replace '(?s)(</html>)\s*[^\s].*$', '$1'
$content = $content + "`r`n"

# Remove chars nulos restantes
$content = $content -replace '\x00+', ''

$finalLength = $content.Length

# Salvar
Write-Host ""
Write-Host "Salvando arquivo limpo..."
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, [System.Text.Encoding]::UTF8)

# Contar scripts inline depois
$inlineCountAfter = ([regex]::Matches($content, '<script>(?!</script>)')).Count

# Relatorio
Write-Host ""
Write-Host "========================================"
Write-Host " RELATORIO FINAL"
Write-Host "========================================"
Write-Host ""
Write-Host "  Tamanho original:  $originalLength bytes"
Write-Host "  Tamanho final:     $finalLength bytes"
Write-Host "  Total removido:    $($originalLength - $finalLength) bytes"
Write-Host ""
Write-Host "  Scripts inline antes:  $inlineCount"
Write-Host "  Scripts inline depois: $inlineCountAfter"
Write-Host ""
Write-Host "  Backup salvo em:   $backup"
Write-Host ""
Write-Host "CONCLUIDO!"
