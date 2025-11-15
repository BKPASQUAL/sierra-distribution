// src/app/api/supplier-payments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all supplier payments
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("supplier_payments")
      .select(
        `
        *,
        company_accounts (
          id,
          account_name,
          account_type,
          banks (bank_code)
        ),
        purchases (
          purchase_id,
          suppliers (name)
        )
      `
      )
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ supplier_payments: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create a new supplier payment
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      purchase_id, // This is the UUID 'id' from the purchases table
      company_account_id,
      amount,
      payment_date,
      payment_method,
      cheque_number,
      cheque_date,
      notes,
    } = body;

    const parsedAmount = parseFloat(amount);

    if (
      !purchase_id ||
      !company_account_id ||
      !parsedAmount ||
      parsedAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid payment data." },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch the purchase to update its paid status
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("total_amount, amount_paid")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "Purchase not found." },
        { status: 404 }
      );
    }

    // --- NEW PAYMENT LOGIC ---
    // If method is 'cash' or 'bank_transfer', deduct from account NOW.
    // If 'cheque', DO NOT deduct yet.
    if (payment_method === "cash" || payment_method === "bank_transfer") {
      const { data: account, error: accountError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", company_account_id)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { error: "Company account not found." },
          { status: 404 }
        );
      }

      // This allows overdraft (negative balance)
      const newAccountBalance = account.current_balance - parsedAmount;
      const { error: balanceUpdateError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newAccountBalance })
        .eq("id", company_account_id);

      if (balanceUpdateError) {
        throw new Error(
          `Failed to update account balance: ${balanceUpdateError.message}`
        );
      }
    }

    // 2. Update Purchase Record Status (This happens for all payment types)
    const newAmountPaid = (purchase.amount_paid || 0) + parsedAmount;
    const newBalanceDue = purchase.total_amount - newAmountPaid;
    const newPaymentStatus = newBalanceDue <= 0 ? "paid" : "partial";

    const { error: purchaseUpdateError } = await supabase
      .from("purchases")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        payment_status: newPaymentStatus,
      })
      .eq("id", purchase_id);

    if (purchaseUpdateError) {
      // If purchase update fails, we must roll back the account balance if it was deducted
      if (payment_method === "cash" || payment_method === "bank_transfer") {
        const { data: account } = await supabase
          .from("company_accounts")
          .select("current_balance")
          .eq("id", company_account_id)
          .single();
        if (account) {
          await supabase
            .from("company_accounts")
            .update({ current_balance: account.current_balance + parsedAmount }) // Add money back
            .eq("id", company_account_id);
        }
      }
      throw new Error(
        `Failed to update purchase record: ${purchaseUpdateError.message}`
      );
    }

    // 3. Create the supplier payment record
    const { data: newPayment, error: paymentInsertError } = await supabase
      .from("supplier_payments")
      .insert({
        purchase_id: purchase_id,
        company_account_id: company_account_id,
        amount: parsedAmount,
        payment_date: payment_date,
        payment_method: payment_method,
        cheque_number: cheque_number || null,
        cheque_date: cheque_date || null,
        // --- SET CHEQUE STATUS ---
        cheque_status: payment_method === "cheque" ? "pending" : null,
        notes: notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (paymentInsertError) {
      // Rollback purchase update
      await supabase
        .from("purchases")
        .update({
          amount_paid: purchase.amount_paid,
          balance_due: purchase.total_amount - purchase.amount_paid,
          payment_status:
            purchase.total_amount - purchase.amount_paid <= 0
              ? "paid"
              : "partial",
        })
        .eq("id", purchase_id);

      // Rollback account balance update
      if (payment_method === "cash" || payment_method === "bank_transfer") {
        const { data: account } = await supabase
          .from("company_accounts")
          .select("current_balance")
          .eq("id", company_account_id)
          .single();
        if (account) {
          await supabase
            .from("company_accounts")
            .update({ current_balance: account.current_balance + parsedAmount }) // Add money back
            .eq("id", company_account_id);
        }
      }

      throw new Error(`Failed to log payment: ${paymentInsertError.message}`);
    }

    return NextResponse.json(
      { success: true, payment: newPayment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error." },
      { status: 500 }
    );
  }
}
