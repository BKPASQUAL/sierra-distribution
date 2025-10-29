// src/app/(dashboard)/reports/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  File,
  Loader2,
  DollarSign,
  TrendingDown,
  Percent,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface OrderWithProfit {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  subtotal: number; // Total before discount
  discount: number; // Discount amount
  total_amount: number; // Final amount after discount
  total_cost: number; // Cost of goods
  gross_profit: number; // Profit before discount
  net_profit: number; // Profit after discount
  profit_margin: number; // Net profit / total_amount
  discount_impact: number; // How much discount reduced profit
  payment_status: string;
  customers: {
    name: string;
  };
}

interface CustomerProfitSummary {
  customer_name: string;
  customer_id: string;
  total_orders: number;
  total_sales: number;
  total_cost: number;
  total_profit: number;
  avg_profit_margin: number;
  outstanding: number;
}

interface DueInvoice {
  order_number: string;
  customers: { name: string };
  order_date: string;
  daysOverdue: number;
  balance: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithProfit[]>([]);
  const [customerSummary, setCustomerSummary] = useState<
    CustomerProfitSummary[]
  >([]);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);

  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch orders with items
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (!ordersData.orders) {
        console.error("Failed to fetch orders");
        return;
      }

      // Fetch payments
      const paymentsResponse = await fetch("/api/payments");
      const paymentsData = await paymentsResponse.json();

      // Calculate profit for each order
      const ordersWithProfit: OrderWithProfit[] = ordersData.orders.map(
        (order: any) => {
          // Calculate subtotal (selling price × quantity for all items)
          const subtotal =
            order.order_items?.reduce((sum: number, item: any) => {
              return sum + item.unit_price * item.quantity;
            }, 0) || 0;

          // Calculate total cost (cost price × quantity for all items)
          const totalCost =
            order.order_items?.reduce((sum: number, item: any) => {
              return sum + item.cost_price * item.quantity;
            }, 0) || 0;

          // Get discount amount (subtotal - total_amount)
          const discountAmount = subtotal - order.total_amount;

          // Calculate gross profit (before discount impact)
          const grossProfit = subtotal - totalCost;

          // Calculate net profit (after discount reduces profit)
          const netProfit = order.total_amount - totalCost;

          // Profit margin based on final amount
          const profitMargin =
            order.total_amount > 0 ? (netProfit / order.total_amount) * 100 : 0;

          // Discount impact (how much profit was lost due to discount)
          const discountImpact = grossProfit - netProfit;

          return {
            id: order.id,
            order_number: order.order_number,
            order_date: order.order_date,
            customer_id: order.customer_id,
            subtotal: subtotal,
            discount: discountAmount,
            total_amount: order.total_amount,
            total_cost: totalCost,
            gross_profit: grossProfit,
            net_profit: netProfit,
            profit_margin: profitMargin,
            discount_impact: discountImpact,
            payment_status: order.payment_status,
            customers: order.customers,
          };
        }
      );

      setOrders(ordersWithProfit);

      // Calculate customer-wise summary
      const customerMap = new Map<string, CustomerProfitSummary>();

      ordersWithProfit.forEach((order) => {
        const customerId = order.customer_id;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customer_name: order.customers.name,
            customer_id: customerId,
            total_orders: 0,
            total_sales: 0,
            total_cost: 0,
            total_profit: 0,
            avg_profit_margin: 0,
            outstanding: 0,
          });
        }

        const summary = customerMap.get(customerId)!;
        summary.total_orders++;
        summary.total_sales += order.total_amount;
        summary.total_cost += order.total_cost;
        summary.total_profit += order.net_profit;
      });

      // Calculate average profit margin for each customer
      customerMap.forEach((summary) => {
        summary.avg_profit_margin =
          summary.total_sales > 0
            ? (summary.total_profit / summary.total_sales) * 100
            : 0;

        // Calculate outstanding balance
        const customerOrders = ordersWithProfit.filter(
          (o) => o.customer_id === summary.customer_id
        );

        customerOrders.forEach((order) => {
          const orderPayments =
            paymentsData.payments?.filter(
              (p: any) =>
                p.order_id === order.id && p.cheque_status !== "returned"
            ) || [];

          const totalPaid = orderPayments.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
          );
          const balance = order.total_amount - totalPaid;

          if (balance > 0) {
            summary.outstanding += balance;
          }
        });
      });

      const customerArray = Array.from(customerMap.values()).sort(
        (a, b) => b.total_profit - a.total_profit
      );

      setCustomerSummary(customerArray);

      // Fetch due invoices
      const unpaidOrders = ordersWithProfit.filter(
        (order) =>
          order.payment_status === "unpaid" ||
          order.payment_status === "partial"
      );

      const overdueInvoices: DueInvoice[] = unpaidOrders
        .map((order) => {
          const orderPayments =
            paymentsData.payments?.filter(
              (p: any) =>
                p.order_id === order.id && p.cheque_status !== "returned"
            ) || [];

          const totalPaid = orderPayments.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
          );
          const balance = order.total_amount - totalPaid;

          const orderDate = new Date(order.order_date);
          const today = new Date();
          const daysOverdue = Math.floor(
            (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            order_number: order.order_number,
            customers: order.customers,
            order_date: order.order_date,
            daysOverdue,
            balance,
          };
        })
        .filter((inv) => inv.daysOverdue >= 45);

      setDueInvoices(overdueInvoices);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return orderDate >= from && orderDate <= to;
  });

  // Calculate overall statistics
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + o.total_cost, 0);
  const totalProfit = totalSales - totalCost;
  const overallProfitMargin =
    totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate paid vs unpaid
  const paidAmount = filteredOrders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const unpaidAmount = filteredOrders
    .filter((o) => o.payment_status !== "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const handleQuickPeriod = (period: string) => {
    const today = new Date();
    let from = new Date();

    switch (period) {
      case "today":
        from = today;
        break;
      case "week":
        from.setDate(today.getDate() - 7);
        break;
      case "month":
        from.setMonth(today.getMonth() - 1);
        break;
      case "year":
        from.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return;
    }

    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
    setSelectedPeriod(period);
  };

  const handleExportPDF = () => {
    alert(
      "Exporting to PDF...\nThis would generate a PDF file with the current report."
    );
  };

  const handleExportExcel = () => {
    alert(
      "Exporting to Excel...\nThis would generate an Excel file with the current report data."
    );
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return "text-green-600";
    if (margin >= 20) return "text-blue-600";
    if (margin >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getProfitMarginBadge = (margin: number) => {
    if (margin >= 30)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (margin >= 20)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (margin >= 10)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Prepare chart data
  const profitByCustomer = customerSummary.slice(0, 10);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF6B9D",
    "#C0C0C0",
    "#8A2BE2",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business reports with profit analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <File className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select value={selectedPeriod} onValueChange={handleQuickPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setSelectedPeriod("custom");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setSelectedPeriod("custom");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="invisible">Action</Label>
              <Button className="w-full" onClick={fetchReportData}>
                <Calendar className="w-4 h-4 mr-2" />
                Refresh Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              LKR {totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cost: LKR {totalCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getProfitMarginColor(
                overallProfitMargin
              )}`}
            >
              {overallProfitMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {Math.round(avgOrderValue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="profit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profit">
            <TrendingUp className="w-4 h-4 mr-2" />
            Profit Analysis
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Order by Order
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Customer Profit
          </TabsTrigger>
          <TabsTrigger value="due">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Due Payments
          </TabsTrigger>
          <TabsTrigger value="summary">
            <Package className="w-4 h-4 mr-2" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Profit Analysis Tab */}
        <TabsContent value="profit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales vs Profit</CardTitle>
                <CardDescription>Revenue and profit comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold">
                        LKR {totalSales.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Cost
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        LKR {totalCost.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Net Profit
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        LKR {totalProfit.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Profit Margin
                      </span>
                      <span
                        className={`text-xl font-bold ${getProfitMarginColor(
                          overallProfitMargin
                        )}`}
                      >
                        {overallProfitMargin.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Profitable Customers</CardTitle>
                <CardDescription>Highest profit contributors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitByCustomer as any}
                      dataKey="total_profit"
                      nameKey="customer_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) =>
                        `${entry.customer_name.split(" ")[0]}`
                      }
                    >
                      {profitByCustomer.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `LKR ${value.toLocaleString()}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Distribution</CardTitle>
              <CardDescription>Orders by profit margin ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/10">
                  <p className="text-sm text-muted-foreground">
                    Excellent (30%+)
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredOrders.filter((o) => o.profit_margin >= 30).length}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/10">
                  <p className="text-sm text-muted-foreground">Good (20-30%)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      filteredOrders.filter(
                        (o) => o.profit_margin >= 20 && o.profit_margin < 30
                      ).length
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/10">
                  <p className="text-sm text-muted-foreground">Fair (10-20%)</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      filteredOrders.filter(
                        (o) => o.profit_margin >= 10 && o.profit_margin < 20
                      ).length
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/10">
                  <p className="text-sm text-muted-foreground">
                    {"Low (<10%)"}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredOrders.filter((o) => o.profit_margin < 10).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order by Order Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order-wise Profit Analysis</CardTitle>
              <CardDescription>
                Detailed profit breakdown for each order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Final</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No orders found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders
                      .sort((a, b) => b.net_profit - a.net_profit)
                      .map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{order.customers.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            LKR {order.subtotal.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {order.discount > 0
                              ? `-LKR ${order.discount.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            LKR {order.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            LKR {order.total_cost.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            LKR {order.net_profit.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-bold ${getProfitMarginColor(
                                order.profit_margin
                              )}`}
                            >
                              {order.profit_margin.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProfitMarginBadge(
                                order.profit_margin
                              )}`}
                            >
                              {order.profit_margin >= 30
                                ? "Excellent"
                                : order.profit_margin >= 20
                                ? "Good"
                                : order.profit_margin >= 10
                                ? "Fair"
                                : "Low"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  {filteredOrders.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        LKR{" "}
                        {filteredOrders
                          .reduce((sum, o) => sum + o.subtotal, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        -LKR{" "}
                        {filteredOrders
                          .reduce((sum, o) => sum + o.discount, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {totalSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        LKR {totalCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        LKR {totalProfit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={getProfitMarginColor(overallProfitMargin)}
                        >
                          {overallProfitMargin.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Profit Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer-wise Profit Summary</CardTitle>
              <CardDescription>
                Profitability analysis by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Total Profit</TableHead>
                    <TableHead className="text-right">Avg Margin</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSummary.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No customer data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerSummary.map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="font-medium">
                          {customer.customer_name}
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.total_orders}
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {customer.total_sales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          LKR {customer.total_cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          LKR {customer.total_profit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${getProfitMarginColor(
                              customer.avg_profit_margin
                            )}`}
                          >
                            {customer.avg_profit_margin.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              customer.outstanding > 0
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            LKR {customer.outstanding.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {customerSummary.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {customerSummary.reduce(
                          (sum, c) => sum + c.total_orders,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR{" "}
                        {customerSummary
                          .reduce((sum, c) => sum + c.total_sales, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        LKR{" "}
                        {customerSummary
                          .reduce((sum, c) => sum + c.total_cost, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        LKR{" "}
                        {customerSummary
                          .reduce((sum, c) => sum + c.total_profit, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right text-destructive">
                        LKR{" "}
                        {customerSummary
                          .reduce((sum, c) => sum + c.outstanding, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Profitability Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={customerSummary.slice(0, 10)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="customer_name"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `LKR ${value.toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="total_sales"
                    fill="#3b82f6"
                    name="Sales"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="total_cost"
                    fill="#ef4444"
                    name="Cost"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="total_profit"
                    fill="#22c55e"
                    name="Profit"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Due Payments Tab */}
        <TabsContent value="due" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Due Payment Report (45+ Days)</CardTitle>
              <CardDescription>
                Overdue invoices requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-12 h-12 text-green-500" />
                          <p className="text-lg font-medium">
                            No Overdue Invoices!
                          </p>
                          <p className="text-sm text-muted-foreground">
                            All payments are up to date
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dueInvoices.map((invoice, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {invoice.order_number}
                        </TableCell>
                        <TableCell>{invoice.customers.name}</TableCell>
                        <TableCell>
                          {new Date(invoice.order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-medium ${
                              invoice.daysOverdue > 90
                                ? "text-red-600"
                                : invoice.daysOverdue > 60
                                ? "text-orange-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {invoice.daysOverdue} days
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          LKR {invoice.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.daysOverdue > 90
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : invoice.daysOverdue > 60
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {invoice.daysOverdue > 90
                              ? "Critical"
                              : invoice.daysOverdue > 60
                              ? "High"
                              : "Medium"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {dueInvoices.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>Total Outstanding</TableCell>
                      <TableCell className="text-right text-destructive">
                        LKR{" "}
                        {dueInvoices
                          .reduce((sum, inv) => sum + inv.balance, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Total Revenue
                  </span>
                  <span className="font-bold">
                    LKR {totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Total Cost
                  </span>
                  <span className="font-bold text-red-600">
                    LKR {totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Gross Profit
                  </span>
                  <span className="font-bold text-green-600">
                    LKR {totalProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm text-muted-foreground">
                    Profit Margin
                  </span>
                  <span
                    className={`font-bold text-lg ${getProfitMarginColor(
                      overallProfitMargin
                    )}`}
                  >
                    {overallProfitMargin.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Paid Orders
                  </span>
                  <span className="font-bold text-green-600">
                    LKR {paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Unpaid/Partial
                  </span>
                  <span className="font-bold text-yellow-600">
                    LKR {unpaidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Collection Rate
                  </span>
                  <span className="font-bold">
                    {totalSales > 0
                      ? ((paidAmount / totalSales) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm text-muted-foreground">
                    Overdue Invoices
                  </span>
                  <span className="font-bold text-destructive">
                    {dueInvoices.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Unique Customers
                  </p>
                  <p className="text-3xl font-bold">{customerSummary.length}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Avg Order Value
                  </p>
                  <p className="text-3xl font-bold">
                    LKR {Math.round(avgOrderValue).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
