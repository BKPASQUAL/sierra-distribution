// src/app/api/orders/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET single order/bill by ID with customer and order items
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Fetch order with customer details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email,
          address,
          city
        )
      `)
      .eq('id', id)
      .single();

    if (orderError && orderError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          id,
          name,
          unit_of_measure
        )
      `)
      .eq('order_id', id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Transform the data to match the frontend structure
    const transformedOrder = {
      id: order.id,
      billNo: order.order_number,
      customerName: order.customers?.name || 'N/A',
      customerContact: order.customers?.phone || 'N/A',
      customerEmail: order.customers?.email || null,
      customerAddress: order.customers?.address || null,
      customerCity: order.customers?.city || null,
      date: order.order_date,
      deliveryDate: order.delivery_date,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentType: order.payment_method || 'N/A',
      items: orderItems.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        unit: item.products?.unit_of_measure || 'unit',
        unitPrice: item.unit_price,
        discount: item.discount_percent || 0,
        tax: item.tax_percent || 0,
        total: item.line_total,
      })),
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      total: order.total_amount,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return NextResponse.json({ order: transformedOrder }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching order' },
      { status: 500 }
    );
  }
}

// PUT - Update order status and payment status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Only allow updating specific fields
    const allowedUpdates: any = {};
    
    if (body.status) allowedUpdates.status = body.status;
    if (body.payment_status) allowedUpdates.payment_status = body.payment_status;
    if (body.payment_method) allowedUpdates.payment_method = body.payment_method;
    if (body.delivery_date) allowedUpdates.delivery_date = body.delivery_date;
    if (body.notes) allowedUpdates.notes = body.notes;

    allowedUpdates.updated_at = new Date().toISOString();

    const { data: order, error } = await supabase
      .from('orders')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating order' },
      { status: 500 }
    );
  }
}