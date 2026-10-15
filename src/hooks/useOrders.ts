import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  total: number
  shipping_cost: number
  status: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  shipping_address: any
  created_at: string
  updated_at: string
  items?: OrderItem[]
  buyer_name?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_condition: string | null
  price: number
  quantity: number
  created_at: string
}

export function useOrders(userId: string | null, isSeller: boolean = false) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (userId) {
      fetchOrders()
    } else {
      setOrders([])
      setLoading(false)
    }
  }, [userId, isSeller])

  async function fetchOrders() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          profiles!orders_buyer_id_fkey (full_name)
        `)

      if (isSeller) {
        // For sellers, fetch orders and order_items separately to avoid RLS circular dependency
        // First, get the seller's product IDs
        const { data: sellerProducts, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', userId)
          .eq('status', 'active')

        if (productsError) throw productsError

        const sellerProductIds = sellerProducts?.map(p => p.id) || []

        // Then fetch order_items directly for these products
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('product_id', sellerProductIds)

        if (itemsError) throw itemsError

        // Get unique order IDs from order_items
        const orderIds = [...new Set(orderItems?.map(oi => oi.order_id) || [])]

        // Fetch orders for these order IDs
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_buyer_id_fkey (full_name)
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Manually assemble the orders with their items
        const sellerOrders = (ordersData || []).map((order: any) => ({
          ...order,
          buyer_name: order.profiles?.full_name,
          items: orderItems?.filter((oi: any) => oi.order_id === order.id) || []
        }))

        setOrders(sellerOrders)
      } else {
        // For buyers, get their own orders with order_items (RLS recursion is now fixed)
        query = query.eq('buyer_id', userId).order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        const transformedData: Order[] = (data || []).map((item: any) => ({
          id: item.id,
          order_number: item.order_number,
          buyer_id: item.buyer_id,
          total: item.total,
          shipping_cost: item.shipping_cost,
          status: item.status,
          shipping_address: item.shipping_address,
          created_at: item.created_at,
          updated_at: item.updated_at,
          items: item.order_items || [],
          buyer_name: undefined,
        }))

        setOrders(transformedData)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function createOrder(
    buyerId: string,
    items: Array<{ product_id: string; product_name: string; product_condition: string | null; price: number; quantity: number }>,
    shippingAddress: any,
    total: number,
    shippingCost: number
  ) {
    // Generate order number
    const orderNumber = `TA-${Date.now().toString().slice(-6)}`

    // Use the atomic RPC function for secure order creation
    const { data: order, error: rpcError } = await supabase.rpc('create_order_with_stock', {
      p_buyer_id: buyerId,
      p_order_number: orderNumber,
      p_total: total,
      p_shipping_cost: shippingCost,
      p_shipping_address: shippingAddress,
      p_items: items,
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      throw new Error(rpcError.message || 'Failed to create order. Please ensure the create_order_with_stock function is deployed to Supabase.')
    }

    return order
  }

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
    await fetchOrders()
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refetch: fetchOrders,
  }
}
