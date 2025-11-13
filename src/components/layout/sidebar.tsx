// src/components/layout/sidebar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  ShoppingCart,
  Truck,
  AlertCircle,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Define navigation items with optional role restrictions
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Products", href: "/products", icon: Package },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Bills", href: "/bills", icon: FileText },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Payments", href: "/payments", icon: DollarSign },
  { name: "Bank Accounts", href: "/bank-accounts", icon: Wallet },
  { name: "Due Invoices", href: "/due-invoices", icon: AlertCircle },
  {
    name: "Reports",
    href: "/reports",
    icon: TrendingUp,
    adminOnly: true, // Only show to admins
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: true, // Only show to admins
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Get current user and their role
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Get role from user metadata
        const role = user.user_metadata?.role;
        setUserRole(role);

        // If no role in metadata, fetch from users table
        if (!role) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (userData) {
            setUserRole(userData.role);
          }
        }
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Sign out from Supabase client
        await supabase.auth.signOut();

        // Redirect to login
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => {
    // If item requires admin access and user is not admin, hide it
    if (item.adminOnly && userRole !== "Admin") {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Package className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">Sierra Distribution</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-medium">
              {user?.user_metadata?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
