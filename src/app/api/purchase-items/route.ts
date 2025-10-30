// src/app/api/purchase-items/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Create multiple purchase items
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const { data: items, error } = await supabase
      .from('purchase_items')
      .insert(body.items)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}