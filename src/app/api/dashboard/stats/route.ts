// src/app/api/dashboard/stats/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    // 1. TOTAL SALES TODAY
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('order_date', todayStart.toISOString())
      .lt('order_date', todayEnd.toISOString());

    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('order_date', new Date(todayStart.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .lt('order_date', todayStart.toISOString());

    const salesToday = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const salesYesterday = yesterdayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const todayChange = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday) * 100 : 0;

    // 2. TOTAL SALES THIS MONTH
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('order_date', monthStart.toISOString())
      .lte('order_date', monthEnd.toISOString());

    const { data: lastMonthOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('order_date', lastMonthStart.toISOString())
      .lte('order_date', lastMonthEnd.toISOString());

    const salesThisMonth = monthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const salesLastMonth = lastMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const monthChange = salesLastMonth > 0 ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 : 0;

    // 3. TOTAL CUSTOMERS
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: lastMonthCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', monthStart.toISOString());

    const newCustomersThisMonth = (totalCustomers || 0) - (lastMonthCustomers || 0);

    // 4. TOTAL DUE AMOUNT
    const { data: allOrders } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        payment_status
      `)
      .in('payment_status', ['unpaid', 'partial']);

    const { data: allPayments } = await supabase
      .from('payments')
      .select('order_id, amount, cheque_status');

    let totalDue = 0;
    let overdueInvoices = 0;

    if (allOrders) {
      for (const order of allOrders) {
        const orderPayments = allPayments?.filter(
          (p) => p.order_id === order.id && p.cheque_status !== 'returned'
        ) || [];

        const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = order.total_amount - totalPaid;

        if (balance > 0) {
          totalDue += balance;
          overdueInvoices++;
        }
      }
    }

    // 5. SALES DATA FOR LAST 7 DAYS (for chart)
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const { data: dayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('order_date', dayStart.toISOString())
        .lt('order_date', dayEnd.toISOString());

      const dayTotal = dayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      salesByDay.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayTotal,
        date: dayStart.toISOString(),
      });
    }

    // 6. TOTAL STOCK VALUE
    const { data: products } = await supabase
      .from('products')
      .select('stock_quantity, mrp, cost_price');

    let totalStockValue = 0;
    let totalStockCost = 0;
    let totalItems = 0;

    if (products) {
      products.forEach((product) => {
        const stock = product.stock_quantity || 0;
        const mrp = product.mrp || 0;
        const cost = product.cost_price || 0;
        
        totalStockValue += stock * mrp;
        totalStockCost += stock * cost;
        totalItems += stock;
      });
    }

    return NextResponse.json({
      salesToday: {
        amount: salesToday,
        change: todayChange,
        comparison: salesYesterday,
      },
      salesThisMonth: {
        amount: salesThisMonth,
        change: monthChange,
        comparison: salesLastMonth,
      },
      totalCustomers: {
        count: totalCustomers || 0,
        newThisMonth: newCustomersThisMonth,
      },
      totalDue: {
        amount: totalDue,
        invoices: overdueInvoices,
      },
      salesChart: salesByDay,
      stockValue: {
        total: totalStockValue,
        cost: totalStockCost,
        items: totalItems,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching dashboard statistics' },
      { status: 500 }
    );
  }
}