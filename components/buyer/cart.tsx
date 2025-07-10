"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react"
import { api, type CartItem } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export function Cart() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCartItems()
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    setLoading(true)
    try {
      const items = await api.getCartItems(user.id)
      setCartItems(items)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      toast({
        title: "Error",
        description: "Failed to load cart items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(cartItemId)
    try {
      const updatedItem = await api.updateCartItem(cartItemId, newQuantity)
      if (updatedItem) {
        setCartItems(prev => 
          prev.map(item => 
            item.id === cartItemId 
              ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
              : item
          )
        )

        await api.logActivity({
          user_id: user!.id,
          activity_type: "cart_update",
          description: `Updated cart item quantity to ${newQuantity}`,
          metadata: { cart_item_id: cartItemId, new_quantity: newQuantity }
        })

        toast({
          title: "Updated",
          description: "Cart item quantity updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating cart item:", error)
      toast({
        title: "Error",
        description: "Failed to update cart item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (cartItemId: string, projectName: string) => {
    setUpdating(cartItemId)
    try {
      const success = await api.removeFromCart(cartItemId)
      if (success) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId))

        await api.logActivity({
          user_id: user!.id,
          activity_type: "cart_remove",
          description: `Removed ${projectName} from cart`,
          metadata: { cart_item_id: cartItemId }
        })

        toast({
          title: "Removed",
          description: `${projectName} removed from cart.`,
        })
      }
    } catch (error) {
      console.error("Error removing cart item:", error)
      toast({
        title: "Error",
        description: "Failed to remove cart item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const success = await api.clearCart(user.id)
      if (success) {
        setCartItems([])

        await api.logActivity({
          user_id: user.id,
          activity_type: "cart_clear",
          description: "Cleared all items from cart",
          metadata: { items_count: cartItems.length }
        })

        toast({
          title: "Cart Cleared",
          description: "All items have been removed from your cart.",
        })
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const subtotal = cartItems.reduce((total, item) => total + item.total_price, 0)
  const tax = subtotal * 0.08 // 8% tax rate
  const total = subtotal + tax

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add some items to your cart before proceeding to checkout.",
        variant: "destructive",
      })
      return
    }
    
    // Navigate to checkout page
    window.location.href = "/checkout"
  }

  if (loading) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-gray-400 mb-4">Add some carbon credits to get started</p>
          <Button className="bg-green-600 hover:bg-green-700">
            Browse Projects
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({cartItems.length} items)
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCart}
            className="text-red-400 border-red-400 hover:bg-red-400/10"
          >
            Clear Cart
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 border border-white/10 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">{item.projects?.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.projects?.project_type?.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.projects?.certification}
                </Badge>
                <span className="text-sm text-gray-400">
                  ${item.unit_price}/credit
                </span>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={updating === item.id || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 1
                  if (newQuantity > 0) {
                    updateQuantity(item.id, newQuantity)
                  }
                }}
                className="w-16 text-center"
                min="1"
                disabled={updating === item.id}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={updating === item.id}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-bold text-green-400">
                ${item.total_price.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">
                {item.quantity} credits
              </div>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => removeItem(item.id, item.projects?.name || "Project")}
              disabled={updating === item.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Separator className="bg-white/20" />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator className="bg-white/20" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-400">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          onClick={proceedToCheckout}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Proceed to Checkout
        </Button>

        {/* Auto-save notice */}
        <p className="text-xs text-gray-400 text-center">
          Cart automatically saves your changes
        </p>
      </CardContent>
    </Card>
  )
} 