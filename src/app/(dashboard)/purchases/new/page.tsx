// src/app/(dashboard)/purchases/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Package } from 'lucide-react';
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

// Mock suppliers
const mockSuppliers = [
  { id: 1, name: 'Sierra Cables Ltd' },
  { id: 2, name: 'Lanka Wire Industries' },
  { id: 3, name: 'Ceylon Electrical Supplies' },
  { id: 4, name: 'National Cable Corporation' },
  { id: 5, name: 'Asia Wire Manufacturing' },
];

// Mock products
const mockProducts = [
  { id: 1, name: '2.5mm Single Core Wire', unit: 'roll', currentStock: 45 },
  { id: 2, name: '4.0mm Multi-strand Cable', unit: 'roll', currentStock: 28 },
  { id: 3, name: '1.5mm Flexible Wire', unit: 'roll', currentStock: 62 },
  { id: 4, name: '6.0mm House Wire', unit: 'roll', currentStock: 15 },
  { id: 5, name: '10mm Armoured Cable', unit: 'roll', currentStock: 8 },
  { id: 6, name: '16mm Single Core Wire', unit: 'roll', currentStock: 12 },
  { id: 7, name: '2.5mm Twin & Earth Cable', unit: 'meter', currentStock: 450 },
  { id: 8, name: '1.0mm Single Core Wire', unit: 'roll', currentStock: 55 },
];

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function AddPurchasePage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  });

  // Add item to purchase
  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      alert('Please fill all item details');
      return;
    }

    const product = mockProducts.find(p => p.id.toString() === currentItem.productId);
    if (!product) return;

    const newItem: PurchaseItem = {
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

  // Remove item from purchase
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Save purchase
  const handleSavePurchase = () => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // In a real app, this would save to the database
    console.log('Saving purchase:', {
      supplierId,
      date: purchaseDate,
      items,
      total: subtotal,
    });

    alert('Purchase recorded successfully! Stock updated.');
    router.push('/purchases');
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Purchase</h1>
          <p className="text-muted-foreground mt-1">
            Record a new purchase order from supplier
          </p>
        </div>
        <Button onClick={handleSavePurchase}>
          <Save className="w-4 h-4 mr-2" />
          Save Purchase
        </Button>
      </div>

      {/* Purchase Details */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
          <CardDescription>Select supplier and purchase date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date *</Label>
              <Input
                id="date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
          <CardDescription>Select products and quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select
                value={currentItem.productId}
                onValueChange={(value) => 
                  setCurrentItem({ ...currentItem, productId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.currentStock} in stock)
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

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items ({items.length})</CardTitle>
          <CardDescription>
            Review items before saving
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items added yet</p>
              <p className="text-sm mt-1">Add products above to create purchase order</p>
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

              {/* Totals Section */}
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
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Grand Total:</span>
                      <span>LKR {subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/purchases')}
        >
          Cancel
        </Button>
        <Button onClick={handleSavePurchase} disabled={items.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save Purchase & Update Stock
        </Button>
      </div>
    </div>
  );
}