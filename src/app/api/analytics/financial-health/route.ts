// src/app/api/analytics/financial-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get data from the financial health view
    const { data: healthData, error } = await supabase
      .from("v_financial_health")
      .select("*")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch financial health data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ financial_health: healthData });
  } catch (error) {
    console.error("Error fetching financial health:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}