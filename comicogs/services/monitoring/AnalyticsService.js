/**
 * Task 11: Performance Monitoring & Analytics
 * AnalyticsService - User engagement and system analytics tracking
 */

const db = require('../../db');

class AnalyticsService {
    constructor() {
        this.events = [];
        this.userSessions = new Map();
        this.featureUsage = new Map();
        this.performanceMetrics = new Map();
        
        // Cache for aggregated metrics
        this.dailyStats = {
            users: { active: 0, new: 0, returning: 0 },
            pages: { views: 0, uniqueViews: 0, bounceRate: 0 },
            features: { recommendations: 0, listings: 0, searches: 0 },
            api: { requests: 0, errors: 0, avgResponseTime: 0 }
        };

        this.startTime = Date.now();
    }

    /**
     * Track user page view
     */
    trackPageView(userId, page, sessionId, metadata = {}) {
        const event = {
            type: 'page_view',
            userId,
            sessionId,
            page,
            timestamp: new Date().toISOString(),
            metadata: {
                userAgent: metadata.userAgent || 'unknown',
                referrer: metadata.referrer || 'direct',
                loadTime: metadata.loadTime || 0,
                ...metadata
            }
        };

        this.events.push(event);
        this.updateSession(userId, sessionId, page);
        this.dailyStats.pages.views++;

        // Track unique page views
        const uniqueKey = `${userId}-${page}-${new Date().toDateString()}`;
        if (!this.performanceMetrics.has(uniqueKey)) {
            this.dailyStats.pages.uniqueViews++;
            this.performanceMetrics.set(uniqueKey, true);
        }

        this.cleanupOldEvents();
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(userId, feature, action, metadata = {}) {
        const event = {
            type: 'feature_usage',
            userId,
            feature,
            action,
            timestamp: new Date().toISOString(),
            metadata
        };

        this.events.push(event);
        
        // Update feature usage stats
        const featureKey = `${feature}_${action}`;
        const currentCount = this.featureUsage.get(featureKey) || 0;
        this.featureUsage.set(featureKey, currentCount + 1);

        // Update daily stats
        switch (feature) {
            case 'recommendations':
                this.dailyStats.features.recommendations++;
                break;
            case 'listings':
                this.dailyStats.features.listings++;
                break;
            case 'search':
                this.dailyStats.features.searches++;
                break;
        }

        this.cleanupOldEvents();
    }

    /**
     * Track API performance
     */
    trackApiPerformance(endpoint, method, statusCode, responseTime, userId = null) {
        const event = {
            type: 'api_call',
            endpoint,
            method,
            statusCode,
            responseTime,
            userId,
            timestamp: new Date().toISOString()
        };

        this.events.push(event);
        
        // Update API stats
        this.dailyStats.api.requests++;
        if (statusCode >= 400) {
            this.dailyStats.api.errors++;
        }

        // Update average response time
        const current = this.dailyStats.api.avgResponseTime;
        this.dailyStats.api.avgResponseTime = 
            current === 0 ? responseTime : (current * 0.95 + responseTime * 0.05);

        this.cleanupOldEvents();
    }

    /**
     * Track user conversion events
     */
    trackConversion(userId, conversionType, value = 0, metadata = {}) {
        const event = {
            type: 'conversion',
            userId,
            conversionType, // 'signup', 'listing_created', 'recommendation_clicked', etc.
            value,
            timestamp: new Date().toISOString(),
            metadata
        };

        this.events.push(event);
        this.cleanupOldEvents();
    }

    /**
     * Track error events
     */
    trackError(error, userId = null, context = {}) {
        const event = {
            type: 'error',
            userId,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context,
            timestamp: new Date().toISOString()
        };

        this.events.push(event);
        this.cleanupOldEvents();
    }

    /**
     * Update user session information
     */
    updateSession(userId, sessionId, currentPage) {
        const sessionKey = `${userId}-${sessionId}`;
        
        if (!this.userSessions.has(sessionKey)) {
            // New session
            this.userSessions.set(sessionKey, {
                userId,
                sessionId,
                startTime: new Date(),
                lastActivity: new Date(),
                pages: [currentPage],
                pageCount: 1,
                isNewUser: this.isNewUser(userId)
            });

            // Update daily user stats
            this.dailyStats.users.active++;
            if (this.isNewUser(userId)) {
                this.dailyStats.users.new++;
            } else {
                this.dailyStats.users.returning++;
            }
        } else {
            // Update existing session
            const session = this.userSessions.get(sessionKey);
            session.lastActivity = new Date();
            
            if (!session.pages.includes(currentPage)) {
                session.pages.push(currentPage);
                session.pageCount++;
            }
        }
    }

    /**
     * Check if user is new (simplified - in real implementation would check database)
     */
    isNewUser(userId) {
        // For now, return random value - in real implementation would check user creation date
        return Math.random() < 0.3; // 30% new users
    }

    /**
     * Get real-time analytics dashboard data
     */
    getDashboardData() {
        const now = new Date();
        const today = now.toDateString();
        
        // Filter events for today
        const todayEvents = this.events.filter(event => 
            new Date(event.timestamp).toDateString() === today
        );

        // Calculate active sessions (last activity within 30 minutes)
        const activeSessions = Array.from(this.userSessions.values()).filter(session => 
            (now - session.lastActivity) < 30 * 60 * 1000 // 30 minutes
        );

        // Get top pages
        const pageViews = todayEvents
            .filter(event => event.type === 'page_view')
            .reduce((acc, event) => {
                acc[event.page] = (acc[event.page] || 0) + 1;
                return acc;
            }, {});

        const topPages = Object.entries(pageViews)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([page, views]) => ({ page, views }));

        // Get feature usage stats
        const featureStats = Array.from(this.featureUsage.entries())
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate error rate
        const apiEvents = todayEvents.filter(event => event.type === 'api_call');
        const errorEvents = apiEvents.filter(event => event.statusCode >= 400);
        const errorRate = apiEvents.length > 0 ? (errorEvents.length / apiEvents.length) * 100 : 0;

        // Calculate average session duration
        const completedSessions = Array.from(this.userSessions.values()).filter(session => 
            (now - session.lastActivity) > 30 * 60 * 1000 // Inactive for 30+ minutes
        );
        
        const avgSessionDuration = completedSessions.length > 0 
            ? completedSessions.reduce((sum, session) => 
                sum + (session.lastActivity - session.startTime), 0) / completedSessions.length
            : 0;

        return {
            timestamp: now.toISOString(),
            realtime: {
                activeSessions: activeSessions.length,
                currentUsers: activeSessions.length,
                pageViewsLast24h: todayEvents.filter(e => e.type === 'page_view').length,
                apiCallsLast24h: apiEvents.length
            },
            daily: {
                ...this.dailyStats,
                errorRate: errorRate.toFixed(2),
                avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // minutes
                bounceRate: this.calculateBounceRate(todayEvents)
            },
            trends: {
                topPages,
                featureUsage: featureStats,
                userFlow: this.getUserFlow(todayEvents),
                performanceMetrics: this.getPerformanceMetrics(todayEvents)
            },
            alerts: this.getAnalyticsAlerts()
        };
    }

    /**
     * Calculate bounce rate (sessions with only 1 page view)
     */
    calculateBounceRate(events) {
        const sessions = new Map();
        
        events.filter(e => e.type === 'page_view').forEach(event => {
            const key = `${event.userId}-${event.sessionId}`;
            sessions.set(key, (sessions.get(key) || 0) + 1);
        });

        if (sessions.size === 0) return 0;
        
        const bouncedSessions = Array.from(sessions.values()).filter(count => count === 1).length;
        return ((bouncedSessions / sessions.size) * 100).toFixed(1);
    }

    /**
     * Get user flow analysis
     */
    getUserFlow(events) {
        const pageViews = events.filter(e => e.type === 'page_view');
        const flow = {};

        pageViews.forEach((event, index) => {
            if (index > 0) {
                const prevEvent = pageViews[index - 1];
                if (event.sessionId === prevEvent.sessionId) {
                    const transition = `${prevEvent.page} → ${event.page}`;
                    flow[transition] = (flow[transition] || 0) + 1;
                }
            }
        });

        return Object.entries(flow)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([transition, count]) => ({ transition, count }));
    }

    /**
     * Get performance metrics summary
     */
    getPerformanceMetrics(events) {
        const pageViews = events.filter(e => e.type === 'page_view' && e.metadata.loadTime);
        
        if (pageViews.length === 0) return { avgLoadTime: 0, slowPages: [] };

        const loadTimes = pageViews.map(e => e.metadata.loadTime);
        const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;

        // Find slow pages (> 3 seconds)
        const slowPages = pageViews
            .filter(e => e.metadata.loadTime > 3000)
            .reduce((acc, event) => {
                acc[event.page] = (acc[event.page] || 0) + 1;
                return acc;
            }, {});

        return {
            avgLoadTime: Math.round(avgLoadTime),
            slowPages: Object.entries(slowPages)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([page, count]) => ({ page, count }))
        };
    }

    /**
     * Get analytics-based alerts
     */
    getAnalyticsAlerts() {
        const alerts = [];
        const errorRate = this.dailyStats.api.errors / Math.max(this.dailyStats.api.requests, 1) * 100;

        if (errorRate > 5) {
            alerts.push({
                level: 'warning',
                title: 'High API Error Rate',
                message: `${errorRate.toFixed(1)}% error rate detected`,
                timestamp: new Date().toISOString()
            });
        }

        if (this.dailyStats.api.avgResponseTime > 2000) {
            alerts.push({
                level: 'warning',
                title: 'Slow API Response',
                message: `Average response time: ${Math.round(this.dailyStats.api.avgResponseTime)}ms`,
                timestamp: new Date().toISOString()
            });
        }

        return alerts;
    }

    /**
     * Get user engagement report
     */
    getUserEngagementReport(timeframe = '24h') {
        const now = new Date();
        const cutoff = new Date(now - (timeframe === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
        
        const recentEvents = this.events.filter(event => 
            new Date(event.timestamp) > cutoff
        );

        // Calculate engagement metrics
        const uniqueUsers = new Set(recentEvents.map(e => e.userId)).size;
        const totalSessions = new Set(recentEvents.filter(e => e.sessionId).map(e => e.sessionId)).size;
        const pageViews = recentEvents.filter(e => e.type === 'page_view').length;
        const featureUsages = recentEvents.filter(e => e.type === 'feature_usage').length;

        return {
            timeframe,
            uniqueUsers,
            totalSessions,
            pageViews,
            featureUsages,
            engagementRate: uniqueUsers > 0 ? (featureUsages / uniqueUsers).toFixed(2) : 0,
            avgPagesPerSession: totalSessions > 0 ? (pageViews / totalSessions).toFixed(1) : 0
        };
    }

    /**
     * Clean up old events to prevent memory issues
     */
    cleanupOldEvents() {
        const maxEvents = 10000;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cutoff = new Date(Date.now() - maxAge);

        // Remove old events
        this.events = this.events
            .filter(event => new Date(event.timestamp) > cutoff)
            .slice(-maxEvents); // Keep only the most recent events

        // Clean up old sessions
        const activeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        for (const [key, session] of this.userSessions.entries()) {
            if (session.lastActivity < activeCutoff) {
                this.userSessions.delete(key);
            }
        }
    }

    /**
     * Export analytics data for external analysis
     */
    exportData(format = 'json') {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalEvents: this.events.length,
                activeSessions: this.userSessions.size
            },
            events: this.events,
            dailyStats: this.dailyStats,
            featureUsage: Object.fromEntries(this.featureUsage)
        };

        return format === 'json' ? JSON.stringify(data, null, 2) : data;
    }
}

module.exports = AnalyticsService; 