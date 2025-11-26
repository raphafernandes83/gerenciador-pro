# Script para adicionar inicializacao dos componentes UI no main.js

$mainJsPath = "C:/Users/Computador/OneDrive/Documentos/GERENCIADOR PRO/08 09 2025/main.js"

Write-Host "Iniciando correcoes no main.js..." -ForegroundColor Cyan

# Ler o arquivo
$content = Get-Content -Path $mainJsPath -Raw

# CORRECAO 1: Adicionar import do init-components.js
Write-Host "Adicionando import do init-components.js..." -ForegroundColor Yellow

$importPattern = "import { charts } from './charts.js';"
$importReplacement = "import { charts } from './charts.js';`r`n// CORRECAO CRITICA: Inicializacao dos componentes UI avancados (Modal, Timeline, Tabela)`r`nimport { initComponents } from './src/init-components.js';"

if ($content -match [regex]::Escape($importPattern)) {
    $content = $content -replace [regex]::Escape($importPattern), $importReplacement
    Write-Host "Import adicionado com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "Padrao de import nao encontrado!" -ForegroundColor Red
    exit 1
}

# CORRECAO 2: Adicionar chamada initComponents() apos mapDOM()
Write-Host "Adicionando chamada initComponents()..." -ForegroundColor Yellow

$callPattern = "        mapDOM();`r`n        this.initializationSteps.push('dom_mapped');`r`n`r`n        // 2. Inicia os módulos que não dependem do estado do utilizador"
$callReplacement = "        mapDOM();`r`n        this.initializationSteps.push('dom_mapped');`r`n`r`n        // CORRECAO CRITICA: Inicializa componentes UI avancados`r`n        initComponents();`r`n        this.initializationSteps.push('ui_components_initialized');`r`n        logger.debug('Componentes UI avancados inicializados!');`r`n`r`n        // 2. Inicia os módulos que não dependem do estado do utilizador"

if ($content -match [regex]::Escape($callPattern)) {
    $content = $content -replace [regex]::Escape($callPattern), $callReplacement
    Write-Host "Chamada initComponents() adicionada com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "Padrao de chamada nao encontrado!" -ForegroundColor Red
    exit 1
}

# Salvar o arquivo modificado
Set-Content -Path $mainJsPath -Value $content -NoNewline

Write-Host "Correcoes aplicadas com sucesso!" -ForegroundColor Green
Write-Host "Arquivo salvo: $mainJsPath" -ForegroundColor Cyan
