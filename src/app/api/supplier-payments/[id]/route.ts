// src/app/api/supplier-payments/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH - Update supplier payment (for cheque status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } } // <-- This is for App Router
) {
  try {
    const supabase = await createClient();
    const { id } = params; // <-- THIS WAS THE LINE WITH THE TYPO
    const { status } = await request.json(); // status will be 'passed' or 'returned'

    if (!status || !["passed", "returned"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'passed' or 'returned'." },
        { status: 400 }
      );
    }

    // 1. Get the payment details
    const { data: payment, error: fetchError } = await supabase
      .from("supplier_payments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.payment_method !== "cheque") {
      return NextResponse.json(
        { error: "This payment is not a cheque." },
        { status: 400 }
      );
    }

    if (payment.cheque_status !== "pending") {
      return NextResponse.json(
        {
          error: `This cheque has already been marked as ${payment.cheque_status}.`,
        },
        { status: 400 }
      );
    }

    // --- MAIN LOGIC ---

    if (status === "passed") {
      // ** Cheque PASSED: Deduct money from the account **

      // 1. Get the account balance
      const { data: account, error: accountError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", payment.company_account_id)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { error: "Payment account not found." },
          { status: 404 }
        );
      }

      // 2. Calculate new balance (allows overdraft)
      const newBalance = account.current_balance - payment.amount;

      // 3. Update account balance
      const { error: balanceError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newBalance })
        .eq("id", payment.company_account_id);

      if (balanceError) {
        throw new Error(
          `Failed to update account balance: ${balanceError.message}`
        );
      }
    } else if (status === "returned") {
      // ** Cheque RETURNED: Add balance back to purchase **

      // 1. Get the purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("total_amount, amount_paid")
        .eq("id", payment.purchase_id)
        .single();

      if (purchaseError || !purchase) {
        return NextResponse.json(
          { error: "Original purchase not found." },
          { status: 404 }
        );
      }

      // 2. Calculate new purchase balance
      const newAmountPaid = (purchase.amount_paid || 0) - payment.amount;
      const newBalanceDue = purchase.total_amount - newAmountPaid;
      // Determine new status. If balance is now due, it's 'partial' or 'unpaid'.
      const newPaymentStatus =
        newBalanceDue <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "unpaid";

      // 3. Update purchase record
      const { error: purchaseUpdateError } = await supabase
        .from("purchases")
        .update({
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          payment_status: newPaymentStatus,
        })
        .eq("id", payment.purchase_id);

      if (purchaseUpdateError) {
        throw new Error(
          `Failed to update purchase on return: ${purchaseUpdateError.message}`
        );
      }
    }

    // 4. Finally, update the cheque status
    const { data: updatedPayment, error: statusError } = await supabase
      .from("supplier_payments")
      .update({ cheque_status: status })
      .eq("id", id)
      .select()
      .single();

    if (statusError) {
      throw new Error(`Failed to update cheque status: ${statusError.message}`);
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error." },
      { status: 500 }
    );
  }
}
