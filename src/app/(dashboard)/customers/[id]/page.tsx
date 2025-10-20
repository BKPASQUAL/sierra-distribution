// src/app/(dashboard)/customers/[id]/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  FileText,
  Calendar,
  TrendingUp,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock customer data (in real app, fetch by ID)
const mockCustomer = {
  id: 1,
  name: 'Perera Hardware',
  contact: '+94 77 123 4567',
  email: 'perera@hardware.lk',
  city: 'Colombo',
  address: '123 Galle Road, Colombo 03',
  balance: 45000,
  totalOrders: 23,
  totalPaid: 2340000,
  joinedDate: '2023-05-15',
};

// Mock order history
const orderHistory = [
  {
    id: 'ORD-001',
    date: '2025-01-15',
    items: 5,
    total: 125000,
    paid: 125000,
    status: 'Delivered',
  },
  {
    id: 'ORD-002',
    date: '2025-01-10',
    items: 3,
    total: 75000,
    paid: 75000,
    status: 'Delivered',
  },
  {
    id: 'ORD-003',
    date: '2025-01-05',
    items: 8,
    total: 200000,
    paid: 155000,
    status: 'Partially Paid',
  },
  {
    id: 'ORD-004',
    date: '2024-12-28',
    items: 4,
    total: 95000,
    paid: 95000,
    status: 'Delivered',
  },
  {
    id: 'ORD-005',
    date: '2024-12-20',
    items: 6,
    total: 145000,
    paid: 145000,
    status: 'Delivered',
  },
];

// Mock payment history
const paymentHistory = [
  {
    id: 'PAY-001',
    date: '2025-01-15',
    orderId: 'ORD-001',
    amount: 125000,
    method: 'Bank Transfer',
    reference: 'TXN123456',
  },
  {
    id: 'PAY-002',
    date: '2025-01-10',
    orderId: 'ORD-002',
    amount: 75000,
    method: 'Cash',
    reference: 'CASH-001',
  },
  {
    id: 'PAY-003',
    date: '2025-01-08',
    orderId: 'ORD-003',
    amount: 155000,
    method: 'Cheque',
    reference: 'CHQ-789456',
  },
  {
    id: 'PAY-004',
    date: '2024-12-28',
    orderId: 'ORD-004',
    amount: 95000,
    method: 'Bank Transfer',
    reference: 'TXN789123',
  },
];

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/customers')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{mockCustomer.name}</h1>
          <p className="text-muted-foreground mt-1">
            Customer ID: #{customerId}
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
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {mockCustomer.balance.toLocaleString()}
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
            <div className="text-2xl font-bold">{mockCustomer.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {mockCustomer.totalPaid.toLocaleString()}
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
            <div className="text-2xl font-bold">
              {new Date(mockCustomer.joinedDate).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Join date</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Customer contact details and address</CardDescription>
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
                  <p className="font-medium">{mockCustomer.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{mockCustomer.email}</p>
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
                  <p className="font-medium">{mockCustomer.address}</p>
                  <p className="text-sm text-muted-foreground">{mockCustomer.city}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order and Payment History Tabs */}
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
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
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
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
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
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
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