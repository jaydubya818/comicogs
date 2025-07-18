/**
 * Task 4: Price Trend Dashboard Backend API
 * Comprehensive REST API endpoints for pricing data and market analysis
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Import ComicComp services (temporarily commented out for basic startup)
// const DataCollectionService = require('../comiccomp/services/DataCollectionService');
// const PriceNormalizationEngine = require('../comiccomp/services/PriceNormalizationEngine');
// const RecommendationEngine = require('../comiccomp/services/RecommendationEngine');
// const { VariantConditionClassificationSystem } = require('../comiccomp/services/VariantConditionClassificationSystem');

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
    priceHistory: 1800,    // 30 minutes for price history
    marketData: 600,       // 10 minutes for real-time market data
    recommendations: 3600, // 1 hour for recommendations
    analytics: 7200,       // 2 hours for analytics data
    suggestions: 900       // 15 minutes for listing suggestions
};

// Initialize services (temporarily commented out)
// const dataCollectionService = new DataCollectionService({
//     maxRetries: 3,
//     retryDelay: 1000,
//     enabledMarketplaces: ['ebay', 'whatnot', 'comicconnect', 'heritage', 'mycomicshop'],
//     apiKeys: {
//         ebayClientId: process.env.EBAY_CLIENT_ID,
//         ebayClientSecret: process.env.EBAY_CLIENT_SECRET
//     }
// });

// const priceNormalizer = new PriceNormalizationEngine();
// const recommendationEngine = new RecommendationEngine();
// const classificationSystem = new VariantConditionClassificationSystem(); 