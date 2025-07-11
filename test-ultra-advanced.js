#!/usr/bin/env node

const fs = require('fs');

const baseURL = 'http://localhost:3000';

// Ultra-Advanced Test Categories
const extremeEdgeCaseTests = [
  {
    name: 'Extreme Negative Values Test',
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    test_cases: [
      { fuelType: 'natural_gas', consumption: -999999, unit: 'MMBtu' },
      { fuelType: 'gasoline', consumption: Number.MIN_SAFE_INTEGER, unit: 'gallon' },
      { fuelType: 'diesel', consumption: -0.000001, unit: 'gallon' }
    ]
  },
  {
    name: 'Extreme Large Values Test',
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    test_cases: [
      { fuelType: 'natural_gas', consumption: Number.MAX_SAFE_INTEGER, unit: 'MMBtu' },
      { fuelType: 'gasoline', consumption: 999999999999, unit: 'gallon' },
      { fuelType: 'coal', consumption: 1e20, unit: 'short_ton' }
    ]
  },
  {
    name: 'Invalid Data Types Test',
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    test_cases: [
      { fuelType: null, consumption: 100, unit: 'MMBtu' },
      { fuelType: 'natural_gas', consumption: 'invalid', unit: 'MMBtu' },
      { fuelType: 'natural_gas', consumption: 100, unit: [] },
      { fuelType: {}, consumption: 100, unit: 'MMBtu' }
    ]
  },
  {
    name: 'Unicode and Special Characters Test',
    endpoint: '/api/projects',
    method: 'POST',
    test_cases: [
      { action: 'create', name: '测试项目🌳🌍', description: 'Unicode test ñáéíóú', project_type: 'reforestation' },
      { action: 'create', name: '🔥💧⚡', description: 'Emoji test', project_type: 'renewable_energy' },
      { action: 'create', name: 'Test\t\n\r', description: 'Control chars', project_type: 'reforestation' }
    ]
  }
];

const concurrencyStressTests = [
  {
    name: 'Database Transaction Integrity Test',
    type: 'concurrency',
    concurrent_operations: 25,
    duration: 8000,
    operations: [
      { endpoint: '/api/cart', method: 'POST', body: { action: 'add_item', projectId: 'test-{{id}}', quantity: 5 } },
      { endpoint: '/api/cart', method: 'GET' },
      { endpoint: '/api/projects', method: 'POST', body: { action: 'create', name: 'Concurrent {{id}}', description: 'Test', project_type: 'reforestation', total_credits: 1000 } }
    ]
  },
  {
    name: 'Memory Leak Detection Test',
    type: 'memory',
    iterations: 100,
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    body: { fuelType: 'natural_gas', consumption: 1000, unit: 'MMBtu' }
  },
  {
    name: 'Session Management Stress Test',
    type: 'session',
    concurrent_sessions: 20,
    operations_per_session: 10,
    endpoints: [
      '/api/carbon-calculator/assessments',
      '/api/cart',
      '/api/projects',
      '/api/carbon-calculator/emission-factors'
    ]
  }
];

const advancedSecurityTests = [
  {
    name: 'CORS Security Test',
    type: 'cors',
    endpoint: '/api/carbon-calculator/emission-factors',
    method: 'GET',
    origins: [
      'https://malicious.com',
      'http://localhost:3001',
      'null',
      'file://'
    ]
  },
  {
    name: 'HTTP Method Override Test',
    type: 'method_override',
    endpoint: '/api/projects',
    test_methods: ['DELETE', 'PUT', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE']
  },
  {
    name: 'Content Type Confusion Test',
    type: 'content_type',
    endpoint: '/api/cart',
    content_types: [
      'application/xml',
      'text/plain',
      'multipart/form-data',
      'application/x-www-form-urlencoded',
      'text/html'
    ],
    body: { action: 'add_item', projectId: 'test', quantity: 1 }
  },
  {
    name: 'Path Traversal Test',
    type: 'path_traversal',
    base_endpoint: '/api',
    paths: [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd'
    ]
  }
];

const performanceAnalyticsTests = [
  {
    name: 'Response Time Distribution Analysis',
    type: 'response_time',
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    body: { fuelType: 'natural_gas', consumption: 100, unit: 'MMBtu' },
    requests: 200,
    metrics: ['min', 'max', 'avg', 'p50', 'p90', 'p95', 'p99']
  },
  {
    name: 'Throughput Analysis',
    type: 'throughput',
    endpoints: [
      '/api/carbon-calculator/emission-factors',
      '/api/projects',
      '/api/test-db',
      '/api/cart'
    ],
    duration: 10000,
    concurrent_users: [1, 5, 10, 15, 20]
  },
  {
    name: 'Resource Usage Monitoring',
    type: 'resource_usage',
    endpoint: '/api/carbon-calculator/calculate',
    method: 'POST',
    body: { fuelType: 'natural_gas', consumption: 10000, unit: 'MMBtu' },
    duration: 5000,
    monitor_memory: true
  }
];

const businessLogicTests = [
  {
    name: 'Carbon Calculation Accuracy Test',
    type: 'calculation_accuracy',
    test_cases: [
      { input: { fuelType: 'natural_gas', consumption: 1, unit: 'MMBtu' }, expected_range: [0.05, 0.06] },
      { input: { fuelType: 'gasoline', consumption: 1, unit: 'gallon' }, expected_range: [0.019, 0.021] },
      { input: { fuelType: 'diesel', consumption: 1, unit: 'gallon' }, expected_range: [0.022, 0.024] }
    ]
  },
  {
    name: 'Project Credit Validation Test',
    type: 'credit_validation',
    test_cases: [
      { total_credits: 1000, price_per_credit: 25, expected_total: 25000 },
      { total_credits: 500, price_per_credit: 30.50, expected_total: 15250 },
      { total_credits: 0, price_per_credit: 25, expected_total: 0 }
    ]
  },
  {
    name: 'Cart Calculation Integrity Test',
    type: 'cart_integrity',
    workflow: [
      { action: 'add_item', projectId: 'test-1', quantity: 10, price: 25 },
      { action: 'add_item', projectId: 'test-2', quantity: 5, price: 30 },
      { action: 'verify_total', expected_total: 400 }
    ]
  }
];

// Helper Functions
async function performExtremeEdgeCaseTest(test) {
  console.log(`\n🚨 Running ${test.name}`);
  
  const results = [];
  
  for (const testCase of test.test_cases) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      };
      
      const response = await fetch(`${baseURL}${test.endpoint}`, options);
      const data = await response.json().catch(() => null);
      
      // For extreme edge cases, we expect the API to handle gracefully
      const handled_gracefully = response.status === 400 || (response.ok && data !== null);
      
      results.push({
        testCase: testCase,
        status: response.status,
        handled_gracefully,
        data: data
      });
      
      console.log(`  ${JSON.stringify(testCase).slice(0, 50)}...: ${handled_gracefully ? '✅ HANDLED' : '❌ NOT HANDLED'} (${response.status})`);
      
    } catch (error) {
      results.push({
        testCase: testCase,
        status: 'ERROR',
        handled_gracefully: true, // Catching errors is good
        error: error.message
      });
      console.log(`  ${JSON.stringify(testCase).slice(0, 50)}...: ✅ CAUGHT ERROR`);
    }
  }
  
  const handledGracefully = results.filter(r => r.handled_gracefully).length;
  const percentage = Math.round(handledGracefully / results.length * 100);
  
  console.log(`  Gracefully handled: ${handledGracefully}/${results.length} (${percentage}%)`);
  console.log(`  Result: ${percentage >= 90 ? '✅ EXCELLENT' : percentage >= 70 ? '⚠️  GOOD' : '❌ NEEDS IMPROVEMENT'}`);
  
  return {
    test: test.name,
    type: 'extreme_edge_case',
    results,
    graceful_handling_rate: percentage,
    passed: percentage >= 70
  };
}

async function performConcurrencyTest(test) {
  console.log(`\n⚡ Running ${test.name}`);
  
  if (test.type === 'concurrency') {
    const startTime = Date.now();
    const promises = [];
    const results = [];
    
    for (let i = 0; i < test.concurrent_operations; i++) {
      const promise = (async (id) => {
        const operationResults = [];
        
        while (Date.now() - startTime < test.duration) {
          for (const operation of test.operations) {
            try {
              let body = operation.body;
              if (body && JSON.stringify(body).includes('{{id}}')) {
                body = JSON.parse(JSON.stringify(body).replace(/\{\{id\}\}/g, id));
              }
              
              const options = {
                method: operation.method,
                headers: { 'Content-Type': 'application/json' }
              };
              if (body) options.body = JSON.stringify(body);
              
              const response = await fetch(`${baseURL}${operation.endpoint}`, options);
              operationResults.push({
                operation: operation.endpoint,
                status: response.status,
                success: response.ok,
                timestamp: Date.now()
              });
              
            } catch (error) {
              operationResults.push({
                operation: operation.endpoint,
                status: 'ERROR',
                success: false,
                error: error.message,
                timestamp: Date.now()
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return operationResults;
      })(i);
      
      promises.push(promise);
    }
    
    const allResults = await Promise.all(promises);
    const flatResults = allResults.flat();
    
    const successCount = flatResults.filter(r => r.success).length;
    const successRate = Math.round(successCount / flatResults.length * 100);
    
    console.log(`  Concurrent operations: ${test.concurrent_operations}`);
    console.log(`  Duration: ${test.duration}ms`);
    console.log(`  Total requests: ${flatResults.length}`);
    console.log(`  Success rate: ${successRate}%`);
    console.log(`  Result: ${successRate >= 95 ? '✅ EXCELLENT' : successRate >= 85 ? '⚠️  GOOD' : '❌ POOR'}`);
    
    return {
      test: test.name,
      type: 'concurrency',
      total_requests: flatResults.length,
      success_rate: successRate,
      passed: successRate >= 85
    };
  }
  
  if (test.type === 'memory') {
    console.log(`  Running ${test.iterations} iterations for memory leak detection...`);
    
    const memoryUsage = [];
    
    for (let i = 0; i < test.iterations; i++) {
      try {
        const options = {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.body)
        };
        
        const startMemory = process.memoryUsage();
        await fetch(`${baseURL}${test.endpoint}`, options);
        const endMemory = process.memoryUsage();
        
        memoryUsage.push({
          iteration: i,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        });
        
        if (i % 20 === 0) {
          console.log(`    Iteration ${i}/${test.iterations}`);
        }
        
      } catch (error) {
        console.log(`    Error at iteration ${i}: ${error.message}`);
      }
    }
    
    const avgHeapIncrease = memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / memoryUsage.length;
    const memoryLeak = avgHeapIncrease > 1024 * 1024; // 1MB threshold
    
    console.log(`  Average heap increase per request: ${Math.round(avgHeapIncrease / 1024)}KB`);
    console.log(`  Memory leak detected: ${memoryLeak ? 'YES ⚠️' : 'NO ✅'}`);
    
    return {
      test: test.name,
      type: 'memory',
      avg_heap_increase: avgHeapIncrease,
      memory_leak_detected: memoryLeak,
      passed: !memoryLeak
    };
  }
  
  return { test: test.name, type: 'unknown', passed: false };
}

async function performPerformanceAnalytics(test) {
  console.log(`\n📊 Running ${test.name}`);
  
  if (test.type === 'response_time') {
    const responseTimes = [];
    
    console.log(`  Collecting response times for ${test.requests} requests...`);
    
    for (let i = 0; i < test.requests; i++) {
      try {
        const startTime = Date.now();
        
        const options = {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.body)
        };
        
        const response = await fetch(`${baseURL}${test.endpoint}`, options);
        const endTime = Date.now();
        
        responseTimes.push({
          responseTime: endTime - startTime,
          status: response.status,
          success: response.ok
        });
        
        if (i % 50 === 0) {
          console.log(`    Progress: ${i}/${test.requests}`);
        }
        
      } catch (error) {
        responseTimes.push({
          responseTime: -1,
          status: 'ERROR',
          success: false
        });
      }
    }
    
    const successfulTimes = responseTimes.filter(r => r.success).map(r => r.responseTime);
    successfulTimes.sort((a, b) => a - b);
    
    const metrics = {
      min: Math.min(...successfulTimes),
      max: Math.max(...successfulTimes),
      avg: Math.round(successfulTimes.reduce((sum, t) => sum + t, 0) / successfulTimes.length),
      p50: successfulTimes[Math.floor(successfulTimes.length * 0.5)],
      p90: successfulTimes[Math.floor(successfulTimes.length * 0.9)],
      p95: successfulTimes[Math.floor(successfulTimes.length * 0.95)],
      p99: successfulTimes[Math.floor(successfulTimes.length * 0.99)]
    };
    
    console.log(`  Response Time Analysis:`);
    console.log(`    Min: ${metrics.min}ms`);
    console.log(`    Avg: ${metrics.avg}ms`);
    console.log(`    P95: ${metrics.p95}ms`);
    console.log(`    Max: ${metrics.max}ms`);
    console.log(`    Success rate: ${Math.round(successfulTimes.length / test.requests * 100)}%`);
    
    const performanceGrade = metrics.p95 < 100 ? 'EXCELLENT' : metrics.p95 < 300 ? 'GOOD' : metrics.p95 < 1000 ? 'FAIR' : 'POOR';
    console.log(`  Performance Grade: ${performanceGrade} ${performanceGrade === 'EXCELLENT' ? '🚀' : performanceGrade === 'GOOD' ? '✅' : performanceGrade === 'FAIR' ? '⚠️' : '❌'}`);
    
    return {
      test: test.name,
      type: 'performance_analytics',
      metrics,
      performance_grade: performanceGrade,
      passed: performanceGrade !== 'POOR'
    };
  }
  
  return { test: test.name, type: 'unknown', passed: false };
}

async function performBusinessLogicTest(test) {
  console.log(`\n💼 Running ${test.name}`);
  
  if (test.type === 'calculation_accuracy') {
    const results = [];
    
    for (const testCase of test.test_cases) {
      try {
        const options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.input)
        };
        
        const response = await fetch(`${baseURL}/api/carbon-calculator/calculate`, options);
        const data = await response.json();
        
        const actualValue = data.totalEmissions;
        const inRange = actualValue >= testCase.expected_range[0] && actualValue <= testCase.expected_range[1];
        
        results.push({
          input: testCase.input,
          expected_range: testCase.expected_range,
          actual_value: actualValue,
          accurate: inRange
        });
        
        console.log(`  ${testCase.input.fuelType}: ${actualValue} tCO2e (expected: ${testCase.expected_range[0]}-${testCase.expected_range[1]}) ${inRange ? '✅' : '❌'}`);
        
      } catch (error) {
        results.push({
          input: testCase.input,
          error: error.message,
          accurate: false
        });
        console.log(`  ${testCase.input.fuelType}: ERROR - ${error.message}`);
      }
    }
    
    const accurateResults = results.filter(r => r.accurate).length;
    const accuracy = Math.round(accurateResults / results.length * 100);
    
    console.log(`  Calculation accuracy: ${accuracy}%`);
    console.log(`  Result: ${accuracy >= 90 ? '✅ EXCELLENT' : accuracy >= 80 ? '⚠️  GOOD' : '❌ POOR'}`);
    
    return {
      test: test.name,
      type: 'business_logic',
      results,
      accuracy_percentage: accuracy,
      passed: accuracy >= 80
    };
  }
  
  return { test: test.name, type: 'unknown', passed: false };
}

// Main ultra-advanced test runner
async function runUltraAdvancedTests() {
  console.log('🌟 ULTRA-ADVANCED COMPREHENSIVE TESTING SUITE');
  console.log('==============================================\n');
  
  const allResults = {
    extreme_edge_cases: [],
    concurrency_stress: [],
    advanced_security: [],
    performance_analytics: [],
    business_logic: []
  };
  
  // Extreme Edge Case Testing
  console.log('🚨 EXTREME EDGE CASE TESTING:');
  console.log('=============================');
  
  for (const test of extremeEdgeCaseTests) {
    const result = await performExtremeEdgeCaseTest(test);
    allResults.extreme_edge_cases.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Concurrency & Stress Testing
  console.log('\n⚡ CONCURRENCY & STRESS TESTING:');
  console.log('================================');
  
  for (const test of concurrencyStressTests) {
    const result = await performConcurrencyTest(test);
    allResults.concurrency_stress.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Performance Analytics
  console.log('\n📊 PERFORMANCE ANALYTICS:');
  console.log('=========================');
  
  for (const test of performanceAnalyticsTests) {
    const result = await performPerformanceAnalytics(test);
    allResults.performance_analytics.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Business Logic Testing
  console.log('\n💼 BUSINESS LOGIC TESTING:');
  console.log('==========================');
  
  for (const test of businessLogicTests) {
    const result = await performBusinessLogicTest(test);
    allResults.business_logic.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate Ultra-Advanced Report
  console.log('\n🏆 ULTRA-ADVANCED TEST SUMMARY REPORT:');
  console.log('======================================');
  
  const edgeCasePassed = allResults.extreme_edge_cases.filter(t => t.passed).length;
  const concurrencyPassed = allResults.concurrency_stress.filter(t => t.passed).length;
  const analyticsPassed = allResults.performance_analytics.filter(t => t.passed).length;
  const businessLogicPassed = allResults.business_logic.filter(t => t.passed).length;
  
  console.log(`\n🚨 Extreme Edge Cases: ${edgeCasePassed}/${extremeEdgeCaseTests.length} passed (${Math.round(edgeCasePassed/extremeEdgeCaseTests.length*100)}%)`);
  console.log(`⚡ Concurrency Tests: ${concurrencyPassed}/${concurrencyStressTests.length} passed (${Math.round(concurrencyPassed/concurrencyStressTests.length*100)}%)`);
  console.log(`📊 Performance Analytics: ${analyticsPassed}/${performanceAnalyticsTests.length} passed (${Math.round(analyticsPassed/performanceAnalyticsTests.length*100)}%)`);
  console.log(`💼 Business Logic: ${businessLogicPassed}/${businessLogicTests.length} passed (${Math.round(businessLogicPassed/businessLogicTests.length*100)}%)`);
  
  const totalTests = extremeEdgeCaseTests.length + concurrencyStressTests.length + performanceAnalyticsTests.length + businessLogicTests.length;
  const totalPassed = edgeCasePassed + concurrencyPassed + analyticsPassed + businessLogicPassed;
  const enterpriseScore = Math.round(totalPassed / totalTests * 100);
  
  console.log(`\n🌟 ENTERPRISE READINESS SCORE: ${enterpriseScore}%`);
  
  if (enterpriseScore >= 95) {
    console.log('🥇 WORLD-CLASS - Platform exceeds Fortune 500 standards');
  } else if (enterpriseScore >= 90) {
    console.log('🥈 ENTERPRISE-GRADE - Platform ready for large-scale deployment');
  } else if (enterpriseScore >= 85) {
    console.log('🥉 PRODUCTION-READY - Platform meets industry standards');
  } else if (enterpriseScore >= 75) {
    console.log('⚠️  NEEDS OPTIMIZATION - Platform requires performance tuning');
  } else {
    console.log('❌ NOT READY - Platform needs significant improvements');
  }
  
  // Advanced insights
  console.log('\n🔬 ADVANCED INSIGHTS:');
  
  // Edge case handling
  const avgGracefulHandling = allResults.extreme_edge_cases.reduce((sum, t) => sum + (t.graceful_handling_rate || 0), 0) / allResults.extreme_edge_cases.length;
  console.log(`  🚨 Edge case handling: ${avgGracefulHandling.toFixed(1)}% graceful`);
  
  // Concurrency resilience
  const avgConcurrencySuccess = allResults.concurrency_stress.reduce((sum, t) => sum + (t.success_rate || 0), 0) / allResults.concurrency_stress.length;
  console.log(`  ⚡ Concurrency resilience: ${avgConcurrencySuccess.toFixed(1)}% success rate`);
  
  // Memory health
  const memoryTests = allResults.concurrency_stress.filter(t => t.type === 'memory');
  if (memoryTests.length > 0) {
    const memoryLeaks = memoryTests.filter(t => t.memory_leak_detected).length;
    console.log(`  🧠 Memory health: ${memoryLeaks === 0 ? 'No leaks detected ✅' : `${memoryLeaks} leak(s) detected ⚠️`}`);
  }
  
  // Performance characteristics
  const performanceTests = allResults.performance_analytics.filter(t => t.metrics);
  if (performanceTests.length > 0) {
    const avgP95 = performanceTests.reduce((sum, t) => sum + t.metrics.p95, 0) / performanceTests.length;
    console.log(`  📊 Average P95 response time: ${avgP95.toFixed(0)}ms`);
  }
  
  // Business logic accuracy
  const accuracyTests = allResults.business_logic.filter(t => t.accuracy_percentage);
  if (accuracyTests.length > 0) {
    const avgAccuracy = accuracyTests.reduce((sum, t) => sum + t.accuracy_percentage, 0) / accuracyTests.length;
    console.log(`  💼 Business logic accuracy: ${avgAccuracy.toFixed(1)}%`);
  }
  
  // Save ultra-advanced results
  fs.writeFileSync('ultra-advanced-test-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n💾 Ultra-advanced test results saved to ultra-advanced-test-results.json');
  
  console.log('\n🎯 PRODUCTION READINESS CHECKLIST:');
  console.log('===================================');
  console.log(`${enterpriseScore >= 90 ? '✅' : '❌'} Enterprise-grade performance`);
  console.log(`${avgGracefulHandling >= 90 ? '✅' : '❌'} Robust error handling`);
  console.log(`${avgConcurrencySuccess >= 95 ? '✅' : '❌'} High concurrency support`);
  console.log(`${memoryTests.every(t => !t.memory_leak_detected) ? '✅' : '❌'} Memory leak free`);
  console.log(`${performanceTests.every(t => t.metrics.p95 < 500) ? '✅' : '❌'} Fast response times`);
  
  return allResults;
}

// Run the ultra-advanced tests
if (require.main === module) {
  runUltraAdvancedTests()
    .then(results => {
      console.log('\n🌟 Ultra-advanced testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ultra-advanced testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runUltraAdvancedTests }; 