// src/app/api/reports/expenses/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const groupBy = searchParams.get("group_by") || "category"; // category, month, user

    // Base query
    let query = supabase.from("expenses").select(`
        *,
        users:created_by (
          name,
          email
        )
      `);

    // Apply date filters
    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary statistics
    const summary = {
      totalExpenses: expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0,
      expenseCount: expenses?.length || 0,
      averageExpense: expenses?.length
        ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length
        : 0,
      byCategory: {
        fuel: {
          total:
            expenses
              ?.filter((e) => e.category === "fuel")
              .reduce((sum, exp) => sum + exp.amount, 0) || 0,
          count: expenses?.filter((e) => e.category === "fuel").length || 0,
        },
        maintenance: {
          total:
            expenses
              ?.filter((e) => e.category === "maintenance")
              .reduce((sum, exp) => sum + exp.amount, 0) || 0,
          count:
            expenses?.filter((e) => e.category === "maintenance").length || 0,
        },
        other: {
          total:
            expenses
              ?.filter((e) => e.category === "other")
              .reduce((sum, exp) => sum + exp.amount, 0) || 0,
          count: expenses?.filter((e) => e.category === "other").length || 0,
        },
      },
      byPaymentMethod: {} as Record<string, { total: number; count: number }>,
      byMonth: {} as Record<string, { total: number; count: number }>,
      byUser: {} as Record<
        string,
        { total: number; count: number; userName: string }
      >,
    };

    // Group by payment method
    expenses?.forEach((exp) => {
      const method = exp.payment_method;
      if (!summary.byPaymentMethod[method]) {
        summary.byPaymentMethod[method] = { total: 0, count: 0 };
      }
      summary.byPaymentMethod[method].total += exp.amount;
      summary.byPaymentMethod[method].count += 1;
    });

    // Group by month
    expenses?.forEach((exp) => {
      const month = exp.expense_date.substring(0, 7); // YYYY-MM
      if (!summary.byMonth[month]) {
        summary.byMonth[month] = { total: 0, count: 0 };
      }
      summary.byMonth[month].total += exp.amount;
      summary.byMonth[month].count += 1;
    });

    // Group by user
    expenses?.forEach((exp) => {
      const userId = exp.created_by;
      const userName = exp.users?.name || "Unknown";
      if (!summary.byUser[userId]) {
        summary.byUser[userId] = { total: 0, count: 0, userName };
      }
      summary.byUser[userId].total += exp.amount;
      summary.byUser[userId].count += 1;
    });

    // Top vendors
    const vendorMap = new Map<string, number>();
    expenses?.forEach((exp) => {
      if (exp.vendor_name) {
        vendorMap.set(
          exp.vendor_name,
          (vendorMap.get(exp.vendor_name) || 0) + exp.amount
        );
      }
    });
    const topVendors = Array.from(vendorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([vendor, total]) => ({ vendor, total }));

    return NextResponse.json(
      {
        summary,
        expenses,
        topVendors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating expense report:", error);
    return NextResponse.json(
      { error: "Internal server error while generating expense report" },
      { status: 500 }
    );
  }
}
