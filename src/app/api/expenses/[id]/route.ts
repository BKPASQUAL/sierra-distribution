// src/app/api/expenses/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET single expense by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: expense, error } = await supabase
      .from("expenses")
      .select(
        `
        *,
        users!expenses_created_by_fkey (
          name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching expense" },
      { status: 500 }
    );
  }
}

// PUT - Update expense
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if expense exists and user has permission
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Check permission: user can update their own expenses or admin can update any
    if (existingExpense.created_by !== user.id && userData?.role !== "Admin") {
      return NextResponse.json(
        { error: "You do not have permission to update this expense" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate category if provided
    if (body.category) {
      const validCategories = ["fuel", "maintenance", "other"];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category. Must be: fuel, maintenance, or other" },
          { status: 400 }
        );
      }
    }

    // Validate payment method if provided
    if (body.payment_method) {
      const validPaymentMethods = ["cash", "bank_transfer", "cheque", "card"];
      if (!validPaymentMethods.includes(body.payment_method)) {
        return NextResponse.json(
          { error: "Invalid payment method" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.expense_date) updateData.expense_date = body.expense_date;
    if (body.category) updateData.category = body.category;
    if (body.description) updateData.description = body.description;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.payment_method) updateData.payment_method = body.payment_method;
    if (body.reference_number !== undefined)
      updateData.reference_number = body.reference_number;
    if (body.vendor_name !== undefined)
      updateData.vendor_name = body.vendor_name;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: expense, error: updateError } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        users!expenses_created_by_fkey (
          name,
          email
        )
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal server error while updating expense" },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "Admin") {
      return NextResponse.json(
        { error: "Only admins can delete expenses" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal server error while deleting expense" },
      { status: 500 }
    );
  }
}
