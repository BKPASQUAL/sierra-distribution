// src/app/(dashboard)/cheques/history/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Copied Payment interface
interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  order_id: string | null;
  customer_id: string;
  amount: number;
  payment_method: string;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_status: "pending" | "deposited" | "passed" | "returned" | null;
  bank_id: string | null;
  deposit_account_id: string | null;
  customers?: { name: string };
  orders?: { order_number: string };
  banks?: { bank_code: string; bank_name: string };
  company_accounts?: { account_name: string; account_type: string };
}

export default function ChequeHistoryPage() {
  const [allChecks, setAllChecks] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // --- START OF CHANGE ---
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // --- END OF CHANGE ---

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // We fetch all cheques, and filter on the client-side
      const paymentsRes = await fetch("/api/payments?payment_method=cheque");
      const paymentsData = await paymentsRes.json();

      if (paymentsRes.ok && paymentsData.payments) {
        setAllChecks(paymentsData.payments);
      } else {
        toast.error("Failed to fetch cheques.");
      }
    } catch (error) {
      toast.error("Network error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Memoize filtering, sorting, and pagination
  const paginatedChecks = useMemo(() => {
    // 1. Search Filter
    const searched = allChecks.filter(
      (cheque) =>
        cheque.cheque_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        cheque.customers?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        cheque.orders?.order_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    // 2. Status Filter
    const filtered =
      statusFilter === "all"
        ? searched
        : searched.filter((cheque) => cheque.cheque_status === statusFilter);

    // 3. Sorting (Default: Newest Received Date first)
    const sorted = filtered.sort(
      (a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    // 4. Paginate
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    const items = sorted.slice(startIndex, endIndex);

    return { items, totalPages, totalItems, startIndex, endIndex };
  }, [allChecks, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Reset page to 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getChequeStatusBadge = (status: Payment["cheque_status"]) => {
    if (status === "passed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600">
          <CheckCircle className="w-3 h-3" />
          Passed
        </span>
      );
    }
    if (status === "returned") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600">
          <XCircle className="w-3 h-3" />
          Returned
        </span>
      );
    }
    if (status === "deposited") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600">
          <Banknote className="w-3 h-3" />
          Deposited
        </span>
      );
    }
    // Default to pending
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-600">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cheques" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Full Cheque History
            </h1>
            <p className="text-muted-foreground">
              A complete record of all cheques received.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          {/* --- START OF CHANGE --- */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by cheque no, customer, or bill no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-[400px]"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deposited">Deposited</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* --- END OF CHANGE --- */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rec'd Date</TableHead>
                <TableHead>Bill No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cheque No.</TableHead>
                <TableHead>Cheque Date</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                {/* --- START OF CHANGE --- */}
                <TableHead>Deposit Account</TableHead>
                {/* --- END OF CHANGE --- */}
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  {/* --- START OF CHANGE --- */}
                  <TableCell colSpan={9} className="text-center py-10">
                    {/* --- END OF CHANGE --- */}
                    <Loader2 className="w-6 h-6 animate-spin inline-block" />
                  </TableCell>
                </TableRow>
              ) : paginatedChecks.items.length === 0 ? (
                <TableRow>
                  {/* --- START OF CHANGE --- */}
                  <TableCell colSpan={9} className="text-center py-10">
                    {/* --- END OF CHANGE --- */}
                    No cheques found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedChecks.items.map((cheque) => (
                  <TableRow key={cheque.id}>
                    <TableCell>
                      {new Date(cheque.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {cheque.orders?.order_number || "N/A"}
                    </TableCell>
                    <TableCell>{cheque.customers?.name || "N/A"}</TableCell>
                    <TableCell>{cheque.cheque_number}</TableCell>
                    <TableCell>
                      {new Date(cheque.cheque_date!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{cheque.banks?.bank_name || "N/A"}</TableCell>
                    <TableCell>
                      {getChequeStatusBadge(cheque.cheque_status)}
                    </TableCell>
                    {/* --- START OF CHANGE --- */}
                    <TableCell>
                      {cheque.company_accounts?.account_name || "N/A"}
                    </TableCell>
                    {/* --- END OF CHANGE --- */}
                    <TableCell className="text-right font-medium">
                      LKR {cheque.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* --- PAGINATION --- */}
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min(
              paginatedChecks.startIndex + 1,
              paginatedChecks.totalItems
            )}{" "}
            to {Math.min(paginatedChecks.endIndex, paginatedChecks.totalItems)}{" "}
            of {paginatedChecks.totalItems} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={
                currentPage === paginatedChecks.totalPages ||
                paginatedChecks.totalPages === 0
              }
            >
              Next
            </Button>
          </div>
        </CardFooter>
        {/* --- END PAGINATION --- */}
      </Card>
    </div>
  );
}
