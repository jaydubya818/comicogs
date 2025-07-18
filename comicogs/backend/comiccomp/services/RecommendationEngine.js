/**
 * Task 6: AI-Powered Recommendation Engine
 * Generates actionable recommendations: List Now, Hold, Grade, Monitor
 */

const DataCollectionService = require('./DataCollectionService');
const PriceNormalizationEngine = require('./PriceNormalizationEngine');
const AnomalyDetector = require('./AnomalyDetector');
const ExternalTriggerService = require('./ExternalTriggerService');
const MLModelManager = require('./MLModelManager');
const FeedbackLearningSystem = require('./FeedbackLearningSystem');

class RecommendationEngine {
    constructor() {
        this.dataCollectionService = new DataCollectionService();
        this.priceNormalizer = new PriceNormalizationEngine();
        this.anomalyDetector = new AnomalyDetector();
        this.externalTriggerService = new ExternalTriggerService();
        this.mlModelManager = new MLModelManager();
        this.feedbackSystem = new FeedbackLearningSystem();
        
        // Recommendation thresholds (configurable)
        this.thresholds = {
            listNow: {
                priceIncrease: 0.20,      // 20% price increase
                trendStrength: 0.75,       // Strong upward trend
                marketActivity: 0.80,      // High market activity
                anomalyScore: 0.85         // Strong anomaly detection
            },
            hold: {
                stability: 0.70,           // Price stability
                futureGrowth: 0.60,        // Predicted future growth
                marketTiming: 0.40         // Market timing score
            },
            grade: {
                priceDifference: 0.30,     // 30% difference between grades
                marketDemand: 0.70,        // High demand for graded comics
                roi: 0.25                  // 25% ROI threshold
            },
            monitor: {
                volatility: 0.60,          // High volatility
                externalTriggers: 0.50,    // External event probability
                uncertainty: 0.40          // Market uncertainty
            }
        };
        
        // Confidence calculation weights
        this.confidenceWeights = {
            dataQuality: 0.25,
            historicalAccuracy: 0.30,
            modelConfidence: 0.25,
            marketStability: 0.20
        };
    }

    /**
     * Generate comprehensive recommendations for a comic
     * @param {Object} comicData - Comic identification data
     * @param {Object} userContext - User preferences and history
     * @returns {Promise<Object>} Recommendation result
     */
    async generateRecommendation(comicData, userContext = {}) {
        try {
            console.log(`🤖 Generating AI recommendation for: ${comicData.title || comicData.id}`);

            // Step 1: Collect comprehensive market data
            const marketData = await this.collectMarketIntelligence(comicData);
            
            // Step 2: Analyze price trends and patterns
            const trendAnalysis = await this.analyzeTrends(marketData);
            
            // Step 3: Detect anomalies and market events
            const anomalies = await this.anomalyDetector.detectAnomalies(marketData);
            
            // Step 4: Check external triggers (movie/TV announcements, etc.)
            const externalTriggers = await this.externalTriggerService.checkTriggers(comicData);
            
            // Step 5: Generate ML-powered predictions
            const mlPredictions = await this.mlModelManager.generatePredictions(marketData, trendAnalysis);
            
            // Step 6: Apply user feedback and historical accuracy
            const adjustedPredictions = await this.feedbackSystem.adjustPredictions(mlPredictions, userContext);
            
            // Step 7: Generate specific recommendations
            const recommendations = await this.generateSpecificRecommendations({
                comicData,
                marketData,
                trendAnalysis,
                anomalies,
                externalTriggers,
                predictions: adjustedPredictions,
                userContext
            });
            
            // Step 8: Calculate confidence scores
            const confidenceScores = this.calculateConfidenceScores({
                marketData,
                trendAnalysis,
                predictions: adjustedPredictions,
                recommendations
            });
            
            // Step 9: Finalize recommendation with metadata
            const finalRecommendation = {
                comic: {
                    id: comicData.id,
                    title: comicData.title,
                    issue: comicData.issue,
                    publisher: comicData.publisher
                },
                primary_recommendation: recommendations.primary,
                secondary_recommendations: recommendations.secondary,
                confidence_score: confidenceScores.overall,
                confidence_breakdown: confidenceScores.breakdown,
                reasoning: recommendations.reasoning,
                market_analysis: {
                    current_price: marketData.currentPrice,
                    price_trend: trendAnalysis.direction,
                    trend_strength: trendAnalysis.strength,
                    market_activity: marketData.activityScore,
                    anomaly_detected: anomalies.hasAnomalies,
                    external_factors: externalTriggers.activeEvents
                },
                actionable_insights: recommendations.insights,
                timing_advice: recommendations.timing,
                risk_assessment: recommendations.risks,
                potential_roi: recommendations.roi,
                generated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                model_version: this.mlModelManager.getModelVersion()
            };

            console.log(`✅ Generated ${finalRecommendation.primary_recommendation.action} recommendation with ${Math.round(confidenceScores.overall * 100)}% confidence`);
            
            return {
                success: true,
                recommendation: finalRecommendation
            };

        } catch (error) {
            console.error('❌ Error generating recommendation:', error);
            return {
                success: false,
                error: error.message,
                fallback_recommendation: this.generateFallbackRecommendation(comicData)
            };
        }
    }

    /**
     * Collect comprehensive market intelligence
     */
    async collectMarketIntelligence(comicData) {
        const [pricingData, historicalData, marketActivity] = await Promise.all([
            this.dataCollectionService.collectPricingData(comicData),
            this.dataCollectionService.getHistoricalData(comicData, { days: 365 }),
            this.dataCollectionService.getMarketActivity(comicData)
        ]);

        const normalizedData = await this.priceNormalizer.normalizeData({
            pricing: pricingData,
            historical: historicalData,
            activity: marketActivity
        });

        return {
            currentPrice: normalizedData.medianPrice,
            priceRange: normalizedData.priceRange,
            historicalPrices: normalizedData.historicalData,
            activityScore: normalizedData.marketActivity.score,
            dataQuality: normalizedData.confidence,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Analyze price trends and market patterns
     */
    async analyzeTrends(marketData) {
        const trends = await this.priceNormalizer.analyzeTrends(marketData.historicalPrices);
        
        return {
            direction: trends.direction, // 'upward', 'downward', 'stable'
            strength: trends.strength,   // 0-1 confidence in trend
            momentum: trends.momentum,   // Rate of change
            volatility: trends.volatility,
            support_level: trends.supportLevel,
            resistance_level: trends.resistanceLevel,
            prediction_horizon: '90d'    // 90-day prediction
        };
    }

    /**
     * Generate specific recommendation types based on analysis
     */
    async generateSpecificRecommendations(analysisData) {
        const { marketData, trendAnalysis, anomalies, externalTriggers, predictions, userContext } = analysisData;
        
        // Calculate scores for each recommendation type
        const scores = {
            listNow: this.calculateListNowScore(analysisData),
            hold: this.calculateHoldScore(analysisData),
            grade: this.calculateGradeScore(analysisData),
            monitor: this.calculateMonitorScore(analysisData)
        };

        // Apply user preferences if available
        if (userContext.preferences) {
            scores = this.applyUserPreferences(scores, userContext.preferences);
        }

        // Determine primary recommendation
        const primaryAction = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const primaryScore = scores[primaryAction];

        // Generate secondary recommendations (score > 0.6)
        const secondaryActions = Object.keys(scores)
            .filter(action => action !== primaryAction && scores[action] > 0.6)
            .sort((a, b) => scores[b] - scores[a])
            .slice(0, 2);

        const recommendations = {
            primary: {
                action: primaryAction.replace(/([A-Z])/g, ' $1').trim().toLowerCase(),
                score: primaryScore,
                urgency: this.calculateUrgency(primaryAction, analysisData),
                expected_outcome: this.getExpectedOutcome(primaryAction, analysisData)
            },
            secondary: secondaryActions.map(action => ({
                action: action.replace(/([A-Z])/g, ' $1').trim().toLowerCase(),
                score: scores[action],
                reasoning: this.getActionReasoning(action, analysisData)
            })),
            reasoning: this.generateRecommendationReasoning(primaryAction, analysisData),
            insights: this.generateActionableInsights(primaryAction, analysisData),
            timing: this.generateTimingAdvice(primaryAction, analysisData),
            risks: this.assessRecommendationRisks(primaryAction, analysisData),
            roi: this.calculateExpectedROI(primaryAction, analysisData)
        };

        return recommendations;
    }

    /**
     * Calculate List Now recommendation score
     */
    calculateListNowScore(data) {
        const { marketData, trendAnalysis, anomalies, externalTriggers, predictions } = data;
        
        let score = 0;
        
        // Strong upward price trend
        if (trendAnalysis.direction === 'upward' && trendAnalysis.strength > this.thresholds.listNow.trendStrength) {
            score += 0.25;
        }
        
        // Recent price increase
        const recentGrowth = predictions.priceChange?.short_term || 0;
        if (recentGrowth > this.thresholds.listNow.priceIncrease) {
            score += 0.25;
        }
        
        // High market activity
        if (marketData.activityScore > this.thresholds.listNow.marketActivity) {
            score += 0.20;
        }
        
        // Anomaly detection (unusual price movement)
        if (anomalies.hasAnomalies && anomalies.score > this.thresholds.listNow.anomalyScore) {
            score += 0.15;
        }
        
        // External triggers (movie announcements, etc.)
        if (externalTriggers.activeEvents.length > 0) {
            score += 0.15;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate Hold recommendation score
     */
    calculateHoldScore(data) {
        const { marketData, trendAnalysis, predictions } = data;
        
        let score = 0;
        
        // Stable price with future growth potential
        if (trendAnalysis.direction === 'stable' && predictions.futureGrowth > this.thresholds.hold.futureGrowth) {
            score += 0.30;
        }
        
        // Long-term upward trend
        if (predictions.longTermTrend === 'positive') {
            score += 0.25;
        }
        
        // Good market timing (not peak)
        if (marketData.currentPrice < trendAnalysis.resistance_level * 0.9) {
            score += 0.20;
        }
        
        // Market stability
        if (trendAnalysis.volatility < 0.3) {
            score += 0.25;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate Grade recommendation score
     */
    calculateGradeScore(data) {
        const { marketData, predictions } = data;
        
        let score = 0;
        
        // Significant price difference between grades
        const gradePremium = predictions.gradingImpact || 0;
        if (gradePremium > this.thresholds.grade.priceDifference) {
            score += 0.35;
        }
        
        // High demand for graded comics in this category
        const gradedDemand = predictions.gradedMarketDemand || 0;
        if (gradedDemand > this.thresholds.grade.marketDemand) {
            score += 0.30;
        }
        
        // Positive ROI after grading costs
        const expectedROI = predictions.gradingROI || 0;
        if (expectedROI > this.thresholds.grade.roi) {
            score += 0.35;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate Monitor recommendation score
     */
    calculateMonitorScore(data) {
        const { trendAnalysis, externalTriggers, predictions } = data;
        
        let score = 0;
        
        // High volatility or uncertainty
        if (trendAnalysis.volatility > this.thresholds.monitor.volatility) {
            score += 0.30;
        }
        
        // Potential external triggers
        if (externalTriggers.upcomingEvents.length > 0) {
            score += 0.25;
        }
        
        // Market uncertainty
        if (predictions.uncertainty > this.thresholds.monitor.uncertainty) {
            score += 0.25;
        }
        
        // Conflicting signals
        const signalConflict = Math.abs(predictions.shortTermTrend - predictions.longTermTrend);
        if (signalConflict > 0.3) {
            score += 0.20;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate comprehensive confidence scores
     */
    calculateConfidenceScores(data) {
        const { marketData, trendAnalysis, predictions, recommendations } = data;
        
        // Data quality score
        const dataQuality = marketData.dataQuality;
        
        // Historical accuracy (from feedback system)
        const historicalAccuracy = this.feedbackSystem.getModelAccuracy();
        
        // Model confidence from ML predictions
        const modelConfidence = predictions.confidence || 0.7;
        
        // Market stability factor
        const marketStability = 1 - trendAnalysis.volatility;
        
        // Calculate weighted overall confidence
        const overall = (
            dataQuality * this.confidenceWeights.dataQuality +
            historicalAccuracy * this.confidenceWeights.historicalAccuracy +
            modelConfidence * this.confidenceWeights.modelConfidence +
            marketStability * this.confidenceWeights.marketStability
        );
        
        return {
            overall: Math.round(overall * 100) / 100,
            breakdown: {
                data_quality: Math.round(dataQuality * 100),
                historical_accuracy: Math.round(historicalAccuracy * 100),
                model_confidence: Math.round(modelConfidence * 100),
                market_stability: Math.round(marketStability * 100)
            }
        };
    }

    /**
     * Generate reasoning for recommendations
     */
    generateRecommendationReasoning(action, data) {
        const { marketData, trendAnalysis, anomalies, externalTriggers } = data;
        
        const reasons = [];
        
        switch (action) {
            case 'listNow':
                if (trendAnalysis.direction === 'upward') {
                    reasons.push(`Strong upward price trend with ${Math.round(trendAnalysis.strength * 100)}% confidence`);
                }
                if (anomalies.hasAnomalies) {
                    reasons.push(`Unusual market activity detected, suggesting high demand`);
                }
                if (externalTriggers.activeEvents.length > 0) {
                    reasons.push(`External catalysts active: ${externalTriggers.activeEvents.join(', ')}`);
                }
                break;
                
            case 'hold':
                reasons.push(`Stable market conditions with long-term growth potential`);
                if (trendAnalysis.volatility < 0.3) {
                    reasons.push(`Low volatility (${Math.round(trendAnalysis.volatility * 100)}%) suggests stable appreciation`);
                }
                break;
                
            case 'grade':
                reasons.push(`Significant premium for graded copies in current market`);
                reasons.push(`Expected ROI of ${Math.round(data.predictions.gradingROI * 100)}% after grading costs`);
                break;
                
            case 'monitor':
                if (trendAnalysis.volatility > 0.6) {
                    reasons.push(`High market volatility (${Math.round(trendAnalysis.volatility * 100)}%) requires careful observation`);
                }
                if (externalTriggers.upcomingEvents.length > 0) {
                    reasons.push(`Upcoming events may impact pricing: ${externalTriggers.upcomingEvents.join(', ')}`);
                }
                break;
        }
        
        return reasons;
    }

    /**
     * Generate actionable insights
     */
    generateActionableInsights(action, data) {
        const insights = [];
        
        switch (action) {
            case 'listNow':
                insights.push('List at current market peak to maximize profit');
                insights.push('Consider auction format for maximum exposure');
                insights.push('Include high-quality photos and detailed condition notes');
                break;
                
            case 'hold':
                insights.push('Store in optimal conditions to preserve value');
                insights.push('Monitor quarterly price updates');
                insights.push('Consider reassessment in 6-12 months');
                break;
                
            case 'grade':
                insights.push('Choose reputable grading service (CGC, CBCS)');
                insights.push('Ensure comic is in gradeable condition');
                insights.push('Factor in 3-6 month grading turnaround time');
                break;
                
            case 'monitor':
                insights.push('Set up price alerts for significant changes');
                insights.push('Track related market trends and news');
                insights.push('Reassess monthly based on new data');
                break;
        }
        
        return insights;
    }

    /**
     * Generate timing advice for recommendations
     */
    generateTimingAdvice(action, data) {
        const { predictions } = data;
        
        switch (action) {
            case 'listNow':
                return {
                    urgency: 'high',
                    timeframe: 'within 2 weeks',
                    reasoning: 'Current market conditions favor immediate action'
                };
                
            case 'hold':
                return {
                    urgency: 'low',
                    timeframe: '6-18 months',
                    reasoning: 'Long-term appreciation expected'
                };
                
            case 'grade':
                return {
                    urgency: 'medium',
                    timeframe: 'within 3 months',
                    reasoning: 'Grading demand is currently strong'
                };
                
            case 'monitor':
                return {
                    urgency: 'low',
                    timeframe: 'ongoing',
                    reasoning: 'Market uncertainty requires patience'
                };
                
            default:
                return {
                    urgency: 'medium',
                    timeframe: 'flexible',
                    reasoning: 'Standard market timing applies'
                };
        }
    }

    /**
     * Assess risks for each recommendation
     */
    assessRecommendationRisks(action, data) {
        const risks = [];
        
        switch (action) {
            case 'listNow':
                risks.push({ type: 'market_timing', level: 'medium', description: 'Market peak may be temporary' });
                risks.push({ type: 'competition', level: 'high', description: 'Other sellers may flood market' });
                break;
                
            case 'hold':
                risks.push({ type: 'market_decline', level: 'low', description: 'General market downturn possible' });
                risks.push({ type: 'storage', level: 'low', description: 'Physical deterioration over time' });
                break;
                
            case 'grade':
                risks.push({ type: 'grading_result', level: 'medium', description: 'Lower grade than expected' });
                risks.push({ type: 'cost_recovery', level: 'medium', description: 'Grading costs may not be recovered' });
                break;
                
            case 'monitor':
                risks.push({ type: 'missed_opportunity', level: 'medium', description: 'Delay may result in missed peak' });
                break;
        }
        
        return risks;
    }

    /**
     * Calculate expected ROI for recommendations
     */
    calculateExpectedROI(action, data) {
        const { marketData, predictions } = data;
        const currentPrice = marketData.currentPrice;
        
        switch (action) {
            case 'listNow':
                return {
                    timeframe: '1-2 weeks',
                    expected_return: predictions.immediateReturn || 0.95, // 95% of current market
                    roi_percentage: Math.round((predictions.immediateReturn - 1) * 100)
                };
                
            case 'hold':
                return {
                    timeframe: '12-18 months',
                    expected_return: predictions.longTermReturn || 1.15, // 15% appreciation
                    roi_percentage: Math.round((predictions.longTermReturn - 1) * 100)
                };
                
            case 'grade':
                return {
                    timeframe: '6-9 months',
                    expected_return: predictions.gradingReturn || 1.25, // 25% premium minus costs
                    roi_percentage: Math.round((predictions.gradingReturn - 1) * 100)
                };
                
            case 'monitor':
                return {
                    timeframe: 'variable',
                    expected_return: 1.0, // Neutral until market clarifies
                    roi_percentage: 0
                };
                
            default:
                return {
                    timeframe: 'unknown',
                    expected_return: 1.0,
                    roi_percentage: 0
                };
        }
    }

    /**
     * Generate fallback recommendation for error cases
     */
    generateFallbackRecommendation(comicData) {
        return {
            comic: comicData,
            primary_recommendation: {
                action: 'monitor',
                score: 0.5,
                urgency: 'low',
                expected_outcome: 'Gather more data for informed decision'
            },
            confidence_score: 0.3,
            reasoning: ['Insufficient data for confident recommendation'],
            generated_at: new Date().toISOString(),
            is_fallback: true
        };
    }

    /**
     * Apply user preferences to recommendation scores
     */
    applyUserPreferences(scores, preferences) {
        const adjusted = { ...scores };
        
        // Risk tolerance adjustment
        if (preferences.risk_tolerance === 'conservative') {
            adjusted.hold *= 1.2;
            adjusted.listNow *= 0.8;
        } else if (preferences.risk_tolerance === 'aggressive') {
            adjusted.listNow *= 1.2;
            adjusted.hold *= 0.8;
        }
        
        // Investment horizon adjustment
        if (preferences.investment_horizon === 'short_term') {
            adjusted.listNow *= 1.1;
            adjusted.monitor *= 1.1;
        } else if (preferences.investment_horizon === 'long_term') {
            adjusted.hold *= 1.2;
            adjusted.grade *= 1.1;
        }
        
        return adjusted;
    }

    /**
     * Calculate urgency level for recommendations
     */
    calculateUrgency(action, data) {
        const { anomalies, externalTriggers, trendAnalysis } = data;
        
        let urgency = 'medium';
        
        if (action === 'listNow') {
            if (anomalies.hasAnomalies || externalTriggers.activeEvents.length > 0) {
                urgency = 'high';
            }
        } else if (action === 'monitor') {
            if (trendAnalysis.volatility > 0.8) {
                urgency = 'high';
            }
        }
        
        return urgency;
    }

    /**
     * Get expected outcome description
     */
    getExpectedOutcome(action, data) {
        const outcomes = {
            listNow: 'Capitalize on current market conditions for immediate profit',
            hold: 'Benefit from long-term appreciation and market growth',
            grade: 'Increase value through professional authentication and preservation',
            monitor: 'Make informed decision when market signals become clearer'
        };
        
        return outcomes[action] || 'Optimize comic book investment strategy';
    }

    /**
     * Get specific reasoning for secondary recommendations
     */
    getActionReasoning(action, data) {
        const reasoning = {
            listNow: 'Strong market momentum suggests selling opportunity',
            hold: 'Stable fundamentals support long-term value retention',
            grade: 'Condition premium justifies grading investment',
            monitor: 'Market uncertainty warrants careful observation'
        };
        
        return reasoning[action] || 'Alternative strategy based on market analysis';
    }
}

module.exports = RecommendationEngine;