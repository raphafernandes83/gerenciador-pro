$file = "index.html"
$backup = "index.html.backup-final"

Write-Host "=== CORREÇÃO ENCODING ===" -ForegroundColor Cyan

Copy-Item $file $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Green

$content = Get-Content $file -Raw -Encoding UTF8

# Vogais com til
$content = $content -replace 'Ã£', 'ã'
$content = $content -replace 'Ãµ', 'õ'
$content = $content -replace 'ÃƒÂ£', 'ã'
$content = $content -replace 'ÃƒÂµ', 'õ'

# Vogais acento agudo
$content = $content -replace 'Ã¡', 'á'
$content = $content -replace 'Ã©', 'é'
$content = $content -replace 'Ã­', 'í'
$content = $content -replace 'Ã³', 'ó'
$content = $content -replace 'Ãº', 'ú'
$content = $content -replace 'Ãš', 'Ú'

# Acento circunflexo
$content = $content -replace 'Ã¢', 'â'
$content = $content -replace 'Ãª', 'ê'
$content = $content -replace 'Ã´', 'ô'

# Cedilha
$content = $content -replace 'Ã§', 'ç'
$content = $content -replace 'Ã‡', 'Ç'

# Salvar UTF-8
$utf8 = New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText((Resolve-Path $file).Path, $content, $utf8)

Write-Host "Encoding corrigido!" -ForegroundColor Green
