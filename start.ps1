# Script de démarrage rapide pour Windows PowerShell

Write-Host "🚀 Démarrage du BFF Ecom2Micro..." -ForegroundColor Green
Write-Host ""

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Vérifier si .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Création du fichier .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Fichier .env créé depuis .env.example" -ForegroundColor Green
    Write-Host ""
}

# Créer le dossier logs s'il n'existe pas
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "✅ Dossier logs créé" -ForegroundColor Green
}

Write-Host "🌐 Le serveur BFF va démarrer sur http://localhost:3000" -ForegroundColor Cyan
Write-Host "📋 Endpoints disponibles :" -ForegroundColor Cyan
Write-Host "   - GET  /api/health" -ForegroundColor White
Write-Host "   - POST /api/auth/register" -ForegroundColor White
Write-Host "   - POST /api/auth/login" -ForegroundColor White
Write-Host "   - GET  /api/catalog/products" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation :" -ForegroundColor Cyan
Write-Host "   - docs/AUTHENTICATION.md - Guide d'authentification" -ForegroundColor White
Write-Host "   - docs/FRONTEND_INTEGRATION.md - Exemples frontend" -ForegroundColor White
Write-Host "   - docs/QUICK_REFERENCE.md - Référence rapide" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Pour arrêter : Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Démarrer le serveur en mode développement
npm run dev
