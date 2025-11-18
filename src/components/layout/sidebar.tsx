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
  Landmark,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Define navigation structure
export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Define organized navigation items
const navigation: NavGroup[] = [
  {
    title: "Main",
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Customers Bills", href: "/bills", icon: FileText },
      { name: "Customers Payments", href: "/payments", icon: DollarSign },
      { name: "Due Invoices", href: "/due-invoices", icon: AlertCircle },
    ],
  },
  {
    title: "Purchases",
    items: [
      { name: "Suppliers", href: "/suppliers", icon: Truck },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart },
      {
        name: "Supplier Payments",
        href: "/supplier-payments",
        icon: TrendingDown,
      },
    ],
  },
  {
    title: "Inventory",
    items: [{ name: "Products", href: "/products", icon: Package }],
  },
  {
    title: "Finance",
    items: [
      { name: "Expenses", href: "/expenses", icon: Receipt },
      { name: "Cheque Management", href: "/cheques", icon: Landmark },
      { name: "Accounts", href: "/accounts", icon: Landmark, adminOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Reports", href: "/reports", icon: TrendingUp, adminOnly: true },
      { name: "Settings", href: "/settings", icon: Settings, adminOnly: true },
    ],
  },
];

/**
 * Renders the grouped navigation items.
 */
function SidebarNav({
  groups,
  pathname,
  userRole,
}: {
  groups: NavGroup[];
  pathname: string;
  userRole: string | null;
}) {
  return (
    <nav className="flex-1 space-y-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {groups.map((group) => {
        // Filter items in this group based on user role
        const filteredItems = group.items.filter(
          (item) => !item.adminOnly || userRole === "Admin"
        );

        // If all items in the group are hidden, don't render the group
        if (filteredItems.length === 0) {
          return null;
        }

        return (
          <div key={group.title} className="">
            {/* Don't show "Main" title */}
            {group.title !== "Main" && (
              <h3 className="px-3 pt-2 pb-1 text-xs text-black font-bold uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            {filteredItems.map((item) => {
              // Check if the item is active
              const isDashboard = item.href === "/dashboard";
              const isActive = isDashboard
                ? pathname === item.href
                : pathname.startsWith(item.href);

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
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

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

  return (
    <div className="flex h-screen w-full md:w-64 flex-col border-r bg-card">
      {/* Logo (Fixed Top) */}
      <div className="flex h-14 md:h-16 items-center border-b px-4 md:px-6 flex-shrink-0">
        <Package className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
        <span className="ml-2 text-base md:text-lg font-semibold truncate">
          Sierra Distribution
        </span>
      </div>

      {/* Navigation (Scrollable Middle) */}
      <SidebarNav groups={navigation} pathname={pathname} userRole={userRole} />

      {/* User Profile & Logout (Fixed Bottom) */}
      <div className="border-t p-3 md:p-4 flex-shrink-0 bg-card">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
            <span className="text-xs md:text-sm font-medium">
              {user?.user_metadata?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-xs md:text-sm font-medium truncate">
              {user?.user_metadata?.name || "User"}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs md:text-sm h-8 md:h-9"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
