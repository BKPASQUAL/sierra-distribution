// src/app/api/financial-reports/trading-account/route.ts
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

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // ============================================
    // FETCH TRADING ACCOUNT DATA
    // ============================================

    // 1. Fetch Sales Revenue (from orders)
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount, status")
      .gte("order_date", startDate)
      .lte("order_date", endDate)
      .in("status", ["delivered", "confirmed", "processing", "shipped"]);

    if (ordersError) {
      console.error("Orders error:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

    // 2. Fetch Purchases (from purchases table)
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("total_amount")
      .gte("purchase_date", startDate)
      .lte("purchase_date", endDate);

    if (purchasesError) {
      console.error("Purchases error:", purchasesError);
      return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }

    const totalPurchases = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    // 3. Get Opening Stock (at start date)
    // Note: This is a simplified version. For accurate opening stock, you'd need
    // to calculate inventory at the specific start date considering all transactions
    const { data: productsAtStart, error: productsStartError } = await supabase
      .from("products")
      .select("stock_quantity, cost_price");

    if (productsStartError) {
      console.error("Products start error:", productsStartError);
      return NextResponse.json({ error: "Failed to fetch opening stock" }, { status: 500 });
    }

    // For more accurate opening stock, you should track inventory_transactions
    // and calculate stock at the start date
    const openingStock = productsAtStart?.reduce(
      (sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price),
      0
    ) || 0;

    // 4. Get Closing Stock (current inventory)
    const { data: productsNow, error: productsNowError } = await supabase
      .from("products")
      .select("stock_quantity, cost_price");

    if (productsNowError) {
      console.error("Products now error:", productsNowError);
      return NextResponse.json({ error: "Failed to fetch closing stock" }, { status: 500 });
    }

    const closingStock = productsNow?.reduce(
      (sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price),
      0
    ) || 0;

    // 5. Calculate Trading Account Values
    const salesReturns = 0; // Add if you track returns
    const netSales = totalSales - salesReturns;
    const purchaseReturns = 0; // Add if you track returns
    const netPurchases = totalPurchases - purchaseReturns;
    const costOfGoodsAvailable = openingStock + netPurchases;
    const costOfGoodsSold = costOfGoodsAvailable - closingStock;
    const grossProfit = netSales - costOfGoodsSold;
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Return Trading Account data
    const tradingAccount = {
      totalSales,
      salesReturns,
      netSales,
      openingStock,
      purchases: totalPurchases,
      purchaseReturns,
      netPurchases,
      costOfGoodsAvailable,
      closingStock,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin,
    };

    return NextResponse.json({
      success: true,
      data: tradingAccount,
      period: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Trading account API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}