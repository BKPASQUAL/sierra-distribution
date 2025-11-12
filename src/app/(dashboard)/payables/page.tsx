// src/app/(dashboard)/payables/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  AlertTriangle,
  DollarSign,
  Calendar,
  Loader2,
  Receipt,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface OutstandingPayable {
  id: string;
  purchase_id: string;
  purchase_date: string;
  invoice_number: string | null;
  supplier_name: string;
  supplier_code: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  payment_terms: string | null;
  due_date: string | null;
  days_overdue: number;
  urgency: "current" | "medium" | "high" | "critical";
}

interface SupplierPayment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  suppliers: {
    name: string;
  };
  purchases: {
    purchase_id: string;
  } | null;
}

interface PayablesSummary {
  total_outstanding: number;
  current: number;
  overdue_30: number;
  overdue_60: number;
  overdue_90_plus: number;
  supplier_count: number;
  invoice_count: number;
}

export default function PayablesPage() {
  const [loading, setLoading] = useState(true);
  const [payables, setPayables] = useState<OutstandingPayable[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [summary, setSummary] = useState<PayablesSummary | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] =
    useState<OutstandingPayable | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [banks, setBanks] = useState<any[]>([]);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "bank_transfer", // <-- Removed "as const"
    bank_id: "",
    reference_number: "",
    cheque_number: "",
    cheque_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
    fetchBanks();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch outstanding payables
      const payablesResponse = await fetch("/api/payables/outstanding");
      const payablesData = await payablesResponse.json();

      if (payablesResponse.ok) {
        setPayables(payablesData.payables || []);
        setSummary(payablesData.summary || null);
      }

      // Fetch recent payments
      const paymentsResponse = await fetch("/api/supplier-payments?limit=20");
      const paymentsData = await paymentsResponse.json();

      if (paymentsResponse.ok) {
        setPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load payables data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      const data = await response.json();
      if (response.ok) {
        setBanks(data.banks || []);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayable || !paymentData.amount) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (amount <= 0 || amount > selectedPayable.balance_due) {
      toast.error(
        `Amount must be between 0 and ${selectedPayable.balance_due}`
      );
      return;
    }

    try {
      const response = await fetch("/api/supplier-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedPayable.id, // This should be supplier_id from the payable
          purchase_id: selectedPayable.id,
          payment_date: paymentData.payment_date,
          amount: amount,
          payment_method: paymentData.payment_method,
          bank_id: paymentData.bank_id || null,
          reference_number: paymentData.reference_number || null,
          cheque_number: paymentData.cheque_number || null,
          cheque_date: paymentData.cheque_date || null,
          notes: paymentData.notes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment recorded successfully!");
        setIsPaymentDialogOpen(false);
        setSelectedPayable(null);
        resetPaymentForm();
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Error recording payment");
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      payment_method: "bank_transfer",
      bank_id: "",
      reference_number: "",
      cheque_number: "",
      cheque_date: "",
      notes: "",
    });
  };

  const openPaymentDialog = (payable: OutstandingPayable) => {
    setSelectedPayable(payable);
    setPaymentData({
      ...paymentData,
      amount: payable.balance_due.toString(),
    });
    setIsPaymentDialogOpen(true);
  };

  // Filter payables
  const filteredPayables = payables.filter((payable) => {
    const matchesSearch =
      payable.purchase_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payable.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payable.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUrgency =
      urgencyFilter === "all" || payable.urgency === urgencyFilter;

    return matchesSearch && matchesUrgency;
  });

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      current:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[urgency as keyof typeof colors] || colors.current;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading payables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier Payables
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage payments to suppliers and track outstanding balances
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Outstanding
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                LKR {summary.total_outstanding.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.invoice_count} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                LKR {summary.current.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Not overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">0-30 Days</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                LKR {summary.overdue_30.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                LKR {summary.overdue_60.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">60+ Days</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                LKR {summary.overdue_90_plus.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Critical</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="outstanding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outstanding">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Outstanding Payables
          </TabsTrigger>
          <TabsTrigger value="history">
            <Receipt className="w-4 h-4 mr-2" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* Outstanding Payables Tab */}
        <TabsContent value="outstanding" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by purchase ID, supplier..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select
                    value={urgencyFilter}
                    onValueChange={setUrgencyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="medium">Medium (1-30 days)</SelectItem>
                      <SelectItem value="high">High (31-60 days)</SelectItem>
                      <SelectItem value="critical">
                        Critical (60+ days)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payables Table */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>
                Unpaid or partially paid supplier invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                        <p className="text-lg font-medium">
                          No Outstanding Payables!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          All supplier invoices are paid
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayables.map((payable) => (
                      <TableRow key={payable.id}>
                        <TableCell className="font-medium">
                          {payable.purchase_id}
                        </TableCell>
                        <TableCell>{payable.invoice_number || "-"}</TableCell>
                        <TableCell>{payable.supplier_name}</TableCell>
                        <TableCell>
                          {new Date(payable.purchase_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {payable.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          LKR {payable.amount_paid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          LKR {payable.balance_due.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {payable.due_date
                            ? new Date(payable.due_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              payable.days_overdue > 60
                                ? "text-red-600"
                                : payable.days_overdue > 30
                                ? "text-orange-600"
                                : payable.days_overdue > 0
                                ? "text-yellow-600"
                                : "text-gray-600"
                            }`}
                          >
                            {payable.days_overdue > 0
                              ? `${payable.days_overdue} days`
                              : "Current"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUrgencyBadge(payable.urgency)}>
                            {payable.urgency.charAt(0).toUpperCase() +
                              payable.urgency.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(payable)}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {filteredPayables.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={6}>Total Outstanding</TableCell>
                      <TableCell className="text-right text-red-600">
                        LKR{" "}
                        {filteredPayables
                          .reduce((sum, p) => sum + p.balance_due, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                Last 20 payments made to suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No payments recorded yet
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.payment_number}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payment.suppliers.name}</TableCell>
                        <TableCell>
                          {payment.purchases?.purchase_id || "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method.replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          LKR {payment.amount.toLocaleString()}
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
              {selectedPayable && (
                <>
                  Payment for {selectedPayable.supplier_name} -{" "}
                  {selectedPayable.purchase_id}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment}>
            <div className="grid gap-4 py-4">
              {selectedPayable && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Amount:
                    </span>
                    <span className="font-semibold">
                      LKR {selectedPayable.total_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Already Paid:
                    </span>
                    <span className="font-semibold text-green-600">
                      LKR {selectedPayable.amount_paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Balance Due:</span>
                    <span className="font-bold text-red-600">
                      LKR {selectedPayable.balance_due.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_date">
                    Payment Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        payment_date: e.target.value,
                      })
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
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={paymentData.payment_method}
                    onValueChange={(value: any) =>
                      setPaymentData({ ...paymentData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentData.payment_method === "bank_transfer" && (
                  <div className="space-y-2">
                    <Label htmlFor="bank_id">Bank</Label>
                    <Select
                      value={paymentData.bank_id}
                      onValueChange={(value) =>
                        setPaymentData({ ...paymentData, bank_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.bank_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {paymentData.payment_method === "cheque" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cheque_number">Cheque Number</Label>
                    <Input
                      id="cheque_number"
                      placeholder="CHQ123456"
                      value={paymentData.cheque_number}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cheque_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cheque_date">Cheque Date</Label>
                    <Input
                      id="cheque_date"
                      type="date"
                      value={paymentData.cheque_date}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cheque_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  placeholder="Transaction reference, receipt number, etc."
                  value={paymentData.reference_number}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      reference_number: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                />
              </div>

              {selectedPayable &&
                paymentData.amount &&
                parseFloat(paymentData.amount) <
                  selectedPayable.balance_due && (
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      ⚠️ Partial payment. Remaining balance: LKR{" "}
                      {(
                        selectedPayable.balance_due -
                        parseFloat(paymentData.amount)
                      ).toLocaleString()}
                    </p>
                  </div>
                )}

              {selectedPayable &&
                paymentData.amount &&
                parseFloat(paymentData.amount) ===
                  selectedPayable.balance_due && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                    <p className="text-sm text-green-800 dark:text-green-400">
                      ✅ Full payment. This invoice will be marked as paid.
                    </p>
                  </div>
                )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  setSelectedPayable(null);
                  resetPaymentForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
