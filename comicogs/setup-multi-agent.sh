#!/bin/bash

# Comicogs Multi-Agent Setup Script for Cursor
echo "🤖 Setting up Comicogs Multi-Agent Development Kit..."

# Create the directory structure
mkdir -p .comicogs/tasks/comicogs-mvp/agents

# Create the main coordination files
cat > .comicogs/tasks/comicogs-mvp/supervisor.md << 'EOF'
# Comicogs Multi-Agent Supervisor

## Instructions for Cursor

You are coordinating a multi-agent development project. Each agent has specific responsibilities:

- **Agent 1**: Infrastructure & API (Prisma, Next.js API routes, auth)
- **Agent 2**: Frontend & UI (shadcn/ui, Tailwind, components)  
- **Agent 3**: Business Logic (Stripe, marketplace features)
- **Agent 4**: Search & Data (Elasticsearch, recommendations)
- **Agent 5**: DevOps & QA (CI/CD, testing, deployment)

## Workflow Rules

1. **Always read channel.md first** to see current status
2. **Work as only ONE agent at a time**
3. **Update channel.md after completing tasks**
4. **Follow dependencies** - don't start tasks that need other agents' work
5. **Focus on your agent's checklist** in plan.md

## Current Phase: Setup & Infrastructure

Start with Agent 1 to create the foundation.
EOF

cat > .comicogs/tasks/comicogs-mvp/plan.md << 'EOF'
# 📅 Comicogs MVP Development Plan

🔒 **APPROVED** - Development can begin

## Phase 1: Foundation (Current)

### Agent 1 - Infrastructure & API
- [ ] Create Next.js 14 project with TypeScript
- [ ] Set up Prisma ORM with PostgreSQL
- [ ] Create basic schema (User, Comic, Listing, Order)
- [ ] Install NextAuth.js
- [ ] Create basic API routes structure

### Agent 2 - Frontend & UI  
- [ ] Install shadcn/ui component library
- [ ] Configure Tailwind CSS theme
- [ ] Create basic layout (Header, Nav, Footer)
- [ ] Set up routing structure

### Agent 3 - Business Logic
- [ ] Wait for Agent 1's schema
- [ ] Plan marketplace workflows
- [ ] Design Stripe integration

### Agent 4 - Search & Data
- [ ] Wait for basic project setup
- [ ] Research search solutions
- [ ] Plan data indexing

### Agent 5 - DevOps & QA
- [ ] Set up GitHub Actions
- [ ] Create Docker config
- [ ] Plan testing strategy

---

## Dependencies Map
- Agent 2 depends on Agent 1 (project setup)
- Agent 3 depends on Agent 1 (database schema)
- Agent 4 depends on Agent 1 (basic project)
- Agent 5 can work in parallel

---

## Progress Tracking
Update this section as tasks complete ✅
EOF

cat > .comicogs/tasks/comicogs-mvp/channel.md << 'EOF'
# 💬 Agent Communication Channel

## Latest Updates

**System Status**: Ready to begin
**Current Phase**: Phase 1 - Foundation
**Next Action**: Agent 1 should initialize the project

---

## Communication Protocol

Format: `[Agent X] - YYYY-MM-DD HH:MM - Action`
Details: Brief description
→ next: What should happen next

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
*Agents will update this section as they work*
EOF

# Create individual agent files
cat > .comicogs/tasks/comicogs-mvp/agents/agent_1.md << 'EOF'
# Agent 1: Infrastructure & API Lead

## My Responsibilities
- Database design and setup
- API architecture  
- Authentication system
- Server-side foundations

## Current Checklist
- [ ] Initialize Next.js 14 project (`npx create-next-app@latest`)
- [ ] Install Prisma (`npm install prisma @prisma/client`)
- [ ] Set up PostgreSQL database
- [ ] Create initial schema
- [ ] Install NextAuth.js
- [ ] Create basic API routes

## Dependencies
**I need**: Nothing - I'm the foundation
**Others waiting for me**: Agents 2, 3, 4

## Notes
- Use TypeScript strictly
- Follow Next.js 14 App Router patterns
- Set up proper environment variables
EOF

cat > .comicogs/tasks/comicogs-mvp/agents/agent_2.md << 'EOF'
# Agent 2: Frontend & UI/UX Developer

## My Responsibilities  
- User interface design
- Component library setup
- Responsive layouts
- User experience

## Current Checklist
- [ ] Install shadcn/ui (`npx shadcn-ui@latest init`)
- [ ] Configure Tailwind theme
- [ ] Create layout components
- [ ] Set up routing structure
- [ ] Design component system

## Dependencies
**I need**: Agent 1 to complete project setup
**Others waiting for me**: Agent 3 (for UI integration)

## Notes
- Focus on responsive design
- Use shadcn/ui components
- Follow design system principles
EOF

cat > .comicogs/tasks/comicogs-mvp/agents/agent_3.md << 'EOF'
# Agent 3: Marketplace & Business Logic

## My Responsibilities
- E-commerce functionality
- Payment processing
- Business rules
- Transaction flows

## Current Checklist
- [ ] Wait for Agent 1's database schema
- [ ] Plan listing creation workflow
- [ ] Design Stripe integration
- [ ] Create marketplace logic

## Dependencies  
**I need**: Agent 1 (database schema), Agent 2 (UI components)
**Others waiting for me**: None currently

## Notes
- Focus on secure transactions
- Plan for scalability
- Consider edge cases
EOF

cat > .comicogs/tasks/comicogs-mvp/agents/agent_4.md << 'EOF'
# Agent 4: Search & Data Engineer

## My Responsibilities
- Search functionality
- Data processing
- Recommendations
- Performance optimization

## Current Checklist
- [ ] Wait for basic project setup
- [ ] Research search solutions
- [ ] Plan data indexing strategy
- [ ] Design search API

## Dependencies
**I need**: Agent 1 (basic project structure)
**Others waiting for me**: None currently

## Notes
- Consider Elasticsearch vs alternatives
- Plan for search performance
- Design recommendation algorithms
EOF

cat > .comicogs/tasks/comicogs-mvp/agents/agent_5.md << 'EOF'
# Agent 5: DevOps & Quality Engineer

## My Responsibilities
- CI/CD pipelines
- Testing frameworks
- Deployment setup
- Monitoring

## Current Checklist
- [ ] Set up GitHub Actions
- [ ] Create Docker configuration
- [ ] Plan testing strategy
- [ ] Set up deployment pipeline

## Dependencies
**I need**: Basic project structure (can start early)
**Others waiting for me**: All agents (for CI/CD)

## Notes
- Focus on automation
- Plan for production deployment
- Set up monitoring early
EOF

# Create .cursorrules file for better Cursor integration
cat > .cursorrules << 'EOF'
# Multi-Agent Development Rules for Comicogs

When acting as a specific agent, always:
1. Read .comicogs/tasks/comicogs-mvp/channel.md first
2. Check your agent-specific file in /agents/ folder  
3. Only work on tasks for your assigned role
4. Update channel.md with progress
5. Signal when ready to hand off to next agent

## Agent Roles:
- Agent 1: Infrastructure & API (Next.js, Prisma, NextAuth)
- Agent 2: Frontend & UI (shadcn/ui, Tailwind, components)
- Agent 3: Business Logic (Stripe, marketplace, e-commerce)
- Agent 4: Search & Data (search algorithms, recommendations)
- Agent 5: DevOps & QA (CI/CD, testing, deployment)

## Communication Format:
[Agent X] - YYYY-MM-DD HH:MM - Brief action
Details: What was accomplished
→ next: What should happen next / which agent should act

## Dependencies:
- Agent 2 waits for Agent 1 (project setup)
- Agent 3 waits for Agent 1 (database schema) + Agent 2 (UI components)
- Agent 4 waits for Agent 1 (basic project structure)
- Agent 5 can work in parallel after basic setup

## Quality Standards:
- Use TypeScript with strict typing
- Follow Next.js 14 App Router patterns
- Implement proper error handling
- Write tests for new functionality
- Update documentation as you work
EOF

# Create .vscode directory and settings for optimal development
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true
  },
  "typescript.preferences.inlayHints.parameterNames.enabled": "all",
  "typescript.preferences.inlayHints.functionLikeReturnTypes.enabled": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "files.associations": {
    "*.md": "markdown",
    "*.prisma": "prisma"
  },
  "markdown.preview.scrollEditorWithPreview": false,
  "markdown.preview.scrollPreviewWithEditor": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.exclude": {
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.git": true,
    "**/.gitignore": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/.next": true,
    "**/dist": true
  }
}
EOF

# Create a simple package.json for the project
cat > package.json << 'EOF'
{
  "name": "comicogs",
  "version": "0.1.0",
  "description": "Comic book marketplace - multi-agent development",
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {},
  "devDependencies": {}
}
EOF

# Create .env.example for environment variables
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/comicogs"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Development
NODE_ENV="development"
EOF

# Create supervisor.js for automated orchestration
cat > supervisor.js << 'EOF'
#!/usr/bin/env node

/**
 * Comicogs Multi-Agent Supervisor
 * Automated orchestration of AI agents for collaborative development
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class MultiAgentSupervisor {
    constructor() {
        this.maxCycles = 50;
        this.currentCycle = 0;
        this.agentHistory = [];
        this.basePath = '.comicogs/tasks/comicogs-mvp';
        
        // Agent dependency map
        this.dependencies = {
            'Agent 1': [], // No dependencies - foundation
            'Agent 2': ['Agent 1'], // Needs project setup
            'Agent 3': ['Agent 1', 'Agent 2'], // Needs database + UI
            'Agent 4': ['Agent 1'], // Needs basic project
            'Agent 5': [] // Can work in parallel
        };
        
        // Agent roles and expertise
        this.agentRoles = {
            'Agent 1': 'Infrastructure & API Lead',
            'Agent 2': 'Frontend & UI/UX Developer',
            'Agent 3': 'Marketplace & Business Logic',
            'Agent 4': 'Search & Data Engineer',
            'Agent 5': 'DevOps & Quality Engineer'
        };
        
        this.init();
    }
    
    init() {
        console.log('🤖 Comicogs Multi-Agent Supervisor v1.0');
        console.log('==========================================');
        this.ensureFileStructure();
    }
    
    ensureFileStructure() {
        const requiredFiles = [
            `${this.basePath}/plan.md`,
            `${this.basePath}/channel.md`
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
            console.log('❌ Missing required files. Run setup script first.');
            process.exit(1);
        }
    }
    
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            return '';
        }
    }
    
    analyzePlan() {
        const planContent = this.readFile(`${this.basePath}/plan.md`);
        const agents = {};
        
        const agentSections = planContent.split(/### Agent \d+/);
        
        agentSections.forEach((section, index) => {
            if (index === 0) return;
            
            const agentNumber = index;
            const agentName = `Agent ${agentNumber}`;
            const tasks = [];
            
            const checklistItems = section.match(/- \[([ x])\] (.+)/g) || [];
            
            checklistItems.forEach(item => {
                const isComplete = item.includes('[x]');
                const taskName = item.replace(/- \[([ x])\] /, '');
                tasks.push({ name: taskName, complete: isComplete });
            });
            
            agents[agentName] = {
                role: this.agentRoles[agentName],
                tasks: tasks,
                completedTasks: tasks.filter(t => t.complete).length,
                totalTasks: tasks.length,
                percentComplete: tasks.length > 0 ? Math.round((tasks.filter(t => t.complete).length / tasks.length) * 100) : 0
            };
        });
        
        return agents;
    }
    
    checkDependencies(agentName, completedAgents) {
        const deps = this.dependencies[agentName] || [];
        return deps.filter(dep => !completedAgents.includes(dep));
    }
    
    determineNextAgent() {
        const planAnalysis = this.analyzePlan();
        
        const completedAgents = Object.entries(planAnalysis)
            .filter(([agent, data]) => data.percentComplete === 100)
            .map(([agent]) => agent);
        
        const availableAgents = Object.entries(planAnalysis)
            .filter(([agent, data]) => {
                if (data.percentComplete === 100) return false;
                const unmetDeps = this.checkDependencies(agent, completedAgents);
                return unmetDeps.length === 0;
            })
            .map(([agent, data]) => ({ agent, ...data }));
        
        if (availableAgents.length === 0) {
            if (completedAgents.length === 5) {
                return { agent: null, reason: 'All agents completed! 🎉' };
            } else {
                return { agent: null, reason: 'All available agents blocked by dependencies' };
            }
        }
        
        const nextAgent = availableAgents.sort((a, b) => b.percentComplete - a.percentComplete)[0];
        
        return { 
            agent: nextAgent.agent, 
            reason: `${nextAgent.agent} has dependencies met`,
            data: nextAgent
        };
    }
    
    generateCursorPrompt(agentName) {
        const agentNumber = agentName.split(' ')[1];
        const role = this.agentRoles[agentName];
        
        return `@cursor You are ${agentName} (${role}).

🎯 Read your instructions: .comicogs/tasks/comicogs-mvp/agents/agent_${agentNumber}.md
📋 Check current status: .comicogs/tasks/comicogs-mvp/channel.md
✅ Update progress in channel.md when done

Work on your next uncompleted task from plan.md. Complete ONE task and update channel.md.`;
    }
    
    async waitForCompletion() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise(resolve => {
            rl.question('⏱️  Press ENTER when agent completes task...\\n', () => {
                rl.close();
                resolve();
            });
        });
    }
    
    async startAutomation() {
        console.log('\\n🚀 Starting Automated Multi-Agent Supervisor\\n');
        
        while (this.currentCycle < this.maxCycles) {
            this.currentCycle++;
            console.log(`🤖 Supervisor Cycle ${this.currentCycle}/${this.maxCycles}`);
            
            const decision = this.determineNextAgent();
            
            if (!decision.agent) {
                console.log(`\\n✅ ${decision.reason}`);
                break;
            }
            
            console.log(`🎯 Next Agent: ${decision.agent}`);
            
            const prompt = this.generateCursorPrompt(decision.agent);
            
            console.log('\\n📋 COPY THIS TO CURSOR:');
            console.log('='.repeat(40));
            console.log(prompt);
            console.log('='.repeat(40));
            
            await this.waitForCompletion();
        }
    }
    
    showStatus() {
        const planAnalysis = this.analyzePlan();
        
        console.log('\\n📊 Project Status:\\n');
        Object.entries(planAnalysis).forEach(([agent, data]) => {
            const status = data.percentComplete === 100 ? '✅' : 
                          data.percentComplete > 0 ? '🔄' : '⏸️';
            console.log(`${status} ${agent}: ${data.percentComplete}% (${data.completedTasks}/${data.totalTasks})`);
        });
        
        const decision = this.determineNextAgent();
        console.log(`\\n🎯 Next: ${decision.agent || decision.reason}`);
    }
    
    getNextPrompt() {
        const decision = this.determineNextAgent();
        
        if (!decision.agent) {
            console.log(`\\n${decision.reason}`);
            return;
        }
        
        const prompt = this.generateCursorPrompt(decision.agent);
        console.log('\\n📋 COPY THIS TO CURSOR:');
        console.log('='.repeat(40));
        console.log(prompt);
        console.log('='.repeat(40));
    }
}

function main() {
    const command = process.argv[2];
    const supervisor = new MultiAgentSupervisor();
    
    switch (command) {
        case 'start':
            supervisor.startAutomation();
            break;
        case 'status':
            supervisor.showStatus();
            break;
        case 'next':
            supervisor.getNextPrompt();
            break;
        default:
            console.log('\\nUsage:');
            console.log('  node supervisor.js start   - Start automation');
            console.log('  node supervisor.js status  - Check status');
            console.log('  node supervisor.js next    - Get next prompt');
            break;
    }
}

if (require.main === module) {
    main();
}
EOF

chmod +x supervisor.js

# Create README.md
cat > README.md << 'EOF'
# Comicogs - Comic Book Marketplace

A modern comic book marketplace built with Next.js 14, inspired by Discogs.

## 🤖 Multi-Agent Development

This project uses an automated multi-agent system with intelligent orchestration:

- **Agent 1**: Infrastructure & API Lead
- **Agent 2**: Frontend & UI/UX Developer
- **Agent 3**: Marketplace & Business Logic
- **Agent 4**: Search & Data Engineer
- **Agent 5**: DevOps & Quality Engineer

## 🚀 Quick Start

### Automated Development
```bash
# Start automated multi-agent supervisor
node supervisor.js start

# Check project status anytime
node supervisor.js status

# Get next agent prompt manually
node supervisor.js next
```

### Manual Development
1. Install dependencies: `npm install`
2. Set up environment: `cp .env.example .env.local`
3. Run development server: `npm run dev`

## 📋 Supervisor Commands

- `node supervisor.js start` - Automated orchestration
- `node supervisor.js status` - Project status overview
- `node supervisor.js next` - Get next agent prompt

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: shadcn/ui + Tailwind CSS
- **Payments**: Stripe
- **Deployment**: Vercel (dev) → AWS ECS (prod)

## 📊 Progress Tracking

The supervisor automatically:
- ✅ Analyzes dependencies between agents
- ✅ Determines optimal agent sequence
- ✅ Generates precise Cursor prompts
- ✅ Tracks progress through channel.md
- ✅ Prevents cycles and deadlocks

Check `.comicogs/tasks/comicogs-mvp/channel.md` for real-time progress.
EOF

echo "✅ Multi-agent structure created!"
echo ""
echo "📁 Files created:"
echo "   - .comicogs/tasks/comicogs-mvp/ (coordination files)"
echo "   - .cursorrules (Cursor configuration)"
echo "   - .vscode/settings.json (workspace settings)"
echo "   - supervisor.js (automated orchestration)"
echo "   - package.json (project base)"
echo "   - .env.example (environment template)"
echo "   - README.md (project documentation)"
echo ""
echo "🤖 AUTOMATED SUPERVISOR (Recommended):"
echo "   node supervisor.js start"
echo ""
echo "📋 Manual Commands:"
echo "   node supervisor.js status  - Check progress"
echo "   node supervisor.js next    - Get next prompt"
echo ""
echo "⚙️  Configure Cursor Settings:"
echo "   Cursor → Settings → Rules for AI → Add:"
echo "   'When acting as a specific agent, always:"
echo "   1. Read .comicogs/tasks/comicogs-mvp/channel.md first"
echo "   2. Check your agent-specific file in /agents/ folder"
echo "   3. Only work on tasks for your assigned role"
echo "   4. Update channel.md with progress"
echo "   5. Signal when ready to hand off to next agent'"
echo ""
echo "🚀 Quick Start:"
echo "   1. Configure Cursor settings above"
echo "   2. Run: node supervisor.js start"
echo "   3. Copy each prompt to Cursor"
echo "   4. Press ENTER when agent finishes"
echo ""
echo "📖 The supervisor handles everything automatically!"