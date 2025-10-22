// src/app/(dashboard)/reports/page.tsx
"use client";

import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  File,
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
} from "recharts";

// Mock data for reports
const dailySalesData = [
  { date: "2025-01-15", sales: 245000, orders: 5, customers: 4 },
  { date: "2025-01-16", sales: 180000, orders: 3, customers: 3 },
  { date: "2025-01-17", sales: 425000, orders: 6, customers: 5 },
  { date: "2025-01-18", sales: 165000, orders: 2, customers: 2 },
  { date: "2025-01-19", sales: 320000, orders: 4, customers: 3 },
  { date: "2025-01-20", sales: 280000, orders: 5, customers: 4 },
  { date: "2025-01-21", sales: 395000, orders: 7, customers: 6 },
];

const customerSalesData = [
  {
    customer: "Perera Hardware",
    orders: 23,
    totalSales: 2340000,
    outstanding: 0,
  },
  {
    customer: "Fernando Constructions",
    orders: 45,
    totalSales: 5600000,
    outstanding: 125000,
  },
  {
    customer: "Silva Electricals",
    orders: 15,
    totalSales: 1500000,
    outstanding: 0,
  },
  {
    customer: "Jayasinghe Hardware Store",
    orders: 12,
    totalSales: 890000,
    outstanding: 23000,
  },
  {
    customer: "Mendis Electrician Services",
    orders: 34,
    totalSales: 3200000,
    outstanding: 320000,
  },
];

const supplierPurchaseData = [
  { supplier: "Sierra Cables Ltd", purchases: 45, totalAmount: 12500000 },
  { supplier: "Lanka Wire Industries", purchases: 32, totalAmount: 8900000 },
  {
    supplier: "Ceylon Electrical Supplies",
    purchases: 18,
    totalAmount: 3400000,
  },
  {
    supplier: "National Cable Corporation",
    purchases: 28,
    totalAmount: 6700000,
  },
  { supplier: "Asia Wire Manufacturing", purchases: 22, totalAmount: 5200000 },
];

const duePaymentData = [
  {
    customer: "Fernando Constructions",
    invoice: "INV-003",
    daysOverdue: 68,
    balance: 125000,
  },
  {
    customer: "Mendis Electrician Services",
    invoice: "INV-005",
    daysOverdue: 63,
    balance: 320000,
  },
  {
    customer: "Perera Hardware",
    invoice: "INV-009",
    daysOverdue: 58,
    balance: 100000,
  },
  {
    customer: "Silva Electricals",
    invoice: "INV-012",
    daysOverdue: 52,
    balance: 125000,
  },
  {
    customer: "Jayasinghe Hardware Store",
    invoice: "INV-015",
    daysOverdue: 50,
    balance: 145000,
  },
];

const stockReportData = [
  {
    product: "2.5mm Single Core Wire",
    stock: 45,
    minStock: 50,
    status: "Low",
    value: 112500,
  },
  {
    product: "4.0mm Multi-strand Cable",
    stock: 28,
    minStock: 30,
    status: "Low",
    value: 98000,
  },
  {
    product: "1.5mm Flexible Wire",
    stock: 62,
    minStock: 40,
    status: "Good",
    value: 111600,
  },
  {
    product: "6.0mm House Wire",
    stock: 15,
    minStock: 20,
    status: "Low",
    value: 63000,
  },
  {
    product: "10mm Armoured Cable",
    stock: 8,
    minStock: 20,
    status: "Critical",
    value: 68000,
  },
  {
    product: "16mm Single Core Wire",
    stock: 52,
    minStock: 25,
    status: "Good",
    value: 353600,
  },
  {
    product: "2.5mm Twin & Earth Cable",
    stock: 450,
    minStock: 500,
    status: "Low",
    value: 38250,
  },
  {
    product: "1.0mm Single Core Wire",
    stock: 55,
    minStock: 40,
    status: "Good",
    value: 66000,
  },
];

const monthlySalesChart = [
  { month: "Jul", sales: 4500000 },
  { month: "Aug", sales: 5200000 },
  { month: "Sep", sales: 4800000 },
  { month: "Oct", sales: 6100000 },
  { month: "Nov", sales: 5700000 },
  { month: "Dec", sales: 6800000 },
  { month: "Jan", sales: 7200000 },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily-sales");
  const [dateFrom, setDateFrom] = useState("2025-01-15");
  const [dateTo, setDateTo] = useState("2025-01-22");
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const handleExportPDF = () => {
    alert(
      "Exporting to PDF...\nThis would generate a PDF file with the current report."
    );
    console.log("Export PDF:", { reportType, dateFrom, dateTo });
  };

  const handleExportExcel = () => {
    alert(
      "Exporting to Excel...\nThis would generate an Excel file with the current report data."
    );
    console.log("Export Excel:", { reportType, dateFrom, dateTo });
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Low":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Good":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and export business reports
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
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
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
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="invisible">Action</Label>
              <Button className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">
            <TrendingUp className="w-4 h-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="due">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Due Payments
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="w-4 h-4 mr-2" />
            Stock
          </TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  LKR{" "}
                  {dailySalesData
                    .reduce((sum, d) => sum + d.sales, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailySalesData.reduce((sum, d) => sum + d.orders, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  LKR{" "}
                  {Math.round(
                    dailySalesData.reduce((sum, d) => sum + d.sales, 0) /
                      dailySalesData.reduce((sum, d) => sum + d.orders, 0)
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per order</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Sales performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
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
                      "Sales",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySalesData.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">{day.orders}</TableCell>
                      <TableCell className="text-right">
                        {day.customers}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {day.sales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        LKR{" "}
                        {Math.round(day.sales / day.orders).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {dailySalesData.reduce((sum, d) => sum + d.orders, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Set(dailySalesData.map((d) => d.customers)).size}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR{" "}
                      {dailySalesData
                        .reduce((sum, d) => sum + d.sales, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR{" "}
                      {Math.round(
                        dailySalesData.reduce((sum, d) => sum + d.sales, 0) /
                          dailySalesData.reduce((sum, d) => sum + d.orders, 0)
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Sales Summary Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Sales Summary</CardTitle>
              <CardDescription>Sales performance by customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSalesData.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {customer.customer}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.orders}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {customer.totalSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        LKR{" "}
                        {Math.round(
                          customer.totalSales / customer.orders
                        ).toLocaleString()}
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
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {customerSalesData.reduce((sum, c) => sum + c.orders, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR{" "}
                      {customerSalesData
                        .reduce((sum, c) => sum + c.totalSales, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right text-destructive">
                      LKR{" "}
                      {customerSalesData
                        .reduce((sum, c) => sum + c.outstanding, 0)
                        .toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerSalesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="customer"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `LKR ${value.toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Bar
                    dataKey="totalSales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Purchase Summary Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Purchase Summary</CardTitle>
              <CardDescription>Purchase analysis by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Avg Purchase</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPurchaseData.map((supplier, index) => {
                    const total = supplierPurchaseData.reduce(
                      (sum, s) => sum + s.totalAmount,
                      0
                    );
                    const percentage = (
                      (supplier.totalAmount / total) *
                      100
                    ).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {supplier.supplier}
                        </TableCell>
                        <TableCell className="text-right">
                          {supplier.purchases}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {supplier.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          LKR{" "}
                          {Math.round(
                            supplier.totalAmount / supplier.purchases
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {percentage}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {supplierPurchaseData.reduce(
                        (sum, s) => sum + s.purchases,
                        0
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR{" "}
                      {supplierPurchaseData
                        .reduce((sum, s) => sum + s.totalAmount, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Due Payment Report Tab */}
        <TabsContent value="due" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Due Payment Report</CardTitle>
              <CardDescription>
                Overdue invoices requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duePaymentData.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {payment.customer}
                      </TableCell>
                      <TableCell>{payment.invoice}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            payment.daysOverdue > 90
                              ? "text-red-600"
                              : payment.daysOverdue > 60
                              ? "text-orange-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {payment.daysOverdue} days
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        LKR {payment.balance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.daysOverdue > 90
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : payment.daysOverdue > 60
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {payment.daysOverdue > 90
                            ? "Critical"
                            : payment.daysOverdue > 60
                            ? "High"
                            : "Medium"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3}>Total Outstanding</TableCell>
                    <TableCell className="text-right text-destructive">
                      LKR{" "}
                      {duePaymentData
                        .reduce((sum, p) => sum + p.balance, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Report Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Stock Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  LKR{" "}
                  {stockReportData
                    .reduce((sum, s) => sum + s.value, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current inventory
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stockReportData.filter((s) => s.status === "Low").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need reordering
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {
                    stockReportData.filter((s) => s.status === "Critical")
                      .length
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Urgent action
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Report</CardTitle>
              <CardDescription>
                Current inventory levels and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Stock</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockReportData.map((stock, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {stock.product}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.stock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stock.minStock}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {stock.value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusBadge(
                            stock.status
                          )}`}
                        >
                          {stock.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3}>Total Stock Value</TableCell>
                    <TableCell className="text-right">
                      LKR{" "}
                      {stockReportData
                        .reduce((sum, s) => sum + s.value, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
