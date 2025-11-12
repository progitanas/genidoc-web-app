#!/bin/bash

# Validation script for GeniDoc Full-Stack Setup

echo "🔍 GeniDoc Installation Validation"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    ERRORS=$((ERRORS + 1))
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js $NODE_VERSION found"
    
    # Check if version is 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Node.js version should be 18+ (currently $NODE_VERSION)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    ERRORS=$((ERRORS + 1))
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm $NPM_VERSION found"
fi

echo ""

# Check backend dependencies
echo "📦 Checking backend dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  Backend node_modules not found - run: npm install"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ Backend dependencies installed"
    
    # Check key packages
    if [ ! -d "node_modules/express" ]; then
        echo "❌ Express not installed"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ express"
    fi
    
    if [ ! -d "node_modules/@prisma" ]; then
        echo "❌ Prisma not installed"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ @prisma/client"
    fi
    
    if [ ! -d "node_modules/jsonwebtoken" ]; then
        echo "❌ JWT not installed"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ jsonwebtoken"
    fi
fi

echo ""

# Check frontend dependencies
echo "📦 Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend node_modules not found - run: cd frontend && npm install"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ Frontend dependencies installed"
    
    # Check key packages
    if [ ! -d "frontend/node_modules/react" ]; then
        echo "❌ React not installed"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ react"
    fi
    
    if [ ! -d "frontend/node_modules/axios" ]; then
        echo "❌ Axios not installed"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ axios"
    fi
fi

echo ""

# Check configuration files
echo "📁 Checking configuration files..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found - run: cp .env.example .env"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ .env file found"
    
    # Check key env variables
    if grep -q "DATABASE_URL" .env; then
        echo "   ✅ DATABASE_URL configured"
    else
        echo "   ⚠️  DATABASE_URL not configured"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo "   ✅ JWT_SECRET configured"
    else
        echo "   ⚠️  JWT_SECRET not configured"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

if [ ! -f "frontend/.env" ] && [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env file not found"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ frontend/.env found"
fi

echo ""

# Check Prisma schema
echo "📁 Checking database schema..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ prisma/schema.prisma not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ prisma/schema.prisma found"
    
    # Check for key models
    if grep -q "model User" prisma/schema.prisma; then
        echo "   ✅ User model"
    else
        echo "   ❌ User model not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "model Patient" prisma/schema.prisma; then
        echo "   ✅ Patient model"
    else
        echo "   ❌ Patient model not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "model Appointment" prisma/schema.prisma; then
        echo "   ✅ Appointment model"
    else
        echo "   ❌ Appointment model not found"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found (optional)"
    WARNINGS=$((WARNINGS + 1))
else
    DOCKER_VERSION=$(docker -v)
    echo "✅ $DOCKER_VERSION"
    
    if ! command -v docker-compose &> /dev/null; then
        echo "⚠️  docker-compose not found"
        WARNINGS=$((WARNINGS + 1))
    else
        DC_VERSION=$(docker-compose -v)
        echo "✅ $DC_VERSION"
    fi
fi

echo ""

# Check PostgreSQL (if not using Docker)
if command -v psql &> /dev/null; then
    echo "🗄️  Checking PostgreSQL..."
    if psql -c "SELECT 1" > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL not responding"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  PostgreSQL client not found (use Docker Compose or install PostgreSQL)"
fi

echo ""
echo "=================================="
echo "📊 Validation Summary"
echo "=================================="
echo "❌ Errors: $ERRORS"
echo "⚠️  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "🎉 All checks passed! Ready to develop!"
        echo ""
        echo "Next steps:"
        echo "1. Start backend: npm run dev"
        echo "2. Start frontend: cd frontend && npm run dev"
        echo ""
        exit 0
    else
        echo "⚠️  Setup complete but some warnings found"
        echo "Review the warnings above and run:"
        echo "1. npm install (if backend deps missing)"
        echo "2. cd frontend && npm install (if frontend deps missing)"
        echo "3. Ensure .env files are properly configured"
        echo ""
        exit 0
    fi
else
    echo "❌ Setup incomplete - fix the errors above"
    echo ""
    exit 1
fi
