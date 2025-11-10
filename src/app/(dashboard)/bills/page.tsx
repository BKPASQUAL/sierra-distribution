// src/app/(dashboard)/bills/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, Calendar, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for API data
interface Customer {
  name: string;
  phone: string | null;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: "unpaid" | "partial" | "paid";
  payment_method: string | null;
  customers: Customer;
  paid_amount?: number;
  due_amount?: number;
}

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  cheque_status: "pending" | "passed" | "returned" | null;
}

export default function BillsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch orders and payments from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await fetch("/api/orders");
        const ordersData = await ordersResponse.json();

        // Fetch payments
        const paymentsResponse = await fetch("/api/payments");
        const paymentsData = await paymentsResponse.json();

        if (ordersData.orders && paymentsData.payments) {
          const ordersWithBalance = ordersData.orders.map((order: Order) => {
            // Calculate paid amount for this order (exclude returned cheques)
            const orderPayments = paymentsData.payments.filter(
              (p: Payment) =>
                p.order_id === order.id && p.cheque_status !== "returned"
            );

            const paidAmount = orderPayments.reduce(
              (sum: number, p: Payment) => sum + p.amount,
              0
            );

            const dueAmount = order.total_amount - paidAmount;

            return {
              ...order,
              paid_amount: paidAmount,
              due_amount: dueAmount,
            };
          });

          setOrders(ordersWithBalance);
          setPayments(paymentsData.payments);
        } else {
          console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Network error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch customers for filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (data.customers) {
          setCustomers(data.customers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer =
      customerFilter === "all" || order.customer_id === customerFilter;

    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.payment_status === paymentStatusFilter;

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.payment_method === paymentMethodFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.order_date);
      const now = new Date();

      if (dateFilter === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
      }
    }

    return (
      matchesSearch &&
      matchesCustomer &&
      matchesPaymentStatus &&
      matchesPaymentMethod &&
      matchesDate
    );
  });

  // Calculate stats
  const totalBills = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  // Calculate total balance (sum of all due amounts)
  const totalBalance = orders.reduce((sum, o) => sum + (o.due_amount || 0), 0);

  const pendingBills = orders.filter((o) => o.payment_status !== "paid").length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "unpaid":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return "-";

    const colors: { [key: string]: string } = {
      cash: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      credit:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      bank: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      cheque:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    };

    const color = colors[method.toLowerCase()] || colors.cash;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
      >
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Bills</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/bills/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Billed amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingBills}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bills with balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={paymentStatusFilter}
                onValueChange={setPaymentStatusFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customers.name}
                    </TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      LKR {(order.paid_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.payment_status === "paid" ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-semibold text-destructive">
                          LKR {(order.due_amount || 0).toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          (window.location.href = `/bills/${order.id}`)
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
