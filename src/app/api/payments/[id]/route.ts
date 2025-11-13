// src/app/api/payments/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH - Update payment (specifically for cheque status)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { cheque_status, deposit_account_id } = body;

    // Validate cheque status
    if (
      !cheque_status ||
      !["pending", "deposited", "passed", "returned"].includes(cheque_status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid cheque status. Must be: pending, deposited, passed, or returned",
        },
        { status: 400 }
      );
    }

    // --- START OF CHANGE 1 ---
    // Get the payment to verify it's a cheque AND get its deposit_account_id
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select(
        "payment_method, customer_id, order_id, amount, deposit_account_id" // <-- Added deposit_account_id
      )
      .eq("id", id)
      .single();
    // --- END OF CHANGE 1 ---

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.payment_method.toLowerCase() !== "cheque") {
      return NextResponse.json(
        { error: "Cannot update cheque status for non-cheque payment" },
        { status: 400 }
      );
    }

    // Prepare update payload.
    const updatePayload: {
      cheque_status: string;
      deposit_account_id?: string;
    } = {
      cheque_status,
    };

    // If we are moving from "pending" to "deposited", add the new deposit_account_id
    if (cheque_status === "deposited" && deposit_account_id) {
      updatePayload.deposit_account_id = deposit_account_id;
    }

    // Update the cheque status
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // --- START OF CHANGE 2 ---
    // If cheque is PASSED, update the deposit account's balance
    if (cheque_status === "passed") {
      // Use the deposit_account_id we fetched from the payment record
      if (payment.deposit_account_id) {
        try {
          // Get the current balance of the deposit account
          const { data: account, error: accountError } = await supabase
            .from("company_accounts")
            .select("current_balance")
            .eq("id", payment.deposit_account_id)
            .single();

          if (accountError) {
            throw new Error(
              `Failed to fetch account for balance update: ${accountError.message}`
            );
          }

          if (account) {
            const newBalance = (account.current_balance || 0) + payment.amount;

            // Update the account balance
            const { error: balanceUpdateError } = await supabase
              .from("company_accounts")
              .update({ current_balance: newBalance })
              .eq("id", payment.deposit_account_id);

            if (balanceUpdateError) {
              throw new Error(
                `Failed to update account balance: ${balanceUpdateError.message}`
              );
            }
            console.log(
              `✅ Account ${payment.deposit_account_id} balance updated to ${newBalance}`
            );
          }
        } catch (accountUpdateError) {
          console.error(
            "⚠️ Error updating account balance after cheque pass:",
            accountUpdateError
          );
          // Don't fail the whole request, just log the warning
        }
      } else {
        console.warn(
          `⚠️ Cheque ${id} passed, but no deposit_account_id was found. Account balance not updated.`
        );
      }
    }
    // --- END OF CHANGE 2 ---

    // If cheque is RETURNED, we need to handle the payment failure
    if (cheque_status === "returned" && payment.order_id) {
      // Recalculate order payment status (excluding this returned cheque)
      const { data: orderPayments } = await supabase
        .from("payments")
        .select("amount, cheque_status, id")
        .eq("order_id", payment.order_id);

      // Sum only successful payments (not returned cheques)
      const totalPaid =
        orderPayments?.reduce((sum, p) => {
          if (p.cheque_status === "returned") return sum;
          return sum + p.amount;
        }, 0) || 0;

      // Get order total
      const { data: order } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("id", payment.order_id)
        .single();

      if (order) {
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
          .eq("id", payment.order_id);

        // Update customer outstanding balance (add back the returned amount)
        const { data: customer } = await supabase
          .from("customers")
          .select("outstanding_balance")
          .eq("id", payment.customer_id)
          .single();

        if (customer) {
          const newBalance =
            (customer.outstanding_balance || 0) + payment.amount;
          await supabase
            .from("customers")
            .update({ outstanding_balance: newBalance })
            .eq("id", payment.customer_id);
        }
      }
    }

    return NextResponse.json({ payment: updatedPayment }, { status: 200 });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error while updating payment" },
      { status: 500 }
    );
  }
}

// GET single payment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: payment, error } = await supabase
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
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ payment }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
