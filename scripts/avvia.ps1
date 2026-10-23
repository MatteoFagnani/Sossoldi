param(
    [switch]$Background
)

Set-Location "$PSScriptRoot\.."

# 1. Se Sossoldi e' gia' in ascolto sulla porta 10000, evita istanze duplicate
$listening = Get-NetTCPConnection -LocalPort 10000 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    if (-not $Background) {
        Write-Host "[INFO] Sossoldi e' gia' in esecuzione su http://localhost:10000" -ForegroundColor Yellow
    }
    exit 0
}

if (-not $Background) {
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "              SOSSOLDI - GESTIONE FINANZE" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

# 2. Verifica Java
try {
    $null = java -version 2>&1
    if (-not $Background) {
        Write-Host "[OK] Java rilevato." -ForegroundColor Green
    }
} catch {
    if (-not $Background) {
        Write-Host "[ERRORE] Java non e' installato o non e' presente nel PATH." -ForegroundColor Red
        Write-Host "Scarica e installa Java 21 da: https://adoptium.net/" -ForegroundColor Yellow
    }
    exit 1
}

# 3. Carica variabili da .env se presente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

# 4. Compilazione frontend se non presente
if (-not (Test-Path "frontend\dist\index.html")) {
    if (-not $Background) {
        Write-Host "[INFO] Compilazione frontend in corso..." -ForegroundColor Yellow
    }
    Push-Location frontend
    npm install
    npm run build
    Pop-Location
}

# 5. Compilazione JAR se non presente
if (-not (Test-Path "backend\target\backend-0.0.1-SNAPSHOT.jar")) {
    if (-not $Background) {
        Write-Host "[INFO] Compilazione pacchetto backend in corso..." -ForegroundColor Yellow
    }
    Push-Location backend
    .\mvnw.cmd package -DskipTests
    Pop-Location
}

# 6. Assicura la presenza della cartella data per DB e log
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
}

$jvmArgs = @(
    "-Xms64m",
    "-Xmx256m",
    "-XX:+UseSerialGC",
    "-jar",
    "backend\target\backend-0.0.1-SNAPSHOT.jar",
    "--logging.file.name=data/sossoldi.log"
)

if ($Background) {
    Start-Process -FilePath "javaw.exe" -ArgumentList $jvmArgs -WorkingDirectory (Get-Location).Path -WindowStyle Hidden
} else {
    Write-Host ""
    Write-Host "[INFO] Avvio applicazione Sossoldi su http://localhost:10000 ..." -ForegroundColor Green
    Write-Host "[INFO] Premi Ctrl+C per terminare." -ForegroundColor Gray
    Write-Host ""
    & java @jvmArgs
}
