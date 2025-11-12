// src/app/api/payments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all payments
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch payments joined with customers, orders, and BANK ACCOUNTS
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
        ),
        bank_accounts (
          account_name,
          account_type
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      customer_id,
      order_id,
      amount,
      payment_method,
      payment_date,
      bank_account_id, // <-- Correct field
      cheque_number,
      cheque_date,
      cheque_status,
      notes,
    } = body;

    // Validation
    if (!customer_id || !amount || !payment_method || !order_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If it's a bank deposit, we MUST have a bank_account_id
    if (
      (payment_method === "cheque" || payment_method === "bank_transfer") &&
      !bank_account_id
    ) {
      return NextResponse.json(
        { error: "Please select an account to deposit to." },
        { status: 400 }
      );
    }

    // 1. Generate payment number
    const payment_number = `PAY-${Date.now()}`;

    // 2. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          payment_number,
          order_id,
          customer_id,
          payment_date: payment_date || new Date().toISOString().split("T")[0],
          amount,
          payment_method,
          notes: notes || null,
          cheque_number: cheque_number || null,
          cheque_date: cheque_date || null,
          cheque_status: cheque_status || null,
          bank_account_id: bank_account_id || null, // <-- Save correct field
          created_by: user.id,
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

    // 3. Update Order Status and Customer Balance
    if (order_id) {
      // Get current order details
      const { data: order } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("id", order_id)
        .single();

      if (order) {
        // Get all successful payments for this order
        const { data: orderPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("order_id", order_id)
          .neq("cheque_status", "returned"); // Don't count returned cheques

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
        const { data: customer } = await supabase
          .from("customers")
          .select("outstanding_balance")
          .eq("id", customer_id)
          .single();

        if (customer) {
          const newBalance = Math.max(0, customer.outstanding_balance - amount);
          await supabase
            .from("customers")
            .update({ outstanding_balance: newBalance })
            .eq("id", customer_id);
        }
      }
    }

    // 4. NEW: Update the bank account balance
    // We only increase balance if it's not a cheque (as cheques are 'pending')
    if (bank_account_id && payment_method !== "cheque") {
      try {
        const { data: account, error: accError } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", bank_account_id)
          .single();

        if (accError || !account) throw new Error("Bank account not found.");

        const newBankBalance = account.current_balance + parseFloat(amount);
        await supabase
          .from("bank_accounts")
          .update({ current_balance: newBankBalance })
          .eq("id", bank_account_id);
      } catch (e) {
        console.error("Failed to update bank balance:", (e as Error).message);
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
