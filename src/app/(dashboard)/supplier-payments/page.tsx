// src/app/(dashboard)/supplier-payments/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Loader2,
  Check,
  ChevronsUpDown,
  Search,
  History,
  Building2,
  TrendingDown,
  Landmark,
  Wallet,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// Interface for Company Accounts (for payment source)
interface CompanyAccount {
  id: string;
  account_name: string;
  account_type: "saving" | "current" | "cash";
  current_balance: number;
  banks?: {
    bank_code: string;
    bank_name: string;
  } | null;
}

// Interface for unpaid purchases
interface UnpaidPurchase {
  id: string; // This is the UUID
  purchase_id: string; // This is the text ID (e.g., PO-001)
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: "unpaid" | "partial";
  suppliers: {
    id: string;
    name: string;
  };
}

// Interface for payment history
interface SupplierPayment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: "pending" | "passed" | "returned" | null;
  notes: string | null;
  company_account_id: string;
  company_accounts: {
    id: string;
    account_name: string;
  } | null;
  purchases: {
    purchase_id: string;
    suppliers: {
      name: string;
    } | null;
  } | null;
}

export default function SupplierPaymentsPage() {
  const [unpaidPurchases, setUnpaidPurchases] = useState<UnpaidPurchase[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<SupplierPayment[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<CompanyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<UnpaidPurchase | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<SupplierPayment | null>(null);
  const [actionType, setActionType] = useState<"passed" | "returned" | null>(
    null
  );
  const [accountSearchOpen, setAccountSearchOpen] = useState(false);

  // New state to hold overdraft details for the dialog
  const [overdraftDetails, setOverdraftDetails] = useState<{
    currentBalance: number;
    newBalance: number;
  } | null>(null);

  // Form state for new payment
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    company_account_id: "",
    payment_method: "cash",
    cheque_number: "",
    cheque_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, paymentsRes, accountsRes] = await Promise.all([
        fetch("/api/purchases/unpaid"),
        fetch("/api/supplier-payments"),
        fetch("/api/accounts"),
      ]);

      const purchasesData = await purchasesRes.json();
      const paymentsData = await paymentsRes.json();
      const accountsData = await accountsRes.json();

      if (purchasesRes.ok) {
        setUnpaidPurchases(purchasesData.purchases);
      } else {
        toast.error("Failed to fetch unpaid purchases.");
      }

      if (paymentsRes.ok) {
        setPaymentHistory(paymentsData.supplier_payments);
      } else {
        toast.error("Failed to fetch payment history.");
      }

      if (accountsRes.ok) {
        setCompanyAccounts(accountsData.accounts);
      } else {
        toast.error("Failed to fetch company accounts.");
      }
    } catch (error) {
      toast.error("Network error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentDialog = (purchase: UnpaidPurchase) => {
    setSelectedPurchase(purchase);
    setPaymentForm({
      amount: (purchase.balance_due || purchase.total_amount).toString(),
      payment_date: new Date().toISOString().split("T")[0],
      company_account_id: "",
      payment_method: "cash",
      cheque_number: "",
      cheque_date: "",
      notes: `Payment for Purchase ${purchase.purchase_id}`,
    });
    setIsPaymentDialogOpen(true);
  };

  // Updated function to check for overdraft before opening dialog
  const openActionDialog = (
    payment: SupplierPayment,
    action: "passed" | "returned"
  ) => {
    setSelectedPayment(payment);
    setActionType(action);
    setOverdraftDetails(null); // Clear previous details

    // Check for overdraft ONLY if action is 'passed'
    if (action === "passed") {
      const account = companyAccounts.find(
        (acc) => acc.id === payment.company_account_id
      );

      // Check if account is found and if payment will cause overdraft
      if (account && account.current_balance < payment.amount) {
        setOverdraftDetails({
          currentBalance: account.current_balance,
          newBalance: account.current_balance - payment.amount,
        });
      }
    }

    setIsActionDialogOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase || !paymentForm.company_account_id) {
      toast.error("Please select a payment account.");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0 || isNaN(amount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (amount > selectedPurchase.balance_due) {
      toast.error(
        `Amount cannot exceed balance due of ${formatCurrency(
          selectedPurchase.balance_due
        )}.`
      );
      return;
    }

    if (
      paymentForm.payment_method === "cheque" &&
      (!paymentForm.cheque_number || !paymentForm.cheque_date)
    ) {
      toast.error("Cheque number and date are required for cheque payments.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/supplier-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          purchase_id: selectedPurchase.id, // Pass the UUID
          amount: amount,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Payment recorded successfully!");
        setIsPaymentDialogOpen(false);
        await fetchData(); // Refresh all data
      } else {
        toast.error(data.error || "Payment failed.");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChequeAction = async () => {
    if (!selectedPayment || !actionType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/supplier-payments/${selectedPayment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: actionType }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(`Cheque marked as ${actionType} successfully!`);
        setIsActionDialogOpen(false);
        setOverdraftDetails(null); // Clear overdraft details
        await fetchData(); // Refresh all data
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Filtered Lists ---
  const filteredPurchases = useMemo(() => {
    return unpaidPurchases.filter(
      (p) =>
        p.purchase_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unpaidPurchases, searchTerm]);

  const pendingCheques = useMemo(() => {
    return paymentHistory.filter(
      (p) =>
        p.payment_method === "cheque" &&
        p.cheque_status === "pending" &&
        (p.purchases?.purchase_id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          p.purchases?.suppliers?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.cheque_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [paymentHistory, searchTerm]);

  const filteredHistory = useMemo(() => {
    return paymentHistory.filter(
      (p) =>
        !(p.payment_method === "cheque" && p.cheque_status === "pending") &&
        (p.purchases?.purchase_id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          p.purchases?.suppliers?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.cheque_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [paymentHistory, searchTerm]);

  // --- Stat Calculations ---
  const totalBalanceDue = useMemo(() => {
    return unpaidPurchases.reduce((sum, p) => sum + p.balance_due, 0);
  }, [unpaidPurchases]);

  const totalPendingChequeAmount = useMemo(() => {
    return pendingCheques.reduce((sum, p) => sum + p.amount, 0);
  }, [pendingCheques]);

  // --- Overdraft Warning Logic ---
  const selectedAccount = companyAccounts.find(
    (a) => a.id === paymentForm.company_account_id
  );
  const paymentAmount = parseFloat(paymentForm.amount) || 0;
  const isOverdraft =
    selectedAccount &&
    selectedAccount.current_balance < paymentAmount &&
    paymentForm.payment_method !== "cheque"; // Only warn for immediate payments
  const newBalance =
    selectedAccount && isOverdraft
      ? selectedAccount.current_balance - paymentAmount
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier Payments
          </h1>
          <p className="text-muted-foreground">
            Manage payments for supplier purchases (bills)
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
            <DollarSign className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalBalanceDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredPurchases.length} unpaid purchases
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Cheques
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPendingChequeAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCheques.length} cheques waiting to be processed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Purchase ID, Supplier, or Cheque No..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full md:w-[400px]"
        />
      </div>

      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid">
            Unpaid Purchases ({filteredPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="pending_cheques">
            Pending Cheques ({pendingCheques.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Payment History ({filteredHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Unpaid Purchases Tab */}
        <TabsContent value="unpaid" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unpaid Supplier Purchases</CardTitle>
              <CardDescription>
                Purchases with an outstanding balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No unpaid purchases found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {new Date(p.purchase_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.purchase_id}
                        </TableCell>
                        <TableCell>{p.suppliers.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.total_amount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(p.amount_paid)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {formatCurrency(p.balance_due)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(p)}
                          >
                            Record Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Cheques Tab */}
        <TabsContent value="pending_cheques" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Cheques</CardTitle>
              <CardDescription>
                Cheques issued to suppliers but not yet cleared.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque Date</TableHead>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Paid From</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : pendingCheques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No pending cheques found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingCheques.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {new Date(p.cheque_date!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{p.purchases?.purchase_id}</TableCell>
                        <TableCell>{p.purchases?.suppliers?.name}</TableCell>
                        <TableCell className="font-medium">
                          {p.cheque_number}
                        </TableCell>
                        <TableCell>
                          {p.company_accounts?.account_name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => openActionDialog(p, "passed")}
                          >
                            Pass
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openActionDialog(p, "returned")}
                          >
                            Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Payment History</CardTitle>
              <CardDescription>
                Record of all cleared payments made to suppliers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Account Paid From</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Cheque/Ref</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {new Date(p.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{p.purchases?.purchase_id}</TableCell>
                        <TableCell>{p.purchases?.suppliers?.name}</TableCell>
                        <TableCell>
                          {p.company_accounts?.account_name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {p.payment_method}
                        </TableCell>
                        <TableCell>{p.cheque_number || "N/A"}</TableCell>
                        <TableCell>
                          {p.payment_method === "cheque" ? (
                            <span
                              className={cn(
                                "font-medium",
                                p.cheque_status === "passed"
                                  ? "text-green-600"
                                  : "text-destructive"
                              )}
                            >
                              {p.cheque_status}
                            </span>
                          ) : (
                            <span className="text-green-600">Cleared</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
            <DialogDescription>
              Paying for Purchase{" "}
              <strong>{selectedPurchase?.purchase_id}</strong> from{" "}
              <strong>{selectedPurchase?.suppliers.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label>Balance Due</Label>
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(selectedPurchase?.balance_due || 0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_amount">Payment Amount *</Label>
                  <Input
                    id="pay_amount"
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_date">Payment Date *</Label>
                  <Input
                    id="pay_date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pay From Account *</Label>
                <Popover
                  open={accountSearchOpen}
                  onOpenChange={setAccountSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-10"
                    >
                      <span className="truncate">
                        {paymentForm.company_account_id
                          ? (() => {
                              const acc = companyAccounts.find(
                                (a) => a.id === paymentForm.company_account_id
                              );
                              return acc
                                ? `${acc.account_name} (${formatCurrency(
                                    acc.current_balance
                                  )})`
                                : "Select account...";
                            })()
                          : "Select account..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search account..." />
                      <CommandList>
                        <CommandEmpty>No account found.</CommandEmpty>
                        <CommandGroup>
                          {companyAccounts.map((account) => (
                            <CommandItem
                              key={account.id}
                              value={account.account_name}
                              onSelect={() => {
                                setPaymentForm({
                                  ...paymentForm,
                                  company_account_id: account.id,
                                });
                                setAccountSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  paymentForm.company_account_id === account.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex items-center justify-between w-full">
                                <span>{account.account_name}</span>
                                <span
                                  className={cn(
                                    "text-sm",
                                    account.current_balance < 0
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                  )}
                                >
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

              <div className="space-y-2">
                <Label htmlFor="pay_method">Payment Method *</Label>
                <Select
                  value={paymentForm.payment_method}
                  onValueChange={(value: string) =>
                    setPaymentForm({ ...paymentForm, payment_method: value })
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- OVERDRAFT WARNING --- */}
              {isOverdraft && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Overdraft Warning</AlertTitle>
                  <AlertDescription>
                    This payment will overdraft this account.
                    <br />
                    Current Balance:{" "}
                    <strong>
                      {formatCurrency(selectedAccount.current_balance)}
                    </strong>
                    <br />
                    New Balance: <strong>{formatCurrency(newBalance)}</strong>
                    <br />
                    To add funds, please make a **Deposit** on the **Accounts**
                    page.
                  </AlertDescription>
                </Alert>
              )}

              {paymentForm.payment_method === "cheque" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cheque_number">Cheque Number *</Label>
                    <Input
                      id="cheque_number"
                      value={paymentForm.cheque_number}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          cheque_number: e.target.value,
                        })
                      }
                      placeholder="Enter cheque number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cheque_date">Cheque Date *</Label>
                    <Input
                      id="cheque_date"
                      type="date"
                      value={paymentForm.cheque_date}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          cheque_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cheque Action Dialog */}
      <AlertDialog
        open={isActionDialogOpen}
        onOpenChange={(open) => {
          setIsActionDialogOpen(open);
          if (!open) {
            setOverdraftDetails(null);
            setSelectedPayment(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {/* DYNAMIC TITLE */}
              {actionType === "passed" && overdraftDetails
                ? "Overdraft Warning!"
                : `Confirm Cheque ${
                    actionType
                      ? actionType.charAt(0).toUpperCase() + actionType.slice(1)
                      : ""
                  }`}
            </AlertDialogTitle>

            {/* --- START OF CHANGE --- */}
            {/* This is the fix. We add 'asChild' to the description and wrap the
              contents in a 'div' to prevent p-in-p or div-in-p HTML errors.
            */}
            <AlertDialogDescription asChild>
              <div>
                {/* DYNAMIC DESCRIPTION */}
                {actionType === "returned" && (
                  <>
                    Are you sure you want to mark cheque{" "}
                    <strong>{selectedPayment?.cheque_number}</strong> as{" "}
                    <strong>returned</strong>?
                    <span className="block mt-2">
                      This will add{" "}
                      <strong>
                        {formatCurrency(selectedPayment?.amount || 0)}
                      </strong>{" "}
                      back to the purchase balance and will NOT affect your
                      account balance.
                    </span>
                  </>
                )}
                {actionType === "passed" && overdraftDetails && (
                  <>
                    You do not have enough funds in{" "}
                    <strong>
                      {selectedPayment?.company_accounts?.account_name}
                    </strong>{" "}
                    to pass this cheque.
                    <div className="my-2 p-3 border rounded-md bg-muted text-muted-foreground">
                      Current Balance:{" "}
                      <strong>
                        {formatCurrency(overdraftDetails.currentBalance)}
                      </strong>
                      <br />
                      Cheque Amount:{" "}
                      <strong>
                        - {formatCurrency(selectedPayment?.amount || 0)}
                      </strong>
                      <hr className="my-1" />
                      New Balance:{" "}
                      <strong className="text-destructive">
                        {formatCurrency(overdraftDetails.newBalance)}
                      </strong>
                    </div>
                    Do you want to proceed and mark this as an overdraft (OD)?
                  </>
                )}
                {actionType === "passed" && !overdraftDetails && (
                  <>
                    Are you sure you want to mark cheque{" "}
                    <strong>{selectedPayment?.cheque_number}</strong> as{" "}
                    <strong>passed</strong>?
                    <span className="block mt-2">
                      This will deduct{" "}
                      <strong>
                        {formatCurrency(selectedPayment?.amount || 0)}
                      </strong>{" "}
                      from account{" "}
                      <strong>
                        {selectedPayment?.company_accounts?.account_name}
                      </strong>
                      .
                    </span>
                  </>
                )}
              </div>
            </AlertDialogDescription>
            {/* --- END OF CHANGE --- */}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChequeAction}
              disabled={isSubmitting}
              className={cn(
                actionType === "returned" &&
                  "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirm {actionType}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
