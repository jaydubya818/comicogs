# CLAUDE.md - ComicComp Project Guide

## Project Overview

ComicComp is a comprehensive comic book collection management and marketplace platform modeled after Discogs. It provides live pricing intelligence, collection management, marketplace functionality, and social features for comic collectors.

## Architecture

**Frontend**: React.js with modern UI components
**Backend**: Node.js with Express, PostgreSQL database
**Authentication**: JWT-based with OAuth 2.0 support
**Features**: Collection management, marketplace, pricing intelligence, search, user profiles

## CODEBASE DEVELOPMENT

### Project Structure

```
/backend/
  ├── routes/           # API endpoints
  ├── middleware/       # Authentication, validation
  ├── services/         # Business logic
  ├── database/         # Schema, migrations
  ├── comiccomp/        # Pricing intelligence features
  └── test/            # Test suites

/frontend/
  ├── src/components/   # React components
  ├── src/theme.js     # UI theming
  └── public/          # Static assets

/.taskmaster/tasks/    # Project management tasks
/.claude/slash-commands/ # Claude productivity commands
```

### Build and Test Commands

**Backend:**
- Install: `cd backend && npm install`
- Start: `cd backend && npm start`
- Test: `cd backend && npm test`
- Database setup: `cd backend && node run-migration.js`

**Frontend:**
- Install: `cd frontend && npm install`
- Start: `cd frontend && npm start`
- Build: `cd frontend && npm run build`
- Test: `cd frontend && npm test`

### Database Schema

Key tables:
- `users` - User accounts and profiles
- `comics` - Comic book catalog
- `collections` - User collections
- `marketplace_listings` - Items for sale
- `wantlists` - User wishlists
- `oauth_clients` - OAuth application clients
- `oauth_tokens` - OAuth access tokens

### Code Style Guidelines

- Use consistent indentation (2 spaces for JS/JSX, 4 for SQL)
- Follow React functional component patterns
- Use async/await for database operations
- Implement proper error handling and validation
- Follow RESTful API conventions
- Use descriptive variable and function names

### Security Guidelines

- Always validate and sanitize user input
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on authentication endpoints
- Hash passwords with bcrypt (salt rounds: 12)
- Use HTTPS in production
- Implement proper CORS policies
- Store secrets in environment variables

## Current Task Status

### Completed Tasks (1-13)
✅ Market Data Collection Infrastructure
✅ Price Normalization Engine  
✅ Variant & Condition Classification System
✅ Price Trend Dashboard Backend API
✅ Price Trend Dashboard Frontend
✅ Recommendation Engine
✅ User Notification System
✅ Seller Action Integration
✅ Data Storage & Caching Architecture
✅ Security & Compliance Framework
✅ Performance Monitoring & Analytics
✅ MVP Testing & Launch Preparation
✅ Comic Database & Release Management System

### In Progress Tasks
🔄 Task 14: OAuth Authentication & User Management System
🔄 Task 22: RESTful API Infrastructure & Documentation

### Pending High Priority Tasks
⏳ Task 15: User Collection Management System
⏳ Task 16: User Wantlist & Wishlist System  
⏳ Task 17: Marketplace & Inventory Management System
⏳ Task 23: Advanced Search & Discovery Engine
⏳ Task 24: Mobile-First Frontend Application

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### OAuth 2.0
- `GET /api/auth/authorize` - Authorization endpoint
- `POST /api/auth/token` - Token exchange
- `POST /api/auth/revoke` - Token revocation

### Comics & Collections
- `GET /api/comics` - Browse comics catalog
- `GET /api/comics/search` - Search comics
- `GET /api/collections` - User collections
- `POST /api/collections` - Add to collection
- `GET /api/wantlists` - User wantlists

### Marketplace
- `GET /api/marketplace` - Browse listings
- `POST /api/marketplace` - Create listing
- `GET /api/marketplace/search` - Search listings

## Development Workflow

### Adding New Features
1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement backend API endpoints in `/backend/routes/`
3. Add corresponding frontend components in `/frontend/src/components/`
4. Write tests for both backend and frontend
5. Update documentation
6. Create pull request with `/create-pr` command

### Database Changes
1. Create migration file in `/backend/migrations/`
2. Update schema in `/backend/database/schema.sql`
3. Run migration: `node run-migration.js`
4. Update related model files

### Testing Strategy
- Unit tests for individual functions
- Integration tests for API endpoints  
- Component tests for React components
- End-to-end tests for critical user flows
- Performance tests for high-traffic endpoints

## Useful Slash Commands

Available in `.claude/slash-commands/`:
- `/commit` - Smart commit with conventional commit format
- `/create-pr` - Create pull request with proper formatting
- `/todo` - Manage project todos
- `/clean` - Clean up code and dependencies
- `/pr-review` - Review pull requests

## Development Notes

### Current Implementation Status
- Basic authentication system is functional
- Comic catalog and search are implemented
- Collection management has basic functionality
- Marketplace has core features
- UI follows Discogs-like aesthetic
- Pricing intelligence backend is complete

### Next Development Priorities
1. Complete OAuth 2.0 implementation
2. Enhance API documentation
3. Improve collection management features
4. Add advanced search capabilities
5. Optimize mobile responsiveness

### Known Issues
- OAuth flows need database schema updates
- API rate limiting needs refinement
- Mobile UI needs optimization
- Search performance could be improved

## Environment Variables

Required environment variables:
```
DATABASE_URL=postgresql://username:password@localhost/comiccomp
ACCESS_TOKEN_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
NODE_ENV=development|production
PORT=3001
```

## Contributing

1. Follow the existing code style and conventions
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Use descriptive commit messages
5. Submit pull requests for review

## Resources

- [Task Management](.taskmaster/tasks/) - Detailed task breakdown
- [API Documentation](backend/routes/) - API endpoint implementations
- [Component Library](frontend/src/components/) - React components
- [Database Schema](backend/database/schema.sql) - Database structure
- [Testing](backend/test/) - Test suites and examples