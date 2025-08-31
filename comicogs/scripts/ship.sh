#!/bin/bash
# ship.sh - Save, debug, push, PR, and merge (safe mode)

set -e  # exit immediately on error

BRANCH=$(git rev-parse --abbrev-ref HEAD)
BASE_BRANCH="main"
MESSAGE="$1"
MERGE=${MERGE:-auto}

# 🛑 Guard: refuse to continue if there are uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  You have uncommitted changes. Please commit or stash before running /ship."
  exit 1
fi

# ✅ Run tests before shipping
echo "🧪 Running tests..."
npm test || { echo "❌ Tests failed. Aborting /ship."; exit 1; }

# 🚀 Save & push
echo "📦 Saving & pushing branch..."
bash scripts/save.sh "$MESSAGE"

# 🔧 Debug run (optional, e.g. run dev build or lint)
echo "🔍 Debugging locally..."
npm run build && npm run lint || { echo "❌ Debug checks failed. Aborting /ship."; exit 1; }

# 🔀 Create PR
echo "📬 Creating PR..."
PR_URL=$(gh pr create --fill --base "$BASE_BRANCH" --head "$BRANCH" --json url -q .url)
echo "✅ PR created: $PR_URL"

# 🔂 Merge PR automatically if flag is set
if [ "$MERGE" = "auto" ]; then
  echo "🔄 Merging PR..."
  gh pr merge "$PR_URL" --squash --delete-branch --auto
  echo "🎉 PR merged into $BASE_BRANCH!"
else
  echo "👀 PR ready for review at: $PR_URL"
fi
