"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertCircle,
  ReceiptText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
}

interface Bank {
  id: string;
  bank_code: string;
  bank_name: string;
}

interface CompanyAccount {
  id: string;
  account_name: string;
  account_type: "saving" | "current" | "cash";
  account_number: string | null;
}

interface PendingBill {
  id: string; // The UUID
  purchase_id: string; // The human-readable ID (e.g. PO-001)
  purchase_date: string;
  invoice_number?: string | null;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

interface BillSettlement {
  billId: string;
  selected: boolean;
  settleAmount: number;
}

type PaymentMethod = "cash" | "bank" | "cheque";

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

export default function SupplierPaymentEntryPage() {
  const router = useRouter();

  // Master data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<CompanyAccount[]>([]);
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);

  // Loading / submitting
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingBills, setLoadingBills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popover control
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  // Form – header
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Cheque-only fields
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  // IMPORTANT: For supplier payments, we don't necessarily select a *target* bank for the cheque
  // functionality as implemented in the customer side. However, the existing API schema implies
  // cheque details. We'll reuse the logic: if cheque, we might need bank details or just cheque no.
  // The API route accepts check details.
  // We'll follow the pattern: Cheque payments usually imply writing a cheque from OUR bank account if it's a supplier payment.
  // So 'bank_account_id' in the payload effectively becomes the account we are paying FROM.
  // But wait, the API uses 'company_account_id' for the source of funds.
  // Let's check the API... API expects `company_account_id` as the source.
  // So for Cheque, we pick a company account (Bank Account).
  // The fields `cheque_number` and `cheque_date` are just metadata.
  
  // Cash / Bank-only field
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Invoice settlement map
  const [settlements, setSettlements] = useState<
    Record<string, BillSettlement>
  >({});
  
  // Search query for pending bills
  const [searchQuery, setSearchQuery] = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Fetch Suppliers with unpaid bills
    const fetchSuppliersWithDebt = async () => {
      try {
        const res = await fetch("/api/purchases/unpaid"); // We can filter client-side or duplicate logic
        const data = await res.json();
        if (res.ok) {
          const purchases: Array<{
            suppliers: { id: string; name: string };
          }> = data.purchases ?? [];
          
          const seen = new Set<string>();
          const unique: Supplier[] = [];
          
          for (const p of purchases) {
            if (p.suppliers && !seen.has(p.suppliers.id)) {
              seen.add(p.suppliers.id);
              unique.push({ id: p.suppliers.id, name: p.suppliers.name });
            }
          }
          unique.sort((a, b) => a.name.localeCompare(b.name));
          setSuppliers(unique);
          
          // Auto-select Sierra Cables Ltd if present
          const sierra = unique.find(s => s.name.toLowerCase().includes("sierra cables"));
          if (sierra) {
            setSelectedSupplierId(sierra.id);
          }
        }
      } catch {
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
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

    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (res.ok) setCompanyAccounts(data.accounts ?? []);
      } catch {
        toast.error("Failed to load accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    // fetchSuppliersWithDebt depends on unpaid purchases API
    // If '/api/purchases/unpaid' returns a structure, we use it.
    
    // Let's execute fetch
    fetchSuppliersWithDebt();
    fetchBanks();
    fetchAccounts();
  }, []);

  // Filter accounts by method
  const availableAccounts = companyAccounts.filter((acc) => {
    if (paymentMethod === "cash") return acc.account_type === "cash";
    // For bank transfer OR Cheque, we need a bank account (saving/current)
    if (paymentMethod === "bank" || paymentMethod === "cheque")
      return acc.account_type === "saving" || acc.account_type === "current";
    return false;
  });

  const fetchPendingBills = useCallback(async (supplierId: string) => {
    if (!supplierId) return;
    setLoadingBills(true);
    setPendingBills([]);
    setSettlements({});
    
    try {
      // We need an endpoint to get unpaid bills for a specific supplier
      // If '/api/purchases/unpaid' returns ALL, we can filter client-side if the list isn't huge.
      // Or we can query by supplier.
      // Let's assume we fetch all unpaid and filter.
      const res = await fetch("/api/purchases/unpaid");
      const data = await res.json();
      
      if (res.ok) {
        const allUnpaid: any[] = data.purchases ?? [];
        const supplierBills = allUnpaid.filter(
          (p: any) => p.suppliers?.id === supplierId
        );
        
        const mappedBills: PendingBill[] = supplierBills.map((p: any) => ({
           id: p.id,
           purchase_id: p.purchase_id,
           purchase_date: p.purchase_date,
           invoice_number: p.invoice_number,
           total_amount: p.total_amount,
           amount_paid: p.amount_paid,
           balance_due: p.balance_due
        }));

        setPendingBills(mappedBills);

        const map: Record<string, BillSettlement> = {};
        mappedBills.forEach((bill) => {
          map[bill.id] = { billId: bill.id, selected: false, settleAmount: 0 };
        });
        setSettlements(map);
      }
    } catch {
      toast.error("Failed to load pending bills");
    } finally {
      setLoadingBills(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchPendingBills(selectedSupplierId);
    } else {
      setPendingBills([]);
      setSettlements({});
    }
  }, [selectedSupplierId, fetchPendingBills]);

  // Reset account when method changes
  useEffect(() => {
    setSelectedAccountId("");
  }, [paymentMethod]);

  // ── Computed values ────────────────────────────────────────────────────────

  const totalAllocated = Object.values(settlements)
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + (s.settleAmount || 0), 0);

  const remaining = totalAmount - totalAllocated;

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const filteredBills = pendingBills.filter((bill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (bill.purchase_id && bill.purchase_id.toLowerCase().includes(query)) ||
      (bill.invoice_number && bill.invoice_number.toLowerCase().includes(query))
    );
  });

  // ── Invoice selection ─────────────────────────────────────────────────────

  const toggleBill = (billId: string, bill: PendingBill) => {
    setSettlements((prev) => {
      const current = prev[billId];
      const nowSelected = !current.selected;
      let autoAmount = 0;
      if (nowSelected) {
        const currentRemaining =
          totalAmount -
          Object.values(prev)
            .filter((s) => s.selected && s.billId !== billId)
            .reduce((sum, s) => sum + s.settleAmount, 0);
        autoAmount = Math.min(bill.balance_due, Math.max(0, currentRemaining));
      }
      return {
        ...prev,
        [billId]: {
          ...current,
          selected: nowSelected,
          settleAmount: nowSelected ? autoAmount : 0,
        },
      };
    });
  };

  const updateSettleAmount = (
    billId: string,
    value: number,
    maxBalance: number
  ) => {
    const capped = Math.min(Math.max(0, value), maxBalance);
    setSettlements((prev) => ({
      ...prev,
      [billId]: { ...prev[billId], settleAmount: capped },
    }));
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetForm = () => {
    // Keep supplier selected if desired, or reset? Let's reset to allow new Flow
    // But user asked for auto-select Sierra. So we might re-select it if in list.
    // For now, full reset.
    setSelectedSupplierId("");
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTotalAmount(0);
    setNotes("");
    setChequeNumber("");
    setChequeDate("");
    setSelectedAccountId("");
    setPendingBills([]);
    setSettlements({});
    
    // Re-check for Sierra
    const sierra = suppliers.find(s => s.name.toLowerCase().includes("sierra cables"));
    if (sierra) {
      setSelectedSupplierId(sierra.id);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return false;
    }
    if (totalAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return false;
    }
    if (paymentMethod === "cheque") {
      if (!chequeNumber.trim()) {
        toast.error("Please enter a cheque number");
        return false;
      }
      if (!chequeDate) {
        toast.error("Please enter the cheque date");
        return false;
      }
    }
    if (!selectedAccountId) {
       // All methods need a source account in this system (Cash acc, or Bank acc)
      toast.error(
        `Please select a ${paymentMethod === "cash" ? "cash" : "bank"} account`
      );
      return false;
    }
    
    const selected = Object.values(settlements).filter(
      (s) => s.selected && s.settleAmount > 0
    );
    if (selected.length === 0) {
      toast.error("Please select at least one bill to settle");
      return false;
    }
    if (totalAllocated > totalAmount) {
      toast.error("Allocated amount exceeds payment amount");
      return false;
    }
    return true;
  };

  // ── Submission ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    const selectedSettlements = Object.values(settlements).filter(
      (s) => s.selected && s.settleAmount > 0
    );

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const s of selectedSettlements) {
        
        // Prepare payload for POST /api/supplier-payments
        const paymentPayload = {
          purchase_id: s.billId,
          company_account_id: selectedAccountId,
          amount: s.settleAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          cheque_number: paymentMethod === 'cheque' ? chequeNumber : null,
          cheque_date: paymentMethod === 'cheque' ? chequeDate : null,
          notes: notes || null
        };

        const res = await fetch("/api/supplier-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentPayload),
        });

        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          console.error("Payment error:", err);
          failCount++;
        }
      }

      // Check if there is remaining amount - for suppliers we generally DON'T keep credit
      // unless specifically requested. User didn't ask for supplier credit feature.
      // So we ignore overpayment logic for now or warn user.
      if (remaining > 0) {
        toast.warning(`Note: ${formatCurrency(remaining)} was unallocated and not saved.`);
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} bill${successCount > 1 ? "s" : ""} paid successfully!`
        );
        resetForm();
        // Maybe redirect to supplier-payments page to see the list?
        // User said "after the eneter shode be show in the pending cheqes"
        // Let's offer a toast action or just stay here for more entry.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const methodLabel: Record<PaymentMethod, string> = {
    cash: "Cash",
    bank: "Bank Transfer",
    cheque: "Cheque",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Payment Entry</h1>
          <p className="text-muted-foreground text-sm">
            Record payments to suppliers and settle bills
          </p>
        </div>
      </div>

      {/* ── SECTION 1: Payment Details ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <StepBadge step={1} label="Payment Details" />
          <CardDescription>
            Select supplier, account, and enter payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Supplier */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>Supplier *</Label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierOpen}
                    className="w-full justify-between font-normal"
                    disabled={loadingSuppliers}
                  >
                    {loadingSuppliers ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading…
                      </span>
                    ) : selectedSupplier ? (
                      <span className="truncate">{selectedSupplier.name}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select supplier…
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
                    <CommandInput placeholder="Search suppliers…" />
                    <CommandList>
                      <CommandEmpty>No suppliers found.</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => {
                              setSelectedSupplierId(s.id);
                              setSupplierOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSupplierId === s.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="font-medium">{s.name}</div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Total Amount */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">
                {methodLabel[paymentMethod]} Amount *
              </Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={totalAmount || ""}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Account Selection (Source) */}
            <div className="space-y-2">
              <Label>
                {paymentMethod === "cash" ? "Cash Account" : "Bank Account"} *
              </Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={loadingAccounts}
              >
                <SelectTrigger className="w-full">
                  {loadingAccounts ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    <SelectValue placeholder="Select account…" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No accounts available
                    </SelectItem>
                  ) : (
                    availableAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name}
                        {acc.account_number ? ` — ${acc.account_number}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
             {/* ── CHEQUE FIELDS ── */}
             {paymentMethod === "cheque" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number *</Label>
                  <Input
                    id="chequeNumber"
                    placeholder="e.g. 000123"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chequeDate">Cheque Date *</Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                  />
                </div>
              </>
            )}

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

      {/* ── SECTION 2: Pending Bills ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <StepBadge step={2} label="Pending Bills" />
          <CardDescription>
            Select unpaid bills to settle against this payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedSupplierId ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <ReceiptText className="h-10 w-10 mb-2 opacity-20" />
              <p>Select a supplier to view pending bills</p>
            </div>
          ) : loadingBills ? (
            <div className="flex items-center justify-center py-10 border rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-lg bg-muted/20">
              <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
              <p>No pending bills found for this supplier.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Bill ID or Invoice No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="overflow-hidden border rounded-lg">
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] text-center">Select</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Valid Balance</TableHead>
                    <TableHead className="text-right w-[150px]">
                      Allocate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No bills found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => {
                      const s = settlements[bill.id] || {
                        billId: bill.id,
                        selected: false,
                        settleAmount: 0,
                      };
                    return (
                      <TableRow
                        key={bill.id}
                        className={cn(
                          "transition-colors",
                          s.selected ? "bg-primary/5" : ""
                        )}
                        onClick={() => toggleBill(bill.id, bill)}
                      >
                         <TableCell className="text-center">
                          <div
                            className={cn(
                              "h-5 w-5 rounded border border-primary/50 mx-auto flex items-center justify-center transition-all",
                              s.selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:border-primary"
                            )}
                          >
                            {s.selected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(bill.purchase_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {bill.purchase_id}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {bill.invoice_number || "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(bill.total_amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(bill.amount_paid)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(bill.balance_due)}
                        </TableCell>
                        <TableCell className="text-right p-2">
                           {s.selected ? (
                              <Input
                                type="number"
                                className="h-8 w-24 ml-auto text-right font-bold"
                                value={s.settleAmount === 0 ? "" : s.settleAmount}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateSettleAmount(bill.id, val, bill.balance_due);
                                }}
                              />
                           ) : (
                             <span className="text-muted-foreground/30 text-sm italic">
                               -
                             </span>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-background border-t z-10 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
         <div className="flex gap-6 items-center w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Amount
               </p>
               <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Allocated
               </p>
               <p className={cn("text-xl font-bold", totalAllocated > totalAmount ? "text-destructive" : "text-green-600")}>
                  {formatCurrency(totalAllocated)}
               </p>
            </div>
            <div className="h-8 w-px bg-border" />
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Remaining
               </p>
               <p className="text-xl font-bold text-muted-foreground">
                  {formatCurrency(remaining)}
               </p>
            </div>
         </div>
         
         <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                router.back();
              }}
              disabled={isSubmitting}
            >
               Cancel
            </Button>
            <Button 
               size="lg" 
               className="min-w-[150px]"
               onClick={handleSubmit}
               disabled={isSubmitting}
            >
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Save Payment
            </Button>
         </div>
      </div>
      <div className="h-20" /> {/* Spacer for fixed footer */}
    </div>
  );
}
