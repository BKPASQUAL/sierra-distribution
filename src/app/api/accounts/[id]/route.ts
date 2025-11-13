import { Database } from '@/types/database.types';
// src/app/api/accounts/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AccountUpdate = Database["public"]["Tables"]["company_accounts"]["Update"];

// PUT - Update account
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body: AccountUpdate = await request.json();

    const { current_balance, initial_balance, ...updateData } = body;

    if (updateData.account_type === "cash") {
      updateData.bank_id = null;
      updateData.account_number = null;
    }

    const { data: account, error } = await supabase
      .from("company_accounts")
      .update(updateData)
      .eq("id", id)
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
          { status: 409 } // 409 Conflict
        );
      }
      // --- END: IMPROVED ERROR HANDLING ---

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while updating account" },
      { status: 500 }
    );
  }
}

// DELETE account
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from("company_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while deleting account" },
      { status: 500 }
    );
  }
}
