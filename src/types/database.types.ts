export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExpenseCategory =
  | "fuel"
  | "salaries"
  | "rent"
  | "utilities"
  | "maintenance"
  | "delivery"
  | "marketing"
  | "office_supplies"
  | "telephone"
  | "insurance"
  | "repairs"
  | "professional_fees"
  | "bank_charges"
  | "depreciation"
  | "taxes"
  | "miscellaneous";
export type ExpensePaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: "admin" | "manager" | "sales" | "warehouse";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "admin" | "manager" | "sales" | "warehouse";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "admin" | "manager" | "sales" | "warehouse";
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          customer_code: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          tax_id: string | null;
          credit_limit: number;
          outstanding_balance: number;
          status: "active" | "inactive" | "suspended";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_code: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          credit_limit?: number;
          outstanding_balance?: number;
          status?: "active" | "inactive" | "suspended";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_code?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          credit_limit?: number;
          outstanding_balance?: number;
          status?: "active" | "inactive" | "suspended";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          category: string | null;
          unit_price: number;
          cost_price: number | null;
          stock_quantity: number;
          selling_price: number; // NEW: Default selling price column
          reorder_level: number;
          unit_of_measure: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          mrp: number;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          category?: string | null;
          unit_price: number;
          cost_price?: number | null;
          stock_quantity?: number;
          selling_price: number; // NEW: Default selling price column
          reorder_level?: number;
          unit_of_measure?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          mrp: number;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          unit_price?: number;
          cost_price?: number | null;
          stock_quantity?: number;
          selling_price: number; // NEW: Default selling price column
          reorder_level?: number;
          unit_of_measure?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          mrp?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          order_date: string;
          delivery_date: string | null;
          status:
            | "draft"
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          payment_status: "unpaid" | "partial" | "paid";
          payment_method: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id: string;
          order_date?: string;
          delivery_date?: string | null;
          status?:
            | "draft"
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          payment_status?: "unpaid" | "partial" | "paid";
          payment_method?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          order_date?: string;
          delivery_date?: string | null;
          status?:
            | "draft"
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          payment_status?: "unpaid" | "partial" | "paid";
          payment_method?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount_percent: number;
          tax_percent: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount_percent?: number;
          tax_percent?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          discount_percent?: number;
          tax_percent?: number;
          created_at?: string;
        };
      };
      inventory_transactions: {
        Row: {
          id: string;
          product_id: string;
          transaction_type: "purchase" | "sale" | "adjustment" | "return";
          quantity: number;
          reference_id: string | null;
          reference_type: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          transaction_type: "purchase" | "sale" | "adjustment" | "return";
          quantity: number;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          transaction_type?: "purchase" | "sale" | "adjustment" | "return";
          quantity?: number;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          order_id: string | null;
          customer_id: string;
          payment_date: string;
          amount: number;
          payment_method: string;
          reference_number: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          // NEW FIELDS FOR CHEQUE TRACKING:
          cheque_number: string | null;
          cheque_date: string | null;
          cheque_status: "pending" | "passed" | "returned" | null;
        };
        Insert: {
          id?: string;
          payment_number: string;
          order_id?: string | null;
          customer_id: string;
          payment_date?: string;
          amount: number;
          payment_method: string;
          reference_number?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          // NEW FIELDS FOR CHEQUE TRACKING:
          cheque_number?: string | null;
          cheque_date?: string | null;
          cheque_status?: "pending" | "passed" | "returned" | null;
        };
        Update: {
          id?: string;
          payment_number?: string;
          order_id?: string | null;
          customer_id?: string;
          payment_date?: string;
          amount?: number;
          payment_method?: string;
          reference_number?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          // NEW FIELDS FOR CHEQUE TRACKING:
          cheque_number?: string | null;
          cheque_date?: string | null;
          cheque_status?: "pending" | "passed" | "returned" | null;
        };
      };
      // expenses: {
      //   Row: {
      //     id: string;
      //     expense_number: string;
      //     expense_date: string;
      //     category: "fuel" | "maintenance" | "other";
      //     description: string | null; // Now optional
      //     amount: number;
      //     payment_method: "cash" | "bank_transfer" | "cheque" | "card";
      //     reference_number: string | null;
      //     vendor_name: string | null;
      //     notes: string | null;
      //     created_by: string;
      //     created_at: string;
      //     updated_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     expense_number: string;
      //     expense_date?: string;
      //     category: "fuel" | "maintenance" | "other";
      //     description: string | null; // Now optional
      //     amount: number;
      //     payment_method: "cash" | "bank_transfer" | "cheque" | "card";
      //     reference_number?: string | null;
      //     vendor_name?: string | null;
      //     notes?: string | null;
      //     created_by: string;
      //     created_at?: string;
      //     updated_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     expense_number?: string;
      //     expense_date?: string;
      //     category?: "fuel" | "maintenance" | "other";
      //     description: string | null; // Now optional
      //     amount?: number;
      //     payment_method?: "cash" | "bank_transfer" | "cheque" | "card";
      //     reference_number?: string | null;
      //     vendor_name?: string | null;
      //     notes?: string | null;
      //     created_by?: string;
      //     created_at?: string;
      //     updated_at?: string;
      //   };
      // };

      expenses: {
        Row: {
          id: string;
          expense_number: string;
          expense_date: string;
          category: ExpenseCategory;
          description: string | null;
          amount: number;
          payment_method: ExpensePaymentMethod;
          reference_number: string | null;
          vendor_name: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          // ADDED NEW FIELDS
          receipt_number: string | null;
          is_recurring: boolean;
          recurring_frequency: "monthly" | "quarterly" | "yearly" | null;
          status: ExpenseStatus;
        };
        Insert: {
          id?: string;
          expense_number: string;
          expense_date?: string;
          category: ExpenseCategory;
          description?: string | null;
          amount: number;
          payment_method: ExpensePaymentMethod;
          reference_number?: string | null;
          vendor_name?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          // ADDED NEW FIELDS
          receipt_number?: string | null;
          is_recurring?: boolean;
          recurring_frequency?: "monthly" | "quarterly" | "yearly" | null;
          status?: ExpenseStatus;
        };
        Update: {
          id?: string;
          expense_number?: string;
          expense_date?: string;
          category?: ExpenseCategory;
          description?: string | null;
          amount?: number;
          payment_method?: ExpensePaymentMethod;
          reference_number?: string | null;
          vendor_name?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          // ADDED NEW FIELDS
          receipt_number?: string | null;
          is_recurring?: boolean;
          recurring_frequency?: "monthly" | "quarterly" | "yearly" | null;
          status?: ExpenseStatus;
        };
      };
      banks: {
        Row: {
          id: string;
          bank_code: string;
          bank_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_code: string;
          bank_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_code?: string;
          bank_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ADD THIS NEW TABLE
      bank_accounts: {
        Row: {
          id: string;
          account_name: string;
          account_number: string;
          bank_id: string;
          account_type: "current" | "savings" | "cash" | "loan" | "od";
          branch: string | null;
          opening_balance: number;
          current_balance: number;
          currency: string | null;
          is_active: boolean;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_name: string;
          account_number: string;
          bank_id: string;
          account_type: "current" | "savings" | "cash" | "loan" | "od";
          branch?: string | null;
          opening_balance?: number;
          current_balance?: number;
          currency?: string | null;
          is_active?: boolean;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_name?: string;
          account_number?: string;
          bank_id?: string;
          account_type?: "current" | "savings" | "cash" | "loan" | "od";
          branch?: string | null;
          opening_balance?: number;
          current_balance?: number;
          currency?: string | null;
          is_active?: boolean;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ADD THIS NEW TABLE
      supplier_payments: {
        Row: {
          id: string;
          payment_number: string;
          supplier_id: string;
          purchase_id: string | null;
          payment_date: string;
          amount: number;
          payment_method: "cash" | "bank_transfer" | "cheque" | "card";
          bank_account_id: string | null;
          reference_number: string | null;
          cheque_number: string | null;
          cheque_date: string | null;
          cheque_status: "pending" | "cleared" | "bounced" | null;
          notes: string | null;
          status: "pending" | "completed" | "cancelled";
          created_by: string;
          created_at: string;
          updated_at: string;
          
        };
        Insert: {
          id?: string;
          payment_number: string;
          supplier_id: string;
          purchase_id?: string | null;
          payment_date?: string;
          amount: number;
          payment_method: "cash" | "bank_transfer" | "cheque" | "card";
          bank_account_id?: string | null;
          reference_number?: string | null;
          cheque_number?: string | null;
          cheque_date?: string | null;
          cheque_status?: "pending" | "cleared" | "bounced" | null;
          notes?: string | null;
          status?: "pending" | "completed" | "cancelled";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_number?: string;
          supplier_id?: string;
          purchase_id?: string | null;
          payment_date?: string;
          amount?: number;
          payment_method?: "cash" | "bank_transfer" | "cheque" | "card";
          bank_account_id?: string | null;
          reference_number?: string | null;
          cheque_number?: string | null;
          cheque_date?: string | null;
          cheque_status?: "pending" | "cleared" | "bounced" | null;
          notes?: string | null;
          status?: "pending" | "completed" | "cancelled";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          supplier_code: string;
          name: string;
          contact: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };

        Insert: {
          id?: string;
          supplier_code?: string;
          name: string;
          contact?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_code?: string;
          name?: string;
          contact?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
