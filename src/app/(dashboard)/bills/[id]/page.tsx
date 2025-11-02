// src/app/(dashboard)/bills/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

interface Bill {
  id: string;
  billNo: string;
  customerName: string;
  customerContact: string;
  customerEmail: string | null;
  customerAddress: string | null;
  customerCity: string | null;
  date: string;
  deliveryDate: string | null;
  status: string;
  paymentStatus: string;
  paymentType: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BillDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch bill details from API
  useEffect(() => {
    async function fetchBillDetails() {
      if (!orderId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bill details");
        }

        setBill(data.order);
      } catch (err) {
        console.error("Error fetching bill:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchBillDetails();
  }, [orderId]);

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (!bill) return;

    const amount = parseFloat(paymentAmount);
    if (amount > bill.total) {
      alert(`Payment amount cannot exceed LKR ${bill.total.toLocaleString()}`);
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Update payment status in the database
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: amount >= bill.total ? "paid" : "partial",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      // Update local state
      setBill({
        ...bill,
        paymentStatus: amount >= bill.total ? "paid" : "partial",
      });

      setPaymentAmount("");
      setIsPaymentDialogOpen(false);
      alert("Payment recorded successfully!");
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-orange-100 text-orange-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading bill details...</p>
      </div>
    );
  }

  // Error state
  if (error || !bill) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">
          Failed to load bill details for ID: {orderId}
        </p>
        {error && <p className="text-red-500">Details: {error}</p>}
        <Button onClick={() => router.push("/bills")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bills
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/bills")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{bill.billNo}</h1>
            <p className="text-muted-foreground mt-1">
              Invoice details and payment tracking
            </p>
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
            <p className="text-sm text-muted-foreground">
              {bill.customerContact}
            </p>
            {bill.customerEmail && (
              <p className="text-sm text-muted-foreground">
                {bill.customerEmail}
              </p>
            )}
            {bill.customerAddress && (
              <p className="text-sm text-muted-foreground">
                {bill.customerAddress}
              </p>
            )}
            {bill.customerCity && (
              <p className="text-sm text-muted-foreground">
                {bill.customerCity}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Order Status</p>
              <Badge className={getStatusColor(bill.status)}>
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Payment Status
              </p>
              <Badge className={getPaymentColor(bill.paymentStatus)}>
                {bill.paymentStatus.charAt(0).toUpperCase() +
                  bill.paymentStatus.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              LKR {bill.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Payment Type: {bill.paymentType}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>
            Bill dated {new Date(bill.date).toLocaleDateString()}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.productName}
                  </TableCell>
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
                  <span className="font-medium">
                    LKR {bill.subtotal.toLocaleString()}
                  </span>
                </div>
                {bill.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-green-600">
                      - LKR {bill.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">
                    LKR {bill.taxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>LKR {bill.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {bill.notes && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Notes:</span> {bill.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Recording */}
      {bill.paymentStatus.toLowerCase() !== "paid" && (
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Process payment for this bill</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog
              open={isPaymentDialogOpen}
              onOpenChange={setIsPaymentDialogOpen}
            >
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
                      disabled={isProcessingPayment}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsPaymentDialogOpen(false)}
                      disabled={isProcessingPayment}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {bill.paymentStatus.toLowerCase() === "paid" && (
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
  );
}
