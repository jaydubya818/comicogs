# Storybook + Visual Regression Testing

This document explains the Storybook setup for Comicogs, including automated story generation from golden queries and visual regression testing across light and dark themes.

## Overview

Our Storybook implementation includes:

- **Automated Story Generation**: Stories auto-generated from backend golden queries
- **Theme Support**: Light/dark theme testing with visual snapshots
- **Visual Regression**: Playwright-based screenshot testing
- **CI Integration**: Automated testing in GitHub Actions
- **Mock API**: MSW-based API mocking for isolated component testing

## Getting Started

### 1. Start Storybook

```bash
# Start Storybook development server
npm run storybook

# Storybook will be available at http://localhost:6006
```

### 2. Generate Stories from Golden Queries

```bash
# Generate stories from backend golden queries
npm run storybook:generate

# This creates stories in src/stories/generated/
```

### 3. Build Storybook for Production

```bash
# Build static Storybook
npm run build-storybook

# Output will be in storybook-static/
```

## Architecture

### Story Generation

Stories are automatically generated from the backend's golden queries:

1. **Golden Queries**: API test queries defined in `backend/golden-queries.json`
2. **Component Mapping**: Maps API endpoints to React components
3. **Mock Data**: Provides realistic data for component rendering
4. **Multiple States**: Generates stories for loading, error, and empty states

### Theme Support

Components are tested in both light and dark themes:

- **Theme Decorator**: Applies theme classes and data attributes
- **Theme Switching**: Toggle between themes in Storybook UI
- **Visual Testing**: Automated screenshots for both themes

### Mock API

API responses are mocked using custom handlers:

- **Realistic Data**: Based on actual API schema
- **Query Parameters**: Supports filtering and search
- **Error States**: Simulates network errors and edge cases

## Visual Regression Testing

### Playwright Configuration

Tests are organized by project:

- `storybook-light`: Light theme visual tests
- `storybook-dark`: Dark theme visual tests
- `app-light`: App E2E tests (light theme)
- `app-dark`: App E2E tests (dark theme)

### Running Visual Tests

```bash
# Run all Storybook visual tests
npx playwright test --project=storybook-light --project=storybook-dark

# Run specific test file
npx playwright test tests/storybook/visual-regression.spec.ts

# Update screenshots (when changes are intentional)
npx playwright test --project=storybook-light --update-snapshots
```

### Test Coverage

Visual tests cover:

- **Component Rendering**: All major UI components
- **Theme Switching**: Light/dark mode variations
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Interactive States**: Hover, focus, active states
- **Content Variations**: Long text, empty states, error states
- **Accessibility**: Focus indicators and keyboard navigation

## File Structure

```
frontend/
├── .storybook/
│   ├── main.ts              # Storybook configuration
│   └── preview.ts           # Global decorators and parameters
├── src/
│   ├── stories/
│   │   ├── generated/       # Auto-generated stories
│   │   ├── mocks/
│   │   │   └── handlers.ts  # Mock API handlers
│   │   └── generateFromGolden.ts # Story generator script
│   └── components/
│       └── ui/patterns/     # Documented components
└── tests/
    └── storybook/
        └── visual-regression.spec.ts # Visual tests
```

## Configuration

### Storybook Config (`.storybook/main.ts`)

```typescript
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-onboarding', 
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  // ... other config
};
```

### Theme Decorator (`.storybook/preview.ts`)

```typescript
decorators: [
  (Story, context) => {
    const theme = context.globals.theme || 'light';
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = theme === 'dark' ? 'dark' : '';
    }
    
    return (
      <div className={theme === 'dark' ? 'dark' : ''} data-theme={theme}>
        <div className="min-h-screen bg-background text-foreground">
          <Story />
        </div>
      </div>
    );
  },
],
```

## Writing Stories

### Manual Stories

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
};

export const PrimaryDark: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
  parameters: {
    theme: 'dark',
  },
};
```

### Auto-Generated Stories

Stories are automatically generated from golden queries:

```typescript
// Generated from golden query: comics_list_all
export const ComicsListAll: Story = {
  name: 'List all comics',
  parameters: {
    docs: {
      description: {
        story: `
          **Golden Query ID:** comics_list_all
          **Endpoint:** GET /api/comics
          **Expected Status:** 200
          
          Get paginated list of comics
        `,
      },
    },
  },
  args: {
    comics: mockApiResponses['/api/comics']?.data || [],
    pagination: mockApiResponses['/api/comics']?.pagination || {}
  },
};
```

## CI/CD Integration

### GitHub Actions Workflow

The `quality-gates.yml` workflow includes:

1. **Frontend Build**: Ensures components compile
2. **Story Generation**: Auto-generates stories from golden queries
3. **Storybook Build**: Creates static Storybook
4. **Visual Testing**: Runs Playwright tests for both themes
5. **Artifact Upload**: Saves test results and screenshots

### Workflow Jobs

```yaml
storybook-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Generate stories from golden queries
      run: npm run storybook:generate
      
    - name: Build Storybook
      run: npm run build-storybook
      
    - name: Run Storybook visual tests
      run: npx playwright test --project=storybook-light --project=storybook-dark
```

## Best Practices

### Story Writing

1. **Use Real Data**: Base stories on actual API responses
2. **Cover Edge Cases**: Include empty, loading, and error states
3. **Document Behavior**: Use story descriptions to explain component purpose
4. **Test Interactions**: Include hover, focus, and click states

### Visual Testing

1. **Consistent Screenshots**: Disable animations and wait for content
2. **Meaningful Names**: Use descriptive file names for screenshots
3. **Update Carefully**: Review screenshot changes before committing
4. **Test Responsively**: Include mobile, tablet, and desktop viewports

### Performance

1. **Selective Testing**: Don't test every story combination
2. **Parallel Execution**: Use Playwright's parallel testing
3. **Efficient Builds**: Cache dependencies in CI
4. **Smart Updates**: Only update screenshots when intentional

## Troubleshooting

### Common Issues

1. **Storybook Won't Start**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Clear cache: `rm -rf node_modules/.cache`

2. **Stories Not Loading**
   - Check file naming: `*.stories.tsx`
   - Verify story exports
   - Check console for errors

3. **Visual Tests Failing**
   - Review screenshot diffs in test results
   - Check if changes are intentional
   - Update snapshots if needed: `--update-snapshots`

4. **Theme Not Switching**
   - Verify CSS classes are applied
   - Check if components use theme variables
   - Ensure theme decorator is properly configured

### Debug Commands

```bash
# Check Storybook build
npm run build-storybook

# Run single visual test
npx playwright test tests/storybook/visual-regression.spec.ts -g "navbar"

# Debug test in headed mode
npx playwright test --headed --project=storybook-light

# Generate test report
npx playwright show-report
```

## Monitoring

### Metrics to Track

- **Story Count**: Number of documented components
- **Test Coverage**: Percentage of components with visual tests
- **Failure Rate**: Visual regression test failures
- **Build Time**: Storybook build duration

### Quality Gates

- All stories must build successfully
- Visual tests must pass for both themes
- New components require corresponding stories
- Screenshot changes require review

## Future Enhancements

### Planned Features

- [ ] **Accessibility Testing**: Automated a11y checks
- [ ] **Performance Testing**: Component render performance
- [ ] **Interaction Testing**: User flow automation
- [ ] **Cross-Browser Testing**: Edge, Safari support
- [ ] **Mobile Testing**: Device-specific testing
- [ ] **API Integration**: Real API endpoint testing

### Tools to Consider

- **Chromatic**: Hosted visual regression testing
- **Storybook Test Runner**: Automated testing
- **Accessibility Addon**: a11y compliance checking
- **Figma Integration**: Design system sync
- **Component Analytics**: Usage tracking

## Contributing

When adding new components:

1. **Create Stories**: Document all component variants
2. **Add Visual Tests**: Include theme and responsive tests
3. **Update Mocks**: Add necessary mock data
4. **Document Behavior**: Explain component purpose and usage
5. **Test Thoroughly**: Verify both themes work correctly

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Playwright Visual Testing](https://playwright.dev/docs/test-screenshots)
- [Chromatic Visual Testing](https://www.chromatic.com/docs/)
- [MSW API Mocking](https://mswjs.io/docs/)
- [Component Driven Development](https://www.componentdriven.org/)
