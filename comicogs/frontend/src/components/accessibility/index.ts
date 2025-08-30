// Accessibility components and utilities
export { AccessibilityPanel } from './AccessibilityPanel'
export { AccessibilityWrapper, withAccessibilityAudit } from './AccessibilityWrapper'
export { 
  SkipLink, 
  VisuallyHidden, 
  AccessibleHeading, 
  FocusTrap, 
  LiveRegion, 
  Landmark, 
  ProgressIndicator, 
  ExpandableContent 
} from './AccessibilityHelpers'

// Accessibility testing utilities
export { accessibilityChecker, AccessibilityChecker } from '@/lib/accessibility/AccessibilityChecker'
export { comicogAxeConfig, testingContexts, calculateAccessibilityScore } from '@/lib/accessibility/axe-config'
export type { AccessibilityTestResult } from '@/lib/accessibility/axe-config'