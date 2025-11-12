#!/bin/bash

# Setup script for GeniDoc Full-Stack

echo "🚀 GeniDoc Full-Stack Setup Script"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi

echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi

cd ..
echo "✅ Frontend dependencies installed"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

if [ $? -ne 0 ]; then
    echo "⚠️  Database initialization skipped (database might not be running)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start backend: npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo "   Or use Docker: docker-compose up -d"
echo ""
