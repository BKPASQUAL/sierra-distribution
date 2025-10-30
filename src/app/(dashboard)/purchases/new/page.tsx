// src/app/(dashboard)/purchases/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Package, Loader2 } from "lucide-react";
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

// SINGLE SUPPLIER SYSTEM - Sierra Cables Ltd

interface Product {
  id: string;
  sku: string;
  name: string;
  unit_price: number; // MRP
  stock_quantity: number;
  unit_of_measure: string;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  mrp: number; // Maximum Retail Price (unit_price)
  discountPercent: number; // Discount percentage
  discountAmount: number; // Calculated discount in LKR (per unit)
  finalPrice: number; // Price after discount (per unit) - This is the new COST PRICE
  total: number; // Final line total
  mrpChanged: boolean; // Track if MRP was modified
}

export default function AddPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "partial" | "paid"
  >("unpaid");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    mrp: 0,
    discountPercent: 0,
  });

  // Fetch products and supplier from database
  useEffect(() => {
    fetchProductsAndSupplier();
  }, []);

  const fetchProductsAndSupplier = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsResponse = await fetch("/api/products");
      const productsData = await productsResponse.json();

      if (productsResponse.ok && productsData.products) {
        setProducts(productsData.products as Product[]);
      }

      // Fetch supplier (Sierra Cables)
      const supplierResponse = await fetch("/api/suppliers");
      const supplierData = await supplierResponse.json();

      if (
        supplierResponse.ok &&
        supplierData.suppliers &&
        supplierData.suppliers.length > 0
      ) {
        setSupplierId(supplierData.suppliers[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load products and supplier");
    } finally {
      setLoading(false);
    }
  };

  // When product is selected, auto-fill MRP
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        productId: productId,
        mrp: product.unit_price,
      });
    }
  };

  // Calculate discount and final price
  const calculateItemPrices = (
    mrp: number,
    discountPercent: number,
    quantity: number
  ) => {
    const discountAmount = (mrp * discountPercent) / 100;
    const finalPrice = mrp - discountAmount;
    const total = finalPrice * quantity;

    return {
      discountAmount,
      finalPrice,
      total,
    };
  };

  // Add item to purchase with calculations
  const handleAddItem = () => {
    if (
      !currentItem.productId ||
      currentItem.quantity <= 0 ||
      currentItem.mrp <= 0
    ) {
      alert("Please fill all item details");
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    const { discountAmount, finalPrice, total } = calculateItemPrices(
      currentItem.mrp,
      currentItem.discountPercent,
      currentItem.quantity
    );

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productId: currentItem.productId,
      productName: product.name,
      quantity: currentItem.quantity,
      unit: product.unit_of_measure,
      mrp: currentItem.mrp,
      discountPercent: currentItem.discountPercent,
      discountAmount: discountAmount,
      finalPrice: finalPrice,
      total: total,
      mrpChanged: currentItem.mrp !== product.unit_price,
    };

    setItems([...items, newItem]);

    // Reset form
    setCurrentItem({
      productId: "",
      quantity: 1,
      mrp: 0,
      discountPercent: 0,
    });
  };

  // Remove item from purchase
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.discountAmount * item.quantity,
    0
  );
  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + item.mrp * item.quantity,
    0
  );

  const handleSavePurchase = async () => {
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    if (!supplierId) {
      alert("Supplier not found");
      return;
    }

    try {
      // Step 1: Update Product Stock, Cost Price, and MRP
      const transactionAndProductUpdatePromises = items.map(async (item) => {
        const currentProduct = products.find((p) => p.id === item.productId);
        if (!currentProduct) return;

        const newStock = currentProduct.stock_quantity + item.quantity;
        const newCostPrice = item.finalPrice;

        const productUpdatePayload = {
          unit_price: item.mrpChanged ? item.mrp : currentProduct.unit_price,
          stock_quantity: newStock,
          cost_price: newCostPrice,
        };

        await fetch(`/api/products/${item.productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productUpdatePayload),
        });

        // Create Inventory Transaction
        await fetch("/api/inventory-transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: item.productId,
            transaction_type: "purchase",
            quantity: item.quantity,
            reference_type: "purchase",
            notes: `Stock addition from purchase order`,
          }),
        });
      });

      await Promise.all(transactionAndProductUpdatePromises);

      // Step 2: Save Purchase Order with items
      const purchaseData = {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        invoice_number: invoiceNumber || null,
        payment_status: paymentStatus,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          mrp: item.mrp,
          discount_percent: item.discountPercent,
          discount_amount: item.discountAmount,
          unit_price: item.finalPrice,
          line_total: item.total,
        })),
        subtotal: subtotal,
        total_discount: totalDiscount,
        total_amount: subtotal,
      };

      const savePurchaseResponse = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });

      if (!savePurchaseResponse.ok) {
        const errorData = await savePurchaseResponse.json();
        console.error("Failed to save Purchase Order:", errorData);
        throw new Error(errorData.error || "Failed to save Purchase Order");
      }

      const responseData = await savePurchaseResponse.json();
      alert(`Purchase order created successfully!`);
      router.push("/purchases");
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert(`Error saving purchase: ${(error as Error).message}`);
    }
  };

  // Get available products (filter out already added ones)
  const availableProducts = products.filter(
    (product) => !items.some((item) => item.productId === product.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading products...</p>
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
          <p className="text-muted-foreground mt-1">
            Create a new purchase order from Sierra Cables Ltd
          </p>
        </div>
        <Button onClick={handleSavePurchase} disabled={items.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save Purchase
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Purchase Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Date Card */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>
                Supplier and invoice information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <p className="font-medium">Sierra Cables Ltd</p>
                    <p className="text-sm text-muted-foreground">
                      +94 11 234 5678
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Add Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>
                Add products with MRP and discount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    <Label htmlFor="product" className="mb-2 block">
                      Product
                    </Label>
                    <Select
                      value={currentItem.productId}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger id="product" className="h-10 w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="w-full min-w-[400px]">
                        {availableProducts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            All products have been added
                          </div>
                        ) : (
                          availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - MRP: LKR {product.unit_price}{" "}
                              (Stock: {product.stock_quantity})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="quantity" className="mb-2 block">
                      Quantity
                    </Label>
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
                      className="h-10"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="mrp" className="mb-2 block">
                      MRP (LKR)
                    </Label>
                    <Input
                      id="mrp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.mrp}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          mrp: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`h-10 ${
                        currentItem.productId &&
                        currentItem.mrp !==
                          products.find((p) => p.id === currentItem.productId)
                            ?.unit_price
                          ? "border-orange-500"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="discount" className="mb-2 block">
                      Discount (%)
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={currentItem.discountPercent}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          discountPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="h-10"
                    />
                  </div>

                  <div className="col-span-3">
                    <Button
                      onClick={handleAddItem}
                      className="w-full h-10"
                      disabled={availableProducts.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {currentItem.productId &&
                  currentItem.mrp !==
                    products.find((p) => p.id === currentItem.productId)
                      ?.unit_price && (
                    <p className="text-xs text-orange-600">
                      ⚠️ MRP will be updated in the database
                    </p>
                  )}

                {currentItem.productId && currentItem.mrp > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        MRP per Unit:
                      </span>
                      <span>LKR {currentItem.mrp.toLocaleString()}</span>
                    </div>
                    {currentItem.discountPercent > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Discount ({currentItem.discountPercent}%):
                          </span>
                          <span className="text-green-600">
                            - LKR{" "}
                            {(
                              (currentItem.mrp * currentItem.discountPercent) /
                              100
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Price per Unit After Discount:</span>
                          <span>
                            LKR{" "}
                            {(
                              currentItem.mrp -
                              (currentItem.mrp * currentItem.discountPercent) /
                                100
                            ).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t">
                      <span>Total for {currentItem.quantity} units:</span>
                      <span className="text-primary">
                        LKR{" "}
                        {(
                          (currentItem.mrp -
                            (currentItem.mrp * currentItem.discountPercent) /
                              100) *
                          currentItem.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
              <CardDescription>Items in this purchase order</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">MRP</TableHead>
                        <TableHead className="text-right">Discount %</TableHead>
                        <TableHead className="text-right">
                          Final Price (Cost)
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.productName}
                            {item.mrpChanged && (
                              <span className="ml-2 text-xs text-orange-600">
                                (MRP Updated)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {item.mrp.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {item.discountPercent}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            LKR {item.finalPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            LKR {item.total.toLocaleString()}
                          </TableCell>
                          <TableCell>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-medium">Sierra Cables Ltd</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(purchaseDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-medium">
                    {invoiceNumber || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium capitalize">
                    {paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Before Discount:
                  </span>
                  <span>LKR {totalBeforeDiscount.toLocaleString()}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Discount:
                    </span>
                    <span className="text-green-600">
                      - LKR {totalDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Final Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    LKR {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {items.some((item) => item.mrpChanged) && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-xs text-orange-800">
                    <strong>Note:</strong>{" "}
                    {items.filter((i) => i.mrpChanged).length} product MRP(s)
                    will be updated in the database.
                  </p>
                </div>
              )}

              <Button
                onClick={handleSavePurchase}
                className="w-full"
                size="lg"
                disabled={items.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Purchase Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
