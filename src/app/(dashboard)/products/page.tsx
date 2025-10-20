// src/app/(dashboard)/products/page.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: '2.5mm Single Core Wire',
    type: 'Single Core',
    size: '2.5mm',
    unit: 'roll',
    stock: 45,
    minStock: 50,
    pricePerUnit: 2500,
    totalValue: 112500,
  },
  {
    id: 2,
    name: '4.0mm Multi-strand Cable',
    type: 'Multi-strand',
    size: '4.0mm',
    unit: 'roll',
    stock: 28,
    minStock: 30,
    pricePerUnit: 3500,
    totalValue: 98000,
  },
  {
    id: 3,
    name: '1.5mm Flexible Wire',
    type: 'Flexible',
    size: '1.5mm',
    unit: 'roll',
    stock: 62,
    minStock: 40,
    pricePerUnit: 1800,
    totalValue: 111600,
  },
  {
    id: 4,
    name: '6.0mm House Wire',
    type: 'Single Core',
    size: '6.0mm',
    unit: 'roll',
    stock: 15,
    minStock: 20,
    pricePerUnit: 4200,
    totalValue: 63000,
  },
  {
    id: 5,
    name: '10mm Armoured Cable',
    type: 'Armoured',
    size: '10mm',
    unit: 'roll',
    stock: 8,
    minStock: 20,
    pricePerUnit: 8500,
    totalValue: 68000,
  },
  {
    id: 6,
    name: '16mm Single Core Wire',
    type: 'Single Core',
    size: '16mm',
    unit: 'roll',
    stock: 52,
    minStock: 25,
    pricePerUnit: 6800,
    totalValue: 353600,
  },
  {
    id: 7,
    name: '2.5mm Twin & Earth Cable',
    type: 'Twin & Earth',
    size: '2.5mm',
    unit: 'meter',
    stock: 450,
    minStock: 500,
    pricePerUnit: 85,
    totalValue: 38250,
  },
  {
    id: 8,
    name: '1.0mm Single Core Wire',
    type: 'Single Core',
    size: '1.0mm',
    unit: 'roll',
    stock: 55,
    minStock: 40,
    pricePerUnit: 1200,
    totalValue: 66000,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    unit: 'roll',
    stock: 0,
    minStock: 0,
    pricePerUnit: 0,
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.size.includes(searchQuery) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || product.type === typeFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock < product.minStock;
    } else if (stockFilter === 'in-stock') {
      matchesStock = product.stock >= product.minStock;
    }
    
    return matchesSearch && matchesType && matchesStock;
  });

  // Get unique types for filter
  const types = ['all', ...new Set(products.map(p => p.type))];

  const handleAddProduct = () => {
    if (selectedProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? { 
              ...p, 
              ...formData,
              totalValue: formData.stock * formData.pricePerUnit 
            }
          : p
      ));
    } else {
      // Add new product
      const newProduct = {
        id: products.length + 1,
        ...formData,
        totalValue: formData.stock * formData.pricePerUnit,
      };
      setProducts([...products, newProduct]);
    }
    setIsAddDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      size: '',
      unit: 'roll',
      stock: 0,
      minStock: 0,
      pricePerUnit: 0,
    });
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + p.totalValue, 0);
  const lowStockProducts = products.filter(p => p.stock < p.minStock).length;

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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
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
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
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
                      {type === 'all' ? 'All Types' : type}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      <span className={product.stock < product.minStock ? 'text-destructive font-medium' : ''}>
                        {product.stock} {product.unit}s
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        Min: {product.minStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {product.pricePerUnit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {product.totalValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => window.location.href = `/products/${product.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setFormData({
                              name: product.name,
                              type: product.type,
                              size: product.size,
                              unit: product.unit,
                              stock: product.stock,
                              minStock: product.minStock,
                              pricePerUnit: product.pricePerUnit,
                            });
                            setSelectedProduct(product);
                            setIsAddDialogOpen(true);
                          }}
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
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct 
                ? 'Update product information below'
                : 'Enter the details of the new wire product'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 2.5mm Single Core Wire"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Wire Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
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
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roll">Roll</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (LKR) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                min="0"
                placeholder="0"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock Level *</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
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
              {selectedProduct ? 'Update Product' : 'Add Product'}
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
              Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
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