@echo off
cd /d "%~dp0"
title Sossoldi - Installa Avvio Automatico
echo ============================================================
echo        SOSSOLDI - ATTIVAZIONE AVVIO AUTOMATICO
echo ============================================================
echo.
echo [INFO] Configurazione dell'avvio automatico in background...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$rootDir = (Resolve-Path '%~dp0..').Path; " ^
    "$scriptPath = Join-Path $rootDir 'scripts\avvia.ps1'; " ^
    "$startup = [Environment]::GetFolderPath('Startup'); " ^
    "$legacyLink = Join-Path $startup 'Sossoldi.lnk'; " ^
    "if (Test-Path $legacyLink) { Remove-Item $legacyLink -Force }; " ^
    "$argsStr = \"-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `\"$scriptPath`\" -Background\"; " ^
    "try { " ^
    "  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argsStr -WorkingDirectory $rootDir; " ^
    "  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME; " ^
    "  $trigger.Delay = 'PT10S'; " ^
    "  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero); " ^
    "  Register-ScheduledTask -TaskName 'SossoldiAutoStart' -Action $action -Trigger $trigger -Settings $settings -Description 'Avvio automatico di Sossoldi in background' -Force -ErrorAction Stop | Out-Null; " ^
    "  Write-Host '[OK] Attivita'' pianificata SossoldiAutoStart registrata nel Task Scheduler (avvio ritardato di 10s + auto-restart).' -ForegroundColor Green " ^
    "} catch { " ^
    "  $ws = New-Object -ComObject WScript.Shell; " ^
    "  $sc = $ws.CreateShortcut($legacyLink); " ^
    "  $sc.TargetPath = 'powershell.exe'; " ^
    "  $sc.Arguments = $argsStr; " ^
    "  $sc.WorkingDirectory = $rootDir; " ^
    "  $sc.WindowStyle = 7; " ^
    "  $sc.Description = 'Sossoldi - Finanze Personali'; " ^
    "  $sc.Save(); " ^
    "  Write-Host '[OK] Collegamento di avvio automatico creato nella cartella Esecuzione Automatica.' -ForegroundColor Green " ^
    "}"

if %ERRORLEVEL% neq 0 goto :error

echo.
echo [OK] Sossoldi si avviera' automaticamente in background ad ogni accesso a Windows!
echo      Vedrai l'icona di Sossoldi nella System Tray (vicino all'orologio)
echo      e potrai aprire l'app su: http://localhost:10000
goto :end

:error
echo.
echo [ERRORE] Impossibile configurare l'avvio automatico.

:end
echo.
pause
