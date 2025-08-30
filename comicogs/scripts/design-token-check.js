#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Design token mapping from hardcoded to semantic tokens
const TOKEN_MIGRATIONS = {
  // Colors
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted',
  'bg-gray-900': 'bg-card',
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-red-500': 'bg-destructive',
  'bg-red-600': 'bg-destructive',
  'bg-green-500': 'bg-success',
  'bg-yellow-500': 'bg-warning',
  
  'text-white': 'text-primary-foreground',
  'text-black': 'text-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-900': 'text-foreground',
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'text-red-500': 'text-destructive',
  'text-green-500': 'text-success',
  
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-blue-500': 'border-primary',
  'border-red-500': 'border-destructive',
  
  // Spacing (inconsistent values)
  'p-1.5': 'p-2',
  'p-2.5': 'p-3',
  'p-3.5': 'p-4',
  'p-5': 'p-6',
  'p-7': 'p-8',
  'm-1.5': 'm-2',
  'm-2.5': 'm-3',
  'm-3.5': 'm-4',
  'm-5': 'm-6',
  'm-7': 'm-8',
  
  // Font sizes (non-standard)
  'text-13': 'text-sm',
  'text-15': 'text-base',
  'text-17': 'text-lg',
  'text-19': 'text-xl',
  'text-21': 'text-2xl'
}

class DesignTokenChecker {
  constructor() {
    this.migrations = []
    this.stats = {
      filesScanned: 0,
      migrationsFound: 0,
      tokensReplaced: 0
    }
  }

  async scanFiles() {
    const patterns = [
      'frontend/src/**/*.{tsx,jsx,ts,js}',
      'frontend/tailwind.config.{ts,js}',
      'frontend/src/app/globals.css'
    ]

    const files = []
    for (const pattern of patterns) {
      const matches = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] })
      files.push(...matches)
    }

    console.log(`🔍 Checking ${files.length} files for design token migrations...\n`)

    for (const file of files) {
      await this.scanFile(file)
      this.stats.filesScanned++
    }
  }

  async scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(process.cwd(), filePath)
    
    let fileHasMigrations = false
    
    for (const [oldToken, newToken] of Object.entries(TOKEN_MIGRATIONS)) {
      const regex = new RegExp(`\\b${oldToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const matches = content.match(regex)
      
      if (matches) {
        this.migrations.push({
          file: relativePath,
          oldToken,
          newToken,
          occurrences: matches.length
        })
        
        fileHasMigrations = true
        this.stats.tokensReplaced += matches.length
      }
    }
    
    if (fileHasMigrations) {
      this.stats.migrationsFound++
    }
  }

  generateReport() {
    console.log('🎨 Design Token Migration Report')
    console.log('================================\n')

    console.log(`Files Scanned: ${this.stats.filesScanned}`)
    console.log(`Files with Migrations: ${this.stats.migrationsFound}`)
    console.log(`Total Token Replacements: ${this.stats.tokensReplaced}\n`)

    if (this.migrations.length === 0) {
      console.log('✅ No hardcoded tokens found! Your design system is consistent.\n')
      return
    }

    // Group by file
    const fileGroups = this.migrations.reduce((acc, migration) => {
      if (!acc[migration.file]) acc[migration.file] = []
      acc[migration.file].push(migration)
      return acc
    }, {})

    for (const [file, fileMigrations] of Object.entries(fileGroups)) {
      console.log(`📁 ${file}`)
      
      fileMigrations.forEach(migration => {
        console.log(`  🔄 ${migration.oldToken} → ${migration.newToken} (${migration.occurrences}x)`)
      })
      console.log()
    }

    this.showMigrationScript()
  }

  showMigrationScript() {
    console.log('🔧 Auto-migration Script')
    console.log('========================\n')
    
    console.log('Run the following commands to automatically migrate tokens:\n')
    
    // Generate sed commands for each migration
    for (const [oldToken, newToken] of Object.entries(TOKEN_MIGRATIONS)) {
      console.log(`find frontend/src -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' 's/\\b${oldToken}\\b/${newToken}/g'`)
    }

    console.log('\n💡 Or use the migrate command:')
    console.log('node scripts/design-token-check.js --migrate')
  }

  async migrate() {
    if (this.migrations.length === 0) {
      console.log('✅ No tokens to migrate!')
      return
    }

    console.log('🚀 Starting token migration...\n')
    
    const fileGroups = this.migrations.reduce((acc, migration) => {
      if (!acc[migration.file]) acc[migration.file] = []
      acc[migration.file].push(migration)
      return acc
    }, {})

    let totalReplaced = 0

    for (const [file, fileMigrations] of Object.entries(fileGroups)) {
      let content = fs.readFileSync(file, 'utf8')
      let fileReplaced = 0
      
      for (const migration of fileMigrations) {
        const regex = new RegExp(`\\b${migration.oldToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        const newContent = content.replace(regex, migration.newToken)
        const replacements = (content.match(regex) || []).length
        
        content = newContent
        fileReplaced += replacements
        totalReplaced += replacements
      }
      
      if (fileReplaced > 0) {
        fs.writeFileSync(file, content, 'utf8')
        console.log(`✅ ${file} - ${fileReplaced} tokens migrated`)
      }
    }

    console.log(`\n🎉 Migration complete! ${totalReplaced} tokens replaced across ${Object.keys(fileGroups).length} files`)
    console.log('\n📋 Next steps:')
    console.log('1. Review the changes with `git diff`')
    console.log('2. Test your application')
    console.log('3. Commit the changes')
    console.log('4. Run `npm run ui:audit` to verify consistency')
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      migrations: this.migrations,
      tokenMappings: TOKEN_MIGRATIONS
    }

    const reportPath = path.join(__dirname, '../reports/design-token-migrations.json')
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📋 Migration report saved to: ${path.relative(process.cwd(), reportPath)}`)
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)
  const shouldMigrate = args.includes('--migrate') || args.includes('-m')
  
  const checker = new DesignTokenChecker()
  
  try {
    await checker.scanFiles()
    
    if (shouldMigrate) {
      await checker.migrate()
    } else {
      checker.generateReport()
      await checker.saveReport()
    }
    
  } catch (error) {
    console.error('❌ Design token check failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { DesignTokenChecker, TOKEN_MIGRATIONS }