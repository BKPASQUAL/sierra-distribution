// src/app/(dashboard)/bank-accounts/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  account_type: "current" | "savings" | "cash";
  branch: string | null;
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );
  const [formData, setFormData] = useState({
    account_name: "",
    account_number: "",
    bank_name: "",
    account_type: "current" as "current" | "savings" | "cash",
    branch: "",
    opening_balance: "",
    currency: "LKR",
    is_primary: false,
    notes: "",
  });

  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    activeAccounts: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bank-accounts");
      if (!response.ok) throw new Error("Failed to fetch bank accounts");

      const data = await response.json();
      setAccounts(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to fetch bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (accountsData: BankAccount[]) => {
    const totalAccounts = accountsData.length;
    const activeAccounts = accountsData.filter((a) => a.is_active).length;
    const totalBalance = accountsData
      .filter((a) => a.is_active)
      .reduce((sum, a) => sum + a.current_balance, 0);

    setStats({
      totalAccounts,
      activeAccounts,
      totalBalance,
    });
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create bank account");
      }

      toast.success("Bank account created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error creating bank account:", error);
      toast.error(error.message || "Failed to create bank account");
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/bank-accounts/${selectedAccount.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to update bank account");

      toast.success("Bank account updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error("Error updating bank account:", error);
      toast.error("Failed to update bank account");
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/bank-accounts/${selectedAccount.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete bank account");
      }

      toast.success("Bank account deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      toast.error(error.message || "Failed to delete bank account");
    }
  };

  const handleSetPrimary = async (account: BankAccount) => {
    try {
      const response = await fetch(`/api/bank-accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_primary: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to set primary account");

      toast.success("Primary account updated successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Error setting primary account:", error);
      toast.error("Failed to set primary account");
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    try {
      const response = await fetch(`/api/bank-accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !account.is_active,
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle account status");

      toast.success(
        `Account ${account.is_active ? "deactivated" : "activated"} successfully`
      );
      fetchAccounts();
    } catch (error) {
      console.error("Error toggling account status:", error);
      toast.error("Failed to toggle account status");
    }
  };

  const openEditDialog = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      account_name: account.account_name,
      account_number: account.account_number,
      bank_name: account.bank_name,
      account_type: account.account_type,
      branch: account.branch || "",
      opening_balance: account.opening_balance.toString(),
      currency: account.currency,
      is_primary: account.is_primary,
      notes: account.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      account_number: "",
      bank_name: "",
      account_type: "current",
      branch: "",
      opening_balance: "",
      currency: "LKR",
      is_primary: false,
      notes: "",
    });
    setSelectedAccount(null);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      accountTypeFilter === "all" || account.account_type === accountTypeFilter;

    return matchesSearch && matchesType;
  });

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "current":
        return "bg-blue-100 text-blue-700";
      case "savings":
        return "bg-green-100 text-green-700";
      case "cash":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Account Name",
      "Account Number",
      "Bank Name",
      "Type",
      "Branch",
      "Current Balance",
      "Currency",
      "Status",
      "Primary",
    ];

    const rows = filteredAccounts.map((account) => [
      account.account_name,
      account.account_number,
      account.bank_name,
      account.account_type,
      account.branch || "",
      account.current_balance.toString(),
      account.currency,
      account.is_active ? "Active" : "Inactive",
      account.is_primary ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bank-accounts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage your personal bank accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Accounts
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAccounts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Accounts
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Ready for transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>
            View and manage all your bank accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bank accounts found. Add your first account to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.account_name}
                      </TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell>{account.account_number}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getAccountTypeColor(account.account_type)}
                        >
                          {account.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.branch || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.current_balance)}{" "}
                        <span className="text-muted-foreground text-xs">
                          {account.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={account.is_active ? "default" : "secondary"}
                        >
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {account.is_primary ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openEditDialog(account)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!account.is_primary && (
                              <DropdownMenuItem
                                onClick={() => handleSetPrimary(account)}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Set as Primary
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(account)}
                            >
                              {account.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(account)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddDialogOpen ? "Add Bank Account" : "Edit Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {isAddDialogOpen
                ? "Add a new bank account to your system"
                : "Update bank account details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_name"
                placeholder="e.g., Main Business Account"
                value={formData.account_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_name"
                placeholder="e.g., Commercial Bank"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_number"
                placeholder="e.g., 1234567890"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: "current" | "savings" | "cash") =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                placeholder="e.g., Colombo"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_balance">Opening Balance</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.opening_balance}
                onChange={(e) =>
                  setFormData({ ...formData, opening_balance: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LKR">LKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-center">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) =>
                  setFormData({ ...formData, is_primary: e.target.checked })
                }
                className="mr-2"
              />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Set as Primary Account
              </Label>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isAddDialogOpen ? handleAddAccount : handleEditAccount}
            >
              {isAddDialogOpen ? "Add Account" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bank account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
