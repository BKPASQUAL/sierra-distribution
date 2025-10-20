// src/app/(dashboard)/bills/page.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, FileText, Calendar, DollarSign } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock bills data
const mockBills = [
  {
    id: 'BILL-001',
    billNo: 'INV-2025-001',
    customerId: 1,
    customerName: 'Perera Hardware',
    date: '2025-01-15',
    items: 3,
    total: 245000,
    paid: 245000,
    balance: 0,
    orderStatus: 'Delivered',
    paymentStatus: 'Paid',
    paymentType: 'Bank Transfer',
  },
  {
    id: 'BILL-002',
    billNo: 'INV-2025-002',
    customerId: 2,
    customerName: 'Silva Electricals',
    date: '2025-01-14',
    items: 2,
    total: 180000,
    paid: 180000,
    balance: 0,
    orderStatus: 'Delivered',
    paymentStatus: 'Paid',
    paymentType: 'Cash',
  },
  {
    id: 'BILL-003',
    billNo: 'INV-2025-003',
    customerId: 3,
    customerName: 'Fernando Constructions',
    date: '2025-01-12',
    items: 5,
    total: 420000,
    paid: 200000,
    balance: 220000,
    orderStatus: 'Delivered',
    paymentStatus: 'Partial',
    paymentType: 'Credit',
  },
  {
    id: 'BILL-004',
    billNo: 'INV-2025-004',
    customerId: 4,
    customerName: 'Jayasinghe Hardware Store',
    date: '2025-01-10',
    items: 2,
    total: 156000,
    paid: 0,
    balance: 156000,
    orderStatus: 'Checking',
    paymentStatus: 'Unpaid',
    paymentType: 'Credit',
  },
  {
    id: 'BILL-005',
    billNo: 'INV-2025-005',
    customerId: 5,
    customerName: 'Mendis Electrician Services',
    date: '2025-01-08',
    items: 4,
    total: 310000,
    paid: 0,
    balance: 310000,
    orderStatus: 'Processing',
    paymentStatus: 'Unpaid',
    paymentType: 'Credit',
  },
];

// Mock customers for filter
const mockCustomers = [
  { id: 1, name: 'Perera Hardware' },
  { id: 2, name: 'Silva Electricals' },
  { id: 3, name: 'Fernando Constructions' },
  { id: 4, name: 'Jayasinghe Hardware Store' },
  { id: 5, name: 'Mendis Electrician Services' },
];

export default function BillsPage() {
  const [bills, setBills] = useState(mockBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCustomer = 
      customerFilter === 'all' || 
      bill.customerId.toString() === customerFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      bill.orderStatus === statusFilter;
    
    const matchesPayment = 
      paymentFilter === 'all' || 
      bill.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesCustomer && matchesStatus && matchesPayment;
  });

  // Calculate stats
  const totalBills = bills.length;
  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalOutstanding = bills.reduce((sum, b) => sum + b.balance, 0);
  const unpaidBills = bills.filter(b => b.paymentStatus === 'Unpaid').length;

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Checking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Bills</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={() => window.location.href = '/bills/new'}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total billed amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Amount due
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {unpaidBills}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending payment
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
                  placeholder="Search by bill no or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {mockCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNo}</TableCell>
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(bill.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{bill.items}</TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {bill.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={bill.balance > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        LKR {bill.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(bill.orderStatus)}`}>
                        {bill.orderStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(bill.paymentStatus)}`}>
                        {bill.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => window.location.href = `/bills/${bill.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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