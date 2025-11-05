// src/app/(dashboard)/purchases/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Package,
  Loader2,
  FileText,
  User,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  quantity: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  unitPrice: number;
  lineTotal: number;
}

interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  supplierCity?: string;
  date: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  invoiceNumber?: string;
  paymentStatus?: "unpaid" | "paid";
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchaseId) {
      fetchPurchase();
    }
  }, [purchaseId]);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`);
      const data = await response.json();

      if (response.ok && data.purchase) {
        setPurchase(data.purchase);
      } else {
        console.error("Failed to fetch purchase:", data.error);
        alert("Purchase not found");
        router.push("/purchases");
      }
    } catch (error) {
      console.error("Error fetching purchase:", error);
      alert("Error loading purchase details");
      router.push("/purchases");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">
          Loading purchase details...
        </p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Purchase not found</p>
        <Button onClick={() => router.push("/purchases")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Purchases
        </Button>
      </div>
    );
  }

  // Safe access to items array
  const items = purchase.items || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/purchases")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Purchase Order {purchase.id}</h1>
            <p className="text-muted-foreground">
              {new Date(purchase.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        {purchase.paymentStatus && (
          <Badge
            variant={
              purchase.paymentStatus === "paid" ? "default" : "secondary"
            }
          >
            {purchase.paymentStatus === "paid" ? "Paid" : "Unpaid"}
          </Badge>
        )}
      </div>

      {/* Purchase Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{purchase.supplierName}</p>
            </div>
            {purchase.supplierContact && (
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{purchase.supplierContact}</p>
              </div>
            )}
            {purchase.supplierEmail && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{purchase.supplierEmail}</p>
              </div>
            )}
            {purchase.supplierAddress && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {purchase.supplierAddress}
                  {purchase.supplierCity && `, ${purchase.supplierCity}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purchase Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Purchase ID</p>
              <p className="font-medium font-mono">{purchase.id}</p>
            </div>
            {purchase.invoiceNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{purchase.invoiceNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Purchase Date</p>
              <p className="font-medium">
                {new Date(purchase.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">
                {items.length} {items.length === 1 ? "product" : "products"} (
                {totalItems} {totalItems === 1 ? "roll" : "rolls"})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Items */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
          <CardDescription>
            Products included in this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No items found for this purchase</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.productSku}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.productUnit || "rolls"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {item.mrp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {item.discountPercent > 0
                          ? `${item.discountPercent.toFixed(
                              2
                            )}% (LKR ${item.discountAmount.toFixed(2)})`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {item.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        LKR {item.lineTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                LKR {purchase.subtotal.toLocaleString()}
              </span>
            </div>
            {purchase.totalDiscount > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Total Discount</span>
                <span className="font-medium">
                  - LKR {purchase.totalDiscount.toLocaleString()}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">
                LKR {purchase.total.toLocaleString()}
              </span>
            </div>
          </div>

          {purchase.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{purchase.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
