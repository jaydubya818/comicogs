const { Pool } = require('pg');
const redis = require('redis');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'jaywest',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'comicogs',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client from pool:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Redis client with error handling
let redisClient = null;

try {
  redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
  });

  redisClient.on('error', (err) => {
    console.warn(
      '⚠️ Redis Client Error (continuing without Redis):',
      err.message
    );
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  // Try to connect to Redis but don't block startup if it fails
  redisClient.connect().catch((err) => {
    console.warn(
      '⚠️ Redis connection failed (continuing without Redis):',
      err.message
    );
    redisClient = null;
  });
} catch (err) {
  console.warn(
    '⚠️ Redis initialization failed (continuing without Redis):',
    err.message
  );
  redisClient = null;
}

// Helper function to convert SQLite placeholders to PostgreSQL format
function convertSQLiteToPostgreSQL(query, params = []) {
  let paramIndex = 1;
  const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
  return { query: convertedQuery, params };
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  
  // SQLite-compatible methods for legacy services
  async run(text, params = []) {
    const { query: convertedQuery, params: convertedParams } = convertSQLiteToPostgreSQL(text, params);
    const result = await pool.query(convertedQuery, convertedParams);
    return { lastID: result.insertId || (result.rows[0] && result.rows[0].id), changes: result.rowCount };
  },
  
  async get(text, params = []) {
    const { query: convertedQuery, params: convertedParams } = convertSQLiteToPostgreSQL(text, params);
    const result = await pool.query(convertedQuery, convertedParams);
    return result.rows[0];
  },
  
  async all(text, params = []) {
    const { query: convertedQuery, params: convertedParams } = convertSQLiteToPostgreSQL(text, params);
    const result = await pool.query(convertedQuery, convertedParams);
    return result.rows;
  },
  
  redisClient
};
