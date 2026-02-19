// src/app/(dashboard)/due-invoices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Phone,
  Mail,
  Eye,
  DollarSign,
  Calendar,
  Send,
  CheckCircle,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Due Invoice type
interface DueInvoice {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  total_amount: number;
  balance: number;
  paid: number;
  daysOverdue: number;
  payment_status: string;
  customers: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  lastReminderDate: string | null;
  reminderCount: number;
}

export default function DueInvoicesPage() {
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] =
    useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DueInvoice | null>(
    null
  );
  const [reminderMessage, setReminderMessage] = useState("");

  // Payment form data
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    reference: "",
    chequeNo: "",
    chequeDate: "",
    notes: "",
  });

  // Fetch and calculate due invoices
  useEffect(() => {
    fetchDueInvoices();
  }, []);

  const fetchDueInvoices = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (!ordersData.orders) {
        console.error("Failed to fetch orders");
        return;
      }

      // Fetch all payments
      const paymentsResponse = await fetch("/api/payments");
      const paymentsData = await paymentsResponse.json();

      if (!paymentsData.payments) {
        console.error("Failed to fetch payments");
        return;
      }

      // Filter orders that are not fully paid
      const unpaidOrders = ordersData.orders.filter(
        (order: any) =>
          order.payment_status === "unpaid" ||
          order.payment_status === "partial"
      );

      // Calculate balance and days overdue for each order
      const overdueInvoices: DueInvoice[] = unpaidOrders.map((order: any) => {
        // Calculate total paid (exclude returned cheques)
        const orderPayments = paymentsData.payments.filter(
          (p: any) => p.order_id === order.id && p.cheque_status !== "returned"
        );

        const totalPaid = orderPayments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        );
        const balance = order.total_amount - totalPaid;

        // Calculate days overdue (from order date)
        const orderDate = new Date(order.order_date);
        const today = new Date();
        const diffTime = today.getTime() - orderDate.getTime();
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Count reminders (for future implementation - would need reminders table)
        const reminderCount = 0;
        const lastReminderDate = null;

        return {
          id: order.id,
          order_number: order.order_number,
          order_date: order.order_date,
          customer_id: order.customer_id,
          total_amount: order.total_amount,
          balance: balance,
          paid: totalPaid,
          daysOverdue: daysOverdue,
          payment_status: order.payment_status,
          customers: order.customers,
          lastReminderDate,
          reminderCount,
        };
      });

      // Filter only invoices that are 45+ days overdue
      const criticalOverdue = overdueInvoices.filter(
        (inv) => inv.daysOverdue >= 45
      );

      // Sort by days overdue (most overdue first)
      criticalOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

      setDueInvoices(criticalOverdue);
    } catch (error) {
      console.error("Error fetching due invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices
  const filteredInvoices = dueInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customers.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const totalOverdue = dueInvoices.length;
  const totalAmount = dueInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const criticalCount = dueInvoices.filter(
    (inv) => inv.daysOverdue > 90
  ).length;
  const noReminderCount = dueInvoices.filter(
    (inv) => inv.reminderCount === 0
  ).length;

  const getDaysOverdueColor = (days: number) => {
    if (days > 90) return "text-red-600 font-bold";
    if (days > 60) return "text-orange-600 font-semibold";
    return "text-yellow-600 font-medium";
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days > 90) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200";
    }
    if (days > 60) {
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200";
  };

  const handleSendReminder = () => {
    if (!selectedInvoice) return;

    // TODO: Implement actual email/SMS sending via API
    console.log("Sending reminder:", {
      invoice: selectedInvoice.order_number,
      customer: selectedInvoice.customers.name,
      email: selectedInvoice.customers.email,
      phone: selectedInvoice.customers.phone,
      message: reminderMessage,
    });

    setIsReminderDialogOpen(false);
    setSelectedInvoice(null);
    setReminderMessage("");
    alert("Reminder logged! (Email/SMS integration pending)");
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || paymentData.amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (paymentData.amount > selectedInvoice.balance) {
      alert(
        `Payment amount (LKR ${paymentData.amount.toLocaleString()}) cannot exceed balance (LKR ${selectedInvoice.balance.toLocaleString()})`
      );
      return;
    }

    if (
      paymentData.method === "cheque" &&
      (!paymentData.chequeNo || !paymentData.chequeDate)
    ) {
      alert("Please provide cheque number and date for cheque payments");
      return;
    }

    try {
      const payment_number = `PAY-${Date.now()}`;

      const paymentPayload = {
        payment_number,
        order_id: selectedInvoice.id,
        customer_id: selectedInvoice.customer_id,
        payment_date: paymentData.date,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        reference_number: paymentData.reference || null,
        notes:
          paymentData.notes ||
          `Payment for overdue invoice ${selectedInvoice.order_number}`,
        cheque_number:
          paymentData.method === "cheque" ? paymentData.chequeNo : null,
        cheque_date:
          paymentData.method === "cheque" ? paymentData.chequeDate : null,
        cheque_status: paymentData.method === "cheque" ? "pending" : null,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to record payment");
      }

      alert("✅ Payment recorded successfully!");

      // Refresh the due invoices list
      fetchDueInvoices();

      setIsRecordPaymentDialogOpen(false);
      setSelectedInvoice(null);
      resetPaymentForm();
    } catch (error) {
      console.error("Error recording payment:", error);
      alert(`❌ Error recording payment: ${(error as Error).message}`);
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      reference: "",
      chequeNo: "",
      chequeDate: "",
      notes: "",
    });
  };

  const openReminderDialog = (invoice: DueInvoice) => {
    setSelectedInvoice(invoice);
    setReminderMessage(
      `Dear ${
        invoice.customers.name
      },\n\nThis is a friendly reminder that Invoice ${
        invoice.order_number
      } dated ${new Date(invoice.order_date).toLocaleDateString()} is now ${
        invoice.daysOverdue
      } days overdue.\n\nOutstanding Balance: LKR ${invoice.balance.toLocaleString()}\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\nYour Company Name`
    );
    setIsReminderDialogOpen(true);
  };

  const openRecordPaymentDialog = (invoice: DueInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      ...paymentData,
      amount: invoice.balance,
    });
    setIsRecordPaymentDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">
            Due Invoices (45+ Days)
          </h1>
          <p className="text-muted-foreground mt-1">
            Overdue customer invoices requiring immediate attention
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {totalOverdue > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">
                  Payment Collection Alert
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalOverdue} invoices are overdue by more than 45 days.
                  Total outstanding: LKR {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalOverdue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices 45+ days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Amount Due
            </CardTitle>
            <DollarSign className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding balance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Critical (90+ Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Urgent action needed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">No Reminders</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {noReminderCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need first reminder
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search by invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredInvoices.length} overdue invoice(s)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {filteredInvoices.length === 0 ? (
               <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-lg font-medium">No Overdue Invoices!</p>
                  <p className="text-sm text-muted-foreground">
                    All payments are up to date (45+ days)
                  </p>
                </div>
            ) : (
               filteredInvoices.map((invoice) => (
                 <div key={invoice.id} className="border rounded-lg p-4 space-y-3 bg-card hover:bg-destructive/5 transition-colors">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-semibold text-sm">{invoice.order_number}</h3>
                       <p className="text-xs text-muted-foreground mt-1">
                         {new Date(invoice.order_date).toLocaleDateString()}
                       </p>
                     </div>
                     <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDaysOverdueBadge(
                          invoice.daysOverdue
                        )}`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {invoice.daysOverdue} days
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-2">
                     <div className="text-muted-foreground">Customer</div>
                     <div className="text-right">
                       <p className="font-medium">{invoice.customers.name}</p>
                       {invoice.customers.phone && (
                          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                             <Phone className="w-3 h-3" /> {invoice.customers.phone}
                          </div>
                       )}
                     </div>

                     <div className="text-muted-foreground">Total</div>
                     <div className="text-right">LKR {invoice.total_amount.toLocaleString()}</div>

                     <div className="text-muted-foreground">Paid</div>
                     <div className="text-right text-green-600">LKR {invoice.paid.toLocaleString()}</div>

                     <div className="text-muted-foreground">Balance</div>
                     <div className={`text-right font-bold ${getDaysOverdueColor(invoice.daysOverdue)}`}>
                        LKR {invoice.balance.toLocaleString()}
                     </div>
                   </div>

                   <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/bills/${invoice.id}`)
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReminderDialog(invoice)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Remind
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openRecordPaymentDialog(invoice)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pay
                      </Button>
                   </div>
                 </div>
               ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="text-lg font-medium">No Overdue Invoices!</p>
                    <p className="text-sm text-muted-foreground">
                      All payments are up to date (45+ days)
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-destructive/5">
                    <TableCell className="font-medium">
                      {invoice.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.customers.name}</p>
                        {invoice.customers.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Phone className="w-3 h-3" />
                            {invoice.customers.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(invoice.order_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDaysOverdueBadge(
                          invoice.daysOverdue
                        )}`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {invoice.daysOverdue} days
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {invoice.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      LKR {invoice.paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold ${getDaysOverdueColor(
                          invoice.daysOverdue
                        )}`}
                      >
                        LKR {invoice.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/bills/${invoice.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReminderDialog(invoice)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Remind
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openRecordPaymentDialog(invoice)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Record Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send reminder to {selectedInvoice?.customers.name} for Invoice{" "}
              {selectedInvoice?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Customer
                </Label>
                <p className="font-medium">{selectedInvoice?.customers.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Days Overdue
                </Label>
                <p
                  className={`font-bold ${getDaysOverdueColor(
                    selectedInvoice?.daysOverdue || 0
                  )}`}
                >
                  {selectedInvoice?.daysOverdue} days
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm">
                  {selectedInvoice?.customers.email || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Phone</Label>
                <p className="text-sm">
                  {selectedInvoice?.customers.phone || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Outstanding Balance
                </Label>
                <p className="font-bold text-destructive">
                  LKR {selectedInvoice?.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Previous Reminders
                </Label>
                <p className="text-sm">
                  {selectedInvoice?.reminderCount || 0} sent
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={8}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReminderDialogOpen(false);
                setSelectedInvoice(null);
                setReminderMessage("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSendReminder}>
              <Send className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog
        open={isRecordPaymentDialogOpen}
        onOpenChange={setIsRecordPaymentDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for overdue Invoice {selectedInvoice?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Customer</Label>
              <p className="font-medium">{selectedInvoice?.customers.name}</p>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Outstanding Balance</Label>
              <p className="text-2xl font-bold text-destructive">
                LKR {selectedInvoice?.balance.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (LKR) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={selectedInvoice?.balance}
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
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
                value={paymentData.date}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, date: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <Select
                value={paymentData.method}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, method: value })
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="TXN/REF Number"
                value={paymentData.reference}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, reference: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
            {paymentData.method === "cheque" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="chequeNo">Cheque Number *</Label>
                  <Input
                    id="chequeNo"
                    placeholder="CHQ123456"
                    value={paymentData.chequeNo}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        chequeNo: e.target.value,
                      })
                    }
                    className="w-full h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeDate">Cheque Date *</Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={paymentData.chequeDate}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        chequeDate: e.target.value,
                      })
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
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, notes: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
            {paymentData.amount > 0 &&
              paymentData.amount < (selectedInvoice?.balance || 0) && (
                <div className="col-span-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    ⚠️ Partial payment. Remaining balance: LKR{" "}
                    {(
                      (selectedInvoice?.balance || 0) - paymentData.amount
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            {paymentData.amount === selectedInvoice?.balance && (
              <div className="col-span-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-400">
                  ✅ Full payment. Invoice will be marked as paid and removed
                  from overdue list.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordPaymentDialogOpen(false);
                setSelectedInvoice(null);
                resetPaymentForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
