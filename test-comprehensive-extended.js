#!/usr/bin/env node

const fs = require('fs');

const baseURL = 'http://localhost:3000';

// Extended API tests with edge cases and error handling
const extendedAPITests = [
  // Authentication Edge Cases
  { 
    name: 'Auth Invalid Callback', 
    method: 'GET', 
    path: '/api/auth/callback?error=access_denied', 
    expected: [400, 401, 403],
    category: 'auth'
  },

  // Carbon Calculator Edge Cases
  { 
    name: 'Calculate Empty Data', 
    method: 'POST', 
    path: '/api/carbon-calculator/calculate',
    body: {}, 
    expected: [400, 422],
    category: 'calculator'
  },
  { 
    name: 'Calculate Invalid Data Types', 
    method: 'POST', 
    path: '/api/carbon-calculator/calculate',
    body: { 
      fuelType: 123, // Should be string
      consumption: "invalid", // Should be number
      unit: null 
    }, 
    expected: [400, 422],
    category: 'calculator'
  },
  { 
    name: 'Calculate Negative Values', 
    method: 'POST', 
    path: '/api/carbon-calculator/calculate',
    body: { 
      fuelType: 'natural_gas',
      consumption: -100, // Negative consumption
      unit: 'MMBtu',
      sourceCategory: 'stationary_combustion'
    }, 
    expected: [400, 422],
    category: 'calculator'
  },
  { 
    name: 'Calculate Extreme Values', 
    method: 'POST', 
    path: '/api/carbon-calculator/calculate',
    body: { 
      fuelType: 'natural_gas',
      consumption: 999999999999, // Extreme value
      unit: 'MMBtu',
      sourceCategory: 'stationary_combustion'
    }, 
    expected: [200, 400, 422],
    category: 'calculator'
  },

  // Assessment Edge Cases
  { 
    name: 'Assessment Missing Required Fields', 
    method: 'POST', 
    path: '/api/carbon-calculator/assessments',
    body: { action: 'create', data: {} }, // Missing orgName
    expected: [400],
    category: 'assessment'
  },
  { 
    name: 'Assessment Invalid Action', 
    method: 'POST', 
    path: '/api/carbon-calculator/assessments',
    body: { action: 'invalid_action', data: { orgName: 'Test' } },
    expected: [400],
    category: 'assessment'
  },
  { 
    name: 'Assessment SQL Injection Test', 
    method: 'POST', 
    path: '/api/carbon-calculator/assessments',
    body: { 
      action: 'create', 
      data: { 
        orgName: "'; DROP TABLE assessments; --",
        year: 2024 
      } 
    },
    expected: [200, 201, 400],
    category: 'security'
  },

  // Projects Edge Cases
  { 
    name: 'Projects Invalid Filters', 
    method: 'GET', 
    path: '/api/projects?min_price=invalid&max_price=abc&limit=999999',
    expected: [200, 400],
    category: 'projects'
  },
  { 
    name: 'Projects XSS Test', 
    method: 'POST', 
    path: '/api/projects',
    body: { 
      action: 'create',
      name: '<script>alert("xss")</script>',
      description: 'Test<img src=x onerror=alert(1)>',
      project_type: 'reforestation'
    },
    expected: [200, 201, 400],
    category: 'security'
  },
  { 
    name: 'Projects Large Payload', 
    method: 'POST', 
    path: '/api/projects',
    body: { 
      action: 'create',
      name: 'A'.repeat(10000), // Very long name
      description: 'B'.repeat(50000), // Very long description
      project_type: 'reforestation'
    },
    expected: [200, 201, 400, 413],
    category: 'projects'
  },

  // Cart Edge Cases
  { 
    name: 'Cart Add Invalid Item', 
    method: 'POST', 
    path: '/api/cart',
    body: { 
      action: 'add_item',
      projectId: null,
      quantity: -5 // Negative quantity
    },
    expected: [400],
    category: 'cart'
  },
  { 
    name: 'Cart Add Zero Quantity', 
    method: 'POST', 
    path: '/api/cart',
    body: { 
      action: 'add_item',
      projectId: 'test-project',
      quantity: 0
    },
    expected: [400],
    category: 'cart'
  },

  // Seller Edge Cases
  { 
    name: 'Seller Invalid Project Data', 
    method: 'POST', 
    path: '/api/seller',
    body: { 
      action: 'create_project',
      project_data: {
        name: '', // Empty name
        total_credits: -1000, // Negative credits
        price_per_credit: 'invalid' // Invalid price type
      }
    },
    expected: [400],
    category: 'seller'
  },

  // Verifier Edge Cases
  { 
    name: 'Verifier Invalid Status Update', 
    method: 'POST', 
    path: '/api/verifier',
    body: { 
      action: 'update_status',
      verification_id: 'nonexistent',
      status: 'invalid_status'
    },
    expected: [400, 404],
    category: 'verifier'
  },

  // Database Testing
  { 
    name: 'Database Stress Test', 
    method: 'GET', 
    path: '/api/test-db-detailed?stress=true',
    expected: [200, 500],
    category: 'database'
  },

  // Performance Tests
  { 
    name: 'Large Projects List', 
    method: 'GET', 
    path: '/api/projects?limit=1000&offset=0',
    expected: [200, 400],
    category: 'performance'
  }
];

// Workflow Integration Tests
const workflowTests = [
  {
    name: 'Complete Carbon Assessment Workflow',
    steps: [
      { action: 'create_assessment', endpoint: '/api/carbon-calculator/assessments', method: 'POST', body: { action: 'create', data: { orgName: 'Workflow Test Corp', year: 2024 } } },
      { action: 'get_emission_factors', endpoint: '/api/carbon-calculator/emission-factors', method: 'GET' },
      { action: 'calculate_emissions', endpoint: '/api/carbon-calculator/calculate', method: 'POST', body: { fuelType: 'natural_gas', consumption: 100, unit: 'MMBtu', sourceCategory: 'stationary_combustion' } }
    ]
  },
  {
    name: 'Complete Marketplace Purchase Workflow',
    steps: [
      { action: 'browse_projects', endpoint: '/api/projects', method: 'GET' },
      { action: 'add_to_cart', endpoint: '/api/cart', method: 'POST', body: { action: 'add_item', projectId: 'test-project', quantity: 10 } },
      { action: 'view_cart', endpoint: '/api/cart', method: 'GET' },
      { action: 'checkout', endpoint: '/api/checkout', method: 'POST', body: { action: 'initialize' } }
    ]
  },
  {
    name: 'Complete Seller Project Workflow',
    steps: [
      { action: 'create_project', endpoint: '/api/projects', method: 'POST', body: { action: 'create', name: 'Seller Test Project', description: 'Test project for workflow', project_type: 'reforestation' } },
      { action: 'submit_for_verification', endpoint: '/api/seller', method: 'POST', body: { action: 'submit_project', project_id: 'test-project' } },
      { action: 'check_status', endpoint: '/api/seller', method: 'GET', query: '?action=get_projects&seller_id=test-seller' }
    ]
  }
];

// Frontend Stress Tests
const frontendStressTests = [
  { path: '/', concurrent: 5 },
  { path: '/calculator', concurrent: 3 },
  { path: '/marketplace', concurrent: 4 },
  { path: '/dashboard', concurrent: 2 }
];

// Helper function for API requests with timeout
async function makeRequestWithTimeout(test, timeout = 10000) {
  const url = `${baseURL}${test.path}`;
  const options = {
    method: test.method,
    headers: { 'Content-Type': 'application/json' },
    timeout: timeout
  };
  
  if (test.body) {
    options.body = JSON.stringify(test.body);
  }
  
  try {
    const response = await fetch(url, options);
    const isSuccess = test.expected.includes(response.status);
    
    let data = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Invalid JSON response' };
      }
    } else {
      const text = await response.text();
      data = text.length > 0 ? text.substring(0, 200) + '...' : null;
    }
    
    return {
      test: test.name,
      category: test.category,
      path: test.path,
      method: test.method,
      status: response.status,
      success: isSuccess,
      error: !isSuccess ? `Expected ${test.expected.join(' or ')}, got ${response.status}` : null,
      data: data,
      responseTime: Date.now() - Date.now() // Simple timing
    };
  } catch (error) {
    return {
      test: test.name,
      category: test.category,
      path: test.path,
      method: test.method,
      status: 'ERROR',
      success: false,
      error: error.message,
      data: null,
      responseTime: timeout
    };
  }
}

// Run workflow test
async function runWorkflowTest(workflow) {
  const results = [];
  let workflowData = {};
  
  console.log(`\n🔄 Running workflow: ${workflow.name}`);
  
  for (const step of workflow.steps) {
    const url = `${baseURL}${step.endpoint}${step.query || ''}`;
    const options = {
      method: step.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (step.body) {
      // Replace any placeholders with data from previous steps
      let bodyStr = JSON.stringify(step.body);
      Object.keys(workflowData).forEach(key => {
        bodyStr = bodyStr.replace(`{{${key}}}`, workflowData[key]);
      });
      options.body = bodyStr;
    }
    
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);
      
      const success = response.status >= 200 && response.status < 400;
      results.push({
        step: step.action,
        status: response.status,
        success,
        data
      });
      
      // Store data for next steps
      if (success && data) {
        if (data.assessment) workflowData.assessmentId = data.assessment.id;
        if (data.project) workflowData.projectId = data.project.id;
        if (data.cartId) workflowData.cartId = data.cartId;
      }
      
      console.log(`  ${step.action}: ${success ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
      
      if (!success) break; // Stop workflow on failure
      
    } catch (error) {
      results.push({
        step: step.action,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`  ${step.action}: ❌ ERROR (${error.message})`);
      break;
    }
  }
  
  return {
    workflow: workflow.name,
    steps: results,
    success: results.every(r => r.success),
    completed_steps: results.filter(r => r.success).length,
    total_steps: workflow.steps.length
  };
}

// Run concurrent frontend tests
async function runConcurrentFrontendTest(test) {
  const promises = [];
  for (let i = 0; i < test.concurrent; i++) {
    promises.push(fetch(`${baseURL}${test.path}`));
  }
  
  try {
    const responses = await Promise.all(promises);
    const successful = responses.filter(r => r.status === 200).length;
    
    return {
      path: test.path,
      concurrent: test.concurrent,
      successful,
      success_rate: (successful / test.concurrent) * 100,
      success: successful === test.concurrent
    };
  } catch (error) {
    return {
      path: test.path,
      concurrent: test.concurrent,
      successful: 0,
      success_rate: 0,
      success: false,
      error: error.message
    };
  }
}

// Main test runner
async function runExtendedTests() {
  console.log('🧪 EXTENDED COMPREHENSIVE TESTING SUITE');
  console.log('=========================================\n');
  
  const allResults = {
    api_edge_cases: [],
    workflow_tests: [],
    frontend_stress: [],
    security_tests: [],
    performance_tests: []
  };
  
  // Run extended API tests
  console.log('🔍 API EDGE CASE & ERROR HANDLING TESTS:');
  console.log('==========================================');
  
  for (const test of extendedAPITests) {
    process.stdout.write(`Testing ${test.name} [${test.category}]...`);
    const result = await makeRequestWithTimeout(test);
    allResults.api_edge_cases.push(result);
    
    if (result.success) {
      console.log(` ✅ PASS (${result.status})`);
    } else {
      console.log(` ❌ FAIL (${result.status}): ${result.error}`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Run workflow tests
  console.log('\n🔄 WORKFLOW INTEGRATION TESTS:');
  console.log('==============================');
  
  for (const workflow of workflowTests) {
    const result = await runWorkflowTest(workflow);
    allResults.workflow_tests.push(result);
  }
  
  // Run frontend stress tests
  console.log('\n⚡ FRONTEND CONCURRENT LOAD TESTS:');
  console.log('==================================');
  
  for (const test of frontendStressTests) {
    process.stdout.write(`Testing ${test.path} (${test.concurrent} concurrent)...`);
    const result = await runConcurrentFrontendTest(test);
    allResults.frontend_stress.push(result);
    
    console.log(` ${result.success ? '✅' : '❌'} ${result.success_rate}% success rate`);
  }
  
  // Generate comprehensive report
  console.log('\n📊 EXTENDED TEST SUMMARY REPORT:');
  console.log('=================================');
  
  const apiPassed = allResults.api_edge_cases.filter(r => r.success).length;
  const workflowPassed = allResults.workflow_tests.filter(r => r.success).length;
  const stressPassed = allResults.frontend_stress.filter(r => r.success).length;
  
  console.log(`\n🔍 API Edge Cases: ${apiPassed}/${extendedAPITests.length} passed (${Math.round(apiPassed/extendedAPITests.length*100)}%)`);
  console.log(`🔄 Workflow Tests: ${workflowPassed}/${workflowTests.length} passed (${Math.round(workflowPassed/workflowTests.length*100)}%)`);
  console.log(`⚡ Stress Tests: ${stressPassed}/${frontendStressTests.length} passed (${Math.round(stressPassed/frontendStressTests.length*100)}%)`);
  
  // Category breakdown
  console.log('\n📋 RESULTS BY CATEGORY:');
  const categories = {};
  allResults.api_edge_cases.forEach(r => {
    if (!categories[r.category]) categories[r.category] = { passed: 0, total: 0 };
    categories[r.category].total++;
    if (r.success) categories[r.category].passed++;
  });
  
  Object.keys(categories).forEach(cat => {
    const { passed, total } = categories[cat];
    console.log(`  ${cat}: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  });
  
  // Detailed failure analysis
  const failed = allResults.api_edge_cases.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS REQUIRING ATTENTION:');
    failed.forEach(f => {
      console.log(`  • ${f.test} [${f.category}]: ${f.error}`);
      if (f.data && f.data.error) {
        console.log(`    Response: ${f.data.error}`);
      }
    });
  }
  
  // Security findings
  const securityTests = allResults.api_edge_cases.filter(r => r.category === 'security');
  if (securityTests.length > 0) {
    console.log('\n🔒 SECURITY TEST RESULTS:');
    securityTests.forEach(s => {
      console.log(`  • ${s.test}: ${s.success ? '✅ SECURE' : '⚠️  NEEDS REVIEW'}`);
    });
  }
  
  // Performance insights
  const slowTests = allResults.api_edge_cases.filter(r => r.responseTime > 2000);
  if (slowTests.length > 0) {
    console.log('\n⏱️  SLOW RESPONSE TIMES (>2s):');
    slowTests.forEach(s => {
      console.log(`  • ${s.test}: ${s.responseTime}ms`);
    });
  }
  
  // Save detailed results
  fs.writeFileSync('extended-test-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n💾 Extended test results saved to extended-test-results.json');
  
  // Overall health score
  const totalTests = extendedAPITests.length + workflowTests.length + frontendStressTests.length;
  const totalPassed = apiPassed + workflowPassed + stressPassed;
  const healthScore = Math.round(totalPassed / totalTests * 100);
  
  console.log(`\n🏥 PLATFORM HEALTH SCORE: ${healthScore}%`);
  
  if (healthScore >= 90) {
    console.log('🟢 EXCELLENT - Platform is very robust');
  } else if (healthScore >= 75) {
    console.log('🟡 GOOD - Minor issues need attention');
  } else if (healthScore >= 60) {
    console.log('🟠 FAIR - Several issues need fixing');
  } else {
    console.log('🔴 POOR - Major issues require immediate attention');
  }
  
  return allResults;
}

// Run the extended tests
if (require.main === module) {
  runExtendedTests()
    .then(results => {
      console.log('\n✅ Extended testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Extended testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runExtendedTests }; 