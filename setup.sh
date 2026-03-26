#!/bin/bash
# InternHub Setup Script for macOS/Linux

set -e

echo "🚀 InternHub Setup Script"
echo "========================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  (Optional) Install Ollama for AI features:"
echo "   - Download from https://ollama.ai"
echo "   - Run: ollama pull neural-chat"
echo "   - Start with: ollama serve"
echo ""
echo "2️⃣  Start the backend server:"
echo "   npm start"
echo ""
echo "3️⃣  Open index.html in your browser"
echo ""
echo "🎯 The app will work without Ollama, but AI features will be disabled."
echo ""
