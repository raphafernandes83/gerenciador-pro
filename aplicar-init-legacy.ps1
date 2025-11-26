# Script para adicionar script LEGACY ao index.html
$htmlPath = "index.html"

# Le o HTML
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# Remove script module antigo (se existir)
$html = $html -replace '(?s)\s*<!--\s*Inicializacao dos Componentes UI Modulares\s*-->.*?</script>', ''

# Script LEGACY a adicionar (ANTES do </body>)
$scriptToAdd = @"

    <!-- Inicializacao Componentes UI (LEGACY - sem ES6 modules) -->
    <script src="init-components-legacy.js"></script>
"@

# Substitui </body> por script + </body>
$htmlNovo = $html -replace '</body>', "$scriptToAdd`r`n</body>"

# Salva
$htmlNovo | Out-File -FilePath $htmlPath -Encoding UTF8 -NoNewline

Write-Host "Script LEGACY adicionado!"
Write-Host "Verifique: Get-Content index.html | Select-String init-components"
