// src/app/api/analytics/product-performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // Filter by stock_status

    let query = supabase
      .from("v_product_performance")
      .select("*");

    if (status) {
      query = query.eq("stock_status", status);
    }

    query = query.limit(limit);

    const { data: products, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch product performance" },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const summary = {
      total_products: products?.length || 0,
      total_revenue: products?.reduce((sum, p) => sum + parseFloat(p.total_revenue || "0"), 0) || 0,
      total_profit: products?.reduce((sum, p) => sum + parseFloat(p.total_profit || "0"), 0) || 0,
      average_margin: products && products.length > 0
        ? products.reduce((sum, p) => sum + parseFloat(p.profit_margin || "0"), 0) / products.length
        : 0,
      out_of_stock: products?.filter(p => p.stock_status === "out_of_stock").length || 0,
      low_stock: products?.filter(p => p.stock_status === "low_stock").length || 0,
      overstocked: products?.filter(p => p.stock_status === "overstocked").length || 0,
    };

    return NextResponse.json({ products, summary });
  } catch (error) {
    console.error("Error fetching product performance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// src/app/api/analytics/customer-analytics/route.ts
// (Create this in a separate file following same pattern)