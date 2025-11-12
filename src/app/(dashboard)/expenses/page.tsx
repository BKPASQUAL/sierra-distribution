// src/app/(dashboard)/expenses/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Loader2,
  Receipt,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// Types
type ExpenseCategory =
  | "fuel"
  | "salaries"
  | "rent"
  | "utilities"
  | "maintenance"
  | "delivery"
  | "marketing"
  | "office_supplies"
  | "telephone"
  | "insurance"
  | "repairs"
  | "professional_fees"
  | "bank_charges"
  | "depreciation"
  | "taxes"
  | "miscellaneous";

type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  vendor_name: string | null;
  notes: string | null;
  receipt_number: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  status: string;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  fuel: "Fuel & Gas",
  salaries: "Salaries & Wages",
  rent: "Rent",
  utilities: "Utilities",
  maintenance: "Maintenance",
  delivery: "Delivery",
  marketing: "Marketing",
  office_supplies: "Office Supplies",
  telephone: "Telephone",
  insurance: "Insurance",
  repairs: "Repairs",
  professional_fees: "Professional Fees",
  bank_charges: "Bank Charges",
  depreciation: "Depreciation",
  taxes: "Taxes",
  miscellaneous: "Miscellaneous",
};

const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  card: "Credit/Debit Card",
};

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    category: "fuel" as ExpenseCategory,
    description: "",
    amount: "",
    payment_method: "cash" as PaymentMethod,
    reference_number: "",
    vendor_name: "",
    notes: "",
    receipt_number: "",
    is_recurring: false,
    recurring_frequency: "",
  });

  // Load expenses
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let url = "/api/expenses";
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (dateFilter.start) {
        params.append("start_date", dateFilter.start);
      }
      if (dateFilter.end) {
        params.append("end_date", dateFilter.end);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setExpenses(data.expenses || []);
      } else {
        toast.error("Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Error loading expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          recurring_frequency: formData.is_recurring
            ? formData.recurring_frequency
            : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Expense added successfully!");
        setIsDialogOpen(false);
        resetForm();
        fetchExpenses(); // Refresh list
      } else {
        toast.error(data.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Error adding expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Expense deleted successfully!");
        fetchExpenses();
      } else {
        toast.error("Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Error deleting expense");
    }
  };

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split("T")[0],
      category: "fuel",
      description: "",
      amount: "",
      payment_method: "cash",
      reference_number: "",
      vendor_name: "",
      notes: "",
      receipt_number: "",
      is_recurring: false,
      recurring_frequency: "",
    });
  };

  // Filter expenses by search
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.expense_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount.toString()),
    0
  );

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      fuel: "bg-blue-100 text-blue-800",
      salaries: "bg-red-100 text-red-800",
      rent: "bg-orange-100 text-orange-800",
      utilities: "bg-green-100 text-green-800",
      maintenance: "bg-purple-100 text-purple-800",
      delivery: "bg-indigo-100 text-indigo-800",
      marketing: "bg-pink-100 text-pink-800",
      office_supplies: "bg-teal-100 text-teal-800",
      telephone: "bg-yellow-100 text-yellow-800",
      insurance: "bg-cyan-100 text-cyan-800",
      repairs: "bg-lime-100 text-lime-800",
      professional_fees: "bg-violet-100 text-violet-800",
      bank_charges: "bg-rose-100 text-rose-800",
      depreciation: "bg-slate-100 text-slate-800",
      taxes: "bg-red-200 text-red-900",
      miscellaneous: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Expense Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all business expenses
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR{" "}
              {expenses
                .filter(
                  (e) =>
                    new Date(e.expense_date).getMonth() ===
                    new Date().getMonth()
                )
                .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR{" "}
              {expenses.length > 0
                ? Math.round(
                    expenses.reduce(
                      (sum, e) => sum + parseFloat(e.amount.toString()),
                      0
                    ) / expenses.length
                  ).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(expenses.map((e) => e.category)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  fetchExpenses();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, start: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, end: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={fetchExpenses} variant="default">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button
              onClick={() => {
                setCategoryFilter("all");
                setDateFilter({ start: "", end: "" });
                setSearchQuery("");
                fetchExpenses();
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>All recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expense #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No expenses found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.expense_number}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {EXPENSE_CATEGORIES[expense.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell>{expense.vendor_name || "-"}</TableCell>
                      <TableCell>
                        {PAYMENT_METHODS[expense.payment_method]}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        LKR{" "}
                        {parseFloat(expense.amount.toString()).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {filteredExpenses.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={6}>Total</TableCell>
                    <TableCell className="text-right">
                      LKR {totalExpenses.toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">
                    Date <span className="text-destructive">*</span>
                  </Label>
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
                  <Label htmlFor="amount">
                    Amount (LKR) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORIES).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: PaymentMethod) =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the expense"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Name</Label>
                  <Input
                    id="vendor_name"
                    placeholder="Vendor or supplier name"
                    value={formData.vendor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_number">Receipt/Invoice #</Label>
                  <Input
                    id="receipt_number"
                    placeholder="Receipt number"
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
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  placeholder="Cheque number, transaction ID, etc."
                  value={formData.reference_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference_number: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_recurring: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_recurring" className="font-normal">
                  This is a recurring expense
                </Label>
              </div>

              {formData.is_recurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurring_frequency">Frequency</Label>
                  <Select
                    value={formData.recurring_frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurring_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
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
    </div>
  );
}
