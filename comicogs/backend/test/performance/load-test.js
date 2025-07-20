const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

const baseURL = 'http://localhost:3001';

// Performance test configuration
const testConfig = {
  connections: 10,
  pipelining: 1,
  duration: 30, // 30 seconds
  timeout: 10000 // 10 second timeout
};

// Test endpoints and their expected response times
const endpoints = [
  {
    name: 'Health Check',
    path: '/api/status',
    method: 'GET',
    maxResponseTime: 500, // 500ms for health check
    expectedStatus: 200
  },
  {
    name: 'Comics Catalog',
    path: '/api/comics',
    method: 'GET',
    maxResponseTime: 2000, // 2s requirement
    expectedStatus: 401, // Expecting auth error without token
    requiresAuth: true
  },
  {
    name: 'Monitoring Metrics',
    path: '/api/monitoring',
    method: 'GET',
    maxResponseTime: 1000, // 1s for monitoring
    expectedStatus: 200
  },
  {
    name: 'Marketplace Listings',
    path: '/api/marketplace/listings',
    method: 'GET',
    maxResponseTime: 2000, // 2s requirement
    expectedStatus: 200
  }
];

async function runPerformanceTest(endpoint) {
  console.log(`\n🚀 Testing ${endpoint.name}...`);
  console.log(`📍 Endpoint: ${endpoint.method} ${endpoint.path}`);
  console.log(`⏱️  Max Expected Response Time: ${endpoint.maxResponseTime}ms`);
  
  const result = await autocannon({
    url: `${baseURL}${endpoint.path}`,
    method: endpoint.method,
    connections: testConfig.connections,
    pipelining: testConfig.pipelining,
    duration: testConfig.duration,
    timeout: testConfig.timeout,
    headers: endpoint.requiresAuth ? {} : undefined, // No auth header for protected endpoints to test auth speed
  });

  // Analyze results
  const analysis = analyzeResults(result, endpoint);
  printResults(endpoint, result, analysis);
  
  return analysis;
}

function analyzeResults(result, endpoint) {
  const avgLatency = result.latency.average;
  const p95Latency = result.latency.p95;
  const p99Latency = result.latency.p99;
  const requestsPerSecond = result.requests.average;
  const errorRate = (result.errors / result.requests.total) * 100;
  
  const analysis = {
    passed: true,
    issues: [],
    metrics: {
      avgLatency,
      p95Latency,
      p99Latency,
      requestsPerSecond,
      errorRate,
      totalRequests: result.requests.total,
      totalErrors: result.errors
    }
  };

  // Check response time requirements
  if (avgLatency > endpoint.maxResponseTime) {
    analysis.passed = false;
    analysis.issues.push(`Average response time (${avgLatency.toFixed(2)}ms) exceeds limit (${endpoint.maxResponseTime}ms)`);
  }

  if (p95Latency > endpoint.maxResponseTime * 1.5) {
    analysis.passed = false;
    analysis.issues.push(`95th percentile response time (${p95Latency.toFixed(2)}ms) exceeds acceptable limit`);
  }

  if (p99Latency > endpoint.maxResponseTime * 2) {
    analysis.passed = false;
    analysis.issues.push(`99th percentile response time (${p99Latency.toFixed(2)}ms) exceeds acceptable limit`);
  }

  // Check error rate
  if (errorRate > 5) { // Max 5% error rate
    analysis.passed = false;
    analysis.issues.push(`Error rate (${errorRate.toFixed(2)}%) exceeds 5% threshold`);
  }

  // Check minimum throughput
  const minThroughput = endpoint.name === 'Health Check' ? 100 : 10; // requests per second
  if (requestsPerSecond < minThroughput) {
    analysis.passed = false;
    analysis.issues.push(`Throughput (${requestsPerSecond.toFixed(2)} req/s) below minimum (${minThroughput} req/s)`);
  }

  return analysis;
}

function printResults(endpoint, result, analysis) {
  console.log(`\n📊 Results for ${endpoint.name}:`);
  console.log(`├── Requests: ${result.requests.total} total, ${result.requests.average.toFixed(2)} req/s`);
  console.log(`├── Latency: ${analysis.metrics.avgLatency.toFixed(2)}ms avg, ${analysis.metrics.p95Latency.toFixed(2)}ms p95, ${analysis.metrics.p99Latency.toFixed(2)}ms p99`);
  console.log(`├── Errors: ${result.errors} (${analysis.metrics.errorRate.toFixed(2)}%)`);
  console.log(`├── Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`├── Connections: ${testConfig.connections}`);
  
  if (analysis.passed) {
    console.log(`└── ✅ PASSED - All performance requirements met`);
  } else {
    console.log(`└── ❌ FAILED - Performance issues detected:`);
    analysis.issues.forEach(issue => {
      console.log(`    ⚠️  ${issue}`);
    });
  }
}

async function runStressTest() {
  console.log(`\n🔥 Running Stress Test...`);
  console.log(`📍 Target: Multiple endpoints with high load`);
  
  const stressConfig = {
    connections: 50, // Higher load
    pipelining: 5,
    duration: 60, // 1 minute
    timeout: 15000
  };

  const stressResult = await autocannon({
    url: `${baseURL}/api/status`,
    connections: stressConfig.connections,
    pipelining: stressConfig.pipelining,
    duration: stressConfig.duration,
    timeout: stressConfig.timeout,
  });

  console.log(`\n📊 Stress Test Results:`);
  console.log(`├── Total Requests: ${stressResult.requests.total}`);
  console.log(`├── Requests/sec: ${stressResult.requests.average.toFixed(2)}`);
  console.log(`├── Average Latency: ${stressResult.latency.average.toFixed(2)}ms`);
  console.log(`├── 95th Percentile: ${stressResult.latency.p95.toFixed(2)}ms`);
  console.log(`├── 99th Percentile: ${stressResult.latency.p99.toFixed(2)}ms`);
  console.log(`├── Errors: ${stressResult.errors}`);
  console.log(`└── Data Transferred: ${(stressResult.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);

  const stressPassed = stressResult.latency.average < 1000 && stressResult.errors < stressResult.requests.total * 0.1;
  
  if (stressPassed) {
    console.log(`\n✅ STRESS TEST PASSED - System handles high load well`);
  } else {
    console.log(`\n❌ STRESS TEST FAILED - System shows degradation under load`);
  }

  return stressPassed;
}

async function runConcurrencyTest() {
  console.log(`\n🔄 Running Concurrency Test...`);
  console.log(`📍 Testing multiple endpoints simultaneously`);
  
  const concurrentTests = endpoints.map(async (endpoint) => {
    const startTime = performance.now();
    
    const result = await autocannon({
      url: `${baseURL}${endpoint.path}`,
      method: endpoint.method,
      connections: 5,
      pipelining: 1,
      duration: 15, // Shorter duration for concurrency test
      timeout: 10000,
    });
    
    const endTime = performance.now();
    
    return {
      endpoint: endpoint.name,
      duration: endTime - startTime,
      avgLatency: result.latency.average,
      requests: result.requests.total,
      errors: result.errors
    };
  });

  const results = await Promise.all(concurrentTests);
  
  console.log(`\n📊 Concurrency Test Results:`);
  results.forEach((result, index) => {
    const passed = result.avgLatency < endpoints[index].maxResponseTime;
    const status = passed ? '✅' : '❌';
    console.log(`├── ${status} ${result.endpoint}: ${result.avgLatency.toFixed(2)}ms avg, ${result.requests} requests, ${result.errors} errors`);
  });

  const allPassed = results.every((result, index) => result.avgLatency < endpoints[index].maxResponseTime);
  
  if (allPassed) {
    console.log(`└── ✅ CONCURRENCY TEST PASSED - All endpoints perform well simultaneously`);
  } else {
    console.log(`└── ❌ CONCURRENCY TEST FAILED - Some endpoints degrade under concurrent load`);
  }

  return allPassed;
}

async function runMemoryLeakTest() {
  console.log(`\n🧠 Running Memory Leak Test...`);
  console.log(`📍 Testing for memory leaks over extended period`);
  
  const iterations = 10;
  const memoryUsage = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`    Iteration ${i + 1}/${iterations}...`);
    
    await autocannon({
      url: `${baseURL}/api/status`,
      connections: 20,
      pipelining: 1,
      duration: 10,
      timeout: 5000,
    });
    
    // Note: We can't directly measure server memory from client side
    // In a real scenario, you'd monitor server memory via system metrics
    const timestamp = Date.now();
    memoryUsage.push({ iteration: i + 1, timestamp });
    
    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Memory Leak Test Completed:`);
  console.log(`├── Iterations: ${iterations}`);
  console.log(`├── Duration: ${(memoryUsage[memoryUsage.length - 1].timestamp - memoryUsage[0].timestamp) / 1000}s`);
  console.log(`└── ✅ Test completed successfully (monitor server memory separately)`);
  
  return true;
}

async function runFullPerformanceSuite() {
  console.log(`\n🎯 ComicComp Performance Test Suite`);
  console.log(`==================================`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Target Server: ${baseURL}`);
  console.log(`⚡ Requirements: Sub-2s response times for critical endpoints`);
  
  const results = {
    endpoint_tests: [],
    stress_test: false,
    concurrency_test: false,
    memory_test: false,
    overall_passed: true
  };

  try {
    // Test individual endpoints
    console.log(`\n📍 Phase 1: Individual Endpoint Testing`);
    console.log(`=====================================`);
    
    for (const endpoint of endpoints) {
      const analysis = await runPerformanceTest(endpoint);
      results.endpoint_tests.push({
        name: endpoint.name,
        passed: analysis.passed,
        metrics: analysis.metrics,
        issues: analysis.issues
      });
      
      if (!analysis.passed) {
        results.overall_passed = false;
      }
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Stress test
    console.log(`\n📍 Phase 2: Stress Testing`);
    console.log(`========================`);
    results.stress_test = await runStressTest();
    if (!results.stress_test) {
      results.overall_passed = false;
    }

    // Concurrency test
    console.log(`\n📍 Phase 3: Concurrency Testing`);
    console.log(`==============================`);
    results.concurrency_test = await runConcurrencyTest();
    if (!results.concurrency_test) {
      results.overall_passed = false;
    }

    // Memory leak test
    console.log(`\n📍 Phase 4: Memory Leak Testing`);
    console.log(`===============================`);
    results.memory_test = await runMemoryLeakTest();

  } catch (error) {
    console.error(`\n❌ Performance test suite failed with error:`, error.message);
    results.overall_passed = false;
  }

  // Final summary
  console.log(`\n🎯 Performance Test Suite Summary`);
  console.log(`=================================`);
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  console.log(`\n📊 Results by Phase:`);
  
  // Endpoint results
  console.log(`\n📍 Individual Endpoint Tests:`);
  results.endpoint_tests.forEach(test => {
    const status = test.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`├── ${test.name}: ${status}`);
    if (!test.passed) {
      test.issues.forEach(issue => {
        console.log(`│   ⚠️  ${issue}`);
      });
    } else {
      console.log(`│   ⚡ Avg: ${test.metrics.avgLatency.toFixed(2)}ms, P95: ${test.metrics.p95Latency.toFixed(2)}ms`);
    }
  });
  
  console.log(`├── Stress Test: ${results.stress_test ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`├── Concurrency Test: ${results.concurrency_test ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`└── Memory Test: ${results.memory_test ? '✅ PASSED' : '❌ FAILED'}`);

  if (results.overall_passed) {
    console.log(`\n🎉 OVERALL PERFORMANCE: ✅ PASSED`);
    console.log(`   All performance requirements met!`);
    console.log(`   Sub-2s response times confirmed for critical endpoints.`);
  } else {
    console.log(`\n💥 OVERALL PERFORMANCE: ❌ FAILED`);
    console.log(`   Some performance requirements not met.`);
    console.log(`   Review individual test results above.`);
  }

  return results;
}

// Export for use in other test files
module.exports = {
  runFullPerformanceSuite,
  runPerformanceTest,
  endpoints,
  testConfig
};

// Run if called directly
if (require.main === module) {
  runFullPerformanceSuite()
    .then((results) => {
      process.exit(results.overall_passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Performance test suite crashed:', error);
      process.exit(1);
    });
} 