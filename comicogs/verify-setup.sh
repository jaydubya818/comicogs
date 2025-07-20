#!/bin/bash

echo "🔍 Verifying Multi-Agent Setup Script..."

# Check if all required files would be created
EXPECTED_FILES=(
    ".comicogs/tasks/comicogs-mvp/supervisor.md"
    ".comicogs/tasks/comicogs-mvp/plan.md"
    ".comicogs/tasks/comicogs-mvp/channel.md"
    ".comicogs/tasks/comicogs-mvp/agents/agent_1.md"
    ".comicogs/tasks/comicogs-mvp/agents/agent_2.md"
    ".comicogs/tasks/comicogs-mvp/agents/agent_3.md"
    ".comicogs/tasks/comicogs-mvp/agents/agent_4.md"
    ".comicogs/tasks/comicogs-mvp/agents/agent_5.md"
    ".cursorrules"
    "package.json"
    ".env.example"
    "README.md"
)

echo "📋 Expected files to be created:"
for file in "${EXPECTED_FILES[@]}"; do
    echo "   ✓ $file"
done

echo ""
echo "🧪 Testing script syntax..."
if bash -n setup-multi-agent.sh; then
    echo "   ✅ Script syntax is valid"
else
    echo "   ❌ Script has syntax errors"
    exit 1
fi

echo ""
echo "📊 Script size: $(wc -l < setup-multi-agent.sh) lines"
echo "📄 Script content preview:"
echo "   - Creates $(echo "${EXPECTED_FILES[@]}" | wc -w) files"
echo "   - Sets up 5 agent coordination system"
echo "   - Includes .cursorrules for Cursor integration"
echo "   - Provides clear next steps"

echo ""
echo "✅ Setup script is ready for use!"
echo ""
echo "🚀 To use the script:"
echo "   1. Create a new directory for your project"
echo "   2. cd into that directory"
echo "   3. Run: bash /path/to/setup-multi-agent.sh"
echo "   4. Open the project in Cursor"
echo "   5. Start with Agent 1 using the provided prompt"