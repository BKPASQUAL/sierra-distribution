// src/app/(dashboard)/payments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Payment type definition
interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  order_id: string | null;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: "pending" | "passed" | "returned" | null;
  customers: {
    name: string;
  };
  orders: {
    order_number: string;
    total_amount: number;
  } | null;
}

interface UnpaidOrder {
  id: string;
  order_number: string;
  total_amount: number;
  balance: number;
  customer_id: string;
  customers: { name: string };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [chequeStatusFilter, setChequeStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [chequeActionDialog, setChequeActionDialog] = useState<{
    open: boolean;
    payment: Payment | null;
    action: "passed" | "returned" | null;
  }>({ open: false, payment: null, action: null });

  const [formData, setFormData] = useState({
    orderId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    reference: "",
    chequeNo: "",
    chequeDate: "",
    notes: "",
  });

  // Fetch payments from API
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      const data = await response.json();

      if (data.payments) {
        setPayments(data.payments);
      } else {
        console.error("Failed to fetch payments:", data.error);
      }
    } catch (error) {
      console.error("Network error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (data.customers) {
          setCustomers(data.customers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch unpaid orders when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      fetchUnpaidOrders();
    }
  }, [isAddDialogOpen]);

  const fetchUnpaidOrders = async () => {
    try {
      // Fetch orders with unpaid or partial payment status
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (!ordersData.orders) {
        console.error("Failed to fetch orders");
        return;
      }

      // Filter orders that are not fully paid
      const unpaidOrdersList = ordersData.orders.filter(
        (order: any) =>
          order.payment_status === "unpaid" ||
          order.payment_status === "partial"
      );

      // Fetch all payments to calculate remaining balance for each order
      const paymentsResponse = await fetch("/api/payments");
      const paymentsData = await paymentsResponse.json();

      if (!paymentsData.payments) {
        console.error("Failed to fetch payments");
        return;
      }

      // Calculate balance for each unpaid order
      const ordersWithBalance: UnpaidOrder[] = unpaidOrdersList.map(
        (order: any) => {
          // Sum all successful payments for this order (exclude returned cheques)
          const orderPayments = paymentsData.payments.filter(
            (p: Payment) =>
              p.order_id === order.id && p.cheque_status !== "returned"
          );

          const totalPaid = orderPayments.reduce(
            (sum: number, p: Payment) => sum + p.amount,
            0
          );
          const balance = order.total_amount - totalPaid;

          return {
            id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            balance: balance,
            customer_id: order.customer_id,
            customers: order.customers,
          };
        }
      );

      // Only show orders with balance > 0
      const ordersWithPendingBalance = ordersWithBalance.filter(
        (order) => order.balance > 0
      );

      setUnpaidOrders(ordersWithPendingBalance);
    } catch (error) {
      console.error("Error fetching unpaid orders:", error);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (payment.orders?.order_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.customers.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer =
      customerFilter === "all" || payment.customer_id === customerFilter;

    const matchesMethod =
      methodFilter === "all" ||
      payment.payment_method.toLowerCase() === methodFilter.toLowerCase();

    const matchesChequeStatus =
      chequeStatusFilter === "all" ||
      (chequeStatusFilter === "cheque" &&
        payment.payment_method.toLowerCase() === "cheque") ||
      payment.cheque_status === chequeStatusFilter;

    return (
      matchesSearch && matchesCustomer && matchesMethod && matchesChequeStatus
    );
  });

  // Calculate stats
  const totalPayments = payments.length;
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingCheques = payments.filter(
    (p) => p.cheque_status === "pending"
  ).length;
  const returnedCheques = payments.filter(
    (p) => p.cheque_status === "returned"
  ).length;

  const handleAddPayment = async () => {
    if (!formData.orderId || formData.amount <= 0) {
      alert("Please select an order and enter valid amount");
      return;
    }

    // Validate payment amount doesn't exceed balance
    const selectedOrder = unpaidOrders.find((o) => o.id === formData.orderId);
    if (selectedOrder && formData.amount > selectedOrder.balance) {
      alert(
        `Payment amount (LKR ${formData.amount.toLocaleString()}) cannot exceed remaining balance (LKR ${selectedOrder.balance.toLocaleString()})`
      );
      return;
    }

    if (
      formData.method === "cheque" &&
      (!formData.chequeNo || !formData.chequeDate)
    ) {
      alert("Please provide cheque number and date for cheque payments");
      return;
    }

    try {
      const payment_number = `PAY-${Date.now()}`;

      const paymentData = {
        payment_number,
        order_id: formData.orderId,
        customer_id: selectedOrder?.customer_id,
        payment_date: formData.date,
        amount: formData.amount,
        payment_method: formData.method,
        reference_number: formData.reference || null,
        notes: formData.notes || null,
        cheque_number: formData.method === "cheque" ? formData.chequeNo : null,
        cheque_date: formData.method === "cheque" ? formData.chequeDate : null,
        cheque_status: formData.method === "cheque" ? "pending" : null,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add payment");
      }

      alert("Payment recorded successfully!");
      fetchPayments(); // Refresh payments list
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert(`Error adding payment: ${(error as Error).message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      reference: "",
      chequeNo: "",
      chequeDate: "",
      notes: "",
    });
  };

  const openChequeActionDialog = (
    payment: Payment,
    action: "passed" | "returned"
  ) => {
    setChequeActionDialog({ open: true, payment, action });
  };

  const handleChequeStatusUpdate = async () => {
    if (!chequeActionDialog.payment || !chequeActionDialog.action) return;

    try {
      const response = await fetch(
        `/api/payments/${chequeActionDialog.payment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cheque_status: chequeActionDialog.action,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update cheque status");
      }

      alert(`Cheque marked as ${chequeActionDialog.action}!`);
      fetchPayments(); // Refresh payments list
      setChequeActionDialog({ open: false, payment: null, action: null });
    } catch (error) {
      console.error("Error updating cheque status:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const getChequeStatusBadge = (
    status: Payment["cheque_status"],
    chequeDate: string | null
  ) => {
    if (!status) return null;

    const today = new Date();
    const chequeDateObj = chequeDate ? new Date(chequeDate) : null;
    const isPastDue = chequeDateObj && chequeDateObj < today;

    if (status === "passed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      );
    } else if (status === "returned") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Returned
        </span>
      );
    } else if (status === "pending") {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
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
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={chequeStatusFilter}
                onValueChange={setChequeStatusFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Cheque status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cheques</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.payment_number}
                    </TableCell>
                    <TableCell>{payment.orders?.order_number || "-"}</TableCell>
                    <TableCell>{payment.customers.name}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      LKR {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {payment.payment_method.charAt(0).toUpperCase() +
                          payment.payment_method.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.payment_method.toLowerCase() === "cheque" ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium">
                            {payment.cheque_number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Due:{" "}
                            {payment.cheque_date &&
                              new Date(
                                payment.cheque_date
                              ).toLocaleDateString()}
                          </div>
                          {getChequeStatusBadge(
                            payment.cheque_status,
                            payment.cheque_date
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.payment_method.toLowerCase() === "cheque" &&
                        payment.cheque_status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() =>
                                openChequeActionDialog(payment, "passed")
                              }
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pass
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive/90 hover:bg-red-50"
                              onClick={() =>
                                openChequeActionDialog(payment, "returned")
                              }
                            >
                              <XCircle className="w-3 h-3 mr-1" />
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
              Record a new payment from customer (Only showing bills with
              pending balance)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="orderId">Select Unpaid Bill *</Label>
              <Select
                value={formData.orderId}
                onValueChange={(value) =>
                  setFormData({ ...formData, orderId: value })
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue
                    placeholder={
                      unpaidOrders.length > 0
                        ? "Select unpaid bill"
                        : "No unpaid bills available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {unpaidOrders.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No bills with pending balance
                    </SelectItem>
                  ) : (
                    unpaidOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.customers?.name} (Balance:
                        LKR {order.balance.toLocaleString()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formData.orderId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Remaining Balance: LKR{" "}
                  {unpaidOrders
                    .find((o) => o.id === formData.orderId)
                    ?.balance.toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (LKR) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={
                  formData.orderId
                    ? unpaidOrders.find((o) => o.id === formData.orderId)
                        ?.balance
                    : undefined
                }
                placeholder="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full h-10"
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
                className="w-full h-10"
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
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="TXN/REF Number"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                className="w-full h-10"
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
                    className="w-full h-10"
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
                    className="w-full h-10"
                  />
                </div>
              </>
            )}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
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
            <Button
              onClick={handleAddPayment}
              disabled={unpaidOrders.length === 0}
            >
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cheque Action Confirmation Dialog */}
      <AlertDialog
        open={chequeActionDialog.open}
        onOpenChange={(open) =>
          !open &&
          setChequeActionDialog({ open: false, payment: null, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {chequeActionDialog.action === "passed"
                ? "Pass Cheque?"
                : "Return Cheque?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chequeActionDialog.action === "passed" ? (
                <>
                  Are you sure you want to mark this cheque as{" "}
                  <strong>Passed</strong>?
                  <br />
                  <br />
                  <div className="bg-muted p-3 rounded-md mt-2 space-y-1">
                    <div className="text-sm">
                      <strong>Cheque No:</strong>{" "}
                      {chequeActionDialog.payment?.cheque_number}
                    </div>
                    <div className="text-sm">
                      <strong>Amount:</strong> LKR{" "}
                      {chequeActionDialog.payment?.amount.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <strong>Cheque Date:</strong>{" "}
                      {chequeActionDialog.payment?.cheque_date &&
                        new Date(
                          chequeActionDialog.payment.cheque_date
                        ).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      <strong>Customer:</strong>{" "}
                      {chequeActionDialog.payment?.customers.name}
                    </div>
                  </div>
                  <br />
                  This action confirms the cheque has cleared successfully.
                </>
              ) : (
                <>
                  Are you sure you want to mark this cheque as{" "}
                  <strong>Returned</strong>?
                  <br />
                  <br />
                  <div className="bg-muted p-3 rounded-md mt-2 space-y-1">
                    <div className="text-sm">
                      <strong>Cheque No:</strong>{" "}
                      {chequeActionDialog.payment?.cheque_number}
                    </div>
                    <div className="text-sm">
                      <strong>Amount:</strong> LKR{" "}
                      {chequeActionDialog.payment?.amount.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <strong>Cheque Date:</strong>{" "}
                      {chequeActionDialog.payment?.cheque_date &&
                        new Date(
                          chequeActionDialog.payment.cheque_date
                        ).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      <strong>Customer:</strong>{" "}
                      {chequeActionDialog.payment?.customers.name}
                    </div>
                  </div>
                  <br />
                  This action indicates the cheque has bounced or been returned
                  by the bank.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChequeStatusUpdate}
              className={
                chequeActionDialog.action === "passed"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {chequeActionDialog.action === "passed"
                ? "Confirm Pass"
                : "Confirm Return"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
