// src/app/(dashboard)/purchases/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Package, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

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
          Back to Purchases
        </Button>
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
            Purchase Order: {purchase.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            View purchase order details
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Purchase ID</p>
                  <p className="font-medium">{purchase.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(purchase.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{purchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="font-medium">
                    {purchase.items.length} products
                  </p>
                </div>
              </div>

              {purchase.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{purchase.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Purchase Items */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((item) => (
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
                        {item.quantity} {item.productUnit}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {item.mrp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discountPercent > 0 ? (
                          <div className="text-green-600">
                            <div>{item.discountPercent}%</div>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{purchase.supplierName}</p>
              </div>
              {purchase.supplierContact && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{purchase.supplierContact}</p>
                </div>
              )}
              {purchase.supplierEmail && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{purchase.supplierEmail}</p>
                </div>
              )}
              {purchase.supplierAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {purchase.supplierAddress}
                    {purchase.supplierCity && `, ${purchase.supplierCity}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>
                  LKR{" "}
                  {(
                    purchase.subtotal + purchase.totalDiscount
                  ).toLocaleString()}
                </span>
              </div>
              {purchase.totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Discount:</span>
                  <span className="text-green-600">
                    - LKR {purchase.totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  LKR {purchase.total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p>{new Date(purchase.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p>{new Date(purchase.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
