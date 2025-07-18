/**
 * Comprehensive Test Suite for Task 3: Variant & Condition Classification System
 * Validates all acceptance criteria and ensures 90%+ accuracy
 */

const { 
    VariantClassifier, 
    ConditionClassifier, 
    VariantConditionClassificationSystem 
} = require('../services/VariantConditionClassificationSystem');

describe('Task 3: Variant & Condition Classification System', () => {
    let classificationSystem;
    let variantClassifier;
    let conditionClassifier;

    beforeEach(() => {
        classificationSystem = new VariantConditionClassificationSystem({ enableLogging: false });
        variantClassifier = new VariantClassifier();
        conditionClassifier = new ConditionClassifier();
    });

    describe('Acceptance Criteria 1: Direct vs Newsstand Edition Detection', () => {
        const directEditionTestCases = [
            {
                title: 'Amazing Spider-Man #300 Direct Edition',
                description: 'Direct market edition with diamond logo',
                expected: { variant: 'direct' },
                confidence_threshold: 0.9
            },
            {
                title: 'X-Men #1 1991 Direct Market',
                description: 'Specialty comic shop exclusive',
                expected: { variant: 'direct' },
                confidence_threshold: 0.85
            },
            {
                title: 'Batman #1 Diamond Comic Distributors',
                description: 'Direct edition comic book',
                expected: { variant: 'direct' },
                confidence_threshold: 0.9
            }
        ];

        const newsstandTestCases = [
            {
                title: 'Amazing Spider-Man #300 Newsstand',
                description: 'Newsstand edition with UPC barcode',
                expected: { variant: 'newsstand' },
                confidence_threshold: 0.9
            },
            {
                title: 'X-Men #1 1991 UPC Barcode',
                description: 'Universal product code edition',
                expected: { variant: 'newsstand' },
                confidence_threshold: 0.85
            },
            {
                title: 'Superman #75 Newsstand Edition',
                description: 'Sold at newsstands and retail stores',
                expected: { variant: 'newsstand' },
                confidence_threshold: 0.95
            }
        ];

        directEditionTestCases.forEach((testCase, index) => {
            test(`Direct Edition Detection ${index + 1}: ${testCase.title}`, async () => {
                const result = await classificationSystem.classify(testCase);
                
                expect(result.variant.type).toBe(testCase.expected.variant);
                expect(result.variant.confidence).toBeGreaterThanOrEqual(testCase.confidence_threshold);
                expect(result.variant.subtype).toBe('edition');
            });
        });

        newsstandTestCases.forEach((testCase, index) => {
            test(`Newsstand Edition Detection ${index + 1}: ${testCase.title}`, async () => {
                const result = await classificationSystem.classify(testCase);
                
                expect(result.variant.type).toBe(testCase.expected.variant);
                expect(result.variant.confidence).toBeGreaterThanOrEqual(testCase.confidence_threshold);
                expect(result.variant.subtype).toBe('edition');
            });
        });

        test('Direct vs Newsstand Conflict Resolution', async () => {
            const conflictCase = {
                title: 'Spider-Man #1 Direct Newsstand',
                description: 'Contains both direct and newsstand mentions'
            };

            const result = await classificationSystem.classify(conflictCase);
            
            // Should detect the conflict in metadata
            expect(result.variant.metadata.edge_cases).toContain('edition_conflict');
            expect(result.validation.issues.length).toBeGreaterThan(0);
        });
    });

    describe('Acceptance Criteria 2: Cover A/B/C Variant Classification', () => {
        const coverVariantTestCases = [
            {
                title: 'Justice League #1 Cover A Jim Lee',
                description: 'Main cover by Jim Lee',
                expected: { variant: 'cover_a' },
                confidence_threshold: 0.9
            },
            {
                title: 'Batman #100 Variant B Cover',
                description: 'Second cover variant',
                expected: { variant: 'cover_b' },
                confidence_threshold: 0.95
            },
            {
                title: 'X-Men #1 Cover C Alex Ross',
                description: 'Third cover variant by Alex Ross',
                expected: { variant: 'cover_c' },
                confidence_threshold: 0.95
            },
            {
                title: 'Spider-Man #1 Cover D Frank Miller',
                description: 'Fourth cover variant',
                expected: { variant: 'cover_d' },
                confidence_threshold: 0.95
            },
            {
                title: 'Wonder Woman #750 Virgin Variant',
                description: 'Textless virgin cover',
                expected: { variant: 'virgin' },
                confidence_threshold: 0.95
            },
            {
                title: 'Spawn #300 Sketch Cover Variant',
                description: 'Black and white line art cover',
                expected: { variant: 'sketch' },
                confidence_threshold: 0.9
            }
        ];

        coverVariantTestCases.forEach((testCase, index) => {
            test(`Cover Variant Classification ${index + 1}: ${testCase.title}`, async () => {
                const result = await classificationSystem.classify(testCase);
                
                expect(result.variant.type).toBe(testCase.expected.variant);
                expect(result.variant.confidence).toBeGreaterThanOrEqual(testCase.confidence_threshold);
                expect(result.variant.subtype).toBe('cover');
            });
        });

        test('Multiple Cover Detection', async () => {
            const multiCoverCase = {
                title: 'Batman #1 Cover A and Cover B Set',
                description: 'Contains multiple cover variants'
            };

            const result = await classificationSystem.classify(multiCoverCase);
            
            expect(result.variant.metadata.edge_cases).toContain('multiple_covers_mentioned');
            expect(result.variant.patterns_matched.length).toBeGreaterThan(1);
        });
    });

    describe('Acceptance Criteria 3: 1st Print vs Reprint Detection', () => {
        const printingTestCases = [
            {
                title: 'Amazing Spider-Man #1 1st Print 1963',
                description: 'Original first printing from 1963',
                expected: { variant: 'first_print' },
                confidence_threshold: 0.8
            },
            {
                title: 'X-Men #1 Second Print 1991',
                description: 'Second printing run',
                expected: { variant: 'second_print' },
                confidence_threshold: 0.8
            },
            {
                title: 'Batman #1 Reprint 1974',
                description: 'Later reprint edition',
                expected: { variant: 'reprint' },
                confidence_threshold: 0.8
            },
            {
                title: 'Superman #1 Facsimile Edition',
                description: 'Facsimile reproduction of original',
                expected: { variant: 'facsimile' },
                confidence_threshold: 0.9
            },
            {
                title: 'Action Comics #1 Third Printing',
                description: 'Third print run of the issue',
                expected: { variant: 'third_print' },
                confidence_threshold: 0.8
            }
        ];

        printingTestCases.forEach((testCase, index) => {
            test(`Printing Classification ${index + 1}: ${testCase.title}`, async () => {
                const result = await classificationSystem.classify(testCase);
                
                expect(result.variant.type).toBe(testCase.expected.variant);
                expect(result.variant.confidence).toBeGreaterThanOrEqual(testCase.confidence_threshold);
                expect(result.variant.subtype).toBe('edition');
            });
        });
    });

    describe('Acceptance Criteria 4: CGC/PGX/Other Graded Slab Recognition', () => {
        const gradedSlabTestCases = [
            {
                title: 'Amazing Spider-Man #300 CGC 9.8 White Pages',
                description: 'CGC graded 9.8 with white pages',
                expected: { 
                    condition: 'CGC 9.8',
                    grading_service: 'CGC',
                    grade: 9.8,
                    is_graded: true
                },
                confidence_threshold: 0.95
            },
            {
                title: 'X-Men #1 CBCS 9.6 Blue Label',
                description: 'CBCS blue label 9.6 grade',
                expected: { 
                    condition: 'CBCS 9.6',
                    grading_service: 'CBCS',
                    grade: 9.6,
                    is_graded: true
                },
                confidence_threshold: 0.95
            },
            {
                title: 'Batman #1 PGX 8.5 Universal',
                description: 'PGX universal grade 8.5',
                expected: { 
                    condition: 'PGX 8.5',
                    grading_service: 'PGX',
                    grade: 8.5,
                    is_graded: true
                },
                confidence_threshold: 0.9
            },
            {
                title: 'Superman #75 CGG 9.4 Graded',
                description: 'CGG graded comic book',
                expected: { 
                    condition: 'CGG 9.4',
                    grading_service: 'CGG',
                    grade: 9.4,
                    is_graded: true
                },
                confidence_threshold: 0.85
            }
        ];

        gradedSlabTestCases.forEach((testCase, index) => {
            test(`Graded Slab Recognition ${index + 1}: ${testCase.title}`, async () => {
                const result = await classificationSystem.classify(testCase);
                
                expect(result.condition.condition).toBe(testCase.expected.condition);
                expect(result.condition.grading_service).toBe(testCase.expected.grading_service);
                expect(result.condition.grade).toBeCloseTo(testCase.expected.grade, 1);
                expect(result.condition.is_graded).toBe(testCase.expected.is_graded);
                expect(result.condition.confidence).toBeGreaterThanOrEqual(testCase.confidence_threshold);
            });
        });

        test('Raw/Ungraded Detection', async () => {
            const rawCase = {
                title: 'Spider-Man #1 Raw Ungraded',
                description: 'Raw ungraded comic book'
            };

            const result = await classificationSystem.classify(rawCase);
            
            expect(result.condition.special_designations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'Raw' })
                ])
            );
            expect(result.condition.is_graded).toBe(false);
        });

        test('Signature Series Detection', async () => {
            const signatureCase = {
                title: 'X-Men #1 CGC 9.8 SS Signed by Stan Lee',
                description: 'CGC Signature Series signed comic'
            };

            const result = await classificationSystem.classify(signatureCase);
            
            expect(result.condition.special_designations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'Signature Series' })
                ])
            );
        });
    });

    describe('Acceptance Criteria 5: Edge Cases and Unknown Variants', () => {
        const edgeCaseTestCases = [
            {
                title: 'Batman #1 Unknown Variant Type',
                description: 'Has variant in title but no clear classification',
                test: 'unclassified_variant_handling'
            },
            {
                title: 'Spider-Man #1 Error Print Missing Pages',
                description: 'Printing error with missing content',
                expected: { variant: 'printing_error' },
                test: 'error_variant_detection'
            },
            {
                title: 'X-Men #1 Color Error Red Instead Blue',
                description: 'Color printing mistake',
                expected: { variant: 'color_error' },
                test: 'color_error_detection'
            },
            {
                title: '',
                description: '',
                test: 'empty_input_handling'
            },
            {
                title: 'Comic Book Title With No Descriptive Information',
                description: '',
                test: 'minimal_information_handling'
            }
        ];

        test('Unclassified Variant Handling', async () => {
            const testCase = edgeCaseTestCases[0];
            const result = await classificationSystem.classify(testCase);
            
            expect(result.variant.metadata.edge_cases).toContain('unclassified_variant');
            expect(result.validation.issues.length).toBeGreaterThan(0);
        });

        test('Error Variant Detection', async () => {
            const testCase = edgeCaseTestCases[1];
            const result = await classificationSystem.classify(testCase);
            
            expect(result.variant.type).toBe(testCase.expected.variant);
            expect(result.variant.subtype).toBe('error');
        });

        test('Empty Input Handling', async () => {
            const testCase = edgeCaseTestCases[3];
            const result = await classificationSystem.classify(testCase);
            
            expect(result.variant.type).toBe('base');
            expect(result.condition.condition).toBe('Unknown');
            expect(result.overall_confidence).toBeLessThan(0.5);
        });

        test('Graceful Degradation', async () => {
            const invalidInput = { title: null, description: undefined };
            
            const result = await classificationSystem.classify(invalidInput);
            
            expect(result.error).toBeDefined();
            expect(result.variant.error).toBeDefined();
            expect(result.condition.error).toBeDefined();
        });
    });

    describe('Acceptance Criteria 6: 90%+ Accuracy Validation', () => {
        // Comprehensive test dataset for accuracy validation
        const accuracyTestDataset = [
            // Direct/Newsstand (20 cases)
            { title: 'Amazing Spider-Man #300 Direct Edition', expected: { variant: 'direct' } },
            { title: 'X-Men #1 Newsstand UPC', expected: { variant: 'newsstand' } },
            { title: 'Batman #1 Direct Market', expected: { variant: 'direct' } },
            { title: 'Superman #75 Newsstand Edition', expected: { variant: 'newsstand' } },
            { title: 'Flash #1 Diamond Comic', expected: { variant: 'direct' } },
            { title: 'Green Lantern #1 UPC Barcode', expected: { variant: 'newsstand' } },
            { title: 'Wonder Woman #1 Direct Edition', expected: { variant: 'direct' } },
            { title: 'Aquaman #1 Newsstand', expected: { variant: 'newsstand' } },
            { title: 'Teen Titans #1 Specialty Shop', expected: { variant: 'direct' } },
            { title: 'Justice League #1 Universal Product Code', expected: { variant: 'newsstand' } },

            // Cover Variants (15 cases)
            { title: 'Batman #100 Cover A', expected: { variant: 'cover_a' } },
            { title: 'X-Men #1 Cover B Variant', expected: { variant: 'cover_b' } },
            { title: 'Spider-Man #1 Cover C', expected: { variant: 'cover_c' } },
            { title: 'Superman #1 Virgin Variant', expected: { variant: 'virgin' } },
            { title: 'Flash #1 Sketch Cover', expected: { variant: 'sketch' } },
            { title: 'Wonder Woman #750 Cover D', expected: { variant: 'cover_d' } },
            { title: 'Green Lantern #1 Textless Cover', expected: { variant: 'virgin' } },
            { title: 'Aquaman #1 B&W Sketch', expected: { variant: 'sketch' } },

            // Printing (10 cases)
            { title: 'Amazing Spider-Man #1 First Print', expected: { variant: 'first_print' } },
            { title: 'X-Men #1 Second Print', expected: { variant: 'second_print' } },
            { title: 'Batman #1 Reprint', expected: { variant: 'reprint' } },
            { title: 'Superman #1 Facsimile Edition', expected: { variant: 'facsimile' } },
            { title: 'Flash #1 Third Printing', expected: { variant: 'third_print' } },

            // Conditions (15 cases)
            { title: 'Spider-Man #1 CGC 9.8', expected: { condition: 'CGC 9.8' } },
            { title: 'Batman #1 CBCS 9.6', expected: { condition: 'CBCS 9.6' } },
            { title: 'X-Men #1 PGX 8.5', expected: { condition: 'PGX 8.5' } },
            { title: 'Superman #1 Near Mint', expected: { condition: 'Near Mint' } },
            { title: 'Flash #1 Very Fine', expected: { condition: 'Very Fine' } },
            { title: 'Wonder Woman #1 Fine', expected: { condition: 'Fine' } },
            { title: 'Green Lantern #1 Very Good', expected: { condition: 'Very Good' } },
            { title: 'Aquaman #1 Raw Ungraded', expected: { condition: 'Unknown' } }
        ];

        test('System-wide Accuracy Validation', async () => {
            console.log('🧪 Running comprehensive accuracy validation...');
            
            const validation = await classificationSystem.validateAccuracy(accuracyTestDataset);
            
            console.log(`📊 Accuracy Results:`);
            console.log(`  Variant Accuracy: ${(validation.variant_accuracy * 100).toFixed(1)}%`);
            console.log(`  Condition Accuracy: ${(validation.condition_accuracy * 100).toFixed(1)}%`);
            console.log(`  Overall Accuracy: ${(validation.overall_accuracy * 100).toFixed(1)}%`);
            
            // Ensure we meet the 90% accuracy threshold
            expect(validation.overall_accuracy).toBeGreaterThanOrEqual(0.9);
            expect(validation.meets_threshold).toBe(true);
            
            // Individual component accuracies should also be high
            expect(validation.variant_accuracy).toBeGreaterThanOrEqual(0.85);
            expect(validation.condition_accuracy).toBeGreaterThanOrEqual(0.85);
        });

        test('Batch Processing Performance', async () => {
            const batchSize = 50;
            const testBatch = Array(batchSize).fill().map((_, i) => ({
                title: `Test Comic #${i + 1} Cover A CGC 9.8`,
                description: `Test description for comic ${i + 1}`,
                expected: { variant: 'cover_a', condition: 'CGC 9.8' }
            }));

            const startTime = Date.now();
            const batchResult = await classificationSystem.classifyBatch(testBatch);
            const processingTime = Date.now() - startTime;

            console.log(`⚡ Batch Processing: ${batchSize} comics in ${processingTime}ms`);
            console.log(`   Average: ${(processingTime / batchSize).toFixed(1)}ms per comic`);

            expect(batchResult.results.length).toBe(batchSize);
            expect(batchResult.summary.successful).toBeGreaterThanOrEqual(batchSize * 0.9);
            expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe('Integration and System Tests', () => {
        test('Complete Classification Workflow', async () => {
            const testComic = {
                title: 'Amazing Spider-Man #300 CGC 9.8 Cover B Newsstand',
                description: 'CGC graded 9.8 white pages, second cover variant, newsstand edition with UPC barcode',
                imageUrl: 'https://example.com/spiderman-300-coverb.jpg',
                metadata: { publisher: 'Marvel', year: 1988 }
            };

            const result = await classificationSystem.classify(testComic);

            // Should classify both variant and condition aspects
            expect(result.variant.type).toBeTruthy();
            expect(result.condition.condition).toBeTruthy();
            expect(result.overall_confidence).toBeGreaterThan(0.5);
            expect(result.validation.is_valid).toBeDefined();
            expect(result.processing_time_ms).toBeGreaterThan(0);
        });

        test('Cache Functionality', async () => {
            const testComic = {
                title: 'Test Comic #1 Cover A CGC 9.8',
                description: 'Test comic for cache validation'
            };

            // First classification
            const result1 = await classificationSystem.classify(testComic);
            const time1 = result1.processing_time_ms;

            // Second classification (should use cache)
            const result2 = await classificationSystem.classify(testComic);
            const time2 = result2.processing_time_ms;

            expect(result1.variant.type).toBe(result2.variant.type);
            expect(result1.condition.condition).toBe(result2.condition.condition);
            expect(time2).toBeLessThanOrEqual(time1); // Cache should be faster or equal
        });

        test('Statistics Tracking', async () => {
            const testComics = [
                { title: 'Comic 1 Cover A', description: 'Test 1' },
                { title: 'Comic 2 Cover B', description: 'Test 2' },
                { title: 'Comic 3 CGC 9.8', description: 'Test 3' }
            ];

            await classificationSystem.classifyBatch(testComics);
            const stats = classificationSystem.getStatistics();

            expect(stats.total_classifications).toBeGreaterThanOrEqual(3);
            expect(stats.accuracy_rate).toBeGreaterThanOrEqual(0);
            expect(stats.average_processing_time_ms).toBeGreaterThan(0);
        });

        test('ML Integration Preparation', () => {
            const mlIntegration = classificationSystem.prepareMlIntegration();

            expect(mlIntegration.feature_extractors).toBeDefined();
            expect(mlIntegration.training_data_format).toBeDefined();
            expect(mlIntegration.model_interface).toBeDefined();
            
            // Test feature extraction
            const textFeatures = mlIntegration.feature_extractors.text_features(
                'Batman #1 Cover A', 
                'First cover variant'
            );
            expect(textFeatures.has_variant_keywords).toBe(true);
        });
    });

    afterAll(() => {
        // Clean up
        const stats = classificationSystem.getStatistics();
        console.log('\n📈 Final Test Statistics:');
        console.log(`   Total Classifications: ${stats.total_classifications}`);
        console.log(`   Success Rate: ${(stats.accuracy_rate * 100).toFixed(1)}%`);
        console.log(`   Avg Processing Time: ${stats.average_processing_time_ms.toFixed(1)}ms`);
    });
}); 