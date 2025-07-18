# Taskmaster.AI Tasks Directory

This directory contains all generated tasks for the Comicogs project.

## Structure
- Tasks are generated automatically from the PRD
- Each task includes detailed implementation steps
- Tasks are organized by feature area and priority
- Dependencies between tasks are clearly marked

## Usage
After setting up your API keys in `.cursor/mcp.json`, you can:

1. **Parse PRD**: Ask Claude to "Parse my PRD at .taskmaster/docs/prd.txt"
2. **View tasks**: Ask "What's the next task I should work on?"
3. **Implement tasks**: Ask "Can you help me implement task [number]?"
4. **Research**: Ask "Research the latest best practices for [topic]"

## Files
- Generated task files will appear here after parsing the PRD
- Task files are typically named: `task_[number]_[description].md`
- Each task includes context, requirements, and implementation details

## Getting Started
1. Make sure you have API keys configured in `.cursor/mcp.json`
2. Enable the taskmaster-ai MCP server in Cursor settings
3. Say "Initialize taskmaster-ai in my project" in the AI chat
4. Say "Parse my PRD" to generate tasks from the PRD file 