$file = "c:\Users\Computador\OneDrive\Documentos\GERENCIADOR PRO\08 09 2025\index.html"

Write-Host "Convertendo index.html para UTF-8..." -ForegroundColor Cyan

# Criar backup
$backup = "$file.before-utf8-fix"
Copy-Item $file $backup
Write-Host "Backup criado: $backup" -ForegroundColor Green

# Ler com encoding ISO-8859-1 (o encoding atual errado)
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::GetEncoding("ISO-8859-1"))

# Salvar como UTF-8 sem BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)

Write-Host "Arquivo convertido para UTF-8!" -ForegroundColor Green
Write-Host "Reinicie o servidor" -ForegroundColor Yellow
