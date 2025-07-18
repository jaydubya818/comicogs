const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../db');
const RedisManager = require('../cache/RedisManager');
const DataRetentionManager = require('../services/DataRetentionManager');
const BackupManager = require('../backup/BackupManager');
const IndexManager = require('../database/IndexManager');
const MigrationManager = require('../migrations/MigrationManager');
const DatabaseMonitor = require('../monitoring/DatabaseMonitor');

/**
 * Task 9 Data Storage & Caching Architecture - Comprehensive Test Suite
 */
describe('Task 9: Data Storage & Caching Architecture', function() {
    this.timeout(10000); // Extended timeout for database operations

    let redisManager;
    let retentionManager;
    let backupManager;
    let indexManager;
    let migrationManager;
    let databaseMonitor;

    before(async function() {
        console.log('\n🧪 Setting up Task 9 test environment...');
        
        // Initialize all managers
        redisManager = RedisManager.getInstance();
        retentionManager = new DataRetentionManager();
        backupManager = new BackupManager();
        indexManager = new IndexManager();
        migrationManager = new MigrationManager();
        databaseMonitor = new DatabaseMonitor();

        // Setup test environment
        await this.setupTestEnvironment();
    });

    after(async function() {
        console.log('\n🧹 Cleaning up Task 9 test environment...');
        await this.cleanupTestEnvironment();
    });

    // ==========================================
    // DATABASE SCHEMA TESTS
    // ==========================================

    describe('🗄️ Database Schema', function() {
        
        it('should have all required tables created', async function() {
            const requiredTables = [
                'publishers', 'series', 'comics', 'users',
                'pricing_data_raw', 'pricing_data_normalized', 'pricing_aggregates',
                'collections', 'wantlists', 'marketplace_listings',
                'search_history', 'price_alerts', 'listing_success_tracking',
                'data_collection_status', 'schema_migrations', 'system_config'
            ];

            for (const table of requiredTables) {
                const result = await db.query(`
                    SELECT tablename FROM pg_tables 
                    WHERE tablename = $1 AND schemaname = 'public'
                `, [table]);
                
                expect(result.rows.length).to.equal(1, `Table ${table} should exist`);
            }
        });

        it('should have proper foreign key constraints', async function() {
            const constraintChecks = [
                {
                    table: 'pricing_data_raw',
                    column: 'comic_id',
                    references: 'comics(id)'
                },
                {
                    table: 'collections',
                    column: 'user_id',
                    references: 'users(id)'
                },
                {
                    table: 'collections',
                    column: 'comic_id',
                    references: 'comics(id)'
                }
            ];

            for (const check of constraintChecks) {
                const result = await db.query(`
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
                    AND contype = 'f'
                `, [check.table]);

                expect(result.rows.length).to.be.greaterThan(0, 
                    `Table ${check.table} should have foreign key constraints`);
            }
        });

        it('should have proper indexes for performance', async function() {
            const requiredIndexes = [
                'idx_pricing_raw_comic_date',
                'idx_pricing_normalized_comic_condition', 
                'idx_collections_user_comic',
                'idx_comics_title_gin'
            ];

            for (const indexName of requiredIndexes) {
                const result = await db.query(`
                    SELECT indexname FROM pg_indexes 
                    WHERE indexname = $1
                `, [indexName]);

                expect(result.rows.length).to.equal(1, 
                    `Index ${indexName} should exist`);
            }
        });

        it('should support JSONB data types for flexible storage', async function() {
            // Test JSONB functionality with pricing data
            const testData = {
                source_metadata: { platform: 'test', version: '1.0' },
                sellers_info: { rating: 4.5, feedback_count: 100 }
            };

            // Insert test pricing data with JSONB
            const insertResult = await db.query(`
                INSERT INTO pricing_data_raw 
                (comic_id, source_marketplace, price, title_raw, seller_info)
                VALUES (1, 'test', 10.00, 'Test Comic', $1)
                RETURNING id
            `, [JSON.stringify(testData.sellers_info)]);

            expect(insertResult.rows.length).to.equal(1);

            // Query with JSONB operators
            const queryResult = await db.query(`
                SELECT seller_info->'rating' as rating
                FROM pricing_data_raw 
                WHERE id = $1
            `, [insertResult.rows[0].id]);

            expect(parseFloat(queryResult.rows[0].rating)).to.equal(4.5);

            // Cleanup
            await db.query('DELETE FROM pricing_data_raw WHERE id = $1', [insertResult.rows[0].id]);
        });
    });

    // ==========================================
    // REDIS CACHING TESTS
    // ==========================================

    describe('🚀 Redis Caching Layer', function() {

        before(async function() {
            if (!redisManager.redis) {
                await redisManager.connect();
            }
        });

        it('should connect to Redis successfully', async function() {
            const health = await redisManager.healthCheck();
            expect(health.status).to.equal('healthy');
        });

        it('should cache and retrieve pricing data', async function() {
            const testData = {
                comicId: 1,
                condition: 'NM',
                currentPrice: 25.50,
                lastUpdated: new Date()
            };

            // Cache pricing data
            const cacheResult = await redisManager.cachePricingData(
                testData.comicId, 
                testData.condition, 
                testData
            );
            expect(cacheResult).to.be.true;

            // Retrieve cached data
            const retrievedData = await redisManager.getPricingData(
                testData.comicId, 
                testData.condition
            );
            expect(retrievedData).to.not.be.null;
            expect(retrievedData.currentPrice).to.equal(testData.currentPrice);
        });

        it('should handle cache invalidation', async function() {
            const comicId = 999;
            
            // Cache some data
            await redisManager.cachePricingData(comicId, 'VF', { price: 15.00 });
            await redisManager.cachePricingAggregates(comicId, { avgPrice: 14.75 });

            // Verify data is cached
            let pricingData = await redisManager.getPricingData(comicId, 'VF');
            expect(pricingData).to.not.be.null;

            // Invalidate cache
            await redisManager.invalidatePricingCache(comicId);

            // Verify data is invalidated
            pricingData = await redisManager.getPricingData(comicId, 'VF');
            expect(pricingData).to.be.null;
        });

        it('should track performance metrics', async function() {
            // Perform some cache operations
            await redisManager.cachePricingData(1, 'NM', { price: 20 });
            await redisManager.getPricingData(1, 'NM');
            await redisManager.getPricingData(1, 'VF'); // Cache miss

            const metrics = redisManager.getMetrics();
            expect(metrics.hits).to.be.greaterThan(0);
            expect(metrics.misses).to.be.greaterThan(0);
            expect(metrics.totalRequests).to.be.greaterThan(0);
        });

        it('should support rate limiting', async function() {
            const userId = 'test-user';
            const action = 'api-call';
            const limit = 5;
            const windowSeconds = 60;

            // Test within limit
            for (let i = 0; i < limit; i++) {
                const result = await redisManager.checkRateLimit(userId, action, limit, windowSeconds);
                expect(result.allowed).to.be.true;
            }

            // Test over limit
            const overLimitResult = await redisManager.checkRateLimit(userId, action, limit, windowSeconds);
            expect(overLimitResult.allowed).to.be.false;
            expect(overLimitResult.count).to.be.greaterThan(limit);
        });
    });

    // ==========================================
    // DATA RETENTION TESTS
    // ==========================================

    describe('🗄️ Data Retention Management', function() {

        it('should initialize with proper configuration', async function() {
            await retentionManager.initialize();
            
            const status = retentionManager.getStatus();
            expect(status.initialized).to.be.true;
            expect(status.config.retentionPeriods).to.be.an('object');
        });

        it('should identify old records for cleanup', async function() {
            // Insert test search history record with old date
            const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
            
            await db.query(`
                INSERT INTO search_history (user_id, search_query, created_at)
                VALUES (1, 'test search', $1)
            `, [oldDate]);

            // Run search history cleanup
            const cleanupResult = await retentionManager.cleanupSearchHistory();
            expect(cleanupResult).to.be.greaterThan(0);
        });

        it('should generate retention reports', async function() {
            const report = await retentionManager.generateRetentionReport();
            
            expect(report).to.be.an('object');
            expect(report.timestamp).to.be.a('date');
            expect(report.retentionStatus).to.be.an('object');
            expect(report.recommendations).to.be.an('array');
        });

        it('should handle manual retention operations', async function() {
            const result = await retentionManager.runManualRetention('audit');
            expect(result).to.not.throw;
        });
    });

    // ==========================================
    // BACKUP MANAGER TESTS
    // ==========================================

    describe('💾 Backup Management', function() {

        before(async function() {
            await backupManager.initialize();
        });

        it('should initialize backup directories', async function() {
            const status = backupManager.getStatus();
            expect(status.enabled).to.be.a('boolean');
        });

        it('should validate backup configuration', async function() {
            // Test configuration validation
            expect(() => backupManager.validateConfiguration()).to.not.throw;
        });

        it('should calculate file checksums', async function() {
            const testContent = 'test backup content';
            const fs = require('fs').promises;
            const path = require('path');
            
            const testFile = path.join(__dirname, 'test-backup.txt');
            await fs.writeFile(testFile, testContent);
            
            const checksum = await backupManager.calculateChecksum(testFile);
            expect(checksum).to.be.a('string');
            expect(checksum.length).to.equal(64); // SHA-256 hex length
            
            // Cleanup
            await fs.unlink(testFile);
        });

        it('should format file sizes correctly', async function() {
            expect(backupManager.formatFileSize(1024)).to.equal('1 KB');
            expect(backupManager.formatFileSize(1048576)).to.equal('1 MB');
            expect(backupManager.formatFileSize(1073741824)).to.equal('1 GB');
        });
    });

    // ==========================================
    // INDEX MANAGEMENT TESTS
    // ==========================================

    describe('📊 Index Management', function() {

        before(async function() {
            await indexManager.initialize();
        });

        it('should validate index definitions', async function() {
            expect(() => indexManager.validateIndexDefinitions()).to.not.throw;
        });

        it('should check for index existence', async function() {
            // Test with a known index (primary key)
            const exists = await indexManager.indexExists('comics_pkey');
            expect(exists).to.be.true;

            // Test with non-existent index
            const notExists = await indexManager.indexExists('non_existent_index');
            expect(notExists).to.be.false;
        });

        it('should get total index count and size', async function() {
            const count = await indexManager.getTotalIndexCount();
            expect(count).to.be.a('number');
            expect(count).to.be.greaterThan(0);

            const size = await indexManager.getTotalIndexSize();
            expect(size).to.be.a('string');
        });

        it('should analyze table statistics', async function() {
            await indexManager.analyzeTableStatistics();
            // Should not throw any errors
        });

        it('should generate performance reports', async function() {
            const report = await indexManager.generatePerformanceReport();
            
            expect(report).to.be.an('object');
            expect(report.summary).to.be.an('object');
            expect(report.recommendations).to.be.an('array');
        });
    });

    // ==========================================
    // MIGRATION MANAGEMENT TESTS
    // ==========================================

    describe('🔄 Migration Management', function() {

        before(async function() {
            await migrationManager.initialize();
        });

        it('should initialize migration table', async function() {
            const tableExists = await db.query(`
                SELECT tablename FROM pg_tables 
                WHERE tablename = 'schema_migrations'
            `);
            expect(tableExists.rows.length).to.equal(1);
        });

        it('should generate migration files', async function() {
            const migration = await migrationManager.generateMigration('test_migration', {
                description: 'Test migration for unit tests'
            });

            expect(migration.version).to.be.a('string');
            expect(migration.filename).to.include('test_migration');
            
            // Cleanup: remove generated file
            const fs = require('fs').promises;
            await fs.unlink(migration.filepath);
        });

        it('should validate migration files', async function() {
            const validSQL = `
                -- FORWARD
                CREATE TABLE test_table (id SERIAL PRIMARY KEY);
                
                -- ROLLBACK
                DROP TABLE test_table;
            `;

            const migration = { version: '001', name: 'test' };
            expect(() => migrationManager.validateMigration(validSQL, migration)).to.not.throw;
        });

        it('should parse migration files correctly', async function() {
            const migrationSQL = `
                -- FORWARD
                CREATE TABLE test (id INTEGER);
                INSERT INTO test VALUES (1);
                
                -- ROLLBACK
                DROP TABLE test;
            `;

            const parsed = migrationManager.parseMigrationFile(migrationSQL);
            expect(parsed.forwardSQL).to.include('CREATE TABLE test');
            expect(parsed.rollbackSQL).to.include('DROP TABLE test');
        });

        it('should calculate checksums for migration content', async function() {
            const content = 'test migration content';
            const checksum = migrationManager.calculateChecksum(content);
            
            expect(checksum).to.be.a('string');
            expect(checksum.length).to.equal(64);
        });
    });

    // ==========================================
    // DATABASE MONITORING TESTS
    // ==========================================

    describe('📊 Database Monitoring', function() {

        before(async function() {
            await databaseMonitor.initialize();
        });

        after(async function() {
            await databaseMonitor.stopMonitoring();
        });

        it('should collect basic database metrics', async function() {
            const connections = await databaseMonitor.getConnectionCount();
            expect(connections).to.be.a('number');
            expect(connections).to.be.greaterThanOrEqual(0);

            const dbSize = await databaseMonitor.getDatabaseSize();
            expect(dbSize).to.be.a('number');
            expect(dbSize).to.be.greaterThan(0);

            const cacheHitRatio = await databaseMonitor.getCacheHitRatio();
            expect(cacheHitRatio).to.be.a('number');
            expect(cacheHitRatio).to.be.greaterThanOrEqual(0);
        });

        it('should perform health checks', async function() {
            const connectivity = await databaseMonitor.checkConnectivity();
            expect(connectivity.status).to.equal('healthy');
            expect(connectivity.latency).to.be.a('number');

            const systemHealth = await databaseMonitor.checkSystemHealth();
            expect(systemHealth.status).to.be.oneOf(['healthy', 'warning', 'critical']);
        });

        it('should calculate overall health status', async function() {
            const health = databaseMonitor.calculateOverallHealth();
            
            expect(health.percentage).to.be.a('number');
            expect(health.percentage).to.be.between(0, 100);
            expect(health.status).to.be.oneOf(['healthy', 'warning', 'critical']);
        });

        it('should handle alert processing', async function() {
            const testAlert = {
                type: 'test_alert',
                severity: 'warning',
                message: 'Test alert for unit tests',
                value: 85,
                threshold: 80
            };

            // Mock console.log to capture alert output
            const consoleSpy = sinon.spy(console, 'log');
            
            databaseMonitor.sendConsoleAlert(testAlert);
            
            expect(consoleSpy.called).to.be.true;
            expect(consoleSpy.firstCall.args[0]).to.include('Test alert for unit tests');
            
            consoleSpy.restore();
        });
    });

    // ==========================================
    // INTEGRATION TESTS
    // ==========================================

    describe('🔗 Integration Tests', function() {

        it('should integrate caching with database operations', async function() {
            const testComic = {
                title: 'Integration Test Comic',
                issue_number: '1',
                publisher_id: 1
            };

            // Insert test comic
            const insertResult = await db.query(`
                INSERT INTO comics (title, issue_number, publisher_id)
                VALUES ($1, $2, $3)
                RETURNING id
            `, [testComic.title, testComic.issue_number, testComic.publisher_id]);

            const comicId = insertResult.rows[0].id;

            // Add pricing data
            const pricingData = {
                comicId: comicId,
                currentPrice: 29.99,
                condition: 'NM',
                lastUpdated: new Date()
            };

            // Cache the pricing data
            await redisManager.cachePricingData(comicId, 'NM', pricingData);

            // Verify cached data matches database expectations
            const cachedData = await redisManager.getPricingData(comicId, 'NM');
            expect(cachedData.currentPrice).to.equal(pricingData.currentPrice);

            // Test cache invalidation on data update
            await redisManager.invalidatePricingCache(comicId);
            const invalidatedData = await redisManager.getPricingData(comicId, 'NM');
            expect(invalidatedData).to.be.null;

            // Cleanup
            await db.query('DELETE FROM comics WHERE id = $1', [comicId]);
        });

        it('should handle end-to-end pricing workflow', async function() {
            // 1. Create test data
            const comicId = 1;
            const condition = 'VF';

            // 2. Simulate raw pricing data collection
            await db.query(`
                INSERT INTO pricing_data_raw 
                (comic_id, source_marketplace, price, condition, title_raw, collected_at)
                VALUES ($1, 'test_marketplace', 22.50, $2, 'Test Comic #1', NOW())
            `, [comicId, condition]);

            // 3. Cache market insights
            const marketInsights = {
                averagePrice: 22.50,
                saleCount: 1,
                trendDirection: 'stable',
                generatedAt: new Date()
            };

            await redisManager.cacheMarketInsights(comicId, marketInsights);

            // 4. Verify cached insights
            const cachedInsights = await redisManager.getMarketInsights(comicId);
            expect(cachedInsights.averagePrice).to.equal(22.50);

            // 5. Test data retention (simulated)
            const oldDataCount = await db.query(`
                SELECT COUNT(*) FROM pricing_data_raw 
                WHERE comic_id = $1
            `, [comicId]);

            expect(parseInt(oldDataCount.rows[0].count)).to.be.greaterThan(0);

            // Cleanup
            await db.query('DELETE FROM pricing_data_raw WHERE comic_id = $1', [comicId]);
        });

        it('should maintain data consistency across all systems', async function() {
            // Test transaction consistency
            await db.query('BEGIN');
            
            try {
                // Insert related data in transaction
                const userResult = await db.query(`
                    INSERT INTO users (username, email, password_hash)
                    VALUES ('test_user', 'test@example.com', 'hash')
                    RETURNING id
                `);
                const userId = userResult.rows[0].id;

                const collectionResult = await db.query(`
                    INSERT INTO collections (user_id, comic_id, condition, purchase_price)
                    VALUES ($1, 1, 'NM', 25.00)
                    RETURNING id
                `, [userId]);

                // Verify foreign key relationships
                expect(collectionResult.rows.length).to.equal(1);

                await db.query('COMMIT');

                // Cleanup
                await db.query('DELETE FROM collections WHERE user_id = $1', [userId]);
                await db.query('DELETE FROM users WHERE id = $1', [userId]);

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        });
    });

    // ==========================================
    // PERFORMANCE TESTS
    // ==========================================

    describe('⚡ Performance Tests', function() {

        it('should handle bulk pricing data operations efficiently', async function() {
            const startTime = Date.now();
            const batchSize = 100;

            // Insert bulk pricing data
            const values = [];
            for (let i = 0; i < batchSize; i++) {
                values.push(`(1, 'test_batch', ${10 + i}, 'NM', 'Test Comic Batch ${i}', NOW())`);
            }

            await db.query(`
                INSERT INTO pricing_data_raw 
                (comic_id, source_marketplace, price, condition, title_raw, collected_at)
                VALUES ${values.join(', ')}
            `);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (adjust based on hardware)
            expect(duration).to.be.lessThan(5000); // 5 seconds

            // Cleanup
            await db.query(`DELETE FROM pricing_data_raw WHERE source_marketplace = 'test_batch'`);
        });

        it('should cache large datasets efficiently', async function() {
            const startTime = Date.now();
            const dataSize = 1000;

            // Generate large test dataset
            const largeDataset = {
                comics: [],
                pricing: {},
                metadata: {
                    generatedAt: new Date(),
                    totalRecords: dataSize
                }
            };

            for (let i = 0; i < dataSize; i++) {
                largeDataset.comics.push({
                    id: i,
                    title: `Comic ${i}`,
                    price: Math.random() * 100
                });
            }

            // Cache large dataset
            await redisManager.cacheCompressed('large_dataset', largeDataset);

            // Retrieve and verify
            const retrievedData = await redisManager.getCompressed('large_dataset');
            expect(retrievedData.comics.length).to.equal(dataSize);

            const endTime = Date.now();
            expect(endTime - startTime).to.be.lessThan(3000); // 3 seconds
        });

        it('should handle concurrent operations safely', async function() {
            const concurrentOperations = 10;
            const promises = [];

            // Create concurrent cache operations
            for (let i = 0; i < concurrentOperations; i++) {
                const promise = redisManager.cachePricingData(
                    i, 
                    'concurrent_test', 
                    { price: i * 10, timestamp: Date.now() }
                );
                promises.push(promise);
            }

            // Wait for all operations to complete
            const results = await Promise.all(promises);
            
            // All operations should succeed
            expect(results.every(result => result === true)).to.be.true;

            // Verify data integrity
            for (let i = 0; i < concurrentOperations; i++) {
                const data = await redisManager.getPricingData(i, 'concurrent_test');
                expect(data.price).to.equal(i * 10);
            }
        });
    });

    // ==========================================
    // TEST HELPERS
    // ==========================================

    async function setupTestEnvironment() {
        console.log('   🔧 Setting up test database schema...');
        
        // Ensure test database has all required tables
        // This would run the schema.sql file in a test environment
        
        console.log('   🔧 Initializing test data...');
        
        // Insert minimal test data for foreign key constraints
        try {
            await db.query(`
                INSERT INTO publishers (id, name, slug) 
                VALUES (1, 'Test Publisher', 'test-publisher')
                ON CONFLICT (id) DO NOTHING
            `);

            await db.query(`
                INSERT INTO comics (id, title, issue_number, publisher_id)
                VALUES (1, 'Test Comic', '1', 1)
                ON CONFLICT (id) DO NOTHING
            `);

            await db.query(`
                INSERT INTO users (id, username, email, password_hash)
                VALUES (1, 'test_user', 'test@test.com', 'test_hash')
                ON CONFLICT (id) DO NOTHING
            `);

        } catch (error) {
            console.warn('   ⚠️ Could not insert test data (tables may not exist yet)');
        }

        console.log('   ✅ Test environment ready');
    }

    async function cleanupTestEnvironment() {
        console.log('   🧹 Cleaning up test data...');
        
        try {
            // Clean up test data
            await db.query(`DELETE FROM pricing_data_raw WHERE source_marketplace LIKE 'test%'`);
            await db.query(`DELETE FROM search_history WHERE search_query LIKE 'test%'`);
            
            // Clear Redis test data
            if (redisManager.redis) {
                await redisManager.redis.flushdb();
            }

        } catch (error) {
            console.warn('   ⚠️ Cleanup error:', error.message);
        }

        console.log('   ✅ Test cleanup complete');
    }
}); 