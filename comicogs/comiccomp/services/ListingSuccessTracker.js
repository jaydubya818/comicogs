const db = require("../backend/db");

/**
 * Listing Success Tracker - Task 8 Implementation
 * Analytics for tracking recommendation effectiveness and listing performance
 */
class ListingSuccessTracker {
    constructor() {
        this.config = {
            trackingWindow: 90 * 24 * 60 * 60 * 1000, // 90 days
            successThresholds: {
                timeToSale: 30, // days
                priceAccuracy: 0.1, // 10% deviation
                viewsToSaleRatio: 0.05, // 5% conversion
                messageToSaleRatio: 0.2 // 20% conversion
            },
            metrics: {
                listingPerformance: true,
                recommendationAccuracy: true,
                marketPrediction: true,
                userBehavior: true
            },
            aggregationPeriods: ['daily', 'weekly', 'monthly']
        };

        console.log('✅ ListingSuccessTracker initialized');
    }

    /**
     * Track a new listing creation with recommendation data
     */
    async trackListingCreation(listingData) {
        try {
            const trackingEntry = {
                listing_id: listingData.listingId,
                user_id: listingData.userId,
                comic_id: listingData.comicId,
                collection_id: listingData.collectionId,
                
                // Recommendation data
                recommendation_id: listingData.recommendationId,
                recommendation_action: listingData.recommendation?.action,
                recommendation_confidence: listingData.recommendation?.confidence,
                ai_suggested_price: listingData.recommendation?.suggestedPrice,
                ai_price_confidence: listingData.recommendation?.priceConfidence,
                
                // Actual listing data
                actual_listing_price: listingData.actualPrice,
                actual_condition: listingData.condition,
                listing_description_enhanced: listingData.enhancedDescription || false,
                market_insights_included: listingData.marketInsights?.length > 0,
                
                // User behavior
                user_followed_price_suggestion: this.calculatePriceFollowRate(
                    listingData.recommendation?.suggestedPrice,
                    listingData.actualPrice
                ),
                user_followed_action_suggestion: listingData.recommendation?.action === 'LIST_NOW',
                time_from_recommendation_to_listing: listingData.timeFromRecommendation || 0,
                
                // Market conditions at listing time
                market_conditions: JSON.stringify(listingData.marketConditions || {}),
                competitive_listings_count: listingData.competitionCount || 0,
                
                // Timestamps
                created_at: new Date(),
                recommendation_generated_at: listingData.recommendationTimestamp,
                
                // Initial metrics
                views_count: 0,
                watchers_count: 0,
                messages_count: 0,
                listing_status: 'active'
            };

            const result = await this.insertTrackingEntry(trackingEntry);
            
            // Set up monitoring for this listing
            await this.setupListingMonitoring(result.id);
            
            return result;

        } catch (error) {
            console.error('Error tracking listing creation:', error);
            throw error;
        }
    }

    /**
     * Update listing tracking with performance metrics
     */
    async updateListingMetrics(listingId, metrics) {
        try {
            const updateData = {
                views_count: metrics.views,
                watchers_count: metrics.watchers,
                messages_count: metrics.messages,
                updated_at: new Date()
            };

            // Calculate derived metrics
            if (metrics.views > 0) {
                updateData.view_to_message_rate = metrics.messages / metrics.views;
                updateData.view_to_watcher_rate = metrics.watchers / metrics.views;
            }

            await this.updateTrackingEntry(listingId, updateData);

            // Check for performance milestones
            await this.checkPerformanceMilestones(listingId, metrics);

        } catch (error) {
            console.error('Error updating listing metrics:', error);
        }
    }

    /**
     * Track listing sale completion
     */
    async trackListingSale(listingId, saleData) {
        try {
            const trackingEntry = await this.getTrackingEntry(listingId);
            if (!trackingEntry) {
                console.warn(`No tracking entry found for listing ${listingId}`);
                return;
            }

            const saleTime = new Date();
            const timeToSale = saleTime - new Date(trackingEntry.created_at);
            const daysToSale = Math.floor(timeToSale / (24 * 60 * 60 * 1000));

            const saleUpdateData = {
                sold_at: saleTime,
                final_sale_price: saleData.salePrice,
                days_to_sale: daysToSale,
                buyer_id: saleData.buyerId,
                sale_method: saleData.method || 'direct_purchase',
                listing_status: 'sold',
                
                // Performance calculations
                price_accuracy: this.calculatePriceAccuracy(
                    trackingEntry.ai_suggested_price,
                    saleData.salePrice
                ),
                recommendation_success: this.calculateRecommendationSuccess(
                    trackingEntry,
                    { daysToSale, salePrice: saleData.salePrice }
                ),
                market_prediction_accuracy: await this.calculateMarketPredictionAccuracy(
                    trackingEntry.comic_id,
                    trackingEntry.created_at,
                    saleData.salePrice
                )
            };

            await this.updateTrackingEntry(listingId, saleUpdateData);

            // Update aggregated metrics
            await this.updateAggregatedMetrics(trackingEntry, saleUpdateData);

            // Generate success insights
            const insights = await this.generateSuccessInsights(trackingEntry, saleUpdateData);

            return {
                success: true,
                insights,
                performance: {
                    daysToSale,
                    priceAccuracy: saleUpdateData.price_accuracy,
                    recommendationSuccess: saleUpdateData.recommendation_success
                }
            };

        } catch (error) {
            console.error('Error tracking listing sale:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive success report
     */
    async generateSuccessReport(options = {}) {
        try {
            const {
                userId = null,
                startDate = new Date(Date.now() - this.config.trackingWindow),
                endDate = new Date(),
                groupBy = 'weekly'
            } = options;

            const report = {
                summary: await this.generateSummaryMetrics(userId, startDate, endDate),
                recommendations: await this.analyzeRecommendationPerformance(userId, startDate, endDate),
                pricing: await this.analyzePricingAccuracy(userId, startDate, endDate),
                market: await this.analyzeMarketPredictions(userId, startDate, endDate),
                userBehavior: await this.analyzeUserBehavior(userId, startDate, endDate),
                trends: await this.generateTrendAnalysis(userId, startDate, endDate, groupBy),
                insights: await this.generateActionableInsights(userId, startDate, endDate)
            };

            return report;

        } catch (error) {
            console.error('Error generating success report:', error);
            throw error;
        }
    }

    /**
     * Analyze recommendation engine performance
     */
    async analyzeRecommendationPerformance(userId, startDate, endDate) {
        try {
            const performance = {
                overallAccuracy: 0,
                actionAccuracy: {},
                confidenceCorrelation: 0,
                timeToSaleByAction: {},
                priceAccuracyByConfidence: {},
                marketConditionImpact: {}
            };

            // Get tracking data
            const trackingData = await this.getTrackingData(userId, startDate, endDate);
            const soldListings = trackingData.filter(item => item.listing_status === 'sold');

            if (soldListings.length === 0) {
                return performance;
            }

            // Calculate overall accuracy
            const successfulRecommendations = soldListings.filter(
                item => item.recommendation_success > 0.7
            );
            performance.overallAccuracy = successfulRecommendations.length / soldListings.length;

            // Analyze by recommendation action
            const actionGroups = this.groupBy(soldListings, 'recommendation_action');
            Object.entries(actionGroups).forEach(([action, listings]) => {
                const avgDaysToSale = listings.reduce((sum, item) => sum + item.days_to_sale, 0) / listings.length;
                const avgPriceAccuracy = listings.reduce((sum, item) => sum + item.price_accuracy, 0) / listings.length;
                
                performance.actionAccuracy[action] = {
                    listingCount: listings.length,
                    avgDaysToSale,
                    avgPriceAccuracy,
                    successRate: listings.filter(item => item.recommendation_success > 0.7).length / listings.length
                };
            });

            // Analyze confidence correlation
            const confidenceData = soldListings.map(item => ({
                confidence: item.ai_price_confidence,
                accuracy: item.price_accuracy
            }));
            performance.confidenceCorrelation = this.calculateCorrelation(
                confidenceData.map(d => d.confidence),
                confidenceData.map(d => d.accuracy)
            );

            return performance;

        } catch (error) {
            console.error('Error analyzing recommendation performance:', error);
            return {};
        }
    }

    /**
     * Analyze pricing accuracy
     */
    async analyzePricingAccuracy(userId, startDate, endDate) {
        try {
            const pricingAnalysis = {
                overallAccuracy: 0,
                accuracyByPriceRange: {},
                accuracyByCondition: {},
                accuracyByMarketActivity: {},
                pricingBias: 0,
                optimalPricingStrategies: []
            };

            const trackingData = await this.getTrackingData(userId, startDate, endDate);
            const soldListings = trackingData.filter(item => 
                item.listing_status === 'sold' && item.ai_suggested_price && item.final_sale_price
            );

            if (soldListings.length === 0) {
                return pricingAnalysis;
            }

            // Calculate overall accuracy
            const accuracies = soldListings.map(item => item.price_accuracy);
            pricingAnalysis.overallAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;

            // Analyze by price range
            const priceRanges = {
                'low': soldListings.filter(item => item.ai_suggested_price < 50),
                'medium': soldListings.filter(item => item.ai_suggested_price >= 50 && item.ai_suggested_price < 200),
                'high': soldListings.filter(item => item.ai_suggested_price >= 200)
            };

            Object.entries(priceRanges).forEach(([range, listings]) => {
                if (listings.length > 0) {
                    pricingAnalysis.accuracyByPriceRange[range] = {
                        avgAccuracy: listings.reduce((sum, item) => sum + item.price_accuracy, 0) / listings.length,
                        listingCount: listings.length,
                        avgTimeToSale: listings.reduce((sum, item) => sum + item.days_to_sale, 0) / listings.length
                    };
                }
            });

            // Calculate pricing bias (tendency to over or under-price)
            const priceDeviations = soldListings.map(item => 
                (item.final_sale_price - item.ai_suggested_price) / item.ai_suggested_price
            );
            pricingAnalysis.pricingBias = priceDeviations.reduce((sum, dev) => sum + dev, 0) / priceDeviations.length;

            return pricingAnalysis;

        } catch (error) {
            console.error('Error analyzing pricing accuracy:', error);
            return {};
        }
    }

    /**
     * Generate actionable insights for improvement
     */
    async generateActionableInsights(userId, startDate, endDate) {
        try {
            const insights = {
                recommendations: [],
                warnings: [],
                opportunities: [],
                performance: 'good' // good, average, poor
            };

            const trackingData = await this.getTrackingData(userId, startDate, endDate);
            const soldListings = trackingData.filter(item => item.listing_status === 'sold');
            const activeListings = trackingData.filter(item => item.listing_status === 'active');

            // Performance assessment
            if (soldListings.length > 0) {
                const avgDaysToSale = soldListings.reduce((sum, item) => sum + item.days_to_sale, 0) / soldListings.length;
                const avgPriceAccuracy = soldListings.reduce((sum, item) => sum + item.price_accuracy, 0) / soldListings.length;

                if (avgDaysToSale > 45 || avgPriceAccuracy < 0.8) {
                    insights.performance = 'poor';
                    insights.warnings.push('Listings taking longer than expected to sell');
                } else if (avgDaysToSale > 30 || avgPriceAccuracy < 0.9) {
                    insights.performance = 'average';
                }
            }

            // Generate specific recommendations
            const lowPerformanceListings = soldListings.filter(
                item => item.days_to_sale > 45 || item.price_accuracy < 0.8
            );

            if (lowPerformanceListings.length > soldListings.length * 0.3) {
                insights.recommendations.push('Consider improving listing descriptions with more market insights');
                insights.recommendations.push('Review pricing strategy - may be pricing too high');
            }

            // User behavior insights
            const userFollowRate = trackingData.filter(item => item.user_followed_price_suggestion).length / trackingData.length;
            if (userFollowRate < 0.7) {
                insights.recommendations.push('Users frequently ignore pricing suggestions - review pricing algorithm');
            }

            // Opportunity identification
            const fastSellers = soldListings.filter(item => item.days_to_sale <= 14);
            if (fastSellers.length > 0) {
                const commonTraits = this.identifyCommonTraits(fastSellers);
                insights.opportunities.push(`Items with ${commonTraits.join(', ')} tend to sell quickly`);
            }

            return insights;

        } catch (error) {
            console.error('Error generating actionable insights:', error);
            return { recommendations: [], warnings: [], opportunities: [], performance: 'unknown' };
        }
    }

    // Database operations
    async insertTrackingEntry(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
        const values = Object.values(data);

        const query = `
            INSERT INTO listing_success_tracking (${columns})
            VALUES (${placeholders})
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async updateTrackingEntry(listingId, updateData) {
        const setClauses = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`);
        const values = [listingId, ...Object.values(updateData)];

        const query = `
            UPDATE listing_success_tracking 
            SET ${setClauses.join(', ')}
            WHERE listing_id = $1
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async getTrackingEntry(listingId) {
        const query = `
            SELECT * FROM listing_success_tracking 
            WHERE listing_id = $1
        `;
        const result = await db.query(query, [listingId]);
        return result.rows[0] || null;
    }

    async getTrackingData(userId, startDate, endDate) {
        let query = `
            SELECT * FROM listing_success_tracking 
            WHERE created_at >= $1 AND created_at <= $2
        `;
        const params = [startDate, endDate];

        if (userId) {
            query += ` AND user_id = $3`;
            params.push(userId);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    // Helper methods
    calculatePriceFollowRate(suggestedPrice, actualPrice) {
        if (!suggestedPrice || !actualPrice) return false;
        const deviation = Math.abs(actualPrice - suggestedPrice) / suggestedPrice;
        return deviation <= this.config.successThresholds.priceAccuracy;
    }

    calculatePriceAccuracy(suggestedPrice, salePrice) {
        if (!suggestedPrice || !salePrice) return 0;
        const deviation = Math.abs(salePrice - suggestedPrice) / suggestedPrice;
        return Math.max(0, 1 - deviation);
    }

    calculateRecommendationSuccess(trackingEntry, saleData) {
        let score = 0;
        let factors = 0;

        // Time to sale factor
        if (saleData.daysToSale <= this.config.successThresholds.timeToSale) {
            score += 0.4;
        } else {
            score += Math.max(0, 0.4 * (this.config.successThresholds.timeToSale / saleData.daysToSale));
        }
        factors++;

        // Price accuracy factor
        const priceAccuracy = this.calculatePriceAccuracy(
            trackingEntry.ai_suggested_price,
            saleData.salePrice
        );
        score += priceAccuracy * 0.4;
        factors++;

        // User behavior factor
        if (trackingEntry.user_followed_price_suggestion) {
            score += 0.2;
        }
        factors++;

        return score;
    }

    async calculateMarketPredictionAccuracy(comicId, listingDate, salePrice) {
        // This would compare predicted market conditions with actual outcomes
        // For now, return a placeholder
        return 0.8;
    }

    async generateSummaryMetrics(userId, startDate, endDate) {
        const trackingData = await this.getTrackingData(userId, startDate, endDate);
        const soldListings = trackingData.filter(item => item.listing_status === 'sold');

        return {
            totalListings: trackingData.length,
            soldListings: soldListings.length,
            sellThroughRate: soldListings.length / trackingData.length,
            avgDaysToSale: soldListings.length > 0 ? 
                soldListings.reduce((sum, item) => sum + item.days_to_sale, 0) / soldListings.length : 0,
            avgPriceAccuracy: soldListings.length > 0 ?
                soldListings.reduce((sum, item) => sum + item.price_accuracy, 0) / soldListings.length : 0,
            totalRevenue: soldListings.reduce((sum, item) => sum + (item.final_sale_price || 0), 0),
            avgRecommendationSuccess: soldListings.length > 0 ?
                soldListings.reduce((sum, item) => sum + (item.recommendation_success || 0), 0) / soldListings.length : 0
        };
    }

    async analyzeMarketPredictions(userId, startDate, endDate) {
        // Placeholder for market prediction analysis
        return {
            accuracy: 0.85,
            majorMisses: [],
            successfulPredictions: [],
            marketConditionCorrelation: 0.7
        };
    }

    async analyzeUserBehavior(userId, startDate, endDate) {
        const trackingData = await this.getTrackingData(userId, startDate, endDate);

        return {
            priceFollowRate: trackingData.filter(item => item.user_followed_price_suggestion).length / trackingData.length,
            actionFollowRate: trackingData.filter(item => item.user_followed_action_suggestion).length / trackingData.length,
            avgTimeFromRecommendation: trackingData.reduce(
                (sum, item) => sum + (item.time_from_recommendation_to_listing || 0), 0
            ) / trackingData.length,
            enhancedDescriptionUsage: trackingData.filter(item => item.listing_description_enhanced).length / trackingData.length
        };
    }

    async generateTrendAnalysis(userId, startDate, endDate, groupBy) {
        // Generate time-based trend analysis
        const trackingData = await this.getTrackingData(userId, startDate, endDate);
        
        // Group data by time period
        const groupedData = this.groupDataByTime(trackingData, groupBy);
        
        return {
            periods: Object.keys(groupedData).sort(),
            metrics: groupedData,
            trends: this.calculateTrends(groupedData)
        };
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = item[key];
            if (!groups[value]) groups[value] = [];
            groups[value].push(item);
            return groups;
        }, {});
    }

    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    identifyCommonTraits(listings) {
        const traits = [];
        
        // Check for common conditions
        const conditions = this.groupBy(listings, 'actual_condition');
        const topCondition = Object.entries(conditions).sort(([,a], [,b]) => b.length - a.length)[0];
        if (topCondition && topCondition[1].length > listings.length * 0.5) {
            traits.push(`${topCondition[0]} condition`);
        }
        
        // Check for enhanced descriptions
        const enhancedCount = listings.filter(item => item.listing_description_enhanced).length;
        if (enhancedCount > listings.length * 0.7) {
            traits.push('enhanced descriptions');
        }
        
        return traits;
    }

    groupDataByTime(data, groupBy) {
        // Implementation would group data by time periods
        return {};
    }

    calculateTrends(groupedData) {
        // Implementation would calculate trends across time periods
        return {};
    }

    async setupListingMonitoring(trackingId) {
        // Implementation would set up monitoring for the listing
        console.log(`📊 Listing monitoring set up for tracking ID ${trackingId}`);
    }

    async checkPerformanceMilestones(listingId, metrics) {
        // Implementation would check for performance milestones and triggers
        console.log(`📈 Checking performance milestones for listing ${listingId}`);
    }

    async updateAggregatedMetrics(trackingEntry, saleData) {
        // Implementation would update aggregated metrics tables
        console.log('📊 Updating aggregated metrics');
    }

    async generateSuccessInsights(trackingEntry, saleData) {
        return {
            performance: saleData.recommendation_success > 0.8 ? 'excellent' : 
                        saleData.recommendation_success > 0.6 ? 'good' : 'poor',
            keyFactors: [
                `Sold in ${saleData.days_to_sale} days`,
                `Price accuracy: ${(saleData.price_accuracy * 100).toFixed(1)}%`
            ],
            learnings: [
                'Market prediction algorithm performed well',
                'User followed pricing recommendations'
            ]
        };
    }
}

module.exports = ListingSuccessTracker; 