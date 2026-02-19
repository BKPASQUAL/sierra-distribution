// src/app/api/orders/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET single order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // Type as Promise
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // Await params

    // Fetch order with customer details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          phone,
          email,
          address,
          city
        )
      `,
      )
      .eq("id", id)
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        *,
        products (
          id,
          name,
          unit_of_measure
        )
      `,
      )
      .eq("order_id", id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("order_id", id)
      .neq("cheque_status", "returned");

    const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Transform data
    const transformedOrder = {
      id: order.id,
      billNo: order.order_number,
      customerName: order.customers?.name || "N/A",
      customerContact: order.customers?.phone || "N/A",
      customerEmail: order.customers?.email || null,
      customerAddress: order.customers?.address || null,
      customerCity: order.customers?.city || null,
      date: order.order_date,
      deliveryDate: order.delivery_date,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentType: order.payment_method || "N/A",
      items: orderItems.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || "Unknown Product",
        quantity: item.quantity,
        unit: item.products?.unit_of_measure || "unit",
        unitPrice: item.unit_price, // Stores the GROSS price from DB
        discount: item.discount_percent || 0,
        tax: item.tax_percent || 0,
        total: item.line_total, // DB calculated total
      })),
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      total: order.total_amount,
      paidAmount: paidAmount,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return NextResponse.json({ order: transformedOrder }, { status: 200 });
  } catch (error) {
    console.error("GET Order Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update order
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // Type as Promise
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // Await params
    const body = await request.json();

    if (body.items && Array.isArray(body.items)) {
      // 1. Fetch current items to reverse stock
      const { data: oldItems, error: oldItemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (oldItemsError) throw new Error(oldItemsError.message);

      // 2. Revert Stock
      for (const item of oldItems) {
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
      }

      // 3. Delete old items
      await supabase.from("order_items").delete().eq("order_id", id);

      // 4. Process NEW items
      const newItemsData = [];

      for (const item of body.items) {
        const { data: product } = await supabase
          .from("products")
          .select("id, cost_price, stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (!product) throw new Error(`Product not found: ${item.product_id}`);

        // Stock Deduct
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq("id", item.product_id);

        // --- PRICE CALCULATION FIX ---
        // Frontend sends: unit_price (Net/Final) and discount_percent.
        // Database calculates: line_total = unit_price * quantity * (1 - discount/100)
        // To make the math work, we must store the GROSS price as 'unit_price' in the DB.

        let dbUnitPrice = item.unit_price;
        const discount = item.discount_percent || 0;

        if (discount > 0 && discount < 100) {
          // Reverse calculate Gross Price: Net / (1 - Disc%)
          dbUnitPrice = item.unit_price / (1 - discount / 100);
        }

        newItemsData.push({
          order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: dbUnitPrice, // Save Gross Price
          cost_price: product.cost_price || 0,
          discount_percent: discount,
          // REMOVED line_total to let DB generate it
        });

        // Log Sale
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          transaction_type: "sale",
          quantity: -item.quantity,
          reference_id: id,
          reference_type: "order",
          notes: `Sale - Order Edit ${id}`,
        });
      }

      // 5. Insert New Items
      const { error: insertError } = await supabase
        .from("order_items")
        .insert(newItemsData);
      if (insertError) throw new Error(insertError.message);

      // 6. Update Order Details
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          order_number: body.order_number,
          customer_id: body.customer_id,
          order_date: body.order_date,
          subtotal: body.subtotal,
          discount_amount: body.discount_amount,
          total_amount: body.total_amount,
          payment_method: body.payment_method,
          payment_status: body.payment_status,
          notes: body.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      return NextResponse.json(
        { order: updatedOrder, message: "Order updated successfully" },
        { status: 200 },
      );
    } else {
      // Legacy status update
      const allowedUpdates: any = {};
      if (body.status) allowedUpdates.status = body.status;
      if (body.payment_status)
        allowedUpdates.payment_status = body.payment_status;

      const { data: order, error } = await supabase
        .from("orders")
        .update(allowedUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ order }, { status: 200 });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 },
    );
  }
}
