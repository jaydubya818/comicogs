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
        
        // Ensure required files exist
        this.ensureFileStructure();
    }
    
    ensureFileStructure() {
        const requiredFiles = [
            `${this.basePath}/plan.md`,
            `${this.basePath}/channel.md`,
            `${this.basePath}/agents/agent_1.md`,
            `${this.basePath}/agents/agent_2.md`,
            `${this.basePath}/agents/agent_3.md`,
            `${this.basePath}/agents/agent_4.md`,
            `${this.basePath}/agents/agent_5.md`
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
            console.log('❌ Missing required files:');
            missingFiles.forEach(file => console.log(`   - ${file}`));
            console.log('\n💡 Run the setup script first: bash setup-multi-agent.sh');
            process.exit(1);
        }
    }
    
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`❌ Error reading ${filePath}:`, error.message);
            return '';
        }
    }
    
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Error writing ${filePath}:`, error.message);
            return false;
        }
    }
    
    analyzePlan() {
        const planContent = this.readFile(`${this.basePath}/plan.md`);
        const agents = {};
        
        // Parse plan.md for agent tasks
        const agentSections = planContent.split(/### Agent \d+/);
        
        agentSections.forEach((section, index) => {
            if (index === 0) return; // Skip header
            
            const agentNumber = index;
            const agentName = `Agent ${agentNumber}`;
            const tasks = [];
            
            // Extract checklist items
            const checklistItems = section.match(/- \[([ x])\] (.+)/g) || [];
            
            checklistItems.forEach(item => {
                const isComplete = item.includes('[x]');
                const taskName = item.replace(/- \[([ x])\] /, '');
                tasks.push({
                    name: taskName,
                    complete: isComplete
                });
            });
            
            agents[agentName] = {
                role: this.agentRoles[agentName] || 'Unknown Role',
                tasks: tasks,
                completedTasks: tasks.filter(t => t.complete).length,
                totalTasks: tasks.length,
                percentComplete: tasks.length > 0 ? Math.round((tasks.filter(t => t.complete).length / tasks.length) * 100) : 0
            };
        });
        
        return agents;
    }
    
    analyzeChannel() {
        const channelContent = this.readFile(`${this.basePath}/channel.md`);
        
        // Parse latest agent activity
        const agentMessages = channelContent.match(/\\[Agent \\d+\\][^\\[]*(?=\\[Agent \\d+\\]|$)/g) || [];
        const lastMessage = agentMessages[agentMessages.length - 1];
        
        let lastAgent = null;
        let lastAction = null;
        let suggestedNext = null;
        let blockers = [];
        
        if (lastMessage) {
            const agentMatch = lastMessage.match(/\\[Agent (\\d+)\\]/);
            const actionMatch = lastMessage.match(/- (.+)/);
            const nextMatch = lastMessage.match(/→ next: (.+)/);
            const blockerMatch = lastMessage.match(/Blockers?: (.+)/);
            
            if (agentMatch) lastAgent = `Agent ${agentMatch[1]}`;
            if (actionMatch) lastAction = actionMatch[1];
            if (nextMatch) suggestedNext = nextMatch[1];
            if (blockerMatch) blockers = [blockerMatch[1]];
        }
        
        return {
            lastAgent,
            lastAction,
            suggestedNext,
            blockers,
            messageCount: agentMessages.length
        };
    }
    
    checkDependencies(agentName, completedAgents) {
        const deps = this.dependencies[agentName] || [];
        const unmetDeps = deps.filter(dep => !completedAgents.includes(dep));
        return unmetDeps;
    }
    
    determineNextAgent() {
        const planAnalysis = this.analyzePlan();
        const channelAnalysis = this.analyzeChannel();
        
        console.log('\\n📊 Current Project Status:');
        console.log('============================');
        
        Object.entries(planAnalysis).forEach(([agent, data]) => {
            const status = data.percentComplete === 100 ? '✅' : 
                          data.percentComplete > 0 ? '🔄' : '⏸️';
            console.log(`${status} ${agent}: ${data.percentComplete}% (${data.completedTasks}/${data.totalTasks} tasks)`);
        });
        
        // Find agents with completed tasks
        const completedAgents = Object.entries(planAnalysis)
            .filter(([agent, data]) => data.percentComplete === 100)
            .map(([agent]) => agent);
        
        // Find available agents (not completed, dependencies met)
        const availableAgents = Object.entries(planAnalysis)
            .filter(([agent, data]) => {
                if (data.percentComplete === 100) return false; // Already done
                
                const unmetDeps = this.checkDependencies(agent, completedAgents);
                return unmetDeps.length === 0;
            })
            .map(([agent, data]) => ({ agent, ...data }));
        
        console.log('\\n🔍 Dependency Analysis:');
        console.log('========================');
        
        Object.entries(planAnalysis).forEach(([agent, data]) => {
            const deps = this.dependencies[agent];
            const unmetDeps = this.checkDependencies(agent, completedAgents);
            
            if (deps.length === 0) {
                console.log(`${agent}: No dependencies`);
            } else if (unmetDeps.length === 0) {
                console.log(`${agent}: Dependencies met ✅`);
            } else {
                console.log(`${agent}: Waiting for ${unmetDeps.join(', ')} ⏳`);
            }
        });
        
        // Decision logic
        if (availableAgents.length === 0) {
            if (completedAgents.length === 5) {
                return { agent: null, reason: 'All agents completed! 🎉' };
            } else {
                return { agent: null, reason: 'All available agents are blocked by dependencies' };
            }
        }
        
        // Prefer agents with highest completion percentage (continue momentum)
        const nextAgent = availableAgents.sort((a, b) => b.percentComplete - a.percentComplete)[0];
        
        return { 
            agent: nextAgent.agent, 
            reason: `${nextAgent.agent} has dependencies met and ${nextAgent.completedTasks}/${nextAgent.totalTasks} tasks complete`,
            data: nextAgent
        };
    }
    
    generateCursorPrompt(agentName) {
        const agentNumber = agentName.split(' ')[1];
        const role = this.agentRoles[agentName];
        const timestamp = new Date().toISOString().split('T')[0] + ' ' + 
                         new Date().toLocaleTimeString('en-US', { hour12: false });
        
        return `@cursor You are ${agentName} (${role}).

IMPORTANT: This is an automated multi-agent system. Follow these rules strictly:

🎯 YOUR MISSION:
Read your specific instructions in .comicogs/tasks/comicogs-mvp/agents/agent_${agentNumber}.md

📋 BEFORE YOU START:
1. Read .comicogs/tasks/comicogs-mvp/channel.md to see what other agents have completed
2. Check your checklist in .comicogs/tasks/comicogs-mvp/plan.md  
3. Only work on YOUR agent's uncompleted tasks

✅ WHEN YOU FINISH A TASK:
Update channel.md with this EXACT format:

[${agentName}] - ${timestamp} - [Brief description of what you completed]
Details: [Detailed explanation of what was accomplished]
Dependencies resolved: [Which agents can now proceed because of your work]
→ next: [Which agent should work next and on what specific task]

🚫 DO NOT:
- Work on other agents' tasks
- Skip the channel.md update
- Continue working after completing one task (let supervisor coordinate)

🎯 FOCUS ON:
Your next uncompleted task from plan.md. Complete ONE task, update channel.md, then stop.

Begin with your highest priority uncompleted task now.`;
    }
    
    detectCycles() {
        if (this.agentHistory.length < 4) return false;
        
        const recent = this.agentHistory.slice(-4);
        const unique = [...new Set(recent)];
        
        // If only 2 unique agents in last 4 cycles, likely a cycle
        return unique.length <= 2;
    }
    
    async waitForCompletion() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise(resolve => {
            rl.question('⏱️  Press ENTER when the agent has finished their task...\\n', () => {
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
            console.log('='.repeat(50));
            
            const decision = this.determineNextAgent();
            
            if (!decision.agent) {
                console.log(`\\n✅ ${decision.reason}`);
                break;
            }
            
            // Detect cycles
            if (this.detectCycles()) {
                console.log('\\n⚠️  Cycle detected! Breaking to prevent infinite loop.');
                console.log('💡 Check if agents are properly updating channel.md');
                break;
            }
            
            this.agentHistory.push(decision.agent);
            
            const lastAgent = this.agentHistory[this.agentHistory.length - 2];
            if (lastAgent && lastAgent !== decision.agent) {
                console.log(`🔀 Switching from ${lastAgent} to ${decision.agent}`);
            } else {
                console.log(`🎯 Continuing with ${decision.agent}`);
            }
            
            console.log(`📝 Reason: ${decision.reason}\\n`);
            
            // Generate and display prompt
            const prompt = this.generateCursorPrompt(decision.agent);
            
            console.log('📋 COPY THIS PROMPT TO CURSOR:');
            console.log('='.repeat(50));
            console.log(prompt);
            console.log('='.repeat(50));
            
            // Wait for user to execute and complete
            await this.waitForCompletion();
            
            console.log('\\n🔄 Analyzing results...\\n');
        }
        
        if (this.currentCycle >= this.maxCycles) {
            console.log('⚠️  Maximum cycles reached. Check for issues in agent coordination.');
        }
        
        console.log('\\n📊 Final Status:');
        const finalAnalysis = this.analyzePlan();
        Object.entries(finalAnalysis).forEach(([agent, data]) => {
            const status = data.percentComplete === 100 ? '✅' : '⏸️';
            console.log(`${status} ${agent}: ${data.percentComplete}% complete`);
        });
    }
    
    showStatus() {
        console.log('\\n📊 Project Status Report\\n');
        
        const planAnalysis = this.analyzePlan();
        const channelAnalysis = this.analyzeChannel();
        
        console.log('Agent Progress:');
        console.log('===============');
        Object.entries(planAnalysis).forEach(([agent, data]) => {
            const status = data.percentComplete === 100 ? '✅ Complete' : 
                          data.percentComplete > 0 ? '🔄 In Progress' : '⏸️ Waiting';
            console.log(`${agent}: ${status} (${data.completedTasks}/${data.totalTasks} tasks)`);
            
            if (data.percentComplete < 100 && data.tasks.length > 0) {
                const nextTask = data.tasks.find(t => !t.complete);
                if (nextTask) {
                    console.log(`   Next: ${nextTask.name}`);
                }
            }
        });
        
        console.log('\\nRecent Activity:');
        console.log('================');
        if (channelAnalysis.lastAgent) {
            console.log(`Last Agent: ${channelAnalysis.lastAgent}`);
            console.log(`Last Action: ${channelAnalysis.lastAction || 'Unknown'}`);
            if (channelAnalysis.suggestedNext) {
                console.log(`Suggested Next: ${channelAnalysis.suggestedNext}`);
            }
        } else {
            console.log('No recent activity found');
        }
        
        console.log('\\nNext Recommendation:');
        console.log('====================');
        const decision = this.determineNextAgent();
        if (decision.agent) {
            console.log(`Recommended: ${decision.agent}`);
            console.log(`Reason: ${decision.reason}`);
        } else {
            console.log(`Status: ${decision.reason}`);
        }
    }
    
    getNextPrompt() {
        const decision = this.determineNextAgent();
        
        if (!decision.agent) {
            console.log(`\\n${decision.reason}`);
            return;
        }
        
        console.log(`\\n🎯 Next Agent: ${decision.agent}`);
        console.log(`📝 Reason: ${decision.reason}\\n`);
        
        const prompt = this.generateCursorPrompt(decision.agent);
        
        console.log('📋 COPY THIS PROMPT TO CURSOR:');
        console.log('='.repeat(50));
        console.log(prompt);
        console.log('='.repeat(50));
    }
}

// CLI Interface
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
            console.log('\\n🤖 Comicogs Multi-Agent Supervisor\\n');
            console.log('Usage:');
            console.log('  node supervisor.js start   - Start automated orchestration');
            console.log('  node supervisor.js status  - Check project status');
            console.log('  node supervisor.js next    - Get next agent prompt');
            console.log('\\nFor setup: bash setup-multi-agent.sh');
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = MultiAgentSupervisor;