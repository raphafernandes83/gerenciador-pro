$file = "index.html"
$backup = "index.html.backup-" + (Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "=== CORREÇÃO COMPLETA DE ENCODING ===" -ForegroundColor Cyan
Write-Host ""

# Backup
Copy-Item $file $backup
Write-Host "✅ Backup: $backup" -ForegroundColor Green

# Ler arquivo
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "🔧 Aplicando correções..." -ForegroundColor Yellow

# MAPEAMENTO COMPLETO DE CARACTERES CORROMPIDOS
$replacements = @{
    # Vogais com til
    'Ã£' = 'ã'
    'Ãµ' = 'õ'
    'Ã'  = 'Ã'
    'Ãƒ' = 'Õ'
    
    # Vogais com acento agudo
    'Ã¡' = 'á'
    'Ã©' = 'é'
    'Ã­' = 'í'
    'Ã³' = 'ó'
    'Ãº' = 'ú'
    'Ã'  = 'Á'
    'Ã‰' = 'É'
    'Ã'  = 'Í'
    'Ã"' = 'Ó'
    'Ãš' = 'Ú'
    
    # Vogais com acento circunflexo
    'Ã¢' = 'â'
    'Ãª' = 'ê'
    'Ã´' = 'ô'
    'Ã‚' = 'Â'
    'ÃŠ' = 'Ê'
    'Ã"' = 'Ô'
    
    # Cedilha
    'Ã§' = 'ç'
    'Ã‡' = 'Ç'
    
    # Emojis (sequências específicas encontradas)
    'ðŸ"ˆ' = '📈'
    'ðŸ"„' = '🔄'
    'ðŸ"'' = '🔒'
    'ðŸ'¹' = '💹'
    'ðŸ'ï¸' = '👁️'
    'â¤¡' = '⤡'
    'Ã¢Å¡â„¢Ã¯Â¸Â' = '⚙️'
    'Ã°Å¸â€œÂ±' = '📱'
    'ðŸ§ª' = '🧪'
    'ðŸ"¥' = '🔥'
    'ðŸ'€' = '💀'
    'ðŸŽ¯' = '🎯'
    'â€' = '✅'
    'ðŸ"‰' = '📉'
    'ðŸ"ˆ' = '📈'
    'ðŸŸ¢' = '🟢'
    'ðŸ"´' = '�´'
    'ðŸ"Š' = '📊'
    
    # Símbolos comuns
    'Âº' = 'º'
    'Â°' = '°'
    'Â´' = '´'
    'Ã—' = '×'
    'Ã·' = '÷'
}

# Aplicar todas as substituições
foreach ($pair in $replacements.GetEnumerator()) {
    $content = $content -replace [regex]::Escape($pair.Key), $pair.Value
    Write-Host "  • $($pair.Key) → $($pair.Value)" -ForegroundColor Gray
}

# Salvar como UTF-8 sem BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, $utf8NoBom)

Write-Host ""
Write-Host "✅ Encoding corrigido!" -ForegroundColor Green
Write-Host "📁 Backup em: $backup" -ForegroundColor Cyan
