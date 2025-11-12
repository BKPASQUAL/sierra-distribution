// src/app/api/expenses/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database, ExpenseCategory } from "@/types/database.types";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

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

// GET - Fetch all expenses with filters (No change needed)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
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
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/expenses:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching expenses" },
      { status: 500 }
    );
  }
}

// POST - Create new expense (Updated Validation)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.category || !body.amount || !body.payment_method) {
      return NextResponse.json(
        { error: "Missing required fields: category, amount, payment_method" },
        { status: 400 }
      );
    }

    // UPDATED: Validate against the new, full list of categories
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category: ${body.category}` },
        { status: 400 }
      );
    }

    const validPaymentMethods = ["cash", "bank_transfer", "cheque", "card"];
    if (!validPaymentMethods.includes(body.payment_method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const expenseNumber = await generateExpenseNumber(supabase);

    const expenseData: ExpenseInsert = {
      expense_number: expenseNumber,
      expense_date: body.expense_date || new Date().toISOString().split("T")[0],
      category: body.category,
      description: body.description || null,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      reference_number: body.reference_number || null,
      vendor_name: body.vendor_name || null,
      notes: body.notes || null,
      created_by: user.id,
      // Include new fields
      receipt_number: body.receipt_number || null,
      status: body.status || "approved",
      is_recurring: body.is_recurring || false,
      recurring_frequency: body.recurring_frequency || null,
    };

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert([expenseData])
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

    if (error) {
      console.error("Error creating expense:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/expenses:", error);
    return NextResponse.json(
      { error: "Internal server error while creating expense" },
      { status: 500 }
    );
  }
}

// Helper function (no change)
async function generateExpenseNumber(supabase: any): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const datePart = today.replace(/-/g, "");

  const { count } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("expense_date", today);

  const sequencePart = String((count || 0) + 1).padStart(3, "0");

  return `EXP-${datePart}-${sequencePart}`;
}
