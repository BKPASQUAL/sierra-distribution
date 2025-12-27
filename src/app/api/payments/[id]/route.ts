// src/app/api/payments/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const {
      amount,
      payment_date,
      payment_method,
      cheque_number,
      cheque_date,
      bank_account_id, // Updated to match schema
      notes,
      deposit_account_id,
      order_id,
      cheque_status,
    } = body;

    // 1. Fetch the CURRENT payment state (before update)
    const { data: currentPayment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Determine if this is a "Full Edit" or just a "Status Update"
    const isFullEdit =
      amount !== undefined ||
      order_id !== undefined ||
      payment_method !== undefined;

    if (isFullEdit) {
      // --- REVERT & RE-APPLY STRATEGY ---

      const oldAmount = currentPayment.amount;
      const oldOrderId = currentPayment.order_id;
      const oldCustomerId = currentPayment.customer_id;
      const oldAccountId = currentPayment.deposit_account_id;
      const oldStatus = currentPayment.cheque_status;
      const oldMethod = currentPayment.payment_method;

      // New values (fallback to old if undefined)
      const newAmount = amount !== undefined ? amount : oldAmount;
      const newOrderId = order_id !== undefined ? order_id : oldOrderId;
      const newMethod =
        payment_method !== undefined ? payment_method : oldMethod;

      let newCustomerId = oldCustomerId;
      if (order_id !== undefined && order_id !== oldOrderId) {
        const { data: newOrder } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("id", newOrderId)
          .single();
        if (newOrder) newCustomerId = newOrder.customer_id;
      }

      // --- STEP A: REVERT OLD FINANCIAL IMPACT ---
      if (oldStatus !== "returned") {
        if (oldCustomerId) {
          const { data: cust } = await supabase
            .from("customers")
            .select("outstanding_balance")
            .eq("id", oldCustomerId)
            .single();
          if (cust) {
            await supabase
              .from("customers")
              .update({
                outstanding_balance:
                  (cust.outstanding_balance || 0) + oldAmount,
              })
              .eq("id", oldCustomerId);
          }
        }

        const wasMoneyInHand =
          oldMethod === "cash" ||
          oldMethod === "bank" ||
          (oldMethod === "cheque" && oldStatus === "passed");

        if (wasMoneyInHand && oldAccountId) {
          const { data: acc } = await supabase
            .from("company_accounts")
            .select("current_balance")
            .eq("id", oldAccountId)
            .single();
          if (acc) {
            await supabase
              .from("company_accounts")
              .update({
                current_balance: (acc.current_balance || 0) - oldAmount,
              })
              .eq("id", oldAccountId);
          }
        }
      }

      // --- STEP B: UPDATE PAYMENT RECORD ---
      const updateData: any = {
        amount: newAmount,
        payment_date: payment_date || currentPayment.payment_date,
        payment_method: newMethod,
        order_id: newOrderId,
        customer_id: newCustomerId,
        notes: notes !== undefined ? notes : currentPayment.notes,
        cheque_number:
          cheque_number !== undefined
            ? cheque_number
            : currentPayment.cheque_number,
        cheque_date:
          cheque_date !== undefined ? cheque_date : currentPayment.cheque_date,
        // Update bank_account_id correctly
        bank_account_id:
          bank_account_id !== undefined
            ? bank_account_id
            : currentPayment.bank_account_id,
        deposit_account_id:
          deposit_account_id !== undefined
            ? deposit_account_id
            : currentPayment.deposit_account_id,
      };

      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // --- STEP C: APPLY NEW FINANCIAL IMPACT ---
      const currentStatus = updatedPayment.cheque_status;

      if (currentStatus !== "returned") {
        if (newCustomerId) {
          const { data: cust } = await supabase
            .from("customers")
            .select("outstanding_balance")
            .eq("id", newCustomerId)
            .single();
          if (cust) {
            await supabase
              .from("customers")
              .update({
                outstanding_balance:
                  (cust.outstanding_balance || 0) - newAmount,
              })
              .eq("id", newCustomerId);
          }
        }

        const isMoneyInHand =
          newMethod === "cash" ||
          newMethod === "bank" ||
          (newMethod === "cheque" && currentStatus === "passed");

        if (isMoneyInHand && updatedPayment.deposit_account_id) {
          const { data: acc } = await supabase
            .from("company_accounts")
            .select("current_balance")
            .eq("id", updatedPayment.deposit_account_id)
            .single();
          if (acc) {
            await supabase
              .from("company_accounts")
              .update({
                current_balance: (acc.current_balance || 0) + newAmount,
              })
              .eq("id", updatedPayment.deposit_account_id);
          }
        }
      }

      // --- STEP D: RECALCULATE ORDER STATUSES ---
      const ordersToUpdate = new Set<string>();
      if (oldOrderId) ordersToUpdate.add(oldOrderId);
      if (newOrderId) ordersToUpdate.add(newOrderId);

      for (const orderId of ordersToUpdate) {
        const { data: orderPayments } = await supabase
          .from("payments")
          .select("amount, cheque_status")
          .eq("order_id", orderId);

        const totalPaid =
          orderPayments?.reduce((sum, p) => {
            if (p.cheque_status === "returned") return sum;
            return sum + p.amount;
          }, 0) || 0;

        const { data: order } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("id", orderId)
          .single();

        if (order) {
          let newStatus: "unpaid" | "partial" | "paid" = "unpaid";
          if (totalPaid >= order.total_amount) newStatus = "paid";
          else if (totalPaid > 0) newStatus = "partial";

          await supabase
            .from("orders")
            .update({ payment_status: newStatus })
            .eq("id", orderId);
        }
      }

      return NextResponse.json({ payment: updatedPayment }, { status: 200 });
    }

    // --- LOGIC 2: Handle Simple Cheque Status Update ---
    if (cheque_status) {
      if (
        !["pending", "deposited", "passed", "returned"].includes(cheque_status)
      ) {
        return NextResponse.json(
          { error: "Invalid cheque status" },
          { status: 400 }
        );
      }

      const updatePayload: any = { cheque_status };
      if (cheque_status === "deposited" && deposit_account_id) {
        updatePayload.deposit_account_id = deposit_account_id;
      }

      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      if (cheque_status === "passed" && currentPayment.deposit_account_id) {
        const { data: acc } = await supabase
          .from("company_accounts")
          .select("current_balance")
          .eq("id", currentPayment.deposit_account_id)
          .single();
        if (acc) {
          await supabase
            .from("company_accounts")
            .update({
              current_balance:
                (acc.current_balance || 0) + currentPayment.amount,
            })
            .eq("id", currentPayment.deposit_account_id);
        }
      }

      if (
        cheque_status === "returned" &&
        currentPayment.order_id &&
        currentPayment.customer_id
      ) {
        const { data: cust } = await supabase
          .from("customers")
          .select("outstanding_balance")
          .eq("id", currentPayment.customer_id)
          .single();
        if (cust) {
          await supabase
            .from("customers")
            .update({
              outstanding_balance:
                (cust.outstanding_balance || 0) + currentPayment.amount,
            })
            .eq("id", currentPayment.customer_id);
        }

        const { data: orderPayments } = await supabase
          .from("payments")
          .select("amount, cheque_status")
          .eq("order_id", currentPayment.order_id);

        const totalPaid =
          orderPayments?.reduce((sum, p) => {
            if (p.cheque_status === "returned") return sum;
            return sum + p.amount;
          }, 0) || 0;

        const { data: order } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("id", currentPayment.order_id)
          .single();

        if (order) {
          let newStatus: "unpaid" | "partial" | "paid" = "unpaid";
          if (totalPaid >= order.total_amount) newStatus = "paid";
          else if (totalPaid > 0) newStatus = "partial";

          await supabase
            .from("orders")
            .update({ payment_status: newStatus })
            .eq("id", currentPayment.order_id);
        }
      }

      return NextResponse.json({ payment: updatedPayment }, { status: 200 });
    }

    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: payment, error } = await supabase
      .from("payments")
      .select(`*, customers(name, phone), orders(order_number, total_amount)`)
      .eq("id", id)
      .single();

    if (error || !payment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ payment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
