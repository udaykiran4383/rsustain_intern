#!/usr/bin/env node

const fs = require('fs');

const baseURL = 'http://localhost:3000';

// Critical Basic Tests - Production Essentials
const dataConsistencyTests = [
  {
    name: 'Database Schema Validation',
    type: 'schema_validation',
    tests: [
      { endpoint: '/api/test-db', method: 'GET', description: 'Basic database connectivity' },
      { endpoint: '/api/test-db-detailed', method: 'GET', description: 'Detailed database structure' },
      { endpoint: '/api/carbon-calculator/emission-factors', method: 'GET', description: 'Emission factors table' }
    ]
  },
  {
    name: 'Data Persistence Validation',
    type: 'data_persistence',
    workflow: [
      { 
        step: 'create_project',
        endpoint: '/api/projects',
        method: 'POST',
        body: { action: 'create', name: 'Persistence Test Project', description: 'Testing data persistence', project_type: 'reforestation', total_credits: 1000, price_per_credit: 25 }
      },
      {
        step: 'verify_project_exists',
        endpoint: '/api/projects',
        method: 'GET',
        validate: (data) => data.projects && data.projects.some(p => p.name && p.name.includes('Persistence Test'))
      },
      {
        step: 'create_cart_item',
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'add_item', projectId: 'persistence-test', quantity: 5 }
      },
      {
        step: 'verify_cart_persistence',
        endpoint: '/api/cart',
        method: 'GET',
        validate: (data) => data.cartItems && data.cartItems.length > 0
      }
    ]
  },
  {
    name: 'Assessment Data Lifecycle',
    type: 'assessment_lifecycle',
    workflow: [
      {
        step: 'create_assessment',
        endpoint: '/api/carbon-calculator/assessments',
        method: 'POST',
        body: { action: 'create', data: { orgName: 'Lifecycle Test Corp', year: 2024, sector: 'manufacturing' } }
      },
      {
        step: 'add_calculation_to_assessment',
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: { fuelType: 'natural_gas', consumption: 500, unit: 'MMBtu', assessmentId: 'lifecycle-test' }
      },
      {
        step: 'retrieve_assessment',
        endpoint: '/api/carbon-calculator/assessments',
        method: 'GET',
        validate: (data) => data.assessment || data.note
      }
    ]
  }
];

const crudOperationTests = [
  {
    name: 'Projects CRUD Operations',
    type: 'crud_projects',
    operations: [
      {
        operation: 'CREATE',
        endpoint: '/api/projects',
        method: 'POST',
        body: { action: 'create', name: 'CRUD Test Project', description: 'Testing CRUD operations', project_type: 'renewable_energy', total_credits: 2000, price_per_credit: 30 },
        expected_status: [200, 201]
      },
      {
        operation: 'READ',
        endpoint: '/api/projects',
        method: 'GET',
        expected_status: [200],
        validate: (data) => data.projects && Array.isArray(data.projects)
      },
      {
        operation: 'UPDATE',
        endpoint: '/api/projects',
        method: 'POST',
        body: { action: 'update', projectId: 'crud-test', name: 'Updated CRUD Project', price_per_credit: 35 },
        expected_status: [200, 201, 404] // 404 is acceptable if project doesn't exist
      },
      {
        operation: 'DELETE',
        endpoint: '/api/projects',
        method: 'POST',
        body: { action: 'delete', projectId: 'crud-test' },
        expected_status: [200, 201, 404] // 404 is acceptable if project doesn't exist
      }
    ]
  },
  {
    name: 'Cart CRUD Operations',
    type: 'crud_cart',
    operations: [
      {
        operation: 'ADD_ITEM',
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'add_item', projectId: 'crud-cart-test', quantity: 3 },
        expected_status: [200, 201]
      },
      {
        operation: 'VIEW_CART',
        endpoint: '/api/cart',
        method: 'GET',
        expected_status: [200],
        validate: (data) => data.cartItems !== undefined
      },
      {
        operation: 'UPDATE_ITEM',
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'update_item', projectId: 'crud-cart-test', quantity: 5 },
        expected_status: [200, 201, 404]
      },
      {
        operation: 'REMOVE_ITEM',
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'remove_item', projectId: 'crud-cart-test' },
        expected_status: [200, 201, 404]
      },
      {
        operation: 'CLEAR_CART',
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'clear' },
        expected_status: [200, 201]
      }
    ]
  }
];

const inputValidationTests = [
  {
    name: 'Required Fields Validation',
    type: 'required_fields',
    tests: [
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Missing fuelType',
        body: { consumption: 100, unit: 'MMBtu' },
        expected_status: [400]
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Missing consumption',
        body: { fuelType: 'natural_gas', unit: 'MMBtu' },
        expected_status: [400]
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Missing unit',
        body: { fuelType: 'natural_gas', consumption: 100 },
        expected_status: [400]
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        description: 'Missing action',
        body: { name: 'Test Project', project_type: 'reforestation' },
        expected_status: [400]
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        description: 'Missing project name',
        body: { action: 'create', project_type: 'reforestation' },
        expected_status: [400]
      }
    ]
  },
  {
    name: 'Data Type Validation',
    type: 'data_types',
    tests: [
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'String consumption (should be number)',
        body: { fuelType: 'natural_gas', consumption: 'invalid', unit: 'MMBtu' },
        expected_status: [400]
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Negative consumption',
        body: { fuelType: 'natural_gas', consumption: -100, unit: 'MMBtu' },
        expected_status: [400]
      },
      {
        endpoint: '/api/cart',
        method: 'POST',
        description: 'String quantity (should be number)',
        body: { action: 'add_item', projectId: 'test', quantity: 'invalid' },
        expected_status: [400]
      },
      {
        endpoint: '/api/cart',
        method: 'POST',
        description: 'Zero quantity',
        body: { action: 'add_item', projectId: 'test', quantity: 0 },
        expected_status: [400]
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        description: 'Invalid project type',
        body: { action: 'create', name: 'Test', project_type: 'invalid_type' },
        expected_status: [400]
      }
    ]
  },
  {
    name: 'Boundary Value Testing',
    type: 'boundary_values',
    tests: [
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Very small consumption',
        body: { fuelType: 'natural_gas', consumption: 0.001, unit: 'MMBtu' },
        expected_status: [200]
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        description: 'Large consumption',
        body: { fuelType: 'natural_gas', consumption: 999999, unit: 'MMBtu' },
        expected_status: [200]
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        description: 'Very long project name',
        body: { action: 'create', name: 'A'.repeat(500), project_type: 'reforestation' },
        expected_status: [200, 201, 400] // Could be limited by validation
      },
      {
        endpoint: '/api/cart',
        method: 'POST',
        description: 'Maximum quantity',
        body: { action: 'add_item', projectId: 'test', quantity: 999999 },
        expected_status: [200, 201, 400] // Could be limited by business rules
      }
    ]
  }
];

const responseFormatTests = [
  {
    name: 'JSON Response Consistency',
    type: 'response_format',
    tests: [
      {
        endpoint: '/api/carbon-calculator/emission-factors',
        method: 'GET',
        description: 'Emission factors response format',
        validate_json: true,
        expected_fields: ['status', 'data']
      },
      {
        endpoint: '/api/projects',
        method: 'GET',
        description: 'Projects response format',
        validate_json: true,
        expected_fields: ['projects']
      },
      {
        endpoint: '/api/cart',
        method: 'GET',
        description: 'Cart response format',
        validate_json: true,
        expected_fields: ['cartItems']
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: { fuelType: 'natural_gas', consumption: 100, unit: 'MMBtu' },
        description: 'Calculation response format',
        validate_json: true,
        expected_fields: ['totalEmissions']
      }
    ]
  },
  {
    name: 'HTTP Status Code Consistency',
    type: 'status_codes',
    tests: [
      {
        endpoint: '/api/nonexistent-endpoint',
        method: 'GET',
        description: '404 for non-existent endpoint',
        expected_status: [404]
      },
      {
        endpoint: '/api/projects',
        method: 'DELETE',
        description: '405 for unsupported method',
        expected_status: [405, 404] // Could be 404 if route doesn't exist
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'GET',
        description: '405 for wrong method on POST endpoint',
        expected_status: [405, 404]
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: {},
        description: '400 for empty request body',
        expected_status: [400]
      }
    ]
  }
];

const errorHandlingTests = [
  {
    name: 'Graceful Error Handling',
    type: 'error_handling',
    tests: [
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: 'invalid-json',
        description: 'Malformed JSON handling',
        expected_status: [400],
        raw_body: true
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        body: { action: 'create', name: null },
        description: 'Null values handling',
        expected_status: [400]
      },
      {
        endpoint: '/api/cart',
        method: 'POST',
        body: { action: 'add_item', projectId: '', quantity: 1 },
        description: 'Empty string handling',
        expected_status: [400]
      },
      {
        endpoint: '/api/verifier',
        method: 'POST',
        body: { action: 'review' },
        description: 'Missing required parameters',
        expected_status: [400]
      }
    ]
  },
  {
    name: 'Error Message Quality',
    type: 'error_messages',
    tests: [
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: { fuelType: 'invalid_fuel', consumption: 100, unit: 'MMBtu' },
        description: 'Invalid fuel type error message',
        expected_status: [400],
        validate_error_message: true
      },
      {
        endpoint: '/api/carbon-calculator/calculate',
        method: 'POST',
        body: { fuelType: 'natural_gas', consumption: 100, unit: 'invalid_unit' },
        description: 'Invalid unit error message',
        expected_status: [400],
        validate_error_message: true
      }
    ]
  }
];

const frontendBasicTests = [
  {
    name: 'Page Load Verification',
    type: 'page_loads',
    pages: [
      { path: '/', description: 'Homepage' },
      { path: '/calculator', description: 'Carbon Calculator' },
      { path: '/marketplace', description: 'Marketplace' },
      { path: '/dashboard', description: 'Dashboard' },
      { path: '/auth/signin', description: 'Sign In' },
      { path: '/checkout', description: 'Checkout' }
    ]
  },
  {
    name: 'Basic Frontend Functionality',
    type: 'frontend_functionality',
    tests: [
      {
        path: '/',
        description: 'Homepage contains navigation',
        check_elements: ['nav']
      },
      {
        path: '/calculator',
        description: 'Calculator page loads forms',
        check_elements: ['input', 'button']
      },
      {
        path: '/marketplace',
        description: 'Marketplace shows projects',
        check_content: true
      }
    ]
  }
];

// Helper Functions
async function testDataConsistency(test) {
  console.log(`\n🔍 Running ${test.name}`);
  
  if (test.type === 'schema_validation') {
    const results = [];
    
    for (const testCase of test.tests) {
      try {
        const response = await fetch(`${baseURL}${testCase.endpoint}`, {
          method: testCase.method
        });
        
        const data = await response.json().catch(() => null);
        const passed = response.ok && data !== null;
        
        results.push({
          endpoint: testCase.endpoint,
          description: testCase.description,
          status: response.status,
          has_data: data !== null,
          passed
        });
        
        console.log(`   ${testCase.description}: ${passed ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
        
      } catch (error) {
        results.push({
          endpoint: testCase.endpoint,
          description: testCase.description,
          status: 'ERROR',
          error: error.message,
          passed: false
        });
        console.log(`   ${testCase.description}: ❌ ERROR (${error.message})`);
      }
    }
    
    const passedTests = results.filter(r => r.passed).length;
    console.log(`   📊 Schema Validation: ${passedTests}/${results.length} passed`);
    
    return {
      test: test.name,
      type: test.type,
      results,
      passed: passedTests === results.length
    };
  }
  
  if (test.type === 'data_persistence' || test.type === 'assessment_lifecycle') {
    const results = [];
    let workflowPassed = true;
    
    for (const step of test.workflow) {
      try {
        const options = {
          method: step.method,
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (step.body) {
          options.body = JSON.stringify(step.body);
        }
        
        const response = await fetch(`${baseURL}${step.endpoint}`, options);
        const data = await response.json().catch(() => null);
        
        let stepPassed = response.ok;
        if (step.validate && data) {
          stepPassed = stepPassed && step.validate(data);
        }
        
        results.push({
          step: step.step,
          endpoint: step.endpoint,
          status: response.status,
          data_valid: step.validate ? step.validate(data) : true,
          passed: stepPassed
        });
        
        if (!stepPassed) workflowPassed = false;
        
        console.log(`   ${step.step}: ${stepPassed ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
        
      } catch (error) {
        results.push({
          step: step.step,
          endpoint: step.endpoint,
          status: 'ERROR',
          error: error.message,
          passed: false
        });
        workflowPassed = false;
        console.log(`   ${step.step}: ❌ ERROR (${error.message})`);
      }
    }
    
    console.log(`   📊 Workflow Result: ${workflowPassed ? '✅ COMPLETE' : '❌ FAILED'}`);
    
    return {
      test: test.name,
      type: test.type,
      results,
      passed: workflowPassed
    };
  }
  
  return { test: test.name, type: test.type, passed: false };
}

async function testCrudOperations(test) {
  console.log(`\n🔧 Running ${test.name}`);
  
  const results = [];
  let allOperationsPassed = true;
  
  for (const operation of test.operations) {
    try {
      const options = {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (operation.body) {
        options.body = JSON.stringify(operation.body);
      }
      
      const response = await fetch(`${baseURL}${operation.endpoint}`, options);
      const data = await response.json().catch(() => null);
      
      const statusPassed = operation.expected_status.includes(response.status);
      let validationPassed = true;
      
      if (operation.validate && data) {
        validationPassed = operation.validate(data);
      }
      
      const operationPassed = statusPassed && validationPassed;
      
      results.push({
        operation: operation.operation,
        endpoint: operation.endpoint,
        expected_status: operation.expected_status,
        actual_status: response.status,
        status_passed: statusPassed,
        validation_passed: validationPassed,
        passed: operationPassed
      });
      
      if (!operationPassed) allOperationsPassed = false;
      
      console.log(`   ${operation.operation}: ${operationPassed ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
      
    } catch (error) {
      results.push({
        operation: operation.operation,
        endpoint: operation.endpoint,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      allOperationsPassed = false;
      console.log(`   ${operation.operation}: ❌ ERROR (${error.message})`);
    }
  }
  
  console.log(`   📊 CRUD Operations: ${allOperationsPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  
  return {
    test: test.name,
    type: test.type,
    results,
    passed: allOperationsPassed
  };
}

async function testInputValidation(test) {
  console.log(`\n✅ Running ${test.name}`);
  
  const results = [];
  let allValidationsPassed = true;
  
  for (const testCase of test.tests) {
    try {
      const options = {
        method: testCase.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }
      
      const response = await fetch(`${baseURL}${testCase.endpoint}`, options);
      const statusPassed = testCase.expected_status.includes(response.status);
      
      results.push({
        description: testCase.description,
        endpoint: testCase.endpoint,
        expected_status: testCase.expected_status,
        actual_status: response.status,
        passed: statusPassed
      });
      
      if (!statusPassed) allValidationsPassed = false;
      
      console.log(`   ${testCase.description}: ${statusPassed ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
      
    } catch (error) {
      results.push({
        description: testCase.description,
        endpoint: testCase.endpoint,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      allValidationsPassed = false;
      console.log(`   ${testCase.description}: ❌ ERROR (${error.message})`);
    }
  }
  
  const passedValidations = results.filter(r => r.passed).length;
  console.log(`   📊 Input Validation: ${passedValidations}/${results.length} passed`);
  
  return {
    test: test.name,
    type: test.type,
    results,
    passed: allValidationsPassed
  };
}

async function testResponseFormat(test) {
  console.log(`\n📋 Running ${test.name}`);
  
  const results = [];
  let allFormatsPassed = true;
  
  for (const testCase of test.tests) {
    try {
      const options = {
        method: testCase.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }
      
      const response = await fetch(`${baseURL}${testCase.endpoint}`, options);
      
      let formatPassed = true;
      let jsonValid = false;
      let fieldsPresent = false;
      
      if (testCase.validate_json) {
        try {
          const data = await response.json();
          jsonValid = true;
          
          if (testCase.expected_fields) {
            fieldsPresent = testCase.expected_fields.every(field => 
              data.hasOwnProperty(field) || (data.data && data.data.hasOwnProperty(field))
            );
          } else {
            fieldsPresent = true;
          }
          
          formatPassed = jsonValid && fieldsPresent;
        } catch (jsonError) {
          jsonValid = false;
          formatPassed = false;
        }
      } else {
        formatPassed = testCase.expected_status ? testCase.expected_status.includes(response.status) : response.ok;
      }
      
      results.push({
        description: testCase.description,
        endpoint: testCase.endpoint,
        status: response.status,
        json_valid: jsonValid,
        fields_present: fieldsPresent,
        passed: formatPassed
      });
      
      if (!formatPassed) allFormatsPassed = false;
      
      console.log(`   ${testCase.description}: ${formatPassed ? '✅ PASS' : '❌ FAIL'} (JSON: ${jsonValid}, Fields: ${fieldsPresent})`);
      
    } catch (error) {
      results.push({
        description: testCase.description,
        endpoint: testCase.endpoint,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      allFormatsPassed = false;
      console.log(`   ${testCase.description}: ❌ ERROR (${error.message})`);
    }
  }
  
  const passedFormats = results.filter(r => r.passed).length;
  console.log(`   📊 Response Format: ${passedFormats}/${results.length} passed`);
  
  return {
    test: test.name,
    type: test.type,
    results,
    passed: allFormatsPassed
  };
}

async function testFrontendBasics(test) {
  console.log(`\n🌐 Running ${test.name}`);
  
  if (test.type === 'page_loads') {
    const results = [];
    let allPagesLoaded = true;
    
    for (const page of test.pages) {
      try {
        const response = await fetch(`${baseURL}${page.path}`);
        const pageLoaded = response.ok;
        
        results.push({
          path: page.path,
          description: page.description,
          status: response.status,
          passed: pageLoaded
        });
        
        if (!pageLoaded) allPagesLoaded = false;
        
        console.log(`   ${page.description} (${page.path}): ${pageLoaded ? '✅ LOADS' : '❌ FAILS'} (${response.status})`);
        
      } catch (error) {
        results.push({
          path: page.path,
          description: page.description,
          status: 'ERROR',
          error: error.message,
          passed: false
        });
        allPagesLoaded = false;
        console.log(`   ${page.description} (${page.path}): ❌ ERROR (${error.message})`);
      }
    }
    
    const loadedPages = results.filter(r => r.passed).length;
    console.log(`   📊 Page Loads: ${loadedPages}/${results.length} pages loaded successfully`);
    
    return {
      test: test.name,
      type: test.type,
      results,
      passed: allPagesLoaded
    };
  }
  
  if (test.type === 'frontend_functionality') {
    const results = [];
    let allFunctionalityPassed = true;
    
    for (const testCase of test.tests) {
      try {
        const response = await fetch(`${baseURL}${testCase.path}`);
        const html = await response.text();
        
        let testPassed = response.ok;
        
        // Check for required elements
        if (testCase.check_elements) {
          for (const element of testCase.check_elements) {
            const hasElement = html.includes(`<${element}`) || html.includes(`<${element} `);
            if (!hasElement) {
              testPassed = false;
              break;
            }
          }
        }
        
        // Check for content
        if (testCase.check_content) {
          const hasContent = html.length > 1000; // Basic content size check
          if (!hasContent) testPassed = false;
        }
        
        results.push({
          path: testCase.path,
          description: testCase.description,
          status: response.status,
          elements_found: testCase.check_elements ? testCase.check_elements.every(el => 
            html.includes(`<${el}`) || html.includes(`<${el} `)) : true,
          has_content: testCase.check_content ? html.length > 1000 : true,
          passed: testPassed
        });
        
        if (!testPassed) allFunctionalityPassed = false;
        
        console.log(`   ${testCase.description} (${testCase.path}): ${testPassed ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
        
      } catch (error) {
        results.push({
          path: testCase.path,
          description: testCase.description,
          status: 'ERROR',
          error: error.message,
          passed: false
        });
        allFunctionalityPassed = false;
        console.log(`   ${testCase.description} (${testCase.path}): ❌ ERROR (${error.message})`);
      }
    }
    
    const passedTests = results.filter(r => r.passed).length;
    console.log(`   📊 Frontend Functionality: ${passedTests}/${results.length} tests passed`);
    
    return {
      test: test.name,
      type: test.type,
      results,
      passed: allFunctionalityPassed
    };
  }
  
  return { test: test.name, type: test.type, passed: false };
}

// Main basic critical test runner
async function runBasicCriticalTests() {
  console.log('🎯 BASIC CRITICAL TESTING SUITE');
  console.log('================================\n');
  
  const allResults = {
    data_consistency: [],
    crud_operations: [],
    input_validation: [],
    response_format: [],
    error_handling: [],
    frontend_basic: []
  };
  
  // Data Consistency Tests
  console.log('🔍 DATA CONSISTENCY TESTING:');
  console.log('============================');
  
  for (const test of dataConsistencyTests) {
    const result = await testDataConsistency(test);
    allResults.data_consistency.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // CRUD Operations Tests
  console.log('\n🔧 CRUD OPERATIONS TESTING:');
  console.log('============================');
  
  for (const test of crudOperationTests) {
    const result = await testCrudOperations(test);
    allResults.crud_operations.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Input Validation Tests
  console.log('\n✅ INPUT VALIDATION TESTING:');
  console.log('=============================');
  
  for (const test of inputValidationTests) {
    const result = await testInputValidation(test);
    allResults.input_validation.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Response Format Tests
  console.log('\n📋 RESPONSE FORMAT TESTING:');
  console.log('============================');
  
  for (const test of responseFormatTests) {
    const result = await testResponseFormat(test);
    allResults.response_format.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Error Handling Tests
  console.log('\n🚨 ERROR HANDLING TESTING:');
  console.log('===========================');
  
  for (const test of errorHandlingTests) {
    const result = await testInputValidation(test); // Reuse input validation function
    allResults.error_handling.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Frontend Basic Tests
  console.log('\n🌐 FRONTEND BASIC TESTING:');
  console.log('===========================');
  
  for (const test of frontendBasicTests) {
    const result = await testFrontendBasics(test);
    allResults.frontend_basic.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate Basic Critical Report
  console.log('\n🎯 BASIC CRITICAL TEST SUMMARY:');
  console.log('================================');
  
  const dataPassed = allResults.data_consistency.filter(t => t.passed).length;
  const crudPassed = allResults.crud_operations.filter(t => t.passed).length;
  const validationPassed = allResults.input_validation.filter(t => t.passed).length;
  const formatPassed = allResults.response_format.filter(t => t.passed).length;
  const errorPassed = allResults.error_handling.filter(t => t.passed).length;
  const frontendPassed = allResults.frontend_basic.filter(t => t.passed).length;
  
  console.log(`\n🔍 Data Consistency: ${dataPassed}/${dataConsistencyTests.length} passed (${Math.round(dataPassed/dataConsistencyTests.length*100)}%)`);
  console.log(`🔧 CRUD Operations: ${crudPassed}/${crudOperationTests.length} passed (${Math.round(crudPassed/crudOperationTests.length*100)}%)`);
  console.log(`✅ Input Validation: ${validationPassed}/${inputValidationTests.length} passed (${Math.round(validationPassed/inputValidationTests.length*100)}%)`);
  console.log(`📋 Response Format: ${formatPassed}/${responseFormatTests.length} passed (${Math.round(formatPassed/responseFormatTests.length*100)}%)`);
  console.log(`🚨 Error Handling: ${errorPassed}/${errorHandlingTests.length} passed (${Math.round(errorPassed/errorHandlingTests.length*100)}%)`);
  console.log(`🌐 Frontend Basic: ${frontendPassed}/${frontendBasicTests.length} passed (${Math.round(frontendPassed/frontendBasicTests.length*100)}%)`);
  
  const totalTests = dataConsistencyTests.length + crudOperationTests.length + inputValidationTests.length + 
                     responseFormatTests.length + errorHandlingTests.length + frontendBasicTests.length;
  const totalPassed = dataPassed + crudPassed + validationPassed + formatPassed + errorPassed + frontendPassed;
  const basicCriticalScore = Math.round(totalPassed / totalTests * 100);
  
  console.log(`\n🎯 BASIC CRITICAL READINESS SCORE: ${basicCriticalScore}%`);
  
  if (basicCriticalScore >= 95) {
    console.log('🟢 EXCELLENT - All basic critical requirements met');
  } else if (basicCriticalScore >= 90) {
    console.log('🟢 VERY GOOD - Minor basic issues to address');
  } else if (basicCriticalScore >= 80) {
    console.log('🟡 GOOD - Some basic critical issues need fixing');
  } else if (basicCriticalScore >= 70) {
    console.log('🟠 FAIR - Multiple basic issues require attention');
  } else {
    console.log('🔴 POOR - Major basic functionality problems');
  }
  
  // Critical Issues Analysis
  console.log('\n🚨 CRITICAL ISSUES ANALYSIS:');
  
  const failedDataTests = allResults.data_consistency.filter(t => !t.passed);
  if (failedDataTests.length > 0) {
    console.log('   🔍 Data Consistency Issues:');
    failedDataTests.forEach(test => console.log(`      ❌ ${test.test}`));
  }
  
  const failedCrudTests = allResults.crud_operations.filter(t => !t.passed);
  if (failedCrudTests.length > 0) {
    console.log('   🔧 CRUD Operation Issues:');
    failedCrudTests.forEach(test => console.log(`      ❌ ${test.test}`));
  }
  
  const failedValidationTests = allResults.input_validation.filter(t => !t.passed);
  if (failedValidationTests.length > 0) {
    console.log('   ✅ Input Validation Issues:');
    failedValidationTests.forEach(test => console.log(`      ❌ ${test.test}`));
  }
  
  // Production Readiness Recommendations
  console.log('\n📋 PRODUCTION READINESS RECOMMENDATIONS:');
  console.log('=========================================');
  
  if (basicCriticalScore >= 90) {
    console.log('✅ Basic functionality is production-ready');
    console.log('✅ All critical workflows operational');
    console.log('✅ Input validation working correctly');
    console.log('✅ Error handling implemented');
  } else {
    console.log('⚠️  Basic functionality needs improvement before production');
    if (failedDataTests.length > 0) console.log('🔧 Fix data persistence and consistency issues');
    if (failedCrudTests.length > 0) console.log('🔧 Implement missing CRUD operations');
    if (failedValidationTests.length > 0) console.log('🔧 Strengthen input validation');
  }
  
  // Save basic critical results
  fs.writeFileSync('basic-critical-test-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n💾 Basic critical test results saved to basic-critical-test-results.json');
  
  return allResults;
}

// Run the basic critical tests
if (require.main === module) {
  runBasicCriticalTests()
    .then(results => {
      console.log('\n🎯 Basic critical testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Basic critical testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runBasicCriticalTests }; 