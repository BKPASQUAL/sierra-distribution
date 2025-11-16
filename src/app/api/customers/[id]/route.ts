// src/app/api/customers/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET single customer
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- START OF FIX ---
// This PUT function is now corrected to NOT reset the balance.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Explicitly define the fields we are willing to update.
    // We will IGNORE 'outstanding_balance' so it doesn't get reset.
    const {
      name,
      email,
      phone,
      address,
      city,
      postal_code,
      tax_id,
      credit_limit,
      status,
    } = body;

    const updateData = {
      name,
      email,
      phone,
      address,
      city,
      postal_code,
      tax_id,
      credit_limit,
      status,
    };

    const { data, error } = await supabase
      .from("customers")
      .update(updateData) // Pass in the clean data, not the whole body
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer: data }, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// --- END OF FIX ---

// DELETE customer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // First, check if customer has any associated orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_id", id)
      .limit(1);

    if (ordersError) {
      return NextResponse.json(
        { error: "Error checking for orders" },
        { status: 500 }
      );
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete customer: This customer has existing orders. Please delete their orders first.",
        },
        { status: 409 } // 409 Conflict
      );
    }

    // No orders, proceed with deletion
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
