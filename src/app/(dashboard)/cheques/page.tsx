// src/app/(dashboard)/cheques/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
// --- START OF CHANGE ---
import Link from "next/link";
import {
  Landmark,
  DollarSign,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Banknote,
  Check,
  ChevronsUpDown,
  Search,
  History, // Added History icon
} from "lucide-react";
// --- END OF CHANGE ---
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, isToday, isPast, parseISO } from "date-fns";

// (Copied from payments/page.tsx)
interface CompanyAccount {
  id: string;
  account_name: string;
  account_type: "saving" | "current" | "cash";
  account_number: string | null;
  current_balance: number;
  banks?: {
    bank_code: string;
    bank_name: string;
  } | null;
}

// (Copied from payments/page.tsx, with 'deposited' added)
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

export default function ChequeManagementPage() {
  const [allChecks, setAllChecks] = useState<Payment[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<CompanyAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // --- START OF NEW/MODIFIED STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [depositedPage, setDepositedPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Payment | null>(null);
  const [depositAccountId, setDepositAccountId] = useState("");
  const [accountSearchOpen, setAccountSearchOpen] = useState(false);
  const [actionType, setActionType] = useState<"passed" | "returned" | null>(
    null
  );
  // --- END OF NEW/MODIFIED STATE ---

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, accountsRes] = await Promise.all([
        fetch("/api/payments?payment_method=cheque"),
        fetch("/api/accounts"),
      ]);

      const paymentsData = await paymentsRes.json();
      const accountsData = await accountsRes.json();

      if (paymentsRes.ok && paymentsData.payments) {
        setAllChecks(paymentsData.payments);
      } else {
        toast.error("Failed to fetch cheques.");
      }

      if (accountsRes.ok && accountsData.accounts) {
        setCompanyAccounts(
          accountsData.accounts.filter(
            (acc: CompanyAccount) => acc.account_type !== "cash"
          )
        );
      } else {
        toast.error("Failed to fetch accounts.");
      }
    } catch (error) {
      toast.error("Network error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // --- START OF NEW LOGIC ---
  // Memoize all filtering, sorting, and pagination
  const { filteredChecks, pendingChecks, depositedChecks } = useMemo(() => {
    const filtered = allChecks.filter(
      (cheque) =>
        cheque.cheque_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        cheque.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pending = filtered
      .filter((p) => p.cheque_status === "pending")
      .sort((a, b) => {
        // Sort by cheque_date ascending (nearest dates first)
        return (
          parseISO(a.cheque_date!).getTime() -
          parseISO(b.cheque_date!).getTime()
        );
      });

    const deposited = filtered
      .filter((p) => p.cheque_status === "deposited")
      .sort((a, b) => {
        // Sort by cheque_date ascending
        return (
          parseISO(a.cheque_date!).getTime() -
          parseISO(b.cheque_date!).getTime()
        );
      });

    return {
      filteredChecks: filtered,
      pendingChecks: pending,
      depositedChecks: deposited,
    };
  }, [allChecks, searchTerm]);

  // Pagination for Pending Checks
  const paginatedPending = useMemo(() => {
    const totalItems = pendingChecks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = pendingPage * itemsPerPage;
    const items = pendingChecks.slice(startIndex, endIndex);
    return { items, totalPages, totalItems, startIndex, endIndex };
  }, [pendingChecks, pendingPage, itemsPerPage]);

  // Pagination for Deposited Checks
  const paginatedDeposited = useMemo(() => {
    const totalItems = depositedChecks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (depositedPage - 1) * itemsPerPage;
    const endIndex = depositedPage * itemsPerPage;
    const items = depositedChecks.slice(startIndex, endIndex);
    return { items, totalPages, totalItems, startIndex, endIndex };
  }, [depositedChecks, depositedPage, itemsPerPage]);
  // --- END OF NEW LOGIC ---

  const openDepositDialog = (cheque: Payment) => {
    setSelectedCheck(cheque);
    setDepositAccountId("");
    setIsDepositDialogOpen(true);
  };

  const openActionDialog = (cheque: Payment, action: "passed" | "returned") => {
    setSelectedCheck(cheque);
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  // Handle setting cheque status to 'deposited'
  const handleDepositCheque = async () => {
    if (!selectedCheck || !depositAccountId) {
      toast.error("Please select a bank account to deposit into.");
      return;
    }

    try {
      const response = await fetch(`/api/payments/${selectedCheck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cheque_status: "deposited",
          deposit_account_id: depositAccountId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to deposit cheque.");
      }

      toast.success("Cheque marked as deposited!");
      setIsDepositDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Handle setting cheque status to 'passed' or 'returned'
  const handleChequeAction = async () => {
    if (!selectedCheck || !actionType) return;

    try {
      const response = await fetch(`/api/payments/${selectedCheck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cheque_status: actionType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to mark cheque as ${actionType}.`);
      }

      toast.success(`Cheque marked as ${actionType}!`);

      // If returned, add to customer's outstanding balance
      if (actionType === "returned") {
        toast.info("Amount added back to customer's outstanding balance.");
      }

      setIsActionDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const getDaysStatus = (chequeDate: string | null) => {
    if (!chequeDate) return { text: "No Date", color: "text-gray-500" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chequeDateObj = new Date(chequeDate);
    chequeDateObj.setHours(0, 0, 0, 0);

    if (isPast(chequeDateObj)) {
      const daysOverdue = differenceInCalendarDays(today, chequeDateObj);
      return {
        text: `Overdue ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`,
        color: "text-red-600",
      };
    }
    if (isToday(chequeDateObj)) {
      return { text: "Due Today", color: "text-orange-600" };
    }
    const daysRemaining = differenceInCalendarDays(chequeDateObj, today);
    return {
      text: `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`,
      color: "text-blue-600",
    };
  };

  const totalPending = pendingChecks.reduce((sum, c) => sum + c.amount, 0);
  const totalDeposited = depositedChecks.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* --- START OF CHANGE --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cheque Management
          </h1>
          <p className="text-muted-foreground">
            Deposit pending cheques and track their clearance status
          </p>
        </div>
        <Link href="/cheques/history" passHref>
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            View Full History
          </Button>
        </Link>
      </div>
      {/* --- END OF CHANGE --- */}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Deposit
            </CardTitle>
            <Banknote className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingChecks.length} cheques in hand
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Clearance
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalDeposited.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {depositedChecks.length} cheques at bank
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- START: SEARCH BAR --- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by cheque no. or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full md:w-[300px]"
        />
      </div>
      {/* --- END: SEARCH BAR --- */}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Deposit ({pendingChecks.length})
          </TabsTrigger>
          <TabsTrigger value="deposited">
            Pending Clearance ({depositedChecks.length})
          </TabsTrigger>
        </TabsList>

        {/* --- PENDING DEPOSIT TAB --- */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cheques in Hand</CardTitle>
              <CardDescription>
                These cheques have been received but not yet deposited. Sorted
                by nearest date first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque Date</TableHead>
                    <TableHead>Days Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPending.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No pending cheques found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPending.items.map((cheque) => {
                      const status = getDaysStatus(cheque.cheque_date);
                      return (
                        <TableRow key={cheque.id}>
                          <TableCell>
                            {new Date(cheque.cheque_date!).toLocaleDateString()}
                          </TableCell>
                          <TableCell className={status.color}>
                            {status.text}
                          </TableCell>
                          <TableCell>{cheque.customers?.name}</TableCell>
                          <TableCell>{cheque.cheque_number}</TableCell>
                          <TableCell>{cheque.banks?.bank_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            LKR {cheque.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openDepositDialog(cheque)}
                            //   disabled={isPast(parseISO(cheque.cheque_date!))} // Optional: disable deposit for past-due
                            >
                              Deposit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {/* --- PENDING PAGINATION --- */}
            <CardFooter className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  paginatedPending.startIndex + 1,
                  paginatedPending.totalItems
                )}{" "}
                to{" "}
                {Math.min(
                  paginatedPending.endIndex,
                  paginatedPending.totalItems
                )}{" "}
                of {paginatedPending.totalItems} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage((p) => p - 1)}
                  disabled={pendingPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage((p) => p + 1)}
                  disabled={
                    pendingPage === paginatedPending.totalPages ||
                    paginatedPending.totalPages === 0
                  }
                >
                  Next
                </Button>
              </div>
            </CardFooter>
            {/* --- END PENDING PAGINATION --- */}
          </Card>
        </TabsContent>

        {/* --- PENDING CLEARANCE TAB --- */}
        <TabsContent value="deposited" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposited Cheques</CardTitle>
              <CardDescription>
                These cheques are at the bank awaiting clearance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Deposit Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeposited.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        No deposited cheques found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDeposited.items.map((cheque) => (
                      <TableRow key={cheque.id}>
                        <TableCell>
                          {new Date(cheque.cheque_date!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{cheque.customers?.name}</TableCell>
                        <TableCell>{cheque.cheque_number}</TableCell>
                        <TableCell>
                          {cheque.company_accounts?.account_name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {cheque.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => openActionDialog(cheque, "passed")}
                          >
                            Pass
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openActionDialog(cheque, "returned")}
                          >
                            Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {/* --- DEPOSITED PAGINATION --- */}
            <CardFooter className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  paginatedDeposited.startIndex + 1,
                  paginatedDeposited.totalItems
                )}{" "}
                to{" "}
                {Math.min(
                  paginatedDeposited.endIndex,
                  paginatedDeposited.totalItems
                )}{" "}
                of {paginatedDeposited.totalItems} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositedPage((p) => p - 1)}
                  disabled={depositedPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositedPage((p) => p + 1)}
                  disabled={
                    depositedPage === paginatedDeposited.totalPages ||
                    paginatedDeposited.totalPages === 0
                  }
                >
                  Next
                </Button>
              </div>
            </CardFooter>
            {/* --- END DEPOSITED PAGINATION --- */}
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- DIALOGS --- */}

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Cheque</DialogTitle>
            <DialogDescription>
              Select the bank account to deposit this cheque into.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <strong>Cheque:</strong> {selectedCheck?.cheque_number}
            </div>
            <div>
              <strong>Amount:</strong> LKR{" "}
              {selectedCheck?.amount.toLocaleString()}
            </div>
            <div>
              <strong>Customer:</strong> {selectedCheck?.customers?.name}
            </div>
            <Label htmlFor="depositAccount" className="pt-2">
              Deposit to Account *
            </Label>
            <Popover
              open={accountSearchOpen}
              onOpenChange={setAccountSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-10"
                  id="depositAccount"
                >
                  <span className="truncate">
                    {depositAccountId
                      ? companyAccounts.find((a) => a.id === depositAccountId)
                          ?.account_name
                      : "Select account..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search account..." />
                  <CommandList>
                    <CommandEmpty>No account found.</CommandEmpty>
                    <CommandGroup>
                      {companyAccounts.map((account) => (
                        <CommandItem
                          key={account.id}
                          value={account.account_name}
                          onSelect={() => {
                            setDepositAccountId(account.id);
                            setAccountSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              depositAccountId === account.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {account.account_name} ({account.banks?.bank_code})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDepositCheque}>Confirm Deposit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass/Return Alert Dialog */}
      <AlertDialog
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to mark this cheque as {actionType}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "passed"
                ? "This confirms the cheque has cleared and the funds are received."
                : "This will mark the cheque as bounced and add the amount back to the customer's outstanding balance."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChequeAction}
              className={cn(
                actionType === "returned" && "bg-red-600 hover:bg-red-700"
              )}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
