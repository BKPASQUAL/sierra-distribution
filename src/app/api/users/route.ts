// src/app/api/users/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET all users
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while fetching users" },
      { status: 500 },
    );
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Used for checking current user permissions if needed
    const supabaseAdmin = createAdminClient(); // Used for Admin API calls
    const body = await request.json();

    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    // Validate Username uniqueness if provided
    if (body.username) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", body.username)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        );
      }
    }

    // Step 1: Create auth user using admin client
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          name: body.name,
          role: body.role || "Staff",
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Step 2: Create user in users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email: body.email,
          name: body.name,
          username: body.username || null, // Add username here
          role: body.role || "Staff",
          status: body.status || "Active",
        },
      ])
      .select()
      .single();

    if (userError) {
      // Rollback: delete the auth user if users table insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error while creating user" },
      { status: 500 },
    );
  }
}
