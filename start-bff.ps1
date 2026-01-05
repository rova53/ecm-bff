# Start BFF Server
# Navigate to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "🚀 Starting Ecom2Micro BFF Server..." -ForegroundColor Cyan
Write-Host ""

# Check required files
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "src/server.js")) {
    Write-Host "❌ Error: src/server.js not found!" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Starting server..." -ForegroundColor Green
Write-Host ""

# Start the server
node src/server.js
