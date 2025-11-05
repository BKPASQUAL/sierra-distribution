// src/app/api/purchases/[id]/route.ts
// FIXED: Properly formats purchase data to match frontend expectations
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET single purchase by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const purchaseId = params.id;

    const { data: purchase, error } = await supabase
      .from("purchases")
      .select(
        `
        id,
        purchase_id,
        supplier_id,
        purchase_date,
        subtotal,
        total_discount,
        total_amount,
        invoice_number,
        payment_status,
        notes,
        created_at,
        updated_at,
        suppliers (
          id,
          name,
          contact,
          email,
          address,
          city
        ),
        purchase_items (
          id,
          product_id,
          quantity,
          mrp,
          discount_percent,
          discount_amount,
          unit_price,
          line_total,
          products (
            id,
            name,
            sku,
            unit_of_measure
          )
        )
      `
      )
      .eq("purchase_id", purchaseId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Format the response to match frontend expectations
    // Supabase returns suppliers as array, get first element
    const supplier = Array.isArray(purchase.suppliers)
      ? purchase.suppliers[0]
      : purchase.suppliers;

    const formattedPurchase = {
      id: purchase.purchase_id,
      supplierId: purchase.supplier_id,
      supplierName: supplier?.name || "Unknown",
      supplierContact: supplier?.contact,
      supplierEmail: supplier?.email,
      supplierAddress: supplier?.address,
      supplierCity: supplier?.city,
      date: purchase.purchase_date,
      subtotal: purchase.subtotal,
      totalDiscount: purchase.total_discount,
      total: purchase.total_amount,
      invoiceNumber: purchase.invoice_number,
      paymentStatus: purchase.payment_status,
      notes: purchase.notes,
      items:
        purchase.purchase_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.products?.name || "Unknown Product",
          productSku: item.products?.sku || "",
          productUnit: item.products?.unit_of_measure || "",
          quantity: item.quantity,
          mrp: item.mrp,
          discountPercent: item.discount_percent,
          discountAmount: item.discount_amount,
          unitPrice: item.unit_price,
          lineTotal: item.line_total,
        })) || [],
      createdAt: purchase.created_at,
      updatedAt: purchase.updated_at,
    };

    return NextResponse.json({ purchase: formattedPurchase }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update purchase (payment_status and invoice_number)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const purchaseId = params.id;
    const body = await request.json();

    console.log("🔄 Updating purchase:", purchaseId);
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Build update object - only include fields that are present
    const updateData: any = {};

    if (body.payment_status !== undefined) {
      updateData.payment_status = body.payment_status;
    }

    if (body.invoice_number !== undefined) {
      updateData.invoice_number = body.invoice_number;
    }

    console.log("📝 Update data:", updateData);

    // Update the purchase
    const { data: purchase, error } = await supabase
      .from("purchases")
      .update(updateData)
      .eq("purchase_id", purchaseId)
      .select()
      .single();

    if (error) {
      console.error("❌ Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    console.log("✅ Update successful. New values:", {
      payment_status: purchase.payment_status,
      invoice_number: purchase.invoice_number,
    });

    return NextResponse.json(
      { message: "Purchase updated successfully", purchase },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating purchase:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE purchase
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const purchaseId = params.id;

    // First, get the purchase to get its UUID
    const { data: purchase, error: fetchError } = await supabase
      .from("purchases")
      .select("id, purchase_items(product_id, quantity)")
      .eq("purchase_id", purchaseId)
      .single();

    if (fetchError || !purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Delete purchase items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from("purchase_items")
      .delete()
      .eq("purchase_id", purchase.id);

    if (itemsError) {
      console.error("Error deleting purchase items:", itemsError);
      return NextResponse.json(
        { error: "Failed to delete purchase items" },
        { status: 500 }
      );
    }

    // Delete the purchase
    const { error: deleteError } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchase.id);

    if (deleteError) {
      console.error("Error deleting purchase:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Purchase deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
