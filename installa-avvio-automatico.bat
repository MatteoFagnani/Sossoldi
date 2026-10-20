@echo off
cd /d "%~dp0"
title Sossoldi - Installa Avvio Automatico
echo ============================================================
echo        SOSSOLDI - ATTIVAZIONE AVVIO AUTOMATICO
echo ============================================================
echo.
echo [INFO] Creazione del collegamento nella cartella Esecuzione Automatica...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $startup = [Environment]::GetFolderPath('Startup'); $sc = $ws.CreateShortcut(\"$startup\Sossoldi.lnk\"); $sc.TargetPath = 'wscript.exe'; $sc.Arguments = '\"%~dp0avvia.vbs\"'; $sc.WorkingDirectory = '%~dp0'; $sc.Description = 'Sossoldi - Finanze Personali'; $sc.Save()"

if %ERRORLEVEL% neq 0 goto :error

echo.
echo [OK] Sossoldi e' stato aggiunto all'avvio automatico di Windows!
echo      Ad ogni accensione del PC, Sossoldi si avviera' in background.
echo      Potrai aprire l'app quando vuoi su: http://localhost:10000
echo.
echo [INFO] Puoi verificare o disattivare l'avvio in qualsiasi momento da:
echo      Gestione Attivita' (tasti Ctrl+Shift+Esc) nella scheda 'Avvio'
goto :end

:error
echo.
echo [ERRORE] Impossibile creare il collegamento di avvio.

:end
echo.
pause
