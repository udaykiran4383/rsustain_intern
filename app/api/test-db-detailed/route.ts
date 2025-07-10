import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('test') || 'full'

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    }

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from('projects').select('count').single()
      results.tests.database_connection = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : 'Database connection successful',
        data: data
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.database_connection = {
        status: 'FAILED',
        message: `Database connection failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 2: Projects Table
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .limit(5)

      results.tests.projects_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} projects`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.projects_table = {
        status: 'FAILED',
        message: `Projects table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 3: Verifications Table
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('id, status, priority, created_at')
        .limit(5)

      results.tests.verifications_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} verifications`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.verifications_table = {
        status: 'FAILED',
        message: `Verifications table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 4: Transactions Table
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, status, total_amount, created_at')
        .limit(5)

      results.tests.transactions_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} transactions`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.transactions_table = {
        status: 'FAILED',
        message: `Transactions table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 5: Cart Items Table
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, total_price, created_at')
        .limit(5)

      results.tests.cart_items_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} cart items`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.cart_items_table = {
        status: 'FAILED',
        message: `Cart items table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 6: Certificates Table
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_type, issue_date, created_at')
        .limit(5)

      results.tests.certificates_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} certificates`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.certificates_table = {
        status: 'FAILED',
        message: `Certificates table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 7: Activity Logs Table
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, activity_type, description, created_at')
        .limit(5)

      results.tests.activity_logs_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} activity logs`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.activity_logs_table = {
        status: 'FAILED',
        message: `Activity logs table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 8: Project Documents Table
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, document_name, status, created_at')
        .limit(5)

      results.tests.project_documents_table = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Found ${data?.length || 0} project documents`,
        data: data?.slice(0, 3) || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.project_documents_table = {
        status: 'FAILED',
        message: `Project documents table test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 9: Join Query Test (Projects with Verifications)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          verifications (
            id,
            status,
            priority
          )
        `)
        .limit(3)

      results.tests.join_query_test = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : `Join query successful - ${data?.length || 0} projects with verifications`,
        data: data || []
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++
    } catch (e) {
      results.tests.join_query_test = {
        status: 'FAILED',
        message: `Join query test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Test 10: Insert Test (Test Activity Log)
    try {
      const testActivity = {
        id: crypto.randomUUID(),
        user_id: null, // Fix: Use null to avoid foreign key constraint for test
        activity_type: 'database_test',
        description: 'Database connectivity test performed',
        metadata: { test_timestamp: new Date().toISOString() },
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .insert(testActivity)
        .select()

      results.tests.insert_test = {
        status: error ? 'FAILED' : 'PASSED',
        message: error ? error.message : 'Insert operation successful',
        data: data?.[0] || null
      }
      results.summary.total++
      if (!error) results.summary.passed++
      else results.summary.failed++

      // Clean up test data
      if (!error && data?.[0]) {
        await supabase.from('activity_logs').delete().eq('id', data[0].id)
      }
    } catch (e) {
      results.tests.insert_test = {
        status: 'FAILED',
        message: `Insert test failed: ${e}`,
        data: null
      }
      results.summary.total++
      results.summary.failed++
    }

    // Final status
    results.overall_status = results.summary.failed === 0 ? 'ALL_PASSED' : 'SOME_FAILED'
    results.success_rate = `${Math.round((results.summary.passed / results.summary.total) * 100)}%`

    return NextResponse.json(results)

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      {
        error: 'Database test failed',
        details: error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action } = body

    if (action === 'create_sample_data') {
      // Create sample test data for testing
      const sampleProject = {
        id: crypto.randomUUID(),
        name: `Test Project ${Date.now()}`,
        description: 'A sample project for testing purposes',
        location: 'Test Location',
        project_type: 'reforestation',
        certification: 'VERRA',
        total_credits: 1000,
        available_credits: 800,
        price_per_credit: 25.00,
        vintage_year: 2024,
        status: 'draft',
        verification_status: 'not_submitted',
        seller_id: null, // Fix: Use null to avoid foreign key constraint for sample data
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(sampleProject)
        .select()

      if (projectError) throw projectError

      // Create verification record
      const sampleVerification = {
        id: crypto.randomUUID(),
        project_id: project[0].id,
        status: 'pending',
        priority: 'medium',
        comments: 'Sample verification for testing',
        created_at: new Date().toISOString()
      }

      const { data: verification, error: verificationError } = await supabase
        .from('verifications')
        .insert(sampleVerification)
        .select()

      if (verificationError) throw verificationError

      return NextResponse.json({
        message: 'Sample data created successfully',
        project: project[0],
        verification: verification[0]
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Sample data creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sample data', details: error },
      { status: 500 }
    )
  }
} 