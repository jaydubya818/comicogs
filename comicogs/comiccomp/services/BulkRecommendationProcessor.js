/**
 * Task 6: Bulk Recommendation Processor
 * Support bulk recommendations for collections - Acceptance Criteria 5
 */

const RecommendationEngine = require('./RecommendationEngine');

class BulkRecommendationProcessor {
    constructor() {
        this.recommendationEngine = new RecommendationEngine();
        
        // Processing configuration
        this.config = {
            batch_size: 10,              // Process comics in batches
            max_concurrent: 5,           // Maximum concurrent processing
            timeout_per_comic: 30000,    // 30 seconds per comic
            retry_attempts: 3,           // Retry failed comics
            progress_reporting: true,    // Report progress during processing
            cache_results: true          // Cache recommendations
        };

        // Processing state
        this.state = {
            current_job: null,
            processing_queue: [],
            completed_jobs: new Map(),
            failed_comics: new Map(),
            performance_metrics: {
                total_processed: 0,
                average_processing_time: 0,
                success_rate: 0,
                cache_hit_rate: 0
            }
        };

        // Result aggregation and analysis
        this.aggregationMethods = {
            portfolio_analysis: true,
            risk_assessment: true,
            diversification_analysis: true,
            market_timing: true,
            value_optimization: true
        };
    }

    /**
     * Process bulk recommendations for a collection of comics
     * @param {Array} comicsCollection - Array of comic objects
     * @param {Object} userContext - User preferences and context
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Bulk processing results
     */
    async processCollection(comicsCollection, userContext = {}, options = {}) {
        try {
            const jobId = this.generateJobId();
            console.log(`🚀 Starting bulk recommendation processing for ${comicsCollection.length} comics (Job: ${jobId})`);

            // Validate input
            const validation = this.validateInput(comicsCollection, userContext);
            if (!validation.isValid) {
                throw new Error(`Invalid input: ${validation.error}`);
            }

            // Initialize job
            const job = this.initializeJob(jobId, comicsCollection, userContext, options);
            this.state.current_job = job;

            // Process comics in batches
            const batchResults = await this.processBatches(job);

            // Aggregate individual recommendations
            const aggregatedResults = await this.aggregateResults(batchResults, job);

            // Generate portfolio-level insights
            const portfolioInsights = await this.generatePortfolioInsights(aggregatedResults, job);

            // Calculate processing metrics
            const processingMetrics = this.calculateProcessingMetrics(job);

            // Finalize job
            const finalResults = {
                job_id: jobId,
                total_comics: comicsCollection.length,
                processed_successfully: batchResults.successful.length,
                processing_failed: batchResults.failed.length,
                individual_recommendations: batchResults.successful,
                failed_comics: batchResults.failed,
                aggregated_analysis: aggregatedResults,
                portfolio_insights: portfolioInsights,
                processing_metrics: processingMetrics,
                recommendations_summary: this.generateRecommendationsSummary(batchResults.successful),
                next_actions: this.generateNextActions(aggregatedResults, portfolioInsights),
                completion_time: new Date().toISOString(),
                job_duration: Date.now() - job.start_time
            };

            // Store completed job
            this.state.completed_jobs.set(jobId, finalResults);
            this.state.current_job = null;

            console.log(`✅ Bulk processing completed: ${finalResults.processed_successfully}/${finalResults.total_comics} comics processed successfully`);
            return finalResults;

        } catch (error) {
            console.error('❌ Bulk processing error:', error);
            return {
                success: false,
                error: error.message,
                job_id: this.state.current_job?.job_id,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Process comics in manageable batches
     */
    async processBatches(job) {
        const { comics, user_context, options } = job;
        const batchSize = options.batch_size || this.config.batch_size;
        
        const successful = [];
        const failed = [];
        
        // Split comics into batches
        const batches = this.createBatches(comics, batchSize);
        
        console.log(`📦 Processing ${comics.length} comics in ${batches.length} batches`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchNumber = i + 1;
            
            console.log(`⚡ Processing batch ${batchNumber}/${batches.length} (${batch.length} comics)`);
            
            try {
                // Process batch with concurrency control
                const batchResults = await this.processBatch(batch, user_context, batchNumber);
                
                successful.push(...batchResults.successful);
                failed.push(...batchResults.failed);

                // Update job progress
                this.updateJobProgress(job, successful.length + failed.length, comics.length);

                // Report progress if enabled
                if (this.config.progress_reporting) {
                    this.reportProgress(job, batchNumber, batches.length, successful.length, failed.length);
                }

                // Small delay between batches to prevent overwhelming
                if (i < batches.length - 1) {
                    await this.sleep(100);
                }

            } catch (batchError) {
                console.error(`❌ Batch ${batchNumber} processing failed:`, batchError);
                
                // Add all comics in failed batch to failed list
                batch.forEach(comic => {
                    failed.push({
                        comic: comic,
                        error: `Batch processing failed: ${batchError.message}`,
                        batch_number: batchNumber
                    });
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Process a single batch of comics
     */
    async processBatch(batch, userContext, batchNumber) {
        const successful = [];
        const failed = [];

        // Create promises for concurrent processing
        const promises = batch.map(async (comic, index) => {
            try {
                const startTime = Date.now();
                
                // Check cache first
                const cachedResult = this.getCachedRecommendation(comic, userContext);
                if (cachedResult) {
                    console.log(`📋 Using cached recommendation for: ${comic.title || comic.id}`);
                    return {
                        comic: comic,
                        recommendation: cachedResult,
                        processing_time: Date.now() - startTime,
                        from_cache: true
                    };
                }

                // Generate new recommendation
                const recommendation = await this.recommendationEngine.generateRecommendation(comic, userContext);
                
                if (recommendation.success) {
                    // Cache the result
                    this.cacheRecommendation(comic, userContext, recommendation.recommendation);
                    
                    return {
                        comic: comic,
                        recommendation: recommendation.recommendation,
                        processing_time: Date.now() - startTime,
                        from_cache: false,
                        batch_number: batchNumber
                    };
                } else {
                    throw new Error(recommendation.error || 'Recommendation generation failed');
                }

            } catch (error) {
                console.error(`❌ Failed to process comic: ${comic.title || comic.id}`, error.message);
                return {
                    comic: comic,
                    error: error.message,
                    batch_number: batchNumber,
                    failed: true
                };
            }
        });

        // Execute promises with concurrency control
        const results = await this.executeWithConcurrencyControl(promises, this.config.max_concurrent);

        // Separate successful and failed results
        results.forEach(result => {
            if (result.failed) {
                failed.push(result);
            } else {
                successful.push(result);
            }
        });

        return { successful, failed };
    }

    /**
     * Aggregate individual recommendations into collection-level insights
     */
    async aggregateResults(batchResults, job) {
        const successful = batchResults.successful;
        
        if (successful.length === 0) {
            return {
                total_recommendations: 0,
                recommendation_distribution: {},
                confidence_analysis: {},
                market_analysis: {},
                timing_analysis: {}
            };
        }

        console.log(`📊 Aggregating results from ${successful.length} successful recommendations`);

        // Recommendation distribution analysis
        const recommendationDistribution = this.analyzeRecommendationDistribution(successful);

        // Confidence analysis
        const confidenceAnalysis = this.analyzeConfidenceLevels(successful);

        // Market analysis aggregation
        const marketAnalysis = this.aggregateMarketAnalysis(successful);

        // Timing analysis
        const timingAnalysis = this.analyzeTimingPatterns(successful);

        // Risk analysis
        const riskAnalysis = this.aggregateRiskAnalysis(successful);

        // Value analysis
        const valueAnalysis = this.aggregateValueAnalysis(successful);

        return {
            total_recommendations: successful.length,
            recommendation_distribution: recommendationDistribution,
            confidence_analysis: confidenceAnalysis,
            market_analysis: marketAnalysis,
            timing_analysis: timingAnalysis,
            risk_analysis: riskAnalysis,
            value_analysis: valueAnalysis,
            processing_time_analysis: this.analyzeProcessingTimes(successful),
            data_quality_analysis: this.analyzeDataQuality(successful)
        };
    }

    /**
     * Generate portfolio-level insights and recommendations
     */
    async generatePortfolioInsights(aggregatedResults, job) {
        console.log('🎯 Generating portfolio-level insights');

        const insights = {
            portfolio_health: this.assessPortfolioHealth(aggregatedResults),
            diversification_score: this.calculateDiversificationScore(aggregatedResults),
            risk_profile: this.calculatePortfolioRiskProfile(aggregatedResults),
            optimization_opportunities: this.identifyOptimizationOpportunities(aggregatedResults),
            market_positioning: this.analyzeMarketPositioning(aggregatedResults),
            strategic_recommendations: this.generateStrategicRecommendations(aggregatedResults),
            performance_projections: this.generatePerformanceProjections(aggregatedResults)
        };

        return insights;
    }

    /**
     * Analyze recommendation distribution across the collection
     */
    analyzeRecommendationDistribution(recommendations) {
        const distribution = {
            'list now': 0,
            'hold': 0,
            'grade': 0,
            'monitor': 0
        };

        const confidenceByAction = {};
        const urgencyDistribution = {};

        recommendations.forEach(rec => {
            const action = rec.recommendation.primary_recommendation.action;
            const confidence = rec.recommendation.confidence_score;
            const urgency = rec.recommendation.primary_recommendation.urgency;

            distribution[action] = (distribution[action] || 0) + 1;

            if (!confidenceByAction[action]) {
                confidenceByAction[action] = [];
            }
            confidenceByAction[action].push(confidence);

            urgencyDistribution[urgency] = (urgencyDistribution[urgency] || 0) + 1;
        });

        // Calculate average confidence by action
        Object.keys(confidenceByAction).forEach(action => {
            const confidences = confidenceByAction[action];
            confidenceByAction[action] = {
                count: confidences.length,
                average_confidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
                min_confidence: Math.min(...confidences),
                max_confidence: Math.max(...confidences)
            };
        });

        return {
            action_counts: distribution,
            confidence_by_action: confidenceByAction,
            urgency_distribution: urgencyDistribution,
            recommendations_breakdown: this.calculateRecommendationPercentages(distribution)
        };
    }

    /**
     * Analyze confidence levels across recommendations
     */
    analyzeConfidenceLevels(recommendations) {
        const confidences = recommendations.map(rec => rec.recommendation.confidence_score);
        
        return {
            average_confidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
            median_confidence: this.calculateMedian(confidences),
            min_confidence: Math.min(...confidences),
            max_confidence: Math.max(...confidences),
            confidence_distribution: {
                high: confidences.filter(c => c >= 0.8).length,
                medium: confidences.filter(c => c >= 0.6 && c < 0.8).length,
                low: confidences.filter(c => c < 0.6).length
            },
            low_confidence_comics: recommendations
                .filter(rec => rec.recommendation.confidence_score < 0.6)
                .map(rec => ({
                    title: rec.comic.title,
                    confidence: rec.recommendation.confidence_score,
                    issues: rec.recommendation.confidence_breakdown
                }))
        };
    }

    /**
     * Aggregate market analysis across recommendations
     */
    aggregateMarketAnalysis(recommendations) {
        const marketData = recommendations.map(rec => rec.recommendation.market_analysis);
        
        const trendCounts = {
            upward: 0,
            downward: 0,
            stable: 0
        };

        const activityScores = [];
        const anomalyCount = marketData.filter(m => m.anomaly_detected).length;

        marketData.forEach(market => {
            trendCounts[market.price_trend] = (trendCounts[market.price_trend] || 0) + 1;
            activityScores.push(market.market_activity);
        });

        return {
            trend_distribution: trendCounts,
            average_market_activity: activityScores.reduce((a, b) => a + b, 0) / activityScores.length,
            anomalies_detected: anomalyCount,
            anomaly_rate: anomalyCount / recommendations.length,
            market_sentiment: this.calculateOverallMarketSentiment(trendCounts),
            external_factors_summary: this.summarizeExternalFactors(marketData)
        };
    }

    /**
     * Analyze timing patterns in recommendations
     */
    analyzeTimingPatterns(recommendations) {
        const urgencyCounts = {
            high: 0,
            medium: 0,
            low: 0
        };

        const timeframes = [];

        recommendations.forEach(rec => {
            const urgency = rec.recommendation.primary_recommendation.urgency;
            urgencyCounts[urgency] = (urgencyCounts[urgency] || 0) + 1;

            if (rec.recommendation.timing_advice && rec.recommendation.timing_advice.timeframe) {
                timeframes.push(rec.recommendation.timing_advice.timeframe);
            }
        });

        return {
            urgency_distribution: urgencyCounts,
            immediate_action_required: urgencyCounts.high,
            timeframe_analysis: this.analyzeTimeframes(timeframes),
            seasonal_considerations: this.analyzeSeasonalFactors(recommendations)
        };
    }

    /**
     * Portfolio-level insight generation methods
     */
    assessPortfolioHealth(aggregatedResults) {
        const { recommendation_distribution, confidence_analysis, market_analysis } = aggregatedResults;
        
        let healthScore = 0.5; // Base score
        
        // Positive factors
        if (confidence_analysis.average_confidence > 0.7) healthScore += 0.15;
        if (recommendation_distribution.action_counts['hold'] > recommendation_distribution.action_counts['list now']) healthScore += 0.1;
        if (market_analysis.anomaly_rate < 0.2) healthScore += 0.1;
        
        // Negative factors
        if (confidence_analysis.confidence_distribution.low > aggregatedResults.total_recommendations * 0.3) healthScore -= 0.15;
        if (market_analysis.anomaly_rate > 0.4) healthScore -= 0.1;

        return {
            score: Math.max(0, Math.min(1, healthScore)),
            status: healthScore > 0.7 ? 'healthy' : healthScore > 0.5 ? 'moderate' : 'needs_attention',
            key_strengths: this.identifyPortfolioStrengths(aggregatedResults),
            areas_for_improvement: this.identifyImprovementAreas(aggregatedResults)
        };
    }

    calculateDiversificationScore(aggregatedResults) {
        const { recommendation_distribution } = aggregatedResults;
        const actions = recommendation_distribution.action_counts;
        
        // Calculate Shannon diversity index
        const total = Object.values(actions).reduce((a, b) => a + b, 0);
        const proportions = Object.values(actions).map(count => count / total);
        const shannonIndex = -proportions.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
        
        // Normalize to 0-1 scale (max diversity is log(4) for 4 actions)
        const normalizedScore = shannonIndex / Math.log(4);
        
        return {
            score: normalizedScore,
            level: normalizedScore > 0.8 ? 'high' : normalizedScore > 0.6 ? 'moderate' : 'low',
            distribution_balance: this.assessDistributionBalance(actions),
            recommendations: this.generateDiversificationRecommendations(normalizedScore, actions)
        };
    }

    generateStrategicRecommendations(aggregatedResults) {
        const recommendations = [];
        
        // Based on recommendation distribution
        const actions = aggregatedResults.recommendation_distribution.action_counts;
        const total = Object.values(actions).reduce((a, b) => a + b, 0);
        
        if (actions['list now'] / total > 0.4) {
            recommendations.push({
                category: 'market_timing',
                priority: 'high',
                action: 'Consider staggered selling to avoid market flooding',
                rationale: 'High proportion of "list now" recommendations detected'
            });
        }
        
        if (actions['grade'] / total > 0.3) {
            recommendations.push({
                category: 'value_optimization',
                priority: 'medium',
                action: 'Develop grading strategy and budget allocation',
                rationale: 'Significant grading opportunities identified'
            });
        }
        
        if (aggregatedResults.confidence_analysis.average_confidence < 0.6) {
            recommendations.push({
                category: 'risk_management',
                priority: 'high',
                action: 'Focus on high-confidence recommendations first',
                rationale: 'Low average confidence across portfolio'
            });
        }

        return recommendations;
    }

    /**
     * Utility methods
     */
    generateJobId() {
        return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    validateInput(comicsCollection, userContext) {
        if (!Array.isArray(comicsCollection)) {
            return { isValid: false, error: 'Comics collection must be an array' };
        }
        
        if (comicsCollection.length === 0) {
            return { isValid: false, error: 'Comics collection cannot be empty' };
        }
        
        if (comicsCollection.length > 1000) {
            return { isValid: false, error: 'Comics collection too large (max 1000 comics)' };
        }

        return { isValid: true };
    }

    initializeJob(jobId, comics, userContext, options) {
        return {
            job_id: jobId,
            comics: comics,
            user_context: userContext,
            options: { ...this.config, ...options },
            start_time: Date.now(),
            progress: 0,
            status: 'processing'
        };
    }

    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    async executeWithConcurrencyControl(promises, maxConcurrent) {
        const results = [];
        
        for (let i = 0; i < promises.length; i += maxConcurrent) {
            const batch = promises.slice(i, i + maxConcurrent);
            const batchResults = await Promise.allSettled(batch);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        failed: true,
                        error: result.reason.message || 'Unknown error'
                    });
                }
            });
        }
        
        return results;
    }

    updateJobProgress(job, completed, total) {
        job.progress = Math.round((completed / total) * 100);
    }

    reportProgress(job, currentBatch, totalBatches, successful, failed) {
        console.log(`📈 Progress: ${job.progress}% | Batch ${currentBatch}/${totalBatches} | ✅${successful} ❌${failed}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCachedRecommendation(comic, userContext) {
        // Simplified caching - in real implementation would use Redis or similar
        return null;
    }

    cacheRecommendation(comic, userContext, recommendation) {
        // Simplified caching - in real implementation would use Redis or similar
    }

    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    calculateRecommendationPercentages(distribution) {
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        const percentages = {};
        
        Object.keys(distribution).forEach(action => {
            percentages[action] = Math.round((distribution[action] / total) * 100);
        });
        
        return percentages;
    }

    calculateOverallMarketSentiment(trendCounts) {
        const total = Object.values(trendCounts).reduce((a, b) => a + b, 0);
        const upwardRatio = trendCounts.upward / total;
        const downwardRatio = trendCounts.downward / total;
        
        if (upwardRatio > 0.6) return 'bullish';
        if (downwardRatio > 0.6) return 'bearish';
        return 'neutral';
    }

    summarizeExternalFactors(marketData) {
        const externalFactors = marketData.flatMap(m => m.external_factors || []);
        const factorCounts = {};
        
        externalFactors.forEach(factor => {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        });
        
        return factorCounts;
    }

    analyzeTimeframes(timeframes) {
        const frameCounts = {};
        timeframes.forEach(frame => {
            frameCounts[frame] = (frameCounts[frame] || 0) + 1;
        });
        return frameCounts;
    }

    analyzeSeasonalFactors(recommendations) {
        // Simplified seasonal analysis
        const currentMonth = new Date().getMonth();
        const isHolidaySeason = currentMonth >= 9; // Oct-Dec
        
        return {
            current_season: isHolidaySeason ? 'holiday' : 'regular',
            seasonal_impact: isHolidaySeason ? 'increased_activity_expected' : 'normal_activity'
        };
    }

    aggregateRiskAnalysis(recommendations) {
        const risks = recommendations.flatMap(rec => rec.recommendation.risk_assessment || []);
        const riskCounts = {};
        
        risks.forEach(risk => {
            const level = risk.level;
            riskCounts[level] = (riskCounts[level] || 0) + 1;
        });
        
        return {
            risk_distribution: riskCounts,
            high_risk_comics: recommendations.filter(rec => 
                (rec.recommendation.risk_assessment || []).some(risk => risk.level === 'high')
            ).length,
            risk_mitigation_needed: riskCounts.high > recommendations.length * 0.2
        };
    }

    aggregateValueAnalysis(recommendations) {
        const values = recommendations.map(rec => rec.recommendation.market_analysis.current_price || 0);
        const total_value = values.reduce((a, b) => a + b, 0);
        
        return {
            total_collection_value: total_value,
            average_comic_value: total_value / values.length,
            value_distribution: {
                high_value: values.filter(v => v > 100).length,
                medium_value: values.filter(v => v >= 20 && v <= 100).length,
                low_value: values.filter(v => v < 20).length
            }
        };
    }

    analyzeProcessingTimes(recommendations) {
        const times = recommendations.map(rec => rec.processing_time);
        
        return {
            average_time: times.reduce((a, b) => a + b, 0) / times.length,
            total_time: times.reduce((a, b) => a + b, 0),
            cache_hits: recommendations.filter(rec => rec.from_cache).length
        };
    }

    analyzeDataQuality(recommendations) {
        const qualities = recommendations.map(rec => 
            rec.recommendation.market_analysis?.data_quality_score || 0.7
        );
        
        return {
            average_quality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
            low_quality_count: qualities.filter(q => q < 0.6).length
        };
    }

    calculateProcessingMetrics(job) {
        return {
            job_duration: Date.now() - job.start_time,
            processing_efficiency: job.progress / ((Date.now() - job.start_time) / 1000), // % per second
            estimated_total_time: job.progress > 0 ? (Date.now() - job.start_time) / (job.progress / 100) : null
        };
    }

    generateRecommendationsSummary(successful) {
        return {
            immediate_actions: successful.filter(rec => 
                rec.recommendation.primary_recommendation.urgency === 'high'
            ).length,
            medium_term_actions: successful.filter(rec => 
                rec.recommendation.primary_recommendation.urgency === 'medium'
            ).length,
            monitoring_required: successful.filter(rec => 
                rec.recommendation.primary_recommendation.action === 'monitor'
            ).length
        };
    }

    generateNextActions(aggregatedResults, portfolioInsights) {
        const actions = [];
        
        if (portfolioInsights.portfolio_health.score < 0.6) {
            actions.push({
                priority: 'high',
                action: 'Review portfolio health issues',
                deadline: '1 week'
            });
        }
        
        if (aggregatedResults.timing_analysis.immediate_action_required > 0) {
            actions.push({
                priority: 'high',
                action: `Process ${aggregatedResults.timing_analysis.immediate_action_required} high-urgency recommendations`,
                deadline: '72 hours'
            });
        }
        
        return actions;
    }

    // Additional utility methods for portfolio analysis
    identifyPortfolioStrengths(aggregatedResults) {
        const strengths = [];
        
        if (aggregatedResults.confidence_analysis.average_confidence > 0.75) {
            strengths.push('High recommendation confidence');
        }
        
        if (aggregatedResults.market_analysis.anomaly_rate < 0.15) {
            strengths.push('Stable market conditions');
        }
        
        return strengths;
    }

    identifyImprovementAreas(aggregatedResults) {
        const areas = [];
        
        if (aggregatedResults.confidence_analysis.confidence_distribution.low > aggregatedResults.total_recommendations * 0.3) {
            areas.push('High number of low-confidence recommendations');
        }
        
        return areas;
    }

    assessDistributionBalance(actions) {
        const total = Object.values(actions).reduce((a, b) => a + b, 0);
        const proportions = Object.values(actions).map(count => count / total);
        const maxProportion = Math.max(...proportions);
        
        return {
            is_balanced: maxProportion < 0.6,
            dominant_action: Object.keys(actions).find(action => actions[action] / total === maxProportion),
            balance_score: 1 - maxProportion + 0.25 // Normalize to make 0.4 the midpoint
        };
    }

    generateDiversificationRecommendations(score, actions) {
        const recommendations = [];
        
        if (score < 0.5) {
            recommendations.push('Consider diversifying recommendation types across your collection');
        }
        
        return recommendations;
    }

    calculatePortfolioRiskProfile(aggregatedResults) {
        const riskScore = aggregatedResults.risk_analysis?.high_risk_comics / aggregatedResults.total_recommendations || 0;
        
        return {
            risk_level: riskScore > 0.3 ? 'high' : riskScore > 0.15 ? 'moderate' : 'low',
            risk_score: riskScore,
            mitigation_required: riskScore > 0.2
        };
    }

    identifyOptimizationOpportunities(aggregatedResults) {
        const opportunities = [];
        
        const gradeCount = aggregatedResults.recommendation_distribution.action_counts['grade'] || 0;
        if (gradeCount > 0) {
            opportunities.push({
                type: 'grading',
                count: gradeCount,
                potential_value_increase: gradeCount * 0.25 // Estimated 25% increase
            });
        }
        
        return opportunities;
    }

    analyzeMarketPositioning(aggregatedResults) {
        return {
            market_timing: aggregatedResults.market_analysis.market_sentiment,
            position_strength: aggregatedResults.confidence_analysis.average_confidence,
            opportunities: aggregatedResults.recommendation_distribution.action_counts['list now'] || 0
        };
    }

    generatePerformanceProjections(aggregatedResults) {
        // Simplified performance projections
        const avgROI = 0.15; // 15% average ROI assumption
        const totalValue = aggregatedResults.value_analysis?.total_collection_value || 0;
        
        return {
            projected_6_month_growth: totalValue * (avgROI / 2),
            projected_1_year_growth: totalValue * avgROI,
            confidence_in_projections: aggregatedResults.confidence_analysis.average_confidence
        };
    }
}

module.exports = BulkRecommendationProcessor; 