const express = require('express');
const router = express.Router();
const db = require('../db');

// Import Task 8 services
const EnhancedListingService = require('../comiccomp/services/EnhancedListingService');
const MarketInsightsGenerator = require('../comiccomp/services/MarketInsightsGenerator');
const WatchlistManager = require('../comiccomp/services/WatchlistManager');
const ListingSuccessTracker = require('../comiccomp/services/ListingSuccessTracker');

// Initialize services
const enhancedListingService = new EnhancedListingService();
const marketInsightsGenerator = new MarketInsightsGenerator();
const watchlistManager = new WatchlistManager();
const listingSuccessTracker = new ListingSuccessTracker();

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    // Mock user for testing - in production, verify JWT token
    req.user = req.user || { userId: 1 };
    next();
};

/**
 * GET /api/seller-actions/listing-recommendation/:collectionId
 * Generate smart listing recommendation for a collection item
 */
router.get('/listing-recommendation/:collectionId', authenticateToken, async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { userId } = req.user;

        // Generate comprehensive listing recommendation
        const recommendation = await enhancedListingService.generateListingRecommendation(
            userId, 
            collectionId
        );

        res.json(recommendation);

    } catch (error) {
        console.error('Error generating listing recommendation:', error);
        res.status(500).json({ 
            error: 'Failed to generate listing recommendation',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/create-listing
 * Create an enhanced marketplace listing with AI insights
 */
router.post('/create-listing', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            collectionId, 
            price, 
            condition, 
            description, 
            useAIEnhancements = true 
        } = req.body;

        // Validate required fields
        if (!collectionId || !price || !condition) {
            return res.status(400).json({ 
                error: 'Missing required fields: collectionId, price, condition' 
            });
        }

        // Create enhanced listing
        const result = await enhancedListingService.createEnhancedListing(
            userId,
            collectionId,
            {
                price: parseFloat(price),
                condition,
                description,
                useAIEnhancements
            },
            {
                actualPrice: parseFloat(price),
                timeFromRecommendation: Date.now() // Could be passed from frontend
            }
        );

        if (result.success) {
            // Track listing creation for analytics
            await listingSuccessTracker.trackListingCreation({
                listingId: result.listing.id,
                userId,
                comicId: result.listing.comic_id,
                collectionId,
                recommendation: result.recommendation.recommendation,
                actualPrice: parseFloat(price),
                condition,
                enhancedDescription: useAIEnhancements,
                marketInsights: result.recommendation.marketInsights?.insights || [],
                marketConditions: result.recommendation.marketConditions,
                recommendationTimestamp: new Date()
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Error creating enhanced listing:', error);
        res.status(500).json({ 
            error: 'Failed to create listing',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/listing-suggestions
 * Get smart listing suggestions based on collection and market analysis
 */
router.get('/listing-suggestions', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { limit = 10 } = req.query;

        // Generate listing suggestions using watchlist patterns
        const suggestions = await watchlistManager.generateListingSuggestions(userId, {
            limit: parseInt(limit)
        });

        res.json(suggestions);

    } catch (error) {
        console.error('Error getting listing suggestions:', error);
        res.status(500).json({ 
            error: 'Failed to get listing suggestions',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/add-to-watchlist
 * Add comic to user's enhanced watchlist with smart monitoring
 */
router.post('/add-to-watchlist', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            comicId, 
            maxPrice, 
            minCondition, 
            priority, 
            notificationsEnabled = true 
        } = req.body;

        if (!comicId) {
            return res.status(400).json({ error: 'comicId is required' });
        }

        // Add to enhanced watchlist
        const result = await watchlistManager.addToWatchlist(userId, comicId, {
            maxPrice,
            minCondition,
            priority,
            notificationsEnabled
        });

        res.json(result);

    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ 
            error: 'Failed to add to watchlist',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/watchlist
 * Get user's enhanced watchlist with market insights
 */
router.get('/watchlist', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const watchlist = await watchlistManager.getUserWatchlist(userId);

        // Add market insights for each watchlist item
        const enhancedWatchlist = await Promise.all(
            watchlist.map(async (item) => {
                try {
                    const marketData = await watchlistManager.getMarketDataForWatchlist(item.comic_id);
                    const insights = await marketInsightsGenerator.generateInsights(
                        item.comic_id, 
                        marketData
                    );
                    
                    return {
                        ...item,
                        marketInsights: insights,
                        currentMarketPrice: marketData.current.length > 0 ?
                            marketData.current.reduce((sum, p) => sum + p.price, 0) / marketData.current.length :
                            null
                    };
                } catch (error) {
                    console.error(`Error getting insights for watchlist item ${item.id}:`, error);
                    return item;
                }
            })
        );

        res.json({
            watchlist: enhancedWatchlist,
            totalItems: enhancedWatchlist.length
        });

    } catch (error) {
        console.error('Error getting watchlist:', error);
        res.status(500).json({ 
            error: 'Failed to get watchlist',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/watchlist/monitor
 * Monitor watchlist items for price changes and opportunities
 */
router.post('/watchlist/monitor', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const monitoringResult = await watchlistManager.monitorWatchlistPrices(userId);

        res.json(monitoringResult);

    } catch (error) {
        console.error('Error monitoring watchlist:', error);
        res.status(500).json({ 
            error: 'Failed to monitor watchlist',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/market-insights/:comicId
 * Get comprehensive market insights for a specific comic
 */
router.get('/market-insights/:comicId', authenticateToken, async (req, res) => {
    try {
        const { comicId } = req.params;

        // Get market data
        const marketData = await watchlistManager.getMarketDataForWatchlist(comicId);
        
        // Generate comprehensive insights
        const insights = await marketInsightsGenerator.generateInsights(comicId, marketData);

        res.json({
            comicId,
            marketData: {
                totalSales: marketData.current.length,
                avgPrice: marketData.current.length > 0 ?
                    marketData.current.reduce((sum, item) => sum + item.price, 0) / marketData.current.length :
                    0,
                dateRange: {
                    start: marketData.current.length > 0 ? 
                        Math.min(...marketData.current.map(item => new Date(item.sale_date))) : null,
                    end: marketData.current.length > 0 ? 
                        Math.max(...marketData.current.map(item => new Date(item.sale_date))) : null
                }
            },
            insights
        });

    } catch (error) {
        console.error('Error getting market insights:', error);
        res.status(500).json({ 
            error: 'Failed to get market insights',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/success-report
 * Get listing success analytics and performance report
 */
router.get('/success-report', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            endDate = new Date(),
            groupBy = 'weekly'
        } = req.query;

        const report = await listingSuccessTracker.generateSuccessReport({
            userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            groupBy
        });

        res.json(report);

    } catch (error) {
        console.error('Error generating success report:', error);
        res.status(500).json({ 
            error: 'Failed to generate success report',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/listing/:listingId/sale
 * Track listing sale completion for analytics
 */
router.post('/listing/:listingId/sale', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { salePrice, buyerId, method = 'direct_purchase' } = req.body;

        if (!salePrice) {
            return res.status(400).json({ error: 'salePrice is required' });
        }

        const result = await listingSuccessTracker.trackListingSale(listingId, {
            salePrice: parseFloat(salePrice),
            buyerId,
            method
        });

        res.json(result);

    } catch (error) {
        console.error('Error tracking listing sale:', error);
        res.status(500).json({ 
            error: 'Failed to track listing sale',
            details: error.message 
        });
    }
});

/**
 * PUT /api/seller-actions/listing/:listingId/metrics
 * Update listing performance metrics (views, watchers, messages)
 */
router.put('/listing/:listingId/metrics', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { views, watchers, messages } = req.body;

        await listingSuccessTracker.updateListingMetrics(listingId, {
            views: parseInt(views) || 0,
            watchers: parseInt(watchers) || 0,
            messages: parseInt(messages) || 0
        });

        res.json({ success: true, message: 'Metrics updated successfully' });

    } catch (error) {
        console.error('Error updating listing metrics:', error);
        res.status(500).json({ 
            error: 'Failed to update listing metrics',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/watchlist/optimize
 * Optimize user's watchlist with intelligent price and priority updates
 */
router.post('/watchlist/optimize', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        const optimizationResult = await watchlistManager.optimizeWatchlist(userId);

        res.json(optimizationResult);

    } catch (error) {
        console.error('Error optimizing watchlist:', error);
        res.status(500).json({ 
            error: 'Failed to optimize watchlist',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/recommendations/performance
 * Get AI recommendation engine performance analytics
 */
router.get('/recommendations/performance', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate = new Date()
        } = req.query;

        const performance = await listingSuccessTracker.analyzeRecommendationPerformance(
            userId,
            new Date(startDate),
            new Date(endDate)
        );

        res.json({
            period: { startDate, endDate },
            performance,
            insights: [
                performance.overallAccuracy > 0.8 ? 'Excellent recommendation accuracy' : 
                performance.overallAccuracy > 0.6 ? 'Good recommendation accuracy' : 
                'Recommendation accuracy needs improvement',
                
                performance.confidenceCorrelation > 0.7 ? 'Strong confidence correlation' :
                'Weak confidence correlation - review confidence calculation'
            ]
        });

    } catch (error) {
        console.error('Error getting recommendation performance:', error);
        res.status(500).json({ 
            error: 'Failed to get recommendation performance',
            details: error.message 
        });
    }
});

/**
 * POST /api/seller-actions/feedback
 * Submit feedback on recommendation quality for machine learning improvement
 */
router.post('/feedback', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            recommendationId, 
            listingId,
            accuracy,
            helpfulness,
            comments,
            outcomes
        } = req.body;

        if (!recommendationId) {
            return res.status(400).json({ error: 'recommendationId is required' });
        }

        // Store feedback for ML improvement
        const feedbackData = {
            user_id: userId,
            recommendation_id: recommendationId,
            listing_id: listingId,
            accuracy_rating: accuracy,
            helpfulness_rating: helpfulness,
            comments,
            outcomes: JSON.stringify(outcomes || {}),
            created_at: new Date()
        };

        // This would store in a feedback table for ML training
        console.log('📝 Feedback received:', feedbackData);

        res.json({ 
            success: true, 
            message: 'Feedback submitted successfully',
            thankYou: 'Your feedback helps improve our AI recommendations!' 
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ 
            error: 'Failed to submit feedback',
            details: error.message 
        });
    }
});

/**
 * GET /api/seller-actions/dashboard
 * Get comprehensive seller dashboard with key metrics and insights
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;

        // Get recent listing suggestions
        const listingSuggestions = await watchlistManager.generateListingSuggestions(userId, { limit: 5 });
        
        // Get watchlist alerts
        const watchlistAlerts = await watchlistManager.monitorWatchlistPrices(userId);
        
        // Get recent success metrics
        const successReport = await listingSuccessTracker.generateSuccessReport({
            userId,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        });

        // Get recommendation performance
        const recommendationPerformance = await listingSuccessTracker.analyzeRecommendationPerformance(
            userId,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
        );

        const dashboard = {
            listingSuggestions: {
                topSuggestions: listingSuggestions.suggestions.slice(0, 3),
                totalOpportunities: listingSuggestions.suggestions.length,
                totalPotentialProfit: listingSuggestions.suggestions.reduce(
                    (sum, s) => sum + s.potentialProfit, 0
                )
            },
            watchlistAlerts: {
                activeAlerts: watchlistAlerts.alerts.length,
                urgentAlerts: watchlistAlerts.alerts.filter(a => a.urgency === 'high').length,
                recentAlerts: watchlistAlerts.alerts.slice(0, 5)
            },
            performance: {
                summary: successReport.summary,
                trend: successReport.trends,
                recommendations: recommendationPerformance
            },
            quickStats: {
                avgDaysToSale: successReport.summary.avgDaysToSale,
                priceAccuracy: Math.round(successReport.summary.avgPriceAccuracy * 100),
                sellThroughRate: Math.round(successReport.summary.sellThroughRate * 100),
                totalRevenue: successReport.summary.totalRevenue
            }
        };

        res.json(dashboard);

    } catch (error) {
        console.error('Error getting seller dashboard:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard data',
            details: error.message 
        });
    }
});

module.exports = router; 