#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';

const prisma = new PrismaClient();

interface GoldenQuery {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: Record<string, any>;
  expectedStatus: number;
  assertions: {
    field: string;
    type: 'exists' | 'equals' | 'contains' | 'gt' | 'lt' | 'length';
    value?: any;
  }[];
}

const goldenQueries: GoldenQuery[] = [
  // Comics endpoints
  {
    id: 'comics_list_all',
    name: 'List all comics',
    description: 'Get paginated list of comics',
    endpoint: '/api/comics',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data', type: 'length', value: 'gt:0' },
      { field: 'pagination', type: 'exists' },
      { field: 'pagination.page', type: 'equals', value: 1 },
      { field: 'pagination.limit', type: 'equals', value: 20 }
    ]
  },
  {
    id: 'comics_search_batman',
    name: 'Search comics by title',
    description: 'Search for Batman comics',
    endpoint: '/api/comics',
    method: 'GET',
    params: { search: 'Batman' },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data[0].title', type: 'contains', value: 'Batman' }
    ]
  },
  {
    id: 'comics_filter_marvel',
    name: 'Filter comics by publisher',
    description: 'Get Marvel comics only',
    endpoint: '/api/comics',
    method: 'GET',
    params: { publisher: 'Marvel Comics' },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data[0].publisher', type: 'equals', value: 'Marvel Comics' }
    ]
  },
  {
    id: 'comics_by_year',
    name: 'Filter comics by year',
    description: 'Get comics from 2020',
    endpoint: '/api/comics',
    method: 'GET',
    params: { year: 2020 },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data[0].publicationDate', type: 'contains', value: '2020' }
    ]
  },
  {
    id: 'comics_get_single',
    name: 'Get single comic',
    description: 'Get comic by ID',
    endpoint: '/api/comics/1',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'id', type: 'equals', value: 1 },
      { field: 'title', type: 'exists' },
      { field: 'publisher', type: 'exists' },
      { field: 'publicationDate', type: 'exists' }
    ]
  },

  // Listings endpoints
  {
    id: 'listings_list_all',
    name: 'List all listings',
    description: 'Get paginated list of listings',
    endpoint: '/api/listings',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data', type: 'length', value: 'gt:0' },
      { field: 'pagination', type: 'exists' }
    ]
  },
  {
    id: 'listings_search_condition',
    name: 'Filter listings by condition',
    description: 'Get Near Mint condition listings',
    endpoint: '/api/listings',
    method: 'GET',
    params: { condition: 'Near Mint' },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data[0].condition', type: 'equals', value: 'Near Mint' }
    ]
  },
  {
    id: 'listings_price_range',
    name: 'Filter listings by price range',
    description: 'Get listings between $10-$50',
    endpoint: '/api/listings',
    method: 'GET',
    params: { minPrice: 10, maxPrice: 50 },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data[0].price', type: 'gt', value: 10 },
      { field: 'data[0].price', type: 'lt', value: 50 }
    ]
  },
  {
    id: 'listings_sort_price_asc',
    name: 'Sort listings by price ascending',
    description: 'Get listings sorted by price low to high',
    endpoint: '/api/listings',
    method: 'GET',
    params: { sort: 'price', order: 'asc' },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data', type: 'length', value: 'gt:1' }
    ]
  },
  {
    id: 'listings_get_single',
    name: 'Get single listing',
    description: 'Get listing by ID',
    endpoint: '/api/listings/1',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'id', type: 'equals', value: 1 },
      { field: 'comic', type: 'exists' },
      { field: 'seller', type: 'exists' },
      { field: 'price', type: 'exists' },
      { field: 'condition', type: 'exists' }
    ]
  },

  // Authentication endpoints (require setup)
  {
    id: 'auth_register',
    name: 'User registration',
    description: 'Register new user',
    endpoint: '/api/auth/register',
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User'
    },
    expectedStatus: 201,
    assertions: [
      { field: 'user', type: 'exists' },
      { field: 'user.email', type: 'equals', value: 'test@example.com' },
      { field: 'token', type: 'exists' }
    ]
  },
  {
    id: 'auth_login',
    name: 'User login',
    description: 'Login with credentials',
    endpoint: '/api/auth/login',
    method: 'POST',
    body: {
      email: 'admin@comicogs.com',
      password: 'admin123'
    },
    expectedStatus: 200,
    assertions: [
      { field: 'user', type: 'exists' },
      { field: 'token', type: 'exists' },
      { field: 'user.role', type: 'exists' }
    ]
  },

  // Collection/Vault endpoints (require auth)
  {
    id: 'collection_get_user',
    name: 'Get user collection',
    description: 'Get authenticated user collection',
    endpoint: '/api/collection',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'pagination', type: 'exists' }
    ]
  },

  // Saved searches endpoints
  {
    id: 'saved_searches_list',
    name: 'List saved searches',
    description: 'Get user saved searches',
    endpoint: '/api/saved-searches',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' }
    ]
  },
  {
    id: 'saved_searches_match',
    name: 'Match saved search',
    description: 'Check if query matches saved search',
    endpoint: '/api/saved-searches/match',
    method: 'GET',
    params: { search: 'Batman', publisher: 'DC Comics' },
    expectedStatus: 200,
    assertions: [
      { field: 'match', type: 'exists' }
    ]
  },

  // Error handling
  {
    id: 'comic_not_found',
    name: 'Comic not found',
    description: 'Request non-existent comic',
    endpoint: '/api/comics/99999',
    method: 'GET',
    expectedStatus: 404,
    assertions: [
      { field: 'error', type: 'exists' },
      { field: 'message', type: 'contains', value: 'not found' }
    ]
  },
  {
    id: 'listing_not_found',
    name: 'Listing not found',
    description: 'Request non-existent listing',
    endpoint: '/api/listings/99999',
    method: 'GET',
    expectedStatus: 404,
    assertions: [
      { field: 'error', type: 'exists' }
    ]
  },

  // Edge cases
  {
    id: 'comics_empty_search',
    name: 'Empty search query',
    description: 'Search with empty string',
    endpoint: '/api/comics',
    method: 'GET',
    params: { search: '' },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' }
    ]
  },
  {
    id: 'comics_invalid_page',
    name: 'Invalid page number',
    description: 'Request negative page number',
    endpoint: '/api/comics',
    method: 'GET',
    params: { page: -1 },
    expectedStatus: 400,
    assertions: [
      { field: 'error', type: 'exists' }
    ]
  },
  {
    id: 'listings_invalid_price',
    name: 'Invalid price filter',
    description: 'Min price greater than max price',
    endpoint: '/api/listings',
    method: 'GET',
    params: { minPrice: 100, maxPrice: 10 },
    expectedStatus: 400,
    assertions: [
      { field: 'error', type: 'exists' }
    ]
  },

  // Performance queries
  {
    id: 'comics_large_limit',
    name: 'Large page limit',
    description: 'Request maximum allowed items',
    endpoint: '/api/comics',
    method: 'GET',
    params: { limit: 100 },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'pagination.limit', type: 'equals', value: 100 }
    ]
  },
  {
    id: 'comics_complex_search',
    name: 'Complex search query',
    description: 'Search with multiple filters',
    endpoint: '/api/comics',
    method: 'GET',
    params: {
      search: 'Spider',
      publisher: 'Marvel Comics',
      year: 2021,
      minIssue: 1,
      maxIssue: 10
    },
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'pagination', type: 'exists' }
    ]
  },

  // Admin endpoints (require admin role)
  {
    id: 'admin_users_list',
    name: 'List all users (admin)',
    description: 'Admin endpoint to list users',
    endpoint: '/api/admin/users',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' },
      { field: 'data', type: 'length', value: 'gt:0' }
    ]
  },
  {
    id: 'admin_orders_list',
    name: 'List all orders (admin)',
    description: 'Admin endpoint to list orders',
    endpoint: '/api/admin/orders',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'data', type: 'exists' }
    ]
  },

  // Rate limiting
  {
    id: 'rate_limit_test',
    name: 'Rate limit enforcement',
    description: 'Test rate limiting on mutation endpoints',
    endpoint: '/api/auth/login',
    method: 'POST',
    body: { email: 'invalid@test.com', password: 'wrong' },
    expectedStatus: 401, // First request should be 401, subsequent should be 429
    assertions: [
      { field: 'error', type: 'exists' }
    ]
  },

  // Health check
  {
    id: 'health_check',
    name: 'API health check',
    description: 'Basic health/status endpoint',
    endpoint: '/api',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'status', type: 'equals', value: 'ok' },
      { field: 'version', type: 'exists' }
    ]
  },

  // Export functionality
  {
    id: 'export_collection_csv',
    name: 'Export collection as CSV',
    description: 'Export user collection to CSV format',
    endpoint: '/api/export/collection.csv',
    method: 'GET',
    expectedStatus: 200,
    assertions: [
      { field: 'headers.content-type', type: 'contains', value: 'text/csv' }
    ]
  },

  // Import functionality (requires multipart)
  {
    id: 'import_collection_csv',
    name: 'Import collection from CSV',
    description: 'Import collection data from CSV file',
    endpoint: '/api/import/collection.csv',
    method: 'POST',
    expectedStatus: 200,
    assertions: [
      { field: 'imported', type: 'exists' },
      { field: 'errors', type: 'exists' }
    ]
  },

  // Uploads
  {
    id: 'upload_presigned_url',
    name: 'Get presigned upload URL',
    description: 'Request presigned URL for image upload',
    endpoint: '/api/uploads/presigned',
    method: 'POST',
    body: {
      filename: 'comic-cover.jpg',
      contentType: 'image/jpeg'
    },
    expectedStatus: 200,
    assertions: [
      { field: 'uploadUrl', type: 'exists' },
      { field: 'publicUrl', type: 'exists' }
    ]
  },

  // Checkout flow
  {
    id: 'checkout_create_session',
    name: 'Create checkout session',
    description: 'Create Stripe checkout session',
    endpoint: '/api/checkout',
    method: 'POST',
    body: { listingId: 1 },
    expectedStatus: 200,
    assertions: [
      { field: 'sessionId', type: 'exists' },
      { field: 'url', type: 'exists' }
    ]
  }
];

async function createGoldenDataset() {
  try {
    logger.info('Creating golden dataset...');

    // Ensure we have some test data
    await ensureTestData();

    // Save golden queries to JSON file
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const outputPath = path.join(process.cwd(), 'golden-queries.json');
    await fs.writeFile(outputPath, JSON.stringify(goldenQueries, null, 2));
    
    logger.info({ 
      queriesCount: goldenQueries.length, 
      outputPath 
    }, 'Golden dataset created');

    // Generate summary
    const summary = {
      totalQueries: goldenQueries.length,
      byMethod: goldenQueries.reduce((acc, q) => {
        acc[q.method] = (acc[q.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: goldenQueries.reduce((acc, q) => {
        acc[q.expectedStatus] = (acc[q.expectedStatus] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      endpoints: [...new Set(goldenQueries.map(q => q.endpoint.split('/')[2] || 'root'))],
      categories: {
        comics: goldenQueries.filter(q => q.endpoint.includes('/comics')).length,
        listings: goldenQueries.filter(q => q.endpoint.includes('/listings')).length,
        auth: goldenQueries.filter(q => q.endpoint.includes('/auth')).length,
        admin: goldenQueries.filter(q => q.endpoint.includes('/admin')).length,
        collection: goldenQueries.filter(q => q.endpoint.includes('/collection')).length,
        savedSearches: goldenQueries.filter(q => q.endpoint.includes('/saved-searches')).length,
        other: goldenQueries.filter(q => 
          !q.endpoint.includes('/comics') && 
          !q.endpoint.includes('/listings') && 
          !q.endpoint.includes('/auth') && 
          !q.endpoint.includes('/admin') && 
          !q.endpoint.includes('/collection') && 
          !q.endpoint.includes('/saved-searches')
        ).length
      }
    };

    console.log('\n📊 Golden Dataset Summary:');
    console.log(`Total Queries: ${summary.totalQueries}`);
    console.log('\nBy HTTP Method:');
    Object.entries(summary.byMethod).forEach(([method, count]) => {
      console.log(`  ${method}: ${count}`);
    });
    console.log('\nBy Expected Status:');
    Object.entries(summary.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('\nBy Category:');
    Object.entries(summary.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    return goldenQueries;
  } catch (error) {
    logger.error({ error }, 'Failed to create golden dataset');
    throw error;
  }
}

async function ensureTestData() {
  // Ensure we have basic test data for the golden queries
  const userCount = await prisma.user.count();
  const comicCount = await prisma.comic.count();
  const listingCount = await prisma.listing.count();

  logger.info({
    userCount,
    comicCount,
    listingCount
  }, 'Current database state');

  if (userCount === 0 || comicCount === 0 || listingCount === 0) {
    logger.warn('Database appears to be empty. Run seed script first: npm run db:seed');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createGoldenDataset()
    .then(() => {
      console.log('\n✅ Golden dataset created successfully!');
      console.log('📁 File: golden-queries.json');
      console.log('🚀 Next: Run API assertions with: npm run test:golden');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create golden dataset:', error.message);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { goldenQueries, createGoldenDataset, type GoldenQuery };
