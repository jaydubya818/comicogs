# Agent Slash Commands for Comicogs Design System

## Layout Generation Commands

### `/layout-5`
**Purpose**: Generate 5 ASCII layout variants for any route

**Usage**:
```
/layout-5 [route-name] [context]
```

**Examples**:
```
/layout-5 vault "comic collection page with filters and table"
/layout-5 marketplace "listing grid with seller info and quick actions"
/layout-5 wishlist "want list with price alerts and search"
```

**Output Format**:
```
Variant 1: [Name] - [Key differentiator]
┌─────────────────────────────────────┐
│ [ASCII layout representation]       │
│                                     │
└─────────────────────────────────────┘

Responsive Breakpoints:
- Mobile: [description]
- Tablet: [description]  
- Desktop: [description]

Filter Position Options:
- Sidebar (desktop)
- Top bar (tablet)
- Drawer (mobile)
```

**Requirements**:
- Focus on information hierarchy
- Consider responsive breakpoints (mobile-first)
- Include filter/search positioning variants
- Annotate interactive elements
- Specify content flow patterns

### `/theme-5`
**Purpose**: Apply 5 theme variants using our CSS variables only

**Usage**:
```
/theme-5 [component/layout] [mood/context]
```

**Examples**:
```
/theme-5 hero-section "professional marketplace feel"
/theme-5 comic-table "data-dense but approachable"
/theme-5 listing-card "trustworthy seller presentation"
```

**Output Requirements**:
- **NO hard-coded hex values** - only use our CSS variables
- Include both light and dark mode variants
- Show hover states and interactive feedback
- Consider accessibility contrast ratios
- Map to our semantic token system

**CSS Variable Usage**:
```css
/* ✅ Correct: Use our tokens */
background: var(--color-background-primary);
border: 1px solid var(--color-border-secondary);
color: var(--color-text-primary);

/* ❌ Wrong: Hard-coded values */
background: #ffffff;
border: 1px solid #e5e7eb;
color: #1f2937;
```

## shadcn Integration Commands

### `/shadcn-plan`
**Purpose**: Generate implementation plan from PRD using shadcn components

**Usage**:
```
/shadcn-plan [feature-description]
```

**Process**:
1. Query shadcn MCP for relevant components
2. Map requirements to shadcn primitives
3. Identify custom component needs
4. Plan accessibility implementation
5. Generate `design/implementation.md`

**Output Structure**:
```markdown
# Implementation Plan: [Feature Name]

## Requirements Summary
- [Requirement 1]
- [Requirement 2]

## shadcn Component Mapping
| Requirement | shadcn Component | Custom Logic Needed |
|-------------|------------------|-------------------|
| Data table  | Table            | Sorting logic     |
| Filters     | Select, Popover  | Query state       |

## Component Hierarchy
[ASCII component tree]

## Accessibility Checklist
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management

## Implementation Sequence
1. [Step 1]
2. [Step 2]
```

### `/shadcn-apply`
**Purpose**: Implement the plan in `frontend/src/app` using shadcn primitives

**Usage**:
```
/shadcn-apply [plan-file-path]
```

**Process**:
1. Read implementation plan
2. Install required shadcn components
3. Create component files with proper structure
4. Implement accessibility features
5. Add TypeScript interfaces
6. Integrate with our CSS variable system

## Component Creation Commands

### `/component-create`
**Purpose**: Generate a new component following our standards

**Usage**:
```
/component-create [component-name] [type] [requirements]
```

**Examples**:
```
/component-create ComicCard display "show cover, title, grade, price with quick actions"
/component-create FilterDrawer form "series, grade, price range filters with URL persistence"
/component-create WantlistModal form "add comic to wishlist with max price alert"
```

**Generated Structure**:
```typescript
// frontend/src/components/[category]/[ComponentName].tsx
interface [ComponentName]Props {
  // TypeScript interface
}

export function [ComponentName]({ ...props }: [ComponentName]Props) {
  // Implementation using shadcn primitives
  // CSS variables integration
  // Accessibility features
  // Motion-safe animations
}
```

## Animation Commands

### `/animate-safe`
**Purpose**: Add motion-safe animations to components

**Usage**:
```
/animate-safe [component] [interaction-type]
```

**Examples**:
```
/animate-safe comic-card hover
/animate-safe filter-drawer open-close
/animate-safe listing-grid load-state
```

**Requirements**:
- All animations ≤ 200ms duration
- Wrapped in `@media (prefers-reduced-motion: no-preference)`
- Use our motion tokens (`--motion-duration-*`, `--motion-ease-*`)
- Include fallback states for reduced motion

## Quality Assurance Commands

### `/a11y-audit`
**Purpose**: Generate accessibility checklist for component/page

**Usage**:
```
/a11y-audit [component/page] [user-type]
```

**Examples**:
```
/a11y-audit comic-table keyboard-user
/a11y-audit filter-drawer screen-reader
/a11y-audit marketplace-page motor-impaired
```

**Checklist Output**:
- [ ] Keyboard navigation complete path
- [ ] Focus indicators visible and logical
- [ ] ARIA labels and roles correct
- [ ] Color contrast ratios meet WCAG 2.1 AA
- [ ] Screen reader announcements clear
- [ ] Motion respects user preferences

### `/perf-check`
**Purpose**: Verify performance considerations

**Usage**:
```
/perf-check [component] [data-size]
```

**Examples**:
```
/perf-check comic-table 1000-items
/perf-check listing-grid infinite-scroll
/perf-check filter-drawer complex-queries
```

## Integration Commands

### `/integrate-api`
**Purpose**: Connect component to our backend API

**Usage**:
```
/integrate-api [component] [endpoint] [data-pattern]
```

**Examples**:
```
/integrate-api ComicTable /api/comics paginated-with-filters
/integrate-api WantlistCard /api/wantlist crud-operations
/integrate-api ListingForm /api/listings create-with-validation
```

**Generated Code**:
- TanStack Query integration
- Loading and error states
- Optimistic updates
- Error boundary handling

## Documentation Commands

### `/doc-component`
**Purpose**: Generate comprehensive component documentation

**Usage**:
```
/doc-component [component-name]
```

**Output**: Storybook-ready documentation with:
- Props interface documentation
- Usage examples
- Accessibility notes
- Performance considerations
- Design token usage

### `/doc-pattern`
**Purpose**: Document reusable design patterns

**Usage**:
```
/doc-pattern [pattern-name] [use-cases]
```

**Examples**:
```
/doc-pattern data-table "comics, listings, orders, users"
/doc-pattern filter-system "search, category, price, date"
/doc-pattern card-layout "comics, sellers, collections"
```

## Command Usage Guidelines

### Before Using Commands
1. **Check existing patterns** in `design/patterns/`
2. **Review component inventory** in `frontend/src/components/`
3. **Confirm CSS variables** are up to date in `globals.css`
4. **Query shadcn MCP** for latest component APIs

### After Command Execution
1. **Test accessibility** with keyboard and screen reader
2. **Verify responsive design** across breakpoints
3. **Check motion preferences** are respected
4. **Validate CSS variables** usage (no hard-coded colors)
5. **Run performance audit** for complex components

### Command Chaining Examples
```bash
# Complete feature workflow
/layout-5 vault "comic collection management"
/theme-5 vault-layout "professional data focus"
/shadcn-plan "vault page with table and filters"
/shadcn-apply design/implementation.md
/animate-safe vault-components hover-states
/a11y-audit vault-page all-users
/integrate-api VaultComponents /api/comics paginated
```

## Success Metrics

### Command Effectiveness
- Reduce design-to-code time by 60%
- Achieve 100% CSS variable compliance
- Maintain zero accessibility violations
- Keep animation performance under 200ms

### Quality Standards
- All generated components pass our lint rules
- TypeScript strict mode compliance
- Consistent with existing design patterns
- Performance budget adherence
