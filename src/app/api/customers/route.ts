// src/app/api/customers/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types' // Import the Database type

// Define the shape of data we expect to insert
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

// GET all customers
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Select all fields and order by name
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while fetching customers' },
      { status: 500 }
    )
  }
}

// POST - Create new customer
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body: CustomerInsert = await request.json()

    // Add required defaults for simplicity, assuming the payload is basic
    const insertPayload = {
      ...body,
      customer_code: `CUST-${Date.now()}`, // Generate a mock customer code
      credit_limit: body.credit_limit ?? 0,
      outstanding_balance: body.outstanding_balance ?? 0,
      status: body.status ?? 'active'
    } as CustomerInsert;

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while creating customer' },
      { status: 500 }
    )
  }
}