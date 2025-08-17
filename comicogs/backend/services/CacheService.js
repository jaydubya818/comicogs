const Redis = require('redis');
const crypto = require('crypto');
const zlib = require('zlib');
const util = require('util');

/**
 * Comprehensive Multi-Layer Caching Service
 * L1: In-Memory Cache (LRU)
 * L2: Redis Cache with clustering support
 * Features: Compression, invalidation, warming, monitoring
 */
class CacheService {
  constructor() {
    // L1 Cache: In-Memory LRU
    this.memoryCache = new Map();
    this.maxMemorySize = parseInt(process.env.CACHE_MEMORY_SIZE) || 1000;
    this.memoryHits = 0;
    this.memoryMisses = 0;

    // L2 Cache: Redis
    this.redisClient = null;
    this.redisCluster = null;
    this.isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
    this.fallbackToMemory = true;

    // Cache configuration
    this.config = {
      defaultTTL: 3600, // 1 hour
      compressionThreshold: 1024, // 1KB
      memoryEvictionPolicy: 'lru',
      redisConfig: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectionTimeout: 10000,
        commandTimeout: 5000
      }
    };

    // Performance metrics
    this.metrics = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 },
      totalRequests: 0,
      avgResponseTime: 0,
      compressionRatio: 0
    };

    // TTL configurations for different data types
    this.ttlConfig = {
      comics: 1800,        // 30 minutes
      marketplace: 300,    // 5 minutes
      pricing: 7200,       // 2 hours
      collections: 3600,   // 1 hour
      sessions: 86400,     // 24 hours
      analytics: 1800,     // 30 minutes
      search: 180,         // 3 minutes
      trending: 900,       // 15 minutes
      userProfiles: 3600   // 1 hour
    };

    this.init();
  }

  async init() {
    try {
      await this.connectRedis();
      this.setupEventHandlers();
      this.startCleanupRoutine();
      console.log('✅ Multi-layer cache initialized successfully');
    } catch (error) {
      console.warn('⚠️ Redis unavailable, falling back to memory-only cache:', error.message);
      this.fallbackToMemory = true;
    }
  }

  async connectRedis() {
    if (this.isClusterMode) {
      await this.connectCluster();
    } else {
      await this.connectSingle();
    }
  }

  async connectSingle() {
    this.redisClient = Redis.createClient(this.config.redisConfig);
    
    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.metrics.l2.errors++;
      this.fallbackToMemory = true;
    });

    this.redisClient.on('connect', () => {
      console.log('✅ Redis L2 Cache Connected');
      this.fallbackToMemory = false;
    });

    this.redisClient.on('disconnect', () => {
      console.warn('⚠️ Redis disconnected, using L1 cache only');
      this.fallbackToMemory = true;
    });

    await this.redisClient.connect();
  }

  async connectCluster() {
    const Redis_IORedis = require('ioredis');
    const clusterNodes = process.env.REDIS_CLUSTER_NODES 
      ? process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        })
      : [{ host: 'localhost', port: 6379 }];

    this.redisCluster = new Redis_IORedis.Cluster(clusterNodes, {
      redisOptions: this.config.redisConfig,
      clusterRetryDelayOnFailover: 100,
      clusterRetryDelayOnClusterDown: 300,
      clusterMaxRedirections: 16
    });

    this.redisClient = this.redisCluster;
    this.setupClusterEvents();
  }

  setupEventHandlers() {
    if (!this.redisClient) return;

    this.redisClient.on('ready', () => {
      console.log('🚀 Redis cache ready for operations');
      this.fallbackToMemory = false;
    });

    this.redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  setupClusterEvents() {
    this.redisCluster.on('node error', (err, node) => {
      console.error(`Redis cluster node error (${node.options.host}:${node.options.port}):`, err);
    });
  }

  startCleanupRoutine() {
    // Clean up expired memory cache entries every 5 minutes
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
  }

  // ==========================================
  // MULTI-LAYER CACHE OPERATIONS
  // ==========================================

  /**
   * Get from cache with L1 -> L2 fallback
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Try L1 cache first
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.metrics.l1.hits++;
        this.updateResponseTime(startTime);
        return memoryResult.value;
      }
      this.metrics.l1.misses++;

      // Try L2 cache (Redis)
      if (!this.fallbackToMemory && this.redisClient) {
        const redisResult = await this.getFromRedis(key);
        if (redisResult !== null) {
          this.metrics.l2.hits++;
          // Populate L1 cache with result
          this.setInMemory(key, redisResult, options.ttl || this.config.defaultTTL);
          this.updateResponseTime(startTime);
          return redisResult;
        }
        this.metrics.l2.misses++;
      }

      this.updateResponseTime(startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.l2.errors++;
      this.updateResponseTime(startTime);
      return null;
    }
  }

  /**
   * Set in both L1 and L2 caches
   */
  async set(key, value, ttl = null, options = {}) {
    const finalTTL = ttl || this.config.defaultTTL;
    const compress = options.compress !== false && this.shouldCompress(value);
    
    try {
      // Set in L1 cache
      this.setInMemory(key, value, finalTTL);
      this.metrics.l1.sets++;

      // Set in L2 cache if available
      if (!this.fallbackToMemory && this.redisClient) {
        await this.setInRedis(key, value, finalTTL, compress);
        this.metrics.l2.sets++;
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      this.metrics.l2.errors++;
      return false;
    }
  }

  /**
   * Delete from both caches
   */
  async del(key) {
    try {
      // Delete from L1
      this.deleteFromMemory(key);
      this.metrics.l1.deletes++;

      // Delete from L2 if available
      if (!this.fallbackToMemory && this.redisClient) {
        await this.redisClient.del(key);
        this.metrics.l2.deletes++;
      }

      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      this.metrics.l2.errors++;
      return false;
    }
  }

  /**
   * Multi-get operation
   */
  async mget(keys) {
    const results = new Array(keys.length).fill(null);
    const missedKeys = [];
    const missedIndexes = [];

    // Check L1 cache first
    for (let i = 0; i < keys.length; i++) {
      const memoryResult = this.getFromMemory(keys[i]);
      if (memoryResult !== null) {
        results[i] = memoryResult.value;
        this.metrics.l1.hits++;
      } else {
        missedKeys.push(keys[i]);
        missedIndexes.push(i);
        this.metrics.l1.misses++;
      }
    }

    // Check L2 cache for missed keys
    if (missedKeys.length > 0 && !this.fallbackToMemory && this.redisClient) {
      try {
        const redisResults = await this.redisClient.mGet(missedKeys);
        for (let i = 0; i < missedKeys.length; i++) {
          if (redisResults[i]) {
            const value = this.deserialize(redisResults[i]);
            results[missedIndexes[i]] = value;
            // Populate L1 cache
            this.setInMemory(missedKeys[i], value);
            this.metrics.l2.hits++;
          } else {
            this.metrics.l2.misses++;
          }
        }
      } catch (error) {
        console.error('Redis mget error:', error);
        this.metrics.l2.errors++;
      }
    }

    return results;
  }

  // ==========================================
  // DOMAIN-SPECIFIC CACHING METHODS
  // ==========================================

  /**
   * Cache comics with intelligent expiration
   */
  async cacheComics(comics, filters = {}) {
    const key = this.generateComicsKey(filters);
    await this.set(key, comics, this.ttlConfig.comics);
    await this.addToSet('comics:keys', key);
    return key;
  }

  async getCachedComics(filters = {}) {
    const key = this.generateComicsKey(filters);
    return await this.get(key);
  }

  /**
   * Cache marketplace listings with real-time updates
   */
  async cacheMarketplaceListings(listings, filters = {}) {
    const key = this.generateMarketplaceKey(filters);
    await this.set(key, listings, this.ttlConfig.marketplace);
    await this.addToSet('marketplace:keys', key);
    return key;
  }

  async getCachedMarketplaceListings(filters = {}) {
    const key = this.generateMarketplaceKey(filters);
    return await this.get(key);
  }

  /**
   * Cache pricing data with smart expiration
   */
  async cachePricingData(title, issue, data) {
    const key = `pricing:${title}:${issue}`;
    await this.set(key, data, this.ttlConfig.pricing);
    return key;
  }

  async getCachedPricingData(title, issue) {
    const key = `pricing:${title}:${issue}`;
    return await this.get(key);
  }

  /**
   * Cache user collections with instant updates
   */
  async cacheUserCollection(userId, collection) {
    const key = `collection:${userId}`;
    await this.set(key, collection, this.ttlConfig.collections);
    return key;
  }

  async getCachedUserCollection(userId) {
    const key = `collection:${userId}`;
    return await this.get(key);
  }

  async invalidateUserCollection(userId) {
    const patterns = [`collection:${userId}*`, `user:${userId}*`];
    await this.invalidateByPatterns(patterns);
  }

  // ==========================================
  // CACHE INVALIDATION STRATEGIES
  // ==========================================

  /**
   * Bulk cache invalidation with pattern support
   */
  async invalidateComicsCache() {
    const patterns = ['comics:*', 'search:*']; // Invalidate related search cache too
    await this.invalidateByPatterns(patterns);
    await this.del('comics:keys');
  }

  async invalidateMarketplaceCache() {
    const patterns = ['marketplace:*', 'trending:marketplace:*'];
    await this.invalidateByPatterns(patterns);
    await this.del('marketplace:keys');
  }

  async invalidateByPatterns(patterns) {
    for (const pattern of patterns) {
      await this.invalidateByPattern(pattern);
    }
  }

  async invalidateByPattern(pattern, filterFn = null) {
    try {
      // Invalidate from memory cache
      const memoryKeys = Array.from(this.memoryCache.keys());
      const matchingMemoryKeys = memoryKeys.filter(key => this.matchesPattern(key, pattern));
      
      for (const key of matchingMemoryKeys) {
        if (!filterFn || filterFn(this.memoryCache.get(key)?.value)) {
          this.deleteFromMemory(key);
        }
      }

      // Invalidate from Redis if available
      if (!this.fallbackToMemory && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          if (filterFn) {
            // Apply filter function if provided
            const filteredKeys = [];
            for (const key of keys) {
              try {
                const value = await this.redisClient.get(key);
                if (value && filterFn(this.deserialize(value))) {
                  filteredKeys.push(key);
                }
              } catch (error) {
                console.warn(`Error checking filter for key ${key}:`, error);
              }
            }
            if (filteredKeys.length > 0) {
              await this.redisClient.del(...filteredKeys);
            }
          } else {
            await this.redisClient.del(...keys);
          }
        }
      }
    } catch (error) {
      console.error('Error invalidating by pattern:', error);
    }
  }

  /**
   * Time-based invalidation for expired entries
   */
  async invalidateExpired() {
    const now = Date.now();
    const expiredKeys = [];

    // Check memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.deleteFromMemory(key);
    }

    return expiredKeys.length;
  }

  /**
   * Analytics caching for performance
   */
  async cacheAnalytics(type, period, data) {
    const key = `analytics:${type}:${period}`;
    await this.set(key, data, this.ttlConfig.analytics);
    return key;
  }

  async getCachedAnalytics(type, period) {
    const key = `analytics:${type}:${period}`;
    return await this.get(key);
  }

  /**
   * Cache search results with relevance scoring
   */
  async cacheSearchResults(query, filters, results, metadata = {}) {
    const key = this.generateSearchKey(query, filters);
    const cachedData = {
      results,
      metadata: {
        ...metadata,
        cached_at: Date.now(),
        query_hash: this.hashQuery(query, filters)
      }
    };
    await this.set(key, cachedData, this.ttlConfig.search);
    return key;
  }

  async getCachedSearchResults(query, filters) {
    const key = this.generateSearchKey(query, filters);
    return await this.get(key);
  }

  /**
   * Cache trending data with time-based invalidation
   */
  async cacheTrendingData(type, timeframe, data) {
    const key = `trending:${type}:${timeframe}`;
    await this.set(key, data, this.ttlConfig.trending);
    return key;
  }

  async getCachedTrendingData(type, timeframe) {
    const key = `trending:${type}:${timeframe}`;
    return await this.get(key);
  }

  /**
   * Session management with enhanced security
   */
  async cacheSession(sessionId, userData, options = {}) {
    const key = `session:${sessionId}`;
    const ttl = options.ttl || this.ttlConfig.sessions;
    const secureData = {
      ...userData,
      _cached_at: Date.now(),
      _expires_at: Date.now() + (ttl * 1000)
    };
    await this.set(key, secureData, ttl);
    return key;
  }

  async getCachedSession(sessionId) {
    const key = `session:${sessionId}`;
    const session = await this.get(key);
    
    if (session && session._expires_at) {
      if (Date.now() > session._expires_at) {
        await this.del(key);
        return null;
      }
    }
    
    return session;
  }

  async invalidateSession(sessionId) {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  async invalidateUserSessions(userId) {
    const pattern = `session:*`;
    await this.invalidateByPattern(pattern, (session) => {
      return session && session.userId === userId;
    });
  }

  // ==========================================
  // L1 CACHE (MEMORY) OPERATIONS
  // ==========================================

  getFromMemory(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.deleteFromMemory(key);
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = Date.now();
    return entry;
  }

  setInMemory(key, value, ttl = this.config.defaultTTL) {
    // Implement LRU eviction if at capacity
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictLRU();
    }

    const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    this.memoryCache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
  }

  deleteFromMemory(key) {
    return this.memoryCache.delete(key);
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.deleteFromMemory(oldestKey);
      this.metrics.l1.evictions++;
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.deleteFromMemory(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired entries from L1 cache`);
    }
  }

  // ==========================================
  // L2 CACHE (REDIS) OPERATIONS
  // ==========================================

  async getFromRedis(key) {
    if (this.fallbackToMemory || !this.redisClient) return null;
    
    try {
      const result = await this.redisClient.get(key);
      return result ? this.deserialize(result) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      this.metrics.l2.errors++;
      return null;
    }
  }

  async setInRedis(key, value, ttl, compress = false) {
    if (this.fallbackToMemory || !this.redisClient) return false;
    
    try {
      const serialized = this.serialize(value, compress);
      if (ttl > 0) {
        await this.redisClient.setEx(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      this.metrics.l2.errors++;
      return false;
    }
  }

  // ==========================================
  // SERIALIZATION AND COMPRESSION
  // ==========================================

  serialize(value, compress = false) {
    const json = JSON.stringify(value);
    
    if (compress && this.shouldCompress(value)) {
      try {
        const compressed = zlib.gzipSync(json);
        const compressionRatio = compressed.length / json.length;
        this.metrics.compressionRatio = (this.metrics.compressionRatio + compressionRatio) / 2;
        return `gzip:${compressed.toString('base64')}`;
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
        return json;
      }
    }
    
    return json;
  }

  deserialize(data) {
    if (typeof data !== 'string') return data;
    
    if (data.startsWith('gzip:')) {
      try {
        const compressed = Buffer.from(data.slice(5), 'base64');
        const decompressed = zlib.gunzipSync(compressed);
        return JSON.parse(decompressed.toString());
      } catch (error) {
        console.warn('Decompression failed:', error);
        return null;
      }
    }
    
    try {
      return JSON.parse(data);
    } catch (error) {
      return data; // Return as-is if not JSON
    }
  }

  shouldCompress(value) {
    const serialized = JSON.stringify(value);
    return serialized.length > this.config.compressionThreshold;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  generateComicsKey(filters) {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `comics:${this.hashString(filterStr)}`;
  }

  generateMarketplaceKey(filters) {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `marketplace:${this.hashString(filterStr)}`;
  }

  generateSearchKey(query, filters) {
    const combined = JSON.stringify({ query, filters });
    return `search:${this.hashString(combined)}`;
  }

  hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex').slice(0, 12);
  }

  hashQuery(query, filters = {}) {
    const combined = JSON.stringify({ query, filters });
    return crypto.createHash('md5').update(combined).digest('hex');
  }

  matchesPattern(key, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  async addToSet(setKey, value) {
    if (this.fallbackToMemory || !this.redisClient) {
      // Store in memory as a simple array for fallback
      const existing = this.getFromMemory(setKey);
      const set = existing ? new Set(existing.value) : new Set();
      set.add(value);
      this.setInMemory(setKey, Array.from(set));
      return;
    }

    try {
      await this.redisClient.sAdd(setKey, value);
    } catch (error) {
      console.error('Cache addToSet error:', error);
      this.metrics.l2.errors++;
    }
  }

  async getSet(setKey) {
    if (this.fallbackToMemory || !this.redisClient) {
      const existing = this.getFromMemory(setKey);
      return existing ? existing.value : [];
    }

    try {
      return await this.redisClient.sMembers(setKey);
    } catch (error) {
      console.error('Cache getSet error:', error);
      this.metrics.l2.errors++;
      return [];
    }
  }

  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
      cacheEntries: this.memoryCache.size
    };
  }

  updateResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    try {
      console.log('🚪 Shutting down cache service...');
      
      // Clear memory cache
      this.memoryCache.clear();
      
      // Disconnect Redis
      if (this.redisClient && !this.fallbackToMemory) {
        await this.redisClient.quit();
        console.log('✅ Redis disconnected gracefully');
      }
      
      console.log('✅ Cache service shutdown complete');
    } catch (error) {
      console.error('❌ Cache shutdown error:', error);
    }
  }

  // ==========================================
  // CACHE WARMING AND PRELOADING
  // ==========================================

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(warmingConfig = {}) {
    console.log('🔥 Starting cache warming...');
    const startTime = Date.now();
    let warmedCount = 0;

    try {
      // Warm trending comics
      if (warmingConfig.trending !== false) {
        const trendingData = await this.warmTrendingData();
        warmedCount += trendingData;
      }

      // Warm popular searches
      if (warmingConfig.searches !== false) {
        const searchData = await this.warmPopularSearches();
        warmedCount += searchData;
      }

      // Warm pricing data for featured comics
      if (warmingConfig.pricing !== false) {
        const pricingData = await this.warmPricingData();
        warmedCount += pricingData;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Cache warming completed: ${warmedCount} items in ${duration}ms`);
      
      return { warmedCount, duration };
    } catch (error) {
      console.error('Cache warming error:', error);
      return { error: error.message, warmedCount };
    }
  }

  async warmTrendingData() {
    // This would be called with actual trending data from your analytics
    const trendingTypes = ['comics', 'marketplace', 'collections'];
    const timeframes = ['daily', 'weekly', 'monthly'];
    let count = 0;

    for (const type of trendingTypes) {
      for (const timeframe of timeframes) {
        const key = `trending:${type}:${timeframe}`;
        // Set placeholder to prevent cache stampede
        await this.set(key, { _warming: true, _timestamp: Date.now() }, 60);
        count++;
      }
    }

    return count;
  }

  async warmPopularSearches() {
    // Pre-cache popular search queries
    const popularQueries = [
      'spider-man',
      'batman',
      'x-men',
      'superman',
      'marvel'
    ];
    
    let count = 0;
    for (const query of popularQueries) {
      const key = this.generateSearchKey(query, {});
      await this.set(key, { _warming: true, _timestamp: Date.now() }, 60);
      count++;
    }

    return count;
  }

  async warmPricingData() {
    // Pre-cache pricing for featured/popular comics
    // This would integrate with your featured comics logic
    let count = 0;
    
    // Example: cache pricing for top 100 comics
    const featuredComics = []; // This would come from your database
    
    for (const comic of featuredComics.slice(0, 10)) { // Limit for demo
      const key = `pricing:${comic.title}:${comic.issue}`;
      await this.set(key, { _warming: true, _timestamp: Date.now() }, 60);
      count++;
    }

    return count;
  }

  // ==========================================
  // PERFORMANCE MONITORING
  // ==========================================

  /**
   * Comprehensive cache statistics
   */
  async getStats() {
    const totalL1Requests = this.metrics.l1.hits + this.metrics.l1.misses;
    const totalL2Requests = this.metrics.l2.hits + this.metrics.l2.misses;
    const totalRequests = this.metrics.totalRequests;

    const l1HitRate = totalL1Requests > 0 ? (this.metrics.l1.hits / totalL1Requests * 100).toFixed(2) : 0;
    const l2HitRate = totalL2Requests > 0 ? (this.metrics.l2.hits / totalL2Requests * 100).toFixed(2) : 0;
    const overallHitRate = totalRequests > 0 ? ((this.metrics.l1.hits + this.metrics.l2.hits) / totalRequests * 100).toFixed(2) : 0;

    const stats = {
      summary: {
        totalRequests,
        overallHitRate: `${overallHitRate}%`,
        avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
        memoryUsage: this.getMemoryUsage()
      },
      l1Cache: {
        hits: this.metrics.l1.hits,
        misses: this.metrics.l1.misses,
        hitRate: `${l1HitRate}%`,
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize,
        evictions: this.metrics.l1.evictions
      },
      l2Cache: {
        hits: this.metrics.l2.hits,
        misses: this.metrics.l2.misses,
        hitRate: `${l2HitRate}%`,
        errors: this.metrics.l2.errors,
        connected: !this.fallbackToMemory,
        clusterMode: this.isClusterMode
      }
    };

    // Add Redis-specific stats if available
    if (!this.fallbackToMemory && this.redisClient) {
      try {
        const info = await this.redisClient.info('memory');
        const keyspace = await this.redisClient.info('keyspace');
        stats.l2Cache.redisInfo = { memory: info, keyspace };
      } catch (error) {
        stats.l2Cache.redisError = error.message;
      }
    }

    return stats;
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 },
      totalRequests: 0,
      avgResponseTime: 0,
      compressionRatio: 0
    };
  }

  /**
   * Health check for both cache layers
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      l1Cache: {
        status: 'healthy',
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize
      },
      l2Cache: {
        status: 'unknown',
        connected: false
      }
    };

    // Check L2 cache (Redis)
    if (!this.fallbackToMemory && this.redisClient) {
      try {
        const start = Date.now();
        await this.redisClient.ping();
        const latency = Date.now() - start;
        
        health.l2Cache = {
          status: 'healthy',
          connected: true,
          latency: `${latency}ms`,
          clusterMode: this.isClusterMode
        };
      } catch (error) {
        health.l2Cache = {
          status: 'unhealthy',
          connected: false,
          error: error.message
        };
      }
    } else {
      health.l2Cache = {
        status: 'disabled',
        connected: false,
        reason: 'Fallback to memory-only mode'
      };
    }

    return health;
  }
}

// Singleton instance for application-wide use
let cacheServiceInstance = null;

module.exports = {
  CacheService,
  getInstance: () => {
    if (!cacheServiceInstance) {
      cacheServiceInstance = new CacheService();
    }
    return cacheServiceInstance;
  },
  // For testing purposes
  createInstance: () => new CacheService()
};
