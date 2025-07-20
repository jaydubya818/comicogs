# 🎯 Cursor Configuration for Multi-Agent Development

## Cursor Settings Configuration

### Step 1: Open Cursor Settings
1. Open Cursor
2. Go to **Settings** (Cmd/Ctrl + ,)
3. Navigate to **Rules for AI**
4. Add the configuration below

### Step 2: Add Multi-Agent Rules
Copy and paste this into your **Rules for AI**:

```
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
```

## Additional Cursor Optimizations

### Step 3: Enable Cursor Features
Enable these Cursor features for better multi-agent development:

1. **Auto-completion**: Enable for faster coding
2. **Code Actions**: For quick refactoring
3. **File Watching**: To track changes across agents
4. **Git Integration**: For version control coordination

### Step 4: Workspace Settings
Create a `.vscode/settings.json` file in your project:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "typescript.preferences.inlayHints.parameterNames.enabled": "all",
  "typescript.preferences.inlayHints.functionLikeReturnTypes.enabled": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.md": "markdown"
  },
  "markdown.preview.scrollEditorWithPreview": false,
  "markdown.preview.scrollPreviewWithEditor": false
}
```

## Keyboard Shortcuts for Multi-Agent Development

### Recommended Shortcuts:
- **Cmd/Ctrl + Shift + P**: Open command palette
- **Cmd/Ctrl + `**: Open terminal
- **Cmd/Ctrl + B**: Toggle sidebar
- **Cmd/Ctrl + Shift + E**: Open file explorer
- **Cmd/Ctrl + P**: Quick file open

### Custom Shortcuts for Agent Files:
You can set up custom shortcuts to quickly open agent coordination files:

1. Go to **Settings > Keyboard Shortcuts**
2. Add custom shortcuts for:
   - Open `channel.md`
   - Open `plan.md`
   - Open current agent file

## Multi-Agent Workflow in Cursor

### Starting a Session:
1. Open project in Cursor
2. Press **Cmd/Ctrl + Shift + P**
3. Type your agent prompt:
   ```
   @cursor Act as Agent 1. Read supervisor.md and agent_1.md. Check channel.md for status. Begin with your first task.
   ```

### Switching Agents:
1. Check `channel.md` for handoff signals
2. Switch agent context:
   ```
   @cursor Now act as Agent 2. Read channel.md for Agent 1's progress. Begin your tasks from agent_2.md.
   ```

### Monitoring Progress:
- Keep `channel.md` open in a tab
- Use split view to see agent files and code simultaneously
- Monitor the terminal for build/test output

## Troubleshooting Cursor Issues

### If Cursor loses context:
1. Re-read the agent file: `@cursor Read my agent file again`
2. Check channel status: `@cursor Check channel.md for latest updates`
3. Restart agent context: `@cursor Act as Agent X, starting fresh`

### If agents conflict:
1. Clear Cursor context: Start new conversation
2. Explicitly state current agent role
3. Reference the specific agent file
4. Check dependencies in `plan.md`

### Performance optimization:
1. Close unnecessary files/tabs
2. Use Cursor's file search instead of opening everything
3. Enable auto-save to reduce manual saves
4. Use terminal commands for repetitive tasks

## Advanced Cursor Integration

### Custom Commands:
You can create custom Cursor commands for common multi-agent tasks:

```json
{
  "commands": [
    {
      "name": "agent.checkStatus",
      "command": "@cursor Check channel.md and tell me which agent should work next"
    },
    {
      "name": "agent.handoff",
      "command": "@cursor Update channel.md with my progress and signal next agent"
    }
  ]
}
```

### Extensions Recommendations:
- **Error Lens**: Inline error highlighting
- **GitLens**: Enhanced git integration
- **Prisma**: Database schema support
- **Tailwind CSS IntelliSense**: CSS utility suggestions
- **TypeScript Hero**: Auto imports and organization

---

## Quick Reference Card

**Essential Commands:**
- Start Agent: `@cursor Act as Agent X. Read agent_X.md and channel.md.`
- Check Status: `@cursor What's the current status in channel.md?`
- Handoff: `@cursor Update channel.md with progress and signal next agent`
- Switch Agent: `@cursor Now act as Agent Y based on channel.md handoff`

**Key Files:**
- `channel.md` - Current status and communication
- `plan.md` - Overall roadmap and checklists  
- `agents/agent_X.md` - Individual agent instructions
- `supervisor.md` - High-level coordination

**Remember:** Always read `channel.md` first, work only on your agent's tasks, and communicate clearly when handing off!