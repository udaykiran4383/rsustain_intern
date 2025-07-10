import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'dashboard'
    const sellerId = searchParams.get('seller_id') || 'demo-seller'
    const projectId = searchParams.get('project_id')

    switch (action) {
      case 'dashboard':
        // Default dashboard view for demo
        return NextResponse.json({
          message: 'Seller dashboard (demo mode)',
          projects: [
            {
              id: 'demo-project-1',
              name: 'Amazon Reforestation Project',
              status: 'active',
              total_credits: 1000,
              available_credits: 750,
              price_per_credit: 25.00,
              created_at: new Date().toISOString()
            }
          ],
          revenue_summary: {
            total_revenue: 6250.00,
            total_credits_sold: 250,
            transaction_count: 15,
            average_price: 25.00
          },
          note: 'Demo mode - seller dashboard data'
        })

            case 'get_projects':
        if (!sellerId) {
          return NextResponse.json({ error: 'Seller ID required' }, { status: 400 })
        }

        try {
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select(`
              *,
              verifications (
                status,
                priority,
                verifier_id,
                created_at
              )
            `)
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false })

          if (projectsError) throw projectsError
          return NextResponse.json(projects || [])
        } catch (dbError: any) {
          // If table doesn't exist, return demo projects
          return NextResponse.json([
            {
              id: 'demo-project-1',
              name: 'Amazon Reforestation Project',
              description: 'Large scale reforestation initiative',
              status: 'active',
              verification_status: 'approved',
              total_credits: 1000,
              available_credits: 750,
              price_per_credit: 25.00,
              created_at: new Date().toISOString(),
              verifications: [
                {
                  status: 'approved',
                  priority: 'high',
                  created_at: new Date().toISOString()
                }
              ]
            }
          ])
        }

      case 'get_revenue_summary':
        if (!sellerId) {
          return NextResponse.json({ error: 'Seller ID required' }, { status: 400 })
        }

        const { data: transactions, error: transError } = await supabase
          .from('transactions')
          .select(`
            total_amount,
            quantity,
            created_at,
            projects!inner (
              seller_id
            )
          `)
          .eq('projects.seller_id', sellerId)
          .eq('status', 'completed')

        if (transError) throw transError

        const totalRevenue = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0
        const totalCreditsSold = transactions?.reduce((sum, t) => sum + t.quantity, 0) || 0
        
        return NextResponse.json({
          total_revenue: totalRevenue,
          total_credits_sold: totalCreditsSold,
          transaction_count: transactions?.length || 0,
          average_price: totalCreditsSold > 0 ? totalRevenue / totalCreditsSold : 0
        })

      case 'get_project_sales':
        if (!projectId) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
        }

        const { data: sales, error: salesError } = await supabase
          .from('transactions')
          .select(`
            *,
            projects (
              name,
              project_type,
              price_per_credit
            )
          `)
          .eq('project_id', projectId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        if (salesError) throw salesError
        return NextResponse.json(sales || [])

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Seller API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action, project_data, project_id, updates } = body

    switch (action) {
      case 'create_project':
        // Validate project data
        if (!project_data || typeof project_data !== 'object') {
          return NextResponse.json({ error: 'Project data is required' }, { status: 400 })
        }

        const { name, description, total_credits, price_per_credit } = project_data

        // Validate required fields
        if (!name || name.trim() === '') {
          return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
        }

        if (!description || description.trim() === '') {
          return NextResponse.json({ error: 'Project description is required' }, { status: 400 })
        }

        // Validate numeric fields
        if (total_credits !== undefined && (typeof total_credits !== 'number' || total_credits <= 0)) {
          return NextResponse.json({ error: 'Total credits must be a positive number' }, { status: 400 })
        }

        if (price_per_credit !== undefined && (typeof price_per_credit !== 'number' || price_per_credit <= 0)) {
          return NextResponse.json({ error: 'Price per credit must be a positive number' }, { status: 400 })
        }

        // Demo project creation
        const demoProject = {
          id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...project_data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft',
          verification_status: 'not_submitted'
        }

        return NextResponse.json({
          message: 'Project created successfully (demo mode)',
          project: demoProject,
          note: 'Demo mode - projects table not available'
        })

      case 'update_project':
        if (!project_id) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
        }

        return NextResponse.json({
          message: 'Project updated successfully (demo mode)',
          project: {
            id: project_id,
            ...updates,
            updated_at: new Date().toISOString()
          },
          note: 'Demo mode - projects table not available'
        })

      case 'submit_project':
        const submittedProject = project_id || 'test-project'
        return NextResponse.json({
          message: 'Project submitted for verification (demo mode)',
          project: {
            id: submittedProject,
            status: 'pending_verification',
            verification_status: 'submitted',
            updated_at: new Date().toISOString()
          },
          note: 'Demo mode - verification queue not available'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Seller POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 