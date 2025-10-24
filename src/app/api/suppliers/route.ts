// src/app/api/suppliers/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

// Define the shape of data we expect to insert
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']

// GET all suppliers
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Select all fields and order by name
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suppliers }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while fetching suppliers' },
      { status: 500 }
    )
  }
}

// POST - Create new supplier
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body: SupplierInsert = await request.json()

    const insertPayload = {
      ...body,
      supplier_code: `SUP-${Date.now()}`, // Generate a mock supplier code
    } as SupplierInsert;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while creating supplier' },
      { status: 500 }
    )
  }
}