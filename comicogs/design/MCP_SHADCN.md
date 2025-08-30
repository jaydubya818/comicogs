# shadcn MCP Server Integration Guide

## Overview

The shadcn MCP server provides direct access to shadcn/ui component APIs, examples, and best practices through Claude Code integration.

**Repository**: https://github.com/Jpisnice/shadcn-ui-mcp-server

## Core Usage Rule

> **When planning or implementing UI using shadcn, ALWAYS query the MCP for component APIs and examples.**

This ensures we're using the latest shadcn patterns, proper accessibility features, and optimal implementation approaches.

## MCP Integration Setup

### Installation (if not already configured)
```bash
# Add to your MCP configuration
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["shadcn-ui-mcp-server"],
      "env": {}
    }
  }
}
```

### Available MCP Functions
- `get_component_info(name)` - Get component API and props
- `get_component_examples(name)` - Get usage examples
- `search_components(query)` - Find relevant components
- `get_theming_guide()` - Get theming best practices
- `get_accessibility_patterns(component)` - Get a11y guidelines

## Slash Command Presets

### `/shadcn-plan`
**Purpose**: Generate implementation plan from PRD using shadcn components

**Usage**:
```
/shadcn-plan [feature description]
```

**Example**:
```
/shadcn-plan "Create a comic listing page with filterable table, search bar, and quick actions"
```

**Output**: Generates `design/implementation.md` with:
- Component breakdown
- shadcn primitive mapping
- Custom component needs
- Implementation sequence
- Accessibility considerations

### `/shadcn-apply`
**Purpose**: Implement the plan in `frontend/src/app` using shadcn primitives

**Usage**:
```
/shadcn-apply [plan file path]
```

**Example**:
```
/shadcn-apply design/implementation.md
```

**Output**: Creates actual React components using:
- Proper shadcn component imports
- Accessibility attributes
- TypeScript interfaces
- CSS variable integration

## Example Planning Prompt

```markdown
Context: Building a comic book marketplace table component

Requirements:
- Display comic listings with cover, title, grade, price, seller
- Sortable columns (title, grade, price, date)
- Filterable by series, grade, price range
- Responsive design (cards on mobile, table on desktop)
- Quick actions: Add to cart, Add to wishlist, Quick view
- Loading states and empty states
- Accessibility: keyboard navigation, screen reader support

Query MCP for:
1. Best table component for this use case
2. Filter drawer/popover patterns
3. Loading skeleton recommendations
4. Mobile responsive table alternatives
5. Accessibility patterns for sortable tables

Generate implementation plan considering:
- Performance (virtualization for large datasets)
- UX (smooth interactions, clear feedback)
- A11y (WCAG 2.1 AA compliance)
- Maintainability (reusable components)
```

## Component Planning Workflow

### 1. Requirements Analysis
- [ ] Query MCP for relevant shadcn components
- [ ] Identify custom components needed
- [ ] Map accessibility requirements
- [ ] Plan responsive behavior

### 2. Architecture Planning
```markdown
# Component Hierarchy
ComicsTable/
├── TableContainer          # shadcn Table
├── TableFilters           # shadcn Select, Input, Popover
├── TableHeader            # shadcn TableHeader with sort
├── TableBody              # shadcn TableBody
├── ComicRow               # Custom row component
├── QuickActions           # shadcn DropdownMenu
├── LoadingState           # shadcn Skeleton
└── EmptyState             # Custom component
```

### 3. Implementation Sequence
1. **Primitives First**: Use shadcn base components
2. **Composition**: Combine primitives into compound components
3. **Customization**: Add brand-specific styling
4. **Accessibility**: Enhance with ARIA patterns
5. **Testing**: Verify with assistive technologies

## MCP Query Examples

### Component Discovery
```typescript
// Find table-related components
const tableComponents = await mcp.search_components("table data grid");

// Get specific component details
const tableInfo = await mcp.get_component_info("table");
const selectInfo = await mcp.get_component_info("select");
```

### Implementation Guidance
```typescript
// Get examples for complex patterns
const tableExamples = await mcp.get_component_examples("table");
const filterExamples = await mcp.get_component_examples("popover");

// Get accessibility patterns
const tableA11y = await mcp.get_accessibility_patterns("table");
```

### Theming Integration
```typescript
// Get theming guidance
const themingGuide = await mcp.get_theming_guide();

// Apply to our CSS variables system
const customTheme = {
  ...themingGuide.cssVariables,
  // Map to our token system
  "--primary": "var(--color-primary-600)",
  "--secondary": "var(--color-secondary-600)"
};
```

## Best Practices

### Query Before Implementation
1. **Always check MCP first** for component recommendations
2. **Review examples** before writing custom solutions
3. **Validate accessibility** patterns with MCP guidance
4. **Check theme compatibility** with our CSS variable system

### Documentation Integration
- Link MCP responses in implementation comments
- Document any deviations from shadcn patterns
- Include accessibility testing results
- Note performance considerations

### Code Quality
```typescript
// ✅ Good: Query MCP for proper pattern
const TableComponent = () => {
  // Pattern from shadcn MCP: table with sorting
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sortable" onClick={handleSort}>
            Title
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Accessible row implementation */}
      </TableBody>
    </Table>
  );
};

// ❌ Bad: Custom table without checking shadcn patterns
const CustomTable = () => {
  return <div className="table-like-div">...</div>;
};
```

## Integration with Our Design System

### CSS Variable Mapping
```css
/* Use shadcn variables that map to our tokens */
.shadcn-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}

/* Our tokens remain the source of truth */
:root {
  --background: var(--color-background-primary);
  --foreground: var(--color-text-primary);
  --border: var(--color-border-secondary);
}
```

### Component Wrapping
```typescript
// Wrap shadcn components to enforce our patterns
export const ComicTable = ({ children, ...props }) => {
  return (
    <div className="motion-safe:animate-in">
      <Table {...props}>
        {children}
      </Table>
    </div>
  );
};
```

## Success Metrics

### Development Efficiency
- Reduce component implementation time by 50%
- Increase accessibility compliance to 100%
- Decrease custom CSS by 30%

### Code Quality
- All components use shadcn primitives where possible
- Zero accessibility violations in component testing
- Consistent theming across all components
- TypeScript strict compliance
