// src/app/(dashboard)/bills/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Printer } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock customers
const mockCustomers = [
  { id: 1, name: "Perera Hardware" },
  { id: 2, name: "Silva Electricals" },
  { id: 3, name: "Fernando Constructions" },
  { id: 4, name: "Jayasinghe Hardware Store" },
  { id: 5, name: "Mendis Electrician Services" },
];

// Mock products with MRP
const mockProducts = [
  { id: 1, name: "2.5mm Single Core Wire", unit: "roll", mrp: 3200, stock: 45 },
  {
    id: 2,
    name: "4.0mm Multi-strand Cable",
    unit: "roll",
    mrp: 4500,
    stock: 28,
  },
  { id: 3, name: "1.5mm Flexible Wire", unit: "roll", mrp: 2400, stock: 62 },
  { id: 4, name: "6.0mm House Wire", unit: "roll", mrp: 5500, stock: 15 },
  { id: 5, name: "10mm Armoured Cable", unit: "roll", mrp: 11000, stock: 8 },
  { id: 6, name: "16mm Single Core Wire", unit: "roll", mrp: 8800, stock: 52 },
];

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  mrp: number;
  discount: number;
  sellingPrice: number;
  total: number;
}

export default function CreateBillPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [billNo, setBillNo] = useState(`INV-${String(Date.now()).slice(-6)}`);
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [status, setStatus] = useState("Processing");

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    discount: 0,
  });

  // Calculate selling price based on MRP and discount
  const calculateSellingPrice = (mrp: number, discount: number) => {
    return mrp - (mrp * discount) / 100;
  };

  // Add item to bill
  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) {
      alert("Please select product and enter quantity");
      return;
    }

    const product = mockProducts.find(
      (p) => p.id.toString() === currentItem.productId
    );
    if (!product) return;

    if (currentItem.quantity > product.stock) {
      alert(`Only ${product.stock} ${product.unit}s available in stock`);
      return;
    }

    const sellingPrice = calculateSellingPrice(
      product.mrp,
      currentItem.discount
    );
    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: currentItem.productId,
      productName: product.name,
      quantity: currentItem.quantity,
      unit: product.unit,
      mrp: product.mrp,
      discount: currentItem.discount,
      sellingPrice: sellingPrice,
      total: sellingPrice * currentItem.quantity,
    };

    setItems([...items, newItem]);
    setCurrentItem({ productId: "", quantity: 1, discount: 0 });
  };

  // Remove item from bill
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const billDiscountAmount = (subtotal * billDiscount) / 100;
  const finalTotal = subtotal - billDiscountAmount;
  const balance = finalTotal - paidAmount;

  // Auto-set paid amount for cash
  useEffect(() => {
    if (paymentType === "cash") {
      setPaidAmount(finalTotal);
    }
  }, [paymentType, finalTotal]);

  // Save bill
  const handleSaveBill = () => {
    if (!customerId) {
      alert("Please select a customer");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const billData = {
      billNo,
      customerId,
      date: billDate,
      items,
      subtotal,
      billDiscount,
      billDiscountAmount,
      finalTotal,
      paymentType,
      paidAmount,
      balance,
      status,
    };

    console.log("Saving bill:", billData);
    alert("Bill saved successfully! Stock has been updated.");
    router.push("/bills");
  };

  const handleSaveAndPrint = () => {
    handleSaveBill();
    // Trigger print dialog
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/bills")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Bill</h1>
          <p className="text-muted-foreground mt-1">
            Generate customer invoice and update stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveBill}>
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
          <Button onClick={handleSaveAndPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Save & Print
          </Button>
        </div>
      </div>

      {/* Bill Header Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
          <CardDescription>Customer and invoice information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date *</Label>
              <Input
                id="date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billNo">Invoice No *</Label>
              <Input
                id="billNo"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                disabled
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
          <div className="grid gap-4 md:grid-cols-5">
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
                      {product.name} (Stock: {product.stock})
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
                  setCurrentItem({
                    ...currentItem,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>MRP (LKR)</Label>
              <Input
                type="number"
                disabled
                value={
                  currentItem.productId
                    ? mockProducts.find(
                        (p) => p.id.toString() === currentItem.productId
                      )?.mrp || 0
                    : 0
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={currentItem.discount}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    discount: parseFloat(e.target.value) || 0,
                  })
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
          <CardTitle>Bill Items ({items.length})</CardTitle>
          <CardDescription>Review items and totals</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items added yet</p>
              <p className="text-sm mt-1">
                Add products above to create invoice
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Discount (%)</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}s
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {item.mrp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.discount}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {item.sellingPrice.toLocaleString()}
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
                  <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        LKR {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Bill Discount:
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={billDiscount}
                          onChange={(e) =>
                            setBillDiscount(parseFloat(e.target.value) || 0)
                          }
                          className="w-20 h-8 text-right"
                        />
                        <span>%</span>
                        <span className="font-medium text-green-600">
                          -LKR {billDiscountAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Final Total:</span>
                      <span>LKR {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment & Status Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="font-normal cursor-pointer">
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label
                    htmlFor="credit"
                    className="font-normal cursor-pointer"
                  >
                    Credit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="font-normal cursor-pointer">
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (LKR)</Label>
              <Input
                id="paidAmount"
                type="number"
                min="0"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                disabled={paymentType === "cash"}
              />
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <div
                className={`text-2xl font-bold ${
                  balance > 0 ? "text-destructive" : "text-green-600"
                }`}
              >
                LKR {balance.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Current Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Status Flow: Processing → Checking → Delivered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/bills")}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveBill}
          disabled={items.length === 0 || !customerId}
          variant="outline"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Bill
        </Button>
        <Button
          onClick={handleSaveAndPrint}
          disabled={items.length === 0 || !customerId}
        >
          <Printer className="w-4 h-4 mr-2" />
          Save & Print Invoice
        </Button>
      </div>
    </div>
  );
}
