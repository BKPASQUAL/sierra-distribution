// src/app/api/orders/unpaid/by-customer/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

// GET unpaid and partially paid orders for a specific customer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId) {
      return NextResponse.json(
        { error: "customer_id query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch orders with unpaid or partial payment status for this customer
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        customer_id,
        order_date,
        total_amount,
        payment_status,
        customers (
          name,
          phone
        )
      `
      )
      .eq("customer_id", customerId)
      .in("payment_status", ["unpaid", "partial"])
      .order("order_date", { ascending: false });

    if (ordersError) {
      console.error("Error fetching unpaid orders by customer:", ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    // Fetch all payments for these orders (excluding returned cheques)
    const orderIds = orders.map((o) => o.id);
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("order_id, amount, cheque_status")
      .in("order_id", orderIds);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return NextResponse.json(
        { error: paymentsError.message },
        { status: 500 }
      );
    }

    // Calculate balance for each order
    const ordersWithBalance = orders.map((order) => {
      const orderPayments =
        payments?.filter(
          (p) => p.order_id === order.id && p.cheque_status !== "returned"
        ) || [];

      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = order.total_amount - totalPaid;

      return {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: (order.customers as any)?.name || "N/A",
        order_date: order.order_date,
        total_amount: order.total_amount,
        paid_amount: totalPaid,
        balance: balance,
      };
    });

    // Only return orders with balance > 0
    const ordersWithPendingBalance = ordersWithBalance.filter(
      (order) => order.balance > 0
    );

    return NextResponse.json(
      { orders: ordersWithPendingBalance },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/orders/unpaid/by-customer:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching unpaid orders" },
      { status: 500 }
    );
  }
}
