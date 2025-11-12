// src/app/api/reports/accounts-payable/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all unpaid or partially paid purchases
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: purchases, error } = await supabase
      .from("purchases")
      .select(`
        id,
        purchase_id,
        purchase_date,
        supplier_id,
        total_amount,
        payment_status,
        amount_paid,
        balance_due,
        suppliers ( name )
      `)
      .in("payment_status", ["unpaid", "partial"])
      .order("purchase_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate balance due if not stored
    const purchasesWithBalance = purchases.map(p => ({
      ...p,
      // Use stored balance_due if available, otherwise calculate it
      balance_due: p.balance_due ?? (p.total_amount - (p.amount_paid || 0))
    }));

    return NextResponse.json({ purchases: purchasesWithBalance }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}