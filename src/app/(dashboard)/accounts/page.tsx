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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    account_type: "saving" as "saving" | "current" | "cash",
    initial_balance: 0,
    bank_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both accounts and banks in parallel
      const [accountsResponse, banksResponse] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/banks"), // Fetches the list of banks for the dropdown
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

  const resetForm = () => {
    setFormData({
      account_name: "",
      account_number: "",
      account_type: "saving",
      initial_balance: 0,
      bank_id: "",
    });
    setSelectedAccount(null);
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        account_name: account.account_name,
        account_number: account.account_number || "",
        account_type: account.account_type,
        initial_balance: account.initial_balance, // Show initial balance
        bank_id: account.bank_id || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = { ...formData };

    if (payload.account_type === "cash") {
      payload.account_number = null;
      payload.bank_id = null;
      if (payload.account_name.trim() === "") {
        payload.account_name = "Cash on Hand";
      }
    } else {
      // It's 'saving' or 'current', so bank_id is required
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

      // ✅ --- FIX IS HERE ---
      // First, check if the response was successful
      if (response.ok) {
        toast.success(
          `Account ${selectedAccount ? "updated" : "created"} successfully!`
        );
        setIsDialogOpen(false);
        resetForm();
        // Now, we refresh the table
        await fetchData();
      } else {
        // If it failed, *now* we try to parse the error message
        const data = await response.json();
        toast.error(data.error || "Failed to save account");
      }
      // ✅ --- END OF FIX ---
    } catch (error) {
      // This will catch actual network errors (e.g., internet down)
      // or if response.json() fails on an error response
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

      // ✅ --- FIX IS HERE ---
      // First, check if the response was successful
      if (response.ok) {
        toast.success("Account deleted successfully!");
        setIsDeleteDialogOpen(false);
        resetForm();
        // Now, we refresh the table
        await fetchData();
      } else {
        // If it failed, *now* we try to parse the error message
        const data = await response.json();
        toast.error(data.error || "Failed to delete account");
      }
      // ✅ --- END OF FIX ---
    } catch (error) {
      toast.error(`Network error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + acc.current_balance,
    0
  );

  // ... (rest of the component is unchanged) ...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your company's bank and cash accounts
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
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
                            onClick={() => handleOpenDialog(account)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Edit Account" : "Add New Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type *</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value: "saving" | "current" | "cash") =>
                    setFormData({ ...formData, account_type: value })
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
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                  placeholder={
                    formData.account_type === "cash"
                      ? "e.g., Cash on Hand"
                      : "e.g., HNB Main Account"
                  }
                  required
                />
              </div>

              {formData.account_type !== "cash" && (
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
                            {formData.bank_id
                              ? banks.find(
                                  (bank) => bank.id === formData.bank_id
                                )?.bank_code +
                                " - " +
                                banks.find(
                                  (bank) => bank.id === formData.bank_id
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
                                    setFormData({
                                      ...formData,
                                      bank_id: bank.id,
                                    });
                                    setBankSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.bank_id === bank.id
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
                      value={formData.account_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                  value={formData.initial_balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                onClick={() => setIsDialogOpen(false)}
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
    </div>
  );
}
