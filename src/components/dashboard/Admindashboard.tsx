"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  TrendingUp,
  Plus,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface DashboardStats {
  salesToday: {
    amount: number;
    change: number;
    comparison: number;
  };
  salesThisMonth: {
    amount: number;
    change: number;
    comparison: number;
  };
  totalCustomers: {
    count: number;
    newThisMonth: number;
  };
  totalDue: {
    amount: number;
    invoices: number;
  };
  salesChart: Array<{
    name: string;
    sales: number;
    date: string;
  }>;
  stockValue: {
    total: number;
    cost: number;
    items: number;
  };
}

interface PendingCheque {
  id: string;
  payment_number: string;
  payment_date: string;
  cheque_number: string;
  cheque_date: string;
  amount: number;
  customer_name: string;
  order_number: string | null;
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingCheques, setPendingCheques] = useState<PendingCheque[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCheques, setLoadingCheques] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchPendingCheques();
    fetchLowStockItems();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingCheques = async () => {
    try {
      setLoadingCheques(true);
      const response = await fetch("/api/payments?cheque_status=pending");
      if (response.ok) {
        const data = await response.json();
        setPendingCheques(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching pending cheques:", error);
    } finally {
      setLoadingCheques(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      setLoadingStock(true);
      const response = await fetch("/api/products?low_stock=true");
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const getChequeStatusBadge = (chequeDate: string) => {
    const today = new Date();
    const chequeDateObj = new Date(chequeDate);
    const daysDiff = Math.floor(
      (today.getTime() - chequeDateObj.getTime()) / (1000 * 3600 * 24)
    );

    if (daysDiff > 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue ({daysDiff} days)
        </span>
      );
    } else if (daysDiff >= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          Due
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="w-3 h-3 mr-1" />
          Upcoming
        </span>
      );
    }
  };

  // Loading state
  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Filter by Date
          </Button>
          <Button size="sm" onClick={() => router.push('/reports')}>
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          onClick={() => router.push("/bills/new")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Create Bill</h3>
                <p className="text-sm opacity-90">
                  Generate a new customer invoice
                </p>
              </div>
              <Button size="icon" variant="secondary" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card
          className="bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
          onClick={() => router.push("/products")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Add Product</h3>
                <p className="text-sm text-muted-foreground">
                  Add new wire to inventory
                </p>
              </div>
              <Button size="icon" variant="outline" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales (Today)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {stats?.salesToday.amount.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {stats && stats.salesToday.change >= 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    +{stats.salesToday.change.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {stats?.salesToday.change.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1">from yesterday</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Sales This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales (Month)
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {stats?.salesThisMonth.amount.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {stats && stats.salesThisMonth.change >= 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-500">
                    +{stats.salesThisMonth.change.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {stats?.salesThisMonth.change.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCustomers.count.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">
                +{stats?.totalCustomers.newThisMonth || 0}
              </span>
              <span className="ml-1">new this month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Due Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Due Amount
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {stats?.totalDue.amount.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-red-500">
                {stats?.totalDue.invoices || 0} overdue
              </span>
              <span className="ml-1">invoices</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Stock Value Section */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Sales Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Your sales performance for the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.salesChart || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Value Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Total Stock Value</CardTitle>
            <CardDescription>Current inventory worth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Package className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold">
                    LKR {stats?.stockValue.total.toLocaleString() || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across {stats?.stockValue.items.toLocaleString() || 0} items
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={stats?.salesChart.slice(-5) || []}>
                    <Bar
                      dataKey="sales"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Cheques and Low Stock Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Cheques Table */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Cheques</CardTitle>
                <CardDescription>Cheques waiting to be cleared</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/payments")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loadingCheques ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingCheques.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending cheques</p>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="block lg:hidden space-y-4">
                  {pendingCheques.slice(0, 5).map((cheque) => (
                    <div key={cheque.id} className="bg-card border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{cheque.customer_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                             {new Date(cheque.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        {getChequeStatusBadge(cheque.cheque_date)}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm border-t pt-3 mt-2">
                        <span className="text-muted-foreground">Cheque No</span>
                        <span className="font-mono">{cheque.cheque_number}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">LKR {cheque.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-12">
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Cheque No</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCheques.slice(0, 5).map((cheque) => (
                        <TableRow key={cheque.id} className="h-16">
                          <TableCell className="whitespace-nowrap">
                            {new Date(cheque.payment_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {cheque.customer_name}
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {cheque.cheque_number}
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            LKR {cheque.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getChequeStatusBadge(cheque.cheque_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Items that need reordering</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/products")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loadingStock ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">All items are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors h-20"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Current: {item.stock_quantity} | Min: {item.reorder_level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="text-xs font-medium text-destructive">
                          {Math.round(
                            (item.stock_quantity / item.reorder_level) * 100
                          )}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          Need {item.reorder_level - item.stock_quantity}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/purchases")}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>
                ))}
              </div> 
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}