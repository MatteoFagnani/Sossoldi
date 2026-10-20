@echo off
title Sossoldi (Modalita Sviluppo)
color 0B
echo ============================================================
echo         SOSSOLDI - AVVIO IN MODALITA SVILUPPO
echo ============================================================
echo [INFO] Avvio backend (Spring Boot) e frontend (Vite HMR)...
echo.

start "Sossoldi Backend (API :10000)" cmd /c "cd backend && mvnw.cmd spring-boot:run"
start "Sossoldi Frontend (Vite :5173)" cmd /c "cd frontend && npm run dev"

echo [INFO] In attesa che i servizi siano pronti...
timeout /t 5 /nobreak >nul
start http://localhost:5173
