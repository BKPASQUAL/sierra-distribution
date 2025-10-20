// src/app/(dashboard)/bills/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const mockCustomers = [
  { id: 1, name: 'Perera Hardware', contact: '+94 77 123 4567' },
  { id: 2, name: 'Silva Electricals', contact: '+94 71 234 5678' },
  { id: 3, name: 'Fernando Constructions', contact: '+94 76 345 6789' },
  { id: 4, name: 'Jayasinghe Hardware Store', contact: '+94 75 456 7890' },
  { id: 5, name: 'Mendis Electrician Services', contact: '+94 77 567 8901' },
];

const mockProducts = [
  { id: 1, name: '2.5mm Single Core Wire', unit: 'roll', price: 3200, stock: 45 },
  { id: 2, name: '4.0mm Multi-strand Cable', unit: 'roll', price: 4500, stock: 28 },
  { id: 3, name: '1.5mm Flexible Wire', unit: 'roll', price: 2300, stock: 62 },
  { id: 4, name: '6.0mm House Wire', unit: 'roll', price: 5400, stock: 15 },
  { id: 5, name: '10mm Armoured Cable', unit: 'roll', price: 10500, stock: 8 },
  { id: 6, name: '16mm Single Core Wire', unit: 'roll', price: 8600, stock: 52 },
  { id: 7, name: '2.5mm Twin & Earth Cable', unit: 'meter', price: 110, stock: 450 },
  { id: 8, name: '1.0mm Single Core Wire', unit: 'roll', price: 1500, stock: 55 },
];

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function CreateBillPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState('Credit');
  const [orderStatus, setOrderStatus] = useState('Processing');
  const [items, setItems] = useState<BillItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  });

  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      alert('Please fill all item details');
      return;
    }

    const product = mockProducts.find(p => p.id.toString() === currentItem.productId);
    if (!product) return;

    if (currentItem.quantity > product.stock) {
      alert(`Not enough stock! Available: ${product.stock} ${product.unit}s`);
      return;
    }

    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: currentItem.productId,
      productName: product.name,
      quantity: currentItem.quantity,
      unit: product.unit,
      unitPrice: currentItem.unitPrice,
      total: currentItem.quantity * currentItem.unitPrice,
    };

    setItems([...items, newItem]);
    setCurrentItem({ productId: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleProductChange = (productId: string) => {
    const product = mockProducts.find(p => p.id.toString() === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        productId,
        unitPrice: product.price,
      });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSaveBill = () => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const billData = {
      customerId,
      date: billDate,
      items,
      subtotal,
      tax,
      total: grandTotal,
      paymentType,
      orderStatus,
      paymentStatus: paymentType === 'Cash' || paymentType === 'Bank' ? 'Paid' : 'Unpaid',
    };

    console.log('Saving bill:', billData);
    alert('Bill created successfully!');
    router.push('/bills');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/bills')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Bill</h1>
          <p className="text-muted-foreground mt-1">Generate a new customer invoice</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleSaveBill}>
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>Select customer and bill information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Bill Date *</Label>
              <Input
                id="date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment & Status</CardTitle>
            <CardDescription>Select payment method and order status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cash" id="cash" />
                  <Label htmlFor="cash" className="font-normal cursor-pointer">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Credit" id="credit" />
                  <Label htmlFor="credit" className="font-normal cursor-pointer">Credit (Pay Later)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bank" id="bank" />
                  <Label htmlFor="bank" className="font-normal cursor-pointer">Bank Transfer</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderStatus">Order Status *</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
          <CardDescription>Select products and quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={currentItem.productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.stock} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Price (LKR) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={currentItem.unitPrice}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="invisible">Add</Label>
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill Items ({items.length})</CardTitle>
          <CardDescription>Review items before saving</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items added yet</p>
              <p className="text-sm mt-1">Add products above to create invoice</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{items.length} products</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Quantity:</span>
                      <span className="font-medium">{totalItems} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%):</span>
                      <span className="font-medium">LKR {tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Grand Total:</span>
                      <span>LKR {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}