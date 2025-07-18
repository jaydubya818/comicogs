const { Pool } = require('pg');
const redis = require('redis');
const config = require('../comiccomp/config/index.js');

const pool = new Pool({
  user: 'jaywest',
  host: 'localhost',
  database: 'comicogs',
  password: '',
  port: 5432,
});

const redisClient = redis.createClient({
  url: `redis://${config.cache.redis.host}:${config.cache.redis.port}`
});

(async () => {
  await redisClient.connect();
})();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  redisClient,
};