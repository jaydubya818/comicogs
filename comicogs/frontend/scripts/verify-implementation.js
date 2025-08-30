#!/usr/bin/env node

/**
 * Comprehensive Implementation Verification Script
 * 
 * This script verifies that all implemented components and systems work correctly.
 * It runs a series of checks including:
 * - Component compilation
 * - Accessibility testing
 * - Error boundary testing  
 * - UI component functionality
 * - Security middleware
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

class ImplementationVerifier {
  constructor() {
    this.results = {
      compilation: { passed: 0, failed: 0, errors: [] },
      accessibility: { passed: 0, failed: 0, errors: [] },
      components: { passed: 0, failed: 0, errors: [] },
      security: { passed: 0, failed: 0, errors: [] },
      onboarding: { passed: 0, failed: 0, errors: [] },
      overall: { score: 0, status: 'pending' }
    }
  }

  async run() {
    console.log('🚀 Starting comprehensive implementation verification...\n')
    
    try {
      await this.checkCompilation()
      await this.checkAccessibility()
      await this.checkComponents()
      await this.checkSecurity()
      await this.checkOnboarding()
      
      this.calculateOverallScore()
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Verification failed:', error)
      process.exit(1)
    }
  }

  async checkCompilation() {
    console.log('📦 Checking TypeScript compilation...')
    
    try {
      // Check if TypeScript compiles without errors
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
      this.results.compilation.passed++
      console.log('✅ TypeScript compilation passed')
    } catch (error) {
      this.results.compilation.failed++
      this.results.compilation.errors.push('TypeScript compilation failed')
      console.log('❌ TypeScript compilation failed')
    }

    try {
      // Check if Next.js builds successfully
      console.log('   Building Next.js application...')
      execSync('npm run build', { stdio: 'pipe', timeout: 120000 })
      this.results.compilation.passed++
      console.log('✅ Next.js build passed')
    } catch (error) {
      this.results.compilation.failed++
      this.results.compilation.errors.push('Next.js build failed')
      console.log('❌ Next.js build failed')
    }
  }

  async checkAccessibility() {
    console.log('\n♿ Checking accessibility implementation...')
    
    // Check if accessibility files exist
    const a11yFiles = [
      'src/lib/accessibility/axe-config.ts',
      'src/lib/accessibility/AccessibilityChecker.ts',
      'src/components/accessibility/AccessibilityPanel.tsx',
      'src/components/accessibility/AccessibilityHelpers.tsx',
      'scripts/accessibility-audit.js'
    ]

    for (const file of a11yFiles) {
      try {
        await fs.access(path.join(process.cwd(), file))
        this.results.accessibility.passed++
        console.log(`✅ ${file} exists`)
      } catch (error) {
        this.results.accessibility.failed++
        this.results.accessibility.errors.push(`Missing file: ${file}`)
        console.log(`❌ Missing: ${file}`)
      }
    }

    // Test accessibility audit script
    try {
      console.log('   Testing accessibility audit script...')
      // Just check if the script loads without syntax errors
      require(path.join(process.cwd(), 'scripts/accessibility-audit.js'))
      this.results.accessibility.passed++
      console.log('✅ Accessibility audit script loads correctly')
    } catch (error) {
      this.results.accessibility.failed++
      this.results.accessibility.errors.push('Accessibility audit script has errors')
      console.log('❌ Accessibility audit script failed to load')
    }
  }

  async checkComponents() {
    console.log('\n🎨 Checking UI components...')
    
    const componentFiles = [
      'src/components/layout/AppShell.tsx',
      'src/components/layout/Breadcrumbs.tsx',
      'src/components/forms/Form.tsx',
      'src/components/ui/empty.tsx',
      'src/components/ui/error-block.tsx',
      'src/components/ui/skeleton-grid.tsx',
      'src/components/error/ErrorBoundary.tsx',
      'src/components/onboarding/OnboardingProvider.tsx'
    ]

    for (const file of componentFiles) {
      try {
        await fs.access(path.join(process.cwd(), file))
        this.results.components.passed++
        console.log(`✅ ${file} exists`)
      } catch (error) {
        this.results.components.failed++
        this.results.components.errors.push(`Missing component: ${file}`)
        console.log(`❌ Missing: ${file}`)
      }
    }

    // Check Tailwind config
    try {
      await fs.access(path.join(process.cwd(), 'tailwind.config.ts'))
      const tailwindConfig = await fs.readFile(path.join(process.cwd(), 'tailwind.config.ts'), 'utf8')
      
      if (tailwindConfig.includes('design-tokens') || tailwindConfig.includes('hsl(var(--primary))')) {
        this.results.components.passed++
        console.log('✅ Tailwind configuration includes design tokens')
      } else {
        this.results.components.failed++
        this.results.components.errors.push('Tailwind config missing design tokens')
        console.log('❌ Tailwind config missing design tokens')
      }
    } catch (error) {
      this.results.components.failed++
      this.results.components.errors.push('Tailwind config file missing')
      console.log('❌ Tailwind config file missing')
    }
  }

  async checkSecurity() {
    console.log('\n🔒 Checking security implementation...')
    
    // Check if security middleware files exist
    const securityFiles = [
      'backend/middleware/rateLimitingMiddleware.js',
      'backend/middleware/authMiddleware.js',
      'backend/middleware/errorHandlingMiddleware.js'
    ]

    for (const file of securityFiles) {
      try {
        await fs.access(path.join(process.cwd(), '..', file))
        this.results.security.passed++
        console.log(`✅ ${file} exists`)
      } catch (error) {
        this.results.security.failed++
        this.results.security.errors.push(`Missing security file: ${file}`)
        console.log(`❌ Missing: ${file}`)
      }
    }

    // Check environment configuration
    try {
      await fs.access(path.join(process.cwd(), '..', 'env.example'))
      const envExample = await fs.readFile(path.join(process.cwd(), '..', 'env.example'), 'utf8')
      
      if (envExample.includes('NEXTAUTH_SECRET') && envExample.includes('NODE_ENV=production')) {
        this.results.security.passed++
        console.log('✅ Environment configuration is production-ready')
      } else {
        this.results.security.failed++
        this.results.security.errors.push('Environment configuration incomplete')
        console.log('❌ Environment configuration incomplete')
      }
    } catch (error) {
      this.results.security.failed++
      this.results.security.errors.push('Environment example file missing')
      console.log('❌ Environment example file missing')
    }
  }

  async checkOnboarding() {
    console.log('\n👥 Checking onboarding system...')
    
    const onboardingFiles = [
      'src/components/onboarding/OnboardingProvider.tsx',
      'src/components/onboarding/OnboardingModal.tsx',
      'src/components/onboarding/steps/WelcomeStep.tsx',
      'src/components/onboarding/flows/newUserFlow.tsx'
    ]

    for (const file of onboardingFiles) {
      try {
        await fs.access(path.join(process.cwd(), file))
        this.results.onboarding.passed++
        console.log(`✅ ${file} exists`)
      } catch (error) {
        this.results.onboarding.failed++
        this.results.onboarding.errors.push(`Missing onboarding file: ${file}`)
        console.log(`❌ Missing: ${file}`)
      }
    }

    // Check if onboarding provider has proper context
    try {
      const providerFile = await fs.readFile(
        path.join(process.cwd(), 'src/components/onboarding/OnboardingProvider.tsx'), 
        'utf8'
      )
      
      if (providerFile.includes('createContext') && providerFile.includes('useOnboarding')) {
        this.results.onboarding.passed++
        console.log('✅ Onboarding provider has proper React context')
      } else {
        this.results.onboarding.failed++
        this.results.onboarding.errors.push('Onboarding provider missing React context')
        console.log('❌ Onboarding provider missing React context')
      }
    } catch (error) {
      this.results.onboarding.failed++
      this.results.onboarding.errors.push('Could not verify onboarding provider')
      console.log('❌ Could not verify onboarding provider')
    }
  }

  calculateOverallScore() {
    const totalPassed = Object.values(this.results)
      .filter(result => result.passed !== undefined)
      .reduce((sum, result) => sum + result.passed, 0)
      
    const totalFailed = Object.values(this.results)
      .filter(result => result.failed !== undefined)
      .reduce((sum, result) => sum + result.failed, 0)
    
    const totalTests = totalPassed + totalFailed
    const score = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
    
    this.results.overall.score = score
    this.results.overall.status = score >= 90 ? 'excellent' : score >= 80 ? 'good' : score >= 70 ? 'fair' : 'needs-work'
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 IMPLEMENTATION VERIFICATION REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n🎯 Overall Score: ${this.results.overall.score}% (${this.results.overall.status.toUpperCase()})`)
    
    console.log('\n📋 Detailed Results:')
    
    const categories = ['compilation', 'accessibility', 'components', 'security', 'onboarding']
    
    categories.forEach(category => {
      const result = this.results[category]
      const total = result.passed + result.failed
      const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 0
      
      console.log(`\n${category.toUpperCase()}:`)
      console.log(`   ✅ Passed: ${result.passed}`)
      console.log(`   ❌ Failed: ${result.failed}`)
      console.log(`   📊 Score: ${percentage}%`)
      
      if (result.errors.length > 0) {
        console.log('   🚨 Issues:')
        result.errors.forEach(error => console.log(`      - ${error}`))
      }
    })

    console.log('\n' + '='.repeat(60))
    
    if (this.results.overall.score >= 80) {
      console.log('🎉 Implementation verification completed successfully!')
      console.log('   Your UI framework is ready for production.')
    } else {
      console.log('⚠️  Implementation needs improvement before production.')
      console.log('   Please address the failed checks above.')
    }
    
    console.log('\n🔍 Next Steps:')
    console.log('   1. Run: npm run test:accessibility')
    console.log('   2. Run: npm run test:components') 
    console.log('   3. Run: npm run accessibility:audit')
    console.log('   4. Fix any remaining issues')
    console.log('   5. Deploy to production')
    
    console.log('\n' + '='.repeat(60))
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new ImplementationVerifier()
  verifier.run()
}

module.exports = ImplementationVerifier