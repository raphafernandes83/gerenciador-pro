# Configurações
$winrarPath = "C:\Program Files\WinRAR\WinRAR.exe"
$destPath = "C:\Users\Computador\OneDrive\Documentos\GERENCIADOR PRO\BACKUP"

# 1. Gerar Nome
$timestamp = Get-Date -Format "dd MM yyyy HH\hmm\m"
$filename = "$timestamp.rar"

Write-Host "--- SISTEMA DE BACKUP AUTOMÁTICO ---" -ForegroundColor Cyan
Write-Host "Arquivo: $filename" -ForegroundColor Gray

# 2. Verificar/Criar Pasta
if (-not (Test-Path -Path $destPath)) {
    Write-Host "Criando pasta de backup..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $destPath | Out-Null
}

$finalPath = Join-Path $destPath $filename
Write-Host "Destino: $finalPath" -ForegroundColor Green

# 3. Executar WinRAR
if (Test-Path $winrarPath) {
    Write-Host "Iniciando compactação..." -ForegroundColor Cyan
    
    # Argumentos para o WinRAR
    # a : adicionar
    # -r : recursivo
    # -x : excluir
    # -ep1 : excluir caminho base
    # NOTA: node_modules continua excluído por ser recriável via npm install
    $rarArgs = @("a", "-r", "-xnode_modules", "-x*.rar", "-x*.zip", "`"$finalPath`"", "*")
    
    $process = Start-Process -FilePath $winrarPath -ArgumentList $rarArgs -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCESSO! Backup salvo em:" -ForegroundColor Green
        Write-Host $finalPath -ForegroundColor White
    }
    else {
        Write-Host ""
        Write-Host "❌ ERRO: O WinRAR retornou código $($process.ExitCode)." -ForegroundColor Red
    }
}
else {
    Write-Host ""
    Write-Host "❌ ERRO CRÍTICO: WinRAR não encontrado em $winrarPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione ENTER para sair..."
Read-Host
