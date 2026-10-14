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
        // For sellers, get orders that contain their products
        query = supabase
          .from('orders')
          .select(`
            *,
            order_items (*, products!order_items_product_id_fkey (seller_id)),
            profiles!orders_buyer_id_fkey (full_name)
          `)
          .order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        // Filter orders that have products from this seller
        const sellerOrders = (data || []).filter((order: any) =>
          order.order_items?.some((item: any) => item.products?.seller_id === userId)
        ).map((order: any) => ({
          ...order,
          buyer_name: order.profiles?.full_name,
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        buyer_id: buyerId,
        total,
        shipping_cost: shippingCost,
        status: 'Confirmed',
        shipping_address: shippingAddress,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_condition: item.product_condition,
          price: item.price,
          quantity: item.quantity,
        }))
      )

    if (itemsError) throw itemsError

    // Decrement product stock for each item
    // NOTE: This is not atomic and could have race conditions in high-traffic scenarios.
    // For production, this should be moved to a database function (RPC) with proper locking.
    for (const item of items) {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = product?.stock || 0;
      const newStock = Math.max(0, currentStock - item.quantity);

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);

      if (updateError) throw updateError;
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
