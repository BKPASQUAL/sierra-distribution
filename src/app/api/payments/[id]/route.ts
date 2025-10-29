// src/app/api/payments/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Update payment (specifically for cheque status)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { cheque_status } = body

    // Validate cheque status
    if (!cheque_status || !['pending', 'passed', 'returned'].includes(cheque_status)) {
      return NextResponse.json(
        { error: 'Invalid cheque status. Must be: pending, passed, or returned' },
        { status: 400 }
      )
    }

    // Get the payment to verify it's a cheque
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('payment_method, customer_id, order_id, amount')
      .eq('id', id)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.payment_method.toLowerCase() !== 'cheque') {
      return NextResponse.json(
        { error: 'Cannot update cheque status for non-cheque payment' },
        { status: 400 }
      )
    }

    // Update the cheque status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ cheque_status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If cheque is returned, we need to handle the payment failure
    if (cheque_status === 'returned' && payment.order_id) {
      // Recalculate order payment status (excluding this returned cheque)
      const { data: orderPayments } = await supabase
        .from('payments')
        .select('amount, cheque_status, id')
        .eq('order_id', payment.order_id)

      // Sum only successful payments (not returned cheques)
      const totalPaid = orderPayments?.reduce((sum, p) => {
        if (p.cheque_status === 'returned') return sum
        return sum + p.amount
      }, 0) || 0

      // Get order total
      const { data: order } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', payment.order_id)
        .single()

      if (order) {
        let newPaymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
        if (totalPaid >= order.total_amount) {
          newPaymentStatus = 'paid'
        } else if (totalPaid > 0) {
          newPaymentStatus = 'partial'
        }

        // Update order payment status
        await supabase
          .from('orders')
          .update({ payment_status: newPaymentStatus })
          .eq('id', payment.order_id)

        // Update customer outstanding balance (add back the returned amount)
        const { data: customer } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', payment.customer_id)
          .single()

        if (customer) {
          const newBalance = (customer.outstanding_balance || 0) + payment.amount
          await supabase
            .from('customers')
            .update({ outstanding_balance: newBalance })
            .eq('id', payment.customer_id)
        }
      }
    }

    return NextResponse.json({ payment: updatedPayment }, { status: 200 })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error while updating payment' },
      { status: 500 }
    )
  }
}

// GET single payment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        customers (
          name,
          phone
        ),
        orders (
          order_number,
          total_amount
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ payment }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}