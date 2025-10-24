// src/app/(dashboard)/suppliers/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Edit,
  Package,
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

// -----------------------------------------------------------
// 1. Define Supplier Interface
// -----------------------------------------------------------
interface Supplier {
  id: string; // UUID from DB
  supplier_code: string;
  name: string;
  contact: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  created_at: string; // Used for joined date
  // Mocked fields to maintain UI functionality
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
}

// Mock derived data (for UI placeholders - replace with API calls later)
const mockDerivedData = {
  totalPurchases: 45,
  totalAmount: 12500000,
  lastPurchase: "2025-01-15",
};

// Mock purchase history
const purchaseHistory = [
  {
    id: "PUR-001",
    date: "2025-01-15",
    total: 230000,
    status: "Received",
    paymentStatus: "Paid",
    items: [
      {
        name: "2.5mm Single Core Wire",
        quantity: 50,
        unit: "rolls",
        price: 2500,
      },
      {
        name: "4.0mm Multi-strand Cable",
        quantity: 30,
        unit: "rolls",
        price: 3500,
      },
    ],
  },
  {
    id: "PUR-002",
    date: "2025-01-10",
    total: 348000,
    status: "Received",
    paymentStatus: "Paid",
    items: [
      {
        name: "1.5mm Flexible Wire",
        quantity: 100,
        unit: "rolls",
        price: 1800,
      },
      { name: "6.0mm House Wire", quantity: 40, unit: "rolls", price: 4200 },
    ],
  },
  {
    id: "PUR-003",
    date: "2025-01-05",
    total: 357500,
    status: "Received",
    paymentStatus: "Pending",
    items: [
      {
        name: "2.5mm Single Core Wire",
        quantity: 75,
        unit: "rolls",
        price: 2500,
      },
      { name: "10mm Armoured Cable", quantity: 20, unit: "rolls", price: 8500 },
    ],
  },
];

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------
  // 2. Data Fetching Hook
  // -----------------------------------------------------------
  useEffect(() => {
    async function fetchSupplier() {
      if (!supplierId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/suppliers/${supplierId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to fetch supplier ${supplierId}`
          );
        }

        // Map API response to our local Supplier interface, injecting mock derived data
        const fetchedSupplier: Supplier = {
          ...data.supplier,
          id: data.supplier.id,
          // Inject mock derived data to keep the UI functional
          totalPurchases: mockDerivedData.totalPurchases,
          totalAmount: mockDerivedData.totalAmount,
          lastPurchase: mockDerivedData.lastPurchase,
        };

        setSupplier(fetchedSupplier);
      } catch (err) {
        console.error("Error fetching supplier:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">
          Loading supplier details...
        </p>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">
          Failed to load supplier details for ID: {supplierId}.
        </p>
        {error && <p className="text-red-500">Details: {error}</p>}
        <Button onClick={() => router.push("/suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suppliers List
        </Button>
      </div>
    );
  }

  // Assign fetched supplier data to a local variable for cleaner access in JSX
  const currentSupplier = supplier;

  // Calculate derived fields
  const avgOrder =
    currentSupplier.totalPurchases > 0
      ? Math.round(currentSupplier.totalAmount / currentSupplier.totalPurchases)
      : 0;

  const lastPurchaseDate = new Date(
    currentSupplier.lastPurchase
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const joinedDate = new Date(currentSupplier.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/suppliers")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {currentSupplier.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Supplier Code: #{currentSupplier.supplier_code} •{" "}
            {currentSupplier.category}
          </p>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Supplier
        </Button>
      </div>

      {/* Supplier Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSupplier.totalPurchases}
            </div>
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
              LKR {currentSupplier.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time expenditure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {avgOrder.toLocaleString()}
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
            <div className="text-2xl font-bold">{lastPurchaseDate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Joined: {joinedDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Supplier contact details and address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{currentSupplier.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{currentSupplier.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{currentSupplier.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentSupplier.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{currentSupplier.category}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                All purchases made from this supplier
              </CardDescription>
            </div>
            <Button size="sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseHistory.map((purchase) => (
              <div
                key={purchase.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Purchase Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{purchase.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      LKR {purchase.total.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === "Received"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {purchase.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          purchase.paymentStatus === "Paid"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Items */}
                <div className="mt-3 pt-3 border-t">
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
                      {purchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {item.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            LKR {(item.quantity * item.price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
