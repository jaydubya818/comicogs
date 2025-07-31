// Test setup and configuration for ComicComp backend
const { Pool } = require('pg');
const Redis = require('redis');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'comicogs_test',
  user: process.env.TEST_DB_USER || 'jaywest',
  password: process.env.TEST_DB_PASSWORD || ''
};

// Test Redis configuration
const testRedisConfig = {
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: process.env.TEST_REDIS_PORT || 6379,
  db: 1 // Use different database for tests
};

let testDb;
let testRedis;

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';

  // Initialize test database
  testDb = new Pool(testDbConfig);

  // Initialize test Redis
  testRedis = Redis.createClient(testRedisConfig);
  await testRedis.connect();

  // Create test database schema
  await setupTestDatabase();

  console.log('Test environment initialized');
});

// Global test teardown
afterAll(async () => {
  // Clean up test database
  await cleanupTestDatabase();

  // Close connections
  if (testDb) {
    await testDb.end();
  }

  if (testRedis) {
    await testRedis.quit();
  }

  console.log('Test environment cleaned up');
});

// Reset database state before each test
beforeEach(async () => {
  await cleanupTestData();
});

// Setup test database schema
async function setupTestDatabase() {
  try {
    // Run database migrations
    const fs = require('fs').promises;
    const path = require('path');

    const schemaPath = path.join(__dirname, '..', 'database.sql');
    let schema;
    try {
      schema = await fs.readFile(schemaPath, 'utf8');
      if (!schema || schema.trim().length === 0) {
        throw new Error('Schema file is empty or could not be read');
      }
    } catch (fileError) {
      console.error('Failed to load schema file:', fileError.message);
      throw fileError;
    }

    // Execute the entire migration as one transaction
    try {
      await testDb.query(schema);
    } catch (queryError) {
      // If full migration fails, try splitting into statements
      console.warn(`Full migration failed, trying statement by statement`);

      // Check if schema is defined
      if (!schema) {
        console.error('Schema is undefined, cannot split into statements');
        throw new Error('Schema loading failed');
      }

      // Split migration into individual statements and execute
      const statements = schema
        .split(/;\s*\n/)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await testDb.query(statement + ';');
          } catch (stmtError) {
            // Skip errors for existing objects or harmless warnings
            if (!stmtError.message.includes('already exists') &&
                !stmtError.message.includes('does not exist, skipping')) {
              console.warn(`Warning in migration:`, stmtError.message);
            }
          }
        }
      }
    }

    console.log('Test database schema created');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

// Clean up test database
async function cleanupTestDatabase() {
  try {
    await testDb.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Test database cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

// Clean up test data between tests
async function cleanupTestData() {
  try {
    // Clear Redis cache
    await testRedis.flushDb();

    // Clear test data from tables (preserve schema)
    const tables = [
      'recognition_feedback',
      'recognition_embeddings',
      'recognition_results',
      'user_recognition_preferences',
      'recognition_models',
      'image_recognition_jobs',
      'collection_activity',
      'collection_export_jobs',
      'collection_shares',
      'collection_wishlist_items',
      'collection_wishlists',
      'collection_statistics',
      'collection_item_tags',
      'collection_folder_items',
      'collection_tags',
      'collection_folders',
      'api_usage_logs',
      'api_rate_limits',
      'oauth_user_consents',
      'oauth_refresh_tokens',
      'oauth_access_tokens',
      'oauth_authorization_codes',
      'oauth_applications',
      'personal_access_tokens',
      'search_history',
      'price_alerts',
      'listing_success_tracking',
      'marketplace_listings',
      'wantlists',
      'collections',
      'comics',
      'series',
      'publishers',
      'users'
    ];

    for (const table of tables) {
      await testDb.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`).catch(() => {
        // Ignore errors for tables that don't exist
      });
    }

  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
}

// Test utilities
const testUtils = {
  // Create test user
  async createTestUser(userData = {}) {
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password_hash: '$2b$10$test.hash.here',
      is_verified: true
    };

    const user = { ...defaultUser, ...userData };

    const result = await testDb.query(`
      INSERT INTO users (username, email, password_hash, is_verified, role, developer_enabled)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      user.username, 
      user.email, 
      user.password_hash, 
      user.is_verified,
      user.role || 'user',
      user.developer_enabled || false
    ]);

    return result.rows[0];
  },

  // Create test comic
  async createTestComic(comicData = {}) {
    // First create publisher and series if needed
    const publisherName = comicData.publisher_name || 'Test Publisher';

    const publisher = await testDb.query(`
      INSERT INTO publishers (name) VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [publisherName]);

    const seriesName = comicData.series_name || 'Test Series';
    const publisherId = publisher.rows[0].id;

    const series = await testDb.query(`
      INSERT INTO series (title, publisher_id) VALUES ($1, $2)
      RETURNING id
    `, [seriesName, publisherId]);

    const defaultComic = {
      title: 'Test Comic',
      issue_number: '1',
      publisher_id: publisher.rows[0].id,
      series_id: series.rows[0].id,
      publication_date: '2023-01-01'
    };

    const comic = { ...defaultComic, ...comicData };

    const result = await testDb.query(`
      INSERT INTO comics (title, issue_number, publisher_id, series_id, publication_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [comic.title, comic.issue_number, comic.publisher_id, comic.series_id, comic.publication_date]);

    return result.rows[0];
  },

  // Create test collection item
  async createTestCollection(userId, comicId, collectionData = {}) {
    const defaultCollection = {
      condition: 'Near Mint',
      purchase_price: 10.00,
      current_value: 12.00,
      for_sale: false
    };

    const collection = { ...defaultCollection, ...collectionData };

    const result = await testDb.query(`
      INSERT INTO collections (user_id, comic_id, condition, purchase_price, current_value, for_sale)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, comicId, collection.condition, collection.purchase_price, collection.current_value, collection.for_sale]);

    return result.rows[0];
  },

  // Create test marketplace listing
  async createTestListing(userId, comicId, listingData = {}) {
    const defaultListing = {
      title: 'Test Comic for Sale',
      description: 'Test description',
      price: 15.00,
      condition: 'Near Mint',
      status: 'active'
    };

    const listing = { ...defaultListing, ...listingData };

    const result = await testDb.query(`
      INSERT INTO marketplace_listings (user_id, comic_id, title, description, price, condition, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, comicId, listing.title, listing.description, listing.price, listing.condition, listing.status]);

    return result.rows[0];
  },

  // Generate JWT token for testing
  generateTestToken(userId, scopes = ['read']) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId,
        scopes,
        tokenType: 'personal_access_token'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Database query helper
  async query(sql, params = []) {
    return await testDb.query(sql, params);
  },

  // Redis helper
  async setCache(key, value, ttl = 300) {
    await testRedis.setEx(key, ttl, JSON.stringify(value));
  },

  async getCache(key) {
    const value = await testRedis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // AI Image Recognition test utilities
  async createTestRecognitionJob(userId, jobData = {}) {
    const defaultJob = {
      status: 'completed',
      total_images: 2,
      processed_images: 2,
      provider: 'openai',
      model_used: 'gpt-4-vision-preview',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const job = { ...defaultJob, ...jobData };

    const result = await testDb.query(`
      INSERT INTO image_recognition_jobs (user_id, status, total_images, processed_images, provider, model_used, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, job.status, job.total_images, job.processed_images, job.provider, job.model_used, job.created_at, job.updated_at]);

    return result.rows[0];
  },

  async createTestRecognitionResult(jobId, resultData = {}) {
    const defaultResult = {
      image_url: 'https://example.com/comic.jpg',
      comic_title: 'Amazing Spider-Man',
      issue_number: '1',
      publisher: 'Marvel Comics',
      confidence_score: 0.95,
      analysis_data: JSON.stringify({
        key_characters: ['Spider-Man'],
        story_arc: 'Origin'
      }),
      processing_time: 2.5,
      created_at: new Date().toISOString()
    };

    const result = { ...defaultResult, ...resultData };

    const dbResult = await testDb.query(`
      INSERT INTO recognition_results (job_id, image_url, comic_title, issue_number, publisher, confidence_score, analysis_data, processing_time, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [jobId, result.image_url, result.comic_title, result.issue_number, result.publisher, result.confidence_score, result.analysis_data, result.processing_time, result.created_at]);

    return dbResult.rows[0];
  },

  async createTestUserPreferences(userId, preferencesData = {}) {
    const defaultPreferences = {
      preferred_provider: 'openai',
      preferred_model: 'gpt-4-vision-preview',
      auto_save_results: true,
      confidence_threshold: 0.7,
      max_suggestions: 5,
      include_embeddings: true,
      notification_settings: JSON.stringify({
        job_completed: true,
        job_failed: true
      })
    };

    const preferences = { ...defaultPreferences, ...preferencesData };

    const result = await testDb.query(`
      INSERT INTO user_recognition_preferences (user_id, preferred_provider, preferred_model, auto_save_results, confidence_threshold, max_suggestions, include_embeddings, notification_settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, preferences.preferred_provider, preferences.preferred_model, preferences.auto_save_results, preferences.confidence_threshold, preferences.max_suggestions, preferences.include_embeddings, preferences.notification_settings]);

    return result.rows[0];
  },

  async createTestFeedback(userId, resultId, feedbackData = {}) {
    const defaultFeedback = {
      is_correct: true,
      confidence_rating: 5,
      correct_comic_title: 'Amazing Spider-Man',
      correct_issue_number: '1',
      comments: 'Excellent identification',
      created_at: new Date().toISOString()
    };

    const feedback = { ...defaultFeedback, ...feedbackData };

    const result = await testDb.query(`
      INSERT INTO recognition_feedback (user_id, result_id, is_correct, confidence_rating, correct_comic_title, correct_issue_number, comments, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, resultId, feedback.is_correct, feedback.confidence_rating, feedback.correct_comic_title, feedback.correct_issue_number, feedback.comments, feedback.created_at]);

    return result.rows[0];
  }
};

// Export test utilities and connections
module.exports = {
  testDb,
  testRedis,
  testUtils
};
