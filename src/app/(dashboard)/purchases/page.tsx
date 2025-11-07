// src/app/(dashboard)/purchases/page.tsx
// Single Supplier System - All purchases from Sierra Cables Ltd
// UPDATED: Added Edit functionality for Admin users
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  ShoppingCart,
  Package,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: number;
  totalItems: number;
  total: number;
  subtotal: number;
  totalDiscount: number;
  invoiceNumber?: string;
  paymentStatus: "unpaid" | "paid";
}

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  city?: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // NEW: Admin check state
  const [isAdmin, setIsAdmin] = useState(false);

  // Payment status update dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [newPaymentStatus, setNewPaymentStatus] = useState<"unpaid" | "paid">(
    "unpaid"
  );
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");

  // Fetch primary supplier and purchases
  useEffect(() => {
    checkUserRole(); // NEW: Check if user is admin
    fetchSupplier();
    fetchPurchases();
  }, []);

  // NEW: Check if user is admin
  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/auth/profile");
      const data = await response.json();

      if (data.profile && data.profile.role === "admin") {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

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

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/purchases");
      const data = await response.json();

      if (response.ok && data.purchases) {
        setPurchases(data.purchases);
      } else {
        console.error("Failed to fetch purchases:", data.error);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purchase.invoiceNumber &&
        purchase.invoiceNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesPayment =
      paymentFilter === "all" || purchase.paymentStatus === paymentFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const purchaseDate = new Date(purchase.date);
      const now = new Date();

      if (dateFilter === "today") {
        matchesDate = purchaseDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = purchaseDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate =
          purchaseDate.getMonth() === now.getMonth() &&
          purchaseDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesDate && matchesPayment;
  });

  // Calculate stats
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);
  const unpaidPurchases = purchases.filter((p) => p.paymentStatus === "unpaid");
  const totalUnpaid = unpaidPurchases.reduce((sum, p) => sum + p.total, 0);

  // Handle delete purchase
  const handleDelete = async (purchaseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this purchase order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Purchase order deleted successfully");
        fetchPurchases();
      } else {
        const data = await response.json();
        alert(`Failed to delete purchase: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting purchase:", error);
      alert("Error deleting purchase order");
    }
  };

  // NEW: Handle edit purchase
  const handleEdit = (purchaseId: string) => {
    if (!isAdmin) {
      alert("Only administrators can edit purchases");
      return;
    }
    router.push(`/purchases/${purchaseId}/edit`);
  };

  // Open payment status dialog
  const openPaymentDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setNewPaymentStatus(purchase.paymentStatus);
    setNewInvoiceNumber(purchase.invoiceNumber || "");
    setIsPaymentDialogOpen(true);
  };

  // Update payment status
  const handleUpdatePayment = async () => {
    if (!selectedPurchase) return;

    try {
      const response = await fetch(`/api/purchases/${selectedPurchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: newPaymentStatus,
          invoice_number: newInvoiceNumber || null,
        }),
      });

      if (response.ok) {
        setIsPaymentDialogOpen(false);
        alert("Payment status updated successfully");
        await fetchPurchases();
      } else {
        const data = await response.json();
        alert(`Failed to update payment status: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status");
    }
  };

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "unpaid":
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Unpaid
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading purchases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            All purchases from {supplier?.name || "Sierra Cables Ltd"}
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/purchases/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Purchase
        </Button>
      </div>
      {/* Stats Cards - Removed Total Savings Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Purchase orders recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total expenditure
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalUnpaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidPurchases.length} pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Purchase ID, Invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No purchases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.id}</TableCell>
                    <TableCell>
                      {purchase.invoiceNumber ? (
                        <span className="text-sm">
                          {purchase.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Not set
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(purchase.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {purchase.items} items
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {purchase.totalItems} units
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {purchase.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => openPaymentDialog(purchase)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {getPaymentBadge(purchase.paymentStatus)}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* NEW: Edit Button - Only shown for admin */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(purchase.id)}
                            title="Edit Purchase (Admin Only)"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/purchases/${purchase.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Status Update Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Update the payment status and invoice number for purchase{" "}
              {selectedPurchase?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                placeholder="Enter supplier's invoice/bill number"
                value={newInvoiceNumber}
                onChange={(e) => setNewInvoiceNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Enter the supplier's bill/invoice number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select
                value={newPaymentStatus}
                onValueChange={(value: any) => setNewPaymentStatus(value)}
              >
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
