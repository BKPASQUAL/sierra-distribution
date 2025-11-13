// src/app/(dashboard)/finance/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  Building,
  DollarSign,
  Edit,
  Eye,
  Landmark,
  Loader2,
  Package,
  Plus,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Types
interface Bank {
  id: string;
  bank_name: string;
  bank_code: string;
}

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_id: string;
  account_type: "current" | "savings" | "cash" | "loan" | "od";
  current_balance: number;
  notes: string | null;
  banks: {
    bank_name: string;
    bank_code: string;
  };
}

interface Payable {
  id: string;
  purchase_id: string;
  purchase_date: string;
  total_amount: number;
  balance_due: number;
  payment_status: "unpaid" | "partial";
  suppliers: {
    name: string;
  };
  supplier_id: string;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);

  const [loading, setLoading] = useState(true);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  const [accountFormData, setAccountFormData] = useState({
    account_name: "",
    account_number: "",
    bank_id: "",
    account_type: "cash" as BankAccount["account_type"],
    current_balance: 0,
    notes: "",
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer" as "cash" | "bank_transfer" | "cheque",
    bank_account_id: "",
    reference_number: "",
    notes: "",
  });

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [banksRes, accountsRes, payablesRes] = await Promise.all([
        fetch("/api/banks"),
        fetch("/api/bank-accounts"),
        fetch("/api/reports/accounts-payable"),
      ]);

      const banksData = await banksRes.json();
      const accountsData = await accountsRes.json();
      const payablesData = await payablesRes.json();

      if (banksData.banks) setBanks(banksData.banks);
      if (accountsData.accounts) setAccounts(accountsData.accounts);
      if (payablesData.purchases) setPayables(payablesData.purchases);
    } catch (error) {
      toast.error("Failed to load financial data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const totalAssets = accounts
    .filter(
      (acc) =>
        acc.account_type === "cash" ||
        acc.account_type === "current" ||
        acc.account_type === "savings"
    )
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalLiabilities = accounts
    .filter((acc) => acc.account_type === "loan" || acc.account_type === "od")
    .reduce((sum, acc) => sum + acc.current_balance, 0); // Balances for loans/OD should be negative

  const totalPayables = payables.reduce((sum, p) => sum + p.balance_due, 0);

  // --- Handlers ---

  const resetAccountForm = () => {
    setSelectedAccount(null);
    setAccountFormData({
      account_name: "",
      account_number: "",
      bank_id: "",
      account_type: "cash",
      current_balance: 0,
      notes: "",
    });
  };

  const openAccountDialog = (account: BankAccount | null) => {
    if (account) {
      setSelectedAccount(account);
      setAccountFormData({
        account_name: account.account_name,
        account_number: account.account_number,
        bank_id: account.bank_id,
        account_type: account.account_type,
        current_balance: account.current_balance,
        notes: account.notes || "",
      });
    } else {
      resetAccountForm();
    }
    setIsAccountDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountFormData.account_name || !accountFormData.account_type) {
      return toast.error("Account Name and Type are required.");
    }
    if (accountFormData.account_type !== "cash" && !accountFormData.bank_id) {
      return toast.error("A bank is required for non-cash accounts.");
    }

    try {
      const url = selectedAccount
        ? `/api/bank-accounts/${selectedAccount.id}`
        : "/api/bank-accounts";
      const method = selectedAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save account.");
      }

      toast.success(selectedAccount ? "Account updated!" : "Account created!");
      setIsAccountDialogOpen(false);
      resetAccountForm();
      fetchData(); // Refetch all data
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openPaymentDialog = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaymentFormData({
      amount: payable.balance_due,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      bank_account_id: "",
      reference_number: "",
      notes: `Payment for Purchase Order ${payable.purchase_id}`,
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    if (
      !selectedPayable ||
      !paymentFormData.bank_account_id ||
      paymentFormData.amount <= 0
    ) {
      return toast.error(
        "Please select a bank account and enter a valid amount."
      );
    }

    try {
      const payload = {
        ...paymentFormData,
        supplier_id: selectedPayable.supplier_id,
        purchase_id: selectedPayable.id,
      };

      const response = await fetch("/api/supplier-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save payment.");
      }

      toast.success("Supplier payment recorded successfully!");
      setIsPaymentDialogOpen(false);
      fetchData(); // Refetch all data
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Get only accounts that can be used for payment
  const paymentAccounts = accounts.filter(
    (acc) => acc.account_type === "cash" || acc.account_type === "current"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
      <p className="text-muted-foreground">
        Manage your bank accounts, loans, and supplier payments (Accounts
        Payable).
      </p>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cash (Assets)
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash, Savings, & Current Accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Loans (Liabilities)
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalLiabilities)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Loans & Overdrafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Accounts Payable
            </CardTitle>
            <Receipt className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPayables)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Money owed to suppliers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">Bank & Cash Accounts</TabsTrigger>
          <TabsTrigger value="payables">
            Accounts Payable (Supplier Dues)
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bank & Cash Accounts</CardTitle>
                  <CardDescription>
                    Manually manage balances for your assets and liabilities.
                  </CardDescription>
                </div>
                <Button onClick={() => openAccountDialog(null)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Bank / Type</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">
                        Current Balance
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((acc) => {
                      const isLiability =
                        acc.account_type === "loan" ||
                        acc.account_type === "od";
                      return (
                        <TableRow key={acc.id}>
                          <TableCell className="font-medium">
                            {acc.account_name}
                          </TableCell>
                          <TableCell>
                            {acc.account_type === "cash"
                              ? "Cash in Hand"
                              : acc.banks.bank_name}
                          </TableCell>
                          <TableCell>{acc.account_number}</TableCell>
                          <TableCell className="capitalize">
                            {acc.account_type}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              isLiability
                                ? "text-destructive"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(acc.current_balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openAccountDialog(acc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Payable Tab */}
        <TabsContent value="payables" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Payable</CardTitle>
              <CardDescription>
                All unpaid and partially-paid purchase orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payables.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No outstanding supplier payments.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payables.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.purchase_id}
                          </TableCell>
                          <TableCell>
                            {new Date(p.purchase_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{p.suppliers.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.payment_status === "unpaid"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {p.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(p.total_amount)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-destructive">
                            {formatCurrency(p.balance_due)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(p)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" /> Record
                              Payment
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Edit Account" : "Add New Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedAccount
                ? "Update the details for this account. You can manually adjust the balance."
                : "Add a new cash, bank, or loan account to track."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="acc-type">Account Type</Label>
              <Select
                value={accountFormData.account_type}
                onValueChange={(val: BankAccount["account_type"]) =>
                  setAccountFormData({
                    ...accountFormData,
                    account_type: val,
                    bank_id:
                      val === "cash"
                        ? banks.find((b) => b.bank_code === "CASH")?.id || ""
                        : "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash in Hand</SelectItem>
                  <SelectItem value="current">Bank - Current</SelectItem>
                  <SelectItem value="savings">Bank - Savings</SelectItem>
                  <SelectItem value="loan">Bank - Loan</SelectItem>
                  <SelectItem value="od">Bank - Overdraft (OD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {accountFormData.account_type !== "cash" && (
              <div className="space-y-2">
                <Label htmlFor="acc-bank">Bank</Label>
                <Select
                  value={accountFormData.bank_id}
                  onValueChange={(val) =>
                    setAccountFormData({ ...accountFormData, bank_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name} ({bank.bank_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="acc-name">Account Name</Label>
              <Input
                id="acc-name"
                value={accountFormData.account_name}
                onChange={(e) =>
                  setAccountFormData({
                    ...accountFormData,
                    account_name: e.target.value,
                  })
                }
                placeholder="e.g., Daily Operations"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-number">Account Number</Label>
              <Input
                id="acc-number"
                value={accountFormData.account_number}
                onChange={(e) =>
                  setAccountFormData({
                    ...accountFormData,
                    account_number: e.target.value,
                  })
                }
                placeholder={
                  accountFormData.account_type === "cash"
                    ? "CASH-001"
                    : "123456789"
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Current Balance (LKR)</Label>
              <Input
                id="acc-balance"
                type="number"
                value={accountFormData.current_balance}
                onChange={(e) =>
                  setAccountFormData({
                    ...accountFormData,
                    current_balance: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                For Loans or Overdrafts, enter this as a negative number (e.g.,
                -50000).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAccount}>Save Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Supplier Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
            <DialogDescription>
              Pay supplier: <strong>{selectedPayable?.suppliers.name}</strong>
              <br />
              For Purchase Order:{" "}
              <strong>{selectedPayable?.purchase_id}</strong>
              <br />
              Amount Due:{" "}
              <strong>
                {formatCurrency(selectedPayable?.balance_due || 0)}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Payment Amount (LKR)</Label>
              <Input
                id="pay-amount"
                type="number"
                value={paymentFormData.amount}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Payment Date</Label>
              <Input
                id="pay-date"
                type="date"
                value={paymentFormData.payment_date}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    payment_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-method">Payment Method</Label>
              <Select
                value={paymentFormData.payment_method}
                onValueChange={(val: any) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    payment_method: val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-account">Pay From Account</Label>
              <Select
                value={paymentFormData.bank_account_id}
                onValueChange={(val) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    bank_account_id: val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account to pay from..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_type}) -{" "}
                      {formatCurrency(acc.current_balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-ref">Reference</Label>
              <Input
                id="pay-ref"
                value={paymentFormData.reference_number}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    reference_number: e.target.value,
                  })
                }
                placeholder="e.g., Bank transaction ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
