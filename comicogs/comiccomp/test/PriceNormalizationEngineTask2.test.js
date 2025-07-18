const PriceNormalizationEngine = require('../services/PriceNormalizationEngine');

/**
 * Comprehensive Test Suite for Task 2: Price Normalization Engine
 * 
 * Tests all acceptance criteria:
 * 1. Filter out listings without photos or from low-feedback sellers
 * 2. Normalize prices by grading tier (Raw, CGC 9.8, etc.)
 * 3. Identify and categorize variant types
 * 4. Distinguish between auction and fixed-price sales
 * 5. Remove outliers and suspicious pricing data
 * 6. Generate confidence scores for normalized prices
 */
describe('Task 2: Price Normalization Engine - All Acceptance Criteria', () => {
    let engine;
    
    beforeEach(() => {
        engine = new PriceNormalizationEngine({
            minSellerFeedbackScore: 100,
            minSellerPositiveFeedbackPercent: 95,
            minDataPoints: 3,
            outlierThreshold: 2.5
        });
    });

    // Acceptance Criteria 1: Filter out listings without photos or low-feedback sellers
    describe('AC1: Filter listings without photos or low-feedback sellers', () => {
        test('should filter out listings without images', async () => {
            const rawData = [
                createValidListing({ id: '1', imageUrl: 'https://example.com/image1.jpg' }),
                createValidListing({ id: '2', imageUrl: '' }), // No image
                createValidListing({ id: '3', imageUrl: null }), // No image
                createValidListing({ id: '4', imageUrl: 'https://example.com/image4.jpg' })
            ];

            const cleanedData = engine.cleanPricingData(rawData);
            
            expect(cleanedData).toHaveLength(2);
            expect(cleanedData.map(item => item.id)).toEqual(['1', '4']);
        });

        test('should filter out sellers with low feedback scores', async () => {
            const rawData = [
                createValidListing({ 
                    id: '1', 
                    seller: { feedbackScore: 150, positiveFeedbackPercent: 98 }
                }),
                createValidListing({ 
                    id: '2', 
                    seller: { feedbackScore: 50, positiveFeedbackPercent: 98 } // Low feedback
                }),
                createValidListing({ 
                    id: '3', 
                    seller: { feedbackScore: 200, positiveFeedbackPercent: 90 } // Low positive %
                }),
                createValidListing({ 
                    id: '4', 
                    seller: { feedbackScore: 300, positiveFeedbackPercent: 97 }
                })
            ];

            const cleanedData = engine.cleanPricingData(rawData);
            
            expect(cleanedData).toHaveLength(2);
            expect(cleanedData.map(item => item.id)).toEqual(['1', '4']);
        });

        test('should filter out suspicious listings', async () => {
            const rawData = [
                createValidListing({ id: '1', title: 'Amazing Spider-Man #1' }),
                createValidListing({ id: '2', title: 'Amazing Spider-Man #1 REPRODUCTION COPY' }),
                createValidListing({ id: '3', title: 'Amazing Spider-Man #1', price: 999999 }), // Extreme price
                createValidListing({ id: '4', title: 'Amazing Spider-Man #1', description: 'printed at home' })
            ];

            const cleanedData = engine.cleanPricingData(rawData);
            
            expect(cleanedData).toHaveLength(1);
            expect(cleanedData[0].id).toBe('1');
        });
    });

    // Acceptance Criteria 2: Normalize prices by grading tier
    describe('AC2: Normalize prices by grading tier', () => {
        test('should apply correct grade multipliers for CGC grades', () => {
            const listing98 = { condition: 'CGC 9.8', grade: 9.8, price: 200 };
            const listing96 = { condition: 'CGC 9.6', grade: 9.6, price: 180 };
            const listingRaw = { condition: 'Near Mint', grade: null, price: 100 };

            const multiplier98 = engine.getConditionMultiplier(listing98.condition, listing98.grade);
            const multiplier96 = engine.getConditionMultiplier(listing96.condition, listing96.grade);
            const multiplierRaw = engine.getConditionMultiplier(listingRaw.condition, listingRaw.grade);

            // CGC 9.8 should have higher multiplier than 9.6, which should be higher than raw
            expect(multiplier98).toBeGreaterThan(multiplier96);
            expect(multiplier96).toBeGreaterThan(multiplierRaw);
            
            // Verify specific expected ranges
            expect(multiplier98).toBeCloseTo(2.0, 1); // CGC 9.8 ≈ 2.0x
            expect(multiplier96).toBeCloseTo(1.8, 1); // CGC 9.6 ≈ 1.8x
            expect(multiplierRaw).toBeCloseTo(1.0, 1); // Near Mint baseline ≈ 1.0x
        });

        test('should normalize prices to base condition correctly', () => {
            const listings = [
                { price: 200, condition: 'CGC 9.8', grade: 9.8 },
                { price: 100, condition: 'Near Mint', grade: null },
                { price: 60, condition: 'Very Fine', grade: null }
            ];

            const normalizedListings = engine.normalizeToBaseCondition(listings);

            // All base prices should be in similar range after normalization
            const basePrices = normalizedListings.map(l => l.basePriceNM);
            expect(basePrices[0]).toBeCloseTo(100, 0); // 200 / 2.0 ≈ 100
            expect(basePrices[1]).toBeCloseTo(100, 0); // 100 / 1.0 = 100
            expect(basePrices[2]).toBeCloseTo(75, 0);  // 60 / 0.8 = 75
        });
    });

    // Acceptance Criteria 3: Identify and categorize variant types
    describe('AC3: Identify and categorize variant types', () => {
        test('should identify cover variants correctly', () => {
            const testCases = [
                { title: 'Amazing Spider-Man #1 Cover A', expected: 'cover_a' },
                { title: 'Amazing Spider-Man #1 Variant B', expected: 'cover_b' },
                { title: 'Amazing Spider-Man #1 Virgin Cover', expected: 'virgin' },
                { title: 'Amazing Spider-Man #1 Sketch Variant', expected: 'sketch' },
                { title: 'Amazing Spider-Man #1', expected: 'base' }
            ];

            testCases.forEach(testCase => {
                const result = engine.variantClassifier.classifyVariant(testCase.title);
                expect(result.type).toBe(testCase.expected);
            });
        });

        test('should identify edition types correctly', () => {
            const testCases = [
                { title: 'Amazing Spider-Man #1 Direct Edition', expected: 'direct' },
                { title: 'Amazing Spider-Man #1 Newsstand', expected: 'newsstand' },
                { title: 'Amazing Spider-Man #1 1st Print', expected: 'first_print' },
                { title: 'Amazing Spider-Man #1 2nd Print', expected: 'second_print' }
            ];

            testCases.forEach(testCase => {
                const result = engine.variantClassifier.classifyVariant(testCase.title);
                expect(result.type).toBe(testCase.expected);
                expect(result.confidence).toBeGreaterThan(0.7);
            });
        });

        test('should identify special edition types correctly', () => {
            const testCases = [
                { title: 'Amazing Spider-Man #1 Foil Cover', expected: 'foil' },
                { title: 'Amazing Spider-Man #1 Hologram Cover', expected: 'hologram' },
                { title: 'Amazing Spider-Man #1 1:25 Incentive', expected: 'incentive' }
            ];

            testCases.forEach(testCase => {
                const result = engine.variantClassifier.classifyVariant(testCase.title);
                expect(result.type).toBe(testCase.expected);
                expect(result.confidence).toBeGreaterThan(0.8);
            });
        });
    });

    // Acceptance Criteria 4: Distinguish between auction and fixed-price sales
    describe('AC4: Distinguish between auction and fixed-price sales', () => {
        test('should separate auction and fixed-price listings', async () => {
            const rawData = [
                createValidListing({ id: '1', sale_type: 'auction', price: 95 }),
                createValidListing({ id: '2', sale_type: 'fixed', price: 100 }),
                createValidListing({ id: '3', sale_type: 'auction', price: 90 }),
                createValidListing({ id: '4', sale_type: 'fixed', price: 105 }),
                createValidListing({ id: '5', price: 110 }) // Default to fixed
            ];

            const result = await engine.normalizePricingData(rawData);
            const comicKey = Object.keys(result)[0];
            const analysis = result[comicKey];

            expect(analysis.status).toBe('success');
            expect(analysis.data.auction).toBeDefined();
            expect(analysis.data.fixedPrice).toBeDefined();
            
            // Should have 2 auction listings and 3 fixed-price listings
            expect(analysis.data.auction.rawListingCount).toBe(2);
            expect(analysis.data.fixedPrice.rawListingCount).toBe(3);
        });

        test('should handle empty sale type categories gracefully', async () => {
            const rawData = [
                createValidListing({ id: '1', sale_type: 'auction', price: 95 }),
                createValidListing({ id: '2', sale_type: 'auction', price: 90 }),
                createValidListing({ id: '3', sale_type: 'auction', price: 100 })
            ];

            const result = await engine.normalizePricingData(rawData);
            const comicKey = Object.keys(result)[0];
            const analysis = result[comicKey];

            expect(analysis.data.auction.rawListingCount).toBe(3);
            expect(analysis.data.fixedPrice).toEqual({});
        });
    });

    // Acceptance Criteria 5: Remove outliers and suspicious pricing data
    describe('AC5: Remove outliers and suspicious pricing data', () => {
        test('should remove statistical outliers using IQR method', () => {
            const listings = [
                { adjustedBasePriceNM: 95 },
                { adjustedBasePriceNM: 100 },
                { adjustedBasePriceNM: 102 },
                { adjustedBasePriceNM: 98 },
                { adjustedBasePriceNM: 105 },
                { adjustedBasePriceNM: 97 },
                { adjustedBasePriceNM: 500 }, // Outlier
                { adjustedBasePriceNM: 103 },
                { adjustedBasePriceNM: 99 },
                { adjustedBasePriceNM: 10 }   // Outlier
            ];

            const filteredListings = engine.removeOutliers(listings);
            
            // Should remove the extreme outliers (500 and 10)
            expect(filteredListings.length).toBeLessThan(listings.length);
            const prices = filteredListings.map(l => l.adjustedBasePriceNM);
            expect(Math.max(...prices)).toBeLessThan(200);
            expect(Math.min(...prices)).toBeGreaterThan(90);
        });

        test('should detect suspicious pricing patterns', () => {
            const suspiciousListings = [
                createValidListing({ price: 0.01 }), // Too cheap
                createValidListing({ price: 999999 }), // Too expensive
                createValidListing({ title: 'Amazing Spider-Man #1 FAKE REPRODUCTION' }),
                createValidListing({ description: 'printed at home for display' })
            ];

            suspiciousListings.forEach(listing => {
                const isSuspicious = engine.detectSuspiciousListing(listing);
                expect(isSuspicious).toBe(true);
                expect(listing.suspiciousFlags).toBeDefined();
                expect(listing.suspiciousFlags.length).toBeGreaterThan(0);
            });
        });

        test('should detect shill bidding patterns', () => {
            const listingWithShillBidding = {
                bidHistory: [
                    { bidder: 'user1', amount: 50 },
                    { bidder: 'user2', amount: 55 },
                    { bidder: 'user1', amount: 60 },
                    { bidder: 'user1', amount: 65 },
                    { bidder: 'user1', amount: 70 },
                    { bidder: 'user3', amount: 75 }
                ]
            };

            const isShillBidding = engine.detectShillBidding(listingWithShillBidding);
            expect(isShillBidding).toBe(true); // user1 has 4/6 = 67% of bids > 30% threshold
        });
    });

    // Acceptance Criteria 6: Generate confidence scores for normalized prices
    describe('AC6: Generate confidence scores for normalized prices', () => {
        test('should calculate multi-factor confidence scores', () => {
            const listings = createDiverseListings();
            const statistics = { coefficientOfVariation: 0.2, count: 15 };
            const trends = { direction: 'stable', correlation: 0.8 };

            const confidenceScore = engine.calculateEnhancedConfidenceScore(listings, statistics, trends);

            expect(confidenceScore).toBeDefined();
            expect(confidenceScore.overall).toBeGreaterThan(0);
            expect(confidenceScore.overall).toBeLessThanOrEqual(1);
            
            expect(confidenceScore.breakdown).toBeDefined();
            expect(confidenceScore.breakdown.dataVolume).toBeDefined();
            expect(confidenceScore.breakdown.marketplaceDiversity).toBeDefined();
            expect(confidenceScore.breakdown.priceConsistency).toBeDefined();
            expect(confidenceScore.breakdown.sellerQuality).toBeDefined();
            
            expect(confidenceScore.factors).toBeDefined();
            expect(confidenceScore.factors.listings).toBe(listings.length);
            expect(confidenceScore.factors.marketplaces).toBeGreaterThan(0);
        });

        test('should reward high data quality with higher confidence', () => {
            const highQualityListings = createHighQualityListings(20);
            const lowQualityListings = createLowQualityListings(5);

            const highQualityStats = { coefficientOfVariation: 0.1, count: 20 };
            const lowQualityStats = { coefficientOfVariation: 0.8, count: 5 };

            const highConfidence = engine.calculateEnhancedConfidenceScore(
                highQualityListings, highQualityStats, {}
            );
            const lowConfidence = engine.calculateEnhancedConfidenceScore(
                lowQualityListings, lowQualityStats, {}
            );

            expect(highConfidence.overall).toBeGreaterThan(lowConfidence.overall);
        });

        test('should penalize high price volatility', () => {
            const stableListings = createStablePriceListings();
            const volatileListings = createVolatilePriceListings();

            const stableStats = { coefficientOfVariation: 0.1 };
            const volatileStats = { coefficientOfVariation: 0.9 };

            const stableConfidence = engine.calculateEnhancedConfidenceScore(
                stableListings, stableStats, {}
            );
            const volatileConfidence = engine.calculateEnhancedConfidenceScore(
                volatileListings, volatileStats, {}
            );

            expect(stableConfidence.breakdown.priceConsistency)
                .toBeGreaterThan(volatileConfidence.breakdown.priceConsistency);
        });

        test('should include confidence scores in normalized results', async () => {
            const rawData = createDiverseListings();
            const result = await engine.normalizePricingData(rawData);
            const comicKey = Object.keys(result)[0];
            const analysis = result[comicKey];

            if (analysis.data.fixedPrice && Object.keys(analysis.data.fixedPrice).length > 0) {
                expect(analysis.data.fixedPrice.confidence).toBeDefined();
                expect(analysis.data.fixedPrice.confidence.overall).toBeGreaterThan(0);
                expect(analysis.data.fixedPrice.confidence.overall).toBeLessThanOrEqual(1);
            }
        });
    });

    // Integration test: All acceptance criteria working together
    describe('Integration: All acceptance criteria working together', () => {
        test('should process realistic comic pricing data through complete pipeline', async () => {
            const rawData = createRealisticTestData();
            const result = await engine.normalizePricingData(rawData);

            expect(Object.keys(result).length).toBeGreaterThan(0);

            Object.values(result).forEach(comicAnalysis => {
                if (comicAnalysis.status === 'success') {
                    // Verify all processing steps completed
                    const data = comicAnalysis.data;
                    
                    if (data.fixedPrice && Object.keys(data.fixedPrice).length > 0) {
                        expect(data.fixedPrice.statistics).toBeDefined();
                        expect(data.fixedPrice.confidence).toBeDefined();
                        expect(data.fixedPrice.dataQuality).toBeDefined();
                        expect(data.fixedPrice.insights).toBeDefined();
                    }
                    
                    if (data.auction && Object.keys(data.auction).length > 0) {
                        expect(data.auction.statistics).toBeDefined();
                        expect(data.auction.confidence).toBeDefined();
                        expect(data.auction.dataQuality).toBeDefined();
                        expect(data.auction.insights).toBeDefined();
                    }
                }
            });
        });
    });
});

// Helper functions for creating test data
function createValidListing(overrides = {}) {
    return {
        id: 'test-' + Math.random(),
        title: 'Amazing Spider-Man #1',
        price: 100,
        marketplace: 'ebay',
        scrapedAt: new Date(),
        imageUrl: 'https://example.com/image.jpg',
        seller: {
            feedbackScore: 200,
            positiveFeedbackPercent: 98,
            accountAge: 365
        },
        condition: 'Near Mint',
        grade: null,
        sale_type: 'fixed',
        description: 'Excellent condition comic book',
        series: 'Amazing Spider-Man',
        issue: '1',
        publisher: 'Marvel',
        ...overrides
    };
}

function createDiverseListings() {
    const marketplaces = ['ebay', 'whatnot', 'comicconnect', 'heritage'];
    const conditions = ['Mint', 'Near Mint', 'Very Fine', 'Fine'];
    const listings = [];

    for (let i = 0; i < 12; i++) {
        listings.push(createValidListing({
            id: `diverse-${i}`,
            marketplace: marketplaces[i % marketplaces.length],
            condition: conditions[i % conditions.length],
            price: 95 + (i % 10),
            seller: {
                feedbackScore: 150 + (i * 50),
                positiveFeedbackPercent: 95 + (i % 5),
                accountAge: 100 + (i * 30)
            },
            scrapedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }));
    }

    return listings;
}

function createHighQualityListings(count) {
    return Array.from({ length: count }, (_, i) => createValidListing({
        id: `high-quality-${i}`,
        marketplace: ['ebay', 'comicconnect', 'heritage'][i % 3],
        price: 98 + (i % 5), // Low variance
        seller: {
            feedbackScore: 500 + i,
            positiveFeedbackPercent: 98 + (i % 2),
            accountAge: 1000 + i
        }
    }));
}

function createLowQualityListings(count) {
    return Array.from({ length: count }, (_, i) => createValidListing({
        id: `low-quality-${i}`,
        marketplace: 'ebay',
        price: 50 + (i * 20), // High variance
        seller: {
            feedbackScore: 100 + i,
            positiveFeedbackPercent: 95,
            accountAge: 30 + i
        }
    }));
}

function createStablePriceListings() {
    return Array.from({ length: 10 }, (_, i) => createValidListing({
        id: `stable-${i}`,
        price: 100 + (i % 3) // Very low variance
    }));
}

function createVolatilePriceListings() {
    return Array.from({ length: 10 }, (_, i) => createValidListing({
        id: `volatile-${i}`,
        price: 50 + (i * 25) // High variance
    }));
}

function createRealisticTestData() {
    return [
        // Valid listings
        createValidListing({
            title: 'Amazing Spider-Man #1 CGC 9.8',
            price: 200,
            condition: 'CGC 9.8',
            grade: 9.8,
            sale_type: 'auction',
            marketplace: 'heritage'
        }),
        createValidListing({
            title: 'Amazing Spider-Man #1 Cover A',
            price: 95,
            sale_type: 'fixed',
            marketplace: 'ebay'
        }),
        createValidListing({
            title: 'Amazing Spider-Man #1 Newsstand Edition',
            price: 120,
            sale_type: 'fixed',
            marketplace: 'comicconnect'
        }),
        // Should be filtered out
        createValidListing({
            title: 'Amazing Spider-Man #1 REPRODUCTION',
            price: 15,
            marketplace: 'ebay'
        }),
        createValidListing({
            title: 'Amazing Spider-Man #1',
            price: 85,
            imageUrl: '', // No image
            marketplace: 'whatnot'
        })
    ];
}

module.exports = {
    createValidListing,
    createDiverseListings,
    createHighQualityListings,
    createLowQualityListings
}; 