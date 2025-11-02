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
  DollarSign,
  CheckCircle2,
  X,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  mrp: number; // Maps to DB: mrp
  sellingPrice: number; // Maps to DB: unit_price (optional default selling price)
  costPrice: number; // Maps to DB: cost_price
  discountPercent: number; // Standard discount percentage for this product
  totalValue: number; // Calculated: stock × MRP
  totalCost: number; // Calculated: stock × cost_price
  profitMargin: number; // Calculated: ((MRP - cost_price) / MRP) × 100
}

function mapDbProductToUiProduct(dbProduct: any): Product {
  // Extract length from unit_of_measure (e.g., "100m Roll" -> 100)
  const unitOfMeasure = dbProduct.unit_of_measure || dbProduct.name;
  const rollLengthMatch = unitOfMeasure?.match(/(\d+)(?:m| meter)/i);

  // Extract size (e.g., "2.5mm") from name or description
  const sizeMatch =
    dbProduct.name.match(/(\d+\.\d+|\d+)mm/i) ||
    dbProduct.description?.match(/Size: (\d+\.\d+|\d+)/i);

  const mrp = dbProduct.mrp ?? 0;
  // Use selling_price column from database (new column)
  const sellingPrice = dbProduct.selling_price ?? mrp; // Default to MRP if no selling price set
  const costPrice = dbProduct.cost_price ?? 0;
  const stock = dbProduct.stock_quantity ?? 0;
  const minStock = dbProduct.reorder_level ?? 0;
  const discountPercent = dbProduct.discount_percent ?? 0;

  const totalValue = stock * mrp;
  const totalCost = stock * costPrice;
  const profitMargin = mrp > 0 ? ((mrp - costPrice) / mrp) * 100 : 0;

  return {
    id: dbProduct.id.toString(),
    sku: dbProduct.sku,
    name: dbProduct.name,
    type: dbProduct.category || "Other",
    size: sizeMatch
      ? sizeMatch[1] + (dbProduct.name.includes("mm") ? "mm" : "")
      : "N/A",
    rollLength: rollLengthMatch ? parseInt(rollLengthMatch[1]) : 100,
    stock: stock,
    minStock: minStock,
    mrp: mrp,
    sellingPrice: sellingPrice,
    costPrice: costPrice,
    discountPercent: discountPercent,
    totalValue: totalValue,
    totalCost: totalCost,
    profitMargin: profitMargin,
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
    sellingPrice: 0, // NEW: Optional selling price field
    costPrice: 0,
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

    // If selling price is not set or is 0, default it to MRP
    const finalSellingPrice =
      formData.sellingPrice > 0 ? formData.sellingPrice : formData.mrp;

    // Map UI fields to DB schema (ProductInsert/ProductUpdate)
    const payload = {
      name: formData.name,
      category: formData.type,
      unit_price: finalSellingPrice, // Keep for backward compatibility
      selling_price: finalSellingPrice, // NEW: Save to selling_price column
      cost_price: formData.costPrice,
      stock_quantity: formData.stock,
      reorder_level: formData.minStock,
      unit_of_measure: `${finalRollLength}m Roll`,
      description: `Size: ${formData.size}, Length: ${finalRollLength}m`,
      is_active: true,
      mrp: formData.mrp,
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
        setSuccessMessage(`Product "${formData.name}" updated successfully!`);
      } else {
        // POST: Add new product
        const insertPayload: ProductInsert = {
          ...payload,
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
        setSuccessMessage(`Product "${formData.name}" added successfully!`);
      }

      // Show success alert and auto-close after 3 seconds
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);

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

      setSuccessMessage(
        `Product "${selectedProduct.name}" deleted successfully!`
      );
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);

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
      sellingPrice: 0,
      costPrice: 0,
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
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
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
  const totalCostValue = products.reduce((sum, p) => sum + p.totalCost, 0);
  const lowStockProducts = products.filter((p) => p.stock < p.minStock).length;

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return "text-green-600";
    if (margin >= 20) return "text-blue-600";
    if (margin >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Success Alert - Fixed Position Right Side */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              {successMessage}
            </AlertDescription>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="absolute top-2 right-2 rounded-md p-1 hover:bg-green-100"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </Alert>
        </div>
      )}

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
              Stock Value (MRP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalStockValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At selling price
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              LKR {totalCostValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acquisition cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">
                  {lowStockProducts} Products Need Reordering
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stock levels are below minimum threshold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Roll Length</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
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
                        <TableCell className="text-right text-blue-600">
                          LKR {product.costPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          LKR {product.sellingPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {product.mrp.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {product.totalCost.toLocaleString()}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <SelectItem value="Twin">Twin</SelectItem>
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
              <Label htmlFor="costPrice">Cost Price per Roll (LKR)</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                What you paid to supplier
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP per Roll (LKR) *</Label>
              <Input
                id="mrp"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.mrp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mrp: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximum Retail Price
              </p>
            </div>

            {/* NEW: Optional Selling Price Field */}
            <div className="col-span-2 space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sellingPrice">
                  Default Selling Price (LKR)
                </Label>
                <span className="text-xs text-muted-foreground italic">
                  Optional
                </span>
              </div>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave empty to use MRP"
                value={formData.sellingPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                💡 If you want a different default price than MRP, enter it
                here. Leave empty to use MRP as selling price.
              </p>
              {formData.sellingPrice > 0 && formData.mrp > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                  <p className="text-xs text-blue-700">
                    <strong>Discount:</strong>{" "}
                    {(
                      ((formData.mrp - formData.sellingPrice) / formData.mrp) *
                      100
                    ).toFixed(1)}
                    % off MRP
                  </p>
                </div>
              )}
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
