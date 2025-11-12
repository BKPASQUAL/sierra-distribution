// src/app/api/budgets/vs-actual/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch budget vs actual comparison
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get("period"); // YYYY-MM
    const year = searchParams.get("year"); // YYYY
    const type = searchParams.get("type"); // sales, expenses, purchases

    // Use the view created in migration
    let query = supabase
      .from("v_budget_vs_actual")
      .select("*")
      .order("period", { ascending: false });

    if (period) {
      query = query.eq("period", period);
    }
    if (year) {
      query = query.like("period", `${year}%`);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data: comparisons, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch budget comparisons" },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      total_budgeted: comparisons?.reduce(
        (sum, c) => sum + parseFloat(c.budgeted_amount || "0"),
        0
      ) || 0,
      total_actual: comparisons?.reduce(
        (sum, c) => sum + parseFloat(c.actual_amount || "0"),
        0
      ) || 0,
      total_variance: comparisons?.reduce(
        (sum, c) => sum + parseFloat(c.variance || "0"),
        0
      ) || 0,
      favorable_count: comparisons?.filter(c => c.variance_status === "favorable").length || 0,
      unfavorable_count: comparisons?.filter(c => c.variance_status === "unfavorable").length || 0,
    };

    summary.variance_percent = summary.total_budgeted > 0
      ? (summary.total_variance / summary.total_budgeted) * 100
      : 0;

    summary.on_track_percent = comparisons && comparisons.length > 0
      ? (summary.favorable_count / comparisons.length) * 100
      : 0;

    return NextResponse.json({ comparisons, summary });
  } catch (error) {
    console.error("Error fetching budget comparisons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}