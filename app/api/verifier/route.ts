import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'queue'
    const verifierId = searchParams.get('verifier_id') || 'demo-verifier'
    const verificationId = searchParams.get('verification_id')

    switch (action) {
      case 'queue':
        // Default queue view for demo
        return NextResponse.json({
          message: 'Verifier queue (demo mode)',
          queue: [
            {
              id: 'verification-1',
              project_id: 'project-1',
              status: 'pending',
              priority: 'high',
              created_at: new Date().toISOString(),
              projects: {
                id: 'project-1',
                name: 'Amazon Reforestation Project',
                description: 'Large scale reforestation initiative',
                location: 'Brazil',
                project_type: 'reforestation',
                certification: 'VERRA',
                total_credits: 5000,
                price_per_credit: 28.50
              }
            }
          ],
          note: 'Demo mode - verifications table not available'
        })

            case 'get_queue':
        const { data: queue, error: queueError } = await supabase
          .from('verifications')
          .select(`
            *,
            projects (
              id,
              name,
              description,
              location,
              project_type,
              certification,
              total_credits,
              price_per_credit,
              seller_id,
              vintage_year,
              impact_story,
              sdg_goals,
              status
            ),
            verifier:profiles!verifier_id (
              id,
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        if (queueError) throw queueError
        return NextResponse.json(queue || [])

      case 'get_assignments':
        if (!verifierId) {
          return NextResponse.json({ error: 'Verifier ID required' }, { status: 400 })
        }

        const { data: assignments, error: assignError } = await supabase
          .from('verifications')
          .select(`
            *,
            projects (
              id,
              name,
              description,
              location,
              project_type,
              certification,
              total_credits,
              price_per_credit,
              vintage_year
            )
          `)
          .eq('verifier_id', verifierId)
          .in('status', ['in_review', 'revision_requested'])
          .order('assigned_date', { ascending: true })

        if (assignError) throw assignError
        return NextResponse.json(assignments || [])

      case 'get_details':
        if (!verificationId) {
          return NextResponse.json({ error: 'Verification ID required' }, { status: 400 })
        }

        const { data: details, error: detailsError } = await supabase
          .from('verifications')
          .select(`
            *,
            projects (
              *,
              project_documents (
                *
              )
            ),
            verifier:profiles!verifier_id (
              id,
              full_name,
              email
            )
          `)
          .eq('id', verificationId)
          .single()

        if (detailsError) throw detailsError
        return NextResponse.json(details)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Verifier API error:', error)
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
    const { action, verification_id, verifier_id, priority, status, data: updateData } = body

    switch (action) {
      case 'assign':
        return NextResponse.json({
          message: 'Verification assigned successfully (demo mode)',
          verification: {
            id: verification_id,
            verifier_id,
            status: 'in_review',
            assigned_date: new Date().toISOString()
          },
          note: 'Demo mode - verifications table not available'
        })

      case 'update_priority':
        return NextResponse.json({
          message: 'Priority updated successfully (demo mode)',
          verification: {
            id: verification_id,
            priority,
            updated_at: new Date().toISOString()
          },
          note: 'Demo mode - verifications table not available'
        })

      case 'update_status':
        // Validate verification_id and status
        if (!verification_id) {
          return NextResponse.json({ error: 'Verification ID is required' }, { status: 400 })
        }

        const validStatuses = ['pending', 'in_review', 'approved', 'rejected', 'revision_requested']
        if (!status || !validStatuses.includes(status)) {
          return NextResponse.json({ 
            error: 'Invalid status', 
            valid_statuses: validStatuses 
          }, { status: 400 })
        }

        return NextResponse.json({
          message: 'Status updated successfully (demo mode)',
          verification: {
            id: verification_id,
            status,
            verification_date: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          },
          note: 'Demo mode - verifications table not available'
        })

      case 'review':
        // Handle project review action
        return NextResponse.json({
          message: 'Project review completed (demo mode)',
          verification: {
            id: verification_id || 'test-verification',
            status: 'reviewed',
            reviewer_comments: updateData?.comments || 'Review completed',
            review_date: new Date().toISOString()
          },
          note: 'Demo mode - verifications table not available'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Verifier POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 