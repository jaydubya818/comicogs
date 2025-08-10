# Post-Update Verification Checklist (Comicogs Platform)

> Complete verification runbook for the Comicogs comic marketplace platform. Use this as a **single source of truth** for validating updates before production deployment.

**Platform Stack**: Next.js 14, React 19, TypeScript, Prisma, PostgreSQL, Redis, shadcn/ui, Playwright, Docker

---

## 0) Create a safety branch + draft PR
```bash
git checkout -b chore/post-update-verification-$(date +%Y%m%d)
# Push and open a draft PR so CI runs on every push
git push -u origin chore/post-update-verification-$(date +%Y%m%d)
```
**Cursor prompt:**  
> Create a draft PR named "Post-Update Verification - $(date)" for the Comicogs platform and ensure all CI pipelines (GitHub Actions, Vercel preview, testing) trigger for each push. Include PR template with verification checklist.

---

## 1) Fast static checks (fail fast)
**Cursor prompt:**  
> Run comprehensive **type checks** and **lint** for the Comicogs Next.js platform. Auto-fix what you can and summarize remaining issues by file:
- **TypeScript**: `npx tsc --noEmit --project tsconfig.json`
- **ESLint**: `npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0`
- **Prisma**: `npx prisma validate && npx prisma generate`
- **Tailwind**: Verify all CSS classes are valid
- **Component validation**: Check all shadcn/ui component usage

Also:  
> Scan the **diff vs `origin/main`** for TODO/HACK/FIXME/TEMP comments. Group findings by severity, component type (UI/API/Database), and create GitHub issues for critical items.

---

## 2) Clean build + dependency sanity
**Cursor prompt:**  
> Perform a **clean install and full build** from scratch for the Comicogs platform. Flag dependency changes and peer warnings:
```bash
rm -rf node_modules .next
rm -rf comicogs-nextjs/node_modules comicogs-nextjs/.next
npm cache clean --force
npm install
cd comicogs-nextjs && npm install && npm run build
```

**Package analysis:**  
> Compare `package-lock.json` vs `origin/main`; list added/removed/upgraded packages focusing on:
- React/Next.js ecosystem updates
- UI library changes (shadcn/ui, Tailwind)
- Database/ORM updates (Prisma)
- Security-related packages
- Flag any major version bumps as high-risk

---

## 3) Tests: unit → integration → e2e (with coverage deltas)
**Cursor prompt:**  
> Run the **complete test suite** for Comicogs with coverage reporting:
```bash
# Unit and integration tests
cd comicogs-nextjs
npm run test:coverage

# E2E tests with Playwright
npm run test:e2e
npm run test:accessibility  # WCAG compliance tests
npm run test:performance   # Core Web Vitals
```

**Coverage analysis:**  
> Compare test coverage vs `origin/main` by module:
- Components coverage (target: >90%)
- API endpoints coverage (target: >95%)
- Business logic coverage (target: >85%)
- Integration scenarios coverage

**E2E validation:**  
> Run comprehensive Playwright tests covering:
- User authentication flows
- Comic search and marketplace
- AI grading and recognition
- Real-time features (WebSocket)
- Mobile responsive design
- Cross-browser compatibility (Chrome, Firefox, Safari)

---

## 4) Contract & schema compatibility
**Cursor prompt:**  
> Validate **API and database contracts** for the Comicogs platform:

**Database migrations:**  
```bash
# Test migrations up and down
cd comicogs-nextjs
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma db seed
# Test rollback capability
npx prisma migrate reset --force
```

**API contract validation:**  
> Check GraphQL schema compatibility:
- Validate schema changes don't break existing queries
- Ensure backward compatibility for mobile app
- Verify REST endpoint contracts
- Test WebSocket event schemas

**Third-party integrations:**  
> Validate external API contracts:
- Stripe payment processing
- OpenAI API for comic recognition
- Redis vector search
- NFT marketplace contracts

---

## 5) Runtime smoke (prod-like, local)
**Cursor prompt:**  
> Bring up the **complete Comicogs stack locally** with Docker and run comprehensive smoke tests:

```bash
# Start full stack
docker-compose down -v
docker-compose up --build -d

# Wait for services
./scripts/wait-for-services.sh

# Run smoke test suite
./scripts/smoke-test-comicogs.sh
```

**Smoke test scenarios:**  
> Execute critical user journeys:
1. **User Registration/Login** → Profile setup → Email verification
2. **Comic Search** → Semantic search → Results filtering → Comic details
3. **Marketplace Flow** → Browse → Add to cart → Checkout → Payment
4. **AI Features** → Upload comic → Get grading → Price analysis
5. **Real-time Features** → Live price updates → Notifications → Chat
6. **Mobile Experience** → Camera scanner → Touch navigation
7. **Enterprise Features** → B2B dashboard → Bulk operations
8. **Error Scenarios** → Network failures → Invalid inputs → Rate limiting

**Service health monitoring:**  
> Tail logs and summarize WARN/ERROR by service:
- Next.js application logs
- Database connection health
- Redis cache performance
- WebSocket connection stability
- AI service response times

---

## 6) Feature flags & configuration
**Cursor prompt:**  
> Audit **feature flags and environment configuration** for Comicogs:

**Feature toggles validation:**  
> Review configuration changes:
- AI grading features (enabled/disabled per tier)
- Real-time features toggle
- Blockchain/NFT marketplace features
- Enterprise B2B features
- Beta feature access controls

**Environment parity:**  
> Ensure configuration consistency across:
- Development environment
- Staging environment  
- Production environment
- Mobile app configuration

**Security configuration:**  
> Validate secure defaults:
- API rate limiting settings
- Authentication token expiry
- Database connection limits
- File upload restrictions

---

## 7) Security & compliance scan
**Cursor prompt:**  
> Run comprehensive **security analysis** for the Comicogs platform:

```bash
# Dependency vulnerability scan
npm audit --audit-level moderate
npm run security:scan

# Secret detection
npx @gitguardian/ggshield secret scan path .
git log --oneline -10 | xargs -I {} npx @gitguardian/ggshield secret scan commit {}

# SAST analysis
npx eslint-plugin-security .
```

**Security checklist:**  
> Validate security measures:
- Authentication implementation (NextAuth.js)
- API endpoint authorization
- Input sanitization and validation
- SQL injection prevention (Prisma)
- XSS protection
- CSRF token validation
- File upload security
- Payment processing security (Stripe)

**Compliance verification:**  
> Check regulatory compliance:
- GDPR data handling
- CCPA compliance
- PCI DSS for payments
- Accessibility (WCAG 2.1 AA)

---

## 8) Performance & regression analysis
**Cursor prompt:**  
> Benchmark **performance metrics** for Comicogs critical paths:

**Core Web Vitals:**  
```bash
# Run Lighthouse CI
npx lighthouse-ci autorun

# Performance testing
npm run test:performance
```

**Key metrics to validate:**  
> Compare before/after performance:
- Homepage load time (target: <2s)
- Search results rendering (target: <1s)
- Comic image loading (target: <3s)
- AI grading response time (target: <10s)
- Database query performance
- API endpoint response times
- Memory usage patterns
- Bundle size analysis

**Regression detection:**  
> Flag performance regressions:
- Page load time increases >20%
- API response time increases >30%
- Memory usage increases >15%
- Bundle size increases >10%

---

## 9) Documentation & developer experience
**Cursor prompt:**  
> Update **documentation and DX assets** for Comicogs:

**Documentation updates:**  
> Ensure current documentation:
- README.md with latest setup instructions
- API documentation (GraphQL schema)
- Component Storybook documentation
- Database schema documentation
- Deployment guides
- Feature flag documentation

**Developer experience:**  
> Validate DX improvements:
- Development environment setup
- Hot reload functionality
- Error messages clarity
- Debugging capabilities
- IDE integration

**Changelog generation:**  
> Generate comprehensive CHANGELOG.md entry:
- New features added
- Bug fixes implemented
- Breaking changes (if any)
- Performance improvements
- Security updates

---

## 10) Deployment readiness + staging validation
**Cursor prompt:**  
> Prepare **staging deployment** for Comicogs platform:

**Staging deployment plan:**  
```bash
# Database migration strategy
npx prisma migrate deploy --preview-feature

# Environment configuration
cp .env.staging .env.local

# Build and deploy to staging
npm run build:staging
npm run deploy:staging
```

**Staging smoke test:**  
> Execute full user journey on staging:
1. Domain accessibility and SSL
2. Database connectivity and performance  
3. Third-party service integration
4. Payment processing (test mode)
5. Email notifications
6. Mobile app compatibility
7. CDN and asset delivery
8. Monitoring and alerting

**Rollback preparation:**  
> Document rollback procedures:
- Database migration rollback steps
- Application version rollback
- CDN cache invalidation
- DNS failover procedures
- Emergency contact procedures

---

## 11) Go/No-Go gates (must pass all)

### ✅ **Critical Gates**
- [ ] **Build Status**: All builds green, zero TypeScript errors
- [ ] **Test Coverage**: >90% component coverage, >95% API coverage
- [ ] **Security**: No high/critical vulnerabilities, all secrets secured
- [ ] **Performance**: Core Web Vitals in green, no >20% regressions
- [ ] **Accessibility**: WCAG 2.1 AA compliance maintained
- [ ] **Database**: Migrations tested up/down, backup verified
- [ ] **API Compatibility**: No breaking changes to public APIs
- [ ] **Mobile**: React Native app compatibility verified

### ✅ **Quality Gates**
- [ ] **Documentation**: Updated and reviewed
- [ ] **Feature Flags**: Properly configured with safe defaults
- [ ] **Monitoring**: Alerts configured, dashboards updated
- [ ] **Rollback Plan**: Tested and documented
- [ ] **Staging Validation**: Full smoke test passed
- [ ] **Team Approval**: Code review and QA sign-off

---

## Automated verification script

Create and run the comprehensive verification script:

```bash
#!/bin/bash
# scripts/verify-comicogs-update.sh

echo "🚀 Starting Comicogs Platform Verification..."

# Run all verification steps
./scripts/verify-types.sh
./scripts/verify-tests.sh  
./scripts/verify-security.sh
./scripts/verify-performance.sh
./scripts/verify-staging.sh

# Generate final report
echo "📊 Generating verification report..."
./scripts/generate-verification-report.sh > /tmp/comicogs_verification_report.md

echo "✅ Verification complete! Check /tmp/comicogs_verification_report.md"
```

---

## Cursor "macro" prompts (paste as-is)

### **A. Comicogs-specific diff analysis**
> Analyze the diff vs `origin/main` for the Comicogs platform. Focus on:
- React component changes (UI/shadcn components)
- Database schema modifications (Prisma)
- API endpoint changes (GraphQL/REST)
- Real-time feature updates (WebSocket)
- AI/ML integration changes
- Payment processing modifications
- Mobile app compatibility
Produce a **risk-ranked test plan** covering unit/integration/e2e scenarios and generate missing tests for uncovered comic marketplace workflows.

### **B. Complete Comicogs verification run**
> Execute comprehensive verification for Comicogs platform:
1. TypeScript compilation and ESLint validation
2. Prisma schema validation and migration testing
3. Component library and shadcn/ui compatibility
4. Full test suite (unit/integration/e2e/accessibility)
5. Security scan (dependencies, secrets, SAST)
6. Performance benchmarking (Core Web Vitals, API response times)
7. Database migration up/down testing
8. Staging deployment validation
Generate a **detailed markdown report** with PASS/FAIL status, metrics, and actionable next steps.

### **C. Production rollout checklist for Comicogs**
> Create Comicogs production rollout checklist:
1. **Pre-deployment**: Database backups, service health checks
2. **Migration phase**: Apply Prisma migrations, verify data integrity
3. **Deployment**: Deploy Next.js app, update CDN, validate SSL
4. **Feature enablement**: Gradually enable new features per user segment
5. **Validation**: Run production smoke tests, verify integrations
6. **Monitoring**: Confirm alerts, check dashboards, validate metrics
7. **Rollback procedures**: Database rollback, app version revert, DNS failover
8. **On-call assignment**: Engineering team contact information

---

### Platform-specific considerations

- **Next.js/React**: Verify SSR/SSG builds, component hydration, route configurations
- **Prisma/PostgreSQL**: Test connection pooling, query performance, migration safety
- **Redis**: Validate caching strategies, session storage, vector search performance
- **AI Integration**: Test OpenAI API quotas, response times, error handling
- **Payment Processing**: Validate Stripe webhooks, PCI compliance, refund flows
- **Real-time Features**: Test WebSocket connections, message delivery, connection recovery
- **Mobile App**: Verify React Native compatibility, API parity, deep linking
- **Enterprise Features**: Test B2B workflows, white-label configurations, bulk operations

---

**🎯 Success Criteria**: All gates passed, staging validated, rollback tested, team approved
**📞 Emergency Contacts**: Engineering team, DevOps, Product owner
**📈 Monitoring**: Application metrics, business KPIs, user experience metrics
