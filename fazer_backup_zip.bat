@echo off
setlocal

:: Lançador de Backup (.ZIP) — chama o PowerShell
:: Executa o backup do diretório onde este .bat está localizado.

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%backup_script_zip.ps1" -ProjectRoot "%SCRIPT_DIR%"

popd >nul
endlocal
