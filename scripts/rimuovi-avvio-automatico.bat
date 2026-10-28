@echo off
cd /d "%~dp0"
title Sossoldi - Rimuovi Avvio Automatico
echo ============================================================
echo       SOSSOLDI - DISATTIVAZIONE AVVIO AUTOMATICO
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$removed = $false; " ^
    "$task = Get-ScheduledTask -TaskName 'SossoldiAutoStart' -ErrorAction SilentlyContinue; " ^
    "if ($task) { Unregister-ScheduledTask -TaskName 'SossoldiAutoStart' -Confirm:$false; $removed = $true; Write-Host '[OK] Attivita'' pianificata rimossa.' -ForegroundColor Green }; " ^
    "$startup = [Environment]::GetFolderPath('Startup'); " ^
    "$link = Join-Path $startup 'Sossoldi.lnk'; " ^
    "if (Test-Path $link) { Remove-Item $link -Force; $removed = $true; Write-Host '[OK] Collegamento in Esecuzione Automatica rimosso.' -ForegroundColor Green }; " ^
    "if (-not $removed) { Write-Host '[INFO] Nessun avvio automatico era presente.' -ForegroundColor Yellow }"

echo.
pause
