const db = require("../backend/db");
const PricingData = require('../models/PricingData');
const RecommendationEngine = require('./RecommendationEngine');
const PriceNormalizationEngine = require('./PriceNormalizationEngine');

/**
 * Enhanced Listing Service - Task 8 Implementation
 * Integrates pricing insights with Comicogs listing functionality
 */
class EnhancedListingService {
    constructor() {
        this.recommendationEngine = new RecommendationEngine();
        this.priceNormalizationEngine = new PriceNormalizationEngine();
        this.config = {
            priceTolerancePercent: 5, // Allow 5% variance in price suggestions
            marketInsightsEnabled: true,
            watchlistIntegrationEnabled: true,
            successTrackingEnabled: true,
            minConfidenceScore: 0.6
        };
        
        console.log('✅ EnhancedListingService initialized');
    }

    /**
     * Generate smart listing recommendations for a comic in user's collection
     */
    async generateListingRecommendation(userId, collectionId, options = {}) {
        try {
            // Get collection item details
            const collectionItem = await this.getCollectionItem(userId, collectionId);
            if (!collectionItem) {
                throw new Error('Collection item not found');
            }

            // Get current pricing data
            const pricingData = await this.getCurrentPricingData(collectionItem.comic_id, {
                condition: collectionItem.condition,
                variant: collectionItem.variant_name
            });

            // Get recommendation from engine
            const recommendation = await this.recommendationEngine.getRecommendation(
                collectionItem.comic_id,
                { userContext: { userId, collectionId } }
            );

            // Calculate suggested price
            const priceAnalysis = await this.calculateSuggestedPrice(pricingData, collectionItem);

            // Generate market insights
            const marketInsights = await this.generateMarketInsights(
                collectionItem.comic_id,
                pricingData,
                recommendation
            );

            // Check current market conditions
            const marketConditions = await this.analyzeMarketConditions(
                collectionItem.comic_id,
                pricingData
            );

            return {
                collectionItem,
                recommendation: {
                    action: recommendation.action, // 'LIST_NOW', 'HOLD', 'GRADE', 'MONITOR'
                    confidence: recommendation.confidence,
                    reasoning: recommendation.reasoning,
                    urgency: recommendation.urgency
                },
                priceAnalysis,
                marketInsights,
                marketConditions,
                listingTemplate: await this.generateListingTemplate(
                    collectionItem,
                    priceAnalysis,
                    marketInsights
                ),
                watchlistSuggestion: await this.generateWatchlistSuggestion(
                    collectionItem.comic_id,
                    pricingData
                )
            };

        } catch (error) {
            console.error('Error generating listing recommendation:', error);
            throw error;
        }
    }

    /**
     * Get collection item with comic details
     */
    async getCollectionItem(userId, collectionId) {
        const query = `
            SELECT 
                col.*,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.key_issue_notes,
                c.publication_date,
                c.creators,
                c.characters,
                p.name as publisher_name,
                s.title as series_title,
                s.genre
            FROM collections col
            JOIN comics c ON col.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE col.id = $1 AND col.user_id = $2
        `;

        const result = await db.query(query, [collectionId, userId]);
        return result.rows[0] || null;
    }

    /**
     * Get current pricing data for a comic
     */
    async getCurrentPricingData(comicId, options = {}) {
        try {
            const pricingData = await PricingData.getCurrentPricing(comicId, {
                condition: options.condition,
                limit: 100,
                days: 90
            });

            // Get price history for trend analysis
            const priceHistory = await PricingData.getPriceHistory(comicId, {
                condition: options.condition,
                days: 365
            });

            return {
                current: pricingData,
                history: priceHistory,
                marketplaces: this.groupByMarketplace(pricingData),
                conditions: this.groupByCondition(pricingData)
            };

        } catch (error) {
            console.warn('Error getting pricing data:', error);
            return { current: [], history: [], marketplaces: {}, conditions: {} };
        }
    }

    /**
     * Calculate suggested listing price based on market data
     */
    async calculateSuggestedPrice(pricingData, collectionItem) {
        try {
            if (pricingData.current.length === 0) {
                return {
                    suggestedPrice: collectionItem.current_value || collectionItem.purchase_price || 0,
                    confidence: 0.3,
                    priceRange: { min: 0, max: 0 },
                    reasoning: 'No recent market data available',
                    dataPoints: 0
                };
            }

            // Normalize pricing data for this condition
            const normalizedData = await this.priceNormalizationEngine.normalizeComicPricing(
                `${collectionItem.title} ${collectionItem.issue_number}`,
                pricingData.current
            );

            if (!normalizedData.success) {
                return {
                    suggestedPrice: collectionItem.current_value || collectionItem.purchase_price || 0,
                    confidence: 0.4,
                    priceRange: { min: 0, max: 0 },
                    reasoning: 'Unable to normalize market data',
                    dataPoints: pricingData.current.length
                };
            }

            const stats = normalizedData.statistics;
            const trend = normalizedData.trends;

            // Calculate suggested price based on condition and market position
            let suggestedPrice = stats.median;
            
            // Adjust for market trend
            if (trend.direction === 'up' && trend.strength > 0.5) {
                suggestedPrice *= 1.05; // Price 5% above median if strong upward trend
            } else if (trend.direction === 'down' && trend.strength > 0.5) {
                suggestedPrice *= 0.95; // Price 5% below median if strong downward trend
            }

            // Adjust for listing strategy (competitive vs premium)
            const competitivePrice = stats.percentile25 + (stats.median - stats.percentile25) * 0.3;
            const premiumPrice = stats.median + (stats.percentile75 - stats.median) * 0.7;

            return {
                suggestedPrice: Math.round(suggestedPrice * 100) / 100,
                confidence: normalizedData.confidence,
                priceRange: {
                    min: Math.round(competitivePrice * 100) / 100,
                    max: Math.round(premiumPrice * 100) / 100
                },
                strategies: {
                    competitive: Math.round(competitivePrice * 100) / 100,
                    median: Math.round(stats.median * 100) / 100,
                    premium: Math.round(premiumPrice * 100) / 100
                },
                marketData: {
                    median: stats.median,
                    average: stats.average,
                    recentSales: stats.sampleSize,
                    trend: {
                        direction: trend.direction,
                        strength: trend.strength,
                        changePercent: trend.changePercent
                    }
                },
                reasoning: this.generatePriceReasoning(normalizedData, trend),
                dataPoints: pricingData.current.length
            };

        } catch (error) {
            console.error('Error calculating suggested price:', error);
            return {
                suggestedPrice: collectionItem.current_value || collectionItem.purchase_price || 0,
                confidence: 0.2,
                priceRange: { min: 0, max: 0 },
                reasoning: 'Error analyzing market data',
                dataPoints: 0
            };
        }
    }

    /**
     * Generate market insights for listing description
     */
    async generateMarketInsights(comicId, pricingData, recommendation) {
        const insights = [];

        try {
            // Sales volume insights
            if (pricingData.current.length > 0) {
                const monthlyVolume = pricingData.current.filter(
                    item => new Date(item.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length;

                if (monthlyVolume > 10) {
                    insights.push("High trading volume - popular issue with active market");
                } else if (monthlyVolume < 3) {
                    insights.push("Low trading volume - rare opportunity for collectors");
                }
            }

            // Price trend insights
            if (pricingData.history.length > 0) {
                const recentAvg = this.calculateRecentAverage(pricingData.history, 90);
                const yearAvg = this.calculateRecentAverage(pricingData.history, 365);
                
                if (recentAvg > yearAvg * 1.1) {
                    insights.push("📈 Price trending upward over past 3 months");
                } else if (recentAvg < yearAvg * 0.9) {
                    insights.push("📉 Price opportunity - below yearly average");
                }
            }

            // Recommendation insights
            if (recommendation) {
                switch (recommendation.action) {
                    case 'LIST_NOW':
                        insights.push("🔥 AI recommends listing now - optimal market conditions");
                        break;
                    case 'HOLD':
                        insights.push("💎 Consider holding - potential for future appreciation");
                        break;
                    case 'GRADE':
                        insights.push("⭐ Professional grading may significantly increase value");
                        break;
                }
            }

            // Market comparison insights
            const marketplaceCount = Object.keys(pricingData.marketplaces || {}).length;
            if (marketplaceCount > 1) {
                insights.push(`Available across ${marketplaceCount} marketplaces - good market exposure`);
            }

            return {
                insights,
                marketSummary: this.generateMarketSummary(pricingData),
                sellingPoints: this.generateSellingPoints(comicId, pricingData)
            };

        } catch (error) {
            console.error('Error generating market insights:', error);
            return {
                insights: ["Market data analysis in progress"],
                marketSummary: "Current market analysis unavailable",
                sellingPoints: []
            };
        }
    }

    /**
     * Analyze current market conditions
     */
    async analyzeMarketConditions(comicId, pricingData) {
        try {
            const conditions = {
                marketHealth: 'stable',
                demandLevel: 'moderate',
                liquidityScore: 0.5,
                competitionLevel: 'moderate',
                recommendedTiming: 'neutral',
                factors: []
            };

            // Analyze liquidity (how quickly items sell)
            const recentSales = pricingData.current.filter(
                item => new Date(item.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            );

            if (recentSales.length > 15) {
                conditions.liquidityScore = 0.8;
                conditions.demandLevel = 'high';
                conditions.factors.push('High recent sales volume indicates strong demand');
            } else if (recentSales.length < 5) {
                conditions.liquidityScore = 0.3;
                conditions.demandLevel = 'low';
                conditions.factors.push('Limited recent sales - may take longer to sell');
            }

            // Analyze price stability
            if (pricingData.history.length > 10) {
                const priceVariance = this.calculatePriceVariance(pricingData.history);
                if (priceVariance < 0.1) {
                    conditions.marketHealth = 'stable';
                    conditions.factors.push('Stable pricing with low volatility');
                } else if (priceVariance > 0.3) {
                    conditions.marketHealth = 'volatile';
                    conditions.factors.push('High price volatility - consider timing carefully');
                }
            }

            // Competition analysis
            const activeListings = await this.getActiveListingsCount(comicId);
            if (activeListings > 10) {
                conditions.competitionLevel = 'high';
                conditions.factors.push(`${activeListings} similar items currently listed`);
            } else if (activeListings < 3) {
                conditions.competitionLevel = 'low';
                conditions.factors.push('Limited competition - good listing opportunity');
            }

            return conditions;

        } catch (error) {
            console.error('Error analyzing market conditions:', error);
            return {
                marketHealth: 'unknown',
                demandLevel: 'unknown',
                liquidityScore: 0.5,
                competitionLevel: 'unknown',
                recommendedTiming: 'neutral',
                factors: ['Market analysis unavailable']
            };
        }
    }

    /**
     * Generate listing template with market insights
     */
    async generateListingTemplate(collectionItem, priceAnalysis, marketInsights) {
        const template = {
            title: this.generateListingTitle(collectionItem),
            description: this.generateListingDescription(collectionItem, marketInsights),
            price: priceAnalysis.suggestedPrice,
            condition: collectionItem.condition,
            tags: this.generateListingTags(collectionItem),
            shippingNotes: this.generateShippingNotes(collectionItem),
            images: this.generateImageGuidance(collectionItem)
        };

        return template;
    }

    /**
     * Generate watchlist suggestion for related comics
     */
    async generateWatchlistSuggestion(comicId, pricingData) {
        try {
            // Find related comics (same series, key issues, etc.)
            const relatedComics = await this.findRelatedComics(comicId);
            
            // Analyze which ones might be good watchlist additions
            const suggestions = [];
            
            for (const comic of relatedComics.slice(0, 5)) {
                const relatedPricing = await PricingData.getCurrentPricing(comic.id, { limit: 20 });
                if (relatedPricing.length > 0) {
                    const avgPrice = relatedPricing.reduce((sum, item) => sum + item.price, 0) / relatedPricing.length;
                    suggestions.push({
                        comic,
                        averagePrice: avgPrice,
                        reason: this.generateWatchlistReason(comic, pricingData)
                    });
                }
            }

            return {
                suggestions: suggestions.slice(0, 3),
                totalRelated: relatedComics.length
            };

        } catch (error) {
            console.error('Error generating watchlist suggestions:', error);
            return { suggestions: [], totalRelated: 0 };
        }
    }

    /**
     * Create enhanced marketplace listing with pricing insights
     */
    async createEnhancedListing(userId, collectionId, listingData, options = {}) {
        try {
            // Get listing recommendation first
            const recommendation = await this.generateListingRecommendation(userId, collectionId);
            
            // Validate listing data against recommendations
            const validation = this.validateListingData(listingData, recommendation);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors,
                    recommendations: validation.suggestions
                };
            }

            // Create the marketplace listing
            const listing = await this.createMarketplaceListing(userId, collectionId, {
                ...listingData,
                description: this.enhanceListingDescription(
                    listingData.description,
                    recommendation.marketInsights
                ),
                metadata: {
                    pricingConfidence: recommendation.priceAnalysis.confidence,
                    recommendationId: recommendation.recommendation.id,
                    createdWithAI: true,
                    marketConditions: recommendation.marketConditions
                }
            });

            // Track listing for success analytics
            if (this.config.successTrackingEnabled) {
                await this.trackListingCreation(listing.id, recommendation, options);
            }

            return {
                success: true,
                listing,
                recommendation,
                trackingId: listing.id
            };

        } catch (error) {
            console.error('Error creating enhanced listing:', error);
            throw error;
        }
    }

    /**
     * Track listing success for analytics
     */
    async trackListingCreation(listingId, recommendation, options) {
        try {
            const trackingData = {
                listing_id: listingId,
                recommendation_action: recommendation.recommendation.action,
                recommendation_confidence: recommendation.recommendation.confidence,
                suggested_price: recommendation.priceAnalysis.suggestedPrice,
                actual_price: options.actualPrice,
                market_conditions: JSON.stringify(recommendation.marketConditions),
                created_at: new Date(),
                user_followed_recommendation: this.didUserFollowRecommendation(recommendation, options)
            };

            // Store in tracking table (to be created)
            await this.storeListingTracking(trackingData);

        } catch (error) {
            console.warn('Error tracking listing creation:', error);
        }
    }

    // Helper methods
    generatePriceReasoning(normalizedData, trend) {
        const reasons = [];
        
        if (normalizedData.confidence > 0.8) {
            reasons.push("High confidence based on recent sales data");
        }
        
        if (trend.direction === 'up') {
            reasons.push(`Upward price trend (${trend.changePercent.toFixed(1)}% increase)`);
        } else if (trend.direction === 'down') {
            reasons.push(`Downward price trend (${Math.abs(trend.changePercent).toFixed(1)}% decrease)`);
        }
        
        return reasons.join('; ');
    }

    groupByMarketplace(pricingData) {
        return pricingData.reduce((acc, item) => {
            if (!acc[item.marketplace]) acc[item.marketplace] = [];
            acc[item.marketplace].push(item);
            return acc;
        }, {});
    }

    groupByCondition(pricingData) {
        return pricingData.reduce((acc, item) => {
            if (!acc[item.condition]) acc[item.condition] = [];
            acc[item.condition].push(item);
            return acc;
        }, {});
    }

    calculateRecentAverage(priceHistory, days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const recentPrices = priceHistory.filter(item => new Date(item.date_period) > cutoff);
        return recentPrices.reduce((sum, item) => sum + item.avg_price, 0) / recentPrices.length || 0;
    }

    calculatePriceVariance(priceHistory) {
        if (priceHistory.length < 2) return 0;
        const prices = priceHistory.map(item => item.avg_price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }

    generateListingTitle(collectionItem) {
        let title = `${collectionItem.title}`;
        if (collectionItem.issue_number) {
            title += ` #${collectionItem.issue_number}`;
        }
        if (collectionItem.variant_name) {
            title += ` (${collectionItem.variant_name})`;
        }
        title += ` - ${collectionItem.condition}`;
        
        if (collectionItem.key_issue_notes) {
            title += ` - ${collectionItem.key_issue_notes.split(',')[0]}`;
        }
        
        return title;
    }

    generateListingDescription(collectionItem, marketInsights) {
        let description = `${collectionItem.title}`;
        if (collectionItem.issue_number) {
            description += ` #${collectionItem.issue_number}`;
        }
        description += ` in ${collectionItem.condition} condition.\n\n`;

        if (collectionItem.key_issue_notes) {
            description += `🔥 Key Issue: ${collectionItem.key_issue_notes}\n\n`;
        }

        if (marketInsights.insights.length > 0) {
            description += "📊 Market Insights:\n";
            marketInsights.insights.forEach(insight => {
                description += `• ${insight}\n`;
            });
            description += "\n";
        }

        if (collectionItem.creators) {
            const creators = JSON.parse(collectionItem.creators);
            if (creators.length > 0) {
                description += `✨ Creators: ${creators.map(c => `${c.name} (${c.role})`).join(', ')}\n\n`;
            }
        }

        description += "💯 From a smoke-free, pet-free collection. Ships with care in protective packaging.\n";
        description += "📦 Same-day shipping for orders placed before 2 PM EST.\n";

        return description;
    }

    generateListingTags(collectionItem) {
        const tags = [collectionItem.condition];
        
        if (collectionItem.publisher_name) {
            tags.push(collectionItem.publisher_name);
        }
        
        if (collectionItem.genre) {
            tags.push(collectionItem.genre);
        }
        
        if (collectionItem.key_issue_notes) {
            tags.push('key issue');
        }
        
        if (collectionItem.characters) {
            const characters = JSON.parse(collectionItem.characters);
            tags.push(...characters.slice(0, 3));
        }
        
        return tags;
    }

    generateShippingNotes(collectionItem) {
        return "Carefully packaged in protective materials. Insurance available for high-value items.";
    }

    generateImageGuidance(collectionItem) {
        return {
            required: ["front cover", "back cover"],
            recommended: ["spine", "any defects"],
            tips: [
                "Use good lighting to show true condition",
                "Include close-ups of any defects",
                "Show key issue elements if applicable"
            ]
        };
    }

    async findRelatedComics(comicId) {
        const query = `
            SELECT c2.* FROM comics c1
            JOIN comics c2 ON (c1.series_id = c2.series_id OR c1.publisher_id = c2.publisher_id)
            WHERE c1.id = $1 AND c2.id != $1
            ORDER BY 
                CASE WHEN c1.series_id = c2.series_id THEN 1 ELSE 2 END,
                c2.publication_date
            LIMIT 20
        `;
        
        const result = await db.query(query, [comicId]);
        return result.rows;
    }

    generateWatchlistReason(comic, originalPricingData) {
        if (comic.key_issue_notes) {
            return "Key issue in same series";
        }
        return "Related to your listing";
    }

    validateListingData(listingData, recommendation) {
        const errors = [];
        const suggestions = [];

        if (Math.abs(listingData.price - recommendation.priceAnalysis.suggestedPrice) > 
            recommendation.priceAnalysis.suggestedPrice * 0.2) {
            suggestions.push(
                `Consider pricing closer to suggested $${recommendation.priceAnalysis.suggestedPrice}`
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            suggestions
        };
    }

    async createMarketplaceListing(userId, collectionId, listingData) {
        const query = `
            INSERT INTO marketplace_listings (
                seller_id, comic_id, collection_id, price, condition, 
                description, metadata, status
            ) 
            SELECT $1, col.comic_id, $2, $3, $4, $5, $6, 'active'
            FROM collections col 
            WHERE col.id = $2 AND col.user_id = $1
            RETURNING *
        `;

        const result = await db.query(query, [
            userId, collectionId, listingData.price, listingData.condition,
            listingData.description, JSON.stringify(listingData.metadata || {})
        ]);

        return result.rows[0];
    }

    enhanceListingDescription(originalDescription, marketInsights) {
        let enhanced = originalDescription || '';
        
        if (marketInsights.insights.length > 0) {
            enhanced += "\n\n📊 Market Analysis:\n";
            marketInsights.insights.forEach(insight => {
                enhanced += `• ${insight}\n`;
            });
        }

        return enhanced;
    }

    didUserFollowRecommendation(recommendation, options) {
        const priceMatch = Math.abs(options.actualPrice - recommendation.priceAnalysis.suggestedPrice) < 
                          recommendation.priceAnalysis.suggestedPrice * 0.1;
        
        const actionMatch = recommendation.recommendation.action === 'LIST_NOW';
        
        return priceMatch && actionMatch;
    }

    async storeListingTracking(trackingData) {
        // Implementation would store in a tracking table
        // For now, just log the data
        console.log('📊 Listing tracking data:', trackingData);
    }

    async getActiveListingsCount(comicId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM marketplace_listings ml
            JOIN comics c ON ml.comic_id = c.id
            WHERE c.id = $1 AND ml.status = 'active'
        `;
        
        const result = await db.query(query, [comicId]);
        return parseInt(result.rows[0].count);
    }

    generateMarketSummary(pricingData) {
        const totalListings = pricingData.current.length;
        const avgPrice = totalListings > 0 ? 
            pricingData.current.reduce((sum, item) => sum + item.price, 0) / totalListings : 0;

        return `${totalListings} recent sales, average $${avgPrice.toFixed(2)}`;
    }

    generateSellingPoints(comicId, pricingData) {
        const points = [];
        
        if (pricingData.current.length > 20) {
            points.push("Active market with strong demand");
        }
        
        if (pricingData.history.length > 0) {
            const recentAvg = this.calculateRecentAverage(pricingData.history, 90);
            const yearAvg = this.calculateRecentAverage(pricingData.history, 365);
            
            if (recentAvg > yearAvg * 1.05) {
                points.push("Price appreciation over past 3 months");
            }
        }
        
        return points;
    }
}

module.exports = EnhancedListingService; 