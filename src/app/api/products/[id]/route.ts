// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
// --- START OF FIX ---
// Remove old/incorrect imports
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// Add the correct server client import
import { createClient } from "@/lib/supabase/server";
// --- END OF FIX ---

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // --- START OF FIX ---
    // Use the correct client from your lib
    const supabase = await createClient();
    // --- END OF FIX ---
    const { id } = params;

    // Fetch single product
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch product", details: error.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // --- START OF FIX ---
    // Use the correct client
    const supabase = await createClient();
    // --- END OF FIX ---
    const { id } = params;
    const body = await request.json();

    const { data: product, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // --- START OF FIX ---
    // Use the correct client
    const supabase = await createClient();
    // --- END OF FIX ---
    const { id } = params;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
