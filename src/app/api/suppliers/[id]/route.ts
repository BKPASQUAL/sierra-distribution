// src/app/api/suppliers/[id]/route.ts
// MODIFIED FOR SINGLE SUPPLIER SYSTEM (Sierra Cables Only)

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/database.types";

type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];

// GET single supplier by ID
// NO CHANGES NEEDED - Works perfectly for single supplier
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found error code
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while fetching supplier" },
      { status: 500 }
    );
  }
}

// PUT - Update supplier
// NO CHANGES NEEDED - Works perfectly for updating Sierra Cables
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body: SupplierUpdate = await request.json();

    // Update the supplier information
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while updating supplier" },
      { status: 500 }
    );
  }
}

// DELETE supplier - Disabled for single supplier system
// We don't want users deleting Sierra Cables
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: "Deleting suppliers is disabled in this system",
      message:
        "This system requires Sierra Cables Ltd as the primary supplier. Deletion is not allowed.",
      code: "SINGLE_SUPPLIER_SYSTEM",
    },
    { status: 403 } // 403 Forbidden
  );
}
