// src/app/api/suppliers/primary/route.ts
// Get the primary (and only) supplier in the system
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET primary supplier
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_primary', true)
      .single();

    if (error && error.code === 'PGRST116') {
      // No primary supplier found
      return NextResponse.json(
        { error: 'No primary supplier configured' },
        { status: 404 }
      );
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while fetching primary supplier' },
      { status: 500 }
    );
  }
}

// PUT - Update primary supplier details
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        name: body.name,
        contact: body.contact,
        email: body.email,
        address: body.address,
        city: body.city,
        category: body.category,
        updated_at: new Date().toISOString()
      })
      .eq('is_primary', true)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while updating primary supplier' },
      { status: 500 }
    );
  }
}