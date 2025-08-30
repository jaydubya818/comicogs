#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Configuration
const FRONTEND_DIR = path.join(__dirname, '../frontend/src')
const COMPONENTS_DIR = path.join(FRONTEND_DIR, 'components')
const PAGES_DIR = path.join(FRONTEND_DIR, 'app')

// Design token validation rules
const DESIGN_RULES = {
  // Colors should use CSS custom properties
  colors: {
    pattern: /(?:bg-|text-|border-|ring-)(?!(?:inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-)/,
    message: 'Use semantic color tokens (bg-primary, text-foreground) instead of hardcoded colors'
  },
  
  // Spacing should use consistent scale
  spacing: {
    pattern: /(?:p-|m-|gap-|space-[xy]-)(?:0\.5|1\.5|2\.5|3\.5|4\.5|5\.5|6\.5|7\.5|8\.5|9\.5|10\.5|11\.5|12\.5|13\.5|14\.5|15\.5|[2-9]\d+)/,
    message: 'Use consistent spacing scale (p-1, p-2, p-3, p-4, p-6, p-8, etc.)'
  },
  
  // Font sizes should use design system scale
  fontSize: {
    pattern: /text-(?!(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl))/,
    message: 'Use typography scale (text-sm, text-base, text-lg, etc.)'
  },
  
  // Components should use cn utility
  className: {
    pattern: /className=\{[^}]*(?:clsx|classNames|classnames)\(/,
    message: 'Use cn() utility for conditional classes instead of clsx/classNames'
  }
}

// Component patterns to check
const COMPONENT_PATTERNS = {
  // All components should have displayName
  displayName: {
    pattern: /\.displayName\s*=/,
    required: true,
    message: 'Component should have displayName for debugging'
  },
  
  // Use forwardRef for components that accept ref
  forwardRef: {
    pattern: /React\.forwardRef|forwardRef/,
    context: /ref\s*[:?]/,
    message: 'Components accepting ref prop should use forwardRef'
  },
  
  // Proper TypeScript interfaces
  interface: {
    pattern: /interface\s+\w+Props/,
    context: /function\s+\w+\s*\(/,
    message: 'Components should have proper TypeScript interface'
  }
}

// Accessibility patterns
const A11Y_RULES = {
  // Interactive elements should have proper ARIA
  button: {
    pattern: /<button[^>]*>/g,
    checks: [
      { attr: 'aria-label', message: 'Button should have aria-label or accessible text' },
      { attr: 'disabled', message: 'Use proper disabled state' }
    ]
  },
  
  // Images should have alt text
  image: {
    pattern: /<img[^>]*>/g,
    checks: [
      { attr: 'alt', required: true, message: 'Images must have alt text' }
    ]
  },
  
  // Form elements should have labels
  input: {
    pattern: /<input[^>]*>/g,
    checks: [
      { attr: 'aria-label|aria-labelledby|id', message: 'Input should have associated label' }
    ]
  }
}

class UIAuditor {
  constructor() {
    this.issues = []
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      warnings: 0,
      errors: 0
    }
  }

  // Scan all component files
  async scanFiles() {
    const patterns = [
      `${COMPONENTS_DIR}/**/*.{tsx,jsx,ts,js}`,
      `${PAGES_DIR}/**/*.{tsx,jsx,ts,js}`
    ]

    const files = []
    for (const pattern of patterns) {
      const matches = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'] })
      files.push(...matches)
    }

    console.log(`🔍 Scanning ${files.length} files for UI consistency issues...\n`)

    for (const file of files) {
      await this.scanFile(file)
      this.stats.filesScanned++
    }
  }

  // Scan individual file
  async scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(process.cwd(), filePath)

    // Check design token usage
    this.checkDesignTokens(content, relativePath)
    
    // Check component patterns
    this.checkComponentPatterns(content, relativePath)
    
    // Check accessibility
    this.checkAccessibility(content, relativePath)
    
    // Check file structure
    this.checkFileStructure(filePath, content)
  }

  // Check design token adherence
  checkDesignTokens(content, filePath) {
    for (const [rule, config] of Object.entries(DESIGN_RULES)) {
      const matches = content.match(config.pattern)
      if (matches) {
        matches.forEach(match => {
          this.addIssue({
            type: 'design-token',
            severity: 'warning',
            file: filePath,
            rule,
            message: config.message,
            code: match.trim()
          })
        })
      }
    }
  }

  // Check component patterns
  checkComponentPatterns(content, filePath) {
    // Skip non-component files
    if (!filePath.includes('/components/') && !content.includes('export') && !content.includes('function')) {
      return
    }

    for (const [rule, config] of Object.entries(COMPONENT_PATTERNS)) {
      if (config.required) {
        const hasPattern = config.pattern.test(content)
        const hasContext = !config.context || config.context.test(content)
        
        if (hasContext && !hasPattern) {
          this.addIssue({
            type: 'component-pattern',
            severity: 'error',
            file: filePath,
            rule,
            message: config.message
          })
        }
      }
    }
  }

  // Check accessibility patterns
  checkAccessibility(content, filePath) {
    for (const [element, config] of Object.entries(A11Y_RULES)) {
      const matches = content.matchAll(config.pattern)
      
      for (const match of matches) {
        const elementString = match[0]
        
        for (const check of config.checks) {
          const hasAttribute = new RegExp(check.attr).test(elementString)
          
          if (check.required && !hasAttribute) {
            this.addIssue({
              type: 'accessibility',
              severity: 'error',
              file: filePath,
              rule: element,
              message: check.message,
              code: elementString
            })
          }
        }
      }
    }
  }

  // Check file structure and naming
  checkFileStructure(filePath, content) {
    const fileName = path.basename(filePath, path.extname(filePath))
    const relativePath = path.relative(process.cwd(), filePath)

    // Component files should be PascalCase
    if (filePath.includes('/components/') && !/^[A-Z]/.test(fileName)) {
      this.addIssue({
        type: 'file-structure',
        severity: 'warning',
        file: relativePath,
        rule: 'naming',
        message: 'Component files should use PascalCase naming'
      })
    }

    // Check for proper exports
    if (filePath.includes('/components/')) {
      const hasDefaultExport = /export\s+default/.test(content)
      const hasNamedExports = /export\s+(?:function|const|class)/.test(content)
      
      if (!hasDefaultExport && !hasNamedExports) {
        this.addIssue({
          type: 'file-structure',
          severity: 'error',
          file: relativePath,
          rule: 'exports',
          message: 'Component files should have proper exports'
        })
      }
    }
  }

  // Add issue to collection
  addIssue(issue) {
    this.issues.push(issue)
    this.stats.issuesFound++
    
    if (issue.severity === 'error') {
      this.stats.errors++
    } else {
      this.stats.warnings++
    }
  }

  // Generate audit report
  generateReport() {
    console.log('📊 UI Audit Report')
    console.log('==================\n')

    // Summary stats
    console.log(`Files Scanned: ${this.stats.filesScanned}`)
    console.log(`Issues Found: ${this.stats.issuesFound}`)
    console.log(`Errors: ${this.stats.errors}`)
    console.log(`Warnings: ${this.stats.warnings}\n`)

    if (this.issues.length === 0) {
      console.log('✅ No issues found! Your UI is consistent.\n')
      return
    }

    // Group issues by type
    const groupedIssues = this.groupIssuesByType()
    
    for (const [type, issues] of Object.entries(groupedIssues)) {
      console.log(`\n${this.getTypeIcon(type)} ${this.formatTypeName(type)} (${issues.length})`)
      console.log('─'.repeat(50))

      // Group by file
      const fileGroups = this.groupIssuesByFile(issues)
      
      for (const [file, fileIssues] of Object.entries(fileGroups)) {
        console.log(`\n📁 ${file}`)
        
        fileIssues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : '⚠️'
          console.log(`  ${icon} ${issue.message}`)
          if (issue.code) {
            console.log(`     Code: ${issue.code}`)
          }
        })
      }
    }

    // Recommendations
    this.generateRecommendations()
  }

  // Group issues by type
  groupIssuesByType() {
    return this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = []
      acc[issue.type].push(issue)
      return acc
    }, {})
  }

  // Group issues by file
  groupIssuesByFile(issues) {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = []
      acc[issue.file].push(issue)
      return acc
    }, {})
  }

  // Get icon for issue type
  getTypeIcon(type) {
    const icons = {
      'design-token': '🎨',
      'component-pattern': '🧩',
      'accessibility': '♿',
      'file-structure': '📂'
    }
    return icons[type] || '📋'
  }

  // Format type name
  formatTypeName(type) {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Generate recommendations
  generateRecommendations() {
    console.log('\n\n💡 Recommendations')
    console.log('==================')

    const recommendations = []

    if (this.stats.errors > 0) {
      recommendations.push('• Fix all error-level issues before deploying')
    }

    const designTokenIssues = this.issues.filter(i => i.type === 'design-token').length
    if (designTokenIssues > 10) {
      recommendations.push('• Consider creating a design token migration script')
    }

    const a11yIssues = this.issues.filter(i => i.type === 'accessibility').length
    if (a11yIssues > 5) {
      recommendations.push('• Run automated accessibility testing with axe-core')
    }

    const componentIssues = this.issues.filter(i => i.type === 'component-pattern').length
    if (componentIssues > 5) {
      recommendations.push('• Set up ESLint rules for component patterns')
    }

    if (recommendations.length === 0) {
      recommendations.push('• Great job! Consider setting up automated checks')
    }

    recommendations.forEach(rec => console.log(rec))
    
    console.log('\n🔧 Quick fixes:')
    console.log('• Run `npm run lint:fix` to auto-fix some issues')
    console.log('• Use the cn() utility: `className={cn("base-class", condition && "conditional")}`')
    console.log('• Add displayName: `Component.displayName = "ComponentName"`')
    console.log('• Use semantic tokens: `bg-primary` instead of `bg-blue-500`')
  }

  // Save report to file
  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues
    }

    const reportPath = path.join(__dirname, '../reports/ui-audit.json')
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📋 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`)
  }
}

// Main execution
async function main() {
  const auditor = new UIAuditor()
  
  try {
    await auditor.scanFiles()
    auditor.generateReport()
    await auditor.saveReport()
    
    // Exit with error code if critical issues found
    process.exit(auditor.stats.errors > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { UIAuditor }