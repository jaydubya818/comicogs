const EbayScraper = require('./scrapers/EbayScraper');
const WhatnotScraper = require('./scrapers/WhatnotScraper');
const ComicConnectScraper = require('./scrapers/ComicConnectScraper');
const HeritageAuctionsScraper = require('./scrapers/HeritageAuctionsScraper');
const MyComicShopScraper = require('./scrapers/MyComicShopScraper');
const AmazonScraper = require('./scrapers/AmazonScraper');
const PriceNormalizationEngine = require('./PriceNormalizationEngine');
const RecommendationEngine = require('./RecommendationEngine');
const PricingData = require('../models/PricingData');
const { redisClient } = require('../../db');

class DataCollectionService {
    constructor(config = {}) {
        this.config = {
            ...config,
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            batchSize: config.batchSize || 10,
            enabledMarketplaces: config.enabledMarketplaces || ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop', 'amazon'],
            timeout: config.timeout || 30000,
            maxConcurrentRequests: config.maxConcurrentRequests || 5,
            enableValidation: config.enableValidation !== false,
            enableMetrics: config.enableMetrics !== false
        };

        // Collection statistics and metrics
        this.stats = {
            totalSearches: 0,
            successfulSearches: 0,
            failedSearches: 0,
            totalListingsCollected: 0,
            lastCollectionTime: null,
            errorCount: 0,
            averageCollectionTime: 0,
            marketplaceStats: {},
            uptime: Date.now()
        };

        // Error tracking for debugging
        this.errorLog = [];
        this.maxErrorLogSize = 100;

        // Rate limiting tracking
        this.requestTracking = new Map();

        // Initialize scrapers
        this.scrapers = {};
        this.initializeScrapers();

        // Initialize processing engines
        this.priceNormalizer = new PriceNormalizationEngine(config.priceNormalization);
        this.recommendationEngine = new RecommendationEngine(config.recommendations);
        
        // Initialize data model
        this.pricingData = new PricingData(config.database);
    }

    initializeScrapers() {
        try {
            if (this.config.enabledMarketplaces.includes('ebay')) {
                this.scrapers.ebay = new EbayScraper(this.config);
                this.initializeMarketplaceStats('ebay');
            }
            if (this.config.enabledMarketplaces.includes('whatnot')) {
                this.scrapers.whatnot = new WhatnotScraper(this.config);
                this.initializeMarketplaceStats('whatnot');
            }
            if (this.config.enabledMarketplaces.includes('comicconnect')) {
                this.scrapers.comicconnect = new ComicConnectScraper(this.config);
                this.initializeMarketplaceStats('comicconnect');
            }
            if (this.config.enabledMarketplaces.includes('heritage')) {
                this.scrapers.heritage = new HeritageAuctionsScraper(this.config);
                this.initializeMarketplaceStats('heritage');
            }
            if (this.config.enabledMarketplaces.includes('mycomicshop')) {
                this.scrapers.mycomicshop = new MyComicShopScraper(this.config);
                this.initializeMarketplaceStats('mycomicshop');
            }
            if (this.config.enabledMarketplaces.includes('amazon')) {
                this.scrapers.amazon = new AmazonScraper(this.config);
                this.initializeMarketplaceStats('amazon');
            }

            console.log(`✅ Initialized ${Object.keys(this.scrapers).length} marketplace scrapers: ${Object.keys(this.scrapers).join(', ')}`);
        } catch (error) {
            console.error('❌ Error initializing scrapers:', error.message);
            this.logError('SCRAPER_INIT', error, { enabledMarketplaces: this.config.enabledMarketplaces });
        }
    }

    initializeMarketplaceStats(marketplace) {
        this.stats.marketplaceStats[marketplace] = {
            totalSearches: 0,
            successfulSearches: 0,
            failedSearches: 0,
            totalListings: 0,
            averageResponseTime: 0,
            lastSuccessfulSearch: null,
            errorRate: 0
        };
    }

    async collectPricingData(query, options = {}) {
        try {
            // Validate input
            if (this.config.enableValidation) {
                this.validateSearchInput(query, options);
            }

            console.log(`🚀 Starting comprehensive pricing data collection for: "${query}"`);
            this.stats.totalSearches++;

            const startTime = Date.now();
            const cacheKey = `pricing_data:${query.toLowerCase().replace(/\s/g, '-')}`;

            // Check cache first
            if (this.config.cache.enabled) {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log(`✅ Cache hit for "${query}"`);
                    return JSON.parse(cachedData);
                }
            }

            const collectionResults = {
                query,
                startTime: new Date().toISOString(),
                rawData: {},
                processedData: {},
                errors: {},
                warnings: [],
                summary: {
                    totalListings: 0,
                    marketplacesSearched: 0,
                    marketplacesSuccessful: 0,
                    collectionTimeMs: 0,
                    averagePriceFound: 0,
                    priceRange: { min: null, max: null },
                    conditionsFound: new Set(),
                    uniqueSellers: new Set()
                }
            };

            // Phase 1: Collect raw data from all marketplaces
            console.log('📊 Phase 1: Collecting raw marketplace data...');
            await this.collectRawMarketplaceData(query, options, collectionResults);

            // Phase 2: Validate and clean data
            console.log('🔍 Phase 2: Validating and cleaning data...');
            await this.validateAndCleanData(collectionResults);

            // Phase 3: Normalize and analyze pricing data
            console.log('🔄 Phase 3: Normalizing pricing data...');
            const normalizedData = await this.normalizePricingData(collectionResults.rawData, options);
            collectionResults.processedData = normalizedData;

            // Phase 4: Generate AI recommendations
            console.log('🤖 Phase 4: Generating AI recommendations...');
            const recommendations = await this.generateRecommendations(normalizedData, options.userContext || {});

            // Phase 5: Store results
            console.log('💾 Phase 5: Storing results...');
            await this.storePricingData(query, collectionResults.rawData, normalizedData);

            // Update statistics
            const collectionTime = Date.now() - startTime;
            collectionResults.summary.collectionTimeMs = collectionTime;
            this.updateStats(collectionResults, collectionTime);

            console.log(`✅ Collection completed in ${collectionTime}ms`);
            console.log(`📈 Summary: ${collectionResults.summary.totalListings} listings from ${collectionResults.summary.marketplacesSuccessful}/${collectionResults.summary.marketplacesSearched} marketplaces`);

            const finalResult = {
                ...collectionResults,
                normalizedData,
                recommendations,
                metrics: this.getCollectionMetrics()
            };

            // Store in cache
            if (this.config.cache.enabled) {
                await redisClient.set(cacheKey, JSON.stringify(finalResult), 'EX', this.config.cache.searchResultsTTL);
                console.log(`✅ Stored results in cache for "${query}"`);
            }

            return finalResult;

        } catch (error) {
            console.error(`❌ Collection failed for "${query}":`, error.message);
            this.stats.failedSearches++;
            this.logError('COLLECTION_FAILED', error, { query, options });
            throw error;
        }
    }

    validateSearchInput(query, options) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new Error('Search query must be a non-empty string');
        }

        if (query.length > 200) {
            throw new Error('Search query must be less than 200 characters');
        }

        // Validate options
        if (options.maxResults && (options.maxResults < 1 || options.maxResults > 1000)) {
            throw new Error('maxResults must be between 1 and 1000');
        }

        if (options.minPrice && options.maxPrice && options.minPrice > options.maxPrice) {
            throw new Error('minPrice cannot be greater than maxPrice');
        }

        // Check for potentially harmful input
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /\beval\b/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(query)) {
                throw new Error('Query contains potentially harmful content');
            }
        }
    }

    async collectRawMarketplaceData(query, options, results) {
        const searchPromises = [];
        const enabledScrapers = Object.entries(this.scrapers);

        results.summary.marketplacesSearched = enabledScrapers.length;

        // Create promises for all marketplace searches with concurrency control
        const semaphore = this.createSemaphore(this.config.maxConcurrentRequests);

        for (const [marketplace, scraper] of enabledScrapers) {
            searchPromises.push(
                semaphore.acquire().then(async (release) => {
                    try {
                        const marketplaceStartTime = Date.now();
                        const listings = await this.searchMarketplace(marketplace, scraper, query, options);
                        const responseTime = Date.now() - marketplaceStartTime;
                        
                        results.rawData[marketplace] = listings;
                        results.summary.totalListings += listings.length;
                        results.summary.marketplacesSuccessful++;
                        
                        // Update marketplace-specific stats
                        this.updateMarketplaceStats(marketplace, true, listings.length, responseTime);
                        
                        console.log(`✅ ${marketplace}: ${listings.length} listings (${responseTime}ms)`);
                        return { marketplace, success: true, count: listings.length, responseTime };
                    } catch (error) {
                        console.error(`❌ ${marketplace} failed:`, error.message);
                        results.errors[marketplace] = {
                            message: error.message,
                            code: error.code || 'UNKNOWN_ERROR',
                            timestamp: new Date().toISOString()
                        };
                        
                        this.updateMarketplaceStats(marketplace, false, 0, 0);
                        this.logError('MARKETPLACE_SEARCH_FAILED', error, { marketplace, query });
                        
                        return { marketplace, success: false, error: error.message };
                    } finally {
                        release();
                    }
                })
            );
        }

        // Execute all searches
        const searchResults = await Promise.allSettled(searchPromises);
        
        // Log results summary
        const successful = searchResults.filter(result => 
            result.status === 'fulfilled' && result.value.success
        ).length;
        
        console.log(`📊 Raw data collection: ${successful}/${enabledScrapers.length} marketplaces successful`);
        
        if (successful === 0) {
            throw new Error('All marketplace searches failed');
        }
    }

    async validateAndCleanData(results) {
        for (const [marketplace, listings] of Object.entries(results.rawData)) {
            const cleanedListings = [];
            
            for (const listing of listings) {
                try {
                    if (this.validateListing(listing)) {
                        cleanedListings.push(this.cleanListing(listing));
                        
                        // Update summary statistics
                        this.updateSummaryStats(results.summary, listing);
                    } else {
                        results.warnings.push(`Invalid listing from ${marketplace}: ${listing.id || 'unknown'}`);
                    }
                } catch (error) {
                    results.warnings.push(`Error cleaning listing from ${marketplace}: ${error.message}`);
                }
            }
            
            results.rawData[marketplace] = cleanedListings;
            console.log(`🔍 ${marketplace}: ${cleanedListings.length}/${listings.length} listings passed validation`);
        }
    }

    validateListing(listing) {
        // Required fields
        const requiredFields = ['id', 'title', 'price', 'marketplace', 'url'];
        for (const field of requiredFields) {
            if (!listing[field]) {
                return false;
            }
        }

        // Price validation
        if (typeof listing.price !== 'number' || listing.price <= 0 || listing.price > 100000) {
            return false;
        }

        // URL validation
        if (!this.isValidUrl(listing.url)) {
            return false;
        }

        return true;
    }

    cleanListing(listing) {
        // Clean and normalize listing data
        return {
            ...listing,
            title: this.cleanText(listing.title),
            price: Math.round(listing.price * 100) / 100, // Round to 2 decimal places
            condition: this.normalizeCondition(listing.condition),
            scrapedAt: listing.scrapedAt || new Date().toISOString()
        };
    }

    updateSummaryStats(summary, listing) {
        // Update price range
        if (summary.priceRange.min === null || listing.price < summary.priceRange.min) {
            summary.priceRange.min = listing.price;
        }
        if (summary.priceRange.max === null || listing.price > summary.priceRange.max) {
            summary.priceRange.max = listing.price;
        }

        // Track conditions and sellers
        if (listing.condition) {
            summary.conditionsFound.add(listing.condition);
        }
        if (listing.seller?.username) {
            summary.uniqueSellers.add(listing.seller.username);
        }
    }

    createSemaphore(maxConcurrent) {
        let current = 0;
        const queue = [];

        return {
            acquire: () => {
                return new Promise((resolve) => {
                    if (current < maxConcurrent) {
                        current++;
                        resolve(() => {
                            current--;
                            if (queue.length > 0) {
                                const next = queue.shift();
                                current++;
                                next(() => {
                                    current--;
                                });
                            }
                        });
                    } else {
                        queue.push(resolve);
                    }
                });
            }
        };
    }

    updateMarketplaceStats(marketplace, success, listingCount, responseTime) {
        const stats = this.stats.marketplaceStats[marketplace];
        if (!stats) return;

        stats.totalSearches++;
        if (success) {
            stats.successfulSearches++;
            stats.totalListings += listingCount;
            stats.lastSuccessfulSearch = new Date().toISOString();
            
            // Update average response time
            const totalTime = stats.averageResponseTime * (stats.successfulSearches - 1) + responseTime;
            stats.averageResponseTime = Math.round(totalTime / stats.successfulSearches);
        } else {
            stats.failedSearches++;
        }
        
        stats.errorRate = stats.failedSearches / stats.totalSearches;
    }

    updateStats(results, collectionTime) {
        this.stats.successfulSearches++;
        this.stats.totalListingsCollected += results.summary.totalListings;
        this.stats.lastCollectionTime = new Date().toISOString();
        
        // Update average collection time
        const totalTime = this.stats.averageCollectionTime * (this.stats.successfulSearches - 1) + collectionTime;
        this.stats.averageCollectionTime = Math.round(totalTime / this.stats.successfulSearches);
    }

    logError(type, error, context = {}) {
        const errorEntry = {
            type,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.errorLog.push(errorEntry);
        
        // Keep error log size manageable
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog.shift();
        }
        
        this.stats.errorCount++;
    }

    getCollectionMetrics() {
        return {
            uptime: Date.now() - this.stats.uptime,
            totalSearches: this.stats.totalSearches,
            successRate: this.stats.totalSearches > 0 ? this.stats.successfulSearches / this.stats.totalSearches : 0,
            averageCollectionTime: this.stats.averageCollectionTime,
            totalListingsCollected: this.stats.totalListingsCollected,
            errorCount: this.stats.errorCount,
            marketplaceStats: this.stats.marketplaceStats,
            recentErrors: this.errorLog.slice(-10) // Last 10 errors
        };
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    cleanText(text) {
        if (!text) return '';
        return text.toString().trim().replace(/\s+/g, ' ');
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const normalized = condition.toString().toLowerCase().trim();
        const conditionMap = {
            'nm': 'Near Mint',
            'near mint': 'Near Mint',
            'vf': 'Very Fine',
            'very fine': 'Very Fine',
            'fn': 'Fine',
            'fine': 'Fine',
            'vg': 'Very Good',
            'very good': 'Very Good',
            'gd': 'Good',
            'good': 'Good',
            'fr': 'Fair',
            'fair': 'Fair',
            'pr': 'Poor',
            'poor': 'Poor'
        };

        return conditionMap[normalized] || condition;
    }

    async searchMarketplace(marketplace, scraper, query, options) {
        const maxRetries = this.config.maxRetries;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔍 Searching ${marketplace} (attempt ${attempt}/${maxRetries})`);
                
                const listings = await scraper.searchComics(query, {
                    maxResults: options.maxResults || 50,
                    condition: options.condition,
                    minPrice: options.minPrice,
                    maxPrice: options.maxPrice,
                    gradeMin: options.gradeMin,
                    gradeMax: options.gradeMax
                });

                return listings.map(listing => ({
                    ...listing,
                    marketplace,
                    collectedAt: new Date().toISOString()
                }));

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ ${marketplace} attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    const delay = this.config.retryDelay * attempt;
                    console.log(`⏳ Retrying ${marketplace} in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error(`Failed after ${maxRetries} attempts`);
    }

    async normalizePricingData(rawData, options) {
        try {
            // Flatten all listings from all marketplaces
            const allListings = [];
            Object.entries(rawData).forEach(([marketplace, listings]) => {
                listings.forEach(listing => {
                    allListings.push({
                        ...listing,
                        marketplace: marketplace.toLowerCase()
                    });
                });
            });

            if (allListings.length === 0) {
                return {};
            }

            console.log(`📊 Normalizing ${allListings.length} total listings...`);

            // Run price normalization
            const normalizedData = await this.priceNormalizer.normalizePricingData(allListings, options);

            console.log(`✅ Price normalization complete: ${Object.keys(normalizedData).length} comics analyzed`);
            return normalizedData;

        } catch (error) {
            console.error('❌ Price normalization failed:', error.message);
            throw error;
        }
    }

    async generateRecommendations(normalizedData, userContext) {
        try {
            if (Object.keys(normalizedData).length === 0) {
                return { comics: {}, portfolio: { recommendations: [] } };
            }

            console.log(`🤖 Generating recommendations for ${Object.keys(normalizedData).length} comics...`);

            const recommendations = await this.recommendationEngine.generateRecommendations(
                normalizedData, 
                userContext
            );

            console.log(`✅ Recommendations generated: ${recommendations.summary.totalComics} comics analyzed`);
            return recommendations;

        } catch (error) {
            console.error('❌ Recommendation generation failed:', error.message);
            throw error;
        }
    }

    async storePricingData(query, rawData, normalizedData) {
        try {
            // Store raw listings
            for (const [marketplace, listings] of Object.entries(rawData)) {
                for (const listing of listings) {
                    await this.pricingData.insertPricingData({
                        comic_series: listing.series || this.extractSeries(listing.title),
                        issue_number: listing.issue || this.extractIssue(listing.title),
                        condition: listing.condition,
                        grade: listing.grade,
                        price: listing.price,
                        marketplace: marketplace,
                        listing_url: listing.url,
                        seller_info: JSON.stringify(listing.seller || {}),
                        listing_data: JSON.stringify(listing),
                        scraped_at: new Date()
                    });
                }
            }

            console.log('✅ Raw pricing data stored');

            // Store normalized analysis results
            for (const [comicKey, analysis] of Object.entries(normalizedData)) {
                if (analysis.status === 'success') {
                    await this.pricingData.insertPriceHistory({
                        comic_key: comicKey,
                        analysis_data: JSON.stringify(analysis),
                        created_at: new Date()
                    });
                }
            }

            console.log('✅ Normalized analysis data stored');

        } catch (error) {
            console.warn('⚠️ Error storing data:', error.message);
            // Don't throw - storage errors shouldn't fail the entire operation
        }
    }

    async getStoredPricingData(query, options = {}) {
        try {
            const timeRange = options.timeRange || 30; // days
            return await this.pricingData.getPricingData(query, timeRange);
        } catch (error) {
            console.error('Error retrieving stored data:', error.message);
            return [];
        }
    }

    async getTrendingComics(options = {}) {
        try {
            const results = {};
            
            // Get trending from each marketplace that supports it
            for (const [marketplace, scraper] of Object.entries(this.scrapers)) {
                if (typeof scraper.getTrendingComics === 'function') {
                    try {
                        results[marketplace] = await scraper.getTrendingComics();
                    } catch (error) {
                        console.warn(`Could not get trending from ${marketplace}:`, error.message);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Error getting trending comics:', error.message);
            return {};
        }
    }

    getCollectionStats() {
        return {
            ...this.stats,
            enabledMarketplaces: this.config.enabledMarketplaces,
            scraperCount: Object.keys(this.scrapers).length,
            uptime: process.uptime()
        };
    }

    // Utility methods
    extractSeries(title) {
        return title.replace(/\s*#?\d+.*$/, '').trim();
    }

    extractIssue(title) {
        const match = title.match(/#(\d+)/);
        return match ? match[1] : '1';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health check method
    async healthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            scrapers: {},
            services: {
                priceNormalizer: true,
                recommendationEngine: true,
                database: true
            },
            stats: this.getCollectionStats()
        };

        // Check each scraper
        for (const [marketplace, scraper] of Object.entries(this.scrapers)) {
            try {
                // Basic connectivity test (if scraper supports it)
                if (typeof scraper.healthCheck === 'function') {
                    health.scrapers[marketplace] = await scraper.healthCheck();
                } else {
                    health.scrapers[marketplace] = { status: 'available' };
                }
            } catch (error) {
                health.scrapers[marketplace] = { status: 'error', error: error.message };
                health.status = 'degraded';
            }
        }

        return health;
    }
}

module.exports = DataCollectionService;
