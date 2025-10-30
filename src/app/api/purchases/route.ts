// src/app/api/purchases/route.ts
// Single Supplier System - Handles purchase AND items creation
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Generate unique purchase ID
async function generatePurchaseId(supabase: any): Promise<string> {
  const { data: latestPurchase } = await supabase
    .from("purchases")
    .select("purchase_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (latestPurchase && latestPurchase.purchase_id) {
    const match = latestPurchase.purchase_id.match(/(\d+)$/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `PO-${nextNumber.toString().padStart(3, "0")}`;
    }
  }

  return "PO-001";
}

// GET all purchases
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: purchases, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedPurchases = purchases?.map((purchase) => ({
      id: purchase.purchase_id,
      supplierId: purchase.supplier_id,
      supplierName: purchase.suppliers?.name || "Unknown",
      date: purchase.purchase_date,
      items: purchase.purchase_items?.length || 0,
      totalItems:
        purchase.purchase_items?.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ) || 0,
      total: purchase.total_amount,
      subtotal: purchase.subtotal,
      totalDiscount: purchase.total_discount,
      invoiceNumber: purchase.invoice_number,
      paymentStatus: purchase.payment_status,
      notes: purchase.notes,
      createdAt: purchase.created_at,
      updatedAt: purchase.updated_at,
    }));

    return NextResponse.json(
      { purchases: formattedPurchases },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new purchase with items
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get the primary supplier
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .limit(1)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: "Supplier not found. Please set up a supplier first." },
        { status: 400 }
      );
    }

    // Generate unique purchase ID
    const purchaseId = await generatePurchaseId(supabase);

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert([
        {
          purchase_id: purchaseId,
          supplier_id: supplier.id,
          purchase_date: body.purchase_date,
          subtotal: body.subtotal || 0,
          total_discount: body.total_discount || 0,
          total_amount: body.total_amount || body.subtotal || 0,
          invoice_number: body.invoice_number || null,
          payment_status: body.payment_status || "unpaid",
          notes: body.notes || null,
        },
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error("Purchase creation error:", purchaseError);
      return NextResponse.json(
        { error: purchaseError.message },
        { status: 500 }
      );
    }

    // Create purchase items if provided
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const purchaseItems = body.items.map((item: any) => ({
        purchase_id: purchase.id, // Use the UUID, not purchase_id text
        product_id: item.product_id,
        quantity: item.quantity,
        mrp: item.mrp,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems);

      if (itemsError) {
        console.error("Purchase items creation error:", itemsError);
        // Rollback: delete the purchase if items creation fails
        await supabase.from("purchases").delete().eq("id", purchase.id);

        return NextResponse.json(
          { error: `Failed to create purchase items: ${itemsError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
