#!/bin/bash

echo "🔄 RESTORING DEVELOPMENT ENVIRONMENT"
echo "===================================="

# Restore moved files
echo "📁 Restoring moved files..."

# Restore pages
if [ -d ".production-temp/pages" ]; then
    cp -r .production-temp/pages/* src/app/ 2>/dev/null || true
fi

# Restore components
if [ -d ".production-temp/components" ]; then
    cp -r .production-temp/components/* src/components/ 2>/dev/null || true
fi

# Restore original next config
if [ -f ".production-temp/next.config.original.js" ]; then
    cp .production-temp/next.config.original.js next.config.js
fi

# Clean up temp directory
rm -rf .production-temp

# Remove production env
rm -f .env.production

echo "✅ Development environment restored!"
echo ""
echo "🚀 Ready for development:"
echo "   npm run dev"