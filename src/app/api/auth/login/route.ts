// src/app/api/auth/login/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Ensure this import exists
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    // Accept 'identifier' which can be email or username
    const { email: legacyEmail, identifier, password } = await request.json();

    // Normalize input
    let emailToUse = identifier || legacyEmail;

    if (!emailToUse || !password) {
      return NextResponse.json(
        { error: "Email/Username and password are required" },
        { status: 400 },
      );
    }

    // Determine if input is email or username
    const isEmail = emailToUse.includes("@");

    if (!isEmail) {
      // It's a username. We need to find the email associated with it.
      // We use createAdminClient because the 'users' table might have RLS policies
      // preventing unauthenticated reads.
      const supabaseAdmin = createAdminClient();

      const { data: userRecord, error: lookupError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("username", emailToUse)
        .single();

      if (lookupError || !userRecord) {
        // Return generic error to avoid enumerating usernames
        return NextResponse.json(
          { error: "Invalid login credentials" },
          { status: 401 },
        );
      }

      emailToUse = userRecord.email;
    }

    // Attempt to sign in with Supabase Auth using the resolved email
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    // Check user status in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("status, role, name, username")
      .eq("id", authData.user.id)
      .single();

    if (userError) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "User account not found." },
        { status: 403 },
      );
    }

    if (userData.status === "Inactive") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Your account has been deactivated." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          status: userData.status,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 },
    );
  }
}
