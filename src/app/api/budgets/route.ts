// src/app/api/budgets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch all budgets with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const budget_period = searchParams.get("budget_period");
    const budget_type = searchParams.get("budget_type");
    const year = searchParams.get("year"); // Get all budgets for a year

    let query = supabase
      .from("budgets")
      .select("*")
      .order("budget_period", { ascending: false });

    // Apply filters
    if (budget_period) {
      query = query.eq("budget_period", budget_period);
    }
    if (budget_type) {
      query = query.eq("budget_type", budget_type);
    }
    if (year) {
      query = query.like("budget_period", `${year}%`);
    }

    const { data: budgets, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch budgets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new budget
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      budget_period,
      budget_type,
      category,
      budgeted_amount,
      notes,
    } = body;

    // Validation
    if (!budget_period || !budget_type || budgeted_amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (budgeted_amount < 0) {
      return NextResponse.json(
        { error: "Budget amount must be positive" },
        { status: 400 }
      );
    }

    // Validate period format (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(budget_period)) {
      return NextResponse.json(
        { error: "Invalid budget period format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    // For expense budgets, category is required
    if (budget_type === "expenses" && !category) {
      return NextResponse.json(
        { error: "Category is required for expense budgets" },
        { status: 400 }
      );
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from("budgets")
      .insert({
        budget_period,
        budget_type,
        category: category || null,
        budgeted_amount: parseFloat(budgeted_amount),
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Budget already exists for this period, type, and category" },
          { status: 409 }
        );
      }
      
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create budget" },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update budget
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { budgeted_amount, notes } = body;

    if (budgeted_amount !== undefined && budgeted_amount < 0) {
      return NextResponse.json(
        { error: "Budget amount must be positive" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (budgeted_amount !== undefined) {
      updateData.budgeted_amount = parseFloat(budgeted_amount);
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const { data: budget, error } = await supabase
      .from("budgets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update budget" },
        { status: 500 }
      );
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete budget
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete budget" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}