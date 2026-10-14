import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchProducts()
  }, [filters?.category, filters?.condition, filters?.search, filters?.sellerId, filters?.status])

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
      } else {
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

      setProducts(transformedData)
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

export async function updateProduct(id: string, updates: Partial<Product>) {
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
