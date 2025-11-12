// src/app/api/financial-reports/balance-sheet/route.ts
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
    const endDate = searchParams.get("endDate");
    const netProfit = Number(searchParams.get("netProfit")) || 0;
    const closingStock = Number(searchParams.get("closingStock")) || 0;

    if (!endDate) {
      return NextResponse.json(
        { error: "endDate is required" },
        { status: 400 }
      );
    }

    // ============================================
    // FETCH BALANCE SHEET DATA
    // ============================================

    // CURRENT ASSETS

    // 1. Cash (from bank accounts with type 'cash')
    const { data: cashAccounts, error: cashError } = await supabase
      .from("bank_accounts")
      .select("current_balance")
      .eq("account_type", "cash")
      .eq("is_active", true);

    if (cashError) {
      console.error("Cash accounts error:", cashError);
    }

    const cash = cashAccounts?.reduce(
      (sum, acc) => sum + Number(acc.current_balance),
      0
    ) || 0;

    // 2. Bank Balances (current and savings accounts)
    const { data: bankAccounts, error: bankError } = await supabase
      .from("bank_accounts")
      .select("current_balance")
      .in("account_type", ["current", "savings"])
      .eq("is_active", true);

    if (bankError) {
      console.error("Bank accounts error:", bankError);
    }

    const bankBalances = bankAccounts?.reduce(
      (sum, acc) => sum + Number(acc.current_balance),
      0
    ) || 0;

    // 3. Accounts Receivable (outstanding customer payments)
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("outstanding_balance");

    if (customersError) {
      console.error("Customers error:", customersError);
    }

    const accountsReceivable = customers?.reduce(
      (sum, c) => sum + Number(c.outstanding_balance),
      0
    ) || 0;

    // 4. Inventory (use closingStock from parameter or fetch current)
    let inventory = closingStock;
    if (!closingStock) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("stock_quantity, cost_price");

      if (!productsError) {
        inventory = products?.reduce(
          (sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price),
          0
        ) || 0;
      }
    }

    const totalCurrentAssets = cash + bankBalances + accountsReceivable + inventory;

    // CURRENT LIABILITIES

    // 1. Accounts Payable (outstanding supplier payments)
    const { data: payables, error: payablesError } = await supabase
      .from("purchases")
      .select("balance_due")
      .neq("payment_status", "paid")
      .gt("balance_due", 0);

    if (payablesError) {
      console.error("Payables error:", payablesError);
    }

    const accountsPayable = payables?.reduce(
      (sum, p) => sum + Number(p.balance_due || 0),
      0
    ) || 0;

    // 2. Outstanding Expenses (if any unpaid expenses)
    const outstandingExpenses = 0; // Add if you track unpaid expenses

    const totalCurrentLiabilities = accountsPayable + outstandingExpenses;

    // CAPITAL

    // Opening Capital - should be stored in company settings or as a parameter
    // For now, using a fixed value that should be configured
    const openingCapital = 1000000; // TODO: Make this configurable

    // Drawings - should be tracked in a separate table
    const drawings = 0; // TODO: Implement capital_transactions table

    const closingCapital = openingCapital + netProfit - drawings;

    // FINANCIAL RATIOS

    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const currentRatio = totalCurrentLiabilities > 0 
      ? totalCurrentAssets / totalCurrentLiabilities 
      : 0;
    const quickRatio = totalCurrentLiabilities > 0 
      ? (totalCurrentAssets - inventory) / totalCurrentLiabilities 
      : 0;

    // Return Balance Sheet data
    const balanceSheet = {
      currentAssets: {
        cash,
        bankBalances,
        accountsReceivable,
        inventory,
        totalCurrentAssets,
      },
      currentLiabilities: {
        accountsPayable,
        outstandingExpenses,
        totalCurrentLiabilities,
      },
      capital: {
        openingCapital,
        netProfit,
        drawings,
        closingCapital,
      },
      workingCapital,
      currentRatio,
      quickRatio,
    };

    return NextResponse.json({
      success: true,
      data: balanceSheet,
      asAt: endDate,
    });
  } catch (error) {
    console.error("Balance Sheet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}