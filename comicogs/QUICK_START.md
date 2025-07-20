# ⚡ Comicogs Multi-Agent Quick Start

## 🚀 Setup (2 minutes)

### 1. Run Setup Script
```bash
mkdir my-comicogs-project
cd my-comicogs-project
bash /path/to/setup-multi-agent.sh
```

### 2. Configure Cursor
Open **Cursor → Settings → Rules for AI**, add:
```
When acting as a specific agent, always:
1. Read .comicogs/tasks/comicogs-mvp/channel.md first
2. Check your agent-specific file in /agents/ folder  
3. Only work on tasks for your assigned role
4. Update channel.md with progress
5. Signal when ready to hand off to next agent
```

### 3. Start Agent 1
```
@cursor Act as Agent 1. Read the supervisor.md file and your agent_1.md file. Check channel.md for status. Begin with your first task: Create Next.js 14 project. Update channel.md when you start and finish.
```

## 🤖 Agent Prompts

### Agent 1 (Infrastructure)
```
@cursor Act as Agent 1. Read agent_1.md and channel.md. Work on: Next.js setup, Prisma, NextAuth.
```

### Agent 2 (Frontend)
```
@cursor Act as Agent 2. Read agent_2.md and channel.md. Work on: shadcn/ui, Tailwind, components.
```

### Agent 3 (Marketplace)
```
@cursor Act as Agent 3. Read agent_3.md and channel.md. Work on: Stripe, e-commerce, business logic.
```

### Agent 4 (Search)
```
@cursor Act as Agent 4. Read agent_4.md and channel.md. Work on: search functionality, recommendations.
```

### Agent 5 (DevOps)
```
@cursor Act as Agent 5. Read agent_5.md and channel.md. Work on: CI/CD, testing, deployment.
```

## 📋 Key Files
- **`channel.md`** - Current status, check this first!
- **`plan.md`** - Phase roadmap and checklists
- **`agents/agent_X.md`** - Individual agent instructions
- **`supervisor.md`** - Overall coordination

## 🔄 Workflow
1. **Check `channel.md`** for current status
2. **Read your agent file** for specific tasks
3. **Work only on your agent's responsibilities**
4. **Update `channel.md`** with progress
5. **Signal next agent** when ready to handoff

## ⚠️ Remember
- ✅ Always read `channel.md` first
- ✅ Stay in your agent role
- ✅ Update progress immediately
- ✅ Signal clear handoffs
- ❌ Don't work on other agents' tasks

## 🎯 Success Flow
```
Agent 1 → Agent 2 → Agent 3
    ↓        ↓
Agent 5 ← Agent 4
```

**Dependencies**: Agent 2 needs Agent 1, Agent 3 needs Agents 1+2

---
**Ready to build Comicogs!** 🚀