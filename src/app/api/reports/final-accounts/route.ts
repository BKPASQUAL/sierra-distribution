// src/app/api/reports/final-accounts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    // 1. Get Revenue and COGS from Orders
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, order_items(quantity, cost_price)")
      .gte("order_date", startDate)
      .lte("order_date", endDate);

    if (orderError) throw orderError;

    let totalRevenue = 0;
    let totalCOGS = 0;
    orders.forEach(order => {
      totalRevenue += order.total_amount;
      order.order_items.forEach(item => {
        totalCOGS += (item.quantity * (item.cost_price || 0));
      });
    });

    const grossProfit = totalRevenue - totalCOGS;

    // 2. Get Expenses
    const { data: expenses, error: expenseError } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);
    
    if (expenseError) throw expenseError;

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 3. Calculate P&L
    const netProfit = grossProfit - totalExpenses;

    // --- You would add Balance Sheet calculations here ---

    return NextResponse.json({
      profitAndLoss: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
      },
      balanceSheet: {
        // Add your Balance Sheet data here
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}