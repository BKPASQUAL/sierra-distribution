// src/app/(dashboard)/accounts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Landmark,
  Wallet,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Check,
  ChevronsUpDown,
  // --- START OF CHANGE ---
  ArrowRightLeft, // Icon for Transfer
  Download, // Icon for Deposit
  // --- END OF CHANGE ---
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
// --- START OF CHANGE ---
import { Textarea } from "@/components/ui/textarea";
// --- END OF CHANGE ---

// Interface for the banks dropdown (from banks table)
interface Bank {
  id: string;
  bank_code: string;
  bank_name: string;
}

// Updated Account interface to match API response
interface Account {
  id: string;
  account_name: string;
  account_number: string | null;
  account_type: "saving" | "current" | "cash";
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  bank_id: string | null;
  banks: {
    // This comes from the JOIN
    bank_name: string;
    bank_code: string;
  } | null;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // --- START OF CHANGE ---
  // Renamed dialog state for clarity
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state for Add/Edit Account
  const [accountFormData, setAccountFormData] = useState({
    account_name: "",
    account_number: "",
    account_type: "saving" as "saving" | "current" | "cash",
    initial_balance: 0,
    bank_id: "",
  });

  // Form state for Deposit
  const [depositForm, setDepositForm] = useState({
    toAccountId: "",
    amount: "",
    notes: "",
  });

  // Form state for Transfer
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    notes: "",
  });
  // --- END OF CHANGE ---

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsResponse, banksResponse] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/banks"),
      ]);

      const accountsData = await accountsResponse.json();
      const banksData = await banksResponse.json();

      if (accountsResponse.ok) {
        setAccounts(accountsData.accounts);
      } else {
        toast.error("Failed to fetch accounts: " + accountsData.error);
      }

      if (banksResponse.ok) {
        setBanks(banksData.banks);
      } else {
        toast.error("Failed to fetch banks list: " + banksData.error);
      }
    } catch (error) {
      toast.error("Network error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const resetAccountForm = () => {
    setAccountFormData({
      account_name: "",
      account_number: "",
      account_type: "saving",
      initial_balance: 0,
      bank_id: "",
    });
    setSelectedAccount(null);
  };

  const handleOpenAccountDialog = (account?: Account) => {
    if (account) {
      setSelectedAccount(account);
      setAccountFormData({
        account_name: account.account_name,
        account_number: account.account_number || "",
        account_type: account.account_type,
        initial_balance: account.initial_balance,
        bank_id: account.bank_id || "",
      });
    } else {
      resetAccountForm();
    }
    setIsAccountDialogOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = { ...accountFormData };

    if (payload.account_type === "cash") {
      payload.account_number = null;
      payload.bank_id = null;
      if (payload.account_name.trim() === "") {
        payload.account_name = "Cash on Hand";
      }
    } else {
      if (!payload.bank_id) {
        toast.error("Please select a bank for bank accounts.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const url = selectedAccount
        ? `/api/accounts/${selectedAccount.id}`
        : "/api/accounts";
      const method = selectedAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          `Account ${selectedAccount ? "updated" : "created"} successfully!`
        );
        setIsAccountDialogOpen(false);
        resetAccountForm();
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save account");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Account deleted successfully!");
        setIsDeleteDialogOpen(false);
        resetAccountForm();
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- START OF CHANGE ---
  // Handlers for new dialogs
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/accounts/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deposit",
          toAccountId: depositForm.toAccountId,
          amount: depositForm.amount,
          notes: depositForm.notes,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Deposit successful!");
        setIsDepositDialogOpen(false);
        setDepositForm({ toAccountId: "", amount: "", notes: "" });
        await fetchData();
      } else {
        toast.error(data.error || "Deposit failed.");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/accounts/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          fromAccountId: transferForm.fromAccountId,
          toAccountId: transferForm.toAccountId,
          amount: transferForm.amount,
          notes: transferForm.notes,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Transfer successful!");
        setIsTransferDialogOpen(false);
        setTransferForm({
          fromAccountId: "",
          toAccountId: "",
          amount: "",
          notes: "",
        });
        await fetchData();
      } else {
        toast.error(data.error || "Transfer failed.");
      }
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- END OF CHANGE ---

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + acc.current_balance,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your company's bank and cash accounts
          </p>
        </div>
        {/* --- START OF CHANGE --- */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDepositDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsTransferDialogOpen(true)}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
          <Button onClick={() => handleOpenAccountDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
        {/* --- END OF CHANGE --- */}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {accounts.length} accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No accounts found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {account.account_type === "cash" ? (
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Landmark className="w-4 h-4 text-muted-foreground" />
                        )}
                        {account.account_name}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {account.account_type.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {account.banks?.bank_name || "N/A"}
                      {account.banks?.bank_code && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({account.banks.bank_code})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{account.account_number || "N/A"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.current_balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenAccountDialog(account)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAccount(account);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Edit Account" : "Add New Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type *</Label>
                <Select
                  value={accountFormData.account_type}
                  onValueChange={(value: "saving" | "current" | "cash") =>
                    setAccountFormData({
                      ...accountFormData,
                      account_type: value,
                    })
                  }
                  disabled={!!selectedAccount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saving">Saving Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                    <SelectItem value="cash">Cash on Hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={accountFormData.account_name}
                  onChange={(e) =>
                    setAccountFormData({
                      ...accountFormData,
                      account_name: e.target.value,
                    })
                  }
                  placeholder={
                    accountFormData.account_type === "cash"
                      ? "e.g., Cash on Hand"
                      : "e.g., HNB Main Account"
                  }
                  required
                />
              </div>

              {accountFormData.account_type !== "cash" && (
                <>
                  <div className="space-y-2">
                    <Label>Bank *</Label>
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
                            {accountFormData.bank_id
                              ? banks.find(
                                  (bank) => bank.id === accountFormData.bank_id
                                )?.bank_code +
                                " - " +
                                banks.find(
                                  (bank) => bank.id === accountFormData.bank_id
                                )?.bank_name
                              : "Select bank..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search bank..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No bank found.</CommandEmpty>
                            <CommandGroup>
                              {banks.map((bank) => (
                                <CommandItem
                                  key={bank.id}
                                  value={`${bank.bank_code} ${bank.bank_name}`}
                                  onSelect={() => {
                                    setAccountFormData({
                                      ...accountFormData,
                                      bank_id: bank.id,
                                    });
                                    setBankSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      accountFormData.bank_id === bank.id
                                        ? "opacity-100"
                                        : "opacity-0"
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
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={accountFormData.account_number}
                      onChange={(e) =>
                        setAccountFormData({
                          ...accountFormData,
                          account_number: e.target.value,
                        })
                      }
                      placeholder="e.g., 00123456789"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="initial_balance">Initial Balance (LKR) *</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={accountFormData.initial_balance}
                  onChange={(e) =>
                    setAccountFormData({
                      ...accountFormData,
                      initial_balance: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!!selectedAccount}
                  required
                />
                {selectedAccount && (
                  <p className="text-xs text-muted-foreground">
                    Initial balance cannot be edited.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAccountDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {selectedAccount ? "Update Account" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedAccount?.account_name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- START OF CHANGE --- */}
      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to Account</DialogTitle>
            <DialogDescription>
              Record an external deposit into one of your accounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeposit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deposit_toAccountId">To Account *</Label>
                <Select
                  value={depositForm.toAccountId}
                  onValueChange={(value) =>
                    setDepositForm({ ...depositForm, toAccountId: value })
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select account to deposit into..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} (
                        {formatCurrency(account.current_balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Amount (LKR) *</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  value={depositForm.amount}
                  onChange={(e) =>
                    setDepositForm({ ...depositForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_notes">Notes (Optional)</Label>
                <Textarea
                  id="deposit_notes"
                  value={depositForm.notes}
                  onChange={(e) =>
                    setDepositForm({ ...depositForm, notes: e.target.value })
                  }
                  placeholder="e.g., Owner's equity deposit, Bank interest..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Deposit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Between Accounts</DialogTitle>
            <DialogDescription>
              Move funds from one of your accounts to another.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transfer_fromAccountId">From Account *</Label>
                <Select
                  value={transferForm.fromAccountId}
                  onValueChange={(value) =>
                    setTransferForm({ ...transferForm, fromAccountId: value })
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select source account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} (
                        {formatCurrency(account.current_balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer_toAccountId">To Account *</Label>
                <Select
                  value={transferForm.toAccountId}
                  onValueChange={(value) =>
                    setTransferForm({ ...transferForm, toAccountId: value })
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select destination account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} (
                        {formatCurrency(account.current_balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer_amount">Amount (LKR) *</Label>
                <Input
                  id="transfer_amount"
                  type="number"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer_notes">Notes (Optional)</Label>
                <Textarea
                  id="transfer_notes"
                  value={transferForm.notes}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, notes: e.target.value })
                  }
                  placeholder="e.g., Transfer cash to bank..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransferDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* --- END OF CHANGE --- */}
    </div>
  );
}
