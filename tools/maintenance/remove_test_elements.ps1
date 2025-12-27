# Script para remover elementos de teste/desenvolvimento
$ErrorActionPreference = "Stop"

Write-Host "🔧 Removendo elementos de teste..." -ForegroundColor Cyan

# 1. Remover Showroom do sidebar.js
$sidebarFile = "sidebar.js"
if (Test-Path $sidebarFile) {
    $content = Get-Content $sidebarFile -Raw
    # Remove linha do Showroom
    $content = $content -replace "\s*\{\s*id:\s*'showroom',\s*icon:\s*'🧪',\s*label:\s*'Showroom',\s*order:\s*6\s*\},?\r?\n?", ""
    # Remove case showroom do switch
    $content = $content -replace "case\s+'showroom':\s*\r?\n\s*content\s*=\s*this\.renderShowroomContent\(\);\s*\r?\n\s*break;\s*\r?\n?", ""
    [System.IO.File]::WriteAllText((Resolve-Path $sidebarFile).Path, $content)
    Write-Host "✅ Showroom removido do sidebar.js" -ForegroundColor Green
}

# 2. Renomear script de testes funcionais para desabilitar
$testScript = "tests\add-functional-test-button.js"
if (Test-Path $testScript) {
    $newName = "tests\add-functional-test-button.js.disabled"
    Move-Item $testScript $newName -Force
    Write-Host "✅ Script de Testes Funcionais desabilitado" -ForegroundColor Green
}

# 3. Comentar import do script no index.html (se existir)
$indexFile = "index.html"
if (Test-Path $indexFile) {
    $content = Get-Content $indexFile -Raw
    $content = $content -replace '(<script\s+src="tests/add-functional-test-button\.js"[^>]*>)', '<!-- $1 (desabilitado) -->'
    [System.IO.File]::WriteAllText((Resolve-Path $indexFile).Path, $content)
    Write-Host "✅ Import do script de testes comentado no index.html" -ForegroundColor Green
}

Write-Host "`n✅ Remoções concluídas!" -ForegroundColor Green
