// src/app/(dashboard)/bills/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Printer, Download, Check, Clock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BillItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Bill {
  id: string;
  billNo: string;
  customerName: string;
  customerContact: string;
  date: string;
  status: 'Processing' | 'Checking' | 'Delivered';
  paymentStatus: 'Paid' | 'Unpaid';
  paymentType: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const mockBillDetails: Bill = {
  id: '1',
  billNo: 'BL-001',
  customerName: 'Perera Hardware',
  customerContact: '+94 77 123 4567',
  date: '2025-10-15',
  status: 'Processing',
  paymentStatus: 'Unpaid',
  paymentType: 'Credit',
  items: [
    {
      productName: '2.5mm Single Core Wire',
      quantity: 10,
      unit: 'roll',
      unitPrice: 3200,
      total: 32000,
    },
    {
      productName: '4.0mm Multi-strand Cable',
      quantity: 5,
      unit: 'roll',
      unitPrice: 4500,
      total: 22500,
    },
  ],
  subtotal: 54500,
  tax: 5450,
  total: 59950,
};

export default function BillDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<Bill>(mockBillDetails);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isDelivered, setIsDelivered] = useState(bill.status === 'Delivered');

  const handleMarkDelivered = () => {
    setBill({ ...bill, status: 'Delivered' });
    setIsDelivered(true);
    alert('Bill marked as delivered!');
  };

  const handleRecordPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount !== bill.total) {
      alert(`Payment amount must be LKR ${bill.total.toLocaleString()}`);
      return;
    }

    setBill({ ...bill, paymentStatus: 'Paid' });
    setPaymentAmount('');
    alert('Payment recorded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Checking':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/bills')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{bill.billNo}</h1>
            <p className="text-muted-foreground mt-1">Invoice details and payment tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Bill Information */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold">{bill.customerName}</p>
            <p className="text-sm text-muted-foreground">{bill.customerContact}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Order Status</p>
              <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
              <Badge className={getPaymentColor(bill.paymentStatus)}>{bill.paymentStatus}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">LKR {bill.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Payment Type: {bill.paymentType}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>Bill dated {bill.date}</CardDescription>
        </CardHeader>
        <CardContent>
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
              {bill.items.map((item, idx) => (
                <TableRow key={idx}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 border-t pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">LKR {bill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%):</span>
                  <span className="font-medium">LKR {bill.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>LKR {bill.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mark as Delivered */}
        {!isDelivered && bill.status !== 'Delivered' && (
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Update delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMarkDelivered}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Delivered
              </Button>
            </CardContent>
          </Card>
        )}

        {isDelivered && (
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Delivered on {bill.date}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Record Payment */}
        {bill.paymentStatus === 'Unpaid' && (
          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              <CardDescription>Process payment for this bill</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Enter the payment amount for {bill.billNo}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount Due (LKR)</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {bill.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment">Payment Amount (LKR) *</Label>
                      <Input
                        id="payment"
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <Button
                        onClick={handleRecordPayment}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {bill.paymentStatus === 'Paid' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Payment Received</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}