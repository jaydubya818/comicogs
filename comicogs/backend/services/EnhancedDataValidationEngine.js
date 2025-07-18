const EventEmitter = require('events');

/**
 * Enhanced Data Validation Engine for Task 1
 * Provides comprehensive validation, anomaly detection, and confidence scoring
 * for marketplace data to ensure high-quality pricing intelligence
 */
class EnhancedDataValidationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...this.getDefaultConfig(),
            ...config
        };
        
        // Validation statistics
        this.validationStats = {
            totalValidations: 0,
            passedValidations: 0,
            failedValidations: 0,
            averageConfidenceScore: 0,
            anomaliesDetected: 0,
            suspiciousListingsBlocked: 0,
            validationTimes: [],
            validationsByMarketplace: {}
        };
        
        // Anomaly detection baseline data
        this.baselineData = {
            priceRanges: new Map(),
            commonConditions: new Set(),
            sellerPatterns: new Map(),
            titlePatterns: new Map(),
            marketplaceNorms: new Map()
        };
        
        // Machine learning models for validation (simplified)
        this.mlModels = {
            priceAnomalyDetector: null,
            titleClassifier: null,
            sellerReputationModel: null
        };
        
        // Initialize validation patterns
        this.initializeValidationPatterns();
        
        console.log('🔍 Enhanced Data Validation Engine initialized');
    }

    getDefaultConfig() {
        return {
            // Basic validation rules
            validation: {
                requiredFields: [
                    'id', 'title', 'price', 'marketplace', 'source_url',
                    'condition', 'sale_type'
                ],
                optionalFields: [
                    'description', 'seller_info', 'listing_photos', 'shipping_cost',
                    'view_count', 'watcher_count', 'bid_count', 'grade'
                ],
                
                // Price validation
                minPrice: 0.01,
                maxPrice: 1000000,
                priceIncrement: 0.01,
                
                // Text validation
                maxTitleLength: 500,
                maxDescriptionLength: 10000,
                minTitleLength: 5,
                
                // Seller validation
                minSellerRating: 0.0,
                maxSellerRating: 5.0,
                minFeedbackCount: 0,
                
                // Listing validation
                maxViewCount: 1000000,
                maxWatcherCount: 100000,
                maxBidCount: 10000,
                
                // Date validation
                maxListingAge: 365, // days
                futureDateThreshold: 7 // days
            },
            
            // Anomaly detection thresholds
            anomalyDetection: {
                enabled: true,
                priceAnomalyThreshold: 3.0, // standard deviations
                volumeAnomalyThreshold: 5.0, // standard deviations
                sellerAnomalyThreshold: 2.5, // standard deviations
                titleSimilarityThreshold: 0.9, // cosine similarity
                
                // Machine learning thresholds
                mlConfidenceThreshold: 0.7,
                anomalyConfidenceThreshold: 0.8,
                
                // Baseline data requirements
                minDataPointsForBaseline: 10,
                baselineUpdateInterval: 86400000 // 24 hours
            },
            
            // Confidence scoring weights
            confidenceScoring: {
                priceReasonableness: 0.25,
                sellerReliability: 0.25,
                listingQuality: 0.20,
                dataCompleteness: 0.15,
                sourceReliability: 0.15
            },
            
            // Suspicious pattern detection
            suspiciousPatterns: {
                // Price patterns
                pricePatterns: [
                    /\$[\d,]+\.99999/,  // Suspicious pricing
                    /\$0\.01/,          // Penny auctions
                    /\$9999/,           // Placeholder prices
                    /\$99999/           // Extreme prices
                ],
                
                // Title patterns
                titlePatterns: [
                    /\b(fake|replica|copy|reproduction)\b/i,
                    /\b(shill|scam|fraud|stolen)\b/i,
                    /\b(adult|xxx|porn)\b/i,
                    /\b(casino|gambling|lottery)\b/i,
                    /\b(viagra|cialis|prescription)\b/i,
                    /<script|javascript:|on\w+\s*=/i
                ],
                
                // Description patterns
                descriptionPatterns: [
                    /\b(money back guaranteed|100% authentic|no returns)\b/i,
                    /\b(limited time|act now|urgent)\b/i,
                    /\b(investment|profit|roi)\b/i,
                    /contact.*outside.*ebay/i,
                    /paypal.*friends.*family/i
                ],
                
                // Seller patterns
                sellerPatterns: [
                    /\b(new seller|0 feedback|private listing)\b/i,
                    /\b(feedback score: 0|rating: 0)\b/i,
                    /\b(account created today|new account)\b/i
                ]
            },
            
            // Marketplace-specific validation rules
            marketplaceRules: {
                ebay: {
                    requiredFields: ['id', 'title', 'price', 'condition', 'seller_info'],
                    maxTitleLength: 80,
                    allowedConditions: ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'],
                    priceValidation: { min: 0.99, max: 999999 },
                    sellerValidation: { minFeedback: 0, maxFeedback: 1000000 }
                },
                whatnot: {
                    requiredFields: ['id', 'title', 'price', 'sale_type'],
                    maxTitleLength: 100,
                    allowedSaleTypes: ['auction', 'buy_now', 'live_auction'],
                    priceValidation: { min: 1.00, max: 50000 }
                },
                comicconnect: {
                    requiredFields: ['id', 'title', 'price', 'condition', 'grade'],
                    maxTitleLength: 200,
                    allowedConditions: ['Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good', 'Good', 'Fair', 'Poor'],
                    priceValidation: { min: 1.00, max: 1000000 }
                },
                heritage: {
                    requiredFields: ['id', 'title', 'price', 'condition', 'lot_number'],
                    maxTitleLength: 300,
                    allowedConditions: ['CGC', 'CBCS', 'Raw'],
                    priceValidation: { min: 10.00, max: 5000000 }
                },
                mycomicshop: {
                    requiredFields: ['id', 'title', 'price', 'condition', 'grade'],
                    maxTitleLength: 150,
                    allowedConditions: ['M', 'NM', 'VF', 'F', 'VG', 'G', 'FA', 'PR'],
                    priceValidation: { min: 0.50, max: 100000 }
                }
            }
        };
    }

    initializeValidationPatterns() {
        // Initialize common comic title patterns
        this.comicTitlePatterns = [
            /^(.+?)\s*#(\d+(?:\.\d+)?)\s*(?:\((\d{4})\))?/,  // Series #1 (2023)
            /^(.+?)\s*Vol\.?\s*(\d+)\s*#(\d+(?:\.\d+)?)/,      // Series Vol. 1 #1
            /^(.+?)\s*(\d+(?:\.\d+)?)\s*(?:\((\d{4})\))?/      // Series 1 (2023)
        ];
        
        // Initialize grade patterns
        this.gradePatterns = {
            cgc: /CGC\s*(\d+(?:\.\d+)?)/i,
            cbcs: /CBCS\s*(\d+(?:\.\d+)?)/i,
            pgx: /PGX\s*(\d+(?:\.\d+)?)/i,
            raw: /RAW|UNGRADED|NO GRADE/i
        };
        
        // Initialize marketplace-specific patterns
        this.marketplacePatterns = {
            ebay: {
                listingId: /^\d{12,13}$/,
                sellerName: /^[a-zA-Z0-9_\-\.]{1,64}$/,
                feedbackScore: /^\d{1,7}$/
            },
            whatnot: {
                listingId: /^[a-zA-Z0-9\-]{8,32}$/,
                username: /^[a-zA-Z0-9_]{3,20}$/
            },
            comicconnect: {
                listingId: /^\d{6,10}$/,
                lotNumber: /^LOT\d{4,8}$/i
            },
            heritage: {
                listingId: /^\d{8,12}$/,
                lotNumber: /^\d{5,8}$/
            },
            mycomicshop: {
                listingId: /^[A-Z0-9]{6,12}$/,
                itemCode: /^[A-Z]{2,4}\d{4,8}$/
            }
        };
    }

    /**
     * Main validation method for marketplace listings
     */
    async validateListing(listing, marketplace, options = {}) {
        const startTime = Date.now();
        this.validationStats.totalValidations++;
        
        try {
            // Initialize validation result
            const validationResult = {
                isValid: true,
                errors: [],
                warnings: [],
                confidenceScore: 0,
                anomalyScore: 0,
                normalizedData: null,
                metadata: {
                    marketplace,
                    validationTime: null,
                    validationVersion: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            };
            
            // Step 1: Basic field validation
            const basicValidation = this.validateBasicFields(listing, marketplace);
            if (!basicValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...basicValidation.errors);
            }
            validationResult.warnings.push(...basicValidation.warnings);
            
            // Step 2: Data type validation
            const typeValidation = this.validateDataTypes(listing, marketplace);
            if (!typeValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...typeValidation.errors);
            }
            
            // Step 3: Business logic validation
            const businessValidation = this.validateBusinessLogic(listing, marketplace);
            if (!businessValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...businessValidation.errors);
            }
            validationResult.warnings.push(...businessValidation.warnings);
            
            // Step 4: Suspicious pattern detection
            const suspiciousValidation = this.detectSuspiciousPatterns(listing, marketplace);
            if (!suspiciousValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...suspiciousValidation.errors);
                this.validationStats.suspiciousListingsBlocked++;
            }
            
            // Step 5: Anomaly detection (only if basic validation passes)
            if (validationResult.isValid) {
                const anomalyValidation = await this.detectAnomalies(listing, marketplace);
                validationResult.anomalyScore = anomalyValidation.anomalyScore;
                validationResult.warnings.push(...anomalyValidation.warnings);
                
                if (anomalyValidation.anomalyScore > 0.8) {
                    validationResult.warnings.push('High anomaly score detected');
                    this.validationStats.anomaliesDetected++;
                }
            }
            
            // Step 6: Calculate confidence score
            if (validationResult.isValid) {
                validationResult.confidenceScore = this.calculateConfidenceScore(listing, marketplace, validationResult);
            }
            
            // Step 7: Data normalization
            if (validationResult.isValid) {
                validationResult.normalizedData = this.normalizeListingData(listing, marketplace);
            }
            
            // Update validation time
            validationResult.metadata.validationTime = Date.now() - startTime;
            
            // Update statistics
            this.updateValidationStats(marketplace, validationResult);
            
            // Emit validation event
            this.emit('validationComplete', {
                listing,
                marketplace,
                result: validationResult
            });
            
            return validationResult;
            
        } catch (error) {
            this.validationStats.failedValidations++;
            console.error('Validation error:', error);
            
            // Emit error event
            this.emit('validationError', {
                listing,
                marketplace,
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Validate basic required and optional fields
     */
    validateBasicFields(listing, marketplace) {
        const result = { isValid: true, errors: [], warnings: [] };
        const rules = this.config.marketplaceRules[marketplace] || {};
        const requiredFields = rules.requiredFields || this.config.validation.requiredFields;
        
        // Check required fields
        for (const field of requiredFields) {
            if (!listing[field] || listing[field] === '' || listing[field] === null || listing[field] === undefined) {
                result.isValid = false;
                result.errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Check for empty objects or arrays in important fields
        const importantFields = ['seller_info', 'listing_photos'];
        for (const field of importantFields) {
            if (listing[field]) {
                if (Array.isArray(listing[field]) && listing[field].length === 0) {
                    result.warnings.push(`Empty array for field: ${field}`);
                } else if (typeof listing[field] === 'object' && Object.keys(listing[field]).length === 0) {
                    result.warnings.push(`Empty object for field: ${field}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Validate data types and formats
     */
    validateDataTypes(listing, marketplace) {
        const result = { isValid: true, errors: [], warnings: [] };
        const rules = this.config.marketplaceRules[marketplace] || {};
        
        // Validate price
        if (listing.price !== undefined) {
            const price = parseFloat(listing.price);
            if (isNaN(price)) {
                result.isValid = false;
                result.errors.push(`Invalid price format: ${listing.price}`);
            } else {
                const minPrice = rules.priceValidation?.min || this.config.validation.minPrice;
                const maxPrice = rules.priceValidation?.max || this.config.validation.maxPrice;
                
                if (price < minPrice || price > maxPrice) {
                    result.isValid = false;
                    result.errors.push(`Price out of range: ${price} (min: ${minPrice}, max: ${maxPrice})`);
                }
            }
        }
        
        // Validate numeric fields
        const numericFields = ['view_count', 'watcher_count', 'bid_count', 'shipping_cost'];
        for (const field of numericFields) {
            if (listing[field] !== undefined) {
                const value = parseFloat(listing[field]);
                if (isNaN(value) || value < 0) {
                    result.warnings.push(`Invalid numeric value for ${field}: ${listing[field]}`);
                }
            }
        }
        
        // Validate URLs
        if (listing.source_url) {
            try {
                new URL(listing.source_url);
            } catch (error) {
                result.isValid = false;
                result.errors.push(`Invalid URL format: ${listing.source_url}`);
            }
        }
        
        // Validate dates
        const dateFields = ['sale_date', 'end_date', 'created_at'];
        for (const field of dateFields) {
            if (listing[field]) {
                const date = new Date(listing[field]);
                if (isNaN(date.getTime())) {
                    result.warnings.push(`Invalid date format for ${field}: ${listing[field]}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Validate business logic and constraints
     */
    validateBusinessLogic(listing, marketplace) {
        const result = { isValid: true, errors: [], warnings: [] };
        const rules = this.config.marketplaceRules[marketplace] || {};
        
        // Validate title length
        if (listing.title) {
            const maxLength = rules.maxTitleLength || this.config.validation.maxTitleLength;
            const minLength = this.config.validation.minTitleLength;
            
            if (listing.title.length > maxLength) {
                result.isValid = false;
                result.errors.push(`Title too long: ${listing.title.length} characters (max: ${maxLength})`);
            }
            
            if (listing.title.length < minLength) {
                result.isValid = false;
                result.errors.push(`Title too short: ${listing.title.length} characters (min: ${minLength})`);
            }
        }
        
        // Validate condition
        if (listing.condition && rules.allowedConditions) {
            if (!rules.allowedConditions.includes(listing.condition)) {
                result.warnings.push(`Unusual condition for ${marketplace}: ${listing.condition}`);
            }
        }
        
        // Validate sale type
        if (listing.sale_type && rules.allowedSaleTypes) {
            if (!rules.allowedSaleTypes.includes(listing.sale_type)) {
                result.warnings.push(`Unusual sale type for ${marketplace}: ${listing.sale_type}`);
            }
        }
        
        // Validate seller information
        if (listing.seller_info) {
            if (typeof listing.seller_info === 'object') {
                if (listing.seller_info.feedback_score !== undefined) {
                    const feedback = parseInt(listing.seller_info.feedback_score);
                    if (isNaN(feedback) || feedback < 0) {
                        result.warnings.push(`Invalid seller feedback score: ${listing.seller_info.feedback_score}`);
                    }
                }
                
                if (listing.seller_info.feedback_percentage !== undefined) {
                    const percentage = parseFloat(listing.seller_info.feedback_percentage);
                    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                        result.warnings.push(`Invalid seller feedback percentage: ${listing.seller_info.feedback_percentage}`);
                    }
                }
            }
        }
        
        // Validate listing metrics consistency
        if (listing.bid_count && listing.sale_type) {
            if (listing.sale_type === 'buy_it_now' && listing.bid_count > 0) {
                result.warnings.push('Buy It Now listing has bid count > 0');
            }
        }
        
        return result;
    }

    /**
     * Detect suspicious patterns in listing data
     */
    detectSuspiciousPatterns(listing, marketplace) {
        const result = { isValid: true, errors: [], warnings: [] };
        const patterns = this.config.suspiciousPatterns;
        
        // Check price patterns
        if (listing.price) {
            const priceString = listing.price.toString();
            for (const pattern of patterns.pricePatterns) {
                if (pattern.test(priceString)) {
                    result.isValid = false;
                    result.errors.push(`Suspicious price pattern detected: ${priceString}`);
                    break;
                }
            }
        }
        
        // Check title patterns
        if (listing.title) {
            for (const pattern of patterns.titlePatterns) {
                if (pattern.test(listing.title)) {
                    result.isValid = false;
                    result.errors.push(`Suspicious title pattern detected: ${listing.title}`);
                    break;
                }
            }
        }
        
        // Check description patterns
        if (listing.description) {
            for (const pattern of patterns.descriptionPatterns) {
                if (pattern.test(listing.description)) {
                    result.warnings.push(`Suspicious description pattern detected`);
                    break;
                }
            }
        }
        
        // Check seller patterns
        if (listing.seller_info && typeof listing.seller_info === 'object') {
            const sellerString = JSON.stringify(listing.seller_info);
            for (const pattern of patterns.sellerPatterns) {
                if (pattern.test(sellerString)) {
                    result.warnings.push(`Suspicious seller pattern detected`);
                    break;
                }
            }
        }
        
        return result;
    }

    /**
     * Detect anomalies using statistical analysis
     */
    async detectAnomalies(listing, marketplace) {
        const result = { anomalyScore: 0, warnings: [] };
        
        if (!this.config.anomalyDetection.enabled) {
            return result;
        }
        
        let anomalyFactors = [];
        
        try {
            // Price anomaly detection
            if (listing.price) {
                const priceAnomalyScore = this.detectPriceAnomaly(listing, marketplace);
                anomalyFactors.push(priceAnomalyScore);
                
                if (priceAnomalyScore > 0.7) {
                    result.warnings.push('Unusual price detected');
                }
            }
            
            // Volume anomaly detection
            if (listing.view_count || listing.watcher_count || listing.bid_count) {
                const volumeAnomalyScore = this.detectVolumeAnomaly(listing, marketplace);
                anomalyFactors.push(volumeAnomalyScore);
                
                if (volumeAnomalyScore > 0.7) {
                    result.warnings.push('Unusual engagement metrics detected');
                }
            }
            
            // Seller anomaly detection
            if (listing.seller_info) {
                const sellerAnomalyScore = this.detectSellerAnomaly(listing, marketplace);
                anomalyFactors.push(sellerAnomalyScore);
                
                if (sellerAnomalyScore > 0.7) {
                    result.warnings.push('Unusual seller metrics detected');
                }
            }
            
            // Calculate overall anomaly score
            if (anomalyFactors.length > 0) {
                result.anomalyScore = anomalyFactors.reduce((sum, score) => sum + score, 0) / anomalyFactors.length;
            }
            
        } catch (error) {
            console.warn('Anomaly detection failed:', error.message);
            result.warnings.push('Anomaly detection failed');
        }
        
        return result;
    }

    /**
     * Detect price anomalies
     */
    detectPriceAnomaly(listing, marketplace) {
        const baselineKey = `${marketplace}:price`;
        const priceData = this.baselineData.priceRanges.get(baselineKey);
        
        if (!priceData || priceData.length < this.config.anomalyDetection.minDataPointsForBaseline) {
            return 0; // Not enough data for anomaly detection
        }
        
        const price = parseFloat(listing.price);
        const mean = priceData.reduce((sum, p) => sum + p, 0) / priceData.length;
        const variance = priceData.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priceData.length;
        const standardDeviation = Math.sqrt(variance);
        
        const zScore = Math.abs(price - mean) / standardDeviation;
        const threshold = this.config.anomalyDetection.priceAnomalyThreshold;
        
        return Math.min(zScore / threshold, 1.0);
    }

    /**
     * Detect volume anomalies (views, watchers, bids)
     */
    detectVolumeAnomaly(listing, marketplace) {
        const metrics = ['view_count', 'watcher_count', 'bid_count'];
        let anomalyScores = [];
        
        for (const metric of metrics) {
            if (listing[metric] !== undefined) {
                const value = parseInt(listing[metric]);
                if (!isNaN(value)) {
                    const baselineKey = `${marketplace}:${metric}`;
                    const baselineData = this.baselineData.marketplaceNorms.get(baselineKey);
                    
                    if (baselineData && baselineData.length >= this.config.anomalyDetection.minDataPointsForBaseline) {
                        const mean = baselineData.reduce((sum, v) => sum + v, 0) / baselineData.length;
                        const variance = baselineData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / baselineData.length;
                        const standardDeviation = Math.sqrt(variance);
                        
                        const zScore = Math.abs(value - mean) / standardDeviation;
                        const threshold = this.config.anomalyDetection.volumeAnomalyThreshold;
                        
                        anomalyScores.push(Math.min(zScore / threshold, 1.0));
                    }
                }
            }
        }
        
        return anomalyScores.length > 0 ? 
            anomalyScores.reduce((sum, score) => sum + score, 0) / anomalyScores.length : 0;
    }

    /**
     * Detect seller anomalies
     */
    detectSellerAnomaly(listing, marketplace) {
        if (!listing.seller_info || typeof listing.seller_info !== 'object') {
            return 0;
        }
        
        let anomalyScore = 0;
        
        // Check feedback score anomaly
        if (listing.seller_info.feedback_score !== undefined) {
            const feedbackScore = parseInt(listing.seller_info.feedback_score);
            if (!isNaN(feedbackScore)) {
                const baselineKey = `${marketplace}:feedback_score`;
                const baselineData = this.baselineData.sellerPatterns.get(baselineKey);
                
                if (baselineData && baselineData.length >= this.config.anomalyDetection.minDataPointsForBaseline) {
                    const mean = baselineData.reduce((sum, v) => sum + v, 0) / baselineData.length;
                    const variance = baselineData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / baselineData.length;
                    const standardDeviation = Math.sqrt(variance);
                    
                    const zScore = Math.abs(feedbackScore - mean) / standardDeviation;
                    const threshold = this.config.anomalyDetection.sellerAnomalyThreshold;
                    
                    anomalyScore = Math.max(anomalyScore, Math.min(zScore / threshold, 1.0));
                }
            }
        }
        
        // Check feedback percentage anomaly
        if (listing.seller_info.feedback_percentage !== undefined) {
            const feedbackPercentage = parseFloat(listing.seller_info.feedback_percentage);
            if (!isNaN(feedbackPercentage)) {
                // Low feedback percentage is suspicious
                if (feedbackPercentage < 95) {
                    anomalyScore = Math.max(anomalyScore, (95 - feedbackPercentage) / 95);
                }
            }
        }
        
        return anomalyScore;
    }

    /**
     * Calculate confidence score for the listing
     */
    calculateConfidenceScore(listing, marketplace, validationResult) {
        const weights = this.config.confidenceScoring;
        let totalScore = 0;
        
        // Price reasonableness score
        const priceScore = this.calculatePriceReasonableness(listing, marketplace);
        totalScore += priceScore * weights.priceReasonableness;
        
        // Seller reliability score
        const sellerScore = this.calculateSellerReliability(listing, marketplace);
        totalScore += sellerScore * weights.sellerReliability;
        
        // Listing quality score
        const qualityScore = this.calculateListingQuality(listing, marketplace);
        totalScore += qualityScore * weights.listingQuality;
        
        // Data completeness score
        const completenessScore = this.calculateDataCompleteness(listing, marketplace);
        totalScore += completenessScore * weights.dataCompleteness;
        
        // Source reliability score
        const sourceScore = this.calculateSourceReliability(listing, marketplace);
        totalScore += sourceScore * weights.sourceReliability;
        
        // Adjust for anomaly score
        if (validationResult.anomalyScore > 0) {
            totalScore = totalScore * (1 - validationResult.anomalyScore * 0.5);
        }
        
        return Math.max(0, Math.min(1, totalScore));
    }

    calculatePriceReasonableness(listing, marketplace) {
        const price = parseFloat(listing.price);
        if (isNaN(price)) return 0;
        
        const baselineKey = `${marketplace}:price`;
        const priceData = this.baselineData.priceRanges.get(baselineKey);
        
        if (!priceData || priceData.length < 3) {
            return 0.5; // Neutral score when no baseline data
        }
        
        const sortedPrices = priceData.slice().sort((a, b) => a - b);
        const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
        const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
        const median = sortedPrices[Math.floor(sortedPrices.length * 0.5)];
        
        // Score based on how close to median and within IQR
        if (price >= q1 && price <= q3) {
            return 1.0; // Within normal range
        } else if (price < q1) {
            return Math.max(0.3, 1.0 - (q1 - price) / q1);
        } else {
            return Math.max(0.3, 1.0 - (price - q3) / q3);
        }
    }

    calculateSellerReliability(listing, marketplace) {
        if (!listing.seller_info || typeof listing.seller_info !== 'object') {
            return 0.3; // Low score for missing seller info
        }
        
        let score = 0.5; // Base score
        
        // Feedback score contribution
        if (listing.seller_info.feedback_score !== undefined) {
            const feedbackScore = parseInt(listing.seller_info.feedback_score);
            if (!isNaN(feedbackScore) && feedbackScore > 0) {
                score += Math.min(0.3, feedbackScore / 1000 * 0.3);
            }
        }
        
        // Feedback percentage contribution
        if (listing.seller_info.feedback_percentage !== undefined) {
            const feedbackPercentage = parseFloat(listing.seller_info.feedback_percentage);
            if (!isNaN(feedbackPercentage)) {
                score += (feedbackPercentage / 100) * 0.2;
            }
        }
        
        return Math.min(1.0, score);
    }

    calculateListingQuality(listing, marketplace) {
        let score = 0.5; // Base score
        
        // Title quality
        if (listing.title) {
            const titleLength = listing.title.length;
            if (titleLength >= 20 && titleLength <= 100) {
                score += 0.2;
            }
            
            // Check for comic-specific patterns
            for (const pattern of this.comicTitlePatterns) {
                if (pattern.test(listing.title)) {
                    score += 0.1;
                    break;
                }
            }
        }
        
        // Description quality
        if (listing.description) {
            const descLength = listing.description.length;
            if (descLength >= 50 && descLength <= 1000) {
                score += 0.15;
            }
        }
        
        // Photos availability
        if (listing.listing_photos && Array.isArray(listing.listing_photos) && listing.listing_photos.length > 0) {
            score += 0.15;
        }
        
        return Math.min(1.0, score);
    }

    calculateDataCompleteness(listing, marketplace) {
        const rules = this.config.marketplaceRules[marketplace] || {};
        const requiredFields = rules.requiredFields || this.config.validation.requiredFields;
        const optionalFields = rules.optionalFields || this.config.validation.optionalFields;
        
        let requiredFieldsPresent = 0;
        let optionalFieldsPresent = 0;
        
        // Check required fields
        for (const field of requiredFields) {
            if (listing[field] && listing[field] !== '') {
                requiredFieldsPresent++;
            }
        }
        
        // Check optional fields
        for (const field of optionalFields) {
            if (listing[field] && listing[field] !== '') {
                optionalFieldsPresent++;
            }
        }
        
        const requiredScore = requiredFieldsPresent / requiredFields.length;
        const optionalScore = optionalFields.length > 0 ? optionalFieldsPresent / optionalFields.length : 0;
        
        return (requiredScore * 0.7) + (optionalScore * 0.3);
    }

    calculateSourceReliability(listing, marketplace) {
        const reliabilityScores = {
            ebay: 0.8,
            whatnot: 0.7,
            comicconnect: 0.9,
            heritage: 0.95,
            mycomicshop: 0.85,
            amazon: 0.6
        };
        
        return reliabilityScores[marketplace] || 0.5;
    }

    /**
     * Normalize listing data to standard format
     */
    normalizeListingData(listing, marketplace) {
        const normalized = { ...listing };
        
        // Normalize price
        if (normalized.price) {
            normalized.price = parseFloat(normalized.price);
        }
        
        // Normalize condition
        if (normalized.condition) {
            normalized.condition = this.normalizeCondition(normalized.condition);
        }
        
        // Normalize title
        if (normalized.title) {
            normalized.title = normalized.title.trim().replace(/\s+/g, ' ');
        }
        
        // Normalize seller info
        if (normalized.seller_info && typeof normalized.seller_info === 'object') {
            if (normalized.seller_info.feedback_score) {
                normalized.seller_info.feedback_score = parseInt(normalized.seller_info.feedback_score);
            }
            if (normalized.seller_info.feedback_percentage) {
                normalized.seller_info.feedback_percentage = parseFloat(normalized.seller_info.feedback_percentage);
            }
        }
        
        // Add metadata
        normalized.validation_metadata = {
            marketplace,
            validated_at: new Date().toISOString(),
            validator_version: '1.0.0'
        };
        
        return normalized;
    }

    normalizeCondition(condition) {
        if (!condition) return 'Unknown';
        
        const conditionMap = {
            'mint': 'Mint',
            'm': 'Mint',
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
            'fa': 'Fair',
            'poor': 'Poor',
            'pr': 'Poor',
            'p': 'Poor'
        };
        
        const normalized = condition.toLowerCase().trim();
        return conditionMap[normalized] || condition;
    }

    /**
     * Update validation statistics
     */
    updateValidationStats(marketplace, validationResult) {
        if (validationResult.isValid) {
            this.validationStats.passedValidations++;
        } else {
            this.validationStats.failedValidations++;
        }
        
        // Update marketplace stats
        if (!this.validationStats.validationsByMarketplace[marketplace]) {
            this.validationStats.validationsByMarketplace[marketplace] = {
                total: 0,
                passed: 0,
                failed: 0,
                avgConfidence: 0
            };
        }
        
        const marketplaceStats = this.validationStats.validationsByMarketplace[marketplace];
        marketplaceStats.total++;
        
        if (validationResult.isValid) {
            marketplaceStats.passed++;
            marketplaceStats.avgConfidence = 
                (marketplaceStats.avgConfidence * (marketplaceStats.passed - 1) + validationResult.confidenceScore) / marketplaceStats.passed;
        } else {
            marketplaceStats.failed++;
        }
        
        // Update validation times
        this.validationStats.validationTimes.push(validationResult.metadata.validationTime);
        if (this.validationStats.validationTimes.length > 1000) {
            this.validationStats.validationTimes = this.validationStats.validationTimes.slice(-1000);
        }
        
        // Update average confidence score
        if (validationResult.isValid) {
            const totalPassed = this.validationStats.passedValidations;
            this.validationStats.averageConfidenceScore = 
                (this.validationStats.averageConfidenceScore * (totalPassed - 1) + validationResult.confidenceScore) / totalPassed;
        }
    }

    /**
     * Get validation statistics
     */
    getValidationStats() {
        const successRate = this.validationStats.totalValidations > 0 ? 
            this.validationStats.passedValidations / this.validationStats.totalValidations : 0;
        
        const avgValidationTime = this.validationStats.validationTimes.length > 0 ?
            this.validationStats.validationTimes.reduce((sum, time) => sum + time, 0) / this.validationStats.validationTimes.length : 0;
        
        return {
            ...this.validationStats,
            successRate,
            avgValidationTime,
            timestamp: Date.now()
        };
    }

    /**
     * Update baseline data for anomaly detection
     */
    updateBaselineData(listing, marketplace) {
        // Update price baseline
        if (listing.price) {
            const priceKey = `${marketplace}:price`;
            if (!this.baselineData.priceRanges.has(priceKey)) {
                this.baselineData.priceRanges.set(priceKey, []);
            }
            
            const priceData = this.baselineData.priceRanges.get(priceKey);
            priceData.push(parseFloat(listing.price));
            
            // Keep only last 1000 prices
            if (priceData.length > 1000) {
                priceData.splice(0, priceData.length - 1000);
            }
        }
        
        // Update seller baseline
        if (listing.seller_info && listing.seller_info.feedback_score) {
            const sellerKey = `${marketplace}:feedback_score`;
            if (!this.baselineData.sellerPatterns.has(sellerKey)) {
                this.baselineData.sellerPatterns.set(sellerKey, []);
            }
            
            const sellerData = this.baselineData.sellerPatterns.get(sellerKey);
            sellerData.push(parseInt(listing.seller_info.feedback_score));
            
            // Keep only last 1000 scores
            if (sellerData.length > 1000) {
                sellerData.splice(0, sellerData.length - 1000);
            }
        }
        
        // Update volume baselines
        const volumeFields = ['view_count', 'watcher_count', 'bid_count'];
        for (const field of volumeFields) {
            if (listing[field] !== undefined) {
                const volumeKey = `${marketplace}:${field}`;
                if (!this.baselineData.marketplaceNorms.has(volumeKey)) {
                    this.baselineData.marketplaceNorms.set(volumeKey, []);
                }
                
                const volumeData = this.baselineData.marketplaceNorms.get(volumeKey);
                volumeData.push(parseInt(listing[field]));
                
                // Keep only last 1000 values
                if (volumeData.length > 1000) {
                    volumeData.splice(0, volumeData.length - 1000);
                }
            }
        }
    }

    /**
     * Batch validate multiple listings
     */
    async batchValidate(listings, marketplace, options = {}) {
        const results = [];
        const batchSize = options.batchSize || 10;
        
        for (let i = 0; i < listings.length; i += batchSize) {
            const batch = listings.slice(i, i + batchSize);
            const batchPromises = batch.map(listing => 
                this.validateListing(listing, marketplace, options)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        isValid: false,
                        errors: [`Validation failed: ${result.reason.message}`],
                        warnings: [],
                        confidenceScore: 0,
                        anomalyScore: 1,
                        normalizedData: null
                    });
                }
            }
        }
        
        return results;
    }
}

module.exports = EnhancedDataValidationEngine; 