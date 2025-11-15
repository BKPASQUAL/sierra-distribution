// src/app/api/purchases/unpaid/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET unpaid and partially paid purchases
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch purchases with unpaid or partial payment status
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select(
        `
        id,
        purchase_id,
        purchase_date,
        total_amount,
        amount_paid,
        balance_due,
        payment_status,
        suppliers (
          id,
          name
        )
      `
      )
      .in("payment_status", ["unpaid", "partial"])
      .order("purchase_date", { ascending: true });

    if (purchasesError) {
      console.error("Error fetching unpaid purchases:", purchasesError);
      return NextResponse.json(
        { error: purchasesError.message },
        { status: 500 }
      );
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ purchases: [] }, { status: 200 });
    }

    // Recalculate balance_due just in case (total_amount - amount_paid)
    const purchasesWithBalance = purchases.map((p) => ({
      ...p,
      balance_due: p.total_amount - p.amount_paid,
    }));

    return NextResponse.json(
      { purchases: purchasesWithBalance },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/purchases/unpaid:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching unpaid purchases" },
      { status: 500 }
    );
  }
}