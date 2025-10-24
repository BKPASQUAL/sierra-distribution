// src/app/api/suppliers/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

// Define the shape of data we expect to update
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']

// GET single supplier by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code === 'PGRST116') { // Not found error code for PostgREST
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ supplier }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while fetching supplier' },
      { status: 500 }
    )
  }
}

// PUT - Update supplier
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body: SupplierUpdate = await request.json()

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ supplier }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while updating supplier' },
      { status: 500 }
    )
  }
}

// DELETE supplier
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Supplier deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while deleting supplier' },
      { status: 500 }
    )
  }
}