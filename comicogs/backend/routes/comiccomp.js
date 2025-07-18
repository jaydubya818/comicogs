const express = require('express');
const router = express.Router();
const DataCollectionService = require('../comiccomp/services/DataCollectionService');
const PriceNormalizationEngine = require('../comiccomp/services/PriceNormalizationEngine');
const RecommendationEngine = require('../comiccomp/services/RecommendationEngine');

// Initialize ComicComp services
const dataCollectionService = new DataCollectionService({
    maxRetries: 3,
    retryDelay: 1000,
    enabledMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage'],
    apiKeys: {
        ebayClientId: process.env.EBAY_CLIENT_ID,
        ebayClientSecret: process.env.EBAY_CLIENT_SECRET
    },
    ebay: {
        sandbox: process.env.NODE_ENV !== 'production'
    }
});

/**
 * Main search endpoint for comprehensive comic pricing analysis
 * POST /api/comiccomp/search
 */
router.post('/search', async (req, res) => {
    try {
        const { query, options = {} } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        console.log(`🔍 ComicComp search request: "${query}"`);

        // Perform comprehensive data collection and analysis
        const result = await dataCollectionService.collectPricingData(query, {
            maxResults: options.maxResults || 100,
            condition: options.condition,
            minPrice: options.minPrice,
            maxPrice: options.maxPrice,
            gradeMin: options.gradeMin,
            gradeMax: options.gradeMax,
            marketplace: options.marketplace,
            userContext: options.userContext || {}
        });

        if (result.success) {
            res.json({
                success: true,
                query,
                pricing: result.pricing,
                recommendations: result.recommendations,
                summary: result.summary,
                collectionStats: result.collectionStats,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                query,
                error: result.error,
                collectionStats: result.collectionStats
            });
        }

    } catch (error) {
        console.error('❌ ComicComp search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get pricing data for a specific comic
 * GET /api/comiccomp/pricing/:comicKey
 */
router.get('/pricing/:comicKey', async (req, res) => {
    try {
        const { comicKey } = req.params;
        const { timeRange = 30 } = req.query;

        const pricingData = await dataCollectionService.getStoredPricingData(comicKey, {
            timeRange: parseInt(timeRange)
        });

        res.json({
            success: true,
            comicKey,
            data: pricingData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching pricing data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get trending comics across all marketplaces
 * GET /api/comiccomp/trending
 */
router.get('/trending', async (req, res) => {
    try {
        const trendingData = await dataCollectionService.getTrendingComics();

        res.json({
            success: true,
            trending: trendingData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching trending comics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get collection statistics and service health
 * GET /api/comiccomp/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = dataCollectionService.getCollectionStats();

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check endpoint
 * GET /api/comiccomp/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await dataCollectionService.healthCheck();

        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 206 : 500;

        res.status(statusCode).json(health);

    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Manual price normalization endpoint (for testing/debugging)
 * POST /api/comiccomp/normalize
 */
router.post('/normalize', async (req, res) => {
    try {
        const { rawData, options = {} } = req.body;

        if (!rawData || !Array.isArray(rawData)) {
            return res.status(400).json({
                success: false,
                error: 'Raw pricing data array is required'
            });
        }

        const normalizer = new PriceNormalizationEngine();
        const normalizedData = await normalizer.normalizePricingData(rawData, options);

        res.json({
            success: true,
            normalized: normalizedData,
            inputCount: rawData.length,
            outputCount: Object.keys(normalizedData).length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Price normalization error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Manual recommendation generation endpoint (for testing/debugging)
 * POST /api/comiccomp/recommend
 */
router.post('/recommend', async (req, res) => {
    try {
        const { pricingData, userContext = {} } = req.body;

        if (!pricingData || typeof pricingData !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Normalized pricing data object is required'
            });
        }

        const recommendationEngine = new RecommendationEngine();
        const recommendations = await recommendationEngine.generateRecommendations(pricingData, userContext);

        res.json({
            success: true,
            recommendations,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Recommendation generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Batch search endpoint for multiple comics
 * POST /api/comiccomp/batch-search
 */
router.post('/batch-search', async (req, res) => {
    try {
        const { queries, options = {} } = req.body;

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of search queries is required'
            });
        }

        if (queries.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 10 queries allowed per batch'
            });
        }

        console.log(`🔍 ComicComp batch search: ${queries.length} queries`);

        const results = {};
        const errors = {};
        let successCount = 0;

        // Process queries sequentially to avoid overwhelming APIs
        for (const query of queries) {
            try {
                const result = await dataCollectionService.collectPricingData(query, {
                    ...options,
                    maxResults: Math.min(options.maxResults || 50, 50) // Limit for batch
                });

                if (result.success) {
                    results[query] = {
                        pricing: result.pricing,
                        recommendations: result.recommendations,
                        summary: result.summary
                    };
                    successCount++;
                } else {
                    errors[query] = result.error;
                }

                // Small delay between queries
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`❌ Batch search error for "${query}":`, error);
                errors[query] = error.message;
            }
        }

        res.json({
            success: successCount > 0,
            totalQueries: queries.length,
            successCount,
            errorCount: Object.keys(errors).length,
            results,
            errors: Object.keys(errors).length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Batch search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get historical pricing trends for a comic
 * GET /api/comiccomp/trends/:comicKey
 */
router.get('/trends/:comicKey', async (req, res) => {
    try {
        const { comicKey } = req.params;
        const { days = 90 } = req.query;

        // This would query historical data from the database
        // For now, return a placeholder response
        res.json({
            success: true,
            comicKey,
            trends: {
                timeframe: `${days} days`,
                message: 'Historical trend analysis coming soon'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching trends:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Price alert subscription endpoint
 * POST /api/comiccomp/alerts
 */
router.post('/alerts', async (req, res) => {
    try {
        const { comicKey, targetPrice, email, alertType = 'below' } = req.body;

        if (!comicKey || !targetPrice || !email) {
            return res.status(400).json({
                success: false,
                error: 'Comic key, target price, and email are required'
            });
        }

        // This would store the alert in the database
        // For now, return a success response
        res.json({
            success: true,
            message: 'Price alert created successfully',
            alert: {
                comicKey,
                targetPrice,
                email,
                alertType,
                created: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error creating price alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Export data endpoint (CSV format)
 * GET /api/comiccomp/export/:comicKey
 */
router.get('/export/:comicKey', async (req, res) => {
    try {
        const { comicKey } = req.params;
        const { format = 'csv' } = req.query;

        if (format !== 'csv') {
            return res.status(400).json({
                success: false,
                error: 'Only CSV format is currently supported'
            });
        }

        // Get pricing data
        const pricingData = await dataCollectionService.getStoredPricingData(comicKey);

        if (!pricingData || pricingData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No pricing data found for this comic'
            });
        }

        // Generate CSV
        const csvHeader = 'Date,Marketplace,Price,Condition,Grade,Title,URL\n';
        const csvRows = pricingData.map(item => {
            return [
                item.scraped_at || item.created_at,
                item.marketplace,
                item.price,
                item.condition || '',
                item.grade || '',
                `"${(item.title || '').replace(/"/g, '""')}"`,
                item.listing_url || ''
            ].join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${comicKey}-pricing-data.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('❌ Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 