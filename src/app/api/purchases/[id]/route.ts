// src/app/api/purchases/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET single purchase by purchase_id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(id, name, contact, email, address, city),
        purchase_items(
          id,
          product_id,
          quantity,
          mrp,
          discount_percent,
          discount_amount,
          unit_price,
          line_total,
          product:products(id, sku, name, unit_of_measure, description)
        )
      `)
      .eq('purchase_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Purchase not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedPurchase = {
      id: purchase.purchase_id,
      supplierId: purchase.supplier?.id,
      supplierName: purchase.supplier?.name || 'Unknown Supplier',
      supplierContact: purchase.supplier?.contact,
      supplierEmail: purchase.supplier?.email,
      supplierAddress: purchase.supplier?.address,
      supplierCity: purchase.supplier?.city,
      date: purchase.purchase_date,
      subtotal: purchase.subtotal,
      totalDiscount: purchase.total_discount,
      total: purchase.total_amount,
      notes: purchase.notes,
      items: purchase.purchase_items?.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || 'Unknown Product',
        productSku: item.product?.sku,
        productUnit: item.product?.unit_of_measure || 'unit',
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

    return NextResponse.json({ purchase: transformedPurchase }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/purchases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching purchase' },
      { status: 500 }
    );
  }
}

// PUT - Update purchase order
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    const { notes } = body;

    // Only allow updating notes for now
    const { data: purchase, error } = await supabase
      .from('purchases')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('purchase_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Purchase updated successfully',
        purchase,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/purchases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating purchase' },
      { status: 500 }
    );
  }
}

// DELETE - Delete purchase order
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Delete the purchase (purchase_items will be cascade deleted)
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('purchase_id', id);

    if (error) {
      console.error('Error deleting purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Purchase deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/purchases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting purchase' },
      { status: 500 }
    );
  }
}