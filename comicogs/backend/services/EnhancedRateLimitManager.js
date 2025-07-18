const { redisClient } = require('../cache/RedisManager');
const EventEmitter = require('events');

/**
 * Enhanced Rate Limiting Manager for Task 1
 * Provides sophisticated rate limiting with marketplace-specific rules,
 * sliding window algorithms, and intelligent backoff strategies
 */
class EnhancedRateLimitManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...this.getDefaultConfig(),
            ...config
        };
        
        // In-memory rate limiting state
        this.rateLimitCache = new Map();
        
        // Request tracking for analytics
        this.requestAnalytics = {
            totalRequests: 0,
            rateLimitHits: 0,
            avgWaitTime: 0,
            marketplaceStats: {}
        };
        
        // Initialize marketplace analytics
        this.initializeMarketplaceAnalytics();
        
        // Setup cleanup interval
        this.setupCleanupInterval();
        
        console.log('🚦 Enhanced Rate Limit Manager initialized');
    }

    getDefaultConfig() {
        return {
            // Global limits
            global: {
                requestsPerSecond: 15,
                requestsPerMinute: 600,
                requestsPerHour: 10000,
                burstAllowance: 25
            },
            
            // Marketplace-specific limits
            marketplaces: {
                ebay: {
                    requestsPerSecond: 5,
                    requestsPerMinute: 180,
                    requestsPerHour: 3000,
                    requestsPerDay: 50000,
                    burstAllowance: 20,
                    backoffMultiplier: 1.5,
                    maxBackoffTime: 300000 // 5 minutes
                },
                whatnot: {
                    requestsPerSecond: 2,
                    requestsPerMinute: 60,
                    requestsPerHour: 1200,
                    requestsPerDay: 10000,
                    burstAllowance: 10,
                    backoffMultiplier: 2.0,
                    maxBackoffTime: 600000 // 10 minutes
                },
                comicconnect: {
                    requestsPerSecond: 1,
                    requestsPerMinute: 30,
                    requestsPerHour: 600,
                    requestsPerDay: 5000,
                    burstAllowance: 5,
                    backoffMultiplier: 2.5,
                    maxBackoffTime: 900000 // 15 minutes
                },
                heritage: {
                    requestsPerSecond: 1,
                    requestsPerMinute: 20,
                    requestsPerHour: 400,
                    requestsPerDay: 3000,
                    burstAllowance: 3,
                    backoffMultiplier: 3.0,
                    maxBackoffTime: 1200000 // 20 minutes
                },
                mycomicshop: {
                    requestsPerSecond: 2,
                    requestsPerMinute: 80,
                    requestsPerHour: 1500,
                    requestsPerDay: 15000,
                    burstAllowance: 8,
                    backoffMultiplier: 1.8,
                    maxBackoffTime: 450000 // 7.5 minutes
                },
                amazon: {
                    requestsPerSecond: 1,
                    requestsPerMinute: 30,
                    requestsPerHour: 900,
                    requestsPerDay: 8000,
                    burstAllowance: 5,
                    backoffMultiplier: 2.2,
                    maxBackoffTime: 1800000 // 30 minutes
                }
            },
            
            // Cleanup and maintenance
            cleanup: {
                interval: 300000, // 5 minutes
                maxCacheSize: 10000,
                retentionTime: 86400000 // 24 hours
            },
            
            // Redis configuration
            redis: {
                enabled: true,
                keyPrefix: 'rate_limit:',
                distributedLocking: true
            }
        };
    }

    initializeMarketplaceAnalytics() {
        Object.keys(this.config.marketplaces).forEach(marketplace => {
            this.requestAnalytics.marketplaceStats[marketplace] = {
                totalRequests: 0,
                rateLimitHits: 0,
                avgWaitTime: 0,
                totalWaitTime: 0,
                consecutiveHits: 0,
                lastHitTime: null,
                backoffLevel: 0
            };
        });
    }

    /**
     * Main rate limiting enforcement method
     */
    async enforceRateLimit(marketplace, requestType = 'search', options = {}) {
        const startTime = Date.now();
        this.requestAnalytics.totalRequests++;
        
        try {
            // Check global limits first
            await this.checkGlobalRateLimit();
            
            // Then check marketplace-specific limits
            await this.checkMarketplaceRateLimit(marketplace, requestType, options);
            
            // Update analytics
            this.updateRequestAnalytics(marketplace, Date.now() - startTime);
            
            return true;
            
        } catch (error) {
            // Rate limit hit
            this.requestAnalytics.rateLimitHits++;
            this.updateRateLimitHit(marketplace, error.waitTime || 0);
            
            throw error;
        }
    }

    /**
     * Check global rate limits across all marketplaces
     */
    async checkGlobalRateLimit() {
        const globalKey = 'global';
        const now = Date.now();
        
        // Check per-second limit
        await this.checkSlidingWindowLimit(
            globalKey,
            'second',
            this.config.global.requestsPerSecond,
            1000
        );
        
        // Check per-minute limit
        await this.checkSlidingWindowLimit(
            globalKey,
            'minute',
            this.config.global.requestsPerMinute,
            60000
        );
        
        // Check per-hour limit
        await this.checkSlidingWindowLimit(
            globalKey,
            'hour',
            this.config.global.requestsPerHour,
            3600000
        );
        
        // Check burst allowance
        await this.checkBurstLimit(globalKey, this.config.global.burstAllowance);
    }

    /**
     * Check marketplace-specific rate limits
     */
    async checkMarketplaceRateLimit(marketplace, requestType, options) {
        const marketplaceConfig = this.config.marketplaces[marketplace];
        if (!marketplaceConfig) {
            throw new Error(`Unknown marketplace: ${marketplace}`);
        }
        
        const key = `${marketplace}:${requestType}`;
        
        // Apply intelligent backoff if consecutive hits detected
        await this.applyIntelligentBackoff(marketplace);
        
        // Check per-second limit
        if (marketplaceConfig.requestsPerSecond) {
            await this.checkSlidingWindowLimit(
                key,
                'second',
                marketplaceConfig.requestsPerSecond,
                1000
            );
        }
        
        // Check per-minute limit
        if (marketplaceConfig.requestsPerMinute) {
            await this.checkSlidingWindowLimit(
                key,
                'minute',
                marketplaceConfig.requestsPerMinute,
                60000
            );
        }
        
        // Check per-hour limit
        if (marketplaceConfig.requestsPerHour) {
            await this.checkSlidingWindowLimit(
                key,
                'hour',
                marketplaceConfig.requestsPerHour,
                3600000
            );
        }
        
        // Check per-day limit
        if (marketplaceConfig.requestsPerDay) {
            await this.checkSlidingWindowLimit(
                key,
                'day',
                marketplaceConfig.requestsPerDay,
                86400000
            );
        }
        
        // Check burst allowance
        await this.checkBurstLimit(key, marketplaceConfig.burstAllowance);
    }

    /**
     * Sliding window rate limiting algorithm
     */
    async checkSlidingWindowLimit(key, timeWindow, limit, windowSizeMs) {
        const now = Date.now();
        const windowStart = now - windowSizeMs;
        const cacheKey = `${key}:${timeWindow}`;
        
        // Get or create window data
        let windowData = this.rateLimitCache.get(cacheKey);
        if (!windowData) {
            windowData = {
                requests: [],
                lastCleanup: now
            };
            this.rateLimitCache.set(cacheKey, windowData);
        }
        
        // Clean old requests (sliding window)
        windowData.requests = windowData.requests.filter(
            requestTime => requestTime > windowStart
        );
        
        // Check if we've hit the limit
        if (windowData.requests.length >= limit) {
            const oldestRequest = Math.min(...windowData.requests);
            const waitTime = (oldestRequest + windowSizeMs) - now;
            
            if (waitTime > 0) {
                const error = new Error(`Rate limit exceeded for ${key} (${timeWindow})`);
                error.waitTime = waitTime;
                error.timeWindow = timeWindow;
                error.limit = limit;
                error.currentCount = windowData.requests.length;
                
                throw error;
            }
        }
        
        // Add current request to window
        windowData.requests.push(now);
        windowData.lastCleanup = now;
        
        // Update Redis if enabled
        if (this.config.redis.enabled && redisClient) {
            await this.updateRedisWindow(cacheKey, windowData, windowSizeMs);
        }
    }

    /**
     * Check burst allowance (short-term high-frequency requests)
     */
    async checkBurstLimit(key, burstAllowance) {
        const now = Date.now();
        const burstWindow = 5000; // 5 seconds
        const burstKey = `${key}:burst`;
        
        let burstData = this.rateLimitCache.get(burstKey);
        if (!burstData) {
            burstData = {
                requests: [],
                lastReset: now
            };
            this.rateLimitCache.set(burstKey, burstData);
        }
        
        // Reset burst window if enough time has passed
        if (now - burstData.lastReset > burstWindow) {
            burstData.requests = [];
            burstData.lastReset = now;
        }
        
        // Check burst limit
        if (burstData.requests.length >= burstAllowance) {
            const waitTime = burstWindow - (now - burstData.lastReset);
            
            if (waitTime > 0) {
                const error = new Error(`Burst limit exceeded for ${key}`);
                error.waitTime = waitTime;
                error.timeWindow = 'burst';
                error.limit = burstAllowance;
                error.currentCount = burstData.requests.length;
                
                throw error;
            }
        }
        
        // Add current request to burst window
        burstData.requests.push(now);
    }

    /**
     * Intelligent backoff strategy based on consecutive rate limit hits
     */
    async applyIntelligentBackoff(marketplace) {
        const stats = this.requestAnalytics.marketplaceStats[marketplace];
        if (!stats) return;
        
        const marketplaceConfig = this.config.marketplaces[marketplace];
        const now = Date.now();
        
        // Check if we have consecutive hits
        if (stats.consecutiveHits > 0) {
            const timeSinceLastHit = now - (stats.lastHitTime || 0);
            const backoffTime = Math.min(
                1000 * Math.pow(marketplaceConfig.backoffMultiplier, stats.backoffLevel),
                marketplaceConfig.maxBackoffTime
            );
            
            if (timeSinceLastHit < backoffTime) {
                const waitTime = backoffTime - timeSinceLastHit;
                
                console.log(`🔄 Intelligent backoff for ${marketplace}: waiting ${waitTime}ms (level ${stats.backoffLevel})`);
                
                await this.delay(waitTime);
                
                // Emit backoff event
                this.emit('backoffApplied', {
                    marketplace,
                    waitTime,
                    backoffLevel: stats.backoffLevel,
                    consecutiveHits: stats.consecutiveHits
                });
            }
        }
    }

    /**
     * Update Redis with sliding window data
     */
    async updateRedisWindow(cacheKey, windowData, windowSizeMs) {
        try {
            const redisKey = `${this.config.redis.keyPrefix}${cacheKey}`;
            
            // Use Redis sorted set for efficient sliding window
            const now = Date.now();
            const windowStart = now - windowSizeMs;
            
            // Remove old entries
            await redisClient.zremrangebyscore(redisKey, 0, windowStart);
            
            // Add current request
            await redisClient.zadd(redisKey, now, `${now}:${Math.random()}`);
            
            // Set expiration
            await redisClient.expire(redisKey, Math.ceil(windowSizeMs / 1000));
            
        } catch (error) {
            console.warn('Redis rate limit update failed:', error.message);
        }
    }

    /**
     * Update request analytics
     */
    updateRequestAnalytics(marketplace, responseTime) {
        const stats = this.requestAnalytics.marketplaceStats[marketplace];
        if (!stats) return;
        
        stats.totalRequests++;
        stats.avgWaitTime = stats.avgWaitTime === 0 ? 
            responseTime : 
            (stats.avgWaitTime + responseTime) / 2;
        
        // Reset consecutive hits on successful request
        if (stats.consecutiveHits > 0) {
            stats.consecutiveHits = 0;
            stats.backoffLevel = Math.max(0, stats.backoffLevel - 1);
        }
    }

    /**
     * Update rate limit hit analytics
     */
    updateRateLimitHit(marketplace, waitTime) {
        const stats = this.requestAnalytics.marketplaceStats[marketplace];
        if (!stats) return;
        
        stats.rateLimitHits++;
        stats.consecutiveHits++;
        stats.lastHitTime = Date.now();
        stats.totalWaitTime += waitTime;
        stats.backoffLevel = Math.min(stats.backoffLevel + 1, 10); // Max backoff level
        
        // Update average wait time
        stats.avgWaitTime = stats.totalWaitTime / stats.rateLimitHits;
        
        // Emit rate limit hit event
        this.emit('rateLimitHit', {
            marketplace,
            waitTime,
            consecutiveHits: stats.consecutiveHits,
            backoffLevel: stats.backoffLevel
        });
    }

    /**
     * Get rate limit status for a marketplace
     */
    async getRateLimitStatus(marketplace) {
        const marketplaceConfig = this.config.marketplaces[marketplace];
        if (!marketplaceConfig) {
            throw new Error(`Unknown marketplace: ${marketplace}`);
        }
        
        const now = Date.now();
        const status = {
            marketplace,
            timestamp: now,
            limits: marketplaceConfig,
            currentUsage: {},
            analytics: this.requestAnalytics.marketplaceStats[marketplace]
        };
        
        // Check current usage for each time window
        const timeWindows = [
            { name: 'second', size: 1000, limit: marketplaceConfig.requestsPerSecond },
            { name: 'minute', size: 60000, limit: marketplaceConfig.requestsPerMinute },
            { name: 'hour', size: 3600000, limit: marketplaceConfig.requestsPerHour },
            { name: 'day', size: 86400000, limit: marketplaceConfig.requestsPerDay }
        ];
        
        for (const window of timeWindows) {
            if (window.limit) {
                const key = `${marketplace}:search:${window.name}`;
                const windowData = this.rateLimitCache.get(key);
                
                if (windowData) {
                    const windowStart = now - window.size;
                    const activeRequests = windowData.requests.filter(
                        requestTime => requestTime > windowStart
                    );
                    
                    status.currentUsage[window.name] = {
                        current: activeRequests.length,
                        limit: window.limit,
                        remaining: window.limit - activeRequests.length,
                        resetTime: windowStart + window.size
                    };
                } else {
                    status.currentUsage[window.name] = {
                        current: 0,
                        limit: window.limit,
                        remaining: window.limit,
                        resetTime: now + window.size
                    };
                }
            }
        }
        
        return status;
    }

    /**
     * Get overall rate limiting analytics
     */
    getAnalytics() {
        return {
            global: this.requestAnalytics,
            marketplaces: this.requestAnalytics.marketplaceStats,
            cacheSize: this.rateLimitCache.size,
            timestamp: Date.now()
        };
    }

    /**
     * Reset rate limits for a marketplace (emergency use)
     */
    async resetRateLimit(marketplace) {
        const keysToDelete = [];
        
        for (const [key, value] of this.rateLimitCache.entries()) {
            if (key.startsWith(`${marketplace}:`)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.rateLimitCache.delete(key));
        
        // Reset analytics
        if (this.requestAnalytics.marketplaceStats[marketplace]) {
            this.requestAnalytics.marketplaceStats[marketplace] = {
                totalRequests: 0,
                rateLimitHits: 0,
                avgWaitTime: 0,
                totalWaitTime: 0,
                consecutiveHits: 0,
                lastHitTime: null,
                backoffLevel: 0
            };
        }
        
        // Clear Redis if enabled
        if (this.config.redis.enabled && redisClient) {
            try {
                const pattern = `${this.config.redis.keyPrefix}${marketplace}:*`;
                const keys = await redisClient.keys(pattern);
                
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }
            } catch (error) {
                console.warn('Redis rate limit reset failed:', error.message);
            }
        }
        
        console.log(`🔄 Rate limits reset for ${marketplace}`);
        
        // Emit reset event
        this.emit('rateLimitReset', { marketplace });
    }

    /**
     * Setup cleanup interval to prevent memory leaks
     */
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupCache();
        }, this.config.cleanup.interval);
    }

    /**
     * Clean up old cache entries
     */
    cleanupCache() {
        const now = Date.now();
        const retentionTime = this.config.cleanup.retentionTime;
        let cleanedCount = 0;
        
        for (const [key, value] of this.rateLimitCache.entries()) {
            // Clean old window data
            if (value.lastCleanup && (now - value.lastCleanup) > retentionTime) {
                this.rateLimitCache.delete(key);
                cleanedCount++;
            }
            
            // Clean old requests within windows
            if (value.requests) {
                const initialLength = value.requests.length;
                value.requests = value.requests.filter(
                    requestTime => (now - requestTime) < retentionTime
                );
                
                if (value.requests.length !== initialLength) {
                    cleanedCount++;
                }
            }
        }
        
        // Trim cache if it's too large
        if (this.rateLimitCache.size > this.config.cleanup.maxCacheSize) {
            const entries = Array.from(this.rateLimitCache.entries());
            const toDelete = entries.slice(0, entries.length - this.config.cleanup.maxCacheSize);
            
            toDelete.forEach(([key]) => {
                this.rateLimitCache.delete(key);
                cleanedCount++;
            });
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Rate limit cache cleanup: removed ${cleanedCount} entries`);
        }
    }

    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = EnhancedRateLimitManager; 