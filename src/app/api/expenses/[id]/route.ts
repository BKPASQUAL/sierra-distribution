// src/app/api/expenses/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database, ExpenseCategory, ExpenseStatus } from "@/types/database.types"; // Import new types

// Full list of new valid categories from your schema
const validCategories: ExpenseCategory[] = [
  "fuel",
  "salaries",
  "rent",
  "utilities",
  "maintenance",
  "delivery",
  "marketing",
  "office_supplies",
  "telephone",
  "insurance",
  "repairs",
  "professional_fees",
  "bank_charges",
  "depreciation",
  "taxes",
  "miscellaneous",
];

// GET (No change)
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

// PUT - Update expense (Updated Validation & Fields)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (existingExpense.created_by !== user.id && userData?.role !== "Admin") {
      return NextResponse.json(
        { error: "You do not have permission to update this expense" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // UPDATED: Validate category
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // Validate payment method
    if (body.payment_method) {
      const validPaymentMethods = ["cash", "bank_transfer", "cheque", "card"];
      if (!validPaymentMethods.includes(body.payment_method)) {
        return NextResponse.json(
          { error: "Invalid payment method" },
          { status: 400 }
        );
      }
    }

    // UPDATED: Validate status
    if (body.status) {
      const validStatus: ExpenseStatus[] = ["pending", "approved", "rejected"];
      if (!validStatus.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // Build updateData object dynamically
    const updateData: any = {};
    const fields: (keyof Database["public"]["Tables"]["expenses"]["Update"])[] =
      [
        "expense_date",
        "category",
        "description",
        "amount",
        "payment_method",
        "reference_number",
        "vendor_name",
        "notes",
        "receipt_number",
        "is_recurring",
        "recurring_frequency",
        "status",
      ];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "amount") {
          updateData[field] = parseFloat(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

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

// DELETE (No change)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
