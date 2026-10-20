@echo off
cd /d "%~dp0"

:: 1. Se Sossoldi e' gia' in esecuzione sulla porta 10000, esci senza duplicare
netstat -aon | findstr ":10000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 exit

:: 2. Avvia in background senza lasciare finestre CMD e senza aprire pagine web
start "" javaw -jar backend\target\backend-0.0.1-SNAPSHOT.jar
exit
