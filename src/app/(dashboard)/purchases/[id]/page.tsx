// src/app/(dashboard)/purchases/[id]/page.tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Package,
  ShoppingCart,
  CheckCircle,
  Clock,
  Printer
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

// Mock purchase data
const mockPurchase = {
  id: 'PUR-001',
  date: '2025-01-15',
  supplier: {
    id: 1,
    name: 'Sierra Cables Ltd',
    contact: '+94 11 234 5678',
    email: 'sales@sierracables.lk',
    address: '456 Industrial Zone, Colombo 10',
  },
  items: [
    {
      id: 1,
      productName: '2.5mm Single Core Wire',
      quantity: 50,
      unit: 'rolls',
      unitPrice: 2500,
      total: 125000,
      previousStock: 45,
      newStock: 95,
    },
    {
      id: 2,
      productName: '4.0mm Multi-strand Cable',
      quantity: 30,
      unit: 'rolls',
      unitPrice: 3500,
      total: 105000,
      previousStock: 28,
      newStock: 58,
    },
  ],
  subtotal: 230000,
  status: 'Received',
  receivedDate: '2025-01-15',
  notes: 'Quality checked and stored in warehouse A',
};

export default function PurchaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsReceived = () => {
    alert('Purchase marked as received! Stock has been updated.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/purchases')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Purchase Order {mockPurchase.id}</h1>
          <p className="text-muted-foreground mt-1">
            Purchase details and stock update information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {mockPurchase.status === 'Pending' && (
            <Button onClick={handleMarkAsReceived}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Received
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className={mockPurchase.status === 'Received' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10'}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {mockPurchase.status === 'Received' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <h3 className="font-semibold">
                {mockPurchase.status === 'Received' ? 'Order Received' : 'Pending Receipt'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mockPurchase.status === 'Received' 
                  ? `Received on ${new Date(mockPurchase.receivedDate).toLocaleDateString()} - Stock updated`
                  : 'Waiting for delivery and stock update'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Info & Supplier Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Purchase Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {new Date(mockPurchase.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase ID</p>
                <p className="font-medium">{mockPurchase.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="font-medium">
                  {mockPurchase.items.length} products • {mockPurchase.items.reduce((sum, item) => sum + item.quantity, 0)} units
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Supplier Name</p>
              <p className="font-semibold text-lg">{mockPurchase.supplier.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{mockPurchase.supplier.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{mockPurchase.supplier.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{mockPurchase.supplier.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Items */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
          <CardDescription>
            Products ordered and stock updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Previous Stock</TableHead>
                <TableHead className="text-right">New Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPurchase.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    LKR {item.unitPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {item.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.previousStock}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-green-600">
                      {item.newStock}
                    </span>
                    <span className="text-xs text-green-600 ml-1">
                      (+{item.quantity})
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Total Section */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>LKR {mockPurchase.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      {mockPurchase.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{mockPurchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}