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
  Lock,
  ShieldAlert,
  Receipt,
  Fuel,
  Wrench,
  Scale,
  Wallet,
  Building2,
  TrendingUpDown,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

interface OrderWithProfit {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  total_cost: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  discount_impact: number;
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

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: "fuel" | "maintenance" | "other";
  description: string;
  amount: number;
  payment_method: string;
  vendor_name: string | null;
  notes: string | null;
  users?: {
    name: string;
  };
}

interface ExpenseSummary {
  totalExpenses: number;
  fuelExpenses: number;
  maintenanceExpenses: number;
  otherExpenses: number;
  expenseCount: number;
  avgExpense: number;
  byPaymentMethod: { [key: string]: number };
  byMonth: {
    month: string;
    amount: number;
    fuel: number;
    maintenance: number;
    other: number;
  }[];
  topVendors: { vendor: string; total: number; count: number }[];
}

interface FinancialAccounts {
  tradingAccount: {
    salesRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
    totalDiscounts: number;
    totalOrders: number;
  };
  profitAndLoss: {
    grossProfit: number;
    expenses: {
      fuel: number;
      maintenance: number;
      other: number;
      total: number;
    };
    netProfit: number;
    netProfitMargin: number;
    expenseRatio: number;
  };
  balanceSheet: {
    assets: {
      currentAssets: {
        cash: number;
        bank: number;
        cheques: number;
        accountsReceivable: {
          amount: number;
          invoiceCount: number;
        };
        inventory: {
          atCost: number;
          atMRP: number;
        };
        total: number;
      };
      fixedAssets: number;
      totalAssets: number;
    };
    liabilities: {
      currentLiabilities: {
        accountsPayable: number;
        loans: number;
        total: number;
      };
      longTermLiabilities: number;
      totalLiabilities: number;
    };
    capital: {
      ownersEquity: number;
      retainedEarnings: number;
      totalCapital: number;
    };
  };
  summary: {
    period: {
      startDate: string;
      endDate: string;
    };
    keyMetrics: {
      revenue: number;
      cogs: number;
      grossProfit: number;
      expenses: number;
      netProfit: number;
      grossMargin: number;
      netMargin: number;
    };
  };
}

export default function ReportsPage() {
  // Auth state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  // Data state
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithProfit[]>([]);
  const [customerSummary, setCustomerSummary] = useState<
    CustomerProfitSummary[]
  >([]);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    fuelExpenses: 0,
    maintenanceExpenses: 0,
    otherExpenses: 0,
    expenseCount: 0,
    avgExpense: 0,
    byPaymentMethod: {},
    byMonth: [],
    topVendors: [],
  });
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccounts | null>(null);
  const [loadingFinancialAccounts, setLoadingFinancialAccounts] = useState(false);

  // Filter state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Check user role on mount
  useEffect(() => {
    checkUserRole();
  }, []);

  // Fetch data only if user is admin
  useEffect(() => {
    if (isAdmin) {
      fetchReportData();
    }
  }, [isAdmin]);

  const checkUserRole = async () => {
    try {
      setIsCheckingAuth(true);
      const supabase = createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAdmin(false);
        return;
      }

      const userRole = user.user_metadata?.role;
      const userNameFromMeta = user.user_metadata?.name;

      setUserName(userNameFromMeta || user.email || "User");
      setIsAdmin(userRole === "Admin");

      if (!userRole) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserName(userData.name || user.email || "User");
          setIsAdmin(userData.role === "Admin");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch orders
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (!ordersData.orders) {
        console.error("Failed to fetch orders");
        return;
      }

      const paymentsResponse = await fetch("/api/payments");
      const paymentsData = await paymentsResponse.json();

      const ordersWithProfit: OrderWithProfit[] = ordersData.orders.map(
        (order: any) => {
          const subtotal =
            order.order_items?.reduce((sum: number, item: any) => {
              return sum + item.unit_price * item.quantity;
            }, 0) || 0;

          const totalCost =
            order.order_items?.reduce((sum: number, item: any) => {
              return sum + item.cost_price * item.quantity;
            }, 0) || 0;

          const discountAmount = subtotal - order.total_amount;
          const grossProfit = subtotal - totalCost;
          const netProfit = order.total_amount - totalCost;
          const profitMargin =
            order.total_amount > 0 ? (netProfit / order.total_amount) * 100 : 0;
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

      customerMap.forEach((summary) => {
        summary.avg_profit_margin =
          summary.total_sales > 0
            ? (summary.total_profit / summary.total_sales) * 100
            : 0;

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

      // Fetch expenses
      const expensesResponse = await fetch("/api/expenses");
      const expensesData = await expensesResponse.json();

      if (expensesData.expenses) {
        setExpenses(expensesData.expenses);
        calculateExpenseSummary(expensesData.expenses);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpenseSummary = (expensesData: Expense[]) => {
    const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const fuel = expensesData
      .filter((exp) => exp.category === "fuel")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const maintenance = expensesData
      .filter((exp) => exp.category === "maintenance")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const other = expensesData
      .filter((exp) => exp.category === "other")
      .reduce((sum, exp) => sum + exp.amount, 0);

    // By payment method
    const byPaymentMethod: { [key: string]: number } = {};
    expensesData.forEach((exp) => {
      byPaymentMethod[exp.payment_method] =
        (byPaymentMethod[exp.payment_method] || 0) + exp.amount;
    });

    // By month
    const monthMap = new Map<
      string,
      { amount: number; fuel: number; maintenance: number; other: number }
    >();
    expensesData.forEach((exp) => {
      const month = exp.expense_date.substring(0, 7); // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, { amount: 0, fuel: 0, maintenance: 0, other: 0 });
      }
      const monthData = monthMap.get(month)!;
      monthData.amount += exp.amount;
      if (exp.category === "fuel") monthData.fuel += exp.amount;
      if (exp.category === "maintenance") monthData.maintenance += exp.amount;
      if (exp.category === "other") monthData.other += exp.amount;
    });

    const byMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Top vendors
    const vendorMap = new Map<string, { total: number; count: number }>();
    expensesData.forEach((exp) => {
      if (exp.vendor_name) {
        const current = vendorMap.get(exp.vendor_name) || {
          total: 0,
          count: 0,
        };
        vendorMap.set(exp.vendor_name, {
          total: current.total + exp.amount,
          count: current.count + 1,
        });
      }
    });

    const topVendors = Array.from(vendorMap.entries())
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setExpenseSummary({
      totalExpenses: total,
      fuelExpenses: fuel,
      maintenanceExpenses: maintenance,
      otherExpenses: other,
      expenseCount: expensesData.length,
      avgExpense: expensesData.length > 0 ? total / expensesData.length : 0,
      byPaymentMethod,
      byMonth,
      topVendors,
    });
  };

  const fetchFinancialAccounts = async () => {
    try {
      setLoadingFinancialAccounts(true);

      const params = new URLSearchParams();
      if (dateFrom) params.append("start_date", dateFrom);
      if (dateTo) params.append("end_date", dateTo);

      const response = await fetch(`/api/reports/financial-accounts?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setFinancialAccounts(data);
      } else {
        console.error("Failed to fetch financial accounts:", data.error);
      }
    } catch (error) {
      console.error("Error fetching financial accounts:", error);
    } finally {
      setLoadingFinancialAccounts(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return orderDate >= from && orderDate <= to;
  });

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.expense_date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return expenseDate >= from && expenseDate <= to;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + o.total_cost, 0);
  const totalProfit = totalSales - totalCost;
  const overallProfitMargin =
    totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const paidAmount = filteredOrders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const unpaidAmount = filteredOrders
    .filter((o) => o.payment_status !== "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const filteredExpenseTotal = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

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

  const getCategoryIcon = (category: string) => {
    const icons = {
      fuel: <Fuel className="h-4 w-4" />,
      maintenance: <Wrench className="h-4 w-4" />,
      other: <Receipt className="h-4 w-4" />,
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  // Loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Access Restricted</h2>
                <p className="text-muted-foreground">
                  Sorry, <strong>{userName}</strong>! Only administrators can
                  access the Reports page.
                </p>
              </div>
              <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>This page contains sensitive financial data</span>
                </div>
                <p>If you need access, please contact your administrator</p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading data state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading reports data...
          </p>
        </div>
      </div>
    );
  }

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

  const expenseCategoryData = [
    { name: "Fuel", value: expenseSummary.fuelExpenses, color: "#3b82f6" },
    {
      name: "Maintenance",
      value: expenseSummary.maintenanceExpenses,
      color: "#f97316",
    },
    { name: "Other", value: expenseSummary.otherExpenses, color: "#6b7280" },
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
                    <SelectTrigger className="w-full">
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
              Total Expenses
            </CardTitle>
            <Receipt className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              LKR {filteredExpenseTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredExpenses.length} expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="financial" onClick={fetchFinancialAccounts}>
            <Scale className="w-4 h-4 mr-2" />
            Financial Accounts
          </TabsTrigger>
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
          <TabsTrigger value="expenses">
            <Receipt className="w-4 h-4 mr-2" />
            Expenses
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

        {/* Financial Accounts Tab */}
        <TabsContent value="financial" className="space-y-4">
          {loadingFinancialAccounts ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Loading financial accounts...
                </p>
              </div>
            </div>
          ) : financialAccounts ? (
            <>
              {/* 1. TRADING ACCOUNT */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUpDown className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle>Trading Account</CardTitle>
                      <CardDescription>
                        Direct trading performance (Sales Revenue, COGS, Gross Profit)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Sales Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            LKR {financialAccounts.tradingAccount.salesRevenue.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            From {financialAccounts.tradingAccount.totalOrders} orders
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 dark:border-red-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Cost of Goods Sold (COGS)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600">
                            LKR {financialAccounts.tradingAccount.costOfGoodsSold.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Cost price of goods sold
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gross Profit
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            LKR {financialAccounts.tradingAccount.grossProfit.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Margin: {financialAccounts.tradingAccount.grossProfitMargin.toFixed(2)}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Sales Revenue</span>
                          <span className="font-medium">
                            LKR {financialAccounts.tradingAccount.salesRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-red-600">
                          <span className="text-sm">Less: Cost of Goods Sold</span>
                          <span className="font-medium">
                            (LKR {financialAccounts.tradingAccount.costOfGoodsSold.toLocaleString()})
                          </span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="font-bold">Gross Profit</span>
                          <span className="font-bold text-green-600 text-lg">
                            LKR {financialAccounts.tradingAccount.grossProfit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. PROFIT & LOSS ACCOUNT */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <CardTitle>Profit & Loss Account</CardTitle>
                      <CardDescription>
                        Overall profitability after operating expenses (Net Profit)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gross Profit
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            LKR {financialAccounts.profitAndLoss.grossProfit.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            From trading operations
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-200 dark:border-orange-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Operating Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-orange-600">
                            LKR {financialAccounts.profitAndLoss.expenses.total.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Fuel, Maintenance, Other
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Fuel className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Fuel</span>
                        </div>
                        <div className="text-xl font-bold">
                          LKR {financialAccounts.profitAndLoss.expenses.fuel.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Maintenance</span>
                        </div>
                        <div className="text-xl font-bold">
                          LKR {financialAccounts.profitAndLoss.expenses.maintenance.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">Other</span>
                        </div>
                        <div className="text-xl font-bold">
                          LKR {financialAccounts.profitAndLoss.expenses.other.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Gross Profit</span>
                          <span className="font-medium text-green-600">
                            LKR {financialAccounts.profitAndLoss.grossProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-orange-600">
                          <span className="text-sm">Less: Operating Expenses</span>
                          <span className="font-medium">
                            (LKR {financialAccounts.profitAndLoss.expenses.total.toLocaleString()})
                          </span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="font-bold">Net Profit</span>
                          <span className={`font-bold text-lg ${
                            financialAccounts.profitAndLoss.netProfit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            LKR {financialAccounts.profitAndLoss.netProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Net Profit Margin</span>
                          <span className="font-medium">
                            {financialAccounts.profitAndLoss.netProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. BALANCE SHEET */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <div>
                      <CardTitle>Balance Sheet</CardTitle>
                      <CardDescription>
                        Financial position - Assets, Liabilities, and Capital
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* ASSETS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-lg">ASSETS</h3>
                      </div>

                      <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Current Assets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cash</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.cash.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.bank.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cheques (Pending/Passed)</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.cheques.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Accounts Receivable ({financialAccounts.balanceSheet.assets.currentAssets.accountsReceivable.invoiceCount})
                            </span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.accountsReceivable.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Inventory (at cost)</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.inventory.atCost.toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t pt-2 flex items-center justify-between">
                            <span className="font-bold">Total Current Assets</span>
                            <span className="font-bold text-blue-600">
                              LKR {financialAccounts.balanceSheet.assets.currentAssets.total.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">TOTAL ASSETS</span>
                          <span className="font-bold text-blue-600 text-xl">
                            LKR {financialAccounts.balanceSheet.assets.totalAssets.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LIABILITIES & CAPITAL */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-lg">LIABILITIES & CAPITAL</h3>
                      </div>

                      <Card className="border-red-200 dark:border-red-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Current Liabilities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Accounts Payable</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.liabilities.currentLiabilities.accountsPayable.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Loans</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.liabilities.currentLiabilities.loans.toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t pt-2 flex items-center justify-between">
                            <span className="font-bold">Total Liabilities</span>
                            <span className="font-bold text-red-600">
                              LKR {financialAccounts.balanceSheet.liabilities.totalLiabilities.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Owner's Equity/Capital</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Owner's Equity</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.capital.ownersEquity.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Retained Earnings (Current)</span>
                            <span className="font-medium">
                              LKR {financialAccounts.balanceSheet.capital.retainedEarnings.toLocaleString()}
                            </span>
                          </div>
                          <div className="border-t pt-2 flex items-center justify-between">
                            <span className="font-bold">Total Capital</span>
                            <span className="font-bold text-green-600">
                              LKR {financialAccounts.balanceSheet.capital.totalCapital.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-900/10">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">TOTAL LIABILITIES + CAPITAL</span>
                          <span className="font-bold text-purple-600 text-xl">
                            LKR {(financialAccounts.balanceSheet.liabilities.totalLiabilities +
                                  financialAccounts.balanceSheet.capital.totalCapital).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Sheet Equation */}
                  <div className="mt-6 p-4 rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        Balance Sheet Equation
                      </p>
                      <p className="text-lg font-bold">
                        Assets = Liabilities + Capital
                      </p>
                      <p className="text-sm">
                        LKR {financialAccounts.balanceSheet.assets.totalAssets.toLocaleString()} =
                        LKR {financialAccounts.balanceSheet.liabilities.totalLiabilities.toLocaleString()} +
                        LKR {financialAccounts.balanceSheet.capital.totalCapital.toLocaleString()}
                      </p>
                      {Math.abs(
                        financialAccounts.balanceSheet.assets.totalAssets -
                        (financialAccounts.balanceSheet.liabilities.totalLiabilities +
                         financialAccounts.balanceSheet.capital.totalCapital)
                      ) < 1 ? (
                        <p className="text-green-600 text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Balance Sheet is Balanced
                        </p>
                      ) : (
                        <p className="text-orange-600 text-sm font-medium flex items-center justify-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Small variance due to rounding
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Overview */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>
                    Period: {financialAccounts.summary.period.startDate} to {financialAccounts.summary.period.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                      <p className="text-2xl font-bold">
                        LKR {financialAccounts.summary.keyMetrics.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">COGS</p>
                      <p className="text-2xl font-bold text-red-600">
                        LKR {financialAccounts.summary.keyMetrics.cogs.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Gross Profit</p>
                      <p className="text-2xl font-bold text-green-600">
                        LKR {financialAccounts.summary.keyMetrics.grossProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Margin: {financialAccounts.summary.keyMetrics.grossMargin.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                      <p className={`text-2xl font-bold ${
                        financialAccounts.summary.keyMetrics.netProfit >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        LKR {financialAccounts.summary.keyMetrics.netProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Margin: {financialAccounts.summary.keyMetrics.netMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Scale className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Financial Accounts</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click the tab or refresh to load financial accounts data
                    </p>
                  </div>
                  <Button onClick={fetchFinancialAccounts}>
                    Load Financial Accounts
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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

        {/* Expenses Tab - NEW! */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Expense Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  LKR {filteredExpenseTotal.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredExpenses.length} expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Fuel Expenses
                </CardTitle>
                <Fuel className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  LKR{" "}
                  {filteredExpenses
                    .filter((e) => e.category === "fuel")
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredExpenses.filter((e) => e.category === "fuel").length}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Maintenance
                </CardTitle>
                <Wrench className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  LKR{" "}
                  {filteredExpenses
                    .filter((e) => e.category === "maintenance")
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    filteredExpenses.filter((e) => e.category === "maintenance")
                      .length
                  }{" "}
                  transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Other Expenses
                </CardTitle>
                <Receipt className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  LKR{" "}
                  {filteredExpenses
                    .filter((e) => e.category === "other")
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    filteredExpenses.filter((e) => e.category === "other")
                      .length
                  }{" "}
                  transactions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Expense by Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                  Distribution of expenses across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) =>
                        `${entry.name}: ${(
                          (entry.value / expenseSummary.totalExpenses) *
                          100
                        ).toFixed(1)}%`
                      }
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `LKR ${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Expenses by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expenseSummary.byPaymentMethod).map(
                    ([method, amount]) => (
                      <div
                        key={method}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {method.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {
                              filteredExpenses.filter(
                                (e) => e.payment_method === method
                              ).length
                            }{" "}
                            transactions
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          LKR {amount.toLocaleString()}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Trends</CardTitle>
              <CardDescription>
                Expense breakdown by category over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={expenseSummary.byMonth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
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
                  <Line
                    type="monotone"
                    dataKey="fuel"
                    stroke="#3b82f6"
                    name="Fuel"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="maintenance"
                    stroke="#f97316"
                    name="Maintenance"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="other"
                    stroke="#6b7280"
                    name="Other"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#ef4444"
                    name="Total"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          {expenseSummary.topVendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>
                  Vendors with highest expense amounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Avg Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseSummary.topVendors.map((vendor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {vendor.vendor}
                        </TableCell>
                        <TableCell className="text-right">
                          {vendor.count}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {vendor.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          LKR{" "}
                          {Math.round(
                            vendor.total / vendor.count
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {expenseSummary.topVendors.reduce(
                          (sum, v) => sum + v.count,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR{" "}
                        {expenseSummary.topVendors
                          .reduce((sum, v) => sum + v.total, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Detailed Expense List */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>
                All expenses in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No expenses found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses
                      .sort(
                        (a, b) =>
                          new Date(b.expense_date).getTime() -
                          new Date(a.expense_date).getTime()
                      )
                      .map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {expense.expense_number}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              expense.expense_date
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(expense.category)}
                              <span className="capitalize">
                                {expense.category}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{expense.vendor_name || "-"}</TableCell>
                          <TableCell className="capitalize">
                            {expense.payment_method.replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            LKR {expense.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {expense.users?.name || "Unknown"}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  {filteredExpenses.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={6}>Total Expenses</TableCell>
                      <TableCell className="text-right text-red-600">
                        LKR {filteredExpenseTotal.toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Total Expenses
                  </span>
                  <span className="font-bold text-orange-600">
                    -LKR {filteredExpenseTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-sm text-muted-foreground">
                    Net Profit (After Expenses)
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      totalProfit - filteredExpenseTotal > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    LKR {(totalProfit - filteredExpenseTotal).toLocaleString()}
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
              <div className="grid gap-4 md:grid-cols-4">
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
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    LKR {filteredExpenseTotal.toLocaleString()}
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
