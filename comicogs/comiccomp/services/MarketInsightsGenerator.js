const PricingData = require('../models/PricingData');

/**
 * Market Insights Generator - Task 8 Implementation
 * Generates intelligent market analysis and listing descriptions
 */
class MarketInsightsGenerator {
    constructor() {
        this.config = {
            minDataPoints: 5,
            trendAnalysisDays: 90,
            seasonalityLookback: 365,
            confidenceThresholds: {
                high: 0.8,
                medium: 0.6,
                low: 0.4
            },
            priceMovementThreshold: 0.1, // 10% price movement
            volumeThresholds: {
                high: 20,
                medium: 10,
                low: 5
            }
        };

        this.insightTemplates = {
            priceMovement: {
                up: "📈 Price has increased {percent}% in the last {period}",
                down: "📉 Price has decreased {percent}% in the last {period}",
                stable: "💹 Price has remained stable over the last {period}"
            },
            volume: {
                high: "🔥 High trading volume - {sales} sales in the last {period}",
                medium: "📊 Moderate trading activity - {sales} sales in the last {period}",
                low: "💎 Rare trading opportunity - only {sales} sales in the last {period}"
            },
            market: {
                strong: "💪 Strong collector demand for this issue",
                emerging: "🌟 Emerging market interest",
                niche: "🎯 Niche collector item with dedicated following"
            },
            timing: {
                good: "⏰ Good timing for listing based on market conditions",
                average: "📅 Average market timing for this type of issue",
                poor: "⚠️ Consider waiting for better market conditions"
            }
        };

        console.log('✅ MarketInsightsGenerator initialized');
    }

    /**
     * Generate comprehensive market insights for a comic
     */
    async generateInsights(comicId, pricingData, options = {}) {
        try {
            const insights = {
                summary: await this.generateMarketSummary(comicId, pricingData),
                trends: await this.analyzePriceTrends(pricingData),
                volume: await this.analyzeVolume(pricingData),
                competition: await this.analyzeCompetition(comicId, pricingData),
                seasonality: await this.analyzeSeasonality(comicId, pricingData),
                recommendations: await this.generateRecommendations(comicId, pricingData),
                keyInsights: [],
                confidence: 0
            };

            // Generate key insights narrative
            insights.keyInsights = await this.generateKeyInsights(insights);
            
            // Calculate overall confidence
            insights.confidence = this.calculateOverallConfidence(insights, pricingData);

            return insights;

        } catch (error) {
            console.error('Error generating market insights:', error);
            return this.getDefaultInsights();
        }
    }

    /**
     * Generate market summary
     */
    async generateMarketSummary(comicId, pricingData) {
        const summary = {
            totalSales: pricingData.current.length,
            averagePrice: 0,
            priceRange: { min: 0, max: 0 },
            marketplaceDistribution: {},
            conditionDistribution: {},
            timeRange: this.getTimeRange(pricingData.current)
        };

        if (pricingData.current.length > 0) {
            const prices = pricingData.current.map(item => item.price);
            summary.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            summary.priceRange.min = Math.min(...prices);
            summary.priceRange.max = Math.max(...prices);

            // Marketplace distribution
            summary.marketplaceDistribution = this.calculateDistribution(
                pricingData.current, 
                'marketplace'
            );

            // Condition distribution
            summary.conditionDistribution = this.calculateDistribution(
                pricingData.current, 
                'condition'
            );
        }

        return summary;
    }

    /**
     * Analyze price trends
     */
    async analyzePriceTrends(pricingData) {
        const trends = {
            direction: 'stable',
            strength: 0,
            changePercent: 0,
            period: '90 days',
            confidence: 0,
            description: '',
            timeSeriesData: []
        };

        if (pricingData.history && pricingData.history.length > 1) {
            const sortedHistory = pricingData.history.sort(
                (a, b) => new Date(a.date_period) - new Date(b.date_period)
            );

            // Calculate trend over the period
            const recentData = sortedHistory.slice(-this.config.trendAnalysisDays);
            if (recentData.length >= 2) {
                const firstPrice = recentData[0].avg_price;
                const lastPrice = recentData[recentData.length - 1].avg_price;
                
                trends.changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
                
                if (Math.abs(trends.changePercent) > this.config.priceMovementThreshold * 100) {
                    trends.direction = trends.changePercent > 0 ? 'up' : 'down';
                    trends.strength = Math.min(Math.abs(trends.changePercent) / 20, 1); // Normalize to 0-1
                }

                trends.confidence = Math.min(recentData.length / 30, 1); // More data = higher confidence
                trends.description = this.generateTrendDescription(trends);
                trends.timeSeriesData = recentData.map(item => ({
                    date: item.date_period,
                    price: item.avg_price,
                    volume: item.sale_count
                }));
            }
        }

        return trends;
    }

    /**
     * Analyze trading volume
     */
    async analyzeVolume(pricingData) {
        const volume = {
            level: 'medium',
            recent30Days: 0,
            recent90Days: 0,
            yearOverYear: 0,
            description: '',
            liquidityScore: 0.5
        };

        if (pricingData.current.length > 0) {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

            volume.recent30Days = pricingData.current.filter(
                item => new Date(item.sale_date) > thirtyDaysAgo
            ).length;

            volume.recent90Days = pricingData.current.filter(
                item => new Date(item.sale_date) > ninetyDaysAgo
            ).length;

            // Determine volume level
            if (volume.recent30Days >= this.config.volumeThresholds.high) {
                volume.level = 'high';
                volume.liquidityScore = 0.8;
            } else if (volume.recent30Days >= this.config.volumeThresholds.medium) {
                volume.level = 'medium';
                volume.liquidityScore = 0.6;
            } else {
                volume.level = 'low';
                volume.liquidityScore = 0.3;
            }

            volume.description = this.generateVolumeDescription(volume);
        }

        return volume;
    }

    /**
     * Analyze competition
     */
    async analyzeCompetition(comicId, pricingData) {
        const competition = {
            activeListings: 0,
            averageListingPrice: 0,
            competitionLevel: 'medium',
            priceGaps: [],
            description: ''
        };

        try {
            // Get active listings count (would need marketplace API)
            // For now, estimate based on recent sales volume
            competition.activeListings = Math.max(
                Math.floor(pricingData.current.length * 0.3), 
                1
            );

            if (competition.activeListings > 15) {
                competition.competitionLevel = 'high';
            } else if (competition.activeListings < 5) {
                competition.competitionLevel = 'low';
            }

            // Estimate average listing price (typically 10-20% above sale price)
            if (pricingData.current.length > 0) {
                const avgSalePrice = pricingData.current.reduce(
                    (sum, item) => sum + item.price, 0
                ) / pricingData.current.length;
                
                competition.averageListingPrice = avgSalePrice * 1.15; // 15% markup estimate
            }

            competition.description = this.generateCompetitionDescription(competition);

        } catch (error) {
            console.error('Error analyzing competition:', error);
        }

        return competition;
    }

    /**
     * Analyze seasonality patterns
     */
    async analyzeSeasonality(comicId, pricingData) {
        const seasonality = {
            currentSeason: this.getCurrentSeason(),
            seasonalTrends: {},
            isOptimalTiming: false,
            description: ''
        };

        if (pricingData.history && pricingData.history.length >= 12) {
            // Group sales by month
            const monthlyData = this.groupDataByMonth(pricingData.history);
            
            // Calculate seasonal patterns
            seasonality.seasonalTrends = this.calculateSeasonalTrends(monthlyData);
            
            // Determine if current timing is optimal
            const currentMonth = new Date().getMonth();
            const currentSeasonData = seasonality.seasonalTrends[currentMonth];
            
            if (currentSeasonData && currentSeasonData.priceMultiplier > 1.05) {
                seasonality.isOptimalTiming = true;
            }

            seasonality.description = this.generateSeasonalityDescription(seasonality);
        }

        return seasonality;
    }

    /**
     * Generate listing recommendations
     */
    async generateRecommendations(comicId, pricingData) {
        const recommendations = {
            listingStrategy: 'market_price',
            optimalPrice: 0,
            timing: 'neutral',
            keySellingPoints: [],
            warnings: [],
            actionItems: []
        };

        try {
            const trends = await this.analyzePriceTrends(pricingData);
            const volume = await this.analyzeVolume(pricingData);
            const competition = await this.analyzeCompetition(comicId, pricingData);

            // Determine listing strategy
            if (trends.direction === 'up' && volume.level === 'high') {
                recommendations.listingStrategy = 'premium_price';
                recommendations.timing = 'good';
            } else if (competition.competitionLevel === 'high') {
                recommendations.listingStrategy = 'competitive_price';
            } else if (volume.level === 'low') {
                recommendations.listingStrategy = 'patience_required';
                recommendations.warnings.push('Low trading volume - may take longer to sell');
            }

            // Calculate optimal price
            if (pricingData.current.length > 0) {
                const avgPrice = pricingData.current.reduce(
                    (sum, item) => sum + item.price, 0
                ) / pricingData.current.length;

                switch (recommendations.listingStrategy) {
                    case 'premium_price':
                        recommendations.optimalPrice = avgPrice * 1.15;
                        break;
                    case 'competitive_price':
                        recommendations.optimalPrice = avgPrice * 0.95;
                        break;
                    default:
                        recommendations.optimalPrice = avgPrice * 1.05;
                }
            }

            // Generate selling points
            recommendations.keySellingPoints = this.generateSellingPoints(
                pricingData, trends, volume
            );

            // Generate action items
            recommendations.actionItems = this.generateActionItems(
                recommendations, trends, volume, competition
            );

        } catch (error) {
            console.error('Error generating recommendations:', error);
        }

        return recommendations;
    }

    /**
     * Generate key insights narrative
     */
    async generateKeyInsights(insights) {
        const keyInsights = [];

        // Price trend insights
        if (insights.trends.direction !== 'stable') {
            keyInsights.push(
                this.insightTemplates.priceMovement[insights.trends.direction]
                    .replace('{percent}', Math.abs(insights.trends.changePercent).toFixed(1))
                    .replace('{period}', insights.trends.period)
            );
        }

        // Volume insights
        keyInsights.push(
            this.insightTemplates.volume[insights.volume.level]
                .replace('{sales}', insights.volume.recent30Days)
                .replace('{period}', '30 days')
        );

        // Market strength insights
        if (insights.volume.level === 'high' && insights.trends.direction === 'up') {
            keyInsights.push(this.insightTemplates.market.strong);
        } else if (insights.trends.strength > 0.5) {
            keyInsights.push(this.insightTemplates.market.emerging);
        } else if (insights.volume.level === 'low') {
            keyInsights.push(this.insightTemplates.market.niche);
        }

        // Timing insights
        if (insights.seasonality.isOptimalTiming) {
            keyInsights.push(this.insightTemplates.timing.good);
        } else if (insights.competition.competitionLevel === 'high') {
            keyInsights.push(this.insightTemplates.timing.poor);
        } else {
            keyInsights.push(this.insightTemplates.timing.average);
        }

        return keyInsights;
    }

    /**
     * Generate enhanced listing description
     */
    generateEnhancedDescription(baseDescription, insights, comicData) {
        let enhanced = baseDescription || '';

        // Add market insights section
        if (insights.keyInsights.length > 0) {
            enhanced += '\n\n📊 Market Analysis:\n';
            insights.keyInsights.forEach(insight => {
                enhanced += `• ${insight}\n`;
            });
        }

        // Add key selling points
        if (insights.recommendations.keySellingPoints.length > 0) {
            enhanced += '\n🔥 Key Selling Points:\n';
            insights.recommendations.keySellingPoints.forEach(point => {
                enhanced += `• ${point}\n`;
            });
        }

        // Add timing information
        if (insights.seasonality.isOptimalTiming) {
            enhanced += '\n⏰ Optimal listing timing based on seasonal market analysis\n';
        }

        // Add trust signals
        enhanced += '\n💯 Professional seller with detailed market analysis backing\n';
        enhanced += '📈 Price based on comprehensive market data from multiple sources\n';

        return enhanced;
    }

    // Helper methods
    calculateOverallConfidence(insights, pricingData) {
        let confidence = 0;
        let factors = 0;

        // Data volume confidence
        if (pricingData.current.length >= 20) {
            confidence += 0.3;
        } else if (pricingData.current.length >= 10) {
            confidence += 0.2;
        } else {
            confidence += 0.1;
        }
        factors++;

        // Trend confidence
        confidence += insights.trends.confidence * 0.3;
        factors++;

        // Volume confidence
        if (insights.volume.level === 'high') {
            confidence += 0.3;
        } else if (insights.volume.level === 'medium') {
            confidence += 0.2;
        } else {
            confidence += 0.1;
        }
        factors++;

        // Historical data confidence
        if (pricingData.history && pricingData.history.length >= 30) {
            confidence += 0.1;
        }
        factors++;

        return Math.min(confidence / factors, 1);
    }

    getDefaultInsights() {
        return {
            summary: {
                totalSales: 0,
                averagePrice: 0,
                priceRange: { min: 0, max: 0 },
                marketplaceDistribution: {},
                conditionDistribution: {},
                timeRange: { start: null, end: null }
            },
            trends: {
                direction: 'stable',
                strength: 0,
                changePercent: 0,
                period: '90 days',
                confidence: 0,
                description: 'Insufficient data for trend analysis'
            },
            volume: {
                level: 'low',
                recent30Days: 0,
                recent90Days: 0,
                description: 'Limited trading data available'
            },
            competition: {
                activeListings: 0,
                competitionLevel: 'unknown',
                description: 'Competition analysis unavailable'
            },
            seasonality: {
                currentSeason: this.getCurrentSeason(),
                isOptimalTiming: false,
                description: 'Seasonal analysis requires more historical data'
            },
            recommendations: {
                listingStrategy: 'market_price',
                optimalPrice: 0,
                timing: 'neutral',
                keySellingPoints: [],
                warnings: ['Limited market data available'],
                actionItems: ['Gather more market data', 'Consider professional grading']
            },
            keyInsights: ['Market analysis in progress'],
            confidence: 0.2
        };
    }

    calculateDistribution(data, field) {
        const distribution = {};
        data.forEach(item => {
            const value = item[field] || 'unknown';
            distribution[value] = (distribution[value] || 0) + 1;
        });
        return distribution;
    }

    getTimeRange(salesData) {
        if (salesData.length === 0) {
            return { start: null, end: null };
        }

        const dates = salesData.map(item => new Date(item.sale_date));
        return {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    }

    generateTrendDescription(trends) {
        if (trends.direction === 'stable') {
            return 'Price has remained relatively stable';
        }
        
        const direction = trends.direction === 'up' ? 'increased' : 'decreased';
        const strength = trends.strength > 0.7 ? 'significantly' : 
                        trends.strength > 0.4 ? 'moderately' : 'slightly';
        
        return `Price has ${strength} ${direction} by ${Math.abs(trends.changePercent).toFixed(1)}%`;
    }

    generateVolumeDescription(volume) {
        const descriptions = {
            high: `Strong market activity with ${volume.recent30Days} sales in the last 30 days`,
            medium: `Moderate trading activity with ${volume.recent30Days} sales in the last 30 days`,
            low: `Limited trading activity with only ${volume.recent30Days} sales in the last 30 days`
        };
        
        return descriptions[volume.level];
    }

    generateCompetitionDescription(competition) {
        const levels = {
            high: 'High competition with many similar items listed',
            medium: 'Moderate competition in the marketplace',
            low: 'Limited competition - good opportunity for sellers'
        };
        
        return levels[competition.competitionLevel];
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    groupDataByMonth(historyData) {
        const monthlyData = {};
        
        historyData.forEach(item => {
            const month = new Date(item.date_period).getMonth();
            if (!monthlyData[month]) {
                monthlyData[month] = { sales: [], totalValue: 0, count: 0 };
            }
            monthlyData[month].sales.push(item.avg_price);
            monthlyData[month].totalValue += item.avg_price;
            monthlyData[month].count++;
        });

        return monthlyData;
    }

    calculateSeasonalTrends(monthlyData) {
        const trends = {};
        const overallAverage = Object.values(monthlyData).reduce(
            (sum, month) => sum + month.totalValue / month.count, 0
        ) / Object.keys(monthlyData).length;

        Object.entries(monthlyData).forEach(([month, data]) => {
            const monthAverage = data.totalValue / data.count;
            trends[month] = {
                averagePrice: monthAverage,
                priceMultiplier: monthAverage / overallAverage,
                salesCount: data.count
            };
        });

        return trends;
    }

    generateSeasonalityDescription(seasonality) {
        if (seasonality.isOptimalTiming) {
            return `Current ${seasonality.currentSeason} season shows favorable pricing trends`;
        }
        return `Standard ${seasonality.currentSeason} market conditions`;
    }

    generateSellingPoints(pricingData, trends, volume) {
        const points = [];

        if (trends.direction === 'up') {
            points.push('📈 Rising market value trend');
        }

        if (volume.level === 'high') {
            points.push('🔥 High collector demand');
        }

        if (pricingData.current.length >= 20) {
            points.push('📊 Well-established market pricing');
        }

        if (trends.confidence > 0.7) {
            points.push('✅ High confidence market analysis');
        }

        return points;
    }

    generateActionItems(recommendations, trends, volume, competition) {
        const actions = [];

        if (recommendations.timing === 'good') {
            actions.push('List immediately to capitalize on favorable conditions');
        }

        if (competition.competitionLevel === 'high') {
            actions.push('Price competitively to stand out from competition');
        }

        if (volume.level === 'low') {
            actions.push('Be patient - may take longer to sell in low-volume market');
        }

        if (trends.direction === 'up') {
            actions.push('Consider slight premium pricing due to upward trend');
        }

        return actions;
    }
}

module.exports = MarketInsightsGenerator; 