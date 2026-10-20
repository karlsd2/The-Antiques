import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  products?: Product  // Supabase returns nested data under 'products' key
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
          products (*, categories (name))
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

    // Check if product exists and has sufficient stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, status')
      .eq('id', productId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')
    if (product.status !== 'active') throw new Error('Product is not available')
    if (product.stock < quantity) throw new Error(`Only ${product.stock} items available in stock`)

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    const currentQuantity = existingItem?.quantity || 0
    const newQuantity = currentQuantity + quantity

    if (newQuantity > product.stock) {
      throw new Error(`Cannot add ${quantity} more item(s). Only ${product.stock - currentQuantity} available in stock.`)
    }

    const { error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity: newQuantity,
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
    if (quantity < 1) throw new Error('Quantity must be at least 1')

    // Check product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, status')
      .eq('id', productId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')
    if (product.status !== 'active') throw new Error('Product is not available')
    if (quantity > product.stock) throw new Error(`Only ${product.stock} items available in stock`)

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
    return sum + (item.products?.price || 0) * item.quantity
  }, 0)

  // Total count (all items including invalid)
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Valid count (only items with valid product data)
  const validCount = cart.reduce((sum, item) => {
    const hasValidProduct = item.products?.name && item.products?.price > 0 && item.products?.stock > 0;
    return hasValidProduct ? sum + item.quantity : sum;
  }, 0)

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount: validCount,
    totalCount,
    refetch: fetchCart,
  }
}
