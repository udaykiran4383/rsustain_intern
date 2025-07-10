import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const project_type = searchParams.get('project_type')
    const certification = searchParams.get('certification')
    const status = searchParams.get('status') || 'active'
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'

    // Build the query - only select columns that exist
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        location,
        project_type,
        certification,
        total_credits,
        available_credits,
        price_per_credit,
        vintage_year,
        status,
        created_at,
        updated_at
      `)
      .eq('status', status)

    // Apply filters
    if (project_type) {
      query = query.eq('project_type', project_type)
    }

    if (certification) {
      query = query.eq('certification', certification)
    }

    if (min_price) {
      query = query.gte('price_per_credit', parseFloat(min_price))
    }

    if (max_price) {
      query = query.lte('price_per_credit', parseFloat(max_price))
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sort_order === 'asc'
    query = query.order(sort_by, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: projects, error } = await query

    if (error) throw error

    // Get total count for pagination
    let countQuery = supabase
      .from('projects')
      .select('id', { count: 'exact' })
      .eq('status', status)

    // Apply the same filters for count
    if (project_type) countQuery = countQuery.eq('project_type', project_type)
    if (certification) countQuery = countQuery.eq('certification', certification)
    if (min_price) countQuery = countQuery.gte('price_per_credit', parseFloat(min_price))
    if (max_price) countQuery = countQuery.lte('price_per_credit', parseFloat(max_price))
    if (location) countQuery = countQuery.ilike('location', `%${location}%`)
    if (search) countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)

    const { count } = await countQuery

    return NextResponse.json({
      projects: projects || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? offset + limit < count : false
      },
      filters_applied: {
        project_type,
        certification,
        status,
        min_price,
        max_price,
        location,
        search,
        sort_by,
        sort_order
      }
    })

  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create':
        // Create new project
        const { name, description, project_type, location, certification, total_credits, price_per_credit } = body
        
        if (!name || !description || !project_type) {
          return NextResponse.json({ error: 'Name, description, and project type are required' }, { status: 400 })
        }

        const newProject = {
          id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          location: location || 'Global',
          project_type,
          certification: certification || 'VERRA',
          total_credits: total_credits || 1000,
          available_credits: total_credits || 1000,
          price_per_credit: price_per_credit || 25.00,
          vintage_year: new Date().getFullYear(),
          status: 'draft',
          verification_status: 'not_submitted',
          seller_id: null, // For demo
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // For demo purposes, return mock project without database insert
        return NextResponse.json({
          message: 'Project created successfully (demo mode)',
          project: newProject,
          note: 'Demo mode - projects table not available'
        }, { status: 201 })

      case 'get_project_details':
        const { project_id } = body
        
        if (!project_id) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
        }

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            verifications (
              id,
              status,
              priority,
              comments,
              verification_date,
              verifier_id
            )
          `)
          .eq('id', project_id)
          .single()

        if (projectError) throw projectError

        return NextResponse.json(project)

      case 'get_project_stats':
        // Get marketplace statistics
        const { data: stats, error: statsError } = await supabase
          .from('projects')
          .select('project_type, certification, status')

        if (statsError) throw statsError

        const statistics = {
          total_projects: stats?.length || 0,
          by_type: {},
          by_certification: {},
          by_status: {}
        }

        stats?.forEach(project => {
          // Count by type
          statistics.by_type[project.project_type] = 
            (statistics.by_type[project.project_type] || 0) + 1
          
          // Count by certification
          statistics.by_certification[project.certification] = 
            (statistics.by_certification[project.certification] || 0) + 1
          
          // Count by status
          statistics.by_status[project.status] = 
            (statistics.by_status[project.status] || 0) + 1
        })

        return NextResponse.json(statistics)

      case 'get_featured_projects':
        const { data: featured, error: featuredError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            location,
            project_type,
            certification,
            total_credits,
            available_credits,
            price_per_credit,
            risk_score,
            vintage_year,
            impact_story,
            media_gallery
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6)

        if (featuredError) throw featuredError

        return NextResponse.json(featured || [])

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Projects POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 