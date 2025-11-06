// src/app/api/auth/login/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check user status in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("status, role, name")
      .eq("id", authData.user.id)
      .single();

    if (userError) {
      // If user doesn't exist in users table, sign them out
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "User account not found. Please contact an administrator." },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user is inactive
    if (userData.status === "Inactive") {
      // Sign out the user immediately
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact an administrator.",
        },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Successfully logged in and user is active
    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name,
          role: userData.role,
          status: userData.status,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
