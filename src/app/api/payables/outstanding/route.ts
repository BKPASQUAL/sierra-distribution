// src/app/api/payables/outstanding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch outstanding payables
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const supplier_id = searchParams.get("supplier_id");
    const urgency = searchParams.get("urgency");

    // Use the view created in migration
    let query = supabase
      .from("v_outstanding_payables")
      .select("*")
      .order("days_overdue", { ascending: false });

    if (supplier_id) {
      query = query.eq("supplier_id", supplier_id);
    }

    if (urgency) {
      query = query.eq("urgency", urgency);
    }

    const { data: payables, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch outstanding payables" },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const total_outstanding = payables?.reduce(
      (sum, p) => sum + parseFloat(p.balance_due || "0"),
      0
    ) || 0;

    const current = payables?.filter(p => p.days_overdue === 0)
      .reduce((sum, p) => sum + parseFloat(p.balance_due || "0"), 0) || 0;

    const overdue_30 = payables?.filter(p => p.days_overdue > 0 && p.days_overdue <= 30)
      .reduce((sum, p) => sum + parseFloat(p.balance_due || "0"), 0) || 0;

    const overdue_60 = payables?.filter(p => p.days_overdue > 30 && p.days_overdue <= 60)
      .reduce((sum, p) => sum + parseFloat(p.balance_due || "0"), 0) || 0;

    const overdue_90_plus = payables?.filter(p => p.days_overdue > 60)
      .reduce((sum, p) => sum + parseFloat(p.balance_due || "0"), 0) || 0;

    const supplier_count = new Set(payables?.map(p => p.supplier_name)).size;

    const summary = {
      total_outstanding,
      current,
      overdue_30,
      overdue_60,
      overdue_90_plus,
      supplier_count,
      invoice_count: payables?.length || 0,
    };

    return NextResponse.json({ payables, summary });
  } catch (error) {
    console.error("Error fetching outstanding payables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}