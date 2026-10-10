export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'buyer' | 'seller'
          store_name: string | null
          store_description: string | null
          phone: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'buyer' | 'seller'
          store_name?: string | null
          store_description?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'buyer' | 'seller'
          store_name?: string | null
          store_description?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          name: string
          price: number
          category_id: string | null
          condition: 'Mint' | 'Excellent' | 'Good' | 'Fair'
          year: string | null
          verified: string
          stock: number
          description: string | null
          images: string[]
          status: 'active' | 'draft' | 'sold'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          name: string
          price: number
          category_id?: string | null
          condition: 'Mint' | 'Excellent' | 'Good' | 'Fair'
          year?: string | null
          verified?: string
          stock?: number
          description?: string | null
          images?: string[]
          status?: 'active' | 'draft' | 'sold'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          name?: string
          price?: number
          category_id?: string | null
          condition?: 'Mint' | 'Excellent' | 'Good' | 'Fair'
          year?: string | null
          verified?: string
          stock?: number
          description?: string | null
          images?: string[]
          status?: 'active' | 'draft' | 'sold'
          created_at?: string
          updated_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      cart: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          buyer_id: string
          total: number
          shipping_cost: number
          status: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          shipping_address: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          buyer_id: string
          total: number
          shipping_cost?: number
          status?: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          shipping_address: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          buyer_id?: string
          total?: number
          shipping_cost?: number
          status?: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          shipping_address?: Json
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_condition: string | null
          price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_condition?: string | null
          price: number
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_condition?: string | null
          price?: number
          quantity?: number
          created_at?: string
        }
      }
    }
  }
}
