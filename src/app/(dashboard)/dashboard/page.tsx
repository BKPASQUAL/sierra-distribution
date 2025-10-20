'use client';

import React from 'react';
import { 
  DollarSign, 
  Users, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  Plus,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Mock data for charts
const salesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 5000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 4890 },
  { name: 'Sat', sales: 6390 },
  { name: 'Sun', sales: 3490 },
];

// Mock data for low stock alerts
const lowStockItems = [
  { id: 1, name: '2.5mm Single Core Wire', current: 15, minimum: 50, unit: 'rolls' },
  { id: 2, name: '4.0mm Multi-strand Cable', current: 8, minimum: 30, unit: 'rolls' },
  { id: 3, name: '1.5mm Flexible Wire', current: 22, minimum: 40, unit: 'rolls' },
  { id: 4, name: '6.0mm House Wire', current: 5, minimum: 20, unit: 'rolls' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Filter by Date
          </Button>
          <Button size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Create Bill</h3>
                <p className="text-sm opacity-90">Generate a new customer invoice</p>
              </div>
              <Button size="icon" variant="secondary" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Add Product</h3>
                <p className="text-sm text-muted-foreground">Add new wire to inventory</p>
              </div>
              <Button size="icon" variant="outline" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales (Today)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR 45,231.89</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">+20.1%</span>
              <span className="ml-1">from yesterday</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Sales This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales (Month)
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR 1,234,567</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">+15.3%</span>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500">+180</span>
              <span className="ml-1">new this month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Due Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Due Amount
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">LKR 234,890</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-red-500">23 overdue</span>
              <span className="ml-1">invoices</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Low Stock Section */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Sales Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Your sales performance for the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Value Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Total Stock Value</CardTitle>
            <CardDescription>
              Current inventory worth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Package className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold">LKR 3,456,789</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across 1,234 items
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={salesData.slice(0, 5)}>
                    <Bar 
                      dataKey="sales" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>
                Items that need reordering
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.current} {item.unit} | Minimum: {item.minimum} {item.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className="text-sm font-medium text-destructive">
                      {Math.round((item.current / item.minimum) * 100)}% Stock
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Need {item.minimum - item.current} more
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Reorder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}