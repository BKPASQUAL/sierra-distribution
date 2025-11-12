"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ProfitAndLoss {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export default function FinalAccountsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitAndLoss | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleFetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const response = await fetch(
        `/api/reports/final-accounts?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch report");
      const result = await response.json();
      setData(result.profitAndLoss);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch on load
  useEffect(() => {
    handleFetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Final Accounts</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
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
          <Button onClick={handleFetchReport} disabled={loading} className="self-end">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-3 border rounded-md">
              <span className="font-medium">Total Revenue (Sales)</span>
              <span className="font-medium text-blue-600">
                LKR {data.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between p-3 border rounded-md">
              <span className="font-medium">Cost of Goods Sold (COGS)</span>
              <span className="font-medium text-orange-600">
                - LKR {data.totalCOGS.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between p-3 border rounded-md bg-muted font-bold">
              <span className="font-medium">Gross Profit</span>
              <span className="font-medium">
                LKR {data.grossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between p-3 border rounded-md">
              <span className="font-medium">Operating Expenses</span>
              <span className="font-medium text-red-600">
                - LKR {data.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between p-4 border-2 rounded-md bg-muted font-bold text-lg">
              <span className="font-medium">NET PROFIT</span>
              <span className={data.netProfit > 0 ? "text-green-600" : "text-red-600"}>
                LKR {data.netProfit.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}