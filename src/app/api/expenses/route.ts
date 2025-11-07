// src/app/api/expenses/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/database.types";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

// GET - Fetch all expenses with filters
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

// POST - Create new expense
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.category ||
      !body.description ||
      !body.amount ||
      !body.payment_method
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: category, description, amount, payment_method",
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["fuel", "maintenance", "other"];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be: fuel, maintenance, or other" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "bank_transfer", "cheque", "card"];
    if (!validPaymentMethods.includes(body.payment_method)) {
      return NextResponse.json(
        {
          error:
            "Invalid payment method. Must be: cash, bank_transfer, cheque, or card",
        },
        { status: 400 }
      );
    }

    // Generate expense number
    const expenseNumber = await generateExpenseNumber(supabase);

    const expenseData: ExpenseInsert = {
      expense_number: expenseNumber,
      expense_date: body.expense_date || new Date().toISOString().split("T")[0],
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      reference_number: body.reference_number || null,
      vendor_name: body.vendor_name || null,
      notes: body.notes || null,
      created_by: user.id,
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

// Helper function to generate expense number
async function generateExpenseNumber(supabase: any): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const datePart = today.replace(/-/g, "");

  // Count expenses created today
  const { count } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("expense_date", today);

  const sequencePart = String((count || 0) + 1).padStart(3, "0");

  return `EXP-${datePart}-${sequencePart}`;
}
