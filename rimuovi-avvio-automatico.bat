@echo off
cd /d "%~dp0"
title Sossoldi - Rimuovi Avvio Automatico
echo ============================================================
echo       SOSSOLDI - DISATTIVAZIONE AVVIO AUTOMATICO
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$startup = [Environment]::GetFolderPath('Startup'); " ^
    "$link = Join-Path $startup 'Sossoldi.lnk'; " ^
    "if (Test-Path $link) { Remove-Item $link -Force; Write-Host '[OK] Avvio automatico rimosso con successo.' -ForegroundColor Green } else { Write-Host '[INFO] Nessun avvio automatico era presente.' -ForegroundColor Yellow }"

echo.
pause
