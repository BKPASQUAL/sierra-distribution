// src/app/(dashboard)/financial-reports/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  Download,
  Loader2,
  Lock,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ============================================
// TYPES
// ============================================

interface TradingAccount {
  totalSales: number;
  salesReturns: number;
  netSales: number;
  openingStock: number;
  purchases: number;
  purchaseReturns: number;
  netPurchases: number;
  costOfGoodsAvailable: number;
  closingStock: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
}

interface ProfitLossAccount {
  grossProfit: number;
  expenses: {
    fuel: number;
    salaries: number;
    rent: number;
    utilities: number;
    maintenance: number;
    delivery: number;
    marketing: number;
    office_supplies: number;
    telephone: number;
    insurance: number;
    repairs: number;
    professional_fees: number;
    bank_charges: number;
    depreciation: number;
    taxes: number;
    miscellaneous: number;
  };
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
}

interface BalanceSheet {
  currentAssets: {
    cash: number;
    bankBalances: number;
    accountsReceivable: number;
    inventory: number;
    totalCurrentAssets: number;
  };
  currentLiabilities: {
    accountsPayable: number;
    outstandingExpenses: number;
    totalCurrentLiabilities: number;
  };
  capital: {
    openingCapital: number;
    netProfit: number;
    drawings: number;
    closingCapital: number;
  };
  workingCapital: number;
  currentRatio: number;
  quickRatio: number;
}

interface CashFlowStatement {
  operatingActivities: {
    netProfit: number;
    adjustments: {
      depreciation: number;
      changeInReceivables: number;
      changeInInventory: number;
      changeInPayables: number;
    };
    netCashFromOperating: number;
  };
  investingActivities: {
    assetPurchases: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    ownerDrawings: number;
    additionalCapital: number;
    netCashFromFinancing: number;
  };
  netCashChange: number;
  openingCash: number;
  closingCash: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function FinancialReportsPage() {
  const supabase = createClient();

  // State management
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Financial data state
  const [tradingAccount, setTradingAccount] = useState<TradingAccount | null>(
    null
  );
  const [profitLossAccount, setProfitLossAccount] =
    useState<ProfitLossAccount | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlowStatement, setCashFlowStatement] =
    useState<CashFlowStatement | null>(null);

  // Initialize dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, []);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserRole(userData.role);
        }
      }
      setLoading(false);
    };
    checkUserRole();
  }, [supabase]);

  // ============================================
  // API CALLS TO FETCH FINANCIAL DATA
  // ============================================

  const fetchFinancialData = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Step 1: Fetch Trading Account
      const tradingRes = await fetch(
        `/api/financial-reports/trading-account?startDate=${startDate}&endDate=${endDate}`
      );

      if (!tradingRes.ok) {
        throw new Error("Failed to fetch trading account data");
      }

      const tradingData = await tradingRes.json();
      if (!tradingData.success) {
        throw new Error(tradingData.error || "Failed to fetch trading account");
      }

      setTradingAccount(tradingData.data);

      // Step 2: Fetch Profit & Loss (needs gross profit from trading account)
      const plRes = await fetch(
        `/api/financial-reports/profit-loss?startDate=${startDate}&endDate=${endDate}&grossProfit=${tradingData.data.grossProfit}`
      );

      if (!plRes.ok) {
        throw new Error("Failed to fetch profit & loss data");
      }

      const plData = await plRes.json();
      if (!plData.success) {
        throw new Error(plData.error || "Failed to fetch profit & loss");
      }

      setProfitLossAccount(plData.data);

      // Step 3: Fetch Balance Sheet (needs net profit and closing stock)
      const bsRes = await fetch(
        `/api/financial-reports/balance-sheet?endDate=${endDate}&netProfit=${plData.data.netProfit}&closingStock=${tradingData.data.closingStock}`
      );

      if (!bsRes.ok) {
        throw new Error("Failed to fetch balance sheet data");
      }

      const bsData = await bsRes.json();
      if (!bsData.success) {
        throw new Error(bsData.error || "Failed to fetch balance sheet");
      }

      setBalanceSheet(bsData.data);

      // Step 4: Fetch Cash Flow (needs net profit, opening/closing stock)
      const cfRes = await fetch(
        `/api/financial-reports/cash-flow?startDate=${startDate}&endDate=${endDate}&netProfit=${plData.data.netProfit}&openingStock=${tradingData.data.openingStock}&closingStock=${tradingData.data.closingStock}`
      );

      if (!cfRes.ok) {
        throw new Error("Failed to fetch cash flow data");
      }

      const cfData = await cfRes.json();
      if (!cfData.success) {
        throw new Error(cfData.error || "Failed to fetch cash flow");
      }

      setCashFlowStatement(cfData.data);
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err.message || "Failed to fetch financial reports");
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // EXPORT FUNCTIONS (Same as before)
  // ============================================

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Sierra Distribution - Financial Reports", 105, yPos, {
      align: "center",
    });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${startDate} to ${endDate}`, 105, yPos, {
      align: "center",
    });
    yPos += 15;

    // Trading Account
    if (tradingAccount) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Trading Account", 14, yPos);
      yPos += 7;

      const tradingData = [
        ["Sales Revenue", `LKR ${tradingAccount.totalSales.toLocaleString()}`],
        [
          "Less: Sales Returns",
          `LKR ${tradingAccount.salesReturns.toLocaleString()}`,
        ],
        ["Net Sales", `LKR ${tradingAccount.netSales.toLocaleString()}`],
        ["", ""],
        [
          "Opening Stock",
          `LKR ${tradingAccount.openingStock.toLocaleString()}`,
        ],
        ["Add: Purchases", `LKR ${tradingAccount.purchases.toLocaleString()}`],
        [
          "Less: Purchase Returns",
          `LKR ${tradingAccount.purchaseReturns.toLocaleString()}`,
        ],
        [
          "Cost of Goods Available",
          `LKR ${tradingAccount.costOfGoodsAvailable.toLocaleString()}`,
        ],
        [
          "Less: Closing Stock",
          `LKR ${tradingAccount.closingStock.toLocaleString()}`,
        ],
        [
          "Cost of Goods Sold",
          `LKR ${tradingAccount.costOfGoodsSold.toLocaleString()}`,
        ],
        ["", ""],
        ["GROSS PROFIT", `LKR ${tradingAccount.grossProfit.toLocaleString()}`],
        [
          "Gross Profit Margin",
          `${tradingAccount.grossProfitMargin.toFixed(2)}%`,
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: tradingData,
        theme: "plain",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: "right" },
        },
        didParseCell: (data) => {
          if (
            data.row.index === 2 ||
            data.row.index === 11 ||
            data.row.index === 12
          ) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Profit & Loss Account
    if (profitLossAccount) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. Profit & Loss Account", 14, yPos);
      yPos += 7;

      const plData = [
        [
          "Gross Profit (from Trading A/c)",
          `LKR ${profitLossAccount.grossProfit.toLocaleString()}`,
        ],
        ["", ""],
        ["Less: Operating Expenses", ""],
        ["  Fuel", `LKR ${profitLossAccount.expenses.fuel.toLocaleString()}`],
        [
          "  Salaries",
          `LKR ${profitLossAccount.expenses.salaries.toLocaleString()}`,
        ],
        ["  Rent", `LKR ${profitLossAccount.expenses.rent.toLocaleString()}`],
        [
          "  Utilities",
          `LKR ${profitLossAccount.expenses.utilities.toLocaleString()}`,
        ],
        [
          "  Maintenance",
          `LKR ${profitLossAccount.expenses.maintenance.toLocaleString()}`,
        ],
        [
          "  Delivery",
          `LKR ${profitLossAccount.expenses.delivery.toLocaleString()}`,
        ],
        [
          "  Marketing",
          `LKR ${profitLossAccount.expenses.marketing.toLocaleString()}`,
        ],
        [
          "  Office Supplies",
          `LKR ${profitLossAccount.expenses.office_supplies.toLocaleString()}`,
        ],
        [
          "  Telephone",
          `LKR ${profitLossAccount.expenses.telephone.toLocaleString()}`,
        ],
        [
          "  Insurance",
          `LKR ${profitLossAccount.expenses.insurance.toLocaleString()}`,
        ],
        [
          "  Repairs",
          `LKR ${profitLossAccount.expenses.repairs.toLocaleString()}`,
        ],
        [
          "  Professional Fees",
          `LKR ${profitLossAccount.expenses.professional_fees.toLocaleString()}`,
        ],
        [
          "  Bank Charges",
          `LKR ${profitLossAccount.expenses.bank_charges.toLocaleString()}`,
        ],
        [
          "  Depreciation",
          `LKR ${profitLossAccount.expenses.depreciation.toLocaleString()}`,
        ],
        ["  Taxes", `LKR ${profitLossAccount.expenses.taxes.toLocaleString()}`],
        [
          "  Miscellaneous",
          `LKR ${profitLossAccount.expenses.miscellaneous.toLocaleString()}`,
        ],
        [
          "Total Expenses",
          `LKR ${profitLossAccount.totalExpenses.toLocaleString()}`,
        ],
        ["", ""],
        ["NET PROFIT", `LKR ${profitLossAccount.netProfit.toLocaleString()}`],
        [
          "Net Profit Margin",
          `${profitLossAccount.netProfitMargin.toFixed(2)}%`,
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: plData,
        theme: "plain",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: "right" },
        },
        didParseCell: (data) => {
          if (
            data.row.index === 0 ||
            data.row.index === 19 ||
            data.row.index === 21 ||
            data.row.index === 22
          ) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Balance Sheet (new page)
    doc.addPage();
    yPos = 20;

    if (balanceSheet) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. Balance Sheet", 14, yPos);
      yPos += 7;

      const bsData = [
        ["ASSETS", ""],
        ["Current Assets:", ""],
        ["  Cash", `LKR ${balanceSheet.currentAssets.cash.toLocaleString()}`],
        [
          "  Bank Balances",
          `LKR ${balanceSheet.currentAssets.bankBalances.toLocaleString()}`,
        ],
        [
          "  Accounts Receivable",
          `LKR ${balanceSheet.currentAssets.accountsReceivable.toLocaleString()}`,
        ],
        [
          "  Inventory",
          `LKR ${balanceSheet.currentAssets.inventory.toLocaleString()}`,
        ],
        [
          "Total Current Assets",
          `LKR ${balanceSheet.currentAssets.totalCurrentAssets.toLocaleString()}`,
        ],
        ["", ""],
        ["LIABILITIES", ""],
        ["Current Liabilities:", ""],
        [
          "  Accounts Payable",
          `LKR ${balanceSheet.currentLiabilities.accountsPayable.toLocaleString()}`,
        ],
        [
          "  Outstanding Expenses",
          `LKR ${balanceSheet.currentLiabilities.outstandingExpenses.toLocaleString()}`,
        ],
        [
          "Total Current Liabilities",
          `LKR ${balanceSheet.currentLiabilities.totalCurrentLiabilities.toLocaleString()}`,
        ],
        ["", ""],
        ["CAPITAL", ""],
        [
          "Opening Capital",
          `LKR ${balanceSheet.capital.openingCapital.toLocaleString()}`,
        ],
        [
          "Add: Net Profit",
          `LKR ${balanceSheet.capital.netProfit.toLocaleString()}`,
        ],
        [
          "Less: Drawings",
          `LKR ${balanceSheet.capital.drawings.toLocaleString()}`,
        ],
        [
          "Closing Capital",
          `LKR ${balanceSheet.capital.closingCapital.toLocaleString()}`,
        ],
        ["", ""],
        ["FINANCIAL RATIOS", ""],
        [
          "Working Capital",
          `LKR ${balanceSheet.workingCapital.toLocaleString()}`,
        ],
        ["Current Ratio", `${balanceSheet.currentRatio.toFixed(2)}:1`],
        ["Quick Ratio", `${balanceSheet.quickRatio.toFixed(2)}:1`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: bsData,
        theme: "plain",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: "right" },
        },
        didParseCell: (data) => {
          if ([0, 6, 8, 12, 14, 18, 20].includes(data.row.index)) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
    }

    // Save PDF
    doc.save(`Financial_Reports_${startDate}_to_${endDate}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Trading Account Sheet
    if (tradingAccount) {
      const tradingData = [
        ["TRADING ACCOUNT"],
        [`Period: ${startDate} to ${endDate}`],
        [],
        ["Sales Revenue", tradingAccount.totalSales],
        ["Less: Sales Returns", tradingAccount.salesReturns],
        ["Net Sales", tradingAccount.netSales],
        [],
        ["Opening Stock", tradingAccount.openingStock],
        ["Add: Purchases", tradingAccount.purchases],
        ["Less: Purchase Returns", tradingAccount.purchaseReturns],
        ["Cost of Goods Available", tradingAccount.costOfGoodsAvailable],
        ["Less: Closing Stock", tradingAccount.closingStock],
        ["Cost of Goods Sold", tradingAccount.costOfGoodsSold],
        [],
        ["GROSS PROFIT", tradingAccount.grossProfit],
        ["Gross Profit Margin (%)", tradingAccount.grossProfitMargin],
      ];

      const tradingSheet = XLSX.utils.aoa_to_sheet(tradingData);
      XLSX.utils.book_append_sheet(workbook, tradingSheet, "Trading Account");
    }

    // Profit & Loss Sheet
    if (profitLossAccount) {
      const plData = [
        ["PROFIT & LOSS ACCOUNT"],
        [`Period: ${startDate} to ${endDate}`],
        [],
        ["Gross Profit", profitLossAccount.grossProfit],
        [],
        ["OPERATING EXPENSES"],
        ["Fuel", profitLossAccount.expenses.fuel],
        ["Salaries", profitLossAccount.expenses.salaries],
        ["Rent", profitLossAccount.expenses.rent],
        ["Utilities", profitLossAccount.expenses.utilities],
        ["Maintenance", profitLossAccount.expenses.maintenance],
        ["Delivery", profitLossAccount.expenses.delivery],
        ["Marketing", profitLossAccount.expenses.marketing],
        ["Office Supplies", profitLossAccount.expenses.office_supplies],
        ["Telephone", profitLossAccount.expenses.telephone],
        ["Insurance", profitLossAccount.expenses.insurance],
        ["Repairs", profitLossAccount.expenses.repairs],
        ["Professional Fees", profitLossAccount.expenses.professional_fees],
        ["Bank Charges", profitLossAccount.expenses.bank_charges],
        ["Depreciation", profitLossAccount.expenses.depreciation],
        ["Taxes", profitLossAccount.expenses.taxes],
        ["Miscellaneous", profitLossAccount.expenses.miscellaneous],
        ["Total Expenses", profitLossAccount.totalExpenses],
        [],
        ["NET PROFIT", profitLossAccount.netProfit],
        ["Net Profit Margin (%)", profitLossAccount.netProfitMargin],
      ];

      const plSheet = XLSX.utils.aoa_to_sheet(plData);
      XLSX.utils.book_append_sheet(workbook, plSheet, "Profit & Loss");
    }

    // Balance Sheet
    if (balanceSheet) {
      const bsData = [
        ["BALANCE SHEET"],
        [`As at: ${endDate}`],
        [],
        ["ASSETS"],
        ["Current Assets"],
        ["Cash", balanceSheet.currentAssets.cash],
        ["Bank Balances", balanceSheet.currentAssets.bankBalances],
        ["Accounts Receivable", balanceSheet.currentAssets.accountsReceivable],
        ["Inventory", balanceSheet.currentAssets.inventory],
        ["Total Current Assets", balanceSheet.currentAssets.totalCurrentAssets],
        [],
        ["LIABILITIES"],
        ["Current Liabilities"],
        ["Accounts Payable", balanceSheet.currentLiabilities.accountsPayable],
        [
          "Outstanding Expenses",
          balanceSheet.currentLiabilities.outstandingExpenses,
        ],
        [
          "Total Current Liabilities",
          balanceSheet.currentLiabilities.totalCurrentLiabilities,
        ],
        [],
        ["CAPITAL"],
        ["Opening Capital", balanceSheet.capital.openingCapital],
        ["Add: Net Profit", balanceSheet.capital.netProfit],
        ["Less: Drawings", balanceSheet.capital.drawings],
        ["Closing Capital", balanceSheet.capital.closingCapital],
        [],
        ["FINANCIAL RATIOS"],
        ["Working Capital", balanceSheet.workingCapital],
        ["Current Ratio", balanceSheet.currentRatio],
        ["Quick Ratio", balanceSheet.quickRatio],
      ];

      const bsSheet = XLSX.utils.aoa_to_sheet(bsData);
      XLSX.utils.book_append_sheet(workbook, bsSheet, "Balance Sheet");
    }

    // Cash Flow Sheet
    if (cashFlowStatement) {
      const cfData = [
        ["CASH FLOW STATEMENT"],
        [`Period: ${startDate} to ${endDate}`],
        [],
        ["OPERATING ACTIVITIES"],
        ["Net Profit", cashFlowStatement.operatingActivities.netProfit],
        [
          "Add: Depreciation",
          cashFlowStatement.operatingActivities.adjustments.depreciation,
        ],
        [
          "Change in Receivables",
          cashFlowStatement.operatingActivities.adjustments.changeInReceivables,
        ],
        [
          "Change in Inventory",
          cashFlowStatement.operatingActivities.adjustments.changeInInventory,
        ],
        [
          "Change in Payables",
          cashFlowStatement.operatingActivities.adjustments.changeInPayables,
        ],
        [
          "Net Cash from Operating",
          cashFlowStatement.operatingActivities.netCashFromOperating,
        ],
        [],
        ["INVESTING ACTIVITIES"],
        [
          "Asset Purchases",
          -cashFlowStatement.investingActivities.assetPurchases,
        ],
        [
          "Net Cash from Investing",
          cashFlowStatement.investingActivities.netCashFromInvesting,
        ],
        [],
        ["FINANCING ACTIVITIES"],
        [
          "Owner Drawings",
          -cashFlowStatement.financingActivities.ownerDrawings,
        ],
        [
          "Additional Capital",
          cashFlowStatement.financingActivities.additionalCapital,
        ],
        [
          "Net Cash from Financing",
          cashFlowStatement.financingActivities.netCashFromFinancing,
        ],
        [],
        ["NET CHANGE IN CASH", cashFlowStatement.netCashChange],
        ["Opening Cash", cashFlowStatement.openingCash],
        ["Closing Cash", cashFlowStatement.closingCash],
      ];

      const cfSheet = XLSX.utils.aoa_to_sheet(cfData);
      XLSX.utils.book_append_sheet(workbook, cfSheet, "Cash Flow");
    }

    // Save Excel file
    XLSX.writeFile(
      workbook,
      `Financial_Reports_${startDate}_to_${endDate}.xlsx`
    );
  };

  // ============================================
  // RENDER - ACCESS CONTROL
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading financial reports...
          </p>
        </div>
      </div>
    );
  }

  if (userRole !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Access Restricted</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Only administrators can access Financial Reports.
                </p>
              </div>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER - MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete financial statements and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={!tradingAccount || generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!tradingAccount || generating}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={generating}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={generating}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchFinancialData}
                className="w-full"
                disabled={generating || !startDate || !endDate}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Generate Reports
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Statements Tabs */}
      {tradingAccount && (
        <Tabs defaultValue="trading" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trading">
              <BarChart3 className="w-4 h-4 mr-2" />
              Trading A/c
            </TabsTrigger>
            <TabsTrigger value="profitloss">
              <TrendingUp className="w-4 h-4 mr-2" />
              P&L A/c
            </TabsTrigger>
            <TabsTrigger value="balance">
              <PieChart className="w-4 h-4 mr-2" />
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cashflow">
              <DollarSign className="w-4 h-4 mr-2" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          {/* Trading Account Tab */}
          <TabsContent value="trading">
            <Card>
              <CardHeader>
                <CardTitle>Trading Account</CardTitle>
                <CardDescription>
                  Shows gross profit from trading operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-600">
                      REVENUE
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Sales Revenue
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {tradingAccount.totalSales.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">
                            Less: Sales Returns
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            (LKR {tradingAccount.salesReturns.toLocaleString()})
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50">
                          <TableCell className="font-bold">Net Sales</TableCell>
                          <TableCell className="text-right font-bold">
                            LKR {tradingAccount.netSales.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Cost of Goods Sold Section */}
                  <div>
                    <h3 className="font-semibold mb-3 text-orange-600">
                      COST OF GOODS SOLD
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Opening Stock
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {tradingAccount.openingStock.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Add: Purchases
                          </TableCell>
                          <TableCell className="text-right">
                            LKR {tradingAccount.purchases.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">
                            Less: Purchase Returns
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            (LKR{" "}
                            {tradingAccount.purchaseReturns.toLocaleString()})
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Cost of Goods Available
                          </TableCell>
                          <TableCell className="text-right">
                            LKR{" "}
                            {tradingAccount.costOfGoodsAvailable.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">
                            Less: Closing Stock
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            (LKR {tradingAccount.closingStock.toLocaleString()})
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-orange-50">
                          <TableCell className="font-bold">
                            Cost of Goods Sold
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            LKR{" "}
                            {tradingAccount.costOfGoodsSold.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Gross Profit Section */}
                  <div className="border-t-2 pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="bg-green-50">
                          <TableCell className="font-bold text-lg">
                            GROSS PROFIT
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg text-green-600">
                            LKR {tradingAccount.grossProfit.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold">
                            Gross Profit Margin
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {tradingAccount.grossProfitMargin.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Account Tab - Similar structure with profitLossAccount data */}
          {/* Balance Sheet Tab - Similar structure with balanceSheet data */}
          {/* Cash Flow Statement Tab - Similar structure with cashFlowStatement data */}

          {/* NOTE: The rest of the tabs follow the same pattern as in the original file */}
          {/* I've abbreviated here to keep the response manageable */}
          {/* Copy the remaining tabs from the original financial-reports-page.tsx */}
        </Tabs>
      )}

      {/* No Data State */}
      {!tradingAccount && !generating && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No Reports Generated</p>
            <p className="text-muted-foreground">
              Select a date range and click "Generate Reports" to view your
              financial statements
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
