// src/app/api/bank-accounts/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch all bank accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all banks ordered by name
    const { data: banks, error } = await supabase
      .from("banks")
      .select("*")
      .order("bank_name", { ascending: true });

    if (error) {
      console.error("Error fetching bank accounts:", error);
      return NextResponse.json(
        { error: "Failed to fetch bank accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Error in bank accounts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new bank account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bank_code, bank_name, is_active = true } = body;

    // Validate required fields
    if (!bank_code || !bank_name) {
      return NextResponse.json(
        { error: "Bank code and bank name are required" },
        { status: 400 }
      );
    }

    // Check if bank code already exists
    const { data: existingBank } = await supabase
      .from("banks")
      .select("id")
      .eq("bank_code", bank_code)
      .single();

    if (existingBank) {
      return NextResponse.json(
        { error: "Bank code already exists" },
        { status: 409 }
      );
    }

    // Insert new bank account
    const { data: newBank, error } = await supabase
      .from("banks")
      .insert([
        {
          bank_code,
          bank_name,
          is_active,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating bank account:", error);
      return NextResponse.json(
        { error: "Failed to create bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Bank account created successfully", bank: newBank },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in bank accounts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing bank account
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, bank_code, bank_name, is_active } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Bank account ID is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (bank_code !== undefined) updateData.bank_code = bank_code;
    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // If bank_code is being updated, check if it already exists
    if (bank_code !== undefined) {
      const { data: existingBank } = await supabase
        .from("banks")
        .select("id")
        .eq("bank_code", bank_code)
        .neq("id", id)
        .single();

      if (existingBank) {
        return NextResponse.json(
          { error: "Bank code already exists" },
          { status: 409 }
        );
      }
    }

    // Update bank account
    const { data: updatedBank, error } = await supabase
      .from("banks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating bank account:", error);
      return NextResponse.json(
        { error: "Failed to update bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Bank account updated successfully",
      bank: updatedBank,
    });
  } catch (error) {
    console.error("Error in bank accounts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a bank account
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Bank account ID is required" },
        { status: 400 }
      );
    }

    // Check if bank is used in any payments
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("id")
      .eq("bank_id", id)
      .limit(1);

    if (paymentsError) {
      console.error("Error checking bank usage:", paymentsError);
      return NextResponse.json(
        { error: "Failed to check bank usage" },
        { status: 500 }
      );
    }

    if (payments && payments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete bank account that is used in payments. Please deactivate it instead.",
        },
        { status: 409 }
      );
    }

    // Delete bank account
    const { error } = await supabase.from("banks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting bank account:", error);
      return NextResponse.json(
        { error: "Failed to delete bank account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Bank account deleted successfully",
    });
  } catch (error) {
    console.error("Error in bank accounts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
