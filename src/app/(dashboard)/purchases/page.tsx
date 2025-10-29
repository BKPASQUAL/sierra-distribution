// src/app/(dashboard)/purchases/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Calendar, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: number;
  totalItems: number;
  total: number;
  subtotal: number;
  totalDiscount: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch purchases from API
  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/purchases');
      const data = await response.json();

      if (response.ok && data.purchases) {
        setPurchases(data.purchases);
      } else {
        console.error('Failed to fetch purchases:', data.error);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const purchaseDate = new Date(purchase.date);
      const now = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = purchaseDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = purchaseDate >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = 
          purchaseDate.getMonth() === now.getMonth() &&
          purchaseDate.getFullYear() === now.getFullYear();
      }
    }
    
    return matchesSearch && matchesDate;
  });

  // Calculate stats
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalDiscount = purchases.reduce((sum, p) => sum + (p.totalDiscount || 0), 0);

  // Handle delete purchase
  const handleDelete = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Purchase order deleted successfully');
        fetchPurchases(); // Refresh the list
      } else {
        const data = await response.json();
        alert(`Failed to delete purchase: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Error deleting purchase order');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-lg text-muted-foreground">Loading purchases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1">
            Record and manage purchases from Sierra Cables Ltd
          </p>
        </div>
        <Button onClick={() => window.location.href = '/purchases/new'}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Purchase
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Purchase orders recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total expenditure
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              LKR {totalDiscount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From discounts
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
                  placeholder="Search by Purchase ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No purchases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(purchase.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {purchase.items} items
                    </TableCell>
                    <TableCell className="text-right">
                      {purchase.totalItems} units
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      LKR {(purchase.totalDiscount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {purchase.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => window.location.href = `/purchases/${purchase.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(purchase.id)}
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
    </div>
  );
}