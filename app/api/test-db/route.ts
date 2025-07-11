import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Simple database connectivity test
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        status: 'FAILED',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      note: 'Basic connectivity test passed'
    })

  } catch (error) {
    console.error('Database connectivity test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      message: 'Database connectivity test failed',
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 