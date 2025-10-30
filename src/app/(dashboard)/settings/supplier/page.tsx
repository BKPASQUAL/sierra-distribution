// src/app/(dashboard)/purchases/new/page.tsx
// Single Supplier System - New Purchase Form
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  sku: string;
  name: string;
  mrp: number;
  unit_of_measure: string;
  stock_quantity: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  unitPrice: number;
  lineTotal: number;
}

export default function NewPurchasePage() {
  const router = useRouter();

  // State
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "partial" | "paid"
  >("unpaid");
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    discountPercent: 0,
  });

  // Load supplier and products
  useEffect(() => {
    fetchSupplier();
    fetchProducts();
  }, []);

  const fetchSupplier = async () => {
    try {
      const response = await fetch("/api/suppliers/primary");
      const data = await response.json();
      if (response.ok && data.supplier) {
        setSupplier(data.supplier);
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (response.ok && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add item to purchase
  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) {
      alert("Please select a product and enter quantity");
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    // Calculate pricing
    const mrp = product.mrp;
    const discountAmount = (mrp * currentItem.discountPercent) / 100;
    const unitPrice = mrp - discountAmount;
    const lineTotal = unitPrice * currentItem.quantity;

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: currentItem.quantity,
      unit: product.unit_of_measure,
      mrp: mrp,
      discountPercent: currentItem.discountPercent,
      discountAmount: discountAmount,
      unitPrice: unitPrice,
      lineTotal: lineTotal,
    };

    setItems([...items, newItem]);
    setCurrentItem({ productId: "", quantity: 1, discountPercent: 0 });
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotalBeforeDiscount = items.reduce(
    (sum, item) => sum + item.mrp * item.quantity,
    0
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.discountAmount * item.quantity,
    0
  );
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Save purchase
  const handleSavePurchase = async () => {
    if (items.length === 0) {
      alert("Please add at least one item to the purchase");
      return;
    }

    if (!supplier) {
      alert("No supplier configured. Please set up a supplier first.");
      return;
    }

    setSaving(true);
    try {
      // Step 1: Create the purchase
      const purchasePayload = {
        supplier_id: supplier.id,
        purchase_date: purchaseDate,
        subtotal: subtotal,
        total_discount: totalDiscount,
        total_amount: subtotal,
        invoice_number: invoiceNumber || null,
        payment_status: paymentStatus,
        notes: notes || null,
      };

      const purchaseResponse = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchasePayload),
      });

      if (!purchaseResponse.ok) {
        const error = await purchaseResponse.json();
        throw new Error(error.error || "Failed to create purchase");
      }

      const purchaseData = await purchaseResponse.json();
      const purchaseId = purchaseData.purchase.id;

      // Step 2: Create purchase items
      const itemsPayload = items.map((item) => ({
        purchase_id: purchaseId,
        product_id: item.productId,
        quantity: item.quantity,
        mrp: item.mrp,
        discount_percent: item.discountPercent,
        discount_amount: item.discountAmount,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }));

      const itemsResponse = await fetch("/api/purchase-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!itemsResponse.ok) {
        // If items creation fails, we should delete the purchase
        await fetch(`/api/purchases/${purchaseData.purchase.purchase_id}`, {
          method: "DELETE",
        });
        throw new Error("Failed to create purchase items");
      }

      // Step 3: Update product stock
      for (const item of items) {
        await fetch(`/api/products/${item.productId}/stock`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: item.quantity,
            operation: "add",
          }),
        });
      }

      alert("Purchase order created successfully!");
      router.push("/purchases");
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert(
        `Error saving purchase: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/purchases")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            New Purchase Order
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Purchase from {supplier?.name || "Sierra Cables Ltd"}
          </p>
        </div>
        <Button
          onClick={handleSavePurchase}
          disabled={saving || items.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Purchase
            </>
          )}
        </Button>
      </div>

      {/* Purchase Details */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Information</CardTitle>
          <CardDescription>
            Enter purchase details and invoice information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date *</Label>
              <Input
                id="date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice Number</Label>
              <Input
                id="invoice"
                placeholder="Supplier's invoice/bill number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Status</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value: any) => setPaymentStatus(value)}
              >
                <SelectTrigger id="payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this purchase..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle>Add Products</CardTitle>
          <CardDescription>
            Select products and quantities for this purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={currentItem.productId}
                onValueChange={(value) =>
                  setCurrentItem({ ...currentItem, productId: value })
                }
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - LKR {product.mrp.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount %</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={currentItem.discountPercent}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    discountPercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
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
          <CardTitle>Purchase Items</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "No items added yet"
              : `${items.length} item(s) added`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items added yet. Add products above to get started.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.productSku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {item.mrp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discountPercent > 0 ? (
                          <div className="text-green-600">
                            {item.discountPercent}%
                            <div className="text-xs">
                              (LKR {item.discountAmount.toLocaleString()})
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {item.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        LKR {item.lineTotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <Separator className="my-6" />
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">
                      {items.length} products ({totalItems} units)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal (before discount):
                    </span>
                    <span>LKR {subtotalBeforeDiscount.toLocaleString()}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Total Discount:</span>
                      <span>- LKR {totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span className="text-primary">
                      LKR {subtotal.toLocaleString()}
                    </span>
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
          onClick={() => router.push("/purchases")}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePurchase}
          disabled={saving || items.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Purchase Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
