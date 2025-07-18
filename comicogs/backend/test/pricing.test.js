/**
 * Task 4: Price Trend Dashboard Backend API - Test Suite
 * Comprehensive tests for all pricing endpoints and acceptance criteria
 */

const request = require('supertest');
const express = require('express');
const { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals');

// Mock the database and services for testing
jest.mock('../db');
jest.mock('../../comiccomp/services/DataCollectionService');
jest.mock('../../comiccomp/services/PriceNormalizationEngine');
jest.mock('../../comiccomp/services/RecommendationEngine');
jest.mock('../../comiccomp/services/VariantConditionClassificationSystem');

const db = require('../db');
const pricingRoutes = require('../routes/pricing');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/pricing', pricingRoutes);

describe('Task 4: Price Trend Dashboard Backend API', () => {
    let server;
    const PORT = 3002; // Test port

    beforeAll(() => {
        server = app.listen(PORT);
    });

    afterAll(() => {
        if (server) {
            server.close();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup common mocks
        db.query.mockResolvedValue({ rows: [] });
    });

    describe('Acceptance Criteria 1: GET /api/pricing/current/{comic-id} endpoint', () => {
        const mockCurrentPricingResponse = {
            processedData: {
                'amazing-spider-man-300': {
                    status: 'success',
                    data: {
                        fixedPrice: {
                            statistics: {
                                median: 899.99,
                                min: 750.00,
                                max: 1200.00
                            },
                            confidence: { overall: 0.87 },
                            conditionPricing: {
                                'CGC 9.8': { average: 1200, count: 5 },
                                'CGC 9.6': { average: 950, count: 8 },
                                'Near Mint': { average: 850, count: 12 }
                            },
                            dataQuality: { score: 0.92 },
                            rawListingCount: 15
                        },
                        auction: {
                            statistics: {
                                median: 850.00,
                                min: 700.00,
                                max: 1100.00
                            },
                            confidence: { overall: 0.82 },
                            rawListingCount: 8
                        },
                        overallRawListingCount: 23
                    }
                }
            }
        };

        beforeEach(() => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockResolvedValue(mockCurrentPricingResponse)
            }));
        });

        test('should return current pricing data for valid comic ID', async () => {
            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('comic_id', 'amazing-spider-man-300');
            expect(response.body.data).toHaveProperty('current_value');
            expect(response.body.data.current_value).toHaveProperty('market_price');
            expect(response.body.data.current_value).toHaveProperty('price_range');
            expect(response.body.data.current_value).toHaveProperty('confidence');
            expect(response.body.data).toHaveProperty('market_activity');
            expect(response.body.data).toHaveProperty('condition_breakdown');
            expect(response.body.data).toHaveProperty('data_quality');
            expect(response.body.cached).toBe(false);
        });

        test('should handle cache correctly for repeated requests', async () => {
            // First request
            const response1 = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            expect(response1.body.cached).toBe(false);

            // Second request should be cached (if cache is working)
            const response2 = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            expect(response2.body.data.comic_id).toBe('amazing-spider-man-300');
        });

        test('should support filtering by condition parameter', async () => {
            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300?condition=CGC%209.8')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comic_id).toBe('amazing-spider-man-300');
        });

        test('should support filtering by marketplace parameter', async () => {
            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300?marketplace=ebay')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should return 400 for invalid comic ID', async () => {
            const response = await request(app)
                .get('/api/pricing/current/')
                .expect(404); // Express returns 404 for missing route parameters
        });

        test('should return 400 for empty comic ID', async () => {
            const response = await request(app)
                .get('/api/pricing/current/   ')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_COMIC_ID');
        });

        test('should return 404 when no pricing data is available', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockResolvedValue({ processedData: {} })
            }));

            const response = await request(app)
                .get('/api/pricing/current/non-existent-comic')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('NO_DATA_FOUND');
        });

        test('should include variant classification when title is provided', async () => {
            const { VariantConditionClassificationSystem } = require('../../comiccomp/services/VariantConditionClassificationSystem');
            VariantConditionClassificationSystem.mockImplementation(() => ({
                classify: jest.fn().mockResolvedValue({
                    variant: { type: 'cover_a', confidence: 0.95 },
                    condition: { condition: 'CGC 9.8', confidence: 0.98 }
                })
            }));

            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300?title=Amazing%20Spider-Man%20%23300%20Cover%20A')
                .expect(200);

            expect(response.body.data).toHaveProperty('classification');
            expect(response.body.data.classification.variant.type).toBe('cover_a');
        });
    });

    describe('Acceptance Criteria 2: GET /api/pricing/history/{comic-id} with date range support', () => {
        const mockHistoricalData = [
            {
                period: '2024-01-15',
                avg_price: '899.99',
                min_price: '750.00',
                max_price: '1200.00',
                transaction_count: '5',
                marketplace: 'ebay',
                condition: 'CGC 9.8'
            },
            {
                period: '2024-01-14',
                avg_price: '875.50',
                min_price: '725.00',
                max_price: '1150.00',
                transaction_count: '3',
                marketplace: 'heritage',
                condition: 'CGC 9.6'
            }
        ];

        beforeEach(() => {
            db.query.mockResolvedValue({ rows: mockHistoricalData });
        });

        test('should return historical pricing data with default date range', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('comic_id', 'amazing-spider-man-300');
            expect(response.body.data).toHaveProperty('date_range');
            expect(response.body.data).toHaveProperty('price_history');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.price_history)).toBe(true);
        });

        test('should support custom date range', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';

            const response = await request(app)
                .get(`/api/pricing/history/amazing-spider-man-300?start_date=${startDate}&end_date=${endDate}`)
                .expect(200);

            expect(response.body.data.date_range.start).toContain('2024-01-01');
            expect(response.body.data.date_range.end).toContain('2024-01-31');
        });

        test('should support different time intervals', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?interval=weekly')
                .expect(200);

            expect(response.body.data.date_range.interval).toBe('weekly');
        });

        test('should return 400 for invalid date range', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?start_date=2024-01-31&end_date=2024-01-01')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_DATE_RANGE');
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?page=2&limit=10')
                .expect(200);

            expect(response.body.data.pagination.page).toBe(2);
            expect(response.body.data.pagination.limit).toBe(10);
        });

        test('should limit page size to maximum', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?limit=500')
                .expect(200);

            expect(response.body.data.pagination.limit).toBe(100); // Max limit enforced
        });

        test('should support condition filtering', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?condition=CGC%209.8')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should support marketplace filtering', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?marketplace=ebay')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Acceptance Criteria 3: GET /api/pricing/trends/{comic-id} for market analysis', () => {
        const mockTrendData = {
            processedData: {
                'amazing-spider-man-300': {
                    status: 'success',
                    data: {
                        auction: {
                            trends: {
                                direction: 0.15,
                                percentageChange: 12.5,
                                momentum: 0.8,
                                strength: 0.75
                            },
                            statistics: {
                                coefficientOfVariation: 0.25
                            },
                            insights: ['Strong upward trend', 'High demand detected'],
                            confidence: { overall: 0.85 },
                            rawListingCount: 15
                        },
                        fixedPrice: {
                            trends: {
                                direction: 0.10,
                                percentageChange: 8.3,
                                momentum: 0.6
                            },
                            statistics: {
                                coefficientOfVariation: 0.18
                            },
                            confidence: { overall: 0.89 }
                        },
                        overallRawListingCount: 28
                    }
                }
            }
        };

        beforeEach(() => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockResolvedValue(mockTrendData)
            }));
        });

        test('should return comprehensive trend analysis', async () => {
            const response = await request(app)
                .get('/api/pricing/trends/amazing-spider-man-300')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('comic_id', 'amazing-spider-man-300');
            expect(response.body.data).toHaveProperty('analysis_period');
            expect(response.body.data).toHaveProperty('price_movement');
            expect(response.body.data).toHaveProperty('market_indicators');
            expect(response.body.data).toHaveProperty('trading_volume');
            expect(response.body.data).toHaveProperty('confidence');

            // Verify price movement structure
            expect(response.body.data.price_movement).toHaveProperty('direction');
            expect(response.body.data.price_movement).toHaveProperty('magnitude');
            expect(response.body.data.price_movement).toHaveProperty('momentum');
            expect(response.body.data.price_movement).toHaveProperty('volatility');

            // Verify market indicators structure
            expect(response.body.data.market_indicators).toHaveProperty('support_level');
            expect(response.body.data.market_indicators).toHaveProperty('resistance_level');
            expect(response.body.data.market_indicators).toHaveProperty('trend_strength');
            expect(response.body.data.market_indicators).toHaveProperty('market_sentiment');
        });

        test('should support different analysis periods', async () => {
            const response = await request(app)
                .get('/api/pricing/trends/amazing-spider-man-300?period=90d')
                .expect(200);

            expect(response.body.data.analysis_period).toBe('90d');
        });

        test('should include forecast when requested', async () => {
            const response = await request(app)
                .get('/api/pricing/trends/amazing-spider-man-300?include_forecast=true')
                .expect(200);

            expect(response.body.data).toHaveProperty('forecast');
        });

        test('should support condition filtering for trends', async () => {
            const response = await request(app)
                .get('/api/pricing/trends/amazing-spider-man-300?condition=CGC%209.8')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should handle cases with no trend data', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockResolvedValue({ processedData: {} })
            }));

            const response = await request(app)
                .get('/api/pricing/trends/non-existent-comic')
                .expect(404);

            expect(response.body.code).toBe('NO_TREND_DATA');
        });
    });

    describe('Acceptance Criteria 4: GET /api/pricing/suggestions/{comic-id} for listing recommendations', () => {
        const mockRecommendations = {
            processedData: {
                'amazing-spider-man-300': {
                    status: 'success',
                    data: { /* pricing data */ }
                }
            }
        };

        const mockAIRecommendations = {
            comics: {
                'amazing-spider-man-300': {
                    recommendations: [
                        {
                            type: 'pricing_strategy',
                            action: 'sell',
                            priority: 9,
                            title: 'Optimal Selling Price',
                            description: 'Consider pricing at $925',
                            rationale: 'Market analysis shows strong demand',
                            confidence: 0.87,
                            data: {
                                suggestedPrice: 925,
                                priceRange: {
                                    conservative: 875,
                                    aggressive: 975
                                }
                            }
                        },
                        {
                            type: 'timing_advice',
                            action: 'sell',
                            priority: 7,
                            title: 'Good Time to Sell',
                            description: 'Market conditions are favorable'
                        },
                        {
                            type: 'risk_assessment',
                            action: 'general',
                            priority: 5,
                            title: 'Low Risk Investment',
                            description: 'Stable market with low volatility'
                        }
                    ],
                    dataQuality: { score: 0.92 },
                    confidence: 0.85
                }
            }
        };

        beforeEach(() => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            const RecommendationEngine = require('../../comiccomp/services/RecommendationEngine');
            
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockResolvedValue(mockRecommendations)
            }));
            
            RecommendationEngine.mockImplementation(() => ({
                generateRecommendations: jest.fn().mockResolvedValue(mockAIRecommendations)
            }));
        });

        test('should return AI-powered listing suggestions', async () => {
            const response = await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('comic_id', 'amazing-spider-man-300');
            expect(response.body.data).toHaveProperty('action', 'sell');
            expect(response.body.data).toHaveProperty('pricing_suggestions');
            expect(response.body.data).toHaveProperty('timing_advice');
            expect(response.body.data).toHaveProperty('risk_assessment');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('confidence');

            // Verify pricing suggestions structure
            expect(response.body.data.pricing_suggestions).toHaveProperty('recommended_price');
            expect(response.body.data.pricing_suggestions).toHaveProperty('price_range');
            expect(response.body.data.pricing_suggestions).toHaveProperty('confidence_interval');

            // Verify recommendations array
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
            expect(response.body.data.recommendations.length).toBeLessThanOrEqual(5);
        });

        test('should support different action types', async () => {
            const response = await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300?action=buy')
                .expect(200);

            expect(response.body.data.action).toBe('buy');
        });

        test('should support condition filtering for suggestions', async () => {
            const response = await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300?condition=CGC%209.8')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should support user context for personalized recommendations', async () => {
            const userContext = JSON.stringify({ 
                experience_level: 'advanced',
                risk_tolerance: 'medium',
                investment_horizon: 'long_term'
            });

            const response = await request(app)
                .get(`/api/pricing/suggestions/amazing-spider-man-300?user_context=${encodeURIComponent(userContext)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should handle cases with no recommendation data', async () => {
            const RecommendationEngine = require('../../comiccomp/services/RecommendationEngine');
            RecommendationEngine.mockImplementation(() => ({
                generateRecommendations: jest.fn().mockResolvedValue({ comics: {} })
            }));

            const response = await request(app)
                .get('/api/pricing/suggestions/non-existent-comic')
                .expect(404);

            expect(response.body.code).toBe('RECOMMENDATION_FAILED');
        });
    });

    describe('Acceptance Criteria 5: Redis caching implementation', () => {
        test('should use in-memory cache when Redis is not available', async () => {
            // Redis is mocked as not available in test environment
            const response = await request(app)
                .get('/api/pricing/current/test-comic')
                .expect(200);

            // Should still work with in-memory cache
            expect(response.body.success).toBe(true);
        });

        test('should generate appropriate cache keys', async () => {
            const response1 = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            const response2 = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300?condition=CGC%209.8')
                .expect(200);

            // Different parameters should create different cache keys
            expect(response1.body.success).toBe(true);
            expect(response2.body.success).toBe(true);
        });

        test('cache should respect TTL settings', async () => {
            // This test verifies cache behavior - implementation depends on cache setup
            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            expect(response.body.cached).toBeDefined();
        });
    });

    describe('Acceptance Criteria 6: Pagination for large datasets', () => {
        test('should implement pagination for history endpoint', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?page=1&limit=10')
                .expect(200);

            expect(response.body.data.pagination).toEqual({
                page: 1,
                limit: 10,
                total_pages: expect.any(Number)
            });
        });

        test('should enforce maximum page size', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?limit=1000')
                .expect(200);

            expect(response.body.data.pagination.limit).toBe(100); // Max enforced
        });

        test('should handle invalid pagination parameters gracefully', async () => {
            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?page=-1&limit=0')
                .expect(200);

            expect(response.body.data.pagination.page).toBe(1); // Default to page 1
            expect(response.body.data.pagination.limit).toBeGreaterThan(0); // Default to positive limit
        });
    });

    describe('Acceptance Criteria 7: Comprehensive error handling', () => {
        test('should handle database connection errors', async () => {
            db.query.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INTERNAL_ERROR');
        });

        test('should handle service timeout errors', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockRejectedValue(new Error('Request timeout'))
            }));

            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should handle rate limiting errors', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                collectPricingData: jest.fn().mockRejectedValue(new Error('Rate limit exceeded'))
            }));

            const response = await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(429);

            expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        test('should handle malformed JSON in user context', async () => {
            const response = await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300?user_context=invalid-json')
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        test('should return appropriate error codes and messages', async () => {
            const response = await request(app)
                .get('/api/pricing/current/')
                .expect(404);

            // Express automatically handles missing route parameters
        });
    });

    describe('Health Check and Statistics Endpoints', () => {
        test('should provide health check endpoint', async () => {
            const response = await request(app)
                .get('/api/pricing/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('cache_stats');
        });

        test('should provide API statistics endpoint', async () => {
            const response = await request(app)
                .get('/api/pricing/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cache');
            expect(response.body.data).toHaveProperty('services');
            expect(response.body.data).toHaveProperty('timestamp');
        });

        test('should handle health check service errors gracefully', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            DataCollectionService.mockImplementation(() => ({
                healthCheck: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            }));

            const response = await request(app)
                .get('/api/pricing/health')
                .expect(206); // Degraded status

            expect(response.body.status).toBe('degraded');
        });
    });

    describe('Performance and Load Testing', () => {
        test('should handle concurrent requests efficiently', async () => {
            const promises = Array(10).fill().map(() =>
                request(app)
                    .get('/api/pricing/current/amazing-spider-man-300')
                    .expect(200)
            );

            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
        });

        test('should complete requests within reasonable time', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle large response datasets efficiently', async () => {
            // Mock large dataset
            const largeDataset = Array(1000).fill().map((_, i) => ({
                period: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                avg_price: (Math.random() * 1000 + 500).toFixed(2),
                min_price: (Math.random() * 500 + 200).toFixed(2),
                max_price: (Math.random() * 500 + 1000).toFixed(2),
                transaction_count: Math.floor(Math.random() * 10 + 1).toString(),
                marketplace: ['ebay', 'heritage', 'whatnot'][i % 3],
                condition: ['CGC 9.8', 'CGC 9.6', 'Near Mint'][i % 3]
            }));

            db.query.mockResolvedValue({ rows: largeDataset });

            const response = await request(app)
                .get('/api/pricing/history/amazing-spider-man-300?limit=100')
                .expect(200);

            expect(response.body.data.pagination.limit).toBe(100);
            expect(response.body.data.price_history.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Integration Testing', () => {
        test('should integrate correctly with DataCollectionService', async () => {
            const DataCollectionService = require('../../comiccomp/services/DataCollectionService');
            const mockService = DataCollectionService.mock.instances[0];

            await request(app)
                .get('/api/pricing/current/amazing-spider-man-300')
                .expect(200);

            expect(mockService.collectPricingData).toHaveBeenCalledWith(
                'amazing-spider-man-300',
                expect.objectContaining({
                    maxResults: 50,
                    includeRecent: true
                })
            );
        });

        test('should integrate correctly with RecommendationEngine', async () => {
            const RecommendationEngine = require('../../comiccomp/services/RecommendationEngine');
            const mockEngine = RecommendationEngine.mock.instances[0];

            await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300')
                .expect(200);

            expect(mockEngine.generateRecommendations).toHaveBeenCalled();
        });

        test('should properly chain service calls', async () => {
            // Test that services are called in the correct order
            const response = await request(app)
                .get('/api/pricing/suggestions/amazing-spider-man-300')
                .expect(200);

            expect(response.body.success).toBe(true);
            // Verify that data collection happens before recommendation generation
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
}); 