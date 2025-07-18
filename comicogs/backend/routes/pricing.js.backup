/**
 * Task 4: Price Trend Dashboard Backend API
 * Comprehensive REST API endpoints for pricing data and market analysis
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Import ComicComp services
const DataCollectionService = require('../comiccomp/services/DataCollectionService');
const PriceNormalizationEngine = require('../comiccomp/services/PriceNormalizationEngine');
const RecommendationEngine = require('../comiccomp/services/RecommendationEngine');
const { VariantConditionClassificationSystem } = require('../comiccomp/services/VariantConditionClassificationSystem');

// Redis for caching (fallback to in-memory if Redis not available)
let redisClient = null;
try {
    const redis = require('redis');
    redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0
    });
    redisClient.on('error', (err) => {
        console.warn('⚠️ Redis connection error, falling back to in-memory cache:', err.message);
        redisClient = null;
    });
} catch (error) {
    console.warn('⚠️ Redis not available, using in-memory cache');
}

// In-memory cache fallback
const memoryCache = new Map();
const CACHE_TTL = {
    current: 300,      // 5 minutes for current pricing
    history: 1800,     // 30 minutes for historical data
    trends: 600,       // 10 minutes for trends analysis
    suggestions: 900   // 15 minutes for listing suggestions
};

// Initialize services
const dataCollectionService = new DataCollectionService({
    maxRetries: 3,
    retryDelay: 1000,
    enabledMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop'],
    apiKeys: {
        ebayClientId: process.env.EBAY_CLIENT_ID,
        ebayClientSecret: process.env.EBAY_CLIENT_SECRET
    }
});

const priceNormalizer = new PriceNormalizationEngine();
const recommendationEngine = new RecommendationEngine();
const classificationSystem = new VariantConditionClassificationSystem();

/**
 * Cache management utilities
 */
const cache = {
    async get(key) {
        if (redisClient) {
            try {
                const data = await redisClient.get(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.warn('Redis get error:', error.message);
            }
        }
        
        // Fallback to memory cache
        const cached = memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        return null;
    },

    async set(key, data, ttl) {
        if (redisClient) {
            try {
                await redisClient.setex(key, ttl, JSON.stringify(data));
                return;
            } catch (error) {
                console.warn('Redis set error:', error.message);
            }
        }
        
        // Fallback to memory cache
        memoryCache.set(key, {
            data,
            expires: Date.now() + (ttl * 1000)
        });
        
        // Basic memory cleanup
        if (memoryCache.size > 1000) {
            const keys = Array.from(memoryCache.keys());
            keys.slice(0, 200).forEach(k => memoryCache.delete(k));
        }
    },

    generateKey(prefix, comicId, params = {}) {
        const paramString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
        return `pricing:${prefix}:${comicId}:${Buffer.from(paramString).toString('base64')}`;
    }
};

/**
 * Input validation middleware
 */
const validateComicId = (req, res, next) => {
    const { comicId } = req.params;
    if (!comicId || comicId.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Comic ID is required',
            code: 'INVALID_COMIC_ID'
        });
    }
    
    // Basic sanitization
    req.params.comicId = comicId.trim();
    next();
};

/**
 * Pagination middleware
 */
const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;
    
    req.pagination = { page, limit, offset };
    next();
};

/**
 * Error handling utility
 */
const handleError = (res, error, context = '') => {
    console.error(`❌ API Error ${context}:`, error);
    
    if (error.message?.includes('Comic not found')) {
        return res.status(404).json({
            success: false,
            error: 'Comic not found',
            code: 'COMIC_NOT_FOUND'
        });
    }
    
    if (error.message?.includes('Rate limit')) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
    
    return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
        context
    });
};

/**
 * GET /api/pricing/current/{comic-id}
 * Get current pricing data for a specific comic
 */
router.get('/current/:comicId', validateComicId, async (req, res) => {
    try {
        const { comicId } = req.params;
        const { condition, variant, marketplace } = req.query;
        
        // Generate cache key
        const cacheKey = cache.generateKey('current', comicId, { condition, variant, marketplace });
        
        // Check cache first
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📊 Fetching current pricing for comic: ${comicId}`);

        // Collect fresh pricing data
        const collectionResult = await dataCollectionService.collectPricingData(comicId, {
            maxResults: 50,
            condition,
            marketplace,
            includeRecent: true
        });

        if (!collectionResult.processedData || Object.keys(collectionResult.processedData).length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No pricing data available for this comic',
                code: 'NO_DATA_FOUND'
            });
        }

        // Get the first (and likely only) comic from processed data
        const comicKey = Object.keys(collectionResult.processedData)[0];
        const pricingData = collectionResult.processedData[comicKey];

        if (pricingData.status !== 'success') {
            return res.status(404).json({
                success: false,
                error: pricingData.status === 'insufficient_data' 
                    ? 'Insufficient pricing data available'
                    : 'Failed to process pricing data',
                code: 'PROCESSING_FAILED',
                details: pricingData
            });
        }

        // Format response data
        const currentPricing = {
            comic_id: comicId,
            current_value: {
                market_price: pricingData.data.fixedPrice?.statistics?.median || pricingData.data.auction?.statistics?.median,
                price_range: {
                    min: Math.min(
                        pricingData.data.fixedPrice?.statistics?.min || Infinity,
                        pricingData.data.auction?.statistics?.min || Infinity
                    ),
                    max: Math.max(
                        pricingData.data.fixedPrice?.statistics?.max || 0,
                        pricingData.data.auction?.statistics?.max || 0
                    )
                },
                confidence: Math.max(
                    pricingData.data.fixedPrice?.confidence?.overall || 0,
                    pricingData.data.auction?.confidence?.overall || 0
                )
            },
            market_activity: {
                total_listings: pricingData.data.overallRawListingCount,
                auction_listings: pricingData.data.auction?.rawListingCount || 0,
                fixed_price_listings: pricingData.data.fixedPrice?.rawListingCount || 0,
                recent_sales: Math.floor((pricingData.data.overallRawListingCount || 0) * 0.3) // Estimate
            },
            condition_breakdown: pricingData.data.fixedPrice?.conditionPricing || pricingData.data.auction?.conditionPricing,
            data_quality: pricingData.data.fixedPrice?.dataQuality || pricingData.data.auction?.dataQuality,
            last_updated: new Date().toISOString()
        };

        // Enhance with variant classification if available
        if (req.query.title) {
            const classification = await classificationSystem.classify({
                title: req.query.title,
                description: req.query.description || '',
                imageUrl: req.query.imageUrl || ''
            });
            currentPricing.classification = {
                variant: classification.variant,
                condition: classification.condition
            };
        }

        // Cache the result
        await cache.set(cacheKey, currentPricing, CACHE_TTL.current);

        res.json({
            success: true,
            data: currentPricing,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(res, error, 'GET /current');
    }
});

/**
 * GET /api/pricing/history/{comic-id}
 * Get historical pricing data with date range support
 */
router.get('/history/:comicId', validateComicId, validatePagination, async (req, res) => {
    try {
        const { comicId } = req.params;
        const { 
            start_date, 
            end_date, 
            interval = 'daily', 
            condition,
            marketplace 
        } = req.query;
        const { page, limit, offset } = req.pagination;

        // Validate date range
        const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days ago
        const endDate = end_date ? new Date(end_date) : new Date();

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date must be before end date',
                code: 'INVALID_DATE_RANGE'
            });
        }

        const cacheKey = cache.generateKey('history', comicId, { 
            start_date, end_date, interval, condition, marketplace, page, limit 
        });

        // Check cache
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📈 Fetching price history for comic: ${comicId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Query historical data from database
        let query = `
            SELECT 
                DATE_TRUNC($1, created_at) as period,
                AVG(price) as avg_price,
                MIN(price) as min_price,
                MAX(price) as max_price,
                COUNT(*) as transaction_count,
                marketplace,
                condition
            FROM pricing_data 
            WHERE created_at >= $2 AND created_at <= $3
        `;
        
        const queryParams = [interval, startDate, endDate];
        let paramIndex = 4;

        // Add comic identification (this would need to be enhanced based on your schema)
        if (comicId) {
            query += ` AND (title ILIKE $${paramIndex} OR comic_id = $${paramIndex})`;
            queryParams.push(`%${comicId}%`);
            paramIndex++;
        }

        if (condition) {
            query += ` AND condition = $${paramIndex}`;
            queryParams.push(condition);
            paramIndex++;
        }

        if (marketplace) {
            query += ` AND marketplace = $${paramIndex}`;
            queryParams.push(marketplace);
            paramIndex++;
        }

        query += ` 
            GROUP BY period, marketplace, condition 
            ORDER BY period DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);

        // Format historical data
        const historyData = {
            comic_id: comicId,
            date_range: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                interval
            },
            price_history: result.rows.map(row => ({
                period: row.period,
                average_price: parseFloat(row.avg_price),
                price_range: {
                    min: parseFloat(row.min_price),
                    max: parseFloat(row.max_price)
                },
                transaction_count: parseInt(row.transaction_count),
                marketplace: row.marketplace,
                condition: row.condition
            })),
            summary: {
                total_records: result.rows.length,
                date_range_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
                avg_daily_transactions: result.rows.length > 0 
                    ? Math.round(result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0) / result.rows.length)
                    : 0
            },
            pagination: {
                page,
                limit,
                total_pages: Math.ceil(result.rows.length / limit)
            }
        };

        // Cache the result
        await cache.set(cacheKey, historyData, CACHE_TTL.history);

        res.json({
            success: true,
            data: historyData,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(res, error, 'GET /history');
    }
});

/**
 * GET /api/pricing/trends/{comic-id}
 * Get market trend analysis and price movement indicators
 */
router.get('/trends/:comicId', validateComicId, async (req, res) => {
    try {
        const { comicId } = req.params;
        const { 
            period = '30d',
            include_forecast = 'false',
            condition,
            marketplace 
        } = req.query;

        const cacheKey = cache.generateKey('trends', comicId, { period, include_forecast, condition, marketplace });

        // Check cache
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📊 Analyzing trends for comic: ${comicId} over period: ${period}`);

        // Collect current data for trend analysis
        const collectionResult = await dataCollectionService.collectPricingData(comicId, {
            maxResults: 100,
            condition,
            marketplace,
            includeHistorical: true
        });

        if (!collectionResult.processedData || Object.keys(collectionResult.processedData).length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No trend data available for this comic',
                code: 'NO_TREND_DATA'
            });
        }

        const comicKey = Object.keys(collectionResult.processedData)[0];
        const pricingData = collectionResult.processedData[comicKey];

        if (pricingData.status !== 'success') {
            return res.status(404).json({
                success: false,
                error: 'Failed to analyze trends',
                code: 'TREND_ANALYSIS_FAILED'
            });
        }

        // Calculate trend metrics
        const trends = {
            auction: pricingData.data.auction?.trends,
            fixedPrice: pricingData.data.fixedPrice?.trends
        };

        const trendData = {
            comic_id: comicId,
            analysis_period: period,
            price_movement: {
                direction: this.determineTrendDirection(trends),
                magnitude: this.calculateTrendMagnitude(trends),
                momentum: this.calculateMomentum(trends),
                volatility: Math.max(
                    pricingData.data.auction?.statistics?.coefficientOfVariation || 0,
                    pricingData.data.fixedPrice?.statistics?.coefficientOfVariation || 0
                )
            },
            market_indicators: {
                support_level: this.calculateSupportLevel(pricingData.data),
                resistance_level: this.calculateResistanceLevel(pricingData.data),
                trend_strength: this.calculateTrendStrength(trends),
                market_sentiment: this.assessMarketSentiment(pricingData.data)
            },
            trading_volume: {
                recent_activity: pricingData.data.overallRawListingCount,
                volume_trend: this.calculateVolumeTrend(pricingData.data),
                liquidity_score: this.calculateLiquidityScore(pricingData.data)
            },
            insights: pricingData.data.auction?.insights || pricingData.data.fixedPrice?.insights,
            confidence: Math.max(
                pricingData.data.auction?.confidence?.overall || 0,
                pricingData.data.fixedPrice?.confidence?.overall || 0
            )
        };

        // Add forecast if requested
        if (include_forecast === 'true') {
            trendData.forecast = this.generatePriceForecast(pricingData.data, 30); // 30-day forecast
        }

        // Cache the result
        await cache.set(cacheKey, trendData, CACHE_TTL.trends);

        res.json({
            success: true,
            data: trendData,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(res, error, 'GET /trends');
    }
});

/**
 * GET /api/pricing/suggestions/{comic-id}
 * Get AI-powered listing price suggestions and market recommendations
 */
router.get('/suggestions/:comicId', validateComicId, async (req, res) => {
    try {
        const { comicId } = req.params;
        const { 
            action = 'sell',
            condition,
            variant,
            user_context 
        } = req.query;

        const cacheKey = cache.generateKey('suggestions', comicId, { action, condition, variant });

        // Check cache
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🤖 Generating AI suggestions for comic: ${comicId}, action: ${action}`);

        // Collect and analyze pricing data
        const collectionResult = await dataCollectionService.collectPricingData(comicId, {
            maxResults: 75,
            condition,
            includeRecommendations: true
        });

        if (!collectionResult.processedData || Object.keys(collectionResult.processedData).length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No data available for price suggestions',
                code: 'NO_SUGGESTION_DATA'
            });
        }

        // Generate AI recommendations
        const userContextParsed = user_context ? JSON.parse(user_context) : {};
        const recommendations = await recommendationEngine.generateRecommendations(
            collectionResult.processedData,
            { ...userContextParsed, action, condition }
        );

        const comicKey = Object.keys(collectionResult.processedData)[0];
        const comicRecommendations = recommendations.comics[comicKey];

        if (!comicRecommendations) {
            return res.status(404).json({
                success: false,
                error: 'Could not generate recommendations',
                code: 'RECOMMENDATION_FAILED'
            });
        }

        // Format suggestions
        const suggestions = {
            comic_id: comicId,
            action,
            pricing_suggestions: {
                recommended_price: this.extractRecommendedPrice(comicRecommendations, action),
                price_range: this.extractPriceRange(comicRecommendations, action),
                confidence_interval: this.calculateConfidenceInterval(comicRecommendations),
                market_position: this.assessMarketPosition(comicRecommendations)
            },
            timing_advice: {
                optimal_timing: this.extractTimingAdvice(comicRecommendations),
                market_conditions: this.assessMarketConditions(comicRecommendations),
                urgency_score: this.calculateUrgencyScore(comicRecommendations)
            },
            risk_assessment: {
                risk_level: this.assessRiskLevel(comicRecommendations),
                risk_factors: this.extractRiskFactors(comicRecommendations),
                mitigation_strategies: this.getMitigationStrategies(comicRecommendations)
            },
            recommendations: comicRecommendations.recommendations.slice(0, 5), // Top 5 recommendations
            data_quality: comicRecommendations.dataQuality,
            confidence: comicRecommendations.confidence,
            generated_at: new Date().toISOString()
        };

        // Cache the result
        await cache.set(cacheKey, suggestions, CACHE_TTL.suggestions);

        res.json({
            success: true,
            data: suggestions,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(res, error, 'GET /suggestions');
    }
});

/**
 * Helper methods for trend analysis and recommendations
 */
const TrendAnalysisHelpers = {
    determineTrendDirection(trends) {
        const auctionTrend = trends.auction?.direction || 0;
        const fixedTrend = trends.fixedPrice?.direction || 0;
        const avgTrend = (auctionTrend + fixedTrend) / 2;
        
        if (avgTrend > 0.05) return 'upward';
        if (avgTrend < -0.05) return 'downward';
        return 'stable';
    },

    calculateTrendMagnitude(trends) {
        const auctionMag = Math.abs(trends.auction?.percentageChange || 0);
        const fixedMag = Math.abs(trends.fixedPrice?.percentageChange || 0);
        return Math.max(auctionMag, fixedMag);
    },

    calculateMomentum(trends) {
        // Simplified momentum calculation
        const auctionMomentum = trends.auction?.momentum || 0;
        const fixedMomentum = trends.fixedPrice?.momentum || 0;
        return (auctionMomentum + fixedMomentum) / 2;
    },

    calculateSupportLevel(data) {
        const auctionMin = data.auction?.statistics?.percentiles?.p25 || 0;
        const fixedMin = data.fixedPrice?.statistics?.percentiles?.p25 || 0;
        return Math.min(auctionMin, fixedMin) || Math.max(auctionMin, fixedMin);
    },

    calculateResistanceLevel(data) {
        const auctionMax = data.auction?.statistics?.percentiles?.p75 || 0;
        const fixedMax = data.fixedPrice?.statistics?.percentiles?.p75 || 0;
        return Math.max(auctionMax, fixedMax) || Math.min(auctionMax, fixedMax);
    },

    calculateTrendStrength(trends) {
        const auctionStrength = trends.auction?.strength || 0;
        const fixedStrength = trends.fixedPrice?.strength || 0;
        return Math.max(auctionStrength, fixedStrength);
    },

    assessMarketSentiment(data) {
        const totalListings = data.overallRawListingCount || 0;
        const auctionCount = data.auction?.rawListingCount || 0;
        const fixedCount = data.fixedPrice?.rawListingCount || 0;
        
        if (totalListings === 0) return 'unknown';
        
        const auctionRatio = auctionCount / totalListings;
        if (auctionRatio > 0.6) return 'bullish'; // More auctions indicate higher demand
        if (auctionRatio < 0.3) return 'bearish'; // More fixed prices indicate cautious selling
        return 'neutral';
    }
};

// Add helper methods to router for use in endpoints
Object.assign(router, TrendAnalysisHelpers);

const RecommendationHelpers = {
    extractRecommendedPrice(recommendations, action) {
        const pricingRecs = recommendations.recommendations.filter(r => r.type === 'pricing_strategy' && r.action === action);
        if (pricingRecs.length > 0) {
            return pricingRecs[0].data?.suggestedPrice || pricingRecs[0].data?.maxBuyPrice || null;
        }
        return null;
    },

    extractPriceRange(recommendations, action) {
        const pricingRecs = recommendations.recommendations.filter(r => r.type === 'pricing_strategy' && r.action === action);
        if (pricingRecs.length > 0 && pricingRecs[0].data?.priceRange) {
            return pricingRecs[0].data.priceRange;
        }
        return { min: null, max: null };
    },

    calculateConfidenceInterval(recommendations) {
        return {
            lower: recommendations.confidence * 0.9,
            upper: recommendations.confidence * 1.1,
            level: recommendations.confidence
        };
    },

    assessMarketPosition(recommendations) {
        const recommended = this.extractRecommendedPrice(recommendations, 'sell');
        // This would need access to market statistics for proper implementation
        return recommended ? 'competitive' : 'unknown';
    },

    extractTimingAdvice(recommendations) {
        const timingRecs = recommendations.recommendations.filter(r => r.type === 'timing_advice');
        return timingRecs.length > 0 ? timingRecs[0].title : 'Market timing analysis unavailable';
    },

    assessMarketConditions(recommendations) {
        const opportunityRecs = recommendations.recommendations.filter(r => r.type === 'market_opportunity');
        return opportunityRecs.length > 0 ? 'favorable' : 'neutral';
    },

    calculateUrgencyScore(recommendations) {
        const avgPriority = recommendations.recommendations.reduce((sum, r) => sum + r.priority, 0) / recommendations.recommendations.length;
        return Math.round(avgPriority / 10 * 100); // Convert to 0-100 scale
    },

    assessRiskLevel(recommendations) {
        const riskRecs = recommendations.recommendations.filter(r => r.type === 'risk_assessment');
        if (riskRecs.length > 0) {
            return riskRecs[0].title.toLowerCase().includes('high') ? 'high' : 
                   riskRecs[0].title.toLowerCase().includes('low') ? 'low' : 'medium';
        }
        return 'medium';
    },

    extractRiskFactors(recommendations) {
        const riskRecs = recommendations.recommendations.filter(r => r.type === 'risk_assessment');
        return riskRecs.map(r => r.description);
    },

    getMitigationStrategies(recommendations) {
        return recommendations.recommendations
            .filter(r => r.rationale)
            .map(r => r.rationale)
            .slice(0, 3); // Top 3 strategies
    }
};

// Add recommendation helpers to router
Object.assign(router, RecommendationHelpers);

/**
 * GET /api/pricing/health
 * Health check endpoint for the pricing API
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                data_collection: 'unknown',
                price_normalization: 'healthy',
                recommendations: 'healthy',
                classification: 'healthy',
                cache: redisClient ? 'redis' : 'memory',
                database: 'unknown'
            },
            cache_stats: {
                type: redisClient ? 'redis' : 'memory',
                memory_entries: memoryCache.size
            }
        };

        // Test data collection service
        try {
            const dcHealth = await dataCollectionService.healthCheck();
            health.services.data_collection = dcHealth.status;
        } catch (error) {
            health.services.data_collection = 'error';
            health.status = 'degraded';
        }

        // Test database connection
        try {
            await db.query('SELECT 1');
            health.services.database = 'healthy';
        } catch (error) {
            health.services.database = 'error';
            health.status = 'degraded';
        }

        // Test Redis if available
        if (redisClient) {
            try {
                await redisClient.ping();
                health.services.cache = 'redis_healthy';
            } catch (error) {
                health.services.cache = 'redis_error_fallback_memory';
                health.status = 'degraded';
            }
        }

        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 206 : 500;

        res.status(statusCode).json(health);

    } catch (error) {
        handleError(res, error, 'GET /health');
    }
});

/**
 * GET /api/pricing/stats
 * Get API usage statistics and performance metrics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            cache: {
                memory_entries: memoryCache.size,
                redis_available: !!redisClient
            },
            services: {
                data_collection: dataCollectionService.getCollectionStats(),
                memory_usage: process.memoryUsage(),
                uptime: process.uptime()
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(res, error, 'GET /stats');
    }
});

module.exports = router; 