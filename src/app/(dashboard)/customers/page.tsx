// src/app/(dashboard)/customers/page.tsx
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
  DollarSign,
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
// 1. Define Customer Interface (Mirrors database.types.ts)
// -----------------------------------------------------------
interface Customer {
  id: string; // Changed from number to string to match Supabase schema
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  tax_id: string | null;
  credit_limit: number;
  outstanding_balance: number;
  status: "active" | "inactive" | "suspended";
  // Simplified for display:
  totalOrders: number;
  totalPaid: number;
}

// Mock Data Conversion (Needed to populate stats/filters initially)
const mockCustomers = [
  {
    id: "1",
    customer_code: "CUST-001",
    name: "Perera Hardware",
    phone: "+94 77 123 4567",
    city: "Colombo",
    address: "123 Galle Road, Colombo 03",
    email: "perera@hardware.lk",
    outstanding_balance: 45000,
    credit_limit: 100000,
    status: "active",
    totalOrders: 23,
    totalPaid: 2340000,
  },
  {
    id: "2",
    customer_code: "CUST-002",
    name: "Silva Electricals",
    phone: "+94 71 234 5678",
    city: "Kandy",
    address: "45 Peradeniya Road, Kandy",
    email: "silva@electric.lk",
    outstanding_balance: 0,
    credit_limit: 50000,
    status: "active",
    totalOrders: 15,
    totalPaid: 1500000,
  },
  {
    id: "3",
    customer_code: "CUST-003",
    name: "Fernando Constructions",
    phone: "+94 76 345 6789",
    city: "Galle",
    address: "78 Main Street, Galle",
    email: "fernando@constructions.lk",
    outstanding_balance: 125000,
    credit_limit: 150000,
    status: "suspended",
    totalOrders: 45,
    totalPaid: 5600000,
  },
  {
    id: "4",
    customer_code: "CUST-004",
    name: "Jayasinghe Hardware Store",
    phone: "+94 75 456 7890",
    city: "Colombo",
    address: "234 High Level Road, Nugegoda",
    email: "jayasinghe@store.lk",
    outstanding_balance: 23000,
    credit_limit: 50000,
    status: "active",
    totalOrders: 12,
    totalPaid: 890000,
  },
  {
    id: "5",
    customer_code: "CUST-005",
    name: "Mendis Electrician Services",
    phone: "+94 77 567 8901",
    city: "Matara",
    address: "56 Beach Road, Matara",
    email: "mendis@services.lk",
    outstanding_balance: 78000,
    credit_limit: 100000,
    status: "active",
    totalOrders: 34,
    totalPaid: 3200000,
  },
] as Customer[];

// -----------------------------------------------------------
// 2. Main Component
// -----------------------------------------------------------

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    email: "",
  });

  // Fetch data from API on load
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // NOTE: In a real app, 'totalOrders' and 'totalPaid' should come from JOINs or aggregated data.
      // For this integration, we will fetch core data and manually map back to the mock structure.
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (response.ok) {
        // Map fetched data to include mock derived fields for consistency with the UI
        const mappedCustomers: Customer[] = data.customers.map((c: any) => ({
          ...c,
          // Fallback for mock data demonstration
          totalOrders:
            mockCustomers.find((m) => m.name === c.name)?.totalOrders || 0,
          totalPaid:
            mockCustomers.find((m) => m.name === c.name)?.totalPaid || 0,
          outstanding_balance: c.outstanding_balance ?? 0,
        }));

        setCustomers(mappedCustomers);
      } else {
        console.error("Failed to fetch customers:", data.error);
        alert(`Error fetching customers: ${data.error}`);
      }
    } catch (error) {
      console.error("Network error fetching customers:", error);
      alert("Network error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // -----------------------------------------------------------
  // 3. CRUD Handlers using API Routes
  // -----------------------------------------------------------

  const handleAddCustomer = async () => {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.city ||
      !formData.address
    ) {
      alert("Please fill all required fields");
      return;
    }

    // Prepare data for POST/PUT (matches expected Supabase schema Insert/Update fields)
    const payload = {
      name: formData.name,
      phone: formData.phone,
      city: formData.city,
      address: formData.address,
      email: formData.email || null,
      // Default values for new/update records in this simplified payload
      credit_limit: 0,
      outstanding_balance: 0,
      status: "active",
    };

    try {
      if (selectedCustomer) {
        // PUT: Update existing customer
        const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to update customer");
        alert("Customer updated successfully!");
      } else {
        // POST: Add new customer
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to add new customer");
        alert("Customer added successfully!");
      }

      // Re-fetch data to update UI
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(`Error saving customer. See console for details.`);
    }

    setIsAddDialogOpen(false);
    setSelectedCustomer(null);
    resetForm();
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete customer");

      alert(`Customer ${selectedCustomer.name} deleted successfully!`);
      fetchCustomers(); // Re-fetch data to update UI
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(`Error deleting customer. See console for details.`);
    }

    setIsDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      city: "",
      address: "",
      email: "",
    });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      city: customer.city || "",
      address: customer.address || "",
      email: customer.email || "",
    });
    setIsAddDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedCustomer(null);
    resetForm();
    setIsAddDialogOpen(true);
  };

  // -----------------------------------------------------------
  // 4. Filtering and Calculations
  // -----------------------------------------------------------
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.city &&
        customer.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = cityFilter === "all" || customer.city === cityFilter;

    return matchesSearch && matchesCity;
  });

  // Get unique cities for filter from the current customer list
  const cities = [
    "all",
    ...new Set(
      customers.map((c) => c.city).filter((c): c is string => c !== null)
    ),
  ];

  const totalOutstandingBalance = customers.reduce(
    (sum, c) => sum + c.outstanding_balance,
    0
  );
  const totalLifetimePaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your B2B customers and track their orders
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active business accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalOutstandingBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total amount due
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalLifetimePaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time customer payments
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
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
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
                Loading customers...
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {customer.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            customer.outstanding_balance > 0
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          LKR {customer.outstanding_balance.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              (window.location.href = `/customers/${customer.id}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
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

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer
                ? "Update customer information below"
                : "Enter the details of the new customer"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Perera Hardware"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.lk"
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
            <div className="space-y-2">
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
                setSelectedCustomer(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={loading}>
              {selectedCustomer ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCustomer?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
