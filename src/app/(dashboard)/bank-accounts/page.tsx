// src/app/(dashboard)/bank-accounts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
  CheckCircle,
  XCircle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Bank Account type definition
interface BankAccount {
  id: string;
  bank_code: string;
  bank_name: string;
  is_active: boolean;
  created_at?: string;
}

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState<
    BankAccount[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedBankAccount, setSelectedBankAccount] =
    useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_code: "",
    bank_name: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bank-accounts");
      const data = await response.json();

      if (response.ok) {
        setBankAccounts(data.banks || []);
        setFilteredBankAccounts(data.banks || []);
      } else {
        toast.error(data.error || "Failed to fetch bank accounts");
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to fetch bank accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = bankAccounts.filter(
      (bank) =>
        bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.bank_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBankAccounts(filtered);
  }, [searchQuery, bankAccounts]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      bank_code: "",
      bank_name: "",
      is_active: true,
    });
    setSelectedBankAccount(null);
  };

  // Open add dialog
  const handleAddClick = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const handleEditClick = (bank: BankAccount) => {
    setSelectedBankAccount(bank);
    setFormData({
      bank_code: bank.bank_code,
      bank_name: bank.bank_name,
      is_active: bank.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (bank: BankAccount) => {
    setSelectedBankAccount(bank);
    setIsDeleteDialogOpen(true);
  };

  // Handle add bank account
  const handleAddBankAccount = async () => {
    if (!formData.bank_code || !formData.bank_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Bank account added successfully");
        setIsAddDialogOpen(false);
        resetForm();
        fetchBankAccounts();
      } else {
        toast.error(data.error || "Failed to add bank account");
      }
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Failed to add bank account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update bank account
  const handleUpdateBankAccount = async () => {
    if (!selectedBankAccount) return;

    if (!formData.bank_code || !formData.bank_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bank-accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedBankAccount.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Bank account updated successfully");
        setIsEditDialogOpen(false);
        resetForm();
        fetchBankAccounts();
      } else {
        toast.error(data.error || "Failed to update bank account");
      }
    } catch (error) {
      console.error("Error updating bank account:", error);
      toast.error("Failed to update bank account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete bank account
  const handleDeleteBankAccount = async () => {
    if (!selectedBankAccount) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bank-accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedBankAccount.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Bank account deleted successfully");
        setIsDeleteDialogOpen(false);
        resetForm();
        fetchBankAccounts();
      } else {
        toast.error(data.error || "Failed to delete bank account");
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast.error("Failed to delete bank account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle bank account status
  const handleToggleStatus = async (bank: BankAccount) => {
    try {
      const response = await fetch("/api/bank-accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: bank.id,
          is_active: !bank.is_active,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Bank account ${!bank.is_active ? "activated" : "deactivated"}`
        );
        fetchBankAccounts();
      } else {
        toast.error(data.error || "Failed to update bank account status");
      }
    } catch (error) {
      console.error("Error updating bank account status:", error);
      toast.error("Failed to update bank account status");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
          <p className="text-muted-foreground">
            Manage your bank accounts and information
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bank Accounts
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankAccounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Accounts
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bankAccounts.filter((b) => b.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Accounts
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bankAccounts.filter((b) => !b.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bank Accounts List</CardTitle>
              <CardDescription>
                View and manage all your bank accounts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bank accounts..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBankAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No bank accounts found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first bank account"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Code</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBankAccounts.map((bank) => (
                    <TableRow key={bank.id}>
                      <TableCell className="font-medium">
                        {bank.bank_code}
                      </TableCell>
                      <TableCell>{bank.bank_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={bank.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(bank)}
                        >
                          {bank.is_active ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(bank)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(bank)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a new bank account to your system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bank_code">
                Bank Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_code"
                name="bank_code"
                placeholder="e.g., 7010"
                value={formData.bank_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_name"
                name="bank_name"
                placeholder="e.g., Commercial Bank"
                value={formData.bank_name}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Bank Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update bank account information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_bank_code">
                Bank Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_bank_code"
                name="bank_code"
                placeholder="e.g., 7010"
                value={formData.bank_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_bank_name">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_bank_name"
                name="bank_name"
                placeholder="e.g., Commercial Bank"
                value={formData.bank_name}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBankAccount} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Bank Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bank account "
              {selectedBankAccount?.bank_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBankAccount}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
