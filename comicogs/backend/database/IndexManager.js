const db = require('../db');
const cron = require('node-cron');

/**
 * Index Manager - Task 9 Implementation
 * Intelligent database index optimization and management
 */
class IndexManager {
    constructor() {
        this.config = {
            // Index optimization settings
            optimization: {
                autoOptimize: process.env.AUTO_OPTIMIZE_INDEXES === 'true',
                optimizationThreshold: 0.8,     // Reindex when fragmentation > 80%
                minRowsForIndex: 1000,          // Only create indexes for tables with 1000+ rows
                maxIndexesPerTable: 10,         // Maximum indexes per table
                analyzeThreshold: 10000         // Run analyze when table grows by 10k rows
            },

            // Performance monitoring
            monitoring: {
                slowQueryThresholdMs: 1000,     // Log queries slower than 1 second
                indexUsageThreshold: 0.1,       // Flag unused indexes (< 10% usage)
                monitoringInterval: 300000,     // 5 minutes
                metricsRetentionDays: 30
            },

            // Scheduling
            schedules: {
                optimization: '0 3 * * 0',      // 3 AM every Sunday
                analysis: '0 2 * * *',          // 2 AM daily
                monitoring: '*/5 * * * *'       // Every 5 minutes
            }
        };

        // Index definitions for automatic management
        this.indexDefinitions = {
            // Core pricing indexes
            pricing_data_raw: [
                {
                    name: 'idx_pricing_raw_comic_date_perf',
                    type: 'btree',
                    columns: ['comic_id', 'sale_date DESC'],
                    unique: false,
                    purpose: 'Fast pricing lookups by comic and date',
                    priority: 'high'
                },
                {
                    name: 'idx_pricing_raw_marketplace_collected',
                    type: 'btree', 
                    columns: ['source_marketplace', 'collected_at DESC'],
                    unique: false,
                    purpose: 'Data collection monitoring',
                    priority: 'medium'
                },
                {
                    name: 'idx_pricing_raw_processing_pending',
                    type: 'btree',
                    columns: ['processing_status'],
                    condition: "WHERE processing_status = 'pending'",
                    purpose: 'Find unprocessed pricing data',
                    priority: 'high'
                },
                {
                    name: 'idx_pricing_raw_price_condition',
                    type: 'btree',
                    columns: ['comic_id', 'condition', 'price'],
                    unique: false,
                    purpose: 'Price analysis by condition',
                    priority: 'medium'
                }
            ],

            pricing_data_normalized: [
                {
                    name: 'idx_pricing_norm_comic_cond_date',
                    type: 'btree',
                    columns: ['comic_id', 'condition_normalized', 'sale_date DESC'],
                    unique: false,
                    purpose: 'Primary pricing queries',
                    priority: 'critical'
                },
                {
                    name: 'idx_pricing_norm_date_price',
                    type: 'btree',
                    columns: ['sale_date DESC', 'price_normalized'],
                    unique: false,
                    purpose: 'Market trending analysis',
                    priority: 'high'
                },
                {
                    name: 'idx_pricing_norm_quality_score',
                    type: 'btree',
                    columns: ['data_quality_score DESC'],
                    condition: "WHERE data_quality_score > 0.8",
                    purpose: 'High-quality data queries',
                    priority: 'medium'
                }
            ],

            pricing_aggregates: [
                {
                    name: 'idx_pricing_agg_current_lookup',
                    type: 'btree',
                    columns: ['comic_id', 'condition_tier'],
                    unique: true,
                    condition: "WHERE is_current = TRUE",
                    purpose: 'Current market price lookups',
                    priority: 'critical'
                },
                {
                    name: 'idx_pricing_agg_market_price_trending',
                    type: 'btree',
                    columns: ['current_market_price DESC'],
                    condition: "WHERE is_current = TRUE",
                    purpose: 'Market price rankings',
                    priority: 'high'
                }
            ],

            // User and collection indexes
            collections: [
                {
                    name: 'idx_collections_user_comic_unique',
                    type: 'btree',
                    columns: ['user_id', 'comic_id'],
                    unique: true,
                    purpose: 'User collection lookups',
                    priority: 'critical'
                },
                {
                    name: 'idx_collections_user_public',
                    type: 'btree',
                    columns: ['user_id'],
                    condition: "WHERE is_public = TRUE",
                    purpose: 'Public collection browsing',
                    priority: 'medium'
                },
                {
                    name: 'idx_collections_value_tracking',
                    type: 'btree',
                    columns: ['last_value_update', 'current_value DESC'],
                    unique: false,
                    purpose: 'Collection value analytics',
                    priority: 'low'
                }
            ],

            wantlists: [
                {
                    name: 'idx_wantlists_user_active',
                    type: 'btree',
                    columns: ['user_id'],
                    condition: "WHERE is_active = TRUE",
                    purpose: 'Active user wantlists',
                    priority: 'high'
                },
                {
                    name: 'idx_wantlists_comic_price_monitoring',
                    type: 'btree',
                    columns: ['comic_id', 'max_price'],
                    unique: false,
                    purpose: 'Price monitoring alerts',
                    priority: 'medium'
                }
            ],

            // Comics and catalog indexes
            comics: [
                {
                    name: 'idx_comics_title_fulltext',
                    type: 'gin',
                    columns: ['title'],
                    expression: 'gin_trgm_ops',
                    purpose: 'Full-text comic search',
                    priority: 'high'
                },
                {
                    name: 'idx_comics_publisher_series',
                    type: 'btree',
                    columns: ['publisher_id', 'series_id'],
                    unique: false,
                    purpose: 'Catalog browsing',
                    priority: 'medium'
                },
                {
                    name: 'idx_comics_publication_date',
                    type: 'btree',
                    columns: ['publication_date'],
                    unique: false,
                    purpose: 'Release date queries',
                    priority: 'low'
                },
                {
                    name: 'idx_comics_key_issues',
                    type: 'btree',
                    columns: ['is_key_issue'],
                    condition: "WHERE is_key_issue = TRUE",
                    purpose: 'Key issue identification',
                    priority: 'medium'
                }
            ],

            // Marketplace indexes
            marketplace_listings: [
                {
                    name: 'idx_marketplace_active_listings',
                    type: 'btree',
                    columns: ['status', 'created_at DESC'],
                    condition: "WHERE status = 'active'",
                    purpose: 'Active marketplace browsing',
                    priority: 'critical'
                },
                {
                    name: 'idx_marketplace_user_listings',
                    type: 'btree',
                    columns: ['user_id', 'status'],
                    unique: false,
                    purpose: 'User marketplace management',
                    priority: 'high'
                },
                {
                    name: 'idx_marketplace_comic_price',
                    type: 'btree',
                    columns: ['comic_id', 'price'],
                    condition: "WHERE status = 'active'",
                    purpose: 'Comic price comparisons',
                    priority: 'medium'
                }
            ],

            // Analytics and tracking indexes
            search_history: [
                {
                    name: 'idx_search_user_date',
                    type: 'btree',
                    columns: ['user_id', 'created_at DESC'],
                    unique: false,
                    purpose: 'User search analytics',
                    priority: 'medium'
                },
                {
                    name: 'idx_search_query_fulltext',
                    type: 'gin',
                    columns: ['search_query'],
                    expression: 'gin_trgm_ops',
                    purpose: 'Search query analysis',
                    priority: 'low'
                }
            ],

            listing_success_tracking: [
                {
                    name: 'idx_listing_success_comic_date',
                    type: 'btree',
                    columns: ['comic_id', 'created_at DESC'],
                    unique: false,
                    purpose: 'Comic listing performance',
                    priority: 'medium'
                },
                {
                    name: 'idx_listing_success_performance',
                    type: 'btree',
                    columns: ['price_accuracy DESC', 'recommendation_success DESC'],
                    unique: false,
                    purpose: 'AI performance analysis',
                    priority: 'high'
                }
            ]
        };

        this.metrics = {
            indexesCreated: 0,
            indexesDropped: 0,
            optimizationsRun: 0,
            queriesAnalyzed: 0,
            lastOptimization: null,
            lastAnalysis: null
        };

        this.activeOptimizations = new Map();
        this.performanceHistory = [];

        console.log('📊 IndexManager initialized');
    }

    /**
     * Initialize index manager
     */
    async initialize() {
        try {
            await this.validateIndexDefinitions();
            await this.createMissingIndexes();
            await this.scheduleOptimizations();
            await this.startPerformanceMonitoring();

            console.log('✅ Index manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize index manager:', error);
            throw error;
        }
    }

    /**
     * Schedule automatic optimizations
     */
    async scheduleOptimizations() {
        if (!this.config.optimization.autoOptimize) {
            console.log('📊 Auto-optimization disabled');
            return;
        }

        // Weekly index optimization
        cron.schedule(this.config.schedules.optimization, async () => {
            console.log('🔧 Starting weekly index optimization...');
            await this.optimizeAllIndexes();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Daily table analysis
        cron.schedule(this.config.schedules.analysis, async () => {
            console.log('📈 Starting daily table analysis...');
            await this.analyzeTableStatistics();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('⏰ Index optimization scheduled');
    }

    /**
     * Start performance monitoring
     */
    async startPerformanceMonitoring() {
        // Monitor query performance every 5 minutes
        cron.schedule(this.config.schedules.monitoring, async () => {
            await this.monitorQueryPerformance();
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('📊 Performance monitoring started');
    }

    // ==========================================
    // INDEX CREATION AND MANAGEMENT
    // ==========================================

    /**
     * Create all missing indexes
     */
    async createMissingIndexes() {
        console.log('🔨 Creating missing indexes...');
        
        for (const [tableName, indexes] of Object.entries(this.indexDefinitions)) {
            await this.createTableIndexes(tableName, indexes);
        }

        console.log('✅ Missing indexes created');
    }

    /**
     * Create indexes for a specific table
     */
    async createTableIndexes(tableName, indexes) {
        for (const indexDef of indexes) {
            try {
                const exists = await this.indexExists(indexDef.name);
                if (!exists) {
                    await this.createIndex(tableName, indexDef);
                    this.metrics.indexesCreated++;
                    console.log(`✅ Created index: ${indexDef.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create index ${indexDef.name}:`, error.message);
            }
        }
    }

    /**
     * Create a single index
     */
    async createIndex(tableName, indexDef) {
        let sql = `CREATE`;
        
        // Add index type
        if (indexDef.unique) {
            sql += ` UNIQUE`;
        }
        
        sql += ` INDEX`;
        
        // Concurrent creation for production
        if (process.env.NODE_ENV === 'production') {
            sql += ` CONCURRENTLY`;
        }
        
        sql += ` ${indexDef.name} ON ${tableName}`;
        
        // Add index method
        if (indexDef.type) {
            sql += ` USING ${indexDef.type}`;
        }
        
        // Add columns
        if (indexDef.expression) {
            sql += ` (${indexDef.columns[0]} ${indexDef.expression})`;
        } else {
            sql += ` (${indexDef.columns.join(', ')})`;
        }
        
        // Add condition
        if (indexDef.condition) {
            sql += ` ${indexDef.condition}`;
        }

        await db.query(sql);

        // Add comment for documentation
        if (indexDef.purpose) {
            await db.query(`
                COMMENT ON INDEX ${indexDef.name} IS '${indexDef.purpose}'
            `);
        }
    }

    /**
     * Check if index exists
     */
    async indexExists(indexName) {
        const result = await db.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname = $1
        `, [indexName]);
        
        return result.rows.length > 0;
    }

    /**
     * Drop unused indexes
     */
    async dropUnusedIndexes(dryRun = true) {
        const unusedIndexes = await this.findUnusedIndexes();
        const results = [];

        for (const index of unusedIndexes) {
            if (dryRun) {
                results.push({
                    action: 'would_drop',
                    index: index.indexname,
                    table: index.tablename,
                    reason: 'unused',
                    size: index.size
                });
            } else {
                try {
                    await db.query(`DROP INDEX CONCURRENTLY ${index.indexname}`);
                    this.metrics.indexesDropped++;
                    results.push({
                        action: 'dropped',
                        index: index.indexname,
                        table: index.tablename,
                        size: index.size
                    });
                    console.log(`🗑️ Dropped unused index: ${index.indexname}`);
                } catch (error) {
                    results.push({
                        action: 'error',
                        index: index.indexname,
                        error: error.message
                    });
                }
            }
        }

        return results;
    }

    /**
     * Find unused indexes
     */
    async findUnusedIndexes() {
        const query = `
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_scan,
                pg_size_pretty(pg_relation_size(indexrelid)) as size,
                pg_relation_size(indexrelid) as size_bytes
            FROM pg_stat_user_indexes
            WHERE idx_scan < $1
            AND schemaname = 'public'
            AND indexname NOT LIKE '%_pkey'
            ORDER BY pg_relation_size(indexrelid) DESC
        `;

        const result = await db.query(query, [
            this.config.monitoring.indexUsageThreshold * 1000
        ]);

        return result.rows;
    }

    // ==========================================
    // INDEX OPTIMIZATION
    // ==========================================

    /**
     * Optimize all indexes
     */
    async optimizeAllIndexes() {
        const optimizationId = `optimization-${Date.now()}`;
        this.activeOptimizations.set(optimizationId, {
            startTime: new Date(),
            type: 'full'
        });

        try {
            console.log('🔧 Starting comprehensive index optimization...');

            // Get index fragmentation info
            const fragmentedIndexes = await this.getFragmentedIndexes();
            
            // Reindex fragmented indexes
            for (const index of fragmentedIndexes) {
                await this.reindexIndex(index.indexname);
            }

            // Update table statistics
            await this.analyzeTableStatistics();

            // Check for missing indexes based on query patterns
            await this.suggestMissingIndexes();

            this.metrics.optimizationsRun++;
            this.metrics.lastOptimization = new Date();

            console.log('✅ Index optimization completed');

        } catch (error) {
            console.error('❌ Index optimization failed:', error);
            throw error;
        } finally {
            this.activeOptimizations.delete(optimizationId);
        }
    }

    /**
     * Get fragmented indexes
     */
    async getFragmentedIndexes() {
        // PostgreSQL doesn't have built-in fragmentation metrics like SQL Server
        // We'll use index size vs table size as a proxy
        const query = `
            SELECT 
                i.indexname,
                i.tablename,
                pg_size_pretty(pg_relation_size(c.oid)) as index_size,
                pg_relation_size(c.oid) as index_size_bytes,
                pg_size_pretty(pg_relation_size(t.oid)) as table_size,
                pg_relation_size(t.oid) as table_size_bytes,
                (pg_relation_size(c.oid)::float / pg_relation_size(t.oid)::float) as size_ratio
            FROM pg_indexes i
            JOIN pg_class c ON c.relname = i.indexname
            JOIN pg_class t ON t.relname = i.tablename
            WHERE i.schemaname = 'public'
            AND pg_relation_size(t.oid) > 10485760  -- Tables larger than 10MB
            ORDER BY size_ratio DESC
        `;

        const result = await db.query(query);
        
        // Consider indexes that are disproportionately large compared to table
        return result.rows.filter(row => row.size_ratio > this.config.optimization.optimizationThreshold);
    }

    /**
     * Reindex a specific index
     */
    async reindexIndex(indexName) {
        try {
            console.log(`🔄 Reindexing: ${indexName}`);
            
            // Use REINDEX CONCURRENTLY in production
            if (process.env.NODE_ENV === 'production') {
                await db.query(`REINDEX INDEX CONCURRENTLY ${indexName}`);
            } else {
                await db.query(`REINDEX INDEX ${indexName}`);
            }
            
            console.log(`✅ Reindexed: ${indexName}`);
        } catch (error) {
            console.error(`❌ Failed to reindex ${indexName}:`, error.message);
        }
    }

    /**
     * Analyze table statistics
     */
    async analyzeTableStatistics() {
        const tables = Object.keys(this.indexDefinitions);
        
        for (const table of tables) {
            try {
                await db.query(`ANALYZE ${table}`);
                console.log(`📊 Analyzed table: ${table}`);
            } catch (error) {
                console.error(`❌ Failed to analyze ${table}:`, error.message);
            }
        }

        this.metrics.lastAnalysis = new Date();
    }

    /**
     * Suggest missing indexes based on query patterns
     */
    async suggestMissingIndexes() {
        // Analyze slow query log and pg_stat_statements to suggest indexes
        const slowQueries = await this.getSlowQueries();
        const suggestions = [];

        for (const query of slowQueries) {
            const suggestion = await this.analyzeQueryForIndexSuggestion(query);
            if (suggestion) {
                suggestions.push(suggestion);
            }
        }

        if (suggestions.length > 0) {
            console.log(`💡 Index suggestions: ${suggestions.length} recommendations`);
            // Log suggestions for review
            for (const suggestion of suggestions) {
                console.log(`   ${suggestion.table}: ${suggestion.columns.join(', ')}`);
            }
        }

        return suggestions;
    }

    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================

    /**
     * Monitor query performance
     */
    async monitorQueryPerformance() {
        try {
            const slowQueries = await this.getSlowQueries();
            const indexUsage = await this.getIndexUsageStats();
            
            // Store performance snapshot
            const snapshot = {
                timestamp: new Date(),
                slowQueries: slowQueries.length,
                indexUsage: indexUsage,
                activeConnections: await this.getActiveConnections()
            };

            this.performanceHistory.push(snapshot);
            
            // Keep only last 24 hours of data
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.performanceHistory = this.performanceHistory.filter(
                item => item.timestamp > cutoff
            );

            this.metrics.queriesAnalyzed += slowQueries.length;

        } catch (error) {
            console.error('❌ Performance monitoring error:', error);
        }
    }

    /**
     * Get slow queries from pg_stat_statements
     */
    async getSlowQueries() {
        try {
            const result = await db.query(`
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows,
                    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
                FROM pg_stat_statements
                WHERE mean_time > $1
                ORDER BY mean_time DESC
                LIMIT 20
            `, [this.config.monitoring.slowQueryThresholdMs]);

            return result.rows;
        } catch (error) {
            // pg_stat_statements extension might not be installed
            return [];
        }
    }

    /**
     * Get index usage statistics
     */
    async getIndexUsageStats() {
        const result = await db.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY idx_scan DESC
        `);

        return result.rows;
    }

    /**
     * Get active database connections
     */
    async getActiveConnections() {
        const result = await db.query(`
            SELECT count(*) as active_connections
            FROM pg_stat_activity
            WHERE state = 'active'
        `);

        return parseInt(result.rows[0].active_connections);
    }

    // ==========================================
    // ANALYSIS AND REPORTING
    // ==========================================

    /**
     * Generate index performance report
     */
    async generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            summary: {
                totalIndexes: await this.getTotalIndexCount(),
                indexSize: await this.getTotalIndexSize(),
                metrics: { ...this.metrics }
            },
            indexUsage: await this.getIndexUsageStats(),
            slowQueries: await this.getSlowQueries(),
            recommendations: await this.getOptimizationRecommendations(),
            performance: this.getPerformanceTrend()
        };

        return report;
    }

    /**
     * Get optimization recommendations
     */
    async getOptimizationRecommendations() {
        const recommendations = [];

        // Check for unused indexes
        const unusedIndexes = await this.findUnusedIndexes();
        if (unusedIndexes.length > 0) {
            recommendations.push({
                type: 'drop_unused',
                priority: 'medium',
                description: `${unusedIndexes.length} unused indexes found`,
                action: 'Consider dropping unused indexes to save space',
                indexes: unusedIndexes.map(idx => idx.indexname)
            });
        }

        // Check for missing critical indexes
        const missingCritical = await this.checkCriticalIndexes();
        if (missingCritical.length > 0) {
            recommendations.push({
                type: 'missing_critical',
                priority: 'high',
                description: `${missingCritical.length} critical indexes missing`,
                action: 'Create missing critical indexes immediately',
                indexes: missingCritical
            });
        }

        // Check for fragmented indexes
        const fragmentedIndexes = await this.getFragmentedIndexes();
        if (fragmentedIndexes.length > 0) {
            recommendations.push({
                type: 'fragmented',
                priority: 'low',
                description: `${fragmentedIndexes.length} potentially fragmented indexes`,
                action: 'Consider reindexing during maintenance window',
                indexes: fragmentedIndexes.map(idx => idx.indexname)
            });
        }

        return recommendations;
    }

    /**
     * Check for missing critical indexes
     */
    async checkCriticalIndexes() {
        const missing = [];

        for (const [tableName, indexes] of Object.entries(this.indexDefinitions)) {
            const criticalIndexes = indexes.filter(idx => idx.priority === 'critical');
            
            for (const indexDef of criticalIndexes) {
                const exists = await this.indexExists(indexDef.name);
                if (!exists) {
                    missing.push({
                        table: tableName,
                        index: indexDef.name,
                        purpose: indexDef.purpose
                    });
                }
            }
        }

        return missing;
    }

    /**
     * Get performance trend analysis
     */
    getPerformanceTrend() {
        if (this.performanceHistory.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const recent = this.performanceHistory.slice(-12); // Last hour (5min intervals)
        const avgSlowQueries = recent.reduce((sum, item) => sum + item.slowQueries, 0) / recent.length;
        const avgConnections = recent.reduce((sum, item) => sum + item.activeConnections, 0) / recent.length;

        return {
            trend: avgSlowQueries > 10 ? 'degrading' : 'stable',
            avgSlowQueries,
            avgConnections,
            dataPoints: recent.length
        };
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Get total index count
     */
    async getTotalIndexCount() {
        const result = await db.query(`
            SELECT count(*) as total_indexes
            FROM pg_indexes
            WHERE schemaname = 'public'
        `);

        return parseInt(result.rows[0].total_indexes);
    }

    /**
     * Get total index size
     */
    async getTotalIndexSize() {
        const result = await db.query(`
            SELECT pg_size_pretty(sum(pg_relation_size(indexrelid))) as total_size
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
        `);

        return result.rows[0].total_size;
    }

    /**
     * Validate index definitions
     */
    async validateIndexDefinitions() {
        for (const [tableName, indexes] of Object.entries(this.indexDefinitions)) {
            // Check if table exists
            const tableExists = await this.tableExists(tableName);
            if (!tableExists) {
                console.warn(`⚠️ Table ${tableName} does not exist, skipping indexes`);
                continue;
            }

            // Validate each index definition
            for (const indexDef of indexes) {
                if (!indexDef.name || !indexDef.columns) {
                    throw new Error(`Invalid index definition for table ${tableName}`);
                }
            }
        }

        console.log('✅ Index definitions validated');
    }

    /**
     * Check if table exists
     */
    async tableExists(tableName) {
        const result = await db.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE tablename = $1 AND schemaname = 'public'
        `, [tableName]);

        return result.rows.length > 0;
    }

    /**
     * Analyze query for index suggestion
     */
    async analyzeQueryForIndexSuggestion(query) {
        // This would implement query plan analysis to suggest indexes
        // For now, return null as placeholder
        return null;
    }

    /**
     * Get index manager status
     */
    getStatus() {
        return {
            initialized: true,
            autoOptimize: this.config.optimization.autoOptimize,
            activeOptimizations: Array.from(this.activeOptimizations.entries()).map(([id, opt]) => ({
                id,
                type: opt.type,
                startTime: opt.startTime,
                duration: Date.now() - opt.startTime.getTime()
            })),
            metrics: { ...this.metrics },
            performance: this.getPerformanceTrend(),
            lastMonitoring: this.performanceHistory.length > 0 
                ? this.performanceHistory[this.performanceHistory.length - 1].timestamp 
                : null
        };
    }

    /**
     * Manual operations
     */
    async runManualOptimization(operation, options = {}) {
        switch (operation) {
            case 'analyze':
                return await this.analyzeTableStatistics();
            case 'optimize':
                return await this.optimizeAllIndexes();
            case 'reindex':
                if (!options.indexName) throw new Error('Index name required');
                return await this.reindexIndex(options.indexName);
            case 'drop_unused':
                return await this.dropUnusedIndexes(options.dryRun !== false);
            case 'report':
                return await this.generatePerformanceReport();
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }
}

module.exports = IndexManager; 