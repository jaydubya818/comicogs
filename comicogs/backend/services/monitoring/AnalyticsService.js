/**
 * Task 11: Performance Monitoring & Analytics
 * AnalyticsService - User engagement and system analytics tracking
 */

class AnalyticsService {
    constructor() {
        this.events = [];
        this.dailyStats = {
            users: { active: 0, new: 0, returning: 0 },
            pages: { views: 0, uniqueViews: 0, bounceRate: 0 },
            features: { recommendations: 0, listings: 0, searches: 0 },
            api: { requests: 0, errors: 0, avgResponseTime: 0 }
        };
    }

    trackPageView(userId, page, sessionId, metadata = {}) {
        const event = {
            type: 'page_view',
            userId,
            sessionId,
            page,
            timestamp: new Date().toISOString(),
            metadata
        };

        this.events.push(event);
        this.dailyStats.pages.views++;
        this.cleanupOldEvents();
    }

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
        
        this.dailyStats.api.requests++;
        if (statusCode >= 400) {
            this.dailyStats.api.errors++;
        }

        const current = this.dailyStats.api.avgResponseTime;
        this.dailyStats.api.avgResponseTime = 
            current === 0 ? responseTime : (current * 0.95 + responseTime * 0.05);

        this.cleanupOldEvents();
    }

    getDashboardData() {
        const now = new Date();
        const today = now.toDateString();
        
        const todayEvents = this.events.filter(event => 
            new Date(event.timestamp).toDateString() === today
        );

        return {
            timestamp: now.toISOString(),
            realtime: {
                activeSessions: 0,
                currentUsers: 0,
                pageViewsLast24h: todayEvents.filter(e => e.type === 'page_view').length,
                apiCallsLast24h: todayEvents.filter(e => e.type === 'api_call').length
            },
            daily: {
                ...this.dailyStats,
                errorRate: this.dailyStats.api.requests > 0 
                    ? ((this.dailyStats.api.errors / this.dailyStats.api.requests) * 100).toFixed(2) 
                    : 0
            },
            trends: {
                topPages: [],
                featureUsage: [],
                userFlow: [],
                performanceMetrics: { avgLoadTime: 0, slowPages: [] }
            }
        };
    }

    getUserEngagementReport(timeframe = '24h') {
        const now = new Date();
        const cutoff = new Date(now - (timeframe === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
        
        const recentEvents = this.events.filter(event => 
            new Date(event.timestamp) > cutoff
        );

        const uniqueUsers = new Set(recentEvents.map(e => e.userId)).size;
        const pageViews = recentEvents.filter(e => e.type === 'page_view').length;
        const featureUsages = recentEvents.filter(e => e.type === 'feature_usage').length;

        return {
            timeframe,
            uniqueUsers,
            pageViews,
            featureUsages,
            engagementRate: uniqueUsers > 0 ? (featureUsages / uniqueUsers).toFixed(2) : 0
        };
    }

    cleanupOldEvents() {
        const maxEvents = 10000;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cutoff = new Date(Date.now() - maxAge);

        this.events = this.events
            .filter(event => new Date(event.timestamp) > cutoff)
            .slice(-maxEvents);
    }

    exportData(format = 'json') {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalEvents: this.events.length
            },
            events: this.events,
            dailyStats: this.dailyStats
        };

        return format === 'json' ? JSON.stringify(data, null, 2) : data;
    }
}

module.exports = AnalyticsService;
