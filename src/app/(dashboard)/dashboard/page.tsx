"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminDashboard from "@/components/dashboard/Admindashboard";
import StaffDashboard from "@/components/dashboard/Staffdashboard";
// import AdminDashboard from "@/components/dashboard/AdminDashboard";
// import StaffDashboard from "@/components/dashboard/StaffDashboard";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"Admin" | "Staff" | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error getting user:", error);
        setIsLoading(false);
        return;
      }

      // First, try to get role from user metadata
      let role = user.user_metadata?.role;

      // If no role in metadata, fetch from users table
      if (!role) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData && !userError) {
          role = userData.role;
        }
      }

      setUserRole(role || "Staff"); // Default to Staff if no role found
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole("Staff"); // Default to Staff on error
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  return <>{userRole === "Admin" ? <AdminDashboard /> : <StaffDashboard />}</>;
}
