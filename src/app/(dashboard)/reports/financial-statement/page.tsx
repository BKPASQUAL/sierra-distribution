// src/app/(dashboard)/reports/financial-statement/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  startDate: string;
  endDate: string;
  profitAndLoss: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    expensesByCategory: { [key: string]: number };
    totalExpenses: number;
    netProfit: number;
  };
  balanceSheet: {
    assets: {
      totalCash: number;
      totalReceivables: number;
      totalInventory: number;
      totalAssets: number;
    };
    liabilities: {
      totalPayables: number;
      totalLoans: number;
      totalLiabilities: number;
    };
    equity: {
      totalEquity: number;
    };
  };
}

export default function FinancialStatementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  
  // Default to the first of the current month
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  // Default to today
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleFetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const response = await fetch(
        `/api/reports/financial-statement?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch report");
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch on initial load
  useEffect(() => {
    handleFetchReport();
  }, []);

  const ReportLine = ({ label, value, isNegative = false, isTotal = false, isSubtotal = false, indent = false }: 
    { label: string; value: number; isNegative?: boolean; isTotal?: boolean; isSubtotal?: boolean; indent?: boolean }) => (
    <div className={`
      flex justify-between p-3 border-b
      ${isTotal ? 'bg-muted font-bold text-lg' : ''}
      ${isSubtotal ? 'bg-muted/50 font-semibold' : ''}
      ${indent ? 'pl-8' : ''}
    `}>
      <span className="font-medium capitalize">{label}</span>
      <span className={`font-medium ${
        isNegative ? 'text-orange-600' : isTotal ? (value > 0 ? 'text-green-600' : 'text-red-600') : ''
      }`}>
        {isNegative ? '-' : ''} {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Statements</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Period for P&L</CardTitle>
          <CardDescription>
            The Profit & Loss statement shows performance over time. The Balance Sheet is a snapshot as of the End Date.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleFetchReport} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit & Loss Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                From {new Date(data.startDate).toLocaleDateString()} to {new Date(data.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <ReportLine label="Total Revenue (Sales)" value={data.profitAndLoss.totalRevenue} />
                <ReportLine label="Cost of Goods Sold (COGS)" value={data.profitAndLoss.totalCOGS} isNegative />
                <ReportLine label="Gross Profit" value={data.profitAndLoss.grossProfit} isSubtotal />
                <div className="p-3 border-b">
                  <span className="font-medium text-muted-foreground">Operating Expenses:</span>
                </div>
                {Object.entries(data.profitAndLoss.expensesByCategory).map(([category, amount]) => (
                  <ReportLine key={category} label={category} value={amount} isNegative indent />
                ))}
                <ReportLine label="Total Operating Expenses" value={data.profitAndLoss.totalExpenses} isNegative isSubtotal />
                <ReportLine label="Net Profit" value={data.profitAndLoss.netProfit} isTotal />
              </div>
            </CardContent>
          </Card>

          {/* Balance Sheet Card */}
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                Snapshot as of {new Date(data.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted/50">
                  <span className="font-semibold">ASSETS</span>
                </div>
                <ReportLine label="Cash & Bank" value={data.balanceSheet.assets.totalCash} indent />
                <ReportLine label="Accounts Receivable" value={data.balanceSheet.assets.totalReceivables} indent />
                <ReportLine label="Inventory" value={data.balanceSheet.assets.totalInventory} indent />
                <ReportLine label="Total Assets" value={data.balanceSheet.assets.totalAssets} isSubtotal />
                
                <div className="p-3 border-b bg-muted/50">
                  <span className="font-semibold">LIABILITIES & EQUITY</span>
                </div>
                <ReportLine label="Accounts Payable (Suppliers)" value={data.balanceSheet.liabilities.totalPayables} isNegative indent />
                <ReportLine label="Loans & Overdrafts" value={data.balanceSheet.liabilities.totalLoans} isNegative indent />
                <ReportLine label="Total Liabilities" value={data.balanceSheet.liabilities.totalLiabilities} isNegative isSubtotal />
                
                <ReportLine label="Owner's Equity" value={data.balanceSheet.equity.totalEquity} indent />
                <ReportLine 
                  label="Total Liabilities & Equity" 
                  value={data.balanceSheet.liabilities.totalLiabilities + data.balanceSheet.equity.totalEquity} 
                  isSubtotal 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Total Assets should equal Total Liabilities & Equity.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}