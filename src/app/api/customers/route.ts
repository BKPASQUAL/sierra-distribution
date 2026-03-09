// src/app/api/customers/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types' // Import the Database type

// Define the shape of data we expect to insert
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

// GET all customers with dynamically calculated outstanding balance
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Select all fields along with related orders and payments
    const { data: customersData, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          status,
          total_amount,
          payments (
            amount,
            cheque_status
          )
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process the data to calculate balances
    const customers = customersData.map(customer => {
      // Filter out cancelled orders
      const validOrders = customer.orders?.filter((o: any) => o.status !== 'cancelled') || [];
      
      const totalOrders = validOrders.length;
      
      let totalOrderAmount = 0;
      let totalPaid = 0;

      validOrders.forEach((order: any) => {
        totalOrderAmount += (order.total_amount || 0);
        
        // Sum successful payments for this order (exclude returned cheques)
        if (order.payments && Array.isArray(order.payments)) {
          order.payments.forEach((payment: any) => {
            if (payment.cheque_status !== 'returned') {
              totalPaid += (payment.amount || 0);
            }
          });
        }
      });

      const calculatedOutstandingBalance = totalOrderAmount - totalPaid;

      // Remove the raw nested data to keep response clean
      const { orders, ...customerWithoutOrders } = customer;

      return {
        ...customerWithoutOrders,
        totalOrders,
        totalPaid,
        outstanding_balance: calculatedOutstandingBalance
      };
    });

    // Sort by outstanding balance descending (customers owing most at top)
    customers.sort((a, b) => b.outstanding_balance - a.outstanding_balance);

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/customers:", error);
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