// src/app/api/auth/profile/route.ts
// IMPROVED: Auto-creates profile if missing
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try to get user profile
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, role, created_at, updated_at")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it
    if (profileError && profileError.code === "PGRST116") {
      console.log("Profile not found, creating new profile for user:", user.id);

      // Get role from user metadata (fallback to 'sales')
      const userRole = user.user_metadata?.role?.toLowerCase() || "sales";

      // Map roles: 'Admin' -> 'admin', 'Staff' -> 'sales'
      let mappedRole = "sales";
      if (userRole === "admin") {
        mappedRole = "admin";
      } else if (userRole === "manager") {
        mappedRole = "manager";
      } else if (userRole === "warehouse") {
        mappedRole = "warehouse";
      }

      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.name || user.email || "User",
          role: mappedRole,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        return NextResponse.json(
          {
            error: "Failed to create user profile",
            details: createError.message,
          },
          { status: 500 }
        );
      }

      profile = newProfile;
    } else if (profileError) {
      // Other database error
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        {
          error: "Failed to fetch user profile",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in profile route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
