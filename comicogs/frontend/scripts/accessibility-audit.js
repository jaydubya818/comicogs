#!/usr/bin/env node

/**
 * Automated Accessibility Audit Script
 * 
 * This script runs accessibility tests on multiple pages using Playwright and axe-core.
 * It generates comprehensive reports and can be integrated into CI/CD pipelines.
 */

const { chromium } = require('playwright')
const axeCore = require('axe-core')
const fs = require('fs').promises
const path = require('path')

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: './accessibility-reports',
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
  pages: [
    { path: '/', name: 'Homepage', context: 'homepage' },
    { path: '/collection', name: 'Collection', context: 'collection' },
    { path: '/search', name: 'Search', context: 'search' },
    { path: '/marketplace', name: 'Marketplace', context: 'marketplace' },
    { path: '/login', name: 'Login Form', context: 'forms' },
    { path: '/register', name: 'Register Form', context: 'forms' }
  ],
  axeConfig: {
    rules: {
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
      'region': { enabled: true }
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
  }
}

class AccessibilityAuditor {
  constructor() {
    this.browser = null
    this.results = []
    this.startTime = new Date()
  }

  async initialize() {
    console.log('🚀 Starting accessibility audit...')
    this.browser = await chromium.launch({ headless: true })
    
    // Ensure output directory exists
    await fs.mkdir(config.outputDir, { recursive: true })
  }

  async auditPage(pageConfig) {
    console.log(`🔍 Auditing: ${pageConfig.name} (${pageConfig.path})`)
    
    const context = await this.browser.newContext({
      viewport: config.viewport
    })
    
    const page = await context.newPage()
    
    try {
      // Navigate to page
      await page.goto(`${config.baseUrl}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: config.timeout
      })

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000)

      // Inject axe-core
      await page.addScriptTag({
        path: require.resolve('axe-core/axe.min.js')
      })

      // Run axe accessibility test
      const results = await page.evaluate((axeConfig) => {
        return new Promise((resolve) => {
          axe.configure(axeConfig)
          axe.run(document, (err, results) => {
            if (err) throw err
            resolve(results)
          })
        })
      }, config.axeConfig)

      // Process results
      const processedResult = this.processResults(results, pageConfig)
      this.results.push(processedResult)

      // Take screenshot for visual reference
      const screenshotPath = path.join(config.outputDir, `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-screenshot.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })

      console.log(`✅ Completed: ${pageConfig.name} - Score: ${processedResult.score}% (${processedResult.violations.total} issues)`)

      return processedResult

    } catch (error) {
      console.error(`❌ Failed to audit ${pageConfig.name}:`, error.message)
      return {
        page: pageConfig.name,
        path: pageConfig.path,
        context: pageConfig.context,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    } finally {
      await context.close()
    }
  }

  processResults(axeResults, pageConfig) {
    const violations = {
      critical: axeResults.violations.filter(v => v.impact === 'critical').length,
      serious: axeResults.violations.filter(v => v.impact === 'serious').length,
      moderate: axeResults.violations.filter(v => v.impact === 'moderate').length,
      minor: axeResults.violations.filter(v => v.impact === 'minor').length,
      total: axeResults.violations.length
    }

    // Calculate accessibility score
    const totalTests = violations.total + axeResults.passes.length + axeResults.incomplete.length
    const weightedViolations = 
      violations.critical * 10 +
      violations.serious * 5 +
      violations.moderate * 2 +
      violations.minor * 1

    const score = totalTests > 0 ? Math.max(0, Math.round(100 - ((weightedViolations / totalTests) * 100))) : 100

    return {
      page: pageConfig.name,
      path: pageConfig.path,
      context: pageConfig.context,
      url: `${config.baseUrl}${pageConfig.path}`,
      timestamp: new Date().toISOString(),
      violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length,
      score,
      details: axeResults.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html.substring(0, 300),
          failureSummary: node.failureSummary
        }))
      }))
    }
  }

  async runFullAudit() {
    for (const pageConfig of config.pages) {
      await this.auditPage(pageConfig)
    }
  }

  generateReport() {
    const endTime = new Date()
    const duration = Math.round((endTime - this.startTime) / 1000)

    const summary = {
      timestamp: endTime.toISOString(),
      duration: `${duration}s`,
      baseUrl: config.baseUrl,
      totalPages: this.results.length,
      averageScore: this.results.length > 0 
        ? Math.round(this.results.reduce((sum, r) => sum + (r.score || 0), 0) / this.results.length)
        : 0,
      totalViolations: this.results.reduce((sum, r) => sum + (r.violations?.total || 0), 0),
      criticalIssues: this.results.reduce((sum, r) => sum + (r.violations?.critical || 0), 0),
      seriousIssues: this.results.reduce((sum, r) => sum + (r.violations?.serious || 0), 0),
      moderateIssues: this.results.reduce((sum, r) => sum + (r.violations?.moderate || 0), 0),
      minorIssues: this.results.reduce((sum, r) => sum + (r.violations?.minor || 0), 0)
    }

    const recommendations = this.generateRecommendations(summary)

    return {
      summary,
      results: this.results,
      recommendations,
      config: {
        axeVersion: require('axe-core/package.json').version,
        rules: Object.keys(config.axeConfig.rules).filter(key => config.axeConfig.rules[key].enabled),
        tags: config.axeConfig.tags
      }
    }
  }

  generateRecommendations(summary) {
    const recommendations = []

    if (summary.criticalIssues > 0) {
      recommendations.push({
        priority: 'critical',
        message: `🚨 ${summary.criticalIssues} critical accessibility issues found. These prevent users with disabilities from accessing content.`,
        action: 'Address immediately'
      })
    }

    if (summary.seriousIssues > 0) {
      recommendations.push({
        priority: 'high',
        message: `⚠️ ${summary.seriousIssues} serious accessibility issues found. These significantly impact user experience.`,
        action: 'Fix within 1-2 sprints'
      })
    }

    if (summary.averageScore < 80) {
      recommendations.push({
        priority: 'medium',
        message: `📈 Overall accessibility score is ${summary.averageScore}%. Aim for 90%+ for excellent accessibility.`,
        action: 'Implement accessibility review process'
      })
    }

    if (summary.moderateIssues > summary.totalPages * 2) {
      recommendations.push({
        priority: 'medium',
        message: `🔧 High number of moderate issues (${summary.moderateIssues}). Consider accessibility training for the team.`,
        action: 'Schedule team accessibility workshop'
      })
    }

    // Add specific recommendations based on common issues
    const commonIssues = this.analyzeCommonIssues()
    recommendations.push(...commonIssues)

    return recommendations
  }

  analyzeCommonIssues() {
    const issues = []
    const allViolations = this.results.flatMap(r => r.details || [])

    // Check for specific common issues
    const colorContrastIssues = allViolations.filter(v => v.id === 'color-contrast')
    if (colorContrastIssues.length > 0) {
      issues.push({
        priority: 'high',
        message: `🎨 Color contrast issues found on ${colorContrastIssues.length} elements. Ensure 4.5:1 ratio for normal text, 3:1 for large text.`,
        action: 'Review design system colors'
      })
    }

    const labelIssues = allViolations.filter(v => v.id.includes('label'))
    if (labelIssues.length > 0) {
      issues.push({
        priority: 'high',
        message: `🏷️ Form labeling issues found. All form inputs need proper labels.`,
        action: 'Audit all forms and add missing labels'
      })
    }

    const keyboardIssues = allViolations.filter(v => v.id.includes('keyboard') || v.id.includes('focus'))
    if (keyboardIssues.length > 0) {
      issues.push({
        priority: 'high',
        message: `⌨️ Keyboard navigation issues found. All interactive elements must be keyboard accessible.`,
        action: 'Test all interactive components with keyboard only'
      })
    }

    return issues
  }

  async saveReport() {
    const report = this.generateReport()
    
    // Save full JSON report
    const jsonPath = path.join(config.outputDir, `accessibility-report-${new Date().toISOString().split('T')[0]}.json`)
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2))

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report)
    const htmlPath = path.join(config.outputDir, `accessibility-report-${new Date().toISOString().split('T')[0]}.html`)
    await fs.writeFile(htmlPath, htmlReport)

    console.log(`\n📊 Reports saved:`)
    console.log(`   JSON: ${jsonPath}`)
    console.log(`   HTML: ${htmlPath}`)

    return { jsonPath, htmlPath, report }
  }

  generateHTMLReport(report) {
    const { summary, results, recommendations } = report

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report - ${summary.timestamp}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .score { font-size: 3rem; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.good { color: #10b981; }
        .score.ok { color: #f59e0b; }
        .score.bad { color: #ef4444; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; }
        .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .results-table th { background: #f8fafc; font-weight: 600; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
        .badge.critical { background: #fee2e2; color: #dc2626; }
        .badge.serious { background: #fed7aa; color: #ea580c; }
        .badge.moderate { background: #fef3c7; color: #d97706; }
        .badge.minor { background: #dbeafe; color: #2563eb; }
        .recommendation { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 4px; }
        .recommendation.critical { border-color: #dc2626; background: #fee2e2; }
        .recommendation.high { border-color: #ea580c; background: #fed7aa; }
        .recommendation.medium { border-color: #d97706; background: #fef3c7; }
        .recommendation.low { border-color: #2563eb; background: #dbeafe; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Accessibility Audit Report</h1>
            <p><strong>Generated:</strong> ${summary.timestamp}</p>
            <p><strong>Base URL:</strong> ${summary.baseUrl}</p>
            <p><strong>Duration:</strong> ${summary.duration}</p>
        </div>

        <div class="score ${summary.averageScore >= 90 ? 'good' : summary.averageScore >= 70 ? 'ok' : 'bad'}">
            ${summary.averageScore}%
        </div>
        <p style="text-align: center; font-size: 1.125rem; margin-bottom: 30px;">Overall Accessibility Score</p>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>${summary.totalPages}</h3>
                <p>Pages Tested</p>
            </div>
            <div class="summary-card">
                <h3 style="color: #dc2626;">${summary.criticalIssues}</h3>
                <p>Critical Issues</p>
            </div>
            <div class="summary-card">
                <h3 style="color: #ea580c;">${summary.seriousIssues}</h3>
                <p>Serious Issues</p>
            </div>
            <div class="summary-card">
                <h3 style="color: #d97706;">${summary.moderateIssues}</h3>
                <p>Moderate Issues</p>
            </div>
            <div class="summary-card">
                <h3 style="color: #2563eb;">${summary.minorIssues}</h3>
                <p>Minor Issues</p>
            </div>
        </div>

        <h2>Page Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Score</th>
                    <th>Critical</th>
                    <th>Serious</th>
                    <th>Moderate</th>
                    <th>Minor</th>
                    <th>Total Issues</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr>
                        <td><strong>${result.page}</strong><br><small>${result.path}</small></td>
                        <td><span class="badge ${result.score >= 90 ? 'good' : result.score >= 70 ? 'ok' : 'bad'}">${result.score}%</span></td>
                        <td>${result.violations?.critical || 0}</td>
                        <td>${result.violations?.serious || 0}</td>
                        <td>${result.violations?.moderate || 0}</td>
                        <td>${result.violations?.minor || 0}</td>
                        <td><strong>${result.violations?.total || 0}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Recommendations</h2>
        ${recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <p><strong>${rec.message}</strong></p>
                <p><em>Action: ${rec.action}</em></p>
            </div>
        `).join('')}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.875rem;">
            <p>Generated by Comicogs Accessibility Auditor using axe-core ${report.config.axeVersion}</p>
        </div>
    </div>
</body>
</html>`
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async run() {
    try {
      await this.initialize()
      await this.runFullAudit()
      const { report } = await this.saveReport()

      // Print summary to console
      console.log('\n📊 Audit Summary:')
      console.log(`   Overall Score: ${report.summary.averageScore}%`)
      console.log(`   Total Issues: ${report.summary.totalViolations}`)
      console.log(`   Critical: ${report.summary.criticalIssues}`)
      console.log(`   Serious: ${report.summary.seriousIssues}`)
      console.log(`   Pages Tested: ${report.summary.totalPages}`)

      if (report.summary.criticalIssues > 0 || report.summary.averageScore < 80) {
        console.log('\n⚠️  Accessibility issues detected. Please review the report.')
        process.exit(1)
      } else {
        console.log('\n✅ Accessibility audit completed successfully!')
        process.exit(0)
      }

    } catch (error) {
      console.error('\n❌ Audit failed:', error)
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new AccessibilityAuditor()
  auditor.run()
}

module.exports = AccessibilityAuditor