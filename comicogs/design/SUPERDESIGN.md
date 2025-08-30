# SuperDesign Integration for Comicogs

## Design Goals

### Primary Objectives
- **Performance First**: All animations ≤ 200ms, motion-safe guards everywhere
- **Accessibility**: Zero serious Axe violations, proper contrast ratios, keyboard navigation
- **Token-Based Design**: No hard-coded hex values, everything uses CSS custom properties
- **Dark Mode Ready**: Seamless light/dark theme switching
- **Mobile-First**: Responsive design that works on all devices

### Visual Identity
- **Comic-Focused**: Design should feel like browsing a premium comic collection
- **Data-Dense**: Tables and filters need to be scannable and efficient
- **Trust Signals**: Marketplace elements should feel secure and professional
- **Discovery-Oriented**: Search and filtering should be prominent and intuitive

## Component Inventory

### Navigation & Layout
- **Navbar**: Logo, search bar, user menu, cart icon
- **Sidebar**: Desktop filter panel, mobile drawer
- **Footer**: Links, legal, social

### Core Pages
- **Hero Section**: Landing page with search CTA and featured comics
- **Comics Table**: Sortable, filterable data table with cover thumbnails
- **Filter Drawer**: Advanced search with price ranges, grades, series
- **Listing Cards**: Marketplace items with seller info and quick actions
- **Wantlist Cards**: Wishlist items with alerts and price tracking

### Interactive Elements
- **Search Bar**: Autocomplete, recent searches, advanced filters toggle
- **Modal Dialogs**: Quick view, confirmations, forms
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeletons, spinners, progressive enhancement

## Motion Rules & Guidelines

### Animation Principles
```css
/* All animations must respect motion preferences */
@media (prefers-reduced-motion: no-preference) {
  /* Animations here */
}

/* Duration limits */
--motion-duration-fast: 150ms;
--motion-duration-normal: 200ms;
--motion-duration-slow: 300ms; /* Use sparingly */

/* Easing presets */
--motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Allowed Animation Types
- **Micro-interactions**: Button hover states, form focus
- **State Transitions**: Loading → loaded, open → closed
- **Content Reveals**: Fade-in on scroll, stagger lists
- **Feedback**: Success pulses, error shakes (subtle)

### Prohibited Animations
- **Continuous motion**: Infinite spinners (except loading)
- **Bouncing**: Excessive elastic effects
- **Parallax scrolling**: Motion sickness trigger
- **Auto-playing**: Video, carousels without user control

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Contrast Ratios**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements focusable
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators, logical tab order

### Testing Checklist
- [ ] Axe DevTools: Zero serious violations
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing with NVDA/VoiceOver
- [ ] Color contrast verification
- [ ] Motion preference respect

## Design System Architecture

### CSS Variable Hierarchy
```css
/* Base tokens */
:root {
  /* Color system */
  --color-primary-*: /* Blue scale */
  --color-secondary-*: /* Purple scale */
  --color-accent-*: /* Orange scale */
  
  /* Semantic tokens */
  --background: /* Adapts to theme */
  --foreground: /* Adapts to theme */
  --muted: /* Secondary content */
  --border: /* Dividers */
  
  /* Component tokens */
  --card-background: /* Inherits from --background */
  --button-primary: /* Inherits from --color-primary */
}
```

### Component Naming Convention
- **Base**: `.comic-card`, `.filter-drawer`
- **Variants**: `.comic-card--featured`, `.filter-drawer--mobile`
- **States**: `.comic-card[data-state="loading"]`
- **Responsive**: `.comic-card--responsive`

## SuperDesign Canvas Integration

### Workflow Phases
1. **ASCII Layout (Phase A)**: Structure and spacing in text
2. **Theme Passes (Phase B)**: Apply our color tokens
3. **Animation Layer (Phase C)**: Add micro-interactions
4. **Component Export (Phase D)**: Convert to shadcn components

### Canvas Commands
- `⌘⇧P → "SuperDesign: Open Canvas"` - Open design workspace
- `⌘⇧P → "SuperDesign: Initialize"` - Create `~/claude.md` context file
- `⌘⇧P → "SuperDesign: Export Component"` - Generate React/HTML code

### Iteration Guidelines
- Start with mobile-first layouts
- Test dark mode at each phase
- Validate motion-safety before finalizing
- Export semantic HTML before React conversion
