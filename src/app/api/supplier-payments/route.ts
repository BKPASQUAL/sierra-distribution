// src/app/api/supplier-payments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Create a new payment to a supplier
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Create the supplier payment record
    const paymentPayload = {
      ...body,
      created_by: user.id,
      payment_number: `SPAY-${Date.now()}`,
    };

    const { data: payment, error: paymentError } = await supabase
      .from("supplier_payments")
      .insert(paymentPayload)
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    // 2. If linked to a purchase, update the purchase record
    if (body.purchase_id) {
      // Get the purchase
      const { data: purchase, error: fetchError } = await supabase
        .from("purchases")
        //
        // --- THIS IS THE FIX ---
        // We must select 'payment_status' to use it below
        //
        .select("total_amount, amount_paid, payment_status") // <-- ERROR WAS HERE
        .eq("id", body.purchase_id)
        .single();

      if (fetchError || !purchase) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      // Calculate new paid amount
      const newAmountPaid = (purchase.amount_paid || 0) + body.amount;
      const newBalanceDue = purchase.total_amount - newAmountPaid;

      let newPaymentStatus = purchase.payment_status; // <-- This line now works
      if (newBalanceDue <= 0) {
        newPaymentStatus = "paid";
      } else {
        newPaymentStatus = "partial";
      }

      // Update the purchase
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          payment_status: newPaymentStatus,
        })
        .eq("id", body.purchase_id);

      if (updateError) {
        // Log error but don't fail payment
        console.error("Failed to update purchase status:", updateError.message);
      }
    }

    // 3. (Optional) Update the bank account balance
    if (body.bank_account_id) {
      try {
        // This is a simple update. A real system would use a transaction.
        const { data: account } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", body.bank_account_id)
          .single();
        if (account) {
          await supabase
            .from("bank_accounts")
            .update({
              current_balance: account.current_balance - body.amount,
            })
            .eq("id", body.bank_account_id);
        }
      } catch (e) {
        console.error("Failed to update bank balance:", e);
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
