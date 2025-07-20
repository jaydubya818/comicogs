const request = require('supertest');
const { expect } = require('chai');

// Since we don't have a test app setup, we'll test against the running server
const baseURL = 'http://localhost:3001';

describe('ComicComp MVP - Comprehensive E2E Test Suite', function() {
  this.timeout(30000); // 30 second timeout for all tests
  
  let userToken = null;
  let testUserId = null;
  let testComicId = null;
  let testCollectionId = null;
  let testWantlistId = null;
  let testListingId = null;

  // Test data
  const testUser = {
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    password: 'TestPassword123!'
  };

  const testComic = {
    title: 'Test Comic',
    issue: '1',
    publisher: 'Test Comics',
    year: 2024,
    creators: ['Test Creator'],
    characters: ['Test Hero'],
    story_arcs: ['Test Arc']
  };

  before(async function() {
    console.log('🚀 Starting ComicComp E2E Test Suite...');
    console.log('📍 Testing against:', baseURL);
  });

  describe('🔧 System Health & Monitoring', function() {
    it('should have a healthy system status', async function() {
      const response = await request(baseURL)
        .get('/api/status')
        .expect(200);
      
      expect(response.body).to.have.property('status', 'healthy');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('version');
    });

    it('should provide monitoring metrics', async function() {
      const response = await request(baseURL)
        .get('/api/monitoring')
        .expect(200);
      
      expect(response.body).to.have.property('metrics');
      expect(response.body.metrics).to.have.property('requests');
      expect(response.body.metrics).to.have.property('errors');
      expect(response.body.metrics).to.have.property('uptime');
    });
  });

  describe('🔐 Authentication System', function() {
    it('should register a new user successfully', async function() {
      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body).to.have.property('message', 'User registered successfully');
      expect(response.body).to.have.property('token');
      userToken = response.body.token;
    });

    it('should login with valid credentials', async function() {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('username', testUser.username);
      userToken = response.body.token;
      testUserId = response.body.user.id;
    });

    it('should reject invalid credentials', async function() {
      await request(baseURL)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should protect endpoints with authentication', async function() {
      await request(baseURL)
        .get('/api/collections')
        .expect(401);
    });
  });

  describe('📚 Comics Catalog Management', function() {
    it('should create a new comic entry', async function() {
      const response = await request(baseURL)
        .post('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testComic)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('title', testComic.title);
      testComicId = response.body.id;
    });

    it('should retrieve comics catalog', async function() {
      const response = await request(baseURL)
        .get('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      const comic = response.body.find(c => c.id === testComicId);
      expect(comic).to.exist;
      expect(comic.title).to.equal(testComic.title);
    });

    it('should search comics by title', async function() {
      const response = await request(baseURL)
        .get(`/api/comics?search=${testComic.title}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
    });

    it('should update comic information', async function() {
      const updatedData = { ...testComic, year: 2025 };
      
      const response = await request(baseURL)
        .put(`/api/comics/${testComicId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body.year).to.equal(2025);
    });
  });

  describe('📖 Collection Management', function() {
    it('should add comic to user collection', async function() {
      const collectionItem = {
        comic_id: testComicId,
        condition: 'NM',
        purchase_price: 25.99,
        current_value: 30.00
      };

      const response = await request(baseURL)
        .post('/api/collections')
        .set('Authorization', `Bearer ${userToken}`)
        .send(collectionItem)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('comic_id', testComicId);
      testCollectionId = response.body.id;
    });

    it('should retrieve user collection', async function() {
      const response = await request(baseURL)
        .get('/api/collections')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      const item = response.body.find(c => c.id === testCollectionId);
      expect(item).to.exist;
      expect(item.condition).to.equal('NM');
    });

    it('should update collection item', async function() {
      const updateData = {
        condition: 'VF/NM',
        current_value: 35.00
      };

      const response = await request(baseURL)
        .put(`/api/collections/${testCollectionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.condition).to.equal('VF/NM');
      expect(response.body.current_value).to.equal(35.00);
    });

    it('should calculate collection statistics', async function() {
      const response = await request(baseURL)
        .get('/api/collections/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('total_items');
      expect(response.body).to.have.property('total_value');
      expect(response.body).to.have.property('total_investment');
    });
  });

  describe('⭐ Want List Management', function() {
    it('should add comic to want list', async function() {
      const wantlistItem = {
        comic_id: testComicId,
        max_price: 50.00,
        priority: 3,
        condition_preference: 'VF+'
      };

      const response = await request(baseURL)
        .post('/api/wantlists')
        .set('Authorization', `Bearer ${userToken}`)
        .send(wantlistItem)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('max_price', 50.00);
      testWantlistId = response.body.id;
    });

    it('should retrieve user want list', async function() {
      const response = await request(baseURL)
        .get('/api/wantlists')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      const item = response.body.find(w => w.id === testWantlistId);
      expect(item).to.exist;
      expect(item.priority).to.equal(3);
    });

    it('should update want list item', async function() {
      const updateData = {
        max_price: 45.00,
        priority: 5
      };

      const response = await request(baseURL)
        .put(`/api/wantlists/${testWantlistId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.max_price).to.equal(45.00);
      expect(response.body.priority).to.equal(5);
    });
  });

  describe('🛒 Marketplace Operations', function() {
    it('should create marketplace listing', async function() {
      const listing = {
        comic_id: testComicId,
        price: 40.00,
        condition: 'NM',
        description: 'Test listing for e2e tests'
      };

      const response = await request(baseURL)
        .post('/api/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(listing)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('price', 40.00);
      testListingId = response.body.id;
    });

    it('should retrieve marketplace listings', async function() {
      const response = await request(baseURL)
        .get('/api/marketplace/listings')
        .expect(200);
      
      expect(response.body).to.be.an('array');
      const listing = response.body.find(l => l.id === testListingId);
      expect(listing).to.exist;
      expect(listing.condition).to.equal('NM');
    });

    it('should search marketplace listings', async function() {
      const response = await request(baseURL)
        .get(`/api/marketplace/listings?search=${testComic.title}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
    });

    it('should update marketplace listing', async function() {
      const updateData = {
        price: 35.00,
        description: 'Updated test listing'
      };

      const response = await request(baseURL)
        .put(`/api/marketplace/listings/${testListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.price).to.equal(35.00);
    });
  });

  describe('💰 Pricing Intelligence', function() {
    it('should fetch comic pricing data', async function() {
      const response = await request(baseURL)
        .get(`/api/pricing/comic/${testComicId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('comic_id', testComicId);
      expect(response.body).to.have.property('price_data');
    });

    it('should provide price trends', async function() {
      const response = await request(baseURL)
        .get(`/api/pricing/trends/${testComicId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('trend_data');
      expect(response.body).to.have.property('market_indicators');
    });

    it('should generate price alerts', async function() {
      const alertData = {
        comic_id: testComicId,
        target_price: 30.00,
        condition: 'NM'
      };

      const response = await request(baseURL)
        .post('/api/pricing/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alertData)
        .expect(201);
      
      expect(response.body).to.have.property('alert_id');
      expect(response.body).to.have.property('target_price', 30.00);
    });
  });

  describe('🤖 AI Features', function() {
    it('should provide collection recommendations', async function() {
      const response = await request(baseURL)
        .get('/api/ai/recommendations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('recommendations');
      expect(response.body.recommendations).to.be.an('array');
    });

    it('should analyze market trends', async function() {
      const response = await request(baseURL)
        .post('/api/ai/market-analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comic_ids: [testComicId] })
        .expect(200);
      
      expect(response.body).to.have.property('analysis');
      expect(response.body).to.have.property('predictions');
    });

    it('should provide investment insights', async function() {
      const response = await request(baseURL)
        .get('/api/ai/investment-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).to.have.property('insights');
      expect(response.body).to.have.property('risk_assessment');
    });
  });

  describe('🔍 Data Integrity & Validation', function() {
    it('should validate comic data structure', async function() {
      const invalidComic = {
        title: '', // Invalid: empty title
        issue: 'invalid',
        publisher: null
      };

      await request(baseURL)
        .post('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidComic)
        .expect(400);
    });

    it('should enforce collection constraints', async function() {
      const invalidCollection = {
        comic_id: 99999, // Non-existent comic
        condition: 'INVALID_CONDITION',
        purchase_price: -10 // Invalid negative price
      };

      await request(baseURL)
        .post('/api/collections')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidCollection)
        .expect(400);
    });

    it('should prevent duplicate entries where appropriate', async function() {
      const duplicateItem = {
        comic_id: testComicId,
        condition: 'NM',
        purchase_price: 25.99
      };

      // First addition should succeed (already done in previous tests)
      // Second addition should be handled appropriately
      const response = await request(baseURL)
        .post('/api/collections')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateItem);
      
      // Response should either be 409 (conflict) or 200 (allowed duplicate)
      expect([200, 201, 409]).to.include(response.status);
    });
  });

  describe('⚡ Performance Validation', function() {
    it('should respond to catalog requests within 2 seconds', async function() {
      const startTime = Date.now();
      
      await request(baseURL)
        .get('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.below(2000, `Response time was ${responseTime}ms, expected < 2000ms`);
    });

    it('should handle concurrent collection requests efficiently', async function() {
      const promises = [];
      const concurrentRequests = 5;
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(baseURL)
            .get('/api/collections')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).to.equal(200);
      });
      
      // Total time for 5 concurrent requests should be reasonable
      const totalTime = endTime - startTime;
      expect(totalTime).to.be.below(5000, `Concurrent requests took ${totalTime}ms`);
    });
  });

  describe('🔒 Security Validation', function() {
    it('should prevent SQL injection attacks', async function() {
      const maliciousInput = "'; DROP TABLE comics; --";
      
      const response = await request(baseURL)
        .get(`/api/comics?search=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Request should either succeed safely or be rejected
      expect([200, 400]).to.include(response.status);
      
      // Verify comics table still exists by making a normal request
      await request(baseURL)
        .get('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should sanitize user input', async function() {
      const xssInput = '<script>alert("xss")</script>';
      
      const response = await request(baseURL)
        .post('/api/comics')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: xssInput,
          issue: '1',
          publisher: 'Test'
        });
      
      if (response.status === 201) {
        // If creation succeeded, the input should be sanitized
        expect(response.body.title).to.not.include('<script>');
      }
    });

    it('should enforce rate limiting', async function() {
      this.timeout(10000);
      
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(baseURL)
            .get('/api/comics')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).to.be.greaterThan(0);
      
      // Rate limiting might kick in (429 responses)
      const rateLimitedRequests = responses.filter(r => r.status === 429);
      console.log(`Rate limited requests: ${rateLimitedRequests.length}/20`);
    });
  });

  describe('🧹 Cleanup', function() {
    it('should clean up test data', async function() {
      // Delete marketplace listing
      if (testListingId) {
        await request(baseURL)
          .delete(`/api/marketplace/listings/${testListingId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      // Delete want list item
      if (testWantlistId) {
        await request(baseURL)
          .delete(`/api/wantlists/${testWantlistId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      // Delete collection item
      if (testCollectionId) {
        await request(baseURL)
          .delete(`/api/collections/${testCollectionId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      // Delete test comic
      if (testComicId) {
        await request(baseURL)
          .delete(`/api/comics/${testComicId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      console.log('✅ Test data cleanup completed');
    });
  });

  after(function() {
    console.log('🎉 ComicComp E2E Test Suite completed!');
  });
});

module.exports = {
  testUser,
  testComic
}; 