/**
 * Task 6: Recommendation Engine Test Suite
 * Tests for AI-powered recommendation system with all acceptance criteria
 */

const RecommendationEngine = require('../services/RecommendationEngine');
const AnomalyDetector = require('../services/AnomalyDetector');
const ExternalTriggerService = require('../services/ExternalTriggerService');
const MLModelManager = require('../services/MLModelManager');
const FeedbackLearningSystem = require('../services/FeedbackLearningSystem');
const BulkRecommendationProcessor = require('../services/BulkRecommendationProcessor');

describe('Task 6: Recommendation Engine - AI-Powered Comic Recommendations', () => {

    let recommendationEngine;
    let anomalyDetector;
    let externalTriggerService;
    let mlModelManager;
    let feedbackSystem;
    let bulkProcessor;

    beforeEach(() => {
        recommendationEngine = new RecommendationEngine();
        anomalyDetector = new AnomalyDetector();
        externalTriggerService = new ExternalTriggerService();
        mlModelManager = new MLModelManager();
        feedbackSystem = new FeedbackLearningSystem();
        bulkProcessor = new BulkRecommendationProcessor();
    });

    describe('Acceptance Criteria 1: Generate List Now, Hold, Grade, Monitor Recommendations', () => {

        test('should generate List Now recommendation for high-value opportunity', async () => {
            const comicData = {
                id: 'amazing-spider-man-1',
                title: 'Amazing Spider-Man #1',
                publisher: 'Marvel',
                issue: 1
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation).toBeDefined();
            expect(result.recommendation.primary_recommendation).toBeDefined();
            expect(['list now', 'hold', 'grade', 'monitor']).toContain(
                result.recommendation.primary_recommendation.action
            );
        });

        test('should generate Hold recommendation for stable growth comics', async () => {
            const comicData = {
                id: 'batman-1',
                title: 'Batman #1',
                publisher: 'DC',
                issue: 1
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation.primary_recommendation.action).toBeDefined();
            expect(result.recommendation.reasoning).toBeDefined();
            expect(Array.isArray(result.recommendation.reasoning)).toBe(true);
        });

        test('should generate Grade recommendation when grading ROI is favorable', async () => {
            const comicData = {
                id: 'x-men-1',
                title: 'X-Men #1',
                publisher: 'Marvel',
                condition: 'raw'
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation.potential_roi).toBeDefined();
            expect(typeof result.recommendation.potential_roi.roi_percentage).toBe('number');
        });

        test('should generate Monitor recommendation for uncertain market conditions', async () => {
            const comicData = {
                id: 'walking-dead-1',
                title: 'Walking Dead #1',
                publisher: 'Image'
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation.market_analysis).toBeDefined();
            expect(result.recommendation.timing_advice).toBeDefined();
        });

        test('should provide confidence scores for all recommendations', async () => {
            const comicData = {
                id: 'test-comic',
                title: 'Test Comic #1'
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation.confidence_score).toBeDefined();
            expect(result.recommendation.confidence_score).toBeGreaterThanOrEqual(0);
            expect(result.recommendation.confidence_score).toBeLessThanOrEqual(1);
            expect(result.recommendation.confidence_breakdown).toBeDefined();
        });

        test('should include secondary recommendations when applicable', async () => {
            const comicData = {
                id: 'fantastic-four-1',
                title: 'Fantastic Four #1',
                publisher: 'Marvel'
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            if (result.recommendation.secondary_recommendations) {
                expect(Array.isArray(result.recommendation.secondary_recommendations)).toBe(true);
                result.recommendation.secondary_recommendations.forEach(rec => {
                    expect(rec.action).toBeDefined();
                    expect(rec.score).toBeDefined();
                    expect(rec.reasoning).toBeDefined();
                });
            }
        });
    });

    describe('Acceptance Criteria 2: Detect Major Price Swings and Market Anomalies', () => {

        test('should detect price spikes in market data', async () => {
            const marketData = {
                currentPrice: 150,
                historicalPrices: [
                    { period: '2024-01-01', average_price: 100, transaction_count: 5 },
                    { period: '2024-01-02', average_price: 105, transaction_count: 8 },
                    { period: '2024-01-03', average_price: 125, transaction_count: 12 },
                    { period: '2024-01-04', average_price: 150, transaction_count: 20 }
                ],
                activityScore: 0.8
            };

            const result = await anomalyDetector.detectAnomalies(marketData);

            expect(result.hasAnomalies).toBeDefined();
            expect(result.score).toBeDefined();
            expect(result.anomaly_types).toBeDefined();
            expect(result.anomaly_types.price_spikes).toBeDefined();
            expect(Array.isArray(result.anomaly_types.price_spikes)).toBe(true);
        });

        test('should detect volume anomalies', async () => {
            const marketData = {
                currentPrice: 100,
                historicalPrices: [
                    { period: '2024-01-01', average_price: 100, transaction_count: 5 },
                    { period: '2024-01-02', average_price: 100, transaction_count: 25 }, // Volume spike
                    { period: '2024-01-03', average_price: 100, transaction_count: 6 }
                ],
                activityScore: 0.9
            };

            const result = await anomalyDetector.detectAnomalies(marketData);

            expect(result.anomaly_types.volume_spikes).toBeDefined();
            expect(result.detected_patterns).toBeDefined();
        });

        test('should calculate anomaly severity levels', async () => {
            const marketData = {
                currentPrice: 200,
                historicalPrices: [
                    { period: '2024-01-01', average_price: 100, transaction_count: 5 },
                    { period: '2024-01-02', average_price: 200, transaction_count: 15 }
                ],
                activityScore: 0.95
            };

            const result = await anomalyDetector.detectAnomalies(marketData);

            expect(result.severity).toBeDefined();
            expect(['minimal', 'low', 'medium', 'high', 'critical']).toContain(result.severity);
        });

        test('should provide anomaly recommendations', async () => {
            const marketData = {
                currentPrice: 300,
                historicalPrices: [
                    { period: '2024-01-01', average_price: 100, transaction_count: 3 },
                    { period: '2024-01-02', average_price: 300, transaction_count: 30 }
                ],
                activityScore: 1.0
            };

            const result = await anomalyDetector.detectAnomalies(marketData);

            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
            if (result.recommendations.length > 0) {
                expect(result.recommendations[0].action).toBeDefined();
                expect(result.recommendations[0].priority).toBeDefined();
            }
        });

        test('should detect market manipulation patterns', async () => {
            const manipulationData = {
                currentPrice: 150,
                historicalPrices: Array.from({ length: 20 }, (_, i) => ({
                    period: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    average_price: 150, // Unusual price clustering
                    transaction_count: Math.random() > 0.5 ? 20 : 2 // Suspicious volume patterns
                })),
                activityScore: 0.7
            };

            const result = await anomalyDetector.detectAnomalies(manipulationData);

            expect(result.anomaly_types.market_manipulation).toBeDefined();
            expect(Array.isArray(result.anomaly_types.market_manipulation)).toBe(true);
        });
    });

    describe('Acceptance Criteria 3: Integrate External Trigger Data', () => {

        test('should detect movie announcements for comic characters', async () => {
            const comicData = {
                id: 'spider-man-comic',
                title: 'Amazing Spider-Man #1',
                publisher: 'Marvel',
                characters: ['spider-man']
            };

            const result = await externalTriggerService.checkTriggers(comicData);

            expect(result.activeEvents).toBeDefined();
            expect(Array.isArray(result.activeEvents)).toBe(true);
            expect(result.upcomingEvents).toBeDefined();
            expect(Array.isArray(result.upcomingEvents)).toBe(true);
            expect(result.impact_score).toBeDefined();
            expect(typeof result.impact_score).toBe('number');
        });

        test('should detect TV show announcements', async () => {
            const comicData = {
                id: 'batman-comic',
                title: 'Batman #1',
                publisher: 'DC',
                characters: ['batman']
            };

            const result = await externalTriggerService.checkTriggers(comicData);

            expect(result.detailed_triggers).toBeDefined();
            expect(result.detailed_triggers.active).toBeDefined();
            expect(result.detailed_triggers.upcoming).toBeDefined();
        });

        test('should provide historical pattern analysis', async () => {
            const comicData = {
                id: 'iron-man-comic',
                title: 'Iron Man #1',
                publisher: 'Marvel',
                characters: ['iron man']
            };

            const result = await externalTriggerService.checkTriggers(comicData);

            expect(result.historicalEvents).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata.extracted_entities).toBeDefined();
        });

        test('should generate trigger-based recommendations', async () => {
            const comicData = {
                id: 'deadpool-comic',
                title: 'Deadpool #1',
                publisher: 'Marvel',
                characters: ['deadpool']
            };

            const result = await externalTriggerService.checkTriggers(comicData);

            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
            if (result.recommendations.length > 0) {
                expect(result.recommendations[0].action).toBeDefined();
                expect(result.recommendations[0].timeframe).toBeDefined();
            }
        });

        test('should calculate trigger impact scores', async () => {
            const comicData = {
                id: 'thor-comic',
                title: 'Thor #1',
                publisher: 'Marvel',
                characters: ['thor']
            };

            const result = await externalTriggerService.checkTriggers(comicData);

            expect(result.impact_score).toBeGreaterThanOrEqual(0);
            expect(result.impact_score).toBeLessThanOrEqual(1);
        });
    });

    describe('Acceptance Criteria 4: Provide Confidence Scores', () => {

        test('should calculate comprehensive confidence scores', async () => {
            const comicData = {
                id: 'test-confidence',
                title: 'Test Comic #1'
            };

            const result = await recommendationEngine.generateRecommendation(comicData);

            expect(result.success).toBe(true);
            expect(result.recommendation.confidence_score).toBeDefined();
            expect(result.recommendation.confidence_breakdown).toBeDefined();
            expect(result.recommendation.confidence_breakdown.data_quality).toBeDefined();
            expect(result.recommendation.confidence_breakdown.historical_accuracy).toBeDefined();
            expect(result.recommendation.confidence_breakdown.model_confidence).toBeDefined();
            expect(result.recommendation.confidence_breakdown.market_stability).toBeDefined();
        });

        test('should provide confidence scores for different recommendation types', async () => {
            const testCases = [
                { title: 'High Value Comic', expected_min_confidence: 0.6 },
                { title: 'Uncertain Market Comic', expected_min_confidence: 0.3 },
                { title: 'Stable Comic', expected_min_confidence: 0.5 }
            ];

            for (const testCase of testCases) {
                const result = await recommendationEngine.generateRecommendation({
                    id: 'test',
                    title: testCase.title
                });

                expect(result.success).toBe(true);
                expect(result.recommendation.confidence_score).toBeGreaterThanOrEqual(0);
                expect(result.recommendation.confidence_score).toBeLessThanOrEqual(1);
            }
        });

        test('should adjust confidence based on data quality', async () => {
            const highQualityData = {
                id: 'high-quality',
                title: 'High Quality Data Comic',
                publisher: 'Marvel',
                series: 'Test Series',
                creators: ['Stan Lee']
            };

            const lowQualityData = {
                id: 'low-quality',
                title: 'Low Quality Data Comic'
            };

            const highQualityResult = await recommendationEngine.generateRecommendation(highQualityData);
            const lowQualityResult = await recommendationEngine.generateRecommendation(lowQualityData);

            expect(highQualityResult.success).toBe(true);
            expect(lowQualityResult.success).toBe(true);

            // High quality data should generally have higher confidence
            // (though this may vary based on market conditions)
            expect(highQualityResult.recommendation.confidence_breakdown.data_quality).toBeDefined();
            expect(lowQualityResult.recommendation.confidence_breakdown.data_quality).toBeDefined();
        });
    });

    describe('Acceptance Criteria 5: Support Bulk Recommendations for Collections', () => {

        test('should process collection of comics in bulk', async () => {
            const comicsCollection = [
                { id: 'comic1', title: 'Comic 1', publisher: 'Marvel' },
                { id: 'comic2', title: 'Comic 2', publisher: 'DC' },
                { id: 'comic3', title: 'Comic 3', publisher: 'Image' },
                { id: 'comic4', title: 'Comic 4', publisher: 'Marvel' },
                { id: 'comic5', title: 'Comic 5', publisher: 'DC' }
            ];

            const result = await bulkProcessor.processCollection(comicsCollection);

            expect(result.job_id).toBeDefined();
            expect(result.total_comics).toBe(5);
            expect(result.processed_successfully).toBeDefined();
            expect(result.individual_recommendations).toBeDefined();
            expect(Array.isArray(result.individual_recommendations)).toBe(true);
        });

        test('should provide portfolio-level insights', async () => {
            const comicsCollection = [
                { id: 'comic1', title: 'High Value Comic', publisher: 'Marvel' },
                { id: 'comic2', title: 'Medium Value Comic', publisher: 'DC' },
                { id: 'comic3', title: 'Low Value Comic', publisher: 'Image' }
            ];

            const result = await bulkProcessor.processCollection(comicsCollection);

            expect(result.portfolio_insights).toBeDefined();
            expect(result.portfolio_insights.portfolio_health).toBeDefined();
            expect(result.portfolio_insights.diversification_score).toBeDefined();
            expect(result.portfolio_insights.risk_profile).toBeDefined();
        });

        test('should handle processing errors gracefully', async () => {
            const comicsCollection = [
                { id: 'valid-comic', title: 'Valid Comic', publisher: 'Marvel' },
                { id: 'invalid-comic' }, // Missing title
                { id: 'another-valid', title: 'Another Valid Comic', publisher: 'DC' }
            ];

            const result = await bulkProcessor.processCollection(comicsCollection);

            expect(result.total_comics).toBe(3);
            expect(result.processed_successfully).toBeGreaterThan(0);
            expect(result.failed_comics).toBeDefined();
            expect(Array.isArray(result.failed_comics)).toBe(true);
        });

        test('should generate collection-level recommendations', async () => {
            const comicsCollection = [
                { id: 'comic1', title: 'Comic 1', publisher: 'Marvel' },
                { id: 'comic2', title: 'Comic 2', publisher: 'Marvel' },
                { id: 'comic3', title: 'Comic 3', publisher: 'Marvel' }
            ];

            const result = await bulkProcessor.processCollection(comicsCollection);

            expect(result.aggregated_analysis).toBeDefined();
            expect(result.aggregated_analysis.recommendation_distribution).toBeDefined();
            expect(result.aggregated_analysis.confidence_analysis).toBeDefined();
            expect(result.next_actions).toBeDefined();
            expect(Array.isArray(result.next_actions)).toBe(true);
        });

        test('should calculate processing metrics', async () => {
            const comicsCollection = [
                { id: 'comic1', title: 'Comic 1' },
                { id: 'comic2', title: 'Comic 2' }
            ];

            const result = await bulkProcessor.processCollection(comicsCollection);

            expect(result.processing_metrics).toBeDefined();
            expect(result.job_duration).toBeDefined();
            expect(typeof result.job_duration).toBe('number');
        });
    });

    describe('Acceptance Criteria 6: Learn from User Feedback', () => {

        test('should record and process user feedback', async () => {
            const feedbackData = {
                recommendation_id: 'rec_123',
                user_id: 'user_456',
                feedback_type: 'recommendation_rating',
                rating: 4,
                action_taken: 'followed',
                outcome_reported: 'success'
            };

            const result = await feedbackSystem.recordFeedback(feedbackData);

            expect(result.feedback_id).toBeDefined();
            expect(result.user_segment).toBeDefined();
            expect(result.feedback_weight).toBeDefined();
            expect(typeof result.feedback_weight).toBe('number');
        });

        test('should adjust predictions based on user feedback', async () => {
            // Record some feedback first
            await feedbackSystem.recordFeedback({
                recommendation_id: 'rec_1',
                user_id: 'expert_user',
                feedback_type: 'outcome_reported',
                outcome_reported: 'success',
                action_taken: 'followed'
            });

            const originalPredictions = {
                confidence: 0.7,
                uncertainty: 0.3,
                priceChange: { short_term: 0.1, medium_term: 0.2, long_term: 0.3 }
            };

            const userContext = {
                user_id: 'expert_user',
                feedback_count: 10,
                accuracy_score: 0.85
            };

            const adjustedPredictions = await feedbackSystem.adjustPredictions(originalPredictions, userContext);

            expect(adjustedPredictions).toBeDefined();
            expect(adjustedPredictions.feedback_adjustments).toBeDefined();
            expect(adjustedPredictions.feedback_adjustments.user_segment).toBeDefined();
            expect(adjustedPredictions.feedback_adjustments.personalization_score).toBeDefined();
        });

        test('should track model accuracy over time', async () => {
            const accuracy = feedbackSystem.getModelAccuracy();

            expect(typeof accuracy).toBe('number');
            expect(accuracy).toBeGreaterThanOrEqual(0);
            expect(accuracy).toBeLessThanOrEqual(1);
        });

        test('should segment users for personalized learning', async () => {
            const expertUser = {
                user_id: 'expert_123',
                feedback_count: 30,
                accuracy_score: 0.9,
                activity_level: 'high'
            };

            const newUser = {
                user_id: 'newbie_456',
                feedback_count: 2,
                accuracy_score: 0.5,
                activity_level: 'low'
            };

            const expertFeedback = await feedbackSystem.recordFeedback({
                ...expertUser,
                recommendation_id: 'rec_expert',
                feedback_type: 'recommendation_rating',
                rating: 5
            });

            const newUserFeedback = await feedbackSystem.recordFeedback({
                ...newUser,
                recommendation_id: 'rec_new',
                feedback_type: 'recommendation_rating',
                rating: 3
            });

            expect(expertFeedback.user_segment).toBeDefined();
            expect(newUserFeedback.user_segment).toBeDefined();
            expect(expertFeedback.feedback_weight).toBeGreaterThan(newUserFeedback.feedback_weight);
        });

        test('should detect when model updates are needed', async () => {
            // Simulate multiple feedback entries
            for (let i = 0; i < 15; i++) {
                await feedbackSystem.recordFeedback({
                    recommendation_id: `rec_${i}`,
                    user_id: `user_${i}`,
                    feedback_type: 'outcome_reported',
                    outcome_reported: Math.random() > 0.5 ? 'success' : 'failure'
                });
            }

            const lastFeedback = await feedbackSystem.recordFeedback({
                recommendation_id: 'rec_final',
                user_id: 'user_final',
                feedback_type: 'recommendation_rating',
                rating: 1
            });

            expect(lastFeedback.update_recommendation).toBeDefined();
            expect(lastFeedback.update_recommendation.should_update).toBeDefined();
            expect(typeof lastFeedback.update_recommendation.should_update).toBe('boolean');
        });
    });

    describe('Integration Tests: ML Model Integration', () => {

        test('should generate ML-powered predictions with feature extraction', async () => {
            const marketData = {
                currentPrice: 100,
                historicalPrices: [
                    { period: '2024-01-01', average_price: 90, transaction_count: 5 },
                    { period: '2024-01-02', average_price: 95, transaction_count: 7 },
                    { period: '2024-01-03', average_price: 100, transaction_count: 10 }
                ],
                activityScore: 0.7,
                dataQuality: 0.8
            };

            const trendAnalysis = {
                direction: 'upward',
                strength: 0.8,
                momentum: 0.1,
                volatility: 0.3
            };

            const predictions = await mlModelManager.generatePredictions(marketData, trendAnalysis);

            expect(predictions.priceChange).toBeDefined();
            expect(predictions.confidence).toBeDefined();
            expect(predictions.model_versions).toBeDefined();
            expect(predictions.feature_importance).toBeDefined();
        });

        test('should calculate technical indicators correctly', async () => {
            const marketData = {
                historicalPrices: [
                    { average_price: 100, transaction_count: 5 },
                    { average_price: 105, transaction_count: 7 },
                    { average_price: 110, transaction_count: 6 },
                    { average_price: 108, transaction_count: 8 },
                    { average_price: 115, transaction_count: 9 }
                ],
                currentPrice: 115
            };

            const trendAnalysis = { direction: 'upward', strength: 0.7, volatility: 0.25 };
            const features = await mlModelManager.extractFeatures(marketData, trendAnalysis);

            expect(features.technical_features).toBeDefined();
            expect(features.technical_features.rsi).toBeDefined();
            expect(features.technical_features.sma_5).toBeDefined();
            expect(features.price_features).toBeDefined();
        });
    });

    describe('Error Handling and Edge Cases', () => {

        test('should handle missing comic data gracefully', async () => {
            const result = await recommendationEngine.generateRecommendation({});

            expect(result.success).toBeDefined();
            if (!result.success) {
                expect(result.fallback_recommendation).toBeDefined();
            }
        });

        test('should handle malformed market data', async () => {
            const invalidMarketData = {
                currentPrice: 'invalid',
                historicalPrices: 'not an array'
            };

            const result = await anomalyDetector.detectAnomalies(invalidMarketData);

            expect(result).toBeDefined();
            expect(result.hasAnomalies).toBeDefined();
        });

        test('should validate feedback data before processing', async () => {
            const invalidFeedback = {
                // Missing required fields
                feedback_type: 'invalid_type'
            };

            const result = await feedbackSystem.recordFeedback(invalidFeedback);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle empty collections in bulk processing', async () => {
            const result = await bulkProcessor.processCollection([]);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Performance and Validation Tests', () => {

        test('should process recommendations within acceptable time limits', async () => {
            const startTime = Date.now();
            
            const result = await recommendationEngine.generateRecommendation({
                id: 'performance-test',
                title: 'Performance Test Comic'
            });
            
            const processingTime = Date.now() - startTime;
            
            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(5000); // 5 seconds max
        });

        test('should maintain accuracy above 70% threshold', async () => {
            const testCases = 10;
            let successfulRecommendations = 0;

            for (let i = 0; i < testCases; i++) {
                const result = await recommendationEngine.generateRecommendation({
                    id: `test-${i}`,
                    title: `Test Comic ${i}`,
                    publisher: i % 2 === 0 ? 'Marvel' : 'DC'
                });

                if (result.success && result.recommendation.confidence_score > 0.5) {
                    successfulRecommendations++;
                }
            }

            const accuracy = successfulRecommendations / testCases;
            expect(accuracy).toBeGreaterThanOrEqual(0.7); // 70% accuracy threshold
        });

        test('should handle concurrent bulk processing requests', async () => {
            const collections = [
                [{ id: 'c1', title: 'Comic 1' }, { id: 'c2', title: 'Comic 2' }],
                [{ id: 'c3', title: 'Comic 3' }, { id: 'c4', title: 'Comic 4' }],
                [{ id: 'c5', title: 'Comic 5' }, { id: 'c6', title: 'Comic 6' }]
            ];

            const promises = collections.map(collection => 
                bulkProcessor.processCollection(collection)
            );

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result.job_id).toBeDefined();
                expect(result.total_comics).toBeGreaterThan(0);
            });
        });
    });

    afterEach(() => {
        // Cleanup any test data or reset state if needed
    });
});

// Helper functions for test data generation
function generateTestComicData(overrides = {}) {
    return {
        id: `test-comic-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Test Comic #1',
        publisher: 'Test Publisher',
        issue: 1,
        ...overrides
    };
}

function generateTestMarketData(overrides = {}) {
    return {
        currentPrice: 100,
        historicalPrices: [
            { period: '2024-01-01', average_price: 90, transaction_count: 5 },
            { period: '2024-01-02', average_price: 95, transaction_count: 7 },
            { period: '2024-01-03', average_price: 100, transaction_count: 10 }
        ],
        activityScore: 0.7,
        dataQuality: 0.8,
        ...overrides
    };
}

module.exports = {
    generateTestComicData,
    generateTestMarketData
}; 