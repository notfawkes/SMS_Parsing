# SMS Bank Reader API Deployment Script
Write-Host "SMS Bank Reader API Deployment Helper" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "`nInitializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "`nGit repository already exists" -ForegroundColor Green
}

# Check if all required files exist
Write-Host "`nChecking required files..." -ForegroundColor Yellow

$requiredFiles = @("server.js", "package.json", "render.yaml")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "$file exists" -ForegroundColor Green
    } else {
        Write-Host "$file missing" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`nMissing files: $($missingFiles -join ', ')" -ForegroundColor Yellow
    Write-Host "Please create these files before deploying." -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencies installed" -ForegroundColor Green
}

# Test the server locally
Write-Host "`nTesting server locally..." -ForegroundColor Yellow
try {
    $process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "Server is working locally" -ForegroundColor Green
    
    Stop-Process -Id $process.Id -Force
} catch {
    Write-Host "Server test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please fix server issues before deploying." -ForegroundColor Yellow
    exit 1
}

# Git status
Write-Host "`nGit status:" -ForegroundColor Yellow
git status --porcelain

# Deployment instructions
Write-Host "`nDeployment Instructions:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create GitHub repository:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/yourusername/sms-bank-reader.git" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Initial commit'" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Render:" -ForegroundColor White
Write-Host "   - Go to https://render.com" -ForegroundColor Gray
Write-Host "   - Sign up with GitHub" -ForegroundColor Gray
Write-Host "   - Click 'New Web Service'" -ForegroundColor Gray
Write-Host "   - Connect your GitHub repository" -ForegroundColor Gray
Write-Host "   - Select the repository" -ForegroundColor Gray
Write-Host "   - Click 'Create Web Service'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Your API will be available at:" -ForegroundColor White
Write-Host "   https://your-app-name.onrender.com" -ForegroundColor Green
Write-Host ""
Write-Host "4. Test your deployed API:" -ForegroundColor White
Write-Host "   curl https://your-app-name.onrender.com/health" -ForegroundColor Gray
Write-Host "   curl -H 'X-API-Key: demo-key-123' https://your-app-name.onrender.com/transactions" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Update mobile app URL:" -ForegroundColor White
Write-Host "   Change serverUrl in App.tsx to your deployed URL" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy deploying!" -ForegroundColor Green 