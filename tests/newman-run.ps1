# Script PowerShell pour exécuter les tests Newman
# Usage: .\newman-run.ps1

Write-Host "🧪 Running Newman Tests for Ecom2Micro BFF" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Vérifier si Newman est installé
if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Newman n'est pas installé." -ForegroundColor Red
    Write-Host "📦 Installation de Newman..." -ForegroundColor Yellow
    npm install -g newman
    npm install -g newman-reporter-htmlextra
}

# Vérifier si la BFF est en cours d'exécution
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ BFF is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ BFF n'est pas accessible sur http://localhost:3000" -ForegroundColor Red
    Write-Host "   Démarrez la BFF avec: cd bff && npm start`n" -ForegroundColor Yellow
    exit 1
}

# Exécuter les tests Newman
$collectionPath = ".\ecom2micro-bff.postman_collection.json"
$outputDir = ".\newman-reports"

# Créer le dossier de rapports s'il n'existe pas
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Write-Host "📋 Exécution de la collection Postman...`n" -ForegroundColor Cyan

# Exécuter Newman avec différents reporters
newman run $collectionPath `
    --reporters cli,json,htmlextra `
    --reporter-json-export "$outputDir/newman-report.json" `
    --reporter-htmlextra-export "$outputDir/newman-report.html" `
    --color on `
    --delay-request 100 `
    --timeout-request 10000

$exitCode = $LASTEXITCODE

Write-Host "`n============================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "✅ Tous les tests ont réussi!" -ForegroundColor Green
    Write-Host "📊 Rapport HTML disponible: $outputDir\newman-report.html" -ForegroundColor Cyan
} else {
    Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
    Write-Host "📊 Consultez le rapport pour plus de détails: $outputDir\newman-report.html" -ForegroundColor Yellow
}

exit $exitCode
