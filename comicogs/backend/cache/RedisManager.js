const Redis = require('ioredis');
const crypto = require('crypto');

/**
 * Redis Manager - Task 9 Implementation
 * High-performance caching layer with intelligent strategies
 */
class RedisManager {
    constructor() {
        this.redis = null;
        this.redisCluster = null;
        this.isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
        
        this.config = {
            // Connection settings
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || null,
            db: process.env.REDIS_DB || 0,
            
            // Performance settings
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            maxMemoryPolicy: 'allkeys-lru',
            
            // Connection pool
            lazyConnect: true,
            enableOfflineQueue: false,
            connectionTimeout: 10000,
            commandTimeout: 5000,
            
            // Cluster settings (if enabled)
            clusterRetryDelayOnFailover: 100,
            clusterRetryDelayOnClusterDown: 300,
            clusterMaxRedirections: 16
        };

        // Cache TTL settings (in seconds)
        this.ttl = {
            pricing_current: 900,        // 15 minutes
            pricing_history: 3600,       // 1 hour  
            pricing_aggregates: 1800,    // 30 minutes
            market_insights: 600,        // 10 minutes
            user_collections: 300,       // 5 minutes
            search_results: 180,         // 3 minutes
            trending_comics: 900,        // 15 minutes
            user_sessions: 86400,        // 24 hours
            api_rate_limits: 60,         // 1 minute
            long_term: 86400 * 7        // 1 week
        };

        // Cache key prefixes for organization
        this.prefixes = {
            pricing: 'price:',
            aggregates: 'agg:',
            insights: 'insights:',
            collections: 'col:',
            users: 'user:',
            search: 'search:',
            trending: 'trend:',
            sessions: 'sess:',
            ratelimit: 'rate:',
            locks: 'lock:',
            queues: 'queue:'
        };

        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            avgResponseTime: 0
        };

        console.log('🔧 RedisManager initialized');
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            if (this.isClusterMode) {
                await this.connectCluster();
            } else {
                await this.connectSingle();
            }

            await this.setupEventHandlers();
            await this.configureServer();
            
            console.log('✅ Redis connected successfully');
            return true;

        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            throw error;
        }
    }

    /**
     * Connect to single Redis instance
     */
    async connectSingle() {
        this.redis = new Redis({
            ...this.config,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        await this.redis.ping();
    }

    /**
     * Connect to Redis Cluster
     */
    async connectCluster() {
        const clusterNodes = process.env.REDIS_CLUSTER_NODES 
            ? process.env.REDIS_CLUSTER_NODES.split(',')
            : [{ host: this.config.host, port: this.config.port }];

        this.redisCluster = new Redis.Cluster(clusterNodes, {
            redisOptions: this.config,
            clusterRetryDelayOnFailover: this.config.clusterRetryDelayOnFailover,
            clusterRetryDelayOnClusterDown: this.config.clusterRetryDelayOnClusterDown,
            clusterMaxRedirections: this.config.clusterMaxRedirections
        });

        this.redis = this.redisCluster;
        await this.redis.ping();
    }

    /**
     * Set up Redis event handlers
     */
    async setupEventHandlers() {
        this.redis.on('connect', () => {
            console.log('🔗 Redis connected');
        });

        this.redis.on('error', (error) => {
            console.error('❌ Redis error:', error);
            this.metrics.errors++;
        });

        this.redis.on('close', () => {
            console.log('🔴 Redis connection closed');
        });

        this.redis.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });
    }

    /**
     * Configure Redis server settings
     */
    async configureServer() {
        try {
            // Set memory policy
            await this.redis.config('SET', 'maxmemory-policy', this.config.maxMemoryPolicy);
            
            // Enable key expiration notifications (for cache invalidation)
            await this.redis.config('SET', 'notify-keyspace-events', 'Ex');
            
            console.log('⚙️ Redis server configured');
        } catch (error) {
            console.warn('⚠️ Could not configure Redis server:', error.message);
        }
    }

    // ==========================================
    // PRICING DATA CACHING
    // ==========================================

    /**
     * Cache current pricing data for a comic
     */
    async cachePricingData(comicId, condition, pricingData) {
        const key = this.buildKey('pricing', `${comicId}:${condition}:current`);
        return await this.setWithMetrics(key, pricingData, this.ttl.pricing_current);
    }

    /**
     * Get cached pricing data
     */
    async getPricingData(comicId, condition) {
        const key = this.buildKey('pricing', `${comicId}:${condition}:current`);
        return await this.getWithMetrics(key);
    }

    /**
     * Cache pricing aggregates (fast lookup data)
     */
    async cachePricingAggregates(comicId, aggregates) {
        const key = this.buildKey('aggregates', comicId);
        return await this.setWithMetrics(key, aggregates, this.ttl.pricing_aggregates);
    }

    /**
     * Get cached pricing aggregates
     */
    async getPricingAggregates(comicId) {
        const key = this.buildKey('aggregates', comicId);
        return await this.getWithMetrics(key);
    }

    /**
     * Cache market insights for a comic
     */
    async cacheMarketInsights(comicId, insights) {
        const key = this.buildKey('insights', comicId);
        return await this.setWithMetrics(key, insights, this.ttl.market_insights);
    }

    /**
     * Get cached market insights
     */
    async getMarketInsights(comicId) {
        const key = this.buildKey('insights', comicId);
        return await this.getWithMetrics(key);
    }

    // ==========================================
    // USER DATA CACHING
    // ==========================================

    /**
     * Cache user collection data
     */
    async cacheUserCollection(userId, collectionData) {
        const key = this.buildKey('collections', `${userId}:full`);
        return await this.setWithMetrics(key, collectionData, this.ttl.user_collections);
    }

    /**
     * Get cached user collection
     */
    async getUserCollection(userId) {
        const key = this.buildKey('collections', `${userId}:full`);
        return await this.getWithMetrics(key);
    }

    /**
     * Cache user session data
     */
    async cacheUserSession(sessionId, sessionData) {
        const key = this.buildKey('sessions', sessionId);
        return await this.setWithMetrics(key, sessionData, this.ttl.user_sessions);
    }

    /**
     * Get cached user session
     */
    async getUserSession(sessionId) {
        const key = this.buildKey('sessions', sessionId);
        return await this.getWithMetrics(key);
    }

    // ==========================================
    // SEARCH AND TRENDING DATA
    // ==========================================

    /**
     * Cache search results
     */
    async cacheSearchResults(query, filters, results) {
        const key = this.buildKey('search', this.hashQuery(query, filters));
        return await this.setWithMetrics(key, results, this.ttl.search_results);
    }

    /**
     * Get cached search results
     */
    async getSearchResults(query, filters) {
        const key = this.buildKey('search', this.hashQuery(query, filters));
        return await this.getWithMetrics(key);
    }

    /**
     * Cache trending comics data
     */
    async cacheTrendingComics(timeframe, trendingData) {
        const key = this.buildKey('trending', timeframe);
        return await this.setWithMetrics(key, trendingData, this.ttl.trending_comics);
    }

    /**
     * Get cached trending comics
     */
    async getTrendingComics(timeframe) {
        const key = this.buildKey('trending', timeframe);
        return await this.getWithMetrics(key);
    }

    // ==========================================
    // ADVANCED CACHING FEATURES
    // ==========================================

    /**
     * Cache with automatic compression for large objects
     */
    async cacheCompressed(key, data, ttl = 3600) {
        try {
            const serialized = JSON.stringify(data);
            
            // Compress if data is larger than 1KB
            if (serialized.length > 1024) {
                const zlib = require('zlib');
                const compressed = zlib.gzipSync(serialized);
                await this.setWithMetrics(`${key}:gz`, compressed.toString('base64'), ttl);
                return true;
            } else {
                await this.setWithMetrics(key, data, ttl);
                return true;
            }
        } catch (error) {
            console.error('Error caching compressed data:', error);
            return false;
        }
    }

    /**
     * Get compressed cached data
     */
    async getCompressed(key) {
        try {
            // Try compressed version first
            const compressed = await this.getWithMetrics(`${key}:gz`);
            if (compressed) {
                const zlib = require('zlib');
                const decompressed = zlib.gunzipSync(Buffer.from(compressed, 'base64'));
                return JSON.parse(decompressed.toString());
            }

            // Fall back to regular version
            return await this.getWithMetrics(key);
        } catch (error) {
            console.error('Error getting compressed data:', error);
            return null;
        }
    }

    /**
     * Multi-get for batch operations
     */
    async mget(keys) {
        try {
            const start = Date.now();
            const results = await this.redis.mget(...keys);
            
            this.updateResponseTime(Date.now() - start);
            
            return results.map(result => {
                if (result) {
                    this.metrics.hits++;
                    try {
                        return JSON.parse(result);
                    } catch {
                        return result;
                    }
                } else {
                    this.metrics.misses++;
                    return null;
                }
            });
        } catch (error) {
            console.error('Redis mget error:', error);
            this.metrics.errors++;
            return new Array(keys.length).fill(null);
        }
    }

    /**
     * Multi-set for batch operations
     */
    async mset(keyValuePairs, ttl = 3600) {
        try {
            const pipeline = this.redis.pipeline();
            
            for (let i = 0; i < keyValuePairs.length; i += 2) {
                const key = keyValuePairs[i];
                const value = keyValuePairs[i + 1];
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                
                pipeline.setex(key, ttl, serialized);
            }
            
            await pipeline.exec();
            this.metrics.sets += keyValuePairs.length / 2;
            return true;
        } catch (error) {
            console.error('Redis mset error:', error);
            this.metrics.errors++;
            return false;
        }
    }

    // ==========================================
    // CACHE INVALIDATION
    // ==========================================

    /**
     * Invalidate pricing cache for a comic
     */
    async invalidatePricingCache(comicId) {
        const patterns = [
            this.buildKey('pricing', `${comicId}:*`),
            this.buildKey('aggregates', comicId),
            this.buildKey('insights', comicId)
        ];
        
        await this.deleteByPatterns(patterns);
    }

    /**
     * Invalidate user cache
     */
    async invalidateUserCache(userId) {
        const patterns = [
            this.buildKey('collections', `${userId}:*`),
            this.buildKey('user', `${userId}:*`)
        ];
        
        await this.deleteByPatterns(patterns);
    }

    /**
     * Invalidate search cache (when new comics added)
     */
    async invalidateSearchCache() {
        const pattern = this.buildKey('search', '*');
        await this.deleteByPatterns([pattern]);
    }

    /**
     * Smart cache warming for frequently accessed data
     */
    async warmCache(comicIds) {
        console.log(`🔥 Warming cache for ${comicIds.length} comics...`);
        
        const pipeline = this.redis.pipeline();
        
        for (const comicId of comicIds) {
            // Pre-cache placeholder to prevent thundering herd
            const lockKey = this.buildKey('locks', `warm:${comicId}`);
            pipeline.setex(lockKey, 300, 'warming'); // 5 minute lock
        }
        
        await pipeline.exec();
        console.log('✅ Cache warming locks set');
    }

    // ==========================================
    // RATE LIMITING
    // ==========================================

    /**
     * Rate limiting with sliding window
     */
    async checkRateLimit(userId, action, limit = 100, windowSeconds = 60) {
        const key = this.buildKey('ratelimit', `${userId}:${action}`);
        const now = Date.now();
        const windowStart = now - (windowSeconds * 1000);
        
        try {
            const pipeline = this.redis.pipeline();
            
            // Remove old entries
            pipeline.zremrangebyscore(key, '-inf', windowStart);
            
            // Add current request
            pipeline.zadd(key, now, now);
            
            // Get count
            pipeline.zcard(key);
            
            // Set expiration
            pipeline.expire(key, windowSeconds);
            
            const results = await pipeline.exec();
            const count = results[2][1]; // Get zcard result
            
            return {
                allowed: count <= limit,
                count: count,
                limit: limit,
                windowSeconds: windowSeconds,
                resetTime: now + (windowSeconds * 1000)
            };
        } catch (error) {
            console.error('Rate limit check error:', error);
            // Allow request on error (fail open)
            return { allowed: true, count: 0, limit: limit };
        }
    }

    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================

    /**
     * Get cache performance metrics
     */
    getMetrics() {
        const totalRequests = this.metrics.hits + this.metrics.misses;
        const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests * 100).toFixed(2) : 0;
        
        return {
            ...this.metrics,
            hitRate: `${hitRate}%`,
            totalRequests,
            connectionStatus: this.redis ? 'connected' : 'disconnected',
            isCluster: this.isClusterMode
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            avgResponseTime: 0
        };
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Build cache key with prefix
     */
    buildKey(prefix, suffix) {
        const prefixStr = this.prefixes[prefix] || `${prefix}:`;
        return `comiccomp:${prefixStr}${suffix}`;
    }

    /**
     * Hash query for consistent caching
     */
    hashQuery(query, filters = {}) {
        const combined = JSON.stringify({ query, filters });
        return crypto.createHash('md5').update(combined).digest('hex');
    }

    /**
     * Set with metrics tracking
     */
    async setWithMetrics(key, value, ttl = 3600) {
        try {
            const start = Date.now();
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            
            await this.redis.setex(key, ttl, serialized);
            
            this.metrics.sets++;
            this.updateResponseTime(Date.now() - start);
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Get with metrics tracking
     */
    async getWithMetrics(key) {
        try {
            const start = Date.now();
            const result = await this.redis.get(key);
            
            this.updateResponseTime(Date.now() - start);
            
            if (result) {
                this.metrics.hits++;
                try {
                    return JSON.parse(result);
                } catch {
                    return result;
                }
            } else {
                this.metrics.misses++;
                return null;
            }
        } catch (error) {
            console.error('Redis get error:', error);
            this.metrics.errors++;
            return null;
        }
    }

    /**
     * Delete by patterns
     */
    async deleteByPatterns(patterns) {
        try {
            for (const pattern of patterns) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    this.metrics.deletes += keys.length;
                }
            }
        } catch (error) {
            console.error('Redis delete by pattern error:', error);
            this.metrics.errors++;
        }
    }

    /**
     * Update average response time
     */
    updateResponseTime(responseTime) {
        this.metrics.avgResponseTime = 
            (this.metrics.avgResponseTime + responseTime) / 2;
    }

    /**
     * Graceful shutdown
     */
    async disconnect() {
        try {
            if (this.redis) {
                await this.redis.quit();
                console.log('✅ Redis disconnected gracefully');
            }
        } catch (error) {
            console.error('❌ Redis disconnect error:', error);
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const start = Date.now();
            await this.redis.ping();
            const latency = Date.now() - start;
            
            const info = await this.redis.info('memory');
            const memoryInfo = this.parseRedisInfo(info);
            
            return {
                status: 'healthy',
                latency: `${latency}ms`,
                memory: memoryInfo,
                metrics: this.getMetrics()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                metrics: this.getMetrics()
            };
        }
    }

    /**
     * Parse Redis INFO output
     */
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const result = {};
        
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = value;
            }
        }
        
        return {
            usedMemory: result.used_memory_human,
            maxMemory: result.maxmemory_human || 'unlimited',
            memoryUsagePercent: result.used_memory_rss_human
        };
    }
}

// Singleton instance
let redisManagerInstance = null;

module.exports = {
    RedisManager,
    getInstance: () => {
        if (!redisManagerInstance) {
            redisManagerInstance = new RedisManager();
        }
        return redisManagerInstance;
    }
}; 