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
  Banknote,
  Pencil,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

// Bank type definition
interface Bank {
  id: string;
  bank_code: string;
  bank_name: string;
}

// Company Account type definition
interface CompanyAccount {
  id: string;
  account_name: string;
  account_type: "saving" | "current" | "cash";
  account_number: string | null;
  current_balance: number;
  banks?: {
    bank_code: string;
    bank_name: string;
  } | null;
}

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
  cheque_status: "pending" | "deposited" | "passed" | "returned" | null;
  bank_account_id: string | null;
  deposit_account_id: string | null;
  customers?: {
    name: string;
  };
  orders?: {
    order_number: string;
    total_amount: number;
  } | null;
  banks?: {
    id: string;
    bank_code: string;
    bank_name: string;
  };
  company_accounts?: {
    account_name: string;
    account_type: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<CompanyAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [chequeStatusFilter, setChequeStatusFilter] = useState("all");

  // Popover States
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [accountSearchOpen, setAccountSearchOpen] = useState(false);
  const [orderSearchOpen, setOrderSearchOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [formData, setFormData] = useState({
    id: "", // For edit mode
    orderId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    bankId: "",
    depositAccountId: "",
    chequeNo: "",
    chequeDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchUnpaidOrders();
    fetchBanks();
    fetchCompanyAccounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, methodFilter, chequeStatusFilter]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      const data = await response.json();
      if (response.ok) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidOrders = async () => {
    try {
      const response = await fetch("/api/orders/unpaid");
      const data = await response.json();
      if (response.ok) {
        setUnpaidOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching unpaid orders:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      const data = await response.json();
      if (response.ok) {
        setBanks(data.banks);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchCompanyAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      if (response.ok) {
        setCompanyAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Error fetching company accounts:", error);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customers?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.orders?.order_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCustomer =
      customerFilter === "all" || payment.customers?.name === customerFilter;
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

  const totalPayments = payments.length;
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingCheques = payments.filter(
    (p) => p.cheque_status === "pending" || p.cheque_status === "deposited",
  ).length;
  const returnedCheques = payments.filter(
    (p) => p.cheque_status === "returned",
  ).length;

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const getAvailableAccounts = () => {
    if (formData.method === "cash") {
      return companyAccounts.filter((acc) => acc.account_type === "cash");
    } else if (formData.method === "bank" || formData.method === "cheque") {
      return companyAccounts.filter(
        (acc) =>
          acc.account_type === "saving" || acc.account_type === "current",
      );
    }
    return [];
  };

  // --- ADD PAYMENT HANDLER ---
  const handleAddPayment = async () => {
    if (!formData.orderId || formData.amount <= 0) {
      toast.error("Please select an order and enter valid amount");
      return;
    }

    const selectedOrder = unpaidOrders.find((o) => o.id === formData.orderId);
    if (selectedOrder && formData.amount > selectedOrder.balance) {
      toast.error(
        `Payment amount (${formatCurrency(
          formData.amount,
        )}) cannot exceed remaining balance (${formatCurrency(
          selectedOrder.balance,
        )})`,
      );
      return;
    }

    if (
      (formData.method === "bank" || formData.method === "cash") &&
      !formData.depositAccountId
    ) {
      const accountType =
        formData.method === "cash" ? "cash account" : "bank account";
      toast.error(`Please select a ${accountType} for deposit`);
      return;
    }

    if (
      formData.method === "cheque" &&
      (!formData.chequeNo || !formData.chequeDate || !formData.bankId)
    ) {
      toast.error(
        "Please provide cheque number, date, and bank for cheque payments",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payment_number = `PAY-${Date.now()}`;
      const paymentData = {
        payment_number,
        order_id: formData.orderId,
        customer_id: selectedOrder?.customer_id,
        payment_date: formData.date,
        amount: formData.amount,
        payment_method: formData.method,
        deposit_account_id:
          formData.method === "cheque" ? null : formData.depositAccountId,
        reference_number: null,
        notes: formData.notes || null,
        cheque_number: formData.method === "cheque" ? formData.chequeNo : null,
        cheque_date: formData.method === "cheque" ? formData.chequeDate : null,
        cheque_status: formData.method === "cheque" ? "pending" : null,
        bank_account_id: formData.method === "cheque" ? formData.bankId : null,
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

      toast.success("Payment recorded successfully!");
      await refreshData();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(`Error adding payment: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- OPEN EDIT DIALOG ---
  const handleOpenEdit = (payment: Payment) => {
    setFormData({
      id: payment.id,
      orderId: payment.order_id || "",
      amount: payment.amount,
      date: payment.payment_date.split("T")[0],
      method: payment.payment_method,
      bankId: payment.bank_account_id || "",
      depositAccountId: payment.deposit_account_id || "",
      chequeNo: payment.cheque_number || "",
      chequeDate: payment.cheque_date ? payment.cheque_date.split("T")[0] : "",
      notes: payment.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // --- SUBMIT EDIT HANDLER ---
  const handleEditSubmit = async () => {
    if (formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (
      formData.method === "cheque" &&
      (!formData.chequeNo || !formData.chequeDate || !formData.bankId)
    ) {
      toast.error("Please provide all cheque details");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        order_id: formData.orderId,
        amount: formData.amount,
        payment_date: formData.date,
        payment_method: formData.method,
        notes: formData.notes,
        cheque_number: formData.method === "cheque" ? formData.chequeNo : null,
        cheque_date: formData.method === "cheque" ? formData.chequeDate : null,
        bank_account_id: formData.method === "cheque" ? formData.bankId : null,
        deposit_account_id:
          formData.method !== "cheque" ? formData.depositAccountId : undefined,
      };

      const response = await fetch(`/api/payments/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update payment");
      }

      toast.success("Payment updated successfully!");
      await refreshData();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error(`Error updating payment: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshData = async () => {
    await fetchPayments();
    await fetchUnpaidOrders();
    await fetchCompanyAccounts();
  };

  const resetForm = () => {
    setFormData({
      id: "",
      orderId: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      bankId: "",
      depositAccountId: "",
      chequeNo: "",
      chequeDate: "",
      notes: "",
    });
  };

  const getChequeStatusBadge = (
    status: Payment["cheque_status"],
    chequeDate: string | null,
  ) => {
    if (!status) return null;

    const today = new Date();
    const chequeDateObj = chequeDate ? new Date(chequeDate) : null;
    const isOverdue =
      chequeDateObj && status === "pending" && chequeDateObj < today;

    const statusConfig = {
      pending: {
        color: isOverdue ? "text-orange-600" : "text-yellow-600",
        bg: isOverdue ? "bg-orange-50" : "bg-yellow-50",
        icon: Clock,
        label: isOverdue ? "Overdue" : "Pending",
      },
      deposited: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: Banknote,
        label: "Deposited",
      },
      passed: {
        color: "text-green-600",
        bg: "bg-green-50",
        icon: CheckCircle,
        label: "Passed",
      },
      returned: {
        color: "text-red-600",
        bg: "bg-red-50",
        icon: XCircle,
        label: "Returned",
      },
    };

    const config = statusConfig[status];

    if (!config) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
    }

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Manage customer payments and cheques
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalReceived)}
            </div>
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
            <div className="text-2xl font-bold">{pendingCheques}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Returned Cheques
            </CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedCheques}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[300px]"
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
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
                  <SelectItem value="deposited">Deposited</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedPayments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No payments found
              </div>
            ) : (
              paginatedPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 space-y-3 bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm">{payment.payment_number}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-sm">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-2">
                    <div className="text-muted-foreground">Customer</div>
                    <div className="text-right font-medium">{payment.customers?.name || "N/A"}</div>
                    
                    <div className="text-muted-foreground">Method</div>
                    <div className="text-right capitalize">{payment.payment_method}</div>
                    
                    <div className="text-muted-foreground">Bill No</div>
                    <div className="text-right font-mono text-xs">{payment.orders?.order_number || "N/A"}</div>
                  </div>

                  {(payment.payment_method === "cheque" || payment.payment_method === "bank") && (
                    <div className="bg-muted/50 rounded p-2 text-xs space-y-1 mt-2">
                       {payment.payment_method === "cheque" && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cheque No:</span>
                              <span className="font-mono">{payment.cheque_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span>{getChequeStatusBadge(payment.cheque_status, payment.cheque_date)}</span>
                            </div>
                          </>
                       )}
                       {payment.banks && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span>{payment.banks.bank_code}</span>
                          </div>
                       )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(payment)}
                      className="h-8"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Deposit Account</TableHead>
                <TableHead>Cheque/Bank Details</TableHead>
                <TableHead className="text-right">Cheque Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.payment_number}
                    </TableCell>
                    <TableCell>
                      {payment.orders?.order_number || "N/A"}
                    </TableCell>
                    <TableCell>{payment.customers?.name || "N/A"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method}
                    </TableCell>
                    <TableCell>
                      {payment.company_accounts ? (
                        <div>
                          <div className="font-medium">
                            {payment.company_accounts.account_name}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {payment.company_accounts.account_type}
                          </div>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.payment_method === "cheque" && (
                        <div className="space-y-1">
                          <div className="text-sm">
                            Cheque: {payment.cheque_number}
                          </div>
                          {payment.banks && (
                            <div className="text-xs text-muted-foreground">
                              {payment.banks.bank_code} -{" "}
                              {payment.banks.bank_name}
                            </div>
                          )}
                          {payment.cheque_date && (
                            <div className="text-xs text-muted-foreground">
                              Date:{" "}
                              {new Date(
                                payment.cheque_date,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                      {payment.payment_method === "bank" && payment.banks && (
                        <div className="text-sm">
                          {payment.banks.bank_code} - {payment.banks.bank_name}
                        </div>
                      )}
                      {payment.payment_method === "cash" && (
                        <span className="text-sm text-muted-foreground">
                          Cash Payment
                        </span>
                      )}
                      {payment.payment_method === "credit" && (
                        <span className="text-sm text-muted-foreground">
                          On Credit
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.payment_method === "cheque" &&
                        getChequeStatusBadge(
                          payment.cheque_status,
                          payment.cheque_date,
                        )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(payment)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(startIndex + 1, totalItems)} to{" "}
            {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* --- ADD PAYMENT DIALOG --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a new payment from customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="order">Select Order *</Label>
              <Popover open={orderSearchOpen} onOpenChange={setOrderSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={orderSearchOpen}
                    className="w-full justify-between h-10"
                  >
                    <span className="truncate">
                      {formData.orderId
                        ? (() => {
                            const order = unpaidOrders.find(
                              (o) => o.id === formData.orderId,
                            );
                            return order
                              ? `${order.order_number} - ${
                                  order.customer_name
                                } (${formatCurrency(order.balance)})`
                              : "Select an order...";
                          })()
                        : "Select an order..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search by order, customer, or balance..." />
                    <CommandList>
                      <CommandEmpty>No unpaid orders found.</CommandEmpty>
                      <CommandGroup>
                        {unpaidOrders.map((order) => (
                          <CommandItem
                            key={order.id}
                            value={`${order.order_number} ${order.customer_name} ${order.balance}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                orderId: order.id,
                                amount: order.balance, // Automatically set amount
                              });
                              setOrderSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.orderId === order.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex justify-between w-full">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {order.order_number} - {order.customer_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Order Date:{" "}
                                  {new Date(
                                    order.order_date,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(order.balance)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (LKR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
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
                  setFormData({
                    ...formData,
                    method: value,
                    depositAccountId: "", // Reset account when method changes
                    bankId: "",
                    chequeNo: "",
                    chequeDate: "",
                  })
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deposit Account Selection - Show for Cash and Bank Transfer ONLY */}
            {(formData.method === "cash" || formData.method === "bank") && (
              <div className="space-y-2">
                <Label>
                  {formData.method === "cash"
                    ? "Cash Account *"
                    : "Deposit to Bank Account *"}
                </Label>
                <Popover
                  open={accountSearchOpen}
                  onOpenChange={setAccountSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountSearchOpen}
                      className="w-full justify-between h-10"
                    >
                      <span className="truncate">
                        {formData.depositAccountId
                          ? (() => {
                              const account = companyAccounts.find(
                                (a) => a.id === formData.depositAccountId,
                              );
                              return account ? (
                                <span>
                                  {account.account_name}
                                  {account.banks && (
                                    <span className="text-muted-foreground ml-2">
                                      ({account.banks.bank_code})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "Select account..."
                              );
                            })()
                          : "Select account..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandList>
                        <CommandEmpty>No account found.</CommandEmpty>
                        <CommandGroup>
                          {getAvailableAccounts().map((account) => (
                            <CommandItem
                              key={account.id}
                              value={`${account.account_name} ${
                                account.banks?.bank_name || ""
                              }`}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  depositAccountId: account.id,
                                });
                                setAccountSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.depositAccountId === account.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {account.account_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {account.banks
                                    ? `${account.banks.bank_code} - ${account.banks.bank_name}`
                                    : "Cash on Hand"}{" "}
                                  | Balance:{" "}
                                  {formatCurrency(account.current_balance)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Cheque specific fields */}
            {formData.method === "cheque" && (
              <>
                <div className="space-y-2">
                  <Label>Cheque Bank *</Label>
                  <Popover
                    open={bankSearchOpen}
                    onOpenChange={setBankSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={bankSearchOpen}
                        className="w-full justify-between h-10"
                      >
                        <span className="truncate">
                          {formData.bankId
                            ? (() => {
                                const bank = banks.find(
                                  (b) => b.id === formData.bankId,
                                );
                                return bank
                                  ? `${bank.bank_code} - ${bank.bank_name}`
                                  : "Select bank...";
                              })()
                            : "Select bank..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {banks.map((bank) => (
                              <CommandItem
                                key={bank.id}
                                value={`${bank.bank_code} ${bank.bank_name}`}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    bankId: bank.id,
                                  });
                                  setBankSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.bankId === bank.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {bank.bank_code} - {bank.bank_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeNo">Cheque Number *</Label>
                  <Input
                    id="chequeNo"
                    placeholder="Enter cheque number"
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
              disabled={unpaidOrders.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT PAYMENT DIALOG --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Modify payment details. (Note: Changing amount or order affects
              balances)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-order">Select Order</Label>
              <Popover open={orderSearchOpen} onOpenChange={setOrderSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={orderSearchOpen}
                    className="w-full justify-between h-10"
                  >
                    <span className="truncate">
                      {formData.orderId
                        ? (() => {
                            const order = unpaidOrders.find(
                              (o) => o.id === formData.orderId,
                            );
                            if (order)
                              return `${order.order_number} - ${order.customer_name}`;
                            // Fallback if not in unpaid list (e.g. it's the currently assigned order)
                            const currentPayment = payments.find(
                              (p) => p.id === formData.id,
                            );
                            if (currentPayment?.order_id === formData.orderId)
                              return `${currentPayment.orders?.order_number} (Current)`;
                            return "Unknown Order";
                          })()
                        : "Select an order..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search orders..." />
                    <CommandList>
                      <CommandEmpty>No unpaid orders found.</CommandEmpty>
                      <CommandGroup>
                        {unpaidOrders.map((order) => (
                          <CommandItem
                            key={order.id}
                            value={`${order.order_number} ${order.customer_name}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                orderId: order.id,
                              });
                              setOrderSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.orderId === order.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {order.order_number} - {order.customer_name} (
                            {formatCurrency(order.balance)})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (LKR) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
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
              <Label htmlFor="edit-date">Payment Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-method">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) =>
                  setFormData({ ...formData, method: value })
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.method === "cash" || formData.method === "bank") && (
              <div className="space-y-2">
                <Label>
                  {formData.method === "cash"
                    ? "Cash Account *"
                    : "Deposit to Bank Account *"}
                </Label>
                <Popover
                  open={accountSearchOpen}
                  onOpenChange={setAccountSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountSearchOpen}
                      className="w-full justify-between h-10"
                    >
                      <span className="truncate">
                        {formData.depositAccountId
                          ? (() => {
                              const account = companyAccounts.find(
                                (a) => a.id === formData.depositAccountId,
                              );
                              return account ? (
                                <span>
                                  {account.account_name}
                                  {account.banks && (
                                    <span className="text-muted-foreground ml-2">
                                      ({account.banks.bank_code})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "Select account..."
                              );
                            })()
                          : "Select account..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandList>
                        <CommandEmpty>No account found.</CommandEmpty>
                        <CommandGroup>
                          {getAvailableAccounts().map((account) => (
                            <CommandItem
                              key={account.id}
                              value={`${account.account_name} ${
                                account.banks?.bank_name || ""
                              }`}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  depositAccountId: account.id,
                                });
                                setAccountSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.depositAccountId === account.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {account.account_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {account.banks
                                    ? `${account.banks.bank_code} - ${account.banks.bank_name}`
                                    : "Cash on Hand"}{" "}
                                  | Balance:{" "}
                                  {formatCurrency(account.current_balance)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {formData.method === "cheque" && (
              <>
                <div className="space-y-2">
                  <Label>Cheque Bank</Label>
                  <Popover
                    open={bankSearchOpen}
                    onOpenChange={setBankSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={bankSearchOpen}
                        className="w-full justify-between h-10"
                      >
                        <span className="truncate">
                          {formData.bankId
                            ? (() => {
                                const bank = banks.find(
                                  (b) => b.id === formData.bankId,
                                );
                                return bank
                                  ? `${bank.bank_code} - ${bank.bank_name}`
                                  : "Select bank...";
                              })()
                            : "Select bank..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {banks.map((bank) => (
                              <CommandItem
                                key={bank.id}
                                value={`${bank.bank_code} ${bank.bank_name}`}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    bankId: bank.id,
                                  });
                                  setBankSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.bankId === bank.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {bank.bank_code} - {bank.bank_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-chequeNo">Cheque No</Label>
                  <Input
                    id="edit-chequeNo"
                    value={formData.chequeNo}
                    onChange={(e) =>
                      setFormData({ ...formData, chequeNo: e.target.value })
                    }
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-chequeDate">Cheque Date</Label>
                  <Input
                    id="edit-chequeDate"
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
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
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
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
