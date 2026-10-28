import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  product_id: string
  created_at: string
  updated_at: string
  product: Product
  buyer_name: string
  seller_name: string
  seller_initials: string
  last_message?: string
  unread_count: number
  messages?: { body: string }[]
}

export function useConversations(userId: string | null, role: 'buyer' | 'seller') {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) {
      setConversations([])
      setLoading(false)
      return
    }

    fetchConversations()

    // Clean up existing subscription if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Subscribe to conversation updates (new conversations and updated conversations)
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id'

    const channel = supabase
      .channel(`conversations:${userId}:${role}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `${column}=eq.${userId}`,
        },
        async (payload) => {
          // Refetch conversations on any change to ensure data consistency
          // This handles both new conversations and updated conversations (via trigger)
          await fetchConversations()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, role])

  async function fetchConversations() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Query conversations based on role
      const column = role === 'buyer' ? 'buyer_id' : 'seller_id'

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          buyer_id,
          seller_id,
          product_id,
          created_at,
          updated_at,
          products (
            id,
            seller_id,
            name,
            price,
            category_id,
            categories (name),
            condition,
            year,
            verified,
            stock,
            description,
            images,
            status,
            created_at,
            updated_at
          ),
          buyer_profile:profiles!conversations_buyer_id_fkey (
            full_name
          ),
          seller_profile:profiles!conversations_seller_id_fkey (
            full_name
          ),
          messages (
            body
          )
        `)
        .eq(column, userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Transform data to match our Conversation type
      const transformedData: Conversation[] = (data || []).map((item: any) => {
        const product: Product = {
          id: item.products.id,
          seller_id: item.products.seller_id,
          name: item.products.name,
          price: item.products.price,
          category_id: item.products.category_id,
          category_name: item.products.categories?.name,
          condition: item.products.condition,
          year: item.products.year,
          verified: item.products.verified,
          stock: item.products.stock,
          description: item.products.description,
          images: item.products.images || [],
          status: item.products.status,
          created_at: item.products.created_at,
          updated_at: item.products.updated_at,
        }

        const buyerName = item.buyer_profile?.full_name || 'Unknown'
        const sellerName = item.seller_profile?.full_name || 'Unknown'
        const sellerInitials = sellerName
          .split(' ')
          .map((name: string) => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        // Get the last message (most recent)
        const messages = item.messages || []
        const lastMessage = messages.length > 0 ? messages[messages.length - 1].body : undefined

        return {
          id: item.id,
          buyer_id: item.buyer_id,
          seller_id: item.seller_id,
          product_id: item.product_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          product,
          buyer_name: buyerName,
          seller_name: sellerName,
          seller_initials: sellerInitials,
          last_message: lastMessage,
          unread_count: 0, // Will be calculated separately
        }
      })

      setConversations(transformedData)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  return { conversations, loading, error, refetch: fetchConversations }
}
