// src/app/(dashboard)/products/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
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

// --- START: DB-UI Interface and Mapping ---
import { Database } from "@/types/database.types";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

interface Product {
  id: string;
  sku: string;
  name: string;
  type: string; // Maps to DB: category
  size: string; // Derived from name/description
  rollLength: number; // Derived from unit_of_measure
  stock: number; // Maps to DB: stock_quantity
  minStock: number; // Maps to DB: reorder_level
  mrp: number; // Maps to DB: unit_price / mrp
  totalValue: number; // Calculated
}

function mapDbProductToUiProduct(dbProduct: any): Product {
  // Extract length from unit_of_measure (e.g., "100m Roll" -> 100)
  const unitOfMeasure = dbProduct.unit_of_measure || dbProduct.name;
  const rollLengthMatch = unitOfMeasure?.match(/(\d+)(?:m| meter)/i);

  // Extract size (e.g., "2.5mm") from name or description
  const sizeMatch =
    dbProduct.name.match(/(\d+\.\d+|\d+)mm/i) ||
    dbProduct.description?.match(/Size: (\d+\.\d+|\d+)/i);

  const mrp = dbProduct.unit_price ?? 0;
  const stock = dbProduct.stock_quantity ?? 0;
  const minStock = dbProduct.reorder_level ?? 0;

  return {
    id: dbProduct.id.toString(),
    sku: dbProduct.sku,
    name: dbProduct.name,
    type: dbProduct.category || "Other", // UI 'type' maps to DB 'category'
    size: sizeMatch
      ? sizeMatch[1] + (dbProduct.name.includes("mm") ? "mm" : "")
      : "N/A",
    rollLength: rollLengthMatch ? parseInt(rollLengthMatch[1]) : 100, // Default to 100m
    stock: stock,
    minStock: minStock,
    mrp: mrp,
    totalValue: stock * mrp,
  };
}
// --- END: DB-UI Interface and Mapping ---

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Single Core",
    size: "",
    rollLength: 100,
    customRollLength: 0,
    stock: 0,
    minStock: 0,
    mrp: 0,
  });

  // -----------------------------------------------------------
  // 1. Data Fetching
  // -----------------------------------------------------------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok && data.products) {
        const uiProducts = (data.products as any[]).map(
          mapDbProductToUiProduct
        );
        setProducts(uiProducts);
      } else {
        console.error("Failed to fetch products:", data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error("Network error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // -----------------------------------------------------------
  // 2. CRUD Handlers
  // -----------------------------------------------------------

  const handleAddProduct = async () => {
    // Basic form validation
    if (
      !formData.name ||
      !formData.type ||
      !formData.size ||
      formData.mrp <= 0 ||
      isNaN(formData.mrp)
    ) {
      alert(
        "Please fill all required fields: Name, Type, Size, and MRP (must be positive)."
      );
      return;
    }

    const finalRollLength =
      formData.rollLength === 0
        ? formData.customRollLength
        : formData.rollLength;

    // Map UI fields to DB schema (ProductInsert/ProductUpdate)
    const payload = {
      name: formData.name,
      category: formData.type, // UI 'type' maps to DB 'category'
      unit_price: formData.mrp,
      stock_quantity: formData.stock,
      reorder_level: formData.minStock,
      unit_of_measure: `${finalRollLength}m Roll`, // Store full unit_of_measure
      description: `Size: ${formData.size}, Length: ${finalRollLength}m`, // Keep detailed description
      is_active: true,
      mrp: formData.mrp,
      // NOTE: Removed barcode, type, size, roll_length from payload, as per the request
      // and updated database schema.
    };

    try {
      let response;
      if (selectedProduct) {
        // PUT: Update existing product
        response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload as ProductUpdate),
        });

        if (!response.ok) throw new Error("Failed to update product");
        alert("Product updated successfully!");
      } else {
        // POST: Add new product
        const insertPayload: ProductInsert = {
          ...payload,
          // Placeholder SKU - ideally from server-side logic
          sku: `SKU-${Date.now().toString().slice(-6)}`,
        } as ProductInsert;

        response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(insertPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          throw new Error(errorData.error || "Failed to add new product");
        }
        alert("Product added successfully!");
      }

      // Refresh data to update UI
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(`Error saving product: ${(error as Error).message}`);
    }

    setIsAddDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      alert(`Product ${selectedProduct.name} deleted successfully!`);
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(`Error deleting product. See console for details.`);
    }

    setIsDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Single Core",
      size: "",
      rollLength: 100,
      customRollLength: 0,
      stock: 0,
      minStock: 0,
      mrp: 0,
    });
  };

  const openEditDialog = (product: Product) => {
    const isStandardLength = [50, 100, 500].includes(product.rollLength);
    setFormData({
      name: product.name,
      type: product.type,
      size: product.size,
      rollLength: isStandardLength ? product.rollLength : 0,
      customRollLength: isStandardLength ? 0 : product.rollLength,
      stock: product.stock,
      minStock: product.minStock,
      mrp: product.mrp,
    });
    setSelectedProduct(product);
    setIsAddDialogOpen(true);
  };

  // -----------------------------------------------------------
  // 3. Filtering and Calculations (Using fetched data)
  // -----------------------------------------------------------

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.size.includes(searchQuery) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || product.type === product.type;

    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = product.stock < product.minStock;
    } else if (stockFilter === "in-stock") {
      matchesStock = product.stock >= product.minStock;
    }

    return matchesSearch && matchesType && matchesStock;
  });

  const types = ["all", ...new Set(products.map((p) => p.type))];

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + p.totalValue, 0);
  const lowStockProducts = products.filter((p) => p.stock < p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage wire products and inventory
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            resetForm();
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Products in catalog
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalStockValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current inventory worth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need reordering
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
                  placeholder="Search by name, size, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading products...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Roll Length (m)</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.name}
                          {product.stock < product.minStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {product.type}
                        </span>
                      </TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell className="text-right">
                        {product.rollLength}m
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            product.stock < product.minStock
                              ? "text-destructive font-medium"
                              : ""
                          }
                        >
                          {product.stock} rolls
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Min: {product.minStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {product.mrp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {product.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              (window.location.href = `/products/${product.id}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedProduct(product);
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? "Update product information below"
                : "Enter the details of the new wire product"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 2.5mm Single Core Wire"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Wire Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single Core">Single Core</SelectItem>
                  <SelectItem value="Multi-strand">Multi-strand</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                  <SelectItem value="Armoured">Armoured</SelectItem>
                  <SelectItem value="Twin & Earth">Twin & Earth</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Wire Size *</Label>
              <Input
                id="size"
                placeholder="e.g., 2.5mm"
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollLength">Roll Length (meters) *</Label>
              <Select
                value={formData.rollLength.toString()}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setFormData({ ...formData, rollLength: 0 });
                  } else {
                    setFormData({
                      ...formData,
                      rollLength: parseFloat(value),
                      customRollLength: 0,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select roll length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 meters</SelectItem>
                  <SelectItem value="100">100 meters</SelectItem>
                  <SelectItem value="500">500 meters</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.rollLength === 0 && (
              <div className="space-y-2">
                <Label htmlFor="customRollLength">
                  Custom Roll Length (meters) *
                </Label>
                <Input
                  id="customRollLength"
                  type="number"
                  min="0"
                  placeholder="Enter custom length"
                  value={formData.customRollLength}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customRollLength: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP per Roll (LKR) *</Label>
              <Input
                id="mrp"
                type="number"
                min="0"
                placeholder="0"
                value={formData.mrp}
                onChange={(e) =>
                  // Robust float parsing, defaults to 0 if input is empty string or NaN
                  setFormData({
                    ...formData,
                    mrp: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock (rolls) *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock}
                onChange={(e) =>
                  // Robust integer parsing, defaults to 0
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock Level (rolls) *</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minStock}
                onChange={(e) =>
                  // Robust integer parsing, defaults to 0
                  setFormData({
                    ...formData,
                    minStock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedProduct(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProduct}>
              {selectedProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProduct?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
