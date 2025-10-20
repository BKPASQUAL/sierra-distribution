// src/app/(dashboard)/suppliers/[id]/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Edit,
  Package
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

// Mock supplier data (in real app, fetch by ID)
const mockSupplier = {
  id: 1,
  name: 'Sierra Cables Ltd',
  contact: '+94 11 234 5678',
  email: 'sales@sierracables.lk',
  city: 'Colombo',
  address: '456 Industrial Zone, Colombo 10',
  category: 'Cables & Wires',
  totalPurchases: 45,
  totalAmount: 12500000,
  lastPurchase: '2025-01-15',
  joinedDate: '2022-03-10',
};

// Mock purchase history
const purchaseHistory = [
  {
    id: 'PUR-001',
    date: '2025-01-15',
    items: [
      { name: '2.5mm Single Core Wire', quantity: 50, unit: 'rolls', price: 2500 },
      { name: '4.0mm Multi-strand Cable', quantity: 30, unit: 'rolls', price: 3500 },
    ],
    total: 230000,
    status: 'Received',
    paymentStatus: 'Paid',
  },
  {
    id: 'PUR-002',
    date: '2025-01-10',
    items: [
      { name: '1.5mm Flexible Wire', quantity: 100, unit: 'rolls', price: 1800 },
      { name: '6.0mm House Wire', quantity: 40, unit: 'rolls', price: 4200 },
    ],
    total: 348000,
    status: 'Received',
    paymentStatus: 'Paid',
  },
  {
    id: 'PUR-003',
    date: '2025-01-05',
    items: [
      { name: '2.5mm Single Core Wire', quantity: 75, unit: 'rolls', price: 2500 },
      { name: '10mm Armoured Cable', quantity: 20, unit: 'rolls', price: 8500 },
    ],
    total: 357500,
    status: 'Received',
    paymentStatus: 'Pending',
  },
  {
    id: 'PUR-004',
    date: '2024-12-28',
    items: [
      { name: '4.0mm Multi-strand Cable', quantity: 60, unit: 'rolls', price: 3500 },
    ],
    total: 210000,
    status: 'Received',
    paymentStatus: 'Paid',
  },
  {
    id: 'PUR-005',
    date: '2024-12-20',
    items: [
      { name: '1.5mm Flexible Wire', quantity: 120, unit: 'rolls', price: 1800 },
      { name: '2.5mm Single Core Wire', quantity: 80, unit: 'rolls', price: 2500 },
    ],
    total: 416000,
    status: 'Received',
    paymentStatus: 'Paid',
  },
];

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/suppliers')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{mockSupplier.name}</h1>
          <p className="text-muted-foreground mt-1">
            Supplier ID: #{supplierId} • {mockSupplier.category}
          </p>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Supplier
        </Button>
      </div>

      {/* Supplier Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSupplier.totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">Purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {mockSupplier.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time expenditure</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {Math.round(mockSupplier.totalAmount / mockSupplier.totalPurchases).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Purchase</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(mockSupplier.lastPurchase).toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent order</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Supplier contact details and address</CardDescription>
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
                  <p className="font-medium">{mockSupplier.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{mockSupplier.email}</p>
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
                  <p className="font-medium">{mockSupplier.address}</p>
                  <p className="text-sm text-muted-foreground">{mockSupplier.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{mockSupplier.category}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                All purchases made from this supplier
              </CardDescription>
            </div>
            <Button size="sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseHistory.map((purchase) => (
              <div 
                key={purchase.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Purchase Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{purchase.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      LKR {purchase.total.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === 'Received'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {purchase.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          purchase.paymentStatus === 'Paid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Items */}
                <div className="mt-3 pt-3 border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {item.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            LKR {(item.quantity * item.price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}