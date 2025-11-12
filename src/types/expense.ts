// src/types/expense.ts
// TypeScript interfaces for the expense management system

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

export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type RecurringFrequency = "monthly" | "quarterly" | "yearly" | null;

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  vendor_name: string | null;
  notes: string | null;
  receipt_number: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency;
  status: ExpenseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  vendor_name: string;
  notes: string;
  receipt_number: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency;
}

export interface ExpenseSummary {
  total_expenses: number;
  by_category: {
    category: ExpenseCategory;
    total: number;
    percentage: number;
  }[];
  by_month: {
    month: string;
    total: number;
  }[];
}

// Category labels for UI display
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Fuel & Gas",
  salaries: "Salaries & Wages",
  rent: "Rent",
  utilities: "Utilities (Electric, Water)",
  maintenance: "Maintenance",
  delivery: "Delivery & Transport",
  marketing: "Marketing & Advertising",
  office_supplies: "Office Supplies",
  telephone: "Telephone & Internet",
  insurance: "Insurance",
  repairs: "Repairs",
  professional_fees: "Professional Fees",
  bank_charges: "Bank Charges",
  depreciation: "Depreciation",
  taxes: "Taxes",
  miscellaneous: "Miscellaneous",
};

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  card: "Credit/Debit Card",
};

// Expense category colors for charts
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  fuel: "#3b82f6",
  salaries: "#ef4444",
  rent: "#f59e0b",
  utilities: "#10b981",
  maintenance: "#6366f1",
  delivery: "#8b5cf6",
  marketing: "#ec4899",
  office_supplies: "#14b8a6",
  telephone: "#f97316",
  insurance: "#06b6d4",
  repairs: "#84cc16",
  professional_fees: "#a855f7",
  bank_charges: "#f43f5e",
  depreciation: "#64748b",
  taxes: "#dc2626",
  miscellaneous: "#94a3b8",
};
