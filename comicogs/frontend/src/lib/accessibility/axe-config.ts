import { RunOptions, Rule } from 'axe-core'

// Custom axe configuration for Comicogs
export const comicogAxeConfig: any = {
  rules: {
    // Core accessibility rules
    'color-contrast': { enabled: true },
    'keyboard': { enabled: true },
    'focus': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    
    // Form accessibility
    'label-title-only': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    
    // Navigation and structure
    'bypass': { enabled: true },
    'skip-link': { enabled: true },
    'tabindex': { enabled: true },
    'accesskeys': { enabled: true },
    
    // Media accessibility
    'audio-caption': { enabled: true },
    'video-caption': { enabled: true },
    'video-description': { enabled: true },
    
    // Custom rules for comic application
    'comic-image-alt': {
      enabled: true,
      selector: '[data-comic-image]',
      matches: (node: Element) => {
        return node.hasAttribute('data-comic-image')
      },
      evaluate: (node: Element) => {
        const img = node.querySelector('img')
        if (!img) return false
        
        const alt = img.getAttribute('alt')
        if (!alt) return false
        
        // Check if alt text is meaningful for comic images
        const meaninglessAlts = ['image', 'comic', 'cover', 'picture']
        const isDescriptive = alt.length > 10 && 
          !meaninglessAlts.some(word => alt.toLowerCase().includes(word))
        
        return isDescriptive
      }
    } as any,
    
    // Collection accessibility
    'collection-navigation': {
      enabled: true,
      selector: '[data-collection-grid]',
      matches: (node: Element) => {
        return node.hasAttribute('data-collection-grid')
      },
      evaluate: (node: Element) => {
        // Ensure collection grids are keyboard navigable
        const items = node.querySelectorAll('[role="gridcell"], [tabindex]')
        return items.length > 0
      }
    } as any
  },
  
  // Custom tags for comic-specific contexts
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice', 'comicogs'],
  
  // Disable problematic rules that may not apply to comic applications
  disableOtherRules: false,
  
  // Performance settings
  performanceTimer: true,
  timeout: 30000
}

// Accessibility testing contexts for different app sections
export const testingContexts = {
  // Core application areas
  homepage: {
    name: 'Homepage',
    description: 'Main landing page accessibility',
    config: {
      ...comicogAxeConfig,
      tags: ['wcag2aa', 'best-practice']
    }
  },
  
  collection: {
    name: 'Collection View',
    description: 'Comic collection grid and list views',
    config: {
      ...comicogAxeConfig,
      rules: {
        ...comicogAxeConfig.rules,
        'collection-navigation': { enabled: true },
        'comic-image-alt': { enabled: true }
      }
    }
  },
  
  search: {
    name: 'Search Interface',
    description: 'Search forms and results',
    config: {
      ...comicogAxeConfig,
      rules: {
        ...comicogAxeConfig.rules,
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true }
      }
    }
  },
  
  marketplace: {
    name: 'Marketplace',
    description: 'Comic marketplace and trading',
    config: {
      ...comicogAxeConfig,
      rules: {
        ...comicogAxeConfig.rules,
        'button-name': { enabled: true },
        'link-name': { enabled: true }
      }
    }
  },
  
  forms: {
    name: 'Forms',
    description: 'All form interactions',
    config: {
      ...comicogAxeConfig,
      rules: {
        ...comicogAxeConfig.rules,
        'label': { enabled: true },
        'label-title-only': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'aria-required-attr': { enabled: true }
      }
    }
  },
  
  navigation: {
    name: 'Navigation',
    description: 'Site navigation and menus',
    config: {
      ...comicogAxeConfig,
      rules: {
        ...comicogAxeConfig.rules,
        'bypass': { enabled: true },
        'skip-link': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true }
      }
    }
  }
}

// Severity levels for different types of issues
export const severityLevels = {
  critical: {
    level: 'critical',
    description: 'Blocks access for users with disabilities',
    examples: ['Missing alt text', 'No keyboard access', 'Poor color contrast'],
    priority: 1
  },
  
  serious: {
    level: 'serious',
    description: 'Significantly impacts accessibility',
    examples: ['Missing form labels', 'Improper heading structure'],
    priority: 2
  },
  
  moderate: {
    level: 'moderate', 
    description: 'Creates barriers but has workarounds',
    examples: ['Missing landmarks', 'Non-descriptive link text'],
    priority: 3
  },
  
  minor: {
    level: 'minor',
    description: 'Best practice improvements',
    examples: ['Missing skip links', 'Non-semantic markup'],
    priority: 4
  }
}

// Test result processing
export interface AccessibilityTestResult {
  context: string
  url: string
  timestamp: string
  violations: {
    critical: number
    serious: number 
    moderate: number
    minor: number
    total: number
  }
  passes: number
  incomplete: number
  details: any[]
  score: number // 0-100 accessibility score
}

export function calculateAccessibilityScore(result: any): number {
  const { violations, passes, incomplete } = result
  
  // Weight violations by severity
  const criticalWeight = 10
  const seriousWeight = 5
  const moderateWeight = 2
  const minorWeight = 1
  
  const totalViolations = 
    (violations.critical || 0) * criticalWeight +
    (violations.serious || 0) * seriousWeight +
    (violations.moderate || 0) * moderateWeight +
    (violations.minor || 0) * minorWeight
  
  const totalTests = totalViolations + (passes || 0) + (incomplete || 0)
  
  if (totalTests === 0) return 100
  
  const score = Math.max(0, 100 - ((totalViolations / totalTests) * 100))
  return Math.round(score)
}