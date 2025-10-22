// src/app/(dashboard)/due-invoices/page.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Phone, Mail, Eye, DollarSign, Calendar, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Due Invoice type
interface DueInvoice {
  id: string;
  invoiceNo: string;
  customer: string;
  customerId: number;
  customerContact: string;
  customerEmail: string;
  billDate: string;
  dueDate: string;
  daysOverdue: number;
  total: number;
  paid: number;
  balance: number;
  lastReminderDate: string | null;
  reminderCount: number;
}

// Mock overdue invoices data
const mockDueInvoices: DueInvoice[] = [
  {
    id: '1',
    invoiceNo: 'INV-003',
    customer: 'Fernando Constructions',
    customerId: 3,
    customerContact: '+94 76 345 6789',
    customerEmail: 'fernando@constructions.lk',
    billDate: '2024-11-15',
    dueDate: '2024-12-15',
    daysOverdue: 68,
    total: 425000,
    paid: 300000,
    balance: 125000,
    lastReminderDate: '2025-01-10',
    reminderCount: 2,
  },
  {
    id: '2',
    invoiceNo: 'INV-005',
    customer: 'Mendis Electrician Services',
    customerId: 5,
    customerContact: '+94 77 567 8901',
    customerEmail: 'mendis@services.lk',
    billDate: '2024-11-20',
    dueDate: '2024-12-20',
    daysOverdue: 63,
    total: 320000,
    paid: 0,
    balance: 320000,
    lastReminderDate: '2025-01-05',
    reminderCount: 3,
  },
  {
    id: '3',
    invoiceNo: 'INV-009',
    customer: 'Perera Hardware',
    customerId: 1,
    customerContact: '+94 77 123 4567',
    customerEmail: 'perera@hardware.lk',
    billDate: '2024-11-25',
    dueDate: '2024-12-25',
    daysOverdue: 58,
    total: 185000,
    paid: 85000,
    balance: 100000,
    lastReminderDate: null,
    reminderCount: 0,
  },
  {
    id: '4',
    invoiceNo: 'INV-012',
    customer: 'Silva Electricals',
    customerId: 2,
    customerContact: '+94 71 234 5678',
    customerEmail: 'silva@electric.lk',
    billDate: '2024-12-01',
    dueDate: '2024-12-31',
    daysOverdue: 52,
    total: 275000,
    paid: 150000,
    balance: 125000,
    lastReminderDate: '2025-01-12',
    reminderCount: 1,
  },
  {
    id: '5',
    invoiceNo: 'INV-015',
    customer: 'Jayasinghe Hardware Store',
    customerId: 4,
    customerContact: '+94 75 456 7890',
    customerEmail: 'jayasinghe@store.lk',
    billDate: '2024-12-03',
    dueDate: '2025-01-02',
    daysOverdue: 50,
    total: 195000,
    paid: 50000,
    balance: 145000,
    lastReminderDate: null,
    reminderCount: 0,
  },
];

export default function DueInvoicesPage() {
  const [dueInvoices, setDueInvoices] = useState(mockDueInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DueInvoice | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Filter invoices
  const filteredInvoices = dueInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort by days overdue (most overdue first)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Calculate stats
  const totalOverdue = dueInvoices.length;
  const totalAmount = dueInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const criticalCount = dueInvoices.filter(inv => inv.daysOverdue > 90).length;
  const noReminderCount = dueInvoices.filter(inv => inv.reminderCount === 0).length;

  const getDaysOverdueColor = (days: number) => {
    if (days > 90) return 'text-red-600 font-bold';
    if (days > 60) return 'text-orange-600 font-semibold';
    return 'text-yellow-600 font-medium';
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days > 90) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
    }
    if (days > 60) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
  };

  const handleSendReminder = () => {
    if (!selectedInvoice) return;

    // Update invoice with new reminder
    setDueInvoices(dueInvoices.map(inv => 
      inv.id === selectedInvoice.id 
        ? {
            ...inv,
            lastReminderDate: new Date().toISOString().split('T')[0],
            reminderCount: inv.reminderCount + 1,
          }
        : inv
    ));

    console.log('Sending reminder:', {
      invoice: selectedInvoice.invoiceNo,
      customer: selectedInvoice.customer,
      email: selectedInvoice.customerEmail,
      message: reminderMessage,
    });

    setIsReminderDialogOpen(false);
    setSelectedInvoice(null);
    setReminderMessage('');
    alert('Reminder sent successfully via Email and SMS!');
  };

  const handleMarkAsPaid = () => {
    if (!selectedInvoice || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > selectedInvoice.balance) {
      alert('Payment amount cannot exceed balance');
      return;
    }

    // Remove from overdue list if fully paid
    if (paymentAmount === selectedInvoice.balance) {
      setDueInvoices(dueInvoices.filter(inv => inv.id !== selectedInvoice.id));
      alert('Invoice marked as fully paid and removed from overdue list!');
    } else {
      // Update balance if partially paid
      setDueInvoices(dueInvoices.map(inv => 
        inv.id === selectedInvoice.id 
          ? {
              ...inv,
              paid: inv.paid + paymentAmount,
              balance: inv.balance - paymentAmount,
            }
          : inv
      ));
      alert('Partial payment recorded!');
    }

    setIsMarkPaidDialogOpen(false);
    setSelectedInvoice(null);
    setPaymentAmount(0);
  };

  const openReminderDialog = (invoice: DueInvoice) => {
    setSelectedInvoice(invoice);
    setReminderMessage(
      `Dear ${invoice.customer},\n\nThis is a friendly reminder that Invoice ${invoice.invoiceNo} dated ${new Date(invoice.billDate).toLocaleDateString()} is now ${invoice.daysOverdue} days overdue.\n\nOutstanding Balance: LKR ${invoice.balance.toLocaleString()}\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\nSierra Distribution`
    );
    setIsReminderDialogOpen(true);
  };

  const openMarkPaidDialog = (invoice: DueInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance);
    setIsMarkPaidDialogOpen(true);
  };

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
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Payment Collection Alert</h3>
              <p className="text-sm text-muted-foreground">
                {totalOverdue} invoices are overdue by more than 45 days. Total outstanding: LKR {totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices 45+ days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
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
            <CardTitle className="text-sm font-medium">Critical (90+ Days)</CardTitle>
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
              Showing {sortedInvoices.length} overdue invoice(s)
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <TableHead>Last Reminder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="text-lg font-medium">No Overdue Invoices!</p>
                    <p className="text-sm text-muted-foreground">All payments are up to date</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id}
                    className="hover:bg-destructive/5"
                  >
                    <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.customer}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Phone className="w-3 h-3" />
                          {invoice.customerContact}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(invoice.billDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDaysOverdueBadge(invoice.daysOverdue)}`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {invoice.daysOverdue} days
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {invoice.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      LKR {invoice.paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${getDaysOverdueColor(invoice.daysOverdue)}`}>
                        LKR {invoice.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {invoice.lastReminderDate ? (
                        <div className="text-sm">
                          <p>{new Date(invoice.lastReminderDate).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            ({invoice.reminderCount} reminder{invoice.reminderCount > 1 ? 's' : ''})
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No reminders</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/bills/${invoice.invoiceNo}`}
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
                          onClick={() => openMarkPaidDialog(invoice)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send reminder to {selectedInvoice?.customer} for Invoice {selectedInvoice?.invoiceNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Customer</Label>
                <p className="font-medium">{selectedInvoice?.customer}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Days Overdue</Label>
                <p className={`font-bold ${getDaysOverdueColor(selectedInvoice?.daysOverdue || 0)}`}>
                  {selectedInvoice?.daysOverdue} days
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm">{selectedInvoice?.customerEmail}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Phone</Label>
                <p className="text-sm">{selectedInvoice?.customerContact}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Outstanding Balance</Label>
                <p className="font-bold text-destructive">
                  LKR {selectedInvoice?.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Previous Reminders</Label>
                <p className="text-sm">{selectedInvoice?.reminderCount || 0} sent</p>
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
                setReminderMessage('');
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

      {/* Mark as Paid Dialog */}
      <Dialog open={isMarkPaidDialogOpen} onOpenChange={setIsMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for Invoice {selectedInvoice?.invoiceNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <p className="font-medium">{selectedInvoice?.customer}</p>
            </div>
            <div className="space-y-2">
              <Label>Outstanding Balance</Label>
              <p className="text-2xl font-bold text-destructive">
                LKR {selectedInvoice?.balance.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount (LKR)</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                max={selectedInvoice?.balance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            {paymentAmount > 0 && paymentAmount < (selectedInvoice?.balance || 0) && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  Partial payment. Remaining balance: LKR {((selectedInvoice?.balance || 0) - paymentAmount).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMarkPaidDialogOpen(false);
                setSelectedInvoice(null);
                setPaymentAmount(0);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}