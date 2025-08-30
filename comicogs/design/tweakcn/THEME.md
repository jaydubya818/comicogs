# TweakCN Theme Integration

## Overview

TweakCN (https://tweakcn.com/) is a shadcn/ui theme generator that creates beautiful, accessible color schemes. We integrate these themes as runtime-toggleable variants while preserving our core design system.

## Current Theme: Professional Comic Marketplace

### Theme Configuration
```json
{
  "name": "Professional Comic Marketplace",
  "description": "A professional theme optimized for comic book marketplaces with high contrast and trust-building colors",
  "primary": "#2563eb",
  "secondary": "#7c3aed", 
  "accent": "#ea580c",
  "background": "#f8fafc",
  "foreground": "#475569",
  "success": "#059669",
  "warning": "#d97706",
  "destructive": "#dc2626",
  "muted": "#f1f5f9",
  "border": "#e2e8f0"
}
```

### Source
- **TweakCN URL**: https://tweakcn.com/theme/professional-comic-marketplace
- **Generated**: 2024-01-20
- **Accessibility**: WCAG 2.1 AA compliant
- **Contrast Ratios**: All text combinations meet 4.5:1 minimum

## Alternative Themes

### 1. Vintage Comic
**Use Case**: Nostalgic, classic comic book feel
```json
{
  "name": "Vintage Comic",
  "primary": "#7c2d12",
  "secondary": "#c2410c", 
  "accent": "#ca8a04",
  "background": "#fefce8",
  "foreground": "#451a03"
}
```

### 2. Dark Hero
**Use Case**: Dark mode optimized, superhero aesthetic
```json
{
  "name": "Dark Hero",
  "primary": "#3b82f6",
  "secondary": "#8b5cf6",
  "accent": "#f59e0b", 
  "background": "#0f172a",
  "foreground": "#f1f5f9"
}
```

### 3. Minimal Collector
**Use Case**: Clean, minimalist design for serious collectors
```json
{
  "name": "Minimal Collector",
  "primary": "#1f2937",
  "secondary": "#6b7280",
  "accent": "#f59e0b",
  "background": "#ffffff",
  "foreground": "#374151"
}
```

## CSS Variable Mapping

### Our Token System → TweakCN
```css
/* TweakCN theme overrides map to our semantic tokens */
.theme-tweakcn :root {
  /* Primary color system */
  --coolors-hero-blue: #2563eb;      /* From TweakCN primary */
  --coolors-comic-purple: #7c3aed;   /* From TweakCN secondary */
  --coolors-energy-orange: #ea580c;  /* From TweakCN accent */
  
  /* Surface and text colors */
  --coolors-surface-gray: #f8fafc;   /* From TweakCN background */
  --coolors-neutral-slate: #475569;  /* From TweakCN foreground */
  
  /* Status colors remain consistent */
  --coolors-success-green: #059669;  /* From TweakCN success */
  --coolors-warning-amber: #d97706;  /* From TweakCN warning */
  --coolors-danger-red: #dc2626;     /* From TweakCN destructive */
}

/* Dark mode variant */
.dark.theme-tweakcn :root {
  --coolors-surface-gray: #0f172a;
  --coolors-neutral-slate: #f1f5f9;
  --coolors-hero-blue: #3b82f6;
  --coolors-comic-purple: #8b5cf6;
  --coolors-energy-orange: #f59e0b;
}
```

## Theme Toggle Implementation

### Runtime Theme Switching
```typescript
// Context: user clicks theme toggle
// Effect: addClass 'theme-tweakcn' to <body>
// Result: CSS variables update, entire app re-themes

const applyTweakCNTheme = () => {
  document.body.classList.add('theme-tweakcn');
};

const removeTweakCNTheme = () => {
  document.body.classList.remove('theme-tweakcn');
};
```

### Persistence Strategy
```typescript
// Store in localStorage and sync with system
const themeKey = 'comicogs-theme-preference';

const saveThemePreference = (theme: 'default' | 'tweakcn') => {
  localStorage.setItem(themeKey, theme);
};

const loadThemePreference = (): 'default' | 'tweakcn' => {
  return localStorage.getItem(themeKey) as 'default' | 'tweakcn' || 'default';
};
```

## Integration Guidelines

### DO's
- ✅ Override only our `--coolors-*` variables
- ✅ Maintain semantic token structure
- ✅ Test contrast ratios in both light/dark modes
- ✅ Preserve motion and accessibility preferences
- ✅ Document theme source and accessibility compliance

### DON'Ts
- ❌ Hardcode hex values in components
- ❌ Break existing component APIs
- ❌ Skip accessibility testing
- ❌ Ignore dark mode compatibility
- ❌ Override layout or typography tokens

## Testing Checklist

### Visual Testing
- [ ] All components render correctly with theme
- [ ] Dark mode variant works properly
- [ ] Comic covers don't clash with theme colors
- [ ] Loading states and empty states look good
- [ ] Interactive states (hover, focus, active) work

### Accessibility Testing
- [ ] Color contrast ratios meet WCAG 2.1 AA (4.5:1 minimum)
- [ ] Focus indicators remain visible
- [ ] High contrast mode compatibility
- [ ] Color-blind user testing (protanopia, deuteranopia, tritanopia)
- [ ] No information conveyed by color alone

### Performance Testing
- [ ] Theme switching is immediate (< 100ms)
- [ ] No layout shift during theme changes
- [ ] CSS custom property fallbacks work
- [ ] Bundle size impact is minimal

## Theme Customization Workflow

### 1. Generate on TweakCN
1. Visit https://tweakcn.com/
2. Select base theme or start from scratch
3. Adjust colors for comic marketplace context
4. Test accessibility with their built-in checker
5. Export as CSS variables

### 2. Map to Our System
1. Copy exported CSS to `frontend/src/styles/theme-tweakcn.css`
2. Map TweakCN variables to our `--coolors-*` tokens
3. Test in both light and dark modes
4. Verify against comic book covers and content

### 3. Test Integration
1. Apply theme via toggle component
2. Navigate through all major pages
3. Test with real comic data
4. Verify accessibility with screen readers
5. Performance test on mobile devices

### 4. Document and Deploy
1. Update this file with theme details
2. Add theme to storybook examples
3. Include accessibility test results
4. Create migration guide if needed

## Advanced Customization

### Color Harmony with Comic Covers
```css
/* Ensure theme colors don't clash with comic artwork */
.theme-tweakcn .comic-cover-overlay {
  background: color-mix(in srgb, var(--color-background) 95%, transparent);
  backdrop-filter: blur(8px);
}

.theme-tweakcn .comic-card {
  border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}
```

### Brand Consistency
```css
/* Maintain brand recognition across themes */
.theme-tweakcn .logo {
  filter: none; /* Don't theme the logo */
}

.theme-tweakcn .brand-color {
  color: var(--coolors-hero-blue) !important; /* Force brand color */
}
```

### Component-Specific Overrides
```css
/* Fine-tune specific components for optimal theme experience */
.theme-tweakcn .data-table {
  --color-muted: color-mix(in srgb, var(--color-background) 97%, var(--color-foreground));
}

.theme-tweakcn .price-highlight {
  background: color-mix(in srgb, var(--coolors-success-green) 20%, transparent);
  color: var(--coolors-success-green);
}
```

## Future Theme Additions

### Planned Themes
1. **Retro Neon**: 80s/90s comic aesthetic
2. **Serious Collector**: Ultra-minimal, data-focused
3. **Comic Convention**: Vibrant, energetic colors
4. **Vintage Gold**: Classic comic book golden age
5. **Modern Superhero**: Contemporary comic movie aesthetic

### Theme Voting System
- User preference analytics
- A/B testing framework
- Community feedback integration
- Seasonal theme rotations

## Troubleshooting

### Common Issues
1. **Theme doesn't apply**: Check CSS cascade and specificity
2. **Dark mode breaks**: Verify dark mode overrides exist
3. **Contrast fails**: Use color-mix() to adjust lightness
4. **Performance lag**: Minimize DOM queries during theme switch

### Debug Tools
```css
/* Temporary theme debug helper */
.debug-theme * {
  outline: 1px solid var(--color-accent) !important;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent) !important;
}
```

### Browser Support
- **Modern browsers**: Full CSS custom property support
- **Legacy fallback**: Default theme for IE11 and older
- **Progressive enhancement**: Theme toggle hidden if not supported
