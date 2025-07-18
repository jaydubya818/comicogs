/**
 * RateLimiter.js
 * Rate limiting service for notification spam prevention
 * 
 * Handles:
 * - User-specific rate limiting
 * - Notification type-specific limits
 * - Time window-based restrictions
 * - Sliding window algorithm
 * - Burst protection and throttling
 */

class RateLimiter {
    constructor(dependencies = {}) {
        this.database = dependencies.database;
        this.cacheService = dependencies.cacheService;
        
        // Default rate limits (per hour)
        this.DEFAULT_LIMITS = {
            email: {
                perHour: 10,
                perDay: 50,
                burst: 3
            },
            push: {
                perHour: 20,
                perDay: 100,
                burst: 5
            },
            sms: {
                perHour: 5,
                perDay: 20,
                burst: 2
            }
        };
        
        // Notification type specific limits
        this.TYPE_LIMITS = {
            price_alert: {
                perHour: 15,
                perDay: 75,
                burst: 5
            },
            recommendation: {
                perHour: 8,
                perDay: 30,
                burst: 3
            },
            market_movement: {
                perHour: 12,
                perDay: 60,
                burst: 4
            },
            collection_update: {
                perHour: 5,
                perDay: 25,
                burst: 2
            },
            system_alert: {
                perHour: 3,
                perDay: 10,
                burst: 1
            }
        };
        
        // Time windows in milliseconds
        this.TIME_WINDOWS = {
            HOUR: 60 * 60 * 1000,
            DAY: 24 * 60 * 60 * 1000,
            BURST: 5 * 60 * 1000 // 5 minutes for burst protection
        };
        
        // User activity tracking
        this.userActivity = new Map();
        this.isInitialized = false;
        
        // Metrics
        this.metrics = {
            totalChecks: 0,
            blockedRequests: 0,
            allowedRequests: 0,
            byType: {},
            byUser: {}
        };
    }
    
    /**
     * Initialize the rate limiter
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing RateLimiter...');
            
            // Start cleanup interval
            this.startCleanupInterval();
            
            this.isInitialized = true;
            console.log('RateLimiter initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize RateLimiter:', error);
            throw error;
        }
    }
    
    /**
     * Check if request is allowed under rate limits
     */
    async checkLimit(userId, notificationType, channel = 'email') {
        try {
            this.metrics.totalChecks++;
            
            const now = Date.now();
            const userKey = `${userId}_${channel}`;
            const typeKey = `${userId}_${notificationType}`;
            
            // Get or create user activity records
            const userActivity = this.getUserActivity(userKey);
            const typeActivity = this.getTypeActivity(typeKey);
            
            // Check channel limits
            const channelLimits = this.DEFAULT_LIMITS[channel] || this.DEFAULT_LIMITS.email;
            const channelCheck = this.checkChannelLimits(userActivity, channelLimits, now);
            
            // Check type-specific limits
            const typeLimits = this.TYPE_LIMITS[notificationType] || this.TYPE_LIMITS.price_alert;
            const typeCheck = this.checkTypeLimits(typeActivity, typeLimits, now);
            
            // Determine if request is allowed
            const allowed = channelCheck.allowed && typeCheck.allowed;
            
            if (allowed) {
                // Record the request
                this.recordRequest(userActivity, typeActivity, now);
                this.metrics.allowedRequests++;
                
                // Update user metrics
                if (!this.metrics.byUser[userId]) {
                    this.metrics.byUser[userId] = { allowed: 0, blocked: 0 };
                }
                this.metrics.byUser[userId].allowed++;
                
            } else {
                this.metrics.blockedRequests++;
                
                // Update user metrics
                if (!this.metrics.byUser[userId]) {
                    this.metrics.byUser[userId] = { allowed: 0, blocked: 0 };
                }
                this.metrics.byUser[userId].blocked++;
            }
            
            // Update type metrics
            if (!this.metrics.byType[notificationType]) {
                this.metrics.byType[notificationType] = { allowed: 0, blocked: 0 };
            }
            
            if (allowed) {
                this.metrics.byType[notificationType].allowed++;
            } else {
                this.metrics.byType[notificationType].blocked++;
            }
            
            return {
                allowed,
                reason: !allowed ? this.getRejectionReason(channelCheck, typeCheck) : null,
                limits: {
                    channel: channelLimits,
                    type: typeLimits
                },
                usage: {
                    channel: this.getUsageStats(userActivity, now),
                    type: this.getUsageStats(typeActivity, now)
                },
                resetTime: this.getNextResetTime(now)
            };
            
        } catch (error) {
            console.error('Error checking rate limit:', error);
            // Allow request on error to avoid blocking legitimate notifications
            return { allowed: true, error: error.message };
        }
    }
    
    /**
     * Check channel-specific limits
     */
    checkChannelLimits(activity, limits, now) {
        const hourly = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.HOUR);
        const daily = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.DAY);
        const burst = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.BURST);
        
        if (burst >= limits.burst) {
            return { allowed: false, reason: 'burst_limit_exceeded', burst, limit: limits.burst };
        }
        
        if (hourly >= limits.perHour) {
            return { allowed: false, reason: 'hourly_limit_exceeded', hourly, limit: limits.perHour };
        }
        
        if (daily >= limits.perDay) {
            return { allowed: false, reason: 'daily_limit_exceeded', daily, limit: limits.perDay };
        }
        
        return { allowed: true };
    }
    
    /**
     * Check type-specific limits
     */
    checkTypeLimits(activity, limits, now) {
        const hourly = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.HOUR);
        const daily = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.DAY);
        const burst = this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.BURST);
        
        if (burst >= limits.burst) {
            return { allowed: false, reason: 'type_burst_limit_exceeded', burst, limit: limits.burst };
        }
        
        if (hourly >= limits.perHour) {
            return { allowed: false, reason: 'type_hourly_limit_exceeded', hourly, limit: limits.perHour };
        }
        
        if (daily >= limits.perDay) {
            return { allowed: false, reason: 'type_daily_limit_exceeded', daily, limit: limits.perDay };
        }
        
        return { allowed: true };
    }
    
    /**
     * Record a successful request
     */
    recordRequest(userActivity, typeActivity, timestamp) {
        userActivity.requests.push(timestamp);
        typeActivity.requests.push(timestamp);
        
        // Keep only recent requests to manage memory
        const cutoff = timestamp - this.TIME_WINDOWS.DAY;
        userActivity.requests = userActivity.requests.filter(req => req > cutoff);
        typeActivity.requests = typeActivity.requests.filter(req => req > cutoff);
    }
    
    /**
     * Count requests in a time window
     */
    countRequestsInWindow(requests, now, windowMs) {
        const cutoff = now - windowMs;
        return requests.filter(timestamp => timestamp > cutoff).length;
    }
    
    /**
     * Get or create user activity record
     */
    getUserActivity(userKey) {
        if (!this.userActivity.has(userKey)) {
            this.userActivity.set(userKey, {
                requests: [],
                createdAt: Date.now()
            });
        }
        return this.userActivity.get(userKey);
    }
    
    /**
     * Get or create type activity record
     */
    getTypeActivity(typeKey) {
        if (!this.userActivity.has(typeKey)) {
            this.userActivity.set(typeKey, {
                requests: [],
                createdAt: Date.now()
            });
        }
        return this.userActivity.get(typeKey);
    }
    
    /**
     * Get usage statistics
     */
    getUsageStats(activity, now) {
        return {
            lastHour: this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.HOUR),
            lastDay: this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.DAY),
            lastBurst: this.countRequestsInWindow(activity.requests, now, this.TIME_WINDOWS.BURST)
        };
    }
    
    /**
     * Get next reset time
     */
    getNextResetTime(now) {
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        
        return {
            nextHourReset: nextHour.getTime(),
            nextDayReset: nextDay.getTime()
        };
    }
    
    /**
     * Get rejection reason
     */
    getRejectionReason(channelCheck, typeCheck) {
        if (!channelCheck.allowed) {
            return channelCheck.reason;
        }
        if (!typeCheck.allowed) {
            return typeCheck.reason;
        }
        return 'unknown';
    }
    
    /**
     * Set custom limits for a user
     */
    async setUserLimits(userId, channel, limits) {
        try {
            // This would typically save to database
            console.log(`Setting custom limits for user ${userId} on ${channel}:`, limits);
            
            // For now, just validate the limits
            this.validateLimits(limits);
            
            return true;
        } catch (error) {
            console.error('Error setting user limits:', error);
            throw error;
        }
    }
    
    /**
     * Validate limit configuration
     */
    validateLimits(limits) {
        if (typeof limits.perHour !== 'number' || limits.perHour < 0) {
            throw new Error('perHour must be a non-negative number');
        }
        if (typeof limits.perDay !== 'number' || limits.perDay < 0) {
            throw new Error('perDay must be a non-negative number');
        }
        if (typeof limits.burst !== 'number' || limits.burst < 0) {
            throw new Error('burst must be a non-negative number');
        }
        if (limits.perHour > limits.perDay) {
            throw new Error('perHour cannot be greater than perDay');
        }
    }
    
    /**
     * Get user rate limit status
     */
    async getUserStatus(userId, channel = 'email') {
        try {
            const userKey = `${userId}_${channel}`;
            const activity = this.userActivity.get(userKey);
            
            if (!activity) {
                return {
                    userId,
                    channel,
                    usage: { lastHour: 0, lastDay: 0, lastBurst: 0 },
                    limits: this.DEFAULT_LIMITS[channel] || this.DEFAULT_LIMITS.email
                };
            }
            
            const now = Date.now();
            return {
                userId,
                channel,
                usage: this.getUsageStats(activity, now),
                limits: this.DEFAULT_LIMITS[channel] || this.DEFAULT_LIMITS.email,
                resetTime: this.getNextResetTime(now)
            };
            
        } catch (error) {
            console.error('Error getting user status:', error);
            throw error;
        }
    }
    
    /**
     * Reset user limits (admin function)
     */
    async resetUserLimits(userId, channel = null) {
        try {
            if (channel) {
                const userKey = `${userId}_${channel}`;
                this.userActivity.delete(userKey);
            } else {
                // Reset all channels for user
                for (const [key] of this.userActivity) {
                    if (key.startsWith(`${userId}_`)) {
                        this.userActivity.delete(key);
                    }
                }
            }
            
            console.log(`Reset rate limits for user ${userId}${channel ? ` on ${channel}` : ''}`);
            return true;
            
        } catch (error) {
            console.error('Error resetting user limits:', error);
            throw error;
        }
    }
    
    /**
     * Start cleanup interval to remove old activity records
     */
    startCleanupInterval() {
        // Clean up every hour
        setInterval(() => {
            this.cleanupOldRecords();
        }, this.TIME_WINDOWS.HOUR);
    }
    
    /**
     * Clean up old activity records
     */
    cleanupOldRecords() {
        const now = Date.now();
        const cutoff = now - this.TIME_WINDOWS.DAY * 2; // Keep 2 days of data
        
        let cleaned = 0;
        
        for (const [key, activity] of this.userActivity) {
            // Remove old requests
            const originalLength = activity.requests.length;
            activity.requests = activity.requests.filter(timestamp => timestamp > cutoff);
            
            // Remove entirely empty records older than cutoff
            if (activity.requests.length === 0 && activity.createdAt < cutoff) {
                this.userActivity.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} old rate limit records`);
        }
    }
    
    /**
     * Get overall rate limiter metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeUsers: this.userActivity.size,
            blockRate: this.metrics.totalChecks > 0 ? 
                (this.metrics.blockedRequests / this.metrics.totalChecks * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalChecks: 0,
            blockedRequests: 0,
            allowedRequests: 0,
            byType: {},
            byUser: {}
        };
    }
    
    /**
     * Get detailed user activity (admin function)
     */
    getUserActivity(userId) {
        const userRecords = {};
        
        for (const [key, activity] of this.userActivity) {
            if (key.startsWith(`${userId}_`)) {
                const channel = key.split('_').slice(1).join('_');
                userRecords[channel] = {
                    requestCount: activity.requests.length,
                    lastRequest: activity.requests.length > 0 ? 
                        new Date(Math.max(...activity.requests)).toISOString() : null,
                    createdAt: new Date(activity.createdAt).toISOString()
                };
            }
        }
        
        return userRecords;
    }
    
    /**
     * Check if user is currently rate limited
     */
    async isUserLimited(userId, notificationType, channel = 'email') {
        const result = await this.checkLimit(userId, notificationType, channel);
        return !result.allowed;
    }
    
    /**
     * Get time until user can send next notification
     */
    async getWaitTime(userId, notificationType, channel = 'email') {
        const result = await this.checkLimit(userId, notificationType, channel);
        
        if (result.allowed) {
            return 0;
        }
        
        const now = Date.now();
        
        if (result.reason?.includes('burst')) {
            return this.TIME_WINDOWS.BURST - (now % this.TIME_WINDOWS.BURST);
        } else if (result.reason?.includes('hourly')) {
            return result.resetTime.nextHourReset - now;
        } else if (result.reason?.includes('daily')) {
            return result.resetTime.nextDayReset - now;
        }
        
        return this.TIME_WINDOWS.HOUR; // Default to 1 hour
    }
}

module.exports = RateLimiter; 