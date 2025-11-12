// src/app/(dashboard)/cash-flow/page.tsx
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
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Loader2,
  Star,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  is_primary: boolean;
  is_active: boolean;
  unreconciled_transactions: number;
  banks: {
    bank_name: string;
    bank_code: string;
  };
}

interface CashFlowData {
  month: string;
  cash_inflow: number;
  cash_outflow: number;
  net_cash_flow: number;
}

export default function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);

  // Account form state
  const [accountData, setAccountData] = useState({
    account_name: "",
    account_number: "",
    bank_id: "",
    account_type: "current" as const,
    branch: "",
    opening_balance: "",
    is_primary: false,
    notes: "",
  });

  useEffect(() => {
    fetchData();
    fetchBanks();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bank accounts
      const accountsResponse = await fetch("/api/bank-accounts");
      const accountsData = await accountsResponse.json();

      if (accountsResponse.ok) {
        setAccounts(accountsData.accounts || []);
      }

      // Fetch cash flow summary (from view)
      const cashFlowResponse = await fetch("/api/cash-flow/summary");
      if (cashFlowResponse.ok) {
        const flowData = await cashFlowResponse.json();
        setCashFlowData(flowData.cash_flow || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load cash flow data");
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

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountData.account_name || !accountData.account_number || !accountData.bank_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountData,
          opening_balance: parseFloat(accountData.opening_balance) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Bank account added successfully!");
        setIsAccountDialogOpen(false);
        resetAccountForm();
        fetchData();
      } else {
        toast.error(data.error || "Failed to add bank account");
      }
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Error adding bank account");
    }
  };

  const resetAccountForm = () => {
    setAccountData({
      account_name: "",
      account_number: "",
      bank_id: "",
      account_type: "current",
      branch: "",
      opening_balance: "",
      is_primary: false,
      notes: "",
    });
  };

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const totalUnreconciled = accounts.reduce(
    (sum, acc) => sum + (acc.unreconciled_transactions || 0),
    0
  );

  // Calculate net cash flow for current month
  const currentMonthFlow = cashFlowData.length > 0 ? cashFlowData[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading cash flow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Flow Management</h1>
          <p className="text-muted-foreground mt-1">
            Track bank accounts and manage cash flow
          </p>
        </div>
        <Button onClick={() => setIsAccountDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.filter((a) => a.is_active).length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Inflow</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              LKR {(currentMonthFlow?.cash_inflow || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Outflow</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              LKR {(currentMonthFlow?.cash_outflow || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (currentMonthFlow?.net_cash_flow || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              LKR {(currentMonthFlow?.net_cash_flow || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">
            <Building2 className="w-4 h-4 mr-2" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                Manage all business bank accounts and cash
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Unreconciled</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No Bank Accounts</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first bank account to start tracking cash flow
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setIsAccountDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {account.is_primary && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                            <span className="font-medium">
                              {account.account_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.account_number}
                        </TableCell>
                        <TableCell>{account.banks.bank_name}</TableCell>
                        <TableCell className="capitalize">
                          {account.account_type}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          LKR {account.current_balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {account.unreconciled_transactions > 0 ? (
                            <Badge variant="outline" className="bg-yellow-50">
                              {account.unreconciled_transactions}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              account.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {accounts.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>Total Balance</TableCell>
                      <TableCell className="text-right">
                        LKR {totalBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {totalUnreconciled > 0 && (
                          <Badge variant="outline">{totalUnreconciled}</Badge>
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
              <CardDescription>
                Monthly cash inflow and outflow for the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    No cash flow data available yet
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={[...cashFlowData].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "2-digit",
                        });
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) =>
                        `LKR ${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cash_inflow"
                      stroke="#22c55e"
                      name="Cash Inflow"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="cash_outflow"
                      stroke="#ef4444"
                      name="Cash Outflow"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="net_cash_flow"
                      stroke="#3b82f6"
                      name="Net Cash Flow"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Net Cash Flow by Month</CardTitle>
              <CardDescription>
                Positive = surplus, Negative = deficit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    No cash flow data available yet
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...cashFlowData].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                        });
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) =>
                        `LKR ${value.toLocaleString()}`
                      }
                    />
                    <Bar
                      dataKey="net_cash_flow"
                      fill="#3b82f6"
                      name="Net Cash Flow"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Cash Inflow</TableHead>
                    <TableHead className="text-right">Cash Outflow</TableHead>
                    <TableHead className="text-right">Net Cash Flow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No cash flow data available
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashFlowData.map((flow) => (
                      <TableRow key={flow.month}>
                        <TableCell className="font-medium">
                          {new Date(flow.month).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          LKR {flow.cash_inflow.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          LKR {flow.cash_outflow.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            flow.net_cash_flow >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          LKR {flow.net_cash_flow.toLocaleString()}
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

      {/* Add Bank Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a new bank account to track cash flow
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAccount}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">
                    Account Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="account_name"
                    placeholder="e.g., Main Operating Account"
                    value={accountData.account_name}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        account_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">
                    Account Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="account_number"
                    placeholder="1234567890"
                    value={accountData.account_number}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        account_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_id">
                    Bank <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={accountData.bank_id}
                    onValueChange={(value) =>
                      setAccountData({ ...accountData, bank_id: value })
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

                <div className="space-y-2">
                  <Label htmlFor="account_type">
                    Account Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={accountData.account_type}
                    onValueChange={(value: any) =>
                      setAccountData({ ...accountData, account_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    placeholder="Branch name"
                    value={accountData.branch}
                    onChange={(e) =>
                      setAccountData({ ...accountData, branch: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opening_balance">Opening Balance (LKR)</Label>
                  <Input
                    id="opening_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={accountData.opening_balance}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        opening_balance: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={accountData.notes}
                  onChange={(e) =>
                    setAccountData({ ...accountData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={accountData.is_primary}
                  onChange={(e) =>
                    setAccountData({
                      ...accountData,
                      is_primary: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_primary" className="font-normal">
                  Set as primary account
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAccountDialogOpen(false);
                  resetAccountForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}