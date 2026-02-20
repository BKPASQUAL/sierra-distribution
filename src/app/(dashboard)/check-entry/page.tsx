// src/app/(dashboard)/check-entry/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertCircle,
  ReceiptText,
  BanknoteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
}

interface Bank {
  id: string;
  bank_code: string;
  bank_name: string;
}

interface PendingInvoice {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
}

interface InvoiceSettlement {
  invoiceId: string;
  selected: boolean;
  settleAmount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
        {step}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckEntryPage() {
  // Master data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);

  // Loading / submitting
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popover control
  const [customerOpen, setCustomerOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  // Form – header
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [chequeAmount, setChequeAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Invoice settlement map: invoiceId -> {selected, settleAmount}
  const [settlements, setSettlements] = useState<
    Record<string, InvoiceSettlement>
  >({});

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Derive customer list ONLY from customers who have pending invoices
    const fetchCustomersWithDebt = async () => {
      try {
        const res = await fetch("/api/orders/unpaid");
        const data = await res.json();
        if (res.ok) {
          const orders: Array<{ customer_id: string; customer_name: string }> =
            data.orders ?? [];
          // Deduplicate by customer_id
          const seen = new Set<string>();
          const unique: Customer[] = [];
          for (const o of orders) {
            if (!seen.has(o.customer_id)) {
              seen.add(o.customer_id);
              unique.push({ id: o.customer_id, name: o.customer_name });
            }
          }
          // Sort alphabetically
          unique.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(unique);
        }
      } catch {
        toast.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        if (res.ok) setBanks(data.banks ?? []);
      } catch {
        toast.error("Failed to load banks");
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchCustomersWithDebt();
    fetchBanks();
  }, []);

  const fetchPendingInvoices = useCallback(async (customerId: string) => {
    if (!customerId) return;
    setLoadingInvoices(true);
    setPendingInvoices([]);
    setSettlements({});
    try {
      const res = await fetch(
        `/api/orders/unpaid/by-customer?customer_id=${customerId}`
      );
      const data = await res.json();
      if (res.ok) {
        const invoices: PendingInvoice[] = data.orders ?? [];
        setPendingInvoices(invoices);
        // Initialise settlement map
        const map: Record<string, InvoiceSettlement> = {};
        invoices.forEach((inv) => {
          map[inv.id] = {
            invoiceId: inv.id,
            selected: false,
            settleAmount: 0,
          };
        });
        setSettlements(map);
      }
    } catch {
      toast.error("Failed to load pending invoices");
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  // Reload invoices whenever customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchPendingInvoices(selectedCustomerId);
    } else {
      setPendingInvoices([]);
      setSettlements({});
    }
  }, [selectedCustomerId, fetchPendingInvoices]);

  // ── Computed values ────────────────────────────────────────────────────────

  const totalAllocated = Object.values(settlements)
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + (s.settleAmount || 0), 0);

  const remaining = chequeAmount - totalAllocated;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedBank = banks.find((b) => b.id === selectedBankId);

  // ── Invoice selection logic ────────────────────────────────────────────────

  const toggleInvoice = (invoiceId: string, invoice: PendingInvoice) => {
    setSettlements((prev) => {
      const current = prev[invoiceId];
      const nowSelected = !current.selected;

      // Auto-fill settle amount when selecting (capped by remaining & balance)
      let autoAmount = 0;
      if (nowSelected) {
        const currentRemaining =
          chequeAmount -
          Object.values(prev)
            .filter((s) => s.selected && s.invoiceId !== invoiceId)
            .reduce((sum, s) => sum + s.settleAmount, 0);
        autoAmount = Math.min(invoice.balance, Math.max(0, currentRemaining));
      }

      return {
        ...prev,
        [invoiceId]: {
          ...current,
          selected: nowSelected,
          settleAmount: nowSelected ? autoAmount : 0,
        },
      };
    });
  };

  const updateSettleAmount = (invoiceId: string, value: number, maxBalance: number) => {
    const capped = Math.min(Math.max(0, value), maxBalance);
    setSettlements((prev) => ({
      ...prev,
      [invoiceId]: { ...prev[invoiceId], settleAmount: capped },
    }));
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setSelectedCustomerId("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setChequeNumber("");
    setChequeDate("");
    setSelectedBankId("");
    setChequeAmount(0);
    setNotes("");
    setPendingInvoices([]);
    setSettlements({});
  };

  // ── Submission ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Validation
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!chequeNumber.trim()) {
      toast.error("Please enter a cheque number");
      return;
    }
    if (!chequeDate) {
      toast.error("Please enter the cheque date");
      return;
    }
    if (!selectedBankId) {
      toast.error("Please select a bank");
      return;
    }
    if (chequeAmount <= 0) {
      toast.error("Please enter a valid cheque amount");
      return;
    }

    const selectedSettlements = Object.values(settlements).filter(
      (s) => s.selected && s.settleAmount > 0
    );

    if (selectedSettlements.length === 0) {
      toast.error(
        "Please select at least one invoice and enter an amount to settle"
      );
      return;
    }

    if (totalAllocated > chequeAmount) {
      toast.error("Allocated amount exceeds cheque amount");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const s of selectedSettlements) {
        const paymentNumber = `CHQ-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`;

        const paymentData = {
          payment_number: paymentNumber,
          order_id: s.invoiceId,
          customer_id: selectedCustomerId,
          payment_date: paymentDate,
          amount: s.settleAmount,
          payment_method: "cheque",
          deposit_account_id: null,
          reference_number: null,
          notes: notes || null,
          cheque_number: chequeNumber,
          cheque_date: chequeDate,
          cheque_status: "pending",
          bank_account_id: selectedBankId,
        };

        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        });

        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          console.error("Payment error:", err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} invoice${successCount > 1 ? "s" : ""} settled successfully!`
        );
        resetForm();
      }
      if (failCount > 0) {
        toast.error(`${failCount} payment(s) failed. Please check and retry.`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check Entry</h1>
          <p className="text-muted-foreground text-sm">
            Record a cheque payment and settle customer invoices
          </p>
        </div>
      </div>

      {/* ── SECTION 1: Check Header ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <StepBadge step={1} label="Cheque Details" />
          </div>
          <CardDescription>
            Select the customer and enter cheque information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Customer */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>Customer *</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between font-normal"
                    disabled={loadingCustomers}
                  >
                    {loadingCustomers ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading…
                      </span>
                    ) : selectedCustomer ? (
                      <span className="truncate">{selectedCustomer.name}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select customer…
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="Search customers…" />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomerId === c.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="font-medium">{c.name}</div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            {/* Cheque Amount */}
            <div className="space-y-2">
              <Label htmlFor="chequeAmount">Cheque Amount *</Label>
              <Input
                id="chequeAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={chequeAmount || ""}
                onChange={(e) =>
                  setChequeAmount(parseFloat(e.target.value) || 0)
                }
              />
            </div>

            {/* Cheque Number */}
            <div className="space-y-2">
              <Label htmlFor="chequeNumber">Cheque Number *</Label>
              <Input
                id="chequeNumber"
                placeholder="e.g. 000123"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
            </div>

            {/* Cheque Date */}
            <div className="space-y-2">
              <Label htmlFor="chequeDate">Cheque Date *</Label>
              <Input
                id="chequeDate"
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
              />
            </div>

            {/* Bank */}
            <div className="space-y-2">
              <Label>Bank *</Label>
              <Popover open={bankOpen} onOpenChange={setBankOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bankOpen}
                    className="w-full justify-between font-normal"
                    disabled={loadingBanks}
                  >
                    {loadingBanks ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading…
                      </span>
                    ) : selectedBank ? (
                      <span className="truncate">
                        {selectedBank.bank_code} – {selectedBank.bank_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select bank…
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="Search banks…" />
                    <CommandList>
                      <CommandEmpty>No banks found.</CommandEmpty>
                      <CommandGroup>
                        {banks.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={`${b.bank_code} ${b.bank_name}`}
                            onSelect={() => {
                              setSelectedBankId(b.id);
                              setBankOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBankId === b.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{b.bank_code}</div>
                              <div className="text-xs text-muted-foreground">
                                {b.bank_name}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Any additional notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 2: Pending Invoices ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <StepBadge step={2} label="Pending Invoices" />
          </div>
          <CardDescription>
            {selectedCustomerId
              ? "Select the invoices you want to settle with this cheque"
              : "Select a customer above to load their pending invoices"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCustomerId ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">No customer selected</p>
            </div>
          ) : loadingInvoices ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading invoices…</span>
            </div>
          ) : pendingInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <ReceiptText className="h-8 w-8 opacity-40" />
              <p className="text-sm">No pending invoices for this customer</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right w-40">
                        Settle Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvoices.map((inv) => {
                      const s = settlements[inv.id];
                      const isSelected = s?.selected ?? false;
                      return (
                        <TableRow
                          key={inv.id}
                          className={cn(
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              id={`chk-${inv.id}`}
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleInvoice(inv.id, inv)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium font-mono text-sm">
                            {inv.order_number}
                          </TableCell>
                          <TableCell>
                            {new Date(inv.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inv.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(inv.paid_amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(inv.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              max={inv.balance}
                              disabled={!isSelected}
                              value={s?.settleAmount || ""}
                              onChange={(e) =>
                                updateSettleAmount(
                                  inv.id,
                                  parseFloat(e.target.value) || 0,
                                  inv.balance
                                )
                              }
                              className="w-36 text-right ml-auto"
                              placeholder="0.00"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pendingInvoices.map((inv) => {
                  const s = settlements[inv.id];
                  const isSelected = s?.selected ?? false;
                  return (
                    <div
                      key={inv.id}
                      className={cn(
                        "border rounded-lg p-4 space-y-3 transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`mob-chk-${inv.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleInvoice(inv.id, inv)}
                          />
                          <div>
                            <p className="font-semibold font-mono text-sm">
                              {inv.order_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(inv.order_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-orange-600 text-sm">
                          {formatCurrency(inv.balance)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-xs border-t pt-2">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="text-right">
                          {formatCurrency(inv.total_amount)}
                        </span>
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="text-right">
                          {formatCurrency(inv.paid_amount)}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="space-y-1">
                          <Label className="text-xs">Settle Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            max={inv.balance}
                            value={s?.settleAmount || ""}
                            onChange={(e) =>
                              updateSettleAmount(
                                inv.id,
                                parseFloat(e.target.value) || 0,
                                inv.balance
                              )
                            }
                            placeholder="0.00"
                            className="text-right"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 3: Summary & Submit ─────────────────────────────────── */}
      {selectedCustomerId && chequeAmount > 0 && (
        <Card
          className={cn(
            "border-2",
            remaining < 0
              ? "border-destructive/50 bg-destructive/5"
              : remaining === 0
              ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
              : "border-primary/20"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <StepBadge step={3} label="Summary & Submit" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Allocation summary */}
              <div className="flex flex-wrap gap-6">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cheque Amount
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(chequeAmount)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Allocated
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(totalAllocated)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Remaining
                  </p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      remaining < 0
                        ? "text-destructive"
                        : remaining === 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    remaining < 0 ||
                    Object.values(settlements).filter(
                      (s) => s.selected && s.settleAmount > 0
                    ).length === 0
                  }
                  className="flex-1 sm:flex-none gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <BanknoteIcon className="h-4 w-4" />
                      Settle Invoices
                    </>
                  )}
                </Button>
              </div>
            </div>

            {remaining < 0 && (
              <p className="mt-3 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Allocated amount exceeds cheque amount. Please adjust settlement
                amounts.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
