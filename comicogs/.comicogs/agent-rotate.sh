#!/bin/bash

# Comicogs Multi-Agent Development Workflow Script
# Usage: ./agent-rotate.sh [agent_number]

echo "🤖 Comicogs Multi-Agent Development System"
echo "=========================================="

# Check if agent number is provided
if [ $# -eq 1 ]; then
    AGENT_NUM=$1
else
    echo ""
    echo "📊 Current Sprint Status:"
    echo "------------------------"
    tail -15 .comicogs/tasks/comicogs-mvp/channel.md
    
    echo ""
    echo "👥 Quick Status Board:"
    grep -A 10 "Quick Status Board" .comicogs/tasks/comicogs-mvp/channel.md
    
    echo ""
    echo "🔄 Which agent should work next?"
    echo "1. Agent 1 - Infrastructure & API Lead"
    echo "2. Agent 2 - Frontend & UI/UX Developer"
    echo "3. Agent 3 - Marketplace & Business Logic"
    echo "4. Agent 4 - Search & Data Engineer"
    echo "5. Agent 5 - DevOps & Quality Engineer"
    echo ""
    read -p "Enter agent number (1-5): " AGENT_NUM
fi

# Validate agent number
if [[ ! $AGENT_NUM =~ ^[1-5]$ ]]; then
    echo "❌ Invalid agent number. Please enter 1-5."
    exit 1
fi

# Agent role mapping
case $AGENT_NUM in
    1) AGENT_ROLE="Infrastructure & API Lead" ;;
    2) AGENT_ROLE="Frontend & UI/UX Developer" ;;
    3) AGENT_ROLE="Marketplace & Business Logic" ;;
    4) AGENT_ROLE="Search & Data Engineer" ;;
    5) AGENT_ROLE="DevOps & Quality Engineer" ;;
esac

echo ""
echo "🎯 Activating Agent $AGENT_NUM: $AGENT_ROLE"
echo "============================================="

# Check if agent file exists
AGENT_FILE=".comicogs/tasks/comicogs-mvp/agents/agent_$AGENT_NUM.md"
if [ ! -f "$AGENT_FILE" ]; then
    echo "❌ Agent file not found: $AGENT_FILE"
    exit 1
fi

echo ""
echo "📋 Agent Mission Overview:"
echo "-------------------------"
head -10 "$AGENT_FILE"

echo ""
echo "✅ Agent Checklist Status:"
echo "-------------------------"
grep -A 20 "Checklist - Phase 1" "$AGENT_FILE"

echo ""
echo "🔗 Dependencies & Blockers:"
echo "---------------------------"
grep -A 5 "Dependencies" "$AGENT_FILE"

echo ""
echo "📝 Copy this prompt to Cursor:"
echo "==============================="
echo ""
echo "@cursor Act as Agent $AGENT_NUM ($AGENT_ROLE)."
echo ""
echo "Instructions:"
echo "1. Read .comicogs/tasks/comicogs-mvp/agents/agent_$AGENT_NUM.md for your mission"
echo "2. Check .comicogs/tasks/comicogs-mvp/channel.md for latest status and dependencies"
echo "3. Work on your next uncompleted task from your Phase 1 checklist"
echo "4. Update channel.md with your progress using the communication format"
echo "5. Signal which agent should work next when you complete a task"
echo ""
echo "Focus on: $(grep -A 1 "Current Mission" "$AGENT_FILE" | tail -1)"

echo ""
echo "🚀 Ready to begin! Paste the prompt above into Cursor."

# Optional: Open files in default editor
if command -v code >/dev/null 2>&1; then
    echo ""
    read -p "📝 Open agent files in VS Code? (y/n): " OPEN_FILES
    if [[ $OPEN_FILES =~ ^[Yy]$ ]]; then
        code "$AGENT_FILE"
        code ".comicogs/tasks/comicogs-mvp/channel.md"
        echo "📂 Files opened in VS Code"
    fi
fi