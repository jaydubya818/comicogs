/**
 * Task 11: Performance Monitoring & Analytics
 * Monitoring API Routes - Expose health metrics and analytics data
 */

const express = require('express');
const router = express.Router();
const SystemHealthMonitor = require('../services/monitoring/SystemHealthMonitor');
const AnalyticsService = require('../services/monitoring/AnalyticsService');

// Initialize monitoring services
const healthMonitor = new SystemHealthMonitor();
const analytics = new AnalyticsService();

// Start monitoring when routes are loaded
healthMonitor.start(30000); // Collect metrics every 30 seconds

/**
 * GET /api/monitoring/health
 * Get basic system health status
 */
router.get('/health', (req, res) => {
    try {
        const healthSummary = healthMonitor.getHealthSummary();
        res.json({
            status: 'success',
            data: healthSummary
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve health status',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/dashboard
 * Get complete monitoring dashboard data
 */
router.get('/dashboard', (req, res) => {
    try {
        const healthMetrics = healthMonitor.getMetrics();
        const analyticsData = analytics.getDashboardData();
        
        const dashboard = {
            health: {
                status: healthMetrics.status,
                uptime: healthMetrics.metrics.system.uptime,
                database: healthMetrics.metrics.database.status,
                redis: healthMetrics.metrics.redis.status,
                memory: healthMetrics.metrics.system.memory,
                alerts: healthMetrics.alerts.filter(a => !a.acknowledged).length
            },
            analytics: {
                realtime: analyticsData.realtime,
                daily: analyticsData.daily,
                trends: analyticsData.trends
            },
            performance: {
                apiResponseTime: healthMetrics.metrics.api.averageResponseTime,
                dbQueryTime: healthMetrics.metrics.database.queryPerformance.avg,
                redisLatency: healthMetrics.metrics.redis.pingTime || 0,
                errorRate: ((healthMetrics.metrics.api.errorCount / Math.max(healthMetrics.metrics.api.requestCount, 1)) * 100).toFixed(2)
            },
            timestamp: new Date().toISOString()
        };
        
        res.json({
            status: 'success',
            data: dashboard
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve dashboard data',
            error: error.message
        });
    }
});

// Export the services for use in other parts of the application
router.healthMonitor = healthMonitor;
router.analytics = analytics;

module.exports = router;
