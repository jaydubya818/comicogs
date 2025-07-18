/**
 * Task 6: Feedback Learning System
 * Learns from user feedback to improve recommendation accuracy - Acceptance Criteria 6
 */

class FeedbackLearningSystem {
    constructor() {
        // Feedback storage and tracking
        this.feedback = {
            recommendations: new Map(),      // recommendation_id -> feedback data
            user_patterns: new Map(),        // user_id -> pattern analysis
            model_performance: new Map(),    // model_version -> performance metrics
            aggregated_metrics: {},          // Overall system metrics
            learning_rate: 0.1               // How quickly to adapt to feedback
        };

        // Feedback types and weights
        this.feedbackTypes = {
            // Explicit feedback (user-provided)
            recommendation_rating: {
                weight: 1.0,
                values: [1, 2, 3, 4, 5], // 1-5 star rating
                interpretation: 'direct'
            },
            outcome_reported: {
                weight: 1.2,  // Higher weight for actual outcomes
                values: ['success', 'partial_success', 'failure'],
                interpretation: 'outcome'
            },
            action_taken: {
                weight: 0.8,
                values: ['followed', 'modified', 'ignored'],
                interpretation: 'behavior'
            },
            
            // Implicit feedback (behavior-based)
            time_to_action: {
                weight: 0.4,
                interpretation: 'speed'  // Faster action suggests confidence
            },
            recommendation_views: {
                weight: 0.3,
                interpretation: 'engagement'
            },
            return_behavior: {
                weight: 0.5,
                interpretation: 'loyalty'  // Users return if recommendations are good
            }
        };

        // Performance tracking
        this.performanceMetrics = {
            accuracy: {
                current: 0.75,
                history: [],
                target: 0.85
            },
            user_satisfaction: {
                current: 3.8,  // Out of 5
                history: [],
                target: 4.2
            },
            adoption_rate: {
                current: 0.65,  // 65% of users follow recommendations
                history: [],
                target: 0.75
            },
            precision: {
                current: 0.72,
                history: [],
                target: 0.80
            },
            recall: {
                current: 0.68,
                history: [],
                target: 0.75
            }
        };

        // Learning algorithms configuration
        this.learningConfig = {
            batch_size: 50,              // Process feedback in batches
            update_frequency: 24,        // Hours between model updates
            confidence_threshold: 0.8,   // Minimum confidence to update
            sample_size_threshold: 10,   // Minimum samples before learning
            decay_factor: 0.95,          // Older feedback has less weight
            validation_split: 0.2        // 20% for validation
        };

        // User segmentation for personalized learning
        this.userSegments = {
            expert_collectors: {
                weight_multiplier: 1.3,  // Expert feedback is more valuable
                pattern: 'high_accuracy_history',
                min_feedback_count: 25
            },
            casual_users: {
                weight_multiplier: 0.8,
                pattern: 'sporadic_engagement',
                min_feedback_count: 5
            },
            power_traders: {
                weight_multiplier: 1.1,
                pattern: 'high_volume_activity',
                min_feedback_count: 15
            },
            new_users: {
                weight_multiplier: 0.6,
                pattern: 'learning_phase',
                min_feedback_count: 3
            }
        };

        // Model adjustment parameters
        this.adjustmentParameters = {
            threshold_adjustments: {
                min_change: 0.01,        // Minimum threshold change
                max_change: 0.1,         // Maximum threshold change per update
                stability_factor: 0.9    // Prevents oscillation
            },
            weight_adjustments: {
                min_change: 0.005,
                max_change: 0.05,
                smoothing_factor: 0.8
            },
            confidence_adjustments: {
                min_change: 0.02,
                max_change: 0.15,
                adaptation_rate: 0.7
            }
        };
    }

    /**
     * Record user feedback for a recommendation
     * @param {Object} feedbackData - Feedback information
     * @returns {Promise<Object>} Feedback processing result
     */
    async recordFeedback(feedbackData) {
        try {
            console.log(`📝 Recording user feedback for recommendation: ${feedbackData.recommendation_id}`);

            // Validate feedback data
            const validatedFeedback = this.validateFeedback(feedbackData);
            if (!validatedFeedback.isValid) {
                throw new Error(`Invalid feedback: ${validatedFeedback.error}`);
            }

            // Enrich feedback with context
            const enrichedFeedback = await this.enrichFeedback(feedbackData);

            // Store feedback
            const feedbackId = this.storeFeedback(enrichedFeedback);

            // Update user patterns
            await this.updateUserPatterns(enrichedFeedback);

            // Update model performance metrics
            await this.updatePerformanceMetrics(enrichedFeedback);

            // Check if model update is needed
            const updateRecommendation = await this.assessUpdateNeed();

            const result = {
                feedback_id: feedbackId,
                processed_at: new Date().toISOString(),
                user_segment: enrichedFeedback.user_segment,
                feedback_weight: enrichedFeedback.calculated_weight,
                current_performance: this.getCurrentPerformance(),
                update_recommendation: updateRecommendation,
                learning_impact: this.calculateLearningImpact(enrichedFeedback)
            };

            console.log(`✅ Feedback recorded with ${enrichedFeedback.calculated_weight.toFixed(2)} weight`);
            return result;

        } catch (error) {
            console.error('❌ Feedback recording error:', error);
            return {
                success: false,
                error: error.message,
                recorded_at: new Date().toISOString()
            };
        }
    }

    /**
     * Adjust predictions based on accumulated feedback
     * @param {Object} predictions - Original ML predictions
     * @param {Object} userContext - User context and history
     * @returns {Promise<Object>} Adjusted predictions
     */
    async adjustPredictions(predictions, userContext) {
        try {
            console.log('🎯 Adjusting predictions based on user feedback patterns...');

            // Get user segment and patterns
            const userSegment = this.identifyUserSegment(userContext);
            const userPatterns = this.getUserPatterns(userContext.user_id);

            // Apply global adjustments based on system-wide feedback
            const globallyAdjusted = this.applyGlobalAdjustments(predictions);

            // Apply user-specific adjustments
            const userAdjusted = this.applyUserSpecificAdjustments(globallyAdjusted, userPatterns, userSegment);

            // Apply confidence adjustments based on historical accuracy
            const confidenceAdjusted = this.applyConfidenceAdjustments(userAdjusted, userContext);

            // Apply recency bias - recent feedback has more impact
            const recencyAdjusted = this.applyRecencyAdjustments(confidenceAdjusted, userContext);

            // Calculate adjustment metadata
            const adjustmentMetadata = {
                user_segment: userSegment,
                adjustments_applied: this.getAppliedAdjustments(predictions, recencyAdjusted),
                confidence_boost: this.calculateConfidenceBoost(userPatterns),
                personalization_score: this.calculatePersonalizationScore(userContext),
                learning_version: this.getLearningVersion()
            };

            console.log(`✅ Predictions adjusted with ${adjustmentMetadata.personalization_score.toFixed(2)} personalization score`);

            return {
                ...recencyAdjusted,
                feedback_adjustments: adjustmentMetadata
            };

        } catch (error) {
            console.error('❌ Prediction adjustment error:', error);
            return predictions; // Return original predictions on error
        }
    }

    /**
     * Get current model accuracy based on feedback
     * @returns {number} Current model accuracy (0-1)
     */
    getModelAccuracy() {
        return this.performanceMetrics.accuracy.current;
    }

    /**
     * Validate feedback data structure and content
     */
    validateFeedback(feedbackData) {
        const required = ['recommendation_id', 'user_id', 'feedback_type'];
        const missing = required.filter(field => !feedbackData[field]);
        
        if (missing.length > 0) {
            return {
                isValid: false,
                error: `Missing required fields: ${missing.join(', ')}`
            };
        }

        if (!this.feedbackTypes[feedbackData.feedback_type]) {
            return {
                isValid: false,
                error: `Unknown feedback type: ${feedbackData.feedback_type}`
            };
        }

        return { isValid: true };
    }

    /**
     * Enrich feedback with additional context and calculations
     */
    async enrichFeedback(feedbackData) {
        const enriched = { ...feedbackData };

        // Add timestamp
        enriched.timestamp = new Date().toISOString();

        // Identify user segment
        enriched.user_segment = this.identifyUserSegment(feedbackData);

        // Calculate feedback weight
        enriched.calculated_weight = this.calculateFeedbackWeight(feedbackData);

        // Add contextual information
        enriched.market_context = await this.getMarketContext(feedbackData.timestamp);
        
        // Add recommendation context
        enriched.recommendation_context = this.getRecommendationContext(feedbackData.recommendation_id);

        // Calculate feedback quality score
        enriched.quality_score = this.calculateFeedbackQuality(enriched);

        return enriched;
    }

    /**
     * Store feedback in the system
     */
    storeFeedback(enrichedFeedback) {
        const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.feedback.recommendations.set(feedbackId, {
            ...enrichedFeedback,
            feedback_id: feedbackId,
            processed: false
        });

        return feedbackId;
    }

    /**
     * Update user patterns based on new feedback
     */
    async updateUserPatterns(feedback) {
        const userId = feedback.user_id;
        
        if (!this.feedback.user_patterns.has(userId)) {
            this.feedback.user_patterns.set(userId, {
                feedback_count: 0,
                average_rating: 0,
                action_patterns: {},
                accuracy_score: 0.5,
                last_updated: null
            });
        }

        const patterns = this.feedback.user_patterns.get(userId);
        
        // Update feedback count
        patterns.feedback_count++;
        
        // Update average rating
        if (feedback.feedback_type === 'recommendation_rating') {
            const newCount = patterns.feedback_count;
            const oldSum = patterns.average_rating * (newCount - 1);
            patterns.average_rating = (oldSum + feedback.rating) / newCount;
        }

        // Update action patterns
        if (feedback.action_taken) {
            patterns.action_patterns[feedback.action_taken] = 
                (patterns.action_patterns[feedback.action_taken] || 0) + 1;
        }

        // Update accuracy score based on outcome
        if (feedback.outcome_reported) {
            const outcome_score = this.convertOutcomeToScore(feedback.outcome_reported);
            patterns.accuracy_score = patterns.accuracy_score * 0.9 + outcome_score * 0.1;
        }

        patterns.last_updated = new Date().toISOString();
        this.feedback.user_patterns.set(userId, patterns);
    }

    /**
     * Update system-wide performance metrics
     */
    async updatePerformanceMetrics(feedback) {
        // Update accuracy if outcome is reported
        if (feedback.outcome_reported) {
            const outcome_score = this.convertOutcomeToScore(feedback.outcome_reported);
            this.updateMetric('accuracy', outcome_score);
        }

        // Update user satisfaction if rating is provided
        if (feedback.feedback_type === 'recommendation_rating') {
            const satisfaction_score = feedback.rating / 5.0; // Convert to 0-1 scale
            this.updateMetric('user_satisfaction', satisfaction_score);
        }

        // Update adoption rate if action is reported
        if (feedback.action_taken) {
            const adoption_score = feedback.action_taken === 'followed' ? 1.0 : 
                                 feedback.action_taken === 'modified' ? 0.5 : 0.0;
            this.updateMetric('adoption_rate', adoption_score);
        }

        // Calculate and update precision/recall if possible
        await this.updatePrecisionRecall(feedback);
    }

    /**
     * Assess if model update is needed based on accumulated feedback
     */
    async assessUpdateNeed() {
        const pendingFeedback = this.getPendingFeedbackCount();
        const timeSinceLastUpdate = this.getTimeSinceLastUpdate();
        const performanceDrift = this.detectPerformanceDrift();

        const shouldUpdate = 
            pendingFeedback >= this.learningConfig.batch_size ||
            timeSinceLastUpdate >= this.learningConfig.update_frequency ||
            performanceDrift > 0.05; // 5% performance drift threshold

        return {
            should_update: shouldUpdate,
            reasons: {
                pending_feedback: pendingFeedback,
                time_since_update: timeSinceLastUpdate,
                performance_drift: performanceDrift
            },
            recommended_actions: this.generateUpdateRecommendations(shouldUpdate, pendingFeedback, performanceDrift)
        };
    }

    /**
     * Apply global adjustments based on system-wide patterns
     */
    applyGlobalAdjustments(predictions) {
        const adjusted = { ...predictions };

        // Adjust based on overall system accuracy
        const accuracyFactor = this.performanceMetrics.accuracy.current;
        adjusted.confidence = Math.min(1.0, adjusted.confidence * accuracyFactor * 1.2);

        // Adjust thresholds based on adoption patterns
        const adoptionRate = this.performanceMetrics.adoption_rate.current;
        if (adoptionRate < 0.6) {
            // Lower thresholds to make recommendations more conservative
            adjusted.priceChange = this.adjustPriceChangePredictions(adjusted.priceChange, -0.1);
        }

        // Adjust based on user satisfaction trends
        const satisfaction = this.performanceMetrics.user_satisfaction.current / 5.0;
        if (satisfaction < 0.7) {
            // Make recommendations more conservative
            adjusted.uncertainty = Math.min(0.8, adjusted.uncertainty * 1.1);
        }

        return adjusted;
    }

    /**
     * Apply user-specific adjustments based on individual patterns
     */
    applyUserSpecificAdjustments(predictions, userPatterns, userSegment) {
        if (!userPatterns) return predictions;

        const adjusted = { ...predictions };
        const segment = this.userSegments[userSegment] || this.userSegments.new_users;

        // Adjust confidence based on user's historical accuracy
        if (userPatterns.accuracy_score) {
            const accuracyFactor = userPatterns.accuracy_score;
            adjusted.confidence = Math.min(1.0, adjusted.confidence * (0.8 + accuracyFactor * 0.4));
        }

        // Adjust based on user's typical action patterns
        const actionPatterns = userPatterns.action_patterns;
        if (actionPatterns && actionPatterns.ignored > actionPatterns.followed) {
            // User typically ignores recommendations - make them more conservative
            adjusted.uncertainty = Math.min(0.9, adjusted.uncertainty * 1.15);
        }

        // Apply segment-specific multipliers
        adjusted.confidence = Math.min(1.0, adjusted.confidence * segment.weight_multiplier);

        return adjusted;
    }

    /**
     * Apply confidence adjustments based on historical accuracy
     */
    applyConfidenceAdjustments(predictions, userContext) {
        const adjusted = { ...predictions };
        
        // Get historical accuracy for similar predictions
        const historicalAccuracy = this.getHistoricalAccuracy(predictions, userContext);
        
        if (historicalAccuracy) {
            const confidenceMultiplier = 0.5 + historicalAccuracy * 0.5; // 0.5 to 1.0 range
            adjusted.confidence = Math.min(1.0, adjusted.confidence * confidenceMultiplier);
        }

        return adjusted;
    }

    /**
     * Apply recency adjustments - recent feedback has more impact
     */
    applyRecencyAdjustments(predictions, userContext) {
        const adjusted = { ...predictions };
        
        // Get recent feedback for this user
        const recentFeedback = this.getRecentUserFeedback(userContext.user_id, 30); // Last 30 days
        
        if (recentFeedback.length > 0) {
            const recentAccuracy = this.calculateRecentAccuracy(recentFeedback);
            const recencyWeight = Math.min(1.0, recentFeedback.length / 10); // Up to 10 recent feedback items
            
            // Adjust confidence based on recent performance
            const recencyAdjustment = (recentAccuracy - 0.5) * recencyWeight * 0.2;
            adjusted.confidence = Math.max(0.1, Math.min(1.0, adjusted.confidence + recencyAdjustment));
        }

        return adjusted;
    }

    /**
     * Helper methods for feedback processing
     */
    identifyUserSegment(userData) {
        // Simplified user segmentation
        const feedbackCount = userData.feedback_count || 0;
        const accuracy = userData.accuracy_score || 0.5;
        const activity = userData.activity_level || 'low';

        if (feedbackCount >= 25 && accuracy > 0.8) return 'expert_collectors';
        if (activity === 'high') return 'power_traders';
        if (feedbackCount < 5) return 'new_users';
        return 'casual_users';
    }

    calculateFeedbackWeight(feedbackData) {
        const baseWeight = this.feedbackTypes[feedbackData.feedback_type]?.weight || 0.5;
        
        // Adjust weight based on user segment
        const userSegment = this.identifyUserSegment(feedbackData);
        const segmentMultiplier = this.userSegments[userSegment]?.weight_multiplier || 1.0;
        
        // Adjust weight based on feedback recency
        const recencyMultiplier = 1.0; // More recent feedback could have higher weight
        
        return Math.min(2.0, baseWeight * segmentMultiplier * recencyMultiplier);
    }

    calculateFeedbackQuality(feedback) {
        let quality = 0.5; // Base quality
        
        // Higher quality for explicit feedback
        if (['recommendation_rating', 'outcome_reported'].includes(feedback.feedback_type)) {
            quality += 0.3;
        }

        // Higher quality for detailed feedback
        if (feedback.comments && feedback.comments.length > 10) {
            quality += 0.1;
        }

        // Higher quality for users with good track record
        if (feedback.user_segment === 'expert_collectors') {
            quality += 0.1;
        }

        return Math.min(1.0, quality);
    }

    convertOutcomeToScore(outcome) {
        switch (outcome) {
            case 'success': return 1.0;
            case 'partial_success': return 0.6;
            case 'failure': return 0.0;
            default: return 0.5;
        }
    }

    updateMetric(metricName, newValue) {
        if (!this.performanceMetrics[metricName]) return;
        
        const metric = this.performanceMetrics[metricName];
        const oldValue = metric.current;
        
        // Exponential moving average
        metric.current = oldValue * 0.9 + newValue * 0.1;
        
        // Add to history
        metric.history.push({
            value: newValue,
            timestamp: new Date().toISOString(),
            running_average: metric.current
        });
        
        // Keep only last 100 history entries
        if (metric.history.length > 100) {
            metric.history = metric.history.slice(-100);
        }
    }

    updatePrecisionRecall(feedback) {
        // Simplified precision/recall calculation
        // In a real system, this would require more sophisticated tracking
        if (feedback.outcome_reported) {
            const success = feedback.outcome_reported === 'success';
            const predicted_positive = feedback.recommendation_context?.confidence > 0.7;
            
            // Update precision and recall metrics
            // This is a simplified version - real implementation would be more complex
            if (success && predicted_positive) {
                this.updateMetric('precision', 1.0);
                this.updateMetric('recall', 1.0);
            } else if (!success && predicted_positive) {
                this.updateMetric('precision', 0.0);
            } else if (success && !predicted_positive) {
                this.updateMetric('recall', 0.0);
            }
        }
    }

    getPendingFeedbackCount() {
        let count = 0;
        for (const [id, feedback] of this.feedback.recommendations) {
            if (!feedback.processed) count++;
        }
        return count;
    }

    getTimeSinceLastUpdate() {
        // Return hours since last update
        const lastUpdate = this.feedback.aggregated_metrics.last_model_update;
        if (!lastUpdate) return Infinity;
        
        return (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);
    }

    detectPerformanceDrift() {
        // Calculate drift in accuracy over recent period
        const recent = this.performanceMetrics.accuracy.history.slice(-10);
        if (recent.length < 5) return 0;
        
        const oldAvg = recent.slice(0, 5).reduce((sum, h) => sum + h.value, 0) / 5;
        const newAvg = recent.slice(-5).reduce((sum, h) => sum + h.value, 0) / 5;
        
        return Math.abs(newAvg - oldAvg);
    }

    generateUpdateRecommendations(shouldUpdate, pendingCount, drift) {
        const recommendations = [];
        
        if (shouldUpdate) {
            recommendations.push('Schedule model retraining');
        }
        
        if (pendingCount > this.learningConfig.batch_size * 1.5) {
            recommendations.push('Process feedback backlog immediately');
        }
        
        if (drift > 0.1) {
            recommendations.push('Investigate performance degradation');
        }
        
        return recommendations;
    }

    adjustPriceChangePredictions(priceChange, adjustment) {
        return {
            short_term: (priceChange.short_term || 0) * (1 + adjustment),
            medium_term: (priceChange.medium_term || 0) * (1 + adjustment),
            long_term: (priceChange.long_term || 0) * (1 + adjustment)
        };
    }

    getUserPatterns(userId) {
        return this.feedback.user_patterns.get(userId);
    }

    getAppliedAdjustments(original, adjusted) {
        return {
            confidence_change: adjusted.confidence - original.confidence,
            uncertainty_change: adjusted.uncertainty - original.uncertainty,
            prediction_adjustments: 'Applied based on user feedback patterns'
        };
    }

    calculateConfidenceBoost(userPatterns) {
        if (!userPatterns) return 0;
        return Math.max(0, (userPatterns.accuracy_score - 0.5) * 0.2);
    }

    calculatePersonalizationScore(userContext) {
        // Score from 0-1 indicating how personalized the predictions are
        let score = 0.3; // Base personalization
        
        if (userContext.user_id && this.feedback.user_patterns.has(userContext.user_id)) {
            score += 0.3;
        }
        
        if (userContext.feedback_count > 10) {
            score += 0.2;
        }
        
        if (userContext.preferences) {
            score += 0.2;
        }
        
        return Math.min(1.0, score);
    }

    getLearningVersion() {
        return '1.0.0';
    }

    getCurrentPerformance() {
        return {
            accuracy: this.performanceMetrics.accuracy.current,
            user_satisfaction: this.performanceMetrics.user_satisfaction.current,
            adoption_rate: this.performanceMetrics.adoption_rate.current,
            feedback_count: this.getPendingFeedbackCount()
        };
    }

    calculateLearningImpact(feedback) {
        // Estimate how much this feedback will impact future predictions
        return {
            immediate_impact: feedback.calculated_weight * 0.1,
            long_term_impact: feedback.quality_score * 0.05,
            user_specific_impact: feedback.user_segment === 'expert_collectors' ? 0.15 : 0.05
        };
    }

    getMarketContext(timestamp) {
        // Simplified market context
        return {
            market_conditions: 'normal',
            volatility_level: 'medium',
            external_events: []
        };
    }

    getRecommendationContext(recommendationId) {
        // Simplified recommendation context
        return {
            confidence: 0.75,
            model_version: '1.0.0',
            recommendation_type: 'general'
        };
    }

    getHistoricalAccuracy(predictions, userContext) {
        // Simplified historical accuracy lookup
        return 0.75; // Would be calculated from historical data
    }

    getRecentUserFeedback(userId, days) {
        // Get recent feedback for user
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const feedback = [];
        
        for (const [id, fb] of this.feedback.recommendations) {
            if (fb.user_id === userId && new Date(fb.timestamp) >= cutoff) {
                feedback.push(fb);
            }
        }
        
        return feedback;
    }

    calculateRecentAccuracy(recentFeedback) {
        if (recentFeedback.length === 0) return 0.5;
        
        const accuracies = recentFeedback
            .filter(fb => fb.outcome_reported)
            .map(fb => this.convertOutcomeToScore(fb.outcome_reported));
        
        if (accuracies.length === 0) return 0.5;
        
        return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    }

    /**
     * Bulk process pending feedback for model updates
     */
    async processBatchFeedback() {
        console.log('🔄 Processing batch feedback for model updates...');
        
        const processed = [];
        let count = 0;
        
        for (const [id, feedback] of this.feedback.recommendations) {
            if (!feedback.processed && count < this.learningConfig.batch_size) {
                feedback.processed = true;
                processed.push(feedback);
                count++;
            }
        }
        
        // Update aggregated metrics
        this.feedback.aggregated_metrics.last_model_update = new Date().toISOString();
        this.feedback.aggregated_metrics.last_batch_size = processed.length;
        
        console.log(`✅ Processed ${processed.length} feedback items for learning`);
        
        return {
            processed_count: processed.length,
            updated_metrics: this.getCurrentPerformance()
        };
    }
}

module.exports = FeedbackLearningSystem; 