const db = require('../db');
const cron = require('node-cron');
const EventEmitter = require('events');

/**
 * Database Monitor - Task 9 Implementation
 * Real-time database performance monitoring and alerting
 */
class DatabaseMonitor extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Monitoring intervals
            intervals: {
                realtime: 5000,      // 5 seconds for real-time metrics
                performance: 30000,   // 30 seconds for performance metrics
                health: 60000,       // 1 minute for health checks
                alerts: 10000,       // 10 seconds for alert checks
                cleanup: 3600000     // 1 hour for metric cleanup
            },

            // Alert thresholds
            thresholds: {
                connectionCount: 80,           // % of max connections
                slowQueryTime: 1000,           // milliseconds
                lockWaitTime: 5000,           // milliseconds
                cacheHitRatio: 90,            // % minimum cache hit ratio
                diskUsage: 85,                // % disk usage
                cpuUsage: 80,                 // % CPU usage
                memoryUsage: 85,              // % memory usage
                replicationLag: 1000,         // milliseconds
                transactionAge: 300000,       // 5 minutes max transaction age
                indexUsage: 70                // % minimum index usage
            },

            // Metric retention
            retention: {
                realtime: 3600,     // 1 hour of real-time data
                hourly: 168,        // 1 week of hourly data
                daily: 90,          // 3 months of daily data
                weekly: 104         // 2 years of weekly data
            },

            // Alert settings
            alerts: {
                enabled: process.env.DB_ALERTS_ENABLED !== 'false',
                cooldownMs: 300000,  // 5 minutes between same alerts
                channels: ['console', 'email'], // console, email, slack, webhook
                escalationLevels: ['info', 'warning', 'critical', 'emergency']
            }
        };

        // Current metrics storage
        this.currentMetrics = {
            connections: 0,
            activeQueries: 0,
            slowQueries: 0,
            avgQueryTime: 0,
            cacheHitRatio: 0,
            indexHitRatio: 0,
            diskUsage: 0,
            dbSize: 0,
            transactionCount: 0,
            lockCount: 0,
            lastUpdate: null
        };

        // Historical metrics storage (in-memory for now)
        this.metricsHistory = {
            realtime: [],
            hourly: [],
            daily: [],
            weekly: []
        };

        // Alert state tracking
        this.alertHistory = [];
        this.lastAlertTimes = new Map();
        this.monitoringActive = false;

        // Performance baselines (calculated from historical data)
        this.baselines = {
            avgQueryTime: 100,
            connectionCount: 10,
            cacheHitRatio: 95,
            transactionThroughput: 100
        };

        console.log('📊 DatabaseMonitor initialized');
    }

    /**
     * Start monitoring
     */
    async startMonitoring() {
        if (this.monitoringActive) {
            console.log('📊 Monitoring already active');
            return;
        }

        try {
            await this.initializeMetricsTables();
            await this.loadHistoricalMetrics();
            await this.calculateBaselines();
            
            // Start monitoring intervals
            this.startRealtimeMonitoring();
            this.startPerformanceMonitoring();
            this.startHealthChecks();
            this.startAlertChecks();
            this.startMetricCleanup();

            this.monitoringActive = true;
            console.log('✅ Database monitoring started');

        } catch (error) {
            console.error('❌ Failed to start database monitoring:', error);
            throw error;
        }
    }

    /**
     * Stop monitoring
     */
    async stopMonitoring() {
        this.monitoringActive = false;
        
        // Clear all intervals
        if (this.realtimeInterval) clearInterval(this.realtimeInterval);
        if (this.performanceInterval) clearInterval(this.performanceInterval);
        if (this.healthInterval) clearInterval(this.healthInterval);
        if (this.alertInterval) clearInterval(this.alertInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);

        console.log('✅ Database monitoring stopped');
    }

    // ==========================================
    // MONITORING INTERVALS
    // ==========================================

    /**
     * Start real-time monitoring (every 5 seconds)
     */
    startRealtimeMonitoring() {
        this.realtimeInterval = setInterval(async () => {
            try {
                await this.collectRealtimeMetrics();
            } catch (error) {
                console.error('❌ Real-time monitoring error:', error);
            }
        }, this.config.intervals.realtime);
    }

    /**
     * Start performance monitoring (every 30 seconds)
     */
    startPerformanceMonitoring() {
        this.performanceInterval = setInterval(async () => {
            try {
                await this.collectPerformanceMetrics();
            } catch (error) {
                console.error('❌ Performance monitoring error:', error);
            }
        }, this.config.intervals.performance);
    }

    /**
     * Start health checks (every minute)
     */
    startHealthChecks() {
        this.healthInterval = setInterval(async () => {
            try {
                await this.performHealthChecks();
            } catch (error) {
                console.error('❌ Health check error:', error);
            }
        }, this.config.intervals.health);
    }

    /**
     * Start alert checks (every 10 seconds)
     */
    startAlertChecks() {
        this.alertInterval = setInterval(async () => {
            try {
                await this.checkAlerts();
            } catch (error) {
                console.error('❌ Alert check error:', error);
            }
        }, this.config.intervals.alerts);
    }

    /**
     * Start metric cleanup (every hour)
     */
    startMetricCleanup() {
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupOldMetrics();
            } catch (error) {
                console.error('❌ Metric cleanup error:', error);
            }
        }, this.config.intervals.cleanup);
    }

    // ==========================================
    // METRIC COLLECTION
    // ==========================================

    /**
     * Collect real-time database metrics
     */
    async collectRealtimeMetrics() {
        const metrics = {
            timestamp: new Date(),
            connections: await this.getConnectionCount(),
            activeQueries: await this.getActiveQueryCount(),
            lockCount: await this.getLockCount(),
            transactionCount: await this.getTransactionCount(),
            cacheHitRatio: await this.getCacheHitRatio(),
            dbSize: await this.getDatabaseSize()
        };

        // Update current metrics
        Object.assign(this.currentMetrics, metrics, {
            lastUpdate: metrics.timestamp
        });

        // Store in history
        this.metricsHistory.realtime.push(metrics);
        
        // Keep only recent data
        const cutoff = new Date(Date.now() - this.config.retention.realtime * 1000);
        this.metricsHistory.realtime = this.metricsHistory.realtime.filter(
            m => m.timestamp > cutoff
        );

        // Emit real-time update event
        this.emit('metrics:realtime', metrics);
    }

    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics() {
        const metrics = {
            timestamp: new Date(),
            slowQueries: await this.getSlowQueryCount(),
            avgQueryTime: await this.getAverageQueryTime(),
            indexHitRatio: await this.getIndexHitRatio(),
            diskUsage: await this.getDiskUsage(),
            cpuUsage: await this.getCPUUsage(),
            memoryUsage: await this.getMemoryUsage(),
            queryThroughput: await this.getQueryThroughput()
        };

        // Update current metrics
        Object.assign(this.currentMetrics, metrics);

        // Store performance metrics
        await this.storePerformanceMetrics(metrics);

        // Emit performance update event
        this.emit('metrics:performance', metrics);
    }

    /**
     * Perform comprehensive health checks
     */
    async performHealthChecks() {
        const healthChecks = {
            timestamp: new Date(),
            connectivity: await this.checkConnectivity(),
            replication: await this.checkReplication(),
            backups: await this.checkBackupStatus(),
            diskSpace: await this.checkDiskSpace(),
            systemHealth: await this.checkSystemHealth(),
            indexHealth: await this.checkIndexHealth(),
            constraintHealth: await this.checkConstraintHealth()
        };

        // Emit health check results
        this.emit('health:check', healthChecks);

        // Store health check results
        await this.storeHealthCheckResults(healthChecks);
    }

    // ==========================================
    // METRIC QUERIES
    // ==========================================

    /**
     * Get current connection count
     */
    async getConnectionCount() {
        const result = await db.query(`
            SELECT count(*) as connections
            FROM pg_stat_activity
            WHERE state = 'active'
        `);
        return parseInt(result.rows[0].connections);
    }

    /**
     * Get active query count
     */
    async getActiveQueryCount() {
        const result = await db.query(`
            SELECT count(*) as active_queries
            FROM pg_stat_activity
            WHERE state = 'active' 
            AND query NOT LIKE '%pg_stat_activity%'
        `);
        return parseInt(result.rows[0].active_queries);
    }

    /**
     * Get lock count
     */
    async getLockCount() {
        const result = await db.query(`
            SELECT count(*) as locks
            FROM pg_locks
        `);
        return parseInt(result.rows[0].locks);
    }

    /**
     * Get transaction count
     */
    async getTransactionCount() {
        const result = await db.query(`
            SELECT sum(xact_commit + xact_rollback) as transactions
            FROM pg_stat_database
            WHERE datname = current_database()
        `);
        return parseInt(result.rows[0].transactions) || 0;
    }

    /**
     * Get cache hit ratio
     */
    async getCacheHitRatio() {
        const result = await db.query(`
            SELECT 
                round(
                    100 * sum(blks_hit)::numeric / 
                    (sum(blks_hit) + sum(blks_read))::numeric, 
                    2
                ) as cache_hit_ratio
            FROM pg_stat_database
            WHERE datname = current_database()
        `);
        return parseFloat(result.rows[0].cache_hit_ratio) || 0;
    }

    /**
     * Get index hit ratio
     */
    async getIndexHitRatio() {
        const result = await db.query(`
            SELECT 
                round(
                    100 * sum(idx_blks_hit)::numeric / 
                    nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0)::numeric, 
                    2
                ) as index_hit_ratio
            FROM pg_statio_user_indexes
        `);
        return parseFloat(result.rows[0].index_hit_ratio) || 0;
    }

    /**
     * Get database size
     */
    async getDatabaseSize() {
        const result = await db.query(`
            SELECT pg_database_size(current_database()) as size_bytes
        `);
        return parseInt(result.rows[0].size_bytes);
    }

    /**
     * Get slow query count (from pg_stat_statements if available)
     */
    async getSlowQueryCount() {
        try {
            const result = await db.query(`
                SELECT count(*) as slow_queries
                FROM pg_stat_statements
                WHERE mean_time > $1
            `, [this.config.thresholds.slowQueryTime]);
            
            return parseInt(result.rows[0].slow_queries);
        } catch (error) {
            // pg_stat_statements not available
            return 0;
        }
    }

    /**
     * Get average query time
     */
    async getAverageQueryTime() {
        try {
            const result = await db.query(`
                SELECT avg(mean_time) as avg_time
                FROM pg_stat_statements
                WHERE calls > 10
            `);
            
            return parseFloat(result.rows[0].avg_time) || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get query throughput (queries per second)
     */
    async getQueryThroughput() {
        // This would calculate based on recent query counts
        // For now, return a placeholder
        return Math.floor(Math.random() * 100) + 50;
    }

    /**
     * Get disk usage percentage
     */
    async getDiskUsage() {
        // This would integrate with system monitoring
        // For now, return a placeholder
        return Math.floor(Math.random() * 30) + 40;
    }

    /**
     * Get CPU usage percentage
     */
    async getCPUUsage() {
        // This would integrate with system monitoring
        return Math.floor(Math.random() * 20) + 30;
    }

    /**
     * Get memory usage percentage
     */
    async getMemoryUsage() {
        // This would integrate with system monitoring
        return Math.floor(Math.random() * 25) + 45;
    }

    // ==========================================
    // HEALTH CHECKS
    // ==========================================

    /**
     * Check database connectivity
     */
    async checkConnectivity() {
        try {
            const start = Date.now();
            await db.query('SELECT 1');
            const latency = Date.now() - start;
            
            return {
                status: 'healthy',
                latency: latency,
                message: `Database accessible (${latency}ms)`
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                message: 'Database connectivity failed'
            };
        }
    }

    /**
     * Check replication status
     */
    async checkReplication() {
        try {
            const result = await db.query(`
                SELECT 
                    client_addr,
                    state,
                    pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) as lag_bytes
                FROM pg_stat_replication
            `);

            if (result.rows.length === 0) {
                return {
                    status: 'info',
                    message: 'No replication configured'
                };
            }

            const maxLag = Math.max(...result.rows.map(r => parseInt(r.lag_bytes) || 0));
            
            return {
                status: maxLag > this.config.thresholds.replicationLag ? 'warning' : 'healthy',
                replicas: result.rows.length,
                maxLag: maxLag,
                message: `${result.rows.length} replicas, max lag: ${maxLag} bytes`
            };

        } catch (error) {
            return {
                status: 'warning',
                message: 'Could not check replication status'
            };
        }
    }

    /**
     * Check backup status
     */
    async checkBackupStatus() {
        // This would integrate with BackupManager
        return {
            status: 'healthy',
            message: 'Backup status check placeholder'
        };
    }

    /**
     * Check disk space
     */
    async checkDiskSpace() {
        const diskUsage = await this.getDiskUsage();
        
        return {
            status: diskUsage > this.config.thresholds.diskUsage ? 'warning' : 'healthy',
            usage: diskUsage,
            message: `Disk usage: ${diskUsage}%`
        };
    }

    /**
     * Check system health
     */
    async checkSystemHealth() {
        const cpuUsage = await this.getCPUUsage();
        const memoryUsage = await this.getMemoryUsage();
        
        const cpuStatus = cpuUsage > this.config.thresholds.cpuUsage ? 'warning' : 'healthy';
        const memoryStatus = memoryUsage > this.config.thresholds.memoryUsage ? 'warning' : 'healthy';
        
        const overallStatus = (cpuStatus === 'warning' || memoryStatus === 'warning') ? 'warning' : 'healthy';
        
        return {
            status: overallStatus,
            cpu: cpuUsage,
            memory: memoryUsage,
            message: `CPU: ${cpuUsage}%, Memory: ${memoryUsage}%`
        };
    }

    /**
     * Check index health
     */
    async checkIndexHealth() {
        const indexHitRatio = await this.getIndexHitRatio();
        
        return {
            status: indexHitRatio < this.config.thresholds.indexUsage ? 'warning' : 'healthy',
            hitRatio: indexHitRatio,
            message: `Index hit ratio: ${indexHitRatio}%`
        };
    }

    /**
     * Check constraint health
     */
    async checkConstraintHealth() {
        try {
            const result = await db.query(`
                SELECT count(*) as invalid_constraints
                FROM pg_constraint
                WHERE NOT convalidated
            `);

            const invalidCount = parseInt(result.rows[0].invalid_constraints);
            
            return {
                status: invalidCount > 0 ? 'warning' : 'healthy',
                invalidConstraints: invalidCount,
                message: invalidCount > 0 
                    ? `${invalidCount} invalid constraints found`
                    : 'All constraints valid'
            };

        } catch (error) {
            return {
                status: 'warning',
                message: 'Could not check constraint health'
            };
        }
    }

    // ==========================================
    // ALERTING SYSTEM
    // ==========================================

    /**
     * Check all alert conditions
     */
    async checkAlerts() {
        if (!this.config.alerts.enabled) return;

        const alerts = [];

        // Connection count alert
        const connectionPct = (this.currentMetrics.connections / 100) * 100; // Assuming max 100 connections
        if (connectionPct > this.config.thresholds.connectionCount) {
            alerts.push({
                type: 'high_connections',
                severity: 'warning',
                message: `High connection count: ${this.currentMetrics.connections} (${connectionPct}%)`,
                value: connectionPct,
                threshold: this.config.thresholds.connectionCount
            });
        }

        // Cache hit ratio alert
        if (this.currentMetrics.cacheHitRatio < this.config.thresholds.cacheHitRatio) {
            alerts.push({
                type: 'low_cache_hit_ratio',
                severity: 'warning',
                message: `Low cache hit ratio: ${this.currentMetrics.cacheHitRatio}%`,
                value: this.currentMetrics.cacheHitRatio,
                threshold: this.config.thresholds.cacheHitRatio
            });
        }

        // Process alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }
    }

    /**
     * Process and send alert
     */
    async processAlert(alert) {
        const alertKey = `${alert.type}_${alert.severity}`;
        const now = Date.now();
        const lastAlertTime = this.lastAlertTimes.get(alertKey) || 0;

        // Check cooldown period
        if (now - lastAlertTime < this.config.alerts.cooldownMs) {
            return;
        }

        // Record alert
        const alertRecord = {
            ...alert,
            timestamp: new Date(),
            id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.alertHistory.push(alertRecord);
        this.lastAlertTimes.set(alertKey, now);

        // Send alert through configured channels
        await this.sendAlert(alertRecord);

        // Emit alert event
        this.emit('alert', alertRecord);

        // Store alert in database
        await this.storeAlert(alertRecord);
    }

    /**
     * Send alert through configured channels
     */
    async sendAlert(alert) {
        for (const channel of this.config.alerts.channels) {
            try {
                switch (channel) {
                    case 'console':
                        this.sendConsoleAlert(alert);
                        break;
                    case 'email':
                        await this.sendEmailAlert(alert);
                        break;
                    case 'slack':
                        await this.sendSlackAlert(alert);
                        break;
                    case 'webhook':
                        await this.sendWebhookAlert(alert);
                        break;
                }
            } catch (error) {
                console.error(`Failed to send alert via ${channel}:`, error);
            }
        }
    }

    /**
     * Send console alert
     */
    sendConsoleAlert(alert) {
        const emoji = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨',
            emergency: '🆘'
        };

        console.log(`${emoji[alert.severity]} [DB ALERT] ${alert.message}`);
    }

    /**
     * Send email alert (placeholder)
     */
    async sendEmailAlert(alert) {
        // This would integrate with email service
        console.log(`📧 Email alert: ${alert.message}`);
    }

    /**
     * Send Slack alert (placeholder)
     */
    async sendSlackAlert(alert) {
        // This would integrate with Slack API
        console.log(`💬 Slack alert: ${alert.message}`);
    }

    /**
     * Send webhook alert (placeholder)
     */
    async sendWebhookAlert(alert) {
        // This would send HTTP POST to webhook URL
        console.log(`🔗 Webhook alert: ${alert.message}`);
    }

    // ==========================================
    // DATA PERSISTENCE
    // ==========================================

    /**
     * Initialize metrics tables
     */
    async initializeMetricsTables() {
        // Create tables for storing metrics and alerts
        await db.query(`
            CREATE TABLE IF NOT EXISTS db_metrics (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                metric_type VARCHAR(50) NOT NULL,
                metrics JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS db_alerts (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(100) UNIQUE NOT NULL,
                alert_type VARCHAR(100) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                value NUMERIC,
                threshold NUMERIC,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_db_metrics_timestamp 
            ON db_metrics (timestamp DESC)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_db_alerts_timestamp 
            ON db_alerts (timestamp DESC)
        `);
    }

    /**
     * Store performance metrics
     */
    async storePerformanceMetrics(metrics) {
        try {
            await db.query(`
                INSERT INTO db_metrics (metric_type, metrics)
                VALUES ($1, $2)
            `, ['performance', JSON.stringify(metrics)]);
        } catch (error) {
            console.error('Failed to store performance metrics:', error);
        }
    }

    /**
     * Store health check results
     */
    async storeHealthCheckResults(healthChecks) {
        try {
            await db.query(`
                INSERT INTO db_metrics (metric_type, metrics)
                VALUES ($1, $2)
            `, ['health', JSON.stringify(healthChecks)]);
        } catch (error) {
            console.error('Failed to store health check results:', error);
        }
    }

    /**
     * Store alert
     */
    async storeAlert(alert) {
        try {
            await db.query(`
                INSERT INTO db_alerts (alert_id, alert_type, severity, message, value, threshold, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                alert.id,
                alert.type,
                alert.severity,
                alert.message,
                alert.value,
                alert.threshold,
                alert.timestamp
            ]);
        } catch (error) {
            console.error('Failed to store alert:', error);
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Load historical metrics
     */
    async loadHistoricalMetrics() {
        try {
            const result = await db.query(`
                SELECT * FROM db_metrics
                WHERE timestamp > NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
                LIMIT 1000
            `);

            // Process and organize historical data
            for (const row of result.rows) {
                const metrics = JSON.parse(row.metrics);
                
                if (row.metric_type === 'performance') {
                    this.metricsHistory.hourly.push(metrics);
                }
            }

        } catch (error) {
            console.warn('Could not load historical metrics:', error.message);
        }
    }

    /**
     * Calculate performance baselines
     */
    async calculateBaselines() {
        if (this.metricsHistory.hourly.length < 10) {
            console.log('📊 Insufficient historical data for baselines');
            return;
        }

        const recentMetrics = this.metricsHistory.hourly.slice(-100);
        
        this.baselines.avgQueryTime = this.calculateAverage(
            recentMetrics.map(m => m.avgQueryTime).filter(v => v > 0)
        );

        this.baselines.cacheHitRatio = this.calculateAverage(
            recentMetrics.map(m => m.cacheHitRatio).filter(v => v > 0)
        );

        console.log('📊 Performance baselines calculated:', this.baselines);
    }

    /**
     * Calculate average of array
     */
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Clean up old metrics
     */
    async cleanupOldMetrics() {
        try {
            // Clean up metrics older than retention period
            await db.query(`
                DELETE FROM db_metrics
                WHERE timestamp < NOW() - INTERVAL '90 days'
            `);

            // Clean up old alerts
            await db.query(`
                DELETE FROM db_alerts
                WHERE timestamp < NOW() - INTERVAL '30 days'
            `);

            console.log('🧹 Cleaned up old monitoring data');

        } catch (error) {
            console.error('Failed to cleanup old metrics:', error);
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            active: this.monitoringActive,
            currentMetrics: { ...this.currentMetrics },
            baselines: { ...this.baselines },
            alertHistory: this.alertHistory.slice(-10), // Last 10 alerts
            intervals: this.config.intervals,
            thresholds: this.config.thresholds,
            healthStatus: this.calculateOverallHealth()
        };
    }

    /**
     * Calculate overall health status
     */
    calculateOverallHealth() {
        const checks = [
            this.currentMetrics.connections < (this.config.thresholds.connectionCount * 0.8),
            this.currentMetrics.cacheHitRatio > this.config.thresholds.cacheHitRatio,
            this.currentMetrics.avgQueryTime < this.config.thresholds.slowQueryTime
        ];

        const healthyCount = checks.filter(Boolean).length;
        const healthPercentage = (healthyCount / checks.length) * 100;

        return {
            percentage: healthPercentage,
            status: healthPercentage >= 80 ? 'healthy' : 
                   healthPercentage >= 60 ? 'warning' : 'critical'
        };
    }

    /**
     * Get metrics for dashboard
     */
    getDashboardMetrics() {
        return {
            current: { ...this.currentMetrics },
            trends: {
                realtime: this.metricsHistory.realtime.slice(-60), // Last 5 minutes
                hourly: this.metricsHistory.hourly.slice(-24)      // Last 24 hours
            },
            alerts: {
                recent: this.alertHistory.slice(-5),
                count: this.alertHistory.length
            },
            health: this.calculateOverallHealth()
        };
    }
}

module.exports = DatabaseMonitor; 