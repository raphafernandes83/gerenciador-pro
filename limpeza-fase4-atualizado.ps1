# Script de Limpeza Automatica - Fase 4 ATUALIZADO (OPCIONAL)
# Data: 2025-11-20
# Limpeza final baseada em analise real de uso

Write-Host "LIMPEZA AUTOMATICA - FASE 4 ATUALIZADO (OPCIONAL)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ATENCAO: Esta fase e OPCIONAL e remove arquivos NAO UTILIZADOS." -ForegroundColor Yellow
Write-Host "Analise completa foi realizada - apenas arquivos inutilizados serao removidos." -ForegroundColor Yellow
Write-Host ""
Write-Host "Arquivos que SERAO MANTIDOS (em uso):" -ForegroundColor Green
Write-Host "  - enhanced-donut-chart-system.js (Sistema de grafico ativo)" -ForegroundColor Green
Write-Host "  - layouts-centro-grafico.js (Layouts alternativos ativos)" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos que SERAO REMOVIDOS (nao utilizados):" -ForegroundColor Red
Write-Host "  - color-manager.js" -ForegroundColor Gray
Write-Host "  - dom-manager.js" -ForegroundColor Gray
Write-Host "  - panel-minimize-controller.js" -ForegroundColor Gray
Write-Host "  - performance-optimized-monitor.js" -ForegroundColor Gray
Write-Host "  - timeline-card-novo.js" -ForegroundColor Gray
Write-Host "  - timer-manager.js (duplicado, versao em src/ esta ativa)" -ForegroundColor Gray
Write-Host "  - ultimate-error-prevention-system.js" -ForegroundColor Gray
Write-Host "  - ultimate-meta-progress-blocker.js" -ForegroundColor Gray
Write-Host ""

# Perguntar confirmacao
$confirmacao = Read-Host "Deseja continuar? (S/N)"
if ($confirmacao -ne "S" -and $confirmacao -ne "s") {
    Write-Host ""
    Write-Host "Operacao cancelada pelo usuario." -ForegroundColor Yellow
    exit 0
}

$removidos = 0

# Funcao para remover arquivo
function Remove-SafeFile {
    param($path, $name)
    
    if (Test-Path $path) {
        try {
            Write-Host "Removendo: $name..." -NoNewline
            Remove-Item -Path $path -Force -ErrorAction Stop
            Write-Host " OK" -ForegroundColor Green
            return 1
        }
        catch {
            Write-Host " ERRO" -ForegroundColor Red
            Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
            return 0
        }
    }
    else {
        Write-Host "Nao encontrado: $name" -ForegroundColor Yellow
        return 0
    }
}

Write-Host ""
Write-Host "REMOVENDO ARQUIVOS JS NAO UTILIZADOS..." -ForegroundColor Yellow
Write-Host ""

# Arquivos JS nao utilizados (baseado em analise real)
$unusedJsFiles = @(
    "color-manager.js",
    "dom-manager.js",
    "panel-minimize-controller.js",
    "performance-optimized-monitor.js",
    "timeline-card-novo.js",
    "timer-manager.js",
    "ultimate-error-prevention-system.js",
    "ultimate-meta-progress-blocker.js"
)

$jsCount = 0
foreach ($file in $unusedJsFiles) {
    $jsCount += Remove-SafeFile $file $file
}

Write-Host ""
Write-Host "REMOVENDO SCRIPTS DE LIMPEZA ANTERIORES..." -ForegroundColor Yellow
Write-Host ""

# Remover scripts de limpeza anteriores (exceto este)
$cleanupScripts = @(
    "limpeza-fase1.ps1",
    "limpeza-fase2.ps1",
    "limpeza-fase3.ps1",
    "limpeza-fase4.ps1"  # O script antigo
)

$scriptCount = 0
foreach ($file in $cleanupScripts) {
    $scriptCount += Remove-SafeFile $file $file
}

Write-Host ""
Write-Host "MOVENDO MANUAL DO GERENCIADOR PARA DOCS..." -ForegroundColor Yellow
Write-Host ""

# Mover pasta MANUAL DO GERENCIADOR para docs/
$manualMoved = 0
if (Test-Path "MANUAL DO GERENCIADOR") {
    try {
        if (-not (Test-Path "docs\manual")) {
            New-Item -Path "docs\manual" -ItemType Directory -Force | Out-Null
        }
        
        Write-Host "Movendo: MANUAL DO GERENCIADOR..." -NoNewline
        Move-Item -Path "MANUAL DO GERENCIADOR\*" -Destination "docs\manual\" -Force -ErrorAction Stop
        Remove-Item -Path "MANUAL DO GERENCIADOR" -Force -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        $manualMoved = 1
    }
    catch {
        Write-Host " ERRO" -ForegroundColor Red
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "RESUMO DA LIMPEZA FASE 4:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Arquivos JS removidos: $jsCount" -ForegroundColor Green
Write-Host "Scripts de limpeza removidos: $scriptCount" -ForegroundColor Green
Write-Host "Pastas movidas: $manualMoved" -ForegroundColor Green
Write-Host ""
$total = $jsCount + $scriptCount + $manualMoved
Write-Host "TOTAL DE ITENS PROCESSADOS: $total" -ForegroundColor Green
Write-Host ""
Write-Host "ARQUIVOS MANTIDOS NA RAIZ:" -ForegroundColor Cyan
Write-Host "  - enhanced-donut-chart-system.js (EM USO)" -ForegroundColor Green
Write-Host "  - layouts-centro-grafico.js (EM USO)" -ForegroundColor Green
Write-Host ""
Write-Host "LIMPEZA FASE 4 CONCLUIDA!" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Teste a aplicacao para garantir que tudo funciona" -ForegroundColor White
Write-Host "2. Verifique se nao ha erros no console" -ForegroundColor White
Write-Host "3. Faca commit das mudancas no Git" -ForegroundColor White
Write-Host "4. Considere remover este script (limpeza-fase4-atualizado.ps1)" -ForegroundColor White
Write-Host ""
Write-Host "RELATORIO COMPLETO: ANALISE_ARQUIVOS_JS_RAIZ.md" -ForegroundColor Cyan
Write-Host ""
