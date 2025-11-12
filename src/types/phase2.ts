// src/types/phase2.ts
// TypeScript interfaces for Phase 2: Supplier Payables & Bank Management

// ============================================
// SUPPLIER PAYMENT TYPES
// ============================================

export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

export type ChequeStatus = "pending" | "cleared" | "bounced";

export type PaymentStatus = "pending" | "completed" | "cancelled";

export type PaymentTerms =
  | "immediate"
  | "7_days"
  | "15_days"
  | "30_days"
  | "60_days"
  | "90_days";

export interface SupplierPayment {
  id: string;
  payment_number: string;
  supplier_id: string;
  purchase_id: string | null;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  bank_id: string | null;
  reference_number: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: ChequeStatus | null;
  notes: string | null;
  status: PaymentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  suppliers?: {
    name: string;
    supplier_code: string;
  };
  purchases?: {
    purchase_id: string;
    total_amount: number;
  };
  banks?: {
    bank_name: string;
    bank_code: string;
  };
}

export interface SupplierPaymentFormData {
  supplier_id: string;
  purchase_id: string | null;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  bank_id: string | null;
  reference_number: string;
  cheque_number: string;
  cheque_date: string;
  notes: string;
}

// Enhanced Purchase with payment tracking
export interface PurchaseWithPayments {
  id: string;
  purchase_id: string;
  supplier_id: string;
  purchase_date: string;
  subtotal: number;
  total_discount: number;
  total_amount: number;
  invoice_number: string | null;
  payment_status: "unpaid" | "paid" | "partial";
  payment_terms: PaymentTerms | null;
  due_date: string | null;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  // Calculated
  days_overdue?: number;
  urgency?: "current" | "medium" | "high" | "critical";
}

export interface OutstandingPayable {
  id: string;
  purchase_id: string;
  purchase_date: string;
  invoice_number: string | null;
  supplier_name: string;
  supplier_code: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  payment_terms: string | null;
  due_date: string | null;
  days_overdue: number;
  urgency: "current" | "medium" | "high" | "critical";
}

// ============================================
// BANK ACCOUNT TYPES
// ============================================

export type AccountType = "current" | "savings" | "cash";

export interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_id: string;
  account_type: AccountType;
  branch: string | null;
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  banks?: {
    bank_name: string;
    bank_code: string;
  };
  unreconciled_transactions?: number;
}

export interface BankAccountFormData {
  account_name: string;
  account_number: string;
  bank_id: string;
  account_type: AccountType;
  branch: string;
  opening_balance: number;
  is_primary: boolean;
  notes: string;
}

// ============================================
// BANK TRANSACTION TYPES
// ============================================

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "fee"
  | "interest";

export interface BankTransaction {
  id: string;
  transaction_number: string;
  bank_account_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number;
  description: string;
  reference_number: string | null;
  linked_payment_id: string | null;
  linked_supplier_payment_id: string | null;
  linked_expense_id: string | null;
  reconciled: boolean;
  reconciled_date: string | null;
  reconciled_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  bank_accounts?: {
    account_name: string;
    account_number: string;
  };
}

export interface BankTransactionFormData {
  bank_account_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number;
  description: string;
  reference_number: string;
  notes: string;
}

// ============================================
// REPORTING TYPES
// ============================================

export interface CashFlowSummary {
  month: string;
  cash_inflow: number;
  cash_outflow: number;
  net_cash_flow: number;
}

export interface PayablesSummary {
  total_outstanding: number;
  current: number; // Not overdue
  overdue_30: number; // 0-30 days overdue
  overdue_60: number; // 31-60 days overdue
  overdue_90_plus: number; // 90+ days overdue
  supplier_count: number;
  average_payment_days: number;
}

export interface BankBalanceSummary {
  total_balance: number;
  accounts: {
    account_name: string;
    account_type: AccountType;
    balance: number;
    unreconciled: number;
  }[];
  unreconciled_total: number;
}

// ============================================
// CONSTANTS & LABELS
// ============================================

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  immediate: "Immediate",
  "7_days": "7 Days",
  "15_days": "15 Days",
  "30_days": "30 Days",
  "60_days": "60 Days",
  "90_days": "90 Days",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  current: "Current Account",
  savings: "Savings Account",
  cash: "Cash",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit (Money In)",
  withdrawal: "Withdrawal (Money Out)",
  transfer: "Transfer",
  fee: "Bank Fee",
  interest: "Interest Earned",
};

export const CHEQUE_STATUS_LABELS: Record<ChequeStatus, string> = {
  pending: "Pending Clearance",
  cleared: "Cleared",
  bounced: "Bounced/Returned",
};

export const URGENCY_COLORS = {
  current:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const PAYMENT_STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
