import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export interface Category {
  id: string
  name: string
  created_at: string
}

export function useProducts(filters?: {
  category?: string
  condition?: string
  search?: string
  sellerId?: string
  status?: 'active' | 'draft' | 'sold'
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Don't fetch if sellerId is undefined - wait for auth to complete
    if (filters?.sellerId === undefined) {
      setProducts([])
      setLoading(false)
      return
    }

    // Always reset products when sellerId filter is present to prevent showing stale data
    // This ensures that after an app update/reload, only the current seller's products are displayed
    if (filters?.sellerId) {
      setProducts([])
    }

    fetchProducts()

    // Only enable Realtime for buyer-facing product lists (not seller-specific views)
    const shouldSubscribe = !filters?.sellerId

    if (shouldSubscribe) {
      setupRealtimeSubscription()
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [filters?.category, filters?.condition, filters?.search, filters?.sellerId, filters?.status])

  function setupRealtimeSubscription() {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }

    // Generate a unique channel name for each subscription attempt
    // This prevents conflicts with React Strict Mode remounts
    const channelName = `products-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products'
        },
        (payload) => handleProductInsert(payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => handleProductUpdate(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Failed to subscribe to products table')
        }
      })
  }

  async function handleProductInsert(payload: any) {
    const newRecord = payload.new

    // Check if the product should be visible based on current filters
    if (!shouldIncludeProduct(newRecord)) {
      return
    }

    // Fetch full product data with relations
    try {
      const { data: fullProduct } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          profiles!products_seller_id_fkey (full_name)
        `)
        .eq('id', newRecord.id)
        .single()

      if (fullProduct) {
        const transformedProduct: Product = {
          id: fullProduct.id,
          seller_id: fullProduct.seller_id,
          name: fullProduct.name,
          price: fullProduct.price,
          category_id: fullProduct.category_id,
          category_name: fullProduct.categories?.name,
          condition: fullProduct.condition,
          year: fullProduct.year,
          verified: fullProduct.verified,
          stock: fullProduct.stock,
          description: fullProduct.description,
          images: fullProduct.images || [],
          status: fullProduct.status,
          seller_name: fullProduct.profiles?.full_name,
          created_at: fullProduct.created_at,
          updated_at: fullProduct.updated_at,
        }

        setProducts(prev => {
          // Prevent duplicates
          if (prev.some(p => p.id === transformedProduct.id)) {
            return prev
          }
          // Add new product at the beginning
          return [transformedProduct, ...prev]
        })
      }
    } catch (err) {
      console.error('[Realtime] Error fetching full product data:', err)
    }
  }

  async function handleProductUpdate(payload: any) {
    const updatedRecord = payload.new
    const oldRecord = payload.old

    // Remove product if it no longer matches filters
    if (!shouldIncludeProduct(updatedRecord)) {
      setProducts(prev => prev.filter(p => p.id !== updatedRecord.id))
      return
    }

    // If product became active and matches filters, add it
    if (oldRecord.status !== 'active' && updatedRecord.status === 'active' && shouldIncludeProduct(updatedRecord)) {
      try {
        const { data: fullProduct } = await supabase
          .from('products')
          .select(`
            *,
            categories (name),
            profiles!products_seller_id_fkey (full_name)
          `)
          .eq('id', updatedRecord.id)
          .single()

        if (fullProduct) {
          const transformedProduct: Product = {
            id: fullProduct.id,
            seller_id: fullProduct.seller_id,
            name: fullProduct.name,
            price: fullProduct.price,
            category_id: fullProduct.category_id,
            category_name: fullProduct.categories?.name,
            condition: fullProduct.condition,
            year: fullProduct.year,
            verified: fullProduct.verified,
            stock: fullProduct.stock,
            description: fullProduct.description,
            images: fullProduct.images || [],
            status: fullProduct.status,
            seller_name: fullProduct.profiles?.full_name,
            created_at: fullProduct.created_at,
            updated_at: fullProduct.updated_at,
          }

          setProducts(prev => {
            if (prev.some(p => p.id === transformedProduct.id)) {
              return prev
            }
            return [transformedProduct, ...prev]
          })
        }
      } catch (err) {
        console.error('[Realtime] Error fetching updated product data:', err)
      }
      return
    }

    // Update existing product in place
    setProducts(prev => prev.map(p => {
      if (p.id === updatedRecord.id) {
        return {
          ...p,
          name: updatedRecord.name,
          price: updatedRecord.price,
          condition: updatedRecord.condition,
          year: updatedRecord.year,
          verified: updatedRecord.verified,
          stock: updatedRecord.stock,
          description: updatedRecord.description,
          images: updatedRecord.images || [],
          status: updatedRecord.status,
          updated_at: updatedRecord.updated_at,
        }
      }
      return p
    }))
  }

  function shouldIncludeProduct(product: any): boolean {
    // Check status filter
    const targetStatus = filters?.status || 'active'
    if (product.status !== targetStatus) {
      return false
    }

    // Check category filter
    if (filters?.category && product.category_id) {
      // This is a simplified check - ideally we'd fetch the category name
      // For now, we'll rely on the category_id matching
      // In production, you might want to cache category names
    }

    // Check condition filter
    if (filters?.condition && product.condition !== filters.condition) {
      return false
    }

    // Check search filter
    if (filters?.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    return true
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name),
          profiles!products_seller_id_fkey (full_name)
        `)

      if (filters?.category) {
        query = query.eq('categories.name', filters.category)
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      } else if (!filters?.sellerId) {
        // Only filter by active status if not viewing seller's own products
        query = query.eq('status', 'active')
      }

      if (filters?.sellerId) {
        query = query.eq('seller_id', filters.sellerId)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const transformedData: Product[] = (data || []).map((item: any) => ({
        id: item.id,
        seller_id: item.seller_id,
        name: item.name,
        price: item.price,
        category_id: item.category_id,
        category_name: item.categories?.name,
        condition: item.condition,
        year: item.year,
        verified: item.verified,
        stock: item.stock,
        description: item.description,
        images: item.images || [],
        status: item.status,
        seller_name: item.profiles?.full_name,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      // Additional safety check: filter by sellerId to ensure only current seller's products are displayed
      const filteredData = filters?.sellerId
        ? transformedData.filter(p => p.seller_id === filters.sellerId)
        : transformedData

      setProducts(filteredData)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, refetch: fetchProducts }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error, refetch: fetchCategories }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'seller_name' | 'category_name'>) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: product.seller_id,
      name: product.name,
      price: product.price,
      category_id: product.category_id,
      condition: product.condition,
      year: product.year,
      verified: product.verified,
      stock: product.stock,
      description: product.description,
      images: product.images,
      status: product.status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'seller_name' | 'category_name'>>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}
