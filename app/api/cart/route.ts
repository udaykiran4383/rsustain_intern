import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { api } from '@/lib/supabase'

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user if authenticated (allow demo cart for anonymous users)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      // Authenticated user - get real cart
      const cartItems = await api.getCartItems(user.id)
      return NextResponse.json({ cartItems })
    } else {
      // Anonymous user - return demo cart
      const demoCart = [
        {
          id: 'demo-item-1',
          project_id: 'demo-project-1',
          project_name: 'Amazon Reforestation Project',
          quantity: 10,
          unit_price: 25.00,
          total_price: 250.00,
          project_type: 'reforestation',
          vintage_year: 2024,
          certification: 'VERRA'
        }
      ]
      return NextResponse.json({ 
        cartItems: demoCart,
        note: 'Demo cart - sign in to manage your actual cart'
      })
    }
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user if authenticated (allow demo operations for testing)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { action, project_id, projectId, quantity } = body

    if (action === 'add' || action === 'add_item') {
      const finalProjectId = project_id || projectId

          // Validate input
      if (!finalProjectId || !quantity || quantity < 1) {
        return NextResponse.json(
          { error: 'Project ID and valid quantity are required' },
          { status: 400 }
        )
      }

      if (user?.id) {
        // Authenticated user - use real cart operations
        try {
          // Verify project exists and is available
          const project = await api.getProject(finalProjectId)
          if (!project) {
            return NextResponse.json(
              { error: 'Project not found' },
              { status: 404 }
            )
          }

          if (!['verified', 'active'].includes(project.status)) {
            return NextResponse.json(
              { error: 'Project is not available for purchase' },
              { status: 400 }
            )
          }

          if (quantity > project.available_credits) {
            return NextResponse.json(
              { error: 'Requested quantity exceeds available credits' },
              { status: 400 }
            )
          }

          const cartItem = await api.addToCart(user.id, finalProjectId, quantity)
          
          if (!cartItem) {
            return NextResponse.json(
              { error: 'Failed to add item to cart' },
              { status: 500 }
            )
          }

          // Log activity
          await api.logActivity({
            user_id: user.id,
            activity_type: 'cart_add',
            description: `Added ${quantity} credits from ${project.name} to cart`,
            metadata: { 
              project_id: finalProjectId, 
              quantity,
              project_name: project.name,
              unit_price: project.price_per_credit
            }
          })

          return NextResponse.json({ cartItem })
        } catch (error: any) {
          // Handle database errors gracefully
          if (error.message?.includes('does not exist')) {
            return NextResponse.json({
              message: 'Item added to demo cart',
              cartItem: {
                id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                project_id: finalProjectId,
                project_name: 'Demo Project',
                quantity,
                unit_price: 25.00,
                total_price: quantity * 25.00
              },
              note: 'Demo mode - cart_items table not found'
            })
          }
          throw error
        }
      } else {
        // Anonymous user - demo operation
        return NextResponse.json({
          message: 'Item added to demo cart',
          cartItem: {
            id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            project_id: finalProjectId,
            project_name: 'Demo Project',
            quantity,
            unit_price: 25.00,
            total_price: quantity * 25.00
          },
          note: 'Demo mode - sign in to manage your actual cart'
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await api.clearCart(user.id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      )
    }

    // Log activity
    await api.logActivity({
      user_id: user.id,
      activity_type: 'cart_clear',
      description: 'Cleared all items from cart',
      metadata: {}
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
} 