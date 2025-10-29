// src/app/api/orders/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Create new order/bill
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      order_number,
      customer_id,
      order_date,
      items,
      subtotal,
      discount_amount,
      total_amount,
      payment_method,
      paid_amount,
      notes,
    } = body;

    // Calculate payment status
    let payment_status: "unpaid" | "partial" | "paid" = "unpaid";
    if (paid_amount >= total_amount) {
      payment_status = "paid";
    } else if (paid_amount > 0) {
      payment_status = "partial";
    }

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number,
          customer_id,
          order_date,
          status: "confirmed",
          subtotal,
          tax_amount: 0,
          discount_amount,
          total_amount,
          payment_status,
          payment_method,
          notes,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 2. Process each order item
    let totalProfit = 0;
    const orderItemsData = [];
    const inventoryTransactions = [];
    const stockUpdates = [];

    for (const item of items) {
      // Get product details including cost_price
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, cost_price, stock_quantity, unit_price")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError);
        // Rollback: delete the order
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          {
            error: `Failed to fetch product details: ${productError?.message}`,
          },
          { status: 500 }
        );
      }

      // Check stock availability
      if (product.stock_quantity < item.quantity) {
        // Rollback: delete the order
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          {
            error: `Insufficient stock for product. Available: ${product.stock_quantity}, Required: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      // Calculate profit for this item
      const costPrice = product.cost_price || 0;
      const itemProfit = (item.unit_price - costPrice) * item.quantity;
      totalProfit += itemProfit;

      // Prepare order item data WITH cost_price
      orderItemsData.push({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: costPrice, // ← CRITICAL: Save cost_price for profit tracking
        discount_percent: item.discount_percent || 0,
        tax_percent: 0,
      });

      // Prepare inventory transaction
      inventoryTransactions.push({
        product_id: item.product_id,
        transaction_type: "sale",
        quantity: -item.quantity, // Negative because it's a sale
        reference_id: order.id,
        reference_type: "order",
        notes: `Sale - Order ${order_number}`,
      });

      // Prepare stock update
      const newStockQuantity = product.stock_quantity - item.quantity;
      stockUpdates.push({
        id: product.id,
        new_quantity: newStockQuantity,
      });
    }

    // 3. Insert order items
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 4. Create inventory transactions
    const { error: transactionsError } = await supabase
      .from("inventory_transactions")
      .insert(inventoryTransactions);

    if (transactionsError) {
      console.error(
        "Error creating inventory transactions:",
        transactionsError
      );
      // Continue anyway - transactions are for tracking only
    }

    // 5. Update product stock quantities
    for (const update of stockUpdates) {
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock_quantity: update.new_quantity })
        .eq("id", update.id);

      if (stockError) {
        console.error("Error updating stock:", stockError);
        return NextResponse.json(
          { error: "Failed to update stock" },
          { status: 500 }
        );
      }
    }

    // 6. If there's a payment, create payment record
    if (paid_amount > 0) {
      const payment_number = `PAY-${Date.now()}`;

      const { error: paymentError } = await supabase.from("payments").insert([
        {
          payment_number,
          order_id: order.id,
          customer_id,
          payment_date: order_date,
          amount: paid_amount,
          payment_method,
          notes: `Payment for order ${order_number}`,
        },
      ]);

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        // Continue anyway - order is created successfully
      }
    }

    // 7. Update customer outstanding balance if not fully paid
    if (payment_status !== "paid") {
      const outstanding = total_amount - paid_amount;

      const { data: customer } = await supabase
        .from("customers")
        .select("outstanding_balance")
        .eq("id", customer_id)
        .single();

      if (customer) {
        const newBalance = (customer.outstanding_balance || 0) + outstanding;

        await supabase
          .from("customers")
          .update({ outstanding_balance: newBalance })
          .eq("id", customer_id);
      }
    }

    return NextResponse.json(
      {
        order,
        profit: totalProfit,
        message: "Order created successfully, stock updated",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error while creating order" },
      { status: 500 }
    );
  }
}

// GET all orders with items and cost_price
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          cost_price,
          discount_percent,
          tax_percent,
          line_total,
          products (
            id,
            name,
            description,
            sku,
            unit_price,
            cost_price,
            category,
            unit_of_measure
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/orders:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching orders" },
      { status: 500 }
    );
  }
}
