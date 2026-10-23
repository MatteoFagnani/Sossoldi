@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Sossoldi - Build Automatico
color 0B

echo ============================================================
echo             SOSSOLDI - BUILD AUTOMATICO COMPLETO
echo ============================================================
echo.

:: 1. Arresto di eventuali istanze in esecuzione sulla porta 10000
echo [1/3] Verifica e arresto istanze attive di Sossoldi...
call "%~dp0scripts\ferma.bat" --no-wait
echo.

:: 2. Compilazione Frontend
echo [2/3] Compilazione Frontend (React + Vite + Tailwind)...
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================
    echo [ERRORE] Compilazione frontend fallita!
    echo ============================================================
    cd /d "%~dp0"
    pause
    exit /b %ERRORLEVEL%
)
cd /d "%~dp0"
echo [OK] Frontend compilato con successo nella cartella frontend\dist.
echo.

:: 3. Compilazione Backend e generazione JAR
echo [3/3] Compilazione Backend e creazione pacchetto JAR (Spring Boot)...
cd /d "%~dp0backend"
call mvnw.cmd package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================
    echo [ERRORE] Compilazione backend fallita!
    echo ============================================================
    cd /d "%~dp0"
    pause
    exit /b %ERRORLEVEL%
)
cd /d "%~dp0"
echo [OK] Pacchetto JAR generato in backend\target\backend-0.0.1-SNAPSHOT.jar.
echo.

echo ============================================================
echo [SUCCESSO] BUILD COMPLETATA CON SUCCESSO!
echo ============================================================
echo.
set /p START_NOW="Vuoi avviare l'applicazione adesso? (S/n): "
if /i "%START_NOW%"=="n" (
    echo Operazione conclusa. Puoi avviare l'app quando vuoi con 'avvia.bat'.
    timeout /t 3 >nul
    exit /b 0
)

echo Avvio di Sossoldi in corso...
start "" avvia.bat
exit /b 0
