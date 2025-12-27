// src/app/api/payments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";

// GET all payments with company account details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Read filters from the URL
    const { searchParams } = new URL(request.url);
    const paymentMethod = searchParams.get("payment_method");
    const chequeStatus = searchParams.get("cheque_status");

    // Start building the query
    let query = supabase
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
        company_accounts!payments_deposit_account_id_fkey (
          account_name,
          account_type,
          banks (
            bank_code,
            bank_name
          )
        )
      `
      )
      .order("payment_date", { ascending: false });

    // Apply payment_method filter if provided
    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    // Apply cheque_status filter if provided
    if (chequeStatus) {
      query = query.eq("cheque_status", chequeStatus);
    }

    // Execute the final query
    const { data: payments, error } = await query;

    if (error) {
      console.error("Error fetching payments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For payments with bank_account_id (cheques), fetch the bank details separately
    const paymentsWithBankDetails = await Promise.all(
      payments.map(async (payment) => {
        if (payment.bank_account_id) {
          const { data: bank } = await supabase
            .from("banks")
            .select("bank_code, bank_name")
            .eq("id", payment.bank_account_id)
            .single();

          return {
            ...payment,
            banks: bank || null,
          };
        }
        return payment;
      })
    );

    return NextResponse.json(
      { payments: paymentsWithBankDetails },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/payments:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching payments" },
      { status: 500 }
    );
  }
}

// POST - Create new payment and update account balance
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
      deposit_account_id,
      reference_number,
      notes,
      cheque_number,
      cheque_date,
      cheque_status,
      bank_account_id, // UPDATED: Changed from bank_id to bank_account_id
    } = body;

    // Validate required fields
    if (!payment_number || !customer_id || !amount || !payment_method) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: payment_number, customer_id, amount, payment_method",
        },
        { status: 400 }
      );
    }

    // Validate deposit_account_id for cash and bank payments ONLY
    if (
      (payment_method === "cash" || payment_method === "bank") &&
      !deposit_account_id
    ) {
      return NextResponse.json(
        {
          error:
            "Deposit account is required for cash and bank transfer payments",
        },
        { status: 400 }
      );
    }

    // Validate cheque fields if payment method is cheque
    if (payment_method.toLowerCase() === "cheque") {
      // UPDATED: Check bank_account_id instead of bank_id
      if (!cheque_number || !cheque_date || !bank_account_id) {
        return NextResponse.json(
          {
            error:
              "Cheque number, date, and bank are required for cheque payments",
          },
          { status: 400 }
        );
      }
    }

    // If deposit_account_id is provided, verify it exists and get current balance
    let accountBalance = 0;
    if (deposit_account_id) {
      const { data: account, error: accountError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", deposit_account_id)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { error: "Invalid deposit account" },
          { status: 400 }
        );
      }

      accountBalance = account.current_balance;
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
          deposit_account_id: deposit_account_id || null,
          reference_number: reference_number || null,
          notes: notes || null,
          cheque_number: cheque_number || null,
          cheque_date: cheque_date || null,
          cheque_status: cheque_status || null,
          // UPDATED: Use bank_account_id
          bank_account_id: bank_account_id || null,
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

    // Update company account balance if deposit account is provided
    if (deposit_account_id) {
      const newBalance = accountBalance + parseFloat(amount);

      const { error: balanceUpdateError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newBalance })
        .eq("id", deposit_account_id);

      if (balanceUpdateError) {
        console.error("Error updating account balance:", balanceUpdateError);
        return NextResponse.json(
          {
            warning:
              "Payment created but failed to update account balance. Please update manually.",
            payment,
          },
          { status: 201 }
        );
      }
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
          const newOutstanding = Math.max(
            0,
            customer.outstanding_balance - parseFloat(amount)
          );
          await supabase
            .from("customers")
            .update({ outstanding_balance: newOutstanding })
            .eq("id", customer_id);
        }
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/payments:", error);
    return NextResponse.json(
      { error: "Internal server error while creating payment" },
      { status: 500 }
    );
  }
}
