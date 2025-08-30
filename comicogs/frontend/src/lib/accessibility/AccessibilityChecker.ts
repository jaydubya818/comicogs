'use client'

import axeCore, { AxeResults, Result } from 'axe-core'
import { comicogAxeConfig, testingContexts, AccessibilityTestResult, calculateAccessibilityScore } from './axe-config'

export class AccessibilityChecker {
  private static instance: AccessibilityChecker
  private isEnabled: boolean = false
  private results: Map<string, AccessibilityTestResult> = new Map()
  private observers: ((results: AccessibilityTestResult[]) => void)[] = []

  private constructor() {
    // Initialize only in development or when explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('accessibility-testing') === 'enabled'
    
    if (this.isEnabled) {
      this.initializeAxe()
    }
  }

  static getInstance(): AccessibilityChecker {
    if (!AccessibilityChecker.instance) {
      AccessibilityChecker.instance = new AccessibilityChecker()
    }
    return AccessibilityChecker.instance
  }

  private async initializeAxe() {
    try {
      // Configure axe with our custom rules
      axeCore.configure(comicogAxeConfig as any)
      console.log('🔍 Accessibility checker initialized')
    } catch (error) {
      console.error('Failed to initialize accessibility checker:', error)
    }
  }

  // Enable/disable accessibility checking
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (enabled) {
      localStorage.setItem('accessibility-testing', 'enabled')
      this.initializeAxe()
    } else {
      localStorage.removeItem('accessibility-testing')
    }
  }

  // Run accessibility audit on current page
  async auditPage(context: keyof typeof testingContexts = 'homepage'): Promise<AccessibilityTestResult | null> {
    if (!this.isEnabled) return null

    try {
      const contextConfig = testingContexts[context]
      const results = await axeCore.run(document, contextConfig.config) as unknown as AxeResults
      
      const processedResult = this.processResults(results, context)
      this.results.set(context, processedResult)
      
      // Notify observers
      this.notifyObservers()
      
      return processedResult
    } catch (error) {
      console.error('Accessibility audit failed:', error)
      return null
    }
  }

  // Run audit on specific element
  async auditElement(element: Element, context: string = 'component'): Promise<AccessibilityTestResult | null> {
    if (!this.isEnabled) return null

    try {
      const results = await axeCore.run(element, comicogAxeConfig) as unknown as AxeResults
      return this.processResults(results, context)
    } catch (error) {
      console.error('Element accessibility audit failed:', error)
      return null
    }
  }

  // Continuous monitoring
  startContinuousMonitoring(interval: number = 30000) {
    if (!this.isEnabled) return

    const monitor = setInterval(async () => {
      await this.auditPage()
    }, interval)

    // Store reference to clear later if needed
    ;(window as any).__a11yMonitor = monitor
  }

  stopContinuousMonitoring() {
    const monitor = (window as any).__a11yMonitor
    if (monitor) {
      clearInterval(monitor)
      delete (window as any).__a11yMonitor
    }
  }

  // Process raw axe results into our format
  private processResults(results: AxeResults, context: string): AccessibilityTestResult {
    const violations = {
      critical: results.violations.filter(v => v.impact === 'critical').length,
      serious: results.violations.filter(v => v.impact === 'serious').length,
      moderate: results.violations.filter(v => v.impact === 'moderate').length,
      minor: results.violations.filter(v => v.impact === 'minor').length,
      total: results.violations.length
    }

    const score = calculateAccessibilityScore({
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length
    })

    return {
      context,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      details: results.violations.map(this.formatViolation),
      score
    }
  }

  // Format violation for display
  private formatViolation(violation: Result) {
    return {
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        html: node.html.substring(0, 200), // Truncate for display
        failureSummary: node.failureSummary,
        element: node.element
      }))
    }
  }

  // Get all results
  getAllResults(): AccessibilityTestResult[] {
    return Array.from(this.results.values())
  }

  // Get results for specific context
  getResultsForContext(context: string): AccessibilityTestResult | undefined {
    return this.results.get(context)
  }

  // Clear all results
  clearResults() {
    this.results.clear()
    this.notifyObservers()
  }

  // Subscribe to results updates
  subscribe(callback: (results: AccessibilityTestResult[]) => void) {
    this.observers.push(callback)
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback)
    }
  }

  // Notify observers of changes
  private notifyObservers() {
    const results = this.getAllResults()
    this.observers.forEach(callback => callback(results))
  }

  // Export results for reporting
  exportResults(): string {
    const results = this.getAllResults()
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalContexts: results.length,
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
        totalViolations: results.reduce((sum, r) => sum + r.violations.total, 0)
      },
      results
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // Generate accessibility report
  generateReport(): AccessibilityReport {
    const results = this.getAllResults()
    
    const summary = {
      totalTests: results.length,
      averageScore: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0,
      totalViolations: results.reduce((sum, r) => sum + r.violations.total, 0),
      criticalIssues: results.reduce((sum, r) => sum + r.violations.critical, 0),
      seriousIssues: results.reduce((sum, r) => sum + r.violations.serious, 0)
    }

    const recommendations = this.generateRecommendations(results)
    
    return {
      summary,
      results,
      recommendations,
      timestamp: new Date().toISOString()
    }
  }

  private generateRecommendations(results: AccessibilityTestResult[]): string[] {
    const recommendations: string[] = []
    
    const totalCritical = results.reduce((sum, r) => sum + r.violations.critical, 0)
    const totalSerious = results.reduce((sum, r) => sum + r.violations.serious, 0)
    
    if (totalCritical > 0) {
      recommendations.push(`🚨 Address ${totalCritical} critical accessibility issues immediately`)
    }
    
    if (totalSerious > 0) {
      recommendations.push(`⚠️ Fix ${totalSerious} serious accessibility issues`)
    }
    
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    if (avgScore < 80) {
      recommendations.push(`📈 Improve overall accessibility score (currently ${Math.round(avgScore)}%)`)
    }
    
    // Add specific recommendations based on common issues
    const commonIssues = this.identifyCommonIssues(results)
    recommendations.push(...commonIssues)
    
    return recommendations
  }

  private identifyCommonIssues(results: AccessibilityTestResult[]): string[] {
    const issues: string[] = []
    
    // Check for common patterns in violation details
    const allViolations = results.flatMap(r => r.details)
    
    const colorContrastIssues = allViolations.filter(v => v.id === 'color-contrast')
    if (colorContrastIssues.length > 0) {
      issues.push(`🎨 Review color contrast ratios (${colorContrastIssues.length} instances)`)
    }
    
    const keyboardIssues = allViolations.filter(v => v.id.includes('keyboard') || v.id.includes('focus'))
    if (keyboardIssues.length > 0) {
      issues.push(`⌨️ Improve keyboard navigation (${keyboardIssues.length} instances)`)
    }
    
    const labelIssues = allViolations.filter(v => v.id.includes('label'))
    if (labelIssues.length > 0) {
      issues.push(`🏷️ Add proper form labels (${labelIssues.length} instances)`)
    }
    
    return issues
  }
}

export interface AccessibilityReport {
  summary: {
    totalTests: number
    averageScore: number
    totalViolations: number
    criticalIssues: number
    seriousIssues: number
  }
  results: AccessibilityTestResult[]
  recommendations: string[]
  timestamp: string
}

// Singleton instance
export const accessibilityChecker = AccessibilityChecker.getInstance()