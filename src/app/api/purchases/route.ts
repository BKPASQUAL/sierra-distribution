// src/app/api/purchases/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Type definitions
interface PurchaseItem {
  id: string;
  product_id: string;
  quantity: number;
  mrp: number;
  discount_percent: number;
  discount_amount: number;
  unit_price: number;
  line_total: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string;
  };
}

interface PurchaseItemInput {
  product_id: string;
  quantity: number;
  mrp: number;
  discount_percent?: number;
  discount_amount?: number;
  unit_price: number;
  line_total: number;
}

// GET all purchases with their items
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional query parameters for filtering
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build the query
    let query = supabase
      .from("purchases")
      .select(
        `
        *,
        supplier:suppliers(id, name, contact, email),
        purchase_items(
          id,
          product_id,
          quantity,
          mrp,
          discount_percent,
          discount_amount,
          unit_price,
          line_total,
          product:products(id, sku, name, unit_of_measure)
        )
      `
      )
      .order("purchase_date", { ascending: false });

    // Apply date filters if provided
    if (startDate) {
      query = query.gte("purchase_date", startDate);
    }
    if (endDate) {
      query = query.lte("purchase_date", endDate);
    }

    const { data: purchases, error } = await query;

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedPurchases =
      purchases?.map((purchase) => ({
        id: purchase.purchase_id,
        supplierId: purchase.supplier?.id,
        supplierName: purchase.supplier?.name || "Unknown Supplier",
        date: purchase.purchase_date,
        items: purchase.purchase_items?.length || 0,
        totalItems:
          purchase.purchase_items?.reduce(
            (sum: number, item: PurchaseItem) => sum + item.quantity,
            0
          ) || 0,
        total: purchase.total_amount,
        subtotal: purchase.subtotal,
        totalDiscount: purchase.total_discount,
        notes: purchase.notes,
        createdAt: purchase.created_at,
        updatedAt: purchase.updated_at,
      })) || [];

    return NextResponse.json(
      { purchases: transformedPurchases },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/purchases:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching purchases" },
      { status: 500 }
    );
  }
}

// POST - Create new purchase order
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      purchase_id,
      supplier_id,
      purchase_date,
      items,
      subtotal,
      total_discount,
      total_amount,
      notes,
    } = body;

    // Validate required fields
    if (!purchase_id || !supplier_id || !items || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: purchase_id, supplier_id, and items are required",
        },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Start a transaction by inserting the purchase first
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert([
        {
          purchase_id,
          supplier_id,
          purchase_date:
            purchase_date || new Date().toISOString().split("T")[0],
          subtotal: subtotal || 0,
          total_discount: total_discount || 0,
          total_amount: total_amount || 0,
          notes: notes || null,
          created_by: user?.id,
        },
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error("Error creating purchase:", purchaseError);
      return NextResponse.json(
        { error: purchaseError.message },
        { status: 500 }
      );
    }

    // Insert purchase items
    const purchaseItems = items.map((item: PurchaseItemInput) => ({
      purchase_id: purchase.id,
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
      console.error("Error creating purchase items:", itemsError);
      // Rollback by deleting the purchase
      await supabase.from("purchases").delete().eq("id", purchase.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Purchase order created successfully",
        purchase: {
          id: purchase.id,
          purchase_id: purchase.purchase_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/purchases:", error);
    return NextResponse.json(
      { error: "Internal server error while creating purchase order" },
      { status: 500 }
    );
  }
}
