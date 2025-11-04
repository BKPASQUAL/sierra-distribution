// src/app/api/products/[id]/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;

    // Fetch all transactions for this product
    const { data: transactions, error } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", details: error.message },
        { status: 500 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    // Get unique order IDs and purchase IDs
    const orderIds = transactions
      .filter((t) => t.transaction_type === "sale" && t.reference_id)
      .map((t) => t.reference_id);

    const purchaseIds = transactions
      .filter((t) => t.transaction_type === "purchase" && t.reference_id)
      .map((t) => t.reference_id);

    // Fetch related orders with customer data
    let ordersMap = new Map();
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          order_date,
          customer:customers(name)
        `
        )
        .in("id", orderIds);

      if (orders) {
        orders.forEach((order: any) => {
          ordersMap.set(order.id, {
            order_number: order.order_number,
            order_date: order.order_date,
            customer: {
              name: order.customer?.name || "Unknown Customer",
            },
          });
        });
      }
    }

    // Fetch related purchases
    let purchasesMap = new Map();
    if (purchaseIds.length > 0) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, purchase_id, purchase_date")
        .in("id", purchaseIds);

      if (purchases) {
        purchases.forEach((purchase: any) => {
          purchasesMap.set(purchase.id, {
            purchase_id: purchase.purchase_id,
            purchase_date: purchase.purchase_date,
          });
        });
      }
    }

    // Filter to show ONLY ONE transaction per order
    // Prefer the one with notes, otherwise take the first one
    const uniqueTransactions = new Map();

    transactions.forEach((t: any) => {
      // Create a unique key for grouping
      const groupKey =
        t.reference_id &&
        (t.transaction_type === "sale" || t.transaction_type === "purchase")
          ? t.reference_id
          : t.id;

      if (uniqueTransactions.has(groupKey)) {
        // If this order already exists, only replace if current one has notes and existing doesn't
        const existing = uniqueTransactions.get(groupKey);
        if (t.notes && !existing.notes) {
          // Replace with the one that has notes
          uniqueTransactions.set(groupKey, t);
        }
        // Otherwise ignore this duplicate
      } else {
        // First occurrence of this order - add it
        uniqueTransactions.set(groupKey, t);
      }
    });

    // Format the response with order/purchase data
    const formattedTransactions = Array.from(uniqueTransactions.values()).map(
      (t: any) => {
        // Get order data if it's a sale transaction
        const orderData =
          t.transaction_type === "sale" && t.reference_id
            ? ordersMap.get(t.reference_id) || null
            : null;

        // Get purchase data if it's a purchase transaction
        const purchaseData =
          t.transaction_type === "purchase" && t.reference_id
            ? purchasesMap.get(t.reference_id) || null
            : null;

        return {
          id: t.id,
          product_id: t.product_id,
          transaction_type: t.transaction_type,
          quantity: t.quantity,
          reference_id: t.reference_id,
          reference_type: t.reference_type,
          notes: t.notes,
          created_at: t.created_at,
          created_by: t.created_by,
          order: orderData,
          purchase: purchaseData,
        };
      }
    );

    return NextResponse.json(
      { transactions: formattedTransactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Create new transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.transaction_type || !body.quantity) {
      return NextResponse.json(
        { error: "transaction_type and quantity are required" },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = ["purchase", "sale", "adjustment", "return"];
    if (!validTypes.includes(body.transaction_type)) {
      return NextResponse.json(
        {
          error:
            "Invalid transaction_type. Must be: purchase, sale, adjustment, or return",
        },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create transaction
    const { data: transaction, error } = await supabase
      .from("inventory_transactions")
      .insert({
        product_id: id,
        transaction_type: body.transaction_type,
        quantity: body.quantity,
        reference_id: body.reference_id || null,
        reference_type: body.reference_type || null,
        notes: body.notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create transaction", details: error.message },
        { status: 500 }
      );
    }

    // Update product stock quantity
    const { error: updateError } = await supabase.rpc("update_product_stock", {
      p_product_id: id,
      p_quantity_change: body.quantity,
    });

    if (updateError) {
      console.error("Failed to update stock:", updateError);
      // Transaction created but stock update failed
      // You might want to handle this differently
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
