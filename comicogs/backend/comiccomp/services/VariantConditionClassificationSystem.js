/**
 * Advanced Variant & Condition Classification System for Comic Books
 * Implements AI-powered classification with rule-based patterns and ML preparation
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced Variant Classifier with comprehensive pattern matching
 */
class VariantClassifier {
    constructor() {
        this.variantPatterns = {
            cover: {
                'cover_a': /cover\s*a\b|variant\s*a\b|1st\s*cover|main\s*cover|reg(?:ular)?\s*cover/i,
                'cover_b': /cover\s*b\b|variant\s*b\b|2nd\s*cover|second\s*cover/i,
                'cover_c': /cover\s*c\b|variant\s*c\b|3rd\s*cover|third\s*cover/i,
                'cover_d': /cover\s*d\b|variant\s*d\b|4th\s*cover|fourth\s*cover/i,
                'cover_e': /cover\s*e\b|variant\s*e\b|5th\s*cover|fifth\s*cover/i,
                'virgin': /virgin\s*variant|virgin\s*cover|textless|no\s*text|text(?:less|free)/i,
                'sketch': /sketch\s*variant|sketch\s*cover|b&w|black\s*white|line\s*art/i,
                'blank': /blank\s*variant|blank\s*cover|white\s*cover/i
            },
            edition: {
                'direct': /direct\s*edition|direct\s*market|diamond|comic\s*shop|specialty/i,
                'newsstand': /newsstand|newsstand\s*edition|upc|universal\s*product|barcode/i,
                'first_print': /1st\s*print|first\s*print|1st\s*printing|original\s*print/i,
                'second_print': /2nd\s*print|second\s*print|2nd\s*printing/i,
                'third_print': /3rd\s*print|third\s*print|3rd\s*printing/i,
                'reprint': /reprint|reprinted|later\s*print|subsequent\s*print/i,
                'facsimile': /facsimile|reproduction|repro|reissue/i
            },
            special: {
                'foil': /foil\s*cover|metallic|reflective|shiny|silver\s*foil|gold\s*foil/i,
                'glow': /glow\s*in\s*dark|phosphorescent|glow|luminous/i,
                'hologram': /hologram|holographic|3d|lenticular/i,
                'die_cut': /die\s*cut|shaped\s*cover|cut\s*out/i,
                'embossed': /embossed|raised|textured|relief/i,
                'chromium': /chromium|chrome|metallic|prism/i,
                'acetate': /acetate|clear|transparent|overlay/i,
                'gatefold': /gatefold|fold\s*out|expandable/i
            },
            retailer: {
                'comic_con': /comic\s*con|sdcc|nycc|c2e2|emerald\s*city|wondercon/i,
                'retailer': /retailer\s*exclusive|store\s*exclusive|shop\s*exclusive/i,
                'convention': /convention\s*exclusive|con\s*exclusive|expo/i,
                'limited': /limited\s*edition|numbered|\/\d+|of\s*\d+/i,
                'midtown': /midtown|exclusive/i,
                'forbidden_planet': /forbidden\s*planet|fp\s*exclusive/i,
                'diamond': /diamond\s*exclusive|previews\s*exclusive/i
            },
            artist: {
                'artist_variant': /variant\s*by|cover\s*by|art\s*by|drawn\s*by/i,
                'incentive': /incentive|ratio|1:\d+|1\s*in\s*\d+|1\/\d+/i,
                'connecting': /connecting|continuation|part\s*\d+/i,
                'wraparound': /wraparound|wrap\s*around|full\s*cover/i
            },
            error: {
                'printing_error': /error|misprint|mistake|wrong|defect/i,
                'color_error': /color\s*error|wrong\s*color|miscolored/i,
                'missing_element': /missing|incomplete|partial/i,
                'double_cover': /double\s*cover|two\s*cover/i
            }
        };

        // Enhanced confidence thresholds
        this.confidenceThresholds = {
            'cover_a': 0.9, 'cover_b': 0.95, 'cover_c': 0.95, 'cover_d': 0.95,
            'virgin': 0.95, 'sketch': 0.9, 'blank': 0.85,
            'direct': 0.95, 'newsstand': 0.95, 'first_print': 0.85, 'facsimile': 0.9,
            'foil': 0.85, 'hologram': 0.9, 'incentive': 0.9, 'limited': 0.8,
            'artist_variant': 0.7, 'printing_error': 0.85
        };
    }

    /**
     * Classify variant with enhanced accuracy
     */
    classifyVariant(title, description = '', imageUrl = '', metadata = {}) {
        const text = `${title} ${description}`.toLowerCase();
        const results = {
            type: 'base',
            subtype: null,
            confidence: 0,
            attributes: [],
            patterns_matched: [],
            classification_method: 'rule_based',
            metadata: {}
        };

        let maxConfidence = 0;
        let bestMatch = null;
        let allMatches = [];

        // Enhanced pattern matching
        for (const [category, patterns] of Object.entries(this.variantPatterns)) {
            for (const [variant, pattern] of Object.entries(patterns)) {
                if (pattern.test(text)) {
                    const confidence = this.calculatePatternConfidence(text, pattern, variant);
                    
                    const match = {
                        category,
                        variant,
                        confidence,
                        pattern_matched: pattern.source
                    };

                    allMatches.push(match);
                    results.patterns_matched.push(match);

                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        bestMatch = match;
                    }
                }
            }
        }

        // Apply best match
        if (bestMatch) {
            results.type = bestMatch.variant;
            results.subtype = bestMatch.category;
            results.confidence = maxConfidence;
            results.attributes = this.extractVariantAttributes(text);
        }

        // Enhanced image analysis
        if (imageUrl) {
            const imageHints = this.analyzeImageUrl(imageUrl);
            if (imageHints.variant && imageHints.confidence > results.confidence) {
                results.type = imageHints.variant;
                results.confidence = imageHints.confidence;
                results.attributes.push('image_detected');
                results.classification_method = 'image_analysis';
            }
        }

        // Multiple variant detection
        const multipleVariants = this.detectMultipleVariants(allMatches);
        if (multipleVariants.length > 1) {
            results.metadata.multiple_variants = multipleVariants;
            results.metadata.is_multi_variant = true;
        }

        // Edge case handling
        results.metadata.edge_cases = this.detectEdgeCases(text, results);

        return results;
    }

    calculatePatternConfidence(text, pattern, variantType) {
        const matches = text.match(new RegExp(pattern.source, 'gi')) || [];
        let confidence = Math.min(matches.length * 0.3, 1.0);

        // Apply variant-specific confidence thresholds
        const threshold = this.confidenceThresholds[variantType] || 0.7;
        confidence = Math.max(confidence, threshold);

        // Context-based adjustments
        confidence = this.adjustConfidenceByContext(text, variantType, confidence);

        return Math.min(confidence, 1.0);
    }

    adjustConfidenceByContext(text, variantType, baseConfidence) {
        let confidence = baseConfidence;

        // Direct vs Newsstand specific logic
        if (variantType === 'direct' && text.includes('newsstand')) {
            confidence *= 0.3; // Strong conflict
        } else if (variantType === 'newsstand' && text.includes('direct')) {
            confidence *= 0.3; // Strong conflict
        }

        // Cover variant exclusivity
        const coverVariants = ['cover_a', 'cover_b', 'cover_c', 'cover_d'];
        if (coverVariants.includes(variantType)) {
            const otherCovers = coverVariants.filter(v => v !== variantType);
            const hasOtherCover = otherCovers.some(cover => 
                new RegExp(cover.replace('_', '\\s*'), 'i').test(text)
            );
            if (hasOtherCover) {
                confidence *= 0.5; // Reduce confidence if multiple covers mentioned
            }
        }

        // Boost confidence for strong contextual indicators
        if (variantType === 'incentive' && (text.includes('ratio') || text.includes('1:'))) {
            confidence = Math.min(confidence * 1.2, 1.0);
        }

        return confidence;
    }

    extractVariantAttributes(text) {
        const attributes = [];
        
        // Enhanced ratio detection
        const ratioPatterns = [
            /1[:\s](\d+)/i,
            /1\s*in\s*(\d+)/i,
            /1\/(\d+)/i,
            /(\d+)\s*to\s*1/i
        ];

        for (const pattern of ratioPatterns) {
            const match = text.match(pattern);
            if (match) {
                const ratio = match[1] || match[2];
                attributes.push(`ratio_1_in_${ratio}`);
                break;
            }
        }

        // Enhanced artist detection
        const artistPatterns = [
            /(?:variant|cover|art)\s*by\s*([a-z\s\.]+?)(?:\s|$|,)/i,
            /([a-z\s\.]+?)\s*variant/i
        ];

        for (const pattern of artistPatterns) {
            const match = text.match(pattern);
            if (match) {
                const artist = match[1].trim().replace(/\s+/g, '_');
                if (artist.length > 2 && artist.length < 30) {
                    attributes.push(`artist_${artist}`);
                    break;
                }
            }
        }

        // Numbering detection
        const numberPatterns = [
            /(\d+)\s*of\s*(\d+)/i,
            /#(\d+)\/(\d+)/i,
            /limited\s*to\s*(\d+)/i
        ];

        for (const pattern of numberPatterns) {
            const match = text.match(pattern);
            if (match) {
                attributes.push('numbered_edition');
                if (match[2] || match[4]) {
                    attributes.push(`total_${match[2] || match[4]}`);
                }
                break;
            }
        }

        // Convention detection
        const conventions = ['sdcc', 'nycc', 'c2e2', 'wondercon', 'emerald city'];
        conventions.forEach(con => {
            if (text.includes(con)) {
                attributes.push(`convention_${con}`);
            }
        });

        return attributes;
    }

    analyzeImageUrl(imageUrl) {
        const url = imageUrl.toLowerCase();
        const hints = { variant: null, confidence: 0 };

        const urlPatterns = {
            'cover_b': /cover[-_]?b|variant[-_]?b|coverb/,
            'cover_c': /cover[-_]?c|variant[-_]?c|coverc/,
            'virgin': /virgin|textless|notext/,
            'sketch': /sketch|bw|blackwhite/,
            'foil': /foil|metallic|chrome/,
            'incentive': /incentive|ratio/
        };

        for (const [variant, pattern] of Object.entries(urlPatterns)) {
            if (pattern.test(url)) {
                hints.variant = variant;
                hints.confidence = 0.75;
                break;
            }
        }

        return hints;
    }

    detectMultipleVariants(matches) {
        const variants = matches.filter(m => m.confidence > 0.6);
        return variants.map(v => ({
            type: v.variant,
            category: v.category,
            confidence: v.confidence
        }));
    }

    detectEdgeCases(text, results) {
        const edgeCases = [];

        // Unknown variant indicators
        if (text.includes('variant') && results.type === 'base') {
            edgeCases.push('unclassified_variant');
        }

        // Conflicting information
        if (text.includes('direct') && text.includes('newsstand')) {
            edgeCases.push('edition_conflict');
        }

        // Multiple covers mentioned
        const coverCount = (text.match(/cover\s*[a-e]/gi) || []).length;
        if (coverCount > 1) {
            edgeCases.push('multiple_covers_mentioned');
        }

        return edgeCases;
    }
}

/**
 * Advanced Condition Classifier with grading service recognition
 */
class ConditionClassifier {
    constructor() {
        this.gradingServices = {
            'CGC': {
                pattern: /CGC\s*(\d+(?:\.\d+)?)/i,
                confidence: 0.95,
                scale: 10.0
            },
            'CBCS': {
                pattern: /CBCS\s*(\d+(?:\.\d+)?)/i,
                confidence: 0.95,
                scale: 10.0
            },
            'PGX': {
                pattern: /PGX\s*(\d+(?:\.\d+)?)/i,
                confidence: 0.9,
                scale: 10.0
            },
            'CGG': {
                pattern: /CGG\s*(\d+(?:\.\d+)?)/i,
                confidence: 0.85,
                scale: 10.0
            }
        };

        this.conditionKeywords = {
            'Mint': {
                patterns: [/mint(?!\s*condition)/i, /m\b/i],
                grade_range: [9.8, 10.0],
                confidence: 0.9
            },
            'Near Mint': {
                patterns: [/near\s*mint/i, /nm/i, /near-mint/i],
                grade_range: [9.2, 9.8],
                confidence: 0.9
            },
            'Very Fine': {
                patterns: [/very\s*fine/i, /vf/i, /very-fine/i],
                grade_range: [7.5, 9.0],
                confidence: 0.85
            },
            'Fine': {
                patterns: [/\bfine\b/i, /\bf\b/i],
                grade_range: [6.0, 7.5],
                confidence: 0.8
            },
            'Very Good': {
                patterns: [/very\s*good/i, /vg/i, /very-good/i],
                grade_range: [4.0, 6.0],
                confidence: 0.8
            },
            'Good': {
                patterns: [/\bgood\b/i, /\bg\b/i],
                grade_range: [2.0, 4.0],
                confidence: 0.75
            },
            'Fair': {
                patterns: [/\bfair\b/i, /\bfr\b/i],
                grade_range: [1.5, 2.0],
                confidence: 0.8
            },
            'Poor': {
                patterns: [/\bpoor\b/i, /\bpr\b/i],
                grade_range: [0.5, 1.5],
                confidence: 0.8
            }
        };

        this.specialConditions = {
            'Raw': {
                patterns: [/raw/i, /ungraded/i, /not\s*graded/i],
                confidence: 0.9
            },
            'Restored': {
                patterns: [/restored/i, /resto/i, /restoration/i],
                confidence: 0.95
            },
            'Qualified': {
                patterns: [/qualified/i, /qual/i, /\(q\)/i],
                confidence: 0.9
            },
            'Signature Series': {
                patterns: [/signature\s*series/i, /ss/i, /signed/i],
                confidence: 0.85
            }
        };
    }

    /**
     * Classify condition with grading service detection
     */
    classifyCondition(title, description = '', metadata = {}) {
        const text = `${title} ${description}`.toLowerCase();
        const results = {
            condition: 'Unknown',
            grade: null,
            grading_service: null,
            confidence: 0,
            is_graded: false,
            special_designations: [],
            classification_method: 'rule_based',
            metadata: {}
        };

        // 1. Check for grading services first (highest priority)
        const gradingResult = this.detectGradingService(text);
        if (gradingResult.service) {
            results.grading_service = gradingResult.service;
            results.grade = gradingResult.grade;
            results.condition = `${gradingResult.service} ${gradingResult.grade}`;
            results.confidence = gradingResult.confidence;
            results.is_graded = true;
            results.classification_method = 'grading_service';
        }

        // 2. Check for special conditions
        const specialDesignations = this.detectSpecialConditions(text);
        results.special_designations = specialDesignations;

        // 3. If not graded, classify by condition keywords
        if (!results.is_graded) {
            const conditionResult = this.detectConditionKeywords(text);
            if (conditionResult.condition) {
                results.condition = conditionResult.condition;
                results.confidence = conditionResult.confidence;
                results.grade = this.estimateGradeFromCondition(conditionResult.condition);
                results.classification_method = 'condition_keyword';
            }
        }

        // 4. Handle edge cases and conflicts
        results.metadata.edge_cases = this.detectConditionEdgeCases(text, results);

        // 5. Apply confidence adjustments
        results.confidence = this.adjustConditionConfidence(text, results);

        return results;
    }

    detectGradingService(text) {
        for (const [service, config] of Object.entries(this.gradingServices)) {
            const match = text.match(config.pattern);
            if (match) {
                const grade = parseFloat(match[1]);
                if (grade >= 0.5 && grade <= config.scale) {
                    return {
                        service,
                        grade,
                        confidence: config.confidence
                    };
                }
            }
        }
        return { service: null, grade: null, confidence: 0 };
    }

    detectConditionKeywords(text) {
        let bestMatch = { condition: null, confidence: 0 };

        for (const [condition, config] of Object.entries(this.conditionKeywords)) {
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    if (config.confidence > bestMatch.confidence) {
                        bestMatch = {
                            condition,
                            confidence: config.confidence
                        };
                    }
                }
            }
        }

        return bestMatch;
    }

    detectSpecialConditions(text) {
        const designations = [];

        for (const [designation, config] of Object.entries(this.specialConditions)) {
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    designations.push({
                        type: designation,
                        confidence: config.confidence
                    });
                    break;
                }
            }
        }

        return designations;
    }

    estimateGradeFromCondition(condition) {
        const conditionConfig = this.conditionKeywords[condition];
        if (conditionConfig && conditionConfig.grade_range) {
            const [min, max] = conditionConfig.grade_range;
            return (min + max) / 2;
        }
        return null;
    }

    detectConditionEdgeCases(text, results) {
        const edgeCases = [];

        // Multiple grading services mentioned
        const serviceCount = Object.keys(this.gradingServices).filter(service =>
            this.gradingServices[service].pattern.test(text)
        ).length;

        if (serviceCount > 1) {
            edgeCases.push('multiple_grading_services');
        }

        // Grade without service
        const gradeWithoutService = /\b(\d+(?:\.\d+)?)\b/.test(text) && 
                                   !results.is_graded && 
                                   results.condition === 'Unknown';
        if (gradeWithoutService) {
            edgeCases.push('grade_without_service');
        }

        // Conflicting condition terms
        const conditionTerms = Object.keys(this.conditionKeywords).filter(condition =>
            this.conditionKeywords[condition].patterns.some(pattern => pattern.test(text))
        );

        if (conditionTerms.length > 1) {
            edgeCases.push('multiple_condition_terms');
        }

        return edgeCases;
    }

    adjustConditionConfidence(text, results) {
        let confidence = results.confidence;

        // Boost confidence for complete grading information
        if (results.is_graded && results.grade) {
            confidence = Math.min(confidence * 1.1, 1.0);
        }

        // Reduce confidence for edge cases
        if (results.metadata.edge_cases.length > 0) {
            confidence *= 0.8;
        }

        // Boost confidence for additional context
        if (text.includes('slab') && results.is_graded) {
            confidence = Math.min(confidence * 1.05, 1.0);
        }

        return Math.min(Math.max(confidence, 0), 1.0);
    }
}

/**
 * Unified Variant & Condition Classification System
 */
class VariantConditionClassificationSystem {
    constructor(config = {}) {
        this.config = {
            accuracyThreshold: config.accuracyThreshold || 0.9,
            enableLogging: config.enableLogging || false,
            cachePath: config.cachePath || './classification_cache.json',
            mlModelPath: config.mlModelPath || null,
            ...config
        };

        this.variantClassifier = new VariantClassifier();
        this.conditionClassifier = new ConditionClassifier();
        this.cache = new Map();
        this.stats = {
            total_classifications: 0,
            successful_classifications: 0,
            accuracy_rate: 0,
            classification_times: []
        };
    }

    /**
     * Main classification method combining variant and condition analysis
     */
    async classify(comicData) {
        const startTime = Date.now();
        
        try {
            const {
                title = '',
                description = '',
                imageUrl = '',
                metadata = {}
            } = comicData;

            // Create cache key
            const cacheKey = this.createCacheKey(title, description, imageUrl);
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Perform classification
            const variantResult = this.variantClassifier.classifyVariant(
                title, description, imageUrl, metadata
            );

            const conditionResult = this.conditionClassifier.classifyCondition(
                title, description, metadata
            );

            // Combine results
            const classification = {
                comic_data: {
                    title,
                    description,
                    imageUrl,
                    metadata
                },
                variant: variantResult,
                condition: conditionResult,
                overall_confidence: this.calculateOverallConfidence(variantResult, conditionResult),
                classification_timestamp: new Date().toISOString(),
                processing_time_ms: Date.now() - startTime,
                system_version: '1.0.0'
            };

            // Enhanced validation
            classification.validation = this.validateClassification(classification);

            // Cache result
            this.cache.set(cacheKey, classification);

            // Update statistics
            this.updateStatistics(classification, Date.now() - startTime);

            if (this.config.enableLogging) {
                console.log(`✅ Classified: ${title} -> Variant: ${variantResult.type} (${variantResult.confidence.toFixed(2)}), Condition: ${conditionResult.condition} (${conditionResult.confidence.toFixed(2)})`);
            }

            return classification;

        } catch (error) {
            console.error('❌ Classification error:', error);
            return this.createErrorResult(comicData, error);
        }
    }

    /**
     * Batch classification for multiple comics
     */
    async classifyBatch(comicsData, options = {}) {
        const results = [];
        const batchSize = options.batchSize || 10;
        
        console.log(`📊 Processing batch of ${comicsData.length} comics...`);

        for (let i = 0; i < comicsData.length; i += batchSize) {
            const batch = comicsData.slice(i, i + batchSize);
            const batchPromises = batch.map(comic => this.classify(comic));
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`❌ Failed to classify comic ${i + index}:`, result.reason);
                    results.push(this.createErrorResult(batch[index], result.reason));
                }
            });

            // Progress logging
            if (this.config.enableLogging) {
                console.log(`📈 Processed ${Math.min(i + batchSize, comicsData.length)}/${comicsData.length} comics`);
            }
        }

        return {
            results,
            summary: this.generateBatchSummary(results),
            statistics: this.getStatistics()
        };
    }

    calculateOverallConfidence(variantResult, conditionResult) {
        // Weighted average with variant being slightly more important for overall confidence
        const variantWeight = 0.6;
        const conditionWeight = 0.4;
        
        return (variantResult.confidence * variantWeight) + (conditionResult.confidence * conditionWeight);
    }

    validateClassification(classification) {
        const validation = {
            is_valid: true,
            issues: [],
            confidence_level: 'high'
        };

        // Check minimum confidence thresholds
        if (classification.variant.confidence < 0.5) {
            validation.issues.push('low_variant_confidence');
        }

        if (classification.condition.confidence < 0.5) {
            validation.issues.push('low_condition_confidence');
        }

        if (classification.overall_confidence < this.config.accuracyThreshold) {
            validation.confidence_level = 'low';
        } else if (classification.overall_confidence < 0.95) {
            validation.confidence_level = 'medium';
        }

        // Check for logical inconsistencies
        if (classification.variant.type === 'base' && classification.variant.confidence > 0.8) {
            validation.issues.push('high_confidence_base_variant');
        }

        if (classification.condition.condition === 'Unknown' && classification.condition.confidence > 0.7) {
            validation.issues.push('high_confidence_unknown_condition');
        }

        validation.is_valid = validation.issues.length === 0;

        return validation;
    }

    createCacheKey(title, description, imageUrl) {
        const input = `${title}|${description}|${imageUrl}`;
        return require('crypto').createHash('md5').update(input).digest('hex');
    }

    createErrorResult(comicData, error) {
        return {
            comic_data: comicData,
            variant: {
                type: 'unknown',
                confidence: 0,
                error: error.message
            },
            condition: {
                condition: 'Unknown',
                confidence: 0,
                error: error.message
            },
            overall_confidence: 0,
            classification_timestamp: new Date().toISOString(),
            error: true,
            error_message: error.message
        };
    }

    updateStatistics(classification, processingTime) {
        this.stats.total_classifications++;
        this.stats.classification_times.push(processingTime);
        
        if (classification.overall_confidence >= this.config.accuracyThreshold) {
            this.stats.successful_classifications++;
        }
        
        this.stats.accuracy_rate = this.stats.successful_classifications / this.stats.total_classifications;
    }

    generateBatchSummary(results) {
        const summary = {
            total_processed: results.length,
            successful: results.filter(r => !r.error).length,
            errors: results.filter(r => r.error).length,
            average_confidence: 0,
            variant_distribution: {},
            condition_distribution: {}
        };

        const validResults = results.filter(r => !r.error);

        if (validResults.length > 0) {
            summary.average_confidence = validResults.reduce((sum, r) => sum + r.overall_confidence, 0) / validResults.length;

            // Variant distribution
            validResults.forEach(r => {
                const variant = r.variant.type;
                summary.variant_distribution[variant] = (summary.variant_distribution[variant] || 0) + 1;
            });

            // Condition distribution
            validResults.forEach(r => {
                const condition = r.condition.condition;
                summary.condition_distribution[condition] = (summary.condition_distribution[condition] || 0) + 1;
            });
        }

        return summary;
    }

    getStatistics() {
        const avgProcessingTime = this.stats.classification_times.length > 0
            ? this.stats.classification_times.reduce((a, b) => a + b, 0) / this.stats.classification_times.length
            : 0;

        return {
            ...this.stats,
            average_processing_time_ms: avgProcessingTime
        };
    }

    /**
     * Validate system accuracy against known test data
     */
    async validateAccuracy(testData) {
        console.log(`🧪 Validating accuracy against ${testData.length} test cases...`);
        
        const results = await this.classifyBatch(testData);
        let correctVariants = 0;
        let correctConditions = 0;

        results.results.forEach((result, index) => {
            const expected = testData[index].expected;
            
            if (expected.variant && result.variant.type === expected.variant) {
                correctVariants++;
            }
            
            if (expected.condition && result.condition.condition === expected.condition) {
                correctConditions++;
            }
        });

        const variantAccuracy = correctVariants / testData.length;
        const conditionAccuracy = correctConditions / testData.length;
        const overallAccuracy = (correctVariants + correctConditions) / (testData.length * 2);

        return {
            variant_accuracy: variantAccuracy,
            condition_accuracy: conditionAccuracy,
            overall_accuracy: overallAccuracy,
            meets_threshold: overallAccuracy >= this.config.accuracyThreshold,
            details: results
        };
    }

    /**
     * Prepare for ML integration (future enhancement)
     */
    prepareMlIntegration() {
        return {
            feature_extractors: {
                text_features: this.extractTextFeatures.bind(this),
                image_features: this.extractImageFeatures.bind(this),
                metadata_features: this.extractMetadataFeatures.bind(this)
            },
            training_data_format: this.getTrainingDataFormat(),
            model_interface: this.getMlModelInterface()
        };
    }

    extractTextFeatures(title, description) {
        // Placeholder for ML feature extraction
        return {
            title_length: title.length,
            description_length: description.length,
            has_variant_keywords: /variant|cover|edition/i.test(`${title} ${description}`),
            has_condition_keywords: /mint|fine|good|cgc|cbcs/i.test(`${title} ${description}`)
        };
    }

    extractImageFeatures(imageUrl) {
        // Placeholder for image feature extraction
        return {
            has_image: !!imageUrl,
            image_url_hints: this.variantClassifier.analyzeImageUrl(imageUrl)
        };
    }

    extractMetadataFeatures(metadata) {
        // Placeholder for metadata feature extraction
        return {
            has_metadata: Object.keys(metadata).length > 0,
            publisher: metadata.publisher || null,
            year: metadata.year || null
        };
    }

    getTrainingDataFormat() {
        return {
            input: {
                title: 'string',
                description: 'string',
                imageUrl: 'string',
                metadata: 'object'
            },
            output: {
                variant_type: 'string',
                variant_confidence: 'number',
                condition: 'string',
                condition_confidence: 'number'
            }
        };
    }

    getMlModelInterface() {
        return {
            predict: async (features) => {
                // Placeholder for ML model prediction
                throw new Error('ML model not implemented yet');
            },
            train: async (trainingData) => {
                // Placeholder for ML model training
                throw new Error('ML training not implemented yet');
            }
        };
    }
}

module.exports = {
    VariantClassifier,
    ConditionClassifier,
    VariantConditionClassificationSystem
}; 