// src/app/api/customers/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types' // Import the Database type

// Define the shape of data we expect to update
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

// GET single customer by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code === 'PGRST116') { // Not found error code for PostgREST
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while fetching customer' },
      { status: 500 }
    )
  }
}

// PUT - Update customer
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body: CustomerUpdate = await request.json()

    const { data: customer, error } = await supabase
      .from('customers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while updating customer' },
      { status: 500 }
    )
  }
}

// DELETE customer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while deleting customer' },
      { status: 500 }
    )
  }
}