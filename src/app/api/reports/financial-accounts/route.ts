// src/app/api/reports/financial-accounts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // ====================
    // 1. TRADING ACCOUNT
    // ====================

    // Get all orders with their items for the period
    let ordersQuery = supabase.from("orders").select(`
      id,
      order_number,
      order_date,
      total_amount,
      subtotal,
      discount_amount,
      tax_amount,
      payment_status,
      order_items (
        quantity,
        unit_price,
        cost_price,
        line_total,
        discount_percent
      )
    `);

    if (startDate) {
      ordersQuery = ordersQuery.gte("order_date", startDate);
    }
    if (endDate) {
      ordersQuery = ordersQuery.lte("order_date", endDate);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    // Calculate Trading Account metrics
    let salesRevenue = 0;
    let totalCOGS = 0;
    let totalDiscounts = 0;

    orders?.forEach((order) => {
      // Sales Revenue = Total Amount from all orders
      salesRevenue += order.total_amount || 0;
      totalDiscounts += order.discount_amount || 0;

      // COGS = Sum of (cost_price * quantity) for all items
      order.order_items?.forEach((item) => {
        totalCOGS += (item.cost_price || 0) * (item.quantity || 0);
      });
    });

    const grossProfit = salesRevenue - totalCOGS;
    const grossProfitMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;

    // ====================
    // 2. PROFIT & LOSS ACCOUNT
    // ====================

    // Get all expenses for the period
    let expensesQuery = supabase.from("expenses").select("*");

    if (startDate) {
      expensesQuery = expensesQuery.gte("expense_date", startDate);
    }
    if (endDate) {
      expensesQuery = expensesQuery.lte("expense_date", endDate);
    }

    const { data: expenses, error: expensesError } = await expensesQuery;

    if (expensesError) {
      return NextResponse.json({ error: expensesError.message }, { status: 500 });
    }

    // Calculate expenses by category
    const expensesByCategory = {
      fuel: 0,
      maintenance: 0,
      other: 0,
    };

    let totalExpenses = 0;

    expenses?.forEach((expense) => {
      totalExpenses += expense.amount || 0;

      if (expense.category === "fuel") {
        expensesByCategory.fuel += expense.amount || 0;
      } else if (expense.category === "maintenance") {
        expensesByCategory.maintenance += expense.amount || 0;
      } else {
        expensesByCategory.other += expense.amount || 0;
      }
    });

    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;

    // ====================
    // 3. BALANCE SHEET
    // ====================

    // ASSETS
    // 1. Cash & Bank Balance (we'll calculate from payments)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount, payment_method, cheque_status");

    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    let cashBalance = 0;
    let bankBalance = 0;
    let chequeBalance = 0;

    payments?.forEach((payment) => {
      // Exclude returned cheques
      if (payment.cheque_status === "returned") return;

      if (payment.payment_method === "cash") {
        cashBalance += payment.amount || 0;
      } else if (payment.payment_method === "bank_transfer") {
        bankBalance += payment.amount || 0;
      } else if (payment.payment_method === "cheque") {
        chequeBalance += payment.amount || 0;
      }
    });

    // 2. Accounts Receivable (Outstanding customer payments)
    const { data: unpaidOrders, error: unpaidError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        payment_status
      `)
      .in("payment_status", ["unpaid", "partial"]);

    if (unpaidError) {
      return NextResponse.json({ error: unpaidError.message }, { status: 500 });
    }

    const { data: allPayments, error: allPaymentsError } = await supabase
      .from("payments")
      .select("order_id, amount, cheque_status");

    if (allPaymentsError) {
      return NextResponse.json({ error: allPaymentsError.message }, { status: 500 });
    }

    let accountsReceivable = 0;
    let overdueCount = 0;

    if (unpaidOrders) {
      for (const order of unpaidOrders) {
        const orderPayments = allPayments?.filter(
          (p) => p.order_id === order.id && p.cheque_status !== "returned"
        ) || [];

        const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = order.total_amount - totalPaid;

        if (balance > 0) {
          accountsReceivable += balance;
          overdueCount++;
        }
      }
    }

    // 3. Inventory Value (Stock at cost price)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("stock_quantity, cost_price, mrp");

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    let inventoryValueAtCost = 0;
    let inventoryValueAtMRP = 0;

    products?.forEach((product) => {
      const stock = product.stock_quantity || 0;
      const cost = product.cost_price || 0;
      const mrp = product.mrp || 0;

      inventoryValueAtCost += stock * cost;
      inventoryValueAtMRP += stock * mrp;
    });

    // Total Current Assets
    const totalCurrentAssets =
      cashBalance +
      bankBalance +
      chequeBalance +
      accountsReceivable +
      inventoryValueAtCost;

    // LIABILITIES
    // 1. Accounts Payable (Outstanding supplier payments)
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("total_amount, payment_status");

    if (purchasesError) {
      return NextResponse.json({ error: purchasesError.message }, { status: 500 });
    }

    let accountsPayable = 0;

    purchases?.forEach((purchase) => {
      if (purchase.payment_status === "unpaid" || purchase.payment_status === "partial") {
        accountsPayable += purchase.total_amount || 0;
      }
    });

    // For now, we'll assume no loans. You can add a loans table later.
    const loans = 0;

    // Total Current Liabilities
    const totalCurrentLiabilities = accountsPayable + loans;

    // CAPITAL (Owner's Equity)
    // Capital = Total Assets - Total Liabilities
    const capital = totalCurrentAssets - totalCurrentLiabilities;

    // ====================
    // RESPONSE
    // ====================

    return NextResponse.json(
      {
        tradingAccount: {
          salesRevenue,
          costOfGoodsSold: totalCOGS,
          grossProfit,
          grossProfitMargin,
          totalDiscounts,
          totalOrders: orders?.length || 0,
        },
        profitAndLoss: {
          grossProfit,
          expenses: {
            fuel: expensesByCategory.fuel,
            maintenance: expensesByCategory.maintenance,
            other: expensesByCategory.other,
            total: totalExpenses,
          },
          netProfit,
          netProfitMargin,
          expenseRatio: salesRevenue > 0 ? (totalExpenses / salesRevenue) * 100 : 0,
        },
        balanceSheet: {
          assets: {
            currentAssets: {
              cash: cashBalance,
              bank: bankBalance,
              cheques: chequeBalance,
              accountsReceivable: {
                amount: accountsReceivable,
                invoiceCount: overdueCount,
              },
              inventory: {
                atCost: inventoryValueAtCost,
                atMRP: inventoryValueAtMRP,
              },
              total: totalCurrentAssets,
            },
            fixedAssets: 0, // Can be added later if needed
            totalAssets: totalCurrentAssets,
          },
          liabilities: {
            currentLiabilities: {
              accountsPayable,
              loans,
              total: totalCurrentLiabilities,
            },
            longTermLiabilities: 0, // Can be added later
            totalLiabilities: totalCurrentLiabilities,
          },
          capital: {
            ownersEquity: capital,
            retainedEarnings: netProfit, // Current period profit
            totalCapital: capital,
          },
        },
        summary: {
          period: {
            startDate: startDate || "All time",
            endDate: endDate || "Present",
          },
          keyMetrics: {
            revenue: salesRevenue,
            cogs: totalCOGS,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            grossMargin: grossProfitMargin,
            netMargin: netProfitMargin,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating financial accounts:", error);
    return NextResponse.json(
      { error: "Internal server error while generating financial accounts" },
      { status: 500 }
    );
  }
}
