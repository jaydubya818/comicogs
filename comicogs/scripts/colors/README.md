# Color Palette Integration Guide

## Quick Setup: Coolors.co → Tailwind v4

### Step 1: Generate Palette
1. Visit [coolors.co](https://coolors.co/)
2. Generate or customize a color palette
3. Ensure accessibility (4.5:1 contrast for text)
4. Test with our comic book aesthetic

### Step 2: Export CSS Variables
1. Click "Export" in Coolors
2. Select "CSS Variables"
3. Copy the `:root` block

### Step 3: Integrate with Our Token System
1. Open `frontend/src/app/globals.css`
2. Find the `/* @coolors */` section
3. Paste the Coolors variables
4. Map to our shadcn semantic tokens (see examples below)

## Example Integration

### From Coolors Export
```css
/* Example Coolors export */
:root {
  --color-1: #2563eb; /* Blue */
  --color-2: #7c3aed; /* Purple */
  --color-3: #ea580c; /* Orange */
  --color-4: #374151; /* Gray */
  --color-5: #f8fafc; /* Light */
}
```

### Map to Our Token System
```css
/* In frontend/src/app/globals.css */

/* @coolors - Generated from coolors.co */
:root {
  /* Raw palette from Coolors */
  --coolors-primary: #2563eb;
  --coolors-secondary: #7c3aed;
  --coolors-accent: #ea580c;
  --coolors-neutral: #374151;
  --coolors-surface: #f8fafc;
  
  /* Map to shadcn semantic tokens */
  --primary: var(--coolors-primary);
  --secondary: var(--coolors-secondary);
  --accent: var(--coolors-accent);
  --muted: var(--coolors-neutral);
  --background: var(--coolors-surface);
  --foreground: var(--coolors-neutral);
  --border: color-mix(in srgb, var(--coolors-neutral) 20%, transparent);
  
  /* Component-specific tokens */
  --card-background: color-mix(in srgb, var(--background) 95%, var(--primary));
  --button-primary: var(--primary);
  --button-secondary: var(--secondary);
}

/* Dark mode variants */
.dark {
  --background: #0f172a;
  --foreground: #f1f5f9;
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --accent: #f97316;
  --muted: #64748b;
  --border: color-mix(in srgb, var(--muted) 30%, transparent);
  
  --card-background: color-mix(in srgb, var(--background) 95%, var(--primary));
}
```

## Color Theory Guidelines

### For Comic Book Aesthetics
- **Primary**: Bold blues or reds (trust, action)
- **Secondary**: Complementary purples or oranges (creativity, energy)
- **Accent**: High-contrast colors for CTAs (orange, yellow)
- **Neutral**: Grays that don't compete with comic covers
- **Surface**: Off-whites or deep darks for readability

### Accessibility Requirements
- **Text Contrast**: 4.5:1 minimum for normal text
- **Large Text**: 3:1 minimum for headings and UI elements
- **Focus Indicators**: Must be visible against all backgrounds
- **Color Alone**: Never rely on color alone to convey information

### Testing Your Palette
```bash
# Install contrast checker
npm install -g @adobe/leonardo-contrast-colors

# Test contrast ratios
leonardo contrast --foreground "#2563eb" --background "#f8fafc"
```

## Advanced Integration

### Color Variations with CSS color-mix()
```css
:root {
  /* Base colors from Coolors */
  --color-primary-base: #2563eb;
  
  /* Generate variations */
  --color-primary-50: color-mix(in srgb, var(--color-primary-base) 10%, white);
  --color-primary-100: color-mix(in srgb, var(--color-primary-base) 20%, white);
  --color-primary-200: color-mix(in srgb, var(--color-primary-base) 40%, white);
  --color-primary-300: color-mix(in srgb, var(--color-primary-base) 60%, white);
  --color-primary-400: color-mix(in srgb, var(--color-primary-base) 80%, white);
  --color-primary-500: var(--color-primary-base);
  --color-primary-600: color-mix(in srgb, var(--color-primary-base) 80%, black);
  --color-primary-700: color-mix(in srgb, var(--color-primary-base) 60%, black);
  --color-primary-800: color-mix(in srgb, var(--color-primary-base) 40%, black);
  --color-primary-900: color-mix(in srgb, var(--color-primary-base) 20%, black);
}
```

### Semantic Token Mapping
```css
/* Map variations to semantic purposes */
:root {
  /* Interactive states */
  --button-primary-default: var(--color-primary-600);
  --button-primary-hover: var(--color-primary-700);
  --button-primary-active: var(--color-primary-800);
  --button-primary-disabled: var(--color-primary-300);
  
  /* Background contexts */
  --surface-primary: var(--color-primary-50);
  --surface-primary-hover: var(--color-primary-100);
  
  /* Border variations */
  --border-primary: var(--color-primary-200);
  --border-primary-strong: var(--color-primary-400);
}
```

## Validation Checklist

### Before Committing New Colors
- [ ] Test in both light and dark modes
- [ ] Verify contrast ratios with WebAIM contrast checker
- [ ] Test with comic book cover images (ensure colors don't clash)
- [ ] Validate with colorblind simulator
- [ ] Check focus indicators are visible
- [ ] Test on mobile devices (different color gamuts)

### Documentation Requirements
- [ ] Document color meanings and usage contexts
- [ ] Include Coolors.co URL for future reference
- [ ] Note any accessibility considerations
- [ ] Record contrast ratio test results

## Common Patterns

### Comic-Focused Palettes
```css
/* Superhero-inspired */
:root {
  --primary: #dc2626;    /* Comic red */
  --secondary: #2563eb;  /* Classic blue */
  --accent: #fbbf24;     /* Golden yellow */
}

/* Vintage comic */
:root {
  --primary: #7c2d12;    /* Sepia brown */
  --secondary: #c2410c;  /* Burnt orange */
  --accent: #ca8a04;     /* Mustard */
}

/* Modern minimalist */
:root {
  --primary: #1f2937;    /* Charcoal */
  --secondary: #6b7280;  /* Gray */
  --accent: #f59e0b;     /* Bright orange */
}
```

### Marketplace Trust Colors
```css
/* Professional marketplace */
:root {
  --primary: #059669;    /* Success green */
  --secondary: #1e40af;  /* Trust blue */
  --accent: #d97706;     /* Warning orange */
  --danger: #dc2626;     /* Error red */
}
```

## Integration with Design Tools

### Export from Other Tools
- **Adobe Color**: Export as CSS variables
- **Figma**: Use Figma to CSS Variables plugin
- **Sketch**: Export color palette as CSS
- **Material Design**: Use Material Theme Builder

### Automated Color Generation
```bash
# Generate accessible color scales
npx @adobe/leonardo-contrast-colors generate \
  --colors "#2563eb,#7c3aed,#ea580c" \
  --ratios "1.5,3,4.5,7,12" \
  --output css-variables
```

## Troubleshooting

### Common Issues
1. **Low Contrast**: Use color-mix() to adjust lightness
2. **Dark Mode Conversion**: Use HSL manipulation or predefined dark variants
3. **Component Integration**: Ensure all components use semantic tokens, not raw colors
4. **Performance**: CSS custom properties are performant; use them freely

### Debug Tools
```css
/* Temporary debug helper */
.debug-colors * {
  outline: 1px solid red !important;
  background: hsla(var(--primary), 0.1) !important;
}
```
