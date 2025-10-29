// src/app/api/payments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all payments
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch payments with customer and order details
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        customers (
          name,
          phone
        ),
        orders (
          order_number,
          total_amount
        )
      `
      )
      .order("payment_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while fetching payments" },
      { status: 500 }
    );
  }
}

// POST - Create new payment
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      payment_number,
      order_id,
      customer_id,
      payment_date,
      amount,
      payment_method,
      reference_number,
      notes,
      cheque_number,
      cheque_date,
      cheque_status,
    } = body;

    // Validate required fields
    if (!payment_number || !customer_id || !amount || !payment_method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate cheque fields if payment method is cheque
    if (payment_method.toLowerCase() === "cheque") {
      if (!cheque_number || !cheque_date) {
        return NextResponse.json(
          { error: "Cheque number and date are required for cheque payments" },
          { status: 400 }
        );
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          payment_number,
          order_id: order_id || null,
          customer_id,
          payment_date: payment_date || new Date().toISOString().split("T")[0],
          amount,
          payment_method,
          reference_number: reference_number || null,
          notes: notes || null,
          // Note: If your database doesn't have these fields, they'll be ignored
          // You may need to add them to the payments table
          cheque_number: cheque_number || null,
          cheque_date: cheque_date || null,
          cheque_status: cheque_status || null,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    // If payment is linked to an order, update order payment status
    if (order_id) {
      // Get current order details
      const { data: order } = await supabase
        .from("orders")
        .select("total_amount, payment_status")
        .eq("id", order_id)
        .single();

      if (order) {
        // Get total payments for this order
        const { data: orderPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("order_id", order_id);

        const totalPaid =
          orderPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Determine new payment status
        let newPaymentStatus: "unpaid" | "partial" | "paid" = "unpaid";
        if (totalPaid >= order.total_amount) {
          newPaymentStatus = "paid";
        } else if (totalPaid > 0) {
          newPaymentStatus = "partial";
        }

        // Update order payment status
        await supabase
          .from("orders")
          .update({ payment_status: newPaymentStatus })
          .eq("id", order_id);

        // Update customer outstanding balance
        if (newPaymentStatus === "paid") {
          const { data: customer } = await supabase
            .from("customers")
            .select("outstanding_balance")
            .eq("id", customer_id)
            .single();

          if (customer) {
            const newBalance = Math.max(
              0,
              (customer.outstanding_balance || 0) - order.total_amount
            );
            await supabase
              .from("customers")
              .update({ outstanding_balance: newBalance })
              .eq("id", customer_id);
          }
        }
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error while creating payment" },
      { status: 500 }
    );
  }
}
