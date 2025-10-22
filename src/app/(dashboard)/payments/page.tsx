// src/app/(dashboard)/payments/page.tsx
"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
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

// Payment type definition
interface Payment {
  id: string;
  date: string;
  billId: string;
  customer: string;
  customerId: number;
  amount: number;
  method: string;
  reference: string;
  billTotal: number;
  previousBalance: number;
  remainingBalance: number;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeStatus: "Pending" | "Passed" | "Returned" | null;
}

// Mock payments data
const mockPayments: Payment[] = [
  {
    id: "PAY-001",
    date: "2025-01-15",
    billId: "INV-001",
    customer: "Perera Hardware",
    customerId: 1,
    amount: 245000,
    method: "Bank",
    reference: "TXN123456",
    billTotal: 245000,
    previousBalance: 245000,
    remainingBalance: 0,
    chequeNo: null,
    chequeDate: null,
    chequeStatus: null,
  },
  {
    id: "PAY-002",
    date: "2025-01-14",
    billId: "INV-002",
    customer: "Silva Electricals",
    customerId: 2,
    amount: 180000,
    method: "Cash",
    reference: "CASH-001",
    billTotal: 180000,
    previousBalance: 180000,
    remainingBalance: 0,
    chequeNo: null,
    chequeDate: null,
    chequeStatus: null,
  },
  {
    id: "PAY-003",
    date: "2025-01-12",
    billId: "INV-003",
    customer: "Fernando Constructions",
    customerId: 3,
    amount: 300000,
    method: "Cheque",
    reference: "CHQ-789456",
    billTotal: 425000,
    previousBalance: 425000,
    remainingBalance: 125000,
    chequeNo: "CHQ789456",
    chequeDate: "2025-01-20",
    chequeStatus: "Passed",
  },
  {
    id: "PAY-004",
    date: "2025-01-10",
    billId: "INV-004",
    customer: "Jayasinghe Hardware Store",
    customerId: 4,
    amount: 165000,
    method: "Bank",
    reference: "TXN789123",
    billTotal: 165000,
    previousBalance: 165000,
    remainingBalance: 0,
    chequeNo: null,
    chequeDate: null,
    chequeStatus: null,
  },
  {
    id: "PAY-005",
    date: "2025-01-08",
    billId: "INV-006",
    customer: "Mendis Electrician Services",
    customerId: 5,
    amount: 150000,
    method: "Cheque",
    reference: "CHQ-456123",
    billTotal: 320000,
    previousBalance: 320000,
    remainingBalance: 170000,
    chequeNo: "CHQ456123",
    chequeDate: "2025-01-05",
    chequeStatus: "Returned",
  },
  {
    id: "PAY-006",
    date: "2025-01-06",
    billId: "INV-007",
    customer: "Perera Hardware",
    customerId: 1,
    amount: 85000,
    method: "Cheque",
    reference: "CHQ-111222",
    billTotal: 85000,
    previousBalance: 85000,
    remainingBalance: 0,
    chequeNo: "CHQ111222",
    chequeDate: "2025-01-25",
    chequeStatus: "Pending",
  },
];

// Mock customers
const mockCustomers = [
  { id: 1, name: "Perera Hardware" },
  { id: 2, name: "Silva Electricals" },
  { id: 3, name: "Fernando Constructions" },
  { id: 4, name: "Jayasinghe Hardware Store" },
  { id: 5, name: "Mendis Electrician Services" },
];

// Mock unpaid bills
const mockUnpaidBills = [
  {
    id: "INV-003",
    customer: "Fernando Constructions",
    balance: 125000,
    total: 425000,
  },
  {
    id: "INV-005",
    customer: "Mendis Electrician Services",
    balance: 320000,
    total: 320000,
  },
  {
    id: "INV-008",
    customer: "Silva Electricals",
    balance: 95000,
    total: 95000,
  },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    billId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    reference: "",
    chequeNo: "",
    chequeDate: "",
  });

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.billId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer =
      customerFilter === "all" ||
      payment.customerId.toString() === customerFilter;

    const matchesMethod =
      methodFilter === "all" ||
      payment.method.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesCustomer && matchesMethod;
  });

  // Calculate stats
  const totalPayments = payments.length;
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingCheques = payments.filter(
    (p) => p.chequeStatus === "Pending"
  ).length;
  const returnedCheques = payments.filter(
    (p) => p.chequeStatus === "Returned"
  ).length;

  const handleAddPayment = () => {
    if (!formData.billId || formData.amount <= 0) {
      alert("Please select a bill and enter valid amount");
      return;
    }

    const selectedBill = mockUnpaidBills.find((b) => b.id === formData.billId);
    if (!selectedBill) return;

    if (formData.amount > selectedBill.balance) {
      alert(
        `Payment amount cannot exceed balance of LKR ${selectedBill.balance.toLocaleString()}`
      );
      return;
    }

    const newPayment: Payment = {
      id: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
      date: formData.date,
      billId: formData.billId,
      customer: selectedBill.customer,
      customerId: 1,
      amount: formData.amount,
      method:
        formData.method.charAt(0).toUpperCase() + formData.method.slice(1),
      reference:
        formData.reference || `${formData.method.toUpperCase()}-${Date.now()}`,
      billTotal: selectedBill.total,
      previousBalance: selectedBill.balance,
      remainingBalance: selectedBill.balance - formData.amount,
      chequeNo: formData.method === "cheque" ? formData.chequeNo : null,
      chequeDate: formData.method === "cheque" ? formData.chequeDate : null,
      chequeStatus: formData.method === "cheque" ? "Pending" : null,
    };

    setPayments([newPayment, ...payments]);
    setIsAddDialogOpen(false);
    resetForm();
    alert("Payment recorded successfully!");
  };

  const resetForm = () => {
    setFormData({
      billId: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      reference: "",
      chequeNo: "",
      chequeDate: "",
    });
  };

  const handleChequeStatusUpdate = (
    paymentId: string,
    newStatus: "Passed" | "Returned"
  ) => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, chequeStatus: newStatus } : p
      )
    );
    alert(`Cheque status updated to ${newStatus}`);
  };

  const getChequeStatusBadge = (
    status: Payment["chequeStatus"],
    chequeDate: string | null
  ) => {
    if (!status) return null;

    const today = new Date();
    const chequeDateObj = chequeDate ? new Date(chequeDate) : null;
    const isPastDue = chequeDateObj && chequeDateObj < today;

    if (status === "Passed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      );
    } else if (status === "Returned") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Returned
        </span>
      );
    } else if (status === "Pending") {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isPastDue
              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {isPastDue ? "Overdue" : "Pending"}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Record and manage customer payments
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payment records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              LKR {totalReceived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Amount collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Cheques
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCheques}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting clearance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Returned Cheques
            </CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {returnedCheques}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bounced payments
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
                  placeholder="Search by ID, bill, or customer..."
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
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
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
                <TableHead>Payment ID</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Cheque Details</TableHead>
                <TableHead className="text-right">Remaining Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.billId}</TableCell>
                    <TableCell>{payment.customer}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      LKR {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {payment.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.method === "Cheque" ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {payment.chequeNo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Due:{" "}
                            {payment.chequeDate &&
                              new Date(payment.chequeDate).toLocaleDateString()}
                          </div>
                          {getChequeStatusBadge(
                            payment.chequeStatus,
                            payment.chequeDate
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          payment.remainingBalance > 0
                            ? "text-destructive font-medium"
                            : "text-green-600"
                        }
                      >
                        LKR {payment.remainingBalance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.method === "Cheque" &&
                        payment.chequeStatus === "Pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600 hover:text-green-700"
                              onClick={() =>
                                handleChequeStatusUpdate(payment.id, "Passed")
                              }
                            >
                              Pass
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive/90"
                              onClick={() =>
                                handleChequeStatusUpdate(payment.id, "Returned")
                              }
                            >
                              Return
                            </Button>
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a new payment from customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="billId">Select Bill *</Label>
              <Select
                value={formData.billId}
                onValueChange={(value) =>
                  setFormData({ ...formData, billId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unpaid bill" />
                </SelectTrigger>
                <SelectContent>
                  {mockUnpaidBills.map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {bill.id} - {bill.customer} (Balance: LKR{" "}
                      {bill.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (LKR) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <Select
                value={formData.method}
                onValueChange={(value) =>
                  setFormData({ ...formData, method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="TXN/REF Number"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
              />
            </div>
            {formData.method === "cheque" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="chequeNo">Cheque Number *</Label>
                  <Input
                    id="chequeNo"
                    placeholder="CHQ123456"
                    value={formData.chequeNo}
                    onChange={(e) =>
                      setFormData({ ...formData, chequeNo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeDate">Cheque Date *</Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={formData.chequeDate}
                    onChange={(e) =>
                      setFormData({ ...formData, chequeDate: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
