import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const BaseURL = __ENV.API_BASE_URL || 'http://localhost:4000';
export const WarmTTL = Number(__ENV.CACHE_TTL || 90); // seconds (matches your Redis TTL)
export const VUsCold = Number(__ENV.VUS_COLD || 5);
export const VUsWarm = Number(__ENV.VUS_WARM || 20);
export const DurationCold = __ENV.DUR_COLD || '30s';
export const DurationWarm = __ENV.DUR_WARM || '2m';

const errorRate = new Rate('errors');
const p95 = new Trend('http_p95', true);

// A small, realistic mix (aligned to your golden seed)
const QUERIES = [
  '/api/listings?status=active&limit=24&page=1',
  '/api/listings?series=ASM&status=active&limit=24',
  '/api/listings?series=ASM&issue=129&status=active',
  '/api/listings?series=ASM&issue=300&status=active',
  '/api/listings?format=raw&maxPrice=500&status=active',
  '/api/listings?grade=CGC%209.8&status=active',
  '/api/listings?search=Spider&status=active',
  '/api/listings?series=UF&issue=4&status=active',
  '/api/listings?series=X-Men&status=active&limit=12',
  '/api/listings?publisher=Marvel&status=active&limit=36',
  '/api/listings?year_start=1980&year_end=1990&status=active',
  '/api/listings?price_min=10&price_max=100&status=active',
];

// Phase 1 (smoke/cold): small VUs, short duration
// Phase 2 (warm): larger VUs to exercise caching layer
export const options = {
  scenarios: {
    cold: {
      executor: 'constant-vus',
      vus: VUsCold,
      duration: DurationCold,
      exec: 'hitListings',
      tags: { phase: 'cold' }
    },
    warm: {
      startTime: DurationCold, // start after cold finishes
      executor: 'constant-vus',
      vus: VUsWarm,
      duration: DurationWarm,
      exec: 'hitListings',
      tags: { phase: 'warm' }
    },
  },
  thresholds: {
    // Keep expectations modest; we'll assert stricter in CI notes if desired
    'errors': ['rate<0.01'], // Less than 1% error rate
    // k6's built-in http_req_duration threshold (global)
    'http_req_duration{phase:warm}': ['p(95)<300'], // warm should be fast with cache
    'http_req_duration{phase:cold}': ['p(95)<800']  // cold can be slower
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function hitListings() {
  const url = `${BaseURL}${pick(QUERIES)}`;
  const res = http.get(url, { 
    headers: { 
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0'
    } 
  });

  const ok = check(res, {
    'status 2xx/304': (r) => r.status === 200 || r.status === 304,
    'json shape has items or array': (r) => {
      try {
        if (r.status === 304) return true; // Not modified is OK
        const js = r.json();
        return Array.isArray(js) || Array.isArray(js?.items) || typeof js?.total === 'number';
      } catch { 
        return false; 
      }
    },
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'has cache headers': (r) => r.headers['Cache-Control'] !== undefined || r.headers['ETag'] !== undefined,
  });

  errorRate.add(!ok);
  p95.add(res.timings.duration);

  // tiny think time to avoid hammering a single endpoint path in the same ms
  sleep(0.2);
}

// Test different endpoints for comprehensive coverage
export function hitMixedEndpoints() {
  const endpoints = [
    '/api/listings',
    '/api/comics',
    '/api/search',
    '/health',
  ];
  
  const endpoint = pick(endpoints);
  const res = http.get(`${BaseURL}${endpoint}`, {
    headers: { 
      'Accept': 'application/json',
      'User-Agent': 'k6-mixed-test/1.0'
    }
  });
  
  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time OK': (r) => r.timings.duration < 1000,
  });
  
  sleep(0.5);
}

// Test authentication endpoints
export function hitAuthEndpoints() {
  // Test public endpoints first
  const publicEndpoints = [
    '/api/listings',
    '/api/comics',
    '/health'
  ];
  
  const endpoint = pick(publicEndpoints);
  const res = http.get(`${BaseURL}${endpoint}`, {
    headers: { 
      'Accept': 'application/json',
      'User-Agent': 'k6-auth-test/1.0'
    }
  });
  
  check(res, {
    'public endpoint accessible': (r) => r.status === 200,
  });
  
  // Test protected endpoint without auth (should fail gracefully)
  const protectedRes = http.get(`${BaseURL}/api/orders`, {
    headers: { 
      'Accept': 'application/json',
      'User-Agent': 'k6-auth-test/1.0'
    }
  });
  
  check(protectedRes, {
    'protected endpoint requires auth': (r) => r.status === 401 || r.status === 403,
  });
  
  sleep(0.3);
}

// Setup function to prepare test environment
export function setup() {
  console.log(`Starting k6 performance test against ${BaseURL}`);
  console.log(`Cold phase: ${VUsCold} VUs for ${DurationCold}`);
  console.log(`Warm phase: ${VUsWarm} VUs for ${DurationWarm}`);
  
  // Health check
  const healthRes = http.get(`${BaseURL}/health`);
  if (healthRes.status !== 200) {
    console.error(`Health check failed: ${healthRes.status}`);
    throw new Error('Server is not healthy');
  }
  
  // Pre-warm some endpoints
  const prewarmQueries = [
    '/api/listings?status=active&limit=24',
    '/api/listings?series=ASM&status=active',
  ];
  
  console.log('Pre-warming cache...');
  prewarmQueries.forEach(query => {
    http.get(`${BaseURL}${query}`, {
      headers: { 'User-Agent': 'k6-prewarm/1.0' }
    });
  });
  
  return { startTime: new Date() };
}

// Optional utility to keep the job busy for cache TTL validation runs
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
  console.log('Final health check...');
  
  const healthRes = http.get(`${BaseURL}/health`);
  if (healthRes.status !== 200) {
    console.warn(`Final health check failed: ${healthRes.status}`);
  } else {
    console.log('Server is still healthy after load test');
  }
}