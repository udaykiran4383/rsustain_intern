#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all endpoints systematically and reports issues
 */

const baseURL = 'http://localhost:3000';

// Test configuration
const tests = [
  // Authentication & User Management
  { name: 'Auth Callback', method: 'GET', path: '/api/auth/callback', expected: [200, 404, 405] },
  
  // Carbon Calculator APIs
  { name: 'Emission Factors', method: 'GET', path: '/api/carbon-calculator/emission-factors', expected: [200] },
  { name: 'Emission Factors Categories', method: 'POST', path: '/api/carbon-calculator/emission-factors', 
    body: { action: 'get_categories' }, expected: [200] },
  { name: 'Carbon Assessment Create', method: 'POST', path: '/api/carbon-calculator/assessments', 
    body: { action: 'create', data: { orgName: 'Test Corp', year: 2024 } }, expected: [200, 201] },
  { name: 'Carbon Calculate', method: 'POST', path: '/api/carbon-calculator/calculate', 
    body: { 
      assessment: { 
        organizationName: 'Test Corp', 
        assessmentYear: 2024, 
        reportingPeriodStart: '2024-01-01', 
        reportingPeriodEnd: '2024-12-31' 
      }, 
      scope1Data: [{ 
        sourceCategory: 'stationary_combustion',
        fuelType: 'natural_gas_commercial', 
        activityData: 100, 
        activityUnit: 'MMBtu' 
      }] 
    }, expected: [200] },
  
  // Marketplace & Projects
  { name: 'Projects List', method: 'GET', path: '/api/projects', expected: [200] },
  { name: 'Projects Create', method: 'POST', path: '/api/projects', 
    body: { action: 'create', name: 'Test Project', description: 'Test', project_type: 'reforestation' }, expected: [200, 201] },
  
  // Cart & Checkout
  { name: 'Cart Get', method: 'GET', path: '/api/cart', expected: [200] },
  { name: 'Cart Add Item', method: 'POST', path: '/api/cart', 
    body: { action: 'add', project_id: 'test-project', quantity: 10 }, expected: [200, 201] },
  { name: 'Checkout Initialize', method: 'POST', path: '/api/checkout', 
    body: { action: 'initialize', items: [{ project_id: 'test-project', quantity: 10 }] }, expected: [200, 201] },
  
  // Seller Management
  { name: 'Seller Dashboard', method: 'GET', path: '/api/seller', expected: [200] },
  { name: 'Seller Project Submit', method: 'POST', path: '/api/seller', 
    body: { action: 'submit_project', project_id: 'test-project' }, expected: [200, 201] },
  
  // Verifier System
  { name: 'Verifier Queue', method: 'GET', path: '/api/verifier', expected: [200] },
  { name: 'Verifier Review', method: 'POST', path: '/api/verifier', 
    body: { action: 'review', project_id: 'test-project', status: 'approved' }, expected: [200, 201] },
  
  // Database & Testing
  { name: 'Database Test Detailed', method: 'GET', path: '/api/test-db-detailed', expected: [200] },
  { name: 'Setup Tables', method: 'POST', path: '/api/setup-tables', 
    body: { action: 'setup_emission_factors' }, expected: [200] }
];

// Frontend routes to test
const frontendRoutes = [
  '/',
  '/calculator',
  '/marketplace', 
  '/dashboard',
  '/auth/signin',
  '/auth/signup',
  '/checkout',
  '/retire-credits',
  '/seller/dashboard',
  '/seller/register-project',
  '/verifier/queue',
  '/test-dashboard'
];

// Helper function to make HTTP requests
async function makeRequest(test) {
  const url = `${baseURL}${test.path}`;
  const options = {
    method: test.method,
    headers: {
      'Content-Type': 'application/json'
    }
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
        // Not valid JSON
      }
    } else {
      const text = await response.text();
      data = text.length > 0 ? text.substring(0, 200) + '...' : null;
    }
    
    return {
      test: test.name,
      path: test.path,
      method: test.method,
      status: response.status,
      success: isSuccess,
      error: !isSuccess ? `Expected ${test.expected.join(' or ')}, got ${response.status}` : null,
      data: data,
      hasData: !!data
    };
  } catch (error) {
    return {
      test: test.name,
      path: test.path,
      method: test.method,
      status: 'ERROR',
      success: false,
      error: error.message,
      data: null,
      hasData: false
    };
  }
}

// Test frontend routes
async function testFrontendRoute(route) {
  try {
    const response = await fetch(`${baseURL}${route}`);
    const text = await response.text();
    
    const isHTML = text.includes('<html');
    const hasError = text.includes('Application error') || text.includes('Error:') || text.includes('runtime error') || response.status >= 400;
    const hasContent = text.length > 1000; // Reasonable size for a page
    
    return {
      route,
      status: response.status,
      success: response.status === 200 && !hasError,
      isHTML,
      hasContent,
      error: hasError ? 'Page contains errors or failed to load' : null,
      size: text.length
    };
  } catch (error) {
    return {
      route,
      status: 'ERROR',
      success: false,
      isHTML: false,
      hasContent: false,
      error: error.message,
      size: 0
    };
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 COMPREHENSIVE API & FRONTEND TESTING');
  console.log('==========================================\n');
  
  // Test API endpoints
  console.log('📡 API ENDPOINT TESTING:');
  const apiResults = [];
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}...`);
    const result = await makeRequest(test);
    apiResults.push(result);
    
    if (result.success) {
      console.log(` ✅ PASS (${result.status})`);
    } else {
      console.log(` ❌ FAIL (${result.status}): ${result.error}`);
    }
  }
  
  console.log('\n🌐 FRONTEND ROUTE TESTING:');
  const frontendResults = [];
  
  for (const route of frontendRoutes) {
    process.stdout.write(`Testing ${route}...`);
    const result = await testFrontendRoute(route);
    frontendResults.push(result);
    
    if (result.success) {
      console.log(` ✅ PASS (${result.status})`);
    } else {
      console.log(` ❌ FAIL (${result.status}): ${result.error || 'Failed to load'}`);
    }
  }
  
  // Generate summary report
  console.log('\n📊 TEST SUMMARY REPORT:');
  console.log('========================');
  
  const apiPassed = apiResults.filter(r => r.success).length;
  const apiFailed = apiResults.filter(r => !r.success).length;
  const frontendPassed = frontendResults.filter(r => r.success).length;
  const frontendFailed = frontendResults.filter(r => !r.success).length;
  
  console.log(`\n🔌 API Endpoints: ${apiPassed}/${tests.length} passed (${Math.round(apiPassed/tests.length*100)}%)`);
  console.log(`🌐 Frontend Routes: ${frontendPassed}/${frontendRoutes.length} passed (${Math.round(frontendPassed/frontendRoutes.length*100)}%)`);
  console.log(`📈 Overall Success Rate: ${Math.round((apiPassed + frontendPassed)/(tests.length + frontendRoutes.length)*100)}%`);
  
  // Detailed failure analysis
  const failedAPI = apiResults.filter(r => !r.success);
  const failedFrontend = frontendResults.filter(r => !r.success);
  
  if (failedAPI.length > 0) {
    console.log('\n❌ FAILED API ENDPOINTS:');
    failedAPI.forEach(f => {
      console.log(`  • ${f.test} (${f.method} ${f.path}): ${f.error}`);
    });
  }
  
  if (failedFrontend.length > 0) {
    console.log('\n❌ FAILED FRONTEND ROUTES:');
    failedFrontend.forEach(f => {
      console.log(`  • ${f.route}: ${f.error || 'Load failed'}`);
    });
  }
  
  // Missing functionality analysis
  console.log('\n🔍 MISSING FUNCTIONALITY ANALYSIS:');
  console.log('==================================');
  
  const missingEndpoints = failedAPI.filter(f => f.status === 404 || f.status === 'ERROR');
  const errorEndpoints = failedAPI.filter(f => f.status >= 500);
  const authEndpoints = failedAPI.filter(f => f.status === 401 || f.status === 403);
  
  if (missingEndpoints.length > 0) {
    console.log(`📭 ${missingEndpoints.length} endpoints not found/implemented:`);
    missingEndpoints.forEach(e => console.log(`  • ${e.path}`));
  }
  
  if (errorEndpoints.length > 0) {
    console.log(`💥 ${errorEndpoints.length} endpoints with server errors:`);
    errorEndpoints.forEach(e => console.log(`  • ${e.path}`));
  }
  
  if (authEndpoints.length > 0) {
    console.log(`🔒 ${authEndpoints.length} endpoints requiring authentication:`);
    authEndpoints.forEach(e => console.log(`  • ${e.path}`));
  }
  
  // Export results for further analysis
  const fullReport = {
    timestamp: new Date().toISOString(),
    summary: {
      api: { passed: apiPassed, failed: apiFailed, total: tests.length },
      frontend: { passed: frontendPassed, failed: frontendFailed, total: frontendRoutes.length },
      overall_success_rate: Math.round((apiPassed + frontendPassed)/(tests.length + frontendRoutes.length)*100)
    },
    api_results: apiResults,
    frontend_results: frontendResults,
    missing_endpoints: missingEndpoints.map(e => e.path),
    error_endpoints: errorEndpoints.map(e => e.path),
    auth_required: authEndpoints.map(e => e.path)
  };
  
  console.log('\n💾 Full report saved to test-results.json');
  require('fs').writeFileSync('test-results.json', JSON.stringify(fullReport, null, 2));
  
  return fullReport;
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, tests, frontendRoutes }; 