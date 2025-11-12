// src/app/api/bank-accounts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all bank accounts
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: accounts, error } = await supabase
      .from("bank_accounts")
      .select(`
        *,
        banks (
          bank_code,
          bank_name
        )
      `)
      .order("account_type", { ascending: true })
      .order("account_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST new bank account
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: account, error } = await supabase
      .from("bank_accounts")
      .insert({
        account_name: body.account_name,
        account_number: body.account_number,
        bank_id: body.bank_id,
        account_type: body.account_type,
        opening_balance: body.current_balance, // Set opening and current to same value
        current_balance: body.current_balance,
        branch: body.branch,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}