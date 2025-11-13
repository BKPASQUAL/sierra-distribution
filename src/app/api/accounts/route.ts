// src/app/api/accounts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/database.types";

type AccountInsert = Database["public"]["Tables"]["company_accounts"]["Insert"];

// GET all accounts with bank details
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: accounts, error } = await supabase
      .from("company_accounts")
      .select(
        `
        *,
        banks (
          bank_name,
          bank_code
        )
      `
      )
      .order("account_type", { ascending: true })
      .order("account_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while fetching accounts" },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = (await request.json()) as AccountInsert;

    const insertPayload: AccountInsert = {
      ...body,
      current_balance: body.initial_balance ?? 0,
      bank_id: body.account_type === "cash" ? null : body.bank_id,
      account_number: body.account_type === "cash" ? null : body.account_number,
    };

    const { data: account, error } = await supabase
      .from("company_accounts")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // --- START: IMPROVED ERROR HANDLING ---
      // Check for the unique constraint violation
      if (
        error.code === "23505" &&
        error.message.includes("company_accounts_unique_account_number_idx")
      ) {
        return NextResponse.json(
          { error: "An account with this account number already exists." },
          { status: 409 } // 409 Conflict is the correct status code
        );
      }
      // --- END: IMPROVED ERROR HANDLING ---

      // Return generic error for other issues
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while creating account" },
      { status: 500 }
    );
  }
}
