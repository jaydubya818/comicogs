# Comicogs - Next.js MVP

A modern comic book marketplace built with Next.js 14, inspired by Discogs.

## 🚀 Multi-Agent Development System

This project is built using a collaborative multi-agent system where specialized AI agents work together:

- **Agent 1**: Infrastructure & API Lead
- **Agent 2**: Frontend & UI/UX Developer  
- **Agent 3**: Marketplace & Business Logic
- **Agent 4**: Search & Data Engineer
- **Agent 5**: DevOps & Quality Engineer

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel (dev) → AWS ECS (production)

## 📁 Project Structure

```
comicogs-nextjs/
├── .comicogs/                 # Agent coordination files
│   └── tasks/comicogs-mvp/
│       ├── supervisor.md      # Project supervisor
│       ├── plan.md           # Living roadmap
│       ├── channel.md        # Agent communication
│       └── agents/           # Individual agent instructions
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   └── lib/                  # Utilities and configurations
├── prisma/                   # Database schema and migrations
└── public/                   # Static assets
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Set up database**:
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 🎯 Development Phases

### Phase 1: Foundation (Weeks 1-2) - IN PROGRESS
- [x] Next.js 14 project setup
- [ ] Prisma schema design
- [ ] NextAuth.js authentication
- [ ] shadcn/ui component library
- [ ] CI/CD pipeline setup

### Phase 2: Core Marketplace (Weeks 3-4)
- [ ] Comic catalog and browsing
- [ ] Listing creation and management
- [ ] Shopping cart functionality
- [ ] User profiles and dashboards

### Phase 3: Search & Polish (Weeks 5-6)
- [ ] Advanced search with filters
- [ ] Recommendation engine
- [ ] Stripe payment integration
- [ ] Mobile optimization

### Phase 4: Launch Prep (Weeks 7-8)
- [ ] Comprehensive testing
- [ ] Production deployment
- [ ] Security audit
- [ ] MVP launch

## 📊 Agent Status

Check `.comicogs/tasks/comicogs-mvp/channel.md` for real-time agent status and coordination.

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📝 Contributing

This project uses a multi-agent development approach. Each agent has specific responsibilities:

1. Review agent instructions in `.comicogs/tasks/comicogs-mvp/agents/`
2. Check current sprint status in `channel.md`
3. Follow the communication protocol for updates
4. Ensure your changes align with the overall architecture

## 📄 License

This project is private and proprietary.

---

**Multi-Agent System Status**: 🟢 Active  
**Current Phase**: Phase 1 - Foundation  
**Last Updated**: $(date)