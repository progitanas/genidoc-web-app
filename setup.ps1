# GeniDoc Full-Stack Setup Script for Windows

Write-Host "🚀 GeniDoc Full-Stack Setup Script" -ForegroundColor Green
Write-Host "=================================="
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend installation failed" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Initialize database
Write-Host "🗄️  Initializing database..." -ForegroundColor Cyan
npx prisma migrate dev --name init 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database initialization might need manual setup" -ForegroundColor Yellow
    Write-Host "   Run: npx prisma db push" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your configuration"
Write-Host "2. Start backend: npm run dev"
Write-Host "3. Start frontend: cd frontend && npm run dev"
Write-Host "   Or use Docker: docker-compose up -d"
Write-Host ""
