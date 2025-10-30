// src/app/api/products/[id]/stock/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PUT - Update product stock
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { quantity, operation } = body;

    if (!quantity || !operation) {
      return NextResponse.json(
        { error: 'Quantity and operation are required' },
        { status: 400 }
      );
    }

    if (operation !== 'add' && operation !== 'subtract') {
      return NextResponse.json(
        { error: 'Operation must be "add" or "subtract"' },
        { status: 400 }
      );
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate new stock
    const currentStock = product.stock_quantity || 0;
    const newStock = operation === 'add' 
      ? currentStock + quantity 
      : Math.max(0, currentStock - quantity); // Prevent negative stock

    // Update stock
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        product: updatedProduct,
        previous_stock: currentStock,
        new_stock: newStock
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}