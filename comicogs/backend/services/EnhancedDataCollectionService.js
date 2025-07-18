const EbayScraper = require('../../comiccomp/services/scrapers/EbayScraper');
const WhatnotScraper = require('../../comiccomp/services/scrapers/WhatnotScraper');
const ComicConnectScraper = require('../../comiccomp/services/scrapers/ComicConnectScraper');
const HeritageAuctionsScraper = require('../../comiccomp/services/scrapers/HeritageAuctionsScraper');
const MyComicShopScraper = require('../../comiccomp/services/scrapers/MyComicShopScraper');
const AmazonScraper = require('../../comiccomp/services/scrapers/AmazonScraper');
const { pool } = require('../db');
const { redisClient } = require('../cache/RedisManager');
const EventEmitter = require('events');

/**
 * Enhanced Data Collection Service for Task 1
 * Provides robust, scalable data collection from multiple marketplaces
 * with advanced rate limiting, error handling, and database integration
 */
class EnhancedDataCollectionService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...this.getDefaultConfig(),
            ...config
        };

        // Initialize metrics and tracking
        this.metrics = {
            totalCollections: 0,
            successfulCollections: 0,
            failedCollections: 0,
            marketplaceStats: {},
            collectionTimes: [],
            errorCounts: {},
            lastCollectionTime: null,
            averageCollectionTime: 0,
            startTime: Date.now()
        };

        // Initialize error tracking
        this.errorLog = [];
        this.maxErrorLogSize = 500;

        // Initialize rate limiting tracking
        this.rateLimitTracker = new Map();

        // Initialize scrapers with enhanced configuration
        this.scrapers = this.initializeScrapers();

        // Initialize database connection
        this.dbPool = pool;

        // Set up automatic metrics reporting
        this.setupMetricsReporting();
    }

    getDefaultConfig() {
        return {
            // Database configuration
            database: {
                maxConnections: 20,
                connectionTimeout: 30000,
                queryTimeout: 60000
            },

            // Collection settings
            collection: {
                maxRetries: 5,
                retryDelay: 2000,
                batchSize: 25,
                maxConcurrentRequests: 8,
                timeout: 45000,
                enableValidation: true,
                enableMetrics: true,
                maxResultsPerMarketplace: 200
            },

            // Rate limiting (enhanced from base config)
            rateLimiting: {
                globalRequestsPerSecond: 10,
                globalRequestsPerMinute: 300,
                marketplaceSpecific: {
                    ebay: { requestsPerSecond: 3, requestsPerMinute: 120, burstLimit: 15 },
                    whatnot: { requestsPerSecond: 2, requestsPerMinute: 60, burstLimit: 10 },
                    comicconnect: { requestsPerSecond: 1, requestsPerMinute: 30, burstLimit: 5 },
                    heritage: { requestsPerSecond: 1, requestsPerMinute: 20, burstLimit: 3 },
                    mycomicshop: { requestsPerSecond: 2, requestsPerMinute: 80, burstLimit: 8 },
                    amazon: { requestsPerSecond: 1, requestsPerMinute: 30, burstLimit: 5 }
                }
            },

            // Data validation (enhanced)
            validation: {
                requiredFields: ['id', 'title', 'price', 'marketplace', 'source_url'],
                minPrice: 0.01,
                maxPrice: 1000000,
                maxTitleLength: 1000,
                maxDescriptionLength: 10000,
                allowedMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop', 'amazon'],
                suspiciousPatterns: [
                    /<script/i, /javascript:/i, /on\w+\s*=/i, /\beval\b/i,
                    /\bshill\b/i, /\bfake\b/i, /\bscam\b/i, /\bstolen\b/i
                ]
            },

            // Error handling
            errorHandling: {
                maxConsecutiveErrors: 10,
                errorCooldownTime: 300000, // 5 minutes
                enableAlerts: true,
                alertThresholds: {
                    errorRate: 0.15,
                    successRate: 0.75,
                    avgResponseTime: 10000
                }
            },

            // Caching
            caching: {
                enabled: true,
                searchResultsTTL: 1800, // 30 minutes
                pricingDataTTL: 3600, // 1 hour
                failedRequestsTTL: 300 // 5 minutes
            },

            // Enabled marketplaces
            enabledMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop']
        };
    }

    initializeScrapers() {
        const scrapers = {};
        
        try {
            // Load scraper configuration
            const scraperConfig = require('../../comiccomp/config');
            
            // Initialize each enabled scraper
            this.config.enabledMarketplaces.forEach(marketplace => {
                try {
                    switch (marketplace) {
                        case 'ebay':
                            scrapers.ebay = new EbayScraper(scraperConfig);
                            break;
                        case 'whatnot':
                            scrapers.whatnot = new WhatnotScraper(scraperConfig);
                            break;
                        case 'comicconnect':
                            scrapers.comicconnect = new ComicConnectScraper(scraperConfig);
                            break;
                        case 'heritage':
                            scrapers.heritage = new HeritageAuctionsScraper(scraperConfig);
                            break;
                        case 'mycomicshop':
                            scrapers.mycomicshop = new MyComicShopScraper(scraperConfig);
                            break;
                        case 'amazon':
                            // Only initialize if API keys are available
                            if (process.env.AMAZON_API_KEY) {
                                scrapers.amazon = new AmazonScraper(scraperConfig);
                            }
                            break;
                    }
                    
                    // Initialize marketplace stats
                    this.metrics.marketplaceStats[marketplace] = {
                        totalRequests: 0,
                        successfulRequests: 0,
                        failedRequests: 0,
                        avgResponseTime: 0,
                        lastRequestTime: null,
                        errorCount: 0,
                        rateLimitHits: 0
                    };
                    
                    console.log(`✅ Initialized ${marketplace} scraper`);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${marketplace} scraper:`, error.message);
                    this.logError(error, `scraper_init_${marketplace}`);
                }
            });
            
            console.log(`🚀 Enhanced Data Collection Service initialized with ${Object.keys(scrapers).length} scrapers`);
            return scrapers;
        } catch (error) {
            console.error('❌ Failed to initialize scrapers:', error.message);
            throw error;
        }
    }

    /**
     * Enhanced comprehensive search across all marketplaces
     */
    async searchAllMarketplaces(query, options = {}) {
        const startTime = Date.now();
        this.metrics.totalCollections++;
        
        console.log(`🔍 Starting enhanced collection for: "${query}"`);
        
        try {
            // Validate search query
            this.validateSearchQuery(query);
            
            // Check cache first
            const cacheKey = `search:${query}:${JSON.stringify(options)}`;
            if (this.config.caching.enabled) {
                const cachedResult = await this.getCachedResult(cacheKey);
                if (cachedResult) {
                    console.log(`📦 Using cached results for "${query}"`);
                    return cachedResult;
                }
            }
            
            // Prepare search options
            const searchOptions = {
                maxResults: options.maxResults || this.config.collection.maxResultsPerMarketplace,
                timeout: options.timeout || this.config.collection.timeout,
                includeSoldListings: options.includeSoldListings !== false,
                ...options
            };
            
            // Execute searches across all marketplaces
            const searchPromises = [];
            const enabledScrapers = Object.keys(this.scrapers);
            
            for (const marketplace of enabledScrapers) {
                if (this.isMarketplaceOperational(marketplace)) {
                    searchPromises.push(
                        this.searchMarketplaceWithRetry(marketplace, query, searchOptions)
                    );
                }
            }
            
            // Wait for all searches to complete
            const searchResults = await Promise.allSettled(searchPromises);
            
            // Process results
            const allListings = [];
            const marketplaceResults = {};
            
            for (let i = 0; i < searchResults.length; i++) {
                const marketplace = enabledScrapers[i];
                const result = searchResults[i];
                
                if (result.status === 'fulfilled') {
                    const listings = result.value || [];
                    allListings.push(...listings);
                    marketplaceResults[marketplace] = {
                        success: true,
                        count: listings.length,
                        listings: listings
                    };
                    
                    // Update metrics
                    this.metrics.marketplaceStats[marketplace].successfulRequests++;
                    console.log(`✅ ${marketplace}: ${listings.length} listings found`);
                } else {
                    marketplaceResults[marketplace] = {
                        success: false,
                        error: result.reason.message,
                        count: 0
                    };
                    
                    // Update metrics
                    this.metrics.marketplaceStats[marketplace].failedRequests++;
                    console.error(`❌ ${marketplace}: ${result.reason.message}`);
                    this.logError(result.reason, `search_${marketplace}`);
                }
            }
            
            // Validate and normalize all listings
            const validListings = [];
            for (const listing of allListings) {
                try {
                    const validatedListing = this.validateAndNormalizeListing(listing);
                    if (validatedListing) {
                        validListings.push(validatedListing);
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid listing filtered out:`, error.message);
                }
            }
            
            // Store results in database
            await this.storeListings(validListings, query);
            
            // Prepare response
            const response = {
                query,
                totalListings: validListings.length,
                marketplaceResults,
                listings: validListings,
                collectionTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            // Cache results
            if (this.config.caching.enabled) {
                await this.cacheResult(cacheKey, response, this.config.caching.searchResultsTTL);
            }
            
            // Update metrics
            this.metrics.successfulCollections++;
            this.metrics.collectionTimes.push(response.collectionTime);
            this.metrics.lastCollectionTime = Date.now();
            this.updateAverageCollectionTime();
            
            console.log(`🎉 Collection completed: ${validListings.length} listings in ${response.collectionTime}ms`);
            
            // Emit success event
            this.emit('collectionComplete', response);
            
            return response;
            
        } catch (error) {
            this.metrics.failedCollections++;
            this.logError(error, 'search_all_marketplaces');
            
            console.error(`❌ Collection failed for "${query}":`, error.message);
            
            // Emit error event
            this.emit('collectionError', { query, error });
            
            throw error;
        }
    }

    /**
     * Search individual marketplace with retry logic
     */
    async searchMarketplaceWithRetry(marketplace, query, options) {
        const maxRetries = this.config.collection.maxRetries;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check rate limiting
                await this.enforceRateLimit(marketplace);
                
                // Execute search
                const startTime = Date.now();
                const scraper = this.scrapers[marketplace];
                
                if (!scraper) {
                    throw new Error(`Scraper not available for ${marketplace}`);
                }
                
                const results = await scraper.searchComics(query, options);
                
                // Update metrics
                const responseTime = Date.now() - startTime;
                this.updateMarketplaceMetrics(marketplace, responseTime, true);
                
                return results;
                
            } catch (error) {
                lastError = error;
                
                // Update metrics
                this.updateMarketplaceMetrics(marketplace, 0, false);
                
                console.warn(`⚠️ ${marketplace} search failed (attempt ${attempt}/${maxRetries}):`, error.message);
                
                // Check if we should retry
                if (attempt < maxRetries) {
                    const delay = this.calculateRetryDelay(attempt);
                    await this.delay(delay);
                } else {
                    throw error;
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Enhanced rate limiting with marketplace-specific limits
     */
    async enforceRateLimit(marketplace) {
        const now = Date.now();
        const limits = this.config.rateLimiting.marketplaceSpecific[marketplace];
        
        if (!limits) return;
        
        const rateLimitKey = `rate_limit:${marketplace}`;
        
        if (!this.rateLimitTracker.has(rateLimitKey)) {
            this.rateLimitTracker.set(rateLimitKey, {
                requestTimes: [],
                lastRequest: 0
            });
        }
        
        const tracker = this.rateLimitTracker.get(rateLimitKey);
        
        // Check per-second limit
        if (limits.requestsPerSecond) {
            const timeSinceLastRequest = now - tracker.lastRequest;
            const minDelay = 1000 / limits.requestsPerSecond;
            
            if (timeSinceLastRequest < minDelay) {
                const delay = minDelay - timeSinceLastRequest;
                await this.delay(delay);
            }
        }
        
        // Check per-minute limit
        if (limits.requestsPerMinute) {
            const oneMinuteAgo = now - 60000;
            tracker.requestTimes = tracker.requestTimes.filter(time => time > oneMinuteAgo);
            
            if (tracker.requestTimes.length >= limits.requestsPerMinute) {
                const oldestRequest = Math.min(...tracker.requestTimes);
                const waitTime = (oldestRequest + 60000) - now;
                
                if (waitTime > 0) {
                    console.log(`⏳ Rate limit hit for ${marketplace}. Waiting ${waitTime}ms`);
                    this.metrics.marketplaceStats[marketplace].rateLimitHits++;
                    await this.delay(waitTime);
                }
            }
        }
        
        // Record this request
        tracker.requestTimes.push(now);
        tracker.lastRequest = now;
    }

    /**
     * Validate and normalize listing data
     */
    validateAndNormalizeListing(listing) {
        // Required field validation
        for (const field of this.config.validation.requiredFields) {
            if (!listing[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Price validation
        const price = parseFloat(listing.price);
        if (isNaN(price) || price < this.config.validation.minPrice || price > this.config.validation.maxPrice) {
            throw new Error(`Invalid price: ${listing.price}`);
        }
        
        // Marketplace validation
        if (!this.config.validation.allowedMarketplaces.includes(listing.marketplace)) {
            throw new Error(`Invalid marketplace: ${listing.marketplace}`);
        }
        
        // Suspicious content detection
        for (const pattern of this.config.validation.suspiciousPatterns) {
            if (pattern.test(listing.title) || (listing.description && pattern.test(listing.description))) {
                throw new Error(`Suspicious content detected`);
            }
        }
        
        // Normalize and sanitize data
        return {
            ...listing,
            price: parseFloat(price.toFixed(2)),
            title: this.sanitizeText(listing.title),
            description: this.sanitizeText(listing.description),
            condition: this.normalizeCondition(listing.condition),
            marketplace: listing.marketplace.toLowerCase(),
            collected_at: new Date().toISOString()
        };
    }

    /**
     * Store listings in PostgreSQL database
     */
    async storeListings(listings, query) {
        if (!listings || listings.length === 0) return;
        
        const client = await this.dbPool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Insert listings into pricing_data_raw table
            const insertQuery = `
                INSERT INTO pricing_data_raw (
                    comic_id, source_marketplace, source_listing_id, source_url,
                    price, condition, grade, sale_type, title_raw, description_raw,
                    seller_info, listing_photos, shipping_cost, sale_date, end_date,
                    view_count, watcher_count, bid_count, confidence_score, is_verified,
                    metadata, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                ON CONFLICT (source_marketplace, source_listing_id) 
                DO UPDATE SET 
                    price = EXCLUDED.price,
                    condition = EXCLUDED.condition,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id`;
            
            const insertedIds = [];
            
            for (const listing of listings) {
                const values = [
                    listing.comic_id || null,
                    listing.marketplace,
                    listing.id || listing.source_listing_id,
                    listing.source_url || listing.url,
                    listing.price,
                    listing.condition,
                    listing.grade,
                    listing.sale_type || 'unknown',
                    listing.title,
                    listing.description,
                    JSON.stringify(listing.seller_info || {}),
                    JSON.stringify(listing.listing_photos || []),
                    listing.shipping_cost || 0,
                    listing.sale_date ? new Date(listing.sale_date) : null,
                    listing.end_date ? new Date(listing.end_date) : null,
                    listing.view_count || 0,
                    listing.watcher_count || 0,
                    listing.bid_count || 0,
                    listing.confidence_score || 0.5,
                    listing.is_verified || false,
                    JSON.stringify({ query, collected_at: listing.collected_at }),
                    new Date(),
                    new Date()
                ];
                
                const result = await client.query(insertQuery, values);
                insertedIds.push(result.rows[0].id);
            }
            
            // Update data collection status
            await client.query(`
                INSERT INTO data_collection_status (
                    collection_type, query, marketplace, status, 
                    results_count, collection_time, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'pricing_search',
                query,
                'all',
                'completed',
                listings.length,
                Date.now(),
                new Date()
            ]);
            
            await client.query('COMMIT');
            
            console.log(`💾 Stored ${insertedIds.length} listings in database`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Database storage failed:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Helper Methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateRetryDelay(attempt) {
        const baseDelay = this.config.collection.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
    }

    sanitizeText(text) {
        if (!text) return null;
        return text.trim().replace(/\s+/g, ' ').substring(0, 1000);
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const conditionMap = {
            'mint': 'Mint',
            'near mint': 'Near Mint',
            'nm': 'Near Mint',
            'very fine': 'Very Fine',
            'vf': 'Very Fine',
            'fine': 'Fine',
            'very good': 'Very Good',
            'vg': 'Very Good',
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor'
        };
        
        return conditionMap[condition.toLowerCase()] || condition;
    }

    validateSearchQuery(query) {
        if (!query || typeof query !== 'string') {
            throw new Error('Search query must be a non-empty string');
        }
        
        if (query.length < 2) {
            throw new Error('Search query must be at least 2 characters long');
        }
        
        if (query.length > 200) {
            throw new Error('Search query must be less than 200 characters');
        }
    }

    isMarketplaceOperational(marketplace) {
        const stats = this.metrics.marketplaceStats[marketplace];
        if (!stats) return false;
        
        // Check if marketplace has too many consecutive errors
        const errorRate = stats.totalRequests > 0 ? 
            stats.failedRequests / stats.totalRequests : 0;
        
        return errorRate < this.config.errorHandling.alertThresholds.errorRate;
    }

    updateMarketplaceMetrics(marketplace, responseTime, success) {
        const stats = this.metrics.marketplaceStats[marketplace];
        if (!stats) return;
        
        stats.totalRequests++;
        stats.lastRequestTime = Date.now();
        
        if (success) {
            stats.successfulRequests++;
            stats.avgResponseTime = stats.avgResponseTime === 0 ? 
                responseTime : 
                (stats.avgResponseTime + responseTime) / 2;
        } else {
            stats.failedRequests++;
            stats.errorCount++;
        }
    }

    updateAverageCollectionTime() {
        if (this.metrics.collectionTimes.length === 0) return;
        
        const total = this.metrics.collectionTimes.reduce((sum, time) => sum + time, 0);
        this.metrics.averageCollectionTime = total / this.metrics.collectionTimes.length;
        
        // Keep only last 100 collection times
        if (this.metrics.collectionTimes.length > 100) {
            this.metrics.collectionTimes = this.metrics.collectionTimes.slice(-100);
        }
    }

    logError(error, context) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message,
            stack: error.stack,
            marketplace: context.includes('_') ? context.split('_')[1] : 'unknown'
        };
        
        this.errorLog.push(errorEntry);
        
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
        }
        
        // Update error counts
        this.metrics.errorCounts[context] = (this.metrics.errorCounts[context] || 0) + 1;
    }

    async getCachedResult(cacheKey) {
        if (!redisClient) return null;
        
        try {
            const cached = await redisClient.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Cache retrieval failed:', error.message);
            return null;
        }
    }

    async cacheResult(cacheKey, result, ttl) {
        if (!redisClient) return;
        
        try {
            await redisClient.setex(cacheKey, ttl, JSON.stringify(result));
        } catch (error) {
            console.warn('Cache storage failed:', error.message);
        }
    }

    setupMetricsReporting() {
        // Report metrics every 5 minutes
        setInterval(() => {
            this.reportMetrics();
        }, 300000);
    }

    reportMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        const successRate = this.metrics.totalCollections > 0 ? 
            this.metrics.successfulCollections / this.metrics.totalCollections : 0;
        
        console.log(`📊 Collection Metrics:
        - Total Collections: ${this.metrics.totalCollections}
        - Success Rate: ${(successRate * 100).toFixed(1)}%
        - Average Collection Time: ${this.metrics.averageCollectionTime.toFixed(0)}ms
        - Uptime: ${(uptime / 1000 / 60).toFixed(1)} minutes
        - Error Count: ${Object.values(this.metrics.errorCounts).reduce((a, b) => a + b, 0)}`);
        
        // Emit metrics event
        this.emit('metricsReport', {
            ...this.metrics,
            uptime,
            successRate
        });
    }

    /**
     * Get current service status and metrics
     */
    getStatus() {
        const uptime = Date.now() - this.metrics.startTime;
        const successRate = this.metrics.totalCollections > 0 ? 
            this.metrics.successfulCollections / this.metrics.totalCollections : 0;
        
        return {
            status: 'operational',
            uptime,
            metrics: {
                ...this.metrics,
                successRate,
                errorRate: 1 - successRate
            },
            scrapers: Object.keys(this.scrapers).map(marketplace => ({
                marketplace,
                operational: this.isMarketplaceOperational(marketplace),
                stats: this.metrics.marketplaceStats[marketplace]
            })),
            recentErrors: this.errorLog.slice(-10)
        };
    }
}

module.exports = EnhancedDataCollectionService; 