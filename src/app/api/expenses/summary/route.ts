// src/app/api/expenses/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build base query
    let query = supabase.from("expenses").select("*");

    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch expenses" },
        { status: 500 }
      );
    }

    // Calculate total expenses
    const total_expenses = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount.toString()),
      0
    );

    // Calculate by category
    const categoryMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const current = categoryMap.get(exp.category) || 0;
      categoryMap.set(
        exp.category,
        current + parseFloat(exp.amount.toString())
      );
    });

    const by_category = Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: total_expenses > 0 ? (total / total_expenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Calculate by month
    const monthMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const month = exp.expense_date.substring(0, 7); // YYYY-MM
      const current = monthMap.get(month) || 0;
      monthMap.set(month, current + parseFloat(exp.amount.toString()));
    });

    const by_month = Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate by payment method
    const paymentMethodMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const current = paymentMethodMap.get(exp.payment_method) || 0;
      paymentMethodMap.set(
        exp.payment_method,
        current + parseFloat(exp.amount.toString())
      );
    });

    const by_payment_method = Array.from(paymentMethodMap.entries()).map(
      ([method, total]) => ({ method, total })
    );

    return NextResponse.json({
      total_expenses,
      by_category,
      by_month,
      by_payment_method,
      expense_count: expenses.length,
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
