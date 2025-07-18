const { expect } = require('chai');
const sinon = require('sinon');
const EnhancedDataCollectionService = require('../services/EnhancedDataCollectionService');
const EnhancedRateLimitManager = require('../services/EnhancedRateLimitManager');
const EnhancedDataValidationEngine = require('../services/EnhancedDataValidationEngine');
const EnhancedErrorHandler = require('../services/EnhancedErrorHandler');
const { pool } = require('../db');

describe('Task 1: Market Data Collection Infrastructure', function() {
    this.timeout(30000);
    
    let dataCollectionService;
    let rateLimitManager;
    let validationEngine;
    let errorHandler;
    let sandbox;
    
    before(async function() {
        // Setup test environment
        sandbox = sinon.createSandbox();
        
        // Initialize services with test configuration
        const testConfig = {
            collection: {
                maxRetries: 2,
                retryDelay: 100,
                batchSize: 5,
                maxConcurrentRequests: 2,
                timeout: 5000
            },
            rateLimiting: {
                globalRequestsPerSecond: 10,
                marketplaceSpecific: {
                    ebay: { requestsPerSecond: 2, requestsPerMinute: 60 },
                    whatnot: { requestsPerSecond: 1, requestsPerMinute: 30 }
                }
            },
            validation: {
                minPrice: 0.01,
                maxPrice: 50000,
                maxTitleLength: 200
            },
            errorHandling: {
                retry: { maxAttempts: 2, baseDelay: 100 },
                circuitBreaker: { failureThreshold: 3, recoveryTimeout: 5000 }
            },
            caching: { enabled: false }, // Disable caching for tests
            enabledMarketplaces: ['ebay', 'whatnot']
        };
        
        rateLimitManager = new EnhancedRateLimitManager(testConfig);
        validationEngine = new EnhancedDataValidationEngine(testConfig);
        errorHandler = new EnhancedErrorHandler(testConfig);
        dataCollectionService = new EnhancedDataCollectionService(testConfig);
    });
    
    afterEach(function() {
        sandbox.restore();
    });
    
    after(async function() {
        // Cleanup
        if (dataCollectionService) {
            dataCollectionService.removeAllListeners();
        }
        if (rateLimitManager) {
            rateLimitManager.removeAllListeners();
        }
        if (validationEngine) {
            validationEngine.removeAllListeners();
        }
        if (errorHandler) {
            errorHandler.removeAllListeners();
        }
    });

    describe('Enhanced Data Collection Service', function() {
        
        it('should initialize with correct configuration', function() {
            expect(dataCollectionService).to.exist;
            expect(dataCollectionService.config).to.exist;
            expect(dataCollectionService.scrapers).to.exist;
            expect(dataCollectionService.metrics).to.exist;
        });
        
        it('should have initialized scrapers for enabled marketplaces', function() {
            expect(dataCollectionService.scrapers).to.have.property('ebay');
            expect(dataCollectionService.scrapers).to.have.property('whatnot');
            expect(dataCollectionService.scrapers).to.not.have.property('amazon');
        });
        
        it('should validate search queries', function() {
            expect(() => dataCollectionService.validateSearchQuery('')).to.throw('Search query must be a non-empty string');
            expect(() => dataCollectionService.validateSearchQuery('a')).to.throw('Search query must be at least 2 characters long');
            expect(() => dataCollectionService.validateSearchQuery('a'.repeat(201))).to.throw('Search query must be less than 200 characters');
            expect(() => dataCollectionService.validateSearchQuery('Amazing Spider-Man #1')).to.not.throw();
        });
        
        it('should handle search across all marketplaces', async function() {
            // Mock scraper responses
            const mockListings = [
                {
                    id: 'ebay-123',
                    title: 'Amazing Spider-Man #1',
                    price: 100.00,
                    marketplace: 'ebay',
                    source_url: 'https://ebay.com/item/123',
                    condition: 'Very Fine',
                    seller_info: { feedback_score: 100 }
                },
                {
                    id: 'whatnot-456',
                    title: 'Amazing Spider-Man #1',
                    price: 110.00,
                    marketplace: 'whatnot',
                    source_url: 'https://whatnot.com/item/456',
                    condition: 'Near Mint',
                    sale_type: 'auction'
                }
            ];
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([mockListings[0]]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([mockListings[1]]);
            
            // Mock database operations
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('Amazing Spider-Man #1');
            
            expect(result).to.exist;
            expect(result.totalListings).to.equal(2);
            expect(result.listings).to.have.length(2);
            expect(result.marketplaceResults).to.have.property('ebay');
            expect(result.marketplaceResults).to.have.property('whatnot');
            expect(result.marketplaceResults.ebay.success).to.be.true;
            expect(result.marketplaceResults.whatnot.success).to.be.true;
        });
        
        it('should handle marketplace failures gracefully', async function() {
            // Mock one successful and one failed marketplace
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([
                {
                    id: 'ebay-123',
                    title: 'Amazing Spider-Man #1',
                    price: 100.00,
                    marketplace: 'ebay',
                    source_url: 'https://ebay.com/item/123',
                    condition: 'Very Fine',
                    seller_info: { feedback_score: 100 }
                }
            ]);
            
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').rejects(new Error('Rate limit exceeded'));
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('Amazing Spider-Man #1');
            
            expect(result).to.exist;
            expect(result.totalListings).to.equal(1);
            expect(result.marketplaceResults.ebay.success).to.be.true;
            expect(result.marketplaceResults.whatnot.success).to.be.false;
            expect(result.marketplaceResults.whatnot.error).to.equal('Rate limit exceeded');
        });
        
        it('should update metrics correctly', async function() {
            const initialMetrics = dataCollectionService.metrics;
            const initialCollections = initialMetrics.totalCollections;
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            await dataCollectionService.searchAllMarketplaces('test query');
            
            expect(dataCollectionService.metrics.totalCollections).to.equal(initialCollections + 1);
            expect(dataCollectionService.metrics.successfulCollections).to.be.greaterThan(0);
        });
        
        it('should emit collection events', async function() {
            const collectionCompletePromise = new Promise((resolve) => {
                dataCollectionService.once('collectionComplete', resolve);
            });
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            await dataCollectionService.searchAllMarketplaces('test query');
            
            const eventData = await collectionCompletePromise;
            expect(eventData).to.exist;
            expect(eventData.query).to.equal('test query');
            expect(eventData.totalListings).to.be.a('number');
        });
    });

    describe('Enhanced Rate Limit Manager', function() {
        
        it('should initialize with correct configuration', function() {
            expect(rateLimitManager).to.exist;
            expect(rateLimitManager.config).to.exist;
            expect(rateLimitManager.requestAnalytics).to.exist;
        });
        
        it('should enforce global rate limits', async function() {
            const startTime = Date.now();
            
            // Make multiple requests quickly
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(rateLimitManager.enforceRateLimit('ebay', 'search'));
            }
            
            await Promise.all(promises);
            
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            
            // Should take at least some time due to rate limiting
            expect(elapsed).to.be.greaterThan(100);
        });
        
        it('should enforce marketplace-specific rate limits', async function() {
            const startTime = Date.now();
            
            // Make requests that should hit marketplace-specific limits
            const promises = [];
            for (let i = 0; i < 3; i++) {
                promises.push(rateLimitManager.enforceRateLimit('ebay', 'search'));
            }
            
            await Promise.all(promises);
            
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            
            // Should take time due to eBay's rate limits
            expect(elapsed).to.be.greaterThan(50);
        });
        
        it('should handle rate limit exceeded errors', async function() {
            // Simulate rapid requests to trigger rate limit
            try {
                const promises = [];
                for (let i = 0; i < 20; i++) {
                    promises.push(rateLimitManager.enforceRateLimit('whatnot', 'search'));
                }
                await Promise.all(promises);
            } catch (error) {
                expect(error.message).to.include('Rate limit exceeded');
            }
        });
        
        it('should provide rate limit status', async function() {
            await rateLimitManager.enforceRateLimit('ebay', 'search');
            
            const status = await rateLimitManager.getRateLimitStatus('ebay');
            
            expect(status).to.exist;
            expect(status.marketplace).to.equal('ebay');
            expect(status.currentUsage).to.exist;
            expect(status.analytics).to.exist;
        });
        
        it('should reset rate limits', async function() {
            await rateLimitManager.enforceRateLimit('ebay', 'search');
            
            const statusBefore = await rateLimitManager.getRateLimitStatus('ebay');
            
            await rateLimitManager.resetRateLimit('ebay');
            
            const statusAfter = await rateLimitManager.getRateLimitStatus('ebay');
            
            expect(statusAfter.analytics.totalRequests).to.equal(0);
        });
    });

    describe('Enhanced Data Validation Engine', function() {
        
        it('should initialize with correct configuration', function() {
            expect(validationEngine).to.exist;
            expect(validationEngine.config).to.exist;
            expect(validationEngine.validationStats).to.exist;
        });
        
        it('should validate valid listings', async function() {
            const validListing = {
                id: 'test-123',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/123',
                condition: 'Very Fine',
                sale_type: 'auction',
                seller_info: { feedback_score: 100, feedback_percentage: 98.5 }
            };
            
            const result = await validationEngine.validateListing(validListing, 'ebay');
            
            expect(result.isValid).to.be.true;
            expect(result.errors).to.have.length(0);
            expect(result.confidenceScore).to.be.greaterThan(0);
            expect(result.normalizedData).to.exist;
        });
        
        it('should reject invalid listings', async function() {
            const invalidListing = {
                id: 'test-456',
                title: 'a', // Too short
                price: -10, // Invalid price
                marketplace: 'unknown', // Unknown marketplace
                source_url: 'invalid-url', // Invalid URL
                condition: 'Unknown'
            };
            
            const result = await validationEngine.validateListing(invalidListing, 'ebay');
            
            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.length.greaterThan(0);
            expect(result.confidenceScore).to.equal(0);
        });
        
        it('should detect suspicious patterns', async function() {
            const suspiciousListing = {
                id: 'test-789',
                title: 'Amazing Spider-Man #1 FAKE REPLICA',
                price: 0.01,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/789',
                condition: 'Very Fine',
                sale_type: 'auction'
            };
            
            const result = await validationEngine.validateListing(suspiciousListing, 'ebay');
            
            expect(result.isValid).to.be.false;
            expect(result.errors.some(error => error.includes('Suspicious'))).to.be.true;
        });
        
        it('should normalize listing data', async function() {
            const listing = {
                id: 'test-101',
                title: '  Amazing Spider-Man #1  ',
                price: '100.00',
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/101',
                condition: 'very fine',
                sale_type: 'auction',
                seller_info: { feedback_score: '100', feedback_percentage: '98.5' }
            };
            
            const result = await validationEngine.validateListing(listing, 'ebay');
            
            expect(result.isValid).to.be.true;
            expect(result.normalizedData.title).to.equal('Amazing Spider-Man #1');
            expect(result.normalizedData.price).to.equal(100.00);
            expect(result.normalizedData.condition).to.equal('Very Fine');
            expect(result.normalizedData.seller_info.feedback_score).to.equal(100);
        });
        
        it('should calculate confidence scores', async function() {
            const highConfidenceListing = {
                id: 'test-202',
                title: 'Amazing Spider-Man #1 (1963) CGC 9.8',
                price: 5000.00,
                marketplace: 'heritage',
                source_url: 'https://heritage.com/item/202',
                condition: 'CGC 9.8',
                sale_type: 'auction',
                description: 'Beautiful copy of this key issue',
                seller_info: { feedback_score: 1000, feedback_percentage: 99.5 },
                listing_photos: ['photo1.jpg', 'photo2.jpg']
            };
            
            const result = await validationEngine.validateListing(highConfidenceListing, 'heritage');
            
            expect(result.isValid).to.be.true;
            expect(result.confidenceScore).to.be.greaterThan(0.7);
        });
        
        it('should batch validate multiple listings', async function() {
            const listings = [
                {
                    id: 'batch-1',
                    title: 'Amazing Spider-Man #1',
                    price: 100.00,
                    marketplace: 'ebay',
                    source_url: 'https://ebay.com/item/1',
                    condition: 'Very Fine',
                    sale_type: 'auction'
                },
                {
                    id: 'batch-2',
                    title: 'X-Men #1',
                    price: 200.00,
                    marketplace: 'ebay',
                    source_url: 'https://ebay.com/item/2',
                    condition: 'Near Mint',
                    sale_type: 'buy_it_now'
                }
            ];
            
            const results = await validationEngine.batchValidate(listings, 'ebay', { batchSize: 2 });
            
            expect(results).to.have.length(2);
            expect(results[0].isValid).to.be.true;
            expect(results[1].isValid).to.be.true;
        });
        
        it('should update validation statistics', async function() {
            const initialStats = validationEngine.validationStats;
            const initialTotal = initialStats.totalValidations;
            
            const listing = {
                id: 'stats-test',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/stats',
                condition: 'Very Fine',
                sale_type: 'auction'
            };
            
            await validationEngine.validateListing(listing, 'ebay');
            
            const newStats = validationEngine.validationStats;
            expect(newStats.totalValidations).to.equal(initialTotal + 1);
            expect(newStats.passedValidations).to.be.greaterThan(initialStats.passedValidations);
        });
    });

    describe('Enhanced Error Handler', function() {
        
        it('should initialize with correct configuration', function() {
            expect(errorHandler).to.exist;
            expect(errorHandler.config).to.exist;
            expect(errorHandler.errorStats).to.exist;
        });
        
        it('should analyze errors correctly', function() {
            const networkError = new Error('ECONNRESET');
            networkError.code = 'ECONNRESET';
            
            const errorDetails = errorHandler.analyzeError(networkError, { marketplace: 'ebay' });
            
            expect(errorDetails.category).to.equal('network');
            expect(errorDetails.retryable).to.be.true;
            expect(errorDetails.severity).to.equal('medium');
            expect(errorDetails.marketplace).to.equal('ebay');
        });
        
        it('should handle retryable errors', async function() {
            const retryableError = new Error('Rate limit exceeded');
            retryableError.code = 'RATE_LIMIT_EXCEEDED';
            
            const result = await errorHandler.handleError(retryableError, {
                marketplace: 'ebay',
                operation: 'search',
                attempt: 1
            });
            
            expect(result.category).to.equal('rate_limit');
            expect(result.retryable).to.be.true;
        });
        
        it('should handle non-retryable errors', async function() {
            const criticalError = new Error('Authentication failed');
            criticalError.code = 'AUTHENTICATION_FAILED';
            
            const result = await errorHandler.handleError(criticalError, {
                marketplace: 'ebay',
                operation: 'search',
                attempt: 1
            });
            
            expect(result.category).to.equal('authentication');
            expect(result.retryable).to.be.false;
            expect(result.severity).to.equal('critical');
        });
        
        it('should update circuit breaker on failures', async function() {
            const error = new Error('Server error');
            error.code = 'INTERNAL_SERVER_ERROR';
            
            // Generate enough failures to trigger circuit breaker
            for (let i = 0; i < 5; i++) {
                await errorHandler.handleError(error, {
                    marketplace: 'test-marketplace',
                    operation: 'search'
                });
            }
            
            const isOpen = errorHandler.isCircuitBreakerOpen('test-marketplace');
            expect(isOpen).to.be.true;
        });
        
        it('should handle successful operations', function() {
            errorHandler.handleSuccessfulOperation('ebay');
            
            expect(errorHandler.errorStats.consecutiveErrors).to.equal(0);
        });
        
        it('should provide error statistics', function() {
            const stats = errorHandler.getErrorSummary();
            
            expect(stats).to.exist;
            expect(stats.totalErrors).to.be.a('number');
            expect(stats.errorRate).to.be.a('number');
            expect(stats.errorsByType).to.be.an('object');
            expect(stats.errorsByMarketplace).to.be.an('object');
        });
        
        it('should reset statistics', function() {
            errorHandler.resetStats();
            
            const stats = errorHandler.getErrorSummary();
            expect(stats.totalErrors).to.equal(0);
            expect(stats.criticalErrors).to.equal(0);
            expect(stats.consecutiveErrors).to.equal(0);
        });
    });

    describe('Integration Tests', function() {
        
        it('should handle complete data collection workflow', async function() {
            // Mock successful scraper responses
            const mockListing = {
                id: 'integration-test-1',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/integration-test-1',
                condition: 'Very Fine',
                sale_type: 'auction',
                seller_info: { feedback_score: 100, feedback_percentage: 98.5 }
            };
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([mockListing]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('Amazing Spider-Man #1');
            
            expect(result.totalListings).to.equal(1);
            expect(result.listings[0].title).to.equal('Amazing Spider-Man #1');
            expect(result.marketplaceResults.ebay.success).to.be.true;
        });
        
        it('should handle data validation in collection workflow', async function() {
            // Mock response with invalid data
            const invalidListing = {
                id: 'invalid-test-1',
                title: 'a', // Too short
                price: -10, // Invalid price
                marketplace: 'ebay',
                source_url: 'invalid-url',
                condition: 'Unknown'
            };
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([invalidListing]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('test query');
            
            // Invalid listings should be filtered out
            expect(result.totalListings).to.equal(0);
        });
        
        it('should handle rate limiting in collection workflow', async function() {
            // Mock scraper to simulate rate limiting
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').callsFake(async () => {
                const rateLimitError = new Error('Rate limit exceeded');
                rateLimitError.code = 'RATE_LIMIT_EXCEEDED';
                throw rateLimitError;
            });
            
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('test query');
            
            expect(result.marketplaceResults.ebay.success).to.be.false;
            expect(result.marketplaceResults.ebay.error).to.include('Rate limit exceeded');
        });
        
        it('should handle database storage errors', async function() {
            const mockListing = {
                id: 'db-test-1',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/db-test-1',
                condition: 'Very Fine',
                sale_type: 'auction'
            };
            
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([mockListing]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').rejects(new Error('Database connection failed'));
            
            try {
                await dataCollectionService.searchAllMarketplaces('test query');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Database connection failed');
            }
        });
    });

    describe('Performance Tests', function() {
        
        it('should handle concurrent requests efficiently', async function() {
            const startTime = Date.now();
            
            // Mock fast responses
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            // Run concurrent searches
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(dataCollectionService.searchAllMarketplaces(`test query ${i}`));
            }
            
            const results = await Promise.all(promises);
            
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            
            expect(results).to.have.length(5);
            expect(elapsed).to.be.lessThan(10000); // Should complete in reasonable time
        });
        
        it('should handle large batch validation efficiently', async function() {
            const listings = [];
            for (let i = 0; i < 100; i++) {
                listings.push({
                    id: `batch-${i}`,
                    title: `Comic #${i}`,
                    price: 10.00 + i,
                    marketplace: 'ebay',
                    source_url: `https://ebay.com/item/${i}`,
                    condition: 'Very Fine',
                    sale_type: 'auction'
                });
            }
            
            const startTime = Date.now();
            const results = await validationEngine.batchValidate(listings, 'ebay', { batchSize: 10 });
            const endTime = Date.now();
            
            expect(results).to.have.length(100);
            expect(endTime - startTime).to.be.lessThan(5000); // Should complete in reasonable time
        });
    });

    describe('Error Recovery Tests', function() {
        
        it('should recover from temporary network issues', async function() {
            let callCount = 0;
            
            // Mock scraper to fail first few times, then succeed
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').callsFake(async () => {
                callCount++;
                if (callCount < 3) {
                    const error = new Error('Network error');
                    error.code = 'ECONNRESET';
                    throw error;
                }
                return [{
                    id: 'recovery-test-1',
                    title: 'Amazing Spider-Man #1',
                    price: 100.00,
                    marketplace: 'ebay',
                    source_url: 'https://ebay.com/item/recovery-test-1',
                    condition: 'Very Fine',
                    sale_type: 'auction'
                }];
            });
            
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            const result = await dataCollectionService.searchAllMarketplaces('test query');
            
            expect(result.marketplaceResults.ebay.success).to.be.true;
            expect(result.totalListings).to.equal(1);
        });
        
        it('should handle circuit breaker recovery', async function() {
            const marketplace = 'recovery-test-marketplace';
            
            // Trigger circuit breaker
            const error = new Error('Server error');
            error.code = 'INTERNAL_SERVER_ERROR';
            
            for (let i = 0; i < 5; i++) {
                await errorHandler.handleError(error, { marketplace, operation: 'search' });
            }
            
            // Circuit breaker should be open
            expect(errorHandler.isCircuitBreakerOpen(marketplace)).to.be.true;
            
            // Simulate recovery after timeout
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            // Handle successful operation
            errorHandler.handleSuccessfulOperation(marketplace);
            
            // Circuit breaker should be closed
            expect(errorHandler.isCircuitBreakerOpen(marketplace)).to.be.false;
        });
    });

    describe('Metrics and Monitoring', function() {
        
        it('should track collection metrics', async function() {
            const initialMetrics = dataCollectionService.getStatus();
            
            // Mock successful collection
            sandbox.stub(dataCollectionService.scrapers.ebay, 'searchComics').resolves([{
                id: 'metrics-test-1',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/metrics-test-1',
                condition: 'Very Fine',
                sale_type: 'auction'
            }]);
            
            sandbox.stub(dataCollectionService.scrapers.whatnot, 'searchComics').resolves([]);
            sandbox.stub(dataCollectionService, 'storeListings').resolves();
            
            await dataCollectionService.searchAllMarketplaces('test query');
            
            const finalMetrics = dataCollectionService.getStatus();
            
            expect(finalMetrics.metrics.totalCollections).to.be.greaterThan(initialMetrics.metrics.totalCollections);
            expect(finalMetrics.metrics.successfulCollections).to.be.greaterThan(initialMetrics.metrics.successfulCollections);
        });
        
        it('should track validation metrics', async function() {
            const initialStats = validationEngine.getValidationStats();
            
            const listing = {
                id: 'validation-metrics-test',
                title: 'Amazing Spider-Man #1',
                price: 100.00,
                marketplace: 'ebay',
                source_url: 'https://ebay.com/item/validation-metrics-test',
                condition: 'Very Fine',
                sale_type: 'auction'
            };
            
            await validationEngine.validateListing(listing, 'ebay');
            
            const finalStats = validationEngine.getValidationStats();
            
            expect(finalStats.totalValidations).to.be.greaterThan(initialStats.totalValidations);
            expect(finalStats.successRate).to.be.a('number');
            expect(finalStats.averageConfidenceScore).to.be.a('number');
        });
        
        it('should track error metrics', async function() {
            const initialStats = errorHandler.getErrorSummary();
            
            const error = new Error('Test error');
            error.code = 'TEST_ERROR';
            
            await errorHandler.handleError(error, { marketplace: 'test', operation: 'search' });
            
            const finalStats = errorHandler.getErrorSummary();
            
            expect(finalStats.totalErrors).to.be.greaterThan(initialStats.totalErrors);
            expect(finalStats.errorsByType).to.have.property('unknown');
            expect(finalStats.errorsByMarketplace).to.have.property('test');
        });
    });
});

// Helper function to wait for async operations
function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test data generators
function generateMockListing(overrides = {}) {
    return {
        id: 'mock-' + Date.now(),
        title: 'Amazing Spider-Man #1',
        price: 100.00,
        marketplace: 'ebay',
        source_url: 'https://ebay.com/item/mock-' + Date.now(),
        condition: 'Very Fine',
        sale_type: 'auction',
        seller_info: { feedback_score: 100, feedback_percentage: 98.5 },
        ...overrides
    };
}

function generateMockListings(count, marketplace = 'ebay') {
    const listings = [];
    for (let i = 0; i < count; i++) {
        listings.push(generateMockListing({
            id: `mock-${marketplace}-${i}`,
            title: `Comic #${i}`,
            price: 10.00 + i,
            marketplace
        }));
    }
    return listings;
} 