const db = require('../db');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

/**
 * Data Retention Manager - Task 9 Implementation
 * Intelligent data lifecycle management for pricing and user data
 */
class DataRetentionManager {
    constructor() {
        this.config = {
            // Retention periods (in days)
            retentionPeriods: {
                pricing_data_raw: 2555,        // 7 years (regulatory compliance)
                pricing_data_normalized: 3650,  // 10 years (analytical value)
                pricing_aggregates: -1,          // Keep forever (small, high value)
                search_history: 365,             // 1 year (privacy compliance)
                user_sessions: 90,               // 3 months
                listing_success_tracking: 2190, // 6 years (business analytics)
                price_alerts: 180,              // 6 months after triggered
                data_collection_status: 365,    // 1 year of collection logs
                system_logs: 90                 // 3 months of system logs
            },

            // Archive settings
            archiveSettings: {
                enabled: process.env.ENABLE_ARCHIVING === 'true',
                archivePath: process.env.ARCHIVE_PATH || './data/archives',
                compressionLevel: 6,
                batchSize: 10000,
                maxConcurrentJobs: 3
            },

            // Cleanup scheduling
            schedules: {
                daily_cleanup: '0 2 * * *',     // 2 AM daily
                weekly_archive: '0 3 * * 0',    // 3 AM every Sunday
                monthly_audit: '0 1 1 * *'      // 1 AM first day of month
            },

            // Performance settings
            performance: {
                maxDeleteBatchSize: 5000,
                maxArchiveBatchSize: 10000,
                deletePauseMs: 100,
                archivePauseMs: 500
            }
        };

        this.activeJobs = new Map();
        this.stats = {
            recordsArchived: 0,
            recordsDeleted: 0,
            spaceSaved: 0,
            lastCleanup: null,
            lastArchive: null
        };

        // Track table sizes for monitoring
        this.tableSizes = new Map();

        console.log('🗄️ DataRetentionManager initialized');
    }

    /**
     * Initialize retention manager and start scheduled jobs
     */
    async initialize() {
        try {
            await this.validateConfiguration();
            await this.createArchiveDirectories();
            await this.scheduleJobs();
            await this.updateTableSizes();

            console.log('✅ Data retention manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize data retention manager:', error);
            throw error;
        }
    }

    /**
     * Schedule automated retention jobs
     */
    async scheduleJobs() {
        // Daily cleanup job
        cron.schedule(this.config.schedules.daily_cleanup, async () => {
            console.log('🧹 Starting daily cleanup job...');
            await this.runDailyCleanup();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Weekly archive job
        cron.schedule(this.config.schedules.weekly_archive, async () => {
            console.log('📦 Starting weekly archive job...');
            await this.runWeeklyArchive();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Monthly audit job
        cron.schedule(this.config.schedules.monthly_audit, async () => {
            console.log('📊 Starting monthly audit job...');
            await this.runMonthlyAudit();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('⏰ Retention jobs scheduled');
    }

    // ==========================================
    // DAILY CLEANUP OPERATIONS
    // ==========================================

    /**
     * Run daily cleanup operations
     */
    async runDailyCleanup() {
        const jobId = 'daily-cleanup-' + Date.now();
        this.activeJobs.set(jobId, { type: 'cleanup', startTime: new Date() });

        try {
            const results = {
                searchHistory: await this.cleanupSearchHistory(),
                userSessions: await this.cleanupUserSessions(),
                triggeredAlerts: await this.cleanupTriggeredAlerts(),
                expiredLocks: await this.cleanupExpiredLocks(),
                tempData: await this.cleanupTempData()
            };

            this.stats.lastCleanup = new Date();
            this.stats.recordsDeleted += Object.values(results).reduce((sum, count) => sum + count, 0);

            console.log('✅ Daily cleanup completed:', results);
            return results;

        } catch (error) {
            console.error('❌ Daily cleanup failed:', error);
            throw error;
        } finally {
            this.activeJobs.delete(jobId);
        }
    }

    /**
     * Cleanup old search history data
     */
    async cleanupSearchHistory() {
        const retentionDays = this.config.retentionPeriods.search_history;
        if (retentionDays === -1) return 0;

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        const query = `
            DELETE FROM search_history 
            WHERE created_at < $1
        `;

        const result = await db.query(query, [cutoffDate]);
        console.log(`🧹 Cleaned up ${result.rowCount} old search history records`);
        
        return result.rowCount;
    }

    /**
     * Cleanup expired user sessions
     */
    async cleanupUserSessions() {
        const retentionDays = this.config.retentionPeriods.user_sessions;
        if (retentionDays === -1) return 0;

        // Also cleanup from Redis cache
        const redisManager = require('../cache/RedisManager').getInstance();
        
        // Clean database sessions
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const query = `
            DELETE FROM user_sessions 
            WHERE created_at < $1 OR last_activity < $1
        `;

        const result = await db.query(query, [cutoffDate]);
        console.log(`🧹 Cleaned up ${result.rowCount} expired user sessions`);
        
        return result.rowCount;
    }

    /**
     * Cleanup triggered price alerts
     */
    async cleanupTriggeredAlerts() {
        const retentionDays = this.config.retentionPeriods.price_alerts;
        if (retentionDays === -1) return 0;

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        const query = `
            DELETE FROM price_alerts 
            WHERE is_triggered = true 
            AND triggered_at < $1
        `;

        const result = await db.query(query, [cutoffDate]);
        console.log(`🧹 Cleaned up ${result.rowCount} old triggered alerts`);
        
        return result.rowCount;
    }

    /**
     * Cleanup expired locks and temporary data
     */
    async cleanupExpiredLocks() {
        // This would clean up any temporary locks or cache entries
        // For now, return 0 as placeholder
        return 0;
    }

    /**
     * Cleanup temporary data and failed processing records
     */
    async cleanupTempData() {
        // Clean up failed data collection records older than 7 days
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const query = `
            DELETE FROM data_collection_status 
            WHERE status = 'failed' 
            AND created_at < $1
        `;

        const result = await db.query(query, [cutoffDate]);
        console.log(`🧹 Cleaned up ${result.rowCount} failed data collection records`);
        
        return result.rowCount;
    }

    // ==========================================
    // WEEKLY ARCHIVE OPERATIONS
    // ==========================================

    /**
     * Run weekly archive operations
     */
    async runWeeklyArchive() {
        if (!this.config.archiveSettings.enabled) {
            console.log('📦 Archiving disabled, skipping weekly archive');
            return;
        }

        const jobId = 'weekly-archive-' + Date.now();
        this.activeJobs.set(jobId, { type: 'archive', startTime: new Date() });

        try {
            const results = {
                rawPricingData: await this.archiveRawPricingData(),
                oldCollectionStatus: await this.archiveDataCollectionStatus(),
                systemLogs: await this.archiveSystemLogs()
            };

            this.stats.lastArchive = new Date();
            this.stats.recordsArchived += Object.values(results).reduce((sum, count) => sum + count, 0);

            console.log('✅ Weekly archive completed:', results);
            return results;

        } catch (error) {
            console.error('❌ Weekly archive failed:', error);
            throw error;
        } finally {
            this.activeJobs.delete(jobId);
        }
    }

    /**
     * Archive old raw pricing data
     */
    async archiveRawPricingData() {
        const retentionDays = this.config.retentionPeriods.pricing_data_raw;
        if (retentionDays === -1) return 0;

        // Archive data older than retention period but keep for a bit longer
        const archiveCutoff = new Date(Date.now() - (retentionDays - 365) * 24 * 60 * 60 * 1000);
        const deleteCutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        // First, archive data that's approaching deletion
        const archiveCount = await this.archiveTableData(
            'pricing_data_raw',
            archiveCutoff,
            deleteCutoff
        );

        // Then delete very old data
        const deleteQuery = `
            DELETE FROM pricing_data_raw 
            WHERE collected_at < $1
        `;
        const deleteResult = await db.query(deleteQuery, [deleteCutoff]);

        console.log(`📦 Archived ${archiveCount} raw pricing records, deleted ${deleteResult.rowCount}`);
        return archiveCount;
    }

    /**
     * Archive old data collection status records
     */
    async archiveDataCollectionStatus() {
        const retentionDays = this.config.retentionPeriods.data_collection_status;
        if (retentionDays === -1) return 0;

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        const archiveCount = await this.archiveTableData(
            'data_collection_status',
            cutoffDate,
            cutoffDate
        );

        // Delete after archiving
        const deleteQuery = `
            DELETE FROM data_collection_status 
            WHERE created_at < $1
        `;
        const deleteResult = await db.query(deleteQuery, [cutoffDate]);

        console.log(`📦 Archived ${archiveCount} data collection status records`);
        return archiveCount;
    }

    /**
     * Archive system logs
     */
    async archiveSystemLogs() {
        // Placeholder for system log archiving
        // Would integrate with logging system
        return 0;
    }

    /**
     * Generic table data archiving
     */
    async archiveTableData(tableName, startDate, endDate) {
        const timestamp = new Date().toISOString().split('T')[0];
        const archiveFileName = `${tableName}_${timestamp}.json`;
        const archivePath = path.join(this.config.archiveSettings.archivePath, archiveFileName);

        try {
            // Query data to archive
            const query = `
                SELECT * FROM ${tableName} 
                WHERE created_at >= $1 AND created_at < $2
                ORDER BY created_at
            `;
            
            const result = await db.query(query, [startDate, endDate]);
            
            if (result.rows.length === 0) {
                return 0;
            }

            // Create archive file
            const archiveData = {
                table: tableName,
                archiveDate: new Date().toISOString(),
                dateRange: { start: startDate, end: endDate },
                recordCount: result.rows.length,
                data: result.rows
            };

            // Write compressed archive file
            const zlib = require('zlib');
            const compressedData = zlib.gzipSync(JSON.stringify(archiveData));
            
            await fs.writeFile(`${archivePath}.gz`, compressedData);

            // Log archive creation
            await this.logArchiveOperation(tableName, archiveFileName, result.rows.length);

            return result.rows.length;

        } catch (error) {
            console.error(`❌ Failed to archive ${tableName}:`, error);
            return 0;
        }
    }

    // ==========================================
    // MONTHLY AUDIT OPERATIONS
    // ==========================================

    /**
     * Run monthly audit operations
     */
    async runMonthlyAudit() {
        const jobId = 'monthly-audit-' + Date.now();
        this.activeJobs.set(jobId, { type: 'audit', startTime: new Date() });

        try {
            await this.updateTableSizes();
            const report = await this.generateRetentionReport();
            await this.optimizeTableIndexes();
            await this.cleanupOrphanedRecords();

            console.log('✅ Monthly audit completed');
            return report;

        } catch (error) {
            console.error('❌ Monthly audit failed:', error);
            throw error;
        } finally {
            this.activeJobs.delete(jobId);
        }
    }

    /**
     * Update table size statistics
     */
    async updateTableSizes() {
        const tables = Object.keys(this.config.retentionPeriods);
        
        for (const table of tables) {
            try {
                const sizeQuery = `
                    SELECT 
                        pg_size_pretty(pg_total_relation_size('${table}')) as total_size,
                        pg_size_pretty(pg_relation_size('${table}')) as table_size,
                        (SELECT count(*) FROM ${table}) as row_count
                `;
                
                const result = await db.query(sizeQuery);
                if (result.rows.length > 0) {
                    this.tableSizes.set(table, result.rows[0]);
                }
            } catch (error) {
                console.warn(`⚠️ Could not get size for table ${table}:`, error.message);
            }
        }
    }

    /**
     * Generate comprehensive retention report
     */
    async generateRetentionReport() {
        const report = {
            timestamp: new Date().toISOString(),
            tableSizes: Object.fromEntries(this.tableSizes),
            retentionStatus: {},
            recommendations: [],
            stats: { ...this.stats }
        };

        // Analyze each table's retention status
        for (const [table, retentionDays] of Object.entries(this.config.retentionPeriods)) {
            if (retentionDays === -1) {
                report.retentionStatus[table] = { status: 'permanent', action: 'none' };
                continue;
            }

            try {
                const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
                const countQuery = `
                    SELECT count(*) as old_records 
                    FROM ${table} 
                    WHERE created_at < $1
                `;
                
                const result = await db.query(countQuery, [cutoffDate]);
                const oldRecords = parseInt(result.rows[0].old_records);

                report.retentionStatus[table] = {
                    retentionDays,
                    oldRecords,
                    status: oldRecords > 0 ? 'needs_cleanup' : 'compliant',
                    cutoffDate
                };

                if (oldRecords > 10000) {
                    report.recommendations.push(
                        `Consider immediate cleanup of ${table} (${oldRecords} old records)`
                    );
                }

            } catch (error) {
                report.retentionStatus[table] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Save report
        const reportPath = path.join(
            this.config.archiveSettings.archivePath,
            `retention_report_${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Retention report saved to ${reportPath}`);

        return report;
    }

    /**
     * Optimize table indexes for better performance
     */
    async optimizeTableIndexes() {
        const optimizationQueries = [
            'REINDEX INDEX CONCURRENTLY idx_pricing_raw_comic_date;',
            'REINDEX INDEX CONCURRENTLY idx_search_history_user_date;',
            'REINDEX INDEX CONCURRENTLY idx_pricing_normalized_comic_condition;',
            'VACUUM ANALYZE pricing_data_raw;',
            'VACUUM ANALYZE search_history;',
            'VACUUM ANALYZE pricing_data_normalized;'
        ];

        for (const query of optimizationQueries) {
            try {
                await db.query(query);
            } catch (error) {
                console.warn(`⚠️ Index optimization warning:`, error.message);
            }
        }

        console.log('🔧 Table indexes optimized');
    }

    /**
     * Clean up orphaned records
     */
    async cleanupOrphanedRecords() {
        const cleanupQueries = [
            // Remove pricing data for non-existent comics
            `DELETE FROM pricing_data_raw 
             WHERE comic_id NOT IN (SELECT id FROM comics)`,
            
            // Remove collections for non-existent users or comics
            `DELETE FROM collections 
             WHERE user_id NOT IN (SELECT id FROM users) 
             OR comic_id NOT IN (SELECT id FROM comics)`,
             
            // Remove wantlists for non-existent users or comics
            `DELETE FROM wantlists 
             WHERE user_id NOT IN (SELECT id FROM users) 
             OR comic_id NOT IN (SELECT id FROM comics)`
        ];

        let totalCleaned = 0;
        for (const query of cleanupQueries) {
            try {
                const result = await db.query(query);
                totalCleaned += result.rowCount;
            } catch (error) {
                console.warn(`⚠️ Orphan cleanup warning:`, error.message);
            }
        }

        console.log(`🧹 Cleaned up ${totalCleaned} orphaned records`);
        return totalCleaned;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Validate retention configuration
     */
    async validateConfiguration() {
        // Check if required directories exist
        if (this.config.archiveSettings.enabled) {
            try {
                await fs.access(this.config.archiveSettings.archivePath);
            } catch {
                await fs.mkdir(this.config.archiveSettings.archivePath, { recursive: true });
            }
        }

        // Validate retention periods
        for (const [table, days] of Object.entries(this.config.retentionPeriods)) {
            if (typeof days !== 'number' || (days !== -1 && days < 1)) {
                throw new Error(`Invalid retention period for ${table}: ${days}`);
            }
        }

        console.log('✅ Retention configuration validated');
    }

    /**
     * Create archive directory structure
     */
    async createArchiveDirectories() {
        if (!this.config.archiveSettings.enabled) return;

        const basePath = this.config.archiveSettings.archivePath;
        const subdirs = ['pricing', 'users', 'logs', 'reports'];

        for (const subdir of subdirs) {
            const dirPath = path.join(basePath, subdir);
            try {
                await fs.mkdir(dirPath, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }

        console.log('📁 Archive directories created');
    }

    /**
     * Log archive operation
     */
    async logArchiveOperation(tableName, fileName, recordCount) {
        const logEntry = {
            operation: 'archive',
            table: tableName,
            fileName,
            recordCount,
            timestamp: new Date().toISOString()
        };

        // Log to database
        try {
            await db.query(`
                INSERT INTO system_config (config_key, config_value, description)
                VALUES ($1, $2, $3)
            `, [
                `archive_log_${Date.now()}`,
                JSON.stringify(logEntry),
                `Archive operation for ${tableName}`
            ]);
        } catch (error) {
            console.warn('⚠️ Could not log archive operation:', error.message);
        }
    }

    /**
     * Get retention manager status
     */
    getStatus() {
        return {
            initialized: this.activeJobs.size >= 0,
            activeJobs: Array.from(this.activeJobs.entries()).map(([id, job]) => ({
                id,
                type: job.type,
                startTime: job.startTime,
                duration: Date.now() - job.startTime.getTime()
            })),
            stats: { ...this.stats },
            config: {
                archivingEnabled: this.config.archiveSettings.enabled,
                retentionPeriods: this.config.retentionPeriods
            },
            tableSizes: Object.fromEntries(this.tableSizes)
        };
    }

    /**
     * Manual retention operation trigger
     */
    async runManualRetention(operation, options = {}) {
        switch (operation) {
            case 'cleanup':
                return await this.runDailyCleanup();
            case 'archive':
                return await this.runWeeklyArchive();
            case 'audit':
                return await this.runMonthlyAudit();
            case 'table-specific':
                return await this.cleanupSpecificTable(options.table, options.days);
            default:
                throw new Error(`Unknown retention operation: ${operation}`);
        }
    }

    /**
     * Cleanup specific table manually
     */
    async cleanupSpecificTable(tableName, retentionDays) {
        if (!this.config.retentionPeriods[tableName]) {
            throw new Error(`Unknown table: ${tableName}`);
        }

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        const query = `
            DELETE FROM ${tableName} 
            WHERE created_at < $1
        `;

        const result = await db.query(query, [cutoffDate]);
        console.log(`🧹 Manual cleanup of ${tableName}: ${result.rowCount} records deleted`);
        
        return result.rowCount;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        // Wait for active jobs to complete (with timeout)
        const timeout = 30000; // 30 seconds
        const startTime = Date.now();

        while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (this.activeJobs.size > 0) {
            console.warn(`⚠️ Shutdown with ${this.activeJobs.size} active retention jobs`);
        }

        console.log('✅ Data retention manager shutdown complete');
    }
}

module.exports = DataRetentionManager; 