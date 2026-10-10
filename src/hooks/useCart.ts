import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from './useProducts'

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export function useCart(userId: string | null) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (userId) {
      fetchCart()
    } else {
      setCart([])
      setLoading(false)
    }
  }, [userId])

  async function fetchCart() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      setCart(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addToCart(productId: string, quantity: number = 1) {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity,
      }, {
        onConflict: 'user_id,product_id',
      })

    if (error) throw error
    await fetchCart()
  }

  async function removeFromCart(productId: string) {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    await fetchCart()
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    await fetchCart()
  }

  async function clearCart() {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
    await fetchCart()
  }

  const cartTotal = cart.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    refetch: fetchCart,
  }
}
