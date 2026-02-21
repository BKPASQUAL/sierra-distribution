// src/app/api/customers/[id]/credit/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/customers/:id/credit
 * Returns the total available credit balance for a customer.
 * Credit is stored as payments with order_id = NULL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customerId } = await params;

    const { data, error } = await supabase
      .from("payments")
      .select("amount")
      .eq("customer_id", customerId)
      .is("order_id", null)
      .eq("payment_method", "credit_balance");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const credit_balance = data?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

    return NextResponse.json({ credit_balance }, { status: 200 });
  } catch (err) {
    console.error("GET /api/customers/[id]/credit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
