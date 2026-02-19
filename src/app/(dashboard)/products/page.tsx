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
  FileSpreadsheet,
  FileText,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import export libraries
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// --- START: DB-UI Interface and Mapping ---
import { Database } from "@/types/database.types";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

interface Product {
  id: string;
  sku: string;
  name: string;
  type: string;
  size: string;
  rollLength: number;
  stock: number;
  minStock: number;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  discountPercent: number;
  totalValue: number;
  totalCost: number;
  profitMargin: number;
}

function mapDbProductToUiProduct(dbProduct: any): Product {
  const unitOfMeasure = dbProduct.unit_of_measure || dbProduct.name;
  const rollLengthMatch = unitOfMeasure?.match(/(\d+)(?:m| meter)/i);

  const sizeMatch =
    dbProduct.name.match(/(\d+\.\d+|\d+)mm/i) ||
    dbProduct.description?.match(/Size: (\d+\.\d+|\d+)/i);

  const mrp = dbProduct.mrp ?? 0;
  const sellingPrice = dbProduct.selling_price ?? mrp;
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

type SortField =
  | "name"
  | "type"
  | "size"
  | "stock"
  | "costPrice"
  | "sellingPrice"
  | "mrp"
  | "totalCost";
type SortOrder = "asc" | "desc";

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
    sellingPrice: 0,
    costPrice: 0,
  });
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sorting state (removed selection state)
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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

    const finalSellingPrice =
      formData.sellingPrice > 0 ? formData.sellingPrice : formData.mrp;

    const payload = {
      name: formData.name,
      category: formData.type,
      unit_price: finalSellingPrice,
      selling_price: finalSellingPrice,
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
        response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload as ProductUpdate),
        });

        if (!response.ok) throw new Error("Failed to update product");
        setSuccessMessage(`Product "${formData.name}" updated successfully!`);
      } else {
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

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);

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
  // 3. Sorting Handlers
  // -----------------------------------------------------------

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  // -----------------------------------------------------------
  // 4. Filtering and Sorting
  // -----------------------------------------------------------

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.size.includes(searchQuery) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || product.type === typeFilter;

    let matchesStock = true;
    if (stockFilter === "out-of-stock") {
      matchesStock = product.stock === 0;
    } else if (stockFilter === "low") {
      matchesStock = product.stock > 0 && product.stock < product.minStock;
    } else if (stockFilter === "in-stock") {
      matchesStock = product.stock > 0 && product.stock >= product.minStock;
    }

    return matchesSearch && matchesType && matchesStock;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const types = ["all", ...new Set(products.map((p) => p.type))];

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + p.totalValue, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.totalCost, 0);
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock < p.minStock
  ).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, stockFilter, sortField, sortOrder]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // -----------------------------------------------------------
  // 5. Report Generation Functions (Updated - All Products)
  // -----------------------------------------------------------

  const generateExcelReport = () => {
    if (sortedProducts.length === 0) {
      alert("No products to export. Please adjust your filters.");
      return;
    }

    // Use sortedProducts (all filtered and sorted products)
    const excelData = sortedProducts.map((product) => ({
      SKU: product.sku,
      "Product Name": product.name,
      Type: product.type,
      Size: product.size,
      "Roll Length (m)": product.rollLength,
      "Stock (rolls)": product.stock,
      "Min Stock": product.minStock,
      "Selling Price (LKR)": product.sellingPrice,
      "MRP (LKR)": product.mrp,
    }));

    // Add summary row with only Stock total
    const totalStockAll = sortedProducts.reduce((sum, p) => sum + p.stock, 0);

    excelData.push({
      SKU: "",
      "Product Name": "TOTAL",
      Type: "",
      Size: "",
      "Roll Length (m)": "",
      "Stock (rolls)": totalStockAll,
      "Min Stock": "",
      "Selling Price (LKR)": "",
      "MRP (LKR)": "",
    } as any);

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Report");

    // Auto-width columns
    const maxWidth = excelData.reduce((w: any, r: any) => {
      return Object.keys(r).map((k, i) => {
        const currentWidth = w[i] || 10;
        const cellValue = String(r[k] || "");
        return Math.max(currentWidth, cellValue.length + 2);
      });
    }, []);

    ws["!cols"] = maxWidth.map((w: number) => ({ width: w }));

    // Generate file
    const fileName = `Products_Report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);

    setSuccessMessage(
      `Excel report generated successfully! (${sortedProducts.length} products)`
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const generatePDFReport = () => {
    if (sortedProducts.length === 0) {
      alert("No products to export. Please adjust your filters.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add title
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Sierra Distribution", 14, 15);
    doc.setFontSize(12);
    doc.text("Products Report", 14, 22);

    // Add metadata
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Products: ${sortedProducts.length}`, 14, 33);

    // Prepare table data (removed Cost Price, Total Cost, Total Value, Profit Margin)
    const tableData = sortedProducts.map((product) => [
      product.sku,
      product.name,
      product.type,
      product.size,
      `${product.rollLength}m`,
      product.stock.toString(),
      product.minStock.toString(),
      product.sellingPrice.toLocaleString(),
      product.mrp.toLocaleString(),
    ]);

    // Add totals row (only Stock total)
    const totalStockAll = sortedProducts.reduce((sum, p) => sum + p.stock, 0);

    tableData.push([
      "",
      "TOTAL",
      "",
      "",
      "",
      totalStockAll.toString(),
      "",
      "",
      "",
    ]);

    // Generate table using autoTable
    autoTable(doc, {
      head: [
        [
          "SKU",
          "Product Name",
          "Type",
          "Size",
          "Length",
          "Stock",
          "Min",
          "Sell Price",
          "MRP",
        ],
      ],
      body: tableData,
      startY: 38,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 18, halign: "left" }, // SKU
        1: { cellWidth: 45, halign: "left" }, // Product Name
        2: { cellWidth: 20, halign: "center" }, // Type
        3: { cellWidth: 13, halign: "center" }, // Size
        4: { cellWidth: 15, halign: "center" }, // Length
        5: { cellWidth: 15, halign: "center" }, // Stock
        6: { cellWidth: 12, halign: "center" }, // Min
        7: { cellWidth: 20, halign: "right" }, // Sell Price
        8: { cellWidth: 20, halign: "right" }, // MRP
      },
      didParseCell: (data: any) => {
        // Bold the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const fileName = `Products_Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    setSuccessMessage(
      `PDF report generated successfully! (${sortedProducts.length} products)`
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
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
        <div className="flex items-center gap-2">
          {/* Report Generation Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={generateExcelReport}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export to Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generatePDFReport}>
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
            <div className="grid grid-cols-2 gap-2 w-full md:flex md:items-center md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[160px]">
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
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
            <React.Fragment>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {currentPageProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No products found</div>
                ) : (
                  currentPageProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      {/* Product name + badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-snug">{product.name}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {product.type}
                            </span>
                            {product.stock === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Out of Stock
                              </span>
                            ) : product.stock < product.minStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (window.location.href = `/products/${product.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-muted/40 rounded-md p-3">
                        <div className="text-muted-foreground">Size</div>
                        <div className="font-medium text-right">{product.size}</div>
                        <div className="text-muted-foreground">Roll Length</div>
                        <div className="font-medium text-right">{product.rollLength}m</div>
                        <div className="text-muted-foreground">Stock</div>
                        <div className={`font-medium text-right ${
                          product.stock === 0 ? 'text-red-600' : product.stock < product.minStock ? 'text-destructive' : ''
                        }`}>{product.stock} rolls</div>
                        <div className="text-muted-foreground">Cost Price</div>
                        <div className="font-medium text-right text-blue-600">LKR {product.costPrice.toLocaleString()}</div>
                        <div className="text-muted-foreground">Selling Price</div>
                        <div className="font-medium text-right text-green-600">LKR {product.sellingPrice.toLocaleString()}</div>
                        <div className="text-muted-foreground">MRP</div>
                        <div className="font-medium text-right">LKR {product.mrp.toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Product Name
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center">
                        Type
                        {getSortIcon("type")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("size")}
                    >
                      <div className="flex items-center">
                        Size
                        {getSortIcon("size")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Roll Length</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("stock")}
                    >
                      <div className="flex items-center justify-end">
                        Stock
                        {getSortIcon("stock")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("sellingPrice")}
                    >
                      <div className="flex items-center justify-end">
                        Selling Price
                        {getSortIcon("sellingPrice")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("mrp")}
                    >
                      <div className="flex items-center justify-end">
                        MRP
                        {getSortIcon("mrp")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPageProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.name}
                            {product.stock === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Out of Stock
                              </span>
                            ) : product.stock < product.minStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </span>
                            ) : null}
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
                              product.stock === 0
                                ? "text-red-600 font-bold"
                                : product.stock < product.minStock
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
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/products/${product.id}`)
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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
            </React.Fragment>
          )}

          {/* Pagination Controls */}
          {!loading && sortedProducts.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, sortedProducts.length)} of{" "}
                {sortedProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(1)}
                        className="w-9"
                      >
                        1
                      </Button>
                      {currentPage > 4 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                    </>
                  )}

                  {/* Pages around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === currentPage ||
                        page === currentPage - 1 ||
                        page === currentPage + 1 ||
                        page === currentPage - 2 ||
                        page === currentPage + 2
                    )
                    .filter((page) => page > 0 && page <= totalPages)
                    .map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-9"
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={
                          currentPage === totalPages ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        className="w-9"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
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
