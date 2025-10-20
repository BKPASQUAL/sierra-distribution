// src/app/(dashboard)/customers/page.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Phone, MapPin, DollarSign } from 'lucide-react';
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

// Mock customer data
const mockCustomers = [
  {
    id: 1,
    name: 'Perera Hardware',
    contact: '+94 77 123 4567',
    city: 'Colombo',
    address: '123 Galle Road, Colombo 03',
    email: 'perera@hardware.lk',
    balance: 45000,
    totalOrders: 23,
    totalPaid: 2340000,
  },
  {
    id: 2,
    name: 'Silva Electricals',
    contact: '+94 71 234 5678',
    city: 'Kandy',
    address: '45 Peradeniya Road, Kandy',
    email: 'silva@electric.lk',
    balance: 0,
    totalOrders: 15,
    totalPaid: 1500000,
  },
  {
    id: 3,
    name: 'Fernando Constructions',
    contact: '+94 76 345 6789',
    city: 'Galle',
    address: '78 Main Street, Galle',
    email: 'fernando@constructions.lk',
    balance: 125000,
    totalOrders: 45,
    totalPaid: 5600000,
  },
  {
    id: 4,
    name: 'Jayasinghe Hardware Store',
    contact: '+94 75 456 7890',
    city: 'Colombo',
    address: '234 High Level Road, Nugegoda',
    email: 'jayasinghe@store.lk',
    balance: 23000,
    totalOrders: 12,
    totalPaid: 890000,
  },
  {
    id: 5,
    name: 'Mendis Electrician Services',
    contact: '+94 77 567 8901',
    city: 'Matara',
    address: '56 Beach Road, Matara',
    email: 'mendis@services.lk',
    balance: 78000,
    totalOrders: 34,
    totalPaid: 3200000,
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    city: '',
    address: '',
    email: '',
  });

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.includes(searchQuery) ||
      customer.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = cityFilter === 'all' || customer.city === cityFilter;
    
    return matchesSearch && matchesCity;
  });

  // Get unique cities for filter
  const cities = ['all', ...new Set(customers.map(c => c.city))];

  const handleAddCustomer = () => {
    const newCustomer = {
      id: customers.length + 1,
      ...formData,
      balance: 0,
      totalOrders: 0,
      totalPaid: 0,
    };
    setCustomers([...customers, newCustomer]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      city: '',
      address: '',
      email: '',
    });
  };

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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
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
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {customers.reduce((sum, c) => sum + c.balance, 0).toLocaleString()}
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
              LKR {customers.reduce((sum, c) => sum + c.totalPaid, 0).toLocaleString()}
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
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === 'all' ? 'All Cities' : city}
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {customer.contact}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {customer.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={customer.balance > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        LKR {customer.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => window.location.href = `/customers/${customer.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setFormData({
                              name: customer.name,
                              contact: customer.contact,
                              city: customer.city,
                              address: customer.address,
                              email: customer.email,
                            });
                            setSelectedCustomer(customer);
                            setIsAddDialogOpen(true);
                          }}
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
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer 
                ? 'Update customer information below'
                : 'Enter the details of the new customer'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Perera Hardware"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                placeholder="+94 77 123 4567"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.lk"
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
            <div className="space-y-2">
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
                setSelectedCustomer(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomer}>
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
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
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
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
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}