// src/app/(dashboard)/suppliers/page.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Phone, MapPin, Package } from 'lucide-react';
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

// Mock supplier data
const mockSuppliers = [
  {
    id: 1,
    name: 'Sierra Cables Ltd',
    contact: '+94 11 234 5678',
    city: 'Colombo',
    address: '456 Industrial Zone, Colombo 10',
    email: 'sales@sierracables.lk',
    category: 'Cables & Wires',
    totalPurchases: 45,
    totalAmount: 12500000,
    lastPurchase: '2025-01-15',
  },
  {
    id: 2,
    name: 'Lanka Wire Industries',
    contact: '+94 11 345 6789',
    city: 'Colombo',
    address: '789 Export Processing Zone, Katunayake',
    email: 'info@lankawire.lk',
    category: 'Cables & Wires',
    totalPurchases: 32,
    totalAmount: 8900000,
    lastPurchase: '2025-01-12',
  },
  {
    id: 3,
    name: 'Ceylon Electrical Supplies',
    contact: '+94 81 456 7890',
    city: 'Kandy',
    address: '123 Peradeniya Road, Kandy',
    email: 'ceylon@electrical.lk',
    category: 'Electrical Components',
    totalPurchases: 18,
    totalAmount: 3400000,
    lastPurchase: '2025-01-08',
  },
  {
    id: 4,
    name: 'National Cable Corporation',
    contact: '+94 11 567 8901',
    city: 'Colombo',
    address: '321 Baseline Road, Colombo 09',
    email: 'national@cables.lk',
    category: 'Cables & Wires',
    totalPurchases: 28,
    totalAmount: 6700000,
    lastPurchase: '2025-01-10',
  },
  {
    id: 5,
    name: 'Asia Wire Manufacturing',
    contact: '+94 91 678 9012',
    city: 'Galle',
    address: '567 Industrial Estate, Galle',
    email: 'asia@wire.lk',
    category: 'Cables & Wires',
    totalPurchases: 22,
    totalAmount: 5200000,
    lastPurchase: '2025-01-14',
  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<typeof mockSuppliers[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    city: '',
    address: '',
    email: '',
    category: '',
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact.includes(searchQuery) ||
      supplier.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...new Set(suppliers.map(s => s.category))];

  const handleAddSupplier = () => {
    if (selectedSupplier) {
      // Update existing supplier
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id 
          ? { ...s, ...formData }
          : s
      ));
    } else {
      // Add new supplier
      const newSupplier = {
        id: suppliers.length + 1,
        ...formData,
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchase: new Date().toISOString().split('T')[0],
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setIsAddDialogOpen(false);
    setSelectedSupplier(null);
    resetForm();
  };

  const handleDeleteSupplier = () => {
    if (selectedSupplier) {
      setSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id));
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      city: '',
      address: '',
      email: '',
      category: '',
    });
  };

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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)}
            </div>
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
              LKR {suppliers.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
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
                          onClick={() => window.location.href = `/suppliers/${supplier.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setFormData({
                              name: supplier.name,
                              contact: supplier.contact,
                              city: supplier.city,
                              address: supplier.address,
                              email: supplier.email,
                              category: supplier.category,
                            });
                            setSelectedSupplier(supplier);
                            setIsAddDialogOpen(true);
                          }}
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
        </CardContent>
      </Card>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier 
                ? 'Update supplier information below'
                : 'Enter the details of the new supplier'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sierra Cables Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cables & Wires">Cables & Wires</SelectItem>
                  <SelectItem value="Electrical Components">Electrical Components</SelectItem>
                  <SelectItem value="Tools & Equipment">Tools & Equipment</SelectItem>
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
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.lk"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="e.g., Colombo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            <Button onClick={handleAddSupplier}>
              {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
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
              Are you sure you want to delete {selectedSupplier?.name}? This action cannot be undone.
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