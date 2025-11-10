"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Package,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Low stock item interface
interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      setLoadingStock(true);
      const response = await fetch("/api/products?low_stock=true");
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const quickActions = [
    {
      title: "Create Bill",
      description: "Generate a new customer invoice",
      icon: FileText,
      href: "/bills/new",
      color: "bg-primary text-primary-foreground",
    },
    {
      title: "View Customers",
      description: "Manage customer information",
      icon: Users,
      href: "/customers",
      color: "bg-blue-500 text-white",
    },
    {
      title: "View Products",
      description: "Check inventory and products",
      icon: Package,
      href: "/products",
      color: "bg-green-500 text-white",
    },
    {
      title: "View Bills",
      description: "Browse all customer bills",
      icon: FileText,
      href: "/bills",
      color: "bg-purple-500 text-white",
    },
    {
      title: "Record Payment",
      description: "Add customer payment",
      icon: DollarSign,
      href: "/payments",
      color: "bg-yellow-500 text-white",
    },
    {
      title: "Due Invoices",
      description: "Check pending payments",
      icon: Calendar,
      href: "/due-invoices",
      color: "bg-red-500 text-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Quick access to your daily tasks.
        </p>
      </div>

      {/* Main Quick Action */}
      <Card
        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
        onClick={() => router.push("/bills/new")}
      >
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Create New Bill</h2>
              <p className="text-lg opacity-90">
                Generate a customer invoice quickly
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full h-16 w-16"
            >
              <Plus className="w-8 h-8" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.href}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Items that need reordering</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/products")}
            >
              View All Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStock ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                All items are well stocked
              </p>
            </div>
          ) : (
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
                        SKU: {item.sku} | Current: {item.stock_quantity}{" "}
                        {item.unit_of_measure} | Minimum: {item.reorder_level}{" "}
                        {item.unit_of_measure}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium text-destructive">
                        {Math.round(
                          (item.stock_quantity / item.reorder_level) * 100
                        )}
                        % Stock
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Need {item.reorder_level - item.stock_quantity} more
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/purchases")}
                    >
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
