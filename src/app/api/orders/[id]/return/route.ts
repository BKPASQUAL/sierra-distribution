// src/app/api/orders/[id]/return/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/orders/:id/return
 *
 * Body:
 *   { action: "partial_return", items: [{ order_item_id, return_qty }] }
 *   { action: "cancel" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;
    const body = await request.json();
    const { action, items } = body as {
      action: "partial_return" | "cancel";
      items?: { order_item_id: string; return_qty: number }[];
    };

    // ── 1. Fetch the order ────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, total_amount, subtotal, discount_amount, payment_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { error: "Cannot return/cancel a fully paid order. Please handle refund separately." },
        { status: 400 }
      );
    }

    // ── 2. Fetch all order items ──────────────────────────────────────────
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_id, quantity, unit_price, discount_percent, line_total")
      .eq("order_id", orderId);

    if (itemsError || !orderItems) {
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    // ── FULL CANCEL ───────────────────────────────────────────────────────
    if (action === "cancel") {
      // Restore all stock
      for (const item of orderItems) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity + item.quantity })
            .eq("id", item.product_id);
        }

        // Log inventory return
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          transaction_type: "return",
          quantity: item.quantity,
          reference_id: orderId,
          reference_type: "order",
          notes: `Full cancel - Order ${order.order_number}`,
        });
      }

      // Reduce customer outstanding balance by the unpaid portion
      const { data: existingPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("order_id", orderId)
        .neq("cheque_status", "returned");

      const paidAmount = existingPayments?.reduce((s, p) => s + p.amount, 0) ?? 0;
      const unpaidAmount = order.total_amount - paidAmount;

      if (unpaidAmount > 0) {
        const { data: customer } = await supabase
          .from("customers")
          .select("outstanding_balance")
          .eq("id", order.customer_id)
          .single();

        if (customer) {
          const newBalance = Math.max(0, (customer.outstanding_balance ?? 0) - unpaidAmount);
          await supabase
            .from("customers")
            .update({ outstanding_balance: newBalance })
            .eq("id", order.customer_id);
        }
      }

      // Mark order as cancelled
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "unpaid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      return NextResponse.json({ message: "Order cancelled and stock restored" }, { status: 200 });
    }

    // ── PARTIAL RETURN ────────────────────────────────────────────────────
    if (action === "partial_return") {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "No items provided for return" }, { status: 400 });
      }

      let totalReturnValue = 0;

      for (const returnItem of items) {
        if (!returnItem.return_qty || returnItem.return_qty <= 0) continue;

        const orderItem = orderItems.find((i) => i.id === returnItem.order_item_id);
        if (!orderItem) continue;

        const returnQty = Math.min(returnItem.return_qty, orderItem.quantity);

        // Restore stock
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", orderItem.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity + returnQty })
            .eq("id", orderItem.product_id);
        }

        // Log return
        await supabase.from("inventory_transactions").insert({
          product_id: orderItem.product_id,
          transaction_type: "return",
          quantity: returnQty,
          reference_id: orderId,
          reference_type: "order",
          notes: `Partial return - Order ${order.order_number}`,
        });

        // Calculate return value (pro-rated from line_total)
        const unitLineValue = orderItem.line_total / orderItem.quantity;
        const returnValue = unitLineValue * returnQty;
        totalReturnValue += returnValue;

        const remaining = orderItem.quantity - returnQty;
        if (remaining <= 0) {
          // Delete item entirely
          await supabase.from("order_items").delete().eq("id", orderItem.id);
        } else {
          // Reduce quantity; DB trigger recalculates line_total
          const newLineTotal = unitLineValue * remaining;
          await supabase
            .from("order_items")
            .update({
              quantity: remaining,
              line_total: newLineTotal,
            })
            .eq("id", orderItem.id);
        }
      }

      // Recalculate order totals
      const { data: updatedItems } = await supabase
        .from("order_items")
        .select("line_total")
        .eq("order_id", orderId);

      const newSubtotal = updatedItems?.reduce((s, i) => s + (i.line_total ?? 0), 0) ?? 0;
      const discountFraction =
        order.subtotal > 0 ? order.discount_amount / order.subtotal : 0;
      const newDiscount = newSubtotal * discountFraction;
      const newTotal = newSubtotal - newDiscount;

      // Recalculate payment_status
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("order_id", orderId)
        .neq("cheque_status", "returned");

      const paidAmount = payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
      let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (paidAmount >= newTotal) paymentStatus = "paid";
      else if (paidAmount > 0) paymentStatus = "partial";

      // Update order
      await supabase
        .from("orders")
        .update({
          subtotal: newSubtotal,
          discount_amount: newDiscount,
          total_amount: newTotal,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Reduce customer outstanding balance by returned unpaid portion
      const unpaidReturnCredit = Math.max(0, totalReturnValue - Math.max(0, paidAmount - (order.total_amount - totalReturnValue)));
      if (unpaidReturnCredit > 0) {
        const { data: customer } = await supabase
          .from("customers")
          .select("outstanding_balance")
          .eq("id", order.customer_id)
          .single();

        if (customer) {
          const newBalance = Math.max(0, (customer.outstanding_balance ?? 0) - unpaidReturnCredit);
          await supabase
            .from("customers")
            .update({ outstanding_balance: newBalance })
            .eq("id", order.customer_id);
        }
      }

      return NextResponse.json(
        {
          message: "Items returned successfully",
          returnValue: totalReturnValue,
          newTotal,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Return/Cancel error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
