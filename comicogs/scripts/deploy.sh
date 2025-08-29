#!/bin/bash
# Quick Deployment Script for Comicogs
# Usage: ./scripts/deploy.sh [platform]

set -e

echo "🚀 Comicogs Deployment Helper"
echo "=============================="

PLATFORM=${1:-"docker"}

case $PLATFORM in
  "vercel")
    echo "📦 Deploying to Vercel..."
    if ! command -v vercel &> /dev/null; then
      echo "Installing Vercel CLI..."
      npm install -g vercel
    fi
    vercel --prod
    ;;
  
  "netlify")
    echo "🌐 Deploying to Netlify..."
    if ! command -v netlify &> /dev/null; then
      echo "Installing Netlify CLI..."
      npm install -g netlify-cli
    fi
    npm run build
    netlify deploy --prod --dir=.next
    ;;
  
  "pages")
    echo "📄 Preparing GitHub Pages export..."
    npm run export:pages
    echo "✅ Static files generated in 'docs' directory"
    echo "Enable GitHub Pages in your repo settings with source: docs/"
    ;;
  
  "docker")
    echo "🐳 Starting Docker deployment..."
    
    # Check if .env exists
    if [[ ! -f .env ]]; then
      echo "Creating .env from template..."
      cp env.example .env
      echo "⚠️  Please edit .env with your configuration before proceeding"
      echo "Press Enter when ready to continue..."
      read
    fi
    
    # Build and start containers
    echo "Building containers..."
    npm run docker:build
    
    echo "Starting services..."
    npm run docker:up
    
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "⚡ API:      http://localhost:4000"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "View logs: npm run docker:logs"
    echo "Stop services: npm run docker:down"
    ;;
  
  "dev")
    echo "🔧 Starting development environment..."
    
    # Start development services
    npm run docker:dev
    
    echo ""
    echo "✅ Development environment ready!"
    echo "Run these commands in separate terminals:"
    echo "  npm run dev      # Frontend"
    echo "  npm run dev:api  # Backend"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "⚡ API:      http://localhost:4000"
    echo "🗄️  Database: localhost:5432"
    echo "📊 PgAdmin:  http://localhost:5050"
    ;;
  
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo ""
    echo "Available platforms:"
    echo "  vercel   - Deploy to Vercel"
    echo "  netlify  - Deploy to Netlify"
    echo "  pages    - Prepare for GitHub Pages"
    echo "  docker   - Docker production deployment"
    echo "  dev      - Development environment"
    echo ""
    echo "Usage: ./scripts/deploy.sh [platform]"
    exit 1
    ;;
esac