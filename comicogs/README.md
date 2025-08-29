# 🚀 Comicogs - Ultimate Comic Collection Platform

A comprehensive comic book collection management platform powered by AI, featuring modern UI components, real-time features, and enterprise-grade functionality.

![Comicogs Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20Express%20%7C%20Prisma-blue)
![Version](https://img.shields.io/badge/Version-2.0.0-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Core Functionality
- **Comic Collection Management** - Organize and track your comic book collection
- **AI-Powered Recognition** - Automatic comic identification and grading
- **Marketplace Integration** - Buy, sell, and trade comics with other collectors
- **Real-time Features** - Live updates, chat, and notifications
- **Advanced Search** - Find comics by series, issue, creator, or condition

### 🎨 Modern UI/UX & Design System
- **ShadCN UI** - Beautiful, accessible component library with MCP integration
- **Tailwind CSS v4** - Modern utility-first styling with CSS-first approach
- **SuperDesign Integration** - Professional design iteration workflow
- **TweakCN Themes** - Runtime-switchable color schemes and themes
- **Animatopy Animations** - Motion-safe micro-interactions and animations
- **Dark Mode** - Full light/dark theme support with CSS custom properties
- **Coolors Palette** - Professional color management and accessibility
- **Responsive Design** - Perfect experience across all devices
- **Mobile Progressive Web App** - Native-like mobile experience

### 🤖 AI-Powered Features
- **Smart Recommendations** - Personalized comic suggestions
- **Image Recognition** - Identify comics from photos
- **Price Predictions** - AI-driven market value estimates
- **Grading Assistant** - Automated condition assessment

### 🏢 Enterprise Features
- **Multi-tenant Architecture** - Support for multiple organizations
- **Advanced Analytics** - Comprehensive reporting and insights
- **API Access** - RESTful APIs for integration
- **Payment Processing** - Stripe integration for transactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (optional)
- Docker & Docker Compose (for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/jaydubya818/comicogs.git
cd comicogs

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
npm run db:setup
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Database**: localhost:5432

## 🧪 Testing & Quality Assurance

### Comprehensive Testing Suite
The platform includes 110+ tests covering critical functionality and accessibility:

```bash
# Run all tests
npm test

# E2E smoke tests (critical user flows)
npm run test:smoke

# Accessibility compliance tests
npm run test:a11y

# Full E2E test suite
npm run test:e2e

# Interactive test runner
npm run test:e2e:ui
```

### Accessibility Testing
- **WCAG 2.1 AA Compliance** - Automated testing with axe-core
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - Comprehensive ARIA implementation
- **Color Contrast** - Automated contrast ratio validation
- **Motion Safety** - Respects prefers-reduced-motion

### Performance Testing
- **Lighthouse Integration** - Core Web Vitals monitoring
- **Bundle Analysis** - Optimized 87.2kB shared JS bundle
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Lazy loading with React.Suspense

## 🎬 Demo & Documentation

### Live Demo Script
Experience all features with our comprehensive demo script:

```bash
# Generate demo screenshots
npm run demo:capture

# Follow the interactive demo guide
open docs/demo-script.md
```

### Key Demo Features
- 🎨 **Multi-theme System** - 4 professional themes with runtime switching
- 🔍 **Advanced Filtering** - Debounced search with URL persistence
- 🛒 **Complete E-commerce Flow** - From browsing to order confirmation
- ♿ **Accessibility Features** - Keyboard navigation and screen reader support
- 📱 **Responsive Design** - Mobile-optimized experience

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - Modern React with concurrent features
- **ShadCN UI** - Component library built on Radix UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Animations and transitions

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### AI/ML
- **OpenAI GPT-4** - Natural language processing
- **Computer Vision** - Image recognition and analysis
- **Machine Learning** - Recommendation algorithms

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipelines
- **Vercel/Netlify** - Deployment platforms

## 🚢 Deployment

Deploy Comicogs to your platform of choice in under 5 minutes:

### 🔥 Vercel (Recommended)
Perfect for the frontend with automatic CI/CD:

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
# Import your repo at vercel.com
# Framework: Next.js
# Build Command: npm run build
# Output Directory: .next

# 3. Set environment variables in Vercel dashboard
```

**One-click deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jaydubya818/comicogs)

### 🌐 Netlify
Automatic deployments with git integration:

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Netlify
# Import your repo at netlify.com
# Build command: npm run build
# Publish directory: .next
```

### 📄 GitHub Pages (Static)
Deploy as a static site:

```bash
# Enable GitHub Pages in repo settings
# Source: GitHub Actions

# Automatic deployment on push to main
npm run export:pages
```

### 🐳 Docker (Full Stack)
Run the complete application with one command:

```bash
# Clone and setup
git clone https://github.com/jaydubya818/comicogs.git
cd comicogs

# Copy environment file
cp env.example .env
# Edit .env with your values

# Start everything
npm run docker:up

# Access your app
# Frontend: http://localhost:3000
# API:      http://localhost:4000
# Database: localhost:5432 (postgres/postgres)
```

### 🔧 Development Setup
For local development with hot reload:

```bash
# Start development services
npm run docker:dev

# In separate terminals:
npm run dev          # Frontend + Backend
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only

# View logs
npm run docker:logs
```

### ☁️ Cloud Platforms

#### **Render**
```bash
# 1. Connect GitHub repo
# 2. Select "Web Service"
# 3. Build Command: npm run build
# 4. Start Command: npm start
```

#### **Railway**
```bash
# 1. Connect GitHub repo  
# 2. Add PostgreSQL addon
# 3. Deploy automatically
```

#### **Fly.io**
```bash
fly launch
fly deploy
```

## 🎨 Design System & Iteration Workflow

Comicogs uses a comprehensive design system built on modern web standards with accessibility and performance as core principles.

### Design Iteration Process

**Phase A → Phase B → Phase C → Phase D Workflow**

1. **Phase A: ASCII Layout (5 variants)**
   - Structure and spacing in text format
   - Information hierarchy planning
   - Responsive breakpoint considerations
   - Use: `/layout-5 [route-name] [context]`

2. **Phase B: Theme Passes (5 variants)**
   - Apply color tokens and visual hierarchy
   - Test light and dark modes
   - Ensure accessibility compliance
   - Use: `/theme-5 [component] [mood]`

3. **Phase C: Animation Layer (motion-safe)**
   - Add micro-interactions ≤ 200ms
   - Wrap in motion-safe guards
   - Progressive enhancement approach
   - Use: `/animate-safe [component] [interaction]`

4. **Phase D: Componentization**
   - Convert to shadcn/React components
   - Add TypeScript interfaces
   - Optimize for performance
   - Use: `/shadcn-plan` and `/shadcn-apply`

### SuperDesign Canvas Integration

Open SuperDesign canvas for visual iteration:
```bash
⌘⇧P → "SuperDesign: Open Canvas"
⌘⇧P → "SuperDesign: Initialize" # creates ~/claude.md context
```

### Color Management with Coolors.co

1. Generate palette at [coolors.co](https://coolors.co/)
2. Export as CSS Variables
3. Map to semantic tokens in `frontend/src/app/globals.css`
4. Test accessibility (4.5:1 contrast minimum)

### TweakCN Theme System

Runtime-toggleable themes with CSS custom properties:
```tsx
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Toggle between default and TweakCN professional theme
<ThemeToggle />
```

### Motion-Safe Animations

All animations respect user preferences:
```tsx
import { Animate, FadeIn, SlideUp } from '@/components/motion/Animate';

// Automatically disabled for users who prefer reduced motion
<FadeIn delay={100}>
  <ComicCard />
</FadeIn>
```

### Design Token System

CSS custom properties with semantic mapping:
```css
/* Raw palette from Coolors */
--coolors-hero-blue: #2563eb;
--coolors-comic-purple: #7c3aed;

/* Semantic tokens */
--color-primary: var(--coolors-hero-blue);
--color-secondary: var(--coolors-comic-purple);
```

### Accessibility & Motion Policy

- **WCAG 2.1 AA Compliance**: 4.5:1 contrast minimum for text
- **Motion Respect**: All animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- **Duration Limits**: Maximum 200ms for interactions, 300ms for complex transitions
- **Focus Management**: Visible focus indicators with proper keyboard navigation
- **Screen Reader Support**: Semantic HTML with ARIA labels

### Design Pattern Library

Pre-built HTML prototypes for rapid iteration:
- `design/patterns/navbar.html` - Navigation patterns
- `design/patterns/hero.html` - Landing page heroes  
- `design/patterns/listing-card.html` - Marketplace listings
- `design/patterns/filters.html` - Search and filter interfaces
- `design/patterns/wantlist-card.html` - Wishlist management

### "No Hard-Coded Hex" Rule

**✅ Correct**: Use CSS custom properties
```css
background: var(--color-primary);
border: 1px solid var(--color-border);
```

**❌ Wrong**: Hard-coded color values
```css
background: #2563eb;
border: 1px solid #e5e7eb;
```

### shadcn MCP Integration

Query the shadcn MCP server for component APIs and best practices:
```
When planning UI components, ALWAYS query the MCP for:
- Component APIs and props
- Accessibility patterns
- Usage examples
- Theming guidance
```

### Agent Slash Commands

Quick design system commands for AI agents:
- `/layout-5 [route]` - Generate 5 ASCII layout variants
- `/theme-5 [component]` - Apply 5 theme variants using tokens
- `/shadcn-plan [feature]` - Generate implementation plan
- `/shadcn-apply [plan]` - Implement using shadcn primitives
- `/a11y-audit [component]` - Generate accessibility checklist

### 🔐 Environment Variables
Copy `env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional
STRIPE_SECRET_KEY="for-payments"
CLOUDINARY_API_KEY="for-image-uploads"
COMIC_VINE_API_KEY="for-comic-data"
```

---

## 📊 Architecture

### Monorepo Structure
```
comicogs/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # Reusable components
│   │   └── lib/       # Utilities and configurations
│   └── package.json
├── backend/           # Express.js API
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── models/    # Database models
│   │   └── middleware/ # Express middleware
│   ├── prisma/        # Database schema and migrations
│   └── package.json
└── package.json       # Root workspace configuration
```

### Data Flow
```
┌─────────────────────────────────────────┐
│              Load Balancer              │
│                (Nginx)                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│              Frontend (Next.js)         │
│          - React Components            │
│          - Server Components           │
│          - API Routes                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│              Backend (Express)          │
│          - REST API                    │
│          - Authentication             │
│          - Business Logic             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│              Database (PostgreSQL)      │
│          - Comic Collections           │
│          - User Management             │
│          - Transaction History         │
└─────────────────────────────────────────┘
```

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build            # Build both applications
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm test                 # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
npm run test:e2e         # Run end-to-end tests

# Database
npm run db:setup         # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (dev only)

# Linting and Formatting
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# Docker
npm run docker:up        # Start production containers
npm run docker:dev       # Start development containers
npm run docker:down      # Stop containers
npm run docker:logs      # View container logs
```

### Database Schema

The application uses Prisma as the ORM with PostgreSQL. Key models include:

- **User** - User accounts and profiles
- **Comic** - Comic book information and metadata
- **Collection** - User's comic collections
- **Transaction** - Marketplace transactions
- **Review** - User reviews and ratings

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/comicogs.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes and commit: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

If you discover a security vulnerability, please send an email to security@comicogs.com. All security vulnerabilities will be promptly addressed.

## 📞 Support

- **Documentation**: [docs.comicogs.com](https://docs.comicogs.com)
- **Issues**: [GitHub Issues](https://github.com/jaydubya818/comicogs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jaydubya818/comicogs/discussions)
- **Discord**: [Join our community](https://discord.gg/comicogs)

---

Made with ❤️ by the Comicogs team# Vercel deployment test - Fri Aug 29 16:57:01 PDT 2025
