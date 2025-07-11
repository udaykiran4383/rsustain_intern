import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { api } from '@/lib/supabase'
import { createRateLimiter } from '@/lib/rate-limiter'
import { AtomicCartOperations, DemoCartOperations } from '@/lib/cart-operations'

// Create rate limiter for cart operations (100 requests per minute)
const rateLimiter = createRateLimiter('cart');

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.error!;
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user if authenticated (allow demo cart for anonymous users)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      // Authenticated user - get real cart with atomic operations
      const cartItems = await AtomicCartOperations.getCartItems(user.id)
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
    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.error!;
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user if authenticated (allow demo operations for testing)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { action, project_id, projectId, quantity, item_id } = body

    if (action === 'add' || action === 'add_item') {
      const finalProjectId = project_id || projectId

      // Validate input
      if (!finalProjectId || !quantity || typeof quantity !== 'number' || quantity < 1) {
        return NextResponse.json(
          { error: 'Project ID and valid numeric quantity are required' },
          { status: 400 }
        )
      }

      if (user?.id) {
        // Authenticated user - use atomic cart operations
        try {
          const result = await AtomicCartOperations.addOrUpdateCartItem(user.id, finalProjectId, quantity)
          
          if (!result.success) {
            return NextResponse.json(
              { error: result.error },
              { status: result.error?.includes('not found') ? 404 : 400 }
            )
          }

          // Log activity
          try {
            await api.logActivity({
              user_id: user.id,
              activity_type: 'cart_add',
              description: `${result.type === 'added' ? 'Added' : 'Updated'} ${quantity} credits to cart`,
              metadata: { 
                project_id: finalProjectId, 
                quantity,
                operation_type: result.type
              }
            })
          } catch (logError) {
            // Don't fail the operation if logging fails
            console.warn('Failed to log cart activity:', logError)
          }

          return NextResponse.json({ 
            message: `Item ${result.type} successfully`,
            cartItem: result.data,
            operation: result.type
          })

        } catch (error: any) {
          // Handle database errors gracefully with demo mode fallback
          if (error.message?.includes('does not exist')) {
            const demoResult = await DemoCartOperations.addDemoItem(finalProjectId, quantity)
            return NextResponse.json({
              message: 'Item added to demo cart',
              cartItem: demoResult.data,
              note: 'Demo mode - cart_items table not found'
            })
          }
          throw error
        }
      } else {
        // Anonymous user - demo operation
        const demoResult = await DemoCartOperations.addDemoItem(finalProjectId, quantity)
        return NextResponse.json({
          message: 'Item added to demo cart',
          cartItem: demoResult.data,
          note: 'Demo mode - sign in to manage your actual cart'
        })
      }
    }

    if (action === 'update_item') {
      const finalProjectId = project_id || projectId

      // For update_item, we expect either project_id or item_id
      if (!finalProjectId && !item_id) {
        return NextResponse.json(
          { error: 'Project ID or Item ID is required' },
          { status: 400 }
        )
      }

      if (!quantity || typeof quantity !== 'number' || quantity < 1) {
        return NextResponse.json(
          { error: 'Valid numeric quantity is required' },
          { status: 400 }
        )
      }

      if (user?.id) {
        try {
          let projectIdToUpdate = finalProjectId;
          
          // If item_id provided, look up the project_id
          if (item_id && !finalProjectId) {
            const cartItems = await AtomicCartOperations.getCartItems(user.id);
            const existingItem = cartItems.find(item => item.id === item_id);
            if (!existingItem) {
              return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
              )
            }
            projectIdToUpdate = existingItem.project_id;
          }

          const result = await AtomicCartOperations.addOrUpdateCartItem(user.id, projectIdToUpdate, quantity)
          
          if (!result.success) {
            return NextResponse.json(
              { error: result.error },
              { status: result.error?.includes('not found') ? 404 : 400 }
            )
          }

          return NextResponse.json({
            message: 'Cart item updated successfully',
            cartItem: result.data,
            operation: result.type
          })

        } catch (error: any) {
          if (error.message?.includes('does not exist')) {
            const demoResult = await DemoCartOperations.updateDemoItem(finalProjectId, quantity)
            return NextResponse.json({
              message: 'Cart item updated successfully (demo mode)',
              cartItem: demoResult.data,
              note: 'Demo mode - cart_items table not found'
            })
          }
          throw error
        }
      } else {
        const demoResult = await DemoCartOperations.updateDemoItem(finalProjectId, quantity)
        return NextResponse.json({
          message: 'Cart item updated successfully (demo mode)',
          cartItem: demoResult.data,
          note: 'Demo mode - sign in to manage your actual cart'
        })
      }
    }

    if (action === 'remove_item') {
      const finalProjectId = project_id || projectId

      // For remove_item, we expect either project_id or item_id
      if (!finalProjectId && !item_id) {
        return NextResponse.json(
          { error: 'Project ID or Item ID is required' },
          { status: 400 }
        )
      }

      if (user?.id) {
        try {
          let projectIdToRemove = finalProjectId;
          
          // If item_id provided, look up the project_id
          if (item_id && !finalProjectId) {
            const cartItems = await AtomicCartOperations.getCartItems(user.id);
            const existingItem = cartItems.find(item => item.id === item_id);
            if (!existingItem) {
              return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
              )
            }
            projectIdToRemove = existingItem.project_id;
          }

          const result = await AtomicCartOperations.removeCartItem(user.id, projectIdToRemove)
          
          if (!result.success) {
            return NextResponse.json(
              { error: result.error },
              { status: result.error?.includes('not found') ? 404 : 400 }
            )
          }

          return NextResponse.json({
            message: 'Item removed from cart successfully',
            success: true,
            removedItem: result.data
          })

        } catch (error: any) {
          if (error.message?.includes('does not exist')) {
            const demoResult = await DemoCartOperations.removeDemoItem()
            return NextResponse.json({
              message: 'Item removed from cart successfully (demo mode)',
              success: true,
              note: 'Demo mode - cart_items table not found'
            })
          }
          throw error
        }
      } else {
        const demoResult = await DemoCartOperations.removeDemoItem()
        return NextResponse.json({
          message: 'Item removed from cart successfully (demo mode)',
          success: true,
          note: 'Demo mode - sign in to manage your actual cart'
        })
      }
    }

    if (action === 'clear') {
      if (user?.id) {
        try {
          const result = await AtomicCartOperations.clearCart(user.id)
          
          if (!result.success) {
            return NextResponse.json(
              { error: result.error },
              { status: 500 }
            )
          }

          return NextResponse.json({
            message: 'Cart cleared successfully',
            success: true,
            itemsRemoved: result.data?.itemsRemoved || 0
          })

        } catch (error: any) {
          if (error.message?.includes('does not exist')) {
            return NextResponse.json({
              message: 'Cart cleared successfully (demo mode)',
              success: true,
              note: 'Demo mode - cart_items table not found'
            })
          }
          throw error
        }
      } else {
        return NextResponse.json({
          message: 'Cart cleared successfully (demo mode)',
          success: true,
          note: 'Demo mode - sign in to manage your actual cart'
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing cart operation:', error)
    return NextResponse.json(
      { error: 'Failed to process cart operation' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.error!;
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication for DELETE (more secure than POST clear)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await AtomicCartOperations.clearCart(user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to clear cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cart cleared successfully',
      success: true,
      itemsRemoved: result.data?.itemsRemoved || 0
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
} 