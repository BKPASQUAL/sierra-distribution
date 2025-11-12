// src/types/phase3.ts
// TypeScript interfaces for Phase 3: Advanced Analytics & Budget Management

// ============================================
// BUDGET TYPES
// ============================================

export type BudgetType = "sales" | "expenses" | "purchases";

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

export interface Budget {
  id: string;
  budget_period: string; // YYYY-MM format
  budget_type: BudgetType;
  category: ExpenseCategory | null;
  budgeted_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetFormData {
  budget_period: string;
  budget_type: BudgetType;
  category: ExpenseCategory | null;
  budgeted_amount: number;
  notes: string;
}

export interface BudgetVsActual {
  period: string;
  type: BudgetType;
  category: string | null;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percent: number;
  variance_status: "favorable" | "unfavorable" | "neutral";
}

// ============================================
// FINANCIAL KPI TYPES
// ============================================

export interface FinancialKPI {
  id: string;
  kpi_date: string;
  kpi_period: string; // YYYY-MM
  
  // Profitability
  gross_profit: number;
  gross_profit_margin: number;
  net_profit: number;
  net_profit_margin: number;
  
  // Liquidity
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  
  // Efficiency
  inventory_turnover: number;
  days_inventory_outstanding: number;
  days_sales_outstanding: number;
  days_payable_outstanding: number;
  cash_conversion_cycle: number;
  
  // Growth
  revenue_growth_rate: number;
  customer_growth_rate: number;
  
  // Cash Flow
  operating_cash_flow: number;
  free_cash_flow: number;
  
  created_at: string;
}

export interface FinancialHealthMetrics {
  // Current Period
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_purchases: number;
  monthly_net_profit: number;
  
  // Balance Sheet
  cash_balance: number;
  total_receivables: number;
  inventory_value: number;
  total_current_assets: number;
  total_current_liabilities: number;
  
  // Ratios
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  working_capital: number;
  
  // Additional
  active_customers: number;
  net_profit_margin: number;
}

// ============================================
// PRODUCT PERFORMANCE TYPES
// ============================================

export interface ProductPerformance {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
  mrp: number;
  
  // Sales metrics
  total_units_sold: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  
  // Inventory metrics
  inventory_value: number;
  turnover_ratio_90d: number;
  days_to_sell: number | null;
  stock_status: "out_of_stock" | "low_stock" | "overstocked" | "normal";
}

// ============================================
// CUSTOMER ANALYTICS TYPES
// ============================================

export interface CustomerAnalytics {
  id: string;
  customer_code: string;
  name: string;
  city: string | null;
  credit_limit: number;
  outstanding_balance: number;
  
  // Order metrics
  total_orders: number;
  lifetime_value: number;
  average_order_value: number;
  
  // Payment behavior
  payment_completion_rate: number;
  days_since_last_order: number | null;
  orders_per_month: number;
  
  // Profitability
  total_profit: number;
  
  // Segment
  customer_segment: "new" | "inactive" | "vip" | "regular" | "occasional";
}

// ============================================
// FORECAST TYPES
// ============================================

export type ForecastType = "sales" | "expenses" | "cash_flow";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface Forecast {
  id: string;
  forecast_period: string; // YYYY-MM
  forecast_type: ForecastType;
  forecasted_amount: number;
  confidence_level: ConfidenceLevel | null;
  methodology: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface ForecastFormData {
  forecast_period: string;
  forecast_type: ForecastType;
  forecasted_amount: number;
  confidence_level: ConfidenceLevel;
  methodology: string;
  notes: string;
}

// ============================================
// INVENTORY BATCH TYPES (for FIFO/LIFO)
// ============================================

export interface InventoryBatch {
  id: string;
  product_id: string;
  batch_number: string;
  purchase_id: string | null;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  received_date: string;
  notes: string | null;
  created_at: string;
}

export type ValuationMethod = "weighted_average" | "fifo" | "lifo" | "specific_identification";

// ============================================
// ANALYTICS SUMMARY TYPES
// ============================================

export interface BudgetSummary {
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percent: number;
  favorable_count: number;
  unfavorable_count: number;
  on_track_percent: number;
}

export interface PerformanceMetrics {
  // Top performers
  top_products: ProductPerformance[];
  top_customers: CustomerAnalytics[];
  
  // Problem areas
  slow_moving_products: ProductPerformance[];
  inactive_customers: CustomerAnalytics[];
  
  // Overall stats
  total_products_analyzed: number;
  total_customers_analyzed: number;
  average_product_margin: number;
  average_customer_value: number;
}

// ============================================
// DASHBOARD WIDGETS
// ============================================

export interface DashboardWidget {
  title: string;
  value: number | string;
  change: number | null;
  trend: "up" | "down" | "neutral";
  format: "currency" | "percentage" | "number";
  status: "good" | "warning" | "bad" | "neutral";
}

// ============================================
// CONSTANTS & LABELS
// ============================================

export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  sales: "Sales Revenue",
  expenses: "Operating Expenses",
  purchases: "Purchase Costs",
};

export const FORECAST_TYPE_LABELS: Record<ForecastType, string> = {
  sales: "Sales Forecast",
  expenses: "Expense Forecast",
  cash_flow: "Cash Flow Forecast",
};

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  low: "Low Confidence",
  medium: "Medium Confidence",
  high: "High Confidence",
};

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerAnalytics["customer_segment"], string> = {
  new: "New Customer",
  inactive: "Inactive",
  vip: "VIP Customer",
  regular: "Regular Customer",
  occasional: "Occasional Buyer",
};

export const STOCK_STATUS_LABELS: Record<ProductPerformance["stock_status"], string> = {
  out_of_stock: "Out of Stock",
  low_stock: "Low Stock",
  overstocked: "Overstocked",
  normal: "Normal",
};

export const VARIANCE_STATUS_COLORS = {
  favorable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  unfavorable: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const STOCK_STATUS_COLORS: Record<ProductPerformance["stock_status"], string> = {
  out_of_stock: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  low_stock: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  overstocked: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export const CUSTOMER_SEGMENT_COLORS: Record<CustomerAnalytics["customer_segment"], string> = {
  vip: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  regular: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  occasional: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString()}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getVarianceColor(variance: number, isExpense: boolean = false): string {
  // For revenue/sales: positive is good
  // For expenses: negative is good
  if (isExpense) {
    return variance <= 0 ? "text-green-600" : "text-red-600";
  } else {
    return variance >= 0 ? "text-green-600" : "text-red-600";
  }
}

export function getRatioHealth(ratio: number, type: "current" | "quick" | "cash"): "good" | "warning" | "bad" {
  const thresholds = {
    current: { good: 2.0, warning: 1.5 },
    quick: { good: 1.0, warning: 0.7 },
    cash: { good: 0.5, warning: 0.2 },
  };
  
  const t = thresholds[type];
  if (ratio >= t.good) return "good";
  if (ratio >= t.warning) return "warning";
  return "bad";
}