// src/app/(dashboard)/customers/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  TrendingUp,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types matching your API responses
interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  outstanding_balance: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  payment_status: "paid" | "partial" | "unpaid";
  // Computed fields
  paid_amount?: number;
  balance?: number;
  due_date?: string;
}

interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  order_id: string | null;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: "pending" | "deposited" | "passed" | "returned" | null;
  // Mapped field for display
  order_number?: string;
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Derived stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPaid: 0,
    pendingChequesCount: 0,
    pendingChequesValue: 0,
  });

  useEffect(() => {
    if (customerId) {
      fetchAllData();
    }
  }, [customerId]);

  // Reset pagination when search changes
  useEffect(() => {
    setOrdersPage(1);
    setPaymentsPage(1);
  }, [searchQuery]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Customer Details
      const customerRes = await fetch(`/api/customers/${customerId}`);
      const customerData = await customerRes.json();

      if (!customerRes.ok)
        throw new Error(customerData.error || "Failed to fetch customer");

      setCustomer(customerData.customer);

      // 2. Fetch All Orders
      const ordersRes = await fetch("/api/orders");
      const ordersData = await ordersRes.json();

      // 3. Fetch All Payments
      const paymentsRes = await fetch("/api/payments");
      const paymentsData = await paymentsRes.json();

      if (ordersData.orders && paymentsData.payments) {
        // Filter for this customer
        const customerPaymentsRaw: Payment[] = paymentsData.payments.filter(
          (p: Payment) => p.customer_id === customerId
        );

        const customerOrders: Order[] = ordersData.orders
          .filter((o: Order) => o.customer_id === customerId)
          .map((order: Order) => {
            // Calculate paid amount per order
            const orderPayments = customerPaymentsRaw.filter(
              (p) => p.order_id === order.id && p.cheque_status !== "returned"
            );
            const paid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
            const balance = order.total_amount - paid;

            // Calculate Due Date (Assumption: 30 days from order date)
            const orderDate = new Date(order.order_date);
            const dueDate = new Date(orderDate);
            dueDate.setDate(orderDate.getDate() + 30);

            return {
              ...order,
              paid_amount: paid,
              balance: balance,
              due_date: dueDate.toISOString(),
            };
          });

        // Enrich payments with Order Number for the table
        const customerPayments: Payment[] = customerPaymentsRaw.map((p) => {
          const relatedOrder = customerOrders.find((o) => o.id === p.order_id);
          return {
            ...p,
            order_number: relatedOrder ? relatedOrder.order_number : "-",
          };
        });

        setOrders(customerOrders);
        setPayments(customerPayments);

        // Calculate Stats
        const totalOrdersCount = customerOrders.length;
        const totalPaidValue = customerPayments
          .filter((p) => p.cheque_status !== "returned")
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingCheques = customerPayments.filter(
          (p) =>
            p.payment_method === "cheque" &&
            (p.cheque_status === "pending" || p.cheque_status === "deposited")
        );

        setStats({
          totalOrders: totalOrdersCount,
          totalPaid: totalPaidValue,
          pendingChequesCount: pendingCheques.length,
          pendingChequesValue: pendingCheques.reduce(
            (sum, p) => sum + p.amount,
            0
          ),
        });
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering and Pagination Logic ---

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (ordersPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, ordersPage, itemsPerPage]);

  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.payment_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        payment.payment_method
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (payment.order_number &&
          payment.order_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (payment.cheque_number &&
          payment.cheque_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (payment.reference_number &&
          payment.reference_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
    );
  }, [payments, searchQuery]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (paymentsPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, paymentsPage, itemsPerPage]);

  const totalPaymentPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // --- Helper Functions ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getChequeStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "deposited":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600">
            <Clock className="w-3 h-3 mr-1" /> Deposited
          </Badge>
        );
      case "passed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Passed
          </Badge>
        );
      case "returned":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Returned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">
          Loading customer details...
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">
          Failed to load customer details.
        </p>
        {error && <p className="text-red-500">Details: {error}</p>}
        <Button onClick={() => router.push("/customers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers List
        </Button>
      </div>
    );
  }

  const joinedDate = new Date(customer.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/customers")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground mt-1">
            Customer ID: #{customer.customer_code}
          </p>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(customer.outstanding_balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Cheques
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingChequesValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingChequesCount} cheques processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {joinedDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Customer contact details and address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{customer.phone || "N/A"}</p>
                </div>
              </div>
  
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order and Payment History Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              Rows:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setOrdersPage(1);
                setPaymentsPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order History Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  Complete list of customer orders
                </CardDescription>
              </div>
              {/* Search Bar - Right Side Top */}
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {paginatedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No orders found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => {
                      const isOverdue =
                        order.balance! > 0 &&
                        new Date(order.due_date!) < new Date();
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={isOverdue ? "text-destructive" : ""}
                            >
                              {new Date(order.due_date!).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(order.paid_amount || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {order.balance! > 0
                              ? formatCurrency(order.balance!)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                order.payment_status
                              )}`}
                            >
                              {order.payment_status.toUpperCase()}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {/* Order Pagination */}
            {filteredOrders.length > 0 && (
              <CardFooter className="flex items-center justify-between border-t py-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (ordersPage - 1) * itemsPerPage + 1,
                    filteredOrders.length
                  )}{" "}
                  to{" "}
                  {Math.min(ordersPage * itemsPerPage, filteredOrders.length)}{" "}
                  of {filteredOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOrdersPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={ordersPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOrdersPage((prev) =>
                        Math.min(prev + 1, totalOrderPages)
                      )
                    }
                    disabled={ordersPage === totalOrderPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All payments received from this customer
                </CardDescription>
              </div>
              {/* Search Bar - Right Side Top */}
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {paginatedPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payments found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment No</TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference / Cheque</TableHead>
                      <TableHead>Cheque Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.payment_number}
                        </TableCell>
                        {/* Display Mapped Order Number */}
                        <TableCell className="font-medium text-muted-foreground">
                          {payment.order_number}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.payment_method === "cheque"
                            ? `Cheque: ${payment.cheque_number}`
                            : payment.reference_number || "-"}
                        </TableCell>
                        <TableCell>
                          {payment.cheque_date
                            ? new Date(payment.cheque_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {getChequeStatusBadge(payment.cheque_status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {/* Payment Pagination */}
            {filteredPayments.length > 0 && (
              <CardFooter className="flex items-center justify-between border-t py-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (paymentsPage - 1) * itemsPerPage + 1,
                    filteredPayments.length
                  )}{" "}
                  to{" "}
                  {Math.min(
                    paymentsPage * itemsPerPage,
                    filteredPayments.length
                  )}{" "}
                  of {filteredPayments.length} payments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPaymentsPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={paymentsPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPaymentsPage((prev) =>
                        Math.min(prev + 1, totalPaymentPages)
                      )
                    }
                    disabled={paymentsPage === totalPaymentPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
