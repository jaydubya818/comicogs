

const VariantClassifier = require('./VariantClassifier');

/**
 * Enhanced Price Normalization Engine with sophisticated filtering and analysis
 */
class PriceNormalizationEngine {
    constructor(config = {}) {
        this.config = {
            outlierThreshold: config.outlierThreshold || 2.5,
            minDataPoints: config.minDataPoints || 3,
            gradingPremiums: config.gradingPremiums || this.getDefaultGradingPremiums(),
            marketplaceAdjustments: config.marketplaceAdjustments || this.getDefaultMarketplaceAdjustments(),
            conditionMultipliers: config.conditionMultipliers || this.getDefaultConditionMultipliers(),
            temporalDecay: 0.95,
            minSellerFeedbackScore: config.minSellerFeedbackScore || 100,
            minSellerPositiveFeedbackPercent: config.minSellerPositiveFeedbackPercent || 95,
            suspiciousPatterns: config.suspiciousPatterns || this.getDefaultSuspiciousPatterns(),
            confidenceFactors: config.confidenceFactors || this.getDefaultConfidenceFactors()
        };
        
        // Initialize variant classifier
        this.variantClassifier = new VariantClassifier();
    }

    /**
     * Main entry point for price normalization
     */
    async normalizePricingData(rawPricingData, options = {}) {
        try {
            console.log(`📊 Normalizing ${rawPricingData.length} pricing data points...`);

            // Step 1: Enhanced cleaning and validation
            const cleanedData = this.cleanPricingData(rawPricingData);

            // Step 2: Group by comic identifier
            const groupedData = this.groupPricingData(cleanedData);

            // Step 3: Process each group
            const normalizedResults = {};
            
            for (const [comicKey, listings] of Object.entries(groupedData)) {
                const result = await this.normalizeComicPricing(comicKey, listings, options);
                normalizedResults[comicKey] = result;
            }

            console.log(`✅ Normalized pricing for ${Object.keys(normalizedResults).length} comics`);
            return normalizedResults;

        } catch (error) {
            console.error('❌ Price normalization error:', error.message);
            throw error;
        }
    }

    /**
     * Enhanced data cleaning with sophisticated suspicious listing detection
     */
    cleanPricingData(rawData) {
        console.log(`🧹 Cleaning ${rawData.length} raw pricing data points...`);
        
        const cleanedData = rawData.filter(item => {
            // Basic validation
            const hasImage = item.imageUrl && item.imageUrl.length > 0;
            const hasValidSeller = this.validateSeller(item.seller);
            const isNotSuspicious = !this.detectSuspiciousListing(item);

            const isValid = item.price && 
                   item.price > 0 && 
                   item.title && 
                   item.marketplace &&
                   item.scrapedAt &&
                   hasImage &&
                   hasValidSeller &&
                   isNotSuspicious;

            if (!isValid && process.env.NODE_ENV !== 'production') {
                console.log(`❌ Filtered out: ${item.title} - ${this.getFilterReason(item)}`);
            }

            return isValid;
        }).map(item => ({
            ...item,
            price: parseFloat(item.price),
            scrapedAt: new Date(item.scrapedAt),
            grade: this.normalizeGrade(item.grade, item.gradingService),
            condition: this.normalizeCondition(item.condition),
            marketplace: item.marketplace.toLowerCase(),
            sale_type: item.sale_type || 'fixed',
            // Enhanced variant classification
            variantInfo: this.variantClassifier.classifyVariant(item.title, item.description, item.imageUrl)
        }));

        console.log(`✅ Cleaned data: ${cleanedData.length}/${rawData.length} listings passed validation`);
        return cleanedData;
    }

    /**
     * Enhanced seller validation
     */
    validateSeller(seller) {
        if (!seller) return false;
        
        const feedbackScore = seller.feedbackScore || 0;
        const positiveFeedbackPercent = seller.positiveFeedbackPercent || 0;
        
        // Check minimum thresholds
        if (feedbackScore < this.config.minSellerFeedbackScore ||
            positiveFeedbackPercent < this.config.minSellerPositiveFeedbackPercent) {
            return false;
        }
        
        // Additional seller validation
        const accountAge = seller.accountAge || 0; // Days since account creation
        
        // Flag new accounts with high-value items as potentially suspicious
        if (accountAge < 30 && feedbackScore < 50) {
            return false;
        }
        
        return true;
    }

    /**
     * Detect suspicious listings that may be fake or manipulated
     */
    detectSuspiciousListing(item) {
        const suspicious = [];
        
        // Price-based suspicion
        if (item.price < 1 || item.price > 100000) {
            suspicious.push('extreme_price');
        }
        
        // Title-based suspicion
        const title = (item.title || '').toLowerCase();
        this.config.suspiciousPatterns.titleRed.forEach(pattern => {
            if (title.includes(pattern)) {
                suspicious.push('suspicious_title');
            }
        });
        
        // Description-based suspicion
        const description = (item.description || '').toLowerCase();
        this.config.suspiciousPatterns.descriptionRed.forEach(pattern => {
            if (description.includes(pattern)) {
                suspicious.push('suspicious_description');
            }
        });
        
        // Marketplace-specific suspicion
        if (item.marketplace === 'ebay' && item.seller) {
            // Check for shill bidding patterns
            if (this.detectShillBidding(item)) {
                suspicious.push('shill_bidding');
            }
        }
        
        // Image-based suspicion
        if (this.detectSuspiciousImages(item)) {
            suspicious.push('suspicious_images');
        }
        
        item.suspiciousFlags = suspicious;
        return suspicious.length > 0;
    }

    /**
     * Detect potential shill bidding patterns
     */
    detectShillBidding(item) {
        if (!item.bidHistory) return false;
        
        // Check for multiple bids from same bidder
        const bidderCounts = {};
        item.bidHistory.forEach(bid => {
            bidderCounts[bid.bidder] = (bidderCounts[bid.bidder] || 0) + 1;
        });
        
        // Flag if any bidder has >30% of total bids
        const totalBids = item.bidHistory.length;
        const maxBidderRatio = Math.max(...Object.values(bidderCounts)) / totalBids;
        
        return maxBidderRatio > 0.3;
    }

    /**
     * Detect suspicious image patterns
     */
    detectSuspiciousImages(item) {
        if (!item.imageUrl) return true; // No image is suspicious
        return false; // Temporarily disable other image suspicion for testing
    }

    /**
     * Get human-readable filter reason
     */
    getFilterReason(item) {
        const reasons = [];
        
        if (!item.price || item.price <= 0) reasons.push('invalid_price');
        if (!item.imageUrl) reasons.push('no_image');
        if (!this.validateSeller(item.seller)) reasons.push('low_feedback_seller');
        if (this.detectSuspiciousListing(item)) reasons.push(`suspicious: ${item.suspiciousFlags?.join(', ')}`);
        
        return reasons.join(', ') || 'unknown';
    }

    /**
     * Group pricing data by comic identifier
     */
    groupPricingData(cleanedData) {
        const groups = {};
        
        cleanedData.forEach(item => {
            const key = this.generateComicKey(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });

        return groups;
    }

    /**
     * Generate a consistent key for grouping comics
     */
    generateComicKey(item) {
        const series = this.normalizeSeries(item.series || this.extractSeries(item.title));
        const issue = this.normalizeIssue(item.issue || this.extractIssue(item.title));
        const publisher = this.normalizePublisher(item.publisher);
        const variant = this.normalizeVariant(item.variant_type);
        const generatedKey = `${publisher || 'unknown'}-${series}-${issue}-${variant}`.toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');
        return generatedKey;
    }

    /**
     * Normalize pricing for a specific comic
     */
    async normalizeComicPricing(comicKey, listings, options = {}) {
        if (listings.length < this.config.minDataPoints) {
            return {
                comicKey,
                status: 'insufficient_data',
                listingCount: listings.length,
                minRequired: this.config.minDataPoints
            };
        }

        // Separate listings by sale type
        const auctionListings = listings.filter(l => l.sale_type === 'auction');
        const fixedPriceListings = listings.filter(l => l.sale_type !== 'auction');

        const processListings = (list) => {
            if (list.length === 0) return null;
            // Step 1: Temporal weighting
            const weightedListings = this.applyTemporalWeighting(list);

            // Step 2: Condition normalization
            const conditionNormalizedListings = this.normalizeToBaseCondition(weightedListings);

            // Step 3: Marketplace adjustment
            const marketplaceAdjustedListings = this.applyMarketplaceAdjustments(conditionNormalizedListings);

            // Step 4: Outlier detection and removal
            const filteredListings = this.removeOutliers(marketplaceAdjustedListings);

            // Step 5: Statistical analysis
            const statistics = this.calculatePriceStatistics(filteredListings);

            // Step 6: Trend analysis
            const trends = this.analyzePriceTrends(filteredListings);

            // Step 7: Condition-specific pricing
            const conditionPricing = this.calculateConditionSpecificPricing(list);

            // Step 8: Market insights
            const insights = this.generateMarketInsights(list, statistics, trends);

            // Step 9: Enhanced confidence scoring
            const enhancedConfidence = this.calculateEnhancedConfidenceScore(list, statistics, trends);

            return {
                statistics,
                trends,
                conditionPricing,
                insights,
                rawListingCount: list.length,
                filteredListingCount: filteredListings.length,
                outlierCount: list.length - filteredListings.length,
                dataQuality: this.assessDataQuality(list, filteredListings),
                confidence: enhancedConfidence
            };
        };

        const auctionAnalysis = processListings(auctionListings) || {};
        const fixedPriceAnalysis = processListings(fixedPriceListings) || {};

        return {
            comicKey,
            status: 'success',
            data: {
                auction: auctionAnalysis,
                fixedPrice: fixedPriceAnalysis,
                overallRawListingCount: listings.length
            }
        };
    }

    /**
     * Apply temporal weighting to give more importance to recent data
     */
    applyTemporalWeighting(listings) {
        const now = new Date();
        
        return listings.map(listing => {
            const daysSince = (now - listing.scrapedAt) / (1000 * 60 * 60 * 24);
            const weight = Math.pow(this.config.temporalDecay, daysSince);
            
            return {
                ...listing,
                temporalWeight: weight,
                adjustedPrice: listing.price * weight
            };
        });
    }

    /**
     * Normalize all prices to a base condition (typically Near Mint)
     */
    normalizeToBaseCondition(listings) {
        return listings.map(listing => {
            const conditionMultiplier = this.getConditionMultiplier(listing.condition, listing.grade);
            const basePrice = listing.price / conditionMultiplier;
            
            return {
                ...listing,
                conditionMultiplier,
                basePriceNM: basePrice,
                originalPrice: listing.price
            };
        });
    }

    /**
     * Apply marketplace-specific adjustments
     */
    applyMarketplaceAdjustments(listings) {
        return listings.map(listing => {
            const adjustment = this.config.marketplaceAdjustments[listing.marketplace] || 1.0;
            const adjustedPrice = listing.basePriceNM * adjustment;
            
            return {
                ...listing,
                marketplaceAdjustment: adjustment,
                adjustedBasePriceNM: adjustedPrice
            };
        });
    }

    /**
     * Remove statistical outliers using IQR method
     */
    removeOutliers(listings) {
        if (listings.length < 4) return listings;

        const prices = listings.map(l => l.adjustedBasePriceNM).sort((a, b) => a - b);
        
        const q1Index = Math.floor(prices.length * 0.25);
        const q3Index = Math.floor(prices.length * 0.75);
        const q1 = prices[q1Index];
        const q3 = prices[q3Index];
        const iqr = q3 - q1;
        
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);

        return listings.filter(listing => {
            const price = listing.adjustedBasePriceNM;
            return price >= lowerBound && price <= upperBound;
        });
    }

    /**
     * Calculate comprehensive price statistics
     */
    calculatePriceStatistics(listings) {
        if (listings.length === 0) return null;

        const prices = listings.map(l => l.adjustedBasePriceNM);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        
        const sum = prices.reduce((acc, price) => acc + price, 0);
        const mean = sum / prices.length;
        
        const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
        const standardDeviation = Math.sqrt(variance);
        
        const median = this.calculateMedian(sortedPrices);
        const mode = this.calculateMode(prices);
        
        return {
            count: prices.length,
            mean: Math.round(mean * 100) / 100,
            median: Math.round(median * 100) / 100,
            mode: mode ? Math.round(mode * 100) / 100 : null,
            min: Math.round(Math.min(...prices) * 100) / 100,
            max: Math.round(Math.max(...prices) * 100) / 100,
            standardDeviation: Math.round(standardDeviation * 100) / 100,
            coefficientOfVariation: Math.round((standardDeviation / mean) * 100) / 100,
            percentiles: {
                p10: Math.round(sortedPrices[Math.floor(sortedPrices.length * 0.1)] * 100) / 100,
                p25: Math.round(sortedPrices[Math.floor(sortedPrices.length * 0.25)] * 100) / 100,
                p75: Math.round(sortedPrices[Math.floor(sortedPrices.length * 0.75)] * 100) / 100,
                p90: Math.round(sortedPrices[Math.floor(sortedPrices.length * 0.9)] * 100) / 100
            }
        };
    }

    /**
     * Analyze price trends over time
     */
    analyzePriceTrends(listings) {
        if (listings.length < 3) return null;

        // Sort by date
        const sortedListings = listings.sort((a, b) => a.scrapedAt - b.scrapedAt);
        
        // Calculate trend using linear regression
        const trend = this.calculateLinearTrend(sortedListings);
        
        // Calculate moving averages
        const movingAverages = this.calculateMovingAverages(sortedListings);
        
        // Detect volatility
        const volatility = this.calculateVolatility(sortedListings);
        
        return {
            direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
            slope: Math.round(trend.slope * 100) / 100,
            correlation: Math.round(trend.correlation * 100) / 100,
            confidence: this.assessTrendConfidence(trend, sortedListings.length),
            volatility: Math.round(volatility * 100) / 100,
            movingAverages,
            recentTrend: this.calculateRecentTrend(sortedListings.slice(-5)) // Last 5 data points
        };
    }

    /**
     * Calculate condition-specific pricing recommendations
     */
    calculateConditionSpecificPricing(listings) {
        const conditionGroups = {};
        
        // Group by condition
        listings.forEach(listing => {
            const condition = listing.condition || 'Unknown';
            if (!conditionGroups[condition]) {
                conditionGroups[condition] = [];
            }
            conditionGroups[condition].push(listing.price);
        });

        // Calculate statistics for each condition
        const conditionPricing = {};
        for (const [condition, prices] of Object.entries(conditionGroups)) {
            if (prices.length >= 2) {
                const sortedPrices = prices.sort((a, b) => a - b);
                conditionPricing[condition] = {
                    count: prices.length,
                    average: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
                    median: Math.round(this.calculateMedian(sortedPrices) * 100) / 100,
                    min: Math.round(Math.min(...prices) * 100) / 100,
                    max: Math.round(Math.max(...prices) * 100) / 100
                };
            }
        }

        return conditionPricing;
    }

    /**
     * Generate market insights and recommendations
     */
    generateMarketInsights(listings, statistics, trends) {
        const insights = [];
        
        // Data quality insights
        if (listings.length >= 10) {
            insights.push({
                type: 'data_quality',
                level: 'good',
                message: `Strong dataset with ${listings.length} data points`
            });
        } else if (listings.length >= 5) {
            insights.push({
                type: 'data_quality',
                level: 'moderate',
                message: `Moderate dataset with ${listings.length} data points`
            });
        } else {
            insights.push({
                type: 'data_quality',
                level: 'weak',
                message: `Limited dataset with only ${listings.length} data points`
            });
        }

        // Price volatility insights
        if (statistics && statistics.coefficientOfVariation > 0.5) {
            insights.push({
                type: 'volatility',
                level: 'high',
                message: 'High price volatility detected - market may be unstable'
            });
        } else if (statistics && statistics.coefficientOfVariation < 0.2) {
            insights.push({
                type: 'volatility',
                level: 'low',
                message: 'Low price volatility - stable market conditions'
            });
        }

        // Trend insights
        if (trends && trends.confidence > 0.7) {
            if (trends.direction === 'increasing') {
                insights.push({
                    type: 'trend',
                    level: 'bullish',
                    message: `Strong upward trend detected (${trends.slope > 0 ? '+' : ''}${trends.slope}% per data point)`
                });
            } else if (trends.direction === 'decreasing') {
                insights.push({
                    type: 'trend',
                    level: 'bearish',
                    message: `Strong downward trend detected (${trends.slope}% per data point)`
                });
            }
        }

        // Marketplace diversity insights
        const marketplaces = [...new Set(listings.map(l => l.marketplace))];
        if (marketplaces.length >= 3) {
            insights.push({
                type: 'diversity',
                level: 'good',
                message: `Data from ${marketplaces.length} marketplaces: ${marketplaces.join(', ')}`
            });
        }

        return insights;
    }

    /**
     * Utility methods
     */

    normalizeGrade(grade, service) {
        if (!grade) return null;
        
        if (typeof grade === 'string') {
            const match = grade.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : null;
        }
        
        return parseFloat(grade);
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const conditionMap = {
            'mint': 'Mint',
            'near mint': 'Near Mint',
            'nm': 'Near Mint',
            'very fine': 'Very Fine',
            'vf': 'Very Fine',
            'fine': 'Fine',
            'f': 'Fine',
            'very good': 'Very Good',
            'vg': 'Very Good',
            'good': 'Good',
            'g': 'Good',
            'fair': 'Fair',
            'fr': 'Fair',
            'poor': 'Poor',
            'pr': 'Poor'
        };
        
        const normalized = conditionMap[condition.toLowerCase()];
        return normalized || condition;
    }

    getConditionMultiplier(condition, grade) {
        // If graded, use grade-based multiplier
        if (grade && grade > 0) {
            return this.getGradeMultiplier(grade);
        }
        
        // Otherwise use condition-based multiplier
        return this.config.conditionMultipliers[condition] || 1.0;
    }

    getGradeMultiplier(grade) {
        // CGC/CBCS grade multipliers relative to Near Mint
        const gradeMultipliers = {
            10.0: 3.0,
            9.9: 2.5,
            9.8: 2.0,
            9.6: 1.8,
            9.4: 1.6,
            9.2: 1.4,
            9.0: 1.2,
            8.5: 1.0, // Near Mint baseline
            8.0: 0.8,
            7.5: 0.7,
            7.0: 0.6,
            6.5: 0.5,
            6.0: 0.4,
            5.5: 0.35,
            5.0: 0.3,
            4.5: 0.25,
            4.0: 0.2,
            3.5: 0.15,
            3.0: 0.1,
            2.5: 0.08,
            2.0: 0.06,
            1.5: 0.04,
            1.0: 0.02
        };
        
        // Find closest grade
        const grades = Object.keys(gradeMultipliers).map(g => parseFloat(g)).sort((a, b) => b - a);
        const closestGrade = grades.find(g => grade >= g) || grades[grades.length - 1];
        
        return gradeMultipliers[closestGrade] || 0.02;
    }

    calculateMedian(sortedArray) {
        const mid = Math.floor(sortedArray.length / 2);
        return sortedArray.length % 2 === 0
            ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
            : sortedArray[mid];
    }

    calculateMode(array) {
        const frequency = {};
        let maxFreq = 0;
        let mode = null;
        
        array.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = value;
            }
        });
        
        return maxFreq > 1 ? mode : null;
    }

    calculateLinearTrend(sortedListings) {
        const n = sortedListings.length;
        const x = sortedListings.map((_, i) => i);
        const y = sortedListings.map(l => l.adjustedBasePriceNM);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate correlation coefficient
        const meanX = sumX / n;
        const meanY = sumY / n;
        const ssXY = x.reduce((acc, xi, i) => acc + (xi - meanX) * (y[i] - meanY), 0);
        const ssXX = x.reduce((acc, xi) => acc + (xi - meanX) * (xi - meanX), 0);
        const ssYY = y.reduce((acc, yi) => acc + (yi - meanY) * (yi - meanY), 0);
        const correlation = ssXY / Math.sqrt(ssXX * ssYY);
        
        return { slope, intercept, correlation };
    }

    calculateMovingAverages(sortedListings) {
        const prices = sortedListings.map(l => l.adjustedBasePriceNM);
        const ma5 = this.calculateMovingAverage(prices, 5);
        const ma10 = this.calculateMovingAverage(prices, 10);
        
        return { ma5, ma10 };
    }

    calculateMovingAverage(prices, window) {
        if (prices.length < window) return null;
        
        const result = [];
        for (let i = window - 1; i < prices.length; i++) {
            const slice = prices.slice(i - window + 1, i + 1);
            const average = slice.reduce((a, b) => a + b, 0) / slice.length;
            result.push(Math.round(average * 100) / 100);
        }
        
        return result;
    }

    calculateVolatility(sortedListings) {
        if (sortedListings.length < 2) return 0;
        
        const prices = sortedListings.map(l => l.adjustedBasePriceNM);
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
            const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
            returns.push(ret);
        }
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - meanReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    calculateRecentTrend(recentListings) {
        if (recentListings.length < 2) return null;
        
        const trend = this.calculateLinearTrend(recentListings);
        return {
            direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
            slope: Math.round(trend.slope * 100) / 100,
            correlation: Math.round(trend.correlation * 100) / 100
        };
    }

    assessTrendConfidence(trend, dataPoints) {
        const correlationWeight = Math.abs(trend.correlation);
        const dataPointWeight = Math.min(dataPoints / 10, 1); // Max weight at 10+ points
        
        return correlationWeight * dataPointWeight;
    }

    /**
     * Enhanced confidence scoring with multiple factors
     */
    calculateEnhancedConfidenceScore(listings, statistics, trends) {
        const factors = this.config.confidenceFactors;
        let score = 0;
        let maxScore = 0;
        
        // Factor 1: Data volume (listings count)
        const volumeScore = Math.min(listings.length / 20, 1) * factors.dataVolume;
        score += volumeScore;
        maxScore += factors.dataVolume;
        
        // Factor 2: Marketplace diversity
        const marketplaces = [...new Set(listings.map(l => l.marketplace))];
        const diversityScore = Math.min(marketplaces.length / 3, 1) * factors.marketplaceDiversity;
        score += diversityScore;
        maxScore += factors.marketplaceDiversity;
        
        // Factor 3: Time span coverage
        const timeSpan = this.calculateTimeSpan(listings);
        const timeScore = Math.min(timeSpan / 30, 1) * factors.timeSpan; // 30 days ideal
        score += timeScore;
        maxScore += factors.timeSpan;
        
        // Factor 4: Price consistency (low volatility = higher confidence)
        if (statistics && statistics.coefficientOfVariation !== undefined) {
            const consistencyScore = Math.max(0, 1 - statistics.coefficientOfVariation) * factors.priceConsistency;
            score += consistencyScore;
        }
        maxScore += factors.priceConsistency;
        
        // Factor 5: Seller quality distribution
        const sellerQualityScore = this.assessSellerQuality(listings) * factors.sellerQuality;
        score += sellerQualityScore;
        maxScore += factors.sellerQuality;
        
        // Factor 6: Condition distribution
        const conditionScore = this.assessConditionDistribution(listings) * factors.conditionDistribution;
        score += conditionScore;
        maxScore += factors.conditionDistribution;
        
        // Factor 7: Variant consistency
        const variantScore = this.assessVariantConsistency(listings) * factors.variantConsistency;
        score += variantScore;
        maxScore += factors.variantConsistency;
        
        const finalScore = Math.min(1, score / maxScore);
        
        return {
            overall: Math.round(finalScore * 100) / 100,
            breakdown: {
                dataVolume: Math.round((volumeScore / factors.dataVolume) * 100) / 100,
                marketplaceDiversity: Math.round((diversityScore / factors.marketplaceDiversity) * 100) / 100,
                timeSpan: Math.round((timeScore / factors.timeSpan) * 100) / 100,
                priceConsistency: statistics ? Math.round((Math.max(0, 1 - statistics.coefficientOfVariation) * 100)) / 100 : 0,
                sellerQuality: Math.round(sellerQualityScore / factors.sellerQuality * 100) / 100,
                conditionDistribution: Math.round(conditionScore / factors.conditionDistribution * 100) / 100,
                variantConsistency: Math.round(variantScore / factors.variantConsistency * 100) / 100
            },
            factors: {
                listings: listings.length,
                marketplaces: marketplaces.length,
                timeSpanDays: Math.round(timeSpan),
                priceVolatility: statistics ? Math.round(statistics.coefficientOfVariation * 100) / 100 : null
            }
        };
    }

    /**
     * Assess seller quality distribution
     */
    assessSellerQuality(listings) {
        if (listings.length === 0) return 0;
        
        const avgFeedback = listings.reduce((sum, listing) => {
            return sum + (listing.seller?.feedbackScore || 0);
        }, 0) / listings.length;
        
        const avgPositivePercent = listings.reduce((sum, listing) => {
            return sum + (listing.seller?.positiveFeedbackPercent || 0);
        }, 0) / listings.length;
        
        // Normalize to 0-1 scale
        const feedbackScore = Math.min(avgFeedback / 1000, 1); // 1000+ feedback = max score
        const positiveScore = avgPositivePercent / 100;
        
        return (feedbackScore + positiveScore) / 2;
    }

    /**
     * Assess condition distribution quality
     */
    assessConditionDistribution(listings) {
        const conditions = {};
        listings.forEach(listing => {
            const condition = listing.condition || 'Unknown';
            conditions[condition] = (conditions[condition] || 0) + 1;
        });
        
        const conditionCount = Object.keys(conditions).length;
        const evenDistribution = this.calculateDistributionEveness(Object.values(conditions));
        
        // Reward having multiple conditions (diversity) and even distribution
        const diversityScore = Math.min(conditionCount / 5, 1); // 5+ conditions = max diversity
        const distributionScore = evenDistribution;
        
        return (diversityScore + distributionScore) / 2;
    }

    /**
     * Assess variant consistency
     */
    assessVariantConsistency(listings) {
        const variants = {};
        listings.forEach(listing => {
            const variant = listing.variantInfo?.type || 'unknown';
            variants[variant] = (variants[variant] || 0) + 1;
        });
        
        // If all listings are same variant, confidence is high
        // If mixed variants with proper classification, confidence is medium-high
        // If many unclassified variants, confidence is lower
        
        const totalListings = listings.length;
        const unknownCount = variants.unknown || 0;
        const classifiedRatio = (totalListings - unknownCount) / totalListings;
        
        return classifiedRatio;
    }

    /**
     * Calculate distribution evenness (Shannon diversity index normalized)
     */
    calculateDistributionEveness(values) {
        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) return 0;
        
        const probabilities = values.map(v => v / total);
        const shannonIndex = -probabilities.reduce((sum, p) => {
            return p > 0 ? sum + p * Math.log(p) : sum;
        }, 0);
        
        const maxDiversity = Math.log(values.length);
        return maxDiversity > 0 ? shannonIndex / maxDiversity : 0;
    }

    assessDataQuality(originalListings, filteredListings) {
        const outlierRate = (originalListings.length - filteredListings.length) / originalListings.length;
        const marketplaceDiversity = [...new Set(originalListings.map(l => l.marketplace))].length;
        const timeSpan = this.calculateTimeSpan(originalListings);
        
        let score = 1.0;
        
        // Penalize high outlier rate
        score -= outlierRate * 0.3;
        
        // Reward marketplace diversity
        score += (marketplaceDiversity - 1) * 0.1;
        
        // Reward longer time spans (up to 90 days)
        score += Math.min(timeSpan / 90, 1) * 0.2;
        
        return {
            score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100,
            outlierRate: Math.round(outlierRate * 100) / 100,
            marketplaceDiversity,
            timeSpanDays: Math.round(timeSpan)
        };
    }

    calculateTimeSpan(listings) {
        if (listings.length < 2) return 0;
        
        const dates = listings.map(l => l.scrapedAt).sort((a, b) => a - b);
        const spanMs = dates[dates.length - 1] - dates[0];
        
        return spanMs / (1000 * 60 * 60 * 24); // Convert to days
    }

    // Default configuration methods
    getDefaultGradingPremiums() {
        return {
            'cgc': 1.2,
            'cbcs': 1.15,
            'pgx': 1.1,
            'raw': 1.0
        };
    }

    getDefaultMarketplaceAdjustments() {
        return {
            'ebay': 1.0,
            'whatnot': 0.95,
            'comicconnect': 1.1,
            'heritage': 1.15,
            'mycomicshop': 0.9
        };
    }

    getDefaultConditionMultipliers() {
        return {
            'Mint': 1.2,
            'Near Mint': 1.0,
            'Very Fine': 0.8,
            'Fine': 0.6,
            'Very Good': 0.4,
            'Good': 0.3,
            'Fair': 0.2,
            'Poor': 0.1,
            'Unknown': 0.8
        };
    }


    // Helper methods for extracting comic information
    extractSeries(title) {
        // Remove issue numbers and common suffixes
        return title.replace(/\s*#?\d+.*$/, '').trim();
    }

    extractIssue(title) {
        const match = title.match(/#(\d+)/);
        return match ? match[1] : '1';
    }

    normalizeSeries(series) {
        if (!series) return 'unknown';
        
        return series.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeIssue(issue) {
        if (!issue) return '1';
        
        return issue.toString().padStart(3, '0');
    }

    normalizePublisher(publisher) {
        if (!publisher) return null;
        
        const publisherMap = {
            'dc': 'DC',
            'marvel': 'Marvel',
            'image': 'Image',
            'dark horse': 'Dark Horse',
            'idw': 'IDW'
        };
        
        return publisherMap[publisher.toLowerCase()] || publisher;
    }

    normalizeVariant(variant) {
        if (!variant) return 'base';

        return variant.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    getDefaultSuspiciousPatterns() {
        return {
            titleRed: ['replica', 'copy', 'fake', 'reprint', 'facsimile', 'not real'],
            descriptionRed: ['replica', 'copy', 'fake', 'reprint', 'facsimile', 'not real']
        };
    }

    getDefaultConfidenceFactors() {
        return {
            dataVolume: 0.25,        // 25% weight for number of listings
            marketplaceDiversity: 0.15, // 15% weight for marketplace variety
            timeSpan: 0.15,          // 15% weight for time coverage
            priceConsistency: 0.20,  // 20% weight for price stability
            sellerQuality: 0.10,     // 10% weight for seller reputation
            conditionDistribution: 0.10, // 10% weight for condition variety
            variantConsistency: 0.05  // 5% weight for variant classification
        };
    }
}

module.exports = PriceNormalizationEngine;