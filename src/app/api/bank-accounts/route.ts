// src/app/api/bank-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch all bank accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const is_active = searchParams.get("is_active");

    let query = supabase
      .from("bank_accounts")
      .select(`
        *,
        banks!bank_accounts_bank_id_fkey(bank_name, bank_code)
      `)
      .order("is_primary", { ascending: false })
      .order("account_name", { ascending: true });

    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    const { data: accounts, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bank accounts" },
        { status: 500 }
      );
    }

    // Get unreconciled transaction counts
    const accountsWithCounts = await Promise.all(
      (accounts || []).map(async (account) => {
        const { count } = await supabase
          .from("bank_transactions")
          .select("*", { count: "exact", head: true })
          .eq("bank_account_id", account.id)
          .eq("reconciled", false);

        return {
          ...account,
          unreconciled_transactions: count || 0,
        };
      })
    );

    return NextResponse.json({ accounts: accountsWithCounts });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new bank account
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const body = await request.json();
    const {
      account_name,
      account_number,
      bank_id,
      account_type,
      branch,
      opening_balance,
      is_primary,
      notes,
    } = body;

    // Validation
    if (!account_name || !account_number || !bank_id || !account_type) {
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

    const openingBal = parseFloat(opening_balance) || 0;

    // Create account
    const { data: account, error } = await supabase
      .from("bank_accounts")
      .insert({
        account_name,
        account_number,
        bank_id,
        account_type,
        branch: branch || null,
        opening_balance: openingBal,
        current_balance: openingBal, // Start with opening balance
        is_active: true,
        is_primary: is_primary || false,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update bank account
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      account_name,
      branch,
      is_active,
      is_primary,
      notes,
    } = body;

    // If setting as primary, unset other primary accounts
    if (is_primary) {
      await supabase
        .from("bank_accounts")
        .update({ is_primary: false })
        .eq("is_primary", true)
        .neq("id", id);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (account_name !== undefined) updateData.account_name = account_name;
    if (branch !== undefined) updateData.branch = branch || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_primary !== undefined) updateData.is_primary = is_primary;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data: account, error } = await supabase
      .from("bank_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete bank account (soft delete by setting inactive)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID required" },
        { status: 400 }
      );
    }

    // Check if account has transactions
    const { count } = await supabase
      .from("bank_transactions")
      .select("*", { count: "exact", head: true })
      .eq("bank_account_id", id);

    if (count && count > 0) {
      // Soft delete - just set to inactive
      const { error } = await supabase
        .from("bank_accounts")
        .update({ 
          is_active: false,
          is_primary: false,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to deactivate account" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: "Account deactivated (has transactions)" 
      });
    } else {
      // Hard delete if no transactions
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to delete account" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: "Account deleted successfully" 
      });
    }
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}