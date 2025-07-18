/**
 * Task 6: Anomaly Detection Service
 * Detects major price swings and market anomalies - Acceptance Criteria 2
 */

class AnomalyDetector {
    constructor() {
        // Anomaly detection thresholds
        this.thresholds = {
            price_spike: {
                z_score: 2.5,           // Z-score threshold for price spikes
                percentage: 0.25,        // 25% price increase threshold
                volume_factor: 1.5      // 50% above normal volume
            },
            price_drop: {
                z_score: -2.5,          // Z-score threshold for price drops
                percentage: -0.20,       // 20% price decrease threshold
                volume_factor: 1.5      // 50% above normal volume
            },
            volatility: {
                rolling_window: 14,      // 14-day rolling window
                threshold: 0.6          // 60% volatility threshold
            },
            volume: {
                spike_threshold: 3.0,    // 3x normal volume
                drop_threshold: 0.3     // 30% of normal volume
            },
            market_manipulation: {
                bid_ask_spread: 0.15,    // 15% bid-ask spread
                price_clusters: 0.05,    // 5% price clustering
                wash_trading: 0.8       // 80% confidence threshold
            }
        };

        // Statistical models for anomaly detection
        this.models = {
            isolation_forest: null,     // Isolation Forest for outlier detection
            local_outlier_factor: null, // LOF for density-based detection
            one_class_svm: null        // One-Class SVM for boundary detection
        };

        // Historical baseline for comparisons
        this.baseline = {
            mean_price: null,
            std_price: null,
            mean_volume: null,
            std_volume: null,
            normal_volatility: null
        };
    }

    /**
     * Main anomaly detection method
     * @param {Object} marketData - Market data with pricing and volume
     * @returns {Promise<Object>} Anomaly detection results
     */
    async detectAnomalies(marketData) {
        try {
            console.log('🔍 Running anomaly detection analysis...');

            // Prepare data for analysis
            const preparedData = this.prepareDataForAnalysis(marketData);
            
            // Update baseline statistics
            await this.updateBaseline(preparedData);

            // Run multiple anomaly detection methods
            const anomalies = await this.runAnomalyDetection(preparedData);

            // Analyze specific anomaly types
            const priceAnomalies = this.detectPriceAnomalies(preparedData);
            const volumeAnomalies = this.detectVolumeAnomalies(preparedData);
            const volatilityAnomalies = this.detectVolatilityAnomalies(preparedData);
            const marketAnomalies = this.detectMarketManipulation(preparedData);

            // Calculate overall anomaly score
            const overallScore = this.calculateOverallAnomalyScore({
                general: anomalies,
                price: priceAnomalies,
                volume: volumeAnomalies,
                volatility: volatilityAnomalies,
                market: marketAnomalies
            });

            const result = {
                hasAnomalies: overallScore > 0.5,
                score: overallScore,
                confidence: this.calculateConfidence(preparedData),
                anomaly_types: {
                    price_spikes: priceAnomalies.spikes,
                    price_drops: priceAnomalies.drops,
                    volume_spikes: volumeAnomalies.spikes,
                    volume_drops: volumeAnomalies.drops,
                    volatility_bursts: volatilityAnomalies.bursts,
                    market_manipulation: marketAnomalies.indicators
                },
                severity: this.categorizeSeverity(overallScore),
                detected_patterns: this.identifyPatterns(preparedData, {
                    price: priceAnomalies,
                    volume: volumeAnomalies,
                    volatility: volatilityAnomalies
                }),
                recommendations: this.generateAnomalyRecommendations(overallScore, {
                    price: priceAnomalies,
                    volume: volumeAnomalies,
                    volatility: volatilityAnomalies,
                    market: marketAnomalies
                }),
                metadata: {
                    detection_time: new Date().toISOString(),
                    data_points: preparedData.length,
                    baseline_updated: this.baseline.mean_price !== null
                }
            };

            console.log(`✅ Anomaly detection complete. Score: ${Math.round(overallScore * 100)}%, Severity: ${result.severity}`);
            return result;

        } catch (error) {
            console.error('❌ Anomaly detection error:', error);
            return {
                hasAnomalies: false,
                score: 0,
                error: error.message,
                fallback: true
            };
        }
    }

    /**
     * Prepare market data for anomaly analysis
     */
    prepareDataForAnalysis(marketData) {
        const data = [];

        // Process historical prices if available
        if (marketData.historicalPrices && Array.isArray(marketData.historicalPrices)) {
            marketData.historicalPrices.forEach(record => {
                data.push({
                    timestamp: new Date(record.period || record.date),
                    price: record.average_price || record.price,
                    volume: record.transaction_count || record.volume || 1,
                    high: record.max_price || record.high || record.price,
                    low: record.min_price || record.low || record.price,
                    source: record.source || 'historical'
                });
            });
        }

        // Add current market data
        if (marketData.currentPrice) {
            data.push({
                timestamp: new Date(),
                price: marketData.currentPrice,
                volume: marketData.activityScore * 10 || 1, // Convert activity score to volume estimate
                high: marketData.priceRange?.max || marketData.currentPrice,
                low: marketData.priceRange?.min || marketData.currentPrice,
                source: 'current'
            });
        }

        // Sort by timestamp and ensure minimum data points
        return data
            .sort((a, b) => a.timestamp - b.timestamp)
            .filter(d => d.price && d.price > 0);
    }

    /**
     * Update baseline statistics for anomaly detection
     */
    async updateBaseline(data) {
        if (data.length < 5) return; // Need minimum data for baseline

        const prices = data.map(d => d.price);
        const volumes = data.map(d => d.volume);

        // Calculate price statistics
        this.baseline.mean_price = this.calculateMean(prices);
        this.baseline.std_price = this.calculateStandardDeviation(prices, this.baseline.mean_price);

        // Calculate volume statistics
        this.baseline.mean_volume = this.calculateMean(volumes);
        this.baseline.std_volume = this.calculateStandardDeviation(volumes, this.baseline.mean_volume);

        // Calculate normal volatility
        this.baseline.normal_volatility = this.calculateVolatility(prices);

        console.log(`📊 Baseline updated: Price μ=${this.baseline.mean_price.toFixed(2)}, σ=${this.baseline.std_price.toFixed(2)}`);
    }

    /**
     * Run general anomaly detection algorithms
     */
    async runAnomalyDetection(data) {
        const anomalies = [];

        // Statistical outlier detection using Z-score
        const priceZScores = this.calculateZScores(data.map(d => d.price), this.baseline.mean_price, this.baseline.std_price);
        const volumeZScores = this.calculateZScores(data.map(d => d.volume), this.baseline.mean_volume, this.baseline.std_volume);

        data.forEach((point, index) => {
            const priceZ = priceZScores[index];
            const volumeZ = volumeZScores[index];

            if (Math.abs(priceZ) > 2.0 || Math.abs(volumeZ) > 2.0) {
                anomalies.push({
                    timestamp: point.timestamp,
                    type: 'statistical_outlier',
                    price_z_score: priceZ,
                    volume_z_score: volumeZ,
                    severity: Math.max(Math.abs(priceZ), Math.abs(volumeZ)) / 3.0
                });
            }
        });

        // Interquartile Range (IQR) method
        const iqrAnomalies = this.detectIQRAnomalies(data);
        anomalies.push(...iqrAnomalies);

        // Moving average deviation
        const maAnomalies = this.detectMovingAverageAnomalies(data);
        anomalies.push(...maAnomalies);

        return anomalies;
    }

    /**
     * Detect price-specific anomalies
     */
    detectPriceAnomalies(data) {
        const spikes = [];
        const drops = [];

        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];
            
            const priceChange = (current.price - previous.price) / previous.price;
            const timeSpan = (current.timestamp - previous.timestamp) / (1000 * 60 * 60 * 24); // days

            // Detect price spikes
            if (priceChange > this.thresholds.price_spike.percentage) {
                const spike = {
                    timestamp: current.timestamp,
                    price_before: previous.price,
                    price_after: current.price,
                    change_percentage: priceChange * 100,
                    time_span_days: timeSpan,
                    severity: Math.min(priceChange / this.thresholds.price_spike.percentage, 3.0)
                };

                // Enhanced spike detection with volume correlation
                if (current.volume > previous.volume * this.thresholds.price_spike.volume_factor) {
                    spike.volume_correlation = true;
                    spike.severity *= 1.2;
                }

                spikes.push(spike);
            }

            // Detect price drops
            if (priceChange < this.thresholds.price_drop.percentage) {
                const drop = {
                    timestamp: current.timestamp,
                    price_before: previous.price,
                    price_after: current.price,
                    change_percentage: priceChange * 100,
                    time_span_days: timeSpan,
                    severity: Math.min(Math.abs(priceChange) / Math.abs(this.thresholds.price_drop.percentage), 3.0)
                };

                // Enhanced drop detection with volume correlation
                if (current.volume > previous.volume * this.thresholds.price_drop.volume_factor) {
                    drop.volume_correlation = true;
                    drop.severity *= 1.2;
                }

                drops.push(drop);
            }
        }

        return { spikes, drops };
    }

    /**
     * Detect volume-specific anomalies
     */
    detectVolumeAnomalies(data) {
        const spikes = [];
        const drops = [];

        const rollingAverageVolume = this.calculateRollingAverage(data.map(d => d.volume), 7);

        data.forEach((point, index) => {
            if (index < 7) return; // Skip initial points without enough history

            const expectedVolume = rollingAverageVolume[index - 7];
            const actualVolume = point.volume;
            const volumeRatio = actualVolume / expectedVolume;

            // Volume spikes
            if (volumeRatio > this.thresholds.volume.spike_threshold) {
                spikes.push({
                    timestamp: point.timestamp,
                    expected_volume: expectedVolume,
                    actual_volume: actualVolume,
                    ratio: volumeRatio,
                    severity: Math.min(volumeRatio / this.thresholds.volume.spike_threshold, 3.0)
                });
            }

            // Volume drops
            if (volumeRatio < this.thresholds.volume.drop_threshold) {
                drops.push({
                    timestamp: point.timestamp,
                    expected_volume: expectedVolume,
                    actual_volume: actualVolume,
                    ratio: volumeRatio,
                    severity: Math.min(this.thresholds.volume.drop_threshold / volumeRatio, 3.0)
                });
            }
        });

        return { spikes, drops };
    }

    /**
     * Detect volatility anomalies
     */
    detectVolatilityAnomalies(data) {
        const bursts = [];
        const window = this.thresholds.volatility.rolling_window;

        for (let i = window; i < data.length; i++) {
            const windowData = data.slice(i - window, i);
            const prices = windowData.map(d => d.price);
            const volatility = this.calculateVolatility(prices);

            if (volatility > this.thresholds.volatility.threshold) {
                bursts.push({
                    timestamp: data[i].timestamp,
                    window_start: data[i - window].timestamp,
                    volatility,
                    severity: Math.min(volatility / this.thresholds.volatility.threshold, 3.0),
                    price_range: {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                    }
                });
            }
        }

        return { bursts };
    }

    /**
     * Detect potential market manipulation
     */
    detectMarketManipulation(data) {
        const indicators = [];

        // Detect unusual price clustering
        const priceClusters = this.detectPriceClustering(data);
        if (priceClusters.clustering_score > this.thresholds.market_manipulation.price_clusters) {
            indicators.push({
                type: 'price_clustering',
                score: priceClusters.clustering_score,
                description: 'Unusual concentration of prices at specific levels',
                severity: 'medium'
            });
        }

        // Detect potential wash trading patterns
        const washTradingScore = this.detectWashTrading(data);
        if (washTradingScore > this.thresholds.market_manipulation.wash_trading) {
            indicators.push({
                type: 'wash_trading',
                score: washTradingScore,
                description: 'Potential artificial volume inflation through wash trading',
                severity: 'high'
            });
        }

        // Detect pump and dump patterns
        const pumpDumpScore = this.detectPumpAndDump(data);
        if (pumpDumpScore > 0.7) {
            indicators.push({
                type: 'pump_and_dump',
                score: pumpDumpScore,
                description: 'Potential pump and dump manipulation pattern',
                severity: 'high'
            });
        }

        return { indicators };
    }

    /**
     * Calculate overall anomaly score
     */
    calculateOverallAnomalyScore(anomalies) {
        let score = 0;
        let weights = 0;

        // Price anomalies (30% weight)
        const priceScore = (anomalies.price.spikes.length + anomalies.price.drops.length) * 0.1;
        score += Math.min(priceScore, 1.0) * 0.30;
        weights += 0.30;

        // Volume anomalies (20% weight)
        const volumeScore = (anomalies.volume.spikes.length + anomalies.volume.drops.length) * 0.15;
        score += Math.min(volumeScore, 1.0) * 0.20;
        weights += 0.20;

        // Volatility anomalies (25% weight)
        const volatilityScore = anomalies.volatility.bursts.length * 0.2;
        score += Math.min(volatilityScore, 1.0) * 0.25;
        weights += 0.25;

        // Market manipulation (25% weight)
        const manipulationScore = anomalies.market.indicators.length * 0.25;
        score += Math.min(manipulationScore, 1.0) * 0.25;
        weights += 0.25;

        return Math.min(score / weights, 1.0);
    }

    /**
     * Categorize anomaly severity
     */
    categorizeSeverity(score) {
        if (score >= 0.8) return 'critical';
        if (score >= 0.6) return 'high';
        if (score >= 0.4) return 'medium';
        if (score >= 0.2) return 'low';
        return 'minimal';
    }

    /**
     * Identify patterns in anomalies
     */
    identifyPatterns(data, anomalies) {
        const patterns = [];

        // Recurring spike pattern
        if (anomalies.price.spikes.length >= 3) {
            const intervals = [];
            for (let i = 1; i < anomalies.price.spikes.length; i++) {
                const interval = (anomalies.price.spikes[i].timestamp - anomalies.price.spikes[i-1].timestamp) / (1000 * 60 * 60 * 24);
                intervals.push(interval);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            
            if (avgInterval < 30 && intervals.every(i => Math.abs(i - avgInterval) < avgInterval * 0.3)) {
                patterns.push({
                    type: 'recurring_spikes',
                    description: `Price spikes occurring approximately every ${Math.round(avgInterval)} days`,
                    confidence: 0.8
                });
            }
        }

        // Volatility clustering
        if (anomalies.volatility.bursts.length >= 2) {
            patterns.push({
                type: 'volatility_clustering',
                description: 'Periods of high volatility tend to cluster together',
                confidence: 0.7
            });
        }

        // Volume-price divergence
        const volumePriceDivergence = this.detectVolumePriceDivergence(data);
        if (volumePriceDivergence > 0.6) {
            patterns.push({
                type: 'volume_price_divergence',
                description: 'Volume and price movements are not correlated as expected',
                confidence: volumePriceDivergence
            });
        }

        return patterns;
    }

    /**
     * Generate recommendations based on anomaly detection
     */
    generateAnomalyRecommendations(score, anomalies) {
        const recommendations = [];

        if (score > 0.7) {
            recommendations.push({
                action: 'immediate_attention',
                description: 'High anomaly score detected - review market conditions carefully',
                priority: 'high'
            });
        }

        if (anomalies.price.spikes.length > 0) {
            recommendations.push({
                action: 'investigate_price_spike',
                description: 'Investigate cause of price spike - may indicate news or manipulation',
                priority: 'medium'
            });
        }

        if (anomalies.market.indicators.some(i => i.type === 'pump_and_dump')) {
            recommendations.push({
                action: 'avoid_trading',
                description: 'Potential pump and dump detected - avoid trading until pattern resolves',
                priority: 'high'
            });
        }

        if (anomalies.volatility.bursts.length > 2) {
            recommendations.push({
                action: 'risk_management',
                description: 'High volatility detected - implement strict risk management',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Statistical helper methods
     */
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStandardDeviation(values, mean) {
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateZScores(values, mean, std) {
        if (std === 0) return values.map(() => 0);
        return values.map(val => (val - mean) / std);
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i-1]));
        }
        
        const meanReturn = this.calculateMean(returns);
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance * 252); // Annualized volatility
    }

    calculateRollingAverage(values, window) {
        const result = [];
        for (let i = window - 1; i < values.length; i++) {
            const slice = values.slice(i - window + 1, i + 1);
            result.push(this.calculateMean(slice));
        }
        return result;
    }

    detectIQRAnomalies(data) {
        const prices = data.map(d => d.price).sort((a, b) => a - b);
        const q1 = prices[Math.floor(prices.length * 0.25)];
        const q3 = prices[Math.floor(prices.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        return data
            .filter(point => point.price < lowerBound || point.price > upperBound)
            .map(point => ({
                timestamp: point.timestamp,
                type: 'iqr_outlier',
                price: point.price,
                bounds: { lower: lowerBound, upper: upperBound },
                severity: point.price > upperBound ? 
                    (point.price - upperBound) / (q3 - q1) : 
                    (lowerBound - point.price) / (q3 - q1)
            }));
    }

    detectMovingAverageAnomalies(data, window = 10) {
        const anomalies = [];
        
        for (let i = window; i < data.length; i++) {
            const recentPrices = data.slice(i - window, i).map(d => d.price);
            const ma = this.calculateMean(recentPrices);
            const currentPrice = data[i].price;
            const deviation = Math.abs(currentPrice - ma) / ma;

            if (deviation > 0.15) { // 15% deviation from MA
                anomalies.push({
                    timestamp: data[i].timestamp,
                    type: 'moving_average_deviation',
                    price: currentPrice,
                    moving_average: ma,
                    deviation_percentage: deviation * 100,
                    severity: Math.min(deviation / 0.15, 3.0)
                });
            }
        }

        return anomalies;
    }

    detectPriceClustering(data) {
        const prices = data.map(d => d.price);
        const priceGroups = {};
        
        // Group prices by rounded values
        prices.forEach(price => {
            const rounded = Math.round(price);
            priceGroups[rounded] = (priceGroups[rounded] || 0) + 1;
        });

        const groupCounts = Object.values(priceGroups);
        const maxCount = Math.max(...groupCounts);
        const totalCount = prices.length;
        
        // Calculate clustering score
        const clusteringScore = maxCount / totalCount;
        
        return { clustering_score: clusteringScore };
    }

    detectWashTrading(data) {
        // Simple wash trading detection based on volume spikes without price movement
        let suspiciousActivity = 0;
        
        for (let i = 1; i < data.length; i++) {
            const priceChange = Math.abs(data[i].price - data[i-1].price) / data[i-1].price;
            const volumeRatio = data[i].volume / data[i-1].volume;
            
            // High volume with minimal price movement
            if (volumeRatio > 2.0 && priceChange < 0.02) {
                suspiciousActivity++;
            }
        }
        
        return suspiciousActivity / Math.max(data.length - 1, 1);
    }

    detectPumpAndDump(data) {
        if (data.length < 10) return 0;
        
        // Look for rapid price increase followed by rapid decrease
        let pumpDumpScore = 0;
        
        for (let i = 5; i < data.length - 5; i++) {
            const beforePrices = data.slice(i-5, i).map(d => d.price);
            const afterPrices = data.slice(i, i+5).map(d => d.price);
            
            const beforeAvg = this.calculateMean(beforePrices);
            const afterAvg = this.calculateMean(afterPrices);
            const currentPrice = data[i].price;
            
            const pumpRatio = currentPrice / beforeAvg;
            const dumpRatio = afterAvg / currentPrice;
            
            if (pumpRatio > 1.3 && dumpRatio < 0.8) { // 30% pump, 20% dump
                pumpDumpScore = Math.max(pumpDumpScore, (pumpRatio - 1) * dumpRatio);
            }
        }
        
        return Math.min(pumpDumpScore, 1.0);
    }

    detectVolumePriceDivergence(data) {
        if (data.length < 10) return 0;
        
        const priceChanges = [];
        const volumeChanges = [];
        
        for (let i = 1; i < data.length; i++) {
            priceChanges.push((data[i].price - data[i-1].price) / data[i-1].price);
            volumeChanges.push((data[i].volume - data[i-1].volume) / data[i-1].volume);
        }
        
        // Calculate correlation coefficient
        const correlation = this.calculateCorrelation(priceChanges, volumeChanges);
        
        // Return divergence score (1 - correlation)
        return Math.max(0, 1 - Math.abs(correlation));
    }

    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const meanX = this.calculateMean(x);
        const meanY = this.calculateMean(y);
        
        let numerator = 0;
        let sumXSquared = 0;
        let sumYSquared = 0;
        
        for (let i = 0; i < x.length; i++) {
            const deltaX = x[i] - meanX;
            const deltaY = y[i] - meanY;
            
            numerator += deltaX * deltaY;
            sumXSquared += deltaX * deltaX;
            sumYSquared += deltaY * deltaY;
        }
        
        const denominator = Math.sqrt(sumXSquared * sumYSquared);
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateConfidence(data) {
        // Confidence based on data quality and quantity
        let confidence = 0.5; // Base confidence
        
        // Data quantity boost
        if (data.length >= 30) confidence += 0.2;
        else if (data.length >= 10) confidence += 0.1;
        
        // Data quality boost (consistent timestamps)
        const timeGaps = [];
        for (let i = 1; i < data.length; i++) {
            timeGaps.push(data[i].timestamp - data[i-1].timestamp);
        }
        
        if (timeGaps.length > 0) {
            const avgGap = this.calculateMean(timeGaps);
            const gapStd = this.calculateStandardDeviation(timeGaps, avgGap);
            const gapConsistency = 1 - (gapStd / avgGap);
            
            if (gapConsistency > 0.8) confidence += 0.15;
            else if (gapConsistency > 0.6) confidence += 0.1;
        }
        
        // Baseline quality boost
        if (this.baseline.mean_price !== null) confidence += 0.15;
        
        return Math.min(confidence, 1.0);
    }
}

module.exports = AnomalyDetector; 