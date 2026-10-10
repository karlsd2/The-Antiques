import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export function useWishlist(userId: string | null) {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (userId) {
      fetchWishlist()
    } else {
      setWishlist([])
      setLoading(false)
    }
  }, [userId])

  async function fetchWishlist() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId)

      if (error) throw error

      const productIds = (data || []).map((item: { product_id: string }) => item.product_id)
      setWishlist(productIds)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addToWishlist(productId: string) {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId,
      })

    if (error) throw error
    await fetchWishlist()
  }

  async function removeFromWishlist(productId: string) {
    if (!userId) throw new Error('No user logged in')

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    await fetchWishlist()
  }

  async function toggleWishlist(productId: string) {
    if (wishlist.includes(productId)) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }

  return {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refetch: fetchWishlist,
  }
}
