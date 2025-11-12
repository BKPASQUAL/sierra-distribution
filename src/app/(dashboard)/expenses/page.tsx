// src/app/(dashboard)/expenses/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Receipt,
  Fuel,
  Wrench,
  Truck,
  User,
  Building,
  Briefcase,
  Phone,
  Shield,
  FileText,
  Banknote,
  Percent,
  TrendingDown,
  Users,
  Loader2,
  Package,
  TrendingUp,
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
import { ExpenseCategory, ExpenseStatus } from "@/types/database.types"; // Import full types

// NEW: Full list of categories from your schema
const expenseCategories: {
  value: ExpenseCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "fuel", label: "Fuel", icon: <Fuel className="h-4 w-4" /> },
  { value: "salaries", label: "Salaries", icon: <Users className="h-4 w-4" /> },
  { value: "rent", label: "Rent", icon: <Building className="h-4 w-4" /> },
  {
    value: "utilities",
    label: "Utilities",
    icon: <Receipt className="h-4 w-4" />,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: <Wrench className="h-4 w-4" />,
  },
  { value: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  {
    value: "marketing",
    label: "Marketing",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    value: "office_supplies",
    label: "Office Supplies",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    value: "telephone",
    label: "Telephone",
    icon: <Phone className="h-4 w-4" />,
  },
  {
    value: "insurance",
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />,
  },
  { value: "repairs", label: "Repairs", icon: <Wrench className="h-4 w-4" /> },
  {
    value: "professional_fees",
    label: "Professional Fees",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: "bank_charges",
    label: "Bank Charges",
    icon: <Banknote className="h-4 w-4" />,
  },
  {
    value: "depreciation",
    label: "Depreciation",
    icon: <TrendingDown className="h-4 w-4" />,
  },
  { value: "taxes", label: "Taxes", icon: <Percent className="h-4 w-4" /> },
  {
    value: "miscellaneous",
    label: "Miscellaneous",
    icon: <Package className="h-4 w-4" />,
  },
];

// UPDATED: Expense interface to match your full schema
interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  receipt_number: string | null;
  status: ExpenseStatus;
  users?: {
    name: string;
    email: string;
  };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // UPDATED: formData state to include all new fields
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    category: "fuel" as ExpenseCategory,
    description: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    vendor_name: "",
    receipt_number: "", // New
    status: "approved" as ExpenseStatus, // New
    notes: "",
  });

  const [stats, setStats] = useState({
    totalExpenses: 0,
    fuelExpenses: 0,
    maintenanceExpenses: 0,
    deliveryExpenses: 0,
    otherExpenses: 0,
  });

  const supabase = createClient();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = "/api/expenses";
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setExpenses(data.expenses);
        calculateStats(data.expenses);
      } else {
        console.error("Failed to fetch expenses:", data.error);
      }
    } catch (error) {
      console.error("Network error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const calculateStats = (expensesData: Expense[]) => {
    const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const fuel = expensesData
      .filter((exp) => exp.category === "fuel")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const maintenance = expensesData
      .filter((exp) => exp.category === "maintenance")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const delivery = expensesData
      .filter((exp) => exp.category === "delivery")
      .reduce((sum, exp) => sum + exp.amount, 0);

    setStats({
      totalExpenses: total,
      fuelExpenses: fuel,
      maintenanceExpenses: maintenance,
      deliveryExpenses: delivery,
      otherExpenses: total - fuel - maintenance - delivery,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAddDialogOpen(false);
        resetForm();
        fetchExpenses();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Network error while creating expense");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedExpense(null);
        resetForm();
        fetchExpenses();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Network error while updating expense");
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedExpense(null);
        fetchExpenses();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Network error while deleting expense");
    }
  };

  // UPDATED: Reset form to include new fields
  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split("T")[0],
      category: "fuel",
      description: "",
      amount: "",
      payment_method: "cash",
      reference_number: "",
      vendor_name: "",
      receipt_number: "",
      status: "approved",
      notes: "",
    });
  };

  // UPDATED: Open edit dialog to include new fields
  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      expense_date: expense.expense_date,
      category: expense.category,
      description: expense.description || "",
      amount: expense.amount.toString(),
      payment_method: expense.payment_method,
      reference_number: expense.reference_number || "",
      vendor_name: expense.vendor_name || "",
      receipt_number: expense.receipt_number || "",
      status: expense.status || "approved",
      notes: expense.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.expense_number.toLowerCase().includes(searchLower) ||
      (expense.description || "").toLowerCase().includes(searchLower) ||
      (expense.vendor_name || "").toLowerCase().includes(searchLower)
    );
  });

  const getCategoryBadge = (category: string) => {
    const categoryInfo = expenseCategories.find((c) => c.value === category);
    return (
      <Badge variant="outline" className="capitalize items-center gap-1">
        {categoryInfo?.icon}
        {categoryInfo?.label || category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage all business operating expenses
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.fuelExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.maintenanceExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.deliveryExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.otherExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>
            View and manage all expense transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, description, vendor..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* UPDATED: Full category list */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* UPDATED: Table with new columns */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.expense_number}
                      </TableCell>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(expense.category)}
                      </TableCell>
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell>{expense.vendor_name || "-"}</TableCell>
                      <TableCell>{expense.receipt_number || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === "approved"
                              ? "default"
                              : expense.status === "pending"
                              ? "outline"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.users?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(expense)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpense(expense);
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
          </div>
        </CardContent>
      </Card>

      {/* UPDATED: Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Date</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Lorry fuel top-up"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (LKR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Name</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_name: e.target.value })
                    }
                    placeholder="e.g., Ceypetco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt_number">Receipt Number</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        receipt_number: e.target.value,
                      })
                    }
                    placeholder="Receipt or Invoice #"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* UPDATED: Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_expense_date">Date</Label>
                  <Input
                    id="edit_expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Input
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_amount">Amount (LKR)</Label>
                  <Input
                    id="edit_amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_vendor_name">Vendor Name</Label>
                  <Input
                    id="edit_vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_receipt_number">Receipt Number</Label>
                  <Input
                    id="edit_receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        receipt_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ExpenseStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
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
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedExpense(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedExpense(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
