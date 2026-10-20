@echo off
cd /d "%~dp0"
title Arresto Sossoldi
echo ============================================================
echo               SOSSOLDI - ARRESTO SERVIZI
echo ============================================================
echo [INFO] Ricerca e arresto dei processi Sossoldi attivi...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":10000" ^| findstr "LISTENING"') do (
    set FOUND=1
    echo [INFO] Termino processo porta 10000 PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: Termina anche eventuali istanze javaw or java del JAR
wmic process where "name='javaw.exe' and commandline like '%%backend-0.0.1-SNAPSHOT.jar%%'" call terminate >nul 2>&1
wmic process where "name='java.exe' and commandline like '%%backend-0.0.1-SNAPSHOT.jar%%'" call terminate >nul 2>&1

if "%FOUND%"=="0" (
    echo [INFO] Nessun processo attivo sulla porta 10000.
) else (
    echo [OK] Servizio Sossoldi arrestato con successo.
)

timeout /t 2 >nul
