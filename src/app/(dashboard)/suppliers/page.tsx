// src/app/(dashboard)/suppliers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Package,
  Loader2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// -----------------------------------------------------------
// 1. Define Supplier Interface (Mirrors database.types.ts)
// -----------------------------------------------------------
interface Supplier {
  id: string; // UUID from DB
  supplier_code: string;
  name: string;
  contact: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  // Mocked fields to maintain UI functionality
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
}

// Mock data conversion - used for initial display and deriving stats
const mockSuppliers = [
  {
    id: "1",
    name: "Sierra Cables Ltd",
    contact: "+94 11 234 5678",
    city: "Colombo",
    address: "456 Industrial Zone, Colombo 10",
    email: "sales@sierracables.lk",
    category: "Cables & Wires",
    totalPurchases: 45,
    totalAmount: 12500000,
    lastPurchase: "2025-01-15",
  },
  {
    id: "2",
    name: "Lanka Wire Industries",
    contact: "+94 11 345 6789",
    city: "Colombo",
    address: "789 Export Processing Zone, Katunayake",
    email: "info@lankawire.lk",
    category: "Cables & Wires",
    totalPurchases: 32,
    totalAmount: 8900000,
    lastPurchase: "2025-01-12",
  },
  {
    id: "3",
    name: "Ceylon Electrical Supplies",
    contact: "+94 81 456 7890",
    city: "Kandy",
    address: "123 Peradeniya Road, Kandy",
    email: "ceylon@electrical.lk",
    category: "Electrical Components",
    totalPurchases: 18,
    totalAmount: 3400000,
    lastPurchase: "2025-01-08",
  },
] as Partial<Supplier>[];

// Helper to convert empty string to null for optional Supabase fields
const cleanString = (value: string | null) =>
  value === null || value.trim() === "" ? null : value;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([] as Supplier[]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    city: "",
    address: "",
    email: "",
    category: "",
  });

  // -----------------------------------------------------------
  // 2. Data Fetching and CRUD Logic
  // -----------------------------------------------------------

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();

      if (response.ok) {
        // Map fetched data to include mock derived fields for the UI tables/cards
        const mappedSuppliers: Supplier[] = data.suppliers.map((s: any) => {
          const mockData = mockSuppliers.find((m) => m.name === s.name) || {
            totalPurchases: 0,
            totalAmount: 0,
            lastPurchase: s.created_at.split("T")[0],
          };
          return {
            ...s,
            id: s.id,
            supplier_code: s.supplier_code,
            name: s.name,
            contact: s.contact,
            city: s.city,
            address: s.address,
            email: s.email,
            category: s.category,
            totalPurchases: mockData.totalPurchases, // Mocked
            totalAmount: mockData.totalAmount, // Mocked
            lastPurchase: mockData.lastPurchase, // Mocked
          };
        });

        setSuppliers(mappedSuppliers);
      } else {
        console.error("Failed to fetch suppliers:", data.error);
        setSuppliers(mockSuppliers as Supplier[]);
        // Do not alert on failed fetch if local mock data is used as fallback
      }
    } catch (error) {
      console.error("Network error fetching suppliers:", error);
      setSuppliers(mockSuppliers as Supplier[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSaveSupplier = async () => {
    if (
      !formData.name ||
      !formData.contact ||
      !formData.city ||
      !formData.address ||
      !formData.category
    ) {
      alert("Please fill all required fields");
      return;
    }

    // 💡 FIX: Use cleanString for all optional fields to send null instead of ""
    const payload = {
      name: cleanString(formData.name),
      contact: cleanString(formData.contact),
      city: cleanString(formData.city),
      address: cleanString(formData.address),
      email: cleanString(formData.email),
      category: cleanString(formData.category),
    };

    try {
      if (selectedSupplier) {
        // PUT: Update existing supplier
        const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update supplier");
        }
        alert("Supplier updated successfully!");
      } else {
        // POST: Add new supplier
        const response = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // 💡 FIX: The original error point. Now we expect a successful response.
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add new supplier");
        }
        alert("Supplier added successfully!");
      }

      fetchSuppliers(); // Re-fetch data to update UI
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert(`Error saving supplier: ${(error as Error).message}.`);
    }

    setIsAddDialogOpen(false);
    setSelectedSupplier(null);
    resetForm();
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete supplier");
      }

      alert(`Supplier ${selectedSupplier.name} deleted successfully!`);
      fetchSuppliers(); // Re-fetch data to update UI
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert(`Error deleting supplier: ${(error as Error).message}.`);
    }

    setIsDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact: "",
      city: "",
      address: "",
      email: "",
      category: "",
    });
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || "",
      city: supplier.city || "",
      address: supplier.address || "",
      email: supplier.email || "",
      category: supplier.category || "",
    });
    setIsAddDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedSupplier(null);
    resetForm();
    setIsAddDialogOpen(true);
  };

  // -----------------------------------------------------------
  // 3. Filtering and Calculations
  // -----------------------------------------------------------

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contact && supplier.contact.includes(searchQuery)) ||
      (supplier.city &&
        supplier.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || supplier.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter from the current supplier list
  const categories = [
    "all",
    ...new Set(
      suppliers.map((s) => s.category).filter((c): c is string => c !== null)
    ),
  ];

  const totalPurchases = suppliers.reduce(
    (sum, s) => sum + s.totalPurchases,
    0
  );
  const totalSpent = suppliers.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your wire and cable suppliers
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Suppliers
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active supplier accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time purchase orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time expenditure
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
                  placeholder="Search by name, contact, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">
                Loading suppliers...
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Total Purchases</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {supplier.contact}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {supplier.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {supplier.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {supplier.totalPurchases}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {supplier.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              (window.location.href = `/suppliers/${supplier.id}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsDeleteDialogOpen(true);
                            }}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? "Update supplier information below"
                : "Enter the details of the new supplier"}
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
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cables & Wires">Cables & Wires</SelectItem>
                  <SelectItem value="Electrical Components">
                    Electrical Components
                  </SelectItem>
                  <SelectItem value="Tools & Equipment">
                    Tools & Equipment
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                setIsAddDialogOpen(false);
                setSelectedSupplier(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSupplier}>
              {selectedSupplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSupplier?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedSupplier(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplier}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
