// src/app/(dashboard)/suppliers/page.tsx
// FIXED VERSION - Works with Current API Format { suppliers: [...] }
"use client";

import React, { useState, useEffect } from "react";
import {
  Edit,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// -----------------------------------------------------------
// SINGLE SUPPLIER SYSTEM - Sierra Cables Ltd Only
// FIXED: Works with current API format { suppliers: [...] }
// -----------------------------------------------------------

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
}

// Mock purchase history (TODO: Replace with real purchase API later)
const purchaseHistory = [
  {
    id: "PUR-001",
    date: "2025-01-15",
    total: 230000,
    status: "Received",
    items: 2,
  },
  {
    id: "PUR-002",
    date: "2025-01-10",
    total: 348000,
    status: "Received",
    items: 2,
  },
  {
    id: "PUR-003",
    date: "2025-01-05",
    total: 357500,
    status: "Pending",
    items: 2,
  },
];

const cleanString = (value: string | null) =>
  value === null || value.trim() === "" ? null : value;

export default function SuppliersPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    city: "",
    address: "",
    email: "",
    category: "",
  });

  // -----------------------------------------------------------
  // Fetch SINGLE supplier from REAL API
  // FIXED: Handles current API format { suppliers: [...] }
  // -----------------------------------------------------------
  useEffect(() => {
    fetchSupplier();
  }, []);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      // REAL API CALL - Fetches from database
      const response = await fetch("/api/suppliers");

      if (!response.ok) {
        throw new Error("Failed to fetch supplier");
      }

      const data = await response.json();

      // FIX: Current API returns { suppliers: [...] } as array
      // We need to get the first (only) supplier from the array
      if (data.suppliers && data.suppliers.length > 0) {
        const firstSupplier = data.suppliers[0]; // Get first supplier

        // Add mock derived data for now (TODO: Calculate from purchases table)
        const supplierWithStats: Supplier = {
          ...firstSupplier,
          totalPurchases: 45, // TODO: Calculate from purchases
          totalAmount: 12500000, // TODO: Sum from purchases
          lastPurchase: "2025-01-15", // TODO: Get latest purchase date
        };

        setSupplier(supplierWithStats);
      } else {
        throw new Error(
          "No supplier found in database. Please add Sierra Cables."
        );
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
      alert(`Failed to load supplier information: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (
      !formData.name ||
      !formData.contact ||
      !formData.city ||
      !formData.address
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        contact: cleanString(formData.contact),
        city: cleanString(formData.city),
        address: cleanString(formData.address),
        email: cleanString(formData.email),
        category: cleanString(formData.category),
      };

      // REAL API CALL - Updates database
      const response = await fetch(`/api/suppliers/${supplier?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update supplier");
      }

      alert("Supplier information updated successfully!");

      // Refresh data from database
      await fetchSupplier();

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert(`Error updating supplier: ${(error as Error).message}`);
    }
  };

  const openEditDialog = () => {
    if (!supplier) return;
    setFormData({
      name: supplier.name,
      contact: supplier.contact || "",
      city: supplier.city || "",
      address: supplier.address || "",
      email: supplier.email || "",
      category: supplier.category || "",
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading supplier...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">
          Failed to load supplier information.
        </p>
        <p className="text-sm text-muted-foreground">
          Make sure Sierra Cables exists in your database.
        </p>
        <Button onClick={fetchSupplier}>Try Again</Button>
      </div>
    );
  }

  const avgOrder =
    supplier.totalPurchases > 0
      ? Math.round(supplier.totalAmount / supplier.totalPurchases)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier Information
          </h1>
          <p className="text-muted-foreground mt-1">
            {supplier.name} - Your Primary Wire and Cable Supplier
          </p>
        </div>
        <Button onClick={openEditDialog}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Information
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Purchase orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {(supplier.totalAmount / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {(avgOrder / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Purchase</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(supplier.lastPurchase).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Supplier details and contact info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.contact || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.city || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.category || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Full Address</p>
              <p className="text-sm text-muted-foreground">
                {supplier.address || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase History</CardTitle>
          <CardDescription>
            Latest purchases from {supplier.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseHistory.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>
                    {new Date(purchase.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{purchase.items} items</TableCell>
                  <TableCell>LKR {purchase.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        purchase.status === "Received"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier Information</DialogTitle>
            <DialogDescription>
              Update {supplier.name} contact and business information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sierra Cables Ltd"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., Cables & Wires"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                placeholder="+94 11 234 5678"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.lk"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="e.g., Colombo"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier}>Update Information</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
