#!/usr/bin/env node

const fs = require('fs');

const baseURL = 'http://localhost:3000';

// Production Stress Test Scenarios
const productionStressTests = [
  {
    name: 'Black Friday Shopping Simulation',
    type: 'shopping_surge',
    concurrent_users: 50,
    duration: 15000, // 15 seconds
    user_actions: [
      { weight: 40, endpoint: '/api/projects', method: 'GET' },
      { weight: 30, endpoint: '/api/cart', method: 'POST', body: { action: 'add_item', projectId: 'surge-{{user}}', quantity: '{{random_1_10}}' } },
      { weight: 20, endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'natural_gas', consumption: '{{random_100_1000}}', unit: 'MMBtu' } },
      { weight: 10, endpoint: '/api/checkout', method: 'POST', body: { action: 'initialize' } }
    ]
  },
  {
    name: 'Enterprise Carbon Assessment Surge',
    type: 'calculation_surge',
    concurrent_assessments: 30,
    duration: 12000,
    assessment_types: [
      { fuelType: 'natural_gas', consumption_range: [1000, 50000], unit: 'MMBtu' },
      { fuelType: 'gasoline', consumption_range: [500, 10000], unit: 'gallon' },
      { fuelType: 'diesel', consumption_range: [300, 8000], unit: 'gallon' },
      { fuelType: 'coal', consumption_range: [100, 5000], unit: 'short_ton' }
    ]
  },
  {
    name: 'Seller Project Registration Wave',
    type: 'registration_wave',
    concurrent_sellers: 25,
    duration: 10000,
    project_templates: [
      { type: 'reforestation', credits_range: [1000, 50000], price_range: [20, 35] },
      { type: 'renewable_energy', credits_range: [5000, 100000], price_range: [25, 40] },
      { type: 'carbon_capture', credits_range: [2000, 75000], price_range: [30, 50] }
    ]
  },
  {
    name: 'Verifier Queue Processing Stress',
    type: 'verification_stress',
    concurrent_verifiers: 15,
    duration: 8000,
    verification_actions: [
      { action: 'get_queue', weight: 50 },
      { action: 'review_project', weight: 30 },
      { action: 'approve_project', weight: 20 }
    ]
  }
];

// Real-world Integration Tests
const integrationTests = [
  {
    name: 'Complete Purchase Journey',
    type: 'end_to_end',
    steps: [
      { action: 'browse_marketplace', endpoint: '/api/projects', method: 'GET', expected_status: 200 },
      { action: 'calculate_emissions', endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'natural_gas', consumption: 1500, unit: 'MMBtu' }, expected_status: 200 },
      { action: 'add_to_cart', endpoint: '/api/cart', method: 'POST', body: { action: 'add_item', projectId: 'journey-test', quantity: 15 }, expected_status: 200 },
      { action: 'view_cart', endpoint: '/api/cart', method: 'GET', expected_status: 200 },
      { action: 'checkout', endpoint: '/api/checkout', method: 'POST', body: { action: 'initialize' }, expected_status: 200 }
    ]
  },
  {
    name: 'Seller Onboarding to Approval',
    type: 'seller_workflow',
    steps: [
      { action: 'register_project', endpoint: '/api/projects', method: 'POST', body: { action: 'create', name: 'Integration Project', description: 'Full workflow test', project_type: 'reforestation', total_credits: 10000, price_per_credit: 28 }, expected_status: 201 },
      { action: 'submit_verification', endpoint: '/api/seller', method: 'POST', body: { action: 'submit_project', project_id: 'integration-project' }, expected_status: 200 },
      { action: 'verifier_queue', endpoint: '/api/verifier', method: 'GET', expected_status: 200 },
      { action: 'complete_review', endpoint: '/api/verifier', method: 'POST', body: { action: 'review', verification_id: 'integration-review', data: { status: 'approved', comments: 'Integration test passed' } }, expected_status: 200 }
    ]
  },
  {
    name: 'Multi-Assessment Workflow',
    type: 'assessment_workflow',
    steps: [
      { action: 'create_assessment', endpoint: '/api/carbon-calculator/assessments', method: 'POST', body: { action: 'create', data: { orgName: 'Integration Corp', year: 2024 } }, expected_status: 201 },
      { action: 'add_calculation_1', endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'natural_gas', consumption: 2000, unit: 'MMBtu' }, expected_status: 200 },
      { action: 'add_calculation_2', endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'gasoline', consumption: 1500, unit: 'gallon' }, expected_status: 200 },
      { action: 'finalize_assessment', endpoint: '/api/carbon-calculator/assessments', method: 'GET', expected_status: 200 }
    ]
  }
];

// Performance Benchmark Tests
const benchmarkTests = [
  {
    name: 'API Response Time Benchmark',
    type: 'response_benchmark',
    iterations: 500,
    endpoints: [
      { path: '/api/carbon-calculator/emission-factors', method: 'GET', target_p95: 150 },
      { path: '/api/projects', method: 'GET', target_p95: 200 },
      { path: '/api/test-db', method: 'GET', target_p95: 100 },
      { path: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'natural_gas', consumption: 100, unit: 'MMBtu' }, target_p95: 300 }
    ]
  },
  {
    name: 'Database Connection Resilience',
    type: 'db_resilience',
    concurrent_connections: 40,
    duration: 10000,
    operations: [
      { endpoint: '/api/test-db-detailed', method: 'GET', weight: 60 },
      { endpoint: '/api/projects', method: 'GET', weight: 25 },
      { endpoint: '/api/carbon-calculator/assessments', method: 'GET', weight: 15 }
    ]
  },
  {
    name: 'Large Data Processing Test',
    type: 'large_data',
    test_cases: [
      { fuelType: 'natural_gas', consumption: 1000000, unit: 'MMBtu', expected_processing_time: 1000 },
      { fuelType: 'coal', consumption: 500000, unit: 'short_ton', expected_processing_time: 1000 },
      { fuelType: 'gasoline', consumption: 100000, unit: 'gallon', expected_processing_time: 800 }
    ]
  }
];

// System Reliability Tests
const reliabilityTests = [
  {
    name: 'Error Recovery and Graceful Degradation',
    type: 'error_recovery',
    test_scenarios: [
      { scenario: 'malformed_json', endpoint: '/api/cart', method: 'POST', body: '{"malformed":json}', expected_handling: true },
      { scenario: 'missing_parameters', endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: {}, expected_handling: true },
      { scenario: 'invalid_endpoints', endpoint: '/api/nonexistent', method: 'GET', expected_handling: true },
      { scenario: 'oversized_payload', endpoint: '/api/projects', method: 'POST', body: { action: 'create', name: 'X'.repeat(100000) }, expected_handling: true }
    ]
  },
  {
    name: 'Data Consistency Under Load',
    type: 'data_consistency',
    concurrent_operations: 20,
    consistency_checks: [
      { operation: 'cart_operations', endpoint: '/api/cart', method: 'POST', body: { action: 'add_item', projectId: 'consistency-{{id}}', quantity: 1 } },
      { operation: 'project_creation', endpoint: '/api/projects', method: 'POST', body: { action: 'create', name: 'Consistency {{id}}', project_type: 'reforestation' } }
    ]
  }
];

// Helper Functions
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function replaceTemplateValues(obj, userId) {
  let str = JSON.stringify(obj);
  str = str.replace(/\{\{user\}\}/g, userId);
  str = str.replace(/\{\{user_id\}\}/g, userId);
  str = str.replace(/\{\{id\}\}/g, userId);
  str = str.replace(/\{\{random_1_10\}\}/g, getRandomValue(1, 10));
  str = str.replace(/\{\{random_100_1000\}\}/g, getRandomValue(100, 1000));
  return JSON.parse(str);
}

async function runProductionStressTest(test) {
  console.log(`\n🔥 Running ${test.name}`);
  console.log(`   Type: ${test.type} | Users: ${test.concurrent_users || test.concurrent_assessments || test.concurrent_sellers || test.concurrent_verifiers} | Duration: ${test.duration}ms`);
  
  const startTime = Date.now();
  const allResults = [];
  const promises = [];
  
  const userCount = test.concurrent_users || test.concurrent_assessments || test.concurrent_sellers || test.concurrent_verifiers;
  
  for (let userId = 1; userId <= userCount; userId++) {
    const userPromise = (async () => {
      const userResults = [];
      
      while (Date.now() - startTime < test.duration) {
        try {
          let selectedAction;
          
          if (test.user_actions) {
            // Weighted random selection
            const totalWeight = test.user_actions.reduce((sum, action) => sum + action.weight, 0);
            let randomWeight = Math.random() * totalWeight;
            
            for (const action of test.user_actions) {
              randomWeight -= action.weight;
              if (randomWeight <= 0) {
                selectedAction = action;
                break;
              }
            }
          } else if (test.assessment_types) {
            // Random assessment type
            const assessmentType = test.assessment_types[Math.floor(Math.random() * test.assessment_types.length)];
            const consumption = getRandomValue(assessmentType.consumption_range[0], assessmentType.consumption_range[1]);
            selectedAction = {
              endpoint: '/api/carbon-calculator/calculate',
              method: 'POST',
              body: {
                fuelType: assessmentType.fuelType,
                consumption: consumption,
                unit: assessmentType.unit
              }
            };
          } else if (test.project_templates) {
            // Random project creation
            const template = test.project_templates[Math.floor(Math.random() * test.project_templates.length)];
            const credits = getRandomValue(template.credits_range[0], template.credits_range[1]);
            const price = getRandomValue(template.price_range[0] * 100, template.price_range[1] * 100) / 100;
            selectedAction = {
              endpoint: '/api/projects',
              method: 'POST',
              body: {
                action: 'create',
                name: `${template.type} Project ${userId}-${Date.now()}`,
                description: `Production stress test project`,
                project_type: template.type,
                total_credits: credits,
                price_per_credit: price
              }
            };
          } else if (test.verification_actions) {
            // Random verification action
            const action = test.verification_actions[Math.floor(Math.random() * test.verification_actions.length)];
            if (action.action === 'get_queue') {
              selectedAction = { endpoint: '/api/verifier', method: 'GET' };
            } else {
              selectedAction = { 
                endpoint: '/api/verifier', 
                method: 'POST', 
                body: { action: action.action, verification_id: `stress-${userId}` }
              };
            }
          }
          
          if (selectedAction) {
            let body = selectedAction.body;
            if (body) {
              body = replaceTemplateValues(body, userId);
            }
            
            const options = {
              method: selectedAction.method,
              headers: { 'Content-Type': 'application/json' }
            };
            if (body) options.body = JSON.stringify(body);
            
            const requestStart = Date.now();
            const response = await fetch(`${baseURL}${selectedAction.endpoint}`, options);
            const responseTime = Date.now() - requestStart;
            
            userResults.push({
              endpoint: selectedAction.endpoint,
              method: selectedAction.method,
              status: response.status,
              success: response.ok,
              responseTime,
              timestamp: Date.now()
            });
          }
          
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 20));
          
        } catch (error) {
          userResults.push({
            endpoint: 'ERROR',
            method: 'ERROR',
            status: 'ERROR',
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }
      
      return { userId, results: userResults };
    })();
    
    promises.push(userPromise);
  }
  
  const allUserResults = await Promise.all(promises);
  const flatResults = allUserResults.reduce((acc, user) => acc.concat(user.results), []);
  
  // Analyze results
  const totalRequests = flatResults.length;
  const successfulRequests = flatResults.filter(r => r.success).length;
  const successRate = Math.round(successfulRequests / totalRequests * 100);
  
  const responseTimes = flatResults.filter(r => r.responseTime).map(r => r.responseTime);
  responseTimes.sort((a, b) => a - b);
  
  const avgResponseTime = Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length);
  const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
  
  const requestsPerSecond = Math.round(totalRequests / (test.duration / 1000));
  
  console.log(`   📊 Results:`);
  console.log(`      Total requests: ${totalRequests}`);
  console.log(`      Success rate: ${successRate}%`);
  console.log(`      Avg response time: ${avgResponseTime}ms`);
  console.log(`      P95 response time: ${p95ResponseTime}ms`);
  console.log(`      Throughput: ${requestsPerSecond} req/sec`);
  
  const grade = successRate >= 95 && p95ResponseTime < 500 ? 'EXCELLENT' : 
                successRate >= 90 && p95ResponseTime < 1000 ? 'GOOD' : 
                successRate >= 80 ? 'FAIR' : 'POOR';
  
  console.log(`      Grade: ${grade} ${grade === 'EXCELLENT' ? '🚀' : grade === 'GOOD' ? '✅' : grade === 'FAIR' ? '⚠️' : '❌'}`);
  
  return {
    test: test.name,
    type: 'production_stress',
    totalRequests,
    successRate,
    avgResponseTime,
    p95ResponseTime,
    requestsPerSecond,
    grade,
    passed: grade !== 'POOR'
  };
}

async function runIntegrationTest(test) {
  console.log(`\n🔗 Running ${test.name}`);
  console.log(`   Type: ${test.type} | Steps: ${test.steps.length}`);
  
  const results = [];
  let allStepsPassed = true;
  let totalTime = 0;
  
  for (const step of test.steps) {
    try {
      const options = {
        method: step.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (step.body) {
        options.body = JSON.stringify(step.body);
      }
      
      const startTime = Date.now();
      const response = await fetch(`${baseURL}${step.endpoint}`, options);
      const responseTime = Date.now() - startTime;
      totalTime += responseTime;
      
      const stepPassed = response.status === step.expected_status;
      
      results.push({
        action: step.action,
        endpoint: step.endpoint,
        expectedStatus: step.expected_status,
        actualStatus: response.status,
        responseTime,
        passed: stepPassed
      });
      
      if (!stepPassed) allStepsPassed = false;
      
      console.log(`      ${step.action}: ${stepPassed ? '✅' : '❌'} (${response.status}, ${responseTime}ms)`);
      
    } catch (error) {
      results.push({
        action: step.action,
        endpoint: step.endpoint,
        error: error.message,
        passed: false
      });
      allStepsPassed = false;
      console.log(`      ${step.action}: ❌ ERROR (${error.message})`);
    }
  }
  
  console.log(`   📊 Integration Result: ${allStepsPassed ? '✅ COMPLETE' : '❌ FAILED'} (Total time: ${totalTime}ms)`);
  
  return {
    test: test.name,
    type: 'integration',
    steps: results,
    allStepsPassed,
    totalTime,
    passed: allStepsPassed
  };
}

async function runBenchmarkTest(test) {
  console.log(`\n⚡ Running ${test.name}`);
  console.log(`   Type: ${test.type}`);
  
  if (test.type === 'response_benchmark') {
    const benchmarkResults = [];
    
    for (const endpoint of test.endpoints) {
      console.log(`   📈 Benchmarking ${endpoint.path}...`);
      
      const responseTimes = [];
      
      for (let i = 0; i < test.iterations; i++) {
        try {
          const options = {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' }
          };
          
          if (endpoint.body) {
            options.body = JSON.stringify(endpoint.body);
          }
          
          const startTime = Date.now();
          const response = await fetch(`${baseURL}${endpoint.path}`, options);
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            responseTimes.push(responseTime);
          }
          
          if (i % 100 === 0) {
            console.log(`      Progress: ${i}/${test.iterations}`);
          }
          
        } catch (error) {
          // Skip errors for benchmark
        }
      }
      
      responseTimes.sort((a, b) => a - b);
      
      const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      const avg = Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length);
      const targetMet = p95 <= endpoint.target_p95;
      
      benchmarkResults.push({
        endpoint: endpoint.path,
        iterations: responseTimes.length,
        avgResponseTime: avg,
        p95ResponseTime: p95,
        targetP95: endpoint.target_p95,
        targetMet
      });
      
      console.log(`      Avg: ${avg}ms | P95: ${p95}ms | Target: ${endpoint.target_p95}ms | ${targetMet ? '✅ MET' : '❌ MISSED'}`);
    }
    
    const targetsMet = benchmarkResults.filter(r => r.targetMet).length;
    const benchmarkGrade = Math.round(targetsMet / benchmarkResults.length * 100);
    
    console.log(`   📊 Benchmark Score: ${benchmarkGrade}% (${targetsMet}/${benchmarkResults.length} targets met)`);
    
    return {
      test: test.name,
      type: 'benchmark',
      results: benchmarkResults,
      benchmarkScore: benchmarkGrade,
      passed: benchmarkGrade >= 80
    };
  }
  
  return { test: test.name, type: 'unknown', passed: false };
}

// Main production stress test runner
async function runProductionStressTests() {
  console.log('🏭 PRODUCTION STRESS TESTING SUITE');
  console.log('===================================\n');
  
  const allResults = {
    production_stress: [],
    integration_tests: [],
    benchmark_tests: [],
    reliability_tests: []
  };
  
  // Production Stress Tests
  console.log('🔥 PRODUCTION STRESS TESTING:');
  console.log('=============================');
  
  for (const test of productionStressTests) {
    const result = await runProductionStressTest(test);
    allResults.production_stress.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Cool down
  }
  
  // Integration Tests
  console.log('\n🔗 INTEGRATION TESTING:');
  console.log('=======================');
  
  for (const test of integrationTests) {
    const result = await runIntegrationTest(test);
    allResults.integration_tests.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Benchmark Tests
  console.log('\n⚡ BENCHMARK TESTING:');
  console.log('====================');
  
  for (const test of benchmarkTests) {
    const result = await runBenchmarkTest(test);
    allResults.benchmark_tests.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Generate Production Readiness Report
  console.log('\n🏭 PRODUCTION READINESS REPORT:');
  console.log('===============================');
  
  const stressPassed = allResults.production_stress.filter(t => t.passed).length;
  const integrationPassed = allResults.integration_tests.filter(t => t.passed).length;
  const benchmarkPassed = allResults.benchmark_tests.filter(t => t.passed).length;
  
  console.log(`\n🔥 Production Stress: ${stressPassed}/${productionStressTests.length} passed (${Math.round(stressPassed/productionStressTests.length*100)}%)`);
  console.log(`🔗 Integration Tests: ${integrationPassed}/${integrationTests.length} passed (${Math.round(integrationPassed/integrationTests.length*100)}%)`);
  console.log(`⚡ Benchmark Tests: ${benchmarkPassed}/${benchmarkTests.length} passed (${Math.round(benchmarkPassed/benchmarkTests.length*100)}%)`);
  
  const totalTests = productionStressTests.length + integrationTests.length + benchmarkTests.length;
  const totalPassed = stressPassed + integrationPassed + benchmarkPassed;
  const productionScore = Math.round(totalPassed / totalTests * 100);
  
  console.log(`\n🏭 PRODUCTION READINESS SCORE: ${productionScore}%`);
  
  if (productionScore >= 95) {
    console.log('🌟 PRODUCTION-READY - Platform exceeds enterprise requirements');
  } else if (productionScore >= 90) {
    console.log('✅ ENTERPRISE-READY - Platform meets high-scale production standards');
  } else if (productionScore >= 85) {
    console.log('⚠️  NEAR-PRODUCTION - Platform needs minor optimizations');
  } else if (productionScore >= 75) {
    console.log('🔧 NEEDS-WORK - Platform requires performance improvements');
  } else {
    console.log('❌ NOT-READY - Platform needs major improvements');
  }
  
  // Performance insights
  console.log('\n📈 PERFORMANCE INSIGHTS:');
  
  const avgThroughput = allResults.production_stress.reduce((sum, t) => sum + (t.requestsPerSecond || 0), 0) / allResults.production_stress.length;
  console.log(`  🚀 Average throughput: ${avgThroughput.toFixed(1)} req/sec`);
  
  const avgSuccessRate = allResults.production_stress.reduce((sum, t) => sum + (t.successRate || 0), 0) / allResults.production_stress.length;
  console.log(`  ✅ Average success rate: ${avgSuccessRate.toFixed(1)}%`);
  
  const excellentTests = allResults.production_stress.filter(t => t.grade === 'EXCELLENT').length;
  console.log(`  🏆 Excellent performance: ${excellentTests}/${allResults.production_stress.length} tests`);
  
  // Save production results
  fs.writeFileSync('production-stress-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n💾 Production stress test results saved to production-stress-results.json');
  
  console.log('\n🎯 ENTERPRISE DEPLOYMENT CHECKLIST:');
  console.log('===================================');
  console.log(`${avgSuccessRate >= 99 ? '✅' : '❌'} 99%+ success rate under load`);
  console.log(`${avgThroughput >= 50 ? '✅' : '❌'} High throughput capability`);
  console.log(`${integrationPassed === integrationTests.length ? '✅' : '❌'} All workflows complete successfully`);
  console.log(`${benchmarkPassed >= benchmarkTests.length * 0.8 ? '✅' : '❌'} Performance benchmarks met`);
  console.log(`${excellentTests >= productionStressTests.length * 0.75 ? '✅' : '❌'} Stress test resilience`);
  
  return allResults;
}

// Run the production stress tests
if (require.main === module) {
  runProductionStressTests()
    .then(results => {
      console.log('\n🏭 Production stress testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Production stress testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runProductionStressTests }; 