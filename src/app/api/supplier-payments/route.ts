// src/app/api/supplier-payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch all supplier payments with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const supplier_id = searchParams.get("supplier_id");
    const purchase_id = searchParams.get("purchase_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const status = searchParams.get("status");

    let query = supabase
      .from("supplier_payments")
      .select(`
        *,
        suppliers!supplier_payments_supplier_id_fkey(name, supplier_code),
        purchases!supplier_payments_purchase_id_fkey(purchase_id, total_amount),
        banks!supplier_payments_bank_id_fkey(bank_name, bank_code)
      `)
      .order("payment_date", { ascending: false });

    // Apply filters
    if (supplier_id) {
      query = query.eq("supplier_id", supplier_id);
    }
    if (purchase_id) {
      query = query.eq("purchase_id", purchase_id);
    }
    if (start_date) {
      query = query.gte("payment_date", start_date);
    }
    if (end_date) {
      query = query.lte("payment_date", end_date);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch supplier payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching supplier payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new supplier payment
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplier_id,
      purchase_id,
      payment_date,
      amount,
      payment_method,
      bank_id,
      reference_number,
      cheque_number,
      cheque_date,
      notes,
    } = body;

    // Validation
    if (!supplier_id || !payment_date || !amount || !payment_method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // If purchase_id provided, check if payment exceeds balance
    if (purchase_id) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("total_amount, amount_paid, balance_due")
        .eq("id", purchase_id)
        .single();

      if (purchaseError) {
        return NextResponse.json(
          { error: "Purchase not found" },
          { status: 404 }
        );
      }

      const balance = purchase.balance_due || purchase.total_amount;
      if (parseFloat(amount) > balance) {
        return NextResponse.json(
          { error: `Payment amount (${amount}) exceeds balance due (${balance})` },
          { status: 400 }
        );
      }
    }

    // Generate payment number
    const payment_number = `SPY-${Date.now()}`;

    // Create payment
    const { data: payment, error } = await supabase
      .from("supplier_payments")
      .insert({
        payment_number,
        supplier_id,
        purchase_id: purchase_id || null,
        payment_date,
        amount: parseFloat(amount),
        payment_method,
        bank_id: bank_id || null,
        reference_number: reference_number || null,
        cheque_number: cheque_number || null,
        cheque_date: cheque_date || null,
        cheque_status: payment_method === "cheque" ? "pending" : null,
        notes: notes || null,
        status: "completed",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create supplier payment" },
        { status: 500 }
      );
    }

    // Update purchase payment status if linked
    if (purchase_id) {
      // Get current purchase data
      const { data: purchase } = await supabase
        .from("purchases")
        .select("total_amount, amount_paid")
        .eq("id", purchase_id)
        .single();

      if (purchase) {
        const newAmountPaid = (purchase.amount_paid || 0) + parseFloat(amount);
        const newBalance = purchase.total_amount - newAmountPaid;
        
        let newStatus: "unpaid" | "paid" | "partial";
        if (newBalance <= 0) {
          newStatus = "paid";
        } else if (newAmountPaid > 0) {
          newStatus = "partial";
        } else {
          newStatus = "unpaid";
        }

        await supabase
          .from("purchases")
          .update({
            amount_paid: newAmountPaid,
            payment_status: newStatus,
          })
          .eq("id", purchase_id);
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier payment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    // Get payment details before deletion
    const { data: payment } = await supabase
      .from("supplier_payments")
      .select("purchase_id, amount")
      .eq("id", id)
      .single();

    // Delete payment
    const { error } = await supabase
      .from("supplier_payments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete supplier payment" },
        { status: 500 }
      );
    }

    // Update purchase if linked
    if (payment && payment.purchase_id) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("total_amount, amount_paid")
        .eq("id", payment.purchase_id)
        .single();

      if (purchase) {
        const newAmountPaid = Math.max(0, (purchase.amount_paid || 0) - payment.amount);
        const newBalance = purchase.total_amount - newAmountPaid;
        
        let newStatus: "unpaid" | "paid" | "partial";
        if (newBalance <= 0) {
          newStatus = "paid";
        } else if (newAmountPaid > 0) {
          newStatus = "partial";
        } else {
          newStatus = "unpaid";
        }

        await supabase
          .from("purchases")
          .update({
            amount_paid: newAmountPaid,
            payment_status: newStatus,
          })
          .eq("id", payment.purchase_id);
      }
    }

    return NextResponse.json({ message: "Supplier payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}