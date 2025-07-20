# Agent 1: Infrastructure & API Lead

## 🎯 Core Mission
Build the foundational infrastructure and API layer for Comicogs. You are the technical backbone that enables all other agents to build upon a solid, scalable foundation.

## 🛠️ Primary Responsibilities

### Database Architecture
- Design and implement comprehensive Prisma schema
- Create database migrations and seeding scripts
- Optimize queries and implement proper indexing
- Set up database relationships and constraints
- Handle data validation and integrity

### API Development  
- Create Next.js API routes and Server Actions
- Implement CRUD operations for all entities
- Design RESTful API patterns
- Build reusable API utilities and middleware
- Implement proper error handling and responses

### Authentication & Authorization
- Set up NextAuth.js with GitHub/Google providers
- Implement JWT token management
- Create role-based access control (RBAC)
- Build authentication middleware
- Handle session management

### Core Infrastructure
- Initialize Next.js 14 project with App Router
- Configure TypeScript and ESLint
- Set up development and production environments
- Implement caching strategies
- Create shared utilities and types

## 📋 Phase 1 Tasks (Weeks 1-2)

### Priority 1: Project Foundation
- [ ] **Initialize Next.js Project**
  ```bash
  npx create-next-app@latest comicogs --typescript --tailwind --app
  cd comicogs
  ```
- [ ] **Configure Development Environment**
  - Set up TypeScript strict mode
  - Configure ESLint and Prettier
  - Set up environment variables
  - Create development scripts

### Priority 2: Database Setup
- [ ] **Install and Configure Prisma**
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] **Design Core Schema**
  - Users table with authentication fields
  - Comics catalog with metadata
  - Listings for marketplace
  - Collections for user comic tracking
  - Orders for transaction management

### Priority 3: Authentication System
- [ ] **NextAuth.js Setup**
  ```bash
  npm install next-auth
  ```
  - Configure GitHub and Google providers
  - Set up JWT strategy
  - Create authentication pages
  - Implement session handling

### Priority 4: Core API Routes
- [ ] **Server Actions for Data Operations**
  - User management actions
  - Comic CRUD operations
  - Listing management
  - Collection handling
  - Basic search functionality

## 🗄️ Database Schema Design

### Users Table
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          UserRole  @default(BUYER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Profile information
  bio           String?
  location      String?
  website       String?
  sellerVerified Boolean  @default(false)
  
  // Relationships
  listings      Listing[]
  collections   Collection[]
  orders        Order[]
  sellerOrders  Order[]   @relation("SellerOrders")
  
  @@map("users")
}

enum UserRole {
  BUYER
  SELLER
  ADMIN
}
```

### Comics Table
```prisma
model Comic {
  id           String   @id @default(cuid())
  title        String
  issueNumber  String?
  variant      String?
  publisher    String
  series       String
  year         Int
  month        Int?
  
  // Creator information
  writers      String[]
  artists      String[]
  coverArtists String[]
  
  // Content details
  description  String?
  pageCount    Int?
  coverImage   String?
  images       String[]
  
  // Metadata
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relationships
  listings     Listing[]
  collections  Collection[]
  
  @@map("comics")
}
```

### Additional Core Tables
- **Listings**: Marketplace items for sale
- **Collections**: User comic collections
- **Orders**: Purchase transactions
- **Categories**: Comic categorization
- **Images**: File management

## 🔧 Technical Implementation

### Server Actions Structure
```typescript
// app/lib/actions/comics.ts
export async function createComic(data: CreateComicData) {
  // Validation with Zod
  // Database operation with Prisma
  // Error handling
  // Return type-safe result
}

export async function getComics(filters: ComicFilters) {
  // Query building
  // Pagination
  // Search functionality
  // Type-safe response
}
```

### Authentication Configuration
```typescript
// app/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({ /* config */ }),
    GoogleProvider({ /* config */ }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      // Custom session handling
    },
    jwt: ({ token, user }) => {
      // JWT customization
    },
  },
}
```

### API Response Standards
```typescript
// Standard API response format
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

## 🔄 Integration Points

### With Agent 2 (Frontend)
- Provide type definitions for all API responses
- Create reusable data fetching hooks
- Ensure proper error handling for UI components
- Deliver authentication state management

### With Agent 3 (Marketplace)
- Implement order processing workflows
- Create payment webhook handlers
- Build listing management APIs
- Provide transaction data models

### With Agent 4 (Search)
- Design searchable data structures
- Implement search API endpoints
- Provide data aggregation for recommendations
- Create indexing strategies

### With Agent 5 (DevOps)
- Provide database migration scripts
- Configure environment-specific settings
- Implement health check endpoints
- Create development and production builds

## 📊 Success Metrics

### Week 1 Deliverables
- [ ] Next.js project successfully initialized
- [ ] Prisma schema designed and migrated
- [ ] NextAuth.js authentication working
- [ ] Basic API routes implemented
- [ ] Development environment configured

### Week 2 Deliverables
- [ ] Complete CRUD operations for all entities
- [ ] Role-based access control implemented
- [ ] Database seeded with sample data
- [ ] API documentation created
- [ ] Integration testing setup

## 🚨 Critical Checkpoints

### Before Handoff to Other Agents
- [ ] **Database Schema Approved**: All entities and relationships defined
- [ ] **Authentication Working**: Users can register/login successfully
- [ ] **API Endpoints Tested**: All CRUD operations verified
- [ ] **Type Safety**: TypeScript types exported for frontend use
- [ ] **Documentation**: API endpoints and database schema documented

### Quality Standards
- **Code Coverage**: Minimum 80% for core API functions
- **Type Safety**: 100% TypeScript coverage, no `any` types
- **Performance**: API responses under 200ms for simple queries
- **Security**: All inputs validated, SQL injection prevented
- **Error Handling**: Comprehensive error responses with proper HTTP codes

## 📝 Daily Communication

Update `channel.md` with:
- Completed infrastructure components
- API endpoints ready for frontend integration
- Database changes and migrations
- Authentication flow status
- Blockers requiring other agents' input

## 🔧 Tools & Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "prisma": "^5.0.0", 
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.24.0",
    "zod": "^3.22.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Development Commands
```bash
# Database operations
npx prisma generate
npx prisma db push
npx prisma studio

# Development server
npm run dev

# Type checking
npm run type-check
```

---

**Agent 1 Status**: 🟡 Ready to Begin  
**Next Action**: Initialize Next.js project structure  
**Communication Channel**: Update progress in `../channel.md`