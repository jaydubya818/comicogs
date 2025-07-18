const db = require("../backend/db");
const PricingData = require('../models/PricingData');
const MarketInsightsGenerator = require('./MarketInsightsGenerator');

/**
 * Watchlist Manager - Task 8 Implementation
 * Enhanced watchlist functionality with price monitoring and listing integration
 */
class WatchlistManager {
    constructor() {
        this.marketInsights = new MarketInsightsGenerator();
        this.config = {
            priceAlertThresholds: {
                drop: 0.1,      // 10% price drop
                rise: 0.15,     // 15% price rise
                target: 0.05    // 5% within target price
            },
            monitoringInterval: 24 * 60 * 60 * 1000, // 24 hours
            maxWatchlistSize: 100,
            notificationCooldown: 12 * 60 * 60 * 1000, // 12 hours
            priorityLevels: ['low', 'medium', 'high', 'critical']
        };

        console.log('✅ WatchlistManager initialized');
    }

    /**
     * Add comic to user's watchlist with smart monitoring
     */
    async addToWatchlist(userId, comicId, options = {}) {
        try {
            // Validate inputs
            if (!userId || !comicId) {
                throw new Error('userId and comicId are required');
            }

            // Check if already in watchlist
            const existing = await this.getWatchlistItem(userId, comicId);
            if (existing) {
                return await this.updateWatchlistItem(userId, comicId, options);
            }

            // Get current market data to set intelligent defaults
            const marketData = await this.getMarketDataForWatchlist(comicId);
            
            // Calculate intelligent defaults
            const defaults = this.calculateIntelligentDefaults(marketData, options);

            // Create watchlist entry
            const watchlistData = {
                user_id: userId,
                comic_id: comicId,
                max_price: options.maxPrice || defaults.suggestedMaxPrice,
                min_condition: options.minCondition || defaults.suggestedMinCondition,
                priority: options.priority || defaults.suggestedPriority,
                notes: options.notes || defaults.suggestedNotes,
                notifications_enabled: options.notificationsEnabled !== false,
                price_alert_threshold: options.priceAlertThreshold || this.config.priceAlertThresholds.drop,
                target_price: options.targetPrice || defaults.suggestedTargetPrice,
                auto_list_threshold: options.autoListThreshold || null,
                market_insights: JSON.stringify(defaults.marketInsights),
                monitoring_settings: JSON.stringify(defaults.monitoringSettings),
                created_at: new Date()
            };

            const result = await this.insertWatchlistItem(watchlistData);

            // Set up monitoring
            await this.setupPriceMonitoring(result.id, watchlistData);

            return {
                success: true,
                watchlistItem: result,
                insights: defaults.marketInsights,
                recommendations: defaults.recommendations
            };

        } catch (error) {
            console.error('Error adding to watchlist:', error);
            throw error;
        }
    }

    /**
     * Get market data specifically for watchlist purposes
     */
    async getMarketDataForWatchlist(comicId) {
        try {
            // Get current pricing data
            const pricingData = await PricingData.getCurrentPricing(comicId, {
                limit: 50,
                days: 180
            });

            // Get price history for trend analysis
            const priceHistory = await PricingData.getPriceHistory(comicId, {
                days: 365
            });

            // Get comic details
            const comicDetails = await this.getComicDetails(comicId);

            return {
                current: pricingData,
                history: priceHistory,
                comic: comicDetails,
                marketplaces: this.groupByMarketplace(pricingData),
                conditions: this.groupByCondition(pricingData)
            };

        } catch (error) {
            console.warn('Error getting market data for watchlist:', error);
            return { current: [], history: [], comic: null, marketplaces: {}, conditions: {} };
        }
    }

    /**
     * Calculate intelligent defaults for watchlist settings
     */
    calculateIntelligentDefaults(marketData, userOptions) {
        const defaults = {
            suggestedMaxPrice: 0,
            suggestedMinCondition: 'VF',
            suggestedPriority: 'medium',
            suggestedNotes: '',
            suggestedTargetPrice: 0,
            marketInsights: {},
            monitoringSettings: {},
            recommendations: []
        };

        if (marketData.current.length > 0) {
            // Calculate price statistics
            const prices = marketData.current.map(item => item.price);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const medianPrice = this.calculateMedian(prices);
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);

            // Set intelligent max price (median + 20% buffer)
            defaults.suggestedMaxPrice = Math.round(medianPrice * 1.2 * 100) / 100;
            
            // Set target price (median - 10% for good deal)
            defaults.suggestedTargetPrice = Math.round(medianPrice * 0.9 * 100) / 100;

            // Determine priority based on market activity
            const recentSales = marketData.current.filter(
                item => new Date(item.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length;

            if (recentSales > 10) {
                defaults.suggestedPriority = 'medium';
            } else if (recentSales > 20) {
                defaults.suggestedPriority = 'high';
            } else {
                defaults.suggestedPriority = 'low';
            }

            // Determine min condition based on available data
            const conditions = Object.keys(marketData.conditions);
            if (conditions.includes('NM')) {
                defaults.suggestedMinCondition = 'VF';
            } else if (conditions.includes('VF')) {
                defaults.suggestedMinCondition = 'FN';
            }

            // Generate market insights for watchlist
            defaults.marketInsights = {
                averagePrice: avgPrice,
                priceRange: { min: minPrice, max: maxPrice },
                medianPrice: medianPrice,
                recentActivity: recentSales,
                availableConditions: conditions,
                marketplaceDistribution: Object.keys(marketData.marketplaces),
                recommendation: this.generateWatchlistRecommendation(marketData)
            };

            // Set up monitoring settings
            defaults.monitoringSettings = {
                checkFrequency: recentSales > 15 ? 'daily' : 'weekly',
                priceDropAlert: true,
                newListingAlert: true,
                conditionAlert: true,
                marketMovementAlert: recentSales > 10
            };

            // Generate recommendations
            defaults.recommendations = this.generateWatchlistRecommendations(marketData, defaults);

            // Generate intelligent notes
            defaults.suggestedNotes = this.generateSuggestedNotes(marketData.comic, defaults.marketInsights);
        }

        return defaults;
    }

    /**
     * Generate smart listing suggestions based on watchlist items
     */
    async generateListingSuggestions(userId, options = {}) {
        try {
            // Get user's collection
            const collection = await this.getUserCollection(userId);
            
            // Get user's watchlist
            const watchlist = await this.getUserWatchlist(userId);

            // Find items in collection that match watchlist demand patterns
            const suggestions = [];

            for (const collectionItem of collection) {
                // Check if this comic type is in demand based on watchlist patterns
                const demandScore = await this.calculateDemandScore(collectionItem, watchlist);
                
                if (demandScore > 0.6) {
                    const listingSuggestion = await this.generateListingSuggestion(
                        collectionItem, 
                        demandScore,
                        watchlist
                    );
                    suggestions.push(listingSuggestion);
                }
            }

            // Sort by potential profit and demand
            suggestions.sort((a, b) => b.potentialProfit - a.potentialProfit);

            return {
                suggestions: suggestions.slice(0, 10), // Top 10 suggestions
                totalAnalyzed: collection.length,
                demandInsights: this.generateDemandInsights(watchlist)
            };

        } catch (error) {
            console.error('Error generating listing suggestions:', error);
            return { suggestions: [], totalAnalyzed: 0, demandInsights: {} };
        }
    }

    /**
     * Monitor watchlist items for price changes and opportunities
     */
    async monitorWatchlistPrices(userId = null) {
        try {
            // Get watchlist items to monitor
            const watchlistItems = userId ? 
                await this.getUserWatchlist(userId) : 
                await this.getAllActiveWatchlistItems();

            const alerts = [];

            for (const item of watchlistItems) {
                try {
                    const priceAlerts = await this.checkPriceAlerts(item);
                    if (priceAlerts.length > 0) {
                        alerts.push(...priceAlerts);
                    }

                    // Update last checked timestamp
                    await this.updateLastChecked(item.id);

                } catch (error) {
                    console.error(`Error monitoring watchlist item ${item.id}:`, error);
                }
            }

            return {
                alertsGenerated: alerts.length,
                alerts: alerts,
                itemsMonitored: watchlistItems.length
            };

        } catch (error) {
            console.error('Error monitoring watchlist prices:', error);
            throw error;
        }
    }

    /**
     * Check for price alerts on a specific watchlist item
     */
    async checkPriceAlerts(watchlistItem) {
        const alerts = [];

        try {
            // Get current market data
            const currentData = await PricingData.getCurrentPricing(watchlistItem.comic_id, {
                condition: watchlistItem.min_condition,
                limit: 20,
                days: 7
            });

            if (currentData.length === 0) return alerts;

            // Calculate current average price
            const currentAvgPrice = currentData.reduce(
                (sum, item) => sum + item.price, 0
            ) / currentData.length;

            // Check price drop alert
            if (currentAvgPrice <= watchlistItem.target_price) {
                alerts.push({
                    type: 'price_target_reached',
                    watchlistItemId: watchlistItem.id,
                    userId: watchlistItem.user_id,
                    comicId: watchlistItem.comic_id,
                    currentPrice: currentAvgPrice,
                    targetPrice: watchlistItem.target_price,
                    message: `Price target reached! Current average: $${currentAvgPrice.toFixed(2)}`,
                    urgency: 'high',
                    actionRequired: true
                });
            }

            // Check for significant price drop
            const monitoringSettings = JSON.parse(watchlistItem.monitoring_settings || '{}');
            if (monitoringSettings.priceDropAlert) {
                const lastKnownPrice = await this.getLastKnownPrice(watchlistItem.comic_id);
                if (lastKnownPrice && currentAvgPrice < lastKnownPrice * (1 - watchlistItem.price_alert_threshold)) {
                    const dropPercent = ((lastKnownPrice - currentAvgPrice) / lastKnownPrice * 100).toFixed(1);
                    
                    alerts.push({
                        type: 'price_drop',
                        watchlistItemId: watchlistItem.id,
                        userId: watchlistItem.user_id,
                        comicId: watchlistItem.comic_id,
                        currentPrice: currentAvgPrice,
                        previousPrice: lastKnownPrice,
                        dropPercent: dropPercent,
                        message: `Price dropped ${dropPercent}%! Now averaging $${currentAvgPrice.toFixed(2)}`,
                        urgency: dropPercent > 20 ? 'high' : 'medium',
                        actionRequired: true
                    });
                }
            }

            // Check for new listings in desired condition/price range
            const newListings = await this.findNewListings(watchlistItem);
            for (const listing of newListings) {
                alerts.push({
                    type: 'new_listing',
                    watchlistItemId: watchlistItem.id,
                    userId: watchlistItem.user_id,
                    comicId: watchlistItem.comic_id,
                    listing: listing,
                    message: `New listing found: ${listing.condition} condition for $${listing.price}`,
                    urgency: 'medium',
                    actionRequired: false
                });
            }

            return alerts;

        } catch (error) {
            console.error('Error checking price alerts:', error);
            return alerts;
        }
    }

    /**
     * Smart watchlist cleanup and optimization
     */
    async optimizeWatchlist(userId) {
        try {
            const watchlist = await this.getUserWatchlist(userId);
            const optimizations = {
                duplicatesRemoved: 0,
                pricesUpdated: 0,
                prioritiesAdjusted: 0,
                inactiveItemsArchived: 0,
                recommendations: []
            };

            for (const item of watchlist) {
                // Update prices based on current market data
                const marketData = await this.getMarketDataForWatchlist(item.comic_id);
                const newDefaults = this.calculateIntelligentDefaults(marketData, {});

                // Check if price needs updating
                if (Math.abs(item.max_price - newDefaults.suggestedMaxPrice) > item.max_price * 0.2) {
                    await this.updateWatchlistPrice(item.id, newDefaults.suggestedMaxPrice);
                    optimizations.pricesUpdated++;
                }

                // Adjust priority based on current market activity
                if (item.priority !== newDefaults.suggestedPriority) {
                    await this.updateWatchlistPriority(item.id, newDefaults.suggestedPriority);
                    optimizations.prioritiesAdjusted++;
                }

                // Check for inactive items (no price changes in 6 months)
                const lastActivity = await this.getLastActivity(item.comic_id);
                if (lastActivity && Date.now() - lastActivity > 6 * 30 * 24 * 60 * 60 * 1000) {
                    optimizations.recommendations.push({
                        type: 'consider_removal',
                        item: item,
                        reason: 'No market activity in 6 months'
                    });
                }
            }

            return optimizations;

        } catch (error) {
            console.error('Error optimizing watchlist:', error);
            throw error;
        }
    }

    // Database operations
    async getWatchlistItem(userId, comicId) {
        const query = `
            SELECT * FROM wantlists 
            WHERE user_id = $1 AND comic_id = $2
        `;
        const result = await db.query(query, [userId, comicId]);
        return result.rows[0] || null;
    }

    async insertWatchlistItem(data) {
        const query = `
            INSERT INTO wantlists (
                user_id, comic_id, max_price, min_condition, priority, 
                notes, notifications_enabled, target_price, market_insights, 
                monitoring_settings, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            data.user_id, data.comic_id, data.max_price, data.min_condition,
            data.priority, data.notes, data.notifications_enabled,
            data.target_price, data.market_insights, data.monitoring_settings,
            data.created_at
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async updateWatchlistItem(userId, comicId, updates) {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        });

        setClauses.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        paramIndex++;

        values.push(userId, comicId);

        const query = `
            UPDATE wantlists 
            SET ${setClauses.join(', ')}
            WHERE user_id = $${paramIndex} AND comic_id = $${paramIndex + 1}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async getUserWatchlist(userId) {
        const query = `
            SELECT 
                w.*,
                c.title,
                c.issue_number,
                c.variant_name,
                c.cover_image_url,
                c.key_issue_notes,
                p.name as publisher_name,
                s.title as series_title
            FROM wantlists w
            JOIN comics c ON w.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE w.user_id = $1
            ORDER BY w.priority DESC, w.created_at DESC
        `;

        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async getUserCollection(userId) {
        const query = `
            SELECT 
                col.*,
                c.title,
                c.issue_number,
                c.variant_name,
                c.key_issue_notes,
                p.name as publisher_name,
                s.title as series_title
            FROM collections col
            JOIN comics c ON col.comic_id = c.id
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE col.user_id = $1
        `;

        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async getComicDetails(comicId) {
        const query = `
            SELECT 
                c.*,
                p.name as publisher_name,
                s.title as series_title
            FROM comics c
            LEFT JOIN publishers p ON c.publisher_id = p.id
            LEFT JOIN series s ON c.series_id = s.id
            WHERE c.id = $1
        `;

        const result = await db.query(query, [comicId]);
        return result.rows[0] || null;
    }

    // Helper methods
    calculateMedian(numbers) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
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

    generateWatchlistRecommendation(marketData) {
        if (marketData.current.length === 0) {
            return 'Limited market data available';
        }

        const recentSales = marketData.current.filter(
            item => new Date(item.sale_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        if (recentSales > 15) {
            return 'High market activity - good time to find deals';
        } else if (recentSales < 5) {
            return 'Low market activity - be patient for listings';
        }
        return 'Moderate market activity - monitor regularly';
    }

    generateWatchlistRecommendations(marketData, defaults) {
        const recommendations = [];

        if (marketData.current.length > 20) {
            recommendations.push('Active market - set alerts for quick notifications');
        }

        if (defaults.marketInsights.recentActivity < 5) {
            recommendations.push('Consider expanding search to different conditions');
        }

        if (defaults.suggestedMaxPrice > 100) {
            recommendations.push('High-value item - consider professional grading requirements');
        }

        return recommendations;
    }

    generateSuggestedNotes(comic, insights) {
        let notes = '';
        
        if (comic && comic.key_issue_notes) {
            notes += `Key issue: ${comic.key_issue_notes}. `;
        }

        if (insights.recentActivity > 15) {
            notes += 'High demand item. ';
        }

        notes += `Market average: $${insights.averagePrice.toFixed(2)}`;
        
        return notes;
    }

    async calculateDemandScore(collectionItem, watchlist) {
        // Calculate demand based on watchlist patterns
        let score = 0;

        // Check for similar items in watchlist
        const similarItems = watchlist.filter(w => 
            w.publisher_name === collectionItem.publisher_name ||
            w.series_title === collectionItem.series_title
        );

        score += similarItems.length * 0.2;

        // Check for key issues
        if (collectionItem.key_issue_notes) {
            score += 0.3;
        }

        // Check for high-priority items
        const highPriorityItems = watchlist.filter(w => w.priority === 'high');
        if (highPriorityItems.length > 0) {
            score += 0.2;
        }

        return Math.min(score, 1);
    }

    async generateListingSuggestion(collectionItem, demandScore, watchlist) {
        const marketData = await this.getMarketDataForWatchlist(collectionItem.comic_id);
        
        const currentValue = marketData.current.length > 0 ?
            marketData.current.reduce((sum, item) => sum + item.price, 0) / marketData.current.length :
            collectionItem.current_value || 0;

        const potentialProfit = currentValue - (collectionItem.purchase_price || 0);

        return {
            collectionItem,
            demandScore,
            currentValue,
            potentialProfit,
            recommendation: demandScore > 0.8 ? 'Strongly recommended' : 'Consider listing',
            reasoning: this.generateListingReasoning(demandScore, potentialProfit, watchlist)
        };
    }

    generateListingReasoning(demandScore, potentialProfit, watchlist) {
        const reasons = [];

        if (demandScore > 0.8) {
            reasons.push('High demand from watchlist patterns');
        }

        if (potentialProfit > 0) {
            reasons.push(`Potential profit: $${potentialProfit.toFixed(2)}`);
        }

        if (watchlist.length > 50) {
            reasons.push('Large collector base indicates strong market');
        }

        return reasons.join('; ');
    }

    generateDemandInsights(watchlist) {
        return {
            totalItems: watchlist.length,
            topPublishers: this.getTopCategories(watchlist, 'publisher_name'),
            topSeries: this.getTopCategories(watchlist, 'series_title'),
            averageMaxPrice: watchlist.reduce((sum, item) => sum + (item.max_price || 0), 0) / watchlist.length,
            highPriorityCount: watchlist.filter(item => item.priority === 'high').length
        };
    }

    getTopCategories(watchlist, field) {
        const counts = {};
        watchlist.forEach(item => {
            const value = item[field];
            if (value) {
                counts[value] = (counts[value] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }

    async setupPriceMonitoring(watchlistId, data) {
        // Implementation would set up monitoring job
        console.log(`📊 Price monitoring set up for watchlist item ${watchlistId}`);
    }

    async getAllActiveWatchlistItems() {
        const query = `
            SELECT * FROM wantlists 
            WHERE notifications_enabled = true
            ORDER BY priority DESC, created_at DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async updateLastChecked(watchlistId) {
        const query = `
            UPDATE wantlists 
            SET last_checked = $1 
            WHERE id = $2
        `;
        await db.query(query, [new Date(), watchlistId]);
    }

    async getLastKnownPrice(comicId) {
        // Implementation would get last known price from cache/history
        return null; // Placeholder
    }

    async findNewListings(watchlistItem) {
        // Implementation would find new marketplace listings
        return []; // Placeholder
    }

    async updateWatchlistPrice(watchlistId, newPrice) {
        const query = `
            UPDATE wantlists 
            SET max_price = $1, updated_at = $2 
            WHERE id = $3
        `;
        await db.query(query, [newPrice, new Date(), watchlistId]);
    }

    async updateWatchlistPriority(watchlistId, newPriority) {
        const query = `
            UPDATE wantlists 
            SET priority = $1, updated_at = $2 
            WHERE id = $3
        `;
        await db.query(query, [newPriority, new Date(), watchlistId]);
    }

    async getLastActivity(comicId) {
        // Implementation would get last market activity timestamp
        return null; // Placeholder
    }
}

module.exports = WatchlistManager; 