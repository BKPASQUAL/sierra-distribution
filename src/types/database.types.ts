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
          phone: string | null
          role: 'admin' | 'manager' | 'sales' | 'warehouse'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'sales' | 'warehouse'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'sales' | 'warehouse'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          customer_code: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          tax_id: string | null
          credit_limit: number
          outstanding_balance: number
          status: 'active' | 'inactive' | 'suspended'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_code: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          tax_id?: string | null
          credit_limit?: number
          outstanding_balance?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_code?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          tax_id?: string | null
          credit_limit?: number
          outstanding_balance?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category: string | null
          unit_price: number
          cost_price: number | null
          stock_quantity: number
          reorder_level: number
          unit_of_measure: string
          barcode: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          category?: string | null
          unit_price: number
          cost_price?: number | null
          stock_quantity?: number
          reorder_level?: number
          unit_of_measure?: string
          barcode?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          category?: string | null
          unit_price?: number
          cost_price?: number | null
          stock_quantity?: number
          reorder_level?: number
          unit_of_measure?: string
          barcode?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          order_date: string
          delivery_date: string | null
          status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          payment_status: 'unpaid' | 'partial' | 'paid'
          payment_method: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          order_date?: string
          delivery_date?: string | null
          status?: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          payment_status?: 'unpaid' | 'partial' | 'paid'
          payment_method?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          order_date?: string
          delivery_date?: string | null
          status?: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          payment_status?: 'unpaid' | 'partial' | 'paid'
          payment_method?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_percent: number
          tax_percent: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_percent?: number
          tax_percent?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          discount_percent?: number
          tax_percent?: number
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          product_id: string
          transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return'
          quantity: number
          reference_id: string | null
          reference_type: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return'
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          transaction_type?: 'purchase' | 'sale' | 'adjustment' | 'return'
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payment_number: string
          order_id: string | null
          customer_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_number: string
          order_id?: string | null
          customer_id: string
          payment_date?: string
          amount: number
          payment_method: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_number?: string
          order_id?: string | null
          customer_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}