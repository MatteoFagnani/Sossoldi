@echo off
cd /d "%~dp0"
title Sossoldi - Installa Avvio Automatico
echo ============================================================
echo        SOSSOLDI - ATTIVAZIONE AVVIO AUTOMATICO
echo ============================================================
echo.
echo [INFO] Configurazione collegamento nella cartella Esecuzione Automatica...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$startup = [Environment]::GetFolderPath('Startup'); " ^
    "$sc = $ws.CreateShortcut((Join-Path $startup 'Sossoldi.lnk')); " ^
    "$sc.TargetPath = 'wscript.exe'; " ^
    "$sc.Arguments = '\"%~dp0avvia.vbs\"'; " ^
    "$sc.WorkingDirectory = (Resolve-Path '%~dp0..').Path; " ^
    "$sc.Description = 'Sossoldi - Finanze Personali'; " ^
    "$sc.Save(); " ^
    "Get-ScheduledTask -TaskName 'SossoldiAutoStart' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false; " ^
    "Write-Host '[OK] Avvio automatico configurato con successo.' -ForegroundColor Green"

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
