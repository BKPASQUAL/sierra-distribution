// src/app/api/purchases/[id]/update/route.ts
// Full Purchase Update API - Admin Only
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const purchaseId = params.id;
    const body = await request.json();

    console.log("🔄 Full purchase update for:", purchaseId);
    console.log("📦 Update data:", JSON.stringify(body, null, 2));

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Unable to verify user profile" },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can update purchases" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.purchase_date) {
      return NextResponse.json(
        { error: "Purchase date is required" },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Start transaction - Update purchase header
    const purchaseUpdateData = {
      purchase_date: body.purchase_date,
      invoice_number: body.invoice_number || null,
      payment_status: body.payment_status || "unpaid",
      notes: body.notes || null,
      subtotal: body.subtotal,
      total_discount: body.total_discount,
      total_amount: body.total_amount,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedPurchase, error: purchaseError } = await supabase
      .from("purchases")
      .update(purchaseUpdateData)
      .eq("purchase_id", purchaseId)
      .select()
      .single();

    if (purchaseError) {
      console.error("❌ Error updating purchase:", purchaseError);
      return NextResponse.json(
        { error: "Failed to update purchase", details: purchaseError.message },
        { status: 500 }
      );
    }

    // Get existing items to calculate stock changes
    const { data: existingItems, error: existingItemsError } = await supabase
      .from("purchase_items")
      .select("id, product_id, quantity")
      .eq("purchase_id", updatedPurchase.id);

    if (existingItemsError) {
      console.error("❌ Error fetching existing items:", existingItemsError);
      return NextResponse.json(
        { error: "Failed to fetch existing items" },
        { status: 500 }
      );
    }

    // Create a map of existing items
    const existingItemsMap = new Map(
      existingItems?.map((item) => [item.product_id, item]) || []
    );

    // Delete old purchase items
    const { error: deleteError } = await supabase
      .from("purchase_items")
      .delete()
      .eq("purchase_id", updatedPurchase.id);

    if (deleteError) {
      console.error("❌ Error deleting old items:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete old items" },
        { status: 500 }
      );
    }

    // Insert new purchase items and update inventory
    const newItems = body.items.map((item: any) => ({
      purchase_id: updatedPurchase.id,
      product_id: item.product_id,
      quantity: item.quantity,
      mrp: item.mrp,
      discount_percent: item.discount_percent,
      discount_amount: item.discount_amount,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_items")
      .insert(newItems);

    if (itemsError) {
      console.error("❌ Error inserting new items:", itemsError);
      return NextResponse.json(
        { error: "Failed to insert new items", details: itemsError.message },
        { status: 500 }
      );
    }

    // Update product inventory for each item
    for (const item of body.items) {
      // Get current product data
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (productError) {
        console.error(`❌ Error fetching product ${item.product_id}:`, productError);
        continue;
      }

      // Calculate stock adjustment
      const existingItem = existingItemsMap.get(item.product_id);
      let stockAdjustment = item.quantity;

      if (existingItem) {
        // If item existed before, calculate the difference
        stockAdjustment = item.quantity - existingItem.quantity;
      }

      const newStock = product.stock_quantity + stockAdjustment;

      // Update product stock and cost price
      const { error: updateProductError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          cost_price: item.unit_price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product_id);

      if (updateProductError) {
        console.error(`❌ Error updating product ${item.product_id}:`, updateProductError);
        continue;
      }

      // Create inventory transaction
      if (stockAdjustment !== 0) {
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          transaction_type: "purchase_edit",
          quantity: Math.abs(stockAdjustment),
          reference_type: "purchase",
          reference_id: updatedPurchase.id,
          notes: `Stock ${stockAdjustment > 0 ? "increase" : "decrease"} from purchase order edit`,
        });
      }
    }

    // Handle items that were removed
    for (const [productId, existingItem] of existingItemsMap) {
      const stillExists = body.items.some(
        (item: any) => item.product_id === productId
      );

      if (!stillExists) {
        // Item was removed, reverse the stock addition
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", productId)
          .single();

        if (product) {
          const newStock = product.stock_quantity - existingItem.quantity;
          
          await supabase
            .from("products")
            .update({
              stock_quantity: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", productId);

          // Create inventory transaction for removal
          await supabase.from("inventory_transactions").insert({
            product_id: productId,
            transaction_type: "purchase_edit",
            quantity: existingItem.quantity,
            reference_type: "purchase",
            reference_id: updatedPurchase.id,
            notes: "Stock reversal - item removed from purchase order",
          });
        }
      }
    }

    console.log("✅ Purchase updated successfully!");

    return NextResponse.json(
      {
        success: true,
        message: "Purchase updated successfully",
        purchase: updatedPurchase,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in purchase update:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}