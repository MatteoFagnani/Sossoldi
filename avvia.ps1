Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "              SOSSOLDI - GESTIONE FINANZE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica Java
try {
    $null = java -version 2>&1
    Write-Host "[OK] Java rilevato." -ForegroundColor Green
} catch {
    Write-Host "[ERRORE] Java non e' installato o non e' presente nel PATH." -ForegroundColor Red
    Write-Host "Scarica e installa Java 21 da: https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# 2. Carica variabili da .env se presente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

# 3. Compilazione frontend se non presente
if (-not (Test-Path "frontend\dist\index.html")) {
    Write-Host "[INFO] Compilazione frontend in corso..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    npm run build
    Pop-Location
}

# 4. Compilazione JAR se non presente
if (-not (Test-Path "backend\target\backend-0.0.1-SNAPSHOT.jar")) {
    Write-Host "[INFO] Compilazione pacchetto backend in corso..." -ForegroundColor Yellow
    Push-Location backend
    .\mvnw.cmd package -DskipTests
    Pop-Location
}

Write-Host ""
Write-Host "[INFO] Avvio applicazione Sossoldi su http://localhost:10000 ..." -ForegroundColor Green
Write-Host "[INFO] Premi Ctrl+C per terminare." -ForegroundColor Gray
Write-Host ""

# Avvio JAR
java -jar backend\target\backend-0.0.1-SNAPSHOT.jar
