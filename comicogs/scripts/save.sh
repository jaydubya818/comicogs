#!/bin/bash
# save.sh - Simple git commit and push

set -e

MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
  echo "❌ Usage: ./save.sh 'commit message'"
  exit 1
fi

echo "💾 Adding changes..."
git add .

echo "📝 Committing with message: $MESSAGE"
git commit -m "$MESSAGE"

echo "🚀 Pushing to remote..."
git push

echo "✅ Changes saved and pushed!"
