// src/app/api/reports/financial-statement/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get date range. Default to last 30 days if not provided.
    const endDate = searchParams.get("endDate") || new Date().toISOString();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const startDate =
      searchParams.get("startDate") || defaultStartDate.toISOString();

    // --- 1. PROFIT & LOSS CALCULATIONS (For the period) ---

    // Get Revenue & COGS
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, order_items(quantity, cost_price)")
      .gte("order_date", startDate)
      .lte("order_date", endDate);

    if (orderError) throw new Error(`Order Error: ${orderError.message}`);

    let totalRevenue = 0;
    let totalCOGS = 0;
    orders.forEach((order) => {
      totalRevenue += order.total_amount;
      order.order_items.forEach((item) => {
        totalCOGS += item.quantity * (item.cost_price || 0);
      });
    });

    const grossProfit = totalRevenue - totalCOGS;

    // Get Expenses
    const { data: expenses, error: expenseError } = await supabase
      .from("expenses")
      .select("category, amount")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    if (expenseError) throw new Error(`Expense Error: ${expenseError.message}`);

    let totalExpenses = 0;
    const expensesByCategory: { [key: string]: number } = {};
    expenses.forEach((exp) => {
      totalExpenses += exp.amount;
      expensesByCategory[exp.category] =
        (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    // Calculate Net Profit
    const netProfit = grossProfit - totalExpenses;

    // --- 2. BALANCE SHEET CALCULATIONS (Snapshot at endDate) ---
    // Note: This is a simplified Balance Sheet.

    // ASSETS
    const [
      { data: cashAccounts, error: cashErr },
      { data: customerBalance, error: customerErr },
      { data: inventory, error: inventoryErr },
    ] = await Promise.all([
      // A1: Cash & Bank
      supabase
        .from("bank_accounts")
        .select("current_balance")
        .in("account_type", ["cash", "current", "savings"]),
      // A2: Accounts Receivable (Customers)
      supabase.from("customers").select("outstanding_balance"),
      // A3: Inventory
      supabase.from("products").select("stock_quantity, cost_price"),
    ]);

    if (cashErr || customerErr || inventoryErr) {
      throw new Error(
        `Balance Sheet Asset Error: ${
          cashErr?.message || customerErr?.message || inventoryErr?.message
        }`
      );
    }

    const totalCash =
      cashAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
    const totalReceivables =
      customerBalance?.reduce((sum, c) => sum + c.outstanding_balance, 0) || 0;
    const totalInventory =
      inventory?.reduce(
        (sum, p) => sum + p.stock_quantity * (p.cost_price || 0),
        0
      ) || 0;
    const totalAssets = totalCash + totalReceivables + totalInventory;

    // LIABILITIES
    const [
      { data: payables, error: payableErr },
      { data: loans, error: loanErr },
    ] = await Promise.all([
      // L1: Accounts Payable (Suppliers)
      supabase
        .from("purchases")
        .select("balance_due")
        .in("payment_status", ["unpaid", "partial"]),
      // L2: Loans & Overdrafts
      supabase
        .from("bank_accounts")
        .select("current_balance")
        .in("account_type", ["loan", "od"]),
    ]);

    if (payableErr || loanErr) {
      throw new Error(
        `Balance Sheet Liability Error: ${
          payableErr?.message || loanErr?.message
        }`
      );
    }

    const totalPayables =
      payables?.reduce((sum, p) => sum + (p.balance_due || 0), 0) || 0;
    // Loans are stored as negative numbers, so sum them up.
    const totalLoans =
      loans?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

    // Total Liabilities is the money owed to suppliers + the money owed to banks
    const totalLiabilities = totalPayables + Math.abs(totalLoans);

    // EQUITY
    const totalEquity = totalAssets - totalLiabilities;

    return NextResponse.json({
      startDate,
      endDate,
      profitAndLoss: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        expensesByCategory,
        totalExpenses,
        netProfit,
      },
      balanceSheet: {
        assets: {
          totalCash,
          totalReceivables,
          totalInventory,
          totalAssets,
        },
        liabilities: {
          totalPayables,
          totalLoans: Math.abs(totalLoans), // Show as positive number
          totalLiabilities,
        },
        equity: {
          totalEquity,
        },
      },
    });
  } catch (error) {
    console.error("Error in financial report API:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
