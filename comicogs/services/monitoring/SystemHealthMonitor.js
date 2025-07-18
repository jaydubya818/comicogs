/**
 * Task 11: Performance Monitoring & Analytics
 * SystemHealthMonitor - Comprehensive system health tracking
 */

const os = require('os');
const { performance } = require('perf_hooks');
const db = require('../../db');

class SystemHealthMonitor {
    constructor() {
        this.metrics = {
            system: {
                uptime: 0,
                memory: { used: 0, free: 0, total: 0 },
                cpu: { usage: 0, load: [] },
                diskSpace: { used: 0, free: 0, total: 0 }
            },
            database: {
                status: 'unknown',
                connectionCount: 0,
                queryPerformance: { avg: 0, min: 0, max: 0 },
                lastQuery: null,
                healthCheck: null
            },
            redis: {
                status: 'unknown',
                memory: 0,
                connectedClients: 0,
                hitRate: 0,
                lastOperation: null
            },
            api: {
                requestCount: 0,
                errorCount: 0,
                averageResponseTime: 0,
                activeConnections: 0,
                endpointStats: {}
            },
            scrapers: {
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                lastRun: null,
                marketplaceStatus: {}
            }
        };

        this.alerts = [];
        this.thresholds = {
            memory: { warning: 80, critical: 95 }, // percentage
            cpu: { warning: 80, critical: 95 },
            responseTime: { warning: 2000, critical: 5000 }, // ms
            errorRate: { warning: 5, critical: 10 }, // percentage
            diskSpace: { warning: 85, critical: 95 }
        };

        this.startTime = Date.now();
        this.intervalId = null;
    }

    /**
     * Start continuous monitoring
     */
    start(intervalMs = 30000) { // Default: 30 seconds
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
        
        console.log('🔍 SystemHealthMonitor started - collecting metrics every', intervalMs / 1000, 'seconds');
        
        // Initial collection
        this.collectMetrics();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🛑 SystemHealthMonitor stopped');
    }

    /**
     * Collect all system metrics
     */
    async collectMetrics() {
        try {
            await Promise.all([
                this.collectSystemMetrics(),
                this.collectDatabaseMetrics(),
                this.collectRedisMetrics(),
                this.collectScraperMetrics()
            ]);

            this.checkThresholds();
            this.updateUptime();
            
        } catch (error) {
            console.error('❌ Error collecting metrics:', error);
            this.addAlert('error', 'Failed to collect system metrics', error.message);
        }
    }

    /**
     * Collect system-level metrics
     */
    collectSystemMetrics() {
        try {
            // Memory metrics
            const memUsed = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            
            this.metrics.system.memory = {
                used: memUsed.rss,
                free: freeMem,
                total: totalMem,
                heapUsed: memUsed.heapUsed,
                heapTotal: memUsed.heapTotal,
                external: memUsed.external,
                percentage: ((totalMem - freeMem) / totalMem) * 100
            };

            // CPU metrics
            this.metrics.system.cpu = {
                usage: process.cpuUsage(),
                load: os.loadavg(),
                cores: os.cpus().length
            };

            // System info
            this.metrics.system.platform = os.platform();
            this.metrics.system.arch = os.arch();
            this.metrics.system.nodeVersion = process.version;

        } catch (error) {
            console.error('❌ Error collecting system metrics:', error);
        }
    }

    /**
     * Collect database metrics
     */
    async collectDatabaseMetrics() {
        const startTime = performance.now();
        
        try {
            // Health check query
            await db.query('SELECT 1 as health_check');
            const queryTime = performance.now() - startTime;
            
            this.metrics.database.status = 'healthy';
            this.metrics.database.lastQuery = queryTime;
            this.metrics.database.healthCheck = new Date().toISOString();

            // Get database stats
            try {
                const statsQuery = `
                    SELECT 
                        (SELECT count(*) FROM pg_stat_activity) as connections,
                        (SELECT count(*) FROM comics) as total_comics,
                        (SELECT count(*) FROM users) as total_users,
                        (SELECT count(*) FROM collections) as total_collections
                `;
                const stats = await db.query(statsQuery);
                
                this.metrics.database.connectionCount = stats.rows[0].connections;
                this.metrics.database.totalComics = stats.rows[0].total_comics;
                this.metrics.database.totalUsers = stats.rows[0].total_users;
                this.metrics.database.totalCollections = stats.rows[0].total_collections;
                
            } catch (statsError) {
                console.warn('⚠️ Could not collect detailed database stats:', statsError.message);
            }

            // Update query performance metrics
            this.updateQueryPerformance(queryTime);

        } catch (error) {
            this.metrics.database.status = 'error';
            this.metrics.database.lastError = error.message;
            this.addAlert('critical', 'Database connection failed', error.message);
        }
    }

    /**
     * Collect Redis metrics
     */
    async collectRedisMetrics() {
        try {
            if (db.redisClient && db.redisClient.isOpen) {
                // Redis info
                const info = await db.redisClient.info();
                const memory = await db.redisClient.info('memory');
                
                this.metrics.redis.status = 'healthy';
                this.metrics.redis.lastOperation = new Date().toISOString();
                
                // Parse info for useful metrics
                const lines = info.split('\r\n');
                lines.forEach(line => {
                    if (line.includes('connected_clients:')) {
                        this.metrics.redis.connectedClients = parseInt(line.split(':')[1]);
                    }
                });

                // Test Redis performance
                const startTime = performance.now();
                await db.redisClient.ping();
                this.metrics.redis.pingTime = performance.now() - startTime;

            } else {
                this.metrics.redis.status = 'disconnected';
                this.addAlert('warning', 'Redis disconnected', 'Redis client is not connected');
            }
        } catch (error) {
            this.metrics.redis.status = 'error';
            this.metrics.redis.lastError = error.message;
            this.addAlert('warning', 'Redis error', error.message);
        }
    }

    /**
     * Collect scraper metrics
     */
    async collectScraperMetrics() {
        try {
            // This would be enhanced to track actual scraper performance
            // For now, we'll track basic stats
            this.metrics.scrapers.lastCheck = new Date().toISOString();
            
            // Mock scraper status for available marketplaces
            const marketplaces = ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop', 'amazon'];
            marketplaces.forEach(marketplace => {
                this.metrics.scrapers.marketplaceStatus[marketplace] = {
                    status: 'active',
                    lastRun: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
                    successRate: Math.random() * 20 + 80 // 80-100% success rate
                };
            });

        } catch (error) {
            console.error('❌ Error collecting scraper metrics:', error);
        }
    }

    /**
     * Update query performance metrics
     */
    updateQueryPerformance(queryTime) {
        const perf = this.metrics.database.queryPerformance;
        
        if (perf.min === 0 || queryTime < perf.min) perf.min = queryTime;
        if (queryTime > perf.max) perf.max = queryTime;
        
        // Simple moving average
        perf.avg = perf.avg === 0 ? queryTime : (perf.avg * 0.9 + queryTime * 0.1);
    }

    /**
     * Update API metrics
     */
    recordApiRequest(endpoint, responseTime, statusCode) {
        this.metrics.api.requestCount++;
        
        if (statusCode >= 400) {
            this.metrics.api.errorCount++;
        }

        // Update average response time
        const current = this.metrics.api.averageResponseTime;
        this.metrics.api.averageResponseTime = 
            current === 0 ? responseTime : (current * 0.9 + responseTime * 0.1);

        // Track endpoint-specific stats
        if (!this.metrics.api.endpointStats[endpoint]) {
            this.metrics.api.endpointStats[endpoint] = {
                requests: 0,
                errors: 0,
                averageTime: 0
            };
        }

        const endpointStats = this.metrics.api.endpointStats[endpoint];
        endpointStats.requests++;
        if (statusCode >= 400) endpointStats.errors++;
        
        endpointStats.averageTime = 
            endpointStats.averageTime === 0 ? responseTime : 
            (endpointStats.averageTime * 0.9 + responseTime * 0.1);
    }

    /**
     * Check if metrics exceed thresholds and create alerts
     */
    checkThresholds() {
        const { system, api, database } = this.metrics;

        // Memory threshold check
        if (system.memory.percentage > this.thresholds.memory.critical) {
            this.addAlert('critical', 'Memory usage critical', `${system.memory.percentage.toFixed(1)}% used`);
        } else if (system.memory.percentage > this.thresholds.memory.warning) {
            this.addAlert('warning', 'Memory usage high', `${system.memory.percentage.toFixed(1)}% used`);
        }

        // Response time threshold check
        if (api.averageResponseTime > this.thresholds.responseTime.critical) {
            this.addAlert('critical', 'API response time critical', `${api.averageResponseTime.toFixed(0)}ms average`);
        } else if (api.averageResponseTime > this.thresholds.responseTime.warning) {
            this.addAlert('warning', 'API response time high', `${api.averageResponseTime.toFixed(0)}ms average`);
        }

        // Error rate threshold check
        if (api.requestCount > 0) {
            const errorRate = (api.errorCount / api.requestCount) * 100;
            if (errorRate > this.thresholds.errorRate.critical) {
                this.addAlert('critical', 'API error rate critical', `${errorRate.toFixed(1)}% error rate`);
            } else if (errorRate > this.thresholds.errorRate.warning) {
                this.addAlert('warning', 'API error rate high', `${errorRate.toFixed(1)}% error rate`);
            }
        }
    }

    /**
     * Add alert to the system
     */
    addAlert(level, title, message) {
        const alert = {
            id: Date.now() + Math.random(),
            level,
            title,
            message,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };

        this.alerts.unshift(alert);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(0, 100);
        }

        // Log alert
        const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} ALERT [${level.toUpperCase()}]: ${title} - ${message}`);
    }

    /**
     * Update system uptime
     */
    updateUptime() {
        this.metrics.system.uptime = Date.now() - this.startTime;
    }

    /**
     * Get current metrics snapshot
     */
    getMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            alerts: this.alerts.slice(0, 10), // Return only recent alerts
            status: this.getOverallStatus()
        };
    }

    /**
     * Get overall system status
     */
    getOverallStatus() {
        const criticalAlerts = this.alerts.filter(a => a.level === 'critical' && !a.acknowledged).length;
        const warningAlerts = this.alerts.filter(a => a.level === 'warning' && !a.acknowledged).length;

        if (criticalAlerts > 0) return 'critical';
        if (warningAlerts > 0) return 'warning';
        if (this.metrics.database.status === 'healthy' && this.metrics.redis.status === 'healthy') {
            return 'healthy';
        }
        return 'degraded';
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
        }
    }

    /**
     * Get health summary for quick checks
     */
    getHealthSummary() {
        return {
            status: this.getOverallStatus(),
            uptime: this.metrics.system.uptime,
            database: this.metrics.database.status,
            redis: this.metrics.redis.status,
            memoryUsage: this.metrics.system.memory.percentage,
            activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SystemHealthMonitor; 