# SuperDesign Commands & Workflow

## VS Code/Cursor Integration

### SuperDesign Extension Commands

#### Canvas Operations
```bash
# Open SuperDesign canvas
⌘⇧P → "SuperDesign: Open Canvas"

# Initialize context file (creates ~/claude.md)
⌘⇧P → "SuperDesign: Initialize"

# Export current design as component
⌘⇧P → "SuperDesign: Export Component"

# Save design snapshot
⌘⇧P → "SuperDesign: Save Snapshot"
```

#### Context Setup
```bash
# Create initial design context
⌘⇧P → "SuperDesign: Initialize"
# This creates ~/claude.md with:
# - Project goals from design/SUPERDESIGN.md
# - Current color tokens from frontend/src/app/globals.css
# - Component requirements from design/patterns/
```

## Iteration Workflow

### Phase A: ASCII Layout (5 variants)
**Goal**: Structure and spacing without visual design

**Process**:
1. Open SuperDesign canvas
2. Create 5 layout variations using ASCII art
3. Focus on:
   - Information hierarchy
   - Content flow
   - Responsive breakpoints
   - Interactive element placement

**Example Output**:
```
Variant 1: Header-heavy
┌─────────────────────────────────────┐
│ [LOGO]  [SEARCH________] [USER] │
├─────────────────────────────────────┤
│ Featured Comic Hero Section         │
│ [BIG IMAGE] [TITLE] [CTA BUTTON]   │
├─────────────────────────────────────┤
│ Comics Grid                         │
│ [IMG][IMG][IMG]                     │
└─────────────────────────────────────┘

Variant 2: Sidebar-focused
┌───┬─────────────────────────────────┐
│ F │ [LOGO] [SEARCH____] [USER]     │
│ I │ ─────────────────────────────── │
│ L │ Comics Table                    │
│ T │ Title | Grade | Price | Seller  │
│ E │ ─────────────────────────────── │
│ R │ [Comic 1 data row]              │
│ S │ [Comic 2 data row]              │
└───┴─────────────────────────────────┘
```

### Phase B: Theme Passes (5 variants)
**Goal**: Apply color tokens and visual hierarchy

**Process**:
1. Take Phase A winners
2. Apply 5 different theme approaches using our CSS variables
3. Test in light and dark modes
4. Focus on:
   - Color harmony
   - Contrast ratios
   - Brand personality
   - Accessibility

**CSS Token Usage**:
```css
/* Use our tokens only */
background: var(--background);
color: var(--foreground);
border: 1px solid var(--border);

/* Theme variants */
.theme-professional { --accent: var(--color-blue-600); }
.theme-vibrant { --accent: var(--color-orange-500); }
.theme-minimal { --accent: var(--color-gray-900); }
```

### Phase C: Animation Layer (motion-safe)
**Goal**: Add micro-interactions and transitions

**Process**:
1. Select Phase B winner
2. Add 5 animation approaches
3. All animations ≤ 200ms
4. Wrap in motion-safe guards
5. Focus on:
   - User feedback
   - State transitions
   - Progressive enhancement
   - Performance

**Animation Examples**:
```css
@media (prefers-reduced-motion: no-preference) {
  .comic-card {
    transition: transform 150ms var(--motion-ease-out);
  }
  
  .comic-card:hover {
    transform: translateY(-2px);
  }
  
  .filter-drawer[data-state="open"] {
    animation: slide-in 200ms var(--motion-ease-out);
  }
}
```

### Phase D: Componentization
**Goal**: Convert to shadcn/React components

**Process**:
1. Export semantic HTML from Phase C
2. Identify shadcn component opportunities
3. Create reusable React components
4. Add TypeScript interfaces
5. Focus on:
   - Prop flexibility
   - Accessibility features
   - Performance optimization
   - Developer experience

## Design Handoff Process

### From Canvas to Code
1. **Export HTML**: SuperDesign → semantic HTML
2. **Audit Accessibility**: Run Axe DevTools
3. **Extract Patterns**: Identify reusable components
4. **Map to shadcn**: Use existing primitives where possible
5. **Create Components**: Build custom components for unique needs
6. **Test Integration**: Verify in Next.js pages

### Quality Gates
- [ ] All colors use CSS variables
- [ ] Motion respects user preferences
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Performance budget met (< 200ms animations)
- [ ] Mobile responsive
- [ ] Dark mode compatible

## File Organization

### Design Assets
```
design/
├── SUPERDESIGN.md          # This file
├── COMMANDS.md             # Workflow documentation
├── implementation.md       # Current iteration plan
├── patterns/               # HTML prototypes
│   ├── navbar.html
│   ├── hero.html
│   ├── listing-card.html
│   ├── filters.html
│   └── wantlist-card.html
└── tweakcn/
    └── THEME.md           # TweakCN integration
```

### Code Integration
```
frontend/src/
├── app/globals.css        # CSS variables and tokens
├── styles/
│   ├── theme-tweakcn.css  # Alternative theme
│   └── animatopy.css      # Animation library
└── components/
    ├── theme/             # Theme switching
    └── motion/            # Animation utilities
```

## Success Metrics

### Design Quality
- Lighthouse Performance Score > 90
- Lighthouse Accessibility Score > 95
- Zero serious Axe violations
- < 100ms Time to Interactive improvement

### Developer Experience
- 5-minute setup for new designers
- Clear component documentation
- Consistent design token usage
- Efficient iteration cycle (design → code < 1 hour)
