// src/app/(dashboard)/cheques/report/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  Loader2,
  FileText,
  ArrowLeft,
  Search,
  Calendar,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChequePayment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: "pending" | "deposited" | "passed" | "returned" | null;
  reference_number: string | null;
  customers?: { name: string };
  banks?: { bank_code: string; bank_name: string };
}

interface ChequeRow {
  cheque_number: string;
  cheque_date: string | null;
  bank_code: string;
  branch_code: string;
  total_amount: number;
  status: ChequePayment["cheque_status"];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupCheques(payments: ChequePayment[]): ChequeRow[] {
  const map = new Map<string, ChequeRow>();
  for (const p of payments) {
    const key = p.cheque_number ?? `NO-CHEQUE-${p.id}`;
    if (map.has(key)) {
      map.get(key)!.total_amount += p.amount;
    } else {
      map.set(key, {
        cheque_number: key,
        cheque_date:   p.cheque_date,
        bank_code:     p.banks?.bank_code ?? "—",
        branch_code:   p.reference_number ?? "—",
        total_amount:  p.amount,
        status:        p.cheque_status,
      });
    }
  }
  return Array.from(map.values());
}

function exportToExcel(rows: ChequeRow[], filename = "cheque_report.csv") {
  const headers = ["Cheque No", "Cheque Date", "Bank Code", "Branch Code", "Amount (LKR)"];
  const excelText = (v: string) => `="${v.replace(/"/g, '""')}"`;
  const escape    = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        excelText(r.cheque_number),
        escape(r.cheque_date ? new Date(r.cheque_date).toLocaleDateString() : ""),
        escape(r.bank_code),
        escape(r.branch_code),
        r.total_amount.toFixed(2),
      ].join(",")
    ),
    ["TOTAL", "", "", "", rows.reduce((s, r) => s + r.total_amount, 0).toFixed(2)].join(","),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChequeReportPage() {
  const [payments, setPayments] = useState<ChequePayment[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filters — default to "pending"
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");

  // Row selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/payments?payment_method=cheque");
        const data = await res.json();
        if (res.ok) setPayments(data.payments ?? []);
        else        toast.error("Failed to load cheque data");
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Group & filter & sort ─────────────────────────────────────────────────

  const grouped = useMemo(() => groupCheques(payments), [payments]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return grouped
      .filter((r) => {
        const matchSearch =
          !term ||
          r.cheque_number.toLowerCase().includes(term) ||
          r.bank_code.toLowerCase().includes(term) ||
          r.branch_code.toLowerCase().includes(term);
        const matchStatus = statusFilter === "all" || r.status === statusFilter;
        const cd          = r.cheque_date ? new Date(r.cheque_date) : null;
        const matchFrom   = !fromDate || (cd && cd >= new Date(fromDate));
        const matchTo     = !toDate   || (cd && cd <= new Date(toDate));
        return matchSearch && matchStatus && matchFrom && matchTo;
      })
      .sort((a, b) => {
        const da = a.cheque_date ? new Date(a.cheque_date).getTime() : 0;
        const db = b.cheque_date ? new Date(b.cheque_date).getTime() : 0;
        return da - db;
      });
  }, [grouped, search, statusFilter, fromDate, toDate]);

  // Reset selection when filter changes
  useEffect(() => { setSelected(new Set()); }, [filtered]);

  // ── Selection helpers ─────────────────────────────────────────────────────

  const allSelected  = filtered.length > 0 && filtered.every((r) => selected.has(r.cheque_number));
  const someSelected = filtered.some((r) => selected.has(r.cheque_number));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.cheque_number)));
    }
  };

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Selected rows for export / print
  const reportRows = filtered.filter((r) => selected.has(r.cheque_number));
  const grandTotal  = reportRows.reduce((s, r) => s + r.total_amount, 0);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cheque-print-area, #cheque-print-area * { visibility: visible !important; }
          #cheque-print-area { position: fixed !important; top: 0; left: 0; width: 100%; padding: 24px; background: white; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f3f4f6 !important; font-weight: 600; }
          tfoot tr { background: #eef2ff !important; font-weight: 700; }
          .print-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          .print-meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        }
      `}</style>

      <div className="space-y-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Link href="/cheques">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cheque Report</h1>
              <p className="text-sm text-muted-foreground">
                Select cheques below, then export or print
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportToExcel(reportRows, `cheque_report_${new Date().toISOString().split("T")[0]}.csv`)
              }
              disabled={reportRows.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel {reportRows.length > 0 && `(${reportRows.length})`}
            </Button>
            <Button
              onClick={() => window.print()}
              disabled={reportRows.length === 0}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print / PDF {reportRows.length > 0 && `(${reportRows.length})`}
            </Button>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <Card className="no-print">
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label className="text-xs">Search</Label>
                <Input
                  placeholder="Cheque no, bank, branch…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deposited">Deposited</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> From Date
                </Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> To Date
                </Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SELECTION INFO BAR ── */}
        {someSelected && (
          <div className="no-print flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
            <span className="text-sm font-medium">
              {reportRows.length} cheque{reportRows.length !== 1 ? "s" : ""} selected
              &nbsp;·&nbsp;
              Total: <span className="text-primary font-bold">{formatCurrency(grandTotal)}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        )}

        {/* ── PRINT AREA ── */}
        <div id="cheque-print-area">

          {/* Print header */}
          <div className="hidden print:block mb-4">
            <p className="print-title">Cheque Payment Report</p>
            <p className="print-meta">
              Generated: {today} &nbsp;|&nbsp; {reportRows.length} cheque{reportRows.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` | Status: ${statusFilter}`}
              {fromDate && ` | From: ${fromDate}`}
              {toDate && ` | To: ${toDate}`}
            </p>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground no-print">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground no-print">
              <FileText className="h-8 w-8 opacity-40" />
              <p>No cheques match the current filters</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE CARDS (< md) ── */}
              <div className="md:hidden space-y-3">
                {/* Select-all bar */}
                <div className="flex items-center gap-3 px-1">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({filtered.length})
                  </span>
                </div>

                {filtered.map((r) => {
                  const isSelected = selected.has(r.cheque_number);
                  return (
                    <div
                      key={r.cheque_number}
                      onClick={() => toggleRow(r.cheque_number)}
                      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex items-center gap-3 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(r.cheque_number)}
                          />
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-sm truncate">
                              {r.cheque_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.cheque_date
                                ? new Date(r.cheque_date).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-primary tabular-nums shrink-0">
                          {formatCurrency(r.total_amount)}
                        </p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t pt-3">
                        <span className="text-muted-foreground">Bank Code</span>
                        <span className="font-mono font-medium text-right">{r.bank_code}</span>
                        <span className="text-muted-foreground">Branch Code</span>
                        <span className="font-mono text-right">{r.branch_code}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Mobile total */}
                {reportRows.length > 0 && (
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Selected ({reportRows.length})
                    </span>
                    <span className="text-primary font-bold tabular-nums">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* ── DESKTOP TABLE (>= md) ── */}
              <div className="hidden md:block overflow-x-auto rounded-lg border">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="bg-muted/60 border-b">
                      <th className="w-10 px-3 py-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                      <th className="w-36 px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cheque No</th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cheque Date</th>
                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Code</th>
                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch Code</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => {
                      const isSelected = selected.has(r.cheque_number);
                      return (
                        <tr
                          key={r.cheque_number}
                          onClick={() => toggleRow(r.cheque_number)}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/[0.06] hover:bg-primary/10"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(r.cheque_number)}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground text-xs tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono font-semibold">{r.cheque_number}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {r.cheque_date ? new Date(r.cheque_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-medium">{r.bank_code}</td>
                          <td className="px-3 py-2.5 font-mono">{r.branch_code}</td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                            {formatCurrency(r.total_amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {reportRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-primary/5 border-t-2 border-primary/20">
                        <td />
                        <td colSpan={5} className="px-3 py-3 text-right font-bold">
                          Selected Total ({reportRows.length} cheque{reportRows.length !== 1 ? "s" : ""})
                        </td>
                        <td className="px-3 py-3 text-right text-primary font-bold tabular-nums text-base">
                          {formatCurrency(grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
