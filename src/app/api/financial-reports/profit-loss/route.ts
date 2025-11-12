// src/app/api/financial-reports/profit-loss/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is Admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const grossProfit = Number(searchParams.get("grossProfit")) || 0;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // ============================================
    // FETCH PROFIT & LOSS DATA
    // ============================================

    // Fetch all expenses by category
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("category, amount")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    if (expensesError) {
      console.error("Expenses error:", expensesError);
      return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }

    // Group expenses by category
    const expensesByCategory = {
      fuel: 0,
      salaries: 0,
      rent: 0,
      utilities: 0,
      maintenance: 0,
      delivery: 0,
      marketing: 0,
      office_supplies: 0,
      telephone: 0,
      insurance: 0,
      repairs: 0,
      professional_fees: 0,
      bank_charges: 0,
      depreciation: 0,
      taxes: 0,
      miscellaneous: 0,
    };

    expenses?.forEach((exp) => {
      const category = exp.category as keyof typeof expensesByCategory;
      if (category in expensesByCategory) {
        expensesByCategory[category] += Number(exp.amount);
      }
    });

    // Calculate totals
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, val) => sum + val,
      0
    );

    // Calculate Net Profit
    const netProfit = grossProfit - totalExpenses;

    // Get net sales for margin calculation
    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount")
      .gte("order_date", startDate)
      .lte("order_date", endDate)
      .in("status", ["delivered", "confirmed", "processing", "shipped"]);

    const netSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    // Return Profit & Loss data
    const profitLossAccount = {
      grossProfit,
      expenses: expensesByCategory,
      totalExpenses,
      netProfit,
      netProfitMargin,
      netSales, // Include for reference
    };

    return NextResponse.json({
      success: true,
      data: profitLossAccount,
      period: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Profit & Loss API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}