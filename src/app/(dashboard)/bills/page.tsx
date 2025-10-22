// src/app/(dashboard)/bills/page.tsx
"use client";

import React, { useState } from "react";
import { Plus, Search, Eye, Calendar, Filter } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock bills data
const mockBills = [
  {
    id: "INV-001",
    date: "2025-01-15",
    customer: "Perera Hardware",
    customerId: 1,
    items: 3,
    total: 245000,
    discount: 12250,
    paid: 245000,
    balance: 0,
    status: "Delivered",
    paymentType: "Bank",
  },
  {
    id: "INV-002",
    date: "2025-01-14",
    customer: "Silva Electricals",
    customerId: 2,
    items: 2,
    total: 180000,
    discount: 9000,
    paid: 180000,
    balance: 0,
    status: "Delivered",
    paymentType: "Cash",
  },
  {
    id: "INV-003",
    date: "2025-01-12",
    customer: "Fernando Constructions",
    customerId: 3,
    items: 5,
    total: 425000,
    discount: 21250,
    paid: 300000,
    balance: 125000,
    status: "Checking",
    paymentType: "Credit",
  },
  {
    id: "INV-004",
    date: "2025-01-10",
    customer: "Jayasinghe Hardware Store",
    customerId: 4,
    items: 2,
    total: 165000,
    discount: 8250,
    paid: 165000,
    balance: 0,
    status: "Delivered",
    paymentType: "Bank",
  },
  {
    id: "INV-005",
    date: "2025-01-08",
    customer: "Mendis Electrician Services",
    customerId: 5,
    items: 4,
    total: 320000,
    discount: 16000,
    paid: 0,
    balance: 320000,
    status: "Processing",
    paymentType: "Credit",
  },
];

// Mock customers for filter
const mockCustomers = [
  { id: 1, name: "Perera Hardware" },
  { id: 2, name: "Silva Electricals" },
  { id: 3, name: "Fernando Constructions" },
  { id: 4, name: "Jayasinghe Hardware Store" },
  { id: 5, name: "Mendis Electrician Services" },
];

export default function BillsPage() {
  const [bills, setBills] = useState(mockBills);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer =
      customerFilter === "all" || bill.customerId.toString() === customerFilter;

    const matchesStatus =
      statusFilter === "all" || bill.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const billDate = new Date(bill.date);
      const now = new Date();

      if (dateFilter === "today") {
        matchesDate = billDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = billDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate =
          billDate.getMonth() === now.getMonth() &&
          billDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
  });

  // Calculate stats
  const totalBills = bills.length;
  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalBalance = bills.reduce((sum, b) => sum + b.balance, 0);
  const pendingBills = bills.filter((b) => b.balance > 0).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Checking":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
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
        <Button onClick={() => (window.location.href = "/bills/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Billed amount</p>
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
              LKR {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingBills}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bills with balance
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
                  placeholder="Search by invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {mockCustomers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Date" />
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
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(bill.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {bill.customer}
                    </TableCell>
                    <TableCell>{bill.id}</TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {bill.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      -LKR {bill.discount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {bill.paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          bill.balance > 0
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        LKR {bill.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          bill.status
                        )}`}
                      >
                        {bill.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          (window.location.href = `/bills/${bill.id}`)
                        }
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
