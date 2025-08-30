#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

class ComponentAnalyzer {
  constructor() {
    this.components = new Map()
    this.stats = {
      totalComponents: 0,
      withTests: 0,
      withStories: 0,
      withTypeScript: 0,
      withForwardRef: 0,
      withDisplayName: 0,
      avgComplexity: 0
    }
  }

  async scanComponents() {
    const componentFiles = await glob('frontend/src/components/**/*.{tsx,jsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*']
    })

    console.log(`🔍 Analyzing ${componentFiles.length} components...\n`)

    for (const file of componentFiles) {
      await this.analyzeComponent(file)
    }

    this.calculateStats()
  }

  async analyzeComponent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(process.cwd(), filePath)
    const componentName = this.extractComponentName(filePath, content)

    const analysis = {
      name: componentName,
      file: relativePath,
      isTypeScript: filePath.endsWith('.tsx') || filePath.endsWith('.ts'),
      hasForwardRef: /React\.forwardRef|forwardRef/.test(content),
      hasDisplayName: /\.displayName\s*=/.test(content),
      hasDefaultExport: /export\s+default/.test(content),
      hasNamedExports: /export\s+(?:function|const|class)/.test(content),
      hasPropsInterface: /interface\s+\w*Props/.test(content),
      hasTests: await this.hasTestFile(filePath),
      hasStories: await this.hasStoryFile(filePath),
      complexity: this.calculateComplexity(content),
      dependencies: this.extractDependencies(content),
      hooks: this.extractHooks(content),
      accessibility: this.checkAccessibility(content),
      performance: this.checkPerformance(content),
      issues: []
    }

    // Identify issues
    this.identifyIssues(analysis, content)

    this.components.set(componentName, analysis)
  }

  extractComponentName(filePath, content) {
    const fileName = path.basename(filePath, path.extname(filePath))
    
    // Try to extract from export default
    const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/)
    if (defaultExportMatch) {
      return defaultExportMatch[1]
    }

    // Try to extract from function declaration
    const functionMatch = content.match(/function\s+(\w+)\s*\(/)
    if (functionMatch) {
      return functionMatch[1]
    }

    // Fall back to filename
    return fileName
  }

  calculateComplexity(content) {
    let complexity = 1 // Base complexity

    // Count conditional statements
    complexity += (content.match(/\b(if|else if|switch|case)\b/g) || []).length
    
    // Count loops
    complexity += (content.match(/\b(for|while|do)\b/g) || []).length
    
    // Count ternary operators
    complexity += (content.match(/\?[^:]*:/g) || []).length
    
    // Count logical operators
    complexity += (content.match(/&&|\|\|/g) || []).length
    
    // Count early returns
    complexity += (content.match(/\breturn\b/g) || []).length - 1 // Subtract 1 for main return

    return Math.max(1, complexity)
  }

  extractDependencies(content) {
    const dependencies = []
    
    // Extract imports
    const importMatches = content.matchAll(/import.*from\s+['"`]([^'"`]+)['"`]/g)
    for (const match of importMatches) {
      dependencies.push(match[1])
    }

    return dependencies.filter(dep => !dep.startsWith('.')) // External deps only
  }

  extractHooks(content) {
    const hooks = []
    const hookMatches = content.matchAll(/\b(use\w+)\s*\(/g)
    
    for (const match of hookMatches) {
      if (!hooks.includes(match[1])) {
        hooks.push(match[1])
      }
    }

    return hooks
  }

  checkAccessibility(content) {
    const issues = []
    
    // Check for missing alt text
    if (/<img(?![^>]*alt=)[^>]*>/i.test(content)) {
      issues.push('Missing alt attributes on images')
    }
    
    // Check for proper button usage
    if (/<div[^>]*onClick/i.test(content) && !/<button/i.test(content)) {
      issues.push('Consider using button instead of div with onClick')
    }
    
    // Check for form labels
    if (/<input/i.test(content) && !/<label/i.test(content) && !/aria-label/i.test(content)) {
      issues.push('Input elements should have labels or aria-label')
    }

    return {
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25),
      issues
    }
  }

  checkPerformance(content) {
    const issues = []
    const suggestions = []
    
    // Check for inline functions in JSX
    if (/\w+\s*=\s*\{[^}]*=>/g.test(content)) {
      suggestions.push('Consider using useCallback for inline functions')
    }
    
    // Check for missing React.memo
    if (/function\s+\w+\s*\([^)]*props/i.test(content) && !/React\.memo|memo\(/i.test(content)) {
      suggestions.push('Consider wrapping in React.memo if props rarely change')
    }
    
    // Check for expensive operations in render
    if (/\.sort\(\)|\.filter\(\)|\.map\(\)/.test(content) && !/useMemo/.test(content)) {
      suggestions.push('Consider using useMemo for expensive array operations')
    }

    return {
      score: suggestions.length === 0 ? 100 : Math.max(0, 100 - suggestions.length * 15),
      suggestions
    }
  }

  identifyIssues(analysis, content) {
    // Missing TypeScript interface
    if (analysis.isTypeScript && !analysis.hasPropsInterface) {
      analysis.issues.push({
        type: 'typescript',
        severity: 'warning',
        message: 'Component should have a Props interface'
      })
    }

    // Missing displayName
    if (!analysis.hasDisplayName) {
      analysis.issues.push({
        type: 'debugging',
        severity: 'info',
        message: 'Component should have displayName for better debugging'
      })
    }

    // Ref prop without forwardRef
    if (/\bref\s*[:\?]/.test(content) && !analysis.hasForwardRef) {
      analysis.issues.push({
        type: 'ref-forwarding',
        severity: 'error',
        message: 'Component accepting ref should use forwardRef'
      })
    }

    // Missing tests
    if (!analysis.hasTests) {
      analysis.issues.push({
        type: 'testing',
        severity: 'warning',
        message: 'Component should have unit tests'
      })
    }

    // Missing stories
    if (!analysis.hasStories) {
      analysis.issues.push({
        type: 'documentation',
        severity: 'info',
        message: 'Component should have Storybook stories'
      })
    }

    // High complexity
    if (analysis.complexity > 10) {
      analysis.issues.push({
        type: 'complexity',
        severity: 'warning',
        message: `High cyclomatic complexity (${analysis.complexity}). Consider breaking into smaller components.`
      })
    }
  }

  async hasTestFile(componentPath) {
    const basePath = componentPath.replace(/\.(tsx|jsx)$/, '')
    const testPatterns = [
      `${basePath}.test.tsx`,
      `${basePath}.test.jsx`,
      `${basePath}.spec.tsx`,
      `${basePath}.spec.jsx`,
      `${path.dirname(componentPath)}/__tests__/${path.basename(basePath)}.test.{tsx,jsx}`,
      `${path.dirname(componentPath)}/__tests__/${path.basename(basePath)}.spec.{tsx,jsx}`
    ]

    for (const pattern of testPatterns) {
      const files = await glob(pattern)
      if (files.length > 0) return true
    }

    return false
  }

  async hasStoryFile(componentPath) {
    const basePath = componentPath.replace(/\.(tsx|jsx)$/, '')
    const storyPatterns = [
      `${basePath}.stories.tsx`,
      `${basePath}.stories.jsx`,
      `${basePath}.stories.ts`,
      `${basePath}.stories.js`
    ]

    for (const pattern of storyPatterns) {
      const files = await glob(pattern)
      if (files.length > 0) return true
    }

    return false
  }

  calculateStats() {
    const components = Array.from(this.components.values())
    
    this.stats.totalComponents = components.length
    this.stats.withTests = components.filter(c => c.hasTests).length
    this.stats.withStories = components.filter(c => c.hasStories).length
    this.stats.withTypeScript = components.filter(c => c.isTypeScript).length
    this.stats.withForwardRef = components.filter(c => c.hasForwardRef).length
    this.stats.withDisplayName = components.filter(c => c.hasDisplayName).length
    this.stats.avgComplexity = components.reduce((sum, c) => sum + c.complexity, 0) / components.length
  }

  generateReport() {
    console.log('🧩 Component Analysis Report')
    console.log('============================\n')

    // Overall stats
    console.log('📊 Overall Statistics:')
    console.log(`Total Components: ${this.stats.totalComponents}`)
    console.log(`TypeScript Coverage: ${((this.stats.withTypeScript / this.stats.totalComponents) * 100).toFixed(1)}%`)
    console.log(`Test Coverage: ${((this.stats.withTests / this.stats.totalComponents) * 100).toFixed(1)}%`)
    console.log(`Story Coverage: ${((this.stats.withStories / this.stats.totalComponents) * 100).toFixed(1)}%`)
    console.log(`Avg. Complexity: ${this.stats.avgComplexity.toFixed(1)}\n`)

    // Top issues
    this.showTopIssues()
    
    // Complex components
    this.showComplexComponents()
    
    // Missing coverage
    this.showMissingCoverage()
    
    // Recommendations
    this.showRecommendations()
  }

  showTopIssues() {
    console.log('🚨 Top Issues:')
    
    const allIssues = Array.from(this.components.values())
      .flatMap(comp => comp.issues.map(issue => ({ ...issue, component: comp.name })))
    
    const issueGroups = allIssues.reduce((acc, issue) => {
      const key = `${issue.type}: ${issue.message}`
      if (!acc[key]) acc[key] = { count: 0, components: [], severity: issue.severity }
      acc[key].count++
      acc[key].components.push(issue.component)
      return acc
    }, {})

    const sortedIssues = Object.entries(issueGroups)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)

    if (sortedIssues.length === 0) {
      console.log('✅ No common issues found!\n')
    } else {
      sortedIssues.forEach(([issue, data]) => {
        const icon = data.severity === 'error' ? '❌' : data.severity === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`${icon} ${issue} (${data.count} components)`)
      })
      console.log()
    }
  }

  showComplexComponents() {
    console.log('🔥 Most Complex Components:')
    
    const complexComponents = Array.from(this.components.values())
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 5)

    if (complexComponents.length === 0) {
      console.log('No components analyzed\n')
      return
    }

    complexComponents.forEach((comp, index) => {
      const icon = comp.complexity > 15 ? '🔴' : comp.complexity > 10 ? '🟡' : '🟢'
      console.log(`${index + 1}. ${icon} ${comp.name} (complexity: ${comp.complexity})`)
    })
    console.log()
  }

  showMissingCoverage() {
    console.log('📋 Missing Coverage:')
    
    const missingTests = Array.from(this.components.values())
      .filter(comp => !comp.hasTests)
      .map(comp => comp.name)

    const missingStories = Array.from(this.components.values())
      .filter(comp => !comp.hasStories)
      .map(comp => comp.name)

    if (missingTests.length > 0) {
      console.log(`🧪 Components without tests (${missingTests.length}):`)
      missingTests.slice(0, 10).forEach(name => console.log(`  • ${name}`))
      if (missingTests.length > 10) {
        console.log(`  ... and ${missingTests.length - 10} more`)
      }
    }

    if (missingStories.length > 0) {
      console.log(`📚 Components without stories (${missingStories.length}):`)
      missingStories.slice(0, 10).forEach(name => console.log(`  • ${name}`))
      if (missingStories.length > 10) {
        console.log(`  ... and ${missingStories.length - 10} more`)
      }
    }

    console.log()
  }

  showRecommendations() {
    console.log('💡 Recommendations:')
    
    const recommendations = []

    if (this.stats.withTests / this.stats.totalComponents < 0.8) {
      recommendations.push('Increase test coverage - aim for 80%+ component tests')
    }

    if (this.stats.withStories / this.stats.totalComponents < 0.5) {
      recommendations.push('Add Storybook stories for better component documentation')
    }

    if (this.stats.avgComplexity > 8) {
      recommendations.push('Consider breaking down complex components into smaller parts')
    }

    if (this.stats.withDisplayName / this.stats.totalComponents < 0.9) {
      recommendations.push('Add displayName to components for better debugging')
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your component architecture looks solid')
    }

    recommendations.forEach(rec => console.log(`• ${rec}`))
    console.log()
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      components: Object.fromEntries(this.components)
    }

    const reportPath = path.join(__dirname, '../reports/component-analysis.json')
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📋 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`)
  }
}

async function main() {
  const analyzer = new ComponentAnalyzer()
  
  try {
    await analyzer.scanComponents()
    analyzer.generateReport()
    await analyzer.saveReport()
    
  } catch (error) {
    console.error('❌ Component analysis failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { ComponentAnalyzer }