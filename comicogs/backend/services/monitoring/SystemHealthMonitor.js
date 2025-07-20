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
                cpu: { usage: 0, load: [] }
            },
            database: {
                status: 'unknown',
                queryPerformance: { avg: 0, min: 0, max: 0 }
            },
            redis: {
                status: 'unknown',
                pingTime: 0
            },
            api: {
                requestCount: 0,
                errorCount: 0,
                averageResponseTime: 0
            }
        };

        this.alerts = [];
        this.startTime = Date.now();
        this.intervalId = null;
    }

    start(intervalMs = 30000) {
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
        
        console.log('🔍 SystemHealthMonitor started');
        this.collectMetrics();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🛑 SystemHealthMonitor stopped');
    }

    async collectMetrics() {
        try {
            await Promise.all([
                this.collectSystemMetrics(),
                this.collectDatabaseMetrics(),
                this.collectRedisMetrics()
            ]);

            this.updateUptime();
            
        } catch (error) {
            console.error('❌ Error collecting metrics:', error);
        }
    }

    collectSystemMetrics() {
        try {
            const memUsed = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            
            this.metrics.system.memory = {
                used: memUsed.rss,
                free: freeMem,
                total: totalMem,
                percentage: ((totalMem - freeMem) / totalMem) * 100
            };

            this.metrics.system.cpu = {
                usage: process.cpuUsage(),
                load: os.loadavg()
            };

        } catch (error) {
            console.error('❌ Error collecting system metrics:', error);
        }
    }

    async collectDatabaseMetrics() {
        const startTime = performance.now();
        
        try {
            await db.query('SELECT 1 as health_check');
            const queryTime = performance.now() - startTime;
            
            this.metrics.database.status = 'healthy';
            this.updateQueryPerformance(queryTime);

        } catch (error) {
            this.metrics.database.status = 'error';
        }
    }

    async collectRedisMetrics() {
        try {
            if (db.redisClient && db.redisClient.isOpen) {
                const startTime = performance.now();
                await db.redisClient.ping();
                this.metrics.redis.pingTime = performance.now() - startTime;
                this.metrics.redis.status = 'healthy';
            } else {
                this.metrics.redis.status = 'disconnected';
            }
        } catch (error) {
            this.metrics.redis.status = 'error';
        }
    }

    updateQueryPerformance(queryTime) {
        const perf = this.metrics.database.queryPerformance;
        
        if (perf.min === 0 || queryTime < perf.min) perf.min = queryTime;
        if (queryTime > perf.max) perf.max = queryTime;
        
        perf.avg = perf.avg === 0 ? queryTime : (perf.avg * 0.9 + queryTime * 0.1);
    }

    recordApiRequest(endpoint, responseTime, statusCode) {
        this.metrics.api.requestCount++;
        
        if (statusCode >= 400) {
            this.metrics.api.errorCount++;
        }

        const current = this.metrics.api.averageResponseTime;
        this.metrics.api.averageResponseTime = 
            current === 0 ? responseTime : (current * 0.9 + responseTime * 0.1);
    }

    updateUptime() {
        this.metrics.system.uptime = Date.now() - this.startTime;
    }

    getMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            alerts: this.alerts.slice(0, 10),
            status: this.getOverallStatus()
        };
    }

    getOverallStatus() {
        if (this.metrics.database.status === 'healthy' && this.metrics.redis.status === 'healthy') {
            return 'healthy';
        }
        return 'degraded';
    }

    getHealthSummary() {
        return {
            status: this.getOverallStatus(),
            uptime: this.metrics.system.uptime,
            database: this.metrics.database.status,
            redis: this.metrics.redis.status,
            memoryUsage: this.metrics.system.memory.percentage,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SystemHealthMonitor;
