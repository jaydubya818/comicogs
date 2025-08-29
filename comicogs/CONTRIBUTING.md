# Contributing to Comicogs

Thank you for your interest in contributing to Comicogs! We welcome contributions from the community and are excited to see what you can bring to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Git
- Docker (optional, for containerized development)

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/comicogs.git
   cd comicogs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

   This starts both frontend (port 3000) and backend (port 4000) servers.

## 📝 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Fix issues automatically
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks

Examples:
```
feat(auth): add OAuth login with Google
fix(api): resolve user creation validation error
docs(readme): update installation instructions
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🏗️ Project Structure

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

## 🧪 Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:frontend # Frontend tests only
npm run test:backend  # Backend tests only
npm run test:e2e      # End-to-end tests
```

### Writing Tests

- **Frontend**: Use Jest and React Testing Library
- **Backend**: Use Jest and Supertest
- **E2E**: Use Playwright

Test files should be placed alongside the code they test or in `__tests__` directories.

## 🎯 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/jaydubya818/comicogs/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Screenshots if applicable

### Suggesting Features

1. Check [Issues](https://github.com/jaydubya818/comicogs/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Proposed implementation (if applicable)

### Submitting Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed
   - Follow our coding standards

3. **Test Your Changes**
   ```bash
   npm run lint
   npm test
   npm run type-check
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   
   Then create a Pull Request on GitHub.

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: 
  - What changes were made and why
  - Link to related issues
  - Screenshots for UI changes
  - Breaking changes (if any)
- **Checklist**:
  - [ ] Tests pass
  - [ ] Code follows style guidelines
  - [ ] Documentation updated
  - [ ] Reviewed my own code
  - [ ] Added tests for new features

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `feature` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `frontend` - Frontend related
- `backend` - Backend related
- `database` - Database related
- `security` - Security related

## 🎨 UI/UX Guidelines

- Follow our design system using ShadCN UI components
- Ensure responsive design across all devices
- Maintain accessibility standards (WCAG 2.1 AA)
- Use semantic HTML
- Include proper ARIA labels
- Test with keyboard navigation

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## ❓ Questions?

- Join our [Discord](https://discord.gg/comicogs)
- Start a [Discussion](https://github.com/jaydubya818/comicogs/discussions)
- Check our [FAQ](https://docs.comicogs.com/faq)

Thank you for contributing to Comicogs! 🚀
