# Validation script for GeniDoc Full-Stack Setup (Windows PowerShell)

Write-Host "🔍 GeniDoc Installation Validation" -ForegroundColor Green
Write-Host "=================================="
Write-Host ""

$ERRORS = 0
$WARNINGS = 0

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
    
    # Check if version is 18+
    $nodeMajor = $nodeVersion.Substring(1).Split('.')[0]
    if ([int]$nodeMajor -lt 18) {
        Write-Host "⚠️  Node.js version should be 18+ (currently $nodeVersion)" -ForegroundColor Yellow
        $WARNINGS++
    }
}
catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    $ERRORS++
}

Write-Host ""

# Check npm
Write-Host "📦 Checking npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $ERRORS++
}

Write-Host ""

# Check backend dependencies
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Cyan
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠️  Backend node_modules not found - run: npm install" -ForegroundColor Yellow
    $WARNINGS++
}
else {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    
    if (-Not (Test-Path "node_modules/express")) {
        Write-Host "❌ Express not installed" -ForegroundColor Red
        $ERRORS++
    }
    else {
        Write-Host "   ✅ express" -ForegroundColor Green
    }
    
    if (-Not (Test-Path "node_modules/@prisma")) {
        Write-Host "❌ Prisma not installed" -ForegroundColor Red
        $ERRORS++
    }
    else {
        Write-Host "   ✅ @prisma/client" -ForegroundColor Green
    }
    
    if (-Not (Test-Path "node_modules/jsonwebtoken")) {
        Write-Host "❌ JWT not installed" -ForegroundColor Red
        $ERRORS++
    }
    else {
        Write-Host "   ✅ jsonwebtoken" -ForegroundColor Green
    }
}

Write-Host ""

# Check frontend dependencies
Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Cyan
if (-Not (Test-Path "frontend/node_modules")) {
    Write-Host "⚠️  Frontend node_modules not found - run: cd frontend && npm install" -ForegroundColor Yellow
    $WARNINGS++
}
else {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    
    if (-Not (Test-Path "frontend/node_modules/react")) {
        Write-Host "❌ React not installed" -ForegroundColor Red
        $ERRORS++
    }
    else {
        Write-Host "   ✅ react" -ForegroundColor Green
    }
    
    if (-Not (Test-Path "frontend/node_modules/axios")) {
        Write-Host "❌ Axios not installed" -ForegroundColor Red
        $ERRORS++
    }
    else {
        Write-Host "   ✅ axios" -ForegroundColor Green
    }
}

Write-Host ""

# Check configuration files
Write-Host "📁 Checking configuration files..." -ForegroundColor Cyan
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found - run: copy .env.example .env" -ForegroundColor Yellow
    $WARNINGS++
}
else {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "   ✅ DATABASE_URL configured" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  DATABASE_URL not configured" -ForegroundColor Yellow
        $WARNINGS++
    }
    
    if ($envContent -match "JWT_SECRET") {
        Write-Host "   ✅ JWT_SECRET configured" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  JWT_SECRET not configured" -ForegroundColor Yellow
        $WARNINGS++
    }
}

if ((-Not (Test-Path "frontend/.env")) -and (-Not (Test-Path "frontend/.env.local"))) {
    Write-Host "⚠️  frontend/.env file not found" -ForegroundColor Yellow
    $WARNINGS++
}
else {
    Write-Host "✅ frontend/.env found" -ForegroundColor Green
}

Write-Host ""

# Check Prisma schema
Write-Host "📁 Checking database schema..." -ForegroundColor Cyan
if (-Not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ prisma/schema.prisma not found" -ForegroundColor Red
    $ERRORS++
}
else {
    Write-Host "✅ prisma/schema.prisma found" -ForegroundColor Green
    
    $schemaContent = Get-Content "prisma/schema.prisma" -Raw
    
    if ($schemaContent -match "model User") {
        Write-Host "   ✅ User model" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ User model not found" -ForegroundColor Red
        $ERRORS++
    }
    
    if ($schemaContent -match "model Patient") {
        Write-Host "   ✅ Patient model" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Patient model not found" -ForegroundColor Red
        $ERRORS++
    }
    
    if ($schemaContent -match "model Appointment") {
        Write-Host "   ✅ Appointment model" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Appointment model not found" -ForegroundColor Red
        $ERRORS++
    }
}

Write-Host ""

# Check Docker
Write-Host "🐳 Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker -v
    Write-Host "✅ $dockerVersion" -ForegroundColor Green
    
    try {
        $dcVersion = docker-compose -v
        Write-Host "✅ $dcVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  docker-compose not found" -ForegroundColor Yellow
        $WARNINGS++
    }
}
catch {
    Write-Host "⚠️  Docker not found (optional for development)" -ForegroundColor Yellow
    $WARNINGS++
}

Write-Host ""
Write-Host "=================================="
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "=================================="
Write-Host "❌ Errors: $ERRORS" -ForegroundColor Red
Write-Host "⚠️  Warnings: $WARNINGS" -ForegroundColor Yellow
Write-Host ""

if ($ERRORS -eq 0) {
    if ($WARNINGS -eq 0) {
        Write-Host "🎉 All checks passed! Ready to develop!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Start backend: npm run dev"
        Write-Host "2. Start frontend: cd frontend && npm run dev"
        Write-Host ""
        exit 0
    }
    else {
        Write-Host "⚠️  Setup complete but some warnings found" -ForegroundColor Yellow
        Write-Host "Review the warnings above and run:" -ForegroundColor Yellow
        Write-Host "1. npm install (if backend deps missing)"
        Write-Host "2. cd frontend && npm install (if frontend deps missing)"
        Write-Host "3. Ensure .env files are properly configured"
        Write-Host ""
        exit 0
    }
}
else {
    Write-Host "❌ Setup incomplete - fix the errors above" -ForegroundColor Red
    Write-Host ""
    exit 1
}
