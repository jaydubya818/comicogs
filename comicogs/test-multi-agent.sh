#!/bin/bash

# Quick test setup for multi-agent system
echo "🧪 Setting up Multi-Agent Test Environment..."

# Create test directory
mkdir -p comicogs-test
cd comicogs-test

# Create the basic structure
mkdir -p .comicogs/tasks/comicogs-mvp/agents

# Create a minimal test plan.md with just a few tasks
cat > .comicogs/tasks/comicogs-mvp/plan.md << 'EOF'
# 📅 Comicogs MVP Development Plan - TEST VERSION

🔒 **APPROVED** - Development can begin

## Phase 1: Foundation (Current)

### Agent 1 - Infrastructure & API
- [ ] Create Next.js 14 project with TypeScript
- [ ] Set up Prisma ORM with PostgreSQL
- [ ] Create basic schema

### Agent 2 - Frontend & UI  
- [ ] Install shadcn/ui component library
- [ ] Configure Tailwind CSS theme

### Agent 3 - Business Logic
- [ ] Wait for Agent 1's schema
- [ ] Plan marketplace workflows

### Agent 4 - Search & Data
- [ ] Wait for basic project setup
- [ ] Research search solutions

### Agent 5 - DevOps & QA
- [ ] Set up GitHub Actions
- [ ] Create Docker config

---

## Progress Tracking
Update this section as tasks complete ✅
EOF

# Create minimal channel.md
cat > .comicogs/tasks/comicogs-mvp/channel.md << 'EOF'
# 💬 Agent Communication Channel - TEST

## Latest Updates

**System Status**: Test environment ready
**Current Phase**: Phase 1 - Foundation
**Next Action**: Agent 1 should initialize the project

---

## Agent Status Board

| Agent | Status | Current Task | Blocked? |
|-------|---------|-------------|----------|
| 1 | 🟡 Ready | Project setup | No |
| 2 | ⏸️ Waiting | UI setup | Yes - needs Agent 1 |
| 3 | ⏸️ Waiting | Business logic | Yes - needs Agent 1 |
| 4 | ⏸️ Waiting | Search setup | Yes - needs Agent 1 |
| 5 | 🟡 Ready | CI/CD setup | No |

---

## Message History
*Test environment initialized*
EOF

# Create simplified supervisor.js for testing
cat > supervisor.js << 'EOF'
// Simplified test version of supervisor
const fs = require('fs');

class TestSupervisor {
    constructor() {
        this.channelPath = '.comicogs/tasks/comicogs-mvp/channel.md';
        this.planPath = '.comicogs/tasks/comicogs-mvp/plan.md';
    }

    readPlan() {
        try {
            return fs.readFileSync(this.planPath, 'utf8');
        } catch (error) {
            console.error('Could not read plan.md:', error);
            return '';
        }
    }

    determineNextAgent() {
        const plan = this.readPlan();
        
        // Simple logic: find first agent with incomplete tasks
        const agents = [1, 2, 3, 4, 5];
        
        for (const agentId of agents) {
            const agentSection = plan.split(`### Agent ${agentId}`)[1];
            if (agentSection && agentSection.includes('- [ ]')) {
                // Check if agent is blocked
                if (agentId === 1 || agentId === 5) {
                    return agentId; // These can always work
                }
                if (agentId > 1) {
                    // Check if Agent 1 has completed at least one task
                    const agent1Section = plan.split('### Agent 1')[1];
                    if (agent1Section && agent1Section.includes('- [x]')) {
                        return agentId;
                    }
                }
            }
        }
        return null;
    }

    generatePrompt(agentId) {
        return `@cursor You are Agent ${agentId} in a multi-agent test system.

INSTRUCTIONS:
1. Read .comicogs/tasks/comicogs-mvp/channel.md 
2. Find your next incomplete task in plan.md
3. Work on ONE task only
4. When complete, update channel.md with:
   [Agent ${agentId}] - ${new Date().toISOString().split('T')[0]} - Task completed
   Details: What you did
   → next: Agent X should work next

5. Mark your completed task in plan.md as [x]

Begin working now.`;
    }

    checkStatus() {
        const plan = this.readPlan();
        const completed = (plan.match(/- \[x\]/g) || []).length;
        const total = (plan.match(/- \[\s*[\sx]\s*\]/g) || []).length;
        
        console.log(`📊 Test Status: ${completed}/${total} tasks complete (${Math.round(completed/total*100)}%)`);
        
        if (completed === total) {
            console.log('🎉 ALL TASKS COMPLETE!');
            return true;
        }
        return false;
    }

    test() {
        console.log('🧪 Testing Multi-Agent Logic...\n');
        
        // Test 1: Next agent determination
        const nextAgent = this.determineNextAgent();
        console.log(`✅ Next agent should be: ${nextAgent || 'None available'}`);
        
        // Test 2: Prompt generation
        if (nextAgent) {
            console.log('\n📋 Generated prompt:');
            console.log(this.generatePrompt(nextAgent));
        }
        
        // Test 3: Status check
        console.log('\n📊 Current status:');
        this.checkStatus();
    }
}

// CLI interface
const command = process.argv[2] || 'test';
const supervisor = new TestSupervisor();

switch (command) {
    case 'test':
        supervisor.test();
        break;
    case 'next':
        const agent = supervisor.determineNextAgent();
        if (agent) {
            console.log(supervisor.generatePrompt(agent));
        } else {
            console.log('No agents available');
        }
        break;
    case 'status':
        supervisor.checkStatus();
        break;
    default:
        console.log('Usage: node supervisor.js [test|next|status]');
}
EOF

# Make supervisor executable
chmod +x supervisor.js

# Create simple test script
cat > test.sh << 'EOF'
#!/bin/bash
echo "🧪 Running Multi-Agent Tests..."

echo "Test 1: Check file structure"
if [ -f ".comicogs/tasks/comicogs-mvp/plan.md" ]; then
    echo "✅ Plan file exists"
else
    echo "❌ Plan file missing"
    exit 1
fi

echo "Test 2: Check supervisor logic"
node supervisor.js test

echo "Test 3: Simulate agent work"
echo "Manually completing Agent 1's first task..."

# Simulate completing a task
sed -i 's/- \[ \] Create Next.js 14 project with TypeScript/- [x] Create Next.js 14 project with TypeScript/' .comicogs/tasks/comicogs-mvp/plan.md

# Add message to channel
echo "" >> .comicogs/tasks/comicogs-mvp/channel.md
echo "[Agent 1] - $(date +%Y-%m-%d) - Next.js project created" >> .comicogs/tasks/comicogs-mvp/channel.md
echo "Details: Project initialized successfully" >> .comicogs/tasks/comicogs-mvp/channel.md
echo "→ next: Agent 1 should continue with Prisma setup" >> .comicogs/tasks/comicogs-mvp/channel.md

echo "Test 4: Check updated status"
node supervisor.js status

echo "Test 5: Get next agent prompt"
node supervisor.js next

echo ""
echo "🎉 Basic tests complete!"
echo ""
echo "Next step: Copy the generated prompt to Cursor and see if it works!"
EOF

chmod +x test.sh

echo "✅ Test environment created!"
echo ""
echo "To test the system:"
echo "1. cd comicogs-test"
echo "2. ./test.sh"
echo ""
echo "Then copy the generated prompt to Cursor to test real integration."