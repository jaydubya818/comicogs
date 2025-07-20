# 🤖 Multi-Agent Workflow Guide

## Quick Start

### Method 1: Sequential Agent Prompting (Recommended)

#### Start with Agent 1:
```
@cursor Please act as Agent 1 (Infrastructure & API Lead). Read .comicogs/tasks/comicogs-mvp/agents/agent_1.md and channel.md. Begin working on your first checklist item: "Initialize Next.js 14 project with TypeScript". Update channel.md with your progress.
```

#### When Agent 1 finishes a task:
```
@cursor As Agent 1, you've completed [specific task]. Update channel.md with your progress and signal which agent should work next based on dependencies.
```

#### Switch to next agent:
```
@cursor Now act as Agent 2 (Frontend & UI/UX Developer). Read channel.md to see Agent 1's progress, then begin your first task from agent_2.md. Update channel.md when you start and finish tasks.
```

### Method 2: Using the Agent Rotation Script

```bash
# Run the interactive script
./.comicogs/agent-rotate.sh

# Or specify agent directly
./.comicogs/agent-rotate.sh 1
```

### Method 3: Cursor Rules Integration

The `.cursorrules` file automatically guides Cursor's behavior:
- Always check `channel.md` before starting work
- Follow agent-specific instructions
- Use proper communication protocol
- Signal handoffs clearly

## Communication Protocol

**Required Format for channel.md updates:**
```
[Agent X] - YYYY-MM-DD HH:MM - Brief action summary
Details: What you're working on or what you completed
Blockers: Any issues preventing progress
→ next: What should happen next / which agent should act
```

**Example:**
```
[Agent 1] - 2025-01-19 15:30 - Completed Next.js project setup
Details: Created Next.js 14 project with TypeScript, Tailwind CSS, and proper folder structure
Blockers: None
→ next: Agent 2 can now begin shadcn/ui installation and component setup
```

## Agent Dependencies

```
Agent 1 (Infrastructure) 
    ↓ (provides project setup)
Agent 2 (Frontend)
    ↓ (provides UI components)
Agent 3 (Marketplace)
    ↓ (provides business logic)
Agent 4 (Search) + Agent 5 (DevOps)
```

**Key Dependencies:**
- Agent 2 needs Agent 1 to complete Next.js setup
- Agent 3 needs Agent 1 to complete database schema
- Agent 3 needs Agent 2 for UI components
- Agent 4 needs Agent 1 for database schema
- Agent 5 can work in parallel after basic project setup

## Monitoring Progress

### Check Status:
```bash
# View recent activity
tail -20 .comicogs/tasks/comicogs-mvp/channel.md

# View current phase progress
cat .comicogs/tasks/comicogs-mvp/plan.md
```

### Resolve Conflicts:
- If agents disagree, intervene manually
- Update `plan.md` to redirect agent focus
- Use `channel.md` to communicate decisions

### Debug Issues:
- Each agent logs reasoning in their progress section
- Check dependencies in individual agent files
- Review handoff criteria for clarity

## Success Metrics

### Phase 1 Complete When:
- [ ] Next.js project runs locally
- [ ] Database schema is deployed
- [ ] Authentication is working
- [ ] Basic UI components are functional
- [ ] CI/CD pipeline is operational

### Ready for Phase 2 When:
- All Phase 1 tasks marked complete in `plan.md`
- No blockers reported in `channel.md`
- All agents have successfully handed off their deliverables

## Tips for Effective Multi-Agent Development

1. **Always read `channel.md` first** - it contains the latest status
2. **Update progress immediately** - don't batch communications
3. **Be specific about handoffs** - clearly state what the next agent needs
4. **Report blockers quickly** - don't let dependencies stall progress
5. **Stay in your lane** - focus on your agent's specific responsibilities
6. **Test as you go** - ensure each component works before handoff

## Emergency Procedures

### If an agent gets stuck:
1. Report the blocker in `channel.md`
2. Check if another agent can help resolve
3. Consider updating the plan if needed
4. Supervisor intervention if critical path is blocked

### If handoffs fail:
1. Review dependencies in agent files
2. Ensure proper communication format was used
3. Check if prerequisites were actually completed
4. Re-read agent mission statements for clarity

---

**Next Action:** Run `./comicogs/agent-rotate.sh` to begin development!