#!/usr/bin/env node

/**
 * Database Optimization Script
 * 
 * Performs database maintenance tasks including:
 * - Index analysis and optimization
 * - Table statistics updates
 * - Performance monitoring
 * - Automated cleanup tasks
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

class DatabaseOptimizer {
  constructor() {
    this.stats = {
      indexesAnalyzed: 0,
      slowQueries: 0,
      cleanupTasks: 0,
      optimizationsApplied: 0
    };
  }

  async optimizeAll() {
    console.log('🚀 Starting database optimization...\n');

    await this.analyzeTableStats();
    await this.optimizeIndexes();
    await this.cleanupExpiredData();
    await this.analyzeSlowQueries();
    await this.updateTableStatistics();
    await this.performMaintenance();

    this.printResults();
  }

  async analyzeTableStats() {
    console.log('📊 Analyzing table statistics...');

    try {
      // Get table sizes and row counts
      const tableStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `;

      console.log(`  📈 Analyzed statistics for ${tableStats.length} table columns`);

      // Check for tables with outdated statistics
      const staleStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          last_autoanalyze,
          n_tup_ins,
          n_tup_upd,
          n_tup_del
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
          AND (last_autoanalyze IS NULL OR last_autoanalyze < NOW() - INTERVAL '7 days')
          AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000
      `;

      if (staleStats.length > 0) {
        console.log(`  ⚠️  Found ${staleStats.length} tables with stale statistics`);
        for (const table of staleStats) {
          console.log(`    - ${table.tablename}: ${table.n_tup_ins + table.n_tup_upd + table.n_tup_del} changes since last analyze`);
        }
      } else {
        console.log('  ✅ All table statistics are up to date');
      }

    } catch (error) {
      console.error('  ❌ Error analyzing table stats:', error.message);
    }
  }

  async optimizeIndexes() {
    console.log('🔍 Analyzing index usage...');

    try {
      // Find unused indexes
      const unusedIndexes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
          AND idx_tup_read = 0 
          AND idx_tup_fetch = 0
          AND indexname NOT LIKE '%_pkey'
      `;

      if (unusedIndexes.length > 0) {
        console.log(`  ⚠️  Found ${unusedIndexes.length} potentially unused indexes:`);
        for (const index of unusedIndexes) {
          console.log(`    - ${index.tablename}.${index.indexname}`);
        }
      } else {
        console.log('  ✅ All indexes are being used');
      }

      // Find duplicate indexes
      const duplicateIndexes = await prisma.$queryRaw`
        SELECT 
          t1.tablename,
          t1.indexname as index1,
          t2.indexname as index2,
          t1.indexdef
        FROM pg_indexes t1, pg_indexes t2
        WHERE t1.schemaname = 'public' 
          AND t2.schemaname = 'public'
          AND t1.tablename = t2.tablename
          AND t1.indexname < t2.indexname
          AND t1.indexdef = t2.indexdef
      `;

      if (duplicateIndexes.length > 0) {
        console.log(`  ⚠️  Found ${duplicateIndexes.length} duplicate indexes:`);
        for (const dup of duplicateIndexes) {
          console.log(`    - ${dup.tablename}: ${dup.index1} == ${dup.index2}`);
        }
      } else {
        console.log('  ✅ No duplicate indexes found');
      }

      this.stats.indexesAnalyzed = unusedIndexes.length + duplicateIndexes.length;

    } catch (error) {
      console.error('  ❌ Error analyzing indexes:', error.message);
    }
  }

  async cleanupExpiredData() {
    console.log('🧹 Cleaning up expired data...');

    try {
      // Clean up expired user sessions
      const expiredSessions = await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        }
      });

      if (expiredSessions.count > 0) {
        console.log(`  🗑️  Cleaned up ${expiredSessions.count} expired sessions`);
        this.stats.cleanupTasks++;
      }

      // Update expired listings
      const expiredListings = await prisma.listing.updateMany({
        where: {
          status: 'active',
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: 'hidden',
          updatedAt: new Date()
        }
      });

      if (expiredListings.count > 0) {
        console.log(`  📋 Updated ${expiredListings.count} expired listings to hidden`);
        this.stats.cleanupTasks++;
      }

      // Clean up old audit logs (keep last 90 days)
      const oldAuditLogs = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
          }
        }
      });

      if (oldAuditLogs.count > 0) {
        console.log(`  📜 Cleaned up ${oldAuditLogs.count} old audit logs`);
        this.stats.cleanupTasks++;
      }

      // Clean up processed webhook events (keep last 30 days)
      const oldWebhooks = await prisma.webhookEvent.deleteMany({
        where: {
          processed: true,
          processedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      });

      if (oldWebhooks.count > 0) {
        console.log(`  🔗 Cleaned up ${oldWebhooks.count} old webhook events`);
        this.stats.cleanupTasks++;
      }

      if (this.stats.cleanupTasks === 0) {
        console.log('  ✅ No cleanup required - database is clean');
      }

    } catch (error) {
      console.error('  ❌ Error during cleanup:', error.message);
    }
  }

  async analyzeSlowQueries() {
    console.log('🐌 Analyzing slow queries...');

    try {
      // Check for slow queries (requires pg_stat_statements extension)
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 1000  -- Queries taking more than 1 second on average
        ORDER BY mean_time DESC
        LIMIT 10
      `.catch(() => {
        // pg_stat_statements extension might not be available
        console.log('  ℹ️  pg_stat_statements extension not available for query analysis');
        return [];
      });

      if (slowQueries.length > 0) {
        console.log(`  ⚠️  Found ${slowQueries.length} slow queries:`);
        for (const query of slowQueries) {
          console.log(`    - Average time: ${Math.round(query.mean_time)}ms, Calls: ${query.calls}`);
          console.log(`      Query: ${query.query.substring(0, 100)}...`);
        }
        this.stats.slowQueries = slowQueries.length;
      } else {
        console.log('  ✅ No significantly slow queries found');
      }

    } catch (error) {
      console.log('  ℹ️  Query analysis not available:', error.message);
    }
  }

  async updateTableStatistics() {
    console.log('📈 Updating table statistics...');

    try {
      // Update table statistics for all tables
      await prisma.$executeRaw`ANALYZE`;
      console.log('  ✅ Updated statistics for all tables');
      this.stats.optimizationsApplied++;

    } catch (error) {
      console.error('  ❌ Error updating statistics:', error.message);
    }
  }

  async performMaintenance() {
    console.log('🔧 Performing maintenance tasks...');

    try {
      // Get table sizes before maintenance
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      console.log('  📊 Current table sizes:');
      for (const table of tableSizes.slice(0, 5)) {
        console.log(`    - ${table.tablename}: ${table.size}`);
      }

      // Vacuum analyze for top tables
      const largeTables = tableSizes.slice(0, 3);
      for (const table of largeTables) {
        try {
          await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table.tablename}`);
          console.log(`  🧽 Vacuumed and analyzed ${table.tablename}`);
          this.stats.optimizationsApplied++;
        } catch (error) {
          console.log(`  ⚠️  Could not vacuum ${table.tablename}: ${error.message}`);
        }
      }

      // Reindex if needed (only for small tables to avoid long locks)
      const smallTables = tableSizes.filter(t => t.bytes < 100 * 1024 * 1024); // < 100MB
      if (smallTables.length > 0) {
        console.log(`  🔄 Reindexing ${smallTables.length} small tables...`);
        for (const table of smallTables) {
          try {
            await prisma.$executeRawUnsafe(`REINDEX TABLE ${table.tablename}`);
          } catch (error) {
            // Continue if reindex fails
            console.log(`    ⚠️  Could not reindex ${table.tablename}`);
          }
        }
        this.stats.optimizationsApplied++;
      }

    } catch (error) {
      console.error('  ❌ Error during maintenance:', error.message);
    }
  }

  async generateOptimizationReport() {
    console.log('📋 Generating optimization recommendations...');

    const recommendations = [];

    try {
      // Check for tables without primary keys
      const tablesWithoutPK = await prisma.$queryRaw`
        SELECT tablename
        FROM pg_tables t
        WHERE schemaname = 'public'
          AND NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            WHERE c.conrelid = (t.schemaname||'.'||t.tablename)::regclass
              AND c.contype = 'p'
          )
      `;

      if (tablesWithoutPK.length > 0) {
        recommendations.push(`Add primary keys to ${tablesWithoutPK.length} tables`);
      }

      // Check for columns that might benefit from indexes
      const heavilyQueriedColumns = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          most_common_vals
        FROM pg_stats
        WHERE schemaname = 'public'
          AND n_distinct > 100
          AND attname NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY n_distinct DESC
        LIMIT 5
      `;

      if (heavilyQueriedColumns.length > 0) {
        recommendations.push(`Consider indexing ${heavilyQueriedColumns.length} high-cardinality columns`);
      }

      // Check for large tables that might benefit from partitioning
      const largeTables = await prisma.$queryRaw`
        SELECT 
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as total_ops
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000000
        ORDER BY total_ops DESC
      `;

      if (largeTables.length > 0) {
        recommendations.push(`Consider partitioning ${largeTables.length} high-activity tables`);
      }

      if (recommendations.length > 0) {
        console.log('  💡 Optimization recommendations:');
        recommendations.forEach((rec, index) => {
          console.log(`    ${index + 1}. ${rec}`);
        });
      } else {
        console.log('  ✅ No additional optimizations recommended');
      }

    } catch (error) {
      console.error('  ❌ Error generating recommendations:', error.message);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ DATABASE OPTIMIZATION RESULTS');
    console.log('='.repeat(60));
    console.log(`🔍 Indexes Analyzed: ${this.stats.indexesAnalyzed}`);
    console.log(`🐌 Slow Queries Found: ${this.stats.slowQueries}`);
    console.log(`🧹 Cleanup Tasks Completed: ${this.stats.cleanupTasks}`);
    console.log(`🚀 Optimizations Applied: ${this.stats.optimizationsApplied}`);
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Monitor query performance after optimizations');
    console.log('  2. Schedule regular maintenance (weekly VACUUM ANALYZE)');
    console.log('  3. Consider connection pooling for high-traffic applications');
    console.log('  4. Set up monitoring alerts for slow queries');
    
    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  try {
    const optimizer = new DatabaseOptimizer();
    await optimizer.optimizeAll();
    await optimizer.generateOptimizationReport();
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseOptimizer };