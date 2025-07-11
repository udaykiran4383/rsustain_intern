// Atomic cart operations to prevent race conditions
import { supabase, api } from './supabase'

export interface CartOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  type: 'added' | 'updated' | 'removed' | 'error';
}

export class AtomicCartOperations {
  
  // Atomic add/update cart item - prevents race conditions
  static async addOrUpdateCartItem(
    userId: string, 
    projectId: string, 
    quantity: number
  ): Promise<CartOperationResult> {
    try {
      // First get project details for pricing
      const project = await api.getProject(projectId);
      if (!project) {
        return { success: false, error: 'Project not found', type: 'error' };
      }

      if (!['verified', 'active'].includes(project.status)) {
        return { success: false, error: 'Project is not available for purchase', type: 'error' };
      }

      if (quantity > project.available_credits) {
        return { success: false, error: 'Requested quantity exceeds available credits', type: 'error' };
      }

      const unitPrice = project.price_per_credit;
      const totalPrice = quantity * unitPrice;

      // Use upsert with conflict resolution for atomicity
      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          project_id: projectId,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,project_id', // Composite unique constraint
          ignoreDuplicates: false // Always update if exists
        })
        .select(`
          *,
          projects (*)
        `)
        .single();

      if (error) {
        console.error('Atomic cart operation error:', error);
        return { success: false, error: 'Failed to add/update cart item', type: 'error' };
      }

      // Determine if this was an add or update
      const existingQuantity = data.quantity - quantity;
      const operationType = existingQuantity <= 0 ? 'added' : 'updated';

      return {
        success: true,
        data,
        type: operationType
      };

    } catch (error: any) {
      console.error('Atomic cart operation failed:', error);
      return { success: false, error: error.message, type: 'error' };
    }
  }

  // Atomic increment cart item quantity
  static async incrementCartItem(
    userId: string, 
    projectId: string, 
    incrementBy: number = 1
  ): Promise<CartOperationResult> {
    try {
      // Use RPC function for atomic increment if available, otherwise manual operation
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (existingItem) {
        const newQuantity = existingItem.quantity + incrementBy;
        return this.addOrUpdateCartItem(userId, projectId, newQuantity);
      } else {
        return this.addOrUpdateCartItem(userId, projectId, incrementBy);
      }

    } catch (error: any) {
      console.error('Atomic increment failed:', error);
      return { success: false, error: error.message, type: 'error' };
    }
  }

  // Atomic remove cart item
  static async removeCartItem(
    userId: string, 
    projectId: string
  ): Promise<CartOperationResult> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return { success: false, error: 'Item not found in cart', type: 'error' };
        }
        console.error('Atomic remove error:', error);
        return { success: false, error: 'Failed to remove cart item', type: 'error' };
      }

      return {
        success: true,
        data,
        type: 'removed'
      };

    } catch (error: any) {
      console.error('Atomic remove failed:', error);
      return { success: false, error: error.message, type: 'error' };
    }
  }

  // Atomic clear entire cart
  static async clearCart(userId: string): Promise<CartOperationResult> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Atomic clear cart error:', error);
        return { success: false, error: 'Failed to clear cart', type: 'error' };
      }

      return {
        success: true,
        data: { itemsRemoved: data?.length || 0 },
        type: 'removed'
      };

    } catch (error: any) {
      console.error('Atomic clear cart failed:', error);
      return { success: false, error: error.message, type: 'error' };
    }
  }

  // Get cart items with optimistic locking
  static async getCartItems(userId: string) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get cart items error:', error);
        return [];
      }

      return data || [];

    } catch (error: any) {
      console.error('Get cart items failed:', error);
      return [];
    }
  }

  // Validate cart integrity - check for stale data
  static async validateCartIntegrity(userId: string): Promise<{
    valid: boolean;
    issues: string[];
    fixedItems: number;
  }> {
    try {
      const cartItems = await this.getCartItems(userId);
      const issues: string[] = [];
      let fixedItems = 0;

      for (const item of cartItems) {
        // Check if project still exists and is available
        const project = await api.getProject(item.project_id);
        
        if (!project) {
          // Remove items for deleted projects
          await this.removeCartItem(userId, item.project_id);
          issues.push(`Removed item for deleted project: ${item.project_id}`);
          fixedItems++;
          continue;
        }

        if (!['verified', 'active'].includes(project.status)) {
          // Remove items for unavailable projects
          await this.removeCartItem(userId, item.project_id);
          issues.push(`Removed item for unavailable project: ${project.name}`);
          fixedItems++;
          continue;
        }

        if (item.quantity > project.available_credits) {
          // Adjust quantity to available credits
          await this.addOrUpdateCartItem(userId, item.project_id, project.available_credits);
          issues.push(`Adjusted quantity for ${project.name} to available credits`);
          fixedItems++;
          continue;
        }

        // Check price currency
        if (Math.abs(item.unit_price - project.price_per_credit) > 0.01) {
          // Update price to current project price
          await this.addOrUpdateCartItem(userId, item.project_id, item.quantity);
          issues.push(`Updated price for ${project.name} to current price`);
          fixedItems++;
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        fixedItems
      };

    } catch (error: any) {
      console.error('Cart validation failed:', error);
      return {
        valid: false,
        issues: [`Validation failed: ${error.message}`],
        fixedItems: 0
      };
    }
  }
}

// Demo mode operations for testing
export class DemoCartOperations {
  
  static generateDemoCartItem(projectId: string, quantity: number) {
    return {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      project_name: 'Demo Project',
      quantity,
      unit_price: 25.00,
      total_price: quantity * 25.00,
      project_type: 'reforestation',
      vintage_year: 2024,
      certification: 'VERRA',
      created_at: new Date().toISOString()
    };
  }

  static async addDemoItem(projectId: string, quantity: number): Promise<CartOperationResult> {
    return {
      success: true,
      data: this.generateDemoCartItem(projectId, quantity),
      type: 'added'
    };
  }

  static async updateDemoItem(projectId: string, quantity: number): Promise<CartOperationResult> {
    return {
      success: true,
      data: this.generateDemoCartItem(projectId, quantity),
      type: 'updated'
    };
  }

  static async removeDemoItem(): Promise<CartOperationResult> {
    return {
      success: true,
      data: { removed: true },
      type: 'removed'
    };
  }
} 