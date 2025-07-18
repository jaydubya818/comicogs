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
 * Middleware to track API performance
 */
const trackApiPerformance = (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        const endpoint = req.route ? req.route.path : req.path;
        
        // Track API performance
        healthMonitor.recordApiRequest(endpoint, responseTime, res.statusCode);
        analytics.trackApiPerformance(endpoint, req.method, res.statusCode, responseTime, req.user?.id);
        
        originalEnd.apply(this, args);
    };
    
    next();
};

// Apply performance tracking to all routes
router.use(trackApiPerformance);

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
 * GET /api/monitoring/metrics
 * Get comprehensive system metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const metrics = healthMonitor.getMetrics();
        res.json({
            status: 'success',
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve metrics',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/analytics
 * Get analytics dashboard data
 */
router.get('/analytics', (req, res) => {
    try {
        const dashboardData = analytics.getDashboardData();
        res.json({
            status: 'success',
            data: dashboardData
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve analytics',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/engagement
 * Get user engagement report
 */
router.get('/engagement', (req, res) => {
    try {
        const timeframe = req.query.timeframe || '24h';
        const engagement = analytics.getUserEngagementReport(timeframe);
        res.json({
            status: 'success',
            data: engagement
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve engagement data',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/alerts
 * Get active system alerts
 */
router.get('/alerts', (req, res) => {
    try {
        const metrics = healthMonitor.getMetrics();
        const acknowledgedOnly = req.query.acknowledged === 'true';
        
        let alerts = metrics.alerts;
        if (acknowledgedOnly) {
            alerts = alerts.filter(alert => alert.acknowledged);
        }

        res.json({
            status: 'success',
            data: {
                alerts,
                totalCount: alerts.length,
                criticalCount: alerts.filter(a => a.level === 'critical').length,
                warningCount: alerts.filter(a => a.level === 'warning').length
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve alerts',
            error: error.message
        });
    }
});

/**
 * POST /api/monitoring/alerts/:id/acknowledge
 * Acknowledge a specific alert
 */
router.post('/alerts/:id/acknowledge', (req, res) => {
    try {
        const alertId = parseInt(req.params.id);
        healthMonitor.acknowledgeAlert(alertId);
        
        res.json({
            status: 'success',
            message: 'Alert acknowledged successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to acknowledge alert',
            error: error.message
        });
    }
});

/**
 * POST /api/monitoring/track/page-view
 * Track a page view event
 */
router.post('/track/page-view', (req, res) => {
    try {
        const { userId, page, sessionId, metadata } = req.body;
        
        analytics.trackPageView(userId, page, sessionId, {
            userAgent: req.get('User-Agent'),
            referrer: req.get('Referer'),
            ip: req.ip,
            ...metadata
        });
        
        res.json({
            status: 'success',
            message: 'Page view tracked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to track page view',
            error: error.message
        });
    }
});

/**
 * POST /api/monitoring/track/feature-usage
 * Track feature usage event
 */
router.post('/track/feature-usage', (req, res) => {
    try {
        const { userId, feature, action, metadata } = req.body;
        
        analytics.trackFeatureUsage(userId, feature, action, metadata);
        
        res.json({
            status: 'success',
            message: 'Feature usage tracked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to track feature usage',
            error: error.message
        });
    }
});

/**
 * POST /api/monitoring/track/conversion
 * Track conversion event
 */
router.post('/track/conversion', (req, res) => {
    try {
        const { userId, conversionType, value, metadata } = req.body;
        
        analytics.trackConversion(userId, conversionType, value, metadata);
        
        res.json({
            status: 'success',
            message: 'Conversion tracked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to track conversion',
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

/**
 * GET /api/monitoring/export
 * Export analytics data
 */
router.get('/export', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const data = analytics.exportData(format);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=comiccomp-analytics-${new Date().toISOString().split('T')[0]}.json`);
        res.send(data);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to export data',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/system-info
 * Get detailed system information
 */
router.get('/system-info', (req, res) => {
    try {
        const metrics = healthMonitor.getMetrics();
        const systemInfo = {
            server: {
                platform: metrics.metrics.system.platform,
                architecture: metrics.metrics.system.arch,
                nodeVersion: metrics.metrics.system.nodeVersion,
                uptime: metrics.metrics.system.uptime,
                startTime: new Date(Date.now() - metrics.metrics.system.uptime).toISOString()
            },
            resources: {
                memory: metrics.metrics.system.memory,
                cpu: metrics.metrics.system.cpu
            },
            services: {
                database: {
                    status: metrics.metrics.database.status,
                    connections: metrics.metrics.database.connectionCount,
                    queryPerformance: metrics.metrics.database.queryPerformance
                },
                redis: {
                    status: metrics.metrics.redis.status,
                    connectedClients: metrics.metrics.redis.connectedClients,
                    pingTime: metrics.metrics.redis.pingTime
                }
            },
            scrapers: metrics.metrics.scrapers
        };
        
        res.json({
            status: 'success',
            data: systemInfo
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve system information',
            error: error.message
        });
    }
});

/**
 * Middleware to track errors
 */
router.use((error, req, res, next) => {
    analytics.trackError(error, req.user?.id, {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
    });
    
    next(error);
});

// Export the services for use in other parts of the application
router.healthMonitor = healthMonitor;
router.analytics = analytics;

module.exports = router; 