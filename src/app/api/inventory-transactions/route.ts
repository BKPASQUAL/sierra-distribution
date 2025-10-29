// src/app/api/inventory-transactions/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/database.types";

// Define the shape of data we expect to insert
type InventoryTransactionInsert = Database['public']['Tables']['inventory_transactions']['Insert'];

// POST - Create new inventory transaction
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: InventoryTransactionInsert = await request.json();
    
    // Validate required fields for a purchase transaction
    if (!body.product_id || !body.quantity || body.transaction_type !== 'purchase') {
        return NextResponse.json({ error: "Invalid or missing transaction details." }, { status: 400 });
    }
    
    const { data: transaction, error } = await supabase
      .from('inventory_transactions')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while creating inventory transaction' },
      { status: 500 }
    );
  }
}