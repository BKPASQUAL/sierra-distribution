import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

// GET - Fetch a single bank account
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;

    const { data: account, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!account) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank account" },
      { status: 500 }
    );
  }
}

// PATCH - Update a bank account
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;
    const body = await request.json();

    const {
      account_name,
      account_number,
      bank_name,
      account_type,
      branch,
      opening_balance,
      current_balance,
      currency,
      is_active,
      is_primary,
      notes,
    } = body;

    // If setting this as primary, unset other primary accounts
    if (is_primary) {
      await supabase
        .from("bank_accounts")
        .update({ is_primary: false })
        .eq("is_primary", true)
        .neq("id", id);
    }

    const updateData: any = {};

    if (account_name !== undefined) updateData.account_name = account_name;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (account_type !== undefined) updateData.account_type = account_type;
    if (branch !== undefined) updateData.branch = branch;
    if (opening_balance !== undefined) updateData.opening_balance = opening_balance;
    if (current_balance !== undefined) updateData.current_balance = current_balance;
    if (currency !== undefined) updateData.currency = currency;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_primary !== undefined) updateData.is_primary = is_primary;
    if (notes !== undefined) updateData.notes = notes;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedAccount, error } = await supabase
      .from("bank_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Failed to update bank account" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bank account
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = params;

    // Check if account has any transactions
    const { data: transactions, error: txError } = await supabase
      .from("bank_transactions")
      .select("id")
      .eq("bank_account_id", id)
      .limit(1);

    if (txError) throw txError;

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete bank account with existing transactions. Deactivate instead.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Bank account deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Failed to delete bank account" },
      { status: 500 }
    );
  }
}
