import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

// GET - Fetch all bank accounts
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: bankAccounts, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("account_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank accounts" },
      { status: 500 }
    );
  }
}

// POST - Create a new bank account
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();

    const {
      account_name,
      account_number,
      bank_name,
      account_type,
      branch,
      opening_balance,
      currency,
      is_primary,
      notes,
    } = body;

    // Validate required fields
    if (!account_name || !account_number || !bank_name || !account_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if account number already exists
    const { data: existing } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("account_number", account_number)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Account number already exists" },
        { status: 400 }
      );
    }

    // If this is set as primary, unset other primary accounts
    if (is_primary) {
      await supabase
        .from("bank_accounts")
        .update({ is_primary: false })
        .eq("is_primary", true);
    }

    const { data: newAccount, error } = await supabase
      .from("bank_accounts")
      .insert({
        account_name,
        account_number,
        bank_name,
        account_type,
        branch: branch || null,
        opening_balance: opening_balance || 0,
        current_balance: opening_balance || 0,
        currency: currency || "LKR",
        is_primary: is_primary || false,
        is_active: true,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Failed to create bank account" },
      { status: 500 }
    );
  }
}
