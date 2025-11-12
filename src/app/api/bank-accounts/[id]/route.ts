// src/app/api/bank-accounts/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PUT - Update a bank account (used for manual balance update)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Only allow updating specific fields, especially current_balance
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (body.account_name) updateData.account_name = body.account_name;
    if (body.account_number) updateData.account_number = body.account_number;
    if (body.bank_id) updateData.bank_id = body.bank_id;
    if (body.account_type) updateData.account_type = body.account_type;
    if (body.current_balance !== undefined) updateData.current_balance = body.current_balance;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: account, error } = await supabase
      .from("bank_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ account }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}