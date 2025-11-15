// src/app/(dashboard)/purchases/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  cost_price: number;
  mrp: number;
  selling_price: number;
}

interface PurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  costPrice: number;
  total: number;
}

interface PurchaseData {
  id: string;
  purchase_id: string;
  supplier_id: string;
  supplierName: string;
  purchase_date: string;
  invoice_number: string;
  payment_status: string;
  notes: string;
  items: PurchaseItem[];
  subtotal: number;
  total_discount: number;
  total_amount: number;
}

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [purchaseDate, setPurchaseDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid">(
    "unpaid"
  );
  const [notes, setNotes] = useState("");

  // Check if user is admin
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Fetch purchase data and products
  useEffect(() => {
    if (isAdmin && purchaseId) {
      fetchPurchaseData();
      fetchProducts();
    }
  }, [isAdmin, purchaseId]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/auth/profile");
      const data = await response.json();

      if (data.profile && data.profile.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        alert("Access Denied: Only administrators can edit purchases");
        router.push("/purchases");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      alert("Error verifying permissions");
      router.push("/purchases");
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchPurchaseData = async () => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`);
      const data = await response.json();

      if (response.ok && data.purchase) {
        const purchaseData = data.purchase;

        // Create mapped purchase object for state
        const mappedPurchase = {
          id: purchaseData.id || "",
          purchase_id: purchaseData.id || purchaseId,
          supplier_id: purchaseData.supplierId || "",
          supplierName: purchaseData.supplierName || "Unknown Supplier",
          purchase_date: purchaseData.date || "",
          invoice_number: purchaseData.invoiceNumber || "",
          payment_status: purchaseData.paymentStatus || "unpaid",
          notes: purchaseData.notes || "",
          items: [],
          subtotal: purchaseData.subtotal || 0,
          total_discount: purchaseData.totalDiscount || 0,
          total_amount: purchaseData.total || 0,
        };

        setPurchase(mappedPurchase);

        // Safe date handling - handle both 'date' and 'purchase_date' fields
        const dateField = purchaseData.date || purchaseData.purchase_date;
        if (dateField) {
          const dateStr = dateField.includes("T")
            ? dateField.split("T")[0]
            : dateField;
          setPurchaseDate(dateStr);
        } else {
          setPurchaseDate(new Date().toISOString().split("T")[0]);
        }

        // Handle both camelCase and snake_case field names
        setInvoiceNumber(
          purchaseData.invoiceNumber || purchaseData.invoice_number || ""
        );
        setPaymentStatus(
          purchaseData.paymentStatus || purchaseData.payment_status || "unpaid"
        );
        setNotes(purchaseData.notes || "");

        // Transform purchase items - handle both 'items' and 'purchase_items'
        const itemsArray =
          purchaseData.items || purchaseData.purchase_items || [];

        if (itemsArray.length > 0) {
          // --- START OF FIX ---
          // We must recalculate totals on load, not trust the DB values
          const transformedItems = itemsArray.map((item: any) => {
            // Get the base values
            const quantity = item.quantity || 0;
            const mrp = item.mrp || 0;
            const discountPercent =
              item.discountPercent || item.discount_percent || 0;
            const costPrice = item.unitPrice || item.unit_price || 0;

            // Recalculate discount and total to ensure consistency
            const itemSubtotal = mrp * quantity;
            const discountAmount = (itemSubtotal * discountPercent) / 100;

            // If costPrice (unitPrice) is available and discount is 0,
            // the total is likely based on costPrice, not MRP.
            // But if discount is present, total is based on MRP - discount.
            // The logic from handleItemChange is (MRP * Qty) - DiscountAmount
            const total = itemSubtotal - discountAmount;

            // Let's refine: if discountPercent is present, use it.
            // If not, and costPrice is different from mrp, infer discount.
            // For now, let's stick to the logic in handleItemChange

            return {
              id: item.id,
              productId: item.productId || item.product_id,
              productName:
                item.productName || item.products?.name || "Unknown Product",
              productSku: item.productSku || item.products?.sku || "N/A",
              quantity: quantity,
              mrp: mrp,
              discountPercent: discountPercent,
              discountAmount: discountAmount, // Use RECALCULATED value
              costPrice: costPrice,
              total: total, // Use RECALCULATED value
            };
          });
          // --- END OF FIX ---

          setItems(transformedItems);
        } else {
          setItems([]);
        }
      } else {
        alert("Failed to load purchase data");
        router.push("/purchases");
      }
    } catch (error) {
      console.error("Error fetching purchase:", error);
      alert("Error loading purchase data");
      router.push("/purchases");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productName: "",
        productSku: "",
        quantity: 1,
        mrp: 0,
        discountPercent: 0,
        discountAmount: 0,
        costPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // This function now correctly calculates totals on every change
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        item.productId = value;
        item.productName = product.name;
        item.productSku = product.sku;
        item.mrp = product.mrp;
        item.costPrice = product.cost_price;
      }
    } else if (field === "quantity") {
      item.quantity = parseInt(value) || 0;
    } else if (field === "mrp") {
      item.mrp = parseFloat(value) || 0;
    } else if (field === "discountPercent") {
      item.discountPercent = parseFloat(value) || 0;
    } else if (field === "costPrice") {
      item.costPrice = parseFloat(value) || 0;
    }

    // Always recalculate discount and total after *any* relevant change
    const itemSubtotal = item.mrp * item.quantity;
    item.discountAmount = (itemSubtotal * item.discountPercent) / 100;
    item.total = itemSubtotal - item.discountAmount;

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.mrp * item.quantity,
      0
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + item.discountAmount,
      0
    );
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const handleUpdatePurchase = async () => {
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    if (!purchaseDate) {
      alert("Please select a purchase date");
      return;
    }

    if (!isAdmin) {
      alert("Only administrators can update purchases");
      return;
    }

    setSaving(true);

    try {
      const { subtotal, totalDiscount, total } = calculateTotals();

      const updateData = {
        purchase_date: purchaseDate,
        invoice_number: invoiceNumber || null,
        payment_status: paymentStatus,
        notes: notes || null,
        items: items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          quantity: item.quantity,
          mrp: item.mrp,
          discount_percent: item.discountPercent,
          discount_amount: item.discountAmount,
          unit_price: item.costPrice,
          line_total: item.total,
        })),
        subtotal: subtotal,
        total_discount: totalDiscount,
        total_amount: total,
      };

      const response = await fetch(`/api/purchases/${purchaseId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("Purchase updated successfully!");
        router.push("/purchases");
      } else {
        const errorData = await response.json();
        alert(`Failed to update purchase: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating purchase:", error);
      alert("Error updating purchase");
    } finally {
      setSaving(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only administrators can edit purchase orders.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">
          Loading purchase data...
        </p>
      </div>
    );
  }

  const { subtotal, totalDiscount, total } = calculateTotals();
  const availableProducts = products.filter(
    (product) => !items.some((item) => item.productId === product.id)
  );

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
            Edit Purchase Order
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {purchase?.supplierName} • {purchase?.purchase_id}
          </p>
        </div>
        <Button
          onClick={handleUpdatePurchase}
          disabled={saving || items.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Purchase
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Only</AlertTitle>
        <AlertDescription>
          You have administrator privileges to edit this purchase order. Changes
          will be reflected immediately.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchase Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>Update purchase information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
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
                    placeholder="Supplier's invoice number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment">Payment Status</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(value: "unpaid" | "paid") =>
                      setPaymentStatus(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Items</CardTitle>
                  <CardDescription>
                    Edit products and quantities
                  </CardDescription>
                </div>
                <Button onClick={handleAddItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">MRP</TableHead>
                    <TableHead className="w-24">Disc %</TableHead>
                    <TableHead className="w-28">Cost</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            handleItemChange(index, "productId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.productId && (
                              <SelectItem value={item.productId}>
                                {item.productName} ({item.productSku})
                              </SelectItem>
                            )}
                            {availableProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.mrp}
                          onChange={(e) =>
                            handleItemChange(index, "mrp", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "discountPercent",
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.costPrice}
                          onChange={(e) =>
                            handleItemChange(index, "costPrice", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        Rs. {item.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No items added. Click "Add Item" to start.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-medium">{purchase?.supplierName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchase ID:</span>
                  <span className="font-medium">{purchase?.purchase_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {purchaseDate
                      ? new Date(purchaseDate).toLocaleDateString()
                      : "Not set"}
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
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Total Discount:</span>
                  <span>- Rs. {totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
