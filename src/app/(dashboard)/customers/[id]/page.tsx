// src/app/(dashboard)/customers/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  TrendingUp,
  Edit,
  Loader2, // Used for loading state
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// -----------------------------------------------------------
// 1. Types mirroring Database Schema (and required UI fields)
// -----------------------------------------------------------
interface Customer {
  id: string; // UUID in Supabase
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  outstanding_balance: number; // Matches the DB field
  created_at: string; // Used as the joined date
  // Mocked fields to keep UI functional until full backend logic is implemented
  totalOrders: number;
  totalPaid: number;
}

// Mock derived data (for Orders/Payments Tabs and Stats - replace with API calls later)
const mockDerivedData = {
  totalOrders: 23,
  totalPaid: 2340000,
};

// Mock order history (for UI only)
const orderHistory = [
  {
    id: "ORD-001",
    date: "2025-01-15",
    items: 5,
    total: 125000,
    paid: 125000,
    status: "Delivered",
  },
  {
    id: "ORD-002",
    date: "2025-01-10",
    items: 3,
    total: 75000,
    paid: 75000,
    status: "Delivered",
  },
  {
    id: "ORD-003",
    date: "2025-01-05",
    items: 8,
    total: 200000,
    paid: 155000,
    status: "Partially Paid",
  },
  {
    id: "ORD-004",
    date: "2024-12-28",
    items: 4,
    total: 95000,
    paid: 95000,
    status: "Delivered",
  },
  {
    id: "ORD-005",
    date: "2024-12-20",
    items: 6,
    total: 145000,
    paid: 145000,
    status: "Delivered",
  },
];

// Mock payment history (for UI only)
const paymentHistory = [
  {
    id: "PAY-001",
    date: "2025-01-15",
    orderId: "ORD-001",
    amount: 125000,
    method: "Bank Transfer",
    reference: "TXN123456",
  },
  {
    id: "PAY-002",
    date: "2025-01-10",
    orderId: "ORD-002",
    amount: 75000,
    method: "Cash",
    reference: "CASH-001",
  },
  {
    id: "PAY-003",
    date: "2025-01-08",
    orderId: "ORD-003",
    amount: 155000,
    method: "Cheque",
    reference: "CHQ-789456",
  },
  {
    id: "PAY-004",
    date: "2024-12-28",
    orderId: "ORD-004",
    amount: 95000,
    method: "Bank Transfer",
    reference: "TXN789123",
  },
];

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  // Safely cast params.id to string
  const customerId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------
  // 2. Data Fetching Hook
  // -----------------------------------------------------------
  useEffect(() => {
    async function fetchCustomer() {
      if (!customerId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch customer details using the Customer by ID API route
        const response = await fetch(`/api/customers/${customerId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to fetch customer ${customerId}`
          );
        }

        // Map API response to our local Customer interface, injecting mock derived data
        const fetchedCustomer: Customer = {
          ...data.customer,
          id: data.customer.id,
          outstanding_balance: data.customer.outstanding_balance ?? 0,
          // Inject mock derived data to keep the UI functional
          totalOrders: mockDerivedData.totalOrders,
          totalPaid: mockDerivedData.totalPaid,
        };

        setCustomer(fetchedCustomer);
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [customerId]);

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
          Failed to load customer details for ID: {customerId}.
        </p>
        {error && <p className="text-red-500">Details: {error}</p>}
        <Button onClick={() => router.push("/customers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers List
        </Button>
      </div>
    );
  }

  // Assign fetched customer data to a local variable for cleaner access in JSX
  const currentCustomer = customer;

  // We use 'created_at' as 'joinedDate'
  const joinedDate = new Date(currentCustomer.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );

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
          <h1 className="text-3xl font-bold tracking-tight">
            {currentCustomer.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer ID: #{currentCustomer.customer_code}
          </p>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Customer
        </Button>
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
              LKR {currentCustomer.outstanding_balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCustomer.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {currentCustomer.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{joinedDate}</div>
            <p className="text-xs text-muted-foreground mt-1">Join date</p>
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
                  <p className="font-medium">{currentCustomer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{currentCustomer.email}</p>
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
                  <p className="font-medium">{currentCustomer.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCustomer.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order and Payment History Tabs (Still using mocks) */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Order History Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    Complete list of customer orders
                  </CardDescription>
                </div>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderHistory.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.items} items</TableCell>
                      <TableCell className="text-right">
                        LKR {order.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {order.paid.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    All payments received from this customer
                  </CardDescription>
                </div>
                <Button size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.id}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.orderId}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.reference}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {payment.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
